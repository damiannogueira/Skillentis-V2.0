import { createClient } from 'npm:@supabase/supabase-js@2';
import { verifyWebhook, EventName, type PaddleEnv } from '../_shared/paddle.ts';

let _supabase: ReturnType<typeof createClient> | null = null;
function getSupabase() {
  if (!_supabase) {
    _supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );
  }
  return _supabase;
}

// Map Paddle product external_id -> app role
function productToRole(productId: string): 'pro' | 'pro_recruiter' | null {
  if (productId === 'pro_plan') return 'pro';
  if (productId === 'pro_recruiter_plan') return 'pro_recruiter';
  return null;
}

async function syncRole(userId: string, role: 'pro' | 'pro_recruiter' | 'free') {
  // Replace user's roles atomically
  const sb = getSupabase();
  await sb.from('user_roles').delete().eq('user_id', userId);
  await sb.from('user_roles').insert({ user_id: userId, role });
}

async function handleSubscriptionCreated(data: any, env: PaddleEnv) {
  const { id, customerId, items, status, currentBillingPeriod, customData } = data;
  const userId = customData?.userId;
  if (!userId) {
    console.error('No userId in customData');
    return;
  }
  const item = items[0];
  const priceId = item.price.importMeta?.externalId;
  const productId = item.product.importMeta?.externalId;
  if (!priceId || !productId) {
    console.warn('Skipping subscription: missing importMeta.externalId', {
      rawPriceId: item.price.id,
      rawProductId: item.product.id,
    });
    return;
  }
  await getSupabase().from('subscriptions').upsert({
    user_id: userId,
    paddle_subscription_id: id,
    paddle_customer_id: customerId,
    product_id: productId,
    price_id: priceId,
    status,
    current_period_start: currentBillingPeriod?.startsAt,
    current_period_end: currentBillingPeriod?.endsAt,
    environment: env,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'paddle_subscription_id' });

  // Grant role only on live, or on sandbox so previews work
  const role = productToRole(productId);
  if (role && (status === 'active' || status === 'trialing')) {
    await syncRole(userId, role);
  }
}

async function handleSubscriptionUpdated(data: any, env: PaddleEnv) {
  const { id, status, currentBillingPeriod, scheduledChange, items, customData } = data;
  await getSupabase().from('subscriptions')
    .update({
      status,
      current_period_start: currentBillingPeriod?.startsAt,
      current_period_end: currentBillingPeriod?.endsAt,
      cancel_at_period_end: scheduledChange?.action === 'cancel',
      updated_at: new Date().toISOString(),
    })
    .eq('paddle_subscription_id', id)
    .eq('environment', env);

  // Adjust role if plan changed
  const userId = customData?.userId;
  const productId = items?.[0]?.product?.importMeta?.externalId;
  if (userId && productId) {
    const role = productToRole(productId);
    if (role && (status === 'active' || status === 'trialing')) {
      await syncRole(userId, role);
    } else if (status === 'canceled' || status === 'paused') {
      // Keep role until period end — do nothing here
    }
  }
}

async function handleSubscriptionCanceled(data: any, env: PaddleEnv) {
  const { id, currentBillingPeriod, customData } = data;
  await getSupabase().from('subscriptions')
    .update({
      status: 'canceled',
      current_period_end: currentBillingPeriod?.endsAt,
      updated_at: new Date().toISOString(),
    })
    .eq('paddle_subscription_id', id)
    .eq('environment', env);

  // If period already ended, downgrade to free immediately
  const userId = customData?.userId;
  const periodEnd = currentBillingPeriod?.endsAt ? new Date(currentBillingPeriod.endsAt) : null;
  if (userId && (!periodEnd || periodEnd <= new Date())) {
    await syncRole(userId, 'free');
  }
}

async function handleWebhook(req: Request, env: PaddleEnv) {
  const event = await verifyWebhook(req, env);
  console.log('Paddle event:', event.eventType);
  switch (event.eventType) {
    case EventName.SubscriptionCreated:
      await handleSubscriptionCreated(event.data, env);
      break;
    case EventName.SubscriptionUpdated:
      await handleSubscriptionUpdated(event.data, env);
      break;
    case EventName.SubscriptionCanceled:
      await handleSubscriptionCanceled(event.data, env);
      break;
    default:
      console.log('Unhandled event:', event.eventType);
  }
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }
  const url = new URL(req.url);
  const env = (url.searchParams.get('env') || 'sandbox') as PaddleEnv;
  try {
    await handleWebhook(req, env);
    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('Webhook error:', e);
    return new Response('Webhook error', { status: 400 });
  }
});

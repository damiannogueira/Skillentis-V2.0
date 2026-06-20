import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { getPaddleEnvironment } from "@/lib/paddle";

export interface Subscription {
  paddle_subscription_id: string;
  paddle_customer_id: string;
  product_id: string;
  price_id: string;
  status: string;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  environment: string;
}

export function useSubscription() {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchIt = async () => {
    if (!user) {
      setSubscription(null);
      setLoading(false);
      return;
    }
    const { data } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", user.id)
      .eq("environment", getPaddleEnvironment())
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    setSubscription((data as Subscription | null) ?? null);
    setLoading(false);
  };

  useEffect(() => {
    fetchIt();
    if (!user) return;
    const channel = supabase
      .channel(`subs-${user.id}`)
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "subscriptions",
        filter: `user_id=eq.${user.id}`,
      }, () => fetchIt())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const isActive = !!subscription && (
    (["active", "trialing", "past_due"].includes(subscription.status) &&
      (!subscription.current_period_end || new Date(subscription.current_period_end) > new Date())) ||
    (subscription.status === "canceled" && !!subscription.current_period_end &&
      new Date(subscription.current_period_end) > new Date())
  );

  return { subscription, loading, isActive, refresh: fetchIt };
}

// Supabase edge function URL builder for OG images
const SUPABASE_PROJECT_ID = import.meta.env.VITE_SUPABASE_PROJECT_ID || "psaknkusyyztbethafov";

export function getOGImageUrl(username: string): string {
  return `https://${SUPABASE_PROJECT_ID}.supabase.co/functions/v1/og-image?username=${encodeURIComponent(username)}&format=svg`;
}

export function getOGPageUrl(username: string): string {
  return `https://${SUPABASE_PROJECT_ID}.supabase.co/functions/v1/og-image?username=${encodeURIComponent(username)}&format=html`;
}

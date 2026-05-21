import { createClient } from "@supabase/supabase-js";

/**
 * Admin Supabase client. Uses the service role key, which bypasses RLS.
 * ONLY use server-side. Never expose this client to the browser.
 *
 * Use cases: scheduled jobs / cron handlers, automated maintenance.
 */
export function createAdminSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url) throw new Error("NEXT_PUBLIC_SUPABASE_URL not set");
  if (!key) throw new Error("SUPABASE_SERVICE_ROLE_KEY not set");
  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

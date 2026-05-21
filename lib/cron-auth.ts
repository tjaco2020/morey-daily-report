import type { NextRequest } from "next/server";

/**
 * Verifies a request came from Vercel Cron (or a manual test with the
 * CRON_SECRET). Vercel automatically adds `Authorization: Bearer <secret>`
 * to cron-triggered requests.
 */
export function isAuthorizedCron(request: NextRequest): boolean {
  const expected = process.env.CRON_SECRET;
  if (!expected) return false;
  const auth = request.headers.get("authorization");
  if (!auth) return false;
  return auth === `Bearer ${expected}`;
}

/**
 * Reads the automation_enabled setting from app_settings.
 * Defaults to `true` if the row is missing.
 */
export async function isAutomationEnabled(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
): Promise<boolean> {
  const { data } = await supabase
    .from("app_settings")
    .select("value")
    .eq("key", "automation_enabled")
    .maybeSingle();
  if (!data) return true;
  const v = data.value;
  if (typeof v === "boolean") return v;
  if (typeof v === "string") return v === "true";
  return Boolean(v);
}

/**
 * Returns the current local date in America/New_York (YYYY-MM-DD).
 */
export function nowEasternDate(): string {
  return new Date().toLocaleDateString("en-CA", {
    timeZone: "America/New_York",
  });
}

/**
 * Returns yesterday's date in America/New_York (YYYY-MM-DD).
 */
export function yesterdayEasternDate(): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toLocaleDateString("en-CA", { timeZone: "America/New_York" });
}

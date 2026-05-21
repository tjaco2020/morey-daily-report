import { createServerSupabase } from "@/lib/supabase/server";
import { requireRole } from "@/lib/roles";
import Link from "next/link";
import { WeeklyRecapClient } from "./WeeklyRecapClient";

export const dynamic = "force-dynamic";

export default async function WeeklyRecapAdminPage() {
  await requireRole("manager");
  const supabase = createServerSupabase();

  const [{ data: setting }, { data: recaps }] = await Promise.all([
    supabase
      .from("app_settings")
      .select("value, updated_at")
      .eq("key", "weekly_recap_enabled")
      .maybeSingle(),
    supabase
      .from("weekly_recaps")
      .select(
        "id, week_start, week_end, ai_summary, total_reports, sent_at, error_message",
      )
      .order("week_start", { ascending: false })
      .limit(10),
  ]);

  let enabled = true;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const raw = (setting as any)?.value;
  if (typeof raw === "boolean") enabled = raw;
  else if (typeof raw === "string") enabled = raw === "true";

  return (
    <main className="px-4 sm:px-6 py-8 sm:py-10">
      <div className="max-w-3xl mx-auto">
        <Link
          href="/admin"
          className="text-sm text-morey-ocean hover:text-morey-deep transition"
        >
          ← Admin
        </Link>
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-morey-deep mt-2">
          Weekly Recap
        </h1>
        <p className="text-sm text-morey-mid mt-1 mb-6">
          Automated weekly executive summary. Runs every Monday at 9 AM ET and
          emails the same recipient list as the Daily Report.
        </p>
        <WeeklyRecapClient
          initialEnabled={enabled}
          recentRecaps={(recaps ?? []).map((r) => ({
            id: r.id,
            week_start: r.week_start,
            week_end: r.week_end,
            ai_summary: r.ai_summary ?? "",
            total_reports: r.total_reports ?? 0,
            sent_at: r.sent_at,
            error_message: r.error_message,
          }))}
        />
      </div>
    </main>
  );
}

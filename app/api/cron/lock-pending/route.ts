import { NextResponse, type NextRequest } from "next/server";
import { createAdminSupabase } from "@/lib/supabase/admin";
import {
  isAuthorizedCron,
  isAutomationEnabled,
  nowEasternDate,
} from "@/lib/cron-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Locks any reports still in 'pending' status whose report_date is before
 * today (in America/New_York). Runs nightly. Idempotent — safe to re-run.
 */
export async function GET(request: NextRequest) {
  return handle(request);
}
export async function POST(request: NextRequest) {
  return handle(request);
}

async function handle(request: NextRequest) {
  if (!isAuthorizedCron(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const supabase = createAdminSupabase();
  const enabled = await isAutomationEnabled(supabase);
  if (!enabled) {
    return NextResponse.json({
      ok: true,
      skipped: true,
      reason: "automation disabled",
    });
  }

  const today = nowEasternDate();
  const nowIso = new Date().toISOString();

  // Lock all pending reports from before today.
  const { data: locked, error } = await supabase
    .from("reports")
    .update({ status: "locked", locked_at: nowIso })
    .eq("status", "pending")
    .lt("report_date", today)
    .select("id, case_number, report_date, user_id");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Audit log entry summarizing the run.
  await supabase.from("audit_log").insert({
    action: "cron.lock_pending",
    entity_type: "reports",
    entity_id: null,
    meta: {
      count: locked?.length ?? 0,
      run_date: today,
    },
  });

  return NextResponse.json({
    ok: true,
    locked_count: locked?.length ?? 0,
    run_date: today,
  });
}

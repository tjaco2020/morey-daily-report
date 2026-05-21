import { createServerSupabase } from "@/lib/supabase/server";
import { NextResponse, type NextRequest } from "next/server";
import { fetchDailyMetrics } from "@/lib/snowflake";

export const runtime = "nodejs";

export async function POST(
  _request: NextRequest,
  { params }: { params: { date: string } },
) {
  const supabase = createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (!profile || (profile.role !== "supervisor" && profile.role !== "manager")) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const { data: dr, error: drErr } = await supabase
    .rpc("get_or_create_daily_report", { p_date: params.date })
    .single();
  if (drErr || !dr) {
    return NextResponse.json(
      { error: drErr?.message ?? "Could not load daily report." },
      { status: 500 },
    );
  }

  let snapshot;
  try {
    snapshot = await fetchDailyMetrics(params.date);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Metrics fetch failed." },
      { status: 502 },
    );
  }

  const { error: updErr } = await supabase
    .from("daily_reports")
    .update({ metrics_snapshot: snapshot })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .eq("id", (dr as any).id);
  if (updErr) {
    return NextResponse.json({ error: updErr.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, snapshot });
}

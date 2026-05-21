import { createServerSupabase } from "@/lib/supabase/server";
import { NextResponse, type NextRequest } from "next/server";
import { generateDailySummary } from "@/lib/ai";
import { loadDailyReportData } from "@/lib/pdf/data";

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

  const data = await loadDailyReportData(params.date);
  if (!data) {
    return NextResponse.json(
      { error: "No daily report exists for this date yet." },
      { status: 404 },
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const weather = data.weather as any;
  const w = weather && typeof weather === "object"
    ? {
        conditions: weather.conditions ?? "",
        high_f: weather.high_f ?? null,
        low_f: weather.low_f ?? null,
        precipitation_in: weather.precipitation_in ?? null,
      }
    : null;

  let summary;
  try {
    summary = await generateDailySummary({
      date: params.date,
      reports: data.reports.map((r) => ({
        category: r.category,
        terminal: r.terminal,
        user: r.user,
        text: r.text,
        case_number: r.case_number,
      })),
      weather: w,
    });
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : "AI summary generation failed.",
      },
      { status: 502 },
    );
  }

  // Save to daily_reports
  const { data: dr } = await supabase
    .from("daily_reports")
    .select("id")
    .eq("report_date", params.date)
    .single();
  if (dr) {
    await supabase
      .from("daily_reports")
      .update({ ai_summary: summary })
      .eq("id", dr.id);
  }

  return NextResponse.json({ ok: true, summary });
}

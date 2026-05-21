import { createServerSupabase } from "@/lib/supabase/server";
import type { DailyReportData, IncludedReport } from "./DailyReport";

/**
 * Loads the data needed to render a daily report PDF for a given date.
 * When the daily_report has been sent and a report_snapshot exists, we use
 * that frozen snapshot (so historical PDFs don't change if underlying
 * reports get edited later). Otherwise we read live data.
 *
 * Returns null if no daily_report exists for the date.
 */
export async function loadDailyReportData(
  date: string,
): Promise<DailyReportData | null> {
  const supabase = createServerSupabase();

  const { data: dr } = await supabase
    .from("daily_reports")
    .select(
      "id, status, ai_summary, supervisor_notes, weather_snapshot, metrics_snapshot, report_snapshot",
    )
    .eq("report_date", date)
    .maybeSingle();

  if (!dr) return null;

  let reports: IncludedReport[] = [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const snap = (dr as any).report_snapshot as
    | { reports?: IncludedReport[] }
    | null;

  if (dr.status === "sent" && snap?.reports) {
    reports = snap.reports;
  } else {
    const { data: items } = await supabase
      .from("daily_report_items")
      .select(
        `report_id,
         reports (
           case_number, submitted_at, text,
           categories(name), terminals(name),
           profiles!reports_user_id_fkey(full_name, email)
         )`,
      )
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .eq("daily_report_id", (dr as any).id);

    reports = (items ?? []).map((row) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const r = (row as any).reports;
      return {
        case_number: r?.case_number ?? "",
        submitted_at: r?.submitted_at ?? null,
        text: r?.text ?? "",
        category: r?.categories?.name ?? "Other",
        terminal: r?.terminals?.name ?? "—",
        user: r?.profiles?.full_name ?? r?.profiles?.email ?? "—",
      };
    });
  }

  return {
    date,
    status: dr.status,
    weather: dr.weather_snapshot,
    metrics: dr.metrics_snapshot,
    ai_summary: dr.ai_summary,
    supervisor_notes: dr.supervisor_notes,
    reports,
  };
}

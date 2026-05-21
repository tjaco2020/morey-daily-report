import { createServerSupabase } from "@/lib/supabase/server";
import { requireRole } from "@/lib/roles";
import { formatDate } from "@/lib/format";
import Link from "next/link";
import { BuilderClient } from "./BuilderClient";

export const dynamic = "force-dynamic";

export default async function BuildPage({
  params,
}: {
  params: { date: string };
}) {
  await requireRole("supervisor");
  const supabase = createServerSupabase();
  const date = params.date;

  // Lazily create / fetch the daily_report draft row for this date.
  const { data: dailyReport, error: drError } = await supabase
    .rpc("get_or_create_daily_report", { p_date: date })
    .single();

  // Pending + submitted + included reports for the date.
  // Supervisor can include any of these in the daily report.
  // Pending = left by an associate who hasn't submitted yet (or clocked out).
  const [{ data: reports }, { data: locations }] = await Promise.all([
    supabase
      .from("reports")
      .select(
        `id, case_number, status, text, submitted_at, created_at, terminal_location_id,
         categories(name), terminals(name),
         profiles!reports_user_id_fkey(full_name, email)`,
      )
      .eq("report_date", date)
      .in("status", ["pending", "submitted", "included"])
      .order("created_at", { ascending: true }),
    supabase
      .from("locations")
      .select("id, name, display_order")
      .eq("active", true)
      .order("display_order"),
  ]);

  // Which reports are currently included?
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const drId: string | undefined = (dailyReport as any)?.id;
  const { data: items } = drId
    ? await supabase
        .from("daily_report_items")
        .select("report_id, override_text, display_position")
        .eq("daily_report_id", drId)
    : { data: [] };

  const includedIds = new Set((items ?? []).map((i) => i.report_id));

  return (
    <main className="px-4 sm:px-6 py-8 sm:py-10">
      <div className="max-w-5xl mx-auto">
        <header className="flex flex-wrap items-end justify-between gap-3 mb-6">
          <div>
            <Link
              href={`/supervisor?date=${date}`}
              className="text-xs text-morey-ocean hover:text-morey-deep transition"
            >
              ← Supervisor
            </Link>
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-morey-deep mt-1">
              Daily Report Builder
            </h1>
            <p className="text-sm text-morey-mid mt-1">{formatDate(date)}</p>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`text-[10px] uppercase tracking-wider font-medium px-2.5 py-1 rounded-md ${
                /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
                (dailyReport as any)?.status === "sent"
                  ? "bg-green-50 text-green-800 border border-green-200"
                  : "bg-amber-50 text-amber-900 border border-amber-200"
              }`}
            >
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {(dailyReport as any)?.status ?? "draft"}
            </span>
          </div>
        </header>

        {drError && (
          <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded p-3 mb-4">
            {drError.message}
          </p>
        )}

        {dailyReport && (
          <BuilderClient
            dailyReport={{
              id: drId!,
              report_date: date,
              status:
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (dailyReport as any).status,
              supervisor_notes:
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (dailyReport as any).supervisor_notes ?? "",
              ai_summary:
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (dailyReport as any).ai_summary ?? "",
              weather_snapshot:
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (dailyReport as any).weather_snapshot ?? null,
              metrics_snapshot:
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (dailyReport as any).metrics_snapshot ?? null,
            }}
            reports={(reports ?? []).map((r) => ({
              id: r.id,
              case_number: r.case_number,
              text: r.text,
              status: r.status,
              created_at: r.created_at,
              submitted_at: r.submitted_at,
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              category: (r as any).categories?.name ?? "—",
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              terminal: (r as any).terminals?.name ?? "—",
              user:
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (r as any).profiles?.full_name ??
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (r as any).profiles?.email ??
                "—",
              included: includedIds.has(r.id),
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              terminal_location_id: (r as any).terminal_location_id ?? null,
            }))}
            locations={(locations ?? []).map((l) => ({
              id: l.id,
              name: l.name,
            }))}
          />
        )}
      </div>
    </main>
  );
}

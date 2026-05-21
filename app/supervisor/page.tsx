import { createServerSupabase } from "@/lib/supabase/server";
import { requireRole } from "@/lib/roles";
import {
  todayLocal,
  formatDate,
  formatTime,
  statusLabel,
  statusClasses,
} from "@/lib/format";
import Link from "next/link";
import { SupervisorFilters } from "./SupervisorFilters";
import { Download, Search, FileText, ChevronRight } from "lucide-react";
import { EmptyState } from "@/components/EmptyState";
import { DeleteReportButton } from "@/components/DeleteReportButton";
import { ShareButton } from "@/components/ShareButton";

export const dynamic = "force-dynamic";

type SP = Record<string, string | undefined>;

export default async function SupervisorDashboard({
  searchParams,
}: {
  searchParams: SP;
}) {
  await requireRole("supervisor");
  const supabase = createServerSupabase();

  const date = searchParams.date || todayLocal();
  const status = searchParams.status || "";
  const categoryId = searchParams.category || "";
  const terminalId = searchParams.terminal || "";
  const locationId = searchParams.location || "";
  const userId = searchParams.user || "";
  const keyword = (searchParams.q || "").trim();

  const [
    { data: categories },
    { data: terminals },
    { data: locations },
    { data: users },
  ] = await Promise.all([
    supabase
      .from("categories")
      .select("id, name")
      .eq("active", true)
      .order("display_order"),
    supabase
      .from("terminals")
      .select("id, name")
      .eq("active", true)
      .order("name"),
    supabase
      .from("locations")
      .select("id, name, display_order")
      .eq("active", true)
      .order("display_order"),
    supabase
      .from("profiles")
      .select("id, full_name, email")
      .eq("active", true)
      .order("full_name"),
  ]);

  let q = supabase
    .from("reports")
    .select(
      `id, case_number, status, text, submitted_at, created_at, report_date,
       user_id, category_id, terminal_id,
       categories(name), terminals(name),
       profiles!reports_user_id_fkey(full_name, email)`,
    )
    .eq("report_date", date)
    .order("created_at", { ascending: false });

  if (status) q = q.eq("status", status);
  if (categoryId) q = q.eq("category_id", categoryId);
  if (terminalId) q = q.eq("terminal_id", terminalId);
  if (locationId) q = q.eq("terminal_location_id", locationId);
  if (userId) q = q.eq("user_id", userId);
  if (keyword) {
    const safe = keyword.replace(/[%_]/g, "");
    q = q.or(`text.ilike.%${safe}%,case_number.ilike.%${safe}%`);
  }

  const { data: reports, error } = await q;

  const counts: Record<string, number> = {
    total: reports?.length ?? 0,
    pending: 0,
    submitted: 0,
    included: 0,
    locked: 0,
    archived: 0,
  };
  (reports ?? []).forEach((r) => {
    counts[r.status] = (counts[r.status] ?? 0) + 1;
  });

  const exportParams = new URLSearchParams();
  exportParams.set("date", date);
  if (status) exportParams.set("status", status);
  if (categoryId) exportParams.set("category", categoryId);
  if (terminalId) exportParams.set("terminal", terminalId);
  if (locationId) exportParams.set("location", locationId);
  if (userId) exportParams.set("user", userId);
  if (keyword) exportParams.set("q", keyword);
  const exportHref = `/api/supervisor/export?${exportParams.toString()}`;

  return (
    <main className="px-4 sm:px-6 py-8 sm:py-10">
      <div className="max-w-7xl mx-auto">
        <header className="flex flex-wrap items-end justify-between gap-3 mb-6">
          <div>
            <p className="text-sm text-morey-mid">{formatDate(date)}</p>
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-morey-deep mt-1">
              Supervisor
            </h1>
            <p className="text-sm text-morey-mid mt-1">
              Review every report, then curate the Daily Report.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href={`/supervisor/build/${date}`}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-soft bg-morey-yellow text-morey-deep text-sm font-semibold hover:bg-morey-yellowDark transition shadow-sm"
            >
              Build Daily Report
              <ChevronRight className="w-4 h-4" />
            </Link>
            <a
              href={exportHref}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-soft bg-white border border-slate-200 text-sm text-morey-deep hover:bg-slate-50 transition"
            >
              <Download className="w-3.5 h-3.5" />
              Export CSV
            </a>
          </div>
        </header>

        <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-5">
          <StatTile label="Total" value={counts.total} tone="default" />
          <StatTile label="Pending" value={counts.pending} tone="pending" />
          <StatTile label="Submitted" value={counts.submitted} tone="submitted" />
          <StatTile label="Included" value={counts.included} tone="included" />
          <StatTile label="Locked" value={counts.locked} tone="locked" />
          <StatTile label="Archived" value={counts.archived} tone="archived" />
        </section>

        <section className="bg-white rounded-bubble shadow-card border border-slate-100/80 p-4 mb-5">
          <SupervisorFilters
            initial={{
              date,
              status,
              category: categoryId,
              terminal: terminalId,
              location: locationId,
              user: userId,
              q: keyword,
            }}
            categories={(categories ?? []).map((c) => ({
              id: c.id,
              name: c.name,
            }))}
            terminals={(terminals ?? []).map((t) => ({
              id: t.id,
              name: t.name,
            }))}
            locations={(locations ?? []).map((l) => ({
              id: l.id,
              name: l.name,
            }))}
            users={(users ?? []).map((u) => ({
              id: u.id,
              name: u.full_name ?? u.email,
            }))}
          />
        </section>

        <section className="bg-white rounded-bubble shadow-card border border-slate-100/80 overflow-hidden">
          {error && (
            <p className="text-sm text-red-700 bg-red-50 p-3">{error.message}</p>
          )}
          {(!reports || reports.length === 0) && !error && (
            <EmptyState
              icon={Search}
              title="No reports match these filters"
              description="Try a different date, clear filters, or check the keyword."
            />
          )}
          {reports && reports.length > 0 && (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50/70 text-morey-mid uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium">Time</th>
                    <th className="text-left px-4 py-3 font-medium">User</th>
                    <th className="text-left px-4 py-3 font-medium">Category</th>
                    <th className="text-left px-4 py-3 font-medium">Terminal</th>
                    <th className="text-left px-4 py-3 font-medium">Status</th>
                    <th className="text-left px-4 py-3 font-medium">Report</th>
                    <th className="text-left px-4 py-3 font-medium">Case #</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {reports.map((r) => (
                    <tr
                      key={r.id}
                      className="hover:bg-slate-50/50 transition"
                    >
                      <td className="px-4 py-3 text-morey-deep whitespace-nowrap tabular-nums">
                        {formatTime(r.submitted_at ?? r.created_at)}
                      </td>
                      <td className="px-4 py-3 text-morey-deep whitespace-nowrap">
                        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                        {(r as any).profiles?.full_name ??
                          /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
                          (r as any).profiles?.email ??
                          "—"}
                      </td>
                      <td className="px-4 py-3 text-morey-mid whitespace-nowrap">
                        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                        {(r as any).categories?.name ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-morey-mid whitespace-nowrap">
                        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                        {(r as any).terminals?.name ?? "—"}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span
                          className={`text-[10px] uppercase tracking-wider font-medium px-2 py-0.5 rounded-md ${statusClasses(r.status)}`}
                        >
                          {statusLabel(r.status)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-morey-deep max-w-md">
                        <div className="line-clamp-2 break-words">{r.text}</div>
                      </td>
                      <td className="px-4 py-3 font-mono text-[10px] text-slate-400 whitespace-nowrap">
                        {r.case_number}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <Link
                            href={`/reports/${r.id}`}
                            className="inline-flex items-center gap-1 text-morey-ocean hover:text-morey-deep text-sm transition"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            Open
                          </Link>
                          <ShareButton
                            reportId={r.id}
                            caseNumber={r.case_number}
                            variant="icon"
                          />
                          <DeleteReportButton
                            reportId={r.id}
                            caseNumber={r.case_number}
                            variant="icon"
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function StatTile({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "default" | "pending" | "submitted" | "included" | "locked" | "archived";
}) {
  const toneClasses: Record<string, string> = {
    default:   "bg-white",
    pending:   "bg-amber-50/70",
    submitted: "bg-sky-50/70",
    included:  "bg-green-50/70",
    locked:    "bg-slate-100",
    archived:  "bg-slate-50/70",
  };
  return (
    <div
      className={`rounded-bubble shadow-card border border-slate-100/80 p-3.5 ${toneClasses[tone]}`}
    >
      <div className="text-[10px] uppercase tracking-wider text-morey-mid font-medium">
        {label}
      </div>
      <div className="text-2xl font-semibold text-morey-deep mt-0.5 tabular-nums">
        {value}
      </div>
    </div>
  );
}

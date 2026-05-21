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
import {
  Download,
  Search,
  FileText,
  ChevronRight,
  History,
  CheckCircle2,
  FileEdit,
  Sunset,
  MapPin,
} from "lucide-react";
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
  const departmentId = searchParams.department || "";
  const outletId = searchParams.outlet || "";
  const userId = searchParams.user || "";
  const keyword = (searchParams.q || "").trim();

  const [
    { data: categories },
    { data: terminals },
    { data: locations },
    { data: departments },
    { data: outlets },
    { data: users },
    { data: dailyReport },
    { data: recaps },
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
      .from("departments")
      .select("id, name, display_order")
      .eq("active", true)
      .order("display_order"),
    supabase
      .from("outlets")
      .select("id, name, department_id, display_order")
      .eq("active", true)
      .order("display_order"),
    supabase
      .from("profiles")
      .select("id, full_name, email")
      .eq("active", true)
      .order("full_name"),
    supabase
      .from("daily_reports")
      .select("id, status, sent_at, email_recipients, ai_summary")
      .eq("report_date", date)
      .maybeSingle(),
    supabase
      .from("shift_recaps")
      .select(
        `id, recap_text, open_drafts_count, pending_review_count, created_at,
         profiles!shift_recaps_user_id_fkey(full_name, email, role),
         terminals(name)`,
      )
      .eq("recap_date", date)
      .order("created_at", { ascending: false }),
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
  if (outletId) q = q.eq("outlet_id", outletId);
  if (departmentId) {
    // Filter by all outlets in the department (department -> outlets -> reports)
    const inDept = (outlets ?? [])
      .filter((o) => o.department_id === departmentId)
      .map((o) => o.id);
    if (inDept.length > 0) {
      q = q.in("outlet_id", inDept);
    } else {
      // No outlets in this department → no matches
      q = q.eq("outlet_id", "00000000-0000-0000-0000-000000000000");
    }
  }
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
  if (departmentId) exportParams.set("department", departmentId);
  if (outletId) exportParams.set("outlet", outletId);
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
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-soft bg-beacon-navy text-white text-sm font-semibold hover:bg-beacon-charcoal transition shadow-sm"
            >
              Build Daily Report
              <ChevronRight className="w-4 h-4" />
            </Link>
            <Link
              href="/supervisor/history"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-soft bg-white border border-slate-200 text-sm text-morey-deep hover:bg-slate-50 transition"
            >
              <History className="w-3.5 h-3.5" />
              Daily Report history
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

        {/* Daily Report status for the viewed date */}
        {dailyReport && (
          <DailyReportBanner
            date={date}
            status={dailyReport.status}
            sentAt={dailyReport.sent_at}
            recipients={
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              Array.isArray((dailyReport as any).email_recipients)
                ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  ((dailyReport as any).email_recipients as Array<{
                    email?: string;
                    name?: string;
                  }>)
                : []
            }
            aiSummary={dailyReport.ai_summary}
          />
        )}

        <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-5">
          <StatTile label="Total" value={counts.total} tone="default" />
          <StatTile label="Pending" value={counts.pending} tone="pending" />
          <StatTile label="Submitted" value={counts.submitted} tone="submitted" />
          <StatTile label="Included" value={counts.included} tone="included" />
          <StatTile label="Locked" value={counts.locked} tone="locked" />
          <StatTile label="Archived" value={counts.archived} tone="archived" />
        </section>

        {/* End-of-shift recaps */}
        {recaps && recaps.length > 0 && (
          <RecapsPanel
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            recaps={recaps as any[]}
          />
        )}

        <section className="bg-white rounded-bubble shadow-card border border-slate-100/80 p-4 mb-5">
          <SupervisorFilters
            initial={{
              date,
              status,
              category: categoryId,
              terminal: terminalId,
              location: locationId,
              department: departmentId,
              outlet: outletId,
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
            departments={(departments ?? []).map((d) => ({
              id: d.id,
              name: d.name,
            }))}
            outlets={(outlets ?? []).map((o) => ({
              id: o.id,
              // If a department filter is active, narrow to that dept's outlets
              name: o.name,
            })).filter((o) => {
              if (!departmentId) return true;
              return (outlets ?? []).some(
                (x) => x.id === o.id && x.department_id === departmentId,
              );
            })}
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

function RecapsPanel({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  recaps,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  recaps: any[];
}) {
  return (
    <section className="bg-white rounded-bubble shadow-card border border-slate-100/80 p-4 mb-5">
      <header className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-beacon-tealSoft flex items-center justify-center">
            <Sunset className="w-3.5 h-3.5 text-beacon-tealDark" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-beacon-navy">
              End-of-shift recaps
            </h2>
            <p className="text-xs text-beacon-mid">
              Quick notes from associates who ended their day.
            </p>
          </div>
        </div>
        <span className="text-[10px] uppercase tracking-wider text-beacon-mid font-medium px-2 py-0.5 rounded bg-beacon-tealSoft text-beacon-tealDark">
          {recaps.length} {recaps.length === 1 ? "recap" : "recaps"}
        </span>
      </header>

      <ul className="space-y-2.5">
        {recaps.map((r) => {
          const who =
            r.profiles?.full_name ?? r.profiles?.email ?? "—";
          const role: string = r.profiles?.role ?? "user";
          const terminal: string | null = r.terminals?.name ?? null;
          const drafts: number = r.open_drafts_count ?? 0;
          const pending: number = r.pending_review_count ?? 0;
          const created = new Date(r.created_at).toLocaleTimeString([], {
            hour: "numeric",
            minute: "2-digit",
          });
          return (
            <li
              key={r.id}
              className="rounded-md border border-beacon-line bg-beacon-offwhite p-3"
            >
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mb-1.5">
                <span className="text-sm font-semibold text-beacon-navy">
                  {who}
                </span>
                <span className="text-[10px] uppercase tracking-wider text-beacon-mid font-medium">
                  · {role}
                </span>
                {terminal && (
                  <span className="text-xs text-beacon-tealDark inline-flex items-center gap-0.5">
                    <MapPin className="w-3 h-3" />
                    {terminal}
                  </span>
                )}
                <span className="text-xs text-beacon-mid">
                  · ended at {created}
                </span>
                {drafts > 0 && (
                  <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">
                    {drafts} draft{drafts === 1 ? "" : "s"} left
                  </span>
                )}
                {pending > 0 && (
                  <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-sky-100 text-sky-800">
                    {pending} awaiting review
                  </span>
                )}
              </div>
              <p className="text-sm text-beacon-navy/90 whitespace-pre-wrap break-words">
                {r.recap_text}
              </p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function DailyReportBanner({
  date,
  status,
  sentAt,
  recipients,
  aiSummary,
}: {
  date: string;
  status: string;
  sentAt: string | null;
  recipients: Array<{ email?: string; name?: string }>;
  aiSummary: string | null;
}) {
  const isSent = status === "sent";
  const recipientCount = recipients?.length ?? 0;
  return (
    <section
      className={`rounded-bubble border p-4 mb-5 ${
        isSent
          ? "bg-beacon-teal/5 border-beacon-teal/30"
          : "bg-amber-50/60 border-amber-200"
      }`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`shrink-0 mt-0.5 ${
            isSent ? "text-beacon-teal" : "text-amber-600"
          }`}
        >
          {isSent ? (
            <CheckCircle2 className="w-5 h-5" />
          ) : (
            <FileEdit className="w-5 h-5" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
            <h2 className="text-sm font-semibold text-morey-deep">
              {isSent
                ? `Daily Report sent for ${formatDate(date)}`
                : `Daily Report draft in progress for ${formatDate(date)}`}
            </h2>
            {isSent && sentAt && (
              <span className="text-xs text-morey-mid">
                · {new Date(sentAt).toLocaleString([], {
                  month: "short",
                  day: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </span>
            )}
            {isSent && recipientCount > 0 && (
              <span className="text-xs text-morey-mid">
                · {recipientCount} recipient{recipientCount === 1 ? "" : "s"}
              </span>
            )}
          </div>
          {aiSummary && (
            <p className="text-sm text-morey-deep/90 mt-1 line-clamp-2">
              {aiSummary}
            </p>
          )}
          <div className="flex flex-wrap gap-3 mt-2">
            <Link
              href={`/supervisor/build/${date}`}
              className="text-xs font-medium text-beacon-teal hover:text-beacon-tealDark transition inline-flex items-center gap-1"
            >
              Open builder
              <ChevronRight className="w-3 h-3" />
            </Link>
            <a
              href={`/api/daily-report/${date}/pdf`}
              target="_blank"
              rel="noreferrer"
              className="text-xs font-medium text-beacon-teal hover:text-beacon-tealDark transition inline-flex items-center gap-1"
            >
              View PDF
              <FileText className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>
    </section>
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

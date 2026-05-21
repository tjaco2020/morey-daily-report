import { createServerSupabase } from "@/lib/supabase/server";
import { requireRole } from "@/lib/roles";
import { formatDate } from "@/lib/format";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  FileText,
  CheckCircle2,
  FileEdit,
  Mail,
} from "lucide-react";
import { EmptyState } from "@/components/EmptyState";

export const dynamic = "force-dynamic";

type SP = Record<string, string | undefined>;

const PAGE_SIZE = 30;

export default async function DailyReportHistoryPage({
  searchParams,
}: {
  searchParams: SP;
}) {
  await requireRole("supervisor");
  const supabase = createServerSupabase();

  const statusFilter = searchParams.status || "";
  const page = Math.max(1, parseInt(searchParams.page || "1", 10) || 1);

  let q = supabase
    .from("daily_reports")
    .select(
      "id, report_date, status, sent_at, email_recipients, ai_summary, supervisor_notes",
      { count: "exact" },
    )
    .order("report_date", { ascending: false });

  if (statusFilter === "sent" || statusFilter === "draft") {
    q = q.eq("status", statusFilter);
  }

  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;
  const { data: rows, count } = await q.range(from, to);

  const total = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  // Aggregate stats across ALL rows (not paginated) for the header tiles.
  const { data: statsRows } = await supabase
    .from("daily_reports")
    .select("status");
  const sentCount = (statsRows ?? []).filter((r) => r.status === "sent").length;
  const draftCount = (statsRows ?? []).filter((r) => r.status === "draft").length;

  return (
    <main className="px-4 sm:px-6 py-8 sm:py-10">
      <div className="max-w-5xl mx-auto">
        <Link
          href="/supervisor"
          className="text-sm text-beacon-teal hover:text-beacon-tealDark transition inline-flex items-center gap-1"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          Supervisor
        </Link>

        <header className="mt-2 mb-6">
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-morey-deep">
            Daily Report history
          </h1>
          <p className="text-sm text-morey-mid mt-1">
            Every Daily Report ever built — sent and in-progress. Click any row to
            open the builder, or download the archived PDF.
          </p>
        </header>

        <section className="grid grid-cols-3 gap-3 mb-5">
          <StatTile label="Total" value={total} />
          <StatTile label="Sent" value={sentCount} />
          <StatTile label="Drafts" value={draftCount} />
        </section>

        <section className="bg-white rounded-bubble shadow-card border border-slate-100/80 p-3 mb-4 flex flex-wrap items-center gap-2">
          <span className="text-xs uppercase tracking-wider text-morey-mid font-medium px-1">
            Status:
          </span>
          <FilterPill label="All" href="/supervisor/history" active={!statusFilter} />
          <FilterPill
            label="Sent"
            href="/supervisor/history?status=sent"
            active={statusFilter === "sent"}
          />
          <FilterPill
            label="Drafts"
            href="/supervisor/history?status=draft"
            active={statusFilter === "draft"}
          />
        </section>

        <section className="bg-white rounded-bubble shadow-card border border-slate-100/80 overflow-hidden">
          {(!rows || rows.length === 0) && (
            <EmptyState
              icon={FileText}
              title="No Daily Reports yet"
              description="Build one from the supervisor dashboard to see it here."
            />
          )}

          {rows && rows.length > 0 && (
            <ul className="divide-y divide-slate-100">
              {rows.map((row) => {
                const recipients = Array.isArray(
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  (row as any).email_recipients,
                )
                  ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    ((row as any).email_recipients as Array<{
                      email?: string;
                      name?: string;
                    }>)
                  : [];
                const isSent = row.status === "sent";
                const summary =
                  (row.ai_summary && row.ai_summary.trim()) ||
                  (row.supervisor_notes && row.supervisor_notes.trim()) ||
                  "";

                return (
                  <li
                    key={row.id}
                    className="px-4 py-4 sm:px-5 hover:bg-slate-50/60 transition"
                  >
                    <div className="flex flex-wrap items-start gap-3">
                      <div className="shrink-0 mt-0.5">
                        {isSent ? (
                          <CheckCircle2 className="w-4 h-4 text-beacon-teal" />
                        ) : (
                          <FileEdit className="w-4 h-4 text-amber-600" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                          <span className="text-sm font-semibold text-morey-deep">
                            {formatDate(row.report_date)}
                          </span>
                          <span
                            className={`text-[10px] uppercase tracking-wider font-medium px-2 py-0.5 rounded-md ${
                              isSent
                                ? "bg-beacon-teal/15 text-beacon-tealDark"
                                : "bg-amber-100 text-amber-800"
                            }`}
                          >
                            {isSent ? "Sent" : "Draft"}
                          </span>
                          {isSent && row.sent_at && (
                            <span className="text-xs text-morey-mid">
                              · {new Date(row.sent_at).toLocaleString([], {
                                month: "short",
                                day: "numeric",
                                hour: "numeric",
                                minute: "2-digit",
                              })}
                            </span>
                          )}
                          {isSent && recipients.length > 0 && (
                            <span className="text-xs text-morey-mid inline-flex items-center gap-1">
                              <Mail className="w-3 h-3" />
                              {recipients.length}{" "}
                              recipient{recipients.length === 1 ? "" : "s"}
                            </span>
                          )}
                        </div>

                        {summary && (
                          <p className="text-sm text-morey-deep/90 mt-1 line-clamp-2">
                            {summary}
                          </p>
                        )}

                        <div className="flex flex-wrap gap-3 mt-2">
                          <Link
                            href={`/supervisor?date=${row.report_date}`}
                            className="text-xs font-medium text-beacon-navy hover:text-beacon-charcoal transition inline-flex items-center gap-1"
                          >
                            See reports for this day
                            <ChevronRight className="w-3 h-3" />
                          </Link>
                          <Link
                            href={`/supervisor/build/${row.report_date}`}
                            className="text-xs font-medium text-beacon-teal hover:text-beacon-tealDark transition inline-flex items-center gap-1"
                          >
                            Open builder
                            <ChevronRight className="w-3 h-3" />
                          </Link>
                          {isSent && (
                            <a
                              href={`/api/daily-report/${row.report_date}/pdf`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-xs font-medium text-beacon-teal hover:text-beacon-tealDark transition inline-flex items-center gap-1"
                            >
                              <FileText className="w-3 h-3" />
                              View PDF
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* Pagination */}
        {totalPages > 1 && (
          <nav className="flex items-center justify-between mt-4 text-sm">
            <PageLink
              page={Math.max(1, page - 1)}
              status={statusFilter}
              disabled={page <= 1}
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              Previous
            </PageLink>
            <span className="text-morey-mid">
              Page {page} of {totalPages}
            </span>
            <PageLink
              page={Math.min(totalPages, page + 1)}
              status={statusFilter}
              disabled={page >= totalPages}
            >
              Next
              <ChevronRight className="w-3.5 h-3.5" />
            </PageLink>
          </nav>
        )}
      </div>
    </main>
  );
}

function StatTile({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-bubble shadow-card border border-slate-100/80 p-3.5 bg-white">
      <div className="text-[10px] uppercase tracking-wider text-morey-mid font-medium">
        {label}
      </div>
      <div className="text-2xl font-semibold text-morey-deep mt-0.5 tabular-nums">
        {value}
      </div>
    </div>
  );
}

function FilterPill({
  label,
  href,
  active,
}: {
  label: string;
  href: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={`text-xs px-3 py-1.5 rounded-full transition ${
        active
          ? "bg-beacon-navy text-white"
          : "bg-slate-100 text-morey-deep hover:bg-slate-200"
      }`}
    >
      {label}
    </Link>
  );
}

function PageLink({
  page,
  status,
  disabled,
  children,
}: {
  page: number;
  status: string;
  disabled: boolean;
  children: React.ReactNode;
}) {
  const params = new URLSearchParams();
  if (status) params.set("status", status);
  if (page > 1) params.set("page", String(page));
  const href = `/supervisor/history${params.toString() ? `?${params}` : ""}`;
  const cls =
    "inline-flex items-center gap-1 px-3 py-1.5 rounded-md border border-slate-200 bg-white text-morey-deep transition";
  if (disabled) {
    return (
      <span className={`${cls} opacity-40 cursor-not-allowed`}>{children}</span>
    );
  }
  return (
    <Link href={href} className={`${cls} hover:bg-slate-50`}>
      {children}
    </Link>
  );
}

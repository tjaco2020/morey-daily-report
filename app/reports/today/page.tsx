import { createServerSupabase } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  todayLocal,
  formatDate,
  formatTime,
  statusLabel,
  statusClasses,
} from "@/lib/format";
import { Clock, Pencil, FilePlus2 } from "lucide-react";
import { EmptyState } from "@/components/EmptyState";
import { DeleteReportButton } from "@/components/DeleteReportButton";
import { ShareButton } from "@/components/ShareButton";

export const dynamic = "force-dynamic";

export default async function TodayReportsPage() {
  const supabase = createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const today = todayLocal();

  const { data: reports, error } = await supabase
    .from("reports")
    .select(
      "id, case_number, status, text, submitted_at, created_at, categories(name), terminals(name)",
    )
    .eq("user_id", user.id)
    .eq("report_date", today)
    .order("created_at", { ascending: false });

  return (
    <main className="px-4 sm:px-6 py-8 sm:py-10">
      <div className="max-w-3xl mx-auto">
        <header className="mb-6">
          <p className="text-sm text-morey-mid">{formatDate(today)}</p>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-morey-deep mt-1">
            Your reports
          </h1>
          <p className="text-sm text-morey-mid mt-1">
            Everything you&apos;ve logged today, draft or submitted.
          </p>
        </header>

        {error && (
          <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md p-3 mb-4">
            {error.message}
          </p>
        )}

        {reports && reports.length > 0 ? (
          <ul className="space-y-3">
            {reports.map((r) => (
              <li
                key={r.id}
                className="bg-white rounded-bubble shadow-card border border-slate-100/80 p-5 flex items-start justify-between gap-4 hover:shadow-cardHover transition"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-morey-mid">
                    <Clock className="w-3 h-3" />
                    <span>{formatTime(r.submitted_at ?? r.created_at)}</span>
                    <span>·</span>
                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                    <span>{(r as any).categories?.name ?? "—"}</span>
                    <span>·</span>
                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                    <span>{(r as any).terminals?.name ?? "—"}</span>
                    <span
                      className={`ml-auto text-[10px] uppercase tracking-wider font-medium px-2 py-0.5 rounded-md ${statusClasses(r.status)}`}
                    >
                      {statusLabel(r.status)}
                    </span>
                  </div>
                  <p className="text-sm text-morey-deep mt-2 whitespace-pre-wrap break-words">
                    {r.text}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-2 font-mono">
                    {r.case_number}
                  </p>
                </div>
                <div className="shrink-0 flex items-center gap-2">
                  {r.status === "pending" && (
                    <Link
                      href={`/reports/${r.id}`}
                      className="inline-flex items-center gap-1 text-sm text-morey-ocean hover:text-morey-deep transition"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      Edit
                    </Link>
                  )}
                  <ShareButton
                    reportId={r.id}
                    caseNumber={r.case_number}
                    variant="icon"
                  />
                  {(r.status === "pending" || r.status === "submitted") && (
                    <DeleteReportButton
                      reportId={r.id}
                      caseNumber={r.case_number}
                      variant="icon"
                    />
                  )}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="bg-white rounded-bubble shadow-card border border-slate-100/80">
            <EmptyState
              icon={FilePlus2}
              title="No reports yet today"
              description="Tap the red bubble in the bottom-right corner to log your first."
            />
          </div>
        )}
      </div>
    </main>
  );
}

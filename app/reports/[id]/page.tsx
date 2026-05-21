import { createServerSupabase } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { EditReportForm } from "./EditReportForm";
import { DeleteReportButton } from "@/components/DeleteReportButton";
import { ShareButton } from "@/components/ShareButton";
import Link from "next/link";
import { formatDate, formatTime, statusLabel, statusClasses } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function ReportDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: report }, { data: categories }, { data: terminals }, { data: profile }] =
    await Promise.all([
      supabase
        .from("reports")
        .select(
          "id, case_number, status, text, report_date, submitted_at, created_at, category_id, terminal_id, user_id, categories(name), terminals(name)",
        )
        .eq("id", params.id)
        .maybeSingle(),
      supabase
        .from("categories")
        .select("id, name, display_order, active")
        .eq("active", true)
        .order("display_order"),
      supabase
        .from("terminals")
        .select("id, name, active")
        .eq("active", true)
        .order("name"),
      supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single(),
    ]);

  if (!report) notFound();

  const isOwner = report.user_id === user.id;
  const isSupervisor =
    profile?.role === "supervisor" || profile?.role === "manager";

  // Owners can edit only while pending.
  // Supervisors+ can edit pending / submitted / included.
  // Managers (RLS) can also unlock locked reports — UI for unlock can come later.
  const editableStatuses = isSupervisor
    ? ["pending", "submitted", "included"]
    : ["pending"];
  const canEdit =
    (isOwner || isSupervisor) && editableStatuses.includes(report.status);

  // Delete permissions mirror the RLS policy:
  //   * Owner can delete their own pending/submitted reports.
  //   * Supervisor+ can delete any report.
  const canDelete =
    isSupervisor ||
    (isOwner && ["pending", "submitted"].includes(report.status));

  return (
    <main className="min-h-screen p-6 sm:p-10">
      <div className="max-w-2xl mx-auto">
        <Link href="/reports/today" className="text-sm text-morey-ocean hover:underline">
          ← Today&apos;s reports
        </Link>

        <div className="bg-white rounded-bubble shadow p-6 mt-4">
          <div className="flex items-center justify-between gap-3">
            <h1 className="text-xl font-bold text-morey-deep">Report</h1>
            <span className={`text-xs px-2 py-1 rounded ${statusClasses(report.status)}`}>
              {statusLabel(report.status)}
            </span>
          </div>

          <div className="mt-3 text-xs text-gray-500 space-y-0.5">
            <div>Date: {formatDate(report.report_date)}</div>
            <div>Created: {formatTime(report.created_at)}</div>
            {report.submitted_at && (
              <div>Submitted: {formatTime(report.submitted_at)}</div>
            )}
            <div className="font-mono">{report.case_number}</div>
          </div>

          {canEdit ? (
            <EditReportForm
              report={{
                id: report.id,
                text: report.text,
                category_id: report.category_id,
                terminal_id: report.terminal_id,
                status: report.status,
              }}
              categories={(categories ?? []).map((c) => ({
                id: c.id,
                name: c.name,
              }))}
              terminals={(terminals ?? []).map((t) => ({
                id: t.id,
                name: t.name,
              }))}
              isSupervisor={isSupervisor && !isOwner}
            />
          ) : (
            <div className="mt-4 space-y-2 text-sm">
              <div className="text-gray-500 text-xs">Text</div>
              <p className="whitespace-pre-wrap break-words text-gray-800">
                {report.text}
              </p>
              <div className="text-gray-500 text-xs mt-3">Category / Terminal</div>
              <p className="text-gray-800">
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {(report as any).categories?.name ?? "—"} •{" "}
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {(report as any).terminals?.name ?? "—"}
              </p>
              {!canEdit && isOwner && (
                <p className="text-xs text-gray-500 mt-3">
                  You can&apos;t edit this report because it&apos;s no longer
                  pending. Ask a supervisor or manager if changes are needed.
                </p>
              )}
            </div>
          )}

          <div className="mt-6 pt-5 border-t border-slate-100 flex flex-wrap items-center gap-3">
            {(isOwner || isSupervisor) && (
              <ShareButton
                reportId={report.id}
                caseNumber={report.case_number}
              />
            )}
            {canDelete && (
              <DeleteReportButton
                reportId={report.id}
                caseNumber={report.case_number}
                redirectTo={isOwner ? "/reports/today" : "/supervisor"}
              />
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

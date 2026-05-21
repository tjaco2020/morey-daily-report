"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createBrowserSupabase } from "@/lib/supabase/client";
import { formatTime, statusLabel, statusClasses } from "@/lib/format";
import { WeatherPanel } from "@/components/WeatherPanel";
import { AiSummaryPanel } from "@/components/AiSummaryPanel";
import { MetricsPanel } from "@/components/MetricsPanel";
import { ProofreadButton } from "@/components/ProofreadButton";

type ReportRow = {
  id: string;
  case_number: string;
  text: string;
  status: string;
  created_at: string;
  submitted_at: string | null;
  category: string;
  terminal: string;
  user: string;
  included: boolean;
  terminal_location_id: string | null;
};

type LocationOption = { id: string; name: string };

type Props = {
  dailyReport: {
    id: string;
    report_date: string;
    status: string;
    supervisor_notes: string;
    ai_summary: string;
    weather_snapshot: unknown | null;
    metrics_snapshot: unknown | null;
  };
  reports: ReportRow[];
  locations: LocationOption[];
};

export function BuilderClient({ dailyReport, reports, locations }: Props) {
  const supabase = createBrowserSupabase();
  const router = useRouter();
  const [notes, setNotes] = useState(dailyReport.supervisor_notes);
  const [included, setIncluded] = useState<Set<string>>(
    new Set(reports.filter((r) => r.included).map((r) => r.id)),
  );
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [messageOk, setMessageOk] = useState(false);
  // Local optimistic status (so a pending report flips visually after submit).
  const [statusOverride, setStatusOverride] = useState<Record<string, string>>({});
  // Location filter (client-side; reports prop already contains everything for date)
  const [locationFilter, setLocationFilter] = useState<string>("");

  function showMsg(msg: string, ok: boolean) {
    setMessage(msg);
    setMessageOk(ok);
  }

  function reportStatus(r: ReportRow): string {
    return statusOverride[r.id] ?? r.status;
  }

  async function toggleInclude(reportId: string, nextIncluded: boolean) {
    setBusy(true);
    setMessage(null);
    try {
      if (nextIncluded) {
        // Insert the daily_report_items row (idempotent — ignore unique violation).
        const { error: insErr } = await supabase
          .from("daily_report_items")
          .insert({
            daily_report_id: dailyReport.id,
            report_id: reportId,
          });
        if (insErr && !/duplicate key/i.test(insErr.message)) throw insErr;

        // Flip the report to 'included'. If it was pending, also stamp submitted_at.
        const r = reports.find((x) => x.id === reportId);
        const wasPending = (statusOverride[reportId] ?? r?.status) === "pending";
        const patch: Record<string, unknown> = { status: "included" };
        if (wasPending) {
          patch.submitted_at = new Date().toISOString();
        }
        const { error: updErr } = await supabase
          .from("reports")
          .update(patch)
          .eq("id", reportId);
        if (updErr) throw updErr;

        const next = new Set(included);
        next.add(reportId);
        setIncluded(next);
        setStatusOverride((s) => ({ ...s, [reportId]: "included" }));
        showMsg("Included.", true);
      } else {
        const { error } = await supabase
          .from("daily_report_items")
          .delete()
          .eq("daily_report_id", dailyReport.id)
          .eq("report_id", reportId);
        if (error) throw error;
        // Revert to 'submitted' (not back to pending — supervisor touched it).
        await supabase
          .from("reports")
          .update({ status: "submitted" })
          .eq("id", reportId)
          .eq("status", "included");
        const next = new Set(included);
        next.delete(reportId);
        setIncluded(next);
        setStatusOverride((s) => ({ ...s, [reportId]: "submitted" }));
        showMsg("Removed.", true);
      }
    } catch (err: unknown) {
      showMsg(err instanceof Error ? err.message : "Could not update.", false);
    } finally {
      setBusy(false);
    }
  }

  async function submitOnBehalf(reportId: string) {
    setBusy(true);
    setMessage(null);
    try {
      const { error } = await supabase
        .from("reports")
        .update({
          status: "submitted",
          submitted_at: new Date().toISOString(),
        })
        .eq("id", reportId)
        .eq("status", "pending");
      if (error) throw error;
      setStatusOverride((s) => ({ ...s, [reportId]: "submitted" }));
      showMsg("Submitted on behalf.", true);
    } catch (err: unknown) {
      showMsg(
        err instanceof Error ? err.message : "Could not submit.",
        false,
      );
    } finally {
      setBusy(false);
    }
  }

  async function saveNotes() {
    setBusy(true);
    setMessage(null);
    try {
      const { error } = await supabase
        .from("daily_reports")
        .update({ supervisor_notes: notes })
        .eq("id", dailyReport.id);
      if (error) throw error;
      showMsg("Notes saved.", true);
      router.refresh();
    } catch (err: unknown) {
      showMsg(
        err instanceof Error ? err.message : "Could not save notes.",
        false,
      );
    } finally {
      setBusy(false);
    }
  }

  async function sendDailyReport() {
    const ok = window.confirm(
      dailyReport.status === "sent"
        ? "Re-send the Daily Report to all active recipients?"
        : "Send the Daily Report to all active recipients now?",
    );
    if (!ok) return;
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch(
        `/api/daily-report/${dailyReport.report_date}/send`,
        { method: "POST" },
      );
      const body = await res.json();
      if (!res.ok) {
        throw new Error(body.error || `Send failed (${res.status})`);
      }
      const list = Array.isArray(body.sent_to) ? body.sent_to.join(", ") : "";
      showMsg(`Sent to: ${list}`, true);
      router.refresh();
    } catch (err: unknown) {
      showMsg(
        err instanceof Error ? err.message : "Could not send the report.",
        false,
      );
    } finally {
      setBusy(false);
    }
  }

  // Apply location filter (if set) and split into pending vs the rest
  const visible = locationFilter
    ? reports.filter((r) => r.terminal_location_id === locationFilter)
    : reports;
  const pendingReports = visible.filter(
    (r) => reportStatus(r) === "pending",
  );
  const otherReports = visible.filter(
    (r) => reportStatus(r) !== "pending",
  );

  return (
    <div className="space-y-6">
      {/* Supervisor notes */}
      <section className="bg-white rounded-bubble shadow p-5">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold text-morey-deep">
            Supervisor notes
          </h2>
          <button
            onClick={saveNotes}
            disabled={busy}
            className="px-3 py-1.5 rounded-lg bg-morey-red text-white text-sm font-semibold hover:bg-red-700 disabled:opacity-60"
          >
            Save notes
          </button>
        </div>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={4}
          placeholder="Anything to add above the report list for executives — staffing, weather impact, follow-ups, etc."
          className="w-full px-3.5 py-2.5 rounded-soft border border-slate-200 focus:outline-none focus:ring-2 focus:ring-morey-ocean/30 focus:border-morey-ocean resize-y text-sm"
        />
        <div className="mt-2">
          <ProofreadButton
            value={notes}
            onAccept={(v) => setNotes(v)}
            kind="supervisor_note"
          />
        </div>
      </section>

      {/* Weather + AI Summary + Metrics */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <WeatherPanel
          date={dailyReport.report_date}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          initial={dailyReport.weather_snapshot as any}
        />
        <AiSummaryPanel
          date={dailyReport.report_date}
          dailyReportId={dailyReport.id}
          initial={dailyReport.ai_summary}
        />
        <MetricsPanel
          date={dailyReport.report_date}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          initial={dailyReport.metrics_snapshot as any}
        />
      </section>

      {/* Location filter */}
      {locations.length > 0 && (
        <section className="bg-white rounded-bubble shadow-card border border-slate-100/80 p-4 flex flex-wrap items-center gap-3">
          <label className="text-xs font-medium text-morey-mid">
            Filter by location
          </label>
          <select
            value={locationFilter}
            onChange={(e) => setLocationFilter(e.target.value)}
            className="px-3 py-1.5 rounded-md border border-slate-200 focus:outline-none focus:ring-2 focus:ring-morey-yellow/40 text-sm bg-white"
          >
            <option value="">All locations</option>
            {locations.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </select>
          {locationFilter && (
            <button
              onClick={() => setLocationFilter("")}
              className="text-xs text-morey-ocean hover:text-morey-deep transition"
            >
              Clear
            </button>
          )}
          <span className="ml-auto text-xs text-morey-mid">
            Showing {visible.length} of {reports.length} reports
          </span>
        </section>
      )}

      {/* Pending reports — highlighted, action-oriented */}
      {pendingReports.length > 0 && (
        <section className="rounded-bubble shadow overflow-hidden border-2 border-amber-300">
          <div className="bg-amber-50 px-5 py-3 border-b border-amber-200 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-semibold text-morey-deep flex items-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="w-5 h-5 text-amber-500"
              >
                <path
                  fillRule="evenodd"
                  d="M9.401 3.003c1.155-2 4.043-2 5.197 0l8.659 14.997c1.155 2-.289 4.5-2.598 4.5H3.34c-2.309 0-3.753-2.5-2.598-4.5L9.4 3.003zM12 8.25a.75.75 0 01.75.75v3.75a.75.75 0 01-1.5 0V9a.75.75 0 01.75-.75zm0 8.25a.75.75 0 100-1.5.75.75 0 000 1.5z"
                  clipRule="evenodd"
                />
              </svg>
              Pending — left by associates ({pendingReports.length})
            </h2>
            <p className="text-xs text-amber-800">
              Lock at 1AM if not submitted. Submit or include to keep them in the day&apos;s record.
            </p>
          </div>
          <ul className="divide-y divide-amber-100 bg-amber-50/40">
            {pendingReports.map((r) => (
              <li key={r.id} className="p-4 flex flex-col sm:flex-row sm:items-start gap-3">
                <input
                  type="checkbox"
                  checked={included.has(r.id)}
                  onChange={(e) => toggleInclude(r.id, e.target.checked)}
                  disabled={busy}
                  className="mt-1 h-5 w-5 accent-morey-red shrink-0"
                  title="Submit and include in daily report"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
                    <span>{formatTime(r.created_at)}</span>
                    <span>•</span>
                    <span>{r.user}</span>
                    <span>•</span>
                    <span>{r.category}</span>
                    <span>•</span>
                    <span>{r.terminal}</span>
                    <span
                      className={`ml-auto text-xs px-2 py-0.5 rounded ${statusClasses(reportStatus(r))}`}
                    >
                      {statusLabel(reportStatus(r))}
                    </span>
                  </div>
                  <p className="text-sm text-gray-800 mt-1 whitespace-pre-wrap break-words">
                    {r.text}
                  </p>
                  <p className="text-[11px] text-gray-400 mt-1 font-mono">
                    {r.case_number}
                  </p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <Link
                      href={`/reports/${r.id}`}
                      className="text-sm text-morey-ocean hover:underline"
                    >
                      Edit →
                    </Link>
                    <button
                      onClick={() => submitOnBehalf(r.id)}
                      disabled={busy}
                      className="text-sm px-2 py-1 rounded bg-white border border-gray-300 hover:bg-gray-50 disabled:opacity-60"
                      title="Mark as submitted without including in daily report"
                    >
                      Submit only
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Submitted + Included reports */}
      <section className="bg-white rounded-bubble shadow overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-morey-deep">
            Submitted reports ({otherReports.length})
          </h2>
          <div className="text-xs text-gray-500">{included.size} included</div>
        </div>
        {otherReports.length === 0 ? (
          <p className="p-8 text-center text-sm text-gray-500">
            No submitted reports for this date yet.
          </p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {otherReports.map((r) => (
              <li key={r.id} className="p-4 flex items-start gap-4">
                <input
                  type="checkbox"
                  checked={included.has(r.id)}
                  onChange={(e) => toggleInclude(r.id, e.target.checked)}
                  disabled={busy}
                  className="mt-1 h-5 w-5 accent-morey-red"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
                    <span>
                      {formatTime(r.submitted_at ?? r.created_at)}
                    </span>
                    <span>•</span>
                    <span>{r.user}</span>
                    <span>•</span>
                    <span>{r.category}</span>
                    <span>•</span>
                    <span>{r.terminal}</span>
                    <span
                      className={`ml-auto text-xs px-2 py-0.5 rounded ${statusClasses(reportStatus(r))}`}
                    >
                      {statusLabel(reportStatus(r))}
                    </span>
                  </div>
                  <p className="text-sm text-gray-800 mt-1 whitespace-pre-wrap break-words">
                    {r.text}
                  </p>
                  <p className="text-[11px] text-gray-400 mt-1 font-mono">
                    {r.case_number}
                  </p>
                  <Link
                    href={`/reports/${r.id}`}
                    className="text-sm text-morey-ocean hover:underline mt-1 inline-block"
                  >
                    Edit →
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {message && (
        <p
          className={`text-sm rounded p-2 border ${
            messageOk
              ? "bg-green-50 border-green-200 text-green-800"
              : "bg-yellow-50 border-yellow-200 text-morey-deep"
          }`}
        >
          {message}
        </p>
      )}

      {/* Bottom action bar */}
      <section className="bg-white rounded-bubble shadow p-5 flex flex-wrap items-center justify-between gap-3">
        <div className="text-sm text-gray-500">
          Preview opens the PDF in a new tab. Send emails the PDF to all active recipients.
        </div>
        <div className="flex gap-2">
          <a
            href={`/api/daily-report/${dailyReport.report_date}/pdf`}
            target="_blank"
            rel="noreferrer"
            className="px-4 py-2 rounded-lg bg-white border border-morey-red text-morey-red text-sm font-semibold hover:bg-red-50"
          >
            Preview PDF
          </a>
          <button
            onClick={sendDailyReport}
            disabled={busy}
            className="px-4 py-2 rounded-lg bg-morey-red text-white text-sm font-semibold hover:bg-red-700 disabled:opacity-60"
          >
            {dailyReport.status === "sent"
              ? "Re-send Daily Report"
              : "Send Daily Report"}
          </button>
        </div>
      </section>
    </div>
  );
}

function Placeholder({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="bg-white rounded-bubble shadow p-4 border border-dashed border-gray-200">
      <div className="text-sm font-semibold text-morey-deep">{title}</div>
      <div className="text-xs text-gray-500 mt-1">{desc}</div>
    </div>
  );
}

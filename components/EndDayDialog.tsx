"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createBrowserSupabase } from "@/lib/supabase/client";
import { todayLocal, formatTime } from "@/lib/format";
import {
  X,
  Loader2,
  FilePlus2,
  FileEdit,
  CheckCircle2,
  Sunset,
  AlertTriangle,
  ChevronRight,
} from "lucide-react";

type OpenReport = {
  id: string;
  case_number: string;
  status: string;
  text: string;
  submitted_at: string | null;
  created_at: string;
  category_name: string | null;
};

type Props = {
  open: boolean;
  onClose: () => void;
  onEnded?: () => void;
};

/**
 * "End my day" modal.
 *
 * Shows the current user's open drafts and submitted-pending-review reports
 * for today (so they can finish or polish them before signing off), and
 * collects a quick free-text recap that's saved to shift_recaps and
 * surfaced on the supervisor dashboard.
 */
export function EndDayDialog({ open, onClose, onEnded }: Props) {
  const supabase = createBrowserSupabase();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [openReports, setOpenReports] = useState<OpenReport[]>([]);
  const [recap, setRecap] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      setSuccess(false);
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user || cancelled) return;

        // Pull today's reports — pending (draft) + submitted (review needed)
        const today = todayLocal();
        const { data } = await supabase
          .from("reports")
          .select(
            `id, case_number, status, text, submitted_at, created_at,
             categories(name)`,
          )
          .eq("user_id", user.id)
          .eq("report_date", today)
          .in("status", ["pending", "submitted"])
          .order("created_at", { ascending: false });
        if (cancelled) return;
        setOpenReports(
          (data ?? []).map((r) => ({
            id: r.id,
            case_number: r.case_number,
            status: r.status,
            text: r.text,
            submitted_at: r.submitted_at,
            created_at: r.created_at,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            category_name: (r as any).categories?.name ?? null,
          })),
        );

        // Pre-fill recap textarea if a recap already exists today
        const { data: existing } = await supabase
          .from("shift_recaps")
          .select("recap_text")
          .eq("user_id", user.id)
          .eq("recap_date", today)
          .maybeSingle();
        if (existing?.recap_text) setRecap(existing.recap_text);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Could not load today's reports.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, supabase]);

  async function endDay() {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/end-day", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recap_text: recap }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Could not save recap.");
      setSuccess(true);
      // brief success state, then close
      setTimeout(() => {
        onClose();
        onEnded?.();
        // refresh so any consumer of shift state picks up the change
        router.refresh();
      }, 1000);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save recap.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!open) return null;

  const drafts = openReports.filter((r) => r.status === "pending");
  const submitted = openReports.filter((r) => r.status === "submitted");
  const recapValid = recap.trim().length > 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl bg-white rounded-bubble shadow-bubble overflow-hidden animate-slide-up max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between px-5 pt-5 pb-3 border-b border-beacon-line">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-beacon-tealSoft flex items-center justify-center shrink-0">
              <Sunset className="w-5 h-5 text-beacon-tealDark" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-beacon-navy">
                End my day
              </h2>
              <p className="text-xs text-beacon-mid mt-0.5">
                Tidy up open reports, leave a recap for your supervisor, sign off.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="p-1 rounded hover:bg-beacon-line/60 text-beacon-mid transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {loading ? (
            <div className="flex items-center justify-center py-12 text-sm text-beacon-mid gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Loading today&rsquo;s reports…
            </div>
          ) : (
            <>
              {/* Open reports summary */}
              <div className="flex items-center gap-2 mb-3">
                <span className="text-[10px] uppercase tracking-wider font-semibold text-beacon-mid">
                  Today
                </span>
                <span className="text-xs text-beacon-mid">
                  · {openReports.length}{" "}
                  open{" "}
                  report{openReports.length === 1 ? "" : "s"}
                </span>
              </div>

              {openReports.length === 0 && (
                <div className="flex items-center gap-2 p-3 rounded-md bg-beacon-tealSoft/60 border border-beacon-tealSoft text-sm text-beacon-tealDark mb-4">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>
                    All clear — no drafts or pending reports for today. Nice work.
                  </span>
                </div>
              )}

              {drafts.length > 0 && (
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <FileEdit className="w-3.5 h-3.5 text-amber-600" />
                    <span className="text-xs font-semibold text-beacon-navy uppercase tracking-wider">
                      Drafts ({drafts.length})
                    </span>
                    <span className="text-[10px] text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                      Submit before you leave
                    </span>
                  </div>
                  <ul className="space-y-1.5">
                    {drafts.map((r) => (
                      <ReportRow
                        key={r.id}
                        report={r}
                        onClose={onClose}
                        tone="draft"
                      />
                    ))}
                  </ul>
                </div>
              )}

              {submitted.length > 0 && (
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <FilePlus2 className="w-3.5 h-3.5 text-sky-600" />
                    <span className="text-xs font-semibold text-beacon-navy uppercase tracking-wider">
                      Submitted, awaiting supervisor review ({submitted.length})
                    </span>
                  </div>
                  <ul className="space-y-1.5">
                    {submitted.map((r) => (
                      <ReportRow
                        key={r.id}
                        report={r}
                        onClose={onClose}
                        tone="submitted"
                      />
                    ))}
                  </ul>
                </div>
              )}

              {drafts.length > 0 && (
                <div className="flex items-start gap-2 p-2.5 rounded-md bg-amber-50/60 border border-amber-200 text-xs text-amber-900 mb-4">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <span>
                    You can still end your day with unsubmitted drafts — they&rsquo;ll
                    auto-lock at 1 AM. But it&rsquo;s cleaner to submit them now.
                  </span>
                </div>
              )}

              {/* Recap textarea */}
              <div>
                <label
                  htmlFor="recap"
                  className="flex items-center justify-between mb-1.5"
                >
                  <span className="text-xs font-semibold text-beacon-navy uppercase tracking-wider">
                    Day recap
                  </span>
                  <span className="text-[10px] text-beacon-mid">
                    Visible to your supervisor on /supervisor
                  </span>
                </label>
                <textarea
                  id="recap"
                  value={recap}
                  onChange={(e) => setRecap(e.target.value)}
                  rows={5}
                  maxLength={4000}
                  placeholder="A few sentences on how the day went — wins, blockers, anything the next shift / your supervisor should know."
                  className="w-full px-3 py-2 rounded-lg border border-beacon-line focus:outline-none focus:ring-2 focus:ring-beacon-teal/40 text-sm text-beacon-navy resize-none"
                />
                <div className="text-[10px] text-beacon-mid mt-1 text-right">
                  {recap.length} / 4000
                </div>
              </div>
            </>
          )}

          {error && (
            <p className="mt-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded p-2">
              {error}
            </p>
          )}

          {success && (
            <div className="mt-3 flex items-center gap-2 p-2.5 rounded-md bg-beacon-tealSoft border border-beacon-teal/30 text-sm text-beacon-tealDark">
              <CheckCircle2 className="w-4 h-4" />
              Recap sent. Have a good night.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-2 px-5 py-3 border-t border-beacon-line bg-beacon-offwhite">
          <button
            onClick={onClose}
            className="flex-1 py-2 rounded-soft border border-beacon-line bg-white text-beacon-navy hover:bg-beacon-line/40 text-sm transition"
          >
            Cancel
          </button>
          <button
            onClick={endDay}
            disabled={submitting || !recapValid || loading || success}
            className="flex-[1.5] py-2 rounded-soft bg-beacon-navy text-white text-sm font-semibold hover:bg-beacon-charcoal disabled:opacity-50 transition shadow-sm flex items-center justify-center gap-1.5"
          >
            {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {submitting ? "Sending recap…" : "End my day"}
          </button>
        </div>
      </div>
    </div>
  );
}

function ReportRow({
  report,
  onClose,
  tone,
}: {
  report: OpenReport;
  onClose: () => void;
  tone: "draft" | "submitted";
}) {
  const accent =
    tone === "draft"
      ? "border-l-amber-400 bg-amber-50/40"
      : "border-l-sky-400 bg-sky-50/40";
  return (
    <li
      className={`flex items-start gap-2 px-3 py-2 rounded-md border border-beacon-line border-l-4 ${accent} hover:bg-white transition`}
    >
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 mb-0.5">
          <span className="text-xs font-semibold text-beacon-navy">
            {report.category_name ?? "Report"}
          </span>
          <span className="text-[10px] text-beacon-mid tabular-nums">
            {formatTime(report.submitted_at ?? report.created_at)}
          </span>
          <span className="text-[10px] text-beacon-mid font-mono">
            {report.case_number}
          </span>
        </div>
        <p className="text-xs text-beacon-navy/80 line-clamp-2 break-words">
          {report.text || (
            <span className="italic text-beacon-mid">No text yet.</span>
          )}
        </p>
      </div>
      <Link
        href={`/reports/${report.id}`}
        onClick={onClose}
        className="shrink-0 inline-flex items-center gap-0.5 text-xs font-medium text-beacon-tealDark hover:text-beacon-navy transition"
      >
        Open
        <ChevronRight className="w-3 h-3" />
      </Link>
    </li>
  );
}

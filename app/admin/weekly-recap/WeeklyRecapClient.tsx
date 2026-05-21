"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserSupabase } from "@/lib/supabase/client";
import { Calendar, Mail, AlertCircle } from "lucide-react";

type Recap = {
  id: string;
  week_start: string;
  week_end: string;
  ai_summary: string;
  total_reports: number;
  sent_at: string | null;
  error_message: string | null;
};

export function WeeklyRecapClient({
  initialEnabled,
  recentRecaps,
}: {
  initialEnabled: boolean;
  recentRecaps: Recap[];
}) {
  const router = useRouter();
  const supabase = createBrowserSupabase();
  const [enabled, setEnabled] = useState(initialEnabled);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [messageOk, setMessageOk] = useState(false);

  async function toggle(next: boolean) {
    setBusy(true);
    setMessage(null);
    try {
      const { error } = await supabase
        .from("app_settings")
        .upsert(
          {
            key: "weekly_recap_enabled",
            value: next,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "key" },
        );
      if (error) throw error;
      setEnabled(next);
      setMessage(next ? "Weekly recap enabled." : "Weekly recap paused.");
      setMessageOk(true);
      router.refresh();
    } catch (err) {
      setMessage(
        err instanceof Error ? err.message : "Could not update.",
      );
      setMessageOk(false);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-5">
      {/* Toggle */}
      <section
        className={`rounded-bubble shadow-card p-5 border-2 ${
          enabled
            ? "bg-green-50 border-green-200"
            : "bg-slate-50 border-slate-200"
        }`}
      >
        <div className="flex items-center gap-4">
          <div
            className={`w-12 h-12 rounded-full flex items-center justify-center ${
              enabled ? "bg-green-500 text-white" : "bg-slate-400 text-white"
            }`}
          >
            <Mail className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <div className="text-lg font-semibold text-morey-deep">
              Weekly recap is {enabled ? "ON" : "OFF"}
            </div>
            <div className="text-xs text-morey-mid">
              {enabled
                ? "Will send every Monday at 9 AM ET."
                : "Will NOT send until you turn it on."}
            </div>
          </div>
          <button
            onClick={() => toggle(!enabled)}
            disabled={busy}
            className={`px-4 py-2 rounded-soft text-sm font-semibold disabled:opacity-60 ${
              enabled
                ? "bg-slate-200 text-morey-deep hover:bg-slate-300"
                : "bg-morey-yellow text-morey-deep hover:bg-morey-yellowDark"
            }`}
          >
            {busy ? "…" : enabled ? "Turn off" : "Turn on"}
          </button>
        </div>
        {message && (
          <p
            className={`mt-3 text-sm rounded p-2 border ${
              messageOk
                ? "bg-green-100 border-green-300 text-green-800"
                : "bg-amber-50 border-amber-200 text-amber-900"
            }`}
          >
            {message}
          </p>
        )}
      </section>

      {/* About */}
      <section className="bg-white rounded-bubble shadow-card border border-slate-100/80 p-5">
        <h2 className="text-sm font-semibold text-morey-deep mb-2">
          What it includes
        </h2>
        <ul className="text-sm text-morey-mid space-y-1.5 list-disc list-inside">
          <li>
            Every report submitted/included/archived during the prior week
            (Monday–Sunday in ET).
          </li>
          <li>AI-written executive summary covering themes, hot spots, recommended actions.</li>
          <li>Totals by category and by location.</li>
          <li>
            Emailed to the same recipient list as the Daily Report (manage in{" "}
            <a
              href="/admin/recipients"
              className="text-morey-ocean hover:underline"
            >
              Email recipients
            </a>
            ).
          </li>
        </ul>
        <p className="text-xs text-morey-mid mt-3">
          Social-channel and Salesforce Service Cloud signals can be plugged
          in here as future data sources.
        </p>
      </section>

      {/* Recent recaps */}
      <section className="bg-white rounded-bubble shadow-card border border-slate-100/80 overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100 text-sm font-semibold text-morey-deep flex items-center gap-2">
          <Calendar className="w-4 h-4 text-morey-ocean" />
          Recent weeks ({recentRecaps.length})
        </div>
        {recentRecaps.length === 0 ? (
          <p className="p-8 text-center text-sm text-morey-mid">
            No weekly recaps yet — the first will fire next Monday.
          </p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {recentRecaps.map((r) => (
              <li key={r.id} className="p-4 space-y-1.5">
                <div className="flex items-center gap-2 text-xs text-morey-mid">
                  <span className="font-medium text-morey-deep">
                    {r.week_start} → {r.week_end}
                  </span>
                  <span>·</span>
                  <span>{r.total_reports} reports</span>
                  <span className="ml-auto">
                    {r.sent_at ? (
                      <span className="text-green-700">
                        Sent {new Date(r.sent_at).toLocaleString()}
                      </span>
                    ) : r.error_message ? (
                      <span className="text-red-700 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        Errored
                      </span>
                    ) : (
                      <span>Pending…</span>
                    )}
                  </span>
                </div>
                {r.ai_summary && (
                  <details className="text-xs">
                    <summary className="cursor-pointer text-morey-ocean hover:text-morey-deep">
                      View summary
                    </summary>
                    <div className="mt-2 p-3 bg-slate-50 rounded text-morey-deep whitespace-pre-wrap">
                      {r.ai_summary}
                    </div>
                  </details>
                )}
                {r.error_message && (
                  <p className="text-xs text-red-700 bg-red-50 rounded p-2 border border-red-200">
                    {r.error_message}
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

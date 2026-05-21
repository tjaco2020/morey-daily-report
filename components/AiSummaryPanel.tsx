"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserSupabase } from "@/lib/supabase/client";
import { ProofreadButton } from "./ProofreadButton";

type Props = {
  date: string;
  dailyReportId: string;
  initial: string;
};

export function AiSummaryPanel({ date, dailyReportId, initial }: Props) {
  const router = useRouter();
  const supabase = createBrowserSupabase();
  const [text, setText] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [messageOk, setMessageOk] = useState(false);

  function showMsg(m: string, ok: boolean) {
    setMessage(m);
    setMessageOk(ok);
  }

  async function generate() {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/daily-report/${date}/ai-summary`, {
        method: "POST",
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || "Failed");
      setText(body.summary);
      showMsg("Summary generated.", true);
      router.refresh();
    } catch (err) {
      showMsg(err instanceof Error ? err.message : "Could not generate.", false);
    } finally {
      setBusy(false);
    }
  }

  async function save() {
    setBusy(true);
    setMessage(null);
    try {
      const { error } = await supabase
        .from("daily_reports")
        .update({ ai_summary: text })
        .eq("id", dailyReportId);
      if (error) throw error;
      showMsg("Saved.", true);
      router.refresh();
    } catch (err) {
      showMsg(err instanceof Error ? err.message : "Could not save.", false);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="bg-white rounded-bubble shadow p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm font-semibold text-morey-deep">AI summary</div>
        <div className="flex gap-2">
          <button
            onClick={generate}
            disabled={busy}
            className="text-xs px-2 py-1 rounded bg-morey-deep text-white hover:opacity-90 disabled:opacity-60"
          >
            {busy ? "Working…" : text ? "Regenerate" : "Generate"}
          </button>
          <button
            onClick={save}
            disabled={busy}
            className="text-xs px-2 py-1 rounded bg-white border border-gray-300 hover:bg-gray-50 disabled:opacity-60"
          >
            Save edits
          </button>
        </div>
      </div>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={5}
        placeholder="Click Generate to have Claude summarize the day's reports. You can also write or edit this manually."
        className="w-full px-3 py-2 rounded-soft border border-slate-200 focus:outline-none focus:ring-2 focus:ring-morey-ocean/30 focus:border-morey-ocean text-sm"
      />
      <div className="mt-2">
        <ProofreadButton
          value={text}
          onAccept={(v) => setText(v)}
          kind="ai_summary"
        />
      </div>
      {message && (
        <p
          className={`mt-2 text-xs rounded p-2 border ${
            messageOk
              ? "bg-green-50 border-green-200 text-green-800"
              : "bg-yellow-50 border-yellow-200 text-morey-deep"
          }`}
        >
          {message}
        </p>
      )}
    </div>
  );
}

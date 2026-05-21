"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserSupabase } from "@/lib/supabase/client";
import { ProofreadButton } from "@/components/ProofreadButton";

type Props = {
  report: {
    id: string;
    text: string;
    category_id: string;
    terminal_id: string | null;
    status: string;
  };
  categories: { id: string; name: string }[];
  terminals: { id: string; name: string }[];
  /** True when a supervisor/manager is editing someone else's report. */
  isSupervisor?: boolean;
};

export function EditReportForm({
  report,
  categories,
  terminals,
  isSupervisor = false,
}: Props) {
  const supabase = createBrowserSupabase();
  const router = useRouter();
  const [text, setText] = useState(report.text);
  const [categoryId, setCategoryId] = useState(report.category_id);
  const [terminalId, setTerminalId] = useState(report.terminal_id ?? "");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // Only show "Submit" if the report is currently pending.
  // (Already-submitted reports can be edited but not re-submitted.)
  const canSubmit = report.status === "pending";

  async function update(submit: boolean) {
    setBusy(true);
    setMessage(null);
    try {
      const patch: Record<string, unknown> = {
        text: text.trim(),
        category_id: categoryId,
        terminal_id: terminalId || null,
        edited_at: new Date().toISOString(),
      };
      if (submit) {
        patch.status = "submitted";
        patch.submitted_at = new Date().toISOString();
      }
      const { error } = await supabase
        .from("reports")
        .update(patch)
        .eq("id", report.id);
      if (error) throw error;
      if (submit) {
        router.push("/reports/today");
        router.refresh();
      } else {
        setMessage("Saved.");
        router.refresh();
      }
    } catch (err: unknown) {
      setMessage(err instanceof Error ? err.message : "Could not update.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-4 space-y-3">
      {isSupervisor && (
        <div className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded p-2">
          Editing on behalf of another user. Your changes will be recorded in the audit log.
        </div>
      )}

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={6}
        className="w-full px-3.5 py-2.5 rounded-soft border border-slate-200 focus:outline-none focus:ring-2 focus:ring-morey-ocean/30 focus:border-morey-ocean text-sm"
      />
      <ProofreadButton
        value={text}
        onAccept={(v) => setText(v)}
        kind="report"
      />
      <div className="grid grid-cols-2 gap-2">
        <select
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className="px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-morey-ocean"
        >
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <select
          value={terminalId}
          onChange={(e) => setTerminalId(e.target.value)}
          className="px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-morey-ocean"
        >
          <option value="">Terminal…</option>
          {terminals.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
      </div>

      {message && (
        <p className="text-xs text-morey-deep bg-yellow-50 border border-yellow-200 rounded p-2">
          {message}
        </p>
      )}

      <div className="flex gap-2">
        <button
          onClick={() => update(false)}
          disabled={busy}
          className="flex-1 py-2 rounded-lg bg-white border border-gray-300 hover:bg-gray-50 disabled:opacity-60 font-medium text-morey-deep"
        >
          Save changes
        </button>
        {canSubmit && (
          <button
            onClick={() => update(true)}
            disabled={busy}
            className="flex-1 py-2 rounded-soft bg-morey-yellow text-morey-deep hover:bg-morey-yellowDark disabled:opacity-60 font-semibold transition shadow-sm"
          >
            Submit
          </button>
        )}
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";

type Props = {
  value: string;
  onAccept: (improved: string) => void;
  /** Document context, used in the prompt. */
  kind?: "report" | "supervisor_note" | "ai_summary";
  /** Compact variant fits inline next to a label. */
  compact?: boolean;
};

/**
 * Sparkle button that runs the current text through Claude and shows a
 * preview card with "Use this" / "Dismiss". Original text stays in the
 * field until the user accepts.
 */
export function ProofreadButton({
  value,
  onAccept,
  kind = "report",
  compact = false,
}: Props) {
  const [busy, setBusy] = useState(false);
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const empty = !value || value.trim().length === 0;

  async function run() {
    setBusy(true);
    setError(null);
    setSuggestion(null);
    try {
      const res = await fetch("/api/ai/proofread", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ text: value, kind }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || "Failed");
      setSuggestion(body.improved);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not proofread.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="w-full">
      <button
        type="button"
        onClick={run}
        disabled={empty || busy}
        title={empty ? "Write something first" : "AI proofread"}
        className={`inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-700 hover:border-morey-ocean hover:text-morey-ocean hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition ${
          compact ? "" : ""
        }`}
      >
        <SparkleIcon className="w-3.5 h-3.5" />
        {busy ? "Polishing…" : "AI proofread"}
      </button>

      {error && (
        <p className="mt-2 text-xs text-red-700 bg-red-50 border border-red-200 rounded p-2">
          {error}
        </p>
      )}

      {suggestion && (
        <div className="mt-2 rounded-lg border border-morey-ocean/30 bg-sky-50/60 p-3 space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-morey-ocean">
            <SparkleIcon className="w-3.5 h-3.5" />
            Suggested edit
          </div>
          <p className="text-sm text-slate-800 whitespace-pre-wrap break-words">
            {suggestion}
          </p>
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={() => {
                onAccept(suggestion);
                setSuggestion(null);
              }}
              className="px-3 py-1 rounded-md bg-morey-deep text-white text-xs font-semibold hover:opacity-90"
            >
              Use this
            </button>
            <button
              type="button"
              onClick={() => setSuggestion(null)}
              className="px-3 py-1 rounded-md bg-white border border-slate-200 text-xs text-slate-700 hover:bg-slate-50"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function SparkleIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M12 2l1.6 4.6L18.2 8 13.6 9.4 12 14l-1.6-4.6L5.8 8l4.6-1.4L12 2z" />
      <path
        d="M19 14l.9 2.5L22.4 17 19.9 17.9 19 20.4 18.1 17.9 15.6 17l2.5-.5L19 14z"
        opacity="0.7"
      />
    </svg>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserSupabase } from "@/lib/supabase/client";
import { Trash2 } from "lucide-react";

type Props = {
  reportId: string;
  caseNumber?: string;
  /** If set, redirect here after a successful delete; otherwise refresh. */
  redirectTo?: string;
  /** "button" is a full-width labeled button; "icon" is a small trash icon. */
  variant?: "button" | "icon";
};

export function DeleteReportButton({
  reportId,
  caseNumber,
  redirectTo,
  variant = "button",
}: Props) {
  const supabase = createBrowserSupabase();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    const label = caseNumber ? ` (${caseNumber})` : "";
    if (
      !window.confirm(
        `Delete this report${label}? This cannot be undone.`,
      )
    ) {
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const { error: e } = await supabase
        .from("reports")
        .delete()
        .eq("id", reportId);
      if (e) throw e;
      if (redirectTo) {
        router.push(redirectTo);
      } else {
        router.refresh();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete.");
    } finally {
      setBusy(false);
    }
  }

  if (variant === "icon") {
    return (
      <button
        onClick={handleDelete}
        disabled={busy}
        className="text-red-600 hover:text-red-800 p-1 transition disabled:opacity-40"
        title={
          error
            ? `Delete failed: ${error}`
            : busy
              ? "Deleting…"
              : "Delete report"
        }
        aria-label="Delete report"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    );
  }

  return (
    <div>
      <button
        onClick={handleDelete}
        disabled={busy}
        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md bg-red-50 border border-red-200 text-red-700 text-sm font-medium hover:bg-red-100 disabled:opacity-50 transition"
      >
        <Trash2 className="w-3.5 h-3.5" />
        {busy ? "Deleting…" : "Delete report"}
      </button>
      {error && (
        <p className="mt-2 text-xs text-red-700 bg-red-50 border border-red-200 rounded p-2">
          {error}
        </p>
      )}
    </div>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserSupabase } from "@/lib/supabase/client";

export function AutomationClient({
  initialEnabled,
  lastChangedAt,
}: {
  initialEnabled: boolean;
  lastChangedAt: string | null;
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
            key: "automation_enabled",
            value: next,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "key" },
        );
      if (error) throw error;
      setEnabled(next);
      setMessage(next ? "Automation enabled." : "Automation disabled.");
      setMessageOk(true);
      router.refresh();
    } catch (err: unknown) {
      setMessage(
        err instanceof Error ? err.message : "Could not update setting.",
      );
      setMessageOk(false);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section
      className={`rounded-bubble shadow p-5 border-2 ${
        enabled ? "bg-green-50 border-green-200" : "bg-gray-50 border-gray-200"
      }`}
    >
      <div className="flex items-center gap-4">
        <div
          className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl ${
            enabled ? "bg-green-500 text-white" : "bg-gray-400 text-white"
          }`}
        >
          {enabled ? "✓" : "✕"}
        </div>
        <div className="flex-1">
          <div className="text-lg font-semibold text-morey-deep">
            {enabled ? "Automation is ON" : "Automation is OFF"}
          </div>
          <div className="text-xs text-gray-500">
            {enabled
              ? "Overnight lock + fallback jobs will run."
              : "Overnight jobs are paused (seasonal off-mode)."}
            {lastChangedAt && (
              <span className="ml-1">
                Last changed {new Date(lastChangedAt).toLocaleString()}.
              </span>
            )}
          </div>
        </div>
        <button
          onClick={() => toggle(!enabled)}
          disabled={busy}
          className={`px-4 py-2 rounded-lg text-sm font-semibold disabled:opacity-60 ${
            enabled
              ? "bg-gray-200 text-morey-deep hover:bg-gray-300"
              : "bg-beacon-navy text-white hover:bg-beacon-charcoal"
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
              : "bg-yellow-50 border-yellow-200 text-morey-deep"
          }`}
        >
          {message}
        </p>
      )}
    </section>
  );
}

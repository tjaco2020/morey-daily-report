"use client";

import { useEffect, useState } from "react";
import { createBrowserSupabase } from "@/lib/supabase/client";
import { todayLocal } from "@/lib/format";
import type { Terminal } from "@/lib/types";

type Props = {
  userId: string;
  onReady: () => void;
};

/**
 * Blocks the page until the user has a daily_sessions row for today.
 * Shows a centered card that asks for: scheduled start, scheduled end, terminal.
 */
export function SessionGate({ userId, onReady }: Props) {
  const supabase = createBrowserSupabase();
  const [checking, setChecking] = useState(true);
  const [needsSession, setNeedsSession] = useState(false);
  const [terminals, setTerminals] = useState<Terminal[]>([]);
  const [terminalId, setTerminalId] = useState<string>("");
  const [start, setStart] = useState("09:00");
  const [end, setEnd] = useState("17:00");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const today = todayLocal();
      const { data, error: e } = await supabase
        .from("daily_sessions")
        .select("id")
        .eq("user_id", userId)
        .eq("session_date", today)
        .maybeSingle();
      if (cancelled) return;
      if (e) {
        setError(e.message);
        setChecking(false);
        return;
      }
      if (data) {
        setNeedsSession(false);
        setChecking(false);
        onReady();
      } else {
        // Need to collect session info — also fetch terminals.
        const { data: terms } = await supabase
          .from("terminals")
          .select("id, name, active, display_order:created_at")
          .eq("active", true)
          .order("name");
        if (cancelled) return;
        setTerminals(
          ((terms ?? []) as unknown as Terminal[]).map((t) => ({
            id: t.id,
            name: t.name,
            active: t.active,
          })),
        );
        setNeedsSession(true);
        setChecking(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [supabase, userId, onReady]);

  async function save() {
    setSubmitting(true);
    setError(null);
    try {
      const { error: e } = await supabase.from("daily_sessions").insert({
        user_id: userId,
        session_date: todayLocal(),
        scheduled_start: start || null,
        scheduled_end: end || null,
        terminal_id: terminalId || null,
        device_info: {
          ua: typeof navigator !== "undefined" ? navigator.userAgent : null,
          platform:
            typeof navigator !== "undefined" ? navigator.platform : null,
        },
      });
      if (e) throw e;
      setNeedsSession(false);
      onReady();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Could not save.";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  }

  if (checking) {
    return (
      <div className="fixed inset-0 z-40 flex items-center justify-center bg-white/70 backdrop-blur-sm">
        <div className="text-sm text-gray-500">Checking your shift…</div>
      </div>
    );
  }
  if (!needsSession) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-white rounded-bubble shadow-bubble p-6">
        <h2 className="text-xl font-bold text-morey-deep">Good morning!</h2>
        <p className="text-sm text-gray-500 mt-1">
          Set your shift before you start logging reports.
        </p>

        <div className="grid grid-cols-2 gap-3 mt-5">
          <div>
            <label className="block text-sm font-medium mb-1">Scheduled start</label>
            <input
              type="time"
              value={start}
              onChange={(e) => setStart(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-morey-ocean"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Scheduled end</label>
            <input
              type="time"
              value={end}
              onChange={(e) => setEnd(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-morey-ocean"
            />
          </div>
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium mb-1">Terminal / Location</label>
          <select
            value={terminalId}
            onChange={(e) => setTerminalId(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-morey-ocean"
          >
            <option value="">— select —</option>
            {terminals.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>

        {error && (
          <p className="mt-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded p-2">
            {error}
          </p>
        )}

        <button
          onClick={save}
          disabled={submitting || !terminalId}
          className="mt-5 w-full py-2.5 rounded-soft bg-beacon-navy text-white font-semibold hover:bg-beacon-charcoal disabled:opacity-60 transition shadow-sm"
        >
          {submitting ? "Saving…" : "Start my shift"}
        </button>
      </div>
    </div>
  );
}

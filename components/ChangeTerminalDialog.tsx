"use client";

import { useEffect, useState } from "react";
import { createBrowserSupabase } from "@/lib/supabase/client";
import { todayLocal } from "@/lib/format";
import { X, MapPin, Loader2, Check } from "lucide-react";

type Terminal = {
  id: string;
  name: string;
};

type Props = {
  open: boolean;
  onClose: () => void;
  /** Called after a successful save with the new terminal id. */
  onSaved?: (terminalId: string | null, terminalName: string | null) => void;
};

/**
 * Modal that lets the current user change their terminal mid-shift.
 * Writes to daily_sessions.terminal_id for today via /api/shift/terminal.
 */
export function ChangeTerminalDialog({ open, onClose, onSaved }: Props) {
  const supabase = createBrowserSupabase();
  const [terminals, setTerminals] = useState<Terminal[]>([]);
  const [currentId, setCurrentId] = useState<string>("");
  const [picked, setPicked] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        // Load active terminals
        const { data: terms } = await supabase
          .from("terminals")
          .select("id, name")
          .eq("active", true)
          .order("name");
        if (cancelled) return;
        setTerminals((terms ?? []) as Terminal[]);

        // Load the current shift's terminal
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user || cancelled) return;
        const { data: session } = await supabase
          .from("daily_sessions")
          .select("terminal_id")
          .eq("user_id", user.id)
          .eq("session_date", todayLocal())
          .maybeSingle();
        if (cancelled) return;
        setCurrentId(session?.terminal_id ?? "");
        setPicked(session?.terminal_id ?? "");
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Could not load terminals.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, supabase]);

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/shift/terminal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ terminal_id: picked || null }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Could not save.");
      const name =
        terminals.find((t) => t.id === picked)?.name ?? null;
      onSaved?.(picked || null, name);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save.");
    } finally {
      setSaving(false);
    }
  }

  if (!open) return null;
  const dirty = picked !== currentId;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-white rounded-bubble shadow-bubble p-5 animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-beacon-tealSoft flex items-center justify-center">
              <MapPin className="w-4 h-4 text-beacon-tealDark" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-beacon-navy">
                Change terminal
              </h2>
              <p className="text-xs text-beacon-mid mt-0.5">
                Pick the POS / location you&rsquo;re working at now.
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

        {loading ? (
          <div className="flex items-center justify-center py-8 text-sm text-beacon-mid gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            Loading terminals…
          </div>
        ) : (
          <div className="mt-2 max-h-72 overflow-y-auto rounded-md border border-beacon-line">
            {terminals.length === 0 && (
              <div className="p-4 text-sm text-beacon-mid">
                No active terminals. Ask a manager to add some under Admin →
                Terminals.
              </div>
            )}
            {terminals.map((t) => {
              const isCurrent = t.id === currentId;
              const isPicked = t.id === picked;
              return (
                <button
                  key={t.id}
                  onClick={() => setPicked(t.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 text-sm text-left border-b border-beacon-line/60 last:border-b-0 transition ${
                    isPicked
                      ? "bg-beacon-tealSoft text-beacon-navy"
                      : "bg-white hover:bg-beacon-line/40 text-beacon-navy"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-beacon-mid" />
                    {t.name}
                    {isCurrent && (
                      <span className="text-[10px] uppercase tracking-wider text-beacon-mid font-medium ml-1">
                        current
                      </span>
                    )}
                  </span>
                  {isPicked && (
                    <Check className="w-4 h-4 text-beacon-tealDark" />
                  )}
                </button>
              );
            })}
          </div>
        )}

        {error && (
          <p className="mt-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded p-2">
            {error}
          </p>
        )}

        <div className="flex gap-2 mt-4">
          <button
            onClick={onClose}
            className="flex-1 py-2 rounded-soft border border-beacon-line text-beacon-navy hover:bg-beacon-line/40 text-sm transition"
          >
            Cancel
          </button>
          <button
            onClick={save}
            disabled={saving || !dirty}
            className="flex-[1.5] py-2 rounded-soft bg-beacon-navy text-white text-sm font-semibold hover:bg-beacon-charcoal disabled:opacity-50 transition shadow-sm flex items-center justify-center gap-1.5"
          >
            {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {saving ? "Saving…" : dirty ? "Switch to this terminal" : "No change"}
          </button>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { createBrowserSupabase } from "@/lib/supabase/client";
import { todayLocal } from "@/lib/format";
import type { Category, Terminal } from "@/lib/types";

/**
 * Quick PIN report mode.
 * Public page (not gated by auth). Anyone with a valid PIN can submit a report.
 * Best for POS terminals where signing in is friction.
 */
export default function QuickPage() {
  const supabase = createBrowserSupabase();
  const [pin, setPin] = useState("");
  const [text, setText] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [terminalId, setTerminalId] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [terminals, setTerminals] = useState<Terminal[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [lastCase, setLastCase] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const [{ data: cats }, { data: terms }] = await Promise.all([
        supabase
          .from("categories")
          .select("id, name, display_order, active")
          .eq("active", true)
          .order("display_order"),
        supabase
          .from("terminals")
          .select("id, name, active")
          .eq("active", true)
          .order("name"),
      ]);
      setCategories((cats ?? []) as Category[]);
      setTerminals((terms ?? []) as Terminal[]);
    })();
  }, [supabase]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMessage(null);
    setLastCase(null);
    try {
      if (!/^[0-9]{4,6}$/.test(pin)) {
        throw new Error("PIN must be 4–6 digits.");
      }
      if (!text.trim()) throw new Error("Report text required.");
      if (!categoryId) throw new Error("Category required.");

      const { data, error } = await supabase.rpc("pin_create_report", {
        p_pin: pin,
        p_text: text.trim(),
        p_category_id: categoryId,
        p_terminal_id: terminalId || null,
        p_report_date: todayLocal(),
        p_submit: true,
        p_device_user_id: null,
      });
      if (error) throw error;
      const row = Array.isArray(data) ? data[0] : data;
      setLastCase(row?.case_number ?? null);
      setMessage("Submitted. Thanks!");
      setText("");
      setPin("");
    } catch (err: unknown) {
      setMessage(err instanceof Error ? err.message : "Could not submit.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-white rounded-bubble shadow-bubble p-6 sm:p-8">
        <div className="text-center mb-5">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-morey-yellow to-morey-orange text-morey-deep text-xl font-extrabold shadow-bubble">
            M
          </div>
          <h1 className="text-2xl font-bold text-morey-deep mt-3">
            Quick PIN report
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Punch your PIN, write a quick note, hit submit. No sign-in needed.
          </p>
        </div>

        <form onSubmit={submit} className="space-y-3">
          <div>
            <label className="block text-sm font-medium mb-1">PIN</label>
            <input
              type="password"
              inputMode="numeric"
              pattern="[0-9]*"
              value={pin}
              onChange={(e) =>
                setPin(e.target.value.replace(/\D/g, "").slice(0, 6))
              }
              className="w-full px-3 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-morey-ocean text-xl tracking-widest text-center"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Report</label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={4}
              placeholder="What happened?"
              className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-morey-ocean resize-y"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-morey-ocean"
            >
              <option value="">Category…</option>
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
            <p
              className={`text-sm rounded p-2 border ${
                lastCase
                  ? "bg-green-50 border-green-200 text-green-800"
                  : "bg-yellow-50 border-yellow-200 text-morey-deep"
              }`}
            >
              {message}
              {lastCase && (
                <span className="block font-mono text-xs mt-1">{lastCase}</span>
              )}
            </p>
          )}

          <button
            type="submit"
            disabled={busy}
            className="w-full py-3 rounded-soft bg-morey-yellow text-morey-deep font-semibold hover:bg-morey-yellowDark disabled:opacity-60 transition shadow-sm"
          >
            {busy ? "Submitting…" : "Submit report"}
          </button>
        </form>
      </div>
    </main>
  );
}

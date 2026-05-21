"use client";

import { useEffect, useRef, useState } from "react";
import { createBrowserSupabase } from "@/lib/supabase/client";
import { todayLocal } from "@/lib/format";
import type { Category, Terminal } from "@/lib/types";
import { MessageSquare, X, ExternalLink, Sparkles } from "lucide-react";

const COLLAPSED = { w: 88, h: 88 };
const EXPANDED = { w: 460, h: 740 };

/**
 * The widget intended to be embedded inside other internal Morey's tools
 * via the /embed/widget iframe. Always operates in PIN mode (since users
 * on host sites aren't signed in to this app), and surfaces deep-links to
 * open the full Daily Report app in a new tab.
 *
 * Sends postMessage('morey-widget-resize') to the host page so the
 * iframe can resize between collapsed and expanded states.
 */
export function EmbeddedWidget() {
  const supabase = createBrowserSupabase();
  const [open, setOpen] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [terminals, setTerminals] = useState<Terminal[]>([]);

  const [pin, setPin] = useState("");
  const [text, setText] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [terminalId, setTerminalId] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [messageOk, setMessageOk] = useState(false);
  const [lastCase, setLastCase] = useState<string | null>(null);

  const appOrigin = useRef<string>("");

  useEffect(() => {
    // Remember the iframe's own origin — the host opens links to that origin.
    appOrigin.current = window.location.origin;

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

  // Tell the host page to resize the iframe when we collapse / expand
  useEffect(() => {
    if (window.parent === window) return; // not in iframe
    const size = open ? EXPANDED : COLLAPSED;
    window.parent.postMessage(
      { type: "morey-widget-resize", width: size.w, height: size.h },
      "*",
    );
  }, [open]);

  function showMsg(m: string, ok: boolean) {
    setMessage(m);
    setMessageOk(ok);
  }

  async function submit(submitFlag: boolean) {
    if (!/^[0-9]{4,6}$/.test(pin))
      return showMsg("PIN must be 4–6 digits.", false);
    if (!text.trim()) return showMsg("Add some text first.", false);
    if (!categoryId) return showMsg("Pick a category.", false);

    setSubmitting(true);
    setMessage(null);
    setLastCase(null);
    try {
      const { data, error } = await supabase.rpc("pin_create_report", {
        p_pin: pin,
        p_text: text.trim(),
        p_category_id: categoryId,
        p_terminal_id: terminalId || null,
        p_report_date: todayLocal(),
        p_submit: submitFlag,
        p_device_user_id: null,
      });
      if (error) throw error;
      const row = Array.isArray(data) ? data[0] : data;
      setLastCase(row?.case_number ?? null);
      showMsg(
        `${submitFlag ? "Submitted" : "Saved as draft"} under ${row?.user_name ?? "your account"}`,
        true,
      );
      setText("");
      setPin("");
    } catch (err: unknown) {
      let m = "Could not save.";
      if (err instanceof Error) m = err.message;
      else if (err && typeof err === "object") {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const e = err as any;
        m = e.message ?? e.details ?? JSON.stringify(err);
      }
      showMsg(m, false);
    } finally {
      setSubmitting(false);
    }
  }

  // Render
  return (
    <>
      {/* Bubble (collapsed state) */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          aria-label="Open Morey's Daily Report"
          className="fixed bottom-3 right-3 w-16 h-16 rounded-full bg-morey-yellow text-morey-deep shadow-bubble flex items-center justify-center hover:scale-105 active:scale-95 transition-all duration-200 animate-pulse-soft"
        >
          <MessageSquare className="w-7 h-7" strokeWidth={2.2} />
        </button>
      )}

      {/* Panel (expanded state) */}
      {open && (
        <div className="fixed bottom-3 right-3 w-[min(95vw,440px)] h-[min(95vh,720px)] bg-white rounded-bubble shadow-panel border border-slate-100 overflow-hidden flex flex-col animate-slide-up">
          {/* Header */}
          <div className="bg-gradient-to-br from-morey-deep to-[#1E293B] text-white px-5 py-4 flex items-start justify-between shrink-0">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-morey-yellow to-morey-orange text-morey-deep flex items-center justify-center text-xs font-extrabold">
                  M
                </div>
                <div>
                  <div className="text-xs font-medium text-white/60 uppercase tracking-wider">
                    Daily Report
                  </div>
                  <div className="font-semibold text-sm">Quick log</div>
                </div>
              </div>
            </div>
            <button
              onClick={() => {
                setOpen(false);
                setMessage(null);
                setLastCase(null);
              }}
              className="text-white/70 hover:text-white p-1 -m-1 rounded transition"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Scrollable content */}
          <div className="flex-1 overflow-y-auto p-5 space-y-3">
            <div>
              <label className="block text-xs font-medium text-morey-mid mb-1.5">
                Your PIN
              </label>
              <input
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                value={pin}
                onChange={(e) =>
                  setPin(e.target.value.replace(/\D/g, "").slice(0, 6))
                }
                placeholder="4–6 digit PIN"
                className="w-full px-3.5 py-2.5 rounded-soft border border-slate-200 focus:outline-none focus:ring-2 focus:ring-morey-yellow/40 focus:border-morey-yellow text-base tracking-widest text-center bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-morey-mid mb-1.5">
                Report
              </label>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="What's happening?"
                rows={5}
                className="w-full px-3.5 py-2.5 rounded-soft border border-slate-200 focus:outline-none focus:ring-2 focus:ring-morey-yellow/40 focus:border-morey-yellow text-sm resize-y"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="px-3 py-2 rounded-soft border border-slate-200 focus:outline-none focus:ring-2 focus:ring-morey-yellow/40 text-sm bg-white"
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
                className="px-3 py-2 rounded-soft border border-slate-200 focus:outline-none focus:ring-2 focus:ring-morey-yellow/40 text-sm bg-white"
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
              <div
                className={`text-xs rounded-md p-2.5 border ${
                  messageOk
                    ? "bg-green-50 border-green-200 text-green-800"
                    : "bg-amber-50 border-amber-200 text-amber-900"
                }`}
              >
                <div className="flex items-center gap-1.5">
                  {messageOk && <Sparkles className="w-3.5 h-3.5" />}
                  {message}
                </div>
                {lastCase && (
                  <div className="font-mono text-[10px] mt-1 opacity-80">
                    {lastCase}
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-2 pt-1">
              <button
                onClick={() => submit(false)}
                disabled={submitting}
                className="flex-1 py-2.5 rounded-soft bg-white border border-slate-200 hover:bg-slate-50 disabled:opacity-50 font-medium text-morey-deep text-sm transition"
              >
                Save as draft
              </button>
              <button
                onClick={() => submit(true)}
                disabled={submitting}
                className="flex-1 py-2.5 rounded-soft bg-morey-yellow text-morey-deep hover:bg-morey-yellowDark disabled:opacity-50 font-semibold text-sm transition shadow-sm"
              >
                Submit
              </button>
            </div>

            {/* Divider */}
            <div className="my-3 border-t border-slate-100" />

            {/* Open-full-app links */}
            <div>
              <div className="text-[11px] font-medium uppercase tracking-wider text-morey-mid mb-2">
                Open in app
              </div>
              <div className="grid grid-cols-2 gap-2">
                <OpenAppLink href="/dashboard" label="Dashboard" />
                <OpenAppLink href="/reports/today" label="My reports" />
                <OpenAppLink href="/supervisor" label="Supervisor" />
                <OpenAppLink href="/admin" label="Admin" />
              </div>
              <p className="text-[10px] text-morey-mid mt-2 leading-tight">
                Opens in a new tab. Sign in if prompted — supervisor and admin
                require the right role.
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function OpenAppLink({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="flex items-center justify-between gap-1 px-3 py-2 rounded-soft border border-slate-200 hover:border-morey-yellow hover:bg-morey-yellowSoft transition text-sm text-morey-deep"
    >
      <span>{label}</span>
      <ExternalLink className="w-3.5 h-3.5 text-morey-mid" />
    </a>
  );
}

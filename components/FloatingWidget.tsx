"use client";

import { useEffect, useState } from "react";
import { createBrowserSupabase } from "@/lib/supabase/client";
import { todayLocal } from "@/lib/format";
import type { Category } from "@/lib/types";
import Link from "next/link";
import { ProofreadButton } from "./ProofreadButton";

type Props = {
  userId: string;
};

type SessionInfo = {
  terminal_id: string | null;
  terminal_name: string | null;
};

export function FloatingWidget({ userId }: Props) {
  const supabase = createBrowserSupabase();
  const [open, setOpen] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [session, setSession] = useState<SessionInfo>({
    terminal_id: null,
    terminal_name: null,
  });
  const [todayCount, setTodayCount] = useState(0);

  // Form state
  const [text, setText] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [showPinOverride, setShowPinOverride] = useState(false);
  const [overridePin, setOverridePin] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [messageOk, setMessageOk] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [{ data: cats }, sessRes, countRes] = await Promise.all([
        supabase
          .from("categories")
          .select("id, name, display_order, active")
          .eq("active", true)
          .order("display_order"),
        supabase
          .from("daily_sessions")
          .select("terminal_id, terminals(name)")
          .eq("user_id", userId)
          .eq("session_date", todayLocal())
          .maybeSingle(),
        supabase
          .from("reports")
          .select("id", { count: "exact", head: true })
          .eq("user_id", userId)
          .eq("report_date", todayLocal()),
      ]);
      if (cancelled) return;
      setCategories((cats ?? []) as Category[]);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const sessData = sessRes.data as any;
      setSession({
        terminal_id: sessData?.terminal_id ?? null,
        terminal_name: sessData?.terminals?.name ?? null,
      });
      setTodayCount(countRes.count ?? 0);
    })();
    return () => {
      cancelled = true;
    };
  }, [supabase, userId]);

  function showMsg(msg: string, ok: boolean) {
    setMessage(msg);
    setMessageOk(ok);
  }

  async function save(submit: boolean) {
    if (!text.trim()) return showMsg("Add some text first.", false);
    if (!categoryId) return showMsg("Pick a category.", false);
    if (showPinOverride && !/^[0-9]{4,6}$/.test(overridePin)) {
      return showMsg("Override PIN must be 4–6 digits.", false);
    }

    setSubmitting(true);
    setMessage(null);
    try {
      if (showPinOverride && overridePin) {
        const { data, error } = await supabase.rpc("pin_create_report", {
          p_pin: overridePin,
          p_text: text.trim(),
          p_category_id: categoryId,
          p_terminal_id: session.terminal_id,
          p_report_date: todayLocal(),
          p_submit: submit,
          p_device_user_id: userId,
        });
        if (error) throw error;
        const row = Array.isArray(data) ? data[0] : data;
        const who = row?.user_name ?? "another user";
        showMsg(
          `${submit ? "Submitted" : "Saved as pending"} under ${who} • Case ${row?.case_number}`,
          true,
        );
        setText("");
        setOverridePin("");
        setShowPinOverride(false);
      } else {
        const insert = {
          user_id: userId,
          category_id: categoryId,
          terminal_id: session.terminal_id,
          report_date: todayLocal(),
          text: text.trim(),
          status: submit ? "submitted" : "pending",
          submitted_at: submit ? new Date().toISOString() : null,
        } as const;
        const { data, error } = await supabase
          .from("reports")
          .insert(insert)
          .select("case_number")
          .single();
        if (error) throw error;
        setTodayCount((c) => c + 1);
        showMsg(
          `${submit ? "Submitted" : "Saved as pending"} • Case ${data?.case_number}`,
          true,
        );
        setText("");
      }
    } catch (err: unknown) {
      let msg = "Could not save.";
      if (err instanceof Error) msg = err.message;
      else if (err && typeof err === "object") {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const e = err as any;
        msg = e.message ?? e.details ?? e.hint ?? JSON.stringify(err);
      }
      // eslint-disable-next-line no-console
      console.error("FloatingWidget save error:", err);
      showMsg(msg, false);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      {/* Floating bubble — beAcon navy with teal signal */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-30 w-14 h-14 rounded-full bg-beacon-navy text-beacon-teal shadow-bubble flex items-center justify-center hover:scale-105 active:scale-95 transition-all duration-200 animate-pulse-soft border border-beacon-charcoal"
          aria-label="Log a report"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-6 h-6"
          >
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          {todayCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-beacon-gold text-beacon-navy text-[11px] font-bold rounded-full px-1.5 py-0.5 shadow min-w-[20px] text-center border border-beacon-navy/20">
              {todayCount}
            </span>
          )}
        </button>
      )}

      {/* Expanded panel */}
      {open && (
        <div className="fixed bottom-6 right-6 z-30 w-[min(92vw,440px)] bg-white rounded-bubble shadow-panel border border-slate-100 overflow-hidden animate-slide-up">
          {/* Header */}
          <div className="bg-gradient-to-br from-morey-deep to-[#1E293B] text-white px-5 py-4 flex items-start justify-between">
            <div>
              <div className="text-xs font-medium text-white/60 uppercase tracking-wider">
                New report
              </div>
              <div className="font-semibold text-base mt-0.5">
                {todayCount === 0
                  ? "Log your first today"
                  : `${todayCount} logged today`}
              </div>
            </div>
            <button
              onClick={() => {
                setOpen(false);
                setMessage(null);
                setShowPinOverride(false);
                setOverridePin("");
              }}
              className="text-white/70 hover:text-white text-xl leading-none p-1 -m-1 rounded transition-colors"
              aria-label="Close"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                className="w-4 h-4"
              >
                <path strokeLinecap="round" d="M6 6l12 12M6 18L18 6" />
              </svg>
            </button>
          </div>

          {/* Shift terminal chip */}
          <div className="bg-slate-50/80 px-5 py-2.5 text-xs text-morey-mid border-b border-slate-100 flex items-center gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-3.5 h-3.5 text-morey-ocean"
            >
              <path d="M12 2a7 7 0 0 0-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 0 0-7-7zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5z" />
            </svg>
            Logging from{" "}
            <strong className="text-morey-deep">
              {session.terminal_name ?? "(no terminal set)"}
            </strong>
          </div>

          <div className="p-5 space-y-3">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="What's happening? Save now and add details later."
              rows={5}
              className="w-full px-3.5 py-2.5 rounded-soft border border-slate-200 focus:outline-none focus:ring-2 focus:ring-morey-ocean/30 focus:border-morey-ocean placeholder:text-slate-400 resize-y text-sm transition"
            />

            <ProofreadButton
              value={text}
              onAccept={(v) => setText(v)}
              kind="report"
            />

            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-soft border border-slate-200 focus:outline-none focus:ring-2 focus:ring-morey-ocean/30 focus:border-morey-ocean text-sm bg-white"
            >
              <option value="">Category…</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>

            {/* PIN override (collapsible) */}
            {!showPinOverride ? (
              <button
                type="button"
                onClick={() => setShowPinOverride(true)}
                className="text-xs text-morey-ocean hover:text-morey-deep transition-colors inline-flex items-center gap-1"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="w-3 h-3"
                >
                  <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
                </svg>
                Log as someone else (PIN override)
              </button>
            ) : (
              <div className="border border-amber-200 bg-amber-50/50 rounded-soft p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-morey-deep">
                    PIN of person logging this report
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setShowPinOverride(false);
                      setOverridePin("");
                    }}
                    className="text-xs text-morey-mid hover:underline"
                  >
                    Cancel
                  </button>
                </div>
                <input
                  type="password"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={overridePin}
                  onChange={(e) =>
                    setOverridePin(e.target.value.replace(/\D/g, "").slice(0, 6))
                  }
                  placeholder="4–6 digit PIN"
                  autoComplete="off"
                  className="w-full px-3 py-2 rounded-md border border-amber-300 bg-white focus:outline-none focus:ring-2 focus:ring-morey-ocean/30 text-base tracking-widest"
                />
                <p className="text-[11px] text-amber-900/80 leading-tight">
                  Report will be filed under that person&apos;s account from
                  this terminal. They can review it from their own dashboard.
                </p>
              </div>
            )}

            {message && (
              <p
                className={`text-xs rounded-md p-2.5 border ${
                  messageOk
                    ? "bg-green-50 border-green-200 text-green-800"
                    : "bg-amber-50 border-amber-200 text-amber-900"
                }`}
              >
                {message}
              </p>
            )}

            <div className="flex gap-2 pt-1">
              <button
                onClick={() => save(false)}
                disabled={submitting}
                className="flex-1 py-2.5 rounded-soft bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 disabled:opacity-50 font-medium text-morey-deep text-sm transition"
              >
                Save as draft
              </button>
              <button
                onClick={() => save(true)}
                disabled={submitting}
                className="flex-1 py-2.5 rounded-soft bg-morey-yellow text-morey-deep hover:bg-morey-yellowDark disabled:opacity-50 font-semibold text-sm transition shadow-sm"
              >
                Submit
              </button>
            </div>

            <div className="flex items-center justify-between text-xs text-morey-mid pt-1">
              <Link
                href="/reports/today"
                className="text-morey-ocean hover:text-morey-deep transition-colors"
                onClick={() => setOpen(false)}
              >
                View today&apos;s reports →
              </Link>
              <Link
                href="/account/pin"
                className="hover:underline"
                onClick={() => setOpen(false)}
              >
                Set PIN
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

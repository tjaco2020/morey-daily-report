"use client";

import { useState } from "react";
import Link from "next/link";
import { createBrowserSupabase } from "@/lib/supabase/client";

export default function PinPage() {
  const supabase = createBrowserSupabase();
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSuccess(false);
    setMessage(null);
    if (!/^[0-9]{4,6}$/.test(pin)) {
      setMessage("PIN must be 4–6 digits.");
      return;
    }
    if (pin !== confirmPin) {
      setMessage("PINs don't match.");
      return;
    }
    setBusy(true);
    try {
      const { error } = await supabase.rpc("set_my_pin", { p_pin: pin });
      if (error) throw error;
      setSuccess(true);
      setMessage("PIN saved.");
      setPin("");
      setConfirmPin("");
    } catch (err: unknown) {
      setMessage(err instanceof Error ? err.message : "Could not save PIN.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen p-6 sm:p-10">
      <div className="max-w-md mx-auto">
        <Link
          href="/dashboard"
          className="text-sm text-morey-ocean hover:underline"
        >
          ← Dashboard
        </Link>
        <div className="bg-white rounded-bubble shadow p-6 mt-4">
          <h1 className="text-xl font-bold text-morey-deep">Your PIN</h1>
          <p className="text-sm text-gray-500 mt-1">
            Used at POS / Quick PIN mode for fast report entry. 4–6 digits.
          </p>

          <form onSubmit={save} className="space-y-3 mt-4">
            <div>
              <label className="block text-sm font-medium mb-1">New PIN</label>
              <input
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                value={pin}
                onChange={(e) =>
                  setPin(e.target.value.replace(/\D/g, "").slice(0, 6))
                }
                className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-morey-ocean tracking-widest text-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Confirm PIN</label>
              <input
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                value={confirmPin}
                onChange={(e) =>
                  setConfirmPin(e.target.value.replace(/\D/g, "").slice(0, 6))
                }
                className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-morey-ocean tracking-widest text-lg"
              />
            </div>

            {message && (
              <p
                className={`text-sm rounded p-2 border ${
                  success
                    ? "bg-green-50 border-green-200 text-green-800"
                    : "bg-yellow-50 border-yellow-200 text-morey-deep"
                }`}
              >
                {message}
              </p>
            )}

            <button
              type="submit"
              disabled={busy}
              className="w-full py-2.5 rounded-soft bg-morey-yellow text-morey-deep font-semibold hover:bg-morey-yellowDark disabled:opacity-60 transition shadow-sm"
            >
              {busy ? "Saving…" : "Save PIN"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}

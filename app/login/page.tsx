"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserSupabase } from "@/lib/supabase/client";

export default function LoginPage() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createBrowserSupabase();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: fullName } },
        });
        if (error) throw error;
        setMessage(
          "Account created. If email confirmation is enabled, check your inbox. Otherwise sign in now.",
        );
        setMode("signin");
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        router.push("/dashboard");
        router.refresh();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Something went wrong.";
      setMessage(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-bubble shadow-card border border-slate-100 p-8 animate-fade-in">
          <div className="mb-7 text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-morey-yellow to-morey-orange text-morey-deep text-2xl font-extrabold shadow-bubble">
              M
            </div>
            <h1 className="mt-5 text-2xl font-semibold tracking-tight text-morey-deep">
              Morey&apos;s Daily Report
            </h1>
            <p className="text-sm text-morey-mid mt-1">
              {mode === "signin"
                ? "Sign in to continue"
                : "Create your staff account"}
            </p>
          </div>

          <form onSubmit={onSubmit} className="space-y-3.5">
            {mode === "signup" && (
              <div>
                <label className="block text-xs font-medium text-morey-mid mb-1.5">
                  Full name
                </label>
                <input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 rounded-soft border border-slate-200 focus:outline-none focus:ring-2 focus:ring-morey-ocean/30 focus:border-morey-ocean text-sm transition"
                />
              </div>
            )}
            <div>
              <label className="block text-xs font-medium text-morey-mid mb-1.5">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="w-full px-3.5 py-2.5 rounded-soft border border-slate-200 focus:outline-none focus:ring-2 focus:ring-morey-ocean/30 focus:border-morey-ocean text-sm transition"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-morey-mid mb-1.5">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                autoComplete={
                  mode === "signin" ? "current-password" : "new-password"
                }
                className="w-full px-3.5 py-2.5 rounded-soft border border-slate-200 focus:outline-none focus:ring-2 focus:ring-morey-ocean/30 focus:border-morey-ocean text-sm transition"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-soft bg-morey-yellow text-morey-deep font-semibold text-sm hover:bg-morey-yellowDark disabled:opacity-50 transition shadow-sm mt-2"
            >
              {loading
                ? "Working…"
                : mode === "signin"
                  ? "Sign in"
                  : "Create account"}
            </button>
          </form>

          {message && (
            <p className="mt-4 text-sm text-center text-morey-deep bg-amber-50 border border-amber-200 rounded-md p-2.5">
              {message}
            </p>
          )}

          <p className="mt-6 text-center text-sm text-morey-mid">
            {mode === "signin"
              ? "Don't have an account?"
              : "Already have an account?"}{" "}
            <button
              type="button"
              onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
              className="text-morey-ocean font-medium hover:text-morey-deep transition-colors"
            >
              {mode === "signin" ? "Sign up" : "Sign in"}
            </button>
          </p>
        </div>
        <p className="text-center text-xs text-morey-mid/70 mt-4">
          Internal tool. For Morey&apos;s Piers staff only.
        </p>
      </div>
    </main>
  );
}

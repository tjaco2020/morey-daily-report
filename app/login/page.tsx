"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserSupabase } from "@/lib/supabase/client";
import { BeaconIcon } from "@/components/BeaconLogo";

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
    <main className="min-h-screen flex items-center justify-center p-6 bg-beacon-offwhite">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-bubble shadow-card border border-beacon-line p-8 animate-fade-in">
          <div className="mb-7 text-center">
            <div className="inline-flex items-center justify-center">
              <BeaconIcon className="w-14 h-14 text-beacon-navy" />
            </div>
            <h1 className="mt-5 text-2xl font-semibold tracking-tight text-beacon-navy">
              be<span className="text-beacon-teal">A</span>con
            </h1>
            <p className="text-xs uppercase tracking-[0.15em] text-beacon-mid mt-1">
              Operational Intelligence
            </p>
            <p className="text-sm text-beacon-mid mt-4">
              {mode === "signin"
                ? "Sign in to continue"
                : "Create your operator account"}
            </p>
          </div>

          <form onSubmit={onSubmit} className="space-y-3.5">
            {mode === "signup" && (
              <div>
                <label className="block text-xs font-medium text-beacon-mid mb-1.5">
                  Full name
                </label>
                <input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 rounded-soft border border-beacon-line focus:outline-none focus:ring-2 focus:ring-beacon-teal/30 focus:border-beacon-teal text-sm transition"
                />
              </div>
            )}
            <div>
              <label className="block text-xs font-medium text-beacon-mid mb-1.5">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="w-full px-3.5 py-2.5 rounded-soft border border-beacon-line focus:outline-none focus:ring-2 focus:ring-beacon-teal/30 focus:border-beacon-teal text-sm transition"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-beacon-mid mb-1.5">
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
                className="w-full px-3.5 py-2.5 rounded-soft border border-beacon-line focus:outline-none focus:ring-2 focus:ring-beacon-teal/30 focus:border-beacon-teal text-sm transition"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-soft bg-beacon-navy text-white font-semibold text-sm hover:bg-beacon-charcoal disabled:opacity-50 transition shadow-sm mt-2"
            >
              {loading
                ? "Working…"
                : mode === "signin"
                  ? "Sign in"
                  : "Create account"}
            </button>
          </form>

          {message && (
            <p className="mt-4 text-sm text-center text-beacon-navy bg-beacon-tealSoft border border-beacon-teal/30 rounded-md p-2.5">
              {message}
            </p>
          )}

          <p className="mt-6 text-center text-sm text-beacon-mid">
            {mode === "signin"
              ? "Don't have an account?"
              : "Already have an account?"}{" "}
            <button
              type="button"
              onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
              className="text-beacon-teal font-medium hover:text-beacon-tealDark transition-colors"
            >
              {mode === "signin" ? "Sign up" : "Sign in"}
            </button>
          </p>
        </div>
        <p className="text-center text-[11px] text-beacon-mid/70 mt-4 tracking-wide">
          Operational intelligence platform. Authorized personnel only.
        </p>
      </div>
    </main>
  );
}

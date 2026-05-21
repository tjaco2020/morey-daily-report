"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";

/**
 * Returns YYYY-MM-DD for today in Morey's operating timezone (America/New_York).
 * Mirrors lib/format.ts:todayLocal so the Today button always lands on the
 * NJ "today", regardless of where the browser thinks it is.
 */
function todayNJ(): string {
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const parts: Record<string, string> = {};
  for (const p of fmt.formatToParts(new Date())) {
    if (p.type !== "literal") parts[p.type] = p.value;
  }
  return `${parts.year}-${parts.month}-${parts.day}`;
}

/** Add `days` to a YYYY-MM-DD date string and return YYYY-MM-DD. */
function shiftDate(s: string, days: number): string {
  const [y, m, d] = s.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + days);
  const yy = dt.getFullYear();
  const mm = String(dt.getMonth() + 1).padStart(2, "0");
  const dd = String(dt.getDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}

type Option = { id: string; name: string };

type Props = {
  initial: {
    date: string;
    status: string;
    category: string;
    terminal: string;
    location: string;
    department: string;
    outlet: string;
    user: string;
    q: string;
  };
  categories: Option[];
  terminals: Option[];
  locations: Option[];
  departments: Option[];
  outlets: Option[];
  users: Option[];
};

const STATUSES = ["pending", "submitted", "included", "locked", "archived"];

export function SupervisorFilters({
  initial,
  categories,
  terminals,
  locations,
  departments,
  outlets,
  users,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [state, setState] = useState(initial);

  function apply(next = state) {
    const params = new URLSearchParams();
    if (next.date) params.set("date", next.date);
    if (next.status) params.set("status", next.status);
    if (next.category) params.set("category", next.category);
    if (next.terminal) params.set("terminal", next.terminal);
    if (next.location) params.set("location", next.location);
    if (next.department) params.set("department", next.department);
    if (next.outlet) params.set("outlet", next.outlet);
    if (next.user) params.set("user", next.user);
    if (next.q) params.set("q", next.q);
    startTransition(() => {
      router.push(`/supervisor?${params.toString()}`);
    });
  }

  function update<K extends keyof typeof state>(
    key: K,
    value: (typeof state)[K],
    immediate = true,
  ) {
    const next = { ...state, [key]: value };
    setState(next);
    if (immediate) apply(next);
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        apply();
      }}
      className="grid grid-cols-2 md:grid-cols-5 gap-2 items-end"
    >
      <Field label="Date">
        <div className="flex items-stretch gap-1">
          <button
            type="button"
            onClick={() => update("date", shiftDate(state.date, -1))}
            disabled={pending}
            aria-label="Previous day"
            className="px-1.5 py-1.5 rounded-lg border border-slate-200 bg-white text-morey-deep hover:bg-slate-50 disabled:opacity-60 transition"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <input
            type="date"
            value={state.date}
            onChange={(e) => update("date", e.target.value)}
            className="flex-1 min-w-0 px-2 py-1.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-beacon-teal/40 text-sm"
          />
          <button
            type="button"
            onClick={() => update("date", shiftDate(state.date, 1))}
            disabled={pending}
            aria-label="Next day"
            className="px-1.5 py-1.5 rounded-lg border border-slate-200 bg-white text-morey-deep hover:bg-slate-50 disabled:opacity-60 transition"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => update("date", todayNJ())}
            disabled={pending || state.date === todayNJ()}
            aria-label="Today"
            title="Jump to today"
            className="px-2 py-1.5 rounded-lg border border-slate-200 bg-white text-morey-deep hover:bg-slate-50 disabled:opacity-60 transition inline-flex items-center gap-1 text-xs font-medium"
          >
            <CalendarDays className="w-3.5 h-3.5" />
            Today
          </button>
        </div>
      </Field>

      <Field label="Department">
        <select
          value={state.department}
          onChange={(e) => update("department", e.target.value)}
          className="w-full px-2 py-1.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-morey-yellow/40 text-sm bg-white"
        >
          <option value="">Any</option>
          {departments.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Outlet">
        <select
          value={state.outlet}
          onChange={(e) => update("outlet", e.target.value)}
          className="w-full px-2 py-1.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-morey-yellow/40 text-sm bg-white"
        >
          <option value="">Any</option>
          {outlets.map((o) => (
            <option key={o.id} value={o.id}>
              {o.name}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Location">
        <select
          value={state.location}
          onChange={(e) => update("location", e.target.value)}
          className="w-full px-2 py-1.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-morey-yellow/40 text-sm bg-white"
        >
          <option value="">Any</option>
          {locations.map((l) => (
            <option key={l.id} value={l.id}>
              {l.name}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Status">
        <select
          value={state.status}
          onChange={(e) => update("status", e.target.value)}
          className="w-full px-2 py-1.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-morey-yellow/40 text-sm bg-white"
        >
          <option value="">Any</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Category">
        <select
          value={state.category}
          onChange={(e) => update("category", e.target.value)}
          className="w-full px-2 py-1.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-morey-yellow/40 text-sm bg-white"
        >
          <option value="">Any</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Terminal">
        <select
          value={state.terminal}
          onChange={(e) => update("terminal", e.target.value)}
          className="w-full px-2 py-1.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-morey-yellow/40 text-sm bg-white"
        >
          <option value="">Any</option>
          {terminals.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
      </Field>

      <Field label="User">
        <select
          value={state.user}
          onChange={(e) => update("user", e.target.value)}
          className="w-full px-2 py-1.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-morey-yellow/40 text-sm bg-white"
        >
          <option value="">Any</option>
          {users.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Search">
        <div className="flex gap-1">
          <input
            type="text"
            value={state.q}
            onChange={(e) => setState({ ...state, q: e.target.value })}
            placeholder="text / case #"
            className="flex-1 min-w-0 px-2 py-1.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-morey-yellow/40 text-sm"
          />
          <button
            type="submit"
            disabled={pending}
            className="px-3 py-1.5 rounded-md bg-beacon-navy text-white text-sm font-semibold hover:bg-beacon-charcoal disabled:opacity-60 transition"
          >
            Go
          </button>
        </div>
      </Field>
    </form>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block text-xs text-morey-mid">
      <span className="block mb-1">{label}</span>
      {children}
    </label>
  );
}

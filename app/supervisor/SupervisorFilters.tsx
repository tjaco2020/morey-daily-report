"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

type Option = { id: string; name: string };

type Props = {
  initial: {
    date: string;
    status: string;
    category: string;
    terminal: string;
    location: string;
    user: string;
    q: string;
  };
  categories: Option[];
  terminals: Option[];
  locations: Option[];
  users: Option[];
};

const STATUSES = ["pending", "submitted", "included", "locked", "archived"];

export function SupervisorFilters({
  initial,
  categories,
  terminals,
  locations,
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
      className="grid grid-cols-1 md:grid-cols-7 gap-2 items-end"
    >
      <Field label="Date">
        <input
          type="date"
          value={state.date}
          onChange={(e) => update("date", e.target.value)}
          className="w-full px-2 py-1.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-morey-yellow/40 text-sm"
        />
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
            className="px-3 py-1.5 rounded-md bg-morey-yellow text-morey-deep text-sm font-semibold hover:bg-morey-yellowDark disabled:opacity-60 transition"
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

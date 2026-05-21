"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserSupabase } from "@/lib/supabase/client";
import { Plus, Trash2, Check, X } from "lucide-react";

type Row = {
  id: string;
  name: string;
  active: boolean;
  location_id: string | null;
  outlet_id: string | null;
};

type Option = { id: string; name: string };

export function TerminalsClient({
  initial,
  locations,
  outlets,
}: {
  initial: Row[];
  locations: Option[];
  outlets: Option[];
}) {
  const supabase = createBrowserSupabase();
  const router = useRouter();
  const [rows, setRows] = useState<Row[]>(initial);
  const [name, setName] = useState("");
  const [newLocId, setNewLocId] = useState<string>("");
  const [newOutletId, setNewOutletId] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [messageOk, setMessageOk] = useState(false);

  function showMsg(m: string, ok: boolean) {
    setMessage(m);
    setMessageOk(ok);
  }

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setBusy(true);
    setMessage(null);
    try {
      const { data, error } = await supabase
        .from("terminals")
        .insert({
          name: name.trim(),
          active: true,
          location_id: newLocId || null,
          outlet_id: newOutletId || null,
        })
        .select()
        .single();
      if (error) throw error;
      setRows(
        [...rows, data as Row].sort((a, b) => a.name.localeCompare(b.name)),
      );
      setName("");
      setNewLocId("");
      setNewOutletId("");
      showMsg("Added.", true);
      router.refresh();
    } catch (err) {
      showMsg(err instanceof Error ? err.message : "Could not add.", false);
    } finally {
      setBusy(false);
    }
  }

  async function update(row: Row, patch: Partial<Row>) {
    setBusy(true);
    setMessage(null);
    try {
      const { error } = await supabase
        .from("terminals")
        .update(patch)
        .eq("id", row.id);
      if (error) throw error;
      setRows(
        rows
          .map((r) => (r.id === row.id ? { ...r, ...patch } : r))
          .sort((a, b) => a.name.localeCompare(b.name)),
      );
      showMsg("Saved.", true);
    } catch (err) {
      showMsg(err instanceof Error ? err.message : "Could not save.", false);
    } finally {
      setBusy(false);
    }
  }

  async function remove(row: Row) {
    if (!window.confirm(`Delete terminal "${row.name}"?`)) return;
    setBusy(true);
    setMessage(null);
    try {
      const { error } = await supabase
        .from("terminals")
        .delete()
        .eq("id", row.id);
      if (error) throw error;
      setRows(rows.filter((r) => r.id !== row.id));
      showMsg("Deleted.", true);
      router.refresh();
    } catch (err) {
      showMsg(
        err instanceof Error
          ? err.message
          : "Could not delete (existing reports may reference it).",
        false,
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <section className="bg-white rounded-bubble shadow-card border border-slate-100/80 p-5">
        <h2 className="text-sm font-semibold text-morey-deep flex items-center gap-2 mb-3">
          <Plus className="w-4 h-4 text-morey-ocean" />
          Add a terminal
        </h2>
        <form onSubmit={add} className="grid grid-cols-1 sm:grid-cols-5 gap-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Name (e.g. GS64)"
            required
            className="sm:col-span-2 px-3 py-2 rounded-soft border border-slate-200 focus:outline-none focus:ring-2 focus:ring-morey-yellow/40 text-sm"
          />
          <select
            value={newLocId}
            onChange={(e) => setNewLocId(e.target.value)}
            className="px-3 py-2 rounded-soft border border-slate-200 focus:outline-none focus:ring-2 focus:ring-morey-yellow/40 text-sm bg-white"
          >
            <option value="">No location</option>
            {locations.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </select>
          <select
            value={newOutletId}
            onChange={(e) => setNewOutletId(e.target.value)}
            className="px-3 py-2 rounded-soft border border-slate-200 focus:outline-none focus:ring-2 focus:ring-morey-yellow/40 text-sm bg-white"
          >
            <option value="">No outlet</option>
            {outlets.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name}
              </option>
            ))}
          </select>
          <button
            type="submit"
            disabled={busy}
            className="py-2 rounded-soft bg-beacon-navy text-white text-sm font-semibold hover:bg-beacon-charcoal disabled:opacity-60 transition shadow-sm"
          >
            Add
          </button>
        </form>
      </section>

      {message && (
        <p
          className={`text-sm rounded-md p-2.5 border ${
            messageOk
              ? "bg-green-50 border-green-200 text-green-800"
              : "bg-amber-50 border-amber-200 text-amber-900"
          }`}
        >
          {message}
        </p>
      )}

      <section className="bg-white rounded-bubble shadow-card border border-slate-100/80 overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100 text-sm font-semibold text-morey-deep">
          All terminals ({rows.length})
        </div>
        <ul className="divide-y divide-slate-100">
          {rows.map((r) => (
            <li
              key={r.id}
              className="p-3 flex flex-wrap items-center gap-3 hover:bg-slate-50/50 transition"
            >
              <input
                value={r.name}
                onChange={(e) =>
                  setRows(
                    rows.map((x) =>
                      x.id === r.id ? { ...x, name: e.target.value } : x,
                    ),
                  )
                }
                onBlur={(e) => {
                  if (
                    e.target.value !== initial.find((i) => i.id === r.id)?.name
                  ) {
                    update(r, { name: e.target.value });
                  }
                }}
                className="flex-1 min-w-[120px] px-2 py-1 rounded-md border border-transparent hover:border-slate-200 focus:border-morey-yellow focus:bg-morey-yellowSoft focus:outline-none text-sm"
              />
              <select
                value={r.location_id ?? ""}
                onChange={(e) =>
                  update(r, { location_id: e.target.value || null })
                }
                className="px-2 py-1 rounded-md border border-slate-200 hover:border-slate-300 text-xs bg-white"
                title="Location"
              >
                <option value="">No location</option>
                {locations.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name}
                  </option>
                ))}
              </select>
              <select
                value={r.outlet_id ?? ""}
                onChange={(e) =>
                  update(r, { outlet_id: e.target.value || null })
                }
                className="px-2 py-1 rounded-md border border-slate-200 hover:border-slate-300 text-xs bg-white"
                title="Outlet"
              >
                <option value="">No outlet</option>
                {outlets.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.name}
                  </option>
                ))}
              </select>
              <button
                onClick={() => update(r, { active: !r.active })}
                className={`inline-flex items-center gap-1 text-[10px] uppercase tracking-wider font-medium px-2 py-0.5 rounded-md border ${
                  r.active
                    ? "bg-green-50 border-green-200 text-green-800"
                    : "bg-slate-100 border-slate-200 text-slate-500"
                }`}
              >
                {r.active ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                {r.active ? "Active" : "Hidden"}
              </button>
              <button
                onClick={() => remove(r)}
                disabled={busy}
                className="text-red-600 hover:text-red-800 p-1 transition"
                title="Delete"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserSupabase } from "@/lib/supabase/client";
import { Plus, Trash2, Check, X, Store } from "lucide-react";

type Outlet = {
  id: string;
  name: string;
  department_id: string;
  location_id: string | null;
  display_order: number;
  active: boolean;
};

type Option = { id: string; name: string };

export function OutletsClient({
  initial,
  departments,
  locations,
}: {
  initial: Outlet[];
  departments: Option[];
  locations: Option[];
}) {
  const supabase = createBrowserSupabase();
  const router = useRouter();
  const [rows, setRows] = useState<Outlet[]>(initial);
  const [name, setName] = useState("");
  const [deptId, setDeptId] = useState<string>(departments[0]?.id ?? "");
  const [locId, setLocId] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [messageOk, setMessageOk] = useState(false);

  function showMsg(m: string, ok: boolean) {
    setMessage(m);
    setMessageOk(ok);
  }

  const nextOrder =
    rows.length > 0 ? Math.max(...rows.map((r) => r.display_order)) + 10 : 10;

  const deptName = (id: string) =>
    departments.find((d) => d.id === id)?.name ?? "—";
  const locName = (id: string | null) =>
    id ? (locations.find((l) => l.id === id)?.name ?? "—") : "—";

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !deptId) {
      return showMsg("Name + department required.", false);
    }
    setBusy(true);
    try {
      const { data, error } = await supabase
        .from("outlets")
        .insert({
          name: name.trim(),
          department_id: deptId,
          location_id: locId || null,
          display_order: nextOrder,
          active: true,
        })
        .select()
        .single();
      if (error) throw error;
      setRows(
        [...rows, data as Outlet].sort(
          (a, b) => a.display_order - b.display_order,
        ),
      );
      setName("");
      setLocId("");
      showMsg("Added.", true);
      router.refresh();
    } catch (err) {
      showMsg(err instanceof Error ? err.message : "Could not add.", false);
    } finally {
      setBusy(false);
    }
  }

  async function update(row: Outlet, patch: Partial<Outlet>) {
    setBusy(true);
    try {
      const { error } = await supabase
        .from("outlets")
        .update(patch)
        .eq("id", row.id);
      if (error) throw error;
      setRows(
        rows
          .map((r) => (r.id === row.id ? { ...r, ...patch } : r))
          .sort((a, b) => a.display_order - b.display_order),
      );
      showMsg("Saved.", true);
    } catch (err) {
      showMsg(err instanceof Error ? err.message : "Could not save.", false);
    } finally {
      setBusy(false);
    }
  }

  async function remove(row: Outlet) {
    if (!window.confirm(`Delete outlet "${row.name}"?`)) return;
    setBusy(true);
    try {
      const { error } = await supabase
        .from("outlets")
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
          : "Could not delete (reports/terminals may reference it).",
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
          Add an outlet
        </h2>
        <form onSubmit={add} className="grid grid-cols-1 sm:grid-cols-5 gap-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Name (e.g. Mariner's Pizza)"
            required
            className="sm:col-span-2 px-3 py-2 rounded-soft border border-slate-200 focus:outline-none focus:ring-2 focus:ring-morey-yellow/40 text-sm"
          />
          <select
            value={deptId}
            onChange={(e) => setDeptId(e.target.value)}
            required
            className="px-3 py-2 rounded-soft border border-slate-200 focus:outline-none focus:ring-2 focus:ring-morey-yellow/40 text-sm bg-white"
          >
            <option value="">— department —</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
          <select
            value={locId}
            onChange={(e) => setLocId(e.target.value)}
            className="px-3 py-2 rounded-soft border border-slate-200 focus:outline-none focus:ring-2 focus:ring-morey-yellow/40 text-sm bg-white"
          >
            <option value="">— no location —</option>
            {locations.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </select>
          <button
            type="submit"
            disabled={busy}
            className="py-2 rounded-soft bg-morey-yellow text-morey-deep text-sm font-semibold hover:bg-morey-yellowDark disabled:opacity-60 transition shadow-sm"
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
        <div className="px-5 py-3 border-b border-slate-100 text-sm font-semibold text-morey-deep flex items-center gap-2">
          <Store className="w-4 h-4 text-morey-ocean" />
          All outlets ({rows.length})
        </div>
        {rows.length === 0 ? (
          <p className="p-8 text-sm text-morey-mid text-center">
            No outlets yet. Add one above.
          </p>
        ) : (
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
                      e.target.value !==
                      initial.find((i) => i.id === r.id)?.name
                    ) {
                      update(r, { name: e.target.value });
                    }
                  }}
                  className="flex-1 min-w-[160px] px-2 py-1 rounded-md border border-transparent hover:border-slate-200 focus:border-morey-yellow focus:bg-morey-yellowSoft focus:outline-none text-sm"
                />
                <select
                  value={r.department_id}
                  onChange={(e) =>
                    update(r, { department_id: e.target.value })
                  }
                  className="px-2 py-1 rounded-md border border-slate-200 text-xs bg-white"
                  title={`Department: ${deptName(r.department_id)}`}
                >
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
                <select
                  value={r.location_id ?? ""}
                  onChange={(e) =>
                    update(r, { location_id: e.target.value || null })
                  }
                  className="px-2 py-1 rounded-md border border-slate-200 text-xs bg-white"
                  title={`Location: ${locName(r.location_id)}`}
                >
                  <option value="">No location</option>
                  {locations.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  value={r.display_order}
                  onChange={(e) =>
                    setRows(
                      rows.map((x) =>
                        x.id === r.id
                          ? {
                              ...x,
                              display_order: parseInt(e.target.value) || 0,
                            }
                          : x,
                      ),
                    )
                  }
                  onBlur={(e) =>
                    update(r, { display_order: parseInt(e.target.value) || 0 })
                  }
                  className="w-16 px-2 py-1 rounded-md border border-transparent hover:border-slate-200 focus:border-morey-yellow focus:bg-morey-yellowSoft focus:outline-none text-sm text-right"
                />
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
        )}
      </section>
    </div>
  );
}

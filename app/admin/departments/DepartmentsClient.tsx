"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserSupabase } from "@/lib/supabase/client";
import { Plus, Trash2, Check, X } from "lucide-react";

type Row = {
  id: string;
  name: string;
  description: string;
  display_order: number;
  active: boolean;
};

export function DepartmentsClient({ initial }: { initial: Row[] }) {
  const supabase = createBrowserSupabase();
  const router = useRouter();
  const [rows, setRows] = useState<Row[]>(initial);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [order, setOrder] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [messageOk, setMessageOk] = useState(false);

  function showMsg(m: string, ok: boolean) {
    setMessage(m);
    setMessageOk(ok);
  }

  const nextOrder =
    rows.length > 0 ? Math.max(...rows.map((r) => r.display_order)) + 10 : 10;

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setBusy(true);
    try {
      const { data, error } = await supabase
        .from("departments")
        .insert({
          name: name.trim(),
          description: description.trim() || null,
          display_order: order ? parseInt(order) : nextOrder,
          active: true,
        })
        .select()
        .single();
      if (error) throw error;
      setRows(
        [
          ...rows,
          {
            id: data.id,
            name: data.name,
            description: data.description ?? "",
            display_order: data.display_order,
            active: data.active,
          },
        ].sort((a, b) => a.display_order - b.display_order),
      );
      setName("");
      setDescription("");
      setOrder("");
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
    try {
      const { error } = await supabase
        .from("departments")
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

  async function remove(row: Row) {
    if (!window.confirm(`Delete department "${row.name}"?`)) return;
    setBusy(true);
    try {
      const { error } = await supabase
        .from("departments")
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
          : "Could not delete (outlets may reference it).",
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
          Add a department
        </h2>
        <form onSubmit={add} className="grid grid-cols-1 sm:grid-cols-5 gap-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Name (e.g. Marketing)"
            required
            className="sm:col-span-2 px-3 py-2 rounded-soft border border-slate-200 focus:outline-none focus:ring-2 focus:ring-morey-yellow/40 text-sm"
          />
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description (optional)"
            className="sm:col-span-2 px-3 py-2 rounded-soft border border-slate-200 focus:outline-none focus:ring-2 focus:ring-morey-yellow/40 text-sm"
          />
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
        <div className="px-5 py-3 border-b border-slate-100 text-sm font-semibold text-morey-deep">
          All departments ({rows.length})
        </div>
        <ul className="divide-y divide-slate-100">
          {rows.map((r) => (
            <li
              key={r.id}
              className="p-3 flex items-center gap-3 hover:bg-slate-50/50 transition"
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
                className="flex-1 px-2 py-1 rounded-md border border-transparent hover:border-slate-200 focus:border-morey-yellow focus:bg-morey-yellowSoft focus:outline-none text-sm"
              />
              <input
                type="number"
                value={r.display_order}
                onChange={(e) =>
                  setRows(
                    rows.map((x) =>
                      x.id === r.id
                        ? { ...x, display_order: parseInt(e.target.value) || 0 }
                        : x,
                    ),
                  )
                }
                onBlur={(e) =>
                  update(r, { display_order: parseInt(e.target.value) || 0 })
                }
                className="w-20 px-2 py-1 rounded-md border border-transparent hover:border-slate-200 focus:border-morey-yellow focus:bg-morey-yellowSoft focus:outline-none text-sm text-right"
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
      </section>
    </div>
  );
}

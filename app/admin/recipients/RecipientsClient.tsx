"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserSupabase } from "@/lib/supabase/client";

type Recipient = {
  id: string;
  name: string;
  email: string;
  active: boolean;
};

export function RecipientsClient({ initial }: { initial: Recipient[] }) {
  const supabase = createBrowserSupabase();
  const router = useRouter();
  const [list, setList] = useState<Recipient[]>(initial);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [messageOk, setMessageOk] = useState(false);

  function showMsg(msg: string, ok: boolean) {
    setMessage(msg);
    setMessageOk(ok);
  }

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return showMsg("That doesn't look like a valid email.", false);
    }
    setBusy(true);
    setMessage(null);
    try {
      const { data, error } = await supabase
        .from("email_recipients")
        .insert({ name: name.trim() || null, email: email.trim().toLowerCase() })
        .select("id, name, email, active")
        .single();
      if (error) throw error;
      setList([
        ...list,
        {
          id: data.id,
          name: data.name ?? "",
          email: data.email,
          active: data.active,
        },
      ]);
      setName("");
      setEmail("");
      showMsg("Recipient added.", true);
      router.refresh();
    } catch (err: unknown) {
      showMsg(err instanceof Error ? err.message : "Could not add.", false);
    } finally {
      setBusy(false);
    }
  }

  async function toggleActive(id: string, active: boolean) {
    setBusy(true);
    setMessage(null);
    try {
      const { error } = await supabase
        .from("email_recipients")
        .update({ active })
        .eq("id", id);
      if (error) throw error;
      setList(list.map((r) => (r.id === id ? { ...r, active } : r)));
      showMsg(active ? "Re-activated." : "Deactivated.", true);
    } catch (err: unknown) {
      showMsg(err instanceof Error ? err.message : "Could not update.", false);
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    if (!confirm("Remove this recipient?")) return;
    setBusy(true);
    setMessage(null);
    try {
      const { error } = await supabase
        .from("email_recipients")
        .delete()
        .eq("id", id);
      if (error) throw error;
      setList(list.filter((r) => r.id !== id));
      showMsg("Removed.", true);
    } catch (err: unknown) {
      showMsg(err instanceof Error ? err.message : "Could not remove.", false);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <form
        onSubmit={add}
        className="bg-white rounded-bubble shadow p-4 grid grid-cols-1 sm:grid-cols-5 gap-2 items-end"
      >
        <div className="sm:col-span-2">
          <label className="block text-xs text-gray-500 mb-1">Name (optional)</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-morey-ocean text-sm"
            placeholder="Jane Executive"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="block text-xs text-gray-500 mb-1">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-morey-ocean text-sm"
            placeholder="jane@moreyspiers.com"
          />
        </div>
        <button
          type="submit"
          disabled={busy}
          className="py-2 rounded-soft bg-beacon-navy text-white text-sm font-semibold hover:bg-beacon-charcoal disabled:opacity-60 transition shadow-sm"
        >
          Add
        </button>
      </form>

      {message && (
        <p
          className={`text-sm rounded p-2 border ${
            messageOk
              ? "bg-green-50 border-green-200 text-green-800"
              : "bg-yellow-50 border-yellow-200 text-morey-deep"
          }`}
        >
          {message}
        </p>
      )}

      <div className="bg-white rounded-bubble shadow overflow-hidden">
        {list.length === 0 ? (
          <p className="p-6 text-center text-sm text-gray-500">
            No recipients yet. Add at least one before sending the Daily Report.
          </p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {list.map((r) => (
              <li
                key={r.id}
                className="p-3 flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <div className="font-medium text-morey-deep">
                    {r.name || r.email}
                  </div>
                  {r.name && (
                    <div className="text-xs text-gray-500 truncate">
                      {r.email}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <label className="text-xs flex items-center gap-1">
                    <input
                      type="checkbox"
                      checked={r.active}
                      onChange={(e) => toggleActive(r.id, e.target.checked)}
                      disabled={busy}
                      className="accent-morey-yellow"
                    />
                    Active
                  </label>
                  <button
                    onClick={() => remove(r.id)}
                    disabled={busy}
                    className="text-xs text-red-700 hover:underline"
                  >
                    Remove
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

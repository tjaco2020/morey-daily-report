"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UserPlus, KeyRound, Check, X } from "lucide-react";

type Row = {
  id: string;
  email: string;
  full_name: string;
  role: "user" | "supervisor" | "manager";
  active: boolean;
  created_at: string;
};

const ROLES = ["user", "supervisor", "manager"] as const;

export function UsersClient({ initial }: { initial: Row[] }) {
  const router = useRouter();
  const [rows, setRows] = useState<Row[]>(initial);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [messageOk, setMessageOk] = useState(false);

  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [inviteRole, setInviteRole] = useState<"user" | "supervisor" | "manager">("user");

  function showMsg(m: string, ok: boolean) {
    setMessage(m);
    setMessageOk(ok);
  }

  async function invite(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/users/invite", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          email: inviteEmail,
          full_name: inviteName,
          role: inviteRole,
        }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || "Invite failed");
      showMsg(`Invite sent to ${inviteEmail}.`, true);
      setInviteEmail("");
      setInviteName("");
      setInviteRole("user");
      router.refresh();
    } catch (err) {
      showMsg(err instanceof Error ? err.message : "Invite failed.", false);
    } finally {
      setBusy(false);
    }
  }

  async function patch(id: string, body: Record<string, unknown>, ok: string) {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      const resBody = await res.json();
      if (!res.ok) throw new Error(resBody.error || "Update failed");
      showMsg(ok, true);
      router.refresh();
    } catch (err) {
      showMsg(err instanceof Error ? err.message : "Update failed.", false);
    } finally {
      setBusy(false);
    }
  }

  async function changeRole(row: Row, role: Row["role"]) {
    setRows(rows.map((r) => (r.id === row.id ? { ...r, role } : r)));
    await patch(row.id, { role }, `${row.email} → ${role}`);
  }

  async function toggleActive(row: Row, active: boolean) {
    setRows(rows.map((r) => (r.id === row.id ? { ...r, active } : r)));
    await patch(row.id, { active }, active ? "Reactivated" : "Deactivated");
  }

  async function resetPin(row: Row) {
    const pin = window.prompt(
      `Set a new PIN for ${row.full_name || row.email} (4–6 digits)`,
    );
    if (!pin) return;
    if (!/^[0-9]{4,6}$/.test(pin)) {
      return showMsg("PIN must be 4–6 digits.", false);
    }
    await patch(row.id, { pin }, `PIN updated for ${row.email}`);
  }

  return (
    <div className="space-y-5">
      {/* Invite form */}
      <section className="bg-white rounded-bubble shadow-card border border-slate-100/80 p-5">
        <h2 className="text-sm font-semibold text-morey-deep flex items-center gap-2 mb-3">
          <UserPlus className="w-4 h-4 text-morey-ocean" />
          Invite a new user
        </h2>
        <form onSubmit={invite} className="grid grid-cols-1 sm:grid-cols-4 gap-2">
          <input
            type="text"
            value={inviteName}
            onChange={(e) => setInviteName(e.target.value)}
            placeholder="Full name"
            required
            className="px-3 py-2 rounded-soft border border-slate-200 focus:outline-none focus:ring-2 focus:ring-morey-yellow/40 text-sm"
          />
          <input
            type="email"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            placeholder="email@moreyspiers.com"
            required
            className="px-3 py-2 rounded-soft border border-slate-200 focus:outline-none focus:ring-2 focus:ring-morey-yellow/40 text-sm"
          />
          <select
            value={inviteRole}
            onChange={(e) =>
              setInviteRole(e.target.value as Row["role"])
            }
            className="px-3 py-2 rounded-soft border border-slate-200 focus:outline-none focus:ring-2 focus:ring-morey-yellow/40 text-sm bg-white"
          >
            <option value="user">User (default)</option>
            <option value="supervisor">Supervisor</option>
            <option value="manager">Manager</option>
          </select>
          <button
            type="submit"
            disabled={busy}
            className="py-2 rounded-soft bg-beacon-navy text-white text-sm font-semibold hover:bg-beacon-charcoal disabled:opacity-60 transition shadow-sm"
          >
            {busy ? "Sending…" : "Send invite"}
          </button>
        </form>
        <p className="text-[11px] text-morey-mid mt-2 leading-tight">
          Supabase sends an email with a sign-up link. The user picks a
          password on first sign-in; their profile auto-creates with the role
          you chose.
        </p>
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

      {/* Users list */}
      <section className="bg-white rounded-bubble shadow-card border border-slate-100/80 overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-morey-deep">
            All users ({rows.length})
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50/70 text-morey-mid uppercase text-[10px] tracking-wider">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Name</th>
                <th className="text-left px-4 py-3 font-medium">Email</th>
                <th className="text-left px-4 py-3 font-medium">Role</th>
                <th className="text-left px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50/50 transition">
                  <td className="px-4 py-3 text-morey-deep">{r.full_name || "—"}</td>
                  <td className="px-4 py-3 text-morey-mid">{r.email}</td>
                  <td className="px-4 py-3">
                    <select
                      value={r.role}
                      onChange={(e) => changeRole(r, e.target.value as Row["role"])}
                      disabled={busy}
                      className="px-2 py-1 rounded-md border border-slate-200 text-xs bg-white"
                    >
                      {ROLES.map((role) => (
                        <option key={role} value={role}>
                          {role}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => toggleActive(r, !r.active)}
                      disabled={busy}
                      className={`inline-flex items-center gap-1 text-[10px] uppercase tracking-wider font-medium px-2 py-0.5 rounded-md border ${
                        r.active
                          ? "bg-green-50 border-green-200 text-green-800"
                          : "bg-slate-100 border-slate-200 text-slate-500"
                      }`}
                    >
                      {r.active ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                      {r.active ? "Active" : "Inactive"}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => resetPin(r)}
                      disabled={busy}
                      className="inline-flex items-center gap-1 text-xs text-morey-ocean hover:text-morey-deep transition"
                    >
                      <KeyRound className="w-3.5 h-3.5" />
                      Reset PIN
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserSupabase } from "@/lib/supabase/client";
import { Plus, Trash2, Users, Check, X, UserPlus } from "lucide-react";

type Group = {
  id: string;
  name: string;
  description: string;
  active: boolean;
};

type Member = {
  id: string;
  group_id: string;
  email: string;
  name: string;
  active: boolean;
};

export function ShareGroupsClient({
  initialGroups,
  initialMembers,
}: {
  initialGroups: Group[];
  initialMembers: Member[];
}) {
  const supabase = createBrowserSupabase();
  const router = useRouter();
  const [groups, setGroups] = useState<Group[]>(initialGroups);
  const [members, setMembers] = useState<Member[]>(initialMembers);
  const [openGroup, setOpenGroup] = useState<string | null>(
    initialGroups[0]?.id ?? null,
  );

  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupDesc, setNewGroupDesc] = useState("");

  const [newEmail, setNewEmail] = useState("");
  const [newName, setNewName] = useState("");

  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [messageOk, setMessageOk] = useState(false);

  function showMsg(m: string, ok: boolean) {
    setMessage(m);
    setMessageOk(ok);
  }

  async function addGroup(e: React.FormEvent) {
    e.preventDefault();
    if (!newGroupName.trim()) return;
    setBusy(true);
    try {
      const { data, error } = await supabase
        .from("share_groups")
        .insert({
          name: newGroupName.trim(),
          description: newGroupDesc.trim() || null,
          active: true,
        })
        .select()
        .single();
      if (error) throw error;
      setGroups([
        ...groups,
        {
          id: data.id,
          name: data.name,
          description: data.description ?? "",
          active: data.active,
        },
      ]);
      setOpenGroup(data.id);
      setNewGroupName("");
      setNewGroupDesc("");
      showMsg("Group added.", true);
      router.refresh();
    } catch (err) {
      showMsg(err instanceof Error ? err.message : "Could not add.", false);
    } finally {
      setBusy(false);
    }
  }

  async function updateGroup(group: Group, patch: Partial<Group>) {
    setBusy(true);
    setMessage(null);
    try {
      const { error } = await supabase
        .from("share_groups")
        .update(patch)
        .eq("id", group.id);
      if (error) throw error;
      setGroups(
        groups.map((g) => (g.id === group.id ? { ...g, ...patch } : g)),
      );
    } catch (err) {
      showMsg(err instanceof Error ? err.message : "Could not save.", false);
    } finally {
      setBusy(false);
    }
  }

  async function deleteGroup(group: Group) {
    if (
      !window.confirm(
        `Delete group "${group.name}" and all its members? This can't be undone.`,
      )
    )
      return;
    setBusy(true);
    try {
      const { error } = await supabase
        .from("share_groups")
        .delete()
        .eq("id", group.id);
      if (error) throw error;
      setGroups(groups.filter((g) => g.id !== group.id));
      setMembers(members.filter((m) => m.group_id !== group.id));
      if (openGroup === group.id) setOpenGroup(null);
      showMsg("Deleted.", true);
      router.refresh();
    } catch (err) {
      showMsg(err instanceof Error ? err.message : "Could not delete.", false);
    } finally {
      setBusy(false);
    }
  }

  async function addMember(e: React.FormEvent, groupId: string) {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail.trim())) {
      return showMsg("Invalid email.", false);
    }
    setBusy(true);
    try {
      const { data, error } = await supabase
        .from("share_group_members")
        .insert({
          group_id: groupId,
          email: newEmail.trim().toLowerCase(),
          name: newName.trim() || null,
          active: true,
        })
        .select()
        .single();
      if (error) throw error;
      setMembers([
        ...members,
        {
          id: data.id,
          group_id: data.group_id,
          email: data.email,
          name: data.name ?? "",
          active: data.active,
        },
      ]);
      setNewEmail("");
      setNewName("");
      showMsg("Added.", true);
    } catch (err) {
      showMsg(err instanceof Error ? err.message : "Could not add.", false);
    } finally {
      setBusy(false);
    }
  }

  async function toggleMember(m: Member, active: boolean) {
    setBusy(true);
    try {
      const { error } = await supabase
        .from("share_group_members")
        .update({ active })
        .eq("id", m.id);
      if (error) throw error;
      setMembers(
        members.map((x) => (x.id === m.id ? { ...x, active } : x)),
      );
    } catch (err) {
      showMsg(err instanceof Error ? err.message : "Could not update.", false);
    } finally {
      setBusy(false);
    }
  }

  async function removeMember(m: Member) {
    if (!window.confirm(`Remove ${m.email}?`)) return;
    setBusy(true);
    try {
      const { error } = await supabase
        .from("share_group_members")
        .delete()
        .eq("id", m.id);
      if (error) throw error;
      setMembers(members.filter((x) => x.id !== m.id));
    } catch (err) {
      showMsg(err instanceof Error ? err.message : "Could not remove.", false);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-5">
      {/* Add group */}
      <section className="bg-white rounded-bubble shadow-card border border-slate-100/80 p-5">
        <h2 className="text-sm font-semibold text-morey-deep flex items-center gap-2 mb-3">
          <Plus className="w-4 h-4 text-morey-ocean" />
          New group
        </h2>
        <form onSubmit={addGroup} className="grid grid-cols-1 sm:grid-cols-5 gap-2">
          <input
            value={newGroupName}
            onChange={(e) => setNewGroupName(e.target.value)}
            placeholder="Name (e.g. Mariner's Supervisors)"
            required
            className="sm:col-span-2 px-3 py-2 rounded-soft border border-slate-200 focus:outline-none focus:ring-2 focus:ring-morey-yellow/40 text-sm"
          />
          <input
            value={newGroupDesc}
            onChange={(e) => setNewGroupDesc(e.target.value)}
            placeholder="Description (optional)"
            className="sm:col-span-2 px-3 py-2 rounded-soft border border-slate-200 focus:outline-none focus:ring-2 focus:ring-morey-yellow/40 text-sm"
          />
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

      {/* Groups list */}
      {groups.length === 0 ? (
        <p className="text-sm text-morey-mid text-center py-10 bg-white rounded-bubble shadow-card border border-slate-100/80">
          No share groups yet. Add one above.
        </p>
      ) : (
        groups.map((g) => {
          const groupMembers = members.filter((m) => m.group_id === g.id);
          const isOpen = openGroup === g.id;
          return (
            <section
              key={g.id}
              className="bg-white rounded-bubble shadow-card border border-slate-100/80 overflow-hidden"
            >
              <div className="px-5 py-3 flex items-center justify-between gap-3 border-b border-slate-100">
                <button
                  onClick={() => setOpenGroup(isOpen ? null : g.id)}
                  className="flex-1 text-left flex items-center gap-2 text-morey-deep"
                >
                  <Users className="w-4 h-4 text-morey-ocean" />
                  <span className="font-semibold">{g.name}</span>
                  <span className="text-xs text-morey-mid">
                    ({groupMembers.length})
                  </span>
                  {g.description && (
                    <span className="text-xs text-morey-mid ml-2 truncate">
                      — {g.description}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => deleteGroup(g)}
                  className="text-red-600 hover:text-red-800 p-1"
                  title="Delete group"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {isOpen && (
                <div className="p-5 space-y-4">
                  {/* Inline group editor */}
                  <div className="p-3 rounded-md bg-slate-50 border border-slate-200 space-y-2">
                    <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 items-center">
                      <label className="text-xs font-medium text-morey-mid sm:col-span-1">
                        Group name
                      </label>
                      <input
                        value={g.name}
                        onChange={(e) =>
                          setGroups(
                            groups.map((x) =>
                              x.id === g.id
                                ? { ...x, name: e.target.value }
                                : x,
                            ),
                          )
                        }
                        onBlur={(e) => {
                          const initial =
                            initialGroups.find((i) => i.id === g.id)?.name ?? "";
                          if (
                            e.target.value !== initial &&
                            e.target.value.trim().length > 0
                          ) {
                            updateGroup(g, { name: e.target.value.trim() });
                          }
                        }}
                        className="sm:col-span-3 px-3 py-1.5 rounded-md border border-slate-200 focus:outline-none focus:ring-2 focus:ring-morey-yellow/40 text-sm bg-white"
                      />
                      <button
                        onClick={() => updateGroup(g, { active: !g.active })}
                        className={`text-[10px] uppercase tracking-wider font-medium px-2 py-1 rounded-md border ${
                          g.active
                            ? "bg-green-50 border-green-200 text-green-800"
                            : "bg-slate-200 border-slate-300 text-slate-600"
                        }`}
                      >
                        {g.active ? "Active" : "Hidden"}
                      </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 items-center">
                      <label className="text-xs font-medium text-morey-mid sm:col-span-1">
                        Description
                      </label>
                      <input
                        value={g.description}
                        onChange={(e) =>
                          setGroups(
                            groups.map((x) =>
                              x.id === g.id
                                ? { ...x, description: e.target.value }
                                : x,
                            ),
                          )
                        }
                        onBlur={(e) => {
                          const initial =
                            initialGroups.find((i) => i.id === g.id)
                              ?.description ?? "";
                          if (e.target.value !== initial) {
                            updateGroup(g, {
                              description: e.target.value,
                            });
                          }
                        }}
                        placeholder="What this group is for (optional)"
                        className="sm:col-span-4 px-3 py-1.5 rounded-md border border-slate-200 focus:outline-none focus:ring-2 focus:ring-morey-yellow/40 text-sm bg-white"
                      />
                    </div>
                  </div>

                  {/* Add member */}
                  <form
                    onSubmit={(e) => addMember(e, g.id)}
                    className="grid grid-cols-1 sm:grid-cols-5 gap-2"
                  >
                    <input
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      placeholder="Name (optional)"
                      className="sm:col-span-2 px-3 py-2 rounded-soft border border-slate-200 focus:outline-none focus:ring-2 focus:ring-morey-yellow/40 text-sm"
                    />
                    <input
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      placeholder="email@moreyspiers.com"
                      required
                      type="email"
                      className="sm:col-span-2 px-3 py-2 rounded-soft border border-slate-200 focus:outline-none focus:ring-2 focus:ring-morey-yellow/40 text-sm"
                    />
                    <button
                      type="submit"
                      disabled={busy}
                      className="py-2 rounded-soft bg-white border border-slate-200 hover:bg-slate-50 disabled:opacity-60 text-sm font-medium text-morey-deep transition inline-flex items-center justify-center gap-1"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      Add
                    </button>
                  </form>

                  {groupMembers.length === 0 ? (
                    <p className="text-xs text-morey-mid text-center py-3">
                      No members yet. Add an email above.
                    </p>
                  ) : (
                    <ul className="divide-y divide-slate-100 -mx-2">
                      {groupMembers.map((m) => (
                        <li
                          key={m.id}
                          className="px-2 py-2 flex items-center gap-3"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="text-sm text-morey-deep font-medium">
                              {m.name || m.email}
                            </div>
                            {m.name && (
                              <div className="text-xs text-morey-mid truncate">
                                {m.email}
                              </div>
                            )}
                          </div>
                          <button
                            onClick={() => toggleMember(m, !m.active)}
                            className={`inline-flex items-center gap-1 text-[10px] uppercase tracking-wider font-medium px-2 py-0.5 rounded-md border ${
                              m.active
                                ? "bg-green-50 border-green-200 text-green-800"
                                : "bg-slate-100 border-slate-200 text-slate-500"
                            }`}
                          >
                            {m.active ? (
                              <Check className="w-3 h-3" />
                            ) : (
                              <X className="w-3 h-3" />
                            )}
                            {m.active ? "Active" : "Off"}
                          </button>
                          <button
                            onClick={() => removeMember(m)}
                            className="text-red-600 hover:text-red-800 p-1"
                            title="Remove"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </section>
          );
        })
      )}
    </div>
  );
}

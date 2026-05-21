"use client";

import { useEffect, useState } from "react";
import { createBrowserSupabase } from "@/lib/supabase/client";
import { X, Send, Share2 } from "lucide-react";
import { useToast } from "./Toast";

type Group = {
  id: string;
  name: string;
  description: string | null;
  member_count: number;
};

type Props = {
  reportIds: string[];
  caseNumber?: string;
  onClose: () => void;
};

export function ShareDialog({ reportIds, caseNumber, onClose }: Props) {
  const supabase = createBrowserSupabase();
  const toast = useToast();
  const [groups, setGroups] = useState<Group[]>([]);
  const [groupId, setGroupId] = useState<string>("");
  const [customEmails, setCustomEmails] = useState<string>("");
  const [message, setMessage] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<{
    msg: string;
    ok: boolean;
  } | null>(null);

  useEffect(() => {
    (async () => {
      const { data: gs } = await supabase
        .from("share_groups")
        .select("id, name, description")
        .eq("active", true)
        .order("name");
      // Get member counts (one query per group is fine for a small list)
      const ids = (gs ?? []).map((g) => g.id);
      const counts: Record<string, number> = {};
      if (ids.length > 0) {
        const { data: members } = await supabase
          .from("share_group_members")
          .select("group_id")
          .eq("active", true)
          .in("group_id", ids);
        (members ?? []).forEach((m) => {
          counts[m.group_id] = (counts[m.group_id] ?? 0) + 1;
        });
      }
      setGroups(
        (gs ?? []).map((g) => ({
          id: g.id,
          name: g.name,
          description: g.description,
          member_count: counts[g.id] ?? 0,
        })),
      );
    })();
  }, [supabase]);

  // Close on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function send() {
    setBusy(true);
    setStatus(null);
    try {
      const emails = customEmails
        .split(/[,;\s]+/)
        .map((s) => s.trim())
        .filter(Boolean);

      if (!groupId && emails.length === 0) {
        throw new Error("Pick a group or enter at least one email.");
      }

      const res = await fetch("/api/reports/share", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          report_ids: reportIds,
          group_id: groupId || null,
          custom_emails: emails,
          message: message.trim(),
        }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || "Send failed");
      const list = Array.isArray(body.sent_to) ? body.sent_to : [];
      const summary =
        list.length <= 2
          ? `Sent to ${list.join(", ")}`
          : `Sent to ${list.length} recipients`;
      toast(summary, "success");
      onClose();
    } catch (err) {
      setStatus({
        msg: err instanceof Error ? err.message : "Could not send.",
        ok: false,
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-white rounded-bubble shadow-panel border border-slate-100 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-gradient-to-br from-morey-deep to-[#1E293B] text-white px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Share2 className="w-4 h-4" />
            <div>
              <div className="text-xs uppercase tracking-wider text-white/60">
                Share
              </div>
              <div className="font-semibold text-sm">
                {reportIds.length === 1
                  ? caseNumber
                    ? `Report ${caseNumber}`
                    : "1 report"
                  : `${reportIds.length} reports`}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/70 hover:text-white p-1 -m-1 rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-3">
          <div>
            <label className="block text-xs font-medium text-morey-mid mb-1.5">
              Send to a group
            </label>
            <select
              value={groupId}
              onChange={(e) => setGroupId(e.target.value)}
              className="w-full px-3 py-2 rounded-soft border border-slate-200 focus:outline-none focus:ring-2 focus:ring-morey-yellow/40 text-sm bg-white"
            >
              <option value="">— no group —</option>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name} ({g.member_count} member{g.member_count === 1 ? "" : "s"})
                </option>
              ))}
            </select>
            {groups.length === 0 && (
              <p className="text-[11px] text-morey-mid mt-1">
                No groups yet. Managers can create them in{" "}
                <a
                  href="/admin/share-groups"
                  target="_blank"
                  rel="noreferrer"
                  className="text-morey-ocean hover:underline"
                >
                  Admin → Share groups
                </a>
                .
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-morey-mid mb-1.5">
              And / or custom emails
            </label>
            <input
              value={customEmails}
              onChange={(e) => setCustomEmails(e.target.value)}
              placeholder="email@moreyspiers.com, another@..."
              className="w-full px-3 py-2 rounded-soft border border-slate-200 focus:outline-none focus:ring-2 focus:ring-morey-yellow/40 text-sm"
            />
            <p className="text-[10px] text-morey-mid mt-1">
              Comma or space separated.
            </p>
          </div>

          <div>
            <label className="block text-xs font-medium text-morey-mid mb-1.5">
              Optional note
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
              placeholder="Add context — what to look out for, follow-ups, etc."
              className="w-full px-3 py-2 rounded-soft border border-slate-200 focus:outline-none focus:ring-2 focus:ring-morey-yellow/40 text-sm resize-y"
            />
          </div>

          {status && (
            <p
              className={`text-xs rounded-md p-2.5 border ${
                status.ok
                  ? "bg-green-50 border-green-200 text-green-800"
                  : "bg-amber-50 border-amber-200 text-amber-900"
              }`}
            >
              {status.msg}
            </p>
          )}

          <div className="flex gap-2 pt-1">
            <button
              onClick={onClose}
              className="flex-1 py-2 rounded-soft bg-white border border-slate-200 hover:bg-slate-50 text-sm font-medium text-morey-deep transition"
            >
              Cancel
            </button>
            <button
              onClick={send}
              disabled={busy}
              className="flex-1 py-2 rounded-soft bg-morey-yellow text-morey-deep hover:bg-morey-yellowDark disabled:opacity-60 text-sm font-semibold transition shadow-sm inline-flex items-center justify-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              {busy ? "Sending…" : "Send"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

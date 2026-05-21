import { createServerSupabase } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  todayLocal,
  formatDate,
  formatTime,
  statusLabel,
  statusClasses,
} from "@/lib/format";
import {
  Clock,
  MapPin,
  Sun,
  ArrowRight,
  ShieldCheck,
  FilePlus2,
} from "lucide-react";
import { EmptyState } from "@/components/EmptyState";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const today = todayLocal();

  const [{ data: profile }, { data: session }, { data: reports }, { count: pendingCount }, { count: submittedCount }] = await Promise.all([
    supabase
      .from("profiles")
      .select("full_name, email, role")
      .eq("id", user.id)
      .single(),
    supabase
      .from("daily_sessions")
      .select("scheduled_start, scheduled_end, terminal_id, terminals(name), login_at")
      .eq("user_id", user.id)
      .eq("session_date", today)
      .maybeSingle(),
    supabase
      .from("reports")
      .select(
        "id, case_number, status, text, submitted_at, created_at, categories(name), terminals(name)",
      )
      .eq("user_id", user.id)
      .eq("report_date", today)
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("reports")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("report_date", today)
      .eq("status", "pending"),
    supabase
      .from("reports")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("report_date", today)
      .in("status", ["submitted", "included", "archived"]),
  ]);

  const isSup = profile?.role === "supervisor" || profile?.role === "manager";
  const firstName =
    (profile?.full_name ?? user.email ?? "there").split(" ")[0] || "there";

  return (
    <main className="px-4 sm:px-6 py-8 sm:py-10">
      <div className="max-w-7xl mx-auto">
        {/* Hero */}
        <section className="mb-8 animate-fade-in">
          <p className="text-sm text-morey-mid">{formatDate(today)}</p>
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-morey-deep mt-1">
            Good day, {firstName}.
          </h1>
          <p className="text-sm text-morey-mid mt-1">
            {isSup
              ? "Manage today's reports and curate the Daily Report when ready."
              : "Log what's happening today. Save drafts now, submit when you're done."}
          </p>
        </section>

        {/* Stat tiles */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          <StatTile
            icon={FilePlus2}
            label="Drafts"
            value={pendingCount ?? 0}
            tone="amber"
          />
          <StatTile
            icon={ArrowRight}
            label="Submitted"
            value={submittedCount ?? 0}
            tone="blue"
          />
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          <ShiftTile session={session as any} />
          <RoleTile role={profile?.role ?? "user"} />
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Recent reports */}
          <section className="lg:col-span-2 bg-white rounded-bubble shadow-card border border-slate-100/80">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-morey-deep">
                  Your recent reports
                </h2>
                <p className="text-xs text-morey-mid mt-0.5">Today only</p>
              </div>
              <Link
                href="/reports/today"
                className="text-xs text-morey-ocean hover:text-morey-deep transition flex items-center gap-1"
              >
                View all <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            {reports && reports.length > 0 ? (
              <ul className="divide-y divide-slate-100">
                {reports.map((r) => (
                  <li
                    key={r.id}
                    className="px-5 py-3.5 flex items-start justify-between gap-4 hover:bg-slate-50/50 transition"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 text-xs text-morey-mid">
                        <Clock className="w-3 h-3" />
                        <span>{formatTime(r.submitted_at ?? r.created_at)}</span>
                        <span>·</span>
                        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                        <span>{(r as any).categories?.name ?? "—"}</span>
                        <span>·</span>
                        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                        <span>{(r as any).terminals?.name ?? "—"}</span>
                      </div>
                      <p className="text-sm text-morey-deep mt-1 line-clamp-2 break-words">
                        {r.text}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-1 font-mono">
                        {r.case_number}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 text-[10px] uppercase tracking-wider font-medium px-2 py-1 rounded-md ${statusClasses(r.status)}`}
                    >
                      {statusLabel(r.status)}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState
                icon={FilePlus2}
                title="No reports yet today"
                description="Tap the red bubble in the bottom right corner to log your first."
              />
            )}
          </section>

          {/* Side panel: jump-tos */}
          <aside className="space-y-3">
            {isSup && (
              <Link
                href="/supervisor"
                className="block bg-gradient-to-br from-morey-deep to-[#1E293B] text-white rounded-bubble p-5 hover:opacity-95 transition shadow-card group"
              >
                <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-white/60 mb-2">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Supervisor
                </div>
                <div className="font-semibold text-base">
                  Review &amp; build today&apos;s report
                </div>
                <div className="text-xs text-white/70 mt-1">
                  Filter, edit, include, send.
                </div>
                <ArrowRight className="w-4 h-4 mt-3 text-white/80 group-hover:translate-x-1 transition-transform" />
              </Link>
            )}

            <div className="bg-white rounded-bubble shadow-card border border-slate-100/80 p-5">
              <h3 className="text-sm font-semibold text-morey-deep mb-2">
                Quick links
              </h3>
              <ul className="space-y-1.5 text-sm">
                <QuickLink href="/reports/today">Today&apos;s reports</QuickLink>
                <QuickLink href="/account/pin">Set / change PIN</QuickLink>
                <QuickLink href="/quick" newTab>
                  Quick PIN page
                </QuickLink>
              </ul>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}

function StatTile({
  icon: Icon,
  label,
  value,
  tone,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  icon: any;
  label: string;
  value: number | string;
  tone: "amber" | "blue" | "green" | "neutral";
}) {
  const toneClasses: Record<string, string> = {
    amber: "text-amber-700 bg-amber-50",
    blue: "text-sky-700 bg-sky-50",
    green: "text-green-700 bg-green-50",
    neutral: "text-slate-600 bg-slate-100",
  };
  return (
    <div className="bg-white rounded-bubble shadow-card border border-slate-100/80 p-4 flex items-center gap-3">
      <div
        className={`w-10 h-10 rounded-xl ${toneClasses[tone]} flex items-center justify-center shrink-0`}
      >
        <Icon className="w-5 h-5" />
      </div>
      <div className="min-w-0">
        <div className="text-xs text-morey-mid">{label}</div>
        <div className="text-xl font-semibold text-morey-deep tabular-nums">
          {value}
        </div>
      </div>
    </div>
  );
}

function ShiftTile({
  session,
}: {
  session: {
    scheduled_start: string | null;
    scheduled_end: string | null;
    terminals?: { name: string } | null;
  } | null;
}) {
  const terminal = session?.terminals?.name;
  return (
    <div className="bg-white rounded-bubble shadow-card border border-slate-100/80 p-4 flex items-center gap-3">
      <div className="w-10 h-10 rounded-xl bg-morey-ocean/10 text-morey-ocean flex items-center justify-center shrink-0">
        <MapPin className="w-5 h-5" />
      </div>
      <div className="min-w-0">
        <div className="text-xs text-morey-mid">Today&apos;s shift</div>
        <div className="text-sm font-semibold text-morey-deep truncate">
          {terminal ?? "Not set"}
        </div>
        {session?.scheduled_start && session?.scheduled_end && (
          <div className="text-[10px] text-morey-mid mt-0.5">
            {session.scheduled_start.slice(0, 5)} –{" "}
            {session.scheduled_end.slice(0, 5)}
          </div>
        )}
      </div>
    </div>
  );
}

function RoleTile({ role }: { role: string }) {
  const labelMap: Record<string, string> = {
    user: "Associate",
    supervisor: "Supervisor",
    manager: "Manager",
  };
  return (
    <div className="bg-white rounded-bubble shadow-card border border-slate-100/80 p-4 flex items-center gap-3">
      <div className="w-10 h-10 rounded-xl bg-morey-yellow/30 text-morey-deep flex items-center justify-center shrink-0">
        <Sun className="w-5 h-5" />
      </div>
      <div className="min-w-0">
        <div className="text-xs text-morey-mid">Role</div>
        <div className="text-sm font-semibold text-morey-deep capitalize truncate">
          {labelMap[role] ?? role}
        </div>
      </div>
    </div>
  );
}

function QuickLink({
  href,
  children,
  newTab = false,
}: {
  href: string;
  children: React.ReactNode;
  newTab?: boolean;
}) {
  const props = newTab ? { target: "_blank", rel: "noreferrer" } : {};
  return (
    <li>
      <Link
        href={href}
        {...props}
        className="flex items-center justify-between text-morey-deep hover:text-morey-ocean transition py-1 group"
      >
        <span>{children}</span>
        <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-morey-ocean group-hover:translate-x-0.5 transition" />
      </Link>
    </li>
  );
}

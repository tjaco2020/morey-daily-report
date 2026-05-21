import { createServerSupabase } from "@/lib/supabase/server";
import { requireRole } from "@/lib/roles";
import Link from "next/link";
import { AutomationClient } from "./AutomationClient";

export const dynamic = "force-dynamic";

export default async function AutomationPage() {
  await requireRole("manager");
  const supabase = createServerSupabase();

  const { data: setting } = await supabase
    .from("app_settings")
    .select("value, updated_at")
    .eq("key", "automation_enabled")
    .maybeSingle();

  let enabled = true;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const raw = (setting as any)?.value;
  if (typeof raw === "boolean") enabled = raw;
  else if (typeof raw === "string") enabled = raw === "true";

  const { data: recentRuns } = await supabase
    .from("audit_log")
    .select("action, created_at, meta")
    .like("action", "cron.%")
    .order("created_at", { ascending: false })
    .limit(20);

  return (
    <main className="min-h-screen p-6 sm:p-10">
      <div className="max-w-2xl mx-auto">
        <Link href="/admin" className="text-sm text-morey-ocean hover:underline">
          ← Admin
        </Link>
        <h1 className="text-3xl font-bold text-morey-deep mt-2">
          Daily Report Automation
        </h1>
        <p className="text-sm text-gray-500 mb-6">
          Seasonal toggle for the overnight cron jobs.
        </p>

        <AutomationClient
          initialEnabled={enabled}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          lastChangedAt={(setting as any)?.updated_at ?? null}
        />

        <section className="bg-white rounded-bubble shadow p-5 mt-6">
          <h2 className="text-lg font-semibold text-morey-deep mb-2">
            What automation does
          </h2>
          <div className="text-sm text-gray-700 space-y-2">
            <p>
              <b className="text-morey-deep">1 AM ET — Lock pending reports.</b>{" "}
              Any report still in <code>pending</code> status from the previous
              day flips to <code>locked</code>. Default users can no longer
              edit them. Managers can still unlock.
            </p>
            <p>
              <b className="text-morey-deep">1:30 AM ET — Fallback report.</b>{" "}
              If a Daily Report wasn&apos;t sent manually, the system auto-emails
              recipients a minimal PDF (weather + metrics + &quot;Nothing to
              report&quot;) so executives always get something every morning.
            </p>
            <p className="text-xs text-gray-500 pt-2">
              Both jobs check this toggle. When OFF, neither runs. Users can
              still log reports and supervisors can still manually build /
              send Daily Reports.
            </p>
          </div>
        </section>

        <section className="bg-white rounded-bubble shadow p-5 mt-6">
          <h2 className="text-lg font-semibold text-morey-deep mb-2">
            Recent automation runs ({recentRuns?.length ?? 0})
          </h2>
          {!recentRuns || recentRuns.length === 0 ? (
            <p className="text-sm text-gray-500">
              No runs yet. (Cron jobs only fire once deployed to Vercel, or
              when triggered manually.)
            </p>
          ) : (
            <ul className="divide-y divide-gray-100 text-sm">
              {recentRuns.map((r, i) => (
                <li key={i} className="py-2 flex items-center gap-3">
                  <span className="font-mono text-xs">{r.action}</span>
                  <span className="text-xs text-gray-500 ml-auto">
                    {new Date(r.created_at).toLocaleString()}
                  </span>
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  {(r as any).meta && (
                    <details className="text-[10px] text-gray-400">
                      <summary>meta</summary>
                      <pre className="whitespace-pre-wrap">
                        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                        {JSON.stringify((r as any).meta, null, 2)}
                      </pre>
                    </details>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}

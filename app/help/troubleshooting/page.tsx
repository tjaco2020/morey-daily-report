import Link from "next/link";
import { AlertCircle, ChevronDown } from "lucide-react";

export const metadata = {
  title: "Troubleshooting — Morey's Daily Report",
};

const ITEMS: { q: string; a: React.ReactNode }[] = [
  {
    q: "The yellow bubble doesn't show up.",
    a: (
      <ul>
        <li>
          Make sure you completed today&apos;s shift gate (Good morning! card).
          The bubble appears <em>after</em> you set your shift.
        </li>
        <li>Refresh the page. It pulls latest state from the server.</li>
        <li>
          Check the bottom-right corner — if the panel is open, the bubble is
          hidden behind it.
        </li>
      </ul>
    ),
  },
  {
    q: "I'm getting \"Invalid PIN\" but I'm sure it's right.",
    a: (
      <ul>
        <li>PINs are 4–6 digits. Make sure you&apos;re typing all of them.</li>
        <li>
          If you recently set a PIN that another user already had, your set
          may have been rejected. Try setting a fresh PIN under{" "}
          <em>avatar → Set / change PIN</em>.
        </li>
        <li>
          A manager can always reset your PIN via <em>Admin → Users</em>.
        </li>
      </ul>
    ),
  },
  {
    q: "I submitted a report and now I can't edit it.",
    a: (
      <>
        Correct behavior — submitted reports are locked for default users so
        the day&apos;s record stays consistent. Ask a supervisor or manager;
        they can edit any report up until it&apos;s archived.
      </>
    ),
  },
  {
    q: "The Send Daily Report button fails with \"You can only send testing emails to your own email address.\"",
    a: (
      <>
        That&apos;s Resend&apos;s dev-mode restriction. Until your custom
        domain (e.g. <code>moreyspiers.com</code>) is verified in Resend, the
        only recipient allowed is the email you used to sign up for Resend.
        Either deactivate other recipients temporarily, or have a manager
        verify the domain in Resend.
      </>
    ),
  },
  {
    q: "Metrics show \"Demo data\" even though I expected real data.",
    a: (
      <ul>
        <li>
          Make sure the six <code>SNOWFLAKE_*</code> environment variables are
          set on the server (and the deployment has been restarted since they
          were added).
        </li>
        <li>
          Click <em>Refresh</em> on the metrics card. Check the response in{" "}
          <em>Admin → Snowflake mappings</em> — the recent query log shows
          whether the last call hit real Snowflake or fell back to mock.
        </li>
      </ul>
    ),
  },
  {
    q: "AI proofread or AI summary returns an error.",
    a: (
      <ul>
        <li>
          Check that <code>ANTHROPIC_API_KEY</code> is set on the server and
          the server has been restarted since.
        </li>
        <li>
          If Claude&apos;s API is briefly down, the button just errors — try
          again in a minute.
        </li>
      </ul>
    ),
  },
  {
    q: "The cron jobs (1 AM lock / 1:30 AM fallback) don't seem to be running.",
    a: (
      <ul>
        <li>
          Cron only runs on Vercel — not on your laptop. Verify you&apos;re
          looking at the deployed instance.
        </li>
        <li>
          In <em>Admin → Automation</em>, confirm the toggle is ON.
        </li>
        <li>
          The recent runs list on that page shows what fired and when.
        </li>
      </ul>
    ),
  },
  {
    q: "Someone left a draft and went home. How do I clean it up?",
    a: (
      <>
        Open <em>Supervisor → Build Daily Report → today</em>. Pending reports
        from associates appear in the amber-bordered section at the top. Click{" "}
        <em>Edit</em> to fix the text (use AI proofread to polish), then{" "}
        <em>Submit only</em> or check <em>Include</em> to roll it into the
        daily report.
      </>
    ),
  },
  {
    q: "I added a new category / terminal but staff don't see it.",
    a: (
      <ul>
        <li>
          Verify the <em>Active</em> toggle is on in <em>Admin → Categories</em>{" "}
          or <em>Terminals</em>. Hidden items don&apos;t appear in dropdowns.
        </li>
        <li>
          Have staff refresh their browser. Dropdowns are cached briefly.
        </li>
      </ul>
    ),
  },
];

export default function TroubleshootingPage() {
  return (
    <main className="px-4 sm:px-6 py-8 sm:py-10">
      <div className="max-w-3xl mx-auto">
        <Link
          href="/help"
          className="text-sm text-morey-ocean hover:text-morey-deep transition"
        >
          ← Help
        </Link>
        <div className="flex items-center gap-2 mt-2">
          <AlertCircle className="w-6 h-6 text-morey-orange" />
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-morey-deep">
            Troubleshooting
          </h1>
        </div>
        <p className="text-sm text-morey-mid mt-1 mb-6">
          When something doesn&apos;t look right. Click a row to expand.
        </p>

        <div className="bg-white rounded-bubble shadow-card border border-slate-100/80 divide-y divide-slate-100 overflow-hidden">
          {ITEMS.map((item, i) => (
            <details key={i} className="group">
              <summary className="cursor-pointer list-none flex items-center justify-between gap-3 px-5 py-4 text-sm font-medium text-morey-deep hover:bg-slate-50/60 transition">
                <span>{item.q}</span>
                <ChevronDown className="w-4 h-4 text-morey-mid shrink-0 group-open:rotate-180 transition-transform" />
              </summary>
              <div className="px-5 pb-4 text-sm text-morey-mid leading-relaxed [&_ul]:list-disc [&_ul]:list-outside [&_ul]:pl-5 [&_ul]:space-y-1">
                {item.a}
              </div>
            </details>
          ))}
        </div>

        <p className="text-xs text-morey-mid mt-6">
          Still stuck? Take a screenshot of the error and send to your manager
          or IT. The audit log under{" "}
          <em>Admin → Snowflake mappings</em> and the recent-runs list under{" "}
          <em>Admin → Automation</em> are useful to attach.
        </p>
      </div>
    </main>
  );
}

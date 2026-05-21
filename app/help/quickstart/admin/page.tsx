import Link from "next/link";
import {
  ShieldCheck,
  FileText,
  Mail,
  Settings,
  Search,
  Sparkles,
  Send,
} from "lucide-react";
import { PrintButton } from "@/components/PrintButton";

export const metadata = {
  title: "Supervisor & Manager Quick Start — Morey's Daily Report",
};

export default function AdminQuickstart() {
  return (
    <main className="px-4 sm:px-6 py-8 sm:py-10 print:py-4">
      <div className="max-w-3xl mx-auto">
        <div className="print:hidden mb-4 flex items-center justify-between">
          <Link
            href="/help"
            className="text-sm text-morey-ocean hover:text-morey-deep transition"
          >
            ← Help
          </Link>
          <PrintButton />
        </div>

        <header className="mb-6 print:mb-4">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-morey-deep to-[#1E293B] text-white shadow-bubble mb-3 print:shadow-none">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-morey-deep">
            Supervisor &amp; Manager Quick Start
          </h1>
          <p className="text-sm text-morey-mid mt-1">
            Review the day&apos;s reports, build the Daily Report, run the
            admin panel.
          </p>
        </header>

        <Section title="Daily flow (every shift)" icon={ShieldCheck}>
          <ol>
            <li>
              Open <em>Supervisor</em> in the top nav. You&apos;ll see every
              report logged today — Pending, Submitted, Included.
            </li>
            <li>
              Use the filters (status, category, terminal, user, keyword) to
              scan the day&apos;s activity.
            </li>
            <li>
              Click any report to view or edit it. As a supervisor you can
              edit reports filed by anyone — your edits are logged.
            </li>
            <li>
              When ready, click <em>Build Daily Report →</em>.
            </li>
          </ol>
        </Section>

        <Section title="Building the Daily Report" icon={FileText}>
          <p>
            The Build page is where you curate what executives see. Top of
            the page has three auto-populated cards:
          </p>
          <ul>
            <li>
              <strong>Weather</strong> (Wildwood, NJ) — refreshes when you
              open the page and again when you Send.
            </li>
            <li>
              <strong>AI Summary</strong> — click <em>Generate</em> to have
              Claude write a 3–5 sentence executive summary of the day. You
              can edit the result, or click <em>AI proofread</em> to polish it.
            </li>
            <li>
              <strong>Transactions &amp; Tickets</strong> — pulled from
              Snowflake. Categories from RptCategory1.
            </li>
          </ul>
          <p>
            <strong>Pending reports</strong> from associates show in an amber
            section at the top. You can:
          </p>
          <ul>
            <li><em>Edit →</em> open and rewrite</li>
            <li><em>Submit only</em> — clear from pending without including</li>
            <li><em>Include</em> checkbox — submits and includes in one click</li>
          </ul>
          <p>
            Then check the <strong>Include</strong> box next to any other
            submitted report you want in tonight&apos;s email. Add{" "}
            <strong>Supervisor notes</strong> above the report list.
          </p>
        </Section>

        <Section title="Preview &amp; Send" icon={Send}>
          <ol>
            <li>
              <strong>Preview PDF</strong> opens what the email attachment
              will look like.
            </li>
            <li>
              <strong>Send Daily Report</strong> emails the PDF to every
              active recipient in <em>Admin → Email recipients</em>. Weather
              and metrics refresh one final time right before sending. Reports
              flip to <em>archived</em> status.
            </li>
          </ol>
          <p className="text-xs text-morey-mid">
            ⏰ If you don&apos;t send by 1:30 AM, the system auto-sends a
            fallback report with weather + metrics + &quot;Nothing to
            report.&quot; You can disable this in{" "}
            <em>Admin → Automation</em>.
          </p>
        </Section>

        <Section title="Search &amp; export" icon={Search}>
          <p>
            On the <em>Supervisor</em> page:
          </p>
          <ul>
            <li>
              Search by <strong>keyword</strong> or <strong>case number</strong>.
            </li>
            <li>
              <strong>Export CSV</strong> downloads whatever the filters are
              currently showing.
            </li>
            <li>
              Past dates are reachable by changing the date filter or going
              directly to <code>/supervisor?date=YYYY-MM-DD</code>.
            </li>
          </ul>
        </Section>

        <Section
          title="Admin panel (Managers only)"
          icon={Settings}
          subtitle="Everything under /admin"
        >
          <ul>
            <li>
              <strong>Email recipients</strong> — who gets the Daily Report
              email.
            </li>
            <li>
              <strong>Users</strong> — invite by email, change roles, reset
              PINs, deactivate.
            </li>
            <li>
              <strong>Categories</strong> — add/edit/remove categories the
              report widget shows. Use display order to put the most-used
              ones first.
            </li>
            <li>
              <strong>Terminals</strong> — same for POS terminals / locations.
            </li>
            <li>
              <strong>Automation</strong> — toggle the 1 AM lock and 1:30 AM
              fallback report on or off. Turn off for the off-season.
            </li>
            <li>
              <strong>Snowflake mappings</strong> — display names for raw
              product categories, plus a status panel.
            </li>
            <li>
              <strong>Embed widget</strong> — copy a snippet that drops the
              yellow bubble into other internal sites.
            </li>
          </ul>
        </Section>

        <Section title="Roles cheat sheet" icon={Mail}>
          <table className="w-full text-sm border-collapse">
            <tbody>
              <CheatRow
                what="User (default)"
                how="Logs and edits their own reports."
              />
              <CheatRow
                what="Supervisor"
                how="Above + edits everyone's reports, builds & sends Daily Report."
              />
              <CheatRow
                what="Manager"
                how="Above + admin panel: users, categories, terminals, recipients."
              />
            </tbody>
          </table>
        </Section>

        <Section title="Pro tips" icon={Sparkles}>
          <ul>
            <li>
              Use <strong>AI proofread</strong> on supervisor notes before
              sending — it tightens up wording for executive readers.
            </li>
            <li>
              The fallback report only goes out if automation is ON. Keep it
              on during the season, off in winter.
            </li>
            <li>
              Need to fix something post-send? Reports become <em>archived</em>
              ; managers can unlock them via the database if absolutely
              necessary. Or just send a follow-up.
            </li>
          </ul>
        </Section>

        <div className="print:hidden mt-8 text-sm text-morey-mid">
          More:{" "}
          <Link href="/help/faq" className="text-morey-ocean hover:underline">
            FAQ
          </Link>{" "}
          •{" "}
          <Link
            href="/help/troubleshooting"
            className="text-morey-ocean hover:underline"
          >
            Troubleshooting
          </Link>
        </div>
      </div>
    </main>
  );
}

function Section({
  title,
  icon: Icon,
  subtitle,
  children,
}: {
  title: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  icon: any;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="bg-white rounded-bubble shadow-card border border-slate-100/80 p-5 mb-4 print:shadow-none print:border-slate-300 print:break-inside-avoid">
      <h2 className="flex items-center gap-2 text-base font-semibold text-morey-deep">
        <Icon className="w-4 h-4 text-morey-ocean" />
        {title}
      </h2>
      {subtitle && (
        <p className="text-xs text-morey-mid mt-0.5 mb-2">{subtitle}</p>
      )}
      <div className="text-sm text-morey-deep space-y-2 mt-2 [&_ol]:list-decimal [&_ol]:list-outside [&_ol]:pl-5 [&_ol]:space-y-1 [&_ul]:list-disc [&_ul]:list-outside [&_ul]:pl-5 [&_ul]:space-y-1">
        {children}
      </div>
    </section>
  );
}

function CheatRow({ what, how }: { what: string; how: string }) {
  return (
    <tr className="border-t border-slate-100 first:border-t-0">
      <td className="py-2 pr-3 font-medium text-morey-deep w-1/3">{what}</td>
      <td className="py-2 text-morey-mid">{how}</td>
    </tr>
  );
}

import Link from "next/link";
import {
  MessageSquare,
  FileText,
  KeyRound,
  Users,
} from "lucide-react";
import { PrintButton } from "@/components/PrintButton";

export const metadata = {
  title: "Frontline Quick Start — Morey's Daily Report",
};

export default function FrontlineQuickstart() {
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
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-morey-yellow to-morey-orange text-morey-deep shadow-bubble mb-3 print:shadow-none">
            <MessageSquare className="w-6 h-6" />
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-morey-deep">
            Frontline Quick Start
          </h1>
          <p className="text-sm text-morey-mid mt-1">
            The 5-minute guide for staff who log reports. Keep it printed
            near your POS.
          </p>
        </header>

        <Section title="1. The yellow bubble" icon={MessageSquare}>
          <p>
            Anywhere you see a <strong>yellow bubble</strong> in the bottom
            right corner of the screen, you can click it to log a report.
            That&apos;s your entry point.
          </p>
        </Section>

        <Section title="2. First time today — set your shift" icon={Users}>
          <p>
            The first time you open the tool each day, you&apos;ll see a
            &quot;Good morning!&quot; card asking for:
          </p>
          <ul>
            <li><strong>Scheduled start</strong> and <strong>scheduled end</strong> time.</li>
            <li><strong>Terminal / location</strong> — pick the POS or area you&apos;re working.</li>
          </ul>
          <p>
            Hit <strong>Start my shift</strong>. You only do this once per day;
            it&apos;s remembered across browsers and devices.
          </p>
        </Section>

        <Section title="3. Logging a report" icon={FileText}>
          <ol>
            <li>Click the yellow bubble.</li>
            <li>
              Type what happened. Be specific. The tool has an{" "}
              <strong>AI Proofread</strong> button — click it to clean up the
              language before submitting.
            </li>
            <li>Pick a <strong>category</strong> (IT, Guest, Safety, etc.).</li>
            <li>
              Choose <strong>Save as draft</strong> if you want to come back
              and add details, or <strong>Submit</strong> if you&apos;re done.
            </li>
          </ol>
        </Section>

        <Section title="4. Drafts vs. Submitted" icon={FileText}>
          <p>
            <strong>Drafts</strong> are reports you started but didn&apos;t
            finish. They stay editable. Click{" "}
            <em>View today&apos;s reports</em> to find them later, edit, and
            submit when ready.
          </p>
          <p>
            <strong>Submitted</strong> reports are locked in. The supervisor
            sees them on their dashboard. You generally can&apos;t edit a
            submitted report — ask a supervisor if you need a change.
          </p>
          <p className="text-xs text-morey-mid">
            ⏰ Any drafts left at 1 AM get auto-locked. Submit before the end
            of your shift.
          </p>
        </Section>

        <Section title="5. PIN mode (no sign-in needed)" icon={KeyRound}>
          <p>
            For the fastest possible report from a shared POS:
          </p>
          <ol>
            <li>
              Set your PIN once: <em>Avatar menu → Set / change PIN</em>. 4–6
              digits. Don&apos;t share it.
            </li>
            <li>
              On any device with the yellow bubble installed, click the
              widget and look for <em>+ Log as someone else (PIN override)</em>.
            </li>
            <li>
              Enter your PIN + the report. It files under your account from
              whichever terminal you&apos;re on.
            </li>
          </ol>
        </Section>

        <Section title="Cheat sheet" icon={MessageSquare}>
          <table className="w-full text-sm border-collapse">
            <tbody>
              <CheatRow what="Where's the widget?" how="Bottom right of any page." />
              <CheatRow what="Lost a draft?" how={"View today's reports → click Edit."} />
              <CheatRow what="My English isn't great" how="Use AI Proofread before submitting." />
              <CheatRow what="Wrong terminal showing" how="Sign out and back in to reset your shift." />
              <CheatRow what="Forgot PIN" how="Ask any manager to reset it." />
            </tbody>
          </table>
        </Section>

        <div className="print:hidden mt-8 text-sm text-morey-mid">
          Need more?{" "}
          <Link href="/help/faq" className="text-morey-ocean hover:underline">
            See the FAQ
          </Link>{" "}
          or{" "}
          <Link
            href="/help/troubleshooting"
            className="text-morey-ocean hover:underline"
          >
            troubleshooting
          </Link>
          .
        </div>
      </div>
    </main>
  );
}

function Section({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  icon: any;
  children: React.ReactNode;
}) {
  return (
    <section className="bg-white rounded-bubble shadow-card border border-slate-100/80 p-5 mb-4 print:shadow-none print:border-slate-300 print:break-inside-avoid">
      <h2 className="flex items-center gap-2 text-base font-semibold text-morey-deep mb-2">
        <Icon className="w-4 h-4 text-morey-ocean" />
        {title}
      </h2>
      <div className="text-sm text-morey-deep space-y-2 [&_ol]:list-decimal [&_ol]:list-outside [&_ol]:pl-5 [&_ol]:space-y-1 [&_ul]:list-disc [&_ul]:list-outside [&_ul]:pl-5 [&_ul]:space-y-1">
        {children}
      </div>
    </section>
  );
}

function CheatRow({ what, how }: { what: string; how: string }) {
  return (
    <tr className="border-t border-slate-100 first:border-t-0">
      <td className="py-2 pr-3 font-medium text-morey-deep w-1/2">{what}</td>
      <td className="py-2 text-morey-mid">{how}</td>
    </tr>
  );
}

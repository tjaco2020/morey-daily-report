import Link from "next/link";
import { ChevronDown } from "lucide-react";

export const metadata = {
  title: "FAQ — Morey's Daily Report",
};

const SECTIONS: {
  title: string;
  items: { q: string; a: React.ReactNode }[];
}[] = [
  {
    title: "Getting started",
    items: [
      {
        q: "I just got the email invite. What now?",
        a: (
          <>
            Click the link in the email, choose a password, and you&apos;ll land
            on the dashboard. The first time you open the tool each day
            you&apos;ll be asked to set your scheduled start, end, and terminal
            for the day.
          </>
        ),
      },
      {
        q: "Where do I log a report?",
        a: (
          <>
            Click the beAcon bubble in the bottom-right corner of any page.
            Type what happened, pick a category, hit Submit. Done.
          </>
        ),
      },
      {
        q: "What is a Daily Report?",
        a: (
          <>
            The curated end-of-day summary that gets emailed to executives.
            Supervisors build it from the day&apos;s submitted reports plus
            weather, metrics, and an AI-written summary.
          </>
        ),
      },
    ],
  },
  {
    title: "Drafts &amp; submitting",
    items: [
      {
        q: "What's the difference between Save as draft and Submit?",
        a: (
          <>
            <strong>Drafts</strong> are reports you started but haven&apos;t
            finished — they stay editable until you submit them.{" "}
            <strong>Submitted</strong> reports are locked in and show up on the
            supervisor dashboard.
          </>
        ),
      },
      {
        q: "Can I edit a report after submitting it?",
        a: (
          <>
            Only while it&apos;s still in <em>submitted</em> status (before
            it&apos;s included in a daily report and sent). If you need a
            change after that, ask a supervisor or manager.
          </>
        ),
      },
      {
        q: "What happens to drafts at the end of the night?",
        a: (
          <>
            At 1 AM, any pending drafts get auto-locked. Default users
            can&apos;t edit locked reports, but a manager can unlock them.
            Best practice: submit before you go home.
          </>
        ),
      },
    ],
  },
  {
    title: "PIN mode",
    items: [
      {
        q: "What's a PIN for?",
        a: (
          <>
            A 4–6 digit PIN lets you log reports without fully signing in. Handy
            at a shared POS or when someone else&apos;s account is already
            logged in.
          </>
        ),
      },
      {
        q: "How do I set or change my PIN?",
        a: (
          <>
            Click your avatar (top right) → <em>Set / change PIN</em>. PINs are
            unique across the org — if someone&apos;s already using a PIN,
            you&apos;ll be asked to pick a different one.
          </>
        ),
      },
      {
        q: "I forgot my PIN.",
        a: (
          <>
            Ask any manager to reset it from <em>Admin → Users</em> → click{" "}
            <em>Reset PIN</em> next to your name.
          </>
        ),
      },
      {
        q: "How does PIN override on someone else's screen work?",
        a: (
          <>
            Open the widget on the other person&apos;s machine. Click{" "}
            <em>+ Log as someone else (PIN override)</em>, enter your PIN. The
            report files under your account but from their terminal. You can
            review it from your own dashboard later.
          </>
        ),
      },
    ],
  },
  {
    title: "AI features",
    items: [
      {
        q: "What does the AI Proofread button do?",
        a: (
          <>
            It runs your draft through Claude with strict instructions: fix
            grammar, spelling, and tone for executive readers, but never invent
            details. You see the suggestion before applying it — accept or
            dismiss.
          </>
        ),
      },
      {
        q: "Can I edit the AI-generated daily summary?",
        a: (
          <>
            Yes. The textarea is fully editable. You can also click{" "}
            <em>AI proofread</em> on it to refine further. Then click{" "}
            <em>Save edits</em>.
          </>
        ),
      },
    ],
  },
  {
    title: "Supervisor / Manager",
    items: [
      {
        q: "How do I see all reports for a date?",
        a: (
          <>
            <em>Supervisor</em> in the top nav. Change the date filter to scan
            past days. Use status / category / terminal / user / keyword filters
            to narrow.
          </>
        ),
      },
      {
        q: "Can I undo an &quot;Include&quot; in the daily report?",
        a: (
          <>
            Yes — just uncheck the box on the builder. The report reverts to
            <em> submitted</em>, no harm done. Once the Daily Report is sent,
            included reports become <em>archived</em>.
          </>
        ),
      },
      {
        q: "How do I add a new email recipient?",
        a: (
          <>
            <em>Admin → Email recipients</em> → add their name and email →
            click Add. They&apos;ll receive every Daily Report from then on.
            Deactivate (uncheck) to stop without deleting.
          </>
        ),
      },
      {
        q: "How do I add a new POS terminal?",
        a: (
          <>
            <em>Admin → Terminals</em>. New terminals appear immediately in the
            shift gate and widget dropdowns.
          </>
        ),
      },
    ],
  },
  {
    title: "Embedding the bubble in other tools",
    items: [
      {
        q: "Can the widget live in other internal sites?",
        a: (
          <>
            Yes. <em>Admin → Embed widget</em> gives you a snippet (one{" "}
            <code className="text-xs bg-slate-100 px-1 rounded">&lt;script&gt;</code>{" "}
            tag) to drop into the footer of any internal site. It runs in
            PIN-only mode there (no app login needed on the host site).
          </>
        ),
      },
    ],
  },
];

export default function FaqPage() {
  return (
    <main className="px-4 sm:px-6 py-8 sm:py-10">
      <div className="max-w-3xl mx-auto">
        <Link
          href="/help"
          className="text-sm text-morey-ocean hover:text-morey-deep transition"
        >
          ← Help
        </Link>
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-morey-deep mt-2">
          Frequently asked questions
        </h1>
        <p className="text-sm text-morey-mid mt-1 mb-6">
          Click any question to expand. Can&apos;t find your answer? Try the{" "}
          <Link
            href="/help/troubleshooting"
            className="text-morey-ocean hover:underline"
          >
            troubleshooting guide
          </Link>
          .
        </p>

        {SECTIONS.map((s) => (
          <section key={s.title} className="mb-6">
            <h2
              className="text-xs font-semibold uppercase tracking-wider text-morey-mid mb-2"
              dangerouslySetInnerHTML={{ __html: s.title }}
            />
            <div className="bg-white rounded-bubble shadow-card border border-slate-100/80 divide-y divide-slate-100 overflow-hidden">
              {s.items.map((item, i) => (
                <details key={i} className="group">
                  <summary className="cursor-pointer list-none flex items-center justify-between gap-3 px-5 py-4 text-sm font-medium text-morey-deep hover:bg-slate-50/60 transition">
                    <span>{item.q}</span>
                    <ChevronDown className="w-4 h-4 text-morey-mid shrink-0 group-open:rotate-180 transition-transform" />
                  </summary>
                  <div className="px-5 pb-4 text-sm text-morey-mid leading-relaxed">
                    {item.a}
                  </div>
                </details>
              ))}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}

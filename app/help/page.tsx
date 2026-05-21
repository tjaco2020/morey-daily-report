import { createServerSupabase } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  Rocket,
  Users,
  ShieldCheck,
  Settings,
  HelpCircle,
  AlertCircle,
  ArrowRight,
  FileText,
  KeyRound,
  Sparkles,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function HelpHome() {
  const supabase = createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <main className="px-4 sm:px-6 py-8 sm:py-10">
      <div className="max-w-5xl mx-auto">
        {/* Hero */}
        <section className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-morey-yellow to-morey-orange text-morey-deep shadow-bubble mb-3">
            <HelpCircle className="w-7 h-7" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-morey-deep">
            Help &amp; Support
          </h1>
          <p className="text-sm text-morey-mid mt-2 max-w-xl mx-auto">
            Quick starts, how-tos, FAQs, and troubleshooting for the Daily
            Report Tool.
          </p>
        </section>

        {/* Quick starts */}
        <section className="mb-10">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-morey-mid mb-3">
            Quick starts
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FeatureCard
              href="/help/quickstart/frontline"
              icon={Rocket}
              tone="yellow"
              title="For frontline staff"
              desc="The 5-minute guide to logging reports from the widget, drafts vs. submitted, and using PIN mode."
            />
            <FeatureCard
              href="/help/quickstart/admin"
              icon={ShieldCheck}
              tone="navy"
              title="For supervisors &amp; managers"
              desc="Review the day's reports, build &amp; send the Daily Report, run the admin panel."
            />
          </div>
        </section>

        {/* Topics */}
        <section className="mb-10">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-morey-mid mb-3">
            Topics
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <TopicCard
              href="/help/faq"
              icon={HelpCircle}
              title="Frequently asked"
              desc="Quick answers to the most common questions."
            />
            <TopicCard
              href="/help/troubleshooting"
              icon={AlertCircle}
              title="Troubleshooting"
              desc="When something doesn&apos;t look right."
            />
            <TopicCard
              href="/help/topics/widget"
              icon={FileText}
              title="The report widget"
              desc="Drafts, submits, categories, terminals."
            />
            <TopicCard
              href="/help/topics/pin"
              icon={KeyRound}
              title="PIN mode"
              desc="Quick reports from a POS or someone else&apos;s screen."
            />
            <TopicCard
              href="/help/topics/supervisor"
              icon={Users}
              title="Supervisor flow"
              desc="Filter, search, edit, build the daily report."
            />
            <TopicCard
              href="/help/topics/admin"
              icon={Settings}
              title="Admin panel"
              desc="Users, categories, terminals, recipients."
            />
          </div>
        </section>

        {/* Tip */}
        <section className="bg-gradient-to-br from-morey-yellowSoft to-amber-50 rounded-bubble border border-amber-200 p-5 flex items-start gap-3">
          <Sparkles className="w-5 h-5 text-morey-orange shrink-0 mt-0.5" />
          <div className="text-sm text-morey-deep">
            <strong>New here?</strong> Start with the frontline quick-start
            above. If you&apos;re a supervisor or manager, do the frontline one
            first, then the admin one — supervisors also log reports themselves.
          </div>
        </section>
      </div>
    </main>
  );
}

function FeatureCard({
  href,
  icon: Icon,
  title,
  desc,
  tone,
}: {
  href: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  icon: any;
  title: string;
  desc: string;
  tone: "yellow" | "navy";
}) {
  const toneClasses =
    tone === "yellow"
      ? "from-morey-yellow to-morey-orange text-morey-deep"
      : "from-morey-deep to-[#1E293B] text-white";
  return (
    <Link
      href={href}
      className="group bg-white rounded-bubble shadow-card border border-slate-100/80 p-5 hover:shadow-cardHover transition flex items-start gap-4"
    >
      <div
        className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${toneClasses} flex items-center justify-center shadow-sm shrink-0`}
      >
        <Icon className="w-6 h-6" />
      </div>
      <div className="min-w-0">
        <h3 className="font-semibold text-morey-deep">{title}</h3>
        <p className="text-sm text-morey-mid mt-1">{desc}</p>
        <div className="flex items-center gap-1 mt-2 text-xs text-morey-ocean group-hover:translate-x-0.5 transition-transform">
          Read guide <ArrowRight className="w-3.5 h-3.5" />
        </div>
      </div>
    </Link>
  );
}

function TopicCard({
  href,
  icon: Icon,
  title,
  desc,
}: {
  href: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  icon: any;
  title: string;
  desc: string;
}) {
  return (
    <Link
      href={href}
      className="group bg-white rounded-bubble shadow-card border border-slate-100/80 p-4 hover:shadow-cardHover hover:border-morey-yellow/50 transition"
    >
      <div className="flex items-center gap-2 mb-1">
        <Icon className="w-4 h-4 text-morey-ocean" />
        <h3 className="font-semibold text-sm text-morey-deep">{title}</h3>
      </div>
      <p className="text-xs text-morey-mid">{desc}</p>
    </Link>
  );
}

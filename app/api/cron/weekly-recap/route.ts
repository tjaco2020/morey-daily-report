import { NextResponse, type NextRequest } from "next/server";
import { Resend } from "resend";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { isAuthorizedCron } from "@/lib/cron-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-haiku-4-5-20251001";

/**
 * Weekly recap. Runs Mondays at 9 AM ET.
 *
 * Covers the previous week (Monday → Sunday in America/New_York).
 * Aggregates reports, sends to email_recipients with an AI-written summary.
 * If weekly_recap_enabled is off, skip.
 */
export async function GET(request: NextRequest) {
  return handle(request);
}
export async function POST(request: NextRequest) {
  return handle(request);
}

async function handle(request: NextRequest) {
  if (!isAuthorizedCron(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const supabase = createAdminSupabase();

  // Toggle check
  const { data: setting } = await supabase
    .from("app_settings")
    .select("value")
    .eq("key", "weekly_recap_enabled")
    .maybeSingle();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const enabled = (setting as any)?.value;
  const isEnabled =
    enabled === true || enabled === "true" || enabled === undefined;
  if (!isEnabled) {
    return NextResponse.json({
      ok: true,
      skipped: true,
      reason: "weekly_recap_enabled is off",
    });
  }

  // Compute previous week's Monday..Sunday in NY time
  const { weekStart, weekEnd } = getPreviousWeekRange();

  // Bail if we've already sent this week's recap
  const { data: existing } = await supabase
    .from("weekly_recaps")
    .select("id, sent_at")
    .eq("week_start", weekStart)
    .maybeSingle();
  if (existing?.sent_at) {
    return NextResponse.json({
      ok: true,
      skipped: true,
      reason: "already sent for this week",
      week_start: weekStart,
    });
  }

  // Fetch reports for the week
  const { data: reports } = await supabase
    .from("reports")
    .select(
      `id, case_number, status, text, report_date, submitted_at, created_at,
       categories(name), terminals(name),
       locations:terminal_location_id(name),
       profiles!reports_user_id_fkey(full_name, email)`,
    )
    .gte("report_date", weekStart)
    .lte("report_date", weekEnd)
    .in("status", ["submitted", "included", "archived"])
    .order("created_at", { ascending: true });

  const reportList = reports ?? [];

  // Stats snapshot
  const byCategory: Record<string, number> = {};
  const byLocation: Record<string, number> = {};
  const byDay: Record<string, number> = {};
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  reportList.forEach((r: any) => {
    const cat = r.categories?.name ?? "Other";
    const loc = r.locations?.name ?? "Unassigned";
    byCategory[cat] = (byCategory[cat] ?? 0) + 1;
    byLocation[loc] = (byLocation[loc] ?? 0) + 1;
    byDay[r.report_date] = (byDay[r.report_date] ?? 0) + 1;
  });

  // Generate AI summary
  let aiSummary = "";
  let aiError: string | null = null;
  try {
    aiSummary = await generateWeeklyRecap({
      weekStart,
      weekEnd,
      reports: reportList,
      byCategory,
      byLocation,
    });
  } catch (err) {
    aiError = err instanceof Error ? err.message : String(err);
  }

  // Active recipients (reuse the daily report recipient list)
  const { data: recipients } = await supabase
    .from("email_recipients")
    .select("name, email")
    .eq("active", true);

  // Upsert weekly_recaps row first so we have a record even if send fails
  const { data: recapRow } = await supabase
    .from("weekly_recaps")
    .upsert(
      {
        week_start: weekStart,
        week_end: weekEnd,
        ai_summary: aiSummary || aiError || "",
        total_reports: reportList.length,
        stats_snapshot: {
          by_category: byCategory,
          by_location: byLocation,
          by_day: byDay,
        },
        recipient_emails: recipients,
      },
      { onConflict: "week_start" },
    )
    .select()
    .single();

  if (!recipients || recipients.length === 0) {
    await supabase
      .from("weekly_recaps")
      .update({ error_message: "No active recipients" })
      .eq("id", recapRow?.id);
    return NextResponse.json({
      ok: true,
      skipped: true,
      reason: "no active recipients",
      week_start: weekStart,
    });
  }

  // Build + send email
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "RESEND_API_KEY not set" },
      { status: 503 },
    );
  }
  const resend = new Resend(apiKey);
  const from =
    process.env.RESEND_FROM_EMAIL ||
    "beAcon Operational Intelligence <onboarding@resend.dev>";

  const subject = `beAcon · Weekly Recap — Morey's Piers · ${weekStart} → ${weekEnd}`;
  const htmlBody = renderWeeklyHTML({
    weekStart,
    weekEnd,
    aiSummary: aiSummary || "(AI summary unavailable this week.)",
    byCategory,
    byLocation,
    totalReports: reportList.length,
  });
  const textBody = renderWeeklyText({
    weekStart,
    weekEnd,
    aiSummary: aiSummary || "(AI summary unavailable this week.)",
    byCategory,
    byLocation,
    totalReports: reportList.length,
  });

  const sendResult = await resend.emails.send({
    from,
    to: recipients.map((r) => r.email),
    subject,
    html: htmlBody,
    text: textBody,
  });

  if (sendResult.error) {
    await supabase
      .from("weekly_recaps")
      .update({ error_message: sendResult.error.message })
      .eq("id", recapRow?.id);
    return NextResponse.json(
      { error: sendResult.error.message },
      { status: 502 },
    );
  }

  await supabase
    .from("weekly_recaps")
    .update({
      sent_at: new Date().toISOString(),
      sent_message_id: sendResult.data?.id ?? null,
    })
    .eq("id", recapRow?.id);

  await supabase.from("audit_log").insert({
    action: "cron.weekly_recap_sent",
    entity_type: "weekly_recap",
    entity_id: recapRow?.id,
    meta: {
      week_start: weekStart,
      week_end: weekEnd,
      total_reports: reportList.length,
      recipient_count: recipients.length,
      message_id: sendResult.data?.id,
    },
  });

  return NextResponse.json({
    ok: true,
    sent: true,
    week_start: weekStart,
    week_end: weekEnd,
    total_reports: reportList.length,
    recipient_count: recipients.length,
  });
}

function getPreviousWeekRange(): { weekStart: string; weekEnd: string } {
  // Today in NY
  const today = new Date().toLocaleDateString("en-CA", {
    timeZone: "America/New_York",
  });
  const [y, m, d] = today.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  // Day of week with Monday=1..Sunday=7 (use ISO)
  const dow = dt.getUTCDay() || 7; // Sun=0 → 7
  // Previous Monday is today minus (dow + 6) days... actually:
  //   If today is Monday (dow=1), previous Mon..Sun was 7..1 days ago.
  //   = today - 7 days to today - 1 day
  const previousMon = new Date(dt);
  previousMon.setUTCDate(previousMon.getUTCDate() - (dow - 1) - 7);
  const previousSun = new Date(previousMon);
  previousSun.setUTCDate(previousMon.getUTCDate() + 6);
  const fmt = (x: Date) => x.toISOString().slice(0, 10);
  return { weekStart: fmt(previousMon), weekEnd: fmt(previousSun) };
}

async function generateWeeklyRecap(args: {
  weekStart: string;
  weekEnd: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  reports: any[];
  byCategory: Record<string, number>;
  byLocation: Record<string, number>;
}): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY not set");

  const reportLines = args.reports
    .slice(0, 200) // cap to avoid blowing context window
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .map((r: any, i: number) => {
      const cat = r.categories?.name ?? "—";
      const loc = r.locations?.name ?? "—";
      const who = r.profiles?.full_name ?? r.profiles?.email ?? "—";
      return `${i + 1}. [${cat} • ${loc} • ${who}] ${r.text ?? ""}`;
    })
    .join("\n");

  const catLine = Object.entries(args.byCategory)
    .sort((a, b) => b[1] - a[1])
    .map(([k, v]) => `${k}: ${v}`)
    .join(", ");
  const locLine = Object.entries(args.byLocation)
    .sort((a, b) => b[1] - a[1])
    .map(([k, v]) => `${k}: ${v}`)
    .join(", ");

  const prompt = `You are writing the weekly operational recap for Morey's Piers executives.

Week: ${args.weekStart} to ${args.weekEnd}
Total reports: ${args.reports.length}
By category: ${catLine || "none"}
By location: ${locLine || "none"}

Reports:
${reportLines || "(no reports this week)"}

Write a concise executive recap (8–12 sentences max) covering:
- Overall operational tone of the week
- Key themes, hot spots, or repeated issues
- Notable individual incidents that need executive awareness
- Any patterns by location or category
- 1–2 recommended actions if appropriate

Constraints:
- Factual and brief
- No bullet points, no lists, no headers — plain prose paragraphs only
- Don't invent details. If reports are sparse, say so briefly.
- Don't restate the stats above — they're already shown to the reader

Return only the recap text.`;

  const res = await fetch(ANTHROPIC_URL, {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 900,
      messages: [{ role: "user", content: prompt }],
    }),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Claude ${res.status}: ${t.slice(0, 300)}`);
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data = (await res.json()) as any;
  const out = data?.content?.[0]?.text;
  if (typeof out !== "string" || !out.trim()) {
    throw new Error("Claude returned an empty response");
  }
  return out.trim();
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function renderWeeklyHTML(args: {
  weekStart: string;
  weekEnd: string;
  aiSummary: string;
  byCategory: Record<string, number>;
  byLocation: Record<string, number>;
  totalReports: number;
}): string {
  const cats = Object.entries(args.byCategory)
    .sort((a, b) => b[1] - a[1])
    .map(
      ([k, v]) =>
        `<tr><td style="padding:4px 8px;">${escapeHtml(k)}</td><td style="padding:4px 8px;text-align:right;font-family:monospace;">${v}</td></tr>`,
    )
    .join("");
  const locs = Object.entries(args.byLocation)
    .sort((a, b) => b[1] - a[1])
    .map(
      ([k, v]) =>
        `<tr><td style="padding:4px 8px;">${escapeHtml(k)}</td><td style="padding:4px 8px;text-align:right;font-family:monospace;">${v}</td></tr>`,
    )
    .join("");

  return `
<!DOCTYPE html>
<html><body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color:#0F172A; max-width:680px; margin:0 auto; padding:24px;">
  <div style="border-bottom: 3px solid #E4002B; padding-bottom: 10px; margin-bottom: 18px;">
    <div style="color: #E4002B; font-weight: 800; letter-spacing: 1px; font-size: 22px;">MOREY'S PIERS</div>
    <div style="color: #475569; font-size: 12px; margin-top: 2px;">Weekly Operations Recap · ${escapeHtml(args.weekStart)} → ${escapeHtml(args.weekEnd)}</div>
  </div>

  <div style="background:#FFF6E0;border-radius:8px;padding:14px;margin-bottom:18px;">
    <div style="font-weight:600;color:#0F172A;font-size:14px;margin-bottom:6px;">Summary</div>
    <div style="white-space: pre-wrap; font-size:14px; line-height:1.55;">${escapeHtml(args.aiSummary)}</div>
  </div>

  <div style="margin-bottom: 16px;">
    <div style="font-size:13px;color:#475569;">Total reports this week:</div>
    <div style="font-size:28px;font-weight:700;color:#0F172A;">${args.totalReports}</div>
  </div>

  <div style="display:flex; gap:16px; flex-wrap: wrap;">
    <div style="flex: 1; min-width: 240px; border:1px solid #E2E8F0; border-radius:8px; padding:12px;">
      <div style="font-size:11px;text-transform:uppercase;letter-spacing:.05em;color:#475569;margin-bottom:6px;">By category</div>
      <table style="width:100%;border-collapse:collapse;font-size:13px;">${cats || '<tr><td style="padding:4px 8px;color:#94a3b8;">—</td></tr>'}</table>
    </div>
    <div style="flex: 1; min-width: 240px; border:1px solid #E2E8F0; border-radius:8px; padding:12px;">
      <div style="font-size:11px;text-transform:uppercase;letter-spacing:.05em;color:#475569;margin-bottom:6px;">By location</div>
      <table style="width:100%;border-collapse:collapse;font-size:13px;">${locs || '<tr><td style="padding:4px 8px;color:#94a3b8;">—</td></tr>'}</table>
    </div>
  </div>

  <div style="font-size:11px;color:#94a3b8;margin-top:24px;padding-top:12px;border-top:1px solid #E2E8F0;">
    Automated weekly recap. Toggle on/off in Admin → Weekly Recap.
  </div>
</body></html>
`;
}

function renderWeeklyText(args: {
  weekStart: string;
  weekEnd: string;
  aiSummary: string;
  byCategory: Record<string, number>;
  byLocation: Record<string, number>;
  totalReports: number;
}): string {
  const lines: string[] = [];
  lines.push(`MOREY'S PIERS — Weekly Operations Recap`);
  lines.push(`${args.weekStart} → ${args.weekEnd}`);
  lines.push("");
  lines.push("SUMMARY");
  lines.push(args.aiSummary);
  lines.push("");
  lines.push(`Total reports: ${args.totalReports}`);
  lines.push("");
  lines.push("By category:");
  Object.entries(args.byCategory)
    .sort((a, b) => b[1] - a[1])
    .forEach(([k, v]) => lines.push(`  ${k}: ${v}`));
  lines.push("");
  lines.push("By location:");
  Object.entries(args.byLocation)
    .sort((a, b) => b[1] - a[1])
    .forEach(([k, v]) => lines.push(`  ${k}: ${v}`));
  return lines.join("\n");
}

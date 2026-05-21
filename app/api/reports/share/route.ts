import { createServerSupabase } from "@/lib/supabase/server";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { NextResponse, type NextRequest } from "next/server";
import { Resend } from "resend";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Body = {
  report_ids?: string[];
  group_id?: string | null;
  custom_emails?: string[]; // already-validated email strings
  message?: string;
};

export async function POST(request: NextRequest) {
  const supabase = createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  // Sharers must be supervisor+
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name, email")
    .eq("id", user.id)
    .single();
  if (!profile || (profile.role !== "supervisor" && profile.role !== "manager")) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Email not configured (RESEND_API_KEY missing)." },
      { status: 503 },
    );
  }

  let body: Body = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON" }, { status: 400 });
  }

  const reportIds = Array.isArray(body.report_ids)
    ? body.report_ids.filter((s) => typeof s === "string" && s.length > 0)
    : [];
  if (reportIds.length === 0) {
    return NextResponse.json(
      { error: "At least one report required." },
      { status: 400 },
    );
  }

  // Resolve recipients
  type Rcpt = { email: string; name?: string };
  const recipients: Rcpt[] = [];

  // From group
  if (body.group_id) {
    const { data: members } = await supabase
      .from("share_group_members")
      .select("email, name")
      .eq("group_id", body.group_id)
      .eq("active", true);
    (members ?? []).forEach((m) =>
      recipients.push({ email: m.email, name: m.name ?? undefined }),
    );
  }

  // From custom emails
  if (Array.isArray(body.custom_emails)) {
    for (const raw of body.custom_emails) {
      const email = String(raw).trim().toLowerCase();
      if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        if (!recipients.find((r) => r.email === email)) {
          recipients.push({ email });
        }
      }
    }
  }

  if (recipients.length === 0) {
    return NextResponse.json(
      { error: "No recipients (group is empty or no valid emails)." },
      { status: 400 },
    );
  }

  // Fetch reports
  const { data: reports, error: reportsErr } = await supabase
    .from("reports")
    .select(
      `id, case_number, status, text, report_date, submitted_at, created_at,
       categories(name), terminals(name),
       profiles!reports_user_id_fkey(full_name, email)`,
    )
    .in("id", reportIds);

  if (reportsErr) {
    return NextResponse.json({ error: reportsErr.message }, { status: 500 });
  }
  if (!reports || reports.length === 0) {
    return NextResponse.json({ error: "Reports not found." }, { status: 404 });
  }

  // Compose email
  const sharerName = profile.full_name?.trim() || profile.email;
  const subject =
    reports.length === 1
      ? `beAcon · Report shared by ${sharerName} — ${
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (reports[0] as any).categories?.name ?? "report"
        }`
      : `beAcon · ${reports.length} reports shared by ${sharerName}`;

  const htmlBody = renderShareHTML({
    sharer: sharerName,
    message: body.message?.trim() ?? "",
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    reports: reports as any[],
  });
  const textBody = renderShareText({
    sharer: sharerName,
    message: body.message?.trim() ?? "",
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    reports: reports as any[],
  });

  // Send
  const resend = new Resend(apiKey);
  const from =
    process.env.RESEND_FROM_EMAIL ||
    "beAcon Operational Intelligence <onboarding@resend.dev>";

  const sendResult = await resend.emails.send({
    from,
    to: recipients.map((r) => r.email),
    subject,
    html: htmlBody,
    text: textBody,
    replyTo: profile.email,
  });
  if (sendResult.error) {
    return NextResponse.json(
      { error: sendResult.error.message || "Send failed." },
      { status: 502 },
    );
  }

  // Log share + audit (admin client to bypass RLS for the audit insert)
  const admin = createAdminSupabase();
  await admin.from("share_history").insert({
    shared_by: user.id,
    group_id: body.group_id ?? null,
    recipient_emails: recipients,
    report_ids: reportIds,
    message: body.message?.trim() || null,
    resend_message_id: sendResult.data?.id ?? null,
  });
  await admin.from("audit_log").insert({
    actor_id: user.id,
    action: "report.shared",
    entity_type: "report",
    entity_id: reportIds[0],
    meta: {
      report_count: reportIds.length,
      group_id: body.group_id ?? null,
      recipient_count: recipients.length,
      message_id: sendResult.data?.id ?? null,
    },
  });

  return NextResponse.json({
    ok: true,
    message_id: sendResult.data?.id,
    sent_to: recipients.map((r) => r.email),
  });
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function renderShareHTML(args: { sharer: string; message: string; reports: any[] }): string {
  const reportBlocks = args.reports
    .map((r) => {
      const cat = r.categories?.name ?? "—";
      const term = r.terminals?.name ?? "—";
      const who = r.profiles?.full_name ?? r.profiles?.email ?? "—";
      const when = r.submitted_at ?? r.created_at;
      const t = when
        ? new Date(when).toLocaleString("en-US", {
            timeZone: "America/New_York",
            month: "short",
            day: "numeric",
            hour: "numeric",
            minute: "2-digit",
          })
        : "";
      return `
        <div style="border-left: 3px solid #FFC72C; padding: 10px 14px; margin: 12px 0; background: #FAFAF7;">
          <div style="font-size: 12px; color: #475569; margin-bottom: 6px;">
            <strong style="color:#0F172A;">${escapeHtml(cat)}</strong> · ${escapeHtml(term)} · ${escapeHtml(who)} · ${escapeHtml(t)}
          </div>
          <div style="font-size: 14px; color: #0F172A; white-space: pre-wrap;">${escapeHtml(r.text ?? "")}</div>
          <div style="font-size: 10px; color: #94a3b8; font-family: monospace; margin-top: 6px;">${escapeHtml(r.case_number ?? "")}</div>
        </div>
      `;
    })
    .join("");

  return `
<!DOCTYPE html>
<html><body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color:#0F172A; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h2 style="color: #E4002B; margin: 0 0 4px 0;">MOREY'S PIERS</h2>
  <div style="color: #475569; font-size: 12px; margin-bottom: 16px;">
    Report shared by <strong>${escapeHtml(args.sharer)}</strong>
  </div>
  ${
    args.message
      ? `<div style="padding: 12px 14px; background: #FFF6E0; border-radius: 6px; border: 1px solid #FFE9A6; margin-bottom: 16px; white-space: pre-wrap;">${escapeHtml(args.message)}</div>`
      : ""
  }
  ${reportBlocks}
  <div style="font-size: 11px; color: #94a3b8; margin-top: 20px; padding-top: 12px; border-top: 1px solid #E2E8F0;">
    Sent from Morey's Daily Report tool.
  </div>
</body></html>
`;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function renderShareText(args: { sharer: string; message: string; reports: any[] }): string {
  const lines: string[] = [];
  lines.push(`MOREY'S PIERS — Report shared by ${args.sharer}`);
  lines.push("");
  if (args.message) {
    lines.push(args.message);
    lines.push("---");
    lines.push("");
  }
  args.reports.forEach((r) => {
    const cat = r.categories?.name ?? "—";
    const term = r.terminals?.name ?? "—";
    const who = r.profiles?.full_name ?? r.profiles?.email ?? "—";
    const when = r.submitted_at ?? r.created_at;
    const t = when
      ? new Date(when).toLocaleString("en-US", {
          timeZone: "America/New_York",
        })
      : "";
    lines.push(`[${cat}] ${term} · ${who} · ${t}`);
    lines.push(r.text ?? "");
    lines.push(`Case ${r.case_number ?? ""}`);
    lines.push("");
  });
  return lines.join("\n");
}

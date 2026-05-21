import { createServerSupabase } from "@/lib/supabase/server";
import { NextResponse, type NextRequest } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import React from "react";
import { Resend } from "resend";
import { DailyReportPDF } from "@/lib/pdf/DailyReport";
import { loadCuratorForUser, loadDailyReportData } from "@/lib/pdf/data";
import { fetchWildwoodWeather } from "@/lib/weather";
import { fetchDailyMetrics } from "@/lib/snowflake";
import {
  renderDailyReportEmailHTML,
  renderDailyReportEmailText,
} from "@/lib/email/dailyReport";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  request: NextRequest,
  { params }: { params: { date: string } },
) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      {
        error:
          "Email is not configured. Set RESEND_API_KEY in .env.local and restart the server.",
      },
      { status: 503 },
    );
  }

  const supabase = createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (!profile || (profile.role !== "supervisor" && profile.role !== "manager")) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  // Daily report row + included data
  const data = await loadDailyReportData(params.date);
  if (!data) {
    return NextResponse.json(
      { error: "No daily report exists for this date." },
      { status: 404 },
    );
  }

  // Stamp the curator from the user currently triggering the send so the
  // PDF / email show the right name + department, and the snapshot freezes it.
  data.curator = await loadCuratorForUser(user.id);

  const { data: dr } = await supabase
    .from("daily_reports")
    .select("id")
    .eq("report_date", params.date)
    .single();
  if (!dr) {
    return NextResponse.json(
      { error: "Daily report row not found." },
      { status: 404 },
    );
  }

  // Refresh weather + metrics snapshots at send time, but ONLY for today —
  // historical resends keep their original snapshots for accuracy.
  const todayLocal = new Date().toLocaleDateString("en-CA"); // YYYY-MM-DD
  if (params.date === todayLocal) {
    try {
      const freshWeather = await fetchWildwoodWeather(params.date);
      await supabase
        .from("daily_reports")
        .update({ weather_snapshot: freshWeather })
        .eq("id", dr.id);
      data.weather = freshWeather;
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn("send: weather refresh failed, continuing:", err);
    }
    try {
      const freshMetrics = await fetchDailyMetrics(params.date);
      await supabase
        .from("daily_reports")
        .update({ metrics_snapshot: freshMetrics })
        .eq("id", dr.id);
      data.metrics = freshMetrics;
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn("send: metrics refresh failed, continuing:", err);
    }
  }

  // Active recipients
  const { data: recipients } = await supabase
    .from("email_recipients")
    .select("name, email")
    .eq("active", true);
  if (!recipients || recipients.length === 0) {
    return NextResponse.json(
      {
        error:
          "Add at least one active recipient under Admin → Email recipients first.",
      },
      { status: 400 },
    );
  }

  // Render PDF
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const buffer: Buffer = await renderToBuffer(
    React.createElement(DailyReportPDF, { data }) as unknown as any,
  );

  // Compose email
  const resend = new Resend(apiKey);
  const from =
    process.env.RESEND_FROM_EMAIL ||
    "beAcon Operational Intelligence <onboarding@resend.dev>";
  const toList = recipients.map((r) => r.email);

  const bodyText = renderDailyReportEmailText(data);
  const bodyHtml = renderDailyReportEmailHTML(data);

  const sendResult = await resend.emails.send({
    from,
    to: toList,
    subject: `beAcon · Daily Report — Morey's Piers · ${data.date}`,
    text: bodyText,
    html: bodyHtml,
    attachments: [
      {
        filename: `morey-daily-${data.date}.pdf`,
        content: buffer,
      },
    ],
  });

  if (sendResult.error) {
    // eslint-disable-next-line no-console
    console.error("Resend send error:", sendResult.error);
    return NextResponse.json(
      { error: sendResult.error.message || "Email provider rejected the send." },
      { status: 502 },
    );
  }

  // Snapshot + mark sent + archive included reports + audit log
  const snapshot = {
    reports: data.reports,
    weather: data.weather,
    metrics: data.metrics,
    ai_summary: data.ai_summary,
    supervisor_notes: data.supervisor_notes,
    curator: data.curator ?? null,
    sent_message_id: sendResult.data?.id ?? null,
  };
  const { error: markErr } = await supabase.rpc("mark_daily_report_sent", {
    p_id: dr.id,
    p_recipients: recipients,
    p_snapshot: snapshot,
  });
  if (markErr) {
    // Email did go out, but the DB update failed — surface that clearly.
    return NextResponse.json(
      {
        warning: "Email sent but DB status could not be updated.",
        error: markErr.message,
        message_id: sendResult.data?.id,
      },
      { status: 207 },
    );
  }

  return NextResponse.json({
    ok: true,
    message_id: sendResult.data?.id,
    sent_to: toList,
  });
}

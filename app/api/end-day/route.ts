import { createServerSupabase } from "@/lib/supabase/server";
import { NextResponse, type NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * End-of-day handler.
 *
 * Inserts (or upserts) a row into `shift_recaps` for the current user
 * with their recap text and a snapshot of open-draft / pending-review
 * counts. Also sets `logout_at` on today's `daily_sessions` row so
 * supervisors can see when each person signed off.
 *
 * Body: { recap_text: string }
 *
 * Returns: { ok: true, recap_id }
 */
export async function POST(request: NextRequest) {
  const supabase = createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: { recap_text?: string } = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON" }, { status: 400 });
  }

  const recapText = (body.recap_text ?? "").trim();
  if (recapText.length === 0) {
    return NextResponse.json(
      { error: "Recap text is required." },
      { status: 400 },
    );
  }
  if (recapText.length > 4000) {
    return NextResponse.json(
      { error: "Recap is too long (max 4000 characters)." },
      { status: 400 },
    );
  }

  // Compute today in NJ time on the server (same source of truth as
  // `lib/format.ts:todayLocal`).
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const parts: Record<string, string> = {};
  for (const p of fmt.formatToParts(new Date())) {
    if (p.type !== "literal") parts[p.type] = p.value;
  }
  const today = `${parts.year}-${parts.month}-${parts.day}`;

  // Snapshot: count of the user's open drafts and submitted-pending reports
  // for today. (Status semantics: 'pending' = saved draft, 'submitted' =
  // submitted but not yet rolled into a daily report.)
  const { data: openRows } = await supabase
    .from("reports")
    .select("status")
    .eq("user_id", user.id)
    .eq("report_date", today);

  const openDrafts = (openRows ?? []).filter((r) => r.status === "pending").length;
  const pendingReview = (openRows ?? []).filter((r) => r.status === "submitted").length;

  // Find the user's terminal on today's session row (if any), to snapshot.
  const { data: session } = await supabase
    .from("daily_sessions")
    .select("id, terminal_id")
    .eq("user_id", user.id)
    .eq("session_date", today)
    .maybeSingle();

  // Upsert recap (one per user per date).
  const { data: existing } = await supabase
    .from("shift_recaps")
    .select("id")
    .eq("user_id", user.id)
    .eq("recap_date", today)
    .maybeSingle();

  let recapId: string | null = existing?.id ?? null;

  if (existing) {
    const { error: updErr } = await supabase
      .from("shift_recaps")
      .update({
        recap_text: recapText,
        terminal_id: session?.terminal_id ?? null,
        open_drafts_count: openDrafts,
        pending_review_count: pendingReview,
      })
      .eq("id", existing.id);
    if (updErr) {
      return NextResponse.json({ error: updErr.message }, { status: 500 });
    }
  } else {
    const { data: inserted, error: insErr } = await supabase
      .from("shift_recaps")
      .insert({
        user_id: user.id,
        recap_date: today,
        terminal_id: session?.terminal_id ?? null,
        recap_text: recapText,
        open_drafts_count: openDrafts,
        pending_review_count: pendingReview,
      })
      .select("id")
      .single();
    if (insErr) {
      return NextResponse.json({ error: insErr.message }, { status: 500 });
    }
    recapId = inserted?.id ?? null;
  }

  // Mark the user as logged out for today (idempotent).
  if (session?.id) {
    await supabase
      .from("daily_sessions")
      .update({ logout_at: new Date().toISOString() })
      .eq("id", session.id);
  }

  return NextResponse.json({
    ok: true,
    recap_id: recapId,
    open_drafts: openDrafts,
    pending_review: pendingReview,
  });
}

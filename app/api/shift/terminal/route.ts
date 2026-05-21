import { createServerSupabase } from "@/lib/supabase/server";
import { NextResponse, type NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Update the terminal on the current user's daily_sessions row for today.
 * Used by ChangeTerminalDialog when an associate moves seats mid-shift.
 *
 * Body: { terminal_id: string | null }
 *
 * If no daily_sessions row exists for today (rare — the SessionGate normally
 * creates it), one is created on the fly with no scheduled start/end.
 */
export async function POST(request: NextRequest) {
  const supabase = createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: { terminal_id?: string | null } = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON" }, { status: 400 });
  }

  const terminalId =
    body.terminal_id && typeof body.terminal_id === "string"
      ? body.terminal_id
      : null;

  // If a terminal_id was provided, verify it's a real active terminal
  // (avoids planting bogus uuids).
  if (terminalId) {
    const { data: term } = await supabase
      .from("terminals")
      .select("id, active")
      .eq("id", terminalId)
      .maybeSingle();
    if (!term) {
      return NextResponse.json(
        { error: "Terminal not found." },
        { status: 400 },
      );
    }
    if (!term.active) {
      return NextResponse.json(
        { error: "That terminal is inactive." },
        { status: 400 },
      );
    }
  }

  // Compute today in NJ time on the server.
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

  const { data: existing } = await supabase
    .from("daily_sessions")
    .select("id")
    .eq("user_id", user.id)
    .eq("session_date", today)
    .maybeSingle();

  if (existing?.id) {
    const { error: updErr } = await supabase
      .from("daily_sessions")
      .update({ terminal_id: terminalId })
      .eq("id", existing.id);
    if (updErr) {
      return NextResponse.json({ error: updErr.message }, { status: 500 });
    }
  } else {
    const { error: insErr } = await supabase.from("daily_sessions").insert({
      user_id: user.id,
      session_date: today,
      terminal_id: terminalId,
    });
    if (insErr) {
      return NextResponse.json({ error: insErr.message }, { status: 500 });
    }
  }

  return NextResponse.json({ ok: true, terminal_id: terminalId });
}

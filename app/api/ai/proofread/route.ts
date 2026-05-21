import { createServerSupabase } from "@/lib/supabase/server";
import { NextResponse, type NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-haiku-4-5-20251001";

export async function POST(request: NextRequest) {
  const supabase = createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY not configured" },
      { status: 503 },
    );
  }

  let body: { text?: string; kind?: string } = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON" }, { status: 400 });
  }

  const text = (body.text ?? "").trim();
  if (text.length === 0) {
    return NextResponse.json(
      { error: "Nothing to proofread." },
      { status: 400 },
    );
  }
  if (text.length > 4000) {
    return NextResponse.json(
      { error: "Text too long (4000 char max)." },
      { status: 400 },
    );
  }

  const kind = body.kind ?? "report";

  const prompt = `You are editing an internal operational report for Morey's Piers, a family amusement park.

Rewrite the user's draft so it is:
- Professional and clear (suitable for executive and legal review).
- Grammatically correct, properly spelled, punctuated.
- Concise — no fluff, no embellishment, no flourish words.
- Same facts only. Do NOT invent details, names, times, or causes the draft doesn't mention.
- Tone: factual, neutral, respectful. Never blame an individual unless the draft already does.
- Keep it about the same length — don't expand a short note into a long one.

The draft may have grammar mistakes, ESL constructions, slang, abbreviations, typos, or be very brief. Fix those without changing meaning.

If the draft is already professional and clean, return it unchanged.

Document type: ${kind}

Draft:
"""
${text}
"""

Return only the improved text. No preamble, no quotes around it, no "Here is the rewrite", no extra explanation.`;

  try {
    const res = await fetch(ANTHROPIC_URL, {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 800,
        messages: [{ role: "user", content: prompt }],
      }),
    });
    if (!res.ok) {
      const errText = await res.text();
      return NextResponse.json(
        { error: `Claude API ${res.status}: ${errText.slice(0, 300)}` },
        { status: 502 },
      );
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data = (await res.json()) as any;
    const out = data?.content?.[0]?.text;
    if (typeof out !== "string" || !out.trim()) {
      return NextResponse.json(
        { error: "Claude returned an empty response." },
        { status: 502 },
      );
    }
    return NextResponse.json({ ok: true, improved: out.trim() });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Proofread failed." },
      { status: 502 },
    );
  }
}

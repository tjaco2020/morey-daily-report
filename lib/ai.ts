// Claude-powered AI summary generator. Uses the Anthropic Messages API via
// plain fetch — no SDK dependency.
//
// Reads ANTHROPIC_API_KEY from env. Returns the generated text.

const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-haiku-4-5-20251001"; // fast + cheap, fine for summaries

export type ReportForSummary = {
  category: string;
  terminal: string;
  user: string;
  text: string;
  case_number: string;
};

export type WeatherForSummary = {
  conditions: string;
  high_f: number | null;
  low_f: number | null;
  precipitation_in: number | null;
} | null;

export async function generateDailySummary(args: {
  date: string;
  reports: ReportForSummary[];
  weather: WeatherForSummary;
}): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error(
      "ANTHROPIC_API_KEY is not set. Add it to .env.local and restart the server.",
    );
  }

  const weatherLine = args.weather
    ? `Weather: ${args.weather.conditions}, high ${args.weather.high_f}°F / low ${args.weather.low_f}°F${
        typeof args.weather.precipitation_in === "number" &&
        args.weather.precipitation_in > 0
          ? `, ${args.weather.precipitation_in}" precip`
          : ""
      }.`
    : "Weather: not available.";

  const reportLines = args.reports.length
    ? args.reports
        .map(
          (r, i) =>
            `${i + 1}. [${r.category} • ${r.terminal} • ${r.user}] ${r.text}`,
        )
        .join("\n")
    : "(No reports were included in today's daily report.)";

  const prompt = `You are summarizing the day's operational reports for Morey's Piers executives.

Date: ${args.date}
${weatherLine}
Number of reports: ${args.reports.length}

Reports:
${reportLines}

Write a concise 3–5 sentence executive summary covering:
- Overall operational tone of the day
- Notable themes, patterns, or repeated incidents
- Any urgent issues that need executive awareness

Constraints:
- Factual and brief
- No salutations, no signoffs
- No bullet points or lists — plain prose only
- Do not invent details that aren't in the reports
- If there are zero reports, write a single short sentence noting that and the weather context

Return only the summary text — nothing else.`;

  const res = await fetch(ANTHROPIC_URL, {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 600,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Claude API ${res.status}: ${errText.slice(0, 500)}`);
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data = (await res.json()) as any;
  const text = data?.content?.[0]?.text;
  if (typeof text !== "string" || !text.trim()) {
    throw new Error("Claude returned an empty response.");
  }
  return text.trim();
}

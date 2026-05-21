/**
 * beAcon Daily Report email body renderers.
 *
 * Builds an on-brand HTML body that mirrors the PDF aesthetic — navy header
 * band, curator strip, hero metric tiles (equal height), AI summary
 * pull-quote, weather card with iconography, category breakdown — plus a
 * plaintext fallback. Uses 600px-wide table-based layout with fully inline
 * styles for maximum email-client compatibility.
 */

import type { DailyReportData, CuratorInfo } from "@/lib/pdf/DailyReport";

// Brand palette — duplicated here so this module has zero React/PDF deps.
const C = {
  navy: "#0F172A",
  charcoal: "#1E293B",
  teal: "#00B3A7",
  tealDark: "#008F86",
  tealSoft: "#E0F7F5",
  gold: "#FFC72C",
  goldSoft: "#FFF4D6",
  white: "#FFFFFF",
  offwhite: "#F8FAFC",
  line: "#E2E8F0",
  lineSoft: "#EEF2F6",
  textPrimary: "#0F172A",
  textSecondary: "#475569",
  textMuted: "#94A3B8",
  sky: "#0EA5E9",
  sun: "#F59E0B",
  rain: "#3B82F6",
};

const FONT_STACK =
  "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";

const TILE_HEIGHT = 84; // px — keeps all four hero tiles identical

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function nl2br(s: string): string {
  return escapeHtml(s).replace(/\n/g, "<br>");
}

function formatLongDate(s: string): string {
  const [y, m, d] = s.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  return dt.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function formatShortDate(s: string): string {
  const [y, m, d] = s.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  return dt.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function categoryColor(name: string): string {
  switch (name) {
    case "IT": return "#3B82F6";
    case "Guest": return "#00B3A7";
    case "Safety": return "#EF4444";
    case "Operations": return "#8B5CF6";
    case "Associate": return "#F59E0B";
    case "Maintenance": return "#0EA5E9";
    case "Food & Beverage": return "#EC4899";
    case "Retail": return "#10B981";
    default: return "#64748B";
  }
}

function roleLabel(role: string): string {
  switch (role) {
    case "manager": return "Manager";
    case "supervisor": return "Supervisor";
    case "user":
    case "default": return "Associate";
    default: return role.charAt(0).toUpperCase() + role.slice(1);
  }
}

function countByCategory(
  reports: DailyReportData["reports"],
): Array<{ name: string; count: number }> {
  const map: Record<string, number> = {};
  reports.forEach((r) => {
    const k = r.category || "Other";
    map[k] = (map[k] ?? 0) + 1;
  });
  const order = [
    "IT",
    "Guest",
    "Associate",
    "Operations",
    "Safety",
    "Maintenance",
    "Food & Beverage",
    "Retail",
    "Other",
  ];
  return Object.entries(map)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => {
      const ia = order.indexOf(a.name);
      const ib = order.indexOf(b.name);
      return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
    });
}

type WeatherKind =
  | "sun"
  | "partly"
  | "cloudy"
  | "rain"
  | "storm"
  | "fog"
  | "snow";

function weatherKindFor(conditions: string | null | undefined): WeatherKind {
  const s = (conditions ?? "").toLowerCase();
  if (!s) return "sun";
  if (/thunder|storm|squall/.test(s)) return "storm";
  if (/snow|sleet|flurr|wintry/.test(s)) return "snow";
  if (/rain|shower|drizzle/.test(s)) return "rain";
  if (/fog|mist|haze/.test(s)) return "fog";
  if (/partly|mix|broken|few/.test(s) && /cloud|cloudy/.test(s)) return "partly";
  if (/overcast|mostly cloudy|cloud/.test(s)) return "cloudy";
  return "sun";
}

function weatherIconSvg(kind: WeatherKind, size = 38): string {
  // Inline SVG — keep it compact, valid email-safe markup
  switch (kind) {
    case "sun": {
      const rays = [0, 45, 90, 135, 180, 225, 270, 315].map((deg) => {
        const rad = (deg * Math.PI) / 180;
        const x1 = (12 + Math.cos(rad) * 7).toFixed(2);
        const y1 = (12 + Math.sin(rad) * 7).toFixed(2);
        const x2 = (12 + Math.cos(rad) * 9.5).toFixed(2);
        const y2 = (12 + Math.sin(rad) * 9.5).toFixed(2);
        return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${C.sun}" stroke-width="1.6" stroke-linecap="round"/>`;
      }).join("");
      return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" style="display:block;">
        <circle cx="12" cy="12" r="4.4" fill="${C.sun}"/>${rays}
      </svg>`;
    }
    case "partly": {
      const rays = [0, 90, 180, 270, 45, 135, 225, 315].map((deg) => {
        const rad = (deg * Math.PI) / 180;
        const x1 = (9 + Math.cos(rad) * 4.6).toFixed(2);
        const y1 = (9 + Math.sin(rad) * 4.6).toFixed(2);
        const x2 = (9 + Math.cos(rad) * 6.4).toFixed(2);
        const y2 = (9 + Math.sin(rad) * 6.4).toFixed(2);
        return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${C.sun}" stroke-width="1.3" stroke-linecap="round"/>`;
      }).join("");
      return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" style="display:block;">
        <circle cx="9" cy="9" r="3.4" fill="${C.sun}"/>${rays}
        <path fill="${C.textSecondary}" d="M9 17 q-3 0 -3 -2.4 q0 -2 1.8 -2.5 q0.3 -2.3 2.7 -2.3 q2.1 0 2.7 1.7 q0.6 -0.4 1.4 -0.4 q1.7 0 2.1 1.6 q1.8 0.2 1.8 2 q0 2.3 -2.9 2.3 z"/>
      </svg>`;
    }
    case "cloudy":
      return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" style="display:block;">
        <path fill="${C.textSecondary}" d="M7.5 18 q-3.5 0 -3.5 -3 q0 -2.4 2.2 -3 q0.4 -2.8 3.2 -2.8 q2.5 0 3.2 2 q0.7 -0.5 1.6 -0.5 q2 0 2.4 1.9 q2.2 0.3 2.2 2.4 q0 2.9 -3.4 2.9 z"/>
      </svg>`;
    case "rain":
      return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" style="display:block;">
        <path fill="${C.textSecondary}" d="M7.5 14 q-3.5 0 -3.5 -3 q0 -2.4 2.2 -3 q0.4 -2.8 3.2 -2.8 q2.5 0 3.2 2 q0.7 -0.5 1.6 -0.5 q2 0 2.4 1.9 q2.2 0.3 2.2 2.4 q0 2.9 -3.4 2.9 z"/>
        <line x1="8.5" y1="16" x2="7.5" y2="19" stroke="${C.rain}" stroke-width="1.8" stroke-linecap="round"/>
        <line x1="12" y1="16" x2="11" y2="20" stroke="${C.rain}" stroke-width="1.8" stroke-linecap="round"/>
        <line x1="15.5" y1="16" x2="14.5" y2="19" stroke="${C.rain}" stroke-width="1.8" stroke-linecap="round"/>
      </svg>`;
    case "storm":
      return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" style="display:block;">
        <path fill="${C.textSecondary}" d="M7.5 14 q-3.5 0 -3.5 -3 q0 -2.4 2.2 -3 q0.4 -2.8 3.2 -2.8 q2.5 0 3.2 2 q0.7 -0.5 1.6 -0.5 q2 0 2.4 1.9 q2.2 0.3 2.2 2.4 q0 2.9 -3.4 2.9 z"/>
        <path fill="${C.gold}" d="M12 14 L9.5 18 L11.5 18 L10 22 L14 17 L12 17 L13.5 14 Z"/>
      </svg>`;
    case "fog":
      return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" style="display:block;">
        <line x1="3" y1="8" x2="21" y2="8" stroke="${C.textSecondary}" stroke-width="1.6" stroke-linecap="round" stroke-dasharray="12 4"/>
        <line x1="3" y1="12" x2="21" y2="12" stroke="${C.textSecondary}" stroke-width="1.6" stroke-linecap="round" stroke-dasharray="8 5 14 3"/>
        <line x1="3" y1="16" x2="21" y2="16" stroke="${C.textSecondary}" stroke-width="1.6" stroke-linecap="round" stroke-dasharray="12 4"/>
        <line x1="3" y1="20" x2="21" y2="20" stroke="${C.textSecondary}" stroke-width="1.6" stroke-linecap="round" stroke-dasharray="8 5 14 3"/>
      </svg>`;
    case "snow":
      return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" style="display:block;">
        <path fill="${C.textSecondary}" d="M7.5 14 q-3.5 0 -3.5 -3 q0 -2.4 2.2 -3 q0.4 -2.8 3.2 -2.8 q2.5 0 3.2 2 q0.7 -0.5 1.6 -0.5 q2 0 2.4 1.9 q2.2 0.3 2.2 2.4 q0 2.9 -3.4 2.9 z"/>
        <circle cx="8" cy="17" r="1.2" fill="${C.sky}"/>
        <circle cx="12" cy="19" r="1.2" fill="${C.sky}"/>
        <circle cx="16" cy="17" r="1.2" fill="${C.sky}"/>
      </svg>`;
  }
}

function thermometerSvg(size = 14): string {
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" style="display:inline-block;vertical-align:middle;">
    <path fill="${C.textSecondary}" d="M12 3 a3 3 0 0 0 -3 3 v9 a4 4 0 1 0 6 0 V6 a3 3 0 0 0 -3 -3 z M12 5 a1 1 0 0 1 1 1 v9.3 a2 2 0 1 1 -2 0 V6 a1 1 0 0 1 1 -1 z"/>
    <circle cx="12" cy="17.5" r="2" fill="#EF4444"/>
  </svg>`;
}

function dropletSvg(size = 14): string {
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" style="display:inline-block;vertical-align:middle;">
    <path fill="${C.rain}" d="M12 3 C 7 11 6 14 6 16 a6 6 0 0 0 12 0 c0 -2 -1 -5 -6 -13 z"/>
  </svg>`;
}

function windSvg(size = 14): string {
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" style="display:inline-block;vertical-align:middle;">
    <path fill="none" stroke="${C.textSecondary}" stroke-width="2" stroke-linecap="round" d="M3 9 h12 a3 3 0 1 0 -3 -3"/>
    <path fill="none" stroke="${C.textSecondary}" stroke-width="2" stroke-linecap="round" d="M3 14 h15 a3 3 0 1 1 -3 3"/>
    <path fill="none" stroke="${C.textSecondary}" stroke-width="2" stroke-linecap="round" d="M3 19 h7"/>
  </svg>`;
}

function brandMarkSvg(opts: {
  height: number;
  bodyColor: string;
  beamColor?: string;
  accentColor?: string;
}): string {
  const beam = opts.beamColor ?? C.teal;
  const accent = opts.accentColor ?? C.gold;
  return `<svg height="${opts.height}" viewBox="0 0 64 80" xmlns="http://www.w3.org/2000/svg" style="display:block;vertical-align:middle;">
    <path fill-rule="evenodd" fill="${opts.bodyColor}" d="M32 14 L62 76 L2 76 Z M32 32 L40 52 L24 52 Z M27 60 L37 60 L37 76 L27 76 Z"/>
    <path d="M32 0 L46 11 L18 11 Z" fill="${beam}"/>
    <path d="M32 3 L39 10 L25 10 Z" fill="${accent}"/>
  </svg>`;
}

// ── Public API ─────────────────────────────────────────────────────

export type DailyReportEmailOptions = {
  appOrigin?: string;
  fallback?: boolean;
};

export function renderDailyReportEmailText(
  data: DailyReportData,
  opts: DailyReportEmailOptions = {},
): string {
  const lines: string[] = [];
  lines.push(`beAcon · Daily Operations Report`);
  lines.push(`Morey's Piers — ${formatLongDate(data.date)}`);
  if (data.curator) {
    const dept = data.curator.department ? ` · ${data.curator.department}` : "";
    lines.push(`Curated by ${data.curator.name}${dept} (${roleLabel(data.curator.role)})`);
  }
  lines.push("");

  if (opts.fallback) {
    lines.push(
      `(Auto-generated overnight fallback — no manual Daily Report was sent for this date by 1:30 AM.)`,
    );
    lines.push("");
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const m = data.metrics as any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const w = data.weather as any;
  const tx = typeof m?.total_transactions === "number"
    ? m.total_transactions.toLocaleString() : "—";
  const tk = typeof m?.total_tickets === "number"
    ? m.total_tickets.toLocaleString() : "—";
  const hi = typeof w?.high_f === "number" ? `${Math.round(w.high_f)}°F` : "—";
  const lo = typeof w?.low_f === "number" ? `${Math.round(w.low_f)}°F` : "—";
  const cond = typeof w?.conditions === "string" ? w.conditions : "—";

  lines.push(`AT A GLANCE`);
  lines.push(`  Transactions: ${tx}`);
  lines.push(`  Tickets: ${tk}`);
  lines.push(`  Weather: ${cond} (High ${hi} / Low ${lo})`);
  lines.push(`  Reports: ${data.reports.length}`);
  lines.push("");

  if (data.ai_summary && data.ai_summary.trim().length > 0) {
    lines.push(`SUMMARY`);
    lines.push(data.ai_summary.trim());
    lines.push("");
  }

  if (data.supervisor_notes && data.supervisor_notes.trim().length > 0) {
    lines.push(`SUPERVISOR NOTES`);
    lines.push(data.supervisor_notes.trim());
    lines.push("");
  }

  const counts = countByCategory(data.reports);
  if (counts.length > 0) {
    lines.push(`REPORTS BY CATEGORY`);
    counts.forEach((c) => lines.push(`  ${c.name}: ${c.count}`));
    lines.push("");
  }

  lines.push(`(Full report attached as PDF.)`);
  return lines.join("\n");
}

function renderCuratorStrip(curator: CuratorInfo | null | undefined, isFallback: boolean): string {
  if (!curator) {
    return `<tr><td style="background:${C.offwhite};border-bottom:1px solid ${C.line};padding:9px 24px;font:400 11px/1.3 ${FONT_STACK};color:${C.textSecondary};">
      <span style="font:700 8px/1 ${FONT_STACK};letter-spacing:1.3px;color:${C.textMuted};margin-right:6px;">SOURCE</span>
      <span style="font:700 11px/1 ${FONT_STACK};color:${C.navy};vertical-align:middle;">${isFallback ? "beAcon overnight automation" : "Daily Report"}</span>
    </td></tr>`;
  }
  const dept = curator.department
    ? `<span style="font:400 11px/1 ${FONT_STACK};color:${C.tealDark};vertical-align:middle;margin-left:6px;">· ${escapeHtml(curator.department)}</span>`
    : "";
  return `<tr><td style="background:${C.offwhite};border-bottom:1px solid ${C.line};padding:9px 24px;">
    <span style="font:700 8px/1 ${FONT_STACK};letter-spacing:1.3px;color:${C.textMuted};margin-right:6px;vertical-align:middle;">CURATED BY</span>
    <span style="font:700 11px/1 ${FONT_STACK};color:${C.navy};vertical-align:middle;">${escapeHtml(curator.name)}</span>
    ${dept}
    <span style="font:400 9px/1 ${FONT_STACK};color:${C.textSecondary};vertical-align:middle;margin-left:6px;letter-spacing:0.8px;text-transform:uppercase;">· ${escapeHtml(roleLabel(curator.role))}</span>
  </td></tr>`;
}

function renderHeroTile(opts: {
  label: string;
  value: string;
  sub: string;
  accent?: boolean;
  iconSvg?: string;
}): string {
  const accent = !!opts.accent;
  return `<td valign="top" style="padding:0 4px;width:25%;">
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" height="${TILE_HEIGHT}" style="border-collapse:collapse;background:${accent ? C.tealSoft : C.white};border:1px solid ${accent ? C.tealSoft : C.line};border-radius:6px;height:${TILE_HEIGHT}px;">
      <tr><td valign="top" style="padding:10px 12px;height:${TILE_HEIGHT}px;">
        <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;">
          <tr>
            <td valign="top">
              <div style="font:600 9px/1 ${FONT_STACK};letter-spacing:1.4px;color:${accent ? C.tealDark : C.textSecondary};margin-bottom:5px;">
                ${escapeHtml(opts.label)}
              </div>
              <div style="font:700 22px/1 ${FONT_STACK};color:${accent ? C.tealDark : C.navy};">
                ${opts.value}
              </div>
            </td>
            ${opts.iconSvg ? `<td valign="top" align="right" style="width:30px;">${opts.iconSvg}</td>` : ""}
          </tr>
        </table>
        <div style="font:400 11px/1.3 ${FONT_STACK};color:${accent ? C.tealDark : C.textSecondary};margin-top:6px;">
          ${escapeHtml(opts.sub)}
        </div>
      </td></tr>
    </table>
  </td>`;
}

export function renderDailyReportEmailHTML(
  data: DailyReportData,
  opts: DailyReportEmailOptions = {},
): string {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const m = data.metrics as any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const w = data.weather as any;
  const tx = typeof m?.total_transactions === "number"
    ? m.total_transactions.toLocaleString() : "—";
  const tk = typeof m?.total_tickets === "number"
    ? m.total_tickets.toLocaleString() : "—";
  const hi = typeof w?.high_f === "number" ? `${Math.round(w.high_f)}°` : null;
  const lo = typeof w?.low_f === "number" ? `${Math.round(w.low_f)}°` : null;
  const cond = typeof w?.conditions === "string" ? w.conditions : null;
  const condShort = cond && cond.length > 22 ? cond.slice(0, 22).trim() + "…" : cond;
  const kind = weatherKindFor(cond);

  const isSent = data.status === "sent";
  const isFallback = !!opts.fallback;
  const counts = countByCategory(data.reports);

  const previewText =
    (data.ai_summary && data.ai_summary.trim().slice(0, 140)) ||
    `${data.reports.length} field report${data.reports.length === 1 ? "" : "s"} · ${tx} transactions · ${tk} tickets`;

  // Hero tiles
  const tiles = [
    renderHeroTile({
      label: "TRANSACTIONS",
      value: tx,
      sub: tx === "—" ? "Awaiting Snowflake" : "Across all outlets",
    }),
    renderHeroTile({
      label: "TICKETS",
      value: tk,
      sub: tk === "—" ? "Awaiting Snowflake" : "Park admissions",
    }),
    renderHeroTile({
      label: "WEATHER",
      value: hi
        ? `${hi}${lo ? ` <span style=\"color:${C.textSecondary};font-size:14px;\">/ ${lo}</span>` : ""}`
        : "—",
      sub: condShort ?? "Awaiting forecast",
      iconSvg: weatherIconSvg(kind, 26),
    }),
    renderHeroTile({
      label: "REPORTS",
      value: String(data.reports.length),
      sub: data.reports.length === 1 ? "Field report" : "Field reports",
      accent: true,
    }),
  ].join("");

  // AI summary block
  const summaryBlock = data.ai_summary && data.ai_summary.trim().length > 0
    ? `<tr><td style="padding:0 24px;">
        <div style="font:600 10px/1 ${FONT_STACK};letter-spacing:1.4px;color:${C.textSecondary};margin:18px 0 8px;">
          OPERATIONAL SUMMARY
        </div>
        <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;background:${C.offwhite};border-left:3px solid ${C.teal};border-radius:4px;">
          <tr><td style="padding:14px 16px 14px 14px;">
            <span style="font:700 28px/1 Georgia,'Times New Roman',serif;color:${C.teal};vertical-align:top;margin-right:6px;">&ldquo;</span>
            <span style="font:400 14px/1.55 ${FONT_STACK};color:${C.navy};">
              ${nl2br(data.ai_summary.trim())}
            </span>
          </td></tr>
        </table>
      </td></tr>`
    : "";

  // Supervisor notes
  const notesBlock = data.supervisor_notes && data.supervisor_notes.trim().length > 0
    ? `<tr><td style="padding:0 24px;">
        <div style="font:600 10px/1 ${FONT_STACK};letter-spacing:1.4px;color:${C.textSecondary};margin:14px 0 8px;">
          SUPERVISOR NOTES
        </div>
        <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;background:${C.goldSoft};border-left:3px solid ${C.gold};border-radius:4px;">
          <tr><td style="padding:12px 14px;font:400 13px/1.5 ${FONT_STACK};color:${C.navy};">
            ${nl2br(data.supervisor_notes.trim())}
          </td></tr>
        </table>
      </td></tr>`
    : "";

  // Weather card with icon hero + iconified detail rows
  const weatherRows: Array<{ icon: string; label: string; value: string }> = [];
  if (hi || lo) {
    weatherRows.push({
      icon: thermometerSvg(12),
      label: "High / Low",
      value: `${hi ?? "—"} / ${lo ?? "—"}`,
    });
  }
  if (typeof w?.precipitation_in === "number") {
    weatherRows.push({
      icon: dropletSvg(12),
      label: "Precipitation",
      value: w.precipitation_in > 0 ? `${w.precipitation_in.toFixed(2)}"` : "None",
    });
  }
  if (typeof w?.wind_max_mph === "number") {
    weatherRows.push({
      icon: windSvg(12),
      label: "Max wind",
      value: `${Math.round(w.wind_max_mph)} mph`,
    });
  }

  const weatherCard = (hi || lo || cond || weatherRows.length > 0)
    ? `<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;border:1px solid ${C.line};border-radius:6px;">
        <tr><td style="padding:12px 14px;">
          <div style="font:700 9px/1 ${FONT_STACK};letter-spacing:1.3px;color:${C.textSecondary};margin-bottom:10px;">
            WEATHER · WILDWOOD, NJ
          </div>
          <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;border-bottom:1px solid ${C.lineSoft};padding-bottom:10px;margin-bottom:6px;">
            <tr>
              <td valign="middle" style="width:48px;padding-right:10px;">${weatherIconSvg(kind, 42)}</td>
              <td valign="middle">
                <div style="font:700 22px/1 ${FONT_STACK};color:${C.navy};">
                  ${hi ?? "—"} <span style="font:400 12px/1 ${FONT_STACK};color:${C.textSecondary};">/ ${lo ?? "—"}</span>
                </div>
                ${cond ? `<div style="font:400 11px/1.3 ${FONT_STACK};color:${C.textSecondary};margin-top:4px;">${escapeHtml(cond)}</div>` : ""}
              </td>
            </tr>
          </table>
          <div style="height:8px;line-height:8px;font-size:0;">&nbsp;</div>
          ${weatherRows.map((r) => `
            <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;">
              <tr>
                <td valign="middle" style="width:16px;padding-right:6px;">${r.icon}</td>
                <td valign="middle" style="font:400 12px/1.4 ${FONT_STACK};color:${C.textSecondary};">${escapeHtml(r.label)}</td>
                <td valign="middle" align="right" style="font:600 12px/1.4 ${FONT_STACK};color:${C.navy};">${escapeHtml(r.value)}</td>
              </tr>
            </table>
          `).join("")}
        </td></tr>
      </table>`
    : `<div style="border:1px dashed ${C.line};border-radius:6px;padding:14px;color:${C.textSecondary};font:400 12px ${FONT_STACK};text-align:center;">
        Weather not yet fetched.
      </div>`;

  // Category card
  const categoryCard = counts.length > 0
    ? `<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;border:1px solid ${C.line};border-radius:6px;">
        <tr><td style="padding:12px 14px;">
          <div style="font:700 9px/1 ${FONT_STACK};letter-spacing:1.3px;color:${C.textSecondary};margin-bottom:10px;">
            REPORTS BY CATEGORY
          </div>
          ${counts.map((c) => `
            <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;">
              <tr>
                <td valign="middle" style="width:16px;padding-right:6px;">
                  <span style="display:inline-block;width:8px;height:8px;background:${categoryColor(c.name)};border-radius:2px;vertical-align:middle;"></span>
                </td>
                <td valign="middle" style="font:400 12px/1.6 ${FONT_STACK};color:${C.navy};">${escapeHtml(c.name)}</td>
                <td valign="middle" align="right" style="font:600 12px/1.6 ${FONT_STACK};color:${C.navy};">${c.count}</td>
              </tr>
            </table>
          `).join("")}
        </td></tr>
      </table>`
    : `<div style="border:1px dashed ${C.line};border-radius:6px;padding:14px;color:${C.textSecondary};font:400 12px ${FONT_STACK};text-align:center;">
        No reports included.
      </div>`;

  return `<!DOCTYPE html>
<html lang="en"><head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>beAcon Daily Report — ${escapeHtml(formatShortDate(data.date))}</title>
</head>
<body style="margin:0;padding:0;background:#F1F5F9;font-family:${FONT_STACK};color:${C.textPrimary};-webkit-font-smoothing:antialiased;">

  <div style="display:none;font-size:1px;color:#F1F5F9;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">
    ${escapeHtml(previewText)}
  </div>

  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;background:#F1F5F9;">
    <tr><td align="center" style="padding:24px 12px;">

      <table role="presentation" cellpadding="0" cellspacing="0" width="600" style="border-collapse:collapse;background:${C.white};border-radius:10px;overflow:hidden;box-shadow:0 1px 3px rgba(15,23,42,0.08);max-width:600px;">

        <!-- Header band -->
        <tr><td style="background:${C.navy};padding:20px 24px;">
          <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;">
            <tr>
              <td valign="middle" style="width:32px;padding-right:10px;">
                ${brandMarkSvg({ height: 28, bodyColor: C.white })}
              </td>
              <td valign="middle">
                <div style="font:700 22px/1 ${FONT_STACK};color:${C.white};letter-spacing:0.2px;">
                  be<span style="color:${C.teal};">A</span>con
                </div>
                <div style="font:700 8.5px/1.3 ${FONT_STACK};color:#94A3B8;letter-spacing:1.4px;margin-top:4px;">
                  DAILY OPERATIONS · MOREY&rsquo;S PIERS
                </div>
              </td>
              <td valign="middle" align="right">
                <div style="font:700 13px/1 ${FONT_STACK};color:${C.white};">
                  ${escapeHtml(formatShortDate(data.date))}
                </div>
                <div style="font:400 11px/1.3 ${FONT_STACK};color:#94A3B8;margin-top:3px;">
                  ${escapeHtml(formatLongDate(data.date))}
                </div>
                <div style="margin-top:6px;">
                  <span style="display:inline-block;background:${isSent ? C.teal : C.gold};color:${isSent ? C.white : C.navy};font:700 8px/1 ${FONT_STACK};letter-spacing:1.2px;padding:3px 8px;border-radius:10px;">
                    ${isSent ? (isFallback ? "AUTO" : "OFFICIAL") : "DRAFT"}
                  </span>
                </div>
              </td>
            </tr>
          </table>
        </td></tr>

        <!-- Teal accent strip -->
        <tr><td style="height:3px;background:${C.teal};line-height:3px;font-size:0;">&nbsp;</td></tr>

        <!-- Curator strip -->
        ${renderCuratorStrip(data.curator, isFallback)}

        ${isFallback ? `
        <tr><td style="padding:14px 24px 0;">
          <div style="background:${C.goldSoft};border-left:3px solid ${C.gold};border-radius:4px;padding:10px 12px;font:400 12px/1.5 ${FONT_STACK};color:${C.navy};">
            <strong>Auto-generated:</strong> no manual Daily Report was sent by 1:30 AM, so beAcon produced this overnight summary from available weather and transaction data.
          </div>
        </td></tr>
        ` : ""}

        <!-- Hero tiles (equal height via fixed-height table cells) -->
        <tr><td style="padding:18px 20px 0;">
          <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;">
            <tr>${tiles}</tr>
          </table>
        </td></tr>

        ${summaryBlock}
        ${notesBlock}

        <!-- Day at a glance -->
        <tr><td style="padding:0 24px;">
          <div style="font:600 10px/1 ${FONT_STACK};letter-spacing:1.4px;color:${C.textSecondary};margin:18px 0 8px;">
            DAY AT A GLANCE
          </div>
          <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;">
            <tr>
              <td valign="top" style="width:50%;padding-right:5px;">${weatherCard}</td>
              <td valign="top" style="width:50%;padding-left:5px;">${categoryCard}</td>
            </tr>
          </table>
        </td></tr>

        <!-- Attachment CTA -->
        <tr><td style="padding:18px 24px 4px;">
          <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;background:${C.offwhite};border:1px solid ${C.line};border-radius:6px;">
            <tr><td style="padding:14px 16px;font:400 13px/1.5 ${FONT_STACK};color:${C.navy};">
              <strong style="color:${C.navy};">Full report attached as PDF</strong><br>
              <span style="color:${C.textSecondary};">${data.reports.length} field report${data.reports.length === 1 ? "" : "s"} grouped by category, weather, transaction and ticket breakdowns.</span>
            </td></tr>
          </table>
        </td></tr>

        <!-- Footer -->
        <tr><td style="padding:18px 24px 22px;border-top:1px solid ${C.line};">
          <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;">
            <tr>
              <td valign="middle">
                <table role="presentation" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
                  <tr>
                    <td valign="middle" style="padding-right:6px;">
                      ${brandMarkSvg({ height: 14, bodyColor: C.navy })}
                    </td>
                    <td valign="middle">
                      <span style="font:700 11px/1 ${FONT_STACK};color:${C.navy};">
                        be<span style="color:${C.teal};">A</span>con
                      </span>
                    </td>
                    <td valign="middle" style="padding-left:6px;">
                      <span style="font:400 10px/1 ${FONT_STACK};color:${C.textMuted};">
                        · Operational intelligence for Morey&rsquo;s Piers
                      </span>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </td></tr>

      </table>

      <div style="font:400 11px/1.4 ${FONT_STACK};color:${C.textMuted};margin-top:14px;max-width:600px;">
        You&rsquo;re receiving this Daily Report because you&rsquo;re on the beAcon recipients list. To unsubscribe, ask a manager to remove your address under Admin → Email recipients.
      </div>

    </td></tr>
  </table>
</body></html>`;
}

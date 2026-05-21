/* eslint-disable jsx-a11y/alt-text */
/**
 * beAcon Daily Operations Report — premium dashboard-brief layout.
 *
 * Design intent: feel like a Ramp / Linear / Stripe daily digest, not a
 * memo. Premium navy header band with brand mark + curator strip,
 * hero metric tiles up top (equal height), AI summary pull-quote,
 * weather card with iconography, ticket category bars, color-banded
 * report sections grouped by category.
 *
 * Everything renders server-side via @react-pdf/renderer.
 */
import React from "react";
import {
  Document,
  Page,
  View,
  Text,
  Svg,
  Path,
  Circle,
  Line,
  StyleSheet,
} from "@react-pdf/renderer";

export type IncludedReport = {
  case_number: string;
  category: string;
  terminal: string;
  user: string;
  submitted_at: string | null;
  text: string;
};

export type CuratorInfo = {
  name: string;
  role: string;
  department: string | null;
};

export type DailyReportData = {
  date: string; // YYYY-MM-DD
  status: string; // 'draft' | 'sent'
  weather: unknown | null;
  metrics: unknown | null;
  ai_summary: string | null;
  supervisor_notes: string | null;
  reports: IncludedReport[];
  curator?: CuratorInfo | null;
};

// beAcon brand palette
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
  // Weather icon palette
  sky: "#0EA5E9",
  sun: "#F59E0B",
  rain: "#3B82F6",
  // Category bar colors
  catIT: "#3B82F6",
  catGuest: "#00B3A7",
  catSafety: "#EF4444",
  catOps: "#8B5CF6",
  catAssociate: "#F59E0B",
  catMaintenance: "#0EA5E9",
  catFB: "#EC4899",
  catRetail: "#10B981",
  catOther: "#64748B",
};

const TILE_MIN_HEIGHT = 72;

const styles = StyleSheet.create({
  page: {
    paddingTop: 0,
    paddingBottom: 36,
    paddingHorizontal: 0,
    fontFamily: "Helvetica",
    fontSize: 10,
    color: C.textPrimary,
    lineHeight: 1.45,
    backgroundColor: C.white,
  },
  // ── Header band ────────────────────────────────────────────────
  headerBand: {
    backgroundColor: C.navy,
    paddingHorizontal: 32,
    paddingTop: 20,
    paddingBottom: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  brandText: {
    fontSize: 22,
    fontFamily: "Helvetica-Bold",
    color: C.white,
    letterSpacing: 0.2,
  },
  subTitle: {
    fontSize: 8.5,
    color: "#94A3B8",
    marginTop: 3,
    letterSpacing: 1.4,
    fontFamily: "Helvetica-Bold",
  },
  headerRight: {
    alignItems: "flex-end",
  },
  dateMain: {
    fontFamily: "Helvetica-Bold",
    fontSize: 13,
    color: C.white,
  },
  dateSub: {
    fontSize: 9,
    color: "#94A3B8",
    marginTop: 2,
  },
  statusPillSent: {
    marginTop: 6,
    backgroundColor: C.teal,
    color: C.white,
    fontSize: 7.5,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 1.2,
    paddingVertical: 2,
    paddingHorizontal: 7,
    borderRadius: 10,
  },
  statusPillDraft: {
    marginTop: 6,
    backgroundColor: C.gold,
    color: C.navy,
    fontSize: 7.5,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 1.2,
    paddingVertical: 2,
    paddingHorizontal: 7,
    borderRadius: 10,
  },
  // Teal accent bar under the header band
  accentBar: {
    height: 3,
    backgroundColor: C.teal,
  },
  // ── Curator strip ─────────────────────────────────────────────
  curatorStrip: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: C.offwhite,
    borderBottomWidth: 1,
    borderBottomColor: C.line,
    paddingHorizontal: 32,
    paddingVertical: 8,
  },
  curatorLabel: {
    fontSize: 8,
    letterSpacing: 1.3,
    fontFamily: "Helvetica-Bold",
    color: C.textMuted,
    marginRight: 6,
  },
  curatorName: {
    fontSize: 9.5,
    fontFamily: "Helvetica-Bold",
    color: C.navy,
  },
  curatorDept: {
    fontSize: 9.5,
    color: C.tealDark,
    marginLeft: 6,
  },
  curatorRole: {
    fontSize: 8,
    color: C.textSecondary,
    marginLeft: 6,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  // ── Body ───────────────────────────────────────────────────────
  body: {
    paddingHorizontal: 32,
    paddingTop: 18,
  },
  // ── Hero metric tiles (equal height) ──────────────────────────
  heroRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 14,
  },
  tile: {
    flex: 1,
    flexBasis: 0,
    minHeight: TILE_MIN_HEIGHT,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: C.line,
    padding: 10,
    backgroundColor: C.white,
    justifyContent: "space-between",
  },
  tileTeal: {
    borderColor: C.tealSoft,
    backgroundColor: C.tealSoft,
  },
  tileTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  tileLabel: {
    fontSize: 7.5,
    letterSpacing: 1.2,
    fontFamily: "Helvetica-Bold",
    color: C.textSecondary,
    marginBottom: 4,
  },
  tileValue: {
    fontSize: 20,
    fontFamily: "Helvetica-Bold",
    color: C.navy,
  },
  tileValueTeal: {
    fontSize: 20,
    fontFamily: "Helvetica-Bold",
    color: C.tealDark,
  },
  tileSub: {
    fontSize: 8.5,
    color: C.textSecondary,
    marginTop: 4,
  },
  // ── Section titles ─────────────────────────────────────────────
  sectionTitle: {
    fontFamily: "Helvetica-Bold",
    fontSize: 9,
    letterSpacing: 1.4,
    color: C.textSecondary,
    marginBottom: 6,
  },
  // ── AI summary pull-quote ─────────────────────────────────────
  summaryBox: {
    flexDirection: "row",
    backgroundColor: C.offwhite,
    borderLeftWidth: 3,
    borderLeftColor: C.teal,
    borderRadius: 4,
    padding: 12,
    marginBottom: 14,
  },
  summaryQuoteMark: {
    fontSize: 28,
    fontFamily: "Helvetica-Bold",
    color: C.teal,
    marginRight: 8,
    marginTop: -4,
    lineHeight: 1,
  },
  summaryText: {
    flex: 1,
    fontSize: 11,
    lineHeight: 1.55,
    color: C.navy,
  },
  // ── Two-column grid: weather + categories ────────────────────
  grid: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 14,
  },
  gridCol: { flex: 1 },
  card: {
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: 6,
    padding: 12,
    minHeight: 130,
  },
  cardTitle: {
    fontSize: 8,
    letterSpacing: 1.3,
    fontFamily: "Helvetica-Bold",
    color: C.textSecondary,
    marginBottom: 8,
  },
  // ── Weather icon header ───────────────────────────────────────
  weatherHero: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: C.lineSoft,
  },
  weatherHeroText: {
    marginLeft: 12,
    flex: 1,
  },
  weatherHeroTemp: {
    fontSize: 22,
    fontFamily: "Helvetica-Bold",
    color: C.navy,
    lineHeight: 1,
  },
  weatherHeroCond: {
    fontSize: 9.5,
    color: C.textSecondary,
    marginTop: 3,
  },
  weatherDetailRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 3,
  },
  weatherDetailKey: {
    fontSize: 9.5,
    color: C.textSecondary,
    flex: 1,
    marginLeft: 6,
  },
  weatherDetailVal: {
    fontSize: 9.5,
    color: C.navy,
    fontFamily: "Helvetica-Bold",
  },
  // ── Category bar row ──────────────────────────────────────────
  catBarRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 3,
  },
  catBarTrack: {
    flex: 1,
    height: 6,
    backgroundColor: C.lineSoft,
    borderRadius: 3,
    marginHorizontal: 6,
    overflow: "hidden",
  },
  catBarFill: {
    height: 6,
    borderRadius: 3,
  },
  catBarLabel: {
    fontSize: 8.5,
    color: C.textPrimary,
    width: 78,
  },
  catBarCount: {
    fontSize: 8.5,
    color: C.navy,
    fontFamily: "Helvetica-Bold",
    width: 26,
    textAlign: "right",
  },
  // ── Supervisor notes ──────────────────────────────────────────
  notesBox: {
    backgroundColor: C.goldSoft,
    borderRadius: 4,
    padding: 10,
    marginBottom: 14,
    borderLeftWidth: 3,
    borderLeftColor: C.gold,
  },
  notesText: {
    fontSize: 10,
    color: C.navy,
    lineHeight: 1.5,
  },
  // ── Reports section ───────────────────────────────────────────
  reportsHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 4,
    marginBottom: 10,
  },
  reportsHeaderText: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: C.navy,
  },
  reportsCountChip: {
    backgroundColor: C.navy,
    color: C.white,
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    paddingVertical: 2,
    paddingHorizontal: 7,
    borderRadius: 8,
  },
  catSectionWrap: {
    marginBottom: 8,
  },
  catSectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.offwhite,
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderRadius: 4,
    marginBottom: 4,
  },
  catSectionStripe: {
    width: 3,
    height: 12,
    borderRadius: 1.5,
    marginRight: 7,
  },
  catSectionName: {
    fontFamily: "Helvetica-Bold",
    fontSize: 10,
    color: C.navy,
    flex: 1,
  },
  catSectionCount: {
    fontSize: 8.5,
    color: C.textSecondary,
    fontFamily: "Helvetica-Bold",
  },
  reportRow: {
    paddingVertical: 6,
    paddingLeft: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: C.lineSoft,
  },
  reportMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 2,
  },
  reportTime: {
    fontSize: 8.5,
    fontFamily: "Helvetica-Bold",
    color: C.navy,
    marginRight: 8,
  },
  reportUser: {
    fontSize: 8.5,
    color: C.textPrimary,
    marginRight: 8,
  },
  reportTerm: {
    fontSize: 8.5,
    color: C.textSecondary,
  },
  reportText: {
    fontSize: 10,
    color: C.textPrimary,
    lineHeight: 1.5,
  },
  caseNo: {
    fontSize: 7,
    color: C.textMuted,
    fontFamily: "Courier",
    marginTop: 2,
  },
  emptyState: {
    fontSize: 10,
    color: C.textSecondary,
    fontStyle: "italic",
    padding: 12,
    textAlign: "center",
    backgroundColor: C.offwhite,
    borderRadius: 4,
  },
  placeholderBox: {
    padding: 10,
    borderWidth: 1,
    borderColor: C.line,
    borderStyle: "dashed",
    borderRadius: 4,
    fontSize: 9.5,
    color: C.textSecondary,
    textAlign: "center",
  },
  // ── Footer ───────────────────────────────────────────────────
  footer: {
    position: "absolute",
    bottom: 16,
    left: 32,
    right: 32,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    fontSize: 7.5,
    color: C.textMuted,
    borderTopWidth: 0.5,
    borderTopColor: C.line,
    paddingTop: 6,
  },
  footerMark: {
    flexDirection: "row",
    alignItems: "center",
  },
  footerMarkText: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: C.navy,
  },
});

// ── Helpers ─────────────────────────────────────────────────────

function formatPdfDate(s: string): string {
  const [y, m, d] = s.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  return dt.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function formatPdfDateShort(s: string): string {
  const [y, m, d] = s.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  return dt.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function formatPdfTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

function categoryColor(name: string): string {
  switch (name) {
    case "IT": return C.catIT;
    case "Guest": return C.catGuest;
    case "Safety": return C.catSafety;
    case "Operations": return C.catOps;
    case "Associate": return C.catAssociate;
    case "Maintenance": return C.catMaintenance;
    case "Food & Beverage": return C.catFB;
    case "Retail": return C.catRetail;
    default: return C.catOther;
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

function groupByCategory(reports: IncludedReport[]) {
  const groups: Record<string, IncludedReport[]> = {};
  reports.forEach((r) => {
    const k = r.category || "Other";
    (groups[k] = groups[k] || []).push(r);
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
  return Object.keys(groups)
    .sort((a, b) => {
      const ia = order.indexOf(a);
      const ib = order.indexOf(b);
      return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
    })
    .map((k) => [k, groups[k]] as const);
}

/**
 * Classify a free-text conditions string into an icon family.
 */
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

// Small beAcon brand mark rendered as inline SVG
function BrandMark({
  size = 22,
  bodyColor = C.white,
  beamColor = C.teal,
  accentColor = C.gold,
}: {
  size?: number;
  bodyColor?: string;
  beamColor?: string;
  accentColor?: string;
}) {
  const w = (size * 64) / 80;
  return (
    <Svg width={w} height={size} viewBox="0 0 64 80">
      <Path
        fillRule="evenodd"
        fill={bodyColor}
        d="M32 14 L62 76 L2 76 Z M32 32 L40 52 L24 52 Z M27 60 L37 60 L37 76 L27 76 Z"
      />
      <Path d="M32 0 L46 11 L18 11 Z" fill={beamColor} />
      <Path d="M32 3 L39 10 L25 10 Z" fill={accentColor} />
    </Svg>
  );
}

// ── Weather glyphs ──────────────────────────────────────────────

function WeatherIcon({ kind, size = 38 }: { kind: WeatherKind; size?: number }) {
  // All icons use viewBox 24×24 for consistency
  switch (kind) {
    case "sun":
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Circle cx={12} cy={12} r={4.4} fill={C.sun} />
          {[0, 45, 90, 135, 180, 225, 270, 315].map((deg, i) => {
            const rad = (deg * Math.PI) / 180;
            const x1 = 12 + Math.cos(rad) * 7;
            const y1 = 12 + Math.sin(rad) * 7;
            const x2 = 12 + Math.cos(rad) * 9.5;
            const y2 = 12 + Math.sin(rad) * 9.5;
            return (
              <Line
                key={i}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke={C.sun}
                strokeWidth={1.6}
                strokeLinecap="round"
              />
            );
          })}
        </Svg>
      );
    case "partly":
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Circle cx={9} cy={9} r={3.4} fill={C.sun} />
          {[0, 90, 180, 270, 45, 135, 225, 315].map((deg, i) => {
            const rad = (deg * Math.PI) / 180;
            const x1 = 9 + Math.cos(rad) * 4.6;
            const y1 = 9 + Math.sin(rad) * 4.6;
            const x2 = 9 + Math.cos(rad) * 6.4;
            const y2 = 9 + Math.sin(rad) * 6.4;
            return (
              <Line
                key={i}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke={C.sun}
                strokeWidth={1.3}
                strokeLinecap="round"
              />
            );
          })}
          {/* Cloud */}
          <Path
            fill={C.textSecondary}
            d="M9 17 q-3 0 -3 -2.4 q0 -2 1.8 -2.5 q0.3 -2.3 2.7 -2.3 q2.1 0 2.7 1.7 q0.6 -0.4 1.4 -0.4 q1.7 0 2.1 1.6 q1.8 0.2 1.8 2 q0 2.3 -2.9 2.3 z"
          />
        </Svg>
      );
    case "cloudy":
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Path
            fill={C.textSecondary}
            d="M7.5 18 q-3.5 0 -3.5 -3 q0 -2.4 2.2 -3 q0.4 -2.8 3.2 -2.8 q2.5 0 3.2 2 q0.7 -0.5 1.6 -0.5 q2 0 2.4 1.9 q2.2 0.3 2.2 2.4 q0 2.9 -3.4 2.9 z"
          />
        </Svg>
      );
    case "rain":
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Path
            fill={C.textSecondary}
            d="M7.5 14 q-3.5 0 -3.5 -3 q0 -2.4 2.2 -3 q0.4 -2.8 3.2 -2.8 q2.5 0 3.2 2 q0.7 -0.5 1.6 -0.5 q2 0 2.4 1.9 q2.2 0.3 2.2 2.4 q0 2.9 -3.4 2.9 z"
          />
          {/* Raindrops */}
          <Line x1={8.5} y1={16} x2={7.5} y2={19} stroke={C.rain} strokeWidth={1.8} strokeLinecap="round" />
          <Line x1={12} y1={16} x2={11} y2={20} stroke={C.rain} strokeWidth={1.8} strokeLinecap="round" />
          <Line x1={15.5} y1={16} x2={14.5} y2={19} stroke={C.rain} strokeWidth={1.8} strokeLinecap="round" />
        </Svg>
      );
    case "storm":
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Path
            fill={C.textSecondary}
            d="M7.5 14 q-3.5 0 -3.5 -3 q0 -2.4 2.2 -3 q0.4 -2.8 3.2 -2.8 q2.5 0 3.2 2 q0.7 -0.5 1.6 -0.5 q2 0 2.4 1.9 q2.2 0.3 2.2 2.4 q0 2.9 -3.4 2.9 z"
          />
          {/* Lightning bolt */}
          <Path
            fill={C.gold}
            d="M12 14 L9.5 18 L11.5 18 L10 22 L14 17 L12 17 L13.5 14 Z"
          />
        </Svg>
      );
    case "fog":
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          {[8, 12, 16, 20].map((y, i) => (
            <Line
              key={i}
              x1={3}
              y1={y}
              x2={21}
              y2={y}
              stroke={C.textSecondary}
              strokeWidth={1.6}
              strokeLinecap="round"
              strokeDasharray={i % 2 === 0 ? "12 4" : "8 5 14 3"}
            />
          ))}
        </Svg>
      );
    case "snow":
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Path
            fill={C.textSecondary}
            d="M7.5 14 q-3.5 0 -3.5 -3 q0 -2.4 2.2 -3 q0.4 -2.8 3.2 -2.8 q2.5 0 3.2 2 q0.7 -0.5 1.6 -0.5 q2 0 2.4 1.9 q2.2 0.3 2.2 2.4 q0 2.9 -3.4 2.9 z"
          />
          {[
            [8, 17],
            [12, 19],
            [16, 17],
          ].map(([x, y], i) => (
            <Circle key={i} cx={x} cy={y} r={1.2} fill={C.sky} />
          ))}
        </Svg>
      );
  }
}

function ThermometerIcon({ size = 12 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        fill={C.textSecondary}
        d="M12 3 a3 3 0 0 0 -3 3 v9 a4 4 0 1 0 6 0 V6 a3 3 0 0 0 -3 -3 z M12 5 a1 1 0 0 1 1 1 v9.3 a2 2 0 1 1 -2 0 V6 a1 1 0 0 1 1 -1 z"
      />
      <Circle cx={12} cy={17.5} r={2} fill="#EF4444" />
    </Svg>
  );
}

function DropletIcon({ size = 12 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        fill={C.rain}
        d="M12 3 C 7 11 6 14 6 16 a6 6 0 0 0 12 0 c0 -2 -1 -5 -6 -13 z"
      />
    </Svg>
  );
}

function WindIcon({ size = 12 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        fill="none"
        stroke={C.textSecondary}
        strokeWidth={2}
        strokeLinecap="round"
        d="M3 9 h12 a3 3 0 1 0 -3 -3"
      />
      <Path
        fill="none"
        stroke={C.textSecondary}
        strokeWidth={2}
        strokeLinecap="round"
        d="M3 14 h15 a3 3 0 1 1 -3 3"
      />
      <Path
        fill="none"
        stroke={C.textSecondary}
        strokeWidth={2}
        strokeLinecap="round"
        d="M3 19 h7"
      />
    </Svg>
  );
}

// ── Hero tiles ──────────────────────────────────────────────────

function HeroTiles({
  metrics,
  weather,
  reportsCount,
}: {
  metrics: unknown | null;
  weather: unknown | null;
  reportsCount: number;
}) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const m = metrics as any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const w = weather as any;
  const totalTx = typeof m?.total_transactions === "number" ? m.total_transactions : null;
  const totalTk = typeof m?.total_tickets === "number" ? m.total_tickets : null;
  const high = typeof w?.high_f === "number" ? Math.round(w.high_f) : null;
  const low = typeof w?.low_f === "number" ? Math.round(w.low_f) : null;
  const cond: string = typeof w?.conditions === "string" ? w.conditions : "—";
  const condShort = cond.length > 22 ? cond.slice(0, 22).trim() + "…" : cond;
  const kind = weatherKindFor(cond);

  return (
    <View style={styles.heroRow}>
      <View style={styles.tile}>
        <View>
          <Text style={styles.tileLabel}>TRANSACTIONS</Text>
          <Text style={styles.tileValue}>
            {totalTx !== null ? totalTx.toLocaleString() : "—"}
          </Text>
        </View>
        <Text style={styles.tileSub}>
          {totalTx !== null ? "Across all outlets" : "Awaiting Snowflake"}
        </Text>
      </View>
      <View style={styles.tile}>
        <View>
          <Text style={styles.tileLabel}>TICKETS</Text>
          <Text style={styles.tileValue}>
            {totalTk !== null ? totalTk.toLocaleString() : "—"}
          </Text>
        </View>
        <Text style={styles.tileSub}>
          {totalTk !== null ? "Park admissions" : "Awaiting Snowflake"}
        </Text>
      </View>
      <View style={styles.tile}>
        <View style={styles.tileTop}>
          <View>
            <Text style={styles.tileLabel}>WEATHER</Text>
            <Text style={styles.tileValue}>
              {high !== null ? `${high}°` : "—"}
              {low !== null && (
                <Text style={{ fontSize: 12, color: C.textSecondary }}>
                  {" / "}{low}°
                </Text>
              )}
            </Text>
          </View>
          <WeatherIcon kind={kind} size={26} />
        </View>
        <Text style={styles.tileSub}>{condShort}</Text>
      </View>
      <View style={[styles.tile, styles.tileTeal]}>
        <View>
          <Text style={[styles.tileLabel, { color: C.tealDark }]}>REPORTS</Text>
          <Text style={styles.tileValueTeal}>{reportsCount}</Text>
        </View>
        <Text style={[styles.tileSub, { color: C.tealDark }]}>
          {reportsCount === 1 ? "Field report" : "Field reports"}
        </Text>
      </View>
    </View>
  );
}

// ── Weather card ────────────────────────────────────────────────

function WeatherCard({ weather }: { weather: unknown | null }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const w = weather as any;
  const has =
    w &&
    typeof w === "object" &&
    (w.high_f != null ||
      w.low_f != null ||
      w.conditions ||
      w.precipitation_in != null ||
      w.wind_max_mph != null);

  if (!has) {
    return (
      <View style={styles.card}>
        <Text style={styles.cardTitle}>WEATHER · WILDWOOD, NJ</Text>
        <View style={styles.placeholderBox}>
          <Text>Weather not yet fetched.</Text>
        </View>
      </View>
    );
  }

  const kind = weatherKindFor(w.conditions);
  const hi = typeof w.high_f === "number" ? `${Math.round(w.high_f)}°F` : "—";
  const lo = typeof w.low_f === "number" ? `${Math.round(w.low_f)}°F` : "—";

  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>WEATHER · WILDWOOD, NJ</Text>

      {/* Hero block: icon + temp + conditions */}
      <View style={styles.weatherHero}>
        <WeatherIcon kind={kind} size={40} />
        <View style={styles.weatherHeroText}>
          <Text style={styles.weatherHeroTemp}>
            {hi}{" "}
            <Text style={{ fontSize: 12, color: C.textSecondary }}>/ {lo}</Text>
          </Text>
          {w.conditions && (
            <Text style={styles.weatherHeroCond}>{w.conditions}</Text>
          )}
        </View>
      </View>

      {/* Detail rows with icons */}
      <View style={styles.weatherDetailRow}>
        <ThermometerIcon size={11} />
        <Text style={styles.weatherDetailKey}>High / Low</Text>
        <Text style={styles.weatherDetailVal}>
          {hi} / {lo}
        </Text>
      </View>
      <View style={styles.weatherDetailRow}>
        <DropletIcon size={11} />
        <Text style={styles.weatherDetailKey}>Precipitation</Text>
        <Text style={styles.weatherDetailVal}>
          {typeof w.precipitation_in === "number"
            ? w.precipitation_in > 0
              ? `${w.precipitation_in.toFixed(2)}"`
              : "None"
            : "—"}
        </Text>
      </View>
      <View style={styles.weatherDetailRow}>
        <WindIcon size={11} />
        <Text style={styles.weatherDetailKey}>Max wind</Text>
        <Text style={styles.weatherDetailVal}>
          {typeof w.wind_max_mph === "number"
            ? `${Math.round(w.wind_max_mph)} mph`
            : "—"}
        </Text>
      </View>
    </View>
  );
}

// ── Ticket category bars ────────────────────────────────────────

function TicketCategoryCard({ metrics }: { metrics: unknown | null }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const m = metrics as any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cats: any[] = Array.isArray(m?.tickets_by_category)
    ? m.tickets_by_category
    : [];

  if (cats.length === 0) {
    return (
      <View style={styles.card}>
        <Text style={styles.cardTitle}>TICKETS BY CATEGORY</Text>
        <View style={styles.placeholderBox}>
          <Text>Awaiting category breakdown.</Text>
        </View>
      </View>
    );
  }

  const max = Math.max(
    ...cats.map((c) => (typeof c.count === "number" ? c.count : 0)),
    1,
  );

  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>TICKETS BY CATEGORY</Text>
      {cats.slice(0, 8).map((c, i) => {
        const name = c.display_name ?? c.source_category ?? "—";
        const count = typeof c.count === "number" ? c.count : 0;
        const pct = Math.max(2, Math.round((count / max) * 100));
        return (
          <View key={i} style={styles.catBarRow}>
            <Text style={styles.catBarLabel}>{name}</Text>
            <View style={styles.catBarTrack}>
              <View
                style={[
                  styles.catBarFill,
                  { width: `${pct}%`, backgroundColor: C.teal },
                ]}
              />
            </View>
            <Text style={styles.catBarCount}>{count.toLocaleString()}</Text>
          </View>
        );
      })}
      {m?.source === "mock" && (
        <Text style={{ fontSize: 7, color: C.textMuted, marginTop: 5 }}>
          Demo data — Snowflake will populate when configured.
        </Text>
      )}
    </View>
  );
}

// ── Main document ───────────────────────────────────────────────

export function DailyReportPDF({ data }: { data: DailyReportData }) {
  const grouped = groupByCategory(data.reports);
  const isSent = data.status === "sent";
  const curator = data.curator ?? null;

  return (
    <Document title={`beAcon Daily Report — ${data.date}`}>
      <Page size="LETTER" style={styles.page} wrap>
        {/* Header band — fixed across pages */}
        <View style={styles.headerBand} fixed>
          <View style={styles.headerLeft}>
            <BrandMark size={26} />
            <View style={{ marginLeft: 10 }}>
              <View style={styles.brandRow}>
                <Text style={styles.brandText}>
                  be<Text style={{ color: C.teal }}>A</Text>con
                </Text>
              </View>
              <Text style={styles.subTitle}>DAILY OPERATIONS · MOREY&apos;S PIERS</Text>
            </View>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.dateMain}>{formatPdfDateShort(data.date)}</Text>
            <Text style={styles.dateSub}>{formatPdfDate(data.date)}</Text>
            <Text style={isSent ? styles.statusPillSent : styles.statusPillDraft}>
              {isSent ? "OFFICIAL" : "DRAFT"}
            </Text>
          </View>
        </View>
        <View style={styles.accentBar} fixed />

        {/* Curator strip — shows who built this report */}
        <View style={styles.curatorStrip} fixed>
          {curator ? (
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Text style={styles.curatorLabel}>CURATED BY</Text>
              <Text style={styles.curatorName}>{curator.name}</Text>
              {curator.department && (
                <Text style={styles.curatorDept}>· {curator.department}</Text>
              )}
              <Text style={styles.curatorRole}>· {roleLabel(curator.role)}</Text>
            </View>
          ) : (
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Text style={styles.curatorLabel}>SOURCE</Text>
              <Text style={styles.curatorName}>beAcon overnight automation</Text>
            </View>
          )}
        </View>

        <View style={styles.body}>
          {/* Hero tile row */}
          <HeroTiles
            metrics={data.metrics}
            weather={data.weather}
            reportsCount={data.reports.length}
          />

          {/* AI summary pull-quote */}
          <Text style={styles.sectionTitle}>OPERATIONAL SUMMARY</Text>
          {data.ai_summary && data.ai_summary.trim().length > 0 ? (
            <View style={styles.summaryBox}>
              <Text style={styles.summaryQuoteMark}>&ldquo;</Text>
              <Text style={styles.summaryText}>{data.ai_summary.trim()}</Text>
            </View>
          ) : (
            <View style={[styles.placeholderBox, { marginBottom: 14 }]}>
              <Text>AI summary not yet generated for this report.</Text>
            </View>
          )}

          {/* Supervisor notes */}
          {data.supervisor_notes && data.supervisor_notes.trim().length > 0 && (
            <View>
              <Text style={styles.sectionTitle}>SUPERVISOR NOTES</Text>
              <View style={styles.notesBox}>
                <Text style={styles.notesText}>{data.supervisor_notes}</Text>
              </View>
            </View>
          )}

          {/* Weather + categories grid */}
          <Text style={styles.sectionTitle}>DAY AT A GLANCE</Text>
          <View style={styles.grid}>
            <View style={styles.gridCol}>
              <WeatherCard weather={data.weather} />
            </View>
            <View style={styles.gridCol}>
              <TicketCategoryCard metrics={data.metrics} />
            </View>
          </View>

          {/* Reports grouped by category */}
          <View style={styles.reportsHeaderRow}>
            <Text style={styles.reportsHeaderText}>Field reports</Text>
            <Text style={styles.reportsCountChip}>
              {data.reports.length}{" "}
              {data.reports.length === 1 ? "REPORT" : "REPORTS"}
            </Text>
          </View>

          {grouped.length === 0 && (
            <View style={styles.emptyState}>
              <Text>
                Nothing to report — no field reports were included in this Daily Report.
              </Text>
            </View>
          )}

          {grouped.map(([cat, items]) => (
            <View key={cat} style={styles.catSectionWrap} wrap={false}>
              <View style={styles.catSectionHeader}>
                <View
                  style={[
                    styles.catSectionStripe,
                    { backgroundColor: categoryColor(cat) },
                  ]}
                />
                <Text style={styles.catSectionName}>{cat}</Text>
                <Text style={styles.catSectionCount}>
                  {items.length}{" "}
                  {items.length === 1 ? "report" : "reports"}
                </Text>
              </View>
              {items.map((r, i) => (
                <View key={i} style={styles.reportRow} wrap={false}>
                  <View style={styles.reportMetaRow}>
                    <Text style={styles.reportTime}>
                      {formatPdfTime(r.submitted_at)}
                    </Text>
                    <Text style={styles.reportUser}>{r.user}</Text>
                    <Text style={styles.reportTerm}>· {r.terminal}</Text>
                  </View>
                  <Text style={styles.reportText}>{r.text}</Text>
                  <Text style={styles.caseNo}>{r.case_number}</Text>
                </View>
              ))}
            </View>
          ))}
        </View>

        {/* Footer */}
        <View style={styles.footer} fixed>
          <View style={styles.footerMark}>
            <BrandMark size={10} bodyColor={C.navy} />
            <Text style={[styles.footerMarkText, { marginLeft: 4 }]}>
              be<Text style={{ color: C.teal }}>A</Text>con
            </Text>
            <Text style={{ fontSize: 7.5, color: C.textMuted, marginLeft: 6 }}>
              · Operational intelligence for Morey&apos;s Piers
            </Text>
          </View>
          <Text
            render={({ pageNumber, totalPages }) =>
              `${pageNumber} / ${totalPages}`
            }
          />
        </View>
      </Page>
    </Document>
  );
}

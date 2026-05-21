/* eslint-disable jsx-a11y/alt-text */
import {
  Document,
  Page,
  View,
  Text,
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

export type DailyReportData = {
  date: string;                 // YYYY-MM-DD
  status: string;               // 'draft' | 'sent'
  weather: unknown | null;
  metrics: unknown | null;
  ai_summary: string | null;
  supervisor_notes: string | null;
  reports: IncludedReport[];
};

const COLOR = {
  red: "#E4002B",
  ocean: "#0099CC",
  sun: "#FFD23F",
  deep: "#1B3A57",
  sand: "#FBF6EC",
  grayLine: "#E5E7EB",
  grayText: "#6B7280",
};

const styles = StyleSheet.create({
  page: {
    padding: 36,
    fontFamily: "Helvetica",
    fontSize: 10.5,
    color: COLOR.deep,
    lineHeight: 1.4,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 3,
    borderBottomColor: COLOR.red,
    paddingBottom: 10,
    marginBottom: 14,
  },
  brand: {
    fontSize: 22,
    fontFamily: "Helvetica-Bold",
    color: COLOR.red,
    letterSpacing: 1,
  },
  brandSub: {
    fontSize: 9,
    color: COLOR.grayText,
    marginTop: 2,
  },
  dateBlock: {
    alignItems: "flex-end",
  },
  dateMain: {
    fontFamily: "Helvetica-Bold",
    fontSize: 14,
    color: COLOR.deep,
  },
  statusPill: {
    fontSize: 8,
    marginTop: 2,
    color: COLOR.grayText,
  },
  section: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontFamily: "Helvetica-Bold",
    fontSize: 12,
    color: COLOR.deep,
    marginBottom: 6,
    paddingBottom: 3,
    borderBottomWidth: 1,
    borderBottomColor: COLOR.grayLine,
  },
  twoCol: {
    flexDirection: "row",
    gap: 12,
  },
  col: { flex: 1 },
  placeholderBox: {
    padding: 8,
    borderWidth: 1,
    borderColor: COLOR.grayLine,
    borderStyle: "dashed",
    borderRadius: 4,
    fontSize: 9.5,
    color: COLOR.grayText,
  },
  notesBox: {
    padding: 10,
    backgroundColor: COLOR.sand,
    borderRadius: 4,
    fontSize: 10.5,
  },
  categoryHeader: {
    fontFamily: "Helvetica-Bold",
    fontSize: 11,
    color: COLOR.deep,
    backgroundColor: "#F3F4F6",
    paddingVertical: 4,
    paddingHorizontal: 6,
    marginTop: 10,
    marginBottom: 4,
  },
  reportRow: {
    paddingVertical: 6,
    borderBottomWidth: 0.5,
    borderBottomColor: COLOR.grayLine,
  },
  reportMeta: {
    fontSize: 8.5,
    color: COLOR.grayText,
    marginBottom: 2,
  },
  reportText: {
    fontSize: 10.5,
    color: COLOR.deep,
  },
  caseNo: {
    fontSize: 7.5,
    color: "#9CA3AF",
    fontFamily: "Courier",
    marginTop: 2,
  },
  footer: {
    position: "absolute",
    bottom: 20,
    left: 36,
    right: 36,
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 8,
    color: COLOR.grayText,
    borderTopWidth: 0.5,
    borderTopColor: COLOR.grayLine,
    paddingTop: 4,
  },
});

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

function formatPdfTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

function MetricsBlock({ metrics }: { metrics: unknown | null }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const m = metrics as any;
  if (
    !m ||
    typeof m !== "object" ||
    (m.total_transactions == null &&
      m.total_tickets == null &&
      !m.tickets_by_category)
  ) {
    return (
      <View style={styles.placeholderBox}>
        <Text>
          Metrics not yet fetched. Click &quot;Fetch&quot; in the builder.
        </Text>
      </View>
    );
  }
  const isMock = m.source === "mock";
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cats: any[] = Array.isArray(m.tickets_by_category)
    ? m.tickets_by_category
    : [];
  return (
    <View
      style={{
        padding: 8,
        backgroundColor: "#F5FAF7",
        borderRadius: 4,
      }}
    >
      <Text style={{ fontSize: 10.5, marginBottom: 3 }}>
        Transactions:{" "}
        <Text style={{ fontFamily: "Helvetica-Bold" }}>
          {typeof m.total_transactions === "number"
            ? m.total_transactions.toLocaleString()
            : "—"}
        </Text>
      </Text>
      <Text style={{ fontSize: 10.5, marginBottom: 4 }}>
        Tickets:{" "}
        <Text style={{ fontFamily: "Helvetica-Bold" }}>
          {typeof m.total_tickets === "number"
            ? m.total_tickets.toLocaleString()
            : "—"}
        </Text>
      </Text>
      {cats.length > 0 && (
        <View style={{ marginTop: 2 }}>
          {cats.map((c, i) => (
            <View
              key={i}
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                fontSize: 9.5,
                paddingVertical: 1,
              }}
            >
              <Text style={{ fontSize: 9.5 }}>
                {c.display_name ?? c.source_category ?? "—"}
              </Text>
              <Text style={{ fontSize: 9.5, fontFamily: "Courier" }}>
                {typeof c.count === "number" ? c.count.toLocaleString() : "—"}
              </Text>
            </View>
          ))}
        </View>
      )}
      {isMock && (
        <Text
          style={{
            fontSize: 7.5,
            color: "#92400E",
            marginTop: 4,
          }}
        >
          DEMO DATA (Phase 6B will swap in real Snowflake)
        </Text>
      )}
    </View>
  );
}

function WeatherBlock({ weather }: { weather: unknown | null }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const w = weather as any;
  if (
    !w ||
    typeof w !== "object" ||
    (w.high_f === null && w.low_f === null && !w.conditions)
  ) {
    return (
      <View style={styles.placeholderBox}>
        <Text>
          Weather not yet fetched. Click &quot;Refresh weather&quot; in the builder.
        </Text>
      </View>
    );
  }
  const lines: string[] = [];
  if (w.conditions) lines.push(`${w.conditions}.`);
  if (typeof w.high_f === "number" || typeof w.low_f === "number") {
    const hi = typeof w.high_f === "number" ? `${Math.round(w.high_f)}°F` : "—";
    const lo = typeof w.low_f === "number" ? `${Math.round(w.low_f)}°F` : "—";
    lines.push(`High ${hi} / Low ${lo}`);
  }
  if (typeof w.precipitation_in === "number") {
    lines.push(
      w.precipitation_in > 0
        ? `Precipitation: ${w.precipitation_in.toFixed(2)}"`
        : `Precipitation: none`,
    );
  }
  if (typeof w.wind_max_mph === "number") {
    lines.push(`Max wind: ${Math.round(w.wind_max_mph)} mph`);
  }
  return (
    <View
      style={{
        padding: 8,
        backgroundColor: "#F0F9FF",
        borderRadius: 4,
      }}
    >
      {lines.map((l, i) => (
        <Text key={i} style={{ fontSize: 10.5, marginBottom: 2 }}>
          {l}
        </Text>
      ))}
    </View>
  );
}

function groupByCategory(reports: IncludedReport[]) {
  const groups: Record<string, IncludedReport[]> = {};
  reports.forEach((r) => {
    const k = r.category || "Other";
    (groups[k] = groups[k] || []).push(r);
  });
  // Sort categories by Morey's preferred order
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

export function DailyReportPDF({ data }: { data: DailyReportData }) {
  const grouped = groupByCategory(data.reports);

  return (
    <Document title={`Morey's Daily Report — ${data.date}`}>
      <Page size="LETTER" style={styles.page} wrap>
        {/* Header */}
        <View style={styles.header} fixed>
          <View>
            <Text style={styles.brand}>MOREY&apos;S PIERS</Text>
            <Text style={styles.brandSub}>Daily Operations Report</Text>
          </View>
          <View style={styles.dateBlock}>
            <Text style={styles.dateMain}>{formatPdfDate(data.date)}</Text>
            <Text style={styles.statusPill}>
              {data.status === "sent" ? "OFFICIAL" : "DRAFT"}
            </Text>
          </View>
        </View>

        {/* Top row: weather + metrics */}
        <View style={styles.twoCol}>
          <View style={[styles.section, styles.col]}>
            <Text style={styles.sectionTitle}>Weather — Wildwood, NJ</Text>
            <WeatherBlock weather={data.weather} />
          </View>
          <View style={[styles.section, styles.col]}>
            <Text style={styles.sectionTitle}>Transactions & Tickets</Text>
            <MetricsBlock metrics={data.metrics} />
          </View>
        </View>

        {/* AI summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Summary</Text>
          {data.ai_summary && data.ai_summary.trim().length > 0 ? (
            <View
              style={{
                padding: 8,
                backgroundColor: "#F9FAFB",
                borderRadius: 4,
              }}
            >
              <Text style={{ fontSize: 10.5, lineHeight: 1.5 }}>
                {data.ai_summary}
              </Text>
            </View>
          ) : (
            <View style={styles.placeholderBox}>
              <Text>
                AI summary not yet generated for this report. Click &quot;Generate&quot; in the builder.
              </Text>
            </View>
          )}
        </View>

        {/* Supervisor notes */}
        {data.supervisor_notes && data.supervisor_notes.trim().length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Supervisor notes</Text>
            <View style={styles.notesBox}>
              <Text>{data.supervisor_notes}</Text>
            </View>
          </View>
        )}

        {/* Reports by category */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Reports ({data.reports.length})
          </Text>
          {grouped.length === 0 && (
            <Text style={{ color: COLOR.grayText, fontSize: 10 }}>
              No reports included in this daily report.
            </Text>
          )}
          {grouped.map(([cat, items]) => (
            <View key={cat} wrap={false}>
              <Text style={styles.categoryHeader}>
                {cat} ({items.length})
              </Text>
              {items.map((r, i) => (
                <View key={i} style={styles.reportRow} wrap={false}>
                  <Text style={styles.reportMeta}>
                    {formatPdfTime(r.submitted_at)} · {r.user} · {r.terminal}
                  </Text>
                  <Text style={styles.reportText}>{r.text}</Text>
                  <Text style={styles.caseNo}>{r.case_number}</Text>
                </View>
              ))}
            </View>
          ))}
        </View>

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text>Morey&apos;s Piers • Internal Daily Report</Text>
          <Text
            render={({ pageNumber, totalPages }) =>
              `Page ${pageNumber} of ${totalPages}`
            }
          />
        </View>
      </Page>
    </Document>
  );
}

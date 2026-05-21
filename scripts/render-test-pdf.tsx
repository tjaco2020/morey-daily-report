/* eslint-disable @typescript-eslint/no-explicit-any */
import { renderToFile } from "@react-pdf/renderer";
import React from "react";
import { DailyReportPDF } from "../lib/pdf/DailyReport";

const data = {
  date: "2026-05-20",
  status: "sent",
  curator: {
    name: "Tyler Jacobs",
    role: "manager",
    department: "Operations",
  },
  weather: {
    high_f: 78,
    low_f: 61,
    conditions: "Partly cloudy with afternoon clearing",
    precipitation_in: 0,
    wind_max_mph: 14,
  },
  metrics: {
    source: "real",
    total_transactions: 28412,
    total_tickets: 11243,
    tickets_by_category: [
      { display_name: "Day Pass", count: 6210 },
      { display_name: "Twilight", count: 2845 },
      { display_name: "Single Use", count: 1233 },
      { display_name: "Season Pass", count: 612 },
      { display_name: "Group", count: 343 },
    ],
  },
  ai_summary:
    "Steady ride volumes through the afternoon with strong twilight uptake. Two F&B outages at Mariner's Pier resolved within 20 minutes. Guest sentiment trending positive — five compliments logged against zero complaints. Maintenance closed out a longstanding railing issue on the Great Nor'Easter.",
  supervisor_notes:
    "Heads up — west-side restrooms scheduled for deep clean tomorrow 6-7am.",
  reports: [
    { case_number: "MP-2026-05-20-001", category: "Guest", terminal: "Mariner's Pier - Front Gate", user: "Maria Sanchez", submitted_at: "2026-05-20T15:23:00Z", text: "Family of 4 reported a lost child near the carousel; reunited within 8 minutes via Pier 1 security." },
    { case_number: "MP-2026-05-20-002", category: "Maintenance", terminal: "Surfside - Tech Booth", user: "Jamie Chen", submitted_at: "2026-05-20T17:04:00Z", text: "Closed out railing repair on Great Nor'Easter. Inspected and signed off by safety lead." },
    { case_number: "MP-2026-05-20-003", category: "IT", terminal: "Adventure Pier - HQ", user: "Pat O'Connor", submitted_at: "2026-05-20T19:15:00Z", text: "POS at Surfside Funnel Cake went offline for 12 minutes; rebooted, all transactions reconciled." },
    { case_number: "MP-2026-05-20-004", category: "Safety", terminal: "Mariner's Pier - Front Gate", user: "Maria Sanchez", submitted_at: "2026-05-20T20:30:00Z", text: "Minor scrape, guest declined first aid. Incident logged per protocol." },
  ],
} as any;

async function main() {
  await renderToFile(
    React.createElement(DailyReportPDF, { data }) as any,
    "/tmp/test-daily.pdf",
  );
  // eslint-disable-next-line no-console
  console.log("Rendered to /tmp/test-daily.pdf");
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error("Render failed:", err);
  process.exit(1);
});

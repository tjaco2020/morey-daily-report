/* eslint-disable @typescript-eslint/no-explicit-any */
import { writeFileSync } from "fs";
import {
  renderDailyReportEmailHTML,
  renderDailyReportEmailText,
} from "../lib/email/dailyReport";

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
    { case_number: "MP-1", category: "Guest", terminal: "Mariner's Pier", user: "Maria Sanchez", submitted_at: "2026-05-20T15:23:00Z", text: "..." },
    { case_number: "MP-2", category: "Maintenance", terminal: "Surfside", user: "Jamie Chen", submitted_at: "2026-05-20T17:04:00Z", text: "..." },
    { case_number: "MP-3", category: "IT", terminal: "Adventure Pier", user: "Pat O'Connor", submitted_at: "2026-05-20T19:15:00Z", text: "..." },
    { case_number: "MP-4", category: "Safety", terminal: "Mariner's Pier", user: "Maria Sanchez", submitted_at: "2026-05-20T20:30:00Z", text: "..." },
  ],
} as any;

const html = renderDailyReportEmailHTML(data);
const text = renderDailyReportEmailText(data);
writeFileSync("/tmp/test-email.html", html);
writeFileSync("/tmp/test-email.txt", text);
// eslint-disable-next-line no-console
console.log("html bytes:", html.length, "text bytes:", text.length);

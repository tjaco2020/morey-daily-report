// Snowflake metrics fetcher.
//
// When Snowflake env credentials are set, runs real queries against
// Morey's ORION database. Otherwise falls back to deterministic mock
// data so the rest of the pipeline (UI / PDF / email) remains testable.

import { createServerSupabase } from "@/lib/supabase/server";
import { createRequire } from "node:module";
import path from "node:path";

/**
 * Load snowflake-sdk lazily, trying multiple resolution strategies. The
 * goal is to support both bundled-server output (Next.js compiled file in
 * .next/server/...) and ordinary Node ESM contexts.
 *
 * Strategy order:
 *   1. createRequire anchored to <cwd>/package.json — always finds the
 *      project root's node_modules.
 *   2. createRequire(import.meta.url) — fallback that works in plain ESM.
 *   3. eval("require") — last-resort access to a CommonJS require in
 *      bundled contexts.
 *
 * The module name is built at runtime so webpack can't statically follow
 * it during bundling.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let snowflakeSdkCache: any = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function loadSnowflakeSdk(): any {
  if (snowflakeSdkCache) return snowflakeSdkCache;
  const moduleName = ["snowflake", "sdk"].join("-");
  const errors: string[] = [];

  // 1. Anchor to the project root via cwd/package.json
  try {
    const req = createRequire(path.join(process.cwd(), "package.json"));
    snowflakeSdkCache = req(moduleName);
    return snowflakeSdkCache;
  } catch (err) {
    errors.push(
      `cwd-createRequire: ${err instanceof Error ? err.message : String(err)}`,
    );
  }

  // 2. createRequire from the current module's URL
  try {
    const req = createRequire(import.meta.url);
    snowflakeSdkCache = req(moduleName);
    return snowflakeSdkCache;
  } catch (err) {
    errors.push(
      `meta-createRequire: ${err instanceof Error ? err.message : String(err)}`,
    );
  }

  // 3. eval-based global require
  try {
    // eslint-disable-next-line no-eval
    const evaluatedRequire = eval("require") as NodeRequire;
    snowflakeSdkCache = evaluatedRequire(moduleName);
    return snowflakeSdkCache;
  } catch (err) {
    errors.push(
      `eval-require: ${err instanceof Error ? err.message : String(err)}`,
    );
  }

  throw new Error(
    "Could not load snowflake-sdk despite trying multiple strategies. " +
      "Run `npm install snowflake-sdk` and restart the dev server. " +
      "Diagnostics: " +
      errors.join(" | "),
  );
}

export type CategoryCount = {
  source_category: string;          // raw value from Snowflake
  display_name: string;             // mapped (or fallback to raw)
  display_order: number;
  count: number;
};

export type DailyMetrics = {
  fetched_at: string;
  source: "mock" | "snowflake";
  date: string;
  total_transactions: number | null;
  total_tickets: number | null;
  tickets_by_category: CategoryCount[];
};

export function snowflakeConfigured(): boolean {
  return Boolean(
    process.env.SNOWFLAKE_ACCOUNT &&
      process.env.SNOWFLAKE_USER &&
      process.env.SNOWFLAKE_PASSWORD &&
      process.env.SNOWFLAKE_WAREHOUSE &&
      process.env.SNOWFLAKE_DATABASE &&
      process.env.SNOWFLAKE_SCHEMA,
  );
}

/**
 * Deterministic mock — same date always returns the same numbers,
 * so the demo PDF/email is stable across test runs.
 */
function hashDate(date: string): number {
  let h = 0;
  for (let i = 0; i < date.length; i++) {
    h = (h * 31 + date.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

function mockTickets(h: number): { code: string; count: number }[] {
  return [
    { code: "DAY_PASS",      count: 500 + (h % 200) },
    { code: "HALF_DAY_PASS", count: 180 + ((h >> 2) % 100) },
    { code: "SEASON_PASS",   count: 80 + ((h >> 4) % 50) },
    { code: "BEACH_PASS",    count: 130 + ((h >> 6) % 80) },
    { code: "CABANA_RENTAL", count: 25 + ((h >> 8) % 25) },
    { code: "SPECIAL_EVENT", count: ((h >> 10) % 40) },
    { code: "OTHER",         count: 40 + ((h >> 12) % 40) },
  ];
}

async function loadMappings(): Promise<Map<string, { display_name: string; display_order: number }>> {
  const supabase = createServerSupabase();
  const { data } = await supabase
    .from("product_category_mappings")
    .select("source_category, display_name, display_order, active")
    .eq("active", true);
  const map = new Map<string, { display_name: string; display_order: number }>();
  (data ?? []).forEach((m) => {
    map.set(m.source_category, {
      display_name: m.display_name,
      display_order: m.display_order ?? 999,
    });
  });
  return map;
}

async function logQuery(args: {
  label: string;
  date: string;
  source: "mock" | "snowflake";
  status: "success" | "error";
  durationMs: number;
  rowsReturned?: number;
  errorMessage?: string;
}) {
  try {
    const supabase = createServerSupabase();
    await supabase.from("snowflake_query_logs").insert({
      query_label: args.label,
      query_date: args.date,
      source: args.source,
      status: args.status,
      duration_ms: args.durationMs,
      rows_returned: args.rowsReturned ?? null,
      error_message: args.errorMessage ?? null,
    });
  } catch {
    // never let logging failures bubble up
  }
}

async function fetchMockMetrics(date: string): Promise<DailyMetrics> {
  const t0 = Date.now();
  const h = hashDate(date);
  const tickets = mockTickets(h);
  const mappings = await loadMappings();

  const tickets_by_category: CategoryCount[] = tickets
    .map((t) => {
      const m = mappings.get(t.code);
      return {
        source_category: t.code,
        display_name: m?.display_name ?? t.code,
        display_order: m?.display_order ?? 999,
        count: t.count,
      };
    })
    .sort((a, b) => a.display_order - b.display_order);

  const total_tickets = tickets_by_category.reduce((s, x) => s + x.count, 0);
  const total_transactions = 600 + (h % 400);

  const result: DailyMetrics = {
    fetched_at: new Date().toISOString(),
    source: "mock",
    date,
    total_transactions,
    total_tickets,
    tickets_by_category,
  };

  await logQuery({
    label: "metrics_bundle",
    date,
    source: "mock",
    status: "success",
    durationMs: Date.now() - t0,
    rowsReturned: tickets_by_category.length,
  });
  return result;
}

/**
 * Real Snowflake fetch against Morey's ORION database.
 *
 * Transactions  = COUNT(*) of orders WHERE state='Closed', filtered to the
 *                 report date in America/New_York time.
 * Tickets       = order_product_instance (one row per ticket / redemption),
 *                 excluding refunds, grouped by RptCategory1 via
 *                 order_product → product_tag join.
 *
 * All identifiers in ORION are lowercase and must be double-quoted.
 */
async function fetchFromSnowflake(date: string): Promise<DailyMetrics> {
  const t0 = Date.now();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let conn: any = null;

  try {
    const sdk = loadSnowflakeSdk();

    conn = sdk.createConnection({
      account: process.env.SNOWFLAKE_ACCOUNT!,
      username: process.env.SNOWFLAKE_USER!,
      password: process.env.SNOWFLAKE_PASSWORD!,
      warehouse: process.env.SNOWFLAKE_WAREHOUSE,
      database: process.env.SNOWFLAKE_DATABASE,
      schema: process.env.SNOWFLAKE_SCHEMA,
    });

    await new Promise<void>((resolve, reject) => {
      conn.connect((err: Error | undefined) =>
        err ? reject(err) : resolve(),
      );
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const exec = (sqlText: string, binds: any[]): Promise<any[]> =>
      new Promise((resolve, reject) => {
        conn.execute({
          sqlText,
          binds,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          complete: (err: Error | undefined, _stmt: any, rows: any[]) =>
            err ? reject(err) : resolve(rows || []),
        });
      });

    // Transactions: orders closed on this date (NY time).
    const TX_SQL = `
      SELECT COUNT(*) AS "total_transactions"
      FROM ORION."order"."order"
      WHERE "state" = 'Closed'
        AND DATE(CONVERT_TIMEZONE('America/New_York', "created_date_time_offset")) = TO_DATE(?)
    `;

    // Tickets by category. Each opi row IS one ticket / redemption.
    //
    // Join chain (assuming the table-named-id convention for the PK):
    //   opi.order_product_id  =  op.order_product_id     (PK of op)
    //   op.product_id         =  pt.product_id
    //
    // LEFT JOIN to product_tag so uncategorized tickets are still counted.
    const TICKETS_SQL = `
      SELECT
        COALESCE(pt."value", 'Uncategorized') AS "category",
        COUNT(*) AS "count"
      FROM ORION."order"."order_product_instance" opi
      JOIN ORION."order"."order_product" op
        ON opi."order_product_id" = op."order_product_id"
      LEFT JOIN ORION."product"."product_tag" pt
        ON op."product_id" = pt."product_id"
        AND pt."category" = 'RptCategory1'
      WHERE opi."refund_id" IS NULL
        AND DATE(CONVERT_TIMEZONE('America/New_York', opi."created_date_time_offset")) = TO_DATE(?)
      GROUP BY COALESCE(pt."value", 'Uncategorized')
      ORDER BY "count" DESC
    `;

    const [txRows, ticketRows] = await Promise.all([
      exec(TX_SQL, [date]),
      exec(TICKETS_SQL, [date]),
    ]);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rawTotal = (txRows?.[0] as any)?.total_transactions;
    const totalTransactions =
      typeof rawTotal === "number"
        ? rawTotal
        : rawTotal != null
          ? Number(rawTotal)
          : null;

    const mappings = await loadMappings();

    const tickets_by_category: CategoryCount[] = ticketRows
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((r: any) => {
        const code = String(r.category ?? "Uncategorized");
        const m = mappings.get(code);
        return {
          source_category: code,
          display_name: m?.display_name ?? code,
          display_order: m?.display_order ?? 999,
          count: Number(r.count) || 0,
        };
      })
      .sort((a, b) => a.display_order - b.display_order);

    const totalTickets = tickets_by_category.reduce(
      (s, x) => s + x.count,
      0,
    );

    const result: DailyMetrics = {
      fetched_at: new Date().toISOString(),
      source: "snowflake",
      date,
      total_transactions: totalTransactions,
      total_tickets: totalTickets,
      tickets_by_category,
    };

    await logQuery({
      label: "metrics_bundle",
      date,
      source: "snowflake",
      status: "success",
      durationMs: Date.now() - t0,
      rowsReturned: ticketRows.length,
    });

    return result;
  } catch (err) {
    await logQuery({
      label: "metrics_bundle",
      date,
      source: "snowflake",
      status: "error",
      durationMs: Date.now() - t0,
      errorMessage: err instanceof Error ? err.message : String(err),
    });
    throw err;
  } finally {
    if (conn) {
      try {
        await new Promise<void>((resolve) => {
          conn.destroy(() => resolve());
        });
      } catch {
        // ignore
      }
    }
  }
}

export async function fetchDailyMetrics(date: string): Promise<DailyMetrics> {
  if (snowflakeConfigured()) {
    return await fetchFromSnowflake(date);
  }
  return await fetchMockMetrics(date);
}

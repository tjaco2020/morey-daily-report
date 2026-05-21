"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

type CategoryCount = {
  source_category?: string;
  display_name?: string;
  count?: number;
};

type MetricsSnapshot = {
  fetched_at?: string;
  source?: "mock" | "snowflake";
  total_transactions?: number | null;
  total_tickets?: number | null;
  tickets_by_category?: CategoryCount[];
} | null;

type Props = {
  date: string;
  initial: MetricsSnapshot;
};

export function MetricsPanel({ date, initial }: Props) {
  const router = useRouter();
  const [metrics, setMetrics] = useState<MetricsSnapshot>(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const autoFetchedRef = useRef(false);

  async function refresh() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/daily-report/${date}/metrics`, {
        method: "POST",
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || "Failed");
      setMetrics(body.snapshot);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not refresh.");
    } finally {
      setBusy(false);
    }
  }

  // Always refresh on first mount so opening the builder shows the
  // freshest numbers without anyone having to click Refresh manually.
  // autoFetchedRef ensures we only fire once per page load, not on every
  // re-render.
  useEffect(() => {
    if (!autoFetchedRef.current) {
      autoFetchedRef.current = true;
      refresh();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isMock = metrics?.source === "mock";

  return (
    <div className="bg-white rounded-bubble shadow p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm font-semibold text-morey-deep">
          Transactions & Tickets
        </div>
        <button
          onClick={refresh}
          disabled={busy}
          className="text-xs px-2 py-1 rounded bg-white border border-gray-300 hover:bg-gray-50 disabled:opacity-60"
        >
          {busy ? "Refreshing…" : metrics ? "Refresh" : "Fetch"}
        </button>
      </div>

      {error && (
        <p className="text-xs text-red-700 bg-red-50 border border-red-200 rounded p-2 mb-2">
          {error}
        </p>
      )}

      {metrics ? (
        <div className="text-sm text-gray-800 space-y-1">
          <div>
            Transactions:{" "}
            <span className="font-semibold">
              {metrics.total_transactions?.toLocaleString() ?? "—"}
            </span>
          </div>
          <div>
            Tickets:{" "}
            <span className="font-semibold">
              {metrics.total_tickets?.toLocaleString() ?? "—"}
            </span>
          </div>
          {metrics.tickets_by_category && metrics.tickets_by_category.length > 0 && (
            <ul className="mt-1 text-xs text-gray-700 space-y-0.5">
              {metrics.tickets_by_category.map((c, i) => (
                <li
                  key={i}
                  className="flex items-center justify-between border-t border-gray-100 pt-1 first:border-t-0 first:pt-0"
                >
                  <span>{c.display_name ?? c.source_category}</span>
                  <span className="font-mono">{c.count?.toLocaleString()}</span>
                </li>
              ))}
            </ul>
          )}
          <div className="text-[10px] text-gray-400 pt-1 flex items-center justify-between">
            {metrics.fetched_at && (
              <span>Fetched {new Date(metrics.fetched_at).toLocaleString()}</span>
            )}
            {isMock && (
              <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">
                Demo data
              </span>
            )}
          </div>
        </div>
      ) : (
        <p className="text-xs text-gray-500">Not yet fetched.</p>
      )}
    </div>
  );
}

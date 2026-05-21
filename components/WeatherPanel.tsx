"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

type WeatherSnapshot = {
  fetched_at?: string;
  conditions?: string;
  high_f?: number | null;
  low_f?: number | null;
  precipitation_in?: number | null;
  wind_max_mph?: number | null;
} | null;

type Props = {
  date: string;
  initial: WeatherSnapshot;
};

export function WeatherPanel({ date, initial }: Props) {
  const router = useRouter();
  const [weather, setWeather] = useState<WeatherSnapshot>(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const autoFetchedRef = useRef(false);

  async function refresh() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/daily-report/${date}/weather`, {
        method: "POST",
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || "Failed");
      setWeather(body.snapshot);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not refresh.");
    } finally {
      setBusy(false);
    }
  }

  // Always refresh on first mount so opening the builder shows the
  // freshest weather without anyone having to click Refresh manually.
  // autoFetchedRef ensures we only fire once per page load, not on every
  // re-render.
  useEffect(() => {
    if (!autoFetchedRef.current) {
      autoFetchedRef.current = true;
      refresh();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="bg-white rounded-bubble shadow p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm font-semibold text-morey-deep">
          Weather — Wildwood, NJ
        </div>
        <button
          onClick={refresh}
          disabled={busy}
          className="text-xs px-2 py-1 rounded bg-white border border-gray-300 hover:bg-gray-50 disabled:opacity-60"
        >
          {busy ? "Refreshing…" : weather ? "Refresh" : "Fetch"}
        </button>
      </div>
      {error && (
        <p className="text-xs text-red-700 bg-red-50 border border-red-200 rounded p-2 mb-2">
          {error}
        </p>
      )}
      {weather ? (
        <div className="space-y-1 text-sm text-gray-800">
          {weather.conditions && (
            <div className="font-medium">{weather.conditions}</div>
          )}
          {(typeof weather.high_f === "number" ||
            typeof weather.low_f === "number") && (
            <div>
              High{" "}
              {typeof weather.high_f === "number"
                ? `${Math.round(weather.high_f)}°F`
                : "—"}{" "}
              / Low{" "}
              {typeof weather.low_f === "number"
                ? `${Math.round(weather.low_f)}°F`
                : "—"}
            </div>
          )}
          {typeof weather.precipitation_in === "number" && (
            <div className="text-xs text-gray-500">
              Precipitation:{" "}
              {weather.precipitation_in > 0
                ? `${weather.precipitation_in.toFixed(2)} in`
                : "none"}
            </div>
          )}
          {typeof weather.wind_max_mph === "number" && (
            <div className="text-xs text-gray-500">
              Max wind: {Math.round(weather.wind_max_mph)} mph
            </div>
          )}
          {weather.fetched_at && (
            <div className="text-[10px] text-gray-400 pt-1">
              Fetched {new Date(weather.fetched_at).toLocaleString()}
            </div>
          )}
        </div>
      ) : (
        <p className="text-xs text-gray-500">Not yet fetched.</p>
      )}
    </div>
  );
}

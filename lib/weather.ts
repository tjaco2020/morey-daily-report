// Open-Meteo weather snapshot for Wildwood, NJ.
// No API key required. Free, no signup.

const WILDWOOD = { lat: 38.9912, lon: -74.8204 };

export type WeatherSnapshot = {
  fetched_at: string;
  source: "open-meteo";
  date: string;
  conditions: string;       // human-readable, e.g. "Partly cloudy"
  weather_code: number;     // WMO code
  high_f: number | null;
  low_f: number | null;
  precipitation_in: number | null;
  wind_max_mph: number | null;
};

// WMO weather interpretation codes — minimal mapping.
function wmoCodeToText(code: number): string {
  if (code === 0) return "Clear sky";
  if (code === 1) return "Mainly clear";
  if (code === 2) return "Partly cloudy";
  if (code === 3) return "Overcast";
  if (code === 45 || code === 48) return "Fog";
  if (code === 51) return "Light drizzle";
  if (code === 53) return "Moderate drizzle";
  if (code === 55) return "Dense drizzle";
  if (code === 56 || code === 57) return "Freezing drizzle";
  if (code === 61) return "Light rain";
  if (code === 63) return "Moderate rain";
  if (code === 65) return "Heavy rain";
  if (code === 66 || code === 67) return "Freezing rain";
  if (code === 71) return "Light snow";
  if (code === 73) return "Moderate snow";
  if (code === 75) return "Heavy snow";
  if (code === 77) return "Snow grains";
  if (code === 80) return "Rain showers";
  if (code === 81) return "Heavy rain showers";
  if (code === 82) return "Violent rain showers";
  if (code === 85 || code === 86) return "Snow showers";
  if (code === 95) return "Thunderstorm";
  if (code === 96 || code === 99) return "Thunderstorm with hail";
  return "Unknown";
}

export async function fetchWildwoodWeather(
  date: string,
): Promise<WeatherSnapshot> {
  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.searchParams.set("latitude", WILDWOOD.lat.toString());
  url.searchParams.set("longitude", WILDWOOD.lon.toString());
  url.searchParams.set(
    "daily",
    "temperature_2m_max,temperature_2m_min,precipitation_sum,wind_speed_10m_max,weather_code",
  );
  url.searchParams.set("timezone", "America/New_York");
  url.searchParams.set("temperature_unit", "fahrenheit");
  url.searchParams.set("wind_speed_unit", "mph");
  url.searchParams.set("precipitation_unit", "inch");
  url.searchParams.set("start_date", date);
  url.searchParams.set("end_date", date);

  const res = await fetch(url.toString(), { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Open-Meteo error: ${res.status} ${res.statusText}`);
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data = (await res.json()) as any;
  const d = data?.daily;
  const code = d?.weather_code?.[0] ?? 0;

  return {
    fetched_at: new Date().toISOString(),
    source: "open-meteo",
    date,
    conditions: wmoCodeToText(code),
    weather_code: code,
    high_f: d?.temperature_2m_max?.[0] ?? null,
    low_f: d?.temperature_2m_min?.[0] ?? null,
    precipitation_in: d?.precipitation_sum?.[0] ?? null,
    wind_max_mph: d?.wind_speed_10m_max?.[0] ?? null,
  };
}

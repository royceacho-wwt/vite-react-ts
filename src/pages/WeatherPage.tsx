import './WeatherPage.css';

import { FormEvent, useState } from 'react';

/* ── Types ──────────────────────────────────────────────────────────────── */

interface GeoResult {
  name: string;
  admin1: string;
  country: string;
  latitude: number;
  longitude: number;
}

export interface ForecastDay {
  date: string;
  weatherCode: number;
  tempMax: number;
  tempMin: number;
  precipitationSum: number;
}

/* ── WMO weather-code helpers ─────────────────────────────────────────── */

export function weatherIcon(code: number): string {
  if (code === 0) return '☀️';
  if (code <= 2) return '⛅';
  if (code <= 3) return '☁️';
  if (code <= 49) return '🌫️';
  if (code <= 59) return '🌦️';
  if (code <= 69) return '🌧️';
  if (code <= 79) return '❄️';
  if (code <= 84) return '🌧️';
  if (code <= 94) return '⛈️';
  return '🌩️';
}

export function weatherDesc(code: number): string {
  if (code === 0) return 'Clear sky';
  if (code === 1) return 'Mainly clear';
  if (code === 2) return 'Partly cloudy';
  if (code === 3) return 'Overcast';
  if (code <= 49) return 'Foggy';
  if (code <= 59) return 'Drizzle';
  if (code <= 69) return 'Rain';
  if (code <= 79) return 'Snow';
  if (code <= 84) return 'Rain showers';
  if (code <= 94) return 'Thunderstorm';
  return 'Heavy thunderstorm';
}

/* ── API calls ────────────────────────────────────────────────────────── */

export async function geocodeZip(zip: string): Promise<GeoResult> {
  const url =
    `https://geocoding-api.open-meteo.com/v1/search` +
    `?name=${encodeURIComponent(zip)}&count=1&language=en&format=json`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Geocoding request failed');
  const data = (await res.json()) as { results?: GeoResult[] };
  if (!data.results || data.results.length === 0) {
    throw new Error(`No location found for "${zip}". Please try a city name or valid US zip code.`);
  }
  return data.results[0];
}

export async function fetchForecast(lat: number, lon: number): Promise<ForecastDay[]> {
  const url =
    `https://api.open-meteo.com/v1/forecast` +
    `?latitude=${lat}&longitude=${lon}` +
    `&daily=weathercode,temperature_2m_max,temperature_2m_min,precipitation_sum` +
    `&temperature_unit=fahrenheit&precipitation_unit=inch&timezone=auto&forecast_days=7`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Forecast request failed');
  const data = (await res.json()) as {
    daily: {
      time: string[];
      weathercode: number[];
      temperature_2m_max: number[];
      temperature_2m_min: number[];
      precipitation_sum: number[];
    };
  };
  return data.daily.time.map((date, i) => ({
    date,
    weatherCode: data.daily.weathercode[i],
    tempMax: Math.round(data.daily.temperature_2m_max[i]),
    tempMin: Math.round(data.daily.temperature_2m_min[i]),
    precipitationSum: Math.round(data.daily.precipitation_sum[i] * 100) / 100,
  }));
}

/* ── Component ────────────────────────────────────────────────────────── */

function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

function getDayName(dateStr: string, index: number): string {
  if (index === 0) return 'Today';
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString('en-US', { weekday: 'short' });
}

export function WeatherPage() {
  const [zip, setZip] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [location, setLocation] = useState<GeoResult | null>(null);
  const [forecast, setForecast] = useState<ForecastDay[] | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const query = zip.trim();
    if (!query) return;

    setLoading(true);
    setError(null);
    setLocation(null);
    setForecast(null);

    try {
      const geo = await geocodeZip(query);
      const days = await fetchForecast(geo.latitude, geo.longitude);
      setLocation(geo);
      setForecast(days);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="weather-page">
      <h1>🌦️ Weather Forecast</h1>
      <p className="subtitle">Enter your zip code or city name to get a 7-day forecast.</p>

      <form className="weather-form" onSubmit={handleSubmit} role="search">
        <input
          className="weather-input"
          type="text"
          placeholder="e.g. 90210 or New York"
          value={zip}
          onChange={(e) => setZip(e.target.value)}
          aria-label="Zip code or city name"
          disabled={loading}
        />
        <button className="weather-btn" type="submit" disabled={loading || zip.trim() === ''}>
          {loading ? 'Loading…' : 'Get Forecast'}
        </button>
      </form>

      {error && (
        <p className="weather-error" role="alert">
          {error}
        </p>
      )}
      {loading && (
        <p className="weather-loading" aria-live="polite">
          Fetching forecast…
        </p>
      )}

      {location && forecast && (
        <section aria-label="Forecast results">
          <p className="weather-location">
            📍 {location.name}, {location.admin1}
          </p>
          <p className="weather-location-sub">
            {location.country} · {location.latitude.toFixed(2)}°N, {location.longitude.toFixed(2)}°W
          </p>
          <div className="forecast-grid">
            {forecast.map((day, i) => (
              <div key={day.date} className="forecast-card">
                <span className="forecast-day">{getDayName(day.date, i)}</span>
                <span className="forecast-date">{formatDate(day.date)}</span>
                <span className="forecast-icon" role="img" aria-label={weatherDesc(day.weatherCode)}>
                  {weatherIcon(day.weatherCode)}
                </span>
                <span className="forecast-desc">{weatherDesc(day.weatherCode)}</span>
                <div className="forecast-temps">
                  <span className="forecast-high">{day.tempMax}°</span>
                  <span className="forecast-low">{day.tempMin}°</span>
                </div>
                {day.precipitationSum > 0 && <span className="forecast-precip">💧 {day.precipitationSum}&Prime;</span>}
              </div>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}

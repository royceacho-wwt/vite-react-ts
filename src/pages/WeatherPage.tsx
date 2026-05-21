import './WeatherPage.css';

import { useState } from 'react';

/* ── Types ───────────────────────────────────────────────────────────────── */

interface GeoResult {
  name: string;
  admin1?: string;
  country: string;
  latitude: number;
  longitude: number;
}

interface DayForecast {
  date: string;
  weatherCode: number;
  tempMax: number;
  tempMin: number;
  precipitationSum: number;
  windSpeedMax: number;
}

type ForecastDays = 7 | 14;

/* ── WMO weather code helpers ─────────────────────────────────────────────── */

const WMO_DESCRIPTIONS: Record<number, string> = {
  0: 'Clear sky',
  1: 'Mainly clear',
  2: 'Partly cloudy',
  3: 'Overcast',
  45: 'Foggy',
  48: 'Icy fog',
  51: 'Light drizzle',
  53: 'Moderate drizzle',
  55: 'Dense drizzle',
  61: 'Slight rain',
  63: 'Moderate rain',
  65: 'Heavy rain',
  71: 'Slight snow',
  73: 'Moderate snow',
  75: 'Heavy snow',
  77: 'Snow grains',
  80: 'Slight showers',
  81: 'Moderate showers',
  82: 'Violent showers',
  85: 'Slight snow showers',
  86: 'Heavy snow showers',
  95: 'Thunderstorm',
  96: 'Thunderstorm w/ hail',
  99: 'Thunderstorm w/ heavy hail',
};

const WMO_EMOJI: Record<number, string> = {
  0: '☀️',
  1: '🌤️',
  2: '⛅',
  3: '☁️',
  45: '🌫️',
  48: '🌫️',
  51: '🌦️',
  53: '🌦️',
  55: '🌧️',
  61: '🌧️',
  63: '🌧️',
  65: '🌧️',
  71: '🌨️',
  73: '🌨️',
  75: '❄️',
  77: '❄️',
  80: '🌦️',
  81: '🌧️',
  82: '⛈️',
  85: '🌨️',
  86: '🌨️',
  95: '⛈️',
  96: '⛈️',
  99: '⛈️',
};

function wmoDescription(code: number): string {
  return WMO_DESCRIPTIONS[code] ?? 'Unknown';
}

function wmoEmoji(code: number): string {
  return WMO_EMOJI[code] ?? '🌡️';
}

function formatDate(isoDate: string): string {
  const [year, month, day] = isoDate.split('-').map(Number);
  const d = new Date(year, month - 1, day);
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

/* ── API calls ───────────────────────────────────────────────────────────── */

async function geocodeZip(zip: string): Promise<GeoResult> {
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
    zip
  )}&count=5&language=en&format=json`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Geocoding request failed');
  const data = await res.json();

  if (!data.results || data.results.length === 0) {
    throw new Error(`No location found for ZIP code "${zip}". Please try again.`);
  }

  // Prefer a US result when zip looks numeric
  const isNumericZip = /^\d{5}$/.test(zip.trim());
  const usResult = data.results.find((r: GeoResult & { country_code?: string }) => r.country_code === 'US');
  const best = isNumericZip && usResult ? usResult : data.results[0];
  return best as GeoResult;
}

async function fetchForecast(lat: number, lon: number, days: ForecastDays): Promise<DayForecast[]> {
  const url =
    `https://api.open-meteo.com/v1/forecast` +
    `?latitude=${lat}&longitude=${lon}` +
    `&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,wind_speed_10m_max` +
    `&temperature_unit=fahrenheit&wind_speed_unit=mph&precipitation_unit=inch` +
    `&timezone=auto&forecast_days=${days}`;

  const res = await fetch(url);
  if (!res.ok) throw new Error('Forecast request failed');
  const data = await res.json();

  const { time, weather_code, temperature_2m_max, temperature_2m_min, precipitation_sum, wind_speed_10m_max } =
    data.daily;

  return (time as string[]).map((date: string, i: number) => ({
    date,
    weatherCode: weather_code[i] as number,
    tempMax: Math.round(temperature_2m_max[i] as number),
    tempMin: Math.round(temperature_2m_min[i] as number),
    precipitationSum: (precipitation_sum[i] as number) ?? 0,
    windSpeedMax: Math.round(wind_speed_10m_max[i] as number),
  }));
}

/* ── Component ────────────────────────────────────────────────────────────── */

export function WeatherPage() {
  const [zip, setZip] = useState('');
  const [forecastDays, setForecastDays] = useState<ForecastDays>(7);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [location, setLocation] = useState<GeoResult | null>(null);
  const [forecast, setForecast] = useState<DayForecast[] | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = zip.trim();
    if (!trimmed) return;

    setLoading(true);
    setError(null);
    setForecast(null);
    setLocation(null);

    try {
      const geo = await geocodeZip(trimmed);
      const days = await fetchForecast(geo.latitude, geo.longitude, forecastDays);
      setLocation(geo);
      setForecast(days);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  /** Switch the forecast range and, if a location is already loaded, re-fetch immediately. */
  const handleDaysToggle = async (days: ForecastDays) => {
    setForecastDays(days);

    if (!location) return;

    setLoading(true);
    setError(null);
    setForecast(null);

    try {
      const newForecast = await fetchForecast(location.latitude, location.longitude, days);
      setForecast(newForecast);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const todayForecast = forecast?.[0];

  return (
    <main className="weather-page">
      <h1 className="weather-title">{forecastDays}-Day Weather Forecast</h1>
      <p className="weather-subtitle">Enter a US ZIP code to get the latest forecast.</p>

      <form className="weather-form" onSubmit={handleSubmit} aria-label="Zip code forecast form">
        <label htmlFor="zip-input" className="weather-label">
          ZIP Code
        </label>
        <div className="weather-input-row">
          <input
            id="zip-input"
            className="weather-input"
            type="text"
            value={zip}
            onChange={(e) => setZip(e.target.value)}
            placeholder="e.g. 90210"
            maxLength={10}
            autoComplete="postal-code"
          />
          <button type="submit" className="weather-btn" disabled={loading || !zip.trim()}>
            {loading ? 'Loading…' : 'Get Forecast'}
          </button>
        </div>

        {/* ── Forecast range toggle ── */}
        <div className="weather-toggle" role="group" aria-label="Forecast range">
          <button
            type="button"
            className={`weather-toggle-btn${forecastDays === 7 ? ' weather-toggle-btn--active' : ''}`}
            onClick={() => handleDaysToggle(7)}
            aria-pressed={forecastDays === 7}
          >
            7-Day
          </button>
          <button
            type="button"
            className={`weather-toggle-btn${forecastDays === 14 ? ' weather-toggle-btn--active' : ''}`}
            onClick={() => handleDaysToggle(14)}
            aria-pressed={forecastDays === 14}
          >
            14-Day
          </button>
        </div>
      </form>

      {error && (
        <div className="weather-error" role="alert">
          ⚠️ {error}
        </div>
      )}

      {location && todayForecast && (
        <div className="weather-location">
          <span className="weather-location-emoji">{wmoEmoji(todayForecast.weatherCode)}</span>
          <div>
            <div className="weather-location-name">
              {location.name}
              {location.admin1 ? `, ${location.admin1}` : ''}, {location.country}
            </div>
            <div className="weather-location-coords">
              {location.latitude.toFixed(2)}° N, {Math.abs(location.longitude).toFixed(2)}°{' '}
              {location.longitude < 0 ? 'W' : 'E'}
            </div>
          </div>
        </div>
      )}

      {forecast && (
        <section aria-label={`${forecastDays}-day forecast`} className="weather-forecast">
          {forecast.map((day, idx) => (
            <article key={day.date} className={`weather-card${idx === 0 ? ' weather-card--today' : ''}`}>
              <div className="weather-card-day">{idx === 0 ? 'Today' : formatDate(day.date)}</div>
              <div className="weather-card-emoji" role="img" aria-label={wmoDescription(day.weatherCode)}>
                {wmoEmoji(day.weatherCode)}
              </div>
              <div className="weather-card-desc">{wmoDescription(day.weatherCode)}</div>
              <div className="weather-card-temps">
                <span className="weather-card-high">{day.tempMax}°F</span>
                <span className="weather-card-sep">/</span>
                <span className="weather-card-low">{day.tempMin}°F</span>
              </div>
              <div className="weather-card-details">
                <span title="Precipitation">
                  💧 {day.precipitationSum.toFixed(2)}
                  {'"'}
                </span>
                <span title="Max wind speed">💨 {day.windSpeedMax} mph</span>
              </div>
            </article>
          ))}
        </section>
      )}
    </main>
  );
}

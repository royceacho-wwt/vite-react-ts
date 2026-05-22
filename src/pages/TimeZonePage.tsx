import './TimeZonePage.css';

import { useEffect, useRef, useState } from 'react';

/* ── City definitions ─────────────────────────────────────────────────────── */

interface CityConfig {
  name: string;
  state: string;
  timezone: string;
  emoji: string;
}

const CITIES: CityConfig[] = [
  { name: 'Detroit', state: 'Michigan', timezone: 'America/Detroit', emoji: '🏙️' },
  { name: 'St. Louis', state: 'Missouri', timezone: 'America/Chicago', emoji: '🌉' },
  { name: 'Honolulu', state: 'Hawaii', timezone: 'Pacific/Honolulu', emoji: '🌺' },
];

/* ── Helpers ──────────────────────────────────────────────────────────────── */

function getTimeParts(timezone: string): { time: string; date: string; offset: string } {
  const now = new Date();

  const time = now.toLocaleTimeString('en-US', {
    timeZone: timezone,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });

  const date = now.toLocaleDateString('en-US', {
    timeZone: timezone,
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  // Derive the UTC offset label (e.g. "UTC−5", "UTC−10")
  const offsetMin = -now.getTimezoneOffset(); // minutes, but this is the *local* browser offset
  // Use Intl to get the timezone's *actual* offset at this moment
  const tzDateStr = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    timeZoneName: 'shortOffset',
  }).format(now);
  // Extract the GMT±... part
  const offsetMatch = tzDateStr.match(/GMT([+-]\d+(?::\d+)?)/);
  const offset = offsetMatch ? `UTC${offsetMatch[1]}` : '';

  // Suppress unused variable warning — offsetMin is not needed after refactor
  void offsetMin;

  return { time, date, offset };
}

/* ── SpotlightCard ────────────────────────────────────────────────────────── */

interface SpotlightCardProps {
  children: React.ReactNode;
  className?: string;
}

function SpotlightCard({ children, className = '' }: SpotlightCardProps) {
  const cardRef = useRef<HTMLElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    card.style.setProperty('--mouse-x', `${x}%`);
    card.style.setProperty('--mouse-y', `${y}%`);
  };

  const handleMouseLeave = () => {
    const card = cardRef.current;
    if (!card) return;
    card.style.setProperty('--mouse-x', '50%');
    card.style.setProperty('--mouse-y', '50%');
  };

  return (
    <article
      ref={cardRef}
      className={`tz-card ${className}`.trim()}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ '--mouse-x': '50%', '--mouse-y': '50%' } as React.CSSProperties}
    >
      {children}
    </article>
  );
}

/* ── Clock card ───────────────────────────────────────────────────────────── */

interface ClockCardProps {
  city: CityConfig;
}

function ClockCard({ city }: ClockCardProps) {
  const [parts, setParts] = useState(() => getTimeParts(city.timezone));

  useEffect(() => {
    // Tick every second
    const id = setInterval(() => setParts(getTimeParts(city.timezone)), 1000);
    return () => clearInterval(id);
  }, [city.timezone]);

  const [timePortion, meridiem] = parts.time.split(' ');

  return (
    <SpotlightCard>
      <div className="tz-card-emoji" role="img" aria-label={city.name}>
        {city.emoji}
      </div>
      <div className="tz-card-city">{city.name}</div>
      <div className="tz-card-state">{city.state}</div>
      <div className="tz-card-clock" aria-live="polite" aria-label={`Current time in ${city.name}: ${parts.time}`}>
        <span className="tz-card-time">{timePortion}</span>
        <span className="tz-card-meridiem">{meridiem}</span>
      </div>
      <div className="tz-card-date">{parts.date}</div>
      {parts.offset && <div className="tz-card-offset">{parts.offset}</div>}
    </SpotlightCard>
  );
}

/* ── Page component ───────────────────────────────────────────────────────── */

export function TimeZonePage() {
  return (
    <main className="tz-page">
      <h1 className="tz-title">🕐 Time Zones</h1>
      <p className="tz-subtitle">Live clocks for cities across the United States.</p>

      <section className="tz-grid" aria-label="City clocks">
        {CITIES.map((city) => (
          <ClockCard key={city.timezone} city={city} />
        ))}
      </section>
    </main>
  );
}

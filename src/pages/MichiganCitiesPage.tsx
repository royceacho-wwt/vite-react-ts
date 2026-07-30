import './MichiganCitiesPage.css';

import { useCallback, useEffect, useState } from 'react';

/* ── City data ─────────────────────────────────────────────────────────────── */

interface City {
  id: string;
  name: string;
  /** Position as percentage of the SVG viewBox (0–100) */
  x: number;
  y: number;
  population: number;
  emoji: string;
  facts: [string, string, string];
}

/**
 * Michigan bounding box (Lower + Upper Peninsula combined):
 *   Longitude: -90.42° W (west) to -82.41° W (east)  → span 8.01°
 *   Latitude:   41.70° N (south) to 48.30° N (north)  → span 6.60°
 *
 * SVG viewBox is 100 × 110 (taller than wide to accommodate both peninsulas).
 *
 * x = (lon - (-90.42)) / 8.01 * 100
 * y = (48.30 - lat)    / 6.60 * 100  (then scaled to 110)
 */
const CITIES: City[] = [
  {
    id: 'detroit',
    name: 'Detroit',
    x: 96.5,
    y: 90.5,
    population: 620_376,
    emoji: '🏙️',
    facts: [
      'Detroit is the birthplace of Motown Records, founded by Berry Gordy in 1959, launching legends like Stevie Wonder and Diana Ross.',
      'The city is known as the "Motor City" — Ford, General Motors, and Chrysler (Stellantis) all have deep roots here, shaping the global auto industry.',
      'Detroit\'s Eastern Market is one of the largest historic public market districts in the US, operating continuously since 1891.',
    ],
  },
  {
    id: 'grand-rapids',
    name: 'Grand Rapids',
    x: 38.5,
    y: 83.5,
    population: 198_917,
    emoji: '🍺',
    facts: [
      'Grand Rapids is nicknamed "Beer City USA" — it has more craft breweries per capita than almost any other US city.',
      'The city hosts ArtPrize, one of the world\'s largest and most attended art competitions, drawing hundreds of thousands of visitors each fall.',
      'Grand Rapids was home to President Gerald R. Ford, the 38th US President, whose presidential museum sits on the Grand River.',
    ],
  },
  {
    id: 'warren',
    name: 'Warren',
    x: 94.5,
    y: 87.5,
    population: 138_247,
    emoji: '🔧',
    facts: [
      'Warren is home to the US Army\'s Tank-Automotive and Armaments Command (TACOM), one of the largest military installations in Michigan.',
      'The city hosts the General Motors Technical Center, a landmark campus designed by renowned architect Eero Saarinen, opened in 1956.',
      'Warren is the third-largest city in Michigan and one of the most densely populated cities in the Midwest.',
    ],
  },
  {
    id: 'sterling-heights',
    name: 'Sterling Heights',
    x: 96.0,
    y: 85.5,
    population: 134_346,
    emoji: '🌳',
    facts: [
      'Sterling Heights is consistently ranked among the safest large cities in the United States.',
      'The city is home to the Chrysler (Stellantis) Sterling Heights Assembly Plant, one of the most productive auto plants in North America.',
      'Sterling Heights hosts the Freedom Festival, one of Michigan\'s largest annual community celebrations, drawing tens of thousands each summer.',
    ],
  },
  {
    id: 'ann-arbor',
    name: 'Ann Arbor',
    x: 82.5,
    y: 88.5,
    population: 123_851,
    emoji: '🎓',
    facts: [
      'Ann Arbor is home to the University of Michigan, founded in 1817, whose football stadium "The Big House" is the largest stadium in the US with over 107,000 seats.',
      'The city has more bookstores and coffee shops per capita than almost any other US city, earning it a reputation as one of America\'s most intellectual towns.',
      'Ann Arbor\'s Hash Bash, held annually on the first Saturday of April, has been a fixture since 1972 and helped shape Michigan\'s cannabis policy.',
    ],
  },
];

/* ── Michigan SVG path ─────────────────────────────────────────────────────── */

/**
 * Simplified outlines for Michigan's Lower and Upper Peninsulas.
 * Coordinates are in the same 100×110 viewBox space as the city dots.
 */
const LOWER_PENINSULA =
  'M 97,92 L 99,89 L 100,85 L 99,80 L 97,76 L 95,74 L 94,70 L 93,65 ' +
  'L 91,60 L 90,55 L 89,50 L 88,46 L 87,42 L 86,38 L 85,34 L 84,30 ' +
  'L 82,27 L 80,25 L 77,24 L 74,24 L 71,25 L 68,27 L 65,30 L 62,33 ' +
  'L 59,35 L 56,36 L 53,36 L 50,35 L 47,33 L 44,31 L 41,30 L 38,30 ' +
  'L 35,31 L 32,33 L 30,36 L 29,40 L 29,44 L 30,48 L 32,52 L 34,56 ' +
  'L 35,60 L 35,64 L 34,68 L 33,72 L 33,76 L 34,80 L 36,83 L 39,85 ' +
  'L 43,86 L 47,86 L 51,85 L 55,83 L 59,82 L 63,82 L 67,83 L 71,85 ' +
  'L 75,87 L 79,89 L 83,90 L 87,91 L 91,92 L 94,93 L 97,92 Z';

const UPPER_PENINSULA =
  'M 29,44 L 26,42 L 22,40 L 18,39 L 14,39 L 10,40 L 7,42 L 5,45 ' +
  'L 4,49 L 5,53 L 7,56 L 10,58 L 14,59 L 18,59 L 22,58 L 26,56 ' +
  'L 29,53 L 30,49 L 29,44 Z';

/* ── Component ─────────────────────────────────────────────────────────────── */

export function MichiganCitiesPage() {
  const [activeCity, setActiveCity] = useState<City | null>(null);

  const handleCityClick = useCallback((city: City) => {
    setActiveCity((prev) => (prev?.id === city.id ? null : city));
  }, []);

  const handleClosePopup = useCallback(() => {
    setActiveCity(null);
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, city: City) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleCityClick(city);
      }
    },
    [handleCityClick]
  );

  // Close popup on Escape key
  useEffect(() => {
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setActiveCity(null);
    };
    window.addEventListener('keyup', onKeyUp);
    return () => window.removeEventListener('keyup', onKeyUp);
  }, []);

  return (
    <main className="mi-map-page">
      <h1 className="mi-map-title">🏞️ Michigan Cities Map</h1>
      <p className="mi-map-subtitle">Click a city dot to discover fun facts about it.</p>

      <div className="mi-map-container" role="region" aria-label="Interactive map of Michigan cities">
        <svg
          className="mi-map-svg"
          viewBox="0 0 100 110"
          xmlns="http://www.w3.org/2000/svg"
          aria-label="Map of Michigan"
          role="img"
        >
          {/* Great Lakes water background hint */}
          <rect className="mi-map-water" x="0" y="0" width="100" height="110" rx="1" />

          {/* Lower Peninsula */}
          <path className="mi-map-state" d={LOWER_PENINSULA} />

          {/* Upper Peninsula */}
          <path className="mi-map-state" d={UPPER_PENINSULA} />

          {/* Straits of Mackinac label */}
          <text className="mi-map-water-label" x="50" y="43" textAnchor="middle">
            Lake Michigan
          </text>
          <text className="mi-map-water-label" x="88" y="60" textAnchor="middle">
            Lake Huron
          </text>

          {/* City dots */}
          {CITIES.map((city) => {
            const isActive = activeCity?.id === city.id;
            return (
              <g
                key={city.id}
                className={`mi-map-city-group${isActive ? ' mi-map-city-group--active' : ''}`}
                onClick={() => handleCityClick(city)}
                onKeyDown={(e) => handleKeyDown(e, city)}
                tabIndex={0}
                role="button"
                aria-label={`${city.name} — click for fun facts`}
                aria-pressed={isActive}
              >
                <circle className="mi-map-city-dot" cx={city.x} cy={city.y} r="1.8" />
                <circle className="mi-map-city-pulse" cx={city.x} cy={city.y} r="1.8" />
                <text
                  className="mi-map-city-label"
                  x={city.x}
                  y={city.y - 2.8}
                  textAnchor={city.x > 70 ? 'end' : 'middle'}
                >
                  {city.name}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Popup */}
        {activeCity && (
          <div
            className="mi-map-popup"
            role="dialog"
            aria-modal="false"
            aria-label={`Fun facts about ${activeCity.name}`}
          >
            <div className="mi-map-popup-header">
              <h2 className="mi-map-popup-title">
                {activeCity.emoji} {activeCity.name}
              </h2>
              <button
                className="mi-map-popup-close"
                onClick={handleClosePopup}
                aria-label={`Close ${activeCity.name} popup`}
              >
                ✕
              </button>
            </div>
            <p className="mi-map-popup-population">
              Population: {activeCity.population.toLocaleString()}
            </p>
            <ul className="mi-map-popup-facts" aria-label="Fun facts">
              {activeCity.facts.map((fact, i) => (
                <li key={i} className="mi-map-popup-fact">
                  <span className="mi-map-popup-fact-number" aria-hidden="true">
                    {i + 1}
                  </span>
                  <span className="mi-map-popup-fact-text">{fact}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* City legend */}
      <div className="mi-map-legend">
        <h2 className="mi-map-legend-title">Top 5 Cities by Population</h2>
        <ol className="mi-map-legend-list" aria-label="City list">
          {[...CITIES]
            .sort((a, b) => b.population - a.population)
            .map((city) => (
              <li
                key={city.id}
                className={`mi-map-legend-item${activeCity?.id === city.id ? ' mi-map-legend-item--active' : ''}`}
              >
                <button
                  className="mi-map-legend-btn"
                  onClick={() => handleCityClick(city)}
                  aria-pressed={activeCity?.id === city.id}
                >
                  <span className="mi-map-legend-emoji" aria-hidden="true">
                    {city.emoji}
                  </span>
                  <span className="mi-map-legend-name">{city.name}</span>
                  <span className="mi-map-legend-pop">{city.population.toLocaleString()}</span>
                </button>
              </li>
            ))}
        </ol>
      </div>
    </main>
  );
}

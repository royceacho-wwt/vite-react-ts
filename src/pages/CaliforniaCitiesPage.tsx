import './CaliforniaCitiesPage.css';

import { useCallback, useState } from 'react';

/* ── City data ─────────────────────────────────────────────────────────────── */

interface City {
  id: string;
  name: string;
  /** Position in SVG coordinates */
  x: number;
  y: number;
  population: number;
  facts: [string, string, string];
}

/**
 * California bounding box (approximate):
 *   Longitude: -124.48° W (west) to -114.13° W (east)
 *   Latitude:   32.53° N (south) to  42.01° N (north)
 *
 * The SVG viewBox is 0 0 200 280 to match California's elongated shape.
 * City coordinates are mapped based on their actual lat/lon positions.
 */
const CITIES: City[] = [
  {
    id: 'los-angeles',
    name: 'Los Angeles',
    x: 78,
    y: 210,
    population: 3_898_747,
    facts: [
      'Los Angeles has more museums per capita than any other city in the world — over 841 museums and galleries.',
      'The Hollywood sign was originally "Hollywoodland" and was built in 1923 as a real estate advertisement.',
      'LA is the only North American city to host the Summer Olympics twice (1932 and 1984), with a third coming in 2028.',
    ],
  },
  {
    id: 'san-diego',
    name: 'San Diego',
    x: 95,
    y: 252,
    population: 1_386_932,
    facts: [
      'San Diego Zoo was the first zoo to create open-air, cageless exhibits that recreate natural habitats.',
      'The city enjoys an average of 266 sunny days per year, earning it the nickname "America\'s Finest City."',
      'San Diego is home to the largest naval fleet in the world, with over 50 ships stationed there.',
    ],
  },
  {
    id: 'san-jose',
    name: 'San Jose',
    x: 48,
    y: 128,
    population: 1_013_240,
    facts: [
      'San Jose is the unofficial capital of Silicon Valley, home to tech giants like Apple, Google, and Adobe.',
      'The Winchester Mystery House has 160 rooms and was continuously built for 38 years to confuse ghosts.',
      'San Jose has more patents per capita than any other US city, reflecting its tech innovation culture.',
    ],
  },
  {
    id: 'san-francisco',
    name: 'San Francisco',
    x: 35,
    y: 112,
    population: 873_965,
    facts: [
      'The Golden Gate Bridge\'s iconic "International Orange" color was chosen to enhance visibility in fog.',
      "San Francisco's cable cars are the only mobile National Historic Landmark in the United States.",
      'The fortune cookie was actually invented in San Francisco, not China, by Japanese immigrant Makoto Hagiwara.',
    ],
  },
  {
    id: 'fresno',
    name: 'Fresno',
    x: 75,
    y: 145,
    population: 542_107,
    facts: [
      'Fresno produces more agricultural products than any other county in the US — over $7 billion annually.',
      'The city is home to the Forestiere Underground Gardens, hand-carved tunnels spanning 10 acres.',
      "Fresno's raisin industry produces nearly half of the world's raisin supply.",
    ],
  },
];

/* ── SVG map dimensions ────────────────────────────────────────────────────── */

const VIEW_BOX = '0 0 200 280';

/* ── Realistic California outline path ─────────────────────────────────────── */
// This path represents California's actual geographic shape:
// - Straight northern border with Oregon (top)
// - Diagonal eastern border with Nevada (upper right going down)
// - Angled southeastern border with Arizona (lower right)
// - Straight southern border with Mexico (bottom)
// - Jagged Pacific coastline on the west with SF Bay indentation
const CALIFORNIA_PATH = `
  M 25 15
  L 160 15
  L 165 20
  L 170 30
  L 175 45
  L 178 65
  L 180 90
  L 180 115
  L 178 140
  L 175 165
  L 170 185
  L 165 200
  L 162 210
  L 165 215
  L 180 215
  L 180 260
  L 85 260
  L 82 252
  L 78 242
  L 72 230
  L 65 218
  L 55 205
  L 45 190
  L 38 175
  L 32 160
  L 28 145
  L 25 132
  L 24 122
  L 28 115
  L 35 110
  L 40 108
  L 38 102
  L 32 98
  L 25 92
  L 20 82
  L 18 70
  L 18 55
  L 20 40
  L 22 28
  L 25 15
  Z
`;

/* ── Component ─────────────────────────────────────────────────────────────── */

export function CaliforniaCitiesPage() {
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

  return (
    <main className="ca-map-page">
      <h1 className="ca-map-title">🌴 California Cities Map</h1>
      <p className="ca-map-subtitle">Click a city dot to discover fun facts about it.</p>

      <div className="ca-map-container" role="region" aria-label="Interactive map of California cities">
        <svg
          className="ca-map-svg"
          viewBox={VIEW_BOX}
          xmlns="http://www.w3.org/2000/svg"
          aria-label="Map of California"
          role="img"
        >
          {/* California state outline - realistic shape */}
          <path className="ca-map-state" d={CALIFORNIA_PATH} />

          {/* Pacific Ocean label */}
          <text className="ca-map-ocean-label" x="8" y="180" transform="rotate(-90, 8, 180)">
            Pacific Ocean
          </text>

          {/* City dots */}
          {CITIES.map((city) => {
            const isActive = activeCity?.id === city.id;
            return (
              <g
                key={city.id}
                className={`ca-map-city-group${isActive ? ' ca-map-city-group--active' : ''}`}
                onClick={() => handleCityClick(city)}
                onKeyDown={(e) => handleKeyDown(e, city)}
                tabIndex={0}
                role="button"
                aria-label={`${city.name} — click for fun facts`}
                aria-pressed={isActive}
                data-testid={`city-${city.id}`}
              >
                <circle className="ca-map-city-dot" cx={city.x} cy={city.y} r="5" />
                <circle className="ca-map-city-pulse" cx={city.x} cy={city.y} r="5" />
                <text className="ca-map-city-label" x={city.x} y={city.y - 8} textAnchor="middle">
                  {city.name}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Popup */}
        {activeCity && (
          <div
            className="ca-map-popup"
            role="dialog"
            aria-modal="false"
            aria-label={`Fun facts about ${activeCity.name}`}
            data-testid="city-popup"
          >
            <div className="ca-map-popup-header">
              <h2 className="ca-map-popup-title">{activeCity.name}</h2>
              <button
                className="ca-map-popup-close"
                onClick={handleClosePopup}
                aria-label="Close popup"
                data-testid="close-popup"
              >
                ✕
              </button>
            </div>
            <p className="ca-map-popup-population">Population: {activeCity.population.toLocaleString()}</p>
            <ul className="ca-map-popup-facts">
              {activeCity.facts.map((fact, idx) => (
                <li key={idx} className="ca-map-popup-fact">
                  <span className="ca-map-popup-fact-number">{idx + 1}</span>
                  <span className="ca-map-popup-fact-text">{fact}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Legend / City list */}
      <section className="ca-map-legend">
        <h2 className="ca-map-legend-title">Top 5 California Cities by Population</h2>
        <ul className="ca-map-legend-list">
          {CITIES.map((city) => {
            const isActive = activeCity?.id === city.id;
            return (
              <li key={city.id} className={`ca-map-legend-item${isActive ? ' ca-map-legend-item--active' : ''}`}>
                <button
                  className="ca-map-legend-btn"
                  onClick={() => handleCityClick(city)}
                  aria-pressed={isActive}
                  data-testid={`legend-${city.id}`}
                >
                  <span className="ca-map-legend-dot" />
                  <span className="ca-map-legend-name">{city.name}</span>
                  <span className="ca-map-legend-pop">{city.population.toLocaleString()}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </section>
    </main>
  );
}

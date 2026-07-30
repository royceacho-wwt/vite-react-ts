import './CaliforniaCitiesPage.css';

import { useCallback, useState } from 'react';

/* ── City data ─────────────────────────────────────────────────────────────── */

interface City {
  id: string;
  name: string;
  /** Approximate position as percentage of the SVG viewBox (0–100) */
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
 * Conversion to SVG percentage:
 *   x = (lon - (-124.48)) / ((-114.13) - (-124.48)) * 100
 *   y = (42.01 - lat)      / (42.01 - 32.53)        * 100
 */
const CITIES: City[] = [
  {
    id: 'los-angeles',
    name: 'Los Angeles',
    x: 42.5,
    y: 64.5,
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
    x: 48.5,
    y: 78.5,
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
    x: 30.5,
    y: 48.5,
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
    x: 25.5,
    y: 42.5,
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
    x: 40.5,
    y: 47.5,
    population: 542_107,
    facts: [
      'Fresno produces more agricultural products than any other county in the US — over $7 billion annually.',
      'The city is home to the Forestiere Underground Gardens, hand-carved tunnels spanning 10 acres.',
      "Fresno's raisin industry produces nearly half of the world's raisin supply.",
    ],
  },
];

/* ── SVG map dimensions ────────────────────────────────────────────────────── */

const VIEW_BOX = '0 0 100 120';

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
          {/* California state outline - simplified shape */}
          <path
            className="ca-map-state"
            d="M 15 5 
               L 75 5 
               L 78 8 
               L 80 15 
               L 78 25 
               L 72 35 
               L 65 45 
               L 58 55 
               L 55 65 
               L 52 75 
               L 50 85 
               L 55 95 
               L 60 100 
               L 55 105 
               L 45 108 
               L 35 105 
               L 30 95 
               L 25 85 
               L 22 75 
               L 20 65 
               L 18 55 
               L 15 45 
               L 12 35 
               L 10 25 
               L 8 15 
               L 10 8 
               Z"
          />

          {/* Pacific Ocean waves decoration */}
          <g className="ca-map-waves">
            <path d="M 5 50 Q 8 48 11 50 Q 14 52 17 50" />
            <path d="M 3 60 Q 6 58 9 60 Q 12 62 15 60" />
            <path d="M 6 70 Q 9 68 12 70 Q 15 72 18 70" />
            <path d="M 8 80 Q 11 78 14 80 Q 17 82 20 80" />
          </g>

          {/* Mountain range decoration (Sierra Nevada) */}
          <polyline className="ca-map-mountains" points="55,20 60,12 65,18 70,8 75,15 78,10" />
          <polyline className="ca-map-mountains" points="50,35 55,28 60,33 65,25 70,30" />

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
                <circle className="ca-map-city-dot" cx={city.x} cy={city.y} r="2.2" />
                <circle className="ca-map-city-pulse" cx={city.x} cy={city.y} r="2.2" />
                <text className="ca-map-city-label" x={city.x} y={city.y - 3.5} textAnchor="middle">
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

import './ColoradoCitiesPage.css';

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
 * Colorado bounding box (approximate):
 *   Longitude: -109.06° W (west) to -102.04° W (east)
 *   Latitude:   37.00° N (south) to  41.00° N (north)
 *
 * Conversion to SVG percentage:
 *   x = (lon - (-109.06)) / ((-102.04) - (-109.06)) * 100
 *   y = (41.00 - lat)      / (41.00 - 37.00)        * 100
 */
const CITIES: City[] = [
  {
    id: 'denver',
    name: 'Denver',
    x: 50.4,
    y: 25.0,
    population: 715_522,
    facts: [
      'Denver sits at exactly 5,280 feet above sea level — earning it the nickname "The Mile High City."',
      'The city receives about 300 days of sunshine per year, more than Miami or San Diego.',
      'Denver is home to the largest city park system in the US, with over 14,000 acres of parkland.',
    ],
  },
  {
    id: 'colorado-springs',
    name: 'Colorado Springs',
    x: 50.8,
    y: 42.5,
    population: 478_961,
    facts: [
      'Colorado Springs is home to Pikes Peak, the inspiration for the song "America the Beautiful."',
      'The US Air Force Academy is located here, admitting its first class in 1955.',
      'Garden of the Gods, a National Natural Landmark, features stunning red rock formations up to 300 feet tall.',
    ],
  },
  {
    id: 'aurora',
    name: 'Aurora',
    x: 53.5,
    y: 24.5,
    population: 366_623,
    facts: [
      'Aurora is the third-largest city in Colorado and spans three counties: Arapahoe, Adams, and Douglas.',
      'The city hosts the Aurora Reservoir, a popular spot for sailing, fishing, and swimming.',
      'Aurora has one of the most diverse populations in Colorado, with residents speaking over 100 languages.',
    ],
  },
  {
    id: 'fort-collins',
    name: 'Fort Collins',
    x: 47.5,
    y: 5.0,
    population: 164_952,
    facts: [
      'Fort Collins is home to Colorado State University, founded in 1870 as the Colorado Agricultural College.',
      "The city's historic Old Town district inspired the design of Disneyland's Main Street, U.S.A.",
      'Fort Collins has more than 20 craft breweries, earning it the nickname "The Napa Valley of Beer."',
    ],
  },
  {
    id: 'lakewood',
    name: 'Lakewood',
    x: 47.8,
    y: 25.5,
    population: 155_984,
    facts: [
      'Lakewood is the fifth-largest city in Colorado and is part of the Denver metropolitan area.',
      'The city is home to the Colorado Mills mall, one of the largest outlet malls in the state.',
      "Lakewood's Belmar neighborhood was built on the site of the former Villa Italia mall, a pioneering urban redevelopment project.",
    ],
  },
  {
    id: 'thornton',
    name: 'Thornton',
    x: 50.5,
    y: 18.5,
    population: 136_208,
    facts: [
      'Thornton was incorporated in 1956 and named after Dan Thornton, the 34th Governor of Colorado.',
      'The city sits along the South Platte River and has extensive trail systems connecting to Denver.',
      'Thornton is one of the fastest-growing cities in Colorado, nearly doubling its population since 2000.',
    ],
  },
  {
    id: 'arvada',
    name: 'Arvada',
    x: 46.5,
    y: 22.5,
    population: 118_428,
    facts: [
      'Arvada was founded in 1870 and is one of the oldest communities in the Denver metro area.',
      "The city's Olde Town Arvada district features historic buildings dating back to the late 1800s.",
      'Arvada is known as the "Celery Capital of the World" due to its early agricultural history growing celery.',
    ],
  },
  {
    id: 'westminster',
    name: 'Westminster',
    x: 47.2,
    y: 20.0,
    population: 113_479,
    facts: [
      'Westminster straddles the border between Adams and Jefferson counties, and sits between Denver and Boulder.',
      'The city is home to the Butterfly Pavilion, one of the first standalone insect zoos in the US.',
      "Westminster's Standley Lake Regional Park is a 3,000-acre wildlife refuge and reservoir.",
    ],
  },
  {
    id: 'pueblo',
    name: 'Pueblo',
    x: 51.5,
    y: 62.5,
    population: 111_127,
    facts: [
      'Pueblo is known as the "Steel City" — it was once home to the largest steel plant west of the Mississippi.',
      'The city has produced more Congressional Medal of Honor recipients per capita than any other US city.',
      "Pueblo's Chile & Frijoles Festival celebrates the famous Pueblo chile pepper, a local culinary staple.",
    ],
  },
  {
    id: 'centennial',
    name: 'Centennial',
    x: 52.0,
    y: 29.5,
    population: 108_418,
    facts: [
      'Centennial was incorporated in 2001, making it one of the newest cities in Colorado.',
      "It was named to honor Colorado's centennial of statehood in 1876.",
      'Centennial is consistently ranked among the safest and most livable cities in the United States.',
    ],
  },
];

/* ── SVG map dimensions ────────────────────────────────────────────────────── */

const VIEW_BOX = '0 0 100 75';

/* ── Component ─────────────────────────────────────────────────────────────── */

export function ColoradoCitiesPage() {
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
    <main className="co-map-page">
      <h1 className="co-map-title">🏔️ Colorado Cities Map</h1>
      <p className="co-map-subtitle">Click a city dot to discover fun facts about it.</p>

      <div className="co-map-container" role="region" aria-label="Interactive map of Colorado cities">
        <svg
          className="co-map-svg"
          viewBox={VIEW_BOX}
          xmlns="http://www.w3.org/2000/svg"
          aria-label="Map of Colorado"
          role="img"
        >
          {/* Colorado state outline */}
          <rect className="co-map-state" x="1" y="1" width="98" height="73" rx="0.5" ry="0.5" />

          {/* Mountain range decoration */}
          <polyline
            className="co-map-mountains"
            points="15,55 22,38 28,48 35,28 42,42 48,22 55,35 62,18 68,32 74,20 80,34 86,24 92,38"
          />

          {/* City dots */}
          {CITIES.map((city) => {
            const isActive = activeCity?.id === city.id;
            return (
              <g
                key={city.id}
                className={`co-map-city-group${isActive ? ' co-map-city-group--active' : ''}`}
                onClick={() => handleCityClick(city)}
                onKeyDown={(e) => handleKeyDown(e, city)}
                tabIndex={0}
                role="button"
                aria-label={`${city.name} — click for fun facts`}
                aria-pressed={isActive}
              >
                <circle className="co-map-city-dot" cx={city.x} cy={city.y} r="1.8" />
                <circle className="co-map-city-pulse" cx={city.x} cy={city.y} r="1.8" />
                <text className="co-map-city-label" x={city.x} y={city.y - 2.8} textAnchor="middle">
                  {city.name}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Popup */}
        {activeCity && (
          <div
            className="co-map-popup"
            role="dialog"
            aria-modal="false"
            aria-label={`Fun facts about ${activeCity.name}`}
          >
            <div className="co-map-popup-header">
              <h2 className="co-map-popup-title">📍 {activeCity.name}</h2>
              <button
                className="co-map-popup-close"
                onClick={handleClosePopup}
                aria-label={`Close ${activeCity.name} popup`}
              >
                ✕
              </button>
            </div>
            <p className="co-map-popup-population">Population: {activeCity.population.toLocaleString()}</p>
            <ul className="co-map-popup-facts" aria-label="Fun facts">
              {activeCity.facts.map((fact, i) => (
                <li key={i} className="co-map-popup-fact">
                  <span className="co-map-popup-fact-number" aria-hidden="true">
                    {i + 1}
                  </span>
                  <span className="co-map-popup-fact-text">{fact}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* City legend */}
      <div className="co-map-legend">
        <h2 className="co-map-legend-title">Top 10 Cities by Population</h2>
        <ol className="co-map-legend-list" aria-label="City list">
          {[...CITIES]
            .sort((a, b) => b.population - a.population)
            .map((city) => (
              <li
                key={city.id}
                className={`co-map-legend-item${activeCity?.id === city.id ? ' co-map-legend-item--active' : ''}`}
              >
                <button
                  className="co-map-legend-btn"
                  onClick={() => handleCityClick(city)}
                  aria-pressed={activeCity?.id === city.id}
                >
                  <span className="co-map-legend-dot" aria-hidden="true" />
                  <span className="co-map-legend-name">{city.name}</span>
                  <span className="co-map-legend-pop">{city.population.toLocaleString()}</span>
                </button>
              </li>
            ))}
        </ol>
      </div>
    </main>
  );
}

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { WeatherPage } from '@/pages/WeatherPage';

/* ── Mock fetch ──────────────────────────────────────────────────────────── */

const mockGeoResponse = {
  results: [
    {
      name: 'Beverly Hills',
      admin1: 'California',
      country: 'United States',
      country_code: 'US',
      latitude: 34.07,
      longitude: -118.4,
    },
  ],
};

function makeForecastResponse(days: number) {
  const time = Array.from({ length: days }, (_, i) => {
    const d = new Date(2024, 0, 1 + i);
    return d.toISOString().split('T')[0];
  });
  return {
    daily: {
      time,
      weather_code: Array(days).fill(0),
      temperature_2m_max: Array(days).fill(72),
      temperature_2m_min: Array(days).fill(55),
      precipitation_sum: Array(days).fill(0),
      wind_speed_10m_max: Array(days).fill(10),
    },
  };
}

const mockForecastResponse7 = makeForecastResponse(7);
const mockForecastResponse14 = makeForecastResponse(14);

describe('WeatherPage', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn((url: string) => {
        if ((url as string).includes('geocoding-api')) {
          return Promise.resolve({ ok: true, json: () => Promise.resolve(mockGeoResponse) });
        }
        // Default to 7-day response; tests that need 14-day override this
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockForecastResponse7) });
      })
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders the page title with 7-day by default', () => {
    render(<WeatherPage />);
    expect(screen.getByText(/7-Day Weather Forecast/i)).toBeDefined();
  });

  it('renders the zip code input', () => {
    render(<WeatherPage />);
    expect(screen.getByRole('textbox')).toBeDefined();
  });

  it('renders the Get Forecast button', () => {
    render(<WeatherPage />);
    expect(screen.getByRole('button', { name: /get forecast/i })).toBeDefined();
  });

  it('renders the forecast range toggle buttons', () => {
    render(<WeatherPage />);
    expect(screen.getByRole('button', { name: /7-day/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /14-day/i })).toBeDefined();
  });

  it('7-Day toggle button is active by default', () => {
    render(<WeatherPage />);
    const btn7 = screen.getByRole('button', { name: /7-day/i }) as HTMLButtonElement;
    expect(btn7.getAttribute('aria-pressed')).toBe('true');
    const btn14 = screen.getByRole('button', { name: /14-day/i }) as HTMLButtonElement;
    expect(btn14.getAttribute('aria-pressed')).toBe('false');
  });

  it('clicking 14-Day updates the title and toggles aria-pressed', () => {
    render(<WeatherPage />);
    fireEvent.click(screen.getByRole('button', { name: /14-day/i }));
    expect(screen.getByText(/14-Day Weather Forecast/i)).toBeDefined();
    expect((screen.getByRole('button', { name: /14-day/i }) as HTMLButtonElement).getAttribute('aria-pressed')).toBe(
      'true'
    );
    expect((screen.getByRole('button', { name: /7-day/i }) as HTMLButtonElement).getAttribute('aria-pressed')).toBe(
      'false'
    );
  });

  it('button is disabled when input is empty', () => {
    render(<WeatherPage />);
    const btn = screen.getByRole('button', { name: /get forecast/i }) as HTMLButtonElement;
    expect(btn.disabled).toBe(true);
  });

  it('button is enabled when user types a zip', () => {
    render(<WeatherPage />);
    fireEvent.change(screen.getByRole('textbox'), { target: { value: '90210' } });
    const btn = screen.getByRole('button', { name: /get forecast/i }) as HTMLButtonElement;
    expect(btn.disabled).toBe(false);
  });

  it('shows location name and 7 forecast cards after a successful 7-day search', async () => {
    render(<WeatherPage />);
    fireEvent.change(screen.getByRole('textbox'), { target: { value: '90210' } });
    fireEvent.click(screen.getByRole('button', { name: /get forecast/i }));

    await waitFor(() => {
      expect(screen.getByText(/Beverly Hills/i)).toBeDefined();
    });

    const cards = screen.getAllByRole('article');
    expect(cards.length).toBe(7);
  });

  it('shows 14 forecast cards after a successful 14-day search', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn((url: string) => {
        if ((url as string).includes('geocoding-api')) {
          return Promise.resolve({ ok: true, json: () => Promise.resolve(mockGeoResponse) });
        }
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockForecastResponse14) });
      })
    );

    render(<WeatherPage />);
    // Switch to 14-day before searching
    fireEvent.click(screen.getByRole('button', { name: /14-day/i }));
    fireEvent.change(screen.getByRole('textbox'), { target: { value: '90210' } });
    fireEvent.click(screen.getByRole('button', { name: /get forecast/i }));

    await waitFor(() => {
      expect(screen.getByText(/Beverly Hills/i)).toBeDefined();
    });

    const cards = screen.getAllByRole('article');
    expect(cards.length).toBe(14);
  });

  it('re-fetches with 14 days when toggle is clicked after a result is already shown', async () => {
    // First fetch returns 7 days, second returns 14 days
    let callCount = 0;
    vi.stubGlobal(
      'fetch',
      vi.fn((url: string) => {
        if ((url as string).includes('geocoding-api')) {
          return Promise.resolve({ ok: true, json: () => Promise.resolve(mockGeoResponse) });
        }
        callCount += 1;
        const payload = callCount === 1 ? mockForecastResponse7 : mockForecastResponse14;
        return Promise.resolve({ ok: true, json: () => Promise.resolve(payload) });
      })
    );

    render(<WeatherPage />);
    fireEvent.change(screen.getByRole('textbox'), { target: { value: '90210' } });
    fireEvent.click(screen.getByRole('button', { name: /get forecast/i }));

    await waitFor(() => expect(screen.getAllByRole('article').length).toBe(7));

    // Now switch to 14-day — should trigger an automatic re-fetch
    fireEvent.click(screen.getByRole('button', { name: /14-day/i }));

    await waitFor(() => expect(screen.getAllByRole('article').length).toBe(14));
  });

  it('passes forecast_days=14 in the API URL when 14-day is selected', async () => {
    const fetchMock = vi.fn((url: string) => {
      if ((url as string).includes('geocoding-api')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockGeoResponse) });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve(mockForecastResponse14) });
    });
    vi.stubGlobal('fetch', fetchMock);

    render(<WeatherPage />);
    fireEvent.click(screen.getByRole('button', { name: /14-day/i }));
    fireEvent.change(screen.getByRole('textbox'), { target: { value: '90210' } });
    fireEvent.click(screen.getByRole('button', { name: /get forecast/i }));

    await waitFor(() => expect(screen.getAllByRole('article').length).toBe(14));

    const forecastCall = fetchMock.mock.calls.find(([url]) => (url as string).includes('open-meteo.com/v1/forecast'));
    expect(forecastCall).toBeDefined();
    // Use index access via Array.from to avoid non-null assertion lint warning
    const calledUrl = Array.from(forecastCall ?? [])[0] as string;
    expect(calledUrl).toContain('forecast_days=14');
  });

  it('shows "Today" label on the first card', async () => {
    render(<WeatherPage />);
    fireEvent.change(screen.getByRole('textbox'), { target: { value: '90210' } });
    fireEvent.click(screen.getByRole('button', { name: /get forecast/i }));

    await waitFor(() => {
      expect(screen.getByText('Today')).toBeDefined();
    });
  });

  it('shows an error when geocoding returns no results', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve({ ok: true, json: () => Promise.resolve({ results: [] }) }))
    );

    render(<WeatherPage />);
    fireEvent.change(screen.getByRole('textbox'), { target: { value: '00000' } });
    fireEvent.click(screen.getByRole('button', { name: /get forecast/i }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeDefined();
    });
  });

  it('shows an error when fetch fails', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve({ ok: false, json: () => Promise.resolve({}) }))
    );

    render(<WeatherPage />);
    fireEvent.change(screen.getByRole('textbox'), { target: { value: '90210' } });
    fireEvent.click(screen.getByRole('button', { name: /get forecast/i }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeDefined();
    });
  });
});

/* ── SpotlightCard interaction tests ─────────────────────────────────────── */

describe('SpotlightCard spotlight effect', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn((url: string) => {
        if ((url as string).includes('geocoding-api')) {
          return Promise.resolve({ ok: true, json: () => Promise.resolve(mockGeoResponse) });
        }
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockForecastResponse7) });
      })
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  async function renderWithForecast() {
    render(<WeatherPage />);
    fireEvent.change(screen.getByRole('textbox'), { target: { value: '90210' } });
    fireEvent.click(screen.getByRole('button', { name: /get forecast/i }));
    await waitFor(() => expect(screen.getAllByRole('article').length).toBe(7));
    return screen.getAllByRole('article');
  }

  it('each forecast card is rendered as an <article> element', async () => {
    const view = await renderWithForecast();
    expect(view.length).toBe(7);
    view.forEach((card) => expect(card.tagName).toBe('ARTICLE'));
  });

  it('cards initialise with --mouse-x and --mouse-y CSS custom properties set to 50%', async () => {
    const view = await renderWithForecast();
    const first = view[0] as HTMLElement;
    expect(first.style.getPropertyValue('--mouse-x')).toBe('50%');
    expect(first.style.getPropertyValue('--mouse-y')).toBe('50%');
  });

  it('mousemove on a card updates --mouse-x and --mouse-y', async () => {
    const view = await renderWithForecast();
    const card = view[1] as HTMLElement;

    // Fake getBoundingClientRect so relative calculations work in jsdom
    vi.spyOn(card, 'getBoundingClientRect').mockReturnValue({
      left: 0,
      top: 0,
      width: 200,
      height: 200,
      right: 200,
      bottom: 200,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    });

    fireEvent.mouseMove(card, { clientX: 100, clientY: 50 });

    expect(card.style.getPropertyValue('--mouse-x')).toBe('50%');
    expect(card.style.getPropertyValue('--mouse-y')).toBe('25%');
  });

  it('mouseleave resets --mouse-x and --mouse-y to 50%', async () => {
    const view = await renderWithForecast();
    const card = view[1] as HTMLElement;

    vi.spyOn(card, 'getBoundingClientRect').mockReturnValue({
      left: 0,
      top: 0,
      width: 200,
      height: 200,
      right: 200,
      bottom: 200,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    });

    // Move mouse to a corner, then leave
    fireEvent.mouseMove(card, { clientX: 10, clientY: 10 });
    expect(card.style.getPropertyValue('--mouse-x')).toBe('5%');

    fireEvent.mouseLeave(card);
    expect(card.style.getPropertyValue('--mouse-x')).toBe('50%');
    expect(card.style.getPropertyValue('--mouse-y')).toBe('50%');
  });

  it('first card carries the weather-card--today CSS class', async () => {
    const view = await renderWithForecast();
    expect(view[0].classList.contains('weather-card--today')).toBe(true);
    expect(view[1].classList.contains('weather-card--today')).toBe(false);
  });

  it('all cards carry the weather-card CSS class', async () => {
    const view = await renderWithForecast();
    view.forEach((card) => expect(card.classList.contains('weather-card')).toBe(true));
  });
});

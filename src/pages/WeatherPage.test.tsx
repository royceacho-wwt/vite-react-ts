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

/** Build a fake daily forecast payload with `n` days */
function makeForecastResponse(n: number) {
  return {
    daily: {
      time: Array.from({ length: n }, (_, i) => {
        const d = new Date(2024, 0, 1 + i);
        return d.toISOString().slice(0, 10);
      }),
      weather_code: Array.from({ length: n }, (_, i) => [0, 1, 2, 3, 61, 71, 95, 80, 2, 0, 1, 3, 65, 95][i % 14]),
      temperature_2m_max: Array.from({ length: n }, () => 72),
      temperature_2m_min: Array.from({ length: n }, () => 55),
      precipitation_sum: Array.from({ length: n }, () => 0),
      wind_speed_10m_max: Array.from({ length: n }, () => 10),
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
        // Return 14-day data when the API is called with forecast_days=14
        const payload = (url as string).includes('forecast_days=14') ? mockForecastResponse14 : mockForecastResponse7;
        return Promise.resolve({ ok: true, json: () => Promise.resolve(payload) });
      })
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders the page title defaulting to 7-Day', () => {
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

  it('renders a 7-day and a 14-day toggle button', () => {
    render(<WeatherPage />);
    expect(screen.getByRole('button', { name: /7-day/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /14-day/i })).toBeDefined();
  });

  it('7-Day toggle button is active by default', () => {
    render(<WeatherPage />);
    const btn7 = screen.getByRole('button', { name: /7-day/i });
    expect(btn7.getAttribute('aria-pressed')).toBe('true');
    const btn14 = screen.getByRole('button', { name: /14-day/i });
    expect(btn14.getAttribute('aria-pressed')).toBe('false');
  });

  it('switching to 14-Day updates the aria-pressed state and page title', () => {
    render(<WeatherPage />);
    fireEvent.click(screen.getByRole('button', { name: /14-day/i }));
    expect(screen.getByRole('button', { name: /14-day/i }).getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByRole('button', { name: /7-day/i }).getAttribute('aria-pressed')).toBe('false');
    expect(screen.getByText(/14-Day Weather Forecast/i)).toBeDefined();
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

  it('shows 14 forecast cards after switching to 14-Day and submitting', async () => {
    render(<WeatherPage />);
    fireEvent.change(screen.getByRole('textbox'), { target: { value: '90210' } });
    fireEvent.click(screen.getByRole('button', { name: /14-day/i }));
    fireEvent.click(screen.getByRole('button', { name: /get forecast/i }));

    await waitFor(() => {
      expect(screen.getByText(/Beverly Hills/i)).toBeDefined();
    });

    const cards = screen.getAllByRole('article');
    expect(cards.length).toBe(14);
  });

  it('re-fetches with 14 days when toggle is clicked after a forecast is already showing', async () => {
    render(<WeatherPage />);
    fireEvent.change(screen.getByRole('textbox'), { target: { value: '90210' } });
    fireEvent.click(screen.getByRole('button', { name: /get forecast/i }));

    // Wait for 7-day forecast
    await waitFor(() => expect(screen.getAllByRole('article').length).toBe(7));

    // Switch to 14-day — should auto-refetch
    fireEvent.click(screen.getByRole('button', { name: /14-day/i }));

    await waitFor(() => expect(screen.getAllByRole('article').length).toBe(14));
  });

  it('shows the forecast section with the correct aria-label after a 14-day fetch', async () => {
    render(<WeatherPage />);
    fireEvent.change(screen.getByRole('textbox'), { target: { value: '90210' } });
    fireEvent.click(screen.getByRole('button', { name: /14-day/i }));
    fireEvent.click(screen.getByRole('button', { name: /get forecast/i }));

    await waitFor(() => {
      expect(screen.getByRole('region', { name: /14-day forecast/i })).toBeDefined();
    });
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

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

const mockForecastResponse = {
  daily: {
    time: ['2024-01-01', '2024-01-02', '2024-01-03', '2024-01-04', '2024-01-05', '2024-01-06', '2024-01-07'],
    weather_code: [0, 1, 2, 3, 61, 71, 95],
    temperature_2m_max: [72, 68, 65, 70, 60, 55, 75],
    temperature_2m_min: [55, 52, 50, 54, 45, 40, 58],
    precipitation_sum: [0, 0, 0.1, 0, 0.5, 1.2, 0],
    wind_speed_10m_max: [10, 12, 15, 8, 20, 18, 9],
  },
};

describe('WeatherPage', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn((url: string) => {
        if ((url as string).includes('geocoding-api')) {
          return Promise.resolve({ ok: true, json: () => Promise.resolve(mockGeoResponse) });
        }
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockForecastResponse) });
      })
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders the page title', () => {
    render(<WeatherPage />);
    expect(screen.getByText(/7-Day Weather Forecast/i)).toBeDefined();
  });

  it('renders the zip code input', () => {
    render(<WeatherPage />);
    // Query by role to avoid ambiguity with the form's aria-label
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

  it('shows location name and forecast cards after a successful search', async () => {
    render(<WeatherPage />);
    fireEvent.change(screen.getByRole('textbox'), { target: { value: '90210' } });
    fireEvent.click(screen.getByRole('button', { name: /get forecast/i }));

    await waitFor(() => {
      expect(screen.getByText(/Beverly Hills/i)).toBeDefined();
    });

    // 7 cards rendered
    const cards = screen.getAllByRole('article');
    expect(cards.length).toBe(7);
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

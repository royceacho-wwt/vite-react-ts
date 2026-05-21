import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { vi } from 'vitest';

import { fetchForecast, ForecastDay, geocodeZip, weatherDesc, weatherIcon, WeatherPage } from '@/pages/WeatherPage';

/* ── Pure utility tests ──────────────────────────────────────────────────── */

describe('weatherIcon', () => {
  it('returns ☀️ for code 0', () => expect(weatherIcon(0)).toBe('☀️'));
  it('returns ⛅ for code 1-2', () => {
    expect(weatherIcon(1)).toBe('⛅');
    expect(weatherIcon(2)).toBe('⛅');
  });
  it('returns ☁️ for code 3', () => expect(weatherIcon(3)).toBe('☁️'));
  it('returns 🌧️ for code 61', () => expect(weatherIcon(61)).toBe('🌧️'));
  it('returns ❄️ for code 71', () => expect(weatherIcon(71)).toBe('❄️'));
  it('returns ⛈️ for code 91', () => expect(weatherIcon(91)).toBe('⛈️'));
});

describe('weatherDesc', () => {
  it('returns "Clear sky" for code 0', () => expect(weatherDesc(0)).toBe('Clear sky'));
  it('returns "Partly cloudy" for code 2', () => expect(weatherDesc(2)).toBe('Partly cloudy'));
  it('returns "Rain" for code 65', () => expect(weatherDesc(65)).toBe('Rain'));
  it('returns "Snow" for code 75', () => expect(weatherDesc(75)).toBe('Snow'));
  it('returns "Thunderstorm" for code 90', () => expect(weatherDesc(90)).toBe('Thunderstorm'));
});

/* ── API function tests (fetch mocked) ──────────────────────────────────── */

describe('geocodeZip', () => {
  afterEach(() => vi.restoreAllMocks());

  it('returns the first result on success', async () => {
    const mockResult = {
      name: 'Beverly Hills',
      admin1: 'California',
      country: 'United States',
      latitude: 34.07,
      longitude: -118.4,
    };
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({ results: [mockResult] }),
    } as unknown as Response);

    const result = await geocodeZip('90210');
    expect(result.name).toBe('Beverly Hills');
    expect(result.latitude).toBe(34.07);
  });

  it('throws when no results are returned', async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({ results: [] }),
    } as unknown as Response);

    await expect(geocodeZip('00000')).rejects.toThrow(/No location found/);
  });

  it('throws on HTTP error', async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({ ok: false } as Response);
    await expect(geocodeZip('90210')).rejects.toThrow(/Geocoding request failed/);
  });
});

describe('fetchForecast', () => {
  afterEach(() => vi.restoreAllMocks());

  it('maps API response to ForecastDay array', async () => {
    const mockDaily = {
      time: ['2024-06-01', '2024-06-02'],
      weathercode: [0, 3],
      temperature_2m_max: [85.4, 72.1],
      temperature_2m_min: [60.2, 55.9],
      precipitation_sum: [0, 0.12],
    };
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({ daily: mockDaily }),
    } as unknown as Response);

    const days = await fetchForecast(34.07, -118.4);
    expect(days).toHaveLength(2);
    expect(days[0].date).toBe('2024-06-01');
    expect(days[0].weatherCode).toBe(0);
    expect(days[0].tempMax).toBe(85);
    expect(days[1].precipitationSum).toBe(0.12);
  });
});

/* ── WeatherPage component tests ─────────────────────────────────────────── */

describe('WeatherPage component', () => {
  afterEach(() => vi.restoreAllMocks());

  it('renders the heading and search form', () => {
    render(<WeatherPage />);
    expect(screen.getByText(/Weather Forecast/i)).toBeDefined();
    expect(screen.getByRole('textbox', { name: /zip code/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /get forecast/i })).toBeDefined();
  });

  it('disables the button when input is empty', () => {
    render(<WeatherPage />);
    const btn = screen.getByRole('button', { name: /get forecast/i }) as HTMLButtonElement;
    expect(btn.disabled).toBe(true);
  });

  it('enables the button when input has text', () => {
    render(<WeatherPage />);
    const input = screen.getByRole('textbox', { name: /zip code/i });
    fireEvent.change(input, { target: { value: '90210' } });
    const btn = screen.getByRole('button', { name: /get forecast/i }) as HTMLButtonElement;
    expect(btn.disabled).toBe(false);
  });

  it('shows forecast cards after a successful fetch', async () => {
    const mockGeo = {
      name: 'Beverly Hills',
      admin1: 'California',
      country: 'United States',
      latitude: 34.07,
      longitude: -118.4,
    };
    const mockForecast: ForecastDay[] = Array.from({ length: 7 }, (_, i) => ({
      date: `2024-06-0${i + 1}`,
      weatherCode: 0,
      tempMax: 80 + i,
      tempMin: 60 + i,
      precipitationSum: 0,
    }));

    // geocode call then forecast call
    global.fetch = vi
      .fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ results: [mockGeo] }) } as unknown as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          daily: {
            time: mockForecast.map((d) => d.date),
            weathercode: mockForecast.map((d) => d.weatherCode),
            temperature_2m_max: mockForecast.map((d) => d.tempMax),
            temperature_2m_min: mockForecast.map((d) => d.tempMin),
            precipitation_sum: mockForecast.map((d) => d.precipitationSum),
          },
        }),
      } as unknown as Response);

    render(<WeatherPage />);
    fireEvent.change(screen.getByRole('textbox', { name: /zip code/i }), { target: { value: '90210' } });
    fireEvent.click(screen.getByRole('button', { name: /get forecast/i }));

    await waitFor(() => {
      expect(screen.getByText(/Beverly Hills/)).toBeDefined();
    });

    // 7 forecast cards rendered (Today + 6 days)
    expect(screen.getByText('Today')).toBeDefined();
  });

  it('shows an error message on failed geocode', async () => {
    global.fetch = vi
      .fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ results: [] }) } as unknown as Response);

    render(<WeatherPage />);
    fireEvent.change(screen.getByRole('textbox', { name: /zip code/i }), { target: { value: '00000' } });
    fireEvent.click(screen.getByRole('button', { name: /get forecast/i }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeDefined();
    });
    expect(screen.getByText(/No location found/i)).toBeDefined();
  });
});

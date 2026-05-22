import { act, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { TimeZonePage } from '@/pages/TimeZonePage';

/* ── Helpers ──────────────────────────────────────────────────────────────── */

/**
 * Freeze Date to a fixed UTC instant so time-zone assertions are deterministic.
 * 2024-07-04 18:00:00 UTC
 *   New York  (America/New_York / EDT  = UTC−4)  → 02:00:00 PM
 *   Detroit   (America/Detroit  / EDT  = UTC−4)  → 02:00:00 PM
 *   St. Louis (America/Chicago  / CDT  = UTC−5)  → 01:00:00 PM
 *   Boise     (America/Boise    / MDT  = UTC−6)  → 12:00:00 PM
 *   Honolulu  (Pacific/Honolulu / HST  = UTC−10) → 08:00:00 AM
 *   Paris     (Europe/Paris     / CEST = UTC+2)  → 08:00:00 PM
 *   Cairo     (Africa/Cairo     / EET  = UTC+2 or EEST = UTC+3 in DST) → 09:00:00 PM
 */
const FIXED_UTC = new Date('2024-07-04T18:00:00Z').getTime();

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(FIXED_UTC);
});

afterEach(() => {
  vi.useRealTimers();
});

/* ── City metadata ────────────────────────────────────────────────────────── */

// [city name, state/country label, expected time at FIXED_UTC]
const CITY_DATA: [string, string, string][] = [
  ['New York City', 'New York', '02:00:00 PM'],
  ['Detroit', 'Michigan', '02:00:00 PM'],
  ['St. Louis', 'Missouri', '01:00:00 PM'],
  ['Boise', 'Idaho', '12:00:00 PM'],
  ['Honolulu', 'Hawaii', '08:00:00 AM'],
  ['Paris', 'France', '08:00:00 PM'],
  ['Cairo', 'Egypt', '09:00:00 PM'],
];

/* ── Page structure ───────────────────────────────────────────────────────── */

describe('TimeZonePage', () => {
  it('renders the page heading and subtitle', () => {
    render(<TimeZonePage />);
    expect(screen.getByRole('heading', { level: 1 })).toBeDefined();
    expect(screen.getByText(/Time Zones/i)).toBeDefined();
    expect(screen.getByText(/Live clocks for cities across the United States and beyond/i)).toBeDefined();
  });

  it('renders exactly seven city cards (article elements)', () => {
    render(<TimeZonePage />);
    expect(screen.getAllByRole('article').length).toBe(7);
  });

  it('renders all city names and their state/country labels', () => {
    render(<TimeZonePage />);
    CITY_DATA.forEach(([city, region]) => {
      expect(screen.getByText(city)).toBeDefined();
      expect(screen.getByText(region)).toBeDefined();
    });
  });

  it('renders an emoji for each city', () => {
    render(<TimeZonePage />);
    CITY_DATA.forEach(([city]) => {
      expect(screen.getByRole('img', { name: city })).toBeDefined();
    });
  });

  /* ── Clock values at fixed UTC instant ──────────────────────────────────── */

  it('displays a time value (AM or PM) in each clock', () => {
    render(<TimeZonePage />);
    const clocks = screen.getAllByLabelText(/Current time in/i);
    expect(clocks.length).toBe(7);
    clocks.forEach((clock) => {
      expect(clock.getAttribute('aria-label')).toMatch(/AM|PM/i);
    });
  });

  it.each(CITY_DATA)('%s clock shows the correct time at the fixed UTC instant', (city, _region, expectedTime) => {
    render(<TimeZonePage />);
    const clock = screen.getByLabelText(new RegExp(`Current time in ${city.replace('.', '\\.')}`, 'i'));
    expect(clock.getAttribute('aria-label')).toContain(expectedTime);
  });

  /* ── Interval tick ───────────────────────────────────────────────────────── */

  it('all clocks update after one second', () => {
    render(<TimeZonePage />);
    const before = screen.getAllByLabelText(/Current time in/i).map((el) => el.getAttribute('aria-label'));

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    const after = screen.getAllByLabelText(/Current time in/i).map((el) => el.getAttribute('aria-label'));
    after.forEach((label, i) => expect(label).not.toBe(before[i]));
  });

  /* ── SpotlightCard initial CSS vars ─────────────────────────────────────── */

  it('each card starts with --mouse-x and --mouse-y set to 50%', () => {
    render(<TimeZonePage />);
    screen.getAllByRole('article').forEach((card) => {
      expect((card as HTMLElement).style.getPropertyValue('--mouse-x')).toBe('50%');
      expect((card as HTMLElement).style.getPropertyValue('--mouse-y')).toBe('50%');
    });
  });
});

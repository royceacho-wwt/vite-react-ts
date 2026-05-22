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
 *   Cairo     (Africa/Cairo     / EEST = UTC+3)  → 09:00:00 PM
 */
const FIXED_UTC = new Date('2024-07-04T18:00:00Z').getTime();

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(FIXED_UTC);
});

afterEach(() => {
  vi.useRealTimers();
});

/* ── Page structure ───────────────────────────────────────────────────────── */

describe('TimeZonePage', () => {
  it('renders the page heading and subtitle', () => {
    render(<TimeZonePage />);
    expect(screen.getByRole('heading', { level: 1 })).toBeDefined();
    expect(screen.getByText(/Time Zones/i)).toBeDefined();
    expect(screen.getByText(/Live clocks for cities across the United States and beyond/i)).toBeDefined();
  });

  it('renders exactly seven city cards, each with a name, region label, and emoji', () => {
    render(<TimeZonePage />);

    const cards = screen.getAllByRole('article');
    expect(cards.length).toBe(7);

    // City names
    const cities = ['New York City', 'Detroit', 'St. Louis', 'Boise', 'Honolulu', 'Paris', 'Cairo'];
    cities.forEach((city) => expect(screen.getByText(city)).toBeDefined());

    // Region / country labels
    ['New York', 'Michigan', 'Missouri', 'Idaho', 'Hawaii', 'France', 'Egypt'].forEach((region) =>
      expect(screen.getByText(region)).toBeDefined()
    );

    // Emoji landmarks (aria role="img")
    cities.forEach((city) => expect(screen.getByRole('img', { name: city })).toBeDefined());
  });

  /* ── Clock values at fixed UTC instant ──────────────────────────────────── */

  it('displays a valid AM/PM time string in each of the seven clocks', () => {
    render(<TimeZonePage />);
    const clocks = screen.getAllByLabelText(/Current time in/i);
    expect(clocks.length).toBe(7);
    clocks.forEach((clock) => {
      expect(clock.getAttribute('aria-label')).toMatch(/AM|PM/i);
    });
  });

  it.each([
    ['New York City', '02:00:00 PM'],
    ['Detroit', '02:00:00 PM'],
    ['St. Louis', '01:00:00 PM'],
    ['Boise', '12:00:00 PM'],
    ['Honolulu', '08:00:00 AM'],
    ['Paris', '08:00:00 PM'],
    ['Cairo', '09:00:00 PM'],
  ])('%s clock shows the correct time at the fixed UTC instant', (city, expectedTime) => {
    render(<TimeZonePage />);
    const clock = screen.getByLabelText(new RegExp(`Current time in ${city.replace('.', '\\.')}`, 'i'));
    expect(clock.getAttribute('aria-label')).toContain(expectedTime);
  });

  /* ── Interval tick ───────────────────────────────────────────────────────── */

  it('all clocks advance by one second after 1000 ms', () => {
    render(<TimeZonePage />);

    const clocksBefore = screen.getAllByLabelText(/Current time in/i).map((el) => el.getAttribute('aria-label'));

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    const clocksAfter = screen.getAllByLabelText(/Current time in/i).map((el) => el.getAttribute('aria-label'));

    clocksBefore.forEach((before, i) => {
      expect(clocksAfter[i]).not.toBe(before);
    });
  });

  /* ── SpotlightCard initial CSS vars ─────────────────────────────────────── */

  it('each card starts with --mouse-x and --mouse-y set to 50%', () => {
    render(<TimeZonePage />);
    const cards = screen.getAllByRole('article');
    cards.forEach((card) => {
      expect((card as HTMLElement).style.getPropertyValue('--mouse-x')).toBe('50%');
      expect((card as HTMLElement).style.getPropertyValue('--mouse-y')).toBe('50%');
    });
  });
});

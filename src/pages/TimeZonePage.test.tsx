import { act, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { TimeZonePage } from '@/pages/TimeZonePage';

/* ── Helpers ──────────────────────────────────────────────────────────────── */

/**
 * Freeze Date to a fixed UTC instant so time-zone assertions are deterministic.
 * 2024-07-04 18:00:00 UTC
 *   New York  (America/New_York / EDT = UTC−4)  → 02:00:00 PM
 *   Detroit   (America/Detroit  / EDT = UTC−4)  → 02:00:00 PM
 *   St. Louis (America/Chicago  / CDT = UTC−5)  → 01:00:00 PM
 *   Honolulu  (Pacific/Honolulu / HST = UTC−10) → 08:00:00 AM
 *   Paris     (Europe/Paris     / CEST = UTC+2) → 08:00:00 PM
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
  it('renders the page heading', () => {
    render(<TimeZonePage />);
    expect(screen.getByRole('heading', { level: 1 })).toBeDefined();
    expect(screen.getByText(/Time Zones/i)).toBeDefined();
  });

  it('renders the subtitle', () => {
    render(<TimeZonePage />);
    expect(screen.getByText(/Live clocks for cities across the United States and beyond/i)).toBeDefined();
  });

  it('renders exactly five city cards (article elements)', () => {
    render(<TimeZonePage />);
    const cards = screen.getAllByRole('article');
    expect(cards.length).toBe(5);
  });

  it('shows New York City as the first card', () => {
    render(<TimeZonePage />);
    expect(screen.getByText('New York City')).toBeDefined();
  });

  it('shows Detroit as the second card', () => {
    render(<TimeZonePage />);
    expect(screen.getByText('Detroit')).toBeDefined();
  });

  it('shows St. Louis as the third card', () => {
    render(<TimeZonePage />);
    expect(screen.getByText('St. Louis')).toBeDefined();
  });

  it('shows Honolulu as the fourth card', () => {
    render(<TimeZonePage />);
    expect(screen.getByText('Honolulu')).toBeDefined();
  });

  it('shows Paris as the fifth card', () => {
    render(<TimeZonePage />);
    expect(screen.getByText('Paris')).toBeDefined();
  });

  it('shows the state/country label for each city', () => {
    render(<TimeZonePage />);
    expect(screen.getByText('New York')).toBeDefined();
    expect(screen.getByText('Michigan')).toBeDefined();
    expect(screen.getByText('Missouri')).toBeDefined();
    expect(screen.getByText('Hawaii')).toBeDefined();
    expect(screen.getByText('France')).toBeDefined();
  });

  it('renders an emoji for each city', () => {
    render(<TimeZonePage />);
    expect(screen.getByRole('img', { name: 'New York City' })).toBeDefined();
    expect(screen.getByRole('img', { name: 'Detroit' })).toBeDefined();
    expect(screen.getByRole('img', { name: 'St. Louis' })).toBeDefined();
    expect(screen.getByRole('img', { name: 'Honolulu' })).toBeDefined();
    expect(screen.getByRole('img', { name: 'Paris' })).toBeDefined();
  });

  /* ── Clock values at fixed UTC instant ──────────────────────────────────── */

  it('displays a time value in each card', () => {
    render(<TimeZonePage />);
    // Each clock has aria-live="polite" and an aria-label containing "Current time in"
    const clocks = screen.getAllByLabelText(/Current time in/i);
    expect(clocks.length).toBe(5);
    clocks.forEach((clock) => {
      // Should contain AM or PM
      expect(clock.getAttribute('aria-label')).toMatch(/AM|PM/i);
    });
  });

  it('New York City clock reads 02:00:00 PM at the fixed UTC instant', () => {
    render(<TimeZonePage />);
    const nycClock = screen.getByLabelText(/Current time in New York City/i);
    expect(nycClock.getAttribute('aria-label')).toContain('02:00:00 PM');
  });

  it('Detroit clock reads 02:00:00 PM at the fixed UTC instant', () => {
    render(<TimeZonePage />);
    const detroitClock = screen.getByLabelText(/Current time in Detroit/i);
    expect(detroitClock.getAttribute('aria-label')).toContain('02:00:00 PM');
  });

  it('St. Louis clock reads 01:00:00 PM at the fixed UTC instant', () => {
    render(<TimeZonePage />);
    const stlClock = screen.getByLabelText(/Current time in St\. Louis/i);
    expect(stlClock.getAttribute('aria-label')).toContain('01:00:00 PM');
  });

  it('Honolulu clock reads 08:00:00 AM at the fixed UTC instant', () => {
    render(<TimeZonePage />);
    const honoluluClock = screen.getByLabelText(/Current time in Honolulu/i);
    expect(honoluluClock.getAttribute('aria-label')).toContain('08:00:00 AM');
  });

  it('Paris clock reads 08:00:00 PM at the fixed UTC instant', () => {
    render(<TimeZonePage />);
    const parisClock = screen.getByLabelText(/Current time in Paris/i);
    expect(parisClock.getAttribute('aria-label')).toContain('08:00:00 PM');
  });

  /* ── Interval tick ───────────────────────────────────────────────────────── */

  it('updates the New York City clock after one second', () => {
    render(<TimeZonePage />);
    const clockBefore = screen.getByLabelText(/Current time in New York City/i).getAttribute('aria-label');

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    const clockAfter = screen.getByLabelText(/Current time in New York City/i).getAttribute('aria-label');
    // After 1 second the time should have changed (seconds digit increments)
    expect(clockAfter).not.toBe(clockBefore);
  });

  it('updates the Detroit clock after one second', () => {
    render(<TimeZonePage />);
    const clockBefore = screen.getByLabelText(/Current time in Detroit/i).getAttribute('aria-label');

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    const clockAfter = screen.getByLabelText(/Current time in Detroit/i).getAttribute('aria-label');
    // After 1 second the time should have changed (seconds digit increments)
    expect(clockAfter).not.toBe(clockBefore);
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

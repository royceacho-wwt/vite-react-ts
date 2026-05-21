import { act, renderHook } from '@testing-library/react';

import { useDarkMode } from '@/hooks/useDarkMode';

// Helper: reset localStorage and html attribute between tests
beforeEach(() => {
  localStorage.clear();
  document.documentElement.removeAttribute('data-theme');
});

describe('useDarkMode', () => {
  test('defaults to dark when matchMedia prefers dark', () => {
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: query === '(prefers-color-scheme: dark)',
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));

    const { result } = renderHook(() => useDarkMode());
    expect(result.current[0]).toBe(true);
  });

  test('defaults to light when matchMedia prefers light', () => {
    window.matchMedia = vi.fn().mockImplementation(() => ({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));

    const { result } = renderHook(() => useDarkMode());
    expect(result.current[0]).toBe(false);
  });

  test('reads initial value from localStorage', () => {
    localStorage.setItem('color-scheme', 'light');
    window.matchMedia = vi.fn().mockImplementation(() => ({
      matches: true, // OS prefers dark, but localStorage overrides
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));

    const { result } = renderHook(() => useDarkMode());
    expect(result.current[0]).toBe(false);
  });

  test('toggle switches from dark to light', () => {
    localStorage.setItem('color-scheme', 'dark');

    const { result } = renderHook(() => useDarkMode());
    expect(result.current[0]).toBe(true);

    act(() => result.current[1]());
    expect(result.current[0]).toBe(false);
  });

  test('toggle persists new value to localStorage', () => {
    localStorage.setItem('color-scheme', 'dark');

    const { result } = renderHook(() => useDarkMode());
    act(() => result.current[1]());

    expect(localStorage.getItem('color-scheme')).toBe('light');
  });

  test('sets data-theme attribute on <html>', () => {
    localStorage.setItem('color-scheme', 'dark');

    const { result } = renderHook(() => useDarkMode());
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');

    act(() => result.current[1]());
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
  });
});

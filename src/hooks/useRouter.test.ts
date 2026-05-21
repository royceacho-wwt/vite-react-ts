import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { useRouter } from '@/hooks/useRouter';

describe('useRouter', () => {
  beforeEach(() => {
    window.location.hash = '';
  });

  afterEach(() => {
    window.location.hash = '';
  });

  it('defaults to "/" when hash is empty', () => {
    const { result } = renderHook(() => useRouter());
    expect(result.current[0]).toBe('/');
  });

  it('navigate() updates the path', () => {
    const { result } = renderHook(() => useRouter());
    act(() => {
      result.current[1]('/weather');
    });
    expect(result.current[0]).toBe('/weather');
  });

  it('navigate back to "/" works', () => {
    const { result } = renderHook(() => useRouter());
    act(() => {
      result.current[1]('/weather');
    });
    act(() => {
      result.current[1]('/');
    });
    expect(result.current[0]).toBe('/');
  });
});

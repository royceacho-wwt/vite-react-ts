import { useCallback, useEffect, useState } from 'react';

/**
 * Lightweight hash-based router hook.
 * Routes are identified by the hash fragment, e.g. "#/" or "#/weather".
 * Falls back to "#/" when the hash is empty.
 */
export function useRouter(): [string, (path: string) => void] {
  const getPath = () => {
    const hash = window.location.hash;
    return hash.startsWith('#') ? hash.slice(1) || '/' : '/';
  };

  const [path, setPath] = useState<string>(getPath);

  useEffect(() => {
    const handler = () => setPath(getPath());
    window.addEventListener('hashchange', handler);
    // Initialise hash if missing
    if (!window.location.hash) {
      window.location.hash = '#/';
    }
    return () => window.removeEventListener('hashchange', handler);
  }, []);

  const navigate = useCallback((to: string) => {
    window.location.hash = `#${to}`;
    // Also update state directly so it works in environments (e.g. jsdom)
    // where the hashchange event is not dispatched synchronously.
    setPath(to);
  }, []);

  return [path, navigate];
}

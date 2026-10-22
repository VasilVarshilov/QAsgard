import { useState, useEffect, useCallback } from 'react';

/**
 * useHashLocation
 *
 * Provides robust 404-free client-side routing on static hosts (like GitHub Pages).
 * Listens to `window.location.hash` and updates the active tab state,
 * while allowing programmatic tab changes to update the URL hash.
 */
export function useHashLocation(defaultTab: string = 'dashboard') {
  const getHashTab = useCallback((): string => {
    if (typeof window === 'undefined') return defaultTab;
    const rawHash = window.location.hash.replace(/^#\/?/, '').trim();
    return rawHash || defaultTab;
  }, [defaultTab]);

  const [activeTab, setActiveTabState] = useState<string>(getHashTab);

  useEffect(() => {
    const handleHashChange = () => {
      const newTab = getHashTab();
      setActiveTabState(newTab);
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [getHashTab]);

  const setTab = useCallback((tab: string) => {
    setActiveTabState(tab);
    if (typeof window !== 'undefined') {
      const targetHash = `#/${tab}`;
      if (window.location.hash !== targetHash) {
        window.history.pushState(null, '', targetHash);
      }
    }
  }, []);

  return [activeTab, setTab] as const;
}

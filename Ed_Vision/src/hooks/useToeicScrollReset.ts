import { useEffect, useLayoutEffect } from 'react';
import { useLocation } from 'react-router-dom';

export function useToeicScrollReset(): void {
  const location = useLocation();

  useLayoutEffect(() => {
    if (typeof window === 'undefined') return;

    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }

    const resetScroll = () => {
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    };

    // Run more than once to override late layout updates.
    resetScroll();
    const frameId = window.requestAnimationFrame(resetScroll);
    const timeoutId = window.setTimeout(resetScroll, 80);

    return () => {
      window.cancelAnimationFrame(frameId);
      window.clearTimeout(timeoutId);
    };
  }, [location.key, location.pathname, location.search, location.hash]);

  useEffect(() => {
    return () => {
      if (typeof window === 'undefined') return;
      if ('scrollRestoration' in window.history) {
        window.history.scrollRestoration = 'auto';
      }
    };
  }, []);
}

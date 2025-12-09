import { useEffect } from 'react';
import { preloadImages } from './useImagePreloader';

/**
 * Hook to preload critical resources for Learning Space
 * This runs during idle time to avoid blocking the main thread
 */
export function useLearningSpacePreloader() {
  useEffect(() => {
    // Preload critical resources during idle time
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => {
        // Preload common theme backgrounds
        const criticalBackgrounds = [
          'https://images.unsplash.com/photo-1519904981063-b0cf448d479e?w=1920&h=1080&fit=crop',
          'https://images.unsplash.com/photo-1501618669935-18b6ecb13d6d?w=1920&h=1080&fit=crop',
          'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920&h=1080&fit=crop',
        ];

        preloadImages(criticalBackgrounds, 2).catch((error) => {
          console.warn('Background preload failed:', error);
        });

        // Preload Font Awesome icons (if not already loaded)
        const link = document.createElement('link');
        link.rel = 'preload';
        link.as = 'style';
        link.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css';
        document.head.appendChild(link);
      }, { timeout: 2000 });
    }
  }, []);
}

/**
 * Hook to prefetch panel components
 * This preloads the JavaScript chunks for panels in the background
 */
export function usePanelPrefetcher() {
  useEffect(() => {
    // Prefetch panel components after initial render
    const prefetchDelay = setTimeout(() => {
      if ('requestIdleCallback' in window) {
        requestIdleCallback(() => {
          // These dynamic imports will trigger webpack to prefetch the chunks
          // but won't execute the modules
          import(/* webpackPrefetch: true */ '../modules/student/components/ThemePanel');
          import(/* webpackPrefetch: true */ '../modules/student/components/MusicPanel');
          import(/* webpackPrefetch: true */ '../modules/student/components/AmbiencePanel');
        }, { timeout: 5000 });
      }
    }, 3000); // Wait 3 seconds after mount

    return () => clearTimeout(prefetchDelay);
  }, []);
}

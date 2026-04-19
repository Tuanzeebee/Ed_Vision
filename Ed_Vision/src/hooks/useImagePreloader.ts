import { useEffect, useState } from 'react';

interface UseImagePreloaderOptions {
  enabled?: boolean;
  priority?: 'high'| 'low';
}

/**
 * Custom hook to preload images for better performance
 * Uses requestIdleCallback for low-priority preloading
 */
export function useImagePreloader(
  imageUrls: string[],
  options: UseImagePreloaderOptions = {}
) {
  const { enabled = true, priority = 'low'} = options;
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!enabled || imageUrls.length === 0) return;

    setIsLoading(true);
    const loaded = new Set<string>();
    const imagePromises: Promise<void>[] = [];

    const preloadImage = (url: string): Promise<void>=> {
      return new Promise((resolve, reject) => {
        const img = new Image();
        
        img.onload = () => {
          loaded.add(url);
          setLoadedImages(new Set(loaded));
          resolve();
        };
        
        img.onerror = () => {
          console.warn(`Failed to preload image: ${url}`);
          reject(new Error(`Failed to load ${url}`));
        };
        
        img.src = url;
      });
    };

    const startPreloading = () => {
      imageUrls.forEach((url) => {
        if (!loaded.has(url)) {
          imagePromises.push(
            preloadImage(url).catch((err) => {
              console.error(err);
            })
          );
        }
      });

      Promise.all(imagePromises).finally(() => {
        setIsLoading(false);
      });
    };

    if (priority === 'low') {
      // Use requestIdleCallback for non-critical preloading
      if ('requestIdleCallback'in window) {
        requestIdleCallback(() =>startPreloading(), { timeout: 2000 });
      } else {
        setTimeout(startPreloading, 1000);
      }
    } else {
      // Preload immediately for high priority
      startPreloading();
    }

    return () => {
      // Cleanup if needed
      setIsLoading(false);
    };
  }, [imageUrls, enabled, priority]);

  return {
    loadedImages,
    isLoading,
    isImageLoaded: (url: string) =>loadedImages.has(url),
    progress: imageUrls.length >0 ? (loadedImages.size / imageUrls.length) * 100 : 0,
  };
}

/**
 * Preload a single image
 */
export function preloadImage(url: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () =>resolve();
    img.onerror = () =>reject(new Error(`Failed to load ${url}`));
    img.src = url;
  });
}

/**
 * Preload multiple images with batch support
 */
export async function preloadImages(
  urls: string[],
  batchSize: number = 3
): Promise<void> {
  const batches: string[][] = [];
  
  for (let i = 0; i < urls.length; i += batchSize) {
    batches.push(urls.slice(i, i + batchSize));
  }

  for (const batch of batches) {
    await Promise.allSettled(batch.map(preloadImage));
  }
}

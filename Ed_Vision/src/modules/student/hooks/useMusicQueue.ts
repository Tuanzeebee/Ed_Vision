/**
 * Music Queue Hook
 * Manages music queue with localStorage persistence
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import type { MusicTrack, MusicQueueState } from '../types/musicTypes';

const STORAGE_KEY = 'ed_vision_music_queue';
const DEBOUNCE_MS = 200;

export function useMusicQueue() {
  const [state, setState] = useState<MusicQueueState>(() => {
    // Load from localStorage on mount
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          currentTrack: parsed.currentTrack || null,
          queue: parsed.queue || [],
          currentIndex: parsed.currentIndex || 0,
          isPlaying: false, // Always start as not playing on reload
        };
      }
    } catch (error) {
      console.error('Failed to load music queue from localStorage:', error);
    }
    
    return {
      currentTrack: null,
      queue: [],
      currentIndex: 0,
      isPlaying: false,
    };
  });

  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Debounced save to localStorage
  useEffect(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      try {
        const toSave = {
          currentTrack: state.currentTrack,
          queue: state.queue,
          currentIndex: state.currentIndex,
          // Don't save isPlaying state
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
      } catch (error) {
        console.error('Failed to save music queue to localStorage:', error);
      }
    }, DEBOUNCE_MS);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [state.currentTrack, state.queue, state.currentIndex]);

  const playTrack = useCallback((track: MusicTrack) => {
    setState((prev) => ({
      ...prev,
      currentTrack: track,
      isPlaying: true,
    }));
  }, []);

  const addToQueue = useCallback((track: MusicTrack) => {
    setState((prev) => {
      // Check if track already in queue
      const existsInQueue = prev.queue.some((t) => t.id === track.id);
      if (existsInQueue) {
        return prev;
      }

      return {
        ...prev,
        queue: [...prev.queue, track],
      };
    });
  }, []);

  const removeFromQueue = useCallback((trackId: string) => {
    setState((prev) => ({
      ...prev,
      queue: prev.queue.filter((t) => t.id !== trackId),
    }));
  }, []);

  const next = useCallback(() => {
    setState((prev) => {
      if (prev.queue.length === 0) {
        return {
          ...prev,
          isPlaying: false,
        };
      }

      const nextIndex = (prev.currentIndex + 1) % prev.queue.length;
      return {
        ...prev,
        currentTrack: prev.queue[nextIndex],
        currentIndex: nextIndex,
        isPlaying: true,
      };
    });
  }, []);

  const previous = useCallback(() => {
    setState((prev) => {
      if (prev.queue.length === 0) {
        return prev;
      }

      const prevIndex = prev.currentIndex === 0 
        ? prev.queue.length - 1 
        : prev.currentIndex - 1;
      
      return {
        ...prev,
        currentTrack: prev.queue[prevIndex],
        currentIndex: prevIndex,
        isPlaying: true,
      };
    });
  }, []);

  const clear = useCallback(() => {
    setState({
      currentTrack: null,
      queue: [],
      currentIndex: 0,
      isPlaying: false,
    });
  }, []);

  const setIsPlaying = useCallback((playing: boolean) => {
    setState((prev) => ({
      ...prev,
      isPlaying: playing,
    }));
  }, []);

  const playFromQueue = useCallback((index: number) => {
    setState((prev) => {
      if (index < 0 || index >= prev.queue.length) {
        return prev;
      }

      return {
        ...prev,
        currentTrack: prev.queue[index],
        currentIndex: index,
        isPlaying: true,
      };
    });
  }, []);

  const replaceQueue = useCallback((tracks: MusicTrack[], startIndex: number = 0) => {
    setState({
      currentTrack: tracks[startIndex] || null,
      queue: tracks,
      currentIndex: startIndex,
      isPlaying: tracks.length > 0,
    });
  }, []);

  return {
    currentTrack: state.currentTrack,
    queue: state.queue,
    currentIndex: state.currentIndex,
    isPlaying: state.isPlaying,
    playTrack,
    addToQueue,
    removeFromQueue,
    next,
    previous,
    clear,
    setIsPlaying,
    playFromQueue,
    replaceQueue,
  };
}

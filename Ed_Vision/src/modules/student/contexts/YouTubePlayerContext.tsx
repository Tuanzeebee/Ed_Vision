/**
 * YouTube Music Player Context
 * Provides global access to the YouTube player for the music module
 */

import React, { createContext, useContext, useCallback, useEffect } from 'react';
import { useYouTubePlayer } from '../hooks/useYouTubePlayer';
import type { UseYouTubePlayerReturn } from '../hooks/useYouTubePlayer';
import type { YouTubeTrack } from '../types/youtubeTypes';

interface YouTubePlayerContextValue extends UseYouTubePlayerReturn {
  // Queue management
  queue: YouTubeTrack[];
  addToQueue: (track: YouTubeTrack) => void;
  removeFromQueue: (trackId: string) => void;
  clearQueue: () => void;
  playNext: () => void;
  playPrevious: () => void;
  // Shuffle and repeat
  shuffle: boolean;
  toggleShuffle: () => void;
  repeat: 'none' | 'one' | 'all';
  setRepeat: (mode: 'none' | 'one' | 'all') => void;
}

const YouTubePlayerContext = createContext<YouTubePlayerContextValue | null>(null);

interface YouTubePlayerProviderProps {
  children: React.ReactNode;
}

export function YouTubePlayerProvider({ children }: YouTubePlayerProviderProps) {
  const [queue, setQueue] = React.useState<YouTubeTrack[]>([]);
  const [queueIndex, setQueueIndex] = React.useState(-1);
  const [shuffle, setShuffle] = React.useState(false);
  const [repeat, setRepeatState] = React.useState<'none' | 'one' | 'all'>('none');
  const [playHistory, setPlayHistory] = React.useState<number[]>([]);

  const player = useYouTubePlayer({
    onTrackEnd: () => {
      handleTrackEnd();
    },
  });

  // Handle track end
  const handleTrackEnd = useCallback(() => {
    if (repeat === 'one' && player.currentTrack) {
      // Replay current track
      player.playTrack(player.currentTrack);
      return;
    }

    if (queueIndex < queue.length - 1) {
      // Play next in queue
      playNextInQueue();
    } else if (repeat === 'all' && queue.length > 0) {
      // Restart queue
      setQueueIndex(0);
      player.playTrack(queue[0]);
    }
  }, [repeat, queueIndex, queue, player]);

  // Get next track index (considering shuffle)
  const getNextIndex = useCallback((): number => {
    if (shuffle) {
      // Get random track that hasn't been played recently
      const unplayed = queue
        .map((_, i) => i)
        .filter((i) => !playHistory.includes(i) && i !== queueIndex);
      
      if (unplayed.length === 0) {
        // Reset history if all played
        setPlayHistory([]);
        return Math.floor(Math.random() * queue.length);
      }
      
      return unplayed[Math.floor(Math.random() * unplayed.length)];
    }
    
    return queueIndex + 1;
  }, [shuffle, queue, queueIndex, playHistory]);

  // Play next track
  const playNextInQueue = useCallback(() => {
    if (queue.length === 0) return;

    const nextIndex = getNextIndex();
    if (nextIndex < queue.length) {
      setPlayHistory((prev) => [...prev, queueIndex]);
      setQueueIndex(nextIndex);
      player.playTrack(queue[nextIndex]);
    }
  }, [queue, getNextIndex, queueIndex, player]);

  // Play previous track
  const playPrevious = useCallback(() => {
    if (player.currentTime > 3) {
      // If more than 3 seconds in, restart current track
      player.seek(0);
      return;
    }

    if (playHistory.length > 0) {
      const prevIndex = playHistory[playHistory.length - 1];
      setPlayHistory((prev) => prev.slice(0, -1));
      setQueueIndex(prevIndex);
      player.playTrack(queue[prevIndex]);
    } else if (queueIndex > 0) {
      setQueueIndex(queueIndex - 1);
      player.playTrack(queue[queueIndex - 1]);
    }
  }, [player, playHistory, queueIndex, queue]);

  // Add track to queue
  const addToQueue = useCallback((track: YouTubeTrack) => {
    setQueue((prev) => [...prev, track]);
  }, []);

  // Remove track from queue
  const removeFromQueue = useCallback((trackId: string) => {
    setQueue((prev) => {
      const index = prev.findIndex((t) => t.id === trackId);
      if (index === -1) return prev;
      
      // Adjust queue index if needed
      if (index < queueIndex) {
        setQueueIndex((i) => i - 1);
      }
      
      return prev.filter((t) => t.id !== trackId);
    });
  }, [queueIndex]);

  // Clear queue
  const clearQueue = useCallback(() => {
    setQueue([]);
    setQueueIndex(-1);
    setPlayHistory([]);
  }, []);

  // Toggle shuffle
  const toggleShuffle = useCallback(() => {
    setShuffle((prev) => !prev);
  }, []);

  // Set repeat mode
  const setRepeat = useCallback((mode: 'none' | 'one' | 'all') => {
    setRepeatState(mode);
  }, []);

  // Override playTrack to also add to queue
  const playTrack = useCallback((track: YouTubeTrack) => {
    const existingIndex = queue.findIndex((t) => t.id === track.id);
    
    if (existingIndex !== -1) {
      setQueueIndex(existingIndex);
    } else {
      setQueue((prev) => [...prev, track]);
      setQueueIndex(queue.length);
    }
    
    player.playTrack(track);
  }, [queue, player]);

  const value: YouTubePlayerContextValue = {
    ...player,
    playTrack, // Override with queue-aware version
    queue,
    addToQueue,
    removeFromQueue,
    clearQueue,
    playNext: playNextInQueue,
    playPrevious,
    shuffle,
    toggleShuffle,
    repeat,
    setRepeat,
  };

  return (
    <YouTubePlayerContext.Provider value={value}>
      {children}
    </YouTubePlayerContext.Provider>
  );
}

export function useYouTubePlayerContext(): YouTubePlayerContextValue {
  const context = useContext(YouTubePlayerContext);
  if (!context) {
    throw new Error('useYouTubePlayerContext must be used within a YouTubePlayerProvider');
  }
  return context;
}

export default YouTubePlayerContext;

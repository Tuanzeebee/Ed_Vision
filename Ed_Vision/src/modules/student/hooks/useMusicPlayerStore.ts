import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { MusicTrack, PlayerState } from '../types/musicTypes';

interface MusicPlayerStore {
  currentTrack: MusicTrack | null;
  queue: MusicTrack[];
  history: MusicTrack[];
  playerState: PlayerState;
  currentTime: number;
  volume: number;
  audioElement: HTMLAudioElement | null;

  // Actions
  setCurrentTrack: (track: MusicTrack | null) => void;
  playTrack: (track: MusicTrack) => void;
  togglePlayPause: () => void;
  pause: () => void;
  play: () => void;
  stop: () => void;
  nextTrack: () => void;
  previousTrack: () => void;
  addToQueue: (track: MusicTrack) => void;
  removeFromQueue: (trackId: string) => void;
  clearQueue: () => void;
  setVolume: (volume: number) => void;
  setCurrentTime: (time: number) => void;
  seek: (time: number) => void;
  initAudioElement: () => void;
}

export const useMusicPlayerStore = create<MusicPlayerStore>()(
  persist(
    (set, get) => ({
      currentTrack: null,
      queue: [],
      history: [],
      playerState: 'stopped',
      currentTime: 0,
      volume: 0.7,
      audioElement: null,

      initAudioElement: () => {
        const audio = new Audio();
        audio.volume = get().volume;
        
        audio.addEventListener('ended', () => {
          const store = get();
          if (store.queue.length > 0) {
            store.nextTrack();
          } else {
            set({ playerState: 'stopped', currentTime: 0 });
          }
        });

        audio.addEventListener('timeupdate', () => {
          set({ currentTime: audio.currentTime });
        });

        audio.addEventListener('error', (e) => {
          console.error('Audio playback error:', e);
          set({ playerState: 'stopped' });
        });

        set({ audioElement: audio });
      },

      setCurrentTrack: (track) => {
        const audio = get().audioElement;
        if (!audio) {
          get().initAudioElement();
        }

        set({ currentTrack: track });
        
        if (track) {
          // Add to history (avoid duplicates at the end)
          const history = get().history;
          const lastTrack = history[history.length - 1];
          if (!lastTrack || lastTrack.id !== track.id) {
            set({ history: [...history, track].slice(-50) }); // Keep last 50
          }
        }
      },

      playTrack: (track) => {
        const audio = get().audioElement;
        if (!audio) {
          get().initAudioElement();
        }

        const audioEl = get().audioElement!;
        
        // Check if track has preview URL
        if (track.previewUrl) {
          audioEl.src = track.previewUrl;
          audioEl.load();
          
          audioEl.play()
            .then(() => {
              set({ 
                currentTrack: track,
                playerState: 'playing',
                currentTime: 0,
              });
              
              // Add to history
              const history = get().history;
              const lastTrack = history[history.length - 1];
              if (!lastTrack || lastTrack.id !== track.id) {
                set({ history: [...history, track].slice(-50) });
              }
            })
            .catch((error) => {
              console.error('Playback failed:', error);
              // If preview fails, open Spotify URL
              if (track.spotifyUrl) {
                window.open(track.spotifyUrl, '_blank');
              }
              set({ playerState: 'stopped' });
            });
        } else {
          // No preview available, open in Spotify
          if (track.spotifyUrl) {
            window.open(track.spotifyUrl, '_blank');
          }
          set({ currentTrack: track, playerState: 'stopped' });
        }
      },

      togglePlayPause: () => {
        const { playerState, currentTrack, audioElement } = get();
        
        if (!audioElement || !currentTrack) return;

        if (playerState === 'playing') {
          audioElement.pause();
          set({ playerState: 'paused' });
        } else if (playerState === 'paused') {
          audioElement.play().catch(console.error);
          set({ playerState: 'playing' });
        } else {
          // Stopped, play current track
          get().playTrack(currentTrack);
        }
      },

      pause: () => {
        const audio = get().audioElement;
        if (audio) {
          audio.pause();
          set({ playerState: 'paused' });
        }
      },

      play: () => {
        const { audioElement, currentTrack } = get();
        if (audioElement && currentTrack) {
          audioElement.play()
            .then(() => set({ playerState: 'playing' }))
            .catch(console.error);
        }
      },

      stop: () => {
        const audio = get().audioElement;
        if (audio) {
          audio.pause();
          audio.currentTime = 0;
          set({ playerState: 'stopped', currentTime: 0 });
        }
      },

      nextTrack: () => {
        const { queue } = get();
        if (queue.length > 0) {
          const nextTrack = queue[0];
          set({ queue: queue.slice(1) });
          get().playTrack(nextTrack);
        }
      },

      previousTrack: () => {
        const { history, currentTime, audioElement } = get();
        
        // If we're more than 3 seconds into the track, restart it
        if (currentTime > 3 && audioElement) {
          audioElement.currentTime = 0;
          return;
        }

        // Otherwise, go to previous track in history
        if (history.length > 1) {
          const previousTrack = history[history.length - 2];
          set({ history: history.slice(0, -1) });
          get().playTrack(previousTrack);
        }
      },

      addToQueue: (track) => {
        set({ queue: [...get().queue, track] });
      },

      removeFromQueue: (trackId) => {
        set({ queue: get().queue.filter((t) => t.id !== trackId) });
      },

      clearQueue: () => {
        set({ queue: [] });
      },

      setVolume: (volume) => {
        const audio = get().audioElement;
        const clampedVolume = Math.max(0, Math.min(1, volume));
        if (audio) {
          audio.volume = clampedVolume;
        }
        set({ volume: clampedVolume });
      },

      setCurrentTime: (time) => {
        set({ currentTime: time });
      },

      seek: (time) => {
        const audio = get().audioElement;
        if (audio) {
          audio.currentTime = time;
          set({ currentTime: time });
        }
      },
    }),
    {
      name: 'music-player-storage',
      partialize: (state) => ({
        // Only persist these fields
        currentTrack: state.currentTrack,
        queue: state.queue,
        history: state.history,
        volume: state.volume,
      }),
    },
  ),
);

// Initialize audio element on first use
if (typeof window !== 'undefined') {
  const store = useMusicPlayerStore.getState();
  if (!store.audioElement) {
    store.initAudioElement();
  }
}

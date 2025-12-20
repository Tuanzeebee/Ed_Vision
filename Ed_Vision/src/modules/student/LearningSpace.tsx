import { useState, useEffect, lazy, Suspense, useCallback, useMemo, useTransition, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Toaster, toast } from 'react-hot-toast';
import type { SoundType, Track, JournalEntry } from './types/learningSpace';
import type { LiveTheme } from '@/data/liveThemes';
import { getLiveThemeById } from '@/data/liveThemes';
import { loadThemeState, saveThemeState } from '@/lib/themeStorage';
import { useLearningSpacePreloader, usePanelPrefetcher } from '@/hooks/useLearningSpacePreloader';
import ClockDisplay from './components/ClockDisplay';
import DockMenu from './components/DockMenu';
import SnowEffect from './components/SnowEffect';
import RainEffect from './components/RainEffect';

// Lazy load heavy components
const MusicWidget = lazy(() => import('./components/MusicWidget'));
const PomodoroPanel = lazy(() => import('./components/PomodoroPanel'));
const PomodoroOverlay = lazy(() => import('./components/PomodoroOverlay'));
const PomodoroCompactWidget = lazy(() => import('./components/PomodoroCompactWidget'));
const ExplosionEffect = lazy(() => import('./components/ExplosionEffect'));
const ConfettiEffect = lazy(() => import('./components/ConfettiEffect'));
const AmbiencePanel = lazy(() => import('./components/AmbiencePanel'));
const ThemePanel = lazy(() => import('./components/ThemePanel'));
const MusicPanel = lazy(() => import('./components/MusicPanel'));
const JournalPanel = lazy(() => import('./components/JournalPanel'));
const RoomPanel = lazy(() => import('./components/RoomPanel'));
const SettingsPanel = lazy(() => import('./components/SettingsPanel'));
const LearningMapPanel = lazy(() => import('./components/LearningMapPanel'));
const VideoCallRoom = lazy(() => import('./components/VideoCallRoom'));
const LearningModulePanel = lazy(() => import('./components/LearningModulePanel'));
const YouTubeBackground = lazy(() => import('./components/YouTubeBackground'));

type Props = {
  className?: string;
};

// Sound URLs mapping
const SOUND_URLS: Record<SoundType, string> = {
  rain: 'https://static.wixstatic.com/mp3/3d08de_0c9159454b04482c8032ac56dc427314.mp3',
  birds: 'https://static.wixstatic.com/mp3/3d08de_24a228e2b84f4afaade5486edd484d90.mp3',
  campfire: 'https://static.wixstatic.com/mp3/3d08de_0948c4b3598f413294d31676194a3149.mp3',
  waves: 'https://static.wixstatic.com/mp3/3d08de_30e42bff6e614ea5b03d8819ebedb688.mp3',
  thunderstorm: 'https://orangefreesounds.com/wp-content/uploads/2025/12/Distant-storm-thunder-sound-effect.mp3',
  keyboard: 'https://www.chosic.com/wp-content/uploads/2021/09/Keyboard-Typing(chosic.com).mp3',
  cafe: 'https://www.zapsplat.com/wp-content/uploads/2015/sound-effects-glitched-tones/glitched_tones_coffee_machine_334.mp3',
  'wind-chimes': 'https://cdn.uppbeat.io/audio-files/c24ff33df632944a432b6a23b261de86/ff0bf2b30ae6824a5cbc0ed1e07a6cbe/5c7e6c8ec34c8df3832d3fa09f6b78d4/STREAMING-wind-chimes-with-ambient-drones-aroshanti-light-with-nature-4-01-24.mp3',
  'singing-bowl': 'https://cdn.pixabay.com/download/audio/2022/01/18/audio_d0a13f69d0.mp3',
  'white-noise': 'https://cdn.pixabay.com/download/audio/2022/03/24/audio_0788523c6f.mp3',
  crickets: 'https://assets.mixkit.co/sfx/preview/mixkit-crickets-and-insects-in-the-wild-ambience-39.mp3',
};

export default function LearningSpace({ className = '' }: Props) {
  const navigate = useNavigate();
  const [isPending, startTransition] = useTransition();
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  
  // Weather effects
  const [showSnow, setShowSnow] = useState(true);
  const [showRain, setShowRain] = useState(false);

  // Panel visibility
  const [pomoVisible, setPomoVisible] = useState(false);
  const [pomoOverlayVisible, setPomoOverlayVisible] = useState(false);
  const [pomoCompactVisible, setPomoCompactVisible] = useState(false);
  const [pomoViewMode, setPomoViewMode] = useState<'spotlight' | 'minimalist'>('spotlight');
  const prevRunningRef = useRef(false);
  const [pomoFocusTitle, setPomoFocusTitle] = useState('');
  const [pomoTimeLeft, setPomoTimeLeft] = useState(0);
  const [pomoTotalTime, setPomoTotalTime] = useState(0);
  const [pomoRunning, setPomoRunning] = useState(false);
  const [pomoJustStopped, setPomoJustStopped] = useState(false);
  const [showExplosion, setShowExplosion] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [ambienceVisible, setAmbienceVisible] = useState(false);
  const [themeVisible, setThemeVisible] = useState(false);
  const [musicPanelVisible, setMusicPanelVisible] = useState(false);
  const [journalVisible, setJournalVisible] = useState(false);
  const [roomVisible, setRoomVisible] = useState(false);
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [learningMapVisible, setLearningMapVisible] = useState(false);
  const [videoCallVisible, setVideoCallVisible] = useState(false);
  const [currentRoomTitle, setCurrentRoomTitle] = useState('');
  const [learningModuleVisible, setLearningModuleVisible] = useState(false);
  const [selectedModuleId, setSelectedModuleId] = useState<number | null>(null);
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);

  // Music widget
  const [musicWidgetVisible, setMusicWidgetVisible] = useState(true);
  const [currentTrack, setCurrentTrack] = useState<Track | undefined>();

  // Ambience - Multi-sound support
  const [soundVolumes, setSoundVolumes] = useState<Record<SoundType, number>>({
    rain: 0,
    birds: 0,
    campfire: 0,
    waves: 0,
    thunderstorm: 0,
    keyboard: 0,
    cafe: 0,
    'wind-chimes': 0,
    'singing-bowl': 0,
    'white-noise': 0,
    crickets: 0,
  });
  
  // Refs for audio elements to manage multiple sounds
  const audioRefs = useRef<Partial<Record<SoundType, HTMLAudioElement>>>({});

  // Background & Live Theme - Initialize with cached values immediately
  const [backgroundImage, setBackgroundImage] = useState(() => {
    const cached = loadThemeState();
    return cached.backgroundImage || 'https://images.unsplash.com/photo-1519904981063-b0cf448d479e?w=1920&h=1080&fit=crop';
  });
  const [activeLiveTheme, setActiveLiveTheme] = useState<LiveTheme | null>(null);
  const [liveEnabled, setLiveEnabled] = useState(() => loadThemeState().liveEnabled);
  const [videoMuted, setVideoMuted] = useState(() => loadThemeState().videoMuted ?? true);
  const [videoVolume, setVideoVolume] = useState(() => loadThemeState().videoVolume ?? 70);

  // Handle Ambience Sounds
  useEffect(() => {
    Object.entries(soundVolumes).forEach(([type, volume]) => {
      const soundType = type as SoundType;
      
      // Initialize audio element if not exists
      if (!audioRefs.current[soundType]) {
        audioRefs.current[soundType] = new Audio(SOUND_URLS[soundType]);
        audioRefs.current[soundType]!.loop = true;
      }

      const audio = audioRefs.current[soundType]!;

      // Update volume
      audio.volume = volume / 100;

      // Play or pause based on volume
      if (volume > 0) {
        if (audio.paused) {
          audio.play().catch(e => console.log(`Audio playback failed for ${soundType}:`, e));
        }
      } else {
        if (!audio.paused) {
          audio.pause();
          audio.currentTime = 0; // Reset to beginning when stopped
        }
      }
    });
  }, [soundVolumes]);

  const handleSoundVolumeChange = useCallback((sound: SoundType, volume: number) => {
    setSoundVolumes(prev => ({
      ...prev,
      [sound]: volume
    }));
  }, []);

  // Load theme state asynchronously to avoid blocking render
  useEffect(() => {
    let isMounted = true;
    
    const loadThemeAsync = async () => {
      try {
        // Simulate async loading with requestIdleCallback for better performance
        await new Promise<void>((resolve) => {
          if ('requestIdleCallback' in window) {
            requestIdleCallback(() => resolve());
          } else {
            setTimeout(() => resolve(), 0);
          }
        });

        if (!isMounted) return;

        const savedState = loadThemeState();
        
        // Load active live theme if saved
        if (savedState.activeLiveThemeId && savedState.liveEnabled) {
          const theme = getLiveThemeById(savedState.activeLiveThemeId);
          if (theme && isMounted) {
            setActiveLiveTheme(theme);
          }
        }
        
        setIsInitialLoading(false);
      } catch (error) {
        console.error('Error loading theme state:', error);
        setIsInitialLoading(false);
      }
    };

    loadThemeAsync();

    return () => {
      isMounted = false;
    };
  }, []);

  // Debounced save to localStorage using useTransition for non-blocking updates
  useEffect(() => {
    if (isInitialLoading) return;

    const saveTimeout = setTimeout(() => {
      startTransition(() => {
        saveThemeState({
          activeLiveThemeId: activeLiveTheme?.id || null,
          liveEnabled,
          backgroundImage,
          videoMuted,
          videoVolume,
        });
      });
    }, 300); // Debounce 300ms

    return () => clearTimeout(saveTimeout);
  }, [activeLiveTheme, liveEnabled, backgroundImage, videoMuted, videoVolume, isInitialLoading]);

  // Journal entries - lazy load from localStorage
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>(() => {
    try {
      const saved = localStorage.getItem('ed-vision-journal-entries');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Tracks - empty by default, can be populated later
  const [tracks] = useState<Track[]>([]);

  // Preload critical resources
  useLearningSpacePreloader();
  usePanelPrefetcher();

  // Memoized callbacks for better performance
  const closeAllPanels = useCallback(() => {
    setAmbienceVisible(false);
    setThemeVisible(false);
    setMusicPanelVisible(false);
    setJournalVisible(false);
    setSettingsVisible(false);
    setLearningMapVisible(false);
    setLearningModuleVisible(false);
    // Don't close pomodoro panel here
  }, []);

  const openPanel = useCallback((panel: string) => {
    // Close other panels but keep pomo if overlay is running
    if (panel === 'pomo') {
      // Just open pomo, don't close it
      setPomoVisible(true);
      // Close other panels
      setAmbienceVisible(false);
      setThemeVisible(false);
      setMusicPanelVisible(false);
      setJournalVisible(false);
      setSettingsVisible(false);
      setLearningMapVisible(false);
      setLearningModuleVisible(false);
    } else {
      // Close all panels including pomo for other panels
      setPomoVisible(false);
      closeAllPanels();
      
      switch (panel) {
        case 'ambience':
          setAmbienceVisible(true);
          break;
        case 'theme':
          setThemeVisible(true);
          break;
        case 'room':
          setRoomVisible(true);
          break;
        case 'music':
          setMusicPanelVisible(true);
          break;
        case 'journal':
          setJournalVisible(true);
          break;
        case 'settings':
          setSettingsVisible(true);
          break;
        case 'map':
          setLearningMapVisible(true);
          break;
        case 'learn':
          setLearningModuleVisible(true);
          break;
      }
    }
  }, [closeAllPanels]);

  // Memoize dock items to prevent unnecessary re-renders
  const dockItems = useMemo(() => [
    { id: 'home', icon: 'fas fa-home', label: 'Home', onClick: () => navigate('/student/instructions') },
    { id: 'theme', icon: 'fas fa-image', label: 'Theme', onClick: () => openPanel('theme') },
    { id: 'ambience', icon: 'fas fa-cloud-rain', label: 'Ambience', onClick: () => openPanel('ambience') },
    { id: 'room', icon: 'fas fa-video', label: 'Room', onClick: () => openPanel('room') },
    { id: 'pomo', icon: 'fas fa-clock', label: 'Pomo', onClick: () => openPanel('pomo') },
    { id: 'music', icon: 'fas fa-music', label: 'Music', onClick: () => openPanel('music') },
    { id: 'map', icon: 'fas fa-map', label: 'Learning Map', onClick: () => openPanel('map') },
    { id: 'learn', icon: 'fas fa-tv', label: 'Learn', onClick: () => openPanel('learn') },
    { id: 'settings', icon: 'fas fa-cog', label: 'Settings', onClick: () => openPanel('settings') },
  ], [navigate, openPanel]);

  const handleChangeBackground = useCallback((url: string) => {
    setBackgroundImage(url);
    setLiveEnabled(false);
    setActiveLiveTheme(null);
  }, []);

  const handleSelectLiveTheme = useCallback((theme: LiveTheme) => {
    setActiveLiveTheme(theme);
    setLiveEnabled(true);
    setThemeVisible(false);
  }, []);

  const handleUploadBackground = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        setBackgroundImage(e.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  }, []);

  const handleSelectTrack = useCallback((track: Track) => {
    setCurrentTrack(track);
    setMusicWidgetVisible(true);
    setMusicPanelVisible(false);
  }, []);

  const handleSaveJournalEntry = useCallback((entry: Omit<JournalEntry, 'id'>) => {
    const newEntry: JournalEntry = {
      ...entry,
      id: Date.now().toString(),
    };
    const updatedEntries = [newEntry, ...journalEntries];
    setJournalEntries(updatedEntries);
    
    // Save to localStorage asynchronously
    requestIdleCallback(() => {
      try {
        localStorage.setItem('ed-vision-journal-entries', JSON.stringify(updatedEntries));
      } catch (error) {
        console.error('Error saving journal entries:', error);
      }
    });
  }, [journalEntries]);

  const handleResetAnimations = useCallback(() => {
    setShowRain(false);
    setShowSnow(true);
  }, []);

  useEffect(() => {
    // Expose title updater to window for overlay
    (window as any).__pomoUpdateTitleHandler = (newTitle: string) => {
      setPomoFocusTitle(newTitle);
    };

    return () => {
      delete (window as any).__pomoUpdateTitleHandler;
    };
  }, []);

  const handlePomoStart = useCallback((isRunning: boolean, title: string, timeLeft: number, totalTime: number) => {
    setPomoTimeLeft(timeLeft);
    setPomoTotalTime(totalTime);
    setPomoRunning(isRunning);
    const wasRunning = prevRunningRef.current;
    if (isRunning && !wasRunning) {
      setPomoFocusTitle(title);
      if (pomoViewMode === 'spotlight') {
        if (!pomoOverlayVisible) {
          setPomoOverlayVisible(true);
        }
        setPomoCompactVisible(false);
        setPomoVisible(false);
      } else {
        setPomoOverlayVisible(false);
        setPomoCompactVisible(true);
        setPomoVisible(false);
      }
    }
    prevRunningRef.current = isRunning;
  }, [pomoOverlayVisible, pomoViewMode]);

  useEffect(() => {
    if (pomoJustStopped) return;
    // Only consider active if running OR if paused but time has elapsed (not at start/reset state)
    const isActive = pomoRunning || (pomoTotalTime > 0 && pomoTimeLeft < pomoTotalTime && pomoTimeLeft > 0);
    if (!isActive) return;
    if (pomoViewMode === 'spotlight') {
      setPomoOverlayVisible(true);
      setPomoCompactVisible(false);
    } else {
      setPomoOverlayVisible(false);
      setPomoCompactVisible(true);
    }
  }, [pomoViewMode, pomoRunning, pomoTotalTime, pomoTimeLeft, pomoJustStopped]);

  useEffect(() => {
    if (pomoRunning && pomoJustStopped) {
      setPomoJustStopped(false);
      return;
    }
    const isActive = pomoRunning || (pomoTotalTime > 0 && pomoTimeLeft < pomoTotalTime && pomoTimeLeft > 0);
    if (!isActive && pomoJustStopped) {
      setPomoJustStopped(false);
    }
  }, [pomoRunning, pomoTimeLeft, pomoTotalTime, pomoJustStopped]);

  const handleModuleClick = useCallback((moduleId: number, courseId: string) => {
    setSelectedModuleId(moduleId);
    setSelectedCourseId(courseId);
    setLearningMapVisible(false);
    setLearningModuleVisible(true);
  }, []);

  // Memoize background style for performance
  const backgroundStyle = useMemo(() => ({
    backgroundImage: liveEnabled && activeLiveTheme ? 'none' : `url('${backgroundImage}')`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
  }), [liveEnabled, activeLiveTheme, backgroundImage]);

  return (
    <div
      className={`min-h-screen overflow-hidden relative ${className}`}
      style={backgroundStyle}
    >
      <Toaster 
        position="top-center"
        toastOptions={{
          duration: 2000,
          style: {
            background: '#333',
            color: '#fff',
            borderRadius: '10px',
            fontSize: '14px',
          },
        }}
      />
      {/* YouTube Live Background - Lazy loaded */}
      {liveEnabled && activeLiveTheme && (
        <Suspense fallback={<div className="fixed inset-0 bg-black/20 animate-pulse" />}>
          <YouTubeBackground
            videoId={activeLiveTheme.youtubeVideoId}
            start={activeLiveTheme.start}
            muted={videoMuted}
            volume={videoVolume}
            end={activeLiveTheme.end}
          />
        </Suspense>
      )}

      {/* Weather Effects - Lightweight, no Suspense needed */}
      <SnowEffect show={showSnow} />
      <RainEffect show={showRain} />

      {/* Pomodoro Overlay */}
      {pomoOverlayVisible && (
        <Suspense fallback={null}>
          <PomodoroOverlay
            visible={pomoOverlayVisible}
            focusTitle={pomoFocusTitle}
            timeLeft={pomoTimeLeft}
            totalTime={pomoTotalTime}
            isRunning={pomoRunning}
            onClose={() => setPomoOverlayVisible(false)}
            onOpenPanel={() => setPomoVisible(true)}
            onPause={() => {
              // Handle pause/resume
              if ((window as any).__pomoToggleHandler) {
                (window as any).__pomoToggleHandler();
              }
              // Don't open panel on pause anymore, stay on overlay
            }}
            onStop={() => {
              // Mark just stopped to avoid re-open race
              setPomoJustStopped(true);
              // Close UI immediately
              setPomoOverlayVisible(false);
              // Stop the timer in panel
              if ((window as any).__pomoStopHandler) {
                (window as any).__pomoStopHandler();
              }
              setShowExplosion(true);
            }}
            onAddTime={(amount) => {
              // Ensure we check for the handler on window
              const adjustHandler = (window as any).__pomoAdjustTimeHandler;
              
              if (amount < 0 && (pomoTimeLeft + amount) <= 0) {
                toast.error("Không thể giảm thời gian về 0 hoặc thấp hơn!", {
                  id: 'pomo-min-limit'
                });
                return;
              }

              if (adjustHandler) {
                adjustHandler(amount);
              } else {
                console.warn('Pomodoro adjust handler not found on window');
              }
            }}
          />
        </Suspense>
      )}

      {/* Pomodoro Compact Widget */}
      {pomoCompactVisible && (
        <Suspense fallback={null}>
          <PomodoroCompactWidget
            visible={pomoCompactVisible}
            focusTitle={pomoFocusTitle}
            timeLeft={pomoTimeLeft}
            totalTime={pomoTotalTime}
            isRunning={pomoRunning}
            onPause={() => {
              if ((window as any).__pomoToggleHandler) {
                (window as any).__pomoToggleHandler();
              }
            }}
            onStop={() => {
              setPomoJustStopped(true);
              setPomoCompactVisible(false);
              if ((window as any).__pomoStopHandler) {
                (window as any).__pomoStopHandler();
              }
            }}
          />
        </Suspense>
      )}

      {/* Explosion Effect */}
      {showExplosion && (
        <Suspense fallback={null}>
          <ExplosionEffect
            visible={showExplosion}
            onComplete={() => {
              setShowExplosion(false);
              setShowConfetti(true);
            }}
          />
        </Suspense>
      )}

      {/* Confetti Effect */}
      {showConfetti && (
        <Suspense fallback={null}>
          <ConfettiEffect
            visible={showConfetti}
            onComplete={() => {
              setShowConfetti(false);
            }}
          />
        </Suspense>
      )}

      {/* Clock Display - Lightweight, always visible */}
      <ClockDisplay />

      {/* Dock Menu - Lightweight, always visible */}
      <DockMenu items={dockItems} />

      {/* Music Widget - Hidden when MusicPanel is open */}
      {musicWidgetVisible && !musicPanelVisible && (
        <Suspense fallback={null}>
          <MusicWidget
            visible={musicWidgetVisible && !musicPanelVisible}
            onClose={() => setMusicWidgetVisible(false)}
            currentTrack={currentTrack}
          />
        </Suspense>
      )}

      {/* Pomodoro Panel - Always mounted to keep timer state */}
      <Suspense fallback={null}>
        <PomodoroPanel
          visible={pomoVisible}
          onClose={() => setPomoVisible(false)}
          onStartTimer={handlePomoStart}
          onStopTimer={() => {
            setPomoOverlayVisible(false);
            setPomoCompactVisible(false);
            setPomoVisible(true);
          }}
          onViewModeChange={(m) => setPomoViewMode(m)}
        />
      </Suspense>

      {/* Ambience Panel */}
      {ambienceVisible && (
        <Suspense fallback={null}>
          <AmbiencePanel
            visible={ambienceVisible}
            onClose={() => setAmbienceVisible(false)}
            soundVolumes={soundVolumes}
            onSoundVolumeChange={handleSoundVolumeChange}
            showRain={showRain}
            showSnow={showSnow}
            onToggleRain={() => setShowRain(!showRain)}
            onToggleSnow={() => setShowSnow(!showSnow)}
            onResetAnimations={handleResetAnimations}
          />
        </Suspense>
      )}

      {/* Theme Panel */}
      {themeVisible && (
        <Suspense fallback={null}>
          <ThemePanel
            visible={themeVisible}
            onClose={() => setThemeVisible(false)}
            onChangeBackground={handleChangeBackground}
            onUploadBackground={handleUploadBackground}
            onSelectLiveTheme={handleSelectLiveTheme}
            videoMuted={videoMuted}
            onToggleVideoMute={() => setVideoMuted(!videoMuted)}
            videoVolume={videoVolume}
            onVolumeChange={setVideoVolume}
          />
        </Suspense>
      )}

      {/* Room Panel */}
      {roomVisible && (
        <Suspense fallback={null}>
          <RoomPanel
            visible={roomVisible}
            onClose={() => setRoomVisible(false)}
            onSelectRoom={(url) => {
              setBackgroundImage(url);
              setRoomVisible(false);
            }}
            onJoinCall={(roomTitle) => {
              setCurrentRoomTitle(roomTitle);
              setVideoCallVisible(true);
            }}
          />
        </Suspense>
      )}

      {/* Music Panel */}
      {musicPanelVisible && (
        <Suspense fallback={null}>
          <MusicPanel
            visible={musicPanelVisible}
            onClose={() => setMusicPanelVisible(false)}
            tracks={tracks}
            onSelectTrack={handleSelectTrack}
          />
        </Suspense>
      )}

      {/* Journal Panel */}
      {journalVisible && (
        <Suspense fallback={null}>
          <JournalPanel
            visible={journalVisible}
            onClose={() => setJournalVisible(false)}
            onSaveEntry={handleSaveJournalEntry}
            recentEntries={journalEntries}
          />
        </Suspense>
      )}

      {/* Settings Panel */}
      {settingsVisible && (
        <Suspense fallback={null}>
          <SettingsPanel
            visible={settingsVisible}
            onClose={() => setSettingsVisible(false)}
          />
        </Suspense>
      )}

      {/* Learning Map Panel */}
      {learningMapVisible && (
        <Suspense fallback={null}>
          <LearningMapPanel
            visible={learningMapVisible}
            onClose={() => setLearningMapVisible(false)}
            onModuleClick={handleModuleClick}
          />
        </Suspense>
      )}

      {/* Learning Module Panel */}
      {learningModuleVisible && (
        <Suspense fallback={null}>
          <LearningModulePanel
            visible={learningModuleVisible}
            onClose={() => setLearningModuleVisible(false)}
            onCompleteModule={() => {
              // Close module panel and open map panel to show animation
              setLearningModuleVisible(false);
              setLearningMapVisible(true);
            }}
          />
        </Suspense>
      )}

      {/* Video Call Room */}
      {videoCallVisible && (
        <Suspense fallback={null}>
          <VideoCallRoom
            visible={videoCallVisible}
            onClose={() => setVideoCallVisible(false)}
            roomTitle={currentRoomTitle}
          />
        </Suspense>
      )}

      {/* Font Awesome CDN - Required for icons */}
      <link
        rel="stylesheet"
        href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
      />
    </div>
  );
}

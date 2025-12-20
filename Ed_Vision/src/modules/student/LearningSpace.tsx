import { useState, useEffect, lazy, Suspense, useCallback, useMemo, useTransition } from 'react';
import { useNavigate } from 'react-router-dom';
import type { SoundType, Track, JournalEntry } from './types/learningSpace';
import type { LiveTheme } from '@/data/liveThemes';
import { getLiveThemeById } from '@/data/liveThemes';
import { loadThemeState, saveThemeState } from '@/lib/themeStorage';
import { useLearningSpacePreloader, usePanelPrefetcher } from '@/hooks/useLearningSpacePreloader';
import ClockDisplay from './components/ClockDisplay';
import DockMenu from './components/DockMenu';
import SnowEffect from './components/SnowEffect';
import RainEffect from './components/RainEffect';
import { MusicPlayerProvider } from './music/MusicPlayerContext';

// Lazy load heavy components
const MusicWidget = lazy(() => import('./components/MusicWidget'));
const PomodoroPanel = lazy(() => import('./components/PomodoroPanel'));
const PomodoroOverlay = lazy(() => import('./components/PomodoroOverlay'));
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
  const [pomoFocusTitle, setPomoFocusTitle] = useState('');
  const [pomoTimeLeft, setPomoTimeLeft] = useState(0);
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

  // Ambience
  const [selectedSound, setSelectedSound] = useState<SoundType | null>('rain');
  const [soundVolume, setSoundVolume] = useState(70);

  // Background & Live Theme - Initialize with cached values immediately
  const [backgroundImage, setBackgroundImage] = useState(() => {
    const cached = loadThemeState();
    return cached.backgroundImage || 'https://images.unsplash.com/photo-1519904981063-b0cf448d479e?w=1920&h=1080&fit=crop';
  });
  const [activeLiveTheme, setActiveLiveTheme] = useState<LiveTheme | null>(null);
  const [liveEnabled, setLiveEnabled] = useState(() => loadThemeState().liveEnabled);
  const [videoMuted, setVideoMuted] = useState(() => loadThemeState().videoMuted ?? true);
  const [videoVolume, setVideoVolume] = useState(() => loadThemeState().videoVolume ?? 70);

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

  const handlePomoStart = useCallback((isRunning: boolean, title: string, timeLeft: number) => {
    setPomoTimeLeft(timeLeft);
    if (isRunning) {
      setPomoFocusTitle(title);
      setPomoOverlayVisible(true);
      setPomoVisible(false); // Close panel when timer starts
    } else {
      setPomoOverlayVisible(false);
    }
  }, []);

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
    <MusicPlayerProvider>
    <div
      className={`min-h-screen overflow-hidden relative ${className}`}
      style={backgroundStyle}
    >
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
            onClose={() => setPomoOverlayVisible(false)}
            onOpenPanel={() => setPomoVisible(true)}
            onPause={() => {
              // Handle pause/resume
              setPomoVisible(true);
            }}
            onStop={() => {
              // Stop the timer in panel
              if ((window as any).__pomoStopHandler) {
                (window as any).__pomoStopHandler();
              }
              setPomoOverlayVisible(false);
              setShowExplosion(true);
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
              setPomoVisible(true);
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
          />
        </Suspense>
      )}

      {/* Pomodoro Panel */}
      {pomoVisible && (
        <Suspense fallback={null}>
          <PomodoroPanel
            visible={pomoVisible}
            onClose={() => setPomoVisible(false)}
            onStartTimer={handlePomoStart}
            onStopTimer={() => {
              setPomoOverlayVisible(false);
              setPomoVisible(true);
            }}
          />
        </Suspense>
      )}

      {/* Ambience Panel */}
      {ambienceVisible && (
        <Suspense fallback={null}>
          <AmbiencePanel
            visible={ambienceVisible}
            onClose={() => setAmbienceVisible(false)}
            selectedSound={selectedSound}
            onSelectSound={setSelectedSound}
            soundVolume={soundVolume}
            onVolumeChange={setSoundVolume}
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
        <Suspense fallback={
          <div className="fixed inset-0 z-40 flex items-center justify-center">
            <div className="backdrop-blur-[20px] bg-white/10 border border-white/20 rounded-3xl shadow-2xl p-8">
              <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-white/20 border-t-purple-500 rounded-full animate-spin"></div>
                <span className="text-white/80 text-sm">Loading Music Panel...</span>
              </div>
            </div>
          </div>
        }>
          <MusicPanel
            visible={musicPanelVisible}
            onClose={() => setMusicPanelVisible(false)}
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
    </MusicPlayerProvider>
  );
}

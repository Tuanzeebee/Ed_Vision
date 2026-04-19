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
import FirefliesEffect from './components/FirefliesEffect';
import LeavesEffect from './components/LeavesEffect';
import StarsEffect from './components/StarsEffect';
import CloudsEffect from './components/CloudsEffect';
import { MusicPlayerProvider } from './music/MusicPlayerContext';
import MusicWidgetWrapper from './components/MusicWidgetWrapper';

// Lazy load heavy components
const PomodoroPanel = lazy(() =>import('./components/PomodoroPanel'));
const PomodoroOverlay = lazy(() =>import('./components/PomodoroOverlay'));
const PomodoroCompactWidget = lazy(() =>import('./components/PomodoroCompactWidget'));
const ExplosionEffect = lazy(() =>import('./components/ExplosionEffect'));
const ConfettiEffect = lazy(() =>import('./components/ConfettiEffect'));
const AmbiencePanel = lazy(() =>import('./components/AmbiencePanel'));
const ThemePanel = lazy(() =>import('./components/ThemePanel'));
const MusicPanel = lazy(() =>import('./components/MusicPanel'));
const JournalPanel = lazy(() =>import('./components/JournalPanel'));
const RoomPanel = lazy(() =>import('./components/RoomPanel'));
const SettingsPanel = lazy(() =>import('./components/SettingsPanel'));
const LearningMapPanel = lazy(() =>import('./components/LearningMapPanel'));
const VideoCallRoom = lazy(() =>import('./components/VideoCallRoom'));
const LearningModulePanel = lazy(() =>import('./components/LearningModulePanel'));
const YouTubeBackground = lazy(() =>import('./components/YouTubeBackground'));

type Props = {
  className?: string;
};

// Sound URLs mapping
const SOUND_URLS: Record<SoundType, string>= {
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
  forest: 'https://cdn.pixabay.com/download/audio/2022/02/22/audio_d1718ab41b.mp3',
  wind: 'https://cdn.pixabay.com/download/audio/2021/08/09/audio_dc39bde808.mp3',
  river: 'https://cdn.pixabay.com/download/audio/2022/01/20/audio_7e3b1ff3b1.mp3',
  owl: 'https://cdn.pixabay.com/download/audio/2021/08/04/audio_c518e55634.mp3',
  city: 'https://cdn.pixabay.com/download/audio/2022/03/10/audio_270f49fb4c.mp3',
  clock: 'https://cdn.pixabay.com/download/audio/2021/08/04/audio_12b0c7443c.mp3',
  fan: 'https://cdn.pixabay.com/download/audio/2022/03/15/audio_8cb749ddd5.mp3',
  train: 'https://cdn.pixabay.com/download/audio/2022/03/24/audio_4986a8125c.mp3',
};

const CLICK_SOUND_STORAGE_KEYS = {
  ENABLED: 'ed-vision-click-sound-enabled',
  FILE: 'ed-vision-click-sound-file',
  VOLUME: 'ed-vision-click-sound-volume',
} as const;

const CLICK_SOUND_FILE_NAMES = [
  'abstract1',
  'abstract2',
  'african1',
  'african2',
  'african3',
  'african4',
  'coffee1',
  'coffee2',
  'minimalist1',
  'minimalist10',
  'minimalist11',
  'minimalist12',
  'minimalist13',
  'minimalist2',
  'minimalist3',
  'minimalist4',
  'minimalist5',
  'minimalist6',
  'minimalist7',
  'minimalist8',
  'minimalist9',
  'modern1',
  'modern10',
  'modern11',
  'modern12',
  'modern13',
  'modern14',
  'modern15',
  'modern16',
  'modern2',
  'modern3',
  'modern4',
  'modern5',
  'modern6',
  'modern7',
  'modern8',
  'modern9',
  'retro1',
  'retro10',
  'retro11',
  'retro12',
  'retro2',
  'retro3',
  'retro4',
  'retro5',
  'retro6',
  'retro7',
  'retro8',
  'retro9',
  'wood-block1',
  'wood-block2',
  'wood-block3',
] as const;

const CLICK_SOUND_OPTIONS = CLICK_SOUND_FILE_NAMES.map((name) => ({
  id: name,
  label: name
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' '),
  file: `/sounds/ui/${name}.mp3`,
  description: 'Âm thanh click từ UI Soundpack.',
}));

const DEFAULT_CLICK_SOUND = CLICK_SOUND_OPTIONS.find((option) => option.id === 'minimalist11')?.file || CLICK_SOUND_OPTIONS[0].file;
const DEFAULT_CLICK_SOUND_VOLUME = 40;
const MUSIC_MATCHED_PANEL_WIDTH = 1200;
const MUSIC_MATCHED_PANEL_HEIGHT = 600;
const MAP_PANEL_WIDTH = 1120;
const MAP_PANEL_HEIGHT = 680;
const DAILY_MISSION_CELEBRATION_EVENT = 'edvision-daily-mission-celebration';
const DAILY_MISSION_COIN_BURST = Array.from({ length: 44 }, (_, index) => ({
  id: index,
  left: (index * 23) % 100,
  delay: (index % 11) * 0.09,
  duration: 2.1 + (index % 6) * 0.28,
  size: 14 + (index % 5) * 3,
}));

export default function LearningSpace({ className = '' }: Props) {
  const navigate = useNavigate();
  const [isPending, startTransition] = useTransition();
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const learningSpaceRef = useRef<HTMLDivElement | null>(null);
  const buttonClickSoundRef = useRef<HTMLAudioElement | null>(null);
  const dailyMissionCelebrationTimerRef = useRef<number | null>(null);
  const [clickSoundEnabled, setClickSoundEnabled] = useState(() => {
    try {
      const saved = localStorage.getItem(CLICK_SOUND_STORAGE_KEYS.ENABLED);
      return saved === null ? true : saved === 'true';
    } catch {
      return true;
    }
  });
  const [selectedClickSound, setSelectedClickSound] = useState(() => {
    try {
      const saved = localStorage.getItem(CLICK_SOUND_STORAGE_KEYS.FILE);
      const isSupported = CLICK_SOUND_OPTIONS.some((option) => option.file === saved);
      return isSupported ? (saved as string) : DEFAULT_CLICK_SOUND;
    } catch {
      return DEFAULT_CLICK_SOUND;
    }
  });
  const [clickSoundVolume, setClickSoundVolume] = useState(() => {
    try {
      const saved = localStorage.getItem(CLICK_SOUND_STORAGE_KEYS.VOLUME);
      if (saved === null) return DEFAULT_CLICK_SOUND_VOLUME;
      const parsed = Number(saved);
      if (!Number.isFinite(parsed)) return DEFAULT_CLICK_SOUND_VOLUME;
      return Math.min(100, Math.max(0, parsed));
    } catch {
      return DEFAULT_CLICK_SOUND_VOLUME;
    }
  });
  
  // Weather effects
  const [showSnow, setShowSnow] = useState(true);
  const [showRain, setShowRain] = useState(false);
  const [showFireflies, setShowFireflies] = useState(false);
  const [showLeaves, setShowLeaves] = useState(false);
  const [showStars, setShowStars] = useState(false);
  const [showClouds, setShowClouds] = useState(false);

  // Panel visibility
  const [pomoVisible, setPomoVisible] = useState(false);
  const [pomoOverlayVisible, setPomoOverlayVisible] = useState(false);
  const [pomoCompactVisible, setPomoCompactVisible] = useState(false);
  const [pomoViewMode, setPomoViewMode] = useState<'spotlight'| 'minimalist'>('spotlight');
  const prevRunningRef = useRef(false);
  const [pomoFocusTitle, setPomoFocusTitle] = useState('');
  const [pomoTimeLeft, setPomoTimeLeft] = useState(0);
  const [pomoTotalTime, setPomoTotalTime] = useState(0);
  const [pomoRunning, setPomoRunning] = useState(false);
  const [pomoJustStopped, setPomoJustStopped] = useState(false);
  const [showExplosion, setShowExplosion] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showDailyMissionCelebration, setShowDailyMissionCelebration] = useState(false);
  const [dailyMissionCelebrationMessage, setDailyMissionCelebrationMessage] = useState(
    'Bạn đã hoàn thành nhiệm vụ ngày hôm nay!'
  );
  const [ambienceVisible, setAmbienceVisible] = useState(false);
  const [themeVisible, setThemeVisible] = useState(false);
  const [musicPanelVisible, setMusicPanelVisible] = useState(false);
  const [journalVisible, setJournalVisible] = useState(false);
  const [roomVisible, setRoomVisible] = useState(false);
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [profileVisible, setProfileVisible] = useState(false);
  const [learningMapVisible, setLearningMapVisible] = useState(false);
  const [videoCallVisible, setVideoCallVisible] = useState(false);
  const [currentRoomTitle, setCurrentRoomTitle] = useState('');
  const [currentRoomId, setCurrentRoomId] = useState<number | null>(null);
  const [currentRoomPassword, setCurrentRoomPassword] = useState<string | undefined>(undefined);
  const [currentRoomMicOn, setCurrentRoomMicOn] = useState(false);
  const [currentRoomCameraOn, setCurrentRoomCameraOn] = useState(false);
  const [currentRoomMicDeviceId, setCurrentRoomMicDeviceId] = useState<string | undefined>(undefined);
  const [currentRoomCameraDeviceId, setCurrentRoomCameraDeviceId] = useState<string | undefined>(undefined);
  const [currentRoomParticipantId, setCurrentRoomParticipantId] = useState<number | null>(null);
  const [currentRoomLivekitToken, setCurrentRoomLivekitToken] = useState<string | null>(null);
  const [currentRoomLivekitUrl, setCurrentRoomLivekitUrl] = useState<string | null>(null);
  const [learningModuleVisible, setLearningModuleVisible] = useState(false);
  const [selectedModuleId, setSelectedModuleId] = useState<number | null>(null);
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);

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
    forest: 0,
    wind: 0,
    river: 0,
    owl: 0,
    city: 0,
    clock: 0,
    fan: 0,
    train: 0,
  });
  
  // Refs for audio elements to manage multiple sounds
  const audioRefs = useRef<Partial<Record<SoundType, HTMLAudioElement>>>({});

  // Background & Live Theme - Initialize with cached values immediately
  const [backgroundImage, setBackgroundImage] = useState(() => {
    const cached = loadThemeState();
    return cached.backgroundImage || 'https://images.unsplash.com/photo-1519904981063-b0cf448d479e?w=1920&h=1080&fit=crop';
  });
  const [activeLiveTheme, setActiveLiveTheme] = useState<LiveTheme | null>(null);
  const [liveEnabled, setLiveEnabled] = useState(() =>loadThemeState().liveEnabled);
  const [videoMuted, setVideoMuted] = useState(() =>loadThemeState().videoMuted ?? true);
  const [videoVolume, setVideoVolume] = useState(() =>loadThemeState().videoVolume ?? 70);

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
      if (volume >0) {
        if (audio.paused) {
          audio.play().catch(e =>console.log(`Audio playback failed for ${soundType}:`, e));
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
    setSoundVolumes(prev =>({
      ...prev,
      [sound]: volume
    }));
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(CLICK_SOUND_STORAGE_KEYS.ENABLED, String(clickSoundEnabled));
    } catch {
      // Ignore localStorage write failures.
    }
  }, [clickSoundEnabled]);

  useEffect(() => {
    try {
      localStorage.setItem(CLICK_SOUND_STORAGE_KEYS.FILE, selectedClickSound);
    } catch {
      // Ignore localStorage write failures.
    }
  }, [selectedClickSound]);

  useEffect(() => {
    try {
      localStorage.setItem(CLICK_SOUND_STORAGE_KEYS.VOLUME, String(clickSoundVolume));
    } catch {
      // Ignore localStorage write failures.
    }
  }, [clickSoundVolume]);

  useEffect(() => {
    if (!buttonClickSoundRef.current) {
      buttonClickSoundRef.current = new Audio(selectedClickSound);
      buttonClickSoundRef.current.preload = 'auto';
      buttonClickSoundRef.current.volume = clickSoundVolume / 100;
      return;
    }

    buttonClickSoundRef.current.src = selectedClickSound;
    buttonClickSoundRef.current.volume = clickSoundVolume / 100;
  }, [selectedClickSound, clickSoundVolume]);

  const playLearningSpaceButtonSound = useCallback((soundPath?: string) => {
    if (!clickSoundEnabled) return;

    const playbackVolume = clickSoundVolume / 100;

    if (soundPath && soundPath !== selectedClickSound) {
      const previewSound = new Audio(soundPath);
      previewSound.preload = 'auto';
      previewSound.volume = playbackVolume;
      previewSound.play().catch(() => {
        // Ignore playback failures when browser blocks autoplay.
      });
      return;
    }

    if (!buttonClickSoundRef.current) {
      buttonClickSoundRef.current = new Audio(selectedClickSound);
      buttonClickSoundRef.current.preload = 'auto';
      buttonClickSoundRef.current.volume = playbackVolume;
    }

    buttonClickSoundRef.current.volume = playbackVolume;
    buttonClickSoundRef.current.currentTime = 0;
    buttonClickSoundRef.current.play().catch(() => {
      // Ignore playback failures when browser blocks autoplay.
    });
  }, [clickSoundEnabled, selectedClickSound, clickSoundVolume]);

  useEffect(() => {
    const handleGlobalButtonClick = (event: MouseEvent) => {
      const target = event.target as Element | null;
      if (!target) return;

      const clickedElement = target.closest(
        'button, [role="button"], input[type="button"], input[type="submit"], input[type="reset"], .dock-item'
      );

      if (!clickedElement) return;
      if (clickedElement instanceof HTMLButtonElement && clickedElement.disabled) return;

      if (clickedElement instanceof HTMLElement && clickedElement.dataset.clickSound === 'off') {
        return;
      }

      if (!learningSpaceRef.current?.contains(clickedElement)) return;

      playLearningSpaceButtonSound();
    };

    document.addEventListener('click', handleGlobalButtonClick, true);
    return () => {
      document.removeEventListener('click', handleGlobalButtonClick, true);
    };
  }, [playLearningSpaceButtonSound]);

  // Load theme state asynchronously to avoid blocking render
  useEffect(() => {
    let isMounted = true;
    
    const loadThemeAsync = async () => {
      try {
        // Simulate async loading with requestIdleCallback for better performance
        await new Promise<void>((resolve) => {
          if ('requestIdleCallback'in window) {
            requestIdleCallback(() =>resolve());
          } else {
            setTimeout(() =>resolve(), 0);
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

    return () =>clearTimeout(saveTimeout);
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
    setProfileVisible(false);
    setLearningMapVisible(false);
    setLearningModuleVisible(false);
    setRoomVisible(false);
    setPomoVisible(false);
  }, []);

  const openPanel = useCallback((panel: string) => {
    // Close all panels first
    closeAllPanels();
    
    // Then open the requested panel
    switch (panel) {
      case 'pomo':
        setPomoVisible(true);
        break;
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
      case 'profile':
        setProfileVisible(true);
        break;
      case 'map':
        setLearningMapVisible(true);
        break;
      case 'learn':
        setLearningModuleVisible(true);
        break;
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
    { id: 'profile', icon: 'fas fa-user-circle', label: 'Profile', onClick: () => openPanel('profile') },
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
    setShowFireflies(false);
    setShowLeaves(false);
    setShowStars(false);
    setShowClouds(false);
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
    const isActive = pomoRunning || (pomoTotalTime >0 && pomoTimeLeft < pomoTotalTime && pomoTimeLeft >0);
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
    const isActive = pomoRunning || (pomoTotalTime >0 && pomoTimeLeft < pomoTotalTime && pomoTimeLeft >0);
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

  // Hide scrollbar on body/html when Learning Space is mounted
  useEffect(() => {
    document.body.classList.add('learning-space-active');
    document.documentElement.classList.add('learning-space-active');
    
    return () => {
      document.body.classList.remove('learning-space-active');
      document.documentElement.classList.remove('learning-space-active');
    };
  }, []);

  // Handle fullscreen change events (including F11 and Escape key)
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  useEffect(() => {
    const handleDailyMissionCelebration = (event: Event) => {
      const customEvent = event as CustomEvent<{ message?: string }>;
      const nextMessage =
        typeof customEvent.detail?.message === 'string' && customEvent.detail.message.trim().length > 0
          ? customEvent.detail.message
          : 'Bạn đã hoàn thành nhiệm vụ ngày hôm nay!';

      setDailyMissionCelebrationMessage(nextMessage);
      setShowDailyMissionCelebration(true);

      if (dailyMissionCelebrationTimerRef.current) {
        window.clearTimeout(dailyMissionCelebrationTimerRef.current);
      }

      dailyMissionCelebrationTimerRef.current = window.setTimeout(() => {
        setShowDailyMissionCelebration(false);
        dailyMissionCelebrationTimerRef.current = null;
      }, 3400);
    };

    window.addEventListener(DAILY_MISSION_CELEBRATION_EVENT, handleDailyMissionCelebration);

    return () => {
      window.removeEventListener(DAILY_MISSION_CELEBRATION_EVENT, handleDailyMissionCelebration);
      if (dailyMissionCelebrationTimerRef.current) {
        window.clearTimeout(dailyMissionCelebrationTimerRef.current);
        dailyMissionCelebrationTimerRef.current = null;
      }
    };
  }, []);

  // Toggle fullscreen function
  const toggleFullscreen = useCallback(async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (error) {
      console.error('Error toggling fullscreen:', error);
    }
  }, []);

  // Memoize background style for performance
  const backgroundStyle = useMemo(() =>({
    backgroundImage: liveEnabled && activeLiveTheme ? 'none': `url('${backgroundImage}')`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
  }), [liveEnabled, activeLiveTheme, backgroundImage]);

  const matchedPanelInitialX = (window.innerWidth - MUSIC_MATCHED_PANEL_WIDTH) / 2;
  const matchedPanelInitialY = (window.innerHeight - MUSIC_MATCHED_PANEL_HEIGHT - 80) / 2;
  const learningMapInitialX = (window.innerWidth - MAP_PANEL_WIDTH) / 2;
  const learningMapInitialY = (window.innerHeight - MAP_PANEL_HEIGHT - 80) / 2;

  return (
    <MusicPlayerProvider>
    <div
      ref={learningSpaceRef}
      className={`min-h-screen overflow-hidden relative learning-space-container ${className}`}
      style={backgroundStyle}
    >
      <Toaster 
        position="top-center"toastOptions={{
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
        <Suspense fallback={<div className="fixed inset-0 bg-black/20 animate-pulse"/>}>
          <YouTubeBackground
            videoId={activeLiveTheme.youtubeVideoId}
            start={activeLiveTheme.start}
            muted={videoMuted}
            volume={videoVolume}
            end={activeLiveTheme.end}
          />
        </Suspense>)}

      {/* Weather Effects - Lightweight, no Suspense needed */}
      <SnowEffect show={showSnow} />
      <RainEffect show={showRain} />
      <FirefliesEffect show={showFireflies} />
      <LeavesEffect show={showLeaves} />
      <StarsEffect show={showStars} />
      <CloudsEffect show={showClouds} />

      {/* Pomodoro Overlay */}
      {pomoOverlayVisible && (
        <Suspense fallback={null}>
          <PomodoroOverlay
            visible={pomoOverlayVisible}
            focusTitle={pomoFocusTitle}
            timeLeft={pomoTimeLeft}
            totalTime={pomoTotalTime}
            isRunning={pomoRunning}
            onClose={() =>setPomoOverlayVisible(false)}
            onOpenPanel={() =>setPomoVisible(true)}
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
                  id: 'pomo-min-limit'});
                return;
              }

              if (adjustHandler) {
                adjustHandler(amount);
              } else {
                console.warn('Pomodoro adjust handler not found on window');
              }
            }}
          />
        </Suspense>)}

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
        </Suspense>)}

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
        </Suspense>)}

      {/* Confetti Effect */}
      {showConfetti && (
        <Suspense fallback={null}>
          <ConfettiEffect
            visible={showConfetti}
            onComplete={() => {
              setShowConfetti(false);
            }}
          />
        </Suspense>)}

      {/* Clock Display - Lightweight, always visible */}
      <ClockDisplay />

      {/* Dock Menu - Lightweight, always visible */}
      <DockMenu items={dockItems} />

      {/* Music Widget - Shows only when there's a track playing and MusicPanel is closed */}
      <MusicWidgetWrapper musicPanelVisible={musicPanelVisible} />

      {/* Pomodoro Panel - Always mounted to keep timer state */}
      <Suspense fallback={null}>
        <PomodoroPanel
          visible={pomoVisible}
          onClose={() =>setPomoVisible(false)}
          onStartTimer={handlePomoStart}
          onStopTimer={() => {
            setPomoOverlayVisible(false);
            setPomoCompactVisible(false);
            setPomoVisible(true);
          }}
          onViewModeChange={(m) =>setPomoViewMode(m)}
        />
      </Suspense>

      {/* Ambience Panel */}
      {ambienceVisible && (
        <Suspense fallback={null}>
          <AmbiencePanel
            visible={ambienceVisible}
            onClose={() =>setAmbienceVisible(false)}
            soundVolumes={soundVolumes}
            onSoundVolumeChange={handleSoundVolumeChange}
            showRain={showRain}
            showSnow={showSnow}
            showFireflies={showFireflies}
            showLeaves={showLeaves}
            showStars={showStars}
            showClouds={showClouds}
            onToggleRain={() =>setShowRain(!showRain)}
            onToggleSnow={() =>setShowSnow(!showSnow)}
            onToggleFireflies={() =>setShowFireflies(!showFireflies)}
            onToggleLeaves={() =>setShowLeaves(!showLeaves)}
            onToggleStars={() =>setShowStars(!showStars)}
            onToggleClouds={() =>setShowClouds(!showClouds)}
            onResetAnimations={handleResetAnimations}
          />
        </Suspense>)}

      {/* Theme Panel */}
      {themeVisible && (
        <Suspense fallback={null}>
          <ThemePanel
            visible={themeVisible}
            onClose={() =>setThemeVisible(false)}
            onChangeBackground={handleChangeBackground}
            onUploadBackground={handleUploadBackground}
            onSelectLiveTheme={handleSelectLiveTheme}
            videoMuted={videoMuted}
            onToggleVideoMute={() =>setVideoMuted(!videoMuted)}
            videoVolume={videoVolume}
            onVolumeChange={setVideoVolume}
          />
        </Suspense>)}

      {/* Room Panel */}
      {roomVisible && (
        <Suspense fallback={null}>
          <RoomPanel
            visible={roomVisible}
            onClose={() =>setRoomVisible(false)}
            onSelectRoom={(url) => {
              setBackgroundImage(url);
              setRoomVisible(false);
            }}
            onJoinCall={(roomTitle) => {
              setCurrentRoomTitle(roomTitle.roomTitle);
              setCurrentRoomId(roomTitle.roomId);
              setCurrentRoomPassword(roomTitle.password);
              setCurrentRoomMicOn(roomTitle.micOn);
              setCurrentRoomCameraOn(roomTitle.cameraOn);
              setCurrentRoomMicDeviceId(roomTitle.micDeviceId);
              setCurrentRoomCameraDeviceId(roomTitle.cameraDeviceId);
              setCurrentRoomParticipantId(roomTitle.participantId);
              setCurrentRoomLivekitToken(roomTitle.livekitToken);
              setCurrentRoomLivekitUrl(roomTitle.livekitUrl ?? null);
              setVideoCallVisible(true);
            }}
          />
        </Suspense>)}

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
          </div>}>
          <MusicPanel
            visible={musicPanelVisible}
            onClose={() =>setMusicPanelVisible(false)}
          />
        </Suspense>)}

      {/* Journal Panel */}
      {journalVisible && (
        <Suspense fallback={null}>
          <JournalPanel
            visible={journalVisible}
            onClose={() =>setJournalVisible(false)}
            onSaveEntry={handleSaveJournalEntry}
            recentEntries={journalEntries}
          />
        </Suspense>)}

      {/* Settings Panel */}
      {settingsVisible && (
        <Suspense fallback={null}>
          <SettingsPanel
            visible={settingsVisible}
            onClose={() => setSettingsVisible(false)}
            panelMode="settings"
            clickSoundEnabled={clickSoundEnabled}
            onToggleClickSound={setClickSoundEnabled}
            selectedClickSound={selectedClickSound}
            onSelectClickSound={setSelectedClickSound}
            clickSoundOptions={CLICK_SOUND_OPTIONS}
            clickSoundVolume={clickSoundVolume}
            onChangeClickSoundVolume={setClickSoundVolume}
            onPreviewClickSound={playLearningSpaceButtonSound}
          />
        </Suspense>
      )}

      {/* Profile Panel */}
      {profileVisible && (
        <Suspense fallback={null}>
          <SettingsPanel
            visible={profileVisible}
            onClose={() => setProfileVisible(false)}
            panelMode="profile"
            initialX={matchedPanelInitialX}
            initialY={matchedPanelInitialY}
            initialWidth={MUSIC_MATCHED_PANEL_WIDTH}
            initialHeight={MUSIC_MATCHED_PANEL_HEIGHT}
          />
        </Suspense>)}

      {/* Learning Map Panel */}
      {learningMapVisible && (
        <Suspense fallback={null}>
          <LearningMapPanel
            visible={learningMapVisible}
            onClose={() =>setLearningMapVisible(false)}
            onModuleClick={handleModuleClick}
            selectedCourseId={selectedCourseId}
            initialX={learningMapInitialX}
            initialY={learningMapInitialY}
            initialWidth={MAP_PANEL_WIDTH}
            initialHeight={MAP_PANEL_HEIGHT}
          />
        </Suspense>)}

      {/* Learning Module Panel */}
      {learningModuleVisible && (
        <Suspense fallback={null}>
          <LearningModulePanel
            visible={learningModuleVisible}
            onClose={() => setLearningModuleVisible(false)}
            selectedCourseId={selectedCourseId}
            selectedModuleId={selectedModuleId}
            onCompleteModule={() => {
              // Close module panel and open map panel to show animation
              setLearningModuleVisible(false);
              setLearningMapVisible(true);
            }}
          />
        </Suspense>)}

      {/* Video Call Room */}
      {videoCallVisible && (
        <Suspense fallback={null}>
          <VideoCallRoom
            visible={videoCallVisible}
            onClose={() =>setVideoCallVisible(false)}
            roomTitle={currentRoomTitle}
            roomId={currentRoomId}
            roomPassword={currentRoomPassword}
            initialMicOn={currentRoomMicOn}
            initialCameraOn={currentRoomCameraOn}
            initialMicDeviceId={currentRoomMicDeviceId}
            initialCameraDeviceId={currentRoomCameraDeviceId}
            participantId={currentRoomParticipantId}
            livekitToken={currentRoomLivekitToken}
            livekitUrl={currentRoomLivekitUrl}
          />
        </Suspense>)}

      {showDailyMissionCelebration && (
        <div className="pointer-events-none fixed inset-0 z-[90] overflow-hidden">
          <div className="absolute inset-0 bg-black/25"></div>

          <div className="absolute inset-0">
            {DAILY_MISSION_COIN_BURST.map((coin) => (
              <i
                key={coin.id}
                className="fas fa-coins absolute -top-10 text-amber-200/95 drop-shadow-[0_6px_8px_rgba(0,0,0,0.35)]"
                style={{
                  left: `${coin.left}%`,
                  fontSize: `${coin.size}px`,
                  animationName: 'dailyMissionCoinRain',
                  animationTimingFunction: 'linear',
                  animationFillMode: 'forwards',
                  animationDelay: `${coin.delay}s`,
                  animationDuration: `${coin.duration}s`,
                }}
              ></i>
            ))}
          </div>

          <div className="absolute inset-0 flex items-center justify-center p-4">
            <div
              className="w-full max-w-[460px] rounded-2xl border border-amber-200/45 bg-[#2f1e14]/88 px-6 py-5 text-center shadow-[0_16px_38px_rgba(0,0,0,0.45)] backdrop-blur-sm"
              style={{ animation: 'dailyMissionNoticePop 0.35s ease-out' }}
            >
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full border border-amber-200/50 bg-amber-300/20 text-amber-100">
                <i className="fas fa-trophy text-2xl"></i>
              </div>
              <p className="text-[11px] uppercase tracking-[0.24em] text-amber-100/75">Daily Mission</p>
              <h3 className="mt-1 text-xl font-bold text-amber-50">Hoàn thành nhiệm vụ ngày!</h3>
              <p className="mt-2 text-sm text-amber-100/85">{dailyMissionCelebrationMessage}</p>
            </div>
          </div>

          <style>{`
            @keyframes dailyMissionCoinRain {
              0% {
                transform: translateY(-14vh) rotate(0deg);
                opacity: 0;
              }
              8% {
                opacity: 1;
              }
              100% {
                transform: translateY(118vh) rotate(560deg);
                opacity: 0.95;
              }
            }

            @keyframes dailyMissionNoticePop {
              0% {
                opacity: 0;
                transform: translateY(14px) scale(0.94);
              }
              100% {
                opacity: 1;
                transform: translateY(0) scale(1);
              }
            }
          `}</style>
        </div>
      )}

      {/* Font Awesome CDN - Required for icons */}
      <link
        rel="stylesheet"href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"/>

      {/* Fullscreen Toggle Button */}
      <button
        onClick={toggleFullscreen}
        className="fixed bottom-4 left-4 z-50 w-10 h-10 rounded-full backdrop-blur-md bg-black/30 border border-white/20 flex items-center justify-center text-white/80 hover:text-white hover:bg-black/50 hover:scale-110 transition-all duration-200 shadow-lg"title={isFullscreen ? 'Thoát chế độ toàn màn hình (F11)': 'Phóng to toàn màn hình (F11)'}
      >
        <i className={`fas ${isFullscreen ? 'fa-compress': 'fa-expand'} text-sm`}></i>
      </button>
    </div>
    </MusicPlayerProvider>);
}

import { useState } from 'react';
import type { SoundType, Track, JournalEntry } from './types/learningSpace';
import ClockDisplay from './components/ClockDisplay';
import DockMenu from './components/DockMenu';
import SnowEffect from './components/SnowEffect';
import RainEffect from './components/RainEffect';
import MusicWidget from './components/MusicWidget';
import PomodoroPanel from './components/PomodoroPanel';
import AmbiencePanel from './components/AmbiencePanel';
import ThemePanel from './components/ThemePanel';
import MusicPanel from './components/MusicPanel';
import JournalPanel from './components/JournalPanel';

type Props = {
  className?: string;
};

export default function LearningSpace({ className = '' }: Props) {
  // Weather effects
  const [showSnow, setShowSnow] = useState(true);
  const [showRain, setShowRain] = useState(false);

  // Panel visibility
  const [pomoVisible, setPomoVisible] = useState(false);
  const [ambienceVisible, setAmbienceVisible] = useState(false);
  const [themeVisible, setThemeVisible] = useState(false);
  const [musicPanelVisible, setMusicPanelVisible] = useState(false);
  const [journalVisible, setJournalVisible] = useState(false);

  // Music widget
  const [musicWidgetVisible, setMusicWidgetVisible] = useState(true);
  const [currentTrack, setCurrentTrack] = useState<Track | undefined>();

  // Ambience
  const [selectedSound, setSelectedSound] = useState<SoundType | null>('rain');
  const [soundVolume, setSoundVolume] = useState(70);

  // Background
  const [backgroundImage, setBackgroundImage] = useState(
    'https://images.unsplash.com/photo-1519904981063-b0cf448d479e?w=1920&h=1080&fit=crop'
  );

  // Journal entries
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);

  // Tracks
  const [tracks] = useState<Track[]>([]);

  const closeAllPanels = () => {
    setPomoVisible(false);
    setAmbienceVisible(false);
    setThemeVisible(false);
    setMusicPanelVisible(false);
    setJournalVisible(false);
  };

  const openPanel = (panel: string) => {
    closeAllPanels();
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
      case 'music':
        setMusicPanelVisible(true);
        break;
      case 'journal':
        setJournalVisible(true);
        break;
    }
  };

  const dockItems = [
    { id: 'theme', icon: 'fas fa-image', label: 'Theme', onClick: () => openPanel('theme') },
    { id: 'ambience', icon: 'fas fa-cloud-rain', label: 'Ambience', onClick: () => openPanel('ambience') },
    { id: 'track', icon: 'fas fa-briefcase', label: 'Track', onClick: () => {} },
    { id: 'pomo', icon: 'fas fa-clock', label: 'Pomo', onClick: () => openPanel('pomo') },
    { id: 'music', icon: 'fas fa-music', label: 'Music', onClick: () => openPanel('music') },
    { id: 'todo', icon: 'fas fa-list-check', label: 'Todo', onClick: () => {} },
    { id: 'stats', icon: 'fas fa-chart-line', label: 'Stats', onClick: () => {} },
    { id: 'journal', icon: 'fas fa-book', label: 'Journal', onClick: () => openPanel('journal') },
  ];

  const handleChangeBackground = (url: string) => {
    setBackgroundImage(url);
  };

  const handleUploadBackground = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        setBackgroundImage(e.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSelectTrack = (track: Track) => {
    setCurrentTrack(track);
    setMusicWidgetVisible(true);
    setMusicPanelVisible(false);
  };

  const handleSaveJournalEntry = (entry: Omit<JournalEntry, 'id'>) => {
    const newEntry: JournalEntry = {
      ...entry,
      id: Date.now().toString(),
    };
    setJournalEntries([newEntry, ...journalEntries]);
  };

  const handleResetAnimations = () => {
    setShowRain(false);
    setShowSnow(true);
  };

  return (
    <div
      className={`min-h-screen overflow-hidden relative ${className}`}
      style={{
        backgroundImage: `url('${backgroundImage}')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* Weather Effects */}
      <SnowEffect show={showSnow} />
      <RainEffect show={showRain} />

      {/* Clock Display */}
      <ClockDisplay />

      {/* Dock Menu */}
      <DockMenu items={dockItems} />

      {/* Music Widget - Hidden when MusicPanel is open */}
      <MusicWidget
        visible={musicWidgetVisible && !musicPanelVisible}
        onClose={() => setMusicWidgetVisible(false)}
        currentTrack={currentTrack}
      />

      {/* Pomodoro Panel */}
      <PomodoroPanel
        visible={pomoVisible}
        onClose={() => setPomoVisible(false)}
      />

      {/* Ambience Panel */}
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

      {/* Theme Panel */}
      <ThemePanel
        visible={themeVisible}
        onClose={() => setThemeVisible(false)}
        onChangeBackground={handleChangeBackground}
        onUploadBackground={handleUploadBackground}
      />

      {/* Music Panel */}
      <MusicPanel
        visible={musicPanelVisible}
        onClose={() => setMusicPanelVisible(false)}
        tracks={tracks}
        onSelectTrack={handleSelectTrack}
      />

      {/* Journal Panel */}
      <JournalPanel
        visible={journalVisible}
        onClose={() => setJournalVisible(false)}
        onSaveEntry={handleSaveJournalEntry}
        recentEntries={journalEntries}
      />

      {/* Font Awesome CDN - Required for icons */}
      <link
        rel="stylesheet"
        href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
      />
    </div>
  );
}

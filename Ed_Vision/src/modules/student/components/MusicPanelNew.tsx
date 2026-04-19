import { useState, useEffect } from 'react';
import type { Track } from '../types/learningSpace';
import type { MusicTrack, ArtistCard, FeaturedHero, PodcastShow, PodcastEpisode, SearchResults } from '../types/musicTypes';
import { useDraggable } from '../hooks/useDraggable';
import { useResizable } from '../hooks/useResizable';
import { useMusicPlayerStore } from '../hooks/useMusicPlayerStore';
import { spotifyService } from '../services/spotifyService';
import AnimatedList from './AnimatedList';

type Props = {
  visible: boolean;
  onClose: () => void;
  tracks: Track[];
  onSelectTrack: (track: Track) => void;
  initialX?: number;
  initialY?: number;
  initialWidth?: number;
  initialHeight?: number;
};

export default function MusicPanel({
  visible,
  onClose,
  initialX = (window.innerWidth - 1200) / 2,
  initialY = (window.innerHeight - 600 - 80) / 2,
  initialWidth = 1200,
  initialHeight = 600,
}: Props) {
  const { position, handleMouseDown } = useDraggable(initialX, initialY);
  const { size, handleMouseDown: handleResize } = useResizable(initialWidth, initialHeight, 1000, 600);
  const [currentView, setCurrentView] = useState<'home' | 'playlist' | 'discover' | 'podcasts' | 'spotify'>('home');
  const [showTagSelector, setShowTagSelector] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>(['Acoustic', 'Piano jazz', 'Jazz', 'Indie pop']);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showSongDetail, setShowSongDetail] = useState(false);
  const [selectedSong, setSelectedSong] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResults | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  // Spotify data states
  const [featuredHero, setFeaturedHero] = useState<FeaturedHero | null>(null);
  const [topArtists, setTopArtists] = useState<ArtistCard[]>([]);
  const [topCharts, setTopCharts] = useState<MusicTrack[]>([]);
  const [discoverData, setDiscoverData] = useState<{ newReleases: any[]; topBillboard: MusicTrack[] }>({ newReleases: [], topBillboard: [] });
  const [podcastsData, setPodcastsData] = useState<{ shows: PodcastShow[]; episodes: PodcastEpisode[] }>({ shows: [], episodes: [] });
  const [loading, setLoading] = useState(false);

  // Music player store
  const {
    currentTrack,
    playerState,
    currentTime,
    volume,
    playTrack,
    togglePlayPause,
    setVolume: setPlayerVolume,
    history,
    addToQueue,
  } = useMusicPlayerStore();

  const isPlaying = playerState === 'playing';

  // Fetch data when view changes
  useEffect(() => {
    if (!visible) return;

    const loadData = async () => {
      setLoading(true);
      try {
        if (currentView === 'home') {
          const [hero, artists, charts] = await Promise.all([
            spotifyService.fetchFeaturedHero(),
            spotifyService.fetchTopArtists(),
            spotifyService.fetchTopCharts(),
          ]);
          setFeaturedHero(hero);
          setTopArtists(artists);
          setTopCharts(charts);
        } else if (currentView === 'discover') {
          const discover = await spotifyService.fetchDiscover();
          setDiscoverData(discover);
        } else if (currentView === 'podcasts') {
          const podcasts = await spotifyService.fetchPodcasts();
          setPodcastsData(podcasts);
        }
      } catch (error) {
        console.error('Failed to load music data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [currentView, visible]);

  // Handle search
  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults(null);
      return;
    }

    setIsSearching(true);
    try {
      const results = await spotifyService.searchAllSpotify(searchQuery);
      setSearchResults(results);
      setCurrentView('spotify');
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setIsSearching(false);
    }
  };

  // Lyrics data with timestamps
  const lyrics = [
    { time: 0, text: "In the silence of the night" },
    { time: 15, text: "I hear your voice calling out to me" },
    { time: 30, text: "Through the darkness and the light" },
    { time: 45, text: "You're the only one I see" },
    { time: 60, text: "But I can't follow to meet you" },
    { time: 75, text: "You are far away out, out on the other side" },
    { time: 90, text: "When the stars begin to fade" },
    { time: 105, text: "And the morning breaks the sky" },
    { time: 120, text: "I'll be waiting for the day" },
    { time: 135, text: "When our worlds collide" },
    { time: 150, text: "Can you feel my heartbeat" },
    { time: 165, text: "Racing through the endless time" },
    { time: 180, text: "Every moment incomplete" },
    { time: 195, text: "Until you're finally mine" },
    { time: 210, text: "Forever in my dreams" },
    { time: 225, text: "You'll always be the one" },
  ];

  const getCurrentLyrics = () => {
    let currentIndex = 0;
    for (let i = 0; i < lyrics.length; i++) {
      if (currentTime >= lyrics[i].time) {
        currentIndex = i;
      } else {
        break;
      }
    }
    
    const current = lyrics[currentIndex];
    const next = lyrics[currentIndex + 1];
    
    return { current, next };
  };

  if (!visible) return null;

  const availableTags = [
    'Node', 'React', 'Jest', 'JavaScript', 'Express', 'Vue',
    'Next', 'TypeScript', 'Svelte', 'Gatsby', 'Knockout', 
    'Backbone', 'Ember', 'Chai', 'Mocha'
  ];

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleProgressCircleInteraction = (e: React.MouseEvent<SVGCircleElement>) => {
    const svg = e.currentTarget.ownerSVGElement;
    if (!svg) return;

    const rect = svg.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    const updateProgress = (clientX: number, clientY: number) => {
      const angle = Math.atan2(clientY - centerY, clientX - centerX);
      let percentage = (angle + Math.PI / 2) / (2 * Math.PI);
      if (percentage < 0) percentage += 1;
      
      if (currentTrack?.durationMs) {
        const newTime = (percentage * currentTrack.durationMs) / 1000;
        // Seek in player store
      }
    };

    updateProgress(e.clientX, e.clientY);

    const handleMouseMove = (e: MouseEvent) => {
      updateProgress(e.clientX, e.clientY);
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleVolumeChange = (delta: number) => {
    const newVolume = Math.max(0, Math.min(1, volume + delta));
    setPlayerVolume(newVolume);
  };

  const handleTrackClick = (track: MusicTrack) => {
    playTrack(track);
  };

  const handlePlayFeatured = () => {
    if (featuredHero?.primaryTrack) {
      playTrack(featuredHero.primaryTrack);
    } else if (featuredHero?.spotifyUrl) {
      window.open(featuredHero.spotifyUrl, '_blank');
    }
  };

  return (
    <div
      className="fixed z-10"
      style={{ left: `${position.x}px`, top: `${position.y}px`, width: `${size.width}px`, height: `${size.height}px` }}
    >
      <div className="backdrop-blur-[20px] bg-white/10 border border-white/20 rounded-3xl shadow-2xl h-full flex relative overflow-hidden">
        {/* Sidebar */}
        <div className={`${sidebarCollapsed ? 'w-16' : 'w-56'} flex-shrink-0 bg-black/30 backdrop-blur-sm border-r border-white/10 flex flex-col transition-all duration-300`}>
          {/* Header with drag handle */}
          <div
            className="h-12 cursor-move flex items-center justify-between px-4 border-b border-white/10"
            onMouseDown={handleMouseDown}
          >
            <div className="flex items-center gap-2">
              <button
                onClick={onClose}
                className="text-white/60 hover:text-white transition"
              >
                <i className="fas fa-times"></i>
              </button>
              {!sidebarCollapsed && <span className="text-white font-bold text-lg">Music</span>}
            </div>
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="text-white/60 hover:text-white transition"
            >
              <i className={`fas fa-chevron-${sidebarCollapsed ? 'right' : 'left'}`}></i>
            </button>
          </div>

          {/* Search */}
          {!sidebarCollapsed && (
            <div className="p-4">
              <div className="bg-white/10 rounded-lg px-3 py-2 flex items-center gap-2">
                <i className="fas fa-search text-white/50 text-sm"></i>
                <input
                  type="text"
                  placeholder="Search Spotify..."
                  className="bg-transparent text-white placeholder-white/50 text-sm outline-none flex-1"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                />
                {isSearching && <i className="fas fa-spinner fa-spin text-white/50 text-sm"></i>}
              </div>
            </div>
          )}

          {/* Menu */}
          <div className="flex-1 px-3 space-y-1">
            {!sidebarCollapsed && <div className="text-white/50 text-xs font-semibold px-3 mb-2">Menu: 4</div>}
            <button 
              onClick={() => setCurrentView('home')}
              className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center' : 'gap-3'} px-3 py-2 rounded-lg transition ${
                currentView === 'home' ? 'bg-purple-600/50 text-white' : 'text-white/60 hover:text-white hover:bg-white/10'
              }`}
              title="Home"
            >
              <i className="fas fa-home"></i>
              {!sidebarCollapsed && <span>Home</span>}
            </button>
            <button 
              onClick={() => setCurrentView('discover')}
              className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center' : 'gap-3'} px-3 py-2 rounded-lg transition ${
                currentView === 'discover' ? 'bg-purple-600/50 text-white' : 'text-white/60 hover:text-white hover:bg-white/10'
              }`}
              title="Discover"
            >
              <i className="fas fa-compass"></i>
              {!sidebarCollapsed && <span>Discover</span>}
            </button>
            <button
              onClick={() => setCurrentView('spotify')}
              className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center' : 'gap-3'} px-3 py-2 rounded-lg transition relative ${
                currentView === 'spotify' ? 'bg-purple-600/50 text-white' : 'text-white/60 hover:text-white hover:bg-white/10'
              }`}
              title="Spotify Search"
            >
              <i className="fab fa-spotify"></i>
              {!sidebarCollapsed && <span>Spotify</span>}
              {!sidebarCollapsed && <span className="ml-auto bg-green-500 text-white text-[10px] px-1.5 py-0.5 rounded">NEW</span>}
            </button>
            <button
              onClick={() => setCurrentView('podcasts')}
              className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center' : 'gap-3'} px-3 py-2 rounded-lg transition relative ${
                currentView === 'podcasts' ? 'bg-purple-600/50 text-white' : 'text-white/60 hover:text-white hover:bg-white/10'
              }`}
              title="Podcasts"
            >
              <i className="fas fa-podcast"></i>
              {!sidebarCollapsed && <span>Podcasts</span>}
            </button>

            {!sidebarCollapsed && <div className="text-white/50 text-xs font-semibold px-3 pt-4 mb-2">Library: 1</div>}
            <button 
              onClick={() => setCurrentView('playlist')}
              className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center' : 'gap-3'} px-3 py-2 rounded-lg transition ${
                currentView === 'playlist' ? 'bg-purple-600/50 text-white' : 'text-white/60 hover:text-white hover:bg-white/10'
              }`}
              title="Albums"
            >
              <i className="fas fa-compact-disc"></i>
              {!sidebarCollapsed && <span>Albums</span>}
            </button>
          </div>
        </div>

        {/* Main Content - WILL BE CONTINUED IN NEXT FILE DUE TO LENGTH */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Top Navigation */}
          <div className="h-12 flex items-center gap-3 px-6 border-b border-white/10">
            {currentView === 'playlist' || currentView === 'spotify' ? (
              <>
                <button 
                  onClick={() => setCurrentView('home')}
                  className="w-8 h-8 rounded-full bg-black/30 flex items-center justify-center text-white/60 hover:text-white transition"
                >
                  <i className="fas fa-chevron-left"></i>
                </button>
              </>
            ) : (
              <h2 className="text-white font-semibold text-lg capitalize">{currentView}</h2>
            )}
            {loading && <i className="fas fa-spinner fa-spin text-white/60 text-sm"></i>}
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-auto scrollbar-none">
            {/* Continue in MusicPanelContent.tsx */}
          </div>

          {/* Music Player Bar - AT BOTTOM */}
        </div>

        {/* Resize Handle */}
        <div
          className="absolute w-3 h-3 bg-white/30 border-2 border-white/60 rounded-full cursor-nwse-resize bottom-[-6px] right-[-6px] z-10 hover:bg-white/50"
          onMouseDown={handleResize}
        ></div>
      </div>
    </div>
  );
}

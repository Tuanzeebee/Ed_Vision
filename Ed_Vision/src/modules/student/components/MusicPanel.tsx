import { useState, useEffect } from 'react';
import type { Track } from '../types/learningSpace';
import { useDraggable } from '../hooks/useDraggable';
import { useResizable } from '../hooks/useResizable';
import AnimatedList from './AnimatedList';
import * as spotifyService from '../services/spotifyService';

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
  const [currentView, setCurrentView] = useState<'home' | 'playlist' | 'discover' | 'podcasts'>('home');
  const [showTagSelector, setShowTagSelector] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>(['Acoustic', 'Piano jazz', 'Jazz', 'Indie pop']);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(84); // 1:24
  const [duration, setDuration] = useState(228); // 3:48
  const [showSongDetail, setShowSongDetail] = useState(false);
  const [selectedSong, setSelectedSong] = useState<any>(null);
  const [volume, setVolume] = useState(0.7); // 70% volume
  const [spotifyTracks, setSpotifyTracks] = useState<any[]>([]);
  const [spotifyPlaylists, setSpotifyPlaylists] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [audioPlayer, setAudioPlayer] = useState<HTMLAudioElement | null>(null);

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

  // Get current and next lyrics based on current time
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

  // Load Spotify data
  useEffect(() => {
    if (!visible) return;

    async function loadSpotifyData() {
      setLoading(true);
      try {
        const [tracks, playlists] = await Promise.all([
          spotifyService.getTopTracks(50),
          spotifyService.getFeaturedPlaylists(10)
        ]);
        setSpotifyTracks(tracks);
        setSpotifyPlaylists(playlists);
      } catch (error) {
        console.error('Error loading Spotify data:', error);
      } finally {
        setLoading(false);
      }
    }

    loadSpotifyData();
  }, [visible]);

  // Audio player control
  useEffect(() => {
    if (selectedSong?.preview_url && isPlaying) {
      if (audioPlayer) {
        audioPlayer.pause();
      }
      const audio = new Audio(selectedSong.preview_url);
      audio.volume = volume;
      audio.play();
      setAudioPlayer(audio);

      audio.addEventListener('timeupdate', () => {
        setCurrentTime(Math.floor(audio.currentTime));
      });

      audio.addEventListener('ended', () => {
        setIsPlaying(false);
      });

      return () => {
        audio.pause();
        audio.remove();
      };
    } else if (audioPlayer && !isPlaying) {
      audioPlayer.pause();
    }
  }, [selectedSong, isPlaying]);

  // Update audio volume
  useEffect(() => {
    if (audioPlayer) {
      audioPlayer.volume = volume;
    }
  }, [volume, audioPlayer]);

  if (!visible) return null;

  const playlistTracks = [
    { id: '1', title: 'Sleep 4Ever', artist: 'Blackbear', duration: '4:12', album: 'HoneyWorks' },
    { id: '2', title: 'Time is Ticking Out', artist: 'The Cranberries', duration: '4:20', album: 'Wake up And Smell T...' },
    { id: '3', title: 'If I were u', artist: 'Lauv', duration: '3:12', album: 'The Ecstatic' },
    { id: '4', title: 'One Minute More', artist: 'Gun Kelly', duration: '2:56', album: 'Supersell' },
  ];

  const playedHistory = [
    { id: '1', title: 'Blank Space', artist: 'Taylor Swift', time: '4 min ago', albumArt: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=100&h=100&fit=crop' },
    { id: '2', title: 'Side Effects', artist: 'The Chainsmokers', time: '20 min ago', albumArt: 'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=100&h=100&fit=crop' },
    { id: '3', title: 'No One Like You', artist: 'Scorpions', time: '2 hr ago', albumArt: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=100&h=100&fit=crop' },
    { id: '4', title: 'Always Love You', artist: 'Bon Jovi', time: '3 hr ago', albumArt: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=100&h=100&fit=crop' },
  ];

  const availableTags = [
    'Node', 'React', 'Jest', 'JavaScript', 'Express', 'Vue',
    'Next', 'TypeScript', 'Svelte', 'Gatsby', 'Knockout', 
    'Backbone', 'Ember', 'Chai', 'Mocha'
  ];

  const topArtists = [
    { name: 'Travis Scott', plays: '44M Plays', image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=100&h=100&fit=crop' },
    { name: 'Billie Eilish', plays: '20.8M Plays', image: 'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=100&h=100&fit=crop' },
    { name: 'The Kid', plays: '18M Plays', image: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=100&h=100&fit=crop' },
    { name: 'Kanye', plays: '15M Plays', image: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=100&h=100&fit=crop' },
    { name: 'Nicki Minaj', plays: '10.9M Plays', image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=100&h=100&fit=crop' },
    { name: 'StarBoy', plays: '10.6M Plays', image: 'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=100&h=100&fit=crop' },
  ];

  const topCharts = [
    { rank: 1, title: 'Heatwav', artist: 'Glass Animals', duration: '3:45', plays: 432 },
    { rank: 2, title: 'Jesus is King', artist: 'Kanye West', duration: '3:45', plays: 234 },
    { rank: 3, title: 'Closer', artist: 'The Chainsmokers', duration: '3:45', plays: 123 },
    { rank: 4, title: 'Lean On', artist: 'Major Lazer ft DJ Snake', duration: '3:45', plays: 98 },
  ];

  const recentlyPlayed = [
    { id: '1', title: 'FRIDAY', artist: 'SETH ANDERSON & LEAH WATTS', image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop', plays: '50,960 Plays' },
    { id: '2', title: 'URBAN', artist: 'Cold Heart (PNAU Remix)', image: 'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=300&h=300&fit=crop', plays: '44M Plays' },
    { id: '3', title: 'FRIDAY NIGHT', artist: 'Dilemma', image: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300&h=300&fit=crop', plays: '38.5M Plays' },
    { id: '4', title: 'URBAN', artist: 'Thunderstruck', image: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=300&h=300&fit=crop', plays: '21.8M Plays' },
    { id: '5', title: 'View all', artist: '', image: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=300&h=300&fit=crop', plays: '' },
  ];

  // Use Spotify tracks or fallback to mock data
  const topBillboard = spotifyTracks.length > 0 
    ? spotifyTracks.slice(0, 10).map((track, index) => ({
        rank: index + 1,
        title: track.name,
        artist: spotifyService.getTrackArtists(track),
        album: track.album.name,
        duration: spotifyService.formatDuration(track.duration_ms),
        image: spotifyService.getAlbumImage(track),
        preview_url: track.preview_url,
        spotify_url: track.external_urls.spotify,
        uri: track.uri
      }))
    : [
      { rank: 1, title: 'Despacito', artist: 'Luis Fonsi', album: 'Despacito', duration: '3:31', image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=100&h=100&fit=crop', preview_url: null, spotify_url: null, uri: null },
      { rank: 2, title: 'Shape of You', artist: 'Ed Sheeran', album: 'Divide', duration: '3:31', image: 'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=100&h=100&fit=crop', preview_url: null, spotify_url: null, uri: null },
      { rank: 3, title: 'See You Again', artist: 'Wiz Khalifa', album: 'Most Wanted, Vol. 2', duration: '3:31', image: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=100&h=100&fit=crop', preview_url: null, spotify_url: null, uri: null },
      { rank: 4, title: 'Uptown Funk', artist: 'Mark Ronson', album: 'Uptown Funk', duration: '3:31', image: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=100&h=100&fit=crop', preview_url: null, spotify_url: null, uri: null },
      { rank: 5, title: 'Sugar', artist: 'Maroon 5', album: 'Get Rich or Die Tryin\'', duration: '3:31', image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=100&h=100&fit=crop', preview_url: null, spotify_url: null, uri: null },
    ];

  const featuredPodcasts = [
    { id: '1', title: 'The Daily', host: 'The New York Times', image: 'https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=300&h=300&fit=crop', episodes: '1,234 episodes' },
    { id: '2', title: 'Joe Rogan Experience', host: 'Joe Rogan', image: 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=300&h=300&fit=crop', episodes: '2,089 episodes' },
    { id: '3', title: 'TED Talks Daily', host: 'TED', image: 'https://images.unsplash.com/photo-1505682634904-d7c8d95cdc50?w=300&h=300&fit=crop', episodes: '3,456 episodes' },
    { id: '4', title: 'Crime Junkie', host: 'audiochuck', image: 'https://images.unsplash.com/photo-1574192324001-ee41e18ed679?w=300&h=300&fit=crop', episodes: '456 episodes' },
    { id: '5', title: 'Stuff You Should Know', host: 'iHeartPodcasts', image: 'https://images.unsplash.com/photo-1589903308904-1010c2294adc?w=300&h=300&fit=crop', episodes: '1,890 episodes' },
  ];

  const trendingPodcasts = [
    { id: '1', title: 'Huberman Lab', host: 'Dr. Andrew Huberman', duration: '2h 15m', category: 'Science', image: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=100&h=100&fit=crop' },
    { id: '2', title: 'SmartLess', host: 'Jason Bateman, Sean Hayes, Will Arnett', duration: '1h 5m', category: 'Comedy', image: 'https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=100&h=100&fit=crop' },
    { id: '3', title: 'The Tim Ferriss Show', host: 'Tim Ferriss', duration: '1h 45m', category: 'Business', image: 'https://images.unsplash.com/photo-1590859808308-3d2d9c515b1a?w=100&h=100&fit=crop' },
    { id: '4', title: 'Serial', host: 'Sarah Koenig', duration: '45m', category: 'True Crime', image: 'https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=100&h=100&fit=crop' },
    { id: '5', title: 'How I Built This', host: 'Guy Raz', duration: '1h 20m', category: 'Business', image: 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=100&h=100&fit=crop' },
  ];

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle progress circle click/drag for new circular design
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
      
      const newTime = Math.round(percentage * duration);
      setCurrentTime(Math.max(0, Math.min(duration, newTime)));
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

  // Handle volume adjustment
  const handleVolumeChange = (delta: number) => {
    const newVolume = Math.max(0, Math.min(1, volume + delta));
    setVolume(newVolume);
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
                  placeholder="Search ..."
                  className="bg-transparent text-white placeholder-white/50 text-sm outline-none flex-1"
                />
              </div>
            </div>
          )}

          {/* Menu */}
          <div className="flex-1 px-3 space-y-1">
            {!sidebarCollapsed && <div className="text-white/50 text-xs font-semibold px-3 mb-2">Menu: 3</div>}
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
              onClick={() => setCurrentView('podcasts')}
              className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center' : 'gap-3'} px-3 py-2 rounded-lg transition relative ${
                currentView === 'podcasts' ? 'bg-purple-600/50 text-white' : 'text-white/60 hover:text-white hover:bg-white/10'
              }`}
              title="Podcasts"
            >
              <i className="fas fa-podcast"></i>
              {!sidebarCollapsed && <span>Podcasts</span>}
              {!sidebarCollapsed && <span className="ml-auto bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded">NEW</span>}
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

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Top Navigation */}
          <div className="h-12 flex items-center gap-3 px-6 border-b border-white/10">
            {currentView === 'playlist' ? (
              <>
                <button 
                  onClick={() => setCurrentView('home')}
                  className="w-8 h-8 rounded-full bg-black/30 flex items-center justify-center text-white/60 hover:text-white transition"
                >
                  <i className="fas fa-chevron-left"></i>
                </button>
                <button className="w-8 h-8 rounded-full bg-black/30 flex items-center justify-center text-white/60 hover:text-white transition">
                  <i className="fas fa-chevron-right"></i>
                </button>
              </>
            ) : (
              <h2 className="text-white font-semibold text-lg capitalize">{currentView}</h2>
            )}
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-auto scrollbar-none">
            {currentView === 'discover' ? (
              <div className="p-6">
                {/* Recently Played */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-white font-semibold text-sm">RECENTLY PLAYED</h3>
                  </div>
                  <div className="grid grid-cols-5 gap-4">
                    {recentlyPlayed.map((item) => (
                      <div
                        key={item.id}
                        className="cursor-pointer hover:bg-white/5 rounded-xl p-3 transition group"
                      >
                        <div className="relative mb-3">
                          <img
                            src={item.image}
                            alt={item.title}
                            className="w-full aspect-square rounded-xl object-cover"
                          />
                          {item.id !== '5' && (
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 rounded-xl transition flex items-center justify-center">
                              <button className="w-12 h-12 bg-white/0 group-hover:bg-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition transform scale-75 group-hover:scale-100">
                                <i className="fas fa-play text-black ml-1"></i>
                              </button>
                            </div>
                          )}
                        </div>
                        <div className="text-white text-sm font-bold truncate">{item.title}</div>
                        {item.artist && <div className="text-white/60 text-xs truncate">{item.artist}</div>}
                        {item.plays && <div className="text-white/50 text-xs mt-1">{item.plays}</div>}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Top 100 Billboard */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-white font-semibold text-sm flex items-center gap-2">
                      <i className="fab fa-spotify text-green-400"></i>
                      SPOTIFY TOP 50 GLOBAL
                    </h3>
                    {loading && <span className="text-white/50 text-xs">Loading...</span>}
                  </div>
                  <div className="space-y-3">
                      {topBillboard.map((song) => (
                        <div 
                          key={song.rank} 
                          onClick={() => {
                            setSelectedSong(song);
                            setCurrentTime(0);
                            if (song.preview_url) {
                              setDuration(30); // Spotify previews are 30 seconds
                            }
                            setShowSongDetail(true);
                          }}
                          className="flex items-center gap-4 hover:bg-white/5 p-3 rounded-lg cursor-pointer transition group"
                        >
                          <div className="flex items-center gap-3 w-8">
                            {song.rank === 2 ? (
                              <div className="flex items-center gap-1">
                                <i className="fas fa-arrow-up text-red-500 text-xs"></i>
                                <span className="text-white/60 text-sm font-semibold">#{song.rank}</span>
                              </div>
                            ) : (
                              <span className="text-white/60 text-sm font-semibold">#{song.rank}</span>
                            )}
                          </div>
                          <img
                            src={song.image}
                            alt={song.title}
                            className="w-12 h-12 rounded-lg"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="text-white text-sm font-medium truncate">{song.title}</div>
                            <div className="text-white/50 text-xs truncate">{song.artist}</div>
                          </div>
                          <div className="text-white/60 text-xs">{song.album}</div>
                          <div className="flex items-center gap-4">
                            {song.spotify_url && (
                              <a 
                                href={song.spotify_url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="opacity-0 group-hover:opacity-100 transition"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <i className="fab fa-spotify text-green-400 hover:text-green-300"></i>
                              </a>
                            )}
                            <button className="opacity-0 group-hover:opacity-100 transition">
                              <i className="fas fa-heart text-white/40 hover:text-red-400"></i>
                            </button>
                            <div className="text-white/60 text-xs w-12 text-right">{song.duration}</div>
                            <button className="text-white/40 hover:text-white opacity-0 group-hover:opacity-100 transition">
                              <i className="fas fa-ellipsis-h"></i>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                </div>
              </div>
            ) : currentView === 'podcasts' ? (
              <div className="p-6">
                {/* Featured Podcasts */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-white font-semibold text-sm">FEATURED PODCASTS</h3>
                    <button className="text-purple-400 text-sm hover:text-purple-300">See all</button>
                  </div>
                  <div className="grid grid-cols-5 gap-4">
                    {featuredPodcasts.map((podcast) => (
                      <div
                        key={podcast.id}
                        className="cursor-pointer hover:bg-white/5 rounded-xl p-3 transition group"
                      >
                        <div className="relative mb-3">
                          <img
                            src={podcast.image}
                            alt={podcast.title}
                            className="w-full aspect-square rounded-xl object-cover"
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 rounded-xl transition flex items-center justify-center">
                            <button className="w-12 h-12 bg-white/0 group-hover:bg-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition transform scale-75 group-hover:scale-100">
                              <i className="fas fa-play text-black ml-1"></i>
                            </button>
                          </div>
                        </div>
                        <div className="text-white text-sm font-bold truncate">{podcast.title}</div>
                        <div className="text-white/60 text-xs truncate">{podcast.host}</div>
                        <div className="text-white/50 text-xs mt-1">{podcast.episodes}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Trending Episodes */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-white font-semibold text-sm">TRENDING EPISODES</h3>
                  </div>
                  <div className="space-y-3">
                    {trendingPodcasts.map((episode) => (
                      <div key={episode.id} className="flex items-center gap-4 hover:bg-white/5 p-3 rounded-lg cursor-pointer transition group">
                        <img
                          src={episode.image}
                          alt={episode.title}
                          className="w-16 h-16 rounded-lg"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="text-white text-sm font-medium truncate">{episode.title}</div>
                          <div className="text-white/50 text-xs truncate">{episode.host}</div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-white/40 text-xs bg-white/10 px-2 py-0.5 rounded">{episode.category}</span>
                            <span className="text-white/40 text-xs">{episode.duration}</span>
                          </div>
                        </div>
                        <button className="opacity-0 group-hover:opacity-100 transition">
                          <i className="fas fa-bookmark text-white/40 hover:text-purple-400"></i>
                        </button>
                        <button className="text-white/40 hover:text-white opacity-0 group-hover:opacity-100 transition">
                          <i className="fas fa-ellipsis-h"></i>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : currentView === 'home' ? (
              <div className="p-6">
                {/* Trending New Hits */}
                <div className="mb-6">
                  <div className="text-white/60 text-sm mb-2">Trending New Hits</div>
                  <div className="bg-gradient-to-br from-slate-800 to-black rounded-2xl p-8 relative overflow-hidden">
                    <div className="relative z-10">
                      <h2 className="text-white text-5xl font-bold mb-2">In My Feelings</h2>
                      <div className="flex items-center gap-2 text-white/80 text-sm mb-6">
                        <span className="font-semibold">Camila Cabello</span>
                        <span>63Million Plays</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold transition">
                          Listen Now
                        </button>
                        <button className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition">
                          <i className="fas fa-play text-white"></i>
                        </button>
                      </div>
                    </div>
                    <img
                      src="https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop"
                      alt="Artist"
                      className="absolute right-0 top-0 h-full w-1/2 object-cover opacity-50"
                    />
                  </div>
                </div>

                {/* Top Artists */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-white font-semibold">Top Artists</h3>
                    <button className="text-purple-400 text-sm hover:text-purple-300">See all</button>
                  </div>
                  <div className="grid grid-cols-6 gap-3">
                    {topArtists.map((artist, index) => (
                      <div
                        key={index}
                        onClick={() => setCurrentView('playlist')}
                        className="cursor-pointer hover:bg-white/5 rounded-xl p-3 transition"
                      >
                        <img
                          src={artist.image}
                          alt={artist.name}
                          className="w-full aspect-square rounded-xl mb-2 object-cover"
                        />
                        <div className="text-white text-sm font-semibold truncate">{artist.name}</div>
                        <div className="text-white/50 text-xs">{artist.plays}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Top Charts */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-white font-semibold">Top Charts</h3>
                    <button className="text-purple-400 text-sm hover:text-purple-300">See all</button>
                  </div>
                  <div className="space-y-2">
                    {topCharts.map((song) => (
                      <div 
                        key={song.rank} 
                        onClick={() => {
                          setSelectedSong({ ...song, image: `https://images.unsplash.com/photo-${1493225457124 + song.rank}-a3eb161ffa5f?w=300&h=300&fit=crop` });
                          setShowSongDetail(true);
                        }}
                        className="flex items-center gap-3 hover:bg-white/5 p-2 rounded-lg cursor-pointer transition"
                      >
                        <span className="text-white/60 text-sm font-semibold w-8">{String(song.rank).padStart(2, '0')}</span>
                        <img
                          src={`https://images.unsplash.com/photo-${1493225457124 + song.rank}-a3eb161ffa5f?w=100&h=100&fit=crop`}
                          alt={song.title}
                          className="w-10 h-10 rounded-lg"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="text-white text-sm font-medium truncate">{song.title}</div>
                          <div className="text-white/50 text-xs truncate">{song.artist}</div>
                        </div>
                        <div className="text-white/60 text-xs">{song.duration}</div>
                        <button className="text-white/40 hover:text-white"><i className="fas fa-ellipsis-h"></i></button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-6">
                {/* Playlist View */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <div className="text-white/60 text-sm">What's Hot</div>
                      <h2 className="text-white text-3xl font-bold">Trending</h2>
                    </div>
                    <button className="text-purple-400 text-sm hover:text-purple-300">More →</button>
                  </div>
                  <div className="bg-gradient-to-br from-purple-800/50 to-purple-900/50 backdrop-blur-sm rounded-2xl p-6 flex items-center gap-6 border border-white/10">
                    <div className="flex-1">
                      <div className="text-white/60 text-sm mb-2">Artist</div>
                      <h3 className="text-white text-4xl font-bold mb-4">Top all over<br />the world</h3>
                      <div className="flex items-center gap-4">
                        <button className="bg-red-500 hover:bg-red-600 text-white px-6 py-2.5 rounded-full flex items-center gap-2 font-semibold transition">
                          <i className="fas fa-play text-sm"></i>
                          Play
                        </button>
                        <button className="border border-white/30 text-white px-6 py-2.5 rounded-full hover:bg-white/10 transition">
                          Follow
                        </button>
                      </div>
                    </div>
                    <div className="relative">
                      <img
                        src="https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=200&h=200&fit=crop"
                        alt="Trending"
                        className="w-32 h-32 rounded-2xl"
                      />
                      <div className="absolute top-2 right-2 text-white/80 text-xs flex items-center gap-1">
                        <i className="fas fa-user text-[10px]"></i>
                        <span className="font-bold">98,029</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Playlist Table */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-white text-2xl font-bold">Playlist</h3>
                    <button className="text-purple-400 text-sm hover:text-purple-300">Show all</button>
                  </div>
                  <div className="bg-black/20 backdrop-blur-sm rounded-xl overflow-hidden border border-white/10">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-white/10">
                          <th className="text-left text-white/50 text-xs font-semibold px-4 py-3">#</th>
                          <th className="text-left text-white/50 text-xs font-semibold px-4 py-3">TITLE</th>
                          <th className="text-left text-white/50 text-xs font-semibold px-4 py-3">ARTIST</th>
                          <th className="text-left text-white/50 text-xs font-semibold px-4 py-3">TIME</th>
                          <th className="text-left text-white/50 text-xs font-semibold px-4 py-3">ALBUM</th>
                        </tr>
                      </thead>
                      <tbody>
                        {playlistTracks.map((track, index) => (
                          <tr 
                            key={track.id} 
                            onClick={() => {
                              setSelectedSong({ ...track, rank: index + 1, image: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300&h=300&fit=crop' });
                              setShowSongDetail(true);
                            }}
                            className="hover:bg-white/5 cursor-pointer transition group"
                          >
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <span className="text-white/60 text-sm group-hover:hidden">{String(index + 1).padStart(2, '0')}</span>
                                <i className="fas fa-chart-line text-purple-400 text-xs hidden group-hover:block"></i>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-white font-medium">{track.title}</td>
                            <td className="px-4 py-3 text-white/60 text-sm">{track.artist}</td>
                            <td className="px-4 py-3 text-white/60 text-sm">{track.duration}</td>
                            <td className="px-4 py-3 text-white/60 text-sm">{track.album}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Music Player Bar */}
          <div className="h-20 border-t border-white/10 flex items-center px-6 gap-6">
            {/* Album Art & Info */}
            <div className="flex items-center gap-3 w-64">
              <img
                src="https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=100&h=100&fit=crop"
                alt="Album"
                className="w-14 h-14 rounded-lg"
              />
              <div className="flex-1 min-w-0">
                <div className="text-white text-sm font-semibold truncate">I'm BRAVE</div>
                <div className="text-white/60 text-xs truncate">Lauv</div>
              </div>
              <button className="text-white/60 hover:text-white transition">
                <i className="far fa-heart"></i>
              </button>
              <button className="text-white/60 hover:text-white transition">
                <i className="fas fa-download"></i>
              </button>
            </div>

            {/* Player Controls */}
            <div className="flex-1 flex flex-col items-center gap-2">
              <div className="flex items-center gap-4">
                <button className="text-white/60 hover:text-white transition">
                  <i className="fas fa-step-backward"></i>
                </button>
                <button className="text-white/60 hover:text-white transition">
                  <i className="fas fa-backward"></i>
                </button>
                <button 
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center text-white transition"
                >
                  <i className={`fas fa-${isPlaying ? 'pause' : 'play'} ${!isPlaying ? 'ml-0.5' : ''}`}></i>
                </button>
                <button className="text-white/60 hover:text-white transition">
                  <i className="fas fa-forward"></i>
                </button>
                <button className="text-white/60 hover:text-white transition">
                  <i className="fas fa-step-forward"></i>
                </button>
              </div>
              
              {/* Progress Bar */}
              <div className="w-full max-w-2xl flex items-center gap-3">
                <span className="text-white/60 text-xs font-mono">{formatTime(currentTime)}</span>
                <div className="flex-1 h-1 bg-white/20 rounded-full overflow-hidden cursor-pointer group">
                  <div 
                    className="h-full bg-gradient-to-r from-purple-500 to-pink-500 relative"
                    style={{ width: `${(currentTime / duration) * 100}%` }}
                  >
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full opacity-0 group-hover:opacity-100 transition"></div>
                  </div>
                </div>
                <span className="text-white/60 text-xs font-mono">{formatTime(duration)}</span>
              </div>
            </div>

            {/* Volume & Options */}
            <div className="flex items-center gap-3 w-48">
              <button className="text-white/60 hover:text-white transition">
                <i className="fas fa-random"></i>
              </button>
              <button className="text-white/60 hover:text-white transition">
                <i className="fas fa-redo"></i>
              </button>
            </div>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="w-64 flex-shrink-0 bg-black/30 backdrop-blur-sm border-l border-white/10 flex flex-col">
          {/* Tags */}
          <div className="p-4 border-b border-white/10 relative">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-white font-semibold">Tags</h4>
              <button 
                onClick={() => setShowTagSelector(!showTagSelector)}
                className="text-white/60 hover:text-white"
              >
                <i className="fas fa-ellipsis-h"></i>
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {selectedTags.map((tag, index) => (
                <span
                  key={index}
                  className="bg-purple-600/50 text-white text-xs px-3 py-1.5 rounded-full flex items-center gap-1"
                >
                  <i className="fas fa-guitar text-[10px]"></i>
                  {tag}
                  <button
                    onClick={() => setSelectedTags(selectedTags.filter(t => t !== tag))}
                    className="ml-1 hover:text-red-300"
                  >
                    <i className="fas fa-times text-[10px]"></i>
                  </button>
                </span>
              ))}
            </div>

            {/* Tag Selector Popup */}
            {showTagSelector && (
              <div className="absolute top-12 right-4 z-50 backdrop-blur-xl bg-black/80 border border-white/20 rounded-2xl shadow-2xl p-4 w-80">
                <div className="mb-3">
                  <h5 className="text-white text-sm font-semibold mb-2">TAGS</h5>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {selectedTags.map((tag, index) => (
                      <span
                        key={index}
                        className="bg-white/20 text-white text-xs px-3 py-1.5 rounded-full flex items-center gap-1"
                      >
                        {tag}
                        <button
                          onClick={() => setSelectedTags(selectedTags.filter(t => t !== tag))}
                          className="hover:text-red-300"
                        >
                          <i className="fas fa-times text-[10px]"></i>
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {availableTags
                    .filter(tag => !selectedTags.includes(tag))
                    .map((tag, index) => (
                      <button
                        key={index}
                        onClick={() => setSelectedTags([...selectedTags, tag])}
                        className="bg-white/5 hover:bg-white/10 text-white/80 hover:text-white text-xs px-3 py-1.5 rounded-full transition"
                      >
                        {tag}
                      </button>
                    ))}
                </div>
              </div>
            )}
          </div>

          {/* Played History */}
          <div className="flex-1 overflow-auto scrollbar-none p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-white font-semibold">Played</h4>
              <button className="text-purple-400 text-sm hover:text-purple-300">See all</button>
            </div>
            <div className="space-y-3">
              {playedHistory.map((track) => (
                <div key={track.id} className="flex items-center gap-3 cursor-pointer hover:bg-white/5 p-2 rounded-lg transition">
                  <img
                    src={track.albumArt}
                    alt={track.title}
                    className="w-12 h-12 rounded-lg"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-white text-sm font-medium truncate">{track.title}</div>
                    <div className="text-white/50 text-xs truncate">{track.artist}</div>
                  </div>
                  <div className="text-white/40 text-xs whitespace-nowrap">{track.time}</div>
                </div>
              ))}
            </div>

            {/* Album Cover */}
            <div className="mt-6">
              <div className="relative rounded-2xl overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop"
                  alt="Album"
                  className="w-full aspect-square object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <div className="text-white font-bold text-lg mb-1">I Knew You Were</div>
                  <div className="text-white/70 text-sm">Taylor Swift</div>
                </div>
                <button className="absolute top-4 right-4 w-8 h-8 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/30 transition">
                  <i className="fas fa-plus text-white text-sm"></i>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Resize Handle */}
        <div
          className="absolute w-3 h-3 bg-white/30 border-2 border-white/60 rounded-full cursor-nwse-resize bottom-[-6px] right-[-6px] z-10 hover:bg-white/50"
          onMouseDown={handleResize}
        ></div>
      </div>

      {/* Song Detail Modal - Replaces Main Content and Right Sidebar */}
      {showSongDetail && selectedSong && (
        <div className="absolute inset-0 z-50 flex">
          <div className="flex-1 backdrop-blur-[20px] bg-white/10 overflow-hidden relative">
            {/* Back Button */}
            <button
              onClick={() => setShowSongDetail(false)}
              className="absolute top-4 left-4 z-10 w-10 h-10 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white transition"
            >
              <i className="fas fa-chevron-left text-lg"></i>
            </button>

            {/* Background Album Art */}
            <div className="absolute inset-0 opacity-5">
              <img
                src={selectedSong.image}
                alt={selectedSong.title}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Content */}
            <div className="relative h-full flex items-center px-16 py-16">
              {/* Left Section - Album & Info with AnimatedList */}
              <div className="absolute left-0 top-0 bottom-0 w-[500px] pl-16">
                <AnimatedList
                  items={topBillboard}
                  onItemSelect={(song, _index) => {
                    setSelectedSong(song);
                    setCurrentTime(0);
                  }}
                  showGradients={false}
                  enableArrowNavigation={true}
                  displayScrollbar={false}
                  itemHeight={320}
                  renderItem={(song, _index, isActive) => (
                    <div className="flex flex-col items-center justify-center h-full">
                      <img
                        src={song.image}
                        alt={song.title}
                        className={`rounded-2xl shadow-2xl object-cover mb-6 transition-all duration-500 ${
                          isActive ? 'w-64 h-64' : 'w-48 h-48'
                        }`}
                      />
                      <div className="text-center px-4">
                        <div className={`text-white font-bold mb-2 leading-tight transition-all duration-500 ${
                          isActive ? 'text-3xl' : 'text-xl'
                        }`}>
                          {song.title}
                        </div>
                        <div className={`text-white/70 transition-all duration-500 ${
                          isActive ? 'text-xl' : 'text-base'
                        }`}>
                          {song.artist}
                        </div>
                      </div>
                    </div>
                  )}
                />
              </div>

              {/* Right - Circular Progress */}
              <div className="flex flex-col items-center justify-center ml-auto mr-20">
                <div className="relative w-[280px] h-[280px]">
                  {/* Main Circle Container */}
                  <div 
                    className="absolute inset-0 rounded-full bg-white/[0.02] backdrop-blur-sm"
                    style={{
                      boxShadow: '0 0 25px rgba(148, 255, 181, 0.35)'
                    }}
                  />

                  {/* Circular Timeline Ring */}
                  <svg className="absolute inset-0 w-full h-full transform -rotate-90" viewBox="0 0 280 280">
                    {/* Background Ring */}
                    <circle
                      cx="140"
                      cy="140"
                      r="135"
                      fill="none"
                      stroke="rgba(255,255,255,0.1)"
                      strokeWidth="3"
                    />
                    
                    {/* Progress Ring with Gradient */}
                    <circle
                      cx="140"
                      cy="140"
                      r="135"
                      fill="none"
                      stroke="url(#timelineGradient)"
                      strokeWidth="4"
                      strokeLinecap="round"
                      strokeDasharray={`${(currentTime / duration) * 848} 848`}
                      className="cursor-pointer transition-all"
                      onMouseDown={handleProgressCircleInteraction}
                    />
                    
                    <defs>
                      <linearGradient id="timelineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#a7ff5a" />
                        <stop offset="50%" stopColor="#94ffb5" />
                        <stop offset="100%" stopColor="#a7ff5a" />
                      </linearGradient>
                    </defs>
                  </svg>

                  {/* Circular Thumb on Timeline */}
                  <div 
                    className="absolute w-2.5 h-2.5 rounded-full bg-[#a7ff5a] pointer-events-none transition-all"
                    style={{
                      left: '50%',
                      top: '50%',
                      transform: `translate(-50%, -50%) rotate(${(currentTime / duration) * 360}deg) translateY(-135px)`,
                      boxShadow: '0 0 12px rgba(167, 255, 90, 0.9), 0 0 20px rgba(167, 255, 90, 0.5)'
                    }}
                  />

                  {/* Center Play/Pause Button */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <button
                      onClick={() => setIsPlaying(!isPlaying)}
                      className="w-20 h-20 rounded-full flex items-center justify-center transition-all duration-200 ease-out pointer-events-auto hover:scale-105"
                      style={{
                        background: 'rgba(0, 0, 0, 0.4)',
                        border: '2px solid rgba(167, 255, 90, 0.7)',
                        boxShadow: '0 0 8px rgba(167, 255, 90, 0.4)'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.boxShadow = '0 0 16px rgba(167, 255, 90, 0.8)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.boxShadow = '0 0 8px rgba(167, 255, 90, 0.4)';
                      }}
                    >
                      {isPlaying ? (
                        <div className="flex gap-1.5">
                          <div className="w-2 h-7 rounded bg-[#a7ff5a]"></div>
                          <div className="w-2 h-7 rounded bg-[#a7ff5a]"></div>
                        </div>
                      ) : (
                        <div 
                          className="w-0 h-0 ml-1"
                          style={{
                            borderLeft: '14px solid #a7ff5a',
                            borderTop: '10px solid transparent',
                            borderBottom: '10px solid transparent'
                          }}
                        />
                      )}
                    </button>
                  </div>

                  {/* Time Labels */}
                  <div 
                    className="absolute text-[10px] font-light pointer-events-none"
                    style={{
                      left: '50%',
                      top: '8px',
                      transform: 'translateX(-50%)',
                      color: 'rgba(255, 255, 255, 0.7)'
                    }}
                  >
                    {formatTime(currentTime)}
                  </div>
                  
                  <div 
                    className="absolute text-[10px] font-light pointer-events-none"
                    style={{
                      left: '50%',
                      bottom: '8px',
                      transform: 'translateX(-50%)',
                      color: 'rgba(255, 255, 255, 0.7)'
                    }}
                  >
                    {formatTime(duration)}
                  </div>

                  {/* Waveform Icon */}
                  <div 
                    className="absolute text-[11px] pointer-events-none"
                    style={{
                      left: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: 'rgba(255, 255, 255, 0.7)'
                    }}
                  >
                    <i className="fas fa-waveform-lines"></i>
                  </div>

                  {/* Side Icons Stack */}
                  <div 
                    className="absolute flex flex-col gap-2.5"
                    style={{
                      right: '-48px',
                      top: '50%',
                      transform: 'translateY(-50%)'
                    }}
                  >
                    {/* Volume Control with Vertical Slider */}
                    <div className="flex flex-col items-center gap-2 bg-black/40 rounded-full px-2.5 py-3 backdrop-blur-sm">
                      <button 
                        onClick={() => handleVolumeChange(0.1)}
                        className="w-7 h-7 flex items-center justify-center rounded-full transition-all duration-200 hover:scale-110 hover:opacity-80"
                        style={{ color: 'rgba(167, 255, 90, 0.85)' }}
                        title="Volume Up"
                      >
                        <i className="fas fa-volume-up text-xs"></i>
                      </button>
                      
                      {/* Vertical Volume Slider */}
                      <div className="relative w-1 h-24 bg-white/10 rounded-full overflow-hidden">
                        {/* Volume Fill */}
                        <div 
                          className="absolute bottom-0 w-full rounded-full transition-all duration-150"
                          style={{
                            height: `${volume * 100}%`,
                            background: 'linear-gradient(to top, #a7ff5a, #94ffb5)'
                          }}
                        />
                        
                        {/* Interactive Overlay */}
                        <div 
                          className="absolute inset-0 cursor-pointer"
                          onClick={(e) => {
                            const rect = e.currentTarget.getBoundingClientRect();
                            const y = e.clientY - rect.top;
                            const percentage = 1 - (y / rect.height);
                            setVolume(Math.max(0, Math.min(1, percentage)));
                          }}
                          onMouseDown={(e) => {
                            const handleMouseMove = (moveEvent: MouseEvent) => {
                              const rect = e.currentTarget.getBoundingClientRect();
                              const y = moveEvent.clientY - rect.top;
                              const percentage = 1 - (y / rect.height);
                              setVolume(Math.max(0, Math.min(1, percentage)));
                            };
                            
                            const handleMouseUp = () => {
                              document.removeEventListener('mousemove', handleMouseMove);
                              document.removeEventListener('mouseup', handleMouseUp);
                            };
                            
                            document.addEventListener('mousemove', handleMouseMove);
                            document.addEventListener('mouseup', handleMouseUp);
                          }}
                        />
                        
                        {/* Volume Thumb */}
                        <div 
                          className="absolute w-3 h-3 rounded-full bg-[#a7ff5a] pointer-events-none transition-all duration-150"
                          style={{
                            left: '50%',
                            bottom: `${volume * 100}%`,
                            transform: 'translate(-50%, 50%)',
                            boxShadow: '0 0 8px rgba(167, 255, 90, 0.8)'
                          }}
                        />
                      </div>
                      
                      <button 
                        onClick={() => handleVolumeChange(-0.1)}
                        className="w-7 h-7 flex items-center justify-center rounded-full transition-all duration-200 hover:scale-110 hover:opacity-80"
                        style={{ color: 'rgba(167, 255, 90, 0.85)' }}
                        title="Volume Down"
                      >
                        <i className="fas fa-volume-down text-xs"></i>
                      </button>
                      
                      <div className="text-[9px] font-light text-white/60 mt-1">
                        {Math.round(volume * 100)}%
                      </div>
                    </div>
                    
                    <div className="h-px bg-white/20 w-6 mx-auto my-1"></div>
                    
                    <button 
                      className="w-9 h-9 flex items-center justify-center rounded-full transition-all duration-200 hover:scale-110 hover:opacity-80"
                      style={{ color: 'rgba(167, 255, 90, 0.85)' }}
                      title="Repeat"
                    >
                      <i className="fas fa-repeat text-sm"></i>
                    </button>
                    <button 
                      className="w-9 h-9 flex items-center justify-center rounded-full transition-all duration-200 hover:scale-110 hover:opacity-80"
                      style={{ color: 'rgba(167, 255, 90, 0.85)' }}
                      title="Infinity"
                    >
                      <i className="fas fa-infinity text-sm"></i>
                    </button>
                    <button 
                      className="w-9 h-9 flex items-center justify-center rounded-full transition-all duration-200 hover:scale-110 hover:opacity-80"
                      style={{ color: 'rgba(167, 255, 90, 0.85)' }}
                      title="Add to playlist"
                    >
                      <i className="fas fa-plus text-sm"></i>
                    </button>
                    <button 
                      className="w-9 h-9 flex items-center justify-center rounded-full transition-all duration-200 hover:scale-110 hover:opacity-80"
                      style={{ color: 'rgba(167, 255, 90, 0.85)' }}
                      title="More"
                    >
                      <i className="fas fa-ellipsis text-sm"></i>
                    </button>
                  </div>
                </div>

                {/* Song Title and Subtitle */}
                <div className="text-center mt-5">
                  <h3 className="text-sm font-medium text-white">
                    {selectedSong?.title || "Unknown Track"}
                  </h3>
                  <p className="text-[11px] mt-1" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                    {selectedSong?.artist || "Unknown Artist"}
                  </p>
                </div>

                {/* Lyrics - Dynamic based on current time */}
                <div className="text-center max-w-lg mt-6">
                  <div className="text-white/70 text-sm leading-relaxed">
                    <p className="mb-1 transition-all duration-500 ease-in-out transform">
                      {getCurrentLyrics().current?.text || "Instrumental"}
                    </p>
                    <p className="text-white/50 text-xs transition-all duration-500 ease-in-out transform opacity-60">
                      {getCurrentLyrics().next?.text || "..."}
                    </p>
                  </div>
                </div>
              </div>

              {/* Right Controls */}
              <div className="absolute top-8 right-8 flex flex-col gap-3">
                <button className="w-11 h-11 bg-white/8 hover:bg-white/15 backdrop-blur-sm rounded-full flex items-center justify-center text-white/70 hover:text-white transition">
                  <i className="fas fa-volume-up text-lg"></i>
                </button>
                <button className="w-11 h-11 bg-white/8 hover:bg-white/15 backdrop-blur-sm rounded-full flex items-center justify-center text-white/70 hover:text-white transition">
                  <i className="fas fa-infinity text-lg"></i>
                </button>
                <button className="w-11 h-11 bg-white/8 hover:bg-white/15 backdrop-blur-sm rounded-full flex items-center justify-center text-white/70 hover:text-white transition">
                  <i className="fas fa-link text-base"></i>
                </button>
              </div>

              {/* Bottom Right Controls */}
              <div className="absolute bottom-8 right-8 flex items-center gap-3">
                <button className="w-11 h-11 bg-white/8 hover:bg-white/15 backdrop-blur-sm rounded-full flex items-center justify-center text-white/70 hover:text-white transition">
                  <i className="fas fa-plus text-lg"></i>
                </button>
                <button className="w-11 h-11 bg-white/8 hover:bg-white/15 backdrop-blur-sm rounded-full flex items-center justify-center text-white/70 hover:text-white transition">
                  <i className="fas fa-bars text-base"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

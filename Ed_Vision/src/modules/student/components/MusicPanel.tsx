import { useState } from 'react';
import type { Track } from '../types/learningSpace';
import { useDraggable } from '../hooks/useDraggable';
import { useResizable } from '../hooks/useResizable';

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
  const [currentView, setCurrentView] = useState<'home' | 'playlist'>('home');
  const [showTagSelector, setShowTagSelector] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>(['Acoustic', 'Piano jazz', 'Jazz', 'Indie pop']);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

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
            <button className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center' : 'gap-3'} px-3 py-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition`} title="Discover">
              <i className="fas fa-compass"></i>
              {!sidebarCollapsed && <span>Discover</span>}
            </button>
            <button className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center' : 'gap-3'} px-3 py-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition relative`} title="Podcasts">
              <i className="fas fa-podcast"></i>
              {!sidebarCollapsed && <span>Podcasts</span>}
              {!sidebarCollapsed && <span className="ml-auto bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded">NEW</span>}
            </button>
            <button className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center' : 'gap-3'} px-3 py-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition`} title="Radio">
              <i className="fas fa-radio"></i>
              {!sidebarCollapsed && <span>Radio</span>}
            </button>

            {!sidebarCollapsed && <div className="text-white/50 text-xs font-semibold px-3 pt-4 mb-2">Library: 3</div>}
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
            <button 
              onClick={() => setCurrentView('playlist')}
              className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center' : 'gap-3'} px-3 py-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition`}
              title="Song"
            >
              <i className="fas fa-music"></i>
              {!sidebarCollapsed && <span>Song</span>}
            </button>
            <button className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center' : 'gap-3'} px-3 py-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition`} title="Artists">
              <i className="fas fa-user-music"></i>
              {!sidebarCollapsed && <span>Artists</span>}
            </button>
          </div>

          {/* User Profile */}
          {!sidebarCollapsed && (
            <div className="p-4 border-t border-white/10">
              <div className="flex items-center gap-3">
                <img
                  src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop"
                  alt="User"
                  className="w-10 h-10 rounded-full"
                />
                <div className="flex-1">
                  <div className="text-white text-sm font-semibold">Vitaliy Dorozhko</div>
                  <div className="text-white/50 text-xs">Premium Member</div>
                </div>
                <i className="fas fa-crown text-yellow-400"></i>
              </div>
            </div>
          )}
          {sidebarCollapsed && (
            <div className="p-4 border-t border-white/10 flex justify-center">
              <img
                src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop"
                alt="User"
                className="w-10 h-10 rounded-full"
              />
            </div>
          )}
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Top Navigation */}
          <div className="h-12 flex items-center gap-3 px-6 border-b border-white/10">
            <button className="w-8 h-8 rounded-full bg-black/30 flex items-center justify-center text-white/60 hover:text-white">
              <i className="fas fa-chevron-left"></i>
            </button>
            <button className="w-8 h-8 rounded-full bg-black/30 flex items-center justify-center text-white/60 hover:text-white">
              <i className="fas fa-chevron-right"></i>
            </button>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-auto scrollbar-none">
            {currentView === 'home' ? (
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
                      <div key={song.rank} className="flex items-center gap-3 hover:bg-white/5 p-2 rounded-lg cursor-pointer transition">
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
                          <tr key={track.id} className="hover:bg-white/5 cursor-pointer transition group">
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
    </div>
  );
}

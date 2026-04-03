import { useState, useEffect } from 'react';
import { useDraggable } from '../hooks/useDraggable';
import { useResizable } from '../hooks/useResizable';
import { LIVE_THEMES, getFeaturedLiveTheme, type LiveTheme } from '@/data/liveThemes';

type ThemeCategory = 'all' | 'Custom' | 'Exclusive' | 'Chill' | 'Focus' | 'Anime' | 'Pets' | 'Kpop';

type Props = {
  visible: boolean;
  onClose: () => void;
  onChangeBackground: (url: string) => void;
  onUploadBackground: (file: File) => void;
  onSelectLiveTheme?: (theme: LiveTheme) => void;
  videoMuted?: boolean;
  onToggleVideoMute?: () => void;
  videoVolume?: number;
  onVolumeChange?: (volume: number) => void;
  initialX?: number;
  initialY?: number;
  initialWidth?: number;
  initialHeight?: number;
};

export default function ThemePanel({
  visible,
  onClose,
  onChangeBackground,
  onUploadBackground,
  onSelectLiveTheme,
  videoMuted = true,
  onToggleVideoMute,
  videoVolume = 70,
  onVolumeChange,
  initialX = (window.innerWidth - 800) / 2,
  initialY = (window.innerHeight - 600 - 80) / 2,
  initialWidth = 800,
  initialHeight = 600,
}: Props) {
  const { position, handleMouseDown } = useDraggable(initialX, initialY);
  const { size, handleMouseDown: handleResize } = useResizable(initialWidth, initialHeight, 700, 500);
  const [activeTab, setActiveTab] = useState<'static' | 'live'>('static');
  const [activeCategory, setActiveCategory] = useState<ThemeCategory>('all');
  const [liveThemes, setLiveThemes] = useState<LiveTheme[]>(LIVE_THEMES);
  const [featuredTheme, setFeaturedTheme] = useState<LiveTheme | null>(null);
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [urlError, setUrlError] = useState('');

  useEffect(() => {
    // Load live themes data
    setLiveThemes(LIVE_THEMES);
    setFeaturedTheme(getFeaturedLiveTheme());
  }, []);

  if (!visible) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onUploadBackground(file);
    }
  };

  const categories = [
    { id: 'Custom' as ThemeCategory, icon: '', label: 'Custom' },
    { id: 'Exclusive' as ThemeCategory, icon: '', label: 'Exclusive' },
    { id: 'Chill' as ThemeCategory, icon: '', label: 'Chill' },
    { id: 'Focus' as ThemeCategory, icon: '', label: 'Focus' },
    { id: 'Anime' as ThemeCategory, icon: '', label: 'Anime' },
    { id: 'Pets' as ThemeCategory, icon: '', label: 'Pets' },
    { id: 'Kpop' as ThemeCategory, icon: '', label: 'Kpop' },
  ];

  const handleLiveThemeClick = (theme: LiveTheme) => {
    if (onSelectLiveTheme) {
      onSelectLiveTheme(theme);
    }
  };

  // Extract YouTube video ID from various URL formats
  const extractYoutubeVideoId = (url: string): string | null => {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/,
      /youtube\.com\/embed\/([^&\n?#]+)/,
      /youtube\.com\/v\/([^&\n?#]+)/,
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }
    return null;
  };

  const handleYoutubeUrlSubmit = () => {
    setUrlError('');
    
    if (!youtubeUrl.trim()) {
      setUrlError('Please enter a YouTube URL');
      return;
    }

    const videoId = extractYoutubeVideoId(youtubeUrl);
    
    if (!videoId) {
      setUrlError('Invalid YouTube URL. Please use format: https://youtube.com/watch?v=VIDEO_ID or https://youtu.be/VIDEO_ID');
      return;
    }

    // Create custom live theme
    const customTheme: LiveTheme = {
      id: `custom-${Date.now()}`,
      title: 'Custom YouTube Video',
      category: 'Custom',
      youtubeVideoId: videoId,
      thumbnailUrl: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
      attribution: 'Custom',
    };

    if (onSelectLiveTheme) {
      onSelectLiveTheme(customTheme);
      setYoutubeUrl('');
      setUrlError('');
    }
  };

  const filteredLiveThemes = activeCategory === 'all' 
    ? liveThemes 
    : liveThemes.filter(theme => theme.category === activeCategory);

  const summerSpecialThemes = [
    { url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1920&h=1080&fit=crop', name: 'Beach Sunset', author: 'Summer' },
    { url: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=1920&h=1080&fit=crop', name: 'Ocean Waves', author: 'Summer' },
    { url: 'https://images.unsplash.com/photo-1473496169904-658ba7c44d8a?w=1920&h=1080&fit=crop', name: 'Tropical Paradise', author: 'Summer' },
    { url: 'https://images.unsplash.com/photo-1519046904884-53103b34b206?w=1920&h=1080&fit=crop', name: 'Summer Vibes', author: 'Summer' },
  ];



  const allThemes = [
    { url: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1920&h=1080&fit=crop', name: 'Forest Path', author: 'Nature' },
    { url: 'https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?w=1920&h=1080&fit=crop', name: 'Waterfall', author: 'Nature' },
    { url: 'https://images.unsplash.com/photo-1519904981063-b0cf448d479e?w=1920&h=1080&fit=crop', name: 'Winter Landscape', author: 'Nature' },
    { url: 'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=1920&h=1080&fit=crop', name: 'Misty Mountains', author: 'Nature' },
    { url: 'https://images.unsplash.com/photo-1483728642387-6c3bdd6c93e5?w=1920&h=1080&fit=crop', name: 'Mountain Lake', author: 'Nature' },
    { url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920&h=1080&fit=crop', name: 'Mountain Range', author: 'Nature' },
    { url: 'https://images.unsplash.com/photo-1501854140801-50d01698950b?w=1920&h=1080&fit=crop', name: 'Foggy Hills', author: 'Nature' },
    { url: 'https://images.unsplash.com/photo-1475924156734-496f6cac6ec1?w=1920&h=1080&fit=crop', name: 'Golden Hour', author: 'Nature' },
    { url: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=1920&h=1080&fit=crop', name: 'Desert Sunset', author: 'Nature' },
    { url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1920&h=1080&fit=crop', name: 'Ocean View', author: 'Nature' },
    { url: 'https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=1920&h=1080&fit=crop', name: 'Northern Lights', author: 'Nature' },
    { url: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=1920&h=1080&fit=crop', name: 'Alpine Lake', author: 'Nature' },
  ];

  return (
    <div
      className="fixed z-10"
      style={{ left: `${position.x}px`, top: `${position.y}px`, width: `${size.width}px`, height: `${size.height}px` }}
    >
      <div className="backdrop-blur-[20px] bg-white/10 border border-white/20 rounded-3xl shadow-2xl h-full flex flex-col relative">
        {/* Header */}
        <div
          className="flex-shrink-0 h-10 cursor-move rounded-t-3xl flex items-center justify-between px-6"
          onMouseDown={handleMouseDown}
        >
          <div className="flex items-center gap-3">
            <i className="fas fa-palette text-white/80 text-lg"></i>
            <h2 className="text-xl font-semibold text-white">Background Themes</h2>
          </div>
          <button
            onClick={onClose}
            className="text-white/60 hover:text-white transition"
          >
            <i className="fas fa-times text-xl"></i>
          </button>
        </div>

        {/* Tab Switch */}
        <div className="flex-shrink-0 flex justify-center py-4">
          <div className="flex bg-black/30 rounded-full p-1 border border-white/20">
            <button
              onClick={() => setActiveTab('static')}
              className={`px-6 py-1.5 rounded-full text-sm font-medium transition flex items-center gap-2 ${
                activeTab === 'static'
                  ? 'bg-white/20 text-white shadow-lg'
                  : 'text-white/70 hover:text-white'
              }`}
            >
              <i className="fas fa-image"></i>
              Static Themes
            </button>
            <button
              onClick={() => setActiveTab('live')}
              className={`px-6 py-1.5 rounded-full text-sm font-medium transition flex items-center gap-2 ${
                activeTab === 'live'
                  ? 'bg-white/20 text-white shadow-lg'
                  : 'text-white/70 hover:text-white'
              }`}
            >
              <i className="fas fa-play-circle"></i>
              Live Themes
            </button>
          </div>
        </div>

        {/* Categories */}
        <div className="flex-shrink-0 px-6 pb-4">
          <div className="grid grid-cols-7 gap-2">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setActiveCategory(category.id)}
                className={`flex flex-col items-center gap-1 p-3 rounded-2xl transition ${
                  activeCategory === category.id
                    ? 'bg-white/20 shadow-lg scale-105'
                    : 'bg-black/30 hover:bg-black/40'
                }`}
              >
                <span className="text-2xl">{category.icon}</span>
                <span className="text-xs font-medium text-white whitespace-nowrap">{category.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-auto scrollbar-none px-6 pb-6">
          {activeTab === 'static' ? (
            <>
              {/* Summer Special */}
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <h3 className="text-white font-bold text-lg">Summer Special</h3>
                  <span className="text-xl"></span>
                </div>
                <div className="grid grid-cols-4 gap-3">
                  {summerSpecialThemes.map((theme, index) => (
                    <div
                      key={index}
                      onClick={() => onChangeBackground(theme.url)}
                      className="group cursor-pointer relative rounded-xl overflow-hidden aspect-video bg-cover bg-center hover:ring-4 ring-orange-400 transition transform hover:scale-105"
                      style={{ backgroundImage: `url('${theme.url.replace('w=1920&h=1080', 'w=400&h=300')}')` }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition">
                        <div className="absolute bottom-2 left-2 right-2">
                          <div className="text-white text-xs font-semibold truncate">{theme.name}</div>
                          <div className="text-white/70 text-[10px]">by {theme.author}</div>
                        </div>
                      </div>
                      <div className="absolute top-2 right-2 bg-orange-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                        SUMMER
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Classic Themes */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-white/90 font-semibold">Classic</h3>
                </div>
                <div className="grid grid-cols-4 gap-3">
                  {allThemes.map((theme, index) => (
                    <div
                      key={index}
                      onClick={() => onChangeBackground(theme.url)}
                      className="group cursor-pointer relative rounded-xl overflow-hidden aspect-video bg-cover bg-center hover:ring-4 ring-white/50 transition transform hover:scale-105"
                      style={{ backgroundImage: `url('${theme.url.replace('w=1920&h=1080', 'w=400&h=300')}')` }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition">
                        <div className="absolute bottom-2 left-2 right-2">
                          <div className="text-white text-xs font-semibold truncate">{theme.name}</div>
                          <div className="text-white/70 text-[10px]">by {theme.author}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Live Themes - Featured */}
              {featuredTheme && (
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <h3 className="text-white font-bold text-lg">Featuring</h3>
                      <span className="text-xl"></span>
                    </div>
                    <button className="text-white/60 hover:text-white text-sm flex items-center gap-1">
                      <i className="fas fa-share"></i>
                    </button>
                  </div>
                  <div className="grid grid-cols-4 gap-3">
                    <div
                      onClick={() => handleLiveThemeClick(featuredTheme)}
                      className="group cursor-pointer relative rounded-xl overflow-hidden aspect-video bg-cover bg-center hover:ring-4 ring-purple-400 transition transform hover:scale-105"
                      style={{ backgroundImage: `url('${featuredTheme.thumbnailUrl}')` }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent">
                        <div className="absolute bottom-2 left-2 right-2">
                          <div className="text-white text-xs font-semibold truncate">{featuredTheme.title}</div>
                          <div className="text-white/70 text-[10px]">by {featuredTheme.attribution || 'Unknown'}</div>
                        </div>
                        <div className="absolute top-2 left-2 bg-purple-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                          <span></span> Featuring
                        </div>
                      </div>
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                        <div className="w-12 h-12 bg-white/30 backdrop-blur-sm rounded-full flex items-center justify-center">
                          <i className="fas fa-play text-white text-lg ml-1"></i>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* All Live Themes */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-white/90 font-semibold">All Live Themes</h3>
                  <button className="text-white/60 hover:text-white text-sm">
                    + Contribute Themes
                  </button>
                </div>
                <div className="grid grid-cols-4 gap-3">
                  {filteredLiveThemes.map((theme) => (
                    <div
                      key={theme.id}
                      onClick={() => handleLiveThemeClick(theme)}
                      className="group cursor-pointer relative rounded-xl overflow-hidden aspect-video bg-cover bg-center hover:ring-4 ring-white/50 transition transform hover:scale-105"
                      style={{ backgroundImage: `url('${theme.thumbnailUrl}')` }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent">
                        <div className="absolute bottom-2 left-2 right-2">
                          <div className="text-white text-xs font-semibold truncate">{theme.title}</div>
                          <div className="text-white/70 text-[10px]">by {theme.attribution || 'Unknown'}</div>
                        </div>
                        <div className="absolute top-2 right-2">
                          <span className="bg-black/50 text-white text-[9px] font-medium px-1.5 py-0.5 rounded">
                            {theme.category}
                          </span>
                        </div>
                      </div>
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                        <div className="w-12 h-12 bg-white/30 backdrop-blur-sm rounded-full flex items-center justify-center">
                          <i className="fas fa-play text-white text-lg ml-1"></i>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Video Audio Control - Only show in Live tab */}
          {activeTab === 'live' && (
            <div className="border-t border-white/20 pt-4 mb-4">
              <div className="bg-white/5 rounded-2xl p-4 border border-white/10 space-y-3">
                {/* Mute Toggle */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <i className={`fas ${videoMuted ? 'fa-volume-mute' : 'fa-volume-up'} text-xl ${videoMuted ? 'text-white/60' : 'text-green-400'}`}></i>
                    <div>
                      <h4 className="text-white font-semibold text-xs">Video Audio</h4>
                      <p className="text-white/50 text-[10px]">
                        {videoMuted ? 'Muted' : `Playing at ${videoVolume}%`}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={onToggleVideoMute}
                    className={`relative w-12 h-6 rounded-full transition-all duration-300 ${
                      videoMuted ? 'bg-gray-600' : 'bg-green-500'
                    }`}
                  >
                    <div
                      className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-lg transition-all duration-300 ${
                        videoMuted ? 'left-0.5' : 'left-6'
                      }`}
                    ></div>
                  </button>
                </div>
                
                {/* Volume Slider */}
                {!videoMuted && (
                  <div className="flex items-center gap-3">
                    <i className="fas fa-volume-down text-white/60 text-xs"></i>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={videoVolume}
                      onChange={(e) => onVolumeChange?.(Number(e.target.value))}
                      className="flex-1 h-1 bg-white/20 rounded-full appearance-none cursor-pointer"
                      style={{
                        background: `linear-gradient(to right, #22c55e 0%, #22c55e ${videoVolume}%, rgba(255,255,255,0.2) ${videoVolume}%, rgba(255,255,255,0.2) 100%)`
                      }}
                    />
                    <i className="fas fa-volume-up text-white/60 text-xs"></i>
                    <span className="text-white/60 text-xs font-mono w-9 text-right">{videoVolume}%</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Custom YouTube URL - Only show in Live tab */}
          {activeTab === 'live' && (
            <div className="border-t border-white/20 pt-4 mb-4">
              <label className="block text-white text-xs font-semibold mb-2 flex items-center gap-1.5">
                <i className="fab fa-youtube text-red-500 text-sm"></i>
                Add Custom YouTube Video
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={youtubeUrl}
                  onChange={(e) => setYoutubeUrl(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleYoutubeUrlSubmit()}
                  placeholder="Paste YouTube URL..."
                  className="flex-1 px-3 py-2 rounded-xl bg-black/30 border border-white/20 text-white text-xs placeholder-white/40 focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-transparent transition"
                />
                <button
                  onClick={handleYoutubeUrlSubmit}
                  className="px-4 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white text-xs font-semibold transition flex items-center gap-1.5 shadow-lg"
                >
                  <i className="fas fa-plus text-[10px]"></i>
                  Add
                </button>
              </div>
              {urlError && (
                <p className="text-red-400 text-[10px] mt-1.5 flex items-center gap-1">
                  <i className="fas fa-exclamation-circle"></i>
                  {urlError}
                </p>
              )}
              <p className="text-white/50 text-[10px] mt-1.5 flex items-center gap-1">
                <i className="fas fa-info-circle"></i>
                Supports: youtube.com/watch?v=..., youtu.be/...
              </p>
            </div>
          )}

          {/* Upload Custom - Only show in Static tab */}
          {activeTab === 'static' && (
            <div className="border-t border-white/20 pt-6">
              <label className="block text-white font-semibold mb-3 flex items-center gap-2">
                <i className="fas fa-upload"></i>
                Upload Custom Background
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="block w-full text-sm text-white file:mr-4 file:py-3 file:px-6 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-white/20 file:text-white hover:file:bg-white/30 file:cursor-pointer transition"
              />
            </div>
          )}
        </div>

        <div
          className="absolute w-3 h-3 bg-white/30 border-2 border-white/60 rounded-full cursor-nwse-resize bottom-[-6px] right-[-6px] z-10 hover:bg-white/50"
          onMouseDown={handleResize}
        ></div>
      </div>
    </div>
  );
}

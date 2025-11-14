import { useState } from 'react';
import { useDraggable } from '../hooks/useDraggable';
import { useResizable } from '../hooks/useResizable';

type ThemeCategory = 'all' | 'custom' | 'exclusive' | 'chill' | 'focus' | 'anime' | 'animal' | 'kpop';

type Props = {
  visible: boolean;
  onClose: () => void;
  onChangeBackground: (url: string) => void;
  onUploadBackground: (file: File) => void;
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
  initialX = (window.innerWidth - 800) / 2,
  initialY = (window.innerHeight - 600 - 80) / 2,
  initialWidth = 800,
  initialHeight = 600,
}: Props) {
  const { position, handleMouseDown } = useDraggable(initialX, initialY);
  const { size, handleMouseDown: handleResize } = useResizable(initialWidth, initialHeight, 700, 500);
  const [activeTab, setActiveTab] = useState<'static' | 'live'>('static');
  const [activeCategory, setActiveCategory] = useState<ThemeCategory>('all');

  if (!visible) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onUploadBackground(file);
    }
  };

  const categories = [
    { id: 'custom' as ThemeCategory, icon: '🖼️', label: 'Custom' },
    { id: 'exclusive' as ThemeCategory, icon: '🎭', label: 'Exclusive' },
    { id: 'chill' as ThemeCategory, icon: '🌺', label: 'Chill' },
    { id: 'focus' as ThemeCategory, icon: '📖', label: 'Focus' },
    { id: 'anime' as ThemeCategory, icon: '⚔️', label: 'Anime' },
    { id: 'animal' as ThemeCategory, icon: '🐾', label: 'Pets' },
    { id: 'kpop' as ThemeCategory, icon: '👥', label: 'Kpop' },
  ];

  const summerSpecialThemes = [
    { url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1920&h=1080&fit=crop', name: 'Beach Sunset', author: 'Summer' },
    { url: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=1920&h=1080&fit=crop', name: 'Ocean Waves', author: 'Summer' },
    { url: 'https://images.unsplash.com/photo-1473496169904-658ba7c44d8a?w=1920&h=1080&fit=crop', name: 'Tropical Paradise', author: 'Summer' },
    { url: 'https://images.unsplash.com/photo-1519046904884-53103b34b206?w=1920&h=1080&fit=crop', name: 'Summer Vibes', author: 'Summer' },
  ];

  const liveThemes = [
    { url: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=1920&h=1080&fit=crop', name: 'Rainy Lofi Japan', author: 'Fall in Chill', featured: true },
    { url: 'https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=1920&h=1080&fit=crop', name: 'Minimal Space', author: 'Lofi Study' },
    { url: 'https://images.unsplash.com/photo-1524678606370-a47ad25cb82a?w=1920&h=1080&fit=crop', name: 'Cozy Cat Cafe', author: 'Chill Vibes' },
    { url: 'https://images.unsplash.com/photo-1513366884929-f0b3d46eee4b?w=1920&h=1080&fit=crop', name: 'Low Poly City', author: 'Study beats' },
    { url: 'https://images.unsplash.com/photo-1532274402911-5a369e4c4bb5?w=1920&h=1080&fit=crop', name: 'Peaceful Garden', author: 'Nature Sounds' },
    { url: 'https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?w=1920&h=1080&fit=crop', name: 'Forest Waterfall', author: 'Ambient' },
    { url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920&h=1080&fit=crop', name: 'Mountain View', author: 'Relax Music' },
    { url: 'https://images.unsplash.com/photo-1475924156734-496f6cac6ec1?w=1920&h=1080&fit=crop', name: 'Sunset Sky', author: 'Chill Beats' },
    { url: 'https://images.unsplash.com/photo-1499346030926-9a72daac6c63?w=1920&h=1080&fit=crop', name: 'Cozy Fireplace', author: 'Winter Vibes' },
    { url: 'https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=1920&h=1080&fit=crop', name: 'City Night', author: 'Urban Beats' },
    { url: 'https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=1920&h=1080&fit=crop', name: 'Aurora Borealis', author: 'Cosmic Sounds' },
    { url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1920&h=1080&fit=crop', name: 'Study with me', author: 'Focus Music' },
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
                  <span className="text-xl">☀️</span>
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
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <h3 className="text-white font-bold text-lg">Featuring</h3>
                    <span className="text-xl">✨</span>
                  </div>
                  <button className="text-white/60 hover:text-white text-sm flex items-center gap-1">
                    <i className="fas fa-share"></i>
                  </button>
                </div>
                <div className="grid grid-cols-4 gap-3">
                  {liveThemes.filter(t => t.featured).map((theme, index) => (
                    <div
                      key={index}
                      onClick={() => onChangeBackground(theme.url)}
                      className="group cursor-pointer relative rounded-xl overflow-hidden aspect-video bg-cover bg-center hover:ring-4 ring-purple-400 transition transform hover:scale-105"
                      style={{ backgroundImage: `url('${theme.url.replace('w=1920&h=1080', 'w=400&h=300')}')` }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent">
                        <div className="absolute bottom-2 left-2 right-2">
                          <div className="text-white text-xs font-semibold truncate">{theme.name}</div>
                          <div className="text-white/70 text-[10px]">by {theme.author}</div>
                        </div>
                        <div className="absolute top-2 left-2 bg-purple-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                          <span>✨</span> Featuring
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

              {/* All Live Themes */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-white/90 font-semibold">All Live Themes</h3>
                  <button className="text-white/60 hover:text-white text-sm">
                    + Contribute Themes
                  </button>
                </div>
                <div className="grid grid-cols-4 gap-3">
                  {liveThemes.map((theme, index) => (
                    <div
                      key={index}
                      onClick={() => onChangeBackground(theme.url)}
                      className="group cursor-pointer relative rounded-xl overflow-hidden aspect-video bg-cover bg-center hover:ring-4 ring-white/50 transition transform hover:scale-105"
                      style={{ backgroundImage: `url('${theme.url.replace('w=1920&h=1080', 'w=400&h=300')}')` }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent">
                        <div className="absolute bottom-2 left-2 right-2">
                          <div className="text-white text-xs font-semibold truncate">{theme.name}</div>
                          <div className="text-white/70 text-[10px]">by {theme.author}</div>
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

          {/* Upload Custom */}
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
        </div>

        <div
          className="absolute w-3 h-3 bg-white/30 border-2 border-white/60 rounded-full cursor-nwse-resize bottom-[-6px] right-[-6px] z-10 hover:bg-white/50"
          onMouseDown={handleResize}
        ></div>
      </div>
    </div>
  );
}

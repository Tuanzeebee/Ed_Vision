import { useState } from 'react';
import type { Track } from '../types/learningSpace';
import { useDraggable } from '../hooks/useDraggable';

type Props = {
  visible: boolean;
  onClose: () => void;
  currentTrack?: Track;
  initialX?: number;
  initialY?: number;
};

export default function MusicWidget({
  visible,
  onClose,
  currentTrack,
  initialX = window.innerWidth - 320,
  initialY = window.innerHeight - 280,
}: Props) {
  const { position, handleMouseDown } = useDraggable(initialX, initialY);
  const [expanded, setExpanded] = useState(false);

  if (!visible) return null;

  const track = currentTrack || {
    id: '1',
    title: 'Late night lofi',
    artist: 'ICARUS – Tony Ann',
    duration: '3:08',
    albumArt: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=100&h=100&fit=crop',
  };

  const upNextTracks = [
    {
      id: '2',
      title: 'Peaceful Piano',
      artist: 'Study Music',
      duration: '4:22',
      albumArt: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=40&h=40&fit=crop',
    },
    {
      id: '3',
      title: 'Ambient Focus',
      artist: 'Deep Concentration',
      duration: '5:15',
      albumArt: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=40&h=40&fit=crop',
    },
    {
      id: '4',
      title: 'Jazz Vibes',
      artist: 'Smooth Jazz',
      duration: '6:42',
      albumArt: 'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=40&h=40&fit=crop',
    },
  ];

  return (
    <div
      className="fixed z-30 select-none"
      style={{ left: `${position.x}px`, top: `${position.y}px` }}
    >
      <div
        className="w-72 backdrop-blur-[20px] bg-white/10 border border-white/20 rounded-2xl shadow-2xl transition-all duration-400 hover:shadow-[0_8px_24px_rgba(0,0,0,0.3)]"
      >
        {/* Draggable Header Bar */}
        <div
          className="h-2 w-full cursor-grab active:cursor-grabbing rounded-t-2xl hover:bg-white/10 transition-colors duration-200 relative group select-none"
          onMouseDown={handleMouseDown}
        >
          {/* Visual indicator on hover */}
          <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            <div className="w-8 h-0.5 bg-white/40 rounded-full"></div>
          </div>
        </div>

        <div className="px-4 pt-2 pb-3">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-gradient-to-br from-purple-500 to-pink-500">
              <img
                src={track.albumArt}
                alt="Album Cover"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-white font-semibold text-sm truncate">{track.title}</div>
              <div className="text-white/60 text-xs truncate">{track.artist}</div>
            </div>
            <button
              onClick={onClose}
              className="text-white/60 hover:text-white transition flex-shrink-0"
            >
              <i className="fas fa-times text-sm"></i>
            </button>
          </div>
        </div>

        <div className="px-4 pb-4">
          <div className="flex items-center justify-between mb-3">
            <button className="text-white/70 hover:text-white transition">
              <i className="fas fa-backward text-sm"></i>
            </button>
            <button className="w-9 h-9 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition">
              <i className="fas fa-play text-xs"></i>
            </button>
            <button className="text-white/70 hover:text-white transition">
              <i className="fas fa-forward text-sm"></i>
            </button>
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-white/70 hover:text-white transition"
            >
              <i className={`fas ${expanded ? 'fa-compress' : 'fa-expand'}`}></i>
            </button>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-white/50 text-xs">1:24</span>
            <div className="flex-1 h-1 bg-white/20 rounded-full overflow-hidden">
              <div className="h-full bg-white/60 rounded-full" style={{ width: '45%' }}></div>
            </div>
            <span className="text-white/50 text-xs">{track.duration}</span>
          </div>

          <div
            className={`overflow-hidden transition-[max-height] duration-400 ${
              expanded ? 'max-h-[500px]' : 'max-h-0'
            }`}
          >
            <div className="pt-4 border-t border-white/20 mt-4">
              <div className="mb-4">
                <div className="text-white/70 text-xs font-medium mb-2">Album</div>
                <div className="text-white text-sm">WonderSpace Lofi Collection</div>
              </div>
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <i className="fas fa-volume-up text-white/60 text-sm"></i>
                  <div className="flex-1 h-1.5 bg-white/20 rounded-full overflow-hidden">
                    <div className="h-full bg-white/60 rounded-full" style={{ width: '70%' }}></div>
                  </div>
                  <span className="text-white/60 text-xs">70%</span>
                </div>
              </div>
              <div className="flex items-center justify-between text-white/60 text-xs mb-4">
                <button className="hover:text-white transition">
                  <i className="fas fa-shuffle"></i>
                </button>
                <button className="hover:text-white transition">
                  <i className="fas fa-repeat"></i>
                </button>
                <button className="hover:text-white transition">
                  <i className="fas fa-heart"></i>
                </button>
                <button className="hover:text-white transition">
                  <i className="fas fa-list"></i>
                </button>
              </div>
              <div>
                <div className="text-white/70 text-xs font-medium mb-2">Up Next</div>
                <div className="space-y-2 max-h-40 overflow-y-auto scrollbar-none">
                  {upNextTracks.map((nextTrack) => (
                    <div
                      key={nextTrack.id}
                      className="flex items-center gap-2 p-2 rounded-lg bg-white/5 hover:bg-white/10 cursor-pointer transition"
                    >
                      <img
                        src={nextTrack.albumArt}
                        alt="Track"
                        className="w-8 h-8 rounded"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-white text-xs truncate">{nextTrack.title}</div>
                        <div className="text-white/50 text-xs truncate">{nextTrack.artist}</div>
                      </div>
                      <div className="text-white/50 text-xs">{nextTrack.duration}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

import { useState } from 'react';
import type { AmbienceTab, SoundType } from '../types/learningSpace';
import { useDraggable } from '../hooks/useDraggable';
import { useResizable } from '../hooks/useResizable';

type Props = {
  visible: boolean;
  onClose: () => void;
  selectedSound: SoundType | null;
  onSelectSound: (sound: SoundType) => void;
  soundVolume: number;
  onVolumeChange: (volume: number) => void;
  showRain: boolean;
  showSnow: boolean;
  onToggleRain: () => void;
  onToggleSnow: () => void;
  onResetAnimations: () => void;
  initialX?: number;
  initialY?: number;
  initialWidth?: number;
  initialHeight?: number;
};

export default function AmbiencePanel({
  visible,
  onClose,
  selectedSound,
  onSelectSound,
  soundVolume,
  onVolumeChange,
  showRain,
  showSnow,
  onToggleRain,
  onToggleSnow,
  onResetAnimations,
  initialX = (window.innerWidth - 800) / 2,
  initialY = (window.innerHeight - 600 - 80) / 2,
  initialWidth = 800,
  initialHeight = 600,
}: Props) {
  const { position, handleMouseDown } = useDraggable(initialX, initialY);
  const { size, handleMouseDown: handleResize } = useResizable(initialWidth, initialHeight, 380, 500);
  const [tab, setTab] = useState<AmbienceTab>('sounds');

  if (!visible) return null;

  const sounds: Array<{ type: SoundType; icon: string; label: string; locked: boolean }> = [
    { type: 'rain', icon: 'fas fa-cloud-rain', label: 'rain', locked: false },
    { type: 'birds', icon: 'fas fa-dove', label: 'birds', locked: false },
    { type: 'campfire', icon: 'fas fa-fire', label: 'campfire', locked: false },
    { type: 'waves', icon: 'fas fa-water', label: 'waves', locked: true },
    { type: 'thunderstorm', icon: 'fas fa-bolt', label: 'thunderstorm', locked: true },
    { type: 'keyboard', icon: 'fas fa-keyboard', label: 'keyboard', locked: true },
    { type: 'cafe', icon: 'fas fa-mug-hot', label: 'cafe', locked: true },
    { type: 'wind-chimes', icon: 'fas fa-bell', label: 'wind chimes', locked: true },
    { type: 'singing-bowl', icon: 'fas fa-om', label: 'singing bowl', locked: true },
    { type: 'white-noise', icon: 'fas fa-wave-square', label: 'white noise', locked: true },
    { type: 'crickets', icon: 'fas fa-bug', label: 'crickets', locked: true },
  ];

  return (
    <div
      className="fixed z-10"
      style={{ left: `${position.x}px`, top: `${position.y}px`, width: `${size.width}px` }}
    >
      <div
        className="backdrop-blur-[20px] bg-black/30 border border-white/10 rounded-3xl shadow-2xl flex flex-col"
        style={{ height: `${size.height}px` }}
      >
        {/* Header */}
        <div
          className="flex-shrink-0 h-10 cursor-move rounded-t-3xl flex items-center justify-between px-6"
          onMouseDown={handleMouseDown}
        >
          <h2 className="text-lg font-semibold text-white">Ambience</h2>
          <button
            onClick={onClose}
            className="text-white/60 hover:text-white transition"
          >
            <i className="fas fa-times text-xl"></i>
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex-shrink-0 px-6 pt-4 pb-2">
          <div className="flex gap-2">
            <button
              onClick={() => setTab('sounds')}
              className={`flex-1 py-2.5 px-4 rounded-xl text-sm transition ${
                tab === 'sounds'
                  ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white font-semibold'
                  : 'bg-white/10 text-white/70 border border-white/20'
              }`}
            >
              Sounds
            </button>
            <button
              onClick={() => setTab('animations')}
              className={`flex-1 py-2.5 px-4 rounded-xl text-sm transition ${
                tab === 'animations'
                  ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white font-semibold'
                  : 'bg-white/10 text-white/70 border border-white/20'
              }`}
            >
              Animations
            </button>
          </div>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-auto scrollbar-none px-6 pb-6">
          {tab === 'sounds' && (
            <>
              <h3 className="text-white text-xl font-bold mb-5">Sounds</h3>
              <div className="grid grid-cols-3 gap-4 mb-6">
                {sounds.map((sound) => (
                  <div
                    key={sound.type}
                    onClick={() => !sound.locked && onSelectSound(sound.type)}
                    className={`flex flex-col items-center gap-2 p-4 rounded-xl bg-white/5 cursor-pointer transition ${
                      sound.locked
                        ? 'opacity-50 cursor-not-allowed'
                        : 'hover:bg-white/10 hover:-translate-y-0.5'
                    } ${selectedSound === sound.type ? 'text-orange-500' : ''} relative`}
                  >
                    <i
                      className={`${sound.icon} text-3xl ${
                        selectedSound === sound.type ? 'text-orange-500' : 'text-white/80'
                      } ${sound.locked ? 'text-white/40' : ''}`}
                    ></i>
                    <span
                      className={`text-xs font-medium ${
                        selectedSound === sound.type ? 'text-orange-500' : 'text-white/80'
                      } ${sound.locked ? 'text-white/40' : ''}`}
                    >
                      {sound.label}
                    </span>
                    {sound.locked && (
                      <i className="fas fa-lock absolute top-2 right-2 text-orange-500 text-xs"></i>
                    )}
                  </div>
                ))}
              </div>
              {selectedSound && (
                <div className="mt-6">
                  <div className="flex items-center gap-3">
                    <i className="fas fa-volume-up text-white/60 text-sm"></i>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={soundVolume}
                      onChange={(e) => onVolumeChange(Number(e.target.value))}
                      className="flex-1 h-2 bg-white/20 rounded-full appearance-none cursor-pointer accent-orange-500"
                    />
                    <span className="text-white/60 text-sm font-medium">{soundVolume}%</span>
                  </div>
                </div>
              )}
            </>
          )}

          {tab === 'animations' && (
            <>
              <h3 className="text-white text-xl font-bold mb-6">Animations</h3>
              <div className="space-y-4 mb-6">
                <div className="flex items-center justify-between p-4 rounded-xl bg-white/5">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">💧</span>
                    <span className="text-white font-medium">Rain</span>
                  </div>
                  <div
                    onClick={onToggleRain}
                    className={`relative w-12 h-6 rounded-full cursor-pointer transition ${
                      showRain
                        ? 'bg-gradient-to-r from-orange-500 to-amber-500 shadow-[0_0_12px_rgba(249,115,22,0.5)]'
                        : 'bg-white/20'
                    }`}
                  >
                    <div
                      className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-all ${
                        showRain ? 'left-[26px]' : 'left-0.5'
                      }`}
                    ></div>
                  </div>
                </div>
                <div className="flex items-center justify-between p-4 rounded-xl bg-white/5">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">❄</span>
                    <span className="text-white font-medium">Snow</span>
                  </div>
                  <div
                    onClick={onToggleSnow}
                    className={`relative w-12 h-6 rounded-full cursor-pointer transition ${
                      showSnow
                        ? 'bg-gradient-to-r from-orange-500 to-amber-500 shadow-[0_0_12px_rgba(249,115,22,0.5)]'
                        : 'bg-white/20'
                    }`}
                  >
                    <div
                      className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-all ${
                        showSnow ? 'left-[26px]' : 'left-0.5'
                      }`}
                    ></div>
                  </div>
                </div>
              </div>
              <button
                onClick={onResetAnimations}
                className="w-full py-3 px-4 rounded-xl bg-transparent border-2 border-orange-500/50 text-white font-medium hover:bg-orange-500/10 hover:border-orange-500 transition"
              >
                RESET ALL
              </button>
            </>
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

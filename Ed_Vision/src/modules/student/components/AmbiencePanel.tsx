import { useState } from 'react';
import type { AmbienceTab, SoundType } from '../types/learningSpace';
import { useDraggable } from '../hooks/useDraggable';
import { useResizable } from '../hooks/useResizable';

type Props = {
  visible: boolean;
  onClose: () => void;
  soundVolumes: Record<SoundType, number>;
  onSoundVolumeChange: (sound: SoundType, volume: number) => void;
  showRain: boolean;
  showSnow: boolean;
  showFireflies: boolean;
  showLeaves: boolean;
  showStars: boolean;
  showClouds: boolean;
  onToggleRain: () => void;
  onToggleSnow: () => void;
  onToggleFireflies: () => void;
  onToggleLeaves: () => void;
  onToggleStars: () => void;
  onToggleClouds: () => void;
  onResetAnimations: () => void;
  initialX?: number;
  initialY?: number;
  initialWidth?: number;
  initialHeight?: number;
};

export default function AmbiencePanel({
  visible,
  onClose,
  soundVolumes,
  onSoundVolumeChange,
  showRain,
  showSnow,
  showFireflies,
  showLeaves,
  showStars,
  showClouds,
  onToggleRain,
  onToggleSnow,
  onToggleFireflies,
  onToggleLeaves,
  onToggleStars,
  onToggleClouds,
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

  const sounds: Array<{ type: SoundType; icon: string; label: string }> = [
    { type: 'rain', icon: 'fas fa-cloud-rain', label: 'rain' },
    { type: 'birds', icon: 'fas fa-dove', label: 'birds' },
    { type: 'campfire', icon: 'fas fa-fire', label: 'campfire' },
    { type: 'waves', icon: 'fas fa-water', label: 'waves' },
    { type: 'thunderstorm', icon: 'fas fa-bolt', label: 'thunderstorm' },
    { type: 'keyboard', icon: 'fas fa-keyboard', label: 'keyboard' },
    { type: 'cafe', icon: 'fas fa-mug-hot', label: 'cafe' },
    { type: 'wind-chimes', icon: 'fas fa-bell', label: 'wind chimes' },
    { type: 'singing-bowl', icon: 'fas fa-om', label: 'singing bowl' },
    { type: 'white-noise', icon: 'fas fa-wave-square', label: 'white noise' },
    { type: 'crickets', icon: 'fas fa-bug', label: 'crickets' },
    { type: 'forest', icon: 'fas fa-tree', label: 'forest' },
    { type: 'wind', icon: 'fas fa-wind', label: 'wind' },
    { type: 'river', icon: 'fas fa-stream', label: 'river' },
    { type: 'owl', icon: 'fas fa-moon', label: 'night owl' },
    { type: 'city', icon: 'fas fa-city', label: 'city' },
    { type: 'clock', icon: 'fas fa-clock', label: 'clock' },
    { type: 'fan', icon: 'fas fa-fan', label: 'fan' },
    { type: 'train', icon: 'fas fa-train', label: 'train' },
  ];

  // Màu vàng cam giống hình (Amber/Gold)
  const activeColor = '#FFB020'; 
  const activeShadow = 'rgba(255, 176, 32, 0.6)';

  return (
    <div
      className="fixed z-10"
      style={{ left: `${position.x}px`, top: `${position.y}px`, width: `${size.width}px` }}
    >
      <div
        className="backdrop-blur-[20px] bg-white/10 border border-white/20 rounded-3xl shadow-2xl flex flex-col"
        style={{ height: `${size.height}px` }}
      >
        {/* Style block for slider thumb using CSS variables */}
        <style>{`
          .ambience-slider::-webkit-slider-thumb {
            -webkit-appearance: none;
            appearance: none;
            width: 14px;
            height: 14px;
            border-radius: 50%;
            background: var(--thumb-color, #666) !important;
            box-shadow: var(--thumb-shadow, none) !important;
            transition: all 0.2s;
            cursor: pointer;
          }
          .ambience-slider::-webkit-slider-thumb:hover {
            transform: scale(1.2);
          }
          .ambience-slider::-moz-range-thumb {
            width: 14px;
            height: 14px;
            border: none;
            border-radius: 50%;
            background: var(--thumb-color, #666) !important;
            box-shadow: var(--thumb-shadow, none) !important;
            transition: all 0.2s;
            cursor: pointer;
          }
        `}</style>

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
              <div className="grid grid-cols-3 gap-6 mb-6">
                {sounds.map((sound) => {
                  const volume = soundVolumes[sound.type] || 0;
                  const isActive = volume > 0;
                  
                  return (
                    <div
                      key={sound.type}
                      className="flex flex-col items-center gap-3"
                    >
                      {/* Icon Toggle */}
                      <div
                        onClick={() => {
                          if (isActive) {
                            onSoundVolumeChange(sound.type, 0);
                          } else {
                            onSoundVolumeChange(sound.type, 50); // Default volume 50%
                          }
                        }}
                        className={`flex flex-col items-center justify-center w-16 h-16 rounded-2xl cursor-pointer transition-all duration-300 ${
                          isActive
                            ? 'bg-white/10'
                            : 'bg-white/5 text-white/50 hover:bg-white/10 hover:text-white/80'
                        }`}
                        style={isActive ? {
                          color: activeColor,
                          boxShadow: `0 0 20px ${activeShadow}`
                        } : {}}
                      >
                        <i className={`${sound.icon} text-3xl`}></i>
                      </div>

                      {/* Label */}
                      <span
                        className="text-xs font-medium uppercase tracking-wider"
                        style={{ color: isActive ? activeColor : 'rgba(255,255,255,0.4)' }}
                      >
                        {sound.label}
                      </span>

                      {/* Volume Slider */}
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={volume}
                        onChange={(e) => onSoundVolumeChange(sound.type, Number(e.target.value))}
                        className="w-full h-1.5 rounded-full appearance-none cursor-pointer focus:outline-none ambience-slider"
                        style={{
                          background: isActive 
                            ? `linear-gradient(to right, ${activeColor} 0%, ${activeColor} ${volume}%, rgba(255,255,255,0.1) ${volume}%, rgba(255,255,255,0.1) 100%)`
                            : 'rgba(255,255,255,0.1)',
                          // CSS Variables for the thumb
                          '--thumb-color': isActive ? activeColor : '#666',
                          '--thumb-shadow': isActive ? `0 0 10px ${activeColor}` : 'none',
                          // Fallback accent color
                          accentColor: isActive ? activeColor : '#666',
                        } as React.CSSProperties}
                      />
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {tab === 'animations' && (
            <>
              <h3 className="text-white text-xl font-bold mb-6">Animations</h3>
              <div className="grid grid-cols-2 gap-4 mb-6">
                {/* Rain */}
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

                {/* Snow */}
                <div className="flex items-center justify-between p-4 rounded-xl bg-white/5">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">❄️</span>
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

                {/* Fireflies */}
                <div className="flex items-center justify-between p-4 rounded-xl bg-white/5">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">✨</span>
                    <span className="text-white font-medium">Fireflies</span>
                  </div>
                  <div
                    onClick={onToggleFireflies}
                    className={`relative w-12 h-6 rounded-full cursor-pointer transition ${
                      showFireflies
                        ? 'bg-gradient-to-r from-orange-500 to-amber-500 shadow-[0_0_12px_rgba(249,115,22,0.5)]'
                        : 'bg-white/20'
                    }`}
                  >
                    <div
                      className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-all ${
                        showFireflies ? 'left-[26px]' : 'left-0.5'
                      }`}
                    ></div>
                  </div>
                </div>

                {/* Leaves */}
                <div className="flex items-center justify-between p-4 rounded-xl bg-white/5">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">🍂</span>
                    <span className="text-white font-medium">Leaves</span>
                  </div>
                  <div
                    onClick={onToggleLeaves}
                    className={`relative w-12 h-6 rounded-full cursor-pointer transition ${
                      showLeaves
                        ? 'bg-gradient-to-r from-orange-500 to-amber-500 shadow-[0_0_12px_rgba(249,115,22,0.5)]'
                        : 'bg-white/20'
                    }`}
                  >
                    <div
                      className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-all ${
                        showLeaves ? 'left-[26px]' : 'left-0.5'
                      }`}
                    ></div>
                  </div>
                </div>

                {/* Stars */}
                <div className="flex items-center justify-between p-4 rounded-xl bg-white/5">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">⭐</span>
                    <span className="text-white font-medium">Stars</span>
                  </div>
                  <div
                    onClick={onToggleStars}
                    className={`relative w-12 h-6 rounded-full cursor-pointer transition ${
                      showStars
                        ? 'bg-gradient-to-r from-orange-500 to-amber-500 shadow-[0_0_12px_rgba(249,115,22,0.5)]'
                        : 'bg-white/20'
                    }`}
                  >
                    <div
                      className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-all ${
                        showStars ? 'left-[26px]' : 'left-0.5'
                      }`}
                    ></div>
                  </div>
                </div>

                {/* Clouds */}
                <div className="flex items-center justify-between p-4 rounded-xl bg-white/5">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">☁️</span>
                    <span className="text-white font-medium">Clouds</span>
                  </div>
                  <div
                    onClick={onToggleClouds}
                    className={`relative w-12 h-6 rounded-full cursor-pointer transition ${
                      showClouds
                        ? 'bg-gradient-to-r from-orange-500 to-amber-500 shadow-[0_0_12px_rgba(249,115,22,0.5)]'
                        : 'bg-white/20'
                    }`}
                  >
                    <div
                      className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-all ${
                        showClouds ? 'left-[26px]' : 'left-0.5'
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

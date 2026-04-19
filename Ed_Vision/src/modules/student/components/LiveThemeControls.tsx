import { useState, useEffect } from 'react';

type Props = {
  visible: boolean;
  onClose: () => void;
  onVolumeChange?: (volume: number) => void;
  onMuteToggle?: (muted: boolean) => void;
};

export default function LiveThemeControls({ visible, onClose, onVolumeChange, onMuteToggle }: Props) {
  const [volume, setVolume] = useState(30);
  const [muted, setMuted] = useState(false);

  if (!visible) return null;

  const handleVolumeChange = (newVolume: number) => {
    setVolume(newVolume);
    if (onVolumeChange) {
      onVolumeChange(newVolume);
    }
    if (newVolume > 0 && muted) {
      setMuted(false);
      if (onMuteToggle) onMuteToggle(false);
    }
  };

  const toggleMute = () => {
    const newMuted = !muted;
    setMuted(newMuted);
    if (onMuteToggle) {
      onMuteToggle(newMuted);
    }
  };

  return (
    <div className="fixed bottom-24 right-6 z-30">
      <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl shadow-2xl p-4 w-64">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <i className="fas fa-play-circle text-purple-400 text-lg"></i>
            <h3 className="text-white font-semibold text-sm">Live Theme Controls</h3>
          </div>
          <button
            onClick={onClose}
            className="text-white/60 hover:text-white transition"
          >
            <i className="fas fa-times"></i>
          </button>
        </div>

        {/* Volume Control */}
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <button
              onClick={toggleMute}
              className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/10 hover:bg-white/20 text-white transition"
            >
              <i className={`fas ${muted ? 'fa-volume-mute' : volume > 50 ? 'fa-volume-up' : 'fa-volume-down'}`}></i>
            </button>
            
            <div className="flex-1">
              <input
                type="range"
                min="0"
                max="100"
                value={volume}
                onChange={(e) => handleVolumeChange(parseInt(e.target.value))}
                className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer
                  [&::-webkit-slider-thumb]:appearance-none 
                  [&::-webkit-slider-thumb]:w-4 
                  [&::-webkit-slider-thumb]:h-4 
                  [&::-webkit-slider-thumb]:bg-purple-500 
                  [&::-webkit-slider-thumb]:rounded-full 
                  [&::-webkit-slider-thumb]:cursor-pointer
                  [&::-webkit-slider-thumb]:shadow-lg
                  [&::-webkit-slider-thumb]:hover:bg-purple-400
                  [&::-moz-range-thumb]:w-4 
                  [&::-moz-range-thumb]:h-4 
                  [&::-moz-range-thumb]:bg-purple-500 
                  [&::-moz-range-thumb]:rounded-full 
                  [&::-moz-range-thumb]:cursor-pointer
                  [&::-moz-range-thumb]:border-0"
                style={{
                  background: `linear-gradient(to right, rgb(168, 85, 247) 0%, rgb(168, 85, 247) ${volume}%, rgba(255, 255, 255, 0.2) ${volume}%, rgba(255, 255, 255, 0.2) 100%)`
                }}
              />
            </div>
            
            <span className="text-white text-xs font-medium w-8 text-right">{volume}%</span>
          </div>

          {/* Info */}
          <div className="text-white/60 text-xs text-center pt-2 border-t border-white/10">
            <i className="fas fa-info-circle mr-1"></i>
            Adjust video volume
          </div>
        </div>
      </div>
    </div>
  );
}

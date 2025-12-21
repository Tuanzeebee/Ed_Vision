import { useState, useRef, useEffect } from 'react';

type Props = {
  visible: boolean;
  focusTitle: string;
  timeLeft: number;
  totalTime?: number;
  isRunning?: boolean;
  onClose: () => void;
  onPause?: () => void;
  onStop?: () => void;
  onOpenPanel?: () => void;
  onAddTime?: (amount: number) => void;
};

export default function PomodoroOverlay({ visible, focusTitle, timeLeft, totalTime = 300, isRunning = true, onClose: _onClose, onPause, onStop, onOpenPanel, onAddTime }: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(focusTitle);
  const inputRef = useRef<HTMLInputElement>(null);
  const stopSound = useRef(new Audio('/sounds/pomodoro/stop.mp3'));

  useEffect(() => {
    stopSound.current.volume = 0.3;
  }, []);

  useEffect(() => {
    setEditTitle(focusTitle);
  }, [focusTitle]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  const handleEditSubmit = () => {
    setIsEditing(false);
    if (editTitle.trim()) {
      // Call global handler to update title in parent
      if ((window as any).__pomoUpdateTitleHandler) {
        (window as any).__pomoUpdateTitleHandler(editTitle);
      }
    } else {
      setEditTitle(focusTitle); // Revert if empty
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleEditSubmit();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      setEditTitle(focusTitle);
    }
  };

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return {
      hours: String(hrs).padStart(2, '0'),
      minutes: String(mins).padStart(2, '0'),
      seconds: String(secs).padStart(2, '0'),
    };
  };

  const time = formatTime(timeLeft);
  const progress = Math.min(100, Math.max(0, Math.round(((totalTime - timeLeft) / totalTime) * 100)));

  if (!visible) return null;

  return (
    <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-[5] group">
      <div className="px-8 py-6 pointer-events-none">
        {/* Control Buttons - Top Left */}
        <div className="absolute top-4 left-4 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-auto">
          <button
            onClick={onOpenPanel}
            className="w-10 h-10 backdrop-blur-md bg-white/10 hover:bg-white/20 rounded-lg border border-white/20 flex items-center justify-center transition"
            title="Open Panel"
          >
            <i className="far fa-window-maximize text-white text-sm"></i>
          </button>
        </div>

        {/* Control Buttons - Top Right */}
        <div className="absolute top-4 right-4 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-auto">
          <button
            onClick={() => setIsEditing(true)}
            className="w-10 h-10 backdrop-blur-md bg-white/10 hover:bg-white/20 rounded-lg border border-white/20 flex items-center justify-center transition"
            title="Edit Title"
          >
            <i className="fas fa-pen text-white text-sm"></i>
          </button>
        </div>

        {/* Timer Content */}
        <div className="text-center mb-3 pointer-events-auto h-8 flex items-center justify-center">
          {isEditing ? (
            <input
              ref={inputRef}
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onBlur={handleEditSubmit}
              onKeyDown={handleKeyDown}
              className="bg-white/10 border border-white/20 rounded px-2 py-1 text-white text-sm font-medium text-center w-[200px] focus:outline-none focus:bg-white/20"
            />
          ) : (
            <span className="text-white text-sm font-medium tracking-wide drop-shadow-lg">
              {focusTitle || 'Focusing'}
            </span>
          )}
        </div>
        <div className="flex flex-col items-center">
          <div className="flex items-center justify-center gap-2 pointer-events-auto relative">
            {/* Minus Time Button */}
            <button
              onClick={() => onAddTime?.(-300)}
              className="absolute right-full mr-6 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/70 hover:text-white transition opacity-0 group-hover:opacity-100 transform hover:scale-110"
              title="-5 minutes"
            >
              <i className="fas fa-minus text-sm"></i>
            </button>

            {time.hours !== '00' && (
              <>
                <span className="text-white text-8xl font-bold tracking-tight drop-shadow-2xl">
                  {time.hours}
                </span>
                <span className="text-white text-8xl font-bold drop-shadow-2xl pb-4">:</span>
              </>
            )}
            <span className="text-white text-8xl font-bold tracking-tight drop-shadow-2xl">
              {time.minutes}
            </span>
            <span className="text-white text-8xl font-bold drop-shadow-2xl pb-4">:</span>
            <span className="text-white text-8xl font-bold tracking-tight drop-shadow-2xl">
              {time.seconds}
            </span>

            {/* Add Time Button */}
            <button
              onClick={() => onAddTime?.(300)}
              className="absolute left-full ml-6 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/70 hover:text-white transition opacity-0 group-hover:opacity-100 transform hover:scale-110"
              title="+5 minutes"
            >
              <i className="fas fa-plus text-sm"></i>
            </button>
          </div>

          <div className="relative flex items-center justify-center mt-2 w-[320px]">
            {/* Background Bar */}
            <div className="w-full h-1.5 bg-white/10 rounded-full overflow-visible backdrop-blur-sm relative">
              {/* Progress Fill */}
              <div 
                className="absolute top-0 left-0 h-full bg-[#E6A23C] rounded-full transition-all duration-1000 ease-linear shadow-[0_0_15px_rgba(230,162,60,0.8),0_0_30px_rgba(230,162,60,0.4)]"
                style={{ width: `${progress}%` }}
              >
              </div>
            </div>
            
            <div className="absolute left-full ml-3 text-white/90 font-medium text-sm drop-shadow-md w-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              {progress}%
            </div>
          </div>
        </div>

        {/* Bottom Control Buttons */}
        <div className="flex items-center justify-center gap-3 mt-6 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-auto">
          <button
            onClick={onOpenPanel}
            className="w-12 h-12 backdrop-blur-md bg-white/10 hover:bg-white/20 rounded-full border border-white/20 flex items-center justify-center transition"
            title="View"
          >
            <i className="far fa-eye text-white text-lg"></i>
          </button>
          <button
            onClick={onPause}
            className="w-12 h-12 backdrop-blur-md bg-white/10 hover:bg-white/20 rounded-full border border-white/20 flex items-center justify-center transition"
            title={isRunning ? "Pause" : "Resume"}
          >
            <i className={`fas ${isRunning ? 'fa-pause' : 'fa-play'} text-white text-lg`}></i>
          </button>
          <button
            onClick={() => {
              stopSound.current.play().catch(e => console.error("Error playing stop sound:", e));
              onStop?.();
            }}
            className="w-12 h-12 backdrop-blur-md bg-white/10 hover:bg-white/20 rounded-full border border-white/20 flex items-center justify-center transition"
            title="Stop"
          >
            <i className="fas fa-stop text-white text-lg"></i>
          </button>
          <button
            className="w-12 h-12 backdrop-blur-md bg-white/10 hover:bg-white/20 rounded-full border border-white/20 flex items-center justify-center transition"
            title="Full Screen"
          >
            <i className="fas fa-expand text-white text-lg"></i>
          </button>
        </div>
      </div>
    </div>
  );
}

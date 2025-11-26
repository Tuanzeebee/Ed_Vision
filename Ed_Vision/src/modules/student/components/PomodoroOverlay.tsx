type Props = {
  visible: boolean;
  focusTitle: string;
  timeLeft: number;
  onClose: () => void;
  onPause?: () => void;
  onStop?: () => void;
  onOpenPanel?: () => void;
};

export default function PomodoroOverlay({ visible, focusTitle, timeLeft, onClose, onPause, onStop, onOpenPanel }: Props) {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return {
      minutes: String(mins).padStart(2, '0'),
      seconds: String(secs).padStart(2, '0'),
    };
  };

  const time = formatTime(timeLeft);

  if (!visible) return null;

  return (
    <div className="fixed top-8 left-1/2 transform -translate-x-1/2 z-[5] group">
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
            onClick={onOpenPanel}
            className="w-10 h-10 backdrop-blur-md bg-white/10 hover:bg-white/20 rounded-lg border border-white/20 flex items-center justify-center transition"
            title="Edit"
          >
            <i className="fas fa-pen text-white text-sm"></i>
          </button>
        </div>

        {/* Timer Content */}
        <div className="text-center mb-3">
          <span className="text-white text-sm font-medium tracking-wide drop-shadow-lg">
            {focusTitle || 'Focusing'}
          </span>
        </div>
        <div className="flex items-center justify-center gap-2">
          <span className="text-white text-7xl font-bold tracking-tight drop-shadow-2xl">
            {String(time.minutes).padStart(2, '0')}
          </span>
          <span className="text-white text-7xl font-bold drop-shadow-2xl">:</span>
          <span className="text-white text-7xl font-bold tracking-tight drop-shadow-2xl">
            {String(time.seconds).padStart(2, '0')}
          </span>
        </div>
        <div className="flex items-center justify-center gap-6 mt-4">
          <div className="w-2 h-2 bg-white/80 rounded-full animate-pulse drop-shadow-lg"></div>
          <div className="w-2 h-2 bg-white/80 rounded-full animate-pulse delay-100 drop-shadow-lg"></div>
          <div className="w-2 h-2 bg-white/80 rounded-full animate-pulse delay-200 drop-shadow-lg"></div>
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
            title="Pause"
          >
            <i className="fas fa-play text-white text-lg"></i>
          </button>
          <button
            onClick={onStop}
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

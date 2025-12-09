import { useState, useEffect } from 'react';
import type { PomoMode } from '../types/learningSpace';
import { useDraggable } from '../hooks/useDraggable';
import { useResizable } from '../hooks/useResizable';

type Props = {
  visible: boolean;
  onClose: () => void;
  onStartTimer?: (isRunning: boolean, title: string, timeLeft: number) => void;
  onStopTimer?: () => void;
  initialX?: number;
  initialY?: number;
  initialWidth?: number;
  initialHeight?: number;
};

export default function PomodoroPanel({
  visible,
  onClose,
  onStartTimer,
  onStopTimer,
  initialX = (window.innerWidth - 520) / 2,
  initialY = window.innerHeight - 420 - 120,
  initialWidth = 520,
  initialHeight = 420,
}: Props) {
  const { position, handleMouseDown } = useDraggable(initialX, initialY);
  const { size, handleMouseDown: handleResize } = useResizable(initialWidth, initialHeight, 360, 420);
  const [mode, setMode] = useState<PomoMode>('short');
  const [isRunning, setIsRunning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(5 * 60); // 5 minutes in seconds
  const [focusTitle, setFocusTitle] = useState('');
  
  // Expose stop handler
  useEffect(() => {
    if (onStopTimer) {
      (window as any).__pomoStopHandler = () => {
        setIsRunning(false);
      };
    }
  }, [onStopTimer]);
  
  // Expose timeLeft to parent
  useEffect(() => {
    if (isRunning && onStartTimer) {
      onStartTimer(true, focusTitle, timeLeft);
    }
  }, [timeLeft, isRunning, focusTitle, onStartTimer]);

  const modeTime = {
    focus: 25 * 60,
    short: 5 * 60,
    long: 15 * 60,
  };

  useEffect(() => {
    setTimeLeft(modeTime[mode]);
  }, [mode]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setIsRunning(false);
      if (onStartTimer) onStartTimer(false, focusTitle, 0);
    }
    return () => clearInterval(interval);
  }, [isRunning, timeLeft, onStartTimer, focusTitle]);

  const handleStartStop = () => {
    const newRunningState = !isRunning;
    setIsRunning(newRunningState);
    if (onStartTimer) {
      onStartTimer(newRunningState, focusTitle, timeLeft);
    }
  };

  const handleReset = () => {
    setIsRunning(false);
    const resetTime = modeTime[mode];
    setTimeLeft(resetTime);
    if (onStartTimer) onStartTimer(false, focusTitle, resetTime);
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

  if (!visible) return null;

  return (
    <div
      className="fixed z-10"
      style={{ left: `${position.x}px`, top: `${position.y}px`, width: `${size.width}px` }}
    >
      <div
        className="backdrop-blur-[20px] bg-white/10 border border-white/20 rounded-3xl shadow-2xl flex flex-col relative"
        style={{ height: `${size.height}px` }}
      >
        <div
          className="absolute top-0 left-0 right-0 h-12 cursor-move rounded-t-3xl flex items-center justify-between px-5"
          onMouseDown={handleMouseDown}
        >
          <button
            onClick={onClose}
            className="text-white/60 hover:text-white transition w-8 h-8 flex items-center justify-center"
          >
            <i className="fas fa-times text-lg"></i>
          </button>
          <h2 className="text-xl font-bold text-white">Pomodoro</h2>
          <button className="text-white/60 hover:text-white transition w-8 h-8 flex items-center justify-center">
            <i className="fas fa-gear text-lg"></i>
          </button>
        </div>

        <div className="pt-14 pb-6 px-6 h-full flex flex-col">
          <div className="flex items-center justify-center gap-2 mb-6">
            <button
              onClick={() => setMode('focus')}
              className={`px-4 py-2 rounded-full text-sm transition ${
                mode === 'focus'
                  ? 'bg-white/20 text-white font-semibold'
                  : 'bg-transparent text-white/50 hover:text-white/80'
              }`}
            >
              Focus
            </button>
            <button
              onClick={() => setMode('short')}
              className={`px-4 py-2 rounded-full text-sm transition ${
                mode === 'short'
                  ? 'bg-white/20 text-white font-semibold'
                  : 'bg-transparent text-white/50 hover:text-white/80'
              }`}
            >
              Short Break
            </button>
            <button
              onClick={() => setMode('long')}
              className={`px-4 py-2 rounded-full text-sm transition ${
                mode === 'long'
                  ? 'bg-white/20 text-white font-semibold'
                  : 'bg-transparent text-white/50 hover:text-white/80'
              }`}
            >
              Long Break
            </button>
          </div>

          <div className="text-center mb-4">
            <input
              type="text"
              value={focusTitle}
              onChange={(e) => setFocusTitle(e.target.value)}
              placeholder="click to add focus title"
              className="bg-transparent border-none text-white/70 text-sm text-center w-full focus:outline-none focus:text-white placeholder-white/50"
            />
          </div>

          <div className="flex items-center justify-center mb-6">
            <div className="flex flex-col items-center">
              <span className="text-[4rem] font-extrabold leading-none tracking-tight text-white">{time.hours}</span>
              <span className="text-[0.65rem] font-semibold tracking-[0.1em] uppercase text-white/60 mt-1">HR</span>
            </div>
            <span className="text-5xl font-bold mx-2 text-white/80">:</span>
            <div className="flex flex-col items-center">
              <span className="text-[4rem] font-extrabold leading-none tracking-tight text-white">{time.minutes}</span>
              <span className="text-[0.65rem] font-semibold tracking-[0.1em] uppercase text-white/60 mt-1">MIN</span>
            </div>
            <span className="text-5xl font-bold mx-2 text-white/80">:</span>
            <div className="flex flex-col items-center">
              <span className="text-[4rem] font-extrabold leading-none tracking-tight text-white">{time.seconds}</span>
              <span className="text-[0.65rem] font-semibold tracking-[0.1em] uppercase text-white/60 mt-1">SEC</span>
            </div>
          </div>

          <div className="flex justify-center mb-6">
            <div className="bg-white/10 border border-white/20 rounded-full px-4 py-1.5">
              <span className="text-white text-xs font-medium">Mode: Spotlight</span>
            </div>
          </div>

          <div className="flex gap-3">
            <button 
              onClick={handleStartStop}
              className="flex-1 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold py-4 rounded-2xl transition shadow-lg hover:shadow-xl"
            >
              {isRunning ? 'Pause' : 'Start Timer'}
            </button>
            {isRunning && (
              <button 
                onClick={handleReset}
                className="px-6 bg-white/10 hover:bg-white/20 text-white font-bold py-4 rounded-2xl transition border border-white/20"
              >
                Reset
              </button>
            )}
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

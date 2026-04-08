import { useState, useEffect, useRef } from 'react';
import type { PomoMode } from '../types/learningSpace';
import { useDraggable } from '../hooks/useDraggable';
import { useResizable } from '../hooks/useResizable';
import { toast } from 'react-hot-toast';

type Props = {
  visible: boolean;
  onClose: () => void;
  onStartTimer?: (isRunning: boolean, title: string, timeLeft: number, totalTime: number) => void;
  onStopTimer?: () => void;
  onViewModeChange?: (mode: 'spotlight' | 'minimalist') => void;
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
  onViewModeChange,
  initialX = (window.innerWidth - 480) / 2, // Default width changed from 520
  initialY = window.innerHeight - 400 - 100, // Adjusted height slightly
  initialWidth = 480, // Reduced from 520
  initialHeight = 400, // Reduced from 420
}: Props) {
  const { position, handleMouseDown } = useDraggable(initialX, initialY);
  const { size, handleMouseDown: handleResize } = useResizable(initialWidth, initialHeight, 360, 380); // Min size adjusted
  
  // UI State - what the user sees in the panel
  const [uiMode, setUiMode] = useState<PomoMode>('focus');
  const [viewMode, setViewMode] = useState<'spotlight' | 'minimalist'>('spotlight');
  const [focusTitle, setFocusTitle] = useState('');

  // Manual Input State
  const [inputHours, setInputHours] = useState('00');
  const [inputMinutes, setInputMinutes] = useState('25');
  const [inputSeconds, setInputSeconds] = useState('00');

  // Active Session State - the actual running timer
  const [activeMode, setActiveMode] = useState<PomoMode>('focus');
  const [isRunning, setIsRunning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [totalTime, setTotalTime] = useState(25 * 60);
  
  const modeTime = {
    focus: 25 * 60,
    short: 5 * 60,
    long: 15 * 60,
  };

  const activeModeRef = useRef(activeMode);
  const focusTitleRef = useRef(focusTitle);
  const onStartTimerRef = useRef(onStartTimer);
  const isRunningRef = useRef(isRunning);

  // Audio Refs
  const startSound = useRef(new Audio('/sounds/pomodoro/start.mp3'));
  const stopSound = useRef(new Audio('/sounds/pomodoro/stop.mp3'));
  const pauseSound = useRef(new Audio('/sounds/pomodoro/pause.mp3'));

  useEffect(() => {
    startSound.current.volume = 0.3;
    stopSound.current.volume = 0.3;
    pauseSound.current.volume = 0.3;
  }, []);

  useEffect(() => {
    activeModeRef.current = activeMode;
    focusTitleRef.current = focusTitle;
    onStartTimerRef.current = onStartTimer;
    isRunningRef.current = isRunning;
  }, [activeMode, focusTitle, onStartTimer, isRunning]);

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

  // Sync inputs with mode selection
  useEffect(() => {
    const t = formatTime(modeTime[uiMode]);
    setInputHours(t.hours);
    setInputMinutes(t.minutes);
    setInputSeconds(t.seconds);
  }, [uiMode]);

  const handleInputChange = (field: 'hours' | 'minutes' | 'seconds', value: string) => {
    // Allow empty string or numbers only
    if (!/^\d*$/.test(value)) return;
    
    // Limits
    const num = parseInt(value || '0', 10);
    if (field === 'hours' && num > 99) return;
    if ((field === 'minutes' || field === 'seconds') && num > 59) return;

    if (field === 'hours') setInputHours(value);
    if (field === 'minutes') setInputMinutes(value);
    if (field === 'seconds') setInputSeconds(value);
  };

  const handleInputBlur = (field: 'hours' | 'minutes' | 'seconds') => {
    let val = '';
    if (field === 'hours') val = inputHours;
    if (field === 'minutes') val = inputMinutes;
    if (field === 'seconds') val = inputSeconds;

    const num = parseInt(val || '0', 10);
    const padded = String(num).padStart(2, '0');

    if (field === 'hours') setInputHours(padded);
    if (field === 'minutes') setInputMinutes(padded);
    if (field === 'seconds') setInputSeconds(padded);
  };

  // Expose handlers to parent
  useEffect(() => {
    // These handlers should be available regardless of onStopTimer prop
    (window as any).__pomoStopHandler = () => {
      setIsRunning(false);
      const currentMode = activeModeRef.current;
      const resetTime = modeTime[currentMode];
      setTimeLeft(resetTime);
      setTotalTime(resetTime);
      if (onStartTimerRef.current) {
        // We use the last known title or default
        const title = focusTitleRef.current.trim() 
          ? focusTitleRef.current 
          : (currentMode === 'focus' ? 'Focusing' : 'Break');
        onStartTimerRef.current(false, title, resetTime, resetTime);
      }
    };
    (window as any).__pomoToggleHandler = () => {
      setIsRunning(prev => !prev);
    };
    (window as any).__pomoAdjustTimeHandler = (amount: number) => {
      setTimeLeft(prev => {
        const newValue = Math.max(0, prev + amount);
        // Update totalTime if we exceed it (extending the session)
        setTotalTime(currentTotal => Math.max(currentTotal, newValue));
        return newValue;
      });
    };

    return () => {
      // Cleanup
      delete (window as any).__pomoStopHandler;
      delete (window as any).__pomoToggleHandler;
      delete (window as any).__pomoAdjustTimeHandler;
    };
  }, []); // Run once on mount
  
  // Expose timeLeft to parent
  useEffect(() => {
    if (onStartTimer) {
      const effectiveTitle = focusTitle.trim() 
        ? focusTitle 
        : (activeMode === 'focus' ? 'Focusing' : 'Break');
      onStartTimer(isRunning, effectiveTitle, timeLeft, totalTime);
    }
  }, [timeLeft, isRunning, focusTitle, onStartTimer, totalTime, activeMode]);

  // Timer logic
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setIsRunning(false);
      // Determine title for completion
      const effectiveTitle = focusTitle.trim() 
        ? focusTitle 
        : (activeMode === 'focus' ? 'Focusing' : 'Break');
      if (onStartTimer) onStartTimer(false, effectiveTitle, 0, totalTime);
      if (onStopTimer) onStopTimer();
    }
    return () => clearInterval(interval);
  }, [isRunning, timeLeft, onStartTimer, onStopTimer, focusTitle, totalTime, activeMode]);

  const handleStart = () => {
    if (isRunning) {
      toast.error("Please stop the ongoing timer first.");
      return;
    }

    // Start new session
    const effectiveTitle = focusTitle.trim() 
      ? focusTitle 
      : (uiMode === 'focus' ? 'Focusing' : 'Break');

    // Calculate total seconds from manual inputs
    const h = parseInt(inputHours || '0', 10);
    const m = parseInt(inputMinutes || '0', 10);
    const s = parseInt(inputSeconds || '0', 10);
    const totalSeconds = h * 3600 + m * 60 + s;

    if (totalSeconds <= 0) {
      toast.error("Time must be greater than 0");
      return;
    }

    setActiveMode(uiMode);
    setTimeLeft(totalSeconds);
    setTotalTime(totalSeconds);
    setIsRunning(true);
    startSound.current.play().catch(e => console.error("Error playing start sound:", e));
    
    if (onStartTimer) {
      onStartTimer(true, effectiveTitle, totalSeconds, totalSeconds);
    }
  };

  // Display default time for UI mode, not active timeLeft
  const displayTime = formatTime(modeTime[uiMode]);

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
              onClick={() => setUiMode('focus')}
              className={`px-4 py-2 rounded-full text-sm transition ${
                uiMode === 'focus'
                  ? 'bg-white/20 text-white font-semibold'
                  : 'bg-transparent text-white/50 hover:text-white/80'
              }`}
            >
              Focus
            </button>
            <button
              onClick={() => setUiMode('short')}
              className={`px-4 py-2 rounded-full text-sm transition ${
                uiMode === 'short'
                  ? 'bg-white/20 text-white font-semibold'
                  : 'bg-transparent text-white/50 hover:text-white/80'
              }`}
            >
              Short Break
            </button>
            <button
              onClick={() => setUiMode('long')}
              className={`px-4 py-2 rounded-full text-sm transition ${
                uiMode === 'long'
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

          <div className="flex items-center justify-center mb-4">
            <div className="flex flex-col items-center">
              <input
                type="text"
                maxLength={2}
                autoComplete="off"
                value={inputHours}
                onChange={(e) => handleInputChange('hours', e.target.value)}
                onBlur={() => handleInputBlur('hours')}
                className="text-[3.5rem] font-extrabold leading-none tracking-tight text-white bg-transparent text-center w-[100px] focus:outline-none focus:bg-white/5 rounded-xl transition"
              />
              <span className="text-[0.65rem] font-semibold tracking-[0.1em] uppercase text-white/60 mt-1">HR</span>
            </div>
            <span className="text-4xl font-bold -mx-1 text-white/80 pb-5">:</span>
            <div className="flex flex-col items-center">
              <input
                type="text"
                maxLength={2}
                autoComplete="off"
                value={inputMinutes}
                onChange={(e) => handleInputChange('minutes', e.target.value)}
                onBlur={() => handleInputBlur('minutes')}
                className="text-[3.5rem] font-extrabold leading-none tracking-tight text-white bg-transparent text-center w-[100px] focus:outline-none focus:bg-white/5 rounded-xl transition"
              />
              <span className="text-[0.65rem] font-semibold tracking-[0.1em] uppercase text-white/60 mt-1">MIN</span>
            </div>
            <span className="text-4xl font-bold -mx-1 text-white/80 pb-5">:</span>
            <div className="flex flex-col items-center">
              <input
                type="text"
                maxLength={2}
                autoComplete="off"
                value={inputSeconds}
                onChange={(e) => handleInputChange('seconds', e.target.value)}
                onBlur={() => handleInputBlur('seconds')}
                className="text-[3.5rem] font-extrabold leading-none tracking-tight text-white bg-transparent text-center w-[100px] focus:outline-none focus:bg-white/5 rounded-xl transition"
              />
              <span className="text-[0.65rem] font-semibold tracking-[0.1em] uppercase text-white/60 mt-1">SEC</span>
            </div>
          </div>

          <div className="flex justify-center mb-6">
            <button 
              onClick={() => {
                setViewMode(prev => {
                  const next = prev === 'spotlight' ? 'minimalist' : 'spotlight';
                  if (onViewModeChange) onViewModeChange(next);
                  return next;
                });
              }}
              className="bg-white/10 border border-white/20 rounded-full px-4 py-1.5 hover:bg-white/20 transition-colors cursor-pointer"
            >
              <span className="text-white text-xs font-medium">
                Mode: {viewMode === 'spotlight' ? 'Spotlight' : 'Minimalist'}
              </span>
            </button>
          </div>
          
          <div className="flex gap-3">
            <button 
              onClick={handleStart}
              className="flex-1 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold py-4 rounded-2xl transition shadow-lg hover:shadow-xl"
            >
              Start Timer
            </button>
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

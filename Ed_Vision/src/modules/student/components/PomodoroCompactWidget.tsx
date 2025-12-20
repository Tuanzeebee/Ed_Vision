import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

type Props = {
  visible: boolean;
  focusTitle: string;
  timeLeft: number;
  totalTime: number;
  isRunning: boolean;
  onPause?: () => void;
  onStop?: () => void;
  onAddTime?: (amount: number) => void;
  dockTargetSelector?: string;
};

export default function PomodoroCompactWidget({
  visible,
  focusTitle,
  timeLeft,
  totalTime,
  isRunning,
  onPause,
  onStop,
  onAddTime,
  dockTargetSelector,
}: Props) {
  const [hoverStage, setHoverStage] = useState<0 | 1 | 2>(0);
  const stageTimerRef = useRef<number | null>(null);
  const stopSound = useRef(new Audio('/sounds/pomodoro/stop.mp3'));

  useEffect(() => {
    stopSound.current.volume = 0.3;
  }, []);

  const progress = useMemo(() => {
    if (!totalTime) return 0;
    const p = Math.round(((totalTime - timeLeft) / totalTime) * 100);
    return Math.max(0, Math.min(100, p));
  }, [timeLeft, totalTime]);

  const format = (s: number) => {
    const hrs = Math.floor(s / 3600);
    const mins = Math.floor((s % 3600) / 60);
    const secs = s % 60;
    return {
      hh: String(hrs).padStart(2, '0'),
      mm: String(mins).padStart(2, '0'),
      ss: String(secs).padStart(2, '0'),
    };
  };

  const t = format(timeLeft);

  useEffect(() => {
    return () => {
      if (stageTimerRef.current) {
        window.clearTimeout(stageTimerRef.current);
      }
    };
  }, []);

  if (!visible) return null;

  const widget = (
    <div
      className="fixed top-3 left-1/2 -translate-x-1/2 z-50"
      onMouseEnter={() => {
        setHoverStage(1);
        if (stageTimerRef.current) window.clearTimeout(stageTimerRef.current);
        stageTimerRef.current = window.setTimeout(() => {
          setHoverStage(2);
        }, 300);
      }}
      onMouseLeave={() => {
        if (stageTimerRef.current) window.clearTimeout(stageTimerRef.current);
        setHoverStage(0);
      }}
    >
      <div className="backdrop-blur-md bg-white/10 border border-white/20 rounded-2xl shadow-xl overflow-hidden transition-all duration-1000 ease-in-out">
        <div className={`px-3 py-2 ${hoverStage >= 2 ? 'w-[300px]' : 'w-[220px]'}`}>
          {hoverStage < 2 && (
            <>
              <div className="relative w-full h-1.5 bg-white/10 rounded-full overflow-hidden transition-opacity duration-1000 ease-in-out opacity-70">
                <div
                  className={`h-full bg-gradient-to-r from-orange-500 to-amber-500 transition-all`}
                  style={{ width: `${progress}%` }}
                />
                {hoverStage >= 1 && (
                  <span className="absolute right-1 top-1/2 -translate-y-1/2 text-[10px] leading-none text-white/70">
                    {progress}%
                  </span>
                )}
              </div>
              <div className="mt-2 flex items-center justify-between text-white">
                <span className="font-mono text-xs">
                  {t.hh !== '00' ? `${t.hh}:${t.mm}:${t.ss}` : `${t.mm}:${t.ss}`}
                </span>
              </div>
            </>
          )}
        </div>

        {hoverStage >= 2 && (
          <div className="px-3 pb-3">
            <div className="mt-1 flex items-center justify-between gap-3">
              <div className="flex flex-col">
                <div className="text-white/80 text-xs">{focusTitle || 'Focus'}</div>
                <div className="leading-none">
                  <span className="text-3xl font-bold text-white">
                    {t.hh !== '00' ? `${t.hh}:${t.mm}:${t.ss}` : `${t.mm}:${t.ss}`}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={onPause}
                  className="px-3 py-1.5 rounded-xl bg-white/10 border border-white/20 text-white hover:bg-white/20 transition"
                >
                  {isRunning ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 -960 960 960" className="svgIcon text-white">
                      <path d="M560-200v-560h160v560H560Zm-320 0v-560h160v560H240Z" fill="currentColor"></path>
                    </svg>
                  ) : (
                    '▶'
                  )}
                </button>
                <button
                  onClick={() => {
                    stopSound.current.play().catch(e => console.error("Error playing stop sound:", e));
                    onStop?.();
                  }}
                  className="px-3 py-1.5 rounded-xl bg-red-500/80 hover:bg-red-500 text-white transition shadow"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 -960 960 960" className="svgIcon text-white">
                    <path d="M240-240v-480h480v480H240Z" fill="currentColor"></path>
                  </svg>
                </button>
              </div>
            </div>
            <div className="mt-2 flex items-center">
              <div className="relative w-full h-1.5 bg-white/10 rounded-full overflow-hidden transition-opacity duration-1000 ease-in-out opacity-100">
                <div
                  className="h-full bg-gradient-to-r from-orange-500 to-amber-500 transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className="ml-2 text-xs text-white/70">{progress}%</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const target = dockTargetSelector ? (document.querySelector(dockTargetSelector) as Element | null) : null;
  return target ? createPortal(widget, target) : widget;
}

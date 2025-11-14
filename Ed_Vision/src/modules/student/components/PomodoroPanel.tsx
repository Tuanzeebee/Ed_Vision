import { useState } from 'react';
import type { PomoMode } from '../types/learningSpace';
import { useDraggable } from '../hooks/useDraggable';
import { useResizable } from '../hooks/useResizable';

type Props = {
  visible: boolean;
  onClose: () => void;
  initialX?: number;
  initialY?: number;
  initialWidth?: number;
  initialHeight?: number;
};

export default function PomodoroPanel({
  visible,
  onClose,
  initialX = (window.innerWidth - 800) / 2,
  initialY = (window.innerHeight - 600 - 80) / 2,
  initialWidth = 800,
  initialHeight = 600,
}: Props) {
  const { position, handleMouseDown } = useDraggable(initialX, initialY);
  const { size, handleMouseDown: handleResize } = useResizable(initialWidth, initialHeight, 360, 420);
  const [mode, setMode] = useState<PomoMode>('short');

  if (!visible) return null;

  return (
    <div
      className="fixed z-10"
      style={{ left: `${position.x}px`, top: `${position.y}px`, width: `${size.width}px` }}
    >
      <div
        className="backdrop-blur-[20px] bg-white/10 border border-white/20 rounded-3xl shadow-2xl relative"
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
              placeholder="click to add focus title"
              className="bg-transparent border-none text-white/70 text-sm text-center w-full focus:outline-none focus:text-white placeholder-white/50"
            />
          </div>

          <div className="flex items-center justify-center mb-6">
            <div className="flex flex-col items-center">
              <span className="text-[4rem] font-extrabold leading-none tracking-tight text-white">00</span>
              <span className="text-[0.65rem] font-semibold tracking-[0.1em] uppercase text-white/60 mt-1">HR</span>
            </div>
            <span className="text-5xl font-bold mx-2 text-white/80">:</span>
            <div className="flex flex-col items-center">
              <span className="text-[4rem] font-extrabold leading-none tracking-tight text-white">05</span>
              <span className="text-[0.65rem] font-semibold tracking-[0.1em] uppercase text-white/60 mt-1">MIN</span>
            </div>
            <span className="text-5xl font-bold mx-2 text-white/80">:</span>
            <div className="flex flex-col items-center">
              <span className="text-[4rem] font-extrabold leading-none tracking-tight text-white">00</span>
              <span className="text-[0.65rem] font-semibold tracking-[0.1em] uppercase text-white/60 mt-1">SEC</span>
            </div>
          </div>

          <div className="flex justify-center mb-6">
            <div className="bg-white/10 border border-white/20 rounded-full px-4 py-1.5">
              <span className="text-white text-xs font-medium">Mode: Spotlight</span>
            </div>
          </div>

          <button className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold py-4 rounded-2xl transition shadow-lg hover:shadow-xl">
            Start Timer
          </button>
        </div>

        <div
          className="absolute w-3 h-3 bg-white/30 border-2 border-white/60 rounded-full cursor-nwse-resize bottom-[-6px] right-[-6px] z-10 hover:bg-white/50"
          onMouseDown={handleResize}
        ></div>
      </div>
    </div>
  );
}

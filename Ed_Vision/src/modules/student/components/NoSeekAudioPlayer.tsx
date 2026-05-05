import { useEffect, useRef, useState } from "react";
import { Pause, Play, Volume2 } from "lucide-react";

/**
 * Audio player tailored for TOEIC exam contexts.
 *
 * Restrictions vs. native <audio controls>:
 *  - No seek bar / scrubbing — students cannot rewind or fast-forward.
 *  - No download / no native context menu.
 *  - Playback speed is the ONLY user-adjustable control.
 *
 * Reset behaviour:
 *  - When `src` changes the player re-mounts and starts at 0.
 */

const SPEEDS = [0.75, 1, 1.25, 1.5] as const;

type NoSeekAudioPlayerProps = {
  src: string;
  className?: string;
  /** Auto-load metadata to display total duration. Default true. */
  preload?: "none" | "metadata" | "auto";
};

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function NoSeekAudioPlayer({
  src,
  className,
  preload = "metadata",
}: NoSeekAudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [speed, setSpeed] = useState<number>(1);

  // Reset when src changes.
  useEffect(() => {
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    setSpeed(1);
  }, [src]);

  // Keep playbackRate in sync with state.
  useEffect(() => {
    if (audioRef.current) audioRef.current.playbackRate = speed;
  }, [speed]);

  // Block any external attempt to seek (e.g. media keys, extensions).
  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    const handleSeeking = () => {
      // Allow programmatic resets to 0 (when src changes), but disallow
      // any forward/backward seek beyond the natural playback position.
      if (Math.abs(el.currentTime - currentTime) > 0.5) {
        el.currentTime = currentTime;
      }
    };
    el.addEventListener("seeking", handleSeeking);
    return () => el.removeEventListener("seeking", handleSeeking);
  }, [currentTime]);

  const togglePlay = () => {
    const el = audioRef.current;
    if (!el) return;
    if (el.paused) {
      void el.play();
    } else {
      el.pause();
    }
  };

  return (
    <div
      className={`flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm ${className ?? ""}`}
    >
      {/* Hidden native audio element (no controls) */}
      <audio
        ref={audioRef}
        src={src}
        preload={preload}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => setIsPlaying(false)}
        onTimeUpdate={(e) =>
          setCurrentTime((e.target as HTMLAudioElement).currentTime)
        }
        onLoadedMetadata={(e) =>
          setDuration((e.target as HTMLAudioElement).duration || 0)
        }
        // Best-effort hint to browsers that support it (Chrome).
        controlsList="nodownload noplaybackrate noremoteplayback"
        onContextMenu={(e) => e.preventDefault()}
      />

      <button
        type="button"
        onClick={togglePlay}
        className="flex h-9 w-9 items-center justify-center rounded-full bg-teal-600 text-white shadow hover:bg-teal-700 active:scale-95 transition"
        aria-label={isPlaying ? "Tạm dừng" : "Phát"}
      >
        {isPlaying ? (
          <Pause className="h-4 w-4" />
        ) : (
          <Play className="h-4 w-4" />
        )}
      </button>

      <div className="flex items-center gap-2 flex-1 min-w-0">
        <Volume2 className="h-4 w-4 text-slate-400 shrink-0" />
        {/* Read-only progress display (no seek) */}
        <div className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
          <div
            className="absolute left-0 top-0 h-full bg-teal-500 transition-[width] duration-200"
            style={{
              width: duration > 0 ? `${(currentTime / duration) * 100}%` : "0%",
            }}
          />
        </div>
        <span className="text-xs font-mono tabular-nums text-slate-600 shrink-0">
          {formatTime(currentTime)} / {formatTime(duration)}
        </span>
      </div>

      <label className="flex items-center gap-1 text-xs font-semibold text-slate-600">
        <span className="hidden sm:inline">Tốc độ</span>
        <select
          value={speed}
          onChange={(e) => setSpeed(Number(e.target.value))}
          className="rounded-md border border-slate-200 bg-white px-1.5 py-1 text-xs font-semibold text-slate-700 outline-none focus:border-teal-500"
        >
          {SPEEDS.map((s) => (
            <option key={s} value={s}>
              {s}x
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}

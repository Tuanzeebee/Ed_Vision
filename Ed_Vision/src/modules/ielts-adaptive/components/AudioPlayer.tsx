import React, { useRef, useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, Volume2 } from 'lucide-react';

// Hardcoded fallback demo audio for development (English speech sample)
const DEMO_AUDIO_URL = 'https://ia800501.us.archive.org/8/items/testmp3testfile/mpthreetest.mp3';

interface AudioPlayerProps {
    url?: string | null;
    autoPlay?: boolean;
    label?: string;
}

const AudioPlayer: React.FC<AudioPlayerProps> = ({ url, autoPlay = true, label }) => {
    const audioRef = useRef<HTMLAudioElement>(null);
    const [playing, setPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);

    const src = url || DEMO_AUDIO_URL;

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        const onPlay = () => setPlaying(true);
        const onPause = () => setPlaying(false);
        const onEnded = () => setPlaying(false);
        const onTimeUpdate = () => setCurrentTime(audio.currentTime);
        const onLoadedMetadata = () => {
            setDuration(audio.duration);
            if (autoPlay) audio.play().catch(() => { });
        };

        audio.addEventListener('play', onPlay);
        audio.addEventListener('pause', onPause);
        audio.addEventListener('ended', onEnded);
        audio.addEventListener('timeupdate', onTimeUpdate);
        audio.addEventListener('loadedmetadata', onLoadedMetadata);

        // Reset state when src changes
        setCurrentTime(0);
        setDuration(0);
        setPlaying(false);

        return () => {
            audio.removeEventListener('play', onPlay);
            audio.removeEventListener('pause', onPause);
            audio.removeEventListener('ended', onEnded);
            audio.removeEventListener('timeupdate', onTimeUpdate);
            audio.removeEventListener('loadedmetadata', onLoadedMetadata);
            audio.pause();
        };
    }, [src, autoPlay]);

    const togglePlay = () => {
        const audio = audioRef.current;
        if (!audio) return;
        if (playing) audio.pause();
        else audio.play().catch(() => { });
    };

    const replay = () => {
        const audio = audioRef.current;
        if (!audio) return;
        audio.currentTime = 0;
        audio.play().catch(() => { });
    };

    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
        const audio = audioRef.current;
        if (!audio) return;
        audio.currentTime = Number(e.target.value);
    };

    const fmt = (s: number) => {
        if (!isFinite(s) || isNaN(s)) return '0:00';
        const m = Math.floor(s / 60);
        const sec = Math.floor(s % 60);
        return `${m}:${sec.toString().padStart(2, '0')}`;
    };

    return (
        <div className="bg-purple-50 border border-purple-200 rounded-2xl px-4 py-3 mb-2">
            <audio ref={audioRef} src={src} preload="metadata" />
            <div className="flex items-center gap-3">
                <Volume2 className="w-5 h-5 text-purple-500 shrink-0" />
                <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-purple-700 mb-2">
                        🎧 {label ?? 'Listening — nghe và trả lời câu hỏi'}
                    </p>
                    {/* Progress bar */}
                    <div className="flex items-center gap-2">
                        <span className="text-[11px] text-purple-500 font-mono w-8 shrink-0">{fmt(currentTime)}</span>
                        <input
                            type="range"
                            min={0}
                            max={duration || 100}
                            step={0.1}
                            value={currentTime}
                            onChange={handleSeek}
                            className="flex-1 h-1.5 accent-purple-500 cursor-pointer"
                        />
                        <span className="text-[11px] text-purple-400 font-mono w-8 shrink-0 text-right">{fmt(duration)}</span>
                    </div>
                    {/* Waveform animation while playing */}
                    {playing && (
                        <div className="flex items-end gap-0.5 mt-1.5 h-4">
                            {[1, 2, 3, 4, 5].map((i) => (
                                <div
                                    key={i}
                                    className="w-1 bg-purple-400 rounded-full animate-bounce"
                                    style={{ height: `${50 + Math.sin(i * 1.2) * 40}%`, animationDelay: `${i * 0.1}s` }}
                                />
                            ))}
                            <span className="text-[10px] text-purple-500 ml-1.5 self-center">Đang phát…</span>
                        </div>
                    )}
                </div>
                {/* Controls */}
                <div className="flex items-center gap-1.5 shrink-0">
                    <button
                        onClick={replay}
                        title="Nghe lại từ đầu"
                        className="w-8 h-8 rounded-full bg-purple-100 hover:bg-purple-200 flex items-center justify-center text-purple-600 transition-colors"
                    >
                        <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                    <button
                        onClick={togglePlay}
                        className="w-9 h-9 rounded-full bg-purple-500 hover:bg-purple-600 flex items-center justify-center text-white transition-colors"
                    >
                        {playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AudioPlayer;

import { useEffect, useState } from 'react';
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

type QuizLeaderboardEntry = {
  id: string;
  playerName: string;
  scorePercent: number;
  scorePoints: number;
  correctAnswers: number;
  totalQuestions: number;
  completionSeconds: number;
  completedAt: number;
};

const QUIZ_LEADERBOARD_STORAGE_KEY = 'edvision-quiz-leaderboard';

const normalizeLookupValue = (value: unknown) =>
  typeof value === 'string' ? value.trim().toLowerCase() : '';

const readCurrentUserIdentifiers = (): Set<string> => {
  try {
    const rawValue = localStorage.getItem('user');
    if (!rawValue) return new Set();

    const parsed = JSON.parse(rawValue) as Record<string, unknown>;
    const candidates = [
      parsed.id,
      parsed._id,
      parsed.fullName,
      parsed.name,
      parsed.username,
      parsed.studentCode,
      parsed.email,
    ]
      .map((value) => normalizeLookupValue(value))
      .filter(Boolean);

    return new Set(candidates);
  } catch {
    return new Set();
  }
};

const readQuizLeaderboard = (): QuizLeaderboardEntry[] => {
  try {
    const rawValue = localStorage.getItem(QUIZ_LEADERBOARD_STORAGE_KEY);
    if (!rawValue) return [];

    const parsed = JSON.parse(rawValue) as QuizLeaderboardEntry[];
    if (!Array.isArray(parsed)) return [];

    return parsed
      .filter(
        (entry) =>
          typeof entry.id === 'string' &&
          typeof entry.playerName === 'string' &&
          Number.isFinite(entry.scorePercent) &&
          Number.isFinite(entry.scorePoints) &&
          Number.isFinite(entry.correctAnswers) &&
          Number.isFinite(entry.totalQuestions) &&
          Number.isFinite(entry.completionSeconds) &&
          Number.isFinite(entry.completedAt)
      )
      .sort((a, b) => {
        if (b.scorePercent !== a.scorePercent) return b.scorePercent - a.scorePercent;
        if (b.scorePoints !== a.scorePoints) return b.scorePoints - a.scorePoints;
        if (a.completionSeconds !== b.completionSeconds) return a.completionSeconds - b.completionSeconds;
        return b.completedAt - a.completedAt;
      });
  } catch {
    return [];
  }
};

const formatDuration = (seconds: number) => {
  const safeSeconds = Math.max(0, Math.round(seconds));
  const minutes = Math.floor(safeSeconds / 60);
  const remainSeconds = safeSeconds % 60;
  return `${minutes}:${remainSeconds.toString().padStart(2, '0')}`;
};

const formatCompletedAt = (timestamp: number) => {
  return new Date(timestamp).toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export default function QuizLeaderboardPanel({
  visible,
  onClose,
  initialX = (window.innerWidth - 980) / 2,
  initialY = (window.innerHeight - 640 - 80) / 2,
  initialWidth = 980,
  initialHeight = 640,
}: Props) {
  const { position, handleMouseDown } = useDraggable(initialX, initialY);
  const { size, handleMouseDown: handleResize } = useResizable(initialWidth, initialHeight, 760, 520);
  const [leaderboardEntries, setLeaderboardEntries] = useState<QuizLeaderboardEntry[]>(() =>
    readQuizLeaderboard()
  );
  const [currentUserIdentifiers, setCurrentUserIdentifiers] = useState<Set<string>>(() =>
    readCurrentUserIdentifiers()
  );

  const refreshLeaderboard = () => {
    setLeaderboardEntries(readQuizLeaderboard());
    setCurrentUserIdentifiers(readCurrentUserIdentifiers());
  };

  useEffect(() => {
    if (visible) {
      refreshLeaderboard();
    }
  }, [visible]);

  if (!visible) {
    return null;
  }

  return (
    <div
      className="fixed z-10 select-none"
      style={{
        left: position.x,
        top: position.y,
        width: size.width,
        height: size.height,
      }}
    >
      <div className="relative flex h-full w-full flex-col overflow-hidden rounded-3xl border border-[#ecd8b0]/25 bg-gradient-to-b from-[#4f3424]/95 to-[#2f1e14]/95 shadow-[0_20px_60px_rgba(0,0,0,0.55)]">
        <div
          onMouseDown={handleMouseDown}
          className="flex cursor-move items-start justify-between border-b border-[#f2dfb3]/15 bg-[#271910]/65 px-6 py-4"
        >
          <div>
            <h2 className="text-lg font-semibold text-[#faefcf]">Quiz Leaderboard</h2>
            <p className="text-xs text-[#f1ddb2]/75">Xep hang theo diem va thoi gian hoan thanh nhanh nhat.</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={refreshLeaderboard}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-[#f2deaf]/25 bg-[#2a1a11]/75 text-[#f6e5c3] transition hover:bg-[#3a2517]"
              title="Lam moi"
            >
              <i className="fas fa-rotate-right"></i>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-[#f2deaf]/25 bg-[#2a1a11]/75 text-[#f6e5c3] transition hover:bg-[#3a2517]"
              title="Dong"
            >
              <i className="fas fa-times"></i>
            </button>
          </div>
        </div>

        <div className="flex-1 p-5">
          {leaderboardEntries.length === 0 ? (
            <div className="flex h-full items-center justify-center rounded-2xl border border-[#ecd7af]/20 bg-[#2a1a11]/50 px-4 text-center text-sm text-[#f1ddb2]/80">
              Chua co du lieu quiz. Hoan thanh mot bai kiem tra de xuat hien tren bang xep hang.
            </div>
          ) : (
            <div className="h-full overflow-y-auto rounded-2xl border border-[#ecd7af]/20 bg-[#1f130d]/60 backdrop-blur-[2px] [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <div className="sticky top-0 z-30 border-b border-[#f2dfb1]/20 bg-[#20130c]/95 px-4 py-3 shadow-[0_2px_10px_rgba(0,0,0,0.35)]">
                <div className="flex items-center gap-3 text-[11px] uppercase tracking-[0.16em] text-[#f6e7c8]/80">
                  <div className="w-14 shrink-0">Hang</div>
                  <div className="min-w-[160px] flex-1">Nguoi hoc</div>
                  <div className="w-32 shrink-0">Diem</div>
                  <div className="w-20 shrink-0">Dung</div>
                  <div className="w-24 shrink-0">Thoi gian</div>
                  <div className="w-28 shrink-0">Nop luc</div>
                </div>
              </div>

              <div className="relative">
                {leaderboardEntries.slice(0, 50).map((entry, index) => {
                  const normalizedPlayerName = normalizeLookupValue(entry.playerName);
                  const normalizedPlayerId = normalizeLookupValue(entry.id);
                  const isCurrentUser =
                    currentUserIdentifiers.has(normalizedPlayerName) ||
                    currentUserIdentifiers.has(normalizedPlayerId);

                  return (
                    <div
                      key={entry.id}
                      className={`flex items-center gap-3 px-4 py-3.5 border-b border-[#f2dfb1]/12 transition ${
                        isCurrentUser
                          ? 'bg-amber-300/12 shadow-[inset_0_0_0_1px_rgba(252,211,77,0.55)]'
                          : 'bg-white/[0.01] hover:bg-white/[0.03]'
                      }`}
                    >
                      <div className="w-14 shrink-0 font-semibold text-amber-200 whitespace-nowrap">
                        {index === 0 && <i className="fas fa-crown mr-1 text-amber-300"></i>}#{index + 1}
                      </div>

                      <div className="min-w-[160px] flex-1">
                        <div className="truncate text-[14px] font-semibold text-[#f7ead0]" title={entry.playerName}>
                          {entry.playerName}
                        </div>
                        {isCurrentUser && <div className="mt-0.5 text-[11px] text-amber-200/95">Ban</div>}
                      </div>

                      <div className="w-32 shrink-0 whitespace-nowrap text-[13px] font-medium text-[#f7ead0]">
                        {entry.scorePoints}/100 ({entry.scorePercent}%)
                      </div>

                      <div className="w-20 shrink-0 whitespace-nowrap text-[13px] text-[#f4e6c8]">
                        {entry.correctAnswers}/{entry.totalQuestions}
                      </div>

                      <div className="w-24 shrink-0 whitespace-nowrap text-[13px] text-[#f4e6c8]">
                        {formatDuration(entry.completionSeconds)}
                      </div>

                      <div className="w-28 shrink-0 whitespace-nowrap text-[13px] text-[#f1ddb2]/85">
                        {formatCompletedAt(entry.completedAt)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div
          onMouseDown={handleResize}
          className="absolute bottom-0 right-0 h-4 w-4 cursor-se-resize"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="opacity-50">
            <path d="M11 15L15 11M7 15L15 7M3 15L15 3" stroke="currentColor" strokeWidth="1.5" className="text-[#f6e5c3]" />
          </svg>
        </div>
      </div>
    </div>
  );
}

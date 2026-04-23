import { Flame, Trophy, Clock3, RotateCcw } from 'lucide-react';
import type { MyStudyStats } from '@/services/student/studyRoomService';

type Props = {
  stats: MyStudyStats | null;
  loading: boolean;
  error: string | null;
  onRetry?: () => void;
};

const STREAK_MILESTONES = [3, 7, 14, 30, 60, 100];

function formatDateTime(value: string | null): string {
  if (!value) {
    return 'Chưa có dữ liệu';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 'Chưa có dữ liệu';
  }

  return date.toLocaleString('vi-VN');
}

function formatNumber(value: number): string {
  return value.toLocaleString('vi-VN');
}

function getMotivationMessage(currentStreak: number, longestStreak: number): string {
  if (currentStreak <= 0) {
    return 'Bắt đầu buổi học đầu tiên hôm nay để mở chuỗi mới.';
  }

  if (currentStreak >= 30) {
    return 'Bạn đang giữ phong độ cực đỉnh. Tiếp tục để phá kỷ lục mới.';
  }

  if (currentStreak >= 14) {
    return 'Chuỗi đang rất ổn định. Bạn đang đi đúng nhịp học tập của mình.';
  }

  if (currentStreak >= 7) {
    return 'Một tuần liên tiếp rồi. Giữ lửa thêm chút nữa để lên mốc cao hơn.';
  }

  if (currentStreak >= longestStreak) {
    return 'Bạn vừa chạm mốc tốt nhất cá nhân. Duy trì để vượt luôn hôm nay.';
  }

  return 'Khởi đầu rất tốt. Cứ đều đặn mỗi ngày, chuỗi sẽ tăng rất nhanh.';
}

function getNextMilestone(currentStreak: number): number | null {
  return STREAK_MILESTONES.find((milestone) => milestone > currentStreak) ?? null;
}

function getRankLabel(rank: number | null): string {
  if (rank === null) {
    return 'Chưa xếp hạng';
  }

  return `#${rank}`;
}

export default function StudyStreakCard({
  stats,
  loading,
  error,
  onRetry,
}: Props) {
  const currentStreak = stats?.streak.current ?? 0;
  const longestStreak = stats?.streak.longest ?? 0;
  const totalMinutes = stats?.totals.totalMinutes ?? 0;
  const totalSessions = stats?.totals.totalSessions ?? 0;
  const rank = stats?.leaderboard.rank ?? null;
  const nextMilestone = getNextMilestone(currentStreak);
  const remainingDays = nextMilestone ? Math.max(nextMilestone - currentStreak, 0) : 0;
  const milestoneProgress = nextMilestone
    ? Math.min((currentStreak / nextMilestone) * 100, 100)
    : 100;

  return (
    <section className="rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 p-4 shadow-sm">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-amber-900">Hành trình chuỗi học</h3>
          <p className="text-xs text-amber-700">
            {getMotivationMessage(currentStreak, longestStreak)}
          </p>
        </div>
        <Flame className="h-5 w-5 text-amber-600" />
      </div>

      {stats && (
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-amber-300 bg-white/80 px-3 py-1 text-xs font-semibold text-amber-800">
          <Flame className="h-3.5 w-3.5" />
          {currentStreak > 0
            ? `${formatNumber(currentStreak)} ngày liên tiếp`
            : 'Sẵn sàng mở chuỗi mới'}
        </div>
      )}

      {loading && (
        <div className="rounded-xl border border-amber-200 bg-white/70 p-3 text-sm text-amber-800">
          Đang cập nhật bảng thành tích...
        </div>
      )}

      {!loading && error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3">
          <p className="text-sm font-medium text-red-700">{error}</p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="mt-2 inline-flex items-center gap-1 rounded-lg border border-red-300 px-3 py-1 text-xs font-medium text-red-700 hover:bg-red-100"
              type="button"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Thử lại
            </button>
          )}
        </div>
      )}

      {!loading && !error && stats && (
        <>
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-xl border border-amber-200 bg-white/70 p-3">
              <div className="flex items-center gap-2 text-xs text-amber-700">
                <Flame className="h-3.5 w-3.5" />
                Chuỗi hôm nay
              </div>
              <p className="mt-1 text-lg font-bold text-amber-900">{formatNumber(currentStreak)}</p>
            </div>
            <div className="rounded-xl border border-amber-200 bg-white/70 p-3">
              <div className="flex items-center gap-2 text-xs text-amber-700">
                <Trophy className="h-3.5 w-3.5" />
                Kỷ lục cá nhân
              </div>
              <p className="mt-1 text-lg font-bold text-amber-900">{formatNumber(longestStreak)}</p>
            </div>
            <div className="rounded-xl border border-amber-200 bg-white/70 p-3">
              <div className="flex items-center gap-2 text-xs text-amber-700">
                <Clock3 className="h-3.5 w-3.5" />
                Phút tập trung
              </div>
              <p className="mt-1 text-lg font-bold text-amber-900">{formatNumber(totalMinutes)}</p>
            </div>
            <div className="rounded-xl border border-amber-200 bg-white/70 p-3">
              <div className="flex items-center gap-2 text-xs text-amber-700">
                <Trophy className="h-3.5 w-3.5" />
                Vị trí BXH
              </div>
              <p className="mt-1 text-lg font-bold text-amber-900">{getRankLabel(rank)}</p>
            </div>
          </div>

          <div className="mt-3 rounded-xl border border-amber-200 bg-white/80 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">
              Mốc tiếp theo
            </p>

            {nextMilestone ? (
              <>
                <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-amber-100">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all"
                    style={{ width: `${milestoneProgress}%` }}
                  />
                </div>
                <p className="mt-2 text-xs text-amber-800">
                  Còn <span className="font-semibold">{formatNumber(remainingDays)} ngày</span> để chạm mốc{' '}
                  <span className="font-semibold">{formatNumber(nextMilestone)} ngày</span>.
                </p>
              </>
            ) : (
              <p className="mt-2 text-xs text-amber-800">
                Bạn đã vượt mọi mốc cơ bản. Giữ nhịp này để lập kỷ lục mới.
              </p>
            )}
          </div>

          <div className="mt-3 rounded-xl border border-amber-200 bg-white/70 p-3 text-xs text-amber-800">
            <p>
              Lần ghi nhận gần nhất:{' '}
              <span className="font-medium">{formatDateTime(stats.totals.updatedAt)}</span>
            </p>
            <p className="mt-1">
              Buổi học gần đây:{' '}
              <span className="font-medium">{formatDateTime(stats.streak.lastStudyDate)}</span>
            </p>
            <p className="mt-1">
              Tổng phiên đã hoàn thành:{' '}
              <span className="font-medium">{formatNumber(totalSessions)}</span>
            </p>
          </div>
        </>
      )}

      {!loading && !error && !stats && (
        <div className="rounded-xl border border-amber-200 bg-white/70 p-3 text-sm text-amber-800">
          Chưa có dữ liệu chuỗi. Hãy bắt đầu một phiên học để mở thành tích đầu tiên.
        </div>
      )}
    </section>
  );
}

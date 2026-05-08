import { useState, useEffect } from "react";
import { HelpCircle, Trophy, Crown, Flame } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { getWeeklyLeaderboard, getTotalLeaderboard, getPersonalStats, type LeaderboardEntry, type LeaderboardResponse, type PersonalStatsResponse } from "@/services/api/leaderboardService";
import { getAvatarUrl } from "@/lib/avatarUtils";
import cacheService from "@/services/cacheService";

const LEADERBOARD_TTL = 30 * 1000; // 30s
const PERSONAL_STATS_TTL = 30 * 1000;

type DisplayEntry = {
  id: string;
  name: string;
  avatar: string;
  score: number;
  streak: number;
  isCurrentUser?: boolean;
  isOnline: boolean;
};

/** Danh hiệu theo điểm TOEIC tích lũy từ practice (dải 0–200, tỷ lệ 70%/30%) */
function getRankBadge(score: number): { label: string; emoji: string; color: string; border: string; bg: string } {
  if (score >= 140) return { label: "Cao cấp", emoji: "👑", color: "text-amber-700", border: "border-amber-400/40", bg: "bg-amber-500/15" };
  if (score >= 60) return { label: "Trung cấp", emoji: "🔥", color: "text-orange-700", border: "border-orange-400/30", bg: "bg-orange-500/15" };
  return { label: "Sơ cấp", emoji: "🌱", color: "text-emerald-700", border: "border-emerald-400/30", bg: "bg-emerald-500/15" };
}

export default function StudentLeaderboard() {
  const [tab, setTab] = useState<"week" | "total">("week");
  const navigate = useNavigate();
  const { user } = useAuth();

  const [data, setData] = useState<DisplayEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [personalStats, setPersonalStats] = useState<{
    weeklyExp: number;
    weeklyRank: number | null;
    totalScore: number;
    totalRank: number | null;
  }>({
    weeklyExp: 0,
    weeklyRank: null,
    totalScore: 0,
    totalRank: null,
  });

  // Current user info from auth
  const currentUserName = user?.fullName || user?.full_name || user?.name || "Bạn";
  const currentUserAvatar = user?.avatarUrl || user?.avatar_url || user?.avatar || "";

  const rankBadge = getRankBadge(personalStats.totalScore);

  // Fetch personal stats from leaderboard endpoint (có cache + cancel flag)
  useEffect(() => {
    let cancelled = false;
    const fetchPersonalStats = async () => {
      try {
        const stats = await cacheService.getOrFetch<PersonalStatsResponse>(
          `leaderboard:personal-stats:${user?.id ?? "anon"}`,
          () => getPersonalStats(),
          PERSONAL_STATS_TTL,
        );
        if (cancelled) return;
        setPersonalStats({
          weeklyExp: stats.rankings.weeklyExp ?? 0,
          weeklyRank: stats.rankings.weeklyRank,
          totalScore: stats.totals.totalExp ?? 0,
          totalRank: stats.rankings.totalRank,
        });
      } catch (err) {
        // Silently fail — stats card will show zeros
      }
    };

    fetchPersonalStats();
    return () => { cancelled = true; };
  }, [user?.id]);

  // Fetch leaderboard data based on tab (có cache + cancel flag để tránh race condition)
  useEffect(() => {
    let cancelled = false;
    const fetchLeaderboard = async () => {
      setLoading(true);
      try {
        const fetchFn = tab === "week" ? getWeeklyLeaderboard : getTotalLeaderboard;
        const response = await cacheService.getOrFetch<LeaderboardResponse>(
          `leaderboard:${tab}:10:0`,
          () => fetchFn(10, 0),
          LEADERBOARD_TTL,
        );
        if (cancelled) return;

        const displayData: DisplayEntry[] = response.entries.map((entry) => ({
          id: `user-${entry.accountId}`,
          name: entry.username,
          avatar: getAvatarUrl(entry.avatarUrl, entry.gender),
          score: entry.score,
          streak: entry.currentStreak || 0,
          isCurrentUser: entry.accountId === user?.id,
          isOnline: entry.isOnline,
        }));

        setData(displayData);
      } catch {
        // Silently fail — show empty state
        if (!cancelled) setData([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchLeaderboard();
    return () => { cancelled = true; };
  }, [tab, user?.id]);

  return (
    <div className="flex flex-col gap-4">
      {/* Current User Profile Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div
          className="p-4 flex items-center gap-3 relative overflow-hidden"
          style={{
            background: "linear-gradient(135deg, #6b4f3a 0%, #8b6f5e 60%, #7a5c4a 100%)",
          }}
        >
          {/* Shimmer overlay */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: "linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.15) 50%, transparent 70%)",
            }}
          />
          <div
            className="absolute top-0 right-0 w-40 h-20 pointer-events-none"
            style={{
              background: "radial-gradient(ellipse at top right, rgba(255,255,255,0.2) 0%, transparent 70%)",
            }}
          />
          <div className="relative w-14 h-14 rounded-full bg-white/20 p-0.5 shrink-0 border border-white/30 flex items-center justify-center overflow-hidden">
            {currentUserAvatar ? (
              <img src={currentUserAvatar} alt="Avatar" className="w-full h-full rounded-full object-cover" />
            ) : (
              <span className="text-xl font-bold text-white uppercase">{currentUserName.charAt(0)}</span>
            )}
          </div>
          <div className="relative">
            <h3 className="text-lg font-bold text-white drop-shadow">{currentUserName}</h3>
            <div className={`${rankBadge.bg} w-max px-1.5 py-0.5 rounded text-[10px] text-white border ${rankBadge.border}`}>
              {rankBadge.emoji} {rankBadge.label}
            </div>
          </div>
        </div>
        <div className="p-4 bg-slate-50 grid grid-cols-2 gap-3">
          <div className="bg-slate-100/80 rounded-xl p-3 text-center">
            <p className="text-xs text-slate-500">Điểm tuần này</p>
            <p className="text-2xl font-black text-slate-700">{personalStats.weeklyExp}</p>
          </div>
          <div className="bg-slate-100/80 rounded-xl p-3 text-center">
            <p className="text-xs text-slate-500">Hạng tuần này</p>
            <p className="text-2xl font-black text-slate-700">
              {personalStats.weeklyRank ? personalStats.weeklyRank : "Chưa xếp hạng"}
            </p>
          </div>
          <div className="bg-slate-100/80 rounded-xl p-3 text-center">
            <p className="text-xs text-slate-500">Tổng điểm tích lũy</p>
            <p className="text-2xl font-black text-green-500">{personalStats.totalScore.toFixed(1)}</p>
          </div>
          <div className="bg-slate-100/80 rounded-xl p-3 text-center">
            <p className="text-xs text-slate-500">Hạng tổng</p>
            <p className="text-2xl font-black text-sky-500">
              {personalStats.totalRank ? personalStats.totalRank : "Chưa xếp hạng"}
            </p>
          </div>
        </div>
      </div>

      {/* Leaderboard List */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-0 overflow-hidden relative">
        <div className="pt-5 pb-3 px-6 flex items-center gap-2">
          <Trophy className="w-6 h-6 text-amber-500 fill-amber-400" />
          <h3 className="text-lg font-bold text-slate-800">Bảng xếp hạng</h3>
          <HelpCircle className="w-4 h-4 text-slate-300" />
        </div>

        <div className="flex border-b border-slate-100">
          <button
            className={`flex-1 py-3 text-sm font-medium transition-colors border-b-2 cursor-pointer ${tab === "week" ? "border-sky-500 text-sky-600" : "border-transparent text-slate-500 hover:text-slate-700"}`}
            onClick={() => setTab("week")}
          >
            Xếp hạng tuần
          </button>
          <button
            className={`flex-1 py-3 text-sm font-medium transition-colors border-b-2 cursor-pointer ${tab === "total" ? "border-sky-500 text-sky-600" : "border-transparent text-slate-500 hover:text-slate-700"}`}
            onClick={() => setTab("total")}
          >
            Tổng xếp hạng
          </button>
        </div>

        <div className="px-4 py-2 flex flex-col gap-1 max-h-[500px] overflow-y-auto overflow-x-hidden relative">
          <div className="absolute left-8 top-4 bottom-4 w-px bg-slate-100 z-0"></div>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-4 border-slate-200 border-t-sky-500 rounded-full animate-spin"></div>
            </div>
          ) : data.length > 0 ? (
            data.map((user, idx) => {
              const rank = idx + 1;
              return (
                <div key={user.id} className={`relative z-10 flex items-center justify-between p-3 mb-2 rounded-2xl border transition-all ${user.isCurrentUser ? "bg-amber-50 border-amber-200 shadow-sm" : "bg-white border-slate-100 hover:border-sky-200 shadow-sm"}`}>
                  <div className="flex items-center gap-4">
                    <div className={`w-8 flex items-center justify-center shrink-0`}>
                      {rank === 1 && <Crown className="w-6 h-6 text-amber-500 fill-amber-400" />}
                      {rank === 2 && <Crown className="w-6 h-6 text-slate-400 fill-slate-300" />}
                      {rank === 3 && <Crown className="w-6 h-6 text-orange-600 fill-orange-500" />}
                      {rank > 3 && <span className="text-lg font-bold text-slate-500">{rank}</span>}
                    </div>
                    <div className="relative shrink-0">
                      {user.avatar ? (
                        <img src={user.avatar} alt={user.name} className="w-11 h-11 rounded-full object-cover" />
                      ) : (
                        <div className="w-11 h-11 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-lg uppercase">
                          {user.name.charAt(0)}
                        </div>
                      )}
                      {user.isOnline && (
                        <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-400 border-2 border-white rounded-full"></div>
                      )}
                    </div>
                    <div>
                      <p className="text-[15px] font-bold text-slate-800 leading-tight mb-1">{user.name}</p>
                      <div className="flex items-center gap-1 text-sky-500 font-semibold text-xs">
                        <Trophy className="w-3.5 h-3.5" />
                        <span>{user.score.toLocaleString()} điểm</span>
                      </div>
                    </div>
                  </div>
                  <div className="shrink-0 flex items-center gap-1.5 bg-orange-50 px-3 py-1.5 rounded-full text-orange-500 font-bold text-[13px]">
                    <Flame className={`w-4 h-4 ${user.streak > 0 ? "fill-orange-500" : "fill-none text-orange-300"}`} />
                    <span className={user.streak > 0 ? "" : "text-orange-400"}>{user.streak}</span>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-slate-400">
              <HelpCircle className="w-8 h-8 mb-2" />
              <p className="text-sm">Chưa có dữ liệu</p>
            </div>
          )}
        </div>

        <div className="p-3 border-t border-slate-50 text-center">
          <button
            onClick={() => navigate("/student/leaderboard")}
            className="text-xs font-semibold text-sky-600 hover:text-sky-700 hover:underline cursor-pointer transition-all"
          >
            Xem tất cả bảng xếp hạng &rarr;
          </button>
        </div>
      </div>
    </div>
  );
}

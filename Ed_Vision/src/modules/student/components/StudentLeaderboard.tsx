import { useState, useEffect } from "react";
import { HelpCircle, Trophy, Crown, Flame } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { getWeeklyLeaderboard, getTotalLeaderboard, getPersonalStats, type LeaderboardEntry, type LeaderboardResponse, type PersonalStatsResponse } from "@/services/api/leaderboardService";
import { getAvatarUrl } from "@/lib/avatarUtils";
import cacheService from "@/services/cacheService";

const LEADERBOARD_TTL = 30 * 1000; // 30s
const PERSONAL_STATS_TTL = 30 * 1000;
// Cache chung cho cả trang full leaderboard (limit=100). Card nhỏ slice 10 dòng đầu.
const LEADERBOARD_CACHE_KEY = (tab: "week" | "total") => `leaderboard:${tab}:100:0`;
const DISPLAY_LIMIT = 10;

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

  // Fetch leaderboard data based on tab — dùng stale-while-revalidate +
  // cache chung (limit=100) với trang full để chuyển trang gần như tức thì.
  useEffect(() => {
    let cancelled = false;

    const mapEntries = (entries: LeaderboardEntry[]): DisplayEntry[] =>
      entries.slice(0, DISPLAY_LIMIT).map((entry) => ({
        id: `user-${entry.accountId}`,
        name: entry.username,
        avatar: getAvatarUrl(entry.avatarUrl, entry.gender),
        score: entry.score,
        streak: entry.currentStreak || 0,
        isCurrentUser: entry.accountId === user?.id,
        isOnline: entry.isOnline,
      }));

    // 1. Hiển thị dữ liệu stale (nếu có) ngay lập tức để tránh spinner nhấp nháy.
    const cached = cacheService.peek<LeaderboardResponse>(LEADERBOARD_CACHE_KEY(tab));
    if (cached) {
      setData(mapEntries(cached.entries));
      setLoading(false);
    } else {
      setLoading(true);
    }

    // 2. Nếu cache còn tươi thì thôi, không fetch lại.
    if (cacheService.isFresh(LEADERBOARD_CACHE_KEY(tab))) {
      return () => { cancelled = true; };
    }

    // 3. Fetch nền.
    const fetchLeaderboard = async () => {
      try {
        const fetchFn = tab === "week" ? getWeeklyLeaderboard : getTotalLeaderboard;
        const response = await cacheService.getOrFetch<LeaderboardResponse>(
          LEADERBOARD_CACHE_KEY(tab),
          () => fetchFn(100, 0),
          LEADERBOARD_TTL,
        );
        if (cancelled) return;
        setData(mapEntries(response.entries));
      } catch {
        if (!cancelled && !cached) setData([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchLeaderboard();
    return () => { cancelled = true; };
  }, [tab, user?.id]);

  // Prefetch tab còn lại để khi user đổi tab là có ngay.
  useEffect(() => {
    const otherTab = tab === "week" ? "total" : "week";
    if (cacheService.isFresh(LEADERBOARD_CACHE_KEY(otherTab))) return;
    const fetchFn = otherTab === "week" ? getWeeklyLeaderboard : getTotalLeaderboard;
    cacheService
      .getOrFetch<LeaderboardResponse>(
        LEADERBOARD_CACHE_KEY(otherTab),
        () => fetchFn(100, 0),
        LEADERBOARD_TTL,
      )
      .catch(() => {
        // silent — prefetch không ảnh hưởng UI
      });
  }, [tab]);

  return (
    <div className="flex flex-col gap-4">
      {/* Current User Profile Card */}
      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
        <div
          className="p-4 flex items-center gap-3 relative overflow-hidden"
          style={{
            background: "#E5E5E5",
          }}
        >
          <div className="relative w-12 h-12 rounded-full bg-slate-200 p-0.5 shrink-0 border border-slate-300 flex items-center justify-center overflow-hidden">
            {currentUserAvatar ? (
              <img src={currentUserAvatar} alt="Avatar" className="w-full h-full rounded-full object-cover" />
            ) : (
              <span className="text-xl font-bold text-slate-700 uppercase">{currentUserName.charAt(0)}</span>
            )}
          </div>
          <div className="relative">
            <h3 className="text-base font-bold text-slate-800">{currentUserName}</h3>
            <div className={`${rankBadge.bg} ${rankBadge.color} w-max px-2 py-0.5 rounded-full text-[10px] font-medium border ${rankBadge.border}`}>
              {rankBadge.emoji} {rankBadge.label}
            </div>
          </div>
        </div>
        <div className="p-4 bg-slate-50 grid grid-cols-2 gap-2">
          <div className="bg-white rounded-xl border border-slate-100 p-3 text-center">
            <p className="text-[10px] text-slate-500">Điểm tuần này</p>
            <p className="text-lg font-black text-slate-700">{personalStats.weeklyExp}</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-100 p-3 text-center">
            <p className="text-[10px] text-slate-500">Hạng tuần này</p>
            <p className="text-lg font-black text-slate-700">
              {personalStats.weeklyRank ? personalStats.weeklyRank : "Chưa xếp hạng"}
            </p>
          </div>
          <div className="bg-white rounded-xl border border-slate-100 p-3 text-center">
            <p className="text-[10px] text-slate-500">Tổng điểm tích lũy</p>
            <p className="text-lg font-black text-emerald-600">{personalStats.totalScore.toFixed(1)}</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-100 p-3 text-center">
            <p className="text-[10px] text-slate-500">Hạng tổng</p>
            <p className="text-lg font-black text-sky-600">
              {personalStats.totalRank ? personalStats.totalRank : "Chưa xếp hạng"}
            </p>
          </div>
        </div>
      </div>

      {/* Leaderboard List */}
      <div className="bg-white rounded-2xl border border-slate-100 p-0 overflow-hidden relative shadow-sm">
        <div className="pt-4 pb-2 px-5 flex items-center gap-2">
          <Trophy className="w-6 h-6 text-amber-500 fill-amber-400" />
          <h3 className="text-base font-bold text-slate-800">Bảng xếp hạng</h3>
          <HelpCircle className="w-4 h-4 text-slate-300" />
        </div>

        <div className="flex border-b border-slate-100">
          <button
            className={`flex-1 py-2.5 text-[13px] font-semibold transition-colors border-b-2 cursor-pointer ${tab === "week" ? "border-sky-500 text-sky-600" : "border-transparent text-slate-500 hover:text-slate-700"}`}
            onClick={() => setTab("week")}
          >
            Xếp hạng tuần
          </button>
          <button
            className={`flex-1 py-2.5 text-[13px] font-semibold transition-colors border-b-2 cursor-pointer ${tab === "total" ? "border-sky-500 text-sky-600" : "border-transparent text-slate-500 hover:text-slate-700"}`}
            onClick={() => setTab("total")}
          >
            Tổng xếp hạng
          </button>
        </div>

        <div className="px-4 py-2 flex flex-col gap-1 max-h-[420px] overflow-y-auto overflow-x-hidden relative">
          <div className="absolute left-7 top-4 bottom-4 w-px bg-slate-100 z-0"></div>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-4 border-slate-200 border-t-sky-500 rounded-full animate-spin"></div>
            </div>
          ) : data.length > 0 ? (
            data.map((user, idx) => {
              const rank = idx + 1;
              return (
                <div key={user.id} className={`relative z-10 flex items-center justify-between p-2.5 mb-2 rounded-2xl border transition-all ${user.isCurrentUser ? "bg-amber-50 border-amber-200" : "bg-white border-slate-100 hover:border-sky-200"}`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-7 flex items-center justify-center shrink-0`}>
                      {rank === 1 && <Crown className="w-6 h-6 text-amber-500 fill-amber-400" />}
                      {rank === 2 && <Crown className="w-6 h-6 text-slate-400 fill-slate-300" />}
                      {rank === 3 && <Crown className="w-6 h-6 text-orange-600 fill-orange-500" />}
                      {rank > 3 && <span className="text-lg font-bold text-slate-500">{rank}</span>}
                    </div>
                    <div className="relative shrink-0">
                      {user.avatar ? (
                        <img src={user.avatar} alt={user.name} className="w-9 h-9 rounded-full object-cover" />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-sm uppercase">
                          {user.name.charAt(0)}
                        </div>
                      )}
                      {user.isOnline && (
                        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 border-2 border-white rounded-full"></div>
                      )}
                    </div>
                    <div>
                      <p className="text-[13px] font-bold text-slate-800 leading-tight mb-1">{user.name}</p>
                      <div className="flex items-center gap-1 text-sky-500 font-semibold text-[11px]">
                        <Trophy className="w-3.5 h-3.5" />
                        <span>{user.score.toLocaleString()} điểm</span>
                      </div>
                    </div>
                  </div>
                  <div className="shrink-0 flex items-center gap-1.5 bg-orange-50 px-2.5 py-1 rounded-full text-orange-500 font-bold text-[12px]">
                    <Flame className={`w-3.5 h-3.5 ${user.streak > 0 ? "fill-orange-500" : "fill-none text-orange-300"}`} />
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
            onClick={() => {
              navigate("/student/leaderboard");
              window.scrollTo({ top: 0, behavior: "auto" });
            }}
            className="text-xs font-semibold text-sky-600 hover:text-sky-700 hover:underline cursor-pointer transition-all"
          >
            Xem tất cả bảng xếp hạng &rarr;
          </button>
        </div>
      </div>
    </div>
  );
}

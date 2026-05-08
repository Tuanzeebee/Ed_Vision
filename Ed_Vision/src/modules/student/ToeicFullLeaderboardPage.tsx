import { useState, useMemo, useEffect } from "react";
import { ChevronLeft, ChevronRight, Trophy, Search, HelpCircle, Crown, Flame } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Header from "../../components/layout/Header";
import Footer from "../../components/layout/Footer";
import { useAuth } from "@/hooks/useAuth";
import { getWeeklyLeaderboard, getTotalLeaderboard, getPersonalStats, type LeaderboardEntry, type LeaderboardResponse, type PersonalStatsResponse } from "@/services/api/leaderboardService";
import { getAvatarUrl } from "@/lib/avatarUtils";
import cacheService from "@/services/cacheService";

const LEADERBOARD_TTL = 30 * 1000; // 30s
const PERSONAL_STATS_TTL = 30 * 1000;

type DisplayUser = {
  id: string;
  name: string;
  avatar: string;
  score: number;
  streak: number;
  isCurrentUser: boolean;
  isOnline: boolean;
};

export default function ToeicFullLeaderboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [tab, setTab] = useState<"week" | "total">("week");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const itemsPerPage = 10;
  
  const [data, setData] = useState<DisplayUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalEntries, setTotalEntries] = useState(0);
  const [currentUserRank, setCurrentUserRank] = useState<number | null>(null);

  // Fetch personal stats once — response chứa cả weeklyRank lẫn totalRank,
  // không cần gọi lại khi đổi tab.
  const [personalStats, setPersonalStats] = useState<PersonalStatsResponse | null>(null);
  useEffect(() => {
    let cancelled = false;
    const fetchStats = async () => {
      try {
        const stats = await cacheService.getOrFetch<PersonalStatsResponse>(
          `leaderboard:personal-stats:${user?.id ?? "anon"}`,
          () => getPersonalStats(),
          PERSONAL_STATS_TTL,
        );
        if (!cancelled) setPersonalStats(stats);
      } catch {
        // ignore — sẽ fallback bằng entry trong bảng
      }
    };
    fetchStats();
    return () => { cancelled = true; };
  }, [user?.id]);

  // Fetch leaderboard data theo tab — có cache + cancel flag để tránh race condition
  useEffect(() => {
    let cancelled = false;
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const fetchFn = tab === "week" ? getWeeklyLeaderboard : getTotalLeaderboard;
        const response = await cacheService.getOrFetch<LeaderboardResponse>(
          `leaderboard:${tab}:100:0`,
          () => fetchFn(100, 0),
          LEADERBOARD_TTL,
        );
        if (cancelled) return;

        const displayUsers: DisplayUser[] = response.entries.map((entry) => ({
          id: `user-${entry.accountId}`,
          name: entry.username,
          avatar: getAvatarUrl(entry.avatarUrl, entry.gender),
          score: entry.score,
          streak: entry.currentStreak || 0,
          isCurrentUser: entry.accountId === user?.id,
          isOnline: entry.isOnline,
        }));

        setData(displayUsers);
        setTotalEntries(response.pagination.total);

        // Lấy rank chính xác từ personal stats (đã fetch song song ở effect khác).
        if (personalStats) {
          setCurrentUserRank(
            tab === "week" ? personalStats.rankings.weeklyRank : personalStats.rankings.totalRank,
          );
        } else {
          const userEntry = response.entries.find(e => e.accountId === user?.id);
          setCurrentUserRank(userEntry?.rank || null);
        }
      } catch {
        if (!cancelled) setError("Không thể tải bảng xếp hạng. Vui lòng thử lại sau.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchData();
    return () => { cancelled = true; };
  }, [tab, user?.id, personalStats]);

  const filteredData = useMemo(() => {
    return data.filter(u => u.name.toLowerCase().includes(search.toLowerCase()));
  }, [data, search]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const currentData = filteredData.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header />

      <main className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
        {/* Breadcrumb / Back */}
        <nav className="flex items-center gap-2 text-sm text-slate-500 mb-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1 font-medium hover:text-sky-600 transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
            Trở về
          </button>
          <span className="text-slate-300">/</span>
          <span className="font-semibold text-slate-700">Bảng Xếp Hạng</span>
        </nav>

        {/* Hero Section */}
        <section className="bg-gradient-to-r from-sky-600 to-indigo-600 rounded-2xl p-6 sm:p-10 text-white shadow-md flex flex-col md:flex-row items-center justify-between gap-6 mb-8">
          <div className="flex items-center gap-5">
            <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center border border-white/30 shadow-inner">
              <Trophy className="w-10 h-10 text-amber-300" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black mb-1">Bảng Xếp Hạng TOEIC</h1>
              <p className="text-white/80 max-w-md">
                Thi đua học tập, tích lũy điểm số và vượt qua các thử thách để vươn lên Top đầu!
                Trường hợp bằng điểm, người dùng lâu năm hơn sẽ được xếp trên.
              </p>
            </div>
          </div>

          <div className="bg-white/10 border border-white/20 rounded-xl p-4 w-full md:w-auto text-center backdrop-blur-sm">
            <p className="text-xs text-white/70 mb-1 uppercase font-bold tracking-widest">Hạng của bạn</p>
            {loading ? (
              <p className="text-2xl font-black text-white/50">...</p>
            ) : currentUserRank ? (
              <p className="text-4xl font-black text-amber-300">
                {currentUserRank}
                <span className="text-lg text-white/50 font-medium">/{totalEntries}</span>
              </p>
            ) : (
              <p className="text-lg font-bold text-white/70">Chưa xếp hạng</p>
            )}
          </div>
        </section>

        {/* Filters and List */}
        <section className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          {/* Tabs and Search */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border-b border-slate-100 bg-slate-50">
            <div className="flex bg-slate-200/50 p-1 rounded-xl">
              <button
                onClick={() => { setTab("week"); setPage(1); }}
                className={`px-5 py-2 text-sm font-semibold rounded-lg transition-all ${tab === "week" ? "bg-white text-sky-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
              >
                Xếp hạng tuần
              </button>
              <button
                onClick={() => { setTab("total"); setPage(1); }}
                className={`px-5 py-2 text-sm font-semibold rounded-lg transition-all ${tab === "total" ? "bg-white text-sky-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
              >
                Tổng xếp hạng
              </button>
            </div>

            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Tìm kiếm người dùng..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="pl-9 pr-4 py-2 text-sm rounded-xl border border-slate-200 w-full sm:w-64 focus:outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100 transition-all"
              />
            </div>
          </div>

          {/* Table Header */}
          <div className="grid grid-cols-12 gap-4 p-4 text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 items-center">
            <div className="col-span-2 sm:col-span-1 text-center">Hạng</div>
            <div className="col-span-7 sm:col-span-5">Sinh viên</div>
            <div className="col-span-3 sm:col-span-3 text-right sm:text-left">Điểm số</div>
            <div className="hidden sm:block sm:col-span-3 text-right">Chi tiết</div>
          </div>

          {/* Table Body */}
          <div className="divide-y divide-slate-50 relative min-h-[400px]">
            {loading ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-slate-400">
                  <div className="w-8 h-8 border-4 border-slate-200 border-t-sky-500 rounded-full animate-spin mx-auto mb-2"></div>
                  <p className="text-sm font-medium">Đang tải...</p>
                </div>
              </div>
            ) : error ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-red-400 p-8 text-center">
                <HelpCircle className="w-12 h-12 mb-3" />
                <p className="font-semibold text-red-600">{error}</p>
              </div>
            ) : currentData.length > 0 ? currentData.map((user, idx) => {
              const actualIndex = filteredData.findIndex(u => u.id === user.id);
              const rank = actualIndex + 1;
              return (
                <div key={user.id} className={`flex items-center justify-between p-4 mb-3 rounded-2xl border transition-all ${user.isCurrentUser ? "bg-amber-50 border-amber-200 shadow-sm" : "bg-white border-slate-200 hover:border-sky-200 shadow-sm"}`}>
                  <div className="flex items-center gap-4">
                    <div className={`w-10 flex items-center justify-center shrink-0`}>
                      {rank === 1 && <Crown className="w-8 h-8 text-amber-500 fill-amber-400" />}
                      {rank === 2 && <Crown className="w-8 h-8 text-slate-400 fill-slate-300" />}
                      {rank === 3 && <Crown className="w-8 h-8 text-orange-600 fill-orange-500" />}
                      {rank > 3 && <span className="text-xl font-bold text-slate-500">{rank}</span>}
                    </div>
                    
                    <div className="relative shrink-0">
                      <img src={user.avatar} alt={user.name} className="w-14 h-14 rounded-full object-cover" />
                      {user.isOnline && (
                        <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-400 border-2 border-white rounded-full"></div>
                      )}
                    </div>
                    
                    <div>
                      <p className="text-base font-bold text-slate-800 leading-tight mb-1">{user.name}</p>
                      <div className="flex items-center gap-1.5 text-sky-500 font-semibold text-sm">
                        <Trophy className="w-4 h-4" />
                        <span>{user.score.toLocaleString()} điểm</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="shrink-0 flex items-center gap-1.5 bg-orange-50 px-4 py-2 rounded-full text-orange-500 font-bold text-sm">
                    <Flame className={`w-5 h-5 ${user.streak > 0 ? "fill-orange-500" : "fill-none text-orange-300"}`} />
                    <span className={user.streak > 0 ? "" : "text-orange-400"}>{user.streak}</span>
                  </div>
                </div>
              );
            }) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 p-8 text-center">
                <HelpCircle className="w-12 h-12 mb-3 text-slate-200" />
                <p className="font-semibold text-slate-600">Không tìm thấy người dùng</p>
                <p className="text-sm mt-1">Thử thay đổi từ khóa tìm kiếm</p>
              </div>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between p-4 border-t border-slate-100 bg-slate-50">
              <p className="text-xs text-slate-500 font-medium">
                Hiển thị trang <span className="text-slate-800 font-bold">{page}</span> / {totalPages}
              </p>
              <div className="flex gap-1.5">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
                  // Logic for showing surrounding pages
                  let pageNum = page;
                  if (page <= 3) pageNum = i + 1;
                  else if (page >= totalPages - 2) pageNum = totalPages - 4 + i;
                  else pageNum = page - 2 + i;

                  if (pageNum < 1 || pageNum > totalPages) return null;

                  return (
                    <button
                      key={pageNum}
                      onClick={() => setPage(pageNum)}
                      className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm font-semibold transition-colors ${page === pageNum ? "bg-sky-500 text-white border-transparent" : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"}`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
}

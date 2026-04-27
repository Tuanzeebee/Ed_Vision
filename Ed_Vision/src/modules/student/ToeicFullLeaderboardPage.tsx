import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight, Trophy, Search, HelpCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Header from "../../components/layout/Header";
import Footer from "../../components/layout/Footer";
import { useAuth } from "@/hooks/useAuth";

// Generate mock data for the full leaderboard
const generateMockUsers = () => {
  const users = [];
  for (let i = 1; i <= 50; i++) {
    users.push({
      id: `user-${i}`,
      name: `Người dùng ${i}`,
      avatar: `https://i.pravatar.cc/150?u=${i}`,
      score: Math.floor(Math.random() * 2000) + 10,
      joinedAt: new Date(Date.now() - Math.floor(Math.random() * 10000000000)).getTime(),
      isCurrentUser: i === 12
    });
  }

  // Sort by score descending. If score is equal, sort by joinedAt ascending (longest using)
  users.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.joinedAt - b.joinedAt;
  });

  // Update names for realism after sorting
  if (users.length > 0) users[0].name = "Joreii";
  if (users.length > 1) users[1].name = "Linh Xinh";
  if (users.length > 2) users[2].name = "Nguyễn Hoàng Anh";

  return users;
};

const mockFullData = generateMockUsers();

export default function ToeicFullLeaderboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [tab, setTab] = useState<"week" | "total">("week");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const itemsPerPage = 10;

  // Inject current user's real name from auth
  const currentUserName = user?.fullName || user?.full_name || user?.name || "Bạn";
  const data = mockFullData.map(u => u.isCurrentUser ? { ...u, name: currentUserName } : u);

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
            <p className="text-4xl font-black text-amber-300">12<span className="text-lg text-white/50 font-medium">/50</span></p>
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
            {currentData.length > 0 ? currentData.map((user, idx) => {
              const actualIndex = data.findIndex(u => u.id === user.id);
              const rank = actualIndex + 1;
              let rankBg = "bg-slate-100 text-slate-500 border border-slate-200";
              if (rank === 1) rankBg = "bg-gradient-to-br from-red-400 to-rose-600 text-white shadow-sm border-none";
              else if (rank === 2) rankBg = "bg-gradient-to-br from-emerald-400 to-green-600 text-white shadow-sm border-none";
              else if (rank === 3) rankBg = "bg-gradient-to-br from-sky-400 to-blue-600 text-white shadow-sm border-none";

              return (
                <div key={user.id} className={`grid grid-cols-12 gap-4 p-4 items-center transition-colors ${user.isCurrentUser ? "bg-amber-50/50" : "hover:bg-slate-50/80"}`}>
                  <div className="col-span-2 sm:col-span-1 flex justify-center">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm font-bold ${rankBg}`}>
                      {rank}
                    </div>
                  </div>

                  <div className="col-span-7 sm:col-span-5 flex items-center gap-3">
                    <div className="relative shrink-0">
                      <img src={user.avatar} alt={user.name} className="w-10 h-10 rounded-full border-2 border-white shadow-sm" />
                      {user.isCurrentUser && (
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-amber-400 border-2 border-white rounded-full flex items-center justify-center">
                          <span className="text-[8px]">⭐</span>
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-slate-700 truncate flex items-center gap-1.5">
                        {user.name}
                        {user.isCurrentUser && <span className="text-[10px] text-amber-600 bg-amber-100 px-1.5 py-0.5 rounded font-semibold ml-1 shrink-0">(Bạn)</span>}
                      </p>
                    </div>
                  </div>

                  <div className="col-span-3 sm:col-span-3 text-right sm:text-left">
                    <p className="text-base sm:text-lg font-black text-slate-800">{user.score.toLocaleString()}</p>
                    <p className="text-[10px] text-slate-400 uppercase font-semibold">Điểm</p>
                  </div>

                  <div className="hidden sm:flex sm:col-span-3 justify-end">
                    <button className="text-xs font-semibold text-sky-600 bg-sky-50 hover:bg-sky-100 px-3 py-1.5 rounded-lg transition-colors border border-sky-100 cursor-pointer">
                      Xem hồ sơ
                    </button>
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

import { useState } from "react";
import { Bookmark, HelpCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

type LeaderboardEntry = {
  id: string;
  name: string;
  avatar: string;
  score: number;
  isCurrentUser?: boolean;
};

/** Danh hiệu theo tổng điểm TOEIC */
function getRankBadge(score: number): { label: string; emoji: string; color: string; border: string; bg: string } {
  if (score >= 700) return { label: "Cao cấp", emoji: "👑", color: "text-amber-700", border: "border-amber-400/40", bg: "bg-amber-500/15" };
  if (score >= 300) return { label: "Trung cấp", emoji: "🔥", color: "text-orange-700", border: "border-orange-400/30", bg: "bg-orange-500/15" };
  return { label: "Sơ cấp", emoji: "🌱", color: "text-emerald-700", border: "border-emerald-400/30", bg: "bg-emerald-500/15" };
}

// Mock data — no roleBadge
const mockWeekly: LeaderboardEntry[] = [
  { id: "u1", name: "Joreii", avatar: "https://i.pravatar.cc/150?u=1", score: 1085 },
  { id: "u2", name: "Linh Xinh", avatar: "https://i.pravatar.cc/150?u=2", score: 650 },
  { id: "u3", name: "Nguyễn Hoàng Anh", avatar: "https://i.pravatar.cc/150?u=3", score: 535 },
  { id: "u4", name: "Tran Minh", avatar: "https://i.pravatar.cc/150?u=4", score: 420 },
  { id: "u5", name: "Le Vi", avatar: "https://i.pravatar.cc/150?u=5", score: 410 },
  { id: "u6", name: "Thanh Dat", avatar: "https://i.pravatar.cc/150?u=7", score: 60 },
  { id: "u7", name: "Minh Ngoc", avatar: "https://i.pravatar.cc/150?u=8", score: 55 },
  { id: "u8", name: "Tuan Anh", avatar: "https://i.pravatar.cc/150?u=9", score: 50 },
  { id: "u9", name: "Phuong Thao", avatar: "https://i.pravatar.cc/150?u=10", score: 45 },
  { id: "u10", name: "Duc Duy", avatar: "https://i.pravatar.cc/150?u=11", score: 40 },
];

export default function StudentLeaderboard() {
  const [tab, setTab] = useState<"week" | "total">("week");
  const navigate = useNavigate();
  const { user } = useAuth();

  // Current user info from auth
  const currentUserName = user?.fullName || user?.full_name || user?.name || "Bạn";
  const currentUserAvatar = user?.avatarUrl || user?.avatar_url || user?.avatar || "https://i.pravatar.cc/150?u=6";
  const currentUserScore = 77; // TODO: fetch from API

  const rankBadge = getRankBadge(currentUserScore);

  // In a real app, we would fetch data based on tab.
  const data = mockWeekly;

  return (
    <div className="flex flex-col gap-4">
      {/* Current User Profile Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="bg-[#e05d4b] p-4 flex items-center gap-3">
          <div className="w-14 h-14 rounded-full bg-white p-0.5 shrink-0">
            <img src={currentUserAvatar} alt="Avatar" className="w-full h-full rounded-full object-cover" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">{currentUserName}</h3>
            <div className={`${rankBadge.bg} w-max px-1.5 py-0.5 rounded text-[10px] text-white border ${rankBadge.border}`}>
              {rankBadge.emoji} {rankBadge.label}
            </div>
          </div>
        </div>
        <div className="p-4 bg-slate-50 grid grid-cols-2 gap-3">
          <div className="bg-slate-100/80 rounded-xl p-3 text-center">
            <p className="text-xs text-slate-500">Điểm tuần này</p>
            <p className="text-2xl font-black text-slate-700">0</p>
          </div>
          <div className="bg-slate-100/80 rounded-xl p-3 text-center">
            <p className="text-xs text-slate-500">Hạng tuần này</p>
            <p className="text-2xl font-black text-slate-700">&gt; 100</p>
          </div>
          <div className="bg-slate-100/80 rounded-xl p-3 text-center">
            <p className="text-xs text-slate-500">Tổng điểm</p>
            <p className="text-2xl font-black text-green-500">{currentUserScore}</p>
          </div>
          <div className="bg-slate-100/80 rounded-xl p-3 text-center">
            <p className="text-xs text-slate-500">Hạng tổng</p>
            <p className="text-2xl font-black text-sky-500">&gt; 100</p>
          </div>
        </div>
      </div>

      {/* Leaderboard List */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-0 overflow-hidden relative">
        <div className="absolute top-0 left-6 text-[#e05d4b]">
          <Bookmark className="w-10 h-10 fill-current" />
        </div>
        <div className="pt-5 pb-3 px-6 ml-10 flex items-center gap-1.5">
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
          {data.map((user, idx) => {
            const rank = idx + 1;
            let rankBg = "bg-slate-200 text-slate-500";
            if (rank === 1) rankBg = "bg-red-500 text-white";
            else if (rank === 2) rankBg = "bg-green-500 text-white";
            else if (rank === 3) rankBg = "bg-sky-500 text-white";

            return (
              <div key={user.id} className={`relative z-10 flex items-center justify-between p-2 rounded-xl transition-colors ${user.isCurrentUser ? "bg-amber-50 border border-amber-100" : "hover:bg-slate-50"}`}>
                <div className="flex items-center gap-3">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 ${rankBg}`}>
                    {rank}
                  </div>
                  <div className="relative">
                    <img src={user.avatar} alt={user.name} className="w-10 h-10 rounded-full border-2 border-white shadow-sm" />
                    <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-green-400 border-2 border-white rounded-full"></div>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-700">{user.name}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-black text-slate-800">{user.score}</p>
                  <p className="text-[10px] text-slate-400">điểm</p>
                </div>
              </div>
            );
          })}
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

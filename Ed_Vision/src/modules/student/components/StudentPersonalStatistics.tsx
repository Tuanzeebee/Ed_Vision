import { useState } from "react";
import { Target, Headphones, Clock, Languages, BookOpenCheck, FileText, Calendar } from "lucide-react";

type StatCardProps = {
  title: string;
  value: string | number;
  todayAdd: number;
  yesterdayAdd: number;
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
};

function StatCard({ title, value, todayAdd, yesterdayAdd, icon, iconBg, iconColor }: StatCardProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-2">
        <p className="text-sm font-semibold text-slate-600">{title}</p>
        <div className={`w-8 h-8 rounded-xl ${iconBg} ${iconColor} flex items-center justify-center`}>
          {icon}
        </div>
      </div>
      <div className="flex justify-between items-end mt-2">
        <p className="text-2xl font-black text-slate-800">{value}</p>
        <div className="text-right">
          <p className="text-xs text-slate-500 font-medium">Nay: <span className="text-slate-700">+{todayAdd}</span></p>
          <p className="text-xs text-slate-500 font-medium">Qua: <span className="text-slate-700">+{yesterdayAdd}</span></p>
        </div>
      </div>
    </div>
  );
}

export default function StudentPersonalStatistics() {
  const [dateRange, setDateRange] = useState({
    from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    to: new Date().toISOString().split('T')[0]
  });

  return (
    <section className="mb-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
        <div className="flex items-center gap-3">
          <div className="h-7 w-1 rounded-full bg-gradient-to-b from-blue-400 to-indigo-400" />
          <h2 className="text-xl font-bold text-slate-800">Tiến trình học tập cá nhân</h2>
        </div>
        
        {/* Date Filter */}
        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-1.5 shadow-sm">
          <Calendar className="w-4 h-4 text-slate-400" />
          <input 
            type="date" 
            value={dateRange.from}
            onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
            className="text-xs text-slate-600 outline-none bg-transparent cursor-pointer [color-scheme:light]"
          />
          <span className="text-slate-300">-</span>
          <input 
            type="date" 
            value={dateRange.to}
            onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
            className="text-xs text-slate-600 outline-none bg-transparent cursor-pointer [color-scheme:light]"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard 
          title="Tổng lượt làm bài" 
          value="150,142" 
          todayAdd={8733} 
          yesterdayAdd={7626}
          icon={<Target className="w-4 h-4" />}
          iconBg="bg-blue-50"
          iconColor="text-blue-500"
        />
        <StatCard 
          title="Listening Sessions" 
          value="343,731" 
          todayAdd={11433} 
          yesterdayAdd={20145}
          icon={<Headphones className="w-4 h-4" />}
          iconBg="bg-sky-50"
          iconColor="text-sky-500"
        />
        <StatCard 
          title="Thời gian nghe" 
          value="477h 24m" 
          todayAdd={2} 
          yesterdayAdd={4}
          icon={<Clock className="w-4 h-4" />}
          iconBg="bg-cyan-50"
          iconColor="text-cyan-500"
        />
        <StatCard 
          title="Từ vựng đã học" 
          value="113,284" 
          todayAdd={2017} 
          yesterdayAdd={4213}
          icon={<Languages className="w-4 h-4" />}
          iconBg="bg-indigo-50"
          iconColor="text-indigo-500"
        />
        <StatCard 
          title="Reading hoàn thành" 
          value="4,361" 
          todayAdd={132} 
          yesterdayAdd={243}
          icon={<BookOpenCheck className="w-4 h-4" />}
          iconBg="bg-emerald-50"
          iconColor="text-emerald-500"
        />
        <StatCard 
          title="Mock Tests" 
          value="1,098" 
          todayAdd={48} 
          yesterdayAdd={81}
          icon={<FileText className="w-4 h-4" />}
          iconBg="bg-teal-50"
          iconColor="text-teal-500"
        />
      </div>
    </section>
  );
}

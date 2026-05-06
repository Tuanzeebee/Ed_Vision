import { type Dispatch, type SetStateAction } from "react";
import {
  ArrowRightCircle,
  BarChart2,
  BookOpen,
  Calendar,
  Flame,
  Headphones,
  Mic2,
  Pencil,
  Sparkles,
  Target,
} from "lucide-react";
import type { CertBand, SkillSection } from "./certificateData";

type TopicItem = {
  title: string;
  desc: string;
  topicKey?: string;
  done?: boolean;
};

type Props = {
  goalBandDisplay: string;
  currentBandDisplay: string;
  examDateLabel: string | null;
  dDayValue: number | null;
  isIeltsSetupOpen: boolean;
  setIsIeltsSetupOpen: Dispatch<SetStateAction<boolean>>;
  draftGoalBand: string;
  setDraftGoalBand: Dispatch<SetStateAction<string>>;
  draftExamDate: string;
  setDraftExamDate: Dispatch<SetStateAction<string>>;
  handleSaveIeltsSetup: () => void;
  handleOpenIeltsSetup: () => void;
  handleStartPlan: () => void;
  nextTopicKey?: string;
  highlightTopics: TopicItem[];
  streakDays: number;
  effectiveSelectedBand: CertBand | null;
  handleOpenSkillRoadmap: (skill: "reading" | "listening" | "writing" | "speaking") => void;
  skillRoadmapTopicKey: {
    reading?: string;
    listening?: string;
    writing?: string;
    speaking?: string;
  };
  grammarSection?: SkillSection;
  vocabSection?: SkillSection;
};

export default function IeltsCertificateSection({
  goalBandDisplay,
  currentBandDisplay,
  examDateLabel,
  dDayValue,
  isIeltsSetupOpen,
  setIsIeltsSetupOpen,
  draftGoalBand,
  setDraftGoalBand,
  draftExamDate,
  setDraftExamDate,
  handleSaveIeltsSetup,
  handleOpenIeltsSetup,
  handleStartPlan,
  nextTopicKey,
  highlightTopics,
  streakDays,
  effectiveSelectedBand,
  handleOpenSkillRoadmap,
  skillRoadmapTopicKey,
  grammarSection,
  vocabSection,
}: Props) {
  const goalBandNumber = Number(goalBandDisplay) || 0;
  const currentBandNumber = Number(currentBandDisplay) || 0;
  const goalProgressPercent =
    goalBandNumber > 0
      ? Math.min(100, Math.round((currentBandNumber / goalBandNumber) * 100))
      : 0;

  return (
    <>
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#1b1230] via-[#281d52] to-[#472669] p-8 text-white">
        <div
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              "radial-gradient(circle at top right, rgba(255,255,255,0.35), transparent 50%)",
          }}
        />
        <div className="relative z-10 flex flex-col lg:flex-row items-start gap-8">
          <div className="flex-1">
            <p className="text-xs uppercase tracking-[0.4em] text-white/60">
              IELTS HOME
            </p>
            <h1 className="mt-3 text-3xl sm:text-4xl font-black leading-tight">
              Chinh phục Band {goalBandDisplay !== "--" ? goalBandDisplay : "mục tiêu"} với lộ trình cá nhân hoá.
            </h1>
            <p className="mt-3 text-white/80 text-sm sm:text-base">
              {examDateLabel
                ? `Bạn còn ${dDayValue ?? 0} ngày trước kỳ thi ngày ${examDateLabel}. Hôm nay hãy khóa thêm 1 kỹ năng nhé!`
                : "Đặt ngày thi để hệ thống tạo kế hoạch đếm ngược chi tiết cho bạn."}
            </p>
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                {
                  label: "Goal Band",
                  value: goalBandDisplay,
                  icon: <Target className="w-4 h-4" />,
                },
                {
                  label: "Current Band",
                  value: currentBandDisplay,
                  icon: <BarChart2 className="w-4 h-4" />,
                },
                {
                  label: "D-Day",
                  value: examDateLabel ? `${dDayValue ?? 0} ngày` : "Chưa đặt",
                  icon: <Calendar className="w-4 h-4" />,
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className="bg-white/10 border border-white/10 rounded-2xl px-4 py-3 backdrop-blur"
                >
                  <div className="flex items-center gap-2 text-white/70 text-xs font-semibold uppercase tracking-wide">
                    {item.icon}
                    {item.label}
                  </div>
                  <p className="text-2xl font-bold mt-1">{item.value}</p>
                </div>
              ))}
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                onClick={handleStartPlan}
                disabled={!nextTopicKey}
                className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-sm font-semibold transition-colors cursor-pointer ${
                  nextTopicKey
                    ? "bg-white text-[#1b1230] hover:bg-white/90"
                    : "bg-white/30 text-white/60 cursor-not-allowed"
                }`}
              >
                <ArrowRightCircle className="w-4 h-4" /> Tiếp tục lộ trình
              </button>
              <button
                onClick={handleOpenIeltsSetup}
                className="px-4 py-3 rounded-2xl border border-white/20 text-sm font-semibold text-white/80 hover:bg-white/10 transition-colors cursor-pointer"
              >
                Cập nhật mục tiêu
              </button>
            </div>

            {isIeltsSetupOpen && (
              <div className="mt-4 rounded-2xl border border-white/20 bg-white/10 p-4 backdrop-blur space-y-4">
                <h3 className="text-sm font-semibold text-white">
                  Thiết lập Goal Band & D-Day
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label className="text-xs text-white/80 space-y-1 block">
                    Goal Band
                    <input
                      value={draftGoalBand}
                      onChange={(e) => setDraftGoalBand(e.target.value)}
                      inputMode="decimal"
                      placeholder="Ví dụ: 6.5"
                      className="w-full px-3 py-2 rounded-xl border border-white/20 bg-black/20 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-white/30"
                    />
                  </label>

                  <label className="text-xs text-white/80 space-y-1 block">
                    Ngày thi (D-Day)
                    <input
                      type="date"
                      value={draftExamDate}
                      onChange={(e) => setDraftExamDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-white/20 bg-black/20 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-white/30"
                    />
                  </label>
                </div>

                <div className="rounded-xl border border-emerald-300/30 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-100">
                  Current Band đang nhận từ kết quả test thật truyền vào qua URL
                  {" "}`?currentBand=` hoặc localStorage key `ieltsCurrentBand`.
                </div>

                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setIsIeltsSetupOpen(false)}
                    className="px-3 py-2 rounded-xl border border-white/20 text-xs font-semibold text-white/80 hover:bg-white/10 transition-colors"
                  >
                    Huỷ
                  </button>
                  <button
                    onClick={handleSaveIeltsSetup}
                    className="px-3 py-2 rounded-xl bg-white text-[#1b1230] text-xs font-semibold hover:bg-white/90 transition-colors"
                  >
                    Lưu thiết lập
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="w-full lg:w-80 bg-white/10 border border-white/15 rounded-3xl p-5 backdrop-blur">
            <p className="text-sm font-semibold text-white/80 flex items-center gap-2 mb-4">
              <Sparkles className="w-4 h-4" /> Gợi ý luyện tập hôm nay
            </p>
            <div className="space-y-3">
              {highlightTopics.map((topic, index) => (
                <div
                  key={`${topic.title}-${index}`}
                  className="flex items-start gap-3 p-3 rounded-2xl bg-white/5 border border-white/10"
                >
                  <span className="w-8 h-8 rounded-2xl bg-white/10 flex items-center justify-center text-sm font-bold">
                    {index + 1}
                  </span>
                  <div className="flex-1">
                    <p className="text-sm font-semibold">{topic.title}</p>
                    <p className="text-xs text-white/70">{topic.desc}</p>
                  </div>
                </div>
              ))}
              {highlightTopics.length === 0 && (
                <p className="text-sm text-white/70">
                  Hãy chọn một kỹ năng để xem gợi ý cụ thể.
                </p>
              )}
            </div>
            <button
              onClick={handleStartPlan}
              disabled={!nextTopicKey}
              className={`mt-4 w-full text-sm font-semibold flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl border border-white/30 transition-colors cursor-pointer ${
                nextTopicKey
                  ? "hover:bg-white/10 text-white"
                  : "text-white/50 cursor-not-allowed"
              }`}
            >
              Bắt đầu ngay
            </button>
          </div>
        </div>
      </section>

      <section className="flex flex-col sm:flex-row gap-3">
        <div className="sm:w-40 w-full bg-gradient-to-br from-orange-400 via-amber-500 to-yellow-400 rounded-xl border-2 border-orange-500 px-5 py-4 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 bg-orange-300 blur-md rounded-full" />
              <div className="relative w-12 h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center shadow-md">
                <Flame className="w-7 h-7 text-white" />
              </div>
            </div>
            <div>
              <p className="text-xs font-bold text-white/90 uppercase tracking-wide">
                Streak
              </p>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-black text-white">{streakDays}</span>
                <span className="text-sm font-bold text-white/90">ngày</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 flex items-center gap-3 bg-gradient-to-r from-violet-100 via-purple-100 to-indigo-100 rounded-xl border border-violet-200 px-4 py-3">
          <div className="shrink-0">
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm border border-violet-200">
              <Target className="w-5 h-5 text-violet-500" />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-center mb-1.5">
              <p className="text-xs text-violet-600 font-medium">
                Band {effectiveSelectedBand || "--"} → {goalBandDisplay}
              </p>
              <p className="text-xs font-bold text-violet-500">
                {Math.max(
                  0,
                  Math.round(
                    ((Number(goalBandDisplay) || 0) -
                      (Number(effectiveSelectedBand || "0") || 0)) *
                      10,
                  ),
                )}{" "}
                bước
              </p>
            </div>
            <div className="h-3 bg-violet-200 rounded-full overflow-hidden relative">
              <div
                className="h-full bg-gradient-to-r from-violet-500 via-purple-500 to-indigo-500 rounded-full transition-all duration-1000"
                style={{ width: `${goalProgressPercent}%` }}
              />
            </div>
            <p className="text-xs text-violet-500 mt-1">
              Đang trên đường chinh phục Goal! 💪
            </p>
          </div>
        </div>
      </section>

      <section>
        <div className="flex items-center gap-3 mb-5">
          <div className="h-7 w-1 rounded-full bg-gradient-to-b from-blue-400 to-violet-400" />
          <h2 className="text-xl font-bold text-slate-800">
            Lộ trình chi tiết theo kỹ năng
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            {
              key: "reading",
              label: "Reading",
              subtitle: "Kỹ năng đọc hiểu",
              icon: <BookOpen className="w-5 h-5 text-blue-500" />,
              iconBg: "bg-blue-50",
              border: "hover:border-blue-200",
            },
            {
              key: "listening",
              label: "Listening",
              subtitle: "Kỹ năng nghe hiểu",
              icon: <Headphones className="w-5 h-5 text-green-500" />,
              iconBg: "bg-green-50",
              border: "hover:border-green-200",
            },
            {
              key: "writing",
              label: "Writing",
              subtitle: "Kỹ năng viết",
              icon: <Pencil className="w-5 h-5 text-orange-500" />,
              iconBg: "bg-orange-50",
              border: "hover:border-orange-200",
            },
            {
              key: "speaking",
              label: "Speaking",
              subtitle: "Kỹ năng nói",
              icon: <Mic2 className="w-5 h-5 text-pink-500" />,
              iconBg: "bg-pink-50",
              border: "hover:border-pink-200",
            },
          ].map((card) => {
            const hasTopic =
              !!skillRoadmapTopicKey[
                card.key as keyof typeof skillRoadmapTopicKey
              ];

            return (
              <div
                key={card.key}
                onClick={() => {
                  if (!hasTopic) return;
                  handleOpenSkillRoadmap(
                    card.key as "reading" | "listening" | "writing" | "speaking",
                  );
                }}
                className={`bg-white rounded-2xl border shadow-sm p-5 transition-all ${
                  hasTopic
                    ? `border-slate-100 cursor-pointer ${card.border} hover:shadow-md`
                    : "border-slate-100 opacity-70 cursor-not-allowed"
                }`}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className={`w-10 h-10 rounded-xl ${card.iconBg} flex items-center justify-center`}
                  >
                    {card.icon}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800">{card.label}</h3>
                    <p className="text-xs text-slate-400">{card.subtitle}</p>
                  </div>
                </div>
                <p className="text-sm text-slate-500">
                  Nhấn để mở lộ trình học chi tiết cho kỹ năng {card.label}.
                </p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="mt-8">
        <div className="flex items-center gap-3 mb-5">
          <div className="h-7 w-1 rounded-full bg-gradient-to-b from-violet-400 to-amber-400" />
          <h2 className="text-xl font-bold text-slate-800">Từ vựng theo chủ đề</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {(vocabSection?.topics ?? []).length > 0 ? (
            (vocabSection?.topics ?? []).map((item) => (
              <div
                key={item.topicKey}
                className={`bg-white rounded-xl border border-slate-100 p-4 hover:shadow-md transition-shadow cursor-pointer ${item.done ? 'bg-emerald-50/30' : ''}`}
              >
                <div className="text-2xl mb-1">
                  {item.title.toLowerCase().includes('edu') ? '📚' :
                   item.title.toLowerCase().includes('tech') ? '💻' :
                   item.title.toLowerCase().includes('env') ? '🌍' :
                   item.title.toLowerCase().includes('health') ? '🏥' :
                   item.title.toLowerCase().includes('biz') || item.title.toLowerCase().includes('office') ? '💼' :
                   item.title.toLowerCase().includes('travel') ? '✈️' :
                   item.title.toLowerCase().includes('cultur') ? '🎭' :
                   item.title.toLowerCase().includes('scien') ? '🔬' : '📑'}
                </div>
                <p className="font-semibold text-slate-800 text-sm">{item.title}</p>
                <p className="text-xs text-slate-400">{item.desc}</p>
                {item.done && (
                  <div className="mt-2 text-[10px] font-bold text-emerald-600 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> Đã hoàn thành
                  </div>
                )}
              </div>
            ))
          ) : (
            [
              { topic: "Education", count: 150, icon: "📚" },
              { topic: "Technology", count: 120, icon: "💻" },
              { topic: "Environment", count: 100, icon: "🌍" },
              { topic: "Health", count: 90, icon: "🏥" },
              { topic: "Business", count: 130, icon: "💼" },
              { topic: "Travel", count: 80, icon: "✈️" },
              { topic: "Culture", count: 110, icon: "🎭" },
              { topic: "Science", count: 95, icon: "🔬" },
            ].map((item) => (
              <div
                key={item.topic}
                className="bg-white rounded-xl border border-slate-100 p-4 hover:shadow-md transition-shadow cursor-pointer"
              >
                <div className="text-2xl mb-1">{item.icon}</div>
                <p className="font-semibold text-slate-800 text-sm">{item.topic}</p>
                <p className="text-xs text-slate-400">{item.count} từ</p>
              </div>
            ))
          )}
        </div>
      </section>

      <section className="mt-8">
        <div className="flex items-center gap-3 mb-5">
          <div className="h-7 w-1 rounded-full bg-gradient-to-b from-amber-400 to-red-400" />
          <h2 className="text-xl font-bold text-slate-800">Ngữ pháp theo cấp độ</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {(grammarSection?.topics ?? []).length > 0 ? (
            (grammarSection?.topics ?? []).map((item, idx) => (
              <div key={item.topicKey} className={`bg-white rounded-xl border border-slate-100 p-5 ${item.done ? 'bg-violet-50/30' : ''}`}>
                <div className="flex justify-between items-center mb-3">
                  <span className="font-bold text-slate-800">Part {idx + 1}</span>
                  {item.done ? (
                    <span className="text-xs font-bold text-emerald-500">100%</span>
                  ) : (
                    <span className="text-sm text-slate-500">Chưa bắt đầu</span>
                  )}
                </div>
                <h4 className="text-sm font-bold text-slate-700 mb-1">{item.title}</h4>
                <p className="text-xs text-slate-500 mb-3">{item.desc}</p>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full bg-gradient-to-r from-amber-500 to-red-500 rounded-full transition-all`}
                    style={{ width: item.done ? '100%' : '0%' }}
                  />
                </div>
              </div>
            ))
          ) : (
            [
              {
                level: "Basic",
                grammar: "Tenses cơ bản, S-V agreement, Articles",
                progress: 90,
              },
              {
                level: "Intermediate",
                grammar: "Passive Voice, Conditionals, Reported Speech",
                progress: 70,
              },
              {
                level: "Advanced",
                grammar: "Complex structures, Inversions, Cleft sentences",
                progress: 45,
              },
            ].map((item) => (
              <div key={item.level} className="bg-white rounded-xl border border-slate-100 p-5">
                <div className="flex justify-between items-center mb-3">
                  <span className="font-bold text-slate-800">{item.level}</span>
                  <span className="text-sm text-slate-500">{item.progress}%</span>
                </div>
                <p className="text-sm text-slate-500 mb-3">{item.grammar}</p>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-amber-500 to-red-500 rounded-full"
                    style={{ width: `${item.progress}%` }}
                  />
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </>
  );
}

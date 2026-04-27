import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Crown,
  Ear,
  Flag,
  Lock,
  Sparkles,
  BookOpenCheck,
  Brain,
  BookMarked,
  Star,
  BookOpen,
} from "lucide-react";
import type { ToeicFoundationTopic, ToeicIntakeProfile } from "./toeicIntake";
import {
  buildToeicMilestones,
  getToeicProjectedScore,
  markFoundationTopic,
  saveToeicIntakeProfile,
  skipFoundation,
} from "./toeicIntake";
import { getSkills, getRadarData } from "./certificateData";
import { askCertificateTutor } from "../../services/api/certificateService";
import {
  getToeicLeaderboard,
} from "@/services/api/certificateService";
import StudentLeaderboard from "./components/StudentLeaderboard";

type Props = {
  profile: ToeicIntakeProfile;
  onProfileUpdated: (nextProfile: ToeicIntakeProfile) => void;
  onOpenTopic: (topicKey: string) => void;
};

type LeaderboardEntry = {
  name: string;
  score: number;
  streak: number;
  isCurrentUser?: boolean;
};

type FoundationTrackItem = {
  topic: ToeicFoundationTopic;
  title: string;
  key: string;
  hint: string;
  badge: string;
};

const FOUNDATION_TRACK_FALLBACK: FoundationTrackItem[] = [
  {
    topic: "grammar",
    title: "Ngữ pháp nền tảng",
    key: "grammar.articles_pron",
    hint: "Gồm các mảng: 12 thì, loại từ, cấu trúc câu, mệnh đề, danh từ/tính từ/động từ.",
    badge: "Grammar Core",
  },
  {
    topic: "vocabulary",
    title: "Từ vựng theo chủ đề",
    key: "vocab.office_basics_1000",
    hint: "Mỗi chủ đề tập trung khoảng 1000 từ, ưu tiên nhóm từ dùng trong TOEIC thực tế.",
    badge: "Topic 1000 Words",
  },
];

export default function ToeicRoadmapBoard({
  profile,
  onProfileUpdated,
  onOpenTopic,
}: Props) {
  const navigate = useNavigate();
  const [hoveredMilestone, setHoveredMilestone] = useState<number | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);

  const projectedScore = getToeicProjectedScore(profile);

  const toeicSkills = useMemo(() => getSkills("toeic", profile.recommendedBand).filter(
    (s) => s.id === "listening" || s.id === "reading"
  ), [profile.recommendedBand]);

  const radarDataRaw = useMemo(() => getRadarData("toeic"), []);
  const radarData = useMemo(() => [radarDataRaw[2] ?? 68, radarDataRaw[3] ?? 64], [radarDataRaw]);

  const maxVal = radarData.length > 0 ? Math.max(...radarData) : 0;
  const minVal = radarData.length > 0 ? Math.min(...radarData) : 0;
  const strongest = toeicSkills[radarData.indexOf(maxVal)]?.label ?? "Đọc";
  const weakest = toeicSkills[radarData.indexOf(minVal)]?.label ?? "Nghe";

  const [aiFeedback, setAiFeedback] = useState<string>("Đang phân tích dữ liệu...");

  useEffect(() => {
    const listScore = radarData[0] ?? 0;
    const readScore = radarData[1] ?? 0;
    
    askCertificateTutor({
      cert_type: "toeic",
      question: `Điểm đánh giá kỹ năng TOEIC hiện tại của tôi: Nghe đạt ${listScore}/100, Đọc đạt ${readScore}/100. Hãy đóng vai một chuyên gia giáo dục, phân tích ngắn gọn điểm mạnh yếu của tôi dựa trên 2 con số này và đưa ra 1 lời khuyên thực tế nhất để cải thiện điểm số. Không chào hỏi, đi thẳng vào vấn đề.`,
      topic_key: "toeic_skill_analysis",
      concise: true
    }).then(res => {
      setAiFeedback(res.answer);
    }).catch(err => {
      setAiFeedback("Hệ thống AI đang bận. Vui lòng thử lại sau.");
    });
  }, [radarData]);

  const milestones = useMemo(
    () =>
      buildToeicMilestones(
        profile.milestoneState.currentScore,
        profile.milestoneState.targetScore,
      ),
    [profile.milestoneState.currentScore, profile.milestoneState.targetScore],
  );

  const completedFoundation = profile.milestoneState.foundationCompleted;
  const foundationUnlocked =
    profile.milestoneState.foundationSkipped || completedFoundation.length >= 2;

  const currentMilestoneIndex = milestones.findIndex((m) => m > projectedScore);
  const reachedIndex =
    currentMilestoneIndex === -1
      ? milestones.length - 1
      : Math.max(0, currentMilestoneIndex - 1);
  const currentMilestone = milestones[reachedIndex] ?? milestones[0];

  const localFoundationTrack = useMemo<FoundationTrackItem[]>(() => {
    const toeicSkills = getSkills("toeic", profile.recommendedBand);
    const grammarSection = toeicSkills.find(
      (section) => section.id === "grammar",
    );
    const vocabularySection = toeicSkills.find(
      (section) => section.id === "vocabulary",
    );

    const grammarTopicCount = grammarSection?.topics.length ?? 0;
    const vocabularyTopicCount = vocabularySection?.topics.length ?? 0;

    return [
      {
        topic: "grammar",
        title: "Ngữ pháp nền tảng",
        key:
          grammarSection?.topics[0]?.topicKey ??
          FOUNDATION_TRACK_FALLBACK[0].key,
        hint:
          grammarTopicCount > 0
            ? `${grammarTopicCount} chuyên đề: thì, loại từ, cấu trúc câu và các điểm ngữ pháp TOEIC.`
            : FOUNDATION_TRACK_FALLBACK[0].hint,
        badge: "Grammar Core",
      },
      {
        topic: "vocabulary",
        title: "Từ vựng theo chủ đề",
        key:
          vocabularySection?.topics[0]?.topicKey ??
          FOUNDATION_TRACK_FALLBACK[1].key,
        hint:
          vocabularyTopicCount > 0
            ? `${vocabularyTopicCount} chủ đề, mỗi chủ đề định hướng khoảng 1000 từ trọng tâm.`
            : FOUNDATION_TRACK_FALLBACK[1].hint,
        badge: "Topic 1000 Words",
      },
    ];
  }, [profile.recommendedBand]);

  const foundationTrack =
    localFoundationTrack.length >= 2
      ? localFoundationTrack
      : FOUNDATION_TRACK_FALLBACK;

  const localSprintFallbackBySkill = useMemo(() => {
    const toeicSkills = getSkills("toeic", profile.recommendedBand);
    const listeningFallback = toeicSkills.find(
      (section) => section.id === "listening",
    )?.topics[0]?.topicKey;
    const readingFallback = toeicSkills.find(
      (section) => section.id === "reading",
    )?.topics[0]?.topicKey;

    return {
      listening: listeningFallback,
      reading: readingFallback,
    };
  }, [profile.recommendedBand]);

  const listeningPracticeTopic = localSprintFallbackBySkill.listening;
  const readingPracticeTopic = localSprintFallbackBySkill.reading;

  const persistProfile = (nextProfile: ToeicIntakeProfile) => {
    saveToeicIntakeProfile(nextProfile);
    onProfileUpdated(nextProfile);
  };

  const handleSkipFoundation = () => {
    persistProfile(skipFoundation(profile));
  };

  const openFoundationTheory = (topic: ToeicFoundationTopic, key: string) => {
    if (!completedFoundation.includes(topic)) {
      persistProfile(markFoundationTopic(profile, topic));
    }
    onOpenTopic(key);
  };

  useEffect(() => {
    let cancelled = false;

    const loadLeaderboard = async () => {
      try {
        const rows = await getToeicLeaderboard(5);
        if (cancelled) return;
        setLeaderboard(
          rows.map((row) => ({
            name: row.name,
            score: row.score,
            streak: row.streak,
            isCurrentUser: row.isCurrentUser,
          })),
        );
      } catch {
        if (!cancelled) {
          setLeaderboard([]);
        }
      }
    };

    loadLeaderboard();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="rounded-2xl border border-cyan-100 bg-gradient-to-br from-cyan-50 via-white to-emerald-50 p-4 shadow-sm sm:p-6">
      <div className="flex flex-col items-start justify-between gap-3 sm:flex-row">
        <div>
          <h2 className="text-lg font-black text-slate-800 sm:text-xl">
            TOEIC Milestone Roadmap
          </h2>
          <p className="mt-1 text-xs text-slate-600 sm:text-sm">
            Hệ thống tự điều phối bài luyện Listening và Reading theo cột mốc
            tăng điểm, kèm phần nền tảng khi cần.
          </p>
        </div>
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-right self-end sm:self-auto">
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
            Điểm dự phóng hiện tại
          </p>
          <p className="text-xl font-black text-emerald-700 sm:text-2xl">
            {projectedScore}
          </p>
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-3 sm:mt-5 sm:p-4">
        <div className="mb-2 flex items-center justify-between text-xs text-slate-600 sm:mb-3 sm:text-sm">
          <span>Bắt đầu: {profile.milestoneState.currentScore}</span>
          <span className="flex items-center gap-1 text-cyan-700 font-semibold">
            <Flag className="h-4 w-4" /> Mục tiêu:{" "}
            {profile.milestoneState.targetScore}
          </span>
        </div>
        <div className="pb-1 pt-7 sm:pt-8">
          <div className="flex items-center gap-1">
            {milestones.map((score, idx) => {
              const reached = idx <= reachedIndex;
              const isTarget = score === profile.milestoneState.targetScore;
              const isCurrent = score === currentMilestone;

              return (
                <div key={score} className="relative flex-1 min-w-0">
                  {hoveredMilestone === score && isCurrent && (
                    <div className="absolute -top-8 left-1/2 z-20 -translate-x-1/2 whitespace-nowrap rounded-lg bg-slate-800 px-2 py-1 text-[10px] font-semibold text-white shadow-lg sm:-top-9 sm:px-2.5 sm:py-1.5 sm:text-[11px]">
                      Đây là cột mốc hiện tại của bạn
                    </div>
                  )}
                  <div
                    onMouseEnter={() => setHoveredMilestone(score)}
                    onMouseLeave={() => setHoveredMilestone(null)}
                    className={`relative h-7 cursor-default border transition-all sm:h-8 ${reached
                        ? "border-cyan-400 bg-gradient-to-r from-sky-500 to-cyan-500"
                        : "border-slate-200 bg-slate-200"
                      }`}
                    style={{
                      clipPath:
                        idx === milestones.length - 1
                          ? "polygon(0 0, 100% 0, 100% 100%, 0 100%, 8% 50%)"
                          : "polygon(0 0, calc(100% - 10px) 0, 100% 50%, calc(100% - 10px) 100%, 0 100%, 8% 50%)",
                    }}
                  >
                    {isCurrent && (
                      <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 text-xs text-orange-500 sm:text-sm">
                        ▼
                      </div>
                    )}
                  </div>
                  <div className="mt-2 text-center">
                    <span
                      className={`inline-flex min-w-[30px] justify-center rounded-full px-1 py-0.5 text-[10px] font-bold sm:min-w-[34px] sm:px-1.5 sm:text-[11px] ${reached
                          ? "bg-cyan-100 text-cyan-700"
                          : "bg-slate-100 text-slate-500"
                        }`}
                    >
                      {score}
                    </span>
                    {isTarget && (
                      <p className="mt-0.5 text-[10px] font-bold uppercase text-rose-600">
                        Target
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <div className="flex flex-col gap-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="mb-2 flex items-center gap-2 text-slate-800">
              <BookOpenCheck className="h-4 w-4 text-indigo-600" />
              <h3 className="font-bold">Nền tảng cho người mất gốc</h3>
            </div>
            <p className="text-sm text-slate-600">
              Mặc định hệ thống khóa nhánh tăng tốc cho đến khi hoàn thành tối
              thiểu 2 chủ đề nền tảng. Bạn có thể bỏ qua nếu đã vững.
            </p>
            <div className="mt-3 space-y-2">
              {foundationTrack.map((item) => {
                const done = completedFoundation.includes(item.topic);
                return (
                  <div
                    key={item.topic}
                    className="rounded-xl border border-slate-200 p-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          {item.topic === "grammar" ? (
                            <Brain className="h-4 w-4 text-violet-600" />
                          ) : (
                            <BookMarked className="h-4 w-4 text-blue-600" />
                          )}
                          <p className="text-sm font-semibold text-slate-700">
                            {item.title}
                          </p>
                        </div>
                        <p className="mt-1 inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                          {item.badge}
                        </p>
                        <p className="text-xs text-slate-500">{item.hint}</p>
                      </div>
                      {done && (
                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-700">
                          Done
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => openFoundationTheory(item.topic, item.key)}
                      className="mt-2 cursor-pointer text-xs font-semibold text-cyan-700 hover:text-cyan-800"
                    >
                      Mở bài lý thuyết
                    </button>
                  </div>
                );
              })}
            </div>
            {!profile.milestoneState.foundationSkipped && (
              <button
                onClick={handleSkipFoundation}
                className="mt-3 cursor-pointer text-xs font-semibold text-slate-500 underline decoration-dotted underline-offset-2 hover:text-slate-700"
              >
                Bỏ qua phần nền tảng
              </button>
            )}
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Star className="w-4 h-4 text-purple-500" />
              Phân tích kỹ năng
            </h3>
            <div className="space-y-4">
              {toeicSkills.map((skill, idx) => {
                const value = radarData[idx] ?? 0;
                const icon =
                  skill.id === "listening" ? (
                    <Ear className="w-4 h-4" />
                  ) : (
                    <BookOpen className="w-4 h-4" />
                  );
                const barColor =
                  skill.id === "listening"
                    ? "from-cyan-500 to-sky-500"
                    : "from-emerald-500 to-teal-500";
                return (
                  <div
                    key={skill.id}
                    className="rounded-xl border border-slate-100 bg-slate-50 p-3"
                  >
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="flex items-center gap-2 font-semibold text-slate-700">
                        {icon}
                        {skill.label}
                      </span>
                      <span className="font-bold text-slate-700">
                        {value}/100
                      </span>
                    </div>
                    <div className="h-2.5 w-full rounded-full bg-slate-200">
                      <div
                        className={`h-2.5 rounded-full bg-gradient-to-r ${barColor}`}
                        style={{
                          width: `${Math.max(4, Math.min(100, value))}%`,
                        }}
                      />
                    </div>
                    <p className="mt-2 text-xs text-slate-500">
                      {value >= 75
                        ? "Đang ổn định, tập trung tăng tốc độ."
                        : value >= 55
                          ? "Mức trung bình, nên luyện đều mỗi ngày."
                          : "Cần ưu tiên luyện để tránh mất điểm phần này."}
                    </p>
                  </div>
                );
              })}
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2.5 bg-slate-50 rounded-xl text-center">
                  <p className="text-xs text-slate-400">Mạnh hơn</p>
                  <p className="font-bold text-emerald-600 text-sm">
                    {strongest}
                  </p>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-xl text-center">
                  <p className="text-xs text-slate-400">Cần ưu tiên</p>
                  <p className="font-bold text-orange-500 text-sm">
                    {weakest}
                  </p>
                </div>
              </div>

              {/* AI Feedback */}
              <div className="rounded-xl border border-indigo-100 bg-gradient-to-br from-indigo-50 to-purple-50 p-3.5">
                <div className="flex items-center gap-2 mb-1.5">
                  <Sparkles className="w-4 h-4 text-indigo-500" />
                  <span className="text-sm font-bold text-indigo-900">Nhận xét của Trợ lý ảo</span>
                </div>
                <p className="text-xs text-indigo-800/80 leading-relaxed text-justify">
                  {aiFeedback}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 h-full">
          <StudentLeaderboard />
        </div>
      </div>
    </section>
  );
}

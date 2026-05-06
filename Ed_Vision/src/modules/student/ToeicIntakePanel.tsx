import { useState, useRef } from "react";
import {
  ClipboardList,
  PenLine,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  Target,
  Award,
  AlertCircle,
} from "lucide-react";
import type { ToeicBand } from "./toeicIntake";
import {
  createToeicMilestoneState,
  mapToeicScoreToBand,
  saveToeicIntakeProfile,
} from "./toeicIntake";
import { generateDiagnosticTest, submitDiagnosticTest } from "../../services/api/certificateService";
import { buildAssetUrl } from "../../services/api/config";

function resolveMediaUrl(src?: string | null): string {
  if (!src) return "";
  if (/^https?:\/\//i.test(src)) return src;
  return buildAssetUrl(src);
}

// ─── Types ────────────────────────────────────────────────────────────────────

type Stage = "entry" | "exam-setup" | "exam" | "self-reported" | "score-result";

type Props = {
  onConfirmBand: (band: ToeicBand) => void;
};

type ExamQuestion = {
  id: string;
  text: string;
  choices: string[];
  optionKeys?: string[];
  audioUrl?: string;
  imageUrl?: string;
  correct?: number;
};

type ExamPart = {
  partNumber: number;
  skill: "listening" | "reading";
  label: string;
  instruction: string;
  passage?: string;
  questions: ExamQuestion[];
};

// ─── Exam Data ────────────────────────────────────────────────────────────────

const PARTS: ExamPart[] = [
  {
    partNumber: 1,
    skill: "listening",
    label: "Photographs",
    instruction:
      "Read the description of a photograph. Choose the statement that BEST describes what is in the photo.",
    questions: [
      {
        id: "q1",
        text: "In the photo, a woman is sitting at a desk with a laptop.",
        choices: [
          "The woman is standing near a window.",
          "The woman is working at a computer.",
          "The woman is reading a book.",
          "The woman is eating lunch.",
        ],
        correct: 1,
      },
      {
        id: "q2",
        text: "In the photo, two men are shaking hands in an office lobby.",
        choices: [
          "The men are having a meeting in a conference room.",
          "One man is signing a document.",
          "The men are greeting each other.",
          "The men are walking outside.",
        ],
        correct: 2,
      },
    ],
  },
  {
    partNumber: 2,
    skill: "listening",
    label: "Question-Response",
    instruction:
      "A question is shown. Choose the response that BEST answers the question.",
    questions: [
      {
        id: "q3",
        text: "When does the sales report need to be finished?",
        choices: [
          "In the conference room.",
          "By Friday afternoon.",
          "About twenty pages.",
          "The manager wrote it.",
        ],
        correct: 1,
      },
      {
        id: "q4",
        text: "Have you met the new department manager yet?",
        choices: [
          "Yes, she seems very experienced.",
          "The department is on the third floor.",
          "I manage the project team.",
          "She manages ten employees.",
        ],
        correct: 0,
      },
      {
        id: "q5",
        text: "Why was the client meeting postponed?",
        choices: [
          "In the main boardroom.",
          "For three hours.",
          "Because the client had an emergency.",
          "We have ten clients.",
        ],
        correct: 2,
      },
    ],
  },
  {
    partNumber: 3,
    skill: "listening",
    label: "Conversations",
    instruction:
      "Read the dialogue below, then answer the questions that follow.",
    passage:
      "M: I wanted to ask about the quarterly review scheduled for next week.\nW: Oh, I actually moved it to Thursday. I sent an email about it.\nM: I must have missed it. What time on Thursday?\nW: 2 PM in Meeting Room B. Don't forget to bring your project summary.",
    questions: [
      {
        id: "q6",
        text: "What is the main purpose of this conversation?",
        choices: [
          "To discuss a client proposal.",
          "To confirm the time of a meeting.",
          "To schedule a job interview.",
          "To review financial reports.",
        ],
        correct: 1,
      },
      {
        id: "q7",
        text: "What does the woman ask the man to bring?",
        choices: [
          "A business card.",
          "His project summary.",
          "A copy of the email.",
          "His quarterly budget.",
        ],
        correct: 1,
      },
    ],
  },
  {
    partNumber: 4,
    skill: "listening",
    label: "Short Talks",
    instruction:
      "Read the announcement below, then answer the questions that follow.",
    passage:
      "Attention all staff. The parking lot on the east side will be closed for maintenance from Monday to Wednesday next week. Please use the west parking area or public transport during this time. We apologize for any inconvenience and thank you for your cooperation.",
    questions: [
      {
        id: "q8",
        text: "What is the announcement about?",
        choices: [
          "A change in office hours.",
          "A parking lot closure.",
          "A new transportation policy.",
          "A staff training schedule.",
        ],
        correct: 1,
      },
      {
        id: "q9",
        text: "How long will the maintenance last?",
        choices: ["One day.", "Two days.", "Three days.", "One week."],
        correct: 2,
      },
    ],
  },
  {
    partNumber: 5,
    skill: "reading",
    label: "Incomplete Sentences",
    instruction: "Choose the word or phrase that BEST completes each sentence.",
    questions: [
      {
        id: "q10",
        text: "The manager asked all employees to ______ the safety training before the end of the month.",
        choices: ["completion", "complete", "completed", "completely"],
        correct: 1,
      },
      {
        id: "q11",
        text: "Despite the heavy rain, the outdoor event ______ as planned.",
        choices: ["proceeded", "proceeding", "proceed", "has been proceeded"],
        correct: 0,
      },
      {
        id: "q12",
        text: "The new software update will ______ available for download starting next Monday.",
        choices: ["be", "been", "being", "is"],
        correct: 0,
      },
      {
        id: "q13",
        text: "Mr. Kim, ______ has been with the company for over a decade, was promoted to senior director.",
        choices: ["who", "whose", "which", "whom"],
        correct: 0,
      },
    ],
  },
  {
    partNumber: 6,
    skill: "reading",
    label: "Text Completion",
    instruction:
      "Read the email below. Choose the word or phrase that BEST fits each blank.",
    passage:
      "Dear Mr. Thompson,\n\nThank you for attending our product demonstration last week. We [14] that you found the session informative.\n\nAs discussed, our team will prepare a customized proposal and [15] it to you by this Friday.\n\nWe look forward to the [16] of working together.\n\nBest regards,\nSarah Lee",
    questions: [
      {
        id: "q14",
        text: "Choose the correct word for blank [14]:",
        choices: ["hoping", "hope", "hoped", "to hope"],
        correct: 1,
      },
      {
        id: "q15",
        text: "Choose the correct word for blank [15]:",
        choices: ["send", "sent", "sending", "will send"],
        correct: 3,
      },
      {
        id: "q16",
        text: "Choose the correct word for blank [16]:",
        choices: ["possibility", "problem", "difficulty", "challenge"],
        correct: 0,
      },
    ],
  },
  {
    partNumber: 7,
    skill: "reading",
    label: "Reading Comprehension",
    instruction:
      "Read the notice below, then answer the questions that follow.",
    passage:
      "OFFICE RENOVATION NOTICE\n\nThe IT department will be relocated to the 4th floor beginning November 1st. During the transition period (October 28–31), IT support will only be available via email at it-support@company.com. Phone support will resume on November 1st.\n\nAll IT equipment requests must be submitted through the online portal during this period.\n\nThank you for your patience.",
    questions: [
      {
        id: "q17",
        text: "Where will the IT department be located after November 1st?",
        choices: [
          "The 3rd floor.",
          "The 4th floor.",
          "The 2nd floor.",
          "The 5th floor.",
        ],
        correct: 1,
      },
      {
        id: "q18",
        text: "How can employees reach IT support between October 28–31?",
        choices: [
          "By phone.",
          "In person at the IT office.",
          "Via email.",
          "Through the HR department.",
        ],
        correct: 2,
      },
    ],
  },
];

const LISTENING_QUESTION_IDS = new Set([
  "q1",
  "q2",
  "q3",
  "q4",
  "q5",
  "q6",
  "q7",
  "q8",
  "q9",
]);
const TARGET_PRESETS = [450, 550, 650, 750, 850, 950];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function calcScores(answers: Record<string, number>): {
  listening: number;
  reading: number;
  total: number;
} {
  let correctListening = 0;
  let correctReading = 0;

  for (const part of PARTS) {
    for (const q of part.questions) {
      const chosen = answers[q.id];
      if (chosen === q.correct) {
        if (LISTENING_QUESTION_IDS.has(q.id)) {
          correctListening++;
        } else {
          correctReading++;
        }
      }
    }
  }

  const listening = Math.round(50 + (correctListening / 9) * 445);
  const reading = Math.round(50 + (correctReading / 9) * 445);
  return { listening, reading, total: listening + reading };
}

function partProgress(partIndex: number): number {
  return Math.round(((partIndex + 1) / PARTS.length) * 100);
}

function isPartComplete(
  part: ExamPart,
  answers: Record<string, number>,
): boolean {
  return part.questions.every((q) => answers[q.id] !== undefined);
}

function bandLabel(band: ToeicBand): string {
  const map: Record<ToeicBand, string> = {
    "350-495": "Cơ bản",
    "500-599": "Trung cấp",
    "600-699": "Trung-Cao cấp",
    "700-799": "Cao cấp",
    "800+": "Thành thạo",
  };
  return map[band] ?? band;
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ToeicIntakePanel({ onConfirmBand }: Props) {
  const [stage, setStage] = useState<Stage>("entry");

  // Exam state
  const [examPart, setExamPart] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [currentExamParts, setCurrentExamParts] = useState<ExamPart[]>(PARTS);
  const [examScores, setExamScores] = useState<{
    listening: number;
    reading: number;
    total: number;
  } | null>(null);

  // Exam Setup state
  const [selectedExamBand, setSelectedExamBand] = useState<number | null>(null);
  const [showExamWarning, setShowExamWarning] = useState(false);
  const [examError, setExamError] = useState<string | null>(null);

  const [isGenerating, setIsGenerating] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function getQuestionCount(band: number) {
    if (band <= 100) return 15;
    if (band <= 200) return 20;
    if (band <= 300) return 25;
    if (band <= 400) return 30;
    return 40;
  }

  async function startExam(band: number) {
    setIsGenerating(true);
    setLoadingMessage("Đang tạo bộ đề khảo sát...");
    setExamError(null);
    try {
      // Step 1: Fetch questions from API
      const questions = await generateDiagnosticTest(band);
      console.log('Diagnostic API returned:', questions);
      
      setLoadingMessage("Đang sắp xếp câu hỏi...");

      // Sort questions by part then by item_order for correct sequence
      const sorted = [...questions].sort((a, b) => {
        if (a.part !== b.part) return (a.part ?? 99) - (b.part ?? 99);
        return (a.item_order ?? 0) - (b.item_order ?? 0);
      });

      const newParts: ExamPart[] = [];
      const grouped: Record<number, typeof sorted> = {};
      for (const q of sorted) {
        const p = q.part ?? 0;
        if (!grouped[p]) grouped[p] = [];
        grouped[p].push(q);
      }
      
      for (const partNumStr of Object.keys(grouped).sort((a, b) => Number(a) - Number(b))) {
        const partNum = Number(partNumStr);
        const qArr = grouped[partNum];
        newParts.push({
          partNumber: partNum,
          skill: qArr[0].skill_area as "listening" | "reading",
          label: `Part ${partNum}`,
          instruction: `Vui lòng chọn đáp án đúng nhất cho các câu hỏi Part ${partNum}.`,
          passage: qArr[0].reading_passage || undefined,
          questions: qArr.map(q => ({
            id: String(q.id),
            text: q.stem,
            choices: q.options.map(o => o.option_text),
            optionKeys: q.options.map(o => o.option_key),
            audioUrl: q.media_audio_url || undefined,
            imageUrl: q.media_image_url || undefined,
          }))
        });
      }

      // Step 2: Preload all images and audio, WAIT until done
      setLoadingMessage("Đang tải hình ảnh và audio...");

      const preloadPromises: Promise<void>[] = [];
      let loadedCount = 0;
      let totalMedia = 0;

      // Count total media
      for (const part of newParts) {
        for (const q of part.questions) {
          if (q.imageUrl) totalMedia++;
          if (q.audioUrl) totalMedia++;
        }
      }

      const updateProgress = () => {
        loadedCount++;
        if (totalMedia > 0) {
          setLoadingMessage(`Đang tải media... (${loadedCount}/${totalMedia})`);
        }
      };

      for (const part of newParts) {
        for (const q of part.questions) {
          if (q.imageUrl) {
            const src = resolveMediaUrl(q.imageUrl);
            preloadPromises.push(
              new Promise<void>((resolve) => {
                const img = new Image();
                const done = () => { updateProgress(); resolve(); };
                img.onload = done;
                img.onerror = done;
                img.src = src;
                // Fallback in case events never fire
                setTimeout(done, 15000);
              })
            );
          }
          if (q.audioUrl) {
            const src = resolveMediaUrl(q.audioUrl);
            // Use fetch to ensure file is downloaded & put into HTTP cache reliably.
            // `canplaythrough` on a detached <audio> is unreliable in Chrome.
            preloadPromises.push(
              (async () => {
                try {
                  const res = await fetch(src, { credentials: 'omit' });
                  // Consume body so it's fully cached
                  await res.blob();
                } catch {
                  /* ignore network errors; UI has its own fallback */
                } finally {
                  updateProgress();
                }
              })()
            );
          }
        }
      }

      if (preloadPromises.length > 0) {
        // Wait for all media or timeout after 30s max
        await Promise.race([
          Promise.all(preloadPromises),
          new Promise<void>((resolve) => setTimeout(resolve, 30000)),
        ]);
      }

      setLoadingMessage("Sẵn sàng!");

      setCurrentExamParts(newParts);
      setExamPart(0);
      setAnswers({});
      setStage("exam");
      setShowExamWarning(false);
    } catch (e) {
      console.error(e);
      setExamError("Không thể tạo bài kiểm tra, có thể kho dữ liệu chưa đủ câu hỏi cho mốc điểm này.");
    } finally {
      setIsGenerating(false);
      setLoadingMessage("");
    }
  }

  // Self-reported state
  const [currentScore, setCurrentScore] = useState("");
  const [selfTargetScoreStr, setSelfTargetScoreStr] = useState("");
  const [selfError, setSelfError] = useState("");

  // Score-result target (shared by both exam and self-reported paths)
  const [targetScore, setTargetScore] = useState<number | null>(null);
  const [targetError, setTargetError] = useState("");

  // ── Exam handlers ────────────────────────────────────────────────────────────

  function handleSelectAnswer(questionId: string, choiceIndex: number) {
    setAnswers((prev) => ({ ...prev, [questionId]: choiceIndex }));
  }

  const examTopRef = useRef<HTMLDivElement>(null);

  function scrollToExamTop() {
    examTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleNextPart() {
    if (examPart < currentExamParts.length - 1) {
      setExamPart((p) => p + 1);
      setTimeout(scrollToExamTop, 50);
    } else {
      submitExam();
    }
  }

  function handlePrevPart() {
    if (examPart > 0) {
      setExamPart((p) => p - 1);
      setTimeout(scrollToExamTop, 50);
    }
  }

  async function submitExam() {
    setIsSubmitting(true);
    try {
      const submitAnswers: Record<string, string> = {};
      const qIds: number[] = [];

      for (const part of currentExamParts) {
        for (const q of part.questions) {
          qIds.push(Number(q.id));
          const ansIndex = answers[q.id];
          if (typeof ansIndex === 'number' && Array.isArray(q.optionKeys)) {
            const key = q.optionKeys[ansIndex];
            if (typeof key === 'string') {
              submitAnswers[q.id] = key;
            }
          }
        }
      }

      const result = await submitDiagnosticTest(qIds, submitAnswers);
      const scores = { 
        listening: Math.round(result.estimated_score / 2), 
        reading: Math.round(result.estimated_score / 2), 
        total: result.estimated_score 
      };

      setExamScores(scores);

      const band = mapToeicScoreToBand(scores.total);
      const milestoneState = createToeicMilestoneState(scores.total, null);
      saveToeicIntakeProfile({
        mode: "estimated",
        recommendedBand: band,
        currentScore: scores.total,
        targetScore: null,
        estimatedListening: scores.listening,
        estimatedReading: scores.reading,
        milestoneState,
        updatedAt: new Date().toISOString(),
      });

      setTargetScore(null);
      setTargetError("");
      setStage("score-result");
    } catch (e) {
      console.error(e);
      setExamError("Lỗi khi nộp bài khảo sát. Vui lòng thử lại.");
    } finally {
      setIsSubmitting(false);
    }
  }

  // ── Self-reported handlers ────────────────────────────────────────────────────

  function handleSelfReportedSubmit() {
    setSelfError("");
    const current = parseInt(currentScore, 10);

    if (!currentScore || isNaN(current) || current < 10 || current > 990 || current % 5 !== 0) {
      setSelfError("Vui lòng nhập điểm hiện tại hợp lệ (10 – 990, tận cùng là 0 hoặc 5).");
      return;
    }
    
    const target = parseInt(selfTargetScoreStr, 10);
    if (!selfTargetScoreStr || isNaN(target) || target < 100 || target > 990 || target % 5 !== 0) {
      setSelfError("Vui lòng nhập điểm mục tiêu hợp lệ (100 – 990, tận cùng là 0 hoặc 5).");
      return;
    }
    
    if (target <= current) {
      setSelfError("Điểm mục tiêu phải cao hơn điểm hiện tại.");
      return;
    }
    
    if (target - current > 200) {
      setSelfError("Mục tiêu quá cao! Để đạt hiệu quả, bạn chỉ nên đặt mục tiêu tăng tối đa 200 điểm so với hiện tại.");
      return;
    }

    const band = mapToeicScoreToBand(current);
    const milestoneState = createToeicMilestoneState(current, target);
    saveToeicIntakeProfile({
      mode: "self-reported",
      recommendedBand: band,
      currentScore: current,
      targetScore: target,
      estimatedListening: null,
      estimatedReading: null,
      milestoneState,
      updatedAt: new Date().toISOString(),
    });

    onConfirmBand(band);
  }

  // ── Score-result confirm ───────────────────────────────────────────────────

  function confirmTarget() {
    setTargetError("");
    if (!targetScore) {
      setTargetError("Vui lòng chọn điểm mục tiêu.");
      return;
    }
    if (!examScores) return;
    if (targetScore <= examScores.total) {
      setTargetError("Điểm mục tiêu phải cao hơn điểm hiện tại của bạn.");
      return;
    }

    const band = mapToeicScoreToBand(examScores.total);
    const milestoneState = createToeicMilestoneState(
      examScores.total,
      targetScore,
    );
    saveToeicIntakeProfile({
      mode: "estimated",
      recommendedBand: band,
      currentScore: examScores.total,
      targetScore,
      estimatedListening: examScores.listening,
      estimatedReading: examScores.reading,
      milestoneState,
      updatedAt: new Date().toISOString(),
    });

    onConfirmBand(band);
  }

  // ── Renders ───────────────────────────────────────────────────────────────────

  if (stage === "entry") {
    return (
      <div className="w-full max-w-5xl mx-auto">
        {/* Section label */}
        <div className="flex items-center gap-3 mb-5">
          <div
            className="rounded-full"
            style={{
              width: "3px",
              height: "22px",
              background: "linear-gradient(180deg, #4338ca, #d97706)",
            }}
          />
          <p
            className="font-bold uppercase tracking-widest"
            style={{ fontSize: "11px", color: "#6366f1" }}
          >
            Bước 1 — Chọn cách xác định trình độ
          </p>
        </div>

        {/* Option cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Take the test */}
          <button
            onClick={() => setStage("exam-setup")}
            className="group text-left rounded-2xl transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
            style={{
              background: "#ffffff",
              border: "1.5px solid #e0e7ff",
              padding: "28px",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = "#6366f1";
              (e.currentTarget as HTMLElement).style.boxShadow =
                "0 8px 30px rgba(99,102,241,0.12)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = "#e0e7ff";
              (e.currentTarget as HTMLElement).style.boxShadow = "none";
            }}
          >
            {/* Icon */}
            <div
              className="flex items-center justify-center rounded-xl mb-5"
              style={{
                width: "44px",
                height: "44px",
                background: "#eef2ff",
              }}
            >
              <ClipboardList
                className="transition-colors group-hover:text-indigo-700"
                style={{ width: "20px", height: "20px", color: "#4338ca" }}
              />
            </div>

            {/* Badge */}
            <span
              className="inline-block rounded-full mb-3"
              style={{
                fontSize: "10px",
                fontWeight: 700,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                padding: "3px 10px",
                background: "#eef2ff",
                color: "#4338ca",
              }}
            >
              Chưa có điểm TOEIC
            </span>

            <h2
              className="font-bold mb-2"
              style={{ fontSize: "17px", color: "#1e1b4b" }}
            >
              Làm bài kiểm tra đầu vào
            </h2>
            <p style={{ fontSize: "13px", color: "#64748b", lineHeight: 1.6 }}>
              18 câu hỏi · 7 phần · Listening & Reading — hệ thống tự tính điểm
              ước lượng sau khi hoàn thành.
            </p>

            <div
              className="flex items-center gap-1 mt-5 font-semibold"
              style={{ fontSize: "12px", color: "#4338ca" }}
            >
              <span>Bắt đầu kiểm tra</span>
              <ChevronRight style={{ width: "14px", height: "14px" }} />
            </div>
          </button>

          {/* Self-reported */}
          <button
            onClick={() => setStage("self-reported")}
            className="group text-left rounded-2xl transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
            style={{
              background: "#ffffff",
              border: "1.5px solid #fef3c7",
              padding: "28px",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = "#f59e0b";
              (e.currentTarget as HTMLElement).style.boxShadow =
                "0 8px 30px rgba(245,158,11,0.12)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = "#fef3c7";
              (e.currentTarget as HTMLElement).style.boxShadow = "none";
            }}
          >
            {/* Icon */}
            <div
              className="flex items-center justify-center rounded-xl mb-5"
              style={{
                width: "44px",
                height: "44px",
                background: "#fffbeb",
              }}
            >
              <PenLine
                className="transition-colors group-hover:text-amber-600"
                style={{ width: "20px", height: "20px", color: "#d97706" }}
              />
            </div>

            {/* Badge */}
            <span
              className="inline-block rounded-full mb-3"
              style={{
                fontSize: "10px",
                fontWeight: 700,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                padding: "3px 10px",
                background: "#fffbeb",
                color: "#b45309",
              }}
            >
              Đã có điểm TOEIC
            </span>

            <h2
              className="font-bold mb-2"
              style={{ fontSize: "17px", color: "#1e1b4b" }}
            >
              Nhập điểm hiện tại & mục tiêu
            </h2>
            <p style={{ fontSize: "13px", color: "#64748b", lineHeight: 1.6 }}>
              Biết điểm TOEIC của mình rồi? Nhập trực tiếp để hệ thống tạo lộ
              trình ngay lập tức.
            </p>

            <div
              className="flex items-center gap-1 mt-5 font-semibold"
              style={{ fontSize: "12px", color: "#d97706" }}
            >
              <span>Nhập điểm ngay</span>
              <ChevronRight style={{ width: "14px", height: "14px" }} />
            </div>
          </button>
        </div>
      </div>
    );
  }

  if (stage === "self-reported") {
    const currentNum = parseInt(currentScore, 10);
    const validCurrent =
      !isNaN(currentNum) && currentNum >= 10 && currentNum <= 990;
    const scorePercent = validCurrent ? Math.round((currentNum / 990) * 100) : 0;

    const targetBandInfo: Record<number, { label: string; level: string; color: string; bg: string }> = {
      450: { label: 'Sơ cấp', level: 'A2', color: '#d97706', bg: '#fffbeb' },
      550: { label: 'Trung cấp', level: 'B1', color: '#0284c7', bg: '#f0f9ff' },
      650: { label: 'Trung-Cao', level: 'B1+', color: '#4338ca', bg: '#eef2ff' },
      750: { label: 'Cao cấp', level: 'B2', color: '#7c3aed', bg: '#f5f3ff' },
      850: { label: 'Thành thạo', level: 'C1', color: '#db2777', bg: '#fdf2f8' },
      950: { label: 'Xuất sắc', level: 'C1+', color: '#dc2626', bg: '#fef2f2' },
    };

    return (
      <div className="w-full max-w-5xl mx-auto">
        {/* Back */}
        <button
          onClick={() => setStage("entry")}
          className="flex items-center gap-1.5 text-sm font-medium mb-6 transition-colors group"
          style={{ color: "#6366f1" }}
        >
          <ChevronLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
          Quay lại
        </button>

        <div
          className="rounded-3xl overflow-hidden"
          style={{
            background: "linear-gradient(145deg, #ffffff 0%, #f8faff 100%)",
            border: "1px solid rgba(99,102,241,0.12)",
            boxShadow: "0 8px 40px rgba(99,102,241,0.08), 0 1px 3px rgba(0,0,0,0.04)",
          }}
        >
          {/* Header */}
          <div
            style={{
              background: "linear-gradient(135deg, #1e1b4b 0%, #312e81 40%, #3730a3 100%)",
              padding: "32px 36px 28px",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <div style={{ position: "absolute", top: "-30px", right: "-30px", width: "120px", height: "120px", borderRadius: "50%", background: "rgba(99,102,241,0.15)" }} />
            <div style={{ position: "absolute", bottom: "-20px", right: "60px", width: "80px", height: "80px", borderRadius: "50%", background: "rgba(251,191,36,0.1)" }} />
            <div className="relative flex items-center gap-3 mb-2">
              <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "linear-gradient(135deg, rgba(251,191,36,0.2), rgba(251,191,36,0.05))", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid rgba(251,191,36,0.3)" }}>
                <PenLine style={{ width: "16px", height: "16px", color: "#fbbf24" }} />
              </div>
              <p style={{ fontSize: "10px", color: "#818cf8", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" }}>Xác định trình độ</p>
            </div>
            <h2 className="relative font-bold" style={{ fontSize: "24px", color: "#ffffff", lineHeight: 1.3 }}>
              Nhập điểm TOEIC của bạn
            </h2>
            <p className="relative" style={{ fontSize: "13px", color: "#a5b4fc", marginTop: "6px" }}>
              Hệ thống sẽ phân tích và tạo lộ trình học tập cá nhân hóa phù hợp với trình độ hiện tại.
            </p>
          </div>
          <div style={{ height: "3px", background: "linear-gradient(90deg, #d97706, #fbbf24, #f59e0b)" }} />

          {/* Content */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-0">
            {/* Left — Gauge */}
            <div className="lg:col-span-2 flex flex-col items-center justify-center py-10 px-8" style={{ borderRight: "1px solid #eef2ff" }}>
              <div style={{ position: "relative", width: "180px", height: "180px" }}>
                <svg viewBox="0 0 180 180" style={{ width: "100%", height: "100%", transform: "rotate(-90deg)" }}>
                  <circle cx="90" cy="90" r="76" fill="none" stroke="#eef2ff" strokeWidth="10" />
                  <circle cx="90" cy="90" r="76" fill="none" stroke="url(#scoreGrad)" strokeWidth="10" strokeLinecap="round" strokeDasharray={`${scorePercent * 4.78} 478`} style={{ transition: "stroke-dasharray 0.8s ease" }} />
                  <defs>
                    <linearGradient id="scoreGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#4338ca" />
                      <stop offset="100%" stopColor="#818cf8" />
                    </linearGradient>
                  </defs>
                </svg>
                <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ fontSize: "36px", fontWeight: 900, color: validCurrent ? "#1e1b4b" : "#cbd5e1", lineHeight: 1 }}>
                    {validCurrent ? currentNum : "\u2014"}
                  </span>
                  <span style={{ fontSize: "11px", color: "#94a3b8", fontWeight: 600, marginTop: "4px" }}>/ 990 điểm</span>
                </div>
              </div>
              {validCurrent && (
                <div className="mt-5 flex flex-col items-center gap-2">
                  <div style={{ padding: "5px 16px", borderRadius: "20px", background: "linear-gradient(135deg, #312e81, #4338ca)", color: "#fff", fontSize: "11px", fontWeight: 700, letterSpacing: "0.05em", boxShadow: "0 2px 8px rgba(49,46,129,0.25)" }}>
                    {bandLabel(mapToeicScoreToBand(currentNum))}
                  </div>
                  <span style={{ fontSize: "11px", color: "#94a3b8" }}>Band {mapToeicScoreToBand(currentNum)}</span>
                </div>
              )}
              {!validCurrent && (
                <p style={{ fontSize: "12px", color: "#94a3b8", marginTop: "16px", textAlign: "center" }}>Nhập điểm hiện tại để xem phân tích</p>
              )}
            </div>

            {/* Right — Form */}
            <div className="lg:col-span-3 px-8 py-8 space-y-6">
              {/* Current score */}
              <div>
                <label className="flex items-center gap-2 mb-3">
                  <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "linear-gradient(135deg, #4338ca, #6366f1)" }} />
                  <span style={{ fontSize: "12px", fontWeight: 500, color: "#1e1b4b", textTransform: "uppercase", letterSpacing: "0.08em" }}>Điểm hiện tại</span>
                </label>
                <div style={{ position: "relative" }}>
                  <input
                    type="number"
                    min={10}
                    max={990}
                    step={5}
                    placeholder="Nhập điểm TOEIC (10 – 990)"
                    value={currentScore}
                    onChange={(e) => { setCurrentScore(e.target.value); setSelfError(""); }}
                    className="w-full"
                    style={{ padding: "14px 18px", fontSize: "18px", fontWeight: 500, color: "#1e1b4b", border: "2px solid #e0e7ff", borderRadius: "14px", outline: "none", background: "#fafaff", transition: "all 0.2s" }}
                    onFocus={(e) => { e.currentTarget.style.borderColor = "#6366f1"; e.currentTarget.style.boxShadow = "0 0 0 4px rgba(99,102,241,0.1)"; e.currentTarget.style.background = "#ffffff"; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = "#e0e7ff"; e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.background = "#fafaff"; }}
                  />
                  {validCurrent && (
                    <div style={{ position: "absolute", right: "14px", top: "50%", transform: "translateY(-50%)" }}>
                      <CheckCircle2 style={{ width: "16px", height: "16px", color: "#f59e0b" }} />
                    </div>
                  )}
                </div>
              </div>

              {/* Target score */}
              <div>
                <label className="flex items-center gap-2 mb-3">
                  <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "linear-gradient(135deg, #d97706, #f59e0b)" }} />
                  <span style={{ fontSize: "12px", fontWeight: 500, color: "#1e1b4b", textTransform: "uppercase", letterSpacing: "0.08em" }}>Điểm mục tiêu</span>
                </label>
                <div style={{ position: "relative" }}>
                  <input
                    type="number"
                    min={100}
                    max={990}
                    step={5}
                    placeholder="Nhập điểm mục tiêu (100 – 990)"
                    value={selfTargetScoreStr}
                    onChange={(e) => { setSelfTargetScoreStr(e.target.value); setSelfError(""); }}
                    className="w-full"
                    style={{ padding: "14px 18px", fontSize: "18px", fontWeight: 500, color: "#1e1b4b", border: "2px solid #e0e7ff", borderRadius: "14px", outline: "none", background: "#fafaff", transition: "all 0.2s" }}
                    onFocus={(e) => { e.currentTarget.style.borderColor = "#f59e0b"; e.currentTarget.style.boxShadow = "0 0 0 4px rgba(245,158,11,0.1)"; e.currentTarget.style.background = "#ffffff"; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = "#e0e7ff"; e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.background = "#fafaff"; }}
                  />
                  {selfTargetScoreStr && parseInt(selfTargetScoreStr, 10) >= 100 && parseInt(selfTargetScoreStr, 10) <= 990 && parseInt(selfTargetScoreStr, 10) % 5 === 0 && parseInt(selfTargetScoreStr, 10) > (parseInt(currentScore, 10) || 0) && (
                    <div style={{ position: "absolute", right: "14px", top: "50%", transform: "translateY(-50%)" }}>
                      <CheckCircle2 style={{ width: "16px", height: "16px", color: "#f59e0b" }} />
                    </div>
                  )}
                </div>
              </div>

              {selfError && (
                <div className="flex items-center gap-2 rounded-xl px-4 py-3" style={{ fontSize: "13px", color: "#dc2626", background: "#fff1f2", border: "1px solid #fecaca" }}>
                  <span style={{ fontSize: "16px" }}>⚠️</span>
                  {selfError}
                </div>
              )}

              <div className="text-xs text-slate-500 bg-slate-50 p-4 rounded-xl border border-slate-100 mt-2">
                <p className="font-semibold text-slate-700 mb-2 flex items-center gap-1.5"><span className="text-base">💡</span> Lưu ý quan trọng:</p>
                <ul className="list-disc pl-5 space-y-1.5 text-slate-500 leading-relaxed">
                  <li>Điểm mục tiêu phải nằm trong khoảng <strong>100 – 990</strong> và có tận cùng là <strong>0</strong> hoặc <strong>5</strong>.</li>
                  <li>Điểm mục tiêu phải <strong>cao hơn</strong> điểm hiện tại.</li>
                  <li>Để đảm bảo lộ trình học tập thực tế và hiệu quả, khoảng cách giữa điểm hiện tại và mục tiêu <strong>không được vượt quá 200 điểm</strong>.</li>
                </ul>
              </div>

              <button
                onClick={handleSelfReportedSubmit}
                className="w-full transition-all duration-200"
                style={{
                  padding: "16px", fontSize: "15px", fontWeight: 500, letterSpacing: "0.02em", borderRadius: "14px",
                  background: "linear-gradient(135deg, #312e81 0%, #4338ca 50%, #6366f1 100%)",
                  color: "#ffffff", border: "none",
                  boxShadow: "0 6px 20px rgba(67,56,202,0.3), inset 0 1px 0 rgba(255,255,255,0.1)",
                  cursor: "pointer",
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = "0 8px 28px rgba(67,56,202,0.4), inset 0 1px 0 rgba(255,255,255,0.15)"; (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = "0 6px 20px rgba(67,56,202,0.3), inset 0 1px 0 rgba(255,255,255,0.1)"; (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; }}
              >
                Tạo lộ trình học tập →
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (stage === "exam-setup") {
    return (
      <div className="w-full max-w-2xl mx-auto px-4 py-8">
        <button
          onClick={() => { setStage("entry"); setShowExamWarning(false); }}
          className="flex items-center gap-1.5 text-sm font-medium mb-6 transition-colors group"
          style={{ color: "#6366f1" }}
        >
          <ChevronLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
          Quay lại
        </button>

        <div className="bg-white rounded-3xl p-8 border shadow-sm" style={{ borderColor: "#e0e7ff" }}>
          <h2 className="text-2xl font-bold mb-2 text-slate-800">Chọn mốc điểm khảo sát</h2>
          <p className="text-slate-500 mb-8 text-sm">
            Hệ thống sẽ điều chỉnh số lượng câu hỏi và độ khó để phản ánh chính xác nhất năng lực ở mốc điểm bạn hướng tới.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 mb-8">
            {[100, 200, 300, 400, 500].map((band) => (
              <button
                key={band}
                disabled={isGenerating}
                onClick={() => {
                  setSelectedExamBand(band);
                  if (band >= 300) {
                    setShowExamWarning(true);
                  } else {
                    startExam(band);
                  }
                }}
                className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all hover:-translate-y-0.5 ${isGenerating ? 'opacity-50 cursor-not-allowed' : ''}`}
                style={{
                  borderColor: selectedExamBand === band ? "#6366f1" : "#eef2ff",
                  background: selectedExamBand === band ? "#eef2ff" : "#ffffff"
                }}
              >
                <span className="text-2xl font-black" style={{ color: selectedExamBand === band ? "#4338ca" : "#64748b" }}>
                  {band}
                </span>
                <span className="text-xs font-semibold mt-1" style={{ color: selectedExamBand === band ? "#6366f1" : "#94a3b8" }}>
                  {getQuestionCount(band)} câu hỏi
                </span>
              </button>
            ))}
          </div>

          {examError && (
            <div className="p-4 rounded-xl mb-6 flex gap-3 items-start" style={{ background: "#fef2f2", border: "1px solid #fecaca" }}>
              <div className="shrink-0 mt-0.5"><AlertCircle className="w-5 h-5 text-red-500" /></div>
              <p className="text-sm font-medium text-red-800">{examError}</p>
            </div>
          )}

          {isGenerating && (
            <div className="p-6 rounded-2xl mb-6 flex flex-col items-center gap-4" style={{ background: "linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%)", border: "1.5px solid #c7d2fe" }}>
              <div className="relative">
                <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ background: "#ffffff", boxShadow: "0 2px 12px rgba(99,102,241,0.15)" }}>
                  <svg className="w-7 h-7 animate-spin" style={{ color: "#6366f1" }} viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2.5" opacity="0.2"/>
                    <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
                  </svg>
                </div>
              </div>
              <div className="text-center">
                <p className="font-bold text-sm" style={{ color: "#312e81" }}>Đang chuẩn bị bài khảo sát</p>
                <p className="text-xs mt-1.5 font-medium" style={{ color: "#6366f1" }}>{loadingMessage}</p>
              </div>
              <div className="w-full max-w-xs rounded-full overflow-hidden" style={{ height: "4px", background: "#c7d2fe" }}>
                <div className="h-full rounded-full animate-pulse" style={{ width: "100%", background: "linear-gradient(90deg, #6366f1, #818cf8, #6366f1)", backgroundSize: "200% 100%", animation: "shimmer 1.5s ease-in-out infinite" }} />
              </div>
            </div>
          )}

          {showExamWarning && selectedExamBand && (
            <div className="p-5 rounded-2xl mb-6 flex gap-4 items-start" style={{ background: "#fffbeb", border: "1px solid #fde68a" }}>
              <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ background: "#fef3c7" }}>
                <span className="text-xl">⚠️</span>
              </div>
              <div>
                <h3 className="font-bold text-amber-900 mb-1">Thời gian làm bài kéo dài</h3>
                <p className="text-sm text-amber-800 leading-relaxed mb-4">
                  Bộ đề khảo sát cho mốc điểm <strong>{selectedExamBand}</strong> sẽ bao gồm <strong>{getQuestionCount(selectedExamBand)} câu hỏi</strong> và sẽ mất nhiều thời gian hơn để bạn hoàn thành. Bạn có chắc chắn muốn tiếp tục không?
                </p>
                <div className="flex gap-3">
                  <button 
                    onClick={() => setShowExamWarning(false)}
                    className="px-4 py-2 rounded-xl text-sm font-semibold transition-colors"
                    style={{ background: "#fff", color: "#b45309", border: "1px solid #fcd34d" }}
                  >
                    Từ chối
                  </button>
                  <button 
                    disabled={isGenerating}
                    onClick={() => startExam(selectedExamBand)}
                    className="px-4 py-2 rounded-xl text-sm font-semibold transition-colors text-white flex items-center gap-2 disabled:opacity-50"
                    style={{ background: "#d97706" }}
                  >
                    {isGenerating ? "Đang tạo đề..." : "Đồng ý tiếp tục"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (stage === "exam") {
    const part = currentExamParts[examPart];
    const isLastPart = examPart === currentExamParts.length - 1;
    const canAdvance = isPartComplete(part, answers);
    const progress = Math.round(((examPart + 1) / currentExamParts.length) * 100);

    return (
      <div ref={examTopRef} style={{ background: "#f8fafc", paddingBottom: "64px" }}>
        {/* Top bar */}
        <div
          className="sticky top-0 z-10"
          style={{
            background: "#ffffff",
            borderBottom: "1px solid #e0e7ff",
            boxShadow: "0 1px 8px rgba(99,102,241,0.06)",
          }}
        >
          <div className="max-w-2xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span
                  className="font-bold uppercase tracking-widest rounded-full"
                  style={{
                    fontSize: "10px",
                    padding: "4px 10px",
                    background:
                      part.skill === "listening" ? "#eef2ff" : "#fffbeb",
                    color: part.skill === "listening" ? "#4338ca" : "#d97706",
                  }}
                >
                  {part.skill === "listening" ? "Listening" : "Reading"}
                </span>
                <span
                  className="font-medium"
                  style={{ fontSize: "12px", color: "#94a3b8" }}
                >
                  Part {examPart + 1} / {currentExamParts.length}
                </span>
              </div>
              <span
                className="font-bold"
                style={{ fontSize: "12px", color: "#6366f1" }}
              >
                {progress}%
              </span>
            </div>

            {/* Progress bar */}
            <div
              className="w-full rounded-full overflow-hidden"
              style={{ height: "5px", background: "#e0e7ff" }}
            >
              <div
                className="rounded-full transition-all duration-500 ease-out"
                style={{
                  width: `${progress}%`,
                  height: "5px",
                  background:
                    part.skill === "listening"
                      ? "linear-gradient(90deg, #4338ca, #6366f1)"
                      : "linear-gradient(90deg, #d97706, #fbbf24)",
                }}
              />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-2xl mx-auto px-4 pt-6 space-y-4">
          {/* Part header */}
          <div
            className="rounded-2xl px-7 py-5"
            style={{
              background: "#ffffff",
              border: "1.5px solid #e0e7ff",
            }}
          >
            <div
              className="rounded-full mb-3"
              style={{
                width: "28px",
                height: "3px",
                background: "linear-gradient(90deg, #d97706, #fbbf24)",
              }}
            />
            <h2
              className="font-bold mb-1"
              style={{ fontSize: "18px", color: "#1e1b4b" }}
            >
              Part {part.partNumber} – {part.label}
            </h2>
            <p style={{ fontSize: "13px", color: "#64748b", lineHeight: 1.6 }}>
              {part.instruction}
            </p>
          </div>

          {/* Passage (for Parts 3, 4, 6, 7) */}
          {part.passage && (
            <div
              className="rounded-2xl px-7 py-5"
              style={{
                background: "linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)",
                border: "1px solid #312e81",
              }}
            >
              <p
                className="uppercase tracking-widest font-bold mb-3"
                style={{ fontSize: "10px", color: "#fbbf24" }}
              >
                Passage
              </p>
              <div
                className="whitespace-pre-line leading-relaxed"
                style={{ fontSize: "13px", color: "#c7d2fe", fontWeight: 500 }}
              >
                {part.passage}
              </div>
            </div>
          )}

          {/* Questions */}
          {part.questions.map((q, qi) => {
            const selected = answers[q.id];
            return (
              <div
                key={q.id}
                className="rounded-2xl px-7 py-5"
                style={{
                  background: "#ffffff",
                  border: "1.5px solid #e0e7ff",
                }}
              >
                <p
                  className="uppercase tracking-widest font-bold mb-2.5"
                  style={{ fontSize: "10px", color: "#94a3b8" }}
                >
                  Câu {qi + 1}
                </p>
                <p
                  className="font-semibold mb-4 leading-relaxed"
                  style={{ fontSize: "14px", color: "#1e1b4b" }}
                >
                  {q.text}
                </p>

                {q.imageUrl ? (
                  <div className="mb-5 flex justify-center relative">
                    <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-slate-50 border border-slate-200 animate-pulse img-placeholder">
                      <div className="flex flex-col items-center gap-2 text-slate-400">
                        <svg className="w-8 h-8 animate-spin" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" opacity="0.3"/><path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
                        <span className="text-xs">Đang tải hình...</span>
                      </div>
                    </div>
                    <img
                      src={resolveMediaUrl(q.imageUrl)}
                      alt="Question illustration"
                      loading="eager"
                      decoding="async"
                      className="rounded-lg shadow-sm max-w-full h-auto object-contain border border-slate-200 relative z-[1] bg-white"
                      style={{ maxHeight: '300px' }}
                      onLoad={(e) => {
                        const placeholder = (e.target as HTMLElement).parentElement?.querySelector('.img-placeholder');
                        if (placeholder) (placeholder as HTMLElement).style.display = 'none';
                      }}
                      onError={(e) => {
                        const placeholder = (e.target as HTMLElement).parentElement?.querySelector('.img-placeholder');
                        if (placeholder) (placeholder as HTMLElement).style.display = 'none';
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  </div>
                ) : part.partNumber === 1 && (
                  <div className="mb-5 flex items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 py-8 text-sm text-slate-500">
                    <div className="flex flex-col items-center gap-2">
                      <AlertCircle className="h-5 w-5 text-slate-400" />
                      <span>Không tìm thấy hình ảnh cho câu hỏi này</span>
                    </div>
                  </div>
                )}
                
                {q.audioUrl ? (
                  <div className="mb-4 relative">
                    <div className="audio-loading absolute inset-0 flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-400">
                      <svg className="w-4 h-4 animate-spin shrink-0" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" opacity="0.3"/><path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
                      <span>Đang tải audio...</span>
                    </div>
                    <audio 
                      controls 
                      preload="auto"
                      className="w-full h-10 relative z-[1]"
                      src={resolveMediaUrl(q.audioUrl)}
                      onCanPlay={(e) => {
                        const loading = (e.target as HTMLElement).parentElement?.querySelector('.audio-loading');
                        if (loading) (loading as HTMLElement).style.display = 'none';
                      }}
                      onLoadedData={(e) => {
                        const loading = (e.target as HTMLElement).parentElement?.querySelector('.audio-loading');
                        if (loading) (loading as HTMLElement).style.display = 'none';
                      }}
                      onError={(e) => {
                        const loading = (e.target as HTMLElement).parentElement?.querySelector('.audio-loading');
                        if (loading) (loading as HTMLElement).innerHTML = '<div class="flex items-center gap-2 text-amber-600"><svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg><span>Không thể tải file nghe</span></div>';
                      }}
                    />
                  </div>
                ) : part.skill === "listening" && (
                  <div className="mb-4 flex items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 py-3 text-sm text-slate-500">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-5 w-5 text-slate-400" />
                      <span>Chưa có file nghe cho câu hỏi này</span>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  {q.choices.map((choice, ci) => {
                    const isSelected = selected === ci;
                    return (
                      <button
                        key={ci}
                        onClick={() => handleSelectAnswer(q.id, ci)}
                        className="w-full text-left rounded-xl flex items-center gap-3 transition-all duration-150"
                        style={{
                          padding: "11px 16px",
                          fontSize: "13px",
                          fontWeight: 500,
                          background: isSelected ? "#312e81" : "#ffffff",
                          color: isSelected ? "#ffffff" : "#334155",
                          border: isSelected
                            ? "1.5px solid #312e81"
                            : "1.5px solid #e2e8f0",
                          boxShadow: isSelected
                            ? "0 2px 10px rgba(49,46,129,0.2)"
                            : "none",
                        }}
                        onMouseEnter={(e) => {
                          if (!isSelected) {
                            (e.currentTarget as HTMLElement).style.borderColor =
                              "#6366f1";
                            (e.currentTarget as HTMLElement).style.background =
                              "#eef2ff";
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isSelected) {
                            (e.currentTarget as HTMLElement).style.borderColor =
                              "#e2e8f0";
                            (e.currentTarget as HTMLElement).style.background =
                              "#ffffff";
                          }
                        }}
                      >
                        <span
                          className="shrink-0 rounded-full flex items-center justify-center font-bold"
                          style={{
                            width: "24px",
                            height: "24px",
                            fontSize: "11px",
                            background: isSelected
                              ? "rgba(255,255,255,0.2)"
                              : "#f1f5f9",
                            color: isSelected ? "#ffffff" : "#94a3b8",
                            border: isSelected
                              ? "1px solid rgba(255,255,255,0.3)"
                              : "1px solid #e2e8f0",
                          }}
                        >
                          {String.fromCharCode(65 + ci)}
                        </span>
                        {choice}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* Navigation */}
          <div className="flex items-center justify-between pt-1 pb-8">
            <button
              onClick={handlePrevPart}
              disabled={examPart === 0}
              className="flex items-center gap-1.5 font-semibold transition-colors"
              style={{
                fontSize: "13px",
                color: examPart === 0 ? "transparent" : "#6366f1",
                pointerEvents: examPart === 0 ? "none" : "auto",
              }}
            >
              <ChevronLeft style={{ width: "15px", height: "15px" }} />
              Phần trước
            </button>

            <button
              onClick={handleNextPart}
              disabled={!canAdvance}
              className="flex items-center gap-2 rounded-xl font-bold transition-all duration-150"
              style={{
                padding: "11px 24px",
                fontSize: "13px",
                background: (!canAdvance || isSubmitting)
                  ? "#f1f5f9"
                  : isLastPart
                    ? "linear-gradient(135deg, #d97706, #f59e0b)"
                    : "linear-gradient(135deg, #312e81, #4338ca)",
                color: (!canAdvance || isSubmitting) ? "#cbd5e1" : "#ffffff",
                cursor: (!canAdvance || isSubmitting) ? "not-allowed" : "pointer",
                boxShadow:
                  canAdvance && !isLastPart
                    ? "0 4px 14px rgba(67,56,202,0.3)"
                    : canAdvance && isLastPart
                      ? "0 4px 14px rgba(217,119,6,0.3)"
                      : "none",
              }}
            >
              {isLastPart ? (
                <>
                  <CheckCircle2 style={{ width: "15px", height: "15px" }} />
                  {isSubmitting ? "Đang nộp..." : "Nộp bài"}
                </>
              ) : (
                <>
                  Phần tiếp theo
                  <ChevronRight style={{ width: "15px", height: "15px" }} />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (stage === "score-result" && examScores) {
    const band = mapToeicScoreToBand(examScores.total);
    const listeningPct = Math.round((examScores.listening / 495) * 100);
    const readingPct = Math.round((examScores.reading / 495) * 100);
    const totalPct = Math.round((examScores.total / 990) * 100);

    return (
      <div className="w-full max-w-5xl mx-auto">
        {/* Section label */}
        <div className="flex items-center gap-3 mb-5">
          <div
            className="rounded-full"
            style={{
              width: "3px",
              height: "22px",
              background: "linear-gradient(180deg, #4338ca, #d97706)",
            }}
          />
          <p
            className="font-bold uppercase tracking-widest"
            style={{ fontSize: "11px", color: "#6366f1" }}
          >
            Bước 2 — Kết quả & Chọn mục tiêu
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          {/* Score card */}
          <div
            className="lg:col-span-2 rounded-2xl overflow-hidden"
            style={{
              border: "1.5px solid #312e81",
              boxShadow: "0 4px 24px rgba(49,46,129,0.12)",
            }}
          >
            <div
              className="px-7 pt-7 pb-6"
              style={{
                background: "linear-gradient(155deg, #1e1b4b 0%, #312e81 100%)",
              }}
            >
              <div
                className="rounded-full mb-4"
                style={{
                  width: "32px",
                  height: "3px",
                  background: "linear-gradient(90deg, #d97706, #fbbf24)",
                }}
              />
              <p
                className="uppercase tracking-widest font-bold mb-2"
                style={{ fontSize: "10px", color: "#818cf8" }}
              >
                Kết quả kiểm tra
              </p>
              <div className="flex items-end gap-2 mb-1">
                <span
                  className="font-bold leading-none"
                  style={{ fontSize: "64px", color: "#ffffff" }}
                >
                  {examScores.total}
                </span>
                <span
                  className="font-medium pb-2"
                  style={{ fontSize: "14px", color: "#818cf8" }}
                >
                  / 990
                </span>
              </div>
              <div className="flex items-center gap-1.5 mb-5">
                <Award
                  style={{ width: "14px", height: "14px", color: "#fbbf24" }}
                />
                <span
                  className="font-bold uppercase tracking-wide"
                  style={{ fontSize: "11px", color: "#fbbf24" }}
                >
                  {bandLabel(band)}
                </span>
                <span style={{ fontSize: "11px", color: "#6366f1" }}>
                  · {band}
                </span>
              </div>

              {/* Score breakdown */}
              <div className="space-y-3">
                <div>
                  <div
                    className="flex justify-between mb-1.5"
                    style={{ fontSize: "12px" }}
                  >
                    <span style={{ color: "#a5b4fc", fontWeight: 500 }}>
                      Listening
                    </span>
                    <span style={{ color: "#ffffff", fontWeight: 700 }}>
                      {examScores.listening}
                      <span style={{ color: "#6366f1" }}>/495</span>
                    </span>
                  </div>
                  <div
                    className="w-full rounded-full overflow-hidden"
                    style={{
                      height: "5px",
                      background: "rgba(255,255,255,0.1)",
                    }}
                  >
                    <div
                      className="rounded-full transition-all duration-700"
                      style={{
                        width: `${listeningPct}%`,
                        height: "5px",
                        background: "linear-gradient(90deg, #818cf8, #6366f1)",
                      }}
                    />
                  </div>
                </div>
                <div>
                  <div
                    className="flex justify-between mb-1.5"
                    style={{ fontSize: "12px" }}
                  >
                    <span style={{ color: "#a5b4fc", fontWeight: 500 }}>
                      Reading
                    </span>
                    <span style={{ color: "#ffffff", fontWeight: 700 }}>
                      {examScores.reading}
                      <span style={{ color: "#6366f1" }}>/495</span>
                    </span>
                  </div>
                  <div
                    className="w-full rounded-full overflow-hidden"
                    style={{
                      height: "5px",
                      background: "rgba(255,255,255,0.1)",
                    }}
                  >
                    <div
                      className="rounded-full transition-all duration-700"
                      style={{
                        width: `${readingPct}%`,
                        height: "5px",
                        background: "linear-gradient(90deg, #fbbf24, #f59e0b)",
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Total bar */}
            <div
              style={{ height: "4px", background: "#e0e7ff" }}
              className="overflow-hidden"
            >
              <div
                className="transition-all duration-700"
                style={{
                  width: `${totalPct}%`,
                  height: "4px",
                  background: "linear-gradient(90deg, #d97706, #fbbf24)",
                }}
              />
            </div>

            {/* Retake */}
            <div className="px-7 py-4" style={{ background: "#fafaff" }}>
              <button
                onClick={() => {
                  setExamPart(0);
                  setAnswers({});
                  setStage("exam");
                }}
                className="flex items-center gap-1 font-semibold transition-colors"
                style={{ fontSize: "12px", color: "#6366f1" }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.color = "#4338ca";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.color = "#6366f1";
                }}
              >
                <ChevronLeft style={{ width: "13px", height: "13px" }} />
                Làm lại bài kiểm tra
              </button>
            </div>
          </div>

          {/* Target selection card */}
          <div
            className="lg:col-span-3 rounded-2xl overflow-hidden"
            style={{
              background: "#ffffff",
              border: "1.5px solid #e0e7ff",
              boxShadow: "0 4px 24px rgba(99,102,241,0.07)",
            }}
          >
            <div className="px-7 pt-7 pb-6">
              <div className="flex items-center gap-2 mb-5">
                <Target
                  style={{ width: "16px", height: "16px", color: "#4338ca" }}
                />
                <h3
                  className="font-bold uppercase tracking-wider"
                  style={{ fontSize: "12px", color: "#1e1b4b" }}
                >
                  Chọn mục tiêu của bạn
                </h3>
              </div>

              {/* Preset targets */}
              <div className="flex flex-wrap gap-2 mb-4">
                {TARGET_PRESETS.map((preset) => {
                  const disabled = preset <= examScores.total;
                  const selected = targetScore === preset;
                  return (
                    <button
                      key={preset}
                      disabled={disabled}
                      onClick={() => {
                        setTargetScore(preset);
                        setTargetError("");
                      }}
                      className="rounded-xl font-bold transition-all duration-150"
                      style={{
                        padding: "8px 18px",
                        fontSize: "14px",
                        cursor: disabled ? "not-allowed" : "pointer",
                        background: selected
                          ? "#312e81"
                          : disabled
                            ? "#f8fafc"
                            : "#ffffff",
                        color: selected
                          ? "#ffffff"
                          : disabled
                            ? "#cbd5e1"
                            : "#1e1b4b",
                        border: selected
                          ? "1.5px solid #312e81"
                          : disabled
                            ? "1.5px solid #f1f5f9"
                            : "1.5px solid #e0e7ff",
                        boxShadow: selected
                          ? "0 2px 10px rgba(49,46,129,0.25)"
                          : "none",
                      }}
                    >
                      {preset}
                    </button>
                  );
                })}
              </div>

              {/* Custom input */}
              <input
                type="number"
                min={examScores.total + 5}
                max={990}
                step={5}
                placeholder={`Hoặc nhập mục tiêu khác (trên ${examScores.total})`}
                value={
                  targetScore && !TARGET_PRESETS.includes(targetScore)
                    ? targetScore
                    : ""
                }
                onChange={(e) => {
                  const v = parseInt(e.target.value, 10);
                  if (!isNaN(v) && v > 0) {
                    setTargetScore(v);
                    setTargetError("");
                  }
                }}
                className="w-full rounded-xl transition mb-4"
                style={{
                  padding: "10px 16px",
                  fontSize: "13px",
                  border: "1.5px solid #e0e7ff",
                  color: "#1e1b4b",
                  outline: "none",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "#6366f1";
                  e.currentTarget.style.boxShadow =
                    "0 0 0 3px rgba(99,102,241,0.1)";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "#e0e7ff";
                  e.currentTarget.style.boxShadow = "none";
                }}
              />

              {targetError && (
                <p
                  className="rounded-xl px-4 py-3 mb-4 font-medium"
                  style={{
                    fontSize: "13px",
                    color: "#dc2626",
                    background: "#fff1f2",
                    border: "1px solid #fecaca",
                  }}
                >
                  {targetError}
                </p>
              )}

              <button
                onClick={confirmTarget}
                className="w-full rounded-xl font-bold tracking-wide transition-all duration-150"
                style={{
                  padding: "14px",
                  fontSize: "14px",
                  background:
                    "linear-gradient(135deg, #312e81 0%, #4338ca 100%)",
                  color: "#ffffff",
                  border: "none",
                  boxShadow: "0 4px 14px rgba(67,56,202,0.3)",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.boxShadow =
                    "0 6px 20px rgba(67,56,202,0.45)";
                  (e.currentTarget as HTMLElement).style.transform =
                    "translateY(-1px)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.boxShadow =
                    "0 4px 14px rgba(67,56,202,0.3)";
                  (e.currentTarget as HTMLElement).style.transform =
                    "translateY(0)";
                }}
              >
                Bắt đầu lộ trình →
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Fallback (should never reach here in practice)
  return null;
}

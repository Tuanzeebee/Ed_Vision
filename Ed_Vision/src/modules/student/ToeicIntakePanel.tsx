import { useState } from "react";
import {
  ClipboardList,
  PenLine,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  Target,
  Award,
} from "lucide-react";
import type { ToeicBand } from "./toeicIntake";
import {
  createToeicMilestoneState,
  estimateToeicScore as _estimateToeicScore, // kept for API compatibility
  mapToeicScoreToBand,
  saveToeicIntakeProfile,
} from "./toeicIntake";

// ─── Types ────────────────────────────────────────────────────────────────────

type Stage = "entry" | "exam" | "self-reported" | "score-result";

type Props = {
  onConfirmBand: (band: ToeicBand) => void;
};

type ExamQuestion = {
  id: string;
  text: string;
  choices: string[];
  correct: number;
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
  const [examScores, setExamScores] = useState<{
    listening: number;
    reading: number;
    total: number;
  } | null>(null);

  // Self-reported state
  const [currentScore, setCurrentScore] = useState("");
  const [selfTargetScore, setSelfTargetScore] = useState<number | null>(null);
  const [selfError, setSelfError] = useState("");

  // Score-result target (shared by both exam and self-reported paths)
  const [targetScore, setTargetScore] = useState<number | null>(null);
  const [targetError, setTargetError] = useState("");

  // ── Exam handlers ────────────────────────────────────────────────────────────

  function handleSelectAnswer(questionId: string, choiceIndex: number) {
    setAnswers((prev) => ({ ...prev, [questionId]: choiceIndex }));
  }

  function handleNextPart() {
    if (examPart < PARTS.length - 1) {
      setExamPart((p) => p + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      submitExam();
    }
  }

  function handlePrevPart() {
    if (examPart > 0) {
      setExamPart((p) => p - 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  function submitExam() {
    const scores = calcScores(answers);
    setExamScores(scores);

    // Persist intake profile
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
  }

  // ── Self-reported handlers ────────────────────────────────────────────────────

  function handleSelfReportedSubmit() {
    setSelfError("");
    const current = parseInt(currentScore, 10);

    if (!currentScore || isNaN(current) || current < 10 || current > 990) {
      setSelfError("Vui lòng nhập điểm hiện tại hợp lệ (10 – 990).");
      return;
    }
    if (!selfTargetScore) {
      setSelfError("Vui lòng chọn điểm mục tiêu.");
      return;
    }
    if (selfTargetScore <= current) {
      setSelfError("Điểm mục tiêu phải cao hơn điểm hiện tại.");
      return;
    }

    const band = mapToeicScoreToBand(current);
    const milestoneState = createToeicMilestoneState(current, selfTargetScore);
    saveToeicIntakeProfile({
      mode: "self-reported",
      recommendedBand: band,
      currentScore: current,
      targetScore: selfTargetScore,
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
            onClick={() => {
              setExamPart(0);
              setAnswers({});
              setStage("exam");
            }}
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
              className="font-black mb-2"
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
              className="font-black mb-2"
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

    return (
      <div className="w-full max-w-5xl mx-auto">
        {/* Back */}
        <button
          onClick={() => setStage("entry")}
          className="flex items-center gap-1.5 text-sm font-medium mb-5 transition-colors"
          style={{ color: "#6366f1" }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.color = "#4338ca";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.color = "#6366f1";
          }}
        >
          <ChevronLeft style={{ width: "15px", height: "15px" }} />
          Quay lại
        </button>

        <div
          className="rounded-2xl overflow-hidden"
          style={{
            background: "#ffffff",
            border: "1.5px solid #e0e7ff",
            boxShadow: "0 4px 24px rgba(99,102,241,0.07)",
            maxWidth: "520px",
          }}
        >
          {/* Card header */}
          <div
            className="px-8 pt-7 pb-6"
            style={{
              background:
                "linear-gradient(135deg, #1e1b4b 0%, #312e81 60%, #1e1b4b 100%)",
            }}
          >
            <div
              className="rounded-full mb-4"
              style={{
                width: "40px",
                height: "3px",
                background: "linear-gradient(90deg, #d97706, #fbbf24)",
              }}
            />
            <h2
              className="font-black mb-1"
              style={{ fontSize: "22px", color: "#ffffff" }}
            >
              Nhập điểm của bạn
            </h2>
            <p style={{ fontSize: "13px", color: "#a5b4fc" }}>
              Điền điểm hiện tại và chọn mục tiêu để bắt đầu lộ trình.
            </p>
          </div>
          {/* Gold rule */}
          <div
            style={{
              height: "3px",
              background: "linear-gradient(90deg, #d97706, #fbbf24, #d97706)",
            }}
          />

          <div className="px-8 py-7 space-y-5">
            {/* Current score */}
            <div>
              <label
                className="block uppercase tracking-widest mb-2 font-bold"
                style={{ fontSize: "10px", color: "#94a3b8" }}
              >
                Điểm hiện tại
              </label>
              <input
                type="number"
                min={10}
                max={990}
                step={5}
                placeholder="Ví dụ: 450"
                value={currentScore}
                onChange={(e) => {
                  setCurrentScore(e.target.value);
                  setSelfError("");
                }}
                className="w-full rounded-xl px-4 py-3 font-semibold text-lg transition"
                style={{
                  border: "1.5px solid #e0e7ff",
                  color: "#1e1b4b",
                  outline: "none",
                  fontSize: "16px",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "#6366f1";
                  e.currentTarget.style.boxShadow =
                    "0 0 0 3px rgba(99,102,241,0.12)";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "#e0e7ff";
                  e.currentTarget.style.boxShadow = "none";
                }}
              />
            </div>

            {/* Target score */}
            <div>
              <label
                className="block uppercase tracking-widest mb-3 font-bold"
                style={{ fontSize: "10px", color: "#94a3b8" }}
              >
                Điểm mục tiêu
              </label>
              <div className="flex flex-wrap gap-2">
                {TARGET_PRESETS.map((preset) => {
                  const disabled = validCurrent && preset <= currentNum;
                  const selected = selfTargetScore === preset;
                  return (
                    <button
                      key={preset}
                      disabled={disabled}
                      onClick={() => {
                        setSelfTargetScore(preset);
                        setSelfError("");
                      }}
                      className="rounded-xl font-bold transition-all duration-150"
                      style={{
                        padding: "7px 16px",
                        fontSize: "13px",
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
                          ? "0 2px 8px rgba(49,46,129,0.2)"
                          : "none",
                      }}
                    >
                      {preset}
                    </button>
                  );
                })}
              </div>
            </div>

            {selfError && (
              <p
                className="rounded-xl px-4 py-3 font-medium"
                style={{
                  fontSize: "13px",
                  color: "#dc2626",
                  background: "#fff1f2",
                  border: "1px solid #fecaca",
                }}
              >
                {selfError}
              </p>
            )}

            <button
              onClick={handleSelfReportedSubmit}
              className="w-full rounded-xl font-bold tracking-wide transition-all duration-150"
              style={{
                padding: "14px",
                fontSize: "14px",
                background: "linear-gradient(135deg, #312e81 0%, #4338ca 100%)",
                color: "#ffffff",
                border: "none",
                boxShadow: "0 4px 14px rgba(67,56,202,0.3)",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.boxShadow =
                  "0 6px 20px rgba(67,56,202,0.4)";
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
              Tạo lộ trình →
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (stage === "exam") {
    const part = PARTS[examPart];
    const isLastPart = examPart === PARTS.length - 1;
    const canAdvance = isPartComplete(part, answers);
    const progress = partProgress(examPart);

    return (
      <div style={{ background: "#f8fafc", paddingBottom: "64px" }}>
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
                      part.skill === "listening" ? "#eef2ff" : "#ecfdf5",
                    color: part.skill === "listening" ? "#4338ca" : "#059669",
                  }}
                >
                  {part.skill === "listening" ? "Listening" : "Reading"}
                </span>
                <span
                  className="font-medium"
                  style={{ fontSize: "12px", color: "#94a3b8" }}
                >
                  Part {examPart + 1} / {PARTS.length}
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
                      : "linear-gradient(90deg, #059669, #34d399)",
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
              className="font-black mb-1"
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
                background: !canAdvance
                  ? "#f1f5f9"
                  : isLastPart
                    ? "linear-gradient(135deg, #d97706, #f59e0b)"
                    : "linear-gradient(135deg, #312e81, #4338ca)",
                color: !canAdvance ? "#cbd5e1" : "#ffffff",
                cursor: !canAdvance ? "not-allowed" : "pointer",
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
                  Nộp bài
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
                  className="font-black leading-none"
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
                        background: "linear-gradient(90deg, #34d399, #10b981)",
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
                  className="font-black uppercase tracking-wider"
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

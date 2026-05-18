import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, ChevronRight, PenLine, Settings } from "lucide-react";
import { ieltsAdaptiveApi } from "@/services/ielts-adaptive/api";
import { syncToMasterVocab } from "./components/MasterVocabModal";
import type { LearningRepositoryItem, Lesson } from "@/types/ielts-adaptive.types";
import {
  chatIeltsGroqTutor,
  type IeltsChatMessage,
} from "@/services/api/certificateService";
import IeltsWritingResult from "./components/IeltsWritingResult";
import IeltsChatPanel from "./components/IeltsChatPanel";
import IeltsVocabPanel, { type VocabWord } from "./components/IeltsVocabPanel";

const QUICK_ACTIONS = [
  { label: "Kiểm tra ngữ pháp", prompt: "Kiểm tra ngữ pháp bài viết này và chỉ ra các lỗi cụ thể" },
  { label: "Gợi ý từ học thuật", prompt: "Gợi ý các từ/cụm từ học thuật (academic vocabulary) phù hợp để thay thế" },
  { label: "Nhận xét cấu trúc", prompt: "Nhận xét cấu trúc bài essay: intro, body, conclusion" }
];

// ─── HELPERS ─────────────────────────────────────────────────────────────────
const WRITING_TYPES = new Set([
  "writing",
  "writing_task",
  "sentence_rewrite",
  "planning_task",
  "essay_task",
]);

const bandColor = (band: number) => {
  if (band >= 8) return "#22c55e";
  if (band >= 6) return "#eab308";
  if (band >= 5) return "#f97316";
  return "#ef4444";
};

const cefrLabel = (band: number) => {
  if (band >= 8.5) return "C2";
  if (band >= 7) return "C1";
  if (band >= 5.5) return "B2";
  if (band >= 4) return "B1";
  return "A2";
};

const criterionIcon = (name: string) => {
  const normalized = name.toLowerCase();
  if (normalized.includes("task")) return "✍️";
  if (normalized.includes("coherence")) return "🔗";
  if (normalized.includes("lexical")) return "📚";
  if (normalized.includes("grammar")) return "⚙️";
  return "📊";
};

function countWords(text: string) {
  return text.trim() ? text.trim().split(/\s+/).length : 0;
}

// ─── TYPES ──────────────────────────────────────────────────────────────────
interface AiGradingResult {
  skill: "writing" | "speaking";
  taskType?: "task1" | "task2";
  bandScore: number;
  criteria: Array<{ name: string; score: number; feedback: string }>;
  overallFeedback: string;
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
  correctedExamples?: Array<{ original: string; suggestion: string; explanation: string }>;
  estimatedCefrLevel?: string;
  confidence?: "low" | "medium" | "high";
}

// ─── RING SCORE ───────────────────────────────────────────────────────────────
function ScoreRing({ band, size = 100, stroke = 8 }: { band: number; size?: number; stroke?: number }) {
  const r = (size - stroke * 2) / 2;
  const circ = 2 * Math.PI * r;
  const pct = Math.min(1, Math.max(0, band / 9));
  const color = bandColor(band);
  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#1e293b" strokeWidth={stroke} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={stroke}
        strokeDasharray={`${circ * pct} ${circ * (1 - pct)}`}
        strokeLinecap="round"
        style={{ transition: "stroke-dasharray 1s cubic-bezier(.4,0,.2,1)" }}
      />
    </svg>
  );
}

// ─── CRITERION CARD ───────────────────────────────────────────────────────────
function CriterionCard({ c, delay }: { c: AiGradingResult["criteria"][number]; delay: number }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(t);
  }, [delay]);

  return (
    <div
      style={{
        background: "#ffffff",
        border: "1px solid #e2e8f0",
        borderRadius: 14,
        padding: "18px 20px",
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(16px)",
        transition: "opacity .4s ease, transform .4s ease",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 18 }}>{criterionIcon(c.name)}</span>
          <span style={{ fontSize: 13, fontWeight: 600, color: "#64748b", fontFamily: "'DM Sans', sans-serif" }}>
            {c.name}
          </span>
        </div>
        <span style={{ fontSize: 22, fontWeight: 800, color: bandColor(c.score), fontFamily: "'Space Mono', monospace" }}>
          {c.score.toFixed(1)}
        </span>
      </div>
      <div style={{ background: "#e2e8f0", borderRadius: 99, height: 5, marginBottom: 10 }}>
        <div
          style={{
            height: 5,
            borderRadius: 99,
            width: `${(c.score / 9) * 100}%`,
            background: bandColor(c.score),
            transition: "width 1.2s cubic-bezier(.4,0,.2,1)",
          }}
        />
      </div>
      <p style={{ margin: 0, fontSize: 13, color: "#475569", lineHeight: 1.6 }}>{c.feedback}</p>
    </div>
  );
}

// ─── CORRECTED EXAMPLE ────────────────────────────────────────────────────────
function CorrectedExample({ ex }: { ex: NonNullable<AiGradingResult["correctedExamples"]>[number] }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      style={{
        background: "#ffffff",
        border: "1px solid #e2e8f0",
        borderRadius: 12,
        padding: "14px 16px",
        cursor: "pointer",
      }}
      onClick={() => setOpen((o) => !o)}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
        <div style={{ flex: 1 }}>
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: "#b91c1c",
              background: "#fee2e2",
              padding: "2px 8px",
              borderRadius: 99,
              marginRight: 8,
            }}
          >
            ORIGINAL
          </span>
          <span style={{ fontSize: 13, color: "#475569", lineHeight: 1.5 }}>
            <s style={{ opacity: 0.6 }}>{ex.original}</s>
          </span>
        </div>
        <span style={{ color: "#475569", fontSize: 16, flexShrink: 0 }}>{open ? "▲" : "▼"}</span>
      </div>
      {open && (
        <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid #e2e8f0" }}>
          <div style={{ marginBottom: 8 }}>
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: "#166534",
                background: "#dcfce7",
                padding: "2px 8px",
                borderRadius: 99,
                marginRight: 8,
              }}
            >
              SUGGESTION
            </span>
            <span style={{ fontSize: 13, color: "#166534" }}>{ex.suggestion}</span>
          </div>
          {ex.explanation && (
            <p style={{ margin: 0, fontSize: 12, color: "#64748b", fontStyle: "italic" }}>
              💡 {ex.explanation}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function pickWritingItem(lesson: Lesson | null, preferredTaskType?: "task1" | "task2"): LearningRepositoryItem | null {
  if (!lesson) return null;
  const repos = [lesson.practiceRepo, lesson.miniTestRepo, lesson.flashcardRepo].filter(Boolean);
  
  if (preferredTaskType) {
    for (const repo of repos) {
      const items = repo?.items ?? [];
      const match = items.find((item) => 
        WRITING_TYPES.has(item.item_type) && 
        (item.metadata as any)?.taskType === preferredTaskType
      );
      if (match) return match;
    }
  }

  for (const repo of repos) {
    const items = repo?.items ?? [];
    const writing = items.find((item) => WRITING_TYPES.has(item.item_type));
    if (writing) return writing;
  }
  return null;
}

function resolveTaskType(item: LearningRepositoryItem | null): "task1" | "task2" {
  const taskType = (item?.metadata as any)?.taskType;
  return taskType === "task1" ? "task1" : "task2";
}

function resolveMinWords(taskType: "task1" | "task2", item: LearningRepositoryItem | null) {
  const minWords = (item?.metadata as any)?.minWords;
  if (typeof minWords === "number" && minWords > 0) return minWords;
  return taskType === "task1" ? 150 : 250;
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function WritingPracticePage() {
  const navigate = useNavigate();
  const { lessonId } = useParams<{ lessonId?: string }>();

  // --- Core States ---
  const [taskType, setTaskType] = useState<"task1" | "task2">("task2");
  const [prompt, setPrompt] = useState("");
  const [essay, setEssay] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AiGradingResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [assistantTab, setAssistantTab] = useState<"ai" | "vocab">("ai");

  // --- AI Chat States ---
  const [chatHistory, setChatHistory] = useState<IeltsChatMessage[]>([]);
  const [chatMessage, setChatMessage] = useState("");
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [isChatExpanded, setIsChatExpanded] = useState(false);
  const [vocabWords, setVocabWords] = useState<VocabWord[]>([]);
  const [isExtractingVocab, setIsExtractingVocab] = useState(false);

  const assistantRef = useRef<HTMLDivElement | null>(null);
  const resultRef = useRef<HTMLDivElement | null>(null);

  // --- Logic Helpers ---
  const toggleChat = () => setIsChatExpanded((prev) => !prev);

  useEffect(() => {
    if (!lessonId) return;
    const parsed = Number.parseInt(lessonId, 10);
    if (Number.isNaN(parsed)) return;

    const loadLesson = async () => {
      try {
        const data = await ieltsAdaptiveApi.getLesson(parsed);
        setLesson(data);
      } catch (err) {
        console.error("Failed to load lesson", err);
      }
    };

    loadLesson();
  }, [lessonId]);

  const writingItem = useMemo(() => pickWritingItem(lesson, taskType), [lesson, taskType]);

  // Keep chat history throughout the writing practice session
  // Removed reset on lessonId or writingItem change

  // --- Vocab Management ---
  useEffect(() => {
    const saved = localStorage.getItem(`ielts_vocab_${lessonId}`);
    if (saved) {
      try { setVocabWords(JSON.parse(saved)); } catch (e) { console.error(e); }
    }
  }, [lessonId]);

  useEffect(() => {
    if (lessonId) {
      localStorage.setItem(`ielts_vocab_${lessonId}`, JSON.stringify(vocabWords));
    }
  }, [vocabWords, lessonId]);

  const handleAddVocab = (w: Omit<VocabWord, "id" | "created_at">) => {
    const word: VocabWord = {
      ...w,
      id: Date.now(),
      created_at: new Date().toISOString(),
    };
    setVocabWords((prev) => [word, ...prev]);

    // Sync to Master
    if (lesson) {
        syncToMasterVocab(word, lesson.id, lesson.lesson_title, 'writing');
    }
  };

  const handleDeleteVocab = (id: string | number) => {
    setVocabWords((prev) => prev.filter((w) => w.id !== id));
  };

  const handleToggleStarVocab = (id: string | number) => {
    setVocabWords((prev) => {
        const updated = prev.map((w) => (w.id === id ? { ...w, starred: !w.starred } : w));
        const word = updated.find(w => w.id === id);
        if (word && lesson) {
            syncToMasterVocab(word, lesson.id, lesson.lesson_title, 'writing');
        }
        return updated;
    });
  };

  const handleUpdateVocabNote = (id: string | number, note: string) => {
    setVocabWords((prev) => prev.map((w) => (w.id === id ? { ...w, note } : w)));
  };

  const handleExtractVocabAI = async () => {
    if (!prompt || isExtractingVocab) return;
    setIsExtractingVocab(true);
    console.log("📝 Writing Prompt found:", prompt.slice(0, 100));
    console.log("✍️ Student Essay length:", essay.length);
    try {
      const aiPrompt = `You are a JSON API. Return ONLY a raw JSON array, no explanation, no markdown, no Vietnamese conversational text.
      Extract 5 advanced or important vocabulary words from this IELTS prompt and essay.
      Format: [{"en": "word", "vn": "nghĩa tiếng Việt", "type": "noun/verb/adjective/adverb"}]
      
      Task Prompt: "${prompt}"
      Student Essay: "${essay}"`;

      const res = await chatIeltsGroqTutor({
        skill: "vocabulary",
        context_text: "Học sinh đang yêu cầu trích xuất từ vựng từ bài viết Writing.",
        user_message: aiPrompt,
        band_target: lesson?.band_level ? (lesson.band_level + 0.5) : undefined,
      });

      const rawResponse = res.answer.trim();
      const jsonMatch = rawResponse.match(/\[[\s\S]*\]/);
      if (!jsonMatch) throw new Error("No JSON array found in AI response");

      const extracted = JSON.parse(jsonMatch[0]);

      const newWords = extracted.map((item: any) => {
        if (!vocabWords.find((w) => w.en.toLowerCase() === item.en.toLowerCase())) {
          return {
            ...item,
            id: Date.now() + Math.random(),
            source: "ai",
            starred: false,
            note: "",
            created_at: new Date().toISOString(),
          };
        }
        return null;
      }).filter(Boolean);

      if (newWords.length > 0) {
        setVocabWords((prev) => [...newWords, ...prev]);
      }
    } catch (err) {
      console.error("Vocab extraction error:", err);
    } finally {
      setIsExtractingVocab(false);
    }
  };

  const sendChatMessage = async (overrideMsg?: string) => {
    const msgToSend = overrideMsg || chatMessage;
    if (!msgToSend.trim() || isChatLoading) return;

    const userMsg: IeltsChatMessage = { role: "user", content: msgToSend.trim() };
    if (!overrideMsg || overrideMsg === chatMessage.trim()) setChatMessage("");

    setChatHistory((prev) => [...prev, userMsg]);
    setIsChatLoading(true);
    setIsChatExpanded(true);

    try {
      const res = await chatIeltsGroqTutor({
        skill: "writing",
        context_text: `Đề bài: ${prompt}\n\nBài viết của học sinh: ${essay}`,
        user_message: msgToSend.trim(),
        chat_history: chatHistory,
        band_target: lesson?.band_level ? (lesson.band_level + 0.5) : undefined,
      });

      setChatHistory((prev) => [...prev, { role: "assistant", content: res.answer }]);
    } catch (err) {
      console.error("Chat error:", err);
      setChatHistory((prev) => [
        ...prev,
        { role: "assistant", content: "Xin lỗi, mình gặp chút trục trặc. Bạn thử lại nhé!" },
      ]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleQuickAction = (quickPrompt: string) => {
    sendChatMessage(quickPrompt);
  };

  const handleTextSelection = () => {
    const selection = window.getSelection();
    const selectedText = selection?.toString().trim();
    if (selectedText && selectedText.length > 0 && selectedText.length < 100) {
      handleQuickAction(`Giải thích từ "${selectedText}" trong ngữ cảnh này`);
    }
  };

  // Set initial taskType and prompt once when lesson loads
  useEffect(() => {
    const initialItem = pickWritingItem(lesson);
    if (initialItem) {
      const resolved = resolveTaskType(initialItem);
      setTaskType(resolved);
      setPrompt(initialItem.stem ?? "");
    }
  }, [lesson]);

  // Update prompt when taskType changes
  useEffect(() => {
    if (!lesson) return;
    const item = pickWritingItem(lesson, taskType);
    if (item) {
      setPrompt(item.stem ?? "");
    }
  }, [taskType, lesson]);

  const wordCount = countWords(essay);
  const minWords = resolveMinWords(taskType, writingItem);
  const wordOk = wordCount >= minWords;
  const baseBandValue = lesson?.band_level ? lesson.band_level : null;
  const bandSummary = baseBandValue != null ? `${baseBandValue.toFixed(1)}→${(baseBandValue + 0.5).toFixed(1)}` : "--";
  // Tính lessonProgress trực tiếp
  let lessonProgress = 0;
  if (result) {
    lessonProgress = taskType === "task1" ? 50 : 100;
  } else {
    const currentTaskCompletion = Math.min(100, (wordCount / Math.max(minWords, 1)) * 100);
    if (taskType === "task1") {
      lessonProgress = Math.round(currentTaskCompletion / 2);
    } else {
      // Bắt đầu Task 2 từ 50% tiến trình (do Task 1 đã làm hoặc được bỏ qua)
      const base = 50;
      lessonProgress = Math.min(100, Math.round(base + currentTaskCompletion / 2));
    }
  }

  async function handleSubmit() {
    if (!prompt.trim() || !essay.trim()) {
      setError("Vui lòng nhập đề bài và bài viết.");
      return;
    }
    setError(null);
    setLoading(true);
    setResult(null);

    try {
      const data = await ieltsAdaptiveApi.gradeWriting({
        essay,
        task_prompt: prompt,
        task_type: taskType,
        word_count: wordCount,
        lesson_id: lessonId ? Number.parseInt(lessonId, 10) : undefined,
      });

      if (data.confidence === "low") {
        throw new Error("Hệ thống AI đang quá tải, vui lòng thử lại sau ít phút.");
      }

      setResult(data);

      if (lessonId && data.bandScore) {
        try {
          const parsed = Number.parseInt(lessonId, 10);
          if (!Number.isNaN(parsed)) {
            const accuracy = (data.bandScore / 9) * 100;
            const hasTask2 = !!pickWritingItem(lesson, "task2");
            const isFullyCompleted = taskType === "task2" || !hasTask2;
            await ieltsAdaptiveApi.completeLesson(parsed, accuracy, isFullyCompleted);
          }
        } catch (err) {
          console.error("Failed to complete writing lesson:", err);
        }
      }

      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    } catch (e: any) {
      let errorMsg = e?.response?.data?.message || e?.message || "Có lỗi xảy ra. Vui lòng thử lại.";
      if (errorMsg.includes("All grading providers failed") || errorMsg.includes("Hệ thống AI đang quá tải")) {
        errorMsg = "Hệ thống AI đang quá tải, vui lòng thử lại sau ít phút.";
      }
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  }

  function handleReset() {
    setResult(null);
    setEssay("");
    setError(null);
    setActiveTab("overview");
  }

  const promptPlaceholder = taskType === "task2"
    ? "In some cultures, children are often told that they can achieve anything if they try hard enough. What are the advantages and disadvantages of giving children this message?"
    : "The graph below shows the percentage of households with internet access in different countries from 2000 to 2020. Summarise the information by selecting and reporting the main features.";

  const handleBackToRoadmap = () => {
    navigate("/student/certificate-review/ielts");
  };

  const handleOpenAssistant = () => {
    setAssistantTab("ai");
    setTimeout(() => {
      assistantRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 0);
  };

  const studyTips = [
    "Lập dàn ý: thesis + 2-3 ý chính + kết luận trước khi viết.",
    "Dùng linkers: however, moreover, on the other hand để tăng coherence.",
    "Kiểm tra lỗi ngữ pháp & spelling trong 5 phút cuối.",
  ];

  // ── UI ─────────────────────────────────────────────────────────────────────
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#F0F4FF",
        fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
        color: "#0f172a",
        padding: "0 0 60px",
      }}
    >
      <link
        href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Space+Mono:wght@400;700&display=swap"
        rel="stylesheet"
      />

      <div
        style={{
          borderBottom: "1px solid #dbeafe",
          padding: "16px 32px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          position: "sticky",
          top: 0,
          zIndex: 50,
          background: "rgba(255,255,255,.9)",
          backdropFilter: "blur(16px)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <button
            onClick={handleBackToRoadmap}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              border: "1px solid #dbeafe",
              background: "#ffffff",
              color: "#475569",
              borderRadius: 999,
              padding: "6px 12px",
              fontSize: 12,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            <ArrowLeft size={14} /> Quay lại Roadmap
          </button>

          <span style={{ color: "#cbd5f5" }}>|</span>
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12 }}>
            <span style={{ color: "#94a3b8", fontWeight: 700 }}>IELTS Adaptive</span>
            <ChevronRight size={12} color="#cbd5f5" />
            <span style={{ color: "#1d4ed8", fontWeight: 800 }}>Writing — Band {bandSummary}</span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: "linear-gradient(135deg,#3b82f6,#6366f1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 18,
              }}
            >
              <PenLine size={18} color="#fff" />
            </div>
            <div>

              <div style={{ fontSize: 11, color: "#64748b" }}>
                {lessonId ? "" : "AI-powered · Gemini · Rubric chuẩn"}
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#f8fafc", padding: "6px 10px", borderRadius: 999, border: "1px solid #e2e8f0" }}>
            <span style={{ fontSize: 10, fontWeight: 800, color: "#94a3b8", letterSpacing: ".12em" }}>LESSON PROGRESS</span>
            <div style={{ width: 90, height: 6, background: "#e2e8f0", borderRadius: 999, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${lessonProgress}%`, background: "#2563eb", borderRadius: 999, transition: "width 0.3s ease" }} />
            </div>
            <span style={{ fontSize: 12, fontWeight: 800, color: "#2563eb" }}>{lessonProgress}%</span>
          </div>
          <button
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              border: "1px solid #e2e8f0",
              background: "#ffffff",
              color: "#64748b",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Settings size={16} />
          </button>
          {result && (
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <button
                onClick={handleReset}
                style={{
                  background: "transparent",
                  border: "1px solid #bfdbfe",
                  color: "#475569",
                  borderRadius: 8,
                  padding: "6px 14px",
                  fontSize: 13,
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                ← Viết lại bài này
              </button>
              
              {taskType === "task1" && (
                <button
                  onClick={() => {
                    setResult(null);
                    setTaskType("task2");
                    setEssay("");
                    setError(null);
                    setActiveTab("overview");
                  }}
                  style={{
                    background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: 8,
                    padding: "6px 16px",
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: "pointer",
                    boxShadow: "0 4px 12px rgba(37, 99, 235, 0.2)",
                    transition: "all 0.2s ease",
                    display: "flex",
                    alignItems: "center",
                    gap: 4
                  }}
                >
                  Làm bài Task 2 <ChevronRight size={14} />
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      <div style={{ maxWidth: "100%", margin: "0 auto", padding: "32px 48px" }}>
        <div style={{ display: "grid", gridTemplateColumns: result ? "1fr" : "280px 1fr", gap: 24, alignItems: "start" }}>
          {!result && (
            <aside
              ref={assistantRef}
              style={{
                background: "#ffffff",
                border: "1px solid #e2e8f0",
                borderRadius: 20,
                padding: "18px 0",
                position: "sticky",
                top: 96,
                height: "600px",
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
              }}
            >
              <div style={{ padding: "0 18px 12px" }}>
                <p style={{ fontSize: 11, fontWeight: 800, color: "#94a3b8", letterSpacing: ".18em" }}>TRỢ LÝ AI</p>
              </div>

              <div style={{ padding: "0 18px", display: "flex", gap: 20, borderBottom: "1px solid #eef2ff" }}>
                <button
                  onClick={() => setAssistantTab("ai")}
                  style={{
                    border: "none",
                    background: "transparent",
                    padding: "0 0 10px",
                    fontSize: 13,
                    fontWeight: 800,
                    color: assistantTab === "ai" ? "#2563eb" : "#94a3b8",
                    cursor: "pointer",
                    borderBottom: assistantTab === "ai" ? "3px solid #2563eb" : "3px solid transparent",
                  }}
                >
                  Trợ lý AI
                </button>
                <button
                  onClick={() => setAssistantTab("vocab")}
                  style={{
                    border: "none",
                    background: "transparent",
                    padding: "0 0 10px",
                    fontSize: 13,
                    fontWeight: 800,
                    color: assistantTab === "vocab" ? "#2563eb" : "#94a3b8",
                    cursor: "pointer",
                    borderBottom: assistantTab === "vocab" ? "3px solid #2563eb" : "3px solid transparent",
                  }}
                >
                  Note từ vựng
                </button>
              </div>

              <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
                {assistantTab === "ai" ? (
                  <IeltsChatPanel
                    skill="writing"
                    chatHistory={chatHistory}
                    chatMessage={chatMessage}
                    isChatLoading={isChatLoading}
                    onSendMessage={sendChatMessage}
                    onMessageChange={setChatMessage}
                    quickActions={QUICK_ACTIONS}
                  />
                ) : (
                  <IeltsVocabPanel
                    words={vocabWords}
                    onAddWord={handleAddVocab}
                    onDeleteWord={handleDeleteVocab}
                    onToggleStar={handleToggleStarVocab}
                    onUpdateNote={handleUpdateVocabNote}
                    onExtractAI={handleExtractVocabAI}
                    isExtracting={isExtractingVocab}
                  />
                )}
              </div>
            </aside>
          )}

          <div onMouseUp={handleTextSelection}>
            {!result && (
              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                <div style={{ display: "flex", gap: 12 }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: 12, fontWeight: 600, color: "#64748b", display: "block", marginBottom: 8 }}>
                      LOẠI BÀI
                    </label>
                    <div style={{ display: "inline-flex", background: "#f1f5f9", borderRadius: 999, padding: 4 }}>
                      {(["task1", "task2"] as const).map((t) => (
                        <button
                          key={t}
                          onClick={() => setTaskType(t)}
                          style={{
                            padding: "8px 24px",
                            border: "none",
                            cursor: "pointer",
                            fontFamily: "inherit",
                            fontSize: 13,
                            fontWeight: 700,
                            borderRadius: 999,
                            background: taskType === t ? "#ffffff" : "transparent",
                            color: taskType === t ? "#2563eb" : "#64748b",
                            boxShadow: taskType === t ? "0 2px 8px rgba(0,0,0,0.06)" : "none",
                            transition: "all .2s ease",
                          }}
                        >
                          {t === "task1" ? "Task 1" : "Task 2"}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "#64748b", display: "block", marginBottom: 8 }}>
                    ĐỀ BÀI
                  </label>
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder={promptPlaceholder}
                    rows={3}
                    style={{
                      width: "100%",
                      background: "#ffffff",
                      border: "1px solid #dbeafe",
                      borderRadius: 12,
                      padding: "14px 16px",
                      color: "#0f172a",
                      fontSize: 14,
                      lineHeight: 1.6,
                      resize: "vertical",
                      fontFamily: "inherit",
                      outline: "none",
                      boxSizing: "border-box",
                      transition: "border-color .2s",
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = "#60a5fa";
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = "#dbeafe";
                    }}
                  />
                </div>

                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <label style={{ fontSize: 12, fontWeight: 600, color: "#64748b" }}>BÀI VIẾT</label>
                    <span
                      style={{
                        fontSize: 12,
                        fontFamily: "'Space Mono', monospace",
                        color: wordOk ? "#22c55e" : wordCount > 0 ? "#f97316" : "#475569",
                        fontWeight: 700,
                      }}
                    >
                      {wordCount} / {minWords} words {wordOk ? "✓" : ""}
                    </span>
                  </div>
                  <textarea
                    value={essay}
                    onChange={(e) => setEssay(e.target.value)}
                    placeholder="Nhập bài viết của bạn vào đây..."
                    rows={14}
                    style={{
                      width: "100%",
                      background: "#ffffff",
                      border: `1px solid ${wordCount > 0 && !wordOk ? "#f97316" : "#dbeafe"}`,
                      borderRadius: 12,
                      padding: "16px 18px",
                      color: "#0f172a",
                      fontSize: 14,
                      lineHeight: 1.8,
                      resize: "vertical",
                      fontFamily: "'DM Sans', sans-serif",
                      outline: "none",
                      boxSizing: "border-box",
                      transition: "border-color .2s",
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = "#60a5fa";
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = wordCount > 0 && !wordOk ? "#f97316" : "#dbeafe";
                    }}
                  />
                  {wordCount > 0 && !wordOk && (
                    <p style={{ margin: "6px 0 0", fontSize: 12, color: "#f97316" }}>
                      ⚠️ Cần tối thiểu {minWords} từ cho {taskType === "task1" ? "Task 1" : "Task 2"}. Bài ngắn sẽ bị trừ điểm.
                    </p>
                  )}
                </div>

                {error && (
                  <div
                    style={{
                      background: "#fee2e2",
                      border: "1px solid #fecaca",
                      borderRadius: 10,
                      padding: "12px 16px",
                      fontSize: 13,
                      color: "#b91c1c",
                    }}
                  >
                    ⚠️ {error}
                  </div>
                )}

                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  style={{
                    background: loading ? "#e2e8f0" : "linear-gradient(135deg,#60a5fa,#6366f1)",
                    border: "none",
                    borderRadius: 12,
                    padding: "16px 0",
                    color: loading ? "#94a3b8" : "#fff",
                    fontSize: 15,
                    fontWeight: 700,
                    cursor: loading ? "not-allowed" : "pointer",
                    fontFamily: "inherit",
                    letterSpacing: ".01em",
                    transition: "all .2s",
                    boxShadow: loading ? "none" : "0 8px 24px rgba(96,165,250,.35)",
                  }}
                >
                  {loading ? (
                    <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
                      <span
                        style={{
                          width: 16,
                          height: 16,
                          border: "2px solid #475569",
                          borderTopColor: "#6366f1",
                          borderRadius: "50%",
                          display: "inline-block",
                          animation: "spin 1s linear infinite",
                        }}
                      />
                      Đang chấm bài...
                    </span>
                  ) : (
                    "🎯 Chấm điểm ngay"
                  )}
                </button>
              </div>
            )}

            {result && (
              <div ref={resultRef} style={{ display: "flex", flexDirection: "column", gap: 24, marginTop: 24 }}>
                <IeltsWritingResult result={result} essay={essay} />
                
                {/* Qua Task 2 Banner/Button */}
                {taskType === "task1" && (
                  <div style={{
                    background: "linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)",
                    borderRadius: 20,
                    padding: "24px 32px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    color: "#ffffff",
                    boxShadow: "0 10px 30px rgba(49, 46, 129, 0.25)",
                    border: "1px solid rgba(99, 102, 241, 0.2)",
                    marginTop: 16
                  }}>
                    <div>
                      <h4 style={{ margin: "0 0 8px", fontSize: 18, fontWeight: 800, color: "#fff" }}>
                        🎉 Đã hoàn thành 50% bài học (Task 1)!
                      </h4>
                      <p style={{ margin: 0, fontSize: 13, color: "#c7d2fe", lineHeight: 1.5 }}>
                        Bạn đã xuất sắc hoàn thành phần thi Task 1. Hãy tiếp tục với Task 2 để hoàn thành toàn bộ lộ trình bài học viết này nhé.
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setResult(null);
                        setTaskType("task2");
                        setEssay("");
                        setError(null);
                        setActiveTab("overview");
                      }}
                      style={{
                        background: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
                        color: "#ffffff",
                        border: "none",
                        borderRadius: 12,
                        padding: "12px 24px",
                        fontSize: 14,
                        fontWeight: 700,
                        cursor: "pointer",
                        boxShadow: "0 4px 15px rgba(99, 102, 241, 0.4)",
                        transition: "all 0.2s ease",
                        flexShrink: 0,
                        display: "flex",
                        alignItems: "center",
                        gap: 8
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = "translateY(-2px)";
                        e.currentTarget.style.boxShadow = "0 6px 20px rgba(99, 102, 241, 0.6)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = "translateY(0)";
                        e.currentTarget.style.boxShadow = "0 4px 15px rgba(99, 102, 241, 0.4)";
                      }}
                    >
                      Làm bài Task 2 <ChevronRight size={16} />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        * { box-sizing: border-box; }
        textarea::placeholder { color: #334155; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: #0f172a; }
        ::-webkit-scrollbar-thumb { background: #334155; border-radius: 3px; }
      `}</style>
    </div>
  );
}

import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, ChevronRight, Check, Mic, ChevronDown, Settings } from "lucide-react";
import IeltsSpeakingResult from "./components/IeltsSpeakingResult";
import IeltsChatPanel from "./components/IeltsChatPanel";
import IeltsVocabPanel, { type VocabWord } from "./components/IeltsVocabPanel";
import { chatIeltsGroqTutor, type IeltsChatMessage } from "@/services/api/certificateService";
import { syncToMasterVocab } from "./components/MasterVocabModal";
import apiClient from "@/services/api/apiClient";
import type { Lesson, SpeakingResult } from "@/types/ielts-adaptive.types";

// ─── Types ────────────────────────────────────────────────────────────────────

type RecordingState = "idle" | "recording" | "processing" | "done";
type FlowStep = "instructions" | "mic-check" | "part-intro" | "practice";

const SPEAKING_TYPES = new Set(['speaking', 'speaking_prompt', 'speaking_task']);

const QUESTIONS: Record<1 | 2 | 3, string[]> = {
  1: [
    "Do you work or are you a student? Tell me about your job/studies.",
    "What do you like most about your hometown?",
    "Is there anything you would like to change about it?",
    "Do you prefer living in a big city or a small town?",
  ],
  2: [
    "Describe a book you have recently read. You should say: what the book is, who wrote it, what it is about, and explain why you enjoyed reading it.",
    "Describe a beautiful place you visited in your country. You should say: where it is, when you went there, what you did there, and explain why you think it is beautiful.",
  ],
  3: [
    "How has reading habits changed in your country in the past few decades?",
    "Do you think physical books will eventually be replaced by e-books?",
    "Why do some people prefer to travel to popular tourist destinations while others like off-the-beaten-track places?",
    "How can tourism benefit a local community?",
  ],
};

const QUICK_ACTIONS = [
  { label: "Gợi ý ý tưởng", prompt: "Gợi ý ý tưởng và outline để trả lời câu hỏi speaking này" },
  { label: "Cụm từ hay dùng", prompt: "Gợi ý các cụm từ hay (useful phrases) cho chủ đề speaking này" },
  { label: "Cách phát âm", prompt: "Hướng dẫn phát âm các từ quan trọng trong chủ đề này" }
];

// ─── Components ───────────────────────────────────────────────────────────────

const WaveformVisualizer: React.FC<{ analyser: AnalyserNode | null; isRecording: boolean }> = ({ analyser, isRecording }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!isRecording || !analyser || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    let animationId: number;

    const draw = () => {
      animationId = requestAnimationFrame(draw);
      analyser.getByteTimeDomainData(dataArray);

      ctx.fillStyle = "#f8fafc";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.lineWidth = 2;
      ctx.strokeStyle = "#2B7DC4";
      ctx.beginPath();

      const sliceWidth = canvas.width / dataArray.length;
      let x = 0;

      for (let i = 0; i < dataArray.length; i++) {
        const v = dataArray[i] / 128.0;
        const y = (v * canvas.height) / 2;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
        x += sliceWidth;
      }

      ctx.lineTo(canvas.width, canvas.height / 2);
      ctx.stroke();
    };

    draw();
    return () => cancelAnimationFrame(animationId);
  }, [isRecording, analyser]);

  return (
    <canvas
      ref={canvasRef}
      width={400}
      height={40}
      style={{ width: "100%", height: 40, borderRadius: 8 }}
    />
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────

const IeltsSpeakingPage: React.FC = () => {
  const { lessonId } = useParams<{ lessonId?: string }>();
  const navigate = useNavigate();

  const [flowStep, setFlowStep] = useState<FlowStep>("instructions");
  const [micTestStatus, setMicTestStatus] = useState<"idle" | "testing" | "success" | "error">("idle");
  const [micLevel, setMicLevel] = useState(0);

  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [part, setPart] = useState<1 | 2 | 3>(1);
  const [questionIdx, setQuestionIdx] = useState(0);
  const [recordingState, setRecordingState] = useState<RecordingState>("idle");
  const [timer, setTimer] = useState(0);
  const [transcript, setTranscript] = useState("");
  const [result, setResult] = useState<SpeakingResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(!!lessonId);
  const [processingStep, setProcessingStep] = useState<"transcribing" | "grading" | null>(null);

  const [lessonQuestion, setLessonQuestion] = useState<string | null>(null);

  // --- AI Assistant State ---
  const [assistantTab, setAssistantTab] = useState<"ai" | "vocab">("ai");
  const [chatHistory, setChatHistory] = useState<IeltsChatMessage[]>([]);
  const [chatMessage, setChatMessage] = useState("");
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [vocabWords, setVocabWords] = useState<VocabWord[]>([]);
  const [isExtractingVocab, setIsExtractingVocab] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    if (!lessonId) return;
    const fetchLesson = async () => {
      try {
        setLoading(true);
        const res = await apiClient.get(`/ielts-adaptive/lessons/${lessonId}`);
        const data: Lesson = res.data;
        setLesson(data);

        const pickSpeakingItem = (repo: any) =>
          repo?.items?.find((item: any) => SPEAKING_TYPES.has(String(item.item_type || '')));

        const speakingItem = pickSpeakingItem(data.practiceRepo) ||
                             pickSpeakingItem(data.miniTestRepo) ||
                             pickSpeakingItem(data.flashcardRepo);

        if (speakingItem) {
          setLessonQuestion(speakingItem.stem);
          if (speakingItem.metadata?.part) setPart(speakingItem.metadata.part as any);
          else if (data.lesson_title.toLowerCase().includes("part 2")) setPart(2);
          else if (data.lesson_title.toLowerCase().includes("part 3")) setPart(3);
        }
      } catch (err) {
        console.error("Failed to load lesson:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchLesson();
  }, [lessonId]);

  const currentQuestion = lessonQuestion || QUESTIONS[part][questionIdx];

  const startRecording = useCallback(async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      audioCtxRef.current = new AudioContext();
      const source = audioCtxRef.current.createMediaStreamSource(stream);
      const analyser = audioCtxRef.current.createAnalyser();
      analyser.fftSize = 512;
      source.connect(analyser);
      analyserRef.current = analyser;

      if (flowStep === "mic-check") {
        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        const checkLevel = () => {
          if (!analyserRef.current) return;
          analyserRef.current.getByteFrequencyData(dataArray);
          const sum = dataArray.reduce((a, b) => a + b, 0);
          setMicLevel(sum / dataArray.length);
          if (flowStep === "mic-check") requestAnimationFrame(checkLevel);
        };
        checkLevel();
      }

      // ✅ FIX 1: Chọn mimeType được browser support, fallback an toàn
      const getSupportedMimeType = () => {
        const types = [
          "audio/webm;codecs=opus",
          "audio/webm",
          "audio/ogg;codecs=opus",
          "audio/mp4",
        ];
        return types.find((t) => MediaRecorder.isTypeSupported(t)) ?? "";
      };

      const mimeType = getSupportedMimeType();
      console.log("[Recording] Using mimeType:", mimeType || "(browser default)");

      const options = mimeType ? { mimeType } : {};
      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data);
          console.log("[Recording] chunk received:", e.data.size, "bytes");
        }
      };

      // ✅ FIX 2: Gán onstop TRƯỚC khi start để không miss event
      mediaRecorder.onstop = async () => {
        streamRef.current?.getTracks().forEach((t) => t.stop());
        audioCtxRef.current?.close();
        analyserRef.current = null;

        if (flowStep === "mic-check") return;

        // ✅ FIX 3: Log để debug chunks
        console.log("[Recording] chunks count:", audioChunksRef.current.length);
        console.log("[Recording] total size:", audioChunksRef.current.reduce((s, b) => s + b.size, 0));

        if (audioChunksRef.current.length === 0) {
          setError("Không thu được âm thanh. Vui lòng kiểm tra microphone và thử lại.");
          setRecordingState("idle");
          return;
        }

        const finalMime = mediaRecorder.mimeType || "audio/webm";
        const audioBlob = new Blob(audioChunksRef.current, { type: finalMime });

        console.log("[Recording] blob size:", audioBlob.size, "type:", audioBlob.type);

        if (audioBlob.size < 1000) {
          setError("File âm thanh quá nhỏ. Vui lòng nói to hơn và thử lại.");
          setRecordingState("idle");
          return;
        }

        setRecordingState("processing");
        setProcessingStep("transcribing");

        try {
          // ✅ FIX 4: Xác định đúng extension từ mimeType
          const ext = finalMime.includes("mp4") ? "mp4"
            : finalMime.includes("ogg") ? "ogg"
            : "webm";
          const filename = `recording.${ext}`;

          const formData = new FormData();
          // ✅ FIX 5: KHÔNG set Content-Type header thủ công — để browser tự set boundary
          formData.append("audio", audioBlob, filename);

          console.log("[Transcribe] Sending formData, blob size:", audioBlob.size);

          // ✅ FIX 6: Dùng apiClient nhưng đảm bảo không override Content-Type
          const transcribeRes = await apiClient.post(
            "/ielts/speaking/transcribe",
            formData,
            {
              headers: {
                // Xóa Content-Type để axios/browser tự set multipart/form-data với boundary
                "Content-Type": undefined,
              },
            }
          );

          const { transcript: rawTranscript } = transcribeRes.data;
          setTranscript(rawTranscript);

          setProcessingStep("grading");
          const gradeRes = await apiClient.post("/ielts/speaking/grade", {
            transcript: rawTranscript,
            question: currentQuestion,
            part,
          });
          const scoreData = gradeRes.data;
          setResult(scoreData);
          setRecordingState("done");

          if (lessonId) {
            try {
              const parsed = Number.parseInt(lessonId, 10);
              if (!Number.isNaN(parsed)) {
                const band = scoreData.overallBand || scoreData.bandScore || 6.0;
                const accuracy = (band / 9) * 100;
                const isFullyCompleted = part === 3 ||
                  (part === 1 && !lesson?.lesson_title.toLowerCase().includes("part 2") && !lesson?.lesson_title.toLowerCase().includes("part 3")) ||
                  (part === 2 && !lesson?.lesson_title.toLowerCase().includes("part 3"));
                await apiClient.post(`/ielts-adaptive/lesson/${parsed}/complete`, { score: accuracy, isFullyCompleted });
              }
            } catch (err) {
              console.error("Failed to complete speaking lesson:", err);
            }
          }
        } catch (err: any) {
          console.error("[Speaking] Error:", err?.response?.data || err);
          const msg = err?.response?.data?.message || "Xử lý thất bại. Vui lòng thử lại.";
          setError(msg);
          setRecordingState("idle");
        } finally {
          setProcessingStep(null);
        }
      };

      mediaRecorder.start(250);
      setRecordingState("recording");
      setTimer(0);
      timerRef.current = setInterval(() => setTimer((t) => t + 1), 1000);
    } catch (err) {
      setError("Không thể truy cập microphone. Vui lòng cấp quyền và thử lại.");
    }
  }, [flowStep, currentQuestion, part]);

  const stopRecording = useCallback(() => {
    const mr = mediaRecorderRef.current;
    if (!mr || mr.state === "inactive") return;

    if (timerRef.current) clearInterval(timerRef.current);

    // ✅ FIX 7: requestData() flush chunk cuối cùng trước khi stop
    if (mr.state === "recording") {
      mr.requestData();
    }

    mr.stop();
  }, []);

  // --- AI Chat Logic ---
  const sendChatMessage = async (msg: string) => {
    if (!msg.trim()) return;
    const userMsg: IeltsChatMessage = { role: "user", content: msg };
    const newHistory = [...chatHistory, userMsg];
    setChatHistory(newHistory);
    setChatMessage("");
    setIsChatLoading(true);

    try {
      const response = await chatIeltsGroqTutor({
        skill: "speaking",
        user_message: msg,
        chat_history: chatHistory,
        context_text: currentQuestion
      });
      setChatHistory([...newHistory, { role: "assistant", content: response.answer }]);
    } catch (err) {
      setChatHistory([...newHistory, { role: "assistant", content: "Xin lỗi, đã có lỗi xảy ra khi kết nối với AI." }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  // --- Vocab Logic ---
  const handleAddVocab = async (word: Omit<VocabWord, 'id' | 'created_at'>) => {
    const newWord: VocabWord = {
      ...word,
      id: Date.now(),
      created_at: new Date().toISOString()
    };
    setVocabWords(prev => [...prev, newWord]);
    if (lessonId) {
      try {
        await syncToMasterVocab(
          newWord, 
          lessonId, 
          lesson?.lesson_title || "Speaking Practice", 
          "speaking"
        );
      } catch (err) {
        console.error("Failed to sync vocab:", err);
      }
    }
  };
  const handleDeleteVocab = (id: string | number) => setVocabWords(prev => prev.filter(w => w.id !== id));
  const handleToggleStarVocab = (id: string | number) => setVocabWords(prev => prev.map(w => w.id === id ? { ...w, starred: !w.starred } : w));
  const handleUpdateVocabNote = (id: string | number, note: string) => setVocabWords(prev => prev.map(w => w.id === id ? { ...w, note } : w));
  const handleExtractVocabAI = async () => {
    setIsExtractingVocab(true);
    setTimeout(() => setIsExtractingVocab(false), 2000);
  };

  const reset = () => {
    setRecordingState("idle");
    setTranscript("");
    setResult(null);
    setError(null);
    setTimer(0);
    setProcessingStep(null);
  };

  const timerDisplay = `${Math.floor(timer / 60)}:${(timer % 60).toString().padStart(2, "0")}`;

  if (result && recordingState === "done") {
    return <IeltsSpeakingResult result={result} onRetry={reset} />;
  }

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f8fafc" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: 40, height: 40, borderRadius: "50%", border: "3px solid #e2e8f0", borderTopColor: "#6366f1", animation: "spin 1s linear infinite", display: "inline-block" }} />
          <p style={{ marginTop: 12, color: "#64748b", fontSize: 14 }}>Đang tải bài học...</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const baseBandValue = lesson?.band_level ? lesson.band_level : null;
  const bandSummary = baseBandValue != null ? `${baseBandValue.toFixed(1)}→${(baseBandValue + 0.5).toFixed(1)}` : "--";
  const currentQuestions = QUESTIONS[part] || [];
  const totalQuestions = lessonQuestion ? 1 : currentQuestions.length;
  const practiceProgress = totalQuestions > 0
    ? (questionIdx + (recordingState === "done" ? 1 : 0)) / totalQuestions
    : 0;

  // Tính lessonProgress trực tiếp, tránh useMemo nếu không cần thiết để giảm lỗi runtime
  let lessonProgress = 0;
  if (flowStep === "practice" || recordingState === "done") {
    const partBase = (part - 1) * 33.33;
    const bonus = recordingState === "done" ? 33.33 : practiceProgress * 33.33;
    lessonProgress = Math.min(100, Math.round(partBase + bonus));
  }

  const renderFlow = () => {
    switch (flowStep) {
      case "instructions":
        return (
          <div style={{ maxWidth: 600, margin: "80px auto", padding: "0 24px", textAlign: "center" }}>
            <h1 style={{ fontSize: 32, fontWeight: 800, color: "#1e293b", marginBottom: 40 }}>Trước khi bắt đầu!</h1>
            <div style={{ textAlign: "left", display: "flex", flexDirection: "column", gap: 32, marginBottom: 48 }}>
              {[
                { icon: "🎤", title: "Hãy đảm bảo micrô của bạn hoạt động bình thường.", desc: "Hãy đảm bảo rằng micro của bạn đã được kết nối và bạn đã cấp quyền cho trình duyệt sử dụng micro." },
                { icon: "🔊", title: "Tìm một nơi yên tĩnh", desc: "Hãy chọn một nơi yên tĩnh, tránh bị làm phiền để có chất lượng ghi âm tốt nhất." },
                { icon: "👤", title: "Nói rõ ràng và tự nhiên", desc: "Hãy nói với tốc độ bình thường, phát âm rõ ràng và trả lời một cách tự nhiên nhất có thể." },
                { icon: "✅", title: "Hãy nộp khi bạn hoàn thành.", desc: "Sau khi hoàn thành tất cả các câu hỏi, hãy nhấp vào nút Gửi ở góc trên bên phải để kết thúc bài tập." }
              ].map((item, i) => (
                <div key={i} style={{ display: "flex", gap: 20, alignItems: "flex-start" }}>
                  <div style={{ fontSize: 24, width: 48, height: 48, borderRadius: 12, background: "#f8fafc", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    {item.icon === "✅" ? <Check size={20} color="#2B7DC4" /> : item.icon}
                  </div>
                  <div>
                    <h3 style={{ margin: "0 0 4px", fontSize: 15, fontWeight: 700, color: "#1e293b" }}>{item.title}</h3>
                    <p style={{ margin: 0, fontSize: 13, color: "#64748b", lineHeight: 1.6 }}>{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <button onClick={() => setFlowStep("mic-check")} style={{ width: "100%", padding: "16px 0", borderRadius: 12, border: "none", background: "#2B7DC4", color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer", boxShadow: "0 8px 24px rgba(43,125,196,0.2)" }}>
              TIẾP THEO &nbsp; ›
            </button>
          </div>
        );
      case "mic-check":
        return (
          <div style={{ maxWidth: 600, margin: "120px auto", padding: "0 24px", textAlign: "center" }}>
            <h1 style={{ fontSize: 32, fontWeight: 800, color: "#1e293b", marginBottom: 12 }}>Microphone Check</h1>
            <p style={{ fontSize: 14, color: "#64748b", marginBottom: 48 }}>Click the button below to start recording</p>
            <div style={{ marginBottom: 48, display: "flex", justifyContent: "center" }}>
              <div style={{ position: "relative", width: 80, height: 80, borderRadius: "50%", background: "#fff", border: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="32" height="32" fill="none" viewBox="0 0 24 24">
                  <path d="M12 2a3 3 0 0 1 3 3v7a3 3 0 0 1-6 0V5a3 3 0 0 1 3-3Z" fill={micLevel > 5 ? "#2B7DC4" : "#94a3b8"} />
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2" stroke={micLevel > 5 ? "#2B7DC4" : "#94a3b8"} strokeWidth="2" strokeLinecap="round" />
                </svg>
                {recordingState === "recording" && (
                  <motion.div animate={{ scale: [1, 1.2 + micLevel / 30, 1] }} transition={{ repeat: Infinity, duration: 0.5 }} style={{ position: "absolute", inset: -8, borderRadius: "50%", border: "2px solid #2B7DC430" }} />
                )}
              </div>
            </div>
            <div style={{ display: "flex", gap: 16 }}>
              <button onClick={recordingState === "recording" ? () => { stopRecording(); setMicTestStatus("success"); setRecordingState("idle"); } : startRecording} style={{ flex: 1, padding: "16px 0", borderRadius: 12, border: "none", background: "#2B7DC4", color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                {recordingState === "recording" ? "STOP TEST" : "TEST MIC"}
              </button>
              <button onClick={() => setFlowStep("part-intro")} style={{ flex: 1, padding: "16px 0", borderRadius: 12, border: "1px solid #2B7DC4", background: "#fff", color: "#2B7DC4", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
                SKIP MIC TEST &nbsp; ⏭
              </button>
            </div>
            {micTestStatus === "success" && <p style={{ marginTop: 24, fontSize: 14, color: "#10b981", fontWeight: 600 }}>✓ Microphone is working perfectly!</p>}
          </div>
        );
      case "part-intro":
        const partInfo = {
          1: { title: "PART 1: INTRODUCTION AND INTERVIEW (4-5 PHÚT)", desc: "Giám khảo hỏi các câu hỏi ngắn, quen thuộc về bản thân, gia đình, công việc, học tập, sở thích...." },
          2: { title: "PART 2: INDIVIDUAL LONG TURN (3-4 PHÚT)", desc: "Bạn nhận một thẻ gợi ý (cue card) về một chủ đề cụ thể, có 1 phút chuẩn bị và nói liên tục tối đa 2 phút." },
          3: { title: "PART 3: TWO-WAY DISCUSSION (4-5 PHÚT)", desc: "Giám khảo và bạn thảo luận các vấn đề trừu tượng, chuyên sâu hơn liên quan đến chủ đề ở Part 2." }
        };
        return (
          <div style={{ maxWidth: 700, margin: "100px auto", padding: "40px", textAlign: "center", background: "#fff", borderRadius: 24, boxShadow: "0 10px 40px rgba(0,0,0,0.05)", border: "1px solid #e2e8f0" }}>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: "#1e293b", marginBottom: 32 }}>Hướng dẫn</h1>
            <p style={{ fontSize: 13, fontWeight: 700, color: "#64748b", letterSpacing: "0.1em", marginBottom: 16 }}>{partInfo[part].title}</p>
            <p style={{ fontSize: 15, color: "#475569", lineHeight: 1.7, marginBottom: 24 }}>{partInfo[part].desc}</p>
            <p style={{ fontSize: 13, color: "#2B7DC4", fontWeight: 600, marginBottom: 40, background: "#f0f9ff", padding: "12px", borderRadius: 12 }}>⚠️ DO NOT give out SENSITIVE personal information in your answers.</p>
            <button onClick={() => setFlowStep("practice")} style={{ width: "100%", padding: "16px 0", borderRadius: 12, border: "none", background: "#2B7DC4", color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer" }}>
              BẮT ĐẦU LUYỆN TẬP &nbsp; ‣
            </button>
          </div>
        );
      default: return null;
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", fontFamily: "'DM Sans', sans-serif" }}>
      {/* Header */}
      <div style={{ background: "#fff", borderBottom: "1px solid #e2e8f0", padding: "16px 32px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <button onClick={() => navigate("/student/certificate-review/ielts")} style={{ display: "flex", alignItems: "center", gap: 6, border: "1px solid #dbeafe", background: "#ffffff", color: "#475569", borderRadius: 999, padding: "6px 12px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}><ArrowLeft size={14} /> Quay lại Roadmap</button>
          <span style={{ color: "#cbd5f5" }}>|</span>
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12 }}>
            <span style={{ color: "#94a3b8", fontWeight: 700 }}>IELTS Adaptive</span>
            <ChevronRight size={12} color="#cbd5f5" />
            <span style={{ color: "#1d4ed8", fontWeight: 800 }}>Speaking — Band {bandSummary}</span>
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
        </div>
      </div>

      <div style={{ maxWidth: "1600px", margin: "0 auto", padding: flowStep === "practice" ? "32px 40px" : "0" }}>
        <div style={{ display: flowStep === "practice" ? "grid" : "block", gridTemplateColumns: flowStep === "practice" ? "380px 1fr" : "auto", gap: 40, alignItems: "start" }}>
          
          {/* AI ASSISTANT PANEL */}
          {flowStep === "practice" && (
            <aside
              style={{
                background: "#ffffff",
                border: "1px solid #e2e8f0",
                borderRadius: 24,
                padding: "20px 0",
                position: "sticky",
                top: 96,
                height: "calc(100vh - 160px)",
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
                boxShadow: "0 10px 30px rgba(37,99,235,0.03)"
              }}
            >
              <div style={{ padding: "0 20px 14px" }}>
                <p style={{ fontSize: 11, fontWeight: 800, color: "#94a3b8", letterSpacing: ".18em" }}>TRỢ LÝ AI</p>
              </div>

              <div style={{ padding: "0 20px", display: "flex", gap: 24, borderBottom: "1px solid #f1f5f9" }}>
                <button
                  onClick={() => setAssistantTab("ai")}
                  style={{
                    border: "none", background: "transparent", padding: "0 0 12px", fontSize: 13, fontWeight: 800,
                    color: assistantTab === "ai" ? "#2B7DC4" : "#94a3b8", cursor: "pointer",
                    borderBottom: assistantTab === "ai" ? "3px solid #2B7DC4" : "3px solid transparent",
                    transition: "all 0.2s"
                  }}
                >
                  Trợ lý AI
                </button>
                <button
                  onClick={() => setAssistantTab("vocab")}
                  style={{
                    border: "none", background: "transparent", padding: "0 0 12px", fontSize: 13, fontWeight: 800,
                    color: assistantTab === "vocab" ? "#2B7DC4" : "#94a3b8", cursor: "pointer",
                    borderBottom: assistantTab === "vocab" ? "3px solid #2B7DC4" : "3px solid transparent",
                    transition: "all 0.2s"
                  }}
                >
                  Từ vựng
                </button>
              </div>

              <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
                {assistantTab === "ai" ? (
                  <IeltsChatPanel
                    skill="speaking"
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

          {/* MAIN CONTENT Area */}
          <div style={{ flex: 1 }}>
            {flowStep !== "practice" ? renderFlow() : (
              <div style={{ width: "100%", maxWidth: "1000px" }}>
                
                {/* Part Selector */}
                {!lessonQuestion && (
                  <div style={{ display: "flex", gap: 12, marginBottom: 32 }}>
                    {([1, 2, 3] as const).map((p) => (
                      <button
                        key={p}
                        onClick={() => { setPart(p); setQuestionIdx(0); reset(); }}
                        style={{
                          padding: "10px 24px", borderRadius: 999, border: "none", cursor: "pointer",
                          fontWeight: 700, fontSize: 13,
                          background: part === p ? "linear-gradient(135deg, #74ebd5, #ACB6E5)" : "#e2e8f0",
                          color: part === p ? "#1e293b" : "#64748b",
                          transition: "all 0.2s ease"
                        }}
                      >
                        Part {p}
                      </button>
                    ))}
                  </div>
                )}

                {/* Question Card */}
                <div style={{ background: "#fff", borderRadius: 24, padding: 32, border: "1px solid #e2e8f0", marginBottom: 32, boxShadow: "0 4px 20px rgba(0,0,0,0.02)" }}>
                  <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.1em", color: "#10b981", textTransform: "uppercase", marginBottom: 16 }}>CÂU HỎI</div>
                  <div style={{ position: "relative", marginBottom: 24 }}>
                    <div style={{ width: "100%", padding: "14px 20px", borderRadius: 12, border: "2px solid #1e293b", fontSize: 15, fontWeight: 600, color: "#1e293b", display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer" }}>
                      {currentQuestion}
                      {!lessonQuestion && <ChevronDown size={18} />}
                    </div>
                  </div>
                  <p style={{ margin: 0, fontSize: 15, color: "#475569", fontWeight: 500, fontStyle: "italic", opacity: 0.8 }}>"{currentQuestion}"</p>
                </div>

                {/* Recording Card */}
                <div style={{ background: "#fff", borderRadius: 24, padding: 32, border: "1px solid #e2e8f0", boxShadow: "0 4px 20px rgba(0,0,0,0.02)" }}>
                  <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.1em", color: "#10b981", textTransform: "uppercase", marginBottom: 24 }}>GHI ÂM</div>
                  <AnimatePresence mode="wait">
                    {recordingState === "idle" ? (
                      <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <button onClick={startRecording} style={{ width: "100%", padding: "18px", borderRadius: 14, border: "none", cursor: "pointer", background: "linear-gradient(135deg, #2B7DC4, #4A90E2)", color: "#fff", fontWeight: 700, fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center", gap: 10, boxShadow: "0 8px 20px rgba(43,125,196,0.25)" }}>
                          <Mic size={20} fill="#fff" /> Bắt đầu ghi âm
                        </button>
                      </motion.div>
                    ) : recordingState === "recording" ? (
                      <motion.div key="recording" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                        <div style={{ background: "#f8fafc", borderRadius: 16, padding: "20px", marginBottom: 24, display: "flex", alignItems: "center", gap: 16 }}>
                          <div style={{ flex: 1 }}><WaveformVisualizer analyser={analyserRef.current} isRecording={true} /></div>
                          <div style={{ fontFamily: "'Sora', sans-serif", fontSize: 24, fontWeight: 700, color: "#2B7DC4", minWidth: 60, textAlign: "right" }}>{timerDisplay}</div>
                        </div>
                        <button onClick={stopRecording} style={{ width: "100%", padding: "18px", borderRadius: 14, border: "2px solid #2B7DC4", cursor: "pointer", background: "#fff", color: "#2B7DC4", fontWeight: 700, fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
                          <div style={{ width: 12, height: 12, borderRadius: 2, background: "#2B7DC4" }} /> Dừng ghi âm & Chấm điểm
                        </button>
                      </motion.div>
                    ) : (
                      <motion.div key="processing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ textAlign: "center", padding: "20px 0" }}>
                        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} style={{ width: 48, height: 48, borderRadius: "50%", border: "3px solid #e2e8f0", borderTopColor: "#2B7DC4", display: "inline-block" }} />
                        <p style={{ marginTop: 16, fontSize: 15, color: "#2B7DC4", fontWeight: 600 }}>{processingStep === "transcribing" ? "🎙️ Đang nhận dạng giọng nói..." : "🤖 AI đang phân tích bài nói..."}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                {error && <div style={{ marginTop: 24, padding: "14px 18px", background: "#fef2f2", borderRadius: 12, border: "1px solid #fecaca", color: "#dc2626", fontSize: 14 }}>⚠️ {error}</div>}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default IeltsSpeakingPage;

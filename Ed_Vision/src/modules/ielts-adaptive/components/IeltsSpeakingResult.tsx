import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { SpeakingResult, SpeakingCriteria } from "@/types/ielts-adaptive.types";

// ─── Colour tokens (khớp với Writing scorer) ─────────────────────────────────
const CRITERIA_CONFIG = {
  fluencyCoherence: {
    label: "Fluency & Coherence",
    short: "Độ lưu loát & Mạch lạc",
    color: "#6366f1",
    bg: "#eef2ff",
    ring: "#6366f1",
    icon: "🌊",
  },
  lexicalResource: {
    label: "Lexical Resource",
    short: "Vốn từ vựng",
    color: "#f59e0b",
    bg: "#fffbeb",
    ring: "#f59e0b",
    icon: "📚",
  },
  grammaticalRange: {
    label: "Grammatical Range & Accuracy",
    short: "Ngữ pháp & Độ chính xác",
    color: "#3b82f6",
    bg: "#eff6ff",
    ring: "#3b82f6",
    icon: "⚙️",
  },
  pronunciation: {
    label: "Pronunciation",
    short: "Phát âm",
    color: "#10b981",
    bg: "#f0fdf4",
    ring: "#10b981",
    icon: "🗣️",
  },
};

// ─── Band to label ────────────────────────────────────────────────────────────
const bandLabel = (band: number) => {
  if (band >= 8.5) return "Expert";
  if (band >= 7.5) return "Very Good";
  if (band >= 6.5) return "Good";
  if (band >= 5.5) return "Competent";
  if (band >= 4.5) return "Modest";
  return "Limited";
};

const bandColor = (band: number) => {
  if (band >= 7.5) return "#10b981";
  if (band >= 6.5) return "#3b82f6";
  if (band >= 5.5) return "#f59e0b";
  return "#ef4444";
};

// ─── Animated Ring Score ──────────────────────────────────────────────────────
const RingScore: React.FC<{ band: number; color: string; size?: number; label?: string }> = ({
  band, color, size = 80, label,
}) => {
  const [animated, setAnimated] = useState(0);
  const r = (size - 8) / 2;
  const circ = 2 * Math.PI * r;
  const pct = Math.min(band / 9, 1);

  useEffect(() => {
    const raf = requestAnimationFrame(() => setAnimated(pct));
    return () => cancelAnimationFrame(raf);
  }, [pct]);

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ overflow: "visible" }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e2e8f0" strokeWidth={6} />
        <motion.circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none" stroke={color} strokeWidth={6}
          strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: circ * (1 - animated) }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
        <text x={size / 2} y={size / 2 + 2} textAnchor="middle" dominantBaseline="middle"
          style={{ fontFamily: "'Sora', sans-serif", fontSize: size * 0.24, fontWeight: 700, fill: color }}>
          {band.toFixed(1)}
        </text>
      </svg>
      {label && <span style={{ fontSize: 11, color: "#64748b", fontWeight: 600 }}>{label}</span>}
    </div>
  );
};

// ─── Criteria Panel ───────────────────────────────────────────────────────────
const CriteriaPanel: React.FC<{
  criteriaKey: keyof typeof CRITERIA_CONFIG;
  data: SpeakingCriteria;
  isActive: boolean;
  onClick: () => void;
}> = ({ criteriaKey, data, isActive, onClick }) => {
  const cfg = CRITERIA_CONFIG[criteriaKey];
  return (
    <motion.div
      onClick={onClick}
      whileHover={{ y: -1 }}
      style={{
        padding: "14px 16px", borderRadius: 12, border: `1.5px solid ${isActive ? cfg.color : "#e2e8f0"}`,
        cursor: "pointer", background: isActive ? cfg.bg : "#fff",
        transition: "border-color 0.15s, background 0.15s",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <RingScore band={data.band} color={cfg.color} size={52} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#1e293b" }}>{cfg.label}</span>
          </div>
          <div style={{ fontSize: 12, color: cfg.color, fontWeight: 600 }}>{bandLabel(data.band)}</div>
          <div style={{ fontSize: 12, color: "#64748b", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {data.feedback.slice(0, 60)}...
          </div>
        </div>
        <div style={{ transform: isActive ? "rotate(180deg)" : "none", transition: "transform 0.2s", color: "#94a3b8" }}>▾</div>
      </div>

      <AnimatePresence>
        {isActive && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{ overflow: "hidden" }}
          >
            <div style={{ paddingTop: 14, borderTop: "1px solid #e2e8f0", marginTop: 14 }}>
              <p style={{ margin: "0 0 12px", fontSize: 13, lineHeight: 1.65, color: "#334155" }}>
                {data.feedback}
              </p>

              {data.strengths.length > 0 && (
                <div style={{ marginBottom: 10 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#10b981", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 6 }}>✓ Điểm mạnh</div>
                  {data.strengths.map((s, i) => (
                    <div key={i} style={{ display: "flex", gap: 8, marginBottom: 4 }}>
                      <span style={{ color: "#10b981", fontSize: 12, flexShrink: 0 }}>•</span>
                      <span style={{ fontSize: 12, color: "#334155", lineHeight: 1.5 }}>{s}</span>
                    </div>
                  ))}
                </div>
              )}

              {data.improvements.length > 0 && (
                <div style={{ marginBottom: 10 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#ef4444", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 6 }}>↑ Cần cải thiện</div>
                  {data.improvements.map((imp, i) => (
                    <div key={i} style={{ display: "flex", gap: 8, marginBottom: 4 }}>
                      <span style={{ color: "#ef4444", fontSize: 12, flexShrink: 0 }}>•</span>
                      <span style={{ fontSize: 12, color: "#334155", lineHeight: 1.5 }}>{imp}</span>
                    </div>
                  ))}
                </div>
              )}

              {data.keyPhrases && data.keyPhrases.length > 0 && (
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: cfg.color, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 6 }}>💬 Phrases mẫu</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {data.keyPhrases.map((p, i) => (
                      <span key={i} style={{ padding: "3px 10px", borderRadius: 20, background: cfg.bg, color: cfg.color, fontSize: 12, fontWeight: 500, border: `1px solid ${cfg.color}30` }}>
                        {p}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// ─── Main Result Component ────────────────────────────────────────────────────
const IeltsSpeakingResult: React.FC<{
  result: SpeakingResult;
  onRetry: () => void;
}> = ({ result, onRetry }) => {
  const [activeCriteria, setActiveCriteria] = useState<string | null>("fluencyCoherence");
  const [activeTab, setActiveTab] = useState<"feedback" | "model" | "vocab" | "pronunciation">("feedback");

  const handleSpeak = (text: string) => {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
  };

  const { criteria, transcript, question, part, generalFeedback, modelAnswer, keyVocabulary, pronunciationNotes } = result;

  // Tự tính overallBand từ 4 criteria — KHÔNG tin AI tự báo
  // IELTS Speaking: average of 4 bands, rounded to nearest 0.5
  const computedBand = (() => {
    const avg = (
      criteria.fluencyCoherence.band +
      criteria.lexicalResource.band +
      criteria.grammaticalRange.band +
      criteria.pronunciation.band
    ) / 4;
    return Math.round(avg * 2) / 2;
  })();

  // Guard: transcript quá ngắn → cap band ≤ 4.0
  const wordCount = transcript.trim().split(/\s+/).filter(Boolean).length;
  const overallBand = wordCount < 20 ? Math.min(computedBand, 4.0) : computedBand;

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", fontFamily: "'DM Sans', sans-serif" }}>
      {/* Header */}
      <div style={{ background: "#fff", borderBottom: "1px solid #e2e8f0", padding: "14px 28px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: "linear-gradient(135deg,#6366f1,#8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24"><path d="M12 2a3 3 0 0 1 3 3v7a3 3 0 0 1-6 0V5a3 3 0 0 1 3-3Z" fill="#fff"/></svg>
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#1e293b" }}>Kết quả Speaking</h1>
            <p style={{ margin: 0, fontSize: 12, color: "#94a3b8" }}>Part {part} · AI Analysis</p>
          </div>
        </div>
        <button
          onClick={onRetry}
          style={{ padding: "8px 18px", borderRadius: 8, border: "1px solid #e2e8f0", background: "#fff", color: "#64748b", fontFamily: "'DM Sans', sans-serif", fontWeight: 600, fontSize: 13, cursor: "pointer" }}
        >
          ↺ Thử lại
        </button>
      </div>

      {/* Overall Score Banner */}
      <div style={{ background: "linear-gradient(135deg,#6366f1 0%,#8b5cf6 50%,#a78bfa 100%)", padding: "28px 32px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", alignItems: "center", gap: 28, flexWrap: "wrap" }}>
          {/* Big ring */}
          <div style={{ position: "relative" }}>
            <svg width={120} height={120} viewBox="0 0 120 120">
              <circle cx={60} cy={60} r={52} fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth={8} />
              <motion.circle
                cx={60} cy={60} r={52} fill="none"
                stroke="#fff" strokeWidth={8} strokeLinecap="round"
                strokeDasharray={2 * Math.PI * 52}
                initial={{ strokeDashoffset: 2 * Math.PI * 52 }}
                animate={{ strokeDashoffset: 2 * Math.PI * 52 * (1 - overallBand / 9) }}
                transition={{ duration: 1.4, ease: "easeOut" }}
                transform="rotate(-90 60 60)"
              />
              <text x={60} y={56} textAnchor="middle" style={{ fontFamily: "'Sora',sans-serif", fontSize: 32, fontWeight: 800, fill: "#fff" }}>{overallBand.toFixed(1)}</text>
              <text x={60} y={76} textAnchor="middle" style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 11, fill: "rgba(255,255,255,0.8)" }}>BAND</text>
            </svg>
          </div>

          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: "#fff", marginBottom: 4 }}>
              {bandLabel(overallBand)}
            </div>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.8)", marginBottom: 16, lineHeight: 1.5 }}>
              {generalFeedback}
            </div>
            {/* Mini scores */}
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              {(Object.entries(criteria) as [keyof typeof CRITERIA_CONFIG, SpeakingCriteria][]).map(([key, val]) => {
                const cfg = CRITERIA_CONFIG[key];
                return (
                  <div key={key} style={{ background: "rgba(255,255,255,0.15)", borderRadius: 10, padding: "8px 14px", backdropFilter: "blur(8px)" }}>
                    <div style={{ fontSize: 10, color: "rgba(255,255,255,0.7)", fontWeight: 700, letterSpacing: "0.06em" }}>{cfg.label}</div>
                    <div style={{ fontFamily: "'Sora',sans-serif", fontSize: 20, fontWeight: 800, color: "#fff" }}>{val.band.toFixed(1)}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Split Content */}
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "24px 24px", display: "grid", gridTemplateColumns: "1fr 1.2fr", gap: 20 }}>
        {/* LEFT: Transcript */}
        <div>
          {/* Question */}
          <div style={{ background: "#fff", borderRadius: 14, padding: 20, border: "1px solid #e2e8f0", marginBottom: 16, boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", color: "#6366f1", textTransform: "uppercase", marginBottom: 8 }}>Part {part} Question</div>
            <p style={{ margin: 0, fontSize: 14, lineHeight: 1.65, color: "#334155", fontWeight: 500 }}>{question}</p>
          </div>

          {/* Transcript */}
          <div style={{ background: "#fff", borderRadius: 14, padding: 20, border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", color: "#64748b", textTransform: "uppercase", marginBottom: 14 }}>Your Response</div>
            <p style={{ margin: 0, fontSize: 14, lineHeight: 1.85, color: "#334155", fontFamily: "'Lora', serif" }}>
              {transcript}
            </p>
            <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid #f1f5f9", display: "flex", gap: 12, fontSize: 12, color: "#94a3b8" }}>
              <span>📊 {transcript.split(/\s+/).filter(Boolean).length} words</span>
              <span>⏱️ ~{Math.round(transcript.split(/\s+/).filter(Boolean).length / 130)} min</span>
            </div>
          </div>
        </div>

        {/* RIGHT: Scoring Panel */}
        <div>
          {/* Tabs */}
          <div style={{ display: "flex", gap: 4, background: "#f1f5f9", borderRadius: 10, padding: 4, marginBottom: 16 }}>
            {(["feedback", "model", "vocab", "pronunciation"] as const).map((tab) => {
              const labels = { feedback: "Nhận xét", model: "Mẫu", vocab: "Từ vựng", pronunciation: "Phát âm" };
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  style={{
                    flex: 1, padding: "7px 0", borderRadius: 8, border: "none", cursor: "pointer",
                    fontFamily: "'DM Sans', sans-serif", fontWeight: 600, fontSize: 12,
                    background: activeTab === tab ? "#fff" : "transparent",
                    color: activeTab === tab ? "#1e293b" : "#64748b",
                    boxShadow: activeTab === tab ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
                    transition: "all 0.15s",
                  }}
                >
                  {labels[tab]}
                </button>
              );
            })}
          </div>

          <AnimatePresence mode="wait">
            {/* FEEDBACK TAB */}
            {activeTab === "feedback" && (
              <motion.div key="feedback" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {(Object.entries(criteria) as [keyof typeof CRITERIA_CONFIG, SpeakingCriteria][]).map(([key, val]) => (
                    <CriteriaPanel
                      key={key}
                      criteriaKey={key}
                      data={val}
                      isActive={activeCriteria === key}
                      onClick={() => setActiveCriteria(activeCriteria === key ? null : key)}
                    />
                  ))}
                </div>
              </motion.div>
            )}

            {/* MODEL ANSWER TAB */}
            {activeTab === "model" && (
              <motion.div key="model" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}>
                <div style={{ background: "#fff", borderRadius: 14, padding: 20, border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                    <div style={{ width: 28, height: 28, borderRadius: 8, background: "#fdf4ff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>✨</div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#1e293b" }}>Bài mẫu Band 8.0+</div>
                      <div style={{ fontSize: 11, color: "#94a3b8" }}>Tham khảo cách diễn đạt tự nhiên</div>
                    </div>
                  </div>
                  <p style={{ margin: 0, fontSize: 14, lineHeight: 1.85, color: "#334155", fontFamily: "'Lora', serif" }}>
                    {modelAnswer}
                  </p>
                </div>
              </motion.div>
            )}

            {/* VOCAB TAB */}
            {activeTab === "vocab" && (
              <motion.div key="vocab" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {keyVocabulary.map((v, i) => (
                    <div key={i} style={{ background: "#fff", borderRadius: 12, padding: "14px 16px", border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                        <span style={{ fontWeight: 700, fontSize: 15, color: "#6366f1", fontFamily: "'Lora', serif" }}>{v.word}</span>
                        <button
                          onClick={() => handleSpeak(v.word)}
                          style={{
                            background: "none", border: "none", padding: "4px", cursor: "pointer",
                            color: "#6366f1", display: "flex", alignItems: "center", justifyContent: "center",
                            borderRadius: "50%", transition: "background 0.2s"
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = "#eef2ff")}
                          onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
                          title="Nghe phát âm"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                            <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                          </svg>
                        </button>
                        <span style={{ fontSize: 11, color: "#94a3b8", background: "#f8fafc", padding: "2px 8px", borderRadius: 20 }}>vocab</span>
                      </div>
                      <p style={{ margin: "0 0 6px", fontSize: 13, color: "#64748b" }}>{v.definition}</p>
                      <p style={{ margin: 0, fontSize: 13, color: "#334155", fontStyle: "italic", background: "#f8fafc", padding: "8px 12px", borderRadius: 8, lineHeight: 1.5 }}>
                        "{v.example}"
                      </p>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* PRONUNCIATION TAB */}
            {activeTab === "pronunciation" && (
              <motion.div key="pronunciation" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {pronunciationNotes.length === 0 ? (
                    <div style={{ textAlign: "center", padding: 40, color: "#94a3b8" }}>
                      <div style={{ fontSize: 32, marginBottom: 8 }}>🎉</div>
                      <div style={{ fontSize: 14, fontWeight: 600 }}>Không có lỗi phát âm đặc biệt</div>
                    </div>
                  ) : pronunciationNotes.map((n, i) => (
                    <div key={i} style={{ background: "#fff", borderRadius: 12, padding: "14px 16px", border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                        <span style={{ fontWeight: 700, fontSize: 15, color: "#1e293b" }}>{n.word}</span>
                        <button
                          onClick={() => handleSpeak(n.word)}
                          style={{
                            background: "none", border: "none", padding: "4px", cursor: "pointer",
                            color: "#6366f1", display: "flex", alignItems: "center", justifyContent: "center",
                            borderRadius: "50%", transition: "background 0.2s"
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = "#eef2ff")}
                          onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
                          title="Nghe phát âm"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                            <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                          </svg>
                        </button>
                        <span style={{ fontSize: 13, color: "#6366f1", fontFamily: "monospace", background: "#eef2ff", padding: "1px 8px", borderRadius: 4 }}>{n.ipa}</span>
                      </div>
                      <p style={{ margin: 0, fontSize: 13, color: "#64748b", lineHeight: 1.5 }}>{n.tip}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* CTA Footer */}
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px 40px" }}>
        <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onRetry}
            style={{
              padding: "14px 32px", borderRadius: 10, border: "none", cursor: "pointer",
              background: "linear-gradient(135deg,#6366f1,#8b5cf6)", color: "#fff",
              fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: 15,
              boxShadow: "0 4px 16px rgba(99,102,241,0.3)",
            }}
          >
            🎙️ Luyện tập lần nữa
          </motion.button>
        </div>
      </div>
    </div>
  );
};

export default IeltsSpeakingResult;

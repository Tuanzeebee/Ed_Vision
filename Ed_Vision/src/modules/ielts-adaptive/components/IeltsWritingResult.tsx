import React, { useState, useRef, useEffect } from "react";

// ─── HELPERS ─────────────────────────────────────────────────────────────────
const criterionColors: any = {
  task: "#6366f1",
  lexical: "#f59e0b",
  grammar: "#3b82f6",
  coherence: "#10b981",
};

const tagMap: any = {
  "Task Response": "task", "Task Achievement": "task",
  "Coherence and Cohesion": "coherence",
  "Lexical Resource": "lexical",
  "Grammatical Range and Accuracy": "grammar",
};

const issueColors: any = {
  grammar: { bg: "#dbeafe", text: "#1d4ed8", label: "Ngữ pháp" },
  word_choice: { bg: "#fef9c3", text: "#92400e", label: "Từ vựng" },
  paraphrase: { bg: "#f0fdf4", text: "#166534", label: "Diễn đạt" },
  clarity: { bg: "#fdf4ff", text: "#7e22ce", label: "Rõ nghĩa" },
  coherence: { bg: "#fff7ed", text: "#c2410c", label: "Mạch lạc" },
};

// ─── DUAL RING (current → target) ────────────────────────────────────────────
function DualRing({ current, target, size = 76, strokeW = 6 }: any) {
  const r = (size - strokeW * 2) / 2;
  const circ = 2 * Math.PI * r;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
      {/* Current */}
      <div style={{ position: "relative", width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: "rotate(-90deg)", position: "absolute" }}>
          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#e2e8f0" strokeWidth={strokeW} />
          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#10b981" strokeWidth={strokeW}
            strokeDasharray={`${circ * (current / 9)} ${circ}`} strokeLinecap="round" />
        </svg>
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          <span style={{ fontSize: size * 0.28, fontWeight: 800, color: "#10b981", lineHeight: 1, fontFamily: "'Sora',sans-serif" }}>{current}</span>
          <span style={{ fontSize: 9, color: "#94a3b8", fontWeight: 600 }}>hiện tại</span>
        </div>
      </div>

      {/* Arrow */}
      <svg width="22" height="14" viewBox="0 0 22 14" fill="none" style={{ flexShrink: 0 }}>
        <path d="M1 7h20M14 1l7 6-7 6" stroke="#3b82f6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>

      {/* Target */}
      <div style={{ position: "relative", width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: "rotate(-90deg)", position: "absolute" }}>
          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#e2e8f0" strokeWidth={strokeW} />
          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#3b82f6" strokeWidth={strokeW}
            strokeDasharray={`${circ * (target / 9)} ${circ}`} strokeLinecap="round"
            strokeDashoffset="0" style={{ opacity: 0.6 }} />
        </svg>
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          <span style={{ fontSize: size * 0.28, fontWeight: 800, color: "#3b82f6", lineHeight: 1, fontFamily: "'Sora',sans-serif" }}>{target}</span>
          <span style={{ fontSize: 9, color: "#94a3b8", fontWeight: 600 }}>mục tiêu</span>
        </div>
      </div>
    </div>
  );
}

// ─── TRANSLATION HELPER ────────────────────────────────────────────────────────
const translateCriterion = (name: string, taskType: string) => {
  if (!name) return "";
  if (name.includes("Task Achievement") || (name.includes("Task") && taskType === "task1")) return "Hoàn thành yêu cầu (Task Achievement)";
  if (name.includes("Task Response") || (name.includes("Task") && taskType === "task2")) return "Đáp ứng yêu cầu (Task Response)";
  if (name.includes("Coherence")) return "Mạch lạc & Liên kết (CC)";
  if (name.includes("Lexical")) return "Vốn từ vựng (LR)";
  if (name.includes("Grammatical") || name.includes("Grammar")) return "Ngữ pháp & Chính xác (GRA)";
  return name;
};

// ─── CRITERIA PROGRESS BARS ───────────────────────────────────────────────────
function CriteriaProgress({ criteria, targetBand, taskType, onTabChange }: any) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, flex: 1, minWidth: 260 }}>
      {criteria?.map((c: any) => {
        const tag = tagMap[c.name] || "task";
        const color = criterionColors[tag];
        const achieved = c.score >= targetBand;
        const pct = Math.min(100, (c.score / targetBand) * 100);
        const gap = Math.max(0, targetBand - c.score);
        const barColor = achieved ? "#10b981" : gap > 0.5 ? "#f59e0b" : "#3b82f6";

        return (
          <div key={c.name}
            onClick={() => onTabChange(tag)}
            style={{
              background: achieved ? "#f0fdf4" : "#f8fafc",
              border: `1px solid ${achieved ? "#bbf7d0" : "#e2e8f0"}`,
              borderLeft: `3px solid ${color}`,
              borderRadius: 8,
              padding: "9px 12px",
              cursor: "pointer",
              transition: "all .15s",
            }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <span style={{ fontSize: 10, color: "#64748b", fontWeight: 600, lineHeight: 1.3 }}>
                {translateCriterion(c.name, taskType)}
              </span>
              <span style={{ fontSize: 10, fontWeight: 700, color: achieved ? "#16a34a" : "#d97706" }}>
                {achieved ? "✓" : `+${gap.toFixed(1)}`}
              </span>
            </div>
            <div style={{ height: 5, background: "#e2e8f0", borderRadius: 99, overflow: "hidden", marginBottom: 5 }}>
              <div style={{ height: "100%", width: `${pct}%`, background: barColor, borderRadius: 99, transition: "width .8s cubic-bezier(.4,0,.2,1)" }} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "#94a3b8" }}>
              <span style={{ fontWeight: 700, color: "#334155" }}>{c.score.toFixed(1)}</span>
              <span>{achieved ? "đạt rồi" : `cần ${targetBand}`}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── SCORE HEADER (NEW) ───────────────────────────────────────────────────────
function ScoreHeader({ result, onTabChange }: any) {
  const { bandScore, criteria, taskType, estimatedCefrLevel, confidence } = result;
  const targetBand = result.targetBand || 6.5;

  // Find weakest criterion (farthest from target)
  const weakest = criteria?.reduce((a: any, b: any) => {
    const gapA = Math.max(0, targetBand - a.score);
    const gapB = Math.max(0, targetBand - b.score);
    return gapB > gapA ? b : a;
  });
  const weakestTag = tagMap[weakest?.name] || "task";
  const weakestGap = Math.max(0, targetBand - (weakest?.score || 0));

  return (
    <div style={{ background: "#fff", borderBottom: "1px solid #e2e8f0", padding: "16px 28px" }}>
      <div style={{ maxWidth: 1440, margin: "0 auto", display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" }}>

        <DualRing current={bandScore} target={targetBand} />

        <div style={{ display: "flex", flexDirection: "column", gap: 8, minWidth: 200, maxWidth: 280 }}>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            <span style={{ background: "#e0e7ff", color: "#4338ca", fontSize: 10, fontWeight: 800, padding: "2px 9px", borderRadius: 99 }}>
              {taskType?.toUpperCase()}
            </span>
            <span style={{ background: "#d1fae5", color: "#065f46", fontSize: 10, fontWeight: 800, padding: "2px 9px", borderRadius: 99 }}>
              {estimatedCefrLevel}
            </span>
            <span style={{ fontSize: 11, color: confidence === "high" ? "#16a34a" : "#f59e0b", display: "flex", alignItems: "center", gap: 3 }}>
              ● Độ tin cậy {confidence === "high" ? "cao" : confidence === "medium" ? "trung bình" : "thấp"}
            </span>
          </div>

          {weakestGap > 0 ? (
            <div style={{
              background: "#fffbeb", border: "1px solid #fde68a",
              borderLeft: `3px solid ${criterionColors[weakestTag]}`,
              borderRadius: 8, padding: "8px 12px", fontSize: 12, color: "#78350f", lineHeight: 1.5,
            }}>
              Tập trung vào{" "}
              <span style={{ fontWeight: 700, color: criterionColors[weakestTag] }}>
                {translateCriterion(weakest?.name, taskType)}
              </span>
              {" "}— cải thiện <strong>+{weakestGap.toFixed(1)}</strong> là đủ điều kiện lên band {targetBand}
            </div>
          ) : (
            <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 8, padding: "8px 12px", fontSize: 12, color: "#14532d", lineHeight: 1.5 }}>
              ✓ Tất cả tiêu chí đều đạt mục tiêu band {targetBand}
            </div>
          )}
        </div>

        <CriteriaProgress criteria={criteria} targetBand={targetBand} taskType={taskType} onTabChange={onTabChange} />
      </div>
    </div>
  );
}

// ─── LABEL BADGE ─────────────────────────────────────────────────────────────
function LabelBadge({ label, level }: any) {
  const isGood = level?.includes("tốt") || level?.includes("xuất sắc") || level?.includes("thành thạo") || level?.includes("đầy đủ") || level?.includes("phong phú") || level?.includes("Rất đa dạng") || level?.includes("Ít lỗi") || level?.includes("hiệu quả");
  const isMed = level?.includes("Trung bình") || level?.includes("Minor") || level?.includes("một phần") || level?.includes("Hạn chế");
  const bg = isGood ? "#d1fae5" : isMed ? "#fef9c3" : "#fee2e2";
  const color = isGood ? "#065f46" : isMed ? "#78350f" : "#991b1b";
  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: bg, color, borderRadius: 6, padding: "5px 12px", fontSize: 11, fontWeight: 800, letterSpacing: ".04em" }}>
      <span>{isGood ? "✓" : isMed ? "◐" : "✗"}</span>
      <span>{label}</span>
    </div>
  );
}

// ─── ANALYSIS SECTION ────────────────────────────────────────────────────────
function AnalysisSection({ title, level, label, summary, tips, children }: any) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ borderBottom: "1px solid #f1f5f9", paddingBottom: 16, marginBottom: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: 10 }}>
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#64748b", marginBottom: 6 }}>{title}</div>
          <LabelBadge label={label} level={level} />
        </div>
        <button onClick={() => setOpen(o => !o)} style={{ background: "none", border: "1px solid #e2e8f0", borderRadius: 6, padding: "4px 10px", fontSize: 11, color: "#64748b", cursor: "pointer", whiteSpace: "nowrap", fontFamily: "inherit" }}>
          {open ? "Thu gọn ▲" : "Xem chi tiết ▼"}
        </button>
      </div>
      {open && (
        <div style={{ animation: "fadeIn .2s ease" }}>
          <div style={{ background: "#f8fafc", borderRadius: 8, padding: "12px 14px", marginBottom: 10 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 6 }}>Nhận xét</div>
            <p style={{ margin: 0, fontSize: 13, color: "#334155", lineHeight: 1.7 }}>{summary}</p>
          </div>
          {tips?.length > 0 && (
            <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 8, padding: "12px 14px" }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#92400e", marginBottom: 8 }}>Cách cải thiện</div>
              {tips.map((t: string, i: number) => (
                <div key={i} style={{ display: "flex", gap: 8, marginBottom: 6, fontSize: 13, color: "#78350f", lineHeight: 1.6 }}>
                  <span style={{ color: "#d97706", flexShrink: 0 }}>•</span>
                  <span>{t}</span>
                </div>
              ))}
            </div>
          )}
          {children}
        </div>
      )}
    </div>
  );
}

// ─── ESSAY PANEL ─────────────────────────────────────────────────────────────
function EssayPanel({ essay, sentenceFeedback, activeSentence, onSentenceClick }: any) {
  const findFeedback = (sentence: string) =>
    sentenceFeedback?.find((f: any) => sentence.includes(f.original.slice(0, 40)) || f.original.includes(sentence.slice(0, 40)));

  return (
    <div style={{ fontSize: 14, lineHeight: 1.9, color: "#334155", fontFamily: "'Lora', Georgia, serif" }}>
      {essay.split("\n\n").map((para: string, pi: number) => (
        <p key={pi} style={{ marginBottom: 16, marginTop: 0 }}>
          {para.split(/(?<=[.!?])\s+/).map((sentence: string, si: number) => {
            const fb = findFeedback(sentence);
            const isActive = activeSentence === fb?.original;
            const hasFb = !!fb;
            return (
              <span key={si}
                onClick={() => hasFb && onSentenceClick(fb.original)}
                style={{
                  background: isActive ? criterionColors[fb?.criterionTag] + "30" : hasFb ? criterionColors[fb?.criterionTag] + "14" : "transparent",
                  borderBottom: hasFb ? `2px solid ${criterionColors[fb?.criterionTag]}` : "none",
                  borderRadius: 2, cursor: hasFb ? "pointer" : "text",
                  padding: hasFb ? "1px 2px" : "0", transition: "background .2s", display: "inline",
                }}>
                {sentence}{" "}
              </span>
            );
          })}
        </p>
      ))}
    </div>
  );
}

// ─── SENTENCE FEEDBACK CARD ───────────────────────────────────────────────────
function SentenceCard({ fb, isActive, onClick }: any) {
  const color = criterionColors[fb.criterionTag] || "#6366f1";
  return (
    <div onClick={onClick} style={{
      border: `1.5px solid ${isActive ? color : "#e2e8f0"}`, borderLeft: `4px solid ${color}`,
      borderRadius: 10, padding: "14px 16px", marginBottom: 10, cursor: "pointer",
      background: isActive ? color + "08" : "#fff", transition: "all .2s",
      boxShadow: isActive ? `0 4px 16px ${color}22` : "none",
    }}>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
        {fb.issues.map((issue: string) => {
          const c = issueColors[issue] || issueColors.grammar;
          return <span key={issue} style={{ background: c.bg, color: c.text, fontSize: 10, fontWeight: 800, padding: "2px 8px", borderRadius: 99, letterSpacing: ".04em" }}>{c.label}</span>;
        })}
        <span style={{ marginLeft: "auto", fontSize: 10, fontWeight: 700, color: fb.severity === "major" ? "#ef4444" : "#94a3b8" }}>
          {fb.severity === "major" ? "⚠ Major" : "• Minor"}
        </span>
      </div>
      <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 6, fontStyle: "italic", textDecoration: "line-through" }}>
        {fb.original.length > 100 ? fb.original.slice(0, 100) + "…" : fb.original}
      </div>
      <div style={{ fontSize: 13, color: "#0f172a", fontWeight: 500, marginBottom: 8, lineHeight: 1.6 }}>→ {fb.suggestion}</div>
      <div style={{ fontSize: 12, color: "#64748b", lineHeight: 1.5, display: "flex", gap: 6 }}>
        <span>💡</span><span>{fb.explanation}</span>
      </div>
    </div>
  );
}

// ─── CRITERION PANEL ─────────────────────────────────────────────────────────
function CriterionPanel({ tab, result, activeSentence, setActiveSentence }: any) {
  const { sentenceFeedback, grammarAnalysis, coherenceAnalysis, lexicalAnalysis, taskAnalysis } = result;

  const filtered = sentenceFeedback?.filter((f: any) =>
    tab === "all" ? true : f.criterionTag === tab
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0, height: "100%", overflowY: "auto" }}>
      {filtered?.length > 0 && (
        <div style={{ padding: "16px 20px", borderBottom: "1px solid #f1f5f9" }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: "#94a3b8", letterSpacing: ".06em", marginBottom: 12 }}>GỢI Ý SỬA CÂU ({filtered.length})</div>
          {filtered.map((fb: any, i: number) => (
            <SentenceCard key={i} fb={fb} isActive={activeSentence === fb.original} onClick={() => setActiveSentence(activeSentence === fb.original ? null : fb.original)} />
          ))}
        </div>
      )}

      {(tab === "all" || tab === "task") && taskAnalysis && (
        <div style={{ padding: "16px 20px", borderBottom: "1px solid #f1f5f9" }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: "#94a3b8", letterSpacing: ".06em", marginBottom: 14 }}>NHẬN XÉT {result?.taskType === "task1" ? "HOÀN THÀNH YÊU CẦU" : "ĐÁP ỨNG YÊU CẦU"}</div>
          <AnalysisSection title="Mức độ đáp ứng đề" level={taskAnalysis.responseLevel} label={taskAnalysis.responseLabel} summary={taskAnalysis.responseSummary} tips={taskAnalysis.responseTips} />
          <AnalysisSection title="Phát triển ý tưởng" level={taskAnalysis.ideaDevelopmentLevel} label={taskAnalysis.ideaDevelopmentLabel} summary={taskAnalysis.ideaDevelopmentSummary} tips={taskAnalysis.ideaDevelopmentTips} />
        </div>
      )}

      {(tab === "all" || tab === "grammar") && grammarAnalysis && (
        <div style={{ padding: "16px 20px", borderBottom: "1px solid #f1f5f9" }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: "#94a3b8", letterSpacing: ".06em", marginBottom: 14 }}>NHẬN XÉT NGỮ PHÁP</div>
          <AnalysisSection title="Sự đa dạng cấu trúc" level={grammarAnalysis.diversityLevel} label={grammarAnalysis.diversityLabel} summary={grammarAnalysis.diversitySummary} tips={grammarAnalysis.diversityTips} />
          <AnalysisSection title="Chính xác" level={grammarAnalysis.accuracyLevel} label={grammarAnalysis.accuracyLabel} summary={grammarAnalysis.accuracySummary} tips={grammarAnalysis.accuracyTips}>
            {grammarAnalysis.commonErrors?.length > 0 && (
              <div style={{ marginTop: 10 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 8 }}>Lỗi thường gặp</div>
                {grammarAnalysis.commonErrors.map((e: any, i: number) => (
                  <div key={i} style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8, padding: "10px 12px", marginBottom: 8 }}>
                    <div style={{ fontSize: 12, color: "#ef4444", fontWeight: 600, marginBottom: 4 }}>{e.pattern}</div>
                    <div style={{ fontSize: 12, color: "#64748b" }}><s>{e.example}</s> → <strong style={{ color: "#0f172a" }}>{e.fix}</strong></div>
                    <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 4 }}>{e.rule}</div>
                  </div>
                ))}
              </div>
            )}
          </AnalysisSection>
        </div>
      )}

      {(tab === "all" || tab === "coherence") && coherenceAnalysis && (
        <div style={{ padding: "16px 20px", borderBottom: "1px solid #f1f5f9" }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: "#94a3b8", letterSpacing: ".06em", marginBottom: 14 }}>NHẬN XÉT MẠCH LẠC & LIÊN KẾT</div>
          <AnalysisSection title="Mạch văn" level={coherenceAnalysis.flowLevel} label={coherenceAnalysis.flowLabel} summary={coherenceAnalysis.flowSummary} tips={coherenceAnalysis.flowTips} />
          <AnalysisSection title="Chia đoạn" level={coherenceAnalysis.paragraphLevel} label={coherenceAnalysis.paragraphLabel} summary={coherenceAnalysis.paragraphSummary} tips={coherenceAnalysis.paragraphTips} />
          <AnalysisSection title="Liên kết từ/câu (Referencing)" level={coherenceAnalysis.referencingLevel} label={coherenceAnalysis.referencingLabel} summary={coherenceAnalysis.referencingSummary} tips={coherenceAnalysis.referencingTips} />
          {coherenceAnalysis.linkingWordsUsed?.length > 0 && (
            <div style={{ marginTop: 4 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 8 }}>Từ nối đã dùng</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {coherenceAnalysis.linkingWordsUsed.map((w: string) => (
                  <span key={w} style={{ background: "#d1fae5", color: "#065f46", fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 99 }}>{w}</span>
                ))}
              </div>
              {coherenceAnalysis.missingLinks?.length > 0 && (
                <div style={{ marginTop: 10 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 8 }}>Có thể thêm</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {coherenceAnalysis.missingLinks.map((w: string) => (
                      <span key={w} style={{ background: "#fef9c3", color: "#92400e", fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 99 }}>+ {w}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {(tab === "all" || tab === "lexical") && lexicalAnalysis && (
        <div style={{ padding: "16px 20px", borderBottom: "1px solid #f1f5f9" }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: "#94a3b8", letterSpacing: ".06em", marginBottom: 14 }}>NHẬN XÉT TỪ VỰNG</div>
          <AnalysisSection title="Sự đa dạng từ vựng" level={lexicalAnalysis.diversityLevel} label={lexicalAnalysis.diversityLabel} summary={lexicalAnalysis.diversitySummary} tips={lexicalAnalysis.diversityTips} />
          {lexicalAnalysis.overusedWords?.length > 0 && (
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 8 }}>Từ dùng quá nhiều</div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {lexicalAnalysis.overusedWords.map((w: string) => (
                  <span key={w} style={{ background: "#fee2e2", color: "#991b1b", fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 99 }}>⚠ {w}</span>
                ))}
              </div>
            </div>
          )}
          {lexicalAnalysis.suggestedUpgrades?.length > 0 && (
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 8 }}>Nâng cấp từ vựng</div>
              {lexicalAnalysis.suggestedUpgrades.map((u: any, i: number) => (
                <div key={i} style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8, padding: "10px 12px", marginBottom: 8 }}>
                  <div style={{ fontSize: 12, marginBottom: 4 }}>
                    <span style={{ background: "#fee2e2", color: "#991b1b", padding: "1px 6px", borderRadius: 4, fontWeight: 600 }}>{u.original}</span>
                    <span style={{ color: "#94a3b8", margin: "0 6px" }}>→</span>
                    <span style={{ background: "#d1fae5", color: "#065f46", padding: "1px 6px", borderRadius: 4, fontWeight: 600 }}>{u.upgrade}</span>
                  </div>
                  <div style={{ fontSize: 12, color: "#64748b", fontStyle: "italic" }}>"{u.example}"</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === "all" && (
        <div style={{ padding: "16px 20px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
            <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 10, padding: "14px 16px" }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: "#15803d", letterSpacing: ".04em", marginBottom: 10 }}>💪 ĐIỂM MẠNH</div>
              {result.strengths?.map((s: string, i: number) => (
                <div key={i} style={{ display: "flex", gap: 8, marginBottom: 8, fontSize: 13, color: "#14532d", lineHeight: 1.6 }}>
                  <span style={{ color: "#16a34a", flexShrink: 0 }}>✓</span><span>{s}</span>
                </div>
              ))}
            </div>
            <div style={{ background: "#fff7ed", border: "1px solid #fed7aa", borderRadius: 10, padding: "14px 16px" }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: "#c2410c", letterSpacing: ".04em", marginBottom: 10 }}>⚠ ĐIỂM YẾU</div>
              {result.weaknesses?.map((w: string, i: number) => (
                <div key={i} style={{ display: "flex", gap: 8, marginBottom: 8, fontSize: 13, color: "#9a3412", lineHeight: 1.6 }}>
                  <span style={{ color: "#ea580c", flexShrink: 0 }}>✗</span><span>{w}</span>
                </div>
              ))}
            </div>
          </div>
          <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10, padding: "14px 16px" }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: "#475569", letterSpacing: ".04em", marginBottom: 10 }}>🎯 GỢI Ý CẢI THIỆN</div>
            {result.suggestions?.map((s: string, i: number) => (
              <div key={i} style={{ display: "flex", gap: 10, marginBottom: 8, fontSize: 13, color: "#334155", lineHeight: 1.6 }}>
                <span style={{ background: "#e0e7ff", color: "#4338ca", width: 20, height: 20, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, flexShrink: 0 }}>{i + 1}</span>
                <span>{s}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
export default function IeltsWritingResult({ result, essay }: any) {
  const [activeSentence, setActiveSentence] = useState(null);
  const [activeTab, setActiveTab] = useState("all");
  const feedbackRef = useRef<any>(null);

  const tabs = [
    { key: "all", label: "Tổng quan" },
    { key: "task", label: result?.taskType === "task1" ? "Hoàn thành yêu cầu" : "Đáp ứng yêu cầu", color: criterionColors.task },
    { key: "coherence", label: "Mạch lạc", color: criterionColors.coherence },
    { key: "lexical", label: "Từ vựng", color: criterionColors.lexical },
    { key: "grammar", label: "Ngữ pháp", color: criterionColors.grammar },
  ];

  useEffect(() => {
    if (activeSentence && feedbackRef.current) {
      feedbackRef.current.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [activeSentence]);

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", background: "#f8fafc", minHeight: "100vh" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=Sora:wght@700;800&family=Lora:ital,wght@0,400;0,500;1,400&display=swap" rel="stylesheet" />

      <ScoreHeader result={result} onTabChange={(tab: any) => setActiveTab(tab)} />

      <div style={{ maxWidth: 1440, margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0, minHeight: "calc(100vh - 150px)" }}>
        {/* LEFT: Essay */}
        <div style={{ borderRight: "1px solid #e2e8f0", padding: "24px 28px" }}>
          <div style={{ display: "flex", gap: 12, marginBottom: 18, flexWrap: "wrap" }}>
            <span style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600 }}>HIGHLIGHT:</span>
            {Object.entries(criterionColors).map(([k, color]: any) => (
              <div key={k} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "#64748b" }}>
                <div style={{ width: 12, height: 3, background: color, borderRadius: 2 }} />
                {k === "task" ? "Task" : k === "coherence" ? "Mạch lạc" : k === "lexical" ? "Từ vựng" : "Ngữ pháp"}
              </div>
            ))}
            <span style={{ fontSize: 11, color: "#94a3b8", marginLeft: "auto" }}>Click câu được gạch chân để xem nhận xét</span>
          </div>

          {activeSentence && (() => {
            const fb = result.sentenceFeedback?.find((f: any) => f.original === activeSentence);
            if (!fb) return null;
            const color = criterionColors[fb.criterionTag];
            return (
              <div style={{ background: color + "0f", border: `1.5px solid ${color}`, borderRadius: 12, padding: "14px 16px", marginBottom: 20, position: "relative" }}>
                <button onClick={() => setActiveSentence(null)} style={{ position: "absolute", top: 10, right: 12, background: "none", border: "none", cursor: "pointer", color: "#94a3b8", fontSize: 16 }}>✕</button>
                <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
                  {fb.issues.map((i: string) => {
                    const c = issueColors[i] || issueColors.grammar;
                    return <span key={i} style={{ background: c.bg, color: c.text, fontSize: 10, fontWeight: 800, padding: "2px 8px", borderRadius: 99 }}>{c.label}</span>;
                  })}
                </div>
                <div style={{ fontSize: 13, color: "#64748b", textDecoration: "line-through", marginBottom: 6, fontStyle: "italic" }}>{fb.original}</div>
                <div style={{ fontSize: 13.5, color: "#0f172a", fontWeight: 600, marginBottom: 8 }}>✦ {fb.suggestion}</div>
                <div style={{ fontSize: 12, color: "#64748b" }}>💡 {fb.explanation}</div>
              </div>
            );
          })()}

          <EssayPanel essay={essay} sentenceFeedback={result.sentenceFeedback} activeSentence={activeSentence} onSentenceClick={(s: any) => setActiveSentence(activeSentence === s ? null : s)} />
        </div>

        {/* RIGHT: Feedback panel */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ borderBottom: "1px solid #e2e8f0", display: "flex", overflowX: "auto", flexShrink: 0 }}>
            {tabs.map(t => (
              <button key={t.key} onClick={() => setActiveTab(t.key)} style={{
                padding: "12px 14px", border: "none", background: "none", cursor: "pointer",
                fontSize: 12, fontWeight: activeTab === t.key ? 700 : 500,
                color: activeTab === t.key ? (t.color || "#0f172a") : "#94a3b8",
                borderBottom: activeTab === t.key ? `2.5px solid ${t.color || "#0f172a"}` : "2.5px solid transparent",
                whiteSpace: "nowrap", fontFamily: "inherit", transition: "all .15s",
              }}>{t.label}</button>
            ))}
          </div>
          <div ref={feedbackRef} style={{ flex: 1, background: "#fff" }}>
            <CriterionPanel tab={activeTab} result={result} activeSentence={activeSentence} setActiveSentence={setActiveSentence} />
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: none; } }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 5px; height: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
      `}</style>
    </div>
  );
}

// D:\Ed_Vision\Ed_Vision\src\modules\student\ToeicLearningMapPage.tsx
import { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Flag,
  Lock,
  CheckCircle2,
  Star,
  Headphones,
  BookOpen,
  Zap,
  TrendingUp,
  ChevronLeft,
} from "lucide-react";
import Header from "../../components/layout/Header";
import Footer from "../../components/layout/Footer";
import { useToeicScrollReset } from "../../hooks/useToeicScrollReset";
import { useAuth } from "@/hooks/useAuth";
import { getToeicIntakeProfile } from "./toeicIntake";
import { getToeicReservePoints, getToeicPlanSync } from "@/services/api/certificateService";
import {
  calculateToeicPracticeScore,
  type ToeicScoreResult,
} from "./toeicPracticeScore";

// ── Types ──────────────────────────────────────────────────────────────────
interface NodeInfo {
  id: number;
  title: string;
  subtitle: string;
  difficulty: string;
  difficultyColor: string;
  description: string;
  partLabel: string;
  icon: string;
  questionsCount: number;
  scorePerCorrect: number;
  xPos: number;
  yPos: number;
}

interface SkillMapState {
  unlockedUpTo: number;
  completedNodes: number[];
  nodeScores: number[];
}

interface LearningMapState {
  listening: SkillMapState;
  reading: SkillMapState;
}

const MAP_STORAGE_KEY_PREFIX = "edvision.toeic.learningmap.v2";

/** Storage key scoped theo user — tránh acc mới đọc data acc cũ */
function getMapStorageKey(userId: string | number | undefined): string {
  return userId ? `${MAP_STORAGE_KEY_PREFIX}.${userId}` : MAP_STORAGE_KEY_PREFIX;
}

// ── Listening: 5 separate nodes (Part 1, 2, 3, 4, Advanced) ───────────────
const LISTENING_NODES: NodeInfo[] = [
  {
    id: 0,
    title: "Part 1",
    subtitle: "Photographs",
    difficulty: "Cơ bản",
    difficultyColor: "text-emerald-600",
    description:
      "Xem ảnh và chọn câu mô tả đúng nhất — kỹ năng quan sát và từ vựng hình ảnh",
    partLabel: "PART 1",
    icon: "🖼️",
    questionsCount: 10,
    scorePerCorrect: 2,
    xPos: 75,
    yPos: 420,
  },
  {
    id: 1,
    title: "Part 2",
    subtitle: "Question-Response",
    difficulty: "Cơ bản",
    difficultyColor: "text-emerald-600",
    description:
      "Nghe câu hỏi và chọn câu trả lời phù hợp nhất — tốc độ phản xạ và ngữ điệu",
    partLabel: "PART 2",
    icon: "💬",
    questionsCount: 10,
    scorePerCorrect: 2.5,
    xPos: 270,
    yPos: 320,
  },
  {
    id: 2,
    title: "Part 3",
    subtitle: "Conversations",
    difficulty: "Trung bình",
    difficultyColor: "text-amber-600",
    description:
      "Hội thoại ngắn giữa 2-3 người — hiểu ý chính, chi tiết và ngầm ý",
    partLabel: "PART 3",
    icon: "🎧",
    questionsCount: 10,
    scorePerCorrect: 2.5,
    xPos: 80,
    yPos: 215,
  },
  {
    id: 3,
    title: "Part 4",
    subtitle: "Short Talks",
    difficulty: "Khá",
    difficultyColor: "text-orange-600",
    description:
      "Bài phát biểu ngắn — nắm bắt thông tin quan trọng từ thông báo, quảng cáo",
    partLabel: "PART 4",
    icon: "🎙️",
    questionsCount: 10,
    scorePerCorrect: 2.5,
    xPos: 265,
    yPos: 115,
  },
  {
    id: 4,
    title: "Mock Exam",
    subtitle: "Thi Thử Listening",
    difficulty: "Thực tế",
    difficultyColor: "text-purple-600",
    description:
      "Làm bài thi thử với cấu trúc chuẩn để đánh giá trình độ hiện tại",
    partLabel: "MOCK EXAM",
    icon: "🏆",
    questionsCount: 100,
    scorePerCorrect: 5,
    xPos: 170,
    yPos: 35,
  },
];

// ── Reading: 4 separate nodes (Part 5, 6, 7, Advanced) ────────────────────
const READING_NODES: NodeInfo[] = [
  {
    id: 0,
    title: "Part 5",
    subtitle: "Incomplete Sentences",
    difficulty: "Cơ bản",
    difficultyColor: "text-emerald-600",
    description:
      "Điền từ vào câu hoàn chỉnh — trắc nghiệm ngữ pháp và từ vựng từng câu",
    partLabel: "PART 5",
    icon: "✏️",
    questionsCount: 10,
    scorePerCorrect: 2,
    xPos: 75,
    yPos: 400,
  },
  {
    id: 1,
    title: "Part 6",
    subtitle: "Text Completion",
    difficulty: "Cơ bản",
    difficultyColor: "text-emerald-600",
    description: "Điền từ vào đoạn văn ngắn — hiểu mạch văn và chọn từ phù hợp",
    partLabel: "PART 6",
    icon: "📝",
    questionsCount: 10,
    scorePerCorrect: 2.5,
    xPos: 270,
    yPos: 280,
  },
  {
    id: 2,
    title: "Part 7",
    subtitle: "Reading Comprehension",
    difficulty: "Trung bình",
    difficultyColor: "text-amber-600",
    description:
      "Đọc đoạn văn đơn lẻ và đa đoạn — trả lời câu hỏi chi tiết và suy luận",
    partLabel: "PART 7",
    icon: "📄",
    questionsCount: 10,
    scorePerCorrect: 2.5,
    xPos: 80,
    yPos: 160,
  },
  {
    id: 3,
    title: "Mock Exam",
    subtitle: "Thi Thử Reading",
    difficulty: "Thực tế",
    difficultyColor: "text-purple-600",
    description:
      "Làm bài thi thử với cấu trúc chuẩn để đánh giá trình độ hiện tại",
    partLabel: "MOCK EXAM",
    icon: "🏆",
    questionsCount: 100,
    scorePerCorrect: 5,
    xPos: 170,
    yPos: 45,
  },
];

function loadMapState(userId?: string | number): LearningMapState {
  try {
    const key = getMapStorageKey(userId);
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw) as LearningMapState;
  } catch {
    /* ignore */
  }
  return {
    listening: { unlockedUpTo: 0, completedNodes: [], nodeScores: [] },
    reading: { unlockedUpTo: 0, completedNodes: [], nodeScores: [] },
  };
}

// ── Realistic Mountain SVG Background ─────────────────────────────────────
function RealisticMountainBg({ isListening }: { isListening: boolean }) {
  const skyTop = isListening ? "#b8e4f9" : "#b8f0d4";
  const skyBot = isListening ? "#dff2fc" : "#d4fbe8";
  const mtnFar1 = isListening ? "#90cce8" : "#7dd9b0";
  const mtnFar2 = isListening ? "#6fb8da" : "#5cc99a";
  const mtnNear1 = isListening ? "#4a9fc8" : "#3caa7a";
  const mtnNear2 = isListening ? "#2b82b2" : "#1e9463";
  const snowColor = "#f0f9ff";
  const grassColor = isListening ? "#a3d9a5" : "#5ec87e";
  const treeColor = isListening ? "#2d7d32" : "#1b5e20";
  const treeTrunk = "#5d4037";

  return (
    <g>
      {/* Sky gradient rect */}
      <defs>
        <linearGradient id="skyBg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={skyTop} />
          <stop offset="100%" stopColor={skyBot} />
        </linearGradient>
        <linearGradient id="mtnGrad1" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={mtnFar1} />
          <stop offset="100%" stopColor={mtnFar2} />
        </linearGradient>
        <linearGradient id="mtnGrad2" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={mtnNear1} />
          <stop offset="100%" stopColor={mtnNear2} />
        </linearGradient>
      </defs>
      <rect width="360" height="500" fill="url(#skyBg)" />

      {/* Sun / glow */}
      <circle cx="310" cy="45" r="22" fill="#fff9c4" opacity="0.8" />
      <circle cx="310" cy="45" r="35" fill="#fff9c4" opacity="0.25" />

      {/* Clouds */}
      <ellipse cx="60" cy="55" rx="30" ry="12" fill="white" opacity="0.7" />
      <ellipse cx="80" cy="48" rx="22" ry="14" fill="white" opacity="0.8" />
      <ellipse cx="40" cy="52" rx="18" ry="10" fill="white" opacity="0.6" />
      <ellipse cx="220" cy="35" rx="24" ry="10" fill="white" opacity="0.6" />
      <ellipse cx="240" cy="30" rx="16" ry="11" fill="white" opacity="0.7" />

      {/* Far mountains (back layer) */}
      <polygon
        points="0,280 90,120 180,280"
        fill="url(#mtnGrad1)"
        opacity="0.55"
      />
      <polygon
        points="90,120 130,155 180,280 0,280"
        fill={mtnFar2}
        opacity="0.3"
      />
      {/* Snow cap far-left */}
      <polygon points="90,120 78,158 102,158" fill={snowColor} opacity="0.9" />

      <polygon
        points="150,300 270,110 360,300"
        fill="url(#mtnGrad1)"
        opacity="0.5"
      />
      <polygon
        points="270,110 255,148 285,148"
        fill={snowColor}
        opacity="0.9"
      />

      {/* Mid mountains */}
      <polygon
        points="0,340 120,160 240,340"
        fill="url(#mtnGrad2)"
        opacity="0.7"
      />
      <polygon
        points="120,160 105,200 135,200"
        fill={snowColor}
        opacity="0.95"
      />
      <polygon
        points="108,172 120,160 132,172 125,185 115,185"
        fill={snowColor}
        opacity="0.6"
      />

      <polygon
        points="160,360 310,130 360,360"
        fill="url(#mtnGrad2)"
        opacity="0.65"
      />
      <polygon
        points="310,130 296,168 324,168"
        fill={snowColor}
        opacity="0.95"
      />

      {/* Rock accents */}
      <polygon points="85,300 100,275 115,300" fill="#78909c" opacity="0.4" />
      <polygon points="240,320 260,295 280,320" fill="#78909c" opacity="0.35" />

      {/* Ground / grass hill */}
      <ellipse
        cx="180"
        cy="440"
        rx="250"
        ry="80"
        fill={grassColor}
        opacity="0.6"
      />
      <rect
        x="0"
        y="440"
        width="360"
        height="60"
        fill={grassColor}
        opacity="0.8"
      />

      {/* Conifer trees – left cluster */}
      {[
        [18, 390],
        [35, 380],
        [52, 395],
        [10, 405],
      ].map(([tx, ty], i) => (
        <g key={`treeL${i}`} transform={`translate(${tx},${ty})`}>
          <rect
            x="-2"
            y="0"
            width="4"
            height="14"
            fill={treeTrunk}
            opacity="0.7"
          />
          <polygon
            points="-9,-28 0,-50 9,-28"
            fill={treeColor}
            opacity="0.85"
          />
          <polygon points="-7,-15 0,-35 7,-15" fill={treeColor} opacity="0.9" />
          <polygon points="-5,-5 0,-20 5,-5" fill={treeColor} />
        </g>
      ))}

      {/* Conifer trees – right cluster */}
      {[
        [305, 375],
        [325, 365],
        [342, 380],
        [355, 395],
      ].map(([tx, ty], i) => (
        <g key={`treeR${i}`} transform={`translate(${tx},${ty})`}>
          <rect
            x="-2"
            y="0"
            width="4"
            height="12"
            fill={treeTrunk}
            opacity="0.7"
          />
          <polygon
            points="-8,-26 0,-46 8,-26"
            fill={treeColor}
            opacity="0.85"
          />
          <polygon points="-6,-14 0,-32 6,-14" fill={treeColor} opacity="0.9" />
          <polygon points="-4,-4 0,-18 4,-4" fill={treeColor} />
        </g>
      ))}

      {/* Small wildflowers */}
      {[
        [60, 448],
        [90, 452],
        [200, 455],
        [240, 450],
        [290, 453],
      ].map(([fx, fy], i) => (
        <g key={`fl${i}`}>
          <circle
            cx={fx}
            cy={fy}
            r="3"
            fill={isListening ? "#ffd54f" : "#ff8f00"}
            opacity="0.7"
          />
        </g>
      ))}

      {/* Path/trail suggestion at bottom */}
      <path
        d="M 40 470 Q 180 455 340 470"
        stroke="#c8a96e"
        strokeWidth="3"
        fill="none"
        opacity="0.5"
        strokeDasharray="8 5"
      />
    </g>
  );
}

// ── Node Component ─────────────────────────────────────────────────────────
function MapNode({
  node,
  isUnlocked,
  isCompleted,
  isCurrent,
  isSelected,
  isSummit,
  onClick,
}: {
  node: NodeInfo;
  isUnlocked: boolean;
  isCompleted: boolean;
  isCurrent: boolean;
  isSelected: boolean;
  isSummit: boolean;
  onClick: () => void;
}) {
  const r = isSummit ? 24 : 20;
  let fillColor = "#e2e8f0";
  let strokeColor = "#94a3b8";
  let textColor = "#94a3b8";

  if (isCompleted) {
    fillColor = "#10b981";
    strokeColor = "#059669";
    textColor = "#fff";
  } else if (isCurrent) {
    fillColor = "#0ea5e9";
    strokeColor = "#0284c7";
    textColor = "#fff";
  } else if (isUnlocked) {
    fillColor = "#38bdf8";
    strokeColor = "#0284c7";
    textColor = "#fff";
  }
  if (isSelected) strokeColor = "#f59e0b";

  return (
    <g
      transform={`translate(${node.xPos},${node.yPos})`}
      onClick={onClick}
      style={{ cursor: isUnlocked ? "pointer" : "default" }}
    >
      {/* Drop shadow */}
      <circle r={r + 2} fill="rgba(0,0,0,0.15)" transform="translate(2,3)" />
      {/* Pulse for current */}
      {isCurrent && (
        <circle
          r={r + 6}
          fill="none"
          stroke="#0ea5e9"
          strokeWidth="2"
          opacity="0.5"
        >
          <animate
            attributeName="r"
            values={`${r + 4};${r + 10};${r + 4}`}
            dur="2s"
            repeatCount="indefinite"
          />
          <animate
            attributeName="opacity"
            values="0.6;0;0.6"
            dur="2s"
            repeatCount="indefinite"
          />
        </circle>
      )}
      {/* Main circle */}
      <circle
        r={r}
        fill={fillColor}
        stroke={strokeColor}
        strokeWidth={isSelected ? 3 : 2}
        filter={
          isSummit ? "drop-shadow(0 0 8px rgba(251,191,36,0.7))" : undefined
        }
      />
      {/* Inner content */}
      {isSummit ? (
        <text x="0" y="7" textAnchor="middle" fontSize="16">
          🏁
        </text>
      ) : isCompleted ? (
        <text x="0" y="6" textAnchor="middle" fontSize="15" fill={textColor}>
          ✓
        </text>
      ) : !isUnlocked ? (
        <text x="0" y="6" textAnchor="middle" fontSize="13">
          🔒
        </text>
      ) : (
        <text
          x="0"
          y="6"
          textAnchor="middle"
          fontSize="12"
          fill={textColor}
          fontWeight="bold"
        >
          {node.id + 1}
        </text>
      )}
      {/* Labels */}
      <text
        x="0"
        y={r + 15}
        textAnchor="middle"
        fontSize="9.5"
        fill="#1e293b"
        fontWeight="700"
        style={{ textShadow: "0 1px 2px rgba(255,255,255,0.8)" }}
      >
        {node.title}
      </text>
      <text x="0" y={r + 26} textAnchor="middle" fontSize="8" fill="#475569">
        {node.subtitle}
      </text>
    </g>
  );
}

function NodePath({
  from,
  to,
  isCompleted,
}: {
  from: NodeInfo;
  to: NodeInfo;
  isCompleted: boolean;
}) {
  const cx = (from.xPos + to.xPos) / 2 + (from.xPos < to.xPos ? 15 : -15);
  const cy = (from.yPos + to.yPos) / 2;
  const d = `M ${from.xPos} ${from.yPos} Q ${cx} ${cy} ${to.xPos} ${to.yPos}`;
  return (
    <>
      <path
        d={d}
        fill="none"
        stroke="rgba(255,255,255,0.6)"
        strokeWidth="5"
        strokeLinecap="round"
      />
      <path
        d={d}
        fill="none"
        stroke={isCompleted ? "#10b981" : "#cbd5e1"}
        strokeWidth="3"
        strokeDasharray={isCompleted ? "none" : "8 4"}
        strokeLinecap="round"
      />
    </>
  );
}

function Mascot({ x, y }: { x: number; y: number }) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <g 
      transform={`translate(${x},${y - 48})`} 
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{ cursor: "pointer" }}
    >
      <defs>
        <radialGradient id="helmetGrad" cx="40%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="70%" stopColor="#e2e8f0" />
          <stop offset="100%" stopColor="#94a3b8" />
        </radialGradient>
        <linearGradient id="visorGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#0f172a" />
          <stop offset="100%" stopColor="#1e3a8a" />
        </linearGradient>
        <linearGradient id="suitGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#94a3b8" />
        </linearGradient>
        <linearGradient id="jetpackGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#64748b" />
          <stop offset="50%" stopColor="#94a3b8" />
          <stop offset="100%" stopColor="#475569" />
        </linearGradient>
        <linearGradient id="fireGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="20%" stopColor="#fde047" />
          <stop offset="60%" stopColor="#f97316" />
          <stop offset="100%" stopColor="transparent" />
        </linearGradient>
      </defs>

      {/* Floating Shadow */}
      <ellipse cx="0" cy="36" rx={isHovered ? 16 : 14} ry="5" fill="rgba(0,0,0,0.25)" style={{ transition: 'all 0.3s' }}>
        <animate
          attributeName="opacity"
          values="0.25; 0.1; 0.25"
          dur="2s"
          repeatCount="indefinite"
        />
      </ellipse>

      {/* Astronaut Body */}
      <g style={{ transform: isHovered ? 'translateY(-6px)' : 'translateY(0)', transition: 'transform 0.3s ease-out' }}>
        <animateTransform
          attributeName="transform"
          type="translate"
          values={isHovered ? "0,-2; 0,-6; 0,-2" : "0,0; 0,-4; 0,0"}
          dur="2s"
          repeatCount="indefinite"
        />
        
        {/* Jetpack */}
        <rect x="-15" y="-2" width="30" height="22" rx="4" fill="url(#jetpackGrad)" />
        <rect x="-11" y="-5" width="22" height="24" rx="3" fill="#334155" />
        {/* Jetpack Nozzles */}
        <path d="M -13 19 L -7 19 L -8 24 L -12 24 Z" fill="#1e293b" />
        <path d="M 7 19 L 13 19 L 12 24 L 8 24 Z" fill="#1e293b" />
        
        {/* Jetpack Fire Animation */}
        <g transform="translate(-10, 24)">
          <path fill="url(#fireGrad)">
            <animate 
              attributeName="d" 
              values={isHovered 
                ? "M -3.5 0 L 3.5 0 Q 0 15 0 25 Z; M -3.5 0 L 3.5 0 Q 0 20 0 35 Z; M -3.5 0 L 3.5 0 Q 0 15 0 25 Z" 
                : "M -2.5 0 L 2.5 0 Q 0 8 0 12 Z; M -2.5 0 L 2.5 0 Q 0 12 0 18 Z; M -2.5 0 L 2.5 0 Q 0 8 0 12 Z"} 
              dur={isHovered ? "0.05s" : "0.1s"} 
              repeatCount="indefinite" 
            />
          </path>
        </g>
        <g transform="translate(10, 24)">
          <path fill="url(#fireGrad)">
            <animate 
              attributeName="d" 
              values={isHovered 
                ? "M -3.5 0 L 3.5 0 Q 0 15 0 25 Z; M -3.5 0 L 3.5 0 Q 0 20 0 35 Z; M -3.5 0 L 3.5 0 Q 0 15 0 25 Z" 
                : "M -2.5 0 L 2.5 0 Q 0 8 0 12 Z; M -2.5 0 L 2.5 0 Q 0 12 0 18 Z; M -2.5 0 L 2.5 0 Q 0 8 0 12 Z"} 
              dur={isHovered ? "0.06s" : "0.12s"} 
              repeatCount="indefinite" 
            />
          </path>
        </g>

        {/* Main Body */}
        <rect x="-10" y="4" width="20" height="18" rx="6" fill="url(#suitGrad)" />
        
        {/* Chest Plate */}
        <rect x="-6" y="7" width="12" height="10" rx="2" fill="#e2e8f0" stroke="#cbd5e1" strokeWidth="0.5" />
        <circle cx="-3" cy="10" r="1.5" fill="#3b82f6" />
        <circle cx="3" cy="10" r="1.5" fill="#ef4444" />
        <rect x="-3" y="14" width="6" height="1.5" fill="#94a3b8" />
        
        {/* Belt */}
        <rect x="-10" y="19" width="20" height="3" fill="#64748b" />
        <rect x="-3" y="18.5" width="6" height="4" rx="1" fill="#94a3b8" />

        {/* Legs */}
        <path d="M -8 22 L -3 22 L -3 32 L -9 32 Z" fill="url(#suitGrad)" rx="2" />
        <path d="M 3 22 L 8 22 L 9 32 L 3 32 Z" fill="url(#suitGrad)" rx="2" />
        {/* Boots */}
        <path d="M -10 32 L -2 32 L -2 36 L -10 36 Z" fill="#64748b" rx="2" />
        <path d="M 2 32 L 10 32 L 10 36 L 2 36 Z" fill="#64748b" rx="2" />

        {/* Left Arm */}
        <g>
          <animateTransform
            attributeName="transform"
            type="rotate"
            values="10 -12 8; -5 -12 8; 10 -12 8"
            dur="3s"
            repeatCount="indefinite"
          />
          <path d="M -16 8 L -9 8 L -8 20 L -17 20 Z" fill="url(#suitGrad)" />
          <circle cx="-12.5" cy="20" r="3.5" fill="#94a3b8" /> {/* Glove */}
        </g>
        
        {/* Right Arm (Waving when hovered) */}
        <g style={{ transformOrigin: '12px 8px', transform: isHovered ? 'rotate(-140deg)' : 'rotate(0deg)', transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)' }}>
          {!isHovered && (
             <animateTransform
              attributeName="transform"
              type="rotate"
              values="-10 12 8; 5 12 8; -10 12 8"
              dur="2.8s"
              repeatCount="indefinite"
            />
          )}
          {isHovered && (
             <animateTransform
              attributeName="transform"
              type="rotate"
              values="-140 12 8; -110 12 8; -140 12 8"
              dur="0.4s"
              repeatCount="indefinite"
            />
          )}
          <path d="M 9 8 L 16 8 L 17 20 L 8 20 Z" fill="url(#suitGrad)" />
          <circle cx="12.5" cy="20" r="3.5" fill="#94a3b8" /> {/* Glove */}
        </g>
        
        {/* Helmet Base */}
        <circle cx="0" cy="-6" r="15" fill="url(#helmetGrad)" />
        <ellipse cx="0" cy="9" rx="11" ry="3" fill="#cbd5e1" /> {/* Neck ring */}
        
        {/* Glass Visor */}
        <rect x="-12" y="-13" width="24" height="15" rx="7.5" fill="url(#visorGrad)" />
        
        {/* Glowing Robot Eyes */}
        <rect x="-7" y="-10" width="5.5" height="4.5" rx="1.5" fill="#22d3ee" filter="drop-shadow(0 0 3px #06b6d4)" />
        <rect x="1.5" y="-10" width="5.5" height="4.5" rx="1.5" fill="#22d3ee" filter="drop-shadow(0 0 3px #06b6d4)" />
        
        {/* Visor Glare */}
        <path d="M -10 -11 Q 0 -13 10 -11 Q 6 -7 0 -7 Q -6 -7 -10 -11 Z" fill="rgba(255,255,255,0.25)" />
        
        {/* Hover Text Bubble */}
        {isHovered && (
          <g transform="translate(18, -24)">
            <rect x="0" y="-14" width="44" height="20" rx="10" fill="white" filter="drop-shadow(0 2px 4px rgba(0,0,0,0.15))" />
            <polygon points="4,6 -2,12 10,6" fill="white" />
            <text x="22" y="0" textAnchor="middle" fontSize="11" fontWeight="bold" fill="#0ea5e9">Hello!</text>
          </g>
        )}
      </g>
    </g>
  );
}

// ── Video Background ───────────────────────────────────────────────────────
function VideoBackground() {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    // Fade in smoothly when video is ready
    const video = videoRef.current;
    if (!video) return;
    
    const handleCanPlay = () => {
      video.style.transition = "opacity 0.5s ease-in-out";
      video.style.opacity = "1";
    };

    video.addEventListener("canplay", handleCanPlay);
    return () => video.removeEventListener("canplay", handleCanPlay);
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      <video
        ref={videoRef}
        src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260329_050842_be71947f-f16e-4a14-810c-06e83d23ddb5.mp4"
        muted
        playsInline
        autoPlay
        loop
        style={{
          opacity: 0,
          position: "absolute",
          top: 0,
          left: "50%",
          transform: "translateX(-50%)",
          width: "115%",
          height: "115%",
          objectFit: "cover",
          objectPosition: "top center",
        }}
      />
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────
export default function ToeicLearningMapPage() {
  const { skillId } = useParams<{ skillId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const userId = user?.account_id || user?.id;

  useToeicScrollReset();

  const activeSkill = (skillId === "reading" ? "reading" : "listening") as
    | "listening"
    | "reading";
  const nodes = activeSkill === "listening" ? LISTENING_NODES : READING_NODES;
  const isListening = activeSkill === "listening";

  const [mapState, setMapState] = useState<LearningMapState>({
    listening: { unlockedUpTo: 0, completedNodes: [], nodeScores: [] },
    reading: { unlockedUpTo: 0, completedNodes: [], nodeScores: [] },
  });
  const [selectedNode, setSelectedNode] = useState<number>(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const [baseScore, setBaseScore] = useState(300);   // Điểm gốc từ intake (KHÔNG bao gồm boost)
  const [targetScore, setTargetScore] = useState(650);

  // ── Load dữ liệu từ API + merge với localStorage (giống CertificateReview) ─
  useEffect(() => {
    let cancelled = false;

    // Đọc localStorage (scoped theo user) để merge với dữ liệu API
    const localState = loadMapState(userId);

    // Hiển thị ngay với localStorage để map không bao giờ bị treo loading.
    // API call vẫn chạy ngầm và cập nhật state khi hoàn tất.
    setMapState(localState);
    setIsLoaded(true);

    const safeArray = (arr: unknown): number[] =>
      Array.isArray(arr) ? arr.filter((x) => typeof x === "number") : [];

    const mergeSkillStates = (
      apiState: SkillMapState,
      local: SkillMapState,
    ): SkillMapState => {
      const apiCompleted = safeArray(apiState?.completedNodes);
      const localCompleted = safeArray(local?.completedNodes);
      const apiScores = safeArray(apiState?.nodeScores);
      const localScores = safeArray(local?.nodeScores);

      // Merge: lấy maximum completions từ cả 2 nguồn
      const mergedCompleted = Array.from(
        new Set([...apiCompleted, ...localCompleted]),
      ).sort((a, b) => a - b);

      const mergedScores: number[] = [];
      const maxLen = Math.max(apiScores.length, localScores.length);
      for (let i = 0; i < maxLen; i++) {
        mergedScores[i] = Math.max(apiScores[i] ?? 0, localScores[i] ?? 0);
      }

      // Sequential unlock tính lại từ mergedCompleted
      let unlockedUpTo = 0;
      for (let i = 0; i < mergedCompleted.length; i++) {
        if (mergedCompleted[i] === i) {
          unlockedUpTo = i + 1;
        } else {
          break;
        }
      }
      unlockedUpTo = Math.max(
        unlockedUpTo,
        apiState?.unlockedUpTo ?? 0,
        local?.unlockedUpTo ?? 0,
      );

      return { unlockedUpTo, completedNodes: mergedCompleted, nodeScores: mergedScores };
    };

    Promise.all([
      getToeicReservePoints().catch(() => null),
      getToeicPlanSync().catch(() => null),
    ])
      .then(([reserveData, planData]) => {
        if (cancelled) return;

        if (reserveData) {
          const completedParts = new Set(
            Array.isArray(reserveData.completed_parts)
              ? reserveData.completed_parts
              : [],
          );

          const buildSkillState = (
            partNumbers: number[],
            totalNodes: number,
          ): SkillMapState => {
            const completedNodes: number[] = [];
            const nodeScores: number[] = [];

            partNumbers.forEach((part, nodeIdx) => {
              if (completedParts.has(part)) {
                completedNodes.push(nodeIdx);
                const session = (reserveData.part_sessions ?? []).find(
                  (s) => s.toeic_part === part,
                );
                nodeScores[nodeIdx] = session?.earned_points ?? 0;
              }
            });

            // Sequential unlock
            let unlockedUpTo = 0;
            for (let i = 0; i < partNumbers.length; i++) {
              if (completedNodes.includes(i)) {
                unlockedUpTo = i + 1;
              } else {
                break;
              }
            }
            unlockedUpTo = Math.min(unlockedUpTo, totalNodes - 1);

            return { unlockedUpTo, completedNodes, nodeScores };
          };

          const apiListening = buildSkillState([1, 2, 3, 4], LISTENING_NODES.length);
          const apiReading = buildSkillState([5, 6, 7], READING_NODES.length);

          const merged: LearningMapState = {
            listening: mergeSkillStates(apiListening, localState.listening),
            reading: mergeSkillStates(apiReading, localState.reading),
          };

          setMapState(merged);

          // Ghi lại merged state vào localStorage (scoped theo user)
          try {
            localStorage.setItem(getMapStorageKey(userId), JSON.stringify(merged));
          } catch { /* ignore quota errors */ }
        } else {
          // API không khả dụng — dùng localStorage
          setMapState(localState);
        }

        // Lấy điểm gốc (base) từ intake — KHÔNG bị ảnh hưởng bởi practice sessions
        const profile = getToeicIntakeProfile();
        if (profile) {
          // profile.currentScore là điểm gốc từ lúc intake, không bị mutate
          setBaseScore(Math.round(profile.currentScore));
          setTargetScore(
            planData?.target_score ?? profile.milestoneState.targetScore,
          );
        } else if (planData) {
          // Fallback: API không có profile local → dùng planData
          // current_score trên server có thể đã bị cộng boost cũ → trừ lại
          const recoveredBase = Math.round(
            planData.current_score - (planData.total_boost ?? 0),
          );
          setBaseScore(Math.max(10, recoveredBase));
          setTargetScore(planData.target_score);
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoaded(true);
      });

    return () => {
      cancelled = true;
    };
  }, [userId]);

  const skillState = mapState[activeSkill];

  const currentNodeIndex = useMemo(() => {
    const { unlockedUpTo, completedNodes } = skillState;
    for (let i = unlockedUpTo; i >= 0; i--) {
      if (!completedNodes.includes(i)) return i;
    }
    return unlockedUpTo;
  }, [skillState]);

  const selectedNodeData = nodes[selectedNode] ?? nodes[0];

  useEffect(() => {
    setSelectedNode(currentNodeIndex);
  }, [currentNodeIndex, activeSkill]);

  const isNodeUnlocked = (idx: number) => idx <= skillState.unlockedUpTo;
  const isNodeCompleted = (idx: number) =>
    skillState.completedNodes.includes(idx);
  const isNodeCurrent = (idx: number) =>
    idx === currentNodeIndex && !isNodeCompleted(idx);
  const isSummitNode = (idx: number) => idx === nodes.length - 1;

  const totalNodes = nodes.length;
  const completedCount = skillState.completedNodes.length;
  const completionPercent = Math.round((completedCount / totalNodes) * 100);
  const mascotNode = nodes[currentNodeIndex] ?? nodes[0];

  // ── Tính điểm TOEIC ôn luyện (per-part cap, chống spam) ──
  const practiceScore: ToeicScoreResult | null = useMemo(() => {
    const listeningState = mapState.listening;
    const readingState = mapState.reading;

    // Chỉ tính khi có ít nhất 1 node hoàn thành
    if (
      listeningState.completedNodes.length === 0 &&
      readingState.completedNodes.length === 0
    ) {
      return null;
    }

    // Map node index → part key (bỏ Mock Exam = node cuối)
    // Listening nodes 0–3 → part1..part4
    // Reading  nodes 0–2 → part5..part7
    const LISTENING_PART_KEYS = ["part1", "part2", "part3", "part4"];
    const READING_PART_KEYS  = ["part5", "part6", "part7"];

    const bestCorrectByPart: Record<string, number> = {};

    // Ước lượng best correct từ nodeScores / scorePerCorrect
    const fillBest = (
      nodes: NodeInfo[],
      state: SkillMapState,
      partKeys: string[],
    ) => {
      const practiceNodes = nodes.slice(0, -1); // Bỏ Mock Exam
      practiceNodes.forEach((node, i) => {
        const partKey = partKeys[i];
        if (!partKey) return;
        if (state.completedNodes.includes(i)) {
          const earned = (state.nodeScores || [])[i] ?? 0;
          const correct =
            node.scorePerCorrect > 0
              ? Math.round(earned / node.scorePerCorrect)
              : 0;
          // Lấy MAX (best) — phòng trường hợp merge nhiều lần
          bestCorrectByPart[partKey] = Math.max(
            bestCorrectByPart[partKey] ?? 0,
            correct,
          );
        }
      });
    };

    fillBest(LISTENING_NODES, listeningState, LISTENING_PART_KEYS);
    fillBest(READING_NODES, readingState, READING_PART_KEYS);

    // Dải điểm = [baseScore, baseScore + 200]
    const minBand = baseScore;
    const maxBand = baseScore + 200;

    return calculateToeicPracticeScore({
      bestCorrectByPart,
      minScore: minBand,
      maxScore: maxBand,
    });
  }, [mapState, baseScore]);

  // ── currentScore giờ do per-part cap quyết định, không phải totalBoost ──
  const currentScore = practiceScore?.finalScore ?? baseScore;

  // ── Map node index → per-part cap earned (thay thế nodeScores cũ để UI khớp) ──
  const PART_KEYS_BY_SKILL: Record<string, string[]> = {
    listening: ["part1", "part2", "part3", "part4"],
    reading: ["part5", "part6", "part7"],
  };

  /** Lấy điểm earned từ per-part cap cho 1 node (bỏ Mock Exam node cuối) */
  const getNodeEarned = (nodeIdx: number): number | null => {
    if (!practiceScore) return null;
    const partKeys = PART_KEYS_BY_SKILL[activeSkill] ?? [];
    const partKey = partKeys[nodeIdx];
    if (!partKey) return null; // Mock Exam node
    const part = practiceScore.partDetails.find((p) => p.partKey === partKey);
    return part ? part.earned : null;
  };

  // Tổng điểm earned của skill hiện tại từ per-part cap
  const totalScoreGained = practiceScore
    ? (practiceScore.skills.find((s) => s.key === activeSkill)?.totalEarned ?? 0)
    : 0;

  const accentColor = isListening ? "teal" : "emerald";
  const accentCls = isListening
    ? {
        tab: "bg-cyan-500 text-white shadow-cyan-200",
        btn: "from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600",
        score: "text-teal-600",
        bar: "from-teal-400 to-cyan-400",
      }
    : {
        tab: "bg-emerald-500 text-white shadow-emerald-200",
        btn: "from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600",
        score: "text-emerald-600",
        bar: "from-emerald-400 to-teal-400",
      };

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-3">
            <div className="w-10 h-10 border-4 border-teal-400 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-slate-500 text-sm">Đang tải dữ liệu...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Header />

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 space-y-4">
        {/* ── Compact top bar ── */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <nav className="flex items-center gap-2 text-sm text-slate-500">
            <button
              onClick={() => navigate("/student/certificate-review")}
              className="hover:text-teal-600 font-medium transition-colors flex items-center gap-1"
            >
              <ChevronLeft className="w-4 h-4" />
              Ôn Luyện Chứng Chỉ
            </button>
            <span>/</span>
            <button
              onClick={() => navigate("/student/certificate-review/toeic")}
              className="hover:text-teal-600 font-medium transition-colors"
            >
              TOEIC L&amp;R
            </button>
            <span>/</span>
            <span className="font-semibold text-slate-700">
              {isListening ? "Listening" : "Reading"} Map
            </span>
          </nav>

          {/* Skill tabs */}
          <div className="flex gap-2">
            {[
              {
                skill: "listening" as const,
                icon: <Headphones className="w-4 h-4" />,
                label: "Listening",
                count: "5 nodes",
              },
              {
                skill: "reading" as const,
                icon: <BookOpen className="w-4 h-4" />,
                label: "Reading",
                count: "4 nodes",
              },
            ].map(({ skill, icon, label, count }) => (
              <button
                key={skill}
                onClick={() =>
                  navigate(`/student/certificate-review/toeic/skill/${skill}`)
                }
                className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm transition-all shadow-sm ${
                  activeSkill === skill
                    ? accentCls.tab + " shadow-md"
                    : "bg-white text-slate-600 border border-slate-200 hover:border-teal-300"
                }`}
              >
                {icon}
                {label}
                <span
                  className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${activeSkill === skill ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"}`}
                >
                  {count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* ── Main grid: map (smaller) + panels (larger) ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* ── Mountain Map (1 col on large) ── */}
          <div className="lg:col-span-1">
            <div className="rounded-2xl border border-slate-100 shadow-sm overflow-hidden relative">
              <VideoBackground />
              {/* Floating header overlay on top of the map */}
              <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-4 pt-3 pb-2 bg-linear-to-b from-white/90 to-transparent pointer-events-none">
                <div>
                  <h2 className="font-bold text-slate-800 text-sm drop-shadow">
                    {isListening
                      ? "🎧 Listening Journey"
                      : "📖 Reading Journey"}
                  </h2>
                  <p className="text-slate-600 text-xs mt-0.5 drop-shadow">
                    {completedCount}/{totalNodes} node · {completionPercent}%
                    hoàn thành
                    {totalScoreGained > 0 && ` · +${totalScoreGained.toFixed(1)}đ`}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-500 drop-shadow">Điểm</p>
                  <p
                    className={`text-2xl font-black ${accentCls.score} drop-shadow`}
                  >
                    {currentScore}
                  </p>
                </div>
              </div>

              {/* SVG fills entire card — no padding */}
              <svg
                viewBox="0 0 360 500"
                width="100%"
                style={{ display: "block", minHeight: 420, position: "relative", zIndex: 1 }}
                role="img"
                aria-label="Mountain learning map"
              >
                {/* Paths */}
                {nodes.slice(0, -1).map((node, i) => (
                  <NodePath
                    key={`path-${i}`}
                    from={node}
                    to={nodes[i + 1]}
                    isCompleted={isNodeCompleted(i) && isNodeCompleted(i + 1)}
                  />
                ))}

                {/* Nodes */}
                {nodes.map((node, i) => (
                  <MapNode
                    key={`node-${node.id}`}
                    node={node}
                    isUnlocked={isNodeUnlocked(i)}
                    isCompleted={isNodeCompleted(i)}
                    isCurrent={isNodeCurrent(i)}
                    isSelected={selectedNode === i}
                    isSummit={isSummitNode(i)}
                    onClick={() => {
                      if (i <= skillState.unlockedUpTo) setSelectedNode(i);
                    }}
                  />
                ))}

                {/* Mascot with bounce */}
                <Mascot x={mascotNode.xPos} y={mascotNode.yPos} />
              </svg>
            </div>
          </div>

          {/* ── Right panels (2 cols on large) ── */}
          <div className="lg:col-span-2 space-y-4">
            {/* Score bar */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className={`w-4 h-4 ${accentCls.score}`} />
                <h3 className="font-bold text-slate-700 text-sm">
                  Tiến độ điểm TOEIC
                </h3>
                <span
                  className={`ml-auto text-xs font-bold ${accentCls.score}`}
                >
                  {currentScore} / {targetScore}
                </span>
              </div>
              <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-full bg-linear-to-r ${accentCls.bar} rounded-full transition-all duration-700`}
                  style={{
                    width: `${Math.min(100, Math.round((currentScore / targetScore) * 100))}%`,
                  }}
                />
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Còn {Math.max(0, targetScore - currentScore)} điểm để đạt mục
                tiêu
              </p>

              {/* Scoring logic (practiceScore) vẫn hoạt động — chỉ ẩn panel chi tiết */}
            </div>

            {/* Selected node detail */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
              <div className="flex items-start gap-3 mb-3">
                <span className="text-3xl">{selectedNodeData.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold text-slate-800 text-lg">
                      {selectedNodeData.title}
                    </h3>
                    <span
                      className={`text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 ${selectedNodeData.difficultyColor}`}
                    >
                      {selectedNodeData.difficulty}
                    </span>
                    <span className="text-xs text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full">
                      {selectedNodeData.partLabel}
                    </span>
                  </div>
                  <p className="text-slate-500 text-sm mt-0.5">
                    {selectedNodeData.subtitle}
                  </p>
                </div>
                {isNodeCompleted(selectedNode) && (
                  <CheckCircle2 className="w-6 h-6 text-emerald-500 shrink-0 mt-1" />
                )}
                {!isNodeUnlocked(selectedNode) && (
                  <Lock className="w-6 h-6 text-slate-300 shrink-0 mt-1" />
                )}
              </div>

              <p className="text-slate-600 text-sm leading-relaxed mb-4">
                {selectedNodeData.description}
              </p>

              <div className="flex items-center gap-4 text-xs text-slate-500 mb-4">
                <span className="flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  {selectedNodeData.questionsCount} câu hỏi
                </span>
                <span className="flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 text-teal-400" />+
                  {(() => {
                    const partKeys = (PART_KEYS_BY_SKILL[activeSkill] ?? []);
                    const pk = partKeys[selectedNode];
                    if (!pk || !practiceScore) {
                      return (selectedNodeData.questionsCount * selectedNodeData.scorePerCorrect).toFixed(1);
                    }
                    const pd = practiceScore.partDetails.find((p) => p.partKey === pk);
                    return pd ? pd.cap.toFixed(1) : (selectedNodeData.questionsCount * selectedNodeData.scorePerCorrect).toFixed(1);
                  })()}{" "}
                  điểm max
                </span>
              </div>

              {isNodeCompleted(selectedNode) && (() => {
                const earned = getNodeEarned(selectedNode);
                return earned !== null ? (
                  <div className="mb-3 bg-emerald-50 rounded-xl p-3 text-sm text-emerald-700 font-semibold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    Đã hoàn thành · +{earned.toFixed(1)} điểm đã tích lũy
                  </div>
                ) : null;
              })()}

              {!isNodeUnlocked(selectedNode) && (
                <div className="mb-3 bg-slate-50 rounded-xl p-3 text-sm text-slate-500 flex items-center gap-2">
                  <Lock className="w-4 h-4" />
                  Hoàn thành node {selectedNode} để mở khóa node này
                </div>
              )}

              <div className="flex gap-3">
                {isNodeUnlocked(selectedNode) &&
                  !isNodeCompleted(selectedNode) && (
                    <button
                      onClick={() =>
                        selectedNode === nodes.length - 1
                          ? navigate(
                              `/student/certificate-review/toeic/exam/${activeSkill}`,
                            )
                          : navigate(
                              `/student/certificate-review/toeic/skill/${activeSkill}/node/${selectedNode}/practice`,
                            )
                      }
                      className={`flex-1 py-3 bg-linear-to-r ${accentCls.btn} text-white rounded-xl font-bold text-sm transition-all shadow-md active:scale-95`}
                    >
                      {selectedNode === nodes.length - 1 ? "🏆 Bắt đầu thi thử" : "🚀 Bắt đầu luyện tập"}
                    </button>
                  )}
                {isNodeCompleted(selectedNode) && (
                  <button
                    onClick={() =>
                      selectedNode === nodes.length - 1
                        ? navigate(
                            `/student/certificate-review/toeic/exam/${activeSkill}`,
                          )
                        : navigate(
                            `/student/certificate-review/toeic/skill/${activeSkill}/node/${selectedNode}/practice`,
                          )
                    }
                    className="flex-1 py-3 bg-white border-2 border-emerald-200 text-emerald-600 rounded-xl font-bold text-sm hover:bg-emerald-50 transition-all active:scale-95"
                  >
                    {selectedNode === nodes.length - 1 ? "🔄 Thi lại" : "🔄 Luyện tập lại"}
                  </button>
                )}
                {selectedNode !== nodes.length - 1 && (
                  <button
                    onClick={() =>
                      navigate(
                        `/student/certificate-review/toeic/exam/${activeSkill}`,
                      )
                    }
                    className="px-4 py-3 bg-white border border-slate-200 text-slate-600 rounded-xl font-semibold text-sm hover:bg-amber-50 hover:border-amber-300 hover:text-amber-700 transition-all"
                  >
                    🏆 Thi thử
                  </button>
                )}
              </div>
            </div>

            {/* All nodes list */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
              <h3 className="font-bold text-slate-700 text-sm mb-3">
                Tất cả Node — {isListening ? "Listening" : "Reading"}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {nodes.map((node, i) => (
                  <button
                    key={`list-${node.id}`}
                    onClick={() => {
                      if (isNodeUnlocked(i)) setSelectedNode(i);
                    }}
                    disabled={!isNodeUnlocked(i)}
                    className={`flex items-center gap-3 p-3 rounded-xl text-left transition-all text-sm border ${
                      selectedNode === i
                        ? `border-${accentColor}-200 bg-${accentColor}-50`
                        : isNodeUnlocked(i)
                          ? "border-transparent hover:bg-slate-50"
                          : "border-transparent opacity-40 cursor-not-allowed"
                    }`}
                  >
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-sm font-bold ${
                        isNodeCompleted(i)
                          ? "bg-emerald-100 text-emerald-700"
                          : isNodeCurrent(i)
                            ? "bg-teal-100 text-teal-700"
                            : isNodeUnlocked(i)
                              ? "bg-slate-100 text-slate-700"
                              : "bg-slate-100 text-slate-400"
                      }`}
                    >
                      {isNodeCompleted(i)
                        ? "✓"
                        : !isNodeUnlocked(i)
                          ? "🔒"
                          : i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-700 text-sm">
                        {node.title}
                      </p>
                      <p className="text-xs text-slate-400 truncate">
                        {node.subtitle}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      {isNodeCompleted(i) && (() => {
                        const earned = getNodeEarned(i);
                        return earned !== null ? (
                          <span className="text-xs text-emerald-600 font-bold block">
                            +{earned.toFixed(1)}đ
                          </span>
                        ) : null;
                      })()}
                      {isSummitNode(i) && (
                        <Flag className="w-4 h-4 text-amber-500" />
                      )}
                    </div>
                  </button>
                ))}
              </div>

              {/* Legend */}
              <div className="mt-4 pt-3 border-t border-slate-50 flex items-center gap-4 text-xs text-slate-400 flex-wrap">
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-emerald-400 inline-block" />
                  Hoàn thành
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-sky-400 inline-block" />
                  Đang học
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-slate-300 inline-block" />
                  Chưa mở khóa
                </span>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

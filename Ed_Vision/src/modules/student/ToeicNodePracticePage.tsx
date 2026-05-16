// D:\Ed_Vision\Ed_Vision\src\modules\student\ToeicNodePracticePage.tsx
import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  CheckCircle2,
  XCircle,
  ChevronRight,
  ArrowLeft,
  Trophy,
  BookOpen,
  Headphones,
  Star,
  Target,
  Lightbulb,
  RotateCcw,
  TrendingUp,
  Volume2,
  VolumeX,
  FileText,
  Play,
  Square,
  Send,
  Loader2,
} from "lucide-react";
import Header from "../../components/layout/Header";
import { buildAssetUrl } from "@/services/api/config";
import Footer from "../../components/layout/Footer";
import { useToeicScrollReset } from "../../hooks/useToeicScrollReset";
import { useAuth } from "@/hooks/useAuth";
import {
  askCertificateTutor,
  getToeicPracticeQuestions,
  submitToeicPracticeSession,
  getPersonalScores,
  chatGroqTutor,
  streamChatTutor,
  getEnrollment,
  type ToeicChatGroqMessage,
} from "../../services/api/certificateService";
import {
  getToeicIntakeProfile,
  saveToeicIntakeProfile,
  appendToeicPracticeResult,
} from "./toeicIntake";
import {
  DEFAULT_SCORING_CONFIG,
  getAllTotalQuestions,
  getPartCap,
} from "./toeicPracticeScore";
import { useVocabHighlight } from "./hooks/useVocabHighlight";
import { VocabHighlightPopup } from "./components/VocabHighlightPopup";

// ── Types ──────────────────────────────────────────────────────────────────
interface QuestionOption {
  key: "A" | "B" | "C" | "D";
  text: string;
}

interface PracticeQuestion {
  id: string;
  question: string;
  context: string;
  options: QuestionOption[];
  correctAnswer: "A" | "B" | "C" | "D";
  explanation: string;
  audioUrl?: string | null;
  imageUrl?: string | null;
}

interface AiTutorExplanation {
  answer: string;
  model: string;
  source: "cache" | "ollama" | "fallback";
}

interface NodeInfo {
  id: number;
  title: string;
  subtitle: string;
  difficulty: string;
  scorePerCorrect: number;
  partLabel: string;
  icon: string;
}

interface LearningMapState {
  listening: SkillMapState;
  reading: SkillMapState;
}

interface SkillMapState {
  unlockedUpTo: number;
  completedNodes: number[];
  nodeScores: number[];
}

interface PracticeRunDraft {
  questions: PracticeQuestion[];
  sessionQuestionIds: number[];
  currentQuestionIndex: number;
  firstAnswers: Record<number, string>;
  solvedCorrectly: number[];
  currentAttempt: string | null;
  aiExplanationByAttempt: Record<string, AiTutorExplanation>;
  aiErrorByAttempt: Record<string, string>;
  reservePoints: number | null;
  unlockThreshold: number;
  examUnlocked: boolean;
  updatedAt: string;
}

interface PracticeMistakeHistoryItem {
  questionId: string;
  question: string;
  firstAttempt: string;
  correctAnswer: "A" | "B" | "C" | "D";
  topic: string;
  explanation: string;
  createdAt: string;
}

type PracticeMistakeHistoryStore = Record<string, PracticeMistakeHistoryItem[]>;

// ── Constants ──────────────────────────────────────────────────────────────
const MAP_STORAGE_KEY_PREFIX = "edvision.toeic.learningmap.v2";
const PRACTICE_DRAFT_STORAGE_KEY_PREFIX = "edvision.toeic.practice.draft.v1";
const PRACTICE_MISTAKE_HISTORY_STORAGE_KEY =
  "edvision.toeic.practice.mistakes.v1";

/** Storage key scoped theo user — tránh acc mới đọc data acc cũ */
function getMapStorageKey(userId: string | number | undefined): string {
  return userId
    ? `${MAP_STORAGE_KEY_PREFIX}.${userId}`
    : MAP_STORAGE_KEY_PREFIX;
}
const PRACTICE_MISTAKE_HISTORY_LIMIT = 120;
const AI_PREFETCH_PRIORITY_AHEAD = 1;
const EMPTY_QUESTIONS_BANK: Record<number, PracticeQuestion[]> = {};

// ── TTS Audio Hook ────────────────────────────────────────────────────────
function useTTS() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isSupported] = useState(
    () => typeof window !== "undefined" && "speechSynthesis" in window,
  );
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const stop = useCallback(() => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
  }, []);

  const speak = useCallback(
    (text: string) => {
      if (!isSupported) return;

      // Stop any ongoing speech first
      window.speechSynthesis.cancel();

      // Clean text: remove emoji, brackets etc.
      const cleaned = text
        .replace(/🎧|🖼️|💬|🎙️|🏔️|\[.*?\]/g, "")
        .replace(/M:|W:|🎧/g, "")
        .trim();

      const utter = new SpeechSynthesisUtterance(cleaned);
      utter.lang = "en-US";
      utter.rate = 0.88;
      utter.pitch = 1.0;
      utter.volume = 1.0;

      // Try to pick a good English voice
      const voices = window.speechSynthesis.getVoices();
      const enVoice =
        voices.find(
          (v) => v.lang === "en-US" && v.name.toLowerCase().includes("female"),
        ) ||
        voices.find((v) => v.lang === "en-US") ||
        voices.find((v) => v.lang.startsWith("en"));
      if (enVoice) utter.voice = enVoice;

      utter.onstart = () => setIsSpeaking(true);
      utter.onend = () => setIsSpeaking(false);
      utter.onerror = () => setIsSpeaking(false);

      utteranceRef.current = utter;
      window.speechSynthesis.speak(utter);
    },
    [isSupported],
  );

  // Stop on unmount
  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  return { speak, stop, isSpeaking, isSupported };
}

// ── AudioPlayButton component ─────────────────────────────────────────────
function AudioPlayButton({
  text,
  label = "Nghe audio",
  accentClass = "text-teal-600",
  bgClass = "bg-teal-50",
  borderClass = "border-teal-200",
  onPlay,
}: {
  text: string;
  label?: string;
  accentClass?: string;
  bgClass?: string;
  borderClass?: string;
  onPlay?: () => void;
}) {
  const { speak, stop, isSpeaking, isSupported } = useTTS();

  if (!isSupported) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-slate-400 italic">
        <VolumeX className="w-3.5 h-3.5" />
        Trình duyệt không hỗ trợ audio
      </div>
    );
  }

  return (
    <button
      onClick={() => {
        if (isSpeaking) {
          stop();
        } else {
          speak(text);
          onPlay?.();
        }
      }}
      className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-semibold transition-all active:scale-95 ${bgClass} ${borderClass} ${accentClass} hover:opacity-80`}
    >
      {isSpeaking ? (
        <>
          <Square className="w-3.5 h-3.5 fill-current" />
          Dừng
          <span className="flex gap-0.5 items-center ml-1">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className={`w-0.5 rounded-full ${accentClass.replace("text-", "bg-")} animate-pulse`}
                style={{
                  height: `${8 + i * 3}px`,
                  animationDelay: `${i * 0.15}s`,
                }}
              />
            ))}
          </span>
        </>
      ) : (
        <>
          <Play className="w-3.5 h-3.5 fill-current" />
          {label}
        </>
      )}
    </button>
  );
}

// ── ScriptReveal — hidden until user answers correctly ────────────────────
function ScriptReveal({
  context,
  accentClass,
  showScript,
}: {
  context: string;
  accentClass: string;
  showScript: boolean;
}) {
  const [visible, setVisible] = useState(false);

  // Auto-show after correct answer
  useEffect(() => {
    if (showScript) setVisible(true);
  }, [showScript]);

  // Reset when question changes
  useEffect(() => {
    setVisible(false);
  }, [context]);

  if (!showScript && !visible) {
    // Script locked until correct answer
    return null;
  }

  if (!visible) {
    return (
      <button
        onClick={() => setVisible(true)}
        className={`text-xs font-medium underline underline-offset-2 ${accentClass} opacity-70 hover:opacity-100 transition-opacity`}
      >
        📄 Hiển thị nội dung audio
      </button>
    );
  }

  return (
    <div className="mt-1">
      <p className="text-sm text-slate-700 leading-relaxed italic whitespace-pre-line">
        {context}
      </p>
      <button
        onClick={() => setVisible(false)}
        className={`mt-1 text-xs font-medium underline underline-offset-2 ${accentClass} opacity-50 hover:opacity-80 transition-opacity`}
      >
        Ẩn
      </button>
    </div>
  );
}

const LISTENING_NODE_INFO: NodeInfo[] = [
  {
    id: 0,
    title: "Part 1",
    subtitle: "Photographs",
    difficulty: "Cơ bản",
    scorePerCorrect: 2,
    partLabel: "PART 1",
    icon: "🖼️",
  },
  {
    id: 1,
    title: "Part 2",
    subtitle: "Question-Response",
    difficulty: "Cơ bản",
    scorePerCorrect: 2.5,
    partLabel: "PART 2",
    icon: "💬",
  },
  {
    id: 2,
    title: "Part 3",
    subtitle: "Conversations",
    difficulty: "Trung bình",
    scorePerCorrect: 2.5,
    partLabel: "PART 3",
    icon: "🎧",
  },
  {
    id: 3,
    title: "Part 4",
    subtitle: "Short Talks",
    difficulty: "Khá",
    scorePerCorrect: 2.5,
    partLabel: "PART 4",
    icon: "🎙️",
  },
  {
    id: 4,
    title: "Advanced",
    subtitle: "Đỉnh Listening",
    difficulty: "Nâng cao",
    scorePerCorrect: 3,
    partLabel: "ADVANCED",
    icon: "🏔️",
  },
];

const READING_NODE_INFO: NodeInfo[] = [
  {
    id: 0,
    title: "Part 5",
    subtitle: "Incomplete Sentences",
    difficulty: "Cơ bản",
    scorePerCorrect: 2,
    partLabel: "PART 5",
    icon: "✏️",
  },
  {
    id: 1,
    title: "Part 6",
    subtitle: "Text Completion",
    difficulty: "Cơ bản",
    scorePerCorrect: 2.5,
    partLabel: "PART 6",
    icon: "📝",
  },
  {
    id: 2,
    title: "Part 7",
    subtitle: "Reading Comprehension",
    difficulty: "Trung bình",
    scorePerCorrect: 2.5,
    partLabel: "PART 7",
    icon: "📄",
  },
  {
    id: 3,
    title: "Advanced",
    subtitle: "Đỉnh Reading",
    difficulty: "Nâng cao",
    scorePerCorrect: 3,
    partLabel: "ADVANCED",
    icon: "📚",
  },
];

// ── Questions Data ─────────────────────────────────────────────────────────

const LISTENING_QUESTIONS: Record<number, PracticeQuestion[]> = {
  // Node 0 — Part 1-2
  0: [
    {
      id: "L0Q1",
      question: "What is the woman doing?",
      context: "A woman is sitting at a desk with a computer.",
      options: [
        { key: "A", text: "She is standing outdoors." },
        { key: "B", text: "She is sitting at a desk with a computer." },
        { key: "C", text: "A man is using a phone." },
        { key: "D", text: "A group of people is in a meeting." },
      ],
      correctAnswer: "B",
      explanation:
        '"Sit at a desk with a computer" = ngồi làm việc với máy tính. Từ khóa "sitting at a desk".',
    },
    {
      id: "L0Q2",
      question: "Where is the man?",
      context: "The man is standing near the window, looking outside.",
      options: [
        { key: "A", text: "He is sitting in a chair." },
        { key: "B", text: "He is standing near the window." },
        { key: "C", text: "He is lying on a bed." },
        { key: "D", text: "He is walking down the street." },
      ],
      correctAnswer: "B",
      explanation: '"Standing near the window" = đứng gần cửa sổ.',
    },
    {
      id: "L0Q3",
      question: "What is the woman doing?",
      context: "She's writing notes during the meeting.",
      options: [
        { key: "A", text: "She is reading a book." },
        { key: "B", text: "She is making a phone call." },
        { key: "C", text: "She is writing notes during the meeting." },
        { key: "D", text: "She is having lunch." },
      ],
      correctAnswer: "C",
      explanation:
        '"Writing notes during the meeting" = ghi chép trong cuộc họp.',
    },
    {
      id: "L0Q4",
      question: "What is the speaker asking about?",
      context: "Excuse me, could you tell me where the nearest bank is?",
      options: [
        { key: "A", text: "Working hours of the office." },
        { key: "B", text: "The location of the nearest bank." },
        { key: "C", text: "Transportation options." },
        { key: "D", text: "The price of a product." },
      ],
      correctAnswer: "B",
      explanation:
        '"Where the nearest bank is" = hỏi đường đến ngân hàng gần nhất.',
    },
    {
      id: "L0Q5",
      question: "What does the speaker want?",
      context: "I'd like to book a table for two for this Friday evening.",
      options: [
        { key: "A", text: "To book a flight ticket." },
        { key: "B", text: "To go shopping." },
        { key: "C", text: "To reserve a table at a restaurant." },
        { key: "D", text: "To call a taxi." },
      ],
      correctAnswer: "C",
      explanation: '"Book a table" là cụm từ đặt bàn nhà hàng.',
    },
    {
      id: "L0Q6",
      question: "How will the man respond?",
      context: "Could you help me carry these boxes to the third floor?",
      options: [
        { key: "A", text: "No, I'm busy right now." },
        { key: "B", text: "Sure, I'd be happy to help." },
        { key: "C", text: "The boxes are too heavy." },
        { key: "D", text: "I don't know where that is." },
      ],
      correctAnswer: "B",
      explanation: "Phản hồi lịch sự và hợp lý nhất khi được nhờ giúp đỡ.",
    },
    {
      id: "L0Q7",
      question: "What is shown in the photograph?",
      context: "Several cars are parked in an outdoor parking lot.",
      options: [
        { key: "A", text: "A car is driving down the road." },
        {
          key: "B",
          text: "Several cars are parked in an outdoor parking lot.",
        },
        { key: "C", text: "People are waiting for a bus." },
        { key: "D", text: "A traffic accident has occurred." },
      ],
      correctAnswer: "B",
      explanation:
        '"Several cars parked in an outdoor parking lot" = nhiều xe đậu trong bãi đỗ ngoài trời.',
    },
    {
      id: "L0Q8",
      question: "What is being described?",
      context: "The shelves are stocked with various products.",
      options: [
        { key: "A", text: "An empty store." },
        { key: "B", text: "A storage warehouse." },
        { key: "C", text: "Shelves stocked with various products." },
        { key: "D", text: "Workers arranging items." },
      ],
      correctAnswer: "C",
      explanation:
        '"Shelves stocked with various products" = kệ chứa đầy sản phẩm.',
    },
    {
      id: "L0Q9",
      question: "What time does the meeting start?",
      context: "The meeting is scheduled to begin at half past nine.",
      options: [
        { key: "A", text: "9:00" },
        { key: "B", text: "9:15" },
        { key: "C", text: "9:30" },
        { key: "D", text: "10:00" },
      ],
      correctAnswer: "C",
      explanation: '"Half past nine" = 9 giờ 30 phút = 9:30.',
    },
    {
      id: "L0Q10",
      question: "Where are they going?",
      context: "We should head to the conference room on the second floor.",
      options: [
        { key: "A", text: "The cafeteria." },
        { key: "B", text: "The conference room on the second floor." },
        { key: "C", text: "The director's office." },
        { key: "D", text: "The parking lot." },
      ],
      correctAnswer: "B",
      explanation: '"Conference room on the second floor" = phòng họp tầng 2.',
    },
  ],

  // Node 1 — Part 3
  1: [
    {
      id: "L1Q1",
      question: "What is the woman doing?",
      context:
        "M: Have you finished the quarterly report? W: Not yet, I still need to check the figures. M: The director needs it by 3 PM.",
      options: [
        { key: "A", text: "Finalizing the quarterly report." },
        { key: "B", text: "Checking the figures." },
        { key: "C", text: "Meeting with the director." },
        { key: "D", text: "Printing documents." },
      ],
      correctAnswer: "B",
      explanation:
        'Người phụ nữ nói "I still need to check the figures" → đang kiểm tra số liệu.',
    },
    {
      id: "L1Q2",
      question: "What problem does the man have?",
      context:
        "W: The flight to Tokyo has been delayed by two hours. M: Really? I have a connecting flight. W: You should speak to the customer service desk.",
      options: [
        { key: "A", text: "His luggage is lost." },
        { key: "B", text: "He may miss his connecting flight." },
        { key: "C", text: "His ticket was cancelled." },
        { key: "D", text: "There is no available seat." },
      ],
      correctAnswer: "B",
      explanation: "Chuyến bay bị delay 2 tiếng → chuyến nối có thể bị lỡ.",
    },
    {
      id: "L1Q3",
      question: "What do they decide?",
      context:
        "M: I think we should redesign the website homepage. W: I agree, the current design is outdated. M: Let's get the design team involved.",
      options: [
        { key: "A", text: "Buy a new website." },
        { key: "B", text: "Close the company." },
        { key: "C", text: "Involve the design team." },
        { key: "D", text: "Reduce costs." },
      ],
      correctAnswer: "C",
      explanation:
        '"Let\'s get the design team involved" = mời nhóm thiết kế tham gia.',
    },
    {
      id: "L1Q4",
      question: "Why did Mr. Kim call?",
      context:
        "W: Mr. Kim called while you were out. He wants to reschedule tomorrow's appointment. M: Did he say what time works for him? W: He suggested 2 PM or 4 PM.",
      options: [
        { key: "A", text: "To confirm the appointment." },
        { key: "B", text: "To reschedule the appointment." },
        { key: "C", text: "To cancel the appointment." },
        { key: "D", text: "To ask for the address." },
      ],
      correctAnswer: "B",
      explanation: '"Reschedule tomorrow\'s appointment" = đổi lịch hẹn.',
    },
    {
      id: "L1Q5",
      question: "Why was the coffee machine purchased?",
      context:
        "M: Have you seen the new coffee machine in the break room? W: Yes! It makes amazing espresso. M: I think management bought it to improve morale.",
      options: [
        { key: "A", text: "To replace a broken machine." },
        { key: "B", text: "To improve employee morale." },
        { key: "C", text: "To save money." },
        { key: "D", text: "To meet a customer request." },
      ],
      correctAnswer: "B",
      explanation:
        '"Bought it to improve morale" = mua để nâng cao tinh thần nhân viên.',
    },
    {
      id: "L1Q6",
      question: "Where is the training?",
      context:
        "W: The training session starts at 9, but I can't find the conference room. M: It's been moved to Room 204. W: Thanks, I'll go there now.",
      options: [
        { key: "A", text: "In the original room." },
        { key: "B", text: "In Room 204." },
        { key: "C", text: "In the cafeteria." },
        { key: "D", text: "Outside." },
      ],
      correctAnswer: "B",
      explanation: '"It\'s been moved to Room 204" = đã chuyển sang phòng 204.',
    },
    {
      id: "L1Q7",
      question: "What caused the sales increase?",
      context:
        "M: Our sales have increased by 15% this quarter. W: That's great! What's driving the growth? M: Mostly our new product line.",
      options: [
        { key: "A", text: "A price reduction." },
        { key: "B", text: "The new product line." },
        { key: "C", text: "New employees." },
        { key: "D", text: "Advertising campaigns." },
      ],
      correctAnswer: "B",
      explanation:
        '"Mostly our new product line" = chủ yếu do dòng sản phẩm mới.',
    },
    {
      id: "L1Q8",
      question: "What is the woman's problem?",
      context:
        "W: I need to submit the expense report by Friday. M: Do you have all the receipts? W: Most of them, but I'm missing two from last week.",
      options: [
        { key: "A", text: "She forgot the deadline." },
        { key: "B", text: "She is missing two receipts." },
        { key: "C", text: "She lost money." },
        { key: "D", text: "She doesn't know how to submit it." },
      ],
      correctAnswer: "B",
      explanation: '"I\'m missing two" = thiếu hai hóa đơn.',
    },
    {
      id: "L1Q9",
      question: "What should they do?",
      context:
        "M: The supplier said the delivery will be late. W: How late? M: About a week. We may need to notify our clients.",
      options: [
        { key: "A", text: "Cancel the order." },
        { key: "B", text: "Notify their clients." },
        { key: "C", text: "Find a new supplier." },
        { key: "D", text: "Wait a little longer." },
      ],
      correctAnswer: "B",
      explanation:
        '"We may need to notify our clients" = cần thông báo cho khách hàng.',
    },
    {
      id: "L1Q10",
      question: "What is the new development?",
      context:
        "W: I heard the company is opening a new branch. M: Yes, in Hanoi. They're looking for volunteers to transfer. W: That sounds like an interesting opportunity.",
      options: [
        { key: "A", text: "The company is hiring more staff." },
        { key: "B", text: "The company is opening a new branch in Hanoi." },
        { key: "C", text: "The company is merging with another." },
        { key: "D", text: "The company is relocating its headquarters." },
      ],
      correctAnswer: "B",
      explanation:
        '"Opening a new branch in Hanoi" = mở chi nhánh mới tại Hà Nội.',
    },
  ],

  // Node 2 — Part 4
  2: [
    {
      id: "L2Q1",
      question: "Where does this announcement take place?",
      context:
        "Attention all passengers, Flight VN203 to Singapore will board from Gate 12. Please have your boarding pass ready.",
      options: [
        { key: "A", text: "At a hospital." },
        { key: "B", text: "At an airport." },
        { key: "C", text: "At a shopping mall." },
        { key: "D", text: "At a train station." },
      ],
      correctAnswer: "B",
      explanation:
        '"Passengers", "flight", "boarding pass", "gate" đều là từ khóa sân bay.',
    },
    {
      id: "L2Q2",
      question: "What is being advertised?",
      context:
        "Welcome to our store. This weekend only, all electronics are 30% off. Visit us before Sunday to take advantage of these great deals.",
      options: [
        { key: "A", text: "Clothing items." },
        { key: "B", text: "Discounted electronics." },
        { key: "C", text: "Repair services." },
        { key: "D", text: "Food products." },
      ],
      correctAnswer: "B",
      explanation: '"All electronics are 30% off" = đồ điện tử giảm 30%.',
    },
    {
      id: "L2Q3",
      question: "Why will the parking lot be closed?",
      context:
        "This is a reminder that the parking lot will be closed for maintenance on Thursday from 8 AM to 5 PM.",
      options: [
        { key: "A", text: "For a special event." },
        { key: "B", text: "For maintenance." },
        { key: "C", text: "For new construction." },
        { key: "D", text: "For a safety inspection." },
      ],
      correctAnswer: "B",
      explanation: '"Closed for maintenance" = đóng cửa để bảo trì.',
    },
    {
      id: "L2Q4",
      question: "What kind of call is this?",
      context:
        "Thank you for calling ABC Bank. For account inquiries, press 1. For loan applications, press 2. For other services, press 0.",
      options: [
        { key: "A", text: "A sales call." },
        { key: "B", text: "A bank customer service line." },
        { key: "C", text: "Technical support." },
        { key: "D", text: "A medical appointment line." },
      ],
      correctAnswer: "B",
      explanation:
        '"ABC Bank", "account inquiries", "loan applications" đều là từ khóa dịch vụ ngân hàng.',
    },
    {
      id: "L2Q5",
      question: "Who must attend?",
      context:
        "Our monthly sales meeting will be held next Tuesday at 2 PM in the main conference room. All department heads are required to attend.",
      options: [
        { key: "A", text: "All staff members." },
        { key: "B", text: "All department heads." },
        { key: "C", text: "The sales team." },
        { key: "D", text: "The executive directors." },
      ],
      correctAnswer: "B",
      explanation:
        '"All department heads are required to attend" = trưởng các bộ phận bắt buộc tham dự.',
    },
    {
      id: "L2Q6",
      question: "Why are the hours changing?",
      context:
        "The city library will extend its opening hours during exam season. From June 1 to July 15, we will be open until 10 PM on weekdays.",
      options: [
        { key: "A", text: "A new branch is opening." },
        { key: "B", text: "It is exam season." },
        { key: "C", text: "More staff are being hired." },
        { key: "D", text: "It is a government requirement." },
      ],
      correctAnswer: "B",
      explanation: '"During exam season" = trong mùa thi → mở cửa muộn hơn.',
    },
    {
      id: "L2Q7",
      question: "What does the captain say about arrival?",
      context:
        "This is your captain speaking. We're cruising at 35,000 feet. Weather at our destination is clear, and we expect to land 20 minutes ahead of schedule.",
      options: [
        { key: "A", text: "The flight will arrive later than planned." },
        { key: "B", text: "The flight will arrive 20 minutes early." },
        { key: "C", text: "The flight will arrive on time." },
        { key: "D", text: "The arrival time is uncertain." },
      ],
      correctAnswer: "B",
      explanation: '"20 minutes ahead of schedule" = sớm hơn kế hoạch 20 phút.',
    },
    {
      id: "L2Q8",
      question: "What is offered in the program?",
      context:
        "Employees interested in the company's new wellness program should register by this Friday. Sessions include yoga, meditation, and nutrition workshops.",
      options: [
        { key: "A", text: "Job skills training." },
        { key: "B", text: "Yoga, meditation, and nutrition workshops." },
        { key: "C", text: "Language learning classes." },
        { key: "D", text: "Leadership development." },
      ],
      correctAnswer: "B",
      explanation:
        '"Yoga, meditation, and nutrition workshops" = yoga, thiền định và dinh dưỡng.',
    },
    {
      id: "L2Q9",
      question: "What should employees do on Friday evening?",
      context:
        "The IT department will perform system maintenance this Saturday from midnight to 6 AM. Please save your work before logging off on Friday evening.",
      options: [
        { key: "A", text: "Come to work early on Saturday." },
        { key: "B", text: "Save their work before logging off." },
        { key: "C", text: "Contact the IT department directly." },
        { key: "D", text: "Back up all their files to an external drive." },
      ],
      correctAnswer: "B",
      explanation:
        '"Save your work before logging off" = lưu công việc trước khi đăng xuất. Đây là hành động bắt buộc trước khi bảo trì hệ thống.',
    },
    {
      id: "L2Q10",
      question: "What new features does the app have?",
      context:
        "We're excited to announce that our mobile app has been updated with new features including real-time tracking and one-click payment.",
      options: [
        { key: "A", text: "Video chat." },
        { key: "B", text: "Real-time tracking and one-click payment." },
        { key: "C", text: "Language translation." },
        { key: "D", text: "Social media sharing." },
      ],
      correctAnswer: "B",
      explanation:
        '"Real-time tracking and one-click payment" = theo dõi thời gian thực và thanh toán một chạm.',
    },
  ],

  // Node 3 — Advanced
  3: [
    {
      id: "L3Q1",
      question: "What does 'quarterly projections' mean?",
      context:
        "The presenter speaks very quickly with a thick Australian accent discussing quarterly projections.",
      options: [
        { key: "A", text: "Monthly forecasts." },
        { key: "B", text: "Quarterly (every 3 months) forecasts." },
        { key: "C", text: "Annual results." },
        { key: "D", text: "Weekly budget reports." },
      ],
      correctAnswer: "B",
      explanation:
        '"Quarterly" = every 3 months / hàng quý. "Projections" = forecasts / dự báo.',
    },
    {
      id: "L3Q2",
      question: "What is implied about the team?",
      context:
        "Despite the setback, the team remained optimistic about meeting the year-end target.",
      options: [
        { key: "A", text: "The team has given up on the target." },
        {
          key: "B",
          text: "The team is still confident about reaching the target.",
        },
        { key: "C", text: "The target has been changed." },
        { key: "D", text: "This year will be very difficult." },
      ],
      correctAnswer: "B",
      explanation:
        '"Remained optimistic about meeting the target" = vẫn lạc quan về việc đạt mục tiêu.',
    },
    {
      id: "L3Q3",
      question: "What is being requested?",
      context: "Could you elaborate on the implementation timeline?",
      options: [
        { key: "A", text: "More information about costs." },
        { key: "B", text: "More details about the implementation timeline." },
        { key: "C", text: "The number of employees needed." },
        { key: "D", text: "Customer data and statistics." },
      ],
      correctAnswer: "B",
      explanation:
        '"Elaborate on" = giải thích chi tiết hơn về. "Implementation timeline" = lịch trình thực hiện.',
    },
    {
      id: "L3Q4",
      question: "What needs to happen before the merger is finalized?",
      context: "The merger will be finalized pending regulatory approval.",
      options: [
        { key: "A", text: "Employees must give their consent." },
        { key: "B", text: "Regulatory approval must be obtained." },
        { key: "C", text: "Clients must be notified in advance." },
        { key: "D", text: "A financial audit must be completed." },
      ],
      correctAnswer: "B",
      explanation:
        '"Pending regulatory approval" = đang chờ phê duyệt từ cơ quan quản lý. "Pending" = chờ đợi.',
    },
    {
      id: "L3Q5",
      question: "What does 'streamline' mean in this context?",
      context: "We need to streamline our processes to remain competitive.",
      options: [
        { key: "A", text: "To expand our operations." },
        { key: "B", text: "To optimize and simplify processes." },
        { key: "C", text: "To hire more employees." },
        { key: "D", text: "To increase production costs." },
      ],
      correctAnswer: "B",
      explanation:
        '"Streamline" = tối ưu hóa, đơn giản hóa quy trình để hoạt động hiệu quả hơn.',
    },
    {
      id: "L3Q6",
      question: "What does the British speaker want to do?",
      context:
        "A British speaker says: 'I reckon we ought to table this discussion for now.'",
      options: [
        { key: "A", text: "Continue the discussion right now." },
        { key: "B", text: "Postpone the discussion for later." },
        { key: "C", text: "Cancel the meeting entirely." },
        { key: "D", text: "Invite more people to join." },
      ],
      correctAnswer: "B",
      explanation:
        'Trong tiếng Anh Anh (British English), "table" = hoãn lại để bàn sau. Khác với Mỹ: "table" = đưa ra thảo luận ngay.',
    },
    {
      id: "L3Q7",
      question: "What does 'unprecedented' mean in this context?",
      context:
        "The initiative yielded unprecedented results in customer satisfaction.",
      options: [
        { key: "A", text: "Worse than expected." },
        { key: "B", text: "Never seen or done before." },
        { key: "C", text: "Quite ordinary and expected." },
        { key: "D", text: "Predicted well in advance." },
      ],
      correctAnswer: "B",
      explanation:
        '"Unprecedented" = chưa từng có trước đây. Un- (phủ định) + precedent (tiền lệ) → không có tiền lệ.',
    },
    {
      id: "L3Q8",
      question: "How would you describe her tone?",
      context: "She was being rather facetious when she said that.",
      options: [
        { key: "A", text: "Serious and sincere." },
        { key: "B", text: "Joking and not serious." },
        { key: "C", text: "Angry and frustrated." },
        { key: "D", text: "Surprised and confused." },
      ],
      correctAnswer: "B",
      explanation:
        '"Facetious" = đùa cợt, không nghiêm túc. Dùng để mô tả giọng điệu bông đùa không phù hợp với hoàn cảnh.',
    },
    {
      id: "L3Q9",
      question: "What did the CEO do regarding organizational changes?",
      context:
        "The CEO alluded to potential changes in the organizational structure.",
      options: [
        { key: "A", text: "Made a formal announcement about the changes." },
        { key: "B", text: "Hinted at possible changes in the structure." },
        { key: "C", text: "Refused to make any changes." },
        { key: "D", text: "Asked employees for their opinions." },
      ],
      correctAnswer: "B",
      explanation:
        '"Alluded to" = ám chỉ, gợi ý đến mà không nói thẳng. Khác với "announced" = thông báo chính thức.',
    },
    {
      id: "L3Q10",
      question: "What does 'convoluted' mean in this context?",
      context:
        "Despite the convoluted explanation, the team grasped the key concept.",
      options: [
        { key: "A", text: "Clear and easy to understand." },
        { key: "B", text: "Complex and difficult to follow." },
        { key: "C", text: "Short and to the point." },
        { key: "D", text: "Inaccurate and misleading." },
      ],
      correctAnswer: "B",
      explanation:
        '"Convoluted" = phức tạp, rối rắm, khó theo dõi. Opposite: "straightforward" / "clear".',
    },
  ],
  4: [
    {
      id: "L4Q1",
      question: "What does 'quarterly projections' mean in this context?",
      context:
        "The presenter speaks quickly: 'Our quarterly projections show strong growth in the Asia-Pacific region.'",
      options: [
        { key: "A", text: "Monthly performance reports." },
        { key: "B", text: "Forecasts for every three-month period." },
        { key: "C", text: "Annual financial results." },
        { key: "D", text: "Weekly budget summaries." },
      ],
      correctAnswer: "B",
      explanation:
        "'Quarterly' = every 3 months / hàng quý. 'Projections' = dự báo. Đây là từ hay xuất hiện trong TOEIC nâng cao.",
    },
    {
      id: "L4Q2",
      question: "What is implied about the team?",
      context:
        "Despite the setback, the team remained optimistic about meeting the year-end target.",
      options: [
        { key: "A", text: "The team has abandoned its target." },
        {
          key: "B",
          text: "The team remains confident about the year-end target.",
        },
        { key: "C", text: "The target has been revised downward." },
        { key: "D", text: "This year will be extremely challenging." },
      ],
      correctAnswer: "B",
      explanation:
        "'Remained optimistic' = vẫn lạc quan/tự tin. 'Despite the setback' = mặc dù gặp khó khăn.",
    },
    {
      id: "L4Q3",
      question: "What is being requested?",
      context:
        "Could you elaborate on the implementation timeline for this initiative?",
      options: [
        { key: "A", text: "A breakdown of the project costs." },
        { key: "B", text: "More details about the implementation timeline." },
        { key: "C", text: "The number of staff required." },
        { key: "D", text: "Customer feedback data." },
      ],
      correctAnswer: "B",
      explanation:
        "'Elaborate on' = giải thích thêm chi tiết về. 'Implementation timeline' = lịch trình thực hiện.",
    },
    {
      id: "L4Q4",
      question: "What needs to happen before the merger is finalized?",
      context:
        "The merger will be finalized pending regulatory approval from three government agencies.",
      options: [
        { key: "A", text: "All employees must vote in favor." },
        {
          key: "B",
          text: "Approval must be obtained from three government agencies.",
        },
        { key: "C", text: "All clients must be informed first." },
        { key: "D", text: "An independent financial audit must be completed." },
      ],
      correctAnswer: "B",
      explanation:
        "'Pending regulatory approval from three government agencies' = chờ phê duyệt từ 3 cơ quan quản lý nhà nước.",
    },
    {
      id: "L4Q5",
      question: "What does 'streamline our processes' mean?",
      context:
        "We need to streamline our processes to remain competitive in the global market.",
      options: [
        { key: "A", text: "To expand our business operations." },
        { key: "B", text: "To optimize and simplify how we work." },
        { key: "C", text: "To recruit additional employees." },
        { key: "D", text: "To increase manufacturing costs." },
      ],
      correctAnswer: "B",
      explanation:
        "'Streamline' = tối ưu hóa, đơn giản hóa quy trình để hoạt động hiệu quả hơn.",
    },
    {
      id: "L4Q6",
      question: "What does the British speaker want to do?",
      context:
        "A British speaker says: 'I reckon we ought to table this discussion for the next meeting.'",
      options: [
        { key: "A", text: "Continue the discussion immediately." },
        { key: "B", text: "Postpone the discussion to the next meeting." },
        { key: "C", text: "Cancel the meeting entirely." },
        { key: "D", text: "Invite additional participants." },
      ],
      correctAnswer: "B",
      explanation:
        "British English: 'table' = hoãn lại để bàn sau (= postpone). Khác tiếng Anh Mỹ: 'table' = đưa ra thảo luận ngay.",
    },
    {
      id: "L4Q7",
      question: "What does 'unprecedented' most likely mean?",
      context:
        "The initiative yielded unprecedented results in customer satisfaction scores.",
      options: [
        { key: "A", text: "Worse than previously expected." },
        { key: "B", text: "Never achieved or experienced before." },
        { key: "C", text: "Quite normal and as expected." },
        { key: "D", text: "Accurately predicted in advance." },
      ],
      correctAnswer: "B",
      explanation:
        "'Unprecedented' = chưa từng có trước đây. Un- (phủ định) + precedent (tiền lệ) = không có tiền lệ.",
    },
    {
      id: "L4Q8",
      question: "How would you describe her tone when she said that?",
      context:
        "She was being rather facetious when she suggested they solve it by magic.",
      options: [
        { key: "A", text: "Serious and genuine." },
        { key: "B", text: "Joking and not serious." },
        { key: "C", text: "Angry and disappointed." },
        { key: "D", text: "Surprised and confused." },
      ],
      correctAnswer: "B",
      explanation:
        "'Facetious' = đùa cợt, không nghiêm túc dù hoàn cảnh đòi hỏi. Dùng để mô tả giọng điệu châm biếm nhẹ.",
    },
    {
      id: "L4Q9",
      question: "What did the CEO do regarding the changes?",
      context:
        "The CEO alluded to potential restructuring but didn't provide specific details.",
      options: [
        { key: "A", text: "Made a formal announcement about restructuring." },
        { key: "B", text: "Hinted at restructuring without giving details." },
        { key: "C", text: "Rejected all proposed changes." },
        { key: "D", text: "Requested feedback from employees." },
      ],
      correctAnswer: "B",
      explanation:
        "'Alluded to' = ám chỉ, gợi ý mà không nói thẳng. Quan trọng: không phải 'announced' (thông báo chính thức).",
    },
    {
      id: "L4Q10",
      question: "What does 'convoluted' most likely mean?",
      context:
        "Despite the convoluted explanation, the team eventually understood the new system.",
      options: [
        { key: "A", text: "Very clear and easy to understand." },
        { key: "B", text: "Unnecessarily complex and hard to follow." },
        { key: "C", text: "Brief and to the point." },
        { key: "D", text: "Interesting and engaging." },
      ],
      correctAnswer: "B",
      explanation:
        "'Convoluted' = phức tạp, rối rắm, khó hiểu. Opposite: 'clear', 'simple', 'straightforward'.",
    },
  ],
};

// ── localStorage helpers ───────────────────────────────────────────────────
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

function saveMapState(state: LearningMapState, userId?: string | number): void {
  localStorage.setItem(getMapStorageKey(userId), JSON.stringify(state));
}

function buildPracticeDraftStorageKey(
  skill: "listening" | "reading",
  toeicPart: number,
  userId: string | number,
): string {
  return `${PRACTICE_DRAFT_STORAGE_KEY_PREFIX}.${userId}.${skill}.part_${toeicPart}`;
}

function loadPracticeRunDraft(storageKey: string): PracticeRunDraft | null {
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PracticeRunDraft;

    if (!Array.isArray(parsed.questions) || parsed.questions.length === 0) {
      return null;
    }
    if (
      !Array.isArray(parsed.sessionQuestionIds) ||
      parsed.sessionQuestionIds.length !== parsed.questions.length
    ) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function savePracticeRunDraft(
  storageKey: string,
  draft: PracticeRunDraft,
): void {
  localStorage.setItem(storageKey, JSON.stringify(draft));
}

function clearPracticeRunDraft(storageKey: string): void {
  localStorage.removeItem(storageKey);
}

function buildPracticeMistakeHistoryBucketKey(
  skill: "listening" | "reading",
  toeicPart: number,
): string {
  return `${skill}.part_${toeicPart}`;
}

function loadPracticeMistakeHistoryStore(): PracticeMistakeHistoryStore {
  try {
    const raw = localStorage.getItem(PRACTICE_MISTAKE_HISTORY_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as PracticeMistakeHistoryStore;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function savePracticeMistakeHistoryStore(
  store: PracticeMistakeHistoryStore,
): void {
  localStorage.setItem(
    PRACTICE_MISTAKE_HISTORY_STORAGE_KEY,
    JSON.stringify(store),
  );
}

function getPracticeMistakeHistory(
  skill: "listening" | "reading",
  toeicPart: number,
  limit = 30,
): PracticeMistakeHistoryItem[] {
  const bucketKey = buildPracticeMistakeHistoryBucketKey(skill, toeicPart);
  const store = loadPracticeMistakeHistoryStore();
  const bucket = Array.isArray(store[bucketKey]) ? store[bucketKey] : [];
  return bucket.slice(-Math.max(1, limit));
}

function appendPracticeMistakeHistory(
  skill: "listening" | "reading",
  toeicPart: number,
  items: PracticeMistakeHistoryItem[],
): void {
  if (items.length === 0) return;

  const bucketKey = buildPracticeMistakeHistoryBucketKey(skill, toeicPart);
  const store = loadPracticeMistakeHistoryStore();
  const existing = Array.isArray(store[bucketKey]) ? store[bucketKey] : [];

  const merged = [...existing, ...items].slice(-PRACTICE_MISTAKE_HISTORY_LIMIT);
  store[bucketKey] = merged;
  savePracticeMistakeHistoryStore(store);
}

// ── Score meter helper ────────────────────────────────────────────────────
function getScoreLabel(
  correct: number,
  total: number,
): { label: string; color: string; emoji: string } {
  const pct = (correct / total) * 100;
  if (pct === 100)
    return { label: "Xuất sắc!", color: "text-emerald-600", emoji: "🏆" };
  if (pct >= 80)
    return { label: "Tốt lắm!", color: "text-teal-600", emoji: "⭐" };
  if (pct >= 60)
    return { label: "Khá tốt!", color: "text-amber-600", emoji: "👍" };
  if (pct >= 40)
    return { label: "Cần luyện thêm", color: "text-orange-600", emoji: "💪" };
  return { label: "Tiếp tục cố gắng", color: "text-red-600", emoji: "📚" };
}

// ── Main Component ─────────────────────────────────────────────────────────
// ── Helpers ──────────────────────────────────────────────────────────────────
function nodeIndexToToeicPart(
  skill: "listening" | "reading",
  nodeIndex: number,
): number | null {
  if (skill === "listening") return ([1, 2, 3, 4] as const)[nodeIndex] ?? null;
  return ([5, 6, 7] as const)[nodeIndex] ?? null;
}

export default function ToeicNodePracticePage() {
  const { skillId, nodeIndex } = useParams<{
    skillId: string;
    nodeIndex: string;
  }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const userId = user?.account_id || user?.id;

  useToeicScrollReset();

  // ── Derive data from params ──────────────────────────────────────────────
  const activeSkill = (skillId === "reading" ? "reading" : "listening") as
    | "listening"
    | "reading";
  const parsedNodeIndex = parseInt(nodeIndex ?? "0", 10);

  const isListening = activeSkill === "listening";
  const nodeInfoList = isListening ? LISTENING_NODE_INFO : READING_NODE_INFO;
  const questionsBank = isListening
    ? LISTENING_QUESTIONS
    : EMPTY_QUESTIONS_BANK;

  const nodeInfo = nodeInfoList[parsedNodeIndex] ?? null;
  const toeicPart = nodeIndexToToeicPart(activeSkill, parsedNodeIndex);

  // Declared before questions useMemo since it is referenced inside the memo fn
  const [dbQuestions, setDbQuestions] = useState<PracticeQuestion[] | null>(
    null,
  );

  const questions: PracticeQuestion[] = useMemo(() => {
    // For reading: always use DB questions (no hardcoded fallback)
    if (!isListening) return dbQuestions ?? [];
    // For listening: use DB if available, else fall back to hardcoded
    if (toeicPart !== null && dbQuestions !== null) return dbQuestions;
    return (
      (questionsBank as Record<number, PracticeQuestion[]>)[parsedNodeIndex] ??
      []
    );
  }, [toeicPart, dbQuestions, questionsBank, parsedNodeIndex, isListening]);

  // ── State ────────────────────────────────────────────────────────────────
  const [toeicEnrollmentId, setToeicEnrollmentId] = useState<number | null>(
    null,
  );
  const vocabHighlight = useVocabHighlight(toeicEnrollmentId, !isListening);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  // firstAnswers: the FIRST option chosen per question index (used for scoring)
  const [firstAnswers, setFirstAnswers] = useState<Record<number, string>>({});
  // currentAttempt: the most recently selected option for the current question
  const [currentAttempt, setCurrentAttempt] = useState<string | null>(null);
  // solvedCorrectly: set of question indices where user eventually got correct
  const [solvedCorrectly, setSolvedCorrectly] = useState<Set<number>>(
    new Set(),
  );
  const [showSummary, setShowSummary] = useState(false);
  const [animatingIn, setAnimatingIn] = useState(false);
  const [aiExplanationByAttempt, setAiExplanationByAttempt] = useState<
    Record<string, AiTutorExplanation>
  >({});

  const [translations, setTranslations] = useState<Record<string, string>>({});
  const [translatingIds, setTranslatingIds] = useState<Set<string>>(new Set());

  const handleTranslateQuestion = async (question: PracticeQuestion) => {
    const questionId = String(question.id);
    if (translatingIds.has(questionId) || translations[questionId]) return;

    setTranslatingIds((prev) => new Set(prev).add(questionId));

    const optionsText = question.options
      .map((opt) => `${opt.key}. ${opt.text}`)
      .join("\n");

    try {
      const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=vi&dt=t&q=${encodeURIComponent(
        question.question + "\n\n" + optionsText,
      )}`;
      const res = await fetch(url);
      const data = await res.json();

      if (data && data[0]) {
        let translatedText = "";
        for (let i = 0; i < data[0].length; i++) {
          translatedText += data[0][i][0];
        }
        setTranslations((prev) => ({
          ...prev,
          [questionId]: translatedText.trim(),
        }));
      } else {
        throw new Error("Invalid translation response");
      }
    } catch (e) {
      setTranslations((prev) => ({
        ...prev,
        [questionId]: "Xin lỗi, không thể dịch câu hỏi lúc này.",
      }));
    } finally {
      setTranslatingIds((prev) => {
        const next = new Set(prev);
        next.delete(questionId);
        return next;
      });
    }
  };
  const [aiLoadingByAttempt, setAiLoadingByAttempt] = useState<
    Record<string, boolean>
  >({});
  const [aiErrorByAttempt, setAiErrorByAttempt] = useState<
    Record<string, string>
  >({});
  const aiExplanationRef = useRef<Record<string, AiTutorExplanation>>({});
  const aiLoadingRef = useRef<Record<string, boolean>>({});

  // Audio prefetch cache — giữ HTMLAudioElement còn sống để browser cache
  // không bị GC. Key = URL đầy đủ đã resolve (relative path → absolute).
  const audioCacheRef = useRef<Map<string, HTMLAudioElement>>(new Map());

  const resolveAudioUrl = useCallback((url: string | null | undefined) => {
    if (!url) return null;
    return url.startsWith("http") ? url : buildAssetUrl(url);
  }, []);

  /**
   * Tải trước 1 audio URL. Có 2 mode:
   * - mode='metadata' (default): resolve khi `loadedmetadata` — chỉ cần đủ
   *   để biết duration & bắt đầu phát. RẤT NHANH cho audio dài (chỉ tải
   *   vài KB header). Dùng cho blocking phase trước khi vào practice.
   * - mode='full': resolve khi `canplaythrough` — đợi đủ buffer để phát
   *   không gián đoạn. Dùng cho background prefetch.
   * Luôn `audio.preload = 'auto'` để browser tiếp tục tải full bytes về
   * cache ngay cả sau khi promise đã resolve (background).
   */
  const prefetchAudio = useCallback(
    (
      rawUrl: string | null | undefined,
      mode: "metadata" | "full" = "metadata",
      timeoutMs = 12000,
    ): Promise<void> => {
      const fullUrl = resolveAudioUrl(rawUrl);
      if (!fullUrl) return Promise.resolve();
      const cache = audioCacheRef.current;
      const cached = cache.get(fullUrl);
      if (cached) {
        if (mode === "metadata" && cached.readyState >= 1)
          return Promise.resolve();
        if (mode === "full" && cached.readyState >= 4) return Promise.resolve();
      }

      return new Promise<void>((resolve) => {
        const audio = cached ?? new Audio();
        audio.preload = "auto";
        if (audio.src !== fullUrl) audio.src = fullUrl;
        cache.set(fullUrl, audio);

        let done = false;
        const cleanup = () => {
          audio.removeEventListener("loadedmetadata", onMetaReady);
          audio.removeEventListener("canplaythrough", onFullReady);
          audio.removeEventListener("error", onError);
          clearTimeout(timer);
        };
        const finish = () => {
          if (done) return;
          done = true;
          cleanup();
          resolve();
        };
        const onMetaReady = () => {
          if (mode === "metadata") finish();
        };
        const onFullReady = () => finish();
        const onError = () => finish();

        audio.addEventListener("loadedmetadata", onMetaReady);
        audio.addEventListener("canplaythrough", onFullReady, { once: true });
        audio.addEventListener("error", onError, { once: true });
        const timer = setTimeout(finish, timeoutMs);

        try {
          audio.load();
        } catch {
          finish();
        }
      });
    },
    [resolveAudioUrl],
  );

  const [dbLoading, setDbLoading] = useState(false);
  const [dbError, setDbError] = useState<string | null>(null);
  const [sessionQuestionIds, setSessionQuestionIds] = useState<number[]>([]);
  const [reservePoints, setReservePoints] = useState<number | null>(null);
  const [currentScore, setCurrentScore] = useState<number | null>(null); // Điểm Gốc
  const [unlockThreshold, setUnlockThreshold] = useState<number>(300);
  const [earnedThisSession, setEarnedThisSession] = useState<number | null>(
    null,
  );
  const [attemptPointsThisSession, setAttemptPointsThisSession] = useState<
    number | null
  >(null);
  const [examUnlocked, setExamUnlocked] = useState(false);
  // Track whether the backend session has been successfully recorded so we
  // can retry on handleComplete if the initial submit fails/skipped.
  const [submitSucceeded, setSubmitSucceeded] = useState(false);
  const [isSubmittingSession, setIsSubmittingSession] = useState(false);

  // --- Groq Chat Tutor State ---
  const [chatMessage, setChatMessage] = useState("");
  const [chatHistory, setChatHistory] = useState<ToeicChatGroqMessage[]>([]);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [isChatExpanded, setIsChatExpanded] = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const streamAbortRef = useRef<(() => void) | null>(null);

  /**
   * Loại bỏ markdown syntax mà model AI vô tình sinh ra.
   * Xử lý: **bold**, *italic*, __bold__, _italic_, ### heading, `code`, > blockquote
   * Giữ nguyên: dấu câu, dấu nháy, ký tự đặc biệt hợp lệ.
   */
  const stripMarkdown = (text: string): string =>
    text
      // Xoá ### heading
      .replace(/^#{1,6}\s+/gm, '')
      // Xoá **bold** hoặc __bold__
      .replace(/\*\*(.+?)\*\*/g, '$1')
      .replace(/__(.+?)__/g, '$1')
      // Xoá *italic* hoặc _italic_
      .replace(/\*(.+?)\*/g, '$1')
      .replace(/_(.+?)_/g, '$1')
      // Xoá `inline code`
      .replace(/`(.+?)`/g, '$1')
      // Xoá > blockquote
      .replace(/^>\s*/gm, '')
      // Xoá dấu --- hoặc *** (separator)
      .replace(/^[-*]{3,}$/gm, '')
      // Dọn dẹp khoảng trắng thừa cuối dòng
      .replace(/[ \t]+$/gm, '')
      // Xoá nhiều dòng trống liên tiếp → tối đa 1 dòng trống
      .replace(/\n{3,}/g, '\n\n')
      .trim();

  const handleSendChat = () => {
    if (!chatMessage.trim() || isChatLoading) return;
    const currentMsg = chatMessage.trim();
    setChatMessage("");
    setChatHistory((prev) => [...prev, { role: "user", content: currentMsg }]);
    setIsChatLoading(true);
    setIsChatExpanded(true);
    setStreamingText("");

    let accumulated = "";

    const abort = streamChatTutor(
      {
        question_id: parseInt(currentQuestion.id),
        user_message: currentMsg,
        chat_history: chatHistory,
      },
      (token) => {
        accumulated += token;
        setStreamingText(accumulated);
      },
      () => {
        // Stream done — strip markdown rồi mới lưu vào history
        const cleaned = stripMarkdown(accumulated);
        setChatHistory((prev) => [
          ...prev,
          {
            role: "assistant",
            content: cleaned || "Đã có lỗi xảy ra. Vui lòng thử lại sau.",
          },
        ]);
        setStreamingText("");
        setIsChatLoading(false);
      },
      (errMsg) => {
        setChatHistory((prev) => [
          ...prev,
          { role: "assistant", content: errMsg },
        ]);
        setStreamingText("");
        setIsChatLoading(false);
      },
    );

    streamAbortRef.current = abort;
  };

  useEffect(() => {
    // Abort any ongoing stream khi chuyển câu hỏi
    streamAbortRef.current?.();
    streamAbortRef.current = null;
    setChatHistory([]);
    setChatMessage("");
    setIsChatExpanded(false);
    setStreamingText("");
  }, [currentQuestionIndex]);

  const [submitResult, setSubmitResult] = useState<{
    correct_answers: Record<string, string>;
    explanations: Record<string, string | null>;
  } | null>(null);
  const [partSummaryText, setPartSummaryText] = useState<string | null>(null);
  const [partSummaryLoading, setPartSummaryLoading] = useState(false);
  const [partSummaryError, setPartSummaryError] = useState<string | null>(null);
  const partSummaryRequestedKeyRef = useRef<string | null>(null);
  const [questionRefreshVersion, setQuestionRefreshVersion] = useState(0);
  const practiceDraftStorageKey = useMemo(() => {
    if (toeicPart === null || !userId) return null;
    return buildPracticeDraftStorageKey(activeSkill, toeicPart, userId);
  }, [activeSkill, toeicPart, userId]);

  const resetPracticeRunState = useCallback(() => {
    setFirstAnswers({});
    setCurrentAttempt(null);
    setSolvedCorrectly(new Set());
    setCurrentQuestionIndex(0);
    setShowSummary(false);
    setAiExplanationByAttempt({});
    setAiLoadingByAttempt({});
    setAiErrorByAttempt({});
    setSubmitResult(null);
    setEarnedThisSession(null);
    setAttemptPointsThisSession(null);
    setPartSummaryText(null);
    setPartSummaryLoading(false);
    setPartSummaryError(null);
    partSummaryRequestedKeyRef.current = null;
  }, []);

  useEffect(() => {
    aiExplanationRef.current = aiExplanationByAttempt;
  }, [aiExplanationByAttempt]);

  useEffect(() => {
    aiLoadingRef.current = aiLoadingByAttempt;
  }, [aiLoadingByAttempt]);

  // Fetch TOEIC enrollment_id for vocab highlight feature
  useEffect(() => {
    if (!isListening) {
      getEnrollment("toeic")
        .then((enrollment) => {
          if (enrollment?.id) setToeicEnrollmentId(enrollment.id);
        })
        .catch(() => {
          /* non-critical */
        });
    }
  }, [isListening]);

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  // Scroll to top when going to next question
  useEffect(() => {
    if (!showSummary) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [currentQuestionIndex, showSummary]);

  // Fetch questions from API for mapped TOEIC parts
  useEffect(() => {
    if (toeicPart === null || !userId) return; // Advanced node — use hardcoded

    const draftKey = buildPracticeDraftStorageKey(
      activeSkill,
      toeicPart,
      userId,
    );
    const draft = loadPracticeRunDraft(draftKey);

    if (draft) {
      setDbQuestions(draft.questions);
      setSessionQuestionIds(draft.sessionQuestionIds);
      setFirstAnswers(draft.firstAnswers);
      setSolvedCorrectly(new Set(draft.solvedCorrectly));
      setCurrentQuestionIndex(draft.currentQuestionIndex);
      setCurrentAttempt(draft.currentAttempt);
      setAiExplanationByAttempt(draft.aiExplanationByAttempt);
      setAiErrorByAttempt(draft.aiErrorByAttempt);
      setReservePoints(draft.reservePoints ?? 0);
      setUnlockThreshold(draft.unlockThreshold);
      setExamUnlocked(draft.examUnlocked);

      const uniqueAudioUrls: string[] = [];
      const seen = new Set<string>();
      for (const q of draft.questions) {
        if (!q.audioUrl) continue;
        if (seen.has(q.audioUrl)) continue;
        seen.add(q.audioUrl);
        uniqueAudioUrls.push(q.audioUrl);
      }
      Promise.allSettled(
        uniqueAudioUrls
          .slice(0, 5)
          .map((url) => prefetchAudio(url, "metadata", 10000)),
      ).finally(() => {
        setDbLoading(false);
      });
      return;
    }

    setDbLoading(true);
    setDbError(null);

    resetPracticeRunState();
    // Reset audio cache mỗi lần load bộ câu hỏi mới để giải phóng bộ nhớ
    // (audio cũ giữ trong RAM có thể tốn vài chục MB).
    audioCacheRef.current.clear();

    getToeicPracticeQuestions(toeicPart)
      .then(async (data) => {
        if (!Array.isArray(data.questions) || data.questions.length === 0) {
          setDbQuestions(null);
          setSessionQuestionIds([]);
          setDbError(
            `Part ${toeicPart} hiện chưa có câu hỏi nào trong kho. Vui lòng liên hệ giáo viên để bổ sung bộ câu hỏi.`,
          );
          return;
        }

        const mapped: PracticeQuestion[] = data.questions.map((q) => ({
          id: String(q.id),
          question: q.stem ?? "",
          context: q.reading_passage ?? "",
          options: q.options
            .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
            .map((o) => ({
              key: o.option_key as "A" | "B" | "C" | "D",
              text: o.option_text,
            })),
          correctAnswer: (q.options.find((o) => o.is_correct)?.option_key ??
            "A") as "A" | "B" | "C" | "D",
          explanation: (q.ai_explanation ?? "").trim(),
          audioUrl: q.context_audio || null,
          imageUrl: q.context_image || null,
        }));

        // ── Prefetch audio: tải trước 5 audio URL đầu (unique) BEFORE
        //    setDbLoading(false) để khi user vào câu 1 thì audio sẵn sàng
        //    play ngay, không bị "00:00 đứng hình".
        //    Sau đó prefetch phần còn lại trong background (không await).
        const uniqueAudioUrls: string[] = [];
        const seen = new Set<string>();
        for (const q of mapped) {
          if (!q.audioUrl) continue;
          if (seen.has(q.audioUrl)) continue;
          seen.add(q.audioUrl);
          uniqueAudioUrls.push(q.audioUrl);
        }

        const PREFETCH_BLOCKING = 5;
        const blockingUrls = uniqueAudioUrls.slice(0, PREFETCH_BLOCKING);

        if (blockingUrls.length > 0) {
          // Blocking phase: chỉ chờ metadata (duration ready), audio dài
          // 1+ phút cũng resolve trong < 1s vì chỉ tải vài KB header.
          await Promise.all(
            blockingUrls.map((u) => prefetchAudio(u, "metadata")),
          );
        }

        // Set state SAU khi 5 audio đầu đã có metadata
        setDbQuestions(mapped.length > 0 ? mapped : null);
        setSessionQuestionIds(data.questions.map((q) => q.id));
        setReservePoints(data.current_reserve_points);
        setUnlockThreshold(data.unlock_threshold ?? 300);
        setExamUnlocked(data.current_reserve_points >= data.unlock_threshold);

        // Background: tải full bytes cho TẤT CẢ audio (kể cả 5 cái blocking
        // ở trên — vì chúng mới chỉ tải metadata). Pool 3 song song để cân
        // bằng giữa tốc độ và băng thông.
        if (uniqueAudioUrls.length > 0) {
          void (async () => {
            const POOL = 3;
            const queue = [...uniqueAudioUrls];
            const workers = Array.from({ length: POOL }, async () => {
              while (queue.length > 0) {
                const url = queue.shift();
                if (url) await prefetchAudio(url, "full", 60000);
              }
            });
            await Promise.all(workers);
          })();
        }
      })
      .catch((error: unknown) => {
        const msg =
          (error as any)?.response?.data?.message ??
          (error as any)?.message ??
          "Không tải được câu hỏi từ server.";
        setDbError(Array.isArray(msg) ? msg.join(" ") : String(msg));
      })
      .finally(() => setDbLoading(false));

    // Fetch Điểm Gốc (current_score) from personal scores API
    getPersonalScores()
      .then((scores) => {
        setCurrentScore(scores.current_score);
      })
      .catch(() => {
        // Non-critical — don't show error for this
      });
  }, [
    toeicPart,
    userId,
    activeSkill,
    questionRefreshVersion,
    practiceDraftStorageKey,
    resetPracticeRunState,
  ]);

  // Draft saving disabled for real-time practice.

  const isInvalidRoute =
    !nodeInfo || isNaN(parsedNodeIndex) || parsedNodeIndex < 0;

  // ── Derived ──────────────────────────────────────────────────────────────
  const currentQuestion = questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === questions.length - 1;

  // Whether current attempt is correct
  const isCurrentCorrect =
    currentAttempt !== null &&
    currentAttempt === currentQuestion?.correctAnswer;

  // Whether user has already solved this question (arrived at correct answer)
  const isCurrentSolved = solvedCorrectly.has(currentQuestionIndex);

  // Whether the first attempt on the current question was correct
  const firstAttemptCorrect =
    firstAnswers[currentQuestionIndex] !== undefined &&
    firstAnswers[currentQuestionIndex] === currentQuestion?.correctAnswer;

  // Count: questions where the FIRST answer was correct
  const correctCount = useMemo(
    () =>
      questions.reduce((acc, q, idx) => {
        return acc + (firstAnswers[idx] === q.correctAnswer ? 1 : 0);
      }, 0),
    [questions, firstAnswers],
  );

  // Điểm earned từ per-part cap (khớp với LearningMapPage)
  const scoreGained = useMemo(() => {
    if (toeicPart === null || !nodeInfo) return 0;
    const partKey = `part${toeicPart}`;
    const partConfig = DEFAULT_SCORING_CONFIG.skills
      .flatMap((s) => s.parts)
      .find((p) => p.key === partKey);
    if (!partConfig) return correctCount * (nodeInfo.scorePerCorrect ?? 2.5);
    const totalQ = getAllTotalQuestions();
    const range = 200; // dải điểm cố định
    const cap = getPartCap(partConfig, range, totalQ);
    const accuracy =
      partConfig.questions > 0 ? correctCount / partConfig.questions : 0;
    const earned = Math.min(
      cap,
      Math.pow(accuracy, DEFAULT_SCORING_CONFIG.curveExponent) * cap,
    );
    return parseFloat(earned.toFixed(1));
  }, [correctCount, nodeInfo, toeicPart]);

  const currentAttemptKey =
    currentAttempt !== null && currentQuestion
      ? `${currentQuestion.id}:${currentAttempt}`
      : null;
  const currentAttemptAi = currentAttemptKey
    ? aiExplanationByAttempt[currentAttemptKey]
    : undefined;
  const currentAttemptAiLoading = currentAttemptKey
    ? Boolean(aiLoadingByAttempt[currentAttemptKey])
    : false;
  const currentAttemptAiError = currentAttemptKey
    ? aiErrorByAttempt[currentAttemptKey]
    : undefined;

  const looksLikeOptionOnlyAnswer = useCallback((text: string): boolean => {
    const trimmed = text.trim();
    if (/^(?:dap an|đáp án)?\s*[A-D][.)\-:\s].*/i.test(trimmed)) {
      return true;
    }
    return trimmed.split(/\s+/).length <= 4;
  }, []);

  const isLikelyEnglishAnswer = useCallback((text: string): boolean => {
    if (
      /[ăâđêôơưáàảãạắằẳẵặấầẩẫậéèẻẽẹếềểễệíìỉĩịóòỏõọốồổỗộớờởỡợúùủũụứừửữựýỳỷỹỵ]/i.test(
        text,
      )
    ) {
      return false;
    }

    const lowered = text.toLowerCase();
    if (
      /^(the\s+correct\s+answer|correct\s+answer|in\s+this\s+sentence|because\s+)/i.test(
        lowered,
      )
    ) {
      return true;
    }

    const tokens = lowered.match(/[a-z]+/g) ?? [];
    if (tokens.length === 0) return false;

    const englishKeywords = new Set([
      "the",
      "is",
      "are",
      "was",
      "were",
      "because",
      "should",
      "must",
      "correct",
      "answer",
      "option",
      "choice",
      "selected",
      "subject",
      "verb",
      "noun",
      "adjective",
      "adverb",
      "tense",
      "grammar",
      "meaning",
      "blank",
      "sentence",
      "context",
      "therefore",
      "maintain",
      "consistency",
    ]);

    const matchedKeywords = tokens.filter((token) =>
      englishKeywords.has(token),
    ).length;

    return matchedKeywords >= 4 || matchedKeywords / tokens.length >= 0.18;
  }, []);

  const isGenericTemplateAnswer = useCallback((text: string): boolean => {
    const lowered = text.toLowerCase();
    return (
      lowered.includes("mình chưa tiết lộ đáp án đúng ở bước này") ||
      lowered.includes("gợi ý làm nhanh") ||
      lowered.includes("hệ thống ai tạm thời") ||
      lowered.includes("trả lời fallback") ||
      lowered.includes("chưa gọi được ai model") ||
      lowered.includes("chưa phù hợp với ngữ pháp/ngữ nghĩa của chỗ trống") ||
      lowered.includes("hãy kiểm tra lại dạng từ và vai trò của từ")
    );
  }, []);

  const shouldUseDbExplanationDirectly = useCallback(
    (text: string): boolean => {
      const normalized = text.trim();
      return normalized.length > 10;
    },
    [],
  );

  const buildAiUnavailableMessage = useCallback(
    (selectedOption: QuestionOption): string =>
      `Qwen chưa phản hồi ổn định cho lần chọn ${selectedOption.key}. Vui lòng bấm "Thử lại AI" để lấy phân tích chi tiết cho câu này.`,
    [],
  );

  const detectWeaknessTopic = useCallback(
    (questionData: PracticeQuestion, explanation: string): string => {
      const optionTokens = questionData.options
        .map((option) =>
          option.text
            .trim()
            .toLowerCase()
            .replace(/[^a-z]/g, ""),
        )
        .filter((token) => token.length > 0);
      const prepositionSet = new Set([
        "in",
        "on",
        "at",
        "by",
        "for",
        "to",
        "from",
        "with",
        "of",
        "about",
        "into",
        "onto",
        "over",
        "under",
      ]);

      const prepositionOptionHits = optionTokens.filter((token) =>
        prepositionSet.has(token),
      ).length;

      const merged = [
        questionData.question,
        questionData.context,
        questionData.options.map((option) => option.text).join(" "),
        explanation,
      ]
        .join("\n")
        .toLowerCase();

      if (
        /preposition|giới từ|responsible\s+for|in\s+charge\s+of|by\s*\/\s*at\s*\/\s*in\s*\/\s*on/i.test(
          merged,
        ) ||
        prepositionOptionHits >= 2
      ) {
        return "Preposition";
      }

      if (
        /subject\s*[- ]?\s*verb|s\s*[- ]?\s*v\s*agreement|hòa hợp chủ ngữ|chia động từ|subject and verb/i.test(
          merged,
        )
      ) {
        return "Subject-Verb Agreement";
      }

      if (
        /word\s*form|dạng từ|noun|verb|adjective|adverb|danh từ|động từ|tính từ|trạng từ/i.test(
          merged,
        )
      ) {
        return "Word Form";
      }

      if (/tense|thì|past|present|future|participle|chia thì/i.test(merged)) {
        return "Tense";
      }

      if (/collocation|cụm từ|đi với|phrasal|idiom/i.test(merged)) {
        return "Collocation";
      }

      return "Vocabulary/Meaning";
    },
    [],
  );

  const extractKnowledgeHints = useCallback((text: string): string[] => {
    const matches: string[] = [];
    const quotePattern = /"([^"\n]{3,48})"|'([^'\n]{3,48})'/g;
    let match: RegExpExecArray | null;

    while ((match = quotePattern.exec(text)) !== null) {
      const picked = (match[1] ?? match[2] ?? "").trim();
      if (picked.length >= 3) matches.push(picked);
      if (matches.length >= 4) break;
    }

    return Array.from(new Set(matches));
  }, []);

  const formatAiExplanationForDisplay = useCallback(
    (text: string, questionData: PracticeQuestion): string => {
      const cleaned = text
        .replace(/\r\n/g, "\n")
        .replace(/[ \t]+\n/g, "\n")
        .replace(/^#{1,6}\s*/gm, "")
        .replace(/\*\*(.*?)\*\*/g, "$1")
        .replace(/\n{3,}/g, "\n\n")
        .trim();

      const localized = cleaned
        .replace(
          /^\s*the\s+correct\s+answer\s*(?:is|:)\s*/gim,
          "Đáp án đúng là ",
        )
        .replace(/^\s*correct\s+answer\s*[:\-]\s*/gim, "Đáp án đúng là ")
        .replace(
          /^\s*option\s+breakdown\s*[:\-]?\s*/gim,
          "Phân tích phương án:",
        )
        .replace(/^\s*option\s*([A-D])\s*[:\-]\s*/gim, "- $1: ")
        .replace(/^\s*choice\s*([A-D])\s*[:\-]\s*/gim, "- $1: ")
        .replace(/^\s*([A-D])\s*[.)\-:]\s*/gim, "- $1: ")
        .replace(/^\s*phân tích các phương án còn lại\s*:?[ \t]*$/gim, "")
        .replace(/^\s*phân tích phương án\s*:?[ \t]*$/gim, "")
        .replace(/^\s*summary\s*[:\-]\s*/gim, "Tóm tắt: ")
        .trim();

      const lines = localized
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line.length > 0);

      let detectedCorrectAnswer = questionData.correctAnswer;
      let correctLeadReason = "";

      const explicitCorrectLine = lines.find((line) =>
        /^đáp án đúng\s*(?::|là)/i.test(line),
      );

      if (explicitCorrectLine) {
        const detected = explicitCorrectLine.match(/\b([A-D])\b/i)?.[1];
        if (detected) {
          detectedCorrectAnswer = detected.toUpperCase() as
            | "A"
            | "B"
            | "C"
            | "D";
        }

        correctLeadReason = explicitCorrectLine
          .replace(/^đáp án đúng\s*(?::|là)\s*[A-D][.)]?\s*/i, "")
          .trim();
      }

      const optionReasonByKey = new Map<"A" | "B" | "C" | "D", string>();
      const narrativeLines: string[] = [];
      let activeOptionKey: "A" | "B" | "C" | "D" | null = null;

      lines.forEach((line) => {
        if (/^đáp án đúng\s*(?::|là)/i.test(line)) {
          activeOptionKey = null;
          return;
        }

        if (/^phân tích\s*(các\s*)?phương án\s*:?/i.test(line)) {
          activeOptionKey = null;
          return;
        }

        if (/^tóm tắt\s*:/i.test(line)) {
          activeOptionKey = null;
          return;
        }

        const optionMatch = line.match(
          /^(?:[-•]\s*)?([A-D])\s*[:.)\-]\s*(.+)$/i,
        );
        if (optionMatch) {
          const optionKey = optionMatch[1].toUpperCase() as
            | "A"
            | "B"
            | "C"
            | "D";
          const optionReason = optionMatch[2].trim();
          optionReasonByKey.set(optionKey, optionReason);
          activeOptionKey = optionKey;
          return;
        }

        if (activeOptionKey) {
          const previous = optionReasonByKey.get(activeOptionKey) ?? "";
          optionReasonByKey.set(activeOptionKey, `${previous} ${line}`.trim());
          return;
        }

        narrativeLines.push(line);
      });

      const isWeakReason = (
        reason: string,
        optionKey: "A" | "B" | "C" | "D",
      ) => {
        const compact = reason.replace(/\s+/g, " ").trim();
        if (compact.length < 18) return true;

        const optionText =
          questionData.options
            .find((option) => option.key === optionKey)
            ?.text.trim()
            .toLowerCase() ?? "";

        if (optionText && compact.toLowerCase() === optionText) return true;
        if (/^(đúng|sai|correct|incorrect)[.!]?$/i.test(compact)) return true;

        return false;
      };

      const inferredCorrectReason =
        (correctLeadReason.length >= 18 ? correctLeadReason : "") ||
        narrativeLines.find((line) => line.length >= 18) ||
        `"${questionData.options.find((option) => option.key === detectedCorrectAnswer)?.text ?? detectedCorrectAnswer}" phù hợp nhất với ngữ cảnh và yêu cầu ngữ pháp của câu.`;

      const canonicalOptionLines = questionData.options.map((option) => {
        const currentReason = (optionReasonByKey.get(option.key) ?? "").trim();

        const resolvedReason = isWeakReason(currentReason, option.key)
          ? option.key === detectedCorrectAnswer
            ? inferredCorrectReason
            : `"${option.text}" không phù hợp với ngữ cảnh hoặc yêu cầu ngữ pháp của câu.`
          : currentReason;

        return `- ${option.key}: ${resolvedReason}`;
      });

      return [
        `Đáp án đúng là ${detectedCorrectAnswer}.`,
        "",
        "Phân tích phương án:",
        ...canonicalOptionLines,
      ]
        .join("\n")
        .replace(/\n{3,}/g, "\n\n")
        .trim();
    },
    [],
  );

  const fallbackDbExplanation = currentQuestion?.explanation?.trim() ?? "";
  const hasFallbackDbExplanation =
    !!currentQuestion && shouldUseDbExplanationDirectly(fallbackDbExplanation);
  const formattedFallbackDbExplanation = hasFallbackDbExplanation
    ? formatAiExplanationForDisplay(fallbackDbExplanation, currentQuestion)
    : "";

  const resolveReviewExplanation = useCallback(
    (
      questionData: PracticeQuestion,
      questionIndex: number,
      submittedExplanations?: Record<string, string | null>,
    ): string => {
      const attemptKey = `${questionData.id}:${questionData.correctAnswer}`;
      const cachedAi = aiExplanationByAttempt[attemptKey]?.answer?.trim();
      if (cachedAi) {
        const formattedCached = formatAiExplanationForDisplay(
          cachedAi,
          questionData,
        );

        if (!isLikelyEnglishAnswer(formattedCached)) {
          return formattedCached;
        }
      }

      const submittedQuestionId = sessionQuestionIds[questionIndex];
      const explanationFromSubmit =
        (submittedExplanations &&
          (submittedExplanations[String(submittedQuestionId)] ??
            submittedExplanations[questionData.id])) ??
        (submitResult?.explanations &&
          (submitResult.explanations[String(submittedQuestionId)] ??
            submitResult.explanations[questionData.id])) ??
        questionData.explanation ??
        "";

      const normalizedFromSubmit = explanationFromSubmit.trim();
      if (normalizedFromSubmit.length > 0) {
        const formattedFromSubmit = formatAiExplanationForDisplay(
          normalizedFromSubmit,
          questionData,
        );

        if (!isLikelyEnglishAnswer(formattedFromSubmit)) {
          return formattedFromSubmit;
        }
      }

      return formatAiExplanationForDisplay(
        `Hiện tại chưa có phần giải thích từng đáp án cho câu hỏi, bạn thông cảm nhé! 🥺\n(Đáp án đúng là ${questionData.correctAnswer})`,
        questionData,
      );
    },
    [
      aiExplanationByAttempt,
      formatAiExplanationForDisplay,
      isLikelyEnglishAnswer,
      sessionQuestionIds,
      submitResult,
    ],
  );

  const buildFallbackPartSummary = useCallback((): string => {
    if (toeicPart === null) return "";

    const summaryRows = questions.map((questionData, questionIndex) => {
      const firstAttempt = firstAnswers[questionIndex] ?? null;
      const gotItFirstTry = firstAttempt === questionData.correctAnswer;
      const explanation = resolveReviewExplanation(questionData, questionIndex);
      const topic = detectWeaknessTopic(questionData, explanation);
      return {
        gotItFirstTry,
        topic,
        explanation,
      };
    });

    const strengthTopicCounts = new Map<string, number>();
    const weaknessTopicCounts = new Map<string, number>();

    summaryRows.forEach((row) => {
      const target = row.gotItFirstTry
        ? strengthTopicCounts
        : weaknessTopicCounts;
      target.set(row.topic, (target.get(row.topic) ?? 0) + 1);
    });

    const strongest =
      [...strengthTopicCounts.entries()].sort((a, b) => b[1] - a[1])[0] ??
      (["Độ chính xác lần đầu", correctCount] as const);
    const weakest =
      [...weaknessTopicCounts.entries()].sort((a, b) => b[1] - a[1])[0] ??
      (["Preposition", Math.max(1, questions.length - correctCount)] as const);

    const knowledgeHints = Array.from(
      new Set(
        summaryRows
          .filter((row) => !row.gotItFirstTry)
          .flatMap((row) => extractKnowledgeHints(row.explanation)),
      ),
    ).slice(0, 2);

    const knowledgeLine =
      knowledgeHints.length > 0
        ? knowledgeHints.map((hint) => `"${hint}"`).join(" và ")
        : weakest[0] === "Preposition"
          ? 'cụm "responsible for" và "in charge of"'
          : `${weakest[0]} theo ngữ cảnh câu TOEIC`;

    const weakTopicForPractice =
      weakest[0] === "Preposition" ? "preposition" : weakest[0].toLowerCase();

    return [
      `Tóm tắt Part ${toeicPart} - ${questions.length} câu vừa làm:`,
      `• Bạn mạnh về ${strongest[0]} (${strongest[1]}/${Math.max(1, correctCount)} đúng).`,
      `• Điểm yếu lớn: ${weakest[0]} (${weakest[1]}/${Math.max(1, questions.length - correctCount)} lỗi).`,
      `• Kiến thức cần ôn thêm: ${knowledgeLine}.`,
      `• Gợi ý: Làm thêm 8 câu về ${weakTopicForPractice} ở mức 550-650.`,
    ].join("\n");
  }, [
    correctCount,
    detectWeaknessTopic,
    extractKnowledgeHints,
    firstAnswers,
    questions,
    resolveReviewExplanation,
    toeicPart,
  ]);

  const normalizePartSummaryOutput = useCallback(
    (rawText: string): string | null => {
      if (toeicPart === null) return null;

      const cleaned = rawText
        .replace(/\r\n/g, "\n")
        .replace(/^#{1,6}\s*/gm, "")
        .replace(/\*\*(.*?)\*\*/g, "$1")
        .replace(/```[\s\S]*?```/g, "")
        .trim();

      const lines = cleaned
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line.length > 0);

      const bulletLines = lines
        .filter(
          (line) =>
            /^[-•]/.test(line) ||
            /^(bạn mạnh|điểm yếu|kiến thức cần ôn thêm|gợi ý)\s*:/i.test(line),
        )
        .map((line) => {
          const normalized = line.replace(/^[-•]\s*/, "").trim();
          return `• ${normalized}`;
        });

      if (bulletLines.length < 4) return null;

      return [
        `Tóm tắt Part ${toeicPart} - ${questions.length} câu vừa làm:`,
        ...bulletLines.slice(0, 4),
      ].join("\n");
    },
    [questions.length, toeicPart],
  );

  const appendSessionMistakeHistory = useCallback(
    (submittedExplanations?: Record<string, string | null>) => {
      if (toeicPart === null) return;

      const wrongItems = questions
        .map((questionData, questionIndex) => {
          const firstAttempt = firstAnswers[questionIndex] ?? null;
          if (!firstAttempt || firstAttempt === questionData.correctAnswer) {
            return null;
          }

          const explanation = resolveReviewExplanation(
            questionData,
            questionIndex,
            submittedExplanations,
          );

          return {
            questionId: questionData.id,
            question: questionData.question,
            firstAttempt,
            correctAnswer: questionData.correctAnswer,
            topic: detectWeaknessTopic(questionData, explanation),
            explanation: explanation.slice(0, 700),
            createdAt: new Date().toISOString(),
          } satisfies PracticeMistakeHistoryItem;
        })
        .filter((item): item is PracticeMistakeHistoryItem => item !== null);

      appendPracticeMistakeHistory(activeSkill, toeicPart, wrongItems);
    },
    [
      activeSkill,
      detectWeaknessTopic,
      firstAnswers,
      questions,
      resolveReviewExplanation,
      toeicPart,
    ],
  );

  // Theme colors
  const theme = isListening
    ? {
        primary: "teal",
        gradient: "from-teal-600 to-cyan-500",
        gradientLight: "from-teal-50 to-cyan-50",
        border: "border-teal-200",
        borderStrong: "border-teal-400",
        bg: "bg-teal-50",
        bgStrong: "bg-teal-600",
        bgMedium: "bg-teal-100",
        text: "text-teal-700",
        textStrong: "text-teal-900",
        textMuted: "text-teal-600",
        ring: "ring-teal-400",
        progressBar: "bg-gradient-to-r from-teal-500 to-cyan-400",
        buttonPrimary: "bg-teal-600 hover:bg-teal-700 text-white",
        optionSelected: "border-teal-500 bg-teal-50",
        pageGradient:
          "linear-gradient(160deg, #f0fdfa 0%, #e0f7f8 40%, #f0fdf4 100%)",
      }
    : {
        primary: "emerald",
        gradient: "from-emerald-600 to-green-500",
        gradientLight: "from-emerald-50 to-green-50",
        border: "border-emerald-200",
        borderStrong: "border-emerald-400",
        bg: "bg-emerald-50",
        bgStrong: "bg-emerald-600",
        bgMedium: "bg-emerald-100",
        text: "text-emerald-700",
        textStrong: "text-emerald-900",
        textMuted: "text-emerald-600",
        ring: "ring-emerald-400",
        progressBar: "bg-gradient-to-r from-emerald-500 to-green-400",
        buttonPrimary: "bg-emerald-600 hover:bg-emerald-700 text-white",
        optionSelected: "border-emerald-500 bg-emerald-50",
        pageGradient:
          "linear-gradient(160deg, #f0fdf4 0%, #dcfce7 40%, #f0fdfa 100%)",
      };

  // ── Handlers ─────────────────────────────────────────────────────────────
  const buildTutorQuestion = useCallback(
    (
      questionData: PracticeQuestion,
      questionIndex: number,
      selectedOption: QuestionOption,
      shouldRevealCorrectAnswer: boolean,
    ): { question: string; learningContext: string } => {
      const optionsText = questionData.options
        .map((option) => `${option.key}. ${option.text}`)
        .join("\n");

      const question = [
        shouldRevealCorrectAnswer
          ? "[FULL_EXPLANATION] Phân tích theo thứ tự bắt buộc: nêu đáp án đúng -> phân tích lần lượt A/B/C/D -> chỉ ra dấu hiệu nhận biết trong đề."
          : "[HINT_ONLY] BẮT BUỘC kết luận lựa chọn học viên hiện tại là sai/chưa phù hợp, rồi phân tích dấu hiệu nhận biết + quy tắc áp dụng.",
        "Prompt policy: TOEIC_AI_V5_STRUCTURED_REASONING",
        `Câu hỏi: ${questionData.question}`,
        `Học viên chọn: ${selectedOption.key}. ${selectedOption.text}`,
        shouldRevealCorrectAnswer
          ? [
              `Đáp án đúng: ${questionData.correctAnswer}.`,
              "FORMAT TRẢ LỜI BẮT BUỘC:",
              `Đáp án đúng là ${questionData.correctAnswer}.`,
              "Phân tích phương án:",
              "- A: ...",
              "- B: ...",
              "- C: ...",
              "- D: ...",
            ].join("\n")
          : "Ràng buộc: TUYỆT ĐỐI KHÔNG nêu đáp án đúng, không nêu chữ cái đáp án đúng, không gợi ý chọn phương án khác.",
      ].join("\n");

      const learningContext = [
        `Skill: ${activeSkill}`,
        `Node: ${parsedNodeIndex}`,
        `Question index: ${questionIndex + 1}`,
        questionData.context ? `Context/Script: ${questionData.context}` : "",
        `Options:\n${optionsText}`,
        shouldRevealCorrectAnswer
          ? [
              "Yêu cầu chất lượng:",
              '- Mở đầu trực tiếp theo mẫu: "Đáp án đúng là ...".',
              '- Chỉ dùng đúng 1 heading duy nhất: "Phân tích phương án:".',
              "- Bắt buộc nhắc lại ít nhất 1 dấu hiệu trong câu (keyword/time marker/collocation).",
              "- Bắt buộc có đủ 4 dòng A/B/C/D, trong đó phương án đúng cũng phải giải thích rõ vì sao đúng.",
              "- Không mở đầu bằng câu: lựa chọn học viên hiện tại là ĐÚNG/SAI.",
              "- Không trả lời chung chung; phải gắn trực tiếp vào câu hỏi này.",
            ].join("\n")
          : [
              "Yêu cầu chất lượng:",
              "- Không tiết lộ đáp án đúng hoặc chữ cái đáp án đúng.",
              "- Tuyệt đối không gợi ý đáp án khác, không đề xuất phương án nên chọn.",
              "- Kết luận rõ lựa chọn học viên hiện tại sai/chưa phù hợp.",
              "- Nêu dấu hiệu nhận biết trong câu và quy tắc liên quan (word form/tense/S-V agreement/collocation/preposition).",
              "- Giải thích trực tiếp vì sao lựa chọn học viên không khớp chỗ trống.",
              "- Không trả lời kiểu chung chung hoặc chỉ khuyên 'xem lại ngữ pháp'.",
            ].join("\n"),
      ]
        .filter((line) => line.length > 0)
        .join("\n\n");

      return { question, learningContext };
    },
    [activeSkill, parsedNodeIndex],
  );

  const fetchAiExplanation = useCallback(
    async (questionIndex: number, optionKey: string, force = false) => {
      const questionData = questions[questionIndex];
      if (!questionData) return;

      const selectedOption = questionData.options.find(
        (option) => option.key === optionKey,
      );
      if (!selectedOption) return;

      const attemptKey = `${questionData.id}:${optionKey}`;
      const shouldRevealCorrectAnswer =
        optionKey === questionData.correctAnswer;

      const dbExplanation = questionData.explanation.trim();
      if (
        shouldRevealCorrectAnswer &&
        shouldUseDbExplanationDirectly(dbExplanation)
      ) {
        const formattedDbExplanation = formatAiExplanationForDisplay(
          dbExplanation,
          questionData,
        );

        // Guard removed: Always accept DB explanation if it exists
        const cachedFromDb: AiTutorExplanation = {
          answer: formattedDbExplanation,
          model: "toeic_practice_db",
          source: "cache",
        };

        if (force || !aiExplanationRef.current[attemptKey]) {
          setAiExplanationByAttempt((prev) => ({
            ...prev,
            [attemptKey]: cachedFromDb,
          }));
          aiExplanationRef.current = {
            ...aiExplanationRef.current,
            [attemptKey]: cachedFromDb,
          };
        }

        aiLoadingRef.current = {
          ...aiLoadingRef.current,
          [attemptKey]: false,
        };
        setAiLoadingByAttempt((prev) => ({ ...prev, [attemptKey]: false }));
        setAiErrorByAttempt((prev) => {
          const next = { ...prev };
          delete next[attemptKey];
          return next;
        });
        return;
      }

      // Only analyze when learner reaches the correct option.
      if (!shouldRevealCorrectAnswer) return;

      if (
        !force &&
        (aiExplanationRef.current[attemptKey] ||
          aiLoadingRef.current[attemptKey])
      ) {
        return;
      }

      if (force) {
        const nextExplanationRef = { ...aiExplanationRef.current };
        delete nextExplanationRef[attemptKey];
        aiExplanationRef.current = nextExplanationRef;
        setAiExplanationByAttempt((prev) => {
          const next = { ...prev };
          delete next[attemptKey];
          return next;
        });
      }

      const { question, learningContext } = buildTutorQuestion(
        questionData,
        questionIndex,
        selectedOption,
        shouldRevealCorrectAnswer,
      );

      aiLoadingRef.current = { ...aiLoadingRef.current, [attemptKey]: true };
      setAiLoadingByAttempt((prev) => ({ ...prev, [attemptKey]: true }));
      setAiErrorByAttempt((prev) => {
        const next = { ...prev };
        delete next[attemptKey];
        return next;
      });

      try {
        const stableQuestionToken = String(questionData.id)
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "_");

        const response = await askCertificateTutor({
          cert_type: "toeic",
          question,
          topic_key: `toeic.practice.full.v2.q_${stableQuestionToken}`,
          learning_context: learningContext,
          concise: false,
        });

        const safeAnswer = response.answer.trim();

        const isLowSignalAnswer =
          safeAnswer.length < 24 ||
          looksLikeOptionOnlyAnswer(safeAnswer) ||
          isLikelyEnglishAnswer(safeAnswer) ||
          isGenericTemplateAnswer(safeAnswer);

        if (response.source === "fallback" || isLowSignalAnswer) {
          throw new Error(buildAiUnavailableMessage(selectedOption));
        }

        const formattedAnswer = formatAiExplanationForDisplay(
          safeAnswer,
          questionData,
        );

        const formattedIsLowSignal =
          looksLikeOptionOnlyAnswer(formattedAnswer) ||
          isLikelyEnglishAnswer(formattedAnswer) ||
          isGenericTemplateAnswer(formattedAnswer);

        if (formattedIsLowSignal) {
          throw new Error(buildAiUnavailableMessage(selectedOption));
        }

        setAiExplanationByAttempt((prev) => ({
          ...prev,
          [attemptKey]: {
            answer: formattedAnswer,
            model: response.model,
            source: response.source,
          },
        }));
        aiExplanationRef.current = {
          ...aiExplanationRef.current,
          [attemptKey]: {
            answer: formattedAnswer,
            model: response.model,
            source: response.source,
          },
        };
      } catch (error) {
        const message =
          error instanceof Error && error.message.trim().length > 0
            ? error.message
            : buildAiUnavailableMessage(selectedOption);
        setAiErrorByAttempt((prev) => ({ ...prev, [attemptKey]: message }));
      } finally {
        aiLoadingRef.current = { ...aiLoadingRef.current, [attemptKey]: false };
        setAiLoadingByAttempt((prev) => ({ ...prev, [attemptKey]: false }));
      }
    },
    [
      activeSkill,
      buildAiUnavailableMessage,
      buildTutorQuestion,
      formatAiExplanationForDisplay,
      isGenericTemplateAnswer,
      isLikelyEnglishAnswer,
      looksLikeOptionOnlyAnswer,
      parsedNodeIndex,
      questions,
      shouldUseDbExplanationDirectly,
    ],
  );

  // NOTE: Đã bỏ effect prefetch toàn bộ câu hỏi (gây nghẽn AI tutor backend
  // và làm "Câu tiếp theo" / "Đang tải dữ liệu..." treo lâu).
  // Chỉ giữ prefetch theo câu hiện tại + 1 câu kế để tối ưu UX mà không spam.

  useEffect(() => {
    if (questions.length === 0) return;

    const endIndex = Math.min(
      questions.length - 1,
      currentQuestionIndex + AI_PREFETCH_PRIORITY_AHEAD,
    );

    for (
      let questionIndex = currentQuestionIndex;
      questionIndex <= endIndex;
      questionIndex += 1
    ) {
      void fetchAiExplanation(
        questionIndex,
        questions[questionIndex].correctAnswer,
        false,
      );
    }
  }, [currentQuestionIndex, fetchAiExplanation, questions]);

  // Audio prefetch ahead: đảm bảo audio của câu hiện tại + 2 câu kế tiếp đã
  // được tải đủ buffer trước khi user bấm "Tiếp theo". Mode 'full' vì user
  // sắp phát thực sự. Idempotent — call lại với URL đã cache sẽ resolve ngay.
  useEffect(() => {
    if (questions.length === 0) return;
    const AHEAD = 2;
    const endIndex = Math.min(
      questions.length - 1,
      currentQuestionIndex + AHEAD,
    );
    for (let i = currentQuestionIndex; i <= endIndex; i++) {
      const url = questions[i]?.audioUrl;
      if (url) void prefetchAudio(url, "full", 60000);
    }
  }, [currentQuestionIndex, questions, prefetchAudio]);

  useEffect(() => {
    if (!showSummary || questions.length === 0) return;

    questions.forEach((questionData, questionIndex) => {
      const attemptKey = `${questionData.id}:${questionData.correctAnswer}`;
      if (
        aiExplanationByAttempt[attemptKey] ||
        aiLoadingByAttempt[attemptKey] ||
        aiErrorByAttempt[attemptKey]
      ) {
        return;
      }

      void fetchAiExplanation(questionIndex, questionData.correctAnswer, false);
    });
  }, [
    aiErrorByAttempt,
    aiExplanationByAttempt,
    aiLoadingByAttempt,
    fetchAiExplanation,
    questions,
    showSummary,
  ]);

  const partSummaryRequestKey = useMemo(() => {
    const answerSignature = Object.entries(firstAnswers)
      .sort((a, b) => Number(a[0]) - Number(b[0]))
      .map(([index, value]) => `${index}:${value}`)
      .join("|");

    return `${activeSkill}:${toeicPart ?? "na"}:${sessionQuestionIds.join(",")}:${answerSignature}`;
  }, [activeSkill, firstAnswers, sessionQuestionIds, toeicPart]);

  useEffect(() => {
    if (!showSummary || toeicPart === null || questions.length === 0) return;
    if (partSummaryRequestedKeyRef.current === partSummaryRequestKey) return;

    partSummaryRequestedKeyRef.current = partSummaryRequestKey;

    let cancelled = false;

    const generatePartSummary = async () => {
      setPartSummaryLoading(true);
      setPartSummaryError(null);

      const fallbackSummary = buildFallbackPartSummary();
      // Show summary immediately; AI response will refine this in background.
      setPartSummaryText(fallbackSummary);

      try {
        const historyRows = getPracticeMistakeHistory(
          activeSkill,
          toeicPart,
          24,
        );

        const sessionRows = questions.map((questionData, questionIndex) => {
          const firstAttempt = firstAnswers[questionIndex] ?? "-";
          const explanation = resolveReviewExplanation(
            questionData,
            questionIndex,
          );
          const topic = detectWeaknessTopic(questionData, explanation);

          return [
            `Q${questionIndex + 1}: ${questionData.question}`,
            `first_attempt=${firstAttempt}; correct=${questionData.correctAnswer}; result=${firstAttempt === questionData.correctAnswer ? "first_try_correct" : "retry_then_correct"}`,
            `topic=${topic}`,
            `explanation=${explanation}`,
          ].join("\n");
        });

        const historyText =
          historyRows.length === 0
            ? "Không có dữ liệu lịch sử sai trước đó."
            : historyRows
                .map(
                  (item, idx) =>
                    `${idx + 1}. topic=${item.topic}; first=${item.firstAttempt}; correct=${item.correctAnswer}; question=${item.question}; explanation=${item.explanation}`,
                )
                .join("\n");

        const summaryQuestion = [
          `[PART_SUMMARY] Viết tóm tắt học tập cho Part ${toeicPart} sau ${questions.length} câu vừa làm.`,
          "BẮT BUỘC trả lời 100% bằng tiếng Việt (giữ nguyên thuật ngữ TOEIC nếu cần).",
          "BẮT BUỘC đúng format 5 dòng:",
          `Tóm tắt Part ${toeicPart} - ${questions.length} câu vừa làm:`,
          "• Bạn mạnh về ...",
          "• Điểm yếu lớn: ...",
          "• Kiến thức cần ôn thêm: ...",
          "• Gợi ý: ...",
          "Không thêm markdown, không code block, không thêm phần mở đầu/kết luận khác.",
        ].join("\n");

        const learningContext = [
          `Skill: ${activeSkill}`,
          `Part: ${toeicPart}`,
          `Đúng lần đầu: ${correctCount}/${questions.length}`,
          `Dữ liệu RAG - ${questions.length} câu vừa làm:`,
          sessionRows.join("\n\n"),
          "Dữ liệu RAG - lịch sử sai của user:",
          historyText,
        ].join("\n\n");

        const topicKey = `toeic.practice.summary.v2.part_${toeicPart}.set_${sessionQuestionIds.join("_")}.first_${correctCount}`;

        const response = await askCertificateTutor({
          cert_type: "toeic",
          question: summaryQuestion,
          topic_key: topicKey,
          learning_context: learningContext,
          concise: false,
        });

        if (cancelled) return;

        const normalizedSummary = normalizePartSummaryOutput(response.answer);

        if (
          response.source === "fallback" ||
          !normalizedSummary ||
          isLikelyEnglishAnswer(normalizedSummary)
        ) {
          setPartSummaryText(fallbackSummary);
          setPartSummaryError(
            "AI summary chưa ổn định, đang hiển thị tóm tắt chuẩn hóa.",
          );
          return;
        }

        setPartSummaryText(normalizedSummary);
      } catch {
        if (cancelled) return;
        setPartSummaryText(fallbackSummary);
        setPartSummaryError(
          "Không gọi được AI summary, đang hiển thị tóm tắt chuẩn hóa.",
        );
      } finally {
        if (!cancelled) setPartSummaryLoading(false);
      }
    };

    void generatePartSummary();

    return () => {
      cancelled = true;
    };
  }, [
    activeSkill,
    buildFallbackPartSummary,
    correctCount,
    detectWeaknessTopic,
    firstAnswers,
    isLikelyEnglishAnswer,
    normalizePartSummaryOutput,
    partSummaryRequestKey,
    questions,
    resolveReviewExplanation,
    sessionQuestionIds,
    showSummary,
    toeicPart,
  ]);

  const handleRetryAiExplanation = useCallback(() => {
    if (!currentAttempt) return;
    void fetchAiExplanation(currentQuestionIndex, currentAttempt, true);
  }, [currentAttempt, currentQuestionIndex, fetchAiExplanation]);

  const goBackToLearningMap = useCallback(() => {
    navigate(`/student/certificate-review/toeic/skill/${activeSkill}`);
  }, [activeSkill, navigate]);

  // Save practice draft whenever state changes
  useEffect(() => {
    if (!practiceDraftStorageKey || questions.length === 0 || showSummary)
      return;

    savePracticeRunDraft(practiceDraftStorageKey, {
      questions,
      sessionQuestionIds,
      currentQuestionIndex,
      firstAnswers,
      solvedCorrectly: Array.from(solvedCorrectly),
      currentAttempt,
      aiExplanationByAttempt,
      aiErrorByAttempt,
      reservePoints,
      unlockThreshold,
      examUnlocked,
      updatedAt: new Date().toISOString(),
    });
  }, [
    practiceDraftStorageKey,
    questions,
    sessionQuestionIds,
    currentQuestionIndex,
    firstAnswers,
    solvedCorrectly,
    currentAttempt,
    aiExplanationByAttempt,
    aiErrorByAttempt,
    reservePoints,
    unlockThreshold,
    examUnlocked,
    showSummary,
  ]);

  // Guards
  if (dbLoading) {
    return (
      <div
        className="min-h-screen flex flex-col"
        style={{ background: theme.pageGradient }}
      >
        <Header />
        <main className="flex-1 flex items-center justify-center px-4">
          <div className="w-full max-w-md rounded-2xl border border-white/60 bg-white/85 backdrop-blur-sm shadow-xl p-8 text-center space-y-4">
            <div className="w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-base font-semibold text-slate-700">
              Đang chuẩn bị bộ câu hỏi luyện tập...
            </p>
            <p className="text-sm text-slate-500">
              Hệ thống đang ghép bộ câu hỏi và tải sẵn audio để bạn luyện tập
              mượt mà.
            </p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (dbError) {
    const compactError = dbError.replace(/\((?:404|409)\)/g, "").trim();
    const isQuestionPoolIssue =
      /cau hoi|câu hỏi|part|publish|bo sung|bổ sung|409|404|khong tim thay|không tìm thấy/i.test(
        dbError,
      );

    /* ── colour tokens derived from the page theme ─────────────── */
    const accent = isListening ? "#0d9488" : "#059669"; // teal-600 / emerald-600
    const accentLight = isListening ? "#ccfbf1" : "#d1fae5"; // teal-100 / emerald-100
    const accentPale = isListening ? "#f0fdfa" : "#ecfdf5"; // teal-50  / emerald-50
    const accentMid = isListening ? "#5eead4" : "#6ee7b7"; // teal-300 / emerald-300
    const accentDark = isListening ? "#115e59" : "#064e3b"; // teal-800 / emerald-800
    const accentShadow = isListening
      ? "rgba(13,148,136,0.25)"
      : "rgba(5,150,105,0.25)";

    const handleRetryClick = () => {
      setQuestionRefreshVersion((prev) => prev + 1);
    };

    return (
      <div
        className="min-h-screen flex flex-col"
        style={{ background: theme.pageGradient }}
      >
        <Header />
        <main className="flex-1 py-10 px-4">
          <div className="max-w-3xl mx-auto">
            <div
              className="relative overflow-hidden rounded-3xl"
              style={{
                background:
                  "linear-gradient(145deg, #ffffff 0%, #f9fffe 60%, #f0fdfa 100%)",
                border: `1px solid ${accentMid}33`,
                boxShadow: `0 12px 48px ${accentShadow}, 0 2px 8px rgba(0,0,0,0.03)`,
              }}
            >
              {/* Gradient top accent */}
              <div
                style={{
                  height: "4px",
                  background: `linear-gradient(90deg, ${accent}, ${accentMid}, ${accent})`,
                }}
              />

              {/* Decorative bg shapes — using theme-compatible tints */}
              <div
                style={{
                  position: "absolute",
                  top: "-40px",
                  right: "-40px",
                  width: "160px",
                  height: "160px",
                  borderRadius: "50%",
                  background: `${accentLight}88`,
                }}
              />
              <div
                style={{
                  position: "absolute",
                  bottom: "-60px",
                  left: "-30px",
                  width: "200px",
                  height: "200px",
                  borderRadius: "50%",
                  background: `${accentPale}cc`,
                }}
              />

              <div className="relative px-8 py-10 sm:px-12 sm:py-12">
                {/* SVG Illustration — slate + accent harmony */}
                <div className="flex justify-center mb-8">
                  <div
                    style={{
                      position: "relative",
                      width: "140px",
                      height: "140px",
                    }}
                  >
                    <svg
                      viewBox="0 0 140 140"
                      style={{ width: "100%", height: "100%" }}
                    >
                      <circle cx="70" cy="70" r="65" fill={accentPale} />
                      <circle
                        cx="70"
                        cy="70"
                        r="55"
                        fill="none"
                        stroke={accentMid}
                        strokeWidth="1.5"
                        strokeDasharray="6 4"
                        opacity="0.5"
                      />
                      {/* Document body */}
                      <rect
                        x="45"
                        y="35"
                        width="40"
                        height="52"
                        rx="6"
                        fill="white"
                        stroke={accentMid}
                        strokeWidth="1.8"
                      />
                      <rect
                        x="52"
                        y="48"
                        width="26"
                        height="3"
                        rx="1.5"
                        fill={accentLight}
                      />
                      <rect
                        x="52"
                        y="55"
                        width="20"
                        height="3"
                        rx="1.5"
                        fill={accentLight}
                      />
                      <rect
                        x="52"
                        y="62"
                        width="14"
                        height="3"
                        rx="1.5"
                        fill={accentLight}
                      />
                      {/* Question mark badge */}
                      <circle cx="85" cy="42" r="16" fill={accent} />
                      <text
                        x="85"
                        y="48"
                        textAnchor="middle"
                        fill="white"
                        fontSize="18"
                        fontWeight="bold"
                      >
                        ?
                      </text>
                      {/* Floating dots */}
                      <circle
                        cx="25"
                        cy="50"
                        r="4"
                        fill={accentMid}
                        opacity="0.5"
                      >
                        <animate
                          attributeName="cy"
                          values="50;44;50"
                          dur="3s"
                          repeatCount="indefinite"
                        />
                      </circle>
                      <circle
                        cx="115"
                        cy="85"
                        r="3"
                        fill={accentMid}
                        opacity="0.4"
                      >
                        <animate
                          attributeName="cy"
                          values="85;78;85"
                          dur="4s"
                          repeatCount="indefinite"
                        />
                      </circle>
                      <circle
                        cx="30"
                        cy="100"
                        r="2.5"
                        fill="#94a3b8"
                        opacity="0.35"
                      >
                        <animate
                          attributeName="cy"
                          values="100;93;100"
                          dur="3.5s"
                          repeatCount="indefinite"
                        />
                      </circle>
                    </svg>
                  </div>
                </div>

                {/* Badge */}
                <div className="flex justify-center mb-5">
                  <div
                    className="inline-flex items-center gap-2 rounded-full px-4 py-1.5"
                    style={{
                      fontSize: "11px",
                      fontWeight: 700,
                      textTransform: "uppercase" as const,
                      letterSpacing: "0.08em",
                      background: accentPale,
                      color: accentDark,
                      border: `1.5px solid ${accentMid}66`,
                    }}
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    Lượt luyện tập chưa sẵn sàng
                  </div>
                </div>

                {/* Title & description */}
                <div className="text-center space-y-3 mb-8">
                  <h1
                    className="font-bold leading-tight"
                    style={{
                      fontSize: "clamp(22px, 4vw, 30px)",
                      color: "#1e293b",
                    }}
                  >
                    {isQuestionPoolIssue
                      ? `Part ${toeicPart ?? "?"} tạm thời chưa đủ bộ câu hỏi phù hợp`
                      : "Không thể tải dữ liệu luyện tập"}
                  </h1>
                  <p
                    style={{
                      fontSize: "14px",
                      color: "#64748b",
                      lineHeight: 1.7,
                      maxWidth: "480px",
                      margin: "0 auto",
                    }}
                  >
                    {isQuestionPoolIssue
                      ? "Bạn có thể thử tải lại ngay. Khi hệ thống có thêm câu hỏi hợp lệ, lượt luyện tập sẽ tự hoạt động bình thường."
                      : "Kết nối tới server đang không ổn định hoặc dữ liệu chưa đồng bộ. Bạn hãy thử lại sau vài giây."}
                  </p>
                </div>

                {/* System detail panel */}
                <div
                  className="rounded-2xl mb-8 overflow-hidden"
                  style={{
                    border: `1px solid ${accentMid}33`,
                    background: `linear-gradient(135deg, ${accentPale} 0%, #f8fafc 100%)`,
                  }}
                >
                  <div
                    className="px-5 py-3 flex items-center gap-2"
                    style={{ borderBottom: `1px solid ${accentMid}33` }}
                  >
                    <div
                      style={{
                        width: "6px",
                        height: "6px",
                        borderRadius: "50%",
                        background: accent,
                      }}
                    />
                    <span
                      style={{
                        fontSize: "10px",
                        fontWeight: 700,
                        color: "#64748b",
                        textTransform: "uppercase" as const,
                        letterSpacing: "0.1em",
                      }}
                    >
                      Chi tiết hệ thống
                    </span>
                  </div>
                  <div className="px-5 py-3">
                    <p
                      className="whitespace-pre-line"
                      style={{
                        fontSize: "13px",
                        color: "#475569",
                        lineHeight: 1.7,
                      }}
                    >
                      {compactError}
                    </p>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    disabled={dbLoading}
                    onClick={handleRetryClick}
                    className="inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3.5 text-sm font-bold text-white transition-all duration-200 disabled:opacity-70"
                    style={{
                      background: `linear-gradient(135deg, ${accentDark} 0%, ${accent} 100%)`,
                      boxShadow: `0 4px 16px ${accentShadow}, inset 0 1px 0 rgba(255,255,255,0.15)`,
                    }}
                    onMouseEnter={(e) => {
                      if (!dbLoading) {
                        (e.currentTarget as HTMLElement).style.transform =
                          "translateY(-2px)";
                        (e.currentTarget as HTMLElement).style.boxShadow =
                          `0 6px 24px ${accentShadow}`;
                      }
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.transform =
                        "translateY(0)";
                      (e.currentTarget as HTMLElement).style.boxShadow =
                        `0 4px 16px ${accentShadow}`;
                    }}
                  >
                    {dbLoading ? (
                      <>
                        <div
                          className="animate-spin"
                          style={{
                            width: "16px",
                            height: "16px",
                            border: "2.5px solid rgba(255,255,255,0.3)",
                            borderTopColor: "#fff",
                            borderRadius: "50%",
                          }}
                        />
                        Đang tải lại...
                      </>
                    ) : (
                      <>
                        <RotateCcw className="w-4 h-4" />
                        Thử tải lại câu hỏi
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={goBackToLearningMap}
                    disabled={dbLoading}
                    className="inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3.5 text-sm font-bold transition-all duration-200 disabled:opacity-60"
                    style={{
                      border: `2px solid ${accentMid}55`,
                      color: accent,
                      background: "#ffffff",
                    }}
                    onMouseEnter={(e) => {
                      if (!dbLoading) {
                        (e.currentTarget as HTMLElement).style.borderColor =
                          accent;
                        (e.currentTarget as HTMLElement).style.background =
                          accentPale;
                        (e.currentTarget as HTMLElement).style.transform =
                          "translateY(-1px)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.borderColor =
                        `${accentMid}55`;
                      (e.currentTarget as HTMLElement).style.background =
                        "#ffffff";
                      (e.currentTarget as HTMLElement).style.transform =
                        "translateY(0)";
                    }}
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Quay lại Learning Map
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (isInvalidRoute || questions.length === 0 || !currentQuestion) {
    return (
      <div
        className="min-h-screen flex flex-col"
        style={{ background: theme.pageGradient }}
      >
        <Header />
        <main className="flex-1 py-10 px-4">
          <div className="max-w-3xl mx-auto">
            <div className="relative overflow-hidden rounded-3xl border border-sky-200 bg-white/90 backdrop-blur-sm shadow-2xl">
              <div className="absolute -top-16 -right-10 w-52 h-52 rounded-full bg-gradient-to-br from-sky-200/70 to-blue-100/20 blur-2xl" />

              <div className="relative px-7 py-8 sm:px-10 sm:py-10 space-y-6">
                <div className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700 uppercase tracking-wide">
                  <Target className="w-3.5 h-3.5" />
                  Node chưa khả dụng
                </div>

                <div className="space-y-2">
                  <h1 className="text-2xl sm:text-3xl font-black text-slate-800 leading-tight">
                    Chưa có câu hỏi khả dụng cho node này
                  </h1>
                  <p className="text-sm sm:text-base text-slate-600">
                    Hệ thống chỉ mở khi có đủ bộ câu hỏi hợp lệ theo part và
                    band điểm hiện tại.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() =>
                      setQuestionRefreshVersion((prev) => prev + 1)
                    }
                    className="inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-white bg-gradient-to-r from-sky-600 to-cyan-500 shadow-md hover:brightness-105 active:scale-[0.99] transition-all"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Kiểm tra lại dữ liệu
                  </button>
                  <button
                    type="button"
                    onClick={goBackToLearningMap}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 bg-white hover:bg-slate-50 transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Quay lại Learning Map
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const handleSelectAnswer = (optionKey: string) => {
    if (isCurrentSolved) return;

    if (firstAnswers[currentQuestionIndex] === undefined) {
      setFirstAnswers((prev) => ({
        ...prev,
        [currentQuestionIndex]: optionKey,
      }));
    }

    setCurrentAttempt(optionKey);

    if (optionKey === currentQuestion.correctAnswer) {
      setSolvedCorrectly((prev) => new Set([...prev, currentQuestionIndex]));
      void fetchAiExplanation(currentQuestionIndex, optionKey, false);
    }
  };
  const handleNextQuestion = () => {
    // Only allow advancing when current question is solved correctly
    if (!isCurrentSolved && !isCurrentCorrect) return;

    if (isLastQuestion) {
      // Submit to API in BACKGROUND (fire-and-forget) — không block UI để
      // user vào Summary ngay lập tức. Nếu submit fail/chậm, handleComplete
      // sẽ retry trước khi navigate về Learning Map.
      if (toeicPart !== null && sessionQuestionIds.length > 0) {
        const answersPayload: Record<string, string> = {};
        sessionQuestionIds.forEach((qId, idx) => {
          if (firstAnswers[idx])
            answersPayload[String(qId)] = firstAnswers[idx];
        });
        setIsSubmittingSession(true);
        submitToeicPracticeSession({
          toeic_part: toeicPart,
          question_ids: sessionQuestionIds,
          answers: answersPayload,
        })
          .then((result) => {
            setEarnedThisSession(result.earned_points);
            setAttemptPointsThisSession(
              result.attempt_points ?? result.earned_points,
            );
            setReservePoints(result.new_reserve_points);
            setExamUnlocked(result.exam_unlocked);
            if (result.unlock_threshold)
              setUnlockThreshold(result.unlock_threshold);
            setSubmitResult({
              correct_answers: result.correct_answers,
              explanations: result.explanations,
            });
            appendSessionMistakeHistory(result.explanations);
            if (practiceDraftStorageKey) {
              clearPracticeRunDraft(practiceDraftStorageKey);
            }
            setSubmitSucceeded(true);
          })
          .catch((err: any) => {
            console.error(
              "[ToeicNodePractice] submitToeicPracticeSession failed:",
              err?.response?.status,
              err?.response?.data,
            );
          })
          .finally(() => {
            setIsSubmittingSession(false);
          });
      }
      setShowSummary(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    setAnimatingIn(true);
    setCurrentAttempt(null);
    setTimeout(() => {
      setCurrentQuestionIndex((prev) => prev + 1);
      setAnimatingIn(false);
    }, 150);
  };

  const handleComplete = () => {
    // 0. Safety net — if the per-question submit was skipped or failed,
    // retry sending the practice session to the backend so DB stays in sync
    // with localStorage (fixes: listening page shows "Đã hoàn thành" but
    // detail page counts 0).
    if (
      !submitSucceeded &&
      toeicPart !== null &&
      sessionQuestionIds.length > 0
    ) {
      const answersPayload: Record<string, string> = {};
      sessionQuestionIds.forEach((qId, idx) => {
        if (firstAnswers[idx]) answersPayload[String(qId)] = firstAnswers[idx];
      });
      submitToeicPracticeSession({
        toeic_part: toeicPart,
        question_ids: sessionQuestionIds,
        answers: answersPayload,
      })
        .then(() => {
          setSubmitSucceeded(true);
        })
        .catch((err) => {
          console.error(
            "[ToeicNodePractice] retry submitToeicPracticeSession failed:",
            err,
          );
        });
    }

    // 1. Update map state in localStorage (scoped theo user)
    const mapState = loadMapState(userId);
    const skillState = mapState[activeSkill];

    const updatedCompleted = skillState.completedNodes.includes(parsedNodeIndex)
      ? skillState.completedNodes
      : [...skillState.completedNodes, parsedNodeIndex];

    const updatedScores = [...skillState.nodeScores];
    updatedScores[parsedNodeIndex] = scoreGained;

    // Unlock next node if exists
    const maxNodeIndex = nodeInfoList.length - 1;
    const updatedUnlocked = Math.max(
      skillState.unlockedUpTo,
      Math.min(parsedNodeIndex + 1, maxNodeIndex),
    );

    const newMapState: LearningMapState = {
      ...mapState,
      [activeSkill]: {
        unlockedUpTo: updatedUnlocked,
        completedNodes: updatedCompleted,
        nodeScores: updatedScores,
      },
    };

    saveMapState(newMapState, userId);

    // 2. Sync TOEIC intake milestone (session counters + usedQuestionIds)
    // ★ KHÔNG sửa milestoneState.currentScore — per-part cap ở LearningMapPage quản lý điểm.
    const profile = getToeicIntakeProfile();
    if (profile) {
      const updatedProfile = appendToeicPracticeResult(
        profile,
        activeSkill,
        correctCount,
        questions.map((question) => question.id),
      );

      saveToeicIntakeProfile(updatedProfile);
    }

    // 3. Navigate back to map
    navigate(`/student/certificate-review/toeic/skill/${activeSkill}`);
  };

  const scoreInfo = getScoreLabel(correctCount, Math.max(1, questions.length));

  if (showSummary) {
    return (
      <div
        className="min-h-screen flex flex-col"
        style={{ background: theme.pageGradient }}
      >
        <Header />
        <main className="flex-1 py-8 px-4">
          <div className="max-w-3xl mx-auto space-y-6">
            {/* Summary Header Card */}
            <div
              className={`rounded-2xl overflow-hidden shadow-lg bg-gradient-to-br ${theme.gradient} text-white`}
            >
              <div className="px-6 py-8 text-center">
                <div className="text-5xl mb-3">{scoreInfo.emoji}</div>
                <h1 className="text-2xl font-bold mb-1">Kết quả luyện tập</h1>
                <p className="text-white/80 text-sm mb-6">
                  {nodeInfo.icon} {nodeInfo.title} — {nodeInfo.subtitle}
                </p>

                {/* Score Ring */}
                <div className="flex items-center justify-center gap-8 flex-wrap">
                  <div className="bg-white/20 backdrop-blur-sm rounded-2xl px-8 py-4 text-center">
                    <div className="text-5xl font-black mb-1">
                      {correctCount}
                      <span className="text-3xl font-normal text-white/70">
                        /{questions.length}
                      </span>
                    </div>
                    <div className="text-sm text-white/80">đúng lần đầu</div>
                  </div>
                  <div className="bg-white/20 backdrop-blur-sm rounded-2xl px-8 py-4 text-center">
                    <div className="text-5xl font-black mb-1">
                      +{scoreGained.toFixed(1)}
                    </div>
                    <div className="text-sm text-white/80">TOEIC points</div>
                  </div>
                  <div className="bg-white/20 backdrop-blur-sm rounded-2xl px-8 py-4 text-center">
                    <div className="text-5xl font-black mb-1">
                      {Math.round((correctCount / questions.length) * 100)}%
                    </div>
                    <div className="text-sm text-white/80">chính xác</div>
                  </div>
                </div>

                <div
                  className={`mt-4 text-lg font-semibold text-white ${scoreInfo.color === "text-emerald-600" ? "drop-shadow" : ""}`}
                >
                  {scoreInfo.label}
                </div>
              </div>

              {/* Progress bar */}
              <div className="bg-black/20 px-6 py-3">
                <div className="flex justify-between text-xs text-white/70 mb-1">
                  <span>Độ chính xác</span>
                  <span>
                    {Math.round((correctCount / questions.length) * 100)}%
                  </span>
                </div>
                <div className="w-full bg-white/20 rounded-full h-2">
                  <div
                    className="bg-white rounded-full h-2 transition-all duration-700"
                    style={{
                      width: `${(correctCount / questions.length) * 100}%`,
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Question Review List */}
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-slate-700 flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Chi tiết từng câu hỏi
              </h2>

              {questions.map((q, idx) => {
                // In the new model, every question was eventually answered correctly.
                // firstAnswers[idx] is the FIRST attempt; if it matches correct → scored.
                const firstAttempt = firstAnswers[idx];
                const gotItFirstTry = firstAttempt === q.correctAnswer;
                const correctOption = q.options.find(
                  (o) => o.key === q.correctAnswer,
                );
                const firstAttemptOption = q.options.find(
                  (o) => o.key === firstAttempt,
                );

                return (
                  <div
                    key={q.id}
                    className={`rounded-2xl border-2 overflow-hidden shadow-sm ${
                      gotItFirstTry
                        ? "border-emerald-200 bg-white"
                        : "border-amber-200 bg-white"
                    }`}
                  >
                    {/* Question header */}
                    <div
                      className={`px-5 py-3 flex items-center justify-between ${
                        gotItFirstTry ? "bg-emerald-50" : "bg-amber-50"
                      }`}
                    >
                      <span className="text-sm font-semibold text-slate-600">
                        Câu {idx + 1}
                      </span>
                      {gotItFirstTry ? (
                        <span className="flex items-center gap-1.5 text-emerald-600 font-semibold text-sm">
                          <CheckCircle2 className="w-4 h-4" />
                          Đúng lần đầu · +điểm
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5 text-amber-600 font-semibold text-sm">
                          <XCircle className="w-4 h-4 text-amber-500" />
                          Đúng sau khi thử lại · Không tính điểm
                        </span>
                      )}
                    </div>

                    <div className="px-5 py-4 space-y-3">
                      {/* Context / script */}
                      <div
                        className={`rounded-xl px-4 py-3 ${theme.bg} ${theme.border} border`}
                      >
                        <div className="flex items-center gap-1.5 mb-2">
                          {isListening ? (
                            <Volume2
                              className={`w-3.5 h-3.5 ${theme.textMuted}`}
                            />
                          ) : (
                            <FileText
                              className={`w-3.5 h-3.5 ${theme.textMuted}`}
                            />
                          )}
                          <span
                            className={`text-xs font-semibold uppercase tracking-wide ${theme.textMuted}`}
                          >
                            {isListening ? "Listening Script" : "Passage"}
                          </span>
                          {isListening && q.context && (
                            <span className="ml-auto">
                              <AudioPlayButton
                                text={q.context}
                                label="Nghe lại"
                                accentClass={theme.textMuted}
                                bgClass={theme.bg}
                                borderClass={theme.border}
                              />
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-slate-700 italic leading-relaxed whitespace-pre-line">
                          {q.context}
                        </p>
                      </div>

                      {/* Question text */}
                      <p className="font-semibold text-slate-800 text-sm">
                        {q.question}
                      </p>

                      {/* First attempt */}
                      <div
                        className={`rounded-xl px-4 py-2.5 border flex items-start gap-2.5 ${
                          gotItFirstTry
                            ? "bg-emerald-50 border-emerald-200"
                            : "bg-red-50 border-red-200"
                        }`}
                      >
                        {gotItFirstTry ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
                        )}
                        <div>
                          <span
                            className={`text-xs font-semibold ${gotItFirstTry ? "text-emerald-600" : "text-red-500"}`}
                          >
                            Lần đầu chọn ({firstAttempt ?? "—"}):
                          </span>
                          <span
                            className={`ml-1.5 text-sm ${gotItFirstTry ? "text-emerald-700" : "text-red-600"}`}
                          >
                            {firstAttemptOption?.text ?? "—"}
                          </span>
                        </div>
                      </div>

                      {/* Correct answer — always shown */}
                      <div className="rounded-xl px-4 py-2.5 border bg-emerald-50 border-emerald-200 flex items-start gap-2.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                        <div>
                          <span className="text-xs font-semibold text-emerald-600">
                            Đáp án đúng ({q.correctAnswer}):
                          </span>
                          <span className="ml-1.5 text-sm text-emerald-700">
                            {correctOption?.text ?? "—"}
                          </span>
                        </div>
                      </div>

                      {/* Explanation */}
                      <div className="rounded-xl px-4 py-3 bg-amber-50 border border-amber-200">
                        <div className="flex items-center gap-1.5 mb-1">
                          <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                          <span className="text-xs font-semibold text-amber-600 uppercase tracking-wide">
                            Giải thích
                          </span>
                        </div>
                        <p className="text-sm text-amber-800 leading-relaxed whitespace-pre-line">
                          {resolveReviewExplanation(q, idx)}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Reserve Points Earned */}
            {toeicPart !== null && (
              <div className="rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 p-5 text-center space-y-1">
                {/* Điểm Gốc */}
                {currentScore !== null && (
                  <div className="mb-3 pb-3 border-b border-amber-200">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                      Điểm Gốc
                    </p>
                    <p className="text-2xl font-bold text-slate-700">
                      {currentScore}
                    </p>
                  </div>
                )}
                {/* Điểm Ôn Tập */}
                <p className="text-xs font-semibold text-amber-600 uppercase tracking-wide">
                  Điểm Ôn Tập
                </p>
                {earnedThisSession !== null ? (
                  <>
                    <p className="text-3xl font-bold text-amber-700">
                      +{earnedThisSession.toFixed(1)}
                    </p>
                    {attemptPointsThisSession !== null && (
                      <p className="text-xs text-amber-700">
                        Điểm lượt này: {attemptPointsThisSession.toFixed(1)}
                      </p>
                    )}
                    <p className="text-sm text-amber-600">
                      Tổng: {(reservePoints ?? 0).toFixed(1)} /{" "}
                      {unlockThreshold}
                    </p>
                  </>
                ) : (
                  <p className="text-2xl font-bold text-amber-700">
                    {(reservePoints ?? 0).toFixed(1)} / {unlockThreshold}
                  </p>
                )}
                {/* Progress bar */}
                {unlockThreshold > 0 && (
                  <div className="mt-2">
                    <div className="w-full bg-amber-100 rounded-full h-2">
                      <div
                        className="bg-amber-500 h-2 rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.min(100, ((reservePoints ?? 0) / unlockThreshold) * 100)}%`,
                        }}
                      />
                    </div>
                    <p className="text-xs text-amber-500 mt-1">
                      Còn{" "}
                      {Math.max(
                        0,
                        unlockThreshold - (reservePoints ?? 0),
                      ).toFixed(1)}{" "}
                      điểm để mở khóa thi thử
                    </p>
                  </div>
                )}
                {examUnlocked && (
                  <p className="text-xs font-bold text-emerald-600 mt-1">
                    🔓 Thi thử đã mở khóa!
                  </p>
                )}
              </div>
            )}

            {toeicPart !== null && (
              <div className="rounded-2xl bg-white border border-sky-200 p-5 shadow-sm space-y-3">
                <div className="flex items-center gap-2">
                  <Lightbulb className="w-4 h-4 text-sky-500" />
                  <p className="text-sm font-bold text-sky-700">
                    Tóm tắt Part {toeicPart}
                  </p>
                </div>

                {partSummaryLoading && !partSummaryText ? (
                  <p className="text-sm text-slate-500">
                    AI đang tổng hợp tóm tắt từ các câu vừa làm và lịch sử
                    sai...
                  </p>
                ) : (
                  <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                    {partSummaryText ?? buildFallbackPartSummary()}
                  </p>
                )}

                {partSummaryError && (
                  <p className="text-xs text-amber-600">{partSummaryError}</p>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="sticky bottom-4 z-10">
              <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-slate-100 p-4 flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => {
                    if (toeicPart !== null) {
                      if (practiceDraftStorageKey) {
                        clearPracticeRunDraft(practiceDraftStorageKey);
                      }
                      setQuestionRefreshVersion((prev) => prev + 1);
                    } else {
                      resetPracticeRunState();
                    }
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  className="flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl border-2 border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 transition-all"
                >
                  <RotateCcw className="w-4 h-4" />
                  Làm lại
                </button>
                <button
                  onClick={handleComplete}
                  className={`flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-semibold text-white shadow-md transition-all active:scale-95 bg-gradient-to-r ${theme.gradient}`}
                >
                  <TrendingUp className="w-4 h-4" />
                  Hoàn thành & Leo lên node tiếp theo
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // ── Quiz Screen ──────────────────────────────────────────────────────────
  const progress = (currentQuestionIndex / questions.length) * 100;

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: theme.pageGradient }}
    >
      <Header />

      <main className="flex-1 py-6 px-4 relative">
        <VocabHighlightPopup
          isOpen={vocabHighlight.isOpen}
          position={vocabHighlight.position}
          word={vocabHighlight.selectedText}
          loading={vocabHighlight.loading}
          result={vocabHighlight.result}
          error={vocabHighlight.error}
          saving={vocabHighlight.saving}
          onSave={vocabHighlight.handleSave}
          onClose={vocabHighlight.closePopup}
        />
        <div
          className={`mx-auto space-y-5 transition-all duration-300 ${isChatExpanded ? "max-w-7xl" : "max-w-5xl"}`}
        >
          {/* Top bar: back + node label */}
          <div className="flex items-center justify-between">
            <button
              onClick={() =>
                navigate(
                  `/student/certificate-review/toeic/skill/${activeSkill}`,
                )
              }
              className="flex items-center gap-1.5 text-slate-500 hover:text-slate-700 text-sm font-medium transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Về bản đồ
            </button>
            <div
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full ${theme.bg} ${theme.border} border`}
            >
              {isListening ? (
                <Headphones className={`w-3.5 h-3.5 ${theme.textMuted}`} />
              ) : (
                <BookOpen className={`w-3.5 h-3.5 ${theme.textMuted}`} />
              )}
              <span className={`text-xs font-semibold ${theme.text}`}>
                {nodeInfo.icon} {nodeInfo.title}
              </span>
            </div>
          </div>

          {/* Progress bar */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-sm">
              <span className="font-semibold text-slate-700">
                Câu{" "}
                <span className={`${theme.textStrong} text-base`}>
                  {currentQuestionIndex + 1}
                </span>
                <span className="text-slate-400">/{questions.length}</span>
              </span>
              <span className={`text-xs font-medium ${theme.textMuted}`}>
                {solvedCorrectly.size} đã trả lời
              </span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
              <div
                className={`h-2.5 rounded-full transition-all duration-500 ${theme.progressBar}`}
                style={{ width: `${progress}%` }}
              />
            </div>
            {/* Dot indicators */}
            <div className="flex gap-1.5 justify-center pt-0.5">
              {questions.map((_, idx) => (
                <div
                  key={idx}
                  className={`rounded-full transition-all duration-300 ${
                    idx === currentQuestionIndex
                      ? `w-4 h-2 ${theme.bgStrong}`
                      : solvedCorrectly.has(idx)
                        ? firstAnswers[idx] === questions[idx].correctAnswer
                          ? "w-2 h-2 bg-emerald-400"
                          : "w-2 h-2 bg-amber-400"
                        : "w-2 h-2 bg-slate-200"
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Question Card */}
          <div
            className={`rounded-2xl border-2 shadow-md overflow-hidden bg-white transition-all duration-200 ${
              animatingIn
                ? "opacity-0 translate-y-2"
                : "opacity-100 translate-y-0"
            } ${
              isCurrentSolved || isCurrentCorrect
                ? "border-emerald-300"
                : currentAttempt !== null && !isCurrentCorrect
                  ? "border-red-200"
                  : theme.border
            }`}
          >
            {/* Card header */}
            <div
              className={`px-5 py-4 bg-gradient-to-r ${theme.gradientLight} border-b ${theme.border}`}
            >
              <div className="flex items-center gap-2 mb-3">
                <div className={`rounded-lg p-1.5 ${theme.bgMedium}`}>
                  {isListening ? (
                    <Volume2 className={`w-4 h-4 ${theme.textMuted}`} />
                  ) : (
                    <FileText className={`w-4 h-4 ${theme.textMuted}`} />
                  )}
                </div>
                <span
                  className={`text-xs font-bold uppercase tracking-wider ${theme.textMuted}`}
                >
                  {isListening ? "Listening Script" : "Passage"}
                </span>
                <span
                  className={`ml-auto text-xs font-medium px-2 py-0.5 rounded-full ${theme.bgMedium} ${theme.text}`}
                >
                  {nodeInfo.partLabel}
                </span>
              </div>
              {/* Image for listening (Part 1 photos, Part 3/4 charts) */}
              {isListening && currentQuestion.imageUrl && (
                <div className="mb-3 flex justify-center">
                  <img
                    src={
                      currentQuestion.imageUrl.startsWith("http")
                        ? currentQuestion.imageUrl
                        : buildAssetUrl(currentQuestion.imageUrl)
                    }
                    alt="Listening context"
                    className="max-h-64 rounded-lg border border-slate-200 object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                </div>
              )}
              {/* Real audio player for listening when audio URL exists.
                  IMPORTANT: key dựa trên URL (không phải questionId) để Part
                  3/4 dùng chung 1 audio cho 3 câu thì element KHÔNG remount
                  → giữ nguyên duration + thời điểm đang phát khi user
                  chuyển câu trong cùng nhóm. */}
              {isListening && currentQuestion.audioUrl ? (
                <audio
                  key={
                    resolveAudioUrl(currentQuestion.audioUrl) ??
                    currentQuestion.id
                  }
                  controls
                  preload="auto"
                  className="w-full"
                  src={resolveAudioUrl(currentQuestion.audioUrl) ?? undefined}
                >
                  Trình duyệt của bạn không hỗ trợ audio.
                </audio>
              ) : isListening && currentQuestion.context ? (
                <AudioPlayButton
                  text={currentQuestion.context}
                  label="Phát Audio (TTS)"
                  accentClass={theme.textMuted}
                  bgClass={theme.bgMedium}
                  borderClass={theme.border}
                  onPlay={() => {}}
                />
              ) : (
                <p
                  data-vocab-zone
                  className="reading-passage text-sm text-slate-700 leading-relaxed italic whitespace-pre-line"
                >
                  {currentQuestion.context}
                </p>
              )}
            </div>

            <div data-vocab-zone className="flex flex-col lg:flex-row">
              {/* Left Column: Question, Options, Script Reveal */}
              <div className="flex-1 flex flex-col">
                {/* Question text */}
                <div className="px-5 pt-4 pb-2">
                  <p className="font-semibold text-slate-800 text-base leading-snug">
                    {currentQuestion.question}
                  </p>
                </div>

                {/* Options */}
                <div className="px-5 pb-5 space-y-2.5">
                  {currentQuestion.options.map((option) => {
                    const isThisSelected = currentAttempt === option.key;
                    const isCorrectOption =
                      option.key === currentQuestion.correctAnswer;
                    // A wrong option that was just tried (and not the correct one)
                    const isWrongAttempt =
                      isThisSelected &&
                      !isCorrectOption &&
                      currentAttempt !== null;

                    let optionStyle =
                      "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50";

                    if (isCurrentSolved) {
                      // Question solved: highlight correct green, grey others
                      if (isCorrectOption) {
                        optionStyle =
                          "border-emerald-400 bg-emerald-50 text-emerald-800 ring-2 ring-emerald-200";
                      } else {
                        optionStyle =
                          "border-slate-100 bg-slate-50 text-slate-400";
                      }
                    } else if (currentAttempt !== null) {
                      // Attempted but not yet correct
                      if (isWrongAttempt) {
                        optionStyle =
                          "border-red-400 bg-red-50 text-red-700 ring-2 ring-red-100";
                      } else {
                        optionStyle =
                          "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50";
                      }
                    }

                    const isDisabled = isCurrentSolved;

                    return (
                      <button
                        key={option.key}
                        onClick={() => handleSelectAnswer(option.key)}
                        disabled={isDisabled}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-left transition-all duration-150 ${optionStyle} ${
                          !isDisabled
                            ? "cursor-pointer active:scale-[0.99]"
                            : "cursor-default"
                        }`}
                      >
                        {/* Option key badge */}
                        <span
                          className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold border transition-all ${
                            isCurrentSolved && isCorrectOption
                              ? "bg-emerald-500 border-emerald-500 text-white"
                              : isWrongAttempt
                                ? "bg-red-400 border-red-400 text-white"
                                : isCurrentSolved
                                  ? "bg-slate-100 border-slate-200 text-slate-400"
                                  : "bg-slate-100 border-slate-200 text-slate-500"
                          }`}
                        >
                          {option.key}
                        </span>

                        <span className="flex-1 text-sm leading-snug">
                          {option.text}
                        </span>

                        {/* Feedback icons */}
                        {isCurrentSolved && isCorrectOption && (
                          <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                        )}
                        {isWrongAttempt && (
                          <XCircle className="w-5 h-5 text-red-400 shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Translation Block - Chỉ hiển thị khi đã chọn đúng */}
                {isCurrentSolved && (
                  <div className="px-5 pb-5">
                    {!translations[currentQuestion.id] &&
                      !translatingIds.has(currentQuestion.id.toString()) && (
                        <button
                          onClick={() =>
                            handleTranslateQuestion(currentQuestion)
                          }
                          className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-sky-200 bg-sky-50 text-sky-700 hover:bg-sky-100 transition-colors w-max"
                        >
                          <span className="text-xs font-semibold uppercase tracking-wide">
                            Dịch câu hỏi & đáp án
                          </span>
                        </button>
                      )}

                    {translatingIds.has(currentQuestion.id.toString()) && (
                      <div className="flex items-center gap-2 px-4 py-3 rounded-xl border border-sky-100 bg-sky-50/50">
                        <div className="flex items-center gap-1">
                          <span className="inline-block w-1.5 h-1.5 rounded-full bg-sky-400 animate-bounce [animation-delay:0ms]" />
                          <span className="inline-block w-1.5 h-1.5 rounded-full bg-sky-400 animate-bounce [animation-delay:150ms]" />
                          <span className="inline-block w-1.5 h-1.5 rounded-full bg-sky-400 animate-bounce [animation-delay:300ms]" />
                        </div>
                        <span className="text-sm font-medium text-sky-600 italic ml-1">
                          Đang dịch...
                        </span>
                      </div>
                    )}

                    {translations[currentQuestion.id.toString()] && (
                      <div className="rounded-xl border border-sky-200 bg-sky-50/60 shadow-sm overflow-hidden mt-1">
                        <div className="flex items-center gap-2 px-5 pt-4 pb-2">
                          <span className="text-sm font-bold text-blue-700">
                            Dịch câu hỏi
                          </span>
                        </div>
                        <div className="px-5 pb-5 pt-1 space-y-2.5">
                          {translations[currentQuestion.id.toString()]
                            .split("\n")
                            .map((line, idx) => {
                              const lineStr = line.trim();
                              if (!lineStr) return null;

                              const optionMatch =
                                lineStr.match(/^([A-D])[.)]\s*(.*)$/i);
                              if (optionMatch) {
                                const optKey = optionMatch[1].toUpperCase();
                                const isCorrectOption =
                                  optKey === currentQuestion.correctAnswer;
                                const shouldHighlight =
                                  isCurrentSolved && isCorrectOption;

                                return (
                                  <div
                                    key={idx}
                                    className={`flex text-[15px] ${shouldHighlight ? "text-emerald-600 font-medium" : "text-slate-700 hover:text-slate-900 transition-colors"} ml-3`}
                                  >
                                    <span className="w-6 shrink-0">
                                      {optKey}.
                                    </span>
                                    <span>{optionMatch[2]}</span>
                                  </div>
                                );
                              }

                              return (
                                <p
                                  key={idx}
                                  className="text-[15px] font-medium text-slate-800 mb-3"
                                >
                                  {lineStr}
                                </p>
                              );
                            })}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Wrong attempt hint */}
                {!isCurrentCorrect &&
                  !isCurrentSolved &&
                  currentAttempt !== null && (
                    <div className="mx-5 mb-5 bg-red-50 px-4 py-3 text-xs text-red-700 rounded-xl border border-red-200">
                      💡 Đáp án <strong>{currentAttempt}</strong> chưa đúng. Đọc
                      lại context và chọn đáp án khác để tiếp tục.
                    </div>
                  )}

                {/* Correct attempt hint */}
                {(isCurrentCorrect || isCurrentSolved) && (
                  <div className="mx-5 mb-5 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 rounded-xl border border-emerald-200 flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                    <span className="font-semibold">
                      {firstAttemptCorrect
                        ? "Chính xác ngay lần đầu! 🎉 +điểm"
                        : "Chính xác!  (Không tính điểm vì đã thử sai)"}
                    </span>
                  </div>
                )}

                {/* Script reveal for listening — only after correct */}
                {isListening &&
                  (isCurrentCorrect || isCurrentSolved) &&
                  currentQuestion.context && (
                    <div className="mx-5 mb-5 mt-auto">
                      <ScriptReveal
                        context={currentQuestion.context}
                        accentClass={theme.textMuted}
                        showScript={true}
                      />
                    </div>
                  )}
              </div>

              {/* Right Column: Result / Explanation panel */}
              {/* Right Column: Result / Explanation panel */}
              {(isCurrentCorrect || isCurrentSolved) && (
                <div
                  className={`shrink-0 border-t lg:border-t-0 lg:border-l border-emerald-100 flex flex-col transition-all duration-300 ${
                    isChatExpanded
                      ? "w-full lg:w-[800px]"
                      : "w-full lg:w-[450px]"
                  }`}
                >
                  <div
                    className={`flex-1 flex flex-col ${isChatExpanded ? "lg:flex-row" : ""} overflow-hidden`}
                  >
                    {/* Explanation Area */}
                    <div
                      className={`p-6 lg:p-7 overflow-y-auto custom-scrollbar flex flex-col ${isChatExpanded ? "lg:w-1/2 lg:border-r border-emerald-100" : "flex-1"}`}
                    >
                      <div className="flex items-center gap-2 mb-4 border-b border-emerald-50 pb-3 shrink-0">
                        <span className="text-lg">💡</span>
                        <span className="text-sm font-bold text-emerald-800 uppercase tracking-wide">
                          Giải thích chi tiết
                        </span>
                      </div>

                      {/* AI đang load */}
                      {currentAttemptAiLoading && (
                        <div className="flex items-center gap-1.5 py-4 justify-center">
                          <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-bounce [animation-delay:0ms]" />
                          <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-bounce [animation-delay:150ms]" />
                          <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-bounce [animation-delay:300ms]" />
                        </div>
                      )}

                      {/* AI đã xong */}
                      {!currentAttemptAiLoading && currentAttemptAi && (
                        <p className="text-[15px] text-slate-700 leading-relaxed whitespace-pre-line">
                          {formatAiExplanationForDisplay(
                            currentAttemptAi.answer,
                            currentQuestion,
                          )}
                        </p>
                      )}

                      {/* Fallback DB explanation (if AI cache missed) */}
                      {!currentAttemptAiLoading &&
                        !currentAttemptAi &&
                        hasFallbackDbExplanation && (
                          <p className="text-[15px] text-slate-700 leading-relaxed whitespace-pre-line">
                            {formattedFallbackDbExplanation}
                          </p>
                        )}

                      {/* AI lỗi hoặc không có giải thích */}
                      {!currentAttemptAiLoading &&
                        !currentAttemptAi &&
                        !hasFallbackDbExplanation &&
                        currentAttemptAiError && (
                          <div className="flex flex-col items-center justify-center py-6 text-center space-y-3">
                            <span className="text-4xl">🥺</span>
                            <p className="text-sm text-slate-500 font-medium leading-relaxed px-2">
                              Hiện tại chưa có phần giải thích từng đáp án cho
                              câu hỏi, bạn thông cảm nhé!
                            </p>
                          </div>
                        )}

                      {/* Chưa load gì */}
                      {!currentAttemptAiLoading &&
                        !currentAttemptAi &&
                        !hasFallbackDbExplanation &&
                        !currentAttemptAiError && (
                          <p className="text-sm text-emerald-400 italic text-center py-4">
                            Phân tích đang được chuẩn bị...
                          </p>
                        )}
                    </div>

                    {/* --- GROQ AI CHAT UI --- */}
                    {!currentAttemptAiLoading && (
                      <div
                        className={`p-6 lg:p-7 flex flex-col gap-4 ${isChatExpanded ? "lg:w-1/2 overflow-y-auto custom-scrollbar" : "border-t border-emerald-100 mt-auto"}`}
                      >
                        <div className="flex items-center gap-2 mb-2 shrink-0">
                          <span className="text-lg">🧑‍🏫</span>
                          <span className="text-sm font-bold text-emerald-800 uppercase tracking-wide">
                            Trợ lý học tập
                          </span>
                        </div>

                        {/* Chat History */}
                        {(chatHistory.length > 0 || isChatLoading) && (
                          <div className="flex flex-col gap-3 mb-2 flex-1 overflow-y-auto custom-scrollbar">
                            {chatHistory.map((msg, idx) => (
                              <div
                                key={idx}
                                className={`p-3 rounded-2xl text-[14.5px] leading-relaxed max-w-[90%] ${
                                  msg.role === "user"
                                    ? "bg-emerald-500 text-white self-end rounded-tr-sm"
                                    : "bg-slate-100 text-slate-700 self-start rounded-tl-sm whitespace-pre-line"
                                }`}
                              >
                                {msg.role === "assistant"
                                  ? stripMarkdown(msg.content)
                                  : msg.content}
                              </div>
                            ))}
                            {/* Streaming bubble — hiện text khi đang nhận từng token */}
                            {isChatLoading && (
                              <div className="p-3 rounded-2xl text-[14.5px] leading-relaxed max-w-[90%] bg-slate-100 text-slate-700 self-start rounded-tl-sm whitespace-pre-line">
                                {streamingText ? (
                                  <>
                                    {stripMarkdown(streamingText)}
                                    <span className="inline-block w-1 h-4 ml-0.5 bg-slate-400 animate-pulse align-middle" />
                                  </>
                                ) : (
                                  <span className="flex items-center gap-1.5 text-slate-400 text-xs">
                                    <span
                                      className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"
                                      style={{ animationDelay: "0ms" }}
                                    />
                                    <span
                                      className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"
                                      style={{ animationDelay: "150ms" }}
                                    />
                                    <span
                                      className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"
                                      style={{ animationDelay: "300ms" }}
                                    />
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Input Area */}
                        <div className="relative mt-auto shrink-0">
                          <input
                            type="text"
                            value={chatMessage}
                            onChange={(e) => setChatMessage(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleSendChat();
                            }}
                            placeholder="Hỏi trợ lý nếu bạn chưa hiểu rõ..."
                            disabled={isChatLoading}
                            className="w-full bg-white border border-emerald-200 text-slate-700 text-sm rounded-full py-3.5 pl-5 pr-12 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent disabled:opacity-50 disabled:bg-slate-50 transition-all shadow-sm"
                          />
                          <button
                            onClick={handleSendChat}
                            disabled={!chatMessage.trim() || isChatLoading}
                            className="absolute right-1.5 top-1.5 bottom-1.5 w-10 bg-emerald-500 text-white rounded-full flex items-center justify-center hover:bg-emerald-600 disabled:opacity-50 disabled:hover:bg-emerald-500 transition-all shadow-sm"
                          >
                            {isChatLoading ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Send className="w-4 h-4 ml-0.5" />
                            )}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Next / Finish button — only enabled after correct */}
          {(isCurrentCorrect || isCurrentSolved) && (
            <button
              onClick={handleNextQuestion}
              className={`w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-semibold text-white shadow-lg transition-all active:scale-[0.98] bg-gradient-to-r ${theme.gradient}`}
            >
              {isLastQuestion ? (
                <>
                  <Trophy className="w-5 h-5" />
                  Xem kết quả
                </>
              ) : (
                <>
                  Tiếp theo
                  <ChevronRight className="w-5 h-5" />
                </>
              )}
            </button>
          )}

          {/* Score tracker strip */}
          <div
            className={`rounded-xl px-4 py-3 ${theme.bg} ${theme.border} border flex items-center justify-between`}
          >
            <div className="flex items-center gap-2">
              <Star className={`w-4 h-4 ${theme.textMuted}`} />
              <span className={`text-sm font-medium ${theme.text}`}>
                Điểm hiện tại
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className={`font-bold text-base ${theme.textStrong}`}>
                {correctCount}
                <span className={`font-normal text-sm ${theme.textMuted}`}>
                  /{questions.length}
                </span>
              </span>
              <div
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg ${theme.bgMedium}`}
              >
                <Target className={`w-3.5 h-3.5 ${theme.textMuted}`} />
                <span className={`text-xs font-semibold ${theme.text}`}>
                  +
                  {(
                    Object.keys(firstAnswers).filter(
                      (idx) =>
                        firstAnswers[parseInt(idx)] ===
                        questions[parseInt(idx)]?.correctAnswer,
                    ).length * nodeInfo.scorePerCorrect
                  ).toFixed(0)}{" "}
                  pts
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

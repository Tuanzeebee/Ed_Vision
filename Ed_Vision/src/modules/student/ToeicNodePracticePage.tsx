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
} from "lucide-react";
import Header from "../../components/layout/Header";
import Footer from "../../components/layout/Footer";
import { useToeicScrollReset } from "../../hooks/useToeicScrollReset";
import { askCertificateTutor } from "../../services/api/certificateService";
import {
  getToeicIntakeProfile,
  saveToeicIntakeProfile,
  appendToeicPracticeResult,
} from "./toeicIntake";

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

// ── Constants ──────────────────────────────────────────────────────────────
const MAP_STORAGE_KEY = "edvision.toeic.learningmap.v1";
const AI_PREFETCH_BATCH_SIZE = 1;
const AI_PREFETCH_PRIORITY_AHEAD = 2;

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

const READING_QUESTIONS: Record<number, PracticeQuestion[]> = {
  // Node 0 — Part 5-6
  0: [
    {
      id: "R0Q1",
      question: "She _____ to the office every day by bus.",
      context: "Choose the correct form of the verb to complete the sentence.",
      options: [
        { key: "A", text: "go" },
        { key: "B", text: "goes" },
        { key: "C", text: "going" },
        { key: "D", text: "gone" },
      ],
      correctAnswer: "B",
      explanation:
        'Chủ ngữ "She" (số ít, ngôi 3) → dùng goes (hiện tại đơn, thêm -es).',
    },
    {
      id: "R0Q2",
      question: "The report _____ by the manager yesterday.",
      context: "Choose the correct form of the verb to complete the sentence.",
      options: [
        { key: "A", text: "reviews" },
        { key: "B", text: "reviewed" },
        { key: "C", text: "was reviewed" },
        { key: "D", text: "has reviewed" },
      ],
      correctAnswer: "C",
      explanation:
        'Bị động thì quá khứ đơn: was/were + V3. Từ "yesterday" xác nhận quá khứ đơn.',
    },
    {
      id: "R0Q3",
      question: "I have been working here _____ five years.",
      context: "Choose the correct preposition to complete the sentence.",
      options: [
        { key: "A", text: "for" },
        { key: "B", text: "since" },
        { key: "C", text: "during" },
        { key: "D", text: "from" },
      ],
      correctAnswer: "A",
      explanation:
        '"For" dùng với khoảng thời gian (five years = 5 năm). "Since" dùng với mốc thời gian cụ thể (since 2019).',
    },
    {
      id: "R0Q4",
      question: "He is _____ qualified for the position.",
      context: "Choose the correct word to complete the sentence.",
      options: [
        { key: "A", text: "high" },
        { key: "B", text: "highly" },
        { key: "C", text: "higher" },
        { key: "D", text: "highest" },
      ],
      correctAnswer: "B",
      explanation:
        'Cần trạng từ (adverb) để bổ nghĩa cho tính từ "qualified" → highly (rất, cao độ).',
    },
    {
      id: "R0Q5",
      question: "The new policy will _____ effect from next month.",
      context:
        "Choose the correct verb to complete the fixed phrase (collocation).",
      options: [
        { key: "A", text: "take" },
        { key: "B", text: "make" },
        { key: "C", text: "do" },
        { key: "D", text: "get" },
      ],
      correctAnswer: "A",
      explanation:
        'Cụm từ cố định (collocation): "take effect" = có hiệu lực. Không thể dùng make/do/get effect.',
    },
    {
      id: "R0Q6",
      question: "Despite _____ hard, she failed the exam.",
      context: "Choose the correct verb form after a preposition.",
      options: [
        { key: "A", text: "study" },
        { key: "B", text: "studied" },
        { key: "C", text: "studying" },
        { key: "D", text: "to study" },
      ],
      correctAnswer: "C",
      explanation:
        'Sau "despite" (mặc dù) → dùng V-ing (danh động từ). "Despite studying hard" = mặc dù học chăm chỉ.',
    },
    {
      id: "R0Q7",
      question: "We are looking forward _____ from you soon.",
      context: "Choose the correct form to complete the phrasal verb.",
      options: [
        { key: "A", text: "to hear" },
        { key: "B", text: "to hearing" },
        { key: "C", text: "hear" },
        { key: "D", text: "heard" },
      ],
      correctAnswer: "B",
      explanation:
        '"Look forward to" + V-ing. Chú ý: "to" ở đây là giới từ, không phải TO-infinitive.',
    },
    {
      id: "R0Q8",
      question: "The company's profits have _____ by 20% this year.",
      context: "Choose the correct verb: rise or raise?",
      options: [
        { key: "A", text: "raised" },
        { key: "B", text: "risen" },
        { key: "C", text: "arose" },
        { key: "D", text: "arisen" },
      ],
      correctAnswer: "B",
      explanation:
        '"Rise" (nội động từ) = tự tăng lên, không cần tân ngữ → have risen. "Raise" (ngoại động từ) = làm tăng cái gì đó.',
    },
    {
      id: "R0Q9",
      question: "Please _____ the form and return it by Friday.",
      context: "Choose the correct verb form for an imperative sentence.",
      options: [
        { key: "A", text: "complete" },
        { key: "B", text: "completing" },
        { key: "C", text: "completed" },
        { key: "D", text: "to complete" },
      ],
      correctAnswer: "A",
      explanation:
        "Mệnh lệnh thức (imperative) dùng động từ nguyên mẫu không TO.",
    },
    {
      id: "R0Q10",
      question: "She _____ her presentation when the lights went out.",
      context:
        "Choose the correct tense to express an action in progress when another event occurred.",
      options: [
        { key: "A", text: "gave" },
        { key: "B", text: "was giving" },
        { key: "C", text: "has given" },
        { key: "D", text: "gives" },
      ],
      correctAnswer: "B",
      explanation:
        'Hành động đang diễn ra (quá khứ tiếp diễn) khi sự kiện khác xảy ra đột ngột → "was giving".',
    },
  ],

  // Node 1 — Part 7
  1: [
    {
      id: "R1Q1",
      question: "What is the purpose of this email?",
      context:
        "To: All Staff\nFrom: HR Department\nSubject: Annual Performance Review\n\nDear Team,\n\nWe would like to remind you that the annual performance review process will begin on March 1. All employees are required to complete the self-assessment form by February 25. Managers will then conduct one-on-one meetings during the first two weeks of March.\n\nFor questions, contact hr@company.com.\n\nBest regards,\nHR Department",
      options: [
        { key: "A", text: "To announce a public holiday schedule." },
        {
          key: "B",
          text: "To remind staff about the annual performance review.",
        },
        { key: "C", text: "To introduce new employees to the team." },
        { key: "D", text: "To announce a change in company policy." },
      ],
      correctAnswer: "B",
      explanation:
        "Mục đích chính của email là nhắc nhở về quy trình đánh giá hiệu suất hàng năm (annual performance review).",
    },
    {
      id: "R1Q2",
      question: "When must the self-assessment form be submitted?",
      context:
        "To: All Staff\nFrom: HR Department\nSubject: Annual Performance Review\n\nDear Team,\n\nWe would like to remind you that the annual performance review process will begin on March 1. All employees are required to complete the self-assessment form by February 25. Managers will then conduct one-on-one meetings during the first two weeks of March.\n\nFor questions, contact hr@company.com.\n\nBest regards,\nHR Department",
      options: [
        { key: "A", text: "By March 1." },
        { key: "B", text: "By the end of March." },
        { key: "C", text: "By February 25." },
        { key: "D", text: "Immediately after receiving this email." },
      ],
      correctAnswer: "C",
      explanation:
        '"Required to complete the self-assessment form by February 25" → deadline rõ ràng là ngày 25/2.',
    },
    {
      id: "R1Q3",
      question: "Who will conduct the one-on-one meetings?",
      context:
        "To: All Staff\nFrom: HR Department\nSubject: Annual Performance Review\n\nDear Team,\n\nWe would like to remind you that the annual performance review process will begin on March 1. All employees are required to complete the self-assessment form by February 25. Managers will then conduct one-on-one meetings during the first two weeks of March.\n\nFor questions, contact hr@company.com.\n\nBest regards,\nHR Department",
      options: [
        { key: "A", text: "The executive director." },
        { key: "B", text: "HR staff members." },
        { key: "C", text: "Direct managers." },
        { key: "D", text: "The technical team." },
      ],
      correctAnswer: "C",
      explanation:
        '"Managers will then conduct one-on-one meetings" = quản lý trực tiếp sẽ thực hiện các buổi gặp riêng.',
    },
    {
      id: "R1Q4",
      question: "What does 'self-assessment' involve?",
      context:
        "To: All Staff\nFrom: HR Department\nSubject: Annual Performance Review\n\nDear Team,\n\nWe would like to remind you that the annual performance review process will begin on March 1. All employees are required to complete the self-assessment form by February 25. Managers will then conduct one-on-one meetings during the first two weeks of March.\n\nFor questions, contact hr@company.com.\n\nBest regards,\nHR Department",
      options: [
        { key: "A", text: "Employees evaluating their colleagues." },
        { key: "B", text: "Employees evaluating their own performance." },
        { key: "C", text: "Managers evaluating employees." },
        { key: "D", text: "Customers providing feedback." },
      ],
      correctAnswer: "B",
      explanation:
        '"Self-assessment" = tự đánh giá bản thân. "Self-" = tự mình (self-study, self-check, self-review...).',
    },
    {
      id: "R1Q5",
      question: "What should employees do if they have questions?",
      context:
        "To: All Staff\nFrom: HR Department\nSubject: Annual Performance Review\n\nDear Team,\n\nWe would like to remind you that the annual performance review process will begin on March 1. All employees are required to complete the self-assessment form by February 25. Managers will then conduct one-on-one meetings during the first two weeks of March.\n\nFor questions, contact hr@company.com.\n\nBest regards,\nHR Department",
      options: [
        { key: "A", text: "Meet with their manager in person." },
        { key: "B", text: "Attend an all-staff meeting." },
        { key: "C", text: "Send an email to hr@company.com." },
        { key: "D", text: "Read the employee handbook." },
      ],
      correctAnswer: "C",
      explanation:
        '"For questions, contact hr@company.com" = liên hệ email HR nếu có thắc mắc.',
    },
    {
      id: "R1Q6",
      question: "When do the one-on-one meetings take place?",
      context:
        "To: All Staff\nFrom: HR Department\nSubject: Annual Performance Review\n\nDear Team,\n\nWe would like to remind you that the annual performance review process will begin on March 1. All employees are required to complete the self-assessment form by February 25. Managers will then conduct one-on-one meetings during the first two weeks of March.\n\nFor questions, contact hr@company.com.\n\nBest regards,\nHR Department",
      options: [
        { key: "A", text: "During the last week of February." },
        { key: "B", text: "During the first two weeks of March." },
        { key: "C", text: "Throughout the entire month of March." },
        { key: "D", text: "In April." },
      ],
      correctAnswer: "B",
      explanation:
        '"During the first two weeks of March" = trong hai tuần đầu của tháng 3.',
    },
    {
      id: "R1Q7",
      question: "What is required of ALL employees?",
      context:
        "To: All Staff\nFrom: HR Department\nSubject: Annual Performance Review\n\nDear Team,\n\nWe would like to remind you that the annual performance review process will begin on March 1. All employees are required to complete the self-assessment form by February 25. Managers will then conduct one-on-one meetings during the first two weeks of March.\n\nFor questions, contact hr@company.com.\n\nBest regards,\nHR Department",
      options: [
        { key: "A", text: "Attend a full team meeting." },
        { key: "B", text: "Complete the self-assessment form." },
        { key: "C", text: "Meet with the HR director." },
        { key: "D", text: "Write a detailed performance report." },
      ],
      correctAnswer: "B",
      explanation:
        '"All employees are required to complete the self-assessment form" = tất cả nhân viên bắt buộc hoàn thành form tự đánh giá.',
    },
    {
      id: "R1Q8",
      question: "The tone of this email is best described as:",
      context:
        "To: All Staff\nFrom: HR Department\nSubject: Annual Performance Review\n\nDear Team,\n\nWe would like to remind you that the annual performance review process will begin on March 1. All employees are required to complete the self-assessment form by February 25. Managers will then conduct one-on-one meetings during the first two weeks of March.\n\nFor questions, contact hr@company.com.\n\nBest regards,\nHR Department",
      options: [
        { key: "A", text: "Urgent and alarming." },
        { key: "B", text: "Formal and informative." },
        { key: "C", text: "Casual and cheerful." },
        { key: "D", text: "Critical and harsh." },
      ],
      correctAnswer: "B",
      explanation:
        "Email dùng ngôn ngữ lịch sự, trang trọng (formal), truyền đạt thông tin rõ ràng → giọng điệu formal and informative.",
    },
    {
      id: "R1Q9",
      question: "What period does 'annual' refer to?",
      context:
        "To: All Staff\nFrom: HR Department\nSubject: Annual Performance Review\n\nDear Team,\n\nWe would like to remind you that the annual performance review process will begin on March 1. All employees are required to complete the self-assessment form by February 25. Managers will then conduct one-on-one meetings during the first two weeks of March.\n\nFor questions, contact hr@company.com.\n\nBest regards,\nHR Department",
      options: [
        { key: "A", text: "Monthly." },
        { key: "B", text: "Quarterly (every 3 months)." },
        { key: "C", text: "Yearly." },
        { key: "D", text: "Weekly." },
      ],
      correctAnswer: "C",
      explanation:
        '"Annual" = yearly = hàng năm. Annual report = báo cáo hàng năm. Annual meeting = cuộc họp thường niên.',
    },
    {
      id: "R1Q10",
      question: "Which department sent this email?",
      context:
        "To: All Staff\nFrom: HR Department\nSubject: Annual Performance Review\n\nDear Team,\n\nWe would like to remind you that the annual performance review process will begin on March 1. All employees are required to complete the self-assessment form by February 25. Managers will then conduct one-on-one meetings during the first two weeks of March.\n\nFor questions, contact hr@company.com.\n\nBest regards,\nHR Department",
      options: [
        { key: "A", text: "The IT Department." },
        { key: "B", text: "The Sales Department." },
        { key: "C", text: "The HR Department." },
        { key: "D", text: "The Accounting Department." },
      ],
      correctAnswer: "C",
      explanation:
        '"From: HR Department" và "Best regards, HR Department" → phòng Nhân sự (HR) gửi email này.',
    },
  ],

  // Node 2 — Advanced Reading
  2: [
    {
      id: "R2Q1",
      question: "According to David Chen, what has been completed?",
      context:
        "From: David Chen\nSubject: Project Atlas - Status Update\n\nThe prototype testing phase has been completed successfully. We encountered minor calibration issues which have since been resolved. The project remains on schedule for the Q3 launch.\n\nPlease review the attached report.\n\n---\nInternal Memo — Re: Project Atlas\n\nFollowing David's update, the marketing team has begun preparing campaign materials for the Q3 launch. Budget allocation has been approved. All stakeholders should expect a preview at the July 15 meeting.",
      options: [
        { key: "A", text: "The product launch." },
        { key: "B", text: "The prototype testing phase." },
        { key: "C", text: "The marketing campaign." },
        { key: "D", text: "The budget allocation." },
      ],
      correctAnswer: "B",
      explanation:
        '"The prototype testing phase has been completed successfully" = giai đoạn kiểm thử nguyên mẫu đã hoàn thành thành công.',
    },
    {
      id: "R2Q2",
      question: "What issue was encountered during testing?",
      context:
        "From: David Chen\nSubject: Project Atlas - Status Update\n\nThe prototype testing phase has been completed successfully. We encountered minor calibration issues which have since been resolved. The project remains on schedule for the Q3 launch.\n\nPlease review the attached report.\n\n---\nInternal Memo — Re: Project Atlas\n\nFollowing David's update, the marketing team has begun preparing campaign materials for the Q3 launch. Budget allocation has been approved. All stakeholders should expect a preview at the July 15 meeting.",
      options: [
        { key: "A", text: "Budget overruns." },
        { key: "B", text: "Minor calibration issues." },
        { key: "C", text: "A shortage of staff." },
        { key: "D", text: "A serious product defect." },
      ],
      correctAnswer: "B",
      explanation:
        '"Minor calibration issues which have since been resolved" = vấn đề hiệu chỉnh nhỏ nhưng đã được giải quyết.',
    },
    {
      id: "R2Q3",
      question: "When is the product expected to launch?",
      context:
        "From: David Chen\nSubject: Project Atlas - Status Update\n\nThe prototype testing phase has been completed successfully. We encountered minor calibration issues which have since been resolved. The project remains on schedule for the Q3 launch.\n\nPlease review the attached report.\n\n---\nInternal Memo — Re: Project Atlas\n\nFollowing David's update, the marketing team has begun preparing campaign materials for the Q3 launch. Budget allocation has been approved. All stakeholders should expect a preview at the July 15 meeting.",
      options: [
        { key: "A", text: "In Q1." },
        { key: "B", text: "In Q2." },
        { key: "C", text: "In Q3." },
        { key: "D", text: "In Q4." },
      ],
      correctAnswer: "C",
      explanation:
        '"The Q3 launch" được đề cập trong cả hai tài liệu → ra mắt vào quý 3 (Q3).',
    },
    {
      id: "R2Q4",
      question: "What has the marketing team started doing?",
      context:
        "From: David Chen\nSubject: Project Atlas - Status Update\n\nThe prototype testing phase has been completed successfully. We encountered minor calibration issues which have since been resolved. The project remains on schedule for the Q3 launch.\n\nPlease review the attached report.\n\n---\nInternal Memo — Re: Project Atlas\n\nFollowing David's update, the marketing team has begun preparing campaign materials for the Q3 launch. Budget allocation has been approved. All stakeholders should expect a preview at the July 15 meeting.",
      options: [
        { key: "A", text: "Testing the product prototype." },
        { key: "B", text: "Preparing campaign materials." },
        { key: "C", text: "Recruiting new employees." },
        { key: "D", text: "Setting up a warehouse." },
      ],
      correctAnswer: "B",
      explanation:
        '"The marketing team has begun preparing campaign materials" = đội marketing đã bắt đầu chuẩn bị tài liệu chiến dịch.',
    },
    {
      id: "R2Q5",
      question: "What will happen on July 15?",
      context:
        "From: David Chen\nSubject: Project Atlas - Status Update\n\nThe prototype testing phase has been completed successfully. We encountered minor calibration issues which have since been resolved. The project remains on schedule for the Q3 launch.\n\nPlease review the attached report.\n\n---\nInternal Memo — Re: Project Atlas\n\nFollowing David's update, the marketing team has begun preparing campaign materials for the Q3 launch. Budget allocation has been approved. All stakeholders should expect a preview at the July 15 meeting.",
      options: [
        { key: "A", text: "The product will be officially launched." },
        {
          key: "B",
          text: "Stakeholders will attend a meeting with a preview.",
        },
        { key: "C", text: "A contract will be signed." },
        { key: "D", text: "A warehouse inspection will be conducted." },
      ],
      correctAnswer: "B",
      explanation:
        '"All stakeholders should expect a preview at the July 15 meeting" = các bên liên quan sẽ xem preview tại cuộc họp ngày 15/7.',
    },
    {
      id: "R2Q6",
      question: "What can be inferred about the project's current status?",
      context:
        "From: David Chen\nSubject: Project Atlas - Status Update\n\nThe prototype testing phase has been completed successfully. We encountered minor calibration issues which have since been resolved. The project remains on schedule for the Q3 launch.\n\nPlease review the attached report.\n\n---\nInternal Memo — Re: Project Atlas\n\nFollowing David's update, the marketing team has begun preparing campaign materials for the Q3 launch. Budget allocation has been approved. All stakeholders should expect a preview at the July 15 meeting.",
      options: [
        { key: "A", text: "The project is behind schedule." },
        { key: "B", text: "The project is on schedule." },
        { key: "C", text: "The project was completed ahead of schedule." },
        { key: "D", text: "The project is facing major difficulties." },
      ],
      correctAnswer: "B",
      explanation:
        '"The project remains on schedule" = dự án vẫn đúng tiến độ. "On schedule" = đúng kế hoạch.',
    },
    {
      id: "R2Q7",
      question: "What does 'stakeholders' most likely refer to?",
      context:
        "From: David Chen\nSubject: Project Atlas - Status Update\n\nThe prototype testing phase has been completed successfully. We encountered minor calibration issues which have since been resolved. The project remains on schedule for the Q3 launch.\n\nPlease review the attached report.\n\n---\nInternal Memo — Re: Project Atlas\n\nFollowing David's update, the marketing team has begun preparing campaign materials for the Q3 launch. Budget allocation has been approved. All stakeholders should expect a preview at the July 15 meeting.",
      options: [
        { key: "A", text: "Regular customers of the company." },
        { key: "B", text: "All parties with an interest in the project." },
        { key: "C", text: "Members of the sales team." },
        { key: "D", text: "External shareholders only." },
      ],
      correctAnswer: "B",
      explanation:
        '"Stakeholders" = các bên liên quan — rộng hơn "shareholders" (cổ đông). Bao gồm mọi người có lợi ích trong dự án.',
    },
    {
      id: "R2Q8",
      question: "According to BOTH documents, what is consistent?",
      context:
        "From: David Chen\nSubject: Project Atlas - Status Update\n\nThe prototype testing phase has been completed successfully. We encountered minor calibration issues which have since been resolved. The project remains on schedule for the Q3 launch.\n\nPlease review the attached report.\n\n---\nInternal Memo — Re: Project Atlas\n\nFollowing David's update, the marketing team has begun preparing campaign materials for the Q3 launch. Budget allocation has been approved. All stakeholders should expect a preview at the July 15 meeting.",
      options: [
        { key: "A", text: "The budget has not yet been approved." },
        { key: "B", text: "The Q3 launch target." },
        { key: "C", text: "The product is already fully ready." },
        { key: "D", text: "The team composition is changing." },
      ],
      correctAnswer: "B",
      explanation:
        'Cả hai tài liệu đều đề cập "Q3 launch" → mục tiêu ra mắt quý 3 là điểm nhất quán giữa hai văn bản.',
    },
    {
      id: "R2Q9",
      question: "What does David Chen ask the reader to do?",
      context:
        "From: David Chen\nSubject: Project Atlas - Status Update\n\nThe prototype testing phase has been completed successfully. We encountered minor calibration issues which have since been resolved. The project remains on schedule for the Q3 launch.\n\nPlease review the attached report.\n\n---\nInternal Memo — Re: Project Atlas\n\nFollowing David's update, the marketing team has begun preparing campaign materials for the Q3 launch. Budget allocation has been approved. All stakeholders should expect a preview at the July 15 meeting.",
      options: [
        { key: "A", text: "Attend the July 15 meeting." },
        { key: "B", text: "Review the attached report." },
        { key: "C", text: "Reply to him immediately." },
        { key: "D", text: "Wait for further information." },
      ],
      correctAnswer: "B",
      explanation:
        '"Please review the attached report" = vui lòng xem báo cáo đính kèm. Yêu cầu trực tiếp từ David Chen.',
    },
    {
      id: "R2Q10",
      question: "What does the phrase 'remains on schedule' mean?",
      context:
        "From: David Chen\nSubject: Project Atlas - Status Update\n\nThe prototype testing phase has been completed successfully. We encountered minor calibration issues which have since been resolved. The project remains on schedule for the Q3 launch.\n\nPlease review the attached report.\n\n---\nInternal Memo — Re: Project Atlas\n\nFollowing David's update, the marketing team has begun preparing campaign materials for the Q3 launch. Budget allocation has been approved. All stakeholders should expect a preview at the July 15 meeting.",
      options: [
        { key: "A", text: "The project is running behind plan." },
        { key: "B", text: "The project is still on track as planned." },
        { key: "C", text: "The project was finished earlier than expected." },
        { key: "D", text: "The timeline needs to be adjusted." },
      ],
      correctAnswer: "B",
      explanation:
        '"Remains on schedule" = vẫn đúng kế hoạch, không bị trễ. "On schedule" = đúng lịch trình đã đặt ra.',
    },
  ],
  3: [
    {
      id: "R3Q1",
      question: "What is the main purpose of this announcement?",
      context:
        "To: All Staff\nFrom: HR Department\nSubject: Office Relocation Notice\n\nWe are pleased to inform you that our company will be relocating to a new office at 450 Harbor Boulevard effective March 1st. The new facility offers expanded workspace and improved amenities. All employees are required to complete the relocation form by February 15th. Parking arrangements will be communicated separately.",
      options: [
        { key: "A", text: "To announce new job openings." },
        { key: "B", text: "To inform staff about an office relocation." },
        { key: "C", text: "To introduce a remote work policy." },
        { key: "D", text: "To announce a company holiday schedule." },
      ],
      correctAnswer: "B",
      explanation:
        "'Relocating to a new office' = chuyển đến văn phòng mới tại 450 Harbor Boulevard. Đây là mục đích chính.",
    },
    {
      id: "R3Q2",
      question: "By when must employees submit the relocation form?",
      context:
        "To: All Staff\nFrom: HR Department\nSubject: Office Relocation Notice\n\nWe are pleased to inform you that our company will be relocating to a new office at 450 Harbor Boulevard effective March 1st. The new facility offers expanded workspace and improved amenities. All employees are required to complete the relocation form by February 15th. Parking arrangements will be communicated separately.",
      options: [
        { key: "A", text: "By March 1st." },
        { key: "B", text: "By February 15th." },
        { key: "C", text: "By January 31st." },
        { key: "D", text: "By February 28th." },
      ],
      correctAnswer: "B",
      explanation:
        "'Required to complete the relocation form by February 15th' — deadline rõ ràng được nêu trong văn bản.",
    },
    {
      id: "R3Q3",
      question: "What is NOT mentioned as a benefit of the new facility?",
      context:
        "To: All Staff\nFrom: HR Department\nSubject: Office Relocation Notice\n\nWe are pleased to inform you that our company will be relocating to a new office at 450 Harbor Boulevard effective March 1st. The new facility offers expanded workspace and improved amenities. All employees are required to complete the relocation form by February 15th. Parking arrangements will be communicated separately.",
      options: [
        { key: "A", text: "Expanded workspace." },
        { key: "B", text: "Improved amenities." },
        { key: "C", text: "Parking information will be provided separately." },
        { key: "D", text: "A modern fitness center." },
      ],
      correctAnswer: "D",
      explanation:
        "Văn bản đề cập 'expanded workspace' và 'improved amenities' nhưng KHÔNG đề cập phòng gym. Câu hỏi dạng NOT mentioned.",
    },
    {
      id: "R3Q4",
      question: "What can be inferred about the current office?",
      context:
        "To: All Staff\nFrom: HR Department\nSubject: Office Relocation Notice\n\nWe are pleased to inform you that our company will be relocating to a new office at 450 Harbor Boulevard effective March 1st. The new facility offers expanded workspace and improved amenities. All employees are required to complete the relocation form by February 15th. Parking arrangements will be communicated separately.",
      options: [
        { key: "A", text: "The current office is being renovated." },
        { key: "B", text: "The current office has less space." },
        { key: "C", text: "The current office has already been sold." },
        { key: "D", text: "The current office has no parking." },
      ],
      correctAnswer: "B",
      explanation:
        "Vì văn phòng mới có 'expanded workspace' → ta suy ra văn phòng hiện tại có không gian hạn chế hơn.",
    },
    {
      id: "R3Q5",
      question: "What does the word 'amenities' most likely refer to?",
      context:
        "The new facility offers expanded workspace and improved amenities.",
      options: [
        { key: "A", text: "Old office equipment." },
        { key: "B", text: "Facilities and support services." },
        { key: "C", text: "The office rental contract." },
        { key: "D", text: "Security staff." },
      ],
      correctAnswer: "B",
      explanation:
        "'Amenities' = các tiện nghi, tiện ích (phòng họp, bếp, khu giải trí...). Từ vựng TOEIC Part 7 quan trọng.",
    },
    {
      id: "R3Q6",
      question: "What is the relationship between the two documents?",
      context:
        "Email from Sales Manager:\nThe Q2 figures show a 15% decline in the Western region. I recommend we increase our marketing budget for that area immediately.\n\n---\nBoard Meeting Minutes:\nFollowing the sales manager's report on Q2 performance, the board approved a supplementary marketing budget of $50,000 for the Western region, effective next quarter.",
      options: [
        { key: "A", text: "The two documents contradict each other." },
        {
          key: "B",
          text: "The second document is a formal response to the proposal in the first.",
        },
        { key: "C", text: "The two documents are about different regions." },
        {
          key: "D",
          text: "The first document cancels the proposal in the second.",
        },
      ],
      correctAnswer: "B",
      explanation:
        "Email đề xuất tăng ngân sách, biên bản họp xác nhận đã phê duyệt → tài liệu 2 là phản hồi chính thức. Dạng câu hỏi double-passage.",
    },
    {
      id: "R3Q7",
      question: "How much additional budget was approved?",
      context:
        "Email from Sales Manager:\nThe Q2 figures show a 15% decline in the Western region. I recommend we increase our marketing budget for that area immediately.\n\n---\nBoard Meeting Minutes:\nFollowing the sales manager's report on Q2 performance, the board approved a supplementary marketing budget of $50,000 for the Western region, effective next quarter.",
      options: [
        { key: "A", text: "$15,000" },
        { key: "B", text: "$50,000" },
        { key: "C", text: "$150,000" },
        { key: "D", text: "$500,000" },
      ],
      correctAnswer: "B",
      explanation:
        "Biên bản cuộc họp nêu rõ 'approved a supplementary marketing budget of $50,000'. Đọc kỹ số liệu cụ thể.",
    },
    {
      id: "R3Q8",
      question: "What does 'supplementary' most likely mean in this context?",
      context:
        "The board approved a supplementary marketing budget of $50,000 for the Western region.",
      options: [
        { key: "A", text: "Thay thế hoàn toàn ngân sách cũ" },
        { key: "B", text: "Bổ sung thêm vào ngân sách hiện có" },
        { key: "C", text: "Tạm thời và có thể bị thu hồi" },
        { key: "D", text: "Bí mật và không được công bố" },
      ],
      correctAnswer: "B",
      explanation:
        "'Supplementary' = bổ sung, thêm vào. Không thay thế ngân sách cũ mà cộng thêm vào.",
    },
    {
      id: "R3Q9",
      question: "What can be inferred about the Western region's performance?",
      context:
        "Email from Sales Manager:\nThe Q2 figures show a 15% decline in the Western region. I recommend we increase our marketing budget for that area immediately.\n\n---\nBoard Meeting Minutes:\nFollowing the sales manager's report on Q2 performance, the board approved a supplementary marketing budget of $50,000 for the Western region, effective next quarter.",
      options: [
        { key: "A", text: "Vùng phía Tây đang tăng trưởng mạnh" },
        { key: "B", text: "Vùng phía Tây đang gặp khó khăn về doanh số" },
        { key: "C", text: "Vùng phía Tây đã đạt mục tiêu Q2" },
        { key: "D", text: "Ban giám đốc đã từ chối đề xuất của sales manager" },
      ],
      correctAnswer: "B",
      explanation:
        "'Q2 figures show a 15% decline' = doanh số giảm 15% → vùng phía Tây đang gặp khó khăn về doanh số.",
    },
    {
      id: "R3Q10",
      question: "What action did the board take after reviewing the Q2 report?",
      context:
        "Email from Sales Manager:\nThe Q2 figures show a 15% decline in the Western region. I recommend we increase our marketing budget for that area immediately.\n\n---\nBoard Meeting Minutes:\nFollowing the sales manager's report on Q2 performance, the board approved a supplementary marketing budget of $50,000 for the Western region, effective next quarter.",
      options: [
        { key: "A", text: "Yêu cầu sales manager từ chức" },
        { key: "B", text: "Phê duyệt ngân sách marketing bổ sung $50,000" },
        { key: "C", text: "Quyết định đóng cửa vùng phía Tây" },
        { key: "D", text: "Trì hoãn quyết định đến quý sau" },
      ],
      correctAnswer: "B",
      explanation:
        "'The board approved a supplementary marketing budget of $50,000' = hội đồng phê duyệt ngân sách marketing bổ sung.",
    },
  ],
};

// ── localStorage helpers ───────────────────────────────────────────────────
function loadMapState(): LearningMapState {
  try {
    const raw = localStorage.getItem(MAP_STORAGE_KEY);
    if (raw) return JSON.parse(raw) as LearningMapState;
  } catch {
    /* ignore */
  }
  return {
    listening: { unlockedUpTo: 0, completedNodes: [], nodeScores: [] },
    reading: { unlockedUpTo: 0, completedNodes: [], nodeScores: [] },
  };
}

function saveMapState(state: LearningMapState): void {
  localStorage.setItem(MAP_STORAGE_KEY, JSON.stringify(state));
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
export default function ToeicNodePracticePage() {
  const { skillId, nodeIndex } = useParams<{
    skillId: string;
    nodeIndex: string;
  }>();
  const navigate = useNavigate();

  useToeicScrollReset();

  // ── Derive data from params ──────────────────────────────────────────────
  const activeSkill = (skillId === "reading" ? "reading" : "listening") as
    | "listening"
    | "reading";
  const parsedNodeIndex = parseInt(nodeIndex ?? "0", 10);

  const isListening = activeSkill === "listening";
  const nodeInfoList = isListening ? LISTENING_NODE_INFO : READING_NODE_INFO;
  const questionsBank = isListening ? LISTENING_QUESTIONS : READING_QUESTIONS;

  const nodeInfo = nodeInfoList[parsedNodeIndex] ?? null;
  const questions: PracticeQuestion[] = useMemo(
    () => questionsBank[parsedNodeIndex] ?? [],
    [questionsBank, parsedNodeIndex],
  );

  // ── State ────────────────────────────────────────────────────────────────
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
  const [aiLoadingByAttempt, setAiLoadingByAttempt] = useState<
    Record<string, boolean>
  >({});
  const [aiErrorByAttempt, setAiErrorByAttempt] = useState<
    Record<string, string>
  >({});
  const aiExplanationRef = useRef<Record<string, AiTutorExplanation>>({});
  const aiLoadingRef = useRef<Record<string, boolean>>({});

  useEffect(() => {
    aiExplanationRef.current = aiExplanationByAttempt;
  }, [aiExplanationByAttempt]);

  useEffect(() => {
    aiLoadingRef.current = aiLoadingByAttempt;
  }, [aiLoadingByAttempt]);

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

  // ── Guards ───────────────────────────────────────────────────────────────
  const _isInvalidRoute =
    !nodeInfo ||
    questions.length === 0 ||
    isNaN(parsedNodeIndex) ||
    parsedNodeIndex < 0;

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

  const scoreGained = useMemo(
    () => correctCount * (nodeInfo?.scorePerCorrect ?? 2.5),
    [correctCount, nodeInfo],
  );

  const currentAttemptKey =
    currentAttempt !== null ? `${currentQuestion.id}:${currentAttempt}` : null;
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
    return /\b(the|is|are|was|were|should|because|subject|verb|correct|option|maintain|consistency)\b/i.test(
      text,
    );
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

  const buildAiUnavailableMessage = useCallback(
    (selectedOption: QuestionOption): string =>
      `Qwen chưa phản hồi ổn định cho lần chọn ${selectedOption.key}. Vui lòng bấm "Thử lại AI" để lấy phân tích chi tiết cho câu này.`,
    [],
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
          ? `Đáp án đúng: ${questionData.correctAnswer}.`
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
              "- Bắt buộc nhắc lại ít nhất 1 dấu hiệu trong câu (keyword/time marker/collocation).",
              "- Phân tích lần lượt từng phương án A/B/C/D, mỗi phương án 1 ý ngắn.",
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
        const questionIdToken = questionData.id
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "_");

        const response = await askCertificateTutor({
          cert_type: "toeic",
          question,
          topic_key: `toeic.${activeSkill}.node_${parsedNodeIndex}.q_${questionIndex + 1}.${questionIdToken}.full`,
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

        setAiExplanationByAttempt((prev) => ({
          ...prev,
          [attemptKey]: {
            answer: safeAnswer,
            model: response.model,
            source: response.source,
          },
        }));
        aiExplanationRef.current = {
          ...aiExplanationRef.current,
          [attemptKey]: {
            answer: safeAnswer,
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
      isGenericTemplateAnswer,
      isLikelyEnglishAnswer,
      looksLikeOptionOnlyAnswer,
      parsedNodeIndex,
      questions,
    ],
  );

  useEffect(() => {
    if (questions.length === 0) return;

    let cancelled = false;

    const prefetchAllQuestions = async () => {
      // Warm up the first visible question first to reduce first-screen latency.
      await fetchAiExplanation(0, questions[0].correctAnswer, false);

      const targets = questions.slice(1).map((questionData, offset) => ({
        questionIndex: offset + 1,
        optionKey: questionData.correctAnswer,
      }));

      for (let i = 0; i < targets.length; i += AI_PREFETCH_BATCH_SIZE) {
        if (cancelled) return;

        const batch = targets.slice(i, i + AI_PREFETCH_BATCH_SIZE);
        await Promise.all(
          batch.map(({ questionIndex, optionKey }) =>
            fetchAiExplanation(questionIndex, optionKey, false),
          ),
        );
      }
    };

    void prefetchAllQuestions();

    return () => {
      cancelled = true;
    };
  }, [fetchAiExplanation, questions]);

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

  const handleRetryAiExplanation = useCallback(() => {
    if (!currentAttempt) return;
    void fetchAiExplanation(currentQuestionIndex, currentAttempt, true);
  }, [currentAttempt, currentQuestionIndex, fetchAiExplanation]);

  const handleSelectAnswer = (optionKey: string) => {
    // If already solved correctly, do nothing
    if (isCurrentSolved) return;

    // Record first attempt (only the very first choice per question index)
    if (firstAnswers[currentQuestionIndex] === undefined) {
      setFirstAnswers((prev) => ({
        ...prev,
        [currentQuestionIndex]: optionKey,
      }));
    }

    setCurrentAttempt(optionKey);

    // If correct, mark as solved
    if (optionKey === currentQuestion.correctAnswer) {
      setSolvedCorrectly((prev) => new Set([...prev, currentQuestionIndex]));
      void fetchAiExplanation(currentQuestionIndex, optionKey, false);
    }
  };

  const handleNextQuestion = () => {
    // Only allow advancing when current question is solved correctly
    if (!isCurrentSolved && !isCurrentCorrect) return;

    if (isLastQuestion) {
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
    // 1. Update map state in localStorage
    const mapState = loadMapState();
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

    saveMapState(newMapState);

    // 2. Sync TOEIC intake milestone score
    const profile = getToeicIntakeProfile();
    if (profile) {
      const nextCurrentScore = Math.min(
        profile.milestoneState.targetScore,
        profile.milestoneState.currentScore + Math.round(scoreGained),
      );

      const boostedProfile = appendToeicPracticeResult(
        profile,
        activeSkill,
        correctCount,
        questions.map((question) => question.id),
      );

      const nextProfile = {
        ...boostedProfile,
        milestoneState: {
          ...boostedProfile.milestoneState,
          currentScore: nextCurrentScore,
        },
      };

      saveToeicIntakeProfile(nextProfile);
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
                      +{scoreGained.toFixed(0)}
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
                        <p className="text-sm text-amber-800 leading-relaxed">
                          {q.explanation}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Action Buttons */}
            <div className="sticky bottom-4 z-10">
              <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-slate-100 p-4 flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => {
                    setFirstAnswers({});
                    setCurrentAttempt(null);
                    setSolvedCorrectly(new Set());
                    setCurrentQuestionIndex(0);
                    setShowSummary(false);
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

      <main className="flex-1 py-6 px-4">
        <div className="max-w-2xl mx-auto space-y-5">
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
              {/* Audio play button for listening — single icon, no duplicate */}
              {isListening && currentQuestion.context ? (
                <AudioPlayButton
                  text={currentQuestion.context}
                  label="Phát Audio"
                  accentClass={theme.textMuted}
                  bgClass={theme.bgMedium}
                  borderClass={theme.border}
                  onPlay={() => {}}
                />
              ) : (
                <p className="text-sm text-slate-700 leading-relaxed italic whitespace-pre-line">
                  {currentQuestion.context}
                </p>
              )}
            </div>

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
                  isThisSelected && !isCorrectOption && currentAttempt !== null;

                let optionStyle =
                  "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50";

                if (isCurrentSolved) {
                  // Question solved: highlight correct green, grey others
                  if (isCorrectOption) {
                    optionStyle =
                      "border-emerald-400 bg-emerald-50 text-emerald-800 ring-2 ring-emerald-200";
                  } else {
                    optionStyle = "border-slate-100 bg-slate-50 text-slate-400";
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

            {/* Result / Explanation panel — shown after any attempt */}
            {currentAttempt !== null && (
              <div
                className={`mx-5 mb-5 rounded-xl overflow-hidden border ${
                  isCurrentCorrect || isCurrentSolved
                    ? "border-emerald-200"
                    : "border-red-200"
                }`}
              >
                {/* Result banner */}
                <div
                  className={`px-4 py-2.5 flex items-center gap-2 ${
                    isCurrentCorrect || isCurrentSolved
                      ? "bg-emerald-500 text-white"
                      : "bg-red-400 text-white"
                  }`}
                >
                  {isCurrentCorrect || isCurrentSolved ? (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span className="font-semibold text-sm">
                        {firstAttemptCorrect
                          ? "Chính xác ngay lần đầu! 🎉 +điểm"
                          : "Đúng rồi! ✓ (Không tính điểm vì đã thử sai)"}
                      </span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-4 h-4" />
                      <span className="font-semibold text-sm">
                        Chưa đúng — Hãy thử lại! Chọn đáp án khác.
                      </span>
                    </>
                  )}
                </div>

                {(isCurrentCorrect || isCurrentSolved) && (
                  <div className="border-t border-sky-200">
                    {/* ── Giải thích AI — nguồn duy nhất ───────────────────── */}
                    <div className="bg-sky-50 px-4 py-3">
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <span className="text-sm">🤖</span>
                        <span className="text-xs font-semibold text-sky-700 uppercase tracking-wide">
                          Giải thích chi tiết
                        </span>
                      </div>

                      {/* AI đang load — chỉ hiện dots nhỏ, không che nội dung tĩnh */}
                      {currentAttemptAiLoading && (
                        <div className="flex items-center gap-1.5 py-1">
                          <span className="inline-block w-1.5 h-1.5 rounded-full bg-sky-400 animate-bounce [animation-delay:0ms]" />
                          <span className="inline-block w-1.5 h-1.5 rounded-full bg-sky-400 animate-bounce [animation-delay:150ms]" />
                          <span className="inline-block w-1.5 h-1.5 rounded-full bg-sky-400 animate-bounce [animation-delay:300ms]" />
                        </div>
                      )}

                      {/* AI đã xong — hiện kết quả */}
                      {!currentAttemptAiLoading && currentAttemptAi && (
                        <p className="text-sm text-sky-900 leading-relaxed whitespace-pre-line">
                          {currentAttemptAi.answer}
                        </p>
                      )}

                      {/* AI lỗi — hiện message + retry */}
                      {!currentAttemptAiLoading &&
                        !currentAttemptAi &&
                        currentAttemptAiError && (
                          <div className="space-y-2">
                            <p className="text-xs text-slate-400 leading-relaxed">
                              Phân tích AI chưa sẵn sàng.
                            </p>
                            <button
                              onClick={handleRetryAiExplanation}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-sky-300 bg-white text-sky-700 text-xs font-semibold hover:bg-sky-50 transition-colors"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                              Thử lại AI
                            </button>
                          </div>
                        )}

                      {/* Chưa load gì — placeholder nhẹ */}
                      {!currentAttemptAiLoading &&
                        !currentAttemptAi &&
                        !currentAttemptAiError && (
                          <p className="text-xs text-sky-300 italic">
                            Phân tích đang được chuẩn bị...
                          </p>
                        )}
                    </div>
                  </div>
                )}

                {/* Wrong attempt hint */}
                {!isCurrentCorrect && !isCurrentSolved && (
                  <div className="bg-red-50 px-4 py-3 text-xs text-red-700">
                    💡 Đáp án <strong>{currentAttempt}</strong> chưa đúng. Đọc
                    lại context và chọn đáp án khác để tiếp tục.
                  </div>
                )}
              </div>
            )}

            {/* Script reveal for listening — only after correct */}
            {isListening &&
              (isCurrentCorrect || isCurrentSolved) &&
              currentQuestion.context && (
                <div className="mx-5 mb-5">
                  <ScriptReveal
                    context={currentQuestion.context}
                    accentClass={theme.textMuted}
                    showScript={true}
                  />
                </div>
              )}
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

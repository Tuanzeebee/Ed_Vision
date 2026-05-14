// D:\Ed_Vision\Ed_Vision\src\modules\student\ToeicFoundationStudyPage.tsx
import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Archive,
  BookOpen,
  Brain,
  Sparkles,
  PenLine,
  Tag,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Star,
  Lightbulb,
  Target,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Volume2,
  Settings2,
  X,
} from "lucide-react";
import Header from "../../components/layout/Header";
import Footer from "../../components/layout/Footer";
import { useToeicScrollReset } from "../../hooks/useToeicScrollReset";
import {
  useVocabTopics,
  useVocabWords,
  useVocabStats,
  apiToggleKnown,
  apiGetKnownWords,
  type VocabWordApi,
  type VocabTopicApi,
} from "../../hooks/useVocab";



// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────
interface QuizQuestion {
  id: string;
  sentence: string;
  options: { key: "A" | "B" | "C" | "D"; text: string }[];
  correct: "A" | "B" | "C" | "D";
  explanation: string;
}

interface GrammarExample {
  en: string;
  vi: string;
}

interface GrammarRule {
  title: string;
  signal?: string;
  examples: GrammarExample[];
}

interface GrammarTopic {
  id: number;
  title: string;
  toeicPart: string;
  difficulty: string;
  difficultyColor: string;
  rules: GrammarRule[];
  tip: string;
  quiz: QuizQuestion[];
}

interface VocabWordDefinition {
  pos: string;
  meaning: string;
  example: GrammarExample;
}

interface VocabWord {
  id: string;
  word: string;
  meaning?: string;
  pos?: string;
  example?: GrammarExample;
  definitions?: VocabWordDefinition[];
}

interface VocabTopic {
  id: number;
  emoji: string;
  title: string;
  titleVI: string;
  count: number;
  level: "Cơ bản" | "Trung bình" | "Nâng cao";
  words: VocabWord[];
  isPremiumPreview?: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// GRAMMAR DATA
// ─────────────────────────────────────────────────────────────────────────────
const GRAMMAR_TOPICS: GrammarTopic[] = [
  {
    id: 1,
    title: "Thì Động Từ (Verb Tenses)",
    toeicPart: "Part 5-6",
    difficulty: "Cơ bản → Trung bình",
    difficultyColor: "emerald",
    rules: [
      {
        title: "Present Simple — sự thật, thói quen",
        signal: "always, usually, every day",
        examples: [
          {
            en: "The company <strong>opens</strong> at 9 AM every day.",
            vi: "Công ty mở cửa lúc 9h mỗi ngày.",
          },
        ],
      },
      {
        title: "Past Simple — hành động đã hoàn thành",
        signal: "yesterday, last week, ago",
        examples: [
          {
            en: "She <strong>submitted</strong> the report yesterday.",
            vi: "Cô ấy đã nộp báo cáo hôm qua.",
          },
        ],
      },
      {
        title: "Present Perfect — hành động gần đây, kinh nghiệm",
        signal: "already, yet, just, since, for",
        examples: [
          {
            en: "They <strong>have approved</strong> the budget.",
            vi: "Họ đã phê duyệt ngân sách.",
          },
        ],
      },
      {
        title: "Future (will / going to) — dự đoán, kế hoạch",
        examples: [
          {
            en: "The meeting <strong>will be held</strong> on Friday.",
            vi: "Cuộc họp sẽ được tổ chức vào thứ Sáu.",
          },
        ],
      },
      {
        title: "Present Continuous — hành động đang diễn ra",
        signal: "now, at the moment, currently",
        examples: [
          {
            en: "The team <strong>is working</strong> on the proposal.",
            vi: "Nhóm đang làm việc trên đề xuất.",
          },
        ],
      },
    ],
    tip: 'Signal words trong Part 5 là chìa khóa. Thấy "since/for" → Present Perfect. Thấy "yesterday/last" → Past Simple.',
    quiz: [
      {
        id: "q1-1",
        sentence: "She ___ the proposal last week.",
        options: [
          { key: "A", text: "submit" },
          { key: "B", text: "submitted" },
          { key: "C", text: "submits" },
          { key: "D", text: "submitting" },
        ],
        correct: "B",
        explanation:
          '"Last week" là signal của Past Simple → dùng V2 (submitted).',
      },
      {
        id: "q1-2",
        sentence: "The company ___ already ___ the new policy.",
        options: [
          { key: "A", text: "has / implemented" },
          { key: "B", text: "had / implemented" },
          { key: "C", text: "is / implementing" },
          { key: "D", text: "was / implementing" },
        ],
        correct: "A",
        explanation: '"Already" là signal của Present Perfect → has + V3.',
      },
      {
        id: "q1-3",
        sentence: "Our team ___ the quarterly report every Monday.",
        options: [
          { key: "A", text: "reviewed" },
          { key: "B", text: "will review" },
          { key: "C", text: "reviews" },
          { key: "D", text: "is reviewing" },
        ],
        correct: "C",
        explanation:
          '"Every Monday" là signal của Present Simple → V nguyên thể (reviews).',
      },
    ],
  },
  {
    id: 2,
    title: "Mạo Từ & Danh Từ (Articles & Nouns)",
    toeicPart: "Part 5-6",
    difficulty: "Cơ bản",
    difficultyColor: "green",
    rules: [
      {
        title: "a / an — lần đầu đề cập, danh từ đếm được số ít không xác định",
        examples: [
          {
            en: "Please submit <strong>a</strong> report by Friday.",
            vi: "Hãy nộp một báo cáo trước thứ Sáu.",
          },
        ],
      },
      {
        title: "the — đã biết, duy nhất, đề cập lần 2",
        examples: [
          {
            en: "<strong>The</strong> report you submitted was excellent.",
            vi: "Báo cáo bạn nộp thật xuất sắc.",
          },
        ],
      },
      {
        title: "Zero article — danh từ không đếm được, số nhiều tổng quát",
        examples: [
          {
            en: "<strong>Information</strong> is power.",
            vi: "Thông tin là sức mạnh.",
          },
        ],
      },
      {
        title: "Uncountable nouns thường gặp trong TOEIC",
        examples: [
          {
            en: "advice, information, equipment, furniture, knowledge, progress",
            vi: "Những danh từ này KHÔNG có số nhiều và KHÔNG dùng a/an.",
          },
        ],
      },
    ],
    tip: 'Cẩn thận với "equipment, furniture, advice, information" — đây là uncountable nouns hay bị nhầm trong Part 5.',
    quiz: [
      {
        id: "q2-1",
        sentence: "The manager gave us ___ useful advice about the project.",
        options: [
          { key: "A", text: "a" },
          { key: "B", text: "an" },
          { key: "C", text: "the" },
          { key: "D", text: "(no article)" },
        ],
        correct: "D",
        explanation:
          '"Advice" là uncountable noun → không dùng mạo từ a/an. "Useful advice" không cần mạo từ.',
      },
      {
        id: "q2-2",
        sentence: "We need to buy ___ new equipment for the laboratory.",
        options: [
          { key: "A", text: "a" },
          { key: "B", text: "an" },
          { key: "C", text: "some" },
          { key: "D", text: "many" },
        ],
        correct: "C",
        explanation:
          '"Equipment" là uncountable → dùng "some" thay vì "a/an" hoặc "many".',
      },
      {
        id: "q2-3",
        sentence:
          "___ conference that was held last month attracted 500 participants.",
        options: [
          { key: "A", text: "A" },
          { key: "B", text: "An" },
          { key: "C", text: "The" },
          { key: "D", text: "Some" },
        ],
        correct: "C",
        explanation:
          'Dùng "The" vì đây là hội nghị cụ thể đã được xác định (đã được đề cập / "that was held last month").',
      },
    ],
  },
  {
    id: 3,
    title: "Loại Từ (Parts of Speech)",
    toeicPart: "Part 5 (rất quan trọng!)",
    difficulty: "Trung bình",
    difficultyColor: "yellow",
    rules: [
      {
        title: "Verb → Noun (V → N)",
        examples: [
          {
            en: "employ → <strong>employment</strong>, manage → <strong>management</strong>, achieve → <strong>achievement</strong>",
            vi: "Thêm -ment, -tion, -ance, -ence để tạo danh từ.",
          },
        ],
      },
      {
        title: "Verb → Adjective (V → Adj)",
        examples: [
          {
            en: "employ → <strong>employed</strong> / <strong>employable</strong>, manage → <strong>manageable</strong>",
            vi: "Thêm -ed, -able, -ible để tạo tính từ từ động từ.",
          },
        ],
      },
      {
        title: "Adjective → Adverb (Adj → Adv)",
        examples: [
          {
            en: "careful → <strong>carefully</strong>, efficient → <strong>efficiently</strong>",
            vi: "Thêm -ly vào tính từ để tạo trạng từ.",
          },
        ],
      },
      {
        title: 'TOEIC Pattern: "_____ carefully"',
        examples: [
          {
            en: "Review the document <strong>carefully</strong>. → cần trạng từ (adverb).",
            vi: "Blank sau động từ hoặc trước tính từ → adverb.",
          },
        ],
      },
      {
        title: 'TOEIC Pattern: "The _____ of the company"',
        examples: [
          {
            en: "The <strong>management</strong> of the company is excellent. → cần danh từ.",
            vi: 'Blank sau "the" → noun.',
          },
        ],
      },
    ],
    tip: "Trong Part 5, thường cho blank giữa câu. Xác định blank là noun/verb/adj/adv từ context, rồi chọn đúng dạng từ.",
    quiz: [
      {
        id: "q3-1",
        sentence:
          "The new software has significantly improved the ___ of our team.",
        options: [
          { key: "A", text: "productive" },
          { key: "B", text: "productively" },
          { key: "C", text: "productivity" },
          { key: "D", text: "produce" },
        ],
        correct: "C",
        explanation:
          'Sau "the" cần danh từ → "productivity" (productive=adj, productively=adv).',
      },
      {
        id: "q3-2",
        sentence: "Please handle all client inquiries ___.",
        options: [
          { key: "A", text: "profession" },
          { key: "B", text: "professional" },
          { key: "C", text: "professionally" },
          { key: "D", text: "professionalism" },
        ],
        correct: "C",
        explanation:
          'Sau động từ "handle" cần trạng từ (adverb) → "professionally".',
      },
      {
        id: "q3-3",
        sentence: "The ___ of the new policy was announced yesterday.",
        options: [
          { key: "A", text: "implement" },
          { key: "B", text: "implementation" },
          { key: "C", text: "implementing" },
          { key: "D", text: "implemented" },
        ],
        correct: "B",
        explanation:
          'Sau "The" là chủ ngữ → cần danh từ. "Implementation" = sự thực hiện.',
      },
    ],
  },
  {
    id: 4,
    title: "Câu Bị Động (Passive Voice)",
    toeicPart: "Part 5-6",
    difficulty: "Trung bình",
    difficultyColor: "yellow",
    rules: [
      {
        title: "Công thức: Subject + be + V3/ed (+ by agent)",
        examples: [
          {
            en: 'Active: "They approved the plan." → Passive: "The plan <strong>was approved</strong>."',
            vi: "Chủ thể nhận hành động trở thành chủ ngữ.",
          },
        ],
      },
      {
        title: "Present Passive",
        examples: [
          {
            en: "The report <strong>is reviewed</strong> monthly.",
            vi: "Báo cáo được xem xét hàng tháng.",
          },
        ],
      },
      {
        title: "Past Passive",
        examples: [
          {
            en: "The contract <strong>was signed</strong> yesterday.",
            vi: "Hợp đồng đã được ký hôm qua.",
          },
        ],
      },
      {
        title: "Present Perfect Passive",
        examples: [
          {
            en: "The order <strong>has been shipped</strong>.",
            vi: "Đơn hàng đã được giao.",
          },
        ],
      },
      {
        title: "Future Passive",
        examples: [
          {
            en: "The product <strong>will be launched</strong> next month.",
            vi: "Sản phẩm sẽ được ra mắt tháng tới.",
          },
        ],
      },
    ],
    tip: 'Bị động rất phổ biến trong business English. Nhận diện bằng "be + V3". Chú ý khi subject không quan trọng hoặc không biết ai làm.',
    quiz: [
      {
        id: "q4-1",
        sentence:
          "The annual report ___ by the accounting team every December.",
        options: [
          { key: "A", text: "prepares" },
          { key: "B", text: "is prepared" },
          { key: "C", text: "has prepared" },
          { key: "D", text: "preparing" },
        ],
        correct: "B",
        explanation:
          'Bị động hiện tại: "is prepared" (be + V3). Chủ ngữ "The annual report" nhận hành động.',
      },
      {
        id: "q4-2",
        sentence: "All invoices ___ before the end of the fiscal year.",
        options: [
          { key: "A", text: "must submit" },
          { key: "B", text: "must be submitted" },
          { key: "C", text: "must have submitted" },
          { key: "D", text: "must submitting" },
        ],
        correct: "B",
        explanation: 'Modal passive: "must be submitted" (modal + be + V3).',
      },
      {
        id: "q4-3",
        sentence: "The new branch ___ in Ho Chi Minh City last year.",
        options: [
          { key: "A", text: "opened" },
          { key: "B", text: "was opened" },
          { key: "C", text: "has opened" },
          { key: "D", text: "opening" },
        ],
        correct: "B",
        explanation:
          '"Last year" + bị động quá khứ = "was opened". Nhấn mạnh việc khai trương đó được thực hiện bởi ai đó.',
      },
    ],
  },
  {
    id: 5,
    title: "Mệnh Đề Quan Hệ (Relative Clauses)",
    toeicPart: "Part 6-7",
    difficulty: "Trung bình",
    difficultyColor: "orange",
    rules: [
      {
        title: "who — chỉ người",
        examples: [
          {
            en: "The employee <strong>who</strong> submitted the form will be contacted.",
            vi: "Nhân viên người đã nộp form sẽ được liên hệ.",
          },
        ],
      },
      {
        title: "which — chỉ vật, sự việc",
        examples: [
          {
            en: "The contract <strong>which</strong> was signed last week is now effective.",
            vi: "Hợp đồng được ký tuần trước hiện đã có hiệu lực.",
          },
        ],
      },
      {
        title: "that — người hoặc vật (defining clauses)",
        examples: [
          {
            en: "The report <strong>that</strong> I prepared was highly praised.",
            vi: "Báo cáo mà tôi đã chuẩn bị được đánh giá cao.",
          },
        ],
      },
      {
        title: "whose — sở hữu",
        examples: [
          {
            en: "The client <strong>whose</strong> order arrived first gets a discount.",
            vi: "Khách hàng có đơn hàng đến trước sẽ được giảm giá.",
          },
        ],
      },
      {
        title: "where — nơi chốn",
        examples: [
          {
            en: "The office <strong>where</strong> she works is downtown.",
            vi: "Văn phòng nơi cô ấy làm việc ở trung tâm thành phố.",
          },
        ],
      },
    ],
    tip: 'Trong Part 6, mệnh đề quan hệ giúp kết nối câu mạch lạc. Nhớ dùng "which" thay "that" trong non-defining clauses (có dấu phẩy).',
    quiz: [
      {
        id: "q5-1",
        sentence: "The manager ___ supervised the project has been promoted.",
        options: [
          { key: "A", text: "which" },
          { key: "B", text: "whose" },
          { key: "C", text: "who" },
          { key: "D", text: "where" },
        ],
        correct: "C",
        explanation:
          '"Manager" là người → dùng "who" trong mệnh đề quan hệ xác định.',
      },
      {
        id: "q5-2",
        sentence: "The department ___ budget was cut will need to restructure.",
        options: [
          { key: "A", text: "who" },
          { key: "B", text: "whose" },
          { key: "C", text: "which" },
          { key: "D", text: "that" },
        ],
        correct: "B",
        explanation:
          'Cần đại từ quan hệ sở hữu → "whose" (budget của department).',
      },
      {
        id: "q5-3",
        sentence:
          "This is the conference room ___ the board meetings are held.",
        options: [
          { key: "A", text: "which" },
          { key: "B", text: "that" },
          { key: "C", text: "who" },
          { key: "D", text: "where" },
        ],
        correct: "D",
        explanation: '"Conference room" là nơi chốn → dùng "where".',
      },
    ],
  },
  {
    id: 6,
    title: "Giới Từ & Kết Từ (Prepositions & Conjunctions)",
    toeicPart: "Part 5-6 (rất hay ra!)",
    difficulty: "Trung bình",
    difficultyColor: "orange",
    rules: [
      {
        title: "Giới từ thời gian: at / on / in",
        examples: [
          {
            en: "<strong>at</strong> 9 AM · <strong>on</strong> Monday · <strong>in</strong> January / 2024",
            vi: "at = giờ cụ thể, on = ngày/thứ, in = tháng/năm/mùa.",
          },
        ],
      },
      {
        title: "Giới từ nơi chốn: at / in / on",
        examples: [
          {
            en: "<strong>at</strong> the office · <strong>in</strong> Vietnam · <strong>on</strong> the third floor",
            vi: "at = điểm cụ thể, in = vùng rộng/bên trong, on = mặt phẳng/tầng.",
          },
        ],
      },
      {
        title: "Cụm giới từ thương mại phổ biến",
        examples: [
          {
            en: "<strong>according to</strong> · <strong>due to</strong> · <strong>in charge of</strong> · <strong>in addition to</strong> · <strong>instead of</strong>",
            vi: "Theo / do / phụ trách / thêm vào / thay vì.",
          },
        ],
      },
      {
        title: "Liên từ: although / because / unless / provided that",
        examples: [
          {
            en: "<strong>Although</strong> sales declined, profits increased. / <strong>Unless</strong> approved, do not proceed.",
            vi: "Mặc dù / vì / trừ khi / miễn là.",
          },
        ],
      },
    ],
    tip: 'Hay bị nhầm: "despite / in spite of" + Noun/V-ing (KHÔNG dùng với clause). "Although" + clause. Ví dụ: "Despite the rain" (đúng) vs "Despite it rained" (sai).',
    quiz: [
      {
        id: "q6-1",
        sentence: "The meeting has been postponed ___ the heavy snowstorm.",
        options: [
          { key: "A", text: "although" },
          { key: "B", text: "because" },
          { key: "C", text: "due to" },
          { key: "D", text: "despite" },
        ],
        correct: "C",
        explanation:
          '"The heavy snowstorm" là cụm danh từ → dùng "due to" (giới từ + noun). "Although/because" cần clause.',
      },
      {
        id: "q6-2",
        sentence:
          "Please contact HR ___ any questions about your benefits package.",
        options: [
          { key: "A", text: "about" },
          { key: "B", text: "for" },
          { key: "C", text: "regarding" },
          { key: "D", text: "at" },
        ],
        correct: "C",
        explanation:
          '"Regarding" = liên quan đến, thường dùng trong business email/memo. Đây là lựa chọn formal nhất.',
      },
      {
        id: "q6-3",
        sentence:
          "___ the high cost, the board approved the renovation project.",
        options: [
          { key: "A", text: "Because" },
          { key: "B", text: "Despite" },
          { key: "C", text: "Although" },
          { key: "D", text: "Since" },
        ],
        correct: "B",
        explanation:
          '"The high cost" là cụm danh từ → "Despite + noun" (mặc dù chi phí cao). "Although" cần clause.',
      },
    ],
  },
  {
    id: 7,
    title: "Câu Điều Kiện (Conditionals)",
    toeicPart: "Part 5",
    difficulty: "Khá",
    difficultyColor: "red",
    rules: [
      {
        title: "Type 0 — Sự thật hiển nhiên",
        examples: [
          {
            en: "If you heat water, it <strong>boils</strong>.",
            vi: "Nếu đun nóng nước, nó sôi. (If + V, V hiện tại)",
          },
        ],
      },
      {
        title: "Type 1 — Điều kiện có thực ở hiện tại/tương lai",
        examples: [
          {
            en: "If the shipment <strong>arrives</strong> on time, we <strong>will meet</strong> the deadline.",
            vi: "Nếu hàng về đúng hạn, chúng ta sẽ kịp tiến độ. (If + V hiện tại, will + V)",
          },
        ],
      },
      {
        title: "Type 2 — Điều kiện không có thực ở hiện tại",
        examples: [
          {
            en: "If we <strong>had</strong> more staff, we <strong>would finish</strong> faster.",
            vi: "Nếu có thêm nhân viên, chúng ta sẽ hoàn thành nhanh hơn. (If + V quá khứ, would + V)",
          },
        ],
      },
      {
        title: "Type 3 — Điều kiện không có thực trong quá khứ",
        examples: [
          {
            en: "If they <strong>had sent</strong> the invoice earlier, payment <strong>would have arrived</strong>.",
            vi: "Nếu họ gửi hóa đơn sớm hơn, thanh toán đã đến rồi. (If + had V3, would have + V3)",
          },
        ],
      },
    ],
    tip: "Part 5 hay test Type 1 và 2. Nhận dạng bằng mối quan hệ if-clause và main clause. Nhớ: Type 1 = will + V, Type 2 = would + V.",
    quiz: [
      {
        id: "q7-1",
        sentence:
          "If the client ___ the contract today, we will begin the project next week.",
        options: [
          { key: "A", text: "signed" },
          { key: "B", text: "signs" },
          { key: "C", text: "will sign" },
          { key: "D", text: "would sign" },
        ],
        correct: "B",
        explanation:
          'Type 1: If + V hiện tại (signs), will + V → "we will begin". Main clause dùng will.',
      },
      {
        id: "q7-2",
        sentence:
          "If the company ___ more in marketing, sales would increase significantly.",
        options: [
          { key: "A", text: "invest" },
          { key: "B", text: "invests" },
          { key: "C", text: "invested" },
          { key: "D", text: "had invested" },
        ],
        correct: "C",
        explanation:
          'Type 2: If + V quá khứ (invested), would + V → "would increase". Đây là giả định không có thực ở hiện tại.',
      },
      {
        id: "q7-3",
        sentence:
          "If we had prepared better, the presentation ___ more successful.",
        options: [
          { key: "A", text: "will be" },
          { key: "B", text: "would be" },
          { key: "C", text: "would have been" },
          { key: "D", text: "had been" },
        ],
        correct: "C",
        explanation:
          'Type 3: If + had V3 (had prepared), would have + V3 → "would have been". Giả định quá khứ.',
      },
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// VOCABULARY DATA
// ─────────────────────────────────────────────────────────────────────────────
const VOCAB_TOPICS: VocabTopic[] = [
  {
    id: 1,
    emoji: "📧",
    title: "Email & Office Communication",
    titleVI: "Email & Văn phòng",
    count: 25,
    level: "Cơ bản",
    words: [
      {
        id: "v1-1",
        word: "regarding",
        level: "Cơ bản",
        definitions: [
          {
            pos: "prep.",
            meaning: "liên quan đến",
            example: {
          en: "I am writing regarding the meeting scheduled for Monday.",
          vi: "Tôi viết thư liên quan đến cuộc họp dự kiến vào thứ Hai.",
        }
          }
        ],
        freq: 3
      },
      {
        id: "v1-2",
        word: "attached",
        level: "Cơ bản",
        definitions: [
          {
            pos: "adj.",
            meaning: "đính kèm",
            example: {
          en: "Please find the attached document for your review.",
          vi: "Vui lòng xem tài liệu đính kèm để xem xét.",
        }
          }
        ],
        freq: 3
      },
      {
        id: "v1-3",
        word: "pursuant",
        level: "Trung bình",
        definitions: [
          {
            pos: "adj.",
            meaning: "theo, căn cứ vào",
            example: {
          en: "Pursuant to our agreement, payment is due on the 15th.",
          vi: "Theo thỏa thuận của chúng ta, thanh toán đến hạn vào ngày 15.",
        }
          }
        ],
        freq: 2
      },
      {
        id: "v1-4",
        word: "agenda",
        level: "Cơ bản",
        definitions: [
          {
            pos: "n.",
            meaning: "chương trình nghị sự",
            example: {
          en: "Please review the agenda before the meeting.",
          vi: "Vui lòng xem lại chương trình nghị sự trước cuộc họp.",
        }
          }
        ],
        freq: 3
      },
      {
        id: "v1-5",
        word: "correspondence",
        level: "Trung bình",
        definitions: [
          {
            pos: "n.",
            meaning: "thư từ giao dịch",
            example: {
          en: "All correspondence should be directed to the HR department.",
          vi: "Mọi thư từ giao dịch cần gửi đến bộ phận Nhân sự.",
        }
          }
        ],
        freq: 2
      },
      {
        id: "v1-6",
        word: "acknowledge",
        level: "Cơ bản",
        definitions: [
          {
            pos: "v.",
            meaning: "xác nhận, thừa nhận",
            example: {
          en: "Please acknowledge receipt of this email.",
          vi: "Vui lòng xác nhận đã nhận được email này.",
        }
          }
        ],
        freq: 3
      },
      {
        id: "v1-7",
        word: "facilitate",
        level: "Trung bình",
        definitions: [
          {
            pos: "v.",
            meaning: "tạo điều kiện thuận lợi",
            example: {
          en: "The new software will facilitate communication between teams.",
          vi: "Phần mềm mới sẽ tạo điều kiện giao tiếp giữa các nhóm.",
        }
          }
        ],
        freq: 2
      },
      {
        id: "v1-8",
        word: "inquiry",
        level: "Cơ bản",
        definitions: [
          {
            pos: "n.",
            meaning: "sự hỏi han, thắc mắc",
            example: {
          en: "Thank you for your inquiry about our services.",
          vi: "Cảm ơn bạn đã hỏi về dịch vụ của chúng tôi.",
        }
          }
        ],
        freq: 3
      },
      {
        id: "v1-9",
        word: "notify",
        level: "Cơ bản",
        definitions: [
          {
            pos: "v.",
            meaning: "thông báo",
            example: {
          en: "Please notify all staff of the schedule change.",
          vi: "Vui lòng thông báo cho tất cả nhân viên về sự thay đổi lịch.",
        }
          }
        ],
        freq: 3
      },
      {
        id: "v1-10",
        word: "confirm",
        level: "Cơ bản",
        definitions: [
          {
            pos: "v.",
            meaning: "xác nhận",
            example: {
          en: "I am writing to confirm our appointment on Thursday.",
          vi: "Tôi viết để xác nhận cuộc hẹn của chúng ta vào thứ Năm.",
        }
          }
        ],
        freq: 3
      },
      {
        id: "v1-11",
        word: "postpone",
        level: "Cơ bản",
        definitions: [
          {
            pos: "v.",
            meaning: "hoãn lại",
            example: {
          en: "The meeting has been postponed to next week.",
          vi: "Cuộc họp đã bị hoãn đến tuần sau.",
        }
          }
        ],
        freq: 3
      },
      {
        id: "v1-12",
        word: "available",
        level: "Cơ bản",
        definitions: [
          {
            pos: "adj.",
            meaning: "sẵn sàng, có thể liên lạc",
            example: {
          en: "I am available for a call after 2 PM.",
          vi: "Tôi có thể nghe gọi sau 2 giờ chiều.",
        }
          }
        ],
        freq: 3
      },
      {
        id: "v1-13",
        word: "forward",
        level: "Trung bình",
        definitions: [
          {
            pos: "v.",
            meaning: "chuyển tiếp",
            example: {
          en: "I will forward your request to the relevant department.",
          vi: "Tôi sẽ chuyển yêu cầu của bạn đến bộ phận liên quan.",
        }
          }
        ],
        freq: 2
      },
      {
        id: "v1-14",
        word: "update",
        level: "Cơ bản",
        definitions: [
          {
            pos: "v./n.",
            meaning: "cập nhật",
            example: {
          en: "Please provide an update on the project status.",
          vi: "Vui lòng cập nhật tình trạng dự án.",
        }
          }
        ],
        freq: 3
      },
      {
        id: "v1-15",
        word: "deadline",
        level: "Cơ bản",
        definitions: [
          {
            pos: "n.",
            meaning: "hạn chót",
            example: {
          en: "The submission deadline is this Friday.",
          vi: "Hạn nộp là thứ Sáu này.",
        }
          }
        ],
        freq: 3
      },
      {
        id: "v1-16",
        word: "draft",
        level: "Cơ bản",
        definitions: [
          {
            pos: "n./v.",
            meaning: "bản thảo / soạn thảo",
            example: {
          en: "The team is working on the draft proposal.",
          vi: "Nhóm đang làm việc trên bản đề xuất thảo.",
        }
          }
        ],
        freq: 3
      },
      {
        id: "v1-17",
        word: "circulate",
        level: "Trung bình",
        definitions: [
          {
            pos: "v.",
            meaning: "lưu hành, phân phát",
            example: {
          en: "Please circulate the minutes to all members.",
          vi: "Vui lòng phân phát biên bản cho tất cả thành viên.",
        }
          }
        ],
        freq: 2
      },
      {
        id: "v1-18",
        word: "minutes",
        level: "Cơ bản",
        definitions: [
          {
            pos: "n.",
            meaning: "biên bản cuộc họp",
            example: {
          en: "Who will take the minutes at today's meeting?",
          vi: "Ai sẽ ghi biên bản trong cuộc họp hôm nay?",
        }
          }
        ],
        freq: 3
      },
      {
        id: "v1-19",
        word: "confidential",
        level: "Trung bình",
        definitions: [
          {
            pos: "adj.",
            meaning: "bí mật, mật",
            example: {
          en: "This document is strictly confidential.",
          vi: "Tài liệu này hoàn toàn bí mật.",
        }
          }
        ],
        freq: 2
      },
      {
        id: "v1-20",
        word: "reference",
        level: "Cơ bản",
        definitions: [
          {
            pos: "n.",
            meaning: "tài liệu tham khảo / mã số",
            example: {
          en: "Please use the above reference number in your reply.",
          vi: "Vui lòng sử dụng số mã tham chiếu ở trên trong câu trả lời.",
        }
          }
        ],
        freq: 3
      },
      {
        id: "v1-21",
        word: "schedule",
        level: "Cơ bản",
        definitions: [
          {
            pos: "v./n.",
            meaning: "lên lịch / lịch trình",
            example: {
          en: "The interview is scheduled for 10 AM on Monday.",
          vi: "Buổi phỏng vấn được lên lịch vào 10 giờ sáng thứ Hai.",
        }
          }
        ],
        freq: 3
      },
      {
        id: "v1-22",
        word: "revise",
        level: "Trung bình",
        definitions: [
          {
            pos: "v.",
            meaning: "sửa đổi, chỉnh sửa",
            example: {
          en: "Please revise the proposal and resubmit it by Friday.",
          vi: "Vui lòng sửa lại đề xuất và gửi lại trước thứ Sáu.",
        }
          }
        ],
        freq: 2
      },
      {
        id: "v1-23",
        word: "submit",
        level: "Cơ bản",
        definitions: [
          {
            pos: "v.",
            meaning: "nộp, gửi",
            example: {
          en: "Please submit the completed form to HR.",
          vi: "Vui lòng nộp mẫu đã điền cho bộ phận Nhân sự.",
        }
          }
        ],
        freq: 3
      },
      {
        id: "v1-24",
        word: "clarify",
        level: "Trung bình",
        definitions: [
          {
            pos: "v.",
            meaning: "làm rõ",
            example: {
          en: "Could you clarify the requirements for this position?",
          vi: "Bạn có thể làm rõ các yêu cầu cho vị trí này không?",
        }
          }
        ],
        freq: 2
      },
      {
        id: "v1-25",
        word: "urgent",
        level: "Cơ bản",
        definitions: [
          {
            pos: "adj.",
            meaning: "khẩn cấp",
            example: {
          en: "This is an urgent matter that requires immediate attention.",
          vi: "Đây là vấn đề khẩn cấp cần được chú ý ngay lập tức.",
        }
          }
        ],
        freq: 3
      },
    ],
  },
  {
    id: 2,
    emoji: "💼",
    title: "Contracts & Agreements",
    titleVI: "Hợp đồng & Thỏa thuận",
    count: 30,
    level: "Cơ bản",
    words: [
      {
        id: "v2-1",
        word: "contract",
        level: "Cơ bản",
        definitions: [
          {
            pos: "n.",
            meaning: "hợp đồng",
            example: {
          en: "Both parties must sign the contract before work begins.",
          vi: "Cả hai bên phải ký hợp đồng trước khi công việc bắt đầu.",
        }
          }
        ],
        freq: 3
      },
      {
        id: "v2-2",
        word: "negotiate",
        level: "Cơ bản",
        definitions: [
          {
            pos: "v.",
            meaning: "đàm phán",
            example: {
          en: "The two companies will negotiate the terms of the deal.",
          vi: "Hai công ty sẽ đàm phán các điều khoản của thỏa thuận.",
        }
          }
        ],
        freq: 3
      },
      {
        id: "v2-3",
        word: "clause",
        level: "Trung bình",
        definitions: [
          {
            pos: "n.",
            meaning: "điều khoản",
            example: {
          en: "Please review clause 5 of the contract carefully.",
          vi: "Vui lòng xem xét kỹ điều khoản 5 của hợp đồng.",
        }
          }
        ],
        freq: 2
      },
      {
        id: "v2-4",
        word: "vendor",
        level: "Cơ bản",
        definitions: [
          {
            pos: "n.",
            meaning: "nhà cung cấp, người bán",
            example: {
          en: "We need to select a reliable vendor for this project.",
          vi: "Chúng ta cần chọn một nhà cung cấp đáng tin cậy cho dự án này.",
        }
          }
        ],
        freq: 3
      },
      {
        id: "v2-5",
        word: "proposal",
        level: "Cơ bản",
        definitions: [
          {
            pos: "n.",
            meaning: "đề xuất, bản đề nghị",
            example: {
          en: "The team submitted a proposal to the client.",
          vi: "Nhóm đã gửi một đề xuất cho khách hàng.",
        }
          }
        ],
        freq: 3
      },
      {
        id: "v2-6",
        word: "invoice",
        level: "Cơ bản",
        definitions: [
          {
            pos: "n.",
            meaning: "hóa đơn",
            example: {
          en: "The invoice must be paid within 30 days.",
          vi: "Hóa đơn phải được thanh toán trong vòng 30 ngày.",
        }
          }
        ],
        freq: 3
      },
      {
        id: "v2-7",
        word: "comply",
        level: "Cơ bản",
        definitions: [
          {
            pos: "v.",
            meaning: "tuân thủ",
            example: {
          en: "All contractors must comply with safety regulations.",
          vi: "Tất cả nhà thầu phải tuân thủ các quy định an toàn.",
        }
          }
        ],
        freq: 3
      },
      {
        id: "v2-8",
        word: "incentive",
        level: "Trung bình",
        definitions: [
          {
            pos: "n.",
            meaning: "khuyến khích, phần thưởng",
            example: {
          en: "The company offers incentives for high-performing employees.",
          vi: "Công ty cung cấp các phần thưởng cho nhân viên có hiệu suất cao.",
        }
          }
        ],
        freq: 2
      },
      {
        id: "v2-9",
        word: "merger",
        level: "Trung bình",
        definitions: [
          {
            pos: "n.",
            meaning: "sáp nhập",
            example: {
          en: "The merger between the two companies was announced last week.",
          vi: "Việc sáp nhập giữa hai công ty được công bố tuần trước.",
        }
          }
        ],
        freq: 2
      },
      {
        id: "v2-10",
        word: "acquisition",
        level: "Trung bình",
        definitions: [
          {
            pos: "n.",
            meaning: "sự thâu tóm, mua lại",
            example: {
          en: "The acquisition was valued at $50 million.",
          vi: "Thương vụ mua lại được định giá 50 triệu đô la.",
        }
          }
        ],
        freq: 2
      },
      {
        id: "v2-11",
        word: "revenue",
        level: "Cơ bản",
        definitions: [
          {
            pos: "n.",
            meaning: "doanh thu",
            example: {
          en: "The company's revenue increased by 15% this quarter.",
          vi: "Doanh thu của công ty tăng 15% trong quý này.",
        }
          }
        ],
        freq: 3
      },
      {
        id: "v2-12",
        word: "profit",
        level: "Cơ bản",
        definitions: [
          {
            pos: "n.",
            meaning: "lợi nhuận",
            example: {
          en: "Net profit for the year exceeded expectations.",
          vi: "Lợi nhuận ròng trong năm vượt quá kỳ vọng.",
        }
          }
        ],
        freq: 3
      },
      {
        id: "v2-13",
        word: "budget",
        level: "Cơ bản",
        definitions: [
          {
            pos: "n.",
            meaning: "ngân sách",
            example: {
          en: "We need to stay within the allocated budget.",
          vi: "Chúng ta cần duy trì trong giới hạn ngân sách được phân bổ.",
        }
          }
        ],
        freq: 3
      },
      {
        id: "v2-14",
        word: "expenditure",
        level: "Trung bình",
        definitions: [
          {
            pos: "n.",
            meaning: "chi tiêu, khoản chi",
            example: {
          en: "All expenditures must be approved by management.",
          vi: "Tất cả chi tiêu phải được ban quản lý phê duyệt.",
        }
          }
        ],
        freq: 2
      },
      {
        id: "v2-15",
        word: "reimburse",
        level: "Cơ bản",
        definitions: [
          {
            pos: "v.",
            meaning: "hoàn trả, bồi hoàn",
            example: {
          en: "Employees will be reimbursed for travel expenses.",
          vi: "Nhân viên sẽ được hoàn trả chi phí đi lại.",
        }
          }
        ],
        freq: 3
      },
      {
        id: "v2-16",
        word: "audit",
        level: "Trung bình",
        definitions: [
          {
            pos: "n./v.",
            meaning: "kiểm toán",
            example: {
          en: "The annual audit will take place next month.",
          vi: "Cuộc kiểm toán hàng năm sẽ diễn ra vào tháng tới.",
        }
          }
        ],
        freq: 2
      },
      {
        id: "v2-17",
        word: "liability",
        level: "Trung bình",
        definitions: [
          {
            pos: "n.",
            meaning: "trách nhiệm pháp lý",
            example: {
          en: "The company accepts no liability for damages.",
          vi: "Công ty không chịu trách nhiệm pháp lý về thiệt hại.",
        }
          }
        ],
        freq: 2
      },
      {
        id: "v2-18",
        word: "stakeholder",
        level: "Cơ bản",
        definitions: [
          {
            pos: "n.",
            meaning: "các bên liên quan",
            example: {
          en: "All stakeholders were informed of the decision.",
          vi: "Tất cả các bên liên quan đã được thông báo về quyết định.",
        }
          }
        ],
        freq: 3
      },
      {
        id: "v2-19",
        word: "priority",
        level: "Cơ bản",
        definitions: [
          {
            pos: "n.",
            meaning: "ưu tiên",
            example: {
          en: "Customer satisfaction is our top priority.",
          vi: "Sự hài lòng của khách hàng là ưu tiên hàng đầu của chúng tôi.",
        }
          }
        ],
        freq: 3
      },
      {
        id: "v2-20",
        word: "launch",
        level: "Cơ bản",
        definitions: [
          {
            pos: "v./n.",
            meaning: "ra mắt",
            example: {
          en: "The new product will be launched next quarter.",
          vi: "Sản phẩm mới sẽ được ra mắt vào quý tới.",
        }
          }
        ],
        freq: 3
      },
      {
        id: "v2-21",
        word: "implement",
        level: "Cơ bản",
        definitions: [
          {
            pos: "v.",
            meaning: "thực hiện, áp dụng",
            example: {
          en: "The new policy will be implemented starting next month.",
          vi: "Chính sách mới sẽ được thực hiện bắt đầu từ tháng tới.",
        }
          }
        ],
        freq: 3
      },
      {
        id: "v2-22",
        word: "terminate",
        level: "Trung bình",
        definitions: [
          {
            pos: "v.",
            meaning: "chấm dứt",
            example: {
          en: "The contract may be terminated with 30 days' notice.",
          vi: "Hợp đồng có thể bị chấm dứt với thông báo 30 ngày.",
        }
          }
        ],
        freq: 2
      },
      {
        id: "v2-23",
        word: "prior",
        level: "Cơ bản",
        definitions: [
          {
            pos: "adj.",
            meaning: "trước đó",
            example: {
          en: "Prior approval is required for all purchases over $500.",
          vi: "Cần có sự phê duyệt trước cho tất cả giao dịch mua trên 500 đô.",
        }
          }
        ],
        freq: 3
      },
      {
        id: "v2-24",
        word: "loss",
        level: "Cơ bản",
        definitions: [
          {
            pos: "n.",
            meaning: "thua lỗ, mất mát",
            example: {
          en: "The company reported a loss of $2 million last year.",
          vi: "Công ty báo cáo khoản lỗ 2 triệu đô la năm ngoái.",
        }
          }
        ],
        freq: 3
      },
      {
        id: "v2-25",
        word: "compliance",
        level: "Cơ bản",
        definitions: [
          {
            pos: "n.",
            meaning: "sự tuân thủ",
            example: {
          en: "All employees must ensure compliance with company policies.",
          vi: "Tất cả nhân viên phải đảm bảo tuân thủ các chính sách công ty.",
        }
          }
        ],
        freq: 3
      },
    ],
  },
  {
    id: 3,
    emoji: "📊",
    title: "Finance & Banking",
    titleVI: "Tài chính & Ngân hàng",
    count: 45,
    level: "Trung bình",
    isPremiumPreview: true,
    words: [
      {
        id: "v3-1",
        word: "budget",
        level: "Cơ bản",
        definitions: [
          {
            pos: "n.",
            meaning: "ngân sách",
            example: {
          en: "The project was completed within budget.",
          vi: "Dự án đã hoàn thành trong ngân sách.",
        }
          }
        ],
        freq: 3
      },
      {
        id: "v3-2",
        word: "revenue",
        level: "Cơ bản",
        definitions: [
          {
            pos: "n.",
            meaning: "doanh thu",
            example: {
          en: "Annual revenue grew by 20%.",
          vi: "Doanh thu hàng năm tăng 20%.",
        }
          }
        ],
        freq: 3
      },
      {
        id: "v3-3",
        word: "profit",
        level: "Cơ bản",
        definitions: [
          {
            pos: "n.",
            meaning: "lợi nhuận",
            example: {
          en: "The company reported record profits this year.",
          vi: "Công ty báo cáo lợi nhuận kỷ lục năm nay.",
        }
          }
        ],
        freq: 3
      },
      {
        id: "v3-4",
        word: "expenditure",
        level: "Trung bình",
        definitions: [
          {
            pos: "n.",
            meaning: "chi tiêu",
            example: {
          en: "Capital expenditure increased by 10%.",
          vi: "Chi tiêu vốn tăng 10%.",
        }
          }
        ],
        freq: 2
      },
      {
        id: "v3-5",
        word: "reimburse",
        level: "Cơ bản",
        definitions: [
          {
            pos: "v.",
            meaning: "hoàn tiền",
            example: {
          en: "Submit receipts to be reimbursed.",
          vi: "Nộp biên lai để được hoàn tiền.",
        }
          }
        ],
        freq: 3
      },
      {
        id: "v3-6",
        word: "audit",
        level: "Trung bình",
        definitions: [
          {
            pos: "n./v.",
            meaning: "kiểm toán",
            example: {
          en: "The accounts were audited last quarter.",
          vi: "Tài khoản đã được kiểm toán quý trước.",
        }
          }
        ],
        freq: 2
      },
      {
        id: "v3-7",
        word: "liability",
        level: "Trung bình",
        definitions: [
          {
            pos: "n.",
            meaning: "nợ phải trả",
            example: {
          en: "Current liabilities include short-term loans.",
          vi: "Nợ ngắn hạn bao gồm các khoản vay ngắn hạn.",
        }
          }
        ],
        freq: 2
      },
      {
        id: "v3-8",
        word: "quarterly",
        level: "Cơ bản",
        definitions: [
          {
            pos: "adj./adv.",
            meaning: "hàng quý",
            example: {
          en: "Quarterly reports are due on the 15th.",
          vi: "Báo cáo hàng quý đến hạn vào ngày 15.",
        }
          }
        ],
        freq: 3
      },
      {
        id: "v3-9",
        word: "fiscal",
        level: "Cơ bản",
        definitions: [
          {
            pos: "adj.",
            meaning: "thuộc tài chính/ngân sách",
            example: {
          en: "The fiscal year ends in December.",
          vi: "Năm tài chính kết thúc vào tháng 12.",
        }
          }
        ],
        freq: 3
      },
      {
        id: "v3-10",
        word: "dividend",
        level: "Trung bình",
        definitions: [
          {
            pos: "n.",
            meaning: "cổ tức",
            example: {
          en: "Shareholders will receive an annual dividend.",
          vi: "Cổ đông sẽ nhận cổ tức hàng năm.",
        }
          }
        ],
        freq: 2
      },
    ],
  },
  {
    id: 4,
    emoji: "🏭",
    title: "Manufacturing & Production",
    titleVI: "Sản xuất",
    count: 35,
    level: "Trung bình",
    isPremiumPreview: true,
    words: [
      {
        id: "v4-1",
        word: "shipment",
        level: "Cơ bản",
        definitions: [
          {
            pos: "n.",
            meaning: "lô hàng",
            example: {
          en: "The shipment arrived two days early.",
          vi: "Lô hàng đến sớm hai ngày.",
        }
          }
        ],
        freq: 3
      },
      {
        id: "v4-2",
        word: "inventory",
        level: "Cơ bản",
        definitions: [
          {
            pos: "n.",
            meaning: "hàng tồn kho",
            example: {
          en: "Inventory levels are currently very low.",
          vi: "Mức tồn kho hiện đang rất thấp.",
        }
          }
        ],
        freq: 3
      },
      {
        id: "v4-3",
        word: "dispatch",
        level: "Trung bình",
        definitions: [
          {
            pos: "v.",
            meaning: "gửi đi, điều phối",
            example: {
          en: "Orders are dispatched within 24 hours.",
          vi: "Đơn hàng được gửi đi trong vòng 24 giờ.",
        }
          }
        ],
        freq: 2
      },
      {
        id: "v4-4",
        word: "warehouse",
        level: "Cơ bản",
        definitions: [
          {
            pos: "n.",
            meaning: "kho hàng",
            example: {
          en: "The warehouse stores over 10,000 items.",
          vi: "Kho hàng lưu trữ hơn 10.000 mặt hàng.",
        }
          }
        ],
        freq: 3
      },
      {
        id: "v4-5",
        word: "freight",
        level: "Trung bình",
        definitions: [
          {
            pos: "n.",
            meaning: "hàng hóa vận chuyển",
            example: {
          en: "Freight costs have increased this year.",
          vi: "Chi phí vận chuyển đã tăng năm nay.",
        }
          }
        ],
        freq: 2
      },
      {
        id: "v4-6",
        word: "cargo",
        level: "Trung bình",
        definitions: [
          {
            pos: "n.",
            meaning: "hàng hóa",
            example: {
          en: "The cargo ship arrived at port.",
          vi: "Tàu hàng đã cập cảng.",
        }
          }
        ],
        freq: 2
      },
      {
        id: "v4-7",
        word: "consignment",
        level: "Trung bình",
        definitions: [
          {
            pos: "n.",
            meaning: "lô hàng gửi",
            example: {
          en: "The consignment was damaged in transit.",
          vi: "Lô hàng bị hỏng trong quá trình vận chuyển.",
        }
          }
        ],
        freq: 2
      },
      {
        id: "v4-8",
        word: "customs",
        level: "Cơ bản",
        definitions: [
          {
            pos: "n.",
            meaning: "hải quan",
            example: {
          en: "The goods are currently held at customs.",
          vi: "Hàng hóa hiện đang bị giữ tại hải quan.",
        }
          }
        ],
        freq: 3
      },
      {
        id: "v4-9",
        word: "delivery",
        level: "Cơ bản",
        definitions: [
          {
            pos: "n.",
            meaning: "giao hàng",
            example: {
          en: "Delivery is expected within 5 business days.",
          vi: "Dự kiến giao hàng trong vòng 5 ngày làm việc.",
        }
          }
        ],
        freq: 3
      },
      {
        id: "v4-10",
        word: "tracking",
        level: "Cơ bản",
        definitions: [
          {
            pos: "n.",
            meaning: "theo dõi",
            example: {
          en: "Use the tracking number to follow your order.",
          vi: "Sử dụng số theo dõi để theo dõi đơn hàng.",
        }
          }
        ],
        freq: 3
      },
    ],
  },
  {
    id: 5,
    emoji: "👥",
    title: "Human Resources",
    titleVI: "Nhân sự",
    count: 40,
    level: "Trung bình",
    isPremiumPreview: true,
    words: [
      {
        id: "v5-1",
        word: "recruit",
        level: "Cơ bản",
        definitions: [
          {
            pos: "v.",
            meaning: "tuyển dụng",
            example: {
          en: "We are recruiting for several positions.",
          vi: "Chúng tôi đang tuyển dụng cho nhiều vị trí.",
        }
          }
        ],
        freq: 3
      },
      {
        id: "v5-2",
        word: "candidate",
        level: "Cơ bản",
        definitions: [
          {
            pos: "n.",
            meaning: "ứng viên",
            example: {
          en: "The candidate impressed us during the interview.",
          vi: "Ứng viên đã gây ấn tượng với chúng tôi trong buổi phỏng vấn.",
        }
          }
        ],
        freq: 3
      },
      {
        id: "v5-3",
        word: "vacancy",
        level: "Cơ bản",
        definitions: [
          {
            pos: "n.",
            meaning: "vị trí còn trống",
            example: {
          en: "There is a vacancy in the marketing department.",
          vi: "Có một vị trí còn trống trong bộ phận marketing.",
        }
          }
        ],
        freq: 3
      },
      {
        id: "v5-4",
        word: "onboard",
        level: "Trung bình",
        definitions: [
          {
            pos: "v.",
            meaning: "tiếp nhận nhân viên mới",
            example: {
          en: "We will onboard three new employees next week.",
          vi: "Chúng ta sẽ tiếp nhận ba nhân viên mới tuần tới.",
        }
          }
        ],
        freq: 2
      },
      {
        id: "v5-5",
        word: "performance",
        level: "Cơ bản",
        definitions: [
          {
            pos: "n.",
            meaning: "hiệu suất, thành tích",
            example: {
          en: "Employee performance is reviewed annually.",
          vi: "Hiệu suất nhân viên được xem xét hàng năm.",
        }
          }
        ],
        freq: 3
      },
      {
        id: "v5-6",
        word: "appraisal",
        level: "Trung bình",
        definitions: [
          {
            pos: "n.",
            meaning: "đánh giá",
            example: {
          en: "Your appraisal meeting is scheduled for next Friday.",
          vi: "Cuộc họp đánh giá của bạn được lên lịch vào thứ Sáu tới.",
        }
          }
        ],
        freq: 2
      },
      {
        id: "v5-7",
        word: "resignation",
        level: "Trung bình",
        definitions: [
          {
            pos: "n.",
            meaning: "từ chức, thôi việc",
            example: {
          en: "She submitted her resignation letter yesterday.",
          vi: "Cô ấy đã nộp đơn từ chức hôm qua.",
        }
          }
        ],
        freq: 2
      },
      {
        id: "v5-8",
        word: "benefits",
        level: "Cơ bản",
        definitions: [
          {
            pos: "n.",
            meaning: "phúc lợi",
            example: {
          en: "The company offers competitive benefits.",
          vi: "Công ty cung cấp phúc lợi cạnh tranh.",
        }
          }
        ],
        freq: 3
      },
      {
        id: "v5-9",
        word: "payroll",
        level: "Trung bình",
        definitions: [
          {
            pos: "n.",
            meaning: "bảng lương",
            example: {
          en: "Payroll is processed on the last working day.",
          vi: "Bảng lương được xử lý vào ngày làm việc cuối cùng.",
        }
          }
        ],
        freq: 2
      },
      {
        id: "v5-10",
        word: "reference",
        level: "Cơ bản",
        definitions: [
          {
            pos: "n.",
            meaning: "người/thư giới thiệu",
            example: {
          en: "Please provide two professional references.",
          vi: "Vui lòng cung cấp hai người giới thiệu chuyên nghiệp.",
        }
          }
        ],
        freq: 3
      },
    ],
  },
  {
    id: 6,
    emoji: "🏨",
    title: "Travel & Transportation",
    titleVI: "Du lịch & Vận tải",
    count: 20,
    level: "Nâng cao",
    isPremiumPreview: true,
    words: [
      {
        id: "v6-1",
        word: "reservation",
        level: "Cơ bản",
        definitions: [
          {
            pos: "n.",
            meaning: "đặt chỗ, đặt phòng",
            example: {
          en: "I would like to make a reservation for two.",
          vi: "Tôi muốn đặt chỗ cho hai người.",
        }
          }
        ],
        freq: 3
      },
      {
        id: "v6-2",
        word: "itinerary",
        level: "Cơ bản",
        definitions: [
          {
            pos: "n.",
            meaning: "lịch trình chuyến đi",
            example: {
          en: "Please send the final itinerary by email.",
          vi: "Vui lòng gửi lịch trình cuối cùng qua email.",
        }
          }
        ],
        freq: 3
      },
      {
        id: "v6-3",
        word: "accommodation",
        level: "Cơ bản",
        definitions: [
          {
            pos: "n.",
            meaning: "chỗ ở",
            example: {
          en: "Accommodation is included in the package.",
          vi: "Chỗ ở đã được bao gồm trong gói.",
        }
          }
        ],
        freq: 3
      },
      {
        id: "v6-4",
        word: "check-in",
        level: "Cơ bản",
        definitions: [
          {
            pos: "n./v.",
            meaning: "làm thủ tục",
            example: {
          en: "Check-in time is 3 PM.",
          vi: "Giờ làm thủ tục là 3 giờ chiều.",
        }
          }
        ],
        freq: 3
      },
      {
        id: "v6-5",
        word: "departure",
        level: "Cơ bản",
        definitions: [
          {
            pos: "n.",
            meaning: "khởi hành, xuất phát",
            example: {
          en: "The departure gate is B12.",
          vi: "Cổng khởi hành là B12.",
        }
          }
        ],
        freq: 3
      },
      {
        id: "v6-6",
        word: "arrival",
        level: "Cơ bản",
        definitions: [
          {
            pos: "n.",
            meaning: "đến nơi, đáp",
            example: {
          en: "The arrival time is 6:30 PM.",
          vi: "Giờ đến nơi là 6:30 chiều.",
        }
          }
        ],
        freq: 3
      },
      {
        id: "v6-7",
        word: "transit",
        level: "Trung bình",
        definitions: [
          {
            pos: "n.",
            meaning: "trung chuyển",
            example: {
          en: "Passengers in transit must go to Gate C.",
          vi: "Hành khách trung chuyển phải đến Cổng C.",
        }
          }
        ],
        freq: 2
      },
      {
        id: "v6-8",
        word: "baggage",
        level: "Cơ bản",
        definitions: [
          {
            pos: "n.",
            meaning: "hành lý",
            example: {
          en: "Baggage allowance is 23 kg per person.",
          vi: "Hành lý cho phép là 23 kg mỗi người.",
        }
          }
        ],
        freq: 3
      },
      {
        id: "v6-9",
        word: "confirmation",
        level: "Cơ bản",
        definitions: [
          {
            pos: "n.",
            meaning: "xác nhận",
            example: {
          en: "You will receive a booking confirmation by email.",
          vi: "Bạn sẽ nhận được xác nhận đặt phòng qua email.",
        }
          }
        ],
        freq: 3
      },
      {
        id: "v6-10",
        word: "hospitality",
        level: "Trung bình",
        definitions: [
          {
            pos: "n.",
            meaning: "lòng hiếu khách, dịch vụ",
            example: {
          en: "The hotel is known for its excellent hospitality.",
          vi: "Khách sạn nổi tiếng với dịch vụ xuất sắc.",
        }
          }
        ],
        freq: 2
      },
    ],
  },
  {
    id: 7,
    emoji: "🏥",
    title: "Healthcare",
    titleVI: "Y tế & Sức khỏe",
    count: 25,
    level: "Nâng cao",
    isPremiumPreview: true,
    words: [
      {
        id: "v7-1",
        word: "appointment",
        level: "Cơ bản",
        definitions: [
          {
            pos: "n.",
            meaning: "cuộc hẹn, lịch khám",
            example: {
          en: "I have a doctor's appointment on Wednesday.",
          vi: "Tôi có lịch khám bác sĩ vào thứ Tư.",
        }
          }
        ],
        freq: 3
      },
      {
        id: "v7-2",
        word: "prescription",
        level: "Cơ bản",
        definitions: [
          {
            pos: "n.",
            meaning: "đơn thuốc",
            example: {
          en: "The doctor issued a prescription for antibiotics.",
          vi: "Bác sĩ đã kê đơn thuốc kháng sinh.",
        }
          }
        ],
        freq: 3
      },
      {
        id: "v7-3",
        word: "insurance",
        level: "Cơ bản",
        definitions: [
          {
            pos: "n.",
            meaning: "bảo hiểm",
            example: {
          en: "Does your insurance cover dental care?",
          vi: "Bảo hiểm của bạn có bao gồm chăm sóc răng miệng không?",
        }
          }
        ],
        freq: 3
      },
      {
        id: "v7-4",
        word: "diagnosis",
        level: "Trung bình",
        definitions: [
          {
            pos: "n.",
            meaning: "chẩn đoán",
            example: {
          en: "The test results confirmed the diagnosis.",
          vi: "Kết quả xét nghiệm xác nhận chẩn đoán.",
        }
          }
        ],
        freq: 2
      },
      {
        id: "v7-5",
        word: "treatment",
        level: "Cơ bản",
        definitions: [
          {
            pos: "n.",
            meaning: "điều trị",
            example: {
          en: "The treatment plan was discussed with the patient.",
          vi: "Kế hoạch điều trị đã được thảo luận với bệnh nhân.",
        }
          }
        ],
        freq: 3
      },
      {
        id: "v7-6",
        word: "referral",
        level: "Trung bình",
        definitions: [
          {
            pos: "n.",
            meaning: "giới thiệu đến bác sĩ/chuyên gia",
            example: {
          en: "Your GP will provide a referral to a specialist.",
          vi: "Bác sĩ gia đình sẽ giới thiệu bạn đến chuyên gia.",
        }
          }
        ],
        freq: 2
      },
      {
        id: "v7-7",
        word: "clinic",
        level: "Cơ bản",
        definitions: [
          {
            pos: "n.",
            meaning: "phòng khám",
            example: {
          en: "The clinic opens at 8 AM on weekdays.",
          vi: "Phòng khám mở cửa lúc 8h sáng vào các ngày trong tuần.",
        }
          }
        ],
        freq: 3
      },
      {
        id: "v7-8",
        word: "symptom",
        level: "Trung bình",
        definitions: [
          {
            pos: "n.",
            meaning: "triệu chứng",
            example: {
          en: "Report any unusual symptoms to your doctor.",
          vi: "Báo cáo bất kỳ triệu chứng bất thường nào cho bác sĩ.",
        }
          }
        ],
        freq: 2
      },
      {
        id: "v7-9",
        word: "physician",
        level: "Trung bình",
        definitions: [
          {
            pos: "n.",
            meaning: "bác sĩ",
            example: {
          en: "Consult your physician before starting any new medication.",
          vi: "Tham khảo bác sĩ trước khi bắt đầu bất kỳ loại thuốc mới nào.",
        }
          }
        ],
        freq: 2
      },
      {
        id: "v7-10",
        word: "coverage",
        level: "Cơ bản",
        definitions: [
          {
            pos: "n.",
            meaning: "phạm vi bảo hiểm",
            example: {
          en: "Check your coverage before visiting a specialist.",
          vi: "Kiểm tra phạm vi bảo hiểm trước khi gặp chuyên gia.",
        }
          }
        ],
        freq: 3
      },
    ],
  },
  {
    id: 8,
    emoji: "💻",
    title: "Technology & Equipment",
    titleVI: "Công nghệ & Thiết bị",
    count: 30,
    level: "Nâng cao",
    isPremiumPreview: true,
    words: [
      {
        id: "v8-1",
        word: "software",
        level: "Cơ bản",
        definitions: [
          {
            pos: "n.",
            meaning: "phần mềm",
            example: {
          en: "The software update will be released tomorrow.",
          vi: "Bản cập nhật phần mềm sẽ được phát hành vào ngày mai.",
        }
          }
        ],
        freq: 3
      },
      {
        id: "v8-2",
        word: "upgrade",
        level: "Cơ bản",
        definitions: [
          {
            pos: "v./n.",
            meaning: "nâng cấp",
            example: {
          en: "We need to upgrade our database system.",
          vi: "Chúng ta cần nâng cấp hệ thống cơ sở dữ liệu.",
        }
          }
        ],
        freq: 3
      },
      {
        id: "v8-3",
        word: "maintenance",
        level: "Cơ bản",
        definitions: [
          {
            pos: "n.",
            meaning: "bảo trì",
            example: {
          en: "Scheduled maintenance will occur on Sunday.",
          vi: "Bảo trì theo lịch sẽ diễn ra vào Chủ nhật.",
        }
          }
        ],
        freq: 3
      },
      {
        id: "v8-4",
        word: "network",
        level: "Cơ bản",
        definitions: [
          {
            pos: "n.",
            meaning: "mạng lưới",
            example: {
          en: "The network will be unavailable during maintenance.",
          vi: "Mạng sẽ không khả dụng trong quá trình bảo trì.",
        }
          }
        ],
        freq: 3
      },
      {
        id: "v8-5",
        word: "security",
        level: "Cơ bản",
        definitions: [
          {
            pos: "n.",
            meaning: "bảo mật",
            example: {
          en: "Data security is a top priority.",
          vi: "Bảo mật dữ liệu là ưu tiên hàng đầu.",
        }
          }
        ],
        freq: 3
      },
      {
        id: "v8-6",
        word: "database",
        level: "Cơ bản",
        definitions: [
          {
            pos: "n.",
            meaning: "cơ sở dữ liệu",
            example: {
          en: "The database stores all customer information.",
          vi: "Cơ sở dữ liệu lưu trữ tất cả thông tin khách hàng.",
        }
          }
        ],
        freq: 3
      },
      {
        id: "v8-7",
        word: "server",
        level: "Trung bình",
        definitions: [
          {
            pos: "n.",
            meaning: "máy chủ",
            example: {
          en: "The server will be restarted at midnight.",
          vi: "Máy chủ sẽ được khởi động lại vào lúc nửa đêm.",
        }
          }
        ],
        freq: 2
      },
      {
        id: "v8-8",
        word: "interface",
        level: "Trung bình",
        definitions: [
          {
            pos: "n.",
            meaning: "giao diện",
            example: {
          en: "The user interface has been redesigned.",
          vi: "Giao diện người dùng đã được thiết kế lại.",
        }
          }
        ],
        freq: 2
      },
      {
        id: "v8-9",
        word: "backup",
        level: "Cơ bản",
        definitions: [
          {
            pos: "n./v.",
            meaning: "sao lưu",
            example: {
          en: "Always back up your files before updating.",
          vi: "Luôn sao lưu các tập tin của bạn trước khi cập nhật.",
        }
          }
        ],
        freq: 3
      },
      {
        id: "v8-10",
        word: "installation",
        level: "Trung bình",
        definitions: [
          {
            pos: "n.",
            meaning: "cài đặt",
            example: {
          en: "The installation process takes about 10 minutes.",
          vi: "Quá trình cài đặt mất khoảng 10 phút.",
        }
          }
        ],
        freq: 2
      },
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// LOCAL STORAGE
// ─────────────────────────────────────────────────────────────────────────────
const KNOWN_WORDS_KEY_PREFIX = "edvision.toeic.foundation.known";

function resolveLocalAccountId(): string | null {
  try {
    const raw = localStorage.getItem('user');
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { account_id?: number; accountId?: number; id?: number };
    const id = parsed.account_id ?? parsed.accountId ?? parsed.id;
    if (!id) return null;
    return String(id);
  } catch {
    return null;
  }
}

function getKnownWordsKey() {
  const accountId = resolveLocalAccountId();
  if (accountId) return `${KNOWN_WORDS_KEY_PREFIX}:${accountId}`;
  return `${KNOWN_WORDS_KEY_PREFIX}:anonymous`;
}

function loadKnownWords(): Set<string> {
  try {
    const raw = localStorage.getItem(getKnownWordsKey());
    if (!raw) return new Set();
    return new Set(JSON.parse(raw) as string[]);
  } catch {
    return new Set();
  }
}

function saveKnownWords(words: Set<string>) {
  localStorage.setItem(getKnownWordsKey(), JSON.stringify(Array.from(words)));
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPER COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────
function FreqStars({ freq }: { freq: 1 | 2 | 3 }) {
  const labels: Record<number, string> = {
    1: "Thỉnh thoảng",
    2: "Hay ra",
    3: "Rất hay ra",
  };
  const colors: Record<number, string> = {
    1: "text-slate-400 bg-slate-50 border-slate-200",
    2: "text-amber-500 bg-amber-50 border-amber-200",
    3: "text-orange-500 bg-orange-50 border-orange-200",
  };
  return (
    <span
      className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full border ${colors[freq]}`}
    >
      {Array.from({ length: freq }).map((_, i) => (
        <Star key={i} size={10} className="fill-current" />
      ))}
      <span>{labels[freq]}</span>
    </span>
  );
}

function DifficultyBadge({
  difficulty,
  color,
}: {
  difficulty: string;
  color: string;
}) {
  const colorMap: Record<string, string> = {
    emerald: "bg-emerald-100 text-emerald-700 border-emerald-200",
    green: "bg-green-100 text-green-700 border-green-200",
    yellow: "bg-yellow-100 text-yellow-700 border-yellow-200",
    orange: "bg-orange-100 text-orange-700 border-orange-200",
    red: "bg-red-100 text-red-700 border-red-200",
  };
  return (
    <span
      className={`inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-full border ${colorMap[color] ?? colorMap["emerald"]}`}
    >
      {difficulty}
    </span>
  );
}

function PosBadge({ pos }: { pos: string }) {
  const colorMap: Record<string, string> = {
    "n.": "bg-blue-100 text-blue-700",
    "v.": "bg-violet-100 text-[#8B6346]",
    "adj.": "bg-teal-100 text-teal-700",
    "adv.": "bg-amber-100 text-amber-700",
    "prep.": "bg-pink-100 text-pink-700",
    "n./v.": "bg-indigo-100 text-indigo-700",
    "v./n.": "bg-indigo-100 text-indigo-700",
    "adj./adv.": "bg-cyan-100 text-cyan-700",
  };
  return (
    <span
      className={`inline-block text-xs font-bold px-2 py-0.5 rounded ${colorMap[pos] ?? "bg-slate-100 text-slate-600"}`}
    >
      {pos}
    </span>
  );
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function highlightExampleText(
  example: string | null | undefined,
  word: string,
): string | null | undefined {
  if (!example || !word) return example;
  if (example.includes('data-vocab-highlight')) return example;

  const trimmedWord = word.trim();
  if (!trimmedWord) return example;

  const escapedWord = escapeRegExp(trimmedWord);
  const pattern = new RegExp(`(^|[^\\w])(${escapedWord})(?=[^\\w]|$)`, 'gi');
  if (!pattern.test(example)) return example;

  return example.replace(
    pattern,
    (_match, lead, term) =>
      `${lead}<span data-vocab-highlight="1" class="underline decoration-amber-500/70 font-semibold">${term}</span>`,
  );
}

function resolveWordDefinitions(word: VocabWord): VocabWordDefinition[] {
  if (word.definitions && word.definitions.length > 0) {
    return word.definitions.map((def) => {
      if (!def.example?.en) return def;
      return {
        ...def,
        example: {
          ...def.example,
          en: highlightExampleText(def.example.en, word.word) ?? def.example.en,
        },
      };
    });
  }
  if (word.meaning && word.pos && word.example) {
    return [
      {
        pos: word.pos,
        meaning: word.meaning,
        example: {
          ...word.example,
          en: highlightExampleText(word.example.en, word.word) ?? word.example.en,
        },
      },
    ];
  }
  return [];
}

function resolveLevelLabel(value?: string): string | undefined {
  if (!value) return value;
  const normalized = value.trim().toLowerCase();
  if (normalized === 'basic') return 'Cơ bản';
  if (normalized === 'intermediate') return 'Trung bình';
  if (normalized === 'advanced') return 'Nâng cao';
  return value;
}

function normalizeMeaningText(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function isMeaningCorrect(input: string, definitions: VocabWordDefinition[]): boolean {
  const cleaned = normalizeMeaningText(input);
  if (!cleaned) return false;
  return definitions.some((def) => {
    const meaning = normalizeMeaningText(def.meaning);
    if (!meaning) return false;
    return meaning.includes(cleaned) || cleaned.includes(meaning);
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// GRAMMAR QUIZ COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
function GrammarQuiz({
  quiz,
  answers,
  onAnswer,
}: {
  quiz: QuizQuestion[];
  answers: Record<string, string>;
  onAnswer: (questionId: string, key: string) => void;
}) {
  return (
    <div className="space-y-4 mt-4">
      <h4 className="text-sm font-bold text-[#8B6346] flex items-center gap-1.5">
        <Target size={14} />
        Mini Quiz — Kiểm tra nhanh
      </h4>
      {quiz.map((q, qi) => {
        const selected = answers[q.id];
        const isAnswered = !!selected;
        return (
          <div
            key={q.id}
            className="bg-[#FCFAF8] border border-[#E8DCCF] rounded-xl p-4"
          >
            <p className="text-sm font-semibold text-slate-800 mb-3">
              <span className="text-[#B88B67] font-bold mr-2">{qi + 1}.</span>
              {q.sentence}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {q.options.map((opt) => {
                let btnCls =
                  "text-left text-sm px-3 py-2 rounded-lg border font-medium transition-all duration-200 ";
                if (!isAnswered) {
                  btnCls +=
                    "border-slate-200 bg-white hover:border-[#A67B5B] hover:bg-[#FCFAF8] text-slate-700 cursor-pointer";
                } else if (opt.key === q.correct) {
                  btnCls += "border-emerald-400 bg-emerald-50 text-emerald-700";
                } else if (opt.key === selected) {
                  btnCls += "border-red-400 bg-red-50 text-red-700";
                } else {
                  btnCls +=
                    "border-slate-100 bg-slate-50 text-slate-400 cursor-default";
                }
                return (
                  <button
                    key={opt.key}
                    disabled={isAnswered}
                    className={btnCls}
                    onClick={() => onAnswer(q.id, opt.key)}
                  >
                    <span className="font-bold mr-2 opacity-60">
                      {opt.key})
                    </span>
                    {opt.text}
                    {isAnswered && opt.key === q.correct && (
                      <CheckCircle2
                        size={14}
                        className="inline ml-1 text-emerald-500"
                      />
                    )}
                  </button>
                );
              })}
            </div>
            {isAnswered && (
              <div className="mt-3 p-3 bg-white border border-[#E8DCCF] rounded-lg flex items-start gap-2">
                <Lightbulb
                  size={14}
                  className="text-amber-500 mt-0.5 shrink-0"
                />
                <p className="text-xs text-slate-600 leading-relaxed">
                  <span className="font-bold text-[#8B6346]">
                    Giải thích:{" "}
                  </span>
                  {q.explanation}
                </p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// WORD CARD COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
function WordCard({
  word,
  isKnown,
  onToggleKnown,
  audioSettings,
  knownLabel,
}: {
  word: VocabWord;
  isKnown: boolean;
  onToggleKnown: (id: string) => void;
  audioSettings: { volume: number; rate: number };
  knownLabel?: string;
}) {
  const definitions = resolveWordDefinitions(word);
  const knownText = knownLabel ?? "Đã biết";

  const handlePlayAudio = (e: React.MouseEvent) => {
    e.stopPropagation();
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(word.word);
      utterance.lang = 'en-US';
      utterance.volume = audioSettings.volume;
      utterance.rate = audioSettings.rate;
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <div
      className={`bg-white rounded-2xl border shadow-sm p-4 transition-all duration-200 ${
        isKnown
          ? "border-teal-200 bg-teal-50/30"
          : "border-slate-100 hover:border-teal-200 hover:shadow-md"
      }`}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={`text-lg font-bold ${isKnown ? "text-teal-700" : "text-slate-800"}`}
            >
              {word.word}
            </span>
            <button 
              onClick={handlePlayAudio}
              className="text-slate-400 hover:text-teal-500 transition-colors p-1 rounded-full hover:bg-slate-100"
              title="Nghe phát âm"
            >
              <Volume2 size={16} />
            </button>
          </div>
        </div>
        <button
          onClick={() => onToggleKnown(word.id)}
          className={`shrink-0 flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-full border transition-all ${
            isKnown
              ? "bg-teal-500 text-white border-teal-500 hover:bg-teal-600"
              : "bg-white text-slate-500 border-slate-200 hover:border-teal-400 hover:text-teal-600"
          }`}
        >
          <CheckCircle2 size={12} />
          {isKnown ? knownText : "Đánh dấu"}
        </button>
      </div>

      <div className="space-y-4 mt-4">
        {definitions.map((def, idx) => (
          <div key={idx} className="space-y-2">
            <div className="flex items-start gap-2">
              <PosBadge pos={def.pos} />
              <p className="text-sm font-medium text-slate-600">{def.meaning}</p>
            </div>
            <div className="bg-[#FDFBF7] rounded-xl p-3 border border-[#E8DCCF] space-y-1">
              <p
                className="text-sm text-slate-700 leading-relaxed"
                dangerouslySetInnerHTML={{ __html: def.example.en }}
              />
              <p className="text-xs text-slate-500 italic leading-relaxed">
                {def.example.vi}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// FLASHCARD STUDY COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
function FlashcardStudy({
  topic,
  knownWords,
  onToggleKnown,
  onClose,
  audioSettings,
}: {
  topic: VocabTopic;
  knownWords: Set<string>;
  onToggleKnown: (id: string) => void;
  onClose: () => void;
  audioSettings: { volume: number; rate: number };
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  const words = topic.words;
  if (words.length === 0) return null;

  const currentWord = words[currentIndex];
  const isKnown = knownWords.has(currentWord.id);
  const definitions = resolveWordDefinitions(currentWord);

  const handlePlayAudio = (e: React.MouseEvent) => {
    e.stopPropagation();
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(currentWord.word);
      utterance.lang = 'en-US';
      utterance.volume = audioSettings.volume;
      utterance.rate = audioSettings.rate;
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleNext = () => {
    setIsFlipped(false);
    if (currentIndex < words.length - 1) {
      setCurrentIndex((curr) => curr + 1);
    } else {
      onClose(); // End of list
    }
  };

  const handleMarkKnown = () => {
    if (!isKnown) onToggleKnown(currentWord.id);
    handleNext();
  };

  const handleMarkUnknown = () => {
    if (isKnown) onToggleKnown(currentWord.id);
    handleNext();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/35 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-50 w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl flex flex-col animate-in fade-in zoom-in duration-200">
        <div className="p-4 flex justify-between items-center bg-white border-b border-slate-100">
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors"
            >
              <ChevronLeft size={20} />
            </button>
            <span className="font-bold text-slate-700">{topic.titleVI}</span>
          </div>
          <span className="text-sm font-semibold text-slate-500">
            {currentIndex + 1} / {words.length}
          </span>
        </div>

        <div className="flex-1 p-6 flex flex-col items-center justify-center min-h-[400px]">
          <div
            className="w-full h-full min-h-[300px] bg-white rounded-2xl shadow-sm border border-slate-200 cursor-pointer flex flex-col items-center justify-center p-8 transition-all duration-300 hover:shadow-md hover:border-teal-200"
            onClick={() => setIsFlipped(!isFlipped)}
          >
            {!isFlipped ? (
              <div className="text-center animate-in fade-in zoom-in duration-200">
                <div className="flex items-center justify-center gap-3 mb-4">
                  <span className="text-4xl font-black text-slate-800 block">
                    {currentWord.word}
                  </span>
                  <button 
                    onClick={handlePlayAudio}
                    className="text-slate-400 hover:text-teal-500 transition-colors p-2 rounded-full hover:bg-slate-100"
                    title="Nghe phát âm"
                  >
                    <Volume2 size={24} />
                  </button>
                </div>
                <p className="text-sm text-slate-400 font-medium">
                  (Nhấn để lật thẻ)
                </p>
              </div>
            ) : (
              <div className="text-center animate-in fade-in zoom-in duration-200 w-full">
                <div className="space-y-4 w-full mt-4 max-h-[250px] overflow-y-auto custom-scrollbar pr-2">
                  {definitions.length === 0 ? (
                    <div className="text-sm text-slate-500 text-center">Chưa có định nghĩa.</div>
                  ) : definitions.map((def, idx) => (
                    <div key={idx} className="bg-white text-left p-4 rounded-xl border border-slate-100 shadow-sm">
                      <div className="flex items-start gap-2 mb-2">
                        <PosBadge pos={def.pos} />
                        <p className="text-lg font-bold text-teal-600">{def.meaning}</p>
                      </div>
                      <div className="bg-[#FDFBF7] p-3 rounded-lg border border-[#E8DCCF]">
                        <p
                          className="text-sm text-slate-700 font-medium mb-1 leading-relaxed"
                          dangerouslySetInnerHTML={{ __html: def.example.en }}
                        />
                        <p className="text-xs text-slate-500 italic leading-relaxed">
                          {def.example.vi}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="p-4 bg-white border-t border-slate-100 grid grid-cols-2 gap-3">
          <button
            onClick={handleMarkUnknown}
            className="py-3 rounded-xl font-bold text-red-600 bg-red-50 hover:bg-red-100 transition-colors"
          >
            Chưa thuộc
          </button>
          <button
            onClick={handleMarkKnown}
            className="py-3 rounded-xl font-bold text-teal-600 bg-teal-50 hover:bg-teal-100 transition-colors"
          >
            Đã thuộc
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// WRITE MEANING STUDY COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
function WriteMeaningStudy({
  title,
  words,
  onClose,
  audioSettings,
}: {
  title: string;
  words: VocabWord[];
  onClose: () => void;
  audioSettings: { volume: number; rate: number };
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userInput, setUserInput] = useState('');
  const [isChecked, setIsChecked] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  if (words.length === 0) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-900/35 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl p-6 text-center">
          <p className="text-sm text-slate-600">Không có từ vựng để luyện.</p>
          <button
            onClick={onClose}
            className="mt-4 px-4 py-2 rounded-xl text-sm font-semibold bg-slate-900 text-white"
          >
            Đóng
          </button>
        </div>
      </div>
    );
  }

  const currentWord = words[currentIndex];
  const definitions = resolveWordDefinitions(currentWord);
  const expectedText = definitions.map((d) => d.meaning).join(' • ');

  const handlePlayAudio = (e: React.MouseEvent) => {
    e.stopPropagation();
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(currentWord.word);
      utterance.lang = 'en-US';
      utterance.volume = audioSettings.volume;
      utterance.rate = audioSettings.rate;
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleCheck = () => {
    if (isChecked) return;
    const correct = definitions.length > 0
      ? isMeaningCorrect(userInput, definitions)
      : false;
    setIsCorrect(correct);
    setIsChecked(true);
  };

  const handleNext = () => {
    if (currentIndex >= words.length - 1) {
      onClose();
      return;
    }
    setCurrentIndex((prev) => prev + 1);
    setUserInput('');
    setIsChecked(false);
    setIsCorrect(null);
  };

  const handleRetry = () => {
    setIsChecked(false);
    setIsCorrect(null);
  };

  useEffect(() => {
    inputRef.current?.focus();
  }, [currentIndex]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.isComposing) return;
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== 'Enter' || event.shiftKey) return;

      if (isChecked) {
        event.preventDefault();
        handleNext();
        return;
      }

      if (userInput.trim().length === 0) return;
      event.preventDefault();
      handleCheck();
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isChecked, onClose, userInput]);

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/35 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-50 w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl flex flex-col animate-in fade-in zoom-in duration-200">
        <div className="p-4 flex justify-between items-center bg-white border-b border-slate-100">
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors"
            >
              <X size={18} />
            </button>
            <span className="font-bold text-slate-700">{title}</span>
          </div>
          <span className="text-sm font-semibold text-slate-500">
            {currentIndex + 1} / {words.length}
          </span>
        </div>

        <div className="flex-1 p-6 flex flex-col gap-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="text-2xl font-black text-slate-800">{currentWord.word}</span>
                <button
                  onClick={handlePlayAudio}
                  className="text-slate-400 hover:text-teal-500 transition-colors p-2 rounded-full hover:bg-slate-100"
                  title="Nghe phát âm"
                >
                  <Volume2 size={18} />
                </button>
              </div>
            </div>

            <label className="text-xs font-semibold text-slate-500">Viết lại nghĩa</label>
            <textarea
              ref={inputRef}
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              placeholder="Nhập nghĩa tiếng Việt của từ này..."
              className="mt-2 w-full min-h-[90px] rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100"
              disabled={isChecked}
            />

            {isChecked && (
              <div className={`mt-4 rounded-xl border px-4 py-3 text-sm font-semibold ${
                isCorrect
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                  : 'bg-amber-50 border-amber-200 text-amber-700'
              }`}>
                {isCorrect ? '✅ Đúng rồi!' : '⚠️ Chưa chính xác.'}
                {expectedText && (
                  <div className="mt-2 text-xs font-medium text-slate-600">
                    Đáp án gợi ý: <span className="font-semibold">{expectedText}</span>
                  </div>
                )}
                {!expectedText && (
                  <div className="mt-2 text-xs font-medium text-slate-500">
                    Chưa có định nghĩa để đối chiếu.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="p-4 bg-white border-t border-slate-100 flex items-center gap-3">
          {!isChecked ? (
            <button
              onClick={handleCheck}
              disabled={userInput.trim().length === 0}
              className="flex-1 py-3 rounded-xl font-bold text-white bg-slate-900 hover:bg-slate-800 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              Kiểm tra
            </button>
          ) : (
            <>
              <button
                onClick={handleRetry}
                className="flex-1 py-3 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
              >
                Làm lại
              </button>
              <button
                onClick={handleNext}
                className="flex-1 py-3 rounded-xl font-bold text-teal-700 bg-teal-50 hover:bg-teal-100 transition-colors"
              >
                Tiếp theo
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// VOCAB WORD LIST VIEW (sub-component to avoid null issues)
// ─────────────────────────────────────────────────────────────────────────────
function VocabWordList({
  topic,
  knownWords,
  onToggleKnown,
  onBack,
  onMarkAll,
}: {
  topic: VocabTopic;
  knownWords: Set<string>;
  onToggleKnown: (id: string) => void;
  onBack: () => void;
  onMarkAll: (topicWords: VocabWord[], markAll: boolean) => void;
}) {
  const [isFlashcardOpen, setIsFlashcardOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [audioSettings, setAudioSettings] = useState({ volume: 1, rate: 1 });
  const [showAudioSettings, setShowAudioSettings] = useState(false);
  const itemsPerPage = 10;

  const knownCount = topic.words.filter((w) => knownWords.has(w.id)).length;
  const progress = Math.round((knownCount / topic.words.length) * 100);
  const allKnown = topic.words.every((w) => knownWords.has(w.id));
  const totalPages = Math.ceil(topic.words.length / itemsPerPage);
  const currentWords = topic.words.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="space-y-4">
      {isFlashcardOpen && (
        <FlashcardStudy
          topic={topic}
          knownWords={knownWords}
          onToggleKnown={onToggleKnown}
          onClose={() => setIsFlashcardOpen(false)}
          audioSettings={audioSettings}
        />
      )}
      {/* Back + header */}
      <div className="flex items-start gap-3">
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-sm text-teal-600 hover:text-teal-700 font-semibold bg-white border border-teal-200 hover:border-teal-300 px-3 py-2 rounded-xl transition-all shrink-0"
        >
          <ChevronLeft size={16} />
          Chủ đề
        </button>
        <div className="flex-1">
          <h2 className="text-lg font-bold text-slate-800">
            {topic.emoji} {topic.titleVI}
          </h2>
          <p className="text-sm text-slate-500">{topic.title}</p>
        </div>
        <div className="shrink-0 flex items-center gap-3 relative">
          {/* Audio Settings button */}
          <div className="relative">
            <button
              onClick={() => setShowAudioSettings(!showAudioSettings)}
              className="p-2 text-slate-500 hover:bg-slate-100 hover:text-teal-600 rounded-xl transition-colors border border-transparent hover:border-slate-200 bg-white"
              title="Cài đặt phát âm"
            >
              <Settings2 size={20} />
            </button>
            {showAudioSettings && (
              <div className="absolute top-full right-0 mt-2 w-64 bg-white border border-[#E8DCCF] shadow-xl rounded-2xl p-4 z-50">
                <h3 className="text-sm font-bold text-slate-700 mb-4 border-b border-slate-100 pb-2">Cài đặt Phát âm</h3>
                <div className="space-y-5">
                  <div>
                    <div className="flex justify-between text-xs font-semibold text-slate-600 mb-2">
                      <span>Âm lượng</span>
                      <span className="text-[#A67B5B]">{Math.round(audioSettings.volume * 100)}%</span>
                    </div>
                    <input
                      type="range" min="0" max="1" step="0.1"
                      value={audioSettings.volume}
                      onChange={(e) => setAudioSettings(s => ({ ...s, volume: parseFloat(e.target.value) }))}
                      className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#A67B5B]"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between text-xs font-semibold text-slate-600 mb-2">
                      <span>Tốc độ</span>
                      <span className="text-[#A67B5B]">{audioSettings.rate}x</span>
                    </div>
                    <input
                      type="range" min="0.5" max="2" step="0.25"
                      value={audioSettings.rate}
                      onChange={(e) => setAudioSettings(s => ({ ...s, rate: parseFloat(e.target.value) }))}
                      className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#A67B5B]"
                    />
                    <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                      <span>Chậm</span><span>Bình thường</span><span>Nhanh</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="text-right hidden sm:block">
            <p className="text-sm font-bold text-teal-600">{knownCount}/{topic.words.length}</p>
            <p className="text-xs text-slate-500">đã học</p>
          </div>
          <button
            onClick={() => setIsFlashcardOpen(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white font-bold text-sm px-4 py-2 rounded-xl transition-all shadow-sm hover:shadow-md"
          >
            <Brain size={16} />
            Học Flashcard
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-slate-700">
            Tiến độ chủ đề
          </span>
          <span className="text-sm font-bold text-teal-600">{progress}%</span>
        </div>
        <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-linear-to-r from-teal-400 to-cyan-400 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex items-center justify-between mt-2">
          <span className="text-xs text-slate-400">
            {topic.isPremiumPreview
              ? "Hiển thị top 10 từ phổ biến nhất (full list trong premium)"
              : `${topic.words.length} từ vựng đầy đủ`}
          </span>
          <button
            onClick={() => onMarkAll(topic.words, !allKnown)}
            className="text-xs text-slate-500 hover:text-teal-600 font-semibold flex items-center gap-1 transition-colors"
          >
            <RotateCcw size={11} />
            {allKnown ? "Bỏ tất cả" : "Đánh dấu tất cả"}
          </button>
        </div>
      </div>

      {/* Word cards grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {currentWords.map((word) => (
          <WordCard
            key={word.id}
            word={word}
            isKnown={knownWords.has(word.id)}
            onToggleKnown={onToggleKnown}
            audioSettings={audioSettings}
          />
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="p-2 rounded-xl border border-[#E8DCCF] text-slate-500 hover:text-[#A67B5B] hover:bg-[#FDFBF7] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft size={18} />
          </button>
          <div className="flex items-center gap-1">
            {Array.from({ length: totalPages }).map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentPage(idx + 1)}
                className={`w-8 h-8 rounded-xl text-sm font-bold transition-colors ${
                  currentPage === idx + 1
                    ? "bg-[#A67B5B] text-white shadow-sm"
                    : "text-slate-500 hover:bg-[#FDFBF7] hover:text-[#A67B5B]"
                }`}
              >
                {idx + 1}
              </button>
            ))}
          </div>
          <button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="p-2 rounded-xl border border-[#E8DCCF] text-slate-500 hover:text-[#A67B5B] hover:bg-[#FDFBF7] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      )}

      {/* Premium preview notice */}
      {topic.isPremiumPreview && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 text-center">
          <p className="text-2xl mb-2">⭐</p>
          <h3 className="text-base font-bold text-amber-800 mb-1">
            Xem đầy đủ {topic.count} từ trong bản Premium
          </h3>
          <p className="text-sm text-amber-700">
            Trên đây là 10 từ phổ biến nhất. Nâng cấp để học toàn bộ{" "}
            {topic.count} từ kèm bài tập luyện tập.
          </p>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// VOCAB WORD LIST — API-driven (replaces old hardcoded VocabWordList usage)
// ─────────────────────────────────────────────────────────────────────────────
function VocabWordListApi({
  topicId,
  enrollmentId,
  onBack,
}: {
  topicId: number;
  enrollmentId: number | null;
  onBack: () => void;
}) {
  const [page, setPage] = useState(1);
  const [isFlashcardOpen, setIsFlashcardOpen] = useState(false);
  const [isWriteOpen, setIsWriteOpen] = useState(false);
  const [isLearnMenuOpen, setIsLearnMenuOpen] = useState(false);
  const [audioSettings, setAudioSettings] = useState({ volume: 1, rate: 1 });
  const [showAudioSettings, setShowAudioSettings] = useState(false);
  // Local known state — synced to API on toggle
  const [knownSet, setKnownSet] = useState<Set<number>>(new Set());
  const [knownWordsData, setKnownWordsData] = useState<VocabWordApi[]>([]);
  const [knownLoading, setKnownLoading] = useState(false);
  const [activeShelf, setActiveShelf] = useState<'unknown' | 'known'>('unknown');

  const { result, loading, refetch } = useVocabWords(enrollmentId, topicId, page, 10);

  useEffect(() => {
    setActiveShelf('unknown');
    setPage(1);
    setIsLearnMenuOpen(false);
    setIsFlashcardOpen(false);
    setIsWriteOpen(false);
    setKnownWordsData([]);
    setKnownSet(new Set());
  }, [topicId]);

  const fetchKnownWords = useCallback(async () => {
    if (!enrollmentId) return;
    setKnownLoading(true);
    try {
      const rows = await apiGetKnownWords(enrollmentId, topicId);
      setKnownWordsData(rows);
      setKnownSet(new Set(rows.map((r) => r.id)));
    } catch {
      // silent fail
    } finally {
      setKnownLoading(false);
    }
  }, [enrollmentId, topicId]);

  useEffect(() => {
    fetchKnownWords();
  }, [fetchKnownWords]);

  const handleToggleKnown = async (wordId: number) => {
    if (!enrollmentId) return;
    const willBeKnown = !knownSet.has(wordId);
    setKnownSet((prev) => {
      const next = new Set(prev);
      if (willBeKnown) next.add(wordId); else next.delete(wordId);
      return next;
    });
    setKnownWordsData((prev) => {
      if (willBeKnown) {
        if (prev.some((w) => w.id === wordId)) return prev;
        const fromPage = result?.data.find((w) => w.id === wordId);
        return fromPage ? [...prev, fromPage] : prev;
      }
      return prev.filter((w) => w.id !== wordId);
    });
    try {
      await apiToggleKnown(enrollmentId, wordId, willBeKnown);
    } finally {
      fetchKnownWords();
    }
  };

  if (loading && !result) {
    return (
      <div className="space-y-4">
        <div className="h-10 bg-slate-100 rounded-xl animate-pulse w-1/3" />
        {[1,2,3].map(i => (
          <div key={i} className="bg-white rounded-2xl border border-slate-100 p-4 animate-pulse space-y-3">
            <div className="h-5 bg-slate-100 rounded w-1/4"/>
            <div className="h-4 bg-slate-100 rounded w-3/4"/>
            <div className="h-16 bg-slate-50 rounded-xl"/>
          </div>
        ))}
      </div>
    );
  }

  if (!result) return null;

  const { topic: topicMeta, data: words, meta } = result;
  const knownCount = knownWordsData.length;
  const unknownCount = Math.max(0, meta.total - knownCount);
  const progress = meta.total > 0 ? Math.round((knownCount / meta.total) * 100) : 0;
  const unknownWords = words.filter((w) => !knownSet.has(w.id));

  const mapApiWordToVocabWord = (w: VocabWordApi): VocabWord => ({
    id: String(w.id),
    word: w.word,
    definitions: w.definitions.map((d) => ({
      pos: d.pos,
      meaning: d.meaning,
      example: { en: d.exampleEn, vi: d.exampleVi },
    })),
  });

  const unknownWordCards = unknownWords.map(mapApiWordToVocabWord);
  const knownWordCards = knownWordsData.map(mapApiWordToVocabWord);
  const learnSourceWords = activeShelf === 'known' ? knownWordsData : unknownWords;
  const learnWordCards = learnSourceWords.map(mapApiWordToVocabWord);
  const learnDisabled = learnWordCards.length === 0;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start gap-3">
        <button onClick={onBack} className="flex items-center gap-1 text-sm text-teal-600 hover:text-teal-700 font-semibold bg-white border border-teal-200 hover:border-teal-300 px-3 py-2 rounded-xl transition-all shrink-0">
          <ChevronLeft size={16} />Chủ đề
        </button>
        <div className="flex-1">
          <h2 className="text-lg font-bold text-slate-800">{topicMeta.emoji} {topicMeta.titleVI}</h2>
          <p className="text-sm text-slate-500">{topicMeta.titleEN}</p>
        </div>
        <div className="shrink-0 flex items-center gap-3 relative">
          {/* Audio settings */}
          <div className="relative">
            <button onClick={() => setShowAudioSettings(!showAudioSettings)} className="p-2 text-slate-500 hover:bg-slate-100 hover:text-teal-600 rounded-xl transition-colors border border-transparent hover:border-slate-200 bg-white" title="Cài đặt phát âm">
              <Settings2 size={20} />
            </button>
            {showAudioSettings && (
              <div className="absolute top-full right-0 mt-2 w-64 bg-white border border-[#E8DCCF] shadow-xl rounded-2xl p-4 z-50">
                <h3 className="text-sm font-bold text-slate-700 mb-4 border-b border-slate-100 pb-2">Cài đặt Phát âm</h3>
                <div className="space-y-5">
                  <div>
                    <div className="flex justify-between text-xs font-semibold text-slate-600 mb-2"><span>Âm lượng</span><span className="text-[#A67B5B]">{Math.round(audioSettings.volume * 100)}%</span></div>
                    <input type="range" min="0" max="1" step="0.1" value={audioSettings.volume} onChange={(e) => setAudioSettings(s => ({ ...s, volume: parseFloat(e.target.value) }))} className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#A67B5B]" />
                  </div>
                  <div>
                    <div className="flex justify-between text-xs font-semibold text-slate-600 mb-2"><span>Tốc độ</span><span className="text-[#A67B5B]">{audioSettings.rate}x</span></div>
                    <input type="range" min="0.5" max="2" step="0.25" value={audioSettings.rate} onChange={(e) => setAudioSettings(s => ({ ...s, rate: parseFloat(e.target.value) }))} className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#A67B5B]" />
                    <div className="flex justify-between text-[10px] text-slate-400 mt-1"><span>Chậm</span><span>Bình thường</span><span>Nhanh</span></div>
                  </div>
                </div>
              </div>
            )}
          </div>
          <div className="text-right hidden sm:block">
            <p className="text-sm font-bold text-teal-600">{knownCount}/{meta.total}</p>
            <p className="text-xs text-slate-500">đã học</p>
          </div>
          <div className="relative">
            <button
              onClick={() => setIsLearnMenuOpen((prev) => !prev)}
              disabled={learnDisabled}
              className={`flex items-center gap-2 text-white font-bold text-sm px-4 py-2 rounded-xl transition-all shadow-sm hover:shadow-md ${
                learnDisabled
                  ? 'bg-slate-300 cursor-not-allowed'
                  : 'bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600'
              }`}
            >
              <Sparkles size={16} />Learn Vocab
            </button>
            {isLearnMenuOpen && (
              <div className="absolute right-0 mt-2 w-52 bg-white border border-slate-200 shadow-xl rounded-2xl p-2 z-50">
                <button
                  onClick={() => { setIsLearnMenuOpen(false); setIsFlashcardOpen(true); }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  <Brain size={16} />Flashcard
                </button>
                <button
                  onClick={() => { setIsLearnMenuOpen(false); setIsWriteOpen(true); }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  <PenLine size={16} />Viết nghĩa
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-slate-700">Tiến độ chủ đề</span>
          <span className="text-sm font-bold text-teal-600">{progress}%</span>
        </div>
        <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-teal-400 to-cyan-400 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>
        <p className="text-xs text-slate-400 mt-2">{meta.total} từ vựng · Trang {meta.page}/{meta.totalPages}</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-2 flex items-center gap-2">
        <button
          onClick={() => setActiveShelf('unknown')}
          className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold transition-all ${
            activeShelf === 'unknown'
              ? 'bg-teal-50 text-teal-700 border border-teal-200'
              : 'text-slate-500 hover:text-teal-600 hover:bg-slate-50'
          }`}
        >
          <BookOpen size={16} />Chưa thuộc ({unknownCount})
        </button>
        <button
          onClick={() => setActiveShelf('known')}
          className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold transition-all ${
            activeShelf === 'known'
              ? 'bg-amber-50 text-amber-700 border border-amber-200'
              : 'text-slate-500 hover:text-amber-600 hover:bg-slate-50'
          }`}
        >
          <Archive size={16} />Kho đã thuộc ({knownCount})
        </button>
      </div>

      {/* Word cards */}
      {activeShelf === 'unknown' ? (
        unknownWordCards.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {unknownWordCards.map((word) => (
              <WordCard
                key={word.id}
                word={word}
                isKnown={false}
                onToggleKnown={(id) => handleToggleKnown(Number(id))}
                audioSettings={audioSettings}
              />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-8 text-center">
            <p className="text-3xl mb-2">🎉</p>
            <p className="text-sm font-semibold text-slate-700">Bạn đã thuộc hết từ ở trang này.</p>
            <p className="text-xs text-slate-500 mt-1">Chuyển sang kho đã thuộc hoặc chuyển trang tiếp theo.</p>
          </div>
        )
      ) : (
        knownLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[1, 2].map((i) => (
              <div key={i} className="bg-white rounded-2xl border border-slate-100 p-4 animate-pulse space-y-3">
                <div className="h-5 bg-slate-100 rounded w-1/3" />
                <div className="h-4 bg-slate-100 rounded w-2/3" />
                <div className="h-16 bg-slate-50 rounded-xl" />
              </div>
            ))}
          </div>
        ) : knownWordCards.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {knownWordCards.map((word) => (
              <WordCard
                key={word.id}
                word={word}
                isKnown={true}
                knownLabel="Bỏ đánh dấu"
                onToggleKnown={(id) => handleToggleKnown(Number(id))}
                audioSettings={audioSettings}
              />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-8 text-center">
            <p className="text-3xl mb-2">🗂️</p>
            <p className="text-sm font-semibold text-slate-700">Kho đã thuộc đang trống.</p>
            <p className="text-xs text-slate-500 mt-1">Hãy đánh dấu từ đã thuộc để chuyển vào kho.</p>
          </div>
        )
      )}

      {/* Pagination */}
      {activeShelf === 'unknown' && meta.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <button onClick={() => { setPage(p => Math.max(p - 1, 1)); }} disabled={page === 1} className="p-2 rounded-xl border border-[#E8DCCF] text-slate-500 hover:text-[#A67B5B] hover:bg-[#FDFBF7] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"><ChevronLeft size={18} /></button>
          <div className="flex items-center gap-1">
            {Array.from({ length: meta.totalPages }).map((_, idx) => (
              <button key={idx} onClick={() => { setPage(idx + 1); }} className={`w-8 h-8 rounded-xl text-sm font-bold transition-colors ${page === idx + 1 ? "bg-[#A67B5B] text-white shadow-sm" : "text-slate-500 hover:bg-[#FDFBF7] hover:text-[#A67B5B]"}`}>{idx + 1}</button>
            ))}
          </div>
          <button onClick={() => { setPage(p => Math.min(p + 1, meta.totalPages)); }} disabled={page === meta.totalPages} className="p-2 rounded-xl border border-[#E8DCCF] text-slate-500 hover:text-[#A67B5B] hover:bg-[#FDFBF7] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"><ChevronRight size={18} /></button>
        </div>
      )}

      {/* Flashcard modal */}
      {isFlashcardOpen && learnWordCards.length > 0 && (
        <FlashcardStudy
          topic={{ id: topicId, titleVI: topicMeta.titleVI, emoji: topicMeta.emoji, words: learnWordCards } as any}
          knownWords={knownSet as any}
          onToggleKnown={(id: string) => handleToggleKnown(Number(id))}
          onClose={() => { setIsFlashcardOpen(false); refetch(); }}
          audioSettings={audioSettings}
        />
      )}
      {isWriteOpen && (
        <WriteMeaningStudy
          title={`${topicMeta.titleVI} · Learn Vocab`}
          words={learnWordCards}
          onClose={() => { setIsWriteOpen(false); refetch(); }}
          audioSettings={audioSettings}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN PAGE COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
export default function ToeicFoundationStudyPage() {
  const { tab } = useParams<{ tab: string }>();
  const navigate = useNavigate();

  useToeicScrollReset();

  const activeTab: "grammar" | "vocab" = tab === "vocab" ? "vocab" : "grammar";

  // ── Enrollment ID (auto-resolved: localStorage → API) ──────────────────────
  const [enrollmentId] = useState<number | null>(null);

  // ── Vocab API data ───────────────────────────────────────────────────────────
  const { topics: apiTopics, loading: topicsLoading, refetch: refetchTopics, resolvedId: activeEnrollmentId } =
    useVocabTopics(enrollmentId);
  const vocabStats = useVocabStats(activeEnrollmentId, "toeic");

  const [expandedGrammar, setExpandedGrammar] = useState<Set<number>>(
    new Set([1]),
  );
  const [selectedVocabTopicId, setSelectedVocabTopicId] = useState<
    number | null
  >(null);
  const [grammarQuizAnswers, setGrammarQuizAnswers] = useState<
    Record<string, string>
  >({});
  const [knownWords, setKnownWords] = useState<Set<string>>(loadKnownWords);

  // Sync tab with URL
  const handleTabSwitch = useCallback(
    (tab: "grammar" | "vocab") => {
      navigate(`/student/certificate-review/toeic/foundation/${tab}`, {
        replace: true,
      });
    },
    [navigate],
  );

  // Persist known words
  useEffect(() => {
    saveKnownWords(knownWords);
  }, [knownWords]);

  const toggleGrammarExpand = (id: number) => {
    setExpandedGrammar((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleQuizAnswer = (questionId: string, key: string) => {
    setGrammarQuizAnswers((prev) => ({ ...prev, [questionId]: key }));
  };

  const handleToggleKnown = (wordId: string) => {
    setKnownWords((prev) => {
      const next = new Set(prev);
      if (next.has(wordId)) next.delete(wordId);
      else next.add(wordId);
      return next;
    });
  };

  const handleMarkAll = (words: VocabWord[], markAll: boolean) => {
    setKnownWords((prev) => {
      const next = new Set(prev);
      if (markAll) {
        words.forEach((w) => next.add(w.id));
      } else {
        words.forEach((w) => next.delete(w.id));
      }
      return next;
    });
  };

  const handleResetQuiz = () => {
    setGrammarQuizAnswers({});
  };

  const totalKnown = vocabStats?.knownWords ?? knownWords.size;

  // Resolve selected topic (always defined when selectedVocabTopicId is not null)
  const selectedTopic =
    selectedVocabTopicId !== null
      ? (VOCAB_TOPICS.find((t) => t.id === selectedVocabTopicId) ?? null)
      : null;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Header />

      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* ── Breadcrumb ── */}
        <nav className="flex items-center gap-2 text-sm text-slate-500 flex-wrap">
          <button
            onClick={() => navigate("/student/certificate-review")}
            className="hover:text-teal-600 font-medium transition-colors"
          >
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
          <span className="text-teal-700 font-semibold">Foundation</span>
        </nav>

        {/* ── Header Banner ── */}
        <div className="rounded-2xl overflow-hidden shadow-md">
          <div className="px-6 py-6 bg-gradient-to-r from-[#A67B5B] to-[#C69C6D]">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              {/* TOEIC badge */}
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center shrink-0">
                <span className="text-white font-black text-xl tracking-wide">
                  TOEIC
                </span>
              </div>

              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-white font-bold text-2xl">
                    Nền Tảng TOEIC
                  </h1>
                  <span className="bg-white/25 text-white text-xs font-bold px-2.5 py-1 rounded-full border border-white/30">
                    Foundation
                  </span>
                </div>
                <p className="text-white/80 text-sm mt-1">
                  {activeTab === "grammar"
                    ? "📐 Grammar Cốt lõi"
                    : "📚 Từ vựng theo Chủ đề"}
                </p>
                <div className="flex flex-wrap gap-2 mt-2">
                  <span className="bg-white/20 text-white text-xs font-semibold px-3 py-1 rounded-full">
                    {totalKnown} từ đã học
                  </span>
                  <span className="bg-white/20 text-white text-xs font-semibold px-3 py-1 rounded-full">
                    7 chủ điểm ngữ pháp
                  </span>
                  <span className="bg-white/20 text-white text-xs font-semibold px-3 py-1 rounded-full">
                    8 chủ đề từ vựng
                  </span>
                </div>
              </div>

              {/* Back button */}
              <button
                onClick={() => navigate("/student/certificate-review/toeic")}
                className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors border border-white/30"
              >
                <ChevronLeft size={16} />
                TOEIC Map
              </button>
            </div>
          </div>
        </div>

        {/* ── Tab Navigation ── */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-1.5 flex gap-1">
          <button
            onClick={() => handleTabSwitch("grammar")}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold transition-all duration-200 ${
              activeTab === "grammar"
                ? "bg-gradient-to-r from-[#A67B5B] to-[#C69C6D] text-white shadow-md shadow-[#C69C6D]/50"
                : "text-slate-500 hover:text-[#A67B5B] hover:bg-[#FDFBF7]"
            }`}
          >
            <Brain size={18} />
            📐 Ngữ Pháp
          </button>
          <button
            onClick={() => handleTabSwitch("vocab")}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold transition-all duration-200 ${
              activeTab === "vocab"
                ? "bg-gradient-to-r from-[#A67B5B] to-[#C69C6D] text-white shadow-md shadow-[#C69C6D]/50"
                : "text-slate-500 hover:text-[#A67B5B] hover:bg-[#FDFBF7]"
            }`}
          >
            <BookOpen size={18} />
            📚 Từ Vựng
          </button>
        </div>

        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* GRAMMAR SECTION                                                    */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        {activeTab === "grammar" && (
          <div className="space-y-4">
            {/* Section header */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-800">
                  📐 Ngữ Pháp Cốt Lõi TOEIC
                </h2>
                <p className="text-sm text-slate-500 mt-0.5">
                  7 chủ điểm quan trọng nhất — bấm vào card để mở rộng và làm
                  quiz
                </p>
              </div>
              <button
                onClick={handleResetQuiz}
                className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-[#A67B5B] font-semibold px-3 py-2 bg-white rounded-xl border border-slate-200 hover:border-violet-200 transition-all"
              >
                <RotateCcw size={12} />
                Reset Quiz
              </button>
            </div>

            {GRAMMAR_TOPICS.map((topic) => {
              const isExpanded = expandedGrammar.has(topic.id);
              const answeredCount = topic.quiz.filter(
                (q) => grammarQuizAnswers[q.id],
              ).length;
              const correctCount = topic.quiz.filter(
                (q) => grammarQuizAnswers[q.id] === q.correct,
              ).length;

              return (
                <div
                  key={topic.id}
                  className={`bg-white rounded-2xl border shadow-sm overflow-hidden transition-all duration-200 ${
                    isExpanded
                      ? "border-violet-200 shadow-violet-100"
                      : "border-slate-100 hover:border-violet-200 hover:shadow-md"
                  }`}
                >
                  {/* Card header — always visible */}
                  <button
                    onClick={() => toggleGrammarExpand(topic.id)}
                    className="w-full text-left px-5 py-4 flex items-center gap-4"
                  >
                    {/* Topic number circle */}
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 font-black text-base ${
                        isExpanded
                          ? "bg-[#FCFAF8]0 text-white"
                          : "bg-violet-100 text-[#A67B5B]"
                      }`}
                    >
                      {topic.id}
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-bold text-slate-800 leading-tight">
                        {topic.title}
                      </h3>
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        <span className="inline-flex items-center gap-1 bg-violet-100 text-[#8B6346] text-xs font-bold px-2 py-0.5 rounded-full border border-violet-200">
                          <Tag size={10} />
                          {topic.toeicPart}
                        </span>
                        <DifficultyBadge
                          difficulty={topic.difficulty}
                          color={topic.difficultyColor}
                        />
                        {answeredCount > 0 && (
                          <span
                            className={`text-xs font-bold px-2 py-0.5 rounded-full border ${
                              correctCount === topic.quiz.length
                                ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                                : "bg-amber-100 text-amber-700 border-amber-200"
                            }`}
                          >
                            Quiz: {correctCount}/{topic.quiz.length} ✓
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="shrink-0">
                      {isExpanded ? (
                        <ChevronUp size={20} className="text-[#B88B67]" />
                      ) : (
                        <ChevronDown size={20} className="text-slate-400" />
                      )}
                    </div>
                  </button>

                  {/* Expanded content */}
                  {isExpanded && (
                    <div className="px-5 pb-5 space-y-4 border-t border-[#FCFAF8]">
                      {/* Rules */}
                      <div className="space-y-3 pt-4">
                        {topic.rules.map((rule, ri) => (
                          <div
                            key={ri}
                            className="bg-slate-50 rounded-xl p-4 border border-slate-100"
                          >
                            <p className="text-sm font-bold text-slate-700 mb-2">
                              {rule.title}
                            </p>
                            {rule.signal && (
                              <span className="text-xs text-[#A67B5B] bg-[#FCFAF8] px-2 py-1 rounded-lg mb-2 inline-block border border-[#E8DCCF]">
                                🔑 Signal:{" "}
                                <span className="font-semibold">
                                  {rule.signal}
                                </span>
                              </span>
                            )}
                            {rule.examples.map((ex, ei) => (
                              <div key={ei} className="space-y-1 mt-2">
                                <p
                                  className="text-sm text-slate-800 leading-relaxed"
                                  dangerouslySetInnerHTML={{ __html: ex.en }}
                                />
                                <p className="text-xs text-slate-500 italic">
                                  {ex.vi}
                                </p>
                              </div>
                            ))}
                          </div>
                        ))}
                      </div>

                      {/* TOEIC Tip */}
                      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
                        <Lightbulb
                          size={18}
                          className="text-amber-500 shrink-0 mt-0.5"
                        />
                        <div>
                          <p className="text-xs font-bold text-amber-700 mb-1 uppercase tracking-wide">
                            TOEIC Tip
                          </p>
                          <p className="text-sm text-amber-800 leading-relaxed">
                            {topic.tip}
                          </p>
                        </div>
                      </div>

                      {/* Mini Quiz */}
                      <GrammarQuiz
                        quiz={topic.quiz}
                        answers={grammarQuizAnswers}
                        onAnswer={handleQuizAnswer}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* VOCABULARY SECTION                                                 */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        {activeTab === "vocab" && (
          <div className="space-y-4">
            {selectedVocabTopicId !== null ? (
              /* ── Word list view (uses API data) ── */
              <VocabWordListApi
                topicId={selectedVocabTopicId}
                enrollmentId={activeEnrollmentId}
                onBack={() => {
                  setSelectedVocabTopicId(null);
                  refetchTopics();
                }}
              />

            ) : (
              /* ── Topic selector grid (API data) ── */
              <>
                <div>
                  <h2 className="text-lg font-bold text-slate-800">
                    📚 Từ Vựng Theo Chủ Đề
                  </h2>
                  <p className="text-sm text-slate-500 mt-0.5">
                    Chọn một chủ đề để học từ vựng TOEIC thường gặp
                  </p>
                </div>

                {topicsLoading ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[1,2,3,4,5,6,7,8].map(i => (
                      <div key={i} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 animate-pulse">
                        <div className="w-10 h-10 bg-slate-100 rounded-xl mb-3"/>
                        <div className="h-4 bg-slate-100 rounded w-3/4 mb-2"/>
                        <div className="h-3 bg-slate-100 rounded w-1/2 mb-4"/>
                        <div className="h-1.5 bg-slate-100 rounded-full"/>
                      </div>
                    ))}
                  </div>
                ) : apiTopics.length === 0 ? (
                  <div className="bg-white rounded-2xl border border-dashed border-[#E8DCCF] p-12 text-center">
                    <p className="text-4xl mb-3">📭</p>
                    <h3 className="font-bold text-slate-700 mb-1">Chưa có từ vựng nào</h3>
                    <p className="text-sm text-slate-500">Giảng viên chưa nạp từ vựng vào hệ thống. Vui lòng chờ!</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {apiTopics.map((topic: VocabTopicApi) => (
                      <button
                        key={topic.id}
                        onClick={() => setSelectedVocabTopicId(topic.id)}
                        className="group bg-white rounded-2xl border border-slate-100 hover:border-teal-300 shadow-sm hover:shadow-md p-5 text-left transition-all duration-200 relative overflow-hidden"
                      >
                        <div className="text-3xl mb-3">{topic.emoji}</div>
                        <h3 className="text-sm font-bold text-slate-800 leading-tight">
                          {topic.titleVI}
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5 mb-3 line-clamp-1">
                          {topic.titleEN}
                        </p>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs text-slate-500 font-medium">
                            {topic.knownCount}/{topic.wordCount} từ
                          </span>
                          <span className="text-xs font-bold text-teal-600">
                            {topic.progress}%
                          </span>
                        </div>
                        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-linear-to-r from-teal-400 to-cyan-400 rounded-full transition-all duration-500"
                            style={{ width: `${topic.progress}%` }}
                          />
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {/* Stats row — from API */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-2xl font-black text-teal-600">
                        {vocabStats?.knownWords ?? 0}
                      </p>
                      <p className="text-xs text-slate-500 font-medium mt-0.5">Từ đã học</p>
                    </div>
                    <div>
                      <p className="text-2xl font-black text-slate-700">
                        {vocabStats?.totalWords ?? 0}
                      </p>
                      <p className="text-xs text-slate-500 font-medium mt-0.5">Tổng từ vựng</p>
                    </div>
                    <div>
                      <p className="text-2xl font-black text-[#A67B5B]">
                        {vocabStats?.topics ?? 0}
                      </p>
                      <p className="text-xs text-slate-500 font-medium mt-0.5">Chủ đề</p>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

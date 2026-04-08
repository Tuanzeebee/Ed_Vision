// D:\Ed_Vision\Ed_Vision\src\modules\student\ToeicFoundationStudyPage.tsx
import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  BookOpen,
  Brain,
  Tag,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Star,
  Lightbulb,
  Target,
  ChevronLeft,
  RotateCcw,
} from "lucide-react";
import Header from "../../components/layout/Header";
import Footer from "../../components/layout/Footer";
import { useToeicScrollReset } from "../../hooks/useToeicScrollReset";

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

interface VocabWord {
  id: string;
  word: string;
  meaning: string;
  pos: string;
  example: GrammarExample;
  freq: 1 | 2 | 3;
}

interface VocabTopic {
  id: number;
  emoji: string;
  title: string;
  titleVI: string;
  count: number;
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
    words: [
      {
        id: "v1-1",
        word: "regarding",
        meaning: "liên quan đến",
        pos: "prep.",
        example: {
          en: "I am writing regarding the meeting scheduled for Monday.",
          vi: "Tôi viết thư liên quan đến cuộc họp dự kiến vào thứ Hai.",
        },
        freq: 3,
      },
      {
        id: "v1-2",
        word: "attached",
        meaning: "đính kèm",
        pos: "adj.",
        example: {
          en: "Please find the attached document for your review.",
          vi: "Vui lòng xem tài liệu đính kèm để xem xét.",
        },
        freq: 3,
      },
      {
        id: "v1-3",
        word: "pursuant",
        meaning: "theo, căn cứ vào",
        pos: "adj.",
        example: {
          en: "Pursuant to our agreement, payment is due on the 15th.",
          vi: "Theo thỏa thuận của chúng ta, thanh toán đến hạn vào ngày 15.",
        },
        freq: 2,
      },
      {
        id: "v1-4",
        word: "agenda",
        meaning: "chương trình nghị sự",
        pos: "n.",
        example: {
          en: "Please review the agenda before the meeting.",
          vi: "Vui lòng xem lại chương trình nghị sự trước cuộc họp.",
        },
        freq: 3,
      },
      {
        id: "v1-5",
        word: "correspondence",
        meaning: "thư từ giao dịch",
        pos: "n.",
        example: {
          en: "All correspondence should be directed to the HR department.",
          vi: "Mọi thư từ giao dịch cần gửi đến bộ phận Nhân sự.",
        },
        freq: 2,
      },
      {
        id: "v1-6",
        word: "acknowledge",
        meaning: "xác nhận, thừa nhận",
        pos: "v.",
        example: {
          en: "Please acknowledge receipt of this email.",
          vi: "Vui lòng xác nhận đã nhận được email này.",
        },
        freq: 3,
      },
      {
        id: "v1-7",
        word: "facilitate",
        meaning: "tạo điều kiện thuận lợi",
        pos: "v.",
        example: {
          en: "The new software will facilitate communication between teams.",
          vi: "Phần mềm mới sẽ tạo điều kiện giao tiếp giữa các nhóm.",
        },
        freq: 2,
      },
      {
        id: "v1-8",
        word: "inquiry",
        meaning: "sự hỏi han, thắc mắc",
        pos: "n.",
        example: {
          en: "Thank you for your inquiry about our services.",
          vi: "Cảm ơn bạn đã hỏi về dịch vụ của chúng tôi.",
        },
        freq: 3,
      },
      {
        id: "v1-9",
        word: "notify",
        meaning: "thông báo",
        pos: "v.",
        example: {
          en: "Please notify all staff of the schedule change.",
          vi: "Vui lòng thông báo cho tất cả nhân viên về sự thay đổi lịch.",
        },
        freq: 3,
      },
      {
        id: "v1-10",
        word: "confirm",
        meaning: "xác nhận",
        pos: "v.",
        example: {
          en: "I am writing to confirm our appointment on Thursday.",
          vi: "Tôi viết để xác nhận cuộc hẹn của chúng ta vào thứ Năm.",
        },
        freq: 3,
      },
      {
        id: "v1-11",
        word: "postpone",
        meaning: "hoãn lại",
        pos: "v.",
        example: {
          en: "The meeting has been postponed to next week.",
          vi: "Cuộc họp đã bị hoãn đến tuần sau.",
        },
        freq: 3,
      },
      {
        id: "v1-12",
        word: "available",
        meaning: "sẵn sàng, có thể liên lạc",
        pos: "adj.",
        example: {
          en: "I am available for a call after 2 PM.",
          vi: "Tôi có thể nghe gọi sau 2 giờ chiều.",
        },
        freq: 3,
      },
      {
        id: "v1-13",
        word: "forward",
        meaning: "chuyển tiếp",
        pos: "v.",
        example: {
          en: "I will forward your request to the relevant department.",
          vi: "Tôi sẽ chuyển yêu cầu của bạn đến bộ phận liên quan.",
        },
        freq: 2,
      },
      {
        id: "v1-14",
        word: "update",
        meaning: "cập nhật",
        pos: "v./n.",
        example: {
          en: "Please provide an update on the project status.",
          vi: "Vui lòng cập nhật tình trạng dự án.",
        },
        freq: 3,
      },
      {
        id: "v1-15",
        word: "deadline",
        meaning: "hạn chót",
        pos: "n.",
        example: {
          en: "The submission deadline is this Friday.",
          vi: "Hạn nộp là thứ Sáu này.",
        },
        freq: 3,
      },
      {
        id: "v1-16",
        word: "draft",
        meaning: "bản thảo / soạn thảo",
        pos: "n./v.",
        example: {
          en: "The team is working on the draft proposal.",
          vi: "Nhóm đang làm việc trên bản đề xuất thảo.",
        },
        freq: 3,
      },
      {
        id: "v1-17",
        word: "circulate",
        meaning: "lưu hành, phân phát",
        pos: "v.",
        example: {
          en: "Please circulate the minutes to all members.",
          vi: "Vui lòng phân phát biên bản cho tất cả thành viên.",
        },
        freq: 2,
      },
      {
        id: "v1-18",
        word: "minutes",
        meaning: "biên bản cuộc họp",
        pos: "n.",
        example: {
          en: "Who will take the minutes at today's meeting?",
          vi: "Ai sẽ ghi biên bản trong cuộc họp hôm nay?",
        },
        freq: 3,
      },
      {
        id: "v1-19",
        word: "confidential",
        meaning: "bí mật, mật",
        pos: "adj.",
        example: {
          en: "This document is strictly confidential.",
          vi: "Tài liệu này hoàn toàn bí mật.",
        },
        freq: 2,
      },
      {
        id: "v1-20",
        word: "reference",
        meaning: "tài liệu tham khảo / mã số",
        pos: "n.",
        example: {
          en: "Please use the above reference number in your reply.",
          vi: "Vui lòng sử dụng số mã tham chiếu ở trên trong câu trả lời.",
        },
        freq: 3,
      },
      {
        id: "v1-21",
        word: "schedule",
        meaning: "lên lịch / lịch trình",
        pos: "v./n.",
        example: {
          en: "The interview is scheduled for 10 AM on Monday.",
          vi: "Buổi phỏng vấn được lên lịch vào 10 giờ sáng thứ Hai.",
        },
        freq: 3,
      },
      {
        id: "v1-22",
        word: "revise",
        meaning: "sửa đổi, chỉnh sửa",
        pos: "v.",
        example: {
          en: "Please revise the proposal and resubmit it by Friday.",
          vi: "Vui lòng sửa lại đề xuất và gửi lại trước thứ Sáu.",
        },
        freq: 2,
      },
      {
        id: "v1-23",
        word: "submit",
        meaning: "nộp, gửi",
        pos: "v.",
        example: {
          en: "Please submit the completed form to HR.",
          vi: "Vui lòng nộp mẫu đã điền cho bộ phận Nhân sự.",
        },
        freq: 3,
      },
      {
        id: "v1-24",
        word: "clarify",
        meaning: "làm rõ",
        pos: "v.",
        example: {
          en: "Could you clarify the requirements for this position?",
          vi: "Bạn có thể làm rõ các yêu cầu cho vị trí này không?",
        },
        freq: 2,
      },
      {
        id: "v1-25",
        word: "urgent",
        meaning: "khẩn cấp",
        pos: "adj.",
        example: {
          en: "This is an urgent matter that requires immediate attention.",
          vi: "Đây là vấn đề khẩn cấp cần được chú ý ngay lập tức.",
        },
        freq: 3,
      },
    ],
  },
  {
    id: 2,
    emoji: "💼",
    title: "Contract & Business",
    titleVI: "Hợp đồng & Kinh doanh",
    count: 25,
    words: [
      {
        id: "v2-1",
        word: "contract",
        meaning: "hợp đồng",
        pos: "n.",
        example: {
          en: "Both parties must sign the contract before work begins.",
          vi: "Cả hai bên phải ký hợp đồng trước khi công việc bắt đầu.",
        },
        freq: 3,
      },
      {
        id: "v2-2",
        word: "negotiate",
        meaning: "đàm phán",
        pos: "v.",
        example: {
          en: "The two companies will negotiate the terms of the deal.",
          vi: "Hai công ty sẽ đàm phán các điều khoản của thỏa thuận.",
        },
        freq: 3,
      },
      {
        id: "v2-3",
        word: "clause",
        meaning: "điều khoản",
        pos: "n.",
        example: {
          en: "Please review clause 5 of the contract carefully.",
          vi: "Vui lòng xem xét kỹ điều khoản 5 của hợp đồng.",
        },
        freq: 2,
      },
      {
        id: "v2-4",
        word: "vendor",
        meaning: "nhà cung cấp, người bán",
        pos: "n.",
        example: {
          en: "We need to select a reliable vendor for this project.",
          vi: "Chúng ta cần chọn một nhà cung cấp đáng tin cậy cho dự án này.",
        },
        freq: 3,
      },
      {
        id: "v2-5",
        word: "proposal",
        meaning: "đề xuất, bản đề nghị",
        pos: "n.",
        example: {
          en: "The team submitted a proposal to the client.",
          vi: "Nhóm đã gửi một đề xuất cho khách hàng.",
        },
        freq: 3,
      },
      {
        id: "v2-6",
        word: "invoice",
        meaning: "hóa đơn",
        pos: "n.",
        example: {
          en: "The invoice must be paid within 30 days.",
          vi: "Hóa đơn phải được thanh toán trong vòng 30 ngày.",
        },
        freq: 3,
      },
      {
        id: "v2-7",
        word: "comply",
        meaning: "tuân thủ",
        pos: "v.",
        example: {
          en: "All contractors must comply with safety regulations.",
          vi: "Tất cả nhà thầu phải tuân thủ các quy định an toàn.",
        },
        freq: 3,
      },
      {
        id: "v2-8",
        word: "incentive",
        meaning: "khuyến khích, phần thưởng",
        pos: "n.",
        example: {
          en: "The company offers incentives for high-performing employees.",
          vi: "Công ty cung cấp các phần thưởng cho nhân viên có hiệu suất cao.",
        },
        freq: 2,
      },
      {
        id: "v2-9",
        word: "merger",
        meaning: "sáp nhập",
        pos: "n.",
        example: {
          en: "The merger between the two companies was announced last week.",
          vi: "Việc sáp nhập giữa hai công ty được công bố tuần trước.",
        },
        freq: 2,
      },
      {
        id: "v2-10",
        word: "acquisition",
        meaning: "sự thâu tóm, mua lại",
        pos: "n.",
        example: {
          en: "The acquisition was valued at $50 million.",
          vi: "Thương vụ mua lại được định giá 50 triệu đô la.",
        },
        freq: 2,
      },
      {
        id: "v2-11",
        word: "revenue",
        meaning: "doanh thu",
        pos: "n.",
        example: {
          en: "The company's revenue increased by 15% this quarter.",
          vi: "Doanh thu của công ty tăng 15% trong quý này.",
        },
        freq: 3,
      },
      {
        id: "v2-12",
        word: "profit",
        meaning: "lợi nhuận",
        pos: "n.",
        example: {
          en: "Net profit for the year exceeded expectations.",
          vi: "Lợi nhuận ròng trong năm vượt quá kỳ vọng.",
        },
        freq: 3,
      },
      {
        id: "v2-13",
        word: "budget",
        meaning: "ngân sách",
        pos: "n.",
        example: {
          en: "We need to stay within the allocated budget.",
          vi: "Chúng ta cần duy trì trong giới hạn ngân sách được phân bổ.",
        },
        freq: 3,
      },
      {
        id: "v2-14",
        word: "expenditure",
        meaning: "chi tiêu, khoản chi",
        pos: "n.",
        example: {
          en: "All expenditures must be approved by management.",
          vi: "Tất cả chi tiêu phải được ban quản lý phê duyệt.",
        },
        freq: 2,
      },
      {
        id: "v2-15",
        word: "reimburse",
        meaning: "hoàn trả, bồi hoàn",
        pos: "v.",
        example: {
          en: "Employees will be reimbursed for travel expenses.",
          vi: "Nhân viên sẽ được hoàn trả chi phí đi lại.",
        },
        freq: 3,
      },
      {
        id: "v2-16",
        word: "audit",
        meaning: "kiểm toán",
        pos: "n./v.",
        example: {
          en: "The annual audit will take place next month.",
          vi: "Cuộc kiểm toán hàng năm sẽ diễn ra vào tháng tới.",
        },
        freq: 2,
      },
      {
        id: "v2-17",
        word: "liability",
        meaning: "trách nhiệm pháp lý",
        pos: "n.",
        example: {
          en: "The company accepts no liability for damages.",
          vi: "Công ty không chịu trách nhiệm pháp lý về thiệt hại.",
        },
        freq: 2,
      },
      {
        id: "v2-18",
        word: "stakeholder",
        meaning: "các bên liên quan",
        pos: "n.",
        example: {
          en: "All stakeholders were informed of the decision.",
          vi: "Tất cả các bên liên quan đã được thông báo về quyết định.",
        },
        freq: 3,
      },
      {
        id: "v2-19",
        word: "priority",
        meaning: "ưu tiên",
        pos: "n.",
        example: {
          en: "Customer satisfaction is our top priority.",
          vi: "Sự hài lòng của khách hàng là ưu tiên hàng đầu của chúng tôi.",
        },
        freq: 3,
      },
      {
        id: "v2-20",
        word: "launch",
        meaning: "ra mắt",
        pos: "v./n.",
        example: {
          en: "The new product will be launched next quarter.",
          vi: "Sản phẩm mới sẽ được ra mắt vào quý tới.",
        },
        freq: 3,
      },
      {
        id: "v2-21",
        word: "implement",
        meaning: "thực hiện, áp dụng",
        pos: "v.",
        example: {
          en: "The new policy will be implemented starting next month.",
          vi: "Chính sách mới sẽ được thực hiện bắt đầu từ tháng tới.",
        },
        freq: 3,
      },
      {
        id: "v2-22",
        word: "terminate",
        meaning: "chấm dứt",
        pos: "v.",
        example: {
          en: "The contract may be terminated with 30 days' notice.",
          vi: "Hợp đồng có thể bị chấm dứt với thông báo 30 ngày.",
        },
        freq: 2,
      },
      {
        id: "v2-23",
        word: "prior",
        meaning: "trước đó",
        pos: "adj.",
        example: {
          en: "Prior approval is required for all purchases over $500.",
          vi: "Cần có sự phê duyệt trước cho tất cả giao dịch mua trên 500 đô.",
        },
        freq: 3,
      },
      {
        id: "v2-24",
        word: "loss",
        meaning: "thua lỗ, mất mát",
        pos: "n.",
        example: {
          en: "The company reported a loss of $2 million last year.",
          vi: "Công ty báo cáo khoản lỗ 2 triệu đô la năm ngoái.",
        },
        freq: 3,
      },
      {
        id: "v2-25",
        word: "compliance",
        meaning: "sự tuân thủ",
        pos: "n.",
        example: {
          en: "All employees must ensure compliance with company policies.",
          vi: "Tất cả nhân viên phải đảm bảo tuân thủ các chính sách công ty.",
        },
        freq: 3,
      },
    ],
  },
  {
    id: 3,
    emoji: "📊",
    title: "Finance & Accounting",
    titleVI: "Tài chính & Kế toán",
    count: 25,
    isPremiumPreview: true,
    words: [
      {
        id: "v3-1",
        word: "budget",
        meaning: "ngân sách",
        pos: "n.",
        example: {
          en: "The project was completed within budget.",
          vi: "Dự án đã hoàn thành trong ngân sách.",
        },
        freq: 3,
      },
      {
        id: "v3-2",
        word: "revenue",
        meaning: "doanh thu",
        pos: "n.",
        example: {
          en: "Annual revenue grew by 20%.",
          vi: "Doanh thu hàng năm tăng 20%.",
        },
        freq: 3,
      },
      {
        id: "v3-3",
        word: "profit",
        meaning: "lợi nhuận",
        pos: "n.",
        example: {
          en: "The company reported record profits this year.",
          vi: "Công ty báo cáo lợi nhuận kỷ lục năm nay.",
        },
        freq: 3,
      },
      {
        id: "v3-4",
        word: "expenditure",
        meaning: "chi tiêu",
        pos: "n.",
        example: {
          en: "Capital expenditure increased by 10%.",
          vi: "Chi tiêu vốn tăng 10%.",
        },
        freq: 2,
      },
      {
        id: "v3-5",
        word: "reimburse",
        meaning: "hoàn tiền",
        pos: "v.",
        example: {
          en: "Submit receipts to be reimbursed.",
          vi: "Nộp biên lai để được hoàn tiền.",
        },
        freq: 3,
      },
      {
        id: "v3-6",
        word: "audit",
        meaning: "kiểm toán",
        pos: "n./v.",
        example: {
          en: "The accounts were audited last quarter.",
          vi: "Tài khoản đã được kiểm toán quý trước.",
        },
        freq: 2,
      },
      {
        id: "v3-7",
        word: "liability",
        meaning: "nợ phải trả",
        pos: "n.",
        example: {
          en: "Current liabilities include short-term loans.",
          vi: "Nợ ngắn hạn bao gồm các khoản vay ngắn hạn.",
        },
        freq: 2,
      },
      {
        id: "v3-8",
        word: "quarterly",
        meaning: "hàng quý",
        pos: "adj./adv.",
        example: {
          en: "Quarterly reports are due on the 15th.",
          vi: "Báo cáo hàng quý đến hạn vào ngày 15.",
        },
        freq: 3,
      },
      {
        id: "v3-9",
        word: "fiscal",
        meaning: "thuộc tài chính/ngân sách",
        pos: "adj.",
        example: {
          en: "The fiscal year ends in December.",
          vi: "Năm tài chính kết thúc vào tháng 12.",
        },
        freq: 3,
      },
      {
        id: "v3-10",
        word: "dividend",
        meaning: "cổ tức",
        pos: "n.",
        example: {
          en: "Shareholders will receive an annual dividend.",
          vi: "Cổ đông sẽ nhận cổ tức hàng năm.",
        },
        freq: 2,
      },
    ],
  },
  {
    id: 4,
    emoji: "🏭",
    title: "Manufacturing & Logistics",
    titleVI: "Sản xuất & Logistics",
    count: 25,
    isPremiumPreview: true,
    words: [
      {
        id: "v4-1",
        word: "shipment",
        meaning: "lô hàng",
        pos: "n.",
        example: {
          en: "The shipment arrived two days early.",
          vi: "Lô hàng đến sớm hai ngày.",
        },
        freq: 3,
      },
      {
        id: "v4-2",
        word: "inventory",
        meaning: "hàng tồn kho",
        pos: "n.",
        example: {
          en: "Inventory levels are currently very low.",
          vi: "Mức tồn kho hiện đang rất thấp.",
        },
        freq: 3,
      },
      {
        id: "v4-3",
        word: "dispatch",
        meaning: "gửi đi, điều phối",
        pos: "v.",
        example: {
          en: "Orders are dispatched within 24 hours.",
          vi: "Đơn hàng được gửi đi trong vòng 24 giờ.",
        },
        freq: 2,
      },
      {
        id: "v4-4",
        word: "warehouse",
        meaning: "kho hàng",
        pos: "n.",
        example: {
          en: "The warehouse stores over 10,000 items.",
          vi: "Kho hàng lưu trữ hơn 10.000 mặt hàng.",
        },
        freq: 3,
      },
      {
        id: "v4-5",
        word: "freight",
        meaning: "hàng hóa vận chuyển",
        pos: "n.",
        example: {
          en: "Freight costs have increased this year.",
          vi: "Chi phí vận chuyển đã tăng năm nay.",
        },
        freq: 2,
      },
      {
        id: "v4-6",
        word: "cargo",
        meaning: "hàng hóa",
        pos: "n.",
        example: {
          en: "The cargo ship arrived at port.",
          vi: "Tàu hàng đã cập cảng.",
        },
        freq: 2,
      },
      {
        id: "v4-7",
        word: "consignment",
        meaning: "lô hàng gửi",
        pos: "n.",
        example: {
          en: "The consignment was damaged in transit.",
          vi: "Lô hàng bị hỏng trong quá trình vận chuyển.",
        },
        freq: 2,
      },
      {
        id: "v4-8",
        word: "customs",
        meaning: "hải quan",
        pos: "n.",
        example: {
          en: "The goods are currently held at customs.",
          vi: "Hàng hóa hiện đang bị giữ tại hải quan.",
        },
        freq: 3,
      },
      {
        id: "v4-9",
        word: "delivery",
        meaning: "giao hàng",
        pos: "n.",
        example: {
          en: "Delivery is expected within 5 business days.",
          vi: "Dự kiến giao hàng trong vòng 5 ngày làm việc.",
        },
        freq: 3,
      },
      {
        id: "v4-10",
        word: "tracking",
        meaning: "theo dõi",
        pos: "n.",
        example: {
          en: "Use the tracking number to follow your order.",
          vi: "Sử dụng số theo dõi để theo dõi đơn hàng.",
        },
        freq: 3,
      },
    ],
  },
  {
    id: 5,
    emoji: "👥",
    title: "HR & Recruitment",
    titleVI: "Nhân sự & Tuyển dụng",
    count: 25,
    isPremiumPreview: true,
    words: [
      {
        id: "v5-1",
        word: "recruit",
        meaning: "tuyển dụng",
        pos: "v.",
        example: {
          en: "We are recruiting for several positions.",
          vi: "Chúng tôi đang tuyển dụng cho nhiều vị trí.",
        },
        freq: 3,
      },
      {
        id: "v5-2",
        word: "candidate",
        meaning: "ứng viên",
        pos: "n.",
        example: {
          en: "The candidate impressed us during the interview.",
          vi: "Ứng viên đã gây ấn tượng với chúng tôi trong buổi phỏng vấn.",
        },
        freq: 3,
      },
      {
        id: "v5-3",
        word: "vacancy",
        meaning: "vị trí còn trống",
        pos: "n.",
        example: {
          en: "There is a vacancy in the marketing department.",
          vi: "Có một vị trí còn trống trong bộ phận marketing.",
        },
        freq: 3,
      },
      {
        id: "v5-4",
        word: "onboard",
        meaning: "tiếp nhận nhân viên mới",
        pos: "v.",
        example: {
          en: "We will onboard three new employees next week.",
          vi: "Chúng ta sẽ tiếp nhận ba nhân viên mới tuần tới.",
        },
        freq: 2,
      },
      {
        id: "v5-5",
        word: "performance",
        meaning: "hiệu suất, thành tích",
        pos: "n.",
        example: {
          en: "Employee performance is reviewed annually.",
          vi: "Hiệu suất nhân viên được xem xét hàng năm.",
        },
        freq: 3,
      },
      {
        id: "v5-6",
        word: "appraisal",
        meaning: "đánh giá",
        pos: "n.",
        example: {
          en: "Your appraisal meeting is scheduled for next Friday.",
          vi: "Cuộc họp đánh giá của bạn được lên lịch vào thứ Sáu tới.",
        },
        freq: 2,
      },
      {
        id: "v5-7",
        word: "resignation",
        meaning: "từ chức, thôi việc",
        pos: "n.",
        example: {
          en: "She submitted her resignation letter yesterday.",
          vi: "Cô ấy đã nộp đơn từ chức hôm qua.",
        },
        freq: 2,
      },
      {
        id: "v5-8",
        word: "benefits",
        meaning: "phúc lợi",
        pos: "n.",
        example: {
          en: "The company offers competitive benefits.",
          vi: "Công ty cung cấp phúc lợi cạnh tranh.",
        },
        freq: 3,
      },
      {
        id: "v5-9",
        word: "payroll",
        meaning: "bảng lương",
        pos: "n.",
        example: {
          en: "Payroll is processed on the last working day.",
          vi: "Bảng lương được xử lý vào ngày làm việc cuối cùng.",
        },
        freq: 2,
      },
      {
        id: "v5-10",
        word: "reference",
        meaning: "người/thư giới thiệu",
        pos: "n.",
        example: {
          en: "Please provide two professional references.",
          vi: "Vui lòng cung cấp hai người giới thiệu chuyên nghiệp.",
        },
        freq: 3,
      },
    ],
  },
  {
    id: 6,
    emoji: "🏨",
    title: "Travel & Hospitality",
    titleVI: "Du lịch & Khách sạn",
    count: 25,
    isPremiumPreview: true,
    words: [
      {
        id: "v6-1",
        word: "reservation",
        meaning: "đặt chỗ, đặt phòng",
        pos: "n.",
        example: {
          en: "I would like to make a reservation for two.",
          vi: "Tôi muốn đặt chỗ cho hai người.",
        },
        freq: 3,
      },
      {
        id: "v6-2",
        word: "itinerary",
        meaning: "lịch trình chuyến đi",
        pos: "n.",
        example: {
          en: "Please send the final itinerary by email.",
          vi: "Vui lòng gửi lịch trình cuối cùng qua email.",
        },
        freq: 3,
      },
      {
        id: "v6-3",
        word: "accommodation",
        meaning: "chỗ ở",
        pos: "n.",
        example: {
          en: "Accommodation is included in the package.",
          vi: "Chỗ ở đã được bao gồm trong gói.",
        },
        freq: 3,
      },
      {
        id: "v6-4",
        word: "check-in",
        meaning: "làm thủ tục",
        pos: "n./v.",
        example: {
          en: "Check-in time is 3 PM.",
          vi: "Giờ làm thủ tục là 3 giờ chiều.",
        },
        freq: 3,
      },
      {
        id: "v6-5",
        word: "departure",
        meaning: "khởi hành, xuất phát",
        pos: "n.",
        example: {
          en: "The departure gate is B12.",
          vi: "Cổng khởi hành là B12.",
        },
        freq: 3,
      },
      {
        id: "v6-6",
        word: "arrival",
        meaning: "đến nơi, đáp",
        pos: "n.",
        example: {
          en: "The arrival time is 6:30 PM.",
          vi: "Giờ đến nơi là 6:30 chiều.",
        },
        freq: 3,
      },
      {
        id: "v6-7",
        word: "transit",
        meaning: "trung chuyển",
        pos: "n.",
        example: {
          en: "Passengers in transit must go to Gate C.",
          vi: "Hành khách trung chuyển phải đến Cổng C.",
        },
        freq: 2,
      },
      {
        id: "v6-8",
        word: "baggage",
        meaning: "hành lý",
        pos: "n.",
        example: {
          en: "Baggage allowance is 23 kg per person.",
          vi: "Hành lý cho phép là 23 kg mỗi người.",
        },
        freq: 3,
      },
      {
        id: "v6-9",
        word: "confirmation",
        meaning: "xác nhận",
        pos: "n.",
        example: {
          en: "You will receive a booking confirmation by email.",
          vi: "Bạn sẽ nhận được xác nhận đặt phòng qua email.",
        },
        freq: 3,
      },
      {
        id: "v6-10",
        word: "hospitality",
        meaning: "lòng hiếu khách, dịch vụ",
        pos: "n.",
        example: {
          en: "The hotel is known for its excellent hospitality.",
          vi: "Khách sạn nổi tiếng với dịch vụ xuất sắc.",
        },
        freq: 2,
      },
    ],
  },
  {
    id: 7,
    emoji: "🏥",
    title: "Healthcare",
    titleVI: "Y tế & Sức khỏe",
    count: 25,
    isPremiumPreview: true,
    words: [
      {
        id: "v7-1",
        word: "appointment",
        meaning: "cuộc hẹn, lịch khám",
        pos: "n.",
        example: {
          en: "I have a doctor's appointment on Wednesday.",
          vi: "Tôi có lịch khám bác sĩ vào thứ Tư.",
        },
        freq: 3,
      },
      {
        id: "v7-2",
        word: "prescription",
        meaning: "đơn thuốc",
        pos: "n.",
        example: {
          en: "The doctor issued a prescription for antibiotics.",
          vi: "Bác sĩ đã kê đơn thuốc kháng sinh.",
        },
        freq: 3,
      },
      {
        id: "v7-3",
        word: "insurance",
        meaning: "bảo hiểm",
        pos: "n.",
        example: {
          en: "Does your insurance cover dental care?",
          vi: "Bảo hiểm của bạn có bao gồm chăm sóc răng miệng không?",
        },
        freq: 3,
      },
      {
        id: "v7-4",
        word: "diagnosis",
        meaning: "chẩn đoán",
        pos: "n.",
        example: {
          en: "The test results confirmed the diagnosis.",
          vi: "Kết quả xét nghiệm xác nhận chẩn đoán.",
        },
        freq: 2,
      },
      {
        id: "v7-5",
        word: "treatment",
        meaning: "điều trị",
        pos: "n.",
        example: {
          en: "The treatment plan was discussed with the patient.",
          vi: "Kế hoạch điều trị đã được thảo luận với bệnh nhân.",
        },
        freq: 3,
      },
      {
        id: "v7-6",
        word: "referral",
        meaning: "giới thiệu đến bác sĩ/chuyên gia",
        pos: "n.",
        example: {
          en: "Your GP will provide a referral to a specialist.",
          vi: "Bác sĩ gia đình sẽ giới thiệu bạn đến chuyên gia.",
        },
        freq: 2,
      },
      {
        id: "v7-7",
        word: "clinic",
        meaning: "phòng khám",
        pos: "n.",
        example: {
          en: "The clinic opens at 8 AM on weekdays.",
          vi: "Phòng khám mở cửa lúc 8h sáng vào các ngày trong tuần.",
        },
        freq: 3,
      },
      {
        id: "v7-8",
        word: "symptom",
        meaning: "triệu chứng",
        pos: "n.",
        example: {
          en: "Report any unusual symptoms to your doctor.",
          vi: "Báo cáo bất kỳ triệu chứng bất thường nào cho bác sĩ.",
        },
        freq: 2,
      },
      {
        id: "v7-9",
        word: "physician",
        meaning: "bác sĩ",
        pos: "n.",
        example: {
          en: "Consult your physician before starting any new medication.",
          vi: "Tham khảo bác sĩ trước khi bắt đầu bất kỳ loại thuốc mới nào.",
        },
        freq: 2,
      },
      {
        id: "v7-10",
        word: "coverage",
        meaning: "phạm vi bảo hiểm",
        pos: "n.",
        example: {
          en: "Check your coverage before visiting a specialist.",
          vi: "Kiểm tra phạm vi bảo hiểm trước khi gặp chuyên gia.",
        },
        freq: 3,
      },
    ],
  },
  {
    id: 8,
    emoji: "💻",
    title: "Technology & IT",
    titleVI: "Công nghệ & IT",
    count: 20,
    isPremiumPreview: true,
    words: [
      {
        id: "v8-1",
        word: "software",
        meaning: "phần mềm",
        pos: "n.",
        example: {
          en: "The software update will be released tomorrow.",
          vi: "Bản cập nhật phần mềm sẽ được phát hành vào ngày mai.",
        },
        freq: 3,
      },
      {
        id: "v8-2",
        word: "upgrade",
        meaning: "nâng cấp",
        pos: "v./n.",
        example: {
          en: "We need to upgrade our database system.",
          vi: "Chúng ta cần nâng cấp hệ thống cơ sở dữ liệu.",
        },
        freq: 3,
      },
      {
        id: "v8-3",
        word: "maintenance",
        meaning: "bảo trì",
        pos: "n.",
        example: {
          en: "Scheduled maintenance will occur on Sunday.",
          vi: "Bảo trì theo lịch sẽ diễn ra vào Chủ nhật.",
        },
        freq: 3,
      },
      {
        id: "v8-4",
        word: "network",
        meaning: "mạng lưới",
        pos: "n.",
        example: {
          en: "The network will be unavailable during maintenance.",
          vi: "Mạng sẽ không khả dụng trong quá trình bảo trì.",
        },
        freq: 3,
      },
      {
        id: "v8-5",
        word: "security",
        meaning: "bảo mật",
        pos: "n.",
        example: {
          en: "Data security is a top priority.",
          vi: "Bảo mật dữ liệu là ưu tiên hàng đầu.",
        },
        freq: 3,
      },
      {
        id: "v8-6",
        word: "database",
        meaning: "cơ sở dữ liệu",
        pos: "n.",
        example: {
          en: "The database stores all customer information.",
          vi: "Cơ sở dữ liệu lưu trữ tất cả thông tin khách hàng.",
        },
        freq: 3,
      },
      {
        id: "v8-7",
        word: "server",
        meaning: "máy chủ",
        pos: "n.",
        example: {
          en: "The server will be restarted at midnight.",
          vi: "Máy chủ sẽ được khởi động lại vào lúc nửa đêm.",
        },
        freq: 2,
      },
      {
        id: "v8-8",
        word: "interface",
        meaning: "giao diện",
        pos: "n.",
        example: {
          en: "The user interface has been redesigned.",
          vi: "Giao diện người dùng đã được thiết kế lại.",
        },
        freq: 2,
      },
      {
        id: "v8-9",
        word: "backup",
        meaning: "sao lưu",
        pos: "n./v.",
        example: {
          en: "Always back up your files before updating.",
          vi: "Luôn sao lưu các tập tin của bạn trước khi cập nhật.",
        },
        freq: 3,
      },
      {
        id: "v8-10",
        word: "installation",
        meaning: "cài đặt",
        pos: "n.",
        example: {
          en: "The installation process takes about 10 minutes.",
          vi: "Quá trình cài đặt mất khoảng 10 phút.",
        },
        freq: 2,
      },
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// LOCAL STORAGE
// ─────────────────────────────────────────────────────────────────────────────
const KNOWN_WORDS_KEY = "edvision.toeic.foundation.known";

function loadKnownWords(): Set<string> {
  try {
    const raw = localStorage.getItem(KNOWN_WORDS_KEY);
    if (!raw) return new Set();
    return new Set(JSON.parse(raw) as string[]);
  } catch {
    return new Set();
  }
}

function saveKnownWords(words: Set<string>) {
  localStorage.setItem(KNOWN_WORDS_KEY, JSON.stringify(Array.from(words)));
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
    "v.": "bg-violet-100 text-violet-700",
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
      <h4 className="text-sm font-bold text-violet-700 flex items-center gap-1.5">
        <Target size={14} />
        Mini Quiz — Kiểm tra nhanh
      </h4>
      {quiz.map((q, qi) => {
        const selected = answers[q.id];
        const isAnswered = !!selected;
        return (
          <div
            key={q.id}
            className="bg-violet-50 border border-violet-100 rounded-xl p-4"
          >
            <p className="text-sm font-semibold text-slate-800 mb-3">
              <span className="text-violet-500 font-bold mr-2">{qi + 1}.</span>
              {q.sentence}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {q.options.map((opt) => {
                let btnCls =
                  "text-left text-sm px-3 py-2 rounded-lg border font-medium transition-all duration-200 ";
                if (!isAnswered) {
                  btnCls +=
                    "border-slate-200 bg-white hover:border-violet-400 hover:bg-violet-50 text-slate-700 cursor-pointer";
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
              <div className="mt-3 p-3 bg-white border border-violet-100 rounded-lg flex items-start gap-2">
                <Lightbulb
                  size={14}
                  className="text-amber-500 mt-0.5 shrink-0"
                />
                <p className="text-xs text-slate-600 leading-relaxed">
                  <span className="font-bold text-violet-700">
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
}: {
  word: VocabWord;
  isKnown: boolean;
  onToggleKnown: (id: string) => void;
}) {
  return (
    <div
      className={`bg-white rounded-2xl border shadow-sm p-4 transition-all duration-200 ${
        isKnown
          ? "border-teal-200 bg-teal-50/30"
          : "border-slate-100 hover:border-teal-200 hover:shadow-md"
      }`}
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-start gap-2 flex-wrap">
          <span
            className={`text-lg font-bold ${isKnown ? "text-teal-700" : "text-slate-800"}`}
          >
            {word.word}
          </span>
          <PosBadge pos={word.pos} />
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
          {isKnown ? "Đã biết" : "Đánh dấu"}
        </button>
      </div>

      <p className="text-sm font-medium text-slate-600 mb-2">{word.meaning}</p>

      <div className="mb-3">
        <FreqStars freq={word.freq} />
      </div>

      <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 space-y-1">
        <p
          className="text-sm text-slate-700 leading-relaxed"
          dangerouslySetInnerHTML={{ __html: word.example.en }}
        />
        <p className="text-xs text-slate-500 italic leading-relaxed">
          {word.example.vi}
        </p>
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
  const knownCount = topic.words.filter((w) => knownWords.has(w.id)).length;
  const progress = Math.round((knownCount / topic.words.length) * 100);
  const allKnown = topic.words.every((w) => knownWords.has(w.id));

  return (
    <div className="space-y-4">
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
        <div className="shrink-0 text-right">
          <p className="text-sm font-bold text-teal-600">
            {knownCount}/{topic.words.length}
          </p>
          <p className="text-xs text-slate-500">đã học</p>
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
        {topic.words.map((word) => (
          <WordCard
            key={word.id}
            word={word}
            isKnown={knownWords.has(word.id)}
            onToggleKnown={onToggleKnown}
          />
        ))}
      </div>

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
// MAIN PAGE COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
export default function ToeicFoundationStudyPage() {
  const { subject } = useParams<{ subject: string }>();
  const navigate = useNavigate();

  useToeicScrollReset();

  const activeTab: "grammar" | "vocab" =
    subject === "vocab" ? "vocab" : "grammar";

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

  const totalKnown = knownWords.size;

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
          <div
            className={`px-6 py-6 ${
              activeTab === "grammar"
                ? "bg-linear-to-r from-violet-500 via-purple-500 to-blue-500"
                : "bg-linear-to-r from-teal-500 via-cyan-500 to-blue-500"
            }`}
          >
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
                ? "bg-linear-to-r from-violet-500 to-purple-500 text-white shadow-md shadow-violet-200"
                : "text-slate-500 hover:text-violet-600 hover:bg-violet-50"
            }`}
          >
            <Brain size={18} />
            📐 Ngữ Pháp
          </button>
          <button
            onClick={() => handleTabSwitch("vocab")}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold transition-all duration-200 ${
              activeTab === "vocab"
                ? "bg-linear-to-r from-teal-500 to-cyan-500 text-white shadow-md shadow-teal-200"
                : "text-slate-500 hover:text-teal-600 hover:bg-teal-50"
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
                className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-violet-600 font-semibold px-3 py-2 bg-white rounded-xl border border-slate-200 hover:border-violet-200 transition-all"
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
                          ? "bg-violet-500 text-white"
                          : "bg-violet-100 text-violet-600"
                      }`}
                    >
                      {topic.id}
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-bold text-slate-800 leading-tight">
                        {topic.title}
                      </h3>
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        <span className="inline-flex items-center gap-1 bg-violet-100 text-violet-700 text-xs font-bold px-2 py-0.5 rounded-full border border-violet-200">
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
                        <ChevronUp size={20} className="text-violet-500" />
                      ) : (
                        <ChevronDown size={20} className="text-slate-400" />
                      )}
                    </div>
                  </button>

                  {/* Expanded content */}
                  {isExpanded && (
                    <div className="px-5 pb-5 space-y-4 border-t border-violet-50">
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
                              <span className="text-xs text-violet-600 bg-violet-50 px-2 py-1 rounded-lg mb-2 inline-block border border-violet-100">
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
            {selectedTopic !== null ? (
              /* ── Word list view ── */
              <VocabWordList
                topic={selectedTopic}
                knownWords={knownWords}
                onToggleKnown={handleToggleKnown}
                onBack={() => setSelectedVocabTopicId(null)}
                onMarkAll={handleMarkAll}
              />
            ) : (
              /* ── Topic selector grid ── */
              <>
                <div>
                  <h2 className="text-lg font-bold text-slate-800">
                    📚 Từ Vựng Theo Chủ Đề
                  </h2>
                  <p className="text-sm text-slate-500 mt-0.5">
                    Chọn một chủ đề để học từ vựng TOEIC thường gặp
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {VOCAB_TOPICS.map((topic) => {
                    const knownCount = topic.words.filter((w) =>
                      knownWords.has(w.id),
                    ).length;
                    const progress = Math.round(
                      (knownCount / topic.words.length) * 100,
                    );

                    return (
                      <button
                        key={topic.id}
                        onClick={() => setSelectedVocabTopicId(topic.id)}
                        className="group bg-white rounded-2xl border border-slate-100 hover:border-teal-300 shadow-sm hover:shadow-md p-5 text-left transition-all duration-200 relative overflow-hidden"
                      >
                        {topic.isPremiumPreview && (
                          <span className="absolute top-3 right-3 text-xs font-bold bg-amber-100 text-amber-600 border border-amber-200 px-2 py-0.5 rounded-full">
                            Top 10
                          </span>
                        )}
                        <div className="text-3xl mb-3">{topic.emoji}</div>
                        <h3 className="text-sm font-bold text-slate-800 leading-tight">
                          {topic.titleVI}
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5 mb-3 line-clamp-1">
                          {topic.title}
                        </p>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs text-slate-500 font-medium">
                            {knownCount}/{topic.words.length} từ
                          </span>
                          <span className="text-xs font-bold text-teal-600">
                            {progress}%
                          </span>
                        </div>
                        {/* Progress bar */}
                        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-linear-to-r from-teal-400 to-cyan-400 rounded-full transition-all duration-500"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Stats row */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                    <div>
                      <p className="text-2xl font-black text-teal-600">
                        {totalKnown}
                      </p>
                      <p className="text-xs text-slate-500 font-medium mt-0.5">
                        Từ đã học
                      </p>
                    </div>
                    <div>
                      <p className="text-2xl font-black text-slate-700">
                        {VOCAB_TOPICS.reduce((s, t) => s + t.words.length, 0)}
                      </p>
                      <p className="text-xs text-slate-500 font-medium mt-0.5">
                        Tổng từ vựng
                      </p>
                    </div>
                    <div>
                      <p className="text-2xl font-black text-violet-600">
                        {VOCAB_TOPICS.length}
                      </p>
                      <p className="text-xs text-slate-500 font-medium mt-0.5">
                        Chủ đề
                      </p>
                    </div>
                    <div>
                      <p className="text-2xl font-black text-amber-500">
                        {VOCAB_TOPICS.reduce(
                          (s, t) =>
                            s + t.words.filter((w) => w.freq === 3).length,
                          0,
                        )}
                      </p>
                      <p className="text-xs text-slate-500 font-medium mt-0.5">
                        Từ rất hay ra ⭐⭐⭐
                      </p>
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

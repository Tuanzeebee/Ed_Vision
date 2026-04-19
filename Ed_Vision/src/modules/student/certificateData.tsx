/* eslint-disable react-refresh/only-export-components */
import { useState } from 'react'
import { Radar } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from 'chart.js'
import {
  BookOpen,
  FileCheck,
  Headphones,
  Mic,
  PenLine,
  Eye,
  Brain,
  ChevronRight,
  Lock,
  CheckCircle2,
  Monitor,
  Video,
  Zap,
  ArrowRight,
  BookMarked,
  Layers,
  Keyboard,
  Table2,
  Presentation,
  FileText,
  ChevronLeft,
  Star,
} from 'lucide-react'

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend)

// ─── Types ────────────────────────────────────────────────────────────────────
export type CertId = 'ielts' | 'toeic' | 'mos-word' | 'mos-excel' | 'mos-powerpoint'
export type EnglishSkill = 'grammar' | 'vocabulary' | 'listening' | 'reading' | 'writing' | 'speaking'

export interface Certificate {
  id: CertId
  label: string
  sublabel: string
  color: string
  bgFrom: string
  bgTo: string
  icon: string
  progress: number
  status: 'active' | 'not-started' | 'in-progress'
  type: 'english' | 'mos'
  coverImg: string
}

export interface RoadmapStep {
  title: string
  subtitle: string
  status: 'completed' | 'in-progress' | 'locked'
  progress?: number
}

export interface PracticeTest {
  icon: React.ReactNode
  title: string
  meta: string
  scoreLabel: string
  scoreColor: string
}

export interface MosTask {
  id: number
  title: string
  description: string
  steps: string[]
  difficulty: 'Easy' | 'Medium' | 'Hard'
  done: boolean
}

export interface SkillSection {
  id: EnglishSkill
  label: string
  icon: React.ReactNode
  color: string
  bg: string
  topics: { title: string; desc: string; done: boolean; topicKey?: string }[]
  tips: string[]
}

// ─── Band / Level types ────────────────────────────────────────────────────────
export type IeltsBand = '4.0' | '5.0' | '6.0' | '6.5' | '7.0' | '7.5+'
export type ToeicBand = '350-495' | '500-599' | '600-699' | '700-799' | '800+'
export type MosLevel = 'associate' | 'expert'
export type CertBand = IeltsBand | ToeicBand | MosLevel

export interface BandOption {
  value: CertBand
  label: string
  tagline: string
  description: string
  requirements: string[]
  color: string
  bg: string
  border: string
  borderActive: string
  recommended?: boolean
}

// ─── Static data ──────────────────────────────────────────────────────────────
export const CERTIFICATES: Certificate[] = [
  {
    id: 'ielts',
    label: 'IELTS Academic',
    sublabel: 'English Proficiency',
    color: 'text-red-600',
    bgFrom: 'from-red-400',
    bgTo: 'to-orange-400',
    icon: 'IELTS',
    progress: 0,
    status: 'not-started',
    type: 'english',
    coverImg: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=500&q=80',
  },
  {
    id: 'toeic',
    label: 'TOEIC L&R',
    sublabel: 'Business English',
    color: 'text-blue-600',
    bgFrom: 'from-blue-400',
    bgTo: 'to-cyan-400',
    icon: 'TOEIC',
    progress: 0,
    status: 'not-started',
    type: 'english',
    coverImg: 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?auto=format&fit=crop&w=500&q=80',
  },
  {
    id: 'mos-word',
    label: 'MOS Word',
    sublabel: 'Microsoft Office',
    color: 'text-blue-700',
    bgFrom: 'from-blue-600',
    bgTo: 'to-blue-400',
    icon: 'W',
    progress: 0,
    status: 'not-started',
    type: 'mos',
    coverImg: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=500&q=80',
  },
  {
    id: 'mos-excel',
    label: 'MOS Excel',
    sublabel: 'Data & Spreadsheets',
    color: 'text-green-700',
    bgFrom: 'from-green-600',
    bgTo: 'to-emerald-400',
    icon: 'X',
    progress: 0,
    status: 'not-started',
    type: 'mos',
    coverImg: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=500&q=80',
  },
  {
    id: 'mos-powerpoint',
    label: 'MOS PowerPoint',
    sublabel: 'Presentations',
    color: 'text-orange-600',
    bgFrom: 'from-orange-500',
    bgTo: 'to-red-400',
    icon: 'P',
    progress: 0,
    status: 'not-started',
    type: 'mos',
    coverImg: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=500&q=80',
  },
]

export const IELTS_PRACTICE_TESTS: PracticeTest[] = [
  { icon: <Headphones className="w-5 h-5" />, title: 'IELTS Listening Mock 1', meta: '40 câu • 30 phút', scoreLabel: 'Chưa làm', scoreColor: 'text-slate-400 border border-slate-200' },
  { icon: <BookOpen className="w-5 h-5" />, title: 'IELTS Reading Mock 1', meta: '40 câu • 60 phút', scoreLabel: 'Điểm: 7.5', scoreColor: 'text-emerald-600 bg-emerald-50' },
  { icon: <PenLine className="w-5 h-5" />, title: 'IELTS Writing Mock 1', meta: '2 tasks • 60 phút', scoreLabel: 'Điểm: 6.0', scoreColor: 'text-blue-600 bg-blue-50' },
  { icon: <Mic className="w-5 h-5" />, title: 'IELTS Speaking Simulation', meta: '3 parts • 15 phút', scoreLabel: 'Chưa làm', scoreColor: 'text-slate-400 border border-slate-200' },
]

export const TOEIC_PRACTICE_TESTS: PracticeTest[] = [
  { icon: <Headphones className="w-5 h-5" />, title: 'TOEIC Listening Full Test 1', meta: '100 câu • 45 phút', scoreLabel: 'Điểm: 420', scoreColor: 'text-blue-600 bg-blue-50' },
  { icon: <BookOpen className="w-5 h-5" />, title: 'TOEIC Reading Full Test 1', meta: '100 câu • 75 phút', scoreLabel: 'Chưa làm', scoreColor: 'text-slate-400 border border-slate-200' },
  { icon: <FileCheck className="w-5 h-5" />, title: 'Mini Test – Grammar', meta: '30 câu • 20 phút', scoreLabel: 'Điểm: 85%', scoreColor: 'text-emerald-600 bg-emerald-50' },
]

export const MOS_WORD_TASKS: MosTask[] = [
  { id: 1, title: 'Định dạng văn bản cơ bản', description: 'Tạo và định dạng tài liệu Word với heading, body text và bullets.', steps: ['Mở file SampleDoc.docx', 'Áp dụng Heading 1 cho tiêu đề chính', 'Thêm danh sách bullet cho 3 mục bên dưới', 'Lưu file'], difficulty: 'Easy', done: false },
  { id: 2, title: 'Bảng và cột', description: 'Chèn bảng dữ liệu, gộp ô và căn chỉnh nội dung.', steps: ['Chèn bảng 4×3 ở vị trí con trỏ', 'Gộp 2 ô đầu của hàng 1', 'Đặt nền xanh cho hàng tiêu đề', 'Căn giữa toàn bộ nội dung bảng'], difficulty: 'Medium', done: false },
  { id: 3, title: 'Mail Merge', description: 'Thực hiện trộn thư để gửi thư mời cá nhân hóa.', steps: ['Mở template MailMerge.docx', 'Kết nối với data source Recipients.xlsx', 'Chèn trường FirstName và City', 'Hoàn tất merge và xem kết quả'], difficulty: 'Hard', done: false },
]

export const MOS_EXCEL_TASKS: MosTask[] = [
  { id: 1, title: 'Công thức cơ bản', description: 'Sử dụng SUM, AVERAGE, COUNT và IF trong bảng dữ liệu.', steps: ['Mở SalesData.xlsx', 'Tính tổng doanh thu trong ô B12 bằng SUM', 'Tính điểm trung bình trong ô C12 bằng AVERAGE', 'Thêm công thức IF để đánh dấu đạt/không đạt'], difficulty: 'Easy', done: false },
  { id: 2, title: 'Pivot Table', description: 'Tạo Pivot Table từ dữ liệu doanh số.', steps: ['Chọn vùng dữ liệu A1:E50', 'Vào Insert > PivotTable', 'Chọn "New Worksheet" và bấm OK', 'Kéo "Region" vào Rows, "Sales" vào Values'], difficulty: 'Medium', done: false },
  { id: 3, title: 'Biểu đồ & Định dạng', description: 'Tạo biểu đồ cột từ dữ liệu và định dạng theo yêu cầu.', steps: ['Chọn dữ liệu tháng và doanh thu', 'Chèn biểu đồ cột clustered', 'Đặt tiêu đề "Monthly Sales 2024"', 'Thay màu cột thành màu xanh dương'], difficulty: 'Medium', done: false },
]

export const MOS_PPT_TASKS: MosTask[] = [
  { id: 1, title: 'Slide Layout & Theme', description: 'Áp dụng theme và bố cục slide nhất quán cho toàn bộ bài thuyết trình.', steps: ['Mở Presentation.pptx', 'Áp dụng theme "Office Theme"', 'Đổi layout slide 2 thành "Two Content"', 'Chèn số trang cho tất cả slides'], difficulty: 'Easy', done: false },
  { id: 2, title: 'SmartArt & Animations', description: 'Thêm SmartArt và hiệu ứng chuyển slide.', steps: ['Chèn SmartArt dạng Hierarchy vào slide 3', 'Thêm 4 nút và nhập nội dung', 'Áp dụng animation Fly In cho SmartArt', 'Thêm transition Fade cho toàn bộ slides'], difficulty: 'Medium', done: false },
]

// ─── Band-specific skill sections ─────────────────────────────────────────────
// Each entry in the map contains ONLY the topics that are NEW / specific to that
// band level. Students do not see repeated basics from lower bands.
// topic_key mirrors the stable key sent to the backend (skill.topic-slug).

const mk = (
  id: EnglishSkill,
  label: string,
  icon: React.ReactNode,
  color: string,
  bg: string,
  topics: { title: string; desc: string; key: string; done: boolean }[],
  tips: string[],
): SkillSection => ({ id, label, icon, color, bg, topics: topics.map(({ key, ...t }) => ({ ...t, topicKey: key })), tips })

// ── IELTS ──────────────────────────────────────────────────────────────────────
// Band 4.0 — Foundation. Everything you need to first reach band 4.
const IELTS_SKILLS_4: SkillSection[] = [
  mk('grammar', 'Ngữ pháp', <Brain className="w-4 h-4" />, 'text-violet-600', 'bg-violet-50',
    [
      { key: 'grammar.12_tenses',       title: '12 Thì cơ bản', desc: 'Present/Past/Future – Simple, Continuous, Perfect', done: false },
      { key: 'grammar.articles',        title: 'Mạo từ (a/an/the/∅)', desc: 'Quy tắc dùng mạo từ trong câu', done: false },
      { key: 'grammar.subject_verb_agr',title: 'Subject-Verb Agreement', desc: 'Hòa hợp chủ ngữ và động từ', done: false },
      { key: 'grammar.simple_compound', title: 'Câu đơn & câu ghép', desc: 'Cấu trúc câu cơ bản với and/but/or/so', done: false },
      { key: 'grammar.basic_comparison',title: 'So sánh cơ bản', desc: 'Comparative & superlative adjectives/adverbs', done: false },
    ],
    ['Luyện viết 5 câu mỗi ngày với mỗi loại thì.', 'Dùng app grammar quiz để kiểm tra nhanh.']
  ),
  mk('vocabulary', 'Từ vựng', <BookMarked className="w-4 h-4" />, 'text-blue-600', 'bg-blue-50',
    [
      { key: 'vocab.everyday_2500',  title: 'Từ vựng đời thường (2,500 từ)', desc: 'Chủ đề: gia đình, du lịch, môi trường, sức khỏe', done: false },
      { key: 'vocab.word_families',  title: 'Word Families cơ bản', desc: 'Danh từ, động từ, tính từ, trạng từ cùng gốc', done: false },
      { key: 'vocab.basic_synonyms', title: 'Từ đồng nghĩa & trái nghĩa đơn giản', desc: 'Paraphrase ở mức cơ bản', done: false },
    ],
    ['Flashcard 10 từ mới mỗi ngày với Anki.', 'Học từ vựng theo chủ đề.']
  ),
  mk('listening', 'Nghe', <Headphones className="w-4 h-4" />, 'text-cyan-600', 'bg-cyan-50',
    [
      { key: 'listening.sec1_form',    title: 'Section 1 – Form Completion', desc: 'Điền form từ hội thoại đời thường', done: false },
      { key: 'listening.sec2_note',    title: 'Section 2 – Note/Map Basics', desc: 'Monologue xã hội: note completion + định hướng bản đồ cơ bản', done: false },
      { key: 'listening.note_symbols', title: 'Kỹ thuật nghe chi tiết', desc: 'Nhận diện spelling, number, date, distractors và paraphrase cơ bản', done: false },
    ],
    ['Nghe BBC World Service 15 phút/ngày.', 'Luyện dự đoán đáp án trước khi nghe.']
  ),
  mk('reading', 'Đọc', <Eye className="w-4 h-4" />, 'text-emerald-600', 'bg-emerald-50',
    [
      { key: 'reading.skim_scan',   title: 'Skimming & Scanning', desc: 'Đọc lướt lấy ý chính, tìm thông tin cụ thể', done: false },
      { key: 'reading.tfng',        title: 'True / False / Not Given', desc: 'Phân biệt T/F/NG theo bằng chứng trong bài', done: false },
      { key: 'reading.mcq_single',  title: 'Multiple Choice đơn giản', desc: 'Câu hỏi nhận biết thông tin trực tiếp', done: false },
    ],
    ['Đọc 1 bài báo tiếng Anh mỗi ngày.', 'Đọc câu hỏi trước khi đọc passage.']
  ),
  mk('writing', 'Viết', <PenLine className="w-4 h-4" />, 'text-orange-600', 'bg-orange-50',
    [
      { key: 'writing.task1_basic',  title: 'Task 1 – Biểu đồ đơn giản', desc: 'Mô tả bar chart / pie chart cơ bản', done: false },
      { key: 'writing.task2_intro',  title: 'Task 2 – Opinion Basics', desc: 'Mở bài/paraphrase đề, nêu thesis rõ ràng theo Task Response', done: false },
      { key: 'writing.paragraph_tp', title: 'Paragraph Control (TEEL)', desc: 'Topic sentence + explanation + example + link', done: false },
    ],
    ['Luyện Task 1 trong 20 phút mỗi ngày.', 'Nhờ AI hoặc thầy cô chấm bài.']
  ),
  mk('speaking', 'Nói', <Mic className="w-4 h-4" />, 'text-pink-600', 'bg-pink-50',
    [
      { key: 'speaking.part1_basics', title: 'Part 1 – Chủ đề quen thuộc', desc: 'Trả lời câu hỏi cá nhân: tên, sở thích, gia đình', done: false },
      { key: 'speaking.pronunciation',title: 'Pronunciation Foundations', desc: 'Word stress, chunking, intonation để tăng độ dễ hiểu', done: false },
    ],
    ['Ghi âm bản thân và so sánh với mẫu.', 'Tập nói 2 phút về 1 chủ đề mỗi ngày.']
  ),
]

// Band 5.0 — Intermediate. Only NEW content vs. Band 4.0.
const IELTS_SKILLS_5: SkillSection[] = [
  mk('grammar', 'Ngữ pháp', <Brain className="w-4 h-4" />, 'text-violet-600', 'bg-violet-50',
    [
      { key: 'grammar.passive_voice',   title: 'Câu bị động (Passive Voice)', desc: 'Passive trong các thì, by-phrase', done: false },
      { key: 'grammar.cond_1_2',        title: 'Câu điều kiện loại 1 & 2', desc: 'Real & Unreal conditionals', done: false },
      { key: 'grammar.relative_basic',  title: 'Mệnh đề quan hệ cơ bản', desc: 'Defining relative clauses (who/which/that)', done: false },
      { key: 'grammar.reported_basic',  title: 'Câu gián tiếp cơ bản', desc: 'Reported statements & questions', done: false },
    ],
    ['Luyện viết 5 câu bị động mỗi ngày.', 'Chú ý sự thay đổi thì trong reported speech.']
  ),
  mk('vocabulary', 'Từ vựng', <BookMarked className="w-4 h-4" />, 'text-blue-600', 'bg-blue-50',
    [
      { key: 'vocab.phrasal_verbs',     title: 'Phrasal Verbs phổ biến', desc: '100 phrasal verbs thông dụng nhất', done: false },
      { key: 'vocab.collocations_basic',title: 'Collocations cơ bản', desc: 'Verb-noun & adj-noun collocations thông dụng', done: false },
      { key: 'vocab.context_vocab',     title: 'Từ vựng trong ngữ cảnh', desc: 'Đọc hiểu nghĩa từ từ ngữ cảnh câu', done: false },
    ],
    ['Học phrasal verbs theo nhóm chủ đề.', 'Luyện dùng collocations khi viết.']
  ),
  mk('listening', 'Nghe', <Headphones className="w-4 h-4" />, 'text-cyan-600', 'bg-cyan-50',
    [
      { key: 'listening.sec3_conv',     title: 'Section 3 – Academic Discussion', desc: 'Hội thoại học thuật 2–3 người: MCQ, matching, table completion', done: false },
      { key: 'listening.paraphrase',    title: 'Paraphrase & Distractor', desc: 'Đối chiếu từ khóa câu hỏi với cách nói lại trong audio', done: false },
    ],
    ['Nghe TED-Ed Talks chủ đề giáo dục.', 'Làm bài với đồng hồ bấm giờ.']
  ),
  mk('reading', 'Đọc', <Eye className="w-4 h-4" />, 'text-emerald-600', 'bg-emerald-50',
    [
      { key: 'reading.match_headings',  title: 'Matching Headings', desc: 'Tóm tắt ý chính từng đoạn', done: false },
      { key: 'reading.summary_fill',   title: 'Summary Completion', desc: 'Điền từ vào đoạn tóm tắt', done: false },
    ],
    ['Đọc 2 passages mỗi ngày.', 'Tập paraphrase câu trong bài.']
  ),
  mk('writing', 'Viết', <PenLine className="w-4 h-4" />, 'text-orange-600', 'bg-orange-50',
    [
      { key: 'writing.task1_trend',     title: 'Task 1 – Biểu đồ có trend/comparison', desc: 'Mô tả xu hướng tăng giảm, so sánh 2+ dữ liệu', done: false },
      { key: 'writing.task2_4para',     title: 'Task 2 – Cấu trúc 4 đoạn', desc: 'Intro, Body 1, Body 2, Conclusion chuẩn', done: false },
      { key: 'writing.linkers_basic',   title: 'Cohesion cơ bản', desc: 'Dùng linking words hợp lý, tránh lạm dụng từ nối', done: false },
    ],
    ['Viết Task 2 trong 40 phút, luyện mỗi ngày.', 'Chú ý đảm bảo đủ 250 từ.']
  ),
  mk('speaking', 'Nói', <Mic className="w-4 h-4" />, 'text-pink-600', 'bg-pink-50',
    [
      { key: 'speaking.part2_cuecard',  title: 'Part 2 – Cue Card (2 phút)', desc: 'Chiến lược ghi chú 1 phút, nói đủ 2 phút', done: false },
      { key: 'speaking.extend_answers', title: 'Mở rộng câu trả lời', desc: 'Why/How/Example để tăng Fluency & Coherence', done: false },
    ],
    ['Luyện Part 2 với 1 cue card mỗi ngày.', 'Dùng PEEL để mở rộng ý.']
  ),
]

// Band 6.0 — Upper-intermediate. Only NEW content vs. Band 5.0.
const IELTS_SKILLS_6: SkillSection[] = [
  mk('grammar', 'Ngữ pháp', <Brain className="w-4 h-4" />, 'text-violet-600', 'bg-violet-50',
    [
      { key: 'grammar.cond_3_mixed',    title: 'Câu điều kiện loại 3 & Mixed', desc: 'Unreal past & mixed conditionals', done: false },
      { key: 'grammar.advanced_passive',title: 'Bị động nâng cao & Causative', desc: 'Have/get sth done, Complex passive structures', done: false },
      { key: 'grammar.adverbial_clauses',title: 'Mệnh đề trạng ngữ', desc: 'Time, Cause, Concession, Purpose clauses', done: false },
      { key: 'grammar.inversion_basic', title: 'Đảo ngữ cơ bản', desc: 'Never/Rarely/Not until + inversion', done: false },
    ],
    ['Luyện 3 cấu trúc nâng cao mỗi ngày.', 'Đọc essay mẫu Band 6–7 để học pattern.']
  ),
  mk('vocabulary', 'Từ vựng', <BookMarked className="w-4 h-4" />, 'text-blue-600', 'bg-blue-50',
    [
      { key: 'vocab.awl_570',           title: 'Academic Word List (AWL – 570 từ)', desc: 'Từ học thuật cốt lõi trong bài thi', done: false },
      { key: 'vocab.paraphrase_skills', title: 'Kỹ thuật Paraphrase', desc: 'Thay từ đồng nghĩa, đổi cấu trúc câu', done: false },
      { key: 'vocab.collocations_adv',  title: 'Collocations nâng cao', desc: 'Academic collocations thông dụng', done: false },
    ],
    ['Học 5 từ AWL mỗi ngày.', 'Luyện rewrite câu bằng từ đồng nghĩa.']
  ),
  mk('listening', 'Nghe', <Headphones className="w-4 h-4" />, 'text-cyan-600', 'bg-cyan-50',
    [
      { key: 'listening.sec4_lecture',  title: 'Section 4 – Academic Lecture', desc: 'Monologue học thuật tốc độ cao', done: false },
      { key: 'listening.map_plan',      title: 'Map/Plan/Diagram Labelling', desc: 'Bám theo direction language, orientation và landmark', done: false },
    ],
    ['Nghe TED Talks học thuật mỗi ngày.', 'Tập dự đoán từ qua context.']
  ),
  mk('reading', 'Đọc', <Eye className="w-4 h-4" />, 'text-emerald-600', 'bg-emerald-50',
    [
      { key: 'reading.match_info',      title: 'Matching Information', desc: 'Tìm đoạn chứa thông tin cụ thể', done: false },
      { key: 'reading.writer_views',    title: "Identifying Writer's Views", desc: 'YES/NO/NG – quan điểm tác giả', done: false },
      { key: 'reading.sentence_endings',title: 'Sentence Endings', desc: 'Ghép vế câu phù hợp', done: false },
    ],
    ['Đọc 3 passages / 1 giờ mỗi ngày.', 'Chú ý từ chỉ thái độ của tác giả.']
  ),
  mk('writing', 'Viết', <PenLine className="w-4 h-4" />, 'text-orange-600', 'bg-orange-50',
    [
      { key: 'writing.task2_balanced',  title: 'Task 2 – Lập luận cân bằng', desc: 'Discussion essay: both sides + opinion', done: false },
      { key: 'writing.cohesion_adv',    title: 'Coherence & Paragraph Logic', desc: 'Reference/substitution + phát triển luận điểm mạch lạc', done: false },
      { key: 'writing.academic_style',  title: 'Lexical Resource học thuật', desc: 'Paraphrase chính xác, collocation tự nhiên, giảm lỗi word choice', done: false },
    ],
    ['Luyện 1 Task 2 mỗi ngày, nhận feedback.', 'Đọc IELTS Band 7 sample essays.']
  ),
  mk('speaking', 'Nói', <Mic className="w-4 h-4" />, 'text-pink-600', 'bg-pink-50',
    [
      { key: 'speaking.part3_abstract', title: 'Part 3 – Câu hỏi trừu tượng', desc: 'Lập luận có ví dụ, đồng ý/phản đối', done: false },
      { key: 'speaking.develop_ideas',  title: 'Phát triển ý có chiều sâu', desc: 'Point-Reason-Example-Result để tăng điểm Fluency/LR/GRA', done: false },
    ],
    ['Luyện Part 3 với câu hỏi từ topic cards.', 'Tự hỏi và trả lời to trong 5 phút.']
  ),
]

// Band 6.5 — Only NEW content vs. Band 6.0.
const IELTS_SKILLS_65: SkillSection[] = [
  mk('grammar', 'Ngữ pháp', <Brain className="w-4 h-4" />, 'text-violet-600', 'bg-violet-50',
    [
      { key: 'grammar.cleft_sentences', title: 'Cleft sentences', desc: 'It is/was… that… | What… is/was…', done: false },
      { key: 'grammar.nominalization',  title: 'Nominalization cơ bản', desc: 'Chuyển động từ/tính từ sang danh từ', done: false },
      { key: 'grammar.ellipsis_subst',  title: 'Ellipsis & Substitution', desc: 'Lược bỏ và thay thế để tránh lặp', done: false },
    ],
    ['Tập viết lại câu dùng cleft structure.', 'Đọc academic articles chú ý nominalization.']
  ),
  mk('vocabulary', 'Từ vựng', <BookMarked className="w-4 h-4" />, 'text-blue-600', 'bg-blue-50',
    [
      { key: 'vocab.idioms_100',        title: 'Idioms thông dụng (100 cụm)', desc: 'Thành ngữ phù hợp cho Speaking Part 3', done: false },
      { key: 'vocab.register_shifts',   title: 'Nuance & Register', desc: 'Phân biệt formal/informal, neutral/subjective', done: false },
      { key: 'vocab.topic_specific',    title: 'Từ vựng chuyên biệt theo chủ đề', desc: 'Technology, Society, Education, Environment (advanced)', done: false },
    ],
    ['Học 3 idioms mới mỗi ngày với ví dụ thực tế.', 'Chú ý register khi viết Task 2.']
  ),
  mk('listening', 'Nghe', <Headphones className="w-4 h-4" />, 'text-cyan-600', 'bg-cyan-50',
    [
      { key: 'listening.attitude',      title: 'Nhận diện thái độ & ý kiến', desc: 'Speaker attitude, agreement/disagreement', done: false },
      { key: 'listening.multi_level',   title: 'Multi-level Inference', desc: 'Suy luận từ điều chưa nói thẳng', done: false },
    ],
    ['Nghe podcast học thuật ngắn + viết tóm tắt.', 'Luyện nhận ra giọng điệu của speaker.']
  ),
  mk('reading', 'Đọc', <Eye className="w-4 h-4" />, 'text-emerald-600', 'bg-emerald-50',
    [
      { key: 'reading.inference',       title: 'Inference & Implied Meaning', desc: 'Đọc hiểu nội dung không nói thẳng', done: false },
      { key: 'reading.purpose_tone',    title: 'Author Purpose & Tone', desc: 'Nhận ra mục đích và giọng điệu tác giả', done: false },
    ],
    ['Đọc bài phân tích học thuật và tóm tắt luận điểm.']
  ),
  mk('writing', 'Viết', <PenLine className="w-4 h-4" />, 'text-orange-600', 'bg-orange-50',
    [
      { key: 'writing.adv_linkers',     title: 'Cohesive Devices nâng cao', desc: 'Liên kết logic tự nhiên theo tiêu chí Coherence & Cohesion', done: false },
      { key: 'writing.precision_vocab', title: 'Lexical Precision trong Task 2', desc: 'Dùng từ chính xác ngữ cảnh, kiểm soát collocation', done: false },
    ],
    ['Rewrite essay mẫu Band 6 → nâng lên Band 6.5.']
  ),
  mk('speaking', 'Nói', <Mic className="w-4 h-4" />, 'text-pink-600', 'bg-pink-50',
    [
      { key: 'speaking.lexical_variety',title: 'Lexical Variety', desc: 'Dùng từ phong phú, tránh lặp', done: false },
      { key: 'speaking.cohesion',       title: 'Cohesion trong Long Turn', desc: 'Kết nối ý mượt mà, discourse markers', done: false },
    ],
    ['Ghi âm và đếm số lần lặp từ → thay thế.']
  ),
]

// Band 7.0 — Advanced. Only NEW content vs. Band 6.5.
const IELTS_SKILLS_7: SkillSection[] = [
  mk('grammar', 'Ngữ pháp', <Brain className="w-4 h-4" />, 'text-violet-600', 'bg-violet-50',
    [
      { key: 'grammar.advanced_inversion',title: 'Đảo ngữ nâng cao', desc: 'Fronting, Emphatic inversion patterns', done: false },
      { key: 'grammar.subjunctive',        title: 'Subjunctive Mood', desc: 'It is essential that…, If only…, Were it not…', done: false },
      { key: 'grammar.complex_nominals',  title: 'Complex Sentence Control', desc: 'Mệnh đề phức linh hoạt, giảm lỗi ngữ pháp lặp lại', done: false },
    ],
    ['Viết luận học thuật dùng 3 cấu trúc nâng cao/đoạn.']
  ),
  mk('vocabulary', 'Từ vựng', <BookMarked className="w-4 h-4" />, 'text-blue-600', 'bg-blue-50',
    [
      { key: 'vocab.awl_advanced',      title: 'AWL nâng cao + Topic Lexicon', desc: 'Từ học thuật C1 theo chủ đề Education/Technology/Environment', done: false },
      { key: 'vocab.metaphor_idiom',    title: 'Collocation & Nuance Control', desc: 'Dùng cụm từ tự nhiên, tránh idiom gượng ép trong Writing', done: false },
    ],
    ['Đọc tạp chí học thuật và highlight C1 vocabulary.']
  ),
  mk('listening', 'Nghe', <Headphones className="w-4 h-4" />, 'text-cyan-600', 'bg-cyan-50',
    [
      { key: 'listening.nuanced_attitude',title: 'Thái độ tinh tế của speaker', desc: 'Scepticism, enthusiasm, concern – phân biệt qua intonation', done: false },
    ],
    ['Nghe academic debates – BBC In Our Time, Thinking Allowed.']
  ),
  mk('reading', 'Đọc', <Eye className="w-4 h-4" />, 'text-emerald-600', 'bg-emerald-50',
    [
      { key: 'reading.critical_analysis',title: 'Critical Analysis', desc: 'Đánh giá độ tin cậy và logic của lập luận', done: false },
      { key: 'reading.implicit_argument',title: 'Implicit Argument Structure', desc: 'Tìm luận điểm ẩn, presuppositions', done: false },
    ],
    ['Đọc 1 journal article/tuần, viết critical review 150 từ.']
  ),
  mk('writing', 'Viết', <PenLine className="w-4 h-4" />, 'text-orange-600', 'bg-orange-50',
    [
      { key: 'writing.sophisticated_arg',title: 'Task Response nâng cao', desc: 'Counterargument + refutation, lập luận nhất quán toàn bài', done: false },
      { key: 'writing.native_style',     title: 'Style tự nhiên nhưng học thuật', desc: 'Natural phrasing, tránh template cứng và lỗi register', done: false },
    ],
    ['Nhờ bản ngữ hoặc Band 8+ chấm bài và nhận xét.']
  ),
  mk('speaking', 'Nói', <Mic className="w-4 h-4" />, 'text-pink-600', 'bg-pink-50',
    [
      { key: 'speaking.fluency_strategy',title: 'Chiến lược Fluency', desc: 'Strategic pausing, repair strategies, fillers tự nhiên', done: false },
      { key: 'speaking.pronunciation_adv',title: 'Pronunciation Band 7+', desc: 'Linking, weak forms, stress/intonation để tăng intelligibility', done: false },
    ],
    ['Ghi âm, tự so sánh với mẫu Band 7 speaking.']
  ),
]

// Band 7.5+ — Expert. Only the marginal improvement over Band 7.0.
const IELTS_SKILLS_75: SkillSection[] = [
  mk('grammar', 'Ngữ pháp', <Brain className="w-4 h-4" />, 'text-violet-600', 'bg-violet-50',
    [
      { key: 'grammar.discourse_org',   title: 'Discourse Organisation', desc: 'Macro-structure of academic texts', done: false },
      { key: 'grammar.pragmatic_lang',  title: 'Ngôn ngữ Ngữ dụng học', desc: 'Hedging, modality, stance markers', done: false },
    ],
    ['Phân tích cấu trúc bài mẫu Band 8–9.']
  ),
  mk('vocabulary', 'Từ vựng', <BookMarked className="w-4 h-4" />, 'text-blue-600', 'bg-blue-50',
    [
      { key: 'vocab.c1_precision',      title: 'C1 Precision & Flexibility', desc: 'Chọn từ/cụm từ chính xác theo ngữ cảnh học thuật', done: false },
      { key: 'vocab.advanced_idioms',   title: 'Natural Collocations', desc: 'Ưu tiên collocation tự nhiên thay vì lạm dụng idioms', done: false },
    ],
    ['Đọc editorial & opinion journalism, note đặc trưng ngôn ngữ.']
  ),
  mk('listening', 'Nghe', <Headphones className="w-4 h-4" />, 'text-cyan-600', 'bg-cyan-50',
    [
      { key: 'listening.rapid_accents', title: 'Accent đa dạng tốc độ cao', desc: 'Native-speed British, Australian, Scottish, Irish', done: false },
    ],
    ['Nghe unscripted native conversations (podcasts không có script).']
  ),
  mk('reading', 'Đọc', <Eye className="w-4 h-4" />, 'text-emerald-600', 'bg-emerald-50',
    [
      { key: 'reading.speed_retention', title: 'Timed Reading Accuracy', desc: 'Giữ độ chính xác cao dưới áp lực thời gian bài thi thật', done: false },
    ],
    ['Tập đọc nhanh với bài Cambridge IELTS 18–19.']
  ),
  mk('writing', 'Viết', <PenLine className="w-4 h-4" />, 'text-orange-600', 'bg-orange-50',
    [
      { key: 'writing.persuasive_adv',  title: 'Band 8 Writing Control', desc: 'Task response sâu, cohesion tự nhiên, lỗi ngữ pháp tối thiểu', done: false },
      { key: 'writing.register_mastery',title: 'Register Mastery', desc: 'Điều chỉnh giọng văn chuẩn học thuật cho từng dạng Task 1/2', done: false },
    ],
    ['Nghiên cứu IELTS Band 9 writing samples và phân tích từng câu.']
  ),
  mk('speaking', 'Nói', <Mic className="w-4 h-4" />, 'text-pink-600', 'bg-pink-50',
    [
      { key: 'speaking.natural_fluency',title: 'Band 8 Speaking Performance', desc: 'Fluency linh hoạt, lexical resource rộng, pronunciation rõ và tự nhiên', done: false },
    ],
    ['Tham gia English club hoặc online conversation exchange.']
  ),
]

export const IELTS_SKILLS_BY_BAND: Record<IeltsBand, SkillSection[]> = {
  '4.0': IELTS_SKILLS_4,
  '5.0': IELTS_SKILLS_5,
  '6.0': IELTS_SKILLS_6,
  '6.5': IELTS_SKILLS_65,
  '7.0': IELTS_SKILLS_7,
  '7.5+': IELTS_SKILLS_75,
}

// ── Temporary runtime source for CertificateDetail (IELTS, 4 core skills) ───
// This replaces old mixed mock tracks (grammar/vocabulary) while backend skill APIs
// are being finalized.
export const IELTS_SKILL_TRACKS_TEMP_BY_BAND: Record<IeltsBand, SkillSection[]> = {
  '4.0': [
    mk('listening', 'Listening', <Headphones className="w-4 h-4" />, 'text-cyan-600', 'bg-cyan-50', [
      { key: 'listening.sec1_form', title: 'Section 1 Form Completion', desc: 'Thông tin cá nhân, spelling, số liệu cơ bản', done: false },
      { key: 'listening.sec2_note', title: 'Section 2 Note Completion', desc: 'Monologue xã hội + định hướng thông tin chính', done: false },
    ], ['Luyện nghe theo transcript rồi bỏ transcript.', 'Tập bắt keyword trước khi nghe.']),
    mk('reading', 'Reading', <Eye className="w-4 h-4" />, 'text-emerald-600', 'bg-emerald-50', [
      { key: 'reading.skim_scan', title: 'Skimming & Scanning', desc: 'Đọc nhanh để lấy ý chính và tìm dữ liệu cụ thể', done: false },
      { key: 'reading.tfng', title: 'True/False/Not Given', desc: 'Phân biệt đúng theo evidence trong bài', done: false },
    ], ['Không dịch từng từ khi làm bài.', 'Đọc câu hỏi trước rồi vào passage.']),
    mk('writing', 'Writing', <PenLine className="w-4 h-4" />, 'text-orange-600', 'bg-orange-50', [
      { key: 'writing.task1_basic', title: 'Task 1 Basics', desc: 'Mô tả biểu đồ đơn giản có overview', done: false },
      { key: 'writing.task2_intro', title: 'Task 2 Introduction', desc: 'Paraphrase đề + thesis rõ ràng', done: false },
    ], ['Giữ đúng thời gian: 20 phút Task 1, 40 phút Task 2.', 'Ưu tiên rõ ý trước khi dùng từ khó.']),
    mk('speaking', 'Speaking', <Mic className="w-4 h-4" />, 'text-pink-600', 'bg-pink-50', [
      { key: 'speaking.part1_basics', title: 'Part 1 Foundation', desc: 'Trả lời tự nhiên chủ đề quen thuộc', done: false },
      { key: 'speaking.pronunciation', title: 'Pronunciation Foundation', desc: 'Stress + intonation để dễ hiểu', done: false },
    ], ['Ghi âm mỗi ngày 2–3 câu trả lời ngắn.', 'Trả lời đủ 2–3 câu cho mỗi câu hỏi.']),
  ],
  '5.0': [
    mk('listening', 'Listening', <Headphones className="w-4 h-4" />, 'text-cyan-600', 'bg-cyan-50', [
      { key: 'listening.sec3_conv', title: 'Section 3 Academic Discussion', desc: '2–3 speakers, matching/MCQ', done: false },
      { key: 'listening.paraphrase', title: 'Paraphrase Matching', desc: 'Nhận diện cách nói lại từ khóa câu hỏi', done: false },
    ], ['Dự đoán dạng từ trước khoảng trống.', 'Chú ý distractor words trong audio.']),
    mk('reading', 'Reading', <Eye className="w-4 h-4" />, 'text-emerald-600', 'bg-emerald-50', [
      { key: 'reading.match_headings', title: 'Matching Headings', desc: 'Nắm main idea từng đoạn', done: false },
      { key: 'reading.summary_fill', title: 'Summary Completion', desc: 'Điền từ dựa theo giới hạn số từ', done: false },
    ], ['Khoanh vùng đoạn chứa keyword.', 'Kiểm tra grammar khi điền từ.']),
    mk('writing', 'Writing', <PenLine className="w-4 h-4" />, 'text-orange-600', 'bg-orange-50', [
      { key: 'writing.task1_trend', title: 'Task 1 Trend & Comparison', desc: 'So sánh dữ liệu + xu hướng rõ ràng', done: false },
      { key: 'writing.task2_4para', title: 'Task 2 4-Paragraph Structure', desc: 'Mở-thân-thân-kết mạch lạc', done: false },
    ], ['Mỗi đoạn thân có 1 luận điểm chính.', 'Không học thuộc template dài.']),
    mk('speaking', 'Speaking', <Mic className="w-4 h-4" />, 'text-pink-600', 'bg-pink-50', [
      { key: 'speaking.part2_cuecard', title: 'Part 2 Cue Card', desc: '1 phút chuẩn bị, nói đủ 2 phút', done: false },
      { key: 'speaking.extend_answers', title: 'Answer Expansion', desc: 'Why-Example-Result để tăng coherence', done: false },
    ], ['Dùng từ nối tự nhiên khi chuyển ý.', 'Giữ tốc độ nói ổn định, không quá nhanh.']),
  ],
  '6.0': [
    mk('listening', 'Listening', <Headphones className="w-4 h-4" />, 'text-cyan-600', 'bg-cyan-50', [
      { key: 'listening.sec4_lecture', title: 'Section 4 Lecture', desc: 'Bài giảng học thuật tốc độ cao', done: false },
      { key: 'listening.map_plan', title: 'Map/Plan/Diagram', desc: 'Theo dõi hướng đi và mốc vị trí chính xác', done: false },
    ], ['Làm full section theo thời gian thật.', 'Review lỗi theo từng dạng câu.']),
    mk('reading', 'Reading', <Eye className="w-4 h-4" />, 'text-emerald-600', 'bg-emerald-50', [
      { key: 'reading.match_info', title: 'Matching Information', desc: 'Ghép thông tin với đoạn phù hợp', done: false },
      { key: 'reading.writer_views', title: "Writer's Views (Yes/No/NG)", desc: 'Phân biệt quan điểm tác giả chính xác', done: false },
    ], ['Mỗi passage tối đa ~20 phút.', 'Không suy diễn ngoài văn bản.']),
    mk('writing', 'Writing', <PenLine className="w-4 h-4" />, 'text-orange-600', 'bg-orange-50', [
      { key: 'writing.task2_balanced', title: 'Task 2 Balanced Argument', desc: 'Trình bày hai mặt + opinion rõ', done: false },
      { key: 'writing.cohesion_adv', title: 'Coherence & Cohesion', desc: 'Liên kết ý tự nhiên, tránh máy móc', done: false },
    ], ['Đối chiếu bài với 4 tiêu chí chấm IELTS.', 'Ưu tiên clarity trước lexical complexity.']),
    mk('speaking', 'Speaking', <Mic className="w-4 h-4" />, 'text-pink-600', 'bg-pink-50', [
      { key: 'speaking.part3_abstract', title: 'Part 3 Abstract Questions', desc: 'Phân tích và so sánh quan điểm', done: false },
      { key: 'speaking.develop_ideas', title: 'Develop Ideas Deeply', desc: 'Point-Reason-Example-Result', done: false },
    ], ['Tập trả lời câu hỏi “tại sao” liên tiếp.', 'Luôn có ví dụ thực tế ngắn.']),
  ],
  '6.5': [
    mk('listening', 'Listening', <Headphones className="w-4 h-4" />, 'text-cyan-600', 'bg-cyan-50', [
      { key: 'listening.attitude', title: 'Speaker Attitude', desc: 'Nhận diện thái độ, mức độ đồng thuận', done: false },
      { key: 'listening.multi_level', title: 'Multi-level Inference', desc: 'Suy luận ý không nói trực tiếp', done: false },
    ], ['Gạch chân dấu hiệu attitude trong transcript.', 'Review lỗi inference ngay sau mỗi test.']),
    mk('reading', 'Reading', <Eye className="w-4 h-4" />, 'text-emerald-600', 'bg-emerald-50', [
      { key: 'reading.inference', title: 'Inference Questions', desc: 'Suy luận hợp lý theo bằng chứng', done: false },
      { key: 'reading.purpose_tone', title: 'Purpose & Tone', desc: 'Xác định mục đích và giọng điệu tác giả', done: false },
    ], ['Luyện đọc opinion/editorial passages.', 'Tách fact và opinion khi đọc.']),
    mk('writing', 'Writing', <PenLine className="w-4 h-4" />, 'text-orange-600', 'bg-orange-50', [
      { key: 'writing.adv_linkers', title: 'Advanced Cohesive Devices', desc: 'Dùng cohesive devices linh hoạt, tự nhiên', done: false },
      { key: 'writing.precision_vocab', title: 'Lexical Precision', desc: 'Tăng độ chính xác từ vựng theo ngữ cảnh', done: false },
    ], ['Giảm lỗi collocation sai.', 'Kiểm tra từng đoạn có main point rõ.']),
    mk('speaking', 'Speaking', <Mic className="w-4 h-4" />, 'text-pink-600', 'bg-pink-50', [
      { key: 'speaking.lexical_variety', title: 'Lexical Variety', desc: 'Mở rộng range từ vựng không gượng ép', done: false },
      { key: 'speaking.cohesion', title: 'Long-turn Cohesion', desc: 'Giữ mạch ý trong câu trả lời dài', done: false },
    ], ['Hạn chế lặp từ khóa quá nhiều.', 'Tập paraphrase ngay khi bí từ.']),
  ],
  '7.0': [
    mk('listening', 'Listening', <Headphones className="w-4 h-4" />, 'text-cyan-600', 'bg-cyan-50', [
      { key: 'listening.nuanced_attitude', title: 'Nuanced Attitude', desc: 'Nhận ra thái độ tinh tế qua intonation/word choice', done: false },
      { key: 'listening.sec4_lecture', title: 'Advanced Section 4 Timing', desc: 'Giữ accuracy ở tốc độ cao', done: false },
    ], ['Tập full listening test định kỳ.', 'Phân tích lỗi theo 4 sections.']),
    mk('reading', 'Reading', <Eye className="w-4 h-4" />, 'text-emerald-600', 'bg-emerald-50', [
      { key: 'reading.critical_analysis', title: 'Critical Analysis', desc: 'Đánh giá logic và độ tin cậy lập luận', done: false },
      { key: 'reading.implicit_argument', title: 'Implicit Argument', desc: 'Nhận diện luận điểm ẩn và presupposition', done: false },
    ], ['Luyện passage khó Cambridge với timer.', 'Đọc lại sai lầm theo question type.']),
    mk('writing', 'Writing', <PenLine className="w-4 h-4" />, 'text-orange-600', 'bg-orange-50', [
      { key: 'writing.sophisticated_arg', title: 'Sophisticated Argument', desc: 'Lập luận sâu, có phản biện và phản bác', done: false },
      { key: 'writing.native_style', title: 'Natural Academic Style', desc: 'Văn phong học thuật tự nhiên, không template', done: false },
    ], ['Đảm bảo consistency thesis toàn bài.', 'Rà lỗi grammar range trước khi nộp.']),
    mk('speaking', 'Speaking', <Mic className="w-4 h-4" />, 'text-pink-600', 'bg-pink-50', [
      { key: 'speaking.fluency_strategy', title: 'Fluency Strategy', desc: 'Kiểm soát nhịp nói, pause và self-repair', done: false },
      { key: 'speaking.pronunciation_adv', title: 'Advanced Pronunciation', desc: 'Stress/intonation rõ, tự nhiên, dễ hiểu', done: false },
    ], ['Tập part 3 theo chủ đề xã hội rộng.', 'Nghe lại recording để sửa hesitation.']),
  ],
  '7.5+': [
    mk('listening', 'Listening', <Headphones className="w-4 h-4" />, 'text-cyan-600', 'bg-cyan-50', [
      { key: 'listening.rapid_accents', title: 'Rapid Accents', desc: 'Làm quen đa accent ở tốc độ native', done: false },
      { key: 'listening.nuanced_attitude', title: 'High-level Nuance', desc: 'Suy luận tầng nghĩa và thái độ tinh tế', done: false },
    ], ['Nghe nguồn không script để tăng phản xạ.', 'Đánh giá lỗi theo keyword missed.']),
    mk('reading', 'Reading', <Eye className="w-4 h-4" />, 'text-emerald-600', 'bg-emerald-50', [
      { key: 'reading.speed_retention', title: 'Timed Reading Accuracy', desc: 'Giữ tốc độ + accuracy ổn định toàn bài', done: false },
      { key: 'reading.critical_analysis', title: 'Advanced Critical Reading', desc: 'Phân tích lập luận sâu ở passage khó', done: false },
    ], ['Mỗi tuần 2 full reading tests.', 'Review theo rubric cá nhân.']),
    mk('writing', 'Writing', <PenLine className="w-4 h-4" />, 'text-orange-600', 'bg-orange-50', [
      { key: 'writing.persuasive_adv', title: 'Band 8 Writing Control', desc: 'Task response sâu + coherence tự nhiên', done: false },
      { key: 'writing.register_mastery', title: 'Register Mastery', desc: 'Điều chỉnh giọng văn linh hoạt theo task', done: false },
    ], ['Giảm lỗi grammar nhỏ xuống mức tối thiểu.', 'Đảm bảo lexical choices chính xác và tự nhiên.']),
    mk('speaking', 'Speaking', <Mic className="w-4 h-4" />, 'text-pink-600', 'bg-pink-50', [
      { key: 'speaking.natural_fluency', title: 'Band 8 Speaking Performance', desc: 'Fluency linh hoạt, mở rộng ý thuyết phục', done: false },
      { key: 'speaking.pronunciation_adv', title: 'Pronunciation Consistency', desc: 'Nhất quán clarity trong mọi part', done: false },
    ], ['Mô phỏng thi thật 3 part liên tục.', 'Tập phản biện nhanh với câu hỏi bất ngờ.']),
  ],
}

export const IELTS_ROADMAP_TEMP_BY_BAND: Record<IeltsBand, RoadmapStep[]> = {
  '4.0': [
    { title: 'Listening Foundation', subtitle: 'Section 1-2 + thông tin chi tiết cơ bản', status: 'in-progress', progress: 25 },
    { title: 'Reading Foundation', subtitle: 'Skimming/scanning + TFNG', status: 'locked' },
    { title: 'Writing Foundation', subtitle: 'Task 1 cơ bản + Task 2 intro', status: 'locked' },
    { title: 'Speaking Foundation', subtitle: 'Part 1 + pronunciation dễ hiểu', status: 'locked' },
  ],
  '5.0': [
    { title: 'Listening Development', subtitle: 'Section 3 + paraphrase/distractor control', status: 'in-progress', progress: 20 },
    { title: 'Reading Development', subtitle: 'Matching headings + summary completion', status: 'locked' },
    { title: 'Writing Development', subtitle: 'Task 1 trends + Task 2 4-paragraph', status: 'locked' },
    { title: 'Speaking Development', subtitle: 'Part 2 cue card + idea expansion', status: 'locked' },
  ],
  '6.0': [
    { title: 'Listening Core', subtitle: 'Section 4 + map/diagram under time pressure', status: 'in-progress', progress: 15 },
    { title: 'Reading Core', subtitle: "Matching info + writer's views", status: 'locked' },
    { title: 'Writing Core', subtitle: 'Balanced argument + coherence control', status: 'locked' },
    { title: 'Speaking Core', subtitle: 'Part 3 abstract reasoning', status: 'locked' },
  ],
  '6.5': [
    { title: 'Listening Upgrade', subtitle: 'Attitude + multi-level inference', status: 'in-progress', progress: 12 },
    { title: 'Reading Upgrade', subtitle: 'Inference + author purpose/tone', status: 'locked' },
    { title: 'Writing Upgrade', subtitle: 'Lexical precision + cohesive devices', status: 'locked' },
    { title: 'Speaking Upgrade', subtitle: 'Lexical variety + long-turn cohesion', status: 'locked' },
  ],
  '7.0': [
    { title: 'Listening Advanced', subtitle: 'Nuanced attitude at high speed', status: 'in-progress', progress: 10 },
    { title: 'Reading Advanced', subtitle: 'Critical analysis + implicit argument', status: 'locked' },
    { title: 'Writing Advanced', subtitle: 'Sophisticated argument + natural style', status: 'locked' },
    { title: 'Speaking Advanced', subtitle: 'Fluency strategy + pronunciation control', status: 'locked' },
  ],
  '7.5+': [
    { title: 'Listening Expert', subtitle: 'Rapid accents + layered inference', status: 'in-progress', progress: 8 },
    { title: 'Reading Expert', subtitle: 'Timed high-accuracy performance', status: 'locked' },
    { title: 'Writing Expert', subtitle: 'Band 8 control + register mastery', status: 'locked' },
    { title: 'Speaking Expert', subtitle: 'Band 8 natural fluency consistency', status: 'locked' },
  ],
}

// ── TOEIC ──────────────────────────────────────────────────────────────────────
// Band 350–495 — Foundation.
const TOEIC_SKILLS_350: SkillSection[] = [
  mk('grammar', 'Ngữ pháp', <Brain className="w-4 h-4" />, 'text-violet-600', 'bg-violet-50',
    [
      { key: 'grammar.verb_tenses_basic',  title: 'Thì động từ cơ bản (Part 5)', desc: 'Simple present/past/future, Present continuous', done: false },
      { key: 'grammar.articles_pron',      title: 'Mạo từ & Đại từ nhân xưng', desc: 'a/an/the, subject/object pronouns', done: false },
      { key: 'grammar.comparison_basic',   title: 'So sánh cơ bản', desc: 'Comparative, superlative adjectives & adverbs', done: false },
    ],
    ['Làm 10 câu Part 5 mỗi ngày.', 'Chú ý nhận dạng loại từ cần điền (noun/verb/adj/adv).']
  ),
  mk('vocabulary', 'Từ vựng', <BookMarked className="w-4 h-4" />, 'text-blue-600', 'bg-blue-50',
    [
      { key: 'vocab.office_basics_1000',  title: 'Từ vựng văn phòng cơ bản (1,000 từ)', desc: 'Meeting, email, schedule, colleague, document', done: false },
      { key: 'vocab.greetings_intro',     title: 'Greeting & Introduction', desc: 'Giao tiếp xã giao văn phòng cơ bản', done: false },
    ],
    ['Học 10 từ/ngày theo nhóm chủ đề.', 'Luyện dùng từ trong câu ví dụ thực tế.']
  ),
  mk('listening', 'Nghe (L)', <Headphones className="w-4 h-4" />, 'text-cyan-600', 'bg-cyan-50',
    [
      { key: 'listening.part1_photos',    title: 'Part 1 – Photographs (6 ảnh)', desc: 'Chọn câu mô tả đúng nhất bức ảnh', done: false },
      { key: 'listening.part2_q_r',       title: 'Part 2 – Question-Response (25 câu)', desc: 'Chọn phản hồi phù hợp nhất', done: false },
    ],
    ['Tập chú ý chủ ngữ & động từ trong Part 1.', 'Loại trừ đáp án có từ âm thanh giống nhau (sound trap).']
  ),
  mk('reading', 'Đọc (R)', <Eye className="w-4 h-4" />, 'text-emerald-600', 'bg-emerald-50',
    [
      { key: 'reading.part5_basic',       title: 'Part 5 – Câu điền từ cơ bản', desc: 'Nhận diện loại từ và nghĩa phù hợp', done: false },
    ],
    ['Đọc từ cuối câu để xác định vị trí cần điền.', 'Làm 20 câu Part 5 mỗi ngày.']
  ),
  mk('writing', 'Writing (SW)', <PenLine className="w-4 h-4" />, 'text-orange-600', 'bg-orange-50',
    [
      { key: 'writing.sw_part1_photo',    title: 'SW Part 1 – Photo Description', desc: 'Viết 1 câu chuẩn mô tả hành động trong ảnh', done: false },
    ],
    ['Dùng cấu trúc "Subject + is/are + V-ing + location."']
  ),
  mk('speaking', 'Speaking (SW)', <Mic className="w-4 h-4" />, 'text-pink-600', 'bg-pink-50',
    [
      { key: 'speaking.sw_read_aloud',    title: 'SW Part 1 – Read Aloud', desc: 'Đọc to đoạn văn ngắn, phát âm rõ ràng', done: false },
    ],
    ['Luyện đọc to 5 phút/ngày, chú ý word stress.']
  ),
]

// Band 500–599 — Lower-intermediate. Only NEW vs. 350–495.
const TOEIC_SKILLS_500: SkillSection[] = [
  mk('grammar', 'Ngữ pháp', <Brain className="w-4 h-4" />, 'text-violet-600', 'bg-violet-50',
    [
      { key: 'grammar.perfect_tenses',    title: 'Thì hoàn thành (Part 5–6)', desc: 'Present perfect & past perfect trong ngữ cảnh business', done: false },
      { key: 'grammar.cond1_business',    title: 'Câu điều kiện loại 1 – Business', desc: 'If the order arrives…, unless payment is made…', done: false },
      { key: 'grammar.rel_clauses',       title: 'Mệnh đề quan hệ giản đơn', desc: 'who/which/that trong business context', done: false },
    ],
    ['Chú ý thì hoàn thành trong Part 6 text completion.']
  ),
  mk('vocabulary', 'Từ vựng', <BookMarked className="w-4 h-4" />, 'text-blue-600', 'bg-blue-50',
    [
      { key: 'vocab.business_b1_2500',    title: 'Business vocabulary B1 (2,500 từ)', desc: 'Invoice, purchase order, shipment, deadline, contract', done: false },
      { key: 'vocab.email_vocab',         title: 'Từ vựng Email & Memo', desc: 'Regarding, attached, please find, kindly', done: false },
    ],
    ['Đọc email doanh nghiệp thực tế mỗi ngày.']
  ),
  mk('listening', 'Nghe (L)', <Headphones className="w-4 h-4" />, 'text-cyan-600', 'bg-cyan-50',
    [
      { key: 'listening.part3_short',     title: 'Part 3 – Hội thoại ngắn', desc: 'Conversations 2 người, 3 câu hỏi/đoạn', done: false },
      { key: 'listening.part4_short',     title: 'Part 4 – Monologue ngắn', desc: 'Announcements, messages, ads', done: false },
    ],
    ['Đọc câu hỏi Part 3&4 trước khi audio bắt đầu.']
  ),
  mk('reading', 'Đọc (R)', <Eye className="w-4 h-4" />, 'text-emerald-600', 'bg-emerald-50',
    [
      { key: 'reading.part6_text_comp',   title: 'Part 6 – Text Completion', desc: 'Điền từ/câu vào email, thông báo văn phòng', done: false },
      { key: 'reading.part7_single',      title: 'Part 7 – Single Passage', desc: 'Email, article, form – 2–4 câu hỏi/bài', done: false },
    ],
    ['Đọc bài từ cuối câu hỏi để biết cần tìm gì.']
  ),
  mk('writing', 'Writing (SW)', <PenLine className="w-4 h-4" />, 'text-orange-600', 'bg-orange-50',
    [
      { key: 'writing.sw_email_basic',    title: 'SW Part 2 – Email Response cơ bản', desc: 'Trả lời 3 câu hỏi trong email với 3 đoạn rõ ràng', done: false },
    ],
    ['Dùng cấu trúc rõ ràng: opening – body – closing.']
  ),
  mk('speaking', 'Speaking (SW)', <Mic className="w-4 h-4" />, 'text-pink-600', 'bg-pink-50',
    [
      { key: 'speaking.sw_describe_img',  title: 'SW Part 2 – Describe a Photo', desc: 'Nói 45 giây mô tả chi tiết hình ảnh', done: false },
    ],
    ['Luyện mô tả ảnh văn phòng, hội họp, nơi công cộng.']
  ),
]

// Band 600–699 — Standard graduation requirement. Only NEW vs. 500–599.
const TOEIC_SKILLS_600: SkillSection[] = [
  mk('grammar', 'Ngữ pháp', <Brain className="w-4 h-4" />, 'text-violet-600', 'bg-violet-50',
    [
      { key: 'grammar.gerund_infinitive',  title: 'Gerunds vs. Infinitives', desc: 'enjoy doing vs. decide to do – verb + pattern', done: false },
      { key: 'grammar.conjunctions_adv',   title: 'Conjunctions nâng cao', desc: 'Although, despite, so that, provided that…', done: false },
      { key: 'grammar.complex_passive',    title: 'Câu phức + Bị động', desc: 'Complex structures phổ biến trong Part 5–6', done: false },
    ],
    ['Ghi nhớ danh sách verb + gerund vs. verb + infinitive.']
  ),
  mk('vocabulary', 'Từ vựng', <BookMarked className="w-4 h-4" />, 'text-blue-600', 'bg-blue-50',
    [
      { key: 'vocab.finance_hr',           title: 'Finance & HR vocabulary', desc: 'Budget, revenue, reimbursement, onboarding, benefits', done: false },
      { key: 'vocab.operations_logistics', title: 'Operations & Logistics', desc: 'Inventory, dispatch, track shipment, warehouse', done: false },
    ],
    ['Học vocab theo chủ đề Part 7 văn bản (emails, ads, notices).']
  ),
  mk('listening', 'Nghe (L)', <Headphones className="w-4 h-4" />, 'text-cyan-600', 'bg-cyan-50',
    [
      { key: 'listening.part3_graphics',  title: 'Part 3 – Questions with Graphics', desc: 'Kết hợp nghe + xem biểu đồ, bảng, sơ đồ', done: false },
      { key: 'listening.part4_varied',    title: 'Part 4 – Monologue đa dạng', desc: 'Tour guide, radio ad, voicemail, meeting opening', done: false },
    ],
    ['Luyện với ETS Official TOEIC tests.', 'Tập chú ý intention của speaker.']
  ),
  mk('reading', 'Đọc (R)', <Eye className="w-4 h-4" />, 'text-emerald-600', 'bg-emerald-50',
    [
      { key: 'reading.part7_double',      title: 'Part 7 – Double Passage', desc: 'Email chain, article + ad – kết hợp thông tin', done: false },
    ],
    ['Luyện double passage 2 phút/cặp.', 'Tìm connections giữa 2 văn bản.']
  ),
  mk('writing', 'Writing (SW)', <PenLine className="w-4 h-4" />, 'text-orange-600', 'bg-orange-50',
    [
      { key: 'writing.sw_essay_basic',    title: 'SW Part 3 – Essay cơ bản', desc: 'Viết 300 từ nêu ý kiến + 2 lý do + ví dụ', done: false },
    ],
    ['Dùng cấu trúc 5 đoạn: intro-body1-body2-body3-conclusion.']
  ),
  mk('speaking', 'Speaking (SW)', <Mic className="w-4 h-4" />, 'text-pink-600', 'bg-pink-50',
    [
      { key: 'speaking.sw_respond_q',     title: 'SW Part 3–4 – Respond to Questions', desc: 'Trả lời 3 câu hỏi liên quan đến survey/scenario', done: false },
    ],
    ['Trả lời đủ ý, dùng filler phrases tự nhiên.']
  ),
]

// Band 700–799 — Proficient. Only NEW vs. 600–699.
const TOEIC_SKILLS_700: SkillSection[] = [
  mk('grammar', 'Ngữ pháp', <Brain className="w-4 h-4" />, 'text-violet-600', 'bg-violet-50',
    [
      { key: 'grammar.subjunctive_biz',    title: 'Subjunctive trong Business', desc: 'It is recommended that…, the board suggested…', done: false },
      { key: 'grammar.parallel_structure', title: 'Parallel Structure', desc: 'Both…and, not only…but also trong câu chính thức', done: false },
    ],
    ['Chú ý parallel structure trong Part 5, 6.']
  ),
  mk('vocabulary', 'Từ vựng', <BookMarked className="w-4 h-4" />, 'text-blue-600', 'bg-blue-50',
    [
      { key: 'vocab.business_b2_c1',       title: 'Business vocabulary B2–C1 (4,000+ từ)', desc: 'Merger, acquisition, procurement, liability, compliance', done: false },
      { key: 'vocab.phrasal_verbs_biz',    title: 'Phrasal verbs business', desc: 'Follow up, bring forward, carry out, draw up…', done: false },
    ],
    ['Học 10 phrasal verbs business/tuần.']
  ),
  mk('listening', 'Nghe (L)', <Headphones className="w-4 h-4" />, 'text-cyan-600', 'bg-cyan-50',
    [
      { key: 'listening.implication',     title: 'Implied Meaning trong Part 3–4', desc: 'Điều speaker muốn nói nhưng không nói thẳng', done: false },
    ],
    ['Luyện identify intention: complaints, requests, suggestions trong audio.']
  ),
  mk('reading', 'Đọc (R)', <Eye className="w-4 h-4" />, 'text-emerald-600', 'bg-emerald-50',
    [
      { key: 'reading.part7_triple',      title: 'Part 7 – Triple Passage', desc: 'Kết hợp 3 văn bản, cross-reference information', done: false },
      { key: 'reading.complex_business',  title: 'Đọc văn bản kinh doanh phức tạp', desc: 'Annual report, legal memo, RFP, Terms & Conditions', done: false },
    ],
    ['Dành 3 phút cho triple passage.', 'Tập tóm tắt nhanh ý chính mỗi passage.']
  ),
  mk('writing', 'Writing (SW)', <PenLine className="w-4 h-4" />, 'text-orange-600', 'bg-orange-50',
    [
      { key: 'writing.sw_formal_email',   title: 'SW Email chính thức nâng cao', desc: 'Viết email xử lý tình huống phức tạp, đủ trang trọng', done: false },
    ],
    ['Học template email từ Harvard Business School Writing.']
  ),
  mk('speaking', 'Speaking (SW)', <Mic className="w-4 h-4" />, 'text-pink-600', 'bg-pink-50',
    [
      { key: 'speaking.sw_propose_sol',   title: 'SW Part 5 – Propose a Solution', desc: 'Trình bày giải pháp cho vấn đề trong voicemail', done: false },
    ],
    ['Tập cấu trúc: Acknowledge problem → Propose solution → Give detail.']
  ),
]

// Band 800+ — Expert. Only NEW vs. 700–799.
const TOEIC_SKILLS_800: SkillSection[] = [
  mk('grammar', 'Ngữ pháp', <Brain className="w-4 h-4" />, 'text-violet-600', 'bg-violet-50',
    [
      { key: 'grammar.discourse_markers', title: 'Discourse Markers nâng cao', desc: 'Coherence markers trong văn bản chính thức', done: false },
    ],
    ['Phân tích cấu trúc luận điểm trong business reports.']
  ),
  mk('vocabulary', 'Từ vựng', <BookMarked className="w-4 h-4" />, 'text-blue-600', 'bg-blue-50',
    [
      { key: 'vocab.c1_business',          title: 'C1 Business idioms & collocations', desc: 'Touch base, close the loop, circle back, bandwidth', done: false },
      { key: 'vocab.domain_specific',      title: 'Từ vựng chuyên ngành theo lĩnh vực', desc: 'Tech, Finance, Legal, Healthcare, Marketing', done: false },
    ],
    ['Đọc Wall Street Journal, FT hoặc Harvard Business Review.']
  ),
  mk('listening', 'Nghe (L)', <Headphones className="w-4 h-4" />, 'text-cyan-600', 'bg-cyan-50',
    [
      { key: 'listening.native_speed',    title: 'Native-speed & Authentic Accents', desc: 'Unscripted business meetings, earnings calls', done: false },
    ],
    ['Nghe earnings calls của công ty lớn trên YouTube.']
  ),
  mk('reading', 'Đọc (R)', <Eye className="w-4 h-4" />, 'text-emerald-600', 'bg-emerald-50',
    [
      { key: 'reading.speed_accuracy',    title: 'Tốc độ & Độ chính xác cao', desc: '≥ 280 words/minute, Part 7 trong 54 phút', done: false },
    ],
    ['Luyện speed reading với tài liệu business thực tế.']
  ),
  mk('writing', 'Writing (SW)', <PenLine className="w-4 h-4" />, 'text-orange-600', 'bg-orange-50',
    [
      { key: 'writing.sw_essay_adv',      title: 'SW Essay nâng cao – Persuasion', desc: 'Lập luận thuyết phục, cohesive, B2–C1 vocabulary', done: false },
    ],
    ['Nhờ native hoặc C1+ speaker review bài viết.']
  ),
  mk('speaking', 'Speaking (SW)', <Mic className="w-4 h-4" />, 'text-pink-600', 'bg-pink-50',
    [
      { key: 'speaking.sw_opinion_adv',   title: 'SW Part 6 – Express an Opinion', desc: 'Trình bày ý kiến rõ ràng, thuyết phục trong 60 giây', done: false },
    ],
    ['Luyện với TOEIC Speaking practice tests ETS Official.']
  ),
]

export const TOEIC_SKILLS_BY_BAND: Record<ToeicBand, SkillSection[]> = {
  '350-495': TOEIC_SKILLS_350,
  '500-599': TOEIC_SKILLS_500,
  '600-699': TOEIC_SKILLS_600,
  '700-799': TOEIC_SKILLS_700,
  '800+':    TOEIC_SKILLS_800,
}

// Kept for backward-compat (used when no band selected)
export const IELTS_SKILLS: SkillSection[] = IELTS_SKILLS_6
export const TOEIC_SKILLS: SkillSection[] = TOEIC_SKILLS_600


// ─── Band configurations ──────────────────────────────────────────────────────
export const IELTS_BANDS: BandOption[] = [
  {
    value: '4.0', label: 'Band 4.0', tagline: 'Cơ bản',
    description: 'Hiểu ý chính chủ đề quen thuộc, đáp ứng yêu cầu đầu vào nhiều chương trình',
    requirements: ['Ngữ pháp cơ bản (thì, mạo từ)', 'Từ vựng ~2,500 từ thông dụng', 'Nghe câu đơn & hội thoại ngắn'],
    color: 'text-slate-600', bg: 'bg-slate-50', border: 'border-slate-200', borderActive: 'border-slate-400',
  },
  {
    value: '5.0', label: 'Band 5.0', tagline: 'Sơ trung cấp',
    description: 'Giao tiếp được trong môi trường nói tiếng Anh, hiểu nội dung quen thuộc',
    requirements: ['Thì phức hợp & câu ghép', 'Từ vựng ~3,500 từ', 'Nghe hội thoại & monologue ngắn'],
    color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200', borderActive: 'border-blue-500',
  },
  {
    value: '6.0', label: 'Band 6.0', tagline: 'Trung cấp',
    description: 'Chuẩn đầu ra phổ biến nhất tại các trường đại học Việt Nam',
    requirements: ['Ngữ pháp đầy đủ & câu phức', 'Từ vựng học thuật 4,500+ từ', 'Đọc & phân tích đoạn văn dài'],
    color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-200', borderActive: 'border-purple-500',
    recommended: true,
  },
  {
    value: '6.5', label: 'Band 6.5', tagline: 'Khá',
    description: 'Yêu cầu học bổng, tốt nghiệp điều kiện cao, hoặc du học bậc đại học',
    requirements: ['Câu phức nhuần nhuyễn', 'Collocation & idiom cơ bản', 'Paraphrase hiệu quả'],
    color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-200', borderActive: 'border-indigo-500',
  },
  {
    value: '7.0', label: 'Band 7.0', tagline: 'Giỏi',
    description: 'Du học Úc, Anh; một số chương trình thạc sĩ & MBA quốc tế',
    requirements: ['Ngôn ngữ học thuật thành thạo', 'AWL & từ vựng chuyên ngành', 'Viết luận hàn lâm chuẩn'],
    color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200', borderActive: 'border-emerald-500',
  },
  {
    value: '7.5+', label: 'Band 7.5+', tagline: 'Xuất sắc',
    description: 'Chương trình uy tín quốc tế, học bổng toàn phần, môi trường chuyên gia',
    requirements: ['Idioms & advanced collocations', 'Viết tinh tế & thuyết phục', 'Nói linh hoạt, tự nhiên'],
    color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200', borderActive: 'border-amber-500',
  },
]

export const TOEIC_BANDS: BandOption[] = [
  {
    value: '350-495', label: '350 – 495', tagline: 'Cơ bản',
    description: 'Hiểu thông tin đơn giản trong văn phòng, đáp ứng yêu cầu tối thiểu',
    requirements: ['Từ vựng văn phòng cơ bản', 'Nghe Part 1 & 2', 'Ngữ pháp đơn giản'],
    color: 'text-slate-600', bg: 'bg-slate-50', border: 'border-slate-200', borderActive: 'border-slate-400',
  },
  {
    value: '500-599', label: '500 – 599', tagline: 'Sơ trung cấp',
    description: 'Làm việc trong môi trường quốc tế cơ bản, đủ điều kiện một số vị trí',
    requirements: ['Business vocabulary B1', 'Nghe Part 3 & 4 câu ngắn', 'Reading Part 5 & 6'],
    color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200', borderActive: 'border-blue-500',
  },
  {
    value: '600-699', label: '600 – 699', tagline: 'Chuẩn ra trường',
    description: 'Chuẩn đầu ra được yêu cầu nhiều nhất tại các trường đại học Việt Nam (450–600+)',
    requirements: ['Toàn bộ Part 3 & 4 Listening', 'Reading Part 7 cơ bản', 'Từ vựng kinh doanh B2'],
    color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-200', borderActive: 'border-purple-500',
    recommended: true,
  },
  {
    value: '700-799', label: '700 – 799', tagline: 'Khá',
    description: 'Yêu cầu cho các vị trí văn phòng, quản lý cấp thấp trong công ty nước ngoài',
    requirements: ['Full 4 kỹ năng thành thạo', 'Đọc văn bản kinh doanh phức hợp', 'Từ vựng B2–C1'],
    color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-200', borderActive: 'border-indigo-500',
  },
  {
    value: '800+', label: '800+', tagline: 'Xuất sắc',
    description: 'Môi trường quốc tế chuyên nghiệp, vị trí quản lý, giao tiếp với đối tác nước ngoài',
    requirements: ['Business idioms & collocations', 'Đọc multiple passages nhanh', 'Thư tín thương mại C1'],
    color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200', borderActive: 'border-emerald-500',
  },
]

export const MOS_LEVELS: BandOption[] = [
  {
    value: 'associate', label: 'MOS Associate', tagline: 'Trình độ chuẩn',
    description: 'Nắm vững tính năng cốt lõi. Cấp độ thi phổ biến nhất, phù hợp mọi đối tượng.',
    requirements: ['Tất cả tính năng chính (~70% bài thi)', 'Thao tác cơ bản đến trung cấp', 'Điểm đạt: ≥ 700 / 1,000'],
    color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200', borderActive: 'border-blue-500',
    recommended: true,
  },
  {
    value: 'expert', label: 'MOS Expert', tagline: 'Trình độ nâng cao',
    description: 'Tính năng nâng cao & tự động hóa. Chỉ có cho MOS Word và MOS Excel.',
    requirements: ['Tính năng chuyên sâu & automation', 'Macro và tác vụ phức hợp', 'Điểm đạt: ≥ 700 / 1,000'],
    color: 'text-purple-700', bg: 'bg-purple-50', border: 'border-purple-200', borderActive: 'border-purple-500',
  },
]

// ─── Band-specific roadmaps ────────────────────────────────────────────────────

// ── IELTS per-band roadmaps ───────────────────────────────────────────────────
export const IELTS_ROADMAP_40: RoadmapStep[] = [
  { title: 'Ngữ pháp cơ bản', subtitle: '12 thì, mạo từ, câu đơn/ghép, so sánh cơ bản', status: 'completed' },
  { title: 'Từ vựng đời thường (2,500 từ)', subtitle: 'Chủ đề gia đình, du lịch, môi trường, sức khỏe', status: 'in-progress', progress: 45 },
  { title: 'Listening Sections 1–2', subtitle: 'Form/Note completion, spelling-number-date accuracy, xử lý distractors', status: 'locked' },
  { title: 'Reading foundations', subtitle: 'Skimming/scanning, True-False-Not Given, multiple choice cơ bản', status: 'locked' },
  { title: 'Writing core', subtitle: 'Task 1 biểu đồ đơn giản + Task 2 opinion mở bài/kết bài', status: 'locked' },
  { title: 'Speaking Part 1 baseline', subtitle: 'Fluency cơ bản + pronunciation dễ hiểu theo tiêu chí IELTS', status: 'locked' },
]

export const IELTS_ROADMAP_50: RoadmapStep[] = [
  { title: 'Ngữ pháp trung cấp', subtitle: 'Bị động, điều kiện 1&2, mệnh đề quan hệ, câu gián tiếp', status: 'completed' },
  { title: 'Phrasal Verbs & Collocations cơ bản', subtitle: '100 phrasal verbs, verb-noun & adj-noun collocations', status: 'in-progress', progress: 40 },
  { title: 'Listening Section 3', subtitle: 'Academic discussion, nhận diện paraphrase và bẫy đáp án', status: 'locked' },
  { title: 'Reading task types mở rộng', subtitle: 'Matching Headings, Summary Completion, speed + accuracy', status: 'locked' },
  { title: 'Writing structure control', subtitle: 'Task 2 4 đoạn + cohesion cơ bản theo tiêu chí CC/TR', status: 'locked' },
  { title: 'Speaking Part 2 development', subtitle: 'Cue Card 2 phút: idea expansion + discourse markers', status: 'locked' },
]

export const IELTS_ROADMAP_60: RoadmapStep[] = [
  { title: 'Ngữ pháp nâng cao', subtitle: 'Điều kiện 3/mixed, bị động phức, mệnh đề trạng ngữ, đảo ngữ', status: 'completed' },
  { title: 'AWL 570 từ & Paraphrase', subtitle: 'Academic Word List cốt lõi, kỹ thuật rewrite câu', status: 'in-progress', progress: 35 },
  { title: 'Listening Section 4 mastery', subtitle: 'Academic lecture + map/plan/diagram dưới áp lực thời gian', status: 'locked' },
  { title: 'Reading high-frequency forms', subtitle: 'Matching Information, Y/N/NG, sentence endings, 3 passages/60 phút', status: 'locked' },
  { title: 'Writing criteria upgrade', subtitle: 'Task Response rõ, Coherence tốt, Lexical Resource học thuật, Grammar range', status: 'locked' },
  { title: 'Speaking Part 3 reasoning', subtitle: 'Mở rộng lập luận trừu tượng với ví dụ và so sánh quan điểm', status: 'locked' },
]

export const IELTS_ROADMAP_65: RoadmapStep[] = [
  { title: 'Cleft sentences & Nominalization', subtitle: 'It is… that…, What… is…, chuyển động từ thành danh từ', status: 'completed' },
  { title: 'Idioms 100 cụm & Register nuance', subtitle: 'Idiom cho Speaking Part 3, formal/informal phân biệt', status: 'in-progress', progress: 30 },
  { title: 'Listening inference control', subtitle: 'Theo dõi thái độ/quan điểm speaker và câu trả lời hàm ý', status: 'locked' },
  { title: 'Reading inference & tone', subtitle: 'Implied meaning, purpose, author stance với độ chính xác ổn định', status: 'locked' },
  { title: 'Writing lexical precision', subtitle: 'Cohesive devices nâng cao + lựa chọn từ/collocation chính xác', status: 'locked' },
  { title: 'Speaking coherence upgrade', subtitle: 'Lexical variety tự nhiên, ý liền mạch giữa Part 2 và Part 3', status: 'locked' },
]

export const IELTS_ROADMAP_70: RoadmapStep[] = [
  { title: 'Đảo ngữ nâng cao & Subjunctive', subtitle: 'Emphatic inversion, It is essential that…, Were it not…', status: 'completed' },
  { title: 'AWL nâng cao & Topic Lexicon', subtitle: 'C1 vocabulary theo chủ đề, collocation chính xác theo ngữ cảnh', status: 'in-progress', progress: 25 },
  { title: 'Listening nuance', subtitle: 'Nhận diện thái độ tinh tế qua intonation và lexical cues', status: 'locked' },
  { title: 'Đọc: Critical analysis & Implicit argument', subtitle: 'Đánh giá độ tin cậy, tìm luận điểm ẩn, journal articles', status: 'locked' },
  { title: 'Writing Band 7 criteria', subtitle: 'Task response sâu, cohesion tự nhiên, lexical flexibility, grammar accuracy', status: 'locked' },
  { title: 'Speaking Band 7 criteria', subtitle: 'Fluency ổn định, câu phức linh hoạt, pronunciation rõ và tự nhiên', status: 'locked' },
]

export const IELTS_ROADMAP_75: RoadmapStep[] = [
  { title: 'Discourse organisation & Pragmatic language', subtitle: 'Macro-structure học thuật, hedging, modality, stance markers', status: 'completed' },
  { title: 'C1 Precision & Natural Collocations', subtitle: 'Chọn từ chính xác, collocation tự nhiên, tránh overuse idiom', status: 'in-progress', progress: 20 },
  { title: 'Nghe: Accent đa dạng tốc độ cao', subtitle: 'Native-speed British, Australian, Scottish, Irish unscripted', status: 'locked' },
  { title: 'Đọc: Timed accuracy cao', subtitle: 'Giữ độ chính xác ổn định trong full test Cambridge timed practice', status: 'locked' },
  { title: 'Viết: Band 8 control + Register mastery', subtitle: 'Ít lỗi ngữ pháp, phát triển luận điểm sâu, giọng văn học thuật linh hoạt', status: 'locked' },
  { title: 'Nói: Band 8 performance', subtitle: 'Fluency linh hoạt, lexical range rộng, pronunciation nhất quán dễ hiểu', status: 'locked' },
]

// ── TOEIC per-band roadmaps ───────────────────────────────────────────────────
export const TOEIC_ROADMAP_350: RoadmapStep[] = [
  { title: 'Ngữ pháp Part 5 cơ bản', subtitle: 'Thì động từ, mạo từ, đại từ, so sánh cơ bản', status: 'completed' },
  { title: 'Từ vựng văn phòng cơ bản (1,000 từ)', subtitle: 'Meeting, email, schedule, colleague, document', status: 'in-progress', progress: 55 },
  { title: 'Listening Part 1 & 2', subtitle: 'Photographs (6 ảnh), Question-Response (25 câu)', status: 'locked' },
  { title: 'Reading Part 5 cơ bản', subtitle: 'Điền từ nhận dạng loại từ và nghĩa phù hợp', status: 'locked' },
  { title: 'Speaking & Writing cơ bản (SW)', subtitle: 'Read Aloud, Photo Description 1 câu chuẩn', status: 'locked' },
]

export const TOEIC_ROADMAP_500: RoadmapStep[] = [
  { title: 'Ngữ pháp Part 5–6 trung cấp', subtitle: 'Thì hoàn thành, điều kiện loại 1, mệnh đề quan hệ', status: 'completed' },
  { title: 'Business vocabulary B1 (2,500 từ)', subtitle: 'Invoice, purchase order, shipment, deadline, contract', status: 'in-progress', progress: 45 },
  { title: 'Listening Part 3 & 4 ngắn', subtitle: 'Hội thoại 2 người, monologue: announcement, message, ad', status: 'locked' },
  { title: 'Reading Part 6 & Part 7 Single', subtitle: 'Text completion, Email/article/form – 2–4 câu hỏi/bài', status: 'locked' },
  { title: 'SW: Email cơ bản & Describe Photo', subtitle: 'Trả lời 3 câu hỏi trong email, mô tả ảnh 45 giây', status: 'locked' },
]

export const TOEIC_ROADMAP_600: RoadmapStep[] = [
  { title: 'Ngữ pháp Part 5–6 nâng cao', subtitle: 'Gerunds vs Infinitives, conjunctions nâng cao, câu phức bị động', status: 'completed' },
  { title: 'Finance & HR, Operations & Logistics', subtitle: 'Budget, revenue, inventory, dispatch, warehouse vocabulary', status: 'in-progress', progress: 35 },
  { title: 'Listening: Graphics & Monologue đa dạng', subtitle: 'Nghe + biểu đồ/bảng, tour guide, radio ad, voicemail', status: 'locked' },
  { title: 'Reading: Double Passage Part 7', subtitle: 'Email chain, article + ad – kết hợp thông tin 2 bài', status: 'locked' },
  { title: 'SW: Essay cơ bản & Respond to Questions', subtitle: 'Essay 300 từ 2 lý do, trả lời survey/scenario', status: 'locked' },
  { title: 'Full Mock Test 200 câu', subtitle: 'Thi thử đầy đủ với đồng hồ, phân tích lỗi sai', status: 'locked' },
]

export const TOEIC_ROADMAP_700: RoadmapStep[] = [
  { title: 'Ngữ pháp business nâng cao', subtitle: 'Subjunctive, parallel structure, discourse markers', status: 'completed' },
  { title: 'Business vocabulary B2–C1 (4,000+ từ) & Phrasal verbs', subtitle: 'Merger, acquisition, compliance + 10 phrasal verbs/tuần', status: 'in-progress', progress: 25 },
  { title: 'Listening: Implied meaning Part 3–4', subtitle: 'Điều speaker muốn nói nhưng không nói thẳng', status: 'locked' },
  { title: 'Reading: Triple Passage & Văn bản phức tạp', subtitle: 'Cross-reference 3 văn bản, annual report, legal memo, RFP', status: 'locked' },
  { title: 'SW: Email chính thức nâng cao & Part 5 Propose Solution', subtitle: 'Xử lý tình huống phức tạp, trình bày giải pháp voicemail', status: 'locked' },
]

export const TOEIC_ROADMAP_800: RoadmapStep[] = [
  { title: 'Discourse markers & C1 business idioms', subtitle: 'Coherence markers, touch base, close the loop, bandwidth', status: 'completed' },
  { title: 'Từ vựng chuyên ngành theo lĩnh vực', subtitle: 'Tech, Finance, Legal, Healthcare, Marketing – đọc WSJ/FT', status: 'in-progress', progress: 20 },
  { title: 'Nghe: Native speed & Authentic accents', subtitle: 'Unscripted business meetings, earnings calls trên YouTube', status: 'locked' },
  { title: 'Đọc: Tốc độ ≥ 280 wpm, Part 7 trong 54 phút', subtitle: 'Speed reading với tài liệu business thực tế', status: 'locked' },
  { title: 'SW: Essay thuyết phục B2–C1 & Opinion nâng cao', subtitle: 'Lập luận thuyết phục, ý kiến rõ ràng 60 giây', status: 'locked' },
  { title: 'Thi thử & phân tích chuyên sâu', subtitle: 'ETS Official Test + review từng phần, đạt ≥ 850 trong mock', status: 'locked' },
]

export const MOS_ROADMAP_ASSOCIATE: RoadmapStep[] = [
  { title: 'Tạo & Định dạng nội dung', subtitle: 'Styles, Formatting, Bố cục trang – tính năng cốt lõi', status: 'in-progress', progress: 40 },
  { title: 'Bảng, Hình ảnh & Đồ họa', subtitle: 'Tables, SmartArt, Charts, Pictures – chèn và định dạng', status: 'locked' },
  { title: 'Kiểm tra & Cộng tác', subtitle: 'Spelling, Track Changes, Comments, Print settings', status: 'locked' },
  { title: 'Thi thử Associate', subtitle: 'Mock exam mô phỏng môi trường thi thật – 50 phút', status: 'locked' },
]

export const MOS_ROADMAP_EXPERT: RoadmapStep[] = [
  { title: 'Ôn tập kỹ năng Associate', subtitle: 'Consolidate tất cả tính năng cơ bản trước khi nâng cao', status: 'completed' },
  { title: 'Tính năng nâng cao & Tùy chỉnh', subtitle: 'Advanced styles, Templates, Building blocks, Custom properties', status: 'in-progress', progress: 25 },
  { title: 'Tự động hóa cơ bản', subtitle: 'Macros recording, Quick Parts, Mail Merge nâng cao', status: 'locked' },
  { title: 'Tính năng chuyên biệt nâng cao', subtitle: 'Forms, Linked objects, Cross-references, Index & TOC nâng cao', status: 'locked' },
  { title: 'Thi thử Expert & Review', subtitle: 'Mock exam Expert + review tất cả điểm yếu', status: 'locked' },
]

// ─── Helper functions ─────────────────────────────────────────────────────────
export function getProgressColor(cert: Certificate): string {
  if (cert.progress === 0) return 'bg-slate-200'
  switch (cert.id) {
    case 'ielts': return 'bg-red-500'
    case 'toeic': return 'bg-blue-500'
    case 'mos-word': return 'bg-blue-600'
    case 'mos-excel': return 'bg-green-600'
    case 'mos-powerpoint': return 'bg-orange-500'
    default: return 'bg-purple-500'
  }
}

export function getMosTasksBycert(id: CertId): MosTask[] {
  if (id === 'mos-word') return MOS_WORD_TASKS
  if (id === 'mos-excel') return MOS_EXCEL_TASKS
  if (id === 'mos-powerpoint') return MOS_PPT_TASKS
  return []
}

export function getMosIcon(id: CertId): React.ReactNode {
  if (id === 'mos-word') return <FileText className="w-5 h-5 text-blue-700" />
  if (id === 'mos-excel') return <Table2 className="w-5 h-5 text-green-700" />
  return <Presentation className="w-5 h-5 text-orange-600" />
}

export function getRoadmap(id: CertId, band?: CertBand): RoadmapStep[] {
  if (id === 'ielts') {
    const resolvedBand: IeltsBand = band && band in IELTS_ROADMAP_TEMP_BY_BAND
      ? (band as IeltsBand)
      : '6.0'
    return IELTS_ROADMAP_TEMP_BY_BAND[resolvedBand]
  }
  if (id === 'toeic') {
    const map: Record<ToeicBand, RoadmapStep[]> = {
      '350-495': TOEIC_ROADMAP_350,
      '500-599': TOEIC_ROADMAP_500,
      '600-699': TOEIC_ROADMAP_600,
      '700-799': TOEIC_ROADMAP_700,
      '800+':    TOEIC_ROADMAP_800,
    }
  return band && band in map ? map[band as ToeicBand] : TOEIC_ROADMAP_600
  }
  if (band === 'expert' && id !== 'mos-powerpoint') return MOS_ROADMAP_EXPERT
  return MOS_ROADMAP_ASSOCIATE
}

export function getPracticeTests(id: CertId): PracticeTest[] {
  if (id === 'ielts') return IELTS_PRACTICE_TESTS
  if (id === 'toeic') return TOEIC_PRACTICE_TESTS
  return []
}

export function getSkills(id: CertId, band?: CertBand): SkillSection[] {
  if (id === 'ielts') {
    const resolvedBand: IeltsBand = band && band in IELTS_SKILL_TRACKS_TEMP_BY_BAND
      ? (band as IeltsBand)
      : '6.0'
    return IELTS_SKILL_TRACKS_TEMP_BY_BAND[resolvedBand]
  }
  if (id === 'toeic') {
    if (band && band in TOEIC_SKILLS_BY_BAND) return TOEIC_SKILLS_BY_BAND[band as ToeicBand]
    return TOEIC_SKILLS
  }
  return []
}

export function getRadarData(id: CertId): number[] {
  if (id === 'ielts') return [65, 59, 90, 81, 56, 70]
  if (id === 'toeic') return [50, 45, 70, 65, 30, 20]
  return []
}

export function getBandTier(id: CertId, band: CertBand): string {
  if (id === 'ielts') {
    if (band === '4.0' || band === '5.0') return 'basic'
    if (band === '7.0' || band === '7.5+') return 'advanced'
    return 'standard'
  }
  if (id === 'toeic') {
    if (band === '350-495' || band === '500-599') return 'basic'
    if (band === '700-799' || band === '800+') return 'advanced'
    return 'standard'
  }
  return band as string
}

export function getBands(id: CertId): BandOption[] {
  if (id === 'ielts') return IELTS_BANDS
  if (id === 'toeic') return TOEIC_BANDS
  if (id === 'mos-powerpoint') return MOS_LEVELS.filter((l) => l.value === 'associate')
  return MOS_LEVELS
}

export function getBandOption(id: CertId, band: CertBand): BandOption | undefined {
  return getBands(id).find((b) => b.value === band)
}

// ─── Sub-components ───────────────────────────────────────────────────────────

export function StatCard({
  icon,
  label,
  value,
  sub,
  accent,
}: {
  icon: React.ReactNode
  label: string
  value: string
  sub: string
  accent: string
}) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 flex flex-col gap-3">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <h3 className="text-2xl font-bold text-slate-800 mt-1">{value}</h3>
        </div>
        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${accent}`}>{icon}</div>
      </div>
      <p className="text-xs text-slate-400">{sub}</p>
    </div>
  )
}

export function CertCard({
  cert,
  selected,
  onClick,
}: {
  cert: Certificate
  selected: boolean
  onClick: () => void
}) {
  const progressColor = getProgressColor(cert)
  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-2xl border-2 overflow-hidden cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:shadow-lg ${
        selected ? 'border-purple-400 shadow-lg' : 'border-slate-100 shadow-sm'
      }`}
    >
      <div className="h-28 relative overflow-hidden">
        <img
          src={cert.coverImg}
          alt={cert.label}
          className="w-full h-full object-cover opacity-70 transition-transform duration-500 hover:scale-105"
        />
        <div className={`absolute inset-0 bg-gradient-to-br ${cert.bgFrom} ${cert.bgTo} opacity-50`} />
        {cert.status === 'active' && (
          <div className="absolute top-2.5 right-2.5 bg-white/90 backdrop-blur px-2 py-0.5 rounded-full text-xs font-bold text-purple-700">
            Đang học
          </div>
        )}
        {selected && (
          <div className="absolute bottom-2 left-2 bg-purple-600 text-white rounded-full px-2 py-0.5 text-xs font-bold flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> Đã chọn
          </div>
        )}
      </div>
      <div className="p-4">
        <div className="flex items-center gap-2.5 mb-3">
          <div
            className={`w-9 h-9 rounded-full bg-gradient-to-br ${cert.bgFrom} ${cert.bgTo} flex items-center justify-center text-white font-bold text-xs shadow-sm`}
          >
            {cert.icon}
          </div>
          <div>
            <h3 className="font-bold text-slate-800 text-sm">{cert.label}</h3>
            <p className="text-xs text-slate-400">{cert.sublabel}</p>
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-slate-500">
            <span>Tiến độ</span>
            <span className="font-bold text-slate-700">{cert.progress}%</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5">
            <div
              className={`${progressColor} h-1.5 rounded-full transition-all`}
              style={{ width: `${cert.progress}%` }}
            />
          </div>
          <button
            className={`w-full py-2 mt-1 text-sm font-medium rounded-xl cursor-pointer transition-colors ${
              cert.progress > 0
                ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white hover:from-purple-600 hover:to-blue-600'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {cert.progress > 0 ? 'Tiếp tục học' : 'Bắt đầu học'}
          </button>
        </div>
      </div>
    </div>
  )
}

export function RoadmapView({ steps }: { steps: RoadmapStep[] }) {
  return (
    <div className="relative pl-5 border-l-2 border-slate-100 space-y-7">
      {steps.map((step, i) => (
        <div key={i} className={`relative ${step.status === 'locked' ? 'opacity-50' : ''}`}>
          <div
            className={`absolute -left-[23px] top-0.5 w-4 h-4 rounded-full border-2 border-white shadow-sm flex items-center justify-center ${
              step.status === 'completed'
                ? 'bg-emerald-500'
                : step.status === 'in-progress'
                ? 'bg-purple-500 ring-4 ring-purple-100'
                : 'bg-slate-300'
            }`}
          >
            {step.status === 'completed' && <CheckCircle2 className="w-2.5 h-2.5 text-white" />}
            {step.status === 'locked' && <Lock className="w-2 h-2 text-white" />}
          </div>
          <div className="flex justify-between items-start">
            <div>
              <h4 className="font-bold text-slate-800 text-sm">{step.title}</h4>
              <p className="text-xs text-slate-500">{step.subtitle}</p>
            </div>
            <span
              className={`text-xs font-bold px-2 py-1 rounded-lg shrink-0 ml-3 ${
                step.status === 'completed'
                  ? 'text-emerald-600 bg-emerald-50'
                  : step.status === 'in-progress'
                  ? 'text-purple-600 bg-purple-50'
                  : 'text-slate-400 bg-slate-50'
              }`}
            >
              {step.status === 'completed'
                ? 'Hoàn thành'
                : step.status === 'in-progress'
                ? 'Đang học'
                : 'Chưa mở'}
            </span>
          </div>
          {step.status === 'in-progress' && step.progress !== undefined && (
            <div className="mt-2 bg-slate-50 p-3 rounded-xl border border-slate-100">
              <div className="flex justify-between text-xs text-slate-500 mb-1.5">
                <span>Module hiện tại</span>
                <span className="font-bold text-slate-700">{step.progress}%</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-1.5">
                <div className="bg-purple-500 h-1.5 rounded-full" style={{ width: `${step.progress}%` }} />
              </div>
              <div className="mt-2.5 flex gap-2">
                <button className="text-xs bg-purple-600 text-white px-3 py-1.5 rounded-lg hover:bg-purple-700 cursor-pointer transition-colors">
                  Tiếp tục
                </button>
                <button className="text-xs bg-white border border-slate-200 text-slate-600 px-3 py-1.5 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors">
                  Xem Flashcard
                </button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

export function PracticeTestList({ tests }: { tests: PracticeTest[] }) {
  return (
    <div className="space-y-2.5">
      {tests.map((t, i) => (
        <div
          key={i}
          className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:border-purple-200 hover:bg-purple-50/50 transition-colors cursor-pointer group"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 group-hover:bg-white group-hover:text-purple-600 transition-colors">
              {t.icon}
            </div>
            <div>
              <p className="font-bold text-slate-800 text-sm">{t.title}</p>
              <p className="text-xs text-slate-400">{t.meta}</p>
            </div>
          </div>
          <span className={`text-xs font-bold px-2 py-1 rounded-lg shrink-0 ml-2 ${t.scoreColor}`}>
            {t.scoreLabel}
          </span>
        </div>
      ))}
    </div>
  )
}

export function SkillRadar({ data, labels }: { data: number[]; labels: string[] }) {
  const chartData = {
    labels,
    datasets: [
      {
        label: 'Mức độ hiện tại',
        data,
        fill: true,
        backgroundColor: 'rgba(139, 92, 246, 0.15)',
        borderColor: 'rgb(139, 92, 246)',
        pointBackgroundColor: 'rgb(139, 92, 246)',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgb(139, 92, 246)',
      },
    ],
  }
  const options = {
    elements: { line: { borderWidth: 2 } },
    scales: {
      r: {
        angleLines: { display: true, color: '#e2e8f0' },
        grid: { color: '#e2e8f0' },
        pointLabels: { font: { family: "'Inter', sans-serif", size: 11 }, color: '#64748b' },
        ticks: { display: false, backdropColor: 'transparent' },
        suggestedMin: 0,
        suggestedMax: 100,
      },
    },
    plugins: { legend: { display: false } },
    maintainAspectRatio: false,
  }
  return <Radar data={chartData} options={options} />
}

export function SkillTopicCard({ section }: { section: SkillSection }) {
  const [expanded, setExpanded] = useState(false)
  const done = section.topics.filter((t) => t.done).length
  return (
    <div className="rounded-2xl border border-slate-100 bg-white overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${section.bg}`}>
            <span className={section.color}>{section.icon}</span>
          </div>
          <div className="text-left">
            <div className="font-bold text-slate-800 text-sm">{section.label}</div>
            <div className="text-xs text-slate-400">
              {done}/{section.topics.length} chủ đề
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-20 bg-slate-100 rounded-full h-1.5">
            <div
              className="bg-purple-500 h-1.5 rounded-full"
              style={{ width: `${(done / section.topics.length) * 100}%` }}
            />
          </div>
          <ChevronRight
            className={`w-4 h-4 text-slate-400 transition-transform ${expanded ? 'rotate-90' : ''}`}
          />
        </div>
      </button>
      {expanded && (
        <div className="border-t border-slate-100 px-4 pb-4 pt-3 space-y-3">
          <div className="space-y-2">
            {section.topics.map((topic, i) => (
              <div
                key={i}
                className={`flex items-start gap-2.5 p-2.5 rounded-xl ${
                  topic.done ? 'bg-emerald-50' : 'bg-slate-50'
                }`}
              >
                <div
                  className={`mt-0.5 w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${
                    topic.done ? 'bg-emerald-500' : 'bg-slate-200'
                  }`}
                >
                  {topic.done && <CheckCircle2 className="w-3 h-3 text-white" />}
                </div>
                <div>
                  <div
                    className={`text-sm font-semibold ${
                      topic.done ? 'text-emerald-700 line-through' : 'text-slate-700'
                    }`}
                  >
                    {topic.title}
                  </div>
                  <div className="text-xs text-slate-400">{topic.desc}</div>
                </div>
              </div>
            ))}
          </div>
          <div className={`mt-3 p-3 rounded-xl ${section.bg}`}>
            <div className={`text-xs font-bold ${section.color} mb-1.5 flex items-center gap-1`}>
              <Zap className="w-3 h-3" /> Mẹo học tập
            </div>
            <ul className="space-y-1">
              {section.tips.map((tip, i) => (
                <li key={i} className="text-xs text-slate-600 flex items-start gap-1.5">
                  <span className="mt-0.5 text-slate-400">•</span> {tip}
                </li>
              ))}
            </ul>
          </div>
          <button
            className="w-full mt-2 py-2 text-sm font-medium rounded-xl bg-gradient-to-r from-purple-500 to-blue-500 text-white hover:from-purple-600 hover:to-blue-600 transition-colors cursor-pointer"
          >
            Học ngay
          </button>
        </div>
      )}
    </div>
  )
}

export function MosTaskPanel({ tasks, certId }: { tasks: MosTask[]; certId: CertId }) {
  const [activeTask, setActiveTask] = useState(0)
  const task = tasks[activeTask]

  const difficultyColor = (d: string) =>
    d === 'Easy'
      ? 'text-emerald-600 bg-emerald-50'
      : d === 'Medium'
      ? 'text-amber-600 bg-amber-50'
      : 'text-red-600 bg-red-50'

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="flex flex-col lg:flex-row min-h-[400px]">
        {/* Task List */}
        <div className="w-full lg:w-1/3 border-b lg:border-b-0 lg:border-r border-slate-100 bg-slate-50 p-5">
          <div className="flex items-center gap-2 mb-4">
            {getMosIcon(certId)}
            <h3 className="font-bold text-slate-800">Danh sách Task</h3>
          </div>
          <div className="space-y-2">
            {tasks.map((t, i) => (
              <button
                key={t.id}
                onClick={() => setActiveTask(i)}
                className={`w-full text-left p-3 rounded-xl transition-all border cursor-pointer ${
                  activeTask === i
                    ? 'bg-white border-purple-200 shadow-sm'
                    : 'bg-transparent border-transparent hover:bg-white'
                }`}
              >
                <div className="flex items-start gap-2">
                  <div
                    className={`mt-0.5 w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                      t.done ? 'bg-emerald-500' : 'bg-slate-200'
                    }`}
                  >
                    {t.done ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                    ) : (
                      <span className="text-xs font-bold text-slate-500">{i + 1}</span>
                    )}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-slate-700">{t.title}</div>
                    <span className={`text-xs font-bold px-1.5 py-0.5 rounded-md ${difficultyColor(t.difficulty)}`}>
                      {t.difficulty}
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Task Detail */}
        <div className="flex-1 p-6 flex flex-col gap-4">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-bold text-slate-800 text-lg">
                Task {task.id}: {task.title}
              </h3>
              <p className="text-sm text-slate-500 mt-1">{task.description}</p>
            </div>
            <span className={`text-xs font-bold px-2.5 py-1 rounded-lg shrink-0 ml-3 ${difficultyColor(task.difficulty)}`}>
              {task.difficulty}
            </span>
          </div>
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-slate-700 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-slate-400" /> Các bước thực hiện
            </h4>
            {task.steps.map((step, i) => (
              <div key={i} className="flex items-start gap-3">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                    i === 0 && task.done ? 'bg-emerald-500 text-white' : 'bg-purple-100 text-purple-700'
                  }`}
                >
                  {i + 1}
                </div>
                <p className="text-sm text-slate-600 pt-0.5">{step}</p>
              </div>
            ))}
          </div>
          <div className="mt-auto flex gap-3 flex-wrap">
            <button className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-500 to-blue-500 text-white text-sm font-medium rounded-xl hover:from-purple-600 hover:to-blue-600 transition-colors shadow-sm cursor-pointer">
              <Monitor className="w-4 h-4" /> Mở Simulator
            </button>
            <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-600 text-sm font-medium rounded-xl hover:bg-slate-50 transition-colors cursor-pointer">
              <Video className="w-4 h-4" /> Xem Video hướng dẫn
            </button>
          </div>
        </div>
      </div>

      {/* Simulation Banner */}
      <div className="border-t border-slate-100 bg-gradient-to-r from-slate-50 to-purple-50 p-4 flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center shadow-sm">
          <Keyboard className="w-5 h-5 text-purple-600" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-bold text-slate-700">Môi trường mô phỏng tương tác</p>
          <p className="text-xs text-slate-500">
            Luyện tập trực tiếp trên giao diện Office mô phỏng ngay trên trình duyệt.
          </p>
        </div>
        <button className="text-sm font-bold text-purple-600 hover:text-purple-700 flex items-center gap-1 shrink-0 cursor-pointer">
          Bắt đầu <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

export function BandSelector({
  cert,
  onSelect,
  onBack,
}: {
  cert: Certificate
  onSelect: (band: CertBand) => void
  onBack: () => void
}) {
  const bands = getBands(cert.id)
  const [hovered, setHovered] = useState<CertBand | null>(null)
  const isMos = cert.type === 'mos'

  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Back */}
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-purple-600 font-medium transition-colors cursor-pointer"
      >
        <ChevronLeft className="w-4 h-4" /> Ôn Luyện Chứng Chỉ
      </button>

      {/* Hero */}
      <div className="text-center mt-8 mb-10">
        <div
          className={`w-16 h-16 bg-gradient-to-br ${cert.bgFrom} ${cert.bgTo} mx-auto rounded-2xl flex items-center justify-center shadow-lg`}
        >
          <span className="text-xl font-black text-white">{cert.icon}</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-800 mt-4">
          {isMos ? `Chọn cấp độ cho ${cert.label}` : `Chọn mục tiêu ${cert.label}`}
        </h1>
        <p className="text-slate-500 text-sm mt-2 max-w-xl mx-auto">
          {isMos
            ? 'Lộ trình và nội dung luyện tập sẽ được cá nhân hoá theo cấp độ bạn chọn. Điểm đạt chuẩn MOS: ≥ 700 1,000.'
            : 'Lộ trình học, từ vựng và bài thi thử sẽ được cá nhân hoá theo mục tiêu. Bạn có thể đổi mục tiêu bất cứ lúc nào.'}
        </p>
        {!isMos && (
          <div className="mt-3 flex items-center justify-center gap-2 flex-wrap">
            <span className="text-xs text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full">Band 4.0 – Cơ bản</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
            <span className="text-xs text-purple-600 bg-purple-50 px-2.5 py-1 rounded-full font-medium">Band 6.0 – Phổ biến nhất</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
            <span className="text-xs text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full">Band 7.5+ – Xuất sắc</span>
          </div>
        )}
      </div>

      {/* Band cards */}
      <div
        className={`grid gap-4 ${
          bands.length === 2
            ? 'grid-cols-1 sm:grid-cols-2 max-w-2xl mx-auto'
            : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
        }`}
      >
        {bands.map((band) => (
          <button
            key={band.value}
            onMouseEnter={() => setHovered(band.value)}
            onMouseLeave={() => setHovered(null)}
            onClick={() => onSelect(band.value)}
            className={`relative text-left p-5 rounded-2xl border-2 transition-all duration-200 cursor-pointer hover:-translate-y-1 hover:shadow-lg ${
              hovered === band.value ? `${band.bg} ${band.borderActive}` : `bg-white ${band.border}`
            }`}
          >
            {band.recommended && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-purple-500 to-blue-500 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1 whitespace-nowrap shadow-sm">
                <Star className="w-3 h-3 fill-white" /> Phổ biến nhất
              </div>
            )}
            <div className="mb-3">
              <div className={`text-xl font-black ${band.color}`}>{band.label}</div>
              <div className={`text-xs font-semibold mt-0.5 ${band.color} opacity-80`}>{band.tagline}</div>
            </div>
            <p className="text-sm text-slate-500 mb-3 leading-relaxed">{band.description}</p>
            <ul className="space-y-1.5 mb-4">
              {band.requirements.map((req, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-slate-600">
                  <CheckCircle2 className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${band.color}`} />
                  {req}
                </li>
              ))}
            </ul>
            <div
              className={`w-full py-2.5 rounded-xl text-sm font-semibold text-center transition-colors ${
                hovered === band.value
                  ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white'
                  : `${band.bg} ${band.color} border ${band.border}`
              }`}
            >
              Chọn {isMos ? 'cấp độ' : 'mục tiêu'} này →
            </div>
          </button>
        ))}
      </div>

      {/* Note */}
      {isMos && cert.id !== 'mos-powerpoint' && (
        <p className="text-center text-xs text-slate-400 mt-6">
          * MOS Expert chỉ có cho Word và Excel. MOS PowerPoint chỉ có cấp Associate.
        </p>
      )}
    </div>
  )
}

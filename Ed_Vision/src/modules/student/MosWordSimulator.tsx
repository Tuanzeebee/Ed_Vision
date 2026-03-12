/* eslint-disable react-refresh/only-export-components */
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import TextAlign from '@tiptap/extension-text-align'
import { TextStyle } from '@tiptap/extension-text-style'
import { Color } from '@tiptap/extension-color'
import Underline from '@tiptap/extension-underline'
import Highlight from '@tiptap/extension-highlight'
import { Table } from '@tiptap/extension-table'
import TableRow from '@tiptap/extension-table-row'
import TableCell from '@tiptap/extension-table-cell'
import TableHeader from '@tiptap/extension-table-header'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import Heading from '@tiptap/extension-heading'
import { FontFamily } from '@tiptap/extension-font-family'
import { useState, useCallback, useEffect } from 'react'
import {
  Bold, Italic, Underline as UnderlineIcon, Strikethrough,
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  List, ListOrdered, Table as TableIcon, Image as ImageIcon,
  Link as LinkIcon, Highlighter, Palette, Type,
  ChevronDown, CheckCircle2, XCircle, Clock, Trophy,
  RotateCcw, Eye, Play, AlertTriangle, Star,
  FileText, BookOpen, Lightbulb,
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────
export interface MosWordTask {
  id: string
  title: string
  description: string
  difficulty: 'Easy' | 'Medium' | 'Hard'
  timeLimit: number          // phút
  instructions: string[]    // hướng dẫn từng bước
  hints: string[]
  initialContent: string    // HTML khởi đầu
  scoringCriteria: ScoringCriterion[]
  totalPoints: number
  theory: TheorySection[]
}

export interface ScoringCriterion {
  id: string
  label: string
  description: string
  points: number
  check: (html: string, editor: unknown) => boolean
}

export interface TheorySection {
  title: string
  content: string
  steps?: string[]
  tip?: string
}

export interface TaskResult {
  taskId: string
  score: number
  totalPoints: number
  percentage: number
  passed: boolean
  criteriaResults: { id: string; label: string; points: number; passed: boolean }[]
  timeSpent: number
}

// ─── MOS Word Tasks Data ──────────────────────────────────────────────────────
export const MOS_WORD_TASKS_DETAIL: MosWordTask[] = [
  // ── Task 1: Định dạng văn bản cơ bản ──────────────────────────────────────
  {
    id: 'mos-word-1',
    title: 'Định dạng văn bản cơ bản',
    description: 'Áp dụng tiêu đề (Heading), đoạn thân bài và danh sách bullet cho tài liệu.',
    difficulty: 'Easy',
    timeLimit: 10,
    instructions: [
      'Nhập tiêu đề chính "Báo cáo Doanh số Quý 3" và định dạng thành Heading 1',
      'Nhập đoạn văn bản thân bài dưới tiêu đề (ít nhất 20 từ)',
      'Thêm danh sách Bullet List gồm ít nhất 3 mục phía dưới',
      'In đậm (Bold) ít nhất một cụm từ quan trọng trong đoạn văn',
    ],
    hints: [
      'Chọn văn bản trước rồi mới nhấn định dạng',
      'Heading 1 là tiêu đề lớn nhất — dùng dropdown "Heading 1" trên toolbar',
      'Bullet List là danh sách dấu chấm tròn — icon ≡ trên toolbar',
      'Bôi đen từ → nhấn B để Bold',
    ],
    initialContent: `<p>Nhập nội dung tài liệu của bạn vào đây...</p>`,
    totalPoints: 40,
    scoringCriteria: [
      {
        id: 'h1',
        label: 'Có Heading 1',
        description: 'Tài liệu có ít nhất một tiêu đề cấp 1 (Heading 1)',
        points: 10,
        check: (html) => /<h1[\s>]/.test(html),
      },
      {
        id: 'body_text',
        label: 'Có đoạn thân bài (≥ 20 từ)',
        description: 'Đoạn văn <p> có ít nhất 20 từ',
        points: 10,
        check: (html) => {
          const text = html.replace(/<[^>]+>/g, ' ').trim()
          return text.split(/\s+/).filter(Boolean).length >= 20
        },
      },
      {
        id: 'bullet',
        label: 'Có Bullet List (≥ 3 mục)',
        description: 'Có danh sách không thứ tự với ít nhất 3 phần tử',
        points: 10,
        check: (html) => {
          const matches = html.match(/<li>/g)
          return !!matches && matches.length >= 3
        },
      },
      {
        id: 'bold',
        label: 'Có chữ đậm (Bold)',
        description: 'Ít nhất một đoạn văn bản được in đậm',
        points: 10,
        check: (html) => /<strong>/.test(html),
      },
    ],
    theory: [
      {
        title: '📌 Heading là gì?',
        content: 'Heading (Tiêu đề) dùng để phân cấp nội dung tài liệu. Trong Word, có Heading 1 (lớn nhất) đến Heading 6. Heading giúp tạo Table of Contents tự động và định hướng người đọc.',
        steps: [
          'Đặt con trỏ vào dòng muốn làm tiêu đề',
          'Trong simulator: nhấn dropdown "Heading" → chọn "Heading 1"',
          'Trong Word thật: tab Home → Styles → chọn Heading 1',
        ],
        tip: 'Trong thi MOS, Heading Style phải đúng cấp. Heading 1 cho tiêu đề chính, Heading 2 cho mục con.',
      },
      {
        title: '📝 Bullet List & Numbered List',
        content: 'Danh sách giúp trình bày thông tin rõ ràng. Bullet List (•) dùng cho các mục không có thứ tự. Numbered List (1,2,3) dùng khi thứ tự quan trọng.',
        steps: [
          'Đặt con trỏ tại vị trí muốn thêm danh sách',
          'Nhấn icon Bullet List trên toolbar',
          'Gõ nội dung, nhấn Enter để thêm mục mới',
          'Nhấn Enter hai lần hoặc Tab để thoát danh sách',
        ],
        tip: 'Trong bài thi, đọc kỹ yêu cầu: "bullet list" là danh sách chấm tròn, "numbered list" là danh sách đánh số.',
      },
      {
        title: '✏️ Bold, Italic, Underline',
        content: 'Các định dạng ký tự cơ bản nhất trong Word. Bold (đậm) nhấn mạnh nội dung. Italic (nghiêng) thường dùng cho thuật ngữ. Underline (gạch chân) dùng cho tiêu đề hoặc link.',
        steps: [
          'Bôi đen (select) đoạn văn bản muốn định dạng',
          'Nhấn B (Bold), I (Italic), U (Underline) trên toolbar',
          'Hoặc dùng phím tắt: Ctrl+B, Ctrl+I, Ctrl+U',
        ],
        tip: 'Trong thi MOS, thao tác thường yêu cầu chọn chính xác đoạn text trước — chú ý không chọn thừa/thiếu ký tự.',
      },
    ],
  },

  // ── Task 2: Bảng và định dạng bảng ───────────────────────────────────────
  {
    id: 'mos-word-2',
    title: 'Chèn và định dạng bảng',
    description: 'Tạo bảng dữ liệu, nhập nội dung và định dạng tiêu đề cột.',
    difficulty: 'Medium',
    timeLimit: 15,
    instructions: [
      'Chèn bảng 3 cột × 4 hàng vào tài liệu bằng nút "Chèn bảng" trên toolbar',
      'Hàng đầu tiên là hàng tiêu đề: nhập "Sản phẩm", "Số lượng", "Đơn giá"',
      'Nhập dữ liệu cho ít nhất 3 hàng bên dưới',
      'In đậm (Bold) toàn bộ hàng tiêu đề',
    ],
    hints: [
      'Nhấn icon Table trên toolbar → chọn số hàng/cột',
      'Click vào ô rồi gõ để nhập dữ liệu',
      'Dùng Tab để di chuyển sang ô tiếp theo',
      'Bôi đen cả hàng đầu → nhấn Bold',
    ],
    initialContent: `<p>Bảng dữ liệu sản phẩm:</p>`,
    totalPoints: 40,
    scoringCriteria: [
      {
        id: 'table_exists',
        label: 'Có bảng trong tài liệu',
        description: 'Tài liệu chứa ít nhất một bảng (<table>)',
        points: 10,
        check: (html) => /<table/.test(html),
      },
      {
        id: 'table_rows',
        label: 'Bảng có ít nhất 4 hàng',
        description: 'Bảng có ≥ 4 thẻ <tr>',
        points: 10,
        check: (html) => {
          const matches = html.match(/<tr/g)
          return !!matches && matches.length >= 4
        },
      },
      {
        id: 'table_cols',
        label: 'Bảng có ít nhất 3 cột',
        description: 'Hàng đầu tiên có ≥ 3 ô',
        points: 10,
        check: (html) => {
          const matches = html.match(/<t[dh]/g)
          return !!matches && matches.length >= 9
        },
      },
      {
        id: 'table_bold_header',
        label: 'Hàng tiêu đề được in đậm',
        description: 'Có <strong> bên trong <th> hoặc trong hàng đầu tiên',
        points: 10,
        check: (html) => /<th[^>]*>.*?<strong|<strong[^>]*>.*?<\/strong>.*?<\/t[dh]>/.test(html),
      },
    ],
    theory: [
      {
        title: '📊 Bảng trong Word',
        content: 'Bảng (Table) là công cụ cơ bản để trình bày dữ liệu có cấu trúc. Bảng gồm Rows (hàng) và Columns (cột), giao nhau tạo thành Cells (ô).',
        steps: [
          'Insert → Table → chọn số hàng và cột',
          'Hoặc dùng toolbar simulator: icon Table',
          'Click vào ô để nhập dữ liệu',
          'Tab để di chuyển sang ô tiếp theo',
          'Shift+Tab để quay lại ô trước',
        ],
        tip: 'Trong bài thi MOS, thường yêu cầu tạo bảng với số hàng/cột cụ thể, rồi nhập data mẫu. Đọc kỹ số lượng.',
      },
      {
        title: '🎨 Định dạng bảng',
        content: 'Sau khi tạo bảng, có thể định dạng để tăng tính chuyên nghiệp: đổi màu nền tiêu đề, thêm đường viền, căn giữa nội dung.',
        steps: [
          'Chọn hàng tiêu đề: click hàng đầu',
          'Áp dụng Bold cho chữ trong header',
          'Trong Word thật: Table Design → chọn Table Style',
          'Shading: đổi màu nền ô đã chọn',
        ],
        tip: 'MOS thường yêu cầu "apply a table style" — phải dùng đúng Table Design tab, không chỉ đổi màu thủ công.',
      },
    ],
  },

  // ── Task 3: Text Style & Formatting ──────────────────────────────────────
  {
    id: 'mos-word-3',
    title: 'Màu sắc, Highlight và Căn lề',
    description: 'Áp dụng màu chữ, highlight và căn lề cho văn bản.',
    difficulty: 'Easy',
    timeLimit: 8,
    instructions: [
      'Nhập ít nhất 2 đoạn văn (paragraph) nội dung bất kỳ',
      'Tô màu đỏ ít nhất một từ hoặc cụm từ',
      'Highlight (tô nền vàng) ít nhất một cụm từ khác',
      'Căn giữa (Center) cho đoạn văn đầu tiên',
      'Căn đều 2 lề (Justify) cho đoạn văn thứ hai',
    ],
    hints: [
      'Bôi đen text → icon A có màu (Text Color) để đổi màu chữ',
      'Bôi đen text → icon Highlight (bút dạ quang) để tô nền',
      'Click vào đoạn văn → nhấn icon Căn giữa trên toolbar',
    ],
    initialContent: `<p>Đoạn văn thứ nhất: Nhập nội dung của bạn tại đây.</p><p>Đoạn văn thứ hai: Thêm nội dung bổ sung vào đây.</p>`,
    totalPoints: 40,
    scoringCriteria: [
      {
        id: 'color_text',
        label: 'Có màu chữ tùy chỉnh',
        description: 'Có style color hoặc thẻ span với màu sắc',
        points: 10,
        check: (html) => /style="[^"]*color/.test(html) || /<span[^>]+color/.test(html),
      },
      {
        id: 'highlight',
        label: 'Có highlight (nền màu)',
        description: 'Có thẻ mark hoặc style background-color',
        points: 10,
        check: (html) => /<mark/.test(html) || /background-color/.test(html),
      },
      {
        id: 'center_align',
        label: 'Có căn giữa',
        description: 'Ít nhất một đoạn được căn giữa',
        points: 10,
        check: (html) => /text-align:\s*center|text-align="center"/.test(html),
      },
      {
        id: 'justify_align',
        label: 'Có căn đều (Justify)',
        description: 'Ít nhất một đoạn được căn đều',
        points: 10,
        check: (html) => /text-align:\s*justify|text-align="justify"/.test(html),
      },
    ],
    theory: [
      {
        title: '🎨 Màu chữ (Font Color)',
        content: 'Font Color cho phép thay đổi màu sắc của văn bản để nhấn mạnh nội dung quan trọng. Trong Word: Home → Font → chữ A có gạch chân màu.',
        steps: [
          'Bôi đen (select) đoạn text muốn đổi màu',
          'Click mũi tên cạnh biểu tượng A (Font Color)',
          'Chọn màu từ bảng màu hoặc "More Colors"',
        ],
        tip: 'Trong bài thi MOS, thường yêu cầu màu cụ thể (VD: "Red, Accent 2"). Chọn đúng trong Theme Colors.',
      },
      {
        title: '🖊️ Text Highlight',
        content: 'Highlight tô màu nền đằng sau chữ, giống bút dạ quang thật. Dùng để làm nổi bật thông tin quan trọng.',
        steps: [
          'Bôi đen text cần highlight',
          'Click icon Highlighter (bút dạ quang) trên toolbar',
          'Chọn màu highlight (thường là vàng)',
        ],
        tip: 'Highlight khác với Shading (đổi màu nền ô/đoạn). Highlight chỉ áp dụng cho text được select.',
      },
      {
        title: '↔️ Căn lề văn bản',
        content: 'Word có 4 kiểu căn lề: Left (trái - mặc định), Center (giữa), Right (phải), Justify (đều 2 lề). Justify làm văn bản dàn đều từ lề trái sang lề phải.',
        steps: [
          'Click vào đoạn văn muốn căn lề',
          'Nhấn phím tắt: Ctrl+L (Left), Ctrl+E (Center), Ctrl+R (Right), Ctrl+J (Justify)',
          'Hoặc dùng 4 icon căn lề trên toolbar',
        ],
        tip: 'Justify thường dùng cho văn bản dài, báo cáo. Center dùng cho tiêu đề, thơ. Trong bài thi thường ghi rõ "align center" hoặc "justify".',
      },
    ],
  },

  // ── Task 4: Lists & Structure ─────────────────────────────────────────────
  {
    id: 'mos-word-4',
    title: 'Danh sách & Cấu trúc tài liệu',
    description: 'Tạo cấu trúc tài liệu hoàn chỉnh với các cấp heading và danh sách.',
    difficulty: 'Medium',
    timeLimit: 12,
    instructions: [
      'Tạo tiêu đề chính với Heading 1',
      'Tạo 2 tiêu đề phụ với Heading 2',
      'Dưới mỗi Heading 2: thêm Numbered List (danh sách đánh số) gồm ít nhất 2 mục',
      'Thêm Heading 3 dưới một trong hai mục trên',
    ],
    hints: [
      'Heading 2 nhỏ hơn Heading 1 một cấp',
      'Numbered List là icon có số 1,2,3 trên toolbar',
      'Cấu trúc: H1 → H2 → nội dung → H2 → nội dung',
    ],
    initialContent: `<p>Bắt đầu xây dựng cấu trúc tài liệu tại đây...</p>`,
    totalPoints: 40,
    scoringCriteria: [
      {
        id: 'h1_exists',
        label: 'Có Heading 1',
        description: 'Tài liệu có tiêu đề cấp 1',
        points: 10,
        check: (html) => /<h1[\s>]/.test(html),
      },
      {
        id: 'h2_two',
        label: 'Có ≥ 2 Heading 2',
        description: 'Tài liệu có ít nhất 2 tiêu đề cấp 2',
        points: 10,
        check: (html) => {
          const matches = html.match(/<h2[\s>]/g)
          return !!matches && matches.length >= 2
        },
      },
      {
        id: 'numbered_list',
        label: 'Có Numbered List',
        description: 'Tài liệu có danh sách đánh số <ol>',
        points: 10,
        check: (html) => /<ol/.test(html),
      },
      {
        id: 'h3_exists',
        label: 'Có Heading 3',
        description: 'Tài liệu có ít nhất một tiêu đề cấp 3',
        points: 10,
        check: (html) => /<h3[\s>]/.test(html),
      },
    ],
    theory: [
      {
        title: '🏗️ Cấu trúc tài liệu Word',
        content: 'Tài liệu Word chuyên nghiệp có cấu trúc phân cấp rõ ràng. Sử dụng Heading Styles để tạo outline và cho phép tự động tạo mục lục (TOC).',
        steps: [
          'H1: Tiêu đề chính của toàn bộ tài liệu',
          'H2: Các chương/mục lớn',
          'H3: Các tiểu mục',
          'Paragraph: Nội dung văn bản bình thường',
        ],
        tip: 'Cấu trúc Heading đúng là điều kiện để "Insert Table of Contents" hoạt động. Đây là kiến thức quan trọng trong MOS Word.',
      },
      {
        title: '🔢 Numbered List vs Bullet List',
        content: 'Numbered List (Ordered List) dùng số thứ tự 1, 2, 3... Bullet List (Unordered List) dùng dấu chấm •. Chọn loại phù hợp với nội dung.',
        steps: [
          'Numbered: dùng khi thứ tự các bước quan trọng (quy trình, hướng dẫn)',
          'Bullet: dùng khi liệt kê các mục ngang hàng nhau',
          'Có thể lồng (nested): Tab để thụt vào, Shift+Tab để thụt ra',
        ],
        tip: 'Trong bài thi MOS, "create a numbered list" và "create a bulleted list" là 2 thao tác khác nhau — không thể dùng thay thế.',
      },
    ],
  },
]

// ─── Toolbar Button ────────────────────────────────────────────────────────────
function ToolbarBtn({
  active = false,
  disabled = false,
  onClick,
  title,
  children,
}: {
  active?: boolean
  disabled?: boolean
  onClick: () => void
  title: string
  children: React.ReactNode
}) {
  return (
    <button
      onMouseDown={(e) => { e.preventDefault(); onClick() }}
      disabled={disabled}
      title={title}
      className={`p-1.5 rounded transition-colors text-sm cursor-pointer ${
        active
          ? 'bg-blue-100 text-blue-700'
          : disabled
          ? 'text-slate-300 cursor-not-allowed'
          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-800'
      }`}
    >
      {children}
    </button>
  )
}

function Divider() {
  return <div className="w-px h-5 bg-slate-200 mx-1" />
}

// ─── Theory Panel ─────────────────────────────────────────────────────────────
function TheoryPanel({ theory }: { theory: TheorySection[] }) {
  const [open, setOpen] = useState(0)
  return (
    <div className="space-y-2">
      {theory.map((section, i) => (
        <div key={i} className="rounded-xl border border-slate-100 overflow-hidden">
          <button
            onClick={() => setOpen(open === i ? -1 : i)}
            className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100 transition-colors text-left cursor-pointer"
          >
            <span className="font-semibold text-slate-700 text-sm">{section.title}</span>
            <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${open === i ? 'rotate-180' : ''}`} />
          </button>
          {open === i && (
            <div className="px-4 pb-4 pt-3 space-y-3">
              <p className="text-sm text-slate-600 leading-relaxed">{section.content}</p>
              {section.steps && (
                <ol className="space-y-1">
                  {section.steps.map((step, j) => (
                    <li key={j} className="flex items-start gap-2 text-sm text-slate-600">
                      <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">{j + 1}</span>
                      {step}
                    </li>
                  ))}
                </ol>
              )}
              {section.tip && (
                <div className="bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 flex items-start gap-2">
                  <Lightbulb className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-800">{section.tip}</p>
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

// ─── Score Result Panel ────────────────────────────────────────────────────────
function ScorePanel({ result, onRetry, onNext }: { result: TaskResult; onRetry: () => void; onNext?: () => void }) {
  const grade = result.percentage >= 90 ? 'A' : result.percentage >= 75 ? 'B' : result.percentage >= 60 ? 'C' : 'D'
  const gradeColor = grade === 'A' ? 'text-emerald-600' : grade === 'B' ? 'text-blue-600' : grade === 'C' ? 'text-amber-600' : 'text-red-600'
  const gradeBg = grade === 'A' ? 'bg-emerald-50 border-emerald-200' : grade === 'B' ? 'bg-blue-50 border-blue-200' : grade === 'C' ? 'bg-amber-50 border-amber-200' : 'bg-red-50 border-red-200'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-5">
        {/* Header */}
        <div className="text-center">
          <div className={`w-20 h-20 rounded-full ${gradeBg} border-2 flex items-center justify-center mx-auto mb-3`}>
            <span className={`text-4xl font-black ${gradeColor}`}>{grade}</span>
          </div>
          <h2 className="text-xl font-bold text-slate-800">
            {result.passed ? '🎉 Hoàn thành!' : '💪 Cần luyện thêm'}
          </h2>
          <p className="text-slate-500 text-sm mt-1">
            {result.score} / {result.totalPoints} điểm • {result.percentage}%
          </p>
          <p className="text-xs text-slate-400 mt-1 flex items-center justify-center gap-1">
            <Clock className="w-3 h-3" /> Thời gian: {Math.floor(result.timeSpent / 60)}p {result.timeSpent % 60}s
          </p>
        </div>

        {/* Criteria Results */}
        <div className="space-y-2">
          {result.criteriaResults.map((c) => (
            <div key={c.id} className={`flex items-center justify-between px-3 py-2 rounded-lg ${c.passed ? 'bg-emerald-50' : 'bg-red-50'}`}>
              <div className="flex items-center gap-2">
                {c.passed
                  ? <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  : <XCircle className="w-4 h-4 text-red-400 shrink-0" />}
                <span className="text-sm text-slate-700">{c.label}</span>
              </div>
              <span className={`text-sm font-bold ${c.passed ? 'text-emerald-600' : 'text-red-400'}`}>
                {c.passed ? `+${c.points}` : '0'} pts
              </span>
            </div>
          ))}
        </div>

        {/* MOS Scale */}
        <div className="bg-slate-50 rounded-xl p-3 text-xs text-slate-500 text-center">
          <p className="font-semibold text-slate-600 mb-1">📊 Thang điểm MOS</p>
          <p>Đạt chuẩn MOS: ≥ 700/1000 điểm (~70%)</p>
          <div className="mt-2 w-full bg-slate-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all ${result.passed ? 'bg-emerald-500' : 'bg-red-400'}`}
              style={{ width: `${result.percentage}%` }}
            />
          </div>
          <div className="flex justify-between mt-1">
            <span>0</span>
            <span className="text-amber-600 font-bold">70% (Pass)</span>
            <span>100</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onRetry}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" /> Làm lại
          </button>
          {onNext && (
            <button
              onClick={onNext}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 text-white text-sm font-medium hover:from-blue-700 hover:to-blue-800 transition-colors cursor-pointer"
            >
              Task tiếp theo →
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Main Simulator ────────────────────────────────────────────────────────────
export default function MosWordSimulator({
  taskId,
  onComplete,
  onBack,
}: {
  taskId?: string
  onComplete?: (result: TaskResult) => void
  onBack?: () => void
}) {
  const [selectedTaskId, setSelectedTaskId] = useState(taskId ?? MOS_WORD_TASKS_DETAIL[0].id)
  const [mode, setMode] = useState<'theory' | 'practice'>('theory')
  const [result, setResult] = useState<TaskResult | null>(null)
  const [startTime, setStartTime] = useState<number>(Date.now())
  const [timeLeft, setTimeLeft] = useState<number>(0)
  const [timerActive, setTimerActive] = useState(false)
  const [showHints, setShowHints] = useState(false)

  const task = MOS_WORD_TASKS_DETAIL.find((t) => t.id === selectedTaskId) ?? MOS_WORD_TASKS_DETAIL[0]

  // ── Editor ────────────────────────────────────────────────────────────────
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: false }),
      Heading.configure({ levels: [1, 2, 3] }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      TextStyle,
      FontFamily,
      Color,
      Underline,
      Highlight.configure({ multicolor: true }),
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
      Image,
      Link.configure({ openOnClick: false }),
    ],
    content: task.initialContent,
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none min-h-[400px] p-6 font-["Calibri",sans-serif] text-slate-800',
      },
    },
  })

  // Reset editor khi đổi task
  useEffect(() => {
    if (editor && task) {
      editor.commands.setContent(task.initialContent)
      setResult(null)
      setTimeLeft(task.timeLimit * 60)
      setTimerActive(false)
      setMode('theory')
    }
  }, [task.id]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Timer ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!timerActive || timeLeft <= 0) return
    const interval = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) { setTimerActive(false); handleSubmit(); return 0 }
        return t - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [timerActive, timeLeft]) // eslint-disable-line react-hooks/exhaustive-deps

  const startPractice = useCallback(() => {
    setMode('practice')
    setStartTime(Date.now())
    setTimeLeft(task.timeLimit * 60)
    setTimerActive(true)
    setResult(null)
  }, [task.timeLimit])

  // ── Scoring ───────────────────────────────────────────────────────────────
  const handleSubmit = useCallback(() => {
    if (!editor) return
    setTimerActive(false)
    const html = editor.getHTML()
    const criteriaResults = task.scoringCriteria.map((c) => ({
      id: c.id,
      label: c.label,
      points: c.points,
      passed: c.check(html, editor),
    }))
    const score = criteriaResults.reduce((sum, c) => sum + (c.passed ? c.points : 0), 0)
    const percentage = Math.round((score / task.totalPoints) * 100)
    const timeSpent = Math.round((Date.now() - startTime) / 1000)
    const taskResult: TaskResult = {
      taskId: task.id,
      score,
      totalPoints: task.totalPoints,
      percentage,
      passed: percentage >= 70,
      criteriaResults,
      timeSpent,
    }
    setResult(taskResult)
    onComplete?.(taskResult)
  }, [editor, task, startTime, onComplete])

  const handleRetry = useCallback(() => {
    editor?.commands.setContent(task.initialContent)
    setResult(null)
    setMode('theory')
    setTimerActive(false)
  }, [editor, task.initialContent])

  const handleNextTask = useCallback(() => {
    const idx = MOS_WORD_TASKS_DETAIL.findIndex((t) => t.id === selectedTaskId)
    if (idx < MOS_WORD_TASKS_DETAIL.length - 1) {
      setSelectedTaskId(MOS_WORD_TASKS_DETAIL[idx + 1].id)
    }
  }, [selectedTaskId])

  const formatTime = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`

  if (!editor) return null

  const difficultyColor = (d: string) =>
    d === 'Easy' ? 'text-emerald-600 bg-emerald-50 border-emerald-200'
      : d === 'Medium' ? 'text-amber-600 bg-amber-50 border-amber-200'
      : 'text-red-600 bg-red-50 border-red-200'

  return (
    <div className="flex flex-col h-full bg-slate-50 rounded-2xl overflow-hidden border border-slate-200 shadow-sm">

      {/* ── Title Bar (giống Word) ── */}
      <div className="bg-[#2b579a] text-white px-4 py-2 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          {onBack && (
            <button onClick={onBack} className="text-white/70 hover:text-white transition-colors text-sm cursor-pointer">← Quay lại</button>
          )}
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-white/80" />
            <span className="font-semibold text-sm">MOS Word Simulator</span>
            <span className="text-white/50 text-xs">— {task.title}</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Timer */}
          {mode === 'practice' && (
            <div className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-sm font-bold ${timeLeft < 60 ? 'bg-red-500 animate-pulse' : 'bg-white/20'}`}>
              <Clock className="w-3.5 h-3.5" />
              {formatTime(timeLeft)}
            </div>
          )}
          <span className={`text-xs px-2 py-1 rounded-full border font-semibold ${difficultyColor(task.difficulty)}`}>
            {task.difficulty}
          </span>
        </div>
      </div>

      {/* ── Ribbon (Tab bar) ── */}
      <div className="bg-[#f3f3f3] border-b border-slate-200 px-4 flex items-center gap-1 shrink-0">
        {/* Task selector */}
        <div className="relative group mr-2">
          <select
            value={selectedTaskId}
            onChange={(e) => setSelectedTaskId(e.target.value)}
            className="text-xs font-medium text-slate-600 bg-transparent border-none outline-none cursor-pointer py-2 pr-6 appearance-none"
          >
            {MOS_WORD_TASKS_DETAIL.map((t) => (
              <option key={t.id} value={t.id}>{t.title}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none" />
        </div>
        <Divider />
        <button
          onClick={() => setMode('theory')}
          className={`px-3 py-2 text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${mode === 'theory' ? 'text-blue-700 border-b-2 border-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
        >
          <BookOpen className="w-3.5 h-3.5" /> Lý thuyết
        </button>
        <button
          onClick={() => mode === 'theory' ? startPractice() : undefined}
          className={`px-3 py-2 text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${mode === 'practice' ? 'text-blue-700 border-b-2 border-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
        >
          <Play className="w-3.5 h-3.5" /> Thực hành
        </button>
      </div>

      {/* ── Main Content ── */}
      {mode === 'theory' ? (
        // ── Theory Mode ───────────────────────────────────────────────────
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Task Header */}
          <div className="bg-white rounded-xl border border-slate-100 p-5 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${difficultyColor(task.difficulty)}`}>{task.difficulty}</span>
                  <span className="text-xs text-slate-400 flex items-center gap-1"><Clock className="w-3 h-3" /> {task.timeLimit} phút</span>
                  <span className="text-xs text-slate-400 flex items-center gap-1"><Trophy className="w-3 h-3" /> {task.totalPoints} điểm</span>
                </div>
                <h2 className="font-bold text-slate-800 text-lg">{task.title}</h2>
                <p className="text-slate-500 text-sm mt-1">{task.description}</p>
              </div>
              <button
                onClick={startPractice}
                className="shrink-0 flex items-center gap-2 px-4 py-2 bg-[#2b579a] text-white text-sm font-semibold rounded-lg hover:bg-[#1e407a] transition-colors cursor-pointer"
              >
                <Play className="w-4 h-4" /> Bắt đầu thực hành
              </button>
            </div>

            {/* Instructions */}
            <div className="mt-4 border-t border-slate-100 pt-4">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5" /> Yêu cầu bài thi
              </p>
              <ol className="space-y-2">
                {task.instructions.map((ins, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm text-slate-700">
                    <span className="w-5 h-5 rounded-full bg-[#2b579a] text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                    {ins}
                  </li>
                ))}
              </ol>
            </div>
          </div>

          {/* Theory Sections */}
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">📚 Kiến thức cần biết</p>
            <TheoryPanel theory={task.theory} />
          </div>

          {/* Scoring Criteria preview */}
          <div className="bg-white rounded-xl border border-slate-100 p-5 shadow-sm">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Star className="w-3.5 h-3.5" /> Tiêu chí chấm điểm
            </p>
            <div className="space-y-2">
              {task.scoringCriteria.map((c) => (
                <div key={c.id} className="flex items-center justify-between px-3 py-2 bg-slate-50 rounded-lg">
                  <div>
                    <p className="text-sm font-semibold text-slate-700">{c.label}</p>
                    <p className="text-xs text-slate-400">{c.description}</p>
                  </div>
                  <span className="text-sm font-bold text-[#2b579a] shrink-0 ml-3">{c.points} pts</span>
                </div>
              ))}
            </div>
            <div className="mt-3 pt-3 border-t border-slate-100 flex justify-between text-sm">
              <span className="text-slate-500">Tổng điểm</span>
              <span className="font-bold text-slate-800">{task.totalPoints} pts</span>
            </div>
            <p className="text-xs text-amber-600 mt-2 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" /> Cần ≥ 70% ({Math.ceil(task.totalPoints * 0.7)} pts) để đạt chuẩn MOS
            </p>
          </div>
        </div>
      ) : (
        // ── Practice Mode ──────────────────────────────────────────────────
        <div className="flex flex-col flex-1 overflow-hidden">
          {/* Word-style Toolbar */}
          <div className="bg-white border-b border-slate-200 px-3 py-1.5 flex flex-wrap items-center gap-0.5 shrink-0">
            {/* History */}
            <ToolbarBtn title="Undo (Ctrl+Z)" onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()}>
              <RotateCcw className="w-4 h-4" />
            </ToolbarBtn>
            <Divider />

            {/* Heading dropdown */}
            <select
              value={
                editor.isActive('heading', { level: 1 }) ? '1'
                : editor.isActive('heading', { level: 2 }) ? '2'
                : editor.isActive('heading', { level: 3 }) ? '3'
                : '0'
              }
              onChange={(e) => {
                const val = Number(e.target.value)
                if (val === 0) editor.chain().focus().setParagraph().run()
                else editor.chain().focus().setHeading({ level: val as 1|2|3 }).run()
              }}
              className="text-xs border border-slate-200 rounded px-1.5 py-1 bg-white text-slate-700 cursor-pointer outline-none hover:border-slate-300 mr-1"
            >
              <option value="0">Normal Text</option>
              <option value="1">Heading 1</option>
              <option value="2">Heading 2</option>
              <option value="3">Heading 3</option>
            </select>

            <Divider />

            {/* Character formatting */}
            <ToolbarBtn title="Bold (Ctrl+B)" active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()}>
              <Bold className="w-4 h-4" />
            </ToolbarBtn>
            <ToolbarBtn title="Italic (Ctrl+I)" active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()}>
              <Italic className="w-4 h-4" />
            </ToolbarBtn>
            <ToolbarBtn title="Underline (Ctrl+U)" active={editor.isActive('underline')} onClick={() => editor.chain().focus().toggleUnderline().run()}>
              <UnderlineIcon className="w-4 h-4" />
            </ToolbarBtn>
            <ToolbarBtn title="Strikethrough" active={editor.isActive('strike')} onClick={() => editor.chain().focus().toggleStrike().run()}>
              <Strikethrough className="w-4 h-4" />
            </ToolbarBtn>

            <Divider />

            {/* Color */}
            <div className="relative flex items-center">
              <ToolbarBtn title="Font Color" onClick={() => {}}>
                <Palette className="w-4 h-4" />
              </ToolbarBtn>
              <input
                type="color"
                className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                title="Font Color"
                onChange={(e) => editor.chain().focus().setColor(e.target.value).run()}
              />
            </div>

            {/* Highlight */}
            <ToolbarBtn
              title="Highlight"
              active={editor.isActive('highlight')}
              onClick={() => editor.chain().focus().toggleHighlight({ color: '#fef08a' }).run()}
            >
              <Highlighter className="w-4 h-4" />
            </ToolbarBtn>

            <Divider />

            {/* Text Align */}
            <ToolbarBtn title="Align Left" active={editor.isActive({ textAlign: 'left' })} onClick={() => editor.chain().focus().setTextAlign('left').run()}>
              <AlignLeft className="w-4 h-4" />
            </ToolbarBtn>
            <ToolbarBtn title="Align Center" active={editor.isActive({ textAlign: 'center' })} onClick={() => editor.chain().focus().setTextAlign('center').run()}>
              <AlignCenter className="w-4 h-4" />
            </ToolbarBtn>
            <ToolbarBtn title="Align Right" active={editor.isActive({ textAlign: 'right' })} onClick={() => editor.chain().focus().setTextAlign('right').run()}>
              <AlignRight className="w-4 h-4" />
            </ToolbarBtn>
            <ToolbarBtn title="Justify" active={editor.isActive({ textAlign: 'justify' })} onClick={() => editor.chain().focus().setTextAlign('justify').run()}>
              <AlignJustify className="w-4 h-4" />
            </ToolbarBtn>

            <Divider />

            {/* Lists */}
            <ToolbarBtn title="Bullet List" active={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()}>
              <List className="w-4 h-4" />
            </ToolbarBtn>
            <ToolbarBtn title="Numbered List" active={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
              <ListOrdered className="w-4 h-4" />
            </ToolbarBtn>

            <Divider />

            {/* Table */}
            <ToolbarBtn
              title="Chèn bảng 3×4"
              onClick={() => editor.chain().focus().insertTable({ rows: 4, cols: 3, withHeaderRow: true }).run()}
            >
              <TableIcon className="w-4 h-4" />
            </ToolbarBtn>

            {/* Image */}
            <ToolbarBtn
              title="Chèn hình ảnh (URL)"
              onClick={() => {
                const url = prompt('Nhập URL hình ảnh:')
                if (url) editor.chain().focus().setImage({ src: url }).run()
              }}
            >
              <ImageIcon className="w-4 h-4" />
            </ToolbarBtn>

            {/* Link */}
            <ToolbarBtn
              title="Chèn liên kết"
              active={editor.isActive('link')}
              onClick={() => {
                const url = prompt('Nhập URL liên kết:')
                if (url) editor.chain().focus().setLink({ href: url }).run()
              }}
            >
              <LinkIcon className="w-4 h-4" />
            </ToolbarBtn>

            <Divider />

            {/* Font size (visual only) */}
            <div className="flex items-center gap-1 text-xs text-slate-500">
              <Type className="w-3.5 h-3.5" />
              <select
                className="text-xs border border-slate-200 rounded px-1 py-0.5 bg-white text-slate-700 cursor-pointer outline-none"
                onChange={(e) => editor.chain().focus().setFontFamily(e.target.value).run()}
              >
                <option value="Calibri, sans-serif">Calibri</option>
                <option value="Times New Roman, serif">Times New Roman</option>
                <option value="Arial, sans-serif">Arial</option>
                <option value="Georgia, serif">Georgia</option>
              </select>
            </div>
          </div>

          {/* Practice layout: Editor + Side panel */}
          <div className="flex flex-1 overflow-hidden">
            {/* Editor area */}
            <div className="flex-1 overflow-y-auto bg-[#e8e8e8] p-4">
              <div className="bg-white shadow-md mx-auto" style={{ width: '100%', maxWidth: '794px', minHeight: '1123px' }}>
                <EditorContent editor={editor} />
              </div>
            </div>

            {/* Side panel: Instructions + Hints */}
            <div className="w-64 shrink-0 border-l border-slate-200 bg-white overflow-y-auto flex flex-col">
              {/* Instructions */}
              <div className="p-4 border-b border-slate-100">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">📋 Yêu cầu</p>
                <ol className="space-y-2">
                  {task.instructions.map((ins, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-slate-600">
                      <span className="w-4 h-4 rounded-full bg-[#2b579a] text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5 text-[10px]">{i + 1}</span>
                      {ins}
                    </li>
                  ))}
                </ol>
              </div>

              {/* Hints */}
              <div className="p-4 border-b border-slate-100">
                <button
                  onClick={() => setShowHints(!showHints)}
                  className="flex items-center justify-between w-full cursor-pointer"
                >
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                    <Lightbulb className="w-3.5 h-3.5 text-amber-500" /> Gợi ý
                  </p>
                  <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${showHints ? 'rotate-180' : ''}`} />
                </button>
                {showHints && (
                  <ul className="mt-2 space-y-1.5">
                    {task.hints.map((hint, i) => (
                      <li key={i} className="text-xs text-amber-700 bg-amber-50 rounded-lg px-2.5 py-1.5 border border-amber-100">
                        💡 {hint}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Scoring preview */}
              <div className="p-4 flex-1">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <Star className="w-3.5 h-3.5" /> Tiêu chí ({task.totalPoints} pts)
                </p>
                <div className="space-y-1.5">
                  {task.scoringCriteria.map((c) => (
                    <div key={c.id} className="flex justify-between items-start text-xs">
                      <span className="text-slate-600 flex-1 leading-relaxed">{c.label}</span>
                      <span className="text-[#2b579a] font-bold shrink-0 ml-2">{c.points}p</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Submit button */}
              <div className="p-4 border-t border-slate-100">
                <button
                  onClick={handleSubmit}
                  className="w-full py-2.5 bg-[#2b579a] text-white text-sm font-semibold rounded-lg hover:bg-[#1e407a] transition-colors cursor-pointer flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" /> Nộp bài & Chấm điểm
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Score Result Modal */}
      {result && (
        <ScorePanel
          result={result}
          onRetry={handleRetry}
          onNext={
            MOS_WORD_TASKS_DETAIL.findIndex((t) => t.id === selectedTaskId) < MOS_WORD_TASKS_DETAIL.length - 1
              ? handleNextTask
              : undefined
          }
        />
      )}
    </div>
  )
}

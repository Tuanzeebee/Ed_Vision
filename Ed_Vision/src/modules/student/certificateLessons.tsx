/* eslint-disable react-refresh/only-export-components */
import { useState } from 'react'
import {
  X,
  ChevronDown,
  ChevronUp,
  BookOpen,
  AlertTriangle,
  Lightbulb,
  Target,
  CheckCircle2,
  XCircle,
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────
export interface TenseEntry {
  name: string
  usage: string
  signals: string[]
  formula: string
  negative?: string
  question?: string
  examples: { en: string; vi: string; note?: string }[]
}

export interface LessonRule {
  title: string
  examples: { en: string; vi: string; note?: string }[]
}

export interface QuizQuestion {
  question: string
  options: string[]
  answer: number
  explanation: string
}

export interface TopicLesson {
  key: string
  title: string
  subtitle?: string
  intro: string
  tenses?: TenseEntry[]
  rules?: LessonRule[]
  commonMistakes?: { wrong: string; correct: string; explanation: string }[]
  studyTips?: string[]
  quiz?: QuizQuestion[]
}

// ─── Lesson Content ────────────────────────────────────────────────────────────
export const TOPIC_LESSONS: Record<string, TopicLesson> = {

  // ── IELTS 4.0 Grammar ──────────────────────────────────────────────────────

  'grammar.12_tenses': {
    key: 'grammar.12_tenses',
    title: '12 Thì Tiếng Anh',
    subtitle: 'Present / Past / Future × Simple / Continuous / Perfect / Perfect Continuous',
    intro:
      'Tiếng Anh có 12 thì động từ, tạo bởi 3 trục thời gian (Hiện tại / Quá khứ / Tương lai) kết hợp với 4 dạng (Simple / Continuous / Perfect / Perfect Continuous). Nắm vững 12 thì là bước đầu tiên và quan trọng nhất để học tiếng Anh. Chú ý Signal Words – chúng là chìa khóa nhận biết thì trong bài thi.',
    tenses: [
      {
        name: '1. Hiện tại đơn (Present Simple)',
        usage: 'Thói quen, sự thật hiển nhiên, lịch trình, sở thích lặp lại',
        signals: ['always', 'usually', 'often', 'sometimes', 'rarely', 'never', 'every day / week / month', 'on Mondays'],
        formula: 'S + V (nguyên mẫu) | ngôi 3 số ít: S + V(s/es)',
        negative: 'S + do / does + not + V',
        question: 'Do / Does + S + V …?',
        examples: [
          { en: 'She works at a hospital.', vi: 'Cô ấy làm việc tại bệnh viện.', note: 'she → +s' },
          { en: 'The sun rises in the east.', vi: 'Mặt trời mọc ở phía đông.', note: 'sự thật hiển nhiên' },
          { en: 'I always eat breakfast at 7 am.', vi: 'Tôi luôn ăn sáng lúc 7 giờ.', note: '"always" là Signal Word' },
        ],
      },
      {
        name: '2. Hiện tại tiếp diễn (Present Continuous)',
        usage: 'Hành động đang xảy ra tại thời điểm nói; kế hoạch tương lai gần đã sắp xếp',
        signals: ['now', 'at the moment', 'at present', 'currently', 'right now', 'Look!', 'Listen!', 'tonight (= kế hoạch)'],
        formula: 'S + am / is / are + V-ing',
        negative: 'S + am / is / are + not + V-ing',
        question: 'Am / Is / Are + S + V-ing …?',
        examples: [
          { en: 'She is working now.', vi: 'Cô ấy đang làm việc bây giờ.' },
          { en: 'Look! It is raining.', vi: 'Nhìn kìa! Trời đang mưa.' },
          { en: 'I am meeting Tom tonight.', vi: 'Tối nay tôi gặp Tom.', note: 'Kế hoạch đã sắp xếp' },
        ],
      },
      {
        name: '3. Hiện tại hoàn thành (Present Perfect)',
        usage: 'Hành động quá khứ có liên quan đến hiện tại; kinh nghiệm sống; hành động vừa xảy ra',
        signals: ['already', 'yet', 'just', 'ever', 'never', 'since + mốc thời gian', 'for + khoảng thời gian', 'recently', 'so far', 'up to now', 'lately'],
        formula: 'S + have / has + V3/V-ed',
        negative: 'S + have / has + not + V3',
        question: 'Have / Has + S + V3 …?',
        examples: [
          { en: 'She has worked here for 5 years.', vi: 'Cô ấy đã làm việc ở đây được 5 năm.', note: '"for" + khoảng thời gian' },
          { en: 'Have you ever been to Paris?', vi: 'Bạn đã từng đến Paris chưa?', note: 'kinh nghiệm' },
          { en: 'I have just finished my homework.', vi: 'Tôi vừa mới làm xong bài tập.', note: '"just" → vừa xảy ra' },
        ],
      },
      {
        name: '4. Hiện tại hoàn thành tiếp diễn (Present Perfect Continuous)',
        usage: 'Hành động bắt đầu trong quá khứ và vẫn đang tiếp diễn đến hiện tại – nhấn mạnh thời gian',
        signals: ['for + khoảng thời gian', 'since + mốc thời gian', 'all day / morning / week', 'how long', 'lately', 'recently'],
        formula: 'S + have / has + been + V-ing',
        negative: 'S + have / has + not + been + V-ing',
        question: 'Have / Has + S + been + V-ing …?',
        examples: [
          { en: 'She has been working here since 2020.', vi: 'Cô ấy đã làm việc ở đây từ năm 2020.' },
          { en: 'I have been studying English for 3 years.', vi: 'Tôi đã học tiếng Anh được 3 năm.' },
          { en: 'It has been raining all day.', vi: 'Trời đã mưa cả ngày.' },
        ],
      },
      {
        name: '5. Quá khứ đơn (Past Simple)',
        usage: 'Hành động đã xảy ra và kết thúc tại một thời điểm xác định trong quá khứ',
        signals: ['yesterday', 'last night / week / month / year', 'ago', 'in + year (in 2020)', 'when I was young', 'in the past'],
        formula: 'S + V2 / V-ed (động từ bất quy tắc: go→went, see→saw…)',
        negative: 'S + did + not + V',
        question: 'Did + S + V …?',
        examples: [
          { en: 'She worked there last year.', vi: 'Năm ngoái cô ấy đã làm việc ở đó.' },
          { en: 'I visited Paris in 2019.', vi: 'Tôi đã đến thăm Paris năm 2019.' },
          { en: 'Did you see that movie?', vi: 'Bạn đã xem bộ phim đó chưa?' },
        ],
      },
      {
        name: '6. Quá khứ tiếp diễn (Past Continuous)',
        usage: 'Hành động đang diễn ra tại một thời điểm xác định trong quá khứ, hoặc bị gián đoạn bởi hành động khác',
        signals: ['at this time yesterday', 'at + giờ cụ thể (at 8pm last night)', 'when (+ quá khứ đơn)', 'while', 'as'],
        formula: 'S + was / were + V-ing',
        negative: 'S + was / were + not + V-ing',
        question: 'Was / Were + S + V-ing …?',
        examples: [
          { en: 'She was working when I called.', vi: 'Cô ấy đang làm việc khi tôi gọi.', note: '"when I called" gián đoạn' },
          { en: 'At 8 pm yesterday, I was watching TV.', vi: 'Lúc 8 giờ tối qua tôi đang xem TV.' },
          { en: 'While I was sleeping, he arrived.', vi: 'Trong khi tôi đang ngủ, anh ấy đến.' },
        ],
      },
      {
        name: '7. Quá khứ hoàn thành (Past Perfect)',
        usage: 'Hành động xảy ra và hoàn thành TRƯỚC một hành động khác trong quá khứ',
        signals: ['before', 'after', 'by the time', 'when', 'already', 'just', 'never', 'by + past time'],
        formula: 'S + had + V3 / V-ed',
        negative: 'S + had + not + V3',
        question: 'Had + S + V3 …?',
        examples: [
          { en: 'When I arrived, they had already left.', vi: 'Khi tôi đến, họ đã đi rồi.', note: '"had left" xảy ra trước "arrived"' },
          { en: 'She had worked there before she moved.', vi: 'Cô ấy đã làm việc ở đó trước khi chuyển đi.' },
          { en: 'I had never seen snow before 2020.', vi: 'Trước năm 2020 tôi chưa bao giờ thấy tuyết.' },
        ],
      },
      {
        name: '8. Quá khứ hoàn thành tiếp diễn (Past Perfect Continuous)',
        usage: 'Hành động đang tiếp diễn liên tục trước một thời điểm / hành động trong quá khứ – nhấn mạnh thời gian',
        signals: ['for + khoảng thời gian (before quá khứ)', 'since', 'before', 'by the time', 'how long ... had'],
        formula: 'S + had + been + V-ing',
        negative: 'S + had + not + been + V-ing',
        question: 'Had + S + been + V-ing …?',
        examples: [
          { en: 'She had been working there for 2 years before she quit.', vi: 'Cô ấy đã làm việc ở đó 2 năm trước khi nghỉ.' },
          { en: 'He was tired because he had been running.', vi: 'Anh ấy mệt vì đã chạy liên tục.' },
          { en: 'I had been waiting for 30 minutes when she finally arrived.', vi: 'Tôi đã đợi 30 phút khi cô ấy cuối cùng đến.' },
        ],
      },
      {
        name: '9. Tương lai đơn (Future Simple)',
        usage: 'Quyết định ngay lúc nói, dự đoán, lời hứa, đề nghị, hành động sẽ xảy ra trong tương lai',
        signals: ['tomorrow', 'next week / month / year', 'soon', 'in the future', 'I think / believe / hope', 'probably', 'in + future year'],
        formula: 'S + will + V (nguyên mẫu)',
        negative: "S + will + not (won't) + V",
        question: 'Will + S + V …?',
        examples: [
          { en: 'She will start her new job next Monday.', vi: 'Cô ấy sẽ bắt đầu công việc mới vào thứ Hai tới.' },
          { en: 'I think it will rain tomorrow.', vi: 'Tôi nghĩ ngày mai trời sẽ mưa.', note: 'dự đoán' },
          { en: "I'll help you with that.", vi: 'Tôi sẽ giúp bạn.', note: 'quyết định tức thì' },
        ],
      },
      {
        name: '10. Tương lai tiếp diễn (Future Continuous)',
        usage: 'Hành động sẽ đang xảy ra tại một thời điểm xác định trong tương lai',
        signals: ['at this time tomorrow', 'at + giờ cụ thể (tonight/tomorrow)', 'when (+ present)', 'while', 'this time next week'],
        formula: 'S + will + be + V-ing',
        negative: 'S + will + not + be + V-ing',
        question: 'Will + S + be + V-ing …?',
        examples: [
          { en: 'She will be working at 8 am tomorrow.', vi: 'Lúc 8 giờ sáng mai cô ấy sẽ đang làm việc.' },
          { en: 'This time next week, I will be travelling to Japan.', vi: 'Tuần tới vào giờ này tôi sẽ đang du lịch ở Nhật.' },
          { en: 'When you arrive, I will be cooking dinner.', vi: 'Khi bạn đến, tôi sẽ đang nấu ăn tối.' },
        ],
      },
      {
        name: '11. Tương lai hoàn thành (Future Perfect)',
        usage: 'Hành động sẽ hoàn thành TRƯỚC một thời điểm xác định trong tương lai',
        signals: ['by tomorrow', 'by next week / month / year', 'by the time', 'before + future event'],
        formula: 'S + will + have + V3 / V-ed',
        negative: 'S + will + not + have + V3',
        question: 'Will + S + have + V3 …?',
        examples: [
          { en: 'She will have finished the report by 5 pm.', vi: 'Đến 5 giờ chiều cô ấy sẽ đã hoàn thành báo cáo.' },
          { en: 'By 2025, he will have worked here for 10 years.', vi: 'Đến năm 2025, anh ấy sẽ đã làm việc ở đây 10 năm.' },
          { en: 'Will you have finished before I arrive?', vi: 'Bạn sẽ làm xong trước khi tôi đến không?' },
        ],
      },
      {
        name: '12. Tương lai hoàn thành tiếp diễn (Future Perfect Continuous)',
        usage: 'Hành động sẽ đang tiếp diễn liên tục đến một thời điểm trong tương lai – nhấn mạnh thời gian',
        signals: ['by (time) ... for (duration)', 'by the time ... for'],
        formula: 'S + will + have + been + V-ing',
        negative: 'S + will + not + have + been + V-ing',
        question: 'Will + S + have + been + V-ing …?',
        examples: [
          { en: 'By 2030, she will have been teaching for 20 years.', vi: 'Đến năm 2030, cô ấy sẽ đã dạy học được 20 năm.' },
          { en: 'By the time he retires, he will have been working for 40 years.', vi: 'Đến khi về hưu, anh ấy sẽ đã làm việc được 40 năm.' },
        ],
      },
    ],
    commonMistakes: [
      {
        wrong: 'She work at a hospital.',
        correct: 'She works at a hospital.',
        explanation: 'Ngôi thứ 3 số ít (he/she/it) ở Hiện tại đơn phải thêm -s/-es vào động từ.',
      },
      {
        wrong: 'I have seen him yesterday.',
        correct: 'I saw him yesterday.',
        explanation: '"yesterday" là mốc thời gian xác định → phải dùng Quá khứ đơn. Hiện tại hoàn thành KHÔNG đi với thời điểm cụ thể.',
      },
      {
        wrong: 'When I arrived, he left already.',
        correct: 'When I arrived, he had already left.',
        explanation: 'Hành động xảy ra TRƯỚC một hành động khác trong quá khứ → phải dùng Quá khứ hoàn thành (had + V3).',
      },
      {
        wrong: 'She is knowing the answer.',
        correct: 'She knows the answer.',
        explanation: 'Động từ chỉ trạng thái nhận thức (know, understand, believe, like, love, hate…) thường KHÔNG dùng ở thì tiếp diễn.',
      },
    ],
    studyTips: [
      'Học theo cặp đối lập: Present Simple ↔ Present Continuous; Past Simple ↔ Past Perfect',
      'Tạo bảng tóm tắt 12 thì với ví dụ cá nhân (câu về chính bạn)',
      'Signal Words là chìa khóa: thấy "yesterday" → Past Simple; "since/for" + hiện tại → Present Perfect',
      'Luyện viết 3 câu/thì mỗi ngày cho đến khi thành phản xạ',
      'Stative verbs (know, like, love, believe, want, need…) hiếm khi dùng ở thì tiếp diễn',
    ],
    quiz: [
      {
        question: '"By the time you arrive, I _____ dinner." – Chọn đúng:',
        options: ['will cook', 'will have cooked', 'am cooking', 'cook'],
        answer: 1,
        explanation: '"By the time you arrive" = trước thời điểm tương lai → Tương lai hoàn thành: will have cooked.',
      },
      {
        question: '"I _____ here since 2018." – Chọn đúng:',
        options: ['work', 'worked', 'have been working', 'am working'],
        answer: 2,
        explanation: '"since 2018" + hành động bắt đầu quá khứ, vẫn đang tiếp tục → Hiện tại hoàn thành tiếp diễn: have been working.',
      },
      {
        question: '"She _____ TV when the phone rang." – Chọn đúng:',
        options: ['watched', 'was watching', 'has watched', 'watches'],
        answer: 1,
        explanation: '"when the phone rang" gián đoạn hành động đang diễn ra → Quá khứ tiếp diễn: was watching.',
      },
    ],
  },

  // ──────────────────────────────────────────────────────────────────────────
  'grammar.articles': {
    key: 'grammar.articles',
    title: 'Mạo Từ (Articles)',
    subtitle: 'a / an / the / ∅ (không dùng mạo từ)',
    intro:
      'Mạo từ là một trong những điểm dễ nhầm lẫn nhất trong tiếng Anh. Có 3 loại: "a/an" (mạo từ không xác định), "the" (mạo từ xác định), và "∅" (không dùng). Quyết định dùng loại nào phụ thuộc vào việc người nghe/đọc đã biết cụ thể vật/người đó chưa.',
    rules: [
      {
        title: '🔹 Dùng "a" – trước danh từ đếm được số ít bắt đầu bằng ÂM PHỤ',
        examples: [
          { en: 'I have a cat.', vi: 'Tôi có một con mèo.' },
          { en: 'She is a teacher.', vi: 'Cô ấy là giáo viên.' },
          { en: 'It is a university.', vi: 'Đó là một trường đại học.', note: '"university" → âm /juː/ (phụ âm) → dùng "a"' },
        ],
      },
      {
        title: '🔹 Dùng "an" – trước danh từ đếm được số ít bắt đầu bằng ÂM NGUYÊN ÂM (a, e, i, o, u theo phát âm)',
        examples: [
          { en: 'I need an umbrella.', vi: 'Tôi cần một cái ô.' },
          { en: 'She is an honest person.', vi: 'Cô ấy là người trung thực.', note: '"honest" → âm /ɒ/ (nguyên âm, h câm) → "an"' },
          { en: 'It was an hour ago.', vi: 'Đó là một giờ trước.', note: '"hour" → âm /aʊ/ (nguyên âm, h câm) → "an"' },
        ],
      },
      {
        title: '🔹 Dùng "the" – khi đã xác định rõ, chỉ có một, hoặc đã đề cập trước',
        examples: [
          { en: 'The book on the table is mine.', vi: 'Cuốn sách trên bàn là của tôi.', note: 'cả hai đều biết cuốn sách nào' },
          { en: 'The sun rises in the east.', vi: 'Mặt trời mọc ở phía đông.', note: '"the sun" – chỉ có một' },
          { en: 'I saw a dog. The dog was friendly.', vi: 'Tôi thấy một con chó. Con chó đó thân thiện.', note: 'lần 2 đề cập → "the"' },
        ],
      },
      {
        title: '🔹 Không dùng mạo từ (∅) – danh từ không đếm được, số nhiều chung chung, tên riêng',
        examples: [
          { en: 'I like music.', vi: 'Tôi thích âm nhạc.', note: '"music" là danh từ không đếm được' },
          { en: 'Dogs are loyal animals.', vi: 'Chó là động vật trung thành.', note: 'số nhiều chung chung' },
          { en: 'She lives in Vietnam.', vi: 'Cô ấy sống ở Việt Nam.', note: 'tên quốc gia (trừ: the USA, the UK)' },
        ],
      },
      {
        title: '⚠️ Trường hợp đặc biệt luôn dùng "the"',
        examples: [
          { en: 'the United States, the UK, the Netherlands', vi: 'Quốc gia có "United / Kingdom / Republic" hoặc tên số nhiều' },
          { en: 'the Amazon, the Mekong River', vi: 'Tên sông' },
          { en: 'the Pacific Ocean, the Indian Ocean', vi: 'Tên đại dương / biển' },
          { en: 'the Alps, the Himalayas', vi: 'Tên dãy núi (số nhiều)' },
          { en: 'play the piano / the guitar / the violin', vi: 'Tên nhạc cụ khi chơi nhạc' },
          { en: 'He is the best student in class.', vi: 'So sánh nhất luôn cần "the"' },
        ],
      },
      {
        title: '⚠️ Trường hợp đặc biệt KHÔNG dùng mạo từ',
        examples: [
          { en: 'go to school / church / hospital / bed / prison (mục đích)', vi: '"go to school" = đi học (không phải tòa nhà cụ thể)' },
          { en: 'She plays tennis / football / chess.', vi: 'Môn thể thao và trò chơi không dùng mạo từ' },
          { en: 'Breakfast / Lunch / Dinner is ready.', vi: 'Bữa ăn nói chung không dùng mạo từ' },
        ],
      },
    ],
    commonMistakes: [
      { wrong: 'I am student.', correct: 'I am a student.', explanation: 'Danh từ đếm được số ít cần mạo từ a/an.' },
      { wrong: 'She plays the tennis.', correct: 'She plays tennis.', explanation: 'Tên môn thể thao không dùng mạo từ.' },
      {
        wrong: 'I go to the school by bus.',
        correct: 'I go to school by bus.',
        explanation: '"go to school" (mục đích học tập) không dùng "the". Dùng "the school" khi muốn chỉ cụ thể tòa nhà.',
      },
      { wrong: 'He is best student in class.', correct: 'He is the best student in class.', explanation: 'Dạng so sánh nhất luôn cần "the".' },
      { wrong: 'a European country (đọc là /juː/)', correct: 'a European country ✓', explanation: '"European" bắt đầu bằng âm /juː/ (phụ âm) → "a", không phải "an".' },
    ],
    studyTips: [
      'Quy tắc vàng: a/an = lần đầu đề cập, chưa xác định; the = đã biết rõ, xác định',
      'Phân biệt dựa trên ÂM THANH, không phải chữ cái: "an umbrella" (âm /ʌ/) nhưng "a university" (âm /juː/)',
      'Tạo danh sách ngoại lệ để học: school/church/bed (không the), play the piano/the guitar (có the)',
      'Khi viết, đọc lại và tự hỏi: "Người đọc đã biết vật này chưa?" → có: the | chưa: a/an | chung chung: ∅',
    ],
    quiz: [
      {
        question: '"She plays _____ piano very well."',
        options: ['a', 'an', 'the', '∅ (không dùng)'],
        answer: 2,
        explanation: 'Nhạc cụ (play the piano, the guitar, the violin…) luôn cần "the".',
      },
      {
        question: '"I need _____ honest opinion from you."',
        options: ['a', 'an', 'the', '∅'],
        answer: 1,
        explanation: '"honest" phát âm là /ˈɒnɪst/ – bắt đầu bằng âm nguyên âm /ɒ/ (h câm) → dùng "an".',
      },
      {
        question: '"She lives in _____ United States."',
        options: ['a', 'an', 'the', '∅'],
        answer: 2,
        explanation: 'Tên quốc gia có "United" luôn cần "the": the United States, the United Kingdom.',
      },
    ],
  },

  // ──────────────────────────────────────────────────────────────────────────
  'grammar.subject_verb_agr': {
    key: 'grammar.subject_verb_agr',
    title: 'Subject-Verb Agreement',
    subtitle: 'Hòa hợp chủ ngữ và động từ',
    intro:
      'Subject-Verb Agreement (sự hòa hợp chủ-vị) là quy tắc: động từ phải "khớp" với chủ ngữ về số ít/số nhiều. Đây là lỗi phổ biến và bị trừ điểm trong IELTS Writing. Bí quyết: luôn xác định THẬT chủ ngữ trước khi chọn động từ.',
    rules: [
      {
        title: '✅ Quy tắc cơ bản',
        examples: [
          { en: 'She writes a letter every day.', vi: 'she (số ít) → writes (+s)', note: 'ngôi 3 số ít + V(s/es)' },
          { en: 'They write letters every day.', vi: 'they (số nhiều) → write (không +s)' },
          { en: 'The team is working hard.', vi: 'team (tập thể số ít) → is', note: 'danh từ tập thể ở Anh-Mỹ thường số ít' },
        ],
      },
      {
        title: '⚠️ Chủ ngữ giả: bỏ qua cụm "of / with / including…" để tìm chủ ngữ thật',
        examples: [
          { en: 'The quality of the products is good.', vi: 'Chủ ngữ thật = "quality" (số ít) → is', note: 'bỏ qua "of the products"' },
          { en: 'A box of chocolates was delivered.', vi: 'Chủ ngữ thật = "a box" (số ít) → was' },
          { en: 'The students, along with their teacher, are here.', vi: 'Chủ ngữ thật = "the students" → are', note: 'bỏ qua "along with their teacher"' },
        ],
      },
      {
        title: '⚠️ each / every / everyone / someone / nobody → luôn số ít',
        examples: [
          { en: 'Each student has a book.', vi: 'each + danh từ → động từ số ít' },
          { en: 'Everyone has finished.', vi: 'everyone → has (không phải have)' },
          { en: 'Nobody was there.', vi: 'nobody → was (không phải were)' },
        ],
      },
      {
        title: '⚠️ Either…or / Neither…nor → động từ theo chủ ngữ GẦN NHẤT',
        examples: [
          { en: 'Either the teacher or the students are wrong.', vi: '"students" (số nhiều) gần nhất → are', note: 'chủ ngữ 2 số nhiều → are' },
          { en: 'Neither the students nor the teacher is wrong.', vi: '"teacher" (số ít) gần nhất → is', note: 'chủ ngữ 2 số ít → is' },
        ],
      },
      {
        title: '💡 Danh từ trông như số nhiều nhưng luôn số ít',
        examples: [
          { en: 'Mathematics is a difficult subject.', vi: 'mathematics / physics / economics / politics → số ít' },
          { en: 'The United States is a large country.', vi: 'tên nước / tổ chức (1 thực thể) → số ít' },
          { en: 'The news is shocking.', vi: 'news / information / furniture / advice / luggage → luôn số ít' },
        ],
      },
      {
        title: '💡 Danh từ luôn số nhiều',
        examples: [
          { en: 'People are waiting outside.', vi: '"people / police" → luôn số nhiều' },
          { en: 'Scissors are on the table.', vi: '"scissors / trousers / glasses / jeans" → luôn số nhiều' },
        ],
      },
    ],
    commonMistakes: [
      {
        wrong: 'The quality of the products are good.',
        correct: 'The quality of the products is good.',
        explanation: 'Chủ ngữ thật là "quality" (số ít); "of the products" chỉ là cụm bổ nghĩa.',
      },
      {
        wrong: 'Everyone have finished the test.',
        correct: 'Everyone has finished the test.',
        explanation: '"everyone/everybody/someone/nobody/anyone" → luôn dùng động từ số ít.',
      },
      {
        wrong: 'The news are shocking.',
        correct: 'The news is shocking.',
        explanation: '"news" là danh từ không đếm được, luôn dùng động từ số ít.',
      },
    ],
    studyTips: [
      'Bước 1: Gạch chân chủ ngữ thật (bỏ qua cụm "of the…", "with…", "along with…")',
      'Bước 2: Hỏi: số ít hay số nhiều? → chọn động từ tương ứng',
      'Học thuộc nhóm luôn số ít: news / information / advice / furniture / equipment',
      'Học thuộc nhóm luôn số nhiều: people / police / scissors / trousers / glasses',
    ],
    quiz: [
      {
        question: '"The number of students _____ increasing every year."',
        options: ['are', 'is', 'were', 'have been'],
        answer: 1,
        explanation: '"The number of…" (số lượng của…) → luôn dùng số ít → is.',
      },
      {
        question: '"Either the manager or the employees _____ responsible."',
        options: ['is', 'are', 'was', 'has been'],
        answer: 1,
        explanation: 'Either…or → động từ theo chủ ngữ gần nhất: "employees" (số nhiều) → are.',
      },
    ],
  },

  // ──────────────────────────────────────────────────────────────────────────
  'grammar.simple_compound': {
    key: 'grammar.simple_compound',
    title: 'Câu Đơn & Câu Ghép',
    subtitle: 'Cấu trúc câu cơ bản với and / but / or / so',
    intro:
      'Câu đơn (Simple Sentence) chỉ có một mệnh đề độc lập. Câu ghép (Compound Sentence) là hai câu đơn được nối với nhau bằng liên từ đẳng lập (Coordinating Conjunctions). Biết kết hợp câu linh hoạt sẽ giúp bài viết tự nhiên và mạch lạc hơn.',
    rules: [
      {
        title: '🟢 Câu đơn (Simple Sentence) – 1 chủ ngữ + 1 động từ (+ bổ ngữ)',
        examples: [
          { en: 'She studies English.', vi: 'Cô ấy học tiếng Anh.' },
          { en: 'The weather is cold today.', vi: 'Thời tiết hôm nay lạnh.' },
          { en: 'Tom and Jerry are best friends.', vi: 'Tom và Jerry là bạn thân.', note: 'Chủ ngữ ghép nhưng vẫn là câu đơn' },
        ],
      },
      {
        title: '🔵 Câu ghép (Compound Sentence) – 2 câu đơn nối bằng FANBOYS',
        examples: [
          { en: 'F – For: She was tired, for she had worked all day.', vi: 'Cô ấy mệt vì đã làm việc cả ngày.', note: '"for" = bởi vì (formal)' },
          { en: 'A – And: I like coffee, and she likes tea.', vi: 'Tôi thích cà phê và cô ấy thích trà.', note: 'thêm ý' },
          { en: 'N – Nor: He doesn\'t smoke, nor does he drink.', vi: 'Anh ấy không hút thuốc, cũng không uống rượu.' },
          { en: 'B – But: I studied hard, but I failed the exam.', vi: 'Tôi học chăm chỉ nhưng vẫn trượt kỳ thi.', note: 'tương phản' },
          { en: 'O – Or: You can take a taxi, or you can walk.', vi: 'Bạn có thể đi taxi hoặc đi bộ.', note: 'lựa chọn' },
          { en: 'Y – Yet: She is young, yet she is very mature.', vi: 'Cô ấy còn trẻ nhưng rất trưởng thành.', note: '"yet" = nhưng (tương phản bất ngờ)' },
          { en: 'S – So: It was raining, so I stayed inside.', vi: 'Trời mưa nên tôi ở trong nhà.', note: 'kết quả' },
        ],
      },
      {
        title: '⚠️ Dấu phẩy trong câu ghép',
        examples: [
          { en: 'I was tired, but I finished the work. ✓', vi: 'Đặt dấu phẩy TRƯỚC liên từ khi nối 2 câu độc lập' },
          { en: 'I was tired but happy. ✓ (không cần phẩy)', vi: 'Không cần phẩy khi nối 2 tính từ/cụm từ ngắn' },
        ],
      },
      {
        title: '💡 Bán câu (Run-on sentence) – lỗi phổ biến cần tránh',
        examples: [
          { en: '✗ I was tired I went to bed early.', vi: 'Sai: hai câu đơn không có liên từ hoặc dấu câu' },
          { en: '✓ I was tired, so I went to bed early.', vi: 'Đúng: thêm "so" để nối' },
          { en: '✓ I was tired. I went to bed early.', vi: 'Đúng: dùng dấu chấm để tách thành 2 câu' },
        ],
      },
    ],
    commonMistakes: [
      {
        wrong: 'I was hungry but I ate a sandwich and I felt better.',
        correct: 'I was hungry, so I ate a sandwich, and I felt better.',
        explanation: 'Cần dấu phẩy trước liên từ khi nối câu đơn lập; dùng "so" để chỉ kết quả.',
      },
      {
        wrong: 'She likes coffee, but likes tea too.',
        correct: 'She likes coffee, but she also likes tea.',
        explanation: 'Mỗi mệnh đề trong câu ghép cần có chủ ngữ riêng.',
      },
    ],
    studyTips: [
      'Nhớ FANBOYS: For, And, Nor, But, Or, Yet, So',
      'Quy tắc dấu phẩy: Câu đơn + [, + FANBOYS] + Câu đơn',
      'Đọc bài của mình và đếm câu ngắn → ghép lại bằng FANBOYS để bài mạch lạc hơn',
      'Luyện: Viết 5 câu đơn rồi ghép thành câu ghép với các liên từ khác nhau',
    ],
    quiz: [
      {
        question: 'Câu nào đúng ngữ pháp?',
        options: [
          'I studied hard, but I failed the exam.',
          'I studied hard but I failed the exam.',
          'I studied hard, and failed the exam.',
          'I studied hard so, I failed the exam.',
        ],
        answer: 0,
        explanation: 'Dùng dấu phẩy trước "but" khi nối 2 mệnh đề độc lập. Đáp án A đúng.',
      },
      {
        question: '"It was cold outside, _____ I wore a jacket." – Chọn liên từ đúng:',
        options: ['but', 'or', 'so', 'nor'],
        answer: 2,
        explanation: '"So" diễn tả kết quả (lạnh → mặc áo khoác). "But" và "yet" dùng cho tương phản.',
      },
    ],
  },

  // ──────────────────────────────────────────────────────────────────────────
  'grammar.basic_comparison': {
    key: 'grammar.basic_comparison',
    title: 'So Sánh Cơ Bản (Comparison)',
    subtitle: 'Comparative & Superlative Adjectives / Adverbs',
    intro:
      'Tiếng Anh có 3 dạng so sánh: bằng nhau (as…as), hơn (comparative), và nhất (superlative). Biết dùng đúng so sánh giúp bài viết và nói phong phú, tự nhiên hơn.',
    rules: [
      {
        title: '🟢 So sánh bằng (Equality): as + adj/adv + as',
        examples: [
          { en: 'She is as tall as her sister.', vi: 'Cô ấy cao bằng chị gái.' },
          { en: 'He runs as fast as a cheetah.', vi: 'Anh ấy chạy nhanh như báo.' },
          { en: 'Negative: She is not as tall as her sister.', vi: 'Cô ấy không cao bằng chị.' },
        ],
      },
      {
        title: '🔵 So sánh hơn (Comparative): adj-er / more + adj + than',
        examples: [
          { en: '1–2 âm tiết: tall → taller, fast → faster, big → bigger', vi: 'Tính từ ngắn: thêm -er' },
          { en: '3+ âm tiết: beautiful → more beautiful, expensive → more expensive', vi: 'Tính từ dài: dùng "more"' },
          { en: 'She is taller than her sister.', vi: 'Cô ấy cao hơn chị gái.' },
          { en: 'This phone is more expensive than that one.', vi: 'Điện thoại này đắt hơn cái kia.' },
          { en: 'Irregular: good → better, bad → worse, far → farther/further', vi: 'Bất quy tắc: phải học thuộc' },
        ],
      },
      {
        title: '🟠 So sánh nhất (Superlative): the + adj-est / the most + adj',
        examples: [
          { en: '1–2 âm tiết: tall → the tallest, fast → the fastest', vi: 'Tính từ ngắn: thêm -est, luôn có "the"' },
          { en: '3+ âm tiết: beautiful → the most beautiful', vi: 'Tính từ dài: "the most"' },
          { en: 'She is the tallest student in the class.', vi: 'Cô ấy là học sinh cao nhất trong lớp.' },
          { en: 'This is the most expensive hotel in the city.', vi: 'Đây là khách sạn đắt nhất thành phố.' },
          { en: 'Irregular: good → the best, bad → the worst, far → the farthest', vi: 'Bất quy tắc' },
        ],
      },
      {
        title: '⚠️ Quy tắc đánh vần quan trọng',
        examples: [
          { en: 'CVC (phụ âm-nguyên âm-phụ âm): big → bigger/biggest (gấp đôi phụ âm cuối)', vi: 'big, hot, thin, fat…' },
          { en: 'Kết thúc bằng -y: happy → happier/happiest (y→i)', vi: 'happy, easy, busy, pretty…' },
          { en: 'Kết thúc bằng -e: large → larger/largest (chỉ thêm -r/-st)', vi: 'large, nice, late, safe…' },
        ],
      },
    ],
    commonMistakes: [
      {
        wrong: 'She is more tall than her sister.',
        correct: 'She is taller than her sister.',
        explanation: '"tall" là tính từ 1 âm tiết → dùng -er (không dùng "more").',
      },
      {
        wrong: 'This is the most best movie.',
        correct: 'This is the best movie.',
        explanation: '"good → best" là bất quy tắc; không kết hợp "most" + "best".',
      },
      {
        wrong: 'She is the tallest of her class.',
        correct: 'She is the tallest in her class.',
        explanation: 'Dùng "in" cho nhóm/nơi chốn, "of" cho thành viên trong nhóm đó.',
      },
    ],
    studyTips: [
      'Quy tắc nhanh: 1–2 âm tiết → -er/-est; 3+ âm tiết → more/most',
      'Học thuộc bất quy tắc: good/better/best – bad/worse/worst – many/more/most – little/less/least',
      'Comparative + than; Superlative + the (bắt buộc)',
      'Luyện: Viết 5 câu so sánh về những thứ quanh bạn (phòng, trường, bạn bè)',
    ],
    quiz: [
      {
        question: '"This exam is _____ than the last one." – "difficult"',
        options: ['difficulter', 'more difficult', 'most difficult', 'the most difficult'],
        answer: 1,
        explanation: '"Difficult" có 3 âm tiết → dùng "more difficult" (không dùng -er).',
      },
      {
        question: '"She is _____ student in the school." – "good"',
        options: ['the goodest', 'the most good', 'the best', 'better'],
        answer: 2,
        explanation: '"Good" bất quy tắc: good → better → the best.',
      },
    ],
  },

  // ── IELTS 5.0 Grammar ──────────────────────────────────────────────────────

  'grammar.passive_voice': {
    key: 'grammar.passive_voice',
    title: 'Câu Bị Động (Passive Voice)',
    subtitle: 'Cấu trúc, cách dùng và bị động trong các thì',
    intro:
      'Câu bị động (Passive Voice) được dùng khi muốn nhấn mạnh vào đối tượng chịu tác động của hành động, hoặc khi chủ thể thực hiện không quan trọng/không biết. Câu bị động rất phổ biến trong văn học thuật (IELTS Writing Task 1, Task 2) và báo chí.',
    rules: [
      {
        title: '🔧 Công thức chung: S (đối tượng) + be + V3/V-ed + (by + tác nhân)',
        examples: [
          { en: 'Active:  People speak English here.', vi: 'Người ta nói tiếng Anh ở đây.', note: 'Câu chủ động' },
          { en: 'Passive: English is spoken here.', vi: 'Tiếng Anh được nói ở đây.', note: 'Không cần nhắc "People"' },
          { en: 'The book was written by Hemingway.', vi: 'Cuốn sách được viết bởi Hemingway.', note: '"by + tác nhân" khi muốn nêu ai làm' },
        ],
      },
      {
        title: '🕐 Bảng công thức bị động trong các thì',
        examples: [
          { en: 'Present Simple:       English is spoken here.', vi: 'is/are + V3' },
          { en: 'Past Simple:          The window was broken.', vi: 'was/were + V3' },
          { en: 'Present Continuous:   The house is being painted.', vi: 'is/are + being + V3' },
          { en: 'Past Continuous:      The car was being repaired.', vi: 'was/were + being + V3' },
          { en: 'Present Perfect:      The report has been submitted.', vi: 'have/has + been + V3' },
          { en: 'Past Perfect:         The letter had been sent.', vi: 'had + been + V3' },
          { en: 'Future Simple:        The problem will be solved.', vi: 'will + be + V3' },
          { en: 'Modal Verbs:          This should be done immediately.', vi: 'modal + be + V3' },
        ],
      },
      {
        title: '🎯 Khi nào nên dùng câu bị động?',
        examples: [
          { en: 'Không biết ai thực hiện: My car was stolen.', vi: 'Xe tôi bị trộm. (không biết tên trộm)' },
          { en: 'Rõ ràng ai làm: The criminal was arrested.', vi: 'Tên tội phạm bị bắt. (hiểu là bị cảnh sát)' },
          { en: 'Văn học thuật: CO₂ emissions have been reduced significantly.', vi: 'Trong IELTS: tránh lặp "people/we"' },
          { en: 'Nhấn mạnh vật bị tác động: Penicillin was discovered in 1928.', vi: 'Nhấn "Penicillin", không phải Fleming' },
        ],
      },
      {
        title: '⚡ Causative: have/get sth done (nhờ/thuê ai làm gì)',
        examples: [
          { en: 'I had my hair cut.', vi: 'Tôi đã cắt tóc (nhờ thợ cắt).', note: 'have + O + V3' },
          { en: 'She got her car repaired.', vi: 'Cô ấy đã sửa xe (nhờ thợ).' },
          { en: 'I need to get this form signed.', vi: 'Tôi cần ký vào form này (nhờ người ký).' },
        ],
      },
    ],
    commonMistakes: [
      {
        wrong: 'The homework was did by the students.',
        correct: 'The homework was done by the students.',
        explanation: 'Bị động cần V3/past participle (done), không phải V2 (did).',
      },
      {
        wrong: 'This book is write in French.',
        correct: 'This book is written in French.',
        explanation: 'Phải dùng V3 (written), không dùng V1 (write).',
      },
      {
        wrong: 'The meeting will be cancelled from the boss.',
        correct: 'The meeting will be cancelled by the boss.',
        explanation: 'Dùng "by" (không phải "from") để chỉ tác nhân trong câu bị động.',
      },
    ],
    studyTips: [
      'Công thức cốt lõi: be + V3. Chỉ thay phần "be" theo thì (is/was/has been/will be/being…)',
      'Luyện chuyển đổi: đọc 1 câu chủ động → viết lại dạng bị động, và ngược lại',
      'Trong IELTS Writing Task 1 (biểu đồ/sơ đồ), dùng bị động để mô tả dữ liệu một cách khách quan',
      'Chú ý: động từ nội động (không có tân ngữ: arrive, sleep, exist…) KHÔNG dùng được bị động',
    ],
    quiz: [
      {
        question: '"The report _____ by the manager yesterday."',
        options: ['wrote', 'was written', 'has written', 'writes'],
        answer: 1,
        explanation: '"yesterday" → quá khứ đơn; bị động quá khứ đơn: was + V3 → was written.',
      },
      {
        question: 'Chuyển sang bị động: "Scientists are studying the problem."',
        options: [
          'The problem is being studied by scientists.',
          'The problem has been studied by scientists.',
          'The problem was studied by scientists.',
          'The problem is studied by scientists.',
        ],
        answer: 0,
        explanation: 'Present Continuous bị động: is/are + being + V3 → "The problem is being studied by scientists."',
      },
    ],
  },

  // ──────────────────────────────────────────────────────────────────────────
  'grammar.cond_1_2': {
    key: 'grammar.cond_1_2',
    title: 'Câu Điều Kiện Loại 1 & 2',
    subtitle: 'Real & Unreal Conditionals',
    intro:
      'Câu điều kiện diễn tả mối quan hệ điều kiện – kết quả. Loại 1 (First Conditional) nói về điều kiện có thể xảy ra trong thực tế; Loại 2 (Second Conditional) nói về giả thuyết không có thật hoặc khó xảy ra ở hiện tại/tương lai. Đây là cấu trúc quan trọng trong cả 4 kỹ năng IELTS.',
    rules: [
      {
        title: '🟡 Loại 0 (Zero Conditional) – Sự thật hiển nhiên, quy luật tự nhiên',
        examples: [
          { en: 'If you heat water to 100°C, it boils.', vi: 'Nếu đun nước đến 100°C, nó sôi.', note: 'Luật tự nhiên' },
          { en: 'If it rains, the grass gets wet.', vi: 'Nếu trời mưa, cỏ bị ướt.' },
          { en: 'Cấu trúc: If + S + V(present), S + V(present)', vi: 'Cả 2 mệnh đề đều dùng hiện tại đơn' },
        ],
      },
      {
        title: '🔵 Loại 1 (First Conditional) – Điều kiện có thể xảy ra trong tương lai (REAL)',
        examples: [
          { en: 'If it rains tomorrow, I will stay at home.', vi: 'Nếu ngày mai trời mưa, tôi sẽ ở nhà.', note: 'Có thể mưa, có thể không' },
          { en: 'If you study hard, you will pass the exam.', vi: 'Nếu bạn học chăm chỉ, bạn sẽ đậu.' },
          { en: 'Unless you hurry, you will miss the bus.', vi: 'Trừ khi bạn nhanh lên, bạn sẽ lỡ xe.', note: '"Unless" = "If…not"' },
          { en: 'Cấu trúc: If + S + V(present simple), S + will/can/may + V', vi: 'Mệnh đề If: HIỆN TẠI ĐƠN | Mệnh đề chính: will/can/may + V' },
        ],
      },
      {
        title: '🟠 Loại 2 (Second Conditional) – Giả thuyết không có thật ở hiện tại/tương lai (UNREAL)',
        examples: [
          { en: 'If I were rich, I would buy a house.', vi: 'Nếu tôi giàu (nhưng thực tế không giàu), tôi sẽ mua nhà.', note: '"were" dùng cho TẤT CẢ ngôi (kể cả "I")' },
          { en: 'If she had more time, she could travel the world.', vi: 'Nếu cô ấy có nhiều thời gian hơn, cô ấy có thể đi khắp thế giới.' },
          { en: 'I wish I were taller.', vi: 'Ước gì tôi cao hơn.', note: '"I wish" + Loại 2' },
          { en: 'Cấu trúc: If + S + V(past simple), S + would/could/might + V', vi: 'Mệnh đề If: QUÁ KHỨ ĐƠN | Mệnh đề chính: would/could/might + V' },
        ],
      },
      {
        title: '🔄 Đảo ngữ câu điều kiện (nâng cao)',
        examples: [
          { en: 'Should you need help, call me. (= If you should need help…)', vi: 'Nếu bạn cần giúp đỡ, hãy gọi tôi.' },
          { en: 'Were I in your position, I would accept. (= If I were…)', vi: 'Nếu tôi ở vị trí của bạn, tôi sẽ chấp nhận.' },
        ],
      },
    ],
    commonMistakes: [
      {
        wrong: 'If it will rain tomorrow, I stay home.',
        correct: 'If it rains tomorrow, I will stay home.',
        explanation: 'Mệnh đề "if" trong Loại 1 dùng HIỆN TẠI ĐƠN (không dùng "will"). Chỉ mệnh đề chính mới dùng "will".',
      },
      {
        wrong: 'If I would be rich, I will buy a house.',
        correct: 'If I were rich, I would buy a house.',
        explanation: 'Mệnh đề "if" trong Loại 2 dùng QUÁ KHỨ ĐƠN (không dùng "would"). Mệnh đề chính dùng "would".',
      },
      {
        wrong: 'If I was you, I would say sorry.',
        correct: 'If I were you, I would say sorry.',
        explanation: 'Loại 2: ngôi "I" phải dùng "were" (không phải "was") trong văn viết chuẩn và thi cử.',
      },
    ],
    studyTips: [
      'Nhớ công thức: Type 1 = present + will; Type 2 = past + would',
      'Mẹo nhớ: "Type 1 = Real" → dùng real tense (hiện tại); "Type 2 = Unreal" → lùi thì 1 bậc',
      '"Unless" = "If…not": Unless you study = If you don\'t study',
      'Luyện: Nghĩ 3 điều bạn muốn thay đổi trong cuộc sống → viết câu Loại 2 về chúng',
    ],
    quiz: [
      {
        question: '"If you _____ harder, you would get better grades."',
        options: ['study', 'studied', 'will study', 'would study'],
        answer: 1,
        explanation: 'Loại 2 (unreal): sau "If" dùng quá khứ đơn → "studied".',
      },
      {
        question: '"If it _____ tomorrow, we will cancel the picnic."',
        options: ['will rain', 'rains', 'rained', 'would rain'],
        answer: 1,
        explanation: 'Loại 1 (real future): mệnh đề "if" dùng hiện tại đơn → "rains".',
      },
      {
        question: 'Câu nào đúng ngữ pháp?',
        options: [
          'If I were the president, I will change the law.',
          'If I were the president, I would change the law.',
          'If I was the president, I would change the law.',
          'If I am the president, I would change the law.',
        ],
        answer: 1,
        explanation: 'Loại 2: If + S + were (for "I") + ... , S + would + V. Đáp án B đúng.',
      },
    ],
  },

  // ──────────────────────────────────────────────────────────────────────────
  'grammar.relative_basic': {
    key: 'grammar.relative_basic',
    title: 'Mệnh Đề Quan Hệ Cơ Bản',
    subtitle: 'Defining Relative Clauses: who / which / that / where / when',
    intro:
      'Mệnh đề quan hệ (Relative Clause) là mệnh đề phụ bổ sung thông tin cho danh từ. Mệnh đề quan hệ xác định (Defining) cần thiết để hiểu danh từ đó là ai/cái gì; nếu bỏ đi, câu sẽ mất nghĩa hoặc không rõ.',
    rules: [
      {
        title: '📋 Đại từ quan hệ và cách dùng',
        examples: [
          { en: 'WHO – chỉ người (chủ ngữ hoặc tân ngữ)', vi: 'The woman who called you is my sister.' },
          { en: 'WHICH – chỉ vật/sự việc (chủ ngữ hoặc tân ngữ)', vi: 'The book which I bought is interesting.' },
          { en: 'THAT – chỉ người hoặc vật (thường dùng trong defining clauses)', vi: 'The car that he drives is very fast.' },
          { en: 'WHERE – chỉ nơi chốn', vi: 'The city where I was born is beautiful.' },
          { en: 'WHEN – chỉ thời gian', vi: 'I remember the day when we first met.' },
          { en: 'WHOSE – chỉ sở hữu của người/vật', vi: 'The student whose paper was best got an A.' },
        ],
      },
      {
        title: '🔹 Defining Relative Clause (Xác định) – KHÔNG có dấu phẩy',
        examples: [
          { en: 'The man who lives next door is a doctor.', vi: 'Người đàn ông (người sống cạnh nhà) là bác sĩ.', note: 'Mệnh đề xác định đó là người đàn ông NÀO' },
          { en: 'This is the book that changed my life.', vi: 'Đây là cuốn sách đã thay đổi cuộc sống tôi.' },
          { en: 'She works at the hospital where I was born.', vi: 'Cô ấy làm việc ở bệnh viện mà tôi sinh ra.' },
        ],
      },
      {
        title: '⚠️ Khi nào có thể bỏ đại từ quan hệ?',
        examples: [
          { en: 'The book (that) I bought is interesting. ✓', vi: 'Có thể bỏ "that/which/who" khi nó là TÂN NGỮ trong mệnh đề quan hệ' },
          { en: 'The man who called you is my friend. (KHÔNG bỏ)', vi: 'Không bỏ khi "who" là CHỦ NGỮ trong mệnh đề quan hệ' },
        ],
      },
    ],
    commonMistakes: [
      {
        wrong: 'The woman which called you is my sister.',
        correct: 'The woman who called you is my sister.',
        explanation: '"which" dùng cho vật; dùng "who" hoặc "that" cho người.',
      },
      {
        wrong: 'I know the city where she lives there.',
        correct: 'I know the city where she lives.',
        explanation: 'Sau "where" không cần thêm "there" (đã có "where" làm chức năng nơi chốn).',
      },
    ],
    studyTips: [
      'Nhớ: who = người, which = vật, that = người hoặc vật, where = nơi, when = thời gian, whose = sở hữu',
      'Defining clause = không dấu phẩy, không thể bỏ; Non-defining = có dấu phẩy, có thể bỏ',
      'Luyện: Kết hợp 2 câu ngắn thành 1 câu có mệnh đề quan hệ',
    ],
    quiz: [
      {
        question: '"The student _____ won the competition is from our class."',
        options: ['which', 'who', 'where', 'whose'],
        answer: 1,
        explanation: '"student" là người → dùng "who" (hoặc "that").',
      },
      {
        question: '"This is the town _____ Shakespeare was born."',
        options: ['which', 'who', 'where', 'that'],
        answer: 2,
        explanation: '"town" là nơi chốn → dùng "where".',
      },
    ],
  },

  // ── TOEIC 350–495 Grammar ─────────────────────────────────────────────────

  'grammar.verb_tenses_basic': {
    key: 'grammar.verb_tenses_basic',
    title: 'Thì Động Từ Cơ Bản – TOEIC Part 5',
    subtitle: 'Nhận biết Signal Words và điền đúng thì',
    intro:
      'Trong TOEIC Part 5 (Incomplete Sentences), khoảng 15–20% câu hỏi liên quan đến thì động từ. Chiến lược: nhìn vào Signal Words (trạng từ thời gian) trong câu → xác định thì → chọn đáp án đúng. Không cần nhớ tất cả 12 thì, chỉ cần nắm 5–6 thì phổ biến nhất trong TOEIC.',
    rules: [
      {
        title: '⚡ Chiến lược 3 bước làm nhanh Part 5 (thì động từ)',
        examples: [
          { en: 'Bước 1: Đọc câu, tìm Signal Word (trạng từ thời gian)', vi: 'Ví dụ: "yesterday", "since 2020", "by next Friday", "every day"…' },
          { en: 'Bước 2: Xác định thì cần dùng', vi: '"yesterday" → Past Simple | "since/for + hiện tại" → Present Perfect | "by + tương lai" → Future Perfect' },
          { en: 'Bước 3: Chọn đáp án có dạng động từ đúng với thì đó', vi: 'Past Simple → V2/ed | Pres. Perfect → have/has + V3 | Future Perfect → will have + V3' },
        ],
      },
      {
        title: '🗓️ Bảng Signal Words thường gặp nhất trong TOEIC',
        examples: [
          { en: '📌 Present Simple', vi: 'every day/week/month, always, usually, often, currently (= lịch trình), generally' },
          { en: '📌 Past Simple', vi: 'yesterday, last week/month/year, ago, in + year, when + hành động quá khứ' },
          { en: '📌 Present Perfect', vi: 'since, for, already, yet, just, ever, recently, so far, up to now' },
          { en: '📌 Present Perfect Continuous', vi: 'for + khoảng thời gian + since; how long + have/has been' },
          { en: '📌 Future Simple', vi: 'tomorrow, next week/month, soon (quyết định ngay lúc nói)' },
          { en: '📌 Future Perfect', vi: 'by the time, by + future date, before + future event' },
        ],
      },
      {
        title: '📊 Ví dụ thực tế từ đề TOEIC',
        examples: [
          {
            en: 'The company _____ its new product last Monday. → (B) launched',
            vi: '"last Monday" → Past Simple → launched (V2)',
          },
          {
            en: 'She _____ for the company since 2018. → (C) has been working',
            vi: '"since 2018" + vẫn đang làm → Present Perfect Continuous → has been working',
          },
          {
            en: 'By the time the manager arrives, the team _____ the report. → (B) will have finished',
            vi: '"By the time" + future → Future Perfect → will have finished',
          },
          {
            en: 'The office _____ at 9 AM every day. → (B) opens',
            vi: '"every day" → Present Simple → opens (ngôi 3 số ít)',
          },
        ],
      },
    ],
    commonMistakes: [
      {
        wrong: 'I have met him yesterday.',
        correct: 'I met him yesterday.',
        explanation: '"Yesterday" là thời điểm xác định → Past Simple. Tuyệt đối không dùng Present Perfect với thời điểm cụ thể.',
      },
      {
        wrong: 'She is work here since 2020.',
        correct: 'She has been working here since 2020.',
        explanation: '"Since" + hành động kéo dài đến hiện tại → Present Perfect Continuous (has been + V-ing).',
      },
      {
        wrong: 'By Friday, I finish the project.',
        correct: 'By Friday, I will have finished the project.',
        explanation: '"By + future time" → Future Perfect (will have + V3).',
      },
    ],
    studyTips: [
      'Ưu tiên học: Past Simple, Present Perfect, Future Perfect – 3 thì dễ sai nhất trong TOEIC Part 5',
      '"since/for" + hiện tại → hầu như luôn là Present Perfect hoặc Present Perfect Continuous',
      '"by + future date" → luôn là Future Perfect (will have + V3)',
      'Làm 10 câu Part 5 về thì động từ mỗi ngày trong 30 ngày để tạo phản xạ',
    ],
    quiz: [
      {
        question: '"The office _____ at 9 AM every day."',
        options: ['open', 'opens', 'opened', 'is opening'],
        answer: 1,
        explanation: '"Every day" → thói quen → Present Simple. "The office" (ngôi 3 số ít) → "opens".',
      },
      {
        question: '"The team _____ the project by next Friday."',
        options: ['will complete', 'will have completed', 'has completed', 'completed'],
        answer: 1,
        explanation: '"By next Friday" → hành động hoàn thành trước thời điểm tương lai → Future Perfect → "will have completed".',
      },
    ],
  },

  // ──────────────────────────────────────────────────────────────────────────
  'grammar.articles_pron': {
    key: 'grammar.articles_pron',
    title: 'Mạo Từ & Đại Từ Nhân Xưng – TOEIC Part 5',
    subtitle: 'a / an / the và subject / object pronouns',
    intro:
      'Trong TOEIC Part 5, lỗi mạo từ (articles) và đại từ (pronouns) chiếm khoảng 10–15% câu hỏi. Phần mạo từ tương tự IELTS; phần đại từ tập trung vào việc chọn đúng dạng (chủ ngữ / tân ngữ / sở hữu / phản thân).',
    rules: [
      {
        title: '🔹 Mạo từ trong ngữ cảnh business (TOEIC)',
        examples: [
          { en: 'Please submit a report by Friday.', vi: '"a report" – lần đầu đề cập, chưa xác định', note: 'Dùng "a"' },
          { en: 'The report was submitted on time.', vi: '"the report" – đã biết báo cáo nào', note: 'Dùng "the"' },
          { en: 'We need information about the project.', vi: '"information" – không đếm được → không dùng mạo từ' },
          { en: 'We held a meeting. The meeting lasted 2 hours.', vi: 'Lần 1: "a meeting"; Lần 2: "the meeting"' },
        ],
      },
      {
        title: '📋 Đại từ nhân xưng – dạng chủ ngữ và tân ngữ',
        examples: [
          { en: 'Subject:  I / you / he / she / it / we / they', vi: 'Dùng làm CHỦ NGỮ của câu: I am the manager.' },
          { en: 'Object:   me / you / him / her / it / us / them', vi: 'Dùng sau động từ hoặc giới từ: Please contact me / him / us.' },
          { en: 'Possessive adj: my / your / his / her / its / our / their', vi: 'Dùng trước danh từ: our company, their products' },
          { en: 'Possessive pron: mine / yours / his / hers / ours / theirs', vi: 'Dùng độc lập (không + danh từ): This report is mine.' },
          { en: 'Reflexive: myself / yourself / himself / herself / itself / ourselves / themselves', vi: 'Phản thân: She did it herself. / Please help yourself.' },
        ],
      },
      {
        title: '📊 Ví dụ điển hình trong TOEIC Part 5',
        examples: [
          { en: 'Please send _____ (your / yours) application by Monday.', vi: 'your application (trước danh từ → possessive adjective "your")' },
          { en: 'The manager approved the proposal _____. (herself / her)', vi: 'herself (= tự mình, không nhờ ai → reflexive pronoun)' },
          { en: '_____ (They / Them / Their) products are high-quality.', vi: 'Their products (trước danh từ → possessive adjective "Their")' },
        ],
      },
    ],
    commonMistakes: [
      {
        wrong: 'Please send the email to I.',
        correct: 'Please send the email to me.',
        explanation: 'Sau giới từ (to, for, with…) dùng đại từ tân ngữ (me, him, her, us, them).',
      },
      {
        wrong: 'This is my book. That one is your.',
        correct: 'This is my book. That one is yours.',
        explanation: '"yours" là possessive pronoun (đứng độc lập, không + danh từ), không phải "your".',
      },
      {
        wrong: 'The company increased it sales.',
        correct: 'The company increased its sales.',
        explanation: '"its" (sở hữu của "it/vật/công ty"); không phải "it\'s" (= it is).',
      },
    ],
    studyTips: [
      'Quy tắc chọn đại từ: trước danh từ → possessive adj (my/your/our); độc lập → possessive pron (mine/yours)',
      'Sau giới từ (to/for/with/from) → luôn dùng tân ngữ (me/him/her/us/them)',
      'Phân biệt "its" (sở hữu) với "it\'s" (it is) – lỗi rất phổ biến trong Part 5 và Part 6',
      'Làm bảng flashcard 5 loại đại từ và ôn mỗi ngày',
    ],
    quiz: [
      {
        question: '"Please submit _____ report by 5 PM today."',
        options: ['a', 'an', 'the', '∅'],
        answer: 2,
        explanation: '"Your report" – đã biết báo cáo nào (của bạn, được giao) → "the". Hoặc nếu ngữ cảnh là lần đầu đề cập chung chung thì "a/your".',
      },
      {
        question: '"The manager reviewed the documents _____ (không nhờ ai)."',
        options: ['her', 'she', 'herself', 'hers'],
        answer: 2,
        explanation: 'Phản thân pronoun "herself" = tự mình làm, không nhờ ai.',
      },
    ],
  },
}

// ─── Modal Component ──────────────────────────────────────────────────────────

function TenseCard({ tense, defaultOpen }: { tense: TenseEntry; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(!!defaultOpen)
  return (
    <div className="rounded-xl border border-slate-100 overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-3.5 bg-slate-50 hover:bg-slate-100 transition-colors text-left cursor-pointer"
      >
        <span className="font-semibold text-slate-700 text-sm">{tense.name}</span>
        {open ? (
          <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" />
        ) : (
          <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
        )}
      </button>
      {open && (
        <div className="p-4 space-y-3">
          {/* Usage */}
          <div className="text-xs text-slate-500 bg-blue-50 rounded-lg px-3 py-2 border border-blue-100">
            <span className="font-semibold text-blue-700">Dùng khi: </span>{tense.usage}
          </div>
          {/* Signals */}
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Dấu hiệu nhận biết</p>
            <div className="flex flex-wrap gap-1.5">
              {tense.signals.map((s, i) => (
                <span key={i} className="bg-yellow-50 text-yellow-700 border border-yellow-200 text-xs px-2 py-0.5 rounded-full font-medium">
                  {s}
                </span>
              ))}
            </div>
          </div>
          {/* Formula */}
          <div className="bg-violet-50 rounded-lg p-3 border border-violet-100 space-y-1">
            <p className="text-xs font-semibold text-violet-600 uppercase tracking-wide mb-1">Công thức</p>
            <p className="text-sm font-mono text-violet-800">✅ {tense.formula}</p>
            {tense.negative && <p className="text-sm font-mono text-red-700">❌ {tense.negative}</p>}
            {tense.question && <p className="text-sm font-mono text-blue-700">❓ {tense.question}</p>}
          </div>
          {/* Examples */}
          <div className="space-y-2">
            {tense.examples.map((ex, i) => (
              <div key={i} className="bg-white rounded-lg border border-slate-100 px-3 py-2">
                <p className="text-sm font-semibold text-slate-700">{ex.en}</p>
                <p className="text-xs text-slate-500 mt-0.5">→ {ex.vi}</p>
                {ex.note && <p className="text-xs text-indigo-500 mt-0.5 italic">({ex.note})</p>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function QuizCard({ question, index }: { question: QuizQuestion; index: number }) {
  const [selected, setSelected] = useState<number | null>(null)
  const answered = selected !== null
  return (
    <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 space-y-3">
      <p className="text-sm font-semibold text-slate-700">
        <span className="text-purple-500 mr-1">#{index + 1}</span> {question.question}
      </p>
      <div className="space-y-2">
        {question.options.map((opt, i) => {
          let optClass =
            'w-full text-left px-3 py-2 rounded-lg border text-sm transition-all cursor-pointer '
          if (!answered) {
            optClass += 'border-slate-200 bg-white hover:border-purple-300 hover:bg-purple-50 text-slate-700'
          } else if (i === question.answer) {
            optClass += 'border-emerald-400 bg-emerald-50 text-emerald-800 font-semibold'
          } else if (i === selected) {
            optClass += 'border-red-300 bg-red-50 text-red-700 line-through'
          } else {
            optClass += 'border-slate-100 bg-slate-50 text-slate-400'
          }
          return (
            <button key={i} className={optClass} onClick={() => !answered && setSelected(i)} disabled={answered}>
              <span className="font-bold mr-2 text-slate-400">
                {String.fromCharCode(65 + i)}.
              </span>
              {opt}
              {answered && i === question.answer && (
                <CheckCircle2 className="inline w-3.5 h-3.5 ml-2 text-emerald-500" />
              )}
              {answered && i === selected && i !== question.answer && (
                <XCircle className="inline w-3.5 h-3.5 ml-2 text-red-400" />
              )}
            </button>
          )
        })}
      </div>
      {answered && (
        <div className="bg-white border border-emerald-200 rounded-lg p-3 text-xs text-emerald-800">
          <span className="font-bold">💡 Giải thích: </span>{question.explanation}
        </div>
      )}
    </div>
  )
}

export interface TopicLessonModalProps {
  topicKey: string
  accentColor: string
  accentBg: string
  onClose: () => void
}

export function TopicLessonModal({ topicKey, accentColor, accentBg, onClose }: TopicLessonModalProps) {
  const lesson = TOPIC_LESSONS[topicKey]

  if (!lesson) {
    // Fallback for topics without lesson content yet
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      >
        <div
          className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 text-center"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="w-14 h-14 bg-purple-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <BookOpen className="w-7 h-7 text-purple-400" />
          </div>
          <h3 className="font-bold text-slate-700 text-lg mb-2">Nội dung đang được biên soạn</h3>
          <p className="text-sm text-slate-500 mb-5">
            Bài học chi tiết cho chủ đề này đang được chuẩn bị. Vui lòng quay lại sau!
          </p>
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-purple-600 text-white text-sm font-semibold rounded-xl hover:bg-purple-700 transition-colors cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    )
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`${accentBg} px-5 py-4 flex items-start justify-between gap-3 border-b border-white/50`}>
          <div>
            <h2 className={`text-base sm:text-lg font-bold ${accentColor}`}>{lesson.title}</h2>
            {lesson.subtitle && (
              <p className="text-xs text-slate-500 mt-0.5">{lesson.subtitle}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="shrink-0 w-8 h-8 rounded-full bg-white/60 hover:bg-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1 px-5 py-5 space-y-6">

          {/* Introduction */}
          <section className="bg-slate-50 rounded-xl p-4 border border-slate-100">
            <div className="flex items-center gap-2 mb-2">
              <BookOpen className="w-4 h-4 text-slate-400" />
              <h3 className="text-sm font-bold text-slate-600 uppercase tracking-wide">Giới thiệu</h3>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed">{lesson.intro}</p>
          </section>

          {/* 12 Tenses (collapsible cards) */}
          {lesson.tenses && lesson.tenses.length > 0 && (
            <section>
              <h3 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                <span className="w-5 h-5 bg-violet-100 rounded-md flex items-center justify-center text-violet-600 text-xs font-black">12</span>
                {lesson.tenses.length} Thì Động Từ
              </h3>
              <div className="space-y-2">
                {lesson.tenses.map((tense, i) => (
                  <TenseCard key={i} tense={tense} defaultOpen={i === 0} />
                ))}
              </div>
            </section>
          )}

          {/* Rules */}
          {lesson.rules && lesson.rules.length > 0 && (
            <section className="space-y-4">
              {lesson.rules.map((rule, i) => (
                <div key={i} className="rounded-xl border border-slate-100 overflow-hidden">
                  <div className="bg-slate-50 px-4 py-2.5 border-b border-slate-100">
                    <p className="text-sm font-semibold text-slate-700">{rule.title}</p>
                  </div>
                  <div className="p-4 space-y-2">
                    {rule.examples.map((ex, j) => (
                      <div key={j} className="bg-white rounded-lg border border-slate-100 px-3 py-2">
                        <p className="text-sm font-semibold text-slate-700">{ex.en}</p>
                        {ex.vi !== ex.en && (
                          <p className="text-xs text-slate-500 mt-0.5">→ {ex.vi}</p>
                        )}
                        {ex.note && (
                          <p className="text-xs text-indigo-500 mt-0.5 italic">ℹ {ex.note}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </section>
          )}

          {/* Common Mistakes */}
          {lesson.commonMistakes && lesson.commonMistakes.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <h3 className="text-sm font-bold text-slate-700">Lỗi thường gặp</h3>
              </div>
              <div className="space-y-2">
                {lesson.commonMistakes.map((m, i) => (
                  <div key={i} className="rounded-xl border border-amber-100 bg-amber-50/50 p-3.5 space-y-1.5">
                    <div className="flex items-start gap-2">
                      <XCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm text-red-600 line-through">{m.wrong}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      <p className="text-sm font-semibold text-emerald-700">{m.correct}</p>
                    </div>
                    <p className="text-xs text-slate-500 ml-6 leading-relaxed">{m.explanation}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Study Tips */}
          {lesson.studyTips && lesson.studyTips.length > 0 && (
            <section className="bg-blue-50 rounded-xl p-4 border border-blue-100">
              <div className="flex items-center gap-2 mb-3">
                <Lightbulb className="w-4 h-4 text-blue-500" />
                <h3 className="text-sm font-bold text-blue-700">Mẹo học hiệu quả</h3>
              </div>
              <ul className="space-y-2">
                {lesson.studyTips.map((tip, i) => (
                  <li key={i} className="text-sm text-slate-600 flex items-start gap-2">
                    <span className="text-blue-400 font-bold shrink-0">✦</span>
                    {tip}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Quiz */}
          {lesson.quiz && lesson.quiz.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-3">
                <Target className="w-4 h-4 text-purple-500" />
                <h3 className="text-sm font-bold text-slate-700">Luyện tập nhanh</h3>
                <span className="text-xs text-slate-400">({lesson.quiz.length} câu hỏi)</span>
              </div>
              <div className="space-y-3">
                {lesson.quiz.map((q, i) => (
                  <QuizCard key={i} question={q} index={i} />
                ))}
              </div>
            </section>
          )}

          {/* Bottom padding */}
          <div className="h-2" />
        </div>
      </div>
    </div>
  )
}

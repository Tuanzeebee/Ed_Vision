/**
 * certificateSpeakingData.ts
 *
 * Speaking practice exercises for each speaking.* topicKey.
 *
 * Exercise types:
 *  - 'word'      → pronounce a single word
 *  - 'sentence'  → read a sentence aloud
 *  - 'qa'        → hear a question, give a spoken answer (checked against model answer)
 *
 * Scoring uses Levenshtein-based similarity (built into SpeakingPractice component).
 * No backend required — runs 100% in the browser via Web Speech API.
 */

export type ExerciseType = 'word' | 'sentence' | 'qa'

export interface SpeakingExercise {
  id: string
  type: ExerciseType
  /** Text the student must pronounce / read */
  target: string
  /** Vietnamese translation shown as hint */
  translation?: string
  /** For 'qa': the question shown on screen */
  question?: string
  /** Model answer used for similarity scoring (for 'qa') */
  modelAnswer?: string
  /** IPA pronunciation guide */
  ipa?: string
  /** Stress hint, e.g. "Stress: de-VEL-op-ment" */
  stressHint?: string
  /** Per-syllable breakdown */
  syllables?: string[]
  /** Key sound to watch out for */
  soundTip?: string
  difficulty: 'easy' | 'medium' | 'hard'
}

export interface SpeakingPack {
  topicKey: string
  title: string
  description: string
  exercises: SpeakingExercise[]
}

// ─────────────────────────────────────────────────────────────────────────────
// PACKS
// ─────────────────────────────────────────────────────────────────────────────

// ══════════════════════════════════════════════════════════════════════════════
// speaking.pronunciation  — IELTS basic pronunciation
// ══════════════════════════════════════════════════════════════════════════════
const PACK_PRONUNCIATION: SpeakingPack = {
  topicKey: 'speaking.pronunciation',
  title: 'Phát âm cơ bản',
  description: 'Luyện phát âm từ đơn, nhấn trọng âm, và các âm dễ nhầm',
  exercises: [
    {
      id: 'pr_01', type: 'word', target: 'development',
      translation: 'sự phát triển',
      ipa: '/dɪˈveləpmənt/',
      stressHint: 'Stress: de-VEL-op-ment (âm 2)',
      syllables: ['de', 'vel', 'op', 'ment'],
      soundTip: 'Âm /ə/ ở "op" là âm schwa – ngắn và nhẹ',
      difficulty: 'medium',
    },
    {
      id: 'pr_02', type: 'word', target: 'environment',
      translation: 'môi trường',
      ipa: '/ɪnˈvaɪrənmənt/',
      stressHint: 'Stress: en-VI-ron-ment (âm 2)',
      syllables: ['en', 'vi', 'ron', 'ment'],
      soundTip: 'Âm /v/ và /r/ phải rõ ràng',
      difficulty: 'medium',
    },
    {
      id: 'pr_03', type: 'word', target: 'comfortable',
      translation: 'thoải mái',
      ipa: '/ˈkʌmftəbl/',
      stressHint: 'Stress: COMF-ta-ble (âm 1) – chỉ 3 âm tiết!',
      syllables: ['comf', 'ta', 'ble'],
      soundTip: '"comfort" thường bị đọc thành 4 âm tiết – sai!',
      difficulty: 'hard',
    },
    {
      id: 'pr_04', type: 'word', target: 'photography',
      translation: 'nhiếp ảnh',
      ipa: '/fəˈtɒɡrəfi/',
      stressHint: 'Stress: pho-TOG-ra-phy (âm 2)',
      syllables: ['pho', 'tog', 'ra', 'phy'],
      soundTip: 'Đừng nhấn âm đầu "PHO"',
      difficulty: 'medium',
    },
    {
      id: 'pr_05', type: 'word', target: 'specific',
      translation: 'cụ thể',
      ipa: '/spəˈsɪfɪk/',
      stressHint: 'Stress: spe-CIF-ic (âm 2)',
      syllables: ['spe', 'cif', 'ic'],
      soundTip: 'Âm /s/ đầu không có hơi thở như /ʃ/',
      difficulty: 'easy',
    },
    {
      id: 'pr_06', type: 'word', target: 'vocabulary',
      translation: 'từ vựng',
      ipa: '/vəˈkæbjʊləri/',
      stressHint: 'Stress: vo-CAB-u-lary (âm 2)',
      syllables: ['vo', 'cab', 'u', 'la', 'ry'],
      soundTip: 'Âm /æ/ giống "cat" – miệng mở rộng',
      difficulty: 'medium',
    },
    {
      id: 'pr_07', type: 'sentence', target: 'The weather in Vietnam is generally hot and humid.',
      translation: 'Thời tiết ở Việt Nam thường nóng và ẩm.',
      soundTip: 'Nối âm: "weather_in", "is_generally" – liên kết tự nhiên',
      difficulty: 'easy',
    },
    {
      id: 'pr_08', type: 'sentence', target: 'Technology has changed the way we communicate.',
      translation: 'Công nghệ đã thay đổi cách chúng ta giao tiếp.',
      soundTip: 'Nhấn mạnh: TECH-nol-o-gy, CHANGED, com-MU-ni-cate',
      difficulty: 'medium',
    },
  ],
}

// ══════════════════════════════════════════════════════════════════════════════
// speaking.part1_basics  — IELTS Part 1
// ══════════════════════════════════════════════════════════════════════════════
const PACK_PART1: SpeakingPack = {
  topicKey: 'speaking.part1_basics',
  title: 'IELTS Speaking Part 1',
  description: 'Luyện trả lời câu hỏi cá nhân ngắn – tự nhiên, đủ ý, không đọc thuộc',
  exercises: [
    {
      id: 'p1_01', type: 'qa',
      question: 'Do you enjoy reading books? Why or why not?',
      target: 'Yes, I enjoy reading books, especially novels and self-development books. I find reading relaxing and it helps me learn new things.',
      modelAnswer: 'Yes I enjoy reading books especially novels and self development books I find reading relaxing and it helps me learn new things',
      translation: 'Bạn có thích đọc sách không? Tại sao?',
      soundTip: 'Dùng cấu trúc: Yes/No + Reason + Example',
      difficulty: 'easy',
    },
    {
      id: 'p1_02', type: 'qa',
      question: 'What do you usually do in your free time?',
      target: 'In my free time, I usually listen to music or go for a walk. I also spend time with my family on weekends.',
      modelAnswer: 'In my free time I usually listen to music or go for a walk I also spend time with my family on weekends',
      translation: 'Bạn thường làm gì trong thời gian rảnh?',
      soundTip: 'Thêm chi tiết: "usually", "often", "sometimes" – tránh câu quá ngắn',
      difficulty: 'easy',
    },
    {
      id: 'p1_03', type: 'qa',
      question: 'Do you prefer living in a city or the countryside? Why?',
      target: 'I prefer living in a city because it offers more job opportunities and better facilities. However, I think the countryside is more peaceful.',
      modelAnswer: 'I prefer living in a city because it offers more job opportunities and better facilities however I think the countryside is more peaceful',
      translation: 'Bạn thích sống ở thành phố hay nông thôn?',
      soundTip: 'Dùng contrast: "However", "Although", "On the other hand"',
      difficulty: 'medium',
    },
    {
      id: 'p1_04', type: 'qa',
      question: 'How important is learning English in your country?',
      target: 'Learning English is very important in Vietnam because it opens up career opportunities and helps people connect with the global community.',
      modelAnswer: 'Learning English is very important in Vietnam because it opens up career opportunities and helps people connect with the global community',
      translation: 'Học tiếng Anh quan trọng như thế nào ở đất nước bạn?',
      soundTip: 'Nêu lý do cụ thể: "career opportunities", "global connection"',
      difficulty: 'medium',
    },
    {
      id: 'p1_05', type: 'sentence',
      target: 'I have been studying English for about five years.',
      translation: 'Tôi đã học tiếng Anh được khoảng 5 năm.',
      soundTip: 'Luyện "have been" – Present Perfect Continuous: /həv bɪn/',
      difficulty: 'easy',
    },
  ],
}

// ══════════════════════════════════════════════════════════════════════════════
// speaking.extend_answers  — Extending answers (IELTS 5.0)
// ══════════════════════════════════════════════════════════════════════════════
const PACK_EXTEND: SpeakingPack = {
  topicKey: 'speaking.extend_answers',
  title: 'Mở rộng câu trả lời',
  description: 'Luyện kỹ năng nói dài hơn: Why? How? Example',
  exercises: [
    {
      id: 'ext_01', type: 'sentence',
      target: 'I enjoy cooking because it is a creative activity and I can experiment with different ingredients.',
      translation: 'Tôi thích nấu ăn vì đó là hoạt động sáng tạo và tôi có thể thử nghiệm nguyên liệu.',
      soundTip: 'Cấu trúc mở rộng: Statement + Because + Reason',
      difficulty: 'easy',
    },
    {
      id: 'ext_02', type: 'qa',
      question: 'Do you think social media has a positive or negative effect on society?',
      target: 'I think social media has both positive and negative effects. On one hand, it connects people across the world. On the other hand, it can spread misinformation very quickly.',
      modelAnswer: 'I think social media has both positive and negative effects on one hand it connects people across the world on the other hand it can spread misinformation very quickly',
      translation: 'Bạn nghĩ mạng xã hội ảnh hưởng tích cực hay tiêu cực đến xã hội?',
      soundTip: 'Cấu trúc balanced answer: "On one hand… On the other hand…"',
      difficulty: 'medium',
    },
    {
      id: 'ext_03', type: 'sentence',
      target: 'For example, many young people spend hours on their phones instead of interacting face to face.',
      translation: 'Ví dụ, nhiều bạn trẻ dành hàng giờ trên điện thoại thay vì giao tiếp trực tiếp.',
      soundTip: 'Luyện "face to face" – ba từ nối liền, stress vào "face"',
      difficulty: 'medium',
    },
  ],
}

// ══════════════════════════════════════════════════════════════════════════════
// speaking.part2_cuecard  — IELTS Part 2
// ══════════════════════════════════════════════════════════════════════════════
const PACK_PART2: SpeakingPack = {
  topicKey: 'speaking.part2_cuecard',
  title: 'IELTS Part 2 – Cue Card',
  description: 'Luyện nói dài 1–2 phút về một chủ đề cho trước',
  exercises: [
    {
      id: 'p2_01', type: 'qa',
      question: 'Describe a place you like to visit. You should say: where it is, how often you go there, what you do there, and explain why you like it.',
      target: 'I would like to talk about a coffee shop near my university called The Green Cup. I go there about twice a week, usually on weekends. I often sit there to study or meet friends. I like it because it is quiet, has free wifi, and serves excellent coffee. The atmosphere makes me feel calm and focused.',
      modelAnswer: 'I would like to talk about a coffee shop near my university called the green cup I go there about twice a week usually on weekends I often sit there to study or meet friends I like it because it is quiet has free wifi and serves excellent coffee',
      translation: 'Mô tả một nơi bạn thích đến thăm.',
      soundTip: 'Cấu trúc: Where + How often + What + Why. Dùng "because", "since", "which makes me…"',
      difficulty: 'hard',
    },
    {
      id: 'p2_02', type: 'qa',
      question: 'Describe a skill you would like to learn. Say what it is, why you want to learn it, and how you plan to learn it.',
      target: 'I would like to learn how to play the guitar. I have always been interested in music, and I think being able to play an instrument would make me feel more creative. I plan to take online classes and practise every day for at least thirty minutes.',
      modelAnswer: 'I would like to learn how to play the guitar I have always been interested in music and I think being able to play an instrument would make me feel more creative I plan to take online classes and practise every day',
      translation: 'Mô tả một kỹ năng bạn muốn học.',
      soundTip: 'Dùng thì tương lai: "I plan to…", "I would like to…", "I hope to…"',
      difficulty: 'hard',
    },
    {
      id: 'p2_03', type: 'sentence',
      target: 'There are several reasons why I enjoy spending time in nature.',
      translation: 'Có một số lý do tại sao tôi thích dành thời gian trong thiên nhiên.',
      soundTip: 'Câu mở đầu Part 2 mạnh: "There are several reasons why…"',
      difficulty: 'medium',
    },
  ],
}

// ══════════════════════════════════════════════════════════════════════════════
// speaking.part3_abstract  — IELTS Part 3
// ══════════════════════════════════════════════════════════════════════════════
const PACK_PART3: SpeakingPack = {
  topicKey: 'speaking.part3_abstract',
  title: 'IELTS Part 3 – Câu hỏi trừu tượng',
  description: 'Luyện lập luận, đồng ý/phản đối, nêu quan điểm có cơ sở',
  exercises: [
    {
      id: 'p3_01', type: 'qa',
      question: 'Do you think governments should invest more in public transportation?',
      target: 'Absolutely. I believe governments should prioritize public transport because it reduces traffic congestion and lowers carbon emissions. In cities like Tokyo and Singapore, efficient metro systems have dramatically improved the quality of life.',
      modelAnswer: 'absolutely I believe governments should prioritize public transport because it reduces traffic congestion and lowers carbon emissions in cities like Tokyo and Singapore efficient metro systems have dramatically improved quality of life',
      translation: 'Bạn có nghĩ chính phủ nên đầu tư nhiều hơn vào giao thông công cộng không?',
      soundTip: 'Bắt đầu bằng strong stance: "Absolutely / I firmly believe / It is my view that…"',
      difficulty: 'hard',
    },
    {
      id: 'p3_02', type: 'qa',
      question: 'How has technology changed the way people learn?',
      target: 'Technology has fundamentally transformed education. Online platforms allow students to access knowledge from anywhere in the world. However, this also creates inequality, as not everyone has equal access to the internet.',
      modelAnswer: 'technology has fundamentally transformed education online platforms allow students to access knowledge from anywhere in the world however this also creates inequality as not everyone has equal access to the internet',
      translation: 'Công nghệ đã thay đổi cách người ta học như thế nào?',
      soundTip: 'Cấu trúc: Statement + Evidence + Counterpoint (However…)',
      difficulty: 'hard',
    },
  ],
}

// ══════════════════════════════════════════════════════════════════════════════
// speaking.develop_ideas  — POINT-REASON-EXAMPLE-LINK (IELTS)
// ══════════════════════════════════════════════════════════════════════════════
const PACK_DEVELOP: SpeakingPack = {
  topicKey: 'speaking.develop_ideas',
  title: 'Phát triển ý – PREL',
  description: 'Cấu trúc POINT → REASON → EXAMPLE → LINK',
  exercises: [
    {
      id: 'dev_01', type: 'sentence',
      target: 'Working from home can increase productivity for many employees.',
      translation: 'Làm việc từ xa có thể tăng năng suất cho nhiều nhân viên.',
      soundTip: 'Đây là POINT của bạn. Tiếp theo nói REASON: "This is because…"',
      difficulty: 'easy',
    },
    {
      id: 'dev_02', type: 'sentence',
      target: 'This is because employees avoid long commutes and can focus better in a familiar environment.',
      translation: 'Điều này là vì nhân viên tránh được việc đi lại dài và có thể tập trung tốt hơn trong môi trường quen thuộc.',
      soundTip: 'REASON. Nhấn mạnh từ: AVOID, COMMUTES, FOCUS',
      difficulty: 'medium',
    },
    {
      id: 'dev_03', type: 'sentence',
      target: 'For instance, a study by Stanford University found that remote workers were 13 percent more productive.',
      translation: 'Ví dụ, một nghiên cứu của Stanford cho thấy nhân viên làm việc từ xa năng suất hơn 13%.',
      soundTip: 'EXAMPLE. "For instance / For example / A study found that…"',
      difficulty: 'medium',
    },
  ],
}

// ══════════════════════════════════════════════════════════════════════════════
// speaking.lexical_variety  — Lexical resource (IELTS 6.5)
// ══════════════════════════════════════════════════════════════════════════════
const PACK_LEXICAL: SpeakingPack = {
  topicKey: 'speaking.lexical_variety',
  title: 'Từ vựng phong phú',
  description: 'Luyện dùng từ đa dạng – tránh lặp từ "good", "bad", "nice"',
  exercises: [
    {
      id: 'lex_01', type: 'sentence',
      target: 'The exhibition was absolutely breathtaking — the level of detail in each sculpture was remarkable.',
      translation: 'Triển lãm thật tuyệt vời — mức độ chi tiết trong từng tác phẩm thật ấn tượng.',
      soundTip: '"Breathtaking" và "remarkable" thay cho "very good/nice". Luyện phát âm cả câu.',
      difficulty: 'medium',
    },
    {
      id: 'lex_02', type: 'sentence',
      target: 'The traffic in Ho Chi Minh City is absolutely chaotic during rush hour.',
      translation: 'Giao thông ở TP.HCM cực kỳ hỗn loạn trong giờ cao điểm.',
      soundTip: '"Chaotic" /keɪˈɒtɪk/ – stress âm 2. Thay cho "very busy".',
      difficulty: 'medium',
    },
    {
      id: 'lex_03', type: 'qa',
      question: 'Describe the area where you grew up.',
      target: 'I grew up in a bustling coastal city. The neighbourhood was vibrant and multicultural. There were always fascinating street markets and the aroma of street food filled the air.',
      modelAnswer: 'I grew up in a bustling coastal city the neighbourhood was vibrant and multicultural there were always fascinating street markets and the aroma of street food filled the air',
      translation: 'Mô tả khu vực bạn lớn lên.',
      soundTip: '"Bustling", "vibrant", "multicultural", "aroma" – từ Band 6+ thay cho basic vocabulary',
      difficulty: 'hard',
    },
  ],
}

// ══════════════════════════════════════════════════════════════════════════════
// speaking.cohesion  — Cohesion & discourse markers (IELTS 6.5)
// ══════════════════════════════════════════════════════════════════════════════
const PACK_COHESION: SpeakingPack = {
  topicKey: 'speaking.cohesion',
  title: 'Kết nối ý mượt mà',
  description: 'Luyện discourse markers: linking, contrasting, exemplifying',
  exercises: [
    {
      id: 'coh_01', type: 'sentence',
      target: 'Furthermore, regular exercise has been shown to improve mental health significantly.',
      translation: 'Hơn nữa, tập thể dục đều đặn đã được chứng minh là cải thiện sức khỏe tâm thần đáng kể.',
      soundTip: '"Furthermore" bắt đầu bằng /ˈfɜː/. Thêm ý mới mà không lặp lại "and also".',
      difficulty: 'easy',
    },
    {
      id: 'coh_02', type: 'sentence',
      target: 'Having said that, it is important to acknowledge that not everyone has the time or resources to exercise regularly.',
      translation: 'Tuy nhiên, điều quan trọng là phải thừa nhận rằng không phải ai cũng có thời gian hay nguồn lực để tập thể dục thường xuyên.',
      soundTip: '"Having said that" = sophisticated way to say "However". Luyện đọc mượt cả câu dài.',
      difficulty: 'hard',
    },
    {
      id: 'coh_03', type: 'sentence',
      target: 'To illustrate this point, consider how many students struggle to stay focused in a noisy environment.',
      translation: 'Để minh họa điểm này, hãy xem xét bao nhiêu sinh viên gặp khó khăn trong việc tập trung trong môi trường ồn ào.',
      soundTip: '"To illustrate this point" = sophisticated "For example". Nhấn: IL-lus-trate.',
      difficulty: 'medium',
    },
  ],
}

// ══════════════════════════════════════════════════════════════════════════════
// speaking.fluency_strategy  — Fluency & fillers (IELTS 7.0)
// ══════════════════════════════════════════════════════════════════════════════
const PACK_FLUENCY: SpeakingPack = {
  topicKey: 'speaking.fluency_strategy',
  title: 'Chiến lược Fluency',
  description: 'Luyện fillers tự nhiên, pausing, repair strategies',
  exercises: [
    {
      id: 'flu_01', type: 'sentence',
      target: 'That is a really interesting question. Let me think about that for a moment.',
      translation: 'Đó là câu hỏi thú vị. Hãy để tôi suy nghĩ một chút.',
      soundTip: 'Filler câu cho thời gian suy nghĩ. Tự nhiên hơn "ummm".',
      difficulty: 'easy',
    },
    {
      id: 'flu_02', type: 'sentence',
      target: 'What I mean is that the relationship between technology and education is quite complex.',
      translation: 'Ý tôi muốn nói là mối quan hệ giữa công nghệ và giáo dục khá phức tạp.',
      soundTip: '"What I mean is…" = repair strategy khi cần nói lại rõ hơn. Tự nhiên và Band 7+.',
      difficulty: 'medium',
    },
    {
      id: 'flu_03', type: 'qa',
      question: 'What do you think about the future of artificial intelligence?',
      target: 'That is a fascinating question. I think artificial intelligence will, in many ways, transform how we live and work. For instance, it could automate many routine tasks, freeing up humans to focus on creative work.',
      modelAnswer: 'that is a fascinating question I think artificial intelligence will in many ways transform how we live and work for instance it could automate many routine tasks freeing up humans to focus on creative work',
      translation: 'Bạn nghĩ gì về tương lai của trí tuệ nhân tạo?',
      soundTip: 'Bắt đầu bằng filler, sau đó nói rõ ràng. Dùng "in many ways", "For instance"',
      difficulty: 'hard',
    },
  ],
}

// ══════════════════════════════════════════════════════════════════════════════
// speaking.pronunciation_adv  — Advanced pronunciation (IELTS 7.0)
// ══════════════════════════════════════════════════════════════════════════════
const PACK_PRONUNCIATION_ADV: SpeakingPack = {
  topicKey: 'speaking.pronunciation_adv',
  title: 'Phát âm nâng cao',
  description: 'Linking sounds, weak forms, thought groups, sentence stress',
  exercises: [
    {
      id: 'padv_01', type: 'sentence',
      target: 'I would have told you if I had known about it.',
      translation: 'Tôi đã nói với bạn nếu tôi biết về điều đó.',
      soundTip: 'Weak forms: "would have" → /wʊdəv/, "had" → /həd/. Đọc liên tục, không rời rạc.',
      difficulty: 'hard',
    },
    {
      id: 'padv_02', type: 'sentence',
      target: 'The impact of climate change on biodiversity cannot be overstated.',
      translation: 'Tác động của biến đổi khí hậu đến đa dạng sinh học không thể bị xem nhẹ.',
      soundTip: 'Thought groups: [The impact of climate change] [on biodiversity] [cannot be overstated]. Ngắt đúng chỗ.',
      difficulty: 'hard',
    },
    {
      id: 'padv_03', type: 'sentence',
      target: 'She used to be an engineer before she became a teacher.',
      translation: 'Cô ấy từng là kỹ sư trước khi trở thành giáo viên.',
      soundTip: '"Used to" → /juːst tə/. Linking: "an engineer" → /ən ɪnˈdʒɪnɪr/.',
      difficulty: 'medium',
    },
  ],
}

// ══════════════════════════════════════════════════════════════════════════════
// speaking.natural_fluency  — Native-like fluency (IELTS 7.5+)
// ══════════════════════════════════════════════════════════════════════════════
const PACK_NATURAL: SpeakingPack = {
  topicKey: 'speaking.natural_fluency',
  title: 'Fluency tự nhiên',
  description: 'Rhythm, speed, idiomatic language như người bản ngữ',
  exercises: [
    {
      id: 'nat_01', type: 'sentence',
      target: 'At the end of the day, what matters most is how you treat other people.',
      translation: 'Cuối cùng, điều quan trọng nhất là bạn đối xử với người khác như thế nào.',
      soundTip: '"At the end of the day" = common native idiom. Đọc như một cụm, không đọc từng từ.',
      difficulty: 'medium',
    },
    {
      id: 'nat_02', type: 'sentence',
      target: 'I have to say, I am genuinely passionate about environmental conservation.',
      translation: 'Tôi phải nói rằng tôi thực sự đam mê bảo tồn môi trường.',
      soundTip: '"I have to say" = natural spoken opener. "Genuinely" /ˈdʒenjuɪnli/ – stress âm 1.',
      difficulty: 'hard',
    },
    {
      id: 'nat_03', type: 'qa',
      question: 'What would your ideal life look like in ten years?',
      target: 'Honestly, I would love to be running my own business, ideally in the tech industry. I am passionate about creating products that make a real difference to people\'s lives. Beyond work, I hope to have more balance and spend quality time with my family.',
      modelAnswer: 'honestly I would love to be running my own business ideally in the tech industry I am passionate about creating products that make a real difference to peoples lives beyond work I hope to have more balance and spend quality time with my family',
      translation: 'Cuộc sống lý tưởng của bạn sẽ như thế nào sau 10 năm?',
      soundTip: 'Dùng: "Honestly,", "Ideally,", "Beyond [X]," – native-like transitions',
      difficulty: 'hard',
    },
  ],
}

// ══════════════════════════════════════════════════════════════════════════════
// TOEIC Speaking packs
// ══════════════════════════════════════════════════════════════════════════════

const PACK_SW_READ_ALOUD: SpeakingPack = {
  topicKey: 'speaking.sw_read_aloud',
  title: 'TOEIC SW Part 1 – Read Aloud',
  description: 'Đọc to đoạn văn ngắn, phát âm rõ ràng, đúng tốc độ',
  exercises: [
    {
      id: 'swr_01', type: 'sentence',
      target: 'Thank you for calling Brightfield Customer Support. Our office hours are Monday through Friday, nine a.m. to six p.m.',
      translation: 'Cảm ơn bạn đã gọi cho Bộ phận Hỗ trợ Khách hàng Brightfield. Giờ làm việc của chúng tôi là thứ Hai đến thứ Sáu, 9 giờ sáng đến 6 giờ tối.',
      soundTip: 'Đọc đều tốc độ – không quá nhanh, không quá chậm. Nhấn mạnh: MONDAY, FRIDAY, NINE, SIX.',
      difficulty: 'easy',
    },
    {
      id: 'swr_02', type: 'sentence',
      target: 'The conference will be held at the Grand Riverside Hotel on the fifteenth of November.',
      translation: 'Hội nghị sẽ được tổ chức tại khách sạn Grand Riverside vào ngày 15 tháng 11.',
      soundTip: 'Ngày tháng: "fifteenth of November" – đọc rõ từng âm tiết. Không nuốt âm cuối.',
      difficulty: 'easy',
    },
    {
      id: 'swr_03', type: 'sentence',
      target: 'All employees are required to complete the annual compliance training by the end of this quarter.',
      translation: 'Tất cả nhân viên phải hoàn thành chương trình đào tạo tuân thủ hàng năm trước cuối quý này.',
      soundTip: '"Required" /rɪˈkwaɪərd/, "compliance" /kəmˈplaɪəns/ – nhấn âm 2 cả hai từ.',
      difficulty: 'medium',
    },
    {
      id: 'swr_04', type: 'sentence',
      target: 'For more information about our products and services, please visit our website at www dot brightfield solutions dot com.',
      translation: 'Để biết thêm thông tin về sản phẩm và dịch vụ, hãy truy cập website của chúng tôi.',
      soundTip: 'Website address: đọc rõ ràng từng phần, ngắt nhẹ sau "www dot".',
      difficulty: 'easy',
    },
  ],
}

const PACK_SW_DESCRIBE: SpeakingPack = {
  topicKey: 'speaking.sw_describe_img',
  title: 'TOEIC SW Part 2 – Describe a Photo',
  description: 'Nói 45 giây mô tả chi tiết hình ảnh',
  exercises: [
    {
      id: 'swd_01', type: 'qa',
      question: 'Describe this scene: Two people are sitting at a desk in an office, looking at a laptop screen together.',
      target: 'In this picture, two people appear to be working together in an office setting. They are both seated at a desk and focusing on a laptop screen. One person seems to be pointing at the screen and explaining something. The office looks modern with bright lighting.',
      modelAnswer: 'in this picture two people appear to be working together in an office setting they are both seated at a desk and focusing on a laptop screen one person seems to be pointing at the screen and explaining something',
      translation: 'Hai người ngồi ở bàn văn phòng, cùng nhìn vào màn hình laptop.',
      soundTip: 'Cấu trúc: In this picture + Description + Detail + Background/Setting',
      difficulty: 'medium',
    },
    {
      id: 'swd_02', type: 'sentence',
      target: 'There appears to be a large group of people gathered in what looks like a conference room.',
      translation: 'Có vẻ như có một nhóm người đông đúc tụ tập trong một thứ trông giống như phòng hội nghị.',
      soundTip: '"There appears to be" và "what looks like" = uncertainty language – quan trọng khi không chắc chắn.',
      difficulty: 'medium',
    },
    {
      id: 'swd_03', type: 'sentence',
      target: 'In the background, I can see several potted plants and a large window overlooking the city.',
      translation: 'Ở phía sau, tôi thấy một vài chậu cây và một cửa sổ lớn nhìn ra thành phố.',
      soundTip: '"In the background" – start sentences with location phrases for Part 2.',
      difficulty: 'easy',
    },
  ],
}

const PACK_SW_RESPOND: SpeakingPack = {
  topicKey: 'speaking.sw_respond_q',
  title: 'TOEIC SW Part 3–4 – Respond to Questions',
  description: 'Trả lời 3 câu hỏi liên quan đến survey/scenario',
  exercises: [
    {
      id: 'swrq_01', type: 'qa',
      question: 'Imagine you are being interviewed about transportation habits. How do you usually get to work or school?',
      target: 'I usually take the bus to work because it is affordable and I can read during the commute. Occasionally I ride my motorbike when I have early morning meetings.',
      modelAnswer: 'I usually take the bus to work because it is affordable and I can read during the commute occasionally I ride my motorbike when I have early morning meetings',
      translation: 'Bạn thường đi làm/học bằng phương tiện gì?',
      soundTip: 'Trả lời trực tiếp + lý do + ví dụ phụ. Tránh câu trả lời quá ngắn.',
      difficulty: 'easy',
    },
    {
      id: 'swrq_02', type: 'qa',
      question: 'How often do you eat out at restaurants, and what type of food do you prefer?',
      target: 'I eat out about twice a week, usually on weekends. I tend to prefer Vietnamese food, especially pho and banh mi, because they are delicious and reasonably priced.',
      modelAnswer: 'I eat out about twice a week usually on weekends I tend to prefer Vietnamese food especially pho and banh mi because they are delicious and reasonably priced',
      translation: 'Bạn ăn ngoài bao lâu một lần và thích loại ẩm thực gì?',
      soundTip: 'Frequency → Type → Reason. "About twice a week", "I tend to prefer".',
      difficulty: 'easy',
    },
  ],
}

const PACK_SW_PROPOSE: SpeakingPack = {
  topicKey: 'speaking.sw_propose_sol',
  title: 'TOEIC SW Part 5 – Propose a Solution',
  description: 'Trình bày giải pháp cho vấn đề trong voicemail',
  exercises: [
    {
      id: 'swps_01', type: 'qa',
      question: 'You received a voicemail: "Hi, this is Mark. I ordered a laptop from your store two weeks ago and it still hasn\'t arrived. I really need it for work. Can you help?" Respond with a solution.',
      target: 'Hi Mark, I sincerely apologize for the delay with your order. I understand this is urgent for your work. I will personally check the status of your shipment right away and call you back within the hour. If the package is lost, we will send a replacement with express delivery at no extra cost.',
      modelAnswer: 'hi Mark I sincerely apologize for the delay with your order I understand this is urgent for your work I will personally check the status of your shipment right away and call you back within the hour if the package is lost we will send a replacement with express delivery',
      translation: 'Khách hàng phàn nàn về đơn hàng laptop chưa đến sau 2 tuần.',
      soundTip: 'Cấu trúc: Apologize → Acknowledge urgency → Concrete action → Alternative if fails',
      difficulty: 'hard',
    },
  ],
}

const PACK_SW_OPINION: SpeakingPack = {
  topicKey: 'speaking.sw_opinion_adv',
  title: 'TOEIC SW Part 6 – Express an Opinion',
  description: 'Trình bày ý kiến rõ ràng, thuyết phục trong 60 giây',
  exercises: [
    {
      id: 'swop_01', type: 'qa',
      question: 'Some people believe that employees are more productive working from home than in the office. Do you agree or disagree?',
      target: 'I agree with this statement to a large extent. Many studies have shown that employees who work from home report higher levels of focus due to fewer interruptions. For instance, a Stanford study found a 13% productivity increase in remote workers. However, collaboration can suffer without face-to-face interaction, so a hybrid model is perhaps the best solution.',
      modelAnswer: 'I agree with this statement to a large extent many studies have shown that employees who work from home report higher levels of focus due to fewer interruptions for instance a Stanford study found a 13 percent productivity increase in remote workers however collaboration can suffer without face to face interaction',
      translation: 'Đồng ý hay không đồng ý: nhân viên làm việc tại nhà năng suất hơn.',
      soundTip: 'Cấu trúc opinion: Stance + Evidence + Example + Nuance (However…)',
      difficulty: 'hard',
    },
    {
      id: 'swop_02', type: 'sentence',
      target: 'In my view, companies that invest in employee well-being tend to see greater long-term returns.',
      translation: 'Theo quan điểm của tôi, các công ty đầu tư vào phúc lợi nhân viên có xu hướng đạt được lợi nhuận dài hạn tốt hơn.',
      soundTip: '"In my view," = professional opener. Stress: INVEST, WELL-BEING, GREATER.',
      difficulty: 'medium',
    },
  ],
}

// ─── Master lookup ─────────────────────────────────────────────────────────────

export const SPEAKING_PACKS: Record<string, SpeakingPack> = {
  'speaking.pronunciation':    PACK_PRONUNCIATION,
  'speaking.part1_basics':     PACK_PART1,
  'speaking.extend_answers':   PACK_EXTEND,
  'speaking.part2_cuecard':    PACK_PART2,
  'speaking.part3_abstract':   PACK_PART3,
  'speaking.develop_ideas':    PACK_DEVELOP,
  'speaking.lexical_variety':  PACK_LEXICAL,
  'speaking.cohesion':         PACK_COHESION,
  'speaking.fluency_strategy': PACK_FLUENCY,
  'speaking.pronunciation_adv': PACK_PRONUNCIATION_ADV,
  'speaking.natural_fluency':  PACK_NATURAL,
  'speaking.sw_read_aloud':    PACK_SW_READ_ALOUD,
  'speaking.sw_describe_img':  PACK_SW_DESCRIBE,
  'speaking.sw_respond_q':     PACK_SW_RESPOND,
  'speaking.sw_propose_sol':   PACK_SW_PROPOSE,
  'speaking.sw_opinion_adv':   PACK_SW_OPINION,
}

// ─── Levenshtein similarity (0–100) ──────────────────────────────────────────

function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length
  const dp: number[][] = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  )
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1])
    }
  }
  return dp[m][n]
}

export function scoreSimilarity(expected: string, spoken: string): number {
  const a = expected.toLowerCase().replace(/[^a-z0-9 ]/g, '').trim()
  const b = spoken.toLowerCase().replace(/[^a-z0-9 ]/g, '').trim()
  if (!b) return 0
  const dist = levenshtein(a, b)
  const maxLen = Math.max(a.length, b.length)
  return Math.max(0, Math.round(((maxLen - dist) / maxLen) * 100))
}

/** Find words in expected that are missing from spoken */
export function findMissingWords(expected: string, spoken: string): string[] {
  const expWords = expected.toLowerCase().replace(/[^a-z ]/g, '').split(' ').filter(Boolean)
  const spkWords = new Set(spoken.toLowerCase().replace(/[^a-z ]/g, '').split(' ').filter(Boolean))
  return expWords.filter(w => w.length > 2 && !spkWords.has(w)).slice(0, 5)
}

/** Simple per-word accuracy breakdown */
export function getWordAccuracy(expected: string, spoken: string): { word: string; ok: boolean }[] {
  const expWords = expected.toLowerCase().replace(/[^a-z ']/g, '').split(' ').filter(Boolean)
  const spkWords = new Set(spoken.toLowerCase().replace(/[^a-z ']/g, '').split(' ').filter(Boolean))
  return expWords.map(w => ({ word: w, ok: spkWords.has(w) }))
}

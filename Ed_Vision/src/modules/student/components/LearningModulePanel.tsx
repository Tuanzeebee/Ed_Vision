import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { STUDENT_LEARNING_COURSES } from '../data/learningCourses';

type LessonType = 'document' | 'flashcard' | 'sentence-builder' | 'quiz';

type Lesson = {
  id: string;
  number: string;
  title: string;
  duration: string;
  completed?: boolean;
  isDownloadable?: boolean;
  isFlashcard?: boolean;
  isSentenceBuilder?: boolean;
  isQuiz?: boolean;
};

type Section = {
  id: string;
  title: string;
  lessonCount: number;
  duration: string;
  lessons: Lesson[];
};

type Props = {
  visible: boolean;
  onClose: () => void;
  onCompleteModule?: () => void;
  selectedCourseId?: string | null;
  selectedModuleId?: number | null;
};

type QuizMatchPair = {
  left: string;
  right: string;
};

type QuizQuestion = {
  id: string;
  type: 'multiple-choice' | 'true-false' | 'fill-blank' | 'multiple-select' | 'match-pairs';
  question: string;
  options?: string[];
  matchPairs?: QuizMatchPair[];
  correctAnswer: string | string[];
  explanation?: string;
  promptAudioText?: string;
  inputPlaceholder?: string;
};

type QuizLessonConfig = {
  id: string;
  title: string;
  subtitle: string;
  objective: string;
  estimatedTime: string;
  iconClass: string;
  questions: QuizQuestion[];
};

type DocumentLesson = {
  title: string;
  fileName: string;
  readingTime: string;
  pages: number;
  overview: string;
  objectives: string[];
  sections: Array<{
    heading: string;
    content: string;
  }>;
  practiceTasks: string[];
};

type FlashcardField = 'concept' | 'definition' | 'application' | 'promptHint';

type FlashcardSourceRow = {
  id: string;
  concept: string;
  definition: string;
  application: string;
  promptHint: string;
};

type FlashcardPreset = {
  id: string;
  name: string;
  description: string;
  revealField: FlashcardField;
  askFields: FlashcardField[];
};

type FlashcardCard = {
  id: string;
  sourceId: string;
  askField: FlashcardField;
  askLabel: string;
  askValue: string;
  revealField: FlashcardField;
  revealLabel: string;
  revealValue: string;
};

type SentenceDifficulty = 'easy' | 'medium' | 'hard';

type SentenceBuilderLevel = {
  id: string;
  difficulty: SentenceDifficulty;
  topic: string;
  prompt: string;
  correctSentence: string;
  translation: string;
  xpReward: number;
  coinReward: number;
  timeLimitSeconds: number;
};

type SentenceBuilderTile = {
  id: string;
  word: string;
  originalIndex: number;
};

type SentenceBuilderMode = 'click' | 'drag';

type SentencePracticeMode = 'builder' | 'listen' | 'translate' | 'match';

type SentencePracticeBonusMode = 'listen' | 'translate' | 'match';

type SentenceMatchPair = {
  id: string;
  concept: string;
  definition: string;
};

type SentenceBuilderFeedbackState = 'idle' | 'correct' | 'incorrect' | 'timeout';

type SentenceBuilderProgressState = {
  xp: number;
  coins: number;
  streak: number;
  combo: number;
  bestCombo: number;
  highestUnlockedLevel: number;
  masteredLevelIds: string[];
};

type QuizScoreSummary = {
  correctAnswers: number;
  totalQuestions: number;
  scorePercent: number;
  scorePoints: number;
};

type QuizLeaderboardEntry = {
  id: string;
  playerName: string;
  scorePercent: number;
  scorePoints: number;
  correctAnswers: number;
  totalQuestions: number;
  completionSeconds: number;
  completedAt: number;
};

type QuizModuleSummaryItem = {
  lessonId: string;
  lessonNumber: string;
  lessonTitle: string;
  attempts: number;
  bestEntry: QuizLeaderboardEntry | null;
  latestEntry: QuizLeaderboardEntry | null;
};

type QuizResultViewMode = 'summary' | 'review' | 'leaderboard';

type LearningEconomyState = {
  hearts: number;
  gems: number;
  streakDays: number;
  lastStudyDate: string | null;
  totalXp: number;
  dailyQuestDate: string | null;
  dailyQuestTargetXp: number;
  dailyQuestEarnedXp: number;
  dailyQuestCompleted: boolean;
};

type CompletionFlowStep = 'summary' | 'streak' | 'daily' | 'reward';

type CompletionFlowSnapshot = {
  moduleXpEarned: number;
  accuracyPercent: number;
  streakDays: number;
  streakWeekStatus: boolean[];
  dailyQuestTargetXp: number;
  dailyQuestEarnedXp: number;
  dailyQuestCompleted: boolean;
  gemsAwarded: number;
  totalGems: number;
};

const QUIZ_LEADERBOARD_STORAGE_KEY = 'edvision-quiz-leaderboard';
const MAX_LEADERBOARD_ENTRIES = 20;
const SENTENCE_BUILDER_PROGRESS_STORAGE_KEY = 'edvision-sentence-builder-progress';
const LEARNING_ECONOMY_STORAGE_KEY = 'edvision-learning-economy';
const MAX_HEARTS = 5;
const DAILY_QUEST_TARGET_XP = 10;
const DAILY_QUEST_GEM_REWARD = 5;
const COMPLETION_FLOW_ORDER: CompletionFlowStep[] = ['summary', 'streak', 'daily', 'reward'];
const QUIZ_MATCH_PAIR_DELIMITER = '=>';
const QUIZ_FILL_BLANK_HINT_MAX_USES = 3;

const getQuizFillBlankHintLimit = (fillBlankQuestionCount: number) => {
  if (fillBlankQuestionCount <= 0) return 0;

  return Math.max(
    1,
    Math.min(QUIZ_FILL_BLANK_HINT_MAX_USES, Math.ceil(fillBlankQuestionCount / 2))
  );
};

const buildQuizFillBlankHintText = (answerValue: string) => {
  const normalizedAnswer = answerValue.trim();
  if (!normalizedAnswer) return 'Chưa có gợi ý cho câu này.';

  const answerWords = normalizedAnswer.split(/\s+/).filter(Boolean);

  const maskedWords = answerWords.map((word) => {
    if (word.length <= 1) return `${word}_`;
    if (word.length === 2) return `${word[0]}_`;
    return `${word[0]}${'_'.repeat(Math.max(1, word.length - 2))}${word[word.length - 1]}`;
  });

  return `Gợi ý: ${maskedWords.join(' ')} (${answerWords.length} từ).`;
};

const getQuizLeaderboardStorageKey = (lessonId: string) => {
  return `${QUIZ_LEADERBOARD_STORAGE_KEY}-${lessonId}`;
};

const buildQuizMatchPairAnswerKey = (left: string, right: string) => {
  return `${left.trim()}${QUIZ_MATCH_PAIR_DELIMITER}${right.trim()}`;
};

const parseQuizMatchPairAnswers = (answerValues: string[] | undefined): QuizMatchPair[] => {
  if (!answerValues || answerValues.length === 0) return [];

  const parsedPairs: QuizMatchPair[] = [];
  const seenKeys = new Set<string>();

  answerValues.forEach((rawValue) => {
    const delimiterIndex = rawValue.indexOf(QUIZ_MATCH_PAIR_DELIMITER);
    if (delimiterIndex <= 0) return;

    const left = rawValue.slice(0, delimiterIndex).trim();
    const right = rawValue
      .slice(delimiterIndex + QUIZ_MATCH_PAIR_DELIMITER.length)
      .trim();

    if (!left || !right) return;

    const pairKey = buildQuizMatchPairAnswerKey(left, right);
    if (seenKeys.has(pairKey)) return;

    seenKeys.add(pairKey);
    parsedPairs.push({ left, right });
  });

  return parsedPairs;
};

const serializeQuizMatchPairAnswers = (pairs: QuizMatchPair[]) => {
  return pairs.map((pair) => buildQuizMatchPairAnswerKey(pair.left, pair.right));
};

const ASSESSMENT_MULTIPLE_CHOICE_QUESTIONS: QuizQuestion[] = [
  {
    id: 'assessment-multiple-choice-q1',
    type: 'multiple-choice',
    question: 'Trí tuệ nhân tạo (AI) là gì?',
    options: [
      'Khả năng của máy tính thực hiện các nhiệm vụ đòi hỏi trí thông minh con người',
      'Một loại phần mềm chỉ dùng để chơi game',
      'Công nghệ chỉ dùng trong y tế',
      'Hệ thống máy tính không cần lập trình'
    ],
    correctAnswer: 'Khả năng của máy tính thực hiện các nhiệm vụ đòi hỏi trí thông minh con người',
    explanation:
      'AI là khả năng của máy móc thực hiện các nhiệm vụ thường đòi hỏi trí thông minh của con người như học tập, suy luận và giải quyết vấn đề.'
  },
  {
    id: 'assessment-multiple-choice-q2',
    type: 'true-false',
    question: 'AI hẹp (Narrow AI) có thể thực hiện nhiều nhiệm vụ khác nhau giống như con người.',
    options: ['Đúng', 'Sai'],
    correctAnswer: 'Sai',
    explanation:
      'AI hẹp chỉ được thiết kế để thực hiện một nhiệm vụ cụ thể, không thể thực hiện nhiều nhiệm vụ khác nhau như con người.'
  },
  {
    id: 'assessment-multiple-choice-q3',
    type: 'multiple-select',
    question: 'Chọn các lĩnh vực mà AI đang được ứng dụng: (Chọn tất cả đáp án đúng)',
    options: [
      'Y tế - chẩn đoán bệnh',
      'Thương mại điện tử - gợi ý sản phẩm',
      'Giao thông - xe tự lái',
      'Chỉ trong nghiên cứu khoa học'
    ],
    correctAnswer: ['Y tế - chẩn đoán bệnh', 'Thương mại điện tử - gợi ý sản phẩm', 'Giao thông - xe tự lái'],
    explanation:
      'AI đang được ứng dụng rộng rãi trong nhiều lĩnh vực: y tế, thương mại, giao thông, giáo dục và nhiều ngành khác.'
  },
  {
    id: 'assessment-multiple-choice-q4',
    type: 'fill-blank',
    question:
      'Điền từ còn thiếu: AI tổng quát (General AI) có khả năng hiểu, học hỏi và áp dụng trí thông minh vào bất kỳ vấn đề nào, giống như _____.',
    correctAnswer: 'con người',
    inputPlaceholder: 'Nhập từ còn thiếu...',
    explanation:
      'AI tổng quát (Strong AI) được thiết kế để có khả năng suy nghĩ và giải quyết vấn đề giống như con người, nhưng hiện vẫn đang trong giai đoạn nghiên cứu.'
  }
];

const ASSESSMENT_MATCH_PAIRS_QUESTIONS: QuizQuestion[] = [
  {
    id: 'assessment-match-pairs-q1',
    type: 'match-pairs',
    question: 'Ghép đúng thuật ngữ với định nghĩa tương ứng.',
    matchPairs: [
      { left: 'Narrow AI', right: 'Tập trung cho một nhiệm vụ cụ thể' },
      { left: 'General AI', right: 'Mục tiêu xử lý đa dạng nhiệm vụ như con người' },
      { left: 'RAG', right: 'Tìm tài liệu liên quan trước khi sinh câu trả lời' },
      { left: 'Fact-check', right: 'Đối chiếu thông tin với nguồn tin cậy' }
    ],
    correctAnswer: [
      buildQuizMatchPairAnswerKey('Narrow AI', 'Tập trung cho một nhiệm vụ cụ thể'),
      buildQuizMatchPairAnswerKey('General AI', 'Mục tiêu xử lý đa dạng nhiệm vụ như con người'),
      buildQuizMatchPairAnswerKey('RAG', 'Tìm tài liệu liên quan trước khi sinh câu trả lời'),
      buildQuizMatchPairAnswerKey('Fact-check', 'Đối chiếu thông tin với nguồn tin cậy')
    ],
    explanation: 'Match Pairs yêu cầu nối đúng khái niệm với định nghĩa hoặc ví dụ phù hợp.'
  },
  {
    id: 'assessment-match-pairs-q2',
    type: 'match-pairs',
    question: 'Ghép đúng các thành phần trong Prompt 4 phần.',
    matchPairs: [
      { left: 'Goal', right: 'Mục tiêu cần đạt của câu trả lời' },
      { left: 'Context', right: 'Bối cảnh và dữ kiện đầu vào' },
      { left: 'Output format', right: 'Cấu trúc đầu ra mong muốn' },
      { left: 'Criteria', right: 'Tiêu chí để kiểm tra chất lượng' }
    ],
    correctAnswer: [
      buildQuizMatchPairAnswerKey('Goal', 'Mục tiêu cần đạt của câu trả lời'),
      buildQuizMatchPairAnswerKey('Context', 'Bối cảnh và dữ kiện đầu vào'),
      buildQuizMatchPairAnswerKey('Output format', 'Cấu trúc đầu ra mong muốn'),
      buildQuizMatchPairAnswerKey('Criteria', 'Tiêu chí để kiểm tra chất lượng')
    ],
    explanation: 'Prompt rõ cấu trúc giúp AI trả lời đúng trọng tâm và dễ chấm chất lượng.'
  },
  {
    id: 'assessment-match-pairs-q3',
    type: 'match-pairs',
    question: 'Ghép đúng khái niệm học tập với mô tả tương ứng.',
    matchPairs: [
      { left: 'Human-in-the-loop', right: 'Con người giám sát và quyết định cuối' },
      { left: 'Bias', right: 'Thiên lệch khiến đầu ra thiếu công bằng' },
      { left: 'Adaptive practice', right: 'Lặp lại mẫu khó đến khi trả lời đúng' },
      { left: 'Guided feedback', right: 'Phản hồi có hướng dẫn để cải thiện nhanh' }
    ],
    correctAnswer: [
      buildQuizMatchPairAnswerKey('Human-in-the-loop', 'Con người giám sát và quyết định cuối'),
      buildQuizMatchPairAnswerKey('Bias', 'Thiên lệch khiến đầu ra thiếu công bằng'),
      buildQuizMatchPairAnswerKey('Adaptive practice', 'Lặp lại mẫu khó đến khi trả lời đúng'),
      buildQuizMatchPairAnswerKey('Guided feedback', 'Phản hồi có hướng dẫn để cải thiện nhanh')
    ],
    explanation: 'Các cặp đúng phản ánh nghĩa chuẩn trong bộ học liệu AI literacy.'
  },
  {
    id: 'assessment-match-pairs-q4',
    type: 'match-pairs',
    question: 'Ghép đúng lĩnh vực với ứng dụng AI phù hợp.',
    matchPairs: [
      { left: 'Y tế', right: 'Hỗ trợ chẩn đoán bệnh từ dữ liệu' },
      { left: 'Thương mại điện tử', right: 'Gợi ý sản phẩm cá nhân hóa' },
      { left: 'Giao thông', right: 'Hỗ trợ xe tự lái và điều hướng' },
      { left: 'Giáo dục', right: 'Cá nhân hóa lộ trình học tập' }
    ],
    correctAnswer: [
      buildQuizMatchPairAnswerKey('Y tế', 'Hỗ trợ chẩn đoán bệnh từ dữ liệu'),
      buildQuizMatchPairAnswerKey('Thương mại điện tử', 'Gợi ý sản phẩm cá nhân hóa'),
      buildQuizMatchPairAnswerKey('Giao thông', 'Hỗ trợ xe tự lái và điều hướng'),
      buildQuizMatchPairAnswerKey('Giáo dục', 'Cá nhân hóa lộ trình học tập')
    ],
    explanation: 'Bài ghép cặp ứng dụng giúp phân biệt nhanh AI theo từng lĩnh vực thực tiễn.'
  }
];

const ASSESSMENT_FILL_BLANK_QUESTIONS: QuizQuestion[] = [
  {
    id: 'assessment-fill-blank-q1',
    type: 'fill-blank',
    question: 'Điền từ còn thiếu: A clear prompt includes goal, context, output format and _____.',
    correctAnswer: 'criteria',
    inputPlaceholder: 'Nhập từ tiếng Anh...',
    explanation: 'Bốn phần cốt lõi của prompt là goal, context, output format và criteria.'
  },
  {
    id: 'assessment-fill-blank-q2',
    type: 'fill-blank',
    question: 'Điền từ còn thiếu: Trước khi dùng câu trả lời AI, cần _____ thông tin quan trọng.',
    correctAnswer: 'kiểm chứng',
    inputPlaceholder: 'Nhập từ tiếng Việt...',
    explanation: 'Kiểm chứng là bước bắt buộc trước khi áp dụng kết quả AI.'
  },
  {
    id: 'assessment-fill-blank-q3',
    type: 'multiple-choice',
    question: 'Chọn từ phù hợp để hoàn thành câu: Human review keeps AI suggestions _____ and responsible.',
    options: ['accurate', 'random', 'noisy', 'irrelevant'],
    correctAnswer: 'accurate',
    explanation: 'Đánh giá của con người giúp gợi ý AI chính xác hơn.'
  },
  {
    id: 'assessment-fill-blank-q4',
    type: 'fill-blank',
    question: 'Điền từ còn thiếu: Adaptive practice repeats difficult patterns until learners answer _____.',
    correctAnswer: 'correctly',
    inputPlaceholder: 'Nhập từ tiếng Anh...',
    explanation: 'Mục tiêu của adaptive practice là giúp người học trả lời đúng ổn định.'
  }
];

const ASSESSMENT_TRANSLATION_QUESTIONS: QuizQuestion[] = [
  {
    id: 'assessment-translation-q1',
    type: 'multiple-choice',
    question: 'Dịch sang tiếng Anh: "Kiểm chứng thông tin trước khi dùng kết quả AI"',
    options: [
      'Verify information before using AI output',
      'Ignore context before using AI output',
      'Share answers before checking sources',
      'Train a model before reading the question'
    ],
    correctAnswer: 'Verify information before using AI output',
    explanation: 'Ý chính là verify thông tin trước khi dùng kết quả.'
  },
  {
    id: 'assessment-translation-q2',
    type: 'multiple-choice',
    question: 'Dịch sang tiếng Việt: "Human-in-the-loop"',
    options: [
      'Con người trong vòng kiểm soát',
      'Máy móc thay thế hoàn toàn',
      'Không cần giám sát',
      'Dữ liệu tự sửa lỗi'
    ],
    correctAnswer: 'Con người trong vòng kiểm soát',
    explanation: 'Human-in-the-loop nhấn mạnh vai trò giám sát và quyết định của con người.'
  },
  {
    id: 'assessment-translation-q3',
    type: 'fill-blank',
    question: 'Điền từ còn thiếu: "phản hồi có hướng dẫn" = _____ feedback.',
    correctAnswer: 'guided',
    inputPlaceholder: 'Nhập từ tiếng Anh...',
    explanation: 'guided feedback là cụm phổ biến trong ngữ cảnh giáo dục.'
  },
  {
    id: 'assessment-translation-q4',
    type: 'fill-blank',
    question: 'Điền từ còn thiếu: "adaptive practice" = luyện tập _____.',
    correctAnswer: 'thích nghi',
    inputPlaceholder: 'Nhập từ tiếng Việt...',
    explanation: 'adaptive tương ứng với "thích nghi" theo ngữ cảnh học tập.'
  }
];

const ASSESSMENT_LISTENING_QUESTIONS: QuizQuestion[] = [
  {
    id: 'assessment-listening-q1',
    type: 'multiple-choice',
    question: 'Nghe audio và chọn bản chép đúng.',
    options: [
      'AI helps students learn faster with guided feedback',
      'AI helps teachers grade slower with random feedback',
      'AI hurts students learn faster with guided feedback',
      'AI helps students learn faster with guided template only'
    ],
    correctAnswer: 'AI helps students learn faster with guided feedback',
    promptAudioText: 'AI helps students learn faster with guided feedback',
    explanation: 'Hãy nghe toàn câu và chú ý từ khóa guided feedback.'
  },
  {
    id: 'assessment-listening-q2',
    type: 'true-false',
    question: 'Nghe audio rồi chọn Đúng hoặc Sai: Câu nói rằng AI có thể thay thế hoàn toàn đánh giá của con người.',
    options: ['Đúng', 'Sai'],
    correctAnswer: 'Sai',
    promptAudioText: 'Human review keeps AI suggestions accurate useful and responsible',
    explanation: 'Audio nhấn mạnh vai trò human review, không phải thay thế hoàn toàn.'
  },
  {
    id: 'assessment-listening-q3',
    type: 'fill-blank',
    question: 'Nghe audio và điền từ còn thiếu: Always verify important _____ before using an AI generated answer.',
    correctAnswer: 'facts',
    inputPlaceholder: 'Nhập từ còn thiếu...',
    promptAudioText: 'Always verify important facts before using an AI generated answer',
    explanation: 'Từ còn thiếu là facts.'
  },
  {
    id: 'assessment-listening-q4',
    type: 'multiple-choice',
    question: 'Nghe audio và chọn nghĩa tiếng Việt đúng nhất.',
    options: [
      'Một prompt rõ ràng gồm mục tiêu, bối cảnh, định dạng đầu ra và tiêu chí',
      'Một prompt tốt là prompt càng dài càng tốt',
      'Prompt chỉ cần mục tiêu, không cần tiêu chí',
      'Prompt không cần bối cảnh'
    ],
    correctAnswer: 'Một prompt rõ ràng gồm mục tiêu, bối cảnh, định dạng đầu ra và tiêu chí',
    promptAudioText: 'A clear prompt includes goal context output format and criteria',
    explanation: 'Nội dung audio trùng với 4 thành phần của prompt chất lượng.'
  }
];

const ASSESSMENT_SPEAKING_QUESTIONS: QuizQuestion[] = [
  {
    id: 'assessment-speaking-q1',
    type: 'fill-blank',
    question: 'Đọc to câu sau rồi nhập lại để self-check phát âm:',
    correctAnswer: 'can i have water please',
    inputPlaceholder: 'Nhập lại câu bạn vừa đọc...',
    promptAudioText: 'Can I have water please',
    explanation: 'Bài này mô phỏng speaking bằng self-check: đọc to và nhập lại câu.'
  },
  {
    id: 'assessment-speaking-q2',
    type: 'multiple-choice',
    question: 'Khi luyện nói lịch sự, câu nào phù hợp nhất?',
    options: ['Can I have water, please?', 'Give me water now!', 'Water. Fast.', 'I want you serve me.'],
    correctAnswer: 'Can I have water, please?',
    explanation: 'Câu có please thể hiện cách nói lịch sự trong hội thoại.'
  },
  {
    id: 'assessment-speaking-q3',
    type: 'fill-blank',
    question: 'Điền từ còn thiếu khi đọc to: Human review keeps AI suggestions _____ useful and responsible.',
    correctAnswer: 'accurate',
    inputPlaceholder: 'Nhập từ còn thiếu...',
    promptAudioText: 'Human review keeps AI suggestions accurate useful and responsible',
    explanation: 'Từ khóa cần phát âm rõ trong câu này là accurate.'
  },
  {
    id: 'assessment-speaking-q4',
    type: 'true-false',
    question: 'Luyện nói hiệu quả hơn khi đọc thành tiếng, ghi âm lại và tự nghe để chỉnh lỗi.',
    options: ['Đúng', 'Sai'],
    correctAnswer: 'Đúng',
    explanation: 'Đây là vòng phản hồi nhanh giúp cải thiện phát âm và ngữ điệu.'
  }
];

const ASSESSMENT_IMAGE_QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: 'assessment-image-q1',
    type: 'multiple-choice',
    question: 'Hình nào mô tả ứng dụng AI trong giao thông tự lái?',
    options: ['🚗🤖', '🍎📘', '🎧📝', '🧪📚'],
    correctAnswer: '🚗🤖',
    explanation: 'Biểu tượng xe + robot gợi ý hệ thống tự lái.'
  },
  {
    id: 'assessment-image-q2',
    type: 'multiple-choice',
    question: 'Hình 🩺 + 🤖 phù hợp nhất với lĩnh vực nào?',
    options: ['Y tế hỗ trợ chẩn đoán', 'Âm nhạc giải trí', 'Mạng xã hội', 'Du lịch'],
    correctAnswer: 'Y tế hỗ trợ chẩn đoán',
    explanation: 'AI trong y tế thường hỗ trợ phân tích dữ liệu và chẩn đoán.'
  },
  {
    id: 'assessment-image-q3',
    type: 'true-false',
    question: 'Hình 📚🤖 có thể đại diện cho học tập cá nhân hóa bằng AI.',
    options: ['Đúng', 'Sai'],
    correctAnswer: 'Đúng',
    explanation: 'Đúng, đây là ví dụ của adaptive learning.'
  },
  {
    id: 'assessment-image-q4',
    type: 'multiple-select',
    question: 'Chọn tất cả biểu tượng thể hiện bài nghe/nói trong học ngôn ngữ:',
    options: ['🎧🗣️', '🎤📘', '🧮📊', '🎧⌨️'],
    correctAnswer: ['🎧🗣️', '🎤📘', '🎧⌨️'],
    explanation: 'Các biểu tượng có headphone/micro/typing đều liên quan nghe nói.'
  }
];

const ASSESSMENT_TRUE_FALSE_QUESTIONS: QuizQuestion[] = [
  {
    id: 'assessment-true-false-q1',
    type: 'true-false',
    question: 'Prompt càng rõ mục tiêu và tiêu chí thì kết quả AI thường càng ổn định.',
    options: ['Đúng', 'Sai'],
    correctAnswer: 'Đúng',
    explanation: 'Mục tiêu và tiêu chí rõ ràng giúp AI bám yêu cầu tốt hơn.'
  },
  {
    id: 'assessment-true-false-q2',
    type: 'true-false',
    question: 'Fact-check nghĩa là chỉ cần kiểm tra một nguồn là đủ.',
    options: ['Đúng', 'Sai'],
    correctAnswer: 'Sai',
    explanation: 'Nên đối chiếu ít nhất 2 nguồn đáng tin để giảm sai lệch.'
  },
  {
    id: 'assessment-true-false-q3',
    type: 'true-false',
    question: 'Human-in-the-loop giúp giảm rủi ro khi dùng AI cho nội dung quan trọng.',
    options: ['Đúng', 'Sai'],
    correctAnswer: 'Đúng',
    explanation: 'Con người kiểm soát bước cuối giúp tăng an toàn và trách nhiệm.'
  },
  {
    id: 'assessment-true-false-q4',
    type: 'true-false',
    question: 'Bias trong AI luôn tự biến mất khi dữ liệu lớn hơn.',
    options: ['Đúng', 'Sai'],
    correctAnswer: 'Sai',
    explanation: 'Bias cần được phát hiện và xử lý chủ động, không tự biến mất.'
  }
];

const ASSESSMENT_ORDERING_QUESTIONS: QuizQuestion[] = [
  {
    id: 'assessment-ordering-q1',
    type: 'multiple-choice',
    question: 'Chọn thứ tự hợp lý nhất để tạo prompt chất lượng:',
    options: [
      'Goal -> Context -> Output format -> Criteria',
      'Criteria -> Goal -> Output format -> Context',
      'Context -> Criteria -> Goal -> Output format',
      'Output format -> Goal -> Criteria -> Context'
    ],
    correctAnswer: 'Goal -> Context -> Output format -> Criteria',
    explanation: 'Đây là trình tự dễ triển khai và bám mục tiêu nhất.'
  },
  {
    id: 'assessment-ordering-q2',
    type: 'multiple-choice',
    question: 'Chọn thứ tự workflow AI-learning hợp lý:',
    options: [
      'Đặt mục tiêu -> Hỏi AI có cấu trúc -> Tự luyện -> Đánh giá cải tiến',
      'Đánh giá cải tiến -> Tự luyện -> Đặt mục tiêu -> Hỏi AI',
      'Hỏi AI -> Bỏ qua tự luyện -> Chốt kết quả',
      'Tự luyện -> Đặt mục tiêu -> Không đánh giá'
    ],
    correctAnswer: 'Đặt mục tiêu -> Hỏi AI có cấu trúc -> Tự luyện -> Đánh giá cải tiến',
    explanation: 'Workflow chuẩn phải có vòng phản hồi và cải tiến liên tục.'
  },
  {
    id: 'assessment-ordering-q3',
    type: 'fill-blank',
    question: 'Nhập đúng chuỗi theo thứ tự: collect data -> train model -> evaluate -> deploy',
    correctAnswer: 'collect data train model evaluate deploy',
    inputPlaceholder: 'Nhập chuỗi theo đúng thứ tự...',
    explanation: 'Giữ nguyên thứ tự các bước chính của pipeline.'
  },
  {
    id: 'assessment-ordering-q4',
    type: 'multiple-choice',
    question: 'Thứ tự fact-check đáng tin cậy nhất là:',
    options: [
      'Đọc kết quả -> Đối chiếu nguồn 1 -> Đối chiếu nguồn 2 -> Kết luận',
      'Đọc kết quả -> Kết luận ngay -> Chia sẻ',
      'Chia sẻ trước -> Kiểm tra sau',
      'Bỏ qua nguồn chính thống -> Dùng nguồn bất kỳ'
    ],
    correctAnswer: 'Đọc kết quả -> Đối chiếu nguồn 1 -> Đối chiếu nguồn 2 -> Kết luận',
    explanation: 'Cần đối chiếu nguồn trước khi kết luận cuối.'
  }
];

const QUIZ_LESSON_CONFIGS: Record<string, QuizLessonConfig> = {
  'assessment-multiple-choice': {
    id: 'assessment-multiple-choice',
    title: 'Multiple Choice Challenge',
    subtitle: 'Trắc nghiệm nền tảng AI',
    objective: 'Kiểm tra nhanh kiến thức cốt lõi về AI và ứng dụng.',
    estimatedTime: '4-6 phút',
    iconClass: 'fas fa-list-check',
    questions: ASSESSMENT_MULTIPLE_CHOICE_QUESTIONS
  },
  'assessment-match-pairs': {
    id: 'assessment-match-pairs',
    title: 'Match Pairs Challenge',
    subtitle: 'Ghép cặp khái niệm - định nghĩa',
    objective: 'Luyện phản xạ nối đúng thuật ngữ với ý nghĩa tương ứng.',
    estimatedTime: '3-5 phút',
    iconClass: 'fas fa-link',
    questions: ASSESSMENT_MATCH_PAIRS_QUESTIONS
  },
  'assessment-fill-blank': {
    id: 'assessment-fill-blank',
    title: 'Fill in the Blank Challenge',
    subtitle: 'Điền khuyết theo ngữ cảnh',
    objective: 'Kiểm tra khả năng nhớ từ khóa và áp dụng vào câu.',
    estimatedTime: '3-5 phút',
    iconClass: 'fas fa-pen',
    questions: ASSESSMENT_FILL_BLANK_QUESTIONS
  },
  'assessment-translation-quiz': {
    id: 'assessment-translation-quiz',
    title: 'Translation Challenge',
    subtitle: 'Dịch Việt <-> Anh',
    objective: 'Đo năng lực chuyển đổi thuật ngữ qua hai ngôn ngữ.',
    estimatedTime: '4-6 phút',
    iconClass: 'fas fa-language',
    questions: ASSESSMENT_TRANSLATION_QUESTIONS
  },
  'assessment-listening-quiz': {
    id: 'assessment-listening-quiz',
    title: 'Listening Challenge',
    subtitle: 'Nghe và chọn đáp án',
    objective: 'Luyện nghe key terms và nhận diện câu đúng.',
    estimatedTime: '4-6 phút',
    iconClass: 'fas fa-headphones',
    questions: ASSESSMENT_LISTENING_QUESTIONS
  },
  'assessment-speaking-quiz': {
    id: 'assessment-speaking-quiz',
    title: 'Speaking Challenge',
    subtitle: 'Đọc to và self-check',
    objective: 'Luyện phát âm với vòng tự đọc và kiểm tra lại nhanh.',
    estimatedTime: '4-6 phút',
    iconClass: 'fas fa-microphone',
    questions: ASSESSMENT_SPEAKING_QUESTIONS
  },
  'assessment-image-quiz': {
    id: 'assessment-image-quiz',
    title: 'Image Quiz Challenge',
    subtitle: 'Nhận diện nghĩa qua hình ảnh',
    objective: 'Kích hoạt trí nhớ thị giác tương tự kiểu bài trên app học ngôn ngữ.',
    estimatedTime: '3-5 phút',
    iconClass: 'fas fa-image',
    questions: ASSESSMENT_IMAGE_QUIZ_QUESTIONS
  },
  'assessment-true-false': {
    id: 'assessment-true-false',
    title: 'True / False Challenge',
    subtitle: 'Phản xạ nhận định nhanh',
    objective: 'Củng cố các nguyên tắc dùng AI an toàn và hiệu quả.',
    estimatedTime: '3-4 phút',
    iconClass: 'fas fa-circle-check',
    questions: ASSESSMENT_TRUE_FALSE_QUESTIONS
  },
  'assessment-ordering-quiz': {
    id: 'assessment-ordering-quiz',
    title: 'Ordering Challenge',
    subtitle: 'Sắp thứ tự logic',
    objective: 'Đánh giá tư duy trình tự trong workflow và quy trình học.',
    estimatedTime: '4-6 phút',
    iconClass: 'fas fa-sort',
    questions: ASSESSMENT_ORDERING_QUESTIONS
  }
};

const DEFAULT_QUIZ_LESSON_CONFIG: QuizLessonConfig = {
  id: 'assessment-multiple-choice',
  title: 'AI Quiz',
  subtitle: 'Bài kiểm tra kiến thức',
  objective: 'Ôn tập và đánh giá nhanh kiến thức AI.',
  estimatedTime: '4-6 phút',
  iconClass: 'fas fa-clipboard-question',
  questions: ASSESSMENT_MULTIPLE_CHOICE_QUESTIONS
};

const SENTENCE_BUILDER_LEVELS: SentenceBuilderLevel[] = [
  {
    id: 'sb-1',
    difficulty: 'easy',
    topic: 'AI Basics',
    prompt: 'Sắp xếp câu mô tả đúng về AI cơ bản.',
    correctSentence: 'AI helps students learn faster with guided feedback',
    translation: 'AI giúp học viên học nhanh hơn với phản hồi có hướng dẫn.',
    xpReward: 12,
    coinReward: 4,
    timeLimitSeconds: 45
  },
  {
    id: 'sb-2',
    difficulty: 'easy',
    topic: 'Prompt Skills',
    prompt: 'Sắp xếp câu về cấu trúc prompt hiệu quả.',
    correctSentence: 'A clear prompt includes goal context output format and criteria',
    translation: 'Một prompt rõ ràng gồm mục tiêu bối cảnh định dạng đầu ra và tiêu chí.',
    xpReward: 14,
    coinReward: 5,
    timeLimitSeconds: 45
  },
  {
    id: 'sb-3',
    difficulty: 'medium',
    topic: 'Verification',
    prompt: 'Sắp xếp câu nhấn mạnh kiểm chứng thông tin.',
    correctSentence: 'Always verify important facts before using an AI generated answer',
    translation: 'Luôn kiểm chứng thông tin quan trọng trước khi dùng câu trả lời do AI tạo.',
    xpReward: 16,
    coinReward: 6,
    timeLimitSeconds: 40
  },
  {
    id: 'sb-4',
    difficulty: 'medium',
    topic: 'Human in the loop',
    prompt: 'Sắp xếp câu về vai trò con người trong quy trình AI.',
    correctSentence: 'Human review keeps AI suggestions accurate useful and responsible',
    translation: 'Đánh giá của con người giúp gợi ý AI chính xác hữu ích và có trách nhiệm.',
    xpReward: 18,
    coinReward: 7,
    timeLimitSeconds: 38
  },
  {
    id: 'sb-5',
    difficulty: 'hard',
    topic: 'Adaptive Learning',
    prompt: 'Sắp xếp câu nói về học thích nghi với lỗi sai.',
    correctSentence: 'Adaptive practice repeats difficult patterns until learners answer correctly',
    translation: 'Luyện tập thích nghi sẽ lặp lại mẫu khó cho tới khi người học trả lời đúng.',
    xpReward: 22,
    coinReward: 9,
    timeLimitSeconds: 35
  }
];

const SENTENCE_DIFFICULTY_LABELS: Record<SentenceDifficulty, string> = {
  easy: 'Easy',
  medium: 'Medium',
  hard: 'Hard'
};

const SENTENCE_DIFFICULTY_BADGE_CLASS: Record<SentenceDifficulty, string> = {
  easy: 'bg-emerald-500/20 text-emerald-200 border border-emerald-400/40',
  medium: 'bg-amber-500/20 text-amber-200 border border-amber-400/40',
  hard: 'bg-rose-500/20 text-rose-200 border border-rose-400/40'
};

const SENTENCE_PRACTICE_TABS: Array<{
  id: SentencePracticeMode;
  label: string;
  iconClass: string;
  description: string;
}> = [
  {
    id: 'builder',
    label: 'Word Order',
    iconClass: 'fas fa-puzzle-piece',
    description: 'Sắp xếp từ đúng thứ tự.'
  },
  {
    id: 'listen',
    label: 'Listen & Type',
    iconClass: 'fas fa-headphones',
    description: 'Nghe câu và gõ lại.'
  },
  {
    id: 'translate',
    label: 'Choose Meaning',
    iconClass: 'fas fa-language',
    description: 'Chọn nghĩa tiếng Việt đúng.'
  },
  {
    id: 'match',
    label: 'Match Pairs',
    iconClass: 'fas fa-link',
    description: 'Ghép khái niệm với định nghĩa.'
  }
];

const SENTENCE_PRACTICE_BONUS_XP = 6;
const SENTENCE_PRACTICE_BONUS_COINS = 2;
const FLASHCARD_LOADING_DELAY_MS = 180;
const FLASHCARD_SWIPE_THRESHOLD_PX = 56;
const FLASHCARD_PROGRESS_DOT_COLORS = [
  'bg-emerald-300',
  'bg-cyan-300',
  'bg-amber-300',
  'bg-fuchsia-300',
  'bg-orange-300'
] as const;
const FLASHCARD_FOCUS_VISIBLE_CLASS =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-300/60 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900';

const buildSentenceWordTiles = (correctSentence: string): SentenceBuilderTile[] => {
  const words = correctSentence
    .split(/\s+/)
    .map((word) => word.trim())
    .filter(Boolean);

  return words.map((word, index) => ({
    id: `sb-word-${index}-${Math.random().toString(36).slice(2, 7)}`,
    word,
    originalIndex: index
  }));
};

const shuffleSentenceTiles = (tiles: SentenceBuilderTile[]) => {
  const cloned = [...tiles];
  for (let i = cloned.length - 1; i > 0; i -= 1) {
    const randomIndex = Math.floor(Math.random() * (i + 1));
    [cloned[i], cloned[randomIndex]] = [cloned[randomIndex], cloned[i]];
  }
  return cloned;
};

const shuffleArray = <T,>(items: T[]) => {
  const cloned = [...items];
  for (let i = cloned.length - 1; i > 0; i -= 1) {
    const randomIndex = Math.floor(Math.random() * (i + 1));
    [cloned[i], cloned[randomIndex]] = [cloned[randomIndex], cloned[i]];
  }
  return cloned;
};

const normalizeSentenceValue = (sentence: string) => {
  return sentence
    .replace(/\s+/g, ' ')
    .replace(/[.,!?;:]/g, '')
    .trim()
    .toLowerCase();
};

const validateSentenceBuilderAnswer = (
  selectedTiles: SentenceBuilderTile[],
  correctSentence: string
) => {
  const selectedSentence = normalizeSentenceValue(selectedTiles.map((tile) => tile.word).join(' '));
  const normalizedCorrect = normalizeSentenceValue(correctSentence);

  return {
    selectedSentence,
    normalizedCorrect,
    isCorrect: selectedSentence === normalizedCorrect
  };
};

const parseSentenceBuilderProgress = (
  rawValue: string | null
): SentenceBuilderProgressState | null => {
  if (!rawValue) return null;

  try {
    const parsed = JSON.parse(rawValue) as SentenceBuilderProgressState;
    if (
      !parsed ||
      !Number.isFinite(parsed.xp) ||
      !Number.isFinite(parsed.coins) ||
      !Number.isFinite(parsed.streak) ||
      !Number.isFinite(parsed.combo) ||
      !Number.isFinite(parsed.bestCombo) ||
      !Number.isFinite(parsed.highestUnlockedLevel) ||
      !Array.isArray(parsed.masteredLevelIds)
    ) {
      return null;
    }

    return {
      xp: Math.max(0, Math.round(parsed.xp)),
      coins: Math.max(0, Math.round(parsed.coins)),
      streak: Math.max(0, Math.round(parsed.streak)),
      combo: Math.max(0, Math.round(parsed.combo)),
      bestCombo: Math.max(0, Math.round(parsed.bestCombo)),
      highestUnlockedLevel: Math.max(0, Math.round(parsed.highestUnlockedLevel)),
      masteredLevelIds: parsed.masteredLevelIds.filter((id) => typeof id === 'string')
    };
  } catch {
    return null;
  }
};

const getLocalDateStamp = (date = new Date()) => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getPreviousDateStamp = (dateStamp: string) => {
  const [year, month, day] = dateStamp.split('-').map((value) => Number(value));
  if (!year || !month || !day) return null;

  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() - 1);
  return getLocalDateStamp(date);
};

const createDefaultLearningEconomy = (): LearningEconomyState => {
  const today = getLocalDateStamp();

  return {
    hearts: MAX_HEARTS,
    gems: 0,
    streakDays: 0,
    lastStudyDate: null,
    totalXp: 0,
    dailyQuestDate: today,
    dailyQuestTargetXp: DAILY_QUEST_TARGET_XP,
    dailyQuestEarnedXp: 0,
    dailyQuestCompleted: false
  };
};

const parseLearningEconomy = (rawValue: string | null): LearningEconomyState | null => {
  if (!rawValue) return null;

  try {
    const parsed = JSON.parse(rawValue) as Partial<LearningEconomyState>;
    const heartsValue = Number(parsed?.hearts);
    const gemsValue = Number(parsed?.gems);
    const streakDaysValue = Number(parsed?.streakDays);
    const totalXpValue = Number(parsed?.totalXp);
    const dailyQuestTargetXpValue = Number(parsed?.dailyQuestTargetXp);
    const dailyQuestEarnedXpValue = Number(parsed?.dailyQuestEarnedXp);

    if (
      !parsed ||
      !Number.isFinite(heartsValue) ||
      !Number.isFinite(gemsValue) ||
      !Number.isFinite(streakDaysValue) ||
      !Number.isFinite(totalXpValue) ||
      !Number.isFinite(dailyQuestTargetXpValue) ||
      !Number.isFinite(dailyQuestEarnedXpValue) ||
      typeof parsed.dailyQuestCompleted !== 'boolean'
    ) {
      return null;
    }

    return {
      hearts: Math.max(0, Math.min(MAX_HEARTS, Math.round(heartsValue))),
      gems: Math.max(0, Math.round(gemsValue)),
      streakDays: Math.max(0, Math.round(streakDaysValue)),
      lastStudyDate: typeof parsed.lastStudyDate === 'string' ? parsed.lastStudyDate : null,
      totalXp: Math.max(0, Math.round(totalXpValue)),
      dailyQuestDate: typeof parsed.dailyQuestDate === 'string' ? parsed.dailyQuestDate : null,
      dailyQuestTargetXp: Math.max(1, Math.round(dailyQuestTargetXpValue)),
      dailyQuestEarnedXp: Math.max(0, Math.round(dailyQuestEarnedXpValue)),
      dailyQuestCompleted: parsed.dailyQuestCompleted
    };
  } catch {
    return null;
  }
};

const normalizeLearningEconomyForToday = (
  economy: LearningEconomyState
): LearningEconomyState => {
  const today = getLocalDateStamp();
  const yesterday = getPreviousDateStamp(today);
  const isStreakActive =
    economy.lastStudyDate === today ||
    (!!yesterday && economy.lastStudyDate === yesterday);
  const normalizedStreakDays = isStreakActive ? Math.max(0, economy.streakDays) : 0;

  if (economy.dailyQuestDate === today) {
    return {
      ...economy,
      streakDays: normalizedStreakDays,
      dailyQuestTargetXp: Math.max(1, economy.dailyQuestTargetXp)
    };
  }

  return {
    ...economy,
    hearts: MAX_HEARTS,
    streakDays: normalizedStreakDays,
    dailyQuestDate: today,
    dailyQuestTargetXp: DAILY_QUEST_TARGET_XP,
    dailyQuestEarnedXp: 0,
    dailyQuestCompleted: false
  };
};

const buildStreakWeekStatus = (streakDays: number, weekWindow = 5) => {
  const activeDays = Math.max(0, Math.min(weekWindow, streakDays));
  return Array.from({ length: weekWindow }, (_, index) => index < activeDays);
};

const getModuleXpReward = (summary: QuizScoreSummary) => {
  return Math.max(10, summary.correctAnswers * 3 + 3);
};

const FLASHCARD_FIELD_LABELS: Record<FlashcardField, string> = {
  concept: 'Khái niệm',
  definition: 'Định nghĩa',
  application: 'Ví dụ ứng dụng',
  promptHint: 'Prompt gợi ý'
};

const FLASHCARD_DATASET: FlashcardSourceRow[] = [
  {
    id: 'fc-1',
    concept: 'Narrow AI',
    definition: 'AI hẹp chỉ tối ưu cho một nhiệm vụ cụ thể, không có khả năng suy luận đa lĩnh vực như con người.',
    application: 'Hệ thống gợi ý phim học từ lịch sử xem để đề xuất nội dung phù hợp.',
    promptHint: 'So sánh Narrow AI và General AI trong bảng 3 tiêu chí: phạm vi, điểm mạnh, giới hạn.'
  },
  {
    id: 'fc-2',
    concept: 'General AI',
    definition: 'AI tổng quát là mục tiêu nghiên cứu với khả năng hiểu và giải quyết đa dạng vấn đề ở mức gần con người.',
    application: 'Một trợ lý có thể học nhiều môn khác nhau và tự chuyển đổi chiến lược giải bài.',
    promptHint: 'Giải thích vì sao General AI chưa phổ biến trong thực tế và nêu 2 thách thức kỹ thuật.'
  },
  {
    id: 'fc-3',
    concept: 'Prompt 4 phần',
    definition: 'Prompt chất lượng nên có: mục tiêu, bối cảnh, định dạng đầu ra và tiêu chí kiểm tra.',
    application: 'Yêu cầu AI tạo kế hoạch học 7 ngày có checklist từng ngày và điều kiện đánh giá hoàn thành.',
    promptHint: 'Viết một prompt đủ 4 phần để tóm tắt tài liệu thành 5 ý chính.'
  },
  {
    id: 'fc-4',
    concept: 'Fact-check',
    definition: 'Kiểm chứng thông tin là bước đối chiếu phản hồi AI với ít nhất 2 nguồn đáng tin trước khi sử dụng.',
    application: 'Đối chiếu số liệu AI trả về với tài liệu chính thức hoặc nguồn học thuật.',
    promptHint: 'Tạo checklist 5 bước fact-check cho câu trả lời của AI về một chủ đề học thuật.'
  },
  {
    id: 'fc-5',
    concept: 'Human-in-the-loop',
    definition: 'Con người giữ vai trò giám sát, chỉnh sửa và quyết định cuối cùng thay vì giao toàn bộ cho AI.',
    application: 'Sinh viên tự giải bài trước, sau đó dùng AI để so sánh và phát hiện điểm chưa chắc.',
    promptHint: 'Viết prompt yêu cầu AI phản biện lời giải của bạn mà không đưa đáp án ngay lập tức.'
  },
  {
    id: 'fc-6',
    concept: 'Bias trong AI',
    definition: 'Bias là thiên lệch dữ liệu hoặc mô hình khiến đầu ra không cân bằng hoặc thiếu công bằng.',
    application: 'Mô hình gợi ý học liệu thiên về một nhóm chủ đề do dữ liệu huấn luyện chưa đa dạng.',
    promptHint: 'Liệt kê 3 dấu hiệu cho thấy câu trả lời AI có thể bị bias và cách kiểm tra lại.'
  },
  {
    id: 'fc-7',
    concept: 'Workflow học với AI',
    definition: 'Quy trình học hiệu quả gồm đặt mục tiêu, hỏi AI có cấu trúc, tự luyện, rồi đánh giá và cải tiến.',
    application: 'Mỗi ngày dùng AI tạo 5 câu hỏi tự kiểm tra và ghi lại lỗi sai để ôn tập lại.',
    promptHint: 'Thiết kế workflow học 30 phút mỗi ngày với đầu vào, đầu ra và chỉ số theo dõi tiến bộ.'
  },
  {
    id: 'fc-8',
    concept: 'RAG (Retrieval-Augmented Generation)',
    definition: 'RAG kết hợp tìm kiếm tài liệu liên quan trước khi sinh câu trả lời để tăng độ chính xác và bám nguồn.',
    application: 'Chatbot nội bộ truy xuất tài liệu khóa học rồi mới trả lời câu hỏi của học viên.',
    promptHint: 'Giải thích RAG cho người mới bắt đầu bằng ví dụ thư viện tài liệu môn học.'
  }
];

const buildSentenceTranslationOptions = (levelIndex: number) => {
  const currentLevel = SENTENCE_BUILDER_LEVELS[levelIndex];
  if (!currentLevel) return [];

  const distractors = SENTENCE_BUILDER_LEVELS.filter((_, index) => index !== levelIndex)
    .map((level) => level.translation)
    .filter((translation) => translation !== currentLevel.translation);

  return shuffleArray([
    currentLevel.translation,
    ...shuffleArray(distractors).slice(0, Math.min(3, distractors.length))
  ]);
};

const buildSentenceMatchPairs = (levelIndex: number): SentenceMatchPair[] => {
  if (FLASHCARD_DATASET.length === 0) return [];

  const normalizedIndex =
    ((levelIndex % FLASHCARD_DATASET.length) + FLASHCARD_DATASET.length) %
    FLASHCARD_DATASET.length;
  const rotatedRows = [
    ...FLASHCARD_DATASET.slice(normalizedIndex),
    ...FLASHCARD_DATASET.slice(0, normalizedIndex)
  ];

  return rotatedRows
    .slice(0, Math.min(4, rotatedRows.length))
    .map((row) => ({
      id: row.id,
      concept: row.concept,
      definition: row.definition
    }));
};

const FLASHCARD_PRESETS: FlashcardPreset[] = [
  {
    id: 'all',
    name: 'ALL',
    description: 'REVEAL: Định nghĩa • ASK: Khái niệm + Ví dụ ứng dụng + Prompt gợi ý',
    revealField: 'definition',
    askFields: ['concept', 'application', 'promptHint']
  },
  {
    id: 'concept',
    name: 'CONCEPT',
    description: 'REVEAL: Định nghĩa • ASK: Khái niệm',
    revealField: 'definition',
    askFields: ['concept']
  },
  {
    id: 'application',
    name: 'APPLICATION',
    description: 'REVEAL: Khái niệm • ASK: Ví dụ ứng dụng',
    revealField: 'concept',
    askFields: ['application']
  },
  {
    id: 'prompt',
    name: 'PROMPT',
    description: 'REVEAL: Khái niệm • ASK: Prompt gợi ý',
    revealField: 'concept',
    askFields: ['promptHint']
  }
];

const buildFlashcardCards = (preset: FlashcardPreset): FlashcardCard[] => {
  return FLASHCARD_DATASET.flatMap((row) =>
    preset.askFields
      .filter((askField) => row[askField] && row[preset.revealField])
      .map((askField) => ({
        id: `${row.id}-${preset.id}-${askField}`,
        sourceId: row.id,
        askField,
        askLabel: FLASHCARD_FIELD_LABELS[askField],
        askValue: row[askField],
        revealField: preset.revealField,
        revealLabel: FLASHCARD_FIELD_LABELS[preset.revealField],
        revealValue: row[preset.revealField]
      }))
  );
};

type CurriculumLessonBlueprint = {
  id: string;
  title: string;
  duration: string;
  style: string;
  goal: string;
  example?: string;
  isFlashcard?: boolean;
  isSentenceBuilder?: boolean;
  isQuiz?: boolean;
};

type CurriculumSectionBlueprint = {
  id: string;
  title: string;
  duration: string;
  lessons: CurriculumLessonBlueprint[];
};

const CURRICULUM_SECTIONS_BLUEPRINT: CurriculumSectionBlueprint[] = [
  {
    id: 'learn',
    title: 'I. HỌC MỚI (LEARN)',
    duration: '5 nội dung',
    lessons: [
      {
        id: 'learn-flashcard',
        title: 'Flashcard Learning',
        duration: 'Từ vựng mới',
        style: 'Mặt trước: từ vựng • Mặt sau: nghĩa + ví dụ + phát âm',
        goal: 'Ghi nhớ từ mới',
        example: '"water" -> "nước", ví dụ: I drink water every day.',
        isFlashcard: true
      },
      {
        id: 'learn-image-vocabulary',
        title: 'Image Vocabulary',
        duration: 'Visual memory',
        style: 'Nhìn hình đoán từ',
        goal: 'Học bằng visual memory',
        example: 'Hình quả táo -> apple'
      },
      {
        id: 'learn-listening-introduction',
        title: 'Listening Introduction',
        duration: 'Nghe phát âm',
        style: 'Nghe phát âm từ mới',
        goal: 'Nghe + phát âm chuẩn',
        example: 'Nghe từ "water" và nhắc lại theo nhịp chậm -> nhanh.'
      },
      {
        id: 'learn-story-learning',
        title: 'Story Learning',
        duration: 'Ngữ cảnh',
        style: 'Học qua hội thoại / câu chuyện',
        goal: 'Học ngữ cảnh thật',
        example: 'A: Can I have water? B: Sure, here you are.'
      },
      {
        id: 'learn-grammar-explanation',
        title: 'Grammar Explanation',
        duration: 'Grammar note',
        style: 'Giải thích ngữ pháp ngắn gọn',
        goal: 'Hiểu rule trước khi luyện',
        example: 'Mẫu "Can I have ...?" dùng để xin lịch sự.'
      }
    ]
  },
  {
    id: 'review',
    title: 'II. ÔN TẬP (REVIEW)',
    duration: '5 nội dung',
    lessons: [
      {
        id: 'review-srs',
        title: 'SRS Review',
        duration: 'Quan trọng nhất',
        style: 'Spaced Repetition System, từ sắp quên sẽ xuất hiện lại',
        goal: 'Ghi nhớ dài hạn',
        example: 'Lịch ôn 1 ngày -> 3 ngày -> 7 ngày cho cùng một từ.',
        isFlashcard: true
      },
      {
        id: 'review-weak-words',
        title: 'Weak Words Review',
        duration: 'Ôn từ sai',
        style: 'Ôn lại các từ từng làm sai',
        goal: 'Vá lỗ hổng kiến thức',
        example: 'Tạo bộ riêng gồm các từ bị sai trên 2 lần.'
      },
      {
        id: 'review-daily-review',
        title: 'Daily Review',
        duration: 'Hằng ngày',
        style: 'Bài ôn hằng ngày',
        goal: 'Duy trì streak',
        example: 'Mỗi ngày hoàn thành 5-10 phút ôn tập.'
      },
      {
        id: 'review-speed-review',
        title: 'Speed Review',
        duration: 'Thời gian ngắn',
        style: 'Ôn nhanh trong thời gian ngắn',
        goal: 'Phản xạ nhanh',
        example: 'Trả lời nhanh trong 60 giây cho mỗi cụm từ.'
      },
      {
        id: 'review-mistake-notebook',
        title: 'Mistake Notebook',
        duration: 'Sổ lỗi sai',
        style: 'Lưu lại lỗi sai',
        goal: 'Học từ lỗi sai',
        example: 'Ghi lỗi sai + đáp án đúng + lý do sai cho từng lần nhầm.'
      }
    ]
  },
  {
    id: 'assessment',
    title: 'III. QUIZ / KIỂM TRA (ASSESSMENT)',
    duration: '10 nội dung',
    lessons: [
      {
        id: 'assessment-multiple-choice',
        title: 'Multiple Choice',
        duration: 'Quiz cơ bản',
        style: 'Chọn đáp án đúng',
        goal: 'Đo mức hiểu nhanh theo dạng trắc nghiệm',
        example: '"nước" là gì?',
        isQuiz: true
      },
      {
        id: 'assessment-match-pairs',
        title: 'Match Pairs',
        duration: 'Ghép cặp',
        style: 'Ghép từ với nghĩa',
        goal: 'Kiểm tra khả năng nối đúng khái niệm',
        example: 'water -> nước',
        isQuiz: true
      },
      {
        id: 'assessment-arrange-sentence',
        title: 'Arrange Sentence',
        duration: 'Sắp xếp câu',
        style: 'Sắp xếp từ thành câu đúng',
        goal: 'Kiểm tra ngữ pháp và trật tự câu',
        example: 'I / drink / water / every day -> I drink water every day.',
        isSentenceBuilder: true
      },
      {
        id: 'assessment-fill-blank',
        title: 'Fill in the Blank',
        duration: 'Điền khuyết',
        style: 'Điền từ còn thiếu',
        goal: 'Kiểm tra khả năng nhớ từ theo ngữ cảnh',
        isQuiz: true
      },
      {
        id: 'assessment-translation-quiz',
        title: 'Translation Quiz',
        duration: 'Dịch',
        style: 'Dịch Việt -> Anh hoặc Anh -> Việt',
        goal: 'Đo năng lực chuyển đổi ngôn ngữ',
        example: 'nước -> water hoặc water -> nước',
        isQuiz: true
      },
      {
        id: 'assessment-listening-quiz',
        title: 'Listening Quiz',
        duration: 'Nghe chọn đáp án',
        style: 'Nghe và chọn đáp án',
        goal: 'Đánh giá khả năng nghe hiểu',
        isQuiz: true
      },
      {
        id: 'assessment-speaking-quiz',
        title: 'Speaking Quiz',
        duration: 'Nói',
        style: 'Đọc bằng giọng nói',
        goal: 'Đánh giá phát âm và độ rõ ràng',
        isQuiz: true
      },
      {
        id: 'assessment-image-quiz',
        title: 'Image Quiz',
        duration: 'Hình ảnh',
        style: 'Chọn hình đúng',
        goal: 'Đánh giá khả năng nhận diện nghĩa qua hình ảnh',
        isQuiz: true
      },
      {
        id: 'assessment-true-false',
        title: 'True / False',
        duration: 'Đúng / sai',
        style: 'Chọn đúng hoặc sai',
        goal: 'Kiểm tra phản xạ nhận định nhanh',
        isQuiz: true
      },
      {
        id: 'assessment-ordering-quiz',
        title: 'Ordering Quiz',
        duration: 'Sắp thứ tự',
        style: 'Sắp xếp thứ tự đúng',
        goal: 'Kiểm tra tư duy logic trình tự',
        isQuiz: true
      }
    ]
  }
];

const buildCurriculumDocumentLesson = (
  sectionTitle: string,
  lesson: CurriculumLessonBlueprint
): DocumentLesson => {
  const deliveryNote = lesson.isFlashcard
    ? 'Bài này dùng giao diện Flashcard tương tác hiện tại.'
    : lesson.isSentenceBuilder
    ? 'Bài này dùng giao diện Sentence Builder để luyện phản xạ câu.'
    : lesson.isQuiz
    ? 'Bài này dùng giao diện Quiz để chấm điểm và theo dõi kết quả.'
    : 'Bài này là phần định hướng kiến thức trước khi luyện thực hành.';

  const exampleText = lesson.example
    ? `Ví dụ: ${lesson.example}`
    : 'Ví dụ: Tự tạo thêm một tình huống tương tự theo bài học này.';

  const practiceTasks = [
    `Tóm tắt kiểu học: ${lesson.style}.`,
    `Mục tiêu cần đạt: ${lesson.goal}.`,
    lesson.isFlashcard || lesson.isSentenceBuilder || lesson.isQuiz
      ? 'Mở phần thực hành tương ứng và hoàn thành ít nhất 1 lượt.'
      : 'Viết 3 từ khóa quan trọng và tự tạo 1 ví dụ áp dụng.'
  ];

  return {
    title: `${sectionTitle} • ${lesson.title}`,
    fileName: `learning-${lesson.id}`,
    readingTime: lesson.isFlashcard || lesson.isSentenceBuilder || lesson.isQuiz ? '5 phút' : '4 phút',
    pages: 3,
    overview: `${lesson.title} thuộc ${sectionTitle}. Phần này tập trung vào ${lesson.style} để đạt mục tiêu ${lesson.goal.toLowerCase()}.`,
    objectives: [`Kiểu: ${lesson.style}`, `Mục tiêu: ${lesson.goal}`, exampleText],
    sections: [
      {
        heading: '1) Cách học',
        content: lesson.style
      },
      {
        heading: '2) Mục tiêu',
        content: lesson.goal
      },
      {
        heading: '3) Triển khai trong module',
        content: deliveryNote
      }
    ],
    practiceTasks
  };
};

const EMPTY_DOCUMENT_LESSON: DocumentLesson = {
  title: 'Nội dung bài học',
  fileName: 'learning-overview',
  readingTime: '3 phút',
  pages: 1,
  overview: 'Nội dung đang được cập nhật.',
  objectives: ['Nắm mục tiêu bài học', 'Hoàn thành phần luyện tập'],
  sections: [
    {
      heading: '1) Trạng thái',
      content: 'Bài học chưa có dữ liệu chi tiết.'
    }
  ],
  practiceTasks: ['Tiếp tục sang bài kế tiếp để hoàn thành lộ trình.']
};

const DOCUMENT_LIBRARY: Record<string, DocumentLesson> = CURRICULUM_SECTIONS_BLUEPRINT.reduce(
  (library, section) => {
    section.lessons.forEach((lesson) => {
      library[lesson.id] = buildCurriculumDocumentLesson(section.title, lesson);
    });
    return library;
  },
  {} as Record<string, DocumentLesson>
);

const firstCurriculumLessonId = CURRICULUM_SECTIONS_BLUEPRINT[0]?.lessons[0]?.id ?? '';
const DEFAULT_DOCUMENT_LESSON = DOCUMENT_LIBRARY[firstCurriculumLessonId] ?? EMPTY_DOCUMENT_LESSON;

const BASE_SECTIONS: Section[] = (() => {
  let lessonOrder = 1;

  return CURRICULUM_SECTIONS_BLUEPRINT.map((section) => {
    const lessons = section.lessons.map((lesson) => ({
      id: lesson.id,
      number: `${lessonOrder++}`,
      title: lesson.title,
      duration: lesson.duration,
      isDownloadable: !lesson.isFlashcard && !lesson.isSentenceBuilder && !lesson.isQuiz,
      isFlashcard: lesson.isFlashcard,
      isSentenceBuilder: lesson.isSentenceBuilder,
      isQuiz: lesson.isQuiz
    }));

    return {
      id: section.id,
      title: section.title,
      lessonCount: lessons.length,
      duration: section.duration,
      lessons
    };
  });
})();

const buildSectionsForLessonCount = (lessonCount: number): Section[] => {
  const safeLessonCount = Math.max(1, lessonCount);
  let remainingLessons = safeLessonCount;

  const nextSections: Section[] = [];

  BASE_SECTIONS.forEach((section) => {
    if (remainingLessons <= 0) return;

    const sectionLessons = section.lessons.slice(0, remainingLessons);
    if (sectionLessons.length === 0) return;

    nextSections.push({
      ...section,
      lessonCount: sectionLessons.length,
      lessons: sectionLessons
    });

    remainingLessons -= sectionLessons.length;
  });

  return nextSections.length > 0 ? nextSections : [BASE_SECTIONS[0]].filter(Boolean) as Section[];
};

const getLessonType = (lesson: Lesson): LessonType => {
  if (lesson.isQuiz) return 'quiz';
  if (lesson.isSentenceBuilder) return 'sentence-builder';
  if (lesson.isFlashcard) return 'flashcard';
  return 'document';
};

const parseLeaderboard = (rawValue: string | null): QuizLeaderboardEntry[] => {
  if (!rawValue) return [];

  try {
    const parsed = JSON.parse(rawValue) as QuizLeaderboardEntry[];
    if (!Array.isArray(parsed)) return [];

    return parsed.filter(
      (entry) =>
        typeof entry.id === 'string' &&
        typeof entry.playerName === 'string' &&
        Number.isFinite(entry.scorePercent) &&
        Number.isFinite(entry.scorePoints) &&
        Number.isFinite(entry.correctAnswers) &&
        Number.isFinite(entry.totalQuestions) &&
        Number.isFinite(entry.completionSeconds) &&
        Number.isFinite(entry.completedAt)
    );
  } catch {
    return [];
  }
};

const sortLeaderboard = (entries: QuizLeaderboardEntry[]) => {
  return [...entries].sort((a, b) => {
    if (b.scorePercent !== a.scorePercent) return b.scorePercent - a.scorePercent;
    if (b.scorePoints !== a.scorePoints) return b.scorePoints - a.scorePoints;
    if (a.completionSeconds !== b.completionSeconds) return a.completionSeconds - b.completionSeconds;
    return b.completedAt - a.completedAt;
  });
};

const normalizeQuizPlayerName = (name: string) => {
  return name.trim().toLowerCase();
};

const getLatestQuizEntry = (entries: QuizLeaderboardEntry[]) => {
  if (entries.length === 0) return null;

  return [...entries].sort((a, b) => b.completedAt - a.completedAt)[0] ?? null;
};

const isAnswerCorrect = (question: QuizQuestion, userAnswer: string | string[] | undefined) => {
  if (question.type === 'multiple-select' || question.type === 'match-pairs') {
    const correctAnswers = question.correctAnswer as string[];
    const userAnswers = (userAnswer as string[] | undefined) || [];

    return (
      correctAnswers.length === userAnswers.length &&
      correctAnswers.every((answer) => userAnswers.includes(answer))
    );
  }

  if (!userAnswer) return false;

  if (question.type === 'fill-blank') {
    return (
      normalizeSentenceValue(userAnswer.toString()) ===
      normalizeSentenceValue(question.correctAnswer.toString())
    );
  }

  return (
    userAnswer.toString().toLowerCase().trim() === question.correctAnswer.toString().toLowerCase().trim()
  );
};

const isQuizAnswerProvided = (question: QuizQuestion, answer: string | string[] | undefined) => {
  if (!answer) return false;

  if (question.type === 'match-pairs') {
    const requiredPairs = question.matchPairs?.length ?? 0;
    const userPairs = parseQuizMatchPairAnswers(Array.isArray(answer) ? answer : []);
    return requiredPairs > 0 && userPairs.length >= requiredPairs;
  }

  if (Array.isArray(answer)) return answer.length > 0;
  return answer.trim().length > 0;
};

const getQuizLessonConfig = (lessonId: string): QuizLessonConfig => {
  return QUIZ_LESSON_CONFIGS[lessonId] ?? DEFAULT_QUIZ_LESSON_CONFIG;
};

const getScoreSummary = (
  answers: Record<string, string | string[]>,
  questions: QuizQuestion[]
): QuizScoreSummary => {
  const totalQuestions = questions.length;
  const correctAnswers = questions.reduce((total, question) => {
    return total + (isAnswerCorrect(question, answers[question.id]) ? 1 : 0);
  }, 0);

  const scorePercent = totalQuestions === 0 ? 0 : Math.round((correctAnswers / totalQuestions) * 100);

  return {
    correctAnswers,
    totalQuestions,
    scorePercent,
    scorePoints: scorePercent
  };
};

const formatDuration = (seconds: number) => {
  const safeSeconds = Math.max(0, seconds);
  const minutes = Math.floor(safeSeconds / 60);
  const remainSeconds = safeSeconds % 60;
  return `${minutes}:${remainSeconds.toString().padStart(2, '0')}`;
};

const formatCompletedAt = (timestamp: number) => {
  return new Date(timestamp).toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export default function LearningModulePanel({
  visible,
  onClose,
  onCompleteModule,
  selectedCourseId,
  selectedModuleId
}: Props) {
  const { user } = useAuth();
  const selectedCourse = STUDENT_LEARNING_COURSES.find((course) => course.id === selectedCourseId) ?? null;
  const maxBaseLessons = BASE_SECTIONS.reduce((total, section) => total + section.lessons.length, 0);
  const syncedLessonCount = selectedCourse
    ? Math.max(1, Math.min(maxBaseLessons, selectedCourse.moduleCount))
    : maxBaseLessons;
  const activeSections = useMemo(
    () => buildSectionsForLessonCount(syncedLessonCount),
    [syncedLessonCount]
  );
  const lessons: Lesson[] = activeSections.flatMap((section) => section.lessons);
  const totalSteps = lessons.length;

  const accountDisplayName =
    user?.fullName ||
    user?.full_name ||
    user?.name ||
    user?.username ||
    user?.email?.split?.('@')?.[0] ||
    'Learner';

  const [currentStep, setCurrentStep] = useState(1);
  const [expandedSections, setExpandedSections] = useState<string[]>(() => [activeSections[0]?.id ?? 'learn']);
  const [currentLessonType, setCurrentLessonType] = useState<LessonType>(() => getLessonType(lessons[0]));
  const [playerName, setPlayerName] = useState('Learner');
  const [leaderboardEntries, setLeaderboardEntries] = useState<QuizLeaderboardEntry[]>([]);
  const [isQuizStarted, setIsQuizStarted] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, string | string[]>>({});
  const [isQuizSubmitted, setIsQuizSubmitted] = useState(false);
  const [quizStartedAt, setQuizStartedAt] = useState<number | null>(null);
  const [quizDurationSeconds, setQuizDurationSeconds] = useState(0);
  const [quizResultViewMode, setQuizResultViewMode] = useState<QuizResultViewMode>('summary');
  const [quizAudioStatus, setQuizAudioStatus] = useState<string | null>(null);
  const [quizPendingMatchLeft, setQuizPendingMatchLeft] = useState<string | null>(null);
  const [quizFillBlankHintUses, setQuizFillBlankHintUses] = useState(0);
  const [quizFillBlankHints, setQuizFillBlankHints] = useState<Record<string, string>>({});
  const [shareFeedback, setShareFeedback] = useState<string | null>(null);
  const [selectedFlashcardPresetId, setSelectedFlashcardPresetId] = useState(
    FLASHCARD_PRESETS[0]?.id ?? 'all'
  );
  const [isFlashcardStarted, setIsFlashcardStarted] = useState(false);
  const [isFlashcardCompleted, setIsFlashcardCompleted] = useState(false);
  const [flashcardSessionCards, setFlashcardSessionCards] = useState<FlashcardCard[]>([]);
  const [flashcardCursor, setFlashcardCursor] = useState(0);
  const [isFlashcardRevealed, setIsFlashcardRevealed] = useState(false);
  const [flashcardFeedback, setFlashcardFeedback] = useState<string | null>(null);
  const [isFlashcardLoading, setIsFlashcardLoading] = useState(false);
  const [flashcardError, setFlashcardError] = useState<string | null>(null);
  const [flashcardTouchStartX, setFlashcardTouchStartX] = useState<number | null>(null);
  const [flashcardTouchCurrentX, setFlashcardTouchCurrentX] = useState<number | null>(null);
  const [flashcardAutoSpeakEnabled, setFlashcardAutoSpeakEnabled] = useState(false);
  const [flashcardListeningModeEnabled, setFlashcardListeningModeEnabled] = useState(false);
  const [flashcardAudioStatus, setFlashcardAudioStatus] = useState<string | null>(null);
  const [isFlashcardGuideVisible, setIsFlashcardGuideVisible] = useState(false);
  const [learningEconomy, setLearningEconomy] = useState<LearningEconomyState>(() => {
    try {
      const parsed = parseLearningEconomy(localStorage.getItem(LEARNING_ECONOMY_STORAGE_KEY));
      return normalizeLearningEconomyForToday(parsed ?? createDefaultLearningEconomy());
    } catch {
      return createDefaultLearningEconomy();
    }
  });
  const [completionFlowVisible, setCompletionFlowVisible] = useState(false);
  const [completionFlowStep, setCompletionFlowStep] = useState<CompletionFlowStep>('summary');
  const [completionFlowSnapshot, setCompletionFlowSnapshot] =
    useState<CompletionFlowSnapshot | null>(null);
  const [completionRewardsCommitted, setCompletionRewardsCommitted] = useState(false);
  const defaultSentenceProgressState: SentenceBuilderProgressState = {
    xp: 0,
    coins: 0,
    streak: 0,
    combo: 0,
    bestCombo: 0,
    highestUnlockedLevel: 0,
    masteredLevelIds: []
  };
  const [sentenceProgress, setSentenceProgress] = useState<SentenceBuilderProgressState>(() => {
    try {
      const parsed = parseSentenceBuilderProgress(
        localStorage.getItem(SENTENCE_BUILDER_PROGRESS_STORAGE_KEY)
      );

      if (!parsed) return defaultSentenceProgressState;

      const maxLevelIndex = Math.max(0, SENTENCE_BUILDER_LEVELS.length - 1);

      return {
        ...defaultSentenceProgressState,
        ...parsed,
        highestUnlockedLevel: Math.min(parsed.highestUnlockedLevel, maxLevelIndex),
        masteredLevelIds: parsed.masteredLevelIds.filter((id) =>
          SENTENCE_BUILDER_LEVELS.some((level) => level.id === id)
        )
      };
    } catch {
      return defaultSentenceProgressState;
    }
  });
  const initialSentenceLevel = SENTENCE_BUILDER_LEVELS[0];
  const initialSentenceTranslationOptions = buildSentenceTranslationOptions(0);
  const initialSentenceMatchPairs = buildSentenceMatchPairs(0);
  const [sentenceMode, setSentenceMode] = useState<SentenceBuilderMode>('click');
  const [sentenceCurrentLevelIndex, setSentenceCurrentLevelIndex] = useState(0);
  const [sentenceRetryQueue, setSentenceRetryQueue] = useState<number[]>([]);
  const [sentenceBankTiles, setSentenceBankTiles] = useState<SentenceBuilderTile[]>(() => {
    if (!initialSentenceLevel) return [];
    return shuffleSentenceTiles(buildSentenceWordTiles(initialSentenceLevel.correctSentence));
  });
  const [sentenceAnswerTiles, setSentenceAnswerTiles] = useState<SentenceBuilderTile[]>([]);
  const [sentenceSelectedTileId, setSentenceSelectedTileId] = useState<string | null>(null);
  const [sentenceHintTileId, setSentenceHintTileId] = useState<string | null>(null);
  const [sentenceFeedbackState, setSentenceFeedbackState] =
    useState<SentenceBuilderFeedbackState>('idle');
  const [sentenceFeedbackText, setSentenceFeedbackText] = useState<string | null>(null);
  const [sentenceWrongIndices, setSentenceWrongIndices] = useState<number[]>([]);
  const [sentenceShowCorrectAnswer, setSentenceShowCorrectAnswer] = useState(false);
  const [sentenceSubmittedCount, setSentenceSubmittedCount] = useState(0);
  const [sentenceCorrectCount, setSentenceCorrectCount] = useState(0);
  const [sentenceSessionCompleted, setSentenceSessionCompleted] = useState(false);
  const [sentenceTimerEnabled, setSentenceTimerEnabled] = useState(true);
  const [sentenceTimeLeft, setSentenceTimeLeft] = useState(initialSentenceLevel?.timeLimitSeconds ?? 45);
  const [sentenceDragTileId, setSentenceDragTileId] = useState<string | null>(null);
  const [sentenceAudioStatus, setSentenceAudioStatus] = useState<string | null>(null);
  const [sentenceShowTools, setSentenceShowTools] = useState(false);
  const [sentencePracticeMode, setSentencePracticeMode] = useState<SentencePracticeMode>('builder');
  const [sentenceBonusClaims, setSentenceBonusClaims] = useState<Record<string, boolean>>({});
  const [sentenceListenInput, setSentenceListenInput] = useState('');
  const [sentenceListenStatus, setSentenceListenStatus] = useState<string | null>(null);
  const [sentenceTranslateOptions, setSentenceTranslateOptions] = useState<string[]>(
    initialSentenceTranslationOptions
  );
  const [sentenceTranslateSelection, setSentenceTranslateSelection] = useState<string | null>(null);
  const [sentenceTranslateStatus, setSentenceTranslateStatus] = useState<string | null>(null);
  const [sentenceMatchPairs, setSentenceMatchPairs] = useState<SentenceMatchPair[]>(
    initialSentenceMatchPairs
  );
  const [sentenceMatchShuffledDefinitions, setSentenceMatchShuffledDefinitions] = useState<string[]>(
    shuffleArray(initialSentenceMatchPairs.map((pair) => pair.definition))
  );
  const [sentenceMatchSelectedConcept, setSentenceMatchSelectedConcept] = useState<string | null>(
    null
  );
  const [sentenceMatchSelectedDefinition, setSentenceMatchSelectedDefinition] = useState<
    string | null
  >(null);
  const [sentenceMatchSolvedConcepts, setSentenceMatchSolvedConcepts] = useState<string[]>([]);
  const [sentenceMatchStatus, setSentenceMatchStatus] = useState<string | null>(null);

  const currentLesson = lessons[currentStep - 1] ?? lessons[0];
  const activeQuizConfig = getQuizLessonConfig(currentLesson.id);
  const activeQuizQuestions = activeQuizConfig.questions;
  const activeQuizFillBlankQuestionsCount = activeQuizQuestions.filter(
    (question) => question.type === 'fill-blank'
  ).length;
  const quizFillBlankHintLimit = getQuizFillBlankHintLimit(activeQuizFillBlankQuestionsCount);
  const quizFillBlankHintsRemaining = Math.max(0, quizFillBlankHintLimit - quizFillBlankHintUses);
  const quizLeaderboardStorageKey = getQuizLeaderboardStorageKey(activeQuizConfig.id);
  const currentDocument = DOCUMENT_LIBRARY[currentLesson.id] ?? DEFAULT_DOCUMENT_LESSON;
  const moduleProgressPercent = totalSteps ? Math.round((currentStep / totalSteps) * 100) : 0;
  const moduleProgressPercentSafe = Math.max(0, Math.min(100, moduleProgressPercent));
  const isModuleProgressCompleted = moduleProgressPercentSafe >= 100;
  const answeredCount = activeQuizQuestions.reduce((count, question) => {
    return count + (isQuizAnswerProvided(question, quizAnswers[question.id]) ? 1 : 0);
  }, 0);
  const scoreSummary = getScoreSummary(quizAnswers, activeQuizQuestions);
  const wrongAnswersCount = scoreSummary.totalQuestions - scoreSummary.correctAnswers;
  const selectedFlashcardPreset =
    FLASHCARD_PRESETS.find((preset) => preset.id === selectedFlashcardPresetId) ?? FLASHCARD_PRESETS[0];
  const flashcardDeck = selectedFlashcardPreset ? buildFlashcardCards(selectedFlashcardPreset) : [];
  const currentFlashcard = flashcardSessionCards[flashcardCursor] ?? null;
  const flashcardSessionTotal = flashcardSessionCards.length;
  const flashcardProgressPercent = flashcardSessionTotal
    ? Math.round(((flashcardCursor + 1) / flashcardSessionTotal) * 100)
    : 0;
  const flashcardReviewedCount = flashcardSessionTotal
    ? Math.min(flashcardCursor + 1, flashcardSessionTotal)
    : 0;
  const flashcardRemainingCount = Math.max(0, flashcardSessionTotal - flashcardReviewedCount);
  const flashcardSwipeOffset =
    flashcardTouchStartX !== null && flashcardTouchCurrentX !== null
      ? flashcardTouchCurrentX - flashcardTouchStartX
      : 0;
  const maxSentenceLevelIndex = Math.max(0, SENTENCE_BUILDER_LEVELS.length - 1);
  const sentenceHighestUnlockedLevel = Math.min(
    sentenceProgress.highestUnlockedLevel,
    maxSentenceLevelIndex
  );
  const sentenceCurrentLevel =
    SENTENCE_BUILDER_LEVELS[sentenceCurrentLevelIndex] ?? SENTENCE_BUILDER_LEVELS[0];
  const sentenceCurrentWords = sentenceCurrentLevel
    ? sentenceCurrentLevel.correctSentence
        .split(/\s+/)
        .map((word) => word.trim())
        .filter(Boolean)
    : [];
  const sentenceMasteredCount = sentenceProgress.masteredLevelIds.length;
  const sentenceAccuracyPercent = sentenceSubmittedCount
    ? Math.round((sentenceCorrectCount / sentenceSubmittedCount) * 100)
    : 0;
  const sentenceCanCheck =
    sentenceAnswerTiles.length > 0 && sentenceFeedbackState !== 'correct' && !sentenceSessionCompleted;
  const sentenceWrongIndexSet = new Set(sentenceWrongIndices);
  const sentenceCurrentLevelNumber = sentenceCurrentLevelIndex + 1;
  const sentenceLevelTrackPercent = SENTENCE_BUILDER_LEVELS.length
    ? Math.round((sentenceCurrentLevelNumber / SENTENCE_BUILDER_LEVELS.length) * 100)
    : 0;
  const sentenceMatchSolvedSet = new Set(sentenceMatchSolvedConcepts);
  const sentenceMatchCompleted =
    sentenceMatchPairs.length > 0 && sentenceMatchSolvedConcepts.length >= sentenceMatchPairs.length;
  const heartsRemaining = learningEconomy.hearts;
  const isOutOfHearts = heartsRemaining <= 0;
  const isFinalQuizLesson = currentLessonType === 'quiz' && currentStep === totalSteps;
  const quizLessonsInModule = lessons.filter((lesson) => lesson.isQuiz);
  const normalizedCurrentPlayerName = normalizeQuizPlayerName(
    playerName || accountDisplayName || 'Learner'
  );
  const quizModuleSummaryItems: QuizModuleSummaryItem[] =
    currentLessonType === 'quiz'
      ? quizLessonsInModule.map((lesson) => {
          const lessonQuizConfig = getQuizLessonConfig(lesson.id);
          const lessonEntries =
            lessonQuizConfig.id === activeQuizConfig.id
              ? leaderboardEntries
              : (() => {
                  try {
                    return sortLeaderboard(
                      parseLeaderboard(
                        localStorage.getItem(getQuizLeaderboardStorageKey(lessonQuizConfig.id))
                      )
                    );
                  } catch {
                    return [];
                  }
                })();

          const playerEntries = lessonEntries.filter(
            (entry) => normalizeQuizPlayerName(entry.playerName) === normalizedCurrentPlayerName
          );
          const sortedPlayerEntries = sortLeaderboard(playerEntries);

          return {
            lessonId: lesson.id,
            lessonNumber: lesson.number,
            lessonTitle: lesson.title,
            attempts: playerEntries.length,
            bestEntry: sortedPlayerEntries[0] ?? null,
            latestEntry: getLatestQuizEntry(playerEntries)
          };
        })
      : [];
  const quizModuleCompletedLessons = quizModuleSummaryItems.filter((item) => item.bestEntry).length;
  const quizModuleTotalAttempts = quizModuleSummaryItems.reduce(
    (total, item) => total + item.attempts,
    0
  );
  const quizModuleBestScore = quizModuleSummaryItems.reduce(
    (best, item) => Math.max(best, item.bestEntry?.scorePercent ?? 0),
    0
  );
  const quizModuleAverageBestScore = quizModuleCompletedLessons
    ? Math.round(
        quizModuleSummaryItems.reduce(
          (total, item) => total + (item.bestEntry?.scorePercent ?? 0),
          0
        ) / quizModuleCompletedLessons
      )
    : 0;
  const quizModuleLatestEntries = quizModuleSummaryItems
    .map((item) => item.latestEntry)
    .filter((entry): entry is QuizLeaderboardEntry => entry !== null);
  const quizModuleLatestCorrectAnswers = quizModuleLatestEntries.reduce(
    (total, entry) => total + entry.correctAnswers,
    0
  );
  const quizModuleLatestTotalQuestions = quizModuleLatestEntries.reduce(
    (total, entry) => total + entry.totalQuestions,
    0
  );
  const quizModuleLatestAccuracyPercent = quizModuleLatestTotalQuestions
    ? Math.round((quizModuleLatestCorrectAnswers / quizModuleLatestTotalQuestions) * 100)
    : 0;
  const completionPrimaryActionLabel = completionFlowStep === 'reward' ? 'Hoàn tất' : 'Tiếp tục';
  const completionDailyQuestPercent = completionFlowSnapshot
    ? Math.min(
        100,
        Math.round(
          (completionFlowSnapshot.dailyQuestEarnedXp /
            Math.max(1, completionFlowSnapshot.dailyQuestTargetXp)) *
            100
        )
      )
    : 0;

  useEffect(() => {
    const normalizedName = `${accountDisplayName}`.trim() || 'Learner';
    setPlayerName(normalizedName);
  }, [accountDisplayName]);

  useEffect(() => {
    if (!visible || currentLessonType !== 'quiz') return;

    try {
      const rawEntries = localStorage.getItem(quizLeaderboardStorageKey);
      setLeaderboardEntries(sortLeaderboard(parseLeaderboard(rawEntries)));
    } catch {
      setLeaderboardEntries([]);
    }
  }, [visible, currentLessonType, quizLeaderboardStorageKey]);

  useEffect(() => {
    if (!visible) return;

    try {
      const parsed = parseLearningEconomy(localStorage.getItem(LEARNING_ECONOMY_STORAGE_KEY));
      setLearningEconomy(normalizeLearningEconomyForToday(parsed ?? createDefaultLearningEconomy()));
    } catch {
      setLearningEconomy(createDefaultLearningEconomy());
    }
  }, [visible]);

  useEffect(() => {
    setIsFlashcardStarted(false);
    setIsFlashcardCompleted(false);
    setFlashcardSessionCards([]);
    setFlashcardCursor(0);
    setIsFlashcardRevealed(false);
    setIsFlashcardGuideVisible(false);
    setFlashcardFeedback(null);
    setIsFlashcardLoading(false);
    setFlashcardError(null);
    setFlashcardTouchStartX(null);
    setFlashcardTouchCurrentX(null);
    setFlashcardAutoSpeakEnabled(false);
    setFlashcardListeningModeEnabled(false);
    setFlashcardAudioStatus(null);

    if ((window as Window & { speechSynthesis?: SpeechSynthesis }).speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  }, [selectedFlashcardPresetId]);

  useEffect(() => {
    try {
      localStorage.setItem(SENTENCE_BUILDER_PROGRESS_STORAGE_KEY, JSON.stringify(sentenceProgress));
    } catch {
      // Ignore localStorage write failures.
    }
  }, [sentenceProgress]);

  useEffect(() => {
    try {
      localStorage.setItem(LEARNING_ECONOMY_STORAGE_KEY, JSON.stringify(learningEconomy));
    } catch {
      // Ignore localStorage write failures.
    }
  }, [learningEconomy]);

  useEffect(() => {
    if (currentLessonType !== 'sentence-builder') return;
    if (!isOutOfHearts) return;

    setSentenceFeedbackText('Bạn đã hết tim. Nhấn "Nạp tim" để tiếp tục bài học.');
  }, [currentLessonType, isOutOfHearts]);

  useEffect(() => {
    if (sentencePracticeMode === 'builder') return;
    setSentenceShowTools(false);
  }, [sentencePracticeMode]);

  const spendHearts = (amount = 1) => {
    if (amount <= 0) return;

    setLearningEconomy((prev) => ({
      ...prev,
      hearts: Math.max(0, prev.hearts - amount)
    }));
  };

  const refillHearts = () => {
    setLearningEconomy((prev) => ({
      ...prev,
      hearts: MAX_HEARTS
    }));
    setSentenceFeedbackText('Tim đã được nạp đầy. Bạn có thể tiếp tục.');
  };

  const initializeSentencePracticeDrills = (levelIndex: number) => {
    const translationOptions = buildSentenceTranslationOptions(levelIndex);
    const matchPairs = buildSentenceMatchPairs(levelIndex);

    setSentenceListenInput('');
    setSentenceListenStatus(null);
    setSentenceTranslateSelection(null);
    setSentenceTranslateStatus(null);
    setSentenceTranslateOptions(translationOptions);
    setSentenceMatchPairs(matchPairs);
    setSentenceMatchShuffledDefinitions(shuffleArray(matchPairs.map((pair) => pair.definition)));
    setSentenceMatchSelectedConcept(null);
    setSentenceMatchSelectedDefinition(null);
    setSentenceMatchSolvedConcepts([]);
    setSentenceMatchStatus(null);
  };

  const getSentencePracticeBonusKey = (mode: SentencePracticeBonusMode) => {
    if (!sentenceCurrentLevel) return null;
    return `${sentenceCurrentLevel.id}-${mode}`;
  };

  const claimSentencePracticeBonus = (mode: SentencePracticeBonusMode, successMessage: string) => {
    const bonusKey = getSentencePracticeBonusKey(mode);
    if (!bonusKey) return;

    if (sentenceBonusClaims[bonusKey]) {
      setSentenceFeedbackText(`${successMessage} (Đã nhận thưởng mode này ở level hiện tại.)`);
      return;
    }

    setSentenceProgress((prev) => {
      const nextCombo = prev.combo + 1;
      return {
        ...prev,
        xp: prev.xp + SENTENCE_PRACTICE_BONUS_XP,
        coins: prev.coins + SENTENCE_PRACTICE_BONUS_COINS,
        combo: nextCombo,
        streak: prev.streak + 1,
        bestCombo: Math.max(prev.bestCombo, nextCombo)
      };
    });

    setSentenceBonusClaims((prev) => ({
      ...prev,
      [bonusKey]: true
    }));

    setSentenceFeedbackText(
      `${successMessage} +${SENTENCE_PRACTICE_BONUS_XP} XP, +${SENTENCE_PRACTICE_BONUS_COINS} coins`
    );
  };

  const handleSentencePracticeMiss = (message: string) => {
    setSentenceProgress((prev) => ({
      ...prev,
      streak: 0,
      combo: 0
    }));
    spendHearts(1);
    setSentenceFeedbackText(message);
  };

  const resetCompletionFlow = () => {
    setCompletionFlowVisible(false);
    setCompletionFlowStep('summary');
    setCompletionFlowSnapshot(null);
    setCompletionRewardsCommitted(false);
  };

  const finalizeModuleCompletion = () => {
    localStorage.setItem('triggerModuleUnlock', 'true');

    if (onCompleteModule) {
      onCompleteModule();
      return;
    }

    onClose();
  };

  const openCompletionFlow = () => {
    if (scoreSummary.scorePercent < 60) return;

    if (completionRewardsCommitted && completionFlowSnapshot) {
      setCompletionFlowVisible(true);
      return;
    }

    const moduleXpEarned = getModuleXpReward(scoreSummary);
    const today = getLocalDateStamp();
    const yesterday = getPreviousDateStamp(today);

    setLearningEconomy((prev) => {
      const normalized = normalizeLearningEconomyForToday(prev);
      const isSameDay = normalized.lastStudyDate === today;
      const hasConsecutiveDay = !!yesterday && normalized.lastStudyDate === yesterday;
      const nextStreakDays = isSameDay
        ? normalized.streakDays
        : hasConsecutiveDay
        ? normalized.streakDays + 1
        : 1;

      const nextDailyQuestEarnedXp = Math.min(
        normalized.dailyQuestTargetXp,
        normalized.dailyQuestEarnedXp + moduleXpEarned
      );
      const nextDailyQuestCompleted = nextDailyQuestEarnedXp >= normalized.dailyQuestTargetXp;
      const gemsAwarded =
        !normalized.dailyQuestCompleted && nextDailyQuestCompleted ? DAILY_QUEST_GEM_REWARD : 0;

      const nextEconomy: LearningEconomyState = {
        ...normalized,
        hearts: MAX_HEARTS,
        streakDays: nextStreakDays,
        lastStudyDate: today,
        totalXp: normalized.totalXp + moduleXpEarned,
        dailyQuestDate: today,
        dailyQuestEarnedXp: nextDailyQuestEarnedXp,
        dailyQuestCompleted: nextDailyQuestCompleted,
        gems: normalized.gems + gemsAwarded
      };

      setCompletionFlowSnapshot({
        moduleXpEarned,
        accuracyPercent: scoreSummary.scorePercent,
        streakDays: nextStreakDays,
        streakWeekStatus: buildStreakWeekStatus(nextStreakDays),
        dailyQuestTargetXp: nextEconomy.dailyQuestTargetXp,
        dailyQuestEarnedXp: nextDailyQuestEarnedXp,
        dailyQuestCompleted: nextDailyQuestCompleted,
        gemsAwarded,
        totalGems: nextEconomy.gems
      });

      return nextEconomy;
    });

    setCompletionFlowStep('summary');
    setCompletionFlowVisible(true);
    setCompletionRewardsCommitted(true);
  };

  const handleCompletionFlowPrimaryAction = () => {
    if (completionFlowStep === 'reward') {
      finalizeModuleCompletion();
      return;
    }

    const currentIndex = COMPLETION_FLOW_ORDER.indexOf(completionFlowStep);
    const nextStep = COMPLETION_FLOW_ORDER[currentIndex + 1] ?? 'reward';
    setCompletionFlowStep(nextStep);
  };

  const getLessonSectionId = (lessonId: string) => {
    return (
      activeSections.find((section) =>
        section.lessons.some((sectionLesson) => sectionLesson.id === lessonId)
      )?.id ?? null
    );
  };

  const setLessonState = (step: number) => {
    const lesson = lessons[step - 1];
    if (!lesson) return;

    const previousLesson = lessons[currentStep - 1];
    const previousType = previousLesson ? getLessonType(previousLesson) : null;

    setCurrentStep(step);
    const nextSectionId = getLessonSectionId(lesson.id);
    if (nextSectionId) {
      setExpandedSections([nextSectionId]);
    }

    const nextType = getLessonType(lesson);
    setCurrentLessonType(nextType);

    if (nextType === 'sentence-builder') {
      setSentenceShowTools(false);
      setSentencePracticeMode('builder');
    }

    const hasQuizLessonChanged =
      nextType === 'quiz' &&
      previousType === 'quiz' &&
      previousLesson &&
      previousLesson.id !== lesson.id;

    if (nextType !== 'quiz' || hasQuizLessonChanged) {
      setIsQuizStarted(false);
      setCurrentQuestionIndex(0);
      setQuizAnswers({});
      setIsQuizSubmitted(false);
      setQuizStartedAt(null);
      setQuizDurationSeconds(0);
      setQuizResultViewMode('summary');
      setQuizAudioStatus(null);
      setQuizPendingMatchLeft(null);
      setQuizFillBlankHintUses(0);
      setQuizFillBlankHints({});
      setShareFeedback(null);
      resetCompletionFlow();
    }

    if (nextType !== 'flashcard') {
      setIsFlashcardStarted(false);
      setIsFlashcardCompleted(false);
      setFlashcardSessionCards([]);
      setFlashcardCursor(0);
      setIsFlashcardRevealed(false);
      setIsFlashcardGuideVisible(false);
      setFlashcardFeedback(null);
      setIsFlashcardLoading(false);
      setFlashcardError(null);
      setFlashcardTouchStartX(null);
      setFlashcardTouchCurrentX(null);
      setFlashcardAutoSpeakEnabled(false);
      setFlashcardListeningModeEnabled(false);
      setFlashcardAudioStatus(null);

      if ((window as Window & { speechSynthesis?: SpeechSynthesis }).speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    }

    if (nextType !== 'sentence-builder') {
      setSentenceFeedbackState('idle');
      setSentenceFeedbackText(null);
      setSentenceWrongIndices([]);
      setSentenceShowCorrectAnswer(false);
      setSentenceSelectedTileId(null);
      setSentenceHintTileId(null);
      setSentenceDragTileId(null);
      setSentenceAudioStatus(null);
      setSentenceShowTools(false);
      setSentencePracticeMode('builder');
      setSentenceBonusClaims({});
      setSentenceListenInput('');
      setSentenceListenStatus(null);
      setSentenceTranslateSelection(null);
      setSentenceTranslateStatus(null);
      setSentenceMatchSelectedConcept(null);
      setSentenceMatchSelectedDefinition(null);
      setSentenceMatchStatus(null);
    }
  };

  useEffect(() => {
    if (!visible) return;
    if (lessons.length === 0) return;

    const safeStep = Math.max(1, Math.min(selectedModuleId ?? 1, lessons.length));
    setLessonState(safeStep);
  }, [visible, selectedCourseId, selectedModuleId, lessons.length]);

  const resetQuizAttempt = () => {
    setCurrentQuestionIndex(0);
    setQuizAnswers({});
    setIsQuizSubmitted(false);
    setQuizStartedAt(Date.now());
    setQuizDurationSeconds(0);
    setQuizResultViewMode('summary');
    setQuizAudioStatus(null);
    setQuizPendingMatchLeft(null);
    setQuizFillBlankHintUses(0);
    setQuizFillBlankHints({});
    setShareFeedback(null);
    resetCompletionFlow();
    setIsQuizStarted(true);
  };

  const handlePreviousLesson = () => {
    if (currentStep > 1) {
      setLessonState(currentStep - 1);
    }
  };

  const handleNextLesson = () => {
    if (currentStep < totalSteps) {
      const nextStep = currentStep + 1;
      if (nextStep === totalSteps) {
        localStorage.setItem('triggerModuleUnlock', 'true');
      }
      setLessonState(nextStep);
    }
  };

  const handleSelectLesson = (lessonId: string) => {
    const lessonIndex = lessons.findIndex((lesson) => lesson.id === lessonId);
    if (lessonIndex !== -1) {
      setLessonState(lessonIndex + 1);
    }
  };

  const handleDownloadDocument = (lessonId = currentLesson.id) => {
    const documentData = DOCUMENT_LIBRARY[lessonId];
    if (!documentData) return;

    const output = [
      documentData.title,
      `Thời gian đọc: ${documentData.readingTime}`,
      `Số trang: ${documentData.pages}`,
      '',
      'Tổng quan',
      documentData.overview,
      '',
      'Mục tiêu',
      ...documentData.objectives.map((item, index) => `${index + 1}. ${item}`),
      '',
      'Nội dung',
      ...documentData.sections.map((item) => `${item.heading}\n${item.content}`),
      '',
      'Bài tập tự luyện',
      ...documentData.practiceTasks.map((item, index) => `${index + 1}. ${item}`)
    ].join('\n');

    const blob = new Blob([output], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${documentData.fileName}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const toggleSection = (sectionId: string) => {
    setExpandedSections((prev) =>
      prev.includes(sectionId) ? prev.filter((id) => id !== sectionId) : [...prev, sectionId]
    );
  };

  const clearFlashcardSpeechQueue = () => {
    const speechSynthesisApi = (window as Window & { speechSynthesis?: SpeechSynthesis })
      .speechSynthesis;
    if (speechSynthesisApi) {
      speechSynthesisApi.cancel();
    }
  };

  const clearFlashcardTouchTracking = () => {
    setFlashcardTouchStartX(null);
    setFlashcardTouchCurrentX(null);
  };

  const startFlashcardSession = (cards: FlashcardCard[]) => {
    if (isFlashcardLoading) return;

    if (cards.length === 0) {
      setFlashcardError('Preset hiện tại chưa có dữ liệu flashcard.');
      setFlashcardFeedback(null);
      setIsFlashcardLoading(false);
      return;
    }

    setFlashcardError(null);
    setFlashcardFeedback('Đang chuẩn bị phiên flashcard...');
    setIsFlashcardLoading(true);
    setIsFlashcardStarted(true);
    setIsFlashcardCompleted(false);
    setFlashcardSessionCards([]);
    setFlashcardCursor(0);
    setIsFlashcardRevealed(false);
    setIsFlashcardGuideVisible(false);
    setFlashcardAudioStatus(null);
    clearFlashcardTouchTracking();
    clearFlashcardSpeechQueue();

    window.setTimeout(() => {
      setFlashcardSessionCards(cards);
      setFlashcardCursor(0);
      setIsFlashcardRevealed(false);
      setFlashcardFeedback(null);
      setFlashcardAudioStatus(null);
      clearFlashcardTouchTracking();
      setIsFlashcardLoading(false);
    }, FLASHCARD_LOADING_DELAY_MS);
  };

  const handleStartFlashcardStudy = () => {
    startFlashcardSession(flashcardDeck);
  };

  const handleFlashcardToggleGuide = () => {
    setIsFlashcardGuideVisible((prev) => !prev);
  };

  const handleFlashcardReveal = () => {
    if (!isFlashcardStarted || isFlashcardCompleted || isFlashcardLoading || flashcardError) return;
    if (!currentFlashcard) {
      setFlashcardError('Không tìm thấy thẻ hiện tại. Hãy tải lại phiên flashcard.');
      return;
    }

    setFlashcardError(null);
    setFlashcardAudioStatus(null);
    setIsFlashcardRevealed((prev) => !prev);
  };

  const handleFlashcardPrevious = () => {
    if (
      !isFlashcardStarted ||
      isFlashcardCompleted ||
      isFlashcardLoading ||
      flashcardError ||
      flashcardCursor === 0
    ) {
      return;
    }

    setFlashcardCursor((prev) => Math.max(0, prev - 1));
    setIsFlashcardRevealed(false);
    setFlashcardFeedback(null);
    setFlashcardError(null);
    setFlashcardAudioStatus(null);
    clearFlashcardSpeechQueue();
    clearFlashcardTouchTracking();
  };

  const handleFlashcardNext = () => {
    if (!isFlashcardStarted || isFlashcardCompleted || isFlashcardLoading || flashcardError) return;
    if (!currentFlashcard) {
      setFlashcardError('Không tìm thấy thẻ hiện tại. Hãy tải lại phiên flashcard.');
      return;
    }

    setFlashcardError(null);
    setFlashcardAudioStatus(null);
    clearFlashcardSpeechQueue();
    clearFlashcardTouchTracking();

    setIsFlashcardRevealed(false);

    if (flashcardCursor >= flashcardSessionCards.length - 1) {
      setIsFlashcardCompleted(true);
      setFlashcardFeedback('Bạn đã đi hết bộ thẻ trong phiên học.');
      return;
    }

    setFlashcardCursor((prev) => prev + 1);
    setFlashcardFeedback(null);
  };

  const handleFlashcardJumpToCard = (cardIndex: number) => {
    if (
      !isFlashcardStarted ||
      isFlashcardCompleted ||
      isFlashcardLoading ||
      flashcardError ||
      cardIndex < 0 ||
      cardIndex >= flashcardSessionCards.length ||
      cardIndex === flashcardCursor
    ) {
      return;
    }

    setFlashcardCursor(cardIndex);
    setIsFlashcardRevealed(false);
    setFlashcardFeedback(null);
    setFlashcardError(null);
    setFlashcardAudioStatus(null);
    clearFlashcardSpeechQueue();
    clearFlashcardTouchTracking();
  };

  const handleFlashcardShuffleSession = () => {
    if (
      !isFlashcardStarted ||
      isFlashcardCompleted ||
      isFlashcardLoading ||
      flashcardError ||
      flashcardSessionCards.length < 2 ||
      !currentFlashcard
    ) {
      return;
    }

    const remainingCards = flashcardSessionCards.filter((card) => card.id !== currentFlashcard.id);
    const shuffledRemainder = shuffleArray(remainingCards);

    setFlashcardSessionCards([currentFlashcard, ...shuffledRemainder]);
    setFlashcardCursor(0);
    setIsFlashcardRevealed(false);
    setFlashcardFeedback('Đã xáo trộn các thẻ còn lại trong phiên học.');
    setFlashcardError(null);
    setFlashcardAudioStatus(null);
    clearFlashcardSpeechQueue();
    clearFlashcardTouchTracking();
  };

  const speakFlashcardText = (text: string) => {
    const normalizedText = text.trim();
    if (!normalizedText) {
      setFlashcardAudioStatus('Không có nội dung để phát audio.');
      return;
    }

    const speechSynthesisApi = (window as Window & { speechSynthesis?: SpeechSynthesis })
      .speechSynthesis;

    if (!speechSynthesisApi) {
      setFlashcardAudioStatus('Trình duyệt không hỗ trợ Text-to-Speech.');
      return;
    }

    const utterance = new SpeechSynthesisUtterance(normalizedText);
    utterance.lang = 'en-US';
    utterance.rate = 0.96;
    utterance.onstart = () => setFlashcardAudioStatus('Đang phát audio...');
    utterance.onend = () => setFlashcardAudioStatus('Đã phát xong audio.');
    utterance.onerror = () => setFlashcardAudioStatus('Không thể phát audio cho thẻ này.');

    speechSynthesisApi.cancel();
    speechSynthesisApi.speak(utterance);
  };

  const handleFlashcardSpeakCurrent = () => {
    if (!isFlashcardStarted || isFlashcardCompleted || isFlashcardLoading || flashcardError) return;
    if (!currentFlashcard) {
      setFlashcardError('Không tìm thấy thẻ hiện tại. Hãy tải lại phiên flashcard.');
      return;
    }

    const sideText = isFlashcardRevealed ? currentFlashcard.revealValue : currentFlashcard.askValue;
    speakFlashcardText(sideText);
  };

  const handleFlashcardToggleAutoSpeak = () => {
    if (!isFlashcardStarted || isFlashcardCompleted || isFlashcardLoading || flashcardError) return;

    setFlashcardAutoSpeakEnabled((prev) => {
      const next = !prev;
      setFlashcardFeedback(next ? 'Auto audio đã bật.' : 'Auto audio đã tắt.');

      if (!next && !flashcardListeningModeEnabled) {
        clearFlashcardSpeechQueue();
        setFlashcardAudioStatus(null);
      }

      return next;
    });
  };

  const handleFlashcardToggleListeningMode = () => {
    if (!isFlashcardStarted || isFlashcardCompleted || isFlashcardLoading || flashcardError) return;

    setFlashcardListeningModeEnabled((prev) => {
      const next = !prev;
      setFlashcardFeedback(
        next ? 'Listening mode đã bật (flip thẻ sẽ phát audio).' : 'Listening mode đã tắt.'
      );

      if (!next && !flashcardAutoSpeakEnabled) {
        clearFlashcardSpeechQueue();
        setFlashcardAudioStatus(null);
      }

      return next;
    });
  };

  const handleRestartAllFlashcards = () => {
    if (isFlashcardLoading) return;
    setFlashcardError(null);
    startFlashcardSession(flashcardDeck);
  };

  const handleMoveToQuizFromFlashcard = () => {
    const quizStep = lessons.findIndex((lesson) => lesson.isQuiz);
    if (quizStep !== -1) {
      setLessonState(quizStep + 1);
    }
  };

  useEffect(() => {
    if (!visible || currentLessonType !== 'flashcard' || !isFlashcardStarted || isFlashcardCompleted) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      const activeElement = document.activeElement as HTMLElement | null;
      const tagName = activeElement?.tagName;
      if (tagName === 'INPUT' || tagName === 'TEXTAREA') return;

      if (event.code === 'Escape') {
        event.preventDefault();
        setFlashcardFeedback(null);
        setFlashcardError(null);
        setFlashcardAudioStatus(null);
        setIsFlashcardGuideVisible(false);
        return;
      }

      if (isFlashcardLoading || flashcardError) {
        return;
      }

      if (event.code === 'Space') {
        event.preventDefault();
        handleFlashcardReveal();
        return;
      }

      if (event.code === 'Enter') {
        event.preventDefault();
        handleFlashcardReveal();
        return;
      }

      if (event.code === 'ArrowLeft') {
        event.preventDefault();
        handleFlashcardPrevious();
        return;
      }

      if (event.code === 'ArrowRight') {
        event.preventDefault();
        handleFlashcardNext();
        return;
      }

      if (event.code === 'KeyA') {
        event.preventDefault();
        handleFlashcardSpeakCurrent();
        return;
      }

      if (event.code === 'KeyR') {
        event.preventDefault();
        handleFlashcardShuffleSession();
        return;
      }

      if (event.code === 'KeyM') {
        event.preventDefault();
        handleFlashcardToggleListeningMode();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    visible,
    currentLessonType,
    isFlashcardStarted,
    isFlashcardCompleted,
    isFlashcardLoading,
    flashcardError,
    handleFlashcardReveal,
    handleFlashcardPrevious,
    handleFlashcardNext,
    handleFlashcardSpeakCurrent,
    handleFlashcardShuffleSession,
    handleFlashcardToggleListeningMode
  ]);

  useEffect(() => {
    if (
      !visible ||
      currentLessonType !== 'flashcard' ||
      !isFlashcardStarted ||
      isFlashcardCompleted ||
      isFlashcardLoading ||
      flashcardError ||
      !currentFlashcard
    ) {
      return;
    }

    const shouldAutoSpeak =
      flashcardAutoSpeakEnabled || (flashcardListeningModeEnabled && isFlashcardRevealed);

    if (!shouldAutoSpeak) return;

    const sideText = (isFlashcardRevealed ? currentFlashcard.revealValue : currentFlashcard.askValue)
      .trim();

    if (!sideText) return;

    const speechSynthesisApi = (window as Window & { speechSynthesis?: SpeechSynthesis })
      .speechSynthesis;

    if (!speechSynthesisApi) return;

    const utterance = new SpeechSynthesisUtterance(sideText);
    utterance.lang = 'en-US';
    utterance.rate = 0.96;
    utterance.onstart = () => setFlashcardAudioStatus('Auto audio đang phát...');
    utterance.onend = () => setFlashcardAudioStatus('Auto audio đã phát xong.');
    utterance.onerror = () => setFlashcardAudioStatus('Auto audio gặp lỗi.');

    speechSynthesisApi.cancel();
    speechSynthesisApi.speak(utterance);

    return () => {
      speechSynthesisApi.cancel();
    };
  }, [
    visible,
    currentLessonType,
    isFlashcardStarted,
    isFlashcardCompleted,
    isFlashcardLoading,
    flashcardError,
    currentFlashcard,
    isFlashcardRevealed,
    flashcardAutoSpeakEnabled,
    flashcardListeningModeEnabled
  ]);

  const loadSentenceLevel = (levelIndex: number) => {
    if (SENTENCE_BUILDER_LEVELS.length === 0) return;

    const safeLevelIndex = Math.max(0, Math.min(levelIndex, maxSentenceLevelIndex));
    const level = SENTENCE_BUILDER_LEVELS[safeLevelIndex];
    const nextTiles = shuffleSentenceTiles(buildSentenceWordTiles(level.correctSentence));

    setSentenceCurrentLevelIndex(safeLevelIndex);
    setSentenceBankTiles(nextTiles);
    setSentenceAnswerTiles([]);
    setSentenceSelectedTileId(null);
    setSentenceHintTileId(null);
    setSentenceFeedbackState('idle');
    setSentenceFeedbackText(null);
    setSentenceWrongIndices([]);
    setSentenceShowCorrectAnswer(false);
    setSentenceDragTileId(null);
    setSentenceTimeLeft(level.timeLimitSeconds);
    setSentenceAudioStatus(null);
    initializeSentencePracticeDrills(safeLevelIndex);
  };

  const speakWordBankTile = (word: string) => {
    const normalizedWord = word.trim();
    if (!normalizedWord) return;

    const speechSynthesisApi = (window as Window & { speechSynthesis?: SpeechSynthesis })
      .speechSynthesis;

    if (!speechSynthesisApi) {
      setSentenceAudioStatus('Trình duyệt không hỗ trợ đọc từ.');
      return;
    }

    const utterance = new SpeechSynthesisUtterance(normalizedWord);
    utterance.lang = 'en-US';
    utterance.rate = 0.9;

    utterance.onstart = () => {
      setSentenceAudioStatus(`Đang đọc từ: "${normalizedWord}"`);
    };

    utterance.onend = () => {
      setSentenceAudioStatus(`Đã đọc xong: "${normalizedWord}"`);
    };

    utterance.onerror = () => {
      setSentenceAudioStatus('Không thể đọc từ lúc này.');
    };

    speechSynthesisApi.cancel();
    speechSynthesisApi.speak(utterance);
  };

  const handleSentenceTileSelect = (tileId: string) => {
    const selectedTile = sentenceBankTiles.find((tile) => tile.id === tileId);
    if (!selectedTile || sentenceSessionCompleted) return;

    speakWordBankTile(selectedTile.word);

    setSentenceBankTiles((prev) => prev.filter((tile) => tile.id !== tileId));
    setSentenceAnswerTiles((prev) => [...prev, selectedTile]);
    setSentenceSelectedTileId(tileId);
    setSentenceHintTileId(null);

    if (sentenceFeedbackState !== 'idle') {
      setSentenceFeedbackState('idle');
      setSentenceFeedbackText(null);
      setSentenceWrongIndices([]);
      setSentenceShowCorrectAnswer(false);
    }
  };

  const handleSentenceTileRemove = (tileId: string) => {
    const selectedTile = sentenceAnswerTiles.find((tile) => tile.id === tileId);
    if (!selectedTile || sentenceSessionCompleted) return;

    setSentenceAnswerTiles((prev) => prev.filter((tile) => tile.id !== tileId));
    setSentenceBankTiles((prev) => [...prev, selectedTile]);
    setSentenceSelectedTileId(tileId);
    setSentenceHintTileId(null);

    if (sentenceFeedbackState !== 'idle') {
      setSentenceFeedbackState('idle');
      setSentenceFeedbackText(null);
      setSentenceWrongIndices([]);
      setSentenceShowCorrectAnswer(false);
    }
  };

  const handleSentenceRemoveLastTile = () => {
    const lastTile = sentenceAnswerTiles[sentenceAnswerTiles.length - 1];
    if (!lastTile) return;
    handleSentenceTileRemove(lastTile.id);
  };

  const moveSentenceTileToAnswer = (tileId: string, insertIndex?: number) => {
    const draggedTile = sentenceBankTiles.find((tile) => tile.id === tileId);
    if (!draggedTile || sentenceSessionCompleted) return;

    const nextBankTiles = sentenceBankTiles.filter((tile) => tile.id !== tileId);
    const nextAnswerTiles = [...sentenceAnswerTiles];

    if (typeof insertIndex === 'number' && insertIndex >= 0 && insertIndex <= nextAnswerTiles.length) {
      nextAnswerTiles.splice(insertIndex, 0, draggedTile);
    } else {
      nextAnswerTiles.push(draggedTile);
    }

    setSentenceBankTiles(nextBankTiles);
    setSentenceAnswerTiles(nextAnswerTiles);
    setSentenceSelectedTileId(tileId);
    setSentenceHintTileId(null);

    if (sentenceFeedbackState !== 'idle') {
      setSentenceFeedbackState('idle');
      setSentenceFeedbackText(null);
      setSentenceWrongIndices([]);
      setSentenceShowCorrectAnswer(false);
    }
  };

  const reorderSentenceAnswerTile = (tileId: string, targetIndex: number) => {
    const fromIndex = sentenceAnswerTiles.findIndex((tile) => tile.id === tileId);
    if (fromIndex === -1 || targetIndex < 0 || targetIndex >= sentenceAnswerTiles.length) return;
    if (fromIndex === targetIndex) return;

    const reorderedTiles = [...sentenceAnswerTiles];
    const [draggedTile] = reorderedTiles.splice(fromIndex, 1);
    reorderedTiles.splice(targetIndex, 0, draggedTile);

    setSentenceAnswerTiles(reorderedTiles);
    setSentenceSelectedTileId(tileId);
  };

  const handleSentenceDragStart = (tileId: string) => {
    setSentenceDragTileId(tileId);
    setSentenceSelectedTileId(tileId);
  };

  const handleSentenceDropToAnswer = (targetIndex?: number) => {
    if (!sentenceDragTileId) return;

    const isFromBank = sentenceBankTiles.some((tile) => tile.id === sentenceDragTileId);
    const isFromAnswer = sentenceAnswerTiles.some((tile) => tile.id === sentenceDragTileId);

    if (isFromBank) {
      moveSentenceTileToAnswer(sentenceDragTileId, targetIndex);
    } else if (isFromAnswer && typeof targetIndex === 'number') {
      reorderSentenceAnswerTile(sentenceDragTileId, targetIndex);
    }

    setSentenceDragTileId(null);
  };

  const handleSentenceDropToBank = () => {
    if (!sentenceDragTileId) return;

    if (sentenceAnswerTiles.some((tile) => tile.id === sentenceDragTileId)) {
      handleSentenceTileRemove(sentenceDragTileId);
    }

    setSentenceDragTileId(null);
  };

  const handleSentenceShuffleWords = () => {
    setSentenceBankTiles((prev) => shuffleSentenceTiles(prev));
    setSentenceSelectedTileId(null);
    setSentenceHintTileId(null);
  };

  const handleUseSentenceHint = () => {
    if (!sentenceCurrentLevel || sentenceSessionCompleted) return;

    const nextExpectedWord = sentenceCurrentWords[sentenceAnswerTiles.length];
    if (!nextExpectedWord) {
      setSentenceFeedbackText('Bạn đã dùng hết gợi ý cho câu hiện tại.');
      return;
    }

    const nextExpectedNormalized = normalizeSentenceValue(nextExpectedWord);
    const hintTile = sentenceBankTiles.find(
      (tile) => normalizeSentenceValue(tile.word) === nextExpectedNormalized
    );

    if (!hintTile) {
      setSentenceFeedbackText('Từ gợi ý đang ở vùng trả lời. Hãy kiểm tra thứ tự hiện tại.');
      return;
    }

    setSentenceHintTileId(hintTile.id);
    setSentenceSelectedTileId(hintTile.id);
    setSentenceFeedbackText(`Hint: từ tiếp theo là "${hintTile.word}".`);
  };

  const handlePlaySentenceAudio = () => {
    if (!sentenceCurrentLevel) return;

    if (!(window as Window & { speechSynthesis?: SpeechSynthesis }).speechSynthesis) {
      setSentenceAudioStatus('Trình duyệt không hỗ trợ audio playback.');
      return;
    }

    const utterance = new SpeechSynthesisUtterance(sentenceCurrentLevel.correctSentence);
    utterance.lang = 'en-US';
    utterance.rate = 0.9;

    utterance.onstart = () => setSentenceAudioStatus('Đang phát audio mẫu...');
    utterance.onend = () => setSentenceAudioStatus('Đã phát xong.');
    utterance.onerror = () => setSentenceAudioStatus('Không thể phát audio lúc này.');

    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  };

  const handleSentenceListenCheck = () => {
    if (!sentenceCurrentLevel || sentenceSessionCompleted) return;

    if (isOutOfHearts) {
      setSentenceListenStatus('Bạn đã hết tim. Nạp tim để tiếp tục bài nghe.');
      return;
    }

    const normalizedInput = normalizeSentenceValue(sentenceListenInput);
    if (!normalizedInput) {
      setSentenceListenStatus('Hãy nhập câu bạn nghe được trước khi kiểm tra.');
      return;
    }

    const normalizedExpected = normalizeSentenceValue(sentenceCurrentLevel.correctSentence);
    const isCorrect = normalizedInput === normalizedExpected;

    if (isCorrect) {
      setSentenceListenStatus('Chính xác. Bạn đã nghe và gõ đúng câu.');
      claimSentencePracticeBonus('listen', 'Hoàn thành Listen & Type.');
      return;
    }

    setSentenceListenStatus('Chưa đúng. Hãy nghe lại và thử lần nữa.');
    handleSentencePracticeMiss('Sai ở bài Listen & Type, bạn mất 1 tim.');
  };

  const handleSentenceTranslateCheck = () => {
    if (!sentenceCurrentLevel || sentenceSessionCompleted) return;

    if (isOutOfHearts) {
      setSentenceTranslateStatus('Bạn đã hết tim. Nạp tim để tiếp tục bài chọn nghĩa.');
      return;
    }

    if (!sentenceTranslateSelection) {
      setSentenceTranslateStatus('Hãy chọn một đáp án trước khi kiểm tra.');
      return;
    }

    const isCorrect = sentenceTranslateSelection === sentenceCurrentLevel.translation;

    if (isCorrect) {
      setSentenceTranslateStatus('Chính xác. Bạn đã chọn đúng nghĩa câu.');
      claimSentencePracticeBonus('translate', 'Hoàn thành Choose Meaning.');
      return;
    }

    setSentenceTranslateStatus('Chưa đúng. Thử lại để giữ streak nhé.');
    handleSentencePracticeMiss('Sai ở bài Choose Meaning, bạn mất 1 tim.');
  };

  const handleSentenceResolveMatchAttempt = (concept: string, definition: string) => {
    if (!sentenceCurrentLevel || sentenceSessionCompleted) return;
    if (sentenceMatchSolvedSet.has(concept)) return;

    if (isOutOfHearts) {
      setSentenceMatchStatus('Bạn đã hết tim. Nạp tim để tiếp tục ghép cặp.');
      return;
    }

    const matchedPair = sentenceMatchPairs.find((pair) => pair.concept === concept);
    if (!matchedPair) return;

    if (matchedPair.definition === definition) {
      const nextSolvedConcepts = sentenceMatchSolvedConcepts.includes(concept)
        ? sentenceMatchSolvedConcepts
        : [...sentenceMatchSolvedConcepts, concept];

      setSentenceMatchSolvedConcepts(nextSolvedConcepts);
      setSentenceMatchStatus(`Đúng cặp: "${concept}".`);

      if (nextSolvedConcepts.length >= sentenceMatchPairs.length) {
        claimSentencePracticeBonus('match', 'Hoàn thành Match Pairs.');
      }
    } else {
      setSentenceMatchStatus('Sai cặp. Hãy thử lại với định nghĩa khác.');
      handleSentencePracticeMiss('Ghép cặp sai, bạn mất 1 tim.');
    }

    setSentenceMatchSelectedConcept(null);
    setSentenceMatchSelectedDefinition(null);
  };

  const handleSentenceSelectMatchConcept = (concept: string) => {
    if (sentenceMatchSolvedSet.has(concept) || sentenceSessionCompleted) return;

    if (sentenceMatchSelectedDefinition) {
      handleSentenceResolveMatchAttempt(concept, sentenceMatchSelectedDefinition);
      return;
    }

    setSentenceMatchSelectedConcept((prev) => (prev === concept ? null : concept));
  };

  const handleSentenceSelectMatchDefinition = (definition: string) => {
    if (sentenceSessionCompleted) return;

    if (sentenceMatchSelectedConcept) {
      handleSentenceResolveMatchAttempt(sentenceMatchSelectedConcept, definition);
      return;
    }

    setSentenceMatchSelectedDefinition((prev) => (prev === definition ? null : definition));
  };

  const handleSentenceReshuffleMatchDefinitions = () => {
    setSentenceMatchShuffledDefinitions((prev) => shuffleArray(prev));
    setSentenceMatchSelectedDefinition(null);
    setSentenceMatchStatus('Đã xáo trộn lại cột định nghĩa.');
  };

  const handleSentenceResetMatchRound = () => {
    const refreshedPairs = buildSentenceMatchPairs(sentenceCurrentLevelIndex);
    setSentenceMatchPairs(refreshedPairs);
    setSentenceMatchShuffledDefinitions(shuffleArray(refreshedPairs.map((pair) => pair.definition)));
    setSentenceMatchSelectedConcept(null);
    setSentenceMatchSelectedDefinition(null);
    setSentenceMatchSolvedConcepts([]);
    setSentenceMatchStatus('Đã làm mới vòng Match Pairs.');
  };

  const handleSentenceCheckAnswer = (isTimeout = false) => {
    if (!sentenceCurrentLevel || sentenceSessionCompleted) return;

    if (isOutOfHearts) {
      setSentenceFeedbackText('Bạn đã hết tim. Nhấn "Nạp tim" để tiếp tục bài học.');
      return;
    }

    if (sentenceAnswerTiles.length === 0 && !isTimeout) {
      setSentenceFeedbackText('Hãy chọn ít nhất một từ trước khi kiểm tra.');
      return;
    }

    const expectedWords = sentenceCurrentWords.map((word) => normalizeSentenceValue(word));
    const selectedWords = sentenceAnswerTiles.map((tile) => normalizeSentenceValue(tile.word));
    const wrongIndexes: number[] = [];
    const compareLength = Math.max(expectedWords.length, selectedWords.length);

    for (let index = 0; index < compareLength; index += 1) {
      if (expectedWords[index] !== selectedWords[index]) {
        wrongIndexes.push(index);
      }
    }

    const validation = validateSentenceBuilderAnswer(
      sentenceAnswerTiles,
      sentenceCurrentLevel.correctSentence
    );
    const isComplete = selectedWords.length === expectedWords.length;
    const isCorrect = !isTimeout && isComplete && validation.isCorrect;

    setSentenceSubmittedCount((prev) => prev + 1);
    setSentenceHintTileId(null);

    if (isCorrect) {
      const shouldUnlockNextLevel =
        sentenceCurrentLevelIndex === sentenceHighestUnlockedLevel &&
        sentenceHighestUnlockedLevel < maxSentenceLevelIndex;
      const nextHighestUnlockedLevel = shouldUnlockNextLevel
        ? Math.min(maxSentenceLevelIndex, sentenceHighestUnlockedLevel + 1)
        : sentenceHighestUnlockedLevel;
      const hasAllLevelsUnlocked = nextHighestUnlockedLevel >= maxSentenceLevelIndex;
      const nextRetryQueue = hasAllLevelsUnlocked
        ? sentenceRetryQueue.filter((levelIndex) => levelIndex !== sentenceCurrentLevelIndex)
        : sentenceRetryQueue;

      setSentenceCorrectCount((prev) => prev + 1);
      setSentenceRetryQueue(nextRetryQueue);
      setSentenceFeedbackState('correct');
      setSentenceWrongIndices([]);
      setSentenceShowCorrectAnswer(false);
      setSentenceFeedbackText(
        shouldUnlockNextLevel
          ? `Chính xác. Bạn đã mở khóa level ${nextHighestUnlockedLevel + 1}. +${sentenceCurrentLevel.xpReward} XP`
          : `Chính xác. +${sentenceCurrentLevel.xpReward} XP, +${sentenceCurrentLevel.coinReward} coins`
      );

      setSentenceProgress((prev) => {
        const nextCombo = prev.combo + 1;
        const nextStreak = prev.streak + 1;
        const nextMasteredLevelIds = prev.masteredLevelIds.includes(sentenceCurrentLevel.id)
          ? prev.masteredLevelIds
          : [...prev.masteredLevelIds, sentenceCurrentLevel.id];

        return {
          ...prev,
          xp: prev.xp + sentenceCurrentLevel.xpReward,
          coins: prev.coins + sentenceCurrentLevel.coinReward,
          combo: nextCombo,
          streak: nextStreak,
          bestCombo: Math.max(prev.bestCombo, nextCombo),
          highestUnlockedLevel: shouldUnlockNextLevel
            ? nextHighestUnlockedLevel
            : prev.highestUnlockedLevel,
          masteredLevelIds: nextMasteredLevelIds
        };
      });

      window.setTimeout(() => {
        if (shouldUnlockNextLevel) {
          loadSentenceLevel(nextHighestUnlockedLevel);
          return;
        }

        if (hasAllLevelsUnlocked && nextRetryQueue.length > 0) {
          loadSentenceLevel(nextRetryQueue[0]);
          return;
        }

        if (hasAllLevelsUnlocked && nextRetryQueue.length === 0) {
          setSentenceSessionCompleted(true);
          setSentenceFeedbackText('Bạn đã hoàn thành tất cả level sentence builder.');

          try {
            localStorage.setItem('triggerModuleUnlock', 'true');
            localStorage.setItem('edvision-sentence-builder-mastered', 'true');
            localStorage.setItem('edvision-map-node-sentence-builder', 'completed');
            localStorage.setItem(
              'edvision-map-node-sentence-builder-at',
              `${Date.now()}`
            );
          } catch {
            // Ignore localStorage write failures.
          }

          return;
        }

        const nextLevel = Math.min(sentenceCurrentLevelIndex + 1, nextHighestUnlockedLevel);
        loadSentenceLevel(nextLevel);
      }, 850);

      return;
    }

    const nextRetryQueue = sentenceRetryQueue.includes(sentenceCurrentLevelIndex)
      ? sentenceRetryQueue
      : [...sentenceRetryQueue, sentenceCurrentLevelIndex];

    setSentenceRetryQueue(nextRetryQueue);
    setSentenceFeedbackState(isTimeout ? 'timeout' : 'incorrect');
    setSentenceWrongIndices(wrongIndexes.length > 0 ? wrongIndexes : [0]);
    setSentenceShowCorrectAnswer(false);
    setSentenceFeedbackText(
      isTimeout
        ? 'Hết giờ. Bạn mất 1 tim và hệ thống sẽ hiện đáp án đúng sau 1 giây.'
        : 'Câu chưa đúng thứ tự. Bạn mất 1 tim và hệ thống sẽ hiện đáp án đúng sau 1 giây.'
    );

    setSentenceProgress((prev) => ({
      ...prev,
      streak: 0,
      combo: 0
    }));
    spendHearts(1);

    window.setTimeout(() => {
      setSentenceShowCorrectAnswer(true);
    }, 1200);
  };

  const handleSentenceSkipLevel = () => {
    if (!sentenceCurrentLevel || sentenceSessionCompleted) return;

    if (isOutOfHearts) {
      setSentenceFeedbackText('Bạn đã hết tim. Nạp tim để bỏ qua level.');
      return;
    }

    const nextRetryQueue = sentenceRetryQueue.includes(sentenceCurrentLevelIndex)
      ? sentenceRetryQueue
      : [...sentenceRetryQueue, sentenceCurrentLevelIndex];
    const nextUnlockedLevel = Math.min(sentenceHighestUnlockedLevel, sentenceCurrentLevelIndex + 1);
    const nextQueueCandidate = nextRetryQueue.find((index) => index !== sentenceCurrentLevelIndex);

    setSentenceRetryQueue(nextRetryQueue);
    setSentenceFeedbackState('timeout');
    setSentenceWrongIndices([]);
    setSentenceShowCorrectAnswer(true);
    setSentenceFeedbackText('Đã bỏ qua level này. Bạn mất 1 tim và sẽ gặp lại level trong adaptive review.');
    spendHearts(1);

    window.setTimeout(() => {
      if (nextUnlockedLevel !== sentenceCurrentLevelIndex) {
        loadSentenceLevel(nextUnlockedLevel);
        return;
      }

      if (typeof nextQueueCandidate === 'number') {
        loadSentenceLevel(nextQueueCandidate);
        return;
      }

      loadSentenceLevel(sentenceCurrentLevelIndex);
    }, 700);
  };

  const handleSentenceRetryCurrentLevel = () => {
    if (!sentenceCurrentLevel) return;
    loadSentenceLevel(sentenceCurrentLevelIndex);
  };

  const handleSentenceResetProgress = () => {
    setSentenceProgress(defaultSentenceProgressState);
    setSentenceRetryQueue([]);
    setSentenceSubmittedCount(0);
    setSentenceCorrectCount(0);
    setSentenceSessionCompleted(false);
    setSentenceBonusClaims({});
    setSentencePracticeMode('builder');
    loadSentenceLevel(0);
  };

  const handleSentenceRestartSession = () => {
    setSentenceSessionCompleted(false);
    setSentenceRetryQueue([]);
    setSentenceFeedbackState('idle');
    setSentenceFeedbackText(null);
    setSentenceWrongIndices([]);
    setSentenceShowCorrectAnswer(false);
    setSentencePracticeMode('builder');
    setSentenceBonusClaims({});
    loadSentenceLevel(0);
  };

  const handleMoveToQuizFromSentenceBuilder = () => {
    const quizStep = lessons.findIndex((lesson) => lesson.isQuiz);
    if (quizStep !== -1) {
      setLessonState(quizStep + 1);
    }
  };

  useEffect(() => {
    if (currentLessonType !== 'sentence-builder') {
      if ((window as Window & { speechSynthesis?: SpeechSynthesis }).speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      return;
    }

    if (sentenceCurrentLevelIndex > sentenceHighestUnlockedLevel && sentenceRetryQueue.length === 0) {
      loadSentenceLevel(sentenceHighestUnlockedLevel);
    }
  }, [
    currentLessonType,
    sentenceCurrentLevelIndex,
    sentenceHighestUnlockedLevel,
    sentenceRetryQueue.length
  ]);

  useEffect(() => {
    if (
      !visible ||
      currentLessonType !== 'sentence-builder' ||
      sentenceSessionCompleted ||
      sentencePracticeMode !== 'builder' ||
      !sentenceTimerEnabled ||
      sentenceFeedbackState !== 'idle'
    ) {
      return;
    }

    if (sentenceTimeLeft <= 0) {
      handleSentenceCheckAnswer(true);
      return;
    }

    const timer = window.setTimeout(() => {
      setSentenceTimeLeft((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [
    visible,
    currentLessonType,
    sentenceSessionCompleted,
    sentencePracticeMode,
    sentenceTimerEnabled,
    sentenceFeedbackState,
    sentenceTimeLeft
  ]);

  useEffect(() => {
    if (!visible || currentLessonType !== 'sentence-builder' || sentenceSessionCompleted) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      const activeElement = document.activeElement as HTMLElement | null;
      const tagName = activeElement?.tagName;
      if (tagName === 'INPUT' || tagName === 'TEXTAREA') return;

      if (event.code === 'Enter') {
        event.preventDefault();
        if (sentencePracticeMode === 'builder') {
          handleSentenceCheckAnswer();
          return;
        }

        if (sentencePracticeMode === 'listen') {
          handleSentenceListenCheck();
          return;
        }

        if (sentencePracticeMode === 'translate') {
          handleSentenceTranslateCheck();
        }
        return;
      }

      if (sentencePracticeMode !== 'builder') {
        return;
      }

      if (event.code === 'Backspace') {
        event.preventDefault();
        handleSentenceRemoveLastTile();
        return;
      }

      if (event.code === 'KeyH') {
        event.preventDefault();
        handleUseSentenceHint();
        return;
      }

      if (event.code === 'KeyS') {
        event.preventDefault();
        handleSentenceShuffleWords();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    visible,
    currentLessonType,
    sentenceSessionCompleted,
    sentencePracticeMode,
    sentenceAnswerTiles,
    sentenceListenInput,
    sentenceTranslateSelection,
    sentenceFeedbackState,
    sentenceBankTiles,
    sentenceCurrentLevel
  ]);

  useEffect(() => {
    if (currentLessonType !== 'quiz') return;
    if (currentQuestionIndex < activeQuizQuestions.length) return;
    setCurrentQuestionIndex(0);
  }, [currentLessonType, currentQuestionIndex, activeQuizQuestions.length]);

  useEffect(() => {
    return () => {
      if ((window as Window & { speechSynthesis?: SpeechSynthesis }).speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const handlePlayQuizPromptAudio = (text: string) => {
    const normalizedText = text.trim();
    if (!normalizedText) {
      setQuizAudioStatus('Không có nội dung audio cho câu này.');
      return;
    }

    const speechSynthesisApi = (window as Window & { speechSynthesis?: SpeechSynthesis })
      .speechSynthesis;

    if (!speechSynthesisApi) {
      setQuizAudioStatus('Trình duyệt không hỗ trợ Text-to-Speech.');
      return;
    }

    const utterance = new SpeechSynthesisUtterance(normalizedText);
    utterance.lang = 'en-US';
    utterance.rate = 0.95;
    utterance.onstart = () => setQuizAudioStatus('Đang phát audio...');
    utterance.onend = () => setQuizAudioStatus('Đã phát xong audio.');
    utterance.onerror = () => setQuizAudioStatus('Không thể phát audio cho câu này.');

    speechSynthesisApi.cancel();
    speechSynthesisApi.speak(utterance);
  };

  const handleStartQuiz = () => {
    if (activeQuizQuestions.length === 0) {
      setShareFeedback('Bài kiểm tra này chưa có dữ liệu câu hỏi.');
      return;
    }

    const quizStartTimestamp = Date.now();

    setIsQuizStarted(true);
    setCurrentQuestionIndex(0);
    setQuizAnswers({});
    setIsQuizSubmitted(false);
    setQuizStartedAt(quizStartTimestamp);
    setQuizDurationSeconds(0);
    setQuizResultViewMode('summary');
    setQuizAudioStatus(null);
    setQuizPendingMatchLeft(null);
    setQuizFillBlankHintUses(0);
    setQuizFillBlankHints({});
    setShareFeedback(null);
    resetCompletionFlow();
  };

  const handleQuizAnswer = (questionId: string, answer: string | string[]) => {
    setQuizAnswers((prev) => ({
      ...prev,
      [questionId]: answer
    }));
    setQuizAudioStatus(null);
    setQuizPendingMatchLeft(null);
  };

  const handleUseQuizFillBlankHint = (question: QuizQuestion) => {
    if (question.type !== 'fill-blank') return;
    if (quizFillBlankHints[question.id]) return;
    if (quizFillBlankHintUses >= quizFillBlankHintLimit) return;

    const correctAnswerValue =
      typeof question.correctAnswer === 'string' ? question.correctAnswer : question.correctAnswer[0] || '';

    setQuizFillBlankHints((prev) => ({
      ...prev,
      [question.id]: buildQuizFillBlankHintText(correctAnswerValue)
    }));
    setQuizFillBlankHintUses((prev) => prev + 1);
  };

  const handleQuizMatchPairSelectLeft = (leftValue: string) => {
    setQuizPendingMatchLeft((prev) => (prev === leftValue ? null : leftValue));
  };

  const handleQuizMatchPairConnect = (question: QuizQuestion, rightValue: string) => {
    if (!quizPendingMatchLeft) return;

    const currentPairs = parseQuizMatchPairAnswers(
      Array.isArray(quizAnswers[question.id]) ? (quizAnswers[question.id] as string[]) : []
    );

    const nextPairs = [
      ...currentPairs.filter(
        (pair) => pair.left !== quizPendingMatchLeft && pair.right !== rightValue
      ),
      { left: quizPendingMatchLeft, right: rightValue }
    ];

    handleQuizAnswer(question.id, serializeQuizMatchPairAnswers(nextPairs));
  };

  const handleQuizMatchPairClear = (question: QuizQuestion, leftValue: string) => {
    const currentPairs = parseQuizMatchPairAnswers(
      Array.isArray(quizAnswers[question.id]) ? (quizAnswers[question.id] as string[]) : []
    );

    const nextPairs = currentPairs.filter((pair) => pair.left !== leftValue);
    handleQuizAnswer(question.id, serializeQuizMatchPairAnswers(nextPairs));
  };

  const handleQuizMatchPairClearAll = (questionId: string) => {
    handleQuizAnswer(questionId, []);
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < activeQuizQuestions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
      setQuizAudioStatus(null);
      setQuizPendingMatchLeft(null);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
      setQuizAudioStatus(null);
      setQuizPendingMatchLeft(null);
    }
  };

  const handleSubmitQuiz = () => {
    const completedAt = Date.now();
    const elapsedSeconds = quizStartedAt
      ? Math.max(1, Math.round((completedAt - quizStartedAt) / 1000))
      : 0;
    const normalizedName = `${accountDisplayName}`.trim() || 'Learner';

    const entry: QuizLeaderboardEntry = {
      id: `${completedAt}-${Math.random().toString(36).slice(2, 8)}`,
      playerName: normalizedName,
      scorePercent: scoreSummary.scorePercent,
      scorePoints: scoreSummary.scorePoints,
      correctAnswers: scoreSummary.correctAnswers,
      totalQuestions: scoreSummary.totalQuestions,
      completionSeconds: elapsedSeconds,
      completedAt
    };

    const nextLeaderboard = sortLeaderboard([entry, ...leaderboardEntries]).slice(
      0,
      MAX_LEADERBOARD_ENTRIES
    );

    setPlayerName(normalizedName);
    setQuizDurationSeconds(elapsedSeconds);
    setLeaderboardEntries(nextLeaderboard);

    try {
      localStorage.setItem(quizLeaderboardStorageKey, JSON.stringify(nextLeaderboard));
    } catch {
      // Ignore localStorage write failures.
    }

    setQuizResultViewMode('summary');
    setQuizAudioStatus(null);
    setQuizPendingMatchLeft(null);
    setShareFeedback(null);
    setIsQuizSubmitted(true);
  };

  const handleShareScore = async () => {
    const shareText = `${playerName || 'Learner'} vừa hoàn thành ${activeQuizConfig.title}: ${scoreSummary.scorePoints}/100 điểm (${scoreSummary.correctAnswers}/${scoreSummary.totalQuestions} câu đúng), thời gian ${formatDuration(quizDurationSeconds)}.`;

    try {
      if (navigator.share) {
        await navigator.share({
          title: `${activeQuizConfig.title} Result`,
          text: shareText
        });
        setShareFeedback('Đã mở chia sẻ điểm số.');
        return;
      }

      await navigator.clipboard.writeText(shareText);
      setShareFeedback('Đã copy điểm số vào clipboard.');
    } catch {
      setShareFeedback('Không thể chia sẻ lúc này.');
    }
  };

  const renderFlashcardFlipFace = (face: 'front' | 'back') => {
    if (!currentFlashcard) return null;

    const isBackFace = face === 'back';
    const guidePanelId = isBackFace
      ? 'flashcard-guide-panel-active-back'
      : 'flashcard-guide-panel-active-front';

    return (
      <div
        className={`absolute inset-0 ${isBackFace ? '[transform:rotateY(180deg)]' : ''}`}
        style={{
          backfaceVisibility: 'hidden',
          WebkitBackfaceVisibility: 'hidden'
        }}
      >
        <div className="relative h-full rounded-[26px] border border-white/15 bg-gradient-to-br from-slate-900/65 via-slate-800/75 to-slate-900/65 p-4 md:p-6">
          <div className="absolute left-4 top-4 z-20">
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                handleFlashcardToggleGuide();
              }}
              aria-expanded={isFlashcardGuideVisible}
              aria-controls={guidePanelId}
              aria-label="Bật hoặc tắt hướng dẫn nút"
              className={`h-9 w-9 rounded-full border transition-all ${
                isFlashcardGuideVisible
                  ? 'border-cyan-300/70 bg-cyan-500/20 text-cyan-100'
                  : 'border-white/20 bg-white/5 text-white/70 hover:bg-white/10'
              } ${FLASHCARD_FOCUS_VISIBLE_CLASS}`}
            >
              <i className={`fas ${isFlashcardGuideVisible ? 'fa-xmark' : 'fa-gear'}`}></i>
            </button>
          </div>

          {isFlashcardGuideVisible && (
            <div
              id={guidePanelId}
              onClick={(event) => event.stopPropagation()}
              className="absolute left-4 top-14 z-20 w-[min(300px,calc(100%-2rem))] rounded-xl border border-white/20 bg-black/70 backdrop-blur-md p-3 text-left"
            >
              <p className="text-[11px] uppercase tracking-wide text-white/90 font-semibold mb-2">
                Hướng dẫn nút thao tác
              </p>
              <ul className="space-y-1.5 text-xs text-white/80">
                <li><span className="text-white/90">Space / Enter</span>: lật thẻ</li>
                <li><span className="text-white/90">Arrow Left / Right</span>: chuyển thẻ</li>
                <li><span className="text-white/90">A</span>: phát audio</li>
                <li><span className="text-white/90">R</span>: xáo trộn thẻ còn lại</li>
                <li><span className="text-white/90">Esc</span>: đóng thông báo và panel</li>
                <li className="text-white/65">Touch: vuốt phải Previous • vuốt trái Next</li>
              </ul>
            </div>
          )}

          <div className="mx-auto flex h-full max-w-3xl flex-col items-center justify-center text-center">
            <div className="mt-3 w-full border-t border-white/15 pt-3">
              <p className="text-xs uppercase tracking-wide text-white/60 mb-2">
                {isBackFace
                  ? `Reveal (${currentFlashcard.revealLabel})`
                  : `Ask (${currentFlashcard.askLabel})`}
              </p>

              <p className="text-white font-semibold text-xl md:text-3xl leading-tight max-h-40 overflow-y-auto px-1">
                {isBackFace ? currentFlashcard.revealValue : currentFlashcard.askValue}
              </p>

              {isBackFace ? (
                <p className="mt-3 text-sm text-white/70 leading-relaxed max-h-16 overflow-y-auto px-1">
                  {currentFlashcard.askLabel}: {currentFlashcard.askValue}
                </p>
              ) : (
                <p className="mt-3 text-sm text-white/55">Nhấn Space / Enter hoặc click để lật thẻ.</p>
              )}
            </div>
          </div>

          <div className="absolute bottom-4 right-4 flex items-center gap-2">
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                handleFlashcardToggleAutoSpeak();
              }}
              aria-label="Toggle auto audio"
              aria-pressed={flashcardAutoSpeakEnabled}
              className={`h-9 w-16 rounded-full border transition-all px-1 ${
                flashcardAutoSpeakEnabled
                  ? 'border-emerald-300/70 bg-emerald-500/20'
                  : 'border-white/20 bg-white/5'
              } ${FLASHCARD_FOCUS_VISIBLE_CLASS}`}
            >
              <span
                className={`h-7 w-7 rounded-full block transition-all ${
                  flashcardAutoSpeakEnabled
                    ? 'bg-emerald-200 translate-x-7'
                    : 'bg-white/75 translate-x-0'
                }`}
              ></span>
            </button>

            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                handleFlashcardSpeakCurrent();
              }}
              aria-label="Speak current flashcard"
              className={`h-9 w-9 rounded-full border border-white/20 bg-white/5 text-white/80 hover:bg-white/10 transition-all ${FLASHCARD_FOCUS_VISIBLE_CLASS}`}
            >
              <i className="fas fa-volume-up"></i>
            </button>
          </div>
        </div>
      </div>
    );
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-6xl h-[90vh] backdrop-blur-[20px] bg-white/10 border border-white/20 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/20">
          <div className="flex items-center gap-4">
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/20 transition-colors text-white/80 hover:text-white">
              <i className="fas fa-times"></i>
            </button>
            <div>
              <h2 className="text-2xl font-bold text-white">
                {selectedCourse
                  ? `${selectedCourse.name} : Learn - Review - Assessment`
                  : 'Module 1 : Learn - Review - Assessment'}
              </h2>
              <div className="flex gap-4 mt-1 text-sm text-white/70 flex-wrap">
                {selectedCourse && (
                  <span className="flex items-center gap-1">
                    <i className="fas fa-book-open"></i>
                    {selectedCourse.moduleCount} lessons synced from map
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <i className="fas fa-seedling"></i>
                  I. Học mới (Learn)
                </span>
                <span className="flex items-center gap-1">
                  <i className="fas fa-repeat"></i>
                  II. Ôn tập (Review)
                </span>
                <span className="flex items-center gap-1">
                  <i className="fas fa-clipboard-check"></i>
                  III. Quiz / Kiểm tra
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-semibold">
            <span className="px-3 py-1.5 rounded-full border border-rose-400/40 bg-rose-500/10 text-rose-100 flex items-center gap-1.5">
              <i className="fas fa-heart text-rose-300"></i>
              {heartsRemaining}/{MAX_HEARTS}
            </span>
            <span className="px-3 py-1.5 rounded-full border border-cyan-400/40 bg-cyan-500/10 text-cyan-100 flex items-center gap-1.5">
              <i className="fas fa-gem text-cyan-200"></i>
              {learningEconomy.gems}
            </span>
            <span className="px-3 py-1.5 rounded-full border border-amber-400/40 bg-amber-500/10 text-amber-100 flex items-center gap-1.5">
              <i className="fas fa-fire text-amber-200"></i>
              {learningEconomy.streakDays}
            </span>
          </div>
        </div>

        <div className="flex-1 flex overflow-hidden">
          <div className="flex-1 overflow-y-auto scrollbar-none">
            <div className="p-6">
              <div className="mb-4 space-y-3">
                <div className="relative px-1">
                  <div className="h-4 rounded-full border border-white/15 bg-white/10 overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500"
                      initial={{ width: '0%' }}
                      animate={{ width: `${moduleProgressPercentSafe}%` }}
                      transition={{ duration: 0.45, ease: 'easeOut' }}
                    />
                  </div>

                  <motion.div
                    className={`absolute -right-1 top-1/2 z-20 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-xl border ${
                      isModuleProgressCompleted
                        ? 'border-amber-300/90 bg-amber-400/30 text-amber-100'
                        : 'border-white/25 bg-slate-800/70 text-white/70'
                    }`}
                    animate={
                      isModuleProgressCompleted
                        ? { scale: [1, 1.12, 1], rotate: [0, -7, 7, 0] }
                        : { scale: 1, rotate: 0 }
                    }
                    transition={
                      isModuleProgressCompleted
                        ? { duration: 0.9, repeat: Infinity }
                        : { duration: 0.2 }
                    }
                    title={isModuleProgressCompleted ? 'Đã chạm rương thưởng' : 'Rương thưởng ở cuối thanh'}
                  >
                    <i className={`fas ${isModuleProgressCompleted ? 'fa-box-open' : 'fa-box'}`}></i>
                  </motion.div>
                </div>

                <div className="mt-3 text-center">
                  <motion.p
                    key={currentStep}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="text-white/90 font-medium text-sm"
                  >
                    Bài {currentStep}/{totalSteps} ({moduleProgressPercentSafe}%): {currentLesson.title}
                  </motion.p>
                </div>
              </div>

              {currentLessonType === 'document' && (
                <div className="bg-black/20 backdrop-blur-sm rounded-xl p-6 mb-4 border border-white/10 space-y-5">
                  <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div>
                      <h3 className="text-xl font-semibold text-white">{currentDocument.title}</h3>
                      <p className="text-sm text-white/60 mt-1">
                        {currentDocument.readingTime} • {currentDocument.pages} trang
                      </p>
                    </div>
                    <button
                      onClick={() => handleDownloadDocument(currentLesson.id)}
                      className="px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-400/40 text-blue-200 rounded-lg transition-colors flex items-center gap-2"
                    >
                      <i className="fas fa-download"></i>
                      <span>Tải tài liệu</span>
                    </button>
                  </div>

                  <div className="rounded-lg bg-white/5 border border-white/10 p-4 text-white/80 text-sm leading-relaxed">
                    {currentDocument.overview}
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                      <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
                        <i className="fas fa-bullseye text-purple-300"></i>
                        Mục tiêu bài học
                      </h4>
                      <ul className="space-y-2 text-sm text-white/80">
                        {currentDocument.objectives.map((objective, index) => (
                          <li key={objective} className="flex items-start gap-2">
                            <span className="text-purple-300 mt-0.5">{index + 1}.</span>
                            <span>{objective}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                      <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
                        <i className="fas fa-tasks text-emerald-300"></i>
                        Bài tập tự luyện
                      </h4>
                      <ul className="space-y-2 text-sm text-white/80">
                        {currentDocument.practiceTasks.map((task, index) => (
                          <li key={task} className="flex items-start gap-2">
                            <i className="fas fa-check text-emerald-400 mt-1 text-xs"></i>
                            <span>
                              {index + 1}. {task}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {currentDocument.sections.map((section) => (
                      <div key={section.heading} className="bg-white/5 rounded-lg p-4 border border-white/10">
                        <h5 className="text-white font-semibold mb-2">{section.heading}</h5>
                        <p className="text-sm text-white/80 leading-relaxed">{section.content}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {currentLessonType === 'flashcard' && (
                <div className="bg-black/20 backdrop-blur-sm rounded-xl p-6 mb-4 border border-white/10">
                  {!isFlashcardStarted ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between pb-4 border-b border-white/20">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-lg bg-amber-500/20 flex items-center justify-center">
                            <i className="fas fa-clone text-amber-300 text-xl"></i>
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-white">Flashcard Training (OpenQuiz style)</h3>
                            <p className="text-sm text-white/60">Card focus + previous/next + keyboard shortcuts</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="px-3 py-1 bg-amber-500/20 text-amber-300 rounded-full text-xs font-medium">
                            {flashcardDeck.length} thẻ
                          </span>

                          <button
                            type="button"
                            onClick={handleFlashcardToggleGuide}
                            aria-expanded={isFlashcardGuideVisible}
                            aria-controls="flashcard-guide-panel-start"
                            aria-label="Bật hoặc tắt hướng dẫn nút"
                            className={`h-8 w-8 rounded-full border transition-all ${
                              isFlashcardGuideVisible
                                ? 'border-cyan-300/70 bg-cyan-500/20 text-cyan-100'
                                : 'border-white/20 bg-white/5 text-white/70 hover:bg-white/10'
                            } ${FLASHCARD_FOCUS_VISIBLE_CLASS}`}
                          >
                            <i className={`fas ${isFlashcardGuideVisible ? 'fa-xmark' : 'fa-gear'}`}></i>
                          </button>
                        </div>
                      </div>

                      <div className="bg-white/5 rounded-lg p-4 border border-white/10 space-y-3">
                        <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                          <i className="fas fa-layer-group text-amber-300"></i>
                          Chọn preset (giữ nền hiện tại, lấy interaction kiểu OpenQuiz)
                        </h4>

                        <div className="flex flex-wrap gap-2">
                          {FLASHCARD_PRESETS.map((preset) => (
                            <button
                              key={preset.id}
                              type="button"
                              onClick={() => setSelectedFlashcardPresetId(preset.id)}
                              className={`px-3 py-2 rounded-lg text-xs font-semibold transition-all border ${
                                preset.id === selectedFlashcardPresetId
                                  ? 'bg-amber-500/25 border-amber-400/60 text-amber-100'
                                  : 'bg-white/5 border-white/20 text-white/80 hover:bg-white/10'
                              } ${FLASHCARD_FOCUS_VISIBLE_CLASS} active:scale-[0.98]`}
                            >
                              {preset.name}
                            </button>
                          ))}
                        </div>

                        <p className="text-xs text-white/65">{selectedFlashcardPreset.description}</p>
                      </div>

                      {isFlashcardGuideVisible && (
                        <div
                          id="flashcard-guide-panel-start"
                          className="bg-white/5 rounded-lg p-4 border border-white/10"
                        >
                          <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                            <i className="fas fa-keyboard text-blue-300"></i>
                            Hướng dẫn nút điều khiển
                          </h4>
                          <ul className="space-y-2 text-sm text-white/80">
                            <li className="flex items-center justify-between gap-3">
                              <span>Lật thẻ</span>
                              <kbd className="px-2 py-1 rounded bg-white/10 border border-white/20 text-xs">Space / Enter</kbd>
                            </li>
                            <li className="flex items-center justify-between gap-3">
                              <span>Thẻ trước</span>
                              <kbd className="px-2 py-1 rounded bg-white/10 border border-white/20 text-xs">Arrow Left</kbd>
                            </li>
                            <li className="flex items-center justify-between gap-3">
                              <span>Thẻ sau</span>
                              <kbd className="px-2 py-1 rounded bg-white/10 border border-white/20 text-xs">Arrow Right</kbd>
                            </li>
                            <li className="flex items-center justify-between gap-3">
                              <span>Phát audio thẻ hiện tại</span>
                              <kbd className="px-2 py-1 rounded bg-white/10 border border-white/20 text-xs">A</kbd>
                            </li>
                            <li className="flex items-center justify-between gap-3">
                              <span>Xáo trộn phần thẻ còn lại</span>
                              <kbd className="px-2 py-1 rounded bg-white/10 border border-white/20 text-xs">R</kbd>
                            </li>
                            <li className="flex items-center justify-between gap-3">
                              <span>Xóa thông báo</span>
                              <kbd className="px-2 py-1 rounded bg-white/10 border border-white/20 text-xs">Esc</kbd>
                            </li>
                            <li className="flex items-center justify-between gap-3">
                              <span>Touch gesture</span>
                              <span className="text-xs text-white/60">Vuốt phải Previous • Vuốt trái Next</span>
                            </li>
                          </ul>
                        </div>
                      )}

                      {flashcardFeedback && (
                        <p className="text-sm text-white/75 text-center">{flashcardFeedback}</p>
                      )}

                      {flashcardError && (
                        <div className="rounded-lg border border-red-400/50 bg-red-500/10 px-4 py-3 text-sm text-red-100 text-center">
                          {flashcardError}
                        </div>
                      )}

                      <div className="flex items-center justify-center pt-1">
                        <button
                          type="button"
                          onClick={handleStartFlashcardStudy}
                          disabled={isFlashcardLoading || flashcardDeck.length === 0}
                          className={`px-8 py-3 rounded-xl transition-all font-semibold text-base flex items-center gap-3 shadow-lg ${FLASHCARD_FOCUS_VISIBLE_CLASS} active:scale-[0.98] ${
                            isFlashcardLoading || flashcardDeck.length === 0
                              ? 'bg-white/10 text-white/50 cursor-not-allowed shadow-none'
                              : 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white hover:shadow-xl hover:scale-105'
                          }`}
                        >
                          <i className={`fas ${isFlashcardLoading ? 'fa-spinner fa-spin' : 'fa-play-circle'}`}></i>
                          <span>{isFlashcardLoading ? 'Đang tải bộ thẻ...' : 'Bắt đầu Flashcard'}</span>
                        </button>
                      </div>
                    </div>
                  ) : isFlashcardCompleted ? (
                    <div className="space-y-5">
                      <div className="bg-white/5 rounded-xl border border-white/10 p-5">
                        <div className="text-center">
                          <h3 className="text-2xl font-bold text-white mb-2">Flashcard Session Completed</h3>
                          <p className="text-white/70">Bạn đã hoàn tất phiên flashcard theo preset {selectedFlashcardPreset.name}</p>
                        </div>

                        <div className="mt-5 grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                          <div className="rounded-lg bg-white/5 border border-white/10 p-3">
                            <p className="text-white/60">Tổng thẻ</p>
                            <p className="text-white font-semibold">{flashcardSessionTotal}</p>
                          </div>
                          <div className="rounded-lg bg-cyan-500/10 border border-cyan-500/30 p-3">
                            <p className="text-white/60">Đã xem</p>
                            <p className="text-cyan-200 font-semibold">{flashcardReviewedCount}</p>
                          </div>
                          <div className="rounded-lg bg-white/5 border border-white/10 p-3">
                            <p className="text-white/60">Hoàn tất</p>
                            <p className="text-white font-semibold">{flashcardProgressPercent}%</p>
                          </div>
                        </div>
                      </div>

                      <div className="grid sm:grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={handleRestartAllFlashcards}
                          disabled={isFlashcardLoading}
                          className={`px-4 py-3 rounded-lg transition-all font-semibold text-sm flex items-center justify-center gap-2 ${
                            isFlashcardLoading
                              ? 'bg-white/5 text-white/40 cursor-not-allowed'
                              : 'bg-white/10 hover:bg-white/20 text-white'
                          } ${FLASHCARD_FOCUS_VISIBLE_CLASS} active:scale-[0.98]`}
                        >
                          <i className="fas fa-rotate-left"></i>
                          <span>Làm lại toàn bộ</span>
                        </button>

                        <button
                          type="button"
                          onClick={handleMoveToQuizFromFlashcard}
                          className={`px-4 py-3 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white rounded-lg transition-all font-semibold text-sm flex items-center justify-center gap-2 ${FLASHCARD_FOCUS_VISIBLE_CLASS} active:scale-[0.98]`}
                        >
                          <i className="fas fa-clipboard-check"></i>
                          <span>Chuyển sang Quiz</span>
                        </button>
                      </div>

                      {flashcardFeedback && (
                        <p className="text-sm text-white/75 text-center">{flashcardFeedback}</p>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-5">
                      <div className="rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-xs text-white/75 space-y-2">
                        <div className="flex items-center justify-between gap-3 flex-wrap">
                          <span>Bấm bánh răng để mở hướng dẫn nút thao tác</span>
                          <span>
                            Card {Math.min(flashcardCursor + 1, flashcardSessionTotal)} / {flashcardSessionTotal}
                          </span>
                        </div>

                        <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-300"
                            style={{ width: `${flashcardProgressPercent}%` }}
                          ></div>
                        </div>

                        <div className="flex items-center justify-between gap-2 text-[11px] text-white/60 flex-wrap">
                          <span>{flashcardReviewedCount}/{flashcardSessionTotal} thẻ đã xem</span>
                          <span>{flashcardRemainingCount} thẻ còn lại</span>
                        </div>
                      </div>

                      {isFlashcardLoading ? (
                        <div className="rounded-[26px] border border-white/15 bg-gradient-to-r from-amber-500/10 to-orange-500/10 p-7 text-center min-h-[332px] flex flex-col items-center justify-center">
                          <i className="fas fa-spinner fa-spin text-amber-200 text-2xl"></i>
                          <p className="text-sm text-white/80 mt-3">Đang tải thẻ học...</p>
                        </div>
                      ) : flashcardError ? (
                        <div className="rounded-[26px] border border-red-400/45 bg-red-500/10 p-7 text-center space-y-3 min-h-[332px] flex flex-col items-center justify-center">
                          <p className="text-sm text-red-100">{flashcardError}</p>
                          <button
                            type="button"
                            onClick={handleRestartAllFlashcards}
                            className={`px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm font-semibold transition-all ${FLASHCARD_FOCUS_VISIBLE_CLASS} active:scale-[0.98]`}
                          >
                            Tải lại phiên flashcard
                          </button>
                        </div>
                      ) : currentFlashcard ? (
                        <div className="relative w-full" style={{ perspective: '1000px' }}>
                          <button
                            type="button"
                            onClick={handleFlashcardReveal}
                            onTouchStart={(event) => {
                              setFlashcardTouchStartX(event.changedTouches[0]?.clientX ?? null);
                              setFlashcardTouchCurrentX(event.changedTouches[0]?.clientX ?? null);
                            }}
                            onTouchMove={(event) => {
                              setFlashcardTouchCurrentX(event.changedTouches[0]?.clientX ?? null);
                            }}
                            onTouchEnd={(event) => {
                              if (flashcardTouchStartX === null || flashcardTouchCurrentX === null) {
                                return;
                              }

                              const swipeDeltaX = flashcardTouchCurrentX - flashcardTouchStartX;
                              clearFlashcardTouchTracking();

                              if (Math.abs(swipeDeltaX) < FLASHCARD_SWIPE_THRESHOLD_PX) return;

                              if (swipeDeltaX > 0) {
                                event.preventDefault();
                                handleFlashcardPrevious();
                                return;
                              }

                              event.preventDefault();
                              handleFlashcardNext();
                            }}
                            className={`relative w-full rounded-[26px] ${FLASHCARD_FOCUS_VISIBLE_CLASS} active:scale-[0.99] h-[404px] md:h-[432px]`}
                            style={{
                              transform: `translateX(${Math.max(-24, Math.min(24, flashcardSwipeOffset * 0.08))}px) rotateY(${isFlashcardRevealed ? 180 : 0}deg)`,
                              transformStyle: 'preserve-3d',
                              transition: 'transform 0.6s ease'
                            }}
                          >
                            {renderFlashcardFlipFace('front')}
                            {renderFlashcardFlipFace('back')}
                          </button>
                        </div>
                      ) : (
                        <div className="rounded-xl border border-white/15 bg-white/5 p-5 text-white/70 text-sm">
                          Không tìm thấy thẻ trong phiên học hiện tại.
                        </div>
                      )}

                      <div className="grid grid-cols-3 gap-3">
                        <button
                          type="button"
                          onClick={handleFlashcardPrevious}
                          disabled={flashcardCursor === 0 || isFlashcardLoading || !!flashcardError}
                          className={`px-4 py-3 rounded-lg transition-all font-semibold text-sm flex items-center justify-center gap-2 ${
                            flashcardCursor === 0 || isFlashcardLoading || !!flashcardError
                              ? 'bg-white/5 text-white/40 cursor-not-allowed'
                              : 'bg-white/10 hover:bg-white/20 text-white'
                          } ${FLASHCARD_FOCUS_VISIBLE_CLASS} active:scale-[0.98]`}
                        >
                          <i className="fas fa-arrow-left"></i>
                          <span>Previous</span>
                        </button>

                        <button
                          type="button"
                          onClick={handleFlashcardShuffleSession}
                          disabled={flashcardSessionTotal < 2 || isFlashcardLoading || !!flashcardError}
                          className={`px-4 py-3 rounded-lg transition-all font-semibold text-sm flex items-center justify-center gap-2 ${
                            flashcardSessionTotal < 2 || isFlashcardLoading || !!flashcardError
                              ? 'bg-white/5 text-white/40 cursor-not-allowed'
                              : 'bg-white/10 hover:bg-white/20 text-white'
                          } ${FLASHCARD_FOCUS_VISIBLE_CLASS} active:scale-[0.98]`}
                        >
                          <i className="fas fa-random"></i>
                          <span>Shuffle</span>
                        </button>

                        <button
                          type="button"
                          onClick={handleFlashcardNext}
                          disabled={!currentFlashcard || isFlashcardLoading || !!flashcardError}
                          className={`px-4 py-3 rounded-lg transition-all font-semibold text-sm flex items-center justify-center gap-2 ${
                            !currentFlashcard || isFlashcardLoading || !!flashcardError
                              ? 'bg-white/5 text-white/40 cursor-not-allowed'
                              : 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-100'
                          } ${FLASHCARD_FOCUS_VISIBLE_CLASS} active:scale-[0.98]`}
                        >
                          <span>Next</span>
                          <i className="fas fa-arrow-right"></i>
                        </button>
                      </div>

                      <div className="flex items-center justify-center gap-2 flex-wrap">
                        {flashcardSessionCards.map((card, index) => {
                          const isCurrent = index === flashcardCursor;
                          const passed = index < flashcardCursor;
                          const dotColorClass =
                            FLASHCARD_PROGRESS_DOT_COLORS[index % FLASHCARD_PROGRESS_DOT_COLORS.length];

                          const dotClass = isCurrent
                            ? 'w-8 bg-white'
                            : passed
                            ? `w-3 ${dotColorClass}`
                            : 'w-2.5 bg-white/25 hover:bg-white/40';

                          return (
                            <button
                              key={card.id}
                              type="button"
                              onClick={() => handleFlashcardJumpToCard(index)}
                              disabled={isFlashcardLoading || !!flashcardError}
                              title={`Card ${index + 1}`}
                              className={`h-2.5 rounded-full transition-all ${dotClass} ${FLASHCARD_FOCUS_VISIBLE_CLASS}`}
                              aria-label={`Card ${index + 1}`}
                            ></button>
                          );
                        })}
                      </div>

                      {flashcardAudioStatus && (
                        <p className="text-xs text-cyan-100/90 text-center">{flashcardAudioStatus}</p>
                      )}

                      {flashcardFeedback && (
                        <p className="text-sm text-white/75 text-center">{flashcardFeedback}</p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {currentLessonType === 'sentence-builder' && (
                <div className="bg-black/20 backdrop-blur-sm rounded-xl p-6 mb-4 border border-white/10">
                  {sentenceSessionCompleted ? (
                    <div className="space-y-5">
                      <div className="rounded-xl border border-emerald-400/40 bg-emerald-500/10 p-6 text-center">
                        <div className="w-14 h-14 rounded-full mx-auto mb-3 bg-emerald-500/20 flex items-center justify-center">
                          <i className="fas fa-check text-emerald-200 text-2xl"></i>
                        </div>
                        <h3 className="text-2xl font-bold text-white">Sentence Builder Completed</h3>
                        <p className="text-sm text-white/70 mt-2">
                          Bạn đã hoàn thành tất cả level, bao gồm cả adaptive review cho những câu từng làm sai.
                        </p>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
                        <div className="rounded-lg bg-white/5 border border-white/10 p-3">
                          <p className="text-white/60">Mastered</p>
                          <p className="text-white font-semibold">
                            {sentenceMasteredCount}/{SENTENCE_BUILDER_LEVELS.length}
                          </p>
                        </div>
                        <div className="rounded-lg bg-cyan-500/10 border border-cyan-500/30 p-3">
                          <p className="text-white/60">XP</p>
                          <p className="text-cyan-200 font-semibold">{sentenceProgress.xp}</p>
                        </div>
                        <div className="rounded-lg bg-amber-500/10 border border-amber-500/30 p-3">
                          <p className="text-white/60">Coins</p>
                          <p className="text-amber-200 font-semibold">{sentenceProgress.coins}</p>
                        </div>
                        <div className="rounded-lg bg-indigo-500/10 border border-indigo-500/30 p-3">
                          <p className="text-white/60">Best Combo</p>
                          <p className="text-indigo-200 font-semibold">x{sentenceProgress.bestCombo}</p>
                        </div>
                        <div className="rounded-lg bg-white/5 border border-white/10 p-3">
                          <p className="text-white/60">Accuracy</p>
                          <p className="text-white font-semibold">{sentenceAccuracyPercent}%</p>
                        </div>
                      </div>

                      <div className="grid sm:grid-cols-3 gap-3">
                        <button
                          onClick={handleSentenceRestartSession}
                          className="px-4 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all font-semibold text-sm flex items-center justify-center gap-2"
                        >
                          <i className="fas fa-rotate-left"></i>
                          <span>Chơi lại session</span>
                        </button>

                        <button
                          onClick={handleSentenceResetProgress}
                          className="px-4 py-3 bg-red-500/20 hover:bg-red-500/30 text-red-100 rounded-lg transition-all font-semibold text-sm flex items-center justify-center gap-2"
                        >
                          <i className="fas fa-trash"></i>
                          <span>Reset tiến độ</span>
                        </button>

                        <button
                          onClick={handleMoveToQuizFromSentenceBuilder}
                          className="px-4 py-3 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white rounded-lg transition-all font-semibold text-sm flex items-center justify-center gap-2"
                        >
                          <i className="fas fa-clipboard-check"></i>
                          <span>Chuyển sang Quiz</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-5">
                      <div className="flex items-start justify-between gap-3 pb-4 border-b border-white/20 flex-wrap">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                            <i className="fas fa-puzzle-piece text-cyan-200 text-xl"></i>
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-white">Sentence Builder Focus</h3>
                            <p className="text-sm text-white/60">
                              Level {sentenceCurrentLevelNumber}/{SENTENCE_BUILDER_LEVELS.length} • {sentenceCurrentLevel?.topic}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 flex-wrap">
                          {sentenceCurrentLevel && (
                            <span
                              className={`px-3 py-1 text-xs rounded-full font-semibold ${
                                SENTENCE_DIFFICULTY_BADGE_CLASS[sentenceCurrentLevel.difficulty]
                              }`}
                            >
                              {SENTENCE_DIFFICULTY_LABELS[sentenceCurrentLevel.difficulty]}
                            </span>
                          )}

                          {sentencePracticeMode === 'builder' && (
                            <button
                              onClick={() => setSentenceShowTools((prev) => !prev)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                                sentenceShowTools
                                  ? 'bg-cyan-500/25 border-cyan-400/60 text-cyan-100'
                                  : 'bg-white/5 border-white/20 text-white/75 hover:bg-white/10'
                              }`}
                            >
                              {sentenceShowTools ? 'Ẩn công cụ' : 'Hiện công cụ'}
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-300"
                          style={{ width: `${sentenceLevelTrackPercent}%` }}
                        ></div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        {SENTENCE_PRACTICE_TABS.map((tab) => {
                          const isActiveTab = sentencePracticeMode === tab.id;

                          return (
                            <button
                              key={tab.id}
                              type="button"
                              onClick={() => setSentencePracticeMode(tab.id)}
                              className={`rounded-lg border px-3 py-2 text-left transition-all ${
                                isActiveTab
                                  ? 'bg-cyan-500/25 border-cyan-400/60 text-cyan-100'
                                  : 'bg-white/5 border-white/20 text-white/75 hover:bg-white/10'
                              }`}
                            >
                              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide">
                                <i className={tab.iconClass}></i>
                                <span>{tab.label}</span>
                              </div>
                              <p className="mt-1 text-[11px] text-white/65">{tab.description}</p>
                            </button>
                          );
                        })}
                      </div>

                      <div className={sentencePracticeMode === 'builder' ? 'space-y-5' : 'hidden'}>

                      <div
                        className={`rounded-xl border px-4 py-3 md:px-5 md:py-4 ${
                          !sentenceTimerEnabled
                            ? 'border-white/20 bg-white/5'
                            : sentenceTimeLeft <= 10
                            ? 'border-red-400/60 bg-red-500/15'
                            : sentenceTimeLeft <= 20
                            ? 'border-amber-400/60 bg-amber-500/15'
                            : 'border-cyan-400/40 bg-cyan-500/10'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3 flex-wrap">
                          <div>
                            <p className="text-[11px] uppercase tracking-wide text-white/65">Timer</p>
                            <p
                              className={`text-3xl md:text-4xl font-black tabular-nums leading-none ${
                                !sentenceTimerEnabled
                                  ? 'text-white/70'
                                  : sentenceTimeLeft <= 10
                                  ? 'text-red-200'
                                  : sentenceTimeLeft <= 20
                                  ? 'text-amber-200'
                                  : 'text-cyan-100'
                              }`}
                            >
                              {formatDuration(sentenceTimeLeft)}
                            </p>
                          </div>

                          <div className="text-right">
                            <p className="text-xs text-white/75">
                              {sentenceTimerEnabled ? 'Đang đếm giờ' : 'Timer đang tắt'}
                            </p>
                            {sentenceCurrentLevel && (
                              <p className="text-[11px] text-white/55 mt-0.5">
                                Giới hạn level: {formatDuration(sentenceCurrentLevel.timeLimitSeconds)}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>

                      {sentenceShowTools && (
                        <motion.div
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="rounded-lg border border-white/15 bg-white/5 p-4 space-y-4"
                        >
                          <div className="space-y-2">
                            <p className="text-xs uppercase tracking-wide text-white/60">Interaction Mode</p>
                            <div className="flex flex-wrap gap-2">
                              <button
                                onClick={() => setSentenceMode('click')}
                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                                  sentenceMode === 'click'
                                    ? 'bg-cyan-500/25 border-cyan-400/60 text-cyan-100'
                                    : 'bg-white/5 border-white/20 text-white/75 hover:bg-white/10'
                                }`}
                              >
                                Click Mode
                              </button>
                              <button
                                onClick={() => setSentenceMode('drag')}
                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                                  sentenceMode === 'drag'
                                    ? 'bg-cyan-500/25 border-cyan-400/60 text-cyan-100'
                                    : 'bg-white/5 border-white/20 text-white/75 hover:bg-white/10'
                                }`}
                              >
                                Drag Mode
                              </button>
                              <button
                                onClick={() => setSentenceTimerEnabled((prev) => !prev)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                                  sentenceTimerEnabled
                                    ? 'bg-purple-500/20 border-purple-400/50 text-purple-100'
                                    : 'bg-white/5 border-white/20 text-white/75 hover:bg-white/10'
                                }`}
                              >
                                Timer {sentenceTimerEnabled ? 'ON' : 'OFF'}
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      )}

                      <motion.div
                        className={`rounded-xl border p-4 md:p-5 ${
                          sentenceFeedbackState === 'correct'
                            ? 'border-green-400/60 bg-green-500/10'
                            : sentenceFeedbackState === 'incorrect' || sentenceFeedbackState === 'timeout'
                            ? 'border-red-400/60 bg-red-500/10'
                            : 'border-white/20 bg-white/5'
                        }`}
                        animate={
                          sentenceFeedbackState === 'correct'
                            ? {
                                scale: [1, 1.02, 1],
                                boxShadow: [
                                  '0 0 0 rgba(34,197,94,0)',
                                  '0 0 26px rgba(34,197,94,0.35)',
                                  '0 0 0 rgba(34,197,94,0)'
                                ]
                              }
                            : sentenceFeedbackState === 'incorrect' || sentenceFeedbackState === 'timeout'
                            ? { x: [0, -10, 10, -8, 8, -4, 4, 0] }
                            : { x: 0, scale: 1, boxShadow: '0 0 0 rgba(0,0,0,0)' }
                        }
                        transition={{ duration: 0.5 }}
                        onDragOver={(event) => {
                          if (sentenceMode !== 'drag') return;
                          event.preventDefault();
                        }}
                        onDrop={(event) => {
                          if (sentenceMode !== 'drag') return;
                          event.preventDefault();
                          handleSentenceDropToAnswer();
                        }}
                      >
                        <p className="text-xs uppercase tracking-wide text-white/60 mb-3">Answer Line</p>

                        <div className="flex flex-wrap gap-2 min-h-[56px]">
                          {Array.from({ length: sentenceCurrentWords.length }).map((_, index) => {
                            const tile = sentenceAnswerTiles[index];

                            if (!tile) {
                              return (
                                <div
                                  key={`placeholder-${index}`}
                                  className={`h-11 min-w-[74px] px-3 rounded-2xl border border-dashed flex items-center justify-center text-xs ${
                                    sentenceWrongIndexSet.has(index) &&
                                    (sentenceFeedbackState === 'incorrect' || sentenceFeedbackState === 'timeout')
                                      ? 'border-red-400/70 text-red-200 bg-red-500/20'
                                      : 'border-white/25 text-white/45 bg-black/20'
                                  }`}
                                >
                                  {index + 1}
                                </div>
                              );
                            }

                            return (
                              <motion.button
                                key={tile.id}
                                type="button"
                                draggable={sentenceMode === 'drag'}
                                onDragStart={() => handleSentenceDragStart(tile.id)}
                                onDragOver={(event) => {
                                  if (sentenceMode !== 'drag') return;
                                  event.preventDefault();
                                }}
                                onDrop={(event) => {
                                  if (sentenceMode !== 'drag') return;
                                  event.preventDefault();
                                  handleSentenceDropToAnswer(index);
                                }}
                                onClick={() => handleSentenceTileRemove(tile.id)}
                                whileTap={{ scale: 0.95 }}
                                className={`h-11 px-4 rounded-2xl border text-sm font-semibold transition-all ${
                                  sentenceWrongIndexSet.has(index) &&
                                  (sentenceFeedbackState === 'incorrect' || sentenceFeedbackState === 'timeout')
                                    ? 'bg-red-500/20 border-red-400/70 text-red-100'
                                    : sentenceSelectedTileId === tile.id
                                    ? 'bg-cyan-500/25 border-cyan-400/70 text-cyan-100'
                                    : 'bg-white/10 border-white/20 text-white hover:bg-white/20'
                                }`}
                              >
                                {tile.word}
                              </motion.button>
                            );
                          })}
                        </div>
                      </motion.div>

                      <div
                        className="rounded-xl border border-white/20 bg-white/5 p-4"
                        onDragOver={(event) => {
                          if (sentenceMode !== 'drag') return;
                          event.preventDefault();
                        }}
                        onDrop={(event) => {
                          if (sentenceMode !== 'drag') return;
                          event.preventDefault();
                          handleSentenceDropToBank();
                        }}
                      >
                        <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
                          <p className="text-xs uppercase tracking-wide text-white/60">Word Bank</p>
                          <span className="text-xs text-white/60">{sentenceBankTiles.length} từ còn lại</span>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {sentenceBankTiles.map((tile) => {
                            const isHintTile = sentenceHintTileId === tile.id;
                            const isSelectedTile = sentenceSelectedTileId === tile.id;

                            return (
                              <motion.button
                                key={tile.id}
                                type="button"
                                draggable={sentenceMode === 'drag'}
                                onDragStart={() => handleSentenceDragStart(tile.id)}
                                onClick={() => handleSentenceTileSelect(tile.id)}
                                whileTap={{ scale: 0.95 }}
                                className={`h-11 px-4 rounded-2xl border text-sm font-semibold transition-all ${
                                  isHintTile
                                    ? 'bg-amber-500/20 border-amber-400/70 text-amber-100 ring-2 ring-amber-300/40'
                                    : isSelectedTile
                                    ? 'bg-cyan-500/20 border-cyan-400/70 text-cyan-100'
                                    : 'bg-white/10 border-white/20 text-white hover:bg-white/20'
                                }`}
                              >
                                {tile.word}
                              </motion.button>
                            );
                          })}

                          {sentenceBankTiles.length === 0 && (
                            <p className="text-sm text-white/60">Không còn từ trong ngân hàng. Nhấn Check để kiểm tra đáp án.</p>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <button
                          onClick={() => handleSentenceCheckAnswer()}
                          disabled={!sentenceCanCheck || isOutOfHearts}
                          className={`px-4 py-3 rounded-lg transition-all font-semibold text-sm flex items-center justify-center gap-2 ${
                            sentenceCanCheck && !isOutOfHearts
                              ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white'
                              : 'bg-white/5 text-white/40 cursor-not-allowed'
                          }`}
                        >
                          <i className="fas fa-check"></i>
                          <span>Check Answer</span>
                        </button>

                        <button
                          onClick={handleUseSentenceHint}
                          disabled={isOutOfHearts}
                          className={`px-4 py-3 rounded-lg transition-all font-semibold text-sm flex items-center justify-center gap-2 ${
                            isOutOfHearts
                              ? 'bg-white/5 text-white/40 cursor-not-allowed'
                              : 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-100'
                          }`}
                        >
                          <i className="fas fa-lightbulb"></i>
                          <span>Hint</span>
                        </button>

                        <button
                          onClick={handleSentenceSkipLevel}
                          disabled={isOutOfHearts}
                          className={`px-4 py-3 rounded-lg transition-all font-semibold text-sm flex items-center justify-center gap-2 ${
                            isOutOfHearts
                              ? 'bg-white/5 text-white/40 cursor-not-allowed'
                              : 'bg-rose-500/20 hover:bg-rose-500/30 text-rose-100'
                          }`}
                        >
                          <i className="fas fa-forward"></i>
                          <span>Bỏ qua</span>
                        </button>

                        <button
                          onClick={handleSentenceRemoveLastTile}
                          disabled={sentenceAnswerTiles.length === 0}
                          className={`px-4 py-3 rounded-lg transition-all font-semibold text-sm flex items-center justify-center gap-2 ${
                            sentenceAnswerTiles.length === 0
                              ? 'bg-white/5 text-white/40 cursor-not-allowed'
                              : 'bg-white/10 hover:bg-white/20 text-white'
                          }`}
                        >
                          <i className="fas fa-delete-left"></i>
                          <span>Undo</span>
                        </button>

                        <button
                          onClick={handleSentenceShuffleWords}
                          className="px-4 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all font-semibold text-sm flex items-center justify-center gap-2"
                        >
                          <i className="fas fa-shuffle"></i>
                          <span>Shuffle</span>
                        </button>

                        <button
                          onClick={handlePlaySentenceAudio}
                          className="px-4 py-3 bg-purple-500/20 hover:bg-purple-500/30 text-purple-100 rounded-lg transition-all font-semibold text-sm flex items-center justify-center gap-2"
                        >
                          <i className="fas fa-volume-high"></i>
                          <span>Play Audio</span>
                        </button>

                        <button
                          onClick={handleSentenceRetryCurrentLevel}
                          className="px-4 py-3 bg-red-500/20 hover:bg-red-500/30 text-red-100 rounded-lg transition-all font-semibold text-sm flex items-center justify-center gap-2"
                        >
                          <i className="fas fa-rotate-right"></i>
                          <span>Retry Level</span>
                        </button>

                        <button
                          onClick={refillHearts}
                          disabled={!isOutOfHearts}
                          className={`px-4 py-3 rounded-lg transition-all font-semibold text-sm flex items-center justify-center gap-2 ${
                            isOutOfHearts
                              ? 'bg-gradient-to-r from-rose-500/80 to-pink-500/80 hover:from-rose-500 hover:to-pink-500 text-white'
                              : 'bg-white/5 text-white/40 cursor-not-allowed'
                          }`}
                        >
                          <i className="fas fa-heart"></i>
                          <span>Nạp tim</span>
                        </button>
                      </div>

                      </div>

                      {sentencePracticeMode === 'listen' && (
                        <div className="rounded-xl border border-white/20 bg-white/5 p-4 md:p-5 space-y-4">
                          <div className="flex items-center justify-between gap-3 flex-wrap">
                            <p className="text-sm font-semibold text-white">Nghe câu tiếng Anh và gõ lại chính xác</p>
                            <span className="text-xs px-2.5 py-1 rounded-full border border-cyan-400/40 bg-cyan-500/15 text-cyan-100">
                              thưởng {SENTENCE_PRACTICE_BONUS_XP} XP
                            </span>
                          </div>

                          {sentenceCurrentLevel && (
                            <div className="rounded-lg border border-white/10 bg-black/20 p-3 text-sm">
                              <p className="text-[11px] uppercase tracking-wide text-white/55">Gợi ý nghĩa</p>
                              <p className="text-white/85 mt-1">{sentenceCurrentLevel.translation}</p>
                            </div>
                          )}

                          <textarea
                            value={sentenceListenInput}
                            onChange={(event) => {
                              setSentenceListenInput(event.target.value);
                              setSentenceListenStatus(null);
                            }}
                            placeholder="Nhập câu tiếng Anh bạn nghe được..."
                            className="w-full min-h-[112px] rounded-lg bg-black/20 border border-white/15 px-4 py-3 text-sm text-white outline-none focus:border-cyan-400/60"
                          />

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            <button
                              onClick={handlePlaySentenceAudio}
                              className="px-4 py-3 bg-purple-500/20 hover:bg-purple-500/30 text-purple-100 rounded-lg transition-all font-semibold text-sm flex items-center justify-center gap-2"
                            >
                              <i className="fas fa-volume-high"></i>
                              <span>Nghe lại</span>
                            </button>

                            <button
                              onClick={handleSentenceListenCheck}
                              disabled={isOutOfHearts}
                              className={`px-4 py-3 rounded-lg transition-all font-semibold text-sm flex items-center justify-center gap-2 ${
                                isOutOfHearts
                                  ? 'bg-white/5 text-white/40 cursor-not-allowed'
                                  : 'bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white'
                              }`}
                            >
                              <i className="fas fa-check"></i>
                              <span>Kiểm tra</span>
                            </button>

                            <button
                              onClick={() => {
                                setSentenceListenInput('');
                                setSentenceListenStatus(null);
                              }}
                              className="px-4 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all font-semibold text-sm flex items-center justify-center gap-2"
                            >
                              <i className="fas fa-eraser"></i>
                              <span>Xóa</span>
                            </button>

                            <button
                              onClick={refillHearts}
                              disabled={!isOutOfHearts}
                              className={`px-4 py-3 rounded-lg transition-all font-semibold text-sm flex items-center justify-center gap-2 ${
                                isOutOfHearts
                                  ? 'bg-gradient-to-r from-rose-500/80 to-pink-500/80 hover:from-rose-500 hover:to-pink-500 text-white'
                                  : 'bg-white/5 text-white/40 cursor-not-allowed'
                              }`}
                            >
                              <i className="fas fa-heart"></i>
                              <span>Nạp tim</span>
                            </button>
                          </div>

                          {sentenceListenStatus && (
                            <p className="text-sm text-white/80 text-center">{sentenceListenStatus}</p>
                          )}
                        </div>
                      )}

                      {sentencePracticeMode === 'translate' && (
                        <div className="rounded-xl border border-white/20 bg-white/5 p-4 md:p-5 space-y-4">
                          <div className="flex items-center justify-between gap-3 flex-wrap">
                            <p className="text-sm font-semibold text-white">Chọn nghĩa tiếng Việt đúng của câu bên dưới</p>
                            <span className="text-xs px-2.5 py-1 rounded-full border border-cyan-400/40 bg-cyan-500/15 text-cyan-100">
                              thưởng {SENTENCE_PRACTICE_BONUS_XP} XP
                            </span>
                          </div>

                          {sentenceCurrentLevel && (
                            <div className="rounded-lg border border-cyan-400/30 bg-cyan-500/10 p-4">
                              <p className="text-xs uppercase tracking-wide text-cyan-100/80">English sentence</p>
                              <p className="mt-2 text-white font-semibold">{sentenceCurrentLevel.correctSentence}</p>
                            </div>
                          )}

                          <div className="grid sm:grid-cols-2 gap-3">
                            {sentenceTranslateOptions.map((option) => {
                              const isSelectedOption = sentenceTranslateSelection === option;

                              return (
                                <button
                                  key={option}
                                  type="button"
                                  onClick={() => {
                                    setSentenceTranslateSelection(option);
                                    setSentenceTranslateStatus(null);
                                  }}
                                  className={`rounded-lg border px-4 py-3 text-left text-sm transition-all ${
                                    isSelectedOption
                                      ? 'bg-cyan-500/25 border-cyan-400/60 text-cyan-100'
                                      : 'bg-black/20 border-white/15 text-white/85 hover:bg-white/10'
                                  }`}
                                >
                                  {option}
                                </button>
                              );
                            })}
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            <button
                              onClick={handleSentenceTranslateCheck}
                              disabled={isOutOfHearts}
                              className={`px-4 py-3 rounded-lg transition-all font-semibold text-sm flex items-center justify-center gap-2 ${
                                isOutOfHearts
                                  ? 'bg-white/5 text-white/40 cursor-not-allowed'
                                  : 'bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white'
                              }`}
                            >
                              <i className="fas fa-check"></i>
                              <span>Kiểm tra</span>
                            </button>

                            <button
                              onClick={() => {
                                setSentenceTranslateOptions((prev) => shuffleArray(prev));
                                setSentenceTranslateSelection(null);
                                setSentenceTranslateStatus('Đã xáo trộn đáp án.');
                              }}
                              className="px-4 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all font-semibold text-sm flex items-center justify-center gap-2"
                            >
                              <i className="fas fa-shuffle"></i>
                              <span>Đảo đáp án</span>
                            </button>

                            <button
                              onClick={handlePlaySentenceAudio}
                              className="px-4 py-3 bg-purple-500/20 hover:bg-purple-500/30 text-purple-100 rounded-lg transition-all font-semibold text-sm flex items-center justify-center gap-2"
                            >
                              <i className="fas fa-volume-high"></i>
                              <span>Nghe câu</span>
                            </button>

                            <button
                              onClick={refillHearts}
                              disabled={!isOutOfHearts}
                              className={`px-4 py-3 rounded-lg transition-all font-semibold text-sm flex items-center justify-center gap-2 ${
                                isOutOfHearts
                                  ? 'bg-gradient-to-r from-rose-500/80 to-pink-500/80 hover:from-rose-500 hover:to-pink-500 text-white'
                                  : 'bg-white/5 text-white/40 cursor-not-allowed'
                              }`}
                            >
                              <i className="fas fa-heart"></i>
                              <span>Nạp tim</span>
                            </button>
                          </div>

                          {sentenceTranslateStatus && (
                            <p className="text-sm text-white/80 text-center">{sentenceTranslateStatus}</p>
                          )}
                        </div>
                      )}

                      {sentencePracticeMode === 'match' && (
                        <div className="rounded-xl border border-white/20 bg-white/5 p-4 md:p-5 space-y-4">
                          <div className="flex items-center justify-between gap-3 flex-wrap">
                            <p className="text-sm font-semibold text-white">Ghép khái niệm với định nghĩa tương ứng</p>
                            <span className="text-xs px-2.5 py-1 rounded-full border border-cyan-400/40 bg-cyan-500/15 text-cyan-100">
                              {sentenceMatchSolvedConcepts.length}/{sentenceMatchPairs.length} cặp
                            </span>
                          </div>

                          <div className="grid md:grid-cols-2 gap-3">
                            <div className="rounded-lg border border-white/10 bg-black/20 p-3 space-y-2">
                              <p className="text-xs uppercase tracking-wide text-white/60">Concept</p>
                              {sentenceMatchPairs.map((pair) => {
                                const isSolvedPair = sentenceMatchSolvedSet.has(pair.concept);
                                const isSelectedPair = sentenceMatchSelectedConcept === pair.concept;

                                return (
                                  <button
                                    key={pair.id}
                                    type="button"
                                    disabled={isSolvedPair}
                                    onClick={() => handleSentenceSelectMatchConcept(pair.concept)}
                                    className={`w-full rounded-lg border px-3 py-2 text-left text-sm transition-all ${
                                      isSolvedPair
                                        ? 'bg-emerald-500/20 border-emerald-400/50 text-emerald-100 cursor-default'
                                        : isSelectedPair
                                        ? 'bg-cyan-500/25 border-cyan-400/60 text-cyan-100'
                                        : 'bg-white/5 border-white/15 text-white/85 hover:bg-white/10'
                                    }`}
                                  >
                                    {pair.concept}
                                  </button>
                                );
                              })}
                            </div>

                            <div className="rounded-lg border border-white/10 bg-black/20 p-3 space-y-2">
                              <p className="text-xs uppercase tracking-wide text-white/60">Definition</p>
                              {sentenceMatchShuffledDefinitions.map((definition) => {
                                const isDefinitionSolved = sentenceMatchPairs.some(
                                  (pair) =>
                                    pair.definition === definition &&
                                    sentenceMatchSolvedSet.has(pair.concept)
                                );
                                const isDefinitionSelected =
                                  sentenceMatchSelectedDefinition === definition;

                                return (
                                  <button
                                    key={definition}
                                    type="button"
                                    disabled={isDefinitionSolved}
                                    onClick={() => handleSentenceSelectMatchDefinition(definition)}
                                    className={`w-full rounded-lg border px-3 py-2 text-left text-sm transition-all ${
                                      isDefinitionSolved
                                        ? 'bg-emerald-500/20 border-emerald-400/50 text-emerald-100 cursor-default'
                                        : isDefinitionSelected
                                        ? 'bg-cyan-500/25 border-cyan-400/60 text-cyan-100'
                                        : 'bg-white/5 border-white/15 text-white/85 hover:bg-white/10'
                                    }`}
                                  >
                                    {definition}
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            <button
                              onClick={handleSentenceReshuffleMatchDefinitions}
                              className="px-4 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all font-semibold text-sm flex items-center justify-center gap-2"
                            >
                              <i className="fas fa-shuffle"></i>
                              <span>Đảo định nghĩa</span>
                            </button>

                            <button
                              onClick={handleSentenceResetMatchRound}
                              className="px-4 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all font-semibold text-sm flex items-center justify-center gap-2"
                            >
                              <i className="fas fa-rotate-left"></i>
                              <span>Làm mới vòng</span>
                            </button>

                            <button
                              onClick={handlePlaySentenceAudio}
                              className="px-4 py-3 bg-purple-500/20 hover:bg-purple-500/30 text-purple-100 rounded-lg transition-all font-semibold text-sm flex items-center justify-center gap-2"
                            >
                              <i className="fas fa-volume-high"></i>
                              <span>Nghe câu</span>
                            </button>

                            <button
                              onClick={refillHearts}
                              disabled={!isOutOfHearts}
                              className={`px-4 py-3 rounded-lg transition-all font-semibold text-sm flex items-center justify-center gap-2 ${
                                isOutOfHearts
                                  ? 'bg-gradient-to-r from-rose-500/80 to-pink-500/80 hover:from-rose-500 hover:to-pink-500 text-white'
                                  : 'bg-white/5 text-white/40 cursor-not-allowed'
                              }`}
                            >
                              <i className="fas fa-heart"></i>
                              <span>Nạp tim</span>
                            </button>
                          </div>

                          {sentenceMatchCompleted && (
                            <p className="text-sm text-emerald-200 text-center">
                              Bạn đã ghép đúng toàn bộ cặp trong vòng này.
                            </p>
                          )}

                          {sentenceMatchStatus && (
                            <p className="text-sm text-white/80 text-center">{sentenceMatchStatus}</p>
                          )}
                        </div>
                      )}

                      {isOutOfHearts && (
                        <div className="rounded-lg border border-rose-400/45 bg-rose-500/10 px-4 py-3 text-sm text-rose-100 text-center">
                          Bạn đã hết tim. Hãy nạp tim để tiếp tục học.
                        </div>
                      )}

                      {sentenceFeedbackText && (
                        <p className="text-sm text-white/80 text-center">{sentenceFeedbackText}</p>
                      )}

                      {sentenceAudioStatus && (
                        <p className="text-xs text-white/65 text-center">{sentenceAudioStatus}</p>
                      )}

                      {sentencePracticeMode === 'builder' && sentenceShowCorrectAnswer && sentenceCurrentLevel && (
                        <motion.div
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="rounded-lg border border-red-400/40 bg-red-500/10 p-4"
                        >
                          <p className="text-xs uppercase tracking-wide text-red-200 mb-1">Correct sentence</p>
                          <p className="text-red-100 font-semibold">{sentenceCurrentLevel.correctSentence}</p>
                        </motion.div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {currentLessonType === 'quiz' && (
                <div className="bg-black/20 backdrop-blur-sm rounded-xl p-6 mb-4 border border-white/10">
                  {!isQuizStarted ? (
                    <>
                      <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/20">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                            <i className={`${activeQuizConfig.iconClass} text-blue-300 text-xl`}></i>
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-white">{activeQuizConfig.title}</h3>
                            <p className="text-sm text-white/60">{activeQuizConfig.subtitle} · Chưa bắt đầu</p>
                          </div>
                        </div>
                        <span className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full text-xs font-medium">
                          0/{activeQuizQuestions.length}
                        </span>
                      </div>

                      <div className="space-y-4 mb-6">
                        <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                          <label className="block text-sm text-white/80 mb-2" htmlFor="quiz-player-name">
                            Tên hiển thị trên bảng xếp hạng (theo tài khoản đăng nhập)
                          </label>
                          <input
                            id="quiz-player-name"
                            type="text"
                            value={playerName}
                            maxLength={24}
                            readOnly
                            className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 outline-none text-white/95"
                          />
                          <p className="text-xs text-white/60 mt-2">
                            Tên này được đồng bộ từ tài khoản hiện tại. Xếp hạng ưu tiên điểm cao hơn, nếu bằng điểm thì ưu tiên thời gian hoàn thành nhanh hơn.
                          </p>
                        </div>

                        <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-lg p-5 border border-blue-400/30">
                          <h4 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                            <i className="fas fa-info-circle text-blue-300"></i>
                            Thông tin bài kiểm tra
                          </h4>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                                <i className="fas fa-question-circle text-blue-300"></i>
                              </div>
                              <div>
                                <p className="text-white/60 text-xs">Số câu hỏi</p>
                                <p className="text-white font-semibold">{activeQuizQuestions.length} câu</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                                <i className="fas fa-clock text-purple-300"></i>
                              </div>
                              <div>
                                <p className="text-white/60 text-xs">Thời gian</p>
                                <p className="text-white font-semibold">{activeQuizConfig.estimatedTime}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                                <i className="fas fa-star text-green-300"></i>
                              </div>
                              <div>
                                <p className="text-white/60 text-xs">Mục tiêu</p>
                                <p className="text-white font-semibold line-clamp-2">{activeQuizConfig.objective}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-amber-500/20 rounded-lg flex items-center justify-center">
                                <i className="fas fa-layer-group text-amber-200"></i>
                              </div>
                              <div>
                                <p className="text-white/60 text-xs">Lesson hiện tại</p>
                                <p className="text-white font-semibold">{currentLesson.number}. {currentLesson.title}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                                <i className="fas fa-star text-green-300"></i>
                              </div>
                              <div>
                                <p className="text-white/60 text-xs">Điểm tối đa</p>
                                <p className="text-white font-semibold">100 điểm</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-orange-500/20 rounded-lg flex items-center justify-center">
                                <i className="fas fa-redo text-orange-300"></i>
                              </div>
                              <div>
                                <p className="text-white/60 text-xs">Số lần làm</p>
                                <p className="text-white font-semibold">Không giới hạn</p>
                              </div>
                            </div>

                            {activeQuizFillBlankQuestionsCount > 0 && (
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-amber-500/20 rounded-lg flex items-center justify-center">
                                  <i className="fas fa-lightbulb text-amber-200"></i>
                                </div>
                                <div>
                                  <p className="text-white/60 text-xs">Fill in the Blank Hint</p>
                                  <p className="text-white font-semibold">
                                    Tối đa {quizFillBlankHintLimit} lượt / lượt làm
                                  </p>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                          <h5 className="text-white font-semibold mb-3 flex items-center gap-2">
                            <i className="fas fa-trophy text-amber-300"></i>
                            Top bảng xếp hạng gần nhất
                          </h5>

                          {leaderboardEntries.length === 0 ? (
                            <p className="text-sm text-white/65">Chưa có lượt làm nào. Hãy bắt đầu và giành vị trí đầu tiên.</p>
                          ) : (
                            <div className="space-y-2">
                              {leaderboardEntries.slice(0, 5).map((entry, index) => (
                                <div
                                  key={entry.id}
                                  className="flex items-center justify-between rounded-lg border border-white/10 bg-black/20 px-3 py-2"
                                >
                                  <div className="flex items-center gap-3 min-w-0">
                                    <span className="text-xs font-bold text-amber-200 w-6">#{index + 1}</span>
                                    <p className="text-sm text-white truncate">{entry.playerName}</p>
                                  </div>
                                  <div className="text-xs text-white/70">
                                    {entry.scorePoints}đ • {formatDuration(entry.completionSeconds)}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                          <h5 className="text-white font-semibold mb-3 flex items-center gap-2">
                            <i className="fas fa-book-open text-purple-300"></i>
                            Hướng dẫn làm bài
                          </h5>
                          <ul className="space-y-2 text-white/80 text-sm">
                            <li className="flex items-start gap-2">
                              <i className="fas fa-check text-green-400 mt-1 text-xs"></i>
                              <span>Đọc kỹ từng câu hỏi trước khi trả lời</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <i className="fas fa-check text-green-400 mt-1 text-xs"></i>
                              <span>Bạn có thể xem lại và thay đổi câu trả lời trước khi nộp bài</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <i className="fas fa-check text-green-400 mt-1 text-xs"></i>
                              <span>Nghe audio (nếu có), chọn đáp án nhanh và giữ nhịp như các app học tập kiểu Duolingo</span>
                            </li>
                            {activeQuizFillBlankQuestionsCount > 0 && (
                              <li className="flex items-start gap-2">
                                <i className="fas fa-check text-green-400 mt-1 text-xs"></i>
                                <span>
                                  Câu Fill in the Blank có hint giới hạn: tối đa {quizFillBlankHintLimit} lần trong toàn bộ bài.
                                </span>
                              </li>
                            )}
                          </ul>
                        </div>

                        <div className="flex items-center justify-center pt-3">
                          <button
                            onClick={handleStartQuiz}
                            className="px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white rounded-xl transition-all font-semibold text-lg flex items-center gap-3 shadow-lg hover:shadow-xl hover:scale-105"
                          >
                            <i className="fas fa-play-circle"></i>
                            <span>Bắt đầu làm bài</span>
                          </button>
                        </div>
                      </div>
                    </>
                  ) : isQuizSubmitted ? (
                    <div className="space-y-6">
                      <div className="bg-white/5 rounded-xl border border-white/10 p-5">
                        <div className="text-center">
                          <h3 className="text-2xl font-bold text-white mb-2">Quiz Completed</h3>
                          <p className="text-white/70">Your score</p>
                          <p className="text-5xl font-bold text-white my-3">{scoreSummary.scorePercent}%</p>
                          <p className="text-sm text-white/75">
                            {scoreSummary.scorePoints}/100 points • {formatDuration(quizDurationSeconds)}
                          </p>
                        </div>

                        <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
                          <div className="rounded-lg bg-white/5 border border-white/10 p-3">
                            <p className="text-white/60">Completion</p>
                            <p className="text-white font-semibold">{scoreSummary.scorePercent}%</p>
                          </div>
                          <div className="rounded-lg bg-white/5 border border-white/10 p-3">
                            <p className="text-white/60">Total Question</p>
                            <p className="text-white font-semibold">{scoreSummary.totalQuestions}</p>
                          </div>
                          <div className="rounded-lg bg-white/5 border border-white/10 p-3">
                            <p className="text-white/60">Correct</p>
                            <p className="text-white font-semibold">{scoreSummary.correctAnswers}</p>
                          </div>
                          <div className="rounded-lg bg-white/5 border border-white/10 p-3">
                            <p className="text-white/60">Wrong</p>
                            <p className="text-white font-semibold">{wrongAnswersCount}</p>
                          </div>
                          {activeQuizFillBlankQuestionsCount > 0 && (
                            <div className="rounded-lg bg-white/5 border border-white/10 p-3">
                              <p className="text-white/60">Hint Used</p>
                              <p className="text-white font-semibold">
                                {quizFillBlankHintUses}/{quizFillBlankHintLimit}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        <button
                          onClick={resetQuizAttempt}
                          className="px-4 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all font-semibold text-sm flex items-center justify-center gap-2"
                        >
                          <i className="fas fa-rotate-left"></i>
                          <span>Play Again</span>
                        </button>

                        <button
                          onClick={() => setQuizResultViewMode('review')}
                          className={`px-4 py-3 rounded-lg transition-all font-semibold text-sm flex items-center justify-center gap-2 ${
                            quizResultViewMode === 'review'
                              ? 'bg-blue-500 text-white'
                              : 'bg-white/10 hover:bg-white/20 text-white'
                          }`}
                        >
                          <i className="fas fa-eye"></i>
                          <span>Review Answer</span>
                        </button>

                        <button
                          onClick={handleShareScore}
                          className="px-4 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all font-semibold text-sm flex items-center justify-center gap-2"
                        >
                          <i className="fas fa-share-nodes"></i>
                          <span>Share Score</span>
                        </button>

                        <button
                          onClick={onClose}
                          className="px-4 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all font-semibold text-sm flex items-center justify-center gap-2"
                        >
                          <i className="fas fa-house"></i>
                          <span>Home</span>
                        </button>

                        <button
                          onClick={() => setQuizResultViewMode('leaderboard')}
                          className={`px-4 py-3 rounded-lg transition-all font-semibold text-sm flex items-center justify-center gap-2 ${
                            quizResultViewMode === 'leaderboard'
                              ? 'bg-blue-500 text-white'
                              : 'bg-white/10 hover:bg-white/20 text-white'
                          }`}
                        >
                          <i className="fas fa-trophy"></i>
                          <span>Leaderboard</span>
                        </button>
                      </div>

                      {shareFeedback && (
                        <p className="text-sm text-white/75 text-center">{shareFeedback}</p>
                      )}

                      {quizResultViewMode === 'review' && (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <h4 className="text-lg font-semibold text-white flex items-center gap-2">
                              <i className="fas fa-list-check text-purple-300"></i>
                              Review Answers
                            </h4>
                            <button
                              onClick={() => setQuizResultViewMode('summary')}
                              className="text-xs px-3 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white/90"
                            >
                              Back to Summary
                            </button>
                          </div>

                          {activeQuizQuestions.map((question, idx) => {
                            const userAnswer = quizAnswers[question.id];
                            const isCorrect = isAnswerCorrect(question, userAnswer);
                            const userMatchPairs =
                              question.type === 'match-pairs'
                                ? parseQuizMatchPairAnswers(
                                    Array.isArray(userAnswer) ? (userAnswer as string[]) : []
                                  )
                                : [];
                            const correctMatchPairs =
                              question.type === 'match-pairs'
                                ? parseQuizMatchPairAnswers(
                                    Array.isArray(question.correctAnswer)
                                      ? (question.correctAnswer as string[])
                                      : []
                                  )
                                : [];

                            return (
                              <div
                                key={question.id}
                                className={`p-4 rounded-lg border ${
                                  isCorrect
                                    ? 'bg-green-500/10 border-green-500/30'
                                    : 'bg-red-500/10 border-red-500/30'
                                }`}
                              >
                                <div className="flex items-start gap-3 mb-2">
                                  <div
                                    className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${
                                      isCorrect ? 'bg-green-500' : 'bg-red-500'
                                    }`}
                                  >
                                    <i className={`fas ${isCorrect ? 'fa-check' : 'fa-times'} text-white text-xs`}></i>
                                  </div>

                                  <div className="flex-1">
                                    <p className="text-white font-medium mb-1">
                                      Câu {idx + 1}: {question.question}
                                    </p>

                                    {question.type === 'match-pairs' ? (
                                      <div className="text-sm text-white/70 space-y-1">
                                        <p>
                                          <span className="text-white/50">Câu trả lời của bạn:</span>
                                        </p>

                                        {userMatchPairs.length === 0 ? (
                                          <p>Chưa ghép cặp.</p>
                                        ) : (
                                          <div className="space-y-1">
                                            {userMatchPairs.map((pair) => (
                                              <p key={`${question.id}-user-${pair.left}`}>
                                                {pair.left} <span className="text-white/50">{'->'}</span> {pair.right}
                                              </p>
                                            ))}
                                          </div>
                                        )}
                                      </div>
                                    ) : (
                                      <p className="text-sm text-white/70">
                                        <span className="text-white/50">Câu trả lời của bạn: </span>
                                        {Array.isArray(userAnswer)
                                          ? userAnswer.join(', ')
                                          : userAnswer || 'Chưa trả lời'}
                                      </p>
                                    )}

                                    {!isCorrect && (
                                      question.type === 'match-pairs' ? (
                                        <div className="text-sm text-green-300 mt-1 space-y-1">
                                          <p>
                                            <span className="text-white/50">Đáp án đúng:</span>
                                          </p>

                                          {correctMatchPairs.map((pair) => (
                                            <p key={`${question.id}-correct-${pair.left}`}>
                                              {pair.left} <span className="text-white/50">{'->'}</span> {pair.right}
                                            </p>
                                          ))}
                                        </div>
                                      ) : (
                                        <p className="text-sm text-green-300 mt-1">
                                          <span className="text-white/50">Đáp án đúng: </span>
                                          {Array.isArray(question.correctAnswer)
                                            ? question.correctAnswer.join(', ')
                                            : question.correctAnswer}
                                        </p>
                                      )
                                    )}

                                    {question.explanation && (
                                      <p className="text-sm text-blue-300 mt-2 pl-3 border-l-2 border-blue-400/50">
                                        Giải thích: {question.explanation}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {quizResultViewMode === 'leaderboard' && (
                        <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="text-lg font-semibold text-white flex items-center gap-2">
                              <i className="fas fa-trophy text-amber-300"></i>
                              Quiz Leaderboard
                            </h4>
                            <button
                              onClick={() => setQuizResultViewMode('summary')}
                              className="text-xs px-3 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white/90"
                            >
                              Back to Summary
                            </button>
                          </div>

                          {leaderboardEntries.length === 0 ? (
                            <p className="text-sm text-white/65">Chưa có dữ liệu xếp hạng.</p>
                          ) : (
                            <div className="overflow-x-auto">
                              <table className="w-full text-sm text-left text-white/85">
                                <thead className="text-xs uppercase tracking-wider text-white/60">
                                  <tr>
                                    <th className="pb-2 pr-3">#</th>
                                    <th className="pb-2 pr-3">Người học</th>
                                    <th className="pb-2 pr-3">Điểm</th>
                                    <th className="pb-2 pr-3">Đúng</th>
                                    <th className="pb-2 pr-3">Thời gian</th>
                                    <th className="pb-2">Lúc nộp</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {leaderboardEntries.slice(0, 10).map((entry, index) => (
                                    <tr key={entry.id} className="border-t border-white/10">
                                      <td className="py-2 pr-3 font-semibold text-amber-200">#{index + 1}</td>
                                      <td className="py-2 pr-3">{entry.playerName}</td>
                                      <td className="py-2 pr-3">{entry.scorePoints}/100 ({entry.scorePercent}%)</td>
                                      <td className="py-2 pr-3">
                                        {entry.correctAnswers}/{entry.totalQuestions}
                                      </td>
                                      <td className="py-2 pr-3">{formatDuration(entry.completionSeconds)}</td>
                                      <td className="py-2 text-white/65">{formatCompletedAt(entry.completedAt)}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      )}

                      {quizResultViewMode === 'summary' && (
                        <div className="space-y-4">
                          <div className="rounded-lg border border-white/10 bg-white/5 p-4 text-sm text-white/70 text-center">
                            Chọn chức năng để xem đáp án, chia sẻ điểm hoặc mở bảng xếp hạng trực tiếp tại đây.
                          </div>

                          {isFinalQuizLesson && (
                            <div className="rounded-lg border border-cyan-300/35 bg-cyan-500/10 p-4 space-y-4">
                              <div className="flex items-center justify-between gap-3 flex-wrap">
                                <h4 className="text-base font-semibold text-cyan-100 flex items-center gap-2">
                                  <i className="fas fa-chart-line"></i>
                                  Tổng hợp toàn bộ quiz trong module
                                </h4>
                                <span className="text-xs px-2.5 py-1 rounded-full border border-cyan-300/40 bg-cyan-500/20 text-cyan-100">
                                  {quizModuleCompletedLessons}/{quizLessonsInModule.length} bài đã có kết quả
                                </span>
                              </div>

                              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                                <div className="rounded-lg border border-white/15 bg-white/5 p-3">
                                  <p className="text-white/60">Tổng lượt làm</p>
                                  <p className="text-white font-semibold">{quizModuleTotalAttempts}</p>
                                </div>
                                <div className="rounded-lg border border-white/15 bg-white/5 p-3">
                                  <p className="text-white/60">Best score</p>
                                  <p className="text-white font-semibold">{quizModuleBestScore}%</p>
                                </div>
                                <div className="rounded-lg border border-white/15 bg-white/5 p-3">
                                  <p className="text-white/60">Avg best score</p>
                                  <p className="text-white font-semibold">{quizModuleAverageBestScore}%</p>
                                </div>
                                <div className="rounded-lg border border-white/15 bg-white/5 p-3">
                                  <p className="text-white/60">Latest tổng độ đúng</p>
                                  <p className="text-white font-semibold">{quizModuleLatestAccuracyPercent}%</p>
                                </div>
                              </div>

                              {quizModuleSummaryItems.length === 0 ? (
                                <div className="rounded-lg border border-white/15 bg-white/5 p-3 text-sm text-white/70">
                                  Chưa tìm thấy dữ liệu quiz để tổng hợp.
                                </div>
                              ) : (
                                <div className="overflow-x-auto rounded-lg border border-white/15">
                                  <table className="w-full text-sm text-left text-white/85">
                                    <thead className="text-xs uppercase tracking-wide text-white/60 bg-black/20">
                                      <tr>
                                        <th className="py-2 px-3">Bài quiz</th>
                                        <th className="py-2 px-3">Lượt làm</th>
                                        <th className="py-2 px-3">Best</th>
                                        <th className="py-2 px-3">Latest</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {quizModuleSummaryItems.map((item) => (
                                        <tr
                                          key={`module-summary-${item.lessonId}`}
                                          className="border-t border-white/10"
                                        >
                                          <td className="py-2 px-3">
                                            {item.lessonNumber}. {item.lessonTitle}
                                          </td>
                                          <td className="py-2 px-3">{item.attempts}</td>
                                          <td className="py-2 px-3">
                                            {item.bestEntry
                                              ? `${item.bestEntry.scorePercent}% (${item.bestEntry.correctAnswers}/${item.bestEntry.totalQuestions}) • ${formatDuration(item.bestEntry.completionSeconds)}`
                                              : 'Chưa làm'}
                                          </td>
                                          <td className="py-2 px-3">
                                            {item.latestEntry
                                              ? `${item.latestEntry.scorePercent}% • ${formatCompletedAt(item.latestEntry.completedAt)}`
                                              : 'Chưa làm'}
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}

                      <div className="flex gap-3">
                        {isFinalQuizLesson ? (
                          scoreSummary.scorePercent >= 60 ? (
                            <button
                              onClick={openCompletionFlow}
                              className="flex-1 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white rounded-xl transition-all font-semibold flex items-center justify-center gap-2 shadow-lg shadow-green-500/30 hover:shadow-xl hover:scale-105"
                            >
                              <i className="fas fa-check-circle"></i>
                              <span>{completionRewardsCommitted ? 'Mở lại phần thưởng' : 'Nhận thưởng & Complete'}</span>
                            </button>
                          ) : (
                            <button
                              disabled
                              className="flex-1 px-6 py-3 bg-gradient-to-r from-gray-400 to-gray-500 text-white rounded-xl transition-all font-semibold flex items-center justify-center gap-2 opacity-50 cursor-not-allowed"
                            >
                              <span>Cần đạt 60% để complete</span>
                              <i className="fas fa-lock"></i>
                            </button>
                          )
                        ) : (
                          <button
                            onClick={handleNextLesson}
                            className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white rounded-xl transition-all font-semibold flex items-center justify-center gap-2"
                          >
                            <span>Sang bài Assessment kế tiếp</span>
                            <i className="fas fa-chevron-right"></i>
                          </button>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-white/60 text-sm">
                          Câu hỏi {currentQuestionIndex + 1}/{activeQuizQuestions.length}
                        </span>
                        <div className="text-right">
                          <span className="block text-sm text-white/60">
                            {answeredCount}/{activeQuizQuestions.length} đã trả lời
                          </span>
                          {activeQuizFillBlankQuestionsCount > 0 && (
                            <span className="block text-xs text-amber-100/90 mt-0.5">
                              Hint còn lại: {quizFillBlankHintsRemaining}/{quizFillBlankHintLimit}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300"
                          style={{
                            width: `${
                              activeQuizQuestions.length > 0
                                ? ((currentQuestionIndex + 1) / activeQuizQuestions.length) * 100
                                : 0
                            }%`
                          }}
                        ></div>
                      </div>

                      {(() => {
                        const currentQuestion = activeQuizQuestions[currentQuestionIndex];

                        if (!currentQuestion) {
                          return (
                            <div className="rounded-lg border border-white/15 bg-white/5 p-4 text-sm text-white/70">
                              Bài quiz này chưa có câu hỏi. Vui lòng chuyển lesson khác.
                            </div>
                          );
                        }

                        return (
                          <div className="space-y-4">
                            <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-lg p-5 border border-blue-400/30">
                              <div className="flex items-start gap-3 mb-4">
                                <div className="flex-shrink-0 w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                                  <span className="text-blue-300 font-bold">{currentQuestionIndex + 1}</span>
                                </div>
                                <div className="flex-1">
                                  <h4 className="text-lg font-bold text-white mb-2">
                                    {currentQuestion.question}
                                  </h4>
                                  {currentQuestion.type === 'multiple-select' && (
                                    <p className="text-xs text-purple-300">Chọn nhiều đáp án</p>
                                  )}
                                </div>
                              </div>

                              <div className="space-y-3">
                                {currentQuestion.promptAudioText && (
                                  <div className="rounded-lg border border-cyan-400/35 bg-cyan-500/10 px-3 py-3">
                                    <div className="flex items-center justify-between gap-3 flex-wrap">
                                      <p className="text-xs text-cyan-100/90">
                                        Nhấn nghe để làm bài kiểu Listening/Speaking.
                                      </p>
                                      <button
                                        type="button"
                                        onClick={() => handlePlayQuizPromptAudio(currentQuestion.promptAudioText || '')}
                                        className="px-3 py-1.5 rounded-lg border border-cyan-300/40 bg-cyan-500/20 text-cyan-100 text-xs font-semibold hover:bg-cyan-500/30 transition-all"
                                      >
                                        <i className="fas fa-volume-high mr-1"></i>
                                        Nghe audio
                                      </button>
                                    </div>
                                  </div>
                                )}

                                {currentQuestion.type === 'match-pairs' ? (
                                  (() => {
                                    const configuredPairs = currentQuestion.matchPairs || [];
                                    const connectedPairs = parseQuizMatchPairAnswers(
                                      Array.isArray(quizAnswers[currentQuestion.id])
                                        ? (quizAnswers[currentQuestion.id] as string[])
                                        : []
                                    );
                                    const rightByLeft = new Map(
                                      connectedPairs.map((pair) => [pair.left, pair.right])
                                    );
                                    const leftByRight = new Map(
                                      connectedPairs.map((pair) => [pair.right, pair.left])
                                    );

                                    if (configuredPairs.length === 0) {
                                      return (
                                        <div className="rounded-lg border border-white/15 bg-white/5 p-4 text-sm text-white/70">
                                          Câu hỏi Match Pairs chưa có dữ liệu cặp ghép.
                                        </div>
                                      );
                                    }

                                    return (
                                      <div className="space-y-3">
                                        <div className="rounded-lg border border-white/15 bg-black/20 p-3">
                                          <div className="flex items-center justify-between gap-3 flex-wrap text-xs">
                                            <p className="text-white/75">
                                              Chọn 1 mục ở cột A, sau đó bấm mục tương ứng ở cột B để nối cặp.
                                            </p>
                                            <p className="text-cyan-200/90 font-semibold">
                                              Đã nối {connectedPairs.length}/{configuredPairs.length} cặp
                                            </p>
                                          </div>

                                          <div className="mt-2 flex items-center justify-between gap-2 flex-wrap">
                                            <p className="text-xs text-white/70">
                                              {quizPendingMatchLeft
                                                ? `Đang chọn: ${quizPendingMatchLeft}`
                                                : 'Chưa chọn mục ở cột A'}
                                            </p>
                                            <button
                                              type="button"
                                              onClick={() => handleQuizMatchPairClearAll(currentQuestion.id)}
                                              disabled={connectedPairs.length === 0}
                                              className={`text-xs px-2.5 py-1 rounded-md border transition-all ${
                                                connectedPairs.length === 0
                                                  ? 'border-white/15 text-white/35 cursor-not-allowed'
                                                  : 'border-rose-300/40 text-rose-100 bg-rose-500/10 hover:bg-rose-500/20'
                                              }`}
                                            >
                                              Xóa nối hiện tại
                                            </button>
                                          </div>
                                        </div>

                                        <div className="grid md:grid-cols-2 gap-3">
                                          <div className="rounded-lg border border-indigo-400/35 bg-indigo-500/10 p-3">
                                            <p className="text-xs uppercase tracking-wide text-indigo-200 mb-2">
                                              Cột A - Khái niệm
                                            </p>
                                            <div className="space-y-2">
                                              {configuredPairs.map((pair) => {
                                                const matchedRight = rightByLeft.get(pair.left);
                                                const isPending = quizPendingMatchLeft === pair.left;

                                                return (
                                                  <button
                                                    key={`${currentQuestion.id}-left-${pair.left}`}
                                                    type="button"
                                                    onClick={() => handleQuizMatchPairSelectLeft(pair.left)}
                                                    className={`w-full rounded-lg border p-3 text-left transition-all ${
                                                      isPending
                                                        ? 'border-cyan-300/70 bg-cyan-500/20'
                                                        : matchedRight
                                                        ? 'border-emerald-300/50 bg-emerald-500/15'
                                                        : 'border-white/20 bg-white/5 hover:bg-white/10'
                                                    }`}
                                                  >
                                                    <p className="text-sm font-semibold text-white">{pair.left}</p>
                                                    {matchedRight && (
                                                      <p className="mt-1 text-xs text-cyan-100/90">
                                                        <span className="text-white/50">Nối với:</span> {matchedRight}
                                                      </p>
                                                    )}
                                                  </button>
                                                );
                                              })}
                                            </div>
                                          </div>

                                          <div className="rounded-lg border border-purple-400/35 bg-purple-500/10 p-3">
                                            <p className="text-xs uppercase tracking-wide text-purple-200 mb-2">
                                              Cột B - Định nghĩa
                                            </p>
                                            <div className="space-y-2">
                                              {configuredPairs.map((pair) => {
                                                const connectedLeft = leftByRight.get(pair.right);
                                                const isConnectedToPending =
                                                  !!quizPendingMatchLeft && connectedLeft === quizPendingMatchLeft;

                                                return (
                                                  <button
                                                    key={`${currentQuestion.id}-right-${pair.right}`}
                                                    type="button"
                                                    onClick={() =>
                                                      handleQuizMatchPairConnect(currentQuestion, pair.right)
                                                    }
                                                    disabled={!quizPendingMatchLeft}
                                                    className={`w-full rounded-lg border p-3 text-left transition-all ${
                                                      !quizPendingMatchLeft
                                                        ? 'border-white/15 bg-white/5 text-white/50 cursor-not-allowed'
                                                        : isConnectedToPending
                                                        ? 'border-cyan-300/70 bg-cyan-500/20'
                                                        : connectedLeft
                                                        ? 'border-amber-300/50 bg-amber-500/15'
                                                        : 'border-white/20 bg-white/5 hover:bg-white/10 text-white'
                                                    }`}
                                                  >
                                                    <p className="text-sm font-semibold">{pair.right}</p>
                                                    {connectedLeft && (
                                                      <p className="mt-1 text-xs text-white/75">
                                                        <span className="text-white/50">Đang nối:</span> {connectedLeft}
                                                      </p>
                                                    )}
                                                  </button>
                                                );
                                              })}
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  })()
                                ) : currentQuestion.type === 'multiple-choice' ||
                                  currentQuestion.type === 'true-false' ? (
                                  currentQuestion.options?.map((option) => (
                                    <button
                                      key={option}
                                      onClick={() => handleQuizAnswer(currentQuestion.id, option)}
                                      className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                                        quizAnswers[currentQuestion.id] === option
                                          ? 'border-purple-500 bg-purple-500/20'
                                          : 'border-white/20 bg-white/5 hover:bg-white/10'
                                      }`}
                                    >
                                      <div className="flex items-center gap-3">
                                        <div
                                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                            quizAnswers[currentQuestion.id] === option
                                              ? 'border-purple-500 bg-purple-500'
                                              : 'border-white/40'
                                          }`}
                                        >
                                          {quizAnswers[currentQuestion.id] === option && (
                                            <i className="fas fa-check text-white text-xs"></i>
                                          )}
                                        </div>
                                        <span className="text-white">{option}</span>
                                      </div>
                                    </button>
                                  ))
                                ) : currentQuestion.type === 'multiple-select' ? (
                                  currentQuestion.options?.map((option) => {
                                    const selected = (
                                      (quizAnswers[currentQuestion.id] as string[] | undefined) || []
                                    ).includes(option);

                                    return (
                                      <button
                                        key={option}
                                        onClick={() => {
                                          const currentAnswers =
                                            (quizAnswers[currentQuestion.id] as string[] | undefined) || [];
                                          const nextAnswers = selected
                                            ? currentAnswers.filter((answer) => answer !== option)
                                            : [...currentAnswers, option];
                                          handleQuizAnswer(currentQuestion.id, nextAnswers);
                                        }}
                                        className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                                          selected
                                            ? 'border-purple-500 bg-purple-500/20'
                                            : 'border-white/20 bg-white/5 hover:bg-white/10'
                                        }`}
                                      >
                                        <div className="flex items-center gap-3">
                                          <div
                                            className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                                              selected
                                                ? 'border-purple-500 bg-purple-500'
                                                : 'border-white/40'
                                            }`}
                                          >
                                            {selected && (
                                              <i className="fas fa-check text-white text-xs"></i>
                                            )}
                                          </div>
                                          <span className="text-white">{option}</span>
                                        </div>
                                      </button>
                                    );
                                  })
                                ) : currentQuestion.type === 'fill-blank' ? (
                                  <div className="space-y-3">
                                    <input
                                      type="text"
                                      value={(quizAnswers[currentQuestion.id] as string) || ''}
                                      onChange={(event) =>
                                        handleQuizAnswer(currentQuestion.id, event.target.value)
                                      }
                                      placeholder={
                                        currentQuestion.inputPlaceholder || 'Nhập câu trả lời của bạn...'
                                      }
                                      className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 focus:border-purple-400 focus:ring-2 focus:ring-purple-300/50 outline-none text-white placeholder-white/50"
                                    />

                                    <div className="flex items-center justify-between gap-3 flex-wrap">
                                      <button
                                        type="button"
                                        onClick={() => handleUseQuizFillBlankHint(currentQuestion)}
                                        disabled={
                                          !!quizFillBlankHints[currentQuestion.id] ||
                                          quizFillBlankHintsRemaining <= 0
                                        }
                                        className={`text-xs px-3 py-1.5 rounded-md border transition-all ${
                                          quizFillBlankHints[currentQuestion.id] ||
                                          quizFillBlankHintsRemaining <= 0
                                            ? 'border-white/15 text-white/35 cursor-not-allowed bg-white/5'
                                            : 'border-amber-300/40 text-amber-100 bg-amber-500/10 hover:bg-amber-500/20'
                                        }`}
                                      >
                                        <i className="fas fa-lightbulb mr-1"></i>
                                        {quizFillBlankHints[currentQuestion.id]
                                          ? 'Đã mở hint cho câu này'
                                          : 'Xem hint'}
                                      </button>

                                      <p className="text-xs text-amber-100/85">
                                        Hint còn lại: {quizFillBlankHintsRemaining}/{quizFillBlankHintLimit}
                                      </p>
                                    </div>

                                    {quizFillBlankHints[currentQuestion.id] && (
                                      <div className="rounded-lg border border-amber-300/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-100">
                                        {quizFillBlankHints[currentQuestion.id]}
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <div className="rounded-lg border border-white/15 bg-white/5 p-4 text-sm text-white/70">
                                    Loại câu hỏi này chưa được hỗ trợ giao diện trả lời.
                                  </div>
                                )}
                              </div>

                              {quizAudioStatus && (
                                <p className="text-xs text-cyan-100/85 text-center mt-3">{quizAudioStatus}</p>
                              )}
                            </div>
                          </div>
                        );
                      })()}

                      <div className="flex items-center justify-between">
                        <button
                          onClick={handlePreviousQuestion}
                          disabled={currentQuestionIndex === 0}
                          className={`px-6 py-3 rounded-lg transition-all font-semibold flex items-center gap-2 ${
                            currentQuestionIndex === 0
                              ? 'bg-white/5 text-white/30 cursor-not-allowed'
                              : 'bg-white/10 hover:bg-white/20 text-white'
                          }`}
                        >
                          <i className="fas fa-chevron-left"></i>
                          Câu trước
                        </button>

                        {currentQuestionIndex === activeQuizQuestions.length - 1 ? (
                          <button
                            onClick={handleSubmitQuiz}
                            className="px-8 py-3 bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white rounded-lg transition-all font-semibold flex items-center gap-2"
                          >
                            <i className="fas fa-paper-plane"></i>
                            Nộp bài
                          </button>
                        ) : (
                          <button
                            onClick={handleNextQuestion}
                            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white rounded-lg transition-all font-semibold flex items-center gap-2"
                          >
                            Câu tiếp
                            <i className="fas fa-chevron-right"></i>
                          </button>
                        )}
                      </div>

                      <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                        <h5 className="text-white font-semibold mb-2 text-xs flex items-center gap-2">
                          <i className="fas fa-th text-purple-300"></i>
                          Danh sách câu hỏi
                        </h5>
                        <div className="flex gap-2 flex-wrap">
                          {activeQuizQuestions.map((question, idx) => (
                            <button
                              key={question.id}
                              onClick={() => {
                                setCurrentQuestionIndex(idx);
                                setQuizAudioStatus(null);
                                setQuizPendingMatchLeft(null);
                              }}
                              className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-semibold transition-all ${
                                idx === currentQuestionIndex
                                  ? 'bg-purple-500 text-white ring-2 ring-purple-300 shadow-lg'
                                  : isQuizAnswerProvided(question, quizAnswers[question.id])
                                  ? 'bg-green-500/30 text-green-300 border border-green-500/50'
                                  : 'bg-white/10 text-white/60 hover:bg-white/20'
                              }`}
                            >
                              {idx + 1}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={handlePreviousLesson}
                  disabled={currentStep === 1}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors text-white border border-white/20 ${
                    currentStep === 1
                      ? 'bg-white/5 opacity-50 cursor-not-allowed'
                      : 'bg-white/10 hover:bg-white/20'
                  }`}
                >
                  <i className="fas fa-chevron-left"></i>
                  <span>Bài trước</span>
                </button>

                <button
                  onClick={handleNextLesson}
                  disabled={currentStep === totalSteps}
                  className={`flex items-center gap-2 px-6 py-2 rounded-lg transition-all text-white font-medium ${
                    currentStep === totalSteps
                      ? 'bg-gradient-to-r from-purple-400 to-blue-400 opacity-50 cursor-not-allowed'
                      : 'bg-gradient-to-r from-purple-500 to-blue-500 hover:shadow-lg'
                  }`}
                >
                  <span>{currentStep === totalSteps ? 'Đã hoàn thành' : 'Bài tiếp'}</span>
                  <i className={`fas ${currentStep === totalSteps ? 'fa-check' : 'fa-chevron-right'}`}></i>
                </button>
              </div>
            </div>
          </div>

          <div className="w-96 bg-black/20 backdrop-blur-sm border-l border-white/20 flex flex-col">
            <div className="py-3 px-4 text-sm font-medium text-white border-b border-white/20 bg-black/10">
              Course content
            </div>

            <div className="flex-1 overflow-y-auto p-4 scrollbar-none">
              <div className="space-y-2">
                {activeSections.map((section) => {
                  const isExpanded = expandedSections.includes(section.id);

                  return (
                    <div key={section.id} className="border border-white/20 rounded-lg overflow-hidden bg-white/5">
                      <button
                        onClick={() => toggleSection(section.id)}
                        className="w-full px-3 py-3 flex items-center justify-between hover:bg-white/10 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <i
                            className={`fas fa-chevron-${isExpanded ? 'up' : 'down'} text-white/60 text-xs`}
                          ></i>
                          <span className="text-sm font-medium text-white/90">{section.title}</span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-white/60">
                          <span>{section.lessonCount} bài</span>
                          {section.duration && (
                            <>
                              <span>•</span>
                              <span>{section.duration}</span>
                            </>
                          )}
                        </div>
                      </button>

                      {isExpanded && (
                        <div className="border-t border-white/10">
                          {section.lessons.map((lesson) => (
                            <div
                              key={lesson.id}
                              onClick={() => handleSelectLesson(lesson.id)}
                              className="flex items-center gap-3 px-3 py-2.5 hover:bg-white/10 transition-all cursor-pointer group border-b border-white/5 last:border-b-0"
                            >
                              <div
                                className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center ${
                                  lesson.isQuiz
                                    ? 'bg-blue-500/20 border border-blue-500/50'
                                    : lesson.isSentenceBuilder
                                    ? 'bg-cyan-500/20 border border-cyan-500/50'
                                    : lesson.isFlashcard
                                    ? 'bg-amber-500/20 border border-amber-500/50'
                                    : lesson.completed
                                    ? 'bg-green-500/20 border border-green-500/50'
                                    : 'bg-white/10 border border-white/30'
                                }`}
                              >
                                {lesson.isQuiz ? (
                                  <i className="fas fa-clipboard-question text-blue-400 text-[10px]"></i>
                                ) : lesson.isSentenceBuilder ? (
                                  <i className="fas fa-puzzle-piece text-cyan-300 text-[10px]"></i>
                                ) : lesson.isFlashcard ? (
                                  <i className="fas fa-clone text-amber-300 text-[10px]"></i>
                                ) : lesson.completed ? (
                                  <i className="fas fa-check text-green-400 text-[10px]"></i>
                                ) : (
                                  <i className="fas fa-file-alt text-white/50 text-[10px]"></i>
                                )}
                              </div>

                              <div className="flex-1 min-w-0">
                                <div className="text-sm text-white/90 group-hover:text-white transition-colors">
                                  {lesson.number ? `${lesson.number}. ` : ''}
                                  {lesson.title}
                                </div>
                                <div className="text-xs text-white/50 mt-0.5">{lesson.duration}</div>
                              </div>

                              {lesson.isDownloadable && (
                                <button
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    handleDownloadDocument(lesson.id);
                                  }}
                                  className="flex-shrink-0 px-2 py-1 text-xs text-white/70 hover:text-white border border-white/30 rounded hover:bg-white/10 transition-all flex items-center gap-1"
                                >
                                  <span>tải</span>
                                  <i className="fas fa-download text-[10px]"></i>
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {completionFlowVisible && completionFlowSnapshot && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-3xl border border-white/20 bg-[#0d1f2a]/95 p-6 shadow-2xl">
            {completionFlowStep === 'summary' && (
              <div className="space-y-5">
                <div className="text-center">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-emerald-200/80">Hoàn thành bài học</p>
                  <h3 className="mt-2 text-4xl font-black text-emerald-200">Xuất sắc!</h3>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-2xl border border-amber-400/50 bg-amber-500/10 p-4 text-center">
                    <p className="text-xs uppercase tracking-wide text-amber-200/80">Tổng điểm KN</p>
                    <p className="mt-2 text-3xl font-black text-amber-200">+{completionFlowSnapshot.moduleXpEarned}</p>
                  </div>
                  <div className="rounded-2xl border border-emerald-400/50 bg-emerald-500/10 p-4 text-center">
                    <p className="text-xs uppercase tracking-wide text-emerald-200/80">Đỉnh cao</p>
                    <p className="mt-2 text-3xl font-black text-emerald-200">{completionFlowSnapshot.accuracyPercent}%</p>
                  </div>
                </div>
              </div>
            )}

            {completionFlowStep === 'streak' && (
              <div className="space-y-5 text-center">
                <div>
                  <i className="fas fa-fire text-5xl text-amber-300"></i>
                  <h3 className="mt-3 text-4xl font-black text-amber-200">{completionFlowSnapshot.streakDays}</h3>
                  <p className="text-xl font-bold text-amber-100">ngày streak</p>
                </div>

                <div className="rounded-2xl border border-white/20 bg-white/5 p-4">
                  <div className="flex items-center justify-center gap-3">
                    {['T7', 'CN', 'T2', 'T3', 'T4'].map((dayLabel, index) => {
                      const isActiveDay = completionFlowSnapshot.streakWeekStatus[index];
                      return (
                        <div key={dayLabel} className="flex flex-col items-center gap-2">
                          <p className="text-[11px] text-white/60">{dayLabel}</p>
                          <span
                            className={`h-9 w-9 rounded-full border flex items-center justify-center ${
                              isActiveDay
                                ? 'border-amber-300/80 bg-amber-400 text-[#1f2a32]'
                                : 'border-white/20 bg-white/10 text-white/30'
                            }`}
                          >
                            <i className={`fas ${isActiveDay ? 'fa-check' : 'fa-circle'} text-xs`}></i>
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  <p className="mt-4 text-sm text-white/75">
                    Vào học đều đặn để giữ streak và tăng thưởng ngày.
                  </p>
                </div>
              </div>
            )}

            {completionFlowStep === 'daily' && (
              <div className="space-y-5 text-center">
                <h3 className="text-3xl font-black text-amber-200">Hoàn thành nhiệm vụ hằng ngày</h3>

                <div className="rounded-2xl border border-white/20 bg-white/5 p-5">
                  <div className="mb-3 flex items-center justify-between text-sm">
                    <p className="font-semibold text-white">Kiếm {completionFlowSnapshot.dailyQuestTargetXp} KN</p>
                    <p className="text-white/70">
                      {completionFlowSnapshot.dailyQuestEarnedXp}/{completionFlowSnapshot.dailyQuestTargetXp}
                    </p>
                  </div>

                  <div className="h-3 w-full overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-amber-400 to-yellow-300 transition-all duration-500"
                      style={{ width: `${completionDailyQuestPercent}%` }}
                    ></div>
                  </div>

                  <p className="mt-3 text-sm text-white/75">
                    {completionFlowSnapshot.dailyQuestCompleted
                      ? 'Bạn đã hoàn thành nhiệm vụ ngày!'
                      : 'Bạn chưa đủ KN cho nhiệm vụ ngày, tiếp tục học để hoàn thành.'}
                  </p>
                </div>
              </div>
            )}

            {completionFlowStep === 'reward' && (
              <div className="space-y-5 text-center">
                <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full border border-cyan-300/45 bg-cyan-500/15">
                  <i className="fas fa-gem text-4xl text-cyan-200"></i>
                </div>
                <h3 className="text-3xl font-black text-cyan-100">Phần thưởng ngày</h3>
                <p className="text-lg text-white/85">
                  {completionFlowSnapshot.gemsAwarded > 0
                    ? `Bạn đã kiếm được ${completionFlowSnapshot.gemsAwarded} đá quý!`
                    : 'Nhiệm vụ ngày đã nhận thưởng trước đó, không cộng thêm đá quý.'}
                </p>

                <div className="rounded-2xl border border-cyan-300/35 bg-cyan-500/10 px-4 py-3 inline-flex items-center gap-3">
                  <i className="fas fa-wallet text-cyan-200"></i>
                  <span className="text-cyan-100 font-semibold">Tổng đá quý: {completionFlowSnapshot.totalGems}</span>
                </div>
              </div>
            )}

            <div className="mt-6 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setCompletionFlowVisible(false)}
                className="px-5 py-2.5 rounded-xl border border-white/25 bg-white/10 text-white/85 hover:bg-white/15 transition"
              >
                Xem lại bài học
              </button>

              <button
                type="button"
                onClick={handleCompletionFlowPrimaryAction}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-semibold hover:from-emerald-600 hover:to-cyan-600 transition"
              >
                {completionPrimaryActionLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

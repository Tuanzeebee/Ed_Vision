import React, { useState, useEffect } from "react";
import { ChevronRight, ChevronLeft, Sparkles, BookOpen, Target } from "lucide-react";
import { useNavigate } from "react-router-dom";

type ViewType = "intro" | "test";

interface Question {
  id: number;
  question: string;
  difficulty: "Dễ" | "Trung bình" | "Khó";
  options: {
    id: string;
    text: string;
  }[];
  correctAnswer: string;
}

interface AnswerState {
  selected: string | null;
  isCorrect: boolean | null;
  answered: boolean;
}

// Mock questions data
const MOCK_QUESTIONS: Question[] = [
  {
    id: 1,
    question: "What does the word 'ambiguous' mean?",
    difficulty: "Trung bình",
    options: [
      { id: "A", text: "Having two possible meanings" },
      { id: "B", text: "Something that is very clear" },
      { id: "C", text: "A type of weather" },
      { id: "D", text: "A mathematical equation" },
    ],
    correctAnswer: "A",
  },
  {
    id: 2,
    question: "Which sentence is grammatically correct?",
    difficulty: "Dễ",
    options: [
      { id: "A", text: "She have been working here" },
      { id: "B", text: "She has been working here" },
      { id: "C", text: "She were working here" },
      { id: "D", text: "She be working here" },
    ],
    correctAnswer: "B",
  },
  {
    id: 3,
    question: "What is the synonym for 'diligent'?",
    difficulty: "Khó",
    options: [
      { id: "A", text: "Lazy and unmotivated" },
      { id: "B", text: "Hardworking and conscientious" },
      { id: "C", text: "Angry and irritated" },
      { id: "D", text: "Confused and disoriented" },
    ],
    correctAnswer: "B",
  },
];

const getDifficultyColor = (difficulty: string) => {
  switch (difficulty) {
    case "Dễ":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "Trung bình":
      return "bg-amber-50 text-amber-700 border-amber-200";
    case "Khó":
      return "bg-rose-50 text-rose-700 border-rose-200";
    default:
      return "bg-gray-50 text-gray-700 border-gray-200";
  }
};

// Intro View Component
const IELTSIntroView: React.FC<{
  onStart: () => void;
  isLoading: boolean;
}> = ({ onStart, isLoading }) => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-violet-50 to-white">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-violet-700 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-gray-900">PREDICA</span>
          </div>
          <button
            onClick={() => navigate("/student/landing")}
            className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            Quay lại
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-4 py-12 md:py-20">
        {/* Hero Section */}
        <div className="mb-12 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-violet-100 text-violet-700 rounded-full text-sm font-medium mb-6">
            <span>🎯</span>
            <span>Đánh giá trình độ IELTS</span>
          </div>

          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 leading-tight">
            Khám phá năng lực IELTS của bạn
          </h1>

          <p className="text-lg text-gray-600 max-w-xl mx-auto leading-relaxed">
            Hãy bắt đầu cuộc hành trình khám phá năng lực tiếng Anh của bạn.
            Bài kiểm tra sẽ đánh giá toàn diện kỹ năng của bạn.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
          {/* Feature 1 */}
          <div className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center mb-3">
              <Target className="w-5 h-5 text-blue-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">10 Câu Hỏi</h3>
            <p className="text-sm text-gray-600">
              Đánh giá toàn diện kỹ năng nghe, nói, đọc và viết
            </p>
          </div>

          {/* Feature 2 */}
          <div className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow">
            <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center mb-3">
              <span className="text-lg">⏱️</span>
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">60 Giây/Câu</h3>
            <p className="text-sm text-gray-600">
              Thời gian hợp lý để suy nghĩ và lựa chọn đáp án
            </p>
          </div>

          {/* Feature 3 */}
          <div className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow">
            <div className="w-10 h-10 rounded-lg bg-rose-100 flex items-center justify-center mb-3">
              <BookOpen className="w-5 h-5 text-rose-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">Phân Tích Chi Tiết</h3>
            <p className="text-sm text-gray-600">
              Nhận kết quả và lộ trình cải thiện cá nhân hóa
            </p>
          </div>
        </div>

        {/* Test Info */}
        <div className="bg-gradient-to-br from-violet-50 to-blue-50 border border-violet-200 rounded-2xl p-8 mb-12">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Yêu cầu bài kiểm tra</h2>
          <ul className="space-y-3">
            <li className="flex items-start gap-3">
              <span className="w-5 h-5 rounded-full bg-violet-600 text-white flex items-center justify-center text-xs flex-shrink-0 mt-0.5">
                ✓
              </span>
              <span className="text-gray-700">Trả lời tất cả 10 câu hỏi để hoàn thành bài test</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-5 h-5 rounded-full bg-violet-600 text-white flex items-center justify-center text-xs flex-shrink-0 mt-0.5">
                ✓
              </span>
              <span className="text-gray-700">Mỗi câu hỏi có 60 giây để trả lời, nếu hết giờ sẽ tự động sang câu tiếp theo</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-5 h-5 rounded-full bg-violet-600 text-white flex items-center justify-center text-xs flex-shrink-0 mt-0.5">
                ✓
              </span>
              <span className="text-gray-700">Bạn có thể quay lại câu trước đó để xem lại câu hỏi</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-5 h-5 rounded-full bg-violet-600 text-white flex items-center justify-center text-xs flex-shrink-0 mt-0.5">
                ✓
              </span>
              <span className="text-gray-700">Hãy cố gắng trả lời tất cả các câu hỏi để có kết quả chính xác nhất</span>
            </li>
          </ul>
        </div>

        {/* CTA Button */}
        <div className="flex gap-3">
          <button
            onClick={() => navigate("/student/landing")}
            className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 font-semibold rounded-lg hover:bg-gray-200 transition-colors"
          >
            Hủy bỏ
          </button>
          <button
            onClick={onStart}
            disabled={isLoading}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-violet-600 to-violet-700 text-white font-semibold rounded-lg hover:from-violet-700 hover:to-violet-800 disabled:opacity-75 transition-all shadow-lg hover:shadow-xl"
          >
            {isLoading ? (
              <>
                <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                <span>Đang tải...</span>
              </>
            ) : (
              <>
                <span>Bắt đầu bài test</span>
                <ChevronRight className="w-5 h-5" />
              </>
            )}
          </button>
        </div>

        {/* Footer Note */}
        <p className="text-center text-xs text-gray-500 mt-8">
          Mỗi hành trình đều bắt đầu từ việc biết mình đang đứng ở đâu.
          <br />
          Hãy để PREDICA đo đúng năng lực của bạn — để lộ trình phía trước không lãng phí một ngày nào.
        </p>
      </main>
    </div>
  );
};

// Test View Component
const IELTSTestView: React.FC<{
  onBack: () => void;
}> = ({ onBack }) => {
  const navigate = useNavigate();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [answerStates, setAnswerStates] = useState<AnswerState[]>(
    MOCK_QUESTIONS.map(() => ({
      selected: null,
      isCorrect: null,
      answered: false,
    }))
  );

  const currentQuestion = MOCK_QUESTIONS[currentQuestionIndex];
  const currentAnswerState = answerStates[currentQuestionIndex];
  const isWarning = timeLeft < 5;
  const progressPercentage =
    ((currentQuestionIndex + 1) / MOCK_QUESTIONS.length) * 100;

  // Timer logic
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          handleNext();
          return 60;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [currentQuestionIndex]);

  const handleSelectAnswer = (optionId: string) => {
    if (currentAnswerState.answered) return;

    const isCorrect = optionId === currentQuestion.correctAnswer;
    const newAnswerStates = [...answerStates];
    newAnswerStates[currentQuestionIndex] = {
      selected: optionId,
      isCorrect,
      answered: true,
    };
    setAnswerStates(newAnswerStates);

    // Auto move to next after 1.2s
    setTimeout(() => {
      handleNext();
    }, 1200);
  };

  const handleNext = () => {
    if (currentQuestionIndex < MOCK_QUESTIONS.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setTimeLeft(60);
    } else {
      navigate("/student/ielts-result");
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
      setTimeLeft(60);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Compact Fixed Header */}
      <header className="fixed top-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-b border-gray-200 z-50">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          {/* Left: Question counter */}
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-gray-900">
              {currentQuestionIndex + 1}/{MOCK_QUESTIONS.length}
            </span>
            <div className="hidden sm:flex w-32 h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-violet-500 to-violet-600 transition-all duration-500"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>

          {/* Right: Timer */}
          <div
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-mono text-sm font-bold transition-colors ${
              isWarning
                ? "bg-rose-50 text-rose-600"
                : "bg-violet-50 text-violet-600"
            }`}
          >
            <div
              className={`w-2 h-2 rounded-full animate-pulse ${
                isWarning ? "bg-rose-600" : "bg-violet-600"
              }`}
            />
            {timeLeft}s
          </div>
        </div>

        {/* Mobile Progress Bar */}
        <div className="sm:hidden h-1 bg-gray-200 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-violet-500 to-violet-600 transition-all duration-500"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-20 pb-6 px-4">
        <div className="max-w-2xl mx-auto">
          {/* Question Card */}
          <div className="mb-6">
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between gap-4 mb-4">
                <h2 className="text-lg font-semibold text-gray-900 leading-snug flex-1">
                  {currentQuestion.question}
                </h2>
                <span
                  className={`text-xs font-semibold px-2.5 py-1 rounded-full border whitespace-nowrap flex-shrink-0 ${getDifficultyColor(
                    currentQuestion.difficulty
                  )}`}
                >
                  {currentQuestion.difficulty}
                </span>
              </div>
            </div>
          </div>

          {/* Answer Options - Grid Layout */}
          <div className="grid grid-cols-1 gap-2.5 mb-6">
            {currentQuestion.options.map((option) => {
              const isSelected = currentAnswerState.selected === option.id;
              const isCorrectOption =
                option.id === currentQuestion.correctAnswer;
              const showCorrect =
                currentAnswerState.answered && isCorrectOption;
              const showIncorrect =
                currentAnswerState.answered &&
                isSelected &&
                !isCorrectOption;

              let classes =
                "bg-white border border-gray-200 hover:border-violet-300 hover:bg-violet-50";
              let dotColor = "bg-gray-300";
              let dotBgColor = "bg-gray-100";

              if (showCorrect) {
                classes = "bg-emerald-50 border-emerald-300 shadow-md";
                dotColor = "bg-emerald-600";
                dotBgColor = "bg-emerald-100";
              } else if (showIncorrect) {
                classes = "bg-rose-50 border-rose-300 shadow-md";
                dotColor = "bg-rose-600";
                dotBgColor = "bg-rose-100";
              } else if (isSelected && !currentAnswerState.answered) {
                classes = "bg-violet-50 border-violet-300";
                dotColor = "bg-violet-600";
                dotBgColor = "bg-violet-100";
              }

              return (
                <button
                  key={option.id}
                  onClick={() => handleSelectAnswer(option.id)}
                  disabled={currentAnswerState.answered}
                  className={`flex items-center gap-3 p-3.5 rounded-xl transition-all duration-200 text-left disabled:cursor-default ${classes}`}
                >
                  <div
                    className={`w-6 h-6 rounded-full ${dotBgColor} flex items-center justify-center flex-shrink-0 font-semibold text-xs ${dotColor} transition-colors`}
                  >
                    {option.id}
                  </div>
                  <span className="text-sm text-gray-800 leading-snug">
                    {option.text}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Feedback Message */}
          {currentAnswerState.answered && (
            <div className="text-center mb-6">
              {currentAnswerState.isCorrect ? (
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-lg text-sm font-medium">
                  <span>✓</span>
                  <span>Đúng rồi!</span>
                </div>
              ) : (
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-rose-50 text-rose-700 rounded-lg text-sm font-medium">
                  <span>✗</span>
                  <span>Sai rồi</span>
                </div>
              )}
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex gap-2">
            <button
              onClick={handlePrevious}
              disabled={currentQuestionIndex === 0}
              className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Quay lại</span>
            </button>
            <button
              onClick={handleNext}
              disabled={!currentAnswerState.answered}
              className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-violet-600 to-violet-700 text-white font-medium rounded-lg hover:from-violet-700 hover:to-violet-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm"
            >
              <span>
                {currentQuestionIndex === MOCK_QUESTIONS.length - 1
                  ? "Hoàn thành"
                  : "Tiếp theo"}
              </span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

// Main Component
const IELTSAssessment: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewType>("intro");
  const [isLoading, setIsLoading] = useState(false);

  const handleStartTest = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setCurrentView("test");
    }, 300);
  };

  const handleBackToIntro = () => {
    setCurrentView("intro");
  };

  if (currentView === "intro") {
    return <IELTSIntroView onStart={handleStartTest} isLoading={isLoading} />;
  }

  return <IELTSTestView onBack={handleBackToIntro} />;
};

export default IELTSAssessment;

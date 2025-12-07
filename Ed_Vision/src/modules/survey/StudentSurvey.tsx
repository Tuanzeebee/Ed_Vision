import { useState, useCallback, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ClipboardList,
  X,
  Clock,
  ListChecks,
  Shield,
  ArrowRight,
  ArrowLeft,
  Check,
  Home,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { QuestionRenderer } from "./components";
import type { Question, SurveyAnswers } from "./types/survey.types";
import surveyService, { type SurveyDetailDto, type SurveyStatusDto, type AnswerDto } from "@/services/api/surveyService";
import "./survey.css";

// Helper: Map backend question type sang frontend type
const mapQuestionFromApi = (apiQuestion: SurveyDetailDto['questions'][0]): Question => {
  const baseQuestion = {
    id: apiQuestion.questionId,
    title: apiQuestion.category || `Câu hỏi ${apiQuestion.questionId}`,
    description: apiQuestion.questionText,
    required: apiQuestion.isRequired,
  };

  switch (apiQuestion.questionType) {
    case 'likert':
    case 'scale':
      return {
        ...baseQuestion,
        type: 'likert',
        // Store options with optionId for proper FK reference
        options: apiQuestion.options?.map((opt) => ({
          value: String(opt.optionId),
          label: opt.text,
        })) || [],
      };
    case 'yes-no':
    case 'yes_no':
      return {
        ...baseQuestion,
        type: 'yes-no',
        yesNoConfig: { yesLabel: 'Có', noLabel: 'Không' },
        // Store options with optionId for proper FK reference
        options: apiQuestion.options?.map((opt) => ({
          value: String(opt.optionId),
          label: opt.text,
          originalValue: opt.value, // Store original value to match yes(1)/no(0)
        })) || [],
      };
    case 'single-choice':
    case 'single_choice':
      return {
        ...baseQuestion,
        type: 'single-choice',
        options: apiQuestion.options?.map((opt) => ({
          value: String(opt.optionId), // Use optionId as value for DB FK
          label: opt.text,
        })) || [],
      };
    case 'multiple-choice':
    case 'multiple_choice':
    case 'multiple choice':
      return {
        ...baseQuestion,
        type: 'multiple-choice',
        options: apiQuestion.options?.map((opt) => ({
          value: String(opt.optionId), // Use optionId as value for DB FK
          label: opt.text,
        })) || [],
      };
    case 'free-text':
    case 'free_text':
      return {
        ...baseQuestion,
        type: 'free-text',
        required: true, // Bắt buộc trả lời câu tự luận
        freeTextConfig: {
          placeholder: 'Nhập câu trả lời của bạn...',
          maxLength: 500,
          rows: 4,
          showCharCount: true,
        },
      };
    case 'slider':
    case 'rating':
      return {
        ...baseQuestion,
        type: 'slider',
        sliderConfig: {
          min: apiQuestion.minValue ?? 0,
          max: apiQuestion.maxValue ?? 10,
          defaultValue: Math.round((apiQuestion.minValue ?? 0 + (apiQuestion.maxValue ?? 10)) / 2),
          unit: 'Điểm',
          gradientType: 'stress',
          leftLabel: String(apiQuestion.minValue ?? 0),
          rightLabel: String(apiQuestion.maxValue ?? 10),
        },
      };
    default:
      return { ...baseQuestion, type: 'single-choice', options: [] };
  }
};

type Props = {
  surveyId?: number; // Optional: nếu truyền vào thì load survey từ API
  onComplete?: (answers: SurveyAnswers) => void;
};

export default function StudentSurvey({ surveyId, onComplete }: Props) {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Check if this is a mandatory survey (from login redirect)
  const isMandatory = location.state?.mandatory === true;
  
  const [screen, setScreen] = useState<"loading" | "welcome" | "survey" | "thankYou" | "error" | "completed">("loading");
  const [currentQuestion, setCurrentQuestion] = useState(1);
  const [answers, setAnswers] = useState<SurveyAnswers>({});
  const [questions, setQuestions] = useState<Question[]>([]);
  const [surveyInfo, setSurveyInfo] = useState<{ title: string; description?: string; estimatedTime: string } | null>(null);
  const [, setSurveyStatus] = useState<SurveyStatusDto | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeSurveyId, setActiveSurveyId] = useState<number | null>(surveyId || null);
  const [isInputSurvey, setIsInputSurvey] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  const totalQuestions = questions.length;
  const progress = totalQuestions > 0 ? Math.round((currentQuestion / totalQuestions) * 100) : 0;

  // Block navigation for mandatory surveys
  useEffect(() => {
    // Chỉ block khi: mandatory VÀ là input survey (không phải periodic)
    const isMandatorySurvey = isMandatory && isInputSurvey;
    if (!isMandatorySurvey || screen === "thankYou" || screen === "completed") return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "Bạn cần hoàn thành khảo sát đầu vào trước khi tiếp tục.";
      return e.returnValue;
    };

    const handlePopState = (e: PopStateEvent) => {
      e.preventDefault();
      window.history.pushState(null, "", window.location.href);
      alert("Bạn cần hoàn thành khảo sát đầu vào trước khi tiếp tục sử dụng hệ thống.");
    };

    // Push current state to prevent back
    window.history.pushState(null, "", window.location.href);
    window.addEventListener("beforeunload", handleBeforeUnload);
    window.addEventListener("popstate", handlePopState);

    // Also block client-side navigation (react-router pushState/replaceState and link clicks)
    const originalPush = window.history.pushState.bind(window.history);
    const originalReplace = window.history.replaceState.bind(window.history);

    const blockNavigation = (message?: string) => {
      // Keep UX simple — show alert and prevent navigation
      // Browsers often ignore custom message in beforeunload, so use alert for SPA pushes
      // eslint-disable-next-line no-alert
      alert(message || 'Bạn cần hoàn thành khảo sát đầu vào trước khi tiếp tục.');
    };

    window.history.pushState = function (..._args: any[]) {
      blockNavigation();
      // do not call originalPush to prevent navigation
    };

    window.history.replaceState = function (..._args: any[]) {
      blockNavigation();
      // do not call originalReplace to prevent navigation
    };

    const onDocumentClick = (e: MouseEvent) => {
      // If click is on an <a> tag with href and target is same window, block it
      const target = e.target as HTMLElement | null;
      if (!target) return;
      const anchor = target.closest && (target.closest('a') as HTMLAnchorElement | null);
      if (anchor && anchor.href && (!anchor.target || anchor.target === '_self')) {
        e.preventDefault();
        // eslint-disable-next-line no-alert
        alert('Bạn cần hoàn thành khảo sát đầu vào trước khi rời trang.');
      }
    };

    document.addEventListener('click', onDocumentClick, true);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("popstate", handlePopState);
      // restore history
      try {
        window.history.pushState = originalPush;
        window.history.replaceState = originalReplace;
      } catch (e) {
        // ignore
      }
      document.removeEventListener('click', onDocumentClick, true);
    };
  }, [isMandatory, isInputSurvey, screen]);

  // Load survey status / detail
  useEffect(() => {
    const loadData = async () => {
      try {
        // Nếu có surveyId -> load trực tiếp survey đó
        if (surveyId) {
          const detail = await surveyService.getSurveyDetail(surveyId);
          setActiveSurveyId(surveyId);
          setQuestions(detail.questions.map(mapQuestionFromApi));
          setSurveyInfo({
            title: detail.title,
            description: detail.description,
            estimatedTime: detail.estimatedTime,
          });
          setScreen("welcome");
          return;
        }

        // Nếu không có surveyId -> check status
        const status = await surveyService.checkSurveyStatus();
        setSurveyStatus(status);

        // Nếu có input survey chưa làm -> load nó
        if (status.pendingInputSurvey) {
          const detail = await surveyService.getSurveyDetail(status.pendingInputSurvey.surveyId);
          setActiveSurveyId(status.pendingInputSurvey.surveyId);
          setIsInputSurvey(true);
          setQuestions(detail.questions.map(mapQuestionFromApi));
          setSurveyInfo({
            title: detail.title,
            description: detail.description,
            estimatedTime: detail.estimatedTime,
          });
          setScreen("welcome");
        } else if (status.pendingPeriodicSurveys.length > 0) {
          // Nếu có periodic survey -> load survey đầu tiên
          const firstPeriodic = status.pendingPeriodicSurveys[0];
          const detail = await surveyService.getSurveyDetail(firstPeriodic.surveyId);
          setActiveSurveyId(firstPeriodic.surveyId);
          setIsInputSurvey(false);
          setQuestions(detail.questions.map(mapQuestionFromApi));
          setSurveyInfo({
            title: detail.title,
            description: detail.description,
            estimatedTime: detail.estimatedTime,
          });
          setScreen("welcome");
        } else {
          // Đã hoàn thành tất cả surveys
          setScreen("completed");
        }
      } catch (err: unknown) {
        console.error("Error loading survey:", err);
        const errorMessage = err instanceof Error ? err.message : "Không thể tải khảo sát. Vui lòng thử lại sau.";
        setError(errorMessage);
        setScreen("error");
      }
    };

    loadData();
  }, [surveyId]);

  const validateCurrentQuestion = useCallback(() => {
    if (questions.length === 0) return false;
    
    const question = questions[currentQuestion - 1];
    const answer = answers[question.id];

    // Slider luôn có giá trị default nên luôn valid
    if (question.type === "slider") {
      return true;
    }

    // Free-text: bắt buộc trả lời
    if (question.type === "free-text") {
      return typeof answer === "string" && answer.trim().length > 0;
    }

    // Yes-No bắt buộc chọn
    if (question.type === "yes-no") {
      return answer === "yes" || answer === "no";
    }

    if (question.type === "single-choice" || question.type === "likert") {
      return answer !== undefined && answer !== "";
    }

    if (question.type === "multiple-choice") {
      return Array.isArray(answer) && answer.length > 0;
    }

    return false;
  }, [currentQuestion, answers, questions]);

  // Handler chung cho mọi loại câu hỏi
  const handleAnswerChange = (questionId: string | number, value: SurveyAnswers[keyof SurveyAnswers]) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const startSurvey = () => {
    setScreen("survey");
    setCurrentQuestion(1);
    // Initialize slider defaults
    const initialAnswers: SurveyAnswers = {};
    questions.forEach((q) => {
      if (q.type === "slider" && q.sliderConfig) {
        initialAnswers[q.id] = q.sliderConfig.defaultValue;
      }
    });
    setAnswers(initialAnswers);
  };

  const nextQuestion = () => {
    if (!validateCurrentQuestion()) return;

    if (currentQuestion === totalQuestions) {
      completeSurvey();
      return;
    }

    setCurrentQuestion((prev) => prev + 1);
  };

  const previousQuestion = () => {
    if (currentQuestion > 1) {
      setCurrentQuestion((prev) => prev - 1);
    }
  };

  const completeSurvey = async () => {
    if (!activeSurveyId) {
      setError("Không tìm thấy ID khảo sát");
      setScreen("error");
      return;
    }

    setIsSubmitting(true);
    try {
      // Convert answers to API format (flattened). Multiple-choice -> multiple entries with optionId.
      const apiAnswers: AnswerDto[] = [];
      questions.forEach((q) => {
        const answer = answers[q.id];
        const qId = typeof q.id === 'string' ? parseInt(q.id, 10) : q.id;

        if (q.type === "free-text") {
          apiAnswers.push({ questionId: qId, freeText: (answer as string) || "" });
          return;
        }

        if (q.type === "slider") {
          // Slider: answer is a number value, but we need to send freeText since there may be no options
          apiAnswers.push({ questionId: qId, freeText: String(answer ?? 5) });
          return;
        }

        if (q.type === "yes-no") {
          // Look up optionId from options array based on original value (1=yes, 0=no)
          const targetValue = answer === "yes" ? 1 : 0;
          const opt = (q.options as Array<{ value: string; originalValue?: number }>)?.find(
            (o) => o.originalValue === targetValue
          );
          if (opt) {
            apiAnswers.push({ questionId: qId, optionId: Number(opt.value) });
          } else {
            // Fallback: use freeText
            apiAnswers.push({ questionId: qId, freeText: answer as string });
          }
          return;
        }

        if (q.type === "likert") {
          // Likert: if options exist, look up optionId; otherwise store as freeText
          if (q.options && q.options.length > 0) {
            const opt = q.options.find((o) => o.value === String(answer) || o.label === String(answer));
            if (opt) {
              apiAnswers.push({ questionId: qId, optionId: Number(opt.value) });
            } else {
              apiAnswers.push({ questionId: qId, freeText: String(answer) });
            }
          } else {
            // No options defined — store rating as freeText
            apiAnswers.push({ questionId: qId, freeText: String(answer) });
          }
          return;
        }

        if (q.type === "single-choice") {
          // Single-choice: answer is optionId directly
          apiAnswers.push({ questionId: qId, optionId: Number(answer) || undefined });
          return;
        }

        if (q.type === "multiple-choice" && Array.isArray(answer)) {
          // answer array contains optionId values as strings
          (answer as string[]).forEach((val) => {
            const optId = Number(val);
            apiAnswers.push({ questionId: qId, optionId: Number.isNaN(optId) ? undefined : optId });
          });
          return;
        }

        // fallback: push empty questionId to indicate presence
        apiAnswers.push({ questionId: qId });
      });

      try {
        await surveyService.submitSurvey({
          surveyId: activeSurveyId,
          answers: apiAnswers,
        });
      } catch (submitErr: unknown) {
        // Re-throw after logging to be caught by outer catch
        console.error("Survey submit payload:", apiAnswers);
        // If axios error include response body/status for debugging
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const anyErr = submitErr as any;
        if (anyErr?.isAxiosError) {
          console.error('Axios submit error status:', anyErr.response?.status, 'data:', anyErr.response?.data);
        }
        throw submitErr;
      }

      // Mark completed in cache so RequireInputSurvey can skip future checks
      try {
        const raw = localStorage.getItem('user');
        if (raw) {
          const user = JSON.parse(raw);
          user.hasCompletedInputSurvey = true;
          user.pendingInputSurveyId = null;
          localStorage.setItem('user', JSON.stringify(user));
        }
      } catch (e) {
        // ignore cache write errors
      }

      setScreen("thankYou");
      onComplete?.(answers);
    } catch (err: unknown) {
      console.error("Error submitting survey:", err);
      const errorMessage = err instanceof Error ? err.message : "Có lỗi xảy ra khi gửi khảo sát";
      setError(errorMessage);
      setScreen("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render Loading Screen
  const renderLoadingScreen = () => (
    <div className="w-full max-w-xl mx-auto animate-fade-in">
      <Card className="glass-card rounded-2xl p-6 sm:p-8 text-center border-0">
        <CardContent className="p-0">
          <Loader2 className="w-12 h-12 text-indigo-400 animate-spin mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-gray-700">Đang tải khảo sát...</h2>
        </CardContent>
      </Card>
    </div>
  );

  // Render Error Screen
  const renderErrorScreen = () => (
    <div className="w-full max-w-xl mx-auto animate-fade-in">
      <Card className="glass-card rounded-2xl p-6 sm:p-8 text-center border-0">
        <CardContent className="p-0">
          <div className="w-16 h-16 bg-gradient-to-br from-red-300 to-orange-300 rounded-xl mx-auto mb-4 flex items-center justify-center">
            <AlertCircle className="text-white w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-3">Có lỗi xảy ra</h1>
          <p className="text-base text-gray-600 mb-6">{error}</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              onClick={() => window.location.reload()}
              className="bg-gradient-to-r from-indigo-400 to-purple-400 text-white font-semibold py-3 px-6 rounded-xl h-auto"
            >
              Thử lại
            </Button>
            <a
              href="/"
              className="inline-flex items-center justify-center px-5 py-3 glass-card text-gray-700 rounded-xl hover:bg-white/90 transition-all duration-300 font-semibold"
            >
              <Home className="mr-2 w-4 h-4" />
              Về trang chủ
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // Render Completed Screen (đã làm tất cả surveys)
  const renderCompletedScreen = () => (
    <div className="w-full max-w-xl mx-auto animate-fade-in">
      <Card className="glass-card rounded-2xl p-6 sm:p-8 text-center border-0">
        <CardContent className="p-0">
          <div className="w-16 h-16 bg-gradient-to-br from-green-300 to-emerald-300 rounded-xl mx-auto mb-4 flex items-center justify-center">
            <Check className="text-white w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-3">Đã hoàn thành!</h1>
          <p className="text-base text-gray-600 mb-6">
            Bạn đã hoàn thành tất cả các khảo sát hiện có.
          </p>
          <a
            href="/"
            className="inline-flex items-center justify-center px-5 py-2.5 bg-gradient-to-r from-indigo-400 to-purple-400 text-white rounded-xl hover:shadow-lg transition-all duration-300 font-semibold"
          >
            <Home className="mr-2 w-4 h-4" />
            Về trang chủ
          </a>
        </CardContent>
      </Card>
    </div>
  );

  // Render Welcome Screen
  const renderWelcomeScreen = () => (
    <div className="w-full max-w-xl mx-auto animate-fade-in">
      <Card className="glass-card rounded-2xl p-6 sm:p-8 text-center border-0">
        <CardContent className="p-0">
          <div className="w-16 h-16 bg-gradient-to-br from-indigo-300 to-purple-300 rounded-xl mx-auto mb-4 flex items-center justify-center">
            <ClipboardList className="text-white w-8 h-8" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-3">
            {surveyInfo?.title || "Khảo Sát"}
          </h1>
          <p className="text-base text-gray-600 mb-6">
            {surveyInfo?.description || "Vui lòng hoàn thành khảo sát"}
          </p>
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="bg-white/60 rounded-xl p-3">
              <Clock className="text-indigo-400 w-5 h-5 mx-auto mb-1" />
              <p className="text-xs font-semibold text-gray-700">{surveyInfo?.estimatedTime || "5-10 phút"}</p>
            </div>
            <div className="bg-white/60 rounded-xl p-3">
              <ListChecks className="text-purple-400 w-5 h-5 mx-auto mb-1" />
              <p className="text-xs font-semibold text-gray-700">{totalQuestions} câu hỏi</p>
            </div>
            <div className="bg-white/60 rounded-xl p-3">
              <Shield className="text-pink-400 w-5 h-5 mx-auto mb-1" />
              <p className="text-xs font-semibold text-gray-700">Bảo mật</p>
            </div>
          </div>
          <Button
            onClick={startSurvey}
            className="w-full bg-gradient-to-r from-indigo-400 to-purple-400 text-white font-semibold py-3 px-6 rounded-xl hover:shadow-lg transition-all duration-300 transform hover:scale-105 h-auto cursor-pointer"
          >
            Bắt Đầu Ngay
            <ArrowRight className="ml-2 w-4 h-4" />
          </Button>
        </CardContent>
      </Card>
    </div>
  );

  // Render Question Content - Sử dụng QuestionRenderer
  const renderQuestionContent = () => {
    const question = questions[currentQuestion - 1];
    const answer = answers[question.id];

    return (
      <QuestionRenderer
        question={question}
        answer={answer}
        onAnswerChange={handleAnswerChange}
      />
    );
  };

  // Handle exit survey
  const handleExitClick = () => {
    // Luôn hiển thị popup xác nhận
    setShowExitConfirm(true);
  };

  const confirmExit = () => {
    setShowExitConfirm(false);
    
    // Chỉ bắt buộc khi: từ redirect mandatory VÀ đây là input survey
    const isMandatorySurvey = isMandatory && isInputSurvey;
    if (isMandatorySurvey) {
      return;
    }
    
    // Nếu đang thoát khỏi periodic survey (không phải input survey),
    // set cache = true tạm thời để RequireInputSurvey không redirect lại
    // API sẽ được gọi và update cache đúng sau đó
    if (!isInputSurvey) {
      try {
        const raw = localStorage.getItem('user');
        if (raw) {
          const user = JSON.parse(raw);
          user.hasCompletedInputSurvey = true; // Tạm set true để tránh redirect loop
          delete user.pendingInputSurveyId;
          localStorage.setItem('user', JSON.stringify(user));
        }
      } catch (e) {
        // ignore
      }
    }
    
    // Quay về trang chủ hoặc trang trước
    const from = location.state?.from?.pathname;
    if (from && from !== '/student/survey') {
      navigate(from, { replace: true });
    } else {
      navigate('/student/instructions', { replace: true });
    }
  };

  const cancelExit = () => {
    setShowExitConfirm(false);
  };

  // Render Exit Confirmation Modal
  const renderExitConfirmModal = () => {
    // Chỉ bắt buộc khi: từ redirect mandatory VÀ đây là input survey
    const isMandatorySurvey = isMandatory && isInputSurvey;
    
    return (
      <Dialog open={showExitConfirm} onOpenChange={setShowExitConfirm}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className={`flex items-center gap-2 ${isMandatorySurvey ? 'text-red-600' : 'text-orange-600'}`}>
              <AlertCircle className="w-5 h-5" />
              {isMandatorySurvey ? 'Không thể thoát' : 'Xác nhận thoát khảo sát'}
            </DialogTitle>
          </DialogHeader>
          <div className="px-6 py-4">
            {isMandatorySurvey ? (
              <>
                <p className="text-gray-600">
                  Đây là khảo sát đầu vào bắt buộc.
                </p>
                <p className="text-red-500 font-medium mt-2">
                  Bạn cần hoàn thành khảo sát này trước khi sử dụng hệ thống.
                </p>
              </>
            ) : (
              <>
                <p className="text-gray-600">
                  Bạn có chắc chắn muốn thoát khỏi khảo sát?
                </p>
                <p className="text-orange-500 font-medium mt-2">
                  Lưu ý: Các câu trả lời của bạn sẽ không được lưu lại.
                </p>
              </>
            )}
          </div>
          <DialogFooter className="flex gap-2 sm:gap-2">
            {isMandatorySurvey ? (
              <Button
                type="button"
                onClick={cancelExit}
                className="flex-1 bg-gradient-to-r from-indigo-400 to-purple-400 text-white"
              >
                Tiếp tục làm khảo sát
              </Button>
            ) : (
              <>
                <Button
                  type="button"
                  variant="outline"
                  onClick={cancelExit}
                  className="flex-1"
                >
                  Tiếp tục làm
                </Button>
                <Button
                  type="button"
                  onClick={confirmExit}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white"
                >
                  Thoát khảo sát
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  };

  // Render Survey Screen
  const renderSurveyScreen = () => {
    if (questions.length === 0) return null;
    
    const question = questions[currentQuestion - 1];
    const isValid = validateCurrentQuestion();

    return (
      <div className="w-full max-w-2xl mx-auto animate-fade-in">
        {/* Progress Header */}
        <Card className="glass-card rounded-xl mb-4 p-4 border-0">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-700">
                Câu hỏi <span>{currentQuestion}</span>/
                <span>{totalQuestions}</span>
              </p>
              <div className="w-48 bg-gray-200 rounded-full h-2 mt-2">
                <div
                  className="bg-gradient-to-r from-indigo-400 to-purple-400 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <p className="text-2xl font-bold text-indigo-400">{progress}%</p>
            </div>
          </div>
        </Card>

        {/* Question Content */}
        <Card className="glass-card rounded-2xl p-5 sm:p-6 mb-4 border-0">
          <CardContent className="p-0">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-2">
              {question.title}
            </h2>
            <p className="text-sm text-gray-600 mb-4">{question.description}</p>
            {renderQuestionContent()}
          </CardContent>
        </Card>

        {/* Navigation Buttons */}
        <div className="flex gap-3">
          {currentQuestion > 1 && (
            <Button
              onClick={previousQuestion}
              variant="outline"
              disabled={isSubmitting}
              className="flex-1 glass-card text-gray-700 font-semibold py-3 px-5 rounded-xl hover:bg-white/90 transition-all duration-300 h-auto border-0 cursor-pointer"
            >
              <ArrowLeft className="mr-2 w-4 h-4" />
              Quay Lại
            </Button>
          )}
          <Button
            onClick={nextQuestion}
            disabled={!isValid || isSubmitting}
            className={cn(
              "flex-1 bg-gradient-to-r from-indigo-400 to-purple-400 text-white font-semibold py-3 px-5 rounded-xl transition-all duration-300 hover:shadow-lg h-auto cursor-pointer",
              (!isValid || isSubmitting) && "opacity-50 cursor-not-allowed from-gray-300 to-gray-400"
            )}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                Đang gửi...
              </>
            ) : currentQuestion === totalQuestions ? (
              <>
                Hoàn Thành
                <Check className="ml-2 w-4 h-4" />
              </>
            ) : (
              <>
                Tiếp Theo
                <ArrowRight className="ml-2 w-4 h-4" />
              </>
            )}
          </Button>
        </div>
      </div>
    );
  };

  // Render Thank You Screen
  const renderThankYouScreen = () => {
    const handleContinue = () => {
      // Navigate to the original destination or instructions page
      const from = location.state?.from?.pathname;
      if (from && from !== '/student/survey') {
        navigate(from);
      } else {
        navigate('/student/instructions');
      }
    };

    return (
      <div className="w-full max-w-xl mx-auto animate-fade-in">
        <Card className="glass-card rounded-2xl p-6 sm:p-8 text-center border-0">
          <CardContent className="p-0">
            <div className="w-16 h-16 bg-gradient-to-br from-green-300 to-emerald-300 rounded-xl mx-auto mb-4 flex items-center justify-center">
              <Check className="text-white w-8 h-8" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-3">
              Hoàn Thành!
            </h1>
            <p className="text-base text-gray-600 mb-6">
              Cảm ơn bạn đã hoàn thành khảo sát. Thông tin của bạn đã được ghi nhận.
            </p>
            {isInputSurvey || isMandatory ? (
              // Input survey (mandatory) - redirect to main app
              <div className="bg-indigo-50/50 rounded-xl p-5 mb-6">
                <h3 className="font-semibold text-gray-800 mb-2">Chào mừng bạn!</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Khảo sát đầu vào đã hoàn thành. Bạn có thể tiếp tục sử dụng hệ thống.
                </p>
                <Button
                  onClick={handleContinue}
                  className="w-full bg-gradient-to-r from-indigo-400 to-purple-400 text-white font-semibold py-3 px-6 rounded-xl hover:shadow-lg transition-all duration-300 h-auto"
                >
                  Tiếp tục
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </div>
            ) : (
              // Periodic survey - show options
              <div className="bg-indigo-50/50 rounded-xl p-5 mb-6">
                <h3 className="font-semibold text-gray-800 mb-2">Bước tiếp theo</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Đội ngũ tư vấn sẽ liên hệ với bạn trong vòng 3-5 ngày làm việc.
                </p>
                <div className="flex flex-col sm:flex-row gap-2 justify-center">
                  <a
                    href="/"
                    className="inline-flex items-center justify-center px-5 py-2.5 glass-card text-gray-700 rounded-xl hover:bg-white/90 transition-all duration-300 font-semibold text-sm"
                  >
                    <Home className="mr-2 w-4 h-4" />
                    Về trang chủ
                  </a>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <div className="gradient-bg min-h-screen flex items-center justify-center relative">
      {/* Exit Button - góc phải trên màn hình (fixed) */}
      {(screen === "welcome" || screen === "survey") && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={handleExitClick}
          className="fixed top-6 right-6 h-12 w-12 rounded-full bg-white text-gray-600 hover:bg-red-100 hover:text-red-600 transition-colors cursor-pointer shadow-lg z-50"
          title="Thoát khảo sát"
        >
          <X className="w-6 h-6" />
        </Button>
      )}
      
      <div className="w-full px-4 py-6">
        {screen === "loading" && renderLoadingScreen()}
        {screen === "error" && renderErrorScreen()}
        {screen === "completed" && renderCompletedScreen()}
        {screen === "welcome" && renderWelcomeScreen()}
        {screen === "survey" && renderSurveyScreen()}
        {screen === "thankYou" && renderThankYouScreen()}
      </div>
      {/* Exit Confirmation Modal */}
      {renderExitConfirmModal()}
    </div>
  );
}

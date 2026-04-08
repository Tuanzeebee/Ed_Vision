import { useState } from 'react';
import { motion } from 'framer-motion';

type Comment = {
  id: string;
  author: string;
  avatar: string;
  text: string;
  color: string;
  replyTo?: string;
};

type Lesson = {
  id: string;
  number: string;
  title: string;
  duration: string;
  completed?: boolean;
  isDownloadable?: boolean;
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
  onCompleteModule?: () => void; // Callback when module is completed
};

type Note = {
  id: string;
  time: string;
  content: string;
  timestamp: number;
};

type QuizQuestion = {
  id: string;
  type: 'multiple-choice' | 'true-false' | 'fill-blank' | 'multiple-select';
  question: string;
  options?: string[];
  correctAnswer: string | string[];
  userAnswer?: string | string[];
  explanation?: string;
};

export default function LearningModulePanel({ visible, onClose, onCompleteModule }: Props) {
  const [activeTab, setActiveTab] = useState<'content' | 'transcript' | 'notes'>('content');
  const [commentText, setCommentText] = useState('');
  const [currentStep, setCurrentStep] = useState(1);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [expandedSections, setExpandedSections] = useState<string[]>(['1']);
  const [currentLessonType, setCurrentLessonType] = useState<'video' | 'document' | 'quiz'>('video');
  const [isQuizStarted, setIsQuizStarted] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, string | string[]>>({});
  const [isQuizSubmitted, setIsQuizSubmitted] = useState(false);
  const [notes, setNotes] = useState<Note[]>([
    {
      id: '1',
      time: '02:15',
      content: 'AI đang thay đổi cách chúng ta làm việc - cần học thêm về machine learning',
      timestamp: 135
    },
    {
      id: '2',
      time: '05:42',
      content: 'Các ứng dụng thực tế: ChatGPT, image generation, data analysis',
      timestamp: 342
    },
    {
      id: '3',
      time: '08:20',
      content: 'Quan trọng: Hiểu được prompt engineering để sử dụng AI hiệu quả',
      timestamp: 500
    }
  ]);
  const [comments, setComments] = useState<Comment[]>([
    {
      id: '1',
      author: 'Riyash',
      avatar: '👨',
      text: 'Enjoying the stream so far',
      color: 'bg-blue-400'
    },
    {
      id: '2',
      author: 'Jaggi',
      avatar: '👨',
      text: 'Look at that!',
      color: 'bg-green-400'
    },
    {
      id: '3',
      author: 'Pradeep',
      avatar: '👨',
      text: 'You are so good in this game',
      color: 'bg-purple-500'
    }
  ]);
  
  const quizQuestions: QuizQuestion[] = [
    {
      id: 'q1',
      type: 'multiple-choice',
      question: 'Trí tuệ nhân tạo (AI) là gì?',
      options: [
        'Khả năng của máy tính thực hiện các nhiệm vụ đòi hỏi trí thông minh con người',
        'Một loại phần mềm chỉ dùng để chơi game',
        'Công nghệ chỉ dùng trong y tế',
        'Hệ thống máy tính không cần lập trình'
      ],
      correctAnswer: 'Khả năng của máy tính thực hiện các nhiệm vụ đòi hỏi trí thông minh con người',
      explanation: 'AI là khả năng của máy móc thực hiện các nhiệm vụ thường đòi hỏi trí thông minh của con người như học tập, suy luận và giải quyết vấn đề.'
    },
    {
      id: 'q2',
      type: 'true-false',
      question: 'AI hẹp (Narrow AI) có thể thực hiện nhiều nhiệm vụ khác nhau giống như con người.',
      options: ['Đúng', 'Sai'],
      correctAnswer: 'Sai',
      explanation: 'AI hẹp chỉ được thiết kế để thực hiện một nhiệm vụ cụ thể, không thể thực hiện nhiều nhiệm vụ khác nhau như con người.'
    },
    {
      id: 'q3',
      type: 'multiple-select',
      question: 'Chọn các lĩnh vực mà AI đang được ứng dụng: (Chọn tất cả đáp án đúng)',
      options: [
        'Y tế - chẩn đoán bệnh',
        'Thương mại điện tử - gợi ý sản phẩm',
        'Giao thông - xe tự lái',
        'Chỉ trong nghiên cứu khoa học'
      ],
      correctAnswer: ['Y tế - chẩn đoán bệnh', 'Thương mại điện tử - gợi ý sản phẩm', 'Giao thông - xe tự lái'],
      explanation: 'AI đang được ứng dụng rộng rãi trong nhiều lĩnh vực: y tế, thương mại, giao thông, giáo dục, và nhiều ngành khác.'
    },
    {
      id: 'q4',
      type: 'fill-blank',
      question: 'Điền từ còn thiếu: AI tổng quát (General AI) có khả năng hiểu, học hỏi và áp dụng trí thông minh vào bất kỳ vấn đề nào, giống như _____.',
      correctAnswer: 'con người',
      explanation: 'AI tổng quát (Strong AI) được thiết kế để có khả năng suy nghĩ và giải quyết vấn đề giống như con người, nhưng hiện vẫn đang trong giai đoạn nghiên cứu.'
    }
  ];

  const sections: Section[] = [
    {
      id: '1',
      title: 'Module 1: Introduction',
      lessonCount: 8,
      duration: '52m',
      lessons: [
        {
          id: '1-1',
          number: '1',
          title: 'Giới thiệu khóa học',
          duration: '05:02',
          completed: true
        },
        {
          id: '1-2',
          number: '2',
          title: 'Cài đặt môi trường làm việc',
          duration: '08:15',
          completed: false
        },
        {
          id: '1-3',
          number: '3',
          title: 'Tạo dự án đầu tiên',
          duration: '12:30',
          completed: false
        },
        {
          id: '1-4',
          number: '4',
          title: 'Cấu trúc thư mục dự án',
          duration: '07:45',
          completed: false
        },
        {
          id: '1-5',
          number: '5',
          title: 'Làm quen với giao diện',
          duration: '09:20',
          completed: false
        },
        {
          id: '1-6',
          number: '6',
          title: 'Các công cụ hỗ trợ',
          duration: '06:40',
          completed: false
        },
        {
          id: '1-7',
          number: '7',
          title: 'Tổng kết Module 1',
          duration: '03:15',
          completed: false
        },
        {
          id: '1-8',
          number: '',
          title: 'Bài kiểm tra Module 1',
          duration: 'AI Quiz',
          completed: false,
          isQuiz: true
        }
      ]
    }
  ];

  const lessons: Lesson[] = sections.flatMap(s => s.lessons);

  const totalSteps = lessons.length;

  const handlePreviousLesson = () => {
    if (currentStep > 1) {
      const newStep = currentStep - 1;
      setCurrentStep(newStep);
      const lesson = lessons[newStep - 1];
      setCurrentLessonType(lesson.isQuiz ? 'quiz' : lesson.isDownloadable ? 'document' : 'video');
    }
  };

  const handleNextLesson = () => {
    if (currentStep < totalSteps) {
      const newStep = currentStep + 1;
      
      // Check if completing a module (assuming last lesson in a module triggers completion)
      // In real scenario, this would check if it's the last lesson of the module
      const isModuleComplete = currentStep === totalSteps - 1; // Simplified logic
      
      if (isModuleComplete) {
        // Trigger car animation on Learning Map Panel when it opens next time
        localStorage.setItem('triggerModuleUnlock', 'true');
      }
      
      setCurrentStep(newStep);
      const lesson = lessons[newStep - 1];
      setCurrentLessonType(lesson.isQuiz ? 'quiz' : lesson.isDownloadable ? 'document' : 'video');
    }
  };

  const handleSelectLesson = (lessonId: string) => {
    const lessonIndex = lessons.findIndex(l => l.id === lessonId);
    if (lessonIndex !== -1) {
      setCurrentStep(lessonIndex + 1);
      const lesson = lessons[lessonIndex];
      setCurrentLessonType(lesson.isQuiz ? 'quiz' : lesson.isDownloadable ? 'document' : 'video');
    }
  };

  const handleDownloadDocument = () => {
    // Simulate download
    const link = document.createElement('a');
    link.href = '#';
    link.download = 'tai-lieu-bai-giang.pdf';
    link.click();
  };

  const handleAddComment = () => {
    if (commentText.trim()) {
      const newComment: Comment = {
        id: Date.now().toString(),
        author: 'You',
        avatar: '👤',
        text: commentText.trim(),
        color: 'bg-purple-400',
        replyTo: replyingTo || undefined
      };
      setComments([...comments, newComment]);
      setCommentText('');
      setReplyingTo(null);
    }
  };

  const handleReplyClick = (commentId: string, author: string) => {
    setReplyingTo(commentId);
    setCommentText(`@${author} `);
  };

  const handleCancelReply = () => {
    setReplyingTo(null);
    setCommentText('');
  };

  const handleAddNote = () => {
    if (noteText.trim()) {
      const newNote: Note = {
        id: Date.now().toString(),
        time: '11:41', // Current video time
        content: noteText.trim(),
        timestamp: 701
      };
      setNotes([...notes, newNote]);
      setNoteText('');
    }
  };

  const handleDeleteNote = (noteId: string) => {
    setNotes(notes.filter(note => note.id !== noteId));
  };

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev =>
      prev.includes(sectionId)
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    );
  };

  const handleStartQuiz = () => {
    setIsQuizStarted(true);
    setCurrentQuestionIndex(0);
    setQuizAnswers({});
    setIsQuizSubmitted(false);
  };

  const handleQuizAnswer = (questionId: string, answer: string | string[]) => {
    setQuizAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < quizQuestions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const handleSubmitQuiz = () => {
    setIsQuizSubmitted(true);
  };

  const calculateScore = () => {
    let correct = 0;
    quizQuestions.forEach(q => {
      const userAns = quizAnswers[q.id];
      if (q.type === 'multiple-select') {
        const correctAns = q.correctAnswer as string[];
        const userAnsArr = userAns as string[];
        if (userAnsArr && correctAns.length === userAnsArr.length && 
            correctAns.every(a => userAnsArr.includes(a))) {
          correct++;
        }
      } else {
        if (userAns && userAns.toString().toLowerCase().trim() === 
            q.correctAnswer.toString().toLowerCase().trim()) {
          correct++;
        }
      }
    });
    return Math.round((correct / quizQuestions.length) * 100);
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-6xl h-[90vh] backdrop-blur-[20px] bg-white/10 border border-white/20 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/20">
          <div className="flex items-center gap-4">
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/20 transition-colors text-white/80 hover:text-white"
            >
              <i className="fas fa-times"></i>
            </button>
            <div>
              <h2 className="text-2xl font-bold text-white">Module 1 : Introduction</h2>
              <div className="flex gap-4 mt-1 text-sm text-white/70">
                <span className="flex items-center gap-1">
                  <i className="far fa-clock"></i>
                  Thời lượng tối đa
                </span>
                <span className="flex items-center gap-1">
                  <i className="far fa-file-alt"></i>
                  Những nội bật đầu
                </span>
                <span className="flex items-center gap-1">
                  <i className="far fa-list-alt"></i>
                  Học giải bài
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Video Section */}
          <div className="flex-1 overflow-y-auto scrollbar-none">
            <div className="p-6">
            {/* Stepper Progress */}
            <div className="mb-3">
              <div className="flex items-center justify-center gap-1">
                {lessons.map((_, index) => {
                  const stepNumber = index + 1;
                  const isActive = stepNumber === currentStep;
                  const isComplete = stepNumber < currentStep;
                  const isLastStep = index === lessons.length - 1;
                  
                  return (
                    <div key={stepNumber} className="flex items-center">
                      {/* Step Circle or Gift Box */}
                      <motion.div
                        className="relative"
                      >
                        {isLastStep ? (
                          // Gift Box for final step
                          <div
                            className={`w-7 h-7 flex items-center justify-center transition-all duration-300 ${
                              isComplete
                                ? 'text-yellow-400'
                                : isActive
                                ? 'text-purple-400 animate-bounce'
                                : 'text-white/40'
                            }`}
                          >
                            <i className="fas fa-gift text-lg"></i>
                          </div>
                        ) : (
                          // Regular step circle
                          <div
                            className={`w-7 h-7 rounded-full flex items-center justify-center transition-all duration-300 border ${
                              isComplete
                                ? 'bg-purple-500 border-purple-500'
                                : isActive
                                ? 'bg-purple-500 border-purple-500 ring-2 ring-purple-300/50'
                                : 'bg-white/10 border-white/30'
                            }`}
                          >
                            {isComplete ? (
                              <i className="fas fa-check text-white text-xs"></i>
                            ) : isActive ? (
                              <div className="w-2 h-2 bg-white rounded-full"></div>
                            ) : (
                              <span className="text-white/70 text-[10px] font-medium">{stepNumber}</span>
                            )}
                          </div>
                        )}
                      </motion.div>

                      {/* Connector Line */}
                      {index < lessons.length - 1 && (
                        <div className="w-12 h-0.5 mx-1 bg-white/20 relative overflow-hidden">
                          <motion.div
                            className="absolute inset-0 bg-purple-500"
                            initial={{ width: '0%' }}
                            animate={{ width: isComplete ? '100%' : '0%' }}
                            transition={{ duration: 0.4 }}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Step Title - Compact */}
              <div className="mt-2 text-center">
                <motion.p
                  key={currentStep}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="text-white/90 font-medium text-xs"
                >
                  Lesson {currentStep} of {totalSteps}
                </motion.p>
              </div>
            </div>

            {/* Video Player */}
            {currentLessonType === 'video' && (
              <div className="relative rounded-xl overflow-hidden shadow-2xl mb-4 group" style={{ aspectRatio: '16/9' }}>
                <img
                  src="https://images.unsplash.com/photo-1519904981063-b0cf448d479e?w=1920&h=1080&fit=crop"
                  alt="Learning content"
                  className="w-full h-full object-cover"
                />
              {/* Video Controls - Netflix Style */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/80 to-transparent pb-3 pt-12 px-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                {/* Progress Bar */}
                <div className="mb-3">
                  <div className="relative h-1 bg-gray-600 rounded-full cursor-pointer group/progress hover:h-1.5 transition-all">
                    <div className="absolute h-full w-1/4 bg-red-600 rounded-full flex items-center justify-end">
                      <div className="w-3 h-3 bg-red-600 rounded-full opacity-0 group-hover/progress:opacity-100 transition-opacity"></div>
                    </div>
                  </div>
                </div>

                {/* Controls Row */}
                <div className="flex items-center justify-between">
                  {/* Left Controls */}
                  <div className="flex items-center gap-4">
                    {/* Play/Pause Button */}
                    <button className="w-10 h-10 flex items-center justify-center hover:bg-white/10 rounded-full transition-colors">
                      <i className="fas fa-play text-white text-xl"></i>
                    </button>

                    {/* Volume Button */}
                    <button className="w-8 h-8 flex items-center justify-center hover:bg-white/10 rounded-full transition-colors">
                      <i className="fas fa-volume-up text-white text-lg"></i>
                    </button>

                    {/* Time Display */}
                    <div className="flex items-center gap-1 text-white text-sm font-medium">
                      <span>11:41</span>
                      <span className="text-gray-400">/</span>
                      <span className="text-gray-400">49:27</span>
                    </div>
                  </div>

                  {/* Right Controls */}
                  <div className="flex items-center gap-2">
                    {/* Audio & Subtitles */}
                    <button className="w-8 h-8 flex items-center justify-center hover:bg-white/10 rounded-full transition-colors">
                      <i className="fas fa-broadcast-tower text-white text-sm"></i>
                    </button>

                    {/* Next Episode */}
                    <button className="w-8 h-8 flex items-center justify-center hover:bg-white/10 rounded-full transition-colors">
                      <i className="fas fa-step-forward text-white text-sm"></i>
                    </button>

                    {/* Subtitles */}
                    <button className="w-8 h-8 flex items-center justify-center hover:bg-white/10 rounded-full transition-colors">
                      <i className="fas fa-closed-captioning text-white text-sm"></i>
                    </button>

                    {/* Settings */}
                    <button className="w-8 h-8 flex items-center justify-center hover:bg-white/10 rounded-full transition-colors relative">
                      <i className="fas fa-cog text-white text-sm"></i>
                      <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-600 rounded-full"></div>
                    </button>

                    {/* Picture in Picture */}
                    <button className="w-8 h-8 flex items-center justify-center hover:bg-white/10 rounded-full transition-colors">
                      <i className="far fa-window-restore text-white text-sm"></i>
                    </button>

                    {/* Fullscreen */}
                    <button className="w-8 h-8 flex items-center justify-center hover:bg-white/10 rounded-full transition-colors">
                      <i className="fas fa-expand text-white text-sm"></i>
                    </button>
                  </div>
                </div>
              </div>
              </div>
            )}

            {/* Quiz Waiting Room & Quiz Interface */}
            {currentLessonType === 'quiz' && (
              <div className="bg-black/20 backdrop-blur-sm rounded-xl p-6 mb-4 border border-white/10">
                {!isQuizStarted ? (
                  /* Waiting Room */
                  <>
                    {/* Quiz Header */}
                    <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/20">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                          <i className="fas fa-clipboard-question text-blue-300 text-xl"></i>
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-white">Bài kiểm tra Module 1</h3>
                          <p className="text-sm text-white/60">AI Quiz · Chưa bắt đầu</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full text-xs font-medium">0/{quizQuestions.length}</span>
                      </div>
                    </div>

                    {/* Quiz Info */}
                    <div className="space-y-4 mb-6">
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
                              <p className="text-white font-semibold">{quizQuestions.length} câu</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                              <i className="fas fa-clock text-purple-300"></i>
                            </div>
                            <div>
                              <p className="text-white/60 text-xs">Thời gian</p>
                              <p className="text-white font-semibold">10 phút</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                              <i className="fas fa-star text-green-300"></i>
                            </div>
                            <div>
                              <p className="text-white/60 text-xs">Điểm đạt</p>
                              <p className="text-white font-semibold">80%</p>
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
                        </div>
                      </div>

                      {/* Quiz Instructions */}
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
                            <span>Hoàn thành tất cả câu hỏi để nhận điểm tối đa</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <i className="fas fa-check text-green-400 mt-1 text-xs"></i>
                            <span>Bạn có thể làm lại bài kiểm tra nhiều lần để cải thiện điểm</span>
                          </li>
                        </ul>
                      </div>

                      {/* Start Quiz Button */}
                      <div className="flex items-center justify-center pt-4">
                        <button 
                          onClick={handleStartQuiz}
                          className="px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white rounded-xl transition-all font-semibold text-lg flex items-center gap-3 shadow-lg hover:shadow-xl hover:scale-105"
                        >
                          <i className="fas fa-play-circle"></i>
                          <span>Bắt đầu làm bài</span>
                        </button>
                      </div>
                    </div>

                    {/* Previous Attempts */}
                    <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                      <h5 className="text-white font-semibold mb-3 flex items-center gap-2">
                        <i className="fas fa-history text-blue-300"></i>
                        Lịch sử làm bài
                      </h5>
                      <div className="text-center py-6 text-white/50 text-sm">
                        <i className="fas fa-inbox text-3xl mb-2 opacity-50"></i>
                        <p>Bạn chưa làm bài kiểm tra này</p>
                      </div>
                    </div>
                  </>
                ) : isQuizSubmitted ? (
                  /* Quiz Results */
                  <div className="space-y-6">
                    <div className="text-center">
                      <div className="w-24 h-24 mx-auto mb-4 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center">
                        <i className="fas fa-check text-white text-4xl"></i>
                      </div>
                      <h3 className="text-2xl font-bold text-white mb-2">Hoàn thành bài kiểm tra!</h3>
                      <p className="text-white/60">Điểm của bạn</p>
                      <div className="text-5xl font-bold text-white my-4">{calculateScore()}%</div>
                      <div className={`inline-block px-4 py-2 rounded-full ${
                        calculateScore() >= 80 ? 'bg-green-500/20 text-green-300' : 
                        calculateScore() >= 60 ? 'bg-blue-500/20 text-blue-300' : 
                        'bg-orange-500/20 text-orange-300'
                      }`}>
                        {calculateScore() >= 80 ? '🎉 Xuất sắc!' : 
                         calculateScore() >= 60 ? '✅ Đạt yêu cầu - Có thể Complete!' : 
                         '📚 Cần đạt tối thiểu 60% để Complete'}
                      </div>
                    </div>

                    {/* Answer Review */}
                    <div className="space-y-3">
                      <h4 className="text-lg font-semibold text-white flex items-center gap-2">
                        <i className="fas fa-list-check text-purple-300"></i>
                        Xem lại đáp án
                      </h4>
                      {quizQuestions.map((q, idx) => {
                        const userAns = quizAnswers[q.id];
                        let isCorrect = false;
                        if (q.type === 'multiple-select') {
                          const correctAns = q.correctAnswer as string[];
                          const userAnsArr = userAns as string[];
                          isCorrect = userAnsArr && correctAns.length === userAnsArr.length && 
                                      correctAns.every(a => userAnsArr.includes(a));
                        } else {
                          isCorrect = userAns?.toString().toLowerCase().trim() === 
                                     q.correctAnswer.toString().toLowerCase().trim();
                        }

                        return (
                          <div key={q.id} className={`p-4 rounded-lg border ${isCorrect ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
                            <div className="flex items-start gap-3 mb-2">
                              <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${isCorrect ? 'bg-green-500' : 'bg-red-500'}`}>
                                <i className={`fas ${isCorrect ? 'fa-check' : 'fa-times'} text-white text-xs`}></i>
                              </div>
                              <div className="flex-1">
                                <p className="text-white font-medium mb-1">Câu {idx + 1}: {q.question}</p>
                                <p className="text-sm text-white/70">
                                  <span className="text-white/50">Câu trả lời của bạn: </span>
                                  {Array.isArray(userAns) ? userAns.join(', ') : userAns || 'Chưa trả lời'}
                                </p>
                                {!isCorrect && (
                                  <p className="text-sm text-green-300 mt-1">
                                    <span className="text-white/50">Đáp án đúng: </span>
                                    {Array.isArray(q.correctAnswer) ? q.correctAnswer.join(', ') : q.correctAnswer}
                                  </p>
                                )}
                                {q.explanation && (
                                  <p className="text-sm text-blue-300 mt-2 pl-3 border-l-2 border-blue-400/50">
                                    💡 {q.explanation}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={() => {
                          setIsQuizStarted(false);
                          setIsQuizSubmitted(false);
                          setQuizAnswers({});
                          setCurrentQuestionIndex(0);
                        }}
                        className="flex-1 px-6 py-3 bg-purple-500 hover:bg-purple-600 text-white rounded-xl transition-all font-semibold flex items-center justify-center gap-2"
                      >
                        <i className="fas fa-redo"></i>
                        Làm lại
                      </button>
                      {calculateScore() >= 60 ? (
                        <button
                          onClick={() => {
                            // Set flag to trigger animation
                            localStorage.setItem('triggerModuleUnlock', 'true');
                            // Call complete callback if provided
                            if (onCompleteModule) {
                              onCompleteModule();
                            }
                            // Close this panel to return to Learning Map
                            onClose();
                          }}
                          className="flex-1 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white rounded-xl transition-all font-semibold flex items-center justify-center gap-2 shadow-lg shadow-green-500/30 hover:shadow-xl hover:scale-105"
                        >
                          <i className="fas fa-check-circle"></i>
                          <span>Complete Module</span>
                        </button>
                      ) : (
                        <button
                          onClick={handleNextLesson}
                          disabled
                          className="flex-1 px-6 py-3 bg-gradient-to-r from-gray-400 to-gray-500 text-white rounded-xl transition-all font-semibold flex items-center justify-center gap-2 opacity-50 cursor-not-allowed"
                        >
                          <span>Cần đạt 60% để tiếp tục</span>
                          <i className="fas fa-lock"></i>
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  /* Quiz Questions */
                  <div className="space-y-6">
                    {/* Progress Bar */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <span className="text-white/60 text-sm">Câu hỏi {currentQuestionIndex + 1}/{quizQuestions.length}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-sm text-white/60">
                          {Object.keys(quizAnswers).length}/{quizQuestions.length} đã trả lời
                        </div>
                      </div>
                    </div>
                    <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300"
                        style={{ width: `${((currentQuestionIndex + 1) / quizQuestions.length) * 100}%` }}
                      ></div>
                    </div>

                    {/* Current Question */}
                    {(() => {
                      const currentQ = quizQuestions[currentQuestionIndex];
                      return (
                        <div className="space-y-4">
                          <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-lg p-5 border border-blue-400/30">
                            <div className="flex items-start gap-3 mb-4">
                              <div className="flex-shrink-0 w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                                <span className="text-blue-300 font-bold">{currentQuestionIndex + 1}</span>
                              </div>
                              <div className="flex-1">
                                <h4 className="text-lg font-bold text-white mb-2">{currentQ.question}</h4>
                                {currentQ.type === 'multiple-select' && (
                                  <p className="text-xs text-purple-300">Chọn nhiều đáp án</p>
                                )}
                              </div>
                            </div>

                            {/* Answer Options */}
                            <div className="space-y-3">
                              {currentQ.type === 'multiple-choice' || currentQ.type === 'true-false' ? (
                                currentQ.options?.map((option, idx) => (
                                  <button
                                    key={idx}
                                    onClick={() => handleQuizAnswer(currentQ.id, option)}
                                    className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                                      quizAnswers[currentQ.id] === option
                                        ? 'border-purple-500 bg-purple-500/20'
                                        : 'border-white/20 bg-white/5 hover:bg-white/10'
                                    }`}
                                  >
                                    <div className="flex items-center gap-3">
                                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                        quizAnswers[currentQ.id] === option
                                          ? 'border-purple-500 bg-purple-500'
                                          : 'border-white/40'
                                      }`}>
                                        {quizAnswers[currentQ.id] === option && (
                                          <i className="fas fa-check text-white text-xs"></i>
                                        )}
                                      </div>
                                      <span className="text-white">{option}</span>
                                    </div>
                                  </button>
                                ))
                              ) : currentQ.type === 'multiple-select' ? (
                                currentQ.options?.map((option, idx) => {
                                  const selected = (quizAnswers[currentQ.id] as string[] || []).includes(option);
                                  return (
                                    <button
                                      key={idx}
                                      onClick={() => {
                                        const currentAnswers = (quizAnswers[currentQ.id] as string[]) || [];
                                        const newAnswers = selected
                                          ? currentAnswers.filter(a => a !== option)
                                          : [...currentAnswers, option];
                                        handleQuizAnswer(currentQ.id, newAnswers);
                                      }}
                                      className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                                        selected
                                          ? 'border-purple-500 bg-purple-500/20'
                                          : 'border-white/20 bg-white/5 hover:bg-white/10'
                                      }`}
                                    >
                                      <div className="flex items-center gap-3">
                                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                                          selected
                                            ? 'border-purple-500 bg-purple-500'
                                            : 'border-white/40'
                                        }`}>
                                          {selected && (
                                            <i className="fas fa-check text-white text-xs"></i>
                                          )}
                                        </div>
                                        <span className="text-white">{option}</span>
                                      </div>
                                    </button>
                                  );
                                })
                              ) : (
                                /* Fill in the blank */
                                <input
                                  type="text"
                                  value={(quizAnswers[currentQ.id] as string) || ''}
                                  onChange={(e) => handleQuizAnswer(currentQ.id, e.target.value)}
                                  placeholder="Nhập câu trả lời của bạn..."
                                  className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 focus:border-purple-400 focus:ring-2 focus:ring-purple-300/50 outline-none text-white placeholder-white/50"
                                />
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })()}

                    {/* Navigation Buttons */}
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
                      
                      {currentQuestionIndex === quizQuestions.length - 1 ? (
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

                    {/* Question Navigator */}
                    <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                      <h5 className="text-white font-semibold mb-2 text-xs flex items-center gap-2">
                        <i className="fas fa-th text-purple-300"></i>
                        Danh sách câu hỏi
                      </h5>
                      <div className="flex gap-2 flex-wrap">
                        {quizQuestions.map((q, idx) => (
                          <button
                            key={q.id}
                            onClick={() => setCurrentQuestionIndex(idx)}
                            className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-semibold transition-all ${
                              idx === currentQuestionIndex
                                ? 'bg-purple-500 text-white ring-2 ring-purple-300 shadow-lg'
                                : quizAnswers[q.id]
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

            {/* Navigation Buttons */}
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
                <span>Previous Lesson</span>
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
                <span>{currentStep === totalSteps ? 'Completed' : 'Next Lesson'}</span>
                <i className={`fas ${currentStep === totalSteps ? 'fa-check' : 'fa-chevron-right'}`}></i>
              </button>
            </div>

            {/* Description Section - Only for Video */}
            {currentLessonType === 'video' && (
            <div className="bg-black/20 backdrop-blur-sm rounded-xl p-4 mb-4 border border-white/10">
              <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                <i className="fas fa-align-left"></i>
                Description
              </h3>
              <div className={`text-sm text-white/80 leading-relaxed ${!isDescriptionExpanded ? 'line-clamp-2' : ''}`}>
                <p>
                  Trong khóa học này, bạn sẽ được khám phá những kiến thức nền tảng về Trí tuệ nhân tạo (AI) và cách mà công nghệ này đang thay đổi thế giới xung quanh chúng ta. Chúng ta sẽ cùng tìm hiểu về các khái niệm cơ bản, ứng dụng thực tế trong cuộc sống hàng ngày và công việc, cũng như những kỹ năng cần thiết để có thể làm việc hiệu quả với các công cụ AI hiện đại. Khóa học được thiết kế phù hợp cho người mới bắt đầu, không yêu cầu kiến thức lập trình hay toán học nâng cao. Bạn sẽ được thực hành với các công cụ AI phổ biến và học cách áp dụng chúng vào công việc và cuộc sống của mình một cách hiệu quả nhất.
                </p>
              </div>
              <button
                onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                className="mt-2 text-sm text-purple-300 hover:text-purple-200 transition-colors flex items-center gap-1 font-medium"
              >
                {isDescriptionExpanded ? (
                  <>
                    <span>Ẩn bớt</span>
                    <i className="fas fa-chevron-up text-xs"></i>
                  </>
                ) : (
                  <>
                    <span>Xem thêm</span>
                    <i className="fas fa-chevron-down text-xs"></i>
                  </>
                )}
              </button>
            </div>
            )}

            {/* Comments Section - Only for Video */}
            {currentLessonType === 'video' && (
            <div className="min-h-[300px] bg-black/20 backdrop-blur-sm rounded-xl p-4 overflow-hidden flex flex-col border border-white/10">
              <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                <i className="fas fa-comments"></i>
                Comments
              </h3>
              
              {/* Comments List */}
              <div className="flex-1 overflow-y-auto space-y-3 mb-3 scrollbar-none">
                {comments.filter(c => !c.replyTo).map((comment) => {
                  const replies = comments.filter(r => r.replyTo === comment.id);
                  
                  return (
                    <div key={comment.id} className="space-y-3">
                      {/* Main Comment */}
                      <div className="flex items-start gap-3">
                        <div className={`w-10 h-10 ${comment.color} rounded-full flex items-center justify-center text-xl flex-shrink-0`}>
                          {comment.avatar}
                        </div>
                        <div className="flex-1">
                          <div className="bg-white/10 backdrop-blur-sm rounded-lg px-3 py-2 border border-white/20 group hover:bg-white/15 transition-all">
                            <div className="flex items-center justify-between">
                              <div className="font-semibold text-sm text-white">{comment.author}</div>
                              <button
                                onClick={() => handleReplyClick(comment.id, comment.author)}
                                className="opacity-0 group-hover:opacity-100 transition-opacity text-xs text-white/60 hover:text-white flex items-center gap-1"
                              >
                                <i className="fas fa-reply"></i>
                                Reply
                              </button>
                            </div>
                            <div className="text-sm text-white/80">{comment.text}</div>
                          </div>
                        </div>
                      </div>

                      {/* Replies */}
                      {replies.map((reply) => (
                        <div key={reply.id} className="flex items-start gap-3 ml-12">
                          <div className={`w-10 h-10 ${reply.color} rounded-full flex items-center justify-center text-xl flex-shrink-0`}>
                            {reply.avatar}
                          </div>
                          <div className="flex-1">
                            <div className="bg-white/10 backdrop-blur-sm rounded-lg px-3 py-2 border border-white/20 border-l-2 border-l-purple-400 group hover:bg-white/15 transition-all">
                              <div className="flex items-center justify-between">
                                <div className="font-semibold text-sm text-white">{reply.author}</div>
                                <button
                                  onClick={() => handleReplyClick(comment.id, comment.author)}
                                  className="opacity-0 group-hover:opacity-100 transition-opacity text-xs text-white/60 hover:text-white flex items-center gap-1"
                                >
                                  <i className="fas fa-reply"></i>
                                  Reply
                                </button>
                              </div>
                              <div className="mb-1">
                                <span className="text-xs text-purple-300">@{comment.author}</span>
                              </div>
                              <div className="text-sm text-white/80">{reply.text}</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>

              {/* Comment Input */}
              <div className="flex-shrink-0">
                {replyingTo && (
                  <div className="mb-2 flex items-center justify-between bg-purple-500/20 rounded-lg px-3 py-2 border border-purple-400/30">
                    <div className="flex items-center gap-2 text-sm text-white/80">
                      <i className="fas fa-reply text-purple-300"></i>
                      <span>Replying to <span className="font-semibold text-white">{comments.find(c => c.id === replyingTo)?.author}</span></span>
                    </div>
                    <button
                      onClick={handleCancelReply}
                      className="text-white/60 hover:text-white transition-colors"
                    >
                      <i className="fas fa-times"></i>
                    </button>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddComment()}
                    placeholder={replyingTo ? "Write your reply..." : "Say something..."}
                    className="flex-1 px-4 py-2 rounded-lg bg-white/10 border border-white/20 focus:border-purple-400 focus:ring-2 focus:ring-purple-300/50 outline-none text-sm text-white placeholder-white/50 backdrop-blur-sm"
                  />
                  <button
                    onClick={handleAddComment}
                    className="flex-shrink-0 px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors text-sm font-medium"
                  >
                    {replyingTo ? 'Reply' : 'Send'}
                  </button>
                </div>
              </div>
            </div>
            )}
            </div>
          </div>

          {/* Sidebar - Course Content */}
          <div className="w-96 bg-black/20 backdrop-blur-sm border-l border-white/20 flex flex-col">
            {/* Tabs */}
            <div className="flex border-b border-white/20 bg-black/10">
              <button
                onClick={() => setActiveTab('content')}
                className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
                  activeTab === 'content'
                    ? 'text-white border-b-2 border-purple-400'
                    : 'text-white/70 hover:text-white'
                }`}
              >
                Course content
              </button>
              <button
                onClick={() => setActiveTab('transcript')}
                className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
                  activeTab === 'transcript'
                    ? 'text-white border-b-2 border-purple-400'
                    : 'text-white/70 hover:text-white'
                }`}
              >
                Transcript
              </button>
              <button
                onClick={() => setActiveTab('notes')}
                className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
                  activeTab === 'notes'
                    ? 'text-white border-b-2 border-purple-400'
                    : 'text-white/70 hover:text-white'
                }`}
              >
                Notes
              </button>
            </div>

            {/* Lessons List */}
            <div className="flex-1 overflow-y-auto p-4 scrollbar-none">
              {activeTab === 'content' && (
                <div className="space-y-2">
                  {sections.map((section) => {
                    const isExpanded = expandedSections.includes(section.id);
                    
                    return (
                      <div key={section.id} className="border border-white/20 rounded-lg overflow-hidden bg-white/5">
                        {/* Section Header */}
                        <button
                          onClick={() => toggleSection(section.id)}
                          className="w-full px-3 py-3 flex items-center justify-between hover:bg-white/10 transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <i className={`fas fa-chevron-${isExpanded ? 'up' : 'down'} text-white/60 text-xs`}></i>
                            <span className="text-sm font-medium text-white/90">{section.title}</span>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-white/60">
                            <span>{section.lessonCount}bài</span>
                            <span>·</span>
                            <span>{section.duration}</span>
                          </div>
                        </button>

                        {/* Lessons List */}
                        {isExpanded && (
                          <div className="border-t border-white/10">
                            {section.lessons.map((lesson) => (
                              <div
                                key={lesson.id}
                                onClick={() => handleSelectLesson(lesson.id)}
                                className="flex items-center gap-3 px-3 py-2.5 hover:bg-white/10 transition-all cursor-pointer group border-b border-white/5 last:border-b-0"
                              >
                                {/* Status Icon */}
                                <div className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center ${
                                  lesson.isQuiz
                                    ? 'bg-blue-500/20 border border-blue-500/50'
                                    : lesson.completed
                                    ? 'bg-green-500/20 border border-green-500/50'
                                    : 'bg-white/10 border border-white/30'
                                }`}>
                                  {lesson.isQuiz ? (
                                    <i className="fas fa-clipboard-question text-blue-400 text-[10px]"></i>
                                  ) : lesson.completed ? (
                                    <i className="fas fa-check text-green-400 text-[10px]"></i>
                                  ) : (
                                    <div className="w-2 h-2 rounded-full bg-white/40"></div>
                                  )}
                                </div>

                                {/* Lesson Info */}
                                <div className="flex-1 min-w-0">
                                  <div className="text-sm text-white/90 group-hover:text-white transition-colors">
                                    {lesson.number}. {lesson.title}
                                  </div>
                                  <div className="text-xs text-white/50 mt-0.5">{lesson.duration}</div>
                                </div>

                                {/* Download Button */}
                                {lesson.isDownloadable && (
                                  <button 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDownloadDocument();
                                    }}
                                    className="flex-shrink-0 px-2 py-1 text-xs text-white/70 hover:text-white border border-white/30 rounded hover:bg-white/10 transition-all flex items-center gap-1"
                                  >
                                    <span>tải tài liệu</span>
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
              )}
              {activeTab === 'transcript' && (
                <div className="text-sm text-white/70">
                  <p>Transcript content will appear here...</p>
                </div>
              )}
              {activeTab === 'notes' && (
                <div className="flex flex-col h-full">
                  {/* Add Note Form */}
                  <div className="mb-4 bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/20">
                    <div className="flex items-center gap-2 mb-2 text-xs text-white/60">
                      <i className="fas fa-clock"></i>
                      <span>Current time: 11:41</span>
                    </div>
                    <textarea
                      value={noteText}
                      onChange={(e) => setNoteText(e.target.value)}
                      placeholder="Write your note at this timestamp..."
                      className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 focus:border-purple-400 focus:ring-2 focus:ring-purple-300/50 outline-none text-sm text-white placeholder-white/50 backdrop-blur-sm resize-none"
                      rows={3}
                    />
                    <button
                      onClick={handleAddNote}
                      className="mt-2 w-full px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors text-sm font-medium flex items-center justify-center gap-2"
                    >
                      <i className="fas fa-plus"></i>
                      Add Note
                    </button>
                  </div>

                  {/* Notes List */}
                  <div className="flex-1 space-y-3">
                    <h4 className="text-sm font-semibold text-white/80 mb-2 flex items-center gap-2">
                      <i className="fas fa-sticky-note"></i>
                      My Notes ({notes.length})
                    </h4>
                    {notes.length === 0 ? (
                      <div className="text-center py-8 text-white/50 text-sm">
                        <i className="fas fa-pencil-alt text-2xl mb-2 opacity-50"></i>
                        <p>No notes yet. Start taking notes!</p>
                      </div>
                    ) : (
                      notes.map((note) => (
                        <div
                          key={note.id}
                          className="bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/20 hover:bg-white/15 transition-all group"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <button className="flex items-center gap-2 text-purple-300 hover:text-purple-200 transition-colors">
                              <i className="fas fa-play-circle text-xs"></i>
                              <span className="text-xs font-mono font-semibold">{note.time}</span>
                            </button>
                            <button
                              onClick={() => handleDeleteNote(note.id)}
                              className="opacity-0 group-hover:opacity-100 transition-opacity text-red-400 hover:text-red-300"
                            >
                              <i className="fas fa-trash text-xs"></i>
                            </button>
                          </div>
                          <p className="text-sm text-white/80 leading-relaxed">{note.content}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

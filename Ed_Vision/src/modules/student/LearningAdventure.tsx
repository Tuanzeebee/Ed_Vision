import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import imgLogoPredica2 from "@/assets/student/Logo_Predica.png";
import imgVector from "@/assets/student/IconCheck_LearningPath.svg";
import imgSvg from "@/assets/student/LineLearingPath.svg";

type Props = {
  // Props can be added here if needed
};

export default function LearningAdventure({}: Props) {
  const [isPanelHidden, setIsPanelHidden] = useState(false);
  const [tooltipVisible, setTooltipVisible] = useState(false);

  // Keyboard shortcut for panel toggle (ESC key)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsPanelHidden(prev => !prev);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const toggleStatsPanel = () => {
    setIsPanelHidden(prev => !prev);
  };

  const handleNodeClick = (isLocked: boolean, lessonName: string) => {
    if (isLocked) {
      alert('This lesson is locked. Complete previous lessons to unlock.');
    } else {
      alert(`${lessonName} clicked! Continue your learning journey.`);
    }
  };

  return (
    <div className="flex flex-col gap-6 items-center w-full min-h-screen bg-gray-50">
      {/* Header */}
      <header className="w-full bg-white shadow-sm">
        <div className="max-w-[1440px] mx-auto h-20 flex items-center justify-between px-6">
          {/* Logo */}
          <div className="w-[212px] h-[76px]">
            <img src={imgLogoPredica2} alt="Predica Logo" className="w-full h-full object-contain" />
          </div>

          {/* Navigation */}
          <div className="flex items-center gap-4">
            <button className="flex items-center gap-2 text-purple-700 text-xl font-medium">
              Our Features
              <img src={imgVector} alt="" className="w-3 h-2" />
            </button>
          </div>

          {/* Auth Buttons */}
          <div className="flex gap-3">
            <button className="px-10 py-2 bg-white border border-black rounded-full text-xl font-medium hover:bg-gray-50 transition-colors">
              Login
            </button>
            <button className="px-8 py-2 bg-purple-400 rounded-full text-xl font-medium text-white hover:bg-purple-500 transition-colors">
              Sign Up
            </button>
          </div>
        </div>
      </header>

      {/* Progress Card */}
      <Card className="w-full max-w-[1392px] mx-6 rounded-3xl shadow-lg">
        <CardContent className="p-6">
          {/* Course Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white text-xl">
                🎓
              </div>
              <div>
                <h1 className="text-2xl font-semibold text-gray-800">Learning Adventure</h1>
                <p className="text-sm text-gray-600">Level 3: Data Science Basics</p>
              </div>
            </div>
            
            <div className="flex gap-4">
              <div className="flex items-center gap-2 px-3 py-1 bg-yellow-100 rounded-full">
                <span className="text-yellow-500">⭐</span>
                <span className="text-sm font-semibold text-yellow-700">1,250 XP</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1 bg-orange-100 rounded-full">
                <span className="text-orange-500">🔥</span>
                <span className="text-sm font-semibold text-orange-700">7 days</span>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700">Course Progress</span>
              <span className="text-sm font-semibold text-purple-600">65%</span>
            </div>
            <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full w-[65%] bg-gradient-to-r from-purple-500 to-pink-500 rounded-full" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Learning Path */}
      <div className="relative w-[848px] h-[2000px] my-8">
        {/* SVG Path Background */}
        <div className="absolute inset-0">
          <img src={imgSvg} alt="" className="w-full h-full" />
        </div>

        {/* Start Node */}
        <div className="absolute top-[30px] right-[50px] flex flex-col items-center gap-2">
          <div className="relative">
            <div 
              className="w-20 h-20 rounded-full bg-gradient-to-r from-green-400 to-green-500 shadow-lg flex items-center justify-center text-white text-2xl cursor-pointer transition-transform hover:-translate-y-0.5"
              onClick={() => handleNodeClick(false, 'Course Welcome')}
            >
              ✓
            </div>
            <div className="absolute -top-7 left-1/2 -translate-x-1/2 px-2 py-1 bg-white/95 backdrop-blur-sm border border-gray-200 rounded-lg whitespace-nowrap">
              <p className="text-xs text-gray-700">Course Welcome</p>
            </div>
          </div>
          <span className="text-sm font-semibold text-gray-800">Start</span>
        </div>

        {/* Video Lesson 1 */}
        <div className="absolute top-[120px] left-[160px] flex flex-col items-center gap-2">
          <div className="relative">
            <div 
              className="w-16 h-16 rounded-full bg-gradient-to-r from-red-400 to-red-500 shadow-lg flex items-center justify-center text-white text-xl cursor-pointer transition-transform hover:-translate-y-0.5"
              onClick={() => handleNodeClick(false, 'Python Fundamentals')}
            >
              ▶
            </div>
            <div className="absolute -top-7 left-1/2 -translate-x-1/2 px-2 py-1 bg-white/95 backdrop-blur-sm border border-gray-200 rounded-lg whitespace-nowrap">
              <p className="text-xs text-gray-700">Python Fundamentals</p>
            </div>
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-gray-800">Video Lesson</p>
            <p className="text-xs text-green-600">+50 XP</p>
          </div>
        </div>

        {/* Reading */}
        <div className="absolute top-[200px] left-[30px] flex flex-col items-center gap-2">
          <div className="relative">
            <div 
              className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-400 to-blue-500 shadow-lg flex items-center justify-center text-white text-xl cursor-pointer transition-transform hover:-translate-y-0.5"
              onClick={() => handleNodeClick(false, 'Industry Overview')}
            >
              📖
            </div>
            <div className="absolute -top-7 left-1/2 -translate-x-1/2 px-2 py-1 bg-white/95 backdrop-blur-sm border border-gray-200 rounded-lg whitespace-nowrap">
              <p className="text-xs text-gray-700">Industry Overview</p>
            </div>
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-gray-800">Reading</p>
            <p className="text-xs text-green-600">+30 XP</p>
          </div>
        </div>

        {/* Bonus */}
        <div className="absolute top-[300px] left-[176px] flex flex-col items-center gap-2">
          <div className="relative">
            <div 
              className="w-14 h-14 rounded-full bg-gradient-to-r from-yellow-400 to-yellow-500 shadow-lg flex items-center justify-center text-white text-lg cursor-pointer transition-transform hover:-translate-y-0.5"
              onClick={() => handleNodeClick(false, 'Early Bird Reward')}
            >
              🎁
            </div>
            <div className="absolute -top-7 left-1/2 -translate-x-1/2 px-2 py-1 bg-white/95 backdrop-blur-sm border border-gray-200 rounded-lg whitespace-nowrap">
              <p className="text-xs text-gray-700">Early Bird Reward</p>
            </div>
          </div>
          <span className="text-xs font-semibold text-yellow-600">Bonus!</span>
        </div>

        {/* Quick Quiz */}
        <div className="absolute top-[375px] left-[424px] flex flex-col items-center gap-2">
          <div className="relative">
            <div 
              className="w-16 h-16 rounded-full bg-gradient-to-r from-purple-400 to-purple-500 shadow-lg flex items-center justify-center text-white text-xl cursor-pointer transition-transform hover:-translate-y-0.5"
              onClick={() => handleNodeClick(false, 'Knowledge Check')}
            >
              ?
            </div>
            <div className="absolute -top-7 left-1/2 -translate-x-1/2 px-2 py-1 bg-white/95 backdrop-blur-sm border border-gray-200 rounded-lg whitespace-nowrap">
              <p className="text-xs text-gray-700">Knowledge Check</p>
            </div>
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-gray-800">Quick Quiz</p>
            <p className="text-xs text-green-600">+75 XP</p>
          </div>
        </div>

        {/* Case Study */}
        <div className="absolute top-[420px] right-[50px] flex flex-col items-center gap-2">
          <div className="relative">
            <div 
              className="w-16 h-16 rounded-full bg-gradient-to-r from-indigo-400 to-indigo-500 shadow-lg flex items-center justify-center text-white text-xl cursor-pointer transition-transform hover:-translate-y-0.5"
              onClick={() => handleNodeClick(false, 'Real-World Application')}
              onMouseEnter={() => setTooltipVisible(true)}
              onMouseLeave={() => setTooltipVisible(false)}
            >
              📊
            </div>
            <div className="absolute -top-7 left-1/2 -translate-x-1/2 px-2 py-1 bg-white/95 backdrop-blur-sm border border-gray-200 rounded-lg whitespace-nowrap">
              <p className="text-xs text-gray-700">Real-World Application</p>
            </div>
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-gray-800">Case Study</p>
            <p className="text-xs text-green-600">+100 XP</p>
          </div>
        </div>

        {/* Video Lesson 2 */}
        <div className="absolute top-[520px] left-[160px] flex flex-col items-center gap-2">
          <div className="relative">
            <div 
              className="w-16 h-16 rounded-full bg-gradient-to-r from-red-400 to-red-500 shadow-lg flex items-center justify-center text-white text-xl cursor-pointer transition-transform hover:-translate-y-0.5"
              onClick={() => handleNodeClick(false, 'Data Visualization')}
            >
              ▶
            </div>
            <div className="absolute -top-7 left-1/2 -translate-x-1/2 px-2 py-1 bg-white/95 backdrop-blur-sm border border-gray-200 rounded-lg whitespace-nowrap">
              <p className="text-xs text-gray-700">Data Visualization</p>
            </div>
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-gray-800">Video Lesson</p>
            <p className="text-xs text-green-600">+50 XP</p>
          </div>
        </div>

        {/* Assignment */}
        <div className="absolute top-[620px] left-[30px] flex flex-col items-center gap-2">
          <div className="relative">
            <div 
              className="w-16 h-16 rounded-full bg-gradient-to-r from-green-400 to-green-500 shadow-lg flex items-center justify-center text-white text-xl cursor-pointer transition-transform hover:-translate-y-0.5"
              onClick={() => handleNodeClick(false, 'Hands-On Project')}
            >
              ✏️
            </div>
            <div className="absolute -top-7 left-1/2 -translate-x-1/2 px-2 py-1 bg-white/95 backdrop-blur-sm border border-gray-200 rounded-lg whitespace-nowrap">
              <p className="text-xs text-gray-700">Hands-On Project</p>
            </div>
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-gray-800">Assignment</p>
            <p className="text-xs text-green-600">+150 XP</p>
          </div>
        </div>

        {/* Video Lesson 3 */}
        <div className="absolute top-[687px] left-[435px] flex flex-col items-center gap-2">
          <div className="relative">
            <div 
              className="w-16 h-16 rounded-full bg-gradient-to-r from-red-400 to-red-500 shadow-lg flex items-center justify-center text-white text-xl cursor-pointer transition-transform hover:-translate-y-0.5"
              onClick={() => handleNodeClick(false, 'Data Visualization')}
            >
              ▶
            </div>
            <div className="absolute -top-7 left-1/2 -translate-x-1/2 px-2 py-1 bg-white/95 backdrop-blur-sm border border-gray-200 rounded-lg whitespace-nowrap">
              <p className="text-xs text-gray-700">Data Visualization</p>
            </div>
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-gray-800">Video Lesson</p>
            <p className="text-xs text-green-600">+50 XP</p>
          </div>
        </div>

        {/* Review */}
        <div className="absolute top-[720px] left-[160px] flex flex-col items-center gap-2">
          <div className="relative">
            <div 
              className="w-16 h-16 rounded-full bg-gradient-to-r from-teal-400 to-teal-500 shadow-lg flex items-center justify-center text-white text-xl cursor-pointer transition-transform hover:-translate-y-0.5"
              onClick={() => handleNodeClick(false, 'Progress Analysis')}
            >
              🔄
            </div>
            <div className="absolute -top-7 left-1/2 -translate-x-1/2 px-2 py-1 bg-white/95 backdrop-blur-sm border border-gray-200 rounded-lg whitespace-nowrap">
              <p className="text-xs text-gray-700">Progress Analysis</p>
            </div>
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-gray-800">Review</p>
            <p className="text-xs text-green-600">+80 XP</p>
          </div>
        </div>

        {/* Achievement */}
        <div className="absolute top-[800px] right-[80px] flex flex-col items-center gap-2">
          <div className="relative">
            <div 
              className="w-14 h-14 rounded-full bg-gradient-to-r from-pink-400 to-pink-500 shadow-lg flex items-center justify-center text-white text-lg cursor-pointer transition-transform hover:-translate-y-0.5"
              onClick={() => handleNodeClick(false, 'Milestone Achievement')}
            >
              🏆
            </div>
            <div className="absolute -top-7 left-1/2 -translate-x-1/2 px-2 py-1 bg-white/95 backdrop-blur-sm border border-gray-200 rounded-lg whitespace-nowrap">
              <p className="text-xs text-gray-700">Milestone Achievement</p>
            </div>
          </div>
          <span className="text-xs font-semibold text-pink-600">Achievement!</span>
        </div>

        {/* Current Position (You are here!) */}
        <div className="absolute top-[820px] right-[50px] flex flex-col items-center gap-2">
          <div className="relative">
            <div 
              className="w-20 h-20 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 border-4 border-white shadow-xl flex items-center justify-center text-white text-2xl cursor-pointer transition-transform hover:-translate-y-0.5"
              onClick={() => handleNodeClick(false, 'Current Position')}
            >
              📍
            </div>
            <div className="absolute -top-7 left-1/2 -translate-x-1/2 px-2 py-1 bg-white/95 backdrop-blur-sm border border-gray-200 rounded-lg whitespace-nowrap">
              <p className="text-xs text-gray-700">Current Position</p>
            </div>
          </div>
          <span className="text-sm font-semibold text-purple-600">You are here!</span>
        </div>

        {/* Bonus 2 */}
        <div className="absolute top-[869px] left-[424px] flex flex-col items-center gap-2">
          <div className="relative">
            <div 
              className="w-14 h-14 rounded-full bg-gradient-to-r from-yellow-400 to-yellow-500 shadow-lg flex items-center justify-center text-white text-lg cursor-pointer transition-transform hover:-translate-y-0.5"
              onClick={() => handleNodeClick(false, 'Early Bird Reward')}
            >
              🎁
            </div>
            <div className="absolute -top-7 left-1/2 -translate-x-1/2 px-2 py-1 bg-white/95 backdrop-blur-sm border border-gray-200 rounded-lg whitespace-nowrap">
              <p className="text-xs text-gray-700">Early Bird Reward</p>
            </div>
          </div>
          <span className="text-xs font-semibold text-yellow-600">Bonus!</span>
        </div>

        {/* Locked nodes */}
        <div className="absolute top-[920px] left-[160px] flex flex-col items-center gap-2 opacity-60">
          <div className="relative">
            <div 
              className="w-16 h-16 rounded-full bg-gray-300 shadow-lg flex items-center justify-center text-gray-500 text-xl cursor-not-allowed"
              onClick={() => handleNodeClick(true, 'Advanced Concepts')}
            >
              📖
            </div>
            <div className="absolute -top-7 left-1/2 -translate-x-1/2 px-2 py-1 bg-white/95 backdrop-blur-sm border border-gray-200 rounded-lg whitespace-nowrap">
              <p className="text-xs text-gray-700">Advanced Concepts</p>
            </div>
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-gray-500">Reading</p>
            <p className="text-xs text-gray-400">Locked</p>
          </div>
        </div>

        <div className="absolute top-[1020px] left-[30px] flex flex-col items-center gap-2 opacity-60">
          <div className="relative">
            <div 
              className="w-16 h-16 rounded-full bg-gray-300 shadow-lg flex items-center justify-center text-gray-500 text-xl cursor-not-allowed"
              onClick={() => handleNodeClick(true, 'Statistics Assessment')}
            >
              ?
            </div>
            <div className="absolute -top-7 left-1/2 -translate-x-1/2 px-2 py-1 bg-white/95 backdrop-blur-sm border border-gray-200 rounded-lg whitespace-nowrap">
              <p className="text-xs text-gray-700">Statistics Assessment</p>
            </div>
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-gray-500">Quiz</p>
            <p className="text-xs text-gray-400">Locked</p>
          </div>
        </div>

        <div className="absolute top-[1120px] left-[160px] flex flex-col items-center gap-2 opacity-60">
          <div className="relative">
            <div 
              className="w-16 h-16 rounded-full bg-gray-300 shadow-lg flex items-center justify-center text-gray-500 text-xl cursor-not-allowed"
              onClick={() => handleNodeClick(true, 'ML Introduction')}
            >
              ▶
            </div>
            <div className="absolute -top-7 left-1/2 -translate-x-1/2 px-2 py-1 bg-white/95 backdrop-blur-sm border border-gray-200 rounded-lg whitespace-nowrap">
              <p className="text-xs text-gray-700">ML Introduction</p>
            </div>
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-gray-500">Video</p>
            <p className="text-xs text-gray-400">Locked</p>
          </div>
        </div>

        <div className="absolute top-[1220px] right-[50px] flex flex-col items-center gap-2 opacity-60">
          <div className="relative">
            <div 
              className="w-16 h-16 rounded-full bg-gray-300 shadow-lg flex items-center justify-center text-gray-500 text-xl cursor-not-allowed"
              onClick={() => handleNodeClick(true, 'Healthcare Analytics')}
            >
              📊
            </div>
            <div className="absolute -top-7 left-1/2 -translate-x-1/2 px-2 py-1 bg-white/95 backdrop-blur-sm border border-gray-200 rounded-lg whitespace-nowrap">
              <p className="text-xs text-gray-700">Healthcare Analytics</p>
            </div>
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-gray-500">Case Study</p>
            <p className="text-xs text-gray-400">Locked</p>
          </div>
        </div>

        <div className="absolute top-[1320px] left-[160px] flex flex-col items-center gap-2 opacity-60">
          <div className="relative">
            <div 
              className="w-16 h-16 rounded-full bg-gray-300 shadow-lg flex items-center justify-center text-gray-500 text-xl cursor-not-allowed"
              onClick={() => handleNodeClick(true, 'Capstone Project')}
            >
              ✏️
            </div>
            <div className="absolute -top-7 left-1/2 -translate-x-1/2 px-2 py-1 bg-white/95 backdrop-blur-sm border border-gray-200 rounded-lg whitespace-nowrap">
              <p className="text-xs text-gray-700">Capstone Project</p>
            </div>
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-gray-500">Assignment</p>
            <p className="text-xs text-gray-400">Locked</p>
          </div>
        </div>

        <div className="absolute top-[1420px] left-[30px] flex flex-col items-center gap-2 opacity-60">
          <div className="relative">
            <div 
              className="w-16 h-16 rounded-full bg-gray-300 shadow-lg flex items-center justify-center text-gray-500 text-xl cursor-not-allowed"
              onClick={() => handleNodeClick(true, 'Course Summary')}
            >
              🔄
            </div>
            <div className="absolute -top-7 left-1/2 -translate-x-1/2 px-2 py-1 bg-white/95 backdrop-blur-sm border border-gray-200 rounded-lg whitespace-nowrap">
              <p className="text-xs text-gray-700">Course Summary</p>
            </div>
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-gray-500">Final Review</p>
            <p className="text-xs text-gray-400">Locked</p>
          </div>
        </div>

        <div className="absolute top-[1520px] left-[160px] flex flex-col items-center gap-2 opacity-60">
          <div className="relative">
            <div 
              className="w-20 h-20 rounded-full bg-gray-300 shadow-lg flex items-center justify-center text-gray-500 text-2xl cursor-not-allowed"
              onClick={() => handleNodeClick(true, 'Graduation Day')}
            >
              🎓
            </div>
            <div className="absolute -top-7 left-1/2 -translate-x-1/2 px-2 py-1 bg-white/95 backdrop-blur-sm border border-gray-200 rounded-lg whitespace-nowrap">
              <p className="text-xs text-gray-700">Graduation Day</p>
            </div>
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-gray-500">Finish</p>
            <p className="text-xs text-gray-400">Locked</p>
          </div>
        </div>
      </div>

      {/* Floating Action Buttons */}
      <div className="fixed right-8 bottom-1/3 flex flex-col gap-3">
        <button className="w-14 h-14 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 shadow-lg flex items-center justify-center text-white text-xl hover:scale-110 transition-transform">
          💬
        </button>
        <button className="w-14 h-14 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 shadow-lg flex items-center justify-center text-white text-xl hover:scale-110 transition-transform">
          🎯
        </button>
      </div>

      {/* Bottom Stats Panel */}
      <div 
        className={`fixed bottom-0 left-0 right-0 bg-white shadow-2xl rounded-t-3xl max-w-[1440px] mx-auto transition-transform duration-400 ${
          isPanelHidden ? 'translate-y-[calc(100%-60px)]' : 'translate-y-0'
        }`}
      >
        {/* Toggle Button */}
        <div className="flex justify-center pt-3 pb-1">
          <button 
            onClick={toggleStatsPanel}
            className={`w-12 h-6 bg-gray-200 rounded-full flex items-center justify-center hover:bg-gray-300 transition-all ${
              isPanelHidden ? 'rotate-180' : ''
            }`}
          >
            <svg className="w-4 h-4 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd"></path>
            </svg>
          </button>
        </div>

        {/* Panel Content */}
        <div className="p-6 pt-2">
          <div className="space-y-4">
          {/* Predicted Score */}
          <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-none">
            <CardContent className="p-4">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-lg font-semibold text-gray-800">Predicted Score</h3>
                <button className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full text-sm font-medium hover:opacity-90 transition-opacity">
                  View Report
                </button>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="flex justify-between text-sm text-gray-600 mb-1">
                    <span>Current: 78%</span>
                    <span>Target: 85%</span>
                  </div>
                  <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-full w-[78%] bg-gradient-to-r from-blue-400 to-purple-500 rounded-full" />
                  </div>
                </div>
                
                <div className="text-center">
                  <p className="text-2xl font-semibold text-purple-600">78%</p>
                  <p className="text-xs text-gray-500">Current</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stats Grid */}
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-green-50 p-3 rounded-xl text-center">
              <p className="text-2xl font-semibold text-green-600">2/7</p>
              <p className="text-xs text-green-700">Modules</p>
            </div>
            <div className="bg-yellow-50 p-3 rounded-xl text-center">
              <p className="text-2xl font-semibold text-yellow-600">1,250</p>
              <p className="text-xs text-yellow-700">XP Points</p>
            </div>
            <div className="bg-orange-50 p-3 rounded-xl text-center">
              <p className="text-2xl font-semibold text-orange-600">7</p>
              <p className="text-xs text-orange-700">Day Streak</p>
            </div>
            <div className="bg-purple-50 p-3 rounded-xl text-center">
              <p className="text-2xl font-semibold text-purple-600">#12</p>
              <p className="text-xs text-purple-700">Leaderboard</p>
            </div>
          </div>

          {/* Recent Badges */}
          <div className="flex justify-between items-center">
            <h4 className="text-sm font-semibold text-gray-700">Recent Badges</h4>
            <div className="flex gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-yellow-400 to-yellow-600 flex items-center justify-center text-white text-xs">
                🌟
              </div>
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-400 to-blue-600 flex items-center justify-center text-white text-xs">
                📚
              </div>
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-green-400 to-green-600 flex items-center justify-center text-white text-xs">
                ✓
              </div>
            </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tooltip Card (shown on hover/click) */}
      {tooltipVisible && (
        <div className="absolute top-[431px] left-[914px] max-w-xs bg-white border-2 border-gray-200 rounded-xl p-5 shadow-lg z-50 animate-in fade-in slide-in-from-bottom-2">
          <div className="flex gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-green-400 to-green-500 flex items-center justify-center text-white text-2xl flex-shrink-0">
              ✓
            </div>
            <div>
              <h3 className="text-base font-semibold text-gray-800">Introduction to Python</h3>
              <p className="text-sm text-green-600">Completed • +50 XP</p>
            </div>
          </div>
          <p className="text-sm text-gray-600 leading-5 mb-3">
            Learn Python basics including variables, data types, and basic operations essential for data science.
          </p>
          <div className="flex gap-4 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <span>⏱</span>
              25 min
            </span>
            <span className="flex items-center gap-1">
              <span>📊</span>
              Beginner
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

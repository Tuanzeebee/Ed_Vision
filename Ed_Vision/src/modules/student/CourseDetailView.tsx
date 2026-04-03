import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  CheckCircle2, 
  ArrowRight, 
  PlayCircle, 
  Lock, 
  Gamepad2, 
  LayoutGrid, 
  Users, 
  HelpCircle, 
  BookOpen, 
  Video, 
  Code, 
  MessageCircle 
} from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

type Props = {
  // props can be added here if needed in the future
};

export default function CourseDetailView({}: Props) {
  const navigate = useNavigate();

  React.useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
      <Header />
      <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <button 
              onClick={() =>navigate('/student/course-overview')}
              className="text-gray-500 hover:text-gray-900 transition-colors p-1 rounded-full hover:bg-gray-100 cursor-pointer">
              <ArrowLeft className="w-6 h-6"/>
            </button>
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-gray-900">CS 301 - Data Structures</h1>
              <p className="text-sm text-gray-600 mt-1">Fall 2024 • 3 Credits</p>
            </div>
          </div>
        </div>
      </header>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          <main className="flex-1 space-y-8">
            {/* Course Overview */}
            <Card className="overflow-hidden rounded-xl">
              <CardContent className="p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6">Course Overview</h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                  <div className="bg-blue-50 p-4 rounded-xl text-center border border-blue-100">
                    <div className="text-3xl font-bold text-blue-600">95%</div>
                    <div className="text-sm font-medium text-gray-600 mt-1">Success Prediction</div>
                  </div>
                  <div className="bg-green-50 p-4 rounded-xl text-center border border-green-100">
                    <div className="text-3xl font-bold text-green-600">12/16</div>
                    <div className="text-sm font-medium text-gray-600 mt-1">Modules Complete</div>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-xl text-center border border-purple-100">
                    <div className="text-3xl font-bold text-purple-600">92</div>
                    <div className="text-sm font-medium text-gray-600 mt-1">Prediction Score</div>
                  </div>
                </div>
                <p className="text-gray-700 leading-relaxed text-base">This course covers fundamental data structures including arrays, linked lists, stacks, queues, trees, and graphs. Students will learn to analyze algorithmic complexity and implement efficient data structures in various programming languages.
                </p>
              </CardContent>
            </Card>

            {/* Learning Modules */}
            <Card className="overflow-hidden rounded-xl">
              <CardContent className="p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6">Learning Modules</h2>
                <div className="space-y-4">
                  
                  {/* Module 1 */}
                  <div className="bg-green-50 border border-green-200 rounded-xl p-5 transition-all hover:shadow-md">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-4">
                      <div className="flex items-start gap-4">
                        <div className="p-2 rounded-lg bg-green-100 text-green-700 shrink-0">
                          <CheckCircle2 className="w-6 h-6"/>
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900 text-lg">Module 1: Arrays & Dynamic Arrays</h3>
                          <p className="text-sm text-gray-600 mt-1">Completed • 2 hours</p>
                        </div>
                      </div>
                      <div className="px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 self-start sm:self-center">100%</div>
                    </div>
                    <div className="flex flex-wrap gap-2 mb-4">
                      <span className="px-2.5 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200">Video Lecture</span>
                      <span className="px-2.5 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200">Practice Problems</span>
                      <span className="px-2.5 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200">Quiz</span>
                    </div>
                    <button className="text-blue-600 text-sm font-medium hover:text-blue-800 flex items-center gap-1 transition-colors cursor-pointer">Review Module <ArrowRight className="w-4 h-4"/>
                    </button>
                  </div>

                  {/* Module 2 */}
                  <div className="bg-green-50 border border-green-200 rounded-xl p-5 transition-all hover:shadow-md">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-4">
                      <div className="flex items-start gap-4">
                        <div className="p-2 rounded-lg bg-green-100 text-green-700 shrink-0">
                          <CheckCircle2 className="w-6 h-6"/>
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900 text-lg">Module 2: Linked Lists</h3>
                          <p className="text-sm text-gray-600 mt-1">Completed • 3 hours</p>
                        </div>
                      </div>
                      <div className="px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 self-start sm:self-center">95%</div>
                    </div>
                    <div className="flex flex-wrap gap-2 mb-4">
                      <span className="px-2.5 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200">Video Lecture</span>
                      <span className="px-2.5 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200">Coding Exercise</span>
                      <span className="px-2.5 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200">Assignment</span>
                    </div>
                    <button className="text-blue-600 text-sm font-medium hover:text-blue-800 flex items-center gap-1 transition-colors cursor-pointer">Review Module <ArrowRight className="w-4 h-4"/>
                    </button>
                  </div>

                  {/* Module 3 */}
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 shadow-sm ring-1 ring-blue-100">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-4">
                      <div className="flex items-start gap-4">
                        <div className="p-2 rounded-lg bg-blue-100 text-blue-700 shrink-0">
                          <PlayCircle className="w-6 h-6"/>
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900 text-lg">Module 3: Stacks & Queues</h3>
                          <p className="text-sm text-gray-600 mt-1">In Progress • 2.5 hours</p>
                        </div>
                      </div>
                      <div className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 self-start sm:self-center">60%</div>
                    </div>
                    <div className="flex flex-wrap gap-2 mb-4">
                      <span className="px-2.5 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-700 border border-blue-200">Video Lecture</span>
                      <span className="px-2.5 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200">Interactive Demo</span>
                      <span className="px-2.5 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200">Lab Exercise</span>
                    </div>
                    <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors shadow-sm cursor-pointer">Continue Learning <ArrowRight className="w-4 h-4"/>
                    </button>
                  </div>

                  {/* Module 4 */}
                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 opacity-75">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-4">
                      <div className="flex items-start gap-4">
                        <div className="p-2 rounded-lg bg-gray-200 text-gray-500 shrink-0">
                          <Lock className="w-6 h-6"/>
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900 text-lg">Module 4: Trees & Binary Search Trees</h3>
                          <p className="text-sm text-gray-500 mt-1">Locked • Unlocks Nov 15</p>
                        </div>
                      </div>
                      <div className="px-3 py-1 rounded-full text-sm font-medium bg-gray-200 text-gray-600 self-start sm:self-center">0%</div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <span className="px-2.5 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-500 border border-gray-200">Video Lecture</span>
                      <span className="px-2.5 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-500 border border-gray-200">Visualization Tool</span>
                      <span className="px-2.5 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-500 border border-gray-200">Project</span>
                    </div>
                  </div>

                </div>
              </CardContent>
            </Card>
          </main>

          <aside className="w-full lg:w-96 space-y-6">
            {/* Quick Actions */}
            <Card className="overflow-hidden">
              <CardContent className="p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h3>
                <div className="space-y-3">
                  <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5 cursor-pointer">
                    <Gamepad2 className="w-5 h-5"/>
                    <span className="font-medium">Gamified Learning Path</span>
                  </button>
                  <button
                    onClick={() =>navigate('/student/learning-space')}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200 transition-colors cursor-pointer">
                    <LayoutGrid className="w-5 h-5 text-gray-500"/>
                    <span className="font-medium">Learning Space</span>
                  </button>
                  <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200 transition-colors cursor-pointer">
                    <Users className="w-5 h-5 text-gray-500"/>
                    <span className="font-medium">Study Group</span>
                  </button>
                  <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200 transition-colors cursor-pointer">
                    <HelpCircle className="w-5 h-5 text-gray-500"/>
                    <span className="font-medium">Get Help</span>
                  </button>
                </div>
              </CardContent>
            </Card>

            {/* Study Resources */}
            <Card className="overflow-hidden rounded-xl">
              <CardContent className="p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Study Resources</h3>
                <div className="space-y-3">
                  <a href="#"className="block bg-gray-50 p-3 rounded-lg hover:bg-gray-100 transition-colors border border-transparent hover:border-gray-200">
                    <div className="flex items-center gap-3">
                      <div className="text-blue-600 bg-blue-50 p-2 rounded-md">
                        <BookOpen className="w-5 h-5"/>
                      </div>
                      <div>
                        <div className="font-medium text-gray-900 text-sm">Textbook: Chapter 3</div>
                        <div className="text-xs text-gray-500">Stacks and Queues</div>
                      </div>
                    </div>
                  </a>
                  <a href="#"className="block bg-gray-50 p-3 rounded-lg hover:bg-gray-100 transition-colors border border-transparent hover:border-gray-200">
                    <div className="flex items-center gap-3">
                      <div className="text-purple-600 bg-purple-50 p-2 rounded-md">
                        <Video className="w-5 h-5"/>
                      </div>
                      <div>
                        <div className="font-medium text-gray-900 text-sm">Video Tutorial</div>
                        <div className="text-xs text-gray-500">Stack Implementation</div>
                      </div>
                    </div>
                  </a>
                  <a href="#"className="block bg-gray-50 p-3 rounded-lg hover:bg-gray-100 transition-colors border border-transparent hover:border-gray-200">
                    <div className="flex items-center gap-3">
                      <div className="text-green-600 bg-green-50 p-2 rounded-md">
                        <Code className="w-5 h-5"/>
                      </div>
                      <div>
                        <div className="font-medium text-gray-900 text-sm">Code Examples</div>
                        <div className="text-xs text-gray-500">GitHub Repository</div>
                      </div>
                    </div>
                  </a>
                  <a href="#"className="block bg-gray-50 p-3 rounded-lg hover:bg-gray-100 transition-colors border border-transparent hover:border-gray-200">
                    <div className="flex items-center gap-3">
                      <div className="text-orange-600 bg-orange-50 p-2 rounded-md">
                        <MessageCircle className="w-5 h-5"/>
                      </div>
                      <div>
                        <div className="font-medium text-gray-900 text-sm">Discussion Forum</div>
                        <div className="text-xs text-gray-500">Ask questions & help others</div>
                      </div>
                    </div>
                  </a>
                </div>
              </CardContent>
            </Card>
          </aside>
        </div>
      </div>
      <Footer />
    </div>);
}

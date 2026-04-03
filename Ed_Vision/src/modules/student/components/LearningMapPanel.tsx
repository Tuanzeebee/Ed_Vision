import { useState, useRef, useEffect } from 'react';
import { useDraggable } from '../hooks/useDraggable';
import { useResizable } from '../hooks/useResizable';

type Props = {
  visible: boolean;
  onClose: () =>void;
  onModuleClick?: (moduleId: number, courseId: string) =>void;
  initialX?: number;
  initialY?: number;
  initialWidth?: number;
  initialHeight?: number;
};

type ModuleNode = {
  id: number;
  title: string;
  status: 'locked'| 'available'| 'completed'| 'current';
  stars?: number;
  position: { x: number; y: number };
  isBoss?: boolean;
};

type Course = {
  id: string;
  name: string;
  subject: string;
  moduleCount: number;
  completedModules: number;
  totalStars: number;
  earnedStars: number;
  mapLayout: 'linear'| 'branching'| 'spiral'| 'tree'| 'circular';
  description: string;
};

type MapLayoutType = 'linear'| 'branching'| 'spiral'| 'tree'| 'circular';

export default function LearningMapPanel({
  visible,
  onClose,
  onModuleClick,
  initialX = (window.innerWidth - 800) / 2,
  initialY = (window.innerHeight - 600 - 80) / 2,
  initialWidth = 800,
  initialHeight = 600,
}: Props) {
  const { position, handleMouseDown } = useDraggable(initialX, initialY);
  const { size, handleMouseDown: handleResize } = useResizable(initialWidth, initialHeight, 700, 500);

  // State for course selection
  const [showCourseList, setShowCourseList] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);

  // Map drag-to-pan functionality
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [isDraggingMap, setIsDraggingMap] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [scrollStart, setScrollStart] = useState({ left: 0, top: 0 });

  // Car animation state
  const [carPosition, setCarPosition] = useState<{ x: number; y: number } | null>(null);
  const [isCarMoving, setIsCarMoving] = useState(false);
  const [animatingToModule, setAnimatingToModule] = useState<number | null>(null);
  const [justUnlockedModule, setJustUnlockedModule] = useState<number | null>(null);
  const carAnimationRef = useRef<number | null>(null);

  const handleMapMouseDown = (e: React.MouseEvent) => {
    if (!mapContainerRef.current) return;
    setIsDraggingMap(true);
    setDragStart({ x: e.clientX, y: e.clientY });
    setScrollStart({
      left: mapContainerRef.current.scrollLeft,
      top: mapContainerRef.current.scrollTop
    });
  };

  const handleMapMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingMap || !mapContainerRef.current) return;
    const dx = e.clientX - dragStart.x;
    const dy = e.clientY - dragStart.y;
    mapContainerRef.current.scrollLeft = scrollStart.left - dx;
    mapContainerRef.current.scrollTop = scrollStart.top - dy;
  };

  const handleMapMouseUp = () => {
    setIsDraggingMap(false);
  };

  const handleMapMouseLeave = () => {
    setIsDraggingMap(false);
  };

  if (!visible) return null;

  // Mock courses data
  const availableCourses: Course[] = [
    {
      id: 'ai-101',
      name: 'Artificial Intelligence Fundamentals',
      subject: 'Computer Science',
      moduleCount: 7,
      completedModules: 4,
      totalStars: 21,
      earnedStars: 11,
      mapLayout: 'linear',
      description: 'Learn the basics of AI and machine learning'},
    {
      id: 'ds-201',
      name: 'Data Structures & Algorithms',
      subject: 'Computer Science',
      moduleCount: 10,
      completedModules: 6,
      totalStars: 30,
      earnedStars: 18,
      mapLayout: 'branching',
      description: 'Master fundamental data structures'},
    {
      id: 'web-301',
      name: 'Web Development Advanced',
      subject: 'Software Engineering',
      moduleCount: 8,
      completedModules: 2,
      totalStars: 24,
      earnedStars: 6,
      mapLayout: 'spiral',
      description: 'Build modern web applications'},
    {
      id: 'db-401',
      name: 'Database Systems',
      subject: 'Information Systems',
      moduleCount: 6,
      completedModules: 0,
      totalStars: 18,
      earnedStars: 0,
      mapLayout: 'tree',
      description: 'Design and manage databases'},
    {
      id: 'sec-501',
      name: 'Cybersecurity Essentials',
      subject: 'Network Security',
      moduleCount: 9,
      completedModules: 3,
      totalStars: 27,
      earnedStars: 9,
      mapLayout: 'circular',
      description: 'Protect systems and data'}
  ];

  // Initialize with first course
  const currentCourse = selectedCourse || availableCourses[0];

  // Generate modules based on layout type
  const generateModulesForLayout = (layout: MapLayoutType, count: number): ModuleNode[] => {
    const modules: ModuleNode[] = [];
    
    switch (layout) {
      case 'linear': {
        // Winding road path like a real road map
        for (let i = 0; i < count; i++) {
          const progress = i / (count - 1);
          // Create S-curve road path
          const xProgress = progress * 900 + 150;
          const yBase = 400;
          const wave1 = Math.sin(progress * Math.PI * 2) * 120;
          const wave2 = Math.sin(progress * Math.PI * 3 + 1) * 60;
          const yPos = yBase + wave1 + wave2;
          
          modules.push({
            id: i + 1,
            title: `Module ${i + 1}: ${getModuleTitle(i)}`,
            status: i < currentCourse.completedModules ? 'completed': 
                    i === currentCourse.completedModules ? 'current': 
                    i === currentCourse.completedModules + 1 ? 'available': 'locked',
            stars: i < currentCourse.completedModules ? Math.floor(Math.random() * 3) + 1 : undefined,
            position: {
              x: xProgress,
              y: yPos
            },
            isBoss: i === count - 1 // Boss at the end like final building
          });
        }
        break;
      }
      
      case 'branching': {
        // Tree-like structure with branches
        const levels = Math.ceil(Math.log2(count + 1));
        let nodeIndex = 0;
        
        for (let level = 0; level < levels && nodeIndex < count; level++) {
          const nodesInLevel = Math.min(Math.pow(2, level), count - nodeIndex);
          for (let i = 0; i < nodesInLevel && nodeIndex < count; i++) {
            modules.push({
              id: nodeIndex + 1,
              title: `Module ${nodeIndex + 1}: ${getModuleTitle(nodeIndex)}`,
              status: nodeIndex < currentCourse.completedModules ? 'completed': 
                      nodeIndex === currentCourse.completedModules ? 'current': 
                      nodeIndex === currentCourse.completedModules + 1 ? 'available': 'locked',
              stars: nodeIndex < currentCourse.completedModules ? Math.floor(Math.random() * 3) + 1 : undefined,
              position: {
                x: 150 + level * 200,
                y: 150 + (i * (500 / Math.max(nodesInLevel - 1, 1)))
              },
              isBoss: nodeIndex === count - 1
            });
            nodeIndex++;
          }
        }
        break;
      }
      
      case 'spiral': {
        // Spiral pattern from center outward
        const centerX = 500;
        const centerY = 350;
        for (let i = 0; i < count; i++) {
          const angle = (i / count) * Math.PI * 4;
          const radius = 50 + (i / count) * 300;
          modules.push({
            id: i + 1,
            title: `Module ${i + 1}: ${getModuleTitle(i)}`,
            status: i < currentCourse.completedModules ? 'completed': 
                    i === currentCourse.completedModules ? 'current': 
                    i === currentCourse.completedModules + 1 ? 'available': 'locked',
            stars: i < currentCourse.completedModules ? Math.floor(Math.random() * 3) + 1 : undefined,
            position: {
              x: centerX + Math.cos(angle) * radius,
              y: centerY + Math.sin(angle) * radius
            },
            isBoss: i === count - 1
          });
        }
        break;
      }
      
      case 'tree': {
        // Hierarchical tree structure
        modules.push({
          id: 1,
          title: `Module 1: ${getModuleTitle(0)}`,
          status: 'completed',
          stars: 3,
          position: { x: 500, y: 100 }
        });
        
        for (let i = 1; i < count; i++) {
          const level = Math.floor(Math.log2(i + 1));
          const posInLevel = i - (Math.pow(2, level) - 1);
          const totalInLevel = Math.pow(2, level);
          
          modules.push({
            id: i + 1,
            title: `Module ${i + 1}: ${getModuleTitle(i)}`,
            status: i < currentCourse.completedModules ? 'completed': 
                    i === currentCourse.completedModules ? 'current': 
                    i === currentCourse.completedModules + 1 ? 'available': 'locked',
            stars: i < currentCourse.completedModules ? Math.floor(Math.random() * 3) + 1 : undefined,
            position: {
              x: 200 + (posInLevel * (600 / Math.max(totalInLevel - 1, 1))),
              y: 150 + level * 150
            },
            isBoss: i === Math.floor(count * 0.7)
          });
        }
        break;
      }
      
      case 'circular': {
        // Circular arrangement
        const centerX = 500;
        const centerY = 350;
        const radius = 250;
        
        for (let i = 0; i < count; i++) {
          const angle = (i / count) * Math.PI * 2 - Math.PI / 2;
          modules.push({
            id: i + 1,
            title: `Module ${i + 1}: ${getModuleTitle(i)}`,
            status: i < currentCourse.completedModules ? 'completed': 
                    i === currentCourse.completedModules ? 'current': 
                    i === currentCourse.completedModules + 1 ? 'available': 'locked',
            stars: i < currentCourse.completedModules ? Math.floor(Math.random() * 3) + 1 : undefined,
            position: {
              x: centerX + Math.cos(angle) * radius,
              y: centerY + Math.sin(angle) * radius
            },
            isBoss: i === 0
          });
        }
        break;
      }
    }
    
    return modules;
  };

  const getModuleTitle = (index: number): string => {
    const titles = [
      'Introduction', 'Fundamentals', 'Core Concepts', 'Advanced Topics',
      'Practical Applications', 'Deep Dive', 'Expert Techniques', 'Specialization',
      'Integration', 'Final Project', 'Capstone', 'Mastery'];
    return titles[index % titles.length];
  };

  const modules = generateModulesForLayout(currentCourse.mapLayout, currentCourse.moduleCount);

  // Generate path connections between modules
  const generatePaths = () => {
    const paths: Array<{ from: { x: number; y: number }; to: { x: number; y: number } }>= [];
    
    if (currentCourse.mapLayout === 'branching'|| currentCourse.mapLayout === 'tree') {
      // Connect parent to children in tree structures
      for (let i = 0; i < modules.length; i++) {
        const childIndex1 = 2 * i + 1;
        const childIndex2 = 2 * i + 2;
        if (childIndex1 < modules.length) {
          paths.push({ from: modules[i].position, to: modules[childIndex1].position });
        }
        if (childIndex2 < modules.length) {
          paths.push({ from: modules[i].position, to: modules[childIndex2].position });
        }
      }
    } else {
      // Linear connections for other layouts
      for (let i = 0; i < modules.length - 1; i++) {
        paths.push({ from: modules[i].position, to: modules[i + 1].position });
      }
    }
    
    return paths;
  };

  const pathData = generatePaths();

  const handleModuleNodeClick = (module: ModuleNode) => {
    if (module.status !== 'locked'&& onModuleClick) {
      onModuleClick(module.id, currentCourse.id);
    }
  };

  const handleCourseSelect = (course: Course) => {
    setSelectedCourse(course);
    setShowCourseList(false);
  };

  const getNodeIcon = (module: ModuleNode) => {
    if (module.isBoss) return '';
    if (module.status === 'locked') return '';
    if (module.status === 'current') return '';
    if (module.status === 'completed') return '';
    return '';
  };

  const getNodeColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'from-emerald-400 via-teal-400 to-cyan-400';
      case 'current':
        return 'from-blue-400 via-indigo-400 to-purple-400';
      case 'available':
        return 'from-amber-300 via-orange-300 to-yellow-300';
      default:
        return 'from-gray-300 via-gray-400 to-gray-500';
    }
  };

  // Animate car movement along the path
  const animateCarToNextModule = (fromModuleId: number, toModuleId: number) => {
    const fromModule = modules.find(m =>m.id === fromModuleId);
    const toModule = modules.find(m =>m.id === toModuleId);
    
    if (!fromModule || !toModule) return;

    setIsCarMoving(true);
    setAnimatingToModule(toModuleId);
    
    const startPos = fromModule.position;
    const endPos = toModule.position;
    const duration = 2000; // 2 seconds
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function for smooth movement
      const easeProgress = progress < 0.5
        ? 4 * progress * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 3) / 2;

      const currentX = startPos.x + (endPos.x - startPos.x) * easeProgress;
      const currentY = startPos.y + (endPos.y - startPos.y) * easeProgress;

      setCarPosition({ x: currentX, y: currentY });

      if (progress < 1) {
        carAnimationRef.current = requestAnimationFrame(animate);
      } else {
        // Animation complete - unlock next module
        setIsCarMoving(false);
        setAnimatingToModule(null);
        setJustUnlockedModule(toModuleId);
        
        // Clear unlock highlight after 1.5 seconds
        setTimeout(() => {
          setJustUnlockedModule(null);
        }, 1500);
      }
    };

    carAnimationRef.current = requestAnimationFrame(animate);
  };

  // Initialize car position at current module
  useEffect(() => {
    if (!carPosition && currentCourse) {
      const currentModule = modules.find(m =>m.status === 'current');
      if (currentModule) {
        setCarPosition(currentModule.position);
      }
    }
  }, [carPosition, modules, currentCourse]);

  // Cleanup animation on unmount
  useEffect(() => {
    return () => {
      if (carAnimationRef.current) {
        cancelAnimationFrame(carAnimationRef.current);
      }
    };
  }, []);

  // Trigger animation when a module is completed
  useEffect(() => {
    if (!visible) return;
    
    // Check if user just completed a module (this would be triggered from parent)
    const currentModule = modules.find(m =>m.status === 'current');
    const nextModule = modules.find(m =>m.status === 'available');
    
    if (currentModule && nextModule && !isCarMoving) {
      // Check if we should trigger animation (e.g., from localStorage flag)
      const shouldAnimate = localStorage.getItem('triggerModuleUnlock');
      if (shouldAnimate === 'true') {
        localStorage.removeItem('triggerModuleUnlock');
        setTimeout(() => {
          animateCarToNextModule(currentModule.id, nextModule.id);
        }, 300);
      }
    }
  }, [visible, modules, isCarMoving]);

  return (
    <div
      className="fixed z-10"style={{ left: `${position.x}px`, top: `${position.y}px`, width: `${size.width}px`, height: `${size.height}px` }}
    >
      <div className="backdrop-blur-[20px] bg-white/10 border border-white/20 rounded-3xl shadow-2xl h-full flex flex-col relative overflow-hidden">
        
        {/* Header */}
        <div
          className="flex-shrink-0 h-10 cursor-move rounded-t-3xl flex items-center justify-between px-6 border-b border-white/20"onMouseDown={handleMouseDown}
        >
          <div className="flex items-center gap-3">
            <i className="fas fa-map text-white/80 text-lg"></i>
            <div>
              <h2 className="text-xl font-semibold text-white">{currentCourse.name}</h2>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="text-white/60 hover:text-white transition">
            <i className="fas fa-times text-xl"></i>
          </button>
        </div>

        {/* Top Stats Bar */}
        <div className="flex-shrink-0 px-6 py-3 bg-black/20 backdrop-blur-sm border-b border-white/20 flex items-center justify-between relative z-10">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/25">
                <i className="fas fa-book-open text-white text-sm"></i>
              </div>
              <div>
                <div className="text-white/60 text-[10px] font-semibold">Progress</div>
                <div className="text-white font-bold text-sm">{currentCourse.completedModules}/{currentCourse.moduleCount} Modules</div>
                <div className="w-20 h-1.5 bg-gray-200 rounded-full overflow-hidden mt-1 shadow-inner">
                  <div 
                    className="h-full bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full transition-all duration-500"style={{ width: `${(currentCourse.completedModules / currentCourse.moduleCount) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>

            <div className="w-px h-10 bg-white/20"></div>

            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-500/25">
                <i className="fas fa-star text-white text-sm"></i>
              </div>
              <div>
                <div className="text-white/60 text-[10px] font-semibold">Stars</div>
                <div className="text-white font-bold text-sm">{currentCourse.earnedStars}/{currentCourse.totalStars} </div>
                <div className="w-20 h-1.5 bg-gray-200 rounded-full overflow-hidden mt-1 shadow-inner">
                  <div 
                    className="h-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-full transition-all duration-500"style={{ width: `${(currentCourse.earnedStars / currentCourse.totalStars) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 px-3 py-2 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20">
            <i className="fas fa-layer-group text-purple-400 text-sm"></i>
            <span className="text-white/90 text-xs font-semibold">
              {currentCourse.mapLayout.charAt(0).toUpperCase() + currentCourse.mapLayout.slice(1)}
            </span>
          </div>
        </div>

        {/* Map Canvas */}
        <div 
          ref={mapContainerRef}
          className="flex-1 relative overflow-auto scrollbar-hidden"style={{
            background: 'linear-gradient(135deg, #FFF5F7 0%, #FFF9E6 25%, #F0F4FF 50%, #F5F0FF 75%, #FFF5F7 100%)',
            cursor: isDraggingMap ? 'grabbing': 'grab'}}
          onMouseDown={handleMapMouseDown}
          onMouseMove={handleMapMouseMove}
          onMouseUp={handleMapMouseUp}
          onMouseLeave={handleMapMouseLeave}
        >
          {/* Hidden scrollbar styles */}
          <style>{`
            .scrollbar-hidden::-webkit-scrollbar {
              display: none;
            }
            .scrollbar-hidden {
              -ms-overflow-style: none;
              scrollbar-width: none;
            }
          `}</style>
          
          {/* Scrollable content wrapper */}
          <div className="relative"style={{ minWidth: '1200px', minHeight: '800px'}}>
            {/* SVG for road paths */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none"style={{ filter: 'drop-shadow(0 4px 12px rgba(0, 0, 0, 0.25))'}}>
              <defs>
                {/* Gradient for road */}
                <linearGradient id="roadGradient"x1="0%"y1="0%"x2="100%"y2="100%">
                  <stop offset="0%"stopColor="#c4b5fd"stopOpacity="0.8"/>
                  <stop offset="100%"stopColor="#a78bfa"stopOpacity="0.8"/>
                </linearGradient>
                {/* Animated gradient for active road */}
                <linearGradient id="activeRoadGradient"x1="0%"y1="0%"x2="100%"y2="100%">
                  <stop offset="0%"stopColor="#60a5fa"stopOpacity="1">
                    <animate attributeName="stopColor"values="#60a5fa;#3b82f6;#60a5fa"dur="1.5s"repeatCount="indefinite"/>
                  </stop>
                  <stop offset="100%"stopColor="#3b82f6"stopOpacity="1">
                    <animate attributeName="stopColor"values="#3b82f6;#2563eb;#3b82f6"dur="1.5s"repeatCount="indefinite"/>
                  </stop>
                </linearGradient>
              </defs>
              {pathData.map((path, index) => {
                const dx = path.to.x - path.from.x;
                const dy = path.to.y - path.from.y;
                
                // Create curved path for more natural roads
                const midX = (path.from.x + path.to.x) / 2;
                const midY = (path.from.y + path.to.y) / 2;
                
                // Control point offset for curve
                const offsetX = -dy * 0.15;
                const offsetY = dx * 0.15;
                
                const pathD = `M ${path.from.x} ${path.from.y} Q ${midX + offsetX} ${midY + offsetY} ${path.to.x} ${path.to.y}`;
                
                // Check if this is the active animating path
                const fromModule = modules[index];
                const toModule = modules[index + 1];
                const isActivePath = isCarMoving && 
                  fromModule && toModule && 
                  animatingToModule === toModule.id;
                
                return (
                  <g key={index}>
                    {/* Road background (wider) */}
                    <path
                      d={pathD}
                      fill="none"stroke={isActivePath ? "#3b82f6": "#8b5cf6"}
                      strokeWidth="12"strokeOpacity={isActivePath ? "0.5": "0.3"}
                      strokeLinecap="round"/>
                    
                    {/* Main road */}
                    <path
                      d={pathD}
                      fill="none"stroke={isActivePath ? "url(#activeRoadGradient)": "url(#roadGradient)"}
                      strokeWidth="8"strokeLinecap="round"strokeLinejoin="round"/>
                    
                    {/* Road centerline (dashed) */}
                    <path
                      d={pathD}
                      fill="none"stroke="white"strokeWidth="1.5"strokeOpacity={isActivePath ? "0.8": "0.5"}
                      strokeDasharray="8 8"strokeLinecap="round">
                      {isActivePath && <animate attributeName="strokeDashoffset"from="0"to="-16"dur="0.5s"repeatCount="indefinite"/>}
                    </path>
                    
                    {/* Glowing effect for active path */}
                    {isActivePath && (
                      <path
                        d={pathD}
                        fill="none"stroke="#60a5fa"strokeWidth="16"strokeOpacity="0.3"strokeLinecap="round"filter="blur(8px)"/>)}
                  </g>);
              })}
            </svg>

            {/* Animated Car */}
            {carPosition && (
              <div
                className="absolute pointer-events-none z-20 transition-transform"style={{
                  left: `${carPosition.x}px`,
                  top: `${carPosition.y}px`,
                  transform: 'translate(-50%, -50%)',
                  transition: isCarMoving ? 'none': 'all 0.3s ease'}}
              >
                <div className="relative">
                  {/* Car body with shadow */}
                  <div className="relative animate-bounce-subtle">
                    {/* SVG Car - Clear and Colorful */}
                    <svg 
                      width="64"height="64"viewBox="0 0 64 64"className="drop-shadow-2xl"style={{
                        filter: 'drop-shadow(0 8px 16px rgba(0, 0, 0, 0.4))'}}
                    >
                      {/* Car Shadow */}
                      <ellipse cx="32"cy="56"rx="24"ry="4"fill="rgba(0,0,0,0.2)"/>
                      
                      {/* Car Body - Main */}
                      <path 
                        d="M8 36 L12 24 L20 20 L44 20 L52 24 L56 36 L56 44 L8 44 Z"fill="url(#carBodyGradient)"stroke="#c0392b"strokeWidth="1.5"/>
                      
                      {/* Car Roof */}
                      <path 
                        d="M16 24 L20 14 L44 14 L48 24 Z"fill="url(#carRoofGradient)"stroke="#2c3e50"strokeWidth="1"/>
                      
                      {/* Windows */}
                      <path 
                        d="M18 22 L21 16 L30 16 L30 22 Z"fill="#87CEEB"stroke="#5dade2"strokeWidth="0.5"/>
                      <path 
                        d="M34 16 L43 16 L46 22 L34 22 Z"fill="#87CEEB"stroke="#5dade2"strokeWidth="0.5"/>
                      
                      {/* Window Reflection */}
                      <path d="M19 18 L21 16 L28 16 L28 17 Z"fill="rgba(255,255,255,0.5)"/>
                      <path d="M36 16 L42 16 L44 18 L36 17 Z"fill="rgba(255,255,255,0.5)"/>
                      
                      {/* Headlights */}
                      <circle cx="12"cy="34"r="3"fill="#f1c40f"stroke="#f39c12"strokeWidth="0.5"/>
                      <circle cx="52"cy="34"r="3"fill="#f1c40f"stroke="#f39c12"strokeWidth="0.5"/>
                      <circle cx="12"cy="34"r="1.5"fill="#fff"opacity="0.8"/>
                      <circle cx="52"cy="34"r="1.5"fill="#fff"opacity="0.8"/>
                      
                      {/* Tail Lights */}
                      <rect x="6"y="38"width="4"height="3"rx="1"fill="#e74c3c"/>
                      <rect x="54"y="38"width="4"height="3"rx="1"fill="#e74c3c"/>
                      
                      {/* Wheels */}
                      <circle cx="18"cy="46"r="8"fill="#2c3e50"stroke="#1a252f"strokeWidth="1"/>
                      <circle cx="18"cy="46"r="5"fill="#7f8c8d"/>
                      <circle cx="18"cy="46"r="2"fill="#bdc3c7"/>
                      
                      <circle cx="46"cy="46"r="8"fill="#2c3e50"stroke="#1a252f"strokeWidth="1"/>
                      <circle cx="46"cy="46"r="5"fill="#7f8c8d"/>
                      <circle cx="46"cy="46"r="2"fill="#bdc3c7"/>
                      
                      {/* Wheel Details */}
                      <g fill="#95a5a6">
                        <rect x="16"y="42"width="4"height="1"rx="0.5"/>
                        <rect x="16"y="49"width="4"height="1"rx="0.5"/>
                        <rect x="14"y="44"width="1"height="4"rx="0.5"/>
                        <rect x="21"y="44"width="1"height="4"rx="0.5"/>
                        
                        <rect x="44"y="42"width="4"height="1"rx="0.5"/>
                        <rect x="44"y="49"width="4"height="1"rx="0.5"/>
                        <rect x="42"y="44"width="1"height="4"rx="0.5"/>
                        <rect x="49"y="44"width="1"height="4"rx="0.5"/>
                      </g>
                      
                      {/* Door Handle */}
                      <rect x="28"y="30"width="8"height="2"rx="1"fill="#a93226"/>
                      
                      {/* Body Shine */}
                      <path 
                        d="M14 28 L20 22 L44 22 L50 28 L50 32 L14 32 Z"fill="rgba(255,255,255,0.15)"/>
                      
                      {/* Gradients */}
                      <defs>
                        <linearGradient id="carBodyGradient"x1="0%"y1="0%"x2="0%"y2="100%">
                          <stop offset="0%"stopColor="#e74c3c"/>
                          <stop offset="50%"stopColor="#c0392b"/>
                          <stop offset="100%"stopColor="#a93226"/>
                        </linearGradient>
                        <linearGradient id="carRoofGradient"x1="0%"y1="0%"x2="0%"y2="100%">
                          <stop offset="0%"stopColor="#34495e"/>
                          <stop offset="100%"stopColor="#2c3e50"/>
                        </linearGradient>
                      </defs>
                    </svg>
                    
                    {isCarMoving && (
                      <div className="absolute inset-0 animate-pulse">
                        <div className="w-full h-full bg-blue-400 rounded-full blur-xl opacity-50"></div>
                      </div>)}
                  </div>
                  {/* Speed lines when moving */}
                  {isCarMoving && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-full space-y-1">
                      <div className="h-0.5 w-8 bg-blue-400 opacity-70 animate-speed-line"></div>
                      <div className="h-0.5 w-6 bg-blue-300 opacity-50 animate-speed-line"style={{ animationDelay: '0.1s'}}></div>
                      <div className="h-0.5 w-4 bg-blue-200 opacity-30 animate-speed-line"style={{ animationDelay: '0.2s'}}></div>
                    </div>)}
                  {/* Dust particles when moving */}
                  {isCarMoving && (
                    <div className="absolute -left-4 bottom-0 space-x-1 flex">
                      <div className="w-2 h-2 bg-amber-200 rounded-full opacity-60 animate-dust-1"></div>
                      <div className="w-1.5 h-1.5 bg-amber-300 rounded-full opacity-40 animate-dust-2"></div>
                      <div className="w-1 h-1 bg-amber-100 rounded-full opacity-30 animate-dust-3"></div>
                    </div>)}
                </div>
              </div>)}

            {/* Module Nodes */}
            <div className="relative w-full h-full">
            {modules.map((module) =>(
              <div
                key={module.id}
                className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer group"style={{
                  left: `${module.position.x}px`,
                  top: `${module.position.y}px`,
                }}
                onClick={() =>handleModuleNodeClick(module)}
                onMouseDown={(e) =>e.stopPropagation()}
              >
                {/* Unlock animation effect */}
                {justUnlockedModule === module.id && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30">
                    <div className="absolute w-32 h-32 bg-yellow-400 rounded-full animate-ping opacity-75"></div>
                    <div className="absolute w-24 h-24 bg-blue-400 rounded-full animate-pulse opacity-50"></div>
                    <div className="absolute text-6xl animate-bounce"></div>
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-full">
                      <div className="bg-gradient-to-r from-yellow-400 via-orange-400 to-yellow-400 text-white px-4 py-2 rounded-full font-bold text-sm shadow-xl animate-bounce whitespace-nowrap">Unlocked!
                      </div>
                    </div>
                  </div>)}

                {/* Node Circle - Road Stop/Marker Style */}
                <div
                  className={`relative w-24 h-24 rounded-full bg-gradient-to-br ${getNodeColor(module.status)} 
                    shadow-2xl border-4 ${module.status === 'locked'? 'border-gray-400': 'border-white'} 
                    flex items-center justify-center
                    ${module.status === 'current'? 'animate-pulse ring-4 ring-yellow-400/60': ''}
                    ${module.status !== 'locked'? 'hover:scale-110 hover:shadow-3xl': 'opacity-70'}
                    transition-all duration-300`}
                  style={{
                    boxShadow: module.status !== 'locked'? '0 8px 20px rgba(0, 0, 0, 0.3), 0 0 0 2px rgba(255, 255, 255, 0.9) inset, 0 12px 24px rgba(0, 0, 0, 0.2)': '0 4px 12px rgba(0, 0, 0, 0.2)',
                    transform: 'perspective(500px) rotateX(20deg)'}}
                >
                  {/* 3D effect - inner circle */}
                  <div className="absolute inset-2 rounded-full bg-gradient-to-b from-white/30 to-transparent"></div>
                  
                  {/* Module Number on White Background Circle */}
                  <div className="w-16 h-16 bg-white rounded-full shadow-lg flex items-center justify-center relative z-10 border-2 border-gray-200">
                    <span className="text-3xl font-bold bg-gradient-to-br from-gray-700 to-gray-900 bg-clip-text text-transparent">
                      {module.id}
                    </span>
                  </div>
                  
                  {/* Status Icon Badge - Top Right */}
                  {module.status !== 'available'&& (
                    <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full shadow-xl flex items-center justify-center border-2 border-white"style={{
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)'}}>
                      <span className="text-lg">{getNodeIcon(module)}</span>
                    </div>)}

                  {/* Stars for completed modules */}
                  {module.stars && (
                    <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 flex gap-1 bg-gradient-to-b from-yellow-400 to-orange-500 px-2 py-1.5 rounded-full border-2 border-white shadow-xl">
                      {[...Array(3)].map((_, i) =>(
                        <div key={i} className="text-base">
                          {i < (module.stars || 0) ? '': ''}
                        </div>))}
                    </div>)}

                  {/* Boss - Final Destination Building */}
                  {module.isBoss && (
                    <div className="absolute -top-16 left-1/2 -translate-x-1/2">
                      <div className="text-6xl animate-bounce"style={{
                        filter: 'drop-shadow(0 6px 16px rgba(0, 0, 0, 0.4))'}}></div>
                    </div>)}
                </div>

                {/* Tooltip */}
                <div className="absolute top-24 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none z-50 group-hover:translate-y-1">
                  <div className="relative bg-white/95 backdrop-blur-xl text-gray-800 px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap shadow-xl border border-gray-200">
                    {/* Arrow */}
                    <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-white border-l border-t border-gray-200 rotate-45"></div>
                    
                    <div className="relative z-10">
                      <div className="font-bold text-sm mb-1 text-gray-900">{module.title}</div>
                      {module.status === 'locked'&& (
                        <div className="flex items-center gap-2 text-gray-600 text-[11px] mt-1">
                          <i className="fas fa-lock text-red-500"></i>
                          <span>Complete previous module first</span>
                        </div>)}
                      {module.status === 'current'&& (
                        <div className="flex items-center gap-2 text-blue-600 text-[11px] mt-1">
                          <i className="fas fa-play-circle text-blue-500"></i>
                          <span>Click to start learning!</span>
                        </div>)}
                      {module.status === 'available'&& (
                        <div className="flex items-center gap-2 text-emerald-600 text-[11px] mt-1">
                          <i className="fas fa-check-circle text-emerald-500"></i>
                          <span>Ready to continue!</span>
                        </div>)}
                      {module.status === 'completed'&& (
                        <div className="flex items-center gap-2 text-purple-600 text-[11px] mt-1">
                          <i className="fas fa-redo text-purple-500"></i>
                          <span>Click to review content</span>
                        </div>)}
                    </div>
                  </div>
                </div>
              </div>))}

              {/* Decorative floating elements */}
              <div className="absolute top-32 right-32 w-24 h-24 opacity-20 animate-float">
                <div className="w-full h-full rounded-full bg-gradient-to-br from-blue-300 to-indigo-400 blur-2xl"></div>
              </div>
              <div className="absolute bottom-40 left-40 w-20 h-20 opacity-20 animate-float-delayed">
                <div className="w-full h-full rounded-full bg-gradient-to-br from-purple-300 to-pink-400 blur-2xl"></div>
              </div>
              <div className="absolute top-1/2 left-1/4 w-16 h-16 opacity-20 animate-float">
                <div className="w-full h-full rounded-full bg-gradient-to-br from-cyan-300 to-blue-400 blur-2xl"></div>
              </div>
              
              <style>{`
                @keyframes float {
                  0%, 100% { transform: translateY(0px); }
                  50% { transform: translateY(-20px); }
                }
                @keyframes float-delayed {
                  0%, 100% { transform: translateY(0px); }
                  50% { transform: translateY(-15px); }
                }
                @keyframes bounce-subtle {
                  0%, 100% { transform: translateY(0px); }
                  50% { transform: translateY(-4px); }
                }
                @keyframes speed-line {
                  0% { transform: translateX(0) scaleX(1); opacity: 0.7; }
                  100% { transform: translateX(-20px) scaleX(0.5); opacity: 0; }
                }
                .animate-float {
                  animation: float 6s ease-in-out infinite;
                }
                .animate-float-delayed {
                  animation: float-delayed 8s ease-in-out infinite;
                }
                .animate-bounce-subtle {
                  animation: bounce-subtle 0.5s ease-in-out infinite;
                }
                .animate-speed-line {
                  animation: speed-line 0.6s ease-out infinite;
                }
                @keyframes dust-1 {
                  0% { transform: translate(0, 0) scale(1); opacity: 0.6; }
                  100% { transform: translate(-15px, -8px) scale(0.3); opacity: 0; }
                }
                @keyframes dust-2 {
                  0% { transform: translate(0, 0) scale(1); opacity: 0.4; }
                  100% { transform: translate(-12px, 5px) scale(0.2); opacity: 0; }
                }
                @keyframes dust-3 {
                  0% { transform: translate(0, 0) scale(1); opacity: 0.3; }
                  100% { transform: translate(-10px, -3px) scale(0.1); opacity: 0; }
                }
                .animate-dust-1 {
                  animation: dust-1 0.8s ease-out infinite;
                }
                .animate-dust-2 {
                  animation: dust-2 0.6s ease-out infinite 0.1s;
                }
                .animate-dust-3 {
                  animation: dust-3 0.5s ease-out infinite 0.2s;
                }
              `}</style>
            </div>
          </div>
        </div>

        {/* Bottom Action Bar */}
        <div className="flex-shrink-0 px-6 py-3 bg-black/20 backdrop-blur-xl border-t border-white/20 flex items-center justify-between relative z-10">
          <div className="flex items-center gap-3 flex-1">
            <button className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl transition-all duration-300 flex items-center gap-2 border border-white/20 text-sm">
              <i className="fas fa-info-circle text-blue-500"></i>
              <span>Info</span>
            </button>
            <div className="flex items-center gap-2 px-3 py-2 bg-white/5 rounded-xl border border-white/20">
              <i className="fas fa-quote-left text-white/40 text-[10px]"></i>
              <span className="text-white/80 text-xs font-medium italic truncate max-w-[200px]">{currentCourse.description}</span>
              <i className="fas fa-quote-right text-white/40 text-[10px]"></i>
            </div>
          </div>
          
          <div className="flex gap-2">
            <button 
              onClick={() =>setShowCourseList(true)}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl transition-all duration-300 flex items-center gap-2 border border-white/20 text-sm">
              <i className="fas fa-th-list"></i>
              <span>Courses</span>
              <span className="ml-0.5 px-2 py-0.5 bg-white/20 rounded-lg text-xs font-bold">{availableCourses.length}</span>
            </button>
            <button 
              onClick={() => {
                const currentModule = modules.find(m =>m.status === 'current');
                if (currentModule) handleModuleNodeClick(currentModule);
              }}
              className="px-5 py-2 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 hover:from-blue-600 hover:via-indigo-600 hover:to-purple-600 text-white font-bold rounded-xl transition-all duration-300 flex items-center gap-2 shadow-xl shadow-blue-500/30 hover:shadow-2xl hover:shadow-blue-500/40 hover:scale-105 border border-white/50 text-sm">
              <i className="fas fa-play"></i>
              <span>Continue</span>
            </button>
          </div>
        </div>

        {/* Resize Handle */}
        <div
          className="absolute w-3 h-3 bg-white/30 border-2 border-white/60 rounded-full cursor-nwse-resize bottom-[-6px] right-[-6px] z-10 hover:bg-white/50"onMouseDown={handleResize}
        />
      </div>

      {/* Course List Modal */}
      {showCourseList && (
        <div className="absolute inset-0 bg-black/40 backdrop-blur-md rounded-3xl flex items-center justify-center z-50">
          <div className="backdrop-blur-[20px] bg-white/10 border border-white/20 rounded-3xl p-6 max-w-3xl w-full max-h-[550px] overflow-hidden flex flex-col shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between mb-5 pb-4 border-b border-white/20">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-2xl flex items-center justify-center shadow-lg">
                  <i className="fas fa-graduation-cap text-white text-base"></i>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Select Course</h3>
                  <p className="text-white/60 text-xs">Choose a course to view its learning path</p>
                </div>
              </div>
              <button 
                onClick={() =>setShowCourseList(false)}
                className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-all duration-300 border border-white/20">
                <i className="fas fa-times"></i>
              </button>
            </div>

            {/* Course List */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-hidden">
              {availableCourses.map((course) =>(
                <div
                  key={course.id}
                  onClick={() =>handleCourseSelect(course)}
                  className={`p-4 rounded-2xl cursor-pointer transition-all duration-300 border ${
                    currentCourse.id === course.id
                      ? 'bg-white/20 border-white/40 shadow-lg': 'bg-white/5 hover:bg-white/10 border-white/10 hover:border-white/20'}`}
                >
                  <div className="flex items-start gap-4">
                    {/* Course Icon */}
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg ${
                      currentCourse.id === course.id
                        ? 'bg-gradient-to-br from-blue-400 to-purple-500': 'bg-gradient-to-br from-gray-400 to-gray-500'}`}>
                      <i className="fas fa-book-open text-white text-lg"></i>
                    </div>

                    {/* Course Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex-1">
                          <h4 className="text-base font-bold text-white mb-1 flex items-center gap-2">
                            {course.name}
                            {currentCourse.id === course.id && (
                              <span className="px-2 py-0.5 bg-gradient-to-r from-emerald-400 to-teal-500 text-white text-[10px] rounded-lg font-bold">ACTIVE
                              </span>)}
                          </h4>
                          <p className="text-white/60 text-xs mb-2">{course.description}</p>
                          <div className="flex items-center gap-2 text-[11px]">
                            <span className="flex items-center gap-1.5 text-white/70 bg-white/10 px-2 py-1 rounded-lg border border-white/20">
                              <i className="fas fa-book text-blue-400 text-[10px]"></i>
                              <span>{course.subject}</span></span>
                            <span className="flex items-center gap-1.5 text-white/70 bg-white/10 px-2 py-1 rounded-lg border border-white/20">
                              <i className="fas fa-layer-group text-purple-400 text-[10px]"></i>
                              <span>{course.mapLayout.charAt(0).toUpperCase() + course.mapLayout.slice(1)}</span></span>
                          </div>
                        </div>

                        {/* Stats */}
                        <div className="flex gap-3 flex-shrink-0">
                          <div className="text-center">
                            <div className="text-white font-bold text-lg">
                              {course.completedModules}<span className="text-white/50 text-sm">/{course.moduleCount}</span>
                            </div>
                            <div className="text-white/50 text-[9px] font-semibold">MODULES</div>
                          </div>
                          <div className="w-px bg-white/20"></div>
                          <div className="text-center">
                            <div className="text-amber-400 font-bold text-lg flex items-center gap-1">
                              <i className="fas fa-star text-sm"></i>
                              <span>{course.earnedStars}<span className="text-white/50 text-sm">/{course.totalStars}</span></span>
                            </div>
                            <div className="text-white/50 text-[9px] font-semibold">STARS</div>
                          </div>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="h-2 bg-black/30 rounded-full overflow-hidden border border-white/10">
                        <div 
                          className="h-full bg-gradient-to-r from-emerald-400 to-teal-500 transition-all duration-500 relative overflow-hidden"style={{ width: `${(course.completedModules / course.moduleCount) * 100}%` }}
                        >
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>))}
            </div>

            <style>{`
              @keyframes shimmer {
                0% { transform: translateX(-100%); }
                100% { transform: translateX(100%); }
              }
              .animate-shimmer {
                animation: shimmer 2s infinite;
              }
            `}</style>
          </div>
        </div>)}
    </div>);
}

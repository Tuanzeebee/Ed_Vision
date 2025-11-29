import { useDraggable } from '../hooks/useDraggable';
import { useResizable } from '../hooks/useResizable';

type Props = {
  visible: boolean;
  onClose: () => void;
  initialX?: number;
  initialY?: number;
  initialWidth?: number;
  initialHeight?: number;
};

type ModuleNode = {
  id: number;
  title: string;
  status: 'locked' | 'available' | 'completed' | 'current';
  stars?: number;
  position: { x: number; y: number };
  isBoss?: boolean;
};

export default function LearningMapPanel({
  visible,
  onClose,
  initialX = 50,
  initialY = 50,
  initialWidth = 1000,
  initialHeight = 700,
}: Props) {
  const { position, handleMouseDown } = useDraggable(initialX, initialY);
  const { size, handleMouseDown: handleResize } = useResizable(initialWidth, initialHeight, 800, 600);

  if (!visible) return null;

  // Define module nodes with their positions
  const modules: ModuleNode[] = [
    { id: 1, title: 'Module 1: Introduction to AI', status: 'completed', stars: 3, position: { x: 100, y: 450 } },
    { id: 2, title: 'Module 2: AI Fundamentals', status: 'completed', stars: 3, position: { x: 250, y: 350 } },
    { id: 3, title: 'Module 3: Machine Learning', status: 'completed', stars: 2, position: { x: 250, y: 200 } },
    { id: 4, title: 'Module 4: Deep Learning', status: 'completed', stars: 3, position: { x: 400, y: 150 } },
    { id: 5, title: 'Module 5: AI Applications', status: 'current', position: { x: 550, y: 250 }, isBoss: true },
    { id: 6, title: 'Module 6: Ethics in AI', status: 'available', position: { x: 700, y: 200 } },
    { id: 7, title: 'Module 7: AI Project', status: 'locked', position: { x: 850, y: 300 } },
  ];

  // Path points for connecting nodes
  const pathData = [
    { from: modules[0].position, to: modules[1].position },
    { from: modules[1].position, to: modules[2].position },
    { from: modules[2].position, to: modules[3].position },
    { from: modules[3].position, to: modules[4].position },
    { from: modules[4].position, to: modules[5].position },
    { from: modules[5].position, to: modules[6].position },
  ];

  const getNodeIcon = (module: ModuleNode) => {
    if (module.isBoss) return '👑';
    if (module.status === 'locked') return '🔒';
    if (module.status === 'current') return '🎯';
    if (module.status === 'completed') return '⭐';
    return '📚';
  };

  const getNodeColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'from-green-400 to-green-600';
      case 'current':
        return 'from-red-400 to-red-600';
      case 'available':
        return 'from-yellow-400 to-yellow-600';
      default:
        return 'from-gray-400 to-gray-600';
    }
  };

  return (
    <div
      className="fixed z-10"
      style={{ left: `${position.x}px`, top: `${position.y}px`, width: `${size.width}px`, height: `${size.height}px` }}
    >
      <div className="backdrop-blur-[20px] bg-white/10 border border-white/20 rounded-3xl shadow-2xl h-full flex flex-col relative overflow-hidden">
        {/* Header */}
        <div
          className="flex-shrink-0 h-12 cursor-move rounded-t-3xl flex items-center justify-between px-6 bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-b border-white/10"
          onMouseDown={handleMouseDown}
        >
          <div className="flex items-center gap-3">
            <i className="fas fa-map text-white/80 text-lg"></i>
            <h2 className="text-xl font-semibold text-white">Course: Artificial Intelligence Fundamentals</h2>
          </div>
          <button onClick={onClose} className="text-white/60 hover:text-white transition">
            <i className="fas fa-times text-xl"></i>
          </button>
        </div>

        {/* Top Stats Bar */}
        <div className="flex-shrink-0 px-6 py-3 bg-black/20 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 bg-gradient-to-br from-purple-400 to-purple-600 rounded-lg flex items-center justify-center">
                <i className="fas fa-graduation-cap text-white text-sm"></i>
              </div>
              <div>
                <div className="text-white/60 text-xs">Progress</div>
                <div className="text-white font-semibold text-sm">4/7 Modules</div>
              </div>
            </div>

            <div className="flex items-center gap-2 ml-4">
              <div className="w-9 h-9 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-lg flex items-center justify-center">
                <i className="fas fa-star text-white text-sm"></i>
              </div>
              <div>
                <div className="text-white/60 text-xs">Stars Earned</div>
                <div className="text-white font-semibold text-sm">11/21</div>
              </div>
            </div>
          </div>

          <div className="text-white/70 text-sm">
            7 Modules • 52 Lessons Total
          </div>
        </div>

        {/* Map Canvas */}
        <div 
          className="flex-1 relative overflow-hidden"
          style={{
            backgroundImage: 'url("https://images.unsplash.com/photo-1551244072-5d12893278ab?w=1920&h=1080&fit=crop")',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          {/* Overlay gradient */}
          <div className="absolute inset-0 bg-gradient-to-b from-green-500/30 via-green-400/20 to-green-600/30"></div>
          
          {/* SVG for paths */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }}>
            {pathData.map((path, index) => {
              const completed = index < 4; // First 4 paths are completed
              return (
                <line
                  key={index}
                  x1={path.from.x}
                  y1={path.from.y}
                  x2={path.to.x}
                  y2={path.to.y}
                  stroke={completed ? '#4ade80' : '#94a3b8'}
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={completed ? '0' : '10,10'}
                  opacity={completed ? '0.8' : '0.5'}
                />
              );
            })}
          </svg>

          {/* Module Nodes */}
          <div className="relative w-full h-full">
            {modules.map((module) => (
              <div
                key={module.id}
                className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer group"
                style={{
                  left: `${module.position.x}px`,
                  top: `${module.position.y}px`,
                }}
              >
                {/* Node Circle */}
                <div
                  className={`relative w-20 h-20 rounded-full bg-gradient-to-br ${getNodeColor(module.status)} 
                    shadow-xl border-4 border-white/50 flex items-center justify-center
                    ${module.status === 'current' ? 'animate-pulse ring-4 ring-red-400/50' : ''}
                    ${module.status !== 'locked' ? 'hover:scale-110' : 'opacity-60'}
                    transition-all duration-300`}
                >
                  {/* Icon/Emoji */}
                  <div className="text-3xl">{getNodeIcon(module)}</div>
                  
                  {/* Number Badge */}
                  <div className="absolute -top-2 -left-2 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center border-2 border-gray-300">
                    <span className="text-gray-800 font-bold text-sm">{module.id}</span>
                  </div>

                  {/* Stars for completed modules */}
                  {module.stars && (
                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 flex gap-0.5">
                      {[...Array(3)].map((_, i) => (
                        <div
                          key={i}
                          className={`w-4 h-4 rounded-sm flex items-center justify-center ${
                            i < (module.stars || 0) ? 'bg-yellow-400' : 'bg-gray-400'
                          }`}
                        >
                          <i className="fas fa-star text-white text-[8px]"></i>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Boss Crown */}
                  {module.isBoss && (
                    <div className="absolute -top-6 left-1/2 -translate-x-1/2">
                      <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center border-2 border-white shadow-lg">
                        <i className="fas fa-crown text-white"></i>
                      </div>
                    </div>
                  )}
                </div>

                {/* Tooltip */}
                <div className="absolute top-24 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                  <div className="bg-black/90 backdrop-blur-sm text-white px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap shadow-xl border border-white/20">
                    {module.title}
                    {module.status === 'locked' && <div className="text-white/60 text-[10px]">Complete previous module</div>}
                    {module.status === 'current' && <div className="text-yellow-400 text-[10px]">Click to start learning!</div>}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Decorative elements */}
          <div className="absolute top-20 right-20 w-16 h-16 opacity-30">
            <i className="fas fa-tree text-green-800 text-4xl"></i>
          </div>
          <div className="absolute bottom-32 left-32 w-12 h-12 opacity-30">
            <i className="fas fa-tree text-green-800 text-3xl"></i>
          </div>
          <div className="absolute top-40 left-60 w-10 h-10 opacity-20">
            <i className="fas fa-mountain text-gray-600 text-2xl"></i>
          </div>
        </div>

        {/* Bottom Action Bar */}
        <div className="flex-shrink-0 px-6 py-4 bg-black/20 border-t border-white/10 flex items-center justify-between">
          <button className="px-6 py-2.5 bg-white/10 hover:bg-white/20 text-white font-medium rounded-full transition flex items-center gap-2">
            <i className="fas fa-info-circle"></i>
            Course Info
          </button>
          
          <div className="flex gap-3">
            <button className="px-6 py-2.5 bg-white/10 hover:bg-white/20 text-white font-medium rounded-full transition flex items-center gap-2">
              <i className="fas fa-list"></i>
              All Courses
            </button>
            <button className="px-6 py-2.5 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-bold rounded-full transition flex items-center gap-2">
              <i className="fas fa-play"></i>
              Start Module
            </button>
          </div>
        </div>

        {/* Resize Handle */}
        <div
          className="absolute w-3 h-3 bg-white/30 border-2 border-white/60 rounded-full cursor-nwse-resize bottom-[-6px] right-[-6px] z-10 hover:bg-white/50"
          onMouseDown={handleResize}
        />
      </div>
    </div>
  );
}

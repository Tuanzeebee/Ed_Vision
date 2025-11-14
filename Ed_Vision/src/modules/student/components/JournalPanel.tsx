import { useState } from 'react';
import type { JournalEntry } from '../types/learningSpace';
import { useDraggable } from '../hooks/useDraggable';
import { useResizable } from '../hooks/useResizable';

type Props = {
  visible: boolean;
  onClose: () => void;
  onSaveEntry: (entry: Omit<JournalEntry, 'id'>) => void;
  recentEntries?: JournalEntry[];
  initialX?: number;
  initialY?: number;
  initialWidth?: number;
  initialHeight?: number;
};

export default function JournalPanel({
  visible,
  onClose,
  onSaveEntry,
  recentEntries = [],
  initialX = (window.innerWidth - 800) / 2,
  initialY = (window.innerHeight - 600 - 80) / 2,
  initialWidth = 800,
  initialHeight = 600,
}: Props) {
  const { position, handleMouseDown } = useDraggable(initialX, initialY);
  const { size, handleMouseDown: handleResize } = useResizable(initialWidth, initialHeight, 600, 500);
  
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedMood, setSelectedMood] = useState('');
  const [content, setContent] = useState('');

  if (!visible) return null;

  const moods = ['😊', '😐', '😔', '🤔', '🤩'];

  const defaultEntries: JournalEntry[] = recentEntries.length > 0 ? recentEntries : [
    {
      id: '1',
      date: 'Dec 12, 2024',
      title: 'Yesterday',
      content: 'Completed 3 Pomodoro sessions focusing on mathematics. Made good progress on calculus problems...',
      mood: '😊',
    },
    {
      id: '2',
      date: 'Dec 11, 2024',
      title: '2 days ago',
      content: 'Started new project on web development. Learned about responsive design principles...',
      mood: '🤔',
    },
    {
      id: '3',
      date: 'Dec 10, 2024',
      title: '3 days ago',
      content: 'Reviewed chemistry concepts and practiced problem solving. Need to focus more on organic chemistry...',
      mood: '😐',
    },
  ];

  const handleSave = () => {
    if (content.trim()) {
      onSaveEntry({
        date,
        mood: selectedMood,
        content,
        title: new Date().toLocaleDateString(),
      });
      setContent('');
      setSelectedMood('');
    }
  };

  return (
    <div
      className="fixed z-10"
      style={{ left: `${position.x}px`, top: `${position.y}px`, width: `${size.width}px`, height: `${size.height}px` }}
    >
      <div className="backdrop-blur-[20px] bg-white/10 border border-white/20 rounded-3xl shadow-2xl h-full relative">
        <div
          className="absolute top-0 left-0 right-0 h-10 cursor-move rounded-t-3xl flex items-center justify-between px-6"
          onMouseDown={handleMouseDown}
        >
          <div className="flex items-center gap-3">
            <i className="fas fa-book text-white/80 text-lg"></i>
            <h2 className="text-xl font-semibold text-white">Study Journal</h2>
          </div>
          <button
            onClick={onClose}
            className="text-white/60 hover:text-white transition"
          >
            <i className="fas fa-times text-xl"></i>
          </button>
        </div>

        <div className="p-8 pt-16 h-full overflow-auto scrollbar-none">
          <div className="space-y-5">
            <div>
              <label className="text-white/70 text-sm font-medium mb-2 block">Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-white/30"
              />
            </div>

            <div>
              <label className="text-white/70 text-sm font-medium mb-2 block">Mood</label>
              <div className="flex gap-2">
                {moods.map((mood) => (
                  <button
                    key={mood}
                    onClick={() => setSelectedMood(mood)}
                    className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl transition ${
                      selectedMood === mood
                        ? 'bg-white/20 ring-2 ring-white/40'
                        : 'bg-white/10 hover:bg-white/20'
                    }`}
                  >
                    {mood}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-white/70 text-sm font-medium mb-2 block">Today's Entry</label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write about your study session, goals, achievements, or reflections..."
                className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white text-sm leading-relaxed min-h-[200px] max-h-[300px] resize-none focus:outline-none focus:ring-2 focus:ring-white/30 placeholder-white/40"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleSave}
                className="flex-1 bg-white/20 hover:bg-white/30 text-white font-medium py-3 px-4 rounded-lg transition"
              >
                <i className="fas fa-save mr-2"></i>Save Entry
              </button>
              <button className="bg-white/10 hover:bg-white/20 text-white font-medium py-3 px-4 rounded-lg transition">
                <i className="fas fa-history"></i>
              </button>
            </div>

            <div className="pt-6 border-t border-white/20">
              <h4 className="text-white/70 text-sm font-medium mb-3">Recent Entries</h4>
              <div className="space-y-2 max-h-32 overflow-y-auto scrollbar-none">
                {defaultEntries.map((entry) => (
                  <div
                    key={entry.id}
                    className="bg-white/5 hover:bg-white/10 rounded-lg p-4 cursor-pointer transition"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white text-sm font-medium">{entry.title}</span>
                      <span className="text-white/50 text-xs">{entry.date}</span>
                    </div>
                    <p className="text-white/60 text-xs line-clamp-2">{entry.content}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div
          className="absolute w-3 h-3 bg-white/30 border-2 border-white/60 rounded-full cursor-nwse-resize bottom-[-6px] right-[-6px] z-10 hover:bg-white/50"
          onMouseDown={handleResize}
        ></div>
      </div>
    </div>
  );
}

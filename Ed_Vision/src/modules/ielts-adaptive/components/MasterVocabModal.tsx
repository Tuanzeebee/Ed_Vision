import React, { useState, useEffect, useCallback } from 'react';
import {
  X, Star, BookOpen, Headphones, PenLine, Mic2,
  Search, Trash2, Volume2, ChevronDown, 
  Layers, BookMarked, Sparkles
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface MasterVocabWord {
  id: string | number;
  en: string;
  vn: string;
  type: string;
  source: 'ai' | 'user';
  starred: boolean;
  note: string;
  phonetic?: string;
  example?: string;
  skill: 'reading' | 'listening' | 'writing' | 'speaking' | 'vocabulary' | 'grammar';
  lessonId?: string | number;
  lessonTitle?: string;
  created_at?: string;
}

interface MasterVocabModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const MASTER_KEY = 'ielts_master_vocab';

const SKILL_CONFIG = {
  all: {
    label: 'Tất cả',
    icon: <Layers className="w-3.5 h-3.5" />,
    color: 'text-slate-600',
    activeBg: 'bg-slate-800 text-white',
    dot: 'bg-slate-500',
    border: 'border-slate-300',
  },
  reading: {
    label: 'Reading',
    icon: <BookOpen className="w-3.5 h-3.5" />,
    color: 'text-blue-600',
    activeBg: 'bg-blue-600 text-white',
    dot: 'bg-blue-500',
    border: 'border-blue-200',
  },
  listening: {
    label: 'Listening',
    icon: <Headphones className="w-3.5 h-3.5" />,
    color: 'text-cyan-600',
    activeBg: 'bg-cyan-600 text-white',
    dot: 'bg-cyan-500',
    border: 'border-cyan-200',
  },
  writing: {
    label: 'Writing',
    icon: <PenLine className="w-3.5 h-3.5" />,
    color: 'text-indigo-600',
    activeBg: 'bg-indigo-600 text-white',
    dot: 'bg-indigo-500',
    border: 'border-indigo-200',
  },
  speaking: {
    label: 'Speaking',
    icon: <Mic2 className="w-3.5 h-3.5" />,
    color: 'text-amber-600',
    activeBg: 'bg-amber-500 text-white',
    dot: 'bg-amber-500',
    border: 'border-amber-200',
  },
} as const;

type SkillTab = keyof typeof SKILL_CONFIG;
type SortMode = 'newest' | 'alpha' | 'starred';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Call this from LessonPage whenever a word is added/starred to sync to master list.
 */
export function syncToMasterVocab(
  word: any,
  lessonId: string | number,
  lessonTitle: string,
  skill: MasterVocabWord['skill']
) {
  try {
    const raw = localStorage.getItem(MASTER_KEY);
    const master: MasterVocabWord[] = raw ? JSON.parse(raw) : [];
    
    // Create or Update
    const exists = master.findIndex(w => w.en.toLowerCase() === word.en.toLowerCase());
    const enriched: MasterVocabWord = { 
        ...word, 
        skill, 
        lessonId, 
        lessonTitle,
        id: word.id || Date.now()
    };
    
    if (exists >= 0) {
      master[exists] = { ...master[exists], ...enriched };
    } else {
      master.unshift(enriched);
    }
    localStorage.setItem(MASTER_KEY, JSON.stringify(master));
  } catch (e) {
    console.error('syncToMasterVocab error:', e);
  }
}

/**
 * Scan all ielts_vocab_* keys and migrate starred words into master list.
 */
export function migrateVocabToMaster() {
  try {
    const raw = localStorage.getItem(MASTER_KEY);
    const master: MasterVocabWord[] = raw ? JSON.parse(raw) : [];
    const existingEn = new Set(master.map(w => w.en.toLowerCase()));

    Object.keys(localStorage).forEach(key => {
      if (!key.startsWith('ielts_vocab_')) return;
      const lessonId = key.replace('ielts_vocab_', '');
      try {
        const words = JSON.parse(localStorage.getItem(key) || '[]');
        words.forEach((w: any) => {
          if (!existingEn.has(w.en.toLowerCase())) {
            master.unshift({
              ...w,
              skill: w.skill || 'reading',
              lessonId,
              lessonTitle: w.lessonTitle || `Bài ${lessonId}`,
            });
            existingEn.add(w.en.toLowerCase());
          }
        });
      } catch {}
    });

    localStorage.setItem(MASTER_KEY, JSON.stringify(master));
  } catch (e) {
    console.error('migrateVocabToMaster error:', e);
  }
}

// ─── Word Card ────────────────────────────────────────────────────────────────

const WordCard: React.FC<{
  word: MasterVocabWord;
  onToggleStar: (id: string | number) => void;
  onDelete: (id: string | number) => void;
}> = ({ word, onToggleStar, onDelete }) => {
  const [expanded, setExpanded] = useState(false);
  const skill = SKILL_CONFIG[word.skill as SkillTab] ?? SKILL_CONFIG.reading;

  const handleSpeak = (text: string) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div
      className={`group rounded-2xl border-2 transition-all duration-200 bg-white overflow-hidden
        ${word.starred ? 'border-amber-200 shadow-md shadow-amber-50' : 'border-slate-100 hover:border-slate-200 hover:shadow-sm'}`}
    >
      <div
        className="flex items-start gap-3 p-4 cursor-pointer"
        onClick={() => setExpanded(e => !e)}
      >
        <div className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${skill.dot}`} />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[15px] font-black text-slate-800">{word.en}</span>
            {word.phonetic && (
              <span className="text-[11px] text-blue-500 font-medium flex items-center gap-1">
                {word.phonetic}
              </span>
            )}
            <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-500 font-black uppercase tracking-wider">
              {word.type}
            </span>
          </div>
          <p className="text-[13px] text-slate-500 font-medium mt-0.5 line-clamp-1">{word.vn}</p>
          
          {word.lessonTitle && (
            <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
              <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-black uppercase
                ${word.source === 'ai' ? 'bg-indigo-50 text-indigo-500' : 'bg-emerald-50 text-emerald-600'}`}>
                {word.source === 'ai' ? '✨ AI' : '👤 Bạn'}
              </span>
              {word.lessonTitle}
            </p>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={e => { e.stopPropagation(); handleSpeak(word.en); }}
            className="p-1.5 rounded-lg text-slate-300 hover:text-blue-500 hover:bg-blue-50 transition-all"
          >
            <Volume2 className="w-4 h-4" />
          </button>
          <button
            onClick={e => { e.stopPropagation(); onToggleStar(word.id); }}
            className={`p-1.5 rounded-lg transition-colors ${word.starred ? 'text-amber-500' : 'text-slate-300 hover:text-amber-400'}`}
          >
            <Star className={`w-4 h-4 ${word.starred ? 'fill-current' : ''}`} />
          </button>
          <button
            onClick={e => { e.stopPropagation(); onDelete(word.id); }}
            className="p-1.5 rounded-lg text-slate-300 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {expanded && (
        <div className="px-4 pb-4 pt-0 space-y-3 border-t border-slate-50 animate-in slide-in-from-top-2 duration-150">
          <div className="mt-3 p-3 bg-blue-50/50 rounded-xl border border-blue-100/50">
            <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">Nghĩa đầy đủ</p>
            <p className="text-sm font-bold text-blue-900">{word.vn}</p>
          </div>

          {word.example && (
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Ví dụ ngữ cảnh</p>
              <p className="text-[13px] text-slate-600 italic leading-relaxed border-l-2 border-blue-200 pl-3">
                "{word.example}"
              </p>
            </div>
          )}

          {word.note && (
            <div className="p-3 bg-amber-50 rounded-xl border border-amber-100">
              <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-1">📝 Ghi chú của bạn</p>
              <p className="text-[13px] text-slate-700 leading-relaxed">{word.note}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ─── Main Modal ───────────────────────────────────────────────────────────────

export const MasterVocabModal: React.FC<MasterVocabModalProps> = ({ isOpen, onClose }) => {
  const [words, setWords] = useState<MasterVocabWord[]>([]);
  const [activeTab, setActiveTab] = useState<SkillTab>('all');
  const [search, setSearch] = useState('');
  const [sortMode, setSortMode] = useState<SortMode>('newest');
  const [showStarredOnly, setShowStarredOnly] = useState(false);

  // Load from localStorage
  const loadWords = useCallback(() => {
    migrateVocabToMaster();
    try {
      const raw = localStorage.getItem(MASTER_KEY);
      setWords(raw ? JSON.parse(raw) : []);
    } catch {
      setWords([]);
    }
  }, []);

  useEffect(() => {
    if (isOpen) loadWords();
  }, [isOpen, loadWords]);

  const persist = (updated: MasterVocabWord[]) => {
    setWords(updated);
    localStorage.setItem(MASTER_KEY, JSON.stringify(updated));
  };

  const handleToggleStar = (id: string | number) => {
    persist(words.map(w => w.id === id ? { ...w, starred: !w.starred } : w));
  };

  const handleDelete = (id: string | number) => {
    persist(words.filter(w => w.id !== id));
  };

  const filtered = words
    .filter(w => activeTab === 'all' || w.skill === activeTab)
    .filter(w => !showStarredOnly || w.starred)
    .filter(w =>
      w.en.toLowerCase().includes(search.toLowerCase()) ||
      w.vn.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      if (sortMode === 'alpha') return a.en.localeCompare(b.en);
      if (sortMode === 'starred') return (b.starred ? 1 : 0) - (a.starred ? 1 : 0);
      return 0; // newest
    });

  const countFor = (skill: SkillTab) =>
    skill === 'all' ? words.length : words.filter(w => w.skill === skill).length;
  const starredCount = words.filter(w => w.starred).length;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose}>
      <div
        className="bg-white w-full max-w-2xl max-h-[85vh] rounded-[32px] shadow-2xl flex flex-col overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        <div className="px-7 py-6 border-b border-slate-100 shrink-0 bg-white">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-200">
                  <BookMarked className="w-4 h-4 text-white" />
                </div>
                <h2 className="text-xl font-black text-slate-800">Từ vựng đã lưu</h2>
              </div>
              <p className="text-[13px] text-slate-400 font-medium ml-10">
                {words.length} từ đã học · {starredCount} từ quan trọng
              </p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
              <X className="w-5 h-5 text-slate-400" />
            </button>
          </div>

          <div className="flex items-center gap-2 mt-5 overflow-x-auto pb-1 scrollbar-none">
            {(Object.keys(SKILL_CONFIG) as SkillTab[]).map(skill => {
              const cfg = SKILL_CONFIG[skill];
              const count = countFor(skill);
              const isActive = activeTab === skill;
              if (count === 0 && skill !== 'all') return null;
              return (
                <button
                  key={skill}
                  onClick={() => setActiveTab(skill)}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[12px] font-black transition-all whitespace-nowrap shrink-0
                    ${isActive ? cfg.activeBg + ' shadow-md' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                >
                  {cfg.icon}
                  {cfg.label}
                  <span className={`ml-0.5 text-[10px] px-1.5 py-0.5 rounded-full font-black
                    ${isActive ? 'bg-white/20 text-white' : 'bg-white text-slate-500'}`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="px-7 py-3 flex items-center gap-3 border-b border-slate-50 shrink-0 bg-slate-50/50">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm từ vựng..."
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50 transition-all font-medium"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <button
            onClick={() => setShowStarredOnly(s => !s)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-[12px] font-black border transition-all
              ${showStarredOnly ? 'bg-amber-500 text-white border-amber-500 shadow-md' : 'bg-white border-slate-200 text-slate-500 hover:border-amber-300'}`}
          >
            <Star className={`w-3.5 h-3.5 ${showStarredOnly ? 'fill-current' : ''}`} />
            Quan trọng
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-7 py-4 space-y-3 custom-scrollbar bg-slate-50/30">
          {filtered.length === 0 ? (
            <div className="h-full min-h-[300px] flex flex-col items-center justify-center text-center gap-3">
              <Sparkles className="w-12 h-12 text-slate-200" />
              <p className="text-sm font-black text-slate-400">Không có từ nào phù hợp</p>
            </div>
          ) : (
            filtered.map(word => (
              <WordCard key={word.id} word={word} onToggleStar={handleToggleStar} onDelete={handleDelete} />
            ))
          )}
        </div>

        <div className="px-7 py-4 border-t border-slate-100 shrink-0 bg-white">
          <div className="flex items-center justify-between">
            <p className="text-[11px] text-slate-400 font-medium italic">
              * Toàn bộ từ vựng được tự động lưu từ quá trình luyện tập 4 kỹ năng của bạn.
            </p>
            <p className="text-[11px] text-slate-500 font-bold">
              {filtered.length} / {words.length} từ
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

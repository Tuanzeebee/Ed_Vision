import React, { useState, useEffect } from 'react';
import { X, Sparkles, Plus, Loader2, Volume2, Book, Bookmark } from 'lucide-react';

interface FloatingVocabCardProps {
  word: string;
  position: { x: number; y: number };
  onClose: () => void;
  onAdd: (wordData: any) => void;
  isAdded: boolean;
  context?: string;
  aiService: (word: string, context?: string) => Promise<any>;
}

const FloatingVocabCard: React.FC<FloatingVocabCardProps> = ({
  word,
  position,
  onClose,
  onAdd,
  isAdded,
  context,
  aiService,
}) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleSpeak = (text: string) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
  };

  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      setLoading(true);
      try {
        const result = await aiService(word, context);
        if (isMounted) {
          setData(result);
          setLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          setError('Không thể lấy thông tin từ vựng.');
          setLoading(false);
        }
      }
    };
    fetchData();
    return () => { isMounted = false; };
  }, [word, context]);

  // Adjust position to keep card within viewport
  const style: React.CSSProperties = {
    position: 'fixed',
    left: Math.min(position.x, window.innerWidth - 300),
    top: Math.min(position.y + 20, window.innerHeight - 300),
    zIndex: 1000,
  };

  return (
    <div 
      style={style}
      className="w-[280px] bg-white rounded-3xl shadow-2xl border border-blue-100 p-5 animate-in zoom-in-95 duration-200"
    >
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
            <Book className="w-4 h-4" />
          </div>
          <h4 className="text-lg font-black text-slate-800">{word}</h4>
          <button 
            onClick={() => handleSpeak(word)}
            className="p-1.5 hover:bg-slate-100 rounded-lg text-blue-600 transition-colors"
          >
            <Volume2 className="w-4 h-4" />
          </button>
        </div>
        <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-full transition-colors">
          <X className="w-4 h-4 text-slate-400" />
        </button>
      </div>

      {loading ? (
        <div className="py-8 flex flex-col items-center gap-2">
          <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Đang tra từ điển...</p>
        </div>
      ) : error ? (
        <p className="text-xs text-red-500 py-4 text-center">{error}</p>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {data.phonetic && (
              <button 
                onClick={() => handleSpeak(word)}
                className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 text-blue-600 rounded-lg text-[12px] font-bold hover:bg-blue-100 transition-colors"
              >
                <Volume2 className="w-3 h-3" />
                {data.phonetic}
              </button>
            )}
            <span className="px-2.5 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-[11px] font-black uppercase tracking-wider">
              {data.type}
            </span>
          </div>

          <div className="space-y-1">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Nghĩa tiếng Việt</p>
            <p className="text-sm font-bold text-slate-700 leading-relaxed">{data.vn}</p>
          </div>

          {data.example && (
            <div className="space-y-1">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Ví dụ ngữ cảnh</p>
              <p className="text-[13px] text-slate-500 italic border-l-2 border-blue-100 pl-3 py-0.5 leading-relaxed">
                "{data.example}"
              </p>
            </div>
          )}

          {!isAdded ? (
            <button
              onClick={() => onAdd(data)}
              className="w-full py-2.5 bg-blue-600 text-white rounded-xl text-[12px] font-black flex items-center justify-center gap-2 hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 active:scale-95"
            >
              <Plus className="w-4 h-4" />
              LƯU VÀO NOTE
            </button>
          ) : (
            <div className="flex items-center justify-center gap-2 py-2 text-emerald-600 font-black text-[12px] uppercase tracking-widest bg-emerald-50 rounded-xl border border-emerald-100">
               <Bookmark className="w-4 h-4 fill-current" />
               ĐÃ LƯU
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FloatingVocabCard;

import React, { useState, useEffect } from 'react';
import { 
  Search, Plus, Star, Trash2, Sparkles, Loader2, BookOpen, 
  ExternalLink, MessageSquare, ChevronRight, X, Save, Bookmark, Volume2
} from 'lucide-react';

export interface VocabWord {
  id: string | number;
  en: string;
  vn: string;
  type: string;
  source: 'ai' | 'user';
  starred: boolean;
  note: string;
  phonetic?: string;
  example?: string;
  created_at?: string;
}

interface IeltsVocabPanelProps {
  words: VocabWord[];
  onAddWord: (word: Omit<VocabWord, 'id' | 'created_at'>) => void;
  onDeleteWord: (id: string | number) => void;
  onToggleStar: (id: string | number) => void;
  onUpdateNote: (id: string | number, note: string) => void;
  onExtractAI: () => void;
  isExtracting: boolean;
}

const IeltsVocabPanel: React.FC<IeltsVocabPanelProps> = ({
  words,
  onAddWord,
  onDeleteWord,
  onToggleStar,
  onUpdateNote,
  onExtractAI,
  isExtracting,
}) => {
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | number | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newWord, setNewWord] = useState({ en: '', vn: '', type: 'noun', note: '' });
  const [tempNote, setTempNote] = useState('');
  const [showStarredOnly, setShowStarredOnly] = useState(false);

  const handleSpeak = (text: string) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
  };

  const selectedWord = words.find(w => w.id === selectedId);

  useEffect(() => {
    if (selectedWord) {
      setTempNote(selectedWord.note || '');
    }
  }, [selectedId, selectedWord]);

  const filteredWords = words.filter(w => {
    const matchesSearch = w.en.toLowerCase().includes(search.toLowerCase()) ||
                        w.vn.toLowerCase().includes(search.toLowerCase());
    const matchesStar = !showStarredOnly || w.starred;
    return matchesSearch && matchesStar;
  });

  const handleAdd = () => {
    if (!newWord.en.trim() || !newWord.vn.trim()) return;
    onAddWord({
      ...newWord,
      source: 'user',
      starred: false,
    });
    setNewWord({ en: '', vn: '', type: 'noun', note: '' });
    setShowAddModal(false);
  };

  const handleSaveNote = () => {
    if (selectedId) {
      onUpdateNote(selectedId, tempNote);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white overflow-hidden">
      {/* Search & Toolbar */}
      <div className="p-4 border-b border-slate-100 space-y-3">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm từ vựng..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50 transition-all"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <button 
            onClick={() => setShowStarredOnly(!showStarredOnly)}
            className={`w-10 h-10 flex items-center justify-center border rounded-xl transition-all shadow-sm ${
              showStarredOnly ? 'bg-amber-50 border-amber-300 text-amber-500' : 'bg-white border-slate-200 text-slate-400 hover:border-blue-400'
            }`}
            title="Lọc từ đã đánh dấu sao"
          >
            <Star className={`w-5 h-5 ${showStarredOnly ? 'fill-current' : ''}`} />
          </button>
          <button 
            onClick={() => setShowAddModal(true)}
            className="w-10 h-10 flex items-center justify-center bg-white border border-slate-200 rounded-xl hover:border-blue-400 hover:text-blue-600 transition-all shadow-sm"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>

        <button 
          onClick={onExtractAI}
          disabled={isExtracting}
          className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-[13px] font-bold flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-blue-600/20 active:scale-[0.98] transition-all disabled:opacity-70"
        >
          {isExtracting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          {isExtracting ? 'Đang trích xuất...' : 'AI Extract từ bài học'}
        </button>
      </div>

      {/* List Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
        {filteredWords.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center opacity-40 p-6">
            <BookOpen className="w-12 h-12 mb-3 text-slate-300" />
            <p className="text-sm font-bold text-slate-500">Chưa có từ vựng nào được lưu.</p>
          </div>
        ) : (
          filteredWords.map(word => (
            <div
              key={word.id}
              onClick={() => setSelectedId(word.id)}
              className={`group p-3 rounded-2xl border-2 transition-all cursor-pointer relative ${
                selectedId === word.id 
                  ? 'border-blue-500 bg-blue-50 shadow-md translate-x-1' 
                  : 'border-slate-50 bg-slate-50/50 hover:border-blue-200 hover:bg-white hover:translate-x-1'
              }`}
            >
              <div className="flex justify-between items-start mb-1">
                <span className="text-[15px] font-black text-slate-800">{word.en}</span>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleSpeak(word.en); }}
                    className="p-1.5 rounded-lg hover:bg-white text-slate-400 hover:text-blue-500 transition-colors"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); onToggleStar(word.id); }}
                    className={`p-1.5 rounded-lg hover:bg-white transition-colors ${word.starred ? 'text-amber-500' : 'text-slate-400'}`}
                  >
                    <Star className={`w-3.5 h-3.5 ${word.starred ? 'fill-current' : ''}`} />
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); onDeleteWord(word.id); }}
                    className="p-1.5 rounded-lg hover:bg-white text-slate-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <p className="text-[13px] text-slate-500 font-medium line-clamp-1">{word.vn}</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                <span className={`text-[10px] px-2 py-0.5 rounded-md font-black uppercase tracking-wider ${
                  word.source === 'ai' ? 'bg-indigo-100 text-indigo-600' : 'bg-emerald-100 text-emerald-600'
                }`}>
                  {word.source === 'ai' ? '✨ AI' : '👤 User'}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-md font-black uppercase tracking-wider bg-slate-200 text-slate-600">
                  {word.type}
                </span>
                {word.note && (
                   <span className="text-[10px] px-2 py-0.5 rounded-md font-black uppercase tracking-wider bg-amber-100 text-amber-600">
                    📝 Note
                   </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Detail Overlay / Panel */}
      {selectedWord && (
        <div className="border-t border-slate-100 bg-white p-4 space-y-4 animate-in slide-in-from-bottom-4 shadow-[0_-10px_30px_rgba(0,0,0,0.05)]">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-black text-slate-800 leading-none">{selectedWord.en}</h3>
                <button 
                  onClick={() => handleSpeak(selectedWord.en)}
                  className="p-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  <Volume2 className="w-4 h-4" />
                </button>
              </div>
              {selectedWord.phonetic && (
                <p className="text-[13px] font-medium text-blue-600 mt-1">{selectedWord.phonetic}</p>
              )}
            </div>
            <button onClick={() => setSelectedId(null)} className="p-1 hover:bg-slate-100 rounded-full transition-colors">
              <X className="w-5 h-5 text-slate-400" />
            </button>
          </div>
          
          <div className="space-y-4">
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1.5">Nghĩa & Từ loại</p>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] px-2 py-0.5 rounded-md font-black uppercase tracking-wider bg-indigo-100 text-indigo-600">
                  {selectedWord.type}
                </span>
                <span className={`text-[10px] px-2 py-0.5 rounded-md font-black uppercase tracking-wider ${
                  selectedWord.source === 'ai' ? 'bg-blue-100 text-blue-600' : 'bg-emerald-100 text-emerald-600'
                }`}>
                  {selectedWord.source === 'ai' ? '✨ AI' : '👤 User'}
                </span>
              </div>
              <p className="text-sm font-bold text-blue-900 bg-blue-50/50 px-3 py-2.5 rounded-xl border border-blue-100/50 leading-relaxed">
                {selectedWord.vn}
              </p>
            </div>

            {selectedWord.example && (
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1.5">Ví dụ</p>
                <p className="text-[13px] text-slate-600 italic border-l-2 border-blue-200 pl-3 py-1 font-medium leading-relaxed">
                  "{selectedWord.example}"
                </p>
              </div>
            )}
            
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1.5">Ghi chú cá nhân</p>
              <textarea 
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50 transition-all h-20 resize-none"
                placeholder="Thêm ghi chú riêng cho từ này..."
                value={tempNote}
                onChange={e => setTempNote(e.target.value)}
              />
              <button 
                onClick={handleSaveNote}
                className="mt-2 w-full py-2.5 bg-slate-800 text-white rounded-xl text-[12px] font-bold flex items-center justify-center gap-2 hover:bg-slate-900 transition-all active:scale-[0.98]"
              >
                <Save className="w-4 h-4" />
                Lưu ghi chú
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Thêm từ */}
      {showAddModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-md rounded-[32px] shadow-2xl overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200">
            <div className="px-8 py-6 border-b border-slate-50 flex items-center justify-between">
              <h2 className="text-xl font-black text-slate-800">Thêm từ vựng mới</h2>
              <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            
            <div className="p-8 space-y-5">
              <div className="space-y-2">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Từ tiếng Anh *</label>
                <input 
                  autoFocus
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50 transition-all"
                  placeholder="e.g. Resilience"
                  value={newWord.en}
                  onChange={e => setNewWord(prev => ({ ...prev, en: e.target.value }))}
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Nghĩa tiếng Việt *</label>
                <input 
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50 transition-all"
                  placeholder="e.g. Sức bền, sự phục hồi"
                  value={newWord.vn}
                  onChange={e => setNewWord(prev => ({ ...prev, vn: e.target.value }))}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Từ loại</label>
                  <select 
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:border-blue-400 transition-all cursor-pointer"
                    value={newWord.type}
                    onChange={e => setNewWord(prev => ({ ...prev, type: e.target.value }))}
                  >
                    <option value="noun">Noun</option>
                    <option value="verb">Verb</option>
                    <option value="adjective">Adjective</option>
                    <option value="adverb">Adverb</option>
                    <option value="phrase">Phrase</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="px-8 py-6 bg-slate-50 flex items-center justify-end gap-3">
              <button 
                onClick={() => setShowAddModal(false)}
                className="px-6 py-2.5 text-sm font-bold text-slate-500 hover:text-slate-800 transition-colors"
              >
                Hủy bỏ
              </button>
              <button 
                onClick={handleAdd}
                className="px-8 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 shadow-lg shadow-blue-600/20 active:scale-95 transition-all"
              >
                Thêm từ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default IeltsVocabPanel;

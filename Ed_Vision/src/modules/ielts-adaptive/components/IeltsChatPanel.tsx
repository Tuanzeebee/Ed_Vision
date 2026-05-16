import React, { useEffect, useRef } from 'react';
import { Send, Loader2, Sparkles } from 'lucide-react';
import type { IeltsChatMessage } from '@/services/api/certificateService';

interface IeltsChatPanelProps {
  skill: 'listening' | 'reading' | 'writing' | 'speaking';
  chatHistory: IeltsChatMessage[];
  chatMessage: string;
  isChatLoading: boolean;
  onSendMessage: (message: string) => void;
  onMessageChange: (value: string) => void;
  quickActions: { label: string; prompt: string }[];
}

const IeltsChatPanel: React.FC<IeltsChatPanelProps> = ({
  skill,
  chatHistory,
  chatMessage,
  isChatLoading,
  onSendMessage,
  onMessageChange,
  quickActions,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [chatHistory, isChatLoading]);

  const handleSend = () => {
    if (chatMessage.trim() && !isChatLoading) {
      onSendMessage(chatMessage.trim());
    }
  };

  return (
  <div className="flex flex-col h-full min-h-0 overflow-hidden bg-white">
      {/* Header */}
      <div className="flex items-center gap-2 p-4 border-b border-blue-50 bg-blue-50/20 shrink-0">
        <Sparkles className="w-4 h-4 text-blue-600" />
        <span className="text-xs font-black text-blue-900 uppercase tracking-widest">
          Trợ lý AI IELTS · {skill}
        </span>
      </div>

      {/* Chat Area */}
      <div
        ref={scrollRef}
        className="flex-1 min-h-0 overflow-y-auto p-4 space-y-3 scroll-smooth custom-scrollbar"
      >
        {chatHistory.length === 0 && !isChatLoading && (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3 opacity-60">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-xl">🧑‍🏫</div>
            <p className="text-sm font-bold text-slate-500">
              Chào bạn! Mình là trợ lý AI IELTS. <br /> Bạn có câu hỏi nào về phần này không?
            </p>
          </div>
        )}

        {chatHistory.map((msg, idx) => (
          <div
            key={idx}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] px-3 py-2.5 rounded-2xl text-[13px] font-medium leading-relaxed shadow-sm whitespace-pre-wrap break-words ${msg.role === 'user'
                ? 'bg-blue-600 text-white rounded-tr-sm'
                : 'bg-slate-100 text-slate-700 rounded-tl-sm'
                }`}
            >
              {msg.content}
            </div>
          </div>
        ))}

        {isChatLoading && (
          <div className="flex justify-start">
            <div className="bg-slate-100 p-3 rounded-2xl rounded-tl-sm flex gap-1 items-center">
              <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
              <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
              <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Footer */}
  <div className="p-4 border-t border-slate-100 space-y-3 bg-white shrink-0">
        {/* Quick Actions */}
        {quickActions.length > 0 && chatHistory.length < 2 && (
          <div className="flex flex-wrap gap-2">
            {quickActions.map((action, i) => (
              <button
                key={i}
                onClick={() => onSendMessage(action.prompt)}
                className="px-3 py-1.5 rounded-full border border-blue-100 bg-blue-50 text-[11px] font-bold text-blue-700 hover:bg-blue-600 hover:text-white transition-all active:scale-95"
              >
                {action.label}
              </button>
            ))}
          </div>
        )}

        {/* Input Area */}
        <div className="relative">
          <input
            type="text"
            value={chatMessage}
            onChange={(e) => onMessageChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSend();
            }}
            placeholder="Đặt câu hỏi cho trợ lý AI..."
            disabled={isChatLoading}
            className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-2xl py-3.5 pl-4 pr-12 focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-400 transition-all font-bold"
          />
          <button
            onClick={handleSend}
            disabled={!chatMessage.trim() || isChatLoading}
            className="absolute right-2 top-2 bottom-2 w-10 bg-blue-600 text-white rounded-xl flex items-center justify-center hover:bg-blue-700 disabled:bg-slate-300 disabled:scale-100 transition-all active:scale-90 shadow-lg shadow-blue-600/20"
          >
            {isChatLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default IeltsChatPanel;

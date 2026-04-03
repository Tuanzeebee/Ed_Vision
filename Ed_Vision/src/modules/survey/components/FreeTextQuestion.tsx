import { cn } from "@/lib/utils";
import { MessageSquare } from "lucide-react";

interface FreeTextQuestionProps {
  value?: string;
  onChange: (value: string) =>void;
  placeholder?: string;
  maxLength?: number;
  rows?: number;
  showCharCount?: boolean;
}

export default function FreeTextQuestion({
  value = "",
  onChange,
  placeholder = "Chia sẻ suy nghĩ của bạn... (không bắt buộc)",
  maxLength = 1000,
  rows = 4,
  showCharCount = true,
}: FreeTextQuestionProps) {
  return (
    <div className="bg-indigo-50/50 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-300 to-purple-300 flex items-center justify-center">
          <MessageSquare className="w-4 h-4 text-white"/>
        </div>
        <span className="text-xs font-medium text-gray-500">Câu trả lời tự do (không bắt buộc)</span>
      </div>
      <textarea
        value={value}
        onChange={(e) =>onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
        rows={rows}
        className={cn(
          "w-full p-4 border-2 border-gray-200 rounded-xl bg-white",
          "focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100",
          "transition-all duration-200 resize-none",
          "placeholder:text-gray-400 text-gray-700")}
      />
      {showCharCount && (
        <div className="flex justify-end mt-2">
          <span
            className={cn(
              "text-xs font-medium",
              value.length >maxLength * 0.9 ? "text-orange-500": "text-gray-400")}
          >
            {value.length}/{maxLength}
          </span>
        </div>)}
    </div>);
}

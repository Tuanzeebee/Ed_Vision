import { cn } from "@/lib/utils";
import { surveyStyles } from "./SurveyStyles";
import type { LikertConfig } from "../types/survey.types";

interface LikertOption {
  value: string;
  label: string;
}

interface LikertScaleQuestionProps {
  value?: string;
  onChange: (value: string) =>void;
  config?: LikertConfig;
  options?: LikertOption[]; // Options from API with optionId as value
}

export default function LikertScaleQuestion({
  value,
  onChange,
  config,
  options,
}: LikertScaleQuestionProps) {
  const leftLabel = config?.leftLabel ?? "Không đồng ý";
  const rightLabel = config?.rightLabel ?? "Đồng ý";

  // Use options from API if available, otherwise generate default scale
  const scaleOptions: LikertOption[] = options && options.length >0
    ? options
    : Array.from({ length: (config?.max ?? 5) - (config?.min ?? 1) + 1 }, (_, i) =>({
        value: String((config?.min ?? 1) + i),
        label: String((config?.min ?? 1) + i),
      }));

  return (
    <div className="bg-indigo-50/50 rounded-xl p-4">
      <div className="flex justify-between text-xs font-medium text-gray-600 mb-3">
        <span>{leftLabel}</span>
        <span>{rightLabel}</span>
      </div>
      <div className="flex gap-2 justify-center flex-wrap">
        {scaleOptions.map((opt, idx) =>(
          <button
            key={opt.value}
            onClick={() =>onChange(opt.value)}
            className={cn(
              surveyStyles.likertButton.base,
              value === opt.value && surveyStyles.likertButton.selected
            )}
            title={opt.label}
          >
            {idx + 1}
          </button>))}
      </div>
    </div>);
}

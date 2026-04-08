import { cn } from "@/lib/utils";
import { surveyStyles } from "./SurveyStyles";
import type { QuestionOption } from "../types/survey.types";

interface SingleChoiceQuestionProps {
  options: QuestionOption[];
  value?: string;
  onChange: (value: string) => void;
}

export default function SingleChoiceQuestion({
  options,
  value,
  onChange,
}: SingleChoiceQuestionProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
      {options.map((option) => (
        <button
          key={option.value}
          onClick={() => onChange(option.value)}
          className={cn(
            surveyStyles.choiceCard.base,
            value === option.value && surveyStyles.choiceCard.selected
          )}
        >
          <span
            className={cn(
              "text-sm font-medium",
              value === option.value ? "text-white" : "text-gray-700"
            )}
          >
            {option.label}
          </span>
        </button>
      ))}
    </div>
  );
}

import { cn } from "@/lib/utils";
import { surveyStyles } from "./SurveyStyles";
import type { QuestionOption } from "../types/survey.types";

interface MultipleChoiceQuestionProps {
  options: QuestionOption[];
  value?: string[];
  onChange: (value: string[]) =>void;
}

export default function MultipleChoiceQuestion({
  options,
  value = [],
  onChange,
}: MultipleChoiceQuestionProps) {
  const handleToggle = (optionValue: string) => {
    if (value.includes(optionValue)) {
      onChange(value.filter((v) =>v !== optionValue));
    } else {
      onChange([...value, optionValue]);
    }
  };

  return (
    <div className="space-y-2">
      {options.map((option) => {
        const isChecked = value.includes(option.value);
        return (
          <label
            key={option.value}
            className={cn(
              surveyStyles.checkboxLabel.base,
              isChecked
                ? surveyStyles.checkboxLabel.checked
                : surveyStyles.checkboxLabel.unchecked
            )}
          >
            <input
              type="checkbox"checked={isChecked}
              onChange={() =>handleToggle(option.value)}
              className={cn(surveyStyles.checkbox, "flex-shrink-0")}
            />
            <span className="ml-3 text-sm font-medium text-gray-700">
              {option.label}
            </span>
          </label>);
      })}
    </div>);
}

import { cn } from "@/lib/utils";
import { surveyStyles } from "./SurveyStyles";
import { Check, X } from "lucide-react";

interface YesNoQuestionProps {
  value?: string;
  onChange: (value: string) =>void;
  yesLabel?: string;
  noLabel?: string;
}

export default function YesNoQuestion({
  value,
  onChange,
  yesLabel = "Có",
  noLabel = "Không",
}: YesNoQuestionProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <button
        onClick={() =>onChange("yes")}
        className={cn(
          surveyStyles.choiceCard.base,
          "flex items-center justify-center gap-2 p-4",
          value === "yes"&& surveyStyles.choiceCard.selected
        )}
      >
        <div
          className={cn(
            "w-10 h-10 rounded-full flex items-center justify-center transition-all",
            value === "yes"? "bg-white/30": "bg-green-100")}
        >
          <Check
            className={cn(
              "w-5 h-5",
              value === "yes"? "text-white": "text-green-500")}
          />
        </div>
        <span
          className={cn(
            "text-base font-semibold",
            value === "yes"? "text-white": "text-gray-700")}
        >
          {yesLabel}
        </span>
      </button>

      <button
        onClick={() =>onChange("no")}
        className={cn(
          surveyStyles.choiceCard.base,
          "flex items-center justify-center gap-2 p-4",
          value === "no"&& surveyStyles.choiceCard.selected
        )}
      >
        <div
          className={cn(
            "w-10 h-10 rounded-full flex items-center justify-center transition-all",
            value === "no"? "bg-white/30": "bg-red-100")}
        >
          <X
            className={cn(
              "w-5 h-5",
              value === "no"? "text-white": "text-red-500")}
          />
        </div>
        <span
          className={cn(
            "text-base font-semibold",
            value === "no"? "text-white": "text-gray-700")}
        >
          {noLabel}
        </span>
      </button>
    </div>);
}

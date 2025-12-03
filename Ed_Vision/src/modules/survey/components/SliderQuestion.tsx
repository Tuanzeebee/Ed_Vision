import { cn } from "@/lib/utils";
import { surveyStyles, sliderGradients } from "./SurveyStyles";
import type { SliderConfig } from "../types/survey.types";

interface SliderQuestionProps {
  value?: number;
  onChange: (value: number) => void;
  config: SliderConfig;
}

export default function SliderQuestion({
  value,
  onChange,
  config,
}: SliderQuestionProps) {
  const currentValue = value ?? config.defaultValue;
  const gradientType = config.gradientType ?? "default";
  const gradient = sliderGradients[gradientType];

  return (
    <div className={cn("rounded-xl p-4", gradient.bg)}>
      <div className="text-center mb-4">
        <span className="text-3xl font-bold text-indigo-400">{currentValue}</span>
        <p className="text-xs text-gray-600 mt-1">{config.unit}</p>
      </div>
      <input
        type="range"
        min={config.min}
        max={config.max}
        step={config.step ?? 1}
        value={currentValue}
        onChange={(e) => onChange(Number(e.target.value))}
        className={cn(
          surveyStyles.slider.track,
          surveyStyles.slider.thumb,
          gradient.track
        )}
      />
      <div className="flex justify-between text-xs text-gray-600 mt-3">
        <span>{config.leftLabel}</span>
        <span>{config.rightLabel}</span>
      </div>
    </div>
  );
}

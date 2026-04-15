import type { Question, SurveyAnswers } from "../types/survey.types";
import SingleChoiceQuestion from "./SingleChoiceQuestion";
import MultipleChoiceQuestion from "./MultipleChoiceQuestion";
import LikertScaleQuestion from "./LikertScaleQuestion";
import SliderQuestion from "./SliderQuestion";
import YesNoQuestion from "./YesNoQuestion";
import FreeTextQuestion from "./FreeTextQuestion";

interface QuestionRendererProps {
  question: Question;
  answer: SurveyAnswers[keyof SurveyAnswers];
  onAnswerChange: (questionId: string | number, value: SurveyAnswers[keyof SurveyAnswers]) =>void;
}

/**
 * Component động để render câu hỏi dựa trên type
 * Sử dụng khi load câu hỏi từ DB
 */
export default function QuestionRenderer({
  question,
  answer,
  onAnswerChange,
}: QuestionRendererProps) {
  switch (question.type) {
    case "single-choice":
      return (
        <SingleChoiceQuestion
          options={question.options || []}
          value={answer as string}
          onChange={(value) =>onAnswerChange(question.id, value)}
        />);

    case "multiple-choice":
      return (
        <MultipleChoiceQuestion
          options={question.options || []}
          value={answer as string[]}
          onChange={(value) =>onAnswerChange(question.id, value)}
        />);

    case "likert":
      return (
        <LikertScaleQuestion
          value={answer as string}
          onChange={(value) =>onAnswerChange(question.id, value)}
          config={question.likertConfig}
          options={question.options}
        />);

    case "slider":
      if (!question.sliderConfig) {
        console.error("Slider question requires sliderConfig");
        return null;
      }
      return (
        <SliderQuestion
          value={answer as number}
          onChange={(value) =>onAnswerChange(question.id, value)}
          config={question.sliderConfig}
          minValue={question.min_value}
          maxValue={question.max_value}
        />);

    case "text":
      return (
        <input
          type="text"value={(answer as string) || ""}
          onChange={(e) =>onAnswerChange(question.id, e.target.value)}
          placeholder={question.placeholder || "Nhập câu trả lời..."}
          maxLength={question.maxLength}
          className="w-full p-3 border-2 border-gray-200 rounded-xl bg-white focus:border-indigo-400 focus:outline-none transition-colors"/>);

    case "textarea":
      return (
        <textarea
          value={(answer as string) || ""}
          onChange={(e) =>onAnswerChange(question.id, e.target.value)}
          placeholder={question.placeholder || "Nhập câu trả lời..."}
          maxLength={question.maxLength}
          rows={4}
          className="w-full p-3 border-2 border-gray-200 rounded-xl bg-white focus:border-indigo-400 focus:outline-none transition-colors resize-none"/>);

    case "yes-no":
      return (
        <YesNoQuestion
          value={answer as string}
          onChange={(value) =>onAnswerChange(question.id, value)}
          yesLabel={question.yesNoConfig?.yesLabel}
          noLabel={question.yesNoConfig?.noLabel}
        />);

    case "free-text":
      return (
        <FreeTextQuestion
          value={answer as string}
          onChange={(value) =>onAnswerChange(question.id, value)}
          placeholder={question.freeTextConfig?.placeholder}
          maxLength={question.freeTextConfig?.maxLength}
          rows={question.freeTextConfig?.rows}
          showCharCount={question.freeTextConfig?.showCharCount}
        />);

    default:
      console.warn(`Unknown question type: ${question.type}`);
      return null;
  }
}

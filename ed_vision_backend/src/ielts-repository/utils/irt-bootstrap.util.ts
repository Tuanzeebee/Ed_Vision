/**
 * irt-bootstrap.util.ts
 *
 * Computes initial IRT parameters from band range + question type.
 * AI then refines irt_b before the question is approved.
 * After ~50 real responses, the system re-calibrates.
 */

import { bandToTheta } from '../../placement/irt.engine';

export interface IrtBootstrap {
  irt_a: number; // Discrimination (0.5 – 2.5)
  irt_b: number; // Difficulty (theta scale)
  irt_c: number; // Guessing (0.0 – 0.35)
}

/**
 * Supported IELTS Question Types matching Parser outputs.
 */
export type QuestionType =
  | 'multiple_choice'
  | 'true_false_not_given'
  | 'yes_no_not_given'
  | 'matching_headings'
  | 'matching_information'
  | 'matching_features'
  | 'sentence_completion'
  | 'summary_completion'
  | 'note_completion'
  | 'table_completion'
  | 'flow_chart'
  | 'diagram_labelling'
  | 'short_answer'
  | 'part1'
  | 'part2'
  | 'part3'
  | 'task1'
  | 'task2';

const DISCRIMINATION_MAP: Record<string, number> = {
  multiple_choice: 1.2,
  true_false_not_given: 0.9,
  yes_no_not_given: 0.9,
  matching_headings: 1.4,
  matching_information: 1.3,
  matching_features: 1.3,
  sentence_completion: 1.5,
  summary_completion: 1.4,
  note_completion: 1.4,
  table_completion: 1.4,
  flow_chart: 1.4,
  diagram_labelling: 1.3,
  short_answer: 1.4,
  part1: 1.0,
  part2: 1.0,
  part3: 1.0,
  task1: 1.0,
  task2: 1.0,
};

const GUESSING_MAP: Record<string, number> = {
  multiple_choice: 0.25,
  true_false_not_given: 0.33,
  yes_no_not_given: 0.33,
  matching_headings: 0.1,
  matching_information: 0.1,
  matching_features: 0.1,
  sentence_completion: 0.0,
  summary_completion: 0.0,
  note_completion: 0.0,
  table_completion: 0.0,
  flow_chart: 0.0,
  diagram_labelling: 0.0,
  short_answer: 0.0,
  part1: 0.0,
  part2: 0.0,
  part3: 0.0,
  task1: 0.0,
  task2: 0.0,
};

export function bootstrapIrt(
  targetBand: number,
  questionType: string,
): IrtBootstrap {
  // Use midpoint of the band for initial theta
  const irt_b = parseFloat(bandToTheta(targetBand).toFixed(3));
  const irt_a = parseFloat((DISCRIMINATION_MAP[questionType] ?? 1.0).toFixed(3));
  const irt_c = parseFloat((GUESSING_MAP[questionType] ?? 0.0).toFixed(3));

  return { irt_a, irt_b, irt_c };
}

export function clampIrtB(b: number): number {
  return Math.max(-3.5, Math.min(3.5, b));
}
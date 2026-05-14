/**
 * Writing Parser
 * Extracts Task 1 and Task 2 prompts from IELTS Writing DOCX/text content.
 */

export interface ParsedWritingTask {
  taskType: 'task1' | 'task2';
  questionText: string;
  chartDescription?: string;
}

export interface WritingParseResult {
  tasks: ParsedWritingTask[];
}

function cleanPrompt(lines: string[]): string {
  return lines.join(' ').replace(/\s{2,}/g, ' ').trim();
}

function extractChartDescription(lines: string[]): {
  description?: string;
  remaining: string[];
} {
  const descLines: string[] = [];
  const remaining: string[] = [];
  let inBracket = false;

  for (const line of lines) {
    if (line.startsWith('[')) inBracket = true;
    if (inBracket) {
      descLines.push(line.replace(/[[\]]/g, '').trim());
      if (line.endsWith(']')) inBracket = false;
    } else {
      remaining.push(line);
    }
  }

  return {
    description: descLines.length ? descLines.join(' ').trim() : undefined,
    remaining,
  };
}

export function parseWritingContent(rawText: string): WritingParseResult {
  const lines = rawText.split('\n').map((l) => l.trim()).filter(Boolean);
  const tasks: ParsedWritingTask[] = [];
  let currentTask: 'task1' | 'task2' | null = null;
  let taskLines: string[] = [];

  const flushTask = () => {
    if (!currentTask || !taskLines.length) return;
    if (currentTask === 'task1') {
      const { description, remaining } = extractChartDescription(taskLines);
      tasks.push({ taskType: 'task1', questionText: cleanPrompt(remaining), chartDescription: description });
    } else {
      tasks.push({ taskType: 'task2', questionText: cleanPrompt(taskLines) });
    }
    taskLines = [];
  };

  for (const line of lines) {
    if (/WRITING\s+TASK\s+1/i.test(line) || /^TASK\s+1/i.test(line)) { flushTask(); currentTask = 'task1'; continue; }
    if (/WRITING\s+TASK\s+2/i.test(line) || /^TASK\s+2/i.test(line)) { flushTask(); currentTask = 'task2'; continue; }
    if (currentTask) {
      if (/^(Write|You should|Spend|Give reasons|In your answer)/i.test(line)) continue;
      taskLines.push(line);
    }
  }
  flushTask();
  return { tasks };
}

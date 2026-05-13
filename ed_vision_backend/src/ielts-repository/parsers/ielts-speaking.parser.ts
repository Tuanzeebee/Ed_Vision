/**
 * Speaking Parser
 * Extracts Part 1 / Part 2 / Part 3 questions from IELTS Speaking DOCX/text.
 */

export interface ParsedSpeakingQuestion {
  questionNumber: number;
  questionText: string;
  questionType: 'part1' | 'part2' | 'part3';
  topic?: string;
}

export interface SpeakingParseResult {
  questions: ParsedSpeakingQuestion[];
  part2Cue?: string;
  part2Topic?: string;
}

export function parseSpeakingContent(rawText: string): SpeakingParseResult {
  const lines = rawText.split('\n').map((l) => l.trim()).filter(Boolean);
  const questions: ParsedSpeakingQuestion[] = [];

  let currentPart: 'part1' | 'part2' | 'part3' | null = null;
  let currentTopic = '';
  let questionCounter = 0;
  let part2Lines: string[] = [];
  let part2Cue: string | undefined;
  let part2Topic: string | undefined;
  let inPart2CueCard = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // ── Part heading
    if (/^PART\s+1/i.test(line)) { currentPart = 'part1'; questionCounter = 0; continue; }
    if (/^PART\s+2/i.test(line)) { currentPart = 'part2'; inPart2CueCard = true; continue; }
    if (/^PART\s+3/i.test(line)) {
      if (part2Lines.length) {
        part2Cue = part2Lines.join(' ').trim();
        questions.push({ questionNumber: 1, questionText: part2Cue, questionType: 'part2', topic: part2Topic });
        part2Lines = [];
      }
      inPart2CueCard = false;
      currentPart = 'part3';
      questionCounter = 0;
      continue;
    }

    if (!currentPart) continue;

    // ── Topic line (Part 1)
    if (currentPart === 'part1' && /^Topic\s*:/i.test(line)) {
      currentTopic = line.replace(/^Topic\s*:\s*/i, '').trim();
      continue;
    }

    // ── Part 2 cue card accumulation
    if (currentPart === 'part2' && inPart2CueCard) {
      if (!part2Topic && /^Describe/i.test(line)) {
        part2Topic = line.replace(/^Describe\s+/i, '').replace(/\.$/, '').trim();
      }
      part2Lines.push(line);
      continue;
    }

    // ── Numbered question (Part 1 and Part 3)
    const qMatch = line.match(/^(\d+)\s*[.)]\s*(.+)/);
    if (qMatch && (currentPart === 'part1' || currentPart === 'part3')) {
      questionCounter++;
      questions.push({ questionNumber: questionCounter, questionText: qMatch[2], questionType: currentPart, topic: currentTopic || undefined });
      continue;
    }

    // ── Unnumbered question lines
    if ((currentPart === 'part1' || currentPart === 'part3') && line.endsWith('?') && !/^(PART|Topic)/i.test(line)) {
      questionCounter++;
      questions.push({ questionNumber: questionCounter, questionText: line, questionType: currentPart, topic: currentTopic || undefined });
    }
  }

  // Flush Part 2 if document ends without Part 3
  if (currentPart === 'part2' && part2Lines.length) {
    part2Cue = part2Lines.join(' ').trim();
    questions.push({ questionNumber: 1, questionText: part2Cue, questionType: 'part2', topic: part2Topic });
  }

  return { questions, part2Cue, part2Topic };
}

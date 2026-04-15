// D:\Ed_Vision\Ed_Vision\src\modules\student\ToeicExamSimulationPage.tsx
import { useState, useEffect, useMemo, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Lock,
  Clock,
  CheckCircle2,
  XCircle,
  Trophy,
  Headphones,
  BookOpen,
  ChevronRight,
  RotateCcw,
  AlertTriangle,
  Map,
} from "lucide-react";
import Header from "../../components/layout/Header";
import Footer from "../../components/layout/Footer";
import { useToeicScrollReset } from "../../hooks/useToeicScrollReset";

// ── Types ──────────────────────────────────────────────────────────────────
interface LearningMapState {
  listening: {
    unlockedUpTo: number;
    completedNodes: number[];
    nodeScores: number[];
  };
  reading: {
    unlockedUpTo: number;
    completedNodes: number[];
    nodeScores: number[];
  };
}

interface ExamQuestion {
  id: string;
  part: number;
  partName: string;
  context?: string;
  question: string;
  options: { key: "A" | "B" | "C" | "D"; text: string }[];
  correctAnswer: "A" | "B" | "C" | "D";
  explanation: string;
  imageDescription?: string;
}

interface ExamResult {
  examType: "listening" | "reading";
  score: number;
  correctCount: number;
  totalCount: number;
  completedAt: string;
}

type ExamPhase = "intro" | "exam" | "summary";

// ── Constants ──────────────────────────────────────────────────────────────
const MAP_STORAGE_KEY = "edvision.toeic.learningmap.v1";
const RESULTS_STORAGE_KEY = "edvision.toeic.exam.results.v1";

// ── Listening Questions ────────────────────────────────────────────────────
const LISTENING_QUESTIONS: ExamQuestion[] = [
  // Part 1 - Photographs
  {
    id: "L1",
    part: 1,
    partName: "Part 1 – Photographs",
    imageDescription: "A woman is writing on a whiteboard in a meeting room.",
    context: "[Image: A woman is writing on a whiteboard in a meeting room.]",
    question: "What is the woman doing?",
    options: [
      { key: "A", text: "She is reading a book." },
      { key: "B", text: "She is writing on a whiteboard." },
      { key: "C", text: "She is presenting to a large audience." },
      { key: "D", text: "She is erasing the board." },
    ],
    correctAnswer: "B",
    explanation: "The image shows a woman actively writing on a whiteboard.",
  },
  {
    id: "L2",
    part: 1,
    partName: "Part 1 – Photographs",
    imageDescription:
      "Several people are seated around a conference table with laptops open.",
    context:
      "[Image: Several people are seated around a conference table with laptops open.]",
    question: "What can be seen in the picture?",
    options: [
      { key: "A", text: "People are standing in a hallway." },
      { key: "B", text: "Workers are eating lunch." },
      { key: "C", text: "People are in a meeting with laptops." },
      { key: "D", text: "Employees are exercising." },
    ],
    correctAnswer: "C",
    explanation:
      "The image shows people seated at a conference table with laptops — classic meeting scene.",
  },
  {
    id: "L3",
    part: 1,
    partName: "Part 1 – Photographs",
    imageDescription:
      "A man is talking on the phone while standing near a window.",
    context:
      "[Image: A man is talking on the phone while standing near a window.]",
    question: "What is the man doing?",
    options: [
      { key: "A", text: "He is looking out the window silently." },
      { key: "B", text: "He is making a phone call near a window." },
      { key: "C", text: "He is opening the window." },
      { key: "D", text: "He is waving to someone outside." },
    ],
    correctAnswer: "B",
    explanation:
      "'Talking on the phone while standing near a window' clearly matches option B.",
  },
  {
    id: "L4",
    part: 1,
    partName: "Part 1 – Photographs",
    imageDescription: "Boxes are stacked neatly on shelves in a warehouse.",
    context: "[Image: Boxes are stacked neatly on shelves in a warehouse.]",
    question: "What is shown in the photograph?",
    options: [
      { key: "A", text: "Products displayed in a shop." },
      { key: "B", text: "Empty shelves in a storage room." },
      { key: "C", text: "Boxes organized on warehouse shelves." },
      { key: "D", text: "Workers packing boxes." },
    ],
    correctAnswer: "C",
    explanation: "'Boxes stacked neatly on shelves in a warehouse' = C.",
  },
  {
    id: "L5",
    part: 1,
    partName: "Part 1 – Photographs",
    imageDescription:
      "A receptionist is handing documents to a visitor at a front desk.",
    context:
      "[Image: A receptionist is handing documents to a visitor at a front desk.]",
    question: "What is happening at the front desk?",
    options: [
      { key: "A", text: "The receptionist is making a phone call." },
      { key: "B", text: "Documents are being handed to a visitor." },
      { key: "C", text: "The visitor is signing a contract." },
      { key: "D", text: "The receptionist is away from the desk." },
    ],
    correctAnswer: "B",
    explanation: "'Handing documents to a visitor' matches B exactly.",
  },
  // Part 2 - Question-Response
  {
    id: "L6",
    part: 2,
    partName: "Part 2 – Question-Response",
    context: '🎧 Audio: "Could you tell me where the nearest ATM is?"',
    question: "Could you tell me where the nearest ATM is?",
    options: [
      { key: "A", text: "Yes, I went there yesterday." },
      { key: "B", text: "It's on the second floor, near the elevator." },
      { key: "C", text: "The bank closes at 5 PM." },
      { key: "D", text: "I don't have an account there." },
    ],
    correctAnswer: "B",
    explanation: 'Direct response to "where" question provides location.',
  },
  {
    id: "L7",
    part: 2,
    partName: "Part 2 – Question-Response",
    context: '🎧 Audio: "When does the presentation start?"',
    question: "When does the presentation start?",
    options: [
      { key: "A", text: "In the main conference room." },
      { key: "B", text: "About thirty minutes ago." },
      { key: "C", text: "At two o'clock this afternoon." },
      { key: "D", text: "It's a quarterly review." },
    ],
    correctAnswer: "C",
    explanation:
      '"When" question requires a time answer — C gives a specific time.',
  },
  {
    id: "L8",
    part: 2,
    partName: "Part 2 – Question-Response",
    context: '🎧 Audio: "Would you like me to make a copy of this document?"',
    question: "Would you like me to make a copy of this document?",
    options: [
      { key: "A", text: "The copier is on the third floor." },
      { key: "B", text: "Yes, please make two copies." },
      { key: "C", text: "I already filed it." },
      { key: "D", text: "The document is confidential." },
    ],
    correctAnswer: "B",
    explanation:
      "Polite request → appropriate acceptance with specific instruction.",
  },
  {
    id: "L9",
    part: 2,
    partName: "Part 2 – Question-Response",
    context: '🎧 Audio: "Has the shipment arrived yet?"',
    question: "Has the shipment arrived yet?",
    options: [
      { key: "A", text: "Yes, it came this morning." },
      { key: "B", text: "The shipping cost was high." },
      { key: "C", text: "I'll send it tomorrow." },
      { key: "D", text: "The warehouse is full." },
    ],
    correctAnswer: "A",
    explanation:
      "Yes/No question about arrival status — A gives direct answer.",
  },
  {
    id: "L10",
    part: 2,
    partName: "Part 2 – Question-Response",
    context: '🎧 Audio: "Who is responsible for approving travel expenses?"',
    question: "Who is responsible for approving travel expenses?",
    options: [
      { key: "A", text: "The travel agency handles bookings." },
      { key: "B", text: "Expenses are submitted online." },
      { key: "C", text: "The finance manager approves them." },
      { key: "D", text: "Receipts must be kept." },
    ],
    correctAnswer: "C",
    explanation: '"Who" question → answer names the responsible person/role.',
  },
  // Part 3 - Conversations
  {
    id: "L11",
    part: 3,
    partName: "Part 3 – Conversations",
    context:
      "🎧 Conversation:\nM: I need to reschedule our meeting for next week.\nW: That works for me. Which day were you thinking?\nM: How about Wednesday at 3 PM?\nW: Perfect, I'll update the calendar.",
    question: "What are they doing?",
    options: [
      { key: "A", text: "Canceling a meeting." },
      { key: "B", text: "Rescheduling a meeting to Wednesday 3 PM." },
      { key: "C", text: "Planning a new project." },
      { key: "D", text: "Discussing the agenda." },
    ],
    correctAnswer: "B",
    explanation: "They agree to reschedule to Wednesday at 3 PM.",
  },
  {
    id: "L12",
    part: 3,
    partName: "Part 3 – Conversations",
    context:
      "🎧 Conversation:\nW: The printer isn't working again.\nM: Did you try restarting it?\nW: Yes, but it still gives an error.\nM: I'll call IT support.",
    question: "What will the man do?",
    options: [
      { key: "A", text: "Fix the printer himself." },
      { key: "B", text: "Buy a new printer." },
      { key: "C", text: "Contact IT support." },
      { key: "D", text: "Restart the computer." },
    ],
    correctAnswer: "C",
    explanation: '"I\'ll call IT support" — the man will contact IT.',
  },
  {
    id: "L13",
    part: 3,
    partName: "Part 3 – Conversations",
    context:
      "🎧 Conversation:\nM: Your package arrived this morning.\nW: Great! Is it at the reception desk?\nM: Yes, you'll need to sign for it.",
    question: "Where is the package?",
    options: [
      { key: "A", text: "In the mail room." },
      { key: "B", text: "At the reception desk." },
      { key: "C", text: "In the woman's office." },
      { key: "D", text: "It hasn't arrived yet." },
    ],
    correctAnswer: "B",
    explanation:
      '"Is it at the reception desk? Yes" — the package is at reception.',
  },
  {
    id: "L14",
    part: 3,
    partName: "Part 3 – Conversations",
    context:
      "🎧 Conversation:\nW: The quarterly report is due Friday.\nM: I know, but I'm waiting for the sales figures from the regional offices.\nW: Can you estimate them for now?\nM: I'll try, but I'd rather have accurate data.",
    question: "What is the man's problem?",
    options: [
      { key: "A", text: "He doesn't understand the report format." },
      { key: "B", text: "He is waiting for data from regional offices." },
      { key: "C", text: "The deadline has already passed." },
      { key: "D", text: "He hasn't started the report." },
    ],
    correctAnswer: "B",
    explanation:
      'Man says "I\'m waiting for the sales figures from the regional offices."',
  },
  {
    id: "L15",
    part: 3,
    partName: "Part 3 – Conversations",
    context:
      "🎧 Conversation:\nM: How many people are registered for the workshop?\nW: About 45, but we can accommodate up to 60.\nM: Good, we have some last-minute sign-ups.",
    question: "How many people can the venue accommodate?",
    options: [
      { key: "A", text: "45 people." },
      { key: "B", text: "55 people." },
      { key: "C", text: "60 people." },
      { key: "D", text: "65 people." },
    ],
    correctAnswer: "C",
    explanation: '"We can accommodate up to 60" — capacity is 60.',
  },
  // Part 4 - Short Talks
  {
    id: "L16",
    part: 4,
    partName: "Part 4 – Short Talks",
    context:
      '🎧 Announcement: "Attention shoppers, our store will be closing in 30 minutes. Please bring your final purchases to the checkout counter. Our store hours are Monday through Saturday, 9 AM to 9 PM."',
    question: "What time does the store close on weekdays?",
    options: [
      { key: "A", text: "8 PM." },
      { key: "B", text: "9 PM." },
      { key: "C", text: "10 PM." },
      { key: "D", text: "In 30 minutes." },
    ],
    correctAnswer: "B",
    explanation: '"9 AM to 9 PM" — closes at 9 PM on weekdays (Mon–Sat).',
  },
  {
    id: "L17",
    part: 4,
    partName: "Part 4 – Short Talks",
    context:
      '🎧 Announcement: "This is a reminder that the parking lot behind building C will be closed for repaving next Tuesday. Employees should use the overflow parking area on Oak Street during this time."',
    question: "Why will the parking lot be closed?",
    options: [
      { key: "A", text: "For a special event." },
      { key: "B", text: "Due to security concerns." },
      { key: "C", text: "For repaving work." },
      { key: "D", text: "Because it's full." },
    ],
    correctAnswer: "C",
    explanation: '"Closed for repaving" — maintenance/repaving is the reason.',
  },
  {
    id: "L18",
    part: 4,
    partName: "Part 4 – Short Talks",
    context:
      '🎧 Announcement: "Welcome to Greenfield Hotel. We hope you enjoy your stay. Our breakfast buffet is served from 6:30 to 10 AM in the Garden Restaurant on the ground floor. Room service is available 24 hours."',
    question: "Where is the breakfast buffet served?",
    options: [
      { key: "A", text: "On the second floor." },
      { key: "B", text: "In the main lobby." },
      { key: "C", text: "In the Garden Restaurant on the ground floor." },
      { key: "D", text: "In the guest rooms." },
    ],
    correctAnswer: "C",
    explanation:
      '"Garden Restaurant on the ground floor" — specific location given.',
  },
  {
    id: "L19",
    part: 4,
    partName: "Part 4 – Short Talks",
    context:
      '🎧 Announcement: "Thank you for calling Metro Bank. Our offices are currently closed. Our regular hours are Monday through Friday, 8 AM to 6 PM, and Saturday 9 AM to 1 PM. For urgent assistance, please press 1."',
    question: "What can customers do for urgent help?",
    options: [
      { key: "A", text: "Call back during business hours." },
      { key: "B", text: "Visit the nearest branch." },
      { key: "C", text: "Send an email." },
      { key: "D", text: "Press 1." },
    ],
    correctAnswer: "D",
    explanation: '"For urgent assistance, please press 1."',
  },
  {
    id: "L20",
    part: 4,
    partName: "Part 4 – Short Talks",
    context:
      '🎧 Announcement: "Our annual company picnic will be held on Saturday, June 15th at Riverside Park. The event begins at 11 AM and includes games, food, and a raffle. All employees and their families are welcome."',
    question: "Who is invited to the company picnic?",
    options: [
      { key: "A", text: "Only management staff." },
      { key: "B", text: "Employees only." },
      { key: "C", text: "Employees and their families." },
      { key: "D", text: "Customers and partners." },
    ],
    correctAnswer: "C",
    explanation: '"All employees and their families are welcome."',
  },
];

// ── Reading Questions ──────────────────────────────────────────────────────
const PART7_PASSAGE = `JOB ADVERTISEMENT

Marketing Coordinator
Greenfields Technology, Ho Chi Minh City

Greenfields Technology is looking for a motivated Marketing Coordinator to join our growing team.

Responsibilities:
• Develop and implement marketing campaigns
• Manage social media accounts
• Coordinate with vendors and agencies
• Prepare monthly performance reports

Requirements:
• Bachelor's degree in Marketing or related field
• Minimum 2 years of experience
• Proficient in Microsoft Office and Adobe Suite
• Excellent communication skills
• Fluent in English and Vietnamese

Salary: Competitive, based on experience
To apply: Send resume and cover letter to careers@greenfields.com by March 31.

Only shortlisted candidates will be contacted.`;

const PART6_PASSAGE = `To: All Department Heads
From: Operations Manager
Subject: New Office Equipment

I am pleased to [Q6] that new computers and monitors will be installed in all offices next week. The IT department will [Q7] the installation process. Please [Q8] your team to clear their desks by Monday morning. The upgrade is expected to significantly [Q9] productivity across all departments. If you have any questions, please do not [Q10] to contact me.`;

const READING_QUESTIONS: ExamQuestion[] = [
  // Part 5 - Incomplete Sentences
  {
    id: "R1",
    part: 5,
    partName: "Part 5 – Incomplete Sentences",
    context: "Choose the word or phrase that best completes the sentence.",
    question: "The annual conference _____ held in Singapore next March.",
    options: [
      { key: "A", text: "are" },
      { key: "B", text: "will be" },
      { key: "C", text: "has been" },
      { key: "D", text: "were" },
    ],
    correctAnswer: "B",
    explanation:
      "Future passive: will be + V3. The event is scheduled for the future.",
  },
  {
    id: "R2",
    part: 5,
    partName: "Part 5 – Incomplete Sentences",
    context: "Choose the word or phrase that best completes the sentence.",
    question: "Please ensure that all documents _____ before the deadline.",
    options: [
      { key: "A", text: "submit" },
      { key: "B", text: "submits" },
      { key: "C", text: "are submitted" },
      { key: "D", text: "will submit" },
    ],
    correctAnswer: "C",
    explanation: "Present passive for instructions: are + V3.",
  },
  {
    id: "R3",
    part: 5,
    partName: "Part 5 – Incomplete Sentences",
    context: "Choose the word or phrase that best completes the sentence.",
    question:
      "Despite _____ hard, the team couldn't finish the project on time.",
    options: [
      { key: "A", text: "work" },
      { key: "B", text: "works" },
      { key: "C", text: "worked" },
      { key: "D", text: "working" },
    ],
    correctAnswer: "D",
    explanation: "Despite + V-ing (gerund). 'Despite working hard...'",
  },
  {
    id: "R4",
    part: 5,
    partName: "Part 5 – Incomplete Sentences",
    context: "Choose the word or phrase that best completes the sentence.",
    question:
      "The manager asked all employees _____ the new safety guidelines.",
    options: [
      { key: "A", text: "follow" },
      { key: "B", text: "to follow" },
      { key: "C", text: "following" },
      { key: "D", text: "followed" },
    ],
    correctAnswer: "B",
    explanation: 'ask + object + to-infinitive: "asked employees TO follow"',
  },
  {
    id: "R5",
    part: 5,
    partName: "Part 5 – Incomplete Sentences",
    context: "Choose the word or phrase that best completes the sentence.",
    question: "The new product line was received _____ by customers.",
    options: [
      { key: "A", text: "positive" },
      { key: "B", text: "positively" },
      { key: "C", text: "more positive" },
      { key: "D", text: "most positive" },
    ],
    correctAnswer: "B",
    explanation:
      "Adverb needed to modify the verb 'received'. 'Positively' is the adverb form.",
  },
  // Part 6 - Text Completion
  {
    id: "R6",
    part: 6,
    partName: "Part 6 – Text Completion",
    context: PART6_PASSAGE,
    question:
      "I am pleased to _____ that new computers and monitors will be installed...",
    options: [
      { key: "A", text: "say" },
      { key: "B", text: "announce" },
      { key: "C", text: "tell" },
      { key: "D", text: "speak" },
    ],
    correctAnswer: "B",
    explanation:
      '"Pleased to announce" is a fixed business English expression for formal notifications.',
  },
  {
    id: "R7",
    part: 6,
    partName: "Part 6 – Text Completion",
    context: PART6_PASSAGE,
    question: "The IT department will _____ the installation process.",
    options: [
      { key: "A", text: "oversee" },
      { key: "B", text: "look" },
      { key: "C", text: "watch" },
      { key: "D", text: "manage over" },
    ],
    correctAnswer: "A",
    explanation:
      '"Oversee" = supervise/manage = the correct verb for managing a process.',
  },
  {
    id: "R8",
    part: 6,
    partName: "Part 6 – Text Completion",
    context: PART6_PASSAGE,
    question: "Please _____ your team to clear their desks by Monday morning.",
    options: [
      { key: "A", text: "say" },
      { key: "B", text: "tell" },
      { key: "C", text: "speak" },
      { key: "D", text: "advise" },
    ],
    correctAnswer: "D",
    explanation: '"Advise your team to do something" — formal business usage.',
  },
  {
    id: "R9",
    part: 6,
    partName: "Part 6 – Text Completion",
    context: PART6_PASSAGE,
    question:
      "The upgrade is expected to significantly _____ productivity across all departments.",
    options: [
      { key: "A", text: "increase" },
      { key: "B", text: "growing" },
      { key: "C", text: "grown" },
      { key: "D", text: "raises" },
    ],
    correctAnswer: "A",
    explanation:
      'Base verb after "to" in infinitive. "To increase productivity."',
  },
  {
    id: "R10",
    part: 6,
    partName: "Part 6 – Text Completion",
    context: PART6_PASSAGE,
    question: "Please do not _____ to contact me.",
    options: [
      { key: "A", text: "think" },
      { key: "B", text: "hesitate" },
      { key: "C", text: "consider" },
      { key: "D", text: "worry" },
    ],
    correctAnswer: "B",
    explanation:
      'Fixed phrase: "do not hesitate to contact" — standard business closing.',
  },
  // Part 7 - Reading Comprehension
  {
    id: "R11",
    part: 7,
    partName: "Part 7 – Reading Comprehension",
    context: PART7_PASSAGE,
    question: "What position is being advertised?",
    options: [
      { key: "A", text: "Marketing Manager." },
      { key: "B", text: "Marketing Coordinator." },
      { key: "C", text: "Sales Representative." },
      { key: "D", text: "Social Media Manager." },
    ],
    correctAnswer: "B",
    explanation: 'The job title is clearly stated as "Marketing Coordinator."',
  },
  {
    id: "R12",
    part: 7,
    partName: "Part 7 – Reading Comprehension",
    context: PART7_PASSAGE,
    question: "What is one of the job responsibilities?",
    options: [
      { key: "A", text: "Hiring new employees." },
      { key: "B", text: "Managing the company budget." },
      { key: "C", text: "Preparing monthly performance reports." },
      { key: "D", text: "Teaching marketing courses." },
    ],
    correctAnswer: "C",
    explanation:
      '"Prepare monthly performance reports" is listed under Responsibilities.',
  },
  {
    id: "R13",
    part: 7,
    partName: "Part 7 – Reading Comprehension",
    context: PART7_PASSAGE,
    question: "How many years of experience are required?",
    options: [
      { key: "A", text: "At least 1 year." },
      { key: "B", text: "At least 2 years." },
      { key: "C", text: "At least 3 years." },
      { key: "D", text: "No experience required." },
    ],
    correctAnswer: "B",
    explanation: '"Minimum 2 years of experience" is stated in Requirements.',
  },
  {
    id: "R14",
    part: 7,
    partName: "Part 7 – Reading Comprehension",
    context: PART7_PASSAGE,
    question: "What should applicants send to apply?",
    options: [
      { key: "A", text: "Only a resume." },
      { key: "B", text: "A resume and cover letter." },
      { key: "C", text: "A portfolio and references." },
      { key: "D", text: "A completed application form." },
    ],
    correctAnswer: "B",
    explanation: '"Send resume and cover letter to careers@greenfields.com"',
  },
  {
    id: "R15",
    part: 7,
    partName: "Part 7 – Reading Comprehension",
    context: PART7_PASSAGE,
    question: "What does 'shortlisted' most likely mean?",
    options: [
      { key: "A", text: "Rejected from consideration." },
      { key: "B", text: "Added to a waiting list." },
      { key: "C", text: "Selected for further consideration." },
      { key: "D", text: "Offered the position immediately." },
    ],
    correctAnswer: "C",
    explanation:
      '"Shortlisted" means selected as one of the best candidates to move forward in the hiring process.',
  },
];

// ── Helper: Part info ──────────────────────────────────────────────────────
interface PartInfo {
  part: number;
  partName: string;
  description: string;
  questionCount: number;
  startIndex: number;
}

function getPartsInfo(questions: ExamQuestion[]): PartInfo[] {
  const partsMap: Record<number, PartInfo> = {};
  questions.forEach((q, idx) => {
    if (!partsMap[q.part]) {
      partsMap[q.part] = {
        part: q.part,
        partName: q.partName,
        description: getPartDescription(q.part),
        questionCount: 0,
        startIndex: idx,
      };
    }
    partsMap[q.part].questionCount++;
  });
  return Object.values(partsMap);
}

function getPartDescription(part: number): string {
  const desc: Record<number, string> = {
    1: "Nhìn ảnh và chọn mô tả đúng nhất.",
    2: "Nghe câu hỏi và chọn câu trả lời phù hợp nhất.",
    3: "Nghe đoạn hội thoại và trả lời câu hỏi.",
    4: "Nghe đoạn độc thoại/thông báo và trả lời câu hỏi.",
    5: "Chọn từ/cụm từ phù hợp để điền vào chỗ trống.",
    6: "Đọc đoạn văn và điền từ/cụm từ phù hợp.",
    7: "Đọc bài và trả lời câu hỏi theo nội dung.",
  };
  return desc[part] ?? "";
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function calcScore(correct: number, total: number): number {
  if (total === 20) return Math.round((correct / 20) * 495);
  return Math.round((correct / 15) * 495);
}

function getVerdict(
  correct: number,
  total: number,
): { text: string; emoji: string; color: string } {
  const pct = correct / total;
  if (pct >= 0.85)
    return { text: "Xuất sắc!", emoji: "🏆", color: "text-yellow-600" };
  if (pct >= 0.65) return { text: "Tốt!", emoji: "👍", color: "text-teal-600" };
  return { text: "Cần ôn luyện thêm", emoji: "💪", color: "text-orange-500" };
}

// ── Main Component ─────────────────────────────────────────────────────────
export default function ToeicExamSimulationPage() {
  const { examType } = useParams<{ examType: string }>();
  const navigate = useNavigate();

  useToeicScrollReset();

  const isListening = examType === "listening";
  const questions = isListening ? LISTENING_QUESTIONS : READING_QUESTIONS;
  const totalQuestions = questions.length;
  const examDurationSeconds = isListening ? 45 * 60 : 30 * 60;

  // ── Lock check ────────────────────────────────────────────────────────────
  const { isUnlocked, completedCount, requiredCount } = useMemo(() => {
    const raw = localStorage.getItem(MAP_STORAGE_KEY);
    const required = isListening ? 5 : 4;
    if (!raw)
      return { isUnlocked: false, completedCount: 0, requiredCount: required };
    try {
      const state: LearningMapState = JSON.parse(raw);
      const skill = isListening ? state.listening : state.reading;
      const completed = skill?.completedNodes?.length ?? 0;
      return {
        isUnlocked: completed >= required,
        completedCount: completed,
        requiredCount: required,
      };
    } catch {
      return { isUnlocked: false, completedCount: 0, requiredCount: required };
    }
  }, [isListening]);

  // ── Exam state ────────────────────────────────────────────────────────────
  const [phase, setPhase] = useState<ExamPhase>("intro");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, "A" | "B" | "C" | "D">>(
    {},
  );
  const [timeLeft, setTimeLeft] = useState(examDurationSeconds);
  const [examStarted, setExamStarted] = useState(false);
  const [prevPart, setPrevPart] = useState<number | null>(null);
  const [showPartHeader, setShowPartHeader] = useState(false);

  const partsInfo = useMemo(() => getPartsInfo(questions), [questions]);

  // ── Timer ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!examStarted || phase !== "exam") return;
    if (timeLeft <= 0) {
      handleSubmit();
      return;
    }
    const interval = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(interval);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [examStarted, phase, timeLeft]);

  // ── Part header transition ─────────────────────────────────────────────
  useEffect(() => {
    if (phase !== "exam") return;
    const currentPart = questions[currentIndex]?.part;
    if (currentPart !== prevPart) {
      setPrevPart(currentPart);
      setShowPartHeader(true);
      const timer = setTimeout(() => setShowPartHeader(false), 2500);
      return () => clearTimeout(timer);
    }
  }, [currentIndex, phase, questions, prevPart]);

  // ── Derived values ────────────────────────────────────────────────────────
  const currentQuestion = questions[currentIndex];
  const answeredCount = Object.keys(answers).length;
  const currentPartNum = currentQuestion?.part;

  const currentPartInfo = useMemo(
    () => partsInfo.find((p) => p.part === currentPartNum),
    [partsInfo, currentPartNum],
  );

  const correctCount = useMemo(() => {
    return questions.filter((q, idx) => answers[idx] === q.correctAnswer)
      .length;
  }, [questions, answers]);

  // ── Actions ───────────────────────────────────────────────────────────────
  const handleStartExam = useCallback(() => {
    setPhase("exam");
    setExamStarted(true);
    setCurrentIndex(0);
    setAnswers({});
    setTimeLeft(examDurationSeconds);
    setPrevPart(null);
    setShowPartHeader(true);
  }, [examDurationSeconds]);

  const handleSelectAnswer = useCallback(
    (key: "A" | "B" | "C" | "D") => {
      if (answers[currentIndex] !== undefined) return;
      setAnswers((prev) => ({ ...prev, [currentIndex]: key }));
    },
    [answers, currentIndex],
  );

  const handleNext = useCallback(() => {
    if (currentIndex < totalQuestions - 1) {
      setCurrentIndex((i) => i + 1);
    }
  }, [currentIndex, totalQuestions]);

  const handleSubmit = useCallback(() => {
    const correct = questions.filter(
      (q, idx) => answers[idx] === q.correctAnswer,
    ).length;
    const estimated = calcScore(correct, totalQuestions);
    const result: ExamResult = {
      examType: isListening ? "listening" : "reading",
      score: estimated,
      correctCount: correct,
      totalCount: totalQuestions,
      completedAt: new Date().toISOString(),
    };
    try {
      const existing: ExamResult[] = JSON.parse(
        localStorage.getItem(RESULTS_STORAGE_KEY) ?? "[]",
      );
      existing.push(result);
      localStorage.setItem(RESULTS_STORAGE_KEY, JSON.stringify(existing));
    } catch {
      localStorage.setItem(RESULTS_STORAGE_KEY, JSON.stringify([result]));
    }
    setPhase("summary");
  }, [answers, isListening, questions, totalQuestions]);

  const handleRetry = useCallback(() => {
    setPhase("intro");
    setCurrentIndex(0);
    setAnswers({});
    setTimeLeft(examDurationSeconds);
    setExamStarted(false);
    setPrevPart(null);
    setShowPartHeader(false);
  }, [examDurationSeconds]);

  const handleGoToMap = useCallback(() => {
    navigate(`/student/certificate-review/toeic/skill/${examType}`);
  }, [navigate, examType]);

  // ── Per-part breakdown for summary ───────────────────────────────────────
  const partBreakdown = useMemo(() => {
    return partsInfo.map((pi) => {
      const partQuestions = questions.filter((q) => q.part === pi.part);
      const partCorrect = partQuestions.filter((q, localIdx) => {
        const globalIdx = pi.startIndex + localIdx;
        return answers[globalIdx] === q.correctAnswer;
      }).length;
      const partScore = calcScore(partCorrect, partQuestions.length);
      return { ...pi, correct: partCorrect, score: partScore };
    });
  }, [partsInfo, questions, answers]);

  // ── Render: Locked ────────────────────────────────────────────────────────
  if (!isUnlocked) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center px-4 py-12">
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-10 max-w-md w-full text-center shadow-2xl">
            <div className="flex items-center justify-center w-20 h-20 bg-slate-700/60 rounded-full mx-auto mb-6">
              <Lock className="w-10 h-10 text-slate-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-3">
              Bài thi chưa mở khóa
            </h2>
            <p className="text-slate-300 mb-6 leading-relaxed">
              Hoàn thành tất cả{" "}
              <span className="text-teal-400 font-semibold">
                {requiredCount} node
              </span>{" "}
              luyện tập{" "}
              <span className="text-teal-400 font-semibold">
                {isListening ? "Listening" : "Reading"}
              </span>{" "}
              để mở khóa bài thi này.
            </p>

            {/* Progress */}
            <div className="mb-6">
              <div className="flex justify-between text-sm text-slate-400 mb-2">
                <span>Tiến độ hoàn thành</span>
                <span className="font-semibold text-white">
                  {completedCount} / {requiredCount} node
                </span>
              </div>
              <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-teal-500 to-teal-400 rounded-full transition-all duration-700"
                  style={{
                    width: `${Math.min((completedCount / requiredCount) * 100, 100)}%`,
                  }}
                />
              </div>
              <div className="flex gap-2 mt-3 justify-center">
                {Array.from({ length: requiredCount }).map((_, i) => (
                  <div
                    key={i}
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${
                      i < completedCount
                        ? "bg-teal-500 border-teal-400 text-white"
                        : "bg-slate-700 border-slate-600 text-slate-500"
                    }`}
                  >
                    {i < completedCount ? "✓" : i + 1}
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={handleGoToMap}
              className="w-full py-3 px-6 bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-500 hover:to-teal-400 text-white font-semibold rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-lg"
            >
              <Map className="w-5 h-5" />
              Đến trang luyện tập
            </button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // ── Render: Intro ─────────────────────────────────────────────────────────
  if (phase === "intro") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center px-4 py-12">
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-10 max-w-lg w-full shadow-2xl">
            {/* Badge */}
            <div className="flex justify-center mb-6">
              <span
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold ${
                  isListening
                    ? "bg-teal-500/20 text-teal-300 border border-teal-500/30"
                    : "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                }`}
              >
                {isListening ? (
                  <Headphones className="w-4 h-4" />
                ) : (
                  <BookOpen className="w-4 h-4" />
                )}
                {isListening ? "Listening" : "Reading"} Exam
              </span>
            </div>

            <h1 className="text-3xl font-bold text-white text-center mb-2">
              TOEIC {isListening ? "Listening" : "Reading"} Simulation
            </h1>
            <p className="text-slate-400 text-center mb-8">
              Bài thi mô phỏng chuẩn TOEIC
            </p>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mb-8">
              {[
                {
                  label: "Số câu hỏi",
                  value: isListening ? "20 câu" : "15 câu",
                  icon: "📝",
                },
                {
                  label: "Số phần",
                  value: isListening ? "4 phần" : "3 phần",
                  icon: "📋",
                },
                {
                  label: "Thời gian",
                  value: isListening ? "45 phút" : "30 phút",
                  icon: "⏱️",
                },
              ].map((s) => (
                <div
                  key={s.label}
                  className="bg-white/5 border border-white/10 rounded-xl p-3 text-center"
                >
                  <div className="text-2xl mb-1">{s.icon}</div>
                  <div className="text-white font-bold text-sm">{s.value}</div>
                  <div className="text-slate-500 text-xs mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>

            {/* Instructions */}
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 mb-8">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <span className="text-amber-300 font-semibold text-sm">
                  Lưu ý khi thi
                </span>
              </div>
              <ul className="space-y-2 text-slate-300 text-sm">
                {[
                  "Đây là bài thi mô phỏng theo cấu trúc TOEIC thực tế",
                  "Mỗi câu chỉ được chọn 1 lần (không thay đổi sau khi chọn)",
                  "Kết quả và giải thích chi tiết hiển thị sau khi nộp bài",
                  "Hoàn thành bài thi để xem điểm dự phóng của bạn",
                ].map((note, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-teal-400 mt-0.5 shrink-0">•</span>
                    {note}
                  </li>
                ))}
              </ul>
            </div>

            {/* Parts overview */}
            <div className="mb-8 space-y-2">
              {partsInfo.map((pi) => (
                <div
                  key={pi.part}
                  className="flex items-center gap-3 bg-white/3 border border-white/8 rounded-lg px-4 py-2.5"
                >
                  <span className="text-xs font-bold text-teal-400 bg-teal-500/10 border border-teal-500/20 rounded px-2 py-0.5 shrink-0">
                    P{pi.part}
                  </span>
                  <span className="text-slate-300 text-sm flex-1">
                    {pi.partName.replace(/^Part \d+ – /, "")}
                  </span>
                  <span className="text-slate-500 text-xs">
                    {pi.questionCount} câu
                  </span>
                </div>
              ))}
            </div>

            <button
              onClick={handleStartExam}
              className="w-full py-4 bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-500 hover:to-teal-400 text-white font-bold text-lg rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-xl shadow-teal-900/30"
            >
              🚀 Bắt đầu thi
            </button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // ── Render: Summary ───────────────────────────────────────────────────────
  if (phase === "summary") {
    const estimatedScore = calcScore(correctCount, totalQuestions);
    const accuracy = Math.round((correctCount / totalQuestions) * 100);
    const verdict = getVerdict(correctCount, totalQuestions);

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col">
        <Header />
        <main className="flex-1 px-4 py-8 max-w-4xl mx-auto w-full">
          {/* Score header */}
          <div className="bg-gradient-to-br from-teal-700/40 via-teal-600/30 to-blue-700/30 border border-teal-500/30 rounded-2xl p-8 mb-6 text-center shadow-xl">
            <Trophy className="w-14 h-14 text-yellow-400 mx-auto mb-4" />
            <h2 className="text-4xl font-black text-white mb-1">
              {correctCount} / {totalQuestions} câu đúng
            </h2>
            <p className="text-teal-200 text-lg mb-4">
              Điểm {isListening ? "Listening" : "Reading"} ước tính:{" "}
              <span className="font-black text-white text-2xl">
                {estimatedScore}
              </span>
              <span className="text-teal-300"> / 495</span>
            </p>
            <div className="flex items-center justify-center gap-3 flex-wrap">
              <span className="bg-white/10 border border-white/20 rounded-full px-4 py-1 text-white font-semibold text-sm">
                Độ chính xác: {accuracy}%
              </span>
              <span className={`font-bold text-xl ${verdict.color}`}>
                {verdict.text} {verdict.emoji}
              </span>
            </div>
          </div>

          {/* Per-part breakdown */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-6">
            <h3 className="text-white font-bold text-lg mb-4">
              📊 Kết quả theo phần
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left text-slate-400 py-2 pr-4">Phần</th>
                    <th className="text-center text-slate-400 py-2 px-3">
                      Số câu
                    </th>
                    <th className="text-center text-slate-400 py-2 px-3">
                      Đúng
                    </th>
                    <th className="text-center text-slate-400 py-2 px-3">
                      Tỉ lệ
                    </th>
                    <th className="text-center text-slate-400 py-2 px-3">
                      Điểm ước tính
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {partBreakdown.map((pb) => {
                    const pct = Math.round(
                      (pb.correct / pb.questionCount) * 100,
                    );
                    return (
                      <tr key={pb.part} className="border-b border-white/5">
                        <td className="py-3 pr-4">
                          <span className="text-teal-300 font-semibold">
                            P{pb.part}
                          </span>
                          <span className="text-slate-400 ml-2 text-xs">
                            {pb.partName.replace(/^Part \d+ – /, "")}
                          </span>
                        </td>
                        <td className="text-center text-slate-300 py-3 px-3">
                          {pb.questionCount}
                        </td>
                        <td className="text-center py-3 px-3">
                          <span
                            className={`font-bold ${
                              pb.correct === pb.questionCount
                                ? "text-green-400"
                                : pb.correct >= pb.questionCount / 2
                                  ? "text-teal-400"
                                  : "text-orange-400"
                            }`}
                          >
                            {pb.correct}
                          </span>
                        </td>
                        <td className="text-center py-3 px-3">
                          <div className="flex items-center gap-2 justify-center">
                            <div className="w-16 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-teal-500 rounded-full"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <span className="text-slate-400 text-xs">
                              {pct}%
                            </span>
                          </div>
                        </td>
                        <td className="text-center text-white font-semibold py-3 px-3">
                          {pb.score}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Detailed review */}
          <div className="space-y-4 mb-8">
            <h3 className="text-white font-bold text-lg">
              📝 Xem lại chi tiết
            </h3>
            {questions.map((q, idx) => {
              const userAnswer = answers[idx];
              const isCorrect = userAnswer === q.correctAnswer;
              const isReadingPart7 = q.part === 7;

              return (
                <div
                  key={q.id}
                  className={`border rounded-xl overflow-hidden ${
                    isCorrect ? "border-green-500/30" : "border-red-500/30"
                  } bg-white/3`}
                >
                  {/* Question header */}
                  <div
                    className={`flex items-center gap-3 px-5 py-3 ${
                      isCorrect ? "bg-green-500/10" : "bg-red-500/10"
                    }`}
                  >
                    {isCorrect ? (
                      <CheckCircle2 className="w-5 h-5 text-green-400 shrink-0" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-400 shrink-0" />
                    )}
                    <span className="text-xs font-bold text-teal-400 bg-teal-500/10 border border-teal-500/20 rounded px-2 py-0.5">
                      Câu {idx + 1}
                    </span>
                    <span className="text-slate-400 text-xs">{q.partName}</span>
                  </div>

                  <div className="px-5 py-4">
                    {/* Context for non-Part7 */}
                    {q.context && !isReadingPart7 && (
                      <div className="bg-slate-800/60 border border-slate-700/50 rounded-lg px-4 py-3 mb-3">
                        <p className="text-slate-300 text-sm italic whitespace-pre-line leading-relaxed">
                          {q.context}
                        </p>
                      </div>
                    )}

                    {/* Part 7: passage + question side by side on large screens */}
                    {isReadingPart7 && q.context && (
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-3">
                        <div className="bg-slate-800/60 border border-slate-700/50 rounded-lg px-4 py-3 max-h-48 overflow-y-auto">
                          <p className="text-slate-300 text-xs whitespace-pre-line leading-relaxed">
                            {q.context}
                          </p>
                        </div>
                        <div>
                          <p className="text-white font-semibold mb-3 text-sm">
                            {q.question}
                          </p>
                          <div className="space-y-1.5">
                            {q.options.map((opt) => {
                              const isUserChoice = userAnswer === opt.key;
                              const isRight = opt.key === q.correctAnswer;
                              return (
                                <div
                                  key={opt.key}
                                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs ${
                                    isRight
                                      ? "bg-green-500/20 border border-green-500/40 text-green-300"
                                      : isUserChoice && !isCorrect
                                        ? "bg-red-500/20 border border-red-500/40 text-red-300 line-through"
                                        : "bg-slate-700/30 border border-slate-700/50 text-slate-400"
                                  }`}
                                >
                                  <span className="font-bold shrink-0">
                                    {opt.key}.
                                  </span>
                                  <span>{opt.text}</span>
                                  {isRight && (
                                    <CheckCircle2 className="w-3.5 h-3.5 text-green-400 ml-auto shrink-0" />
                                  )}
                                  {isUserChoice && !isCorrect && (
                                    <XCircle className="w-3.5 h-3.5 text-red-400 ml-auto shrink-0" />
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Standard question display */}
                    {!isReadingPart7 && (
                      <>
                        <p className="text-white font-semibold mb-3 text-sm">
                          {q.question}
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
                          {q.options.map((opt) => {
                            const isUserChoice = userAnswer === opt.key;
                            const isRight = opt.key === q.correctAnswer;
                            return (
                              <div
                                key={opt.key}
                                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${
                                  isRight
                                    ? "bg-green-500/20 border border-green-500/40 text-green-300"
                                    : isUserChoice && !isCorrect
                                      ? "bg-red-500/20 border border-red-500/40 text-red-300 line-through"
                                      : "bg-slate-700/30 border border-slate-700/50 text-slate-400"
                                }`}
                              >
                                <span className="font-bold shrink-0">
                                  {opt.key}.
                                </span>
                                <span className="flex-1">{opt.text}</span>
                                {isRight && (
                                  <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />
                                )}
                                {isUserChoice && !isCorrect && (
                                  <XCircle className="w-4 h-4 text-red-400 shrink-0" />
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </>
                    )}

                    {/* Answer summary row */}
                    <div className="flex flex-wrap gap-3 text-xs mb-2">
                      <span className="flex items-center gap-1">
                        <span className="text-slate-500">Bạn chọn:</span>
                        {userAnswer ? (
                          <span
                            className={`font-bold px-2 py-0.5 rounded ${
                              isCorrect
                                ? "bg-green-500/20 text-green-300"
                                : "bg-red-500/20 text-red-300"
                            }`}
                          >
                            {userAnswer} {isCorrect ? "✓" : "✗"}
                          </span>
                        ) : (
                          <span className="text-slate-500 italic">
                            Chưa trả lời
                          </span>
                        )}
                      </span>
                      {!isCorrect && (
                        <span className="flex items-center gap-1">
                          <span className="text-slate-500">Đáp án đúng:</span>
                          <span className="font-bold px-2 py-0.5 rounded bg-green-500/20 text-green-300">
                            {q.correctAnswer} ✓
                          </span>
                        </span>
                      )}
                    </div>

                    {/* Explanation */}
                    <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg px-4 py-2.5">
                      <p className="text-amber-200 text-xs leading-relaxed">
                        <span className="font-bold text-amber-300">
                          💡 Giải thích:{" "}
                        </span>
                        {q.explanation}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pb-4">
            <button
              onClick={handleGoToMap}
              className="flex-1 py-3.5 px-6 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg"
            >
              <Map className="w-5 h-5" />
              Xem bản đồ luyện tập
            </button>
            <button
              onClick={handleRetry}
              className="flex-1 py-3.5 px-6 bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-500 hover:to-teal-400 text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg"
            >
              <RotateCcw className="w-5 h-5" />
              Thi lại
            </button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // ── Render: Exam ──────────────────────────────────────────────────────────
  const isLastQuestion = currentIndex === totalQuestions - 1;
  const hasAnswered = answers[currentIndex] !== undefined;
  const isTimeCritical = timeLeft < 5 * 60;
  const isReadingPart7 = currentQuestion.part === 7;

  // Part dots
  const partGroups = partsInfo.map((pi) => ({
    ...pi,
    questions: questions.slice(pi.startIndex, pi.startIndex + pi.questionCount),
    indices: Array.from(
      { length: pi.questionCount },
      (_, k) => pi.startIndex + k,
    ),
  }));

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col">
      <Header />

      {/* Top bar */}
      <div className="sticky top-0 z-20 bg-slate-900/95 backdrop-blur-sm border-b border-white/10 shadow-lg">
        <div className="max-w-5xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            {/* Part indicator */}
            <div className="flex items-center gap-2 shrink-0">
              {isListening ? (
                <Headphones className="w-4 h-4 text-teal-400" />
              ) : (
                <BookOpen className="w-4 h-4 text-blue-400" />
              )}
              <span className="text-white font-semibold text-sm hidden sm:inline">
                Part {currentPartNum} / {partsInfo.length}
              </span>
              <span className="text-teal-300 text-xs hidden sm:inline bg-teal-500/10 border border-teal-500/20 rounded px-2 py-0.5">
                {currentPartInfo?.partName.replace(/^Part \d+ – /, "") ?? ""}
              </span>
            </div>

            {/* Progress center */}
            <div className="flex flex-col items-center gap-1 flex-1 max-w-xs">
              <span className="text-slate-300 text-sm font-semibold">
                Câu {currentIndex + 1}/{totalQuestions}
              </span>
              <div className="w-full h-1.5 bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-teal-500 to-teal-400 rounded-full transition-all duration-300"
                  style={{
                    width: `${((currentIndex + 1) / totalQuestions) * 100}%`,
                  }}
                />
              </div>
            </div>

            {/* Timer */}
            <div
              className={`flex items-center gap-1.5 font-mono font-bold text-sm shrink-0 px-3 py-1.5 rounded-lg border ${
                isTimeCritical
                  ? "text-red-400 bg-red-500/10 border-red-500/30 animate-pulse"
                  : "text-teal-300 bg-teal-500/10 border-teal-500/20"
              }`}
            >
              <Clock className="w-4 h-4" />
              {formatTime(timeLeft)}
            </div>
          </div>

          {/* Answer dots strip */}
          <div className="flex gap-1 mt-2 flex-wrap">
            {questions.map((_, idx) => (
              <div
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`w-5 h-2 rounded-full cursor-pointer transition-all ${
                  idx === currentIndex
                    ? "bg-teal-400 scale-y-150"
                    : answers[idx] !== undefined
                      ? "bg-green-500"
                      : "bg-slate-600 hover:bg-slate-500"
                }`}
                title={`Câu ${idx + 1}${answers[idx] ? ` (${answers[idx]})` : ""}`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Part header banner */}
      {showPartHeader && (
        <div className="bg-gradient-to-r from-teal-700/60 to-blue-700/60 border-b border-teal-500/30 px-4 py-3 text-center transition-all">
          <p className="text-teal-200 text-xs uppercase tracking-widest font-semibold mb-0.5">
            Bắt đầu phần mới
          </p>
          <p className="text-white font-bold text-lg">
            {currentQuestion.partName}
          </p>
          <p className="text-slate-300 text-sm">
            {currentPartInfo?.description}
          </p>
        </div>
      )}

      {/* Main content */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-6">
        {/* Part navigation dots */}
        <div className="flex gap-2 mb-5 flex-wrap">
          {partGroups.map((pg) => {
            const isActivePart = pg.part === currentPartNum;
            const partAnswered = pg.indices.filter(
              (i) => answers[i] !== undefined,
            ).length;
            const allDone = partAnswered === pg.questionCount;
            return (
              <button
                key={pg.part}
                onClick={() => setCurrentIndex(pg.startIndex)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                  isActivePart
                    ? "bg-teal-500 border-teal-400 text-white shadow-lg shadow-teal-900/30"
                    : allDone
                      ? "bg-green-500/20 border-green-500/40 text-green-300"
                      : "bg-slate-700/50 border-slate-600 text-slate-400 hover:border-teal-500/50 hover:text-teal-300"
                }`}
              >
                <span>Part {pg.part}</span>
                <span
                  className={`text-xs ${
                    isActivePart
                      ? "text-teal-200"
                      : allDone
                        ? "text-green-400"
                        : "text-slate-500"
                  }`}
                >
                  {partAnswered}/{pg.questionCount}
                </span>
              </button>
            );
          })}
        </div>

        {/* Question card */}
        <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden shadow-xl mb-6">
          {/* Part badge */}
          <div className="bg-slate-800/60 border-b border-white/10 px-5 py-3 flex items-center gap-3">
            <span className="text-xs font-bold text-teal-400 bg-teal-500/10 border border-teal-500/20 rounded px-2 py-0.5">
              {isListening
                ? `🎧 ${currentQuestion.partName}`
                : `📖 ${currentQuestion.partName}`}
            </span>
            <span className="text-slate-500 text-xs">
              Câu {currentIndex + 1}
            </span>
          </div>

          <div className="p-5">
            {/* Reading Part 7: two-column layout */}
            {isReadingPart7 && currentQuestion.context ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
                {/* Passage */}
                <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 max-h-80 overflow-y-auto">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                    📄 Đoạn văn
                  </p>
                  <p className="text-slate-200 text-sm whitespace-pre-line leading-relaxed">
                    {currentQuestion.context}
                  </p>
                </div>
                {/* Question side */}
                <div className="flex flex-col justify-start">
                  <p className="text-white font-bold text-base mb-4 leading-relaxed">
                    {currentQuestion.question}
                  </p>
                  <div className="space-y-2.5">
                    {currentQuestion.options.map((opt) => {
                      const selected = answers[currentIndex];
                      const isSelected = selected === opt.key;
                      const isDisabled = selected !== undefined;
                      return (
                        <button
                          key={opt.key}
                          disabled={isDisabled}
                          onClick={() => handleSelectAnswer(opt.key)}
                          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-medium transition-all duration-150 text-left ${
                            isSelected
                              ? "bg-slate-600/60 border-slate-500 text-slate-200 cursor-default"
                              : isDisabled
                                ? "bg-slate-800/30 border-slate-700/40 text-slate-600 cursor-not-allowed"
                                : "bg-slate-800/40 border-slate-600/50 text-slate-200 hover:border-teal-500/60 hover:bg-teal-500/10 hover:text-white cursor-pointer"
                          }`}
                        >
                          <span
                            className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border shrink-0 ${
                              isSelected
                                ? "bg-slate-500 border-slate-400 text-white"
                                : isDisabled
                                  ? "bg-slate-700 border-slate-600 text-slate-500"
                                  : "bg-slate-700 border-slate-500 text-slate-300 group-hover:border-teal-400"
                            }`}
                          >
                            {opt.key}
                          </span>
                          <span className="flex-1">{opt.text}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              <>
                {/* Context block (Listening / Part 5-6) */}
                {currentQuestion.context && (
                  <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl px-5 py-4 mb-5">
                    <p className="text-slate-200 text-sm italic whitespace-pre-line leading-relaxed">
                      {currentQuestion.context}
                    </p>
                  </div>
                )}

                {/* Question text */}
                <p className="text-white font-bold text-lg mb-5 leading-relaxed">
                  {currentQuestion.question}
                </p>

                {/* Options grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {currentQuestion.options.map((opt) => {
                    const selected = answers[currentIndex];
                    const isSelected = selected === opt.key;
                    const isDisabled = selected !== undefined;
                    return (
                      <button
                        key={opt.key}
                        disabled={isDisabled}
                        onClick={() => handleSelectAnswer(opt.key)}
                        className={`flex items-center gap-3 px-4 py-3.5 rounded-xl border text-sm font-medium transition-all duration-150 text-left ${
                          isSelected
                            ? "bg-slate-600/60 border-slate-500 text-slate-200 cursor-default"
                            : isDisabled
                              ? "bg-slate-800/30 border-slate-700/40 text-slate-600 cursor-not-allowed"
                              : "bg-slate-800/40 border-slate-600/50 text-slate-200 hover:border-teal-500/60 hover:bg-teal-500/10 hover:text-white cursor-pointer"
                        }`}
                      >
                        <span
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border shrink-0 ${
                            isSelected
                              ? "bg-slate-500 border-slate-400 text-white"
                              : isDisabled
                                ? "bg-slate-700 border-slate-600 text-slate-500"
                                : "bg-slate-700 border-slate-500 text-slate-300"
                          }`}
                        >
                          {opt.key}
                        </span>
                        <span className="flex-1">{opt.text}</span>
                      </button>
                    );
                  })}
                </div>
              </>
            )}

            {/* Selected answer reminder */}
            {hasAnswered && (
              <div className="mt-4 flex items-center gap-2 text-slate-400 text-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-500 shrink-0" />
                Bạn đã chọn{" "}
                <span className="font-bold text-slate-200">
                  {answers[currentIndex]}
                </span>
                . Không thể thay đổi đáp án.
              </div>
            )}
          </div>
        </div>

        {/* Navigation buttons */}
        <div className="flex items-center justify-between gap-3">
          <button
            onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
            disabled={currentIndex === 0}
            className="px-5 py-3 bg-slate-700/50 border border-slate-600/50 text-slate-300 rounded-xl hover:bg-slate-700 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all text-sm font-semibold"
          >
            ← Câu trước
          </button>

          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span
              className={`font-semibold ${
                answeredCount === totalQuestions
                  ? "text-green-400"
                  : "text-slate-400"
              }`}
            >
              {answeredCount}/{totalQuestions} đã trả lời
            </span>
          </div>

          {isLastQuestion ? (
            <button
              onClick={handleSubmit}
              disabled={!hasAnswered}
              className="px-6 py-3 bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-400 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all shadow-lg shadow-orange-900/30 flex items-center gap-2 text-sm"
            >
              <Trophy className="w-4 h-4" />
              Nộp bài
            </button>
          ) : (
            <button
              onClick={handleNext}
              disabled={!hasAnswered}
              className="px-6 py-3 bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-500 hover:to-teal-400 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all shadow-lg shadow-teal-900/30 flex items-center gap-2 text-sm"
            >
              Câu tiếp theo
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Submit early if all answered */}
        {answeredCount === totalQuestions && !isLastQuestion && (
          <div className="mt-4 text-center">
            <button
              onClick={handleSubmit}
              className="px-6 py-2.5 bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-400 text-white font-semibold rounded-xl transition-all text-sm flex items-center gap-2 mx-auto"
            >
              <Trophy className="w-4 h-4" />
              Nộp bài sớm (đã trả lời hết)
            </button>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}

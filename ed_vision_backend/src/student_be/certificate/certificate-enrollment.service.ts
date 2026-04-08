import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { createHash } from 'crypto';
import {
  access,
  mkdir,
  readFile,
  writeFile,
  constants as fsConstants,
} from 'fs/promises';
import { basename, extname, join } from 'path';
import type { Prisma } from '@prisma/client';
import * as XLSX from 'xlsx';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CreateEnrollmentDto,
  CompleteTopicDto,
  EnrollmentResponseDto,
  ToeicLeaderboardEntryDto,
  ToeicPlanSyncDto,
  ToeicPlanSyncResponseDto,
  ToeicRepositoryOverviewItemDto,
  ToeicRepositoryOverviewResponseDto,
  ToeicRepositoryDetailResponseDto,
  ToeicRepositorySubmitDto,
  ToeicRepositorySubmitResponseDto,
  ToeicReadingImportDto,
  ToeicReadingImportResponseDto,
  ToeicManualListeningCreateDto,
  ToeicManualListeningCreateResponseDto,
  ToeicExplainAnswerDto,
  ToeicExplainAnswerResponseDto,
<<<<<<< HEAD
  CertificateTutorAskDto,
  CertificateTutorAskResponseDto,
=======
>>>>>>> origin/main
} from './dto/certificate.dto';
import {
  OLLAMA_TIMEOUT_MS,
  OLLAMA_EXPLANATION_OPTIONS,
  OLLAMA_TUTOR_OPTIONS,
  buildExplanationPrompt,
  buildTutorPrompt as buildTutorPromptFromFile,
  buildTutorFallback,
  buildExplanationFallback,
} from './certificate-prompts';

const TOPIC_COUNTS_BY_CERT: Record<string, number> = {
  ielts: 18,
  toeic: 15,
  'mos-word': 12,
  'mos-excel': 12,
  'mos-powerpoint': 10,
};

<<<<<<< HEAD
const CERT_TUTOR_ALLOWED_CERT_TYPES = new Set<string>([
  'ielts',
  'toeic',
  'mos-word',
  'mos-excel',
  'mos-powerpoint',
]);

const CERT_TUTOR_PROMPT_VERSION = 'v8';

// CERT_TUTOR_SYSTEM_PROMPTS đã được chuyển sang certificate-prompts.ts (CERT_PERSONA)

function getTotalTopics(certType: string): number {
  return TOPIC_COUNTS_BY_CERT[certType] ?? 10;
}

=======
function getTotalTopics(certType: string): number {
  return TOPIC_COUNTS_BY_CERT[certType] ?? 10;
}

>>>>>>> origin/main
const TOEIC_META_PREFIX = '__meta.toeic.';

function isToeicMetaTopic(topicKey: string): boolean {
  return topicKey.startsWith(TOEIC_META_PREFIX);
}

type ToeicPlanStateRaw = {
  current_score?: number;
  target_score?: number;
  total_boost?: number;
  goal_start_score?: number;
  listening_sessions?: number;
  reading_sessions?: number;
  foundation_completed?: string[];
  foundation_skipped?: boolean;
  first_guide_shown?: boolean;
};

type LearningStatus = 'not_started' | 'in_progress' | 'completed';

function toPercent(current: number, start: number, target: number): number {
  if (target <= start) return current >= target ? 100 : 0;
  if (current >= target) return 100;

  const gained = Math.max(0, current - start);
  const total = Math.max(1, target - start);
  return Math.max(0, Math.min(99, Math.round((gained / total) * 100)));
}

<<<<<<< HEAD
=======
type ToeicSeedSkill = 'listening' | 'reading' | 'grammar' | 'vocabulary';

>>>>>>> origin/main
type EnrollmentWithTopicProgress = Prisma.CertificateEnrollmentGetPayload<{
  include: { topicProgress: { select: { topic_key: true } } };
}>;

type ToeicRepositoryWithItems = Prisma.LearningRepositoryGetPayload<{
  include: {
    items: {
      orderBy: { item_order: 'asc' };
      include: { options: { orderBy: { sort_order: 'asc' } } };
    };
  };
}>;

type ToeicRepositoryWithItemsForSubmit = Prisma.LearningRepositoryGetPayload<{
  include: {
    items: {
      include: { options: true };
    };
  };
}>;

type ToeicEnrollmentLeaderboardRow = Prisma.CertificateEnrollmentGetPayload<{
  include: {
    student: {
      include: {
        account: {
          include: { profile: true };
        };
      };
    };
  };
}>;

<<<<<<< HEAD
=======
type ToeicSeedOption = {
  optionKey: string;
  optionText: string;
  isCorrect: boolean;
  rationale: string;
};

type ToeicSeedItem = {
  itemType: string;
  title: string;
  stem: string;
  readingPassage?: string | null;
  mediaAudioUrl?: string | null;
  explanation: string;
  estimatedSeconds: number;
  options: ToeicSeedOption[];
};

const TOEIC_MILESTONES = [350, 500, 600, 700, 800] as const;

function toSlugPart(skill: ToeicSeedSkill): string {
  if (skill === 'listening') return 'listening';
  if (skill === 'reading') return 'reading';
  if (skill === 'grammar') return 'grammar';
  return 'vocabulary';
}

function calcUnlockScore(milestone: number): number {
  return Math.max(300, milestone - 50);
}

function calcRangeMax(milestone: number): number {
  return milestone >= 800 ? 990 : milestone + 99;
}

>>>>>>> origin/main
function getDefaultTargetScore(certType: string): number | null {
  if (certType === 'toeic') return 600;
  return null;
}

function resolveToeicTargetScore(dto: CreateEnrollmentDto): number {
  const fromScore =
    typeof dto.target_score === 'number' && Number.isFinite(dto.target_score)
      ? Math.round(dto.target_score)
      : undefined;

  if (typeof fromScore === 'number') {
    return Math.max(10, Math.min(990, fromScore));
  }

  return 600;
}

function isInScoreWindow(
  min: number | null | undefined,
  max: number | null | undefined,
  score: number,
): boolean {
  if (typeof min === 'number' && score < min) return false;
  if (typeof max === 'number' && score > max) return false;
  return true;
}

function readJsonString(
  source: Prisma.JsonObject,
  key: string,
): string | undefined {
  const value = source[key];
  return typeof value === 'string' ? value : undefined;
}

function readJsonNumber(
  source: Prisma.JsonObject,
  key: string,
): number | undefined {
  const value = source[key];
  return typeof value === 'number' ? value : undefined;
}

type ParsedImportRow = Record<string, string>;

type ParsedImportOption = {
  optionKey: string;
  optionText: string;
  isCorrect: boolean;
  rationale?: string | null;
};

type ParsedListeningOption = {
  option_key: string;
  option_text: string;
  is_correct?: boolean;
  rationale?: string;
};

type OllamaGenerateResponse = {
  response?: string;
  model?: string;
};

type FileCacheExplanation = {
  explanation: string;
  model: string;
  created_at: string;
};

<<<<<<< HEAD
type FileCacheTutorAnswer = {
  answer: string;
  model: string;
  created_at: string;
};

const DEFAULT_READING_REQUIRED_KEYWORDS = [
  'reading',
  'part 5',
  'part 6',
  'part 7',
];
=======
const DEFAULT_READING_REQUIRED_KEYWORDS = ['reading', 'part 5', 'part 6', 'part 7'];
>>>>>>> origin/main
const DEFAULT_READING_EXCLUDED_KEYWORDS = [
  'listening',
  'part 1',
  'part 2',
  'part 3',
  'part 4',
  'speaking',
  'writing',
];
<<<<<<< HEAD

const TOEIC_LOOKAHEAD_PREFETCH_COUNT = 3;
const TOEIC_LOOKAHEAD_PREFETCH_BATCH_SIZE = 2;
=======
>>>>>>> origin/main

@Injectable()
export class CertificateEnrollmentService {
  constructor(private readonly prisma: PrismaService) {}

<<<<<<< HEAD
  private readonly inFlightExplanationGenerations = new Map<
    string,
    Promise<string>
  >();
=======
  private buildReadingSeedItems(milestone: number): ToeicSeedItem[] {
    const part5Items: ToeicSeedItem[] = [
      {
        itemType: 'single_choice',
        title: `Reading Part 5 - Q1 (M${milestone})`,
        stem: 'The new main office was housed in a bright and modern building, but its ____ was inconvenient for employees who did not have a car.',
        explanation:
          'Can mot danh tu chi vi tri. "location" (D) la danh tu phu hop voi ngu canh.',
        estimatedSeconds: 55,
        options: [
          {
            optionKey: 'A',
            optionText: 'locate',
            isCorrect: false,
            rationale: 'Dong tu nguyen mau, khong phu hop vi tri danh tu.',
          },
          {
            optionKey: 'B',
            optionText: 'to locate',
            isCorrect: false,
            rationale: 'Cum dong tu nguyen mau, khong phu hop vi tri danh tu.',
          },
          {
            optionKey: 'C',
            optionText: 'located',
            isCorrect: false,
            rationale: 'Tinh tu/phan tu, khong hop cau truc can dien danh tu.',
          },
          {
            optionKey: 'D',
            optionText: 'location',
            isCorrect: true,
            rationale:
              'Danh tu dung ngu canh: "its location was inconvenient".',
          },
        ],
      },
      {
        itemType: 'single_choice',
        title: `Reading Part 5 - Q2 (M${milestone})`,
        stem: 'Applicants are asked to submit all required documents ____ 5:00 p.m. on Friday.',
        explanation:
          'Gioi tu "by" dien ta han chot thoi gian, phu hop ngu nghia cau.',
        estimatedSeconds: 55,
        options: [
          {
            optionKey: 'A',
            optionText: 'by',
            isCorrect: true,
            rationale:
              'Dung de chi han chot phai hoan thanh truoc moc thoi gian.',
          },
          {
            optionKey: 'B',
            optionText: 'since',
            isCorrect: false,
            rationale:
              'Khong dung de chi deadline cu the trong truong hop nay.',
          },
          {
            optionKey: 'C',
            optionText: 'during',
            isCorrect: false,
            rationale: 'Chi khoang thoi gian, khong phai han nop.',
          },
          {
            optionKey: 'D',
            optionText: 'between',
            isCorrect: false,
            rationale: 'Can hai moc thoi gian, khong phu hop cau truc cau.',
          },
        ],
      },
      {
        itemType: 'single_choice',
        title: `Reading Part 5 - Q3 (M${milestone})`,
        stem: 'Ms. Ortega will lead the meeting herself ____ the project manager is out of town.',
        explanation:
          'Can lien tu chi ly do. "because" la lua chon dung de noi 2 menh de.',
        estimatedSeconds: 55,
        options: [
          {
            optionKey: 'A',
            optionText: 'because',
            isCorrect: true,
            rationale: 'Noi menh de chinh va ly do mot cach tu nhien.',
          },
          {
            optionKey: 'B',
            optionText: 'unless',
            isCorrect: false,
            rationale:
              'Mang nghia dieu kien phu dinh, khong dung ngu nghia cau.',
          },
          {
            optionKey: 'C',
            optionText: 'although',
            isCorrect: false,
            rationale:
              'Mang nghia tuong phan, khong phu hop voi thong tin cho truoc.',
          },
          {
            optionKey: 'D',
            optionText: 'despite',
            isCorrect: false,
            rationale:
              'Can danh dong tu/danh tu theo sau, khong dung voi menh de day du.',
          },
        ],
      },
      {
        itemType: 'single_choice',
        title: `Reading Part 5 - Q4 (M${milestone})`,
        stem: 'The finance team has prepared a ____ report for the quarterly budget review.',
        explanation:
          'Can tinh tu bo nghia cho danh tu "report". "detailed" la tu phu hop nhat.',
        estimatedSeconds: 55,
        options: [
          {
            optionKey: 'A',
            optionText: 'detail',
            isCorrect: false,
            rationale: 'Danh tu, khong dung vi tri tinh tu truoc danh tu khac.',
          },
          {
            optionKey: 'B',
            optionText: 'detailing',
            isCorrect: false,
            rationale: 'Dang V-ing khong tu nhien trong cum danh tu nay.',
          },
          {
            optionKey: 'C',
            optionText: 'detailed',
            isCorrect: true,
            rationale: 'Tinh tu bo nghia cho "report" mot cach dung ngu phap.',
          },
          {
            optionKey: 'D',
            optionText: 'detailingly',
            isCorrect: false,
            rationale: 'Khong phai tu dung trong tieng Anh chuan.',
          },
        ],
      },
      {
        itemType: 'single_choice',
        title: `Reading Part 5 - Q5 (M${milestone})`,
        stem: 'Customers who purchased tickets online can receive a full refund ____ they cancel at least 24 hours in advance.',
        explanation:
          '"provided (that)"/"if" dien ta dieu kien. O day "if" la dap an dung.',
        estimatedSeconds: 55,
        options: [
          {
            optionKey: 'A',
            optionText: 'if',
            isCorrect: true,
            rationale: 'Lien tu dieu kien dung ngu canh cua cau.',
          },
          {
            optionKey: 'B',
            optionText: 'until',
            isCorrect: false,
            rationale: 'Chi moc thoi gian, khong dien ta dieu kien hoan tien.',
          },
          {
            optionKey: 'C',
            optionText: 'while',
            isCorrect: false,
            rationale: 'Mang nghia trong khi, khong phu hop logic cau.',
          },
          {
            optionKey: 'D',
            optionText: 'despite',
            isCorrect: false,
            rationale: 'Can danh tu/cum danh tu theo sau, khong dung cau truc.',
          },
        ],
      },
      {
        itemType: 'single_choice',
        title: `Reading Part 5 - Q6 (M${milestone})`,
        stem: 'Our IT department will install the software update tonight to minimize ____ during business hours.',
        explanation:
          'Can mot danh tu chi su gian doan. "disruption" phu hop y nghia cau.',
        estimatedSeconds: 55,
        options: [
          {
            optionKey: 'A',
            optionText: 'disrupt',
            isCorrect: false,
            rationale: 'Dong tu, khong phu hop vi tri danh tu sau "minimize".',
          },
          {
            optionKey: 'B',
            optionText: 'disruptive',
            isCorrect: false,
            rationale: 'Tinh tu, khong dung vi tri can danh tu.',
          },
          {
            optionKey: 'C',
            optionText: 'disruption',
            isCorrect: true,
            rationale: 'Danh tu truu tuong, dung ngu phap va ngu nghia.',
          },
          {
            optionKey: 'D',
            optionText: 'disrupted',
            isCorrect: false,
            rationale: 'Tinh tu/phan tu, khong phu hop cau truc nay.',
          },
        ],
      },
      {
        itemType: 'single_choice',
        title: `Reading Part 5 - Q7 (M${milestone})`,
        stem: 'Neither the supervisor nor the assistants ____ responsible for approving overtime requests this week.',
        explanation:
          'Voi "neither ... nor", dong tu hoa hop voi chu ngu gan nhat "assistants" (so nhieu) => "are".',
        estimatedSeconds: 55,
        options: [
          {
            optionKey: 'A',
            optionText: 'is',
            isCorrect: false,
            rationale: 'Khong hoa hop voi chu ngu gan nhat so nhieu.',
          },
          {
            optionKey: 'B',
            optionText: 'are',
            isCorrect: true,
            rationale:
              'Dung quy tac hoa hop chu ngu dong tu trong cau noi ket hop.',
          },
          {
            optionKey: 'C',
            optionText: 'was',
            isCorrect: false,
            rationale: 'Sai thi va sai hoa hop so it/so nhieu.',
          },
          {
            optionKey: 'D',
            optionText: 'be',
            isCorrect: false,
            rationale: 'Dang nguyen mau, khong dung vi tri dong tu chinh.',
          },
        ],
      },
      {
        itemType: 'single_choice',
        title: `Reading Part 5 - Q8 (M${milestone})`,
        stem: 'All visitors must sign in at the security desk ____ entering the production area.',
        explanation:
          'Can gioi tu chi thu tu hanh dong. "before" la lua chon phu hop.',
        estimatedSeconds: 55,
        options: [
          {
            optionKey: 'A',
            optionText: 'before',
            isCorrect: true,
            rationale:
              'Chi hanh dong phai xay ra truoc khi vao khu vuc san xuat.',
          },
          {
            optionKey: 'B',
            optionText: 'already',
            isCorrect: false,
            rationale: 'Trang tu, khong noi duoc voi V-ing nhu gioi tu.',
          },
          {
            optionKey: 'C',
            optionText: 'except',
            isCorrect: false,
            rationale: 'Sai nghia va khong phu hop logic noi quy.',
          },
          {
            optionKey: 'D',
            optionText: 'recently',
            isCorrect: false,
            rationale: 'Trang tu thoi gian khong phu hop vi tri nay.',
          },
        ],
      },
      {
        itemType: 'single_choice',
        title: `Reading Part 5 - Q9 (M${milestone})`,
        stem: 'The training workshop was postponed ____ the instructor was unexpectedly ill.',
        explanation:
          'Can lien tu noi menh de chi nguyen nhan. "because" la dap an dung.',
        estimatedSeconds: 55,
        options: [
          {
            optionKey: 'A',
            optionText: 'because',
            isCorrect: true,
            rationale: 'Noi menh de nguyen nhan day du va tu nhien.',
          },
          {
            optionKey: 'B',
            optionText: 'whereas',
            isCorrect: false,
            rationale: 'Mang nghia doi lap, khong hop noi dung.',
          },
          {
            optionKey: 'C',
            optionText: 'unless',
            isCorrect: false,
            rationale: 'Mang nghia neu khong, khong dung voi tinh huong cau.',
          },
          {
            optionKey: 'D',
            optionText: 'however',
            isCorrect: false,
            rationale: 'Trang tu noi, khong noi duoc 2 menh de theo cach nay.',
          },
        ],
      },
      {
        itemType: 'single_choice',
        title: `Reading Part 5 - Q10 (M${milestone})`,
        stem: 'Please send your availability by noon so that we can finalize the interview ____ for next week.',
        explanation:
          'Can mot danh tu chi lich trinh. "schedule" la lua chon dung.',
        estimatedSeconds: 55,
        options: [
          {
            optionKey: 'A',
            optionText: 'scheduling',
            isCorrect: false,
            rationale: 'Dang V-ing khong phu hop trong cum danh tu nay.',
          },
          {
            optionKey: 'B',
            optionText: 'schedule',
            isCorrect: true,
            rationale:
              'Danh tu dung ngu canh: "finalize the interview schedule".',
          },
          {
            optionKey: 'C',
            optionText: 'scheduled',
            isCorrect: false,
            rationale: 'Tinh tu/phan tu, khong phu hop vi tri danh tu.',
          },
          {
            optionKey: 'D',
            optionText: 'scheduler',
            isCorrect: false,
            rationale: 'Chi nguoi/phan mem lap lich, khong phu hop y cau.',
          },
        ],
      },
    ];

    const part7Passage =
      'Riverview Community Arts Center announced yesterday that it will launch a six-week evening guitar program beginning May 12. The program is designed for beginners and includes one printed workbook and two instructional audio files that participants can download after registration. Tuition is $35 for the full program, and classes are scheduled every Tuesday, Wednesday, and Thursday from 7:00 p.m. to 9:00 p.m. According to the center director, both instructors have over ten years of teaching experience. Enrollment is limited to 60 students, and early registration is recommended. For additional details, interested participants can call Michael at 335-4287 or visit the information desk between 9:00 a.m. and 5:00 p.m. on weekdays.';

    const part7Items: ToeicSeedItem[] = [
      {
        itemType: 'single_choice',
        title: `Reading Part 7 - Q1 (M${milestone})`,
        stem: 'What is included in the $35 tuition fee?',
        readingPassage: part7Passage,
        explanation:
          'Doan van neu ro hoc phi $35 bao gom workbook in va hai tep audio huong dan.',
        estimatedSeconds: 75,
        options: [
          {
            optionKey: 'A',
            optionText: 'One workbook and two audio files',
            isCorrect: true,
            rationale: 'Thong tin xuat hien truc tiep trong doan van.',
          },
          {
            optionKey: 'B',
            optionText: 'A guitar and private lessons',
            isCorrect: false,
            rationale:
              'Doan van khong noi den viec tang dan guitar hay hoc rieng.',
          },
          {
            optionKey: 'C',
            optionText: 'One teacher for individual coaching',
            isCorrect: false,
            rationale:
              'Chuong trinh co 2 giang vien, khong phai huan luyen ca nhan.',
          },
          {
            optionKey: 'D',
            optionText: 'A monthly transportation allowance',
            isCorrect: false,
            rationale: 'Khong co thong tin tro cap di lai trong doan van.',
          },
        ],
      },
      {
        itemType: 'single_choice',
        title: `Reading Part 7 - Q2 (M${milestone})`,
        stem: 'How often are classes held each week?',
        readingPassage: part7Passage,
        explanation:
          'Lich hoc ghi ro vao thu Ba, thu Tu va thu Nam, tong cong 3 buoi moi tuan.',
        estimatedSeconds: 75,
        options: [
          {
            optionKey: 'A',
            optionText: 'Twice a week',
            isCorrect: false,
            rationale: 'Doan van liet ke 3 ngay hoc, khong phai 2.',
          },
          {
            optionKey: 'B',
            optionText: 'Three times a week',
            isCorrect: true,
            rationale: 'Dung voi thong tin Tuesday, Wednesday, Thursday.',
          },
          {
            optionKey: 'C',
            optionText: 'Four times a week',
            isCorrect: false,
            rationale: 'Khong co ngay hoc thu tu trong lich.',
          },
          {
            optionKey: 'D',
            optionText: 'Every weekday',
            isCorrect: false,
            rationale: 'Lop khong hoc du 5 ngay trong tuan.',
          },
        ],
      },
      {
        itemType: 'single_choice',
        title: `Reading Part 7 - Q3 (M${milestone})`,
        stem: 'What is suggested for people who want to join?',
        readingPassage: part7Passage,
        explanation:
          'Vi so luong chi gioi han 60 hoc vien, thong bao khuyen khich dang ky som.',
        estimatedSeconds: 75,
        options: [
          {
            optionKey: 'A',
            optionText: 'Wait until the first class to register',
            isCorrect: false,
            rationale:
              'Nguoc voi thong diep "early registration is recommended".',
          },
          {
            optionKey: 'B',
            optionText: 'Register early because seats are limited',
            isCorrect: true,
            rationale: 'Khop truc tiep voi noi dung ve gioi han 60 hoc vien.',
          },
          {
            optionKey: 'C',
            optionText: 'Contact the center only on weekends',
            isCorrect: false,
            rationale: 'Thong tin lien he la trong ngay thu trong tuan.',
          },
          {
            optionKey: 'D',
            optionText: 'Bring a recommendation letter',
            isCorrect: false,
            rationale: 'Khong co yeu cau thu gioi thieu trong thong bao.',
          },
        ],
      },
    ];

    return [...part5Items, ...part7Items];
  }

  private buildToeicSeedItems(
    skill: ToeicSeedSkill,
    milestone: number,
  ): ToeicSeedItem[] {
    if (skill === 'reading') {
      return this.buildReadingSeedItems(milestone);
    }

    const isListening = skill === 'listening';
    const questionCount = isListening ? 3 : 5;

    const grammarStems = [
      'The marketing director requested that the final proposal ____ by all team leads before submission.',
      'If the delivery truck arrives before 9 a.m., the warehouse staff ____ unloading immediately.',
      'Neither the supervisors nor the coordinator ____ available to approve overtime requests this afternoon.',
      'The invoice will be processed once the client ____ the missing purchase order number.',
      'By the time the auditors arrive, all supporting files ____ in the shared folder.',
    ];

    const vocabularyStems = [
      'All employees are encouraged to review the updated safety ____ before entering the laboratory.',
      'Because of strong customer demand, the company plans to ____ its evening support service.',
      'The HR manager scheduled a follow-up meeting to discuss staff ____ and retention strategies.',
      'Participants should keep their name badges ____ throughout the conference for security reasons.',
      'The board approved a new policy to improve data ____ across all departments.',
    ];

    const listeningImageUrls = [
      'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1517502884422-41eaead166d4?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1521791055366-0d553872125f?auto=format&fit=crop&w=900&q=80',
    ];
    const listeningAudioUrls = [
      '/sounds/pomodoro/start.mp3',
      '/sounds/pomodoro/pause.mp3',
      '/sounds/pomodoro/stop.mp3',
    ];

    const genericOptions = [
      'At the customer support desk near the lobby.',
      'Before the weekly planning meeting begins.',
      'Because the schedule changed this morning.',
      'After confirming details with the manager.',
    ];

    const items: ToeicSeedItem[] = [];
    for (let i = 1; i <= questionCount; i += 1) {
      const title = `${skill.toUpperCase()} Q${i}`;
      const item: ToeicSeedItem = {
        itemType: 'single_choice',
        title,
        stem: isListening
          ? `Question ${i}: Listen to the audio and choose the best answer.`
          : skill === 'grammar'
            ? grammarStems[(i - 1) % grammarStems.length]
            : vocabularyStems[(i - 1) % vocabularyStems.length],
        readingPassage: isListening
          ? listeningImageUrls[(i - 1) % listeningImageUrls.length]
          : null,
        mediaAudioUrl: isListening
          ? listeningAudioUrls[(i - 1) % listeningAudioUrls.length]
          : null,
        explanation: isListening
          ? 'Nghe ky tu khoa va y chinh trong audio de chon dap an dung.'
          : skill === 'grammar'
            ? 'Xac dinh dang ngu phap phu hop voi cau truc cau va chu ngu cua cau.'
            : 'Chon tu co nghia phu hop nhat voi ngu canh cau van phong cong viec.',
        estimatedSeconds: 60,
        options: [
          {
            optionKey: 'A',
            optionText:
              skill === 'grammar'
                ? 'is reviewed'
                : skill === 'vocabulary'
                  ? 'guidelines'
                  : genericOptions[0],
            isCorrect: true,
            rationale:
              'Dap an dung vi phu hop truc tiep voi ngu canh va thong tin de bai.',
          },
          {
            optionKey: 'B',
            optionText:
              skill === 'grammar'
                ? 'reviewed'
                : skill === 'vocabulary'
                  ? 'implement'
                  : genericOptions[1],
            isCorrect: false,
            rationale:
              'Dap an nhieu kha nang gay nham lan do tu/cum tu gan nghia nhung khong dung voi ngu canh.',
          },
          {
            optionKey: 'C',
            optionText:
              skill === 'grammar'
                ? 'be reviewing'
                : skill === 'vocabulary'
                  ? 'engagement'
                  : genericOptions[2],
            isCorrect: false,
            rationale:
              'Dap an nhieu kha nang gay nham lan do tu/cum tu gan nghia nhung khong dung voi ngu canh.',
          },
          {
            optionKey: 'D',
            optionText:
              skill === 'grammar'
                ? 'has review'
                : skill === 'vocabulary'
                  ? 'visible'
                  : genericOptions[3],
            isCorrect: false,
            rationale:
              'Dap an nhieu kha nang gay nham lan do tu/cum tu gan nghia nhung khong dung voi ngu canh.',
          },
        ],
      };
      items.push(item);
    }

    return items;
  }
>>>>>>> origin/main

  private getEffectiveToeicScore(
    enrollment:
      | Pick<EnrollmentWithTopicProgress, 'current_score'>
      | null
      | undefined,
    planState: ToeicPlanSyncResponseDto,
  ): number {
    const baseScore = Number(
      enrollment?.current_score ?? planState.current_score ?? 300,
    );
    const projectedScore = Number(
      planState.current_score + planState.total_boost,
    );
    return Math.max(baseScore, projectedScore);
  }

<<<<<<< HEAD
=======
  private async ensureToeicRepositorySeedData(): Promise<void> {
    for (const milestone of TOEIC_MILESTONES) {
      for (const skill of [
        'listening',
        'reading',
        'grammar',
        'vocabulary',
      ] as ToeicSeedSkill[]) {
        const seedItems = this.buildToeicSeedItems(skill, milestone);
        const questionCount = seedItems.length;
        const slug = `toeic-${toSlugPart(skill)}-m${milestone}`;
        const repository = await this.prisma.learningRepository.upsert({
          where: { slug },
          update: {
            is_published: true,
            cert_type: 'toeic',
            content_type: 'practice_set',
            skill_area: skill,
            topic_group: `milestone-${milestone}`,
            title: `TOEIC ${skill.toUpperCase()} Milestone ${milestone}`,
            description: `Bai luyen ${skill} theo cot moc ${milestone} diem TOEIC.`,
            difficulty_level:
              milestone >= 700
                ? 'advanced'
                : milestone >= 600
                  ? 'intermediate'
                  : 'beginner',
            target_score_min: calcUnlockScore(milestone),
            target_score_max: calcRangeMax(milestone),
            estimated_minutes: questionCount,
            pass_score: Math.max(2, Math.ceil(questionCount * 0.7)),
            total_items: questionCount,
            metadata: {
              topic_key: `${skill}.toeic_m${milestone}`,
              milestone_score: milestone,
              unlock_score: calcUnlockScore(milestone),
            },
          },
          create: {
            cert_type: 'toeic',
            title: `TOEIC ${skill.toUpperCase()} Milestone ${milestone}`,
            slug,
            description: `Bai luyen ${skill} theo cot moc ${milestone} diem TOEIC.`,
            content_type: 'practice_set',
            skill_area: skill,
            topic_group: `milestone-${milestone}`,
            difficulty_level:
              milestone >= 700
                ? 'advanced'
                : milestone >= 600
                  ? 'intermediate'
                  : 'beginner',
            target_score_min: calcUnlockScore(milestone),
            target_score_max: calcRangeMax(milestone),
            estimated_minutes: questionCount,
            pass_score: Math.max(2, Math.ceil(questionCount * 0.7)),
            metadata: {
              topic_key: `${skill}.toeic_m${milestone}`,
              milestone_score: milestone,
              unlock_score: calcUnlockScore(milestone),
            },
            total_items: questionCount,
            is_published: true,
          },
        });

        for (let i = 0; i < seedItems.length; i += 1) {
          const itemOrder = i + 1;
          const seedItem = seedItems[i];

          const item = await this.prisma.learningRepositoryItem.upsert({
            where: {
              repository_id_item_order: {
                repository_id: repository.id,
                item_order: itemOrder,
              },
            },
            update: {
              item_type: seedItem.itemType,
              title: seedItem.title,
              stem: seedItem.stem,
              reading_passage: seedItem.readingPassage ?? null,
              media_audio_url: seedItem.mediaAudioUrl ?? null,
              explanation: seedItem.explanation,
              estimated_seconds: seedItem.estimatedSeconds,
              score_weight: 1,
            },
            create: {
              repository_id: repository.id,
              item_order: itemOrder,
              item_type: seedItem.itemType,
              title: seedItem.title,
              stem: seedItem.stem,
              reading_passage: seedItem.readingPassage ?? null,
              media_audio_url: seedItem.mediaAudioUrl ?? null,
              explanation: seedItem.explanation,
              estimated_seconds: seedItem.estimatedSeconds,
              score_weight: 1,
            },
          });

          for (
            let optionIndex = 0;
            optionIndex < seedItem.options.length;
            optionIndex += 1
          ) {
            const option = seedItem.options[optionIndex];
            await this.prisma.learningRepositoryOption.upsert({
              where: {
                item_id_option_key: {
                  item_id: item.id,
                  option_key: option.optionKey,
                },
              },
              update: {
                option_text: option.optionText,
                is_correct: option.isCorrect,
                rationale: option.rationale,
                sort_order: optionIndex + 1,
              },
              create: {
                item_id: item.id,
                option_key: option.optionKey,
                option_text: option.optionText,
                is_correct: option.isCorrect,
                rationale: option.rationale,
                sort_order: optionIndex + 1,
              },
            });
          }
        }

        await this.prisma.learningRepositoryItem.deleteMany({
          where: {
            repository_id: repository.id,
            item_order: { gt: questionCount },
          },
        });
      }
    }
  }

>>>>>>> origin/main
  private async getOrCreateActiveToeicEnrollment(
    studentId: number,
  ): Promise<EnrollmentWithTopicProgress> {
    let enrollment = await this.prisma.certificateEnrollment.findFirst({
      where: { student_id: studentId, cert_type: 'toeic', status: 'active' },
      include: { topicProgress: { select: { topic_key: true } } },
      orderBy: { enrolled_at: 'desc' },
    });

    if (enrollment) return enrollment;

    enrollment = await this.prisma.certificateEnrollment.create({
      data: {
        student_id: studentId,
        cert_type: 'toeic',
        status: 'active',
        learning_status: 'not_started',
        progress_percent: 0,
        current_score: 300,
        target_score: 600,
      },
      include: { topicProgress: { select: { topic_key: true } } },
    });

    return enrollment;
  }

  private toDto(row: {
    id: number;
    cert_type: string;
    status: string;
    learning_status?: string;
    progress_percent?: number;
    current_score?: number | null;
    target_score?: number | null;
    enrolled_at: Date;
    completed_at: Date | null;
    topicProgress: { topic_key: string }[];
  }): EnrollmentResponseDto {
    const learningTopics = row.topicProgress
      .map((t) => t.topic_key)
      .filter((topicKey) => !isToeicMetaTopic(topicKey));

    return {
      id: row.id,
      cert_type: row.cert_type,
      status: row.status as 'active' | 'completed',
      learning_status: (row.learning_status as LearningStatus) ?? 'not_started',
      progress_percent: Number(row.progress_percent ?? 0),
      current_score: row.current_score ?? null,
      target_score: row.target_score ?? null,
      enrolled_at: row.enrolled_at,
      completed_at: row.completed_at,
      completed_topics: learningTopics,
      total_topics: getTotalTopics(row.cert_type),
    };
  }

  private parseToeicPlanState(topicKeys: string[]): ToeicPlanSyncResponseDto {
    const state: ToeicPlanSyncResponseDto = {
      current_score: 300,
      target_score: 600,
      total_boost: 0,
      listening_sessions: 0,
      reading_sessions: 0,
      foundation_completed: [],
      foundation_skipped: false,
      first_guide_shown: false,
    };

    for (const key of topicKeys) {
      if (!isToeicMetaTopic(key)) continue;

      if (key.startsWith('__meta.toeic.current.')) {
        state.current_score =
          Number(key.replace('__meta.toeic.current.', '')) ||
          state.current_score;
      } else if (key.startsWith('__meta.toeic.target.')) {
        state.target_score =
          Number(key.replace('__meta.toeic.target.', '')) || state.target_score;
      } else if (key.startsWith('__meta.toeic.boost.')) {
        state.total_boost = Number(key.replace('__meta.toeic.boost.', '')) || 0;
      } else if (key.startsWith('__meta.toeic.listening.')) {
        state.listening_sessions =
          Number(key.replace('__meta.toeic.listening.', '')) || 0;
      } else if (key.startsWith('__meta.toeic.reading.')) {
        state.reading_sessions =
          Number(key.replace('__meta.toeic.reading.', '')) || 0;
      } else if (key === '__meta.toeic.foundation.skip') {
        state.foundation_skipped = true;
      } else if (key === '__meta.toeic.first_guide.shown') {
        state.first_guide_shown = true;
      } else if (key.startsWith('__meta.toeic.foundation.done.')) {
        const topic = key.replace('__meta.toeic.foundation.done.', '');
        if (topic) state.foundation_completed.push(topic);
      }
    }

    state.foundation_completed = Array.from(
      new Set(state.foundation_completed),
    );
    state.target_score = Math.max(state.current_score, state.target_score);

    return state;
  }

  private parseToeicPlanStateFromJson(
    raw: unknown,
    fallbackTopicKeys: string[] = [],
    fallbackScores?: {
      current_score?: number | null;
      target_score?: number | null;
    },
  ): ToeicPlanSyncResponseDto {
    const fromMeta = this.parseToeicPlanState(fallbackTopicKeys);
    const state = (raw ?? {}) as ToeicPlanStateRaw;
    const baseCurrentScore = Number(
      fallbackScores?.current_score ?? fromMeta.current_score ?? 300,
    );
    const baseTargetScore = Number(
      fallbackScores?.target_score ?? fromMeta.target_score ?? 600,
    );
    const resolvedCurrentScore = Number(
      state.current_score ?? baseCurrentScore,
    );
    const resolvedTargetScore = Number(state.target_score ?? baseTargetScore);

    return {
      current_score: resolvedCurrentScore,
      target_score: Number(Math.max(resolvedCurrentScore, resolvedTargetScore)),
      total_boost: Number(state.total_boost ?? fromMeta.total_boost ?? 0),
      listening_sessions: Number(
        state.listening_sessions ?? fromMeta.listening_sessions ?? 0,
      ),
      reading_sessions: Number(
        state.reading_sessions ?? fromMeta.reading_sessions ?? 0,
      ),
      foundation_completed: Array.from(
        new Set(
          Array.isArray(state.foundation_completed)
            ? state.foundation_completed.filter(
                (x): x is string => typeof x === 'string',
              )
            : fromMeta.foundation_completed,
        ),
      ),
      foundation_skipped: Boolean(
        state.foundation_skipped ?? fromMeta.foundation_skipped,
      ),
      first_guide_shown: Boolean(
        state.first_guide_shown ?? fromMeta.first_guide_shown,
      ),
    };
  }

  private async getStudentId(accountId: number): Promise<number> {
    const student = await this.prisma.student.findFirst({
      where: { account_id: accountId },
      select: { student_id: true },
    });
    if (!student)
      throw new NotFoundException('Không tìm thấy thông tin sinh viên.');
    return student.student_id;
  }

  async getEnrollment(
    accountId: number,
    certType: string,
  ): Promise<EnrollmentResponseDto | null> {
    const studentId = await this.getStudentId(accountId);
    const row = await this.prisma.certificateEnrollment.findFirst({
      where: { student_id: studentId, cert_type: certType, status: 'active' },
      include: { topicProgress: { select: { topic_key: true } } },
      orderBy: { enrolled_at: 'desc' },
    });
    return row ? this.toDto(row) : null;
  }

  async getAllEnrollments(accountId: number): Promise<EnrollmentResponseDto[]> {
    const studentId = await this.getStudentId(accountId);
    const rows = await this.prisma.certificateEnrollment.findMany({
      where: { student_id: studentId },
      include: { topicProgress: { select: { topic_key: true } } },
      orderBy: { enrolled_at: 'desc' },
    });
    return rows.map((r) => this.toDto(r));
  }

  async createEnrollment(
    accountId: number,
    dto: CreateEnrollmentDto,
  ): Promise<EnrollmentResponseDto> {
    const studentId = await this.getStudentId(accountId);

    // [DEV MODE] Band progression checks bypassed - freely switch bands for testing
    const existing = await this.prisma.certificateEnrollment.findFirst({
      where: {
        student_id: studentId,
        cert_type: dto.cert_type,
        status: 'active',
      },
    });
    if (existing) {
      await this.prisma.certificateEnrollment.update({
        where: { id: existing.id },
        data: { status: 'completed', completed_at: new Date() },
      });
    }
    const created = await this.prisma.certificateEnrollment.create({
      data: (() => {
        if (dto.cert_type === 'toeic') {
          const mappedTargetScore = resolveToeicTargetScore(dto);
          return {
            student_id: studentId,
            cert_type: dto.cert_type,
            status: 'active' as const,
            learning_status: 'not_started' as const,
            progress_percent: 0,
            current_score: Math.max(10, mappedTargetScore - 120),
            target_score: mappedTargetScore,
          };
        }

        return {
          student_id: studentId,
          cert_type: dto.cert_type,
          status: 'active' as const,
          learning_status: 'not_started' as const,
          progress_percent: 0,
          target_score: getDefaultTargetScore(dto.cert_type),
        };
      })(),
      include: { topicProgress: { select: { topic_key: true } } },
    });
    return this.toDto(created);
  }

  async completeTopic(
    accountId: number,
    enrollmentId: number,
    dto: CompleteTopicDto,
  ): Promise<EnrollmentResponseDto> {
    const studentId = await this.getStudentId(accountId);
    const enrollment = await this.prisma.certificateEnrollment.findFirst({
      where: { id: enrollmentId, student_id: studentId, status: 'active' },
      include: { topicProgress: { select: { topic_key: true } } },
    });
    if (!enrollment)
      throw new NotFoundException('Không tìm thấy enrollment đang active.');

    await this.prisma.certificateTopicProgress.upsert({
      where: {
        enrollment_id_topic_key: {
          enrollment_id: enrollmentId,
          topic_key: dto.topic_key,
        },
      },
      create: { enrollment_id: enrollmentId, topic_key: dto.topic_key },
      update: {},
    });

    const totalTopics = getTotalTopics(enrollment.cert_type);
    const alreadyCompleted = enrollment.topicProgress.some(
      (topic) => topic.topic_key === dto.topic_key,
    );
    const completedCount =
      enrollment.topicProgress.filter(
        (topic) => !isToeicMetaTopic(topic.topic_key),
      ).length + (alreadyCompleted ? 0 : 1);
    const progressPercent = Math.max(
      0,
      Math.min(
        100,
        Math.round((completedCount / Math.max(1, totalTopics)) * 100),
      ),
    );

    const now = new Date();
    if (completedCount >= totalTopics) {
      await this.prisma.certificateEnrollment.update({
        where: { id: enrollmentId },
        data: {
          status: 'completed',
          learning_status: 'completed',
          progress_percent: 100,
          completed_at: now,
          started_at: enrollment.started_at ?? now,
          last_activity_at: now,
        },
      });
    } else {
      await this.prisma.certificateEnrollment.update({
        where: { id: enrollmentId },
        data: {
          learning_status: 'in_progress',
          progress_percent: progressPercent,
          started_at: enrollment.started_at ?? now,
          last_activity_at: now,
          completed_at: null,
          status: 'active',
        },
      });
    }

    const updated = await this.prisma.certificateEnrollment.findUnique({
      where: { id: enrollmentId },
      include: { topicProgress: { select: { topic_key: true } } },
    });
    return this.toDto(updated!);
  }

  async completeBand(
    accountId: number,
    enrollmentId: number,
  ): Promise<EnrollmentResponseDto> {
    const studentId = await this.getStudentId(accountId);
    const enrollment = await this.prisma.certificateEnrollment.findFirst({
      where: { id: enrollmentId, student_id: studentId, status: 'active' },
      include: { topicProgress: { select: { topic_key: true } } },
    });
    if (!enrollment)
      throw new NotFoundException('Không tìm thấy enrollment đang active.');

    const updated = await this.prisma.certificateEnrollment.update({
      where: { id: enrollmentId },
      data: {
        status: 'completed',
        learning_status: 'completed',
        progress_percent: 100,
        completed_at: new Date(),
        started_at: enrollment.started_at ?? new Date(),
        last_activity_at: new Date(),
      },
      include: { topicProgress: { select: { topic_key: true } } },
    });
    return this.toDto(updated);
  }

  async getToeicPlanState(
    accountId: number,
  ): Promise<ToeicPlanSyncResponseDto | null> {
    const studentId = await this.getStudentId(accountId);
    const enrollment = await this.prisma.certificateEnrollment.findFirst({
      where: { student_id: studentId, cert_type: 'toeic', status: 'active' },
      include: { topicProgress: { select: { topic_key: true } } },
      orderBy: { enrolled_at: 'desc' },
    });

    if (!enrollment) return null;
    const keys = enrollment.topicProgress.map((t) => t.topic_key);
    const fallbackScores = {
      current_score: enrollment.current_score,
      target_score: enrollment.target_score,
    };
    return this.parseToeicPlanStateFromJson(
      enrollment.toeic_plan_state,
      keys,
      fallbackScores,
    );
  }

  async saveToeicPlanState(
    accountId: number,
    dto: ToeicPlanSyncDto,
  ): Promise<ToeicPlanSyncResponseDto> {
    const studentId = await this.getStudentId(accountId);
    let enrollment = await this.prisma.certificateEnrollment.findFirst({
      where: { student_id: studentId, cert_type: 'toeic', status: 'active' },
      include: { topicProgress: { select: { topic_key: true } } },
      orderBy: { enrolled_at: 'desc' },
    });

    if (!enrollment) {
      const currentScore = Math.max(10, Math.round(dto.current_score ?? 300));
      const targetScore = Math.max(
        currentScore,
        Math.round(dto.target_score ?? 600),
      );

      enrollment = await this.prisma.certificateEnrollment.create({
        data: {
          student_id: studentId,
          cert_type: 'toeic',
          status: 'active',
          learning_status: 'not_started',
          progress_percent: 0,
          current_score: currentScore,
          target_score: targetScore,
        },
        include: { topicProgress: { select: { topic_key: true } } },
      });
    }

    const existingState = this.parseToeicPlanStateFromJson(
      enrollment.toeic_plan_state,
      (enrollment.topicProgress ?? []).map((t) => t.topic_key),
      {
        current_score: enrollment.current_score,
        target_score: enrollment.target_score,
      },
    );

    const currentScore = Math.max(
      10,
      Math.round(dto.current_score ?? existingState.current_score ?? 300),
    );
    const targetScore = Math.max(
      currentScore,
      Math.round(dto.target_score ?? existingState.target_score ?? 600),
    );

    const previousTarget = Number(
      enrollment.target_score ?? existingState.target_score ?? targetScore,
    );
    const targetChanged = targetScore !== previousTarget;

    const guideCompleted =
      dto.first_guide_shown === undefined
        ? Boolean(existingState.first_guide_shown)
        : Boolean(dto.first_guide_shown);

    const rawExistingState =
      (enrollment.toeic_plan_state as ToeicPlanStateRaw | null) ?? null;

    const now = new Date();
    const goalStartScore = targetChanged
      ? currentScore
      : Number(
          rawExistingState?.goal_start_score ??
            enrollment.current_score ??
            currentScore,
        );

    const nextState: ToeicPlanStateRaw = {
      current_score: currentScore,
      target_score: targetScore,
      total_boost: Math.max(
        0,
        Math.round(dto.total_boost ?? existingState.total_boost ?? 0),
      ),
      goal_start_score: goalStartScore,
      listening_sessions: Math.max(
        0,
        Math.round(
          dto.listening_sessions ?? existingState.listening_sessions ?? 0,
        ),
      ),
      reading_sessions: Math.max(
        0,
        Math.round(dto.reading_sessions ?? existingState.reading_sessions ?? 0),
      ),
      foundation_completed: Array.isArray(dto.foundation_completed)
        ? dto.foundation_completed.filter(
            (x): x is string => typeof x === 'string' && x.length > 0,
          )
        : existingState.foundation_completed,
      foundation_skipped: Boolean(
        dto.foundation_skipped ?? existingState.foundation_skipped,
      ),
      first_guide_shown: guideCompleted,
    };

    const hasActivity =
      dto.has_activity === true ||
      Number(nextState.total_boost ?? 0) >
        Number(existingState.total_boost ?? 0) ||
      Number(nextState.listening_sessions ?? 0) >
        Number(existingState.listening_sessions ?? 0) ||
      Number(nextState.reading_sessions ?? 0) >
        Number(existingState.reading_sessions ?? 0);
    const progressPercent = toPercent(
      currentScore,
      goalStartScore,
      targetScore,
    );

    let learningStatus =
      (enrollment.learning_status as LearningStatus | undefined) ??
      'not_started';
    if (targetChanged) {
      learningStatus =
        currentScore >= targetScore ? 'completed' : 'not_started';
    } else if (currentScore >= targetScore) {
      learningStatus = 'completed';
    } else if (learningStatus === 'not_started' && hasActivity) {
      learningStatus = 'in_progress';
    } else if (learningStatus !== 'completed' && hasActivity) {
      learningStatus = 'in_progress';
    }

    const updated = await this.prisma.certificateEnrollment.update({
      where: { id: enrollment.id },
      data: {
        toeic_plan_state: nextState,
        current_score: currentScore,
        target_score: targetScore,
        progress_percent: progressPercent,
        learning_status: learningStatus,
        started_at:
          learningStatus === 'in_progress' || learningStatus === 'completed'
            ? (enrollment.started_at ?? now)
            : null,
        last_activity_at: hasActivity ? now : enrollment.last_activity_at,
        status: 'active',
        completed_at: learningStatus === 'completed' ? now : null,
      },
      include: { topicProgress: { select: { topic_key: true } } },
    });

    return this.parseToeicPlanStateFromJson(
      updated.toeic_plan_state,
      (updated.topicProgress ?? []).map((t) => t.topic_key),
      {
        current_score: updated.current_score,
        target_score: updated.target_score,
      },
    );
  }

  async getToeicLeaderboard(
    accountId: number,
    limit: number,
  ): Promise<ToeicLeaderboardEntryDto[]> {
    const studentId = await this.getStudentId(accountId);
    const safeLimit = Math.max(1, Math.min(30, Math.round(limit || 10)));

    const rows = await this.prisma.certificateEnrollment.findMany({
      where: { cert_type: 'toeic', status: 'active' },
      include: {
        student: {
          include: {
            account: {
              include: { profile: true },
            },
          },
        },
      },
      orderBy: { updated_at: 'desc' },
      take: safeLimit,
    });

    return rows
      .map((row: ToeicEnrollmentLeaderboardRow) => {
        const plan = this.parseToeicPlanStateFromJson(
          row.toeic_plan_state,
          [],
          {
            current_score: row.current_score,
            target_score: row.target_score,
          },
        );
        const score = Math.max(
          10,
          Math.min(990, Math.round(plan.current_score + plan.total_boost)),
        );

        const name =
          row.student?.account?.profile?.full_name ||
          row.student?.student_code ||
          `Student ${row.student_id}`;

        return {
          account_id: Number(row.student?.account_id ?? 0),
          name: String(name),
          score,
          streak: Number(plan.listening_sessions + plan.reading_sessions),
          isCurrentUser: Number(row.student_id) === Number(studentId),
        } satisfies ToeicLeaderboardEntryDto;
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, safeLimit);
  }

  private toSafeSlug(raw: string): string {
    const normalized = raw
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    if (normalized.length > 0) return normalized;
    return `toeic-repo-${Date.now()}`;
  }

  private normalizeImportKey(raw: string): string {
    return raw
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');
  }

  private normalizeImportRow(row: Record<string, unknown>): ParsedImportRow {
    const normalized: ParsedImportRow = {};
    for (const [key, value] of Object.entries(row)) {
      const normalizedKey = this.normalizeImportKey(String(key));
      if (!normalizedKey) continue;

      if (typeof value === 'string') {
        normalized[normalizedKey] = value.trim();
      } else if (typeof value === 'number' || typeof value === 'boolean') {
        normalized[normalizedKey] = String(value).trim();
      } else {
        normalized[normalizedKey] = '';
      }
    }
    return normalized;
  }

  private async parseImportRowsFromFile(
    file: Express.Multer.File,
  ): Promise<ParsedImportRow[]> {
    if (!file?.path) {
      throw new BadRequestException('Khong tim thay file import.');
    }

    const extension = extname(file.originalname || file.path).toLowerCase();
    if (extension === '.json') {
      const raw = await readFile(file.path, 'utf8');
      const parsed = JSON.parse(raw) as unknown;
      const rows = Array.isArray(parsed)
        ? parsed
        : parsed && typeof parsed === 'object' && 'rows' in parsed
          ? (parsed as { rows: unknown }).rows
          : [];

      if (!Array.isArray(rows)) {
<<<<<<< HEAD
        throw new BadRequestException(
          'File JSON khong dung dinh dang mang dong.',
        );
=======
        throw new BadRequestException('File JSON khong dung dinh dang mang dong.');
>>>>>>> origin/main
      }

      return rows
        .filter(
          (item): item is Record<string, unknown> =>
            Boolean(item) && typeof item === 'object' && !Array.isArray(item),
        )
        .map((item) => this.normalizeImportRow(item));
    }

    const workbook = XLSX.readFile(file.path);
    const firstSheetName = workbook.SheetNames[0];
    if (!firstSheetName) {
      throw new BadRequestException('File import khong co worksheet.');
    }
    const sheet = workbook.Sheets[firstSheetName];
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
      defval: '',
    });

    return rows.map((row) => this.normalizeImportRow(row));
  }

  private parseKeywordList(
    source: string | undefined,
    fallback: string[],
  ): string[] {
    if (!source || source.trim().length === 0) {
      return fallback;
    }

    return source
      .split(',')
      .map((item) => item.trim().toLowerCase())
      .filter((item) => item.length > 0);
  }

  private rowValue(row: ParsedImportRow, aliases: string[]): string {
    for (const alias of aliases) {
      const value = row[this.normalizeImportKey(alias)];
      if (typeof value === 'string' && value.trim().length > 0) {
        return value.trim();
      }
    }
    return '';
  }

  private sectionMatchesReading(
    sectionText: string,
    requiredKeywords: string[],
    excludedKeywords: string[],
    strictFilter: boolean,
  ): boolean {
    const normalizedSection = sectionText.trim().toLowerCase();
    if (normalizedSection.length === 0) {
      return !strictFilter;
    }

    for (const keyword of excludedKeywords) {
      if (normalizedSection.includes(keyword)) {
        return false;
      }
    }

    if (requiredKeywords.length === 0) return true;
<<<<<<< HEAD
    return requiredKeywords.some((keyword) =>
      normalizedSection.includes(keyword),
    );
  }

  private buildReadingOptionsFromRow(
    row: ParsedImportRow,
  ): ParsedImportOption[] {
    const correctAnswerRaw = this.rowValue(row, [
      'correct_answer',
      'correct_option',
      'answer_key',
      'answer',
    ]).toUpperCase();

    const optionEntries: Array<{
      key: string;
      text: string;
      rationale: string;
    }> = [
=======
    return requiredKeywords.some((keyword) => normalizedSection.includes(keyword));
  }

  private buildReadingOptionsFromRow(row: ParsedImportRow): ParsedImportOption[] {
    const correctAnswerRaw = this
      .rowValue(row, ['correct_answer', 'correct_option', 'answer_key', 'answer'])
      .toUpperCase();

    const optionEntries: Array<{ key: string; text: string; rationale: string }> = [
>>>>>>> origin/main
      {
        key: 'A',
        text: this.rowValue(row, ['option_a', 'a', 'choice_a']),
        rationale: this.rowValue(row, ['rationale_a']),
      },
      {
        key: 'B',
        text: this.rowValue(row, ['option_b', 'b', 'choice_b']),
        rationale: this.rowValue(row, ['rationale_b']),
      },
      {
        key: 'C',
        text: this.rowValue(row, ['option_c', 'c', 'choice_c']),
        rationale: this.rowValue(row, ['rationale_c']),
      },
      {
        key: 'D',
        text: this.rowValue(row, ['option_d', 'd', 'choice_d']),
        rationale: this.rowValue(row, ['rationale_d']),
      },
    ];

    const options = optionEntries
      .filter((entry) => entry.text.length > 0)
      .map((entry) => ({
        optionKey: entry.key,
        optionText: entry.text,
        isCorrect: entry.key === correctAnswerRaw,
        rationale: entry.rationale || null,
      }));

    if (!options.some((option) => option.isCorrect) && options.length > 0) {
      options[0] = {
        ...options[0],
        isCorrect: true,
      };
    }

    return options;
  }

  private async getOrCreateToeicRepositoryForImport(
    dto: Pick<
      ToeicReadingImportDto,
      | 'repository_slug'
      | 'repository_title'
      | 'repository_description'
      | 'milestone_score'
      | 'unlock_score'
    >,
    skillArea: 'reading' | 'listening',
  ): Promise<{ id: number; slug: string }> {
    const now = Date.now();
    const fallbackSlug = `toeic-${skillArea}-custom-${now}`;
    const slug = this.toSafeSlug(dto.repository_slug ?? fallbackSlug);

    const milestoneScore = Number(dto.milestone_score ?? 600);
<<<<<<< HEAD
    const unlockScore = Number(
      dto.unlock_score ?? Math.max(300, milestoneScore - 50),
    );
=======
    const unlockScore = Number(dto.unlock_score ?? Math.max(300, milestoneScore - 50));
>>>>>>> origin/main

    const repository = await this.prisma.learningRepository.upsert({
      where: { slug },
      update: {
        cert_type: 'toeic',
<<<<<<< HEAD
        title:
          dto.repository_title ??
          `TOEIC ${skillArea.toUpperCase()} Custom ${now}`,
=======
        title: dto.repository_title ?? `TOEIC ${skillArea.toUpperCase()} Custom ${now}`,
>>>>>>> origin/main
        description: dto.repository_description ?? null,
        content_type: 'practice_set',
        skill_area: skillArea,
        is_published: true,
        target_score_min: unlockScore,
        target_score_max: milestoneScore + 99,
        metadata: {
          topic_key: `${skillArea}.custom_${slug}`,
          milestone_score: milestoneScore,
          unlock_score: unlockScore,
          source: 'manual_import',
        },
      },
      create: {
        cert_type: 'toeic',
<<<<<<< HEAD
        title:
          dto.repository_title ??
          `TOEIC ${skillArea.toUpperCase()} Custom ${now}`,
=======
        title: dto.repository_title ?? `TOEIC ${skillArea.toUpperCase()} Custom ${now}`,
>>>>>>> origin/main
        slug,
        description: dto.repository_description ?? null,
        content_type: 'practice_set',
        skill_area: skillArea,
        is_published: true,
        target_score_min: unlockScore,
        target_score_max: milestoneScore + 99,
        estimated_minutes: 1,
        pass_score: 1,
        metadata: {
          topic_key: `${skillArea}.custom_${slug}`,
          milestone_score: milestoneScore,
          unlock_score: unlockScore,
          source: 'manual_import',
        },
      },
      select: { id: true, slug: true },
    });

    return repository;
  }

  async importToeicReadingFromFile(
    dto: ToeicReadingImportDto,
    file: Express.Multer.File,
  ): Promise<ToeicReadingImportResponseDto> {
    if (!file) {
      throw new BadRequestException('Vui long gui file reading de import.');
    }

    const rows = await this.parseImportRowsFromFile(file);
    if (rows.length === 0) {
      throw new BadRequestException('Khong doc duoc du lieu tu file import.');
    }

    const requiredKeywords = this.parseKeywordList(
      dto.required_section_keywords,
      DEFAULT_READING_REQUIRED_KEYWORDS,
    );
    const excludedKeywords = this.parseKeywordList(
      dto.excluded_section_keywords,
      DEFAULT_READING_EXCLUDED_KEYWORDS,
    );
    const strictFilter = Boolean(dto.strict_section_filter);

<<<<<<< HEAD
    const repository = await this.getOrCreateToeicRepositoryForImport(
      dto,
      'reading',
    );
=======
    const repository = await this.getOrCreateToeicRepositoryForImport(dto, 'reading');
>>>>>>> origin/main

    const lastItem = await this.prisma.learningRepositoryItem.findFirst({
      where: { repository_id: repository.id },
      orderBy: { item_order: 'desc' },
      select: { item_order: true },
    });

    let nextItemOrder = Number(lastItem?.item_order ?? 0) + 1;
    let importedCount = 0;
    let skippedCount = 0;

    for (const row of rows) {
      const sectionText = this.rowValue(row, [
        'section',
        'section_title',
        'part',
        'part_title',
        'skill_area',
      ]);

      const isReading = this.sectionMatchesReading(
        sectionText,
        requiredKeywords,
        excludedKeywords,
        strictFilter,
      );

      if (!isReading) {
        skippedCount += 1;
        continue;
      }

<<<<<<< HEAD
      const stem = this.rowValue(row, [
        'stem',
        'question',
        'question_text',
        'content',
      ]);
=======
      const stem = this.rowValue(row, ['stem', 'question', 'question_text', 'content']);
>>>>>>> origin/main
      if (!stem) {
        skippedCount += 1;
        continue;
      }

      const options = this.buildReadingOptionsFromRow(row);
      if (options.length < 2 || !options.some((option) => option.isCorrect)) {
        skippedCount += 1;
        continue;
      }

      const createdItem = await this.prisma.learningRepositoryItem.create({
        data: {
          repository_id: repository.id,
          item_order: nextItemOrder,
          item_type: this.rowValue(row, ['item_type']) || 'single_choice',
          title: this.rowValue(row, ['title', 'question_title']) || null,
          stem,
          reading_passage:
<<<<<<< HEAD
            this.rowValue(row, ['reading_passage', 'passage', 'paragraph']) ||
            null,
          explanation: this.rowValue(row, ['explanation']) || null,
          estimated_seconds: Number(
            this.rowValue(row, ['estimated_seconds']) || 60,
          ),
=======
            this.rowValue(row, ['reading_passage', 'passage', 'paragraph']) || null,
          explanation: this.rowValue(row, ['explanation']) || null,
          estimated_seconds: Number(this.rowValue(row, ['estimated_seconds']) || 60),
>>>>>>> origin/main
          score_weight: 1,
        },
        select: { id: true },
      });

      await this.prisma.learningRepositoryOption.createMany({
        data: options.map((option, index) => ({
          item_id: createdItem.id,
          option_key: option.optionKey,
          option_text: option.optionText,
          is_correct: option.isCorrect,
          rationale: option.rationale ?? null,
          sort_order: index + 1,
        })),
      });

      importedCount += 1;
      nextItemOrder += 1;
    }

    const totalItems = await this.prisma.learningRepositoryItem.count({
      where: { repository_id: repository.id },
    });

    await this.prisma.learningRepository.update({
      where: { id: repository.id },
      data: {
        total_items: totalItems,
        estimated_minutes: Math.max(1, totalItems),
        pass_score: Math.max(1, Math.ceil(totalItems * 0.7)),
      },
    });

    return {
      repository_id: repository.id,
      slug: repository.slug,
      imported_count: importedCount,
      skipped_count: skippedCount,
      total_rows: rows.length,
    };
  }

  private parseListeningOptionsFromDto(
    dto: ToeicManualListeningCreateDto,
  ): ParsedImportOption[] {
    if (dto.options_json && dto.options_json.trim().length > 0) {
      const parsed = JSON.parse(dto.options_json) as unknown;
      if (!Array.isArray(parsed)) {
        throw new BadRequestException('options_json phai la mang JSON hop le.');
      }

      const normalized = parsed
        .filter(
          (item): item is ParsedListeningOption =>
            Boolean(item) && typeof item === 'object' && !Array.isArray(item),
        )
        .map((item) => ({
<<<<<<< HEAD
          optionKey: String(item.option_key ?? '')
            .toUpperCase()
            .trim(),
=======
          optionKey: String(item.option_key ?? '').toUpperCase().trim(),
>>>>>>> origin/main
          optionText: String(item.option_text ?? '').trim(),
          isCorrect: Boolean(item.is_correct),
          rationale: item.rationale ? String(item.rationale) : null,
        }))
<<<<<<< HEAD
        .filter(
          (item) => item.optionKey.length > 0 && item.optionText.length > 0,
        );

      if (normalized.length === 0) {
        throw new BadRequestException(
          'Khong co dap an hop le trong options_json.',
        );
      }

      if (!normalized.some((item) => item.isCorrect)) {
        throw new BadRequestException(
          'options_json phai co it nhat mot dap an dung.',
        );
=======
        .filter((item) => item.optionKey.length > 0 && item.optionText.length > 0);

      if (normalized.length === 0) {
        throw new BadRequestException('Khong co dap an hop le trong options_json.');
      }

      if (!normalized.some((item) => item.isCorrect)) {
        throw new BadRequestException('options_json phai co it nhat mot dap an dung.');
>>>>>>> origin/main
      }

      return normalized;
    }

    const manualOptions: ParsedImportOption[] = [
      {
        optionKey: 'A',
        optionText: dto.option_a?.trim() ?? '',
        isCorrect: dto.correct_option_key?.toUpperCase().trim() === 'A',
      },
      {
        optionKey: 'B',
        optionText: dto.option_b?.trim() ?? '',
        isCorrect: dto.correct_option_key?.toUpperCase().trim() === 'B',
      },
      {
        optionKey: 'C',
        optionText: dto.option_c?.trim() ?? '',
        isCorrect: dto.correct_option_key?.toUpperCase().trim() === 'C',
      },
      {
        optionKey: 'D',
        optionText: dto.option_d?.trim() ?? '',
        isCorrect: dto.correct_option_key?.toUpperCase().trim() === 'D',
      },
    ].filter((option) => option.optionText.length > 0);

    if (manualOptions.length < 2) {
<<<<<<< HEAD
      throw new BadRequestException(
        'Can toi thieu 2 dap an cho cau hoi listening.',
      );
    }
    if (!manualOptions.some((option) => option.isCorrect)) {
      throw new BadRequestException(
        'Ban phai chi dinh correct_option_key hop le.',
      );
=======
      throw new BadRequestException('Can toi thieu 2 dap an cho cau hoi listening.');
    }
    if (!manualOptions.some((option) => option.isCorrect)) {
      throw new BadRequestException('Ban phai chi dinh correct_option_key hop le.');
>>>>>>> origin/main
    }
    return manualOptions;
  }

  async createToeicListeningManualItem(
    dto: ToeicManualListeningCreateDto,
    audioFile?: Express.Multer.File,
    imageFile?: Express.Multer.File,
  ): Promise<ToeicManualListeningCreateResponseDto> {
<<<<<<< HEAD
    const repository = await this.getOrCreateToeicRepositoryForImport(
      dto,
      'listening',
    );
=======
    const repository = await this.getOrCreateToeicRepositoryForImport(dto, 'listening');
>>>>>>> origin/main
    const options = this.parseListeningOptionsFromDto(dto);

    const existingLast = await this.prisma.learningRepositoryItem.findFirst({
      where: { repository_id: repository.id },
      orderBy: { item_order: 'desc' },
      select: { item_order: true },
    });
<<<<<<< HEAD
    const nextOrder = Number(
      dto.item_order ?? Number(existingLast?.item_order ?? 0) + 1,
    );
=======
    const nextOrder = Number(dto.item_order ?? Number(existingLast?.item_order ?? 0) + 1);
>>>>>>> origin/main

    const audioUrl = audioFile?.filename
      ? `/uploads/certificate/${basename(audioFile.filename)}`
      : null;
    const imageUrl = imageFile?.filename
      ? `/uploads/certificate/${basename(imageFile.filename)}`
      : null;

    const createdItem = await this.prisma.learningRepositoryItem.create({
      data: {
        repository_id: repository.id,
        item_order: nextOrder,
        item_type: 'single_choice',
        title: dto.title?.trim() || null,
        stem: dto.stem.trim(),
        reading_passage: dto.reading_passage?.trim() || null,
        explanation: dto.explanation?.trim() || null,
        estimated_seconds: Number(dto.estimated_seconds ?? 45),
        media_audio_url: audioUrl,
        media_image_url: imageUrl,
        score_weight: 1,
      },
      select: { id: true, item_order: true },
    });

    await this.prisma.learningRepositoryOption.createMany({
      data: options.map((option, index) => ({
        item_id: createdItem.id,
        option_key: option.optionKey,
        option_text: option.optionText,
        is_correct: option.isCorrect,
        rationale: option.rationale ?? null,
        sort_order: index + 1,
      })),
    });

    const totalItems = await this.prisma.learningRepositoryItem.count({
      where: { repository_id: repository.id },
    });

    await this.prisma.learningRepository.update({
      where: { id: repository.id },
      data: {
        total_items: totalItems,
        estimated_minutes: Math.max(1, totalItems),
        pass_score: Math.max(1, Math.ceil(totalItems * 0.7)),
      },
    });

    return {
      repository_id: repository.id,
      slug: repository.slug,
      item_id: createdItem.id,
      item_order: createdItem.item_order,
      media_audio_url: audioUrl,
      media_image_url: imageUrl,
    };
  }

  private buildExplanationCachePath(cacheKey: string): string {
    const hash = createHash('sha256').update(cacheKey).digest('hex');
<<<<<<< HEAD
    return join(
      process.cwd(),
      'uploads',
      'certificate',
      'ai-cache',
      `${hash}.json`,
    );
=======
    return join(process.cwd(), 'uploads', 'certificate', 'ai-cache', `${hash}.json`);
>>>>>>> origin/main
  }

  private async readExplanationCache(
    cachePath: string,
  ): Promise<FileCacheExplanation | null> {
    try {
      await access(cachePath, fsConstants.F_OK);
      const raw = await readFile(cachePath, 'utf8');
      const parsed = JSON.parse(raw) as unknown;
      if (!parsed || typeof parsed !== 'object') return null;
      const record = parsed as Record<string, unknown>;
      const explanation =
        typeof record.explanation === 'string' ? record.explanation : undefined;
      const model = typeof record.model === 'string' ? record.model : undefined;
      const createdAt =
        typeof record.created_at === 'string' ? record.created_at : undefined;
      if (!explanation || !model || !createdAt) return null;
      return { explanation, model, created_at: createdAt };
    } catch {
      return null;
    }
  }

  private async writeExplanationCache(
    cachePath: string,
    payload: FileCacheExplanation,
  ): Promise<void> {
    await mkdir(join(process.cwd(), 'uploads', 'certificate', 'ai-cache'), {
      recursive: true,
    });
    await writeFile(cachePath, JSON.stringify(payload), 'utf8');
  }

  private buildFallbackExplanation(
    stem: string,
<<<<<<< HEAD
    _selectedOptionText: string,
    correctOptionText: string,
    _isCorrect: boolean,
    baseExplanation: string | null,
  ): string {
    return buildExplanationFallback(stem, correctOptionText, baseExplanation);
=======
    selectedOptionText: string,
    correctOptionText: string,
    isCorrect: boolean,
    baseExplanation: string | null,
  ): string {
    if (isCorrect) {
      return (
        'Ban da chon dung dap an. ' +
        (baseExplanation && baseExplanation.trim().length > 0
          ? baseExplanation.trim()
          : `Dap an phu hop voi ngu canh cua cau hoi: "${stem}".`)
      );
    }

    const explanationPart =
      baseExplanation && baseExplanation.trim().length > 0
        ? ` ${baseExplanation.trim()}`
        : '';

    return `Ban chon "${selectedOptionText}" nhung dap an dung la "${correctOptionText}".${explanationPart}`;
>>>>>>> origin/main
  }

  private async callOllamaExplanation(
    prompt: string,
    model: string,
  ): Promise<string> {
    const baseUrl =
<<<<<<< HEAD
      process.env.OLLAMA_BASE_URL?.trim() ||
      'http://127.0.0.1:11434/api/generate';

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), OLLAMA_TIMEOUT_MS);

    let response: Response;
    try {
      response = await fetch(baseUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          model,
          prompt,
          stream: false,
          options: OLLAMA_EXPLANATION_OPTIONS,
        }),
      });
    } catch (err: unknown) {
      const isAbort = err instanceof Error && err.name === 'AbortError';
      throw new BadRequestException(
        isAbort
          ? 'Ollama timeout — model phản hồi quá chậm. Thử lại sau.'
          : 'Không thể kết nối Ollama. Hãy kiểm tra service đang chạy.',
      );
    } finally {
      clearTimeout(timeoutId);
    }

    if (!response.ok) {
      throw new BadRequestException(
        `Ollama trả về lỗi HTTP ${response.status}.`,
      );
    }

    const payload = (await response.json()) as OllamaGenerateResponse;
    const raw =
      typeof payload.response === 'string' ? payload.response.trim() : '';
    if (!raw || raw.length < 10) {
      throw new BadRequestException('Ollama không trả về nội dung giải thích.');
    }

    // Plain text response (no JSON parsing needed since format: json was removed)
    return this.normalizeExplanationForDisplay(raw);
  }

  private resolveOllamaModel(certType: string): string {
    const envKey = `OLLAMA_MODEL_${certType.toUpperCase().replace(/-/g, '_')}`;
    const certSpecificModel = process.env[envKey]?.trim();
    if (certSpecificModel && certSpecificModel.length > 0) {
      return certSpecificModel;
    }
    return process.env.OLLAMA_MODEL?.trim() || 'qwen2.5:3b';
  }

  private extractTutorAnswerFromRaw(raw: string): string {
    const trimmed = raw.trim();
    if (!trimmed) return '';

    const decodeAnswer = (value: string): string =>
      value.replace(/\\n/g, '\n').replace(/\\"/g, '"').trim();

    const parseJsonCandidate = (candidate: string): string | null => {
      try {
        const parsed = JSON.parse(candidate) as unknown;
        if (!parsed || typeof parsed !== 'object') return null;
        const answer = (parsed as Record<string, unknown>).answer;
        if (typeof answer !== 'string') return null;
        const normalized = answer.trim();
        return normalized.length > 0 ? normalized : null;
      } catch {
        return null;
      }
    };

    const directParsed = parseJsonCandidate(trimmed);
    if (directParsed) return directParsed;

    const fencedMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
    if (fencedMatch?.[1]) {
      const fencedParsed = parseJsonCandidate(fencedMatch[1].trim());
      if (fencedParsed) return fencedParsed;
    }

    const inlineAnswerMatch = trimmed.match(/"answer"\s*:\s*"([\s\S]*?)"/i);
    if (inlineAnswerMatch?.[1]) {
      return decodeAnswer(inlineAnswerMatch[1]);
    }

    // Fallback to plain text if model did not follow JSON format strictly.
    return trimmed;
  }

  private buildTutorCachePath(cacheKey: string): string {
    const hash = createHash('sha256').update(cacheKey).digest('hex');
    return join(
      process.cwd(),
      'uploads',
      'certificate',
      'ai-cache',
      'tutor',
      `${hash}.json`,
    );
  }

  private async readTutorCache(
    cachePath: string,
  ): Promise<FileCacheTutorAnswer | null> {
    try {
      await access(cachePath, fsConstants.F_OK);
      const raw = await readFile(cachePath, 'utf8');
      const parsed = JSON.parse(raw) as unknown;
      if (!parsed || typeof parsed !== 'object') return null;
      const record = parsed as Record<string, unknown>;
      const answer =
        typeof record.answer === 'string' ? record.answer : undefined;
      const model = typeof record.model === 'string' ? record.model : undefined;
      const createdAt =
        typeof record.created_at === 'string' ? record.created_at : undefined;
      if (!answer || !model || !createdAt) return null;
      return { answer, model, created_at: createdAt };
    } catch {
      return null;
    }
  }

  private async writeTutorCache(
    cachePath: string,
    payload: FileCacheTutorAnswer,
  ): Promise<void> {
    await mkdir(
      join(process.cwd(), 'uploads', 'certificate', 'ai-cache', 'tutor'),
      {
        recursive: true,
      },
    );
    await writeFile(cachePath, JSON.stringify(payload), 'utf8');
  }

  private buildTutorPrompt(
    certType: string,
    dto: CertificateTutorAskDto,
    enrollmentSummary: string,
  ): string {
    const hintOnly =
      dto.question.includes('[HINT_ONLY]') ||
      dto.learning_context?.includes('[HINT_ONLY]') === true;
    const fullExplanation =
      dto.question.includes('[FULL_EXPLANATION]') ||
      dto.learning_context?.includes('[FULL_EXPLANATION]') === true;

    // Strip internal tags before sending to model
    const cleanQuestion = dto.question
      .trim()
      .replace(/^\[FULL_EXPLANATION\]\s*/i, '')
      .replace(/^\[HINT_ONLY\]\s*/i, '')
      .trim();

    return buildTutorPromptFromFile({
      certType,
      questionText: cleanQuestion,
      learningContext: dto.learning_context,
      enrollmentSummary,
      topicKey: dto.topic_key,
      hintOnly,
      fullExplanation,
      concise: dto.concise,
    });
  }

  private normalizeHintOnlyQuestionInput(dto: CertificateTutorAskDto): string {
    const rawQuestion = dto.question.trim();
    const sentenceMatch = rawQuestion.match(/Câu\s*hỏi:\s*([^\n\r]+)/i);
    const selectedMatch = rawQuestion.match(
      /Học\s*viên\s*chọn:\s*[A-D][.):-]?\s*([^\n\r]+)/i,
    );

    const sentence = sentenceMatch?.[1]?.trim() ?? '';
    const selectedText = selectedMatch?.[1]?.trim() ?? '';

    const optionMatches = Array.from(
      (dto.learning_context ?? '').matchAll(
        /(?:^|\n)\s*[A-D][.):-]\s*([^\n\r]+)/gi,
      ),
    )
      .map((match) => match[1]?.trim() ?? '')
      .filter((value) => value.length > 0);

    const uniqueOptions = Array.from(new Set(optionMatches));
    const alternatives = selectedText
      ? uniqueOptions.filter(
          (option) => option.toLowerCase() !== selectedText.toLowerCase(),
        )
      : uniqueOptions;

    const normalizedParts: string[] = [];
    if (sentence) {
      normalizedParts.push(`Câu gốc: ${sentence}`);
    }
    if (selectedText) {
      normalizedParts.push(`Lựa chọn học viên vừa chọn: ${selectedText}`);
    }
    if (alternatives.length > 0) {
      normalizedParts.push(
        `Các phương án còn lại (không gán chữ cái): ${alternatives.join(' | ')}`,
      );
    }

    normalizedParts.push(
      'Mục tiêu: giải thích vì sao lựa chọn học viên vừa chọn chưa phù hợp và gợi ý cách tự kiểm tra.',
    );

    return normalizedParts.join('\n');
  }

  private sanitizeHintOnlyLearningContext(context?: string): string {
    if (!context) return '';
    return context
      .split(/\r?\n/)
      .filter((line) => !/^\s*[A-D][.):-]\s+/.test(line))
      .join('\n')
      .trim();
  }

  private extractHintQuestionSentence(dto: CertificateTutorAskDto): string {
    const sentenceMatch = dto.question.match(/Câu\s*hỏi:\s*([^\n\r]+)/i);
    return sentenceMatch?.[1]?.trim() ?? '';
  }

  private extractHintQuestionEvidence(sentence: string): string {
    if (!sentence) return '';
    const normalized = sentence.replace(/\s+/g, ' ').trim();
    if (!normalized) return '';

    const blankSnippetMatch = normalized.match(
      /[^.!?\n\r]{0,32}_{2,}[^.!?\n\r]{0,32}/,
    );
    if (blankSnippetMatch?.[0]) {
      return `"${blankSnippetMatch[0].trim()}"`;
    }

    const fallback = normalized.slice(0, 90).trim();
    return fallback.length > 0 ? `"${fallback}"` : '';
  }

  private inferHintOnlyGrammarSignal(sentence: string): string {
    const lowered = sentence.toLowerCase();

    if (
      /\busually\b|\boften\b|\balways\b|\bgenerally\b|\btypically\b/.test(
        lowered,
      )
    ) {
      return 'Dấu hiệu tần suất (usually/often/always) thường yêu cầu dạng động từ hiện tại đơn hoặc dạng từ phù hợp theo cấu trúc câu.';
    }

    if (/\bwill\b/.test(lowered)) {
      return 'Sau modal "will" thường cần động từ nguyên mẫu (bare infinitive), nên cần kiểm tra dạng từ của lựa chọn.';
    }

    if (/\bsince\b|\bfor\b|\balready\b|\byet\b|\bjust\b/.test(lowered)) {
      return 'Các dấu hiệu since/for/already/yet/just thường gắn với thì hoàn thành; hãy đối chiếu lại dạng động từ.';
    }

    if (/\bdespite\b|\bin spite of\b/.test(lowered)) {
      return 'Sau despite/in spite of thường đi với danh từ hoặc V-ing, không đi trực tiếp với mệnh đề đầy đủ nếu thiếu liên từ phù hợp.';
    }

    if (/\beffect\b/.test(lowered)) {
      return 'Câu có tín hiệu collocation với từ "effect"; cần kiểm tra cụm động từ đi kèm danh từ này thay vì chọn theo nghĩa rời rạc.';
    }

    if (/\bfrom\b\s+\bnext\b|\btomorrow\b|\bsoon\b/.test(lowered)) {
      return 'Dấu hiệu thời gian tương lai (from next/tomorrow/soon) cho thấy phải đối chiếu lại thì và dạng động từ cần dùng.';
    }

    return 'Hãy soi từ đứng trước/sau chỗ trống để xác định đúng loại từ cần điền (động từ/danh từ/tính từ/trạng từ) và quan hệ ngữ nghĩa trong câu.';
  }

  private escapeRegExp(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  private redactAlternativeOptionMentions(
    sentence: string,
    alternativeTexts: string[],
  ): string {
    let redacted = sentence;
    for (const optionText of alternativeTexts) {
      if (optionText.length < 2) continue;
      const pattern = new RegExp(
        `\\b${this.escapeRegExp(optionText)}\\b`,
        'gi',
      );
      redacted = redacted.replace(pattern, 'một phương án khác');
    }

    return redacted.replace(/\s{2,}/g, ' ').trim();
  }

  private buildHintOnlyFallbackAnswer(
    dto: CertificateTutorAskDto,
    selectedText: string,
  ): string {
    const sentence = this.extractHintQuestionSentence(dto);
    const evidence = this.extractHintQuestionEvidence(sentence);
    const grammarSignal = this.inferHintOnlyGrammarSignal(sentence);

    const summary = selectedText
      ? `Kết luận nhanh: lựa chọn "${selectedText}" hiện chưa khớp với yêu cầu của chỗ trống.`
      : 'Kết luận nhanh: lựa chọn hiện tại chưa khớp với yêu cầu của chỗ trống.';

    const evidenceLine = evidence
      ? `Dấu hiệu trong câu: ${evidence}.`
      : 'Hãy nhìn vào cụm từ đứng trước/sau chỗ trống để tìm dạng từ cần điền.';

    return this.limitAnswerSentences(
      [
        summary,
        evidenceLine,
        grammarSignal,
        'Đối chiếu lại vai trò ngữ pháp của từ bạn chọn trước khi thử đáp án khác.',
      ].join(' '),
      4,
    );
  }

  private extractHintOptionTexts(dto: CertificateTutorAskDto): {
    selectedText: string;
    alternativeTexts: string[];
  } {
    const selectedMatch = dto.question.match(
      /Học\s*viên\s*chọn:\s*[A-D][.):-]?\s*([^\n\r]+)/i,
    );
    const selectedText = selectedMatch?.[1]?.trim().toLowerCase() ?? '';

    const optionMatches = Array.from(
      (dto.learning_context ?? '').matchAll(
        /(?:^|\n)\s*[A-D][.):-]\s*([^\n\r]+)/gi,
      ),
    )
      .map((match) => (match[1] ?? '').trim().toLowerCase())
      .filter((value) => value.length > 0);

    const uniqueOptions = Array.from(new Set(optionMatches));
    const alternativeTexts = selectedText
      ? uniqueOptions.filter((option) => option !== selectedText)
      : uniqueOptions;

    return { selectedText, alternativeTexts };
  }

  private isHintAnswerMentioningAlternativeOption(
    answer: string,
    dto: CertificateTutorAskDto,
  ): boolean {
    const loweredAnswer = answer.toLowerCase();
    const { alternativeTexts } = this.extractHintOptionTexts(dto);
    return alternativeTexts.some(
      (optionText) =>
        optionText.length >= 2 && loweredAnswer.includes(optionText),
    );
  }

  private limitAnswerSentences(answer: string, maxSentences: number): string {
    if (maxSentences <= 0) return answer.trim();
    const normalized = answer.replace(/\s+/g, ' ').trim();
    if (!normalized) return '';

    const sentences = normalized
      .split(/(?<=[.!?])\s+/)
      .map((part) => part.trim())
      .filter((part) => part.length > 0);

    if (sentences.length <= maxSentences) return normalized;
    return sentences.slice(0, maxSentences).join(' ').trim();
  }

  private stripCjkCharacters(answer: string): string {
    return answer
      .replace(/[\u3040-\u30ff\u3400-\u9fff\uf900-\ufaff]/g, '')
      .replace(/\s{2,}/g, ' ')
      .trim();
  }

  private sanitizeTutorDisplayAnswer(answer: string): string {
    return answer
      .replace(/\bB[1-9]\s*[.):-]\s*/gi, '')
      .replace(/(?:^|\n)\s*Step\s*[1-9]\s*[.):-]\s*/gi, '\n')
      .replace(/Kết luận ngay\s*/gi, '')
      .replace(
        /(lựa chọn học viên hiện tại là|lựa chọn hiện tại của học viên là)\s*(đúng|sai|chưa phù hợp)\b[^.\n]*\.?/gi,
        '',
      )
      .replace(
        /Phân tích lần lượt từng phương án/gi,
        'Phân tích từng phương án',
      )
      .replace(/^[ \t]+|[ \t]+$/gm, '')
      .replace(/[ \t]{2,}/g, ' ')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }

  private sanitizeHintOnlyAnswer(
    answer: string,
    dto: CertificateTutorAskDto,
  ): string {
    const normalized = this.stripCjkCharacters(answer);
    const { selectedText, alternativeTexts } = this.extractHintOptionTexts(dto);

    const rawSentences = normalized
      .split(/(?<=[.!?])\s+/)
      .map((part) => part.trim())
      .filter((part) => part.length > 0);

    const keptSentences = rawSentences
      .map((sentence) => {
        const loweredSentence = sentence.toLowerCase();
        if (this.isHintSuggestingAlternativeAnswer(loweredSentence)) {
          return '';
        }

        const mentionsAlternative = alternativeTexts.some(
          (optionText) =>
            optionText.length >= 2 && loweredSentence.includes(optionText),
        );

        const rewritten = mentionsAlternative
          ? this.redactAlternativeOptionMentions(sentence, alternativeTexts)
          : sentence;

        if (!rewritten) return '';
        if (this.isHintOnlyLeak(rewritten)) return '';

        return rewritten;
      })
      .filter((sentence) => sentence.length > 0);

    const sanitized = this.limitAnswerSentences(keptSentences.join(' '), 3);
    if (sanitized.length > 0) return sanitized;

    return this.buildHintOnlyFallbackAnswer(dto, selectedText);
  }

  private isOverGenericHintOnlyAnswer(answer: string): boolean {
    const lowered = answer.toLowerCase();
    return (
      lowered.includes('chưa phù hợp với ngữ pháp/ngữ nghĩa của chỗ trống') &&
      lowered.includes('kiểm tra lại dạng từ')
    );
  }

  private isLowQualityTutorAnswer(answer: string): boolean {
    const trimmed = answer.trim();
    // Quá ngắn (dưới 20 ký tự)
    if (trimmed.length < 20) return true;
    // Chỉ là một chữ cái đáp án: "A", "B.", "C:", "D -" — không có text đi kèm
    if (/^[A-D][.):-]?\s*$/i.test(trimmed)) return true;
    // Chỉ 1-2 từ
    if (trimmed.split(/\s+/).filter((w) => w.length > 0).length <= 2)
      return true;
    return false;
  }

  private isHintOnlyLeak(answer: string): boolean {
    const lowered = answer.toLowerCase();
    return (
      lowered.includes('đáp án đúng') ||
      lowered.includes('dap an dung') ||
      lowered.includes('đáp án là') ||
      lowered.includes('dap an la') ||
      lowered.includes('correct answer') ||
      lowered.includes('the answer is') ||
      lowered.includes('correct form') ||
      lowered.includes('should be') ||
      /(?:^|\s)[A-D][.):-](?:\s|$)/.test(answer)
    );
  }

  private isHintSuggestingAlternativeAnswer(answer: string): boolean {
    const lowered = answer.toLowerCase();
    return (
      lowered.includes('hãy chọn') ||
      lowered.includes('nên chọn') ||
      lowered.includes('chọn đáp án') ||
      lowered.includes('chọn phương án') ||
      lowered.includes('phương án còn lại') ||
      lowered.includes('đổi sang') ||
      lowered.includes('thử đáp án')
    );
  }

  private isFallbackStyleTutorAnswer(answer: string): boolean {
    const lowered = answer.toLowerCase();
    return (
      lowered.includes('fallback') ||
      lowered.includes('chưa gọi được ai model') ||
      lowered.includes('hệ thống ai tạm thời') ||
      lowered.includes('chưa kết nối được ollama')
    );
  }

  private isLikelyEnglishTutorAnswer(answer: string): boolean {
    // Nếu có dấu tiếng Việt → chắc chắn là tiếng Việt, không reject
    const hasVietnameseDiacritics =
      /[ăâđêôơưáàảãạắằẳẵặấầẩẫậéèẻẽẹếềểễệíìỉĩịóòỏõọốồổỗộớờởỡợúùủũụứừửữựýỳỷỹỵ]/i.test(
        answer,
      );
    if (hasVietnameseDiacritics) return false;

    // Không có dấu → kiểm tra xem có phải HOÀN TOÀN tiếng Anh không
    // (tỷ lệ từ tiếng Anh > 40% mới reject, tránh reject giải thích TOEIC có chứa từ tiếng Anh)
    const words = answer
      .trim()
      .split(/\s+/)
      .filter((w) => w.length > 0);
    if (words.length === 0) return false;
    const englishWords = words.filter((w) =>
      /^[a-zA-Z''-]+$/.test(w.replace(/[.,!?;:()[\]{}""'']/g, '')),
    );
    return englishWords.length / words.length > 0.65;
  }

  private isFullExplanationTutorRequest(dto: CertificateTutorAskDto): boolean {
    return (
      dto.question.includes('[FULL_EXPLANATION]') ||
      dto.learning_context?.includes('[FULL_EXPLANATION]') === true
    );
  }

  private isLowQualityFullExplanationAnswer(answer: string): boolean {
    const trimmed = answer.trim();
    // Quá ngắn
    if (trimmed.length < 60) return true;
    // Kết thúc đột ngột bằng liên từ (câu bị cắt ngang)
    const endsAbruptly = /(vì|because|do|nên|since|as)\s*$/i.test(trimmed);
    if (endsAbruptly) return true;
    // Phải có ít nhất thảo luận về đáp án (dùng nhiều pattern khác nhau để bắt 3b/7b)
    const hasAnswerDiscussion =
      /đáp\s*án/i.test(trimmed) ||
      /câu\s*trả\s*lời/i.test(trimmed) ||
      /correct/i.test(trimmed) ||
      /chính\s*xác/i.test(trimmed) ||
      /[A-D][.):-]\s/i.test(trimmed) ||
      /phương\s*án/i.test(trimmed) ||
      /lựa\s*chọn/i.test(trimmed);
    return !hasAnswerDiscussion;
  }

  private isHintOnlyTutorRequest(dto: CertificateTutorAskDto): boolean {
    return (
      dto.question.includes('[HINT_ONLY]') ||
      dto.learning_context?.includes('[HINT_ONLY]') === true
    );
  }

  private shouldRejectCachedTutorAnswer(
    answer: string,
    dto: CertificateTutorAskDto,
  ): boolean {
    if (this.isLowQualityTutorAnswer(answer)) return true;
    if (this.isFallbackStyleTutorAnswer(answer)) return true;
    if (this.isLikelyEnglishTutorAnswer(answer)) return true;
    if (
      this.isFullExplanationTutorRequest(dto) &&
      !dto.concise &&
      this.isLowQualityFullExplanationAnswer(answer)
    ) {
      return true;
    }
    if (
      this.isHintOnlyTutorRequest(dto) &&
      (this.isHintOnlyLeak(answer) ||
        this.isHintSuggestingAlternativeAnswer(answer) ||
        this.isHintAnswerMentioningAlternativeOption(answer, dto) ||
        this.isOverGenericHintOnlyAnswer(answer))
    ) {
      return true;
    }
    return false;
  }

  private async callOllamaTutorAnswer(
    prompt: string,
    model: string,
  ): Promise<string> {
    const baseUrl =
      process.env.OLLAMA_BASE_URL?.trim() ||
      'http://127.0.0.1:11434/api/generate';

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), OLLAMA_TIMEOUT_MS);

    let response: Response;
    try {
      response = await fetch(baseUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          model,
          prompt,
          stream: false,
          options: OLLAMA_TUTOR_OPTIONS,
        }),
      });
    } catch (err: unknown) {
      const isAbort = err instanceof Error && err.name === 'AbortError';
      throw new BadRequestException(
        isAbort
          ? 'Ollama timeout — model phản hồi quá chậm. Thử lại sau.'
          : 'Không thể kết nối Ollama cho trợ lý AI. Hãy kiểm tra service đang chạy.',
      );
    } finally {
      clearTimeout(timeoutId);
    }

    if (!response.ok) {
      throw new BadRequestException(
        `Ollama trả về lỗi HTTP ${response.status}.`,
      );
    }

    const payload = (await response.json()) as OllamaGenerateResponse;
    const raw =
      typeof payload.response === 'string' ? payload.response.trim() : '';
    if (!raw) {
      throw new BadRequestException('Ollama không trả về nội dung tư vấn.');
    }

    // Try JSON extraction first (backward compat), then fall back to plain text
    const normalizedAnswer = this.extractTutorAnswerFromRaw(raw);
    const finalAnswer = normalizedAnswer.length > 0 ? normalizedAnswer : raw;

    // Chỉ reject khi hoàn toàn rỗng — không reject dựa trên quality/ngôn ngữ
    // (các check này đã từng gây reject nhầm với qwen2.5:3b)
    if (finalAnswer.trim().length < 5) {
      throw new BadRequestException('Ollama trả về nội dung rỗng.');
    }

    return finalAnswer.trim();
  }

  private buildTutorFallbackAnswer(dto: CertificateTutorAskDto): string {
    const hintOnly =
      dto.question.includes('[HINT_ONLY]') ||
      dto.learning_context?.includes('[HINT_ONLY]') === true;
    return buildTutorFallback(hintOnly, dto.concise ?? false);
  }

  async askCertificateTutor(
    accountId: number,
    dto: CertificateTutorAskDto,
  ): Promise<CertificateTutorAskResponseDto> {
    const certType = dto.cert_type.trim().toLowerCase();
    if (!CERT_TUTOR_ALLOWED_CERT_TYPES.has(certType)) {
      throw new BadRequestException(
        'cert_type không được hỗ trợ cho trợ lý AI.',
      );
    }

    const studentId = await this.getStudentId(accountId);
    const enrollment = await this.prisma.certificateEnrollment.findFirst({
      where: {
        student_id: studentId,
        cert_type: certType,
        status: 'active',
      },
      select: {
        current_score: true,
        target_score: true,
        progress_percent: true,
      },
      orderBy: { enrolled_at: 'desc' },
    });

    const enrollmentSummary = enrollment
      ? `Tiến độ hiện tại: progress=${enrollment.progress_percent}%, current_score=${enrollment.current_score ?? 0}, target_score=${enrollment.target_score ?? 0}.`
      : 'Học viên chưa có enrollment active cho chứng chỉ này.';

    const model = this.resolveOllamaModel(certType);
    const basePrompt = this.buildTutorPrompt(certType, dto, enrollmentSummary);
    const hintOnlyMode = this.isHintOnlyTutorRequest(dto);

    const cacheKey = [
      CERT_TUTOR_PROMPT_VERSION,
      certType,
      dto.topic_key?.trim() ?? '',
      dto.learning_context?.trim() ?? '',
      dto.question.trim(),
      String(Boolean(dto.concise)),
      `hint_only=${String(hintOnlyMode)}`,
      model,
    ].join('|');
    const cachePath = this.buildTutorCachePath(cacheKey);

    // ── 1. DB cache (ToeicNodeQuestionCache) — nhanh nhất, persist qua restart ──
    const dbTopicKey = dto.topic_key?.trim() ?? '';
    if (dbTopicKey.length > 0) {
      const dbCached = await this.prisma.toeicNodeQuestionCache.findUnique({
        where: { topic_key: dbTopicKey },
      });
      if (dbCached && dbCached.ai_answer.trim().length > 24) {
        const cleaned = this.sanitizeTutorDisplayAnswer(dbCached.ai_answer);
        const dbAnswer = cleaned.length > 0 ? cleaned : dbCached.ai_answer;
        if (!this.shouldRejectCachedTutorAnswer(dbAnswer, dto)) {
          return {
            cert_type: certType,
            answer: dbAnswer,
            model: dbCached.model,
            source: 'cache',
          };
        }

        // Cache cũ chất lượng thấp/stale -> xoá để lần gọi hiện tại regenerate.
        void this.prisma.toeicNodeQuestionCache
          .delete({ where: { topic_key: dbTopicKey } })
          .catch(() => {});
      }
    }

    // ── 2. File cache — secondary (backward-compatible) ─────────────────────
    const cached = await this.readTutorCache(cachePath);

    if (cached) {
      const cleanedCachedAnswer = this.sanitizeTutorDisplayAnswer(
        cached.answer,
      );
      const cachedAnswer =
        cleanedCachedAnswer.length > 0 ? cleanedCachedAnswer : cached.answer;

      if (this.shouldRejectCachedTutorAnswer(cachedAnswer, dto)) {
        // Bỏ qua file cache kém chất lượng để thử sinh lại từ model.
      } else {
        // Đưa file-cache lên DB để lần sau dùng DB (nếu có topic_key)
        if (dbTopicKey.length > 0) {
          void this.prisma.toeicNodeQuestionCache
            .upsert({
              where: { topic_key: dbTopicKey },
              update: { ai_answer: cachedAnswer, model: cached.model },
              create: {
                topic_key: dbTopicKey,
                cert_type: certType,
                ai_answer: cachedAnswer,
                model: cached.model,
              },
            })
            .catch(() => {});
        }
        return {
          cert_type: certType,
          answer: cachedAnswer,
          model: cached.model,
          source: 'cache',
        };
      }
    }

    // Attempt to get answer from Ollama — single attempt, no quality-based retry
    // (quality retries caused 15-24s waits; cache handles deduplication)
    try {
      let answer = await this.callOllamaTutorAnswer(basePrompt, model);
      answer = this.sanitizeTutorDisplayAnswer(answer);

      if (
        answer.length === 0 ||
        this.isFallbackStyleTutorAnswer(answer) ||
        this.shouldRejectCachedTutorAnswer(answer, dto)
      ) {
        throw new Error('Empty, fallback-style, or low-quality answer');
      }

      // Persist to file cache and DB
      await this.writeTutorCache(cachePath, {
        answer,
        model,
        created_at: new Date().toISOString(),
      });

      if (dbTopicKey.length > 0) {
        void this.prisma.toeicNodeQuestionCache
          .upsert({
            where: { topic_key: dbTopicKey },
            update: { ai_answer: answer, model },
            create: {
              topic_key: dbTopicKey,
              cert_type: certType,
              ai_answer: answer,
              model,
            },
          })
          .catch(() => {});
      }

      return {
        cert_type: certType,
        answer,
        model,
        source: 'ollama',
      };
    } catch {
      // Ollama failed or returned unusable content → return fallback
    }

    const fallback = this.buildTutorFallbackAnswer(dto);
    return {
      cert_type: certType,
      answer: fallback,
      model,
      source: 'fallback',
    };
  }

  // ─── Item-level cache key (không phụ thuộc vào option được chọn) ──────────
  private buildItemLevelCacheKey(
    itemId: number,
    updatedAt: Date,
    slug: string,
    model: string,
  ): string {
    return [
      'explain',
      slug,
      String(itemId),
      updatedAt.toISOString(),
      model,
    ].join('|');
  }

  // ─── Prompt giải thích đủ 4 đáp án, tối ưu cho tốc độ ────────────────────
  private buildFullExplanationPrompt(item: {
    stem: string;
    reading_passage: string | null;
    explanation: string | null;
    options: Array<{
      option_key: string;
      option_text: string;
      is_correct: boolean;
    }>;
  }): string {
    return buildExplanationPrompt({
      stem: item.stem,
      readingPassage: item.reading_passage,
      options: item.options,
      baseExplanation: item.explanation,
    });
  }

  private normalizeExplanationForDisplay(raw: string): string {
    const compact = raw
      .replace(/\r\n/g, '\n')
      .replace(/\u00A0/g, ' ')
      .trim();
    if (!compact) return '';

    let formatted = compact
      .replace(/\s*(Đáp án đúng\s*[:：-])/gi, '\n\n$1')
      .replace(
        /\s*((?:Phương án|Lựa chọn|Đáp án)\s*[A-D]\s*[:：-])/gi,
        '\n\n$1',
      )
      .replace(/\s*([A-D][).:-]\s)/g, '\n\n$1')
      .replace(/\n{3,}/g, '\n\n')
      .replace(/^\n+/, '')
      .trim();

    if (!formatted.includes('\n\n')) {
      const sentences = formatted
        .replace(/([.!?])\s+/g, '$1\n\n')
        .split('\n\n')
        .map((s) => s.trim())
        .filter((s) => s.length > 0);
      if (sentences.length >= 4) {
        formatted = sentences.join('\n\n');
      }
    }

    return formatted;
  }

  private getOrCreateInFlightExplanation(
    cacheKey: string,
    factory: () => Promise<string>,
  ): Promise<string> {
    const existing = this.inFlightExplanationGenerations.get(cacheKey);
    if (existing) return existing;

    const task = (async () => {
      try {
        return await factory();
      } finally {
        this.inFlightExplanationGenerations.delete(cacheKey);
      }
    })();

    this.inFlightExplanationGenerations.set(cacheKey, task);
    return task;
  }

  private async persistGeneratedExplanation(
    itemId: number,
    explanation: string,
    cachePath: string,
    model: string,
  ): Promise<void> {
    await Promise.all([
      this.prisma.learningRepositoryItem
        .update({
          where: { id: itemId },
          data: { ai_explanation: explanation },
        })
        .catch(() => {}),
      this.writeExplanationCache(cachePath, {
        explanation,
        model,
        created_at: new Date().toISOString(),
      }),
    ]);
  }

  private triggerToeicLookaheadPrefetch(
    repositoryId: number,
    currentItemOrder: number,
    slug: string,
  ): void {
    void (async () => {
      const nextItems = await this.prisma.learningRepositoryItem.findMany({
        where: {
          repository_id: repositoryId,
          item_order: { gt: currentItemOrder },
        },
        orderBy: { item_order: 'asc' },
        take: TOEIC_LOOKAHEAD_PREFETCH_COUNT,
        select: {
          id: true,
          updated_at: true,
          stem: true,
          reading_passage: true,
          explanation: true,
          ai_explanation: true,
          options: {
            orderBy: { sort_order: 'asc' },
            select: {
              option_key: true,
              option_text: true,
              is_correct: true,
            },
          },
        },
      });

      for (
        let i = 0;
        i < nextItems.length;
        i += TOEIC_LOOKAHEAD_PREFETCH_BATCH_SIZE
      ) {
        const batch = nextItems.slice(
          i,
          i + TOEIC_LOOKAHEAD_PREFETCH_BATCH_SIZE,
        );
        await Promise.all(
          batch.map((nextItem) => this.prefetchItemExplanation(nextItem, slug)),
        );
      }
    })().catch(() => {});
  }

  // ─── Prefetch: được gọi bởi ToeicExplanationPrefetchService ───────────────
  async prefetchItemExplanation(
    item: {
      id: number;
      updated_at: Date;
      stem: string;
      reading_passage: string | null;
      explanation: string | null;
      ai_explanation?: string | null; // DB cache field — optional (Prisma client may not yet have this field)
      options: Array<{
        option_key: string;
        option_text: string;
        is_correct: boolean;
      }>;
    },
    slug: string,
  ): Promise<void> {
    // Bỏ qua câu hỏi chưa có đáp án đúng
    if (!item.options.some((o) => o.is_correct)) return;

    // ── 1. Đã có DB cache → bỏ qua hoàn toàn ────────────────────────────
    const dbExisting = (item as { ai_explanation?: string | null })
      .ai_explanation;
    if (dbExisting && dbExisting.trim().length > 20) return;

    const model = this.resolveOllamaModel('toeic');
    const cacheKey = this.buildItemLevelCacheKey(
      item.id,
      item.updated_at,
      slug,
      model,
    );
    const cachePath = this.buildExplanationCachePath(cacheKey);

    // ── 2. Đã có file cache → đưa lên DB rồi bỏ qua ─────────────────────
    const fileCached = await this.readExplanationCache(cachePath);
    if (fileCached) {
      const normalized = this.normalizeExplanationForDisplay(
        fileCached.explanation,
      );
      void this.prisma.learningRepositoryItem
        .update({
          where: { id: item.id },
          data: { ai_explanation: normalized || fileCached.explanation },
        })
        .catch(() => {});
      return;
    }

    // ── 3. Chưa có cache → gọi Ollama → lưu cả DB lẫn file ──────────────
    const prompt = this.buildFullExplanationPrompt(item);
    try {
      const explanation = await this.getOrCreateInFlightExplanation(
        cacheKey,
        async () => {
          const generated = await this.callOllamaExplanation(prompt, model);
          return this.normalizeExplanationForDisplay(generated);
        },
      );
      await this.persistGeneratedExplanation(
        item.id,
        explanation,
        cachePath,
        model,
      );
    } catch {
      // Lỗi prefetch → im lặng, để request thật sẽ tạo lại sau
    }
  }

  // ─── API chính: chỉ trả explanation khi user chọn đúng ───────────────────
=======
      process.env.OLLAMA_BASE_URL?.trim() || 'http://127.0.0.1:11434/api/generate';

    const response = await fetch(baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        prompt,
        stream: false,
        format: 'json',
        options: {
          temperature: 0.2,
        },
      }),
    });

    if (!response.ok) {
      throw new BadRequestException('Khong the goi Ollama. Hay kiem tra service dang chay.');
    }

    const payload = (await response.json()) as OllamaGenerateResponse;
    const raw = typeof payload.response === 'string' ? payload.response.trim() : '';
    if (!raw) {
      throw new BadRequestException('Ollama khong tra ve noi dung giai thich.');
    }

    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== 'object') {
      throw new BadRequestException('Ollama tra ve dinh dang khong hop le.');
    }

    const explanation = (parsed as Record<string, unknown>).explanation;
    if (typeof explanation !== 'string' || explanation.trim().length === 0) {
      throw new BadRequestException('Ollama khong tra ve truong explanation hop le.');
    }

    return explanation.trim();
  }

>>>>>>> origin/main
  async explainToeicAnswerWithOllama(
    accountId: number,
    slug: string,
    dto: ToeicExplainAnswerDto,
  ): Promise<ToeicExplainAnswerResponseDto> {
    await this.getStudentId(accountId);

    const item = await this.prisma.learningRepositoryItem.findUnique({
      where: { id: dto.item_id },
      include: {
        repository: true,
        options: { orderBy: { sort_order: 'asc' } },
      },
    });

<<<<<<< HEAD
    if (
      !item ||
      item.repository.slug !== slug ||
      item.repository.cert_type !== 'toeic'
    ) {
      throw new NotFoundException(
        'Không tìm thấy câu hỏi TOEIC để giải thích.',
      );
=======
    if (!item || item.repository.slug !== slug || item.repository.cert_type !== 'toeic') {
      throw new NotFoundException('Khong tim thay cau hoi TOEIC de giai thich.');
>>>>>>> origin/main
    }

    const selectedOption = item.options.find(
      (option) => Number(option.id) === Number(dto.selected_option_id),
    );
    if (!selectedOption) {
<<<<<<< HEAD
      throw new BadRequestException(
        'selected_option_id không thuộc câu hỏi này.',
      );
=======
      throw new BadRequestException('selected_option_id khong thuoc cau hoi nay.');
>>>>>>> origin/main
    }

    const correctOption = item.options.find((option) => option.is_correct);
    if (!correctOption) {
<<<<<<< HEAD
      throw new BadRequestException('Câu hỏi chưa cấu hình đáp án đúng.');
    }

    // Ưu tiên prefetch vài câu kế tiếp theo ngữ cảnh người dùng, không chặn response.
    this.triggerToeicLookaheadPrefetch(
      item.repository_id,
      item.item_order,
      slug,
    );

    const isCorrect = Number(selectedOption.id) === Number(correctOption.id);

    // ── Nếu chọn sai → không trả explanation, tiết kiệm hoàn toàn Ollama ──
    if (!isCorrect) {
      return {
        item_id: item.id,
        selected_option_id: selectedOption.id,
        correct_option_id: correctOption.id,
        is_correct: false,
        explanation: null,
        model: this.resolveOllamaModel('toeic'),
        source: 'skipped',
      };
    }

    // ── User chọn đúng → trả explanation đủ 4 đáp án ──────────────────────
    const model = this.resolveOllamaModel('toeic');

    // ── 1. DB cache (ai_explanation trên item) — nhanh nhất ──────────────
    if (item.ai_explanation && item.ai_explanation.trim().length > 20) {
      const normalized = this.normalizeExplanationForDisplay(
        item.ai_explanation,
      );
      return {
        item_id: item.id,
        selected_option_id: selectedOption.id,
        correct_option_id: correctOption.id,
        is_correct: true,
        explanation: normalized || item.ai_explanation,
        model,
        source: 'cache',
      };
    }

    // ── 2. File cache — secondary ─────────────────────────────────────────
    const cacheKey = this.buildItemLevelCacheKey(
      item.id,
      item.updated_at,
      slug,
      model,
    );
=======
      throw new BadRequestException('Cau hoi chua cau hinh dap an dung.');
    }

    const model = process.env.OLLAMA_MODEL?.trim() || 'qwen2.5:7b-instruct';
    const cacheKey = [
      slug,
      String(item.id),
      String(selectedOption.id),
      item.updated_at.toISOString(),
      model,
    ].join('|');
>>>>>>> origin/main
    const cachePath = this.buildExplanationCachePath(cacheKey);
    const cached = await this.readExplanationCache(cachePath);

    if (cached) {
<<<<<<< HEAD
      const normalized = this.normalizeExplanationForDisplay(
        cached.explanation,
      );
      // Đưa file-cache lên DB để lần sau dùng DB
      void this.prisma.learningRepositoryItem
        .update({
          where: { id: item.id },
          data: { ai_explanation: normalized || cached.explanation },
        })
        .catch(() => {});
=======
>>>>>>> origin/main
      return {
        item_id: item.id,
        selected_option_id: selectedOption.id,
        correct_option_id: correctOption.id,
<<<<<<< HEAD
        is_correct: true,
        explanation: normalized || cached.explanation,
=======
        is_correct: selectedOption.id === correctOption.id,
        explanation: cached.explanation,
>>>>>>> origin/main
        model: cached.model,
        source: 'cache',
      };
    }

<<<<<<< HEAD
    // Chưa có cache → gọi Ollama
    const prompt = this.buildFullExplanationPrompt({
      stem: item.stem,
      reading_passage: item.reading_passage,
      explanation: item.explanation,
      options: item.options,
    });

    try {
      const explanation = await this.getOrCreateInFlightExplanation(
        cacheKey,
        async () => {
          const generated = await this.callOllamaExplanation(prompt, model);
          return this.normalizeExplanationForDisplay(generated);
        },
      );

      await this.persistGeneratedExplanation(
        item.id,
        explanation,
        cachePath,
        model,
      );
=======
    const optionLines = item.options
      .map((option) => `${option.option_key}. ${option.option_text}`)
      .join('\n');

    const prompt = [
      'Ban la tro ly hoc TOEIC. Hay giai thich ngan gon, de hieu cho hoc vien.',
      'Chi dua vao du lieu cung cap, khong duoc bịa them thong tin ben ngoai.',
      'Tra ve DUY NHAT JSON co truong: {"explanation":"..."}.',
      `Cau hoi: ${item.stem}`,
      item.reading_passage ? `Doan van: ${item.reading_passage}` : '',
      `Lua chon:\n${optionLines}`,
      `Hoc vien chon: ${selectedOption.option_key}. ${selectedOption.option_text}`,
      `Dap an dung: ${correctOption.option_key}. ${correctOption.option_text}`,
      item.explanation ? `Giai thich nen tang (neu co): ${item.explanation}` : '',
      'Yeu cau: neu hoc vien sai, noi ro vi sao dap an hoc vien sai va vi sao dap an dung chinh xac.',
    ]
      .filter((line) => line.length > 0)
      .join('\n\n');

    try {
      const explanation = await this.callOllamaExplanation(prompt, model);
      await this.writeExplanationCache(cachePath, {
        explanation,
        model,
        created_at: new Date().toISOString(),
      });
>>>>>>> origin/main

      return {
        item_id: item.id,
        selected_option_id: selectedOption.id,
        correct_option_id: correctOption.id,
<<<<<<< HEAD
        is_correct: true,
=======
        is_correct: selectedOption.id === correctOption.id,
>>>>>>> origin/main
        explanation,
        model,
        source: 'ollama',
      };
    } catch {
<<<<<<< HEAD
      // Fallback khi Ollama lỗi
=======
>>>>>>> origin/main
      const fallback = this.buildFallbackExplanation(
        item.stem,
        selectedOption.option_text,
        correctOption.option_text,
<<<<<<< HEAD
        true,
        item.explanation,
      );
      const normalizedFallback = this.normalizeExplanationForDisplay(fallback);

      // Không cache fallback để lần sau vẫn thử lại Ollama
=======
        selectedOption.id === correctOption.id,
        item.explanation,
      );

      await this.writeExplanationCache(cachePath, {
        explanation: fallback,
        model,
        created_at: new Date().toISOString(),
      });

>>>>>>> origin/main
      return {
        item_id: item.id,
        selected_option_id: selectedOption.id,
        correct_option_id: correctOption.id,
<<<<<<< HEAD
        is_correct: true,
        explanation: normalizedFallback || fallback,
=======
        is_correct: selectedOption.id === correctOption.id,
        explanation: fallback,
>>>>>>> origin/main
        model,
        source: 'fallback',
      };
    }
  }

  async getToeicRepositoryOverview(
    accountId: number,
  ): Promise<ToeicRepositoryOverviewResponseDto> {
    const studentId = await this.getStudentId(accountId);
<<<<<<< HEAD
=======
    await this.ensureToeicRepositorySeedData();
>>>>>>> origin/main

    const enrollment = await this.prisma.certificateEnrollment.findFirst({
      where: { student_id: studentId, cert_type: 'toeic', status: 'active' },
      orderBy: { enrolled_at: 'desc' },
    });

    const currentScore = Number(enrollment?.current_score ?? 300);
    const targetScore = Number(
      enrollment?.target_score ?? Math.max(600, currentScore),
    );
    const planState = this.parseToeicPlanStateFromJson(
      enrollment?.toeic_plan_state,
      [],
      {
        current_score: enrollment?.current_score,
        target_score: enrollment?.target_score,
      },
    );
    const projectedScore = Number(
      planState.current_score + planState.total_boost,
    );
    const effectiveScore = this.getEffectiveToeicScore(enrollment, planState);

    const repositories = await this.prisma.learningRepository.findMany({
      where: { cert_type: 'toeic', is_published: true },
      orderBy: [
        { target_score_min: 'asc' },
        { skill_area: 'asc' },
        { id: 'asc' },
      ],
    });

    const items: ToeicRepositoryOverviewItemDto[] = repositories
      .filter((repo) =>
        isInScoreWindow(
          repo.target_score_min,
          repo.target_score_max,
          targetScore,
        ),
      )
      .map((repo) => {
        const metadata = (repo.metadata ?? {}) as Prisma.JsonObject;
        const milestoneScore = Number(
          readJsonNumber(metadata, 'milestone_score') ??
            repo.target_score_min ??
            targetScore,
        );
        const unlockScore = Number(
          readJsonNumber(metadata, 'unlock_score') ??
            repo.target_score_min ??
            milestoneScore,
        );
        const topicKeyFromMetadata = readJsonString(metadata, 'topic_key');
        const fallbackTopicKey = `${repo.skill_area ?? 'reading'}.repo_${repo.id}`;
        const topicKey = topicKeyFromMetadata ?? fallbackTopicKey;
        const questionCount = Number(repo.total_items ?? 0);

        return {
          repository_id: Number(repo.id),
          slug: String(repo.slug),
          topic_key: topicKey,
          title: String(repo.title),
          description: repo.description ?? null,
          skill_area: String(repo.skill_area ?? 'reading'),
          milestone_score: milestoneScore,
          unlock_score: unlockScore,
          question_count: questionCount,
          estimated_minutes: Number(
            repo.estimated_minutes ?? Math.max(1, questionCount),
          ),
          is_unlocked: effectiveScore >= unlockScore,
        } satisfies ToeicRepositoryOverviewItemDto;
      });

    return {
      current_score: currentScore,
      target_score: targetScore,
      projected_score: projectedScore,
      items,
    };
  }

  async getToeicRepositoryDetail(
    accountId: number,
    slug: string,
  ): Promise<ToeicRepositoryDetailResponseDto> {
    await this.getStudentId(accountId);
<<<<<<< HEAD
=======
    await this.ensureToeicRepositorySeedData();
>>>>>>> origin/main

    const repo: ToeicRepositoryWithItems | null =
      await this.prisma.learningRepository.findUnique({
        where: { slug },
        include: {
          items: {
            orderBy: { item_order: 'asc' },
            include: { options: { orderBy: { sort_order: 'asc' } } },
          },
        },
      });

    if (!repo || repo.cert_type !== 'toeic' || !repo.is_published) {
      throw new NotFoundException('Không tìm thấy bộ đề TOEIC.');
    }

    const metadata = (repo.metadata ?? {}) as Prisma.JsonObject;

    const totalItems = Number(repo.total_items ?? repo.items?.length ?? 0);

    return {
      repository_id: Number(repo.id),
      slug: String(repo.slug),
      title: String(repo.title),
      description: repo.description ?? null,
      skill_area: repo.skill_area ?? null,
      milestone_score: Number(
        metadata.milestone_score ?? repo.target_score_min ?? 0,
      ),
      estimated_minutes: Number(
        repo.estimated_minutes ?? Math.max(1, totalItems),
      ),
      pass_score: Number(
        repo.pass_score ?? Math.max(1, Math.ceil(totalItems * 0.7)),
      ),
      total_items: totalItems,
      items: (repo.items ?? []).map((item) => ({
        id: Number(item.id),
        item_order: Number(item.item_order),
        item_type: String(item.item_type),
        title: item.title ?? null,
        stem: String(item.stem),
        reading_passage: item.reading_passage ?? null,
<<<<<<< HEAD
        media_audio_url: item.media_audio_url ?? null,
=======
        media_audio_url:
          item.media_audio_url ??
          (repo.skill_area === 'listening'
            ? '/sounds/pomodoro/start.mp3'
            : null),
>>>>>>> origin/main
        estimated_seconds: item.estimated_seconds ?? null,
        score_weight: Number(item.score_weight ?? 1),
        options: (item.options ?? []).map((opt) => ({
          id: Number(opt.id),
          option_key: String(opt.option_key),
          option_text: String(opt.option_text),
          is_correct: Boolean(opt.is_correct),
          rationale: opt.rationale ?? null,
          sort_order: Number(opt.sort_order ?? 1),
        })),
        explanation: item.explanation ?? null,
      })),
    };
  }

  async submitToeicRepositoryAnswers(
    accountId: number,
    slug: string,
    dto: ToeicRepositorySubmitDto,
  ): Promise<ToeicRepositorySubmitResponseDto> {
    const studentId = await this.getStudentId(accountId);
<<<<<<< HEAD
=======
    await this.ensureToeicRepositorySeedData();
>>>>>>> origin/main

    const repository: ToeicRepositoryWithItemsForSubmit | null =
      await this.prisma.learningRepository.findUnique({
        where: { slug },
        include: {
          items: {
            include: { options: true },
          },
        },
      });

    if (
      !repository ||
      repository.cert_type !== 'toeic' ||
      !repository.is_published
    ) {
      throw new NotFoundException('Không tìm thấy bộ đề TOEIC để nộp bài.');
    }

    if (!Array.isArray(dto.answers) || dto.answers.length === 0) {
      throw new BadRequestException('Danh sách câu trả lời không hợp lệ.');
    }

    const enrollment = await this.getOrCreateActiveToeicEnrollment(studentId);
    const currentState = this.parseToeicPlanStateFromJson(
      enrollment.toeic_plan_state,
      (enrollment.topicProgress ?? []).map(
        (topicProgress) => topicProgress.topic_key,
      ),
      {
        current_score: enrollment.current_score,
        target_score: enrollment.target_score,
      },
    );

    const metadata = (repository.metadata ?? {}) as Prisma.JsonObject;
    const unlockScore = Number(
      metadata.unlock_score ?? repository.target_score_min ?? 300,
    );
    const effectiveScore = this.getEffectiveToeicScore(
      enrollment,
      currentState,
    );
    if (effectiveScore < unlockScore) {
      throw new ForbiddenException('Bộ đề chưa mở theo cột mốc điểm hiện tại.');
    }

    const answerByItem = new Map<number, number>();
    for (const ans of dto.answers) {
      answerByItem.set(Number(ans.item_id), Number(ans.option_id));
    }

    let correctCount = 0;
    const totalCount = Number(
      repository.total_items ?? repository.items?.length ?? 0,
    );

    for (const item of repository.items ?? []) {
      const selectedOptionId = answerByItem.get(Number(item.id));
      if (!selectedOptionId) continue;
      const selected = (item.options ?? []).find(
        (opt) => Number(opt.id) === selectedOptionId,
      );
      if (selected?.is_correct) correctCount += 1;
    }

    const gainPerCorrect =
      repository.skill_area === 'listening' ||
      repository.skill_area === 'reading'
        ? 2.5
        : 1.5;
    const gainedScore = Math.round(correctCount * gainPerCorrect);

    const updatedPlan = await this.saveToeicPlanState(accountId, {
      current_score: currentState.current_score,
      target_score: currentState.target_score,
      total_boost: Math.max(0, Number(currentState.total_boost) + gainedScore),
      listening_sessions:
        repository.skill_area === 'listening'
          ? Number(currentState.listening_sessions) + 1
          : Number(currentState.listening_sessions),
      reading_sessions:
        repository.skill_area === 'reading'
          ? Number(currentState.reading_sessions) + 1
          : Number(currentState.reading_sessions),
      foundation_completed: currentState.foundation_completed,
      foundation_skipped: currentState.foundation_skipped,
      first_guide_shown: currentState.first_guide_shown,
      has_activity: true,
    });

    const passScore = Number(
      repository.pass_score ?? Math.max(1, Math.ceil(totalCount * 0.7)),
    );
    return {
      repository_id: Number(repository.id),
      slug: String(repository.slug),
      skill_area: repository.skill_area ?? null,
      correct_count: correctCount,
      total_count: totalCount,
      pass_score: passScore,
      is_passed: correctCount >= passScore,
      gained_score: gainedScore,
      projected_score: Number(
        updatedPlan.current_score + updatedPlan.total_boost,
      ),
      updated_plan: updatedPlan,
    };
  }
}

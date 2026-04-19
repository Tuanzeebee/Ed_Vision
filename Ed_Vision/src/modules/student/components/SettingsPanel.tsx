import { useState, useEffect, useRef } from 'react';
import { useDraggable } from '../hooks/useDraggable';
import { useResizable } from '../hooks/useResizable';
import { STUDENT_LEARNING_COURSES } from '../data/learningCourses';
import { buildUrl } from '@/services/api/config';
import { TokenManager } from '@/lib/tokenManager';
import ImageCropModal from './ImageCropModal';

type ProfileData = {
  fullName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  dateOfBirthRaw: string; // For date input (YYYY-MM-DD format)
  gender: string;
  nationality: string;
  address: string;
  avatarUrl: string;
  studentCode: string;
  major: string;
  className: string;
};

type ClickSoundOption = {
  id: string;
  label: string;
  file: string;
  description: string;
};

type LearningEconomyState = {
  hearts: number;
  gems: number;
  streakDays: number;
  lastStudyDate: string | null;
  totalXp: number;
};

type QuizLeaderboardEntry = {
  id: string;
  playerName: string;
  scorePercent: number;
  scorePoints: number;
  correctAnswers: number;
  totalQuestions: number;
  completionSeconds: number;
  completedAt: number;
};

type ProfileStatsState = {
  streakDays: number;
  totalKnowledgePoints: number;
  currentLeague: string;
  top3Count: number;
  totalCourseCount: number;
  totalStudySeconds: number;
};

type DailyMissionTemplate = {
  id: string;
  title: string;
  description: string;
  xpReward: number;
  iconClass: string;
};

type DailyMission = DailyMissionTemplate & {
  completed: boolean;
  claimed: boolean;
};

type DailyMissionProgress = {
  id: string;
  completed: boolean;
  claimed: boolean;
};

type DailyMissionStorage = {
  dateStamp: string;
  missions: DailyMissionProgress[];
};

type DailyMissionState = {
  dateStamp: string;
  missions: DailyMission[];
};

type ProfileSection = 'info' | 'stats' | 'missions' | 'leaderboard';
type SettingsPanelMode = 'settings' | 'profile';

const LEARNING_ECONOMY_STORAGE_KEY = 'edvision-learning-economy';
const QUIZ_LEADERBOARD_STORAGE_KEY = 'edvision-quiz-leaderboard';
const STUDY_TIME_STORAGE_KEY = 'edvision-study-total-seconds';
const DAILY_MISSIONS_STORAGE_KEY = 'edvision-profile-daily-missions';
const DAILY_MISSION_CELEBRATION_EVENT = 'edvision-daily-mission-celebration';
const MOCK_LEADERBOARD_TOTAL_PLAYERS = 20;
const MOCK_LEADERBOARD_SELF_RANK = 10;
const MOCK_LEADERBOARD_BASE_TIMESTAMP = Date.now();
const MOCK_LEADERBOARD_FALLBACK_NAMES = [
  'An Nguyen',
  'Minh Hoang',
  'Linh Tran',
  'Huy Le',
  'Khanh Vo',
  'Bao Pham',
  'Nhi Do',
  'Gia Han',
  'Quang Truong',
  'Thu Ha',
  'Nam Bui',
  'Phuong Ly',
  'Tuan Kiet',
  'My Duyen',
  'Hai Dang',
  'Yen Nhi',
  'Duc Anh',
  'Ngoc Mai',
  'Thanh Dat',
  'Bich Ngoc',
  'Hoang Long',
  'Kim Anh',
  'Gia Bao',
  'Lan Chi',
  'Nguyen Khoa',
];

const DEFAULT_LEARNING_ECONOMY: LearningEconomyState = {
  hearts: 5,
  gems: 0,
  streakDays: 0,
  lastStudyDate: null,
  totalXp: 0,
};

const DAILY_MISSION_TEMPLATES: DailyMissionTemplate[] = [
  {
    id: 'pomo-session',
    title: 'Hoàn thành 1 phiên Pomodoro',
    description: 'Duy trì một phiên tập trung để giữ nhịp học đều đặn mỗi ngày.',
    xpReward: 30,
    iconClass: 'fa-hourglass-half',
  },
  {
    id: 'quiz-checkpoint',
    title: 'Làm 1 bài quiz kiểm tra',
    description: 'Luyện phản xạ nhanh bằng cách hoàn thành ít nhất một bài quiz.',
    xpReward: 25,
    iconClass: 'fa-circle-question',
  },
  {
    id: 'map-planning',
    title: 'Xem lộ trình học trên Map',
    description: 'Mở bản đồ học tập và xác định lesson tiếp theo cần chinh phục.',
    xpReward: 15,
    iconClass: 'fa-map',
  },
  {
    id: 'profile-review',
    title: 'Check lại tiến độ profile',
    description: 'Theo dõi streak, tổng KN và thành tích để tối ưu kế hoạch học.',
    xpReward: 20,
    iconClass: 'fa-chart-line',
  },
];

const getLocalDateStamp = (date = new Date()) => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getPreviousDateStamp = (dateStamp: string) => {
  const [year, month, day] = dateStamp.split('-').map((value) => Number(value));
  if (!year || !month || !day) return null;

  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() - 1);
  return getLocalDateStamp(date);
};

const normalizeStreakDaysByStudyDate = (
  streakDays: number,
  lastStudyDate: string | null
) => {
  if (!lastStudyDate) return 0;

  const today = getLocalDateStamp();
  const yesterday = getPreviousDateStamp(today);
  const isStreakActive =
    lastStudyDate === today || (!!yesterday && lastStudyDate === yesterday);

  return isStreakActive ? Math.max(0, Math.round(streakDays)) : 0;
};

const readLearningEconomy = (): LearningEconomyState => {
  try {
    const rawValue = localStorage.getItem(LEARNING_ECONOMY_STORAGE_KEY);
    if (!rawValue) return DEFAULT_LEARNING_ECONOMY;

    const parsed = JSON.parse(rawValue) as Partial<LearningEconomyState>;
    const heartsValue = Number(parsed?.hearts);
    const gemsValue = Number(parsed?.gems);
    const streakDaysValue = Number(parsed?.streakDays);
    const totalXpValue = Number(parsed?.totalXp);
    const lastStudyDateValue =
      typeof parsed?.lastStudyDate === 'string' ? parsed.lastStudyDate : null;

    if (
      !Number.isFinite(heartsValue) ||
      !Number.isFinite(gemsValue) ||
      !Number.isFinite(streakDaysValue) ||
      !Number.isFinite(totalXpValue)
    ) {
      return DEFAULT_LEARNING_ECONOMY;
    }

    return {
      hearts: Math.max(0, Math.min(5, Math.round(heartsValue))),
      gems: Math.max(0, Math.round(gemsValue)),
      streakDays: normalizeStreakDaysByStudyDate(streakDaysValue, lastStudyDateValue),
      lastStudyDate: lastStudyDateValue,
      totalXp: Math.max(0, Math.round(totalXpValue)),
    };
  } catch {
    return DEFAULT_LEARNING_ECONOMY;
  }
};

const readQuizLeaderboard = (): QuizLeaderboardEntry[] => {
  try {
    const rawValue = localStorage.getItem(QUIZ_LEADERBOARD_STORAGE_KEY);
    if (!rawValue) return [];

    const parsed = JSON.parse(rawValue) as QuizLeaderboardEntry[];
    if (!Array.isArray(parsed)) return [];

    return parsed
      .filter(
        (entry) =>
          typeof entry.id === 'string' &&
          typeof entry.playerName === 'string' &&
          Number.isFinite(entry.scorePercent) &&
          Number.isFinite(entry.scorePoints) &&
          Number.isFinite(entry.correctAnswers) &&
          Number.isFinite(entry.totalQuestions) &&
          Number.isFinite(entry.completionSeconds) &&
          Number.isFinite(entry.completedAt)
      )
      .sort((a, b) => {
        if (b.scorePercent !== a.scorePercent) return b.scorePercent - a.scorePercent;
        if (b.scorePoints !== a.scorePoints) return b.scorePoints - a.scorePoints;
        if (a.completionSeconds !== b.completionSeconds) return a.completionSeconds - b.completionSeconds;
        return b.completedAt - a.completedAt;
      });
  } catch {
    return [];
  }
};

const buildProfileQuizLeaderboard = (
  profile: ProfileData | null,
  seededEntries: QuizLeaderboardEntry[]
) => {
  const currentUserName = profile?.fullName?.trim() || 'Bạn';
  const currentUserCode = profile?.studentCode?.trim() || 'current-user';

  const usedNames = new Set<string>([currentUserName.toLowerCase()]);
  const candidateNames = [
    ...seededEntries.map((entry) => entry.playerName.trim()).filter(Boolean),
    ...MOCK_LEADERBOARD_FALLBACK_NAMES,
  ];

  const uniqueNames = candidateNames.filter((name) => {
    const normalized = name.toLowerCase();
    if (usedNames.has(normalized)) return false;
    usedNames.add(normalized);
    return true;
  });

  let nameIndex = 0;
  const getNextName = (rank: number) => {
    const nextName = uniqueNames[nameIndex];
    nameIndex += 1;
    return nextName || `Người học ${rank}`;
  };

  return Array.from({ length: MOCK_LEADERBOARD_TOTAL_PLAYERS }, (_, index) => {
    const rank = index + 1;
    const isCurrentUser = rank === MOCK_LEADERBOARD_SELF_RANK;
    const scorePercent = Math.max(55, 96 - rank);
    const totalQuestions = 20;
    const correctAnswers = Math.max(
      0,
      Math.min(totalQuestions, Math.round((scorePercent / 100) * totalQuestions))
    );

    return {
      id: isCurrentUser ? `mock-self-${currentUserCode}` : `mock-player-${rank}`,
      playerName: isCurrentUser ? currentUserName : getNextName(rank),
      scorePercent,
      scorePoints: scorePercent,
      correctAnswers,
      totalQuestions,
      completionSeconds: 420 + rank * 15,
      completedAt: MOCK_LEADERBOARD_BASE_TIMESTAMP - rank * 13 * 60 * 1000,
    };
  }).sort((a, b) => {
    if (b.scorePercent !== a.scorePercent) return b.scorePercent - a.scorePercent;
    if (b.scorePoints !== a.scorePoints) return b.scorePoints - a.scorePoints;
    if (a.completionSeconds !== b.completionSeconds) return a.completionSeconds - b.completionSeconds;
    return b.completedAt - a.completedAt;
  });
};

const normalizePlayerName = (value: string | null | undefined) =>
  value?.trim().toLowerCase() ?? '';

const countTop3Placements = (
  entries: QuizLeaderboardEntry[],
  profile: ProfileData | null
) => {
  if (!profile) return 0;

  const nameCandidates = [profile.fullName, profile.studentCode]
    .map((name) => normalizePlayerName(name))
    .filter(Boolean);

  if (nameCandidates.length === 0) return 0;

  return entries
    .slice(0, 3)
    .reduce((total, entry) => {
      const playerName = normalizePlayerName(entry.playerName);
      return nameCandidates.includes(playerName) ? total + 1 : total;
    }, 0);
};

const resolveLeagueByKnowledgePoints = (knowledgePoints: number) => {
  if (knowledgePoints >= 1200) return 'Kim cương';
  if (knowledgePoints >= 900) return 'Bạch kim';
  if (knowledgePoints >= 500) return 'Vàng';
  if (knowledgePoints >= 250) return 'Bạc';
  return 'Đồng';
};

const readTotalStudySeconds = () => {
  try {
    const value = Number(localStorage.getItem(STUDY_TIME_STORAGE_KEY) || '0');
    return Number.isFinite(value) ? Math.max(0, Math.round(value)) : 0;
  } catch {
    return 0;
  }
};

const buildDailyMissionList = (progressList: DailyMissionProgress[]) => {
  const progressMap = new Map(progressList.map((mission) => [mission.id, mission]));

  return DAILY_MISSION_TEMPLATES.map((template) => {
    const progress = progressMap.get(template.id);
    return {
      ...template,
      completed: true,
      claimed: progress?.claimed ?? false,
    };
  });
};

const readDailyMissions = (): DailyMissionState => {
  const todayStamp = getLocalDateStamp();

  try {
    const rawValue = localStorage.getItem(DAILY_MISSIONS_STORAGE_KEY);
    if (!rawValue) {
      return {
        dateStamp: todayStamp,
        missions: buildDailyMissionList([]),
      };
    }

    const parsed = JSON.parse(rawValue) as Partial<DailyMissionStorage>;
    const dateStamp = typeof parsed?.dateStamp === 'string' ? parsed.dateStamp : todayStamp;
    const progressList = Array.isArray(parsed?.missions)
      ? parsed.missions.filter(
          (mission): mission is DailyMissionProgress =>
            !!mission &&
            typeof mission.id === 'string' &&
            typeof mission.completed === 'boolean' &&
            typeof mission.claimed === 'boolean'
        )
      : [];

    if (dateStamp !== todayStamp) {
      return {
        dateStamp: todayStamp,
        missions: buildDailyMissionList([]),
      };
    }

    return {
      dateStamp,
      missions: buildDailyMissionList(progressList),
    };
  } catch {
    return {
      dateStamp: todayStamp,
      missions: buildDailyMissionList([]),
    };
  }
};

const persistDailyMissions = (state: DailyMissionState) => {
  const payload: DailyMissionStorage = {
    dateStamp: state.dateStamp,
    missions: state.missions.map((mission) => ({
      id: mission.id,
      completed: mission.completed,
      claimed: mission.claimed,
    })),
  };

  localStorage.setItem(DAILY_MISSIONS_STORAGE_KEY, JSON.stringify(payload));
};

const formatDateStampForDisplay = (dateStamp: string) => {
  const [year, month, day] = dateStamp.split('-');
  if (!year || !month || !day) return dateStamp;
  return `${day}/${month}/${year}`;
};

const formatStudyDuration = (totalSeconds: number) => {
  const safeSeconds = Math.max(0, Math.round(totalSeconds));
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);

  if (hours > 0) {
    return `${hours}h ${String(minutes).padStart(2, '0')}m`;
  }

  return `${minutes}m`;
};

const formatLeaderboardDuration = (seconds: number) => {
  const safeSeconds = Math.max(0, Math.round(seconds));
  const minutes = Math.floor(safeSeconds / 60);
  const remainSeconds = safeSeconds % 60;
  return `${minutes}:${remainSeconds.toString().padStart(2, '0')}`;
};

const formatLeaderboardCompletedAt = (timestamp: number) => {
  return new Date(timestamp).toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

type Props = {
  visible: boolean;
  onClose: () => void;
  panelMode?: SettingsPanelMode;
  initialX?: number;
  initialY?: number;
  initialWidth?: number;
  initialHeight?: number;
  clickSoundEnabled?: boolean;
  onToggleClickSound?: (enabled: boolean) => void;
  selectedClickSound?: string;
  clickSoundOptions?: ClickSoundOption[];
  clickSoundVolume?: number;
  onChangeClickSoundVolume?: (volume: number) => void;
  onSelectClickSound?: (soundPath: string) => void;
  onPreviewClickSound?: (soundPath?: string) => void;
};

export default function SettingsPanel({
  visible,
  onClose,
  panelMode = 'settings',
  initialX = (window.innerWidth - 700) / 2,
  initialY = (window.innerHeight - 600 - 80) / 2,
  initialWidth = 700,
  initialHeight = 600,
  clickSoundEnabled = true,
  onToggleClickSound,
  selectedClickSound,
  clickSoundOptions,
  clickSoundVolume = 40,
  onChangeClickSoundVolume,
  onSelectClickSound,
  onPreviewClickSound,
}: Props) {
  const { position, handleMouseDown } = useDraggable(initialX, initialY);
  const { size, handleMouseDown: handleResize } = useResizable(initialWidth, initialHeight, 500, 400);
  const isProfilePanel = panelMode === 'profile';
  
  const [activeTab, setActiveTab] = useState<'profile' | 'general' | 'appearance' | 'notifications' | 'privacy' | 'click-sound'>(
    isProfilePanel ? 'profile' : 'general'
  );
  const [profileSection, setProfileSection] = useState<ProfileSection>('info');
  const [language, setLanguage] = useState('vi');
  const [autoSave, setAutoSave] = useState(true);
  const [soundEffects, setSoundEffects] = useState(clickSoundEnabled);
  const [darkMode, setDarkMode] = useState(true);
  const [notifications, setNotifications] = useState(true);
  const [pomodoroNotif, setPomodoroNotif] = useState(true);
  const [showTimer, setShowTimer] = useState(true);
  const [selectedClickSoundLocal, setSelectedClickSoundLocal] = useState(
    selectedClickSound || '/sounds/ui/minimalist11.mp3'
  );
  const [clickSoundVolumeLocal, setClickSoundVolumeLocal] = useState(clickSoundVolume);
  
  // Profile state
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<ProfileData>>({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [profileStats, setProfileStats] = useState<ProfileStatsState>({
    streakDays: 0,
    totalKnowledgePoints: 0,
    currentLeague: 'Đồng',
    top3Count: 0,
    totalCourseCount: STUDENT_LEARNING_COURSES.length,
    totalStudySeconds: 0,
  });
  const [leaderboardEntries, setLeaderboardEntries] = useState<QuizLeaderboardEntry[]>(() =>
    buildProfileQuizLeaderboard(null, readQuizLeaderboard())
  );
  const [dailyMissionState, setDailyMissionState] = useState<DailyMissionState>(() =>
    readDailyMissions()
  );
  
  // Avatar crop state
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string>('');
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const leaderboardScrollRef = useRef<HTMLDivElement>(null);
  const selfLeaderboardRowRef = useRef<HTMLTableRowElement>(null);

  const fallbackClickSoundOptions: ClickSoundOption[] = [
    {
      id: 'minimalist11',
      label: 'Minimalist 11',
      file: '/sounds/ui/minimalist11.mp3',
      description: 'Âm click nhẹ, sạch và hiện đại.',
    },
    {
      id: 'african4',
      label: 'African 4',
      file: '/sounds/ui/african4.mp3',
      description: 'Âm click trầm hơn, rõ nhịp.',
    },
  ];

  const availableClickSoundOptions = clickSoundOptions && clickSoundOptions.length > 0
    ? clickSoundOptions
    : fallbackClickSoundOptions;

  const effectiveSelectedClickSound = selectedClickSound ?? selectedClickSoundLocal;
  const effectiveClickSoundVolume = clickSoundVolume ?? clickSoundVolumeLocal;

  useEffect(() => {
    setSoundEffects(clickSoundEnabled);
  }, [clickSoundEnabled]);

  useEffect(() => {
    if (selectedClickSound) {
      setSelectedClickSoundLocal(selectedClickSound);
    }
  }, [selectedClickSound]);

  useEffect(() => {
    setClickSoundVolumeLocal(clickSoundVolume);
  }, [clickSoundVolume]);

  useEffect(() => {
    setActiveTab(isProfilePanel ? 'profile' : 'general');
    setProfileSection('info');
    setIsEditing(false);
  }, [isProfilePanel]);

  const handleToggleSoundEffects = () => {
    const next = !soundEffects;
    setSoundEffects(next);
    onToggleClickSound?.(next);
  };

  const handleSelectClickSound = (soundPath: string) => {
    if (onSelectClickSound) {
      onSelectClickSound(soundPath);
    } else {
      setSelectedClickSoundLocal(soundPath);
    }

    if (soundEffects) {
      onPreviewClickSound?.(soundPath);
    }
  };

  const handleClickSoundVolumeChange = (nextVolume: number) => {
    const volume = Math.min(100, Math.max(0, nextVolume));
    if (onChangeClickSoundVolume) {
      onChangeClickSoundVolume(volume);
    } else {
      setClickSoundVolumeLocal(volume);
    }
  };

  const addKnowledgePoints = (xpAmount: number) => {
    const safeReward = Math.max(0, Math.round(xpAmount));
    if (safeReward <= 0) return;

    let nextTotalXp = safeReward;

    try {
      const rawValue = localStorage.getItem(LEARNING_ECONOMY_STORAGE_KEY);
      const parsed = rawValue ? (JSON.parse(rawValue) as Record<string, unknown>) : {};
      const currentXpValue = Number(parsed.totalXp);
      const safeCurrentXp = Number.isFinite(currentXpValue) ? Math.max(0, Math.round(currentXpValue)) : 0;

      nextTotalXp = safeCurrentXp + safeReward;

      localStorage.setItem(
        LEARNING_ECONOMY_STORAGE_KEY,
        JSON.stringify({
          ...parsed,
          totalXp: nextTotalXp,
        })
      );
    } catch {
      const fallbackEconomy = readLearningEconomy();
      nextTotalXp = fallbackEconomy.totalXp + safeReward;
      localStorage.setItem(
        LEARNING_ECONOMY_STORAGE_KEY,
        JSON.stringify({
          ...fallbackEconomy,
          totalXp: nextTotalXp,
        })
      );
    }

    setProfileStats((prev) => ({
      ...prev,
      totalKnowledgePoints: nextTotalXp,
      currentLeague: resolveLeagueByKnowledgePoints(nextTotalXp),
    }));
  };

  const getCurrentDailyMissionState = () => {
    const state = readDailyMissions();
    persistDailyMissions(state);
    return state;
  };

  const claimDailyMissionXp = (missionId: string) => {
    const currentState = getCurrentDailyMissionState();
    let rewardedXp = 0;

    const nextState: DailyMissionState = {
      dateStamp: currentState.dateStamp,
      missions: currentState.missions.map((mission) => {
        if (mission.id !== missionId || mission.claimed) {
          return mission;
        }

        rewardedXp = mission.xpReward;
        return {
          ...mission,
          claimed: true,
        };
      }),
    };

    persistDailyMissions(nextState);
    setDailyMissionState(nextState);

    if (rewardedXp > 0) {
      addKnowledgePoints(rewardedXp);
    }
  };

  const claimAllDailyMissionXp = () => {
    const currentState = getCurrentDailyMissionState();
    let rewardedXp = 0;

    const nextState: DailyMissionState = {
      dateStamp: currentState.dateStamp,
      missions: currentState.missions.map((mission) => {
        if (!mission.completed || mission.claimed) {
          return mission;
        }

        rewardedXp += mission.xpReward;
        return {
          ...mission,
          claimed: true,
        };
      }),
    };

    if (rewardedXp <= 0) return;

    persistDailyMissions(nextState);
    setDailyMissionState(nextState);
    addKnowledgePoints(rewardedXp);
  };

  const triggerDailyMissionCelebration = () => {
    const currentState = getCurrentDailyMissionState();
    const missionCount = currentState.missions.length;
    const claimedCount = currentState.missions.filter((mission) => mission.claimed).length;
    const canCelebrate = missionCount > 0 && claimedCount === missionCount;

    if (!canCelebrate) return;

    window.dispatchEvent(
      new CustomEvent(DAILY_MISSION_CELEBRATION_EVENT, {
        detail: {
          message: 'Bạn đã hoàn thành nhiệm vụ ngày hôm nay!',
        },
      })
    );
  };

  // Load profile data when panel opens
  useEffect(() => {
    if (visible && isProfilePanel && !profileData) {
      loadProfile();
    }
  }, [visible, isProfilePanel, profileData]);

  useEffect(() => {
    if (!visible || !isProfilePanel) return;

    const syncProfileStats = () => {
      const learningEconomy = readLearningEconomy();
      const storedLeaderboard = readQuizLeaderboard();
      const leaderboard = buildProfileQuizLeaderboard(profileData, storedLeaderboard);
      const totalKnowledgePoints = learningEconomy.totalXp;

      setLeaderboardEntries(leaderboard);

      setProfileStats({
        streakDays: learningEconomy.streakDays,
        totalKnowledgePoints,
        currentLeague: resolveLeagueByKnowledgePoints(totalKnowledgePoints),
        top3Count: countTop3Placements(leaderboard, profileData),
        totalCourseCount: STUDENT_LEARNING_COURSES.length,
        totalStudySeconds: readTotalStudySeconds(),
      });
    };

    syncProfileStats();
    const syncTimer = window.setInterval(syncProfileStats, 1000);

    const handleStorageSync = (event: StorageEvent) => {
      if (
        !event.key ||
        event.key === LEARNING_ECONOMY_STORAGE_KEY ||
        event.key === QUIZ_LEADERBOARD_STORAGE_KEY ||
        event.key === STUDY_TIME_STORAGE_KEY
      ) {
        syncProfileStats();
      }
    };

    window.addEventListener('storage', handleStorageSync);
    return () => {
      window.clearInterval(syncTimer);
      window.removeEventListener('storage', handleStorageSync);
    };
  }, [visible, isProfilePanel, profileData?.fullName, profileData?.studentCode]);

  useEffect(() => {
    if (!visible || !isProfilePanel) return;

    const syncDailyMissions = () => {
      const state = readDailyMissions();
      persistDailyMissions(state);
      setDailyMissionState(state);
    };

    syncDailyMissions();
    const syncTimer = window.setInterval(syncDailyMissions, 60000);

    const handleStorageSync = (event: StorageEvent) => {
      if (!event.key || event.key === DAILY_MISSIONS_STORAGE_KEY) {
        syncDailyMissions();
      }
    };

    window.addEventListener('storage', handleStorageSync);
    return () => {
      window.clearInterval(syncTimer);
      window.removeEventListener('storage', handleStorageSync);
    };
  }, [visible, isProfilePanel]);

  useEffect(() => {
    if (profileSection !== 'info' && isEditing) {
      setIsEditing(false);
    }
  }, [profileSection, isEditing]);

  const loadProfile = async () => {
    try {
      setProfileLoading(true);
      const token = TokenManager.getToken();
      if (!token) return;

      const res = await fetch(buildUrl('/profile/student'), {
        credentials: 'include',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!res.ok) return;

      const data = await res.json();
      const profile = data?.profile || {};
      
      // Get raw date for input field
      const rawDate = profile.dateOfBirth ? profile.dateOfBirth.split('T')[0] : '';
      
      setProfileData({
        fullName: profile.fullName || '',
        email: profile.email || '',
        phone: profile.phoneNumber || '',
        dateOfBirth: profile.dateOfBirth ? formatDate(profile.dateOfBirth) : '',
        dateOfBirthRaw: rawDate,
        gender: profile.gender || '',
        nationality: profile.nationality || '',
        address: profile.address || '',
        avatarUrl: getFullAvatarUrl(profile.avatarUrl),
        studentCode: data?.studentCode || '',
        major: data?.major || '',
        className: data?.className || '',
      });
    } catch (error) {
      console.error('Failed to load profile:', error);
    } finally {
      setProfileLoading(false);
    }
  };

  // Start editing profile
  const startEditing = () => {
    if (profileData) {
      setEditForm({
        fullName: profileData.fullName,
        phone: profileData.phone,
        dateOfBirthRaw: profileData.dateOfBirthRaw,
        gender: profileData.gender,
        nationality: profileData.nationality,
        address: profileData.address,
      });
      setIsEditing(true);
      setSaveError(null);
      setSaveSuccess(false);
    }
  };

  // Cancel editing
  const cancelEditing = () => {
    setIsEditing(false);
    setEditForm({});
    setSaveError(null);
  };

  // Save profile changes
  const saveProfile = async () => {
    try {
      setSaving(true);
      setSaveError(null);
      
      const token = TokenManager.getToken();
      if (!token) {
        throw new Error('Vui lòng đăng nhập lại');
      }

      const payload = {
        full_name: editForm.fullName,
        phone_number: editForm.phone || null,
        date_of_birth: editForm.dateOfBirthRaw || null,
        gender: editForm.gender || null,
        nationality: editForm.nationality || null,
        address: editForm.address || null,
      };

      const res = await fetch(buildUrl('/profile/me'), {
        method: 'PUT',
        credentials: 'include',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error('Cập nhật thất bại');
      }

      // Reload profile data
      await loadProfile();
      setIsEditing(false);
      setSaveSuccess(true);
      
      // Hide success message after 3 seconds
      setTimeout(() =>setSaveSuccess(false), 3000);
    } catch (err: any) {
      console.error('Save profile error:', err);
      setSaveError(err?.message || 'Có lỗi xảy ra khi lưu');
    } finally {
      setSaving(false);
    }
  };

  // Handle avatar file selection
  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setSaveError('Vui lòng chọn file hình ảnh');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size >5 * 1024 * 1024) {
      setSaveError('Kích thước file không được vượt quá 5MB');
      return;
    }

    // Create object URL for preview
    const imageUrl = URL.createObjectURL(file);
    setSelectedImage(imageUrl);
    setCropModalOpen(true);
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Handle cropped image upload
  const handleCropComplete = async (croppedBlob: Blob) => {
    try {
      setCropModalOpen(false);
      setUploadingAvatar(true);
      setSaveError(null);

      const token = TokenManager.getToken();
      if (!token) {
        throw new Error('Vui lòng đăng nhập lại');
      }

      // Create FormData with cropped image
      const formData = new FormData();
      formData.append('file', croppedBlob, 'avatar.jpg');

      // Upload avatar
      const uploadRes = await fetch(buildUrl('/profile/upload-avatar'), {
        method: 'POST',
        credentials: 'include',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!uploadRes.ok) {
        throw new Error('Upload ảnh thất bại');
      }

      const { url } = await uploadRes.json();

      // Update profile with new avatar URL
      const updateRes = await fetch(buildUrl('/profile/me'), {
        method: 'PUT',
        credentials: 'include',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          avatar_url: url,
        }),
      });

      if (!updateRes.ok) {
        throw new Error('Cập nhật avatar thất bại');
      }

      // Update localStorage user object
      const userStr = localStorage.getItem('user');
      if (userStr) {
        try {
          const userObj = JSON.parse(userStr);
          userObj.avatarUrl = url;
          userObj.avatar = url;
          userObj.avatar_url = url;
          localStorage.setItem('user', JSON.stringify(userObj));
        } catch (e) {
          console.error('Failed to update localStorage user', e);
        }
      }

      // Dispatch event to notify other components (Header, etc.)
      window.dispatchEvent(new CustomEvent('avatar-updated', { detail: { url } }));

      // Reload profile
      await loadProfile();
      setSaveSuccess(true);
      setTimeout(() =>setSaveSuccess(false), 3000);
    } catch (err: any) {
      console.error('Avatar upload error:', err);
      setSaveError(err?.message || 'Có lỗi xảy ra khi upload ảnh');
    } finally {
      setUploadingAvatar(false);
      // Clean up object URL
      if (selectedImage) {
        URL.revokeObjectURL(selectedImage);
        setSelectedImage('');
      }
    }
  };

  // Close crop modal
  const handleCropCancel = () => {
    setCropModalOpen(false);
    if (selectedImage) {
      URL.revokeObjectURL(selectedImage);
      setSelectedImage('');
    }
  };

  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    } catch {
      return '';
    }
  };

  const getFullAvatarUrl = (url: string | null | undefined): string => {
    if (!url) return 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    return `http://localhost:3000${url}`;
  };

  if (!visible) return null;

  const tabs = [
    { id: 'general', icon: 'fa-sliders-h', label: 'General' },
    { id: 'appearance', icon: 'fa-palette', label: 'Appearance' },
    { id: 'notifications', icon: 'fa-bell', label: 'Notifications' },
    { id: 'privacy', icon: 'fa-shield-alt', label: 'Privacy' },
    { id: 'click-sound', icon: 'fa-hand-pointer', label: 'Click Sound' },
  ];

  const profileSections: Array<{ id: ProfileSection; icon: string; label: string }> = [
    { id: 'info', icon: 'fa-id-card', label: 'Thông tin' },
    { id: 'stats', icon: 'fa-chart-simple', label: 'Thống kê' },
    { id: 'missions', icon: 'fa-list-check', label: 'Nhiệm vụ' },
    { id: 'leaderboard', icon: 'fa-trophy', label: 'Quiz Leaderboard' },
  ];

  const profileAchievements = [
    {
      id: 'streak-fire',
      level: 'CẤP 1',
      title: 'Lửa rừng',
      progress: Math.min(profileStats.streakDays, 3),
      target: 3,
      description: 'Đạt chuỗi 3 ngày streak',
      iconClass: 'fas fa-fire',
      iconWrapperClass: 'bg-gradient-to-br from-[#ff6b4a] to-[#ff3c56]',
    },
    {
      id: 'master-kn',
      level: 'CẤP 4',
      title: 'Cao nhân',
      progress: Math.min(profileStats.totalKnowledgePoints, 1000),
      target: 1000,
      description: 'Đạt được 1000 KN',
      iconClass: 'fas fa-hat-wizard',
      iconWrapperClass: 'bg-gradient-to-br from-[#80d532] to-[#4ca916]',
    },
    {
      id: 'champion',
      level: 'CẤP 4',
      title: 'Quán quân',
      progress: Math.min(profileStats.top3Count, 4),
      target: 4,
      description: 'Thăng hạng lên Giải đấu',
      iconClass: 'fas fa-shield-alt',
      iconWrapperClass: 'bg-gradient-to-br from-[#be7df6] to-[#9e48ea]',
    },
  ];

  const totalStudyDurationLabel = formatStudyDuration(profileStats.totalStudySeconds);
  const leaderboardViewportHeight = Math.max(220, Math.min(520, size.height - 420));
  const selfRankIndex = leaderboardEntries.findIndex((entry) => {
    const entryName = normalizePlayerName(entry.playerName);
    const fullName = normalizePlayerName(profileData?.fullName);
    const studentCode = normalizePlayerName(profileData?.studentCode);
    return entryName === fullName || entryName === studentCode;
  });
  const stickySelfRankEntry = selfRankIndex >= 0 ? leaderboardEntries[selfRankIndex] : null;
  const stickySelfRank = selfRankIndex >= 0 ? selfRankIndex + 1 : null;
  const completedDailyMissionCount = dailyMissionState.missions.filter((mission) => mission.completed).length;
  const claimedDailyMissionCount = dailyMissionState.missions.filter((mission) => mission.claimed).length;
  const claimableDailyMissions = dailyMissionState.missions.filter(
    (mission) => mission.completed && !mission.claimed
  );
  const canQuickClaimDailyMissions = claimableDailyMissions.length >= 2;
  const quickClaimDailyMissionXp = claimableDailyMissions.reduce(
    (total, mission) => total + mission.xpReward,
    0
  );
  const totalDailyMissionXp = dailyMissionState.missions.reduce((total, mission) => total + mission.xpReward, 0);
  const claimedDailyMissionXp = dailyMissionState.missions.reduce(
    (total, mission) => total + (mission.claimed ? mission.xpReward : 0),
    0
  );
  const canOpenDailyChest =
    dailyMissionState.missions.length > 0 &&
    claimedDailyMissionCount === dailyMissionState.missions.length;
  const dailyMissionProgressPercent = dailyMissionState.missions.length > 0
    ? Math.min((claimedDailyMissionCount / dailyMissionState.missions.length) * 100, 100)
    : 0;
  const jumpToSelfRank = () => {
    const scrollContainer = leaderboardScrollRef.current;
    const selfRow = selfLeaderboardRowRef.current;
    if (!scrollContainer || !selfRow) return;

    const headerOffset = 52;
    const targetTop = Math.max(0, selfRow.offsetTop - headerOffset);
    scrollContainer.scrollTo({
      top: targetTop,
      behavior: 'smooth',
    });
  };
  const profileSectionTitle =
    profileSection === 'info'
      ? 'Thông tin'
      : profileSection === 'stats'
        ? 'Thống kê'
        : profileSection === 'missions'
          ? 'Nhiệm vụ hằng ngày'
        : 'Quiz Leaderboard';

  return (
    <div
      className="fixed z-10"style={{ left: `${position.x}px`, top: `${position.y}px`, width: `${size.width}px`, height: `${size.height}px` }}
    >
      <div className="backdrop-blur-[20px] bg-white/10 border border-white/20 rounded-3xl shadow-2xl h-full flex flex-col relative">
        {/* Header */}
        <div
          className="flex-shrink-0 h-10 cursor-move rounded-t-3xl flex items-center justify-between px-6"onMouseDown={handleMouseDown}
        >
          <div className="flex items-center gap-3">
            <i className={`fas ${isProfilePanel ? 'fa-user-circle' : 'fa-cog'} text-white/80 text-lg`}></i>
            <h2 className="text-xl font-semibold text-white">{isProfilePanel ? 'Profile' : 'Settings'}</h2>
          </div>
          <button onClick={onClose} className="text-white/60 hover:text-white transition">
            <i className="fas fa-times text-xl"></i>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Sidebar Tabs */}
          <div className="w-48 bg-black/20 border-r border-white/10 p-4 space-y-2">
            {isProfilePanel
              ? profileSections.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => setProfileSection(section.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition ${
                      profileSection === section.id
                        ? 'bg-white/20 text-white'
                        : 'text-white/60 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <i className={`fas ${section.icon}`}></i>
                    <span className="text-sm font-semibold">{section.label}</span>
                  </button>
                ))
              : tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as typeof activeTab)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition ${
                      activeTab === tab.id
                        ? 'bg-white/20 text-white'
                        : 'text-white/60 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <i className={`fas ${tab.icon}`}></i>
                    <span className="text-sm font-medium">{tab.label}</span>
                  </button>
                ))}
          </div>

          {/* Settings Content */}
          <div
            className={`flex-1 overflow-y-auto p-6 space-y-6 ${
              isProfilePanel
                ? '[-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden'
                : ''
            }`}
          >
            {isProfilePanel && activeTab === 'profile' && (
              <>
                <div className="font-semibold">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-white text-lg font-bold">{profileSectionTitle}</h3>
                    {profileData && !isEditing && profileSection === 'info' && (
                      <button
                        onClick={startEditing}
                        className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-sm rounded-lg transition flex items-center gap-2">
                        <i className="fas fa-pencil-alt text-xs"></i>Chỉnh sửa
                      </button>)}
                  </div>
                  
                  {/* Success Message */}
                  {saveSuccess && (
                    <div className="mb-4 p-3 bg-green-500/20 border border-green-500/30 rounded-xl flex items-center gap-2 text-green-400">
                      <i className="fas fa-check-circle"></i>
                      <span className="text-sm">Đã lưu thay đổi thành công!</span>
                    </div>)}

                  {/* Error Message */}
                  {saveError && (
                    <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-xl flex items-center gap-2 text-red-400">
                      <i className="fas fa-exclamation-circle"></i>
                      <span className="text-sm">{saveError}</span>
                    </div>)}
                  
                  {profileLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <i className="fas fa-spinner fa-spin text-white/60 text-2xl"></i>
                    </div>) : profileData ? (
                    <div className="space-y-6">
                      {/* Hidden file input */}
                      <input
                        ref={fileInputRef}
                        type="file"accept="image/*"onChange={handleAvatarSelect}
                        className="hidden"/>

                      {/* Avatar & Basic Info */}
                      <div className="flex items-center gap-4 p-4 bg-white/5 rounded-xl">
                        <div className="relative group">
                          <img
                            src={profileData.avatarUrl}
                            alt="Avatar"className="w-20 h-20 rounded-full object-cover border-2 border-white/20 transition group-hover:border-pink-500/50"/>
                          {/* Avatar overlay button */}
                          <button
                            onClick={() =>fileInputRef.current?.click()}
                            disabled={uploadingAvatar}
                            className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center cursor-pointer disabled:cursor-wait">
                            {uploadingAvatar ? (
                              <i className="fas fa-spinner fa-spin text-white"></i>) : (
                              <i className="fas fa-camera text-white"></i>)}
                          </button>
                          {/* Edit badge */}
                          <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-pink-500 rounded-full flex items-center justify-center border-2 border-gray-900 shadow-lg">
                            <i className="fas fa-pencil-alt text-white text-xs"></i>
                          </div>
                        </div>
                        <div className="flex-1">
                          <div className="text-white font-semibold text-lg">{profileData.fullName || 'Chưa cập nhật'}</div>
                          <div className="text-white/60 text-sm">{profileData.studentCode}</div>
                          <div className="text-white/50 text-xs mt-1">{profileData.major} • {profileData.className}</div>
                          <button
                            onClick={() =>fileInputRef.current?.click()}
                            disabled={uploadingAvatar}
                            className="mt-2 text-xs text-pink-400 hover:text-pink-300 transition flex items-center gap-1 disabled:opacity-50">
                            <i className="fas fa-camera"></i>
                            {uploadingAvatar ? 'Đang tải...': 'Đổi ảnh đại diện'}
                          </button>
                        </div>
                      </div>

                      {/* Edit Mode */}
                      {isEditing ? (
                        <div className="space-y-4">
                          <div className="text-white/70 text-xs font-medium uppercase tracking-wider">Chỉnh sửa thông tin</div>
                          
                          {/* Full Name */}
                          <div>
                            <label className="text-white/60 text-xs mb-1.5 block">Họ và tên <span className="text-pink-400">*</span></label>
                            <input
                              type="text"value={editForm.fullName || ''}
                              onChange={(e) =>setEditForm({ ...editForm, fullName: e.target.value })}
                              className="w-full px-3 py-2.5 bg-white/10 border border-white/20 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-pink-500/50 focus:border-pink-500/50"placeholder="Nhập họ và tên"/>
                          </div>

                          {/* Phone */}
                          <div>
                            <label className="text-white/60 text-xs mb-1.5 block">Số điện thoại</label>
                            <input
                              type="tel"value={editForm.phone || ''}
                              onChange={(e) =>setEditForm({ ...editForm, phone: e.target.value })}
                              className="w-full px-3 py-2.5 bg-white/10 border border-white/20 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-pink-500/50 focus:border-pink-500/50"placeholder="Nhập số điện thoại"/>
                          </div>

                          {/* Date of Birth & Gender */}
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="text-white/60 text-xs mb-1.5 block">Ngày sinh</label>
                              <input
                                type="date"value={editForm.dateOfBirthRaw || ''}
                                onChange={(e) =>setEditForm({ ...editForm, dateOfBirthRaw: e.target.value })}
                                className="w-full px-3 py-2.5 bg-white/10 border border-white/20 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-pink-500/50 focus:border-pink-500/50"style={{ colorScheme: 'dark'}}
                              />
                            </div>
                            <div>
                              <label className="text-white/60 text-xs mb-1.5 block">Giới tính</label>
                              <select
                                value={editForm.gender || ''}
                                onChange={(e) =>setEditForm({ ...editForm, gender: e.target.value })}
                                className="w-full px-3 py-2.5 bg-white/10 border border-white/20 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-pink-500/50 focus:border-pink-500/50">
                                <option value=""className="bg-gray-800">-- Chọn --</option>
                                <option value="Nam"className="bg-gray-800">Nam</option>
                                <option value="Nữ"className="bg-gray-800">Nữ</option>
                                <option value="Khác"className="bg-gray-800">Khác</option>
                              </select>
                            </div>
                          </div>

                          {/* Nationality */}
                          <div>
                            <label className="text-white/60 text-xs mb-1.5 block">Quốc tịch</label>
                            <input
                              type="text"value={editForm.nationality || ''}
                              onChange={(e) =>setEditForm({ ...editForm, nationality: e.target.value })}
                              className="w-full px-3 py-2.5 bg-white/10 border border-white/20 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-pink-500/50 focus:border-pink-500/50"placeholder="Nhập quốc tịch"/>
                          </div>

                          {/* Address */}
                          <div>
                            <label className="text-white/60 text-xs mb-1.5 block">Địa chỉ</label>
                            <textarea
                              rows={2}
                              value={editForm.address || ''}
                              onChange={(e) =>setEditForm({ ...editForm, address: e.target.value })}
                              className="w-full px-3 py-2.5 bg-white/10 border border-white/20 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-pink-500/50 focus:border-pink-500/50 resize-none"placeholder="Nhập địa chỉ"/>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex gap-3 pt-2">
                            <button
                              onClick={cancelEditing}
                              disabled={saving}
                              className="flex-1 py-2.5 bg-white/10 hover:bg-white/20 text-white font-medium rounded-xl transition disabled:opacity-50">Hủy
                            </button>
                            <button
                              onClick={saveProfile}
                              disabled={saving || !editForm.fullName}
                              className="flex-1 py-2.5 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-medium rounded-xl transition disabled:opacity-50 flex items-center justify-center gap-2">
                              {saving ? (
                                <>
                                  <i className="fas fa-spinner fa-spin"></i>Đang lưu...
                                </>) : (
                                <>
                                  <i className="fas fa-save"></i>Lưu thay đổi
                                </>)}
                            </button>
                          </div>
                        </div>) : (
                        <>
                          {profileSection === 'info' ? (
                            <div className="space-y-4">
                              <div className="text-white/85 text-xs font-semibold uppercase tracking-wider">Thông tin</div>

                              <div className="grid grid-cols-2 gap-3">
                                <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                                  <div className="text-white/55 text-xs mb-1 font-medium">Họ và tên</div>
                                  <div className="text-white text-sm font-semibold">{profileData.fullName || '—'}</div>
                                </div>
                                <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                                  <div className="text-white/55 text-xs mb-1 font-medium">Ngày sinh</div>
                                  <div className="text-white text-sm font-semibold">{profileData.dateOfBirth || '—'}</div>
                                </div>
                                <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                                  <div className="text-white/55 text-xs mb-1 font-medium">Giới tính</div>
                                  <div className="text-white text-sm font-semibold">{profileData.gender || '—'}</div>
                                </div>
                                <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                                  <div className="text-white/55 text-xs mb-1 font-medium">Quốc tịch</div>
                                  <div className="text-white text-sm font-semibold">{profileData.nationality || '—'}</div>
                                </div>
                              </div>

                              <div className="space-y-2">
                                <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/10">
                                  <i className="fas fa-envelope text-white/50 w-5"></i>
                                  <div>
                                    <div className="text-white/55 text-xs font-medium">Email</div>
                                    <div className="text-white text-sm font-semibold">{profileData.email || '—'}</div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/10">
                                  <i className="fas fa-phone text-white/50 w-5"></i>
                                  <div>
                                    <div className="text-white/55 text-xs font-medium">Số điện thoại</div>
                                    <div className="text-white text-sm font-semibold">{profileData.phone || '—'}</div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/10">
                                  <i className="fas fa-map-marker-alt text-white/50 w-5"></i>
                                  <div>
                                    <div className="text-white/55 text-xs font-medium">Địa chỉ</div>
                                    <div className="text-white text-sm font-semibold">{profileData.address || '—'}</div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ) : profileSection === 'stats' ? (
                            <div className="space-y-4">
                              <div className="text-white/85 text-xs font-semibold uppercase tracking-wider">Thống kê</div>

                              <div className="grid grid-cols-2 gap-3">
                                <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                                  <div className="flex items-center gap-2 mb-1.5">
                                    <i className="fas fa-fire text-amber-300"></i>
                                    <div className="text-white font-semibold text-base">{profileStats.streakDays}</div>
                                  </div>
                                  <div className="text-white/55 text-xs">Ngày streak</div>
                                </div>

                                <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                                  <div className="flex items-center gap-2 mb-1.5">
                                    <i className="fas fa-bolt text-yellow-300"></i>
                                    <div className="text-white font-semibold text-base">{profileStats.totalKnowledgePoints}</div>
                                  </div>
                                  <div className="text-white/55 text-xs">Tổng điểm KN</div>
                                </div>

                                <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                                  <div className="flex items-center gap-2 mb-1.5">
                                    <i className="fas fa-book-open text-cyan-200"></i>
                                    <div className="text-white font-semibold text-base">{profileStats.totalCourseCount}</div>
                                  </div>
                                  <div className="text-white/55 text-xs">Tổng số môn</div>
                                </div>

                                <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                                  <div className="flex items-center gap-2 mb-1.5">
                                    <i className="fas fa-clock text-sky-200"></i>
                                    <div className="text-white font-semibold text-base">{totalStudyDurationLabel}</div>
                                  </div>
                                  <div className="text-white/55 text-xs">Tổng thời gian đã học</div>
                                </div>

                                <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                                  <div className="flex items-center gap-2 mb-1.5">
                                    <i className="fas fa-medal text-amber-200"></i>
                                    <div className="text-white font-semibold text-base">{profileStats.currentLeague}</div>
                                  </div>
                                  <div className="text-white/55 text-xs">Giải đấu hiện tại</div>
                                </div>

                                <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                                  <div className="flex items-center gap-2 mb-1.5">
                                    <i className="fas fa-trophy text-slate-300"></i>
                                    <div className="text-white font-semibold text-base">{profileStats.top3Count}</div>
                                  </div>
                                  <div className="text-white/55 text-xs">Số lần đạt top 3</div>
                                </div>
                              </div>

                              <div className="space-y-3">
                                <div className="text-white/90 text-base font-semibold">Thành tích</div>

                                <div className="space-y-2.5">
                                  {profileAchievements.map((achievement) => {
                                    const progressPercent = achievement.target > 0
                                      ? Math.min((achievement.progress / achievement.target) * 100, 100)
                                      : 0;

                                    return (
                                      <div
                                        key={achievement.id}
                                        className="p-3 bg-white/5 rounded-xl border border-white/10"
                                      >
                                        <div className="flex items-center gap-3">
                                          <div className={`w-14 h-14 rounded-xl ${achievement.iconWrapperClass} relative flex items-center justify-center flex-shrink-0`}>
                                            <i className={`${achievement.iconClass} text-white text-lg`}></i>
                                            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded-md bg-black/45 text-[9px] font-bold text-white tracking-wide whitespace-nowrap">
                                              {achievement.level}
                                            </div>
                                          </div>

                                          <div className="min-w-0 flex-1">
                                            <div className="flex items-center justify-between gap-3">
                                              <div className="text-white font-semibold text-sm truncate">{achievement.title}</div>
                                              <div className="text-white/55 text-xs font-semibold whitespace-nowrap">
                                                {achievement.progress}/{achievement.target}
                                              </div>
                                            </div>

                                            <div className="mt-2 h-2 bg-white/20 rounded-full overflow-hidden">
                                              <div
                                                className="h-full rounded-full bg-gradient-to-r from-[#ffd84f] to-[#ffbf00]"
                                                style={{ width: `${progressPercent}%` }}
                                              ></div>
                                            </div>

                                            <div className="mt-2 text-white/60 text-xs">{achievement.description}</div>
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            </div>
                          ) : profileSection === 'missions' ? (
                            <div className="space-y-4">
                              <div className="text-white/85 text-xs font-semibold uppercase tracking-wider">Nhiệm vụ hằng ngày</div>

                              <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                                <div className="flex flex-wrap items-center justify-between gap-3">
                                  <div>
                                    <div className="text-white text-sm font-semibold">Hôm nay: {formatDateStampForDisplay(dailyMissionState.dateStamp)}</div>
                                    <div className="text-white/55 text-xs">Nhiệm vụ sẽ tự reset vào ngày mới.</div>
                                  </div>

                                  <div className="text-left sm:text-right">
                                    <div className="text-amber-200 text-sm font-semibold">+{claimedDailyMissionXp}/{totalDailyMissionXp} XP</div>
                                    <div className="text-white/55 text-xs">
                                      {claimedDailyMissionCount}/{dailyMissionState.missions.length} nhiệm vụ đã nhận thưởng
                                    </div>
                                  </div>
                                </div>

                                <div className="mt-2.5 flex items-center gap-2">
                                  <div className="h-2 flex-1 bg-white/15 rounded-full overflow-hidden">
                                    <div
                                      className="h-full rounded-full bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-400 transition-all duration-500"
                                      style={{ width: `${dailyMissionProgressPercent}%` }}
                                    ></div>
                                  </div>

                                  <button
                                    type="button"
                                    onClick={triggerDailyMissionCelebration}
                                    disabled={!canOpenDailyChest}
                                    title={canOpenDailyChest ? 'Mở rương thưởng ngày' : 'Nhận hết XP để mở rương'}
                                    className={`relative h-8 w-8 rounded-lg border flex items-center justify-center transition ${
                                      canOpenDailyChest
                                        ? 'border-amber-200/50 bg-amber-300/20 text-amber-100 hover:scale-105 hover:bg-amber-300/30'
                                        : 'cursor-not-allowed border-white/20 bg-white/5 text-white/40'
                                    }`}
                                  >
                                    <i className="fas fa-box-open text-[13px]"></i>
                                    <span className="absolute -top-1 -right-1 h-4 min-w-[16px] rounded-full border border-amber-200/45 bg-amber-300/90 px-1 text-[9px] font-black text-[#3f250f]">
                                      <i className="fas fa-coins"></i>
                                    </span>
                                  </button>
                                </div>

                                <div className="mt-2 flex items-center justify-between gap-2 text-[11px]">
                                  <span className="text-white/50">
                                    Đã hoàn thành: {completedDailyMissionCount}/{dailyMissionState.missions.length}
                                  </span>
                                  <span className={canOpenDailyChest ? 'text-amber-200/90' : 'text-white/45'}>
                                    {canOpenDailyChest ? 'Rương đã sẵn sàng mở' : 'Nhận đủ XP để mở rương'}
                                  </span>
                                </div>

                                {canQuickClaimDailyMissions && (
                                  <div className="mt-3 flex justify-end">
                                    <button
                                      type="button"
                                      onClick={claimAllDailyMissionXp}
                                      className="rounded-lg border border-cyan-200/35 bg-gradient-to-r from-cyan-300/20 to-sky-300/20 px-3 py-1.5 text-xs font-semibold text-cyan-100 transition hover:from-cyan-300/30 hover:to-sky-300/30"
                                    >
                                      <i className="fas fa-bolt mr-1.5"></i>
                                      Nhận nhanh tất cả (+{quickClaimDailyMissionXp} XP)
                                    </button>
                                  </div>
                                )}
                              </div>

                              <div className="space-y-3">
                                {dailyMissionState.missions.map((mission) => (
                                  <div key={mission.id} className="p-3 bg-white/5 rounded-xl border border-white/10">
                                    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                                      <div className="min-w-0 flex items-start gap-3">
                                        <div
                                          className={`h-10 w-10 rounded-xl flex-shrink-0 flex items-center justify-center border ${
                                            mission.claimed
                                              ? 'border-emerald-300/40 bg-emerald-400/15 text-emerald-200'
                                              : mission.completed
                                                ? 'border-amber-300/40 bg-amber-400/10 text-amber-200'
                                                : 'border-white/20 bg-white/5 text-white/65'
                                          }`}
                                        >
                                          <i className={`fas ${mission.iconClass}`}></i>
                                        </div>

                                        <div className="min-w-0">
                                          <div className="flex flex-wrap items-center gap-2">
                                            <div className="text-white text-sm font-semibold">{mission.title}</div>
                                            <span className="px-2 py-0.5 rounded-full border border-amber-300/30 bg-amber-300/10 text-[11px] font-semibold text-amber-200">
                                              +{mission.xpReward} XP
                                            </span>
                                          </div>

                                          <p className="mt-1 text-xs text-white/65">{mission.description}</p>
                                          <p
                                            className={`mt-1 text-[11px] ${
                                              mission.claimed
                                                ? 'text-emerald-200/85'
                                                : 'text-amber-200/85'
                                            }`}
                                          >
                                            {mission.claimed
                                              ? 'Đã nhận thưởng.'
                                              : 'Nhiệm vụ đã được đánh dấu tự động, bấm Nhận XP để cộng KN.'}
                                          </p>
                                        </div>
                                      </div>

                                      <div className="flex flex-wrap items-center gap-2">
                                        <button
                                          type="button"
                                          onClick={() => claimDailyMissionXp(mission.id)}
                                          disabled={mission.claimed}
                                          className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                                            mission.claimed
                                              ? 'cursor-not-allowed border border-emerald-300/25 bg-emerald-300/10 text-emerald-200/80'
                                              : 'border border-amber-200/35 bg-gradient-to-r from-amber-300/30 to-yellow-200/30 text-amber-100 hover:from-amber-300/40 hover:to-yellow-200/40'
                                          }`}
                                        >
                                          {mission.claimed ? 'Đã nhận' : 'Nhận XP'}
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-4">
                              <div className="text-white/85 text-xs font-semibold uppercase tracking-wider">Quiz Leaderboard</div>

                              {leaderboardEntries.length === 0 ? (
                                <div className="flex items-center justify-center rounded-xl border border-white/10 bg-white/5 px-4 py-8 text-center text-sm text-white/65">
                                  Chưa có dữ liệu quiz. Hoàn thành một bài kiểm tra để xuất hiện trên bảng xếp hạng.
                                </div>
                              ) : (
                                <div className="rounded-xl border border-white/10 bg-white/5 overflow-hidden">
                                  <div
                                    ref={leaderboardScrollRef}
                                    className="overflow-y-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                                    style={{ maxHeight: leaderboardViewportHeight }}
                                  >
                                    <table className="w-full text-left text-sm text-white/90">
                                      <thead className="sticky top-0 z-20 bg-white/5 backdrop-blur-sm text-[11px] uppercase tracking-[0.12em] text-white/55">
                                        <tr>
                                          <th className="px-3 py-2.5">Hạng</th>
                                          <th className="px-3 py-2.5">Người học</th>
                                          <th className="px-3 py-2.5">Điểm</th>
                                          <th className="px-3 py-2.5">Đúng</th>
                                          <th className="px-3 py-2.5">Thời gian</th>
                                          <th className="px-3 py-2.5">Nộp lúc</th>
                                        </tr>
                                      </thead>
                                      <tbody className="relative z-0">
                                        {leaderboardEntries.slice(0, 50).map((entry, index) => (
                                          <tr
                                            key={entry.id}
                                            ref={stickySelfRankEntry?.id === entry.id ? selfLeaderboardRowRef : null}
                                            className={`scroll-mt-14 border-t border-white/10 ${stickySelfRankEntry?.id === entry.id ? 'bg-amber-300/10' : ''}`}
                                          >
                                            <td className="px-3 py-2.5 font-semibold text-amber-200 whitespace-nowrap">
                                              {index === 0 && <i className="fas fa-crown mr-1 text-amber-300"></i>}#{index + 1}
                                            </td>
                                            <td className="px-3 py-2.5 font-semibold">
                                              {entry.playerName}
                                              {stickySelfRankEntry?.id === entry.id && (
                                                <span className="ml-1 text-[11px] text-amber-200">(Bạn)</span>
                                              )}
                                            </td>
                                            <td className="px-3 py-2.5 whitespace-nowrap">
                                              {entry.scorePoints}/100 ({entry.scorePercent}%)
                                            </td>
                                            <td className="px-3 py-2.5 whitespace-nowrap">
                                              {entry.correctAnswers}/{entry.totalQuestions}
                                            </td>
                                            <td className="px-3 py-2.5 whitespace-nowrap">
                                              {formatLeaderboardDuration(entry.completionSeconds)}
                                            </td>
                                            <td className="px-3 py-2.5 text-white/70 whitespace-nowrap">
                                              {formatLeaderboardCompletedAt(entry.completedAt)}
                                            </td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>

                                  {stickySelfRankEntry && stickySelfRank && (
                                    <div className="border-t border-white/15 bg-white/10 backdrop-blur-md px-3 py-2.5">
                                      <button
                                        type="button"
                                        onClick={jumpToSelfRank}
                                        className="w-full rounded-lg px-2 py-1 text-left transition hover:bg-white/10"
                                      >
                                        <div className="text-[10px] uppercase tracking-[0.14em] text-white/55 mb-1">
                                          Vị trí của bạn
                                          <span className="ml-2 text-[10px] normal-case tracking-normal text-white/50">(Bấm để nhảy tới dòng của bạn)</span>
                                        </div>
                                        <div className="flex items-center gap-3 text-sm text-white/90">
                                          <div className="min-w-[50px] font-bold text-amber-200">#{stickySelfRank}</div>
                                          <div className="flex-1 min-w-0 font-semibold truncate">{stickySelfRankEntry.playerName}</div>
                                          <div className="whitespace-nowrap text-white/80">{stickySelfRankEntry.scorePoints}/100</div>
                                          <div className="whitespace-nowrap text-white/70">
                                            {stickySelfRankEntry.correctAnswers}/{stickySelfRankEntry.totalQuestions}
                                          </div>
                                          <div className="whitespace-nowrap text-white/70">
                                            {formatLeaderboardDuration(stickySelfRankEntry.completionSeconds)}
                                          </div>
                                        </div>
                                      </button>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-white/50">
                      <i className="fas fa-user-slash text-4xl mb-3"></i>
                      <p>Không thể tải thông tin profile</p>
                      <button
                        onClick={loadProfile}
                        className="mt-3 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white text-sm transition">Thử lại
                      </button>
                    </div>)}
                </div>
              </>)}

            {activeTab === 'general'&& (
              <>
                <div>
                  <h3 className="text-white text-lg font-semibold mb-4">General Settings</h3>
                  
                  {/* Language Selection */}
                  <div className="space-y-4">
                    <div>
                      <label className="text-white/70 text-sm font-medium mb-2 block">Language</label>
                      <select
                        value={language}
                        onChange={(e) =>setLanguage(e.target.value)}
                        className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-white/30">
                        <option value="vi"className="bg-gray-800">Tiếng Việt</option>
                        <option value="en"className="bg-gray-800">English</option>
                        <option value="ja"className="bg-gray-800">日本語</option>
                        <option value="ko"className="bg-gray-800">한국어</option>
                      </select>
                    </div>

                    {/* Auto Save */}
                    <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl hover:bg-white/10 transition">
                      <div className="flex items-center gap-3">
                        <i className="fas fa-save text-white/60"></i>
                        <div>
                          <div className="text-white font-medium text-sm">Auto Save</div>
                          <div className="text-white/50 text-xs">Automatically save your progress</div>
                        </div>
                      </div>
                      <button
                        onClick={() =>setAutoSave(!autoSave)}
                        className={`relative w-12 h-6 rounded-full transition ${
                          autoSave ? 'bg-pink-500': 'bg-white/20'}`}
                      >
                        <div
                          className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                            autoSave ? 'translate-x-7': 'translate-x-1'}`}
                        />
                      </button>
                    </div>

                    {/* Sound Effects */}
                    <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl hover:bg-white/10 transition">
                      <div className="flex items-center gap-3">
                        <i className="fas fa-volume-up text-white/60"></i>
                        <div>
                          <div className="text-white font-medium text-sm">Sound Effects</div>
                          <div className="text-white/50 text-xs">Play sounds for interactions</div>
                        </div>
                      </div>
                      <button
                        onClick={handleToggleSoundEffects}
                        className={`relative w-12 h-6 rounded-full transition ${
                          soundEffects ? 'bg-pink-500': 'bg-white/20'}`}
                      >
                        <div
                          className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                            soundEffects ? 'translate-x-7': 'translate-x-1'}`}
                        />
                      </button>
                    </div>
                  </div>
                </div>
              </>)}

            {activeTab === 'appearance'&& (
              <>
                <div>
                  <h3 className="text-white text-lg font-semibold mb-4">Appearance</h3>
                  
                  <div className="space-y-4">
                    {/* Dark Mode */}
                    <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl hover:bg-white/10 transition">
                      <div className="flex items-center gap-3">
                        <i className="fas fa-moon text-white/60"></i>
                        <div>
                          <div className="text-white font-medium text-sm">Dark Mode</div>
                          <div className="text-white/50 text-xs">Use dark theme</div>
                        </div>
                      </div>
                      <button
                        onClick={() =>setDarkMode(!darkMode)}
                        className={`relative w-12 h-6 rounded-full transition ${
                          darkMode ? 'bg-pink-500': 'bg-white/20'}`}
                      >
                        <div
                          className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                            darkMode ? 'translate-x-7': 'translate-x-1'}`}
                        />
                      </button>
                    </div>

                    {/* Show Timer */}
                    <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl hover:bg-white/10 transition">
                      <div className="flex items-center gap-3">
                        <i className="fas fa-clock text-white/60"></i>
                        <div>
                          <div className="text-white font-medium text-sm">Show Clock</div>
                          <div className="text-white/50 text-xs">Display clock on screen</div>
                        </div>
                      </div>
                      <button
                        onClick={() =>setShowTimer(!showTimer)}
                        className={`relative w-12 h-6 rounded-full transition ${
                          showTimer ? 'bg-pink-500': 'bg-white/20'}`}
                      >
                        <div
                          className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                            showTimer ? 'translate-x-7': 'translate-x-1'}`}
                        />
                      </button>
                    </div>

                    {/* Theme Presets */}
                    <div>
                      <label className="text-white/70 text-sm font-medium mb-3 block">Theme Presets</label>
                      <div className="grid grid-cols-2 gap-3">
                        {['Minimal', 'Cozy', 'Focus', 'Nature'].map((preset) =>(
                          <button
                            key={preset}
                            className="p-4 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 hover:border-white/30 transition">
                            <div className="text-white text-sm font-medium">{preset}</div>
                          </button>))}
                      </div>
                    </div>
                  </div>
                </div>
              </>)}

            {activeTab === 'notifications'&& (
              <>
                <div>
                  <h3 className="text-white text-lg font-semibold mb-4">Notifications</h3>
                  
                  <div className="space-y-4">
                    {/* Enable Notifications */}
                    <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl hover:bg-white/10 transition">
                      <div className="flex items-center gap-3">
                        <i className="fas fa-bell text-white/60"></i>
                        <div>
                          <div className="text-white font-medium text-sm">Enable Notifications</div>
                          <div className="text-white/50 text-xs">Receive app notifications</div>
                        </div>
                      </div>
                      <button
                        onClick={() =>setNotifications(!notifications)}
                        className={`relative w-12 h-6 rounded-full transition ${
                          notifications ? 'bg-pink-500': 'bg-white/20'}`}
                      >
                        <div
                          className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                            notifications ? 'translate-x-7': 'translate-x-1'}`}
                        />
                      </button>
                    </div>

                    {/* Pomodoro Notifications */}
                    <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl hover:bg-white/10 transition">
                      <div className="flex items-center gap-3">
                        <i className="fas fa-stopwatch text-white/60"></i>
                        <div>
                          <div className="text-white font-medium text-sm">Pomodoro Alerts</div>
                          <div className="text-white/50 text-xs">Get notified when timer ends</div>
                        </div>
                      </div>
                      <button
                        onClick={() =>setPomodoroNotif(!pomodoroNotif)}
                        className={`relative w-12 h-6 rounded-full transition ${
                          pomodoroNotif ? 'bg-pink-500': 'bg-white/20'}`}
                      >
                        <div
                          className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                            pomodoroNotif ? 'translate-x-7': 'translate-x-1'}`}
                        />
                      </button>
                    </div>
                  </div>
                </div>
              </>)}

            {activeTab === 'privacy'&& (
              <>
                <div>
                  <h3 className="text-white text-lg font-semibold mb-4">Privacy & Security</h3>
                  
                  <div className="space-y-4">
                    <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                      <div className="flex items-center gap-3 mb-3">
                        <i className="fas fa-database text-white/60"></i>
                        <div className="text-white font-medium text-sm">Data Storage</div>
                      </div>
                      <p className="text-white/50 text-xs mb-3">Your data is stored locally on your device for privacy and offline access.
                      </p>
                      <button className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-medium rounded-lg transition">Clear All Data
                      </button>
                    </div>

                    <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                      <div className="flex items-center gap-3 mb-3">
                        <i className="fas fa-download text-white/60"></i>
                        <div className="text-white font-medium text-sm">Export Data</div>
                      </div>
                      <p className="text-white/50 text-xs mb-3">Download your journal entries and study logs.
                      </p>
                      <button className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-medium rounded-lg transition">Export as JSON
                      </button>
                    </div>
                  </div>
                </div>
              </>)}

            {activeTab === 'click-sound' && (
              <>
                <div>
                  <h3 className="text-white text-lg font-semibold mb-4">Click Sound</h3>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl hover:bg-white/10 transition">
                      <div className="flex items-center gap-3">
                        <i className="fas fa-mouse-pointer text-white/60"></i>
                        <div>
                          <div className="text-white font-medium text-sm">Button Click Sound</div>
                          <div className="text-white/50 text-xs">Bật âm thanh khi bấm nút trong Learning Space</div>
                        </div>
                      </div>
                      <button
                        data-click-sound="off"
                        onClick={handleToggleSoundEffects}
                        className={`relative w-12 h-6 rounded-full transition ${
                          soundEffects ? 'bg-pink-500' : 'bg-white/20'
                        }`}
                      >
                        <div
                          className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                            soundEffects ? 'translate-x-7' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>

                    <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                      <div className="flex items-center justify-between gap-3 mb-3">
                        <div>
                          <div className="text-white font-medium text-sm">UI Soundpack</div>
                          <p className="text-white/50 text-xs mt-1">Chọn âm thanh click mặc định cho các nút.</p>
                        </div>
                        <button
                          data-click-sound="off"
                          onClick={() => onPreviewClickSound?.(effectiveSelectedClickSound)}
                          disabled={!soundEffects}
                          className="px-3 py-2 bg-white/10 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-medium rounded-lg transition"
                        >
                          <i className="fas fa-play mr-1"></i>
                          Nghe thử
                        </button>
                      </div>

                      <div className="mb-4 p-3 bg-black/20 rounded-xl border border-white/10">
                        <div className="flex items-center justify-between mb-2">
                          <div className="text-white text-xs font-medium">Âm lượng click</div>
                          <div className="text-white/70 text-xs">{Math.round(effectiveClickSoundVolume)}%</div>
                        </div>
                        <input
                          data-click-sound="off"
                          type="range"
                          min={0}
                          max={100}
                          step={1}
                          value={effectiveClickSoundVolume}
                          onChange={(e) => handleClickSoundVolumeChange(Number(e.target.value))}
                          className="w-full accent-pink-500"
                        />
                      </div>

                      <div className="space-y-2">
                        {availableClickSoundOptions.map((option) => {
                          const isSelected = effectiveSelectedClickSound === option.file;
                          return (
                            <button
                              key={option.id}
                              data-click-sound="off"
                              onClick={() => handleSelectClickSound(option.file)}
                              className={`w-full text-left p-3 rounded-xl border transition ${
                                isSelected
                                  ? 'bg-pink-500/20 border-pink-400/60'
                                  : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/30'
                              }`}
                            >
                              <div className="flex items-center justify-between gap-3">
                                <div>
                                  <div className="text-white text-sm font-medium">{option.label}</div>
                                  <div className="text-white/50 text-xs mt-0.5">{option.description}</div>
                                </div>
                                <span className={`text-xs font-medium ${isSelected ? 'text-pink-300' : 'text-white/60'}`}>
                                  {isSelected ? 'Đang dùng' : 'Chọn'}
                                </span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}

            {!isProfilePanel && (
              <div className="pt-4 border-t border-white/10">
                <button
                  onClick={onClose}
                  className="w-full py-3 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-bold rounded-lg transition"
                >
                  <i className="fas fa-check mr-2"></i>
                  Save Changes
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Resize Handle */}
        <div
          className="absolute w-3 h-3 bg-white/30 border-2 border-white/60 rounded-full cursor-nwse-resize bottom-[-6px] right-[-6px] z-10 hover:bg-white/50"onMouseDown={handleResize}
        />
      </div>

      {/* Image Crop Modal */}
      <ImageCropModal
        isOpen={cropModalOpen}
        imageSrc={selectedImage}
        onClose={handleCropCancel}
        onCropComplete={handleCropComplete}
      />
    </div>);
}

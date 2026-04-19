import { useEffect, useRef, useState } from 'react';
import { useDraggable } from '../hooks/useDraggable';
import { useResizable } from '../hooks/useResizable';
import {
  STUDENT_LEARNING_COURSES,
  type StudentLearningCourse
} from '../data/learningCourses';

type Props = {
  visible: boolean;
  onClose: () => void;
  onModuleClick?: (moduleId: number, courseId: string) => void;
  selectedCourseId?: string | null;
  initialX?: number;
  initialY?: number;
  initialWidth?: number;
  initialHeight?: number;
};

type ModuleStatus = 'locked' | 'completed' | 'current';

type ModuleNode = {
  id: number;
  title: string;
  status: ModuleStatus;
  stars?: number;
  thumbnail: string;
  note: string;
  isBoss?: boolean;
};

type Course = StudentLearningCourse;

type LearningEconomyState = {
  hearts: number;
  gems: number;
  streakDays: number;
  lastStudyDate: string | null;
  totalXp: number;
};

type FloorThemeId = 'bedroom' | 'hotel' | 'museum';

type FloorTheme = {
  id: FloorThemeId;
  name: string;
  shortLabel: string;
  icon: string;
  framePalettes: string[];
  wallGlowClass: string;
  wallTintClass: string;
  topTrimClass: string;
  wallPatternClass: string;
  floorShadeClass: string;
  dustColorClass: string;
  doorPalette: {
    shell: string;
    inner: string;
    badge: string;
    knob: string;
    glow: string;
    lockPill: string;
  };
};

type LockOverlayProps = {
  message: string;
};

type FrameItemProps = {
  module: ModuleNode;
  framePalette: string;
  lockEnabled: boolean;
  justUnlocked: boolean;
  onOpenLesson: (module: ModuleNode) => void;
  onOpenNote: (module: ModuleNode) => void;
};

type NotePopupProps = {
  module: ModuleNode | null;
  onClose: () => void;
};

type LobbySceneProps = {
  floorTheme: FloorTheme;
  onStart: () => void;
  onExit: () => void;
};

type CorridorDoorProps = {
  variant: FloorTheme;
  direction: 'forward' | 'backward';
  unlocked: boolean;
  title: string;
  subtitle: string;
  onClick: () => void;
};

type GalleryWallProps = {
  modules: ModuleNode[];
  floorTheme: FloorTheme;
  lockEnabled: boolean;
  justUnlockedModule: number | null;
  nextDoorUnlocked: boolean;
  nextDoorTitle: string;
  nextDoorSubtitle: string;
  backDoorTitle: string;
  backDoorSubtitle: string;
  wallRef: { current: HTMLDivElement | null };
  isDragging: boolean;
  onWallMouseDown: (e: React.MouseEvent<HTMLDivElement>) => void;
  onWallMouseMove: (e: React.MouseEvent<HTMLDivElement>) => void;
  onWallMouseUp: () => void;
  onWallWheel: (e: React.WheelEvent<HTMLDivElement>) => void;
  onModuleOpen: (module: ModuleNode) => void;
  onNoteOpen: (module: ModuleNode) => void;
  onBackDoorClick: () => void;
  onGateClick: () => void;
};

const LEARNING_ECONOMY_STORAGE_KEY = 'edvision-learning-economy';
const DEFAULT_LEARNING_ECONOMY: LearningEconomyState = {
  hearts: 5,
  gems: 0,
  streakDays: 0,
  lastStudyDate: null,
  totalXp: 0
};

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

    const normalizedStreakDays = normalizeStreakDaysByStudyDate(
      streakDaysValue,
      lastStudyDateValue
    );

    return {
      hearts: Math.max(0, Math.min(5, Math.round(heartsValue))),
      gems: Math.max(0, Math.round(gemsValue)),
      streakDays: normalizedStreakDays,
      lastStudyDate: lastStudyDateValue,
      totalXp: Math.max(0, Math.round(totalXpValue))
    };
  } catch {
    return DEFAULT_LEARNING_ECONOMY;
  }
};

const LESSON_THUMBNAILS = [
  'https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&w=860&q=80',
  'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=860&q=80',
  'https://images.unsplash.com/photo-1489493887464-892be6d1daae?auto=format&fit=crop&w=860&q=80',
  'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?auto=format&fit=crop&w=860&q=80',
  'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=860&q=80',
  'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=860&q=80',
  'https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=860&q=80',
  'https://images.unsplash.com/photo-1500673922987-e212871fec22?auto=format&fit=crop&w=860&q=80',
  'https://images.unsplash.com/photo-1519999482648-25049ddd37b1?auto=format&fit=crop&w=860&q=80',
  'https://images.unsplash.com/photo-1470770903676-69b98201ea1c?auto=format&fit=crop&w=860&q=80',
  'https://images.unsplash.com/photo-1529074963764-98f45c47344b?auto=format&fit=crop&w=860&q=80',
  'https://images.unsplash.com/photo-1517697471339-4aa32003c11a?auto=format&fit=crop&w=860&q=80'
];

const FLOOR_THEMES: FloorTheme[] = [
  {
    id: 'bedroom',
    name: 'Moonlight Bedroom Corridor',
    shortLabel: 'Bedroom Floor',
    icon: 'fas fa-bed',
    framePalettes: [
      'from-[#c8b2e3] via-[#e4d6f4] to-[#f4ebff]',
      'from-[#ad91cc] via-[#ccb7e4] to-[#e7d8f7]'
    ],
    wallGlowClass:
      'bg-[radial-gradient(circle_at_20%_0%,rgba(255,244,255,0.5),transparent_42%),radial-gradient(circle_at_78%_10%,rgba(237,220,255,0.35),transparent_50%)]',
    wallTintClass: 'bg-gradient-to-b from-[#6f5a92]/12 via-[#4e3f6d]/22 to-[#2a213d]/48',
    topTrimClass: 'bg-gradient-to-r from-[#d8c4ee]/40 via-[#f3e8ff]/72 to-[#d8c4ee]/40',
    wallPatternClass:
      'bg-[repeating-linear-gradient(90deg,rgba(247,240,255,0.13)_0,rgba(247,240,255,0.13)_164px,rgba(122,102,161,0.1)_164px,rgba(122,102,161,0.1)_178px)]',
    floorShadeClass: 'bg-gradient-to-b from-transparent to-[#2b223f]/72',
    dustColorClass: 'bg-[#f6edff]/72',
    doorPalette: {
      shell: 'border-[#e9d8ff]/45 bg-gradient-to-b from-[#8f77b3] via-[#6a527f] to-[#3d2d52]',
      inner: 'border-[#f1e6ff]/30 bg-gradient-to-b from-[#b59cd3] to-[#5d4879]',
      badge: 'bg-[#2a1f3a]/85 text-[#f2e8ff]',
      knob: 'bg-[#f2e1ff]',
      glow: 'from-[#ebddff]/35 to-transparent',
      lockPill: 'bg-[#261b35]/82 text-[#f5e8ff]'
    }
  },
  {
    id: 'hotel',
    name: 'Royal Hotel Hall',
    shortLabel: 'Hotel Floor',
    icon: 'fas fa-hotel',
    framePalettes: [
      'from-[#6e1830] via-[#b7435b] to-[#ebbe68]',
      'from-[#4c1022] via-[#7f243b] to-[#d6a251]'
    ],
    wallGlowClass:
      'bg-[radial-gradient(circle_at_18%_0%,rgba(255,214,226,0.3),transparent_45%),radial-gradient(circle_at_82%_8%,rgba(255,218,154,0.28),transparent_50%)]',
    wallTintClass: 'bg-gradient-to-b from-[#6a1e2d]/10 via-[#451423]/20 to-[#240d15]/55',
    topTrimClass: 'bg-gradient-to-r from-[#a56d3f]/36 via-[#edcb87]/70 to-[#a56d3f]/36',
    wallPatternClass:
      'bg-[repeating-linear-gradient(90deg,rgba(255,230,192,0.06)_0,rgba(255,230,192,0.06)_132px,rgba(110,20,40,0.12)_132px,rgba(110,20,40,0.12)_146px)]',
    floorShadeClass: 'bg-gradient-to-b from-transparent to-[#3b111d]/75',
    dustColorClass: 'bg-[#ffe6bf]/62',
    doorPalette: {
      shell: 'border-[#f7d7a1]/45 bg-gradient-to-b from-[#7f1f33] via-[#5a1526] to-[#2a0c15]',
      inner: 'border-[#f2d9a4]/32 bg-gradient-to-b from-[#96445c] to-[#3f1321]',
      badge: 'bg-[#2a0f17]/85 text-[#ffdca3]',
      knob: 'bg-[#f5c980]',
      glow: 'from-[#ffd88d]/32 to-transparent',
      lockPill: 'bg-[#220b12]/85 text-[#fbd79f]'
    }
  },
  {
    id: 'museum',
    name: 'Grand Archive Museum',
    shortLabel: 'Museum Floor',
    icon: 'fas fa-landmark',
    framePalettes: [
      'from-[#8b5b32] via-[#b67a42] to-[#d8b57a]',
      'from-[#5f432d] via-[#8a623f] to-[#c9a16b]'
    ],
    wallGlowClass:
      'bg-[radial-gradient(circle_at_20%_0%,rgba(255,240,214,0.45),transparent_42%),radial-gradient(circle_at_80%_10%,rgba(255,231,193,0.3),transparent_48%)]',
    wallTintClass: 'bg-gradient-to-b from-[#5a3b26]/5 via-transparent to-[#311f14]/40',
    topTrimClass: 'bg-gradient-to-r from-[#c5a87a]/30 via-[#efd8ad]/65 to-[#c5a87a]/30',
    wallPatternClass:
      'bg-[repeating-linear-gradient(90deg,rgba(255,244,225,0.09)_0,rgba(255,244,225,0.09)_190px,rgba(102,67,43,0.05)_190px,rgba(102,67,43,0.05)_200px)]',
    floorShadeClass: 'bg-gradient-to-b from-transparent to-[#3b2418]/65',
    dustColorClass: 'bg-[#fff3da]/70',
    doorPalette: {
      shell: 'border-[#f4e4be]/40 bg-gradient-to-b from-[#6d4a2e] via-[#4a301e] to-[#2a1a12]',
      inner: 'border-[#d7bd89]/35 bg-gradient-to-b from-[#8b613b] to-[#3e281a]',
      badge: 'bg-[#1f130d]/85 text-amber-200',
      knob: 'bg-[#d6b377]',
      glow: 'from-amber-200/35 to-transparent',
      lockPill: 'bg-[#180e09]/80 text-[#f5dca8]'
    }
  }
];

const getModuleTitle = (index: number): string => {
  const titles = [
    'Introduction', 'Fundamentals', 'Core Concepts', 'Advanced Topics',
    'Practical Applications', 'Deep Dive', 'Expert Techniques', 'Specialization',
    'Integration', 'Final Project', 'Capstone', 'Mastery'
  ];
  return titles[index % titles.length];
};

const buildMuseumModules = (course: Course, completedModules: number): ModuleNode[] => {
  const modules: ModuleNode[] = [];
  const midtermIndex = Math.floor(course.moduleCount / 2);
  const finalIndex = course.moduleCount - 1;

  for (let i = 0; i < course.moduleCount; i++) {
    const isCompleted = i < completedModules;
    const isCurrent = i === completedModules && completedModules < course.moduleCount;
    const isFinalExam = i === finalIndex;
    const isMidtermExam = i === midtermIndex && !isFinalExam;

    const moduleTitle = isFinalExam
      ? `Lesson ${i + 1}: Comprehensive Final Assessment`
      : isMidtermExam
      ? `Lesson ${i + 1}: Midterm Checkpoint`
      : `Lesson ${i + 1}: ${getModuleTitle(i)}`;

    const moduleNote = isFinalExam
      ? 'Đây là bài kiểm tra tổng hợp cuối course của floor hiện tại. Hoàn thành để mở cổng tiếp theo.'
      : isMidtermExam
      ? 'Đây là bài kiểm tra giữa kỳ để đánh giá tiến độ học trước khi đi tiếp.'
      : `Focus of this lesson: ${getModuleTitle(i)}. ${course.description}`;

    modules.push({
      id: i + 1,
      title: moduleTitle,
      status: isCompleted ? 'completed' : isCurrent ? 'current' : 'locked',
      stars: isCompleted ? ((i % 3) + 1) : undefined,
      thumbnail: LESSON_THUMBNAILS[i % LESSON_THUMBNAILS.length],
      note: moduleNote,
      isBoss: isFinalExam
    });
  }

  return modules;
};

function LockOverlay({ message }: LockOverlayProps) {
  return (
    <div className="lock-overlay">
      <div className="lock-cloud"></div>

      <div className="lock-icon">
        <i className="fas fa-lock"></i>
      </div>

      <div className="lock-tooltip">
        {message}
      </div>
    </div>
  );
}

function FrameItem({
  module,
  framePalette,
  lockEnabled,
  justUnlocked,
  onOpenLesson,
  onOpenNote
}: FrameItemProps) {
  const isLocked = lockEnabled && module.status === 'locked';
  const isCurrent = module.status === 'current';

  return (
    <div className="frame-wrapper">
      <button
        type="button"
        onMouseDown={(e) => e.stopPropagation()}
        onClick={() => {
          if (!isLocked) {
            onOpenLesson(module);
          }
        }}
        className={`frame-card ${isLocked ? 'locked' : ''}`}
      >
        {justUnlocked && (
          <div className="animate-unlock-halo pointer-events-none absolute -inset-3 rounded-lg bg-gradient-to-r from-amber-100/75 via-yellow-100/65 to-amber-100/75 blur-md"></div>
        )}

        <img
          src={module.thumbnail}
          alt={module.title}
          className={`${isLocked ? 'brightness-[0.45] saturate-0' : ''}`}
        />

        <div className={`pointer-events-none absolute inset-x-3 top-3 h-1 rounded-full bg-gradient-to-r ${framePalette} opacity-55`}></div>

        {isLocked && (
          <LockOverlay message="Complete previous lesson to unlock" />
        )}

        <div className="frame-glow"></div>

        {isCurrent && (
          <span className="frame-badge current">Current</span>
        )}

        {module.isBoss && (
          <span className="frame-badge boss">
            <i className="fas fa-crown mr-1"></i>
            Final
          </span>
        )}
      </button>

      <div className="frame-info">
        <p className="lesson-title">{module.title}</p>

        <div className="mt-2 flex items-center justify-center gap-2">
        {typeof module.stars === 'number' && (
            <span className="stars-pill">
            <i className="fas fa-star mr-1 text-amber-300"></i>
            {module.stars}/3
          </span>
        )}

        <button
          type="button"
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            onOpenNote(module);
          }}
          className="note-btn"
        >
          <i className="fas fa-sticky-note mr-1"></i>
          Note
        </button>
        </div>
      </div>
    </div>
  );
}

function CorridorDoor({
  variant,
  direction,
  unlocked,
  title,
  subtitle,
  onClick
}: CorridorDoorProps) {
  const isForward = direction === 'forward';
  const gateToneClass =
    variant.id === 'hotel'
      ? 'gate-tone-hotel'
      : variant.id === 'bedroom'
        ? 'gate-tone-bedroom'
        : 'gate-tone-museum';
  const doorImageByFloor: Record<FloorThemeId, string> = {
    bedroom: '/doors/door-1.png',
    hotel: '/doors/door-2.png',
    museum: '/doors/door-3.png'
  };
  const doorImage = doorImageByFloor[variant.id];

  return (
    <div className="gate-wrapper">
      <button
        type="button"
        onMouseDown={(e) => e.stopPropagation()}
        onClick={() => {
          if (unlocked) {
            onClick();
          }
        }}
        aria-label={`${title}. ${subtitle}`}
        className={`gate ${unlocked ? 'open' : 'locked'} ${gateToneClass}`}
      >
        <div className="gate-door">
          <img src={doorImage} alt={`${title} door`} className="gate-door-image" draggable={false} />
        </div>

        <div className="gate-sign">
          {title}
        </div>
      </button>
    </div>
  );
}

function GalleryWall({
  modules,
  floorTheme,
  lockEnabled,
  justUnlockedModule,
  nextDoorUnlocked,
  nextDoorTitle,
  nextDoorSubtitle,
  backDoorTitle,
  backDoorSubtitle,
  wallRef,
  isDragging,
  onWallMouseDown,
  onWallMouseMove,
  onWallMouseUp,
  onWallWheel,
  onModuleOpen,
  onNoteOpen,
  onBackDoorClick,
  onGateClick
}: GalleryWallProps) {
  const framePalettes = floorTheme.framePalettes;
  const wallWidth = Math.max(2200, modules.length * 360 + 900);
  const wallAmbientPalette: Record<FloorThemeId, {
    shellStart: string;
    shellMid: string;
    shellEnd: string;
    baseLeft: string;
    baseMid: string;
    baseRight: string;
    overlayTop: string;
    overlayBottom: string;
    stripeLight: string;
    stripeSoft: string;
    textPrimary: string;
    textSecondary: string;
    textShadow: string;
  }> = {
    bedroom: {
      shellStart: '#8074a3',
      shellMid: '#5a4d79',
      shellEnd: '#302744',
      baseLeft: '#d7d0ed',
      baseMid: '#c1b5df',
      baseRight: '#a899c8',
      overlayTop: 'rgba(78,67,118,0.2)',
      overlayBottom: 'rgba(25,18,42,0.5)',
      stripeLight: 'rgba(255,255,255,0.18)',
      stripeSoft: 'rgba(111,92,165,0.24)',
      textPrimary: '#f8f1ff',
      textSecondary: '#e5d8ff',
      textShadow: 'rgba(24,15,42,0.78)'
    },
    hotel: {
      shellStart: '#9a4a60',
      shellMid: '#66263a',
      shellEnd: '#341320',
      baseLeft: '#f0d4c8',
      baseMid: '#ddb6a4',
      baseRight: '#c38f79',
      overlayTop: 'rgba(132,57,78,0.22)',
      overlayBottom: 'rgba(40,14,24,0.52)',
      stripeLight: 'rgba(255,245,232,0.16)',
      stripeSoft: 'rgba(152,73,98,0.24)',
      textPrimary: '#ffe8dc',
      textSecondary: '#f8d2c2',
      textShadow: 'rgba(40,14,24,0.8)'
    },
    museum: {
      shellStart: '#8a6b4d',
      shellMid: '#5f4734',
      shellEnd: '#32251d',
      baseLeft: '#e2cfb4',
      baseMid: '#ccb18f',
      baseRight: '#ae8a64',
      overlayTop: 'rgba(112,82,53,0.2)',
      overlayBottom: 'rgba(35,24,14,0.5)',
      stripeLight: 'rgba(255,248,230,0.16)',
      stripeSoft: 'rgba(120,88,56,0.24)',
      textPrimary: '#f8ead4',
      textSecondary: '#ead2ad',
      textShadow: 'rgba(33,22,12,0.76)'
    }
  };
  const activeWallPalette = wallAmbientPalette[floorTheme.id];
  const wallBackground = `
    linear-gradient(to bottom, ${activeWallPalette.overlayTop}, ${activeWallPalette.overlayBottom}),
    repeating-linear-gradient(90deg, ${activeWallPalette.stripeLight} 0, ${activeWallPalette.stripeLight} 132px, ${activeWallPalette.stripeSoft} 132px, ${activeWallPalette.stripeSoft} 148px),
    linear-gradient(to right, ${activeWallPalette.baseLeft}, ${activeWallPalette.baseMid}, ${activeWallPalette.baseRight})
  `;

  return (
    <div
      className="relative h-full overflow-hidden"
      style={{
        background: `linear-gradient(120deg, ${activeWallPalette.shellStart}, ${activeWallPalette.shellMid}, ${activeWallPalette.shellEnd})`
      }}
    >

      <div
        ref={wallRef}
        className={`museum-scroll relative h-full overflow-x-auto overflow-y-hidden ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
        onMouseDown={onWallMouseDown}
        onMouseMove={onWallMouseMove}
        onMouseUp={onWallMouseUp}
        onMouseLeave={onWallMouseUp}
        onWheel={onWallWheel}
      >
        <div
          className="wall-container"
          style={{ minWidth: `${wallWidth}px`, background: wallBackground }}
        >
          <CorridorDoor
            variant={floorTheme}
            direction="backward"
            unlocked
            title={backDoorTitle}
            subtitle={backDoorSubtitle}
            onClick={onBackDoorClick}
          />

          {modules.map((module, index) => (
            <FrameItem
              key={module.id}
              module={module}
              framePalette={framePalettes[index % framePalettes.length]}
              lockEnabled={lockEnabled}
              justUnlocked={justUnlockedModule === module.id}
              onOpenLesson={onModuleOpen}
              onOpenNote={onNoteOpen}
            />
          ))}

          <CorridorDoor
            variant={floorTheme}
            direction="forward"
            unlocked={nextDoorUnlocked}
            title={nextDoorTitle}
            subtitle={nextDoorSubtitle}
            onClick={onGateClick}
          />
        </div>
      </div>

      <style>{`
        .museum-scroll {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }

        .museum-scroll::-webkit-scrollbar {
          display: none;
        }

        .wall-container {
          position: relative;
          display: flex;
          align-items: flex-end;
          min-height: 100%;
          padding: 80px;
          background:
            linear-gradient(to bottom, rgba(76, 60, 45, 0.24), rgba(25, 18, 13, 0.5)),
            repeating-linear-gradient(90deg, rgba(255,255,255,0.14) 0, rgba(255,255,255,0.14) 132px, rgba(124,95,66,0.2) 132px, rgba(124,95,66,0.2) 148px),
            linear-gradient(to right, #dfc6a4, #b9936f, #7f6149);
        }

        .frame-wrapper {
          display: flex;
          flex-direction: column;
          align-items: center;
          margin: 0 60px;
        }

        .frame-card {
          position: relative;
          width: 220px;
          height: 300px;
          padding: 12px;
          background: linear-gradient(145deg, #c9a46a, #8b6b3e);
          border: 6px solid #5a4324;
          border-radius: 6px;
          box-shadow:
            0 10px 25px rgba(0, 0, 0, 0.45),
            inset 0 0 10px rgba(255, 255, 255, 0.2);
          cursor: pointer;
          transition: transform 0.3s ease;
          overflow: visible;
        }

        .frame-card.locked {
          cursor: not-allowed;
        }

        .frame-card img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          border: 3px solid #2c2c2c;
          display: block;
        }

        .frame-card:hover:not(.locked) {
          transform: scale(1.05) rotate(0.5deg);
        }

        .frame-glow {
          position: absolute;
          inset: 0;
          box-shadow: 0 0 25px rgba(255, 215, 120, 0.45);
          opacity: 0;
          transition: opacity 0.3s ease;
          pointer-events: none;
        }

        .frame-card:hover:not(.locked) .frame-glow {
          opacity: 1;
        }

        .frame-badge {
          position: absolute;
          left: 12px;
          top: 12px;
          border-radius: 9999px;
          padding: 3px 8px;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: #1c120c;
          background: rgba(255, 233, 176, 0.95);
          border: 1px solid rgba(90, 67, 36, 0.45);
        }

        .frame-badge.boss {
          left: auto;
          right: 12px;
          background: rgba(255, 213, 136, 0.95);
        }

        .frame-info {
          margin-top: 12px;
          text-align: center;
          color: ${activeWallPalette.textSecondary};
          max-width: 240px;
          text-shadow: 0 2px 8px ${activeWallPalette.textShadow};
        }

        .lesson-title {
          font-size: 13px;
          font-weight: 600;
          color: ${activeWallPalette.textPrimary};
          line-height: 1.35;
          text-shadow: 0 2px 8px ${activeWallPalette.textShadow};
        }

        .stars-pill {
          display: inline-flex;
          align-items: center;
          border: 1px solid rgba(255, 216, 140, 0.35);
          background: rgba(44, 30, 19, 0.85);
          padding: 4px 10px;
          border-radius: 9999px;
          font-size: 11px;
          font-weight: 600;
          color: #f0cc89;
        }

        .note-btn {
          margin-top: 0;
          padding: 4px 10px;
          border: none;
          background: #444;
          color: #fff;
          border-radius: 6px;
          cursor: pointer;
          font-size: 12px;
          font-weight: 600;
          transition: background 0.2s ease;
        }

        .note-btn:hover {
          background: #555;
        }

        .lock-overlay {
          position: absolute;
          inset: 0;
          backdrop-filter: blur(6px);
          background: rgba(200, 200, 200, 0.25);
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: visible;
        }

        .lock-cloud {
          position: absolute;
          width: 120%;
          height: 120%;
          background: radial-gradient(circle, rgba(255,255,255,0.8), transparent);
          filter: blur(20px);
          animation: cloudMove 6s infinite linear;
        }

        .lock-icon {
          font-size: 32px;
          z-index: 2;
          color: #2d2018;
          text-shadow: 0 4px 10px rgba(255, 255, 255, 0.45);
        }

        .lock-tooltip {
          position: absolute;
          bottom: -34px;
          background: #222;
          color: #fff;
          padding: 5px 10px;
          font-size: 12px;
          border-radius: 6px;
          opacity: 0;
          transition: 0.2s;
          white-space: nowrap;
        }

        .lock-overlay:hover .lock-tooltip {
          opacity: 1;
        }

        .gate-wrapper {
          margin: 0 60px;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .gate {
          width: 200px;
          height: 320px;
          position: relative;
          cursor: pointer;
          border: none;
          background: transparent;
          padding: 0;
          transition: transform 0.3s ease;
        }

        .gate.open:hover {
          transform: translateY(-6px);
        }

        .gate.locked {
          cursor: not-allowed;
        }

        .gate-door {
          width: 100%;
          height: 100%;
          position: relative;
          display: flex;
          align-items: flex-end;
          justify-content: center;
          transition: transform 0.35s ease;
        }

        .gate-door-image {
          width: 94%;
          height: 100%;
          object-fit: contain;
          image-rendering: pixelated;
          pointer-events: none;
          filter: drop-shadow(0 16px 18px rgba(38, 23, 11, 0.36));
          transition: transform 0.35s ease, filter 0.35s ease;
        }

        .gate-tone-bedroom .gate-door-image {
          filter: drop-shadow(0 16px 20px rgba(95, 77, 139, 0.42));
        }

        .gate-tone-hotel .gate-door-image {
          filter: drop-shadow(0 16px 20px rgba(124, 62, 43, 0.42));
        }

        .gate-tone-museum .gate-door-image {
          width: 106%;
          filter: drop-shadow(0 16px 20px rgba(109, 90, 49, 0.4));
        }

        .gate.open .gate-door {
          transform: translateY(-2px) scale(1.03);
        }

        .gate.open .gate-door-image {
          filter:
            drop-shadow(0 0 16px rgba(255, 200, 93, 0.85))
            drop-shadow(0 16px 20px rgba(106, 73, 28, 0.45));
          animation: gateGlow 2.6s ease-in-out infinite;
        }

        .gate.locked .gate-door-image {
          filter: grayscale(0.35) brightness(0.78) drop-shadow(0 16px 18px rgba(28, 20, 13, 0.38));
        }

        .gate-sign {
          position: absolute;
          left: 50%;
          bottom: 24px;
          transform: translate(-50%, 8px);
          border: 1px solid #46362f;
          border-radius: 4px;
          padding: 8px 12px;
          min-width: 132px;
          text-align: center;
          background: #2a2020;
          color: #f6ece0;
          font-size: 10px;
          font-weight: 600;
          line-height: 1.2;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          opacity: 0;
          pointer-events: none;
          transition: opacity 0.25s ease, transform 0.25s ease;
        }

        .gate-wrapper:hover .gate-sign,
        .gate-wrapper:focus-within .gate-sign {
          opacity: 1;
          transform: translate(-50%, 0);
        }

        @keyframes cloudMove {
          0% { transform: translateX(-10px); }
          50% { transform: translateX(10px); }
          100% { transform: translateX(-10px); }
        }

        @keyframes unlockHalo {
          0% {
            opacity: 0;
            transform: scale(0.92);
          }
          25% {
            opacity: 1;
            transform: scale(1.06);
          }
          100% {
            opacity: 0;
            transform: scale(1.15);
          }
        }

        .animate-unlock-halo {
          animation: unlockHalo 1.8s ease-out;
        }

        @keyframes gateGlow {
          0%, 100% {
            filter: saturate(1) brightness(1);
          }
          50% {
            filter: saturate(1.15) brightness(1.1);
          }
        }
      `}</style>
    </div>
  );
}

function MuseumLobbyScene({ floorTheme: _floorTheme, onStart, onExit: _onExit }: LobbySceneProps) {
  const sceneRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const panTimeoutRef = useRef<number | null>(null);

  const playClickSound = () => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.currentTime = 0;
    audio.play().catch(() => {
      // Ignore playback failures when browser blocks autoplay.
    });
  };

  const clearPanTimer = () => {
    if (panTimeoutRef.current) {
      window.clearTimeout(panTimeoutRef.current);
      panTimeoutRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      clearPanTimer();
    };
  }, []);

  const handleStartChoice = () => {
    playClickSound();
    sceneRef.current?.classList.add('pan');
    clearPanTimer();

    panTimeoutRef.current = window.setTimeout(() => {
      sceneRef.current?.classList.remove('pan');
      onStart();
    }, 760);
  };

  return (
    <div className="lobby-container" ref={sceneRef}>
      <div className="lobby-bg"></div>

      <div className="lobby-content">
        <button
          type="button"
          className="tap-start-text"
          onClick={handleStartChoice}
          aria-label="Tab TO start"
        >
          Tab TO start
        </button>
      </div>

      <audio ref={audioRef} preload="auto">
        <source src="/sounds/pomodoro/pause.mp3" type="audio/mpeg" />
      </audio>

      <style>{`
        .lobby-container {
          position: relative;
          width: 100%;
          height: 100%;
          overflow: hidden;
          font-family: 'Nunito', 'Baloo 2', 'Quicksand', 'Segoe UI', sans-serif;
          isolation: isolate;
        }

        .lobby-container::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(to bottom, rgba(255, 255, 255, 0.24), rgba(41, 74, 101, 0.28));
          pointer-events: none;
          z-index: 3;
        }

        .lobby-bg {
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(to bottom, rgba(255, 255, 255, 0.08), rgba(0, 26, 46, 0.22)),
            url('/backgrounds/forever-morning/flattened_image_spaceship.png');
          background-position: center;
          background-repeat: no-repeat;
          background-size: cover;
          transition: transform 0.8s ease;
        }

        .lobby-bg::before {
          content: '';
          position: absolute;
          inset: 0;
          background:
            radial-gradient(circle at 20% 16%, rgba(255, 255, 255, 0.28), transparent 42%),
            radial-gradient(circle at 78% 20%, rgba(255, 255, 255, 0.2), transparent 45%);
        }

        .lobby-bg::after {
          content: '';
          position: absolute;
          width: 320px;
          height: 320px;
          border-radius: 999px;
          right: -90px;
          bottom: -140px;
          background: radial-gradient(circle, rgba(255, 255, 255, 0.3), rgba(255, 255, 255, 0));
          filter: blur(8px);
        }

        .lobby-container.pan .lobby-bg {
          transform: scale(1.06);
        }

        .lobby-container.pan .lobby-content {
          transform: scale(1.02) translateY(-12px);
          opacity: 0.1;
        }

        .lobby-content {
          position: absolute;
          inset: 0;
          z-index: 4;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
          transition: transform 0.8s ease, opacity 0.8s ease;
        }

        .tap-start-text {
          border: none;
          background: transparent;
          padding: 0;
          font-size: 28px;
          font-weight: 800;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: #ffffff;
          text-shadow:
            0 8px 24px rgba(0, 0, 0, 0.45),
            0 0 20px rgba(255, 255, 255, 0.35);
          cursor: pointer;
          transition: transform 0.2s ease, text-shadow 0.2s ease;
          animation: tapPulse 1.6s ease-in-out infinite;
        }

        .tap-start-text:hover {
          transform: scale(1.03);
          text-shadow:
            0 12px 26px rgba(0, 0, 0, 0.5),
            0 0 26px rgba(255, 255, 255, 0.45);
        }

        .tap-start-text:focus-visible {
          outline: none;
          text-shadow:
            0 12px 30px rgba(0, 0, 0, 0.56),
            0 0 30px rgba(255, 255, 255, 0.56);
        }

        @keyframes tapPulse {
          0%,
          100% {
            transform: scale(1);
            text-shadow:
              0 8px 24px rgba(0, 0, 0, 0.45),
              0 0 20px rgba(255, 255, 255, 0.35);
          }
          50% {
            transform: scale(1.02);
            text-shadow:
              0 12px 28px rgba(0, 0, 0, 0.5),
              0 0 30px rgba(255, 255, 255, 0.48);
          }
        }

        @media (max-width: 900px) {
          .lobby-content {
            padding: 16px;
          }

          .tap-start-text {
            font-size: 25px;
          }
        }
      `}</style>
    </div>
  );
}

function NotePopup({ module, onClose }: NotePopupProps) {
  if (!module) return null;

  return (
    <div className="pointer-events-auto absolute bottom-[78px] left-5 z-30 w-[min(340px,calc(100%-2.5rem))]">
      <div className="rounded-xl border border-[#f3dfb3]/35 bg-gradient-to-r from-[#4e3425]/92 via-[#3a2518]/92 to-[#2e1d13]/92 p-3 text-[#f8ead0] shadow-xl backdrop-blur-md">
        <div className="mb-1.5 flex items-start justify-between gap-2">
          <div>
            <p className="text-[9px] uppercase tracking-[0.2em] text-[#ecd5a4]/80">Lesson Note</p>
            <h4 className="mt-0.5 text-xs font-semibold text-[#f8ead0]">{module.title}</h4>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-full border border-[#f2ddb0]/30 bg-[#2a1a12]/80 text-[11px] text-[#f5e4c1] transition hover:bg-[#3a2517]"
          >
            <i className="fas fa-times"></i>
          </button>
        </div>

        <p className="max-h-24 overflow-y-auto pr-1 text-xs leading-relaxed text-[#f6e6c7]/90">{module.note}</p>
      </div>
    </div>
  );
}

export default function LearningMapPanel({
  visible,
  onClose,
  onModuleClick,
  selectedCourseId,
  initialX = (window.innerWidth - 900) / 2,
  initialY = (window.innerHeight - 660 - 80) / 2,
  initialWidth = 900,
  initialHeight = 660,
}: Props) {
  const { position, handleMouseDown } = useDraggable(initialX, initialY);
  const { size, handleMouseDown: handleResize } = useResizable(initialWidth, initialHeight, 760, 520);

  const [showCourseList, setShowCourseList] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [statsCollapsed, setStatsCollapsed] = useState(true);
  const [learningEconomy, setLearningEconomy] = useState<LearningEconomyState>(() =>
    readLearningEconomy()
  );
  const [hasStartedJourney, setHasStartedJourney] = useState(false);
  const [activeNoteModule, setActiveNoteModule] = useState<ModuleNode | null>(null);
  const [showGateMessage, setShowGateMessage] = useState(false);
  const [currentFloorIndex, setCurrentFloorIndex] = useState(0);

  const [isDraggingWall, setIsDraggingWall] = useState(false);
  const [dragStartX, setDragStartX] = useState(0);
  const [scrollStartLeft, setScrollStartLeft] = useState(0);

  const [justUnlockedModule, setJustUnlockedModule] = useState<number | null>(null);
  const [pendingUnlockModule, setPendingUnlockModule] = useState<number | null>(null);
  const [sessionCompletedModules, setSessionCompletedModules] = useState<Record<string, number>>({});

  const wallRef = useRef<HTMLDivElement>(null);
  const unlockTimerRef = useRef<number | null>(null);

  const handleWallMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!wallRef.current) return;
    setIsDraggingWall(true);
    setDragStartX(e.clientX);
    setScrollStartLeft(wallRef.current.scrollLeft);
  };

  const handleWallMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDraggingWall || !wallRef.current) return;
    const deltaX = e.clientX - dragStartX;
    wallRef.current.scrollLeft = scrollStartLeft - deltaX;
  };

  const handleWallMouseUp = () => {
    setIsDraggingWall(false);
  };

  const handleWallWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (!wallRef.current) return;
    if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
      e.preventDefault();
      wallRef.current.scrollLeft += e.deltaY;
    }
  };

  const availableCourses: Course[] = STUDENT_LEARNING_COURSES;

  const currentCourse = selectedCourse || availableCourses[0];
  const finalFloorIndex = FLOOR_THEMES.length - 1;
  const floorTheme = FLOOR_THEMES[currentFloorIndex];
  const isFinalFloor = currentFloorIndex === finalFloorIndex;
  const nextFloorTheme = FLOOR_THEMES[currentFloorIndex + 1] || null;
  const previousFloorTheme = FLOOR_THEMES[currentFloorIndex - 1] || null;
  const floorSceneBackground: Record<FloorThemeId, string> = {
    bedroom: 'from-[#5f5477]/35 via-[#3b3553]/52 to-[#201b33]/75',
    hotel: 'from-[#70273a]/32 via-[#421523]/55 to-[#220b13]/76',
    museum: 'from-[#6e4a33]/25 via-[#3a271b]/45 to-[#24170f]/65'
  };
  const statsSurfaceByFloor: Record<FloorThemeId, {
    panelBg: string;
    panelBorder: string;
    cardBg: string;
    cardBorder: string;
    buttonBg: string;
    buttonBorder: string;
    buttonText: string;
  }> = {
    bedroom: {
      panelBg: 'rgba(53, 41, 80, 0.34)',
      panelBorder: 'rgba(233, 215, 255, 0.26)',
      cardBg: 'rgba(60, 48, 92, 0.46)',
      cardBorder: 'rgba(236, 221, 255, 0.28)',
      buttonBg: 'rgba(52, 40, 81, 0.48)',
      buttonBorder: 'rgba(236, 220, 255, 0.3)',
      buttonText: '#f6e9ff'
    },
    hotel: {
      panelBg: 'rgba(68, 28, 40, 0.34)',
      panelBorder: 'rgba(255, 219, 186, 0.26)',
      cardBg: 'rgba(81, 34, 49, 0.46)',
      cardBorder: 'rgba(255, 219, 186, 0.28)',
      buttonBg: 'rgba(72, 30, 44, 0.48)',
      buttonBorder: 'rgba(255, 220, 188, 0.3)',
      buttonText: '#fbe7ce'
    },
    museum: {
      panelBg: 'rgba(73, 49, 31, 0.32)',
      panelBorder: 'rgba(245, 220, 179, 0.25)',
      cardBg: 'rgba(86, 59, 39, 0.44)',
      cardBorder: 'rgba(245, 220, 179, 0.28)',
      buttonBg: 'rgba(80, 55, 37, 0.46)',
      buttonBorder: 'rgba(245, 220, 179, 0.3)',
      buttonText: '#f8e8ca'
    }
  };
  const statsSurface = statsSurfaceByFloor[floorTheme.id];
  const statsPanelStyle = {
    backgroundColor: statsSurface.panelBg,
    borderColor: statsSurface.panelBorder
  };
  const statsCardStyle = {
    backgroundColor: statsSurface.cardBg,
    borderColor: statsSurface.cardBorder
  };
  const statsActionButtonStyle = {
    backgroundColor: statsSurface.buttonBg,
    borderColor: statsSurface.buttonBorder,
    color: statsSurface.buttonText
  };

  const effectiveCompletedModules =
    sessionCompletedModules[currentCourse.id] ?? currentCourse.completedModules;

  const modules = buildMuseumModules(currentCourse, effectiveCompletedModules);
  const currentModule = modules.find((module) => module.status === 'current') || null;

  const progressRatio =
    currentCourse.moduleCount > 0
      ? Math.min((effectiveCompletedModules / currentCourse.moduleCount) * 100, 100)
      : 0;

  const gateUnlocked = !isFinalFloor || effectiveCompletedModules >= currentCourse.moduleCount;
  const lessonLockEnabled = isFinalFloor;

  const handleModuleNodeClick = (module: ModuleNode) => {
    if (lessonLockEnabled && module.status === 'locked') return;
    onModuleClick?.(module.id, currentCourse.id);
  };

  const handleCourseSelect = (course: Course) => {
    setSelectedCourse(course);
    setShowCourseList(false);
    setHasStartedJourney(false);
    setActiveNoteModule(null);
    setShowGateMessage(false);
    setCurrentFloorIndex(0);
  };

  const handleGateClick = () => {
    if (!isFinalFloor) {
      setCurrentFloorIndex((prev) => Math.min(prev + 1, finalFloorIndex));
      setShowGateMessage(false);
      return;
    }

    if (!gateUnlocked) return;

    const currentIndex = availableCourses.findIndex((course) => course.id === currentCourse.id);
    const nextCourse = availableCourses[currentIndex + 1];

    if (nextCourse) {
      setSelectedCourse(nextCourse);
      setCurrentFloorIndex(0);
      setHasStartedJourney(false);
      setActiveNoteModule(null);
      setShowGateMessage(false);
      return;
    }

    setShowGateMessage(true);
  };

  const handleBackDoorClick = () => {
    if (currentFloorIndex > 0) {
      setCurrentFloorIndex((prev) => Math.max(prev - 1, 0));
      setShowGateMessage(false);
      return;
    }

    setHasStartedJourney(false);
    setActiveNoteModule(null);
    setShowGateMessage(false);
  };

  const handleContinue = () => {
    if (!hasStartedJourney) {
      setHasStartedJourney(true);
      return;
    }

    if (!currentModule) return;
    handleModuleNodeClick(currentModule);
  };

  useEffect(() => {
    return () => {
      if (unlockTimerRef.current) {
        window.clearTimeout(unlockTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!visible) return;

    const shouldAnimate = localStorage.getItem('triggerModuleUnlock');
    if (shouldAnimate !== 'true') return;

    localStorage.removeItem('triggerModuleUnlock');

    const currentProgress = sessionCompletedModules[currentCourse.id] ?? currentCourse.completedModules;
    const nextProgress = Math.min(currentProgress + 1, currentCourse.moduleCount);
    const nextUnlockedId = nextProgress < currentCourse.moduleCount ? nextProgress + 1 : null;

    setSessionCompletedModules((prev) => ({
      ...prev,
      [currentCourse.id]: nextProgress
    }));

    if (nextUnlockedId !== null) {
      setPendingUnlockModule(nextUnlockedId);
    }
  }, [
    visible,
    currentCourse.id,
    currentCourse.completedModules,
    currentCourse.moduleCount,
    sessionCompletedModules
  ]);

  useEffect(() => {
    if (!hasStartedJourney || pendingUnlockModule === null) return;

    setJustUnlockedModule(pendingUnlockModule);
    setPendingUnlockModule(null);

    if (unlockTimerRef.current) {
      window.clearTimeout(unlockTimerRef.current);
    }

    unlockTimerRef.current = window.setTimeout(() => {
      setJustUnlockedModule(null);
    }, 1800);
  }, [hasStartedJourney, pendingUnlockModule]);

  useEffect(() => {
    if (!visible) {
      return;
    }

    setStatsCollapsed(true);

    if (selectedCourseId) {
      const mappedCourse = availableCourses.find((course) => course.id === selectedCourseId);
      if (mappedCourse) {
        setSelectedCourse(mappedCourse);
      }
    }

    setLearningEconomy(readLearningEconomy());
  }, [visible, selectedCourseId]);

  if (!visible) return null;

  return (
    <div
      className="fixed z-10"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: `${size.width}px`,
        height: `${size.height}px`,
        maxWidth: 'calc(100vw - 16px)',
        maxHeight: 'calc(100vh - 16px)'
      }}
    >
      <div className="relative flex h-full flex-col overflow-hidden rounded-3xl border border-[#ead7b0]/35 bg-gradient-to-b from-[#f4e5ca]/20 via-[#a1764e]/10 to-[#2f1e14]/45 shadow-2xl backdrop-blur-[14px]">
        <div
          className="flex h-12 flex-shrink-0 cursor-move items-center justify-between border-b border-white/20 bg-white/10 px-5 backdrop-blur-[20px]"
          onMouseDown={handleMouseDown}
        >
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/10 text-white/90">
              <i className={floorTheme.icon}></i>
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">Three-Floor Learning Corridor</h2>
              <p className="text-[11px] text-white/70">
                {currentCourse.name} • Floor {currentFloorIndex + 1}/{FLOOR_THEMES.length} • {floorTheme.shortLabel}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onMouseDown={(e) => e.stopPropagation()}
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/10 text-white/80 transition hover:bg-white/20 hover:text-white"
            >
              <i className="fas fa-times"></i>
            </button>
          </div>
        </div>

        <div className="flex flex-shrink-0 flex-col border-b px-5 py-2.5 backdrop-blur-[18px]" style={statsPanelStyle}>
          <div className="flex items-center justify-between gap-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#f5e6c8]/75">
              Journey Dashboard
            </p>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowCourseList(true)}
                className="rounded-xl border px-3 py-2 text-xs font-semibold transition hover:bg-white/10"
                style={statsActionButtonStyle}
              >
                <i className="fas fa-scroll mr-2 text-amber-300"></i>
                Courses
              </button>

              {hasStartedJourney && (
                <button
                  type="button"
                  onClick={() => setHasStartedJourney(false)}
                  className="rounded-xl border px-3 py-2 text-xs font-semibold transition hover:bg-white/10"
                  style={statsActionButtonStyle}
                >
                  <i className="fas fa-door-open mr-2 text-amber-300"></i>
                  Lobby
                </button>
              )}

              <button
                type="button"
                onClick={() => setStatsCollapsed((prev) => !prev)}
                className="rounded-xl border px-3 py-2 text-xs font-semibold transition hover:bg-white/10"
                style={statsActionButtonStyle}
                title={statsCollapsed ? 'Mở phần thống kê' : 'Thu gọn phần thống kê'}
              >
                <i className={`fas ${statsCollapsed ? 'fa-chevron-down' : 'fa-chevron-up'} mr-2 text-[#f7e5be]`}></i>
                {statsCollapsed ? 'Mở Stats' : 'Ẩn Stats'}
              </button>
            </div>
          </div>

          <div
            className={`overflow-hidden transition-all duration-300 ${
              statsCollapsed ? 'max-h-0 opacity-0' : 'mt-2 max-h-60 opacity-100'
            }`}
          >
            <div className="flex flex-wrap items-center gap-3">
              <div className="rounded-2xl border px-3 py-2 backdrop-blur-md" style={statsCardStyle}>
                <p className="text-[10px] uppercase tracking-[0.2em] text-[#e8d1a8]/70">Progress</p>
                <p className="text-sm font-semibold text-[#f8e8c6]">
                  {effectiveCompletedModules}/{currentCourse.moduleCount} lessons
                </p>
                <div className="mt-1.5 h-1.5 w-32 overflow-hidden rounded-full bg-[#1d120c]/65">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-400 transition-all duration-700"
                    style={{ width: `${progressRatio}%` }}
                  ></div>
                </div>
              </div>

              <div className="rounded-2xl border px-3 py-2 backdrop-blur-md" style={statsCardStyle}>
                <p className="text-[10px] uppercase tracking-[0.2em] text-[#e8d1a8]/70">Stars</p>
                <p className="text-sm font-semibold text-[#f8e8c6]">
                  {currentCourse.earnedStars}/{currentCourse.totalStars}
                </p>
                <p className="text-[11px] text-[#e7d4ad]/70">{currentCourse.subject}</p>
              </div>

              <div className="rounded-2xl border px-3 py-2 backdrop-blur-md" style={statsCardStyle}>
                <p className="text-[10px] uppercase tracking-[0.2em] text-[#e8d1a8]/70">Floor</p>
                <p className="text-sm font-semibold text-[#f8e8c6]">
                  {currentFloorIndex + 1}/{FLOOR_THEMES.length}
                </p>
              </div>

              <div className="rounded-2xl border px-3 py-2 backdrop-blur-md" style={statsCardStyle}>
                <p className="text-[10px] uppercase tracking-[0.2em] text-[#e8d1a8]/70">Learning Stats</p>
                <div className="mt-1 flex items-center gap-3 text-[11px] font-semibold text-[#f8e8c6]">
                  <span className="flex items-center gap-1">
                    <i className="fas fa-heart text-rose-300"></i>
                    {learningEconomy.hearts}
                  </span>
                  <span className="flex items-center gap-1">
                    <i className="fas fa-gem text-cyan-200"></i>
                    {learningEconomy.gems}
                  </span>
                  <span className="flex items-center gap-1">
                    <i className="fas fa-fire text-amber-300"></i>
                    {learningEconomy.streakDays}
                  </span>
                </div>
                <p className="text-[11px] text-[#e7d4ad]/70">XP: {learningEconomy.totalXp}</p>
              </div>
            </div>
          </div>
        </div>

        <div className={`relative flex-1 overflow-hidden bg-gradient-to-b ${floorSceneBackground[floorTheme.id]}`}>
          {!hasStartedJourney ? (
            <MuseumLobbyScene
              floorTheme={floorTheme}
              onStart={() => setHasStartedJourney(true)}
              onExit={onClose}
            />
          ) : (
            <GalleryWall
              modules={modules}
              floorTheme={floorTheme}
              lockEnabled={lessonLockEnabled}
              justUnlockedModule={isFinalFloor ? justUnlockedModule : null}
              nextDoorUnlocked={gateUnlocked}
              nextDoorTitle={
                isFinalFloor
                  ? 'Grand Archive Gate'
                  : `Go Up To ${nextFloorTheme?.shortLabel ?? 'Next Floor'}`
              }
              nextDoorSubtitle={
                isFinalFloor
                  ? 'Enter the next course only after this final floor is complete.'
                  : 'Move to the next floor any time.'
              }
              backDoorTitle={
                currentFloorIndex === 0
                  ? 'Back To Lobby'
                  : `Return To ${previousFloorTheme?.shortLabel ?? 'Previous Floor'}`
              }
              backDoorSubtitle={
                currentFloorIndex === 0
                  ? 'Leave this corridor and return to the hall.'
                  : 'Use this door to go down one floor.'
              }
              wallRef={wallRef}
              isDragging={isDraggingWall}
              onWallMouseDown={handleWallMouseDown}
              onWallMouseMove={handleWallMouseMove}
              onWallMouseUp={handleWallMouseUp}
              onWallWheel={handleWallWheel}
              onModuleOpen={handleModuleNodeClick}
              onNoteOpen={setActiveNoteModule}
              onBackDoorClick={handleBackDoorClick}
              onGateClick={handleGateClick}
            />
          )}
        </div>

        {hasStartedJourney && (
          <div className="flex flex-shrink-0 items-center justify-end border-t px-5 py-3 backdrop-blur-[18px]" style={statsPanelStyle}>
            <button
              type="button"
              onClick={handleContinue}
              disabled={!currentModule}
              className={`rounded-xl px-5 py-2 text-sm font-semibold transition ${
                !currentModule
                  ? 'cursor-not-allowed border border-white/20 bg-white/10 text-white/45'
                  : 'border border-amber-100/40 bg-gradient-to-r from-[#ce9a50] via-[#f0ca82] to-[#ce9a50] text-[#352112] shadow-[0_12px_24px_rgba(186,132,55,0.42)] hover:scale-105 hover:shadow-[0_18px_30px_rgba(186,132,55,0.55)]'
              }`}
            >
              <i className="fas fa-play mr-2"></i>
              Continue Lesson
            </button>
          </div>
        )}

        <div
          className="absolute -bottom-1.5 -right-1.5 z-20 h-4 w-4 cursor-nwse-resize rounded-full border-2 border-[#f0ddb7]/70 bg-[#8f6844]/85 hover:bg-[#a97b4f]"
          onMouseDown={handleResize}
        ></div>

        <NotePopup module={activeNoteModule} onClose={() => setActiveNoteModule(null)} />

        {showGateMessage && (
          <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-3xl border border-[#f3dfb3]/35 bg-gradient-to-b from-[#4e3425]/95 to-[#2e1d13]/95 p-6 text-[#f8ead0] shadow-2xl">
              <h4 className="text-xl font-semibold">All Galleries Completed</h4>
              <p className="mt-2 text-sm text-[#f5e6c7]/85">
                You reached the final archive door. This is the end of the current mock museum sequence.
              </p>
              <div className="mt-5 flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowGateMessage(false)}
                  className="rounded-xl border border-[#f4dfb4]/35 bg-[#2b1b12]/85 px-4 py-2 text-sm font-semibold text-[#f7e8c8] transition hover:bg-[#3e2818]"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {showCourseList && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
            <div className="w-full max-w-3xl rounded-3xl border border-[#f0ddb3]/30 bg-gradient-to-b from-[#4f3424]/95 to-[#2f1e14]/95 p-5 shadow-2xl">
              <div className="mb-4 flex items-center justify-between border-b border-[#f1ddb2]/20 pb-3">
                <div>
                  <h3 className="text-lg font-semibold text-[#f9edcf]">Select Museum Wing</h3>
                  <p className="text-xs text-[#f1ddb2]/70">Each course opens as its own curated art wall.</p>
                </div>

                <button
                  type="button"
                  onClick={() => setShowCourseList(false)}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-[#f2deaf]/25 bg-[#28190f]/80 text-[#f6e5c3] transition hover:bg-[#3a2517]"
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>

              <div className="max-h-[420px] space-y-3 overflow-y-auto pr-1">
                {availableCourses.map((course) => {
                  const effectiveCompleted =
                    sessionCompletedModules[course.id] ?? course.completedModules;
                  const isActive = currentCourse.id === course.id;
                  const progress =
                    course.moduleCount > 0
                      ? Math.min((effectiveCompleted / course.moduleCount) * 100, 100)
                      : 0;

                  return (
                    <button
                      type="button"
                      key={course.id}
                      onClick={() => handleCourseSelect(course)}
                      className={`w-full rounded-2xl border p-4 text-left transition-all duration-300 ${
                        isActive
                          ? 'border-[#f5e2ba]/45 bg-[#3a2618]/80 shadow-lg'
                          : 'border-[#ecd7af]/20 bg-[#2a1a11]/55 hover:border-[#f2deaf]/35 hover:bg-[#3a2518]/65'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="truncate text-sm font-semibold text-[#faedcf]">{course.name}</h4>
                            {isActive && (
                              <span className="rounded-full bg-amber-200/90 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#3a2312]">
                                Active
                              </span>
                            )}
                          </div>

                          <p className="mt-1 text-xs text-[#efd9af]/75">{course.description}</p>

                          <div className="mt-2 flex items-center gap-2 text-[11px] text-[#f2e0b9]/85">
                            <span className="rounded-full border border-[#f2dfb1]/25 bg-[#24170f]/65 px-2 py-0.5">
                              {course.subject}
                            </span>
                            <span className="rounded-full border border-[#f2dfb1]/25 bg-[#24170f]/65 px-2 py-0.5">
                              {course.mapLayout}
                            </span>
                          </div>

                          <p className="mt-2 text-[11px] text-[#f1ddb2]/75">
                            {course.moduleCount} lessons • Midterm: lesson {Math.floor(course.moduleCount / 2) + 1} • Final comprehensive: lesson {course.moduleCount}
                          </p>
                        </div>

                        <div className="text-right text-xs text-[#f1ddb2]/80">
                          <p className="font-semibold text-[#f9edcf]">
                            {effectiveCompleted}/{course.moduleCount}
                          </p>
                          <p>lessons</p>
                        </div>
                      </div>

                      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[#1a1009]">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-400 transition-all duration-700"
                          style={{ width: `${progress}%` }}
                        ></div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

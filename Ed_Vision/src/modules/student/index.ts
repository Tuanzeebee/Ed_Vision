// Export all student modules
export { default as StudentDashboard } from './StudentDashboard'
export { default as StudentLogin } from '../auth/StudentLogin'
export { default as StudentRegister } from '../auth/StudentRegister'
export { default as StudentOTPVerification } from '../auth/StudentOTPVerification'
export { default as AcademicPlanningDashboard } from './AcademicPlanningDashboard'
export { default as StudentCourseOverview } from './StudentCourseOverview'
export { default as CourseDetailView } from './CourseDetailView'
export { default as GradeForecastLanding } from './GradeForecastLanding'
export { default as UploadTranscript } from './UploadTranscript'
export { default as AdjustParameters } from './AdjustParameters'
export { default as FinancialSurveyStep1 } from './FinancialSurveyStep1'
export { default as LearningAdventure } from './LearningAdventure'
export { default as InstructionsPage } from './InstructionsPage'
export { default as ChooseMascot } from './ChooseMascot'
export { default as MusicBrowser } from './MusicBrowser'
export { default as StudyRooms } from './StudyRooms'
export { default as VideoRoom } from './VideoRoom'

// Learning Space Module
export { default as LearningSpace } from './LearningSpace'
export { default as ClockDisplay } from './components/ClockDisplay'
export { default as DockMenu } from './components/DockMenu'
export { default as SnowEffect } from './components/SnowEffect'
export { default as RainEffect } from './components/RainEffect'
export { default as MusicWidget } from './components/MusicWidget'
export { default as PomodoroPanel } from './components/PomodoroPanel'
export { default as AmbiencePanel } from './components/AmbiencePanel'
export { default as ThemePanel } from './components/ThemePanel'
export { default as MusicPanel } from './components/MusicPanel'
export { default as JournalPanel } from './components/JournalPanel'

// Learning Space Hooks
export { useDraggable } from './hooks/useDraggable'
export { useResizable } from './hooks/useResizable'

// Learning Space Types
export type {
  PanelPosition,
  MusicWidgetState,
  PomoMode,
  AmbienceTab,
  SoundType,
  Track,
  JournalEntry,
  DragState,
  ResizeState,
} from './types/learningSpace'
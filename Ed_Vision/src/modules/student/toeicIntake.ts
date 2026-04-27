import { getToeicPlanSync, saveToeicPlanSync } from '@/services/api/certificateService'

export type ToeicBand = '350-495' | '500-599' | '600-699' | '700-799' | '800+'

export type ToeicIntakeMode = 'estimated' | 'self-reported'

export type ToeicFoundationTopic = 'grammar' | 'vocabulary'

function normalizeFoundationTopics(topics: string[]): ToeicFoundationTopic[] {
  const normalized = topics
    .map((topic) => {
      if (topic === 'grammar' || topic === 'vocabulary') return topic
      if (topic === 'noun' || topic === 'verb' || topic === 'adjective') return 'grammar'
      return null
    })
    .filter((topic): topic is ToeicFoundationTopic => topic !== null)

  return Array.from(new Set(normalized))
}

export interface ToeicMilestoneState {
  currentScore: number
  targetScore: number
  totalBoost: number
  listeningSessions: number
  readingSessions: number
  foundationCompleted: ToeicFoundationTopic[]
  foundationSkipped: boolean
  usedQuestionIds: string[]
}

export interface ToeicIntakeProfile {
  mode: ToeicIntakeMode
  recommendedBand: ToeicBand
  currentScore: number
  targetScore: number | null
  estimatedListening: number | null
  estimatedReading: number | null
  milestoneState: ToeicMilestoneState
  updatedAt: string
}

const STORAGE_KEY = 'edvision.toeic.intake.v2'

export const TOEIC_SCORE_PER_CORRECT = 2.5
export const TOEIC_PRACTICE_SET_SIZE = 10

function clampScore(score: number): number {
  return Math.min(990, Math.max(10, Math.round(score)))
}

function deriveTargetScore(currentScore: number, targetScore: number | null): number {
  if (typeof targetScore === 'number' && Number.isFinite(targetScore)) {
    return clampScore(Math.max(currentScore, targetScore))
  }

  // If the learner has not set a target, suggest a practical next stage.
  return clampScore(Math.min(900, currentScore + 150))
}

export function createToeicMilestoneState(currentScore: number, targetScore: number | null): ToeicMilestoneState {
  const safeCurrent = clampScore(currentScore)
  return {
    currentScore: safeCurrent,
    targetScore: deriveTargetScore(safeCurrent, targetScore),
    totalBoost: 0,
    listeningSessions: 0,
    readingSessions: 0,
    foundationCompleted: [],
    foundationSkipped: false,
    usedQuestionIds: [],
  }
}

export function mapToeicScoreToBand(score: number): ToeicBand {
  if (score >= 800) return '800+'
  if (score >= 700) return '700-799'
  if (score >= 600) return '600-699'
  if (score >= 500) return '500-599'
  return '350-495'
}

export function estimateToeicScore(rawScore: number, maxScore: number): number {
  if (maxScore <= 0) return 350
  const ratio = Math.min(1, Math.max(0, rawScore / maxScore))
  // Placement mini-test returns a coarse estimate centered around practical TOEIC ranges.
  return Math.round(250 + ratio * 650)
}

export function getToeicProjectedScore(profile: ToeicIntakeProfile): number {
  return clampScore(profile.milestoneState.currentScore + profile.milestoneState.totalBoost)
}

export function buildToeicMilestones(currentScore: number, targetScore: number): number[] {
  const start = Math.max(300, Math.floor(currentScore / 50) * 50)
  const finish = Math.ceil(targetScore / 50) * 50
  const milestones: number[] = []

  for (let score = start; score <= finish; score += 50) {
    milestones.push(score)
  }

  if (!milestones.includes(targetScore)) {
    milestones.push(targetScore)
  }

  return milestones.sort((a, b) => a - b)
}

export function appendToeicPracticeResult(
  profile: ToeicIntakeProfile,
  mode: 'listening' | 'reading',
  correctAnswers: number,
  questionIds: string[] = []
): ToeicIntakeProfile {
  const safeCorrect = Math.max(0, Math.min(TOEIC_PRACTICE_SET_SIZE, Math.round(correctAnswers)))
  const gained = safeCorrect * TOEIC_SCORE_PER_CORRECT
  const nextMilestoneState: ToeicMilestoneState = {
    ...profile.milestoneState,
    totalBoost: profile.milestoneState.totalBoost + gained,
    listeningSessions:
      mode === 'listening' ? profile.milestoneState.listeningSessions + 1 : profile.milestoneState.listeningSessions,
    readingSessions:
      mode === 'reading' ? profile.milestoneState.readingSessions + 1 : profile.milestoneState.readingSessions,
    usedQuestionIds: Array.from(new Set([...profile.milestoneState.usedQuestionIds, ...questionIds])),
  }

  return {
    ...profile,
    milestoneState: nextMilestoneState,
    updatedAt: new Date().toISOString(),
  }
}

export function markFoundationTopic(profile: ToeicIntakeProfile, topic: ToeicFoundationTopic): ToeicIntakeProfile {
  if (profile.milestoneState.foundationCompleted.includes(topic)) return profile

  return {
    ...profile,
    milestoneState: {
      ...profile.milestoneState,
      foundationCompleted: [...profile.milestoneState.foundationCompleted, topic],
    },
    updatedAt: new Date().toISOString(),
  }
}

export function skipFoundation(profile: ToeicIntakeProfile): ToeicIntakeProfile {
  return {
    ...profile,
    milestoneState: {
      ...profile.milestoneState,
      foundationSkipped: true,
    },
    updatedAt: new Date().toISOString(),
  }
}

export function pickPracticeQuestionIds(bank: string[], usedQuestionIds: string[], size = TOEIC_PRACTICE_SET_SIZE): string[] {
  if (bank.length <= size) return [...bank]

  const unseen = bank.filter((id) => !usedQuestionIds.includes(id))
  const pool = unseen.length >= size ? unseen : bank
  const shuffled = [...pool].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, size)
}

export function getToeicIntakeProfile(): ToeicIntakeProfile | null {
  if (typeof window === 'undefined') return null

  const payload = window.localStorage.getItem(STORAGE_KEY)
  if (!payload) return null

  try {
    const parsed = JSON.parse(payload) as ToeicIntakeProfile
    if (!parsed?.recommendedBand) return null

    if (!parsed.milestoneState) {
      parsed.milestoneState = createToeicMilestoneState(parsed.currentScore, parsed.targetScore)
    }

    parsed.milestoneState.foundationCompleted = normalizeFoundationTopics(
      Array.isArray(parsed.milestoneState.foundationCompleted)
        ? parsed.milestoneState.foundationCompleted
        : [],
    )

    return parsed
  } catch {
    return null
  }
}

export function saveToeicIntakeProfile(profile: ToeicIntakeProfile): void {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(profile))
  void syncToeicProfileToServer(profile)
}

export function clearToeicIntakeProfile(): void {
  if (typeof window === 'undefined') return
  window.localStorage.removeItem(STORAGE_KEY)
}

export async function syncToeicProfileToServer(profile: ToeicIntakeProfile): Promise<void> {
  try {
    await saveToeicPlanSync({
      current_score: profile.milestoneState.currentScore,
      target_score: profile.milestoneState.targetScore,
      total_boost: Math.round(profile.milestoneState.totalBoost),
      listening_sessions: profile.milestoneState.listeningSessions,
      reading_sessions: profile.milestoneState.readingSessions,
      foundation_completed: profile.milestoneState.foundationCompleted,
      foundation_skipped: profile.milestoneState.foundationSkipped,
    })
  } catch {
    // Keep local profile as fallback when API is not reachable.
  }
}

export async function hydrateToeicProfileFromServer(
  localProfile: ToeicIntakeProfile | null,
): Promise<ToeicIntakeProfile | null> {
  try {
    const remote = await getToeicPlanSync()
    if (!remote) return localProfile

    if (!localProfile) {
      return {
        mode: 'self-reported',
        recommendedBand: mapToeicScoreToBand(remote.current_score),
        currentScore: remote.current_score,
        targetScore: remote.target_score,
        estimatedListening: null,
        estimatedReading: null,
        milestoneState: {
          currentScore: remote.current_score,
          targetScore: remote.target_score,
          totalBoost: remote.total_boost,
          listeningSessions: remote.listening_sessions,
          readingSessions: remote.reading_sessions,
          foundationCompleted: normalizeFoundationTopics(remote.foundation_completed),
          foundationSkipped: remote.foundation_skipped,
          usedQuestionIds: [],
        },
        updatedAt: new Date().toISOString(),
      }
    }

    return {
      ...localProfile,
      milestoneState: {
        ...localProfile.milestoneState,
        currentScore: remote.current_score,
        targetScore: remote.target_score,
        totalBoost: remote.total_boost,
        listeningSessions: remote.listening_sessions,
        readingSessions: remote.reading_sessions,
        foundationCompleted: normalizeFoundationTopics(remote.foundation_completed),
        foundationSkipped: remote.foundation_skipped,
      },
      updatedAt: new Date().toISOString(),
    }
  } catch {
    return localProfile
  }
}

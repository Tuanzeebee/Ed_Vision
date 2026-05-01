import apiClient from './apiClient'

export interface PlacementQuestionPayload {
  id: string
  questionText: string
  questionType: string
  options: unknown
  timeLimitSec: number
  progress: { current: number; total: number }
  contextType?: 'passage' | 'audio' | 'standalone'
  passage?: {
    id: string
    title: string
    content: string
    audioUrl: string | null
  } | null
}

export interface StartPlacementInput {
  accountId: number
  skillsToTest: string[]
}

export interface StartPlacementResult {
  sessionId: string
  firstQuestion: PlacementQuestionPayload
}

export interface SubmitPlacementInput {
  sessionId: string
  questionId: string
  userAnswer: string
  timeTakenSec: number
}

export interface SubmitPlacementResult {
  isCorrect: boolean
  nextQuestion: PlacementQuestionPayload | null
  progress: { current: number; total: number }
}

export interface PlacementResult {
  finalBand: number
  skillBands: Record<string, number>
  confidenceLevel: 'low' | 'medium' | 'high'
  cefrLevel?: string
  sem?: number
  patterns?: {
    strengths?: string[]
    weaknesses?: string[]
  }
}

export async function startPlacementTest(
  payload: StartPlacementInput,
): Promise<StartPlacementResult> {
  const res = await apiClient.post<StartPlacementResult>('/placement-test/start', payload)
  return res.data
}

export async function submitPlacementAnswer(
  payload: SubmitPlacementInput,
): Promise<SubmitPlacementResult> {
  const res = await apiClient.post<SubmitPlacementResult>('/placement-test/answer', payload)
  return res.data
}

export async function abandonPlacementSession(sessionId: string): Promise<void> {
  await apiClient.post('/placement-test/abandon', { sessionId })
}

export async function getPlacementResult(sessionId: string): Promise<PlacementResult> {
  const res = await apiClient.get<PlacementResult>(`/placement-test/result/${encodeURIComponent(sessionId)}`)
  return res.data
}

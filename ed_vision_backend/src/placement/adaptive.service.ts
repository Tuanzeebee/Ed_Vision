// ============================================================
// STEP 4: src/placement/adaptive.service.ts
// Rewritten với IRT engine — thay hoàn toàn file cũ
// ============================================================

import { PrismaClient, Prisma } from '@prisma/client'
import {
  estimateTheta,
  estimateThetaEAP,
  getFullEstimate,
  getFullEstimateEAP,
  selectOptimalItem,
  shouldStop,
  thetaToBand,
  bandToTheta,
  icc,
  type ItemResponse,
  type IrtParams,
  type ThetaEstimate,
} from './irt.engine'

const prisma = new PrismaClient()

// ─────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────

const MAX_QUESTIONS = 20
const MIN_QUESTIONS = 12     // tăng từ 6 vì test 20 câu
const SEM_TARGET = 0.45
const SKILL_QUOTA_MIN = 3      // tối thiểu 3 câu/skill
const SKILL_QUOTA_MAX = 6      // tối đa 6 câu/skill
const INITIAL_BAND = 5.0    // band khởi đầu mặc định
const ALLOWED_TYPES = ['mcq', 'gap_fill', 'true_false_ng']

// Ngưỡng phân loại strength/weakness dựa trên theta
const STRENGTH_THRESHOLD = 0.75   // theta > 0.75  → strength
const WEAKNESS_THRESHOLD = -0.75  // theta < -0.75 → weakness

// ─────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────

export interface StartTestInput {
  accountId: number
  skillsToTest: string[]
}

export interface AnswerInput {
  sessionId: string
  questionId: string
  userAnswer: string
  timeTakenSec: number
}

export interface QuestionPayload {
  id: string
  questionText: string
  questionType: string
  options: unknown
  timeLimitSec: number
  progress: { current: number; total: number }
  // Passage data — null nếu câu standalone (writing/speaking proxy)
  contextType: 'passage' | 'audio' | 'standalone'
  passage: {
    id: string
    title: string
    content: string
    audioUrl: string | null   // null cho đến khi TTS xong
  } | null
}

export interface StartTestResult {
  sessionId: string
  firstQuestion: QuestionPayload
}

export interface AnswerResult {
  isCorrect: boolean
  nextQuestion: QuestionPayload | null   // null = test kết thúc
  progress: { current: number; total: number }
  currentBand: number                   // hiển thị realtime cho FE nếu muốn
  actualTotal: number                   // số câu thực tế khi kết thúc (có thể < 20 nếu stop early)
}

export interface TestResult {
  finalBand: number
  skillBands: Record<string, number>
  confidenceLevel: 'low' | 'medium' | 'high'
  sem: number   // độ không chắc chắn — FE có thể hiện "±X band"
  patterns: {
    strengths: string[]
    weaknesses: string[]
    balanced: string[]
    insights: string[]
  }
  note: Record<string, string>
}

// ─────────────────────────────────────────────────────────────
// 1. BẮT ĐẦU TEST
// ─────────────────────────────────────────────────────────────

export async function startPlacementTest(
  input: StartTestInput,
): Promise<StartTestResult> {
  // Chặn session trùng: Tự động huỷ (abandon) session đang dang dở nếu có
  const existing = await prisma.ieltsPlacementSession.findFirst({
    where: { accountId: input.accountId, status: 'in_progress' },
  })

  if (existing) {
    await prisma.ieltsPlacementSession.update({
      where: { id: existing.id },
      data: { status: 'abandoned', completedAt: new Date() },
    })
  }

  const session = await prisma.ieltsPlacementSession.create({
    data: {
      accountId: input.accountId,
      skillsTested: input.skillsToTest,
      currentEstimatedBand: INITIAL_BAND,
      status: 'in_progress',
    },
  })

  // Câu đầu tiên: chọn câu gần b=0 nhất (band ~6.0) để calibrate nhanh
  const initialTheta = bandToTheta(INITIAL_BAND)
  const initSkillsAnswered = Object.fromEntries(input.skillsToTest.map(s => [s, 0]))
  const initSkillThetas = Object.fromEntries(input.skillsToTest.map(s => [s, 0]))

  const firstQuestion = await selectNextQuestion({
    currentTheta: initialTheta,
    skillsTested: input.skillsToTest,
    usedQuestionIds: [],
    questionOrder: 1,
    skillsAnswered: initSkillsAnswered,
    skillThetas: initSkillThetas,
  })

  return { sessionId: session.id, firstQuestion }
}

// ─────────────────────────────────────────────────────────────
// 2. SUBMIT CÂU TRẢ LỜI
// ─────────────────────────────────────────────────────────────

export async function submitAnswer(input: AnswerInput): Promise<AnswerResult> {
  const session = await prisma.ieltsPlacementSession.findUniqueOrThrow({
    where: { id: input.sessionId },
    include: {
      answers: {
        orderBy: { questionOrder: 'asc' },
        include: { question: true }  // Include question để lấy IRT params
      }
    },
  })

  // Parse Json fields từ Prisma (trả về object hoặc null)
  const skillsAnsweredRaw = session.skillsAnswered
  const skillThetasRaw = session.skillThetas

  const prevSkillsAnswered: Record<string, number> =
    (skillsAnsweredRaw && typeof skillsAnsweredRaw === 'object' && !Array.isArray(skillsAnsweredRaw))
      ? (skillsAnsweredRaw as Record<string, number>)
      : {}

  const prevSkillThetas: Record<string, number> =
    (skillThetasRaw && typeof skillThetasRaw === 'object' && !Array.isArray(skillThetasRaw))
      ? (skillThetasRaw as Record<string, number>)
      : {}

  if (session.status !== 'in_progress') {
    // Trả về lỗi có thể nhận dạng được ở frontend thay vì crash 500
    const err = new Error('Session đã kết thúc.') as Error & { statusCode?: number; code?: string }
    err.statusCode = 409
    err.code = 'SESSION_ENDED'
    throw err
  }

  const question = await prisma.ieltsQuestion.findUniqueOrThrow({
    where: { id: input.questionId },
  })

  if (!question.skill) {
    throw new Error('Question skill is missing. Cannot evaluate skill-aware test.')
  }

  const isCorrect = checkAnswer(question.correctAnswer, input.userAnswer, question.questionType)
  const questionOrder = session.totalQuestionsAsked + 1
  const bandMid = (Number(question.bandMin) + Number(question.bandMax)) / 2

  // Lưu câu trả lời
  await prisma.ieltsPlacementAnswer.create({
    data: {
      sessionId: input.sessionId,
      questionId: input.questionId,
      questionOrder,
      bandAtTime: session.currentEstimatedBand,
      bandMid,
      difficultyWeight: question.difficultyWeight,
      userAnswer: input.userAnswer,
      isCorrect,
      timeTakenSec: input.timeTakenSec,
      irtASnapshot: question.irtA,
      irtBSnapshot: question.irtB,
      irtCSnapshot: question.irtC,
      skill: question.skill,
    } as Prisma.IeltsPlacementAnswerUncheckedCreateInput,
  })

  // Build lại toàn bộ response history cho IRT
  // Bao gồm cả câu vừa trả lời
  const currentAnswer = {
    isCorrect,
    irtASnapshot: question.irtA,
    irtBSnapshot: question.irtB,
    irtCSnapshot: question.irtC,
    skill: question.skill,
    questionOrder,
  }

  const allAnswersSoFar = [
    ...(session.answers as unknown as Array<{
      isCorrect: boolean | null
      irtASnapshot?: any
      irtBSnapshot?: any
      irtCSnapshot?: any
      question?: { irtA?: any; irtB?: any; irtC?: any }
      skill?: string | null
      questionOrder: number
    }>).map(a => ({
      isCorrect: a.isCorrect,
      irtASnapshot: a.irtASnapshot,
      irtBSnapshot: a.irtBSnapshot,
      irtCSnapshot: a.irtCSnapshot,
      irtA: a.question?.irtA,
      irtB: a.question?.irtB,
      irtC: a.question?.irtC,
      skill: a.skill,
      questionOrder: a.questionOrder,
    })),
    currentAnswer,
  ]

  const responseHistory = buildResponseHistory(allAnswersSoFar)

  // Ước tính theta mới bằng MLE
  const estimate = getFullEstimateEAP(responseHistory, bandToTheta(Number(session.currentEstimatedBand)))
  const newBand = estimate.band
  const newTotal = session.totalQuestionsAsked + 1
  const usedIds = [...session.usedQuestionIds, input.questionId]

  const currentSkillsAnswered = { ...prevSkillsAnswered }
  currentSkillsAnswered[question.skill] = (currentSkillsAnswered[question.skill] ?? 0) + 1

  const currentSkillThetas = { ...prevSkillThetas }

  const allAnswersIncludingCurrent = [
    ...(session.answers as any[]),
    currentAnswer,
  ]

  const skillResponses: ItemResponse[] = allAnswersIncludingCurrent
    .filter(a => a.skill === question.skill && a.isCorrect !== null)
    .map(a => ({
      correct: a.isCorrect as boolean,
      params: {
        a: Number(a.irtASnapshot ?? a.irtA) || 1.0,
        b: Number(a.irtBSnapshot ?? a.irtB) || 0.0,
        c: Number(a.irtCSnapshot ?? a.irtC) || 0.25,
      },
    }))

  if (skillResponses.length > 0) {
    const skillTheta = estimateThetaEAP(
      skillResponses,
      currentSkillThetas[question.skill] ?? 0,
    )
    currentSkillThetas[question.skill] = skillTheta
  }

  // Kiểm tra điều kiện kết thúc
  const stopEarly = shouldStop(responseHistory, estimate.theta, MIN_QUESTIONS, SEM_TARGET)
  const isLast = newTotal >= MAX_QUESTIONS || stopEarly

  await prisma.ieltsPlacementSession.update({
    where: { id: input.sessionId },
    data: {
      currentEstimatedBand: newBand,
      usedQuestionIds: usedIds,
      totalQuestionsAsked: newTotal,
      // Reset streak — không còn dùng rule-based
      consecutiveCorrect: 0,
      consecutiveWrong: 0,
      skillsAnswered: currentSkillsAnswered,
      skillThetas: currentSkillThetas,
      status: isLast ? 'completed' : 'in_progress',
      completedAt: isLast ? new Date() : undefined,
    } as Prisma.IeltsPlacementSessionUncheckedUpdateInput,
  })

  if (isLast) {
    await finalizeResult(input.sessionId, estimate, allAnswersSoFar)
    return {
      isCorrect,
      nextQuestion: null,
      progress: { current: newTotal, total: MAX_QUESTIONS },
      currentBand: newBand,
      actualTotal: newTotal,
    }
  }

  // Chọn câu tiếp theo tối ưu theo theta mới
  // Nếu pool cạn (ít câu hơn SKILL_QUOTA_MAX), kết thúc test sớm thay vì crash 500
  let nextQuestion: Awaited<ReturnType<typeof selectNextQuestion>> | null = null
  try {
    nextQuestion = await selectNextQuestion({
      currentTheta: estimate.theta,
      skillsTested: session.skillsTested,
      usedQuestionIds: usedIds,
      questionOrder: questionOrder + 1,
      skillsAnswered: currentSkillsAnswered,
      skillThetas: currentSkillThetas,
    })
  } catch (poolErr: any) {
    if (poolErr?.message?.includes('Pool placement') || poolErr?.message?.includes('Tất cả skills')) {
      // Chỉ kết thúc nếu đã đủ số câu tối thiểu
      if (newTotal >= MIN_QUESTIONS) {
        await prisma.ieltsPlacementSession.update({
          where: { id: input.sessionId },
          data: {
            status: 'completed',
            completedAt: new Date(),
          } as Prisma.IeltsPlacementSessionUncheckedUpdateInput,
        })
        await finalizeResult(input.sessionId, estimate, allAnswersSoFar)
        return {
          isCorrect,
          nextQuestion: null,
          progress: { current: newTotal, total: newTotal },
          currentBand: newBand,
          actualTotal: newTotal,
        }
      }

      // Chưa đủ MIN_QUESTIONS -> đây là bug thật hoặc thiếu data, throw lên để xử lý
      throw new Error(
        `Pool cạn sau ${newTotal} câu — cần thêm câu is_placement=true. ${poolErr.message}`
      )
    }
    throw poolErr
  }

  return {
    isCorrect,
    nextQuestion,
    progress: { current: newTotal, total: MAX_QUESTIONS },
    currentBand: newBand,
    actualTotal: MAX_QUESTIONS,
  }
}

// ─────────────────────────────────────────────────────────────
// 3. ABANDON SESSION
// ─────────────────────────────────────────────────────────────

export async function abandonSession(sessionId: string): Promise<void> {
  await prisma.ieltsPlacementSession.update({
    where: { id: sessionId },
    data: { status: 'abandoned', completedAt: new Date() },
  })
}

// ─────────────────────────────────────────────────────────────
// 4. LẤY KẾT QUẢ
// ─────────────────────────────────────────────────────────────

export async function getPlacementResult(sessionId: string): Promise<TestResult> {
  const session = await prisma.ieltsPlacementSession.findUniqueOrThrow({
    where: { id: sessionId },
    include: {
      answers: {
        orderBy: { questionOrder: 'asc' },
        include: { question: true }
      }
    }
  })

  if (session.status !== 'completed') {
    throw new Error('Test chưa hoàn thành.')
  }

  const sessionWithSem = session as typeof session & { sem?: Prisma.Decimal | null }

  const skillBandsRaw = (session.skillBands ?? {}) as Record<string, any>
  const patterns = skillBandsRaw._patterns as SkillPattern | undefined

  return {
    finalBand: Number(session.finalBand),
    skillBands: {
      reading: skillBandsRaw.reading,
      listening: skillBandsRaw.listening,
      writing: skillBandsRaw.writing,
      speaking: skillBandsRaw.speaking,
    },
    confidenceLevel: session.confidenceLevel as 'low' | 'medium' | 'high',
    sem: Number(skillBandsRaw._sem ?? 0.5),
    patterns: patterns ?? { strengths: [], weaknesses: [], balanced: [], insights: [] },
    note: {
      writing: 'Estimated via grammar & cohesion proxy items',
      speaking: 'Estimated via vocabulary & register proxy items',
    },
  }
}

// ─────────────────────────────────────────────────────────────
// INTERNAL: Chọn câu hỏi tiếp theo theo Maximum Information
// ─────────────────────────────────────────────────────────────

async function selectNextQuestion(params: {
  currentTheta: number
  skillsTested: string[]
  usedQuestionIds: string[]
  questionOrder: number
  skillsAnswered: Record<string, number>
  skillThetas: Record<string, number>
}): Promise<QuestionPayload> {
  const {
    currentTheta,
    skillsTested,
    usedQuestionIds,
    questionOrder,
    skillsAnswered,
    skillThetas,
  } = params

  // Bước 1: Xác định skill nào được phép query
  const allowedSkills = skillsTested.filter(skill => {
    const count = skillsAnswered[skill] ?? 0
    return count >= SKILL_QUOTA_MIN
      ? count < SKILL_QUOTA_MAX
      : true
  })

  if (allowedSkills.length === 0) {
    throw new Error('Tất cả skills đã đủ quota tối đa.')
  }

  // Bước 2: Ưu tiên skill chưa đủ SKILL_QUOTA_MIN
  const prioritySkills = allowedSkills.filter(
    s => (skillsAnswered[s] ?? 0) < SKILL_QUOTA_MIN,
  )
  const targetSkills = prioritySkills.length > 0 ? prioritySkills : allowedSkills

  // LOGGING ĐỂ DEBUG
  console.log(`[IRT] --- Selecting Question ${questionOrder} ---`)
  console.log(`[IRT] Current Overall Theta: ${currentTheta.toFixed(3)} (Band ~${thetaToBand(currentTheta)})`)
  console.log(`[IRT] Skills answered:`, JSON.stringify(skillsAnswered))
  console.log(`[IRT] Allowed skills:`, allowedSkills)
  console.log(`[IRT] Priority skills:`, prioritySkills)
  console.log(`[IRT] Target skills:`, targetSkills)

  // Bước 3: Query candidates — THÊM passage_id và context_type
  let candidates: any[]

  if (usedQuestionIds.length === 0) {
    candidates = await prisma.$queryRaw<any[]>`
      SELECT
        id, question_text, question_type, options,
        expected_time_sec, band_min, band_max,
        irt_a, irt_b, irt_c,
        passage_id,
        context_type
      FROM ielts_questions
      WHERE skill         = ANY(${targetSkills}::text[])
        AND status        = 'approved'
        AND is_placement  = true
        AND question_type = ANY(${ALLOWED_TYPES}::text[])
        AND irt_a IS NOT NULL
        AND irt_b IS NOT NULL
    `
  } else {
    candidates = await prisma.$queryRaw<any[]>`
      SELECT
        id, question_text, question_type, options,
        expected_time_sec, band_min, band_max,
        irt_a, irt_b, irt_c,
        passage_id,
        context_type
      FROM ielts_questions
      WHERE skill         = ANY(${targetSkills}::text[])
        AND status        = 'approved'
        AND is_placement  = true
        AND question_type = ANY(${ALLOWED_TYPES}::text[])
        AND irt_a IS NOT NULL
        AND irt_b IS NOT NULL
        AND id           != ALL(${usedQuestionIds}::uuid[])
    `
  }

  if (candidates.length === 0) {
    throw new Error(
      `Pool placement không đủ câu cho theta=${currentTheta.toFixed(2)}, ` +
      `skills=${targetSkills.join(',')}. Cần thêm câu is_placement=true.`,
    )
  }

  console.log(`[IRT] Candidates found: ${candidates.length}`)

  // Bước 4: Chọn câu tối ưu theo Maximum Information
  const candidatesWithParams = candidates.map(q => ({
    id: q.id,
    params: {
      a: Number(q.irt_a ?? 1.0),
      b: Number(q.irt_b ?? 0.0),
      c: Number(q.irt_c ?? 0.25),
    } as IrtParams,
    raw: q,
  }))

  const bestId = selectOptimalItem(
    currentTheta,
    candidatesWithParams.map(c => ({ id: c.id, params: c.params })),
  )

  const selected = candidatesWithParams.find(c => c.id === bestId)!
  console.log(`[IRT] Selected Q ID: ${selected.id} | Difficulty (b): ${selected.params.b} | Info: ${icc(currentTheta, selected.params).toFixed(3)}`)
  const q = selected.raw
  const band = thetaToBand(currentTheta)
  const timeLimitSec = band <= 5.0
    ? (Number(q.expected_time_sec) || 90)
    : (Number(q.expected_time_sec) || 60)

  // Bước 5: Fetch passage nếu câu có passage_id
  let passageData: QuestionPayload['passage'] = null
  const contextType: QuestionPayload['contextType'] =
    q.context_type === 'audio' ? 'audio' :
      q.context_type === 'passage' ? 'passage' :
        'standalone'

  if (q.passage_id) {
    const passage = await prisma.$queryRaw<any[]>`
      SELECT id, title, content, audio_url
      FROM ielts_passages
      WHERE id = ${q.passage_id}::uuid
      LIMIT 1
    `
    if (passage.length > 0) {
      const p = passage[0]
      passageData = {
        id: p.id,
        title: p.title,
        content: p.content,
        audioUrl: p.audio_url ?? null,
      }
    }
  }

  return {
    id: q.id,
    questionText: q.question_text,
    questionType: q.question_type,
    options: q.options,
    timeLimitSec,
    progress: { current: questionOrder, total: MAX_QUESTIONS },
    contextType,
    passage: passageData,
  }
}

function average(nums: number[]): number {
  if (nums.length === 0) return 0
  return nums.reduce((a, b) => a + b, 0) / nums.length
}

// ─────────────────────────────────────────────────────────────
// INTERNAL: Build ItemResponse[] từ answer records
// ─────────────────────────────────────────────────────────────

function buildResponseHistory(
  answers: Array<{
    isCorrect: boolean | null
    irtASnapshot?: any
    irtBSnapshot?: any
    irtCSnapshot?: any
    irtA?: any
    irtB?: any
    irtC?: any
    questionOrder: number
  }>,
): ItemResponse[] {
  return answers
    .filter(a => a.isCorrect !== null)
    .map(a => ({
      correct: a.isCorrect as boolean,
      params: {
        a: Number(a.irtASnapshot ?? a.irtA) || 1.0,
        b: Number(a.irtBSnapshot ?? a.irtB) || 0.0,
        c: Number(a.irtCSnapshot ?? a.irtC) || 0.25,
      },
    }))
}

interface SkillPattern {
  strengths: string[]
  weaknesses: string[]
  balanced: string[]
  insights: string[]
}

function detectPatterns(
  skillEstimates: Record<string, { theta: number; band: number; sem: number }>,
  allAnswers: Array<{ skill?: string | null; isCorrect?: boolean | null }>,
): SkillPattern {
  const strengths: string[] = []
  const weaknesses: string[] = []
  const balanced: string[] = []

  for (const [skill, est] of Object.entries(skillEstimates)) {
    if (est.theta > STRENGTH_THRESHOLD) strengths.push(skill)
    else if (est.theta < WEAKNESS_THRESHOLD) weaknesses.push(skill)
    else balanced.push(skill)
  }

  const accuracyBySkill: Record<string, { correct: number; total: number }> = {}
  for (const ans of allAnswers) {
    if (!ans.skill) continue
    if (!accuracyBySkill[ans.skill]) accuracyBySkill[ans.skill] = { correct: 0, total: 0 }
    accuracyBySkill[ans.skill].total++
    if (ans.isCorrect) accuracyBySkill[ans.skill].correct++
  }

  const insights: string[] = []
  const skillLabels: Record<string, string> = {
    reading: 'Reading',
    listening: 'Listening',
    writing: 'Writing',
    speaking: 'Speaking',
  }

  for (const skill of strengths) {
    const acc = accuracyBySkill[skill]
    const pct = acc ? Math.round((acc.correct / acc.total) * 100) : 0
    insights.push(
      `${skillLabels[skill]}: Tốt (${pct}% chính xác — band ~${skillEstimates[skill].band})`,
    )
  }

  for (const skill of weaknesses) {
    const acc = accuracyBySkill[skill]
    const pct = acc ? Math.round((acc.correct / acc.total) * 100) : 0
    insights.push(
      `${skillLabels[skill]}: Cần cải thiện (${pct}% chính xác — band ~${skillEstimates[skill].band})`,
    )
  }

  for (const skill of balanced) {
    insights.push(
      `${skillLabels[skill]}: Trung bình (band ~${skillEstimates[skill].band})`,
    )
  }

  return { strengths, weaknesses, balanced, insights }
}

// ─────────────────────────────────────────────────────────────
// INTERNAL: Lưu kết quả cuối vào session
// ─────────────────────────────────────────────────────────────

async function finalizeResult(
  sessionId: string,
  estimate: ThetaEstimate,
  allAnswers: Array<{
    isCorrect: boolean | null
    irtASnapshot?: any
    irtBSnapshot?: any
    irtCSnapshot?: any
    skill?: string | null
    questionOrder: number
  }>,
): Promise<void> {
  // Nhóm answers theo skill dùng snapshot đã lưu
  const bySkill: Record<string, ItemResponse[]> = {
    reading: [],
    listening: [],
    writing: [],
    speaking: [],
  }

  for (const ans of allAnswers) {
    if (!ans.skill) continue
    const irtA = ans.irtASnapshot ?? (ans as any).irtA
    const irtB = ans.irtBSnapshot ?? (ans as any).irtB
    const irtC = ans.irtCSnapshot ?? (ans as any).irtC
    if (irtA == null) continue
    bySkill[ans.skill]?.push({
      correct: ans.isCorrect ?? false,
      params: {
        a: Number(irtA) || 1.0,
        b: Number(irtB) || 0.0,
        c: Number(irtC) || 0.25,
      },
    })
  }

  // Tính theta + band riêng từng skill dùng EAP nhất quán
  const skillEstimates: Record<string, { theta: number; band: number; sem: number }> = {}
  for (const [skill, responses] of Object.entries(bySkill)) {
    if (responses.length === 0) {
      skillEstimates[skill] = { theta: 0, band: thetaToBand(0), sem: 0.99 }
      continue
    }
    const est = getFullEstimateEAP(responses, 0)
    skillEstimates[skill] = {
      theta: est.theta,
      band: est.band,
      sem: est.sem,
    }
  }

  const skillBands = {
    reading: skillEstimates.reading.band,
    listening: skillEstimates.listening.band,
    writing: skillEstimates.writing.band,
    speaking: skillEstimates.speaking.band,
  }

  // Overall = weighted average (Tính dựa trên skill thực sự có dữ liệu)
  const skillWeights: Record<string, number> = {
    reading: 0.30, listening: 0.30, writing: 0.20, speaking: 0.20
  }

  let totalWeight = 0
  let weightedTheta = 0

  for (const [skill, est] of Object.entries(skillEstimates)) {
    const responses = bySkill[skill] || []
    if (responses.length === 0) continue
    const w = skillWeights[skill] ?? 0.25
    weightedTheta += est.theta * w
    totalWeight += w
  }

  const overallTheta = totalWeight > 0 ? weightedTheta / totalWeight : 0

  const finalBand = thetaToBand(overallTheta)

  const patterns = detectPatterns(skillEstimates, allAnswers)

  await prisma.ieltsPlacementSession.update({
    where: { id: sessionId },
    data: {
      finalBand,
      skillBands: {
        ...skillBands,
        _patterns: patterns,
        _sem: estimate.sem,       // ✅ lưu vào Json
      } as unknown as Prisma.InputJsonValue,
      confidenceLevel: estimate.confidence,
      // sem: estimate.sem        // ❌ xóa dòng này
    } as Prisma.IeltsPlacementSessionUncheckedUpdateInput,
  })
}

// ─────────────────────────────────────────────────────────────
// INTERNAL: Kiểm tra đáp án
// ─────────────────────────────────────────────────────────────

function checkAnswer(correct: string, userAnswer: string, type: string): boolean {
  const norm = (s: string) => s.trim().toLowerCase().replace(/\s+/g, ' ')

  if (type === 'mcq' || type === 'true_false_ng') {
    return norm(correct) === norm(userAnswer)
  }

  if (type === 'gap_fill') {
    const dist = levenshtein(norm(correct), norm(userAnswer))
    return dist <= (correct.length <= 5 ? 0 : 1)
  }

  return norm(correct) === norm(userAnswer)
}

function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length
  const dp = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0)),
  )

  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1])

  return dp[m][n]
}

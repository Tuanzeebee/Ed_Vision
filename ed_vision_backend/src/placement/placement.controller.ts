// ============================================================
// STEP 5: src/placement/placement.controller.ts
// Không thay đổi nhiều — chỉ thêm field sem vào response
// ============================================================

import { Router, Request, Response, NextFunction } from 'express'
import {
  startPlacementTest,
  submitAnswer,
  abandonSession,
  getPlacementResult,
} from './adaptive.service'

export const placementRouter = Router()

const VALID_SKILLS = ['vocabulary', 'reading', 'listening', 'writing', 'speaking']

// POST /placement-test/start
placementRouter.post('/start', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { accountId, skillsToTest } = req.body ?? {}
    
    if (!accountId || typeof accountId !== 'number') {
      return res.status(400).json({ error: 'accountId (number) là bắt buộc' })
    }
    
    if (!Array.isArray(skillsToTest) || skillsToTest.length === 0) {
      return res.status(400).json({ error: 'skillsToTest[] là bắt buộc' })
    }
    
    const invalid = skillsToTest.filter((s: string) => !VALID_SKILLS.includes(s))
    if (invalid.length > 0) {
      return res.status(400).json({ error: `Skill không hợp lệ: ${invalid.join(', ')}` })
    }
    
    const result = await startPlacementTest({ accountId, skillsToTest })
    return res.status(201).json(result)
  } catch (err) {
    next(err)
  }
})

// POST /placement-test/answer
placementRouter.post('/answer', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { sessionId, questionId, userAnswer, timeTakenSec } = req.body ?? {}
    
    if (!sessionId || !questionId || userAnswer === undefined || !timeTakenSec) {
      return res.status(400).json({
        error: 'sessionId, questionId, userAnswer, timeTakenSec là bắt buộc',
      })
    }
    
    const result = await submitAnswer({
      sessionId,
      questionId,
      userAnswer:   String(userAnswer),
      timeTakenSec: Number(timeTakenSec),
    })
    
    return res.status(200).json(result)
  } catch (err) {
    next(err)
  }
})

// POST /placement-test/abandon
placementRouter.post('/abandon', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { sessionId } = req.body ?? {}
    
    if (!sessionId) {
      return res.status(400).json({ error: 'sessionId là bắt buộc' })
    }
    
    await abandonSession(sessionId)
    return res.status(200).json({ message: 'Session đã huỷ.' })
  } catch (err) {
    next(err)
  }
})

// GET /placement-test/result/:sessionId
placementRouter.get(
  '/result/:sessionId',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await getPlacementResult(String(req.params.sessionId));
      return res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  },
);

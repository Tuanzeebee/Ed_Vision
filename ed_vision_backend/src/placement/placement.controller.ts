import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseInterceptors,
  UploadedFile,
  Logger,
} from '@nestjs/common'
import { AdaptiveService } from './adaptive.service'
import { SpeakingService } from './speaking.service'
import { FileInterceptor } from '@nestjs/platform-express'
import { diskStorage } from 'multer'
import * as path from 'path'
import * as fs from 'fs'

@Controller('placement')
export class PlacementController {
  private readonly logger = new Logger(PlacementController.name)

  constructor(
    private readonly adaptiveService: AdaptiveService,
    private readonly speakingService: SpeakingService,
  ) {}

  @Post('start')
  async start(@Body() body: { accountId: number; skillsToTest: string[] }) {
    return this.adaptiveService.startPlacementTest(body)
  }

  @Post('answer')
  async answer(
    @Body()
    body: {
      sessionId: string
      questionId: string
      userAnswer: string
      timeTakenSec: number
    },
  ) {
    return this.adaptiveService.submitAnswer(body)
  }

  @Post('abandon')
  async abandon(@Body() body: { sessionId: string }) {
    await this.adaptiveService.abandonSession(body.sessionId)
    return { message: 'Session đã huỷ.' }
  }

  @Get('result/:sessionId')
  async getResult(@Param('sessionId') sessionId: string) {
    return this.adaptiveService.getPlacementResult(sessionId)
  }

  @Post('speaking-submit')
  @UseInterceptors(
    FileInterceptor('audio', {
      storage: diskStorage({
        destination: (req, file, cb) => {
          const dir = './uploads/audio/speaking'
          if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true })
          }
          cb(null, dir)
        },
        filename: (req, file, cb) => {
          const unique = `${Date.now()}-${Math.round(Math.random() * 1e6)}`
          cb(null, `${unique}${path.extname(file.originalname)}`)
        },
      }),
      limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
    }),
  )
  async submitSpeaking(
    @UploadedFile() file: Express.Multer.File,
    @Body()
    body: {
      sessionId: string
      questionId: string
      speakingPrompt: string
      timeTakenSec: string
    },
  ) {
    if (!file) {
      throw new Error('Audio file is required')
    }

    // 1. Whisper STT
    const transcript = await this.speakingService.transcribe(file.path)

    // 2. AI Scoring
    const { band, feedback } = await this.speakingService.scoreSpeaking(
      transcript,
      body.speakingPrompt,
      file.path,
    )

    // 3. Submit vào IRT — band >= 5.5 tính là "đúng" để update theta
    const result = await this.adaptiveService.submitAnswer({
      sessionId: body.sessionId,
      questionId: body.questionId,
      userAnswer: `speaking_band:${band}`,
      timeTakenSec: Number(body.timeTakenSec),
    })

    // 4. Trả về kèm transcript và feedback cho FE hiển thị
    return {
      ...result,
      speakingResult: { band, feedback, transcript },
    }
  }
}

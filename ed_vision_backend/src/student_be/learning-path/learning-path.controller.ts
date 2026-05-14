import { Controller, Post, Body, UseGuards, Req } from '@nestjs/common';
import { LearningPathService } from './learning-path.service';
import {
  DiagnosticAnalyzeRequestDto,
  RecommendPlanRequestDto,
} from './dto/learning-path.dto';
import { DevAuthGuard } from '../../common/guards/dev-auth.guard';

@Controller('student/learning-path')
@UseGuards(DevAuthGuard)
export class LearningPathController {
  constructor(private readonly learningPathService: LearningPathService) {}

  @Post('diagnostic/analyze')
  async analyzeDiagnostic(@Body() dto: DiagnosticAnalyzeRequestDto) {
    return this.learningPathService.analyzeDiagnostic(dto);
  }

  @Post('plan/recommend')
  async recommendPlan(@Body() dto: RecommendPlanRequestDto, @Req() req: any) {
    // Usually, you would get diagnostic results from DB.
    // For this example, we pass it via body or mock it if not present.
    // In a real flow, the diagnostic test saves to DB, and recommend reads from DB.
    // Here we'll just mock a diagnostic result if not provided, or expect it.
    // To match user's request, we will keep it simple.

    const accountId = req.user.account_id;
    // We would resolve studentId here, but dto has it or we can fetch from DB.

    // For demonstration, we assume diagnostic results are fetched.
    const mockDiagnosticResults = {
      gap: 200,
      skills: [
        {
          skill: 'Grammar',
          subSkill: 'Tense',
          masteryScore: 30,
          confidence: 0.9,
          weakness: 70,
        },
        {
          skill: 'Listening',
          subSkill: 'Part 1',
          masteryScore: 60,
          confidence: 0.8,
          weakness: 40,
        },
      ],
    };

    return this.learningPathService.recommendPlan(dto, mockDiagnosticResults);
  }
}

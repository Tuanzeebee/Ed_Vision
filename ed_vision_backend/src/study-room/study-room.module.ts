import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { RoomsController } from './rooms.controller';
import { StudyRoomController } from './study-room.controller';
import { StudyRoomGateway } from './study-room.gateway';
import { StudyRoomAuthService } from './study-room-auth.service';
import { StudyRoomService } from './study-room.service';
import { StudyRoomStateService } from './study-room-state.service';
import { LeaderboardController } from './controllers/leaderboard.controller';
import { ExpCalculatorService } from './services/exp-calculator.service';
import { StreakTrackerService } from './services/streak-tracker.service';
import { EligibilityCheckerService } from './services/eligibility-checker.service';
import { RankingEngineService } from './services/ranking-engine.service';
import { OnlineStatusManagerService } from './services/online-status-manager.service';
import { QuestionPointsCalculatorService } from './services/question-points-calculator.service';
import { LeaderboardCronService } from './services/leaderboard-cron.service';

@Module({
  imports: [PrismaModule],
  controllers: [StudyRoomController, RoomsController, LeaderboardController],
  providers: [
    StudyRoomService,
    StudyRoomStateService,
    StudyRoomAuthService,
    StudyRoomGateway,
    ExpCalculatorService,
    StreakTrackerService,
    EligibilityCheckerService,
    RankingEngineService,
    OnlineStatusManagerService,
    QuestionPointsCalculatorService,
    LeaderboardCronService,
  ],
  exports: [StudyRoomService, QuestionPointsCalculatorService],
})
export class StudyRoomModule {}

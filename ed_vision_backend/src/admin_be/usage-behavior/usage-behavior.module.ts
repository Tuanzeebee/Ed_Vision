import { Module } from '@nestjs/common';
import { UsageBehaviorController } from './usage-behavior.controller';
import { UsageBehaviorService } from './usage-behavior.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [UsageBehaviorController],
  providers: [UsageBehaviorService],
  exports: [UsageBehaviorService],
})
export class UsageBehaviorModule {}

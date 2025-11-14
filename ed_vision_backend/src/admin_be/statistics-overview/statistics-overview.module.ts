import { Module } from '@nestjs/common';
import { StatisticsOverviewController } from './statistics-overview.controller';
import { StatisticsOverviewService } from './statistics-overview.service';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [StatisticsOverviewController],
  providers: [StatisticsOverviewService],
  exports: [StatisticsOverviewService],
})
export class StatisticsOverviewModule {}

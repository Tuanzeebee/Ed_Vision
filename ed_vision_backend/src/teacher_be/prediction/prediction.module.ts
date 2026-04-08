import { Module } from '@nestjs/common';
import { PredictionController } from './prediction.controller';
import { PredictionService } from './prediction.service';
import { predictionProviders } from './prediction.providers';
import { DatabaseModule } from '../../mongodb/database.module';
import { PrismaModule } from '../../prisma/prisma.module';
import { MLPredictionService } from './ml-prediction.service';

@Module({
  imports: [DatabaseModule, PrismaModule],
  controllers: [PredictionController],
  providers: [PredictionService, MLPredictionService, ...predictionProviders],
  exports: [PredictionService, MLPredictionService],
})
export class PredictionModule {}

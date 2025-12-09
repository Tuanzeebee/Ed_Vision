import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { GradeStructure, GradeStructureSchema } from '../../mongodb/schemas/grade-structure.schema';
import { GradeStructureController } from './controllers/grade-structure.controller';
import { GradeStructureService } from './services/grade-structure.service';
import { DatabaseModule } from '../../mongodb/database.module';

@Module({
  imports: [
    DatabaseModule,
    MongooseModule.forFeature([
      { name: GradeStructure.name, schema: GradeStructureSchema },
    ]),
  ],
  controllers: [GradeStructureController],
  providers: [GradeStructureService],
  exports: [GradeStructureService],
})
export class GradeStructureModule {}

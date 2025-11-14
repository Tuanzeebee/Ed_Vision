import { Module } from '@nestjs/common';
import { GradeManagementController } from './grade-management.controller';
import { GradeManagementService } from './grade-management.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [GradeManagementController],
    providers: [GradeManagementService],
    exports: [GradeManagementService],
})
export class GradeManagementModule { }

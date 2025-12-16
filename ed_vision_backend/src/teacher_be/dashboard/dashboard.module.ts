import { Module } from '@nestjs/common';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { DevAuthGuard } from '../../common/guards/dev-auth.guard';

@Module({
    imports: [PrismaModule],
    controllers: [DashboardController],
    providers: [DashboardService, DevAuthGuard],
    exports: [DashboardService],
})
export class DashboardModule { }

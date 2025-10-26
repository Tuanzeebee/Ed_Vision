import { Module } from '@nestjs/common'
import { PrismaModule } from '../prisma/prisma.module'
import { RolePermissionsService } from './role-permissions.service'
import { RolePermissionsController } from './role-permissions.controller'

@Module({
  imports: [PrismaModule],
  providers: [RolePermissionsService],
  controllers: [RolePermissionsController],
  exports: [RolePermissionsService],
})
export class RolePermissionsModule {}

import { Body, Controller, Get, Param, Put, UseGuards } from '@nestjs/common';
import { RolePermissionsService } from './role-permissions.service';
import { UpdateRolePermissionsDto } from './dto/update-role-permissions.dto';
import { AdminGuard } from '../common/guards/admin.guard';

@Controller('admin')
@UseGuards(AdminGuard)
export class RolePermissionsController {
  constructor(private readonly svc: RolePermissionsService) {}

  @Get('role-permissions/:roleId')
  async getForRole(@Param('roleId') roleId: string) {
    const data = await this.svc.getPermissionsForRole(roleId);
    return { success: true, data };
  }

  @Put('role-permissions/:roleId')
  async updateForRole(
    @Param('roleId') roleId: string,
    @Body() dto: UpdateRolePermissionsDto,
  ) {
    await this.svc.setPermissionsForRole(roleId, dto.permissions || {});
    return { success: true };
  }

  @Get('roles')
  async getRoles() {
    const roles = await this.svc.getAllRoles()
    return { success: true, roles }
  }

  @Get('permissions')
  async getPermissions() {
    // returns list of permission definitions
    const perms = await (this.svc as any).listAllPermissions();
    return { success: true, data: perms };
  }
}

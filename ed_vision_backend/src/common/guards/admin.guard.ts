import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

/**
 * AdminGuard uses the existing dev-token scheme (dev-token-<account_id>)
 * to find the account and allow access only if the account's role code === 'admin'.
 * This is a simple guard for the current dev flow. Replace with real JWT guard in production.
 */
@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  async canActivate(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest();
    const auth =
      req.headers['authorization'] || req.headers['Authorization'] || '';
    let token = '';
    if (typeof auth === 'string' && auth.startsWith('Bearer '))
      token = auth.slice(7);
    if (!token && req.headers['x-access-token'])
      token = req.headers['x-access-token'];
    if (!token) throw new UnauthorizedException('Thiếu mã xác thực');

    // expect token like dev-token-<id>
    const parts = token.split('-');
    const idStr = parts[parts.length - 1];
    const id = parseInt(idStr, 10);
    if (isNaN(id)) throw new UnauthorizedException('Token không hợp lệ');

    // lazy import PrismaClient to avoid circular deps
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    try {
      const account = await prisma.account.findUnique({
        where: { account_id: id },
        include: { roleRel: true },
      });
      if (!account) throw new UnauthorizedException('Không tìm thấy tài khoản');
      const roleCode = account.roleRel?.code;
      if (!roleCode)
        throw new UnauthorizedException('Chưa phân quyền cho tài khoản');

      // Check for optional required-permission metadata on the handler/class
      const requiredPermission =
        this.reflector.get<string>(
          'requiredPermission',
          context.getHandler(),
        ) ||
        this.reflector.get<string>('requiredPermission', context.getClass());
      if (requiredPermission) {
        // find role and permission and ensure enabled
        const role = await prisma.role.findUnique({
          where: { code: roleCode },
        });
        if (!role) throw new ForbiddenException('Không tìm thấy vai trò');
        const perm = await prisma.permission.findUnique({
          where: { key: requiredPermission },
        });
        if (!perm) throw new ForbiddenException('Không tìm thấy quyền');
        const rp = await prisma.rolePermission.findUnique({
          where: {
            roleId_permissionId: { roleId: role.id, permissionId: perm.id },
          },
        });
        if (!rp || !rp.enabled)
          throw new ForbiddenException('Không có quyền truy cập');
        // attach account to request for downstream
        req.user = {
          account_id: account.account_id,
          email: account.email,
          role: roleCode,
        };
        return true;
      }

      // default: only admin role allowed
      if (roleCode !== 'admin')
        throw new ForbiddenException('Yêu cầu quyền quản trị viên');
      req.user = {
        account_id: account.account_id,
        email: account.email,
        role: roleCode,
      };
      return true;
    } finally {
      await prisma.$disconnect();
    }
  }
}

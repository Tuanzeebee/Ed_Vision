import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class DevAuthGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest();
    const token = this.extractToken(req);

    if (!token) throw new UnauthorizedException('Thiếu mã xác thực');

    const accountId = this.parseAccountIdFromToken(token);

    if (!accountId) throw new UnauthorizedException('Token không hợp lệ');

    const account = await this.prisma.account.findUnique({
      where: { account_id: accountId },
      include: { 
        roleRel: true,
        instructor: true, // Include instructor info
      },
    });

    if (!account) throw new UnauthorizedException('Không tìm thấy tài khoản');

    req.user = {
      account_id: account.account_id,
      email: account.email,
      role: account.roleRel?.code ?? null,
      instructorId: (account as any).instructor?.instructor_id ?? null, // Add instructorId
    };
    req.account = account;

    return true;
  }

  private extractToken(req: any): string | null {
    const authHeader = req.headers?.authorization || req.headers?.Authorization;
    let token = '';
    if (typeof authHeader === 'string') {
      token = authHeader.startsWith('Bearer ')
        ? authHeader.slice(7)
        : authHeader;
    }
    if (!token && typeof req.headers?.['x-access-token'] === 'string') {
      token = req.headers['x-access-token'];
    }
    return token || null;
  }

  private parseAccountIdFromToken(token: string): number | null {
    if (!token) return null;

    // 1. Thử parse dev token format: xxx-{accountId}
    const parts = token.split('-');
    const lastPart = parts[parts.length - 1];
    const devId = parseInt(lastPart, 10);
    if (!Number.isNaN(devId) && devId > 0) {
      return devId;
    }

    // 2. Thử decode JWT token
    try {
      // JWT có 3 phần ngăn cách bởi dấu chấm
      const jwtParts = token.split('.');
      if (jwtParts.length === 3) {
        // Decode payload (phần thứ 2)
        const payload = JSON.parse(
          Buffer.from(jwtParts[1], 'base64').toString('utf8'),
        );

        // Lấy account_id từ payload (có thể là sub, account_id, id, userId, etc.)
        const accountId =
          payload.sub || payload.account_id || payload.id || payload.userId;
        if (typeof accountId === 'number') {
          return accountId;
        }
        if (typeof accountId === 'string') {
          const parsed = parseInt(accountId, 10);
          if (!Number.isNaN(parsed)) return parsed;
        }
      }
    } catch (e) {
      // Not a valid JWT token
    }

    return null;
  }
}

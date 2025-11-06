import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'

@Injectable()
export class DevAuthGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest()
    const token = this.extractToken(req)
    if (!token) throw new UnauthorizedException('Thiếu mã xác thực')

    const accountId = this.parseAccountIdFromToken(token)
    if (!accountId) throw new UnauthorizedException('Token không hợp lệ')

    const account = await this.prisma.account.findUnique({
      where: { account_id: accountId },
      include: { roleRel: true },
    })

    if (!account) throw new UnauthorizedException('Không tìm thấy tài khoản')

    req.user = {
      account_id: account.account_id,
      email: account.email,
      role: account.roleRel?.code ?? null,
    }
    req.account = account

    return true
  }

  private extractToken(req: any): string | null {
    const authHeader = req.headers?.authorization || req.headers?.Authorization
    let token = ''
    if (typeof authHeader === 'string') {
      token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader
    }
    if (!token && typeof req.headers?.['x-access-token'] === 'string') {
      token = req.headers['x-access-token'] as string
    }
    return token || null
  }

  private parseAccountIdFromToken(token: string): number | null {
    if (!token) return null
    const parts = token.split('-')
    const candidate = parts[parts.length - 1]
    const id = parseInt(candidate, 10)
    return Number.isNaN(id) ? null : id
  }
}

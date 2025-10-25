import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common'

/**
 * AdminGuard uses the existing dev-token scheme (dev-token-<account_id>)
 * to find the account and allow access only if the account's role code === 'admin'.
 * This is a simple guard for the current dev flow. Replace with real JWT guard in production.
 */
@Injectable()
export class AdminGuard implements CanActivate {
  constructor() {}

  async canActivate(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest()
    const auth = req.headers['authorization'] || req.headers['Authorization'] || ''
    let token = ''
    if (typeof auth === 'string' && auth.startsWith('Bearer ')) token = auth.slice(7)
    if (!token && req.headers['x-access-token']) token = req.headers['x-access-token']
    if (!token) throw new UnauthorizedException('Missing token')

    // expect token like dev-token-<id>
    const parts = token.split('-')
    const idStr = parts[parts.length - 1]
    const id = parseInt(idStr, 10)
    if (isNaN(id)) throw new UnauthorizedException('Invalid token')

    // lazy import PrismaService to avoid circular deps
    const { PrismaClient } = require('@prisma/client')
    const prisma = new PrismaClient()
    try {
      const account = await prisma.account.findUnique({ where: { account_id: id }, include: { roleRel: true } })
      if (!account) throw new UnauthorizedException('Account not found')
  const roleCode = account.roleRel?.code
  if (!roleCode) throw new UnauthorizedException('Account role not assigned')
  if (roleCode !== 'admin') throw new UnauthorizedException('Admin access required')
  // attach account to request for downstream use
  req.user = { account_id: account.account_id, email: account.email, role: roleCode }
      return true
    } finally {
      await prisma.$disconnect()
    }
  }
}

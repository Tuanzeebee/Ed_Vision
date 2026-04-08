import { Injectable, UnauthorizedException } from '@nestjs/common';
import type { Socket } from 'socket.io';
import { PrismaService } from '../prisma/prisma.service';
import { StudyRoomSocketUser } from './study-room.types';

@Injectable()
export class StudyRoomAuthService {
  constructor(private readonly prisma: PrismaService) {}

  async authenticateSocket(client: Socket): Promise<StudyRoomSocketUser> {
    const token = this.extractToken(client);
    if (!token) {
      throw new UnauthorizedException('Missing study room auth token');
    }

    const accountId = this.parseAccountIdFromToken(token);
    if (!accountId) {
      throw new UnauthorizedException('Invalid study room auth token');
    }

    const account = await this.prisma.account.findUnique({
      where: { account_id: accountId },
      include: {
        roleRel: true,
        profile: true,
      },
    });

    if (!account) {
      throw new UnauthorizedException('Account not found');
    }

    return {
      accountId: account.account_id,
      email: account.email,
      role: account.roleRel?.code ?? null,
      displayName: account.profile?.full_name ?? null,
      avatarUrl: account.profile?.avatar_url ?? null,
    };
  }

  private extractToken(client: Socket): string | null {
    const authToken = client.handshake.auth?.token;
    if (typeof authToken === 'string' && authToken.trim()) {
      return this.stripBearer(authToken);
    }

    const authHeader =
      client.handshake.headers.authorization ??
      client.handshake.headers.Authorization;
    if (typeof authHeader === 'string' && authHeader.trim()) {
      return this.stripBearer(authHeader);
    }

    const queryToken = client.handshake.query?.token;
    if (typeof queryToken === 'string' && queryToken.trim()) {
      return this.stripBearer(queryToken);
    }

    const accessTokenHeader = client.handshake.headers['x-access-token'];
    if (typeof accessTokenHeader === 'string' && accessTokenHeader.trim()) {
      return this.stripBearer(accessTokenHeader);
    }

    return null;
  }

  private stripBearer(value: string): string {
    return value.startsWith('Bearer ') ? value.slice(7) : value;
  }

  private parseAccountIdFromToken(token: string): number | null {
    const tokenParts = token.split('-');
    const lastPart = tokenParts[tokenParts.length - 1];
    const devTokenAccountId = Number.parseInt(lastPart, 10);
    if (!Number.isNaN(devTokenAccountId) && devTokenAccountId > 0) {
      return devTokenAccountId;
    }

    try {
      const jwtParts = token.split('.');
      if (jwtParts.length !== 3) {
        return null;
      }

      const payload = JSON.parse(
        Buffer.from(jwtParts[1], 'base64').toString('utf8'),
      ) as Record<string, unknown>;

      const accountId =
        payload.sub ?? payload.account_id ?? payload.id ?? payload.userId;

      if (typeof accountId === 'number' && accountId > 0) {
        return accountId;
      }

      if (typeof accountId === 'string') {
        const parsedAccountId = Number.parseInt(accountId, 10);
        if (!Number.isNaN(parsedAccountId) && parsedAccountId > 0) {
          return parsedAccountId;
        }
      }
    } catch {
      return null;
    }

    return null;
  }
}

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  AttendanceSession,
  AttendanceVerificationAttempt,
  DeviceFingerprint,
  CampusNetworkConfig,
} from '@prisma/client';
import { RedisService } from '../redis/redis.service';

type StoredQrToken = {
  token: string;
  expiresAt: number;
  issuedAt: number;
  used: boolean;
};

@Injectable()
export class AttendanceRepository {
  private readonly qrFreshWindowMs = 5000;

  constructor(
    private readonly prisma: PrismaService,
    private readonly redisService: RedisService,
  ) {}

  // Session management
  async createSession(data: {
    appointment_id?: number | null;
    instructor_id: number;
    student_id?: number | null;
    qr_refresh_interval?: number;
    qr_expiry_seconds?: number;
  }): Promise<AttendanceSession> {
    return this.prisma.attendanceSession.create({ data });
  }

  async getSessionByAppointmentId(
    appointmentId: number,
  ): Promise<AttendanceSession | null> {
    return this.prisma.attendanceSession.findFirst({
      where: { appointment_id: appointmentId },
    });
  }

  async updateSession(
    sessionId: string,
    data: Partial<AttendanceSession>,
  ): Promise<AttendanceSession> {
    return this.prisma.attendanceSession.update({
      where: { session_id: sessionId },
      data,
    });
  }

  // Verification attempts
  async createVerificationAttempt(data: {
    session_id: string;
    account_id: number;
    qr_token?: string;
    qr_valid?: boolean;
    qr_fresh?: boolean;
    qr_not_reused?: boolean;
    device_fingerprint?: string;
    device_match?: boolean;
    device_changed_recently?: boolean;
    client_ip?: string;
    campus_ip?: boolean;
    wifi_ssid?: string;
    campus_wifi?: boolean;
    network_latency?: number;
    gps_latitude?: number;
    gps_longitude?: number;
    gps_accuracy?: number;
    gps_timestamp?: Date;
    campus_zone?: boolean;
    gps_spoof_detected?: boolean;
    scan_duration?: number;
    typing_pattern?: string;
    behavior_normal?: boolean;
    trust_score?: number;
    risk_level?: string;
    suspicious_timing?: boolean;
    multiple_attempts?: boolean;
    vpn_detected?: boolean;
    brute_force_pattern?: boolean;
  }): Promise<AttendanceVerificationAttempt> {
    return this.prisma.attendanceVerificationAttempt.create({ data });
  }

  async getAttemptsForSession(sessionId: string): Promise<any[]> {
    return this.prisma.attendanceVerificationAttempt.findMany({
      where: { session_id: sessionId },
      orderBy: { timestamp: 'desc' },
      include: {
        account: {
          include: {
            profile: true,
            student: true,
            parent: true,
          },
        },
      },
    });
  }

  async approveAttempt(
    attemptId: number,
    approverId: number,
    reason?: string,
  ): Promise<AttendanceVerificationAttempt> {
    return this.prisma.attendanceVerificationAttempt.update({
      where: { attempt_id: attemptId },
      data: {
        approved: true,
        approved_by: approverId,
        approved_at: new Date(),
        review_reason: reason,
      },
    });
  }

  // Device fingerprinting
  async createOrUpdateDeviceFingerprint(data: {
    account_id: number;
    fingerprint_hash: string;
    user_agent?: string;
    screen_resolution?: string;
    timezone?: string;
    language?: string;
    platform?: string;
    hardware_concurrency?: number;
    device_memory?: number;
    canvas_fingerprint?: string;
    webgl_fingerprint?: string;
    is_primary?: boolean;
  }): Promise<DeviceFingerprint> {
    return this.prisma.deviceFingerprint.upsert({
      where: {
        account_id_fingerprint_hash: {
          account_id: data.account_id,
          fingerprint_hash: data.fingerprint_hash,
        },
      },
      update: {
        last_used_at: new Date(),
        ...data,
      },
      create: data,
    });
  }

  async getDeviceFingerprints(accountId: number): Promise<DeviceFingerprint[]> {
    return this.prisma.deviceFingerprint.findMany({
      where: { account_id: accountId },
      orderBy: { last_used_at: 'desc' },
    });
  }

  async getPrimaryDevice(accountId: number): Promise<DeviceFingerprint | null> {
    return this.prisma.deviceFingerprint.findFirst({
      where: { account_id: accountId, is_primary: true },
    });
  }

  // Campus network config
  async getCampusConfig(): Promise<CampusNetworkConfig | null> {
    return this.prisma.campusNetworkConfig.findFirst({
      where: { is_active: true },
    });
  }

  async createCampusConfig(data: {
    campus_name: string;
    ip_ranges: string;
    wifi_ssids: string;
    gateway_ips: string;
    gps_boundaries?: string;
    latitude_center?: number;
    longitude_center?: number;
    radius_meters?: number;
  }): Promise<CampusNetworkConfig> {
    return this.prisma.campusNetworkConfig.create({ data });
  }

  // QR token management (in-memory cache for this demo)
  private qrTokens = new Map<string, StoredQrToken>();

  private getQrTokenStoreKey(sessionId: string): string {
    return `attendance:qr:${sessionId}`;
  }

  private async getStoredQrToken(
    sessionId: string,
  ): Promise<StoredQrToken | null> {
    if (this.redisService.isReady()) {
      return this.redisService.getJson<StoredQrToken>(
        this.getQrTokenStoreKey(sessionId),
      );
    }

    return this.qrTokens.get(sessionId) ?? null;
  }

  private async validateQrTokenWithRedis(
    sessionId: string,
    providedToken: string,
  ): Promise<boolean> {
    const client = this.redisService.getClient();
    if (!client) {
      return false;
    }

    const result = await client.eval(
      `
        local payload = redis.call('GET', KEYS[1])
        if not payload then
          return 0
        end

        local data = cjson.decode(payload)
        local providedToken = ARGV[1]
        local now = tonumber(ARGV[2])

        if data["used"] == true then
          return 0
        end

        if tonumber(data["expiresAt"]) < now then
          return 0
        end

        if data["token"] ~= providedToken then
          return 0
        end

        data["used"] = true
        redis.call('SET', KEYS[1], cjson.encode(data), 'KEEPTTL')
        return 1
      `,
      {
        keys: [this.redisService.getKey(this.getQrTokenStoreKey(sessionId))],
        arguments: [providedToken, `${Date.now()}`],
      },
    );

    return Number(result) === 1;
  }

  async storeQRToken(
    sessionId: string,
    token: string,
    expiresInSeconds: number,
  ): Promise<void> {
    const now = Date.now();
    const storedToken: StoredQrToken = {
      token,
      expiresAt: now + expiresInSeconds * 1000,
      issuedAt: now,
      used: false,
    };

    const storedInRedis = await this.redisService.setJson(
      this.getQrTokenStoreKey(sessionId),
      storedToken,
      expiresInSeconds,
    );

    if (!storedInRedis) {
      this.qrTokens.set(sessionId, storedToken);
    }
  }

  async validateQRToken(
    sessionId: string,
    providedToken: string,
  ): Promise<boolean> {
    if (this.redisService.isReady()) {
      return this.validateQrTokenWithRedis(sessionId, providedToken);
    }

    const stored = this.qrTokens.get(sessionId);
    if (!stored) return false;

    const now = Date.now();
    if (now > stored.expiresAt || stored.used) {
      this.qrTokens.delete(sessionId);
      return false;
    }

    if (stored.token === providedToken) {
      stored.used = true; // Mark as used
      return true;
    }

    return false;
  }

  async isQRTokenFresh(sessionId: string): Promise<boolean> {
    const stored = await this.getStoredQrToken(sessionId);
    if (!stored) return false;

    const now = Date.now();
    if (stored.used || now > stored.expiresAt) {
      return false;
    }

    return now - stored.issuedAt < this.qrFreshWindowMs;
  }
}

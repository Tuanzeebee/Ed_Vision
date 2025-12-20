import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  AttendanceSession,
  AttendanceVerificationAttempt,
  DeviceFingerprint,
  CampusNetworkConfig,
} from '@prisma/client';

@Injectable()
export class AttendanceRepository {
  constructor(private readonly prisma: PrismaService) {}

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
  private qrTokens = new Map<
    string,
    { token: string; expiresAt: Date; used: boolean }
  >();

  async storeQRToken(
    sessionId: string,
    token: string,
    expiresInSeconds: number,
  ): Promise<void> {
    const expiresAt = new Date(Date.now() + expiresInSeconds * 1000);
    this.qrTokens.set(sessionId, { token, expiresAt, used: false });
  }

  async validateQRToken(
    sessionId: string,
    providedToken: string,
  ): Promise<boolean> {
    const stored = this.qrTokens.get(sessionId);
    if (!stored) return false;

    const now = new Date();
    if (now > stored.expiresAt || stored.used) return false;

    if (stored.token === providedToken) {
      stored.used = true; // Mark as used
      return true;
    }

    return false;
  }

  async isQRTokenFresh(sessionId: string): Promise<boolean> {
    const stored = this.qrTokens.get(sessionId);
    if (!stored) return false;

    const now = new Date();
    const tokenAge = now.getTime() - (stored.expiresAt.getTime() - 15000); // 15 seconds expiry
    return tokenAge < 5000; // Fresh if less than 5 seconds old
  }
}

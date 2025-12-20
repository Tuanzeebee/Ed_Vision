import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { AttendanceRepository } from './attendance.repository';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAttendanceSessionDto } from './dto/create-attendance-session.dto';
import { VerifyAttendanceDto } from './dto/verify-attendance.dto';
import { ApproveAttemptDto } from './dto/approve-attempt.dto';
import { RegisterDeviceDto } from './dto/register-device.dto';

export interface TrustScoreFactors {
  qrValid: boolean;
  qrFresh: boolean;
  qrNotReused: boolean;
  deviceMatch: boolean;
  deviceChangedRecently: boolean;
  campusIP: boolean;
  campusWiFi: boolean;
  networkLatency?: number;
  campusZone: boolean;
  gpsSpoofDetected: boolean;
  behaviorNormal: boolean;
  suspiciousTiming: boolean;
  multipleAttempts: boolean;
  vpnDetected: boolean;
  bruteForcePattern: boolean;
}

@Injectable()
export class AttendanceService {
  private readonly logger = new Logger(AttendanceService.name);

  constructor(
    private readonly repository: AttendanceRepository,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Create a new attendance session for an appointment or slot
   */
  async createSession(accountId: number, dto: CreateAttendanceSessionDto) {
    this.logger.log(`Creating session for accountId: ${accountId}, dto:`, dto);

    let instructorId: number;
    let studentId: number | null = null;
    let appointmentId: number | null = null;

    // If appointmentId is provided, use appointment-based flow
    if (dto.appointmentId) {
      this.logger.log('Using appointment-based flow');
      const appointment = await this.prisma.appointment.findUnique({
        where: { appointment_id: dto.appointmentId },
        include: { instructor: true, student: true },
      });

      if (!appointment) {
        throw new NotFoundException('Appointment not found');
      }

      if (
        !appointment.instructor ||
        appointment.instructor.account_id !== accountId
      ) {
        throw new BadRequestException(
          'You can only create sessions for your own appointments',
        );
      }

      if (appointment.status !== 'confirmed') {
        throw new BadRequestException(
          'Can only create attendance session for confirmed appointments',
        );
      }

      // Check if session already exists
      const existingSession = await this.repository.getSessionByAppointmentId(
        dto.appointmentId,
      );
      if (existingSession) {
        throw new BadRequestException(
          'Attendance session already exists for this appointment',
        );
      }

      instructorId = appointment.instructor_id!;
      studentId = appointment.student_id!;
      appointmentId = dto.appointmentId;
    }
    // If slotId is provided, use slot-based flow (for walk-in sessions)
    else if (dto.slotId) {
      this.logger.log('Using slot-based flow for slotId:', dto.slotId);

      // Get instructor from account
      const instructor = await this.prisma.instructor.findUnique({
        where: { account_id: accountId },
      });

      if (!instructor) {
        throw new NotFoundException('Instructor not found');
      }

      this.logger.log('Found instructor:', instructor.instructor_id);
      instructorId = instructor.instructor_id;
      // For walk-in sessions, appointment_id and student_id will be null
    } else {
      throw new BadRequestException(
        'Either appointmentId or slotId must be provided',
      );
    }

    this.logger.log('Creating session with params:', {
      appointment_id: appointmentId,
      instructor_id: instructorId,
      student_id: studentId,
    });

    const session = await this.repository.createSession({
      appointment_id: appointmentId,
      instructor_id: instructorId,
      student_id: studentId,
      qr_refresh_interval: dto.qrRefreshInterval || 5000,
      qr_expiry_seconds: dto.qrExpirySeconds || 15,
    });

    this.logger.log('Session created:', session.session_id);

    // Generate initial QR token
    await this.generateQRToken(session.session_id);

    return session;
  }

  /**
   * Get current QR code for a session
   */
  async getCurrentQR(sessionId: string) {
    const session = await this.prisma.attendanceSession.findUnique({
      where: { session_id: sessionId },
    });

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    // Generate fresh QR token
    const qrToken = await this.generateQRToken(sessionId);
    const expiresAt = new Date(Date.now() + session.qr_expiry_seconds * 1000);

    // Get active campus network config for IP validation
    const campusConfig = await this.prisma.campusNetworkConfig.findFirst({
      where: { is_active: true },
    });

    // Create QR data as JSON string with network validation info
    const qrData = JSON.stringify({
      sessionId,
      token: qrToken,
      timestamp: Date.now(),
      expectedNetwork: campusConfig
        ? {
            ipRanges: campusConfig.ip_ranges,
            wifiSSIDs: campusConfig.wifi_ssids,
            gps: {
              lat: campusConfig.latitude_center,
              lng: campusConfig.longitude_center,
              radius: campusConfig.radius_meters,
            },
          }
        : null,
    });

    return {
      sessionId,
      qrToken,
      qrData,
      expiresAt,
      refreshInterval: session.qr_refresh_interval,
    };
  }

  /**
   * Verify attendance with multi-layer validation
   */
  async verifyAttendance(accountId: number, dto: VerifyAttendanceDto) {
    const session = await this.prisma.attendanceSession.findUnique({
      where: { session_id: dto.sessionId },
    });

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    if (session.status !== 'active') {
      throw new BadRequestException('Session is not active');
    }

    // Verify student owns this session
    const student = await this.prisma.student.findUnique({
      where: { account_id: accountId },
    });

    if (!student || student.student_id !== session.student_id) {
      throw new BadRequestException('You are not authorized for this session');
    }

    // Perform multi-layer verification
    const factors = await this.performVerification(dto);

    // Calculate trust score
    const trustScore = this.calculateTrustScore(factors);

    // Determine risk level
    const riskLevel = this.getRiskLevel(trustScore);

    // Create verification attempt record
    const attempt = await this.repository.createVerificationAttempt({
      session_id: dto.sessionId,
      account_id: accountId,
      qr_token: dto.qrToken,
      ...factors,
      trust_score: trustScore,
      risk_level: riskLevel,
    });

    // Auto-approve high trust scores
    if (trustScore >= 90) {
      await this.repository.approveAttempt(
        attempt.attempt_id,
        session.instructor_id,
        'Auto-approved: High trust score',
      );
    }

    return {
      attemptId: attempt.attempt_id,
      trustScore,
      riskLevel,
      approved: attempt.approved,
      factors,
    };
  }

  /**
   * Approve a verification attempt (instructor only)
   */
  async approveAttempt(accountId: number, dto: ApproveAttemptDto) {
    const attempt = await this.prisma.attendanceVerificationAttempt.findUnique({
      where: { attempt_id: dto.attemptId },
      include: { session: true },
    });

    if (!attempt) {
      throw new NotFoundException('Attempt not found');
    }

    if (attempt.session.instructor_id !== accountId) {
      throw new BadRequestException(
        'You can only approve attempts for your sessions',
      );
    }

    return this.repository.approveAttempt(dto.attemptId, accountId, dto.reason);
  }

  /**
   * Register device fingerprint
   */
  async registerDevice(accountId: number, dto: RegisterDeviceDto) {
    // Create fingerprint hash from device data
    const fingerprintData = `${dto.userAgent || ''}|${dto.screenResolution || ''}|${dto.timezone || ''}|${dto.language || ''}|${dto.platform || ''}`;
    const fingerprintHash = this.hashString(fingerprintData);

    // Check if this is the first device for this account
    const existingDevices =
      await this.repository.getDeviceFingerprints(accountId);
    const isPrimary = existingDevices.length === 0;

    return this.repository.createOrUpdateDeviceFingerprint({
      account_id: accountId,
      fingerprint_hash: fingerprintHash,
      user_agent: dto.userAgent,
      screen_resolution: dto.screenResolution,
      timezone: dto.timezone,
      language: dto.language,
      platform: dto.platform,
      hardware_concurrency: dto.hardwareConcurrency,
      device_memory: dto.deviceMemory,
      canvas_fingerprint: dto.canvasFingerprint,
      webgl_fingerprint: dto.webglFingerprint,
      is_primary: isPrimary,
    });
  }

  /**
   * Get session status and attempts
   */
  async getSessionStatus(sessionId: string, accountId: number) {
    const session = await this.prisma.attendanceSession.findUnique({
      where: { session_id: sessionId },
      include: {
        instructor: { include: { account: { include: { profile: true } } } },
        student: {
          include: { account: { include: { profile: true } } },
        },
      },
    });

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    // Check permissions
    const isInstructor = session.instructor.account_id === accountId;
    const isStudent = session.student?.account_id === accountId;

    if (!isInstructor && !isStudent) {
      throw new BadRequestException('Access denied');
    }

    const attempts = await this.repository.getAttemptsForSession(sessionId);

    // Format attempts for frontend
    const formattedAttempts = attempts.map((attempt) => ({
      attemptId: attempt.attempt_id,
      accountId: attempt.account_id,
      accountName: attempt.account?.profile?.full_name || 'Unknown',
      accountType: attempt.account?.student
        ? 'student'
        : attempt.account?.parent
          ? 'parent'
          : 'unknown',
      timestamp: attempt.timestamp,
      trustScore: attempt.trust_score,
      status: attempt.approved
        ? 'verified'
        : attempt.trust_score >= 60
          ? 'verified'
          : 'pending',
      verificationDetails: {
        qrValid: attempt.qr_valid,
        deviceMatch: attempt.device_match,
        campusNetwork: attempt.campus_ip || attempt.campus_wifi,
        gpsVerified: attempt.campus_zone,
        riskLevel: attempt.risk_level,
      },
    }));

    return {
      sessionId: session.session_id,
      appointmentId: session.appointment_id,
      status: session.status,
      startedAt: session.started_at,
      endedAt: session.ended_at,
      attempts: isInstructor
        ? formattedAttempts
        : formattedAttempts.filter((a) => a.accountId === accountId),
      verifiedCount: formattedAttempts.filter((a) => a.status === 'verified')
        .length,
      pendingCount: formattedAttempts.filter((a) => a.status === 'pending')
        .length,
    };
  }

  // Private methods

  private async performVerification(
    dto: VerifyAttendanceDto,
  ): Promise<TrustScoreFactors> {
    const factors: TrustScoreFactors = {
      qrValid: false,
      qrFresh: false,
      qrNotReused: false,
      deviceMatch: false,
      deviceChangedRecently: false,
      campusIP: false,
      campusWiFi: false,
      campusZone: false,
      gpsSpoofDetected: false,
      behaviorNormal: false,
      suspiciousTiming: false,
      multipleAttempts: false,
      vpnDetected: false,
      bruteForcePattern: false,
    };

    // 1. QR Validation
    factors.qrValid = await this.repository.validateQRToken(
      dto.sessionId,
      dto.qrToken,
    );
    factors.qrFresh = await this.repository.isQRTokenFresh(dto.sessionId);
    factors.qrNotReused = factors.qrValid; // Since we mark as used

    // 2. Device Validation
    if (dto.deviceFingerprint) {
      const primaryDevice = await this.repository.getPrimaryDevice(
        dto.accountId,
      );
      if (primaryDevice) {
        factors.deviceMatch =
          primaryDevice.fingerprint_hash === dto.deviceFingerprint;
        factors.deviceChangedRecently =
          this.checkDeviceChangedRecently(primaryDevice);
      }
    }

    // 3. Network Validation
    const campusConfig = await this.repository.getCampusConfig();
    if (campusConfig && dto.clientIp) {
      factors.campusIP = this.isCampusIP(dto.clientIp, campusConfig.ip_ranges);
      factors.campusWiFi = dto.wifiSsid
        ? this.isCampusWiFi(dto.wifiSsid, campusConfig.wifi_ssids)
        : false;
      factors.vpnDetected = this.detectVPN(dto.clientIp);
    }

    // 4. GPS Validation
    if (dto.gpsLatitude && dto.gpsLongitude) {
      if (campusConfig) {
        factors.campusZone = this.isInCampusZone(
          dto.gpsLatitude,
          dto.gpsLongitude,
          campusConfig.latitude_center || undefined,
          campusConfig.longitude_center || undefined,
          campusConfig.radius_meters || undefined,
        );
      }
      factors.gpsSpoofDetected = this.detectGPSSpoofing(dto);
    }

    // 5. Behavioral Analysis
    factors.behaviorNormal = this.analyzeBehavior(dto);
    factors.suspiciousTiming = this.detectSuspiciousTiming(dto);
    factors.multipleAttempts = await this.detectMultipleAttempts(
      dto.sessionId,
      dto.accountId,
    );

    return factors;
  }

  private calculateTrustScore(factors: TrustScoreFactors): number {
    let score = 0;

    // QR Code (40 points)
    if (factors.qrValid && factors.qrFresh && factors.qrNotReused) {
      score += 40;
    } else if (factors.qrValid) {
      score += 20;
    }

    // Device (30 points)
    if (factors.deviceMatch && !factors.deviceChangedRecently) {
      score += 30;
    } else if (factors.deviceMatch) {
      score += 15;
    }

    // Network (20 points)
    if (factors.campusIP && factors.campusWiFi) {
      score += 20;
    } else if (factors.campusIP || factors.campusWiFi) {
      score += 10;
    }

    // GPS (10 points)
    if (factors.campusZone && !factors.gpsSpoofDetected) {
      score += 10;
    }

    // Behavior (5 points)
    if (factors.behaviorNormal) {
      score += 5;
    }

    // Penalties
    if (factors.suspiciousTiming) score -= 15;
    if (factors.multipleAttempts) score -= 10;
    if (factors.vpnDetected) score -= 10;
    if (factors.bruteForcePattern) score -= 20;

    return Math.max(0, Math.min(100, score));
  }

  private getRiskLevel(score: number): string {
    if (score >= 90) return 'low';
    if (score >= 70) return 'medium';
    return 'high';
  }

  private async generateQRToken(sessionId: string): Promise<string> {
    const token = this.generateSecureToken();
    await this.repository.storeQRToken(sessionId, token, 15); // 15 seconds expiry
    return token;
  }

  private generateSecureToken(): string {
    return require('crypto').randomBytes(32).toString('hex');
  }

  private hashString(str: string): string {
    return require('crypto').createHash('sha256').update(str).digest('hex');
  }

  private isCampusIP(ip: string, ipRanges: string): boolean {
    // Simple IP range check - in production, use a proper IP range library
    const ranges = JSON.parse(ipRanges);
    // Implementation would check if IP is in any of the ranges
    return ranges.some((range: string) => ip.startsWith(range.split('/')[0]));
  }

  private isCampusWiFi(ssid: string, allowedSsids: string): boolean {
    const ssids = JSON.parse(allowedSsids);
    return ssids.includes(ssid);
  }

  private isInCampusZone(
    lat: number,
    lng: number,
    centerLat?: number,
    centerLng?: number,
    radius?: number,
  ): boolean {
    if (!centerLat || !centerLng || !radius) return false;

    const distance = this.calculateDistance(lat, lng, centerLat, centerLng);
    return distance <= radius;
  }

  private calculateDistance(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number,
  ): number {
    // Haversine formula for distance calculation
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lng2 - lng1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  private detectGPSSpoofing(dto: VerifyAttendanceDto): boolean {
    // Simple spoofing detection
    if (dto.gpsAccuracy && dto.gpsAccuracy > 100) return true; // Too inaccurate
    if (dto.gpsLatitude && (dto.gpsLatitude < -90 || dto.gpsLatitude > 90))
      return true;
    if (dto.gpsLongitude && (dto.gpsLongitude < -180 || dto.gpsLongitude > 180))
      return true;

    // Check for "perfect" coordinates (common in fake GPS)
    if (dto.gpsLatitude && dto.gpsLongitude) {
      const latStr = dto.gpsLatitude.toString();
      const lngStr = dto.gpsLongitude.toString();
      if (latStr.includes('.') && lngStr.includes('.')) {
        const latDecimals = latStr.split('.')[1].length;
        const lngDecimals = lngStr.split('.')[1].length;
        if (latDecimals > 6 && lngDecimals > 6) {
          // Too many decimal places might indicate spoofing
          return true;
        }
      }
    }

    return false;
  }

  private detectVPN(ip: string): boolean {
    // Simple VPN detection - check for known VPN IP ranges
    // In production, use a proper VPN detection service
    return false; // Placeholder
  }

  private analyzeBehavior(dto: VerifyAttendanceDto): boolean {
    // Check scan duration (should be reasonable)
    if (
      dto.scanDuration &&
      (dto.scanDuration < 100 || dto.scanDuration > 10000)
    ) {
      return false;
    }
    return true;
  }

  private detectSuspiciousTiming(dto: VerifyAttendanceDto): boolean {
    // Check if verification happens at suspicious times
    const now = new Date();
    const hour = now.getHours();
    // Suspicious if outside typical class hours (6 AM - 10 PM)
    return hour < 6 || hour > 22;
  }

  private async detectMultipleAttempts(
    sessionId: string,
    accountId: number,
  ): Promise<boolean> {
    const attempts = await this.repository.getAttemptsForSession(sessionId);
    const recentAttempts = attempts.filter(
      (a) =>
        a.account_id === accountId &&
        new Date().getTime() - a.timestamp.getTime() < 3600000, // Last hour
    );
    return recentAttempts.length > 3;
  }

  /**
   * End an attendance session
   */
  async endSession(sessionId: string, accountId: number) {
    const session = await this.prisma.attendanceSession.findUnique({
      where: { session_id: sessionId },
      include: { instructor: true },
    });

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    // Verify instructor owns the session
    if (session.instructor.account_id !== accountId) {
      throw new BadRequestException('You can only end your own sessions');
    }

    // Update session to ended
    await this.prisma.attendanceSession.update({
      where: { session_id: sessionId },
      data: {
        ended_at: new Date(),
        status: 'completed',
      },
    });

    return {
      message: 'Session ended successfully',
      sessionId,
    };
  }

  /**
   * Get campus network configuration
   */
  async getCampusConfig() {
    return this.repository.getCampusConfig();
  }

  /**
   * Create campus network configuration
   */
  async createCampusConfig(dto: {
    campus_name: string;
    ip_ranges: string;
    wifi_ssids: string;
    gateway_ips: string;
    gps_boundaries?: string;
    latitude_center?: number;
    longitude_center?: number;
    radius_meters?: number;
  }) {
    return this.repository.createCampusConfig(dto);
  }

  private checkDeviceChangedRecently(device: any): boolean {
    const lastUsed = new Date(device.last_used_at);
    const daysSinceLastUse =
      (new Date().getTime() - lastUsed.getTime()) / (1000 * 60 * 60 * 24);
    return daysSinceLastUse > 30; // Changed if not used for 30 days
  }
}

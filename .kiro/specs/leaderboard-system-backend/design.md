# Design Document: Leaderboard System Backend

## Overview

Hệ thống Leaderboard Backend được thiết kế để thay thế dữ liệu hardcode hiện tại trên frontend bằng một hệ thống backend hoàn chỉnh. Hệ thống này quản lý điểm EXP (Experience Points), chuỗi học (Streak), điều kiện tham gia bảng xếp hạng, trạng thái online, và logic xếp hạng theo tuần và tổng.

### Mục tiêu chính

1. **Tự động hóa tính toán EXP**: Tính toán và cập nhật điểm EXP dựa trên thời gian học trong study room
2. **Theo dõi Streak**: Ghi nhận và duy trì chuỗi ngày học liên tiếp của người dùng
3. **Quản lý điều kiện tham gia**: Đảm bảo chỉ những người dùng đủ điều kiện mới xuất hiện trên bảng xếp hạng
4. **Xếp hạng động**: Cung cấp bảng xếp hạng theo tuần và tổng với cập nhật real-time
5. **Trạng thái online**: Hiển thị trạng thái online của người dùng trên bảng xếp hạng
6. **API hiệu suất cao**: Đảm bảo response time < 200ms cho các endpoint leaderboard

### Phạm vi

- **Trong phạm vi**: EXP calculation, streak tracking, eligibility checking, ranking engine, online status, API endpoints, migration script
- **Ngoài phạm vi**: UI/UX changes, notification system, gamification features beyond EXP/streak, social features

## Architecture

### Kiến trúc tổng quan

Hệ thống được thiết kế theo kiến trúc layered với các thành phần chính:

```
┌─────────────────────────────────────────────────────────────┐
│                     API Layer                                │
│  (StudyRoomController - REST endpoints)                     │
└────────────────────┬────────────────────────────────────────┘
                     │
┌────────────────────┴────────────────────────────────────────┐
│                  Service Layer                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ EXP          │  │ Streak       │  │ Eligibility  │     │
│  │ Calculator   │  │ Tracker      │  │ Checker      │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ Ranking      │  │ Online       │  │ Migration    │     │
│  │ Engine       │  │ Status Mgr   │  │ Service      │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└────────────────────┬────────────────────────────────────────┘
                     │
┌────────────────────┴────────────────────────────────────────┐
│                  Data Layer                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ PostgreSQL   │  │ Redis        │  │ Prisma ORM   │     │
│  │ (Primary DB) │  │ (Cache)      │  │              │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
```

### Luồng dữ liệu chính

#### 1. Study Session Completion Flow

```
StudySession ends
    ↓
StudyRoomService.completeActiveStudySession()
    ↓
┌─────────────────────────────────────────────────┐
│ Transaction Begin                                │
│  1. Calculate EXP (1 point/minute)              │
│  2. Update StudyStat (total_minutes, sessions)  │
│  3. Update DailyStreak (if applicable)          │
│  4. Recalculate rankings                        │
│ Transaction Commit                               │
└─────────────────────────────────────────────────┘
    ↓
Cache invalidation (if needed)
    ↓
WebSocket notification (optional)
```

#### 2. Leaderboard Query Flow

```
GET /study-rooms/leaderboard/weekly
    ↓
Check eligibility criteria
    ↓
Query StudyStat + DailyStreak + Profile
    ↓
Calculate weekly EXP from Redis/DB
    ↓
Fetch online status from Redis
    ↓
Return sorted results with pagination
```

### Cơ chế caching

- **Redis Keys**:
  - `leaderboard:weekly:{week_start}`: Weekly leaderboard cache (TTL: 5 minutes)
  - `leaderboard:total`: Total leaderboard cache (TTL: 10 minutes)
  - `online:users`: Set of currently online user IDs
  - `weekly:exp:{account_id}:{week_start}`: Individual weekly EXP

- **Cache Invalidation**:
  - Invalidate on study session completion
  - Invalidate on week boundary (Monday 00:00:00)
  - Automatic TTL expiration

## Components and Interfaces

### 1. EXP Calculator Module

**Trách nhiệm**: Tính toán và cập nhật điểm EXP dựa trên thời gian học

**Interface**:
```typescript
interface IExpCalculator {
  calculateExp(durationMinutes: number): number;
  awardExp(accountId: number, exp: number, sessionId: number): Promise<void>;
  getWeeklyExp(accountId: number, weekStart: Date): Promise<number>;
}
```

**Implementation Details**:
- Formula: `EXP = Math.floor(durationMinutes)` (1 EXP per minute)
- Minimum session: 1 minute (< 1 minute = 0 EXP)
- Store transaction log for audit trail
- Update StudyStat.total_minutes atomically

### 2. Streak Tracker Module

**Trách nhiệm**: Theo dõi và cập nhật chuỗi ngày học liên tiếp

**Interface**:
```typescript
interface IStreakTracker {
  updateStreak(accountId: number, studyDate: Date): Promise<StreakInfo>;
  getCurrentStreak(accountId: number): Promise<number>;
  getLongestStreak(accountId: number): Promise<number>;
}

interface StreakInfo {
  currentStreak: number;
  longestStreak: number;
  lastStudyDate: Date;
}
```

**Implementation Details**:
- Use user's timezone for date calculation
- Increment streak if study on consecutive days
- Reset to 1 if gap > 1 day
- Update longest_streak if current exceeds it
- Store in DailyStreak table

**Streak Logic**:
```typescript
function calculateStreak(lastStudyDate: Date, currentDate: Date, currentStreak: number): number {
  const daysDiff = Math.floor((currentDate.getTime() - lastStudyDate.getTime()) / (1000 * 60 * 60 * 24));
  
  if (daysDiff === 0) {
    // Same day - no change
    return currentStreak;
  } else if (daysDiff === 1) {
    // Consecutive day - increment
    return currentStreak + 1;
  } else {
    // Gap > 1 day - reset
    return 1;
  }
}
```

### 3. Eligibility Checker Module

**Trách nhiệm**: Kiểm tra điều kiện tham gia bảng xếp hạng

**Interface**:
```typescript
interface IEligibilityChecker {
  checkEligibility(accountId: number): Promise<EligibilityStatus>;
  isEligible(accountId: number): Promise<boolean>;
}

interface EligibilityStatus {
  eligible: boolean;
  surveyCompleted: boolean;
  goalInputCompleted: boolean;
  missingRequirements: string[];
}
```

**Implementation Details**:
- Check survey completion: Query SurveyResponse for input surveys
- Check goal input: Query CertificateEnrollment for target_score
- Cache eligibility status in Redis (TTL: 1 hour)
- Invalidate cache on survey/goal completion

**Eligibility Criteria**:
1. **Survey Completion**: User must have completed at least one input survey (type='input')
2. **Goal Input**: User must have set target_score in CertificateEnrollment

### 4. Ranking Engine Module

**Trách nhiệm**: Tính toán và cập nhật thứ hạng

**Interface**:
```typescript
interface IRankingEngine {
  calculateWeeklyRanking(weekStart: Date): Promise<RankingEntry[]>;
  calculateTotalRanking(): Promise<RankingEntry[]>;
  getUserRank(accountId: number, type: 'weekly' | 'total'): Promise<number | null>;
}

interface RankingEntry {
  rank: number;
  accountId: number;
  score: number;
  fullName: string;
  avatarUrl: string | null;
  currentStreak: number;
  onlineStatus: boolean;
}
```

**Implementation Details**:
- **Weekly Ranking**: Based on EXP earned in current week (Monday-Sunday)
- **Total Ranking**: Based on StudyStat.total_minutes
- Handle tied ranks: Same score = same rank, skip subsequent numbers
- Update rankings after each session completion
- Store in Leaderboard table for quick access

**Ranking Algorithm**:
```typescript
function assignRanks(entries: { accountId: number; score: number }[]): RankingEntry[] {
  const sorted = entries.sort((a, b) => b.score - a.score);
  let currentRank = 1;
  let previousScore = -1;
  let skipCount = 0;
  
  return sorted.map((entry, index) => {
    if (entry.score !== previousScore) {
      currentRank = index + 1;
      skipCount = 0;
    } else {
      skipCount++;
    }
    previousScore = entry.score;
    
    return {
      ...entry,
      rank: currentRank
    };
  });
}
```

### 5. Online Status Manager Module

**Trách nhiệm**: Quản lý trạng thái online của người dùng

**Interface**:
```typescript
interface IOnlineStatusManager {
  setOnline(accountId: number): Promise<void>;
  setOffline(accountId: number): Promise<void>;
  isOnline(accountId: number): Promise<boolean>;
  getOnlineUsers(accountIds: number[]): Promise<Set<number>>;
}
```

**Implementation Details**:
- Use Redis Set for online users: `online:users`
- Mark online when user joins study room
- Mark offline when user leaves or disconnects
- Use WebSocket heartbeat for presence detection
- Update within 5 seconds of status change

### 6. Migration Service

**Trách nhiệm**: Migrate dữ liệu hiện có sang hệ thống mới

**Interface**:
```typescript
interface IMigrationService {
  migrateStudySessions(): Promise<MigrationResult>;
  calculateHistoricalExp(): Promise<void>;
  populateStreaks(): Promise<void>;
  initializeRankings(): Promise<void>;
}

interface MigrationResult {
  totalSessions: number;
  processedSessions: number;
  failedSessions: number;
  duration: number;
}
```

**Implementation Details**:
- Process all StudySession records with ended_at not null
- Calculate EXP retroactively: `EXP = duration_minutes`
- Update StudyStat for each user
- Calculate streaks from historical study dates
- Initialize Leaderboard table
- Run in batches of 1000 sessions
- Target: Complete in < 5 minutes for 10,000 sessions

## Data Models

### Existing Tables (No Changes)

#### StudySession
```prisma
model StudySession {
  id               Int      @id @default(autoincrement())
  account_id       Int
  room_id          Int?
  started_at       DateTime @db.Timestamptz(6)
  ended_at         DateTime? @db.Timestamptz(6)
  duration_minutes Int?
  
  account          Account  @relation(fields: [account_id], references: [account_id])
  room             Room?    @relation(fields: [room_id], references: [room_id], onDelete: SetNull)
}
```

### Updated Tables

#### StudyStat (Already exists - no schema changes needed)
```prisma
model StudyStat {
  account_id     Int   @id
  total_minutes  Int   @default(0)
  total_sessions Int   @default(0)
  updated_at     DateTime @default(now()) @db.Timestamptz(6)
  
  account        Account @relation(fields: [account_id], references: [account_id])
}
```

**Usage**: 
- `total_minutes`: Cumulative study time (used for total ranking)
- `total_sessions`: Total number of completed sessions
- Updated after each session completion

#### DailyStreak (Already exists - no schema changes needed)
```prisma
model DailyStreak {
  account_id     Int   @id
  current_streak Int   @default(0)
  longest_streak Int   @default(0)
  last_study_date DateTime? @db.Date
  
  account        Account @relation(fields: [account_id], references: [account_id])
}
```

**Usage**:
- `current_streak`: Current consecutive days streak
- `longest_streak`: All-time longest streak
- `last_study_date`: Last date user studied (in user's timezone)

#### Leaderboard (Already exists - will be repurposed)
```prisma
model Leaderboard {
  account_id Int   @id
  score      Int?
  rank       Int?
  updated_at DateTime @default(now()) @db.Timestamptz(6)
  
  account    Account @relation(fields: [account_id], references: [account_id])
}
```

**New Usage**:
- `score`: Will store total_minutes (for total ranking)
- `rank`: Computed rank based on total_minutes
- Updated after each session completion
- Used for quick rank lookups

### New Tables (If needed for weekly tracking)

#### WeeklyExp (Optional - can use Redis instead)
```prisma
model WeeklyExp {
  id          Int      @id @default(autoincrement())
  account_id  Int
  week_start  DateTime @db.Date
  exp_points  Int      @default(0)
  updated_at  DateTime @default(now()) @db.Timestamptz(6)
  
  account     Account  @relation(fields: [account_id], references: [account_id])
  
  @@unique([account_id, week_start])
  @@index([week_start, exp_points])
}
```

**Decision**: Use Redis for weekly EXP tracking instead of database table for better performance.

### Redis Data Structures

```typescript
// Weekly EXP tracking
Key: `weekly:exp:{account_id}:{week_start_iso}`
Type: String
Value: number (EXP points)
TTL: 8 days (1 week + 1 day buffer)

// Weekly leaderboard cache
Key: `leaderboard:weekly:{week_start_iso}`
Type: String (JSON)
Value: RankingEntry[]
TTL: 5 minutes

// Total leaderboard cache
Key: `leaderboard:total`
Type: String (JSON)
Value: RankingEntry[]
TTL: 10 minutes

// Online users
Key: `online:users`
Type: Set
Members: account_id (string)
TTL: None (managed by presence system)

// User eligibility cache
Key: `eligibility:{account_id}`
Type: String (JSON)
Value: EligibilityStatus
TTL: 1 hour
```

## API Endpoints

### 1. GET /study-rooms/leaderboard/weekly

**Description**: Lấy bảng xếp hạng theo tuần

**Query Parameters**:
- `limit` (optional, default: 10, max: 100): Số lượng users
- `offset` (optional, default: 0): Pagination offset

**Response**:
```typescript
{
  items: [
    {
      rank: number;
      accountId: number;
      fullName: string;
      avatarUrl: string | null;
      weeklyExp: number;
      currentStreak: number;
      onlineStatus: boolean;
    }
  ];
  meta: {
    limit: number;
    offset: number;
    total: number;
    weekStart: string; // ISO date
    weekEnd: string;   // ISO date
  };
}
```

**Performance Target**: < 200ms for limit ≤ 100

### 2. GET /study-rooms/leaderboard/total

**Description**: Lấy bảng xếp hạng tổng

**Query Parameters**:
- `limit` (optional, default: 10, max: 100): Số lượng users
- `offset` (optional, default: 0): Pagination offset

**Response**:
```typescript
{
  items: [
    {
      rank: number;
      accountId: number;
      fullName: string;
      avatarUrl: string | null;
      totalMinutes: number;
      totalSessions: number;
      currentStreak: number;
      onlineStatus: boolean;
    }
  ];
  meta: {
    limit: number;
    offset: number;
    total: number;
  };
}
```

**Performance Target**: < 200ms for limit ≤ 100

### 3. GET /study-rooms/me/stats

**Description**: Lấy thống kê cá nhân

**Response**:
```typescript
{
  totals: {
    totalMinutes: number;
    totalSessions: number;
    updatedAt: string | null;
  };
  streak: {
    current: number;
    longest: number;
    lastStudyDate: string | null;
  };
  leaderboard: {
    weeklyExp: number;
    weeklyRank: number | null;
    totalRank: number | null;
  };
  eligibility: {
    eligible: boolean;
    surveyCompleted: boolean;
    goalInputCompleted: boolean;
  };
  recentSessions: [
    {
      id: number;
      roomId: number | null;
      roomTitle: string | null;
      startedAt: string;
      endedAt: string | null;
      durationMinutes: number | null;
    }
  ];
}
```

**Performance Target**: < 100ms

## Error Handling

### Error Types

1. **Validation Errors** (400 Bad Request)
   - Invalid query parameters
   - Invalid date formats
   - Out of range values

2. **Authentication Errors** (401 Unauthorized)
   - Missing or invalid JWT token
   - Expired session

3. **Authorization Errors** (403 Forbidden)
   - User not eligible for leaderboard
   - Insufficient permissions

4. **Not Found Errors** (404 Not Found)
   - User not found
   - Study session not found

5. **Server Errors** (500 Internal Server Error)
   - Database connection failures
   - Redis connection failures
   - Unexpected exceptions

### Error Response Format

```typescript
{
  statusCode: number;
  message: string;
  error: string;
  timestamp: string;
  path: string;
}
```

### Error Handling Strategy

1. **Database Errors**:
   - Wrap all DB operations in try-catch
   - Log errors with context
   - Return generic error message to client
   - Retry transient errors (connection timeout)

2. **Redis Errors**:
   - Graceful degradation: Fall back to database
   - Log cache misses
   - Continue operation without cache

3. **Calculation Errors**:
   - Validate input data before calculation
   - Handle edge cases (negative values, null values)
   - Log anomalies for investigation

4. **Transaction Failures**:
   - Automatic rollback on error
   - Log transaction details
   - Retry once for deadlock errors

## Testing Strategy

### Unit Tests

**Target Coverage**: 80%+

**Test Cases**:

1. **EXP Calculator**:
   - Calculate EXP for various durations (1 min, 60 min, 120 min)
   - Handle edge cases (0 min, negative values)
   - Verify rounding behavior

2. **Streak Tracker**:
   - Increment streak on consecutive days
   - Reset streak after gap
   - Update longest streak correctly
   - Handle timezone conversions

3. **Eligibility Checker**:
   - Check survey completion status
   - Check goal input status
   - Cache eligibility results
   - Invalidate cache on updates

4. **Ranking Engine**:
   - Assign ranks correctly
   - Handle tied scores
   - Sort by score descending
   - Pagination works correctly

5. **Online Status Manager**:
   - Set/unset online status
   - Batch check online users
   - Handle Redis failures gracefully

### Integration Tests

**Test Cases**:

1. **Study Session Completion Flow**:
   - Complete session → EXP awarded → Stats updated → Streak updated → Rankings recalculated
   - Verify transaction atomicity
   - Check cache invalidation

2. **Leaderboard API**:
   - Query weekly leaderboard with pagination
   - Query total leaderboard with pagination
   - Verify eligibility filtering
   - Check online status inclusion

3. **Personal Stats API**:
   - Fetch user stats
   - Verify rank calculation
   - Check eligibility status
   - Verify recent sessions

4. **Migration Script**:
   - Migrate historical sessions
   - Calculate retroactive EXP
   - Populate streaks correctly
   - Initialize rankings

### Performance Tests

**Test Scenarios**:

1. **Leaderboard Query Performance**:
   - Measure response time for 10, 50, 100 users
   - Test with 1K, 10K, 100K total users in DB
   - Verify < 200ms target

2. **Session Completion Performance**:
   - Measure time to complete session and update all data
   - Test concurrent session completions
   - Verify < 1 second target

3. **Cache Performance**:
   - Measure cache hit rate
   - Test cache invalidation speed
   - Verify Redis failover behavior

4. **Migration Performance**:
   - Test with 1K, 10K, 100K sessions
   - Measure total migration time
   - Verify < 5 minutes for 10K sessions

### Test Data

**Setup**:
- Create test users with various study patterns
- Generate historical study sessions
- Set up survey and goal input data
- Populate Redis with test data

**Cleanup**:
- Clear test data after each test
- Reset database sequences
- Flush Redis test keys

## Implementation Plan

### Phase 1: Core Infrastructure (Week 1)

1. Update database schema (if needed)
2. Implement EXP Calculator module
3. Implement Streak Tracker module
4. Add unit tests for core modules

### Phase 2: Ranking System (Week 2)

1. Implement Eligibility Checker module
2. Implement Ranking Engine module
3. Implement Online Status Manager module
4. Add Redis caching layer
5. Add integration tests

### Phase 3: API Development (Week 3)

1. Implement leaderboard endpoints
2. Implement personal stats endpoint
3. Update study session completion logic
4. Add API tests

### Phase 4: Migration & Testing (Week 4)

1. Implement migration script
2. Run migration on staging data
3. Performance testing and optimization
4. Bug fixes and refinements

### Phase 5: Deployment (Week 5)

1. Deploy to staging environment
2. User acceptance testing
3. Deploy to production
4. Monitor and adjust

## Monitoring and Observability

### Metrics to Track

1. **Performance Metrics**:
   - API response times (p50, p95, p99)
   - Database query times
   - Redis operation times
   - Cache hit rates

2. **Business Metrics**:
   - Total active users on leaderboard
   - Average study time per user
   - Streak distribution
   - Weekly vs total ranking correlation

3. **Error Metrics**:
   - Error rate by endpoint
   - Failed transactions
   - Cache failures
   - Migration errors

### Logging Strategy

1. **Structured Logging**:
   - Use JSON format
   - Include request ID, user ID, timestamp
   - Log level: DEBUG, INFO, WARN, ERROR

2. **Log Events**:
   - Session completion
   - EXP awarded
   - Streak updated
   - Ranking recalculated
   - Cache hit/miss
   - Errors and exceptions

### Alerts

1. **Critical Alerts**:
   - API response time > 500ms
   - Error rate > 5%
   - Database connection failures
   - Redis connection failures

2. **Warning Alerts**:
   - Cache hit rate < 80%
   - Slow queries > 1 second
   - High memory usage

## Security Considerations

1. **Authentication**:
   - All endpoints require valid JWT token
   - Verify user identity before returning personal stats

2. **Authorization**:
   - Users can only access their own stats
   - Leaderboard is public for eligible users

3. **Rate Limiting**:
   - Limit leaderboard queries to 60 requests/minute per user
   - Limit stats queries to 120 requests/minute per user

4. **Data Privacy**:
   - Only show eligible users on leaderboard
   - Mask sensitive information
   - Comply with GDPR/data protection regulations

5. **Input Validation**:
   - Validate all query parameters
   - Sanitize user inputs
   - Prevent SQL injection

## Future Enhancements

1. **Real-time Updates**:
   - WebSocket notifications for rank changes
   - Live leaderboard updates

2. **Advanced Analytics**:
   - Study patterns analysis
   - Streak predictions
   - Personalized recommendations

3. **Gamification**:
   - Achievements and badges
   - Milestone rewards
   - Challenges and competitions

4. **Social Features**:
   - Friend leaderboards
   - Study groups
   - Collaborative goals

5. **Performance Optimizations**:
   - Materialized views for rankings
   - Read replicas for leaderboard queries
   - CDN caching for static leaderboard data

---

**Document Version**: 1.0  
**Last Updated**: 2024-01-XX  
**Author**: AI Assistant  
**Status**: Draft

# Implementation Plan: Leaderboard System Backend

## Overview

Hệ thống Leaderboard Backend sẽ được xây dựng trên nền tảng NestJS hiện có, tích hợp với PostgreSQL (qua Prisma ORM) và Redis để quản lý điểm EXP, streak tracking, eligibility checking, và ranking system. Implementation sẽ được chia thành các module độc lập, dễ test và maintain, với focus vào performance và real-time updates.

**Tech Stack**: TypeScript, NestJS, Prisma ORM, PostgreSQL, Redis, Jest

**Key Principles**:
- Incremental implementation với validation sau mỗi bước
- Transaction-based updates để đảm bảo data consistency
- Caching strategy với Redis để optimize performance
- Comprehensive error handling và logging

## Tasks

- [x] 1. Setup database schema và Redis infrastructure
  - Verify existing tables (StudyStat, DailyStreak, Leaderboard) trong Prisma schema
  - Add indexes cho performance optimization (StudyStat.total_minutes, DailyStreak.last_study_date)
  - Setup Redis connection trong study-room module
  - Create Redis key constants và helper functions
  - _Requirements: 1.3, 2.5, 4.6, 5.5, 6.5, 10.2, 10.3_

- [x] 2. Implement EXP Calculator Module
  - [x] 2.1 Create ExpCalculatorService với core calculation logic
    - Implement `calculateExp(durationMinutes: number): number` method
    - Implement `awardExp(accountId, exp, sessionId)` method với transaction support
    - Add validation cho minimum session duration (< 1 minute = 0 EXP)
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_
  
  - [ ]* 2.2 Write unit tests for ExpCalculatorService
    - Test EXP calculation với various durations (0, 1, 30, 60, 120 minutes)
    - Test edge cases (negative values, null values, fractional minutes)
    - Test transaction rollback on errors
    - _Requirements: 1.1, 1.2, 1.5_
  
  - [x] 2.3 Implement weekly EXP tracking với Redis
    - Create `getWeeklyExp(accountId, weekStart)` method
    - Implement Redis storage với key pattern `weekly:exp:{account_id}:{week_start_iso}`
    - Add TTL management (8 days)
    - _Requirements: 4.1, 4.2, 4.6_

- [x] 3. Implement Streak Tracker Module
  - [x] 3.1 Create StreakTrackerService với streak calculation logic
    - Implement `updateStreak(accountId, studyDate)` method
    - Implement streak calculation algorithm (consecutive days, gap detection, reset logic)
    - Handle timezone conversion cho accurate date comparison
    - Update DailyStreak table (current_streak, longest_streak, last_study_date)
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_
  
  - [ ]* 3.2 Write unit tests for StreakTrackerService
    - Test streak increment on consecutive days
    - Test streak reset after gap > 1 day
    - Test longest_streak update logic
    - Test same-day study (no change to streak)
    - Test timezone edge cases
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.6_
  
  - [x] 3.3 Implement streak query methods
    - Create `getCurrentStreak(accountId)` method
    - Create `getLongestStreak(accountId)` method
    - Add caching layer với Redis
    - _Requirements: 2.1, 2.4, 2.5_

- [ ] 4. Checkpoint - Verify core calculation modules
  - Run all unit tests for EXP Calculator and Streak Tracker
  - Verify database updates work correctly
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Implement Eligibility Checker Module
  - [x] 5.1 Create EligibilityCheckerService
    - Implement `checkEligibility(accountId)` method
    - Query SurveyResponse table for input survey completion
    - Query CertificateEnrollment table for target_score (goal input)
    - Return EligibilityStatus object với detailed breakdown
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 12.1, 12.2, 12.3, 12.4, 12.5_
  
  - [x] 5.2 Implement eligibility caching với Redis
    - Create `isEligible(accountId)` method với cache-first strategy
    - Store eligibility status in Redis với key `eligibility:{account_id}`
    - Set TTL to 1 hour
    - Implement cache invalidation on survey/goal completion
    - _Requirements: 3.3, 3.4, 12.5_
  
  - [ ]* 5.3 Write unit tests for EligibilityCheckerService
    - Test survey completion check
    - Test goal input check
    - Test combined eligibility logic
    - Test cache hit/miss scenarios
    - Test cache invalidation
    - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [x] 6. Implement Ranking Engine Module
  - [x] 6.1 Create RankingEngineService với ranking algorithms
    - Implement `calculateWeeklyRanking(weekStart)` method
    - Implement `calculateTotalRanking()` method
    - Implement rank assignment algorithm với tied rank handling
    - Handle same score = same rank, skip subsequent numbers
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 5.1, 5.2, 5.3, 5.4_
  
  - [x] 6.2 Implement ranking persistence và caching
    - Update Leaderboard table với total ranking data
    - Store weekly rankings in Redis với key `leaderboard:weekly:{week_start_iso}`
    - Store total rankings in Redis với key `leaderboard:total`
    - Set appropriate TTLs (5 minutes for weekly, 10 minutes for total)
    - _Requirements: 4.6, 5.5_
  
  - [x] 6.3 Implement user rank lookup methods
    - Create `getUserRank(accountId, type)` method for quick rank queries
    - Support both 'weekly' and 'total' ranking types
    - Return null for ineligible users
    - _Requirements: 4.4, 5.2, 5.3_
  
  - [ ]* 6.4 Write unit tests for RankingEngineService
    - Test rank assignment với various score distributions
    - Test tied rank handling
    - Test sorting order (descending by score)
    - Test eligibility filtering
    - Test cache operations
    - _Requirements: 4.3, 4.4, 4.5, 5.2, 5.3_

- [x] 7. Implement Online Status Manager Module
  - [x] 7.1 Create OnlineStatusManagerService
    - Implement `setOnline(accountId)` method
    - Implement `setOffline(accountId)` method
    - Use Redis Set với key `online:users` for storage
    - Implement `isOnline(accountId)` method
    - Implement `getOnlineUsers(accountIds[])` batch query method
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_
  
  - [x] 7.2 Integrate online status với study room gateway
    - Call `setOnline()` when user joins study room
    - Call `setOffline()` when user leaves or disconnects
    - Update within 5 seconds of status change
    - _Requirements: 6.1, 6.2, 6.3_
  
  - [ ]* 7.3 Write unit tests for OnlineStatusManagerService
    - Test set online/offline operations
    - Test batch online status queries
    - Test Redis Set operations
    - Test graceful handling of Redis failures
    - _Requirements: 6.1, 6.2, 6.4_

- [ ] 8. Checkpoint - Verify all service modules
  - Run integration tests for all services
  - Verify Redis operations work correctly
  - Test eligibility filtering across modules
  - Ensure all tests pass, ask the user if questions arise.

- [x] 9. Implement Leaderboard API Endpoints
  - [x] 9.1 Create LeaderboardController với weekly ranking endpoint
    - Implement `GET /study-rooms/leaderboard/weekly` endpoint
    - Add query parameters: limit (default: 10, max: 100), offset (default: 0)
    - Query eligible users only (via EligibilityChecker)
    - Join StudyStat, DailyStreak, Profile tables
    - Fetch weekly EXP from Redis
    - Fetch online status from OnlineStatusManager
    - Return sorted results với pagination metadata
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6_
  
  - [x] 9.2 Implement total ranking endpoint
    - Implement `GET /study-rooms/leaderboard/total` endpoint
    - Add query parameters: limit, offset
    - Query eligible users sorted by total_minutes
    - Include total_sessions, current_streak, online_status
    - Return paginated results với metadata
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6_
  
  - [x] 9.3 Implement personal stats endpoint
    - Implement `GET /study-rooms/me/stats` endpoint
    - Fetch totals from StudyStat table
    - Fetch streak data from DailyStreak table
    - Calculate weekly EXP and ranks
    - Check eligibility status
    - Fetch recent sessions (last 5-10 sessions)
    - Return comprehensive stats object
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_
  
  - [x] 9.4 Add authentication và authorization guards
    - Apply JWT authentication guard to all endpoints
    - Verify user identity for personal stats endpoint
    - Add rate limiting (60 req/min for leaderboard, 120 req/min for stats)
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 9.1, 9.2, 9.3, 9.4, 9.5_
  
  - [ ]* 9.5 Write integration tests for API endpoints
    - Test weekly leaderboard endpoint với various pagination scenarios
    - Test total leaderboard endpoint
    - Test personal stats endpoint
    - Test eligibility filtering
    - Test authentication and authorization
    - Test error responses (400, 401, 404, 500)
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 9.1, 9.2, 9.3, 9.4, 9.5_

- [x] 10. Integrate leaderboard updates với Study Session completion
  - [x] 10.1 Update StudyRoomService.completeActiveStudySession()
    - Wrap all updates in database transaction
    - Calculate EXP using ExpCalculatorService
    - Update StudyStat (total_minutes, total_sessions)
    - Update DailyStreak using StreakTrackerService
    - Recalculate weekly ranking using RankingEngineService
    - Recalculate total ranking using RankingEngineService
    - Invalidate relevant Redis caches
    - Complete all updates within 1 second
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6_
  
  - [x] 10.2 Add error handling và rollback logic
    - Implement try-catch với transaction rollback
    - Log errors với context (accountId, sessionId)
    - Return appropriate error responses
    - Retry transient errors (connection timeout, deadlock)
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6_
  
  - [ ]* 10.3 Write integration tests for session completion flow
    - Test complete flow: session end → EXP → stats → streak → rankings
    - Test transaction atomicity (all or nothing)
    - Test cache invalidation
    - Test error scenarios và rollback
    - Test concurrent session completions
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6_

- [ ] 11. Checkpoint - Verify end-to-end flow
  - Test complete user journey: join room → study → leave → check stats → view leaderboard
  - Verify all data updates correctly
  - Check performance targets (< 200ms for leaderboard, < 1s for session completion)
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 12. Implement Migration Script
  - [ ] 12.1 Create MigrationService for historical data
    - Create `migrateStudySessions()` method
    - Query all StudySession records với ended_at not null
    - Process in batches of 1000 sessions
    - Calculate EXP retroactively: `EXP = duration_minutes`
    - Update StudyStat for each user (aggregate total_minutes, total_sessions)
    - _Requirements: 11.1, 11.2, 11.3, 11.6_
  
  - [ ] 12.2 Implement streak calculation from historical data
    - Create `populateStreaks()` method
    - Group study sessions by user and date
    - Calculate streaks based on consecutive study dates
    - Populate DailyStreak table với current_streak, longest_streak, last_study_date
    - _Requirements: 11.4_
  
  - [ ] 12.3 Implement initial ranking calculation
    - Create `initializeRankings()` method
    - Calculate total rankings based on StudyStat.total_minutes
    - Populate Leaderboard table
    - Calculate weekly rankings for current week
    - Store in Redis
    - _Requirements: 11.5_
  
  - [ ] 12.4 Add migration CLI command và progress tracking
    - Create NestJS CLI command for migration
    - Add progress logging (processed X of Y sessions)
    - Add error tracking và reporting
    - Implement resume capability for failed migrations
    - Target: Complete in < 5 minutes for 10,000 sessions
    - _Requirements: 11.1, 11.6_
  
  - [ ]* 12.5 Write tests for migration script
    - Test EXP calculation from historical sessions
    - Test streak calculation logic
    - Test ranking initialization
    - Test batch processing
    - Test error handling và resume capability
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 11.6_

- [ ] 13. Add comprehensive error handling và logging
  - [ ] 13.1 Implement structured logging
    - Add Winston logger configuration
    - Log all key events: session completion, EXP awarded, streak updated, rankings recalculated
    - Include context: requestId, userId, timestamp
    - Use appropriate log levels (DEBUG, INFO, WARN, ERROR)
    - _Requirements: All requirements (cross-cutting concern)_
  
  - [ ] 13.2 Implement error response formatting
    - Create custom exception filters
    - Return consistent error format: statusCode, message, error, timestamp, path
    - Handle validation errors (400)
    - Handle authentication errors (401)
    - Handle authorization errors (403)
    - Handle not found errors (404)
    - Handle server errors (500)
    - _Requirements: All requirements (cross-cutting concern)_
  
  - [ ] 13.3 Add Redis fallback logic
    - Implement graceful degradation when Redis is unavailable
    - Fall back to database queries for leaderboard
    - Log cache misses và failures
    - Continue operation without cache
    - _Requirements: 4.6, 5.5, 6.3, 6.4, 7.4_

- [ ] 14. Performance optimization và monitoring
  - [ ] 14.1 Add database indexes
    - Create index on StudyStat(total_minutes DESC) for total ranking queries
    - Create index on DailyStreak(last_study_date) for streak queries
    - Create composite index on StudySession(account_id, ended_at) for migration
    - Verify query performance với EXPLAIN ANALYZE
    - _Requirements: 7.6, 8.6, 9.5, 11.6_
  
  - [ ] 14.2 Implement caching strategy
    - Cache leaderboard results in Redis với appropriate TTLs
    - Implement cache warming for popular queries
    - Add cache hit/miss metrics
    - Optimize cache key structure
    - _Requirements: 7.6, 8.6, 9.5_
  
  - [ ] 14.3 Add performance monitoring
    - Add response time tracking for all endpoints
    - Track database query times
    - Track Redis operation times
    - Add alerts for slow queries (> 1 second)
    - Add alerts for high error rates (> 5%)
    - _Requirements: 7.6, 8.6, 9.5, 10.6_

- [ ] 15. Final checkpoint và documentation
  - [ ] 15.1 Run full test suite
    - Execute all unit tests
    - Execute all integration tests
    - Verify test coverage > 80%
    - Fix any failing tests
    - _Requirements: All requirements_
  
  - [ ] 15.2 Update API documentation
    - Document all new endpoints in API_USAGE.md
    - Add request/response examples
    - Document error responses
    - Add authentication requirements
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 9.1, 9.2, 9.3, 9.4, 9.5_
  
  - [ ] 15.3 Create deployment checklist
    - Document environment variables needed
    - Document Redis configuration
    - Document database migration steps
    - Document rollback procedures
    - Create monitoring dashboard setup guide
    - _Requirements: All requirements_
  
  - [ ] 15.4 Final verification
    - Verify all acceptance criteria met
    - Test on staging environment
    - Performance test với realistic data volumes
    - Security review (authentication, authorization, rate limiting)
    - Ensure all tests pass, ask the user if questions arise.

## Notes

- **Tasks marked with `*` are optional** và có thể skip để ship MVP nhanh hơn
- **Each task references specific requirements** để đảm bảo traceability
- **Checkpoints ensure incremental validation** - stop và verify trước khi tiếp tục
- **Transaction-based updates** đảm bảo data consistency
- **Caching strategy** với Redis để achieve performance targets (< 200ms)
- **Comprehensive error handling** để đảm bảo system reliability
- **Migration script** để preserve historical data và không làm mất dữ liệu người dùng

## Implementation Order Rationale

1. **Phase 1 (Tasks 1-4)**: Core calculation modules - foundation cho tất cả features
2. **Phase 2 (Tasks 5-8)**: Supporting modules - eligibility, ranking, online status
3. **Phase 3 (Tasks 9-11)**: API layer và integration - expose functionality to frontend
4. **Phase 4 (Tasks 12)**: Migration - handle historical data
5. **Phase 5 (Tasks 13-15)**: Polish - error handling, optimization, documentation

## Performance Targets

- **Leaderboard queries**: < 200ms for limit ≤ 100 users
- **Personal stats**: < 100ms
- **Session completion**: < 1 second for all updates
- **Migration**: < 5 minutes for 10,000 sessions
- **Cache hit rate**: > 80%

## Testing Strategy

- **Unit tests**: 80%+ coverage cho all services
- **Integration tests**: End-to-end flows và API endpoints
- **Performance tests**: Verify response time targets
- **Load tests**: Concurrent session completions và leaderboard queries

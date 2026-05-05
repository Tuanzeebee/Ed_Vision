# Implementation Plan: Scoring System Revamp

## Overview

Triển khai hệ thống điểm số mới cho TOEIC: chuyển EXP từ dựa trên thời gian sang dựa trên câu hỏi, đổi tên "Điểm Dự Phòng" → "Điểm Ôn Tập", thêm "Điểm Gốc", cập nhật leaderboard, thêm API `/certificates/me/scores`, và cung cấp migration script.

Stack: NestJS (TypeScript) backend tại `ed_vision_backend/`, React (TypeScript) frontend tại `Ed_Vision/`.

## Tasks

- [x] 1. Tạo Question-Based EXP Calculator Service
  - [x] 1.1 Tạo file `ed_vision_backend/src/study-room/services/question-exp-calculator.service.ts`
    - Implement `calculateExpForQuestion(difficultyScore: number | null): number` — trả về 5/7/10 EXP theo difficulty_score (0–0.3 → 5, 0.3–0.6 → 7, 0.6–1.0 → 10); null → default 0.5 → 7 EXP, log warning
    - Implement `calculateBonusExpForPart(toeicPart: number): number` — trả về bonus EXP theo part (Part 1/2: 20, Part 3/4: 30, Part 5/6: 35, Part 7: 50)
    - Implement `calculateSessionExp(questions: Array<{difficulty_score: number | null, is_correct: boolean}>, toeicPart: number): { questionExp: number; bonusExp: number; totalExp: number }` — tổng hợp EXP từ câu đúng + bonus
    - Implement `awardSessionExp(accountId: number, totalExp: number, sessionId: number, sessionDate?: Date, client?: PrismaTransactionClient): Promise<StudyStat>` — upsert StudyStat (total_minutes += totalExp, total_sessions += 1), lưu weekly EXP vào Redis
    - Inject `PrismaService` và `RedisService`; tái sử dụng `storeWeeklyExp` pattern từ `ExpCalculatorService` hiện tại
    - _Requirements: 6.1–6.6, 7.1–7.7, 8.1–8.5, 14.1–14.3, 19.1–19.5_

  - [ ]* 1.2 Viết unit tests cho QuestionExpCalculatorService
    - Test `calculateExpForQuestion`: boundary values (0.0, 0.3, 0.6, 1.0), null input → default 7 EXP
    - Test `calculateBonusExpForPart`: tất cả 7 parts
    - Test `calculateSessionExp`: mix đúng/sai, all correct, all wrong
    - _Requirements: 6.1–6.6, 7.1–7.7, 14.1–14.2_

  - [x] 1.3 Đăng ký `QuestionExpCalculatorService` vào `StudyRoomModule` (hoặc module phù hợp) và export
    - Thêm vào `providers` và `exports` trong module
    - _Requirements: 6.1, 8.1_

- [x] 2. Cập nhật ToeicPracticePartSession completion để tính EXP
  - [x] 2.1 Inject `QuestionExpCalculatorService` vào `ToeicPracticeSessionService`
    - Cập nhật constructor trong `toeic-practice-session.service.ts`
    - Cập nhật `CertificateModule` để import module chứa `QuestionExpCalculatorService`
    - _Requirements: 6.1, 8.1_

  - [x] 2.2 Mở rộng transaction trong `submitPartSession` để tính và lưu EXP
    - Sau khi tạo `ToeicPracticePartSession`, gọi `calculateSessionExp` với danh sách questions (kèm `difficulty_score` và `is_correct` của từng câu)
    - Gọi `awardSessionExp` bên trong cùng transaction (truyền `tx` client)
    - Lưu `exp_earned` vào `ToeicPracticePartSession` record (nếu field chưa có, thêm vào Prisma schema)
    - Invalidate Redis leaderboard cache sau khi transaction thành công
    - _Requirements: 6.1–6.6, 7.1–7.7, 8.1–8.5, 19.1–19.4_

  - [x] 2.3 Cập nhật query fetch questions trong `submitPartSession` để include `difficulty_score`
    - Đảm bảo `prisma.toeicPracticeQuestion.findMany` select `difficulty_score` cho từng question
    - Map kết quả grading (correctCount loop) để biết từng question đúng/sai kèm difficulty
    - _Requirements: 6.1–6.4, 14.1_

  - [ ]* 2.4 Viết integration test cho `submitPartSession` với EXP calculation
    - Test EXP được tính đúng và StudyStat được cập nhật sau submit
    - Test transaction rollback khi EXP calculation lỗi
    - _Requirements: 6.1–6.6, 8.1–8.5, 20.1–20.2_

- [x] 3. Xóa logic EXP dựa trên thời gian (Study Session)
  - [x] 3.1 Cập nhật `completeActiveStudySession` / `persistCompletedSession` trong `StudyRoomService`
    - Tìm tất cả nơi gọi `expCalculator.calculateExp(durationMinutes)` và `expCalculator.awardExp(...)` trong `study-room.service.ts`
    - Xóa hoặc comment out các lời gọi tính EXP từ duration
    - Giữ nguyên việc tạo/cập nhật `StudySession` record (chỉ xóa phần award EXP)
    - _Requirements: 9.1–9.4_

  - [x] 3.2 Cập nhật `leaderboard.constants.ts` — đánh dấu `EXP_PER_MINUTE` và `MIN_SESSION_DURATION_MINUTES` là deprecated
    - Thêm JSDoc `@deprecated` comment; giữ lại để không break code cũ
    - _Requirements: 9.1–9.2_

  - [ ]* 3.3 Viết unit test xác nhận StudySession completion không award EXP
    - Mock `expCalculator.awardExp` và assert nó không được gọi khi session kết thúc
    - _Requirements: 9.3_

- [x] 4. Cập nhật Leaderboard để dùng EXP mới
  - [x] 4.1 Cập nhật `RankingEngineService.calculateTotalRanking` để dùng `StudyStat.total_minutes` (đã là total EXP)
    - Xác nhận `getEligibleUsersWithStats` đang dùng `studyStat.total_minutes` — không cần thay đổi logic, chỉ cần đảm bảo không dùng `StudySession.duration_minutes`
    - Thêm comment rõ ràng: `total_minutes` field được repurpose thành `total_exp`
    - _Requirements: 11.1–11.5_

  - [x] 4.2 Cập nhật `RankingEngineService.calculateWeeklyRanking` để dùng EXP từ practice sessions
    - Weekly EXP đã được lưu vào Redis bởi `QuestionExpCalculatorService.awardSessionExp`
    - Xác nhận `expCalculator.getWeeklyExpBatch` vẫn đọc đúng key pattern `weekly:exp:{accountId}:{weekStart}`
    - Đảm bảo weekly EXP không còn bao gồm EXP từ StudySession (đã xóa ở task 3.1)
    - _Requirements: 10.1–10.5_

  - [x] 4.3 Thêm cron job reset weekly EXP counters mỗi thứ Hai 00:00
    - Tạo hoặc cập nhật cron service trong study-room module
    - Xóa tất cả Redis keys `weekly:exp:*:{previous_week_start}` vào đầu tuần mới
    - _Requirements: 10.3_

  - [ ]* 4.4 Viết unit tests cho ranking engine với question-based EXP
    - Test weekly ranking chỉ dùng EXP từ practice sessions
    - Test total ranking dùng `StudyStat.total_minutes`
    - Test tied ranks được xử lý đúng
    - _Requirements: 10.1–10.5, 11.1–11.5_

- [x] 5. Tạo API endpoint GET /certificates/me/scores
  - [x] 5.1 Tạo DTO `PersonalScoresResponseDto` trong `ed_vision_backend/src/student_be/certificate/dto/certificate.dto.ts`
    - Fields: `current_score`, `reserve_points`, `target_score`, `exam_score`, `total_exp`, `weekly_exp`, `exam_simulation_unlocked`, `progress_percent`, `remaining_points`
    - `progress_percent = min(100, (reserve_points / target_score) * 100)` hoặc 0 nếu target_score null
    - `remaining_points = max(0, target_score - reserve_points)` hoặc null nếu target_score null
    - `exam_simulation_unlocked = reserve_points >= target_score` (false nếu target_score null)
    - _Requirements: 12.1–12.6, 17.1–17.5_

  - [x] 5.2 Implement `getPersonalScores(accountId: number)` trong `CertificateEnrollmentService`
    - Query `CertificateEnrollment` (active TOEIC) để lấy `current_score`, `reserve_points`, `target_score`, `exam_score`
    - Query `StudyStat` để lấy `total_minutes` (= total_exp)
    - Lấy `weekly_exp` từ Redis qua `QuestionExpCalculatorService.getWeeklyExp(accountId, weekStart)`
    - Tính `progress_percent`, `remaining_points`, `exam_simulation_unlocked`
    - Đảm bảo response time < 100ms (dùng parallel queries với `Promise.all`)
    - _Requirements: 12.1–12.6, 17.1–17.5_

  - [x] 5.3 Thêm route `GET /student/certificate/me/scores` vào `CertificateEnrollmentController`
    - Dùng `@UseGuards(DevAuthGuard)` và `@Request() req: AuthenticatedRequest`
    - Gọi `this.service.getPersonalScores(req.user.account_id)`
    - _Requirements: 12.1, 12.6_

  - [ ]* 5.4 Viết unit tests cho getPersonalScores
    - Test response đầy đủ các fields
    - Test `progress_percent` = 0 khi target_score null
    - Test `exam_simulation_unlocked` = true khi reserve_points >= target_score
    - Test `progress_percent` capped tại 100
    - _Requirements: 12.1–12.6, 17.1–17.5_

- [ ] 6. Checkpoint — Backend
  - Đảm bảo tất cả tests pass. Kiểm tra `QuestionExpCalculatorService` được inject đúng. Kiểm tra endpoint `/student/certificate/me/scores` trả về đúng format. Hỏi user nếu có thắc mắc.

- [x] 7. Frontend — Đổi tên "Điểm Dự Phòng" → "Điểm Ôn Tập" và thêm "Điểm Gốc"
  - [x] 7.1 Cập nhật label trong `ToeicNodePracticePage.tsx`
    - Tìm text `"Điểm dự trữ"` (dòng ~3227) và đổi thành `"Điểm Ôn Tập"`
    - Tìm tất cả label liên quan đến reserve points và cập nhật terminology
    - _Requirements: 2.1, 2.5, 15.1–15.4_

  - [x] 7.2 Thêm hiển thị "Điểm Gốc" (current_score) trong UI
    - Trong phần summary/header của `ToeicNodePracticePage.tsx`, thêm display cho `current_score` với label "Điểm Gốc"
    - Fetch data từ endpoint `/student/certificate/me/scores` để lấy `current_score`
    - _Requirements: 1.4, 12.2_

  - [x] 7.3 Cập nhật `CertificateDetail.tsx` nếu có hiển thị reserve_points
    - Tìm và đổi tên bất kỳ label "Điểm Dự Phòng" nào thành "Điểm Ôn Tập"
    - _Requirements: 2.1, 2.5_

- [x] 8. Frontend — Cập nhật UI hiển thị progress đến target score
  - [x] 8.1 Cập nhật progress bar trong `ToeicNodePracticePage.tsx` để dùng `progress_percent` từ API
    - Thay vì tính `(reservePoints / unlockThreshold) * 100` ở client, dùng `progress_percent` từ `/student/certificate/me/scores`
    - Hiển thị `remaining_points` (số điểm còn cần tích lũy) bên dưới progress bar
    - _Requirements: 17.1–17.5_

  - [x] 8.2 Thêm visual indicator khi `exam_simulation_unlocked = true`
    - Hiển thị badge/icon "Đã mở khóa thi thử" khi `exam_simulation_unlocked` là true
    - _Requirements: 4.4_

  - [ ]* 8.3 Viết unit/component tests cho progress display
    - Test progress bar hiển thị đúng % khi có target_score
    - Test progress = 0 khi target_score null
    - Test progress capped tại 100%
    - _Requirements: 17.1–17.5_

- [ ] 9. Migration Script — Recalculate EXP từ lịch sử ToeicPracticePartSession
  - [ ] 9.1 Tạo file `ed_vision_backend/scripts/migrate-exp-to-question-based.ts`
    - Fetch tất cả `ToeicPracticePartSession` records (batch 500 records mỗi lần để tránh OOM)
    - Với mỗi session: fetch questions kèm `difficulty_score`, tính lại EXP theo logic mới (question EXP + bonus EXP)
    - Group theo `account_id` (qua `enrollment.student.account_id`), tính tổng EXP mỗi user
    - Upsert `StudyStat.total_minutes` với tổng EXP đã tính
    - Log tiến độ mỗi 1000 records và log lỗi từng record (không dừng toàn bộ migration)
    - _Requirements: 13.1–13.6_

  - [ ] 9.2 Thêm dry-run mode cho migration script
    - Flag `--dry-run`: tính toán nhưng không ghi vào DB, chỉ log kết quả dự kiến
    - Flag `--batch-size`: cho phép cấu hình batch size (default 500)
    - _Requirements: 13.5–13.6_

  - [ ]* 9.3 Viết unit test cho migration logic
    - Test tính EXP đúng từ historical sessions
    - Test batch processing không bỏ sót records
    - _Requirements: 13.1–13.3_

- [ ] 10. Checkpoint — Final
  - Đảm bảo tất cả tests pass. Kiểm tra migration script chạy được với `--dry-run`. Kiểm tra frontend hiển thị đúng "Điểm Ôn Tập" và "Điểm Gốc". Hỏi user nếu có thắc mắc.

## Notes

- Tasks đánh dấu `*` là optional và có thể bỏ qua để triển khai MVP nhanh hơn
- `StudyStat.total_minutes` được repurpose thành `total_exp` — không thay đổi schema, chỉ thay đổi semantic
- `ExpCalculatorService` (time-based) được giữ lại nhưng không còn được gọi khi session kết thúc — có thể xóa hoàn toàn trong sprint sau
- Backward compatibility: các API response hiện tại giữ nguyên field names; chỉ thêm fields mới
- Migration script cần chạy một lần sau khi deploy backend mới, trước khi deploy frontend

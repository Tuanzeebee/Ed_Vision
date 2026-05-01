# Requirements Document

## Introduction

Hệ thống điểm số mới (Scoring System Revamp) được thiết kế để cải thiện trải nghiệm học tập TOEIC bằng cách tách biệt rõ ràng các loại điểm số khác nhau và thay đổi cơ chế tính EXP từ dựa trên thời gian sang dựa trên câu hỏi. Hệ thống mới bao gồm: Điểm Gốc (Base Score) từ diagnostic test, Điểm Ôn Tập (Practice Score) thay thế Điểm Dự Phòng, và hệ thống EXP mới dựa trên số câu hỏi đúng thay vì thời gian học.

## Glossary

- **Scoring_System**: Hệ thống quản lý và tính toán các loại điểm số
- **Base_Score_Calculator**: Module tính toán Điểm Gốc từ diagnostic test
- **Practice_Score_Manager**: Module quản lý Điểm Ôn Tập (reserve_points)
- **Question_Based_EXP_Calculator**: Module tính toán EXP dựa trên câu hỏi
- **Leaderboard_Updater**: Module cập nhật bảng xếp hạng dựa trên EXP mới
- **Diagnostic_Test**: Bài kiểm tra đầu vào để xác định trình độ ban đầu
- **Practice_Question**: Câu hỏi ôn tập trong ToeicPracticePartSession
- **Exam_Simulation**: Bài thi thử được mở khóa khi Điểm Ôn Tập đạt target_score
- **CertificateEnrollment**: Bảng lưu trữ thông tin đăng ký chứng chỉ của học sinh
- **ToeicPracticePartSession**: Phiên ôn tập một part TOEIC (10 câu hỏi)
- **StudyStat**: Bảng thống kê học tập (sẽ được repurpose cho EXP)
- **Leaderboard**: Bảng xếp hạng người học
- **Target_Score**: Điểm mục tiêu mà học sinh muốn đạt được
- **Current_Score**: Điểm hiện tại của học sinh (Điểm Gốc)
- **Reserve_Points**: Điểm tích lũy từ ôn tập (Điểm Ôn Tập)
- **Exam_Score**: Điểm từ bài thi thử (exam-simulation)

## Requirements

### Requirement 1: Tính toán và lưu Điểm Gốc từ Diagnostic Test

**User Story:** Là một học sinh, tôi muốn điểm số từ bài kiểm tra đầu vào được lưu làm Điểm Gốc, để tôi có thể theo dõi tiến độ từ điểm xuất phát của mình.

#### Acceptance Criteria

1. WHEN a student completes a Diagnostic_Test, THE Base_Score_Calculator SHALL calculate the TOEIC score based on correct answers
2. WHEN the score is calculated, THE Base_Score_Calculator SHALL store the score in CertificateEnrollment.current_score field
3. THE Base_Score_Calculator SHALL preserve the current_score value until the student completes an Exam_Simulation
4. THE Scoring_System SHALL display current_score with the label "Điểm Gốc" in the user interface
5. THE Base_Score_Calculator SHALL validate that the calculated score is within the valid TOEIC range of 10 to 990

### Requirement 2: Đổi tên và quản lý Điểm Ôn Tập

**User Story:** Là một học sinh, tôi muốn thấy "Điểm Ôn Tập" thay vì "Điểm Dự Phòng", để tôi hiểu rõ hơn về mục đích của điểm số này.

#### Acceptance Criteria

1. THE Scoring_System SHALL display the reserve_points field with the label "Điểm Ôn Tập" in all user interfaces
2. THE Practice_Score_Manager SHALL initialize reserve_points to 0 WHEN a new CertificateEnrollment is created
3. THE Practice_Score_Manager SHALL store reserve_points in the CertificateEnrollment.reserve_points field
4. THE Practice_Score_Manager SHALL ensure reserve_points is a non-negative value
5. THE Scoring_System SHALL update all API responses to use "Điểm Ôn Tập" terminology instead of "Điểm Dự Phòng"

### Requirement 3: Tích lũy Điểm Ôn Tập từ Practice Questions

**User Story:** Là một học sinh, tôi muốn nhận Điểm Ôn Tập khi làm đúng câu hỏi ôn tập, để tôi có động lực luyện tập nhiều hơn.

#### Acceptance Criteria

1. WHEN a student completes a ToeicPracticePartSession, THE Practice_Score_Manager SHALL calculate earned points based on correct_count and toeic_part
2. THE Practice_Score_Manager SHALL add earned_points to the current reserve_points value in CertificateEnrollment
3. THE Practice_Score_Manager SHALL use the existing point allocation logic for each TOEIC part (Part 1: 10pts, Part 2: 10pts, Part 3: 15pts, Part 4: 15pts, Part 5: 15pts, Part 6: 15pts, Part 7: 20pts)
4. THE Practice_Score_Manager SHALL update reserve_points atomically within the same database transaction as the session completion
5. THE Practice_Score_Manager SHALL record the earned_points value in ToeicPracticePartSession.earned_points field

### Requirement 4: Mở khóa Exam Simulation khi đạt Target Score

**User Story:** Là một học sinh, tôi muốn được mở khóa bài thi thử khi Điểm Ôn Tập đạt điểm mục tiêu, để tôi có thể kiểm tra trình độ thực tế của mình.

#### Acceptance Criteria

1. WHEN reserve_points reaches or exceeds target_score, THE Practice_Score_Manager SHALL mark the Exam_Simulation as unlocked for the student
2. THE Practice_Score_Manager SHALL compare reserve_points with target_score after each ToeicPracticePartSession completion
3. THE Scoring_System SHALL provide an API endpoint that returns the unlock status of Exam_Simulation
4. THE Scoring_System SHALL display a visual indicator in the UI WHEN Exam_Simulation is unlocked
5. IF target_score is not set, THEN THE Practice_Score_Manager SHALL not unlock Exam_Simulation regardless of reserve_points value

### Requirement 5: Reset Điểm Ôn Tập sau khi hoàn thành Exam Simulation

**User Story:** Là một học sinh, tôi muốn Điểm Ôn Tập được reset về 0 sau khi làm thi thử, để tôi có thể bắt đầu chu kỳ ôn tập mới cho band điểm tiếp theo.

#### Acceptance Criteria

1. WHEN a student completes an Exam_Simulation, THE Practice_Score_Manager SHALL reset reserve_points to 0
2. WHEN reserve_points is reset, THE Practice_Score_Manager SHALL update exam_score with the score from the Exam_Simulation
3. THE Practice_Score_Manager SHALL perform the reset and exam_score update within a single database transaction
4. THE Practice_Score_Manager SHALL preserve the current_score value WHEN resetting reserve_points
5. THE Practice_Score_Manager SHALL log the reset event with timestamp and previous reserve_points value for audit purposes

### Requirement 6: Tính toán EXP dựa trên câu hỏi đúng

**User Story:** Là một học sinh, tôi muốn nhận EXP khi làm đúng câu hỏi ôn tập, để hệ thống phản ánh chính xác nỗ lực học tập của tôi.

#### Acceptance Criteria

1. WHEN a student answers a Practice_Question correctly, THE Question_Based_EXP_Calculator SHALL award EXP points based on question difficulty
2. THE Question_Based_EXP_Calculator SHALL award 5 EXP points for questions with difficulty_score between 0.0 and 0.3
3. THE Question_Based_EXP_Calculator SHALL award 7 EXP points for questions with difficulty_score between 0.3 and 0.6
4. THE Question_Based_EXP_Calculator SHALL award 10 EXP points for questions with difficulty_score between 0.6 and 1.0
5. THE Question_Based_EXP_Calculator SHALL NOT award EXP for incorrect answers
6. THE Question_Based_EXP_Calculator SHALL calculate total EXP for a ToeicPracticePartSession by summing EXP from all correct answers

### Requirement 7: Tính toán EXP bonus khi hoàn thành Part

**User Story:** Là một học sinh, tôi muốn nhận EXP bonus khi hoàn thành một part ôn tập, để tôi có động lực hoàn thành toàn bộ bài tập.

#### Acceptance Criteria

1. WHEN a student completes a ToeicPracticePartSession, THE Question_Based_EXP_Calculator SHALL award bonus EXP based on the toeic_part
2. THE Question_Based_EXP_Calculator SHALL award 20 EXP bonus for completing Part 1 or Part 2
3. THE Question_Based_EXP_Calculator SHALL award 30 EXP bonus for completing Part 3 or Part 4
4. THE Question_Based_EXP_Calculator SHALL award 35 EXP bonus for completing Part 5 or Part 6
5. THE Question_Based_EXP_Calculator SHALL award 50 EXP bonus for completing Part 7
6. THE Question_Based_EXP_Calculator SHALL award the bonus regardless of the number of correct answers
7. THE Question_Based_EXP_Calculator SHALL add the bonus EXP to the EXP earned from correct answers

### Requirement 8: Lưu trữ EXP trong StudyStat

**User Story:** Là một hệ thống backend, tôi cần lưu trữ tổng EXP của học sinh, để có thể tính toán bảng xếp hạng và hiển thị tiến độ.

#### Acceptance Criteria

1. THE Question_Based_EXP_Calculator SHALL store cumulative EXP in StudyStat.total_minutes field (repurposed as total_exp)
2. WHEN EXP is awarded, THE Question_Based_EXP_Calculator SHALL add the new EXP to the existing total_minutes value
3. THE Question_Based_EXP_Calculator SHALL update StudyStat.total_sessions to increment by 1 for each completed ToeicPracticePartSession
4. THE Question_Based_EXP_Calculator SHALL update StudyStat.updated_at with the current timestamp
5. THE Question_Based_EXP_Calculator SHALL create a new StudyStat record with total_minutes set to 0 WHEN a student first completes a practice session

### Requirement 9: Loại bỏ logic EXP dựa trên thời gian

**User Story:** Là một quản trị viên, tôi muốn hệ thống không còn tính EXP dựa trên thời gian học, để tập trung vào chất lượng học tập thay vì số lượng thời gian.

#### Acceptance Criteria

1. THE Scoring_System SHALL remove all code that calculates EXP based on study duration in minutes
2. THE Scoring_System SHALL remove the formula "1 EXP per minute" from all EXP calculation modules
3. THE Scoring_System SHALL NOT award EXP WHEN a StudySession ends
4. THE Scoring_System SHALL preserve StudySession records for historical tracking purposes
5. THE Scoring_System SHALL update documentation to reflect that EXP is now question-based only

### Requirement 10: Cập nhật bảng xếp hạng tuần dựa trên EXP mới

**User Story:** Là một học sinh, tôi muốn bảng xếp hạng tuần phản ánh EXP kiếm được từ câu hỏi, để tôi có thể so sánh tiến độ học tập thực sự với bạn bè.

#### Acceptance Criteria

1. THE Leaderboard_Updater SHALL calculate weekly ranking based on EXP earned from Practice_Questions during the current week
2. THE Leaderboard_Updater SHALL track weekly EXP separately from total EXP using Redis or a dedicated database field
3. THE Leaderboard_Updater SHALL reset weekly EXP counters at the start of each new week (Monday 00:00:00)
4. THE Leaderboard_Updater SHALL update weekly rankings after each ToeicPracticePartSession completion
5. THE Leaderboard_Updater SHALL NOT include EXP from StudySession duration in weekly rankings

### Requirement 11: Cập nhật bảng xếp hạng tổng dựa trên EXP mới

**User Story:** Là một học sinh, tôi muốn bảng xếp hạng tổng phản ánh tổng EXP tích lũy từ câu hỏi, để tôi có thể thấy vị trí của mình dựa trên nỗ lực học tập thực sự.

#### Acceptance Criteria

1. THE Leaderboard_Updater SHALL calculate total ranking based on cumulative EXP stored in StudyStat.total_minutes
2. THE Leaderboard_Updater SHALL NOT use StudySession.duration_minutes for ranking calculations
3. THE Leaderboard_Updater SHALL update total rankings after each ToeicPracticePartSession completion
4. THE Leaderboard_Updater SHALL assign ranks in descending order of total EXP
5. THE Leaderboard_Updater SHALL handle tied EXP values by assigning the same rank and skipping subsequent rank numbers

### Requirement 12: API endpoint cho thống kê điểm số cá nhân

**User Story:** Là một học sinh, tôi muốn xem tất cả các loại điểm số của mình trong một API endpoint, để tôi có thể theo dõi tiến độ toàn diện.

#### Acceptance Criteria

1. THE Scoring_System SHALL provide GET endpoint `/certificates/me/scores` for personal score statistics
2. THE endpoint SHALL return current_score (Điểm Gốc), reserve_points (Điểm Ôn Tập), target_score, and exam_score
3. THE endpoint SHALL return total_exp (from StudyStat.total_minutes) and weekly_exp
4. THE endpoint SHALL return exam_simulation_unlocked status (true WHEN reserve_points >= target_score)
5. THE endpoint SHALL respond within 100 milliseconds
6. THE endpoint SHALL require authentication and return data only for the authenticated user

### Requirement 13: Migration dữ liệu EXP hiện có

**User Story:** Là một quản trị viên, tôi muốn migrate dữ liệu EXP hiện có sang hệ thống mới, để người dùng không mất lịch sử EXP của họ.

#### Acceptance Criteria

1. THE Scoring_System SHALL provide a migration script to recalculate EXP from existing ToeicPracticePartSession records
2. THE migration script SHALL process all historical ToeicPracticePartSession records and calculate EXP based on correct_count and difficulty
3. THE migration script SHALL update StudyStat.total_minutes with the recalculated total EXP for each student
4. THE migration script SHALL preserve existing StudySession records without modification
5. THE migration script SHALL log the migration progress and any errors encountered
6. THE migration script SHALL complete processing within 10 minutes for up to 50,000 practice sessions

### Requirement 14: Xử lý trường hợp không có difficulty_score

**User Story:** Là một hệ thống backend, tôi cần xử lý câu hỏi không có difficulty_score, để đảm bảo tất cả câu hỏi đều có thể tính EXP.

#### Acceptance Criteria

1. WHEN a Practice_Question has null difficulty_score, THE Question_Based_EXP_Calculator SHALL use a default difficulty_score of 0.5
2. THE Question_Based_EXP_Calculator SHALL award 7 EXP for questions with default difficulty_score
3. THE Question_Based_EXP_Calculator SHALL log a warning WHEN using default difficulty_score
4. THE Scoring_System SHALL provide a background job to populate missing difficulty_score values
5. THE background job SHALL calculate difficulty_score based on score_band_min, score_band_max, and toeic_part

### Requirement 15: Tương thích ngược với API hiện tại

**User Story:** Là một frontend developer, tôi muốn API endpoints hiện tại vẫn hoạt động, để tôi có thể cập nhật frontend từng phần mà không gây lỗi.

#### Acceptance Criteria

1. THE Scoring_System SHALL maintain existing API endpoint paths and response structures
2. THE Scoring_System SHALL add new fields to existing responses without removing old fields during a transition period
3. THE Scoring_System SHALL provide a deprecation notice for fields that will be removed in future versions
4. THE Scoring_System SHALL support both "Điểm Dự Phòng" and "Điểm Ôn Tập" terminology in API responses for 2 weeks after deployment
5. THE Scoring_System SHALL document all API changes in a migration guide for frontend developers

### Requirement 16: Validation cho Target Score

**User Story:** Là một học sinh, tôi muốn hệ thống validate điểm mục tiêu của tôi, để đảm bảo tôi đặt mục tiêu hợp lý.

#### Acceptance Criteria

1. WHEN a student sets target_score, THE Scoring_System SHALL validate that the value is within the valid TOEIC range of 10 to 990
2. THE Scoring_System SHALL validate that target_score is greater than current_score
3. THE Scoring_System SHALL validate that target_score is a multiple of 5
4. IF validation fails, THEN THE Scoring_System SHALL return a 400 Bad Request error with a descriptive message
5. THE Scoring_System SHALL allow updating target_score only WHEN reserve_points is 0 or the student has not started practicing

### Requirement 17: Hiển thị tiến độ đến Target Score

**User Story:** Là một học sinh, tôi muốn thấy tiến độ của mình đến điểm mục tiêu, để tôi biết còn bao nhiêu Điểm Ôn Tập nữa cần tích lũy.

#### Acceptance Criteria

1. THE Scoring_System SHALL calculate progress percentage as (reserve_points / target_score) × 100
2. THE Scoring_System SHALL include progress_percent in the `/certificates/me/scores` API response
3. THE Scoring_System SHALL cap progress_percent at 100 WHEN reserve_points exceeds target_score
4. THE Scoring_System SHALL return 0 for progress_percent WHEN target_score is not set
5. THE Scoring_System SHALL provide remaining_points field calculated as max(0, target_score - reserve_points)

### Requirement 18: Logging và Audit Trail

**User Story:** Là một quản trị viên, tôi muốn có audit trail cho tất cả thay đổi điểm số, để tôi có thể điều tra các vấn đề và phát hiện gian lận.

#### Acceptance Criteria

1. THE Scoring_System SHALL log all changes to current_score, reserve_points, and exam_score with timestamp and reason
2. THE Scoring_System SHALL log the account_id of the student and the session_id that triggered the change
3. THE Scoring_System SHALL log EXP calculations including the formula used and input values
4. THE Scoring_System SHALL store logs in a structured format (JSON) for easy querying
5. THE Scoring_System SHALL retain logs for at least 90 days

### Requirement 19: Performance cho tính toán EXP

**User Story:** Là một học sinh, tôi muốn nhận kết quả và EXP ngay lập tức sau khi hoàn thành bài tập, để tôi có trải nghiệm học tập mượt mà.

#### Acceptance Criteria

1. THE Question_Based_EXP_Calculator SHALL complete EXP calculation and database update within 500 milliseconds
2. THE Question_Based_EXP_Calculator SHALL use database transactions to ensure atomicity of all updates
3. THE Question_Based_EXP_Calculator SHALL handle concurrent session completions without data corruption
4. THE Question_Based_EXP_Calculator SHALL use database indexes on frequently queried fields (account_id, enrollment_id)
5. THE Question_Based_EXP_Calculator SHALL cache difficulty_score values in memory to reduce database queries

### Requirement 20: Xử lý lỗi và rollback

**User Story:** Là một hệ thống backend, tôi cần xử lý lỗi một cách graceful, để đảm bảo dữ liệu không bị corrupt khi có lỗi xảy ra.

#### Acceptance Criteria

1. WHEN an error occurs during EXP calculation, THE Scoring_System SHALL rollback all database changes in the transaction
2. THE Scoring_System SHALL log the error with full context (student_id, session_id, error message, stack trace)
3. THE Scoring_System SHALL return a 500 Internal Server Error response with a generic error message to the client
4. THE Scoring_System SHALL send an alert to administrators WHEN error rate exceeds 1% of total requests
5. THE Scoring_System SHALL retry failed EXP calculations up to 3 times with exponential backoff before giving up

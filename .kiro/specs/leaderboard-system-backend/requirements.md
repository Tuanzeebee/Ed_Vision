# Requirements Document

## Introduction

Hệ thống bảng xếp hạng (Leaderboard System) hiện tại đang sử dụng dữ liệu hardcode trên frontend. Tài liệu này mô tả các yêu cầu để chuyển đổi sang hệ thống backend thực sự với các tính năng: điểm EXP (Experience Points), chuỗi học (Streak), điều kiện tham gia bảng xếp hạng, trạng thái online, và logic xếp hạng theo tuần và tổng.

## Glossary

- **Leaderboard_System**: Hệ thống quản lý và hiển thị bảng xếp hạng người học
- **EXP_Calculator**: Module tính toán điểm kinh nghiệm (Experience Points)
- **Streak_Tracker**: Module theo dõi chuỗi ngày học liên tiếp
- **Eligibility_Checker**: Module kiểm tra điều kiện tham gia bảng xếp hạng
- **Ranking_Engine**: Module tính toán và cập nhật thứ hạng
- **Online_Status_Manager**: Module quản lý trạng thái online của người dùng
- **Study_Session**: Phiên học của người dùng trong study room
- **Survey_Completion**: Trạng thái hoàn thành khảo sát đầu vào
- **Goal_Input**: Trạng thái nhập điểm mục tiêu
- **Weekly_Ranking**: Bảng xếp hạng theo tuần
- **Total_Ranking**: Bảng xếp hạng tổng (all-time)
- **API_Service**: Dịch vụ API cung cấp dữ liệu cho frontend

## Requirements

### Requirement 1: Tính toán điểm EXP từ Study Sessions

**User Story:** Là một học sinh, tôi muốn nhận điểm EXP khi học trong study room, để tôi có thể theo dõi tiến độ học tập của mình.

#### Acceptance Criteria

1. WHEN a Study_Session is completed, THE EXP_Calculator SHALL calculate EXP based on session duration
2. THE EXP_Calculator SHALL award 1 EXP point per minute of study time
3. WHEN EXP is calculated, THE EXP_Calculator SHALL update the user's total EXP in StudyStat table
4. THE EXP_Calculator SHALL record the EXP transaction with timestamp and session reference
5. IF a Study_Session duration is less than 1 minute, THEN THE EXP_Calculator SHALL award 0 EXP

### Requirement 2: Theo dõi chuỗi học (Streak)

**User Story:** Là một học sinh, tôi muốn thấy chuỗi ngày học liên tiếp của mình, để tôi có động lực duy trì thói quen học tập.

#### Acceptance Criteria

1. WHEN a user completes at least one Study_Session in a day, THE Streak_Tracker SHALL mark that day as a study day
2. THE Streak_Tracker SHALL increment current_streak by 1 WHEN the user studies on consecutive days
3. THE Streak_Tracker SHALL reset current_streak to 1 WHEN there is a gap of more than 1 day since last_study_date
4. THE Streak_Tracker SHALL update longest_streak WHEN current_streak exceeds the previous longest_streak value
5. THE Streak_Tracker SHALL store last_study_date in DailyStreak table for each user
6. WHEN calculating streak, THE Streak_Tracker SHALL use the date in the user's timezone

### Requirement 3: Kiểm tra điều kiện tham gia bảng xếp hạng

**User Story:** Là một quản trị viên, tôi muốn chỉ những học sinh đủ điều kiện mới xuất hiện trên bảng xếp hạng, để đảm bảo tính công bằng và chất lượng dữ liệu.

#### Acceptance Criteria

1. THE Eligibility_Checker SHALL verify that the user has completed Survey_Completion before including them in rankings
2. THE Eligibility_Checker SHALL verify that the user has completed Goal_Input before including them in rankings
3. WHEN a user completes both Survey_Completion and Goal_Input, THE Eligibility_Checker SHALL mark the user as eligible for leaderboard
4. THE Eligibility_Checker SHALL exclude users who have not met eligibility criteria from all leaderboard queries
5. THE Eligibility_Checker SHALL provide an eligibility status flag in the user's profile data

### Requirement 4: Tính toán xếp hạng theo tuần

**User Story:** Là một học sinh, tôi muốn xem bảng xếp hạng theo tuần, để tôi có thể so sánh tiến độ học tập của mình với bạn bè trong tuần hiện tại.

#### Acceptance Criteria

1. THE Ranking_Engine SHALL calculate Weekly_Ranking based on EXP earned during the current week
2. THE Ranking_Engine SHALL define a week as starting on Monday at 00:00:00 and ending on Sunday at 23:59:59
3. THE Ranking_Engine SHALL reset weekly EXP counters at the start of each new week
4. THE Ranking_Engine SHALL assign rank 1 to the user with the highest weekly EXP
5. WHEN multiple users have the same weekly EXP, THE Ranking_Engine SHALL assign the same rank and skip subsequent rank numbers
6. THE Ranking_Engine SHALL update Weekly_Ranking in real-time after each Study_Session completion

### Requirement 5: Tính toán xếp hạng tổng

**User Story:** Là một học sinh, tôi muốn xem bảng xếp hạng tổng, để tôi có thể thấy vị trí của mình so với tất cả người học khác trong toàn bộ thời gian.

#### Acceptance Criteria

1. THE Ranking_Engine SHALL calculate Total_Ranking based on cumulative total_minutes from StudyStat table
2. THE Ranking_Engine SHALL assign rank 1 to the user with the highest total_minutes
3. WHEN multiple users have the same total_minutes, THE Ranking_Engine SHALL assign the same rank and skip subsequent rank numbers
4. THE Ranking_Engine SHALL update Total_Ranking after each Study_Session completion
5. THE Ranking_Engine SHALL persist ranking data in the Leaderboard table

### Requirement 6: Quản lý trạng thái online

**User Story:** Là một học sinh, tôi muốn thấy ai đang online trên bảng xếp hạng, để tôi có thể biết bạn bè nào đang học cùng thời điểm.

#### Acceptance Criteria

1. THE Online_Status_Manager SHALL mark a user as online WHEN they are actively in a study room
2. THE Online_Status_Manager SHALL mark a user as offline WHEN they leave a study room or disconnect
3. THE Online_Status_Manager SHALL update online status within 5 seconds of status change
4. THE Online_Status_Manager SHALL provide online status indicator in leaderboard API responses
5. THE Online_Status_Manager SHALL use WebSocket connections to track real-time presence

### Requirement 7: API endpoint cho bảng xếp hạng tuần

**User Story:** Là một frontend developer, tôi cần API endpoint để lấy dữ liệu bảng xếp hạng tuần, để hiển thị cho người dùng.

#### Acceptance Criteria

1. THE API_Service SHALL provide GET endpoint `/study-rooms/leaderboard/weekly` for Weekly_Ranking data
2. THE API_Service SHALL return a list of users sorted by weekly EXP in descending order
3. THE API_Service SHALL include rank, account_id, full_name, avatar_url, weekly_exp, current_streak, and online_status for each user
4. THE API_Service SHALL support pagination with limit and offset query parameters
5. THE API_Service SHALL return only eligible users based on Eligibility_Checker criteria
6. THE API_Service SHALL respond within 200 milliseconds for requests with limit up to 100 users

### Requirement 8: API endpoint cho bảng xếp hạng tổng

**User Story:** Là một frontend developer, tôi cần API endpoint để lấy dữ liệu bảng xếp hạng tổng, để hiển thị cho người dùng.

#### Acceptance Criteria

1. THE API_Service SHALL provide GET endpoint `/study-rooms/leaderboard/total` for Total_Ranking data
2. THE API_Service SHALL return a list of users sorted by total_minutes in descending order
3. THE API_Service SHALL include rank, account_id, full_name, avatar_url, total_minutes, total_sessions, current_streak, and online_status for each user
4. THE API_Service SHALL support pagination with limit and offset query parameters
5. THE API_Service SHALL return only eligible users based on Eligibility_Checker criteria
6. THE API_Service SHALL respond within 200 milliseconds for requests with limit up to 100 users

### Requirement 9: API endpoint cho thống kê cá nhân

**User Story:** Là một học sinh, tôi muốn xem thống kê cá nhân của mình, để tôi có thể theo dõi tiến độ và vị trí của mình trên bảng xếp hạng.

#### Acceptance Criteria

1. THE API_Service SHALL provide GET endpoint `/study-rooms/me/stats` for personal statistics
2. THE API_Service SHALL return total_minutes, total_sessions, current_streak, longest_streak, weekly_exp, weekly_rank, total_rank, and last_study_date
3. THE API_Service SHALL return eligibility status indicating whether the user can appear on leaderboard
4. THE API_Service SHALL return null for rank values WHEN the user is not eligible for leaderboard
5. THE API_Service SHALL respond within 100 milliseconds

### Requirement 10: Cập nhật dữ liệu khi kết thúc Study Session

**User Story:** Là một hệ thống backend, tôi cần tự động cập nhật tất cả dữ liệu liên quan khi một Study Session kết thúc, để đảm bảo tính nhất quán của dữ liệu.

#### Acceptance Criteria

1. WHEN a Study_Session ends, THE Leaderboard_System SHALL calculate and award EXP points
2. WHEN a Study_Session ends, THE Leaderboard_System SHALL update StudyStat with new total_minutes and total_sessions
3. WHEN a Study_Session ends, THE Leaderboard_System SHALL update DailyStreak if applicable
4. WHEN a Study_Session ends, THE Leaderboard_System SHALL recalculate Weekly_Ranking
5. WHEN a Study_Session ends, THE Leaderboard_System SHALL recalculate Total_Ranking
6. THE Leaderboard_System SHALL complete all updates within 1 second of Study_Session end time

### Requirement 11: Migration từ dữ liệu hiện tại

**User Story:** Là một quản trị viên, tôi muốn migrate dữ liệu Study Session hiện có sang hệ thống EXP mới, để người dùng không mất lịch sử học tập của họ.

#### Acceptance Criteria

1. THE Leaderboard_System SHALL provide a migration script to calculate EXP from existing StudySession records
2. THE migration script SHALL process all historical Study_Session records and calculate EXP retroactively
3. THE migration script SHALL update StudyStat table with calculated total_minutes and total_sessions
4. THE migration script SHALL calculate and populate DailyStreak data based on historical study dates
5. THE migration script SHALL calculate initial rankings and populate Leaderboard table
6. THE migration script SHALL complete processing within 5 minutes for up to 10,000 study sessions

### Requirement 12: Xử lý Survey và Goal Input completion

**User Story:** Là một học sinh, tôi muốn được tự động đưa vào bảng xếp hạng sau khi hoàn thành khảo sát và nhập điểm mục tiêu, để tôi không phải thực hiện thêm bước nào khác.

#### Acceptance Criteria

1. WHEN a user completes the input survey, THE Eligibility_Checker SHALL mark Survey_Completion as true
2. WHEN a user completes goal input, THE Eligibility_Checker SHALL mark Goal_Input as true
3. WHEN both Survey_Completion and Goal_Input are true, THE Eligibility_Checker SHALL automatically enable leaderboard participation
4. THE Eligibility_Checker SHALL store eligibility status in a dedicated field or derive it from survey and goal completion status
5. THE Eligibility_Checker SHALL update eligibility status within 1 second of completion


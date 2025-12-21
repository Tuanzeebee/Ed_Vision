-- ====================================================================
-- seedBigQueryPart4.sql - Fake Session & Daily Activity Data
-- ====================================================================
-- Chạy trực tiếp vào Google BigQuery
-- Tạo fake sessions từ 2021-2025 cho tất cả accounts
-- Đảm bảo đa dạng về thời gian và activity patterns
-- ====================================================================

-- ====================================================================
-- STEP 1: Xóa data cũ (nếu cần re-seed)
-- ====================================================================
-- DELETE FROM `edvision_dw.fact_user_session` WHERE 1=1;
-- DELETE FROM `edvision_dw.fact_daily_account_activity` WHERE 1=1;

-- ====================================================================
-- STEP 2: Generate fake sessions cho tất cả accounts (2021-2025)
-- ====================================================================
-- Strategy:
-- - MỌI ACCOUNT (2019 accounts) đều có ít nhất 1 session
-- - Admin/Leader: 50-100 sessions
-- - Teacher: 100-150 sessions
-- - Student: 20-200 sessions (varied: very active → low activity)
--   * 20% very active: 150-200 sessions
--   * 40% active: 100-149 sessions
--   * 20% moderate: 50-99 sessions
--   * 20% low: 20-49 sessions
-- - Parent: 10-100 sessions (varied: very active → low activity)
--   * 10% very active: 80-100 sessions
--   * 30% active: 50-79 sessions
--   * 40% moderate: 20-49 sessions
--   * 20% low: 10-19 sessions
-- - Phân bố đều qua các năm, tháng, ngày trong tuần
-- - Morning/Afternoon/Evening distribution
-- - Session duration: 5-240 minutes

INSERT INTO `edvision_dw.fact_user_session` (
  session_id,
  account_sk,
  role_code,
  login_time,
  logout_time,
  session_duration_min,
  period,
  created_at
)
WITH 
  -- Tạo date range từ 2021-01-01 đến 2025-12-20
  date_range AS (
    SELECT DATE_ADD(DATE('2021-01-01'), INTERVAL day DAY) as date
    FROM UNNEST(GENERATE_ARRAY(0, DATE_DIFF(DATE('2025-12-20'), DATE('2021-01-01'), DAY))) as day
  ),
  
  -- Tạo accounts với role (giả định account_id từ 1-2019)
  accounts AS (
    -- Admin: 1 account (id: 1)
    SELECT 1 as account_sk, 'admin' as role_code, 50 as target_sessions UNION ALL
    -- Leaders: 3 accounts (id: 2-4)
    SELECT 2, 'leader', 60 UNION ALL
    SELECT 3, 'leader', 70 UNION ALL
    SELECT 4, 'leader', 65 UNION ALL
    -- Teachers: 15 accounts (id: 5-19)
    SELECT 5, 'teacher', 120 UNION ALL
    SELECT 6, 'teacher', 110 UNION ALL
    SELECT 7, 'teacher', 130 UNION ALL
    SELECT 8, 'teacher', 115 UNION ALL
    SELECT 9, 'teacher', 125 UNION ALL
    SELECT 10, 'teacher', 105 UNION ALL
    SELECT 11, 'teacher', 135 UNION ALL
    SELECT 12, 'teacher', 100 UNION ALL
    SELECT 13, 'teacher', 140 UNION ALL
    SELECT 14, 'teacher', 108 UNION ALL
    SELECT 15, 'teacher', 128 UNION ALL
    SELECT 16, 'teacher', 112 UNION ALL
    SELECT 17, 'teacher', 132 UNION ALL
    SELECT 18, 'teacher', 118 UNION ALL
    SELECT 19, 'teacher', 122
  ),
  
  -- Students: 1000 accounts (id: 20-1019), TẤT CẢ đều có sessions
  -- Phân bố: 20% very active (150-200), 30% active (100-149), 30% moderate (50-99), 20% low (20-49)
  students AS (
    SELECT 
      20 + offset as account_sk,
      'student' as role_code,
      CASE 
        WHEN MOD(offset, 5) = 0 THEN 150 + MOD(offset * 7, 50)  -- 20% very active: 150-200
        WHEN MOD(offset, 5) IN (1, 2) THEN 100 + MOD(offset * 11, 49)  -- 40% active: 100-149
        WHEN MOD(offset, 5) = 3 THEN 50 + MOD(offset * 13, 49)  -- 20% moderate: 50-99
        ELSE 20 + MOD(offset * 17, 29)  -- 20% low: 20-49
      END as target_sessions
    FROM UNNEST(GENERATE_ARRAY(0, 999)) as offset
  ),
  
  -- Parents: 1000 accounts (id: 1020-2019), TẤT CẢ đều có sessions
  -- Phân bố: 10% very active (80-100), 30% active (50-79), 40% moderate (20-49), 20% low (10-19)
  parents AS (
    SELECT 
      1020 + offset as account_sk,
      'parent' as role_code,
      CASE 
        WHEN MOD(offset, 10) = 0 THEN 80 + MOD(offset * 7, 20)  -- 10% very active: 80-100
        WHEN MOD(offset, 10) IN (1, 2, 3) THEN 50 + MOD(offset * 11, 29)  -- 30% active: 50-79
        WHEN MOD(offset, 10) IN (4, 5, 6, 7) THEN 20 + MOD(offset * 13, 29)  -- 40% moderate: 20-49
        ELSE 10 + MOD(offset * 17, 9)  -- 20% low: 10-19
      END as target_sessions
    FROM UNNEST(GENERATE_ARRAY(0, 999)) as offset
  ),
  
  -- Combine all accounts
  all_accounts AS (
    SELECT * FROM accounts
    UNION ALL
    SELECT * FROM students
    UNION ALL
    SELECT * FROM parents
  ),
  
  -- Generate sessions for each account
  sessions_base AS (
    SELECT 
      a.account_sk,
      a.role_code,
      -- Random dates from date_range (sample theo target_sessions)
      d.date,
      -- Session number for this account
      ROW_NUMBER() OVER (PARTITION BY a.account_sk ORDER BY d.date) as session_num,
      a.target_sessions
    FROM all_accounts a
    CROSS JOIN date_range d
    -- Random sampling: mỗi account lấy ngẫu nhiên các ngày
    WHERE RAND() < (a.target_sessions / 1800.0) -- 1800 days in range
    QUALIFY session_num <= a.target_sessions
  ),
  
  -- Add time details to sessions
  sessions_with_time AS (
    SELECT
      account_sk,
      role_code,
      date,
      session_num,
      -- Random hour (5-22) để tránh sessions nửa đêm
      5 + MOD(CAST(RAND() * 100000 AS INT64), 18) as login_hour,
      -- Random minute (0-59)
      MOD(CAST(RAND() * 100000 AS INT64), 60) as login_minute,
      -- Session duration: 5-240 minutes (weighted towards shorter sessions)
      CASE 
        WHEN RAND() < 0.5 THEN 5 + MOD(CAST(RAND() * 100000 AS INT64), 30) -- 50%: 5-35 min
        WHEN RAND() < 0.8 THEN 35 + MOD(CAST(RAND() * 100000 AS INT64), 45) -- 30%: 35-80 min
        ELSE 80 + MOD(CAST(RAND() * 100000 AS INT64), 160) -- 20%: 80-240 min
      END as duration_min
    FROM sessions_base
  ),
  
  -- Calculate full timestamps (step 1: compute login_time first)
  sessions_with_timestamps AS (
    SELECT
      account_sk,
      role_code,
      -- Login timestamp
      TIMESTAMP(DATETIME(date, TIME(login_hour, login_minute, 0))) as login_time,
      -- Logout timestamp (login + duration)
      TIMESTAMP_ADD(
        TIMESTAMP(DATETIME(date, TIME(login_hour, login_minute, 0))),
        INTERVAL duration_min MINUTE
      ) as logout_time,
      duration_min as session_duration_min,
      -- Period based on login_hour
      CASE 
        WHEN login_hour >= 5 AND login_hour < 12 THEN 'morning'
        WHEN login_hour >= 12 AND login_hour < 17 THEN 'afternoon'
        ELSE 'evening'
      END as period
    FROM sessions_with_time
  ),
  
  -- Step 2: Generate session_id using login_time
  sessions_final AS (
    SELECT
      TO_HEX(MD5(CONCAT(
        CAST(account_sk AS STRING), 
        '_',
        FORMAT_TIMESTAMP('%Y%m%d%H%M%S', login_time)
      ))) as session_id,
      account_sk,
      role_code,
      login_time,
      logout_time,
      session_duration_min,
      period,
      login_time as created_at
    FROM sessions_with_timestamps
  )

SELECT * FROM sessions_final
ORDER BY account_sk, login_time;

-- ====================================================================
-- STEP 3: Generate fact_daily_account_activity
-- ====================================================================
-- Tính từ sessions vừa tạo
-- - total_accounts: tổng số accounts có role đó (từ dim_account)
-- - active_accounts: số accounts có ít nhất 1 session trong ngày
-- - performance_rate: active/total

INSERT INTO `edvision_dw.fact_daily_account_activity` (
  activity_date,
  role_code,
  total_accounts,
  active_accounts,
  performance_rate,
  updated_at
)
WITH 
  -- Count total accounts by role (giả định từ data đã seed)
  total_by_role AS (
    SELECT 'admin' as role_code, 1 as total_accounts UNION ALL
    SELECT 'leader', 3 UNION ALL
    SELECT 'teacher', 15 UNION ALL
    SELECT 'student', 1000 UNION ALL
    SELECT 'parent', 1000
  ),
  
  -- Count active accounts per day from sessions
  daily_active AS (
    SELECT 
      DATE(login_time) as activity_date,
      role_code,
      COUNT(DISTINCT account_sk) as active_accounts
    FROM `edvision_dw.fact_user_session`
    GROUP BY activity_date, role_code
  ),
  
  -- Get all unique dates from sessions
  all_dates AS (
    SELECT DISTINCT DATE(login_time) as activity_date 
    FROM `edvision_dw.fact_user_session`
  ),
  
  -- Combine with total
  daily_stats AS (
    SELECT
      dates.activity_date,
      t.role_code,
      t.total_accounts,
      COALESCE(d.active_accounts, 0) as active_accounts,
      ROUND(SAFE_DIVIDE(COALESCE(d.active_accounts, 0), t.total_accounts), 4) as performance_rate
    FROM total_by_role t
    CROSS JOIN all_dates dates
    LEFT JOIN daily_active d 
      ON d.activity_date = dates.activity_date 
      AND d.role_code = t.role_code
  )

SELECT 
  activity_date,
  role_code,
  total_accounts,
  active_accounts,
  performance_rate,
  CURRENT_TIMESTAMP() as updated_at
FROM daily_stats
ORDER BY activity_date DESC, role_code;

-- ====================================================================
-- VERIFICATION QUERIES
-- ====================================================================

-- Check session count by role
-- SELECT role_code, COUNT(*) as session_count, COUNT(DISTINCT account_sk) as unique_accounts
-- FROM `edvision_dw.fact_user_session`
-- GROUP BY role_code
-- ORDER BY role_code;

-- Check session distribution by year
-- SELECT EXTRACT(YEAR FROM login_time) as year, role_code, COUNT(*) as sessions
-- FROM `edvision_dw.fact_user_session`
-- GROUP BY year, role_code
-- ORDER BY year, role_code;

-- Check period distribution
-- SELECT period, COUNT(*) as session_count
-- FROM `edvision_dw.fact_user_session`
-- GROUP BY period
-- ORDER BY period;

-- Check daily activity summary
-- SELECT 
--   activity_date,
--   SUM(active_accounts) as total_active,
--   AVG(performance_rate) as avg_performance
-- FROM `edvision_dw.fact_daily_account_activity`
-- GROUP BY activity_date
-- ORDER BY activity_date DESC
-- LIMIT 30;

-- Check activity rate by role over time
-- SELECT 
--   role_code,
--   AVG(performance_rate) as avg_performance_rate,
--   MIN(performance_rate) as min_performance_rate,
--   MAX(performance_rate) as max_performance_rate
-- FROM `edvision_dw.fact_daily_account_activity`
-- GROUP BY role_code
-- ORDER BY role_code;

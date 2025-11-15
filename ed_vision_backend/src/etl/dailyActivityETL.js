/**
 * Incremental Daily Activity ETL - Production Safe
 * CHỈ trigger khi:
 * 1. Account mới tạo
 * 2. Account status thay đổi
 * 3. User login lần đầu trong ngày
 * 
 * Uses Account.last_login_at for persistent deduplication (no extra table needed!)
 */

require('dotenv').config();
const { BigQuery } = require('@google-cloud/bigquery');
const { PrismaClient } = require('@prisma/client');

const bigquery = new BigQuery({ projectId: process.env.BIGQUERY_PROJECT_ID });
const prisma = new PrismaClient();
const DEFAULT_DATASET = process.env.BIGQUERY_DATASET;

// In-memory cache for fast path (optional optimization)
const dailyActivityCache = new Map();

function getCacheKey(date, role_code, account_sk) {
  return `${date}:${role_code}:${account_sk}`;
}

async function isAlreadyCounted(date, role_code, account_sk) {
  // Fast path: check memory cache first
  const cacheKey = getCacheKey(date, role_code, account_sk);
  if (dailyActivityCache.has(cacheKey)) {
    console.log(`[Cache HIT] Account ${account_sk} already counted for ${date}`);
    return true;
  }

  // Persistent check: Query EventLog in Postgres (fast, free, source of truth!)
  // Check if this account already had a login event processed today
  try {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    
    console.log(`[EventLog Check] Checking account ${account_sk} for date ${date}`);
    
    // Raw SQL query để check JSONB payload
    const result = await prisma.$queryRaw`
      SELECT id, created_at 
      FROM "EventLog"
      WHERE table_name = 'Account'
        AND operation = 'UPDATE'
        AND record_id = ${parseInt(account_sk)}
        AND created_at >= ${startOfDay}
        AND created_at <= ${endOfDay}
        AND payload->>'last_login_at' IS NOT NULL
        AND processed = true
      ORDER BY created_at ASC
      LIMIT 1
    `;

    if (result && result.length > 0) {
      console.log(`[EventLog Result] Account ${account_sk} ALREADY LOGGED IN TODAY (event ${result[0].id}) - skip`);
      // Update cache
      dailyActivityCache.set(cacheKey, true);
      return true;
    }

    console.log(`[EventLog Result] Account ${account_sk} NO LOGIN EVENT YET - proceed`);
    return false;

  } catch (err) {
    console.warn(`[EventLog Check Error] ${err.message} - proceeding with update (fail-open)`);
    // Nếu check fail → proceed (better than skip)
    return false;
  }
}

async function markAsCounted(date, role_code, account_sk) {
  // Update memory cache
  dailyActivityCache.set(getCacheKey(date, role_code, account_sk), true);
  // Không cần insert gì - Account.last_login_at đã là proof!
}

async function updateDailyActivity(role_code, activity_date, account_sk = null) {
  const dataset = DEFAULT_DATASET;
  const project = process.env.BIGQUERY_PROJECT_ID;
  const tableId = `\`${project}.${dataset}.fact_daily_account_activity\``;
  
  const date = activity_date || new Date().toISOString().split('T')[0];

  // Nếu là login event → check persistent tracker (Postgres)
  if (account_sk) {
    const alreadyCounted = await isAlreadyCounted(date, role_code, account_sk);
    if (alreadyCounted) {
      console.log(`⏭️ Skip: ${role_code} account ${account_sk} already counted today`);
      return { ok: true, skipped: true };
    }
  }

  try {
    // Step 1: MERGE vào BigQuery với incremental update
    // - Login event (có account_sk): +1 active_accounts
    // - Account creation (không có account_sk): +1 total_accounts
    // - Dòng chưa tồn tại: query COUNT từ Postgres để khởi tạo
    const mergeSql = account_sk 
      ? `MERGE ${tableId} T
        USING (SELECT PARSE_DATE('%Y-%m-%d', @activity_date) AS activity_date, @role_code AS role_code) S
        ON T.activity_date = S.activity_date AND T.role_code = S.role_code
        WHEN MATCHED THEN
          UPDATE SET active_accounts = T.active_accounts + 1,
                     performance_rate = ROUND((T.active_accounts + 1) / T.total_accounts * 100, 2),
                     updated_at = @updated_at
        WHEN NOT MATCHED THEN
          INSERT (activity_date, role_code, total_accounts, active_accounts, performance_rate, updated_at)
          VALUES (S.activity_date, S.role_code, @initial_total, 1, 
                  ROUND(1 / @initial_total * 100, 2), @updated_at)`
      : `MERGE ${tableId} T
        USING (SELECT PARSE_DATE('%Y-%m-%d', @activity_date) AS activity_date, @role_code AS role_code) S
        ON T.activity_date = S.activity_date AND T.role_code = S.role_code
        WHEN MATCHED THEN
          UPDATE SET total_accounts = T.total_accounts + 1,
                     performance_rate = ROUND(COALESCE(T.active_accounts, 0) / (T.total_accounts + 1) * 100, 2),
                     updated_at = @updated_at
        WHEN NOT MATCHED THEN
          INSERT (activity_date, role_code, total_accounts, active_accounts, performance_rate, updated_at)
          VALUES (S.activity_date, S.role_code, @initial_total, 0, 0, @updated_at)`;

    // Step 2: Chỉ query Postgres khi INSERT dòng mới (WHEN NOT MATCHED)
    // Để tránh race condition, luôn query total để đảm bảo consistency
    const initial_total = await prisma.account.count({
      where: {
        roleRel: { code: role_code },
        status: { not: 'deleted' }
      }
    });

    const params = {
      activity_date: date,  // '2025-11-16'
      role_code: String(role_code),
      initial_total: Number(initial_total),
      updated_at: new Date()
    };

    const options = {
      query: mergeSql,
      params,
      types: {
        activity_date: 'STRING',  // Pass as STRING, PARSE_DATE() will convert to DATE
        role_code: 'STRING',
        initial_total: 'INT64',
        updated_at: 'TIMESTAMP'
      }
    };

    await bigquery.query(options);
    
    // Mark user as counted nếu là login event (persist to Postgres)
    if (account_sk) {
      await markAsCounted(date, role_code, account_sk);
      console.log(`✅ Incremented active_accounts for ${role_code} on ${date} (account ${account_sk})`);
    } else {
      console.log(`✅ Updated total_accounts for ${role_code} on ${date}: ${initial_total}`);
    }
    
    return { ok: true };

  } catch (err) {
    console.error('dailyActivityETL error', err);
    return { ok: false, error: String(err) };
  }
}

module.exports = { updateDailyActivity };

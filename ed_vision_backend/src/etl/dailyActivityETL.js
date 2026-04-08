/**
 * Incremental Daily Activity ETL - Production Safe with Throttling
 * CHỈ trigger khi:
 * 1. Account mới tạo
 * 2. Account status thay đổi
 * 3. User login lần đầu trong ngày
 * 
 * Uses EventLog for persistent deduplication + batching to avoid BigQuery DML limit
 */

require('dotenv').config();
const { BigQuery } = require('@google-cloud/bigquery');
const { PrismaClient } = require('@prisma/client');

const bigquery = new BigQuery({ projectId: process.env.BIGQUERY_PROJECT_ID });
const prisma = new PrismaClient();
const DEFAULT_DATASET = process.env.BIGQUERY_DATASET;

// In-memory cache for fast path (optional optimization)
const dailyActivityCache = new Map();

// Batching queue để tránh BigQuery DML limit (20 concurrent)
const updateQueue = new Map(); // key: "date:role_code", value: { count, lastUpdate }
const BATCH_INTERVAL = 2000; // 2 seconds
const MAX_CONCURRENT = 8; // Giới hạn concurrent requests
let activeRequests = 0;

function getCacheKey(date, role_code, account_sk) {
  return `${date}:${role_code}:${account_sk}`;
}

function getQueueKey(date, role_code) {
  return `${date}:${role_code}`;
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
  const date = activity_date || new Date().toISOString().split('T')[0];

  // Nếu là login event → check persistent tracker (Postgres)
  if (account_sk) {
    const alreadyCounted = await isAlreadyCounted(date, role_code, account_sk);
    if (alreadyCounted) {
      console.log(`⏭️ Skip: ${role_code} account ${account_sk} already counted today`);
      return { ok: true, skipped: true };
    }
  }

  // BATCHING: Add to queue thay vì update ngay
  const queueKey = getQueueKey(date, role_code);
  
  if (!updateQueue.has(queueKey)) {
    updateQueue.set(queueKey, {
      date,
      role_code,
      total_delta: 0,
      active_delta: 0,
      accounts: new Set(),
      timer: null
    });
  }

  const batch = updateQueue.get(queueKey);
  
  if (account_sk) {
    // Login event → +1 active (nếu chưa count)
    if (!batch.accounts.has(account_sk)) {
      batch.active_delta += 1;
      batch.accounts.add(account_sk);
      dailyActivityCache.set(getCacheKey(date, role_code, account_sk), true);
    }
  } else {
    // Account creation → +1 total
    batch.total_delta += 1;
  }

  // Debounce: Clear old timer, set new
  if (batch.timer) clearTimeout(batch.timer);
  batch.timer = setTimeout(() => flushBatch(queueKey), BATCH_INTERVAL);

  console.log(`📦 Queued: ${role_code} ${date} (+${batch.total_delta} total, +${batch.active_delta} active)`);
  return { ok: true, batched: true };
}

// Flush batched updates to BigQuery
async function flushBatch(queueKey) {
  if (activeRequests >= MAX_CONCURRENT) {
    // Retry sau nếu quá tải
    const batch = updateQueue.get(queueKey);
    if (batch) {
      batch.timer = setTimeout(() => flushBatch(queueKey), 1000);
    }
    return;
  }

  const batch = updateQueue.get(queueKey);
  if (!batch) return;

  updateQueue.delete(queueKey);
  
  const { date, role_code, total_delta, active_delta } = batch;
  
  if (total_delta === 0 && active_delta === 0) {
    console.log(`⏭️ Skip flush: no changes for ${role_code} ${date}`);
    return;
  }

  activeRequests++;
  
  try {
    const dataset = DEFAULT_DATASET;
    const project = process.env.BIGQUERY_PROJECT_ID;
    const tableId = `\`${project}.${dataset}.fact_daily_account_activity\``;

    // Query total_accounts từ ngày GẦN NHẤT trước đó trong BigQuery (cho ngày mới)
    let previous_day_total = 0;
    try {
      const [rows] = await bigquery.query({
        query: `SELECT total_accounts 
                FROM ${tableId} 
                WHERE activity_date < PARSE_DATE('%Y-%m-%d', @current_date) 
                AND role_code = @role_code 
                ORDER BY activity_date DESC 
                LIMIT 1`,
        params: { current_date: date, role_code: String(role_code) },
        types: { current_date: 'STRING', role_code: 'STRING' }
      });
      
      if (rows && rows.length > 0) {
        previous_day_total = rows[0].total_accounts || 0;
        console.log(`[Previous Total] ${role_code}: ${previous_day_total} (from latest available date)`);
      } else {
        console.log(`[Previous Total] ${role_code}: 0 (no historical data)`);
      }
    } catch (err) {
      console.log(`[Query Previous Day] Error: ${err.message} - starting from 0`);
    }

    // MERGE với delta increments
    const mergeSql = `
      MERGE ${tableId} T
      USING (SELECT PARSE_DATE('%Y-%m-%d', @activity_date) AS activity_date, @role_code AS role_code) S
      ON T.activity_date = S.activity_date AND T.role_code = S.role_code
      WHEN MATCHED THEN
        UPDATE SET 
          total_accounts = T.total_accounts + @total_delta,
          active_accounts = T.active_accounts + @active_delta,
          performance_rate = CASE 
            WHEN (T.total_accounts + @total_delta) > 0 
            THEN ROUND((T.active_accounts + @active_delta) / (T.total_accounts + @total_delta) * 100, 2)
            ELSE 0 
          END,
          updated_at = @updated_at
      WHEN NOT MATCHED THEN
        INSERT (activity_date, role_code, total_accounts, active_accounts, performance_rate, updated_at)
        VALUES (S.activity_date, S.role_code, @previous_day_total + @total_delta, @active_delta, 
                CASE 
                  WHEN (@previous_day_total + @total_delta) > 0 
                  THEN ROUND(@active_delta / (@previous_day_total + @total_delta) * 100, 2)
                  ELSE 0 
                END, 
                @updated_at)
    `;

    await bigquery.query({
      query: mergeSql,
      params: {
        activity_date: date,
        role_code: String(role_code),
        total_delta: Number(total_delta),
        active_delta: Number(active_delta),
        previous_day_total: Number(previous_day_total),
        updated_at: new Date()
      },
      types: {
        activity_date: 'STRING',
        role_code: 'STRING',
        total_delta: 'INT64',
        active_delta: 'INT64',
        previous_day_total: 'INT64',
        updated_at: 'TIMESTAMP'
      }
    });

    console.log(`✅ Flushed ${role_code} ${date}: +${total_delta} total, +${active_delta} active`);
    
  } catch (err) {
    console.error(`dailyActivityETL flush error for ${role_code} ${date}:`, err.message);
  } finally {
    activeRequests--;
  }
}

async function oldUpdateLogic(role_code, activity_date, account_sk) {
  // Keep old implementation as fallback
  const dataset = DEFAULT_DATASET;
  const project = process.env.BIGQUERY_PROJECT_ID;
  const tableId = `\`${project}.${dataset}.fact_daily_account_activity\``;
  
  const date = activity_date || new Date().toISOString().split('T')[0];

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

require('dotenv').config();
const { BigQuery } = require('@google-cloud/bigquery');
const crypto = require('crypto');
const { PrismaClient } = require('@prisma/client');
const { updateDailyActivity } = require('./dailyActivityETL');

const bigquery = new BigQuery({ projectId: process.env.BIGQUERY_PROJECT_ID });
const prisma = new PrismaClient();
const DEFAULT_DATASET = process.env.BIGQUERY_DATASET;

function getPeriod(dt) {
  if (!dt) return null;
  // Lấy giờ địa phương (Vietnam timezone UTC+7)
  const date = new Date(dt);
  const h = date.getHours(); // Local hours, không phải UTC
  if (h >= 5 && h < 12) return 'morning';
  if (h >= 12 && h < 17) return 'afternoon';
  return 'evening';
}

// Tạo session_id từ account_id + login_time (vì schema không có bảng Session)
function generateSessionId(accountId, loginTime) {
  if (!accountId || !loginTime) return null;
  const str = `${accountId}_${new Date(loginTime).toISOString()}`;
  return crypto.createHash('sha256').update(str).digest('hex').substring(0, 32);
}

async function processSessionEvent(event) {
  const op = (event.operation || '').toUpperCase();
  const payload = event.payload || {};
  const dataset = event.dataset || (payload && payload.dataset) || DEFAULT_DATASET;
  const project = process.env.BIGQUERY_PROJECT_ID || bigquery.projectId;
  const tableId = `\`${project}.${dataset}.fact_user_session\``;

  // Lấy thông tin từ payload Account (không có bảng Session riêng)
  const account_sk = payload.account_id || payload.account_sk || null;
  let role_code = payload.role_code || payload.role || null;
  
  // Nếu payload không có role_code, query từ DB
  if (!role_code && account_sk) {
    try {
      const account = await prisma.account.findUnique({
        where: { account_id: Number(account_sk) },
        include: { roleRel: true }
      });
      role_code = account?.roleRel?.code || 'unknown';
    } catch (err) {
      console.warn('sessionETL: failed to fetch role_code', err.message);
      role_code = 'unknown';
    }
  }
  
  // Fallback nếu vẫn null
  if (!role_code) {
    role_code = 'unknown';
  }
  
  // Login/logout time từ Account.last_login_at và Account.last_logout_at
  const login_time = payload.last_login_at || payload.login_time || payload.loginTime || null;
  const logout_time = payload.last_logout_at || payload.logout_time || payload.logoutTime || null;
  
  // Tạo session_id từ account_id + login_time (vì không có bảng Session)
  let session_id = payload.session_id || payload.sessionId || null;
  if (!session_id && account_sk && login_time) {
    session_id = generateSessionId(account_sk, login_time);
  }

  if (!account_sk || !login_time) {
    console.warn('sessionETL: missing account_id or login_time, skipping', { account_sk, login_time });
    return { ok: false, reason: 'missing account_id or login_time' };
  }

  try {
    const durationMin = login_time && logout_time ? Math.round((new Date(logout_time) - new Date(login_time)) / 60000) : null;
    const period = getPeriod(login_time);

    // MERGE: update logout nếu session đã tồn tại, insert nếu chưa
    const mergeSql = `MERGE ${tableId} T
    USING (SELECT @session_id AS session_id, @account_sk AS account_sk, @login_time AS login_time) S
    ON T.session_id = S.session_id OR (T.account_sk = S.account_sk AND T.login_time = S.login_time)
    WHEN MATCHED THEN
      UPDATE SET logout_time = @logout_time, session_duration_min = @session_duration_min, period = @period, role_code = COALESCE(@role_code, T.role_code)
    WHEN NOT MATCHED THEN
      INSERT (session_id, account_sk, role_code, login_time, logout_time, session_duration_min, period, created_at)
      VALUES (@session_id, @account_sk, @role_code, @login_time, @logout_time, @session_duration_min, @period, @created_at)`;

    const params = {
      session_id: String(session_id || ''),
      account_sk: Number(account_sk),
      login_time: login_time ? new Date(login_time) : new Date(),
      logout_time: logout_time ? new Date(logout_time) : null,
      session_duration_min: durationMin !== null ? Number(durationMin) : null,
      period: period || 'unknown',
      role_code: String(role_code),
      created_at: new Date()
    };

    const options = {
      query: mergeSql,
      params,
      types: {
        session_id: 'STRING',
        account_sk: 'INT64',
        login_time: 'TIMESTAMP',
        logout_time: 'TIMESTAMP',
        session_duration_min: 'INT64',
        period: 'STRING',
        role_code: 'STRING',
        created_at: 'TIMESTAMP'
      }
    };

    try {
      await bigquery.query(options);
      
      // Trigger daily activity CHỈ KHI:
      // 1. Login event mới (last_login_at > last_logout_at hoặc logout_time null)
      // 2. First login của user trong ngày
      // KHÔNG trigger khi logout
      
      // Detect login event: login_time phải mới hơn logout_time
      const isLoginEvent = login_time && (
        !logout_time || 
        new Date(login_time) > new Date(logout_time)
      );
      
      console.log(`sessionETL: login=${login_time}, logout=${logout_time}, isLoginEvent=${isLoginEvent}, account_sk=${account_sk}, role=${role_code}`);
      
      if (role_code && isLoginEvent && account_sk) {
        const today = new Date().toISOString().split('T')[0];
        const loginDate = new Date(login_time).toISOString().split('T')[0];
        
        // Chỉ update nếu login_time là hôm nay
        if (loginDate === today) {
          console.log(`sessionETL: triggering daily activity for ${role_code} account ${account_sk}`);
          updateDailyActivity(role_code, today, account_sk).catch(err => {
            console.warn('sessionETL: daily activity update failed', err.message);
          });
        }
      }
      
      return { ok: true, action: logout_time ? 'merge_logout' : 'merge_login' };
    } catch (mergeErr) {
      console.error('sessionETL merge error', mergeErr);
      return { ok: false, error: String(mergeErr) };
    }
  } catch (err) {
    console.error('sessionETL error', err);
    return { ok: false, error: String(err) };
  }
}

module.exports = { processSessionEvent };

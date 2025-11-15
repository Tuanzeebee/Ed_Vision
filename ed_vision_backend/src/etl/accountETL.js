require('dotenv').config();
const { BigQuery } = require('@google-cloud/bigquery');
const { PrismaClient } = require('@prisma/client');
const { updateDailyActivity } = require('./dailyActivityETL');

const bigquery = new BigQuery({ projectId: process.env.BIGQUERY_PROJECT_ID });
const prisma = new PrismaClient();
const DEFAULT_DATASET = process.env.BIGQUERY_DATASET;

/** Upsert account into dim_account */
async function processAccountEvent(event) {
  const op = (event.operation || '').toUpperCase();
  const payload = event.payload || {};
  const dataset = event.dataset || (payload && payload.dataset) || DEFAULT_DATASET;
  const project = process.env.BIGQUERY_PROJECT_ID || bigquery.projectId;
  const tableId = `\`${project}.${dataset}.dim_account\``;

  const account_sk = payload.account_id || payload.account_sk || null;
  const email = payload.email || null;
  let role_code = payload.role_code || payload.role || null;
  const status = payload.status || 'active';
  const created_at = payload.created_at || payload.createdAt || null;
  const updated_at = payload.updated_at || payload.updatedAt || null;

  if (!account_sk || !email) {
    console.warn('accountETL: missing account_sk or email, skipping', { account_sk, email });
    return { ok: false, reason: 'missing required fields' };
  }

  // Nếu payload không có role_code, query từ DB
  if (!role_code && account_sk) {
    try {
      const account = await prisma.account.findUnique({
        where: { account_id: Number(account_sk) },
        include: { roleRel: true }
      });
      role_code = account?.roleRel?.code || 'unknown';
    } catch (err) {
      console.warn('accountETL: failed to fetch role_code', err.message);
      role_code = 'unknown';
    }
  }
  
  // Fallback nếu vẫn null
  if (!role_code) {
    role_code = 'unknown';
  }

  try {
    // Use MERGE to maintain single canonical row per account
    const mergeSql = `MERGE ${tableId} T
    USING (SELECT @account_sk AS account_sk, @email AS email, @role_code AS role_code,
                  @status AS status, @created_at AS created_at, @updated_at AS updated_at) S
    ON T.account_sk = S.account_sk OR (T.email = S.email AND S.email IS NOT NULL)
    WHEN MATCHED THEN
      UPDATE SET email = S.email, role_code = COALESCE(S.role_code, T.role_code), status = S.status, updated_at = S.updated_at
    WHEN NOT MATCHED THEN
      INSERT (account_sk, email, role_code, status, created_at, updated_at)
      VALUES (S.account_sk, S.email, S.role_code, S.status, S.created_at, S.updated_at)`;

    const params = {
      account_sk: Number(account_sk),
      email: String(email),
      role_code: role_code || null,
      status: op === 'DELETE' ? 'deleted' : String(status),
      created_at: created_at ? new Date(created_at) : new Date(),
      updated_at: updated_at ? new Date(updated_at) : new Date()
    };

    const options = {
      query: mergeSql,
      params,
      types: {
        account_sk: 'INT64',
        email: 'STRING',
        role_code: 'STRING',
        status: 'STRING',
        created_at: 'TIMESTAMP',
        updated_at: 'TIMESTAMP'
      }
    };

    try {
      await bigquery.query(options);
      
      // Trigger daily activity update CHỈ KHI Account mới (INSERT)
      // KHÔNG trigger khi UPDATE vì:
      // - Login/logout được handle bởi sessionETL
      // - Status change không có old_status để compare
      if (role_code && op === 'INSERT') {
        console.log(`accountETL: new account created, updating daily activity for ${role_code}`);
        updateDailyActivity(role_code).catch(err => {
          console.warn('accountETL: daily activity update failed', err.message);
        });
      }
      
      return { ok: true, action: 'merge_upsert' };
    } catch (err) {
      console.error('accountETL merge error', err);
      return { ok: false, error: String(err) };
    }
  } catch (err) {
    console.error('accountETL error', err);
    return { ok: false, error: String(err) };
  }
}

module.exports = { processAccountEvent };

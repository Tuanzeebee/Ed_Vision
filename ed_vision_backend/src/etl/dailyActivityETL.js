require('dotenv').config();
const { BigQuery } = require('@google-cloud/bigquery');
const bigquery = new BigQuery({ projectId: process.env.BIGQUERY_PROJECT_ID });
const DEFAULT_DATASET = process.env.BIGQUERY_DATASET;

async function processDailyActivityEvent(event) {
  const op = (event.operation || '').toUpperCase();
  const payload = event.payload || {};
  const dataset = event.dataset || (payload && payload.dataset) || DEFAULT_DATASET;
  const project = process.env.BIGQUERY_PROJECT_ID || bigquery.projectId;
  const tableId = `\`${project}.${dataset}.fact_daily_account_activity\``;

  const activity_date = payload.activity_date || payload.date || null;
  const role_code = payload.role_code || payload.role || null;
  const total_accounts = payload.total_accounts != null ? Number(payload.total_accounts) : null;
  const active_accounts = payload.active_accounts != null ? Number(payload.active_accounts) : null;
  const performance_rate = payload.performance_rate != null ? Number(payload.performance_rate) : null;
  const updated_at = payload.updated_at || payload.updatedAt || null;

  if (!activity_date || !role_code) {
    console.warn('dailyActivityETL: missing activity_date or role_code, skipping');
    return { ok: false, reason: 'missing keys' };
  }

  try {
    const mergeSql = `MERGE ${tableId} T
    USING (SELECT @activity_date AS activity_date, @role_code AS role_code, @total_accounts AS total_accounts, @active_accounts AS active_accounts, @performance_rate AS performance_rate, @updated_at AS updated_at) S
    ON T.activity_date = S.activity_date AND T.role_code = S.role_code
    WHEN MATCHED THEN
      UPDATE SET total_accounts = S.total_accounts, active_accounts = S.active_accounts, performance_rate = S.performance_rate, updated_at = COALESCE(S.updated_at, T.updated_at)
    WHEN NOT MATCHED THEN
      INSERT (activity_date, role_code, total_accounts, active_accounts, performance_rate, updated_at)
      VALUES (S.activity_date, S.role_code, S.total_accounts, S.active_accounts, S.performance_rate, S.updated_at)`;

    const params = { activity_date, role_code, total_accounts, active_accounts, performance_rate, updated_at: updated_at ? new Date(updated_at) : null };
    await bigquery.query({ query: mergeSql, params });
    return { ok: true, action: 'upsert' };
  } catch (err) {
    console.error('dailyActivityETL error', err);
    return { ok: false, error: String(err) };
  }
}

module.exports = { processDailyActivityEvent };

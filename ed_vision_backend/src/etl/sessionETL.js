require('dotenv').config();
const { BigQuery } = require('@google-cloud/bigquery');
const bigquery = new BigQuery({ projectId: process.env.BIGQUERY_PROJECT_ID });
const DEFAULT_DATASET = process.env.BIGQUERY_DATASET;

function getPeriod(dt) {
  if (!dt) return null;
  const h = new Date(dt).getUTCHours();
  if (h >= 5 && h < 12) return 'morning';
  if (h >= 12 && h < 17) return 'afternoon';
  return 'evening';
}

async function processSessionEvent(event) {
  const op = (event.operation || '').toUpperCase();
  const payload = event.payload || {};
  const dataset = event.dataset || (payload && payload.dataset) || DEFAULT_DATASET;
  const project = process.env.BIGQUERY_PROJECT_ID || bigquery.projectId;
  const tableId = `\`${project}.${dataset}.fact_user_session\``;

  const session_id = payload.session_id || payload.sessionId || null;
  const account_sk = payload.account_id || payload.account_sk || null;
  const role_code = payload.role_code || payload.role || null;
  const login_time = payload.login_time || payload.loginTime || payload.created_at || null;
  const logout_time = payload.logout_time || payload.logoutTime || null;
  const created_at = payload.created_at || null;

  if (!session_id) {
    console.warn('sessionETL: missing session_id, skipping');
    return { ok: false, reason: 'missing session_id' };
  }

  try {
    const durationMin = login_time && logout_time ? Math.round((new Date(logout_time) - new Date(login_time)) / 60000) : null;
    const period = getPeriod(login_time);

    // If this is an UPDATE that contains logout_time, try to MERGE/UPDATE the existing session row
    if (op === 'UPDATE' && logout_time) {
      const mergeSql = `MERGE ${tableId} T
      USING (SELECT @session_id AS session_id, @account_sk AS account_sk, @login_time AS login_time, @logout_time AS logout_time,
                    @session_duration_min AS session_duration_min, @period AS period, @updated_at AS updated_at) S
      ON (T.session_id IS NOT NULL AND S.session_id IS NOT NULL AND T.session_id = S.session_id)
         OR (T.account_sk = S.account_sk AND T.login_time = S.login_time)
      WHEN MATCHED THEN
        UPDATE SET logout_time = S.logout_time, session_duration_min = S.session_duration_min, period = S.period, updated_at = COALESCE(S.updated_at, T.updated_at)
      WHEN NOT MATCHED THEN
        INSERT (session_id, account_sk, role_code, login_time, logout_time, session_duration_min, period, created_at)
        VALUES (S.session_id, S.account_sk, @role_code, S.login_time, S.logout_time, S.session_duration_min, S.period, S.updated_at)`;

      const params = {
        session_id,
        account_sk: account_sk != null ? Number(account_sk) : null,
        login_time: login_time ? new Date(login_time) : null,
        logout_time: logout_time ? new Date(logout_time) : null,
        session_duration_min: durationMin,
        period,
        updated_at: logout_time ? new Date(logout_time) : (created_at ? new Date(created_at) : new Date()),
        role_code
      };

      try {
        await bigquery.query({ query: mergeSql, params });
        return { ok: true, action: 'merge_update' };
      } catch (mergeErr) {
        console.error('sessionETL merge error', mergeErr);
        return { ok: false, error: String(mergeErr) };
      }
    }

    // Otherwise treat as INSERT (login event or full session payload)
    const row = {
      session_id,
      account_sk: account_sk != null ? Number(account_sk) : null,
      role_code,
      login_time: login_time ? new Date(login_time) : null,
      logout_time: logout_time ? new Date(logout_time) : null,
      session_duration_min: durationMin,
      period,
      created_at: created_at ? new Date(created_at) : new Date(),
      etl_op: op || 'INSERT'
    };

    try {
      await bigquery.dataset(dataset).table('fact_user_session').insert([row], { ignoreUnknownValues: true });
      return { ok: true, action: 'insert' };
    } catch (insErr) {
      console.error('sessionETL insert error', insErr);
      return { ok: false, error: String(insErr) };
    }
  } catch (err) {
    console.error('sessionETL error', err);
    return { ok: false, error: String(err) };
  }
}

module.exports = { processSessionEvent };

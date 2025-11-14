require('dotenv').config();
const { BigQuery } = require('@google-cloud/bigquery');
const bigquery = new BigQuery({ projectId: process.env.BIGQUERY_PROJECT_ID });
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
  const role_code = payload.role_code || payload.role || null;
  const status = payload.status || null;
  const created_at = payload.created_at || payload.createdAt || null;
  const updated_at = payload.updated_at || payload.updatedAt || null;

  try {
    const row = {
      account_sk: account_sk != null ? Number(account_sk) : null,
      email,
      role_code,
      status: op === 'DELETE' ? 'deleted' : status,
      created_at: created_at ? new Date(created_at) : new Date(),
      updated_at: updated_at ? new Date(updated_at) : new Date(),
    };

    try {
      await bigquery.dataset(dataset).table('dim_account').insert([row], { ignoreUnknownValues: true });
      return { ok: true, action: op === 'DELETE' ? 'tombstone' : 'insert' };
    } catch (err) {
      console.error('accountETL insert error', err);
      return { ok: false, error: String(err) };
    }
  } catch (err) {
    console.error('accountETL error', err);
    return { ok: false, error: String(err) };
  }
}

module.exports = { processAccountEvent };

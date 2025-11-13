require('dotenv').config();
const { BigQuery } = require('@google-cloud/bigquery');

async function main() {
  const projectId = process.env.BIGQUERY_PROJECT_ID;
  const datasetId = process.env.BIGQUERY_DATASET;
  const tableId = process.argv[2] || process.env.BIGQUERY_TABLE || 'fact_user_session';

  if (!projectId || !datasetId) {
    console.error('Missing BIGQUERY_PROJECT_ID or BIGQUERY_DATASET in environment');
    process.exit(2);
  }

  const bigquery = new BigQuery({ projectId });

  const row = {
    session_id: `test-sess-${Date.now()}`,
    account_sk: 999999,
    role_code: 'test',
    login_time: new Date().toISOString(),
    logout_time: null,
    session_duration_min: null,
    period: 'morning',
    created_at: new Date().toISOString(),
    etl_op: 'TEST_INSERT'
  };

  try {
    console.log(`Inserting test row into ${projectId}.${datasetId}.${tableId}`);
    const dataset = bigquery.dataset(datasetId);
    const table = dataset.table(tableId);
    await table.insert([row], { ignoreUnknownValues: true });
    console.log('BigQuery insert successful — check table for the test row.');
  } catch (err) {
    console.error('BigQuery insert failed:', err && err.errors ? err.errors : err);
    if (err && err.message) console.error('Message:', err.message);
    process.exitCode = 3;
  }
}

main();

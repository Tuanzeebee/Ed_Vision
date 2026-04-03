/**
 * Script để tính toán fact_daily_account_activity từ fact_user_session
 * Chạy hàng ngày hoặc theo yêu cầu để aggregate session data
 */

require('dotenv').config();
const { BigQuery } = require('@google-cloud/bigquery');
const bigquery = new BigQuery({ projectId: process.env.BIGQUERY_PROJECT_ID });
const DATASET = process.env.BIGQUERY_DATASET || 'khanh_dw';

async function aggregateDailyActivity(targetDate) {
  // Default to yesterday if no date provided
  const date = targetDate || new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  
  console.log(`Aggregating daily activity for date: ${date}`);

  const sql = `
    MERGE \`${process.env.BIGQUERY_PROJECT_ID}.${DATASET}.fact_daily_account_activity\` T
    USING (
      SELECT
        DATE(login_time) AS activity_date,
        role_code,
        COUNT(DISTINCT account_sk) AS active_accounts,
        (SELECT COUNT(DISTINCT account_sk) FROM \`${process.env.BIGQUERY_PROJECT_ID}.${DATASET}.dim_account\` WHERE role_code = s.role_code) AS total_accounts,
        ROUND(COUNT(DISTINCT account_sk) * 100.0 / NULLIF((SELECT COUNT(DISTINCT account_sk) FROM \`${process.env.BIGQUERY_PROJECT_ID}.${DATASET}.dim_account\` WHERE role_code = s.role_code), 0), 2) AS performance_rate,
        CURRENT_TIMESTAMP() AS updated_at
      FROM \`${process.env.BIGQUERY_PROJECT_ID}.${DATASET}.fact_user_session\` s
      WHERE DATE(login_time) = @target_date
      GROUP BY DATE(login_time), role_code
    ) S
    ON T.activity_date = S.activity_date AND T.role_code = S.role_code
    WHEN MATCHED THEN
      UPDATE SET 
        total_accounts = S.total_accounts,
        active_accounts = S.active_accounts,
        performance_rate = S.performance_rate,
        updated_at = S.updated_at
    WHEN NOT MATCHED THEN
      INSERT (activity_date, role_code, total_accounts, active_accounts, performance_rate, updated_at)
      VALUES (S.activity_date, S.role_code, S.total_accounts, S.active_accounts, S.performance_rate, S.updated_at)
  `;

  try {
    const [job] = await bigquery.createQueryJob({
      query: sql,
      params: { target_date: date },
      types: { target_date: 'DATE' }
    });

    console.log(`Job ${job.id} started.`);
    const [rows] = await job.getQueryResults();
    console.log(` Aggregated daily activity for ${date}. Rows affected: ${rows.length}`);
  } catch (err) {
    console.error(' Aggregation failed:', err);
    process.exit(1);
  }
}

// Run for specific date or yesterday
const targetDate = process.argv[2]; // YYYY-MM-DD format
aggregateDailyActivity(targetDate).then(() => {
  console.log('Done!');
  process.exit(0);
}).catch(err => {
  console.error('Error:', err);
  process.exit(1);
});

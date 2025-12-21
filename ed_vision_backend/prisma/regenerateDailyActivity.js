require('dotenv').config();
const { BigQuery } = require('@google-cloud/bigquery');
const bigquery = new BigQuery();

async function regenerateDailyActivity() {
  const dataset = process.env.BIGQUERY_DATASET || 'edvision_dw';
  const project = process.env.BIGQUERY_PROJECT_ID;

  console.log('🔄 Regenerating fact_daily_account_activity...\n');

  // Step 1: Delete old data
  console.log('🗑️  Step 1: Deleting old data...');
  await bigquery.query({
    query: `DELETE FROM \`${project}.${dataset}.fact_daily_account_activity\` WHERE 1=1`
  });
  console.log('   ✅ Deleted old data\n');

  // Step 2: Insert from sessions
  console.log('📊 Step 2: Calculating daily activity from sessions...');
  const insertQuery = `
    INSERT INTO \`${project}.${dataset}.fact_daily_account_activity\` (
      activity_date,
      role_code,
      total_accounts,
      active_accounts,
      performance_rate,
      updated_at
    )
    WITH 
      -- Count total accounts by role từ dim_account (thực tế)
      total_by_role AS (
        SELECT 
          role_code,
          COUNT(*) as total_accounts
        FROM \`${project}.${dataset}.dim_account\`
        GROUP BY role_code
      ),
      
      -- Count active accounts per day from sessions
      daily_active AS (
        SELECT 
          DATE(login_time) as activity_date,
          role_code,
          COUNT(DISTINCT account_sk) as active_accounts
        FROM \`${project}.${dataset}.fact_user_session\`
        GROUP BY activity_date, role_code
      ),
      
      -- Get all unique dates from sessions
      all_dates AS (
        SELECT DISTINCT DATE(login_time) as activity_date 
        FROM \`${project}.${dataset}.fact_user_session\`
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
    ORDER BY activity_date DESC, role_code
  `;

  await bigquery.query({ query: insertQuery });
  console.log('   ✅ Inserted daily activity data\n');

  // Step 3: Verify
  console.log('🔍 Step 3: Verifying results...');
  const [rows] = await bigquery.query({
    query: `
      SELECT 
        role_code,
        COUNT(*) as days_tracked,
        ROUND(AVG(performance_rate), 4) as avg_performance,
        ROUND(MAX(performance_rate), 4) as max_performance,
        SUM(active_accounts) as total_active_across_days
      FROM \`${project}.${dataset}.fact_daily_account_activity\`
      GROUP BY role_code
      ORDER BY role_code
    `
  });

  console.log('┌─────────────────────────────────────────────────────────────┐');
  console.log('│              DAILY ACTIVITY SUMMARY                         │');
  console.log('├─────────────────────────────────────────────────────────────┤');
  rows.forEach(r => {
    console.log(`│ ${r.role_code.padEnd(10)} │ ${String(r.days_tracked).padStart(4)} days │ Avg: ${String(r.avg_performance).padStart(6)} │ Max: ${String(r.max_performance).padStart(6)} │`);
  });
  console.log('└─────────────────────────────────────────────────────────────┘');

  // Sample data
  console.log('\n📊 Sample data (latest 10 rows):');
  const [samples] = await bigquery.query({
    query: `
      SELECT activity_date, role_code, total_accounts, active_accounts, performance_rate
      FROM \`${project}.${dataset}.fact_daily_account_activity\`
      ORDER BY activity_date DESC, role_code
      LIMIT 10
    `
  });
  
  samples.forEach(s => {
    console.log(`   ${s.activity_date.value} | ${s.role_code.padEnd(10)} | Total: ${String(s.total_accounts).padStart(4)} | Active: ${String(s.active_accounts).padStart(4)} | Rate: ${s.performance_rate}`);
  });

  console.log('\n✅ Done!');
}

regenerateDailyActivity().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});

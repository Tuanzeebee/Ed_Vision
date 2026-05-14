const { Client } = require('pg');
require('dotenv').config();

async function main() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  try {
    const res = await client.query("SELECT name, default_version FROM pg_available_extensions WHERE name LIKE '%vector%'");
    console.log('Available vector extensions:', JSON.stringify(res.rows));
    
    const pgVersion = await client.query("SELECT version()");
    console.log('PostgreSQL version:', pgVersion.rows[0].version);
  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    await client.end();
  }
}

main();

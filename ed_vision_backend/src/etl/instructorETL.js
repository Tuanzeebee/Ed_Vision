require('dotenv').config();
const { BigQuery } = require('@google-cloud/bigquery');
const { PrismaClient } = require('@prisma/client');
const { throttler } = require('./bigQueryThrottler');
const prisma = new PrismaClient();

const bigquery = new BigQuery({ projectId: process.env.BIGQUERY_PROJECT_ID });
const DEFAULT_DATASET = process.env.BIGQUERY_DATASET;

async function processInstructorEvent(event) {
  const op = (event.operation || '').toUpperCase();
  const payload = event.payload || {};
  const dataset = event.dataset || (payload && payload.dataset) || DEFAULT_DATASET;
  const project = process.env.BIGQUERY_PROJECT_ID || bigquery.projectId;
  const tableId = `\`${project}.${dataset}.dim_instructor\``;

  let instructor_sk = payload.instructor_id || payload.instructor_sk || null;
  const account_id = payload.account_id || null;
  const employee_code = payload.employee_code || payload.employeeCode || null;
  let full_name = payload.full_name || payload.fullName || null;
  const position = payload.position || null;
  const status = payload.status || 'active';
  const created_at = payload.created_at || null;
  let department_name = payload.department_name || null;

  if (!instructor_sk || !account_id) {
    console.warn('instructorETL: missing instructor_sk or account_id, skipping');
    return { ok: false, reason: 'missing required fields' };
  }

  // Query Profile for full_name and Department for department_name
  try {
    const inst = await prisma.instructor.findUnique({
      where: { instructor_id: Number(instructor_sk) },
      include: {
        account: { include: { profile: true } },
        department: true
      }
    });
    
    if (inst) {
      if (!full_name && inst.account?.profile?.full_name) {
        full_name = inst.account.profile.full_name;
      }
      if (!department_name && inst.department?.name) {
        department_name = inst.department.name;
      }
    }
  } catch (e) {
    console.warn('instructorETL: prisma lookup failed', e.message || e);
  }

  // Fallbacks
  if (!full_name) full_name = 'Unknown';
  if (!department_name) department_name = 'Unknown';

  try {
    if (op === 'DELETE') {
      const deleteSql = `DELETE FROM ${tableId} WHERE instructor_sk = @instructor_sk OR instructor_sk IS NULL AND account_id = @account_id`;
      await throttler.execute(() => bigquery.query({ query: deleteSql, params: { instructor_sk: instructor_sk ? Number(instructor_sk) : null, account_id: account_id ? Number(account_id) : null } }));
      return { ok: true, action: 'delete' };
    }

    const mergeSql = `MERGE ${tableId} T
    USING (SELECT @instructor_sk AS instructor_sk, @account_id AS account_id, @employee_code AS employee_code, @full_name AS full_name,
                  @department_name AS department_name, @position AS position, @status AS status, @created_at AS created_at) S
    ON T.instructor_sk = S.instructor_sk
    WHEN MATCHED THEN
      UPDATE SET account_id = S.account_id, employee_code = S.employee_code, full_name = S.full_name, department_name = S.department_name, position = S.position, status = S.status, created_at = COALESCE(T.created_at, S.created_at)
    WHEN NOT MATCHED THEN
      INSERT (instructor_sk, account_id, employee_code, full_name, department_name, position, status, created_at)
      VALUES (S.instructor_sk, S.account_id, S.employee_code, S.full_name, S.department_name, S.position, S.status, S.created_at)`;

    const params = {
      instructor_sk: Number(instructor_sk),
      account_id: Number(account_id),
      employee_code: String(employee_code || ''),
      full_name: String(full_name),
      department_name: String(department_name),
      position: String(position || ''),
      status: String(status),
      created_at: created_at ? new Date(created_at) : new Date()
    };

    const options = {
      query: mergeSql,
      params,
      types: {
        instructor_sk: 'INT64',
        account_id: 'INT64',
        employee_code: 'STRING',
        full_name: 'STRING',
        department_name: 'STRING',
        position: 'STRING',
        status: 'STRING',
        created_at: 'TIMESTAMP'
      }
    };

    await throttler.execute(() => bigquery.query(options));
    return { ok: true, action: 'upsert' };
  } catch (err) {
    console.error('instructorETL error', err);
    return { ok: false, error: String(err) };
  }
}

module.exports = { processInstructorEvent };

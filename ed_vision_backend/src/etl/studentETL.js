require('dotenv').config();
const { BigQuery } = require('@google-cloud/bigquery');

const bigquery = new BigQuery({ projectId: process.env.BIGQUERY_PROJECT_ID });
const DEFAULT_DATASET = process.env.BIGQUERY_DATASET;
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Process a student-related event coming from event_log trigger.
 * Expected event.payload to be an object containing student/account fields.
 * Supports INSERT, UPDATE -> MERGE upsert; DELETE -> DELETE from dim table.
 */
async function processStudentEvent(event) {
  const op = (event.operation || '').toUpperCase();
  const payload = event.payload || {};

  const account_id = payload.account_id || null;
  const student_code = payload.student_code || null;
  let full_name = payload.full_name || payload.fullname || null;
  const major = payload.major || null;
  const cohort_year = payload.cohort_year || null;
  let class_code = payload.class_code || null;
  const status = payload.status || 'active';
  const created_at = payload.created_at || payload.createdAt || null;
  let department_name = payload.department_name || null;

  let student_sk = payload.student_id || payload.student_sk || null;
  
  if (!student_sk || !account_id) {
    console.warn('studentETL: missing student_sk or account_id, skipping');
    return { ok: false, reason: 'missing required fields' };
  }

  // Query Profile for full_name and ClassGroup for class_code
  try {
    const student = await prisma.student.findUnique({
      where: { student_id: Number(student_sk) },
      include: {
        account: { include: { profile: true } },
        classGroup: { include: { program: { include: { department: true } } } }
      }
    });
    
    if (student) {
      if (!full_name && student.account?.profile?.full_name) {
        full_name = student.account.profile.full_name;
      }
      if (!class_code && student.classGroup?.class_code) {
        class_code = student.classGroup.class_code;
      }
      if (!department_name && student.classGroup?.program?.department?.name) {
        department_name = student.classGroup.program.department.name;
      }
    }
  } catch (e) {
    console.warn('studentETL: prisma lookup failed', e.message || e);
  }

  // Fallbacks
  if (!full_name) full_name = 'Unknown';
  if (!class_code) class_code = 'N/A';
  if (!department_name) department_name = 'Unknown';

  // allow dataset override from event (per-member dataset) or payload.dataset
  const dataset = event.dataset || (payload && payload.dataset) || DEFAULT_DATASET;
  const project = process.env.BIGQUERY_PROJECT_ID || bigquery.projectId;
  const tableId = `\`${project}.${dataset}.dim_student\``;

  try {
    // Use MERGE to maintain single canonical row per student
    const mergeSql = `MERGE ${tableId} T
    USING (SELECT @student_sk AS student_sk, @account_id AS account_id, @student_code AS student_code,
                  @full_name AS full_name, @major AS major, @department_name AS department_name,
                  @cohort_year AS cohort_year, @class_code AS class_code, @status AS status, @created_at AS created_at) S
    ON T.student_sk = S.student_sk OR (T.account_id = S.account_id AND S.account_id IS NOT NULL)
    WHEN MATCHED THEN
      UPDATE SET student_code = S.student_code, full_name = S.full_name, major = S.major,
                 department_name = S.department_name, cohort_year = S.cohort_year,
                 class_code = S.class_code, status = S.status
    WHEN NOT MATCHED THEN
      INSERT (student_sk, account_id, student_code, full_name, major, department_name, cohort_year, class_code, status, created_at)
      VALUES (S.student_sk, S.account_id, S.student_code, S.full_name, S.major, S.department_name, S.cohort_year, S.class_code, S.status, S.created_at)`;

    const params = {
      student_sk: Number(student_sk),
      account_id: Number(account_id),
      student_code: String(student_code || ''),
      full_name: String(full_name),
      major: String(major || ''),
      department_name: String(department_name),
      cohort_year: cohort_year != null ? Number(cohort_year) : null,
      class_code: String(class_code),
      status: op === 'DELETE' ? 'deleted' : String(status),
      created_at: created_at ? new Date(created_at) : new Date()
    };

    const options = {
      query: mergeSql,
      params,
      types: {
        student_sk: 'INT64',
        account_id: 'INT64',
        student_code: 'STRING',
        full_name: 'STRING',
        major: 'STRING',
        department_name: 'STRING',
        cohort_year: 'INT64',
        class_code: 'STRING',
        status: 'STRING',
        created_at: 'TIMESTAMP'
      }
    };

    try {
      await bigquery.query(options);
      return { ok: true, action: 'merge_upsert' };
    } catch (err) {
      console.error('studentETL merge error', err);
      return { ok: false, error: String(err) };
    }
  } catch (err) {
    console.error('studentETL error', err);
    return { ok: false, error: String(err) };
  }
}

module.exports = { processStudentEvent };

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

  // prefer account_id as natural key
  const account_id = payload.account_id || null;
  const student_code = payload.student_code || null;
  const full_name = payload.full_name || payload.fullname || payload.full_name || null;
  const major = payload.major || null;
  const cohort_year = payload.cohort_year || null;
  const class_code = payload.class_code || payload.classId || null;
  const status = payload.status || null;
  const created_at = payload.created_at || payload.createdAt || null;

  // determine surrogate key student_sk: prefer payload.student_id, then try lookup by account_id
  let student_sk = payload.student_id || payload.student_sk || null;
  if (!student_sk && account_id) {
    try {
      const studentRow = await prisma.student.findUnique({ where: { account_id: Number(account_id) }, select: { student_id: true } });
      if (studentRow && studentRow.student_id) student_sk = studentRow.student_id;
    } catch (e) {
      // lookup failure is non-fatal; we'll continue without student_sk
      console.warn('studentETL: prisma lookup failed for account_id', account_id, e.message || e);
    }
  }

  if (!account_id) {
    console.warn('studentETL: missing account_id in payload, skipping');
    return { ok: false, reason: 'missing account_id' };
  }

  // allow dataset override from event (per-member dataset) or payload.dataset
  const dataset = event.dataset || (payload && payload.dataset) || DEFAULT_DATASET;
  const project = process.env.BIGQUERY_PROJECT_ID || bigquery.projectId;
  const tableId = `\`${project}.${dataset}.dim_student\``;

  try {
    const row = {
      student_sk: student_sk != null ? Number(student_sk) : null,
      account_id: Number(account_id),
      student_code,
      full_name,
      major,
      department_name: null,
      cohort_year: cohort_year != null ? Number(cohort_year) : null,
      class_code,
      status: op === 'DELETE' ? 'deleted' : status,
      created_at: created_at ? new Date(created_at) : new Date(),
      updated_at: new Date(),
    };

    try {
      await bigquery.dataset(dataset).table('dim_student').insert([row], { ignoreUnknownValues: true });
      return { ok: true, action: op === 'DELETE' ? 'tombstone' : 'insert' };
    } catch (err) {
      console.error('studentETL insert error', err);
      return { ok: false, error: String(err) };
    }
  } catch (err) {
    console.error('studentETL error', err);
    return { ok: false, error: String(err) };
  }
}

module.exports = { processStudentEvent };

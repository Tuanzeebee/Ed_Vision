require('dotenv').config();
const { BigQuery } = require('@google-cloud/bigquery');

const bigquery = new BigQuery({ projectId: process.env.BIGQUERY_PROJECT_ID });
const DEFAULT_DATASET = process.env.BIGQUERY_DATASET;
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Process appointment/advising events and push into fact_advising_activity
 * Expected payload contains advising info (appointment_id, student_id, instructor_id, created_at, status)
 */
async function processAppointmentEvent(event) {
  const op = (event.operation || '').toUpperCase();
  const payload = event.payload || {};

  const advising_id = payload.appointment_id || payload.appointment_id || null;
  // student_sk should be the original Student.student_id (surrogate). Prefer payload.student_id (if it's student_id),
  // otherwise try payload.student_account_id or account lookup
  let student_sk = payload.student_id || null;
  const student_account_id = payload.student_account_id || payload.student_account_id || null;
  const instructor_id = payload.instructor_id || null;
  const advising_date = payload.created_at || payload.appointment_date || null;
  const status = payload.status || null;

  const dataset = event.dataset || (payload && payload.dataset) || DEFAULT_DATASET;
  const project = process.env.BIGQUERY_PROJECT_ID || bigquery.projectId;
  const tableId = `\`${project}.${dataset}.fact_advising_activity\``;

  try {
    if (!advising_id) {
      console.warn('appointmentETL: missing advising_id (appointment_id), skipping');
      return { ok: false, reason: 'missing advising_id' };
    }

    // resolve student_sk from account if needed
    if (!student_sk && student_account_id) {
      try {
        const studentRow = await prisma.student.findUnique({ where: { account_id: Number(student_account_id) }, select: { student_id: true } });
        if (studentRow && studentRow.student_id) student_sk = studentRow.student_id;
      } catch (e) {
        console.warn('appointmentETL: prisma lookup failed for student_account_id', student_account_id, e.message || e);
      }
    }

    // resolve instructor_sk if payload provided instructor_account_id instead of instructor_id
    let instructor_sk = instructor_id || null;
    const instructor_account_id = payload.instructor_account_id || null;
    if (!instructor_sk && instructor_account_id) {
      try {
        const instrRow = await prisma.instructor.findUnique({ where: { account_id: Number(instructor_account_id) }, select: { instructor_id: true } });
        if (instrRow && instrRow.instructor_id) instructor_sk = instrRow.instructor_id;
      } catch (e) {
        console.warn('appointmentETL: prisma lookup failed for instructor_account_id', instructor_account_id, e.message || e);
      }
    }

    // INSERT-ONLY behavior: always append an activity row. For deletes, write a tombstone with status='deleted'.
    const row = {
      advising_id: Number(advising_id),
      student_sk: student_sk != null ? Number(student_sk) : null,
      instructor_sk: instructor_sk != null ? Number(instructor_sk) : null,
      advising_date: advising_date ? new Date(advising_date) : new Date(),
      status: op === 'DELETE' ? 'deleted' : status,
      created_at: advising_date ? new Date(advising_date) : new Date(),
      etl_op: op || 'INSERT'
    };

    try {
      await bigquery.dataset(dataset).table('fact_advising_activity').insert([row], { ignoreUnknownValues: true });
      return { ok: true, action: op === 'DELETE' ? 'tombstone' : 'insert' };
    } catch (err) {
      console.error('appointmentETL insert error', err);
      return { ok: false, error: String(err) };
    }
  } catch (err) {
    console.error('appointmentETL error', err);
    return { ok: false, error: String(err) };
  }
}

module.exports = { processAppointmentEvent };

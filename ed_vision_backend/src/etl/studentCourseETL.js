require('dotenv').config();
const { BigQuery } = require('@google-cloud/bigquery');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bigquery = new BigQuery({ projectId: process.env.BIGQUERY_PROJECT_ID });
const DEFAULT_DATASET = process.env.BIGQUERY_DATASET;

async function processStudentCourseEvent(event) {
  const op = (event.operation || '').toUpperCase();
  const payload = event.payload || {};
  const dataset = event.dataset || (payload && payload.dataset) || DEFAULT_DATASET;
  const project = process.env.BIGQUERY_PROJECT_ID || bigquery.projectId;
  const tableId = `\`${project}.${dataset}.fact_student_course_performance\``;

  const record_sk = payload.record_id || payload.record_sk || null;
  let student_sk = payload.student_id || payload.student_sk || null;
  const academic_year = payload.academic_year || null;
  const semester_number = payload.semester_number != null ? Number(payload.semester_number) : null;
  const raw_score = payload.raw_score != null ? Number(payload.raw_score) : null;
  const numeric_score = payload.numeric_score != null ? Number(payload.numeric_score) : null;
  const gpa_category = payload.gpa_category || null;
  const updated_at = payload.updated_at || payload.updatedAt || null;

  // try resolve student_sk by account id if needed
  if (!student_sk && payload.account_id) {
    try {
      const s = await prisma.student.findUnique({ where: { account_id: Number(payload.account_id) }, select: { student_id: true } });
      if (s) student_sk = s.student_id;
    } catch (e) {
      console.warn('studentCourseETL: prisma lookup failed', e.message || e);
    }
  }

  try {
    if (op === 'DELETE') {
      const deleteSql = `DELETE FROM ${tableId} WHERE record_sk = @record_sk`;
      await bigquery.query({ query: deleteSql, params: { record_sk: record_sk != null ? Number(record_sk) : null } });
      return { ok: true, action: 'delete' };
    }

    // Prefer UPSERT keyed by (student_sk, academic_year, semester_number) so re-calculations can upsert
    const mergeSql = `MERGE ${tableId} T
    USING (SELECT @record_sk AS record_sk, @student_sk AS student_sk, @academic_year AS academic_year, @semester_number AS semester_number,
                  @raw_score AS raw_score, @numeric_score AS numeric_score, @gpa_category AS gpa_category, @updated_at AS updated_at) S
    ON T.student_sk = S.student_sk AND T.academic_year = S.academic_year AND T.semester_number = S.semester_number
    WHEN MATCHED THEN
      UPDATE SET record_sk = COALESCE(S.record_sk, T.record_sk), student_sk = S.student_sk, academic_year = S.academic_year, semester_number = S.semester_number,
                 raw_score = S.raw_score, numeric_score = S.numeric_score, gpa_category = S.gpa_category, updated_at = COALESCE(S.updated_at, T.updated_at)
    WHEN NOT MATCHED THEN
      INSERT (record_sk, student_sk, academic_year, semester_number, raw_score, numeric_score, gpa_category, updated_at)
      VALUES (S.record_sk, S.student_sk, S.academic_year, S.semester_number, S.raw_score, S.numeric_score, S.gpa_category, S.updated_at)`;

    const params = { record_sk: record_sk != null ? Number(record_sk) : null, student_sk: student_sk != null ? Number(student_sk) : null, academic_year, semester_number, raw_score, numeric_score, gpa_category, updated_at: updated_at ? new Date(updated_at) : null };
    await bigquery.query({ query: mergeSql, params });
    return { ok: true, action: 'upsert' };
  } catch (err) {
    console.error('studentCourseETL error', err);
    return { ok: false, error: String(err) };
  }
}

module.exports = { processStudentCourseEvent };

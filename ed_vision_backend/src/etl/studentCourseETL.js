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
  let academic_year = payload.academic_year || null;
  let semester_number = payload.semester_number != null ? Number(payload.semester_number) : null;
  const raw_score = payload.raw_score != null ? Number(payload.raw_score) : null;
  const numeric_score = payload.converted_numeric_score != null ? Number(payload.converted_numeric_score) : (payload.numeric_score != null ? Number(payload.numeric_score) : null);
  let gpa_category = payload.gpa_category || null;
  const updated_at = payload.updated_at || payload.updatedAt || null;

  // Try resolve student_sk and enrich data from term
  if (!student_sk && payload.account_id) {
    try {
      const s = await prisma.student.findUnique({ where: { account_id: Number(payload.account_id) }, select: { student_id: true } });
      if (s) student_sk = s.student_id;
    } catch (e) {
      console.warn('studentCourseETL: prisma lookup failed', e.message || e);
    }
  }

  // Try enrich academic_year and semester from term_id
  if ((!academic_year || !semester_number) && payload.term_id) {
    try {
      const term = await prisma.academicTerm.findUnique({ where: { term_id: Number(payload.term_id) } });
      if (term) {
        if (!academic_year) academic_year = term.academic_year;
        if (semester_number === null) semester_number = term.semester_number;
      }
    } catch (e) {
      console.warn('studentCourseETL: term lookup failed', e.message || e);
    }
  }

  // Calculate GPA category if missing
  if (!gpa_category && numeric_score !== null) {
    if (numeric_score >= 8.5) gpa_category = 'excellent';
    else if (numeric_score >= 7.0) gpa_category = 'good';
    else if (numeric_score >= 5.0) gpa_category = 'average';
    else gpa_category = 'below_average';
  }

  if (!student_sk || !academic_year || semester_number === null) {
    console.warn('studentCourseETL: missing required fields', { student_sk, academic_year, semester_number });
    return { ok: false, reason: 'missing required fields' };
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

    const params = {
      record_sk: record_sk != null ? Number(record_sk) : null,
      student_sk: Number(student_sk),
      academic_year: String(academic_year),
      semester_number: Number(semester_number),
      raw_score,
      numeric_score,
      gpa_category: String(gpa_category || 'unknown'),
      updated_at: updated_at ? new Date(updated_at) : new Date()
    };

    const options = {
      query: mergeSql,
      params,
      types: {
        record_sk: 'INT64',
        student_sk: 'INT64',
        academic_year: 'STRING',
        semester_number: 'INT64',
        raw_score: 'FLOAT64',
        numeric_score: 'FLOAT64',
        gpa_category: 'STRING',
        updated_at: 'TIMESTAMP'
      }
    };

    await bigquery.query(options);
    return { ok: true, action: 'upsert' };
  } catch (err) {
    console.error('studentCourseETL error', err);
    return { ok: false, error: String(err) };
  }
}

module.exports = { processStudentCourseEvent };

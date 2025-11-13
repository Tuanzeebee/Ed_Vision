require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { processStudentEvent } = require('../src/etl/studentETL');
const { processAppointmentEvent } = require('../src/etl/appointmentETL');
const { processAccountEvent } = require('../src/etl/accountETL');
const { processInstructorEvent } = require('../src/etl/instructorETL');
const { processSessionEvent } = require('../src/etl/sessionETL');
const { processDailyActivityEvent } = require('../src/etl/dailyActivityETL');
const { processStudentCourseEvent } = require('../src/etl/studentCourseETL');

async function run(eventId) {
  if (!eventId) {
    console.error('Usage: node scripts/test_event.js <event_id>');
    process.exit(2);
  }

  try {
    const rows = await prisma.$queryRaw`
      SELECT id, table_name, operation, payload, created_at, processed, last_error
      FROM "EventLog" WHERE id = ${Number(eventId)} LIMIT 1`;

    if (!rows || rows.length === 0) {
      console.error('No EventLog row found for id', eventId);
      process.exit(1);
    }

    const ev = rows[0];
    console.log('Loaded event:', ev.id, ev.table_name, ev.operation, 'processed=', ev.processed);
    const payload = ev.payload || {};
    const dataset = payload.dataset || process.env.BIGQUERY_DATASET;

    let result;
    try {
      switch (ev.table_name) {
        case 'Student':
          result = await processStudentEvent({ operation: ev.operation, payload, dataset });
          break;
        case 'Appointment':
          result = await processAppointmentEvent({ operation: ev.operation, payload, dataset });
          break;
        case 'Account':
          result = await processAccountEvent({ operation: ev.operation, payload, dataset });
          // also forward to session handler if payload contains session info
          if (payload && (payload.logout_time || payload.last_logout_at || payload.session_id || payload.login_time)) {
            await processSessionEvent({ operation: ev.operation, payload, dataset });
          }
          break;
        case 'Instructor':
          result = await processInstructorEvent({ operation: ev.operation, payload, dataset });
          break;
        case 'StudentCourseRecord':
          result = await processStudentCourseEvent({ operation: ev.operation, payload, dataset });
          break;
        default:
          console.warn('No handler for table', ev.table_name);
          result = { ok: true, reason: 'noop' };
      }

      console.log('Handler result:', result);

      // mark processed
      await prisma.$executeRaw`
        UPDATE "EventLog" SET processed = true, processed_at = NOW(), last_error = NULL
        WHERE id = ${ev.id}
      `;
      console.log('Marked event processed in EventLog', ev.id);
    } catch (hErr) {
      console.error('Handler error:', hErr);
      await prisma.$executeRaw`
        UPDATE "EventLog" SET last_error = ${String(hErr.message || hErr)} WHERE id = ${ev.id}
      `;
      process.exitCode = 3;
    }
  } catch (err) {
    console.error('Test runner error', err);
    process.exitCode = 4;
  } finally {
    await prisma.$disconnect();
  }
}

run(process.argv[2]);

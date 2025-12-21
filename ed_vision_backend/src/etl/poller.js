require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const os = require('os');

const { processStudentEvent } = require('./studentETL');
const { processAppointmentEvent } = require('./appointmentETL');
const { processAccountEvent } = require('./accountETL');
const { processInstructorEvent } = require('./instructorETL');
const { processSessionEvent } = require('./sessionETL');
const { processDailyActivityEvent } = require('./dailyActivityETL');
const { processStudentCourseEvent } = require('./studentCourseETL');

const POLL_INTERVAL_MS = process.env.POLL_INTERVAL_MS ? Number(process.env.POLL_INTERVAL_MS) : 30000; // 30s fallback
const BATCH_SIZE = process.env.POLL_BATCH_SIZE ? Number(process.env.POLL_BATCH_SIZE) : 200;

async function processEventRow(ev) {
  const table = ev.table_name;
  const op = ev.operation;
  const payload = ev.payload || {};
  const dataset = payload.dataset || undefined;

  try {
    if (table === 'Student') {
      return await processStudentEvent({ operation: op, payload, dataset });
    }
    if (table === 'Appointment') {
      return await processAppointmentEvent({ operation: op, payload, dataset });
    }
    if (table === 'Account') {
      const res = await processAccountEvent({ operation: op, payload, dataset });
      if (payload && (payload.last_logout_at || payload.last_login_at)) {
        try {
          await processSessionEvent({ operation: op, payload, dataset });
        } catch (e) {
          console.warn('poller: session handler failed for account event', e.message || e);
        }
      }
      return res;
    }
    if (table === 'Instructor') {
      return await processInstructorEvent({ operation: op, payload, dataset });
    }
    if (table === 'StudentCourseRecord') {
      return await processStudentCourseEvent({ operation: op, payload, dataset });
    }
    console.info('poller: no handler for table', table);
    return { ok: true, reason: 'noop' };
  } catch (err) {
    console.error('poller: handler error for event', ev.id, err);
    throw err;
  }
}

async function pollOnce() {
  try {
    // get candidate ids (unprocessed and not failed)
    const candidates = await prisma.$queryRaw`
      SELECT id FROM "EventLog" 
      WHERE (processed = false OR processed IS NULL) AND (failed = false OR failed IS NULL)
      ORDER BY id ASC 
      LIMIT ${BATCH_SIZE}
    `;
    if (!candidates || candidates.length === 0) return;

    const workerId = process.env.WORKER_ID || `${os.hostname()}_${process.pid}`;

    for (const row of candidates) {
      const id = row.id;
      try {
        // try to atomically claim this event
        const claimed = await prisma.$queryRaw`
          UPDATE "EventLog" 
          SET processing = true, processing_by = ${workerId}, processing_started_at = NOW() 
          WHERE id = ${Number(id)} AND (processing IS NULL OR processing = false) 
          RETURNING id, table_name, operation, payload, retry_count
        `;
        if (!claimed || claimed.length === 0) {
          // someone else claimed it
          continue;
        }

        const ev = claimed[0];
        console.log('poller: claimed and processing event', ev.id, ev.table_name, ev.operation);
        try {
          await processEventRow(ev);
          await prisma.$executeRaw`
            UPDATE "EventLog" 
            SET processed = true, processed_at = NOW(), processing = false, processing_by = NULL, processing_started_at = NULL, last_error = NULL 
            WHERE id = ${ev.id}
          `;
        } catch (procErr) {
          console.error('poller: processing failed for event', ev.id, procErr);
          const retryLimit = Number(process.env.ETL_RETRY_LIMIT || 5);
          const nextRetry = (ev.retry_count || 0) + 1;
          const isFailed = nextRetry >= retryLimit;
          await prisma.$executeRaw`
            UPDATE "EventLog" 
            SET retry_count = ${nextRetry}, last_error = ${String(procErr.message || procErr)}, processing = false, processing_by = NULL, processing_started_at = NULL, failed = ${isFailed} 
            WHERE id = ${ev.id}
          `;
        }
      } catch (e) {
        console.error('poller: failed to claim/process event', id, e);
      }
    }
  } catch (err) {
    console.error('poller: failed to fetch/process events', err);
  }
}

async function start() {
  console.log(`Starting poller fallback: interval=${POLL_INTERVAL_MS}ms batch=${BATCH_SIZE}`);
  while (true) {
    await pollOnce();
    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
  }
}

start().catch((err) => {
  console.error('poller start failed', err);
  process.exit(1);
});

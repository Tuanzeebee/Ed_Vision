require('dotenv').config();
const { Client } = require('pg');
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

const PG_CONN = process.env.DATABASE_URL;
const CHANNEL = process.env.EVENT_CHANNEL || 'event_channel';

if (!PG_CONN) {
  console.error('DATABASE_URL not set in environment. Listener cannot start.');
  process.exit(1);
}

async function handleEventByRow(eventRow) {
  const table = eventRow.table_name;
  const op = eventRow.operation;
  const payload = eventRow.payload || {};
  const dataset = payload.dataset || undefined;

  try {
    if (table === 'Student') {
      return await processStudentEvent({ operation: op, payload, dataset });
    }

    if (table === 'Appointment') {
      return await processAppointmentEvent({ operation: op, payload, dataset });
    }

    if (table === 'Account') {
      // account changes -> update dim_account; also forward to session handler for login/logout events
      const res = await processAccountEvent({ operation: op, payload, dataset });
      
      // Forward to sessionETL khi có login/logout info
      if (payload && (payload.last_logout_at || payload.last_login_at)) {
        try {
          await processSessionEvent({ operation: op, payload, dataset });
        } catch (e) {
          console.warn('listener: session handler failed for account event', e.message || e);
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

    console.info('listener: no handler for table', table);
    return { ok: true, reason: 'noop' };
  } catch (err) {
    console.error('handler error for event', eventRow.id, err);
    throw err;
  }
}

async function start() {
  const client = new Client({ connectionString: PG_CONN });

  client.on('notification', async (msg) => {
    try {
      const data = JSON.parse(msg.payload);
      const eventId = data.event_id;
      if (!eventId) return console.warn('listener: notification missing event_id', msg.payload);

      const workerId = process.env.WORKER_ID || `${os.hostname()}_${process.pid}`;

      // Try to claim the event atomically
      const claimedRows = await prisma.$queryRaw`
        UPDATE "EventLog"
        SET processing = true, processing_by = ${workerId}, processing_started_at = NOW()
        WHERE id = ${Number(eventId)} AND (processing IS NULL OR processing = false)
        RETURNING id, table_name, operation, payload, retry_count, processed
      `;

      if (!claimedRows || claimedRows.length === 0) {
        console.info('listener: event already claimed or missing', eventId);
        return;
      }

      const ev = claimedRows[0];
      if (ev.processed) {
        // mark processing flag off if already processed
        await prisma.$executeRaw`
          UPDATE "EventLog"
          SET processing = false, processing_by = NULL, processing_started_at = NULL
          WHERE id = ${ev.id}
        `;
        console.info('listener: event already processed, cleaned processing flag', ev.id);
        return;
      }

      console.log('listener: claimed and processing event', ev.id, ev.table_name, ev.operation);

      try {
        await handleEventByRow(ev);

        // success -> mark processed and clear processing
        await prisma.$executeRaw`
          UPDATE "EventLog"
          SET processed = true, processed_at = NOW(), processing = false, processing_by = NULL, processing_started_at = NULL, last_error = NULL
          WHERE id = ${ev.id}
        `;
      } catch (procErr) {
        console.error('listener: handler error for event', ev.id, procErr);
        // increment retry_count and record error; if exceeds limit, mark failed
        const retryLimit = Number(process.env.ETL_RETRY_LIMIT || 5);
        const nextRetry = (ev.retry_count || 0) + 1;
        const isFailed = nextRetry >= retryLimit;
        await prisma.$executeRaw`
          UPDATE "EventLog"
          SET retry_count = ${nextRetry}, last_error = ${String(procErr.message || procErr)}, processing = false, processing_by = NULL, processing_started_at = NULL, failed = ${isFailed}
          WHERE id = ${ev.id}
        `;
      }
    } catch (err) {
      console.error('listener notification handler error', err);
    }
  });

  client.on('error', (err) => {
    console.error('pg client error', err);
  });

  await client.connect();
  await client.query('LISTEN ' + CHANNEL);
  console.log('Listening for notifications on channel ' + CHANNEL);
}

start().catch((err) => {
  console.error('listener start failed', err);
  process.exit(1);
});

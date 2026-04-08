require('dotenv').config();
const express = require('express');
const router = express.Router();

const { processStudentEvent } = require('./etl/studentETL');
const { processAppointmentEvent } = require('./etl/appointmentETL');
const { processAccountEvent } = require('./etl/accountETL');
const { processInstructorEvent } = require('./etl/instructorETL');
const { processStudentCourseEvent } = require('./etl/studentCourseETL');

/**
 * POST /webhook/event
 * Body: { table_name, operation, record_id, payload }
 * This route is intended to be called by a DB-trigger adapter or any external system that writes to event_log.
 */
router.post('/event', async (req, res) => {
  try {
    const evt = req.body;
    if (!evt || !evt.table_name) return res.status(400).json({ ok: false, reason: 'missing event or table_name' });

  const table = String(evt.table_name);
  const op = String(evt.operation || '').toUpperCase();
  // allow caller to include a target dataset (per-member dataset) either on top-level event or inside payload
  const dataset = evt.dataset || (evt.payload && evt.payload.dataset) || undefined;

    // route to appropriate ETL
    if (table === 'Student') {
      const result = await processStudentEvent({ operation: op, payload: evt.payload || {}, dataset });
      return res.json({ ok: true, table, op, result });
    }

    if (table === 'Account') {
      const result = await processAccountEvent({ operation: op, payload: evt.payload || {}, dataset });
      return res.json({ ok: true, table, op, result });
    }

    if (table === 'Instructor') {
      const result = await processInstructorEvent({ operation: op, payload: evt.payload || {}, dataset });
      return res.json({ ok: true, table, op, result });
    }

    if (table === 'StudentCourseRecord') {
      const result = await processStudentCourseEvent({ operation: op, payload: evt.payload || {}, dataset });
      return res.json({ ok: true, table, op, result });
    }

    if (table === 'Appointment') {
      const result = await processAppointmentEvent({ operation: op, payload: evt.payload || {}, dataset });
      return res.json({ ok: true, table, op, result });
    }

    // default: acknowledge but no-op
    console.info('webhook: unhandled table', table);
    return res.json({ ok: true, table, op, result: 'noop' });
  } catch (err) {
    console.error('webhook /event error', err);
    return res.status(500).json({ ok: false, error: String(err) });
  }
});

module.exports = router;

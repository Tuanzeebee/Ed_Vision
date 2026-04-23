-- ===========================================================
-- 🧠 FUNCTION: fn_log_table_change — version with lightweight NOTIFY
-- ===========================================================

CREATE OR REPLACE FUNCTION public.fn_log_table_change()
RETURNS TRIGGER AS $$
DECLARE
  v_record_id INTEGER;
  v_payload JSONB;
  v_event_id INTEGER;
  v_notify JSON;
BEGIN
  -- Lấy payload tuỳ theo hành động
  IF TG_OP IN ('INSERT', 'UPDATE') THEN
    v_payload := to_jsonb(NEW);
  ELSE
    v_payload := to_jsonb(OLD);
  END IF;

  -- Xác định record_id dựa trên khóa phổ biến
  v_record_id := COALESCE(
    (v_payload->>'account_id')::INT,
    (v_payload->>'student_id')::INT,
    (v_payload->>'instructor_id')::INT,
    (v_payload->>'record_id')::INT,
    (v_payload->>'appointment_id')::INT
  );

  -- Ghi log vào bảng EventLog
  INSERT INTO "EventLog" (table_name, operation, record_id, payload, created_at)
  VALUES (TG_TABLE_NAME, TG_OP, v_record_id, v_payload, NOW())
  RETURNING id INTO v_event_id;

  -- Gửi NOTIFY nhẹ: chỉ gửi id + metadata
  v_notify := json_build_object(
    'event_id', v_event_id,
    'table_name', TG_TABLE_NAME,
    'operation', TG_OP,
    'record_id', v_record_id
  );

  PERFORM pg_notify('event_channel', v_notify::text);

  -- Trả bản ghi phù hợp
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION public.fn_log_table_change() IS
'Hàm trigger dùng chung: ghi log vào "EventLog" và gửi NOTIFY(event_channel) (lightweight payload) khi có CRUD.';
-- ===========================================================
-- ⚙️ TRIGGERS: Gắn fn_log_table_change vào các bảng cần theo dõi
-- ===========================================================

-- Account
DROP TRIGGER IF EXISTS trg_account_cud ON "Account";
CREATE TRIGGER trg_account_cud
AFTER INSERT OR UPDATE OR DELETE
ON "Account"
FOR EACH ROW
EXECUTE FUNCTION public.fn_log_table_change();

-- Student
DROP TRIGGER IF EXISTS trg_student_cud ON "Student";
CREATE TRIGGER trg_student_cud
AFTER INSERT OR UPDATE OR DELETE
ON "Student"
FOR EACH ROW
EXECUTE FUNCTION public.fn_log_table_change();

-- Instructor
DROP TRIGGER IF EXISTS trg_instructor_cud ON "Instructor";
CREATE TRIGGER trg_instructor_cud
AFTER INSERT OR UPDATE OR DELETE
ON "Instructor"
FOR EACH ROW
EXECUTE FUNCTION public.fn_log_table_change();

-- StudentCourseRecord
DROP TRIGGER IF EXISTS trg_student_course_cud ON "StudentCourseRecord";
CREATE TRIGGER trg_student_course_cud
AFTER INSERT OR UPDATE OR DELETE
ON "StudentCourseRecord"
FOR EACH ROW
EXECUTE FUNCTION public.fn_log_table_change();

-- Appointment
DROP TRIGGER IF EXISTS trg_appointment_cud ON "Appointment";
CREATE TRIGGER trg_appointment_cud
AFTER INSERT OR UPDATE OR DELETE
ON "Appointment"
FOR EACH ROW
EXECUTE FUNCTION public.fn_log_table_change();

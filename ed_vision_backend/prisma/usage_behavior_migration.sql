-- ═══════════════════════════════════════════════════════════════════════════
-- Migration: Analytics tables for Usage Behavior Dashboard
-- (UserActivityLog + UserDailyActivitySummary)
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS "UserActivityLog" (
  "id"           SERIAL PRIMARY KEY,
  "account_id"   INTEGER NOT NULL,
  "session_id"   UUID,
  "action_type"  VARCHAR(50) NOT NULL,
  "feature"      VARCHAR(50) NOT NULL,
  "page_path"    VARCHAR(255),
  "entity_type"  VARCHAR(50),
  "entity_id"    INTEGER,
  "device_type"  VARCHAR(20),
  "ip_address"   VARCHAR(45),
  "user_agent"   VARCHAR(500),
  "duration_sec" INTEGER,
  "created_at"   TIMESTAMPTZ NOT NULL DEFAULT now(),
  "session_date" DATE NOT NULL,
  "hour_of_day"  SMALLINT,
  "day_of_week"  SMALLINT,
  CONSTRAINT "UserActivityLog_account_id_fkey"
    FOREIGN KEY ("account_id") REFERENCES "Account"("account_id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "UserActivityLog_account_id_created_at_idx"
  ON "UserActivityLog" ("account_id", "created_at");
CREATE INDEX IF NOT EXISTS "UserActivityLog_created_at_action_type_idx"
  ON "UserActivityLog" ("created_at", "action_type");
CREATE INDEX IF NOT EXISTS "UserActivityLog_feature_created_at_idx"
  ON "UserActivityLog" ("feature", "created_at");
CREATE INDEX IF NOT EXISTS "UserActivityLog_session_date_hour_of_day_idx"
  ON "UserActivityLog" ("session_date", "hour_of_day");
CREATE INDEX IF NOT EXISTS "UserActivityLog_entity_type_entity_id_created_at_idx"
  ON "UserActivityLog" ("entity_type", "entity_id", "created_at");


CREATE TABLE IF NOT EXISTS "UserDailyActivitySummary" (
  "id"                 SERIAL PRIMARY KEY,
  "account_id"         INTEGER NOT NULL,
  "activity_date"      DATE NOT NULL,
  "total_sessions"     INTEGER NOT NULL DEFAULT 0,
  "total_page_views"   INTEGER NOT NULL DEFAULT 0,
  "total_duration_min" INTEGER NOT NULL DEFAULT 0,
  "first_activity_at"  TIMESTAMPTZ,
  "last_activity_at"   TIMESTAMPTZ,
  "peak_hour"          SMALLINT,
  "feature_breakdown"  JSONB,
  "device_breakdown"   JSONB,
  "created_at"         TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updated_at"         TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT "UserDailyActivitySummary_account_id_fkey"
    FOREIGN KEY ("account_id") REFERENCES "Account"("account_id") ON DELETE CASCADE,
  CONSTRAINT "UserDailyActivitySummary_account_id_activity_date_key"
    UNIQUE ("account_id", "activity_date")
);

CREATE INDEX IF NOT EXISTS "UserDailyActivitySummary_activity_date_idx"
  ON "UserDailyActivitySummary" ("activity_date");

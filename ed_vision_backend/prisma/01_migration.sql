-- BƯỚC 1: Chạy file này trước trên PostgreSQL
-- Tạo 3 bảng cho Placement Test
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS ielts_questions (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    skill             TEXT NOT NULL,
    sub_skill_code    TEXT,
    question_type     TEXT NOT NULL,
    question_text     TEXT NOT NULL,
    options           JSONB,
    correct_answer    TEXT NOT NULL,
    explanation       TEXT,
    keywords          TEXT[] DEFAULT '{}',
    band_min          NUMERIC(2,1) NOT NULL,
    band_max          NUMERIC(2,1) NOT NULL,
    difficulty_weight NUMERIC(3,2) NOT NULL DEFAULT 1.0,
    expected_time_sec INT NOT NULL DEFAULT 60,
    error_tag         TEXT,
    topic_tags        TEXT[] DEFAULT '{}',
    is_ai_generated   BOOLEAN NOT NULL DEFAULT false,
    ai_model          TEXT,
    seed_question_ids UUID[] DEFAULT '{}',
    status            TEXT NOT NULL DEFAULT 'draft',
    quality_score     SMALLINT,
    used_count        INT NOT NULL DEFAULT 0,
    correct_rate      NUMERIC(4,3),
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ielts_q_skill_status ON ielts_questions (skill, status);
CREATE INDEX IF NOT EXISTS idx_ielts_q_band         ON ielts_questions (band_min, band_max);
CREATE INDEX IF NOT EXISTS idx_ielts_q_error_tag    ON ielts_questions (error_tag);

-- ----------------------------------------------------------------

CREATE TABLE IF NOT EXISTS ielts_placement_sessions (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id              INT NOT NULL REFERENCES "Account"(account_id) ON DELETE CASCADE,

    skills_tested           TEXT[] NOT NULL,
    status                  TEXT NOT NULL DEFAULT 'in_progress'
                                CHECK (status IN ('in_progress','completed','abandoned')),

    current_estimated_band  NUMERIC(2,1) NOT NULL DEFAULT 5.0,
    used_question_ids       UUID[] NOT NULL DEFAULT '{}',
    total_questions_asked   INT NOT NULL DEFAULT 0,
    consecutive_correct     INT NOT NULL DEFAULT 0,
    consecutive_wrong       INT NOT NULL DEFAULT 0,

    started_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    completed_at            TIMESTAMPTZ,

    final_band              NUMERIC(2,1),
    skill_bands             JSONB,
    confidence_level        TEXT CHECK (confidence_level IN ('low','medium','high')),

    CONSTRAINT max_10_questions CHECK (total_questions_asked <= 10)
);

CREATE INDEX IF NOT EXISTS idx_placement_account ON ielts_placement_sessions (account_id, status);

-- ----------------------------------------------------------------

CREATE TABLE IF NOT EXISTS ielts_placement_answers (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id        UUID NOT NULL REFERENCES ielts_placement_sessions(id) ON DELETE CASCADE,
    question_id       UUID NOT NULL REFERENCES ielts_questions(id),

    question_order    SMALLINT NOT NULL CHECK (question_order BETWEEN 1 AND 10),
    band_at_time      NUMERIC(2,1) NOT NULL,
    band_mid          NUMERIC(2,1) NOT NULL,
    difficulty_weight NUMERIC(3,2) NOT NULL,

    user_answer       TEXT,
    is_correct        BOOLEAN,
    time_taken_sec    INT,
    answered_at       TIMESTAMPTZ NOT NULL DEFAULT now(),

    UNIQUE (session_id, question_order)
);

CREATE INDEX IF NOT EXISTS idx_placement_answers_session ON ielts_placement_answers (session_id, question_order);

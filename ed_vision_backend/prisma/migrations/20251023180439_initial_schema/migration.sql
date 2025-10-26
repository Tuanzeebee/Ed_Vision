-- CreateTable
CREATE TABLE "public"."Account" (
    "account_id" SERIAL NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" VARCHAR(20) NOT NULL,
    "status" VARCHAR(20) DEFAULT 'active',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("account_id")
);

-- CreateTable
CREATE TABLE "public"."Profile" (
    "profile_id" SERIAL NOT NULL,
    "account_id" INTEGER NOT NULL,
    "full_name" VARCHAR(150) NOT NULL,
    "date_of_birth" DATE,
    "gender" VARCHAR(16),
    "address" TEXT,
    "avatar_url" TEXT,
    "nationality" VARCHAR(80),

    CONSTRAINT "Profile_pkey" PRIMARY KEY ("profile_id")
);

-- CreateTable
CREATE TABLE "public"."Parent" (
    "parent_id" SERIAL NOT NULL,
    "account_id" INTEGER NOT NULL,
    "full_name" VARCHAR(150) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "phone_number" VARCHAR(30) NOT NULL,
    "relationship_type" VARCHAR(32),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Parent_pkey" PRIMARY KEY ("parent_id")
);

-- CreateTable
CREATE TABLE "public"."Student" (
    "student_id" SERIAL NOT NULL,
    "account_id" INTEGER NOT NULL,
    "student_code" VARCHAR(50) NOT NULL,
    "major" VARCHAR(120),
    "cohort_year" INTEGER,
    "class_id" INTEGER,
    "status" VARCHAR(20) DEFAULT 'active',

    CONSTRAINT "Student_pkey" PRIMARY KEY ("student_id")
);

-- CreateTable
CREATE TABLE "public"."Instructor" (
    "instructor_id" SERIAL NOT NULL,
    "account_id" INTEGER NOT NULL,
    "employee_code" VARCHAR(50) NOT NULL,
    "academic_title" VARCHAR(100),
    "position" VARCHAR(100),
    "department_id" INTEGER,
    "hire_date" DATE,
    "status" VARCHAR(20) DEFAULT 'active',

    CONSTRAINT "Instructor_pkey" PRIMARY KEY ("instructor_id")
);

-- CreateTable
CREATE TABLE "public"."Department" (
    "department_id" SERIAL NOT NULL,
    "code" VARCHAR(20),
    "name" VARCHAR(150) NOT NULL,
    "status" VARCHAR(20) DEFAULT 'active',

    CONSTRAINT "Department_pkey" PRIMARY KEY ("department_id")
);

-- CreateTable
CREATE TABLE "public"."Program" (
    "program_id" SERIAL NOT NULL,
    "program_code" VARCHAR(20) NOT NULL,
    "program_name" VARCHAR(255) NOT NULL,
    "duration_years" SMALLINT DEFAULT 4,

    CONSTRAINT "Program_pkey" PRIMARY KEY ("program_id")
);

-- CreateTable
CREATE TABLE "public"."ClassGroup" (
    "class_id" SERIAL NOT NULL,
    "class_code" VARCHAR(30) NOT NULL,
    "program_id" INTEGER,
    "cohort_year" INTEGER NOT NULL,
    "status" VARCHAR(20) DEFAULT 'active',

    CONSTRAINT "ClassGroup_pkey" PRIMARY KEY ("class_id")
);

-- CreateTable
CREATE TABLE "public"."AdviserAssignment" (
    "adviser_assign_id" SERIAL NOT NULL,
    "class_id" INTEGER NOT NULL,
    "instructor_id" INTEGER NOT NULL,
    "assigned_date" DATE,
    "ended_date" DATE,
    "note" TEXT,

    CONSTRAINT "AdviserAssignment_pkey" PRIMARY KEY ("adviser_assign_id")
);

-- CreateTable
CREATE TABLE "public"."ParentStudentLink" (
    "link_id" SERIAL NOT NULL,
    "parent_id" INTEGER NOT NULL,
    "student_id" INTEGER NOT NULL,
    "relationship" VARCHAR(32),
    "link_code" VARCHAR(10),

    CONSTRAINT "ParentStudentLink_pkey" PRIMARY KEY ("link_id")
);

-- CreateTable
CREATE TABLE "public"."AcademicTerm" (
    "term_id" SERIAL NOT NULL,
    "academic_year" VARCHAR(20) NOT NULL,
    "semester_number" SMALLINT NOT NULL,
    "is_summer" BOOLEAN NOT NULL DEFAULT false,
    "status" VARCHAR(20) DEFAULT 'active',

    CONSTRAINT "AcademicTerm_pkey" PRIMARY KEY ("term_id")
);

-- CreateTable
CREATE TABLE "public"."Course" (
    "course_id" SERIAL NOT NULL,
    "course_code" VARCHAR(20) NOT NULL,
    "course_name" VARCHAR(255) NOT NULL,
    "credits_unit" SMALLINT,
    "study_format" VARCHAR(20) DEFAULT 'offline',
    "language" VARCHAR(30),
    "difficulty" VARCHAR(20),
    "description" TEXT,

    CONSTRAINT "Course_pkey" PRIMARY KEY ("course_id")
);

-- CreateTable
CREATE TABLE "public"."CurriculumCourse" (
    "id" SERIAL NOT NULL,
    "program_id" INTEGER NOT NULL,
    "course_id" INTEGER NOT NULL,
    "year_number" SMALLINT NOT NULL,
    "term_number" SMALLINT NOT NULL,
    "is_mandatory" BOOLEAN NOT NULL DEFAULT true,
    "note" TEXT,

    CONSTRAINT "CurriculumCourse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."StudentCourseRecord" (
    "record_id" SERIAL NOT NULL,
    "student_id" INTEGER,
    "course_id" INTEGER,
    "term_id" INTEGER,
    "status" VARCHAR(20) DEFAULT 'planned',
    "raw_score" DECIMAL(5,2),
    "converted_score" VARCHAR(5),
    "converted_numeric_score" DECIMAL(5,2),

    CONSTRAINT "StudentCourseRecord_pkey" PRIMARY KEY ("record_id")
);

-- CreateTable
CREATE TABLE "public"."SurveyQuestion" (
    "question_id" SERIAL NOT NULL,
    "question_text" TEXT NOT NULL,
    "question_type" VARCHAR(20),
    "category" VARCHAR(50),
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "SurveyQuestion_pkey" PRIMARY KEY ("question_id")
);

-- CreateTable
CREATE TABLE "public"."SurveyOption" (
    "option_id" SERIAL NOT NULL,
    "question_id" INTEGER,
    "option_text" TEXT,
    "option_value" INTEGER,

    CONSTRAINT "SurveyOption_pkey" PRIMARY KEY ("option_id")
);

-- CreateTable
CREATE TABLE "public"."SurveyResponse" (
    "response_id" SERIAL NOT NULL,
    "account_id" INTEGER,
    "submitted_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SurveyResponse_pkey" PRIMARY KEY ("response_id")
);

-- CreateTable
CREATE TABLE "public"."SurveyAnswer" (
    "answer_id" SERIAL NOT NULL,
    "response_id" INTEGER,
    "question_id" INTEGER,
    "option_id" INTEGER,
    "free_text" TEXT,

    CONSTRAINT "SurveyAnswer_pkey" PRIMARY KEY ("answer_id")
);

-- CreateTable
CREATE TABLE "public"."InstructorAvailabilityWeek" (
    "week_id" SERIAL NOT NULL,
    "instructor_id" INTEGER,
    "week_start_date" DATE NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InstructorAvailabilityWeek_pkey" PRIMARY KEY ("week_id")
);

-- CreateTable
CREATE TABLE "public"."InstructorAvailabilityDate" (
    "date_id" SERIAL NOT NULL,
    "week_id" INTEGER NOT NULL,
    "specific_date" DATE NOT NULL,
    "is_available" BOOLEAN NOT NULL DEFAULT true,
    "note" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InstructorAvailabilityDate_pkey" PRIMARY KEY ("date_id")
);

-- CreateTable
CREATE TABLE "public"."InstructorWeeklySlot" (
    "slot_id" SERIAL NOT NULL,
    "week_id" INTEGER,
    "day_of_week" SMALLINT,
    "start_time_local" TIME(6),
    "end_time_local" TIME(6),
    "period_label" VARCHAR(16),
    "capacity" SMALLINT NOT NULL DEFAULT 10,
    "is_open" BOOLEAN NOT NULL DEFAULT true,
    "note" TEXT,
    "auto_accept" BOOLEAN NOT NULL DEFAULT false,
    "meeting_type" VARCHAR(32) DEFAULT 'offline',

    CONSTRAINT "InstructorWeeklySlot_pkey" PRIMARY KEY ("slot_id")
);

-- CreateTable
CREATE TABLE "public"."Appointment" (
    "appointment_id" SERIAL NOT NULL,
    "slot_id" INTEGER NOT NULL,
    "booker_account_id" INTEGER NOT NULL,
    "booker_role" VARCHAR(20) NOT NULL,
    "student_id" INTEGER,
    "instructor_id" INTEGER,
    "meeting_type" VARCHAR(32) NOT NULL,
    "meeting_purpose" VARCHAR(255),
    "meeting_location" TEXT,
    "meeting_link" TEXT,
    "status" VARCHAR(32) NOT NULL DEFAULT 'pending',
    "cancel_reason" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6),
    "canceled_at" TIMESTAMPTZ(6),
    "attendance_checked_at" TIMESTAMPTZ(6),
    "attendance_status" VARCHAR(20),
    "attended" BOOLEAN,

    CONSTRAINT "Appointment_pkey" PRIMARY KEY ("appointment_id")
);

-- CreateTable
CREATE TABLE "public"."AppointmentContact" (
    "appointment_id" INTEGER NOT NULL,
    "contact_name" VARCHAR(150),
    "contact_phone" VARCHAR(30),
    "contact_email" VARCHAR(255),
    "relationship_to_student" VARCHAR(64),

    CONSTRAINT "AppointmentContact_pkey" PRIMARY KEY ("appointment_id")
);

-- CreateTable
CREATE TABLE "public"."ReminderSchedule" (
    "reminder_id" SERIAL NOT NULL,
    "appointment_id" INTEGER,
    "remind_at" TIMESTAMPTZ(6),
    "channel" VARCHAR(32),
    "sent_at" TIMESTAMPTZ(6),

    CONSTRAINT "ReminderSchedule_pkey" PRIMARY KEY ("reminder_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Account_email_key" ON "public"."Account"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Profile_account_id_key" ON "public"."Profile"("account_id");

-- CreateIndex
CREATE UNIQUE INDEX "Parent_account_id_key" ON "public"."Parent"("account_id");

-- CreateIndex
CREATE UNIQUE INDEX "Student_account_id_key" ON "public"."Student"("account_id");

-- CreateIndex
CREATE UNIQUE INDEX "Student_student_code_key" ON "public"."Student"("student_code");

-- CreateIndex
CREATE UNIQUE INDEX "Instructor_account_id_key" ON "public"."Instructor"("account_id");

-- CreateIndex
CREATE UNIQUE INDEX "Instructor_employee_code_key" ON "public"."Instructor"("employee_code");

-- CreateIndex
CREATE UNIQUE INDEX "Department_code_key" ON "public"."Department"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Program_program_code_key" ON "public"."Program"("program_code");

-- CreateIndex
CREATE UNIQUE INDEX "ClassGroup_class_code_key" ON "public"."ClassGroup"("class_code");

-- CreateIndex
CREATE UNIQUE INDEX "AdviserAssignment_class_id_instructor_id_key" ON "public"."AdviserAssignment"("class_id", "instructor_id");

-- CreateIndex
CREATE UNIQUE INDEX "ParentStudentLink_link_code_key" ON "public"."ParentStudentLink"("link_code");

-- CreateIndex
CREATE UNIQUE INDEX "ParentStudentLink_parent_id_student_id_key" ON "public"."ParentStudentLink"("parent_id", "student_id");

-- CreateIndex
CREATE UNIQUE INDEX "AcademicTerm_academic_year_semester_number_key" ON "public"."AcademicTerm"("academic_year", "semester_number");

-- CreateIndex
CREATE UNIQUE INDEX "Course_course_code_key" ON "public"."Course"("course_code");

-- CreateIndex
CREATE UNIQUE INDEX "CurriculumCourse_program_id_course_id_key" ON "public"."CurriculumCourse"("program_id", "course_id");

-- CreateIndex
CREATE UNIQUE INDEX "StudentCourseRecord_student_id_course_id_key" ON "public"."StudentCourseRecord"("student_id", "course_id");

-- CreateIndex
CREATE UNIQUE INDEX "SurveyAnswer_response_id_question_id_key" ON "public"."SurveyAnswer"("response_id", "question_id");

-- CreateIndex
CREATE UNIQUE INDEX "InstructorAvailabilityWeek_instructor_id_week_start_date_key" ON "public"."InstructorAvailabilityWeek"("instructor_id", "week_start_date");

-- CreateIndex
CREATE UNIQUE INDEX "InstructorAvailabilityDate_week_id_specific_date_key" ON "public"."InstructorAvailabilityDate"("week_id", "specific_date");

-- CreateIndex
CREATE UNIQUE INDEX "InstructorWeeklySlot_week_id_day_of_week_start_time_local_key" ON "public"."InstructorWeeklySlot"("week_id", "day_of_week", "start_time_local");

-- AddForeignKey
ALTER TABLE "public"."Profile" ADD CONSTRAINT "Profile_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "public"."Account"("account_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Parent" ADD CONSTRAINT "Parent_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "public"."Account"("account_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Student" ADD CONSTRAINT "Student_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "public"."Account"("account_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Student" ADD CONSTRAINT "Student_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "public"."ClassGroup"("class_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Instructor" ADD CONSTRAINT "Instructor_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "public"."Account"("account_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Instructor" ADD CONSTRAINT "Instructor_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "public"."Department"("department_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ClassGroup" ADD CONSTRAINT "ClassGroup_program_id_fkey" FOREIGN KEY ("program_id") REFERENCES "public"."Program"("program_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AdviserAssignment" ADD CONSTRAINT "AdviserAssignment_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "public"."ClassGroup"("class_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AdviserAssignment" ADD CONSTRAINT "AdviserAssignment_instructor_id_fkey" FOREIGN KEY ("instructor_id") REFERENCES "public"."Instructor"("instructor_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ParentStudentLink" ADD CONSTRAINT "ParentStudentLink_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "public"."Parent"("parent_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ParentStudentLink" ADD CONSTRAINT "ParentStudentLink_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "public"."Student"("student_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CurriculumCourse" ADD CONSTRAINT "CurriculumCourse_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "public"."Course"("course_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CurriculumCourse" ADD CONSTRAINT "CurriculumCourse_program_id_fkey" FOREIGN KEY ("program_id") REFERENCES "public"."Program"("program_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."StudentCourseRecord" ADD CONSTRAINT "StudentCourseRecord_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "public"."Course"("course_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."StudentCourseRecord" ADD CONSTRAINT "StudentCourseRecord_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "public"."Student"("student_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."StudentCourseRecord" ADD CONSTRAINT "StudentCourseRecord_term_id_fkey" FOREIGN KEY ("term_id") REFERENCES "public"."AcademicTerm"("term_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SurveyOption" ADD CONSTRAINT "SurveyOption_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "public"."SurveyQuestion"("question_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SurveyResponse" ADD CONSTRAINT "SurveyResponse_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "public"."Account"("account_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SurveyAnswer" ADD CONSTRAINT "SurveyAnswer_option_id_fkey" FOREIGN KEY ("option_id") REFERENCES "public"."SurveyOption"("option_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SurveyAnswer" ADD CONSTRAINT "SurveyAnswer_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "public"."SurveyQuestion"("question_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SurveyAnswer" ADD CONSTRAINT "SurveyAnswer_response_id_fkey" FOREIGN KEY ("response_id") REFERENCES "public"."SurveyResponse"("response_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."InstructorAvailabilityWeek" ADD CONSTRAINT "InstructorAvailabilityWeek_instructor_id_fkey" FOREIGN KEY ("instructor_id") REFERENCES "public"."Instructor"("instructor_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."InstructorAvailabilityDate" ADD CONSTRAINT "InstructorAvailabilityDate_week_id_fkey" FOREIGN KEY ("week_id") REFERENCES "public"."InstructorAvailabilityWeek"("week_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."InstructorWeeklySlot" ADD CONSTRAINT "InstructorWeeklySlot_week_id_fkey" FOREIGN KEY ("week_id") REFERENCES "public"."InstructorAvailabilityWeek"("week_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Appointment" ADD CONSTRAINT "Appointment_booker_account_id_fkey" FOREIGN KEY ("booker_account_id") REFERENCES "public"."Account"("account_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Appointment" ADD CONSTRAINT "Appointment_instructor_id_fkey" FOREIGN KEY ("instructor_id") REFERENCES "public"."Instructor"("instructor_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Appointment" ADD CONSTRAINT "Appointment_slot_id_fkey" FOREIGN KEY ("slot_id") REFERENCES "public"."InstructorWeeklySlot"("slot_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Appointment" ADD CONSTRAINT "Appointment_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "public"."Student"("student_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AppointmentContact" ADD CONSTRAINT "AppointmentContact_appointment_id_fkey" FOREIGN KEY ("appointment_id") REFERENCES "public"."Appointment"("appointment_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ReminderSchedule" ADD CONSTRAINT "ReminderSchedule_appointment_id_fkey" FOREIGN KEY ("appointment_id") REFERENCES "public"."Appointment"("appointment_id") ON DELETE CASCADE ON UPDATE CASCADE;

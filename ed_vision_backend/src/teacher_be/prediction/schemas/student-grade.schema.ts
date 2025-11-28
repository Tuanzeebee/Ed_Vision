import { Schema, Document } from 'mongoose';

export interface StudentGrade extends Document {
  teacher_id: string;
  course_code: string;
  upload_date: Date;
  semester?: string;
  year?: number;
  students: StudentRecord[];
}

export interface StudentRecord {
  student_id: string;
  student_name?: string;
  // Điểm học tập (dynamic fields)
  grades: Record<string, any>;
  // Behavior fields - mặc định null
  weekly_study_hours_by_course: number | null;
  part_time_hours_by_course: number | null;
  financial_support_by_course: number | null; // 0: Thấp, 1: Trung bình, 2: Cao, 3: Rất cao
  emotional_support_by_course: number | null; // 0: Thấp, 1: Trung bình, 2: Cao, 3: Rất cao
  // Prediction results - sẽ được cập nhật sau
  final_pred: number | null;
  confidence: string | null; // 'high', 'medium', 'low'
  created_at: Date;
  updated_at: Date;
}

export const StudentGradeSchema = new Schema<StudentGrade>(
  {
    teacher_id: { type: String, required: true, index: true },
    course_code: { type: String, required: true, index: true },
    upload_date: { type: Date, default: Date.now },
    semester: { type: String },
    year: { type: Number },
    students: [
      {
        student_id: { type: String, required: true },
        student_name: { type: String },
        grades: { type: Schema.Types.Mixed, required: true }, // Linh động cho các cột điểm
        weekly_study_hours_by_course: { type: Number, default: null },
        part_time_hours_by_course: { type: Number, default: null },
        financial_support_by_course: { type: Number, default: null },
        emotional_support_by_course: { type: Number, default: null },
        final_pred: { type: Number, default: null },
        confidence: { type: String, default: null },
        created_at: { type: Date, default: Date.now },
        updated_at: { type: Date, default: Date.now },
      },
    ],
  },
  {
    timestamps: true,
    collection: 'student_grades',
  }
);

// Index để tìm kiếm nhanh
StudentGradeSchema.index({ teacher_id: 1, course_code: 1, upload_date: -1 });
StudentGradeSchema.index({ 'students.student_id': 1 });

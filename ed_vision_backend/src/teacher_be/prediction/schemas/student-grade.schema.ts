import { Schema, Document } from 'mongoose';

export interface StudentGrade extends Document {
  teacher_id: string;
  course_code: string;
  class_code: string; // Mã lớp (VD: AIS, DTE-01)
  upload_date: Date;
  semester?: string; // Học kỳ (Fall, Spring, Summer)
  academic_year?: string; // Năm học (VD: "2024-2025")
  students: StudentRecord[];
}

export interface StudentRecord {
  student_id: string;
  student_name?: string;
  full_name?: string; // Họ tên từ Profile (chỉ có khi has_survey_data = true)
  // Điểm học tập (dynamic fields)
  grades: Record<string, any>;
  // Behavior fields - mặc định null
  weekly_study_hours_by_course: number | null;
  part_time_hours_by_course: number | null;
  financial_support_by_course: number | null; // 0: Thấp, 1: Trung bình, 2: Cao, 3: Rất cao
  emotional_support_by_course: number | null; // 0: Thấp, 1: Trung bình, 2: Cao, 3: Rất cao
  has_survey_data: boolean; // true: có dữ liệu khảo sát từ StudentSurveyFactors, false: dùng giá trị mặc định
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
    class_code: { type: String, required: true, index: true }, // Mã lớp
    upload_date: { type: Date, default: Date.now },
    semester: { type: String }, // Học kỳ (1, 2, 3 hoặc Fall, Spring, Summer)
    academic_year: { type: String }, // Năm học (VD: "2024-2025")
    students: [
      {
        student_id: { type: String, required: true },
        student_name: { type: String },
        full_name: { type: String }, // Họ tên từ Profile
        grades: { type: Schema.Types.Mixed, required: true }, // Linh động cho các cột điểm
        weekly_study_hours_by_course: { type: Number, default: null },
        part_time_hours_by_course: { type: Number, default: null },
        financial_support_by_course: { type: Number, default: null },
        emotional_support_by_course: { type: Number, default: null },
        has_survey_data: { type: Boolean, default: false }, // Đánh dấu có dữ liệu khảo sát thực tế hay không
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
  },
);

// Index để tìm kiếm nhanh
StudentGradeSchema.index({
  teacher_id: 1,
  course_code: 1,
  class_code: 1,
  upload_date: -1,
});
StudentGradeSchema.index({ 'students.student_id': 1 });

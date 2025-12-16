import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type GradeStructureDocument = GradeStructure & Document;

@Schema()
export class GradeColumn {
  @Prop({ required: true })
  name: string; // Tên hiển thị (VD: Điểm Chuyên Cần)

  @Prop({ required: true })
  key: string; // Key để mapping (VD: attend, regular, practice, etc.)

  @Prop({ required: true, min: 1, max: 10 })
  maxScore: number; // Điểm tối đa

  @Prop({ required: true, min: 0, max: 100 })
  weight: number; // Trọng số (%)

  @Prop()
  color?: string; // Màu hiển thị (optional)
}

@Schema({ timestamps: true })
export class GradeStructure {
  @Prop({ required: true })
  academicYear: string; // Năm giảng dạy (VD: "2024-2025")

  @Prop({ required: true, min: 1, max: 3 })
  semester: number; // Kỳ học (1: Kỳ 1, 2: Kỳ 2, 3: Kỳ Hè)

  @Prop({ required: true })
  courseCode: string; // Mã môn học

  @Prop({ required: true })
  courseName: string; // Tên môn học

  @Prop({ required: true, min: 0 })
  credits: number; // Số tín chỉ

  @Prop({ type: [GradeColumn], required: true })
  columns: GradeColumn[]; // Danh sách cột điểm

  @Prop()
  teacherId?: string; // ID giảng viên tạo (optional, có thể lấy từ auth)

  @Prop({ default: true })
  isActive: boolean; // Trạng thái active/inactive

  @Prop()
  totalWeight?: number; // Tổng trọng số (tính toán tự động)
}

export const GradeStructureSchema = SchemaFactory.createForClass(GradeStructure);

// Index để tìm kiếm nhanh
GradeStructureSchema.index({ academicYear: 1, semester: 1, courseCode: 1 });
GradeStructureSchema.index({ teacherId: 1 });

// Middleware để tính tổng trọng số trước khi save
GradeStructureSchema.pre('save', function (next) {
  if (this.columns && this.columns.length > 0) {
    this.totalWeight = this.columns.reduce((sum, col) => sum + col.weight, 0);
  }
  next();
});

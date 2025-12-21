import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  GradeStructure,
  GradeStructureDocument,
} from '../../../mongodb/schemas/grade-structure.schema';
import { CreateGradeStructureDto } from '../dto/create-grade-structure.dto';
import { UpdateGradeStructureDto } from '../dto/update-grade-structure.dto';

@Injectable()
export class GradeStructureService {
  constructor(
    @InjectModel(GradeStructure.name)
    private gradeStructureModel: Model<GradeStructureDocument>,
  ) {}

  /**
   * Tạo mới cấu trúc bảng điểm
   */
  async create(
    createGradeStructureDto: CreateGradeStructureDto,
  ): Promise<GradeStructure> {
    // Validate tổng trọng số
    const totalWeight = createGradeStructureDto.columns.reduce(
      (sum, col) => sum + col.weight,
      0,
    );

    if (totalWeight > 100) {
      throw new BadRequestException(
        `Tổng trọng số vượt quá 100% (hiện tại: ${totalWeight}%)`,
      );
    }

    // Kiểm tra xem đã tồn tại cấu trúc cho môn học này chưa
    const existing = await this.gradeStructureModel.findOne({
      academicYear: createGradeStructureDto.academicYear,
      semester: createGradeStructureDto.semester,
      courseCode: createGradeStructureDto.courseCode,
      isActive: true,
    });

    if (existing) {
      throw new BadRequestException(
        'Cấu trúc bảng điểm cho môn học này trong kỳ này đã tồn tại. Vui lòng cập nhật hoặc xóa cấu trúc cũ.',
      );
    }

    const createdGradeStructure = new this.gradeStructureModel(
      createGradeStructureDto,
    );
    return createdGradeStructure.save();
  }

  /**
   * Lấy tất cả cấu trúc bảng điểm (có thể filter)
   */
  async findAll(filters?: {
    academicYear?: string;
    semester?: number;
    courseCode?: string;
    teacherId?: string;
    isActive?: boolean;
  }): Promise<GradeStructure[]> {
    const query: any = {};

    if (filters) {
      if (filters.academicYear) query.academicYear = filters.academicYear;
      if (filters.semester) query.semester = filters.semester;
      if (filters.courseCode) query.courseCode = filters.courseCode;
      if (filters.teacherId) query.teacherId = filters.teacherId;
      if (filters.isActive !== undefined) query.isActive = filters.isActive;
    }

    return this.gradeStructureModel.find(query).sort({ createdAt: -1 }).exec();
  }

  /**
   * Lấy một cấu trúc bảng điểm theo ID
   */
  async findOne(id: string): Promise<GradeStructure> {
    const gradeStructure = await this.gradeStructureModel.findById(id).exec();

    if (!gradeStructure) {
      throw new NotFoundException(
        `Không tìm thấy cấu trúc bảng điểm với ID: ${id}`,
      );
    }

    return gradeStructure;
  }

  /**
   * Lấy cấu trúc bảng điểm theo năm học, kỳ học và mã môn học
   */
  async findByCourse(
    academicYear: string,
    semester: number,
    courseCode: string,
  ): Promise<GradeStructure | null> {
    return this.gradeStructureModel
      .findOne({
        academicYear,
        semester,
        courseCode,
        isActive: true,
      })
      .exec();
  }

  /**
   * Cập nhật cấu trúc bảng điểm
   */
  async update(
    id: string,
    updateGradeStructureDto: UpdateGradeStructureDto,
  ): Promise<GradeStructure> {
    // Validate tổng trọng số nếu có cập nhật columns
    if (updateGradeStructureDto.columns) {
      const totalWeight = updateGradeStructureDto.columns.reduce(
        (sum, col) => sum + col.weight,
        0,
      );

      if (totalWeight > 100) {
        throw new BadRequestException(
          `Tổng trọng số vượt quá 100% (hiện tại: ${totalWeight}%)`,
        );
      }
    }

    const updatedGradeStructure = await this.gradeStructureModel
      .findByIdAndUpdate(id, updateGradeStructureDto, { new: true })
      .exec();

    if (!updatedGradeStructure) {
      throw new NotFoundException(
        `Không tìm thấy cấu trúc bảng điểm với ID: ${id}`,
      );
    }

    return updatedGradeStructure;
  }

  /**
   * Xóa (soft delete) cấu trúc bảng điểm
   */
  async remove(id: string): Promise<GradeStructure> {
    const deletedGradeStructure = await this.gradeStructureModel
      .findByIdAndUpdate(id, { isActive: false }, { new: true })
      .exec();

    if (!deletedGradeStructure) {
      throw new NotFoundException(
        `Không tìm thấy cấu trúc bảng điểm với ID: ${id}`,
      );
    }

    return deletedGradeStructure;
  }

  /**
   * Xóa vĩnh viễn
   */
  async hardDelete(id: string): Promise<void> {
    const result = await this.gradeStructureModel.findByIdAndDelete(id).exec();

    if (!result) {
      throw new NotFoundException(
        `Không tìm thấy cấu trúc bảng điểm với ID: ${id}`,
      );
    }
  }

  /**
   * Lấy danh sách các key của predefined columns được sử dụng
   */
  async getUsedColumnKeys(
    academicYear: string,
    semester: number,
    courseCode: string,
  ): Promise<string[]> {
    const structure = await this.findByCourse(
      academicYear,
      semester,
      courseCode,
    );

    if (!structure) {
      return [];
    }

    return structure.columns.map((col) => col.key);
  }

  /**
   * Lấy danh sách courses đã có grade structure (có weights)
   * Dùng để populate combobox khi upload prediction
   */
  async getAvailableCourses(): Promise<
    Array<{
      courseCode: string;
      courseName: string;
      academicYear: string;
      semester: number;
      credits: number;
      totalWeight: number;
    }>
  > {
    const structures = await this.gradeStructureModel
      .find({ isActive: true })
      .select('courseCode courseName academicYear semester credits totalWeight')
      .sort({ courseCode: 1, academicYear: -1, semester: 1 })
      .lean()
      .exec();

    // Deduplicate by courseCode (lấy course mới nhất)
    const courseMap = new Map();

    for (const structure of structures) {
      const key = structure.courseCode;
      if (!courseMap.has(key)) {
        courseMap.set(key, {
          courseCode: structure.courseCode,
          courseName: structure.courseName,
          academicYear: structure.academicYear,
          semester: structure.semester,
          credits: structure.credits,
          totalWeight: structure.totalWeight || 0,
        });
      }
    }

    return Array.from(courseMap.values());
  }
}

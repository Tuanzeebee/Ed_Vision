import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AcademicDataService {
  constructor(private prisma: PrismaService) {}

  /**
   * Lấy danh sách năm học từ AcademicTerm
   * Trả về danh sách năm học duy nhất, sắp xếp giảm dần
   */
  async getAcademicYears() {
    try {
      const terms = await this.prisma.academicTerm.findMany({
        where: {
          status: 'active',
        },
        select: {
          academic_year: true,
          semester_number: true,
          is_summer: true,
        },
        orderBy: {
          academic_year: 'desc',
        },
      });

      // Nhóm theo năm học và lấy các học kỳ có sẵn
      const yearMap = new Map<string, Set<number>>();

      terms.forEach((term) => {
        if (!yearMap.has(term.academic_year)) {
          yearMap.set(term.academic_year, new Set());
        }

        // semester_number: 1 = Kỳ 1, 2 = Kỳ 2, 3 = Kỳ Hè
        if (term.is_summer) {
          yearMap.get(term.academic_year)?.add(3);
        } else {
          yearMap.get(term.academic_year)?.add(term.semester_number);
        }
      });

      // Chuyển đổi sang array
      const years = Array.from(yearMap.entries()).map(([year, semesters]) => ({
        academic_year: year,
        available_semesters: Array.from(semesters).sort(),
      }));

      return {
        success: true,
        data: years,
      };
    } catch (error) {
      console.error('Error fetching academic years:', error);
      return {
        success: false,
        message: 'Không thể tải danh sách năm học',
        data: [],
      };
    }
  }

  /**
   * Lấy danh sách môn học từ Course
   * Trả về course_code, course_name, credits_unit
   */
  async getCourses() {
    try {
      const courses = await this.prisma.course.findMany({
        select: {
          course_id: true,
          course_code: true,
          course_name: true,
          credits_unit: true,
        },
        orderBy: {
          course_code: 'asc',
        },
      });

      return {
        success: true,
        data: courses.map((course) => ({
          id: course.course_id,
          code: course.course_code,
          name: course.course_name,
          credits: course.credits_unit || 0,
          // Format hiển thị: "IT4320 - Requirement Engineering (3 TC)"
          displayName: `${course.course_code} - ${course.course_name} (${course.credits_unit || 0} TC)`,
        })),
      };
    } catch (error) {
      console.error('Error fetching courses:', error);
      return {
        success: false,
        message: 'Không thể tải danh sách môn học',
        data: [],
      };
    }
  }
}

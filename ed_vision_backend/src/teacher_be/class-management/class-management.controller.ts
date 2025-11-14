import { Controller, Get, Param, Req } from '@nestjs/common';
import { ClassManagementService } from './class-management.service';

@Controller('teacher/class-management')
export class ClassManagementController {
    constructor(
        private readonly classManagementService: ClassManagementService,
    ) { }

    /**
     * GET /teacher/class-management/classes
     * Lấy danh sách các lớp mà giảng viên phụ trách
     */
    @Get('classes')
    async getInstructorClasses(@Req() req: any) {
        const instructorId = req.user?.instructorId || 1;
        return this.classManagementService.getInstructorClasses(instructorId);
    }

    /**
     * GET /teacher/class-management/statistics
     * Lấy thống kê tổng quan
     */
    @Get('statistics')
    async getStatistics(@Req() req: any) {
        const instructorId = req.user?.instructorId || 1;
        return this.classManagementService.getStatistics(instructorId);
    }

    /**
     * GET /teacher/class-management/classes/:classCode/students
     * Lấy danh sách sinh viên trong lớp
     */
    @Get('classes/:classCode/students')
    async getStudentsByClass(@Param('classCode') classCode: string) {
        return this.classManagementService.getStudentsByClass(classCode);
    }
}

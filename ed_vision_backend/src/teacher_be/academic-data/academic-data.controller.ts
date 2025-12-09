import { Controller, Get, UseGuards } from '@nestjs/common';
import { AcademicDataService } from './academic-data.service';
import { DevAuthGuard } from '../../common/guards/dev-auth.guard';

@Controller('teacher/academic-data')
@UseGuards(DevAuthGuard)
export class AcademicDataController {
  constructor(private readonly academicDataService: AcademicDataService) {}

  @Get('academic-years')
  async getAcademicYears() {
    return this.academicDataService.getAcademicYears();
  }

  @Get('courses')
  async getCourses() {
    return this.academicDataService.getCourses();
  }
}

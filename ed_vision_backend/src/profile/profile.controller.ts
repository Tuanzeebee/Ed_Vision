import {
  Controller,
  Get,
  Put,
  Post,
  Body,
  Req,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { ProfileService } from './profile.service';
import { DevAuthGuard } from '../common/guards/dev-auth.guard';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdateParentOccupationDto } from './dto/update-parent-occupation.dto';
import { UpdateInstructorWorkDto } from './dto/update-instructor-work.dto';

@Controller('profile')
@UseGuards(DevAuthGuard)
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  /**
   * Get profile for current logged-in user
   * Automatically detects role (student/parent/instructor) and returns appropriate data
   */
  @Get('me')
  async getMyProfile(@Req() req: any) {
    const accountId = req.user?.account_id;

    // Try to get as student first
    try {
      const studentProfile =
        await this.profileService.getStudentProfile(accountId);
      return { role: 'student', ...studentProfile };
    } catch (e) {
      // Not a student, continue
    }

    // Try as parent
    try {
      const parentProfile =
        await this.profileService.getParentProfile(accountId);
      return { role: 'parent', ...parentProfile };
    } catch (e) {
      // Not a parent, continue
    }

    // Try as instructor
    try {
      const instructorProfile =
        await this.profileService.getInstructorProfile(accountId);
      return { role: 'instructor', ...instructorProfile };
    } catch (e) {
      // Not an instructor either
    }

    return { role: null, message: 'No profile found for this account' };
  }

  /**
   * Get student profile (admin or student themselves)
   */
  @Get('student')
  async getStudentProfile(@Req() req: any) {
    const accountId = req.user?.account_id;
    return this.profileService.getStudentProfile(accountId);
  }

  /**
   * Get parent profile
   */
  @Get('parent')
  async getParentProfile(@Req() req: any) {
    const accountId = req.user?.account_id;
    return this.profileService.getParentProfile(accountId);
  }

  /**
   * Get instructor profile
   */
  @Get('instructor')
  async getInstructorProfile(@Req() req: any) {
    const accountId = req.user?.account_id;
    return this.profileService.getInstructorProfile(accountId);
  }

  /**
   * Get list of all classes for dropdown selection
   */
  @Get('classes')
  async getClasses() {
    return this.profileService.getAllClasses();
  }

  /**
   * Upload avatar image
   */
  @Post('upload-avatar')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads/avatars',
        filename: (req, file, cb) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          cb(null, `avatar-${uniqueSuffix}${ext}`);
        },
      }),
      fileFilter: (req, file, cb) => {
        if (!file.mimetype.match(/\/(jpg|jpeg|png|gif)$/)) {
          return cb(
            new BadRequestException(
              'Chỉ chấp nhận file ảnh (jpg, jpeg, png, gif)',
            ),
            false,
          );
        }
        cb(null, true);
      },
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
      },
    }),
  )
  async uploadAvatar(
    @UploadedFile() file: Express.Multer.File,
    @Req() req: any,
  ) {
    if (!file) {
      throw new BadRequestException('Không có file được upload');
    }

    // Return full URL to the uploaded file
    const protocol = req.protocol;
    const host = req.get('host');
    const url = `${protocol}://${host}/uploads/avatars/${file.filename}`;
    return { url };
  }

  /**
   * Update profile for current logged-in user
   */
  @Put('me')
  async updateMyProfile(@Req() req: any, @Body() updateDto: UpdateProfileDto) {
    const accountId = req.user?.account_id;
    return this.profileService.updateProfile(accountId, updateDto);
  }

  /**
   * Update academic info for student
   */
  @Put('academic')
  async updateAcademicInfo(
    @Req() req: any,
    @Body()
    body: {
      student_code?: string;
      major?: string;
      cohort_year?: number;
      class_code?: string;
    },
  ) {
    const accountId = req.user?.account_id;
    return this.profileService.updateAcademicInfo(accountId, body);
  }

  /**
   * Update parent occupation information
   */
  @Put('parent/occupation')
  async updateParentOccupation(
    @Req() req: any,
    @Body() updateDto: UpdateParentOccupationDto,
  ) {
    const accountId = req.user?.account_id;
    return this.profileService.updateParentOccupation(accountId, updateDto);
  }

  /**
   * Update instructor work information
   */
  @Put('instructor/work')
  async updateInstructorWork(@Req() req: any, @Body() updateDto: any) {
    const accountId = req.user?.account_id;
    return this.profileService.updateInstructorWork(accountId, updateDto);
  }

  /**
   * Get available classes for instructor to advise
   */
  @Get('instructor/available-classes')
  async getAvailableClassesForInstructor() {
    return this.profileService.getAvailableClassesForInstructor();
  }

  /**
   * Update instructor advised classes
   */
  @Put('instructor/advised-classes')
  async updateInstructorAdvisedClasses(
    @Req() req: any,
    @Body() updateDto: any,
  ) {
    const accountId = req.user?.account_id;
    return this.profileService.updateInstructorAdvisedClasses(
      accountId,
      updateDto,
    );
  }

  /**
   * Get all departments (for dropdown)
   */
  @Get('departments')
  async getDepartments() {
    return this.profileService.getDepartments();
  }

  /**
   * Generate parent link code for current student
   */
  @Post('generate-parent-link')
  async generateParentLink(@Req() req: any) {
    const accountId = req.user?.account_id;
    const linkCode =
      await this.profileService.generateParentLinkCode(accountId);
    return { success: true, linkCode };
  }

  /**
   * Get student info by link code (public endpoint for parent registration)
   */
  @Get('student-by-link/:linkCode')
  async getStudentByLinkCode(@Req() req: any) {
    const linkCode = req.params.linkCode;
    return this.profileService.getStudentByLinkCode(linkCode);
  }
}

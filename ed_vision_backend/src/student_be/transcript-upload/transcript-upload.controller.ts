import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { TranscriptUploadService } from './transcript-upload.service';
import { UploadTranscriptDto } from './dto/upload-transcript.dto';
import { TranscriptUploadResponse, StudentTranscriptResponse } from './models/transcript-upload-response.type';
import * as XLSX from 'xlsx';
import { parse } from 'csv-parse/sync';

@Controller('student/transcript')
export class TranscriptUploadController {
  constructor(
    private readonly transcriptUploadService: TranscriptUploadService,
  ) {}

  /**
   * POST /student/transcript/upload
   * Upload transcript từ JSON data
   */
  @Post('upload')
  async uploadTranscript(
    @Body() uploadDto: UploadTranscriptDto,
  ): Promise<TranscriptUploadResponse> {
    return this.transcriptUploadService.uploadTranscript(uploadDto);
  }

  /**
   * POST /student/transcript/upload-file
   * Upload transcript từ file (CSV hoặc Excel)
   */
  @Post('upload-file')
  @UseInterceptors(FileInterceptor('file'))
  async uploadTranscriptFile(
    @UploadedFile() file: Express.Multer.File,
  ): Promise<TranscriptUploadResponse> {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    try {
      // Parse file based on type
      let records;
      const filename = file.originalname.toLowerCase();

      if (filename.endsWith('.csv')) {
        records = this.parseCSV(file.buffer);
      } else if (filename.endsWith('.xlsx') || filename.endsWith('.xls')) {
        records = this.parseExcel(file.buffer);
      } else {
        throw new BadRequestException('Unsupported file format. Please upload CSV or Excel file');
      }

      if (!records || records.length === 0) {
        throw new BadRequestException('File is empty or contains no valid data');
      }

      const uploadDto: UploadTranscriptDto = { records };
      return this.transcriptUploadService.uploadTranscript(uploadDto);
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      
      // Handle parsing errors
      const errorMessage = error.message || 'Failed to parse file';
      throw new BadRequestException(
        `File parsing failed: ${errorMessage}. Please check your file format and try again.`
      );
    }
  }

  /**
   * GET /student/transcript/:studentId
   * Lấy transcript của student
   */
  @Get(':studentId')
  async getStudentTranscript(
    @Param('studentId', ParseIntPipe) studentId: number,
  ): Promise<StudentTranscriptResponse> {
    return this.transcriptUploadService.getStudentTranscript(studentId);
  }

  /**
   * DELETE /student/transcript/:studentId
   * Xóa tất cả transcript records của student
   */
  @Delete(':studentId')
  async deleteStudentTranscript(
    @Param('studentId', ParseIntPipe) studentId: number,
  ): Promise<{ message: string }> {
    await this.transcriptUploadService.deleteStudentTranscript(studentId);
    return { message: 'Transcript deleted successfully' };
  }

  /**
   * Parse CSV file
   */
  private parseCSV(buffer: Buffer): any[] {
    // Remove BOM if present and normalize content
    let content = buffer.toString('utf-8');
    
    // Remove UTF-8 BOM
    if (content.charCodeAt(0) === 0xFEFF) {
      content = content.slice(1);
    }
    
    // Remove any leading/trailing whitespace
    content = content.trim();

    const records = parse(content, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      relax_quotes: true,        // Allow quotes to appear in unquoted fields
      relax_column_count: true,  // Allow inconsistent column count
      bom: true,                 // Handle BOM
    });

    return records.map((record: any) => ({
      student_code: String(record.student_code || record.student_id), // Support both column names
      year: parseInt(record.year) || new Date().getFullYear(),
      semester_number: this.parseSemesterNumber(record.semester_number),
      course_code: record.course_code,
      course_name: record.course_name,
      study_format: record.study_format || 'offline',
      credits_unit: parseInt(record.credits_unit) || 0,
      raw_score: record.raw_score ? parseFloat(record.raw_score) : undefined,
      converted_score: record.converted_score ? String(record.converted_score).substring(0, 5) : undefined, // Limit to 5 chars
      converted_numeric_score: record.converted_numeric_score 
        ? parseFloat(record.converted_numeric_score) 
        : undefined,
    }));
  }

  /**
   * Parse Excel file
   */
  private parseExcel(buffer: Buffer): any[] {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet);

    return data.map((record: any) => ({
      student_code: String(record.student_code || record.student_id), // Support both column names
      year: parseInt(record.year) || new Date().getFullYear(),
      semester_number: this.parseSemesterNumber(record.semester_number),
      course_code: String(record.course_code),
      course_name: String(record.course_name),
      study_format: record.study_format || 'offline',
      credits_unit: parseInt(record.credits_unit) || 0,
      raw_score: record.raw_score ? parseFloat(record.raw_score) : undefined,
      converted_score: record.converted_score ? String(record.converted_score).substring(0, 5) : undefined, // Limit to 5 chars
      converted_numeric_score: record.converted_numeric_score 
        ? parseFloat(record.converted_numeric_score) 
        : undefined,
    }));
  }

  /**
   * Parse semester number from string or number
   * Converts "Hè" to 3, or parses numeric values
   */
  private parseSemesterNumber(value: any): number {
    if (!value) return 1; // Default to semester 1
    
    // Convert to string and normalize
    const strValue = String(value).trim().toLowerCase();
    
    // Check for "Hè" (summer) - case insensitive
    if (strValue === 'hè' || strValue === 'he' || strValue === 'summer') {
      return 3;
    }
    
    // Try to parse as number
    const numValue = parseInt(value);
    if (!isNaN(numValue) && numValue >= 1 && numValue <= 3) {
      return numValue;
    }
    
    // Default to semester 1 if invalid
    return 1;
  }
}

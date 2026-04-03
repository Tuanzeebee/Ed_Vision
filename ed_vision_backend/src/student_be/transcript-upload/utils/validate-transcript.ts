import * as XLSX from 'xlsx';
import * as fs from 'fs';
import { parse } from 'csv-parse/sync';

interface TranscriptRecord {
  student_id: number;
  year: number;
  semester_number: number;
  course_code: string;
  course_name: string;
  study_format?: string;
  credits_unit: number;
  raw_score?: number;
  converted_score?: string;
  converted_numeric_score?: number;
}

interface ValidationError {
  row: number;
  field: string;
  value: any;
  error: string;
}

/**
 * Validate transcript records
 */
export function validateTranscriptRecords(
  records: TranscriptRecord[],
): ValidationError[] {
  const errors: ValidationError[] = [];

  records.forEach((record, index) => {
    const row = index + 1;

    // Validate student_id
    if (!record.student_id || typeof record.student_id !== 'number') {
      errors.push({
        row,
        field: 'student_id',
        value: record.student_id,
        error: 'student_id must be a valid number',
      });
    }

    // Validate year
    if (!record.year || typeof record.year !== 'number') {
      errors.push({
        row,
        field: 'year',
        value: record.year,
        error: 'year must be a valid number',
      });
    } else if (record.year < 2000 || record.year > 2100) {
      errors.push({
        row,
        field: 'year',
        value: record.year,
        error: 'year must be between 2000 and 2100',
      });
    }

    // Validate semester_number
    if (!record.semester_number || typeof record.semester_number !== 'number') {
      errors.push({
        row,
        field: 'semester_number',
        value: record.semester_number,
        error: 'semester_number must be a valid number',
      });
    } else if (![1, 2, 3].includes(record.semester_number)) {
      errors.push({
        row,
        field: 'semester_number',
        value: record.semester_number,
        error: 'semester_number must be 1, 2, or 3',
      });
    }

    // Validate course_code
    if (!record.course_code || typeof record.course_code !== 'string') {
      errors.push({
        row,
        field: 'course_code',
        value: record.course_code,
        error: 'course_code must be a non-empty string',
      });
    }

    // Validate course_name
    if (!record.course_name || typeof record.course_name !== 'string') {
      errors.push({
        row,
        field: 'course_name',
        value: record.course_name,
        error: 'course_name must be a non-empty string',
      });
    }

    // Validate credits_unit
    if (!record.credits_unit || typeof record.credits_unit !== 'number') {
      errors.push({
        row,
        field: 'credits_unit',
        value: record.credits_unit,
        error: 'credits_unit must be a valid number',
      });
    } else if (record.credits_unit < 1 || record.credits_unit > 10) {
      errors.push({
        row,
        field: 'credits_unit',
        value: record.credits_unit,
        error: 'credits_unit must be between 1 and 10',
      });
    }

    // Validate study_format (optional)
    if (
      record.study_format &&
      !['online', 'offline', 'hybrid'].includes(record.study_format)
    ) {
      errors.push({
        row,
        field: 'study_format',
        value: record.study_format,
        error: 'study_format must be "online", "offline", or "hybrid"',
      });
    }

    // Validate raw_score (optional)
    if (
      record.raw_score !== undefined &&
      record.raw_score !== null &&
      typeof record.raw_score === 'number'
    ) {
      if (record.raw_score < 0 || record.raw_score > 10) {
        errors.push({
          row,
          field: 'raw_score',
          value: record.raw_score,
          error: 'raw_score must be between 0 and 10',
        });
      }
    }

    // Validate converted_numeric_score (optional)
    if (
      record.converted_numeric_score !== undefined &&
      record.converted_numeric_score !== null &&
      typeof record.converted_numeric_score === 'number'
    ) {
      if (
        record.converted_numeric_score < 0 ||
        record.converted_numeric_score > 4
      ) {
        errors.push({
          row,
          field: 'converted_numeric_score',
          value: record.converted_numeric_score,
          error: 'converted_numeric_score must be between 0 and 4',
        });
      }
    }
  });

  return errors;
}

/**
 * Parse and validate CSV file
 */
export function validateCSVFile(filePath: string): {
  valid: boolean;
  records?: TranscriptRecord[];
  errors?: ValidationError[];
  parseError?: string;
} {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const records = parse(content, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });

    const transcriptRecords: TranscriptRecord[] = records.map(
      (record: any) => ({
        student_id: parseInt(record.student_id),
        year: parseInt(record.year),
        semester_number: parseInt(record.semester_number),
        course_code: record.course_code,
        course_name: record.course_name,
        study_format: record.study_format || 'offline',
        credits_unit: parseInt(record.credits_unit),
        raw_score: record.raw_score ? parseFloat(record.raw_score) : undefined,
        converted_score: record.converted_score || undefined,
        converted_numeric_score: record.converted_numeric_score
          ? parseFloat(record.converted_numeric_score)
          : undefined,
      }),
    );

    const validationErrors = validateTranscriptRecords(transcriptRecords);

    if (validationErrors.length > 0) {
      return {
        valid: false,
        errors: validationErrors,
      };
    }

    return {
      valid: true,
      records: transcriptRecords,
    };
  } catch (error) {
    return {
      valid: false,
      parseError: error.message,
    };
  }
}

/**
 * Parse and validate Excel file
 */
export function validateExcelFile(filePath: string): {
  valid: boolean;
  records?: TranscriptRecord[];
  errors?: ValidationError[];
  parseError?: string;
} {
  try {
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet);

    const transcriptRecords: TranscriptRecord[] = data.map((record: any) => ({
      student_id: parseInt(record.student_id),
      year: parseInt(record.year),
      semester_number: parseInt(record.semester_number),
      course_code: String(record.course_code),
      course_name: String(record.course_name),
      study_format: record.study_format || 'offline',
      credits_unit: parseInt(record.credits_unit),
      raw_score: record.raw_score ? parseFloat(record.raw_score) : undefined,
      converted_score: record.converted_score
        ? String(record.converted_score)
        : undefined,
      converted_numeric_score: record.converted_numeric_score
        ? parseFloat(record.converted_numeric_score)
        : undefined,
    }));

    const validationErrors = validateTranscriptRecords(transcriptRecords);

    if (validationErrors.length > 0) {
      return {
        valid: false,
        errors: validationErrors,
      };
    }

    return {
      valid: true,
      records: transcriptRecords,
    };
  } catch (error) {
    return {
      valid: false,
      parseError: error.message,
    };
  }
}

// CLI usage
if (require.main === module) {
  const filePath = process.argv[2];

  if (!filePath) {
    console.error('Usage: ts-node validate-transcript.ts <file-path>');
    process.exit(1);
  }

  const ext = filePath.toLowerCase().split('.').pop();
  let result;

  if (ext === 'csv') {
    result = validateCSVFile(filePath);
  } else if (ext === 'xlsx' || ext === 'xls') {
    result = validateExcelFile(filePath);
  } else {
    console.error('Unsupported file format. Please use CSV or Excel file.');
    process.exit(1);
  }

  if (result.valid) {
    console.log(' File is valid!');
    console.log(`Total records: ${result.records?.length}`);
  } else {
    console.log(' File has errors:');
    if (result.parseError) {
      console.error(`Parse error: ${result.parseError}`);
    } else if (result.errors) {
      result.errors.forEach((error) => {
        console.error(
          `Row ${error.row}, Field "${error.field}": ${error.error} (value: ${error.value})`,
        );
      });
    }
    process.exit(1);
  }
}

import {
  IsString,
  IsOptional,
  IsInt,
  IsEmail,
  MinLength,
} from 'class-validator';

export class CreateStudentDto {
  @IsEmail({}, { message: 'Email không hợp lệ' })
  email: string;

  @IsString({ message: 'Mật khẩu phải là chuỗi ký tự' })
  @MinLength(8, { message: 'Mật khẩu phải có ít nhất 8 ký tự' })
  password: string;

  @IsString({ message: 'Họ tên phải là chuỗi ký tự' })
  fullName: string;

  @IsString({ message: 'Mã sinh viên phải là chuỗi ký tự' })
  studentCode: string;

  @IsOptional()
  @IsString({ message: 'Chuyên ngành phải là chuỗi ký tự' })
  major?: string;

  @IsOptional()
  @IsInt({ message: 'Khóa học phải là số nguyên' })
  cohortYear?: number;

  @IsOptional()
  @IsInt({ message: 'ID lớp phải là số nguyên' })
  classId?: number;

  @IsOptional()
  @IsString({ message: 'Ngày sinh phải là chuỗi ký tự' })
  dateOfBirth?: string;

  @IsOptional()
  @IsString({ message: 'Giới tính phải là chuỗi ký tự' })
  gender?: string;

  @IsOptional()
  @IsString({ message: 'Địa chỉ phải là chuỗi ký tự' })
  address?: string;
}

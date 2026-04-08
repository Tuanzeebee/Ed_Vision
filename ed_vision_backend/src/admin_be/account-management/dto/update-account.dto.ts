import {
  IsOptional,
  IsEnum,
  IsString,
  IsDateString,
  IsNumber,
} from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateAccountDto {
  @IsOptional()
  @IsEnum(['active', 'inactive', 'blocked'], {
    message: 'Trạng thái không hợp lệ',
  })
  status?: string;

  @IsOptional()
  @IsString({ message: 'Họ tên phải là chuỗi ký tự' })
  fullName?: string;

  @IsOptional()
  @IsDateString({}, { message: 'Ngày sinh không hợp lệ' })
  dateOfBirth?: string;

  @IsOptional()
  @IsEnum(['Nam', 'Nữ', 'Khác'], { message: 'Giới tính không hợp lệ' })
  gender?: string;

  @IsOptional()
  @IsString({ message: 'Địa chỉ phải là chuỗi ký tự' })
  address?: string;

  @IsOptional()
  @IsString({ message: 'Số điện thoại phải là chuỗi ký tự' })
  phoneNumber?: string;

  // Instructor-specific fields
  @IsOptional()
  @IsString({ message: 'Mã giảng viên phải là chuỗi ký tự' })
  employeeCode?: string;

  @IsOptional()
  @IsString({ message: 'Học hàm phải là chuỗi ký tự' })
  academicTitle?: string;

  @IsOptional()
  @IsString({ message: 'Chức vụ phải là chuỗi ký tự' })
  position?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'ID khoa/phòng ban phải là số' })
  departmentId?: number;

  // For legacy support - will be deprecated in favor of departmentId
  @IsOptional()
  @IsString({ message: 'Khoa/Phòng ban phải là chuỗi ký tự' })
  department?: string;
}

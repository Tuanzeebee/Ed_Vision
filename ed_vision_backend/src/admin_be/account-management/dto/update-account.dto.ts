import { IsOptional, IsEnum, IsString, IsDateString } from 'class-validator';

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

  @IsOptional()
  @IsString({ message: 'Khoa/Phòng ban phải là chuỗi ký tự' })
  department?: string;
}

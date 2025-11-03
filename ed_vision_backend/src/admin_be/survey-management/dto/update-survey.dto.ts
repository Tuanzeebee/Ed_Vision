import { IsOptional, IsString, IsDateString, IsBoolean } from 'class-validator';

export class UpdateSurveyDto {
  @IsOptional()
  @IsString({ message: 'Tiêu đề phải là chuỗi ký tự' })
  title?: string;

  @IsOptional()
  @IsString({ message: 'Mô tả phải là chuỗi ký tự' })
  description?: string;

  @IsOptional()
  @IsDateString({}, { message: 'Ngày bắt đầu không hợp lệ' })
  startDate?: string;

  @IsOptional()
  @IsDateString({}, { message: 'Ngày kết thúc không hợp lệ' })
  endDate?: string;

  @IsOptional()
  @IsBoolean({ message: 'Trạng thái hiển thị phải là boolean' })
  isActive?: boolean;
}

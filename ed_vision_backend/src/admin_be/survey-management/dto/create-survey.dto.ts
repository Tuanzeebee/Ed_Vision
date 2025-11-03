import { IsString, IsOptional, IsDateString, IsBoolean } from 'class-validator';

export class CreateSurveyDto {
  @IsString({ message: 'Tiêu đề phải là chuỗi ký tự' })
  title: string;

  @IsOptional()
  @IsString({ message: 'Mô tả phải là chuỗi ký tự' })
  description?: string;

  @IsDateString({}, { message: 'Ngày bắt đầu không hợp lệ' })
  startDate: string;

  @IsDateString({}, { message: 'Ngày kết thúc không hợp lệ' })
  endDate: string;

  @IsOptional()
  @IsBoolean({ message: 'Trạng thái hiển thị phải là boolean' })
  isActive?: boolean;
}

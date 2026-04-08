import { IsNotEmpty, IsNumber, Min, Max } from 'class-validator';

export class PredictionInputDto {
  @IsNumber()
  @Min(0)
  @Max(60)
  workTime: number; // Thời gian làm việc (giờ/tuần)

  @IsNumber()
  @Min(1)
  @Max(10)
  mentalSupport: number; // Mức hỗ trợ tinh thần (1-10)

  @IsNumber()
  @Min(1)
  @Max(10)
  financialSupport: number; // Mức hỗ trợ tài chính (1-10)
}

import { IsNotEmpty, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { AddAvailabilityDateDto } from './add-availability-date.dto';

export class BulkCreateAvailabilityDto {
  @IsNotEmpty()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AddAvailabilityDateDto)
  availabilities: AddAvailabilityDateDto[];
}


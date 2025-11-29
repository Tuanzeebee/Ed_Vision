import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateParentOccupationDto {
	@IsOptional()
	@IsString()
	@MaxLength(32)
	relationship_type?: string;

	@IsOptional()
	@IsString()
	@MaxLength(120)
	occupation?: string;

	@IsOptional()
	@IsString()
	@MaxLength(255)
	workplace?: string;
}

import { PartialType } from '@nestjs/mapped-types';
import { CreateGradeStructureDto } from './create-grade-structure.dto';

export class UpdateGradeStructureDto extends PartialType(CreateGradeStructureDto) {}

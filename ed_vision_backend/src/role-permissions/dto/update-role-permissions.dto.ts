import { IsObject, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateRolePermissionsDto {
  // mapping of permissionKey -> boolean
  @IsObject()
  @IsOptional()
  // keep as plain object of booleans
  permissions?: Record<string, boolean>;
}

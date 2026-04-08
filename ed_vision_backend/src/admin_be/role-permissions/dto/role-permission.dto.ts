import {
  IsString,
  IsOptional,
  IsInt,
  IsArray,
  IsBoolean,
  MaxLength,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateRoleDto {
  @IsString()
  @MaxLength(50)
  roleName: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  description?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateRoleDto {
  @IsOptional()
  @IsString()
  @MaxLength(50)
  roleName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  description?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class AssignPermissionsDto {
  @IsArray()
  @Type(() => Number)
  @IsInt({ each: true })
  permissionIds: number[];
}

export class CreatePermissionDto {
  @IsString()
  @MaxLength(100)
  permissionName: string;

  @IsString()
  @MaxLength(100)
  resource: string;

  @IsString()
  @MaxLength(50)
  action: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  description?: string;
}

export class RoleFilterDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  isActive?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 10;
}

import { SetMetadata } from '@nestjs/common'

export const REQUIRED_PERMISSION_KEY = 'requiredPermission'
export const RequirePermission = (permissionKey: string) => SetMetadata(REQUIRED_PERMISSION_KEY, permissionKey)

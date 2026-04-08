export interface RoleResponse {
  roleId: number;
  roleName: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
  permissionCount?: number;
}

export interface RoleListResponse {
  data: RoleResponse[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

export interface PermissionResponse {
  permissionId: number;
  permissionName: string;
  resource: string;
  action: string;
  description?: string;
  createdAt: string;
}

export interface RoleWithPermissions {
  roleId: number;
  roleName: string;
  description?: string;
  isActive: boolean;
  permissions: PermissionResponse[];
}

export interface PermissionsByResource {
  resource: string;
  permissions: PermissionResponse[];
}

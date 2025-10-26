import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class RolePermissionsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * roleCode is the role.code (string like 'student', 'teacher', 'admin')
   */
  async getPermissionsForRole(roleCode: string) {
    const prisma = (this.prisma as any)
    const role = await prisma.role.findUnique({ where: { code: roleCode } })
    if (!role) return {}

    const rows = await prisma.rolePermission.findMany({
      where: { roleId: role.id },
      include: { permission: true }
    })
    const map: Record<string, boolean> = {}
    rows.forEach((r: any) => {
      map[r.permission.key] = !!r.enabled
    })
    return map
  }

  async setPermissionsForRole(roleCode: string, perms: Record<string, boolean>) {
    const prisma = (this.prisma as any)
    // find or create role by code
    let role = await prisma.role.findUnique({ where: { code: roleCode } })
    if (!role) {
      role = await prisma.role.create({ data: { code: roleCode, name: roleCode } })
    }

    // delete existing mappings for role
    await prisma.rolePermission.deleteMany({ where: { roleId: role.id } })

    const entries = Object.entries(perms || {})
    if (entries.length === 0) return { success: true }

    // build create data by resolving permission keys to ids
    const createRows: Array<any> = []
    for (const [permissionKey, enabled] of entries) {
      const perm = await prisma.permission.findUnique({ where: { key: permissionKey } })
      if (!perm) {
        // skip or optionally create permission placeholder
        continue
      }
      createRows.push({ roleId: role.id, permissionId: perm.id, enabled: !!enabled })
    }

    if (createRows.length > 0) {
      await prisma.rolePermission.createMany({ data: createRows })
    }

    return { success: true }
  }

  // list all permission definitions
  async listAllPermissions() {
    const prisma = (this.prisma as any)
    const rows = await prisma.permission.findMany({ orderBy: { key: 'asc' } })
    return rows.map((r: any) => ({ key: r.key, name: r.name, category: r.category, sensitive: !!r.sensitive }))
  }
}

export type RolePermissions = Record<string, Record<string, boolean>>

const STORAGE_KEY = 'rolePermissions'

export function loadRolePermissions(): RolePermissions {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    return JSON.parse(raw)
  } catch (e) {
    return {}
  }
}

export function saveRolePermissions(data: RolePermissions) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch (e) {
    console.error('Failed to save role permissions', e)
  }
}

export function getPermissionsForRole(roleId: string) {
  return loadRolePermissions()[roleId] || {}
}

export function setPermissionsForRole(roleId: string, perms: Record<string, boolean>) {
  const all = loadRolePermissions()
  all[roleId] = perms
  saveRolePermissions(all)
}

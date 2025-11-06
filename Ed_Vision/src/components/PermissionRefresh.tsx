import { useState } from 'react'
import { PermissionService } from '@/services/permissionService'

/**
 * Component để refresh permissions manually
 */
export function PermissionRefreshButton() {
  const [isLoading, setIsLoading] = useState(false)

  const handleRefresh = async () => {
    setIsLoading(true)
    try {
      await PermissionService.refreshPermissions()
    } catch (error) {
      console.error('Failed to refresh permissions:', error)
      alert('Không thể cập nhật quyền. Vui lòng thử lại.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <button
      onClick={handleRefresh}
      disabled={isLoading}
      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
    >
      {isLoading ? (
        <>
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
          <span>Đang cập nhật...</span>
        </>
      ) : (
        <>
          <span>🔄</span>
          <span>Cập nhật quyền</span>
        </>
      )}
    </button>
  )
}

/**
 * Component để hiển thị permissions hiện tại của user
 */
export function CurrentPermissionsDisplay() {
  const user = PermissionService.getCurrentUser()
  const permissions = PermissionService.getUserPermissions()
  const role = user?.roleRel?.code || user?.role || 'unknown'

  if (!user) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        Không tìm thấy thông tin user
      </div>
    )
  }

  const enabledPermissions = Object.entries(permissions).filter(([_, enabled]) => enabled)
  const totalPermissions = Object.keys(permissions).length

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">Quyền hiện tại</h3>
        <PermissionRefreshButton />
      </div>

      <div className="space-y-2 mb-4">
        <div><strong>Vai trò:</strong> {role}</div>
        <div><strong>Email:</strong> {user.email}</div>
        <div><strong>Tổng quyền:</strong> {enabledPermissions.length}/{totalPermissions}</div>
      </div>

      {enabledPermissions.length > 0 ? (
        <div>
          <h4 className="font-medium text-gray-700 mb-2">Các quyền được cấp:</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {enabledPermissions.map(([permission, _]) => (
              <div key={permission} className="flex items-center space-x-2 text-sm">
                <span className="text-green-500">✅</span>
                <code className="bg-gray-100 px-2 py-1 rounded text-xs">{permission}</code>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-gray-500 text-center py-4">
          Không có quyền nào được cấp
        </div>
      )}
    </div>
  )
}
import { httpsCallable } from 'firebase/functions'
import { functions } from '@/services/functions'
import type { AdminUserManagementState } from '@/types/admin'

interface SetRoleRequest {
  uid: string
  role: 'user' | 'admin'
  reason?: string
}

interface SetDisabledRequest {
  uid: string
  disabled: boolean
  reason?: string
}

export async function setAdminUserRole(
  uid: string,
  role: 'user' | 'admin',
  reason?: string,
): Promise<AdminUserManagementState> {
  const callable = httpsCallable<SetRoleRequest, AdminUserManagementState>(
    functions,
    'adminSetUserRole',
  )
  const result = await callable({ uid, role, reason })
  return result.data
}

export async function setAdminUserDisabled(
  uid: string,
  disabled: boolean,
  reason?: string,
): Promise<AdminUserManagementState> {
  const callable = httpsCallable<SetDisabledRequest, AdminUserManagementState>(
    functions,
    'adminSetUserDisabled',
  )
  const result = await callable({ uid, disabled, reason })
  return result.data
}

interface DeleteUserRequest {
  uid: string
  confirmation: string
  reason?: string
}

export async function deleteAdminUser(
  uid: string,
  confirmation: string,
  reason?: string,
): Promise<{ uid: string; deleted: boolean }> {
  const callable = httpsCallable<
    DeleteUserRequest,
    { uid: string; deleted: boolean }
  >(functions, 'adminDeleteUser')
  const result = await callable({ uid, confirmation, reason })
  return result.data
}

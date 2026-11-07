import { randomUUID } from 'node:crypto'
import { initializeApp } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { FieldValue, Timestamp, getFirestore } from 'firebase-admin/firestore'
import { HttpsError, onCall } from 'firebase-functions/v2/https'
import { recordError } from '../utils/errorLog.js'
import { logInfo } from '../utils/logger.js'

initializeApp()
const db = getFirestore()
const auth = getAuth()

const LOCK_MS = 60_000
const MAX_REASON_LENGTH = 500

interface SetRoleRequest {
  uid?: string
  role?: 'user' | 'admin'
  reason?: string
}

interface SetDisabledRequest {
  uid?: string
  disabled?: boolean
  reason?: string
}

interface ManagedUser {
  role: 'owner' | 'admin' | 'user'
  disabled: boolean
  email: string | null
}

async function requireAdmin(request: {
  auth?: { uid?: string; token?: Record<string, unknown> }
}): Promise<string> {
  const callerUid = request.auth?.uid
  if (!callerUid) {
    throw new HttpsError('unauthenticated', 'Sign in required.')
  }
  if (request.auth?.token?.admin !== true) {
    throw new HttpsError('permission-denied', 'Admin access required.')
  }
  const callerSnapshot = await db.collection('users').doc(callerUid).get()
  const caller = callerSnapshot.data()
  if (
    !callerSnapshot.exists ||
    caller?.disabled === true ||
    (caller?.role !== 'admin' && caller?.role !== 'owner')
  ) {
    throw new HttpsError('permission-denied', 'Admin access required.')
  }
  return callerUid
}

async function requireOwner(request: {
  auth?: { uid?: string; token?: Record<string, unknown> }
}): Promise<string> {
  const callerUid = await requireAdmin(request)
  const caller = await db.collection('users').doc(callerUid).get()
  if (caller.data()?.role !== 'owner') {
    throw new HttpsError(
      'permission-denied',
      'Only the owner can permanently delete accounts.',
    )
  }
  return callerUid
}

function cleanReason(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined
  const reason = value.trim()
  return reason ? reason.slice(0, MAX_REASON_LENGTH) : undefined
}

function validUid(value: unknown): string {
  if (typeof value !== 'string' || !value.trim()) {
    throw new HttpsError('invalid-argument', 'A valid user ID is required.')
  }
  return value.trim()
}

async function readManagedUser(uid: string): Promise<ManagedUser> {
  const snapshot = await db.collection('users').doc(uid).get()
  if (!snapshot.exists) {
    throw new HttpsError('not-found', 'User not found.')
  }
  const data = snapshot.data() ?? {}
  const role =
    data.role === 'owner' || data.role === 'admin' || data.role === 'user'
      ? data.role
      : 'user'
  return {
    role,
    disabled: data.disabled === true,
    email: typeof data.email === 'string' ? data.email : null,
  }
}

function assertMutableTarget(
  actorUid: string,
  targetUid: string,
  target: ManagedUser,
): void {
  if (actorUid === targetUid) {
    throw new HttpsError(
      'failed-precondition',
      'You cannot change your own role or disable your own account.',
    )
  }
  if (target.role === 'owner') {
    throw new HttpsError(
      'permission-denied',
      'The owner account is protected and cannot be modified by an admin.',
    )
  }
}

async function activeAdminCount(excludingUid?: string): Promise<number> {
  const snapshot = await db
    .collection('users')
    .where('role', 'in', ['admin', 'owner'])
    .get()
  return snapshot.docs.filter(
    (document) =>
      document.id !== excludingUid &&
      document.data().disabled !== true,
  ).length
}

async function assertAdminRemains(targetUid: string, target: ManagedUser): Promise<void> {
  if (
    (target.role === 'admin' || target.role === 'owner') &&
    !target.disabled &&
    (await activeAdminCount(targetUid)) === 0
  ) {
    throw new HttpsError(
      'failed-precondition',
      'This action would remove the last active administrator.',
    )
  }
}

async function withAdminLock<T>(action: () => Promise<T>): Promise<T> {
  const lockRef = db.collection('adminControl').doc('security')
  const token = randomUUID()
  const now = Date.now()

  await db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(lockRef)
    const data = snapshot.data()
    const expiresAt = data?.lockExpiresAt?.toMillis?.() ?? 0
    if (expiresAt > now) {
      throw new HttpsError(
        'failed-precondition',
        'Another administrator action is in progress. Try again.',
      )
    }
    transaction.set(
      lockRef,
      {
        lockToken: token,
        lockExpiresAt: Timestamp.fromMillis(now + LOCK_MS),
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    )
  })

  try {
    return await action()
  } finally {
    await db
      .runTransaction(async (transaction) => {
        const snapshot = await transaction.get(lockRef)
        if (snapshot.data()?.lockToken === token) {
          transaction.delete(lockRef)
        }
      })
      .catch(() => undefined)
  }
}

async function writeAudit(input: {
  actorUid: string
  targetUid: string
  targetEmail: string | null
  action:
    | 'role-changed'
    | 'user-disabled'
    | 'user-enabled'
    | 'user-delete-requested'
    | 'user-deleted'
    | 'user-delete-failed'
  beforeRole: string
  afterRole: string
  beforeDisabled: boolean
  afterDisabled: boolean
  reason?: string
  metadata?: Record<string, unknown>
}): Promise<void> {
  await db.collection('adminAuditLogs').add({
    ...input,
    actorType: 'admin',
    createdAt: FieldValue.serverTimestamp(),
  })
}

function claimsWithAdmin(
  claims: Record<string, unknown> | undefined,
  isAdmin: boolean,
): Record<string, unknown> {
  return { ...(claims ?? {}), admin: isAdmin }
}

export const adminSetUserRole = onCall(
  { memory: '256MiB', timeoutSeconds: 60, maxInstances: 2 },
  async (request) => {
    const actorUid = await requireAdmin(request)
    const data = (request.data ?? {}) as SetRoleRequest
    const targetUid = validUid(data.uid)
    if (data.role !== 'user' && data.role !== 'admin') {
      throw new HttpsError('invalid-argument', 'Role must be "user" or "admin".')
    }
    const nextRole = data.role
    const reason = cleanReason(data.reason)

    try {
      return await withAdminLock(async () => {
        const targetRef = db.collection('users').doc(targetUid)
        const target = await readManagedUser(targetUid)
        assertMutableTarget(actorUid, targetUid, target)
        if (target.role === nextRole) {
          return { uid: targetUid, role: target.role, disabled: target.disabled }
        }
        if (target.role === 'admin' && nextRole === 'user') {
          await assertAdminRemains(targetUid, target)
        }

        await targetRef.update({
          role: nextRole,
          updatedAt: FieldValue.serverTimestamp(),
          adminUpdatedAt: FieldValue.serverTimestamp(),
          adminUpdatedBy: actorUid,
        })

        try {
          const authUser = await auth.getUser(targetUid)
          await auth.setCustomUserClaims(
            targetUid,
            claimsWithAdmin(authUser.customClaims, nextRole === 'admin'),
          )
          await auth.revokeRefreshTokens(targetUid)
        } catch (error) {
          await targetRef.update({
            role: target.role,
            updatedAt: FieldValue.serverTimestamp(),
          })
          throw error
        }

        await writeAudit({
          actorUid,
          targetUid,
          targetEmail: target.email,
          action: 'role-changed',
          beforeRole: target.role,
          afterRole: nextRole,
          beforeDisabled: target.disabled,
          afterDisabled: target.disabled,
          reason,
        })
        logInfo('admin.user.role_changed', {
          actorUid,
          targetUid,
          from: target.role,
          to: nextRole,
        })
        return { uid: targetUid, role: nextRole, disabled: target.disabled }
      })
    } catch (error) {
      await recordError('adminSetUserRole', error, { actorUid, targetUid })
      if (error instanceof HttpsError) throw error
      throw new HttpsError('internal', 'Unable to update this user role.')
    }
  },
)

export const adminSetUserDisabled = onCall(
  { memory: '256MiB', timeoutSeconds: 60, maxInstances: 2 },
  async (request) => {
    const actorUid = await requireAdmin(request)
    const data = (request.data ?? {}) as SetDisabledRequest
    const targetUid = validUid(data.uid)
    if (typeof data.disabled !== 'boolean') {
      throw new HttpsError('invalid-argument', 'disabled must be true or false.')
    }
    const nextDisabled = data.disabled
    const reason = cleanReason(data.reason)

    try {
      return await withAdminLock(async () => {
        const targetRef = db.collection('users').doc(targetUid)
        const target = await readManagedUser(targetUid)
        assertMutableTarget(actorUid, targetUid, target)
        if (target.disabled === nextDisabled) {
          return { uid: targetUid, role: target.role, disabled: target.disabled }
        }
        if (nextDisabled) {
          await assertAdminRemains(targetUid, target)
        }

        await targetRef.update({
          disabled: nextDisabled,
          updatedAt: FieldValue.serverTimestamp(),
          adminUpdatedAt: FieldValue.serverTimestamp(),
          adminUpdatedBy: actorUid,
        })

        try {
          await auth.updateUser(targetUid, { disabled: nextDisabled })
          if (nextDisabled) {
            await auth.revokeRefreshTokens(targetUid)
          }
        } catch (error) {
          await targetRef.update({
            disabled: target.disabled,
            updatedAt: FieldValue.serverTimestamp(),
          })
          throw error
        }

        await writeAudit({
          actorUid,
          targetUid,
          targetEmail: target.email,
          action: nextDisabled ? 'user-disabled' : 'user-enabled',
          beforeRole: target.role,
          afterRole: target.role,
          beforeDisabled: target.disabled,
          afterDisabled: nextDisabled,
          reason,
        })
        logInfo(
          nextDisabled ? 'admin.user.disabled' : 'admin.user.enabled',
          { actorUid, targetUid },
        )
        return { uid: targetUid, role: target.role, disabled: nextDisabled }
      })
    } catch (error) {
      await recordError('adminSetUserDisabled', error, { actorUid, targetUid })
      if (error instanceof HttpsError) throw error
      throw new HttpsError('internal', 'Unable to update this account.')
    }
  },
)


interface DeleteUserRequest {
  uid?: string
  confirmation?: string
  reason?: string
}

const USER_DATA_COLLECTIONS = [
  'jobs',
  'companies',
  'jobAnalyses',
  'applications',
  'applicationEvents',
  'applicationPreparations',
  'outreach',
  'contacts',
  'followUps',
  'resumeVariants',
  'projects',
  'jobSources',
  'activityLogs',
  'aiRuns',
  'errorLogs',
  'discoveryLocks',
] as const

interface PurgeCounts {
  [collectionName: string]: number
}

async function purgeUserCollection(
  collectionName: string,
  uid: string,
): Promise<number> {
  let total = 0
  while (true) {
    const snapshot = await db
      .collection(collectionName)
      .where('userId', '==', uid)
      .limit(400)
      .get()
    if (snapshot.empty) break

    const batch = db.batch()
    for (const document of snapshot.docs) {
      batch.delete(document.ref)
    }
    await batch.commit()
    total += snapshot.size
  }
  return total
}

async function purgeUserData(uid: string): Promise<PurgeCounts> {
  const counts: PurgeCounts = {}
  for (const collectionName of USER_DATA_COLLECTIONS) {
    counts[collectionName] = await purgeUserCollection(collectionName, uid)
  }

  await db.collection('profiles').doc(uid).delete()
  await db.collection('settings').doc(uid).delete()
  return counts
}

function isAuthUserMissing(error: unknown): boolean {
  const code = (error as { code?: unknown } | null)?.code
  const message = error instanceof Error ? error.message : String(error)
  return (
    code === 'auth/user-not-found' ||
    /user.?not.?found/i.test(message)
  )
}

export const adminDeleteUser = onCall(
  { memory: '512MiB', timeoutSeconds: 540, maxInstances: 1 },
  async (request) => {
    const actorUid = await requireOwner(request)
    const data = (request.data ?? {}) as DeleteUserRequest
    const targetUid = validUid(data.uid)
    const confirmation =
      typeof data.confirmation === 'string' ? data.confirmation.trim() : ''
    if (!confirmation) {
      throw new HttpsError(
        'invalid-argument',
        'Type the target email or UID to confirm deletion.',
      )
    }
    const reason = cleanReason(data.reason)
    if (!reason) {
      throw new HttpsError(
        'invalid-argument',
        'A reason is required for account deletion.',
      )
    }

    try {
      return await withAdminLock(async () => {
        const targetRef = db.collection('users').doc(targetUid)
        const target = await readManagedUser(targetUid)
        if (actorUid === targetUid) {
          throw new HttpsError(
            'failed-precondition',
            'You cannot delete your own account.',
          )
        }
        if (target.role === 'owner') {
          throw new HttpsError(
            'permission-denied',
            'The owner account cannot be deleted.',
          )
        }
        if (confirmation !== targetUid && confirmation !== target.email) {
          throw new HttpsError(
            'invalid-argument',
            'Confirmation must exactly match the target email or UID.',
          )
        }
        await assertAdminRemains(targetUid, target)

        await targetRef.set(
          {
            disabled: true,
            deletionStatus: 'purging',
            deletionRequestedAt: FieldValue.serverTimestamp(),
            adminUpdatedAt: FieldValue.serverTimestamp(),
            adminUpdatedBy: actorUid,
          },
          { merge: true },
        )

        await writeAudit({
          actorUid,
          targetUid,
          targetEmail: target.email,
          action: 'user-delete-requested',
          beforeRole: target.role,
          afterRole: target.role,
          beforeDisabled: target.disabled,
          afterDisabled: true,
          reason,
        })

        try {
          try {
            await auth.updateUser(targetUid, { disabled: true })
            await auth.revokeRefreshTokens(targetUid)
          } catch (error) {
            if (!isAuthUserMissing(error)) throw error
          }

          const counts = await purgeUserData(targetUid)

          try {
            await auth.deleteUser(targetUid)
          } catch (error) {
            if (!isAuthUserMissing(error)) throw error
          }

          await writeAudit({
            actorUid,
            targetUid,
            targetEmail: target.email,
            action: 'user-deleted',
            beforeRole: target.role,
            afterRole: target.role,
            beforeDisabled: true,
            afterDisabled: true,
            reason,
            metadata: { purged: counts },
          })
          await targetRef.delete()
          logInfo('admin.user.deleted', { actorUid, targetUid, counts })
          return { uid: targetUid, deleted: true, purged: counts }
        } catch (error) {
          await targetRef
            .set(
              {
                disabled: true,
                deletionStatus: 'error',
                deletionError:
                  error instanceof Error ? error.message.slice(0, 500) : 'Unknown error',
                adminUpdatedAt: FieldValue.serverTimestamp(),
                adminUpdatedBy: actorUid,
              },
              { merge: true },
            )
            .catch(() => undefined)
          await writeAudit({
            actorUid,
            targetUid,
            targetEmail: target.email,
            action: 'user-delete-failed',
            beforeRole: target.role,
            afterRole: target.role,
            beforeDisabled: target.disabled,
            afterDisabled: true,
            reason,
          }).catch(() => undefined)
          throw error
        }
      })
    } catch (error) {
      await recordError('adminDeleteUser', error, { actorUid, targetUid })
      if (error instanceof HttpsError) throw error
      throw new HttpsError('internal', 'Unable to delete this account.')
    }
  },
)

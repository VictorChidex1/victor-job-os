import { initializeApp } from 'firebase-admin/app'
import { FieldValue, getFirestore } from 'firebase-admin/firestore'
import { HttpsError, onCall } from 'firebase-functions/v2/https'
import { recordError } from '../utils/errorLog.js'
import { logInfo } from '../utils/logger.js'

initializeApp()
const db = getFirestore()

interface BudgetControlRequest {
  paused?: unknown
  reason?: unknown
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
  const snapshot = await db.collection('users').doc(callerUid).get()
  const caller = snapshot.data()
  if (
    !snapshot.exists ||
    caller?.disabled === true ||
    (caller?.role !== 'admin' && caller?.role !== 'owner')
  ) {
    throw new HttpsError('permission-denied', 'Admin access required.')
  }
  return callerUid
}

export const adminSetBudgetPause = onCall(
  { memory: '256MiB', timeoutSeconds: 30, maxInstances: 1 },
  async (request) => {
    const actorUid = await requireAdmin(request)
    const data = (request.data ?? {}) as BudgetControlRequest
    if (typeof data.paused !== 'boolean') {
      throw new HttpsError('invalid-argument', 'paused must be true or false.')
    }
    const paused = data.paused
    const reason =
      typeof data.reason === 'string' && data.reason.trim()
        ? data.reason.trim().slice(0, 500)
        : paused
          ? 'AI and automation paused by an administrator.'
          : 'AI and automation resumed by an administrator.'
    const ref = db.collection('systemControl').doc('budget')

    try {
      await ref.set(
        {
          aiPaused: paused,
          automationPaused: paused,
          reason,
          ...(paused
            ? {
                pausedAt: FieldValue.serverTimestamp(),
                pausedBy: actorUid,
                resumedAt: FieldValue.delete(),
                resumedBy: FieldValue.delete(),
              }
            : {
                resumedAt: FieldValue.serverTimestamp(),
                resumedBy: actorUid,
              }),
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true },
      )

      await db.collection('adminAuditLogs').add({
        actorUid,
        targetUid: 'systemControl/budget',
        targetEmail: null,
        actorType: 'admin',
        action: paused ? 'budget-paused' : 'budget-resumed',
        reason,
        createdAt: FieldValue.serverTimestamp(),
      })

      logInfo(paused ? 'budget.manual_paused' : 'budget.manual_resumed', {
        actorUid,
      })
      return { paused, reason }
    } catch (error) {
      await recordError('adminSetBudgetPause', error, { actorUid })
      if (error instanceof HttpsError) throw error
      throw new HttpsError('internal', 'Unable to update budget control.')
    }
  },
)

import { initializeApp } from 'firebase-admin/app'
import { getFirestore, FieldValue, Timestamp } from 'firebase-admin/firestore'
import { randomUUID } from 'node:crypto'
import { logInfo, logWarn } from '../utils/logger.js'

initializeApp()
const db = getFirestore()

/** A crashed run must not block discovery forever. */
export const DISCOVERY_LOCK_TTL_MS = 15 * 60 * 1000

function lockRef(uid: string) {
  return db.collection('discoveryLocks').doc(uid)
}

/**
 * Acquires a per-user discovery lock. Returns a token on success, or null when
 * another run still holds the lock.
 */
export async function acquireDiscoveryLock(uid: string): Promise<string | null> {
  const ref = lockRef(uid)
  try {
    return await db.runTransaction(async (transaction) => {
      const snapshot = await transaction.get(ref)
      const now = Date.now()

      if (snapshot.exists) {
        const data = snapshot.data() as { expiresAt?: Timestamp }
        const expiresAt = data.expiresAt?.toMillis?.() ?? 0
        if (expiresAt > now) {
          logInfo('discovery.lock.busy', { userId: uid, expiresAt })
          return null
        }
      }

      const token = randomUUID()
      transaction.set(ref, {
        userId: uid,
        token,
        lockedAt: FieldValue.serverTimestamp(),
        expiresAt: Timestamp.fromMillis(now + DISCOVERY_LOCK_TTL_MS),
      })
      logInfo('discovery.lock.acquired', { userId: uid })
      return token
    })
  } catch (error) {
    logWarn('discovery.lock.acquire_failed', {
      userId: uid,
      error: error instanceof Error ? error.message : String(error),
    })
    return null
  }
}

/** Releases the lock only if the caller still owns it. Never throws. */
export async function releaseDiscoveryLock(uid: string, token: string): Promise<void> {
  const ref = lockRef(uid)
  try {
    await db.runTransaction(async (transaction) => {
      const snapshot = await transaction.get(ref)
      if (!snapshot.exists) {
        return
      }
      if (snapshot.data()?.token !== token) {
        return
      }
      transaction.delete(ref)
      logInfo('discovery.lock.released', { userId: uid })
    })
  } catch (error) {
    logWarn('discovery.lock.release_failed', {
      userId: uid,
      error: error instanceof Error ? error.message : String(error),
    })
  }
}

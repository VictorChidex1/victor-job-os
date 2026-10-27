import { addDoc, collection, serverTimestamp } from 'firebase/firestore'
import { db } from '@/services/firestore'
import { collections } from '@/services/collections'
import { auth } from '@/services/auth'

/**
 * Reports a client-side error to the browser console and, when signed in, to
 * the `errorLogs` collection for later inspection. Never throws.
 */
export async function reportClientError(
  error: unknown,
  context: Record<string, unknown> = {},
): Promise<void> {
  const message = error instanceof Error ? error.message : String(error)
  console.error('[client]', message, context)

  const user = auth.currentUser
  if (!user) {
    return
  }

  try {
    await addDoc(collection(db, collections.errorLogs), {
      userId: user.uid,
      fn: 'client',
      message: message.slice(0, 2000),
      stack: error instanceof Error && error.stack ? error.stack.slice(0, 5000) : null,
      context,
      createdAt: serverTimestamp(),
    })
  } catch {
    // Reporting must never break the app.
  }
}

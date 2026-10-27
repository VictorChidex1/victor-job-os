import { initializeApp } from 'firebase-admin/app'
import { getFirestore, FieldValue } from 'firebase-admin/firestore'
import { logError } from './logger.js'

initializeApp()
const db = getFirestore()

export interface ErrorContext {
  userId?: string | null
  [key: string]: unknown
}

function toPlain(value: unknown): unknown {
  try {
    return JSON.parse(JSON.stringify(value))
  } catch {
    return String(value)
  }
}

/**
 * Logs an error to Cloud Logging/Error Reporting and stores a compact record
 * in Firestore (`errorLogs`) for later inspection. Never throws.
 */
export async function recordError(
  fnName: string,
  error: unknown,
  context: ErrorContext = {},
): Promise<void> {
  const message = error instanceof Error ? error.message : String(error)
  const stack = error instanceof Error ? (error.stack ?? null) : null

  logError(`${fnName}.failed`, error, { fn: fnName, ...context })

  try {
    await db.collection('errorLogs').add({
      userId: context.userId ?? null,
      fn: fnName,
      message: message.slice(0, 2000),
      stack: stack ? stack.slice(0, 5000) : null,
      context: toPlain(context) as Record<string, unknown>,
      createdAt: FieldValue.serverTimestamp(),
    })
  } catch (writeError) {
    logError('errorLogs.write.failed', writeError, { fn: fnName })
  }
}

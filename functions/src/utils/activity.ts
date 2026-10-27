import { initializeApp } from 'firebase-admin/app'
import { getFirestore, FieldValue } from 'firebase-admin/firestore'

initializeApp()
const db = getFirestore()

export type ActivityType =
  | 'job-discovery'
  | 'job-analysis'
  | 'company-research'
  | 'outreach'
  | 'follow-up'

export type ActivityStatus = 'completed' | 'failed' | 'skipped'

/**
 * Writes a user-visible activity entry. Activity logging must never break the
 * main workflow, so failures are swallowed.
 */
export async function recordActivity(
  uid: string,
  type: ActivityType,
  status: ActivityStatus,
  message: string,
  metadata: Record<string, unknown> = {},
): Promise<void> {
  try {
    await db.collection('activityLogs').add({
      userId: uid,
      type,
      status,
      message,
      metadata,
      createdAt: FieldValue.serverTimestamp(),
    })
  } catch {
    // Ignore activity-log failures.
  }
}

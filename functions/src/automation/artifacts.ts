import { randomUUID } from 'node:crypto'
import {
  Timestamp,
  type Firestore,
} from 'firebase-admin/firestore'
import { getStorage } from 'firebase-admin/storage'
import type {
  AutomationArtifact,
  AutomationArtifactKind,
  AutomationScreenshot,
} from './types.js'

const ARTIFACT_TTL_MS = 24 * 60 * 60 * 1000
const MAX_ARTIFACTS = 3

function storageBucketName(): string {
  if (process.env.STORAGE_BUCKET) return process.env.STORAGE_BUCKET
  try {
    const config = JSON.parse(process.env.FIREBASE_CONFIG ?? '{}') as {
      storageBucket?: unknown
    }
    if (typeof config.storageBucket === 'string' && config.storageBucket) {
      return config.storageBucket
    }
  } catch {
    // Fall through to the project-derived bucket name.
  }
  return `${process.env.GCLOUD_PROJECT ?? 'victor-job-os'}.firebasestorage.app`
}

function bucket() {
  if (process.env.FUNCTIONS_EMULATOR === 'true') {
    process.env.STORAGE_EMULATOR_HOST ??= '127.0.0.1:9199'
  }
  return getStorage().bucket(storageBucketName())
}

export async function saveAutomationScreenshot({
  db,
  screenshot,
  userId,
  applicationId,
  runId,
  sessionId,
  kind,
  label,
}: {
  db: Firestore
  screenshot: AutomationScreenshot
  userId: string
  applicationId: string
  runId: string
  sessionId?: string
  kind: AutomationArtifactKind
  label: string
}): Promise<AutomationArtifact> {
  const id = randomUUID()
  const storagePath = `automation/${userId}/${runId}/${id}.webp`
  const file = bucket().file(storagePath)

  try {
    await file.save(screenshot.buffer, {
      resumable: false,
      contentType: 'image/webp',
      metadata: {
        cacheControl: 'private, max-age=86400',
      },
    })

    const artifact: AutomationArtifact = {
      id,
      kind,
      label,
      storagePath,
      contentType: 'image/webp',
      size: screenshot.size,
      ...(screenshot.width ? { width: screenshot.width } : {}),
      ...(screenshot.height ? { height: screenshot.height } : {}),
      ...(screenshot.pageUrl ? { pageUrl: screenshot.pageUrl } : {}),
      ...(screenshot.pageTitle ? { pageTitle: screenshot.pageTitle } : {}),
      createdAt: new Date().toISOString(),
    }

    const ref = db.collection('automationArtifacts').doc(runId)
    const now = Timestamp.now()
    const expiresAt = Timestamp.fromMillis(now.toMillis() + ARTIFACT_TTL_MS)

    await db.runTransaction(async (transaction) => {
      const snapshot = await transaction.get(ref)
      const data = snapshot.data() ?? {}
      const existing = Array.isArray(data.artifacts)
        ? (data.artifacts as AutomationArtifact[])
        : []
      const artifacts = [...existing, artifact].slice(-MAX_ARTIFACTS)
      transaction.set(
        ref,
        {
          userId,
          applicationId,
          runId,
          ...(sessionId ? { sessionId } : {}),
          artifacts,
          expiresAt,
          createdAt: data.createdAt ?? now,
          updatedAt: now,
        },
        { merge: true },
      )
    })

    return artifact
  } catch (error) {
    await file.delete().catch(() => undefined)
    throw error
  }
}

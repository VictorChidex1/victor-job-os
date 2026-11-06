import {
  collection,
  getCountFromServer,
  getDocs,
  limit,
  orderBy,
  query,
  Timestamp,
  where,
  type DocumentData,
} from 'firebase/firestore'
import { db } from '@/services/firestore'
import { collections } from '@/services/collections'
import { loadAdminAiSummary, toAdminAiRun } from '@/services/adminAiUsage'
import { loadAdminErrorSummary, toAdminErrorLog } from '@/services/adminErrors'
import type {
  AdminActivityEntry,
  AdminActivitySummary,
  AdminSystemHealth,
} from '@/types/admin'

const DAY_MS = 24 * 60 * 60 * 1000

export async function loadAdminSystemHealth(): Promise<AdminSystemHealth> {
  const now = Date.now()
  const dayAgo = Timestamp.fromDate(new Date(now - DAY_MS))

  const [
    userCount,
    jobCount,
    applicationCount,
    outreachCount,
    companyCount,
    resumeCount,
    activeDiscoveryLocks,
    ai,
    errors,
    activity,
    recentErrors,
    recentAiRuns,
    recentActivity,
  ] = await Promise.all([
    getCountFromServer(collection(db, collections.users)),
    getCountFromServer(collection(db, collections.jobs)),
    getCountFromServer(collection(db, collections.applications)),
    getCountFromServer(collection(db, collections.outreach)),
    getCountFromServer(collection(db, collections.companies)),
    getCountFromServer(collection(db, collections.resumeVariants)),
    getCountFromServer(
      query(
        collection(db, collections.discoveryLocks),
        where('expiresAt', '>', Timestamp.now()),
      ),
    ),
    loadAdminAiSummary(),
    loadAdminErrorSummary(),
    loadActivitySummary(dayAgo),
    getDocs(
      query(
        collection(db, collections.errorLogs),
        orderBy('createdAt', 'desc'),
        limit(5),
      ),
    ),
    getDocs(
      query(
        collection(db, collections.aiRuns),
        orderBy('createdAt', 'desc'),
        limit(5),
      ),
    ),
    getDocs(
      query(
        collection(db, collections.activityLogs),
        orderBy('createdAt', 'desc'),
        limit(5),
      ),
    ),
  ])

  return {
    environment:
      import.meta.env.VITE_FIREBASE_EMULATOR === 'true' ? 'Emulator' : 'Production',
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID ?? 'unknown',
    generatedAt: Timestamp.now(),
    counts: {
      users: userCount.data().count,
      jobs: jobCount.data().count,
      applications: applicationCount.data().count,
      outreach: outreachCount.data().count,
      companies: companyCount.data().count,
      resumeVariants: resumeCount.data().count,
    },
    ai,
    errors,
    activity,
    activeDiscoveryLocks: activeDiscoveryLocks.data().count,
    recentErrors: recentErrors.docs.map((document) =>
      toAdminErrorLog(document.id, document.data()),
    ),
    recentAiRuns: recentAiRuns.docs.map((document) =>
      toAdminAiRun(document.id, document.data()),
    ),
    recentActivity: recentActivity.docs.map((document) =>
      toAdminActivityEntry(document.id, document.data()),
    ),
  }
}

async function loadActivitySummary(dayAgo: Timestamp): Promise<AdminActivitySummary> {
  const [last24h, latest] = await Promise.all([
    getCountFromServer(
      query(
        collection(db, collections.activityLogs),
        where('createdAt', '>=', dayAgo),
      ),
    ),
    getDocs(
      query(
        collection(db, collections.activityLogs),
        orderBy('createdAt', 'desc'),
        limit(1),
      ),
    ),
  ])

  return {
    last24h: last24h.data().count,
    lastActivityAt: latest.docs[0]?.get('createdAt') as Timestamp | undefined,
  }
}

function toAdminActivityEntry(
  id: string,
  data: DocumentData,
): AdminActivityEntry {
  return {
    id,
    userId: text(data.userId),
    type: text(data.type) || 'unknown',
    status: text(data.status) || 'unknown',
    message: text(data.message),
    metadata: isRecord(data.metadata) ? data.metadata : undefined,
    createdAt: data.createdAt as Timestamp | undefined,
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function text(value: unknown): string {
  return typeof value === 'string' ? value : ''
}

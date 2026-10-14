import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  type DocumentData,
  type Timestamp,
} from 'firebase/firestore'
import { db } from '@/services/firestore'
import { collections } from '@/services/collections'
import type { JobAnalysis } from '@/types/jobs'

const jobAnalysesCollection = collection(db, collections.jobAnalyses)

export async function getAnalysisForJob(uid: string, jobId: string): Promise<JobAnalysis | null> {
  const snapshot = await getDocs(
    query(
      jobAnalysesCollection,
      where('userId', '==', uid),
      where('jobId', '==', jobId),
      orderBy('analyzedAt', 'desc'),
      limit(1),
    ),
  )
  if (snapshot.empty) {
    return null
  }
  return toAnalysis(snapshot.docs[0].id, snapshot.docs[0].data())
}

function toAnalysis(id: string, data: DocumentData): JobAnalysis {
  return {
    id,
    jobId: data.jobId,
    fitScore: data.fitScore,
    technicalFit: data.technicalFit ?? '',
    experienceFit: data.experienceFit ?? '',
    remoteFit: data.remoteFit ?? '',
    roleType: data.roleType ?? '',
    stackMatch: data.stackMatch ?? [],
    matchedSkills: data.matchedSkills ?? [],
    missingSkills: data.missingSkills ?? [],
    concerns: data.concerns ?? [],
    recommendation: data.recommendation ?? '',
    summary: data.summary ?? '',
    analyzedAt: toTimestamp(data.analyzedAt),
    aiProvider: data.aiProvider ?? '',
    model: data.model ?? '',
    matchedProjectIds: data.matchedProjectIds ?? [],
    projectMatchReasons: data.projectMatchReasons ?? {},
  }
}

function toTimestamp(value: unknown): Timestamp {
  return value as Timestamp
}
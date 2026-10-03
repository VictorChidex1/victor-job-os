import { initializeApp } from 'firebase-admin/app'
import { getFirestore, FieldValue, type DocumentReference } from 'firebase-admin/firestore'
import { getAIService } from '../ai/index.js'
import type { PortfolioMatchOutput } from '../ai/types.js'

initializeApp()
const db = getFirestore()

export interface JobDoc {
  title: string
  description: string
  location?: string
  remote?: boolean
  skills?: string[]
  companyName?: string
  status?: string
}

export interface ProfileDoc {
  headline: string
  summary: string
  skills: string[]
  technologies: string[]
  preferredRoles: string[]
  remotePreference: boolean
  experienceLevel?: string
}

export async function getJob(jobId: string): Promise<JobDoc | null> {
  const snapshot = await db.collection('jobs').doc(jobId).get()
  if (!snapshot.exists) return null
  return snapshot.data() as JobDoc
}

export async function getProfile(uid: string): Promise<ProfileDoc> {
  const snapshot = await db.collection('profiles').doc(uid).get()
  if (!snapshot.exists) {
    return {
      headline: '',
      summary: '',
      skills: [],
      technologies: [],
      preferredRoles: [],
      remotePreference: true,
      experienceLevel: undefined,
    }
  }
  const data = snapshot.data() as {
    headline?: string
    summary?: string
    skills?: Array<{ value: string }>
    technologies?: Array<{ value: string }>
    preferredRoles?: string[]
    remotePreference?: boolean
    experienceLevel?: string
  }
  return {
    headline: data.headline ?? '',
    summary: data.summary ?? '',
    skills: (data.skills ?? []).map((s) => s.value),
    technologies: (data.technologies ?? []).map((t) => t.value),
    preferredRoles: data.preferredRoles ?? [],
    remotePreference: data.remotePreference ?? true,
    experienceLevel: data.experienceLevel,
  }
}

export interface AnalysisRecord {
  jobId: string
  fitScore?: number
  technicalFit: string
  experienceFit: string
  stackMatch: string[]
  matchedSkills: string[]
  missingSkills: string[]
  concerns: string[]
  summary: string
  matchedProjectIds?: string[]
  projectMatchReasons?: Record<string, string>
  analyzedAt: unknown
  aiProvider: string
  model: string
}

export async function analyzeJobWithAI(
  jobId: string,
  job: JobDoc,
  profile: ProfileDoc,
): Promise<AnalysisRecord> {
  const ai = getAIService()

  const analysis = await ai.analyzeJob({
    job: {
      title: job.title,
      description: job.description,
      location: job.location,
      remote: job.remote ?? false,
      skills: job.skills ?? [],
    },
    profile,
  })

  const projectsSnapshot = await db
    .collection('projects')
    .where('isActive', '==', true)
    .limit(50)
    .get()
  const projects = projectsSnapshot.docs.map((doc) => {
    const data = doc.data()
    return {
      id: doc.id,
      title: data.title ?? '',
      summary: data.summary ?? '',
      technologies: data.technologies ?? [],
      relevanceTags: data.relevanceTags ?? [],
    }
  })

  let match: PortfolioMatchOutput = { projectIds: [], reasons: {} }
  if (projects.length > 0) {
    match = await ai.matchPortfolio({
      job: { title: job.title, description: job.description, skills: job.skills ?? [] },
      projects,
    })
  }

  return {
    jobId,
    fitScore: analysis.fitScore,
    technicalFit: analysis.technicalFit,
    experienceFit: analysis.experienceFit,
    stackMatch: analysis.stackMatch,
    matchedSkills: analysis.matchedSkills,
    missingSkills: analysis.missingSkills,
    concerns: analysis.concerns,
    summary: analysis.summary,
    matchedProjectIds: match.projectIds,
    projectMatchReasons: match.reasons,
    analyzedAt: FieldValue.serverTimestamp(),
    aiProvider: 'gemini',
    model: 'gemini-2.0-flash',
  }
}

export async function storeAnalysis(jobId: string, record: AnalysisRecord): Promise<void> {
  await db.collection('jobAnalyses').add(record)
  const qualified = (record.fitScore ?? 0) >= 60
  await db.collection('jobs').doc(jobId).update({
    status: qualified ? 'qualified' : 'rejected',
    updatedAt: FieldValue.serverTimestamp(),
  })
}

export async function analysisForJob(jobId: string): Promise<AnalysisRecord | null> {
  const snapshot = await db
    .collection('jobAnalyses')
    .where('jobId', '==', jobId)
    .orderBy('analyzedAt', 'desc')
    .limit(1)
    .get()
  if (snapshot.empty) return null
  const data = snapshot.docs[0].data() as Omit<AnalysisRecord, 'jobId'> & { jobId?: string }
  return { ...data, jobId: data.jobId ?? jobId }
}

export function jobRef(jobId: string): DocumentReference {
  return db.collection('jobs').doc(jobId)
}

export async function unanalyzedJobs(limitCount: number): Promise<Array<{ id: string; data: JobDoc }>> {
  const analyzed = new Set<string>()
  const analyses = await db.collection('jobAnalyses').get()
  for (const doc of analyses.docs) {
    const jobId = doc.data().jobId
    if (jobId) analyzed.add(jobId)
  }

  const snapshot = await db.collection('jobs').orderBy('createdAt', 'desc').limit(limitCount).get()
  const jobs: Array<{ id: string; data: JobDoc }> = []
  for (const doc of snapshot.docs) {
    if (!analyzed.has(doc.id)) {
      jobs.push({ id: doc.id, data: doc.data() as JobDoc })
    }
  }
  return jobs
}

export interface QualificationResult {
  jobId: string
  fitScore?: number
  status?: string
  error?: string
}

export async function qualifyPendingJobs(
  uid: string,
  limitCount: number,
): Promise<{ analyzed: number; results: QualificationResult[] }> {
  const profile = await getProfile(uid)
  const pending = await unanalyzedJobs(limitCount)
  let analyzed = 0
  const results: QualificationResult[] = []

  for (const job of pending) {
    try {
      const record = await analyzeJobWithAI(job.id, job.data, profile)
      await storeAnalysis(job.id, record)
      analyzed += 1
      results.push({
        jobId: job.id,
        fitScore: record.fitScore,
        status: (record.fitScore ?? 0) >= 60 ? 'qualified' : 'rejected',
      })
    } catch (error) {
      results.push({
        jobId: job.id,
        error: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }

  return { analyzed, results }
}
import { initializeApp } from 'firebase-admin/app'
import { getFirestore, FieldValue, type DocumentReference } from 'firebase-admin/firestore'
import { getAIService } from '../ai/index.js'
import type { PortfolioMatchOutput } from '../ai/types.js'
import { loadOpportunityFilters, jobMatchesFilters } from './filters.js'
import { mapWithConcurrency } from '../utils/concurrency.js'
import { recordAiRun, currentProvider } from '../utils/aiUsage.js'
import { logInfo, logWarn } from '../utils/logger.js'

initializeApp()
const db = getFirestore()

function providerName(): string {
  return (process.env.AI_PROVIDER ?? 'gemini').toLowerCase()
}

function providerModel(): string {
  if (providerName() === 'openai') {
    return process.env.OPENAI_MODEL ?? 'gpt-4o-mini'
  }
  return process.env.GEMINI_MODEL ?? 'gemini-3.5-flash'
}

export interface JobDoc {
  userId?: string
  companyId?: string
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
  userId: string
  jobId: string
  fitScore?: number
  technicalFit: string
  experienceFit: string
  remoteFit: string
  roleType: string
  stackMatch: string[]
  matchedSkills: string[]
  missingSkills: string[]
  concerns: string[]
  recommendation: string
  summary: string
  matchedProjectIds?: string[]
  projectMatchReasons?: Record<string, string>
  analyzedAt: unknown
  aiProvider: string
  model: string
}

export async function analyzeJobWithAI(
  uid: string,
  jobId: string,
  job: JobDoc,
  profile: ProfileDoc,
  threshold = 60,
): Promise<AnalysisRecord> {
  const ai = getAIService()
  const provider = currentProvider()

  const analyzeStartedAt = Date.now()
  let analysis
  try {
    analysis = await ai.analyzeJob({
      job: {
        title: job.title,
        description: job.description,
        location: job.location,
        remote: job.remote ?? false,
        skills: job.skills ?? [],
      },
      profile,
    })
    await recordAiRun({
      userId: uid,
      provider: provider.provider,
      model: provider.model,
      operation: 'analyzeJob',
      status: 'success',
      durationMs: Date.now() - analyzeStartedAt,
      jobId,
    })
  } catch (error) {
    await recordAiRun({
      userId: uid,
      provider: provider.provider,
      model: provider.model,
      operation: 'analyzeJob',
      status: 'error',
      durationMs: Date.now() - analyzeStartedAt,
      jobId,
      error: error instanceof Error ? error.message.slice(0, 500) : String(error),
    })
    throw error
  }

  const projectsSnapshot = await db
    .collection('projects')
    .where('userId', '==', uid)
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
      problem: data.problem ?? undefined,
      solution: data.solution ?? undefined,
      outcomes: data.outcomes ?? [],
      verifiedMetrics: data.verifiedMetrics ?? [],
      url: data.url ?? undefined,
    }
  })

  let match: PortfolioMatchOutput = { projectIds: [], reasons: {} }
  if (projects.length > 0 && (analysis.fitScore ?? 0) >= threshold) {
    const matchStartedAt = Date.now()
    try {
      match = await ai.matchPortfolio({
        job: { title: job.title, description: job.description, skills: job.skills ?? [] },
        projects,
      })
      await recordAiRun({
        userId: uid,
        provider: provider.provider,
        model: provider.model,
        operation: 'matchPortfolio',
        status: 'success',
        durationMs: Date.now() - matchStartedAt,
        jobId,
      })
    } catch (error) {
      await recordAiRun({
        userId: uid,
        provider: provider.provider,
        model: provider.model,
        operation: 'matchPortfolio',
        status: 'error',
        durationMs: Date.now() - matchStartedAt,
        jobId,
        error: error instanceof Error ? error.message.slice(0, 500) : String(error),
      })
      throw error
    }
  }

  return {
    userId: uid,
    jobId,
    fitScore: analysis.fitScore,
    technicalFit: analysis.technicalFit,
    experienceFit: analysis.experienceFit,
    remoteFit: analysis.remoteFit,
    roleType: analysis.roleType,
    stackMatch: analysis.stackMatch,
    matchedSkills: analysis.matchedSkills,
    missingSkills: analysis.missingSkills,
    concerns: analysis.concerns,
    recommendation: analysis.recommendation,
    summary: analysis.summary,
    matchedProjectIds: match.projectIds,
    projectMatchReasons: match.reasons,
    analyzedAt: FieldValue.serverTimestamp(),
    aiProvider: providerName(),
    model: providerModel(),
  }
}

export async function storeAnalysis(jobId: string, record: AnalysisRecord, threshold: number): Promise<void> {
  await db.collection('jobAnalyses').add(record)
  const qualified = (record.fitScore ?? 0) >= threshold
  await db.collection('jobs').doc(jobId).update({
    status: qualified ? 'qualified' : 'rejected',
    updatedAt: FieldValue.serverTimestamp(),
  })
}

export async function analysisForJob(uid: string, jobId: string): Promise<AnalysisRecord | null> {
  const snapshot = await db
    .collection('jobAnalyses')
    .where('userId', '==', uid)
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

export async function unanalyzedJobs(uid: string, limitCount: number): Promise<Array<{ id: string; data: JobDoc }>> {
  const analyzed = new Set<string>()
  const analyses = await db.collection('jobAnalyses').where('userId', '==', uid).get()
  for (const doc of analyses.docs) {
    const jobId = doc.data().jobId
    if (jobId) analyzed.add(jobId)
  }

  const snapshot = await db
    .collection('jobs')
    .where('userId', '==', uid)
    .orderBy('createdAt', 'desc')
    .limit(limitCount)
    .get()
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
  const filters = await loadOpportunityFilters(uid)
  const pending = (await unanalyzedJobs(uid, limitCount)).filter(
    (job) => jobMatchesFilters(job.data, filters).ok,
  )
  logInfo('qualification.batch.started', {
    userId: uid,
    requested: limitCount,
    pending: pending.length,
  })

  // Bounded concurrency keeps latency down without hammering the AI provider.
  const results = await mapWithConcurrency(pending, 3, async (job): Promise<QualificationResult> => {
    try {
      const record = await analyzeJobWithAI(uid, job.id, job.data, profile, filters.minFitScore)
      await storeAnalysis(job.id, record, filters.minFitScore)
      return {
        jobId: job.id,
        fitScore: record.fitScore,
        status: (record.fitScore ?? 0) >= filters.minFitScore ? 'qualified' : 'rejected',
      }
    } catch (error) {
      logWarn('qualification.job_failed', {
        userId: uid,
        jobId: job.id,
        error: error instanceof Error ? error.message : String(error),
      })
      return {
        jobId: job.id,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  })

  const analyzed = results.filter((result) => !result.error).length
  logInfo('qualification.batch.completed', {
    userId: uid,
    analyzed,
    failed: results.length - analyzed,
  })
  return { analyzed, results }
}
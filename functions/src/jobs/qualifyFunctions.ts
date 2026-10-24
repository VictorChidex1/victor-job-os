import { initializeApp } from 'firebase-admin/app'
import { getFirestore, FieldValue } from 'firebase-admin/firestore'
import { onCall, HttpsError } from 'firebase-functions/v2/https'
import { getAIService } from '../ai/index.js'
import { qualifyPendingJobs, analyzeJobWithAI, storeAnalysis, getJob, getProfile } from './qualification.js'
import { loadOpportunityFilters } from './filters.js'
import { toHttpsError } from '../utils/errors.js'

initializeApp()
const db = getFirestore()

interface AnalyzeJobRequest {
  jobId: string
}

export const analyzeJob = onCall(
  { memory: '256MiB', timeoutSeconds: 120, maxInstances: 2 },
  async (request) => {
    const data = request.data as AnalyzeJobRequest | undefined
    if (!data?.jobId) {
      throw new HttpsError('invalid-argument', 'jobId is required.')
    }
    const uid = request.auth?.uid
    if (!uid) {
      throw new HttpsError('unauthenticated', 'Sign in required.')
    }

    try {
      const job = await getJob(data.jobId)
      if (!job) {
        throw new HttpsError('not-found', 'Job not found.')
      }
      if (job.userId !== undefined && job.userId !== uid) {
        throw new HttpsError('permission-denied', 'This job does not belong to you.')
      }

      const profile = await getProfile(uid)
      const filters = await loadOpportunityFilters(uid)
      const record = await analyzeJobWithAI(uid, data.jobId, job, profile, filters.minFitScore)
      await storeAnalysis(data.jobId, record, filters.minFitScore)

      return {
        jobId: data.jobId,
        fitScore: record.fitScore,
        status: (record.fitScore ?? 0) >= filters.minFitScore ? 'qualified' : 'rejected',
      }
    } catch (error) {
      throw toHttpsError(error, 'Analysis failed. Please try again.')
    }
  },
)

export const researchOpportunity = onCall(
  { memory: '256MiB', timeoutSeconds: 60, maxInstances: 2 },
  async (request) => {
    const data = request.data as AnalyzeJobRequest | undefined
    if (!data?.jobId) {
      throw new HttpsError('invalid-argument', 'jobId is required.')
    }
    const uid = request.auth?.uid
    if (!uid) {
      throw new HttpsError('unauthenticated', 'Sign in required.')
    }

    try {
      const job = await getJob(data.jobId)
      if (!job) {
        throw new HttpsError('not-found', 'Job not found.')
      }
      if (job.userId !== undefined && job.userId !== uid) {
        throw new HttpsError('permission-denied', 'This job does not belong to you.')
      }

      const ai = getAIService()
      const research = await ai.researchCompany({ companyName: job.companyName ?? 'Unknown' })

      const existing = await db
        .collection('companies')
        .where('userId', '==', uid)
        .where('name', '==', job.companyName ?? '')
        .limit(1)
        .get()

      const companyDoc = {
        userId: uid,
        name: job.companyName ?? 'Unknown',
        industry: research.industry ?? null,
        description: research.description ?? null,
        website: research.website ?? null,
        product: research.product ?? null,
        roleContext: research.roleContext ?? null,
        hiringSignals: research.hiringSignals ?? [],
        researchSummary: research.researchSummary ?? null,
        sourceUrls: research.sourceUrls ?? [],
        lastResearchedAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      }

      let companyId: string
      if (existing.empty) {
        const ref = await db.collection('companies').add({
          ...companyDoc,
          createdAt: FieldValue.serverTimestamp(),
        })
        companyId = ref.id
      } else {
        companyId = existing.docs[0].id
        await existing.docs[0].ref.update(companyDoc)
      }

      await db.collection('jobs').doc(data.jobId).update({ companyId })

      return { companyId, companyName: companyDoc.name }
    } catch (error) {
      throw toHttpsError(error, 'Company research failed. Please try again.')
    }
  },
)

export const qualifyNewJobs = onCall(
  { memory: '256MiB', timeoutSeconds: 300, maxInstances: 1 },
  async (request) => {
    const uid = request.auth?.uid
    if (!uid) {
      throw new HttpsError('unauthenticated', 'Sign in required.')
    }
    const requested = Number((request.data as { limit?: number } | undefined)?.limit ?? 5)
    const limit = Math.min(Math.max(Number.isFinite(requested) ? requested : 5, 1), 25)
    return qualifyPendingJobs(uid, limit)
  },
)
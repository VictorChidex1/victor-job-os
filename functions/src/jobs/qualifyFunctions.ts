import { initializeApp } from 'firebase-admin/app'
import { getFirestore, FieldValue } from 'firebase-admin/firestore'
import { onCall, HttpsError } from 'firebase-functions/v2/https'
import { getAIService } from '../ai/index.js'
import { qualifyPendingJobs, analyzeJobWithAI, storeAnalysis, getJob, getProfile } from './qualification.js'

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

    const job = await getJob(data.jobId)
    if (!job) {
      throw new HttpsError('not-found', 'Job not found.')
    }

    const profile = await getProfile(uid)
    const record = await analyzeJobWithAI(data.jobId, job, profile)
    await storeAnalysis(data.jobId, record)

    return {
      jobId: data.jobId,
      fitScore: record.fitScore,
      status: (record.fitScore ?? 0) >= 60 ? 'qualified' : 'rejected',
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

    const job = await getJob(data.jobId)
    if (!job) {
      throw new HttpsError('not-found', 'Job not found.')
    }

    const ai = getAIService()
    const research = await ai.researchCompany({ companyName: job.companyName ?? 'Unknown' })

    const existing = await db
      .collection('companies')
      .where('name', '==', job.companyName ?? '')
      .limit(1)
      .get()

    const companyDoc = {
      name: job.companyName ?? 'Unknown',
      industry: research.industry ?? null,
      description: research.description ?? null,
      website: research.website ?? null,
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
  },
)

export const qualifyNewJobs = onCall(
  { memory: '256MiB', timeoutSeconds: 300, maxInstances: 1 },
  async (request) => {
    const uid = request.auth?.uid
    if (!uid) {
      throw new HttpsError('unauthenticated', 'Sign in required.')
    }
    return qualifyPendingJobs(uid, 10)
  },
)
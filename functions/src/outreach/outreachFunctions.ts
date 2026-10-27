import { initializeApp } from 'firebase-admin/app'
import { getFirestore, FieldValue, Timestamp } from 'firebase-admin/firestore'
import { onCall, HttpsError } from 'firebase-functions/v2/https'
import { onSchedule } from 'firebase-functions/v2/scheduler'
import { getAIService } from '../ai/index.js'
import { getJob, getProfile } from '../jobs/qualification.js'
import { toHttpsError } from '../utils/errors.js'
import { recordActivity } from '../utils/activity.js'
import { recordAiRun, currentProvider } from '../utils/aiUsage.js'
import { recordError } from '../utils/errorLog.js'
import { logInfo, logWarn, withTiming } from '../utils/logger.js'
import { ACTION_STATUS, isAllowedTransition, type OutreachAction } from './stateMachine.js'

initializeApp()
const db = getFirestore()

const PROMPT_VERSION = 'pitch-v1'

interface GeneratePitchRequest {
  jobId?: string
  contactId?: string
}

interface UpdateStatusRequest {
  outreachId?: string
  action?: OutreachAction
  scheduledAt?: string
}

async function createFollowUps(uid: string, outreachId: string): Promise<number> {
  const settingsSnapshot = await db.collection('settings').doc(uid).get()
  const outreachSettings = (settingsSnapshot.data()?.outreach ?? {}) as Record<string, unknown>
  const maxFollowUps = Math.max(0, Number(outreachSettings.maxFollowUps ?? 2))
  const intervalDays = Math.max(1, Number(outreachSettings.followUpIntervalDays ?? 5))
  if (maxFollowUps === 0) {
    return 0
  }

  const now = Date.now()
  const batch = db.batch()
  for (let sequence = 1; sequence <= maxFollowUps; sequence++) {
    batch.set(db.collection('followUps').doc(), {
      userId: uid,
      outreachId,
      sequence,
      status: 'pending',
      scheduledFor: Timestamp.fromMillis(now + sequence * intervalDays * 24 * 60 * 60 * 1000),
      createdAt: FieldValue.serverTimestamp(),
    })
  }
  await batch.commit()
  return maxFollowUps
}

async function cancelPendingFollowUps(uid: string, outreachId: string): Promise<void> {
  const snapshot = await db
    .collection('followUps')
    .where('userId', '==', uid)
    .where('outreachId', '==', outreachId)
    .where('status', '==', 'pending')
    .get()
  if (snapshot.empty) {
    return
  }
  const batch = db.batch()
  for (const document of snapshot.docs) {
    batch.update(document.ref, { status: 'cancelled' })
  }
  await batch.commit()
}

export const generatePitch = onCall(
  { memory: '512MiB', timeoutSeconds: 180, maxInstances: 2 },
  async (request) => {
    const uid = request.auth?.uid
    if (!uid) {
      throw new HttpsError('unauthenticated', 'Sign in required.')
    }
    const data = (request.data ?? {}) as GeneratePitchRequest
    if (!data.jobId) {
      throw new HttpsError('invalid-argument', 'jobId is required.')
    }

    try {
    const job = await getJob(data.jobId)
    if (!job) {
      throw new HttpsError('not-found', 'Job not found.')
    }
    if (job.userId !== undefined && job.userId !== uid) {
      throw new HttpsError('permission-denied', 'This job does not belong to you.')
    }

    // Prevent duplicate outreach for the same opportunity.
    const existing = await db
      .collection('outreach')
      .where('userId', '==', uid)
      .where('jobId', '==', data.jobId)
      .get()
    const active = existing.docs.find((document) => document.data().status !== 'closed')
    if (active) {
      return { outreachId: active.id, existing: true }
    }

    const profile = await getProfile(uid)

    const analysisSnapshot = await db
      .collection('jobAnalyses')
      .where('userId', '==', uid)
      .where('jobId', '==', data.jobId)
      .orderBy('analyzedAt', 'desc')
      .limit(1)
      .get()
    const analysis = analysisSnapshot.docs[0]?.data()

    let company: Record<string, unknown> | undefined
    let companyDocId: string | undefined
    if (job.companyName) {
      const companySnapshot = await db
        .collection('companies')
        .where('userId', '==', uid)
        .where('name', '==', job.companyName)
        .limit(1)
        .get()
      const companyDoc = companySnapshot.docs[0]
      company = companyDoc?.data()
      companyDocId = companyDoc?.id
    }

    let contact: Record<string, unknown> | undefined
    if (data.contactId) {
      const contactSnapshot = await db.collection('contacts').doc(data.contactId).get()
      if (contactSnapshot.exists && contactSnapshot.data()?.userId === uid) {
        contact = contactSnapshot.data()
      }
    }

    const projectsSnapshot = await db
      .collection('projects')
      .where('userId', '==', uid)
      .where('isActive', '==', true)
      .limit(20)
      .get()
    const projects = projectsSnapshot.docs.map((document) => {
      const project = document.data()
      return {
        title: (project.title as string) ?? '',
        summary: (project.summary as string) ?? '',
        technologies: (project.technologies as string[]) ?? [],
        outcomes: (project.outcomes as string[]) ?? [],
        verifiedMetrics: (project.verifiedMetrics as string[]) ?? [],
        url: project.url as string | undefined,
      }
    })

    const ai = getAIService()
    const provider = currentProvider()
    const aiStartedAt = Date.now()
    let pitch
    try {
      pitch = await ai.generatePitch({
        job: {
          title: job.title,
          description: job.description,
          location: job.location,
        },
        analysis: analysis
          ? {
              fitScore: analysis.fitScore,
              roleType: analysis.roleType,
              matchedSkills: analysis.matchedSkills ?? [],
              missingSkills: analysis.missingSkills ?? [],
              summary: analysis.summary,
            }
          : undefined,
        company: company
          ? {
              name: (company.name as string) ?? job.companyName ?? '',
              industry: company.industry as string | undefined,
              description: company.description as string | undefined,
              product: company.product as string | undefined,
              roleContext: company.roleContext as string | undefined,
              hiringSignals: (company.hiringSignals as string[]) ?? [],
              researchSummary: company.researchSummary as string | undefined,
            }
          : undefined,
        contact: contact
          ? { name: contact.name as string | undefined, role: contact.role as string | undefined }
          : undefined,
        profile: {
          headline: profile.headline,
          summary: profile.summary,
          skills: profile.skills,
          technologies: profile.technologies,
          preferredRoles: profile.preferredRoles,
          experienceLevel: profile.experienceLevel,
        },
        projects,
      })
      await recordAiRun({
        userId: uid,
        provider: provider.provider,
        model: provider.model,
        operation: 'generatePitch',
        status: 'success',
        durationMs: Date.now() - aiStartedAt,
        jobId: data.jobId,
      })
    } catch (aiError) {
      await recordAiRun({
        userId: uid,
        provider: provider.provider,
        model: provider.model,
        operation: 'generatePitch',
        status: 'error',
        durationMs: Date.now() - aiStartedAt,
        jobId: data.jobId,
        error: aiError instanceof Error ? aiError.message.slice(0, 500) : String(aiError),
      })
      throw aiError
    }

    if (!pitch.subject || !pitch.body) {
      throw new HttpsError('internal', 'The AI returned an empty draft. Please try again.')
    }
    if (!/^Dear\s/i.test(pitch.body.trim())) {
      throw new HttpsError('internal', 'The AI draft did not follow the required format. Please try again.')
    }

    const ref = await db.collection('outreach').add({
      userId: uid,
      jobId: data.jobId,
      companyId: job.companyId ?? companyDocId ?? '',
      contactId: data.contactId ?? null,
      contactName: (contact?.name as string) ?? null,
      contactEmail: (contact?.email as string) ?? null,
      jobTitle: job.title,
      companyName: job.companyName ?? '',
      subject: pitch.subject,
      body: pitch.body,
      draftSubject: pitch.subject,
      draftBody: pitch.body,
      status: 'needs-review',
      aiProvider: provider.provider,
      model: provider.model,
      promptVersion: PROMPT_VERSION,
      followUpCount: 0,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    })

    await recordActivity(uid, 'outreach', 'completed', 'Outreach draft generated.', {
      outreachId: ref.id,
      jobId: data.jobId,
    })

    return { outreachId: ref.id, existing: false }
    } catch (error) {
      await recordError('generatePitch', error, { userId: uid, jobId: data.jobId })
      throw toHttpsError(error, 'Outreach drafting failed. Please try again.')
    }
  },
)

export const updateOutreachStatus = onCall(
  { memory: '256MiB', timeoutSeconds: 60, maxInstances: 2 },
  async (request) => {
    const uid = request.auth?.uid
    if (!uid) {
      throw new HttpsError('unauthenticated', 'Sign in required.')
    }
    const data = (request.data ?? {}) as UpdateStatusRequest
    if (!data.outreachId || !data.action) {
      throw new HttpsError('invalid-argument', 'outreachId and action are required.')
    }
    const target = ACTION_STATUS[data.action]
    if (!target) {
      throw new HttpsError('invalid-argument', `Unknown action "${data.action}".`)
    }

    try {
      const ref = db.collection('outreach').doc(data.outreachId)
      const snapshot = await ref.get()
      if (!snapshot.exists) {
        throw new HttpsError('not-found', 'Outreach not found.')
      }
      const outreach = snapshot.data() as Record<string, unknown>
      if (outreach.userId !== uid) {
        throw new HttpsError('permission-denied', 'This outreach does not belong to you.')
      }

      const current = (outreach.status as string) ?? 'draft'
      if (!isAllowedTransition(current, target)) {
        throw new HttpsError(
          'failed-precondition',
          `Cannot ${data.action} an outreach in "${current}" state.`,
        )
      }

      const update: Record<string, unknown> = {
        status: target,
        updatedAt: FieldValue.serverTimestamp(),
      }
      if (data.action === 'approve') update.approvedAt = FieldValue.serverTimestamp()
      if (data.action === 'schedule') {
        const when = data.scheduledAt ? new Date(data.scheduledAt) : null
        if (!when || Number.isNaN(when.getTime())) {
          throw new HttpsError('invalid-argument', 'A valid scheduledAt is required.')
        }
        update.scheduledAt = Timestamp.fromDate(when)
      }
      if (data.action === 'mark-sent') {
        update.sentAt = FieldValue.serverTimestamp()
        update.sentManually = true
      }
      if (data.action === 'record-reply') update.replyAt = FieldValue.serverTimestamp()
      if (data.action === 'reject' || data.action === 'archive' || data.action === 'close') {
        update.closedAt = FieldValue.serverTimestamp()
        update.closedReason =
          data.action === 'reject' ? 'rejected' : data.action === 'archive' ? 'archived' : 'completed'
      }

      await ref.update(update)
      logInfo('outreach.status.updated', {
        userId: uid,
        outreachId: data.outreachId,
        action: data.action,
        from: current,
        to: target,
      })

      if (data.action === 'mark-sent') {
        const count = await createFollowUps(uid, data.outreachId)
        await ref.update({ followUpCount: count })
        await recordActivity(uid, 'outreach', 'completed', 'Outreach marked as sent.', {
          outreachId: data.outreachId,
          followUps: count,
        })
      }
      if (
        data.action === 'record-reply' ||
        data.action === 'reject' ||
        data.action === 'archive' ||
        data.action === 'close'
      ) {
        await cancelPendingFollowUps(uid, data.outreachId)
        await recordActivity(uid, 'outreach', 'completed', `Outreach ${data.action}.`, {
          outreachId: data.outreachId,
        })
      }

      return { status: target }
    } catch (error) {
      await recordError('updateOutreachStatus', error, {
        userId: uid,
        outreachId: data.outreachId,
        action: data.action,
      })
      throw toHttpsError(error, 'Unable to update outreach. Please try again.')
    }
  },
)

async function flagDueFollowUps(uid?: string): Promise<number> {
  const now = Timestamp.now()
  let query = db.collection('followUps').where('status', '==', 'pending').where('scheduledFor', '<=', now)
  if (uid) {
    query = query.where('userId', '==', uid) as typeof query
  }
  const due = await query.get()
  let flagged = 0
  for (const document of due.docs) {
    const followUp = document.data()
    const outreachSnapshot = await db.collection('outreach').doc(followUp.outreachId as string).get()
    if (!outreachSnapshot.exists) {
      await document.ref.update({ status: 'cancelled' })
      logWarn('followUps.outreach_missing', {
        followUpId: document.id,
        outreachId: followUp.outreachId,
      })
      continue
    }
    const outreach = outreachSnapshot.data() as Record<string, unknown>
    if (outreach.status === 'replied' || outreach.status === 'closed') {
      await document.ref.update({ status: 'cancelled' })
      logInfo('followUps.cancelled', {
        followUpId: document.id,
        outreachId: followUp.outreachId,
        outreachStatus: outreach.status,
      })
      continue
    }
    if (outreach.status === 'sent') {
      await outreachSnapshot.ref.update({
        status: 'follow-up-due',
        updatedAt: FieldValue.serverTimestamp(),
      })
      flagged += 1
    }
  }
  logInfo('followUps.flagged', { scope: uid ?? 'all', flagged })
  return flagged
}

export const processFollowUps = onSchedule(
  {
    schedule: '0 9 * * *',
    timeZone: 'UTC',
    memory: '256MiB',
    timeoutSeconds: 120,
    maxInstances: 1,
  },
  async () => {
    try {
      await withTiming('processFollowUps', {}, () => flagDueFollowUps())
    } catch (error) {
      await recordError('processFollowUps', error, {})
    }
  },
)

export const runFollowUpsNow = onCall(
  { memory: '256MiB', timeoutSeconds: 60, maxInstances: 1 },
  async (request) => {
    const uid = request.auth?.uid
    if (!uid) {
      throw new HttpsError('unauthenticated', 'Sign in required.')
    }
    try {
      const flagged = await withTiming('runFollowUpsNow', { userId: uid }, () =>
        flagDueFollowUps(uid),
      )
      return { flagged }
    } catch (error) {
      await recordError('runFollowUpsNow', error, { userId: uid })
      throw toHttpsError(error, 'Unable to check follow-ups. Please try again.')
    }
  },
)

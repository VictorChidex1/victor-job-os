import { initializeApp } from 'firebase-admin/app'
import { FieldValue, Timestamp, getFirestore } from 'firebase-admin/firestore'
import { HttpsError, onCall } from 'firebase-functions/v2/https'
import { recordError } from '../utils/errorLog.js'
import { logInfo } from '../utils/logger.js'
import { isAllowedHost, validateAutomationUrl } from './domainPolicy.js'
import { getAutomationProvider, selectedAutomationProviderId } from './providerRegistry.js'
import type {
  AutomationSessionHandle,
  AutomationStep,
  AutomationStepName,
} from './types.js'

initializeApp()
const db = getFirestore()

const SESSION_TTL_MS = 10 * 60 * 1000
const ALLOWED_APPLICATION_STATUSES = new Set([
  'not-started',
  'preparing',
  'needs-review',
  'approved',
])

interface StartInspectionRequest {
  applicationId?: string
}

interface CancelRunRequest {
  runId?: string
}

function validId(value: unknown): string {
  if (typeof value !== 'string' || !value.trim()) {
    throw new HttpsError('invalid-argument', 'A valid id is required.')
  }
  return value.trim()
}

function initialSteps(): AutomationStep[] {
  return [
    { name: 'validate', status: 'pending' },
    { name: 'open-session', status: 'pending' },
    { name: 'inspect', status: 'pending' },
    { name: 'close-session', status: 'pending' },
  ]
}

async function setStep(
  runRef: FirebaseFirestore.DocumentReference,
  steps: AutomationStep[],
  name: AutomationStepName,
  status: AutomationStep['status'],
  detail?: string,
): Promise<void> {
  const now = new Date().toISOString()
  const next = steps.map((step) => {
    if (step.name !== name) return step
    return {
      ...step,
      status,
      ...(status === 'running' ? { startedAt: now } : {}),
      ...(status === 'completed' || status === 'failed'
        ? { endedAt: now }
        : {}),
      ...(detail ? { detail } : {}),
    }
  })
  steps.splice(0, steps.length, ...next)
  await runRef.update({ steps: next, currentStep: name, updatedAt: FieldValue.serverTimestamp() })
}

export const startAutomationInspection = onCall(
  { memory: '1GiB', timeoutSeconds: 120, maxInstances: 2 },
  async (request) => {
    const userId = request.auth?.uid
    if (!userId) {
      throw new HttpsError('unauthenticated', 'Sign in required.')
    }
    const data = (request.data ?? {}) as StartInspectionRequest
    const applicationId = validId(data.applicationId)
    const provider = getAutomationProvider()
    const providerId = selectedAutomationProviderId()

    const applicationRef = db.collection('applications').doc(applicationId)
    const applicationSnapshot = await applicationRef.get()
    if (!applicationSnapshot.exists) {
      throw new HttpsError('not-found', 'Application not found.')
    }
    const application = applicationSnapshot.data() ?? {}
    if (application.userId !== userId) {
      throw new HttpsError('permission-denied', 'This application does not belong to you.')
    }
    if (!ALLOWED_APPLICATION_STATUSES.has(String(application.status ?? 'not-started'))) {
      throw new HttpsError(
        'failed-precondition',
        'This application is no longer eligible for form inspection.',
      )
    }

    const applicationUrl = String(application.applicationUrl ?? '')
    const urlDecision = validateAutomationUrl(applicationUrl)
    if (!urlDecision.ok || !urlDecision.host || !urlDecision.url) {
      throw new HttpsError(
        'failed-precondition',
        urlDecision.reason ?? 'This application has no safe automation URL.',
      )
    }
    if (!isAllowedHost(urlDecision.host, [urlDecision.host])) {
      throw new HttpsError('permission-denied', 'Application domain is not allowed.')
    }

    const sessionRef = db.collection('automationSessions').doc()
    const runRef = db.collection('automationRuns').doc()
    const now = Timestamp.now()
    const expiresAt = Timestamp.fromMillis(now.toMillis() + SESSION_TTL_MS)
    const allowedDomains = [urlDecision.host]
    const steps = initialSteps()

    await Promise.all([
      sessionRef.set({
        userId,
        applicationId,
        provider: providerId,
        status: 'active',
        allowedDomains,
        startedAt: FieldValue.serverTimestamp(),
        expiresAt,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      }),
      runRef.set({
        userId,
        applicationId,
        applicationTitle: String(application.jobTitle ?? ''),
        companyName: String(application.companyName ?? ''),
        sessionId: sessionRef.id,
        provider: providerId,
        status: 'queued',
        currentStep: 'validate',
        steps,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      }),
    ])

    let handle: AutomationSessionHandle | null = null
    try {
      await setStep(runRef, steps, 'validate', 'completed')
      await runRef.update({
        status: 'running',
        startedAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      })
      await setStep(runRef, steps, 'open-session', 'running')
      handle = await provider.createSession({
        userId,
        applicationId,
        applicationUrl: urlDecision.url,
        allowedDomains,
      })
      await setStep(runRef, steps, 'open-session', 'completed')

      await setStep(runRef, steps, 'inspect', 'running')
      const inspection = await provider.inspectApplication(handle, {
        userId,
        applicationId,
        applicationUrl: urlDecision.url,
        allowedDomains,
      })
      await setStep(runRef, steps, 'inspect', 'completed')

      await setStep(runRef, steps, 'close-session', 'running')
      await provider.closeSession(handle)
      handle = null
      await setStep(runRef, steps, 'close-session', 'completed')

      const finalStatus = inspection.manualActionReason
        ? 'awaiting-manual-action'
        : 'completed'
      await Promise.all([
        runRef.update({
          status: finalStatus,
          inspection,
          manualActionReason: inspection.manualActionReason ?? null,
          endedAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        }),
        sessionRef.update({
          status: 'ended',
          endedAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        }),
      ])

      logInfo('automation.inspection.completed', {
        userId,
        runId: runRef.id,
        applicationId,
        provider: providerId,
        status: finalStatus,
      })
      return { runId: runRef.id, sessionId: sessionRef.id, status: finalStatus }
    } catch (error) {
      if (handle) {
        await provider.closeSession(handle).catch(() => undefined)
      }
      await Promise.all([
        runRef.update({
          status: 'failed',
          error: error instanceof Error ? error.message.slice(0, 1000) : String(error),
          endedAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        }),
        sessionRef.update({
          status: 'failed',
          failureReason:
            error instanceof Error ? error.message.slice(0, 500) : String(error),
          endedAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        }),
      ])
      await recordError('startAutomationInspection', error, {
        userId,
        applicationId,
        runId: runRef.id,
      })
      throw new HttpsError('internal', 'Automation inspection failed.')
    }
  },
)

export const cancelAutomationRun = onCall(
  { memory: '256MiB', timeoutSeconds: 30, maxInstances: 2 },
  async (request) => {
    const userId = request.auth?.uid
    if (!userId) {
      throw new HttpsError('unauthenticated', 'Sign in required.')
    }
    const runId = validId((request.data as CancelRunRequest | undefined)?.runId)
    const runRef = db.collection('automationRuns').doc(runId)
    const snapshot = await runRef.get()
    if (!snapshot.exists) {
      throw new HttpsError('not-found', 'Automation run not found.')
    }
    const run = snapshot.data() ?? {}
    if (run.userId !== userId) {
      throw new HttpsError('permission-denied', 'This automation run does not belong to you.')
    }
    if (!['queued', 'running', 'awaiting-manual-action'].includes(String(run.status))) {
      return { runId, status: run.status }
    }

    await runRef.update({
      status: 'cancelled',
      endedAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    })
    if (typeof run.sessionId === 'string' && run.sessionId) {
      await db.collection('automationSessions').doc(run.sessionId).update({
        status: 'ended',
        endedAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      })
    }
    return { runId, status: 'cancelled' }
  },
)

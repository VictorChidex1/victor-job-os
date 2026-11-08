import { initializeApp } from 'firebase-admin/app'
import { FieldValue, Timestamp, getFirestore } from 'firebase-admin/firestore'
import { HttpsError, onCall } from 'firebase-functions/v2/https'
import { recordError } from '../utils/errorLog.js'
import { logInfo } from '../utils/logger.js'
import { isAllowedHost, validateAutomationUrl } from './domainPolicy.js'
import { buildFieldProposals, validateApprovedFields } from './fieldProposals.js'
import { getAutomationProvider, selectedAutomationProviderId } from './providerRegistry.js'
import { stripUndefined } from './serialize.js'
import type {
  AutomationFieldDescriptor,
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

interface PopulateFieldsRequest {
  runId?: string
  approvedFields?: unknown
}

function validId(value: unknown): string {
  if (typeof value !== 'string' || !value.trim()) {
    throw new HttpsError('invalid-argument', 'A valid id is required.')
  }
  return value.trim()
}

function readString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function readStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value
        .filter((item): item is string => typeof item === 'string')
        .map((item) => item.trim())
        .filter(Boolean)
    : []
}

function verifiedStrings(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value.flatMap((entry) => {
    if (!entry || typeof entry !== 'object') return []
    const record = entry as Record<string, unknown>
    if (record.status !== 'verified') return []
    const item = readString(record.value)
    return item ? [item] : []
  })
}

function preparationDocId(uid: string, applicationId: string): string {
  return `${uid.replace(/\//g, '_')}__prep__${applicationId.replace(/\//g, '_')}`
}

function parseAutomationFields(value: unknown): AutomationFieldDescriptor[] {
  if (!Array.isArray(value)) return []
  return value.flatMap((entry, index) => {
    if (!entry || typeof entry !== 'object') return []
    const record = entry as Record<string, unknown>
    const name = readString(record.name)
    if (!name) return []
    const key = readString(record.key) || `legacy-field-${index}`
    return [
      {
        key,
        name,
        ...(typeof record.type === 'string'
          ? { type: record.type as AutomationFieldDescriptor['type'] }
          : {}),
        ...(typeof record.inputType === 'string'
          ? { inputType: record.inputType }
          : {}),
        ...(typeof record.tagName === 'string'
          ? { tagName: record.tagName }
          : {}),
        ...(typeof record.id === 'string' ? { id: record.id } : {}),
        ...(typeof record.htmlName === 'string'
          ? { htmlName: record.htmlName }
          : {}),
        ...(typeof record.placeholder === 'string'
          ? { placeholder: record.placeholder }
          : {}),
        ...(typeof record.ariaLabel === 'string'
          ? { ariaLabel: record.ariaLabel }
          : {}),
        ...(record.required === true ? { required: true } : {}),
        ...(Array.isArray(record.options)
          ? {
              options: record.options.filter(
                (option): option is string => typeof option === 'string',
              ),
            }
          : {}),
      },
    ]
  })
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
    const authEmail =
      typeof request.auth?.token?.email === 'string'
        ? request.auth.token.email.trim()
        : ''
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

      const [profileSnapshot, preparationSnapshot] = await Promise.all([
        db.collection('profiles').doc(userId).get().catch(() => null),
        db
          .collection('applicationPreparations')
          .doc(preparationDocId(userId, applicationId))
          .get()
          .catch(() => null),
      ])
      const profileData = profileSnapshot?.data() ?? {}
      const preparationData = preparationSnapshot?.data() ?? {}
      const fieldProposals = buildFieldProposals({
        fields: inspection.fields,
        profile: {
          fullName: readString(profileData.fullName) || undefined,
          headline: readString(profileData.headline) || undefined,
          summary: readString(profileData.summary) || undefined,
          skills: verifiedStrings(profileData.skills),
          technologies: verifiedStrings(profileData.technologies),
          preferredRoles: readStringArray(profileData.preferredRoles),
          preferredLocations: readStringArray(profileData.preferredLocations),
          experienceLevel: readString(profileData.experienceLevel) || undefined,
          resumeUrl: readString(profileData.resumeUrl) || undefined,
          portfolioUrl: readString(profileData.portfolioUrl) || undefined,
          email: readString(profileData.email) || authEmail || undefined,
          remotePreference:
            typeof profileData.remotePreference === 'boolean'
              ? profileData.remotePreference
              : undefined,
        },
        application: {
          jobTitle: readString(application.jobTitle) || undefined,
          companyName: readString(application.companyName) || undefined,
          location: readString(application.location) || undefined,
          remote:
            typeof application.remote === 'boolean'
              ? application.remote
              : undefined,
          applicationUrl: readString(application.applicationUrl) || undefined,
          resumeUrl: readString(application.resumeUrl) || undefined,
        },
        preparation: {
          coverLetter:
            preparationData.coverLetter &&
            typeof preparationData.coverLetter === 'object'
              ? {
                  body: readString(
                    (preparationData.coverLetter as Record<string, unknown>).body,
                  ),
                  status: readString(
                    (preparationData.coverLetter as Record<string, unknown>).status,
                  ),
                }
              : undefined,
          answers: Array.isArray(preparationData.answers)
            ? preparationData.answers.flatMap((answer) => {
                if (!answer || typeof answer !== 'object') return []
                const record = answer as Record<string, unknown>
                return [
                  {
                    question: readString(record.question),
                    answer: readString(record.answer),
                    status: readString(record.status),
                  },
                ]
              })
            : [],
          resumeUrl: readString(preparationData.resumeUrl) || undefined,
          resumeVariantName:
            readString(preparationData.resumeVariantName) || undefined,
          resumeReviewed: preparationData.resumeReviewed === true,
        },
      })

      const finalStatus = inspection.manualActionReason
        ? 'awaiting-manual-action'
        : 'completed'
      await Promise.all([
        runRef.update({
          status: finalStatus,
          inspection: stripUndefined(inspection),
          fieldProposals: stripUndefined(fieldProposals),
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

export const populateAutomationFields = onCall(
  { memory: '1GiB', timeoutSeconds: 180, maxInstances: 2 },
  async (request) => {
    const userId = request.auth?.uid
    if (!userId) {
      throw new HttpsError('unauthenticated', 'Sign in required.')
    }
    const data = (request.data ?? {}) as PopulateFieldsRequest
    const runId = validId(data.runId)
    const provider = getAutomationProvider()
    const providerId = selectedAutomationProviderId()

    if (!provider.capabilities.has('fill')) {
      throw new HttpsError(
        'failed-precondition',
        'The selected automation provider cannot populate fields.',
      )
    }

    const runRef = db.collection('automationRuns').doc(runId)
    const runSnapshot = await runRef.get()
    if (!runSnapshot.exists) {
      throw new HttpsError('not-found', 'Automation run not found.')
    }
    const run = runSnapshot.data() ?? {}
    if (run.userId !== userId) {
      throw new HttpsError('permission-denied', 'This automation run does not belong to you.')
    }
    if (String(run.status) !== 'completed') {
      throw new HttpsError(
        'failed-precondition',
        'Approved fields can only be populated after a successful inspection.',
      )
    }

    const inspection =
      run.inspection && typeof run.inspection === 'object'
        ? (run.inspection as Record<string, unknown>)
        : {}
    const fields = parseAutomationFields(inspection.fields)
    if (fields.length === 0) {
      throw new HttpsError(
        'failed-precondition',
        'This run has no discovered application fields.',
      )
    }
    if (inspection.manualActionReason) {
      throw new HttpsError(
        'failed-precondition',
        'This run requires manual handling and cannot populate fields.',
      )
    }

    const validation = validateApprovedFields(fields, data.approvedFields)
    if (!validation.ok) {
      throw new HttpsError('invalid-argument', validation.error)
    }

    const applicationId = readString(run.applicationId)
    if (!applicationId) {
      throw new HttpsError('failed-precondition', 'This run has no application.')
    }

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
        'This application is no longer eligible for field population.',
      )
    }

    const applicationUrl = readString(application.applicationUrl)
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

    const allowedDomains = [urlDecision.host]
    const existingSteps: AutomationStep[] = Array.isArray(run.steps)
      ? (run.steps as AutomationStep[])
      : initialSteps()
    const steps: AutomationStep[] = [
      ...existingSteps,
      { name: 'populate', status: 'pending' },
    ]
    const sessionRef = db.collection('automationSessions').doc()
    const now = Timestamp.now()
    const expiresAt = Timestamp.fromMillis(now.toMillis() + SESSION_TTL_MS)

    // Atomically claim the completed run so two clicks cannot populate twice.
    await db.runTransaction(async (transaction) => {
      const currentSnapshot = await transaction.get(runRef)
      if (!currentSnapshot.exists) {
        throw new HttpsError('not-found', 'Automation run not found.')
      }
      const current = currentSnapshot.data() ?? {}
      if (current.userId !== userId) {
        throw new HttpsError('permission-denied', 'This automation run does not belong to you.')
      }
      if (String(current.status) !== 'completed') {
        throw new HttpsError(
          'failed-precondition',
          'This automation run is no longer eligible for field population.',
        )
      }
      transaction.update(runRef, {
        status: 'running',
        currentStep: 'populate',
        steps,
        sessionId: sessionRef.id,
        updatedAt: FieldValue.serverTimestamp(),
      })
    })

    let handle: AutomationSessionHandle | null = null
    try {
      await sessionRef.set({
        userId,
        applicationId,
        provider: providerId,
        status: 'active',
        allowedDomains,
        startedAt: FieldValue.serverTimestamp(),
        expiresAt,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      })
      await setStep(runRef, steps, 'populate', 'running')
      handle = await provider.createSession({
        userId,
        applicationId,
        applicationUrl: urlDecision.url,
        allowedDomains,
      })
      const results = await provider.populateApprovedFields(
        handle,
        {
          userId,
          applicationId,
          applicationUrl: urlDecision.url,
          allowedDomains,
        },
        validation.values,
        fields,
      )
      await provider.closeSession(handle)
      handle = null
      await setStep(runRef, steps, 'populate', 'completed')

      const filledCount = results.filter((result) => result.status === 'filled').length
      const followUpCount = results.length - filledCount
      const manualActionReason =
        followUpCount > 0
          ? `Populated ${filledCount} approved field(s). ${followUpCount} field(s) need manual follow-up. Submission is not enabled.`
          : `Populated ${filledCount} approved field(s). Submission is not enabled.`
      const endedAt = new Date().toISOString()

      await Promise.all([
        runRef.update({
          status: 'awaiting-manual-action',
          population: stripUndefined({
            approvedFields: validation.values,
            results,
            startedAt: now.toDate().toISOString(),
            endedAt,
          }),
          manualActionReason,
          endedAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        }),
        sessionRef.update({
          status: 'ended',
          endedAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        }),
      ])

      logInfo('automation.population.completed', {
        userId,
        runId,
        applicationId,
        provider: providerId,
        filledCount,
        followUpCount,
      })
      return {
        runId,
        status: 'awaiting-manual-action',
        results,
      }
    } catch (error) {
      if (handle) {
        await provider.closeSession(handle).catch(() => undefined)
      }
      await Promise.all([
        setStep(runRef, steps, 'populate', 'failed', 'Field population failed.'),
        runRef.update({
          status: 'failed',
          error: error instanceof Error ? error.message.slice(0, 1000) : String(error),
          endedAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        }),
        sessionRef.set(
          {
            userId,
            applicationId,
            provider: providerId,
            status: 'failed',
            failureReason:
              error instanceof Error ? error.message.slice(0, 500) : String(error),
            endedAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp(),
          },
          { merge: true },
        ),
      ])
      await recordError('populateAutomationFields', error, {
        userId,
        applicationId,
        runId,
      })
      throw new HttpsError('internal', 'Automation field population failed.')
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

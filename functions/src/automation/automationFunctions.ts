import { initializeApp } from 'firebase-admin/app'
import { FieldValue, Timestamp, getFirestore } from 'firebase-admin/firestore'
import { HttpsError, onCall } from 'firebase-functions/v2/https'
import { recordError } from '../utils/errorLog.js'
import { assertAutomationBudgetAvailable } from '../utils/budgetControl.js'
import { logInfo } from '../utils/logger.js'
import { saveAutomationScreenshot } from './artifacts.js'
import { isAllowedHost, validateAutomationUrl } from './domainPolicy.js'
import { buildFieldProposals, validateApprovedFields } from './fieldProposals.js'
import { RunLogCollector } from './logCollector.js'
import { getAutomationProvider, selectedAutomationProviderId } from './providerRegistry.js'
import { downloadApprovedResume } from './resume.js'
import { stripUndefined } from './serialize.js'
import { validateSubmissionAuthorization } from './submission.js'
import { validateVerificationChecklist } from './verification.js'
import type {
  ApprovedFieldValue,
  AutomationArtifactKind,
  AutomationFieldDescriptor,
  AutomationFieldProposal,
  AutomationSessionHandle,
  AutomationStep,
  AutomationStepName,
  AutomationSubmission,
  AutomationVerification,
  BrowserAutomationProvider,
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

interface VerifyAutomationRunRequest {
  runId?: string
  checklist?: unknown
  notes?: unknown
}

interface SubmitAutomationApplicationRequest {
  runId?: string
  authorize?: unknown
  confirmation?: unknown
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

function timestampToIso(value: unknown): string | undefined {
  if (
    value &&
    typeof value === 'object' &&
    'toDate' in value &&
    typeof (value as { toDate?: unknown }).toDate === 'function'
  ) {
    return (value as Timestamp).toDate().toISOString()
  }
  return undefined
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

async function flushRunLogs(
  logger: RunLogCollector,
  context: { userId: string; applicationId: string; runId: string },
): Promise<void> {
  try {
    await logger.flush()
  } catch (error) {
    await recordError('automationLogs.flush', error, context).catch(() => undefined)
  }
}

async function captureFailureArtifact({
  provider,
  handle,
  userId,
  applicationId,
  runId,
  sessionId,
  kind,
  label,
  logger,
}: {
  provider: BrowserAutomationProvider
  handle: AutomationSessionHandle | null
  userId: string
  applicationId: string
  runId: string
  sessionId?: string
  kind: AutomationArtifactKind
  label: string
  logger: RunLogCollector
}): Promise<void> {
  if (!handle || !provider.capabilities.has('screenshot')) return

  try {
    const screenshot = await provider.captureScreenshot(handle)
    if (!screenshot) return
    const artifact = await saveAutomationScreenshot({
      db,
      screenshot,
      userId,
      applicationId,
      runId,
      sessionId,
      kind,
      label,
    })
    logger.info(
      'artifact',
      `Screenshot captured: ${label}`,
      `${Math.round(artifact.size / 1024)} KB WebP`,
    )
  } catch (error) {
    logger.warn(
      'artifact',
      `Screenshot capture failed: ${label}`,
      error instanceof Error ? error.message.slice(0, 1000) : String(error),
    )
  }
}

export const startAutomationInspection = onCall(
  { memory: '1GiB', timeoutSeconds: 120, maxInstances: 2 },
  async (request) => {
    const userId = request.auth?.uid
    if (!userId) {
      throw new HttpsError('unauthenticated', 'Sign in required.')
    }
    await assertAutomationBudgetAvailable()
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

    const logger = new RunLogCollector(db, {
      userId,
      applicationId,
      runId: runRef.id,
      sessionId: sessionRef.id,
      provider: providerId,
    })
    logger.info('run', 'Inspection run created')
    logger.info('validate', 'Application and URL validated', `Host: ${urlDecision.host}`)

    let handle: AutomationSessionHandle | null = null
    try {
      await setStep(runRef, steps, 'validate', 'completed')
      await runRef.update({
        status: 'running',
        startedAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      })
      await setStep(runRef, steps, 'open-session', 'running')
      logger.info('open-session', 'Opening browser session', providerId)
      handle = await provider.createSession({
        userId,
        applicationId,
        applicationUrl: urlDecision.url,
        allowedDomains,
      })
      logger.info('open-session', 'Browser session opened')
      await setStep(runRef, steps, 'open-session', 'completed')

      await setStep(runRef, steps, 'inspect', 'running')
      logger.info('inspect', 'Inspecting application form')
      const inspection = await provider.inspectApplication(handle, {
        userId,
        applicationId,
        applicationUrl: urlDecision.url,
        allowedDomains,
      })
      logger.info(
        'inspect',
        'Inspection completed',
        `${inspection.fields.length} fields and ${inspection.questions.length} questions discovered`,
      )
      if (inspection.manualActionReason) {
        logger.warn('inspect', 'Manual action required', inspection.manualActionReason)
        await captureFailureArtifact({
          provider,
          handle,
          userId,
          applicationId,
          runId: runRef.id,
          sessionId: sessionRef.id,
          kind: 'screenshot',
          label: 'Inspection manual action',
          logger,
        })
      }
      await setStep(runRef, steps, 'inspect', 'completed')

      await setStep(runRef, steps, 'close-session', 'running')
      logger.info('close-session', 'Closing browser session')
      await provider.closeSession(handle)
      handle = null
      logger.info('close-session', 'Browser session closed')
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

      logger.info(
        'run',
        finalStatus === 'completed'
          ? 'Inspection completed'
          : 'Inspection requires manual action',
        inspection.manualActionReason,
      )
      await flushRunLogs(logger, {
        userId,
        applicationId,
        runId: runRef.id,
      })

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
        await captureFailureArtifact({
          provider,
          handle,
          userId,
          applicationId,
          runId: runRef.id,
          sessionId: sessionRef.id,
          kind: 'error',
          label: 'Inspection error',
          logger,
        })
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
      logger.error(
        'run',
        'Inspection failed',
        error instanceof Error ? error.message.slice(0, 1000) : String(error),
      )
      await flushRunLogs(logger, {
        userId,
        applicationId,
        runId: runRef.id,
      })
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
    await assertAutomationBudgetAvailable()
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

    const logger = new RunLogCollector(db, {
      userId,
      applicationId,
      runId,
      sessionId: sessionRef.id,
      provider: providerId,
    })
    logger.info(
      'populate',
      'Population requested',
      `${validation.values.length} approved field(s)`,
    )

    let handle: AutomationSessionHandle | null = null
    try {
      logger.info('open-session', 'Opening browser session', providerId)
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
      logger.info('open-session', 'Browser session opened')
      await setStep(runRef, steps, 'populate', 'running')
      handle = await provider.createSession({
        userId,
        applicationId,
        applicationUrl: urlDecision.url,
        allowedDomains,
      })
      logger.info(
        'populate',
        'Re-inspecting the live form and applying approved fields',
      )
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
      for (const result of results) {
        const level =
          result.status === 'filled'
            ? 'info'
            : result.status === 'failed'
              ? 'error'
              : 'warn'
        logger.log(
          level,
          'field',
          `${result.status}: ${result.label}`,
          result.reason,
        )
      }
      if (results.some((result) => result.status !== 'filled')) {
        await captureFailureArtifact({
          provider,
          handle,
          userId,
          applicationId,
          runId,
          sessionId: sessionRef.id,
          kind: 'screenshot',
          label: 'Population manual action',
          logger,
        })
      }
      await provider.closeSession(handle)
      handle = null
      logger.info('close-session', 'Browser session closed')
      await setStep(runRef, steps, 'populate', 'completed')

      const filledCount = results.filter((result) => result.status === 'filled').length
      const followUpCount = results.length - filledCount
      const finalStatus =
        followUpCount > 0 ? 'awaiting-manual-action' : 'awaiting-verification'
      const manualActionReason =
        followUpCount > 0
          ? `Populated ${filledCount} approved field(s). ${followUpCount} field(s) need manual follow-up. Verify the application manually before submission.`
          : `Populated ${filledCount} approved field(s). Manual verification is required before submission.`
      const endedAt = new Date().toISOString()
      const verification = {
        status: 'pending' as const,
        requestedAt: endedAt,
        ...(application.status
          ? { applicationStatus: String(application.status) }
          : {}),
      }

      await Promise.all([
        runRef.update({
          status: finalStatus,
          population: stripUndefined({
            approvedFields: validation.values,
            results,
            startedAt: now.toDate().toISOString(),
            endedAt,
          }),
          verification,
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

      logger.info(
        'populate',
        'Population completed',
        `${filledCount} filled, ${followUpCount} follow-up field(s)`,
      )
      logger.info('verification', 'Manual verification required', manualActionReason)
      await flushRunLogs(logger, {
        userId,
        applicationId,
        runId,
      })

      logInfo('automation.population.completed', {
        userId,
        runId,
        applicationId,
        provider: providerId,
        filledCount,
        followUpCount,
        status: finalStatus,
      })
      return {
        runId,
        status: finalStatus,
        results,
      }
    } catch (error) {
      if (handle) {
        await captureFailureArtifact({
          provider,
          handle,
          userId,
          applicationId,
          runId,
          sessionId: sessionRef.id,
          kind: 'error',
          label: 'Population error',
          logger,
        })
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
      logger.error(
        'populate',
        'Population failed',
        error instanceof Error ? error.message.slice(0, 1000) : String(error),
      )
      await flushRunLogs(logger, {
        userId,
        applicationId,
        runId,
      })
      await recordError('populateAutomationFields', error, {
        userId,
        applicationId,
        runId,
      })
      throw new HttpsError('internal', 'Automation field population failed.')
    }
  },
)

export const verifyAutomationRun = onCall(
  { memory: '256MiB', timeoutSeconds: 30, maxInstances: 2 },
  async (request) => {
    const userId = request.auth?.uid
    if (!userId) {
      throw new HttpsError('unauthenticated', 'Sign in required.')
    }

    const data = (request.data ?? {}) as VerifyAutomationRunRequest
    const runId = validId(data.runId)
    const runRef = db.collection('automationRuns').doc(runId)
    const runSnapshot = await runRef.get()
    if (!runSnapshot.exists) {
      throw new HttpsError('not-found', 'Automation run not found.')
    }

    const run = runSnapshot.data() ?? {}
    if (run.userId !== userId) {
      throw new HttpsError('permission-denied', 'This automation run does not belong to you.')
    }

    const existingVerification =
      run.verification && typeof run.verification === 'object'
        ? (run.verification as Record<string, unknown>)
        : {}
    if (existingVerification.status === 'verified') {
      return {
        runId,
        status: 'verified',
        verification: run.verification,
      }
    }

    if (
      !['awaiting-verification', 'awaiting-manual-action'].includes(
        String(run.status),
      )
    ) {
      throw new HttpsError(
        'failed-precondition',
        'This run is not waiting for manual verification.',
      )
    }
    if (!run.population || typeof run.population !== 'object') {
      throw new HttpsError(
        'failed-precondition',
        'This run has no populated fields to verify.',
      )
    }

    const validation = validateVerificationChecklist(
      data.checklist,
      data.notes,
    )
    if (!validation.ok) {
      throw new HttpsError('invalid-argument', validation.error)
    }

    const applicationId = readString(run.applicationId)
    if (!applicationId) {
      throw new HttpsError('failed-precondition', 'This run has no application.')
    }
    const applicationSnapshot = await db
      .collection('applications')
      .doc(applicationId)
      .get()
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
        'This application is no longer eligible for submission verification.',
      )
    }

    const verifiedAt = new Date().toISOString()
    const applicationUpdatedAt = timestampToIso(application.updatedAt)
    const verification = stripUndefined({
      status: 'verified' as const,
      requestedAt:
        typeof existingVerification.requestedAt === 'string'
          ? existingVerification.requestedAt
          : verifiedAt,
      verifiedAt,
      verifiedBy: userId,
      checklist: validation.checklist,
      ...(validation.notes ? { notes: validation.notes } : {}),
      applicationStatus: String(application.status ?? ''),
      ...(applicationUpdatedAt ? { applicationUpdatedAt } : {}),
    })

    await runRef.update({
      status: 'verified',
      verification,
      manualActionReason: null,
      updatedAt: FieldValue.serverTimestamp(),
    })

    const logger = new RunLogCollector(db, {
      userId,
      applicationId,
      runId,
      sessionId: readString(run.sessionId) || undefined,
      provider: run.provider === 'playwright' ? 'playwright' : 'mock',
    })
    logger.info('verification', 'Manual verification approved')
    await flushRunLogs(logger, { userId, applicationId, runId })

    return { runId, status: 'verified', verification }
  },
)

export const submitAutomationApplication = onCall(
  { memory: '1GiB', timeoutSeconds: 180, maxInstances: 1 },
  async (request) => {
    const userId = request.auth?.uid
    if (!userId) {
      throw new HttpsError('unauthenticated', 'Sign in required.')
    }
    await assertAutomationBudgetAvailable()

    const data = (request.data ?? {}) as SubmitAutomationApplicationRequest
    const runId = validId(data.runId)
    const authorization = validateSubmissionAuthorization(data)
    if (!authorization.ok) {
      throw new HttpsError('invalid-argument', authorization.error)
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
    if (String(run.status) !== 'verified') {
      throw new HttpsError(
        'failed-precondition',
        'This run must be manually verified before submission.',
      )
    }

    const verification =
      run.verification && typeof run.verification === 'object'
        ? (run.verification as AutomationVerification)
        : null
    if (verification?.status !== 'verified') {
      throw new HttpsError(
        'failed-precondition',
        'This run does not have a completed manual verification.',
      )
    }

    const existingSubmission =
      run.submission && typeof run.submission === 'object'
        ? (run.submission as Record<string, unknown>)
        : {}
    if (
      existingSubmission.status === 'submitting' ||
      existingSubmission.status === 'submitted'
    ) {
      throw new HttpsError(
        'failed-precondition',
        'This application has already been submitted or is being submitted.',
      )
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
    if (String(application.status) !== 'approved') {
      throw new HttpsError(
        'failed-precondition',
        'Move the application to Approved in the preparation review before submitting.',
      )
    }
    if (application.submittedAt) {
      throw new HttpsError(
        'failed-precondition',
        'This application has already been submitted.',
      )
    }

    const applicationUrl = readString(application.applicationUrl)
    const urlDecision = validateAutomationUrl(applicationUrl)
    if (!urlDecision.ok || !urlDecision.host || !urlDecision.url) {
      throw new HttpsError(
        'failed-precondition',
        urlDecision.reason ?? 'This application has no safe submission URL.',
      )
    }
    if (!isAllowedHost(urlDecision.host, [urlDecision.host])) {
      throw new HttpsError('permission-denied', 'Application domain is not allowed.')
    }

    const provider = getAutomationProvider()
    const providerId = selectedAutomationProviderId()
    if (!provider.capabilities.has('submit')) {
      throw new HttpsError(
        'failed-precondition',
        'The selected automation provider cannot submit applications.',
      )
    }

    const inspection =
      run.inspection && typeof run.inspection === 'object'
        ? (run.inspection as Record<string, unknown>)
        : {}
    const fields = parseAutomationFields(inspection.fields)
    const proposals = Array.isArray(run.fieldProposals)
      ? (run.fieldProposals as AutomationFieldProposal[])
      : []
    if (fields.length === 0 || proposals.length === 0) {
      throw new HttpsError(
        'failed-precondition',
        'Re-inspect the application before submitting.',
      )
    }

    const population =
      run.population && typeof run.population === 'object'
        ? (run.population as Record<string, unknown>)
        : {}
    const approvedFields = Array.isArray(population.approvedFields)
      ? (population.approvedFields as ApprovedFieldValue[])
      : []
    const validation = validateApprovedFields(fields, approvedFields)
    if (!validation.ok) {
      throw new HttpsError(
        'failed-precondition',
        `The approved field values are no longer valid: ${validation.error}`,
      )
    }

    const approvedKeys = new Set(validation.values.map((field) => field.fieldKey))
    const approvedMap = new Map(
      validation.values.map((field) => [field.fieldKey, field.value]),
    )
    const requiredProposals = proposals.filter((proposal) => proposal.required)
    const missingRequired = requiredProposals.filter(
      (proposal) =>
        proposal.type !== 'file' && !approvedKeys.has(proposal.fieldKey),
    )
    const uncheckedRequired = requiredProposals.filter(
      (proposal) =>
        proposal.type === 'checkbox' &&
        approvedMap.get(proposal.fieldKey) !== true,
    )
    const requiredFileField = proposals.some(
      (proposal) => proposal.required && proposal.type === 'file',
    )
    const hasFileField = proposals.some((proposal) => proposal.type === 'file')

    const [preparationSnapshot, profileSnapshot] = await Promise.all([
      db
        .collection('applicationPreparations')
        .doc(preparationDocId(userId, applicationId))
        .get()
        .catch(() => null),
      db.collection('profiles').doc(userId).get().catch(() => null),
    ])
    const preparation = preparationSnapshot?.data() ?? {}
    const profile = profileSnapshot?.data() ?? {}
    const resumeUrl =
      readString(application.resumeUrl) ||
      readString(preparation.resumeUrl) ||
      readString(profile.resumeUrl)

    if (missingRequired.length > 0) {
      throw new HttpsError(
        'failed-precondition',
        `Complete required fields before submitting: ${missingRequired
          .slice(0, 5)
          .map((proposal) => proposal.label)
          .join(', ')}`,
      )
    }
    if (uncheckedRequired.length > 0) {
      throw new HttpsError(
        'failed-precondition',
        `Required checkboxes must be accepted: ${uncheckedRequired
          .slice(0, 5)
          .map((proposal) => proposal.label)
          .join(', ')}`,
      )
    }
    if (requiredFileField && !resumeUrl) {
      throw new HttpsError(
        'failed-precondition',
        'Attach an approved resume before submitting this application.',
      )
    }

    const now = Timestamp.now()
    const requestedAt = now.toDate().toISOString()
    const sessionRef = db.collection('automationSessions').doc()
    const expiresAt = Timestamp.fromMillis(now.toMillis() + SESSION_TTL_MS)
    const existingSteps: AutomationStep[] = Array.isArray(run.steps)
      ? (run.steps as AutomationStep[])
      : []
    const steps: AutomationStep[] = [
      ...existingSteps,
      { name: 'submit', status: 'pending' },
    ]

    await db.runTransaction(async (transaction) => {
      const currentSnapshot = await transaction.get(runRef)
      if (!currentSnapshot.exists) {
        throw new HttpsError('not-found', 'Automation run not found.')
      }
      const current = currentSnapshot.data() ?? {}
      if (current.userId !== userId || String(current.status) !== 'verified') {
        throw new HttpsError(
          'failed-precondition',
          'This run is no longer eligible for submission.',
        )
      }
      const currentSubmission = current.submission
      if (
        currentSubmission &&
        typeof currentSubmission === 'object' &&
        ['submitting', 'submitted'].includes(
          String((currentSubmission as Record<string, unknown>).status),
        )
      ) {
        throw new HttpsError(
          'failed-precondition',
          'This application has already been submitted or is being submitted.',
        )
      }
      transaction.update(runRef, {
        status: 'submitting',
        currentStep: 'submit',
        steps,
        sessionId: sessionRef.id,
        submission: stripUndefined({
          status: 'submitting',
          requestedAt,
          ...(resumeUrl ? { resumeUrl } : {}),
        }),
        updatedAt: FieldValue.serverTimestamp(),
      })
    })

    const logger = new RunLogCollector(db, {
      userId,
      applicationId,
      runId,
      sessionId: sessionRef.id,
      provider: providerId,
    })
    logger.info('submit', 'Application submission requested')
    let handle: AutomationSessionHandle | null = null
    let confirmedSubmission: AutomationSubmission | null = null
    let recordedSubmission: AutomationSubmission | null = null
    let submissionRecorded = false

    const markManual = async (reason: string) => {
      if (handle) {
        await captureFailureArtifact({
          provider,
          handle,
          userId,
          applicationId,
          runId,
          sessionId: sessionRef.id,
          kind: 'screenshot',
          label: 'Submission manual action',
          logger,
        })
        await provider.closeSession(handle).catch(() => undefined)
        handle = null
      }
      await setStep(runRef, steps, 'submit', 'failed', 'Manual action required')
      const submission: AutomationSubmission = stripUndefined({
        status: 'manual-required',
        requestedAt,
        reason,
        ...(resumeUrl ? { resumeUrl } : {}),
      })
      await runRef.update({
        status: 'awaiting-manual-action',
        submission,
        manualActionReason: reason,
        updatedAt: FieldValue.serverTimestamp(),
      })
      await sessionRef.update({
        status: 'ended',
        endedAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      })
      logger.warn('submit', 'Submission requires manual action', reason)
      await flushRunLogs(logger, { userId, applicationId, runId })
      return { runId, status: 'awaiting-manual-action', submission }
    }

    const markFailed = async (reason: string) => {
      if (handle) {
        await captureFailureArtifact({
          provider,
          handle,
          userId,
          applicationId,
          runId,
          sessionId: sessionRef.id,
          kind: 'error',
          label: 'Submission error',
          logger,
        })
        await provider.closeSession(handle).catch(() => undefined)
        handle = null
      }
      await setStep(runRef, steps, 'submit', 'failed', 'Submission failed')
      const submission: AutomationSubmission = stripUndefined({
        status: 'failed',
        requestedAt,
        error: reason,
        ...(resumeUrl ? { resumeUrl } : {}),
      })
      await runRef.update({
        status: 'failed',
        submission,
        error: reason,
        manualActionReason: reason,
        endedAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      })
      await sessionRef.set(
        {
          userId,
          applicationId,
          provider: providerId,
          status: 'failed',
          failureReason: reason.slice(0, 500),
          endedAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true },
      )
      logger.error('submit', 'Submission failed', reason)
      await flushRunLogs(logger, { userId, applicationId, runId })
      return { runId, status: 'failed', submission }
    }

    try {
      logger.info('open-session', 'Opening browser session', providerId)
      await sessionRef.set({
        userId,
        applicationId,
        provider: providerId,
        status: 'active',
        allowedDomains: [urlDecision.host],
        startedAt: FieldValue.serverTimestamp(),
        expiresAt,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      })
      logger.info('open-session', 'Browser session opened')
      await setStep(runRef, steps, 'submit', 'running')
      handle = await provider.createSession({
        userId,
        applicationId,
        applicationUrl: urlDecision.url,
        allowedDomains: [urlDecision.host],
      })

      logger.info('submit', 'Re-populating approved fields before submission')
      const populationResults = await provider.populateApprovedFields(
        handle,
        {
          userId,
          applicationId,
          applicationUrl: urlDecision.url,
          allowedDomains: [urlDecision.host],
        },
        validation.values,
        fields,
      )
      const populationFailure = populationResults.find(
        (result) => result.status !== 'filled',
      )
      if (populationFailure) {
        return await markManual(
          `Field population did not complete: ${populationFailure.label}. ${populationFailure.reason ?? ''}`.trim(),
        )
      }

      if (hasFileField && resumeUrl) {
        logger.info('submit', 'Uploading the approved resume')
        const resumeFile = await downloadApprovedResume(resumeUrl)
        const uploadResults = await provider.uploadResume(handle, resumeFile)
        const uploadFailure = uploadResults.find(
          (result) =>
            result.status === 'failed' || result.status === 'manual-required',
        )
        if (uploadFailure) {
          return await markManual(
            `Resume upload did not complete: ${uploadFailure.reason ?? uploadFailure.label}`,
          )
        }
      }

      logger.info('submit', 'Clicking the application Submit control')
      const result = await provider.submitApplication(handle)
      if (result.status === 'manual-required') {
        return await markManual(
          result.reason ?? 'Submission confirmation could not be verified.',
        )
      }
      if (result.status === 'failed') {
        return await markFailed(
          result.reason ?? 'The Submit control could not be activated.',
        )
      }

      const submittedAt = result.submittedAt ?? new Date().toISOString()
      const submission: AutomationSubmission = stripUndefined({
        status: 'submitted',
        requestedAt,
        submittedAt,
        ...(result.confirmationUrl
          ? { confirmationUrl: result.confirmationUrl }
          : {}),
        ...(result.confirmationText
          ? { confirmationText: result.confirmationText }
          : {}),
        ...(resumeUrl ? { resumeUrl } : {}),
      })
      confirmedSubmission = submission

      await provider.closeSession(handle).catch(() => undefined)
      handle = null
      logger.info('close-session', 'Browser session closed')
      await setStep(runRef, steps, 'submit', 'completed')
      const eventRef = db.collection('applicationEvents').doc()
      await db.runTransaction(async (transaction) => {
        const applicationCurrentSnapshot = await transaction.get(applicationRef)
        if (!applicationCurrentSnapshot.exists) {
          throw new Error('Application disappeared before submission was recorded.')
        }
        const applicationCurrent = applicationCurrentSnapshot.data() ?? {}
        if (
          applicationCurrent.userId !== userId ||
          String(applicationCurrent.status) !== 'approved'
        ) {
          throw new Error(
            'The application changed before submission could be recorded.',
          )
        }
        transaction.update(applicationRef, {
          status: 'submitted',
          submittedAt: FieldValue.serverTimestamp(),
          submittedManually: false,
          updatedAt: FieldValue.serverTimestamp(),
        })
        transaction.set(eventRef, {
          userId,
          applicationId,
          type: 'status-changed',
          fromStatus: 'approved',
          toStatus: 'submitted',
          note: 'Submitted through browser automation',
          createdAt: FieldValue.serverTimestamp(),
        })
        transaction.update(runRef, {
          status: 'submitted',
          submission,
          manualActionReason: null,
          endedAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        })
      })

      recordedSubmission = submission
      submissionRecorded = true
      confirmedSubmission = null
      logger.info('submit', 'Application submission confirmed', result.confirmationText)
      await flushRunLogs(logger, { userId, applicationId, runId })
      logInfo('automation.submission.completed', {
        userId,
        runId,
        applicationId,
        provider: providerId,
      })
      return { runId, status: 'submitted', submission }
    } catch (error) {
      if (submissionRecorded && recordedSubmission) {
        if (handle) {
          await provider.closeSession(handle).catch(() => undefined)
          handle = null
        }
        await flushRunLogs(logger, { userId, applicationId, runId })
        return { runId, status: 'submitted', submission: recordedSubmission }
      }

      if (confirmedSubmission) {
        if (handle) {
          await provider.closeSession(handle).catch(() => undefined)
          handle = null
        }
        const reason =
          'The browser confirmed submission, but the application record could not be updated. Verify the application and mark it submitted manually.'
        const manualSubmission: AutomationSubmission = stripUndefined({
          status: 'manual-required',
          requestedAt,
          ...(confirmedSubmission.submittedAt
            ? { submittedAt: confirmedSubmission.submittedAt }
            : {}),
          ...(confirmedSubmission.confirmationUrl
            ? { confirmationUrl: confirmedSubmission.confirmationUrl }
            : {}),
          ...(confirmedSubmission.confirmationText
            ? { confirmationText: confirmedSubmission.confirmationText }
            : {}),
          ...(resumeUrl ? { resumeUrl } : {}),
          reason,
        })
        await setStep(runRef, steps, 'submit', 'failed', 'Manual follow-up required')
        await runRef.update({
          status: 'awaiting-manual-action',
          submission: manualSubmission,
          manualActionReason: reason,
          endedAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        })
        await sessionRef.set(
          {
            userId,
            applicationId,
            provider: providerId,
            status: 'ended',
            endedAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp(),
          },
          { merge: true },
        )
        logger.warn('submit', 'Submission confirmed but not recorded', reason)
        await flushRunLogs(logger, { userId, applicationId, runId })
        return {
          runId,
          status: 'awaiting-manual-action',
          submission: manualSubmission,
        }
      }

      if (handle) {
        await captureFailureArtifact({
          provider,
          handle,
          userId,
          applicationId,
          runId,
          sessionId: sessionRef.id,
          kind: 'error',
          label: 'Submission error',
          logger,
        })
        await provider.closeSession(handle).catch(() => undefined)
        handle = null
      }
      const reason =
        error instanceof Error ? error.message.slice(0, 1000) : String(error)
      await setStep(runRef, steps, 'submit', 'failed', 'Submission failed')
      await runRef.update({
        status: 'failed',
        submission: stripUndefined({
          status: 'failed',
          requestedAt,
          error: reason,
          ...(resumeUrl ? { resumeUrl } : {}),
        }),
        error: reason,
        manualActionReason: reason,
        endedAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      })
      await sessionRef.set(
        {
          userId,
          applicationId,
          provider: providerId,
          status: 'failed',
          failureReason: reason.slice(0, 500),
          endedAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true },
      )
      logger.error('submit', 'Submission failed', reason)
      await flushRunLogs(logger, { userId, applicationId, runId })
      await recordError('submitAutomationApplication', error, {
        userId,
        applicationId,
        runId,
      })
      throw new HttpsError(
        'internal',
        'Application submission failed. Review the application manually.',
      )
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
    if (
      ![
        'queued',
        'running',
        'awaiting-manual-action',
        'awaiting-verification',
      ].includes(String(run.status))
    ) {
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

    const applicationId = readString(run.applicationId)
    const logger = new RunLogCollector(db, {
      userId,
      applicationId,
      runId,
      sessionId: readString(run.sessionId) || undefined,
      provider: run.provider === 'playwright' ? 'playwright' : 'mock',
    })
    logger.warn('run', 'Run cancelled by user')
    await flushRunLogs(logger, { userId, applicationId, runId })
    return { runId, status: 'cancelled' }
  },
)

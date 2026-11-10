import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  where,
  type DocumentData,
  type Timestamp,
} from 'firebase/firestore'
import { httpsCallable } from 'firebase/functions'
import { db } from '@/services/firestore'
import { collections } from '@/services/collections'
import { functions } from '@/services/functions'
import type {
  ApplicationInspection,
  ApprovedFieldValue,
  AutomationArtifact,
  AutomationArtifactKind,
  AutomationFieldConfidence,
  AutomationFieldDescriptor,
  AutomationFieldProposal,
  AutomationFieldSource,
  AutomationLogEntry,
  AutomationLogLevel,
  AutomationPopulation,
  AutomationRun,
  AutomationRunArtifacts,
  AutomationRunLog,
  AutomationRunStatus,
  AutomationStep,
  AutomationStepStatus,
  AutomationSubmission,
  AutomationVerification,
  AutomationVerificationChecklist,
  FieldPopulationResult,
  FieldPopulationStatus,
} from '@/types/automation'

const runs = collection(db, collections.automationRuns)

export async function startAutomationInspection(applicationId: string): Promise<{
  runId: string
  sessionId: string
  status: AutomationRunStatus
}> {
  const callable = httpsCallable<
    { applicationId: string },
    { runId: string; sessionId: string; status: AutomationRunStatus }
  >(functions, 'startAutomationInspection')
  const response = await callable({ applicationId })
  return response.data
}

export async function populateAutomationFields(
  runId: string,
  approvedFields: ApprovedFieldValue[],
): Promise<{
  runId: string
  status: AutomationRunStatus
  results: FieldPopulationResult[]
}> {
  const callable = httpsCallable<
    { runId: string; approvedFields: ApprovedFieldValue[] },
    { runId: string; status: AutomationRunStatus; results: FieldPopulationResult[] }
  >(functions, 'populateAutomationFields')
  const response = await callable({ runId, approvedFields })
  return response.data
}

export async function verifyAutomationRun(
  runId: string,
  checklist: AutomationVerificationChecklist,
  notes?: string,
): Promise<{
  runId: string
  status: AutomationRunStatus
  verification: AutomationVerification
}> {
  const callable = httpsCallable<
    {
      runId: string
      checklist: AutomationVerificationChecklist
      notes?: string
    },
    {
      runId: string
      status: AutomationRunStatus
      verification: AutomationVerification
    }
  >(functions, 'verifyAutomationRun')
  const response = await callable({
    runId,
    checklist,
    ...(notes?.trim() ? { notes: notes.trim() } : {}),
  })
  return response.data
}

export async function submitAutomationApplication(
  runId: string,
): Promise<{
  runId: string
  status: AutomationRunStatus
  submission: AutomationSubmission
}> {
  const callable = httpsCallable<
    { runId: string; authorize: boolean; confirmation: string },
    {
      runId: string
      status: AutomationRunStatus
      submission: AutomationSubmission
    }
  >(functions, 'submitAutomationApplication')
  const response = await callable({
    runId,
    authorize: true,
    confirmation: 'SUBMIT',
  })
  return response.data
}

export async function cancelAutomationRun(runId: string): Promise<void> {
  const callable = httpsCallable<{ runId: string }, { runId: string; status: string }>(
    functions,
    'cancelAutomationRun',
  )
  await callable({ runId })
}

export async function listAutomationRuns(uid: string, limitCount = 25): Promise<AutomationRun[]> {
  const snapshot = await getDocs(
    query(
      runs,
      where('userId', '==', uid),
      orderBy('createdAt', 'desc'),
      limit(limitCount),
    ),
  )
  return snapshot.docs.map((document) => toAutomationRun(document.id, document.data()))
}

export async function getAutomationLog(runId: string): Promise<AutomationRunLog | null> {
  const snapshot = await getDoc(doc(db, collections.automationLogs, runId))
  return snapshot.exists()
    ? toAutomationRunLog(snapshot.id, snapshot.data())
    : null
}

export async function getAutomationArtifacts(
  runId: string,
): Promise<AutomationRunArtifacts | null> {
  const snapshot = await getDoc(doc(db, collections.automationArtifacts, runId))
  return snapshot.exists()
    ? toAutomationRunArtifacts(snapshot.id, snapshot.data())
    : null
}

function stringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string')
    : []
}

function fields(value: unknown): AutomationFieldDescriptor[] {
  if (!Array.isArray(value)) return []
  return value.flatMap((entry, index) => {
    if (!entry || typeof entry !== 'object') return []
    const record = entry as Record<string, unknown>
    if (typeof record.name !== 'string' || !record.name.trim()) return []
    return [
      {
        key:
          typeof record.key === 'string' && record.key.trim()
            ? record.key
            : `legacy-field-${index}`,
        name: record.name,
        required: record.required === true ? true : undefined,
        type:
          typeof record.type === 'string'
            ? (record.type as AutomationFieldDescriptor['type'])
            : undefined,
        inputType:
          typeof record.inputType === 'string' ? record.inputType : undefined,
        tagName:
          typeof record.tagName === 'string' ? record.tagName : undefined,
        id: typeof record.id === 'string' ? record.id : undefined,
        htmlName:
          typeof record.htmlName === 'string' ? record.htmlName : undefined,
        placeholder:
          typeof record.placeholder === 'string' ? record.placeholder : undefined,
        ariaLabel:
          typeof record.ariaLabel === 'string' ? record.ariaLabel : undefined,
        options: stringArray(record.options),
      },
    ]
  })
}

function proposalSource(value: unknown): AutomationFieldSource {
  return value === 'application' ||
    value === 'profile' ||
    value === 'preparation' ||
    value === 'none'
    ? value
    : 'none'
}

function proposalConfidence(value: unknown): AutomationFieldConfidence {
  return value === 'high' || value === 'medium' || value === 'manual'
    ? value
    : 'manual'
}

function proposals(value: unknown): AutomationFieldProposal[] | undefined {
  if (!Array.isArray(value)) return undefined
  const result = value.flatMap((entry) => {
    if (!entry || typeof entry !== 'object') return []
    const record = entry as Record<string, unknown>
    if (typeof record.fieldKey !== 'string' || !record.fieldKey.trim()) return []
    if (typeof record.label !== 'string' || !record.label.trim()) return []
    return [
      {
        fieldKey: record.fieldKey,
        label: record.label,
        type:
          typeof record.type === 'string'
            ? (record.type as AutomationFieldProposal['type'])
            : undefined,
        inputType:
          typeof record.inputType === 'string' ? record.inputType : undefined,
        required: record.required === true ? true : undefined,
        options: stringArray(record.options),
        proposedValue:
          typeof record.proposedValue === 'string' ||
          typeof record.proposedValue === 'boolean'
            ? record.proposedValue
            : undefined,
        proposedSource: proposalSource(record.proposedSource),
        confidence: proposalConfidence(record.confidence),
        note: typeof record.note === 'string' ? record.note : undefined,
      },
    ]
  })
  return result.length ? result : undefined
}

function populationStatus(value: unknown): FieldPopulationStatus {
  return value === 'filled' ||
    value === 'skipped' ||
    value === 'failed' ||
    value === 'manual-required'
    ? value
    : 'failed'
}

function population(value: unknown): AutomationPopulation | undefined {
  if (!value || typeof value !== 'object') return undefined
  const record = value as Record<string, unknown>
  const approvedFields = Array.isArray(record.approvedFields)
    ? record.approvedFields.flatMap((entry) => {
        if (!entry || typeof entry !== 'object') return []
        const item = entry as Record<string, unknown>
        if (
          typeof item.fieldKey !== 'string' ||
          (typeof item.value !== 'string' && typeof item.value !== 'boolean')
        ) {
          return []
        }
        return [{ fieldKey: item.fieldKey, value: item.value }]
      })
    : []
  const results = Array.isArray(record.results)
    ? record.results.flatMap((entry) => {
        if (!entry || typeof entry !== 'object') return []
        const item = entry as Record<string, unknown>
        if (typeof item.fieldKey !== 'string' || typeof item.label !== 'string') {
          return []
        }
        return [
          {
            fieldKey: item.fieldKey,
            label: item.label,
            status: populationStatus(item.status),
            valuePreview:
              typeof item.valuePreview === 'string' ? item.valuePreview : undefined,
            reason: typeof item.reason === 'string' ? item.reason : undefined,
          },
        ]
      })
    : []

  return {
    approvedFields,
    results,
    startedAt: typeof record.startedAt === 'string' ? record.startedAt : undefined,
    endedAt: typeof record.endedAt === 'string' ? record.endedAt : undefined,
  }
}

function inspection(value: unknown): ApplicationInspection | undefined {
  if (!value || typeof value !== 'object') return undefined
  const record = value as Record<string, unknown>
  return {
    title: typeof record.title === 'string' ? record.title : undefined,
    fields: fields(record.fields),
    questions: stringArray(record.questions),
    manualActionReason:
      typeof record.manualActionReason === 'string'
        ? record.manualActionReason
        : undefined,
  }
}

function steps(value: unknown): AutomationStep[] {
  if (!Array.isArray(value)) return []
  return value.flatMap((entry) => {
    if (!entry || typeof entry !== 'object') return []
    const record = entry as Record<string, unknown>
    if (typeof record.name !== 'string' || typeof record.status !== 'string') return []
    return [
      {
        name: record.name,
        status: record.status as AutomationStepStatus,
        detail: typeof record.detail === 'string' ? record.detail : undefined,
        startedAt: typeof record.startedAt === 'string' ? record.startedAt : undefined,
        endedAt: typeof record.endedAt === 'string' ? record.endedAt : undefined,
      },
    ]
  })
}

function logLevel(value: unknown): AutomationLogLevel {
  return value === 'warn' || value === 'error' ? value : 'info'
}

function logEntries(value: unknown): AutomationLogEntry[] {
  if (!Array.isArray(value)) return []
  return value
    .flatMap((entry) => {
      if (!entry || typeof entry !== 'object') return []
      const record = entry as Record<string, unknown>
      if (
        typeof record.step !== 'string' ||
        typeof record.message !== 'string' ||
        typeof record.createdAt !== 'string'
      ) {
        return []
      }
      return [
        {
          sequence:
            typeof record.sequence === 'number' ? record.sequence : 0,
          level: logLevel(record.level),
          step: record.step,
          message: record.message,
          detail: typeof record.detail === 'string' ? record.detail : undefined,
          createdAt: record.createdAt,
        },
      ]
    })
    .sort(
      (a, b) =>
        a.createdAt.localeCompare(b.createdAt) ||
        a.sequence - b.sequence,
    )
}

function artifactKind(value: unknown): AutomationArtifactKind {
  return value === 'error' ? 'error' : 'screenshot'
}

function artifacts(value: unknown): AutomationArtifact[] {
  if (!Array.isArray(value)) return []
  return value.flatMap((entry) => {
    if (!entry || typeof entry !== 'object') return []
    const record = entry as Record<string, unknown>
    if (
      typeof record.id !== 'string' ||
      typeof record.label !== 'string' ||
      typeof record.storagePath !== 'string' ||
      typeof record.size !== 'number'
    ) {
      return []
    }
    return [
      {
        id: record.id,
        kind: artifactKind(record.kind),
        label: record.label,
        storagePath: record.storagePath,
        contentType: 'image/webp',
        size: record.size,
        width: typeof record.width === 'number' ? record.width : undefined,
        height: typeof record.height === 'number' ? record.height : undefined,
        pageUrl:
          typeof record.pageUrl === 'string' ? record.pageUrl : undefined,
        pageTitle:
          typeof record.pageTitle === 'string' ? record.pageTitle : undefined,
        createdAt:
          typeof record.createdAt === 'string'
            ? record.createdAt
            : new Date(0).toISOString(),
      },
    ]
  })
}

function toAutomationRunArtifacts(
  id: string,
  data: DocumentData,
): AutomationRunArtifacts {
  return {
    id,
    userId: typeof data.userId === 'string' ? data.userId : '',
    applicationId:
      typeof data.applicationId === 'string' ? data.applicationId : '',
    runId: typeof data.runId === 'string' ? data.runId : id,
    sessionId: typeof data.sessionId === 'string' ? data.sessionId : undefined,
    artifacts: artifacts(data.artifacts),
    expiresAt: data.expiresAt as Timestamp | undefined,
    createdAt: data.createdAt as Timestamp | undefined,
    updatedAt: data.updatedAt as Timestamp | undefined,
  }
}

function toAutomationRunLog(id: string, data: DocumentData): AutomationRunLog {
  return {
    id,
    userId: typeof data.userId === 'string' ? data.userId : '',
    applicationId:
      typeof data.applicationId === 'string' ? data.applicationId : '',
    runId: typeof data.runId === 'string' ? data.runId : id,
    sessionId: typeof data.sessionId === 'string' ? data.sessionId : undefined,
    provider: data.provider === 'playwright' ? 'playwright' : 'mock',
    entries: logEntries(data.entries),
    truncated: data.truncated === true,
    expiresAt: data.expiresAt as Timestamp | undefined,
    createdAt: data.createdAt as Timestamp | undefined,
    updatedAt: data.updatedAt as Timestamp | undefined,
  }
}

function submissionStatus(value: unknown): AutomationSubmission['status'] {
  return value === 'submitting' ||
    value === 'submitted' ||
    value === 'manual-required' ||
    value === 'failed'
    ? value
    : 'manual-required'
}

function submission(value: unknown): AutomationSubmission | undefined {
  if (!value || typeof value !== 'object') return undefined
  const record = value as Record<string, unknown>
  if (typeof record.requestedAt !== 'string') return undefined
  return {
    status: submissionStatus(record.status),
    requestedAt: record.requestedAt,
    submittedAt:
      typeof record.submittedAt === 'string' ? record.submittedAt : undefined,
    confirmationUrl:
      typeof record.confirmationUrl === 'string'
        ? record.confirmationUrl
        : undefined,
    confirmationText:
      typeof record.confirmationText === 'string'
        ? record.confirmationText
        : undefined,
    error: typeof record.error === 'string' ? record.error : undefined,
    reason: typeof record.reason === 'string' ? record.reason : undefined,
    resumeUrl:
      typeof record.resumeUrl === 'string' ? record.resumeUrl : undefined,
  }
}

function verificationChecklist(
  value: unknown,
): AutomationVerificationChecklist | undefined {
  if (!value || typeof value !== 'object') return undefined
  const record = value as Record<string, unknown>
  return {
    openedApplication: record.openedApplication === true,
    reviewedPopulatedFields: record.reviewedPopulatedFields === true,
    handledManualFields: record.handledManualFields === true,
    confirmsInformationIsAccurate:
      record.confirmsInformationIsAccurate === true,
  }
}

function verification(value: unknown): AutomationVerification | undefined {
  if (!value || typeof value !== 'object') return undefined
  const record = value as Record<string, unknown>
  if (record.status !== 'pending' && record.status !== 'verified') {
    return undefined
  }
  return {
    status: record.status,
    requestedAt:
      typeof record.requestedAt === 'string' ? record.requestedAt : '',
    verifiedAt:
      typeof record.verifiedAt === 'string' ? record.verifiedAt : undefined,
    verifiedBy:
      typeof record.verifiedBy === 'string' ? record.verifiedBy : undefined,
    notes: typeof record.notes === 'string' ? record.notes : undefined,
    checklist: verificationChecklist(record.checklist),
    applicationStatus:
      typeof record.applicationStatus === 'string'
        ? record.applicationStatus
        : undefined,
    applicationUpdatedAt:
      typeof record.applicationUpdatedAt === 'string'
        ? record.applicationUpdatedAt
        : undefined,
  }
}

function toAutomationRun(id: string, data: DocumentData): AutomationRun {
  return {
    id,
    userId: typeof data.userId === 'string' ? data.userId : '',
    applicationId: typeof data.applicationId === 'string' ? data.applicationId : '',
    applicationTitle:
      typeof data.applicationTitle === 'string' ? data.applicationTitle : '',
    companyName: typeof data.companyName === 'string' ? data.companyName : '',
    sessionId: typeof data.sessionId === 'string' ? data.sessionId : '',
    provider: data.provider === 'playwright' ? 'playwright' : 'mock',
    status: (data.status as AutomationRunStatus) ?? 'queued',
    currentStep: typeof data.currentStep === 'string' ? data.currentStep : 'validate',
    steps: steps(data.steps),
    inspection: inspection(data.inspection),
    fieldProposals: proposals(data.fieldProposals),
    population: population(data.population),
    verification: verification(data.verification),
    submission: submission(data.submission),
    manualActionReason:
      typeof data.manualActionReason === 'string' ? data.manualActionReason : undefined,
    error: typeof data.error === 'string' ? data.error : undefined,
    startedAt: data.startedAt as Timestamp | undefined,
    endedAt: data.endedAt as Timestamp | undefined,
    createdAt: data.createdAt as Timestamp | undefined,
    updatedAt: data.updatedAt as Timestamp | undefined,
  }
}

import { collection, getDocs, limit, orderBy, query, where, type DocumentData, type Timestamp } from 'firebase/firestore'
import { httpsCallable } from 'firebase/functions'
import { db } from '@/services/firestore'
import { collections } from '@/services/collections'
import { functions } from '@/services/functions'
import type {
  ApplicationInspection,
  AutomationRun,
  AutomationRunStatus,
  AutomationStep,
  AutomationStepStatus,
} from '@/types/automation'
import type { AtsApplicationField } from '@/types/jobs'

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

function stringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string')
    : []
}

function fields(value: unknown): AtsApplicationField[] {
  if (!Array.isArray(value)) return []
  return value.flatMap((entry) => {
    if (!entry || typeof entry !== 'object') return []
    const record = entry as Record<string, unknown>
    if (typeof record.name !== 'string' || !record.name.trim()) return []
    return [
      {
        name: record.name,
        required: record.required === true ? true : undefined,
        type:
          typeof record.type === 'string'
            ? (record.type as AtsApplicationField['type'])
            : undefined,
        options: stringArray(record.options),
      },
    ]
  })
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
    manualActionReason:
      typeof data.manualActionReason === 'string' ? data.manualActionReason : undefined,
    error: typeof data.error === 'string' ? data.error : undefined,
    startedAt: data.startedAt as Timestamp | undefined,
    endedAt: data.endedAt as Timestamp | undefined,
    createdAt: data.createdAt as Timestamp | undefined,
    updatedAt: data.updatedAt as Timestamp | undefined,
  }
}

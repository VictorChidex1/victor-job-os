import { getFirestore } from 'firebase-admin/firestore'
import { HttpsError } from 'firebase-functions/v2/https'
import { logWarn } from './logger.js'

export interface BudgetControl {
  aiPaused: boolean
  automationPaused: boolean
  reason?: string
  costAmount?: number
  budgetAmount?: number
  pausedAt?: string
  resumedAt?: string
  resumedBy?: string
}

const db = getFirestore()

async function readBudgetControl(): Promise<BudgetControl | null> {
  try {
    const snapshot = await db.collection('systemControl').doc('budget').get()
    if (!snapshot.exists) return null
    const data = snapshot.data() ?? {}
    return {
      aiPaused: data.aiPaused === true,
      automationPaused: data.automationPaused === true,
      reason: typeof data.reason === 'string' ? data.reason : undefined,
      costAmount:
        typeof data.costAmount === 'number' ? data.costAmount : undefined,
      budgetAmount:
        typeof data.budgetAmount === 'number' ? data.budgetAmount : undefined,
      pausedAt: typeof data.pausedAt === 'string' ? data.pausedAt : undefined,
      resumedAt: typeof data.resumedAt === 'string' ? data.resumedAt : undefined,
      resumedBy: typeof data.resumedBy === 'string' ? data.resumedBy : undefined,
    }
  } catch (error) {
    logWarn('budget.control.read_failed', {
      error: error instanceof Error ? error.message : String(error),
    })
    return null
  }
}

export async function assertAiBudgetAvailable(): Promise<void> {
  const control = await readBudgetControl()
  if (control?.aiPaused) {
    throw new HttpsError(
      'failed-precondition',
      control.reason ||
        'AI is paused because the monthly Cloud Billing budget has been reached.',
    )
  }
}

export async function assertAutomationBudgetAvailable(): Promise<void> {
  const control = await readBudgetControl()
  if (control?.automationPaused) {
    throw new HttpsError(
      'failed-precondition',
      control.reason ||
        'Browser automation is paused because the monthly Cloud Billing budget has been reached.',
    )
  }
}

export async function getBudgetControl(): Promise<BudgetControl | null> {
  return readBudgetControl()
}

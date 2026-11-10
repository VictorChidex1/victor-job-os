import { doc, getDoc } from 'firebase/firestore'
import { httpsCallable } from 'firebase/functions'
import { db } from '@/services/firestore'
import { functions } from '@/services/functions'
import { collections } from '@/services/collections'
import type { BudgetControlState } from '@/types/admin'

export async function loadBudgetControl(): Promise<BudgetControlState | null> {
  const snapshot = await getDoc(
    doc(db, collections.systemControl, 'budget'),
  )
  if (!snapshot.exists()) return null
  const data = snapshot.data()
  return {
    aiPaused: data.aiPaused === true,
    automationPaused: data.automationPaused === true,
    reason: typeof data.reason === 'string' ? data.reason : undefined,
    costAmount: typeof data.costAmount === 'number' ? data.costAmount : undefined,
    budgetAmount:
      typeof data.budgetAmount === 'number' ? data.budgetAmount : undefined,
    currencyCode:
      typeof data.currencyCode === 'string' ? data.currencyCode : undefined,
    pausedAt: data.pausedAt,
    pausedBy: typeof data.pausedBy === 'string' ? data.pausedBy : undefined,
    resumedAt: data.resumedAt,
    resumedBy: typeof data.resumedBy === 'string' ? data.resumedBy : undefined,
  }
}

export async function setBudgetPause(
  paused: boolean,
  reason?: string,
): Promise<{ paused: boolean; reason: string }> {
  const callable = httpsCallable<
    { paused: boolean; reason?: string },
    { paused: boolean; reason: string }
  >(functions, 'adminSetBudgetPause')
  const response = await callable({
    paused,
    ...(reason?.trim() ? { reason: reason.trim() } : {}),
  })
  return response.data
}

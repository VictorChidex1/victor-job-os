import { initializeApp } from 'firebase-admin/app'
import { FieldValue, getFirestore } from 'firebase-admin/firestore'
import { onMessagePublished } from 'firebase-functions/v2/pubsub'
import { logInfo } from '../utils/logger.js'

initializeApp()
const db = getFirestore()

interface BudgetNotification {
  budgetDisplayName?: string
  costAmount?: number
  budgetAmount?: number
  currencyCode?: string
  alertThresholdExceeded?: number
  forecastThresholdExceeded?: number
}

function asNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined
}

export const onBillingBudgetAlert = onMessagePublished(
  {
    topic: process.env.BILLING_BUDGET_TOPIC ?? 'billing-budget-alerts',
    memory: '256MiB',
    timeoutSeconds: 60,
    maxInstances: 1,
  },
  async (event) => {
    const raw = event.data.message.data
    if (!raw) return

    let payload: BudgetNotification
    try {
      payload = JSON.parse(Buffer.from(raw, 'base64').toString('utf8'))
    } catch {
      return
    }

    const costAmount = asNumber(payload.costAmount) ?? 0
    const budgetAmount = asNumber(payload.budgetAmount) ?? 0
    const threshold = asNumber(payload.alertThresholdExceeded) ?? 0
    // Pause at 80% of the budget to leave room for delayed billing data and
    // keep the project below the configured $2 ceiling.
    const shouldPause =
      threshold >= 0.8 ||
      (budgetAmount > 0 && costAmount >= budgetAmount * 0.8)

    if (!shouldPause) return

    const reason = `Cloud Billing budget reached: $${costAmount.toFixed(
      2,
    )} of $${budgetAmount.toFixed(2)}. AI and browser automation are paused.`
    const controlRef = db.collection('systemControl').doc('budget')

    const applied = await db.runTransaction(async (transaction) => {
      const snapshot = await transaction.get(controlRef)
      const existing = snapshot.data() ?? {}
      if (
        existing.aiPaused === true &&
        typeof existing.costAmount === 'number' &&
        existing.costAmount >= costAmount
      ) {
        return false
      }

      transaction.set(
        controlRef,
        {
          aiPaused: true,
          automationPaused: true,
          reason,
          costAmount,
          budgetAmount,
          currencyCode:
            typeof payload.currencyCode === 'string'
              ? payload.currencyCode
              : 'USD',
          alertThresholdExceeded: threshold,
          budgetDisplayName:
            typeof payload.budgetDisplayName === 'string'
              ? payload.budgetDisplayName
              : 'Victor Job OS budget',
          pausedAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true },
      )
      return true
    })

    if (!applied) return

    await db.collection('adminAuditLogs').add({
      actorUid: 'system',
      targetUid: 'systemControl/budget',
      targetEmail: null,
      actorType: 'system',
      action: 'budget-paused',
      reason,
      metadata: {
        costAmount,
        budgetAmount,
        threshold,
        currencyCode: payload.currencyCode ?? 'USD',
      },
      createdAt: FieldValue.serverTimestamp(),
    })

    logInfo('billing.budget.paused', {
      costAmount,
      budgetAmount,
      threshold,
    })
  },
)

import { initializeApp } from 'firebase-admin/app'
import { getFirestore, FieldValue } from 'firebase-admin/firestore'
import { logInfo, logWarn } from './logger.js'

initializeApp()
const db = getFirestore()

export type AiOperation = 'analyzeJob' | 'researchCompany' | 'matchPortfolio' | 'generatePitch'

export interface AiRunInput {
  userId: string
  provider: string
  model: string
  operation: AiOperation
  status: 'success' | 'error'
  durationMs: number
  jobId?: string
  error?: string
}

/** Rough per-call estimates (USD) for visibility only — not billing truth. */
const ESTIMATED_COST_PER_CALL: Record<AiOperation, number> = {
  analyzeJob: 0.001,
  researchCompany: 0.0008,
  matchPortfolio: 0.0008,
  generatePitch: 0.0015,
}

export function currentProvider(): { provider: string; model: string } {
  const provider = (process.env.AI_PROVIDER ?? 'gemini').toLowerCase()
  const model =
    provider === 'openai'
      ? (process.env.OPENAI_MODEL ?? 'gpt-4o-mini')
      : (process.env.GEMINI_MODEL ?? 'gemini-3.5-flash')
  return { provider, model }
}

/**
 * Records an AI call for cost/usage visibility. Tracking only — no limit is
 * enforced. Logging failures never break the AI workflow.
 */
export async function recordAiRun(input: AiRunInput): Promise<void> {
  const estimatedCostUsd = ESTIMATED_COST_PER_CALL[input.operation] ?? 0.001
  logInfo('ai.run', { ...input, estimatedCostUsd })
  try {
    await db.collection('aiRuns').add({
      ...input,
      estimatedCostUsd,
      createdAt: FieldValue.serverTimestamp(),
    })
  } catch (error) {
    logWarn('aiRuns.write.failed', {
      error: error instanceof Error ? error.message : String(error),
    })
  }
}

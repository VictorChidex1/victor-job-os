import {
  Timestamp,
  type Firestore,
} from 'firebase-admin/firestore'
import type {
  AutomationLogEntry,
  AutomationLogLevel,
  AutomationProviderId,
} from './types.js'

export const DEFAULT_AUTOMATION_LOG_LIMIT = 200

export interface AutomationLogContext {
  userId: string
  applicationId: string
  runId: string
  sessionId?: string
  provider: AutomationProviderId
}

export interface MergedAutomationLog {
  entries: AutomationLogEntry[]
  truncated: boolean
}

function parseLogEntries(value: unknown): AutomationLogEntry[] {
  if (!Array.isArray(value)) return []
  return value.flatMap((entry) => {
    if (!entry || typeof entry !== 'object') return []
    const record = entry as Record<string, unknown>
    if (
      typeof record.step !== 'string' ||
      typeof record.message !== 'string' ||
      typeof record.createdAt !== 'string'
    ) {
      return []
    }
    const level: AutomationLogLevel =
      record.level === 'warn' || record.level === 'error' ? record.level : 'info'
    return [
      {
        sequence:
          typeof record.sequence === 'number' && Number.isFinite(record.sequence)
            ? record.sequence
            : 0,
        level,
        step: record.step,
        message: record.message,
        ...(typeof record.detail === 'string' ? { detail: record.detail } : {}),
        createdAt: record.createdAt,
      },
    ]
  })
}

function chronological(a: AutomationLogEntry, b: AutomationLogEntry): number {
  const byTime = a.createdAt.localeCompare(b.createdAt)
  return byTime !== 0 ? byTime : a.sequence - b.sequence
}

/**
 * Merge existing and new execution entries while keeping the document bounded.
 *
 * Warnings and errors are preserved first when the cap is exceeded. The most
 * recent informational entries fill the remaining slots.
 */
export function mergeAutomationLogEntries(
  existing: unknown,
  incoming: AutomationLogEntry[],
  limit = DEFAULT_AUTOMATION_LOG_LIMIT,
): MergedAutomationLog {
  const all = [...parseLogEntries(existing), ...incoming].sort(chronological)
  if (all.length <= limit) {
    return {
      entries: all.map((entry, index) => ({ ...entry, sequence: index + 1 })),
      truncated: false,
    }
  }

  const important = all.filter((entry) => entry.level !== 'info')
  const info = all.filter((entry) => entry.level === 'info')
  const keptImportant =
    important.length > limit ? important.slice(-limit) : important
  const infoSlots = Math.max(0, limit - keptImportant.length)
  const selected = [...keptImportant, ...info.slice(-infoSlots)].sort(
    chronological,
  )

  return {
    entries: selected.map((entry, index) => ({ ...entry, sequence: index + 1 })),
    truncated: true,
  }
}

export class RunLogCollector {
  private entries: AutomationLogEntry[] = []
  private sequence = 0

  constructor(
    private readonly db: Firestore,
    private readonly context: AutomationLogContext,
    private readonly limit = DEFAULT_AUTOMATION_LOG_LIMIT,
  ) {}

  info(step: string, message: string, detail?: string): void {
    this.log('info', step, message, detail)
  }

  warn(step: string, message: string, detail?: string): void {
    this.log('warn', step, message, detail)
  }

  error(step: string, message: string, detail?: string): void {
    this.log('error', step, message, detail)
  }

  log(
    level: AutomationLogLevel,
    step: string,
    message: string,
    detail?: string,
  ): void {
    this.entries.push({
      sequence: ++this.sequence,
      level,
      step,
      message: message.slice(0, 300),
      ...(detail ? { detail: detail.slice(0, 1000) } : {}),
      createdAt: new Date().toISOString(),
    })
  }

  async flush(): Promise<void> {
    if (this.entries.length === 0) return
    const incoming = this.entries
    const ref = this.db.collection('automationLogs').doc(this.context.runId)

    await this.db.runTransaction(async (transaction) => {
      const snapshot = await transaction.get(ref)
      const existing = snapshot.data() ?? {}
      const merged = mergeAutomationLogEntries(
        existing.entries,
        incoming,
        this.limit,
      )
      transaction.set(
        ref,
        {
          userId: this.context.userId,
          applicationId: this.context.applicationId,
          runId: this.context.runId,
          provider: this.context.provider,
          ...(this.context.sessionId
            ? { sessionId: this.context.sessionId }
            : {}),
          entries: merged.entries,
          truncated: merged.truncated,
          createdAt: existing.createdAt ?? Timestamp.now(),
          updatedAt: Timestamp.now(),
        },
        { merge: true },
      )
    })

    this.entries = []
  }
}

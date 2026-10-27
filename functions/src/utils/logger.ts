type Severity = 'INFO' | 'WARNING' | 'ERROR'

export type LogFields = Record<string, unknown>

const SECRET_KEY = /(key|token|secret|password|authorization)/i

function sanitize(value: unknown, depth = 0): unknown {
  if (depth > 4) {
    return '[depth-limit]'
  }
  if (Array.isArray(value)) {
    return value.map((item) => sanitize(item, depth + 1))
  }
  if (value !== null && typeof value === 'object') {
    const result: Record<string, unknown> = {}
    for (const [key, fieldValue] of Object.entries(value as Record<string, unknown>)) {
      result[key] = SECRET_KEY.test(key) ? '[redacted]' : sanitize(fieldValue, depth + 1)
    }
    return result
  }
  return value
}

function serializeError(error: unknown): Record<string, unknown> {
  if (error instanceof Error) {
    return { name: error.name, message: error.message, stack: error.stack }
  }
  return { message: String(error) }
}

function write(severity: Severity, event: string, fields: LogFields, error?: unknown): void {
  const entry = {
    severity,
    message: event,
    event,
    timestamp: new Date().toISOString(),
    ...(sanitize(fields) as Record<string, unknown>),
    ...(error !== undefined ? { error: serializeError(error) } : {}),
  }
  const line = JSON.stringify(entry)
  if (severity === 'ERROR') {
    console.error(line)
  } else if (severity === 'WARNING') {
    console.warn(line)
  } else {
    console.log(line)
  }
}

export function logInfo(event: string, fields: LogFields = {}): void {
  write('INFO', event, fields)
}

export function logWarn(event: string, fields: LogFields = {}): void {
  write('WARNING', event, fields)
}

/**
 * Logs an error with its stack. Cloud Error Reporting picks up structured
 * `severity: ERROR` console output automatically.
 */
export function logError(event: string, error: unknown, fields: LogFields = {}): void {
  write('ERROR', event, fields, error)
}

/** Run a task and log its duration and outcome. */
export async function withTiming<T>(
  event: string,
  fields: LogFields,
  task: () => Promise<T>,
): Promise<T> {
  const startedAt = Date.now()
  try {
    const result = await task()
    logInfo(`${event}.completed`, { ...fields, durationMs: Date.now() - startedAt })
    return result
  } catch (error) {
    logError(`${event}.failed`, error, { ...fields, durationMs: Date.now() - startedAt })
    throw error
  }
}

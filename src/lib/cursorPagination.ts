export interface CursorValue {
  /** Numeric sort value used for display and legacy tokens. */
  value: number
  id: string
  /** How the underlying Firestore field is stored. */
  kind?: 'timestamp' | 'string'
  /** Original string value for legacy string-typed fields. */
  stringValue?: string
}

export type CursorStack = CursorValue[]

const MAX_STACK_LENGTH = 100

function encodeBase64Url(value: string): string {
  if (typeof btoa === 'function') {
    const bytes = new TextEncoder().encode(value)
    let binary = ''
    for (const byte of bytes) {
      binary += String.fromCharCode(byte)
    }
    return btoa(binary)
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/g, '')
  }
  return ''
}

function decodeBase64Url(value: string): string {
  if (typeof atob !== 'function') return ''
  const padded = value.replace(/-/g, '+').replace(/_/g, '/')
  const padding = padded.length % 4 === 0 ? '' : '='.repeat(4 - (padded.length % 4))
  const binary = atob(padded + padding)
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0))
  return new TextDecoder().decode(bytes)
}

export function cursorFromFieldValue(
  value: unknown,
  id: string,
): CursorValue | null {
  if (value && typeof value === 'object' && 'toMillis' in value) {
    const candidate = value as { toMillis?: () => number }
    if (typeof candidate.toMillis === 'function') {
      const millis = candidate.toMillis()
      if (Number.isFinite(millis) && millis > 0) {
        return { value: millis, id, kind: 'timestamp' }
      }
    }
  }
  if (typeof value === 'string') {
    const millis = Date.parse(value)
    if (Number.isFinite(millis) && millis > 0) {
      return { value: millis, id, kind: 'string', stringValue: value }
    }
  }
  if (typeof value === 'number' && Number.isFinite(value) && value > 0) {
    return { value, id, kind: 'timestamp' }
  }
  return null
}

export function encodeCursorStack(stack: CursorStack): string {
  if (stack.length === 0) return ''
  try {
    return encodeBase64Url(JSON.stringify(stack.slice(0, MAX_STACK_LENGTH)))
  } catch {
    return ''
  }
}

export function decodeCursorStack(value: string | null | undefined): CursorStack {
  if (!value) return []
  try {
    const parsed = JSON.parse(decodeBase64Url(value)) as unknown
    if (!Array.isArray(parsed)) return []
    const stack: CursorStack = []
    for (const entry of parsed) {
      if (
        entry &&
        typeof entry === 'object' &&
        typeof (entry as CursorValue).value === 'number' &&
        Number.isFinite((entry as CursorValue).value) &&
        (entry as CursorValue).value > 0 &&
        typeof (entry as CursorValue).id === 'string' &&
        (entry as CursorValue).id.length > 0
      ) {
        const cursor: CursorValue = {
          value: (entry as CursorValue).value,
          id: (entry as CursorValue).id,
        }
        if (
          (entry as CursorValue).kind === 'string' &&
          typeof (entry as CursorValue).stringValue === 'string' &&
          (entry as CursorValue).stringValue
        ) {
          cursor.kind = 'string'
          cursor.stringValue = (entry as CursorValue).stringValue
        } else if ((entry as CursorValue).kind === 'timestamp') {
          cursor.kind = 'timestamp'
        }
        stack.push(cursor)
      }
    }
    return stack.slice(0, MAX_STACK_LENGTH)
  } catch {
    return []
  }
}

export function appendCursor(
  stack: CursorStack,
  cursor: CursorValue | null,
): CursorStack {
  if (!cursor) return stack
  return [...stack, cursor].slice(0, MAX_STACK_LENGTH)
}

export function popCursor(stack: CursorStack): CursorStack {
  return stack.slice(0, -1)
}

export function currentPage(stack: CursorStack): number {
  return stack.length + 1
}

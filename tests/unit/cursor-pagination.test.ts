import { describe, expect, it } from 'vitest'
import {
  appendCursor,
  currentPage,
  decodeCursorStack,
  encodeCursorStack,
  popCursor,
  type CursorStack,
} from '@/lib/cursorPagination'

const stack: CursorStack = [
  { value: 1793912345678, id: 'doc-1' },
  { value: 1793911111111, id: 'doc-2' },
]

describe('cursor pagination', () => {
  it('round-trips a cursor stack through the URL token', () => {
    const encoded = encodeCursorStack(stack)

    expect(encoded).not.toContain('+')
    expect(encoded).not.toContain('/')
    expect(encoded).not.toContain('=')
    expect(decodeCursorStack(encoded)).toEqual(stack)
  })

  it('returns an empty stack for missing or malformed tokens', () => {
    expect(decodeCursorStack(null)).toEqual([])
    expect(decodeCursorStack('')).toEqual([])
    expect(decodeCursorStack('not-a-token')).toEqual([])
  })

  it('filters invalid cursor entries', () => {
    const encoded = encodeCursorStack([
      { value: 1, id: 'ok' },
      { value: 'bad', id: 'bad' } as never,
      { value: 2, id: '' },
    ])

    expect(decodeCursorStack(encoded)).toEqual([{ value: 1, id: 'ok' }])
  })

  it('appends and pops pagination cursors', () => {
    const next = appendCursor(stack, { value: 3, id: 'doc-3' })

    expect(next).toHaveLength(3)
    expect(currentPage(next)).toBe(4)
    expect(popCursor(next)).toEqual(stack)
    expect(currentPage(stack)).toBe(3)
  })
})

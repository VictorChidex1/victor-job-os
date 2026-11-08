import { describe, expect, it } from 'vitest'
import {
  appendCursor,
  currentPage,
  cursorFromFieldValue,
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
      { value: 0, id: 'zero' },
      { value: 2, id: '' },
    ])

    expect(decodeCursorStack(encoded)).toEqual([{ value: 1, id: 'ok' }])
  })

  it('preserves string cursor metadata through the URL token', () => {
    const stringStack: CursorStack = [
      {
        value: Date.parse('2026-11-08T01:17:28.904Z'),
        id: 'legacy-doc',
        kind: 'string',
        stringValue: '2026-11-08T01:17:28.904Z',
      },
    ]

    expect(decodeCursorStack(encodeCursorStack(stringStack))).toEqual(stringStack)
  })

  it('builds typed cursors from Timestamp-like and string values', () => {
    expect(
      cursorFromFieldValue('2026-11-08T01:17:28.904Z', 'doc-1'),
    ).toMatchObject({
      id: 'doc-1',
      kind: 'string',
      stringValue: '2026-11-08T01:17:28.904Z',
    })
    expect(
      cursorFromFieldValue({ toMillis: () => 1794100648904 }, 'doc-2'),
    ).toEqual({
      value: 1794100648904,
      id: 'doc-2',
      kind: 'timestamp',
    })
    expect(cursorFromFieldValue('bad', 'doc-3')).toBeNull()
  })

  it('appends and pops pagination cursors', () => {
    const next = appendCursor(stack, { value: 3, id: 'doc-3' })

    expect(next).toHaveLength(3)
    expect(currentPage(next)).toBe(4)
    expect(popCursor(next)).toEqual(stack)
    expect(currentPage(stack)).toBe(3)
  })
})

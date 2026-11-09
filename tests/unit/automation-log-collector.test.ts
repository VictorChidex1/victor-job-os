import { describe, expect, it } from 'vitest'
import { mergeAutomationLogEntries } from '../../functions/src/automation/logCollector'
import type { AutomationLogEntry } from '../../functions/src/automation/types'

function entry(
  sequence: number,
  level: AutomationLogEntry['level'],
  createdAt: string,
  message: string,
): AutomationLogEntry {
  return {
    sequence,
    level,
    step: 'test',
    message,
    createdAt,
  }
}

describe('automation execution log merging', () => {
  it('orders entries chronologically and renumbers them', () => {
    const merged = mergeAutomationLogEntries(
      [entry(2, 'info', '2026-01-01T10:00:02.000Z', 'second')],
      [entry(1, 'info', '2026-01-01T10:00:01.000Z', 'first')],
    )

    expect(merged.truncated).toBe(false)
    expect(merged.entries.map((item) => item.message)).toEqual(['first', 'second'])
    expect(merged.entries.map((item) => item.sequence)).toEqual([1, 2])
  })

  it('keeps warnings and errors when the cap is exceeded', () => {
    const entries = Array.from({ length: 8 }, (_, index) =>
      entry(
        index + 1,
        index === 1 ? 'error' : index === 2 ? 'warn' : 'info',
        `2026-01-01T10:00:0${index}.000Z`,
        `entry-${index}`,
      ),
    )

    const merged = mergeAutomationLogEntries([], entries, 4)

    expect(merged.truncated).toBe(true)
    expect(merged.entries).toHaveLength(4)
    expect(merged.entries.some((item) => item.level === 'error')).toBe(true)
    expect(merged.entries.some((item) => item.level === 'warn')).toBe(true)
    expect(merged.entries.map((item) => item.message)).toContain('entry-7')
    expect(merged.entries.map((item) => item.sequence)).toEqual([1, 2, 3, 4])
  })

  it('ignores malformed stored entries', () => {
    const merged = mergeAutomationLogEntries(
      [{ bad: true }, entry(1, 'info', '2026-01-01T10:00:00.000Z', 'valid')],
      [],
    )

    expect(merged.entries).toHaveLength(1)
    expect(merged.entries[0].message).toBe('valid')
  })
})

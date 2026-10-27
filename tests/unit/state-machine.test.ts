import { describe, expect, it } from 'vitest'
import {
  ACTION_STATUS,
  ALLOWED_TRANSITIONS,
  isAllowedTransition,
} from '../../functions/lib/outreach/stateMachine.js'

describe('outreach state machine', () => {
  it('allows the normal happy path', () => {
    expect(isAllowedTransition('needs-review', 'approved')).toBe(true)
    expect(isAllowedTransition('approved', 'sent')).toBe(true)
    expect(isAllowedTransition('sent', 'replied')).toBe(true)
    expect(isAllowedTransition('replied', 'closed')).toBe(true)
  })

  it('blocks skipping review', () => {
    expect(isAllowedTransition('draft', 'sent')).toBe(false)
    expect(isAllowedTransition('needs-review', 'sent')).toBe(false)
  })

  it('blocks any transition out of closed', () => {
    expect(ALLOWED_TRANSITIONS.closed).toEqual([])
    expect(isAllowedTransition('closed', 'approved')).toBe(false)
    expect(isAllowedTransition('closed', 'sent')).toBe(false)
  })

  it('maps every action to a status', () => {
    expect(ACTION_STATUS.approve).toBe('approved')
    expect(ACTION_STATUS.reject).toBe('closed')
    expect(ACTION_STATUS.archive).toBe('closed')
    expect(ACTION_STATUS.schedule).toBe('scheduled')
    expect(ACTION_STATUS['mark-sent']).toBe('sent')
    expect(ACTION_STATUS['record-reply']).toBe('replied')
  })

  it('allows every action from at least one status', () => {
    for (const target of Object.values(ACTION_STATUS)) {
      const reachable = Object.values(ALLOWED_TRANSITIONS).some((allowed) =>
        allowed.includes(target),
      )
      expect(reachable).toBe(true)
    }
  })
})

import { describe, expect, it } from 'vitest'
import {
  isAllowedHost,
  validateAutomationUrl,
} from '../../functions/src/automation/domainPolicy'

describe('automation domain policy', () => {
  it('accepts public https application URLs', () => {
    const decision = validateAutomationUrl('https://jobs.lever.co/acme/123/apply')
    expect(decision.ok).toBe(true)
    expect(decision.host).toBe('jobs.lever.co')
  })

  it('rejects unsafe protocols, credentials, and private hosts', () => {
    expect(validateAutomationUrl('file:///etc/passwd').ok).toBe(false)
    expect(validateAutomationUrl('http://localhost:3000/apply').ok).toBe(false)
    expect(validateAutomationUrl('http://127.0.0.1/apply').ok).toBe(false)
    expect(validateAutomationUrl('http://10.0.0.8/apply').ok).toBe(false)
    expect(validateAutomationUrl('https://user:pass@example.com/apply').ok).toBe(false)
    expect(validateAutomationUrl('https://192.168.1.10/apply').ok).toBe(false)
  })

  it('allows exact and subdomain matches only', () => {
    expect(isAllowedHost('jobs.lever.co', ['lever.co'])).toBe(true)
    expect(isAllowedHost('evil-lever.co', ['lever.co'])).toBe(false)
  })
})

import { describe, expect, it } from 'vitest'
import { normalizeResumeUrl } from '@/lib/resume'

describe('resume URL normalization', () => {
  it('keeps valid http and https URLs', () => {
    expect(normalizeResumeUrl('https://example.com/resume.pdf')).toBe(
      'https://example.com/resume.pdf',
    )
    expect(normalizeResumeUrl('http://example.com/resume.pdf')).toBe(
      'http://example.com/resume.pdf',
    )
  })

  it('adds https when the protocol is missing', () => {
    expect(normalizeResumeUrl('example.com/resume.pdf')).toBe(
      'https://example.com/resume.pdf',
    )
  })

  it('trims whitespace', () => {
    expect(normalizeResumeUrl('  https://example.com/resume.pdf  ')).toBe(
      'https://example.com/resume.pdf',
    )
  })

  it('treats an empty value as empty', () => {
    expect(normalizeResumeUrl('')).toBe('')
    expect(normalizeResumeUrl('   ')).toBe('')
    expect(normalizeResumeUrl(undefined)).toBe('')
  })

  it('rejects non-web schemes and invalid values', () => {
    expect(normalizeResumeUrl('mailto:resume@example.com')).toBeNull()
    expect(normalizeResumeUrl('ftp://example.com/resume.pdf')).toBeNull()
    expect(normalizeResumeUrl('not a url')).toBeNull()
  })
})

/**
 * Normalizes a resume URL before saving it to a profile or application.
 *
 * Users commonly paste `example.com/resume.pdf`, so add a scheme when one is
 * missing. Returns null for values that cannot be a web URL.
 */
export function normalizeResumeUrl(value: string | undefined | null): string | null {
  const trimmed = (value ?? '').trim()
  if (!trimmed) {
    return ''
  }

  // Do not turn another scheme (mailto:, ftp:, etc.) into a fake https URL.
  if (/^[a-z][a-z0-9+.-]*:/i.test(trimmed) && !/^https?:/i.test(trimmed)) {
    return null
  }

  const candidate = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`

  try {
    const url = new URL(candidate)
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      return null
    }
    return url.toString()
  } catch {
    return null
  }
}

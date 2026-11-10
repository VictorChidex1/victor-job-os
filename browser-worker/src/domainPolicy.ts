const PRIVATE_HOST_PATTERNS = [
  /^localhost$/i,
  /^127\./,
  /^10\./,
  /^192\.168\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^169\.254\./,
  /^\[?::1\]?$/,
  /\.local$/i,
  /\.internal$/i,
]

export interface AutomationUrlDecision {
  ok: boolean
  url?: string
  host?: string
  reason?: string
}

export function validateAutomationUrl(value: string): AutomationUrlDecision {
  let url: URL
  try {
    url = new URL(value)
  } catch {
    return { ok: false, reason: 'Application URL is invalid.' }
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    return { ok: false, reason: 'Only http and https application URLs are allowed.' }
  }
  if (url.username || url.password) {
    return { ok: false, reason: 'Application URLs with embedded credentials are not allowed.' }
  }
  if (!url.hostname) {
    return { ok: false, reason: 'Application URL has no hostname.' }
  }
  if (PRIVATE_HOST_PATTERNS.some((pattern) => pattern.test(url.hostname))) {
    return { ok: false, reason: 'Local, private, or internal hosts are not allowed.' }
  }
  if (/^\d+\.\d+\.\d+\.\d+$/.test(url.hostname)) {
    return { ok: false, reason: 'Direct IP application URLs are not allowed.' }
  }

  return { ok: true, url: url.toString(), host: url.hostname.toLowerCase() }
}

export function isAllowedHost(hostname: string, allowedDomains: string[]): boolean {
  const host = hostname.toLowerCase()
  return allowedDomains.some(
    (domain) => host === domain || host.endsWith(`.${domain}`),
  )
}

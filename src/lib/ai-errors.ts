interface CallableErrorLike {
  message?: string
  code?: string
  details?: unknown
}

function errorText(error: unknown): string {
  const parts: string[] = []
  if (error instanceof Error) {
    parts.push(error.message)
  }
  if (error && typeof error === 'object') {
    const candidate = error as CallableErrorLike
    if (candidate.code) parts.push(candidate.code)
    if (candidate.details) {
      parts.push(
        typeof candidate.details === 'string' ? candidate.details : JSON.stringify(candidate.details),
      )
    }
  }
  return parts.join(' ')
}

/** Map AI/provider failures to a clear, actionable message for the UI. */
export function aiErrorMessage(error: unknown, fallback: string): string {
  const text = errorText(error)
  if (/quota|resource.?exhausted|429/i.test(text)) {
    return 'AI quota reached. Try again later or switch models.'
  }
  if (/api.?key|not configured|unauthenticated/i.test(text)) {
    return 'The AI API key is missing or invalid.'
  }
  if (/503|unavailable|high demand|overloaded/i.test(text)) {
    return 'The AI model is temporarily busy. Try again in a moment.'
  }
  if (/404|no longer available/i.test(text)) {
    return 'The configured AI model is unavailable. Switch models in functions/.env.'
  }
  return fallback
}

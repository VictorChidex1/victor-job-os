import { HttpsError } from 'firebase-functions/v2/https'

/**
 * Translate low-level AI/provider failures into callable errors with clear,
 * user-facing messages (quota, key, transient outage).
 */
export function toHttpsError(error: unknown, fallback: string): HttpsError {
  if (error instanceof HttpsError) {
    return error
  }
  const message = error instanceof Error ? error.message : fallback

  if (/quota|resource.?exhausted|429/i.test(message)) {
    return new HttpsError(
      'resource-exhausted',
      'AI quota reached. Try again later or switch models.',
    )
  }
  if (/api.?key|not configured|unauthenticated/i.test(message)) {
    return new HttpsError('failed-precondition', 'The AI API key is missing or invalid.')
  }
  if (/503|unavailable|high demand|overloaded/i.test(message)) {
    return new HttpsError('unavailable', 'The AI model is temporarily busy. Try again in a moment.')
  }
  if (/404|no longer available/i.test(message)) {
    return new HttpsError(
      'failed-precondition',
      'The configured AI model is unavailable. Switch models in functions/.env.',
    )
  }
  return new HttpsError('internal', message || fallback)
}

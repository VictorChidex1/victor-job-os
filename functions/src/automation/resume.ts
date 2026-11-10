import { validateAutomationUrl } from './domainPolicy.js'
import type { AutomationResumeFile } from './types.js'

const MAX_RESUME_BYTES = 10 * 1024 * 1024
const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/octet-stream',
])

function fileNameFromUrl(value: string): string {
  try {
    const url = new URL(value)
    const candidate = decodeURIComponent(
      url.pathname.split('/').filter(Boolean).pop() ?? '',
    )
    if (/\.(pdf|doc|docx)$/i.test(candidate)) return candidate
  } catch {
    // Fall back to the default name.
  }
  return 'resume.pdf'
}

function mimeTypeFor(fileName: string, contentType: string): string {
  const normalized = contentType.split(';')[0]?.trim().toLowerCase() ?? ''
  if (ALLOWED_MIME_TYPES.has(normalized)) {
    return normalized === 'application/octet-stream'
      ? mimeTypeForExtension(fileName)
      : normalized
  }
  return mimeTypeForExtension(fileName)
}

function mimeTypeForExtension(fileName: string): string {
  if (/\.docx$/i.test(fileName)) {
    return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  }
  if (/\.doc$/i.test(fileName)) {
    return 'application/msword'
  }
  return 'application/pdf'
}

export async function downloadApprovedResume(
  resumeUrl: string,
): Promise<AutomationResumeFile> {
  const decision = validateAutomationUrl(resumeUrl)
  if (!decision.ok || !decision.url) {
    throw new Error(decision.reason ?? 'The approved resume URL is not safe.')
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 20_000)
  try {
    const response = await fetch(decision.url, {
      signal: controller.signal,
      redirect: 'error',
    })
    if (!response.ok) {
      throw new Error(`Resume download returned HTTP ${response.status}.`)
    }
    const finalUrl = validateAutomationUrl(response.url)
    if (!finalUrl.ok) {
      throw new Error(
        finalUrl.reason ?? 'The resume redirect target is not safe.',
      )
    }

    const contentLength = Number(response.headers.get('content-length') ?? 0)
    if (contentLength > MAX_RESUME_BYTES) {
      throw new Error('The resume exceeds the 10 MB submission limit.')
    }

    const buffer = Buffer.from(await response.arrayBuffer())
    if (buffer.length === 0) {
      throw new Error('The resume download was empty.')
    }
    if (buffer.length > MAX_RESUME_BYTES) {
      throw new Error('The resume exceeds the 10 MB submission limit.')
    }

    const contentType = response.headers.get('content-type') ?? ''
    const normalizedType = contentType.split(';')[0]?.trim().toLowerCase() ?? ''
    if (
      normalizedType &&
      normalizedType !== 'application/octet-stream' &&
      !ALLOWED_MIME_TYPES.has(normalizedType)
    ) {
      throw new Error('The resume URL did not return a supported document type.')
    }

    const fileName = fileNameFromUrl(decision.url)
    return {
      buffer,
      fileName,
      mimeType: mimeTypeFor(fileName, contentType),
    }
  } finally {
    clearTimeout(timeout)
  }
}

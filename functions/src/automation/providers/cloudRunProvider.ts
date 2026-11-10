import { GoogleAuth, type IdTokenClient } from 'google-auth-library'
import type {
  ApplicationInspection,
  ApprovedFieldValue,
  AutomationFieldDescriptor,
  AutomationProviderId,
  AutomationResumeFile,
  AutomationScreenshot,
  AutomationSessionHandle,
  AutomationSessionInput,
  AutomationSubmissionResult,
  BrowserAutomationProvider,
  FieldPopulationResult,
} from '../types.js'

interface WorkerScreenshot {
  base64: string
  contentType: 'image/webp'
  size: number
  width?: number
  height?: number
  pageUrl?: string
  pageTitle?: string
}

let clientPromise: Promise<IdTokenClient> | null = null

function workerBaseUrl(): string {
  const value = (process.env.BROWSER_WORKER_URL ?? '').trim().replace(/\/+$/, '')
  if (!value) {
    throw new Error('BROWSER_WORKER_URL is not configured.')
  }
  return value
}

async function authClient(): Promise<IdTokenClient> {
  if (!clientPromise) {
    clientPromise = new GoogleAuth().getIdTokenClient(workerBaseUrl())
  }
  return clientPromise
}

async function request<T>(
  path: string,
  method: 'GET' | 'POST' | 'DELETE',
  body?: unknown,
): Promise<T> {
  const url = `${workerBaseUrl()}${path}`
  const client = await authClient()
  const headers = await client.getRequestHeaders(url)
  headers.set('content-type', 'application/json')
  const response = await fetch(url, {
    method,
    headers,
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  })
  const text = await response.text()
  if (!response.ok) {
    throw new Error(
      `Browser worker returned HTTP ${response.status}: ${text.slice(0, 500)}`,
    )
  }
  return (text ? JSON.parse(text) : {}) as T
}

export class CloudRunBrowserAutomationProvider
  implements BrowserAutomationProvider
{
  id = 'cloud-run' as const satisfies AutomationProviderId
  capabilities = new Set(['inspect', 'fill', 'screenshot', 'submit'] as const)

  async createSession(
    input: AutomationSessionInput,
  ): Promise<AutomationSessionHandle> {
    const response = await request<{ sessionId: string }>(
      '/v1/sessions',
      'POST',
      input,
    )
    return {
      providerSessionId: response.sessionId,
      close: async () => {
        await request(`/v1/sessions/${encodeURIComponent(response.sessionId)}`, 'DELETE').catch(
          () => undefined,
        )
      },
    }
  }

  async inspectApplication(
    handle: AutomationSessionHandle,
    _input: AutomationSessionInput,
  ): Promise<ApplicationInspection> {
    const response = await request<{ inspection: ApplicationInspection }>(
      `/v1/sessions/${encodeURIComponent(handle.providerSessionId)}/inspect`,
      'POST',
      {},
    )
    return response.inspection
  }

  async populateApprovedFields(
    handle: AutomationSessionHandle,
    _input: AutomationSessionInput,
    approvedFields: ApprovedFieldValue[],
    fields: AutomationFieldDescriptor[],
  ): Promise<FieldPopulationResult[]> {
    const response = await request<{ results: FieldPopulationResult[] }>(
      `/v1/sessions/${encodeURIComponent(handle.providerSessionId)}/populate`,
      'POST',
      { approvedFields, fields },
    )
    return response.results
  }

  async uploadResume(
    handle: AutomationSessionHandle,
    file: AutomationResumeFile | null,
  ): Promise<FieldPopulationResult[]> {
    const response = await request<{ results: FieldPopulationResult[] }>(
      `/v1/sessions/${encodeURIComponent(handle.providerSessionId)}/upload-resume`,
      'POST',
      {
        file: file
          ? {
              base64: file.buffer.toString('base64'),
              fileName: file.fileName,
              mimeType: file.mimeType,
            }
          : null,
      },
    )
    return response.results
  }

  async submitApplication(
    handle: AutomationSessionHandle,
  ): Promise<AutomationSubmissionResult> {
    const response = await request<{ result: AutomationSubmissionResult }>(
      `/v1/sessions/${encodeURIComponent(handle.providerSessionId)}/submit`,
      'POST',
      {},
    )
    return response.result
  }

  async captureScreenshot(
    handle: AutomationSessionHandle,
  ): Promise<AutomationScreenshot | null> {
    try {
      const response = await request<{ screenshot: WorkerScreenshot }>(
        `/v1/sessions/${encodeURIComponent(handle.providerSessionId)}/screenshot`,
        'GET',
      )
      return {
        buffer: Buffer.from(response.screenshot.base64, 'base64'),
        contentType: 'image/webp',
        size: response.screenshot.size,
        ...(response.screenshot.width
          ? { width: response.screenshot.width }
          : {}),
        ...(response.screenshot.height
          ? { height: response.screenshot.height }
          : {}),
        ...(response.screenshot.pageUrl
          ? { pageUrl: response.screenshot.pageUrl }
          : {}),
        ...(response.screenshot.pageTitle
          ? { pageTitle: response.screenshot.pageTitle }
          : {}),
      }
    } catch (error) {
      if (error instanceof Error && error.message.includes('HTTP 404')) {
        return null
      }
      throw error
    }
  }

  async closeSession(handle: AutomationSessionHandle): Promise<void> {
    await request(
      `/v1/sessions/${encodeURIComponent(handle.providerSessionId)}`,
      'DELETE',
    ).catch(() => undefined)
  }
}

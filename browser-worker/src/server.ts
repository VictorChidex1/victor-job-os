import { createServer, type IncomingMessage, type ServerResponse } from 'node:http'
import { PlaywrightBrowserAutomationProvider } from './providers/playwrightProvider.js'
import type {
  ApprovedFieldValue,
  AutomationFieldDescriptor,
  AutomationResumeFile,
  AutomationSessionHandle,
  AutomationSessionInput,
} from './types.js'

const PORT = Number(process.env.PORT ?? 8080)
const MAX_BODY_BYTES = 20 * 1024 * 1024
const SESSION_TTL_MS = 10 * 60 * 1000
const MAX_RESUME_BYTES = 10 * 1024 * 1024

interface ActiveSession {
  handle: AutomationSessionHandle
  input: AutomationSessionInput
  createdAt: number
}

const provider = new PlaywrightBrowserAutomationProvider()
const sessions = new Map<string, ActiveSession>()

function sendJson(response: ServerResponse, status: number, body: unknown) {
  const payload = JSON.stringify(body)
  response.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'content-length': Buffer.byteLength(payload),
    'cache-control': 'no-store',
  })
  response.end(payload)
}

function readJson(request: IncomingMessage): Promise<Record<string, unknown>> {
  return new Promise((resolve, reject) => {
    let size = 0
    const chunks: Buffer[] = []
    request.on('data', (chunk: Buffer) => {
      size += chunk.length
      if (size > MAX_BODY_BYTES) {
        reject(new Error('Request body is too large.'))
        request.destroy()
        return
      }
      chunks.push(chunk)
    })
    request.on('end', () => {
      try {
        const parsed = JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}')
        if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
          reject(new Error('Request body must be a JSON object.'))
          return
        }
        resolve(parsed as Record<string, unknown>)
      } catch {
        reject(new Error('Request body is not valid JSON.'))
      }
    })
    request.on('error', reject)
  })
}

function pathParts(url: string): string[] {
  try {
    return new URL(url, 'http://worker.local').pathname.split('/').filter(Boolean)
  } catch {
    return []
  }
}

function getSession(id: string): ActiveSession | null {
  const session = sessions.get(id)
  if (!session) return null
  if (Date.now() - session.createdAt > SESSION_TTL_MS) {
    void provider.closeSession(session.handle).catch(() => undefined)
    sessions.delete(id)
    return null
  }
  return session
}

async function handle(request: IncomingMessage, response: ServerResponse) {
  const method = request.method ?? 'GET'
  const parts = pathParts(request.url ?? '/')

  if (method === 'GET' && parts.length === 1 && parts[0] === 'healthz') {
    sendJson(response, 200, { ok: true, sessions: sessions.size })
    return
  }

  if (method === 'POST' && parts.length === 2 && parts[0] === 'v1' && parts[1] === 'sessions') {
    const body = await readJson(request)
    const userId = String(body.userId ?? '').trim()
    const applicationId = String(body.applicationId ?? '').trim()
    const applicationUrl = String(body.applicationUrl ?? '').trim()
    const allowedDomains = Array.isArray(body.allowedDomains)
      ? body.allowedDomains.filter((value): value is string => typeof value === 'string')
      : []
    if (!userId || !applicationId || !applicationUrl || allowedDomains.length === 0) {
      sendJson(response, 400, { error: 'Missing session fields.' })
      return
    }

    const handle = await provider.createSession({
      userId,
      applicationId,
      applicationUrl,
      allowedDomains,
    })
    sessions.set(handle.providerSessionId, {
      handle,
      input: { userId, applicationId, applicationUrl, allowedDomains },
      createdAt: Date.now(),
    })
    sendJson(response, 201, { sessionId: handle.providerSessionId })
    return
  }

  if (parts[0] !== 'v1' || parts[1] !== 'sessions' || parts.length < 3) {
    sendJson(response, 404, { error: 'Not found.' })
    return
  }

  const sessionId = decodeURIComponent(parts[2])
  const action = parts[3] ?? ''
  const session = getSession(sessionId)
  if (!session) {
    sendJson(response, 404, { error: 'Session not found or expired.' })
    return
  }

  if (method === 'DELETE' && parts.length === 3) {
    sessions.delete(sessionId)
    await provider.closeSession(session.handle).catch(() => undefined)
    sendJson(response, 200, { ok: true })
    return
  }

  if (parts.length !== 4) {
    sendJson(response, 404, { error: 'Not found.' })
    return
  }

  if (method === 'POST' && action === 'inspect' && parts.length === 4) {
    const inspection = await provider.inspectApplication(session.handle, session.input)
    sendJson(response, 200, { inspection })
    return
  }

  if (method === 'POST' && action === 'populate' && parts.length === 4) {
    const body = await readJson(request)
    const approvedFields = Array.isArray(body.approvedFields)
      ? (body.approvedFields as ApprovedFieldValue[])
      : []
    const fields = Array.isArray(body.fields)
      ? (body.fields as AutomationFieldDescriptor[])
      : []
    const results = await provider.populateApprovedFields(
      session.handle,
      session.input,
      approvedFields,
      fields,
    )
    sendJson(response, 200, { results })
    return
  }

  if (method === 'POST' && action === 'upload-resume' && parts.length === 4) {
    const body = await readJson(request)
    const file = body.file
    let resume: AutomationResumeFile | null = null
    if (file && typeof file === 'object') {
      const record = file as Record<string, unknown>
      if (
        typeof record.base64 === 'string' &&
        typeof record.fileName === 'string' &&
        typeof record.mimeType === 'string'
      ) {
        const buffer = Buffer.from(record.base64, 'base64')
        if (buffer.length > MAX_RESUME_BYTES) {
          sendJson(response, 400, { error: 'Resume exceeds the 10 MB limit.' })
          return
        }
        resume = {
          buffer,
          fileName: record.fileName,
          mimeType: record.mimeType,
        }
      }
    }
    const results = await provider.uploadResume(session.handle, resume)
    sendJson(response, 200, { results })
    return
  }

  if (method === 'POST' && action === 'submit' && parts.length === 4) {
    const result = await provider.submitApplication(session.handle)
    sendJson(response, 200, { result })
    return
  }

  if (method === 'GET' && action === 'screenshot' && parts.length === 4) {
    const screenshot = await provider.captureScreenshot(session.handle)
    if (!screenshot) {
      sendJson(response, 404, { error: 'No screenshot available.' })
      return
    }
    sendJson(response, 200, {
      screenshot: {
        base64: screenshot.buffer.toString('base64'),
        contentType: screenshot.contentType,
        size: screenshot.size,
        ...(screenshot.width ? { width: screenshot.width } : {}),
        ...(screenshot.height ? { height: screenshot.height } : {}),
        ...(screenshot.pageUrl ? { pageUrl: screenshot.pageUrl } : {}),
        ...(screenshot.pageTitle ? { pageTitle: screenshot.pageTitle } : {}),
      },
    })
    return
  }

  sendJson(response, 404, { error: 'Not found.' })
}

const server = createServer((request, response) => {
  handle(request, response).catch((error) => {
    const message =
      error instanceof Error ? error.message : 'Unexpected worker error.'
    if (!response.headersSent) {
      sendJson(response, 500, { error: message.slice(0, 1000) })
    } else {
      response.end()
    }
  })
})

const cleanup = setInterval(() => {
  const now = Date.now()
  for (const [id, session] of sessions) {
    if (now - session.createdAt > SESSION_TTL_MS) {
      sessions.delete(id)
      void provider.closeSession(session.handle).catch(() => undefined)
    }
  }
}, 60_000)
cleanup.unref?.()

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Browser worker listening on ${PORT}`)
})

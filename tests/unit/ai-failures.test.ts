import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

process.env.GEMINI_API_KEY = 'test-key'
process.env.GEMINI_MODEL = 'primary-model'
process.env.GEMINI_FALLBACK_MODEL = 'fallback-model'

const jobInput = {
  job: {
    title: 'React Engineer',
    remote: true,
    skills: ['React'],
    description: 'Build React apps.',
  },
  profile: {
    headline: 'Fullstack Engineer',
    summary: 'React developer',
    skills: ['React'],
    technologies: ['React'],
    preferredRoles: ['Fullstack'],
    remotePreference: true,
    experienceLevel: 'Senior',
  },
}

function geminiSuccess(overrides: Record<string, unknown> = {}): Response {
  const payload = {
    fitScore: 80,
    technicalFit: 'strong',
    experienceFit: 'strong',
    remoteFit: 'strong',
    roleType: 'frontend',
    stackMatch: ['React'],
    matchedSkills: ['React'],
    missingSkills: [],
    concerns: [],
    recommendation: 'pursue',
    summary: 'Strong match.',
    ...overrides,
  }
  return new Response(
    JSON.stringify({ candidates: [{ content: { parts: [{ text: JSON.stringify(payload) }] } }] }),
    { status: 200, headers: { 'Content-Type': 'application/json' } },
  )
}

function rawText(text: string, status = 200): Response {
  return new Response(
    JSON.stringify({ candidates: [{ content: { parts: [{ text }] } }] }),
    { status, headers: { 'Content-Type': 'application/json' } },
  )
}

function errorResponse(status: number): Response {
  return new Response(JSON.stringify({ error: { message: 'provider error' } }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

async function loadProvider() {
  vi.resetModules()
  return import('../../functions/lib/ai/geminiProvider.js')
}

describe('Gemini failure handling', () => {
  beforeEach(() => {
    process.env.GEMINI_API_KEY = 'test-key'
    process.env.GEMINI_MODEL = 'primary-model'
    process.env.GEMINI_FALLBACK_MODEL = 'fallback-model'
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('retries a 503 and eventually succeeds', async () => {
    let calls = 0
    vi.stubGlobal('fetch', async (url: string) => {
      calls += 1
      if (String(url).includes('primary-model') && calls < 3) {
        return errorResponse(503)
      }
      return geminiSuccess()
    })

    const { geminiProvider } = await loadProvider()
    const result = await geminiProvider.analyzeJob(jobInput)
    expect(result.fitScore).toBe(80)
    expect(calls).toBe(3)
  }, 20_000)

  it('falls back to the fallback model on 429 (quota)', async () => {
    let usedFallback = false
    vi.stubGlobal('fetch', async (url: string) => {
      if (String(url).includes('primary-model')) {
        return errorResponse(429)
      }
      usedFallback = true
      return geminiSuccess()
    })

    const { geminiProvider } = await loadProvider()
    const result = await geminiProvider.analyzeJob(jobInput)
    expect(result.fitScore).toBe(80)
    expect(usedFallback).toBe(true)
  })

  it('falls back to the fallback model on 404 (retired model)', async () => {
    let usedFallback = false
    vi.stubGlobal('fetch', async (url: string) => {
      if (String(url).includes('primary-model')) {
        return errorResponse(404)
      }
      usedFallback = true
      return geminiSuccess()
    })

    const { geminiProvider } = await loadProvider()
    const result = await geminiProvider.analyzeJob(jobInput)
    expect(result.fitScore).toBe(80)
    expect(usedFallback).toBe(true)
  })

  it('throws on 401 without retrying', async () => {
    let calls = 0
    vi.stubGlobal('fetch', async () => {
      calls += 1
      return errorResponse(401)
    })

    const { geminiProvider } = await loadProvider()
    await expect(geminiProvider.analyzeJob(jobInput)).rejects.toThrow(/401/)
    expect(calls).toBe(1)
  })

  it('throws on invalid JSON', async () => {
    vi.stubGlobal('fetch', async () => rawText('this is not json'))
    const { geminiProvider } = await loadProvider()
    await expect(geminiProvider.analyzeJob(jobInput)).rejects.toThrow(/invalid JSON/i)
  })

  it('throws on an empty response', async () => {
    vi.stubGlobal('fetch', async () => rawText(''))
    const { geminiProvider } = await loadProvider()
    await expect(geminiProvider.analyzeJob(jobInput)).rejects.toThrow(/empty response/i)
  })

  it('sanitizes out-of-range / invalid fields', async () => {
    vi.stubGlobal('fetch', async () =>
      geminiSuccess({ fitScore: 500, technicalFit: 'amazing', recommendation: 'definitely' }),
    )
    const { geminiProvider } = await loadProvider()
    const result = await geminiProvider.analyzeJob(jobInput)
    expect(result.fitScore).toBe(100)
    expect(result.technicalFit).toBe('moderate')
    expect(result.recommendation).toBe('maybe')
  })

  it('throws a clear error when the OpenAI key is missing', async () => {
    process.env.AI_PROVIDER = 'openai'
    delete process.env.OPENAI_API_KEY
    vi.resetModules()
    const { getAIService } = await import('../../functions/lib/ai/index.js')
    const service = getAIService()
    await expect(service.analyzeJob(jobInput as never)).rejects.toThrow(/OPENAI_API_KEY/)
    process.env.AI_PROVIDER = 'gemini'
  })
})

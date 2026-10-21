import type {
  AIService,
  CompanyResearchInput,
  CompanyResearchOutput,
  JobAnalysisInput,
  JobAnalysisOutput,
  PitchInput,
  PitchOutput,
  PortfolioMatchInput,
  PortfolioMatchOutput,
} from './types.js'
import {
  buildAnalyzeJobPrompt,
  buildCompanyPrompt,
  buildPitchPrompt,
  buildPortfolioPrompt,
  mapAnalysis,
  mapCompany,
  mapPitch,
  mapPortfolio,
} from './prompts.js'

const GEMINI_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models'
const PRIMARY_MODEL = 'gemini-3.8-flash'
const FALLBACK_MODEL = 'gemini-3.1-flash-lite'

function apiKey(): string {
  const key = process.env.GEMINI_API_KEY
  if (!key || key === 'YOUR_GEMINI_API_KEY_HERE') {
    throw new Error('GEMINI_API_KEY is not configured. Add it to functions/.env')
  }
  return key
}

interface GeminiResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: string }>
    }
  }>
}

async function generateStructured<T>(prompt: string): Promise<T> {
  const key = apiKey()
  const attempts: Array<{ model: string; retries: number }> = [
    { model: PRIMARY_MODEL, retries: 2 },
    { model: FALLBACK_MODEL, retries: 1 },
  ]

  for (const { model, retries } of attempts) {
    for (let attempt = 0; attempt <= retries; attempt++) {
      const response = await fetch(`${GEMINI_ENDPOINT}/${model}:generateContent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': key,
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: 'application/json', temperature: 0.2 },
        }),
      })

      if (response.ok) {
        const data = (await response.json()) as GeminiResponse
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text
        if (!text) {
          throw new Error('Gemini returned an empty response.')
        }
        try {
          return JSON.parse(text) as T
        } catch {
          throw new Error('Gemini returned invalid JSON.')
        }
      }

      if (response.status === 503 && attempt < retries) {
        await new Promise((resolve) => setTimeout(resolve, 1000))
        continue
      }

      if (response.status === 503 && model !== FALLBACK_MODEL) {
        break
      }

      const body = await response.text()
      throw new Error(`Gemini request failed (${response.status}): ${body.slice(0, 200)}`)
    }
  }

  throw new Error('Gemini request failed: all models unavailable.')
}

export const geminiProvider: AIService = {
  async analyzeJob(input: JobAnalysisInput): Promise<JobAnalysisOutput> {
    const raw = await generateStructured<Partial<JobAnalysisOutput>>(buildAnalyzeJobPrompt(input))
    return mapAnalysis(raw)
  },

  async researchCompany(input: CompanyResearchInput): Promise<CompanyResearchOutput> {
    const raw = await generateStructured<Partial<CompanyResearchOutput>>(buildCompanyPrompt(input))
    return mapCompany(raw)
  },

  async matchPortfolio(input: PortfolioMatchInput): Promise<PortfolioMatchOutput> {
    const raw = await generateStructured<Partial<PortfolioMatchOutput>>(buildPortfolioPrompt(input))
    return mapPortfolio(raw, input)
  },

  async generatePitch(input: PitchInput): Promise<PitchOutput> {
    const raw = await generateStructured<Partial<PitchOutput>>(buildPitchPrompt(input))
    return mapPitch(raw)
  },
}

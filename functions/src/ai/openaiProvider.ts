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

const OPENAI_ENDPOINT = 'https://api.openai.com/v1/chat/completions'
const DEFAULT_MODEL = 'gpt-4o-mini'

function apiKey(): string {
  const key = process.env.OPENAI_API_KEY
  if (!key) {
    throw new Error('OPENAI_API_KEY is not configured. Add it to functions/.env')
  }
  return key
}

interface OpenAIResponse {
  choices?: Array<{ message?: { content?: string } }>
}

async function generateStructured<T>(prompt: string): Promise<T> {
  const key = apiKey()
  const model = process.env.OPENAI_MODEL ?? DEFAULT_MODEL

  for (let attempt = 0; attempt <= 2; attempt++) {
    const response = await fetch(OPENAI_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model,
        temperature: 0.2,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: 'You reply with strict JSON only.' },
          { role: 'user', content: prompt },
        ],
      }),
    })

    if (response.ok) {
      const data = (await response.json()) as OpenAIResponse
      const text = data.choices?.[0]?.message?.content
      if (!text) {
        throw new Error('OpenAI returned an empty response.')
      }
      try {
        return JSON.parse(text) as T
      } catch {
        throw new Error('OpenAI returned invalid JSON.')
      }
    }

    if (response.status >= 500 && attempt < 2) {
      await new Promise((resolve) => setTimeout(resolve, 1000))
      continue
    }

    const body = await response.text()
    throw new Error(`OpenAI request failed (${response.status}): ${body.slice(0, 200)}`)
  }

  throw new Error('OpenAI request failed: service unavailable.')
}

export const openaiProvider: AIService = {
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

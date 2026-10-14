import type { AIService } from './types.js'
import { geminiProvider } from './geminiProvider.js'
import { openaiProvider } from './openaiProvider.js'

/**
 * Select the AI provider. Defaults to Gemini; set AI_PROVIDER=openai (with
 * OPENAI_API_KEY in functions/.env) to switch. Both providers implement the
 * same AIService interface.
 */
export function getAIService(): AIService {
  const provider = (process.env.AI_PROVIDER ?? 'gemini').toLowerCase()
  switch (provider) {
    case 'gemini':
      return geminiProvider
    case 'openai':
      return openaiProvider
    default:
      throw new Error(`Unknown AI_PROVIDER "${provider}". Use "gemini" or "openai".`)
  }
}

export type { AIService } from './types.js'
export type {
  FitLevel,
  Recommendation,
  JobAnalysisInput,
  JobAnalysisOutput,
  CompanyResearchInput,
  CompanyResearchOutput,
  PortfolioMatchInput,
  PortfolioMatchOutput,
} from './types.js'

import type { AIService } from './types.js'
import { geminiProvider } from './geminiProvider.js'

export function getAIService(): AIService {
  const provider = process.env.AI_PROVIDER ?? 'gemini'
  if (provider === 'openai') {
    throw new Error('OpenAI provider is not implemented yet. Use GEMINI_API_KEY.')
  }
  return geminiProvider
}

export type { AIService } from './types.js'
export type {
  JobAnalysisInput,
  JobAnalysisOutput,
  CompanyResearchInput,
  CompanyResearchOutput,
  PortfolioMatchInput,
  PortfolioMatchOutput,
} from './types.js'
import type {
  AIService,
  CompanyResearchInput,
  CompanyResearchOutput,
  JobAnalysisInput,
  JobAnalysisOutput,
  PortfolioMatchInput,
  PortfolioMatchOutput,
} from './types.js'

const GEMINI_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models'

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

const PRIMARY_MODEL = 'gemini-3.8-flash'
const FALLBACK_MODEL = 'gemini-3.1-flash-lite'

export const geminiProvider: AIService = {
  async analyzeJob(input: JobAnalysisInput): Promise<JobAnalysisOutput> {
    const prompt = `You are a technical recruiter evaluating a job for a candidate.

JOB
Title: ${input.job.title}
Location: ${input.job.location ?? 'Unknown'} (remote: ${input.job.remote})
Skills mentioned: ${input.job.skills.join(', ') || 'none listed'}
Description:
${input.job.description.slice(0, 6000)}

CANDIDATE PROFILE
Headline: ${input.profile.headline}
Experience level: ${input.profile.experienceLevel ?? 'Unknown'}
Skills: ${input.profile.skills.join(', ')}
Technologies: ${input.profile.technologies.join(', ')}
Preferred roles: ${input.profile.preferredRoles.join(', ')}
Remote preference: ${input.profile.remotePreference ? 'yes' : 'no'}
Summary: ${input.profile.summary.slice(0, 1500)}

Return STRICT JSON only:
{
  "fitScore": number (0-100),
  "technicalFit": "strong" | "moderate" | "weak",
  "experienceFit": "strong" | "moderate" | "weak",
  "stackMatch": string[] (overlapping technologies),
  "matchedSkills": string[] (candidate skills the job needs),
  "missingSkills": string[] (job requirements the candidate lacks),
  "concerns": string[] (risks/mismatches, empty if none),
  "summary": string (2-3 sentence evidence-based evaluation)
}
Do not fabricate candidate facts. Base everything only on the provided profile.`

    const result = await generateStructured<JobAnalysisOutput>(prompt)
    return {
      fitScore: clamp(result.fitScore, 0, 100),
      technicalFit: sanitizeFit(result.technicalFit),
      experienceFit: sanitizeFit(result.experienceFit),
      stackMatch: result.stackMatch ?? [],
      matchedSkills: result.matchedSkills ?? [],
      missingSkills: result.missingSkills ?? [],
      concerns: result.concerns ?? [],
      summary: result.summary ?? '',
    }
  },

  async researchCompany(input: CompanyResearchInput): Promise<CompanyResearchOutput> {
    const prompt = `Research the company "${input.companyName}" for a job search.

Return STRICT JSON only:
{
  "industry": string or null,
  "description": string (2-3 sentence neutral description),
  "website": string or null,
  "researchSummary": string (what this company does and relevant context for a developer job),
  "sourceUrls": string[]
}
Only include facts you are confident about. If unknown, use null or empty arrays. Do not invent revenue, funding, or team size.`

    const result = await generateStructured<CompanyResearchOutput>(prompt)
    return {
      industry: result.industry,
      description: result.description,
      website: result.website,
      researchSummary: result.researchSummary,
      sourceUrls: result.sourceUrls ?? [],
    }
  },

  async matchPortfolio(input: PortfolioMatchInput): Promise<PortfolioMatchOutput> {
    const prompt = `Match verified portfolio projects to a job opportunity.

JOB
Title: ${input.job.title}
Skills: ${input.job.skills.join(', ')}
Description:
${input.job.description.slice(0, 3000)}

AVAILABLE PROJECTS
${input.projects.map((p) => `- ${p.title} (${p.technologies.join(', ')}): ${p.summary.slice(0, 300)}`).join('\n')}

Return STRICT JSON only:
{
  "projectIds": string[] (only genuinely relevant projects, at most 3),
  "reasons": { "<projectId>": "short reason tying the project to this job" }
}
Use only the provided projects. If none are relevant, return empty arrays.`

    const result = await generateStructured<PortfolioMatchOutput>(prompt)
    const validIds = new Set(input.projects.map((p) => p.id))
    const projectIds = (result.projectIds ?? []).filter((id) => validIds.has(id)).slice(0, 3)
    const reasons: Record<string, string> = {}
    for (const id of projectIds) {
      reasons[id] = result.reasons?.[id] ?? ''
    }
    return { projectIds, reasons }
  },
}

function clamp(value: unknown, min: number, max: number): number {
  const number = Number(value)
  if (Number.isNaN(number)) return 0
  return Math.min(max, Math.max(min, number))
}

function sanitizeFit(value: unknown): 'strong' | 'moderate' | 'weak' {
  return value === 'strong' || value === 'moderate' || value === 'weak' ? value : 'moderate'
}
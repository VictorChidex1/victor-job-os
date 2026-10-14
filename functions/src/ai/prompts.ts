import type {
  CompanyResearchInput,
  CompanyResearchOutput,
  FitLevel,
  JobAnalysisInput,
  JobAnalysisOutput,
  PortfolioMatchInput,
  PortfolioMatchOutput,
  Recommendation,
} from './types.js'

export function buildAnalyzeJobPrompt(input: JobAnalysisInput): string {
  return `You are a technical recruiter evaluating a job for a candidate.

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
  "remoteFit": "strong" | "moderate" | "weak",
  "roleType": string (role classification, e.g. "frontend", "backend", "fullstack", "mobile", "devops", "data"),
  "stackMatch": string[] (overlapping technologies),
  "matchedSkills": string[] (candidate skills the job needs),
  "missingSkills": string[] (job requirements the candidate lacks),
  "concerns": string[] (risks/mismatches, empty if none),
  "recommendation": "pursue" | "maybe" | "skip",
  "summary": string (2-3 sentence evidence-based evaluation)
}
Do not fabricate candidate facts. Base everything only on the provided profile.`
}

export function buildCompanyPrompt(input: CompanyResearchInput): string {
  return `Research the company "${input.companyName}" for a job search.

Return STRICT JSON only:
{
  "industry": string or null,
  "description": string (2-3 sentence neutral description),
  "website": string or null,
  "product": string or null (main product(s) or service(s) the company offers),
  "roleContext": string or null (how a developer role would fit into this company's work),
  "hiringSignals": string[] (public signals about hiring, growth, funding, or team changes; empty if unknown),
  "researchSummary": string (what this company does and relevant context for a developer job),
  "sourceUrls": string[]
}
Only include facts you are confident about. If unknown, use null or empty arrays. Do not invent revenue, funding, or team size.`
}

export function buildPortfolioPrompt(input: PortfolioMatchInput): string {
  const projects = input.projects
    .map((p) => {
      const lines = [
        `- ${p.id}: ${p.title} (${p.technologies.join(', ')})`,
        `  Summary: ${p.summary.slice(0, 300)}`,
      ]
      if (p.problem) lines.push(`  Problem: ${p.problem.slice(0, 200)}`)
      if (p.solution) lines.push(`  Solution: ${p.solution.slice(0, 200)}`)
      if (p.outcomes?.length) lines.push(`  Outcomes: ${p.outcomes.join('; ').slice(0, 200)}`)
      if (p.verifiedMetrics?.length) lines.push(`  Verified metrics: ${p.verifiedMetrics.join('; ').slice(0, 200)}`)
      if (p.relevanceTags?.length) lines.push(`  Tags: ${p.relevanceTags.join(', ')}`)
      if (p.url) lines.push(`  URL: ${p.url}`)
      return lines.join('\n')
    })
    .join('\n')

  return `Match verified portfolio projects to a job opportunity.

JOB
Title: ${input.job.title}
Skills: ${input.job.skills.join(', ')}
Description:
${input.job.description.slice(0, 3000)}

AVAILABLE PROJECTS
${projects}

Return STRICT JSON only:
{
  "projectIds": string[] (only genuinely relevant projects, at most 3),
  "reasons": { "<projectId>": "short reason tying the project to this job" }
}
Use only the provided projects. Prefer projects with matching technologies, outcomes, and verified metrics. If none are relevant, return empty arrays.`
}

export function clamp(value: unknown, min: number, max: number): number {
  const number = Number(value)
  if (Number.isNaN(number)) return 0
  return Math.min(max, Math.max(min, number))
}

export function sanitizeFit(value: unknown): FitLevel {
  return value === 'strong' || value === 'moderate' || value === 'weak' ? value : 'moderate'
}

function sanitizeRecommendation(value: unknown): Recommendation {
  return value === 'pursue' || value === 'maybe' || value === 'skip' ? value : 'maybe'
}

export function mapAnalysis(raw: Partial<JobAnalysisOutput>): JobAnalysisOutput {
  return {
    fitScore: clamp(raw.fitScore, 0, 100),
    technicalFit: sanitizeFit(raw.technicalFit),
    experienceFit: sanitizeFit(raw.experienceFit),
    remoteFit: sanitizeFit(raw.remoteFit),
    roleType: typeof raw.roleType === 'string' && raw.roleType.trim() ? raw.roleType.trim() : 'unspecified',
    stackMatch: raw.stackMatch ?? [],
    matchedSkills: raw.matchedSkills ?? [],
    missingSkills: raw.missingSkills ?? [],
    concerns: raw.concerns ?? [],
    recommendation: sanitizeRecommendation(raw.recommendation),
    summary: raw.summary ?? '',
  }
}

export function mapCompany(raw: Partial<CompanyResearchOutput>): CompanyResearchOutput {
  return {
    industry: raw.industry,
    description: raw.description,
    website: raw.website,
    product: raw.product,
    roleContext: raw.roleContext,
    hiringSignals: raw.hiringSignals ?? [],
    researchSummary: raw.researchSummary,
    sourceUrls: raw.sourceUrls ?? [],
  }
}

export function mapPortfolio(
  raw: Partial<PortfolioMatchOutput>,
  input: PortfolioMatchInput,
): PortfolioMatchOutput {
  const validIds = new Set(input.projects.map((p) => p.id))
  const projectIds = (raw.projectIds ?? []).filter((id) => validIds.has(id)).slice(0, 3)
  const reasons: Record<string, string> = {}
  for (const id of projectIds) {
    reasons[id] = raw.reasons?.[id] ?? ''
  }
  return { projectIds, reasons }
}

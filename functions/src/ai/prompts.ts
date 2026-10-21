import type {
  CompanyResearchInput,
  CompanyResearchOutput,
  FitLevel,
  JobAnalysisInput,
  JobAnalysisOutput,
  PitchInput,
  PitchOutput,
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

export function buildPitchPrompt(input: PitchInput): string {
  const contactName = input.contact?.name?.trim() || 'Hiring Manager'
  const projects = input.projects.length
    ? input.projects
        .map((p) => {
          const lines = [
            `- ${p.title} (${p.technologies.join(', ')})`,
            `  Summary: ${p.summary.slice(0, 240)}`,
          ]
          if (p.outcomes?.length) lines.push(`  Outcomes: ${p.outcomes.join('; ').slice(0, 240)}`)
          if (p.verifiedMetrics?.length) {
            lines.push(`  Verified metrics: ${p.verifiedMetrics.join('; ').slice(0, 240)}`)
          }
          if (p.url) lines.push(`  Link: ${p.url}`)
          return lines.join('\n')
        })
        .join('\n')
    : '- No verified projects provided. Do not cite any project or metric.'

  const company = input.company
    ? `Company: ${input.company.name}
Industry: ${input.company.industry ?? 'Unknown'}
What they do: ${input.company.description ?? input.company.researchSummary ?? 'Unknown'}
Product/service: ${input.company.product ?? 'Unknown'}
Role context: ${input.company.roleContext ?? 'Unknown'}
Hiring signals: ${input.company.hiringSignals.join('; ') || 'none provided'}`
    : 'Company research: not provided. Do not invent company facts.'

  const analysis = input.analysis
    ? `Role classification: ${input.analysis.roleType ?? 'unknown'}
Fit score: ${input.analysis.fitScore ?? 'n/a'}
Matched skills: ${input.analysis.matchedSkills.join(', ') || 'none'}
Gaps: ${input.analysis.missingSkills.join(', ') || 'none'}
Assessment summary: ${input.analysis.summary ?? 'n/a'}`
    : 'Job analysis: not provided.'

  return `You are an expert cold email strategist writing a one-to-one outreach email for a developer reaching out about a specific role and company.

CONTEXT
Recipient name: ${contactName}
Recipient role: ${input.contact?.role ?? 'Unknown'}
Job title: ${input.job.title}
Location: ${input.job.location ?? 'Unknown'}
Job description:
${input.job.description.slice(0, 4000)}

${company}

${analysis}

CANDIDATE (use only verified facts below)
Headline: ${input.profile.headline}
Experience: ${input.profile.experienceLevel ?? 'Unknown'}
Skills: ${input.profile.skills.join(', ')}
Technologies: ${input.profile.technologies.join(', ')}
Summary: ${input.profile.summary.slice(0, 1200)}

VERIFIED PROOF (only use these; never invent projects or metrics)
${projects}

WRITING REQUIREMENTS
- Start the body with "Dear ${contactName},".
- Write 4-6 paragraphs, 220-500 words. Concise but substantive; every sentence must earn its place. No filler.
- Paragraph 1: a specific, evidence-based observation about the company/role, the deeper problem behind it, and the concrete consequence.
- Paragraph 2: transition naturally with "This is where I come in." Explain the candidate's relevant expertise as ownership, with 1-2 verified proof points (project + outcome/metric).
- Paragraph 3: how working together would look — what the candidate owns, what the recipient gets, what they stop managing.
- Final paragraph: one low-friction, contextual CTA (a simple question), not a demand.
- Lead with the recipient, not the candidate. Do not open with "My name is", "I am a", "I hope this email finds you well", or "I came across".
- Sell business outcomes and ownership, not a list of skills or a resume.
- No generic praise, no fake personalization, no invented facts, no unsupported claims or metrics.
- Do not mention that this email was generated by AI.
- Subject: short, specific, and non-clickbait (max ~70 characters).

Return STRICT JSON only:
{
  "subject": string,
  "body": string (the full email including "Dear ${contactName}," and a sign-off "Best,\\nVictor")
}`
}

export function mapPitch(raw: Partial<PitchOutput>): PitchOutput {
  return {
    subject: (raw.subject ?? '').trim(),
    body: (raw.body ?? '').trim(),
  }
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

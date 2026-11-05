import type {
  ApplicationAnswersInput,
  ApplicationAnswersOutput,
  CompanyResearchInput,
  CompanyResearchOutput,
  CoverLetterInput,
  CoverLetterOutput,
  FitLevel,
  JobAnalysisInput,
  JobAnalysisOutput,
  PitchInput,
  PitchOutput,
  PortfolioMatchInput,
  PortfolioMatchOutput,
  Recommendation,
} from './types.js'
import { stripHtml } from '../utils/html.js'

export function buildAnalyzeJobPrompt(input: JobAnalysisInput): string {
  const title = stripHtml(input.job.title ?? '')
  const location = input.job.location ? stripHtml(input.job.location) : 'Unknown'
  const description = stripHtml(input.job.description ?? '')

  return `You are a technical recruiter evaluating a job for a candidate.

JOB
Title: ${title}
Location: ${location} (remote: ${input.job.remote})
Skills mentioned: ${input.job.skills.join(', ') || 'none listed'}
Description:
${description.slice(0, 6000)}

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
  const companyName = stripHtml(input.companyName ?? '')

  return `Research the company "${companyName}" for a job search.

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
  const title = stripHtml(input.job.title ?? '')
  const description = stripHtml(input.job.description ?? '')
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
Title: ${title}
Skills: ${input.job.skills.join(', ')}
Description:
${description.slice(0, 3000)}

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
  const jobTitle = stripHtml(input.job.title ?? '')
  const jobLocation = input.job.location ? stripHtml(input.job.location) : 'Unknown'
  const jobDescription = stripHtml(input.job.description ?? '')
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
    ? `Company: ${stripHtml(input.company.name ?? '')}
Industry: ${input.company.industry ? stripHtml(input.company.industry) : 'Unknown'}
What they do: ${stripHtml(input.company.description ?? input.company.researchSummary ?? 'Unknown')}
Product/service: ${input.company.product ? stripHtml(input.company.product) : 'Unknown'}
Role context: ${input.company.roleContext ? stripHtml(input.company.roleContext) : 'Unknown'}
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
Job title: ${jobTitle}
Location: ${jobLocation}
Job description:
${jobDescription.slice(0, 4000)}

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

export function buildCoverLetterPrompt(input: CoverLetterInput): string {
  const title = stripHtml(input.job.title ?? '')
  const location = input.job.location ? stripHtml(input.job.location) : 'Unknown'
  const description = stripHtml(input.job.description ?? '')
  const fullName = input.profile.fullName?.trim() || 'Victor'

  const company = input.company
    ? `Company: ${stripHtml(input.company.name ?? '')}
Industry: ${input.company.industry ? stripHtml(input.company.industry) : 'Unknown'}
What they do: ${stripHtml(input.company.description ?? input.company.researchSummary ?? 'Unknown')}
Product/service: ${input.company.product ? stripHtml(input.company.product) : 'Unknown'}
Role context: ${input.company.roleContext ? stripHtml(input.company.roleContext) : 'Unknown'}
Hiring signals: ${input.company.hiringSignals.join('; ') || 'none provided'}`
    : 'Company research: not provided. Do not invent company facts.'

  const analysis = input.analysis
    ? `Fit score: ${input.analysis.fitScore ?? 'n/a'}
Role classification: ${input.analysis.roleType ?? 'unknown'}
Matched skills: ${input.analysis.matchedSkills.join(', ') || 'none'}
Gaps: ${input.analysis.missingSkills.join(', ') || 'none'}
Assessment summary: ${input.analysis.summary ?? 'n/a'}`
    : 'Job analysis: not provided.'

  const projects = input.projects.length
    ? input.projects
        .map((project) => {
          const lines = [
            `- ${project.title} (${project.technologies.join(', ')})`,
            `  Summary: ${project.summary.slice(0, 280)}`,
          ]
          if (project.outcomes?.length) {
            lines.push(`  Outcomes: ${project.outcomes.join('; ').slice(0, 240)}`)
          }
          if (project.verifiedMetrics?.length) {
            lines.push(
              `  Verified metrics: ${project.verifiedMetrics.join('; ').slice(0, 240)}`,
            )
          }
          if (project.url) lines.push(`  Link: ${project.url}`)
          return lines.join('\n')
        })
        .join('\n')
    : '- No verified projects provided. Do not cite any project or metric.'

  return `You are writing a tailored cover letter for a specific job application.

JOB
Title: ${title}
Location: ${location} (remote: ${input.job.remote})
Skills mentioned: ${input.job.skills.join(', ') || 'none listed'}
Description:
${description.slice(0, 6000)}

${company}

${analysis}

CANDIDATE (use only verified facts below)
Name: ${fullName}
Headline: ${input.profile.headline}
Experience level: ${input.profile.experienceLevel ?? 'Unknown'}
Skills: ${input.profile.skills.join(', ') || 'none provided'}
Technologies: ${input.profile.technologies.join(', ') || 'none provided'}
Preferred roles: ${input.profile.preferredRoles.join(', ') || 'none provided'}
Summary: ${input.profile.summary.slice(0, 1500)}

VERIFIED PROOF (only use these; never invent projects or metrics)
${projects}

WRITING REQUIREMENTS
- Write a complete cover letter of 250-400 words, in plain text.
- Address the specific company and role. Do not write a generic letter.
- Use a confident, direct, human voice. Avoid filler, generic praise, and clichés.
- Prove at least one relevant claim with a project, outcome, or verified metric from the provided evidence.
- Acknowledge a real gap only if it is provided in the analysis; never invent a weakness or a strength.
- Do not mention AI, prompts, or that this is generated.
- Do not use markdown, headings, bullet lists, or placeholders.
- End with a concise sign-off using "${fullName}".
- Do not invent company facts, team details, funding, revenue, or experience.

Return STRICT JSON only:
{
  "body": string (the full cover letter, ready to paste, including greeting and sign-off)
}`
}

export function mapCoverLetter(raw: Partial<CoverLetterOutput>): CoverLetterOutput {
  return {
    body: stripHtml(typeof raw.body === 'string' ? raw.body : '').trim(),
  }
}

export function buildApplicationAnswersPrompt(
  input: ApplicationAnswersInput,
): string {
  const title = stripHtml(input.job.title ?? '')
  const description = stripHtml(input.job.description ?? '')
  const fullName = input.profile.fullName?.trim() || 'Victor'

  const company = input.company
    ? `Company: ${stripHtml(input.company.name ?? '')}
What they do: ${stripHtml(input.company.description ?? input.company.researchSummary ?? 'Unknown')}
Product/service: ${input.company.product ? stripHtml(input.company.product) : 'Unknown'}
Role context: ${input.company.roleContext ? stripHtml(input.company.roleContext) : 'Unknown'}`
    : 'Company research: not provided. Do not invent company facts.'

  const analysis = input.analysis
    ? `Fit score: ${input.analysis.fitScore ?? 'n/a'}
Matched skills: ${input.analysis.matchedSkills.join(', ') || 'none'}
Gaps: ${input.analysis.missingSkills.join(', ') || 'none'}
Assessment summary: ${input.analysis.summary ?? 'n/a'}`
    : 'Job analysis: not provided.'

  const projects = input.projects.length
    ? input.projects
        .map((project) => {
          const lines = [
            `- ${project.title} (${project.technologies.join(', ')})`,
            `  Summary: ${project.summary.slice(0, 260)}`,
          ]
          if (project.outcomes?.length) {
            lines.push(`  Outcomes: ${project.outcomes.join('; ').slice(0, 220)}`)
          }
          if (project.verifiedMetrics?.length) {
            lines.push(
              `  Verified metrics: ${project.verifiedMetrics.join('; ').slice(0, 220)}`,
            )
          }
          if (project.url) lines.push(`  Link: ${project.url}`)
          return lines.join('\n')
        })
        .join('\n')
    : '- No verified projects provided. Do not cite any project or metric.'

  const questions = input.questions
    .map(
      (question, index) =>
        `${index + 1}. id=${question.id}\nQuestion: ${stripHtml(question.question)}`,
    )
    .join('\n')

  return `You are drafting answers to application questions for a specific job.

JOB
Title: ${title}
Description:
${description.slice(0, 5000)}

${company}

${analysis}

CANDIDATE (use only verified facts below)
Name: ${fullName}
Headline: ${input.profile.headline}
Experience level: ${input.profile.experienceLevel ?? 'Unknown'}
Skills: ${input.profile.skills.join(', ') || 'none provided'}
Technologies: ${input.profile.technologies.join(', ') || 'none provided'}
Summary: ${input.profile.summary.slice(0, 1200)}

VERIFIED PROOF (only use these; never invent projects or metrics)
${projects}

QUESTIONS
${questions}

WRITING REQUIREMENTS
- Answer every question exactly once, using its id.
- Each answer should be 80-180 words, plain text, and specific to this role.
- Use a confident, honest, human voice. Avoid filler and generic claims.
- Ground claims in the provided profile, projects, outcomes, or verified metrics.
- If the provided facts are insufficient, write an honest answer about what you can support and what you would clarify. Never invent experience.
- Do not mention AI, prompts, or that this is generated.
- Do not use markdown, headings, bullet lists, or placeholders.
- Return the same question text for each answer, without rewriting the question.

Return STRICT JSON only:
{
  "answers": [
    { "id": string, "question": string, "answer": string }
  ]
}`
}

export function mapApplicationAnswers(
  raw: Partial<ApplicationAnswersOutput>,
  input: ApplicationAnswersInput,
): ApplicationAnswersOutput {
  const byId = new Map<string, string>()
  for (const answer of raw.answers ?? []) {
    if (answer && typeof answer.id === 'string' && typeof answer.answer === 'string') {
      byId.set(answer.id, answer.answer)
    }
  }

  return {
    answers: input.questions.map((question) => ({
      id: question.id,
      question: stripHtml(question.question).trim(),
      answer: stripHtml(byId.get(question.id) ?? '').trim(),
    })),
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

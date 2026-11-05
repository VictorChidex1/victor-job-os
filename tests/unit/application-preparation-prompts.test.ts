import { describe, expect, it } from 'vitest'
import {
  buildApplicationAnswersPrompt,
  buildCoverLetterPrompt,
  mapApplicationAnswers,
  mapCoverLetter,
} from '../../functions/lib/ai/prompts.js'

const context = {
  job: {
    title: 'Senior React Engineer',
    description: 'Build reliable React systems.',
    location: 'Remote',
    remote: true,
    skills: ['React', 'TypeScript'],
  },
  analysis: {
    fitScore: 88,
    roleType: 'frontend',
    matchedSkills: ['React'],
    missingSkills: [],
    summary: 'Strong match.',
  },
  company: {
    name: 'Acme',
    description: 'A product company.',
    hiringSignals: [],
  },
  profile: {
    fullName: 'Victor',
    headline: 'Frontend engineer',
    summary: 'Builds React products.',
    skills: ['React'],
    technologies: ['TypeScript'],
    preferredRoles: ['Frontend Engineer'],
    experienceLevel: 'Senior',
  },
  projects: [
    {
      title: 'Job OS',
      summary: 'A career operating system.',
      technologies: ['React', 'Firebase'],
      outcomes: ['Reduced application prep time'],
      verifiedMetrics: ['50% faster'],
    },
  ],
}

describe('application preparation prompts', () => {
  it('builds a grounded cover letter prompt', () => {
    const prompt = buildCoverLetterPrompt(context)

    expect(prompt).toContain('Senior React Engineer')
    expect(prompt).toContain('Victor')
    expect(prompt).toContain('Job OS')
    expect(prompt).toContain('verified')
    expect(prompt).toContain('Do not invent')
  })

  it('trims mapped cover letter output', () => {
    expect(mapCoverLetter({ body: '  Dear team,\n\nHello.  ' })).toEqual({
      body: 'Dear team,\n\nHello.',
    })
  })

  it('builds answer prompts with every question id', () => {
    const prompt = buildApplicationAnswersPrompt({
      ...context,
      questions: [
        { id: 'q1', question: 'Why this role?' },
        { id: 'q2', question: 'Which project fits?' },
      ],
    })

    expect(prompt).toContain('id=q1')
    expect(prompt).toContain('id=q2')
    expect(prompt).toContain('Return STRICT JSON only')
  })

  it('maps answers in question order and marks missing answers empty', () => {
    const input = {
      ...context,
      questions: [
        { id: 'q1', question: 'Why this role?' },
        { id: 'q2', question: 'Which project fits?' },
      ],
    }

    const mapped = mapApplicationAnswers(
      {
        answers: [
          { id: 'q2', question: 'Which project fits?', answer: ' Job OS. ' },
        ],
      },
      input,
    )

    expect(mapped.answers).toEqual([
      { id: 'q1', question: 'Why this role?', answer: '' },
      { id: 'q2', question: 'Which project fits?', answer: 'Job OS.' },
    ])
  })
})

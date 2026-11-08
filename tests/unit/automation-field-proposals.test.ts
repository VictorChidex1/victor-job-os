import { describe, expect, it } from 'vitest'
import {
  buildFieldProposals,
  normalizeFieldLabel,
  validateApprovedFields,
} from '../../functions/src/automation/fieldProposals'
import type { AutomationFieldDescriptor } from '../../functions/src/automation/types'

function field(
  key: string,
  name: string,
  type: AutomationFieldDescriptor['type'] = 'text',
  extra: Partial<AutomationFieldDescriptor> = {},
): AutomationFieldDescriptor {
  return { key, name, type, ...extra }
}

describe('automation field proposals', () => {
  it('normalizes labels for matching', () => {
    expect(normalizeFieldLabel('  First Name* ')).toBe('first name')
    expect(normalizeFieldLabel('E-mail')).toBe('e mail')
  })

  it('proposes profile values without guessing missing information', () => {
    const proposals = buildFieldProposals({
      fields: [
        field('name', 'Full name'),
        field('first', 'First name'),
        field('last', 'Last name'),
        field('email', 'Email address'),
        field('portfolio', 'Portfolio URL'),
        field('phone', 'Phone number'),
        field('linkedin', 'LinkedIn profile'),
      ],
      profile: {
        fullName: 'Victor Chidera',
        email: 'victor@example.com',
        portfolioUrl: 'https://victorchidera.com',
      },
    })

    expect(proposals.find((entry) => entry.fieldKey === 'name')?.proposedValue).toBe(
      'Victor Chidera',
    )
    expect(proposals.find((entry) => entry.fieldKey === 'first')?.proposedValue).toBe(
      'Victor',
    )
    expect(proposals.find((entry) => entry.fieldKey === 'last')?.proposedValue).toBe(
      'Chidera',
    )
    expect(proposals.find((entry) => entry.fieldKey === 'email')?.proposedValue).toBe(
      'victor@example.com',
    )
    expect(
      proposals.find((entry) => entry.fieldKey === 'portfolio')?.proposedValue,
    ).toBe('https://victorchidera.com')

    expect(proposals.find((entry) => entry.fieldKey === 'phone')?.proposedValue).toBe(
      undefined,
    )
    expect(
      proposals.find((entry) => entry.fieldKey === 'phone')?.proposedSource,
    ).toBe('none')
    expect(
      proposals.find((entry) => entry.fieldKey === 'linkedin')?.proposedValue,
    ).toBe(undefined)
  })

  it('uses only approved preparation content', () => {
    const proposals = buildFieldProposals({
      fields: [
        field('cover', 'Cover letter', 'textarea'),
        field('why', 'Why do you want this role?', 'textarea'),
        field('challenge', 'Tell us about a challenge.', 'textarea'),
      ],
      preparation: {
        coverLetter: {
          body: 'Approved cover letter',
          status: 'approved',
        },
        answers: [
          {
            question: 'Why do you want this role?',
            answer: 'Approved answer',
            status: 'approved',
          },
          {
            question: 'Tell us about a challenge.',
            answer: 'Unapproved draft',
            status: 'needs-review',
          },
        ],
      },
    })

    expect(proposals.find((entry) => entry.fieldKey === 'cover')?.proposedValue).toBe(
      'Approved cover letter',
    )
    expect(proposals.find((entry) => entry.fieldKey === 'why')?.proposedValue).toBe(
      'Approved answer',
    )
    expect(
      proposals.find((entry) => entry.fieldKey === 'challenge')?.proposedValue,
    ).toBe(undefined)
  })

  it('marks file fields as manual and never auto-fills checkboxes', () => {
    const proposals = buildFieldProposals({
      fields: [
        field('resume', 'Resume', 'file'),
        field('terms', 'I agree to the terms', 'checkbox'),
        field('work', 'Work authorization', 'select', {
          options: ['Yes', 'No'],
        }),
      ],
      preparation: { resumeUrl: 'https://example.com/resume.pdf' },
    })

    const resume = proposals.find((entry) => entry.fieldKey === 'resume')
    expect(resume?.proposedValue).toBe('https://example.com/resume.pdf')
    expect(resume?.confidence).toBe('manual')

    const terms = proposals.find((entry) => entry.fieldKey === 'terms')
    expect(terms?.proposedValue).toBe(undefined)
    expect(terms?.proposedSource).toBe('none')

    const work = proposals.find((entry) => entry.fieldKey === 'work')
    expect(work?.proposedValue).toBe(undefined)
  })

  it('proposes a select option when the profile value matches a discovered option', () => {
    const proposals = buildFieldProposals({
      fields: [
        field('location', 'Preferred location', 'select', {
          options: ['Remote', 'Lagos', 'Abuja'],
        }),
      ],
      profile: { preferredLocations: ['Lagos'] },
    })

    expect(
      proposals.find((entry) => entry.fieldKey === 'location')?.proposedValue,
    ).toBe('Lagos')
  })
})

describe('approved field validation', () => {
  const fields: AutomationFieldDescriptor[] = [
    field('name', 'Full name', 'text'),
    field('location', 'Location', 'select', {
      options: ['Lagos', 'Abuja'],
    }),
    field('terms', 'I agree', 'checkbox', { inputType: 'checkbox' }),
    field('radio', 'Work arrangement', 'checkbox', { inputType: 'radio' }),
    field('resume', 'Resume', 'file'),
  ]

  it('accepts valid text, select, and checkbox values', () => {
    const result = validateApprovedFields(fields, [
      { fieldKey: 'name', value: '  Victor Chidera  ' },
      { fieldKey: 'location', value: 'lagos' },
      { fieldKey: 'terms', value: true },
    ])

    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.values).toEqual([
        { fieldKey: 'name', value: 'Victor Chidera' },
        { fieldKey: 'location', value: 'Lagos' },
        { fieldKey: 'terms', value: true },
      ])
    }
  })

  it('rejects unknown fields, duplicate keys, unsupported types, and radios', () => {
    expect(
      validateApprovedFields(fields, [{ fieldKey: 'missing', value: 'x' }]).ok,
    ).toBe(false)
    expect(
      validateApprovedFields(fields, [
        { fieldKey: 'name', value: 'Victor' },
        { fieldKey: 'name', value: 'Victor again' },
      ]).ok,
    ).toBe(false)
    expect(
      validateApprovedFields(fields, [{ fieldKey: 'resume', value: 'x' }]).ok,
    ).toBe(false)
    expect(
      validateApprovedFields(fields, [{ fieldKey: 'radio', value: true }]).ok,
    ).toBe(false)
  })

  it('rejects invalid selects and oversized text', () => {
    expect(
      validateApprovedFields(fields, [{ fieldKey: 'location', value: 'London' }]).ok,
    ).toBe(false)
    expect(
      validateApprovedFields(fields, [
        { fieldKey: 'name', value: 'x'.repeat(5001) },
      ]).ok,
    ).toBe(false)
  })
})

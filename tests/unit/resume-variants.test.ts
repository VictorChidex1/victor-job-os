import { describe, expect, it } from 'vitest'
import {
  cleanResumeVariantInput,
  formatCommaList,
  parseCommaList,
} from '@/lib/resumeVariants'

const base = {
  name: '  Full Stack  ',
  resumeUrl: 'example.com/full-stack.pdf',
  targetRoles: [' Software Engineer ', 'software engineer', ''],
  technologies: [' React ', 'react', 'TypeScript'],
  notes: '  Tailored for product teams.  ',
  isDefault: false,
}

describe('resume variant helpers', () => {
  it('normalizes names, URLs, lists, and notes', () => {
    const cleaned = cleanResumeVariantInput(base)

    expect(cleaned.name).toBe('Full Stack')
    expect(cleaned.resumeUrl).toBe('https://example.com/full-stack.pdf')
    expect(cleaned.targetRoles).toEqual(['Software Engineer'])
    expect(cleaned.technologies).toEqual(['React', 'TypeScript'])
    expect(cleaned.notes).toBe('Tailored for product teams.')
  })

  it('parses comma-separated lists', () => {
    expect(parseCommaList(' React, TypeScript, , Node.js ')).toEqual([
      'React',
      'TypeScript',
      'Node.js',
    ])
    expect(formatCommaList(['React', 'Node.js'])).toBe('React, Node.js')
  })

  it('rejects missing names and invalid URLs', () => {
    expect(() => cleanResumeVariantInput({ ...base, name: '   ' })).toThrow(
      'Variant name is required.',
    )
    expect(() =>
      cleanResumeVariantInput({ ...base, resumeUrl: 'mailto:me@example.com' }),
    ).toThrow('Enter a valid resume URL.')
  })
})

import { describe, expect, it } from 'vitest'
import { DOC_SECTION_LINKS, DOC_SECTIONS } from '@/features/docs/docs-content'

describe('documentation content', () => {
  it('has unique section ids', () => {
    const ids = DOC_SECTIONS.map((section) => section.id)

    expect(new Set(ids).size).toBe(ids.length)
  })

  it('keeps the table of contents in sync with the sections', () => {
    expect(DOC_SECTION_LINKS).toEqual(
      DOC_SECTIONS.map(({ id, label }) => ({ id, label })),
    )
  })
})

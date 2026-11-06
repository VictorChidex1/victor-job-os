import { describe, expect, it } from 'vitest'
import {
  buildSearchTokens,
  normalizeSearchText,
  searchTokensForQuery,
} from '@/lib/searchTokens'

describe('search tokens', () => {
  it('normalizes punctuation, case, and whitespace', () => {
    expect(normalizeSearchText('  Senior  React/Node.js Engineer!  ')).toBe(
      'senior react node js engineer',
    )
  })

  it('builds a deduplicated token set from multiple fields', () => {
    expect(
      buildSearchTokens('Acme Corp', 'Senior Engineer', 'Remote', ['React', 'react']),
    ).toEqual(['acme', 'corp', 'senior', 'engineer', 'remote', 'react'])
  })

  it('drops one-character tokens and bounds query tokens', () => {
    expect(buildSearchTokens('a b c ab')).toEqual(['ab'])
    expect(searchTokensForQuery(Array.from({ length: 20 }, () => 'term').join(' '))).toHaveLength(1)
  })
})

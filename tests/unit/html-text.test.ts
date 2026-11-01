import { describe, expect, it } from 'vitest'
import { stripHtml as clientStripHtml } from '@/lib/html'
import { stripHtml as functionsStripHtml } from '../../functions/lib/utils/html.js'
import { toNormalizedJob } from '../../functions/lib/utils/normalizeJob.js'
import type { RawJob } from '../../functions/lib/adapters/ats/types.js'

const SAMPLE_HTML = `
<p>Hello &amp; welcome</p>
<ul>
  <li>Build &amp; ship</li>
  <li>Support customers</li>
</ul>
<div class="content">
  <strong>About</strong><br><br>
  <span style="font-family: arial">We use
    <a href="https://example.com">Example</a> daily.</span>
</div>
<script>alert('not content')</script>
<style>.content { color: red }</style>
`

describe('HTML to plain text', () => {
  it('removes tags, decodes entities, and keeps readable paragraphs', () => {
    const text = clientStripHtml(SAMPLE_HTML)

    expect(text).not.toMatch(/<[^>]+>/)
    expect(text).not.toContain('&amp;')
    expect(text).not.toContain('&nbsp;')
    expect(text).not.toContain('alert(')
    expect(text).not.toContain('color: red')
    expect(text).toContain('Hello & welcome')
    expect(text).toContain('Build & ship')
    expect(text).toContain('Support customers')
    expect(text).toContain('About')
    expect(text).toContain('We use Example daily.')
  })

  it('decodes double-encoded HTML', () => {
    const text = clientStripHtml('&lt;p&gt;Hello &amp;amp; welcome&lt;/p&gt;')

    expect(text).toBe('Hello & welcome')
    expect(text).not.toContain('&lt;')
    expect(text).not.toContain('<p>')
  })

  it('decodes numeric and common named entities', () => {
    const text = clientStripHtml(
      'Tom &#39;the&#39; &amp; Jerry&#x27;s &nbsp; show &mdash; live',
    )

    expect(text).toBe("Tom 'the' & Jerry's show — live")
  })

  it('leaves plain text intact', () => {
    expect(clientStripHtml('Build React apps.')).toBe('Build React apps.')
  })

  it('is idempotent for cleaned paragraphs and bullets', () => {
    const once = clientStripHtml(SAMPLE_HTML)

    expect(clientStripHtml(once)).toBe(once)
    expect(functionsStripHtml(once)).toBe(once)
    expect(once).toContain('\n\n')
    expect(once).toContain('• ')
  })

  it('keeps the client and functions implementations in sync', () => {
    expect(functionsStripHtml(SAMPLE_HTML)).toBe(clientStripHtml(SAMPLE_HTML))
    expect(functionsStripHtml('&lt;p&gt;Hello &amp;amp; welcome&lt;/p&gt;')).toBe(
      clientStripHtml('&lt;p&gt;Hello &amp;amp; welcome&lt;/p&gt;'),
    )
  })

  it('cleans job fields during ingestion and derives clean fingerprints', () => {
    const raw: RawJob = {
      sourceJobId: '1',
      companyName: 'AT&amp;T',
      title: '<b>Senior &amp; Engineer</b>',
      description: '<p>Hello &amp; welcome</p>',
      location: 'Remote &amp; EU',
      remote: true,
      applicationUrl: 'https://example.com/jobs/1',
      skills: ['React'],
      sourceMetadata: {},
    }

    const normalized = toNormalizedJob('greenhouse', raw)

    expect(normalized.companyName).toBe('AT&T')
    expect(normalized.title).toBe('Senior & Engineer')
    expect(normalized.description).toBe('Hello & welcome')
    expect(normalized.location).toBe('Remote & EU')
    expect(normalized.descriptionFingerprint).toBeTruthy()
    expect(normalized.companyTitleKey).toBe('at t|senior engineer')
  })
})

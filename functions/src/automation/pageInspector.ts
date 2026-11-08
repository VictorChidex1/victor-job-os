import type { Page } from 'playwright'
import type { AtsApplicationField } from '../adapters/ats/types.js'
import type { ApplicationInspection } from './types.js'

const CAPTCHA_PATTERN = /captcha|verify you are human|are you a robot|access denied|cloudflare/i

interface RawField {
  name: string
  type?: AtsApplicationField['type']
  required?: boolean
  options?: string[]
}

export async function inspectCurrentPage(page: Page): Promise<ApplicationInspection> {
  const title = await page.title()
  const bodyText = (await page.locator('body').innerText().catch(() => '')).slice(0, 8000)
  const url = page.url()

  let manualActionReason: string | undefined
  if (CAPTCHA_PATTERN.test(`${title}\n${bodyText}`)) {
    manualActionReason =
      'The page appears to require CAPTCHA or human verification. Automation stopped.'
  } else if (/\/login|\/signin|\/sign-in/i.test(url)) {
    manualActionReason =
      'The application appears to require signing in. Automation cannot handle account login or security challenges.'
  }

  const passwordField = await page
    .locator('input[type="password"]')
    .count()
    .catch(() => 0)
  if (!manualActionReason && passwordField > 0) {
    manualActionReason =
      'The page contains a password field. A human must handle account login before inspection.'
  }

  const rawFields = await page.evaluate((): RawField[] => {
    const visible = (element: Element): boolean => {
      const html = element as HTMLElement
      const style = window.getComputedStyle(html)
      return (
        style.display !== 'none' &&
        style.visibility !== 'hidden' &&
        style.opacity !== '0' &&
        html.offsetParent !== null
      )
    }

    const labelText = (label: HTMLLabelElement): string => {
      const clone = label.cloneNode(true) as HTMLElement
      clone.querySelectorAll('input, select, textarea, option, button').forEach((entry) => entry.remove())
      return (clone.textContent?.trim() ?? '').replace(/\s*(choose file|no file chosen)\s*$/i, '').trim()
    }

    const labelFor = (element: Element): string => {
      const html = element as HTMLInputElement
      const labelledBy = element.getAttribute('aria-labelledby')
      if (labelledBy) {
        const text = labelledBy
          .split(/\s+/)
          .map((id) => document.getElementById(id)?.textContent?.trim() ?? '')
          .filter(Boolean)
          .join(' ')
        if (text) return text
      }
      const labels = html.labels ? Array.from(html.labels) : []
      const label = labels
        .map((entry) => labelText(entry))
        .filter(Boolean)
        .join(' ')
      if (label) return label
      const parentLabel = element.closest('label')
      if (parentLabel) return labelText(parentLabel)
      return (
        element.getAttribute('aria-label')?.trim() ||
        html.placeholder?.trim() ||
        element.getAttribute('name')?.trim() ||
        element.getAttribute('id')?.trim() ||
        ''
      )
    }

    const typeFor = (element: Element): RawField['type'] => {
      const tag = element.tagName.toLowerCase()
      if (tag === 'select') return 'select'
      if (tag === 'textarea') return 'textarea'
      const type = (element as HTMLInputElement).type?.toLowerCase()
      if (type === 'file') return 'file'
      if (type === 'checkbox' || type === 'radio') return 'checkbox'
      if (type === 'text' || type === 'email' || type === 'tel' || type === 'url' || type === 'number') {
        return 'text'
      }
      return 'unknown'
    }

    const forms = Array.from(document.querySelectorAll('form'))
    const score = (form: HTMLFormElement) =>
      form.querySelectorAll('input:not([type="hidden"]), textarea, select').length
    const scope: ParentNode =
      forms.length > 0
        ? forms.sort((a, b) => score(b) - score(a))[0]
        : document

    return Array.from(
      scope.querySelectorAll(
        'input:not([type="hidden"]), textarea, select',
      ),
    )
      .filter(visible)
      .slice(0, 200)
      .map((element) => {
        const name = labelFor(element)
        const required =
          element.hasAttribute('required') ||
          element.getAttribute('aria-required') === 'true'
        const options =
          element.tagName.toLowerCase() === 'select'
            ? Array.from((element as HTMLSelectElement).options)
                .map((option) => option.text.trim())
                .filter(Boolean)
                .slice(0, 50)
            : undefined
        return {
          name,
          type: typeFor(element),
          required: required ? true : undefined,
          options,
        }
      })
      .filter((field) => Boolean(field.name))
  })

  const uniqueFields = Array.from(
    new Map(rawFields.map((field) => [field.name.toLowerCase(), field])).values(),
  )

  const questionCandidates = uniqueFields
    .filter((field) => field.type === 'textarea' || /\?$/.test(field.name))
    .map((field) => field.name)

  const questions = Array.from(new Set(questionCandidates)).slice(0, 50)

  if (!manualActionReason && uniqueFields.length === 0) {
    const mailto = page.locator('a[href^="mailto:"]').first()
    const mailtoHref = await mailto.getAttribute('href').catch(() => null)
    const email = mailtoHref?.replace(/^mailto:/i, '').split('?')[0]
    manualActionReason = email
      ? `This employer accepts applications by email (${email}); no web application form was found.`
      : 'No visible application fields were found. The page may be dynamic, require manual navigation, or not expose its form yet.'
  }

  return {
    title: title || undefined,
    fields: uniqueFields,
    questions,
    manualActionReason,
  }
}

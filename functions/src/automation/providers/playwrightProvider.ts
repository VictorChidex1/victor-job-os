import { randomUUID } from 'node:crypto'
import { chromium, type Browser, type BrowserContext, type Page } from 'playwright'
import { isAllowedHost, validateAutomationUrl } from '../domainPolicy.js'
import { inspectCurrentPage } from '../pageInspector.js'
import type {
  ApplicationInspection,
  ApprovedFieldValue,
  AutomationFieldDescriptor,
  AutomationScreenshot,
  AutomationSessionHandle,
  AutomationSessionInput,
  BrowserAutomationProvider,
  FieldPopulationResult,
} from '../types.js'

interface LiveSession {
  browser: Browser
  context: BrowserContext
  page: Page
  allowedDomains: string[]
}

const MAX_SCREENSHOT_BYTES = 300 * 1024

export class PlaywrightBrowserAutomationProvider
  implements BrowserAutomationProvider
{
  id = 'playwright' as const
  capabilities = new Set(['inspect', 'fill', 'screenshot'] as const)
  private sessions = new Map<string, LiveSession>()

  async createSession(input: AutomationSessionInput): Promise<AutomationSessionHandle> {
    const browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-dev-shm-usage'],
    })

    try {
      const context = await browser.newContext({
        viewport: { width: 1365, height: 900 },
      })
      const page = await context.newPage()
      page.setDefaultTimeout(15_000)
      page.setDefaultNavigationTimeout(30_000)

      const providerSessionId = `playwright-${input.applicationId}-${randomUUID()}`
      this.sessions.set(providerSessionId, {
        browser,
        context,
        page,
        allowedDomains: input.allowedDomains,
      })

      return {
        providerSessionId,
        close: async () => {
          await this.closeProviderSession(providerSessionId)
        },
      }
    } catch (error) {
      await browser.close().catch(() => undefined)
      throw error
    }
  }

  async inspectApplication(
    handle: AutomationSessionHandle,
    input: AutomationSessionInput,
  ): Promise<ApplicationInspection> {
    const session = this.sessions.get(handle.providerSessionId)
    if (!session) {
      throw new Error('Browser automation session is no longer active.')
    }

    const response = await session.page.goto(input.applicationUrl, {
      waitUntil: 'domcontentloaded',
      timeout: 30_000,
    })
    await session.page
      .waitForLoadState('networkidle', { timeout: 5_000 })
      .catch(() => undefined)

    const finalUrl = validateAutomationUrl(session.page.url())
    if (
      !finalUrl.ok ||
      !finalUrl.host ||
      !isAllowedHost(finalUrl.host, session.allowedDomains)
    ) {
      return {
        title: await session.page.title().catch(() => undefined),
        fields: [],
        questions: [],
        manualActionReason:
          'The application redirected to a domain outside the allowed automation scope.',
      }
    }

    if (response && response.status() >= 400) {
      return {
        title: await session.page.title().catch(() => undefined),
        fields: [],
        questions: [],
        manualActionReason: `The application page returned HTTP ${response.status()}. Manual review is required.`,
      }
    }

    const firstInspection = await inspectCurrentPage(session.page)
    if (
      firstInspection.fields.length > 0 ||
      (firstInspection.manualActionReason &&
        !firstInspection.manualActionReason.startsWith(
          'No visible application fields were found',
        ))
    ) {
      return firstInspection
    }

    const applied = await this.tryApplyControl(session.page, session.allowedDomains)
    return applied ?? firstInspection
  }

  async populateApprovedFields(
    handle: AutomationSessionHandle,
    input: AutomationSessionInput,
    approvedFields: ApprovedFieldValue[],
    storedFields: AutomationFieldDescriptor[],
  ): Promise<FieldPopulationResult[]> {
    const session = this.sessions.get(handle.providerSessionId)
    if (!session) {
      throw new Error('Browser automation session is no longer active.')
    }

    const inspection = await this.inspectApplication(handle, input)
    const storedByKey = new Map(storedFields.map((field) => [field.key, field]))

    if (inspection.manualActionReason) {
      return approvedFields.map((approved) => ({
        fieldKey: approved.fieldKey,
        label: storedByKey.get(approved.fieldKey)?.name ?? approved.fieldKey,
        status: 'failed',
        reason: inspection.manualActionReason,
      }))
    }

    const page = await this.findPopulatedFieldPage(session)
    if (!page) {
      return approvedFields.map((approved) => ({
        fieldKey: approved.fieldKey,
        label: storedByKey.get(approved.fieldKey)?.name ?? approved.fieldKey,
        status: 'failed',
        reason: 'The application form could not be located for population.',
      }))
    }

    const currentByKey = new Map(
      inspection.fields.map((field) => [field.key, field]),
    )
    const results: FieldPopulationResult[] = []

    for (const approved of approvedFields) {
      const stored = storedByKey.get(approved.fieldKey)
      const field = currentByKey.get(approved.fieldKey)
      const label = field?.name ?? stored?.name ?? approved.fieldKey

      if (!field) {
        results.push({
          fieldKey: approved.fieldKey,
          label,
          status: 'skipped',
          reason:
            'The field is no longer present in the same position on the live form.',
        })
        continue
      }

      if (field.inputType === 'radio') {
        results.push({
          fieldKey: approved.fieldKey,
          label,
          status: 'manual-required',
          reason: 'Radio groups require a manual choice.',
        })
        continue
      }

      if (field.type === 'file' || field.type === 'unknown') {
        results.push({
          fieldKey: approved.fieldKey,
          label,
          status: 'manual-required',
          reason: 'This field type requires manual input.',
        })
        continue
      }

      const locator = page
        .locator(`[data-job-os-field="${field.key}"]`)
        .first()

      try {
        if (!(await locator.count())) {
          results.push({
            fieldKey: approved.fieldKey,
            label,
            status: 'skipped',
            reason: 'The field could not be located on the live form.',
          })
          continue
        }

        if (!(await locator.isVisible().catch(() => false))) {
          results.push({
            fieldKey: approved.fieldKey,
            label,
            status: 'skipped',
            reason: 'The field is not visible on the live form.',
          })
          continue
        }

        if (field.type === 'select') {
          const value = String(approved.value)
          const option = field.options?.find(
            (candidate) => candidate.toLowerCase() === value.toLowerCase(),
          )
          if (!option) {
            results.push({
              fieldKey: approved.fieldKey,
              label,
              status: 'failed',
              reason: 'The approved option is no longer available.',
            })
            continue
          }
          await locator.selectOption({ label: option })
          results.push({
            fieldKey: approved.fieldKey,
            label,
            status: 'filled',
            valuePreview: option,
          })
          continue
        }

        if (field.type === 'checkbox') {
          if (typeof approved.value !== 'boolean') {
            results.push({
              fieldKey: approved.fieldKey,
              label,
              status: 'failed',
              reason: 'The approved checkbox value is invalid.',
            })
            continue
          }
          if (approved.value) {
            await locator.check()
          } else {
            await locator.uncheck()
          }
          results.push({
            fieldKey: approved.fieldKey,
            label,
            status: 'filled',
            valuePreview: String(approved.value),
          })
          continue
        }

        await locator.fill(String(approved.value))
        results.push({
          fieldKey: approved.fieldKey,
          label,
          status: 'filled',
          valuePreview: String(approved.value).slice(0, 120),
        })
      } catch (error) {
        results.push({
          fieldKey: approved.fieldKey,
          label,
          status: 'failed',
          reason:
            error instanceof Error
              ? error.message.slice(0, 300)
              : 'The field could not be populated.',
        })
      }
    }

    return results
  }

  async captureScreenshot(
    handle: AutomationSessionHandle,
  ): Promise<AutomationScreenshot | null> {
    const session = this.sessions.get(handle.providerSessionId)
    if (!session) {
      throw new Error('Browser automation session is no longer active.')
    }

    const page = this.screenshotPage(session)
    if (!page) return null

    const originalViewport = page.viewportSize()
    let width = originalViewport?.width
    let height = originalViewport?.height
    const capture = (quality: number) =>
      page.screenshot({
        type: 'webp',
        quality,
        fullPage: false,
        animations: 'disabled',
      })

    let buffer = await capture(60)
    if (buffer.length > MAX_SCREENSHOT_BYTES) {
      buffer = await capture(40)
    }

    if (buffer.length > MAX_SCREENSHOT_BYTES) {
      await page.setViewportSize({ width: 1024, height: 768 })
      width = 1024
      height = 768
      await page.waitForTimeout(150)
      try {
        buffer = await capture(40)
      } finally {
        if (originalViewport) {
          await page.setViewportSize(originalViewport).catch(() => undefined)
        }
      }
    }

    if (buffer.length > MAX_SCREENSHOT_BYTES) {
      throw new Error(
        'Screenshot exceeded the 300 KB limit after compression.',
      )
    }

    return {
      buffer,
      contentType: 'image/webp',
      size: buffer.length,
      ...(width ? { width } : {}),
      ...(height ? { height } : {}),
      pageUrl: page.url(),
      pageTitle: await page.title().catch(() => undefined),
    }
  }

  async closeSession(handle: AutomationSessionHandle): Promise<void> {
    await this.closeProviderSession(handle.providerSessionId)
  }

  private screenshotPage(session: LiveSession): Page | null {
    const pages = session.context.pages().filter((page) => !page.isClosed())
    return pages[pages.length - 1] ?? (session.page.isClosed() ? null : session.page)
  }

  private async findPopulatedFieldPage(
    session: LiveSession,
  ): Promise<Page | null> {
    const pages = [...session.context.pages()].reverse()
    for (const page of pages) {
      const count = await page
        .locator('[data-job-os-field]')
        .count()
        .catch(() => 0)
      if (count > 0) return page
    }
    return null
  }

  private async tryApplyControl(
    page: Page,
    allowedDomains: string[],
  ): Promise<ApplicationInspection | null> {
    const controls = page.locator('a,button')
    const count = await controls.count().catch(() => 0)

    for (let index = 0; index < Math.min(count, 40); index += 1) {
      const control = controls.nth(index)
      const text = (await control.innerText().catch(() => '')).trim()
      if (!/\bapply\b/i.test(text)) continue
      if (/unlock|join|unrelated|similar|view more|save job|hide job/i.test(text)) {
        continue
      }
      if (!(await control.isVisible().catch(() => false))) continue

      const href = await control.getAttribute('href').catch(() => null)
      if (href) {
        const target = new URL(href, page.url()).toString()
        const decision = validateAutomationUrl(target)
        if (
          !decision.ok ||
          !decision.host ||
          !isAllowedHost(decision.host, allowedDomains)
        ) {
          continue
        }
        await page.goto(target, {
          waitUntil: 'domcontentloaded',
          timeout: 30_000,
        })
        await page
          .waitForLoadState('networkidle', { timeout: 5_000 })
          .catch(() => undefined)
        return inspectCurrentPage(page)
      }

      const popupPromise = page
        .context()
        .waitForEvent('page', { timeout: 3_000 })
        .catch(() => null)
      await control.click({ timeout: 5_000 }).catch(() => undefined)
      const popup = await popupPromise
      if (popup) {
        await popup.waitForLoadState('domcontentloaded', { timeout: 10_000 }).catch(
          () => undefined,
        )
        return inspectCurrentPage(popup)
      }

      await page.waitForTimeout(800)
      return inspectCurrentPage(page)
    }

    return null
  }

  private async closeProviderSession(providerSessionId: string): Promise<void> {
    const session = this.sessions.get(providerSessionId)
    if (!session) return
    this.sessions.delete(providerSessionId)
    await session.context.close().catch(() => undefined)
    await session.browser.close().catch(() => undefined)
  }
}

import { randomUUID } from 'node:crypto'
import { chromium, type Browser, type BrowserContext, type Page } from 'playwright'
import { isAllowedHost, validateAutomationUrl } from '../domainPolicy.js'
import { inspectCurrentPage } from '../pageInspector.js'
import type {
  ApplicationInspection,
  AutomationSessionHandle,
  AutomationSessionInput,
  BrowserAutomationProvider,
} from '../types.js'

interface LiveSession {
  browser: Browser
  context: BrowserContext
  page: Page
  allowedDomains: string[]
}

export class PlaywrightBrowserAutomationProvider
  implements BrowserAutomationProvider
{
  id = 'playwright' as const
  capabilities = new Set(['inspect'] as const)
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

    return inspectCurrentPage(session.page)
  }

  async closeSession(handle: AutomationSessionHandle): Promise<void> {
    await this.closeProviderSession(handle.providerSessionId)
  }

  private async closeProviderSession(providerSessionId: string): Promise<void> {
    const session = this.sessions.get(providerSessionId)
    if (!session) return
    this.sessions.delete(providerSessionId)
    await session.context.close().catch(() => undefined)
    await session.browser.close().catch(() => undefined)
  }
}

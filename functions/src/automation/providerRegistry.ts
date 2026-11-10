import { MockBrowserAutomationProvider } from './providers/mockProvider.js'
import { PlaywrightBrowserAutomationProvider } from './providers/playwrightProvider.js'
import { CloudRunBrowserAutomationProvider } from './providers/cloudRunProvider.js'
import type { AutomationProviderId, BrowserAutomationProvider } from './types.js'

const mockProvider = new MockBrowserAutomationProvider()
const playwrightProvider = new PlaywrightBrowserAutomationProvider()
const cloudRunProvider = new CloudRunBrowserAutomationProvider()
const providers: Partial<Record<AutomationProviderId, BrowserAutomationProvider>> = {
  mock: mockProvider,
  playwright: playwrightProvider,
  'cloud-run': cloudRunProvider,
}

export function selectedAutomationProviderId(): AutomationProviderId {
  const configured = (process.env.AUTOMATION_PROVIDER ?? 'mock').toLowerCase()
  if (configured === 'playwright') return 'playwright'
  if (configured === 'cloud-run') {
    // The Functions emulator cannot mint Cloud Run service-account ID tokens
    // reliably, so keep local development on the local Playwright provider.
    return process.env.FUNCTIONS_EMULATOR === 'true' ? 'playwright' : 'cloud-run'
  }
  return 'mock'
}

export function getAutomationProvider(): BrowserAutomationProvider {
  const id = selectedAutomationProviderId()
  const provider = providers[id]
  if (!provider) {
    throw new Error(`Automation provider "${id}" is not installed.`)
  }
  return provider
}

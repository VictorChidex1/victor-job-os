import { MockBrowserAutomationProvider } from './providers/mockProvider.js'
import { PlaywrightBrowserAutomationProvider } from './providers/playwrightProvider.js'
import type { AutomationProviderId, BrowserAutomationProvider } from './types.js'

const mockProvider = new MockBrowserAutomationProvider()
const playwrightProvider = new PlaywrightBrowserAutomationProvider()
const providers: Partial<Record<AutomationProviderId, BrowserAutomationProvider>> = {
  mock: mockProvider,
  playwright: playwrightProvider,
}

export function selectedAutomationProviderId(): AutomationProviderId {
  const configured = (process.env.AUTOMATION_PROVIDER ?? 'mock').toLowerCase()
  return configured === 'playwright' ? 'playwright' : 'mock'
}

export function getAutomationProvider(): BrowserAutomationProvider {
  const id = selectedAutomationProviderId()
  const provider = providers[id]
  if (!provider) {
    throw new Error(`Automation provider "${id}" is not installed.`)
  }
  return provider
}

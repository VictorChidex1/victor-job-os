import { randomUUID } from 'node:crypto'
import type {
  ApplicationInspection,
  AutomationSessionHandle,
  AutomationSessionInput,
  BrowserAutomationProvider,
} from '../types.js'

export class MockBrowserAutomationProvider implements BrowserAutomationProvider {
  id = 'mock' as const
  capabilities = new Set(['inspect'] as const)

  async createSession(input: AutomationSessionInput): Promise<AutomationSessionHandle> {
    return {
      providerSessionId: `mock-${input.applicationId}-${randomUUID()}`,
      async close() {
        return undefined
      },
    }
  }

  async inspectApplication(
    _handle: AutomationSessionHandle,
    _input: AutomationSessionInput,
  ): Promise<ApplicationInspection> {
    return {
      title: 'Mock application inspection',
      fields: [],
      questions: [],
      manualActionReason:
        'Mock provider cannot inspect a live application page. A real browser provider is required for field discovery.',
    }
  }

  async closeSession(_handle: AutomationSessionHandle): Promise<void> {
    return undefined
  }
}

import { randomUUID } from 'node:crypto'
import type {
  ApplicationInspection,
  ApprovedFieldValue,
  AutomationFieldDescriptor,
  AutomationSessionHandle,
  AutomationSessionInput,
  BrowserAutomationProvider,
  FieldPopulationResult,
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

  async populateApprovedFields(
    _handle: AutomationSessionHandle,
    _input: AutomationSessionInput,
    approvedFields: ApprovedFieldValue[],
    fields: AutomationFieldDescriptor[],
  ): Promise<FieldPopulationResult[]> {
    const labels = new Map(fields.map((field) => [field.key, field.name]))
    return approvedFields.map((approved) => ({
      fieldKey: approved.fieldKey,
      label: labels.get(approved.fieldKey) ?? approved.fieldKey,
      status: 'failed',
      reason: 'Mock provider cannot populate a live application form.',
    }))
  }

  async captureScreenshot(
    _handle: AutomationSessionHandle,
  ): Promise<null> {
    return null
  }

  async closeSession(_handle: AutomationSessionHandle): Promise<void> {
    return undefined
  }
}

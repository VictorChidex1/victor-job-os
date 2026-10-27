export type OutreachStatus =
  | 'draft'
  | 'needs-review'
  | 'approved'
  | 'scheduled'
  | 'sent'
  | 'replied'
  | 'follow-up-due'
  | 'closed'

export type OutreachAction =
  | 'submit-review'
  | 'approve'
  | 'reject'
  | 'archive'
  | 'schedule'
  | 'mark-sent'
  | 'record-reply'
  | 'close'

export const ACTION_STATUS: Record<OutreachAction, OutreachStatus> = {
  'submit-review': 'needs-review',
  approve: 'approved',
  reject: 'closed',
  archive: 'closed',
  schedule: 'scheduled',
  'mark-sent': 'sent',
  'record-reply': 'replied',
  close: 'closed',
}

/** Only these status changes are legal. */
export const ALLOWED_TRANSITIONS: Record<OutreachStatus, OutreachStatus[]> = {
  draft: ['needs-review', 'closed'],
  'needs-review': ['approved', 'closed'],
  approved: ['scheduled', 'sent', 'closed'],
  scheduled: ['sent', 'closed'],
  sent: ['replied', 'follow-up-due', 'closed'],
  'follow-up-due': ['replied', 'sent', 'closed'],
  replied: ['closed'],
  closed: [],
}

export function isAllowedTransition(from: string, to: string): boolean {
  const allowed = ALLOWED_TRANSITIONS[from as OutreachStatus] ?? []
  return allowed.includes(to as OutreachStatus)
}

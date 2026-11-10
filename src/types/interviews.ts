import type { Timestamp } from 'firebase/firestore'

export type InterviewType =
  | 'phone'
  | 'video'
  | 'onsite'
  | 'technical'
  | 'behavioral'
  | 'panel'
  | 'final'
  | 'other'

export type InterviewStatus =
  | 'scheduled'
  | 'completed'
  | 'cancelled'
  | 'no-show'

export interface Interview {
  id: string
  userId: string
  applicationId: string
  companyName: string
  jobTitle: string
  type: InterviewType
  status: InterviewStatus
  round?: string
  scheduledAt: Timestamp
  durationMinutes: number
  timezone: string
  location?: string
  meetingUrl?: string
  interviewers: string[]
  notes?: string
  preparationNotes?: string
  outcomeNotes?: string
  searchTokens?: string[]
  createdAt: Timestamp
  updatedAt: Timestamp
}

export interface InterviewInput {
  applicationId: string
  type: InterviewType
  status: InterviewStatus
  round?: string
  scheduledAt: Date
  durationMinutes: number
  timezone: string
  location?: string
  meetingUrl?: string
  interviewers: string[]
  notes?: string
  preparationNotes?: string
  outcomeNotes?: string
}

export interface InterviewPatch {
  type?: InterviewType
  status?: InterviewStatus
  round?: string
  scheduledAt?: Date
  durationMinutes?: number
  timezone?: string
  location?: string
  meetingUrl?: string
  interviewers?: string[]
  notes?: string
  preparationNotes?: string
  outcomeNotes?: string
}

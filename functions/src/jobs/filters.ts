import { initializeApp } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'

initializeApp()
const db = getFirestore()

export interface OpportunityFilters {
  minFitScore: number
  remotePreference: boolean
  preferredLocations: string[]
  employmentTypes: string[]
  seniorityLevels: string[]
  excludedRoles: string[]
  excludedCompanies: string[]
}

export const defaultFilters: OpportunityFilters = {
  minFitScore: 60,
  remotePreference: false,
  preferredLocations: [],
  employmentTypes: [],
  seniorityLevels: [],
  excludedRoles: [],
  excludedCompanies: [],
}

function toStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.map(String).filter((v) => v.trim().length > 0) : []
}

export async function loadOpportunityFilters(uid: string): Promise<OpportunityFilters> {
  const snapshot = await db.collection('settings').doc(uid).get()
  if (!snapshot.exists) {
    return defaultFilters
  }
  const opportunity = (snapshot.data()?.opportunity ?? {}) as Record<string, unknown>
  const minFitScore = Number(opportunity.minFitScore)
  return {
    minFitScore: Number.isFinite(minFitScore) ? minFitScore : defaultFilters.minFitScore,
    remotePreference: opportunity.remotePreference === true,
    preferredLocations: toStringArray(opportunity.preferredLocations),
    employmentTypes: toStringArray(opportunity.employmentTypes),
    seniorityLevels: toStringArray(opportunity.seniorityLevels),
    excludedRoles: toStringArray(opportunity.excludedRoles),
    excludedCompanies: toStringArray(opportunity.excludedCompanies),
  }
}

export interface FilterableJob {
  title: string
  description?: string
  location?: string
  remote?: boolean
  employmentType?: string
  seniority?: string
  companyName?: string
}

export interface FilterResult {
  ok: boolean
  reason?: string
}

/**
 * Determines whether a job matches the user's configured opportunity filters.
 * Fields the source does not provide are treated leniently (never excluded on
 * a missing value) to avoid over-filtering.
 */
export function jobMatchesFilters(job: FilterableJob, filters: OpportunityFilters): FilterResult {
  const haystack = `${job.title} ${job.description ?? ''}`.toLowerCase()
  const company = (job.companyName ?? '').toLowerCase()

  for (const role of filters.excludedRoles) {
    if (role && haystack.includes(role.toLowerCase())) {
      return { ok: false, reason: `excluded role: ${role}` }
    }
  }
  for (const excluded of filters.excludedCompanies) {
    if (excluded && company.includes(excluded.toLowerCase())) {
      return { ok: false, reason: `excluded company: ${excluded}` }
    }
  }

  const location = (job.location ?? '').toLowerCase()
  const remote = job.remote === true || location.includes('remote')

  if (filters.remotePreference && !remote) {
    return { ok: false, reason: 'not remote' }
  }

  if (filters.preferredLocations.length > 0 && location && !remote) {
    const matches = filters.preferredLocations.some((loc) => location.includes(loc.toLowerCase()))
    if (!matches) {
      return { ok: false, reason: 'location mismatch' }
    }
  }

  if (filters.employmentTypes.length > 0 && job.employmentType) {
    const type = job.employmentType.toLowerCase()
    const matches = filters.employmentTypes.some((t) => type.includes(t.toLowerCase()))
    if (!matches) {
      return { ok: false, reason: 'employment type mismatch' }
    }
  }

  if (filters.seniorityLevels.length > 0 && job.seniority) {
    const level = job.seniority.toLowerCase()
    const matches = filters.seniorityLevels.some((l) => level.includes(l.toLowerCase()))
    if (!matches) {
      return { ok: false, reason: 'seniority mismatch' }
    }
  }

  return { ok: true }
}

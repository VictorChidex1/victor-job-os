import { doc, getDoc, type DocumentData, type Timestamp } from 'firebase/firestore'
import { db } from '@/services/firestore'
import { collections } from '@/services/collections'
import type { Company } from '@/types/companies'

export async function getCompany(id: string): Promise<Company | null> {
  const snapshot = await getDoc(doc(db, collections.companies, id))
  if (!snapshot.exists()) {
    return null
  }
  return toCompany(snapshot.id, snapshot.data())
}

function toCompany(id: string, data: DocumentData): Company {
  return {
    id,
    name: data.name ?? '',
    website: data.website,
    industry: data.industry,
    description: data.description,
    researchSummary: data.researchSummary,
    sourceUrls: data.sourceUrls ?? [],
    lastResearchedAt: data.lastResearchedAt as Timestamp | undefined,
    createdAt: data.createdAt as Timestamp,
    updatedAt: data.updatedAt as Timestamp,
  }
}
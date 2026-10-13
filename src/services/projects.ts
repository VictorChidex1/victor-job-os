import {
  collection,
  doc,
  addDoc,
  getDocs,
  deleteDoc,
  updateDoc,
  query,
  where,
  orderBy,
  type DocumentData,
} from 'firebase/firestore'
import { db } from '@/services/firestore'
import { collections } from '@/services/collections'
import type { PortfolioProject } from '@/types/projects'

const projectsCollection = collection(db, collections.projects)

export async function listProjects(uid: string): Promise<PortfolioProject[]> {
  const snapshot = await getDocs(
    query(projectsCollection, where('userId', '==', uid), orderBy('updatedAt', 'desc')),
  )
  return snapshot.docs.map((document) => toProject(document.id, document.data()))
}

export async function createProject(
  uid: string,
  data: Omit<PortfolioProject, 'id' | 'updatedAt'>,
): Promise<string> {
  const payload = {
    title: data.title ?? '',
    summary: data.summary ?? '',
    technologies: data.technologies ?? [],
    problem: data.problem ?? '',
    solution: data.solution ?? '',
    outcomes: data.outcomes ?? [],
    verifiedMetrics: data.verifiedMetrics ?? [],
    url: data.url ?? '',
    relevanceTags: data.relevanceTags ?? [],
    isActive: data.isActive ?? true,
    userId: uid,
    updatedAt: new Date(),
  }
  const ref = await addDoc(projectsCollection, payload)
  return ref.id
}

export async function updateProject(
  id: string,
  data: Partial<Omit<PortfolioProject, 'id'>>,
): Promise<void> {
  const payload: Record<string, unknown> = { updatedAt: new Date() }
  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined) {
      payload[key] = value
    }
  }
  await updateDoc(doc(projectsCollection, id), payload)
}

export async function deleteProject(id: string): Promise<void> {
  await deleteDoc(doc(projectsCollection, id))
}

function toProject(id: string, data: DocumentData): PortfolioProject {
  return {
    id,
    title: data.title,
    summary: data.summary,
    technologies: data.technologies ?? [],
    problem: data.problem,
    solution: data.solution,
    outcomes: data.outcomes ?? [],
    verifiedMetrics: data.verifiedMetrics ?? [],
    url: data.url,
    relevanceTags: data.relevanceTags ?? [],
    isActive: data.isActive ?? true,
    updatedAt: data.updatedAt?.toDate?.() ?? new Date(),
  }
}
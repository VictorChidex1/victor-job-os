import {
  collection,
  doc,
  addDoc,
  getDocs,
  deleteDoc,
  updateDoc,
  query,
  orderBy,
  type DocumentData,
} from 'firebase/firestore'
import { db } from '@/services/firestore'
import { collections } from '@/services/collections'
import type { PortfolioProject } from '@/types/projects'

const projectsCollection = collection(db, collections.projects)

export async function listProjects(): Promise<PortfolioProject[]> {
  const snapshot = await getDocs(query(projectsCollection, orderBy('updatedAt', 'desc')))
  return snapshot.docs.map((document) => toProject(document.id, document.data()))
}

export async function createProject(
  data: Omit<PortfolioProject, 'id' | 'updatedAt'>,
): Promise<string> {
  const ref = await addDoc(projectsCollection, { ...data, updatedAt: new Date() })
  return ref.id
}

export async function updateProject(
  id: string,
  data: Partial<Omit<PortfolioProject, 'id'>>,
): Promise<void> {
  await updateDoc(doc(projectsCollection, id), { ...data, updatedAt: new Date() })
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
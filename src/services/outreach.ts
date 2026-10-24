import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  type DocumentData,
  type Timestamp,
} from 'firebase/firestore'
import { db } from '@/services/firestore'
import { collections } from '@/services/collections'
import type { Outreach } from '@/types/outreach'

const outreachCollection = collection(db, collections.outreach)

export type OutreachWriteData = Omit<Outreach, 'id' | 'userId' | 'createdAt' | 'updatedAt'>

export async function listOutreach(uid: string): Promise<Outreach[]> {
  const snapshot = await getDocs(
    query(outreachCollection, where('userId', '==', uid), orderBy('updatedAt', 'desc')),
  )
  return snapshot.docs.map((document) => toOutreach(document.id, document.data()))
}

export async function getOutreach(id: string): Promise<Outreach | null> {
  const snapshot = await getDoc(doc(outreachCollection, id))
  return snapshot.exists() ? toOutreach(snapshot.id, snapshot.data()) : null
}

export async function listOutreachForJob(uid: string, jobId: string): Promise<Outreach[]> {
  const snapshot = await getDocs(
    query(outreachCollection, where('userId', '==', uid), where('jobId', '==', jobId)),
  )
  return snapshot.docs.map((document) => toOutreach(document.id, document.data()))
}

export async function listOutreachForCompany(
  uid: string,
  companyId: string,
): Promise<Outreach[]> {
  const snapshot = await getDocs(
    query(
      outreachCollection,
      where('userId', '==', uid),
      where('companyId', '==', companyId),
      orderBy('updatedAt', 'desc'),
    ),
  )
  return snapshot.docs.map((document) => toOutreach(document.id, document.data()))
}

export async function createOutreach(uid: string, data: OutreachWriteData): Promise<string> {
  const ref = await addDoc(outreachCollection, {
    ...data,
    userId: uid,
    createdAt: new Date(),
    updatedAt: new Date(),
  })
  return ref.id
}

export async function updateOutreach(id: string, data: Partial<OutreachWriteData>): Promise<void> {
  await updateDoc(doc(outreachCollection, id), { ...data, updatedAt: new Date() })
}

export async function deleteOutreach(id: string): Promise<void> {
  await deleteDoc(doc(outreachCollection, id))
}

function toOutreach(id: string, data: DocumentData): Outreach {
  return {
    id,
    userId: data.userId,
    jobId: data.jobId,
    companyId: data.companyId ?? '',
    contactId: data.contactId,
    contactName: data.contactName,
    contactEmail: data.contactEmail,
    jobTitle: data.jobTitle,
    companyName: data.companyName,
    subject: data.subject ?? '',
    body: data.body ?? '',
    draftSubject: data.draftSubject ?? data.subject ?? '',
    draftBody: data.draftBody ?? data.body ?? '',
    status: data.status ?? 'draft',
    aiProvider: data.aiProvider,
    model: data.model,
    promptVersion: data.promptVersion,
    sentManually: data.sentManually,
    sentAt: data.sentAt as Timestamp | undefined,
    approvedAt: data.approvedAt as Timestamp | undefined,
    scheduledAt: data.scheduledAt as Timestamp | undefined,
    replyAt: data.replyAt as Timestamp | undefined,
    closedAt: data.closedAt as Timestamp | undefined,
    closedReason: data.closedReason,
    followUpCount: data.followUpCount ?? 0,
    lastFollowUpAt: data.lastFollowUpAt as Timestamp | undefined,
    createdAt: data.createdAt as Timestamp,
    updatedAt: data.updatedAt as Timestamp,
  }
}

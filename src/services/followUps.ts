import {
  collection,
  doc,
  addDoc,
  getDocs,
  updateDoc,
  query,
  where,
  orderBy,
  type DocumentData,
  type Timestamp,
} from 'firebase/firestore'
import { db } from '@/services/firestore'
import { collections } from '@/services/collections'
import type { FollowUp } from '@/types/outreach'

const followUpsCollection = collection(db, collections.followUps)

export type FollowUpWriteData = Omit<FollowUp, 'id' | 'userId' | 'createdAt'>

export async function listFollowUps(uid: string): Promise<FollowUp[]> {
  const snapshot = await getDocs(
    query(followUpsCollection, where('userId', '==', uid), orderBy('scheduledFor', 'asc')),
  )
  return snapshot.docs.map((document) => toFollowUp(document.id, document.data()))
}

export async function listFollowUpsForOutreach(
  uid: string,
  outreachId: string,
): Promise<FollowUp[]> {
  const snapshot = await getDocs(
    query(
      followUpsCollection,
      where('userId', '==', uid),
      where('outreachId', '==', outreachId),
      orderBy('sequence', 'asc'),
    ),
  )
  return snapshot.docs.map((document) => toFollowUp(document.id, document.data()))
}

export async function createFollowUp(uid: string, data: FollowUpWriteData): Promise<string> {
  const ref = await addDoc(followUpsCollection, {
    ...data,
    userId: uid,
    createdAt: new Date(),
  })
  return ref.id
}

export async function updateFollowUp(id: string, data: Partial<FollowUpWriteData>): Promise<void> {
  await updateDoc(doc(followUpsCollection, id), data)
}

function toFollowUp(id: string, data: DocumentData): FollowUp {
  return {
    id,
    userId: data.userId,
    outreachId: data.outreachId,
    scheduledFor: data.scheduledFor as Timestamp,
    sequence: data.sequence ?? 0,
    status: data.status ?? 'pending',
    draftSubject: data.draftSubject,
    draftBody: data.draftBody,
    approvedAt: data.approvedAt as Timestamp | undefined,
    sentAt: data.sentAt as Timestamp | undefined,
    createdAt: data.createdAt as Timestamp,
  }
}

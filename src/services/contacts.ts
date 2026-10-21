import {
  collection,
  doc,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  type DocumentData,
  type Timestamp,
} from 'firebase/firestore'
import { db } from '@/services/firestore'
import { collections } from '@/services/collections'
import type { Contact } from '@/types/outreach'

const contactsCollection = collection(db, collections.contacts)

export type ContactWriteData = Omit<Contact, 'id' | 'userId' | 'createdAt' | 'updatedAt'>

export async function listContacts(uid: string): Promise<Contact[]> {
  const snapshot = await getDocs(query(contactsCollection, where('userId', '==', uid)))
  return snapshot.docs.map((document) => toContact(document.id, document.data()))
}

export async function listContactsByCompany(uid: string, companyId: string): Promise<Contact[]> {
  const snapshot = await getDocs(
    query(
      contactsCollection,
      where('userId', '==', uid),
      where('companyId', '==', companyId),
    ),
  )
  return snapshot.docs.map((document) => toContact(document.id, document.data()))
}

export async function createContact(uid: string, data: ContactWriteData): Promise<string> {
  const ref = await addDoc(contactsCollection, {
    ...data,
    userId: uid,
    createdAt: new Date(),
    updatedAt: new Date(),
  })
  return ref.id
}

export async function updateContact(id: string, data: Partial<ContactWriteData>): Promise<void> {
  await updateDoc(doc(contactsCollection, id), { ...data, updatedAt: new Date() })
}

export async function deleteContact(id: string): Promise<void> {
  await deleteDoc(doc(contactsCollection, id))
}

function toContact(id: string, data: DocumentData): Contact {
  return {
    id,
    userId: data.userId,
    companyId: data.companyId ?? '',
    companyName: data.companyName,
    name: data.name,
    email: data.email,
    role: data.role,
    sourceUrl: data.sourceUrl,
    confidence: data.confidence,
    verified: data.verified ?? false,
    createdAt: data.createdAt as Timestamp,
    updatedAt: data.updatedAt as Timestamp,
  }
}

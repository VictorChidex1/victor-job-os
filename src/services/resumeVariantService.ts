import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  where,
  writeBatch,
  type DocumentData,
  type Firestore,
  type WriteBatch,
} from 'firebase/firestore'
import { collections } from '@/services/collections'
import {
  cleanResumeVariantInput,
  resumeVariantSearchTokens,
} from '@/lib/resumeVariants'
import type { ResumeVariant, ResumeVariantInput } from '@/types/resumeVariants'

export interface ResumeVariantService {
  list(uid: string): Promise<ResumeVariant[]>
  get(id: string): Promise<ResumeVariant | null>
  create(uid: string, input: ResumeVariantInput): Promise<string>
  update(uid: string, id: string, input: ResumeVariantInput): Promise<void>
  setDefault(uid: string, id: string): Promise<void>
  delete(id: string): Promise<void>
}

export function createResumeVariantService(
  firestore: Firestore,
): ResumeVariantService {
  const variants = collection(firestore, collections.resumeVariants)

  async function list(uid: string): Promise<ResumeVariant[]> {
    const snapshot = await getDocs(
      query(variants, where('userId', '==', uid), orderBy('updatedAt', 'desc')),
    )
    return snapshot.docs.map((document) => toVariant(document.id, document.data()))
  }

  async function get(id: string): Promise<ResumeVariant | null> {
    const snapshot = await getDoc(doc(variants, id))
    return snapshot.exists()
      ? toVariant(snapshot.id, snapshot.data())
      : null
  }

  async function clearOtherDefaults(
    batch: WriteBatch,
    uid: string,
    exceptId: string,
  ): Promise<void> {
    const snapshot = await getDocs(
      query(variants, where('userId', '==', uid), where('isDefault', '==', true)),
    )
    for (const variant of snapshot.docs) {
      if (variant.id === exceptId) continue
      batch.update(variant.ref, {
        isDefault: false,
        updatedAt: serverTimestamp(),
      })
    }
  }

  async function create(uid: string, input: ResumeVariantInput): Promise<string> {
    const cleaned = cleanResumeVariantInput(input)
    const ref = doc(variants)
    const batch = writeBatch(firestore)

    if (cleaned.isDefault) {
      await clearOtherDefaults(batch, uid, ref.id)
    }
    batch.set(ref, {
      userId: uid,
      ...cleaned,
      searchTokens: resumeVariantSearchTokens(cleaned),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
    await batch.commit()

    return ref.id
  }

  async function update(
    uid: string,
    id: string,
    input: ResumeVariantInput,
  ): Promise<void> {
    const cleaned = cleanResumeVariantInput(input)
    const ref = doc(variants, id)

    const snapshot = await getDoc(ref)
    if (!snapshot.exists()) {
      throw new Error('Resume variant not found.')
    }
    if (snapshot.data()?.userId !== uid) {
      throw new Error('This resume variant does not belong to you.')
    }

    const batch = writeBatch(firestore)
    if (cleaned.isDefault) {
      await clearOtherDefaults(batch, uid, id)
    }
    batch.update(ref, {
      ...cleaned,
      searchTokens: resumeVariantSearchTokens(cleaned),
      updatedAt: serverTimestamp(),
    })
    await batch.commit()
  }

  async function setDefault(uid: string, id: string): Promise<void> {
    const ref = doc(variants, id)

    const snapshot = await getDoc(ref)
    if (!snapshot.exists()) {
      throw new Error('Resume variant not found.')
    }
    if (snapshot.data()?.userId !== uid) {
      throw new Error('This resume variant does not belong to you.')
    }

    const batch = writeBatch(firestore)
    await clearOtherDefaults(batch, uid, id)
    batch.update(ref, {
      isDefault: true,
      updatedAt: serverTimestamp(),
    })
    await batch.commit()
  }

  async function remove(id: string): Promise<void> {
    await deleteDoc(doc(variants, id))
  }

  return {
    list,
    get,
    create,
    update,
    setDefault,
    delete: remove,
  }
}

function optionalTimestamp(value: unknown) {
  return value ? (value as ResumeVariant['createdAt']) : undefined
}

function toVariant(id: string, data: DocumentData): ResumeVariant {
  return {
    id,
    userId: data.userId ?? '',
    name: typeof data.name === 'string' ? data.name : '',
    resumeUrl: typeof data.resumeUrl === 'string' ? data.resumeUrl : '',
    targetRoles: Array.isArray(data.targetRoles)
      ? data.targetRoles.filter((item): item is string => typeof item === 'string')
      : [],
    technologies: Array.isArray(data.technologies)
      ? data.technologies.filter((item): item is string => typeof item === 'string')
      : [],
    notes: typeof data.notes === 'string' ? data.notes : '',
    isDefault: data.isDefault === true,
    searchTokens: Array.isArray(data.searchTokens)
      ? data.searchTokens.filter(
          (item: unknown): item is string => typeof item === 'string',
        )
      : undefined,
    createdAt: optionalTimestamp(data.createdAt),
    updatedAt: optionalTimestamp(data.updatedAt),
  }
}

import { getFirestore, connectFirestoreEmulator, type Firestore } from 'firebase/firestore'
import { app } from '@/services/firebase'

export const db: Firestore = getFirestore(app)

const isEmulator = import.meta.env.VITE_FIREBASE_EMULATOR === 'true'
if (isEmulator) {
  const port = import.meta.env.VITE_FIREBASE_FIRESTORE_EMULATOR_PORT ?? '8080'
  connectFirestoreEmulator(db, '127.0.0.1', Number(port))
}
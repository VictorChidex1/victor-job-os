import {
  connectStorageEmulator,
  getStorage,
  type FirebaseStorage,
} from 'firebase/storage'
import { app } from '@/services/firebase'

export const storage: FirebaseStorage = getStorage(app)

const isEmulator = import.meta.env.VITE_FIREBASE_EMULATOR === 'true'
if (isEmulator) {
  const port = import.meta.env.VITE_FIREBASE_STORAGE_EMULATOR_PORT ?? '9199'
  connectStorageEmulator(storage, '127.0.0.1', Number(port))
}

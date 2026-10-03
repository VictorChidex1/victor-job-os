import { getAuth, connectAuthEmulator, type Auth } from 'firebase/auth'
import { app } from '@/services/firebase'

export const auth: Auth = getAuth(app)

const isEmulator = import.meta.env.VITE_FIREBASE_EMULATOR === 'true'
if (isEmulator) {
  const host = import.meta.env.VITE_FIREBASE_AUTH_EMULATOR_PORT ?? '9099'
  connectAuthEmulator(auth, `http://127.0.0.1:${host}`, { disableWarnings: true })
}
import {
  getAuth,
  connectAuthEmulator,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  GoogleAuthProvider,
  onAuthStateChanged,
  type Auth,
  type User,
  type UserCredential,
} from 'firebase/auth'
import { app } from '@/services/firebase'

export const auth: Auth = getAuth(app)

const isEmulator = import.meta.env.VITE_FIREBASE_EMULATOR === 'true'
if (isEmulator) {
  const host = import.meta.env.VITE_FIREBASE_AUTH_EMULATOR_PORT ?? '9099'
  connectAuthEmulator(auth, `http://127.0.0.1:${host}`, { disableWarnings: true })
}

export function onAuthStateChange(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback)
}

export async function signInWithEmail(email: string, password: string): Promise<UserCredential> {
  return signInWithEmailAndPassword(auth, email, password)
}

export async function signInWithGoogle(): Promise<UserCredential> {
  return signInWithPopup(auth, new GoogleAuthProvider())
}

export async function signOutUser(): Promise<void> {
  return signOut(auth)
}
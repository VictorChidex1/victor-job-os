import { getFunctions, connectFunctionsEmulator, type Functions } from 'firebase/functions'
import { app } from '@/services/firebase'

export const functions: Functions = getFunctions(app)

const isEmulator = import.meta.env.VITE_FIREBASE_EMULATOR === 'true'
if (isEmulator) {
  const port = import.meta.env.VITE_FIREBASE_FUNCTIONS_EMULATOR_PORT ?? '5001'
  connectFunctionsEmulator(functions, '127.0.0.1', Number(port))
}
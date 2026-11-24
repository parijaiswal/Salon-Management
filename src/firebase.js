import { initializeApp, getApps } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId:             import.meta.env.VITE_FIREBASE_APP_ID || '',
}

export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey &&
  firebaseConfig.projectId &&
  firebaseConfig.apiKey.trim().length > 0 &&
  firebaseConfig.projectId.trim().length > 0
)

let firestoreDb = null
if (isFirebaseConfigured) {
  try {
    const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]
    firestoreDb = getFirestore(app)
  } catch (err) {
    console.warn('Firebase initialization skipped or failed:', err)
  }
}

export const db = firestoreDb

import { initializeApp, getApps, getApp } from 'firebase/app'
import { getFirestore, type Firestore } from 'firebase/firestore'
import { getAuth, type Auth } from 'firebase/auth'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
}

export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey &&
  firebaseConfig.projectId &&
  firebaseConfig.apiKey !== 'your_api_key_here'
)

// Inisialisasi Firebase App
export const app = !getApps().length
  ? initializeApp(
      isFirebaseConfigured
        ? firebaseConfig
        : {
            apiKey: 'demo-api-key',
            projectId: 'demo-dapur-nia',
            appId: '1:123456789:web:abcdef',
          }
    )
  : getApp()

// Inisialisasi Cloud Firestore
export const db: Firestore = getFirestore(app)

// Inisialisasi Firebase Authentication
export const auth: Auth = getAuth(app)

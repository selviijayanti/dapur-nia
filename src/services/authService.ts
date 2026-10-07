import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
  type User,
} from 'firebase/auth'
import { auth, isFirebaseConfigured } from '@/lib/firebase'

export interface AuthUserProfile {
  uid: string
  email: string | null
  displayName: string | null
  role: 'pemilik' | 'pelanggan' | 'tamu'
}

// Simulasi user untuk demo mode (offline / tanpa config Firebase)
const DEMO_USER_KEY = 'dapur_nia_demo_auth_user'

function getStoredDemoUser(): AuthUserProfile | null {
  try {
    const raw = localStorage.getItem(DEMO_USER_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function setStoredDemoUser(user: AuthUserProfile | null) {
  if (user) {
    localStorage.setItem(DEMO_USER_KEY, JSON.stringify(user))
  } else {
    localStorage.removeItem(DEMO_USER_KEY)
  }
}

// Pemetaan Pesan Galat Firebase Auth ke Bahasa Indonesia (Sesuai Bab 4.5 & Bab 5.2 Modul)
export function getIndonesianAuthErrorMessage(error: unknown): string {
  const err = error as { code?: string; message?: string }
  const code = err?.code || ''

  switch (code) {
    case 'auth/email-already-in-use':
      return 'Email ini sudah terdaftar. Silakan masuk.'
    case 'auth/weak-password':
      return 'Kata sandi minimal 6 karakter.'
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'Email atau kata sandi salah.'
    case 'auth/invalid-email':
      return 'Format email belum benar.'
    case 'auth/too-many-requests':
      return 'Terlalu banyak percobaan, coba lagi nanti.'
    case 'auth/configuration-not-found':
      return 'Layanan Authentication belum diaktifkan di Firebase Console. Buka Firebase Console > Authentication, klik "Mulai / Get started", lalu aktifkan metode "Email/Password".'
    case 'auth/operation-not-allowed':
      return 'Metode Email/Password belum diaktifkan di Firebase Console. Buka menu Authentication > Sign-in method dan aktifkan "Email/Password".'
    default:
      return err?.message || 'Terjadi kesalahan, coba lagi.'
  }
}

// Masuk dengan Email dan Kata Sandi
export async function loginWithEmail(email: string, pass: string): Promise<AuthUserProfile> {
  if (!isFirebaseConfigured) {
    // Simulasi di mode demo
    if (pass.length < 6) {
      throw { code: 'auth/weak-password', message: 'Kata sandi minimal 6 karakter.' }
    }
    const demoUser: AuthUserProfile = {
      uid: 'demo-pemilik-nia',
      email: email,
      displayName: email.includes('nia') ? 'Nia' : email.split('@')[0],
      role: 'pemilik',
    }
    setStoredDemoUser(demoUser)
    return demoUser
  }

  const credential = await signInWithEmailAndPassword(auth, email.trim(), pass)
  return {
    uid: credential.user.uid,
    email: credential.user.email,
    displayName: credential.user.displayName || credential.user.email?.split('@')[0] || 'Pemilik',
    role: 'pemilik',
  }
}

// Daftar Akun Baru dengan Email dan Kata Sandi
export async function registerWithEmail(
  name: string,
  email: string,
  pass: string
): Promise<AuthUserProfile> {
  if (pass.length < 6) {
    throw { code: 'auth/weak-password', message: 'Kata sandi minimal 6 karakter.' }
  }

  if (!isFirebaseConfigured) {
    const demoUser: AuthUserProfile = {
      uid: `demo-${Date.now()}`,
      email: email,
      displayName: name.trim() || 'Pemilik',
      role: 'pemilik',
    }
    setStoredDemoUser(demoUser)
    return demoUser
  }

  const credential = await createUserWithEmailAndPassword(auth, email.trim(), pass)
  if (name.trim()) {
    try {
      await updateProfile(credential.user, { displayName: name.trim() })
    } catch {
      // Ignored non-critical profile update failure
    }
  }

  return {
    uid: credential.user.uid,
    email: credential.user.email,
    displayName: name.trim() || credential.user.email?.split('@')[0] || 'Pemilik',
    role: 'pemilik',
  }
}

// Keluar / Logout
export async function logoutUser(): Promise<void> {
  if (!isFirebaseConfigured) {
    setStoredDemoUser(null)
    window.dispatchEvent(new Event('demo_auth_change'))
    return
  }
  await signOut(auth)
}

// Lupa Kata Sandi (Kirim tautan atur ulang kata sandi)
export async function resetPassword(email: string): Promise<void> {
  if (!isFirebaseConfigured) {
    // Simulasi sukses
    return
  }
  await sendPasswordResetEmail(auth, email.trim())
}

// Langganan Perubahan Status Auth (onAuthStateChanged)
export function subscribeAuthState(callback: (user: AuthUserProfile | null) => void) {
  if (!isFirebaseConfigured) {
    const checkDemo = () => {
      const demo = getStoredDemoUser()
      callback(demo)
    }
    checkDemo()
    window.addEventListener('demo_auth_change', checkDemo)
    return () => window.removeEventListener('demo_auth_change', checkDemo)
  }

  return onAuthStateChanged(auth, (firebaseUser: User | null) => {
    if (firebaseUser) {
      callback({
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Pemilik',
        role: 'pemilik',
      })
    } else {
      callback(null)
    }
  })
}

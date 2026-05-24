import { initializeApp, type FirebaseApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider, RecaptchaVerifier, type Auth } from 'firebase/auth'
import { getFirestore, type Firestore } from 'firebase/firestore'
import { getStorage, type FirebaseStorage } from 'firebase/storage'

// Auth providers
export const googleProvider = new GoogleAuthProvider()
googleProvider.setCustomParameters({ prompt: 'select_account' })

// reCAPTCHA verifier for phone auth (will be initialized when needed)
let recaptchaVerifier: RecaptchaVerifier | null = null

export function getRecaptchaVerifier(containerId: string): RecaptchaVerifier {
  const auth = getFirebaseAuth()
  if (!recaptchaVerifier) {
    recaptchaVerifier = new RecaptchaVerifier(auth, containerId, {
      size: 'invisible',
      callback: () => {
        // reCAPTCHA solved
      },
    })
  }
  return recaptchaVerifier
}

export function clearRecaptchaVerifier() {
  if (recaptchaVerifier) {
    recaptchaVerifier.clear()
    recaptchaVerifier = null
  }
}

const FIREBASE_CONFIG = {
  apiKey: 'AIzaSyC7jSYOGy5_ZbeZCVkPC1rCZ_Z8abZuhy0',
  authDomain: 'expeditionoz.firebaseapp.com',
  projectId: 'expeditionoz',
  storageBucket: 'expeditionoz.firebasestorage.app',
  messagingSenderId: '161777857257',
  appId: '1:161777857257:web:526470afc6e3cf5b4cb678',
  measurementId: 'G-6SRTR4NTKD',
}

let app: FirebaseApp | null = null
let auth: Auth | null = null
let db: Firestore | null = null
let storage: FirebaseStorage | null = null

export function initFirebase() {
  if (!app) {
    app = initializeApp(FIREBASE_CONFIG)
    auth = getAuth(app)
    db = getFirestore(app)
    storage = getStorage(app)
  }
  return { app, auth, db, storage }
}

export function getFirebaseAuth(): Auth {
  if (!auth) initFirebase()
  return auth!
}

export function getFirebaseDb(): Firestore {
  if (!db) initFirebase()
  return db!
}

export function getFirebaseStorage(): FirebaseStorage {
  if (!storage) initFirebase()
  return storage!
}

export function getFirebaseApp(): FirebaseApp {
  if (!app) initFirebase()
  return app!
}

export function isFirebaseInitialized(): boolean {
  return app !== null
}

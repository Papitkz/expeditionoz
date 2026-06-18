import { initializeApp, type FirebaseApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider, RecaptchaVerifier, type Auth, onAuthStateChanged } from 'firebase/auth'
import { getFirestore, type Firestore, enableNetwork, disableNetwork } from 'firebase/firestore'
import { getStorage, type FirebaseStorage, ref, getDownloadURL } from 'firebase/storage'

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

// const FIREBASE_CONFIG = {
//   apiKey: "AIzaSyC7jSYOGy5_ZbeZCVkPC1rCZ_Z8abZuhy0",
//   authDomain: "expeditionoz.firebaseapp.com",
//   projectId: "expeditionoz",
//   storageBucket: "expeditionoz.firebasestorage.app",
//   messagingSenderId: "161777857257",
//   appId: "1:161777857257:web:526470afc6e3cf5b4cb678",
//   measurementId: "G-6SRTR4NTKD"
// }
const FIREBASE_CONFIG  = {
  apiKey: "AIzaSyA9ty2palwxsZx0GOdhuRqup94Dk2ilCuw",
  authDomain: "expedition-drenched.firebaseapp.com",
  projectId: "expedition-drenched",
  storageBucket: "expedition-drenched.firebasestorage.app",
  messagingSenderId: "1057203662798",
  appId: "1:1057203662798:web:387b8078eefccf9412459f"
};

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

// ───────────────────────────────────────────────
// CONNECTION CHECKING UTILITIES
// ───────────────────────────────────────────────

export interface FirebaseConnectionStatus {
  initialized: boolean
  authConnected: boolean
  firestoreConnected: boolean
  storageConnected: boolean
  overall: boolean
  timestamp: Date
  error?: string
}

/**
 * Check if Firebase Auth is connected by verifying the auth instance
 * and optionally checking auth state listener responsiveness
 */
export function isAuthConnected(): boolean {
  try {
    const authInstance = getFirebaseAuth()
    return authInstance !== null && typeof authInstance.signInWithCredential === 'function'
  } catch (error) {
    return false
  }
}

/**
 * Check if Firestore is connected by attempting to enable network
 * (this will fail if there's no connection to Firebase)
 */
export async function isFirestoreConnected(): Promise<boolean> {
  try {
    const dbInstance = getFirebaseDb()
    await enableNetwork(dbInstance)
    return true
  } catch (error) {
    return false
  }
}

/**
 * Check if Firebase Storage is connected by attempting to get a reference
 * (lightweight check - doesn't actually download anything)
 */
export async function isStorageConnected(): Promise<boolean> {
  try {
    const storageInstance = getFirebaseStorage()
    // Try to create a reference to the root - this validates the storage instance
    const rootRef = ref(storageInstance, '/')
    return rootRef !== null && rootRef.bucket !== undefined
  } catch (error) {
    return false
  }
}

/**
 * Comprehensive connection check for all Firebase services
 * Returns detailed status for each service
 */
export async function checkFirebaseConnection(): Promise<FirebaseConnectionStatus> {
  const status: FirebaseConnectionStatus = {
    initialized: isFirebaseInitialized(),
    authConnected: false,
    firestoreConnected: false,
    storageConnected: false,
    overall: false,
    timestamp: new Date()
  }

  try {
    if (!status.initialized) {
      status.error = 'Firebase not initialized'
      return status
    }

    // Check Auth
    status.authConnected = isAuthConnected()

    // Check Firestore (with timeout to avoid hanging)
    const firestorePromise = Promise.race([
      isFirestoreConnected(),
      new Promise<boolean>((_, reject) => 
        setTimeout(() => reject(new Error('Firestore timeout')), 5000)
      )
    ])
    status.firestoreConnected = await firestorePromise.catch(() => false)

    // Check Storage
    status.storageConnected = await isStorageConnected()

    // Overall status: all services must be connected
    status.overall = status.authConnected && status.firestoreConnected && status.storageConnected

    if (!status.overall) {
      const failed = []
      if (!status.authConnected) failed.push('Auth')
      if (!status.firestoreConnected) failed.push('Firestore')
      if (!status.storageConnected) failed.push('Storage')
      status.error = `Failed services: ${failed.join(', ')}`
    }

  } catch (error) {
    status.error = error instanceof Error ? error.message : 'Unknown connection error'
  }

  return status
}

/**
 * Simple boolean check - returns true only if ALL services are connected
 */
export async function isFirebaseConnected(): Promise<boolean> {
  const status = await checkFirebaseConnection()
  return status.overall
}

/**
 * Quick check that only verifies initialization (no network calls)
 * Use this for UI state checks where you don't want async overhead
 */
export function isFirebaseReady(): boolean {
  return isFirebaseInitialized() && isAuthConnected()
}

/**
 * Monitor connection state with a callback
 * Returns an unsubscribe function
 */
export function onFirebaseConnectionChange(
  callback: (connected: boolean, status: FirebaseConnectionStatus) => void,
  checkIntervalMs: number = 10000
): () => void {
  let isRunning = true

  const check = async () => {
    if (!isRunning) return
    const status = await checkFirebaseConnection()
    callback(status.overall, status)
  }

  // Initial check
  check()

  // Periodic checks
  const interval = setInterval(check, checkIntervalMs)

  return () => {
    isRunning = false
    clearInterval(interval)
  }
}

/**
 * Force offline mode for Firestore (useful for testing or when connection is unstable)
 */
export async function setFirestoreOffline(): Promise<void> {
  const dbInstance = getFirebaseDb()
  await disableNetwork(dbInstance)
}

/**
 * Re-enable Firestore network after being offline
 */
export async function setFirestoreOnline(): Promise<void> {
  const dbInstance = getFirebaseDb()
  await enableNetwork(dbInstance)
}

/**
 * Get current auth state as a promise (useful for checking if user session is active)
 */
export function getCurrentAuthState(): Promise<{ connected: boolean; user: any | null }> {
  return new Promise((resolve) => {
    const authInstance = getFirebaseAuth()
    const unsubscribe = onAuthStateChanged(authInstance, (user) => {
      unsubscribe()
      resolve({
        connected: true,
        user
      })
    }, () => {
      resolve({
        connected: false,
        user: null
      })
    })
  })
}
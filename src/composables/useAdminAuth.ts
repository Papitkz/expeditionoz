import { ref, computed, onMounted, onUnmounted } from 'vue'
import { getFirebaseAuth, getFirebaseDb, googleProvider, getRecaptchaVerifier, clearRecaptchaVerifier } from '@/lib/firebase'
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  signInWithPopup,
  signInWithPhoneNumber,
  type User,
  type ConfirmationResult,
} from 'firebase/auth'
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  getDocs,
  query,
  where,
  orderBy,
  deleteDoc,
  serverTimestamp,
} from 'firebase/firestore'

const OWNER_EMAILS = ['johnfritzizar35@gmail.com', 'expeditionoz.dev@gmail.com']

const user = ref<User | null>(null)
const loading = ref(true)
const isAdmin = ref(false)
const userRole = ref<'owner' | 'admin' | 'user' | null>(null)

export interface FirebaseUser {
  uid: string
  email: string
  displayName: string
  role: 'owner' | 'admin' | 'user'
  createdAt: any
  updatedAt: any
}

export function useAdminAuth() {
  const isLoggedIn = computed(() => !!user.value && isAdmin.value)
  const isOwner = computed(() =>
    OWNER_EMAILS.includes(user.value?.email?.toLowerCase() ?? '')
  )

  async function resolveRole(currentUser: User) {
    const email = currentUser.email?.toLowerCase() || ''

    if (OWNER_EMAILS.includes(email)) {
      isAdmin.value = true
      userRole.value = 'owner'
      await ensureUserDoc(currentUser, 'owner')
      return
    }

    try {
      const db = getFirebaseDb()
      const userDoc = await getDoc(doc(db, 'users', currentUser.uid))

      if (userDoc.exists()) {
        const data = userDoc.data()
        if (data.role === 'admin' || data.role === 'owner') {
          isAdmin.value = true
          userRole.value = data.role as 'owner' | 'admin'
          return
        }
      }
    } catch (e) {
      console.warn('Firebase unavailable, cannot verify admin role:', e)
    }

    isAdmin.value = false
    userRole.value = 'user'
  }

  async function ensureUserDoc(currentUser: User, role: string) {
    try {
      const db = getFirebaseDb()
      const userRef = doc(db, 'users', currentUser.uid)
      const userDoc = await getDoc(userRef)

      if (!userDoc.exists()) {
        await setDoc(userRef, {
          uid: currentUser.uid,
          email: currentUser.email?.toLowerCase() || '',
          displayName: currentUser.displayName || '',
          role,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        })
      } else if (userDoc.data().role !== role && role === 'owner') {
        await updateDoc(userRef, { role, updatedAt: serverTimestamp() })
      }
    } catch (e) {
      console.warn('Firebase unavailable, skipping user doc:', e)
    }
  }

  async function grantAdminAccess(targetEmail: string): Promise<boolean> {
    if (!isOwner.value) return false

    try {
      const db = getFirebaseDb()
      const usersRef = collection(db, 'users')
      const q = query(usersRef, where('email', '==', targetEmail.toLowerCase()))
      const snap = await getDocs(q)

      if (!snap.empty) {
        const userDoc = snap.docs[0]
        await updateDoc(doc(db, 'users', userDoc.id), {
          role: 'admin',
          updatedAt: serverTimestamp(),
        })
        return true
      }

      // Create pending grant for future signup
      await setDoc(doc(db, 'admin_grants', targetEmail.toLowerCase()), {
        email: targetEmail.toLowerCase(),
        grantedBy: user.value?.uid,
        role: 'admin',
        createdAt: serverTimestamp(),
      })
      return true
    } catch (e) {
      console.warn('Firebase unavailable, cannot grant admin:', e)
      return false
    }
  }

  async function revokeAdminAccess(targetEmail: string): Promise<boolean> {
    if (!isOwner.value) return false

    try {
      const db = getFirebaseDb()
      const usersRef = collection(db, 'users')
      const q = query(usersRef, where('email', '==', targetEmail.toLowerCase()))
      const snap = await getDocs(q)

      if (!snap.empty) {
        const userDoc = snap.docs[0]
        await updateDoc(doc(db, 'users', userDoc.id), {
          role: 'user',
          updatedAt: serverTimestamp(),
        })
      }
      return true
    } catch (e) {
      console.warn('Firebase unavailable, cannot revoke admin:', e)
      return false
    }
  }

  async function signInWithEmail(email: string, password: string) {
    const auth = getFirebaseAuth()
    const result = await signInWithEmailAndPassword(auth, email, password)
    user.value = result.user
    await resolveRole(result.user)
    return result.user
  }

  // Google Sign-In - Returns user for OTP flow
  async function signInWithGoogle(): Promise<User> {
    const auth = getFirebaseAuth()
    const result = await signInWithPopup(auth, googleProvider)
    const googleUser = result.user

    // Ensure user doc exists
    const email = googleUser.email?.toLowerCase() || ''
    const isOwnerLogin = OWNER_EMAILS.includes(email)
    const role = isOwnerLogin ? 'owner' : 'user'

    await ensureUserDoc(googleUser, role)

    // Check for pending admin grant
    if (!isOwnerLogin && googleUser.email) {
      try {
        const db = getFirebaseDb()
        const grantDoc = await getDoc(doc(db, 'admin_grants', googleUser.email.toLowerCase()))
        if (grantDoc.exists()) {
          await updateDoc(doc(db, 'users', googleUser.uid), {
            role: 'admin',
            updatedAt: serverTimestamp(),
          })
          await deleteDoc(doc(db, 'admin_grants', googleUser.email.toLowerCase()))
        }
      } catch {
        /* ignore */
      }
    }

    user.value = googleUser
    await resolveRole(googleUser)
    return googleUser
  }

  // Phone Sign-In - Step 1: Send verification code
  let phoneConfirmationResult: ConfirmationResult | null = null

  async function sendPhoneVerification(phoneNumber: string, recaptchaContainerId: string = 'recaptcha-container') {
    const auth = getFirebaseAuth()
    const appVerifier = getRecaptchaVerifier(recaptchaContainerId)
    
    phoneConfirmationResult = await signInWithPhoneNumber(auth, phoneNumber, appVerifier)
    return true
  }

  // Phone Sign-In - Step 2: Verify OTP code
  async function verifyPhoneCode(code: string) {
    if (!phoneConfirmationResult) {
      throw new Error('No verification in progress. Please request a code first.')
    }

    const result = await phoneConfirmationResult.confirm(code)
    const phoneUser = result.user

    // Create/update user doc for phone auth (no email, use phone number)
    const db = getFirebaseDb()
    const userRef = doc(db, 'users', phoneUser.uid)
    const userDoc = await getDoc(userRef)

    if (!userDoc.exists()) {
      await setDoc(userRef, {
        uid: phoneUser.uid,
        email: '',
        phoneNumber: phoneUser.phoneNumber || '',
        displayName: phoneUser.displayName || phoneUser.phoneNumber || '',
        role: 'user',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
    }

    user.value = phoneUser
    await resolveRole(phoneUser)
    clearRecaptchaVerifier()
    phoneConfirmationResult = null
    return phoneUser
  }

  function cancelPhoneVerification() {
    clearRecaptchaVerifier()
    phoneConfirmationResult = null
  }

  async function signUp(email: string, password: string, displayName: string) {
    const auth = getFirebaseAuth()
    const result = await createUserWithEmailAndPassword(auth, email, password)
    const newUser = result.user

    const isOwnerSignup = OWNER_EMAILS.includes(newUser.email?.toLowerCase() ?? '')
    const role = isOwnerSignup ? 'owner' : 'user'

    // Create user doc
    const db = getFirebaseDb()
    await setDoc(doc(db, 'users', newUser.uid), {
      uid: newUser.uid,
      email: newUser.email?.toLowerCase() || '',
      displayName,
      role,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })

    let finalRole: 'owner' | 'admin' | 'user' = role

    // Check for pending admin grant
    if (!isOwnerSignup && newUser.email) {
      try {
        const grantDoc = await getDoc(doc(db, 'admin_grants', newUser.email.toLowerCase()))
        if (grantDoc.exists()) {
          await updateDoc(doc(db, 'users', newUser.uid), {
            role: 'admin',
            updatedAt: serverTimestamp(),
          })
          await deleteDoc(doc(db, 'admin_grants', newUser.email.toLowerCase()))
          finalRole = 'admin'
        }
      } catch {
        /* ignore */
      }
    }

    user.value = newUser
    isAdmin.value = finalRole === 'admin' || finalRole === 'owner'
    userRole.value = finalRole

    return newUser
  }

  async function signOut() {
    const auth = getFirebaseAuth()
    await firebaseSignOut(auth)
    user.value = null
    isAdmin.value = false
    userRole.value = null
  }

  // Get all users for admin management
  async function getAllUsers(): Promise<FirebaseUser[]> {
    try {
      const db = getFirebaseDb()
      const usersRef = collection(db, 'users')
      const q = query(usersRef, orderBy('createdAt', 'asc'))
      const snap = await getDocs(q)
      return snap.docs.map((d) => ({ ...d.data() } as FirebaseUser))
    } catch (e) {
      console.warn('Firebase unavailable, cannot load users:', e)
      return []
    }
  }

  // Update user role
  async function updateUserRole(uid: string, role: 'admin' | 'user'): Promise<boolean> {
    if (!isOwner.value) return false
    try {
      const db = getFirebaseDb()
      await updateDoc(doc(db, 'users', uid), {
        role,
        updatedAt: serverTimestamp(),
      })
      return true
    } catch (e) {
      console.warn('Firebase unavailable, cannot update role:', e)
      return false
    }
  }

  let unsubscribe: (() => void) | null = null

  onMounted(() => {
    const auth = getFirebaseAuth()
    unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      user.value = firebaseUser
      if (firebaseUser) {
        await resolveRole(firebaseUser)
      } else {
        isAdmin.value = false
        userRole.value = null
      }
      loading.value = false
    })
  })

  onUnmounted(() => {
    unsubscribe?.()
  })

  return {
    user,
    loading,
    isAdmin,
    isOwner,
    userRole,
    isLoggedIn,
    signInWithEmail,
    signInWithGoogle,
    sendPhoneVerification,
    verifyPhoneCode,
    cancelPhoneVerification,
    signUp,
    signOut,
    grantAdminAccess,
    revokeAdminAccess,
    getAllUsers,
    updateUserRole,
  }
}
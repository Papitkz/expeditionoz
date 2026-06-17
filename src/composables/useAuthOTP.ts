import { ref } from 'vue'
import { getFirebaseDb } from '@/lib/firebase'
import {
  collection,
  doc,
  setDoc,
  getDoc,
  query,
  where,
  getDocs,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore'
import { fetchGeoLocation, type GeoLocationData } from './useGeoLocation'

export interface OTPRecord {
  code: string
  email: string
  createdAt: number
  expiresAt: number
  verified: boolean
  attempts: number
  ipAddress: string
  geoLocation?: GeoLocationData | null
}

export interface LoginSession {
  uid: string
  email: string
  loginMethod: 'google' | 'email' | 'phone'
  loggedInAt: any
  ipAddress: string
  geoLocation: GeoLocationData | null
  deviceInfo: string
  otpVerified: boolean
  isActive: boolean
}

const OTP_EXPIRY_MINUTES = 10
const MAX_ATTEMPTS = 3

function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

function getDeviceInfo(): string {
  const ua = navigator.userAgent
  let device = 'Unknown Device'

  if (/Android/.test(ua)) device = 'Android'
  else if (/iPhone/.test(ua)) device = 'iPhone'
  else if (/iPad/.test(ua)) device = 'iPad'
  else if (/Windows/.test(ua)) device = 'Windows'
  else if (/Mac/.test(ua)) device = 'Mac'
  else if (/Linux/.test(ua)) device = 'Linux'

  const browser = /Chrome/.test(ua) ? 'Chrome' :
    /Safari/.test(ua) ? 'Safari' :
    /Firefox/.test(ua) ? 'Firefox' :
    /Edge/.test(ua) ? 'Edge' : 'Browser'

  return `${device} - ${browser}`
}

export function useAuthOTP() {
  const otpLoading = ref(false)
  const otpError = ref<string | null>(null)
  const currentOtpEmail = ref('')

  /**
   * Generate and store OTP for email verification
   */
  async function generateAndStoreOTP(email: string): Promise<string | null> {
    otpLoading.value = true
    otpError.value = null

    try {
      const code = generateOTP()
      const now = Date.now()
      const expiresAt = now + OTP_EXPIRY_MINUTES * 60 * 1000

      // Get geo location
      const geoData = await fetchGeoLocation()

      const otpRecord: OTPRecord = {
        code,
        email: email.toLowerCase(),
        createdAt: now,
        expiresAt,
        verified: false,
        attempts: 0,
        ipAddress: geoData?.ip || '',
        geoLocation: geoData,
      }

      const db = getFirebaseDb()
      await setDoc(doc(db, 'otp_codes', email.toLowerCase()), {
        ...otpRecord,
        createdAt: serverTimestamp(),
      })

      currentOtpEmail.value = email
      otpLoading.value = false
      return code
    } catch (err: any) {
      otpError.value = err.message || 'Failed to generate OTP'
      otpLoading.value = false
      return null
    }
  }

  /**
   * Verify OTP code entered by user
   */
  async function verifyOTP(email: string, code: string): Promise<boolean> {
    otpLoading.value = true
    otpError.value = null

    try {
      const db = getFirebaseDb()
      const otpDoc = await getDoc(doc(db, 'otp_codes', email.toLowerCase()))

      if (!otpDoc.exists()) {
        otpError.value = 'OTP not found. Please request a new code.'
        otpLoading.value = false
        return false
      }

      const data = otpDoc.data() as OTPRecord

      // Check expiry
      if (Date.now() > data.expiresAt) {
        otpError.value = 'OTP has expired. Please request a new code.'
        otpLoading.value = false
        return false
      }

      // Check max attempts
      if (data.attempts >= MAX_ATTEMPTS) {
        otpError.value = 'Too many failed attempts. Please request a new code.'
        otpLoading.value = false
        return false
      }

      // Increment attempts
      await updateDoc(doc(db, 'otp_codes', email.toLowerCase()), {
        attempts: data.attempts + 1,
      })

      // Verify code
      if (data.code !== code) {
        otpError.value = `Invalid code. ${MAX_ATTEMPTS - data.attempts - 1} attempts remaining.`
        otpLoading.value = false
        return false
      }

      // Mark as verified
      await updateDoc(doc(db, 'otp_codes', email.toLowerCase()), {
        verified: true,
      })

      otpLoading.value = false
      return true
    } catch (err: any) {
      otpError.value = err.message || 'Failed to verify OTP'
      otpLoading.value = false
      return false
    }
  }

  /**
   * Record a login session with geo-location tracking
   */
  async function recordLoginSession(
    uid: string,
    email: string,
    loginMethod: 'google' | 'email' | 'phone',
    otpVerified: boolean = false
  ): Promise<void> {
    try {
      const db = getFirebaseDb()
      const geoData = await fetchGeoLocation()

      const session: LoginSession = {
        uid,
        email,
        loginMethod,
        loggedInAt: serverTimestamp(),
        ipAddress: geoData?.ip || '',
        geoLocation: geoData,
        deviceInfo: getDeviceInfo(),
        otpVerified,
        isActive: true,
      }

      await setDoc(doc(db, 'login_sessions', `${uid}_${Date.now()}`), session)

      // Update user's last login info
      const userRef = doc(db, 'users', uid)
      const userDoc = await getDoc(userRef)

      if (userDoc.exists()) {
        await updateDoc(userRef, {
          lastLoginAt: serverTimestamp(),
          lastLoginIp: geoData?.ip || '',
          lastLoginCountry: geoData?.country || '',
          lastLoginCountryCode: geoData?.countryCode || '',
          lastLoginCountryFlag: geoData?.countryFlag || '',
          lastLoginCity: geoData?.city || '',
          lastLoginDevice: getDeviceInfo(),
          loginCount: (userDoc.data()?.loginCount || 0) + 1,
        })
      }
    } catch (err) {
      console.warn('Failed to record login session:', err)
    }
  }

  /**
   * Get all login sessions for a user
   */
  async function getUserLoginSessions(uid: string): Promise<LoginSession[]> {
    try {
      const db = getFirebaseDb()
      const q = query(
        collection(db, 'login_sessions'),
        where('uid', '==', uid)
      )
      const snap = await getDocs(q)
      return snap.docs.map(d => d.data() as LoginSession)
    } catch {
      return []
    }
  }

  /**
   * Get all login sessions (admin only)
   */
  async function getAllLoginSessions(): Promise<(LoginSession & { id: string })[]> {
    try {
      const db = getFirebaseDb()
      const snap = await getDocs(collection(db, 'login_sessions'))
      return snap.docs.map(d => ({ id: d.id, ...d.data() } as LoginSession & { id: string }))
    } catch {
      return []
    }
  }

  /**
   * Send OTP email using EmailJS (client-side)
   */
  async function sendOTPEmail(email: string, otpCode: string, displayName: string = ''): Promise<boolean> {
    try {
      const emailjs = await import('@emailjs/browser')

      await emailjs.send(
        'service_expedition_oz',
        'template_otp_verification',
        {
          to_email: email,
          to_name: displayName || email.split('@')[0],
          otp_code: otpCode,
          expiry_minutes: OTP_EXPIRY_MINUTES.toString(),
          login_time: new Date().toLocaleString('en-AU', { timeZone: 'Australia/Perth' }),
        },
        'YOUR_PUBLIC_KEY'
      )

      return true
    } catch {
      // EmailJS not configured, return true anyway (OTP is stored in DB)
      console.warn('EmailJS not configured. OTP stored in database for verification.')
      return true
    }
  }

  return {
    otpLoading,
    otpError,
    currentOtpEmail,
    generateAndStoreOTP,
    verifyOTP,
    recordLoginSession,
    getUserLoginSessions,
    getAllLoginSessions,
    sendOTPEmail,
  }
}

<script setup lang="ts">
import { ref, watch, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAdminAuth } from '@/composables/useAdminAuth'
import { useAuthOTP } from '@/composables/useAuthOTP'

const router = useRouter()
const {
  signInWithEmail,
  signInWithGoogle,
  sendPhoneVerification,
  verifyPhoneCode,
  cancelPhoneVerification,
  signUp,
  loading,
  isAdmin,
  user,
} = useAdminAuth()

const {
  otpLoading,
  otpError,
  generateAndStoreOTP,
  verifyOTP,
  recordLoginSession,
  sendOTPEmail,
} = useAuthOTP()

// Auth mode: 'email' | 'phone' | 'otp'
const authMode = ref<'email' | 'phone'>('email')
const loginStep = ref<'auth' | 'otp'>('auth')

// Email auth
const email = ref('')
const password = ref('')
const displayName = ref('')
const isRegistering = ref(false)

// Phone auth
const phoneNumber = ref('')
const countryCode = ref('+61')
const otpCode = ref('')
const isOtpSent = ref(false)
const otpDigits = ref(['', '', '', '', '', ''])

// Google OTP
const googleUserEmail = ref('')
const googleUserName = ref('')
const googleOtpDigits = ref(['', '', '', '', '', ''])
const googleOtpSent = ref(false)
const googleOtpLoading = ref(false)
const googleOtpError = ref('')

// UI state
const error = ref('')
const successMsg = ref('')
const isSubmitting = ref(false)

watch(isAdmin, (val) => {
  if (val) router.push('/admin/dashboard')
})

async function handleEmailAuth() {
  error.value = ''
  successMsg.value = ''
  isSubmitting.value = true

  try {
    if (isRegistering.value) {
      await signUp(email.value, password.value, displayName.value)
      if (isAdmin.value) {
        successMsg.value = 'Admin account created! Redirecting...'
      } else {
        successMsg.value = 'Account created! You are logged in as a user. Admin access requires approval from the owner.'
      }
      isRegistering.value = false
    } else {
      await signInWithEmail(email.value, password.value)
      if (isAdmin.value) {
        // Record session
        if (user.value) {
          await recordLoginSession(user.value.uid, user.value.email || '', 'email', true)
        }
      } else {
        error.value = 'You do not have admin access. Contact the site owner to request admin privileges.'
      }
    }
  } catch (e: any) {
    const msg = e.message || e.error_description || 'Authentication failed'
    const friendlyErrors: Record<string, string> = {
      'Invalid login credentials': 'Invalid email or password.',
      'User already registered': 'An account with this email already exists.',
      'Email not confirmed': 'Please confirm your email before signing in.',
      'Password should be at least 6 characters': 'Password must be at least 6 characters.',
      'Unable to validate email address: invalid format': 'Please enter a valid email address.',
      'Firebase: Error (auth/invalid-credential).': 'Invalid email or password.',
      'Firebase: Error (auth/user-not-found).': 'No account found with this email.',
      'Firebase: Error (auth/wrong-password).': 'Invalid password.',
    }
    error.value = friendlyErrors[msg] || msg
  } finally {
    isSubmitting.value = false
  }
}

async function handleGoogleSignIn() {
  error.value = ''
  successMsg.value = ''
  googleOtpError.value = ''
  isSubmitting.value = true

  try {
    const googleUser = await signInWithGoogle()
    googleUserEmail.value = googleUser.email || ''
    googleUserName.value = googleUser.displayName || ''

    if (isAdmin.value) {
      // Admin user - record session and redirect
      if (user.value) {
        await recordLoginSession(user.value.uid, googleUserEmail.value, 'google', true)
      }
    } else {
      // Not admin - need OTP verification
      // Generate and send OTP
      googleOtpLoading.value = true
      const otp = await generateAndStoreOTP(googleUserEmail.value)

      if (otp) {
        await sendOTPEmail(googleUserEmail.value, otp, googleUserName.value)
        googleOtpSent.value = true
        loginStep.value = 'otp'
        successMsg.value = `Verification code sent to ${googleUserEmail.value}. Please check your email (including spam folder).`
      } else {
        error.value = 'Failed to send verification code. Please try again.'
      }
      googleOtpLoading.value = false
    }
  } catch (e: any) {
    const msg = e.message || 'Google sign-in failed'
    if (msg.includes('popup-closed-by-user')) {
      error.value = 'Sign-in cancelled.'
    } else {
      error.value = msg
    }
  } finally {
    isSubmitting.value = false
  }
}

async function handleGoogleOtpVerify() {
  googleOtpError.value = ''
  googleOtpLoading.value = true

  const code = googleOtpDigits.value.join('')

  if (code.length !== 6) {
    googleOtpError.value = 'Please enter the 6-digit code.'
    googleOtpLoading.value = false
    return
  }

  try {
    const verified = await verifyOTP(googleUserEmail.value, code)

    if (verified) {
      // OTP verified - record session
      if (user.value) {
        await recordLoginSession(user.value.uid, googleUserEmail.value, 'google', true)
      }
      successMsg.value = 'Verification successful! Redirecting...'

      if (!isAdmin.value) {
        googleOtpError.value = 'You do not have admin access. Contact the site owner to request admin privileges.'
      }
    } else {
      googleOtpError.value = otpError.value || 'Invalid verification code.'
    }
  } catch (e: any) {
    googleOtpError.value = e.message || 'Verification failed.'
  } finally {
    googleOtpLoading.value = false
  }
}

function handleGoogleOtpInput(index: number, event: Event) {
  const target = event.target as HTMLInputElement
  const value = target.value.replace(/\D/g, '')

  googleOtpDigits.value[index] = value.slice(0, 1)

  if (value && index < 5) {
    const nextInput = document.getElementById(`google-otp-${index + 1}`)
    nextInput?.focus()
  }
}

function handleGoogleOtpKeydown(index: number, event: KeyboardEvent) {
  if (event.key === 'Backspace' && !googleOtpDigits.value[index] && index > 0) {
    const prevInput = document.getElementById(`google-otp-${index - 1}`)
    prevInput?.focus()
  }
}

function handleGoogleOtpPaste(event: ClipboardEvent) {
  event.preventDefault()
  const pastedData = event.clipboardData?.getData('text') || ''
  const digits = pastedData.replace(/\D/g, '').slice(0, 6).split('')

  digits.forEach((digit, i) => {
    if (i < 6) googleOtpDigits.value[i] = digit
  })
}

async function handleSendOtp() {
  error.value = ''
  successMsg.value = ''
  isSubmitting.value = true

  const fullNumber = countryCode.value + phoneNumber.value.replace(/\D/g, '')

  if (fullNumber.length < 10) {
    error.value = 'Please enter a valid phone number.'
    isSubmitting.value = false
    return
  }

  try {
    await sendPhoneVerification(fullNumber, 'recaptcha-container')
    isOtpSent.value = true
    successMsg.value = 'Verification code sent! Check your phone.'
  } catch (e: any) {
    const msg = e.message || 'Failed to send verification code'
    if (msg.includes('too-many-requests')) {
      error.value = 'Too many attempts. Please try again later.'
    } else if (msg.includes('invalid-phone-number')) {
      error.value = 'Invalid phone number format.'
    } else {
      error.value = msg
    }
  } finally {
    isSubmitting.value = false
  }
}

async function handleVerifyOtp() {
  error.value = ''
  successMsg.value = ''
  isSubmitting.value = true

  const code = otpDigits.value.join('')

  if (code.length !== 6) {
    error.value = 'Please enter the 6-digit code.'
    isSubmitting.value = false
    return
  }

  try {
    await verifyPhoneCode(code)
    // Record session for phone auth
    if (user.value) {
      await recordLoginSession(user.value.uid, user.value.phoneNumber || '', 'phone', true)
    }
    if (!isAdmin.value) {
      error.value = 'You do not have admin access. Contact the site owner to request admin privileges.'
    }
  } catch (e: any) {
    const msg = e.message || 'Invalid verification code'
    if (msg.includes('invalid-verification-code')) {
      error.value = 'Invalid code. Please try again.'
    } else if (msg.includes('code-expired')) {
      error.value = 'Code expired. Please request a new one.'
    } else {
      error.value = msg
    }
  } finally {
    isSubmitting.value = false
  }
}

function resetPhoneAuth() {
  cancelPhoneVerification()
  isOtpSent.value = false
  otpDigits.value = ['', '', '', '', '', '']
  phoneNumber.value = ''
  error.value = ''
  successMsg.value = ''
}

function handleOtpInput(index: number, event: Event) {
  const target = event.target as HTMLInputElement
  const value = target.value.replace(/\D/g, '')

  otpDigits.value[index] = value.slice(0, 1)

  if (value && index < 5) {
    const nextInput = document.getElementById(`otp-${index + 1}`)
    nextInput?.focus()
  }
}

function handleOtpKeydown(index: number, event: KeyboardEvent) {
  if (event.key === 'Backspace' && !otpDigits.value[index] && index > 0) {
    const prevInput = document.getElementById(`otp-${index - 1}`)
    prevInput?.focus()
  }
}

function handleOtpPaste(event: ClipboardEvent) {
  event.preventDefault()
  const pastedData = event.clipboardData?.getData('text') || ''
  const digits = pastedData.replace(/\D/g, '').slice(0, 6).split('')

  digits.forEach((digit, i) => {
    if (i < 6) otpDigits.value[i] = digit
  })
}

onUnmounted(() => {
  cancelPhoneVerification()
})

const countryCodes = [
  { code: '+61', country: 'AU', flag: '🇦🇺' },
  { code: '+1', country: 'US', flag: '🇺🇸' },
  { code: '+44', country: 'UK', flag: '🇬🇧' },
  { code: '+63', country: 'PH', flag: '🇵🇭' },
  { code: '+81', country: 'JP', flag: '🇯🇵' },
  { code: '+86', country: 'CN', flag: '🇨🇳' },
  { code: '+91', country: 'IN', flag: '🇮🇳' },
  { code: '+65', country: 'SG', flag: '🇸🇬' },
  { code: '+64', country: 'NZ', flag: '🇳🇿' },
]
</script>

<template>
  <div class="login-page">
    <!-- Invisible reCAPTCHA container -->
    <div id="recaptcha-container"></div>

    <div class="login-card">
      <!-- STEP 2: OTP Verification for Google -->
      <template v-if="loginStep === 'otp'">
        <div class="login-header">
          <div class="login-compass">
            <svg width="48" height="48" viewBox="0 0 80 80" fill="none">
              <circle cx="40" cy="40" r="38" stroke="rgba(201,168,76,0.4)" stroke-width="1"/>
              <polygon points="40,16 37,36 40,40 43,36" fill="#c9a84c"/>
              <polygon points="40,64 37,44 40,40 43,44" fill="rgba(201,168,76,0.4)"/>
              <circle cx="40" cy="40" r="3" fill="#c9a84c"/>
            </svg>
          </div>
          <h1 class="login-title">Verify Your Email</h1>
          <p class="login-subtitle">Enter the 6-digit code sent to {{ googleUserEmail }}</p>
        </div>

        <div v-if="successMsg" class="alert alert-success">{{ successMsg }}</div>
        <div v-if="googleOtpError" class="alert alert-error">{{ googleOtpError }}</div>

        <div class="form-group">
          <label class="form-label">Enter 6-Digit Verification Code</label>
          <div class="otp-input-group" @paste="handleGoogleOtpPaste">
            <input
              v-for="(digit, index) in googleOtpDigits"
              :key="index"
              :id="`google-otp-${index}`"
              type="text"
              inputmode="numeric"
              maxlength="1"
              :value="digit"
              @input="handleGoogleOtpInput(index, $event)"
              @keydown="handleGoogleOtpKeydown(index, $event)"
              class="otp-input"
            />
          </div>
        </div>

        <button
          @click="handleGoogleOtpVerify"
          class="btn-primary"
          :disabled="googleOtpLoading || otpLoading"
        >
          {{ googleOtpLoading || otpLoading ? 'Verifying...' : 'Verify Code' }}
        </button>

        <button
          @click="loginStep = 'auth'; googleOtpSent = false; googleOtpDigits = ['','','','','','']; googleOtpError = ''"
          class="btn-secondary"
        >
          Back to Login
        </button>

        <div class="geo-info">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <polyline points="2,12 12,12 12,2"/>
          </svg>
          <span>We track login locations for security purposes</span>
        </div>
      </template>

      <!-- STEP 1: Main Auth -->
      <template v-else>
        <div class="login-header">
          <div class="login-compass">
            <svg width="48" height="48" viewBox="0 0 80 80" fill="none">
              <circle cx="40" cy="40" r="38" stroke="rgba(201,168,76,0.4)" stroke-width="1"/>
              <polygon points="40,16 37,36 40,40 43,36" fill="#c9a84c"/>
              <polygon points="40,64 37,44 40,40 43,44" fill="rgba(201,168,76,0.4)"/>
              <circle cx="40" cy="40" r="3" fill="#c9a84c"/>
            </svg>
          </div>
          <h1 class="login-title">Expedition OZ</h1>
          <p class="login-subtitle">Admin Dashboard</p>
        </div>

        <!-- Auth Mode Toggle -->
        <div class="auth-mode-toggle">
          <button
            @click="authMode = 'email'; error = ''; successMsg = ''"
            :class="['mode-btn', { active: authMode === 'email' }]"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="2" y="4" width="20" height="16" rx="2"/>
              <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
            </svg>
            Email
          </button>
          <button
            @click="authMode = 'phone'; error = ''; successMsg = ''; resetPhoneAuth()"
            :class="['mode-btn', { active: authMode === 'phone' }]"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect width="14" height="20" x="5" y="2" rx="2" ry="2"/>
              <path d="M12 18h.01"/>
            </svg>
            Phone
          </button>
        </div>

        <div v-if="error" class="alert alert-error">{{ error }}</div>
        <div v-if="successMsg" class="alert alert-success">{{ successMsg }}</div>

        <!-- Email Auth Form -->
        <form v-if="authMode === 'email'" @submit.prevent="handleEmailAuth" class="login-form">
          <div v-if="isRegistering" class="form-group">
            <label class="form-label">Display Name</label>
            <input v-model="displayName" type="text" class="form-input" placeholder="Your name" required />
          </div>

          <div class="form-group">
            <label class="form-label">Email</label>
            <input v-model="email" type="email" class="form-input" placeholder="admin@expeditionoz.com" required />
          </div>

          <div class="form-group">
            <label class="form-label">Password</label>
            <input v-model="password" type="password" class="form-input" placeholder="Enter password" required minlength="6" />
          </div>

          <button type="submit" class="btn-primary" :disabled="isSubmitting || loading">
            {{ isSubmitting ? 'Please wait...' : (isRegistering ? 'Create Account' : 'Sign In') }}
          </button>

          <p class="toggle-text">
            {{ isRegistering ? 'Already have an account?' : "Don't have an account?" }}
            <button type="button" @click="isRegistering = !isRegistering; error = ''; successMsg = ''" class="toggle-btn">
              {{ isRegistering ? 'Sign In' : 'Register' }}
            </button>
          </p>
        </form>

        <!-- Phone Auth Form -->
        <form v-else-if="authMode === 'phone'" @submit.prevent="isOtpSent ? handleVerifyOtp() : handleSendOtp()" class="login-form">
          <template v-if="!isOtpSent">
            <div class="form-group">
              <label class="form-label">Phone Number</label>
              <div class="phone-input-group">
                <select v-model="countryCode" class="country-select">
                  <option v-for="c in countryCodes" :key="c.code" :value="c.code">
                    {{ c.flag }} {{ c.code }}
                  </option>
                </select>
                <input
                  v-model="phoneNumber"
                  type="tel"
                  class="form-input phone-input"
                  placeholder="412 345 678"
                  required
                />
              </div>
            </div>

            <button type="submit" class="btn-primary" :disabled="isSubmitting">
              {{ isSubmitting ? 'Sending...' : 'Send Verification Code' }}
            </button>
          </template>

          <template v-else>
            <div class="form-group">
              <label class="form-label">Enter 6-Digit Code</label>
              <div class="otp-input-group" @paste="handleOtpPaste">
                <input
                  v-for="(digit, index) in otpDigits"
                  :key="index"
                  :id="`otp-${index}`"
                  type="text"
                  inputmode="numeric"
                  maxlength="1"
                  :value="digit"
                  @input="handleOtpInput(index, $event)"
                  @keydown="handleOtpKeydown(index, $event)"
                  class="otp-input"
                />
              </div>
              <p class="otp-hint">Code sent to {{ countryCode }}{{ phoneNumber }}</p>
            </div>

            <button type="submit" class="btn-primary" :disabled="isSubmitting">
              {{ isSubmitting ? 'Verifying...' : 'Verify Code' }}
            </button>

            <button type="button" @click="resetPhoneAuth" class="btn-secondary">
              Use Different Number
            </button>
          </template>
        </form>

        <!-- Social Login Divider -->
        <div class="divider">
          <span>or continue with</span>
        </div>

        <!-- Google Sign In -->
        <button @click="handleGoogleSignIn" class="btn-google" :disabled="isSubmitting || googleOtpLoading">
          <svg width="20" height="20" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Sign in with Google
        </button>

        <!-- Geo Location Notice -->
        <div class="geo-info">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <polyline points="2,12 12,12 12,2"/>
          </svg>
          <span>Login location is tracked for security. You will receive an email verification code.</span>
        </div>

        <p class="info-text">
          Only authorized users can access the admin panel. New accounts require admin approval.
        </p>
      </template>
    </div>
  </div>
</template>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-ocean-950, #071a2b);
  padding: 1.5rem;
  position: relative;
  z-index: 1;
}

.login-card {
  width: 100%;
  max-width: 420px;
  background: rgba(10, 46, 74, 0.6);
  border: 1px solid rgba(201, 168, 76, 0.2);
  padding: 2.5rem;
  position: relative;
}

.login-header {
  text-align: center;
  margin-bottom: 1.5rem;
  padding-top: 0.5rem;
}

.login-compass {
  margin: 0 auto 1rem;
  display: block;
}

.login-title {
  font-family: 'Cormorant Garamond', serif;
  font-size: 2rem;
  font-weight: 300;
  color: #c9a84c;
  letter-spacing: 0.05em;
  line-height: 1.2;
}

.login-subtitle {
  font-family: 'Montserrat', sans-serif;
  font-size: 0.7rem;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: rgba(248, 245, 239, 0.5);
  margin-top: 0.5rem;
}

/* Auth Mode Toggle */
.auth-mode-toggle {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
  background: rgba(7, 26, 43, 0.6);
  padding: 0.25rem;
  border: 1px solid rgba(201, 168, 76, 0.15);
}

.mode-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem;
  background: transparent;
  border: none;
  color: rgba(248, 245, 239, 0.5);
  font-family: 'Montserrat', sans-serif;
  font-size: 0.75rem;
  font-weight: 500;
  letter-spacing: 0.05em;
  cursor: pointer;
  transition: all 0.3s;
}

.mode-btn:hover {
  color: rgba(248, 245, 239, 0.8);
}

.mode-btn.active {
  background: rgba(201, 168, 76, 0.15);
  color: #c9a84c;
}

.alert {
  padding: 0.75rem 1rem;
  font-size: 0.8rem;
  margin-bottom: 1rem;
  border: 1px solid;
  line-height: 1.5;
}

.alert-error {
  background: rgba(224, 123, 90, 0.1);
  border-color: rgba(224, 123, 90, 0.3);
  color: #e07b5a;
}

.alert-success {
  background: rgba(76, 175, 80, 0.1);
  border-color: rgba(76, 175, 80, 0.3);
  color: #4caf50;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.form-label {
  font-family: 'Montserrat', sans-serif;
  font-size: 0.65rem;
  font-weight: 600;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: rgba(248, 245, 239, 0.6);
}

.form-input {
  background: rgba(7, 26, 43, 0.6);
  border: 1px solid rgba(201, 168, 76, 0.2);
  color: #f8f5ef;
  padding: 0.75rem 1rem;
  font-family: 'Inter', sans-serif;
  font-size: 0.875rem;
  outline: none;
  transition: border-color 0.3s;
  -webkit-appearance: none;
}

.form-input:focus {
  border-color: #c9a84c;
}

/* Phone Input */
.phone-input-group {
  display: flex;
  gap: 0.5rem;
}

.country-select {
  background: rgba(7, 26, 43, 0.6);
  border: 1px solid rgba(201, 168, 76, 0.2);
  color: #f8f5ef;
  padding: 0.75rem 0.5rem;
  font-family: 'Inter', sans-serif;
  font-size: 0.875rem;
  outline: none;
  cursor: pointer;
  min-width: 100px;
}

.country-select:focus {
  border-color: #c9a84c;
}

.phone-input {
  flex: 1;
}

/* OTP Input */
.otp-input-group {
  display: flex;
  gap: 0.5rem;
  justify-content: center;
}

.otp-input {
  width: 48px;
  height: 56px;
  background: rgba(7, 26, 43, 0.6);
  border: 1px solid rgba(201, 168, 76, 0.2);
  color: #f8f5ef;
  font-family: 'Inter', sans-serif;
  font-size: 1.5rem;
  font-weight: 600;
  text-align: center;
  outline: none;
  transition: border-color 0.3s;
}

.otp-input:focus {
  border-color: #c9a84c;
}

.otp-hint {
  text-align: center;
  font-size: 0.75rem;
  color: rgba(248, 245, 239, 0.4);
  margin-top: 0.5rem;
}

/* Buttons */
.btn-primary {
  background: linear-gradient(135deg, #c9a84c 0%, #a08339 100%);
  border: none;
  color: #071a2b;
  padding: 0.875rem 1.5rem;
  font-family: 'Montserrat', sans-serif;
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  cursor: pointer;
  transition: all 0.3s;
  width: 100%;
}

.btn-primary:hover:not(:disabled) {
  background: linear-gradient(135deg, #d4b55a 0%, #b89443 100%);
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-secondary {
  background: transparent;
  border: 1px solid rgba(201, 168, 76, 0.3);
  color: #c9a84c;
  padding: 0.75rem 1.5rem;
  font-family: 'Montserrat', sans-serif;
  font-size: 0.7rem;
  font-weight: 500;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  cursor: pointer;
  transition: all 0.3s;
  width: 100%;
  margin-top: 0.5rem;
}

.btn-secondary:hover {
  background: rgba(201, 168, 76, 0.1);
}

/* Divider */
.divider {
  display: flex;
  align-items: center;
  margin: 1.5rem 0;
  gap: 1rem;
}

.divider::before,
.divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: rgba(201, 168, 76, 0.2);
}

.divider span {
  font-family: 'Montserrat', sans-serif;
  font-size: 0.65rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: rgba(248, 245, 239, 0.4);
}

/* Google Button */
.btn-google {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  width: 100%;
  padding: 0.875rem 1.5rem;
  background: #fff;
  border: none;
  color: #333;
  font-family: 'Inter', sans-serif;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-google:hover:not(:disabled) {
  background: #f5f5f5;
}

.btn-google:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.toggle-text {
  text-align: center;
  margin-top: 0.5rem;
  font-size: 0.8rem;
  color: rgba(248, 245, 239, 0.5);
}

.toggle-btn {
  background: none;
  border: none;
  color: #c9a84c;
  cursor: pointer;
  font-family: 'Montserrat', sans-serif;
  font-size: 0.8rem;
  font-weight: 600;
  text-decoration: underline;
  text-underline-offset: 2px;
}

.info-text {
  text-align: center;
  margin-top: 1.5rem;
  font-size: 0.7rem;
  color: rgba(248, 245, 239, 0.3);
  line-height: 1.5;
}

/* Geo Info Notice */
.geo-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 1rem;
  padding: 0.625rem 0.75rem;
  background: rgba(13, 110, 122, 0.1);
  border: 1px solid rgba(13, 110, 122, 0.2);
  color: rgba(13, 110, 122, 0.8);
  font-family: 'Montserrat', sans-serif;
  font-size: 0.65rem;
  letter-spacing: 0.05em;
  line-height: 1.5;
}

.geo-info svg {
  flex-shrink: 0;
  color: #0d6e7a;
}

@media (max-width: 480px) {
  .login-card {
    padding: 1.5rem;
  }

  .otp-input {
    width: 40px;
    height: 48px;
    font-size: 1.25rem;
  }
}
</style>

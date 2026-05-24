<script setup lang="ts">
import { ref, computed } from 'vue'
import { getFirebaseDb, initFirebase } from '@/lib/firebase'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { useEmail } from '@/composables/useEmail'

const props = defineProps<{
  tripId?: string
  tripName?: string
  showSuccess?: boolean
}>()

const emit = defineEmits<{
  (e: 'submitted'): void
}>()

const fullName = ref('')
const email = ref('')
const phone = ref('')
const selectedDate = ref('')
const participants = ref(1)
const specialRequirements = ref('')
const submitting = ref(false)
const submitted = ref(false)
const error = ref('')

const { sendBookingEmails } = useEmail()

const tripNameDisplay = computed(() => props.tripName || 'Expedition')

// Generate date options for the next 12 months
const dateOptions = computed(() => {
  const options: string[] = []
  const today = new Date()
  for (let i = 1; i <= 12; i++) {
    const date = new Date(today.getFullYear(), today.getMonth() + i, 1)
    options.push(date.toISOString().split('T')[0])
  }
  return options
})

async function handleSubmit() {
  error.value = ''
  
  if (!fullName.value.trim() || !email.value.trim() || !phone.value.trim()) {
    error.value = 'Please fill in all required fields'
    return
  }

  if (!selectedDate.value) {
    error.value = 'Please select a preferred date'
    return
  }

  submitting.value = true

  try {
    initFirebase()
    const db = getFirebaseDb()

    await addDoc(collection(db, 'bookings'), {
      fullName: fullName.value.trim(),
      email: email.value.trim().toLowerCase(),
      phone: phone.value.trim(),
      tripId: props.tripId || 'general',
      tripName: props.tripName || 'General Inquiry',
      selectedDate: new Date(selectedDate.value),
      participants: participants.value,
      specialRequirements: specialRequirements.value.trim(),
      status: 'pending',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })

    // Send email notifications (non-blocking)
    const formattedDate = new Date(selectedDate.value).toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric',
    })

    sendBookingEmails({
      fullName: fullName.value.trim(),
      email: email.value.trim().toLowerCase(),
      phone: phone.value.trim(),
      tripName: props.tripName || 'General Inquiry',
      selectedDate: formattedDate,
      participants: participants.value,
      specialRequirements: specialRequirements.value.trim(),
    }).catch(console.error)

    submitted.value = true
    emit('submitted')

    // Reset form
    fullName.value = ''
    email.value = ''
    phone.value = ''
    selectedDate.value = ''
    participants.value = 1
    specialRequirements.value = ''
  } catch (e: any) {
    error.value = e.message || 'Failed to submit booking. Please try again.'
  }

  submitting.value = false
}

function resetForm() {
  submitted.value = false
  error.value = ''
}
</script>

<template>
  <div class="booking-form-container">
    <div v-if="submitted && showSuccess !== false" class="success-message">
      <div class="success-icon">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#4caf50" stroke-width="2">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
          <polyline points="22 4 12 14.01 9 11.01"/>
        </svg>
      </div>
      <h3 class="success-title">Booking Request Submitted</h3>
      <p class="success-text">
        Thank you for your interest in {{ tripNameDisplay }}! We have received your booking request and will contact you within 24-48 hours to confirm availability and discuss details.
      </p>
      <button @click="resetForm" class="btn-secondary">Submit Another Request</button>
    </div>

    <form v-else @submit.prevent="handleSubmit" class="booking-form">
      <h3 class="form-title">Book Your Adventure</h3>
      <p class="form-subtitle">Fill out the form below and we will get back to you shortly.</p>

      <div v-if="error" class="error-message">{{ error }}</div>

      <div class="form-grid">
        <div class="form-group">
          <label class="form-label">Full Name <span class="required">*</span></label>
          <input
            v-model="fullName"
            type="text"
            class="form-input"
            placeholder="Your full name"
            required
          />
        </div>

        <div class="form-group">
          <label class="form-label">Email <span class="required">*</span></label>
          <input
            v-model="email"
            type="email"
            class="form-input"
            placeholder="your@email.com"
            required
          />
        </div>

        <div class="form-group">
          <label class="form-label">Phone <span class="required">*</span></label>
          <input
            v-model="phone"
            type="tel"
            class="form-input"
            placeholder="+1 234 567 8900"
            required
          />
        </div>

        <div class="form-group">
          <label class="form-label">Number of Participants <span class="required">*</span></label>
          <select v-model="participants" class="form-input">
            <option v-for="n in 20" :key="n" :value="n">{{ n }} {{ n === 1 ? 'person' : 'people' }}</option>
          </select>
        </div>

        <div class="form-group full-width">
          <label class="form-label">Preferred Month <span class="required">*</span></label>
          <select v-model="selectedDate" class="form-input" required>
            <option value="">Select a month</option>
            <option v-for="date in dateOptions" :key="date" :value="date">
              {{ new Date(date).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) }}
            </option>
          </select>
        </div>

        <div class="form-group full-width">
          <label class="form-label">Special Requirements</label>
          <textarea
            v-model="specialRequirements"
            class="form-textarea"
            placeholder="Any dietary requirements, accessibility needs, or special requests..."
            rows="4"
          ></textarea>
        </div>
      </div>

      <button type="submit" class="submit-btn" :disabled="submitting">
        {{ submitting ? 'Submitting...' : 'Submit Booking Request' }}
      </button>

      <p class="form-note">
        By submitting this form, you agree to be contacted regarding your booking request. No payment is required at this stage.
      </p>
    </form>
  </div>
</template>

<style scoped>
.booking-form-container {
  max-width: 600px;
  margin: 0 auto;
}

.booking-form {
  background: rgba(10, 46, 74, 0.6);
  border: 1px solid rgba(201, 168, 76, 0.2);
  padding: 2rem;
}

.form-title {
  font-family: 'Cormorant Garamond', serif;
  font-size: 1.75rem;
  font-weight: 300;
  color: #c9a84c;
  margin-bottom: 0.5rem;
  text-align: center;
}

.form-subtitle {
  font-size: 0.85rem;
  color: rgba(248, 245, 239, 0.6);
  text-align: center;
  margin-bottom: 1.5rem;
}

.error-message {
  background: rgba(224, 123, 90, 0.1);
  border: 1px solid rgba(224, 123, 90, 0.3);
  color: #e07b5a;
  padding: 0.75rem 1rem;
  font-size: 0.8rem;
  margin-bottom: 1rem;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.full-width {
  grid-column: span 2;
}

.form-label {
  font-family: 'Montserrat', sans-serif;
  font-size: 0.65rem;
  font-weight: 600;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: rgba(248, 245, 239, 0.6);
}

.required {
  color: #c9a84c;
}

.form-input,
.form-textarea {
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

.form-input:focus,
.form-textarea:focus {
  border-color: #c9a84c;
}

.form-textarea {
  resize: vertical;
  min-height: 100px;
}

.form-input::placeholder,
.form-textarea::placeholder {
  color: rgba(248, 245, 239, 0.3);
}

select.form-input {
  cursor: pointer;
}

.submit-btn {
  width: 100%;
  padding: 1rem;
  background: #c9a84c;
  border: 1px solid #c9a84c;
  color: #071a2b;
  font-family: 'Montserrat', sans-serif;
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  cursor: pointer;
  transition: all 0.3s;
}

.submit-btn:hover:not(:disabled) {
  background: #e8c05a;
}

.submit-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.form-note {
  font-size: 0.7rem;
  color: rgba(248, 245, 239, 0.35);
  text-align: center;
  margin-top: 1rem;
  line-height: 1.5;
}

/* Success State */
.success-message {
  text-align: center;
  padding: 3rem 2rem;
  background: rgba(10, 46, 74, 0.6);
  border: 1px solid rgba(76, 175, 80, 0.3);
}

.success-icon {
  margin-bottom: 1.5rem;
}

.success-title {
  font-family: 'Cormorant Garamond', serif;
  font-size: 1.5rem;
  font-weight: 300;
  color: #4caf50;
  margin-bottom: 1rem;
}

.success-text {
  font-size: 0.9rem;
  color: rgba(248, 245, 239, 0.7);
  line-height: 1.7;
  margin-bottom: 1.5rem;
}

.btn-secondary {
  padding: 0.75rem 1.5rem;
  background: transparent;
  border: 1px solid rgba(201, 168, 76, 0.3);
  color: #c9a84c;
  font-family: 'Montserrat', sans-serif;
  font-size: 0.7rem;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-secondary:hover {
  background: rgba(201, 168, 76, 0.1);
  border-color: #c9a84c;
}

@media (max-width: 640px) {
  .form-grid {
    grid-template-columns: 1fr;
  }

  .full-width {
    grid-column: span 1;
  }

  .booking-form {
    padding: 1.5rem;
  }
}
</style>

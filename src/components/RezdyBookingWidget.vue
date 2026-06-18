<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import {
  useRezdyBooking,
  type RezdySession,
  type RezdyPriceOption,
  type RezdyProduct,
} from '@/composables/useRezdyBooking'

const props = defineProps<{
  slug: string // 'ocean-safari' | 'dive-expedition'
}>()

const { loadingProduct, loadingAvailability, submitting, errorMessage, fetchProduct, fetchAvailability, createBooking, isMockMode } =
  useRezdyBooking()

const product = ref<RezdyProduct | null>(null)
const sessions = ref<RezdySession[]>([])
const selectedSession = ref<RezdySession | null>(null)
const selectedOption = ref<RezdyPriceOption | null>(null)
const quantity = ref(1)

const step = ref<'dates' | 'details' | 'confirmed'>('dates')

const customer = ref({ firstName: '', lastName: '', email: '', phone: '' })
const comments = ref('')
const formError = ref('')
const orderNumber = ref('')

async function load() {
  const [p, s] = await Promise.all([fetchProduct(props.slug), fetchAvailability(props.slug)])
  product.value = p
  sessions.value = s
  if (p && p.priceOptions.length) selectedOption.value = p.priceOptions[0]
}

onMounted(load)
watch(() => props.slug, load)

const groupedByMonth = computed(() => {
  const groups: Record<string, RezdySession[]> = {}
  for (const s of sessions.value) {
    const d = new Date(s.startTimeLocal.replace(' ', 'T'))
    const key = d.toLocaleDateString('en-AU', { month: 'long', year: 'numeric' })
    if (!groups[key]) groups[key] = []
    groups[key].push(s)
  }
  return groups
})

function formatRange(session: RezdySession): string {
  const start = new Date(session.startTimeLocal.replace(' ', 'T'))
  const end = new Date(session.endTimeLocal.replace(' ', 'T'))
  const startStr = start.toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })
  const endStr = end.toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })
  return `${startStr} — ${endStr}`
}

function seatStatus(session: RezdySession): { label: string; tone: 'good' | 'low' | 'full' } {
  if (session.seatsAvailable <= 0) return { label: 'Fully booked', tone: 'full' }
  if (session.seatsAvailable <= 4) return { label: `${session.seatsAvailable} berths left`, tone: 'low' }
  return { label: `${session.seatsAvailable} berths available`, tone: 'good' }
}

function selectSession(s: RezdySession) {
  if (s.seatsAvailable <= 0) return
  selectedSession.value = s
}

const totalPrice = computed(() => {
  if (!selectedOption.value) return 0
  return selectedOption.value.price * quantity.value
})

const maxQuantity = computed(() => {
  if (!selectedSession.value) return 1
  return Math.max(1, Math.min(selectedSession.value.seatsAvailable, 10))
})

function goToDetails() {
  if (!selectedSession.value || !selectedOption.value) {
    formError.value = 'Please select a departure date.'
    return
  }
  formError.value = ''
  step.value = 'details'
}

async function submitBooking() {
  formError.value = ''
  if (!customer.value.firstName.trim() || !customer.value.lastName.trim() || !customer.value.email.trim() || !customer.value.phone.trim()) {
    formError.value = 'Please complete all required fields.'
    return
  }
  if (!selectedSession.value || !selectedOption.value) return

  const result = await createBooking({
    slug: props.slug,
    session: selectedSession.value,
    priceOption: selectedOption.value,
    quantity: quantity.value,
    customer: customer.value,
    comments: comments.value,
  })

  if (result.success) {
    orderNumber.value = result.orderNumber || ''
    step.value = 'confirmed'
  } else {
    formError.value = result.error || 'Something went wrong. Please try again or contact us directly.'
  }
}

function backToDates() {
  step.value = 'dates'
  formError.value = ''
}

function startOver() {
  step.value = 'dates'
  selectedSession.value = null
  customer.value = { firstName: '', lastName: '', email: '', phone: '' }
  comments.value = ''
  orderNumber.value = ''
}
</script>

<template>
  <div class="rezdy-widget">
    <div v-if="isMockMode" class="mock-banner">
      Preview mode — showing sample departures. Connect your Rezdy API key to display live availability.
    </div>

    <!-- STEP 1: choose departure -->
    <div v-if="step === 'dates'" class="step-panel">
      <div class="panel-header">
        <span class="eyebrow">Departure Manifest</span>
        <h3 class="panel-title">{{ product?.name || 'Loading expedition…' }}</h3>
      </div>

      <div v-if="loadingProduct || loadingAvailability" class="loading-state">
        <div class="loader-ring"></div>
        <span>Checking live availability…</span>
      </div>

      <div v-else-if="sessions.length === 0" class="empty-state">
        No upcoming departures are open for booking right now. Reach out and we'll let you know the next release date.
      </div>

      <template v-else>
        <div v-for="(group, month) in groupedByMonth" :key="month" class="month-group">
          <div class="month-label">{{ month }}</div>
          <div class="session-list">
            <button
              v-for="session in group"
              :key="session.id"
              type="button"
              class="session-row"
              :class="{
                selected: selectedSession?.id === session.id,
                disabled: session.seatsAvailable <= 0,
              }"
              :disabled="session.seatsAvailable <= 0"
              @click="selectSession(session)"
            >
              <span class="session-dates">{{ formatRange(session) }}</span>
              <span class="session-status" :class="seatStatus(session).tone">
                {{ seatStatus(session).label }}
              </span>
            </button>
          </div>
        </div>

        <div v-if="product && product.priceOptions.length" class="option-section">
          <div class="option-label">Berth type</div>
          <div class="option-list">
            <button
              v-for="opt in product.priceOptions"
              :key="opt.id"
              type="button"
              class="option-pill"
              :class="{ selected: selectedOption?.id === opt.id }"
              @click="selectedOption = opt"
            >
              {{ opt.label }} — ${{ opt.price.toLocaleString() }}
            </button>
          </div>
        </div>

        <div v-if="selectedSession" class="quantity-row">
          <span class="option-label">Guests</span>
          <div class="quantity-stepper">
            <button type="button" @click="quantity = Math.max(1, quantity - 1)" :disabled="quantity <= 1">−</button>
            <span>{{ quantity }}</span>
            <button type="button" @click="quantity = Math.min(maxQuantity, quantity + 1)" :disabled="quantity >= maxQuantity">+</button>
          </div>
        </div>

        <p v-if="formError" class="form-error">{{ formError }}</p>

        <div class="summary-row" v-if="selectedSession && selectedOption">
          <span>Total</span>
          <span class="summary-price">${{ totalPrice.toLocaleString() }} AUD</span>
        </div>

        <button type="button" class="btn-gold full-width" @click="goToDetails" :disabled="!selectedSession">
          Continue to Details
        </button>
      </template>
    </div>

    <!-- STEP 2: guest details -->
    <div v-else-if="step === 'details'" class="step-panel">
      <div class="panel-header">
        <span class="eyebrow">Guest Details</span>
        <h3 class="panel-title">{{ product?.name }}</h3>
        <p class="selected-summary" v-if="selectedSession">
          {{ formatRange(selectedSession) }} · {{ selectedOption?.label }} × {{ quantity }}
        </p>
      </div>

      <form class="details-form" @submit.prevent="submitBooking">
        <div class="form-grid">
          <label class="field">
            <span>First name *</span>
            <input v-model="customer.firstName" type="text" required />
          </label>
          <label class="field">
            <span>Last name *</span>
            <input v-model="customer.lastName" type="text" required />
          </label>
        </div>
        <div class="form-grid">
          <label class="field">
            <span>Email *</span>
            <input v-model="customer.email" type="email" required />
          </label>
          <label class="field">
            <span>Phone *</span>
            <input v-model="customer.phone" type="tel" required />
          </label>
        </div>
        <label class="field full">
          <span>Special requirements (optional)</span>
          <textarea v-model="comments" rows="3"></textarea>
        </label>

        <p v-if="formError" class="form-error">{{ formError }}</p>

        <div class="summary-row">
          <span>Total due</span>
          <span class="summary-price">${{ totalPrice.toLocaleString() }} AUD</span>
        </div>

        <div class="button-row">
          <button type="button" class="btn-link-back" @click="backToDates">← Back</button>
          <button type="submit" class="btn-gold" :disabled="submitting">
            {{ submitting ? 'Submitting…' : 'Confirm Booking' }}
          </button>
        </div>
      </form>
    </div>

    <!-- STEP 3: confirmation -->
    <div v-else class="step-panel confirmed-panel">
      <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#c9a84c" stroke-width="1.5">
        <circle cx="12" cy="12" r="10" />
        <path d="M8 12.5L10.8 15L16 9" stroke-linecap="round" stroke-linejoin="round" />
      </svg>
      <h3 class="panel-title">Booking Confirmed</h3>
      <p class="confirmed-text">
        Your berth aboard the {{ product?.name }} departing {{ selectedSession ? formatRange(selectedSession) : '' }} is reserved.
        A confirmation has been sent to {{ customer.email }}.
      </p>
      <p v-if="orderNumber" class="order-number">Order reference: {{ orderNumber }}</p>
      <button type="button" class="btn-link-back" @click="startOver">Book another departure</button>
    </div>
  </div>
</template>

<style scoped>
.rezdy-widget {
  background: #041a2b;
  border: 1px solid rgba(201, 168, 76, 0.35);
  border-radius: 6px;
  padding: 2rem;
  color: #f8f5ef;
  font-family: 'Inter', system-ui, sans-serif;
}

.mock-banner {
  background: rgba(201, 168, 76, 0.12);
  border: 1px solid rgba(201, 168, 76, 0.35);
  color: #c9a84c;
  font-size: 0.78rem;
  letter-spacing: 0.02em;
  padding: 0.6rem 0.9rem;
  border-radius: 4px;
  margin-bottom: 1.5rem;
}

.eyebrow {
  display: block;
  color: #c9a84c;
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  margin-bottom: 0.5rem;
}

.panel-title {
  font-family: 'Playfair Display', serif;
  font-weight: 300;
  font-size: 1.6rem;
  color: #f8f5ef;
  margin: 0 0 0.5rem;
  line-height: 1.2;
}

.selected-summary {
  color: rgba(248, 245, 239, 0.7);
  font-size: 0.85rem;
  margin: 0 0 1.5rem;
}

.panel-header {
  margin-bottom: 1.75rem;
  border-bottom: 1px solid rgba(201, 168, 76, 0.2);
  padding-bottom: 1.25rem;
}

.loading-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.9rem;
  padding: 2.5rem 1rem;
  color: rgba(248, 245, 239, 0.7);
  font-size: 0.9rem;
  text-align: center;
}

.loader-ring {
  width: 28px;
  height: 28px;
  border: 2px solid rgba(201, 168, 76, 0.25);
  border-top-color: #c9a84c;
  border-radius: 50%;
  animation: spin 0.9s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.month-group {
  margin-bottom: 1.5rem;
}

.month-label {
  font-size: 0.72rem;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: rgba(201, 168, 76, 0.85);
  margin-bottom: 0.6rem;
}

.session-list {
  display: grid;
  gap: 0.55rem;
}

.session-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  background: rgba(248, 245, 239, 0.03);
  border: 1px solid rgba(248, 245, 239, 0.12);
  border-radius: 4px;
  padding: 0.85rem 1rem;
  color: #f8f5ef;
  cursor: pointer;
  transition: all 0.25s ease;
  text-align: left;
  font-family: inherit;
}

.session-row:hover:not(.disabled) {
  border-color: rgba(201, 168, 76, 0.6);
  background: rgba(201, 168, 76, 0.06);
}

.session-row.selected {
  border-color: #c9a84c;
  background: rgba(201, 168, 76, 0.12);
}

.session-row.disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.session-dates {
  font-weight: 500;
  font-size: 0.95rem;
}

.session-status {
  font-size: 0.75rem;
  letter-spacing: 0.04em;
  font-weight: 600;
  text-transform: uppercase;
}

.session-status.good {
  color: #7fd99a;
}

.session-status.low {
  color: #e0b14c;
}

.session-status.full {
  color: rgba(248, 245, 239, 0.45);
}

.option-section,
.quantity-row {
  margin-top: 1.5rem;
}

.option-label {
  font-size: 0.72rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: rgba(248, 245, 239, 0.6);
  margin-bottom: 0.6rem;
  display: block;
}

.option-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem;
}

.option-pill {
  border: 1px solid rgba(248, 245, 239, 0.2);
  background: transparent;
  color: #f8f5ef;
  padding: 0.55rem 1rem;
  border-radius: 999px;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.25s ease;
  font-family: inherit;
}

.option-pill:hover {
  border-color: rgba(201, 168, 76, 0.6);
}

.option-pill.selected {
  background: #c9a84c;
  color: #071a2b;
  border-color: #c9a84c;
  font-weight: 600;
}

.quantity-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.quantity-stepper {
  display: flex;
  align-items: center;
  gap: 1rem;
  background: rgba(248, 245, 239, 0.05);
  border: 1px solid rgba(248, 245, 239, 0.15);
  border-radius: 999px;
  padding: 0.3rem 0.5rem;
}

.quantity-stepper button {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: none;
  background: rgba(201, 168, 76, 0.18);
  color: #c9a84c;
  font-size: 1.1rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.quantity-stepper button:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.quantity-stepper span {
  min-width: 1.2rem;
  text-align: center;
  font-weight: 600;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin: 1.75rem 0 1.25rem;
  padding-top: 1.25rem;
  border-top: 1px solid rgba(201, 168, 76, 0.2);
  font-size: 0.85rem;
  color: rgba(248, 245, 239, 0.7);
}

.summary-price {
  font-family: 'Playfair Display', serif;
  font-size: 1.5rem;
  color: #c9a84c;
}

.form-error {
  color: #e08585;
  font-size: 0.85rem;
  margin: 0.75rem 0 0;
}

.btn-gold {
  height: 52px;
  border: none;
  background: #c9a84c;
  color: #071a2b;
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  cursor: pointer;
  border-radius: 3px;
  transition: background 0.3s ease;
  padding: 0 1.5rem;
}

.btn-gold:hover:not(:disabled) {
  background: #d7b461;
}

.btn-gold:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.full-width {
  width: 100%;
}

.details-form {
  display: flex;
  flex-direction: column;
  gap: 1.1rem;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  font-size: 0.78rem;
  letter-spacing: 0.04em;
  color: rgba(248, 245, 239, 0.7);
}

.field.full {
  grid-column: 1 / -1;
}

.field input,
.field textarea {
  background: rgba(248, 245, 239, 0.05);
  border: 1px solid rgba(248, 245, 239, 0.18);
  border-radius: 3px;
  padding: 0.7rem 0.85rem;
  color: #f8f5ef;
  font-size: 0.92rem;
  font-family: inherit;
}

.field input:focus,
.field textarea:focus {
  outline: none;
  border-color: #c9a84c;
}

.button-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 0.5rem;
}

.btn-link-back {
  background: none;
  border: none;
  color: rgba(248, 245, 239, 0.7);
  font-size: 0.78rem;
  letter-spacing: 0.06em;
  cursor: pointer;
  text-transform: uppercase;
  font-weight: 600;
}

.btn-link-back:hover {
  color: #c9a84c;
}

.confirmed-panel {
  text-align: center;
  padding: 2rem 1rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
}

.confirmed-text {
  color: rgba(248, 245, 239, 0.75);
  font-size: 0.92rem;
  line-height: 1.5;
  max-width: 420px;
}

.order-number {
  color: #c9a84c;
  font-weight: 600;
  letter-spacing: 0.04em;
  margin-bottom: 0.5rem;
}

@media (max-width: 640px) {
  .rezdy-widget {
    padding: 1.25rem;
  }

  .form-grid {
    grid-template-columns: 1fr;
  }

  .button-row {
    flex-direction: column-reverse;
    gap: 0.9rem;
  }

  .btn-gold {
    width: 100%;
  }
}
</style>

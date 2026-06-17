<script setup lang="ts">
import { useSEO } from '@/composables/useSEO'
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useScrollReveal } from '@/composables/useScrollReveal'
import BookingForm from '@/components/BookingForm.vue'
import NoImagePlaceholder from '@/components/NoImagePlaceholder.vue'
import { useEmail } from '@/composables/useEmail'
import { useTripData } from '@/composables/useTripData'
import { useComponentCMS } from '@/composables/useComponentCMS'
import { useRezdy } from '@/composables/useRezdy'

useScrollReveal()

const { getBookingWidgetUrl, loadRezdyConfig } = useRezdy()

const route = useRoute()
const { sendBookingEmails } = useEmail()

// CMS trip data for both expeditions
const oceanSafariTrip = useTripData('ocean-safari')
const diveExpeditionTrip = useTripData('dive-expedition')
const oceanSafariCms = useComponentCMS('OceanSafariView')
const diveExpeditionCms = useComponentCMS('DiveExpeditionView')

// Shared CMS source — same as ExpeditionsView for hoverImages (cards[0] = ocean-safari, cards[1] = dive-expedition)
const expeditionsCms = useComponentCMS('ExpeditionsView')

// Fallback static highlights (shown when CMS features haven't loaded yet)
const FALLBACK_HIGHLIGHTS: Record<string, string[]> = {
  'ocean-safari': [
    'Whale shark encounters with certified marine naturalist',
    'Northern Ningaloo Reef — rarely visited reef sections',
    'All snorkel gear including wetsuits and fins',
    'All-inclusive meals prepared by our onboard chef',
    'Beverages including wine and craft beer',
    'Maximum 12 guests',
  ],
  'dive-expedition': [
    'Whale shark encounters with certified marine naturalist',
    'Full-length Ningaloo Reef coverage — north to south',
    'Manta ray snorkel at Coral Bay',
    'All snorkel and dive gear included',
    'All-inclusive meals and beverages',
    'Humpback whale encounters (seasonal)',
    'Stargazing and yoga on deck',
    'Maximum 14 guests',
  ],
}

// Build a unified trip object from CMS data, with static fallbacks
function buildTripCard(
  slug: string,
  tripData: ReturnType<typeof useTripData>,
  cms: ReturnType<typeof useComponentCMS>,
) {
  const t = tripData.trip.value
  const nights = (tripData.durationDays.value || 0) - 1
  const durationStr = tripData.durationDays.value
    ? `${tripData.durationDays.value} Days / ${Math.max(1, nights)} Nights`
    : slug === 'ocean-safari' ? '6 Days / 5 Nights' : '9 Days / 8 Nights'

  // Pull from same CMS source as ExpeditionsView — hoverImages cards[0] = ocean-safari, cards[1] = dive-expedition
  const cards = expeditionsCms.getSection('hoverImages')
  const heroSlotIndex = slug === 'ocean-safari' ? 0 : 1
  const cmsImage = cards[heroSlotIndex]?.imageUrl || null
  const hasImage = !!cards[heroSlotIndex]?.imageUrl

  const heroImage = hasImage
    ? cmsImage
    : t?.heroImageUrl ||
      (slug === 'ocean-safari'
        ? 'https://images.unsplash.com/photo-1569263979104-865ab7cd8d13?q=80&w=2400&auto=format&fit=crop'
        : 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?q=80&w=2400&auto=format&fit=crop')

  const highlights =
    tripData.features.value.length > 0
      ? tripData.features.value
      : FALLBACK_HIGHLIGHTS[slug] || []

  return {
    id: slug,
    name: t?.title
      ? `${t.title} — ${t.subtitle || ''}`
      : slug === 'ocean-safari'
        ? 'Ocean Safari — Northern Reef Expedition'
        : 'Dive Expedition — Full Reef Live-Aboard',
    shortName: tripData.vesselName.value || (slug === 'ocean-safari' ? 'Ocean Safari' : 'Dive Expedition'),
    duration: durationStr,
    guests: tripData.maxGuests.value || (slug === 'ocean-safari' ? 12 : 14),
    price: tripData.priceAud.value || (slug === 'ocean-safari' ? 2495 : 4495),
    priceLabel: tripData.priceLabel.value || (slug === 'ocean-safari' ? 'From $2,495 AUD' : 'From $4,495 AUD'),
    priceCurrency: 'AUD',
    heroImage,
    hasImage,
    description:
      t?.shortDescription ||
      t?.description ||
      (slug === 'ocean-safari'
        ? 'Six days exploring the northern reaches of Ningaloo Marine Park. Up to 12 guests, all-inclusive, departing Exmouth.'
        : 'Nine days covering the full length of Ningaloo Marine Park. Up to 14 guests, all-inclusive, departing Exmouth.'),
    highlights,
    rezdyProductId: t?.rezdyProductId || '',
  }
}

// Reactive trip cards that update when CMS loads
const allTrips = computed(() => ({
  'ocean-safari': buildTripCard('ocean-safari', oceanSafariTrip, oceanSafariCms),
  'dive-expedition': buildTripCard('dive-expedition', diveExpeditionTrip, diveExpeditionCms),
}))

const selectedTripId = computed(() => {
  const param = route.params.trip as string
  const query = route.query.trip as string
  return param || query || ''
})

const selectedTrip = computed(() => {
  return allTrips.value[selectedTripId.value as keyof typeof allTrips.value] || null
})

const showTripSelector = computed(() => !selectedTrip.value)

// Rezdy widget embed URL — non-null when Rezdy is fully configured
const widgetUrl = computed(() => {
  if (!activeTrip.value) return null
  return getBookingWidgetUrl(activeTrip.value.id)
})

const tripSelect = ref(selectedTripId.value)

const activeTrip = computed(() => {
  if (selectedTrip.value) return selectedTrip.value
  if (tripSelect.value && allTrips.value[tripSelect.value as keyof typeof allTrips.value]) {
    return allTrips.value[tripSelect.value as keyof typeof allTrips.value]
  }
  return null
})

// Selector labels — dynamic from CMS
const selectorOptions = computed(() => [
  {
    value: 'ocean-safari',
    label: `Ocean Safari — ${allTrips.value['ocean-safari'].duration} — AUD $${allTrips.value['ocean-safari'].price.toLocaleString()} pp`,
  },
  {
    value: 'dive-expedition',
    label: `Dive Expedition — ${allTrips.value['dive-expedition'].duration} — AUD $${allTrips.value['dive-expedition'].price.toLocaleString()} pp`,
  },
])

onMounted(async () => {
  await Promise.all([
    oceanSafariTrip.load(),
    diveExpeditionTrip.load(),
    oceanSafariCms.load(),
    diveExpeditionCms.load(),
    expeditionsCms.load(),
    loadRezdyConfig(),
  ])
})

// Booking form state
const bookingForm = ref({
  name: '',
  email: '',
  phone: '',
  guests: '',
  dateFrom: '',
  dateTo: '',
  message: '',
})

const bookingSubmitted = ref(false)
const bookingSubmitting = ref(false)
const bookingError = ref('')

const bookingKey = ref(0)

function resetBooking() {
  bookingSubmitted.value = false
  bookingError.value = ''
  bookingForm.value = {
    name: '',
    email: '',
    phone: '',
    guests: '',
    dateFrom: '',
    dateTo: '',
    message: '',
  }
  bookingKey.value++
}

async function handleBookingSubmit() {
  bookingError.value = ''

  if (!bookingForm.value.name.trim() || !bookingForm.value.email.trim() || !activeTrip.value) {
    bookingError.value = 'Please fill in all required fields'
    return
  }

  bookingSubmitting.value = true

  try {
    const [{ getFirebaseDb, initFirebase }, { collection, addDoc, serverTimestamp }] = await Promise.all([
      import('@/lib/firebase'),
      import('firebase/firestore'),
    ])
    initFirebase()
    const db = getFirebaseDb()

    await addDoc(collection(db, 'bookings'), {
      name: bookingForm.value.name.trim(),
      email: bookingForm.value.email.trim().toLowerCase(),
      phone: bookingForm.value.phone.trim(),
      tripId: activeTrip.value.id,
      tripName: activeTrip.value.name,
      guests: bookingForm.value.guests ? parseInt(bookingForm.value.guests) : 1,
      dateFrom: bookingForm.value.dateFrom,
      dateTo: bookingForm.value.dateTo,
      message: bookingForm.value.message.trim(),
      status: 'new',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })

    // Send email notification (non-blocking)
    sendBookingEmails({
      fullName: bookingForm.value.name.trim(),
      email: bookingForm.value.email.trim().toLowerCase(),
      phone: bookingForm.value.phone.trim() || 'Not provided',
      tripName: activeTrip.value.name,
      selectedDate: `${bookingForm.value.dateFrom} to ${bookingForm.value.dateTo}`,
      participants: bookingForm.value.guests ? parseInt(bookingForm.value.guests) : 1,
      specialRequirements: bookingForm.value.message.trim() || 'None',
    }).catch(console.error)

    bookingSubmitted.value = true
    window.scrollTo({ top: 0, behavior: 'smooth' })
  } catch (e: any) {
    bookingError.value = e.message || 'Failed to submit booking. Please try again.'
  }

  bookingSubmitting.value = false
}

useSEO({
  title: 'Book Your Expedition',
  description: 'Submit a booking request for an Expedition OZ live-aboard. Ocean Safari (6 days, from $2,495 AUD) or Dive Expedition (9 days, from $4,495 AUD). Small groups, departing Exmouth WA.',
  path: '/book',
  type: 'website',
})
</script>

<template>
  <div>
    <!-- Hero Section -->
    <section class="relative min-h-[50vh] md:min-h-[60vh] flex items-center justify-center overflow-hidden">
      <div class="absolute inset-0 z-0">
        <template v-if="activeTrip?.hasImage">
          <img
            :src="activeTrip.heroImage"
            :alt="activeTrip.name"
            class="w-full h-full object-cover"
          />
        </template>
        <NoImagePlaceholder v-else label="Booking Hero" class="w-full h-full" />
        <div class="absolute inset-0 bg-[#0A2E4A]/75" />
        <div class="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/70" />
      </div>

      <div class="relative z-10 text-center px-4 max-w-4xl mx-auto">
        <p class="overline-text mb-3 md:mb-4 text-xs md:text-sm tracking-[0.3em] text-white/90">
          {{ activeTrip ? 'Reserve Your Spot' : 'Book Your Expedition' }}
        </p>
        <h1
          class="font-display text-3xl md:text-5xl lg:text-6xl font-light text-white mb-4 md:mb-6"
          style="font-family: var(--font-display);"
        >
          <template v-if="activeTrip">
            Book <span class="italic" style="color: var(--color-gold-400);">{{ activeTrip.shortName }}</span>
          </template>
          <template v-else>
            Secure Your <span class="italic" style="color: var(--color-gold-400);">Adventure</span>
          </template>
        </h1>
        <p class="text-sm md:text-lg text-white/80 max-w-2xl mx-auto leading-relaxed">
          {{ activeTrip ? activeTrip.description : 'Choose your vessel and submit your booking request. Our team will confirm availability within 24–48 hours.' }}
        </p>
      </div>
    </section>

    <!-- Booking Content -->
    <section class="py-16 md:py-24 lg:py-32" style="background: var(--color-ocean-950);">
      <div class="container mx-auto px-4 sm:px-6 lg:px-12">
        <div class="grid grid-cols-1 lg:grid-cols-5 gap-8 md:gap-12 lg:gap-16">
          <!-- Left: Trip Info -->
          <div class="lg:col-span-2 section-reveal-left">
            <!-- Trip Selector (if no trip pre-selected) -->
            <div
              v-if="showTripSelector"
              class="mb-8 p-6 border border-[#C9A84C]/20"
              style="background: rgba(10, 46, 74, 0.4);"
            >
              <label class="overline-text block mb-3">Select Your Expedition</label>
              <select v-model="tripSelect" class="form-input w-full">
                <option value="">Choose an expedition...</option>
                <option v-for="opt in selectorOptions" :key="opt.value" :value="opt.value">
                  {{ opt.label }}
                </option>
              </select>
            </div>

            <!-- Active Trip Card -->
            <div
              v-if="activeTrip"
              class="p-6 md:p-8 border border-[#C9A84C]/20 mb-8"
              style="background: rgba(10, 46, 74, 0.4);"
            >
              <p class="overline-text mb-3">Trip Summary</p>
              <h2 class="font-display text-xl md:text-2xl font-light mb-4" style="font-family: var(--font-display); color: var(--color-sand-100);">
                {{ activeTrip.name }}
              </h2>

              <div class="grid grid-cols-2 gap-4 mb-6 py-4 border-t border-b border-[#C9A84C]/15">
                <div>
                  <p class="overline-text mb-1" style="font-size: 0.55rem;">Duration</p>
                  <p class="text-sm" style="color: var(--color-sand-200);">{{ activeTrip.duration }}</p>
                </div>
                <div>
                  <p class="overline-text mb-1" style="font-size: 0.55rem;">Max Guests</p>
                  <p class="text-sm" style="color: var(--color-sand-200);">{{ activeTrip.guests }}</p>
                </div>
                <div>
                  <p class="overline-text mb-1" style="font-size: 0.55rem;">Price Per Person</p>
                  <p class="text-sm font-semibold" style="color: var(--color-gold-400);">
                    {{ activeTrip.priceCurrency }} ${{ activeTrip.price.toLocaleString() }}
                  </p>
                </div>
                <div>
                  <p class="overline-text mb-1" style="font-size: 0.55rem;">Departure</p>
                  <p class="text-sm" style="color: var(--color-sand-200);">Exmouth, WA</p>
                </div>
              </div>

              <p class="overline-text mb-3">What's Included</p>
              <ul class="space-y-2">
                <li
                  v-for="highlight in activeTrip.highlights"
                  :key="highlight"
                  class="flex items-start gap-2 text-sm"
                  style="color: var(--color-sand-200);"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" class="flex-shrink-0 mt-0.5">
                    <polyline points="20 6 9 17 4 12" stroke="#C9A84C" stroke-width="2" stroke-linecap="round" />
                  </svg>
                  {{ highlight }}
                </li>
              </ul>
            </div>

            <!-- Help Box -->
            <div
              class="p-6 border border-[#C9A84C]/10"
              style="background: rgba(10, 46, 74, 0.3);"
            >
              <p class="overline-text mb-3">Need Help?</p>
              <p class="text-sm leading-relaxed mb-4 opacity-75" style="color: var(--color-sand-200);">
                Not sure which expedition is right for you? Have questions about accessibility, dietary requirements, or private charters?
              </p>
              <router-link to="/contact" class="btn-outline inline-block text-center w-full text-sm py-3">
                Contact Our Team
              </router-link>
            </div>
          </div>

          <!-- Right: Booking Form -->
          <div class="lg:col-span-3 section-reveal-right">
            <div v-if="bookingSubmitted" class="success-panel text-center py-16">
              <div class="success-icon mx-auto mb-6">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#4caf50" stroke-width="2">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              </div>
              <h3 class="font-display text-2xl md:text-3xl font-light mb-4" style="font-family: var(--font-display); color: var(--color-sand-100);">
                Booking Request <span class="italic" style="color: var(--color-gold-400);">Submitted</span>
              </h3>
              <p class="text-sm md:text-base opacity-75 max-w-lg mx-auto leading-relaxed mb-8" style="color: var(--color-sand-200);">
                Thank you! We have received your booking request and will contact you within 24–48 hours to confirm availability and discuss next steps. No payment is required at this stage.
              </p>
              <div class="flex flex-col sm:flex-row gap-3 justify-center">
                <router-link to="/" class="btn-primary px-6 py-3 text-sm">Return Home</router-link>
                <button @click="resetBooking" class="btn-outline px-6 py-3 text-sm">Make Another Booking</button>
              </div>
            </div>

            <div v-else-if="!activeTrip" class="text-center py-16">
              <p class="font-display text-xl mb-4" style="font-family: var(--font-display); color: var(--color-sand-100);">
                Select an Expedition
              </p>
              <p class="text-sm opacity-75 mb-6" style="color: var(--color-sand-200);">
                Please choose a vessel from the dropdown on the left to begin your booking.
              </p>
            </div>

            <!-- Rezdy Widget Embed (when configured) -->
            <div v-else-if="widgetUrl" class="rezdy-widget-wrap">
              <p class="overline-text mb-4">Live Availability & Booking</p>
              <iframe
                :src="widgetUrl"
                :key="widgetUrl"
                width="100%"
                height="700"
                frameborder="0"
                scrolling="auto"
                class="rezdy-iframe"
                title="Rezdy booking widget"
              />
              <p class="text-xs opacity-40 mt-3 text-center" style="color: var(--color-sand-200);">
                Secure booking powered by Rezdy
              </p>
            </div>

            <!-- Fallback: Inline Booking Form (no Rezdy configured) -->
            <div v-else class="contact-form-wrap" :key="bookingKey">
              <form @submit.prevent="handleBookingSubmit" class="space-y-6">
                <div v-if="bookingError" class="error-message">{{ bookingError }}</div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div class="form-group">
                    <label class="form-label">Full Name *</label>
                    <input v-model="bookingForm.name" type="text" required class="form-input" placeholder="Your full name" />
                  </div>
                  <div class="form-group">
                    <label class="form-label">Email Address *</label>
                    <input v-model="bookingForm.email" type="email" required class="form-input" placeholder="your@email.com" />
                  </div>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div class="form-group">
                    <label class="form-label">Phone Number</label>
                    <input v-model="bookingForm.phone" type="tel" class="form-input" placeholder="+61 4XX XXX XXX" />
                  </div>
                  <div class="form-group">
                    <label class="form-label">Number of Guests</label>
                    <input v-model="bookingForm.guests" type="number" min="1" :max="activeTrip.guests" class="form-input" placeholder="e.g. 2" />
                  </div>
                </div>

                <!-- Date Range -->
                <div class="form-group">
                  <label class="form-label">Preferred Dates *</label>
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <input
                        v-model="bookingForm.dateFrom"
                        type="date"
                        required
                        class="form-input"
                        :min="new Date().toISOString().split('T')[0]"
                      />
                      <span class="text-xs opacity-50 mt-1 block" style="color: var(--color-sand-200);">From</span>
                    </div>
                    <div>
                      <input
                        v-model="bookingForm.dateTo"
                        type="date"
                        required
                        class="form-input"
                        :min="bookingForm.dateFrom || new Date().toISOString().split('T')[0]"
                      />
                      <span class="text-xs opacity-50 mt-1 block" style="color: var(--color-sand-200);">To</span>
                    </div>
                  </div>
                </div>

                <div class="form-group">
                  <label class="form-label">Message</label>
                  <textarea v-model="bookingForm.message" rows="4" class="form-input" placeholder="Tell us about any special requirements, questions, or what you're hoping to experience..."></textarea>
                </div>

                <button type="submit" class="btn-primary w-full" :disabled="bookingSubmitting" style="padding: 16px; font-size: 0.7rem; width: 100%; text-align: center;">
                  <span v-if="bookingSubmitting">Sending Booking Request...</span>
                  <span v-else>Submit Booking Request</span>
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.rezdy-widget-wrap {
  background: rgba(10, 46, 74, 0.35);
  border: 1px solid rgba(201, 168, 76, 0.15);
  padding: 32px 32px 24px;
}

.rezdy-iframe {
  display: block;
  border: none;
  width: 100%;
  min-height: 600px;
}

.form-input {
  background: rgba(7, 26, 43, 0.6);
  border: 1px solid rgba(201, 168, 76, 0.2);
  color: var(--color-sand-100);
  padding: 12px 16px;
  font-family: var(--font-body);
  font-size: 0.875rem;
  width: 100%;
  outline: none;
  transition: border-color 0.3s ease;
  -webkit-appearance: none;
  appearance: none;
}

.form-input:focus {
  border-color: var(--color-gold-400);
}

/* Date input styling for dark theme */
input[type="date"].form-input {
  color-scheme: dark;
}

input[type="date"].form-input::-webkit-calendar-picker-indicator {
  filter: invert(1) brightness(0.8) sepia(1) hue-rotate(180deg) saturate(3);
  cursor: pointer;
}

.success-panel {
  background: rgba(10, 46, 74, 0.4);
  border: 1px solid rgba(76, 175, 80, 0.2);
}

.success-icon {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  border: 1px solid rgba(76, 175, 80, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
}

.contact-form-wrap {
  background: rgba(10, 46, 74, 0.35);
  border: 1px solid rgba(201, 168, 76, 0.15);
  padding: 40px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-label {
  font-family: var(--font-heading);
  font-size: 0.65rem;
  font-weight: 600;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: rgba(248, 245, 239, 0.65);
}

.form-input::placeholder {
  color: rgba(248, 245, 239, 0.3);
}

.error-message {
  background: rgba(224, 123, 90, 0.1);
  border: 1px solid rgba(224, 123, 90, 0.3);
  color: #e07b5a;
  padding: 0.75rem 1rem;
  font-size: 0.8rem;
}
</style>
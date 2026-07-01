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

// CMS trip data for all three expeditions
const oceanSafariTrip = useTripData('ocean-safari')
const diveExpeditionTrip = useTripData('dive-expedition')
const oceanSafariEscapeTrip = useTripData('ocean-safari-escape')
const diveEscapeTrip = useTripData('dive-escape')
const oceanSafariCms = useComponentCMS('OceanSafariView')
const diveExpeditionCms = useComponentCMS('DiveExpeditionView')
const oceanSafariEscapeCms = useComponentCMS('OceanSafariEscapeView')
const diveEscapeCms = useComponentCMS('DiveEscapeView')

// Shared CMS source — same as ExpeditionsView for hoverImages (cards[0] = ocean-safari, cards[1] = dive-expedition, cards[2] = ocean-safari-escape)
const expeditionsCms = useComponentCMS('ExpeditionsView')

// Per-product fallback values, used until CMS/Firestore data loads
const SLUG_DEFAULTS: Record<string, {
  heroSlotIndex: number
  heroImageFallback: string
  durationFallback: string
  guestsFallback: number
  priceFallback: number
  priceLabelFallback: string
  nameFallback: string
  shortNameFallback: string
  descriptionFallback: string
}> = {
  'ocean-safari': {
    heroSlotIndex: 0,
    heroImageFallback: 'https://images.unsplash.com/photo-1569263979104-865ab7cd8d13?q=80&w=2400&auto=format&fit=crop',
    durationFallback: '6 Days / 5 Nights',
    guestsFallback: 12,
    priceFallback: 5000,
    priceLabelFallback: 'From $5,000 AUD',
    nameFallback: 'Ocean Safari Expedition — Our Signature Ningaloo Sailing Expedition',
    shortNameFallback: 'Ocean Safari Expedition',
    descriptionFallback: 'Five nights exploring Ningaloo Reef by sail aboard Sylfia. Up to 12 guests, all-inclusive, departing Exmouth.',
  },
  'dive-expedition': {
    heroSlotIndex: 1,
    heroImageFallback: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?q=80&w=2400&auto=format&fit=crop',
    durationFallback: '9 Days / 8 Nights',
    guestsFallback: 14,
    priceFallback: 9600,
    priceLabelFallback: 'From $9,600 AUD',
    nameFallback: 'Dive Expedition — Our Flagship Liveaboard Dive Expedition',
    shortNameFallback: 'Dive Expedition',
    descriptionFallback: 'Eight nights covering the remote reaches of Ningaloo Reef aboard Millennium. Up to 14 guests, all-inclusive, departing Exmouth.',
  },
  'ocean-safari-escape': {
    heroSlotIndex: 2,
    heroImageFallback: 'https://images.unsplash.com/photo-1437622368342-7a3d73a34c8f?q=80&w=2400&auto=format&fit=crop',
    durationFallback: '4 Days / 3 Nights',
    guestsFallback: 12,
    priceFallback: 3000,
    priceLabelFallback: 'From $3,000 AUD',
    nameFallback: 'Ocean Safari Escape — A Shorter Ningaloo Sailing Escape',
    shortNameFallback: 'Ocean Safari Escape',
    descriptionFallback: 'Three nights exploring remote reefs, wildlife and sunset anchorages aboard Sylfia. Up to 12 guests, all-inclusive, departing Exmouth.',
  },
  'dive-escape': {
    heroSlotIndex: 3,
    heroImageFallback: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?q=80&w=2400&auto=format&fit=crop',
    durationFallback: '5 Days / 4 Nights',
    guestsFallback: 14,
    priceFallback: 4800,
    priceLabelFallback: 'From $4,800 AUD',
    nameFallback: 'Dive Escape — A Shorter Ningaloo Dive Escape',
    shortNameFallback: 'Dive Escape',
    descriptionFallback: 'Four nights of liveaboard diving on the remote Ningaloo Reef aboard Millennium. Selected dates only. Up to 14 guests, all-inclusive, departing Exmouth.',
  },
}

// Fallback static highlights (shown when CMS features haven't loaded yet)
const FALLBACK_HIGHLIGHTS: Record<string, string[]> = {
  'ocean-safari': [
    'Whale watching and snorkelling with marine life',
    'Sailing and remote anchorage exploration',
    'Yoga and breathwork sessions',
    'All-inclusive meals prepared by our onboard chef',
    'Beverages including wine and craft beer',
    'Maximum 12 guests',
  ],
  'dive-expedition': [
    'Included whale shark swim (seasonal)',
    'Included humpback whale swim (seasonal)',
    'Scuba diving included',
    'Expedition RIB operations',
    'All-inclusive meals and beverages',
    'Maximum 14 guests',
  ],
  'ocean-safari-escape': [
    'Remote reef and beach exploration',
    'Wildlife encounters along the way',
    'Sunset anchorages each evening',
    'All-inclusive meals prepared by our onboard chef',
    'Beverages including wine and craft beer',
    'Maximum 12 guests',
  ],
  'dive-escape': [
    'Scuba diving on the remote Ningaloo Reef',
    'Whale shark and manta ray encounters (seasonal)',
    'All-inclusive liveaboard aboard Millennium',
    'Expedition RIB operations',
    'Selected dates — limited availability',
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
  const defaults = SLUG_DEFAULTS[slug]
  const nights = (tripData.durationDays.value || 0) - 1
  const durationStr = tripData.durationDays.value
    ? `${tripData.durationDays.value} Days / ${Math.max(1, nights)} Nights`
    : defaults.durationFallback

  // Pull from same CMS source as ExpeditionsView — hoverImages cards[0] = ocean-safari, cards[1] = dive-expedition, cards[2] = ocean-safari-escape
  const cards = expeditionsCms.getSection('hoverImages')
  const cmsImage = cards[defaults.heroSlotIndex]?.imageUrl || null
  const hasImage = !!cards[defaults.heroSlotIndex]?.imageUrl

  const heroImage = hasImage
    ? cmsImage
    : t?.heroImageUrl || defaults.heroImageFallback

  const highlights =
    tripData.features.value.length > 0
      ? tripData.features.value
      : FALLBACK_HIGHLIGHTS[slug] || []

  return {
    id: slug,
    name: t?.title
      ? `${t.title} — ${t.subtitle || ''}`
      : defaults.nameFallback,
    shortName: tripData.vesselName.value || defaults.shortNameFallback,
    duration: durationStr,
    guests: tripData.maxGuests.value || defaults.guestsFallback,
    price: tripData.priceAud.value || defaults.priceFallback,
    priceLabel: tripData.priceLabel.value || defaults.priceLabelFallback,
    priceCurrency: 'AUD',
    heroImage,
    hasImage,
    description:
      t?.shortDescription ||
      t?.description ||
      defaults.descriptionFallback,
    highlights,
    rezdyProductId: t?.rezdyProductId || '',
  }
}

// Reactive trip cards that update when CMS loads
const allTrips = computed(() => ({
  'ocean-safari': buildTripCard('ocean-safari', oceanSafariTrip, oceanSafariCms),
  'dive-expedition': buildTripCard('dive-expedition', diveExpeditionTrip, diveExpeditionCms),
  'ocean-safari-escape': buildTripCard('ocean-safari-escape', oceanSafariEscapeTrip, oceanSafariEscapeCms),
  'dive-escape': buildTripCard('dive-escape', diveEscapeTrip, diveEscapeCms),
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
    label: `Ocean Safari Expedition — ${allTrips.value['ocean-safari'].duration} — AUD $${allTrips.value['ocean-safari'].price.toLocaleString()} pp`,
    group: 'Aboard Sylfia',
  },
  {
    value: 'ocean-safari-escape',
    label: `Ocean Safari Escape — ${allTrips.value['ocean-safari-escape'].duration} — AUD $${allTrips.value['ocean-safari-escape'].price.toLocaleString()} pp`,
    group: 'Aboard Sylfia',
  },
  {
    value: 'dive-expedition',
    label: `Dive Expedition — ${allTrips.value['dive-expedition'].duration} — AUD $${allTrips.value['dive-expedition'].price.toLocaleString()} pp`,
    group: 'Aboard Millennium',
  },
  {
    value: 'dive-escape',
    label: `Dive Escape — ${allTrips.value['dive-escape'].duration} — AUD $${allTrips.value['dive-escape'].price.toLocaleString()} pp`,
    group: 'Aboard Millennium',
  },
])

onMounted(async () => {
  await Promise.all([
    oceanSafariTrip.load(),
    diveExpeditionTrip.load(),
    oceanSafariEscapeTrip.load(),
    diveEscapeTrip.load(),
    oceanSafariCms.load(),
    diveExpeditionCms.load(),
    oceanSafariEscapeCms.load(),
    diveEscapeCms.load(),
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
  description: 'Submit a booking request for an Expedition OZ sailing expedition. Ocean Safari Expedition (5 nights, from $5,000 AUD), Dive Expedition (8 nights, from $9,600 AUD) or Ocean Safari Escape (3 nights, from $3,000 AUD). Small groups, departing Exmouth WA.',
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
              class="mb-8"
            >
              <label class="overline-text block mb-4">Select Your Expedition</label>

              <!-- Sylfia group -->
              <p class="selector-vessel-label">Aboard Sylfia</p>
              <div class="selector-group">
                <button
                  v-for="opt in selectorOptions.filter(o => o.group === 'Aboard Sylfia')"
                  :key="opt.value"
                  class="selector-card"
                  :class="{ 'is-selected': tripSelect === opt.value }"
                  @click="tripSelect = opt.value"
                >
                  <span class="selector-name">{{ opt.value === 'ocean-safari' ? 'Ocean Safari Expedition' : 'Ocean Safari Escape' }}</span>
                  <span class="selector-meta">{{ (allTrips as any)[opt.value]?.duration }}</span>
                  <span class="selector-price">AUD ${{ (allTrips as any)[opt.value]?.price.toLocaleString() }} pp</span>
                  <span v-if="opt.value === 'ocean-safari-escape'" class="selector-badge">Shorter Break</span>
                </button>
              </div>

              <!-- Millennium group -->
              <p class="selector-vessel-label" style="margin-top: 1rem;">Aboard Millennium</p>
              <div class="selector-group">
                <button
                  v-for="opt in selectorOptions.filter(o => o.group === 'Aboard Millennium')"
                  :key="opt.value"
                  class="selector-card"
                  :class="{ 'is-selected': tripSelect === opt.value }"
                  @click="tripSelect = opt.value"
                >
                  <span class="selector-name">{{ opt.value === 'dive-expedition' ? 'Dive Expedition' : 'Dive Escape' }}</span>
                  <span class="selector-meta">{{ (allTrips as any)[opt.value]?.duration }}</span>
                  <span class="selector-price">AUD ${{ (allTrips as any)[opt.value]?.price.toLocaleString() }} pp</span>
                  <span v-if="opt.value === 'dive-escape'" class="selector-badge">Selected Dates</span>
                </button>
              </div>
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

/* ── Expedition Selector Cards ── */
.selector-vessel-label {
  font-family: var(--font-heading);
  font-size: 0.6rem;
  font-weight: 700;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: rgba(201, 168, 76, 0.8);
  margin-bottom: 0.5rem;
}

.selector-group {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.6rem;
}

.selector-card {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  padding: 0.9rem 1rem;
  background: rgba(10, 46, 74, 0.4);
  border: 1px solid rgba(201, 168, 76, 0.2);
  border-radius: 4px;
  text-align: left;
  cursor: pointer;
  transition: border-color 0.25s ease, background 0.25s ease;
}

.selector-card:hover {
  border-color: rgba(201, 168, 76, 0.55);
  background: rgba(10, 46, 74, 0.65);
}

.selector-card.is-selected {
  border-color: #C9A84C;
  background: rgba(201, 168, 76, 0.08);
}

.selector-card.is-selected::after {
  content: '✓';
  position: absolute;
  top: 0.6rem;
  right: 0.75rem;
  font-size: 0.7rem;
  color: #C9A84C;
}

.selector-name {
  font-family: var(--font-display);
  font-size: 0.88rem;
  font-weight: 400;
  color: #f8f5ef;
  line-height: 1.2;
}

.selector-meta {
  font-family: var(--font-heading);
  font-size: 0.62rem;
  letter-spacing: 0.08em;
  color: rgba(248, 245, 239, 0.55);
}

.selector-price {
  font-family: var(--font-heading);
  font-size: 0.68rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  color: #C9A84C;
}

.selector-badge {
  display: inline-block;
  margin-top: 0.3rem;
  padding: 2px 6px;
  background: rgba(201, 168, 76, 0.12);
  border: 1px solid rgba(201, 168, 76, 0.3);
  border-radius: 2px;
  font-family: var(--font-heading);
  font-size: 0.52rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: rgba(201, 168, 76, 0.9);
  width: fit-content;
}

@media (max-width: 480px) {
  .selector-group { grid-template-columns: 1fr; }
}
</style>
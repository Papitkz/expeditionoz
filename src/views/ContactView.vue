<script setup lang="ts">
import { useSEO } from '@/composables/useSEO'
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useScrollReveal } from '@/composables/useScrollReveal'
import PageHero from '@/components/PageHero.vue'
import NoImagePlaceholder from '@/components/NoImagePlaceholder.vue'
import { useComponentCMS } from '@/composables/useComponentCMS'
import { useEmail } from '@/composables/useEmail'
import { useTripData } from '@/composables/useTripData'
import { useSiteSettings } from '@/composables/useSiteSettings'

useScrollReveal()

const route = useRoute()

useSEO({
  title: 'Contact & Enquiries',
  description: 'Enquire about an Expedition OZ live-aboard in Ningaloo Reef. Reach our team for availability, private charters, and expedition details. Based in Exmouth, Western Australia.',
  path: '/contact',
  type: 'website',
  keywords: ['book Ningaloo Reef', 'Expedition OZ contact', 'live-aboard booking', 'Exmouth tours', 'private charter', 'whale shark booking', 'Expedition OZ'],
  jsonLd: {
    "@context": "https://schema.org",
    "@type": "ContactPage",
    "name": "Contact Expedition OZ",
    "description": "Enquire about a Ningaloo Reef live-aboard expedition",
    "url": "https://expeditionoz.netlify.app/contact",
    "mainEntity": {
      "@type": "TravelAgency",
      "name": "Expedition OZ",
      "url": "https://expeditionoz.netlify.app",
      "telephone": "+61-8-9123-4567",
      "email": "hello@expeditionoz.com.au",
      "address": {
        "@type": "PostalAddress",
        "streetAddress": "Exmouth Marina",
        "addressLocality": "Exmouth",
        "addressRegion": "WA",
        "postalCode": "6707",
        "addressCountry": "AU"
      }
    }
  }
})

// ── CMS: hero media ────────────────────────────────────────────────────────
const heroCms = useComponentCMS('ContactView')
const heroImage = computed(() => heroCms.getImageUrl('hero', 0))
const heroVideo = computed(() => heroCms.getImageUrl('hero', 1))

// ── CMS: site contact info (AdminSettings → cms_settings) ─────────────────
const siteSettings = useSiteSettings()

// ── CMS: trip data (AdminTrips → cms_trips) ───────────────────────────────
const oceanSafariTrip = useTripData('ocean-safari')
const diveExpeditionTrip = useTripData('dive-expedition')

const allTrips = computed(() => {
  const os = oceanSafariTrip.trip.value
  const de = diveExpeditionTrip.trip.value
  const osNights = Math.max(1, (oceanSafariTrip.durationDays.value || 6) - 1)
  const deNights = Math.max(1, (diveExpeditionTrip.durationDays.value || 9) - 1)

  return {
    'ocean-safari': {
      id: 'ocean-safari',
      name: os?.title
        ? `${os.title} — ${os.subtitle || 'Northern Reef Expedition'}`
        : 'Ocean Safari — Northern Reef Expedition',
      duration: oceanSafariTrip.durationDays.value
        ? `${oceanSafariTrip.durationDays.value} Days / ${osNights} Nights`
        : '6 Days / 5 Nights',
      guests: oceanSafariTrip.maxGuests.value || 12,
      price: oceanSafariTrip.priceAud.value || 2495,
      priceLabel: oceanSafariTrip.priceLabel.value || 'From $2,495 AUD',
      priceCurrency: 'AUD',
    },
    'dive-expedition': {
      id: 'dive-expedition',
      name: de?.title
        ? `${de.title} — ${de.subtitle || 'Full Reef Live-Aboard'}`
        : 'Dive Expedition — Full Reef Live-Aboard',
      duration: diveExpeditionTrip.durationDays.value
        ? `${diveExpeditionTrip.durationDays.value} Days / ${deNights} Nights`
        : '9 Days / 8 Nights',
      guests: diveExpeditionTrip.maxGuests.value || 14,
      price: diveExpeditionTrip.priceAud.value || 4495,
      priceLabel: diveExpeditionTrip.priceLabel.value || 'From $4,495 AUD',
      priceCurrency: 'AUD',
    },
  }
})

// ── Expedition dropdown options — reactive from CMS ───────────────────────
const expeditionOptions = computed(() => [
  {
    value: 'ocean-safari',
    label: `Ocean Safari — ${allTrips.value['ocean-safari'].duration} — AUD $${allTrips.value['ocean-safari'].price.toLocaleString()} pp`,
  },
  {
    value: 'dive-expedition',
    label: `Dive Expedition — ${allTrips.value['dive-expedition'].duration} — AUD $${allTrips.value['dive-expedition'].price.toLocaleString()} pp`,
  },
  { value: 'unsure', label: 'Not sure yet — happy to advise' },
])

// ── Form ──────────────────────────────────────────────────────────────────
const preselectedTrip = computed(() => {
  const q = route.query.trip as string
  return q && allTrips.value[q as keyof typeof allTrips.value] ? q : ''
})

const form = ref({
  name: '',
  email: '',
  phone: '',
  expedition: preselectedTrip.value,
  guests: '',
  dateFrom: '',
  dateTo: '',
  message: '',
})

const submitted = ref(false)
const submitting = ref(false)
const error = ref('')

const { sendBookingEmails } = useEmail()

const selectedTripDetails = computed(() => {
  if (!form.value.expedition || form.value.expedition === 'unsure') return null
  return allTrips.value[form.value.expedition as keyof typeof allTrips.value] || null
})

async function handleSubmit() {
  error.value = ''
  if (!form.value.name.trim() || !form.value.email.trim() || !form.value.expedition) {
    error.value = 'Please fill in all required fields'
    return
  }

  submitting.value = true

  try {
    const [{ getFirebaseDb, initFirebase }, { collection, addDoc, serverTimestamp }] = await Promise.all([
      import('@/lib/firebase'),
      import('firebase/firestore'),
    ])
    initFirebase()
    const db = getFirebaseDb()
    const tripName = selectedTripDetails.value?.name || form.value.expedition

    await addDoc(collection(db, 'bookings'), {
      name: form.value.name.trim(),
      email: form.value.email.trim().toLowerCase(),
      phone: form.value.phone.trim(),
      tripName,
      tripId: selectedTripDetails.value?.id || null,
      guests: form.value.guests ? parseInt(form.value.guests) : null,
      dateFrom: form.value.dateFrom,
      dateTo: form.value.dateTo,
      message: form.value.message.trim(),
      status: 'new',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })

    sendBookingEmails({
      fullName: form.value.name.trim(),
      email: form.value.email.trim().toLowerCase(),
      phone: form.value.phone.trim() || 'Not provided',
      tripName,
      selectedDate:
        form.value.dateFrom && form.value.dateTo
          ? `${form.value.dateFrom} to ${form.value.dateTo}`
          : form.value.dateFrom || 'Not specified',
      participants: form.value.guests ? parseInt(form.value.guests) : 1,
      specialRequirements: form.value.message.trim() || 'None',
    }).catch(console.error)

    submitted.value = true
  } catch (e: any) {
    error.value = e.message || 'Failed to send enquiry. Please try again.'
  }

  submitting.value = false
}

// ── Load all CMS in parallel ──────────────────────────────────────────────
onMounted(async () => {
  await Promise.all([
    heroCms.load(),
    siteSettings.load(),
    oceanSafariTrip.load(),
    diveExpeditionTrip.load(),
  ])
})
</script>

<template>
  <div>
    <PageHero
      tag="Bookings & Enquiries"
      title="Check"
      title-italic="Availability"
      subtitle="Reach out to our team to discuss dates, pricing, and all the details for your perfect expedition."
      image=""
      image-alt="Expedition vessel on calm turquoise waters"
      height="55vh"
    >
      <template #default>
        <!-- Video takes priority if present -->
        <template v-if="heroVideo">
          <video
            :src="heroVideo"
            class="absolute inset-0 w-full h-full object-cover"
            autoplay
            muted
            loop
            playsinline
            preload="metadata"
          />
        </template>
        <!-- Fallback to image -->
        <template v-else-if="heroImage">
          <img
            :src="heroImage"
            alt="Expedition vessel on calm turquoise waters"
            class="absolute inset-0 w-full h-full object-cover"
          />
        </template>
        <NoImagePlaceholder v-else class="absolute inset-0" />
      </template>
    </PageHero>

    <section class="py-24 lg:py-32" style="background: var(--color-ocean-950);">
      <div class="container mx-auto px-6 lg:px-12">
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-16">

          <!-- ── Left: info panel ── -->
          <div class="section-reveal-left">
            <p class="overline-text mb-4">Get In Touch</p>
            <div class="gold-divider-left mb-6"></div>
            <h2 class="font-display text-4xl font-light mb-6" style="font-family: var(--font-display); color: var(--color-sand-100);">
              Begin Your <span class="italic" style="color: var(--color-gold-400);">Journey</span>
            </h2>
            <p class="text-sm leading-relaxed mb-8 opacity-75" style="font-family: var(--font-body); color: var(--color-sand-200); line-height: 1.8;">
              We personally respond to every enquiry. Our team is happy to discuss expedition options, tailor dates, and answer any questions about life aboard our vessels.
            </p>

            <!-- Trip summary card — shown when an expedition is selected -->
            <div
              v-if="selectedTripDetails"
              class="p-6 border border-[#C9A84C]/20 mb-8"
              style="background: rgba(10, 46, 74, 0.4);"
            >
              <p class="overline-text mb-3">Selected Expedition</p>
              <h3 class="font-display text-lg font-light mb-3" style="font-family: var(--font-display); color: var(--color-sand-100);">
                {{ selectedTripDetails.name }}
              </h3>
              <div class="grid grid-cols-2 gap-3 text-sm" style="color: var(--color-sand-200);">
                <div>
                  <span class="overline-text block" style="font-size: 0.55rem;">Duration</span>
                  {{ selectedTripDetails.duration }}
                </div>
                <div>
                  <span class="overline-text block" style="font-size: 0.55rem;">Max Guests</span>
                  {{ selectedTripDetails.guests }}
                </div>
                <div class="col-span-2">
                  <span class="overline-text block" style="font-size: 0.55rem;">Price</span>
                  <span style="color: var(--color-gold-400); font-weight: 600;">
                    {{ selectedTripDetails.priceLabel }} per person
                  </span>
                </div>
              </div>
            </div>

            <!-- Contact info — all pulled from AdminSettings → cms_settings -->
            <div class="space-y-6">
              <div class="contact-info-item">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-gold-400)" stroke-width="1.5">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.42 2 2 0 0 1 3.6 1.24h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.91a16 16 0 0 0 6 6l.92-.92a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21.73 16.92z"/>
                </svg>
                <div>
                  <p class="overline-text mb-1" style="font-size: 0.55rem;">Phone</p>
                  <a :href="siteSettings.phoneHref.value" class="text-sm" style="font-family: var(--font-body); color: var(--color-sand-200); text-decoration: none;">
                    {{ siteSettings.phone.value }}
                  </a>
                </div>
              </div>

              <div class="contact-info-item">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-gold-400)" stroke-width="1.5">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                  <polyline points="22,6 12,13 2,6"/>
                </svg>
                <div>
                  <p class="overline-text mb-1" style="font-size: 0.55rem;">Email</p>
                  <a :href="siteSettings.emailHref.value" class="text-sm" style="font-family: var(--font-body); color: var(--color-sand-200); text-decoration: none;">
                    {{ siteSettings.email.value }}
                  </a>
                </div>
              </div>

              <div class="contact-info-item">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-gold-400)" stroke-width="1.5">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                  <circle cx="12" cy="10" r="3"/>
                </svg>
                <div>
                  <p class="overline-text mb-1" style="font-size: 0.55rem;">Departures From</p>
                  <p class="text-sm" style="font-family: var(--font-body); color: var(--color-sand-200);">
                    {{ siteSettings.address.value }}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <!-- ── Right: form ── -->
          <div class="lg:col-span-2 section-reveal-right">
            <div v-if="!submitted" class="contact-form-wrap">
              <form @submit.prevent="handleSubmit" class="space-y-6">
                <div v-if="error" class="error-message">{{ error }}</div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div class="form-group">
                    <label class="form-label">Full Name *</label>
                    <input v-model="form.name" type="text" required class="form-input" placeholder="Your full name" />
                  </div>
                  <div class="form-group">
                    <label class="form-label">Email Address *</label>
                    <input v-model="form.email" type="email" required class="form-input" placeholder="your@email.com" />
                  </div>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div class="form-group">
                    <label class="form-label">Phone Number</label>
                    <input v-model="form.phone" type="tel" class="form-input" placeholder="+61 4XX XXX XXX" />
                  </div>
                  <div class="form-group">
                    <label class="form-label">Number of Guests</label>
                    <input
                      v-model="form.guests"
                      type="number"
                      min="1"
                      :max="selectedTripDetails?.guests || 14"
                      class="form-input"
                      placeholder="e.g. 2"
                    />
                  </div>
                </div>

                <div class="form-group">
                  <label class="form-label">Expedition Interest *</label>
                  <select v-model="form.expedition" required class="form-input">
                    <option value="" disabled>Select an expedition</option>
                    <option v-for="exp in expeditionOptions" :key="exp.value" :value="exp.value">
                      {{ exp.label }}
                    </option>
                  </select>
                </div>

                <div class="form-group">
                  <label class="form-label">Preferred Dates</label>
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <input
                        v-model="form.dateFrom"
                        type="date"
                        class="form-input"
                        :min="new Date().toISOString().split('T')[0]"
                      />
                      <span class="text-xs opacity-50 mt-1 block" style="color: var(--color-sand-200);">From</span>
                    </div>
                    <div>
                      <input
                        v-model="form.dateTo"
                        type="date"
                        class="form-input"
                        :min="form.dateFrom || new Date().toISOString().split('T')[0]"
                      />
                      <span class="text-xs opacity-50 mt-1 block" style="color: var(--color-sand-200);">To</span>
                    </div>
                  </div>
                </div>

                <div class="form-group">
                  <label class="form-label">Message</label>
                  <textarea v-model="form.message" rows="4" class="form-input" placeholder="Tell us about any special requirements, questions, or what you're hoping to experience..."></textarea>
                </div>

                <button type="submit" class="btn-primary w-full" :disabled="submitting" style="padding: 16px; font-size: 0.7rem; width: 100%; text-align: center;">
                  <span v-if="submitting">Sending Enquiry...</span>
                  <span v-else>Send Enquiry</span>
                </button>
              </form>
            </div>

            <div v-else class="success-message">
              <div class="text-center">
                <div class="success-icon mb-6 mx-auto">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                    <polyline points="20 6 9 17 4 12" stroke="var(--color-gold-400)" stroke-width="2" stroke-linecap="round"/>
                  </svg>
                </div>
                <p class="overline-text mb-4">Enquiry Received</p>
                <div class="gold-divider mb-6"></div>
                <h3 class="font-display text-3xl font-light mb-4" style="font-family: var(--font-display); color: var(--color-sand-100);">
                  Thank you, <span class="italic" style="color: var(--color-gold-400);">{{ form.name.split(' ')[0] }}</span>
                </h3>
                <p class="text-sm opacity-75" style="font-family: var(--font-body); color: var(--color-sand-200); line-height: 1.8;">
                  We've received your enquiry and will be in touch within 24 hours. We look forward to discussing your expedition.
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.contact-info-item {
  display: flex;
  align-items: flex-start;
  gap: 14px;
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

.form-input::placeholder {
  color: rgba(248, 245, 239, 0.3);
}

.form-input:focus {
  border-color: var(--color-gold-400);
}

input[type="date"].form-input {
  color-scheme: dark;
}

input[type="date"].form-input::-webkit-calendar-picker-indicator {
  filter: invert(1) brightness(0.8) sepia(1) hue-rotate(180deg) saturate(3);
  cursor: pointer;
}

.success-message {
  background: rgba(10, 46, 74, 0.35);
  border: 1px solid rgba(201, 168, 76, 0.3);
  padding: 60px 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 400px;
}

.success-icon {
  width: 64px;
  height: 64px;
  border: 1px solid rgba(201, 168, 76, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
}

.error-message {
  background: rgba(224, 123, 90, 0.1);
  border: 1px solid rgba(224, 123, 90, 0.3);
  color: #e07b5a;
  padding: 0.75rem 1rem;
  font-size: 0.8rem;
}
</style>
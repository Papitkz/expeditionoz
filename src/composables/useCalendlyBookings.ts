// src/composables/useCalendlyBookings.ts
//
// Reads the `calendly_bookings` Firestore collection, populated by the
// `calendly-webhook` Supabase Edge Function whenever Calendly fires an
// invitee.created / invitee.canceled event. See:
//   supabase/functions/calendly-webhook/index.ts

import { ref } from 'vue'
import { collection, getDocs, query, orderBy } from 'firebase/firestore'
import { getFirebaseDb } from '@/lib/firebase'

export interface CalendlyBooking {
  id: string
  source: 'calendly'
  eventType: string
  status: string
  inviteeName: string
  inviteeEmail: string
  timezone: string
  eventName: string
  startTime: string
  endTime: string
  location: string
  questionsAndAnswers: Array<{ question: string; answer: string }>
  cancelUrl: string
  rescheduleUrl: string
  cancellationReason: string
  receivedAt: string
}

export function useCalendlyBookings() {
  const bookings = ref<CalendlyBooking[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const isConfigured = ref(true) // flips false if the collection read itself fails in a way that suggests setup isn't done

  async function loadCalendlyBookings() {
    loading.value = true
    error.value = null
    try {
      const db = getFirebaseDb()
      const snap = await getDocs(query(collection(db, 'calendly_bookings'), orderBy('receivedAt', 'desc')))
      bookings.value = snap.docs.map((d) => {
        const data = d.data() as Record<string, unknown>
        return {
          id: d.id,
          source: 'calendly',
          eventType: (data.eventType as string) || '',
          status: (data.status as string) || 'active',
          inviteeName: (data.inviteeName as string) || '',
          inviteeEmail: (data.inviteeEmail as string) || '',
          timezone: (data.timezone as string) || '',
          eventName: (data.eventName as string) || '',
          startTime: (data.startTime as string) || '',
          endTime: (data.endTime as string) || '',
          location: (data.location as string) || '',
          questionsAndAnswers: (data.questionsAndAnswers as Array<{ question: string; answer: string }>) || [],
          cancelUrl: (data.cancelUrl as string) || '',
          rescheduleUrl: (data.rescheduleUrl as string) || '',
          cancellationReason: (data.cancellationReason as string) || '',
          receivedAt: (data.receivedAt as string) || '',
        } satisfies CalendlyBooking
      })
    } catch (e) {
      console.warn('Could not load Calendly bookings (webhook may not be configured yet):', e)
      error.value = e instanceof Error ? e.message : 'Unknown error'
      bookings.value = []
    }
    loading.value = false
  }

  return {
    bookings,
    loading,
    error,
    isConfigured,
    loadCalendlyBookings,
  }
}

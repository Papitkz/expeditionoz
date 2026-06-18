// src/composables/useRezdyBooking.ts
//
// Talks to the rezdy-proxy Supabase Edge Function to get real Rezdy
// products, availability, and to create bookings.
//
// MOCK MODE: until your Rezdy API key + Edge Function are live, this
// composable returns realistic mock data shaped exactly like Rezdy's
// real API responses, so the UI can be built and tested today.
//
// To go live: set USE_MOCK_DATA to false below (or wire it to an env var).

import { ref } from 'vue'
import { supabase } from '@/lib/supabase'

// ---- Flip this to false once your Edge Function + API key are live ----
const USE_MOCK_DATA = true
// -------------------------------------------------------------------

export interface RezdyPriceOption {
  id: number
  label: string
  price: number
  seatsUsed: number
}

export interface RezdySession {
  id: number
  productCode: string
  startTimeLocal: string
  endTimeLocal: string
  seats: number
  seatsAvailable: number
  priceOptions: RezdyPriceOption[]
}

export interface RezdyProduct {
  productCode: string
  name: string
  shortDescription: string
  advertisedPrice: number
  currency: string
  durationMinutes: number
  priceOptions: RezdyPriceOption[]
  images: { largeSizeUrl: string; thumbnailUrl: string }[]
}

// Maps your site's internal trip slugs to real Rezdy product codes
export const REZDY_PRODUCT_CODES: Record<string, string> = {
  'ocean-safari': 'PMGSXN',
  'dive-expedition': 'PKN1J1',
}

// ---------------- Mock data (shaped like real Rezdy responses) ----------------

const MOCK_PRODUCTS: Record<string, RezdyProduct> = {
  PMGSXN: {
    productCode: 'PMGSXN',
    name: 'Ocean Safari — Northern Ningaloo Reef Expedition',
    shortDescription: 'Six days exploring the northern reaches of Ningaloo Marine Park.',
    advertisedPrice: 2495,
    currency: 'AUD',
    durationMinutes: 60 * 24 * 6,
    priceOptions: [
      { id: 1, label: 'Adult', price: 2495, seatsUsed: 1 },
      { id: 2, label: 'Shared Twin (per person)', price: 2295, seatsUsed: 1 },
    ],
    images: [],
  },
  PKN1J1: {
    productCode: 'PKN1J1',
    name: 'Dive Expedition — Full Ningaloo Reef Live-Aboard',
    shortDescription: 'Nine days covering the full length of Ningaloo Marine Park.',
    advertisedPrice: 4495,
    currency: 'AUD',
    durationMinutes: 60 * 24 * 9,
    priceOptions: [
      { id: 3, label: 'Adult', price: 4495, seatsUsed: 1 },
      { id: 4, label: 'Certified Diver', price: 4795, seatsUsed: 1 },
    ],
    images: [],
  },
}

function buildMockSessions(productCode: string): RezdySession[] {
  const product = MOCK_PRODUCTS[productCode]
  const today = new Date()
  const sessions: RezdySession[] = []
  for (let i = 1; i <= 6; i++) {
    const start = new Date(today.getFullYear(), today.getMonth() + i, 8, 8, 0, 0)
    const durDays = productCode === 'PKN1J1' ? 9 : 6
    const end = new Date(start)
    end.setDate(end.getDate() + durDays)
    const seatsAvailable = [12, 4, 0, 9, 2, 14][i % 6]
    sessions.push({
      id: 100000 + i,
      productCode,
      startTimeLocal: formatLocal(start),
      endTimeLocal: formatLocal(end),
      seats: 14,
      seatsAvailable,
      priceOptions: product.priceOptions.map((p) => ({ ...p })),
    })
  }
  return sessions
}

function formatLocal(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(
    d.getMinutes(),
  )}:00`
}

// ---------------- Edge Function calls ----------------

async function callRezdyProxy<T>(payload: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.functions.invoke('rezdy-proxy', {
    body: payload,
  })
  if (error) throw error
  return data as T
}

export function useRezdyBooking() {
  const loadingProduct = ref(false)
  const loadingAvailability = ref(false)
  const submitting = ref(false)
  const errorMessage = ref('')

  async function fetchProduct(slug: string): Promise<RezdyProduct | null> {
    const productCode = REZDY_PRODUCT_CODES[slug]
    if (!productCode) return null

    loadingProduct.value = true
    errorMessage.value = ''
    try {
      if (USE_MOCK_DATA) {
        await sleep(250)
        return MOCK_PRODUCTS[productCode] ?? null
      }
      const data = await callRezdyProxy<{ product?: RezdyProduct; requestStatus: { success: boolean } }>(
        { action: 'getProduct', productCode },
      )
      return data.product ?? null
    } catch (e) {
      errorMessage.value = e instanceof Error ? e.message : 'Failed to load product'
      return null
    } finally {
      loadingProduct.value = false
    }
  }

  async function fetchAvailability(slug: string, monthsAhead = 8): Promise<RezdySession[]> {
    const productCode = REZDY_PRODUCT_CODES[slug]
    if (!productCode) return []

    loadingAvailability.value = true
    errorMessage.value = ''
    try {
      if (USE_MOCK_DATA) {
        await sleep(350)
        return buildMockSessions(productCode)
      }
      const today = new Date()
      const start = formatLocal(today)
      const future = new Date(today)
      future.setMonth(future.getMonth() + monthsAhead)
      const end = formatLocal(future)

      const data = await callRezdyProxy<{ sessions?: RezdySession[]; requestStatus: { success: boolean } }>(
        {
          action: 'getAvailability',
          productCodes: [productCode],
          startTimeLocal: start,
          endTimeLocal: end,
        },
      )
      return data.sessions ?? []
    } catch (e) {
      errorMessage.value = e instanceof Error ? e.message : 'Failed to load availability'
      return []
    } finally {
      loadingAvailability.value = false
    }
  }

  async function createBooking(params: {
    slug: string
    session: RezdySession
    priceOption: RezdyPriceOption
    quantity: number
    customer: { firstName: string; lastName: string; email: string; phone: string }
    comments?: string
  }): Promise<{ success: boolean; orderNumber?: string; error?: string }> {
    const productCode = REZDY_PRODUCT_CODES[params.slug]
    submitting.value = true
    errorMessage.value = ''

    try {
      if (USE_MOCK_DATA) {
        await sleep(600)
        return { success: true, orderNumber: 'MOCK-' + Math.random().toString(36).slice(2, 8).toUpperCase() }
      }

      const booking = {
        customer: {
          firstName: params.customer.firstName,
          lastName: params.customer.lastName,
          email: params.customer.email,
          phone: params.customer.phone,
        },
        items: [
          {
            productCode,
            startTimeLocal: params.session.startTimeLocal,
            quantities: [{ optionLabel: params.priceOption.label, value: params.quantity }],
          },
        ],
        comments: params.comments || '',
        // No "payments" array here on purpose: this records the booking
        // as PROCESSING/awaiting payment. Wire up RezdyPay/Stripe or a
        // manual payment record once your payment flow is decided.
      }

      const data = await callRezdyProxy<{
        requestStatus: { success: boolean; error?: { errorMessage: string } }
        booking?: { orderNumber: string }
      }>({ action: 'createBooking', booking })

      if (!data.requestStatus.success) {
        return { success: false, error: data.requestStatus.error?.errorMessage || 'Booking failed' }
      }
      return { success: true, orderNumber: data.booking?.orderNumber }
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to create booking'
      errorMessage.value = msg
      return { success: false, error: msg }
    } finally {
      submitting.value = false
    }
  }

  return {
    loadingProduct,
    loadingAvailability,
    submitting,
    errorMessage,
    fetchProduct,
    fetchAvailability,
    createBooking,
    isMockMode: USE_MOCK_DATA,
  }
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

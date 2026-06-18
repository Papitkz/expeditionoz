// supabase/functions/rezdy-proxy/index.ts
//
// Secure server-side proxy to the Rezdy Supplier API.
// The Rezdy API key NEVER goes to the browser — it lives only in this
// function's environment variable (set via `supabase secrets set`).
//
// The browser calls THIS function instead of api.rezdy.com directly,
// because Rezdy blocks direct browser/CORS requests to their API.
//
// Deploy with:
//   supabase functions deploy rezdy-proxy
//
// Set secrets with:
//   supabase secrets set REZDY_API_KEY=your_real_key_here
//   supabase secrets set REZDY_ENV=staging   (or "production")

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const REZDY_API_KEY = Deno.env.get('REZDY_API_KEY') ?? ''
const REZDY_ENV = Deno.env.get('REZDY_ENV') ?? 'staging' // 'staging' | 'production'

const REZDY_BASE_URL =
  REZDY_ENV === 'production'
    ? 'https://api.rezdy.com/v1'
    : 'https://api.rezdy-staging.com/v1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
}

type ProxyAction =
  | { action: 'getProducts' }
  | { action: 'getProduct'; productCode: string }
  | { action: 'getAvailability'; productCodes: string[]; startTimeLocal: string; endTimeLocal: string }
  | { action: 'createBooking'; booking: Record<string, unknown> }

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (!REZDY_API_KEY) {
    return jsonResponse(
      { success: false, error: 'REZDY_API_KEY is not configured on the server.' },
      500,
    )
  }

  try {
    const body = (await req.json()) as ProxyAction

    switch (body.action) {
      case 'getProducts':
        return await proxyGet('/products')

      case 'getProduct':
        return await proxyGet(`/products/${encodeURIComponent(body.productCode)}`)

      case 'getAvailability': {
        const params = new URLSearchParams()
        params.set('apiKey', REZDY_API_KEY)
        for (const code of body.productCodes) params.append('productCode', code)
        params.set('startTimeLocal', body.startTimeLocal)
        params.set('endTimeLocal', body.endTimeLocal)
        const res = await fetch(`${REZDY_BASE_URL}/availability?${params.toString()}`)
        const data = await res.json()
        return jsonResponse(data, res.status)
      }

      case 'createBooking': {
        const res = await fetch(`${REZDY_BASE_URL}/bookings?apiKey=${REZDY_API_KEY}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json; charset=UTF-8',
            Accept: 'application/json',
          },
          body: JSON.stringify(body.booking),
        })
        const data = await res.json()
        return jsonResponse(data, res.status)
      }

      default:
        return jsonResponse({ success: false, error: 'Unknown action' }, 400)
    }
  } catch (err) {
    return jsonResponse(
      { success: false, error: err instanceof Error ? err.message : 'Unknown error' },
      500,
    )
  }
})

async function proxyGet(path: string): Promise<Response> {
  const res = await fetch(`${REZDY_BASE_URL}${path}?apiKey=${REZDY_API_KEY}`, {
    headers: { Accept: 'application/json' },
  })
  const data = await res.json()
  return jsonResponse(data, res.status)
}

function jsonResponse(data: unknown, status: number): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

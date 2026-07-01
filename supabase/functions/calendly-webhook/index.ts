// supabase/functions/calendly-webhook/index.ts
//
// Receives Calendly webhook events (invitee.created / invitee.canceled) and
// writes them into the same Firestore project the rest of the app uses
// (collection: "calendly_bookings"), so they show up in Admin → Bookings.
//
// ── One-time setup ──────────────────────────────────────────────────────
//
// 1. In Calendly, go to Integrations → API & Webhooks → create a Personal
//    Access Token, then create a webhook subscription pointed at this
//    function's URL once deployed:
//
//      POST https://api.calendly.com/webhook_subscriptions
//      Authorization: Bearer <your Calendly personal access token>
//      Content-Type: application/json
//      {
//        "url": "https://<your-project-ref>.supabase.co/functions/v1/calendly-webhook",
//        "events": ["invitee.created", "invitee.canceled"],
//        "organization": "<your org URI>",
//        "scope": "organization",
//        "signing_key": "<a random string you generate, 16+ chars>"
//      }
//
//    Save that `signing_key` — you'll need it below.
//
// 2. In Firebase, go to Project Settings → Service Accounts → "Generate new
//    private key". This downloads a JSON file (NOT the same as the
//    apiKey/appId used in src/lib/firebase.ts — those are public browser
//    config; this is a private server credential and must never reach the
//    browser).
//
// 3. Set these secrets (from this project's root, with the Supabase CLI):
//
//      supabase secrets set CALENDLY_SIGNING_KEY=the_signing_key_from_step_1
//      supabase secrets set FIREBASE_PROJECT_ID=expedition-drenched
//      supabase secrets set FIREBASE_CLIENT_EMAIL=the_client_email_from_the_json_file
//      supabase secrets set FIREBASE_PRIVATE_KEY="$(cat path/to/service-account.json | python3 -c 'import json,sys; print(json.load(sys.stdin)["private_key"])')"
//
// 4. Deploy:
//
//      supabase functions deploy calendly-webhook --no-verify-jwt
//
//    (--no-verify-jwt is required: Calendly calls this URL directly and
//    won't send a Supabase auth header.)

const CALENDLY_SIGNING_KEY = Deno.env.get('CALENDLY_SIGNING_KEY') ?? ''
const FIREBASE_PROJECT_ID = Deno.env.get('FIREBASE_PROJECT_ID') ?? ''
const FIREBASE_CLIENT_EMAIL = Deno.env.get('FIREBASE_CLIENT_EMAIL') ?? ''
const FIREBASE_PRIVATE_KEY = (Deno.env.get('FIREBASE_PRIVATE_KEY') ?? '').replace(/\\n/g, '\n')

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'content-type, calendly-webhook-signature',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }
  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405)
  }

  const rawBody = await req.text()

  // ── 1. Verify the request really came from Calendly ──────────────────
  if (CALENDLY_SIGNING_KEY) {
    const signatureHeader = req.headers.get('Calendly-Webhook-Signature')
    const verified = signatureHeader
      ? await verifyCalendlySignature(signatureHeader, rawBody, CALENDLY_SIGNING_KEY)
      : false

    if (!verified) {
      return jsonResponse({ error: 'Invalid signature' }, 401)
    }
  } else {
    // No signing key configured yet — accept but flag it, so setup isn't
    // silently broken. Set CALENDLY_SIGNING_KEY as soon as possible.
    console.warn('CALENDLY_SIGNING_KEY is not set — accepting unverified webhook request.')
  }

  let body: CalendlyWebhookPayload
  try {
    body = JSON.parse(rawBody)
  } catch {
    return jsonResponse({ error: 'Invalid JSON body' }, 400)
  }

  try {
    await saveBookingToFirestore(body)
  } catch (e) {
    console.error('Failed to save Calendly event to Firestore:', e)
    // Still return 200 — Calendly retries on non-2xx, and a Firestore write
    // failure here usually means a config problem, not a transient one, so
    // retries won't help. We don't want to lose the event entirely though,
    // so this is logged for follow-up.
    return jsonResponse({ received: true, stored: false }, 200)
  }

  return jsonResponse({ received: true, stored: true }, 200)
})

// ── Types ──────────────────────────────────────────────────────────────

interface CalendlyWebhookPayload {
  event: 'invitee.created' | 'invitee.canceled' | string
  created_at: string
  payload: {
    uri?: string
    email?: string
    name?: string
    status?: string
    timezone?: string
    event?: string
    created_at?: string
    cancel_url?: string
    reschedule_url?: string
    questions_and_answers?: Array<{ question: string; answer: string }>
    cancellation?: { reason?: string; canceled_by?: string }
    scheduled_event?: {
      name?: string
      start_time?: string
      end_time?: string
      location?: { type?: string; location?: string }
    }
  }
}

// ── Signature verification ────────────────────────────────────────────
// Calendly-Webhook-Signature header format: "t=<timestamp>,v1=<hex signature>"
// Signed string is "<timestamp>.<raw body>", HMAC-SHA256 with the signing key.

async function verifyCalendlySignature(header: string, rawBody: string, signingKey: string): Promise<boolean> {
  const parts = Object.fromEntries(
    header.split(',').map((pair) => {
      const [k, v] = pair.split('=')
      return [k.trim(), v?.trim() ?? '']
    }),
  )
  const timestamp = parts['t']
  const signature = parts['v1']
  if (!timestamp || !signature) return false

  const signedPayload = `${timestamp}.${rawBody}`

  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(signingKey),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const mac = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(signedPayload))
  const expectedHex = Array.from(new Uint8Array(mac))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')

  return timingSafeEqual(expectedHex, signature)
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let mismatch = 0
  for (let i = 0; i < a.length; i++) mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return mismatch === 0
}

// ── Firestore write (REST API, authenticated via service account) ──────

let cachedAccessToken: { token: string; expiresAt: number } | null = null

async function getFirestoreAccessToken(): Promise<string> {
  if (cachedAccessToken && cachedAccessToken.expiresAt > Date.now() + 30_000) {
    return cachedAccessToken.token
  }
  if (!FIREBASE_CLIENT_EMAIL || !FIREBASE_PRIVATE_KEY) {
    throw new Error('Firebase service account secrets are not configured.')
  }

  const now = Math.floor(Date.now() / 1000)
  const jwtHeader = base64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }))
  const jwtClaims = base64url(
    JSON.stringify({
      iss: FIREBASE_CLIENT_EMAIL,
      sub: FIREBASE_CLIENT_EMAIL,
      aud: 'https://oauth2.googleapis.com/token',
      iat: now,
      exp: now + 3600,
      scope: 'https://www.googleapis.com/auth/datastore',
    }),
  )
  const unsignedJwt = `${jwtHeader}.${jwtClaims}`

  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8',
    pemToArrayBuffer(FIREBASE_PRIVATE_KEY),
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const signature = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', cryptoKey, new TextEncoder().encode(unsignedJwt))
  const signedJwt = `${unsignedJwt}.${base64urlFromBytes(new Uint8Array(signature))}`

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: signedJwt,
    }),
  })
  if (!tokenRes.ok) {
    throw new Error(`Failed to get Firestore access token: ${await tokenRes.text()}`)
  }
  const tokenData = await tokenRes.json()
  cachedAccessToken = {
    token: tokenData.access_token,
    expiresAt: Date.now() + tokenData.expires_in * 1000,
  }
  return cachedAccessToken.token
}

function base64url(input: string): string {
  return base64urlFromBytes(new TextEncoder().encode(input))
}

function base64urlFromBytes(bytes: Uint8Array): string {
  let binary = ''
  for (const b of bytes) binary += String.fromCharCode(b)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function pemToArrayBuffer(pem: string): ArrayBuffer {
  const b64 = pem
    .replace('-----BEGIN PRIVATE KEY-----', '')
    .replace('-----END PRIVATE KEY-----', '')
    .replace(/\s/g, '')
  const binary = atob(b64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes.buffer
}

function firestoreValue(value: unknown): Record<string, unknown> {
  if (value === null || value === undefined) return { nullValue: null }
  if (typeof value === 'string') return { stringValue: value }
  if (typeof value === 'boolean') return { booleanValue: value }
  if (typeof value === 'number') return { doubleValue: value }
  if (Array.isArray(value)) {
    return { arrayValue: { values: value.map((v) => firestoreValue(v)) } }
  }
  if (typeof value === 'object') {
    const fields: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      fields[k] = firestoreValue(v)
    }
    return { mapValue: { fields } }
  }
  return { stringValue: String(value) }
}

async function saveBookingToFirestore(body: CalendlyWebhookPayload): Promise<void> {
  if (!FIREBASE_PROJECT_ID) {
    throw new Error('FIREBASE_PROJECT_ID is not configured.')
  }

  const accessToken = await getFirestoreAccessToken()
  const p = body.payload || {}

  // Derive a stable-ish document id so retried/duplicate deliveries for the
  // same invitee+event don't pile up as separate rows.
  const inviteeUri = p.uri || ''
  const docId = inviteeUri
    ? inviteeUri.split('/').pop() || crypto.randomUUID()
    : crypto.randomUUID()

  const record = {
    source: 'calendly',
    eventType: body.event,
    status: p.status || (body.event === 'invitee.canceled' ? 'canceled' : 'active'),
    inviteeName: p.name || '',
    inviteeEmail: p.email || '',
    timezone: p.timezone || '',
    eventName: p.scheduled_event?.name || '',
    startTime: p.scheduled_event?.start_time || '',
    endTime: p.scheduled_event?.end_time || '',
    location: p.scheduled_event?.location?.location || p.scheduled_event?.location?.type || '',
    questionsAndAnswers: p.questions_and_answers || [],
    cancelUrl: p.cancel_url || '',
    rescheduleUrl: p.reschedule_url || '',
    cancellationReason: p.cancellation?.reason || '',
    receivedAt: new Date().toISOString(),
    raw: JSON.stringify(body),
  }

  const fields: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(record)) {
    fields[k] = firestoreValue(v)
  }

  const url = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/calendly_bookings/${docId}`

  const res = await fetch(url, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ fields }),
  })

  if (!res.ok) {
    throw new Error(`Firestore write failed: ${res.status} ${await res.text()}`)
  }
}

function jsonResponse(data: unknown, status: number): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

# Rezdy → Firebase Setup Guide

## Files Changed
- `src/composables/useRezdy.ts` — now reads config from Firestore instead of Supabase
- `src/composables/useRezdyBooking.ts` — now calls Firebase Cloud Function instead of Supabase Edge Function
- `functions/src/rezdyProxy.ts` — NEW: Firebase Cloud Function (replaces Supabase rezdy-proxy)
- `functions/src/index.ts` — NEW: exports the function
- `functions/package.json` — NEW: functions dependencies
- `functions/tsconfig.json` — NEW: functions TypeScript config

---

## Step 1 — Add Firestore Config Document

In Firebase Console → Firestore, create this document:

  Collection: cms_settings
  Document ID: rezdy
  Fields:
    rezdy_company_code            → (your Rezdy subdomain, e.g. "expeditiondrenched")
    rezdy_ocean_safari_product_id → (from Rezdy dashboard Products page)
    rezdy_dive_expedition_product_id → (from Rezdy dashboard Products page)

---

## Step 2 — Set Your Rezdy API Key as a Firebase Secret

  firebase functions:secrets:set REZDY_API_KEY
  (paste your API key when prompted — get it from Rezdy account → API)

---

## Step 3 — Install & Deploy the Cloud Function

  cd functions
  npm install
  cd ..
  firebase deploy --only functions:rezdyProxy

---

## Step 4 — Install firebase/functions in your frontend

  yarn add firebase   ← already installed, but make sure version includes getFunctions
  (firebase >= 9.x is required — you already have this)

---

## Step 5 — Verify Product Codes

In src/composables/useRezdyBooking.ts, confirm these match your Rezdy dashboard:

  'ocean-safari':    'PMGSXN'
  'dive-expedition': 'PKN1J1'

---

## That's it — booking widget is now live on Firebase!

# Rezdy Booking Integration — Files

These files mirror the exact folder structure of your EXpedition_Drenched project.
Unzip this directly into your project root and the files will land in the right place:

```
your-project/
├── src/
│   ├── components/
│   │   └── RezdyBookingWidget.vue      ← new booking widget UI
│   └── composables/
│       └── useRezdyBooking.ts          ← talks to Rezdy (mock data for now)
└── supabase/
    └── functions/
        └── rezdy-proxy/
            └── index.ts                ← server-side proxy (deploy later)
```

## What works right now (no setup needed)

`RezdyBookingWidget.vue` is fully functional today using realistic mock data —
same product names, same prices, same real product codes (PMGSXN / PKN1J1) as
your actual Rezdy account. You can drop it in and test the whole flow immediately.

## To use it on a page

In `src/views/BookView.vue`, import and use it like this:

```vue
<script setup>
import RezdyBookingWidget from '@/components/RezdyBookingWidget.vue'
</script>

<template>
  <RezdyBookingWidget :slug="activeTrip.id" />
</template>
```

`slug` must be either `'ocean-safari'` or `'dive-expedition'` — these map to your
real Rezdy product codes inside `useRezdyBooking.ts`.

## To go live with real Rezdy data (once you have your API key)

1. Deploy the Edge Function:
   ```
   supabase functions deploy rezdy-proxy
   ```
2. Set your secrets (never commit these to git):
   ```
   supabase secrets set REZDY_API_KEY=your_real_key_here
   supabase secrets set REZDY_ENV=staging
   ```
   (use `REZDY_ENV=production` once you've tested on staging)
3. In `src/composables/useRezdyBooking.ts`, change:
   ```ts
   const USE_MOCK_DATA = true
   ```
   to:
   ```ts
   const USE_MOCK_DATA = false
   ```

That's it — the widget will then show real upcoming departures, real seats
remaining, and real bookings will be created in your Rezdy account.

## Note on payments

The current `createBooking` call in `useRezdyBooking.ts` creates the booking
in Rezdy without an immediate payment attached (no `payments` array), so it's
recorded as pending/awaiting payment rather than charged automatically. Once
you decide how you want to take payment (RezdyPay/Stripe at time of booking,
or a manual deposit process), that's the one section to extend — happy to help
with that next.

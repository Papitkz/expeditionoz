<script setup lang="ts">
import { useSEO } from '@/composables/useSEO'
import { useScrollReveal } from '@/composables/useScrollReveal'
import HeroSection from '@/components/home/HeroSection.vue'
import ExperienceSection from '@/components/home/ExperienceSection.vue'
import InclusionsSection from '@/components/home/InclusionsSection.vue'

useScrollReveal()

useSEO({
  title: 'Sail Ningaloo Reef — Expedition OZ',
  description: 'Sail Ningaloo Reef aboard Expedition OZ. Ocean Safari Expedition, Dive Expedition and Ocean Safari Escape — small-group, all-inclusive sailing expeditions departing Exmouth, Western Australia.',
  image: 'https://expeditionoz.netlify.app/og-home.jpg',  // ← FIXED: removed space
  type: 'website',
  keywords: ['Ningaloo Reef', 'sailing expedition', 'luxury tours', 'whale sharks', 'Western Australia', 'Ocean Safari Expedition', 'Dive Expedition', 'Ocean Safari Escape', 'Expedition OZ'],
  jsonLd: {
    "@context": "https://schema.org",  // ← FIXED
    "@type": "TravelAgency",
    "name": "Expedition OZ",
    "url": "https://expedition-oz.com",  // ← FIXED
    "logo": "https://expeditionoz.netlify.app/logo.png",  // ← FIXED
    "description": "Luxury live-aboard experiences in Ningaloo Reef, Western Australia",
    "address": {
      "@type": "PostalAddress",
      "addressLocality": "Exmouth",
      "addressRegion": "WA",
      "addressCountry": "AU"
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": -21.9315,
      "longitude": 114.1280
    },
    "telephone": "+61-234-567-890",
    "priceRange": "$$$$",
    "openingHoursSpecification": {
      "@type": "OpeningHoursSpecification",
      "validFrom": "2026-04-01",
      "validThrough": "2026-09-30"
    }
  }
})
</script>

<template>
  <div>
    <HeroSection />
    <ExperienceSection />
    <InclusionsSection />
    <!-- <CtaSection/> -->
  </div>
</template>
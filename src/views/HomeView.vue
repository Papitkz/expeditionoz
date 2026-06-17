<script setup lang="ts">
import { useSEO } from '@/composables/useSEO'
import { useScrollReveal } from '@/composables/useScrollReveal'
import HeroSection from '@/components/home/HeroSection.vue'
import IntroSection from '@/components/home/IntroSection.vue'
import ToursSection from '@/components/home/ToursSection.vue'
import ExperienceSection from '@/components/home/ExperienceSection.vue'
import InclusionsSection from '@/components/home/InclusionsSection.vue'
import TestimonialsSection from '@/components/home/TestimonialsSection.vue'
import CtaSection from '@/components/home/CtaSection.vue'

useScrollReveal()

useSEO({
  title: 'Luxury Live-Aboard Ningaloo Reef',
  description: 'Experience luxury live-aboard expeditions in Ningaloo Reef, Western Australia. Swim with whale sharks, snorkel coral gardens, and explore marine wilderness aboard Ocean Safari or Dive Expedition.',
  image: 'https://expeditionoz.netlify.app/og-home.jpg',  // ← FIXED: removed space
  type: 'website',
  keywords: ['Ningaloo Reef', 'live-aboard', 'luxury tours', 'whale sharks', 'Western Australia', 'Ocean Safari', 'Dive Expedition','Expedition OZ'],
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
    <ToursSection />
    <ExperienceSection />
    <InclusionsSection />
    <!-- <CtaSection/> -->
  </div>
</template>
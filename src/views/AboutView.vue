<script setup lang="ts">

import { ref, computed, onMounted } from 'vue'
import { useSEO } from '@/composables/useSEO'
import { useScrollReveal } from '@/composables/useScrollReveal'
import CtaSection from '@/components/home/CtaSection.vue'
import PageHero from '@/components/PageHero.vue'
import NoImagePlaceholder from '@/components/NoImagePlaceholder.vue'
import { useComponentCMS } from '@/composables/useComponentCMS'

const cms = useComponentCMS('AboutView')

useSEO({
  title: 'About Us',
  description: 'Discover the story behind Expedition OZ. Passionate marine experts dedicated to sustainable luxury tourism in Ningaloo Reef, Western Australia.',
  path: '/about',
  type: 'article',
  keywords: ['Expedition OZ', 'about us', 'Ningaloo Reef', 'marine conservation', 'Western Australia', 'live-aboard team'],
  jsonLd: {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    "name": "About Expedition OZ",
    "description": "Discover the story behind Expedition OZ. Passionate marine experts dedicated to sustainable luxury tourism in Ningaloo Reef.",
    "url": "https://expeditionoz.netlify.app/about",
    "mainEntity": {
      "@type": "Organization",
      "name": "Expedition OZ",
      "url": "https://expeditionoz.netlify.app",
      "logo": "https://expeditionoz.netlify.app/logo.png",
      "description": "Luxury live-aboard experiences in Ningaloo Reef, Western Australia",
      "address": {
        "@type": "PostalAddress",
        "addressLocality": "Exmouth",
        "addressRegion": "WA",
        "addressCountry": "AU"
      }
    }
  }
})

useScrollReveal()

const heroImage = computed(() => cms.getImageUrl('hero', 0))
const aboutImages = computed(() =>
  cms.getSection('aboutImages').map((item) => ({
    src: item.imageUrl || '',
    alt: item.alt || '',
    hasImage: !!item.imageUrl,
  }))
)

const values = [
  {
    icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--color-gold-400)" stroke-width="1.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`,
    title: 'Conservation First',
    desc: 'We operate under strict marine park guidelines and contribute to reef conservation research. Every expedition funds reef health monitoring.'
  },
  {
    icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--color-gold-400)" stroke-width="1.5"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="M12 8v4l3 3"/></svg>`,
    title: 'Expert Naturalists',
    desc: 'Our marine naturalists are among Australias most experienced. Their passion and knowledge transform every encounter into a deep understanding.'
  },
  {
    icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--color-gold-400)" stroke-width="1.5"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>`,
    title: 'Genuine Luxury',
    desc: 'We believe adventure and comfort belong together. Every detail aboard — from the linens to the wine list — reflects our commitment to excellence.'
  },
  {
    icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--color-gold-400)" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><path d="M8.56 2.75c4.37 6.03 6.02 9.42 8.03 17.72m2.54-15.38c-3.72 4.35-8.94 5.66-16.88 5.85m19.5 1.9c-3.5-.93-6.63-.82-8.94 0-2.58.92-5.01 2.86-7.44 6.32"/></svg>`,
    title: 'Ningaloo Expertise',
    desc: 'Born and raised in this extraordinary corner of the world. Our local knowledge of tides, seasons, and reef conditions is unmatched.'
  },
]

onMounted(async () => {
  await cms.load()
})
</script>

<template>
  <div>
    <PageHero
      tag="Our Story"
      title="Where Passion"
      title-italic="Meets the Ocean"
      subtitle="Expedition OZ was founded by ocean lovers who refused to choose between adventure and luxury."
      image=""
      image-alt="Sunset over Ningaloo Reef Western Australia"
      height="60vh"
    >
      <template #default>
        <template v-if="heroImage">
          <img
            :src="heroImage"
            alt="Sunset over Ningaloo Reef Western Australia"
            class="absolute inset-0 w-full h-full object-cover opacity-50"
            style="opacity: 0.5;"
          />
        </template>
        <NoImagePlaceholder v-else class="absolute inset-0" />
      </template>
    </PageHero>

    <!-- About Section - Updated Content + Dynamic Images -->
    <section class="py-12 md:py-24 lg:py-32" style="background: var(--color-ocean-950);">
      <div class="container mx-auto px-4 sm:px-6 lg:px-12">
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 lg:gap-16 items-center">
          <div class="section-reveal-left order-2 lg:order-1">
            <p class="overline-text mb-2 md:mb-4 text-xs md:text-sm">About Expedition OZ</p>
            <div class="gold-divider-left mb-4 md:mb-6"></div>
            <h2 class="font-display text-2xl md:text-4xl lg:text-5xl font-light mb-4 md:mb-6" style="font-family: var(--font-display); color: var(--color-sand-100);">
              A Decade of <span class="italic" style="color: var(--color-gold-400);">Ocean Expeditions</span>
            </h2>
            <p class="text-sm md:text-base leading-relaxed mb-3 md:mb-5 opacity-80" style="font-family: var(--font-body); color: var(--color-sand-200); line-height: 1.9;">
              Expedition OZ began with a simple belief: that the world's most extraordinary marine wilderness deserved an experience worthy of it. From humble beginnings with a single vessel, we have grown into Western Australia's premier luxury live-aboard operator.
            </p>
            <p class="text-sm md:text-base leading-relaxed mb-3 md:mb-5 opacity-80" style="font-family: var(--font-body); color: var(--color-sand-200); line-height: 1.9;">
              Ningaloo Reef is not just our workplace — it is our home. We have watched whale sharks glide beneath our boats, marvelled at manta rays performing their graceful ballet, and watched countless guests emerge from the water forever changed.
            </p>
            <p class="text-sm md:text-base leading-relaxed opacity-80" style="font-family: var(--font-body); color: var(--color-sand-200); line-height: 1.9;">
              We are a small, passionate team committed to three things: the reef, our guests, and the belief that true luxury is about profound experience — not just comfort.
            </p>
          </div>

          <div class="section-reveal-right order-1 lg:order-2 relative overflow-hidden h-[300px] md:h-[400px] lg:h-[500px]">
            <template v-if="aboutImages[0]?.hasImage">
              <img
                :src="aboutImages[0].src"
                :alt="aboutImages[0].alt || 'Team aboard luxury vessel Ningaloo Reef'"
                class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div class="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            </template>
            <NoImagePlaceholder v-else label="Team Image" class="w-full h-full" />
            <div class="absolute inset-0 border border-[rgba(201,168,76,0.2)] m-2 md:m-3 pointer-events-none"></div>
          </div>
        </div>
      </div>
    </section>

    <!-- Values Section -->
    <section class="py-12 md:py-24" style="background: var(--color-ocean-900);">
      <div class="container mx-auto px-4 sm:px-6 lg:px-12">
        <div class="text-center mb-8 md:mb-16 section-reveal">
          <p class="overline-text mb-2 md:mb-4 text-xs md:text-sm">What We Stand For</p>
          <div class="gold-divider mb-4 md:mb-6 mx-auto"></div>
          <h2 class="font-display text-2xl md:text-4xl lg:text-5xl font-light" style="font-family: var(--font-display); color: var(--color-sand-100);">
            Our <span class="italic" style="color: var(--color-gold-400);">Values</span>
          </h2>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 lg:gap-8">
          <div v-for="(val, i) in values" :key="val.title" class="value-card section-reveal" :style="`transition-delay: ${i * 0.1}s`">
            <div class="value-icon mb-3 md:mb-5" v-html="val.icon"></div>
            <h3 class="font-display text-xl md:text-2xl font-light mb-2 md:mb-3" style="font-family: var(--font-display); color: var(--color-sand-100);">{{ val.title }}</h3>
            <p class="text-sm leading-relaxed opacity-75" style="font-family: var(--font-body); color: var(--color-sand-200); line-height: 1.8;">{{ val.desc }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Ningaloo Reef Section - Dynamic Image -->
    <section class="py-12 md:py-24" style="background: var(--color-ocean-950);">
      <div class="container mx-auto px-4 sm:px-6 lg:px-12">
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 lg:gap-16 items-center">
          <div class="section-reveal-left order-2 lg:order-1">
            <p class="overline-text mb-2 md:mb-4 text-xs md:text-sm">Ningaloo Reef</p>
            <div class="gold-divider-left mb-4 md:mb-6"></div>
            <h2 class="font-display text-2xl md:text-4xl font-light mb-4 md:mb-6" style="font-family: var(--font-display); color: var(--color-sand-100);">
              The Last Great <span class="italic" style="color: var(--color-gold-400);">Reef Wilderness</span>
            </h2>
            <p class="text-sm md:text-base leading-relaxed mb-3 md:mb-5 opacity-80" style="font-family: var(--font-body); color: var(--color-sand-200); line-height: 1.9;">
              Spanning over 300km along the remote coast of Western Australia, Ningaloo Reef is a UNESCO World Heritage Site and one of the few places on Earth where whale sharks congregate predictably near the shore.
            </p>
            <p class="text-sm md:text-base leading-relaxed opacity-80" style="font-family: var(--font-body); color: var(--color-sand-200); line-height: 1.9;">
              Unlike the Great Barrier Reef, Ningaloo fringes directly on the shore — accessible, pristine, and breathtakingly biodiverse. It is the centrepiece of our expeditions and the reason we do what we do.
            </p>
          </div>
          <div class="section-reveal-right order-1 lg:order-2 overflow-hidden h-[250px] md:h-[350px] lg:h-[400px]">
            <template v-if="aboutImages[1]?.hasImage">
              <img
                :src="aboutImages[1].src"
                :alt="aboutImages[1].alt || 'Marine naturalist with whale shark'"
                class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div class="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            </template>
            <NoImagePlaceholder v-else label="Reef Image" class="w-full h-full" />
          </div>
        </div>
      </div>
    </section>

    <CtaSection />
  </div>
</template>

<style scoped>
.value-card {
  padding: 24px;
  border: 1px solid rgba(201, 168, 76, 0.12);
  background: rgba(7, 26, 43, 0.4);
  transition: border-color 0.3s ease;
}

@media (min-width: 768px) {
  .value-card {
    padding: 36px;
  }
}

.value-card:hover {
  border-color: rgba(201, 168, 76, 0.35);
}

.value-icon :deep(svg) {
  width: 24px;
  height: 24px;
}

@media (min-width: 768px) {
  .value-icon :deep(svg) {
    width: 28px;
    height: 28px;
  }
}
</style>

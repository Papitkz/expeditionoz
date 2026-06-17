<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useScrollReveal } from '@/composables/useScrollReveal'
import { useComponentCMS } from '@/composables/useComponentCMS'
import NoImagePlaceholder from '@/components/NoImagePlaceholder.vue'

const cms = useComponentCMS('IntroSection')
useScrollReveal()

const images = computed(() =>
  cms.getSection('introImages').map((item) => ({
    src: item.imageUrl || '',
    alt: item.alt || '',
    hasImage: !!item.imageUrl,
  }))
)

const mainImage = computed(() => images.value[0])
const accentImage = computed(() => images.value[1])

onMounted(async () => {
  await cms.load()
})
</script>

<template>
  <section class="py-16 md:py-24 lg:py-32" style="background: var(--color-ocean-950);">
    <div class="container mx-auto px-4 sm:px-6 lg:px-12">
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-12 lg:gap-16 items-center">
        <div class="relative section-reveal-left">
          <div class="relative overflow-hidden">
            <template v-if="mainImage?.hasImage">
              <img
                :src="mainImage.src"
                :alt="mainImage.alt || 'Ningaloo Reef aerial view showing turquoise waters and coral formations along the Western Australian coastline'"
                class="w-full h-[300px] md:h-[520px] object-cover"
                loading="lazy"
              />
            </template>
            <NoImagePlaceholder v-else label="No Main Image" class="h-[300px] md:h-[520px]" />
            <div class="absolute -bottom-4 -right-4 md:-bottom-6 md:-right-6 w-24 h-24 md:w-40 md:h-40 border border-[#C9A84C]/20" />
          </div>

          <div class="absolute -bottom-6 md:-bottom-10 -left-4 md:-left-8 w-32 h-40 md:w-48 md:h-56 overflow-hidden shadow-xl">
            <template v-if="accentImage?.hasImage">
              <img
                :src="accentImage.src"
                :alt="accentImage.alt || 'Whale shark encounter in crystal clear waters'"
                class="w-full h-full object-cover"
                loading="lazy"
              />
            </template>
            <NoImagePlaceholder v-else label="No Accent Image" class="h-full" />
          </div>
        </div>

        <div class="section-reveal-right lg:pl-8 mt-8 md:mt-0">
          <p class="overline-text mb-3 md:mb-4 text-xs md:text-sm">The Experience</p>
          <div class="gold-divider-left mb-4 md:mb-6"></div>
          <h2 class="font-display text-2xl md:text-4xl lg:text-5xl font-light mb-4 md:mb-6" style="font-family: var(--font-display); color: var(--color-sand-100);">
            Where Luxury Meets <span class="italic" style="color: var(--color-gold-400);">Wild</span>
          </h2>
          <p class="text-sm md:text-base leading-relaxed mb-3 md:mb-5 opacity-80" style="font-family: var(--font-body); color: var(--color-sand-200); line-height: 1.9;">
            Expedition OZ offers something rare in adventure travel — genuine luxury in the heart of the wild. Our vessels are your floating boutique hotels: beautifully appointed cabins, a talented chef preparing meals from local ingredients, and a crew that anticipates your every need.
          </p>
          <p class="text-sm md:text-base leading-relaxed mb-6 md:mb-8 opacity-80" style="font-family: var(--font-body); color: var(--color-sand-200); line-height: 1.9;">
            But the true magic happens when you step off the deck. Swim alongside whale sharks — the ocean's gentle giants. Drift over coral gardens teeming with life. Watch humpback whales breach at sunset. This is Ningaloo as few ever experience it.
          </p>

          <div class="grid grid-cols-3 gap-2 md:gap-6 mb-6 md:mb-8 pt-4 md:pt-6" style="border-top: 1px solid rgba(201, 168, 76, 0.15);">
            <div class="text-center">
              <p class="font-display text-xl md:text-3xl font-light" style="font-family: var(--font-display); color: var(--color-gold-400);">260</p>
              <p class="overline-text mt-1 text-[0.5rem] md:text-[0.55rem]">km of Reef</p>
            </div>
            <div class="text-center">
              <p class="font-display text-xl md:text-3xl font-light" style="font-family: var(--font-display); color: var(--color-gold-400);">500+</p>
              <p class="overline-text mt-1 text-[0.5rem] md:text-[0.55rem]">Fish Species</p>
            </div>
            <div class="text-center">
              <p class="font-display text-xl md:text-3xl font-light" style="font-family: var(--font-display); color: var(--color-gold-400);">UNESCO</p>
              <p class="overline-text mt-1 text-[0.5rem] md:text-[0.55rem]">World Heritage</p>
            </div>
          </div>

          <router-link to="/about" class="btn-outline inline-block text-sm md:text-base px-6 py-3 md:px-8 md:py-4">
            Our Story
          </router-link>
        </div>
      </div>
    </div>
  </section>
</template>

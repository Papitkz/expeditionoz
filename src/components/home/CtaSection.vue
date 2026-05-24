<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useComponentCMS } from '@/composables/useComponentCMS'
import NoImagePlaceholder from '@/components/NoImagePlaceholder.vue'

const cms = useComponentCMS('CtaSection')
const router = useRouter()

const bgImage = computed(() => cms.getImageUrl('ctaBackground', 0))

onMounted(async () => {
  await cms.load()
})
</script>

<template>
  <section class="relative py-16 md:py-24 lg:py-32 overflow-hidden">
    <div class="absolute inset-0">
      <template v-if="bgImage">
        <img
          :src="bgImage"
          alt="Ningaloo Reef underwater view with coral formations and tropical fish"
          class="w-full h-full object-cover"
        />
      </template>
      <NoImagePlaceholder v-else label="No CTA Background" class="w-full h-full" dark />
      <div class="absolute inset-0 bg-[#0A2E4A]/80" />
    </div>

    <div class="container mx-auto px-4 sm:px-6 lg:px-12 relative z-10">
      <div class="max-w-3xl mx-auto text-center section-reveal">
        <p class="overline-text mb-3 md:mb-4 text-xs md:text-sm">Ready to Explore?</p>
        <div class="gold-divider mb-4 md:mb-8 mx-auto"></div>
        <h2 class="font-display text-2xl md:text-4xl lg:text-5xl font-light mb-4 md:mb-6" style="font-family: var(--font-display); color: var(--color-sand-100);">
          Your Adventure <span class="italic" style="color: var(--color-gold-400);">Awaits</span>
        </h2>
        <p class="text-sm md:text-base leading-relaxed mb-6 md:mb-10 opacity-80" style="font-family: var(--font-body); color: var(--color-sand-200); line-height: 1.9;">
          Spaces are intentionally limited to preserve the intimate nature of our expeditions. Book early to secure your preferred dates, especially during peak whale shark season from March to August.
        </p>
        <div class="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center">
          <router-link to="/book" class="btn-primary px-6 py-3 md:px-10 md:py-4 text-sm md:text-base">
            Book Your Expedition
          </router-link>
          <router-link to="/faq" class="btn-outline px-6 py-3 md:px-10 md:py-4 text-sm md:text-base">
            Common Questions
          </router-link>
        </div>
      </div>
    </div>
  </section>
</template>

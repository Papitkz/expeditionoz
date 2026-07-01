<script setup lang="ts">
import { useSEO } from '@/composables/useSEO'
import { ref, computed, onMounted } from 'vue'
import { useScrollReveal } from '@/composables/useScrollReveal'
import CtaSection from '@/components/home/CtaSection.vue'
import NoImagePlaceholder from '@/components/NoImagePlaceholder.vue'
import { useComponentCMS } from '@/composables/useComponentCMS'
import { useTripData } from '@/composables/useTripData'

const cms = useComponentCMS('DiveEscapeView')
const tripData = useTripData('dive-escape')

useScrollReveal()

const isVideoLoaded = ref(false)
const showVideo = ref(true)

// Hero media
const heroMedia = computed(() => {
  const video = cms.getSlot('hero', 0)
  const poster = cms.getSlot('hero', 1)
  return {
    videoUrl: video?.imageUrl || '',
    posterUrl: poster?.imageUrl || '',
  }
})

// About section
const aboutItem = computed(() => cms.getSlot('about', 0))

// Vessel gallery
const VESSEL_GALLERY_SLOTS = 6
const vesselImages = computed(() =>
  Array.from({ length: VESSEL_GALLERY_SLOTS }, (_, i) => {
    const item = cms.getSlot('vesselGallery', i)
    return {
      src: item?.imageUrl || '',
      caption: item?.caption || item?.title || '',
      category: item?.category || '',
      hasImage: !!item?.imageUrl,
    }
  }).filter((img) => img.hasImage)
)

// Dining gallery
const DINING_GALLERY_SLOTS = 4
const diningImages = computed(() =>
  Array.from({ length: DINING_GALLERY_SLOTS }, (_, i) => {
    const item = cms.getSlot('diningGallery', i)
    return {
      src: item?.imageUrl || '',
      title: item?.title || '',
      desc: item?.description || '',
      hasImage: !!item?.imageUrl,
      featured: i === 0,
    }
  }).filter((img) => img.hasImage)
)

// Fallback itinerary data
interface ItineraryItem {
  day: string
  title: string
  description: string
  imageUrl: string
}

const fallbackItinerary: ItineraryItem[] = [
  {
    day: 'Day 1',
    title: 'Departure & First Dive',
    description: 'Board Millennium at Exmouth Marina at 2pm. Safety briefing and equipment setup, then steam toward the outer reef. Afternoon orientation dive, followed by dinner and overnight anchorage.',
    imageUrl: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=1200&q=80',
  },
  {
    day: 'Day 2',
    title: 'Outer Reef Exploration',
    description: 'Two to three dives on spectacular outer reef sites. Encounter reef sharks, rays, and colorful coral gardens. Surface intervals with gourmet lunch on deck. Night dive option after sunset.',
    imageUrl: 'https://images.unsplash.com/photo-1583212292454-1fe6229603b7?auto=format&fit=crop&w=1200&q=80',
  },
  {
    day: 'Day 3',
    title: 'Wildlife & Advanced Sites',
    description: 'Morning dives at sites known for megafauna encounters. Seasonal whale shark or humpback opportunities. Afternoon exploratory dive and sunset dinner on the back deck.',
    imageUrl: 'https://images.unsplash.com/photo-1437622368342-7a3d73a34c8f?auto=format&fit=crop&w=1200&q=80',
  },
  {
    day: 'Day 4',
    title: 'Final Dives & Return',
    description: 'Early morning dive at a favorite site. Breakfast while steaming back toward Exmouth. One last dive near the Muiron Islands before returning to marina by 4pm.',
    imageUrl: 'https://images.unsplash.com/photo-1560275619-4662e36fa65c?auto=format&fit=crop&w=1200&q=80',
  },
  {
    day: 'Day 5',
    title: 'Final Morning & Departure',
    description: 'Wake up at anchor for a sunrise coffee and final swim. Pack up and disembark by 10am, with new friends and memories of an incredible Ningaloo dive adventure.',
    imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
  },
]

// Itinerary
const ITINERARY_SLOTS = 5
const itinerary = computed(() =>
  Array.from({ length: ITINERARY_SLOTS }, (_, i) => {
    const cmsItem = cms.getSlot('itinerary', i)
    const fb = (fallbackItinerary as any[])[i]
    return {
      day: fb?.day || `Day ${i + 1}`,
      title: cmsItem?.title || fb?.title || `Day ${i + 1}`,
      desc: cmsItem?.description || fb?.description || '',
      image: cmsItem?.imageUrl || fb?.imageUrl || '',
      thumb: cmsItem?.imageUrl || fb?.imageUrl || '',
      hasImage: !!(cmsItem?.imageUrl || fb?.imageUrl),
    }
  })
)

const lightboxOpen = ref(false)
const currentImage = ref(0)

const openLightbox = (index: number) => {
  currentImage.value = index
  lightboxOpen.value = true
  document.body.style.overflow = 'hidden'
}

const closeLightbox = () => {
  lightboxOpen.value = false
  document.body.style.overflow = ''
}

const nextImage = () => {
  currentImage.value = (currentImage.value + 1) % vesselImages.value.length
}

const prevImage = () => {
  currentImage.value = (currentImage.value - 1 + vesselImages.value.length) % vesselImages.value.length
}

onMounted(async () => {
  await Promise.all([cms.load(), tripData.load()])

  const video = document.querySelector('video')
  if (video) {
    video.addEventListener('error', () => { showVideo.value = false })
    video.addEventListener('loadeddata', () => { isVideoLoaded.value = true })
  }
})

useSEO({
  title: 'Dive Escape – 5-Day Ningaloo Liveaboard Dive Experience',
  description: 'Dive Escape: 4-night Ningaloo liveaboard dive experience aboard Millennium. Outer reef diving, seasonal megafauna encounters, all inclusive. From $5,200 AUD. Departing Exmouth, WA.',
  path: '/expeditions/dive-escape',
  type: 'product',
  jsonLd: {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": "Dive Escape — 5-Day Ningaloo Liveaboard Dive Experience",
    "description": "A condensed dive expedition aboard Millennium. Outer reef diving, seasonal whale shark and humpback encounters, all-inclusive dining and beverages.",
    "image": "https://expeditionoz.netlify.app/images/dive-escape-hero.jpg",
    "brand": {
      "@type": "Brand",
      "name": "Expedition OZ"
    },
    "url": "https://expeditionoz.netlify.app/expeditions/dive-escape",
    "offers": {
      "@type": "Offer",
      "price": "5200.00",
      "priceCurrency": "AUD",
      "availability": "https://schema.org/InStock",
      "priceValidUntil": "2027-10-15",
      "url": "https://expeditionoz.netlify.app/expeditions/dive-escape"
    }
  }
})
</script>

<template>
  <div>
    <!-- Cinematic Video Hero -->
    <section class="relative h-[85vh] md:h-screen w-full overflow-hidden">
      <div class="absolute inset-0 z-0">
        <video
          v-if="showVideo && heroMedia.videoUrl"
          autoplay
          muted
          loop
          playsinline
          :poster="heroMedia.posterUrl"
          class="w-full h-full object-cover"
          @loadeddata="isVideoLoaded = true"
        >
          <source :src="heroMedia.videoUrl" type="video/mp4">
        </video>
        <div
          v-else-if="heroMedia.posterUrl"
          class="w-full h-full bg-cover bg-center"
          :style="`background-image: url(${heroMedia.posterUrl})`"
        />
        <NoImagePlaceholder v-else label="No Hero Media" class="w-full h-full" />
        <div class="absolute inset-0 bg-[#0A2E4A]/70" />
        <div class="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/80" />
      </div>

      <div class="relative z-10 h-full flex flex-col justify-center items-center text-center px-4">
        <p class="overline-text mb-3 md:mb-4 text-xs md:text-sm tracking-[0.3em] text-white/90">5 Day Live-Aboard Dive Experience</p>
        <h1 class="font-display text-4xl md:text-7xl lg:text-8xl font-light text-white mb-3 md:mb-4" style="font-family: var(--font-display);">
          Dive Escape
        </h1>
        <p class="font-display text-xl md:text-4xl italic text-[#C9A84C] mb-4 md:mb-6" style="font-family: var(--font-display);">
          A Ningaloo Diving Adventure
        </p>
        <p class="max-w-2xl text-sm md:text-lg text-white/90 mb-6 md:mb-8 font-light leading-relaxed px-2">
          A condensed liveaboard dive experience aboard Millennium — outer reef sites, seasonal megafauna encounters, and world-class diving in four nights.
        </p>
        <div class="flex gap-3 md:gap-4">
          <router-link to="/book/dive-escape" class="btn-primary px-6 py-3 md:px-8 md:py-4 text-sm md:text-base">
            Check Availability
          </router-link>
        </div>
      </div>

      <div class="absolute bottom-6 md:bottom-8 left-1/2 transform -translate-x-1/2 z-10 animate-bounce">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
          <path d="M12 5v14M19 12l-7 7-7-7"/>
        </svg>
      </div>
    </section>

    <!-- About Section -->
    <section class="py-12 md:py-24 lg:py-32" style="background: var(--color-ocean-950);">
      <div class="container mx-auto px-4 sm:px-6 lg:px-12">
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-12 lg:gap-16 items-start">
          <div class="section-reveal-left order-2 lg:order-1">
            <p class="overline-text mb-2 md:mb-4 text-xs md:text-sm">About This Expedition</p>
            <div class="gold-divider-left mb-3 md:mb-6"></div>
            <h2 class="font-display text-2xl md:text-4xl lg:text-5xl font-light mb-3 md:mb-6" style="font-family: var(--font-display); color: var(--color-sand-100);">
              A Focused <span class="italic" style="color: var(--color-gold-400);">Dive Adventure</span>
            </h2>
            <p class="text-sm md:text-base leading-relaxed mb-3 md:mb-5 opacity-80" style="font-family: var(--font-body); color: var(--color-sand-200); line-height: 1.9;">
              The Dive Escape is designed for divers who want a concentrated Ningaloo liveaboard experience without committing to the full 8-night flagship expedition. Four nights aboard Millennium, diving the outer reef sites that make Ningaloo world-famous.
            </p>
            <p class="text-sm md:text-base leading-relaxed mb-4 md:mb-8 opacity-80" style="font-family: var(--font-body); color: var(--color-sand-200); line-height: 1.9;">
              All diving is included — tanks, weights, and surface intervals with gourmet dining. Perfect for certified divers seeking adventure, connection, and breathtaking underwater encounters on a tighter schedule.
            </p>

            <div class="grid grid-cols-3 gap-2 md:gap-6 mb-4 md:mb-8 pt-3 md:pt-6" style="border-top: 1px solid rgba(201, 168, 76, 0.15);">
              <div class="text-center">
                <p class="font-display text-xl md:text-3xl font-light" style="font-family: var(--font-display); color: var(--color-gold-400);">{{ tripData.durationDays.value || 5 }}</p>
                <p class="overline-text mt-1 text-[0.5rem] md:text-[0.55rem]">Days</p>
              </div>
              <div class="text-center">
                <p class="font-display text-xl md:text-3xl font-light" style="font-family: var(--font-display); color: var(--color-gold-400);">{{ tripData.maxGuests.value || 14 }}</p>
                <p class="overline-text mt-1 text-[0.5rem] md:text-[0.55rem]">Max Guests</p>
              </div>
              <div class="text-center">
                <p class="font-display text-xl md:text-3xl font-light" style="font-family: var(--font-display); color: var(--color-gold-400);">All-Inclusive</p>
                <p class="overline-text mt-1 text-[0.5rem] md:text-[0.55rem]">Diving</p>
              </div>
            </div>

            <div class="flex flex-col sm:flex-row items-start sm:items-center gap-3 md:gap-4 mt-1">
              <router-link to="/book/dive-escape" class="btn-primary inline-block text-sm md:text-base px-5 py-3 md:px-8 md:py-4">
                Reserve Your Cabin
              </router-link>
              <span v-if="tripData.formattedPrice.value" class="overline-text text-xs md:text-sm" style="color: var(--color-gold-400);">
                {{ tripData.formattedPrice.value }} per person
              </span>
            </div>
          </div>

          <div class="section-reveal-right order-1 lg:order-2">
            <div class="relative overflow-hidden h-[250px] sm:h-[350px] md:h-[520px] group">
              <template v-if="aboutItem?.imageUrl">
                <img
                  :src="aboutItem.imageUrl"
                  :alt="aboutItem.alt || 'Dive Escape expedition image'"
                  class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
              </template>
              <NoImagePlaceholder v-else label="No About Image" />
              <div class="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Vessel Showcase -->
    <section class="py-12 md:py-24" style="background: var(--color-ocean-900);">
      <div class="container mx-auto px-4 sm:px-6 lg:px-12">
        <div class="text-center mb-8 md:mb-16 section-reveal">
          <p class="overline-text mb-2 md:mb-4 text-xs md:text-sm">Your Home at Sea</p>
          <div class="gold-divider mb-3 md:mb-6 mx-auto"></div>
          <h2 class="font-display text-2xl md:text-4xl lg:text-5xl font-light" style="font-family: var(--font-display); color: var(--color-sand-100);">
            The Vessel <span class="italic" style="color: var(--color-gold-400);">Millennium</span>
          </h2>
          <p class="mt-3 md:mt-4 max-w-2xl mx-auto text-sm md:text-base opacity-70 px-2" style="color: var(--color-sand-200);">
            A purpose-built liveaboard vessel designed for serious divers — spacious dive deck, camera room, and comfortable cabins for up to 14 guests.
          </p>
        </div>

        <div class="columns-2 md:columns-3 gap-2 md:gap-3 space-y-2 md:space-y-3 section-reveal">
          <div
            v-for="(img, i) in vesselImages"
            :key="i"
            class="relative overflow-hidden cursor-pointer group break-inside-avoid mb-2 md:mb-3"
            @click="openLightbox(i)"
          >
            <template v-if="img.hasImage">
              <img
                :src="img.src"
                :alt="img.caption"
                class="w-full h-auto object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div class="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div class="absolute bottom-2 md:bottom-4 left-2 md:left-4 text-white">
                  <p class="text-[10px] md:text-xs uppercase tracking-wider text-[#C9A84C] mb-0.5 md:mb-1">{{ img.category }}</p>
                  <p class="font-display text-sm md:text-lg">{{ img.caption }}</p>
                </div>
              </div>
            </template>
            <NoImagePlaceholder v-else :label="`Gallery ${i + 1}`" />
          </div>
        </div>

        <div class="text-center mt-6 md:mt-8">
          <button @click="openLightbox(0)" class="text-[#C9A84C] hover:text-white transition-colors text-xs md:text-sm uppercase tracking-wider border-b border-[#C9A84C] pb-1">
            View Gallery
          </button>
        </div>
      </div>
    </section>

    <!-- Itinerary Timeline -->
    <section class="py-12 md:py-24 lg:py-32" style="background: var(--color-ocean-950);">
      <div class="container mx-auto px-4 sm:px-6 lg:px-12 max-w-6xl">
        <div class="text-center mb-12 md:mb-20 lg:mb-24 section-reveal">
          <p class="overline-text mb-2 md:mb-4 text-xs md:text-sm">Day by Day</p>
          <div class="gold-divider mb-4 md:mb-6 mx-auto"></div>
          <h2 class="font-display text-2xl md:text-4xl lg:text-5xl font-light" style="font-family: var(--font-display); color: var(--color-sand-100);">
            Your <span class="italic" style="color: var(--color-gold-400);">Itinerary</span>
          </h2>
        </div>

        <div class="relative">
          <div class="absolute left-4 md:left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-[#C9A84C]/30 via-[#C9A84C]/50 to-[#C9A84C]/30 md:-translate-x-1/2"></div>

          <div
            v-for="(item, index) in itinerary"
            :key="index"
            class="relative mb-8 md:mb-16 lg:mb-20 section-reveal"
            :style="`--delay: ${index * 0.15}s`"
          >
            <div
              class="absolute left-4 md:left-1/2 top-0 w-10 h-10 md:w-14 md:h-14 bg-[#C9A84C] flex items-center justify-center z-20 md:-translate-x-1/2"
              style="box-shadow: 0 0 20px rgba(201, 168, 76, 0.3);"
            >
              <span class="font-display text-xs md:text-sm font-bold text-[#0A2E4A] tracking-wider" style="font-family: var(--font-display);">
                {{ index + 1 }}
              </span>
            </div>

            <div class="ml-14 md:ml-0 md:grid md:grid-cols-2 md:gap-8 lg:gap-12">
              <div
                class="mb-4 md:mb-0"
                :class="index % 2 === 0 ? 'md:order-1 md:pr-8 lg:pr-12' : 'md:order-2 md:pl-8 lg:pl-12'"
              >
                <div class="relative overflow-hidden group h-48 sm:h-56 md:h-72 lg:h-80">
                  <template v-if="item.hasImage && item.image">
                    <img
                      :src="item.image"
                      :alt="item.title"
                      class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  </template>
                  <NoImagePlaceholder v-else label="No Image" class="w-full h-full" />
                  <div class="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                </div>
              </div>

              <div
                class="flex flex-col justify-center"
                :class="index % 2 === 0 ? 'md:order-2 md:pl-8 lg:pl-12' : 'md:order-1 md:pr-8 lg:pr-12 md:text-right'"
              >
                <p class="overline-text text-[10px] md:text-xs mb-2 md:mb-3 tracking-[0.2em]">{{ item.day }}</p>
                <h3 class="font-display text-xl md:text-2xl lg:text-3xl font-light mb-3 md:mb-4 leading-tight" style="font-family: var(--font-display); color: var(--color-sand-100);">
                  {{ item.title }}
                </h3>
                <div class="w-8 h-px bg-[#C9A84C]/40 mb-3 md:mb-4" :class="index % 2 === 1 ? 'md:ml-auto' : ''"></div>
                <p class="text-sm md:text-base leading-relaxed opacity-75" style="font-family: var(--font-body); color: var(--color-sand-200); line-height: 1.8;">
                  {{ item.desc }}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div class="text-center mt-12 md:mt-20 pt-8 md:pt-12 border-t border-[#C9A84C]/20 section-reveal">
          <p class="text-xs md:text-sm opacity-60 mb-6 md:mb-8" style="color: var(--color-sand-200);">
            *Schedule subject to weather & wildlife conditions
          </p>
          <router-link to="/book/dive-escape" class="btn-primary px-8 py-3 md:px-12 md:py-4 text-sm md:text-base">
            Book Expedition
          </router-link>
        </div>
      </div>
    </section>

    <!-- Highlights -->
    <section class="py-12 md:py-24" style="background: var(--color-ocean-950);">
      <div class="container mx-auto px-4 sm:px-6 lg:px-12">
        <div class="text-center mb-6 md:mb-12 section-reveal">
          <p class="overline-text mb-2 md:mb-4 text-xs md:text-sm">What's Included</p>
          <div class="gold-divider mb-3 md:mb-6 mx-auto"></div>
          <h2 class="font-display text-2xl md:text-4xl font-light" style="font-family: var(--font-display); color: var(--color-sand-100);">
            Everything You <span class="italic" style="color: var(--color-gold-400);">Need</span>
          </h2>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-4 max-w-3xl mx-auto">
          <div
            v-for="(item, i) in [
              'Multiple dives per day on outer reef sites',
              'Seasonal whale shark and humpback encounters',
              'All scuba gear including tanks and weights',
              'Gourmet meals prepared by our onboard chef',
              'Premium beverages including wine and cocktails',
              'Night dive opportunities',
              'Maximum 14 guests for a intimate experience',
              'Exmouth departure — gateway to Ningaloo',
            ]"
            :key="item"
            class="highlight-item section-reveal"
            :style="`transition-delay: ${i * 0.07}s`"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" class="flex-shrink-0 mt-0.5">
              <polyline points="20 6 9 17 4 12" stroke="#C9A84C" stroke-width="2" stroke-linecap="round"/>
            </svg>
            <p class="text-sm md:text-base opacity-80" style="font-family: var(--font-body); color: var(--color-sand-200);">
              {{ item }}
            </p>
          </div>
        </div>
      </div>
    </section>

    <CtaSection />

    <!-- Lightbox -->
    <div
      v-if="lightboxOpen"
      class="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-2 md:p-4"
      @click="closeLightbox"
    >
      <button
        class="absolute top-2 right-2 md:top-4 md:right-4 text-white/70 hover:text-white p-2"
        @click="closeLightbox"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>

      <button
        class="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white p-2 md:p-4 hidden md:block"
        @click.stop="prevImage"
      >
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
          <polyline points="15,18 9,12 15,6"/>
        </svg>
      </button>

      <button
        class="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white p-2 md:p-4 hidden md:block"
        @click.stop="nextImage"
      >
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
          <polyline points="9,18 15,12 9,6"/>
        </svg>
      </button>

      <div class="max-w-5xl max-h-[85vh]" @click.stop>
        <template v-if="vesselImages[currentImage]?.hasImage">
          <img
            :src="vesselImages[currentImage].src"
            :alt="vesselImages[currentImage].caption"
            class="max-w-full max-h-[85vh] object-contain"
          />
        </template>
        <NoImagePlaceholder v-else label="No Image" class="max-w-full max-h-[85vh]" />
        <div class="text-center mt-3 md:mt-4 text-white">
          <p class="font-display text-base md:text-lg">{{ vesselImages[currentImage]?.caption }}</p>
          <p class="text-xs md:text-sm text-[#C9A84C] uppercase tracking-wider">{{ vesselImages[currentImage]?.category }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.highlight-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 10px;
  border: 1px solid rgba(201, 168, 76, 0.1);
  background: rgba(10, 46, 74, 0.3);
  transition: all 0.3s ease;
}

@media (min-width: 768px) {
  .highlight-item {
    gap: 12px;
    padding: 16px;
  }
}

.highlight-item:hover {
  background: rgba(201, 168, 76, 0.05);
  border-color: rgba(201, 168, 76, 0.2);
}

html {
  scroll-behavior: smooth;
}

.animate-bounce {
  animation: bounce 2s infinite;
}

@keyframes bounce {
  0%, 100% { transform: translateX(-50%) translateY(0); }
  50% { transform: translateX(-50%) translateY(-10px); }
}

.break-inside-avoid {
  break-inside: avoid;
}
</style>

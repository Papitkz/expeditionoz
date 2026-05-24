<script setup lang="ts">
import { useSEO } from '@/composables/useSEO'
import { ref, computed, onMounted } from 'vue'
import { useScrollReveal } from '@/composables/useScrollReveal'
import CtaSection from '@/components/home/CtaSection.vue'
import NoImagePlaceholder from '@/components/NoImagePlaceholder.vue'
import { useComponentCMS } from '@/composables/useComponentCMS'

const cms = useComponentCMS('MilleniumView')

useScrollReveal()

const isVideoLoaded = ref(false)
const showVideo = ref(true)
const lightboxOpen = ref(false)
const currentImage = ref(0)

// Hero media
const heroMedia = computed(() => {
  const video = cms.getSlot('hero', 0)
  const poster = cms.getSlot('hero', 1)
  return {
    videoUrl: video?.imageUrl || '',
    posterUrl: poster?.imageUrl || '',
  }
})

// About images
const aboutImages = computed(() =>
  cms.getSection('about').map((item) => ({
    src: item.imageUrl || '',
    alt: item.alt || '',
    caption: item.caption || item.title || '',
    hasImage: !!item.imageUrl,
  }))
)

// Vessel gallery
const vesselImages = computed(() =>
  cms.getSection('vesselGallery').map((item) => ({
    src: item.imageUrl || '',
    caption: item.caption || item.title || '',
    category: item.category || '',
    hasImage: !!item.imageUrl,
  }))
)

// Dining gallery
const diningImages = computed(() =>
  cms.getSection('diningGallery').map((item) => ({
    src: item.imageUrl || '',
    title: item.title || '',
    desc: item.description || '',
    hasImage: !!item.imageUrl,
  }))
)

// Fallback itinerary data for 7-day Millenium
interface ItineraryItem {
  day: string
  title: string
  description: string
  imageUrl: string
}

const fallbackItinerary: ItineraryItem[] = [
  {
    day: 'Day 1',
    title: 'Departure & Orientation',
    description: 'Board the M.Y. Millenium at Exmouth Marina. Welcome champagne, safety briefing, and departure. First sunset dinner on the upper deck as we sail north.',
    imageUrl: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=1200&q=80',
  },
  {
    day: 'Day 2',
    title: 'Northern Reef Exploration',
    description: 'Full day exploring the pristine northern reaches. Multiple snorkel sessions over untouched coral gardens. Evening marine biology presentation on deck.',
    imageUrl: 'https://images.unsplash.com/photo-1583212292454-1fe6229603b7?auto=format&fit=crop&w=1200&q=80',
  },
  {
    day: 'Day 3',
    title: 'Whale Shark Encounter',
    description: 'The day you\'ve been waiting for. Our spotter plane locates whale sharks and we enter the water for multiple swims alongside these gentle giants.',
    imageUrl: 'https://images.unsplash.com/photo-1719450589784-c2c36ccf8e5b?q=80&w=1075&auto=format&fit=crop',
  },
  {
    day: 'Day 4',
    title: 'Deep Reef & Drift Snorkel',
    description: 'Explore deeper reef walls and channels. Drift snorkel with the current over spectacular coral formations. Afternoon kayak expedition along the reef edge.',
    imageUrl: 'https://images.unsplash.com/photo-1506953823976-52e1fdc0149a?auto=format&fit=crop&w=1200&q=80',
  },
  {
    day: 'Day 5',
    title: 'Turquoise Bay & Turtles',
    description: 'A full day at Turquoise Bay — Ningaloo\'s most famous snorkel site. Encounter sea turtles, reef sharks, and rays in the crystal-clear shallows.',
    imageUrl: 'https://images.unsplash.com/photo-1437622368342-7a3d73a34c8f?auto=format&fit=crop&w=1200&q=80',
  },
  {
    day: 'Day 6',
    title: 'Coral Bay & Manta Rays',
    description: 'Sail south to Coral Bay for the manta ray encounter. These graceful creatures glide through the water just meters from you. Farewell dinner under the stars.',
    imageUrl: 'https://images.unsplash.com/photo-1560275619-4662e36fa65c?auto=format&fit=crop&w=1200&q=80',
  },
  {
    day: 'Day 7',
    title: 'Final Morning & Return',
    description: 'One last sunrise swim before heading back to Exmouth. Farewell brunch, certificate presentation, and a lifetime of extraordinary memories.',
    imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
  },
]

// Itinerary — CMS or fallback
const itinerary = computed(() => {
  const cmsData = cms.getSection('itinerary')
  // Ensure CMS data has the ItineraryItem shape; fallback if empty
  const source: ItineraryItem[] = cmsData.length > 0 
    ? cmsData.map((item: any) => ({
        day: item.day || '',
        title: item.title || '',
        description: item.description || '',
        imageUrl: item.imageUrl || '',
      }))
    : fallbackItinerary
  return source.map((item, i) => ({
    day: item.day || `Day ${i + 1}`,
    title: item.title || `Day ${i + 1}`,
    desc: item.description || '',
    image: item.imageUrl || '',
    thumb: item.imageUrl || '',
    hasImage: !!item.imageUrl,
    last: i === 6,
  }))
})

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
  await cms.load()

  const video = document.querySelector('video')
  if (video) {
    video.addEventListener('error', () => { showVideo.value = false })
    video.addEventListener('loadeddata', () => { isVideoLoaded.value = true })
  }
})

useSEO({
  title: 'Millenium – 7-Day Ultimate Live-Aboard',
  description: 'Millenium: The ultimate 7-day Ningaloo Reef expedition. Our flagship vessel with luxury suites, all-inclusive dining, and comprehensive marine encounters including whale sharks and manta rays.',
  path: '/expeditions/millenium',
  type: 'product',
  jsonLd: {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": "Millenium 7-Day Ultimate Expedition",
    "description": "Flagship 7-day live-aboard expedition aboard the Millenium",
    "image": "https://expeditionoz.netlify.app/images/millenium-hero.jpg",
    "brand": {
      "@type": "Brand",
      "name": "Expedition OZ"
    },
    "url": "https://expeditionoz.netlify.app/expeditions/millenium",
    "offers": {
      "@type": "Offer",
      "price": "3995.00",
      "priceCurrency": "AUD",
      "availability": "https://schema.org/InStock",
      "priceValidUntil": "2026-12-31",
      "url": "https://expeditionoz.netlify.app/expeditions/millenium",
      "shippingDetails": {
        "@type": "OfferShippingDetails",
        "shippingRate": {
          "@type": "MonetaryAmount",
          "value": "0",
          "currency": "AUD"
        },
        "shippingDestination": {
          "@type": "DefinedRegion",
          "addressCountry": "AU"
        },
        "deliveryTime": {
          "@type": "ShippingDeliveryTime",
          "handlingTime": {
            "@type": "QuantitativeValue",
            "minValue": 0,
            "maxValue": 1,
            "unitCode": "DAY"
          },
          "transitTime": {
            "@type": "QuantitativeValue",
            "minValue": 0,
            "maxValue": 0,
            "unitCode": "DAY"
          }
        }
      },
      "hasMerchantReturnPolicy": {
        "@type": "MerchantReturnPolicy",
        "returnPolicyCategory": "https://schema.org/MerchantReturnNotPermitted",
        "applicableCountry": "AU"
      }
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.9",
      "reviewCount": "87"
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
        <p class="overline-text mb-3 md:mb-4 text-xs md:text-sm tracking-[0.3em] text-white/90">7 Day Luxury Live-Aboard</p>
        <h1 class="font-display text-4xl md:text-7xl lg:text-8xl font-light text-white mb-3 md:mb-4" style="font-family: var(--font-display);">
          Dive Expedition
        </h1>
        <p class="font-display text-xl md:text-4xl italic text-[#C9A84C] mb-4 md:mb-6" style="font-family: var(--font-display);">
          The Complete Expedition
        </p>
        <p class="max-w-2xl text-sm md:text-lg text-white/90 mb-6 md:mb-8 font-light leading-relaxed px-2">
          Our flagship week-long expedition aboard the M.Y. Millenium. Seven days, six nights, and the most comprehensive Ningaloo Reef experience available.
        </p>
        <div class="flex gap-3 md:gap-4">
          <router-link to="/book/millenium" class="btn-primary px-6 py-3 md:px-8 md:py-4 text-sm md:text-base">
            Reserve Your Suite
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
            <p class="overline-text mb-2 md:mb-4 text-xs md:text-sm">The Flagship Experience</p>
            <div class="gold-divider-left mb-3 md:mb-6"></div>
            <h2 class="font-display text-2xl md:text-4xl lg:text-5xl font-light mb-3 md:mb-6" style="font-family: var(--font-display); color: var(--color-sand-100);">
              A Week of <span class="italic" style="color: var(--color-gold-400);">Extraordinary</span>
            </h2>
            <p class="text-sm md:text-base leading-relaxed mb-3 md:mb-5 opacity-80" style="font-family: var(--font-body); color: var(--color-sand-200); line-height: 1.9;">
              The Millenium is our most ambitious expedition — seven days that will transform how you see the ocean. With luxury suites, world-class dining, and an itinerary designed by marine biologists, this is the ultimate Ningaloo experience.
            </p>
            <p class="text-sm md:text-base leading-relaxed mb-4 md:mb-8 opacity-80" style="font-family: var(--font-body); color: var(--color-sand-200); line-height: 1.9;">
              From sunrise yoga on deck to midnight stargazing in the middle of the Indian Ocean, every moment is crafted for wonder. This is where luxury meets wild — and you will never want to leave.
            </p>

            <div class="grid grid-cols-3 gap-2 md:gap-6 mb-4 md:mb-8 pt-3 md:pt-6" style="border-top: 1px solid rgba(201, 168, 76, 0.15);">
              <div class="text-center">
                <p class="font-display text-xl md:text-3xl font-light" style="font-family: var(--font-display); color: var(--color-gold-400);">7</p>
                <p class="overline-text mt-1 text-[0.5rem] md:text-[0.55rem]">Days</p>
              </div>
              <div class="text-center">
                <p class="font-display text-xl md:text-3xl font-light" style="font-family: var(--font-display); color: var(--color-gold-400);">14</p>
                <p class="overline-text mt-1 text-[0.5rem] md:text-[0.55rem]">Max Guests</p>
              </div>
              <div class="text-center">
                <p class="font-display text-xl md:text-3xl font-light" style="font-family: var(--font-display); color: var(--color-gold-400);">4</p>
                <p class="overline-text mt-1 text-[0.5rem] md:text-[0.55rem]">Luxury Suites</p>
              </div>
            </div>

            <div class="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <router-link to="/book/millenium" class="btn-primary text-center text-sm md:text-base px-5 py-3 md:px-8 md:py-4">
                Book This Expedition
              </router-link>
            </div>
          </div>

          <div class="section-reveal-right order-1 lg:order-2">
            <div class="relative overflow-hidden h-[250px] sm:h-[350px] md:h-[520px] group">
              <div class="grid grid-cols-2 gap-2 h-full">
                <div class="space-y-2">
                  <template v-for="(img, i) in [aboutImages[0], aboutImages[2]]" :key="i">
                    <div v-if="img" class="overflow-hidden flex-1" :class="i === 0 ? 'h-[calc(50%-4px)]' : 'h-[calc(50%-4px)]'">
                      <template v-if="img.hasImage">
                        <img
                          :src="img.src"
                          :alt="img.alt || 'Millenium expedition image'"
                          class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                      </template>
                      <NoImagePlaceholder v-else :label="`About ${i * 2 + 1}`" class="h-full" />
                    </div>
                  </template>
                </div>
                <div class="space-y-2">
                  <template v-for="(img, i) in [aboutImages[1], aboutImages[3]]" :key="i">
                    <div v-if="img" class="overflow-hidden flex-1" :class="i === 0 ? 'h-[calc(50%-4px)]' : 'h-[calc(50%-4px)]'">
                      <template v-if="img.hasImage">
                        <img
                          :src="img.src"
                          :alt="img.alt || 'Millenium expedition image'"
                          class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                      </template>
                      <NoImagePlaceholder v-else :label="`About ${i * 2 + 2}`" class="h-full" />
                    </div>
                  </template>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Vessel Showcase -->
    <section class="py-12 md:py-24" style="background: var(--color-ocean-900);">
      <div class="container mx-auto px-4 sm:px-6 lg:px-12">
        <div class="text-center mb-8 md:mb-16 section-reveal">
          <p class="overline-text mb-2 md:mb-4 text-xs md:text-sm">Where Luxury Meets Adventure</p>
          <div class="gold-divider mb-3 md:mb-6 mx-auto"></div>
          <h2 class="font-display text-2xl md:text-4xl lg:text-5xl font-light" style="font-family: var(--font-display); color: var(--color-sand-100);">
            M.Y. <span class="italic" style="color: var(--color-gold-400);">Millenium</span>
          </h2>
          <p class="mt-3 md:mt-4 max-w-2xl mx-auto text-sm md:text-base opacity-70 px-2" style="color: var(--color-sand-200);">
            Purpose-built for expedition cruising, the Millenium combines the stability and range of a commercial vessel with the elegance of a private yacht.
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
        <!-- Header -->
        <div class="text-center mb-12 md:mb-20 lg:mb-24 section-reveal">
          <p class="overline-text mb-2 md:mb-4 text-xs md:text-sm">Day by Day</p>
          <div class="gold-divider mb-4 md:mb-6 mx-auto"></div>
          <h2 class="font-display text-2xl md:text-4xl lg:text-5xl font-light" style="font-family: var(--font-display); color: var(--color-sand-100);">
            A Week of <span class="italic" style="color: var(--color-gold-400);">Wonder</span>
          </h2>
          <p class="mt-3 md:mt-4 max-w-xl mx-auto text-sm md:text-base opacity-70 px-2" style="color: var(--color-sand-200);">
            Seven carefully designed days that build in intensity — from gentle introductions to extraordinary encounters.
          </p>
        </div>

        <!-- Timeline -->
        <div class="relative">
          <!-- Vertical Line -->
          <div class="absolute left-4 md:left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-[#C9A84C]/30 via-[#C9A84C]/50 to-[#C9A84C]/30 md:-translate-x-1/2"></div>

          <!-- Items -->
          <div 
            v-for="(item, index) in itinerary" 
            :key="index"
            class="relative mb-8 md:mb-16 lg:mb-20 section-reveal"
            :style="`--delay: ${index * 0.15}s`"
          >
            <!-- Day Circle -->
            <div 
              class="absolute left-4 md:left-1/2 top-0 w-10 h-10 md:w-14 md:h-14 bg-[#C9A84C] flex items-center justify-center z-20 md:-translate-x-1/2"
              style="box-shadow: 0 0 20px rgba(201, 168, 76, 0.3);"
            >
              <span class="font-display text-xs md:text-sm font-bold text-[#0A2E4A] tracking-wider" style="font-family: var(--font-display);">
                {{ index + 1 }}
              </span>
            </div>

            <!-- Content Grid -->
            <div class="ml-14 md:ml-0 md:grid md:grid-cols-2 md:gap-8 lg:gap-12">
              <!-- Image Side -->
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

              <!-- Content Side -->
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

        <!-- CTA -->
        <div class="text-center mt-12 md:mt-20 pt-8 md:pt-12 border-t border-[#C9A84C]/20 section-reveal">
          <p class="text-xs md:text-sm opacity-60 mb-6 md:mb-8" style="color: var(--color-sand-200);">
            *Schedule subject to weather & wildlife conditions
          </p>
          <router-link to="/book/millenium" class="btn-primary px-8 py-3 md:px-12 md:py-4 text-sm md:text-base">
            Book Expedition
          </router-link>
        </div>
      </div>
    </section>

    <!-- Dining Experience -->
    <section class="py-12 md:py-24" style="background: var(--color-ocean-900);">
      <div class="container mx-auto px-4 sm:px-6 lg:px-12">
        <div class="grid lg:grid-cols-2 gap-6 md:gap-12 items-center">
          <div class="section-reveal-left">
            <p class="overline-text mb-2 md:mb-4 text-xs md:text-sm">Culinary Excellence</p>
            <div class="gold-divider-left mb-3 md:mb-6"></div>
            <h2 class="font-display text-2xl md:text-4xl lg:text-5xl font-light mb-4 md:mb-6" style="font-family: var(--font-display); color: var(--color-sand-100);">
              Dining at <span class="italic" style="color: var(--color-gold-400);">Millenium</span>
            </h2>
            <p class="text-sm md:text-base leading-relaxed mb-4 md:mb-6 opacity-80" style="font-family: var(--font-body); color: var(--color-sand-200); line-height: 1.9;">
              With a dedicated chef and premium provisions sourced from across Western Australia, dining aboard the Millenium is an integral part of the experience — not an afterthought.
            </p>
            <ul class="space-y-2 md:space-y-3 mb-6 md:mb-8">
              <li class="flex items-center gap-2 md:gap-3 text-sm" style="color: var(--color-sand-200);">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#C9A84C" stroke-width="2">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                Private chef with fine-dining training
              </li>
              <li class="flex items-center gap-2 md:gap-3 text-sm" style="color: var(--color-sand-200);">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#C9A84C" stroke-width="2">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                Curated wine list featuring Margaret River
              </li>
              <li class="flex items-center gap-2 md:gap-3 text-sm" style="color: var(--color-sand-200);">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#C9A84C" stroke-width="2">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                Dietary preferences accommodated with notice
              </li>
              <li class="flex items-center gap-2 md:gap-3 text-sm" style="color: var(--color-sand-200);">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#C9A84C" stroke-width="2">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                Chef's table experience on the upper deck
              </li>
            </ul>
          </div>

          <div class="grid grid-cols-2 gap-2 md:gap-3 section-reveal-right">
            <div v-for="(img, i) in diningImages" :key="i" class="relative overflow-hidden group" :class="i === 0 ? 'col-span-2' : ''">
              <template v-if="img.hasImage">
                <img :src="img.src" :alt="img.title" class="w-full h-36 md:h-48 object-cover transition-transform duration-500 group-hover:scale-105" />
                <div class="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                  <div class="absolute bottom-2 left-2 md:bottom-3 md:left-3 text-white">
                    <p class="font-display text-xs md:text-sm">{{ img.title }}</p>
                    <p class="text-[10px] opacity-80">{{ img.desc }}</p>
                  </div>
                </div>
              </template>
              <NoImagePlaceholder v-else :label="`Dining ${i + 1}`" />
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Route Map -->
    <section class="py-12 md:py-24 relative overflow-hidden" style="background: var(--color-ocean-900);">
      <div class="absolute inset-0 opacity-20">
        <template v-if="cms.getImageUrl('routeMap', 0)">
          <img 
            :src="cms.getImageUrl('routeMap', 0) || undefined"
            alt="Ningaloo Reef aerial view"
            class="w-full h-full object-cover"
          />
        </template>
        <NoImagePlaceholder v-else label="No Route Map BG" class="w-full h-full" />
      </div>
      <div class="container mx-auto px-4 sm:px-6 lg:px-12 relative z-10">
        <div class="text-center mb-8 md:mb-12 section-reveal">
          <p class="overline-text mb-2 md:mb-4 text-xs md:text-sm">The Journey</p>
          <div class="gold-divider mb-3 md:mb-6 mx-auto"></div>
          <h2 class="font-display text-2xl md:text-4xl font-light" style="font-family: var(--font-display); color: var(--color-sand-100);">
            Expedition <span class="italic" style="color: var(--color-gold-400);">Route</span>
          </h2>
        </div>

        <div class="max-w-4xl mx-auto bg-[#0A2E4A]/80 backdrop-blur-md p-4 md:p-12 border border-[#C9A84C]/20 section-reveal">
          <div class="flex flex-col md:flex-row justify-between items-center gap-4 md:gap-6 relative">
            <div class="hidden md:block absolute top-1/2 left-0 right-0 h-px bg-[#C9A84C]/30 -translate-y-1/2 z-0" />

            <div class="relative z-10 text-center flex md:block items-center gap-3 md:gap-0 w-full md:w-auto">
              <div class="w-2 h-2 bg-[#C9A84C] md:mx-auto md:mb-2 flex-shrink-0" />
              <div class="text-left md:text-center">
                <p class="font-display text-base md:text-lg text-white">Exmouth</p>
                <p class="text-[10px] md:text-xs opacity-60" style="color: var(--color-sand-200);">Departure</p>
              </div>
            </div>

            <div class="relative z-10 text-center flex md:block items-center gap-3 md:gap-0 w-full md:w-auto">
              <div class="w-2 h-2 bg-[#C9A84C] md:mx-auto md:mb-2 flex-shrink-0" />
              <div class="text-left md:text-center">
                <p class="font-display text-base md:text-lg text-white">Northern Reef</p>
                <p class="text-[10px] md:text-xs opacity-60" style="color: var(--color-sand-200);">Whale Sharks</p>
              </div>
            </div>

            <div class="relative z-10 text-center flex md:block items-center gap-3 md:gap-0 w-full md:w-auto">
              <div class="w-2 h-2 bg-[#C9A84C] md:mx-auto md:mb-2 flex-shrink-0" />
              <div class="text-left md:text-center">
                <p class="font-display text-base md:text-lg text-white">Turquoise Bay</p>
                <p class="text-[10px] md:text-xs opacity-60" style="color: var(--color-sand-200);">Coral Gardens</p>
              </div>
            </div>

            <div class="relative z-10 text-center flex md:block items-center gap-3 md:gap-0 w-full md:w-auto">
              <div class="w-2 h-2 bg-[#C9A84C] md:mx-auto md:mb-2 flex-shrink-0" />
              <div class="text-left md:text-center">
                <p class="font-display text-base md:text-lg text-white">Coral Bay</p>
                <p class="text-[10px] md:text-xs opacity-60" style="color: var(--color-sand-200);">Manta Rays</p>
              </div>
            </div>

            <div class="relative z-10 text-center flex md:block items-center gap-3 md:gap-0 w-full md:w-auto">
              <div class="w-2 h-2 bg-[#C9A84C] md:mx-auto md:mb-2 flex-shrink-0" />
              <div class="text-left md:text-center">
                <p class="font-display text-base md:text-lg text-white">Exmouth</p>
                <p class="text-[10px] md:text-xs opacity-60" style="color: var(--color-sand-200);">Return</p>
              </div>
            </div>
          </div>

          <div class="mt-6 md:mt-8 pt-4 md:pt-6 border-t border-[#C9A84C]/20 text-center">
            <p class="text-xs md:text-sm opacity-70" style="color: var(--color-sand-200);">
              *Route may vary based on weather conditions and wildlife sightings to ensure the best possible experience
            </p>
          </div>
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
            Everything You <span class="italic" style="color: var(--color-gold-400);">Deserve</span>
          </h2>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-4 max-w-3xl mx-auto">
          <div 
            v-for="(item, i) in [
              'Whale shark encounters with certified marine naturalist',
              'Northern & southern Ningaloo exploration',
              'Snorkel with manta rays at Coral Bay',
              'All premium snorkel gear included',
              'Private chef — gourmet dining every meal',
              'Premium wines, craft cocktails, and spirits',
              'Sunset yoga and stargazing on deck',
              'Maximum 14 guests for exclusivity',
              'Exmouth departure — gateway to Ningaloo',
              'Nitrox for certified divers (optional)',
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
.avatar-wrapper {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  overflow: hidden;
  border: 2px solid var(--color-gold-400);
  box-shadow: 0 4px 15px rgba(201, 168, 76, 0.3);
}

.avatar-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

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

::-webkit-scrollbar {
  width: 8px;
}

::-webkit-scrollbar-track {
  background: var(--color-ocean-950);
}

::-webkit-scrollbar-thumb {
  background: var(--color-gold-400);
  border-radius: 4px;
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

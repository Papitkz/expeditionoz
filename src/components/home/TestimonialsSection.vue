<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'

const testimonials = [
  {
    quote: 'The most extraordinary experience of my life. Swimming alongside whale sharks in water this clear, then returning to a beautifully appointed vessel — I simply cannot put it into words.',
    name: 'Sarah M.',
    location: 'Melbourne, VIC',
    avatar: 'https://ui-avatars.com/api/?name=Sarah+M&background=C9A84C&color=0A2E4A&size=128&rounded=true&bold=true'
  },
  {
    quote: 'Expedition OZ completely redefines what a reef tour can be. The crew\'s knowledge and passion for Ningaloo is infectious. The manta ray dives alone were worth every cent.',
    name: 'James & Linda T.',
    location: 'Perth, WA',
    avatar: 'https://ui-avatars.com/api/?name=James+Linda&background=C9A84C&color=0A2E4A&size=128&rounded=true&bold=true'
  },
  {
    quote: 'From the moment we boarded Dive Expedition, we knew this would be special. Seven days felt like both a lifetime and not nearly enough. We\'re already planning our return.',
    name: 'Dr. Rachel K.',
    location: 'Sydney, NSW',
    avatar: 'https://ui-avatars.com/api/?name=Rachel+K&background=C9A84C&color=0A2E4A&size=128&rounded=true&bold=true'
  },
  {
    quote: 'I\'ve traveled to the Great Barrier Reef countless times, but Ningaloo with Expedition OZ is on another level. The coral health and biodiversity left me speechless.',
    name: 'Mark D.',
    location: 'Brisbane, QLD',
    avatar: 'https://ui-avatars.com/api/?name=Mark+D&background=C9A84C&color=0A2E4A&size=128&rounded=true&bold=true'
  },
  {
    quote: 'The attention to detail is impeccable. From the gourmet meals prepared on board to the tailored dive briefings, every moment felt curated just for us.',
    name: 'Emily R.',
    location: 'Adelaide, SA',
    avatar: 'https://ui-avatars.com/api/?name=Emily+R&background=C9A84C&color=0A2E4A&size=128&rounded=true&bold=true'
  },
  {
    quote: 'As a photographer, light is everything. The crew knew exactly where to be for sunrise and sunset shots. I captured the best images of my career on this trip.',
    name: 'Robert J.',
    location: 'Hobart, TAS',
    avatar: 'https://ui-avatars.com/api/?name=Robert+J&background=C9A84C&color=0A2E4A&size=128&rounded=true&bold=true'
  },
  {
    quote: 'We booked for our anniversary and were treated like royalty. The surprise sunset champagne on the bow was a gesture we will never forget. Thank you.',
    name: 'Anna & Pete L.',
    location: 'Canberra, ACT',
    avatar: 'https://ui-avatars.com/api/?name=Anna+Pete&background=C9A84C&color=0A2E4A&size=128&rounded=true&bold=true'
  },
  {
    quote: 'Safety was clearly their top priority without it being intrusive. It allowed us to relax and fully enjoy the adrenaline of the shark dives. Highly professional.',
    name: 'Michael B.',
    location: 'Darwin, NT',
    avatar: 'https://ui-avatars.com/api/?name=Michael+B&background=C9A84C&color=0A2E4A&size=128&rounded=true&bold=true'
  }
]

const isMobile = ref(false)
const activeIndex = ref(0)
const isDragging = ref(false)
const dragStartX = ref(0)
const dragOffset = ref(0)
let autoplayInterval: number | null = null

// Constants for dimensions
const CARD_WIDTH_PERCENT = 0.85
const GAP_PERCENT = 0.05

// Only screenWidth needs to be reactive - card/gap widths computed from it
const screenWidth = ref(0)

// Computed dimensions - always in sync with screenWidth
const cardWidth = computed(() => screenWidth.value * CARD_WIDTH_PERCENT)
const gapWidth = computed(() => screenWidth.value * GAP_PERCENT)

const checkMobile = () => {
  isMobile.value = window.innerWidth < 1024
  screenWidth.value = window.innerWidth
}

const goToSlide = (index: number) => {
  if (index < 0) index = testimonials.length - 1
  if (index >= testimonials.length) index = 0
  activeIndex.value = index
  resetAutoplay()
}

const nextSlide = () => goToSlide(activeIndex.value + 1)
const prevSlide = () => goToSlide(activeIndex.value - 1)

// Drag Logic
const onDragStart = (x: number) => {
  isDragging.value = true
  dragStartX.value = x
  stopAutoplay()
}

const onDragMove = (x: number) => {
  if (!isDragging.value) return
  dragOffset.value = x - dragStartX.value
}

const onDragEnd = () => {
  if (!isDragging.value) return
  isDragging.value = false
  if (Math.abs(dragOffset.value) > 50) {
    dragOffset.value > 0 ? prevSlide() : nextSlide()
  }
  dragOffset.value = 0
  startAutoplay()
}

// Event Listeners
const onTouchStart = (e: TouchEvent) => onDragStart(e.changedTouches[0].screenX)
const onTouchMove = (e: TouchEvent) => onDragMove(e.changedTouches[0].screenX)
const onTouchEnd = () => onDragEnd()

const onMouseDown = (e: MouseEvent) => onDragStart(e.clientX)
const onMouseMove = (e: MouseEvent) => onDragMove(e.clientX)
const onMouseUp = () => onDragEnd()
const onMouseLeave = () => { if (isDragging.value) onDragEnd() }

// Autoplay
const startAutoplay = () => {
  if (!isMobile.value || autoplayInterval) return
  autoplayInterval = window.setInterval(nextSlide, 6000)
}
const stopAutoplay = () => {
  if (autoplayInterval) clearInterval(autoplayInterval)
  autoplayInterval = null
}
const resetAutoplay = () => { stopAutoplay(); startAutoplay() }

// Fixed carousel positioning - uses computed values that stay in sync
const carouselStyle = computed(() => {
  const cw = cardWidth.value
  const gw = gapWidth.value
  const sw = screenWidth.value
  
  // 1. Find the exact center of the screen
  const screenCenter = sw / 2
  
  // 2. Find the center of the current active card
  const cardLeftEdge = activeIndex.value * (cw + gw)
  const cardCenter = cardLeftEdge + (cw / 2)
  
  // 3. Calculate offset to center the card
  const offset = screenCenter - cardCenter
  
  // 4. Add drag offset
  const finalX = offset + dragOffset.value

  return {
    transform: `translateX(${finalX}px)`,
    transition: isDragging.value ? 'none' : 'transform 0.4s cubic-bezier(0.25, 0.8, 0.25, 1)'
  }
})

onMounted(() => {
  checkMobile()
  window.addEventListener('resize', checkMobile)
  startAutoplay()
})

onUnmounted(() => {
  window.removeEventListener('resize', checkMobile)
  stopAutoplay()
})
</script>

<template>
  <section class="py-24 lg:py-32" style="background: var(--color-ocean-950);">
    
    <!-- Header (Normal Container) -->
    <div class="container mx-auto px-6 lg:px-12 mb-16">
      <div class="text-center">
        <p class="overline-text mb-4">Guest Experiences</p>
        <div class="gold-divider mb-6"></div>
        <h2 class="font-display text-5xl lg:text-6xl font-light" style="font-family: var(--font-display); color: var(--color-sand-100);">
          Words from the <span class="italic" style="color: var(--color-gold-400);">Sea</span>
        </h2>
      </div>
    </div>

    <!-- Desktop View -->
    <div v-if="!isMobile" class="container mx-auto px-6 lg:px-12">
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        <div v-for="(t, i) in testimonials" :key="t.name" class="testimonial-card">
          <!-- Avatar -->
          <div class="flex justify-center mb-4">
            <div class="avatar-wrapper">
              <img :src="t.avatar" :alt="t.name" class="avatar-image" />
            </div>
          </div>
          <div class="flex justify-center mb-4 gap-0.5">
            <svg v-for="s in 5" :key="s" width="14" height="14" viewBox="0 0 24 24" fill="var(--color-gold-400)">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
            </svg>
          </div>
          <p class="font-display text-lg font-light italic mb-6 leading-relaxed text-center" style="font-family: var(--font-display); color: var(--color-sand-100);">
            "{{ t.quote }}"
          </p>
          <div class="flex flex-col items-center gap-2 pt-4" style="border-top: 1px solid rgba(201, 168, 76, 0.15);">
            <p class="font-heading text-sm font-500" style="font-family: var(--font-heading); color: var(--color-sand-100);">{{ t.name }}</p>
            <p class="text-xs opacity-50" style="font-family: var(--font-body); color: var(--color-sand-200);">{{ t.location }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Mobile View (Full Bleed, Pixel Perfect) -->
    <div v-else class="mobile-section">
      <!-- Carousel Track -->
      <div 
        class="carousel-track"
        :style="carouselStyle"
        :class="{ 'is-dragging': isDragging }"
        @touchstart="onTouchStart"
        @touchmove="onTouchMove"
        @touchend="onTouchEnd"
        @mousedown="onMouseDown"
        @mousemove="onMouseMove"
        @mouseup="onMouseUp"
        @mouseleave="onMouseLeave"
      >
        <div
          v-for="(t, i) in testimonials"
          :key="t.name"
          class="testimonial-card mobile-card"
          :class="{ 'active': i === activeIndex }"
          :style="{ 
            width: `${cardWidth}px`,
            marginRight: i === testimonials.length - 1 ? '0px' : `${gapWidth}px`
          }"
        >
          <!-- Avatar -->
          <div class="flex justify-center mb-4">
            <div class="avatar-wrapper">
              <img :src="t.avatar" :alt="t.name" class="avatar-image" />
            </div>
          </div>
          <div class="flex justify-center mb-4 gap-0.5">
            <svg v-for="s in 5" :key="s" width="14" height="14" viewBox="0 0 24 24" fill="var(--color-gold-400)">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
            </svg>
          </div>
          <p class="font-display text-xl font-light italic mb-6 leading-relaxed text-center" style="font-family: var(--font-display); color: var(--color-sand-100); line-height: 1.7;">
            "{{ t.quote }}"
          </p>
          <div class="flex flex-col items-center gap-2 pt-4" style="border-top: 1px solid rgba(201, 168, 76, 0.15);">
            <p class="font-heading text-sm font-500" style="font-family: var(--font-heading); color: var(--color-sand-100);">{{ t.name }}</p>
            <p class="text-xs opacity-50" style="font-family: var(--font-body); color: var(--color-sand-200);">{{ t.location }}</p>
          </div>
        </div>
      </div>

      <!-- Controls -->
      <div class="controls-wrapper">
        <button class="nav-btn" @click="prevSlide" aria-label="Previous">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15,18 9,12 15,6"></polyline></svg>
        </button>
        <div class="dots">
          <button v-for="(_, i) in testimonials" :key="i" class="dot" :class="{ 'active': i === activeIndex }" @click="goToSlide(i)"/>
        </div>
        <button class="nav-btn" @click="nextSlide" aria-label="Next">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9,18 15,12 9,6"></polyline></svg>
        </button>
      </div>
    </div>

    <div class="container mx-auto px-6 lg:px-12 mt-12 text-center">
      <p class="text-sm italic opacity-60" style="font-family: var(--font-display); color: var(--color-sand-200);">
        Join our growing list of adventurers.
      </p>
    </div>
  </section>
</template>

<style scoped>
.testimonial-card {
  background: rgba(10, 46, 74, 0.5);
  border: 1px solid rgba(201, 168, 76, 0.12);
  padding: 40px 24px;
  border-radius: 4px;
  transition: all 0.3s ease;
}

/* Avatar Styles */
.avatar-wrapper {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  overflow: hidden;
  border: 2px solid var(--color-gold-400);
  box-shadow: 0 4px 20px rgba(201, 168, 76, 0.3);
}

.avatar-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* Full Screen Bleed Section */
.mobile-section {
  position: relative;
  width: 100vw;
  left: 50%;
  transform: translateX(-50%);
  margin: 2rem 0;
  overflow: hidden;
}

/* The Track */
.carousel-track {
  display: flex;
  height: 480px; /* Increased height to accommodate avatar */
  align-items: center;
  cursor: grab;
}

.carousel-track.is-dragging {
  cursor: grabbing;
}

.mobile-card {
  flex-shrink: 0;
  opacity: 0.4;
  transform: scale(0.85);
  transition: opacity 0.4s ease, transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
  user-select: none;
}

/* Active Card Styles */
.mobile-card.active {
  opacity: 1;
  transform: scale(1);
  border-color: var(--color-gold-400);
  box-shadow: 0 10px 40px -10px rgba(0,0,0,0.5);
}

/* Controls */
.controls-wrapper {
  position: relative;
  z-index: 10;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 24px;
  margin-top: 16px;
  width: 100vw;
  left: 50%;
  transform: translateX(-50%);
}

.nav-btn {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  border: 1px solid rgba(201, 168, 76, 0.3);
  background: rgba(10, 46, 74, 0.8);
  color: var(--color-gold-400);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.nav-btn:hover {
  background: var(--color-gold-400);
  color: #000;
}

.dots {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  max-width: 50vw;
  scrollbar-width: none;
  justify-content: center;
}
.dots::-webkit-scrollbar { display: none; }

.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: rgba(255,255,255,0.2);
  border: none;
  padding: 0;
  transition: all 0.3s;
}
.dot.active {
  background: var(--color-gold-400);
  width: 24px;
  border-radius: 4px;
}
</style>
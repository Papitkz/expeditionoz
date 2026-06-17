<template>
  <section class="ocean-wrapper">
    <div class="ocean-container">
      <div class="header-area">
        <h2 class="main-title">CURATED BY THE OCEAN</h2>
        <p class="main-description">
          Each expedition route is guided by weather, wildlife activity and ocean conditions
          to deliver the best possible experience at sea.
        </p>
      </div>

      <div
        class="experience-grid"
        ref="carouselRef"
        @scroll="onCarouselScroll"
        @touchstart="pauseAutoplay"
      >
        <div
          v-for="item in experiences"
          :key="item.label"
          class="experience-card"
        >
          <!-- Floating Preview Card Above (Desktop Only) -->
          <div class="v-hover-floating-card">
            <div class="v-floating-image-wrap">
              <img 
                v-if="item.image"
                :src="item.image" 
                :alt="item.alt || item.label" 
                class="v-floating-image"
              />
              <div v-else class="v-floating-placeholder">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-3.09-3.09a2 2 0 0 0-2.83 0L6 21"/></svg>
              </div>
              <div class="v-floating-overlay"></div>
            </div>
            <div class="v-floating-body">
              <span class="v-hover-tag">Ocean Experience</span>
              <h3 class="v-hover-title">{{ item.label }}</h3>
              <div class="v-hover-divider"></div>
              <p class="v-hover-text">{{ item.description }}</p>
            </div>
          </div>

          <!-- Base Card Grid Trigger -->
          <div class="experience-image-wrap">
            <img
              v-if="item.image"
              :src="item.image"
              :alt="item.alt || item.label"
              class="experience-image"
            />
            <div v-else class="experience-image-empty">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-3.09-3.09a2 2 0 0 0-2.83 0L6 21"/></svg>
            </div>
            <div class="experience-overlay"></div>
          </div>

          <div class="experience-label">
            <h3 class="experience-title">{{ item.label }}</h3>
          </div>
        </div>
      </div>

      <!-- Carousel controls (mobile only) -->
      <div class="carousel-controls" v-if="isMobile">
        <button
          class="carousel-arrow carousel-arrow--prev"
          type="button"
          aria-label="Previous slide"
          @click="prevSlide"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
        </button>

        <div class="carousel-dots">
          <button
            v-for="(item, i) in experiences"
            :key="'dot-' + item.label"
            class="dot"
            :class="{ active: i === currentIndex }"
            :aria-label="'Go to slide ' + (i + 1)"
            type="button"
            @click="goToSlide(i)"
          ></button>
        </div>

        <button
          class="carousel-arrow carousel-arrow--next"
          type="button"
          aria-label="Next slide"
          @click="nextSlide"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="9 18 15 12 9 6"></polyline>
          </svg>
        </button>
      </div>

      <div class="nature-box">
        <div class="nature-left">
          <img
            v-if="natureBgImage"
            :src="natureBgImage"
            :alt="natureBgAlt || 'Boat'"
            class="nature-image"
          />
          <img
            v-else
            src="https://cdn.pixabay.com/photo/2015/03/31/13/34/ship-701079_1280.jpg"
            alt="Boat"
            class="nature-image"
          />
          <div class="nature-gradient"></div>
          <div class="nature-content">
            <h2 class="nature-title">
              CLOSER TO NATURE.<br>
              FURTHER FROM THE CROWDS.
            </h2>
            <p class="nature-description">
              Small group expeditions with local knowledge,
              experienced crew and genuine passion for
              Ningaloo Reef.
            </p>
          </div>
        </div>

        <div class="nature-right">
          <div
            v-for="feature in features"
            :key="feature.title"
            class="feature-card"
          >
            <div class="feature-icon">
              <svg
                width="42"
                height="42"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.5"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <template v-if="feature.icon === 'sail'">
                  <path d="M2 20h20L12 4 2 20z" />
                  <path d="M12 4v16" />
                </template>

                <template v-if="feature.icon === 'group'">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </template>

                <template v-if="feature.icon === 'chef'">
                  <path d="M6 13.87A4 4 0 0 1 7.41 6a5.11 5.11 0 0 1 1.05-1.54 5 5 0 0 1 7.08 0A5.11 5.11 0 0 1 16.59 6 4 4 0 0 1 18 13.87V21H6Z" />
                  <line x1="6" y1="17" x2="18" y2="17" />
                </template>

                <template v-if="feature.icon === 'leaf'">
                  <path d="M11 20A7 7 0 0 1 9.8 6.6C13.4 4.2 18 3 21 3c-1 3-3.5 7.5-6.5 10.5A7 7 0 0 1 11 20z" />
                  <path d="M11 20c-2.5-2.5-2.5-6.5 0-9" />
                </template>

                <template v-if="feature.icon === 'location'">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </template>
              </svg>
            </div>

            <div>
              <h3 class="feature-title">{{ feature.title }}</h3>
              <p class="feature-text">{{ feature.description }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useComponentCMS } from '@/composables/useComponentCMS'

const cms = useComponentCMS('InclusionsSection')

// ─── Hardcoded defaults (text + fallback images) ───────────────────────────
const EXPERIENCE_DEFAULTS = [
  {
    label: 'MANTA RAY ENCOUNTERS',
    description: 'Swim beside graceful manta rays in crystal clear waters.',
    fallbackImage: 'https://cdn.pixabay.com/photo/2025/08/05/18/22/manta-9757343_1280.jpg',
  },
  {
    label: 'WHALE WATCHING',
    description: 'Witness humpback whales during seasonal migration.',
    fallbackImage: 'https://cdn.pixabay.com/photo/2018/08/08/16/15/sailing-boat-3592517_1280.jpg',
  },
  {
    label: 'FREEDIVING',
    description: 'Explore untouched reef systems with expert guides.',
    fallbackImage: 'https://cdn.pixabay.com/photo/2025/01/12/15/57/diver-9328625_1280.jpg',
  },
  {
    label: 'REMOTE BEACH EXPLORATION',
    description: 'Discover hidden beaches away from the crowds.',
    fallbackImage: 'https://cdn.pixabay.com/photo/2019/11/21/00/28/tundra-4641439_1280.jpg',
  },
  {
    label: 'KAYAKING YARDIE CREEK',
    description: 'Paddle through breathtaking canyon landscapes.',
    fallbackImage: 'https://cdn.pixabay.com/photo/2020/02/03/03/04/kayak-4814610_1280.jpg',
  },
  {
    label: 'YOGA & BREATHWORK',
    description: 'Reconnect your body and mind with ocean energy.',
    fallbackImage: 'https://cdn.pixabay.com/photo/2019/06/26/09/52/shit-image-4300034_1280.jpg',
  },
  {
    label: 'SUNSET DINNERS',
    description: 'Enjoy chef crafted dining under golden skies.',
    fallbackImage: 'https://cdn.pixabay.com/photo/2020/04/22/07/41/sunset-5076385_1280.jpg',
  },
  {
    label: 'EXPEDITION RIB ADVENTURES',
    description: 'High speed exploration to remote marine locations.',
    fallbackImage: 'https://cdn.pixabay.com/photo/2024/01/05/13/59/ship-8489587_1280.jpg',
  },
]

// ─── Merge CMS data over defaults ─────────────────────────────────────────
const experiences = computed(() => {
  const cmsCards = cms.getSection('experienceCards')

  return EXPERIENCE_DEFAULTS.map((def, index) => {
    const cmsItem = cmsCards.find((i) => i.slotIndex === index)
    return {
      label:       cmsItem?.title       || def.label,
      description: cmsItem?.description || def.description,
      image:       cmsItem?.imageUrl    || def.fallbackImage,
      alt:         cmsItem?.alt         || def.label,
    }
  })
})

// ─── Nature box background image (slot 0 of "natureBg" section) ───────────
const natureBgImage = computed(() => cms.getImageUrl('natureBg', 0))
const natureBgAlt   = computed(() => cms.getAlt('natureBg', 0))

// ─── Static feature cards (icons are code-driven, not CMS) ────────────────
const features = [
  {
    icon: 'sail',
    title: 'EXPEDITION SAILING FLEET',
    description: 'Purpose built vessels for true ocean adventure.',
  },
  {
    icon: 'group',
    title: 'SMALL GROUP EXPEDITIONS',
    description: 'Maximum 12 guests for a personal experience.',
  },
  {
    icon: 'chef',
    title: 'CHEF CRAFTED DINING',
    description: 'Delicious, nutritious meals prepared by our onboard chef.',
  },
  {
    icon: 'leaf',
    title: 'LOCALLY SOURCED FOOD & DRINKS',
    description: 'We are proud that our food and drinks are locally sourced.',
  },
  {
    icon: 'location',
    title: 'LOCAL OCEAN KNOWLEDGE',
    description: 'Expert crew with unmatched local insight.',
  },
]

// ─── Mobile carousel: finger swipe (native scroll-snap) + autoplay ────────
const carouselRef = ref<HTMLElement | null>(null)
const currentIndex = ref(0)
const isMobile = ref(false)

const totalSlides = computed(() => experiences.value.length)

const CAROUSEL_GAP = 12       // must match the gap used in .experience-grid @ 480px
const AUTOPLAY_DELAY = 4000   // ms between auto-advances
const RESUME_DELAY = 5000     // ms to wait before resuming autoplay after touch

let autoplayTimer: ReturnType<typeof setInterval> | null = null
let resumeTimer: ReturnType<typeof setTimeout> | null = null
let scrollSettleTimer: ReturnType<typeof setTimeout> | null = null

function checkIsMobile() {
  isMobile.value = window.matchMedia('(max-width: 480px)').matches
}

function scrollToSlide(index: number, smooth = true) {
  const track = carouselRef.value
  const card = track?.children[index] as HTMLElement | undefined
  if (!track || !card) return

  track.scrollTo({
    left: card.offsetLeft,
    behavior: smooth ? 'smooth' : 'auto',
  })
  currentIndex.value = index
}

function nextSlide() {
  scrollToSlide((currentIndex.value + 1) % totalSlides.value)
}

function prevSlide() {
  scrollToSlide((currentIndex.value - 1 + totalSlides.value) % totalSlides.value)
}

function startAutoplay() {
  stopAutoplay()
  autoplayTimer = setInterval(() => {
    if (isMobile.value) nextSlide()
  }, AUTOPLAY_DELAY)
}

function stopAutoplay() {
  if (autoplayTimer) {
    clearInterval(autoplayTimer)
    autoplayTimer = null
  }
}

// Called on touchstart: pause autoplay while the user is interacting,
// then resume it after a short idle period
function pauseAutoplay() {
  stopAutoplay()
  if (resumeTimer) clearTimeout(resumeTimer)
  resumeTimer = setTimeout(() => {
    if (isMobile.value) startAutoplay()
  }, RESUME_DELAY)
}

function goToSlide(index: number) {
  scrollToSlide(index)
  pauseAutoplay()
}

// Keep the active dot in sync while the user swipes by hand
function onCarouselScroll() {
  if (scrollSettleTimer) clearTimeout(scrollSettleTimer)
  scrollSettleTimer = setTimeout(() => {
    const track = carouselRef.value
    if (!track) return

    const cardWidth = (track.children[0] as HTMLElement | undefined)?.offsetWidth || 1
    const index = Math.round(track.scrollLeft / (cardWidth + CAROUSEL_GAP))

    currentIndex.value = Math.min(Math.max(index, 0), totalSlides.value - 1)
  }, 100)
}

function handleResize() {
  const wasMobile = isMobile.value
  checkIsMobile()

  if (isMobile.value && !wasMobile) {
    startAutoplay()
  } else if (!isMobile.value && wasMobile) {
    stopAutoplay()
    if (resumeTimer) clearTimeout(resumeTimer)
  }
}

onMounted(() => {
  cms.load()

  checkIsMobile()
  window.addEventListener('resize', handleResize)

  if (isMobile.value) startAutoplay()
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  stopAutoplay()
  if (resumeTimer) clearTimeout(resumeTimer)
  if (scrollSettleTimer) clearTimeout(scrollSettleTimer)
})
</script>

<style scoped>
:global(html, body) {
  margin: 0;
  padding: 0;
  width: 100%;
  overflow-x: hidden;
}

:global(*) {
  box-sizing: border-box;
}

.ocean-wrapper {
  width: 100vw;
  max-width: 100vw;
  margin-left: calc(50% - 50vw);
  margin-right: calc(50% - 50vw);
  background: radial-gradient(circle at top, #06314f 0%, #041a2b 55%);
  padding: 60px 20px 40px 20px;
  overflow: visible; 
}

.ocean-container {
  width: 100%;
  margin: 0 auto;
}

.header-area {
  text-align: center;
  margin-bottom: 40px;
}

.main-title {
  color: #c69a45;
  font-size: clamp(1.4rem, 2vw, 2rem);
  font-weight: 400;
  letter-spacing: 0.18em;
  margin-bottom: 10px;
  font-family: 'Playfair Display', serif;
}

.main-description {
  color: rgba(255,255,255,0.75);
  max-width: 720px;
  margin: auto;
  line-height: 1.5;
  font-size: 0.95rem;
}

.experience-grid {
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  gap: 12px;
  margin-top: 140px;
  margin-bottom: 40px;
}

.carousel-controls {
  display: none;
}

.experience-card {
  position: relative;
  border: 1px solid rgba(198,154,69,0.25);
  overflow: visible;
  background: rgba(4,26,43,0.4);
  transition: all 0.4s cubic-bezier(0.25, 1, 0.5, 1);
}

.experience-card:hover {
  transform: translateY(-2px);
  border-color: #c69a45;
  z-index: 50;
}

.experience-image-wrap {
  position: relative;
  aspect-ratio: 1 / 1;
  overflow: hidden;
}

.experience-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.6s cubic-bezier(0.25, 1, 0.5, 1);
}

.experience-image-empty {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(4,26,43,0.6);
  color: rgba(198,154,69,0.3);
}

.experience-card:hover .experience-image {
  transform: scale(1.05);
}

.experience-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    to top,
    rgba(4,26,43,0.9),
    rgba(4,26,43,0.3),
    transparent
  );
}

/* ==========================================================================
   Floating Tooltip Configurations
   ========================================================================== */
.v-hover-floating-card {
  position: absolute;
  bottom: calc(100% + 12px);
  left: 50%;
  transform: translateX(-50%) translateY(10px);
  width: 260px;
  background: #041a2b;
  border: 1px solid #c69a45;
  box-shadow: 0 15px 35px rgba(0, 0, 0, 0.7);
  opacity: 0;
  visibility: hidden;
  transition: opacity 0.3s ease, transform 0.35s cubic-bezier(0.25, 1, 0.5, 1), visibility 0.3s;
  pointer-events: none;
  border-radius: 2px;
  overflow: hidden; 
}

.v-floating-image-wrap {
  position: relative;
  width: 100%;
  height: 130px;
  overflow: hidden;
}

.v-floating-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transform: scale(1);
  transition: transform 0.8s cubic-bezier(0.25, 1, 0.5, 1);
}

.v-floating-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(4,26,43,0.8);
  color: rgba(198,154,69,0.3);
}

.v-floating-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    to top,
    #041a2b 0%,
    rgba(4, 26, 43, 0.2) 60%,
    transparent 100%
  );
}

.v-floating-body {
  padding: 14px;
  text-align: center;
}

/* Active Hover Transitions */
.experience-card:hover .v-hover-floating-card {
  opacity: 1;
  visibility: visible;
  transform: translateX(-50%) translateY(0);
}

.experience-card:hover .v-floating-image {
  transform: scale(1.12);
}

/* Anchor Pointers */
.v-hover-floating-card::after {
  content: '';
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  border-width: 7px;
  border-style: solid;
  border-color: #041a2b transparent transparent transparent;
}

.v-hover-floating-card::before {
  content: '';
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  border-width: 8px;
  border-style: solid;
  border-color: #c69a45 transparent transparent transparent;
  z-index: -1;
}

.v-hover-tag {
  color: #c69a45;
  font-size: 0.58rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  font-weight: 600;
  display: block;
  margin-bottom: 4px;
}

.v-hover-title {
  color: white;
  font-size: 0.8rem;
  font-weight: 600;
  line-height: 1.3;
  letter-spacing: 0.04em;
  margin: 0 auto 6px auto;
}

.v-hover-divider {
  width: 24px;
  height: 1px;
  background: rgba(198, 154, 69, 0.5);
  margin: 0 auto 8px auto;
}

.v-hover-text {
  color: rgba(255, 255, 255, 0.85);
  font-size: 0.72rem;
  line-height: 1.4;
  margin: 0;
  font-weight: 300;
}

/* ==========================================================================
   Base Structure Components Continuation
   ========================================================================== */
.experience-label {
  min-height: 62px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 10px;
  text-align: center;
  background: #041a2b;
}

.experience-title {
  color: white;
  font-size: 0.72rem;
  line-height: 1.4;
  letter-spacing: 0.06em;
  font-weight: 700;
}

.nature-box {
  border: 1px solid rgba(198,154,69,0.35);
  display: grid;
  grid-template-columns: 34% 66%;
  overflow: hidden;
  background: rgba(255,255,255,0.02);
  margin-top: 40px;
}

.nature-left {
  position: relative;
  min-height: 340px;
}

.nature-image {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.nature-gradient {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    to top,
    rgba(4,26,43,0.95),
    rgba(4,26,43,0.45),
    transparent
  );
}

.nature-content {
  position: relative;
  z-index: 2;
  padding: 28px;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
}

.nature-title {
  color: #e5bb63;
  font-size: clamp(1.7rem, 2vw, 2.6rem);
  line-height: 1.2;
  margin-bottom: 14px;
  font-family: 'Playfair Display', serif;
}

.nature-description {
  color: rgba(255,255,255,0.8);
  line-height: 1.7;
  max-width: 340px;
}

.nature-right {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
}

.feature-card {
  padding: 24px 18px;
  border-left: 1px solid rgba(198,154,69,0.25);
  text-align: center;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  transition: all 0.3s ease;
}

.feature-icon {
  color: #c69a45;
  margin-bottom: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
}

.feature-card:hover .feature-icon {
  color: #e5bb63;
}

.feature-title {
  color: white;
  font-size: 0.76rem;
  line-height: 1.5;
  letter-spacing: 0.08em;
  margin-bottom: 12px;
  font-weight: 700;
}

.feature-text {
  color: rgba(255,255,255,0.75);
  line-height: 1.7;
  font-size: 0.82rem;
}

/* ==========================================================================
   Responsive Framework Modifications
   ========================================================================== */
@media (max-width: 1400px) {
  .experience-grid {
    grid-template-columns: repeat(4, 1fr);
    row-gap: 32px;
    margin-top: 140px;
  }
}

@media (max-width: 1024px) {
  .nature-box {
    grid-template-columns: 1fr;
  }

  .nature-right {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 768px) {
  .experience-grid {
    grid-template-columns: repeat(2, 1fr);
    row-gap: 32px;
    gap: 12px;
    margin-top: 140px;
  }

  .v-hover-floating-card {
    width: 200px;
  }

  .v-floating-image-wrap {
    height: 100px;
  }

  .v-hover-title {
    font-size: 0.75rem;
  }

  .v-hover-text {
    font-size: 0.68rem;
  }

  .nature-right {
    grid-template-columns: 1fr;
  }

  .feature-card {
    border-left: none;
    border-top: 1px solid rgba(198,154,69,0.2);
  }

  .nature-left {
    min-height: 280px;
  }
}

@media (max-width: 480px) {
  .v-hover-floating-card {
    display: none !important;
  }

  /* ── Carousel layout: native scroll-snap = finger swipe for free ── */
  .experience-grid {
    display: flex;
    overflow-x: auto;
    overflow-y: visible;
    scroll-snap-type: x mandatory;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none;
    -ms-overflow-style: none;
    margin-top: 20px;
    margin-bottom: 0;
    row-gap: 0;
    gap: 12px;
    padding-bottom: 4px;
  }

  .experience-grid::-webkit-scrollbar {
    display: none;
  }

  .experience-card {
    flex: 0 0 82%;
    scroll-snap-align: center;
  }

  /* avoid sticky hover/translate state on touch */
  .experience-card:hover {
    transform: none;
  }

  /* ── Carousel controls: arrows + dots ── */
  .carousel-controls {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    margin-top: 16px;
    margin-bottom: 8px;
  }

  .carousel-arrow {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    border-radius: 50%;
    border: 1px solid rgba(198, 154, 69, 0.4);
    background: rgba(4, 26, 43, 0.6);
    color: #c69a45;
    cursor: pointer;
    transition: all 0.3s ease;
    padding: 0;
  }

  .carousel-arrow:active {
    transform: scale(0.92);
  }

  .carousel-arrow:hover {
    background: rgba(198, 154, 69, 0.15);
    border-color: #c69a45;
  }

  .carousel-dots {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 8px;
  }

  .dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    border: none;
    padding: 0;
    background: rgba(198, 154, 69, 0.3);
    cursor: pointer;
    transition: background 0.3s ease, transform 0.3s ease;
  }

  .dot.active {
    background: #c69a45;
    transform: scale(1.25);
  }

  .main-title {
    font-size: 1.2rem;
  }

  .main-description {
    font-size: 0.85rem;
  }

  .experience-title {
    font-size: 0.65rem;
  }

  .nature-title {
    font-size: 1.5rem;
  }
}
</style>
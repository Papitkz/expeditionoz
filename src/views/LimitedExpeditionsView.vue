<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useComponentCMS } from '@/composables/useComponentCMS'
import { useSEO } from '@/composables/useSEO'
import NoImagePlaceholder from '@/components/NoImagePlaceholder.vue'
import {
  fetchPublishedLimitedExpeditions,
  type LimitedExpeditionData,
} from '@/composables/useLimitedExpeditionData'

const router = useRouter()
const cms = useComponentCMS('SpecialtyExpeditionsSection')

useSEO({
  title: 'Limited Expeditions — Expedition OZ',
  description: 'Selected Ningaloo Reef departures built around special hosts, seasonal encounters and unique ocean experiences. Freediving, surf, whale song, photography and more.',
  path: '/limited-expeditions',
  type: 'website',
})

// Live CMS data (falls back to FALLBACK_LIMITED_EXPEDITIONS internally if
// Firestore is empty/unavailable) — this is what AdminLimitedExpeditions edits.
const trips = ref<LimitedExpeditionData[]>([])
const loadingTrips = ref(true)

const EXPEDITIONS = computed(() =>
  trips.value.map((e, i) => ({
    key: e.slug,
    slotIndex: e.sortOrder ?? i,
    nights: `${e.nights} NIGHTS`,
    title: e.title,
    vessel: `ABOARD ${e.vesselName.toUpperCase()}`,
    host: e.host,
    date: e.dateLabel,
    description: e.description,
    shortDescriptionption : e.shortDescription,
    icon: e.icon,
    heroImageUrl: e.heroImageUrl,
  }))
)

const cards = computed(() =>
  EXPEDITIONS.value.map((e) => {
    // Prefer the hero image uploaded directly on the expedition in
    // AdminLimitedExpeditions; fall back to the older specialtyCards slot
    // image (managed in AdminSections) only if no hero image is set yet.
    const cmsItem = cms.getSlot('specialtyCards', e.slotIndex)
    const image = e.heroImageUrl || cmsItem?.imageUrl || ''
    return {
      ...e,
      image,
      hasImage: !!image,
    }
  })
)

function goToExpedition(key: string) {
  router.push(`/limited-expeditions/${key}`)
}

let observer: IntersectionObserver | null = null

function setupObserver() {
  if (!observer) {
    observer = new IntersectionObserver(
      (entries) =>
        entries.forEach((en) => {
          if (en.isIntersecting) en.target.classList.add('show')
        }),
      { threshold: 0.08 }
    )
  }
  document.querySelectorAll('.le-card.reveal:not(.show)').forEach((el) => observer?.observe(el))
}

// ─── Mobile carousel: finger swipe, arrows + autoplay ─────────────────────
const carouselRef = ref<HTMLElement | null>(null)
const currentIndex = ref(0)
const isMobile = ref(false)

const totalSlides = computed(() => cards.value.length)

const CAROUSEL_GAP = 12       // must match the gap used in .le-grid @ 720px
const AUTOPLAY_DELAY = 4500   // ms between auto-advances
const RESUME_DELAY = 5500     // ms to wait before resuming autoplay after touch

let autoplayTimer: ReturnType<typeof setInterval> | null = null
let resumeTimer: ReturnType<typeof setTimeout> | null = null
let scrollSettleTimer: ReturnType<typeof setTimeout> | null = null

function checkIsMobile() {
  isMobile.value = window.matchMedia('(max-width: 720px)').matches
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
  if (!totalSlides.value) return
  scrollToSlide((currentIndex.value + 1) % totalSlides.value)
}

function prevSlide() {
  if (!totalSlides.value) return
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

// Called on touchstart / arrow click: pause autoplay while the user is
// interacting, then resume it after a short idle period
function pauseAutoplay() {
  stopAutoplay()
  if (resumeTimer) clearTimeout(resumeTimer)
  resumeTimer = setTimeout(() => {
    if (isMobile.value) startAutoplay()
  }, RESUME_DELAY)
}

function handlePrevClick() {
  prevSlide()
  pauseAutoplay()
}

function handleNextClick() {
  nextSlide()
  pauseAutoplay()
}

function handleDotClick(i: number) {
  scrollToSlide(i)
  pauseAutoplay()
}

// Keep currentIndex in sync while the user swipes by hand
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

onMounted(async () => {
  loadingTrips.value = true
  trips.value = await fetchPublishedLimitedExpeditions()
  loadingTrips.value = false

  await nextTick()
  setupObserver()
  cms.load()

  checkIsMobile()
  window.addEventListener('resize', handleResize)
  if (isMobile.value) startAutoplay()
})

onUnmounted(() => {
  observer?.disconnect()
  window.removeEventListener('resize', handleResize)
  stopAutoplay()
  if (resumeTimer) clearTimeout(resumeTimer)
  if (scrollSettleTimer) clearTimeout(scrollSettleTimer)
})
</script>

<template>
  <div class="le-page">
    <section class="le-hero">
      <div class="compass-row">
        <div class="hrule"></div>
        <div class="compass">✳</div>
        <div class="hrule"></div>
      </div>
      <h1 class="le-title">LIMITED EXPEDITIONS</h1>
      <p class="le-subtitle">
        Selected departures built around special hosts, seasonal encounters and unique ocean experiences.
      </p>
    </section>

    <section class="le-grid-wrap">
      <div class="le-carousel-outer">
        <button
          v-if="isMobile"
          class="le-arrow le-arrow--prev"
          type="button"
          aria-label="Previous expedition"
          @click="handlePrevClick"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
        </button>

        <div
          class="le-grid"
          ref="carouselRef"
          @scroll="onCarouselScroll"
          @touchstart="pauseAutoplay"
        >
          <article
            v-for="(card, i) in cards"
            :key="card.key"
            class="le-card reveal"
            :style="{ transitionDelay: `${i * 0.07}s` }"
            @click="goToExpedition(card.key)"
          >
            <div class="le-card-img">
              <div class="nights-badge">{{ card.nights }}</div>

              <template v-if="card.hasImage">
                <img :src="card.image" :alt="card.title" />
              </template>
              <NoImagePlaceholder v-else :label="card.title" />
            </div>

            <div class="le-card-body">
              <div class="title-row">
                <div class="card-icon">
                  <svg v-if="card.icon === 'freedive'" viewBox="0 0 24 24" fill="none">
                    <path d="M3 16c2-3 5-5 9-5s7 2 9 5" stroke="#c79a5c" stroke-width="1.4" stroke-linecap="round"/>
                    <circle cx="17" cy="7" r="2" stroke="#c79a5c" stroke-width="1.4"/>
                    <path d="M15 9L7 15" stroke="#c79a5c" stroke-width="1.4" stroke-linecap="round"/>
                  </svg>
                  <svg v-else-if="card.icon === 'surf'" viewBox="0 0 24 24" fill="none">
                    <path d="M2 14c2.5 1.5 5 1.5 7.5 0s5-1.5 7.5 0" stroke="#c79a5c" stroke-width="1.4" stroke-linecap="round"/>
                    <path d="M5 14c0-5 4-9 9-9-1.5 3-2 6-1 9" stroke="#c79a5c" stroke-width="1.4" stroke-linecap="round"/>
                  </svg>
                  <svg v-else-if="card.icon === 'whale'" viewBox="0 0 24 24" fill="none">
                    <path d="M2 12c2-4 6-6 10-6s8 3 10 7c-2 1-4 1-6 0-2 3-5 4-8 3" stroke="#c79a5c" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M18 18c1-2 2-4 1-6" stroke="#c79a5c" stroke-width="1.4" stroke-linecap="round"/>
                  </svg>
                  <svg v-else-if="card.icon === 'camera'" viewBox="0 0 24 24" fill="none">
                    <rect x="3" y="8" width="18" height="12" rx="2" stroke="#c79a5c" stroke-width="1.4"/>
                    <circle cx="12" cy="14" r="3" stroke="#c79a5c" stroke-width="1.4"/>
                    <path d="M8.5 8L9.8 5.5h4.4L15.5 8" stroke="#c79a5c" stroke-width="1.4" stroke-linecap="round"/>
                  </svg>
                  <svg v-else-if="card.icon === 'jellyfish'" viewBox="0 0 24 24" fill="none">
                    <path d="M6 10a6 6 0 0 1 12 0" stroke="#c79a5c" stroke-width="1.4" stroke-linecap="round"/>
                    <path d="M8 10c0 4 1 7 1 7M12 10v7M16 10c0 4-1 7-1 7" stroke="#c79a5c" stroke-width="1.4" stroke-linecap="round"/>
                  </svg>
                  <svg v-else-if="card.icon === 'lotus'" viewBox="0 0 24 24" fill="none">
                    <path d="M12 20c-2-2-5-4-5-7a5 5 0 0 1 10 0c0 3-3 5-5 7z" stroke="#c79a5c" stroke-width="1.4"/>
                    <path d="M7 13c-2-1-4-3-4-5a4 4 0 0 1 6 3M17 13c2-1 4-3 4-5a4 4 0 0 0-6 3" stroke="#c79a5c" stroke-width="1.4" stroke-linecap="round"/>
                  </svg>
                  <svg v-else-if="card.icon === 'shark'" viewBox="0 0 24 24" fill="none">
                    <path d="M2 14c3-3 6-5 10-5 2-3 3-6 5-7-1 3-1 6 1 8 2 1 4 2 4 4H2z" stroke="#c79a5c" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                  <svg v-else viewBox="0 0 24 24" fill="none">
                    <path d="M9 3h6l1 6 3.5 1.5L17 14l1 7H6l1-7-2.5-3.5L8 9z" stroke="#c79a5c" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </div>

                <div class="title-copy">
                  <h3 class="le-card-title">{{ card.title }}</h3>
                  <p class="le-card-vessel">{{ card.vessel }}</p>
                </div>
              </div>

              <p class="le-card-desc">{{ card.shortDescriptionption}} </p>

              <p v-if="card.host" class="le-card-host">Hosted by {{ card.host }}.</p>

              <div class="divider"></div>
              <p class="le-card-desc">{{ card.description}} </p>


              <div class="le-card-date">
                <svg viewBox="0 0 24 24" fill="none" stroke="#c79a5c" stroke-width="1.8">
                  <rect x="3" y="4" width="18" height="18" rx="2"/>
                  <path d="M3 9h18M8 2v4M16 2v4"/>
                </svg>
                <span>{{ card.date }}</span>
              </div>

              <button class="le-card-btn" @click.stop="goToExpedition(card.key)">VIEW EXPEDITION</button>
            </div>
          </article>
        </div>

        <button
          v-if="isMobile"
          class="le-arrow le-arrow--next"
          type="button"
          aria-label="Next expedition"
          @click="handleNextClick"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="9 18 15 12 9 6"></polyline>
          </svg>
        </button>
      </div>

      <div class="carousel-dots" v-if="isMobile">
        <button
          v-for="(card, i) in cards"
          :key="'dot-' + card.key"
          class="dot"
          :class="{ active: i === currentIndex }"
          :aria-label="'Go to slide ' + (i + 1)"
          type="button"
          @click="handleDotClick(i)"
        ></button>
      </div>
    </section>
  </div>
</template>

<style scoped>
.le-page {
  min-height: 100vh;
  color: #f6efe3;
  background:
    radial-gradient(circle at 50% 0%, rgba(28, 73, 112, 0.25), transparent 28%),
    linear-gradient(180deg, #061528 0%, #04111f 100%);
}

.le-topbar {
  height: 78px;
  padding: 0 1.4rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid rgba(199, 154, 92, 0.18);
  background: rgba(4, 16, 31, 0.55);
  backdrop-filter: blur(6px);
}

.brand {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.brand-mark {
  color: #c79a5c;
  font-size: 1.7rem;
  line-height: 1;
}

.brand-name {
  font-family: var(--font-display);
  letter-spacing: 0.16em;
  font-size: 1.02rem;
  color: #d8c0a0;
}

.brand-sub {
  font-size: 0.58rem;
  letter-spacing: 0.24em;
  color: rgba(246, 239, 227, 0.7);
  margin-top: 0.15rem;
}

.nav {
  display: flex;
  align-items: center;
  gap: 1.85rem;
  font-size: 0.75rem;
  letter-spacing: 0.12em;
}

.nav a {
  color: rgba(246, 239, 227, 0.84);
  text-decoration: none;
}

.nav-caret {
  margin-left: 0.35rem;
  font-size: 0.8rem;
}

.enquire-btn {
  border: 1px solid #b88a4a;
  background: transparent;
  color: #caa062;
  padding: 0.9rem 1.2rem;
  border-radius: 4px;
  letter-spacing: 0.12em;
  font-size: 0.72rem;
  cursor: pointer;
}

.le-hero {
  text-align: center;
  padding: 1.8rem 1rem 1.2rem;
}

.compass-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.8rem;
  margin-bottom: 0.55rem;
}

.compass {
  color: #c79a5c;
  font-size: 0.95rem;
}

.hrule {
  width: 122px;
  height: 1px;
  background: rgba(199, 154, 92, 0.65);
}

.le-title {
  font-family: var(--font-display);
  font-size: clamp(2.3rem, 4vw, 4rem);
  font-weight: 500;
  letter-spacing: 0.08em;
  margin: 0;
  color: #f7f1e8;
}

.le-subtitle {
  margin: 0.75rem auto 0;
  max-width: 760px;
  color: rgba(246, 239, 227, 0.8);
  font-size: 0.95rem;
  line-height: 1.6;
}

.le-grid-wrap {
  padding: 0.9rem 1.2rem 3rem;
}

.le-carousel-outer {
  position: relative;
}

.le-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0.75rem;
  align-items: stretch;
}

.le-arrow {
  display: none;
}

.carousel-dots {
  display: none;
}

.le-card {
  position: relative;
  overflow: hidden;
  border: 1px solid rgba(199, 154, 92, 0.55);
  border-radius: 8px;
  background: rgba(4, 18, 34, 0.92);
  display: flex;
  flex-direction: column;
  min-height: 520px;
  opacity: 0;
  transform: translateY(16px);
  transition: opacity 0.45s ease, transform 0.45s ease, border-color 0.25s ease;
  cursor: pointer;
}

.le-card.show {
  opacity: 1;
  transform: translateY(0);
}

.le-card:hover {
  border-color: #d1a35f;
}

.le-card-img {
  position: relative;
  aspect-ratio: 16 / 9;
  overflow: hidden;
  background: #0a1d31;
}

.le-card-img img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  transition: transform 0.7s ease;
}

.le-card:hover .le-card-img img {
  transform: scale(1.05);
}

.nights-badge {
  position: absolute;
  top: 0;
  left: 0;
  z-index: 2;
  background: #c79a5c;
  color: #f6efe3;
  font-size: 0.66rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  padding: 0.55rem 0.75rem;
  border-bottom-right-radius: 4px;
}

.le-card-body {
  padding: 0.85rem 0.95rem 0.9rem;
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
}

.title-row {
  display: flex;
  gap: 0.7rem;
  align-items: flex-start;
  margin-bottom: 0.45rem;
}

.card-icon {
  width: 22px;
  flex-shrink: 0;
  margin-top: 0.1rem;
}

.card-icon svg {
  width: 22px;
  height: 22px;
}

.le-card-title {
  margin: 0;
  font-family: var(--font-display);
  font-size: 1rem;
  font-weight: 500;
  line-height: 1.1;
  color: #f7f1e8;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.le-card-vessel {
  margin: 0.12rem 0 0;
  font-size: 0.62rem;
  letter-spacing: 0.13em;
  text-transform: uppercase;
  color: #c79a5c;
}

.le-card-desc {
  margin: 0.55rem 0 0.4rem;
  font-size: 0.78rem;
  line-height: 1.45;
  color: rgba(246, 239, 227, 0.8);
}

.le-card-host {
  margin: 0 0 0.45rem;
  font-size: 0.76rem;
  color: rgba(246, 239, 227, 0.72);
}

.divider {
  width: 100%;
  height: 1px;
  background: rgba(199, 154, 92, 0.36);
  margin: 0 0 0.5rem;
}

.le-card-date {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  font-size: 0.68rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: rgba(246, 239, 227, 0.92);
  margin-bottom: 0.55rem;
}

.le-card-date svg {
  width: 13px;
  height: 13px;
  flex-shrink: 0;
}

.le-card-btn {
  margin-top: auto;
  align-self: center;
  display: block;
  width: 50%;
  height: 28px;
  border: 0;
  border-radius: 3px;
  background: linear-gradient(180deg, #d0a05a 0%, #bb8945 100%);
  color: #f8f2e7;
  font-size: 0.67rem;
  font-weight: 700;
  letter-spacing: 0.14em;
  cursor: pointer;
  box-sizing: border-box;
}

.le-card-btn:hover {
  filter: brightness(1.04);
}

@media (max-width: 1200px) {
  .le-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .nav {
    display: none;
  }

  .hrule {
    width: 70px;
  }
}

@media (max-width: 720px) {
  .le-grid {
    display: flex;
    grid-template-columns: unset;
    overflow-x: auto;
    overflow-y: visible;
    scroll-snap-type: x mandatory;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none;
    -ms-overflow-style: none;
    gap: 0.75rem;
    padding-bottom: 0.25rem;
    margin: 0 -1.2rem;
    padding-left: 1.2rem;
    padding-right: 1.2rem;
  }

  .le-grid::-webkit-scrollbar {
    display: none;
  }

  .le-card {
    flex: 0 0 86%;
    scroll-snap-align: center;
    min-height: 0;
  }

  /* ── Carousel arrows ── */
  .le-arrow {
    display: flex;
    align-items: center;
    justify-content: center;
    position: absolute;
    top: 38%;
    transform: translateY(-50%);
    width: 36px;
    height: 36px;
    border-radius: 50%;
    border: 1px solid rgba(199, 154, 92, 0.45);
    background: rgba(4, 16, 31, 0.75);
    color: #c79a5c;
    cursor: pointer;
    z-index: 5;
    padding: 0;
    backdrop-filter: blur(4px);
    transition: background 0.25s ease, border-color 0.25s ease, transform 0.25s ease;
  }

  .le-arrow:active {
    transform: translateY(-50%) scale(0.92);
  }

  .le-arrow:hover {
    background: rgba(199, 154, 92, 0.18);
    border-color: #c79a5c;
  }

  .le-arrow--prev {
    left: 0.35rem;
  }

  .le-arrow--next {
    right: 0.35rem;
  }

  /* ── Dot indicators ── */
  .carousel-dots {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 8px;
    margin-top: 14px;
  }

  .dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    border: none;
    padding: 0;
    background: rgba(199, 154, 92, 0.3);
    cursor: pointer;
    transition: background 0.3s ease, transform 0.3s ease;
  }

  .dot.active {
    background: #c79a5c;
    transform: scale(1.25);
  }

  .le-topbar {
    padding: 0 0.9rem;
    height: 70px;
  }

  .le-hero {
    padding-top: 1.6rem;
  }

  .brand-name {
    font-size: 0.95rem;
  }

  .brand-sub {
    letter-spacing: 0.18em;
  }
}
</style>
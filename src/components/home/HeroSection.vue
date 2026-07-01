<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useComponentCMS } from '@/composables/useComponentCMS'
import NoImagePlaceholder from '@/components/NoImagePlaceholder.vue'
import ToursSection from '../home/ToursSection.vue'

const cms = useComponentCMS('HeroSection')
const specialtyCms = useComponentCMS('SpecialtyExpeditionsSection')
const router = useRouter()

const videos = computed(() =>
  cms.getSection('heroVideos').map((item) => ({
    videoUrl: item.imageUrl || '',
    alt: item.alt || '',
    hasVideo: !!item.imageUrl,
  }))
)

const limitedBannerImage = computed(() => specialtyCms.getSlot('specialtyCards', 1)?.imageUrl || '')

// Toggle state
const showTours = ref(true)

// Book a Call state
const isCalendlyLoaded = ref(false)
const isCalendlyOpen = ref(false)
const isPulsing = ref(true)

const stopPulse = () => {
  isPulsing.value = false
}

const loadCalendly = () => {
  if (document.getElementById('calendly-script')) {
    isCalendlyLoaded.value = true
    return
  }
  const link = document.createElement('link')
  link.rel = 'stylesheet'
  link.href = 'https://assets.calendly.com/assets/external/widget.css'
  document.head.appendChild(link)

  const script = document.createElement('script')
  script.id = 'calendly-script'
  script.src = 'https://assets.calendly.com/assets/external/widget.js'
  script.async = true
  script.onload = () => {
    isCalendlyLoaded.value = true
  }
  document.head.appendChild(script)
}

const openCalendly = () => {
  stopPulse()
  isCalendlyOpen.value = true
  if (!isCalendlyLoaded.value) {
    loadCalendly()
    const interval = setInterval(() => {
      if ((window as any).Calendly) {
        clearInterval(interval)
        launchPopup()
      }
    }, 100)
  } else {
    launchPopup()
  }
}

const launchPopup = () => {
  ;(window as any).Calendly?.initPopupWidget({
    url: 'https://calendly.com/expeditiondrenched/talk-to-an-adventure-partner',
  })
}

const handleCalendlyClose = (e: MessageEvent) => {
  if (e.data?.event === 'calendly.event_type_viewed' || e.data?.event === 'calendly.popup_closed') {
    isCalendlyOpen.value = false
  }
}

const currentVideoIndex = ref(0)
const isTransitioning = ref(false)
const videoLoaded = ref(false)
const isPlaying = ref(true)
const isMobile = ref(false)
const touchStartX = ref(0)
const touchEndX = ref(0)
const videoError = ref(false)
const isBuffering = ref(false)
const videoRef = ref<HTMLVideoElement | null>(null)
const showControls = ref(false)
const controlsTimeout = ref<number | null>(null)

let resizeObserver: ResizeObserver | null = null
let playAttemptInterval: number | null = null
let transitionTimeout: number | null = null

onMounted(async () => {
  await cms.load()
  await specialtyCms.load()
  checkMobile()

  resizeObserver = new ResizeObserver(() => { checkMobile() })
  resizeObserver.observe(document.body)

  if (videoRef.value && videos.value[0]?.hasVideo) {
    videoRef.value.src = videos.value[0].videoUrl
    videoRef.value.load()
    if (isMobile.value) {
      isPlaying.value = false
      videoRef.value.pause()
    } else {
      forcePlay()
    }
  }

  document.addEventListener('visibilitychange', handleVisibilityChange)

  playAttemptInterval = window.setInterval(() => {
    if (!isMobile.value && isPlaying.value && videoRef.value?.paused && !videoRef.value?.ended && !isTransitioning.value) {
      forcePlay()
    }
  }, 3000)

  // Load Calendly
  loadCalendly()
  window.addEventListener('message', handleCalendlyClose)
  setTimeout(() => { isPulsing.value = false }, 6000)
})

onUnmounted(() => {
  if (transitionTimeout) clearTimeout(transitionTimeout)
  if (controlsTimeout.value) clearTimeout(controlsTimeout.value)
  if (resizeObserver) resizeObserver.disconnect()
  if (playAttemptInterval) clearInterval(playAttemptInterval)
  window.removeEventListener('message', handleCalendlyClose)
})

const checkMobile = () => { isMobile.value = window.innerWidth < 768 }

const currentVideoUrl = computed(() => videos.value[currentVideoIndex.value]?.videoUrl || '')
const nextVideoIndex = computed(() => (currentVideoIndex.value + 1) % videos.value.length)
const hasMultipleVideos = computed(() => videos.value.length > 1)

const preloadVideo = (url: string) => {
  const video = document.createElement('video')
  video.src = url
  video.preload = 'auto'
  video.muted = true
  video.load()
}

const forcePlay = async () => {
  if (!videoRef.value) return
  try {
    videoRef.value.muted = true
    await videoRef.value.play()
    isPlaying.value = true
    videoError.value = false
    isBuffering.value = false
  } catch (err) {
    isPlaying.value = false
  }
}

const switchVideo = (newIndex: number) => {
  if (isTransitioning.value || newIndex === currentVideoIndex.value || !videoRef.value || !videos.value[newIndex]?.hasVideo) return
  isTransitioning.value = true
  isBuffering.value = true
  videoRef.value.style.opacity = '0.3'

  transitionTimeout = window.setTimeout(() => {
    currentVideoIndex.value = newIndex
    videoRef.value!.src = videos.value[newIndex].videoUrl
    videoRef.value!.load()

    const onCanPlay = () => {
      videoRef.value!.removeEventListener('canplaythrough', onCanPlay)
      videoRef.value!.style.opacity = '1'

      if (isMobile.value && !isPlaying.value) {
        videoRef.value!.pause()
        isTransitioning.value = false
        isBuffering.value = false
      } else {
        forcePlay()
        isTransitioning.value = false
        isBuffering.value = false
      }

      if (videos.value[nextVideoIndex.value]?.hasVideo) preloadVideo(videos.value[nextVideoIndex.value].videoUrl)
    }

    videoRef.value!.addEventListener('canplaythrough', onCanPlay)
    setTimeout(() => { if (isTransitioning.value) onCanPlay() }, 3000)
  }, 300)
}

const nextVideo = () => switchVideo(nextVideoIndex.value)
const prevVideoIndex = computed(() => (currentVideoIndex.value - 1 + videos.value.length) % videos.value.length)
const prevVideo = () => switchVideo(prevVideoIndex.value)
const goToSlide = (i: number) => switchVideo(i)

const togglePlayPause = () => {
  isPlaying.value = !isPlaying.value
  if (isPlaying.value) {
    forcePlay()
  } else {
    videoRef.value?.pause()
  }
}

const handleVideoClick = () => {
  togglePlayPause()
  showControls.value = true
  if (controlsTimeout.value) clearTimeout(controlsTimeout.value)
  controlsTimeout.value = window.setTimeout(() => {
    showControls.value = false
  }, 2000)
}

const handleVideoEnded = () => {
  if (hasMultipleVideos.value) {
    nextVideo()
  } else if (videoRef.value) {
    videoRef.value.currentTime = 0
    forcePlay()
  }
}

const onTouchStart = (e: TouchEvent) => { touchStartX.value = e.changedTouches[0].screenX }
const onTouchEnd = (e: TouchEvent) => {
  touchEndX.value = e.changedTouches[0].screenX
  const diff = touchStartX.value - touchEndX.value
  if (Math.abs(diff) > 50) {
    if (diff > 0) nextVideo()
    else prevVideo()
  }
}

const onVideoLoaded = () => { videoLoaded.value = true; if (videoRef.value) videoRef.value.style.opacity = '1' }
const onVideoError = () => { videoError.value = true; setTimeout(() => { if (videoError.value && hasMultipleVideos.value) nextVideo() }, 2000) }
const handleVisibilityChange = () => { if (!document.hidden && isPlaying.value && !isMobile.value) forcePlay() }
</script>

<template>
  <section class="hero-section">
    <!-- Video Background -->
    <div class="hero-bg" @click="handleVideoClick" @touchstart="onTouchStart" @touchend="onTouchEnd">
      <div class="video-container">
        <video
          v-if="videos[0]?.hasVideo"
          ref="videoRef"
          muted
          loop
          playsinline
          preload="auto"
          :class="['video-hero', { 'video-fade-in': videoLoaded, 'is-buffering': isBuffering }]"
          @loadeddata="onVideoLoaded"
          @ended="handleVideoEnded"
          @error="onVideoError"
          @waiting="isBuffering = true"
          @playing="isBuffering = false"
        >
          <source :src="currentVideoUrl" type="video/mp4">
        </video>
        <div v-else class="w-full h-full">
          <NoImagePlaceholder label="No Hero Video" class="w-full h-full" />
        </div>
        <div v-if="isBuffering" class="buffering-indicator">
          <div class="buffering-spinner"></div>
        </div>
      </div>
      <div class="overlay-dark"></div>
      <div class="overlay-gradient"></div>

      <!-- Play/Pause overlay on click -->
      <div class="video-click-overlay" :class="{ 'show-controls': showControls }">
        <button class="video-control-btn" :aria-label="isPlaying ? 'Pause' : 'Play'">
          <svg v-if="!isPlaying" width="32" height="32" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
          <svg v-else width="32" height="32" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
        </button>
      </div>

      <!-- Carousel arrows (only when more than one slide) -->
      <template v-if="hasMultipleVideos">
        <button class="carousel-arrow carousel-arrow--prev" @click.stop="prevVideo" aria-label="Previous slide">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 18l-6-6 6-6"/></svg>
        </button>
        <button class="carousel-arrow carousel-arrow--next" @click.stop="nextVideo" aria-label="Next slide">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg>
        </button>

        <!-- Dot indicators -->
        <div class="carousel-dots" role="tablist" aria-label="Hero slides">
          <button
            v-for="(v, i) in videos"
            :key="i"
            class="carousel-dot"
            :class="{ 'carousel-dot--active': i === currentVideoIndex }"
            :aria-label="`Go to slide ${i + 1}`"
            :aria-selected="i === currentVideoIndex"
            role="tab"
            @click.stop="goToSlide(i)"
          ></button>
        </div>
      </template>
    </div>

    <!-- Hero Content -->
    <div class="hero-content">
      <!-- Headline always visible -->
      <div class="headline-block">
        <h1 class="headline-main">
          <span class="block">WAKE UP ON THE</span>
          <span class="block">WORLD'S GREATEST REEF.</span>
        </h1>
        <div class="headline-rule">
          <span class="rule-line"></span>
          <svg width="18" height="18" viewBox="0 0 200 200">
            <circle cx="100" cy="100" r="78" fill="none" stroke="#C9A84C" stroke-width="1.5" opacity="0.7"/>
            <polygon points="100,28 108,100 100,113 92,100" fill="#C9A84C"/>
            <polygon points="100,172 108,100 100,87 92,100" fill="#C9A84C"/>
            <polygon points="28,100 100,92 113,100 100,108" fill="#C9A84C"/>
            <polygon points="172,100 100,92 87,100 100,108" fill="#C9A84C"/>
            <circle cx="100" cy="100" r="9" fill="#C9A84C"/>
          </svg>
          <span class="rule-line"></span>
        </div>
        <p class="headline-sub">
          <span class="headline-sub-line">Small-group expeditions exploring the Ningaloo Reef</span>
          <span class="headline-sub-line">by sail. Remote, wild and unforgettable.</span>
        </p>
      </div>

      <!-- Tours Section with transition -->
      <Transition name="tours-slide">
        <div v-if="showTours" class="tours-wrapper">
          <ToursSection />
        </div>
      </Transition>

      <!-- Limited Banner with transition -->
      <Transition name="tours-slide">
        <div v-if="showTours" class="limited-banner">
          <div class="banner-text">
            <div class="banner-rule">
              <span class="rule-line"></span>
              <svg class="banner-compass" width="20" height="20" viewBox="0 0 200 200">
                <circle cx="100" cy="100" r="78" fill="none" stroke="#C9A84C" stroke-width="1.5" opacity="0.85"/>
                <polygon points="100,28 108,100 100,113 92,100" fill="#C9A84C"/>
                <polygon points="100,172 108,100 100,87 92,100" fill="#C9A84C"/>
                <polygon points="28,100 100,92 113,100 100,108" fill="#C9A84C"/>
                <polygon points="172,100 100,92 87,100 100,108" fill="#C9A84C"/>
                <circle cx="100" cy="100" r="9" fill="#C9A84C"/>
              </svg>
              <span class="rule-line"></span>
            </div>

            <h3 class="banner-heading">LOOKING FOR SOMETHING DIFFERENT?</h3>
            <p class="banner-sub">Selected dates are reserved for limited, hosted and specialty expeditions throughout the season.</p>

            <button class="btn-banner" @click.stop="router.push('/limited-expeditions')">
              VIEW LIMITED EXPEDITIONS
            </button>
          </div>

          <div class="banner-img-panel">
            <img
              v-if="limitedBannerImage"
              :src="limitedBannerImage"
              alt="Surfer riding a secluded wave at Ningaloo Reef"
              class="banner-img"
            />
            <NoImagePlaceholder v-else dark class="absolute inset-0" />
          </div>
        </div>
      </Transition>
    </div>

    <!-- Bottom-right floating controls bar
         Teleported to <body> on purpose: this section (.hero-section) lives
         inside <main class="main-content"> in App.vue, which is
         `position: relative; z-index: 2` — i.e. its own stacking context.
         A z-index set from inside that context can never beat elements
         OUTSIDE it (e.g. the "scroll to top" button, z-index: 200, which is
         a sibling of main-content and only appears once you scroll into the
         page). Teleporting makes this bar a direct child of <body>, so its
         z-index is compared at the true top level and always wins. -->
    <Teleport to="body">
      <div class="bottom-right-bar">
        <!-- Hide/Show Tours button -->
        <button 
          @click.stop="showTours = !showTours" 
          class="bar-btn bar-btn-text"
          :aria-label="showTours ? 'Hide tours' : 'Show tours'"
        >
          <span class="bar-icon">
            <svg v-if="showTours" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <path d="M18 15l-6-6-6 6"/>
            </svg>
            <svg v-else width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <path d="M6 9l6 6 6-6"/>
            </svg>
          </span>
          <span class="bar-label">{{ showTours ? 'HIDE TOURS' : 'SHOW TOURS' }}</span>
        </button>

        <span class="bar-divider"></span>

        <!-- Play/Pause -->
        <button 
          @click.stop="togglePlayPause" 
          class="bar-btn"
          :aria-label="isPlaying ? 'Pause' : 'Play'"
        >
          <svg v-if="!isPlaying" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
          <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
        </button>

        <!-- Next (if multiple videos) -->
        <button 
          @click.stop="nextVideo" 
          v-if="hasMultipleVideos"
          class="bar-btn"
          aria-label="Next video"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M4 4v16l14-8z"/></svg>
        </button>

        <!-- Book a Call - ONLY shows when tours are hidden (video is visible) -->
        <Transition name="bac-fade">
          <button 
            @click.stop="openCalendly"
            class="bar-btn bar-btn-gold"
            :class="{ 'bac-pulse': isPulsing }"
            aria-label="Book a call with an adventure partner"
          >
            <span class="bar-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.62 3.4 2 2 0 0 1 3.6 1.22h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.77a16 16 0 0 0 6.29 6.29l.93-.93a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
              </svg>
            </span>
            <span class="bar-label">Book a Call</span>
          </button>
        </Transition>
      </div>
    </Teleport>
  </section>
</template>

<style scoped>
.hero-section {
  position: relative;
  width: 100%;
  min-height: 100dvh;
  background: #071a2b;
  overflow: hidden;
}

.hero-bg {
  position: absolute;
  inset: 0;
  z-index: 0;
  cursor: pointer;
}

.video-container {
  position: relative;
  width: 100%;
  height: 100%;
}

.video-hero {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  transition: opacity 1.2s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  will-change: opacity, transform;
}

.video-fade-in {
  opacity: 1;
  animation: slowZoom 20s ease-out forwards;
}

.video-hero.is-buffering { opacity: 0.5; }

@keyframes slowZoom {
  0%   { transform: scale(1) translate3d(0,0,0); }
  100% { transform: scale(1.10) translate3d(0, -3%, 0); }
}

.overlay-dark {
  position: absolute;
  inset: 0;
  background: rgba(7, 26, 43, 0.55);
  pointer-events: none;
}

.overlay-gradient {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    to bottom,
    rgba(7,26,43,0.35) 0%,
    rgba(7,26,43,0.15) 30%,
    rgba(7,26,43,0.55) 70%,
    rgba(7,26,43,0.85) 100%
  );
  pointer-events: none;
}

/* Click overlay for play/pause feedback */
.video-click-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 25;
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.video-click-overlay.show-controls {
  opacity: 1;
}

.video-control-btn {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: rgba(255,255,255,0.12);
  backdrop-filter: blur(12px);
  border: 2px solid rgba(255,255,255,0.6);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  animation: controlPop 0.3s ease;
}

@keyframes controlPop {
  0% { transform: scale(0.8); opacity: 0; }
  50% { transform: scale(1.1); }
  100% { transform: scale(1); opacity: 1; }
}

.buffering-indicator {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 5;
  pointer-events: none;
}

.buffering-spinner {
  width: 40px;
  height: 40px;
  border: 2px solid rgba(201,168,76,0.3);
  border-top-color: #C9A84C;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin { to { transform: rotate(360deg); } }

/* ─── Carousel controls ─── */
.carousel-arrow {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  z-index: 20;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: rgba(7, 26, 43, 0.45);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(201, 168, 76, 0.4);
  color: #C9A84C;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.25s ease, transform 0.25s ease, border-color 0.25s ease;
}

.carousel-arrow:hover {
  background: rgba(201, 168, 76, 0.25);
  border-color: rgba(201, 168, 76, 0.8);
}

.carousel-arrow--prev { left: 1.25rem; }
.carousel-arrow--next { right: 1.25rem; }

.carousel-arrow--prev:hover { transform: translateY(-50%) translateX(-3px); }
.carousel-arrow--next:hover { transform: translateY(-50%) translateX(3px); }

.carousel-dots {
  position: absolute;
  top: 1.5rem;
  left: 50%;
  transform: translateX(-50%);
  z-index: 20;
  display: flex;
  gap: 0.5rem;
}

.carousel-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: rgba(248, 245, 239, 0.35);
  border: none;
  cursor: pointer;
  padding: 0;
  transition: background 0.3s ease, transform 0.3s ease, width 0.3s ease;
}

.carousel-dot--active {
  background: #C9A84C;
  width: 22px;
  border-radius: 4px;
}

@media (max-width: 767px) {
  .carousel-arrow {
    width: 38px;
    height: 38px;
  }
  .carousel-arrow--prev { left: 0.6rem; }
  .carousel-arrow--next { right: 0.6rem; }
  .carousel-dots {
    top: calc(92px + 0.75rem); /* clear the mobile navbar */
  }
}

@media (prefers-reduced-motion: reduce) {
  .carousel-arrow,
  .carousel-dot {
    transition: none;
  }
}

/* Tours slide transition */
.tours-slide-enter-active,
.tours-slide-leave-active {
  transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
  max-height: 2000px;
  opacity: 1;
  overflow: hidden;
}

.tours-slide-enter-from,
.tours-slide-leave-to {
  max-height: 0;
  opacity: 0;
  margin: 0;
  padding: 0;
}

/* Bottom-right bar: HIDE TOURS + PLAY + NEXT + BOOK A CALL */
.bottom-right-bar {
  position: fixed;
  bottom: 1.5rem;
  right: 1.5rem;
  /* Highest interactive layer on the site — deliberately above the
     decorative gold-compass cursor trail (z-index: 10000, pointer-events:
     none) and everything else, now that this is teleported to <body> and
     no longer trapped in main-content's stacking context. */
  z-index: 10500;
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.4rem 0.6rem;
  background: rgba(7, 26, 43, 0.85);
  backdrop-filter: blur(16px);
  border: 1px solid rgba(201, 168, 76, 0.35);
  border-radius: 100px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
}

.bar-btn {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: transparent;
  border: none;
  color: #C9A84C;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.25s ease;
  flex-shrink: 0;
}

.bar-btn:hover {
  background: rgba(201, 168, 76, 0.15);
  transform: scale(1.1);
}

.bar-btn-text {
  width: auto;
  padding: 0 0.8rem 0 0.5rem;
  border-radius: 100px;
  gap: 0.4rem;
  display: flex;
  align-items: center;
  border: 1px solid transparent;
  transition: all 0.25s ease;
}

.bar-btn-text:hover {
  border-color: rgba(201, 168, 76, 0.4);
  background: rgba(201, 168, 76, 0.1);
}

.bar-btn-text .bar-icon svg {
  transition: transform 0.3s cubic-bezier(0.22, 1, 0.36, 1);
}

.bar-icon {
  display: flex;
  align-items: center;
  color: #C9A84C;
}

.bar-label {
  font-size: 0.6rem;
  font-weight: 700;
  letter-spacing: 0.14em;
  color: rgba(248, 245, 239, 0.85);
  white-space: nowrap;
}

.bar-divider {
  width: 1px;
  height: 20px;
  background: rgba(201, 168, 76, 0.25);
  margin: 0 0.2rem;
}

/* Book a Call gold button */
.bar-btn-gold {
  width: auto;
  padding: 0 1rem 0 0.7rem;
  border-radius: 100px;
  gap: 0.4rem;
  background: #c9a84c;
  color: #071a2b;
  display: flex;
  align-items: center;
  box-shadow: 0 2px 12px rgba(201, 168, 76, 0.4);
}

.bar-btn-gold:hover {
  background: #e8c05a;
  transform: translateY(-2px) scale(1.03);
  box-shadow: 0 4px 20px rgba(201, 168, 76, 0.55);
}

.bar-btn-gold .bar-icon {
  color: #071a2b;
}

.bar-btn-gold .bar-label {
  color: #071a2b;
  font-weight: 700;
}

/* Book a Call pulse animation */
@keyframes bac-pulse-ring {
  0%   { box-shadow: 0 0 0 0 rgba(201, 168, 76, 0.55), 0 2px 12px rgba(201, 168, 76, 0.4); }
  70%  { box-shadow: 0 0 0 10px rgba(201, 168, 76, 0), 0 2px 12px rgba(201, 168, 76, 0.4); }
  100% { box-shadow: 0 0 0 0 rgba(201, 168, 76, 0), 0 2px 12px rgba(201, 168, 76, 0.4); }
}

.bac-pulse {
  animation: bac-pulse-ring 1.8s ease-out infinite;
}

/* Book a Call transition */
.bac-fade-enter-active,
.bac-fade-leave-active {
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.bac-fade-enter-from,
.bac-fade-leave-to {
  opacity: 0;
  transform: scale(0.8) translateX(10px);
  width: 0;
  padding: 0;
  overflow: hidden;
}

.hero-content {
  position: relative;
  z-index: 10;
  display: flex;
  flex-direction: column;
  padding: 0 1.5rem 2rem;
  pointer-events: none;
}

.hero-content > * {
  pointer-events: auto;
}

.headline-block {
  padding: 7rem 0 2.5rem;
  max-width: 700px;
}

.headline-main {
  font-family: var(--font-display);
  font-size: clamp(1.8rem, 5vw, 4rem);
  font-weight: 500;
  color: #f8f5ef;
  line-height: 1.1;
  letter-spacing: 0.02em;
  margin-bottom: 1.25rem;
}

.headline-main .block {
  display: block;
  white-space: nowrap;
}

.headline-rule {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
  max-width: 260px;
}

.rule-line {
  flex: 1;
  height: 1px;
  background: rgba(201,168,76,0.5);
}

.headline-sub {
  color: rgba(248,245,239,0.75);
  font-size: 0.95rem;
  line-height: 1.65;
  max-width: 380px;
}

.headline-sub-line {
  display: block;
  white-space: nowrap;
}

@media (max-width: 420px) {
  .headline-sub-line {
    white-space: normal;
  }
}

.limited-banner {
  position: relative;
  display: grid;
  grid-template-columns: 1.05fr 1.45fr;
  align-items: center;
  min-height: 165px;
  background: linear-gradient(90deg, rgba(5, 20, 38, 0.98) 0%, rgba(5, 20, 38, 0.92) 42%, rgba(5, 20, 38, 0.08) 100%);
  border: 1px solid rgba(201, 168, 76, 0.55);
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 0 0 1px rgba(201, 168, 76, 0.12) inset;
}

.banner-text {
  position: relative;
  z-index: 2;
  padding: 1.4rem 1.8rem 1.4rem 2rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 0.55rem;
}

.banner-rule {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  width: 100%;
  justify-content: center;
  margin-bottom: 0.1rem;
}

.banner-compass {
  flex: 0 0 auto;
  opacity: 0.95;
}

.banner-heading {
  font-family: var(--font-display);
  font-size: clamp(1.05rem, 1.8vw, 1.5rem);
  font-weight: 500;
  color: #f8f5ef;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  line-height: 1.15;
  margin: 0;
}

.banner-sub {
  color: rgba(248, 245, 239, 0.78);
  font-size: 0.82rem;
  line-height: 1.45;
  margin: 0;
  max-width: 440px;
}

.btn-banner {
  height: 38px;
  padding: 0 1.65rem;
  background: #c9a84c;
  color: #071a2b;
  border: none;
  font-size: 0.62rem;
  font-weight: 700;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  cursor: pointer;
  border-radius: 2px;
  transition: background 0.3s ease, transform 0.3s ease;
  margin-top: 0.2rem;
}

.btn-banner:hover {
  background: #d7b461;
  transform: translateY(-2px);
}

.banner-img-panel {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 165px;
  overflow: hidden;
}

.banner-img-panel::before {
  content: '';
  position: absolute;
  inset: 0;
  z-index: 1;
  background: linear-gradient(90deg, rgba(5, 20, 38, 0.08) 0%, rgba(5, 20, 38, 0) 35%, rgba(5, 20, 38, 0.15) 100%);
  pointer-events: none;
}

.banner-img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  object-position: center center;
}

.banner-img {
  mask-image: linear-gradient(to right, transparent 0%, rgba(0,0,0,0.5) 18%, #000 45%);
  -webkit-mask-image: linear-gradient(to right, transparent 0%, rgba(0,0,0,0.5) 18%, #000 45%);
}

.banner-img-panel::before {
  background: linear-gradient(90deg, rgba(5,20,38,0.35) 0%, rgba(5,20,38,0.1) 30%, rgba(5,20,38,0) 55%);
}

@media (max-width: 680px) {
  .hero-content {
    padding: 0 1rem 1.5rem;
  }

  .headline-block {
    padding: 5rem 0 1.75rem;
  }

  .headline-main {
    font-size: clamp(1.3rem, 6.5vw, 2.4rem);
  }

  .limited-banner {
    min-height: 150px;
    grid-template-columns: 1fr;
  }

  .banner-text {
    padding: 1.25rem 1.25rem;
  }

  .banner-img-panel {
    min-height: 180px;
    order: -1;
  }

  .bottom-right-bar {
    bottom: 1rem;
    right: 1rem;
    padding: 0.3rem 0.5rem;
  }

  .bar-btn {
    width: 36px;
    height: 36px;
  }

  .bar-btn-text {
    padding: 0 0.6rem 0 0.4rem;
  }

  .bar-label {
    font-size: 0.55rem;
  }

  .bar-btn-gold {
    padding: 0 0.8rem 0 0.5rem;
  }
}

@media (max-width: 767px) {
  .video-fade-in {
    animation: none !important;
    transform: none !important;
  }
}

@media (max-width: 767px) {
  .bar-btn-gold {
    width: 40px;
    padding: 0;
    justify-content: center;
  }

  .bar-btn-gold .bar-label {
    display: none;
  }
}

@media (max-width: 420px) {
  .bottom-right-bar {
    gap: 0.2rem;
    padding: 0.3rem 0.4rem;
  }

  .bar-btn-text {
    padding: 0 0.55rem 0 0.45rem;
    gap: 0.3rem;
  }

  .bar-label {
    font-size: 0.5rem;
    letter-spacing: 0.1em;
  }
}
</style>
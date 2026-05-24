<script setup lang="ts">
  import { ref, computed, onMounted, onUnmounted } from 'vue'
  import { useRouter } from 'vue-router'
  import { useComponentCMS } from '@/composables/useComponentCMS'
  import NoImagePlaceholder from '@/components/NoImagePlaceholder.vue'

  const cms = useComponentCMS('HeroSection')
  const router = useRouter()

  const videos = computed(() =>
    cms.getSection('heroVideos').map((item) => ({
      videoUrl: item.imageUrl || '',
      alt: item.alt || '',
      hasVideo: !!item.imageUrl,
    }))
  )

  // Advanced video carousel state
  const currentVideoIndex = ref(0)
  const isTransitioning = ref(false)
  const videoLoaded = ref(false)
  const isPlaying = ref(true)
  const showControls = ref(false)
  const isHovering = ref(false)
  const isMobile = ref(false)
  const touchStartX = ref(0)
  const touchEndX = ref(0)
  const videoError = ref(false)
  const isBuffering = ref(false)
  const videoRef = ref<HTMLVideoElement | null>(null)
  const showCenterPlay = ref(false) // Controls visibility of center play button

  let resizeObserver: ResizeObserver | null = null
  let playAttemptInterval: number | null = null
  let transitionTimeout: number | null = null

  onMounted(async () => {
    await cms.load()
    checkMobile()

    resizeObserver = new ResizeObserver(() => {
      checkMobile()
    })
    resizeObserver.observe(document.body)

    // Initialize video
    if (videoRef.value && videos.value[0]?.hasVideo) {
      videoRef.value.src = videos.value[0].videoUrl
      videoRef.value.load()
      forcePlay()
    }

    // Show controls briefly
    showControls.value = true
    setTimeout(() => {
      if (!isHovering.value) showControls.value = false
    }, 4000)

    document.addEventListener('visibilitychange', handleVisibilityChange)

    // Periodic play check for mobile
    playAttemptInterval = window.setInterval(() => {
      if (isPlaying.value && videoRef.value?.paused && !videoRef.value?.ended && !isTransitioning.value) {
        forcePlay()
      }
    }, 3000)
  })

  onUnmounted(() => {
    if (transitionTimeout) clearTimeout(transitionTimeout)
    if (resizeObserver) resizeObserver.disconnect()
    if (playAttemptInterval) clearInterval(playAttemptInterval)
    document.removeEventListener('visibilitychange', handleVisibilityChange)
  })

  // Mobile detection
  const checkMobile = () => {
    isMobile.value = window.innerWidth < 768
  }

  // Computed video properties
  const currentVideoUrl = computed(() => videos.value[currentVideoIndex.value]?.videoUrl || '')
  const nextVideoIndex = computed(() => (currentVideoIndex.value + 1) % videos.value.length)
  const prevVideoIndex = computed(() => currentVideoIndex.value === 0 ? videos.value.length - 1 : currentVideoIndex.value - 1)
  const hasMultipleVideos = computed(() => videos.value.length > 1)

  // Preload video
  const preloadVideo = (url: string) => {
    const video = document.createElement('video')
    video.src = url
    video.preload = 'auto'
    video.muted = true
    video.load()
  }

  // Force play with error handling
  const forcePlay = async () => {
    if (!videoRef.value) return

    try {
      videoRef.value.muted = true
      await videoRef.value.play()
      isPlaying.value = true
      videoError.value = false
      isBuffering.value = false
      showCenterPlay.value = false // Hide center play when playing
    } catch (err) {
      console.warn('Playback failed:', err)
      isPlaying.value = false
      showCenterPlay.value = true // Show center play when paused
    }
  }

  // Smooth video transition
  const switchVideo = (newIndex: number) => {
    if (isTransitioning.value || newIndex === currentVideoIndex.value || !videoRef.value || !videos.value[newIndex]?.hasVideo) return

    isTransitioning.value = true
    isBuffering.value = true

    // Fade out current
    videoRef.value.style.opacity = '0.3'

    transitionTimeout = window.setTimeout(() => {
      // Update index
      currentVideoIndex.value = newIndex

      // Set new source
      videoRef.value!.src = videos.value[newIndex].videoUrl
      videoRef.value!.load()

      const onCanPlay = () => {
        videoRef.value!.removeEventListener('canplaythrough', onCanPlay)
        videoRef.value!.style.opacity = '1'
        forcePlay()
        isTransitioning.value = false
        isBuffering.value = false

        // Preload next video
        if (videos.value[nextVideoIndex.value]?.hasVideo) {
          preloadVideo(videos.value[nextVideoIndex.value].videoUrl)
        }
      }

      videoRef.value!.addEventListener('canplaythrough', onCanPlay)
      setTimeout(() => {
        if (isTransitioning.value) {
          onCanPlay()
        }
      }, 3000)

    }, 300)
  }

  const nextVideo = () => switchVideo(nextVideoIndex.value)
  const prevVideo = () => switchVideo(prevVideoIndex.value)
  const goToVideo = (index: number) => switchVideo(index)

  const togglePlayPause = () => {
    isPlaying.value = !isPlaying.value
    if (isPlaying.value) {
      forcePlay()
    } else {
      videoRef.value?.pause()
      showCenterPlay.value = true
    }
  }

  const handleCenterPlayClick = () => {
    togglePlayPause()
  }

  const handleVideoEnded = () => {
    if (hasMultipleVideos.value) {
      nextVideo()
    } else if (videoRef.value) {
      videoRef.value.currentTime = 0
      forcePlay()
    }
  }

  // Touch handlers for mobile swipe
  const onTouchStart = (e: TouchEvent) => {
    touchStartX.value = e.changedTouches[0].screenX
  }

  const onTouchEnd = (e: TouchEvent) => {
    touchEndX.value = e.changedTouches[0].screenX
    handleSwipe()
  }

  const handleSwipe = () => {
    const swipeThreshold = 50
    const diff = touchStartX.value - touchEndX.value

    if (Math.abs(diff) > swipeThreshold) {
      if (diff > 0) {
        nextVideo()
      } else {
        prevVideo()
      }
    }
  }

  // Hover handlers
  const onMouseEnter = () => {
    isHovering.value = true
    showControls.value = true
    if (!isPlaying.value) {
      showCenterPlay.value = true
    }
  }

  const onMouseLeave = () => {
    isHovering.value = false
    setTimeout(() => {
      if (!isHovering.value) {
        showControls.value = false
        if (isPlaying.value) {
          showCenterPlay.value = false
        }
      }
    }, 2000)
  }

  const onVideoLoaded = () => {
    videoLoaded.value = true
    if (videoRef.value) {
      videoRef.value.style.opacity = '1'
    }
  }

  const onVideoError = () => {
    videoError.value = true
    setTimeout(() => {
      if (videoError.value && hasMultipleVideos.value) nextVideo()
    }, 2000)
  }

  const handleVisibilityChange = () => {
    if (!document.hidden && isPlaying.value) {
      forcePlay()
    }
  }
</script>

<template>
  <section 
    class="relative h-screen w-full overflow-hidden hero-section"
    @mouseenter="onMouseEnter"
    @mouseleave="onMouseLeave"
    @touchstart="onTouchStart"
    @touchend="onTouchEnd"
  >
    <!-- Video Background with Carousel -->
    <div class="absolute inset-0 z-0">
      <div class="video-container">
        <video
          v-if="videos[0]?.hasVideo"
          ref="videoRef"
          autoplay
          muted
          loop
          playsinline
          preload="auto"
          class="w-full h-full object-cover video-hero"
          :class="{ 
            'video-fade-in': videoLoaded,
            'is-buffering': isBuffering
          }"
          @loadeddata="onVideoLoaded"
          @ended="handleVideoEnded"
          @error="onVideoError"
          @waiting="isBuffering = true"
          @playing="isBuffering = false; showCenterPlay = false"
          @pause="showCenterPlay = true"
        >
          <source :src="currentVideoUrl" type="video/mp4">
        </video>

        <!-- Fallback -->
        <div v-else class="w-full h-full">
          <NoImagePlaceholder label="No Hero Video" class="w-full h-full" />
        </div>

        <!-- Buffering Indicator -->
        <div v-if="isBuffering" class="buffering-indicator">
          <div class="buffering-spinner"></div>
        </div>
      </div>

      <!-- Overlays -->
      <div class="absolute inset-0 bg-[#0A2E4A]/60" />
      <div class="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/80" />
    </div>

    <!-- CENTER PLAY BUTTON -->
    <button
      v-if="videos[0]?.hasVideo && !isBuffering"
      @click="handleCenterPlayClick"
      class="center-play-button"
      :class="{ 'is-visible': showCenterPlay || !isPlaying }"
      :aria-label="isPlaying ? 'Pause video' : 'Play video'"
    >
      <div class="play-circle">
        <svg v-if="!isPlaying" width="28" height="28" viewBox="0 0 24 24" fill="currentColor" class="play-icon">
          <path d="M8 5v14l11-7z"/>
        </svg>
        <svg v-else width="24" height="24" viewBox="0 0 24 24" fill="currentColor" class="pause-icon">
          <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
        </svg>
      </div>
    </button>

    <!-- Play/Pause Toggle (Single video fallback - Bottom Right) -->
    <button
      v-else-if="videos[0]?.hasVideo"
      @click="togglePlayPause"
      class="absolute bottom-4 md:bottom-8 right-4 md:right-8 z-10 flex items-center justify-center w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white hover:bg-white/20 transition-all duration-300 group overflow-hidden aspect-square"
      :aria-label="isPlaying ? 'Pause video' : 'Play video'"
    >
      <svg v-if="isPlaying" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" class="w-5 h-5 block">
        <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
      </svg>
      <svg v-else width="20" height="20" viewBox="0 0 24 24" fill="currentColor" class="w-5 h-5 block ml-0.5">
        <path d="M8 5v14l11-7z" />
      </svg>
    </button>

    <!-- Center Content (Headline, Subtext & Buttons) -->
    <div class="relative z-20 h-full flex flex-col justify-end items-start px-6 sm:px-8 pb-24 md:pb-16">
      <div class="max-w-3xl">
        <!-- Headline -->
        <h1 class="font-display text-white text-4xl md:text-6xl font-light leading-tight tracking-wide">
          <span class="block">WAKE UP ON THE</span>
          <span class="block text-white-400 font-medium">WORLD'S GREATEST REEF.</span>
        </h1>
        <p class="text-gold-400 text-sm md:text-base font-heading tracking-widest uppercase leading-relaxed opacity-90 drop-shadow-md mt-4">
          <span class="block">All inclusive small group expeditions</span>
          <span class="block">exploring Ningaloo Reef by sail.</span>
        </p>
      </div>
      <div class="flex flex-col sm:flex-row gap-4 md:gap-6 mt-8">
        <router-link to="/expeditions" class="btn-hero-choose px-8 py-4 text-sm md:text-base tracking-widest font-medium uppercase text-center">
          Choose Your Adventure
        </router-link>
        <button @click="router.push('/contact')" class="btn-hero-book px-8 py-4 text-sm md:text-base tracking-widest font-medium uppercase text-center">
          Booking Enquiry
        </button>
      </div>
    </div>
  </section>
</template>

<style scoped>
:root {
  --color-gold-400: #C9A84C;
  --color-sand-100: #F8F5EF;
  --font-display: 'Playfair Display', serif; 
  --font-heading: 'Montserrat', sans-serif; 
}

.hero-section {
  min-height: 100dvh;
}

.video-container {
  position: relative;
  width: 100%;
  height: 100%;
}

.video-hero {
  transition: opacity 1.5s ease;
  will-change: transform, opacity;
}

.video-fade-in {
  opacity: 1;
  animation: slowZoom 20s ease-out forwards;
}

.video-hero.is-buffering {
  opacity: 0.5;
}

@keyframes slowZoom {
  0% { transform: scale(1); }
  100% { transform: scale(1.08); }
}

/* CENTER PLAY BUTTON */
.center-play-button {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 25;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.4s ease;
}

.center-play-button.is-visible {
  opacity: 1;
  pointer-events: auto;
}

.hero-section:hover .center-play-button {
  opacity: 1;
  pointer-events: auto;
}

.play-circle {
  width: 72px;
  height: 72px;
  border-radius: 50% !important;
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(8px);
  border: 2px solid rgba(255, 255, 255, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  box-shadow: 0 4px 30px rgba(0, 0, 0, 0.3);
}

.center-play-button:hover .play-circle {
  background: rgba(255, 255, 255, 0.25);
  border-color: rgba(255, 255, 255, 0.95);
  transform: scale(1.08);
  box-shadow: 0 8px 40px rgba(0, 0, 0, 0.4);
}

.play-icon {
  color: white;
  margin-left: 4px;
}

.pause-icon {
  color: white;
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
  border: 2px solid rgba(201, 168, 76, 0.3);
  border-top-color: #C9A84C;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.text-gold-400 {
  color: var(--color-gold-400);
}

/* Hero Buttons */
.btn-hero-choose {
  background-color: transparent;
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.6);
  border-radius: 4px;
  transition: all 0.3s ease;
  text-decoration: none;
  display: inline-block;
  backdrop-filter: blur(4px);
}

.btn-hero-choose:hover {
  border-color: white;
  background-color: rgba(255, 255, 255, 0.1);
  transform: translateY(-2px);
}

.btn-hero-book {
  background-color: var(--color-gold-400);
  color: #0A2E4A;
  border: 1px solid var(--color-gold-400);
  border-radius: 4px;
  transition: all 0.3s ease;
  display: inline-block;
  box-shadow: 0 4px 15px rgba(201, 168, 76, 0.3);
}

.btn-hero-book:hover {
  background-color: #dbb86a;
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(201, 168, 76, 0.4);
}

@media (max-width: 767px) {
  .play-circle {
    width: 56px;
    height: 56px;
  }
  .play-icon {
    width: 22px;
    height: 22px;
    margin-left: 2px;
  }
  .pause-icon {
    width: 20px;
    height: 20px;
  }
}
</style>
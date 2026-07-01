<script setup lang="ts">
/**
 * PageHero — full-bleed hero section used by sub-pages.
 *
 * Props
 *   componentName  – CMS component key (e.g. "OceanSafariView")
 *   section        – CMS section key (default "hero")
 *   slot           – which slotIndex carries the hero image (default 0)
 *   fallbackImage  – URL to show when CMS has no image yet
 *   tag / title / titleItalic / subtitle / height — presentational
 *
 * CMS contract
 *   Every page has its own componentName so images are fully isolated.
 *   The hero image slot (slot 0) and optional poster/secondary (slot 1)
 *   are read independently via getSlot().
 *
 * Parallax
 *   The <img> element moves at 0.25× scroll speed using a rAF loop,
 *   giving a smooth 3-D depth effect with no layout jank.
 *   On mobile (<768 px) the effect is disabled for performance.
 */
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useComponentCMS } from '@/composables/useComponentCMS'
import NoImagePlaceholder from '@/components/NoImagePlaceholder.vue'

const props = withDefaults(defineProps<{
  /** Unique CMS component key for this page — keeps image slots isolated */
  componentName?: string
  /** CMS section within that component */
  cmsSection?: string
  /** Which slot index is the hero image */
  cmsSlot?: number
  /** Shown while CMS loads or when no image is uploaded */
  fallbackImage?: string
  fallbackAlt?: string
  tag?: string
  title: string
  titleItalic?: string
  subtitle?: string
  height?: string
}>(), {
  cmsSection: 'hero',
  cmsSlot: 0,
  height: '65vh',
})

// ── CMS ──────────────────────────────────────────────────────────────────────
const cms = props.componentName ? useComponentCMS(props.componentName) : null

const heroImage = computed(() => {
  if (!cms) return props.fallbackImage || ''
  return cms.getImageUrl(props.cmsSection!, props.cmsSlot!) || props.fallbackImage || ''
})

const heroAlt = computed(() => {
  if (!cms) return props.fallbackAlt || ''
  return cms.getAlt(props.cmsSection!, props.cmsSlot!) || props.fallbackAlt || ''
})

const isIn = ref(false)

onMounted(async () => {
  if (cms) await cms.load()
  setupParallax()
  requestAnimationFrame(() => requestAnimationFrame(() => { isIn.value = true }))
})

onUnmounted(() => teardownParallax())

// ── Parallax ─────────────────────────────────────────────────────────────────
const sectionRef = ref<HTMLElement | null>(null)
const imgRef     = ref<HTMLElement | null>(null)
const SPEED = 0.28   // fraction of scroll delta applied to image
const CLAMP = 100    // max px shift in either direction

let rafId: number | null = null
let ticking = false
let isMobile = false

function applyParallax() {
  if (isMobile || !sectionRef.value || !imgRef.value) return

  const rect = sectionRef.value.getBoundingClientRect()
  const wh   = window.innerHeight

  // Skip if not in view at all
  if (rect.bottom < -80 || rect.top > wh + 80) return

  const centerY = rect.top + rect.height / 2
  const delta   = (centerY - wh / 2) * SPEED
  const clamped = Math.max(-CLAMP, Math.min(CLAMP, delta))

  imgRef.value.style.transform = `translate3d(0, ${clamped}px, 0) scale(1.12)`
}

function onScroll() {
  if (ticking) return
  ticking = true
  rafId = requestAnimationFrame(() => { applyParallax(); ticking = false })
}

function setupParallax() {
  isMobile = window.innerWidth < 768
  applyParallax()
  window.addEventListener('scroll', onScroll, { passive: true })
  window.addEventListener('resize', () => { isMobile = window.innerWidth < 768; applyParallax() })
}

function teardownParallax() {
  window.removeEventListener('scroll', onScroll)
  if (rafId) cancelAnimationFrame(rafId)
}
</script>

<template>
  <section
    ref="sectionRef"
    class="page-hero"
    :style="`min-height: max(${height}, 480px)`"
  >
    <!-- Parallax image wrapper (overflow hidden is on .page-hero) -->
    <div class="page-hero__media">
      <img
        v-if="heroImage"
        ref="imgRef"
        :src="heroImage"
        :alt="heroAlt"
        class="page-hero__img"
        loading="eager"
        fetchpriority="high"
      />
      <NoImagePlaceholder v-else class="page-hero__placeholder" dark />
    </div>

    <!-- Gradient overlays -->
    <div class="page-hero__overlay-top"></div>
    <div class="page-hero__overlay-bottom"></div>

    <!-- Text slot -->
    <div class="page-hero__content" :class="{ 'is-in': isIn }">
      <p v-if="tag" class="page-hero__tag">
        <span class="page-hero__tag-dot"></span>{{ tag }}
      </p>
      <div class="page-hero__rule"></div>
      <h1 class="page-hero__title">
        <span class="page-hero__title-line">{{ title }}</span>
        <span v-if="titleItalic" class="page-hero__title-italic">{{ titleItalic }}</span>
      </h1>
      <p v-if="subtitle" class="page-hero__subtitle">{{ subtitle }}</p>
    </div>

    <!-- Allow callers to inject extra content (e.g. scroll arrow) -->
    <slot />
  </section>
</template>

<style scoped>
.page-hero {
  position: relative;
  display: flex;
  align-items: flex-end;
  overflow: hidden;   /* critical — clips the parallax overshoot */
  background: #071a2b;
  min-height: 60vh;
  padding-top: 92px;  /* clears the fixed navbar so title never overlaps it */
  box-sizing: border-box;
}

/* ── media wrapper ── */
.page-hero__media {
  position: absolute;
  inset: -14%;        /* extra space so parallax image never shows edges */
  z-index: 0;
}

.page-hero__img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  will-change: transform;
  /* initial neutral position (parallax overrides in JS) */
  transform: translate3d(0, 0, 0) scale(1.12);
  /* smooth entrance */
  transition: opacity 0.6s ease;
}

.page-hero__placeholder {
  position: absolute;
  inset: 0;
}

/* ── overlays ── */
.page-hero__overlay-top {
  position: absolute;
  inset: 0;
  z-index: 1;
  background: linear-gradient(
    to bottom,
    rgba(7, 26, 43, 0.45) 0%,
    rgba(7, 26, 43, 0.15) 40%,
    transparent 100%
  );
  pointer-events: none;
}

.page-hero__overlay-bottom {
  position: absolute;
  inset: 0;
  z-index: 1;
  background: linear-gradient(
    to top,
    rgba(7, 26, 43, 0.94) 0%,
    rgba(7, 26, 43, 0.5) 35%,
    transparent 70%
  );
  pointer-events: none;
}

/* ── text ── */
.page-hero__content {
  position: relative;
  z-index: 2;
  width: 100%;
  padding: 0 1.5rem 4.5rem;
  max-width: 1180px;
  margin: 0 auto;
}

@media (min-width: 1024px) {
  .page-hero__content { padding: 0 3.5rem 6rem; }
}

.page-hero__tag {
  display: flex;
  align-items: center;
  gap: 0.55rem;
  font-family: var(--font-heading);
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.32em;
  text-transform: uppercase;
  color: #C9A84C;
  margin-bottom: 1.1rem;
  opacity: 0;
  transform: translateY(14px);
  transition: opacity 0.7s cubic-bezier(0.22, 1, 0.36, 1), transform 0.7s cubic-bezier(0.22, 1, 0.36, 1);
}

.page-hero__tag-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #C9A84C;
  box-shadow: 0 0 0 3px rgba(201, 168, 76, 0.25);
}

.page-hero__rule {
  width: 0;
  height: 1px;
  background: linear-gradient(90deg, rgba(201, 168, 76, 0.9), rgba(201, 168, 76, 0));
  margin-bottom: 1.5rem;
  transition: width 0.9s cubic-bezier(0.22, 1, 0.36, 1) 0.15s;
}

.page-hero__title {
  font-family: var(--font-display);
  font-size: clamp(2.8rem, 8.5vw, 7.5rem);
  font-weight: 400;
  line-height: 0.98;
  color: #f8f5ef;
  letter-spacing: 0.005em;
  text-wrap: balance;
}

.page-hero__title-line {
  display: inline-block;
  overflow: hidden;
  opacity: 0;
  transform: translateY(46px);
  transition: opacity 0.9s cubic-bezier(0.22, 1, 0.36, 1) 0.1s, transform 0.9s cubic-bezier(0.22, 1, 0.36, 1) 0.1s;
}

.page-hero__title-italic {
  display: block;
  font-style: italic;
  color: #C9A84C;
  opacity: 0;
  transform: translateY(46px);
  transition: opacity 0.9s cubic-bezier(0.22, 1, 0.36, 1) 0.25s, transform 0.9s cubic-bezier(0.22, 1, 0.36, 1) 0.25s;
}

.page-hero__subtitle {
  margin-top: 1.5rem;
  max-width: 50ch;
  font-family: var(--font-display);
  font-style: italic;
  font-size: clamp(1.05rem, 1.4vw, 1.3rem);
  line-height: 1.7;
  color: rgba(248, 245, 239, 0.78);
  opacity: 0;
  transform: translateY(20px);
  transition: opacity 0.8s cubic-bezier(0.22, 1, 0.36, 1) 0.4s, transform 0.8s cubic-bezier(0.22, 1, 0.36, 1) 0.4s;
}

/* Entrance reveal — triggers once mounted */
.page-hero__content.is-in .page-hero__tag,
.page-hero__content.is-in .page-hero__title-line,
.page-hero__content.is-in .page-hero__title-italic,
.page-hero__content.is-in .page-hero__subtitle {
  opacity: 1;
  transform: translateY(0);
}

.page-hero__content.is-in .page-hero__rule {
  width: 64px;
}

@media (max-width: 767px) {
  .page-hero__title { font-size: clamp(2.4rem, 11vw, 3.4rem); }
}

/* Mobile — disable parallax scaling overhead */
@media (max-width: 767px) {
  .page-hero__media { inset: 0; }
  .page-hero__img   { transform: none !important; }
}
</style>

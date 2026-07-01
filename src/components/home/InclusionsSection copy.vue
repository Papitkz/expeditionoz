<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useComponentCMS } from '@/composables/useComponentCMS'
import NoImagePlaceholder from '@/components/NoImagePlaceholder.vue'
import { useParallax } from '@/composables/useParallax'

const cms = useComponentCMS('InclusionsSection')

// ─── Private & Hosted Expeditions banner photo (slot 0 of "charterBanner") ──
const charterImage = computed(() => cms.getImageUrl('charterBanner', 0))
const charterAlt = computed(() => cms.getAlt('charterBanner', 0) || 'Guests gathered on deck at sunset during a private charter expedition')

// ─── Static feature icons (code-driven, not CMS) ───────────────────────────
const features = [
  {
    icon: 'sail',
    title: 'EXPEDITION SAILING FLEET',
  },
  {
    icon: 'group',
    title: 'SMALL GROUP DEPARTURES',
  },
  {
    icon: 'chef',
    title: 'CHEF-CRAFTED DINING',
  },
  {
    icon: 'leaf',
    title: 'LOCALLY SOURCED FOOD & DRINKS',
  },
  {
    icon: 'location',
    title: 'LOCAL OCEAN KNOWLEDGE',
  },
]

// Parallax on charter photo
const charterImgRef = ref<HTMLElement | null>(null)
useParallax(charterImgRef, { speed: 0.2, clamp: 80 })

onMounted(() => {
  cms.load()
})
</script>

<template>
  <section class="charter-wrapper">
    <!-- ─── Private & Hosted Expeditions banner ─── -->
    <div class="charter-banner">
      <div class="charter-photo">
        <div class="charter-parallax-wrap">
          <img v-if="charterImage" ref="charterImgRef" :src="charterImage" :alt="charterAlt" loading="lazy" class="charter-parallax-img" />
          <NoImagePlaceholder v-else dark label="Private Charter" />
        </div>
      </div>

      <div class="charter-content">
        <div class="charter-watermark" aria-hidden="true">
          <svg width="220" height="220" viewBox="0 0 160 160" fill="none">
            <defs>
              <radialGradient id="compassFace" cx="38%" cy="32%" r="75%">
                <stop offset="0%" stop-color="#e8c878" stop-opacity="0.22" />
                <stop offset="55%" stop-color="#c9a84c" stop-opacity="0.08" />
                <stop offset="100%" stop-color="#c9a84c" stop-opacity="0" />
              </radialGradient>
              <linearGradient id="ringLight" x1="20%" y1="10%" x2="80%" y2="90%">
                <stop offset="0%" stop-color="#f3dc9c" stop-opacity="0.85" />
                <stop offset="45%" stop-color="#c9a84c" stop-opacity="0.4" />
                <stop offset="100%" stop-color="#7a5f1f" stop-opacity="0.25" />
              </linearGradient>
              <linearGradient id="ringShade" x1="80%" y1="90%" x2="20%" y2="10%">
                <stop offset="0%" stop-color="#f3dc9c" stop-opacity="0.6" />
                <stop offset="50%" stop-color="#c9a84c" stop-opacity="0.25" />
                <stop offset="100%" stop-color="#5c4716" stop-opacity="0.15" />
              </linearGradient>
              <linearGradient id="needleGold" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#f6e3ac" />
                <stop offset="50%" stop-color="#c9a84c" />
                <stop offset="100%" stop-color="#8a6b22" />
              </linearGradient>
              <linearGradient id="needleShadow" x1="100%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stop-color="#5c4716" />
                <stop offset="100%" stop-color="#2e2308" />
              </linearGradient>
              <radialGradient id="pivotShine" cx="35%" cy="30%" r="65%">
                <stop offset="0%" stop-color="#fdf3d8" />
                <stop offset="60%" stop-color="#c9a84c" />
                <stop offset="100%" stop-color="#7a5f1f" />
              </radialGradient>
              <filter id="softGlow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="1.2" />
              </filter>
            </defs>

            <circle cx="80" cy="80" r="76" fill="url(#compassFace)" />
            <circle cx="80" cy="80" r="74" stroke="url(#ringLight)" stroke-width="1.1" />
            <circle cx="80" cy="80" r="74" stroke="url(#ringShade)" stroke-width="0.4" />
            <circle cx="80" cy="80" r="62" stroke="url(#ringLight)" stroke-width="0.6" stroke-opacity="0.7" />
            <circle cx="80" cy="80" r="50" stroke="#c9a84c" stroke-width="0.5" stroke-dasharray="2 4" stroke-opacity="0.45" />
            <g stroke="url(#ringLight)" stroke-width="0.5" stroke-opacity="0.55">
              <line x1="80" y1="6" x2="80" y2="154" />
              <line x1="6" y1="80" x2="154" y2="80" />
              <line x1="25.7" y1="25.7" x2="134.3" y2="134.3" />
              <line x1="134.3" y1="25.7" x2="25.7" y2="134.3" />
            </g>
            <g stroke="#c9a84c" stroke-opacity="0.4" stroke-width="0.5">
              <line x1="80" y1="14" x2="80" y2="24" />
              <line x1="80" y1="136" x2="80" y2="146" />
              <line x1="14" y1="80" x2="24" y2="80" />
              <line x1="136" y1="80" x2="146" y2="80" />
            </g>
            <g filter="url(#softGlow)" opacity="0.55">
              <path d="M80 18 L88 80 L80 142 L72 80 Z" fill="url(#needleShadow)" />
              <path d="M18 80 L80 88 L142 80 L80 72 Z" fill="url(#needleShadow)" opacity="0.5" />
            </g>
            <path d="M80 16 L89 80 L80 96 L71 80 Z" fill="url(#needleGold)" />
            <path d="M80 96 L89 80 L80 144 L71 80 Z" fill="url(#needleShadow)" />
            <path d="M16 80 L80 89 L96 80 L80 71 Z" fill="url(#needleGold)" opacity="0.85" />
            <path d="M96 80 L80 89 L144 80 L80 71 Z" fill="url(#needleShadow)" opacity="0.7" />
            <circle cx="80" cy="80" r="6.5" fill="url(#pivotShine)" />
            <circle cx="80" cy="80" r="6.5" stroke="#fdf3d8" stroke-width="0.4" stroke-opacity="0.6" />
            <circle cx="78" cy="78" r="1.6" fill="#fdf3d8" fill-opacity="0.85" />
            <text x="80" y="11" text-anchor="middle" font-family="Montserrat, sans-serif" font-size="7" font-weight="700" fill="#c9a84c" fill-opacity="0.55" letter-spacing="1">N</text>
            <text x="80" y="154" text-anchor="middle" font-family="Montserrat, sans-serif" font-size="7" font-weight="700" fill="#c9a84c" fill-opacity="0.4" letter-spacing="1">S</text>
            <text x="151" y="83.5" text-anchor="middle" font-family="Montserrat, sans-serif" font-size="7" font-weight="700" fill="#c9a84c" fill-opacity="0.4" letter-spacing="1">E</text>
            <text x="9" y="83.5" text-anchor="middle" font-family="Montserrat, sans-serif" font-size="7" font-weight="700" fill="#c9a84c" fill-opacity="0.4" letter-spacing="1">W</text>
          </svg>
        </div>

        <div class="charter-header">
          <div class="charter-icon">
            <!-- <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#c9a84c" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="7" r="3" />
              <path d="M5 21v-1a5 5 0 0 1 5-5h0a5 5 0 0 1 5 5v1" />
              <circle cx="5" cy="9" r="2" />
              <path d="M1 21v-1a3 3 0 0 1 3-3" />
              <circle cx="19" cy="9" r="2" />
              <path d="M23 21v-1a3 3 0 0 0-3-3" />
            </svg> -->
          </div>

          <div class="charter-header-text">
            <p class="charter-overline">PRIVATE &amp; HOSTED EXPEDITIONS</p>
            <h2 class="charter-title">The Boat. Your People. Your Adventure.</h2>
          </div>
        </div>

        <div class="charter-divider"></div>

        <p class="charter-text">
          Our expedition yachts are available for private charters, creator-hosted trips,
          club expeditions, brand partnerships and community voyages.
        </p>
        <p class="charter-text">
          Perfect for families, dive clubs, creators, photographers, retreats, ocean brands
          and private groups who want exclusive use of the vessel.
        </p>
        <p class="charter-text charter-text--muted">
          Private and hosted departures can be built around our 3-night, 5-night
          or 8-night expedition formats, depending on vessel availability and season.
        </p>

        <router-link to="/contact" class="charter-cta">
          Enquire About a Private Charter
        </router-link>
      </div>
    </div>

    <!-- ─── Closer to Nature icon strip ─── -->
    <div class="nature-strip">
      <h2 class="nature-strip-title">Closer to Nature. Further from the Crowds.</h2>

      <div class="nature-icons">
        <div
          v-for="feature in features"
          :key="feature.title"
          class="nature-icon-item"
        >
          <div class="nature-icon">
            <svg
              width="58"
              height="58"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.1"
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

          <h3 class="nature-icon-title">{{ feature.title }}</h3>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.charter-wrapper {
  width: 100vw;
  max-width: 100vw;
  margin-left: calc(50% - 50vw);
  margin-right: calc(50% - 50vw);
}

/* ─── Private & Hosted Expeditions banner ───────────────────────────── */
.charter-banner {
  display: grid;
  grid-template-columns: 1fr 1fr;
  background: #071a2b;
  min-height: 420px;
  width: calc(100% - 3rem);
  margin: 0 auto 3rem;
  border: 1px solid rgba(201, 168, 76, 0.35);
  border-radius: 6px;
  overflow: hidden;
}

.charter-photo {
  position: relative;
  overflow: hidden;
}

.charter-parallax-wrap {
  position: absolute;
  inset: -12%;
}

.charter-parallax-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  will-change: transform;
  transform: translate3d(0, 0, 0) scale(1.08);
}

.charter-photo img,
.charter-photo :deep(.no-image-placeholder) {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.charter-content {
  position: relative;
  padding: 3rem 3.5rem 3rem 3.7rem;
  display: flex;
  flex-direction: column;
  justify-content: center;
  overflow: hidden;
}

.charter-watermark {
  position: absolute;
  top: 50%;
  right: -55px;
  transform: translateY(-50%);
  pointer-events: none;
  opacity: 0.35;
}

.charter-header {
  position: relative;
  z-index: 2;
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 0.9rem;
}

.charter-icon {
  flex-shrink: 0;
  display: flex;
  margin-left: -3.5rem;
}

.charter-header-text {
  display: flex;
  flex-direction: column;
}

.charter-overline {
  color: #c9a84c;
  font-family: var(--font-heading);
  font-size: 1.65rem;
  font-weight: 700;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  margin-bottom: 0.3rem;
}

.charter-title {
  font-family: var(--font-heading);
  font-weight: 700;
  color: #c9a84c;
  line-height: 1.35;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  max-width: 480px;
}

.charter-divider {
  position: relative;
  z-index: 2;
  width: 52px;
  height: 1px;
  background: #c9a84c;
  margin-bottom: 1.2rem;
}

.charter-text {
  position: relative;
  z-index: 2;
  color: rgba(248, 245, 239, 0.85);
  font-family: var(--font-body);
  font-size: 0.92rem;
  line-height: 1.6;
  max-width: 460px;
  margin-bottom: 0.75rem;
}

.charter-text--muted {
  color: rgba(248, 245, 239, 0.65);
  margin-bottom: 1.3rem;
}

.charter-cta {
  position: relative;
  z-index: 2;
  display: inline-block;
  align-self: flex-start;
  padding: 14px 32px;
  background: #c9a84c;
  color: #071a2b;
  font-family: var(--font-heading);
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  text-decoration: none;
  transition: background 0.3s ease, transform 0.2s ease;
}

.charter-cta:hover {
  background: #e8c05a;
  transform: translateY(-1px);
}

/* ─── Closer to Nature icon strip ───────────────────────────────────── */
.nature-strip {
  background: #071a2b;
  border-top: 1px solid rgba(201, 168, 76, 0.25);
  border-bottom: 1px solid rgba(201, 168, 76, 0.25);
  padding: 3.25rem 2rem 3.75rem;
  text-align: center;
}

.nature-strip-title {
  font-family: var(--font-display);
  font-size: clamp(1.3rem, 2vw, 1.7rem);
  font-weight: 600;
  color: #f8f5ef;
  letter-spacing: 0.02em;
  margin-bottom: 2.25rem;
}

.nature-icons {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 1.5rem 1rem;
  max-width: 1100px;
  margin: 0 auto;
  justify-content: center;
}

.nature-icon-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.9rem;
}

.nature-icon {
  color: #c9a84c;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.3s ease, transform 0.3s ease;
}

.nature-icon-item:hover .nature-icon {
  color: #9a7e2e;
  transform: translateY(-2px);
}

.nature-icon-title {
  font-family: var(--font-heading);
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #f8f5ef;
  line-height: 1.4;
  max-width: 150px;
}

/* ─── Responsive ───────────────────────────────────────────────────── */
@media (max-width: 1024px) {
  .charter-banner {
    grid-template-columns: 1fr;
  }

  .charter-photo {
    min-height: 320px;
  }

  .charter-content {
    padding: 3rem 2.5rem;
  }

  .charter-icon {
    margin-left: 0;
  }

  .nature-icons {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 640px) {
  .charter-content {
    padding: 2.5rem 1.5rem;
  }

  .charter-title {
    max-width: 100%;
  }

  .charter-text {
    max-width: 100%;
  }

  .charter-watermark {
    display: none;
  }

  .nature-strip {
    padding: 3rem 1.25rem 3.5rem;
  }

  .nature-strip-title {
    font-size: 1.15rem;
    margin-bottom: 2.25rem;
    line-height: 1.4;
  }

  .nature-icons {
    grid-template-columns: repeat(2, 1fr);
    gap: 2rem 1rem;
  }

  .nature-icon-title {
    font-size: 0.65rem;
  }
}
</style>
<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useSEO } from '@/composables/useSEO'
import { useScrollReveal } from '@/composables/useScrollReveal'
import { useComponentCMS } from '@/composables/useComponentCMS'
import PageHero from '@/components/PageHero.vue'
import EditableText from '@/components/EditableText.vue'
import NoImagePlaceholder from '@/components/NoImagePlaceholder.vue'
import CtaSection from '@/components/home/CtaSection.vue'

useScrollReveal()

// Single CMS instance for the whole page — every image on this page is
// registered under the "ExperienceView" component in AdminImages, so the
// admin can manage all of it (hero, rhythm stops, gallery, pillars bg)
// from one place.
const cms = useComponentCMS('ExperienceView')

onMounted(async () => {
  await cms.load()
})

const heroImage = computed(() => cms.getImageUrl('hero', 0))

useSEO({
  title: 'The Experience — Expedition OZ',
  description: 'What it feels like to sail Ningaloo Reef aboard Expedition OZ — small-group, all-inclusive, guided by marine naturalists.',
  type: 'website',
  keywords: ['Ningaloo Reef experience', 'sailing expedition', 'Expedition OZ', 'whale shark snorkeling'],
})

// ── A Day Aboard — the day's rhythm from dawn to dusk ──────────────────────
// A genuine sequence (time of day), so a "ship's log" time-stamp is the
// right structural device here — not an arbitrary 01/02/03 marker.
interface RhythmStop {
  key: string
  time: string
  watch: string
  defaultTitle: string
  defaultDesc: string
}

const RHYTHM_STOPS: RhythmStop[] = [
  {
    key: 'dawn',
    time: '06:00',
    watch: 'Dawn Watch',
    defaultTitle: 'The Water Wakes You',
    defaultDesc: 'No alarm — just the sound of water against the hull and early light through the porthole. Coffee on deck, the reef still and silver, the day yet to be decided by the tide.',
  },
  {
    key: 'midday',
    time: '12:00',
    watch: 'Open Water',
    defaultTitle: 'In the Wake of Giants',
    defaultDesc: 'The spotter plane calls it in and the boat turns. Minutes later you are in the water, in the shadow of a whale shark or gliding beside a manta ray — the reason you came.',
  },
  {
    key: 'dusk',
    time: '18:00',
    watch: 'Dusk Watch',
    defaultTitle: 'Gold Over Ningaloo',
    defaultDesc: 'The sky turns molten as the boat finds its anchorage for the night. Dinner on deck, stories from the day, the coastline fading to a single dark line against the last light.',
  },
]

const rhythmStops = computed(() =>
  RHYTHM_STOPS.map((stop, i) => {
    const item = cms.getSlot('rhythm', i)
    return {
      ...stop,
      src: item?.imageUrl || '',
      alt: item?.alt || stop.defaultTitle,
      hasImage: !!item?.imageUrl,
    }
  })
)

// ── Atmosphere gallery — fixed 6 slots; matches AdminImages registry ───────
const GALLERY_SLOTS = 6
const galleryImages = computed(() =>
  Array.from({ length: GALLERY_SLOTS }, (_, i) => {
    const item = cms.getSlot('gallery', i)
    return {
      src: item?.imageUrl || '',
      alt: item?.alt || '',
      caption: item?.caption || item?.title || '',
      hasImage: !!item?.imageUrl,
    }
  }).filter((img) => img.hasImage)
)

// ── Pillars background (ambient image behind the three pillar cards) ──────
const pillarsBg = computed(() => cms.getImageUrl('pillars', 0))

const pillars = [
  { key: 'pillar1', icon: 'compass', defaultTitle: 'Guided by Naturalists', defaultDesc: 'Every excursion is led by marine naturalists who read the water, the weather, and the wildlife — so you experience the reef the way it deserves to be seen.' },
  { key: 'pillar2', icon: 'wave', defaultTitle: 'Small-Group, All-Inclusive', defaultDesc: 'A handful of guests aboard, never a crowd. Meals, gear, and excursions are all included, so the only thing you need to plan is which sunset to watch from the deck.' },
  { key: 'pillar3', icon: 'compass', defaultTitle: 'Days Shaped by the Sea', defaultDesc: 'No two days look alike. Itineraries flex around wildlife movements, tides, and weather, so every expedition is its own story.' },
]
</script>

<template>
  <div class="experience-page">
    <PageHero
      component-name="ExperienceView"
      :fallback-image="heroImage || '/images/sylvia-hero.jpg'"
      fallback-alt="Sailing the Ningaloo Reef"
      title="The Experience"
      subtitle="What it feels like to spend your days at sea"
    />

    <!-- Intro -->
    <section class="exp-intro">
      <div class="exp-intro-inner section-reveal">
        <p class="overline-text mb-3">More Than a Trip</p>
        <div class="gold-divider mx-auto mb-6"></div>
        <h2 class="exp-intro-title">
          <EditableText page="experience" section="intro" content-key="title" tag="span">
            A Rhythm, Not a Checklist
          </EditableText>
        </h2>
        <p class="exp-intro-desc">
          <EditableText page="experience" section="intro" content-key="description" tag="span">
            Expedition OZ isn't a list of sights to tick off — it's days that move with the ocean's own rhythm. Wake to the sound of water against the hull, spend your hours in the wake of whale sharks and manta rays, and end each evening with the sky turning gold over Ningaloo Reef.
          </EditableText>
        </p>
      </div>
    </section>

    <!-- A Day Aboard — dawn to dusk -->
    <section class="exp-rhythm">
      <div class="exp-rhythm-header section-reveal">
        <p class="overline-text mb-3">A Day Aboard</p>
        <div class="gold-divider mx-auto mb-4"></div>
        <h2 class="exp-rhythm-heading">From <span class="italic-accent">Dawn</span> to <span class="italic-accent">Dusk</span></h2>
      </div>

      <div class="exp-rhythm-rail" aria-hidden="true"></div>

      <div
        v-for="(stop, i) in rhythmStops"
        :key="stop.key"
        class="exp-rhythm-stop"
        :class="i % 2 === 0 ? 'section-reveal-left' : 'section-reveal-right'"
      >
        <div class="exp-rhythm-media">
          <img
            v-if="stop.hasImage"
            :src="stop.src"
            :alt="stop.alt"
            class="exp-rhythm-img"
            loading="lazy"
          />
          <NoImagePlaceholder v-else :label="stop.watch" />
          <div class="exp-rhythm-time">
            <span class="exp-rhythm-time-value">{{ stop.time }}</span>
            <span class="exp-rhythm-time-watch">{{ stop.watch }}</span>
          </div>
        </div>
        <div class="exp-rhythm-copy">
          <span class="exp-rhythm-dot" aria-hidden="true"></span>
          <h3 class="exp-rhythm-title">
            <EditableText page="experience" :section="`rhythm-${stop.key}`" content-key="title" tag="span">
              {{ stop.defaultTitle }}
            </EditableText>
          </h3>
          <p class="exp-rhythm-desc">
            <EditableText page="experience" :section="`rhythm-${stop.key}`" content-key="description" tag="span">
              {{ stop.defaultDesc }}
            </EditableText>
          </p>
        </div>
      </div>
    </section>

    <!-- Atmosphere gallery -->
    <section class="exp-gallery">
      <div class="exp-gallery-header section-reveal">
        <p class="overline-text mb-3">In the Moment</p>
        <div class="gold-divider mx-auto mb-4"></div>
        <h2 class="exp-gallery-heading">The Days, <span class="italic-accent">As They Happen</span></h2>
      </div>

      <div v-if="galleryImages.length" class="exp-gallery-grid section-reveal">
        <div
          v-for="(img, i) in galleryImages"
          :key="i"
          class="exp-gallery-item"
        >
          <img :src="img.src" :alt="img.alt || 'Life aboard Expedition OZ'" loading="lazy" />
          <div v-if="img.caption" class="exp-gallery-caption">{{ img.caption }}</div>
        </div>
      </div>
      <p v-else class="exp-gallery-empty">Gallery photos are added from the admin dashboard.</p>
    </section>

    <!-- Pillars -->
    <section class="exp-pillars-section">
      <img
        v-if="pillarsBg"
        :src="pillarsBg"
        alt=""
        class="exp-pillars-bg"
        loading="lazy"
        aria-hidden="true"
      />
      <div class="exp-pillars-overlay" aria-hidden="true"></div>

      <div class="exp-pillars">
        <div
          v-for="pillar in pillars"
          :key="pillar.key"
          class="exp-pillar section-reveal"
        >
          <div class="exp-pillar-icon" aria-hidden="true">
            <svg width="36" height="36" viewBox="0 0 80 80" fill="none">
              <circle cx="40" cy="40" r="36" stroke="currentColor" stroke-width="1.5" opacity="0.5" />
              <polygon points="40,16 37,40 40,44 43,40" fill="currentColor" />
            </svg>
          </div>
          <h3 class="exp-pillar-title">
            <EditableText page="experience" :section="pillar.key" content-key="title" tag="span">
              {{ pillar.defaultTitle }}
            </EditableText>
          </h3>
          <p class="exp-pillar-desc">
            <EditableText page="experience" :section="pillar.key" content-key="description" tag="span">
              {{ pillar.defaultDesc }}
            </EditableText>
          </p>
        </div>
      </div>
    </section>

    <CtaSection />
  </div>
</template>

<style scoped>
.experience-page {
  background: var(--color-ocean-950, #071a2b);
}

.italic-accent {
  font-style: italic;
  color: var(--color-gold-400, #c9a84c);
}

/* ===== Intro ===== */
.exp-intro {
  padding: 6rem 1.5rem 5rem;
  text-align: center;
}

.exp-intro-inner {
  max-width: 760px;
  margin: 0 auto;
}

.exp-intro-title {
  font-family: var(--font-display, 'Playfair Display', serif);
  font-size: clamp(1.9rem, 4vw, 2.9rem);
  font-weight: 400;
  color: var(--color-sand-100, #f8f5ef);
  margin-bottom: 1.5rem;
}

.exp-intro-desc {
  font-size: 1.05rem;
  line-height: 1.85;
  color: var(--color-sand-200, #ede9df);
  opacity: 0.82;
}

/* ===== A Day Aboard (rhythm) ===== */
.exp-rhythm {
  position: relative;
  max-width: 1080px;
  margin: 0 auto;
  padding: 2rem 1.5rem 6rem;
}

.exp-rhythm-header {
  text-align: center;
  margin-bottom: 4rem;
}

.exp-rhythm-heading {
  font-family: var(--font-display, 'Playfair Display', serif);
  font-size: clamp(2rem, 4.5vw, 3.1rem);
  font-weight: 400;
  color: var(--color-sand-100, #f8f5ef);
}

/* Vertical rail evokes the sun's arc across the day — a signature tied to
   the section's real content (dawn → midday → dusk), not decoration. */
.exp-rhythm-rail {
  position: absolute;
  top: 9rem;
  bottom: 4rem;
  left: 50%;
  width: 1px;
  background: linear-gradient(
    to bottom,
    rgba(201, 168, 76, 0),
    rgba(201, 168, 76, 0.35) 15%,
    rgba(201, 168, 76, 0.35) 85%,
    rgba(201, 168, 76, 0)
  );
  transform: translateX(-50%);
}

.exp-rhythm-stop {
  position: relative;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 3rem;
  align-items: center;
  margin-bottom: 4.5rem;
}

.exp-rhythm-stop:last-child {
  margin-bottom: 0;
}

.exp-rhythm-stop:nth-child(odd) .exp-rhythm-media {
  order: 1;
}

.exp-rhythm-stop:nth-child(odd) .exp-rhythm-copy {
  order: 2;
  text-align: left;
  padding-left: 0.5rem;
}

.exp-rhythm-stop:nth-child(even) .exp-rhythm-media {
  order: 2;
}

.exp-rhythm-stop:nth-child(even) .exp-rhythm-copy {
  order: 1;
  text-align: right;
  padding-right: 0.5rem;
}

.exp-rhythm-media {
  position: relative;
  aspect-ratio: 4 / 3;
  overflow: hidden;
  border: 1px solid rgba(201, 168, 76, 0.18);
}

.exp-rhythm-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  transition: transform 0.7s cubic-bezier(0.22, 1, 0.36, 1);
}

.exp-rhythm-stop:hover .exp-rhythm-img {
  transform: scale(1.05);
}

.exp-rhythm-time {
  position: absolute;
  bottom: 0;
  left: 0;
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
  padding: 0.6rem 0.85rem;
  background: rgba(7, 26, 43, 0.82);
  border-top: 1px solid rgba(201, 168, 76, 0.3);
  border-right: 1px solid rgba(201, 168, 76, 0.3);
}

.exp-rhythm-time-value {
  font-family: 'Courier New', Courier, monospace;
  font-size: 0.95rem;
  color: var(--color-gold-400, #c9a84c);
  letter-spacing: 0.05em;
}

.exp-rhythm-time-watch {
  font-family: var(--font-heading, 'Montserrat', sans-serif);
  font-size: 0.6rem;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: rgba(248, 245, 239, 0.55);
}

.exp-rhythm-copy {
  position: relative;
}

.exp-rhythm-dot {
  display: none;
}

.exp-rhythm-title {
  font-family: var(--font-display, 'Playfair Display', serif);
  font-size: clamp(1.35rem, 2.4vw, 1.75rem);
  font-weight: 400;
  color: var(--color-sand-100, #f8f5ef);
  margin-bottom: 0.85rem;
}

.exp-rhythm-desc {
  font-size: 0.98rem;
  line-height: 1.8;
  color: var(--color-sand-200, #ede9df);
  opacity: 0.78;
}

/* ===== Atmosphere gallery ===== */
.exp-gallery {
  padding: 2rem 1.5rem 6rem;
  max-width: 1200px;
  margin: 0 auto;
}

.exp-gallery-header {
  text-align: center;
  margin-bottom: 3rem;
}

.exp-gallery-heading {
  font-family: var(--font-display, 'Playfair Display', serif);
  font-size: clamp(2rem, 4.5vw, 3.1rem);
  font-weight: 400;
  color: var(--color-sand-100, #f8f5ef);
}

.exp-gallery-grid {
  columns: 2;
  column-gap: 0.85rem;
}

.exp-gallery-item {
  position: relative;
  break-inside: avoid;
  margin-bottom: 0.85rem;
  overflow: hidden;
  border: 1px solid rgba(201, 168, 76, 0.12);
}

.exp-gallery-item img {
  width: 100%;
  height: auto;
  display: block;
  transition: transform 0.6s cubic-bezier(0.22, 1, 0.36, 1);
}

.exp-gallery-item:hover img {
  transform: scale(1.06);
}

.exp-gallery-caption {
  position: absolute;
  inset: auto 0 0 0;
  padding: 0.6rem 0.75rem;
  font-family: var(--font-heading, 'Montserrat', sans-serif);
  font-size: 0.72rem;
  letter-spacing: 0.04em;
  color: #fff;
  background: linear-gradient(to top, rgba(7, 26, 43, 0.85), transparent);
  opacity: 0;
  transform: translateY(6px);
  transition: opacity 0.35s ease, transform 0.35s ease;
}

.exp-gallery-item:hover .exp-gallery-caption {
  opacity: 1;
  transform: translateY(0);
}

.exp-gallery-empty {
  text-align: center;
  font-size: 0.85rem;
  color: rgba(248, 245, 239, 0.4);
  font-family: var(--font-heading, 'Montserrat', sans-serif);
  letter-spacing: 0.04em;
}

/* ===== Pillars ===== */
.exp-pillars-section {
  position: relative;
  padding: 6rem 1.5rem;
  overflow: hidden;
}

.exp-pillars-bg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: 0.28;
}

.exp-pillars-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    180deg,
    var(--color-ocean-950, #071a2b) 0%,
    rgba(7, 26, 43, 0.86) 50%,
    var(--color-ocean-950, #071a2b) 100%
  );
}

.exp-pillars {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 2.5rem;
  max-width: 1200px;
  margin: 0 auto;
}

.exp-pillar {
  text-align: center;
  padding: 2.5rem 1.5rem;
  border: 1px solid rgba(201, 168, 76, 0.18);
  background: rgba(7, 26, 43, 0.55);
  border-radius: 6px;
  transition: transform 0.4s cubic-bezier(0.22, 1, 0.36, 1), border-color 0.4s ease, background 0.4s ease;
}

.exp-pillar:hover {
  transform: translateY(-6px);
  border-color: rgba(201, 168, 76, 0.5);
  background: rgba(201, 168, 76, 0.06);
}

.exp-pillar-icon {
  color: var(--color-gold-400, #c9a84c);
  margin-bottom: 1.25rem;
  display: flex;
  justify-content: center;
}

.exp-pillar-title {
  font-family: var(--font-heading, 'Montserrat', sans-serif);
  font-size: 1.15rem;
  letter-spacing: 0.03em;
  color: #fff;
  margin-bottom: 0.85rem;
}

.exp-pillar-desc {
  font-size: 0.92rem;
  line-height: 1.7;
  color: var(--color-text-muted, #c7d2da);
}

/* ===== Responsive ===== */
@media (max-width: 900px) {
  .exp-rhythm-rail {
    left: 1.1rem;
  }

  .exp-rhythm-stop,
  .exp-rhythm-stop:nth-child(odd),
  .exp-rhythm-stop:nth-child(even) {
    grid-template-columns: 1fr;
    gap: 1.5rem;
    padding-left: 2.2rem;
  }

  .exp-rhythm-stop:nth-child(odd) .exp-rhythm-media,
  .exp-rhythm-stop:nth-child(even) .exp-rhythm-media {
    order: 1;
  }

  .exp-rhythm-stop:nth-child(odd) .exp-rhythm-copy,
  .exp-rhythm-stop:nth-child(even) .exp-rhythm-copy {
    order: 2;
    text-align: left;
    padding-left: 0;
    padding-right: 0;
  }

  .exp-rhythm-dot {
    display: block;
    position: absolute;
    left: -2.2rem;
    top: 0.35rem;
    width: 9px;
    height: 9px;
    border-radius: 50%;
    background: var(--color-gold-400, #c9a84c);
    box-shadow: 0 0 0 3px rgba(201, 168, 76, 0.2);
  }

  .exp-pillars {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 640px) {
  .exp-intro {
    padding: 4rem 1.25rem 3.5rem;
  }

  .exp-rhythm {
    padding: 1rem 1.25rem 4rem;
  }

  .exp-rhythm-stop {
    margin-bottom: 3rem;
  }

  .exp-gallery {
    padding: 1rem 1.25rem 4rem;
  }

  .exp-gallery-grid {
    columns: 1;
  }

  .exp-pillars-section {
    padding: 3.5rem 1.25rem;
  }

  .exp-pillars {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }

  .exp-pillar {
    padding: 2rem 1.25rem;
  }
}

@media (prefers-reduced-motion: reduce) {
  .exp-pillar,
  .exp-rhythm-img,
  .exp-gallery-item img,
  .exp-gallery-caption {
    transition: none;
  }
}
</style>

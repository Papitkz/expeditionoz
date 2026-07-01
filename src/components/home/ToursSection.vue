<script setup lang="ts">
import { computed, onMounted, onUnmounted, nextTick, watch, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useComponentCMS } from '@/composables/useComponentCMS'
import NoImagePlaceholder from '@/components/NoImagePlaceholder.vue'

const router = useRouter()
const cms = useComponentCMS('ToursSection')

// Maps feature icon keys to their custom illustrated icon images.
// Icons without an entry here (e.g. 'coral', 'camera') keep using the inline SVG fallback.
const FEATURE_ICON_IMAGES: Record<string, string> = {
  sail: '/images/icons/sail.png',
  snorkel: '/images/icons/snorkel.png',
  wildlife: '/images/icons/wildlife.png',
  beach: '/images/icons/beach.png',
  sunset: '/images/icons/sunset.png',
  dive: '/images/icons/dive.png',
  whale: '/images/icons/whale.png',
  manta: '/images/icons/manta.png',
  chef: '/images/icons/chef.png',
  oceanS: '/images/icons/turtle.png',
  diveE: '/images/icons/manta2.png',

}

const EXPEDITION_FAMILIES = [
  {
    key: 'ocean-safari',
    slotIndex: 1,
    title: 'Ocean Safari',
    vessel: 'Aboard Sylfia',
    nights: '5 Nights',
    days: '6 Days',
    description: 'Our signature sailing, snorkelling and wildlife expedition.',
    features: [
    { icon: 'sail', label: 'Sailing' },
      { icon: 'snorkel', label: 'Snorkelling' },
      { icon: 'wildlife', label: 'Wildlife' },
      { icon: 'beach', label: 'Beaches' },
      { icon: 'chef', label: 'Private Chef' },
    ],
    link: '/expeditions/ocean-safari',
    viewLabel: 'VIEW EXPEDITION',
    escape: {
      key: 'ocean-safari-escape',
      slotIndex: 2,
      title: 'Ocean Safari Escape',
      nights: '3 Nights',
      days: '4 Days',
      text: 'Also available:',
      link: '/expeditions/ocean-safari-escape',
    },
  },
  {
    key: 'dive-expedition',
    slotIndex: 0,
    title: 'Dive Expedition',
    vessel: 'Aboard Millennium',
    nights: '8 Nights',
    days: '9 Days',
    description: 'Our flagship liveaboard dive and snorkel expedition.',
    features: [
      { icon: 'sail', label: 'Sailing' },
      { icon: 'dive', label: 'Scuba Diving' },
      { icon: 'whale', label: 'Whale Sharks' },
      { icon: 'wildlife', label: 'Wild Life' },
      { icon: 'chef', label: 'Private Chef' },
    ],
    link: '/expeditions/dive-expedition',
    viewLabel: 'VIEW EXPEDITION',
    escape: {
      key: 'dive-escape',
      slotIndex: 3,
      title: 'Dive Escape',
      nights: '4 Nights',
      days: '5 Days',
      text: 'Selected dates only:',
      link: '/expeditions/dive-escape',
    },
  },
]

const expeditions = computed(() => {
  return EXPEDITION_FAMILIES.map((family) => {
    const mainCms = cms.getSlot('tourCards', family.slotIndex)
    return {
      ...family,
      image: mainCms?.imageUrl || '',
      hasImage: !!mainCms?.imageUrl,
    }
  })
})

const scrollerRef = ref<HTMLElement | null>(null)
const activeIndex = ref(0)
let scrollTicking = false

function onCarouselScroll() {
  if (scrollTicking) return
  scrollTicking = true
  requestAnimationFrame(() => {
    const el = scrollerRef.value
    if (el) {
      const cardWidth = el.scrollWidth / expeditions.value.length
      activeIndex.value = Math.round(el.scrollLeft / cardWidth)
    }
    scrollTicking = false
  })
}

function scrollToCard(index: number) {
  const el = scrollerRef.value
  if (!el) return
  const card = el.children[index] as HTMLElement | undefined
  card?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
}

function nextCard() {
  const total = expeditions.value.length
  scrollToCard((activeIndex.value + 1) % total)
}

function prevCard() {
  const total = expeditions.value.length
  scrollToCard((activeIndex.value - 1 + total) % total)
}

let observer: IntersectionObserver | null = null

function setupObserver() {
  if (!observer) {
    observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('show')
          }
        })
      },
      { threshold: 0.06 }
    )
  }

  document.querySelectorAll('.tour-card.reveal:not(.show)').forEach((el) =>
    observer?.observe(el)
  )
}

onMounted(async () => {
  await nextTick()
  setupObserver()
  cms.load()
})

watch(
  () => cms.items.value,
  async () => {
    await nextTick()
    setupObserver()
  }
)

onUnmounted(() => {
  observer?.disconnect()
})
</script>

<template>
  <section class="tours-section">
    <div class="tours-carousel-outer">
      <button
        class="tours-arrow tours-arrow--prev"
        type="button"
        aria-label="Previous expedition"
        @click="prevCard"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="15 18 9 12 15 6"></polyline>
        </svg>
      </button>

      <div class="tours-grid" ref="scrollerRef" @scroll="onCarouselScroll">
      <div
        v-for="(item, index) in expeditions"
        :key="item.key"
        class="tour-card reveal"
        :style="{ transitionDelay: `${index * 0.15}s` }"
      >
        <div class="card-image-panel">
          <template v-if="item.hasImage">
            <img :src="item.image" :alt="item.title" />
          </template>
          <NoImagePlaceholder v-else :label="item.title" />
          <div class="image-overlay"></div>
        </div>

        <div class="card-content-panel">
        <div class="product-icon">
          <img
            v-if="item.key === 'ocean-safari'"
            src="/images/icons/turtle.png"
            alt=""
            width="48"
            height="48"
          />

          <img
            v-else
            src="/images/icons/manta2.png"
            alt=""
            width="48"
            height="48"
          />
        </div>

          <h3 class="product-title">{{ item.title }}</h3>
          <p class="product-vessel">{{ item.vessel }}</p>

          <div class="product-divider">
            <div class="divider-line-short"></div>
          </div>

          <p class="product-duration">{{ item.nights }} | {{ item.days }}</p>
          <p class="product-description">{{ item.description }}</p>

          <div class="feature-icons">
            <div v-for="feat in item.features" :key="feat.label" class="feat-item">
              <img
                v-if="FEATURE_ICON_IMAGES[feat.icon]"
                :src="FEATURE_ICON_IMAGES[feat.icon]"
                :alt="feat.label"
                class="feat-icon-img"
                width="56"
                height="56"
                loading="lazy"
              />

              <svg
                v-else-if="feat.icon === 'coral'"
                width="56"
                height="56"
                viewBox="0 0 24 24"
                fill="none"
              >
                <path
                  d="M12 20V12M12 12 Q9 8 9 4M12 12 Q15 8 15 4M12 12 Q7 10 5 12M12 12 Q17 10 19 12"
                  stroke="#C9A84C"
                  stroke-width="1.4"
                  stroke-linecap="round"
                />
              </svg>

              <svg
                v-else-if="feat.icon === 'camera'"
                width="56"
                height="56"
                viewBox="0 0 24 24"
                fill="none"
              >
                <rect x="3" y="8" width="18" height="12" rx="2" stroke="#C9A84C" stroke-width="1.4" />
                <circle cx="12" cy="14" r="3" stroke="#C9A84C" stroke-width="1.4" />
                <path d="M8.5 8L10 5.5h4L15.5 8" stroke="#C9A84C" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" />
              </svg>

              <span class="feat-label">{{ feat.label }}</span>
            </div>
          </div>

          <div class="card-actions">
            <button class="btn-primary-gold" @click="router.push(item.link)">
              {{ item.viewLabel }}
            </button>
            <button class="btn-outline-white" @click="router.push('/dates')">
              SEE DATES
            </button>
          </div>
        </div>

        <div class="escape-strip">
          <span class="escape-prefix">{{ item.escape.text }}</span>
          <span class="escape-title">{{ item.escape.title }}</span>
          <span class="escape-sep">—</span>
          <span class="escape-duration">{{ item.escape.nights }} | {{ item.escape.days }}</span>
          <button class="btn-escape" @click="router.push(item.escape.link)">
            VIEW ESCAPE
          </button>
        </div>
      </div>
      </div>

      <button
        class="tours-arrow tours-arrow--next"
        type="button"
        aria-label="Next expedition"
        @click="nextCard"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="9 18 15 12 9 6"></polyline>
        </svg>
      </button>
    </div>

    <div class="tours-dots" aria-hidden="true">
      <button
        v-for="(item, index) in expeditions"
        :key="item.key + '-dot'"
        class="tours-dot"
        :class="{ active: activeIndex === index }"
        @click="scrollToCard(index)"
      ></button>
    </div>
  </section>
</template>

<style scoped>
.tours-section {
  width: 100%;
  background: transparent;
  padding: 2.5rem 0 3rem;
  box-sizing: border-box;
}

.tours-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1.25rem;
}

.tour-card {
  position: relative;
  display: grid;
  grid-template-columns: 38% 62%;
  grid-template-rows: 1fr auto;
  border: 1px solid rgba(201, 168, 76, 0.4);
  border-radius: 6px;
  overflow: hidden;
  background: #06162a;
  opacity: 0;
  transform: translateY(30px);
  transition: opacity 0.55s ease, transform 0.4s cubic-bezier(0.22, 1, 0.36, 1), border-color 0.3s ease, box-shadow 0.4s ease;
  min-height: 420px;
}

.tour-card.show {
  opacity: 1;
  transform: translateY(0);
}

.tour-card:hover {
  border-color: #c9a84c;
  transform: translateY(-6px);
  box-shadow: 0 18px 40px rgba(0, 0, 0, 0.35), 0 0 0 1px rgba(201, 168, 76, 0.15);
}

.card-image-panel {
  grid-row: 1;
  grid-column: 1;
  position: relative;
  overflow: hidden;
}

.card-image-panel img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  transition: transform 8s ease;
}

.tour-card:hover .card-image-panel img {
  transform: scale(1.04);
}

.image-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(to right, transparent 60%, rgba(6, 22, 42, 0.5) 100%);
}

.card-content-panel {
  grid-row: 1;
  grid-column: 2;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 1.75rem 1.5rem 1.25rem;
  border-left: 1px solid rgba(201, 168, 76, 0.15);
}

.product-icon {
  margin-bottom: 0.75rem;
  opacity: 0.9;
}

.product-title {
  font-family: var(--font-display);
  color: #f8f5ef;
  font-size: clamp(1.4rem, 2vw, 2rem);
  font-weight: 400;
  letter-spacing: 0.02em;
  line-height: 1.1;
  margin-bottom: 0.35rem;
}

.product-vessel {
  color: #c9a84c;
  font-style: italic;
  font-size: 0.9rem;
  letter-spacing: 0.04em;
  margin-bottom: 0.75rem;
}

.product-divider {
  display: flex;
  justify-content: center;
  margin-bottom: 0.75rem;
}

.divider-line-short {
  width: 48px;
  height: 1px;
  background: rgba(201, 168, 76, 0.4);
}

.product-duration {
  color: #c9a84c;
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  margin-bottom: 0.6rem;
}

.product-description {
  color: rgba(248, 245, 239, 0.75);
  font-size: 0.85rem;
  line-height: 1.55;
  max-width: 260px;
  margin-bottom: 1.1rem;
}

.feature-icons {
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin-bottom: 1.25rem;
  flex-wrap: wrap;
}

.feat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.3rem;
  min-width: 68px;
}

.feat-icon-img {
  width: 56px;
  height: 56px;
  object-fit: contain;
  filter: drop-shadow(0 0 1px rgba(201, 168, 76, 0.15));
}

.feat-label {
  color: rgba(248, 245, 239, 0.6);
  font-size: 0.58rem;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  text-align: center;
  white-space: pre-line;
  line-height: 1.2;
}

.card-actions {
  display: flex;
  gap: 0.75rem;
  justify-content: center;
  flex-wrap: wrap;
  margin-top: auto;
}

.btn-primary-gold {
  height: 40px;
  padding: 0 1.2rem;
  background: #c9a84c;
  border: none;
  color: #071a2b;
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  cursor: pointer;
  border-radius: 2px;
  transition: background 0.3s ease;
  white-space: nowrap;
}

.btn-primary-gold:hover {
  background: #d7b461;
}

.btn-outline-white {
  height: 40px;
  padding: 0 1.2rem;
  background: transparent;
  border: 1px solid rgba(248, 245, 239, 0.55);
  color: #f8f5ef;
  font-size: 0.68rem;
  font-weight: 600;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  cursor: pointer;
  border-radius: 2px;
  transition: all 0.3s ease;
  white-space: nowrap;
}

.btn-outline-white:hover {
  border-color: #f8f5ef;
  background: rgba(248, 245, 239, 0.08);
}

.escape-strip {
  grid-column: 1 / -1;
  grid-row: 2;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.65rem 1.25rem;
  border-top: 1px solid rgba(201, 168, 76, 0.2);
  background: rgba(4, 14, 28, 0.6);
  flex-wrap: wrap;
}

.escape-prefix {
  color: rgba(248, 245, 239, 0.6);
  font-size: 0.72rem;
}

.escape-title {
  color: #c9a84c;
  font-family: var(--font-display);
  font-style: italic;
  font-size: 0.85rem;
  font-weight: 500;
}

.escape-sep {
  color: rgba(248, 245, 239, 0.4);
  font-size: 0.72rem;
}

.escape-duration {
  color: rgba(248, 245, 239, 0.7);
  font-size: 0.72rem;
  letter-spacing: 0.04em;
}

.btn-escape {
  padding: 5px 14px;
  background: transparent;
  border: 1px solid rgba(201, 168, 76, 0.55);
  color: #c9a84c;
  font-size: 0.62rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  cursor: pointer;
  border-radius: 2px;
  transition: all 0.3s ease;
  white-space: nowrap;
}

.btn-escape:hover {
  background: rgba(201, 168, 76, 0.12);
  border-color: #c9a84c;
}

.tours-dots {
  display: none;
}

.tours-carousel-outer {
  position: relative;
}

.tours-arrow {
  display: none;
}

@media (max-width: 768px) {
  .tours-dots {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 0.5rem;
    margin-top: 1rem;
  }

  .tours-dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    border: none;
    background: rgba(201, 168, 76, 0.3);
    padding: 0;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.22, 1, 0.36, 1);
  }

  .tours-dot.active {
    background: #c9a84c;
    width: 22px;
    border-radius: 4px;
  }
}

@media (max-width: 1100px) {
  .tours-grid {
    grid-template-columns: 1fr;
  }

  .tour-card {
    min-height: 380px;
  }
}

@media (max-width: 768px) {
  .tours-section {
    padding: 2rem 0 2.5rem;
  }

  .tours-grid {
    display: flex;
    grid-template-columns: unset;
    gap: 1rem;
    overflow-x: auto;
    scroll-snap-type: x mandatory;
    -webkit-overflow-scrolling: touch;
    padding: 0.25rem 1.25rem 1.25rem;
    margin: 0 -1.25rem;
    scrollbar-width: none;
  }

  .tours-grid::-webkit-scrollbar {
    display: none;
  }

  .tour-card {
    grid-template-columns: 1fr;
    grid-template-rows: 220px 1fr auto;
    min-height: unset;
    flex: 0 0 100%;
    scroll-snap-align: center;
    scroll-snap-stop: always;
  }

  .tours-arrow {
    display: flex;
    align-items: center;
    justify-content: center;
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    width: 36px;
    height: 36px;
    border-radius: 50%;
    border: 1px solid rgba(201, 168, 76, 0.45);
    background: rgba(6, 22, 42, 0.8);
    color: #c9a84c;
    cursor: pointer;
    z-index: 5;
    padding: 0;
    backdrop-filter: blur(4px);
    transition: background 0.25s ease, border-color 0.25s ease, transform 0.25s ease;
  }

  .tours-arrow:active {
    transform: translateY(-50%) scale(0.92);
  }

  .tours-arrow:hover {
    background: rgba(201, 168, 76, 0.18);
    border-color: #c9a84c;
  }

  .tours-arrow--prev {
    left: 0.5rem;
  }

  .tours-arrow--next {
    right: 0.5rem;
  }

  .card-image-panel {
    grid-row: 1;
    grid-column: 1;
    height: 220px;
  }

  .card-content-panel {
    grid-row: 2;
    grid-column: 1;
    border-left: none;
    border-top: 1px solid rgba(201, 168, 76, 0.15);
  }

  .escape-strip {
    grid-row: 3;
    grid-column: 1;
  }

  .product-description {
    max-width: 100%;
  }
}

@media (max-width: 480px) {
  .card-content-panel {
    padding: 1.25rem 1rem 1rem;
  }

  .feature-icons {
    gap: 0.6rem;
  }

  .feat-item {
    min-width: 56px;
  }

  .feat-icon-img {
    width: 40px;
    height: 40px;
  }

  .card-actions {
    gap: 0.6rem;
  }

  .btn-primary-gold,
  .btn-outline-white {
    width: 100%;
    justify-content: center;
  }

  .escape-strip {
    flex-direction: column;
    align-items: center;
    gap: 0.35rem;
  }

  .btn-escape {
    align-self: center;
  }
}

.feature-icons {
  display: flex;
  justify-content: center;
  gap: 0.5rem;
  margin-bottom: 1.25rem;
  flex-wrap: nowrap;        /* was: wrap */
}

.feat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.3rem;
  flex: 1 1 0;               /* was: min-width: 68px */
  min-width: 0;               /* allows shrinking below content size */
}

.feat-icon-img {
  width: 100%;
  max-width: 56px;
  height: auto;
  aspect-ratio: 1 / 1;
  object-fit: contain;
  filter: drop-shadow(0 0 1px rgba(201, 168, 76, 0.15));
}

.feat-label {
  font-size: 0.56rem;         /* slightly smaller so 5 labels fit without wrapping oddly */
  white-space: normal;        /* allow label text to wrap to 2 lines if needed */
}
@media (max-width: 480px) {
  .feature-icons {
    gap: 0.35rem;
  }

  .feat-icon-img {
    max-width: 34px;
  }

  .feat-label {
    font-size: 0.5rem;
  }
}
.feature-icons {
  display: flex;
  gap: 0.75rem;
  margin-bottom: 1.25rem;
  flex-wrap: nowrap;
  overflow-x: auto;
  justify-content: flex-start;  /* can't center-and-scroll well */
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
  padding: 0 0.25rem;
}
.feature-icons::-webkit-scrollbar { display: none; }

.feat-item {
  flex: 0 0 auto;
  min-width: 56px;
}
</style>
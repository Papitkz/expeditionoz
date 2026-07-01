<template>
  <section class="experience-section" id="experience">
    <div v-if="hasTerrain" class="terrain-layer">
      <div class="terrain-img-wrap">
        <img :src="terrainImage" alt="Ningaloo Reef" loading="lazy" class="terrain-img" />
      </div>
      <div class="terrain-overlay"></div>
    </div>

    <div v-else class="fallback-bg"></div>

    <div class="experience-content">
      <div class="experience-text">
        <h2 class="experience-headline">
          OUR DESTINATIONS
        </h2>

        <p class="experience-body">
          Sleep anchored on Ningaloo Reef and be the first in the water each and every day.
          We explore remote corners of the coastline beyond the reach of day tour operators,
          with empty reefs and off the map anchorages guided by the best possible conditions.
        </p>
      </div>

      <div class="experience-map">
        <div class="compass">
          <svg width="84" height="84" viewBox="0 0 80 80" fill="none">
            <circle cx="40" cy="40" r="37" fill="#071a2b" stroke="#c9a84c" stroke-width="1.5" />
            <circle cx="40" cy="40" r="33" stroke="#c9a84c" stroke-width="0.5" stroke-dasharray="2 2" stroke-opacity="0.8" />
            <circle cx="40" cy="40" r="28" stroke="#c9a84c" stroke-width="0.75" stroke-dasharray="4 2" stroke-opacity="0.6" />

            <line x1="40" y1="4" x2="40" y2="76" stroke="#c9a84c" stroke-width="0.5" stroke-opacity="0.4" />
            <line x1="4" y1="40" x2="76" y2="40" stroke="#c9a84c" stroke-width="0.5" stroke-opacity="0.4" />

            <path d="M40 2 L42 40 L40 38 L38 40 Z" fill="#c9a84c" stroke="#c9a84c" stroke-width="0.5" />
            <path d="M40 78 L38 40 L40 42 L42 40 Z" fill="#c9a84c" fill-opacity="0.6" stroke="#c9a84c" stroke-width="0.5" stroke-opacity="0.6" />
            <path d="M78 40 L40 38 L42 40 L40 42 Z" fill="#c9a84c" fill-opacity="0.6" stroke="#c9a84c" stroke-width="0.5" stroke-opacity="0.6" />
            <path d="M2 40 L40 42 L38 40 L40 38 Z" fill="#c9a84c" fill-opacity="0.6" stroke="#c9a84c" stroke-width="0.5" stroke-opacity="0.6" />

            <path d="M58 22 L41 39 L40 38 L39 39 Z" fill="#c9a84c" fill-opacity="0.35" stroke="#c9a84c" stroke-width="0.4" stroke-opacity="0.4" />
            <path d="M58 58 L39 41 L40 42 L41 41 Z" fill="#c9a84c" fill-opacity="0.35" stroke="#c9a84c" stroke-width="0.4" stroke-opacity="0.4" />
            <path d="M22 58 L39 41 L38 40 L39 39 Z" fill="#c9a84c" fill-opacity="0.35" stroke="#c9a84c" stroke-width="0.4" stroke-opacity="0.4" />
            <path d="M22 22 L41 39 L40 38 L39 39 Z" fill="#c9a84c" fill-opacity="0.35" stroke="#c9a84c" stroke-width="0.4" stroke-opacity="0.4" />

            <circle cx="40" cy="40" r="3" fill="#c9a84c" />
            <circle cx="40" cy="40" r="1.5" fill="#071a2b" />

            <text x="40" y="16" text-anchor="middle" fill="#c9a84c" font-size="11" font-family="'Times New Roman', serif" font-weight="900">N</text>
            <text x="40" y="69" text-anchor="middle" fill="#c9a84c" font-size="9" font-family="'Times New Roman', serif" font-weight="700" fill-opacity="0.9">S</text>
            <text x="69" y="43" text-anchor="middle" fill="#c9a84c" font-size="9" font-family="'Times New Roman', serif" font-weight="700" fill-opacity="0.9">E</text>
            <text x="11" y="43" text-anchor="middle" fill="#c9a84c" font-size="9" font-family="'Times New Roman', serif" font-weight="700" fill-opacity="0.9">W</text>
          </svg>
        </div>

        <svg class="route-svg" viewBox="0 0 100 100" preserveAspectRatio="none">
          <path
            class="route-trail"
            d="M 88,80 Q 73,64 56,46 T 36,28 T 16,17"
            fill="none"
            stroke="#ffffff"
            stroke-width="0.6"
            stroke-linecap="round"
            stroke-dasharray="1.5 2.5"
          />
        </svg>

        <div
          v-for="point in waypoints"
          :key="point.id"
          class="waypoint"
          :style="{ left: point.x + '%', top: point.y + '%' }"
          @click="toggleWaypoint(point.id)"
        >
          <div class="waypoint-marker">
            <svg class="anchor-icon" width="22" height="22" viewBox="0 0 22 22" fill="none">
              <circle cx="11" cy="11" r="10" fill="rgba(7,26,43,0.85)" stroke="rgba(255,255,255,0.6)" stroke-width="1" />
              <circle cx="11" cy="6" r="2.5" stroke="rgba(255,255,255,0.9)" stroke-width="1" fill="none" />
              <line x1="11" y1="8.5" x2="11" y2="16" stroke="rgba(255,255,255,0.9)" stroke-width="1.2" stroke-linecap="round" />
              <line x1="7.5" y1="12" x2="14.5" y2="12" stroke="rgba(255,255,255,0.9)" stroke-width="1" stroke-linecap="round" />
              <path d="M7.5 16 Q11 19 14.5 16" stroke="rgba(255,255,255,0.9)" stroke-width="1" fill="none" stroke-linecap="round" />
            </svg>
            <div class="marker-glow"></div>
          </div>

          <div class="waypoint-label">
            <span v-for="(line, i) in point.label.split('\n')" :key="i">{{ line }}</span>
          </div>

          <transition name="tooltip">
            <div v-if="activeWaypoint === point.id" class="waypoint-tooltip">
              <p>{{ point.desc }}</p>
            </div>
          </transition>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useComponentCMS } from '@/composables/useComponentCMS'

const cms = useComponentCMS('ExperienceSection')

const terrainImage = computed(() => {
  // Uses 'experiences' section slot 0 — matches AdminImages registry
  return cms.getSlot('experiences', 0)?.imageUrl || ''
})
const hasTerrain = computed(() => !!terrainImage.value)

const waypoints = ref([
  {
    id: 'murion',
    label: 'MURION\nISLANDS',
    x: 16,
    y: 17,
    desc: 'Uninhabited pristine sandy white beaches surrounded by coral reefs.',
  },
  {
    id: 'coral-bay',
    label: 'CORAL\nBAY',
    x: 36,
    y: 28,
    desc: 'Southern most anchorage known for its manta ray population and fish cleaning station.',
  },
  {
    id: 'yardie',
    label: 'YARDIE\nCREEK',
    x: 56,
    y: 46,
    desc: 'Crystal blue turquoise waters and kayaking adventures.',
  },
  {
    id: 'cape-range',
    label: 'CAPE\nRANGE',
    x: 73,
    y: 64,
    desc: 'Most famous snorkel and dive sites along the Ningaloo Reef.',
  },
  {
    id: 'gulf',
    label: 'THE\nGULF',
    x: 88,
    y: 80,
    desc: 'Protected anchorages known for rare wildlife along the mangrove forests. Humpback whale watching hotspot from August to October.',
  },
])

const activeWaypoint = ref<string | null>(null)
function toggleWaypoint(id: string) {
  activeWaypoint.value = activeWaypoint.value === id ? null : id
}

onMounted(async () => {
  await cms.load()
})
</script>

<style scoped>
:global(html, body) {
  margin: 0;
  padding: 0;
}

.experience-section {
  position: relative;
  width: calc(100% - 3rem);
  min-height: 380px;
  overflow: hidden;
  background: #071a2b;
  border: 1px solid rgba(201, 168, 76, 0.35);
  border-radius: 6px;
  margin: 3rem auto;
  padding: 0;
  box-sizing: border-box;
  isolation: isolate;
}

.terrain-layer,
.fallback-bg {
  position: absolute;
  inset: 0;
}

.terrain-layer {
  z-index: 1;
}

.terrain-img {
  object-fit: cover;
  object-position: center center; /* try this instead of 40% */
}

.terrain-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center 40%;
  display: block;
  animation: terrain-zoom 24s ease-in-out infinite alternate;
}

@keyframes terrain-zoom {
  from { transform: scale(1); }
  to { transform: scale(1.06); }
}

.terrain-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    90deg,
    rgba(7, 26, 43, 0.96) 0%,
    rgba(7, 26, 43, 0.88) 18%,
    rgba(7, 26, 43, 0.55) 40%,
    rgba(7, 26, 43, 0.18) 65%,
    rgba(7, 26, 43, 0.08) 100%
  );
}

.fallback-bg {
  background: #071a2b;
}

.experience-content {
  position: relative;
  z-index: 5;
  width: 100%;
  min-height: 380px;
  display: grid;
  grid-template-columns: 340px 1fr;
  align-items: center;
  padding: 2.2rem 1.8rem 2.2rem 2.2rem;
  box-sizing: border-box;
}

.experience-text {
  max-width: 310px;
}

.experience-headline {
  font-family: var(--font-display);
  font-size: clamp(1.25rem, 1.5vw, 1.6rem);
  font-weight: 300;
  color: #f5f1e8;
  line-height: 1.18;
  text-transform: uppercase;
  margin: 0 0 0.85rem;
  letter-spacing: 0.01em;
}

.experience-body {
  font-family: var(--font-heading);
  color: rgba(255, 255, 255, 0.78);
  font-size: 0.78rem;
  line-height: 1.85;
  margin: 0;
}

.experience-map {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 300px;
}

.compass {
  position: absolute;
  top: -10px;
  right: -5px;
  z-index: 15;
  opacity: 0.95;
  pointer-events: none;
  filter: drop-shadow(0 4px 12px rgba(0, 0, 0, 0.6));
}

.route-svg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  z-index: 2;
}

.route-trail {
  opacity: 0.85;
}

.waypoint {
  position: absolute;
  transform: translate(-50%, -50%);
  z-index: 10;
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
}

.waypoint-marker {
  position: relative;
  width: 26px;
  height: 26px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.anchor-icon {
  z-index: 2;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.5));
  transition: transform 0.3s ease;
}

.waypoint:hover .anchor-icon {
  transform: scale(1.15);
}

.marker-glow::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 26px;
  height: 26px;
  border-radius: 999px;
  border: 1px solid rgba(201, 168, 76, 0.55);
  animation: pulse-ring 2.5s infinite;
}

@keyframes pulse-ring {
  0% { transform: translate(-50%, -50%) scale(1); opacity: 0.7; }
  100% { transform: translate(-50%, -50%) scale(2.1); opacity: 0; }
}

.waypoint-label {
  margin-top: 5px;
  display: flex;
  flex-direction: column;
  align-items: center;
  font-family: var(--font-heading);
  font-size: 0.6rem;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  line-height: 1.2;
  color: #ffffff;
  font-weight: 700;
  text-align: center;
  text-shadow: 0 1px 6px rgba(0, 0, 0, 0.9), 0 0 12px rgba(0, 0, 0, 0.7);
  white-space: nowrap;
}

.waypoint-tooltip {
  position: absolute;
  bottom: calc(100% + 12px);
  left: 50%;
  transform: translateX(-50%);
  width: 200px;
  background: rgba(7, 26, 43, 0.97);
  border: 1px solid rgba(201, 168, 76, 0.45);
  border-radius: 6px;
  padding: 0.8rem 1rem;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(12px);
  z-index: 30;
}

.waypoint-tooltip p {
  margin: 0;
  font-size: 0.72rem;
  line-height: 1.7;
  color: rgba(255, 255, 255, 0.9);
  font-family: var(--font-heading);
}

.tooltip-enter-active,
.tooltip-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}

.tooltip-enter-from,
.tooltip-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(8px);
}

@media (max-width: 1100px) {
  .experience-section {
    width: calc(100% - 3rem);
    min-height: 420px;
    margin: 2.25rem auto;
  }

  .experience-content {
    grid-template-columns: 1fr;
    min-height: 420px;
    padding: 1.6rem;
    gap: 0.8rem;
  }

  .experience-text {
    max-width: 100%;
    padding-bottom: 0.5rem;
  }

  .experience-map {
    height: 280px;
    min-height: 280px;
  }

  .compass {
    top: -20px;
    right: 0;
  }
}

@media (max-width: 768px) {
  .experience-section {
    min-height: 500px;
  }

  .experience-content {
    min-height: 500px;
    padding: 1.2rem;
  }

  .experience-headline {
    font-size: 1.2rem;
  }

  .experience-map {
    height: 320px;
    min-height: 320px;
  }

  .waypoint-label {
    font-size: 0.52rem;
  }

  .compass svg {
    width: 64px;
    height: 64px;
  }
}

@media (max-width: 540px) {
  .experience-section {
    width: calc(100% - 2rem);
    margin: 1.75rem auto;
    min-height: 560px;
  }

  .experience-content {
    min-height: 560px;
  }

  .experience-map {
    height: 360px;
    min-height: 360px;
  }

  .waypoint-tooltip {
    width: 170px;
  }

  .waypoint-tooltip p {
    font-size: 0.66rem;
  }
}
@media (max-width: 540px) {
  .experience-section {
    margin: 1.75rem auto 0; /* remove bottom margin */
  }
}
</style>
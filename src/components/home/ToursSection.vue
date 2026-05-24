<script setup lang="ts">
import { computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useComponentCMS } from '@/composables/useComponentCMS'
import NoImagePlaceholder from '@/components/NoImagePlaceholder.vue'

const router = useRouter()
const cms = useComponentCMS('ToursSection')

const expeditions = computed(() => {
  const cards = cms.getSection('tourCards')

  return cards.map((item, index) => ({
    id: item.id || `tour-${index}`,
    title: index === 0 ? 'DIVE EXPEDITION' : 'OCEAN SAFARI',
    duration: index === 0 ? '9 DAYS' : '6 DAYS',
    nights: index === 0 ? '8 NIGHTS' : '5 NIGHTS',
    location: 'NINGALOO REEF',
    image: item.imageUrl || '',
    hasImage: !!item.imageUrl,
    features:
      index === 0
        ? [
            'Included Whale Shark Swim (Seasonal)',
            'Included Humpback Whale Swim (Seasonal)',
            'Scuba Diving Included',
            'Expedition RIB Operations',
            'Onboard Chef Crafted Dining'
          ]
        : [
            'Whale Watching',
            'Snorkelling & Marine Life',
            'Sailing & Exploration',
            'Yoga & Breathwork',
            'Onboard Chef Crafted Dining'
          ],
    link: index === 0 ? '/expeditions/dive-expedition' : '/expeditions/ocean-safari'
  }))
})

let observer: IntersectionObserver | null = null

onMounted(async () => {
  await cms.load()

  observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('show')
        }
      })
    },
    {
      threshold: 0.1
    }
  )

  document.querySelectorAll('.reveal').forEach((el) => observer?.observe(el))
})

onUnmounted(() => {
  observer?.disconnect()
})
</script>

<template>
  <section class="expedition-section">
    <div class="expedition-container">
      <div class="expedition-grid">
        <article
          v-for="(item, index) in expeditions"
          :key="item.id"
          class="expedition-card reveal"
          :style="{ transitionDelay: `${index * 0.15}s` }"
        >
          <div class="card-image">
            <template v-if="item.hasImage">
              <img
                :src="item.image"
                :alt="item.title"
              />
            </template>

            <NoImagePlaceholder
              v-else
              :label="item.title"
            />
          </div>

          <div class="card-overlay"></div>

          <div class="card-content">
            <h2 class="card-title">
              {{ item.title }}
            </h2>

            <div class="card-meta">
              <span>{{ item.duration }}</span>
              <span class="dot">•</span>
              <span>{{ item.nights }}</span>
              <span class="dot">•</span>
              <span>{{ item.location }}</span>
            </div>

            <ul class="feature-list">
              <li
                v-for="feature in item.features"
                :key="feature"
              >
                <span class="gold-check">
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <circle
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="#c9a84c"
                      stroke-width="2"
                    />
                    <path
                      d="M8 12.5L10.8 15L16 9"
                      stroke="#c9a84c"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    />
                  </svg>
                </span>
                <span>{{ feature }}</span>
              </li>
            </ul>

            <div class="card-actions">
              <button
                class="btn-gold"
                @click="router.push(item.link)"
              >
                VIEW EXPEDITION
              </button>

              <button
                class="btn-link"
                @click="router.push(`${item.link}/dates`)"
              >
                SEE DATES

                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <path d="M5 12h14" />
                  <path d="M13 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </article>
      </div>
    </div>
  </section>
</template>

<style scoped>
.expedition-section {
  width: 100%;
  background: #071a2b;
  padding: 4rem 0;
}

.expedition-container {
  width: 100%;
  max-width: 100%;
  margin: 0 auto;
  padding: 0 1rem;
  box-sizing: border-box;
}

.expedition-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
  width: 100%;
}

.expedition-card {
  position: relative;
  min-height: 640px;
  overflow: hidden;
  border-radius: 6px;
  border: 1px solid rgba(201, 168, 76, 0.4);
  background: #041a2b;
  transition: transform 0.45s ease, border-color 0.45s ease;
  opacity: 0;
  transform: translateY(40px);
}

.expedition-card.show {
  opacity: 1;
  transform: translateY(0);
}

.expedition-card:hover {
  transform: translateY(-5px);
  border-color: #c9a84c;
}

.card-image {
  position: absolute;
  inset: 0;
}

.card-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 8s ease;
}

.expedition-card:hover img {
  transform: scale(1.05);
}

.card-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    to top,
    rgba(4, 26, 43, 0.98) 0%,
    rgba(4, 26, 43, 0.82) 28%,
    rgba(4, 26, 43, 0.25) 58%,
    transparent 85%
  );
  z-index: 1;
}

.card-content {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 2;
  padding: 2.5rem 2rem 2rem;
}

.card-title {
  color: #f8f5ef;
  font-family: 'Playfair Display', serif;
  font-size: clamp(2rem, 3vw, 3.2rem);
  line-height: 1;
  font-weight: 300;
  margin-bottom: 1rem;
  letter-spacing: 0.02em;
}

.card-meta {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.7rem;
  color: #c9a84c;
  font-size: 0.72rem;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  margin-bottom: 1.7rem;
  font-weight: 600;
}

.dot {
  opacity: 0.6;
}

.feature-list {
  list-style: none;
  padding: 0;
  margin: 0 0 2rem;
  display: grid;
  gap: 0.7rem;
}

.feature-list li {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  color: rgba(255, 255, 255, 0.88);
  font-size: 0.95rem;
  line-height: 1.4;
}

.gold-check {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.card-actions {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  flex-wrap: wrap;
}

.btn-gold {
  height: 48px;
  padding: 0 1.7rem;
  border: none;
  background: #c9a84c;
  color: #071a2b;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  cursor: pointer;
  transition: all 0.35s ease;
}

.btn-gold:hover {
  background: #d7b461;
}

.btn-link {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  border: none;
  background: transparent;
  color: white;
  font-size: 0.72rem;
  font-weight: 600;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  cursor: pointer;
  transition: all 0.35s ease;
}

.btn-link svg {
  transition: transform 0.35s ease;
}

.btn-link:hover svg {
  transform: translateX(4px);
}

@media (max-width: 1024px) {
  .expedition-grid {
    grid-template-columns: 1fr;
  }

  .expedition-card {
    min-height: 580px;
  }
}

@media (max-width: 768px) {
  .expedition-section {
    padding: 3rem 0;
  }

  .expedition-card {
    min-height: 520px;
  }

  .card-content {
    padding: 1.7rem;
  }

  .card-title {
    font-size: 2rem;
  }

  .feature-list li {
    font-size: 0.84rem;
  }

  .card-actions {
    gap: 1rem;
  }

  .btn-gold,
  .btn-link {
    width: 100%;
    justify-content: center;
  }
}

@media (max-width: 480px) {
  .expedition-card {
    min-height: 500px;
  }

  .card-title {
    font-size: 1.7rem;
  }

  .card-meta {
    font-size: 0.62rem;
    gap: 0.5rem;
  }

  .feature-list {
    gap: 0.55rem;
  }

  .feature-list li {
    font-size: 0.78rem;
  }
}
</style>
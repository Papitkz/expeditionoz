<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

type Filter = 'all' | 'ocean-safari' | 'dive-expedition' | 'short' | 'long'
const activeFilter = ref<Filter>('all')

const ALL_DATES = [
  { id: 1, date: 'SAT, 01 MAY 2027', month: 'MAY 2027', expedition: 'Ocean Safari Escape', nights: 3, boat: 'SYLFIA', price: 3000, type: 'ocean-safari' },
  { id: 2, date: 'MON, 03 MAY 2027', month: 'MAY 2027', expedition: 'Dive Expedition', nights: 8, boat: 'MILLENNIUM', price: 9600, type: 'dive-expedition' },
  { id: 3, date: 'TUE, 04 MAY 2027', month: 'MAY 2027', expedition: 'Ocean Safari Expedition', nights: 5, boat: 'SYLFIA', price: 5000, type: 'ocean-safari' },
  { id: 4, date: 'MON, 10 MAY 2027', month: 'MAY 2027', expedition: 'Ocean Safari Escape', nights: 3, boat: 'SYLFIA', price: 3000, type: 'ocean-safari' },
  { id: 5, date: 'WED, 12 MAY 2027', month: 'MAY 2027', expedition: 'Dive Escape', nights: 4, boat: 'MILLENNIUM', price: 4800, type: 'dive-expedition' },
  { id: 6, date: 'THU, 13 MAY 2027', month: 'MAY 2027', expedition: 'Ocean Safari Expedition', nights: 5, boat: 'SYLFIA', price: 5000, type: 'ocean-safari' },
  { id: 7, date: 'SUN, 16 MAY 2027', month: 'MAY 2027', expedition: 'Dive Escape', nights: 4, boat: 'MILLENNIUM', price: 4800, type: 'dive-expedition' },
  { id: 8, date: 'WED, 19 MAY 2027', month: 'MAY 2027', expedition: 'Ocean Safari Escape', nights: 3, boat: 'SYLFIA', price: 3000, type: 'ocean-safari' },
  { id: 9, date: 'FRI, 21 MAY 2027', month: 'MAY 2027', expedition: 'Dive Expedition', nights: 8, boat: 'MILLENNIUM', price: 9600, type: 'dive-expedition' },
  { id: 10, date: 'SAT, 22 MAY 2027', month: 'MAY 2027', expedition: 'Ocean Safari Expedition', nights: 5, boat: 'SYLFIA', price: 5000, type: 'ocean-safari' },
  { id: 11, date: 'FRI, 28 MAY 2027', month: 'MAY 2027', expedition: 'Ocean Safari Escape', nights: 3, boat: 'SYLFIA', price: 3000, type: 'ocean-safari' },
  { id: 12, date: 'SUN, 30 MAY 2027', month: 'MAY 2027', expedition: 'Dive Expedition', nights: 8, boat: 'MILLENNIUM', price: 9600, type: 'dive-expedition' },
  { id: 13, date: 'MON, 31 MAY 2027', month: 'MAY 2027', expedition: 'Ocean Safari Expedition', nights: 5, boat: 'SYLFIA', price: 5000, type: 'ocean-safari' },
  { id: 14, date: 'SUN, 06 JUN 2027', month: 'JUNE 2027', expedition: 'Ocean Safari Escape', nights: 3, boat: 'SYLFIA', price: 3000, type: 'ocean-safari' },
  { id: 15, date: 'TUE, 08 JUN 2027', month: 'JUNE 2027', expedition: 'Dive Expedition', nights: 8, boat: 'MILLENNIUM', price: 9600, type: 'dive-expedition' },
  { id: 16, date: 'WED, 09 JUN 2027', month: 'JUNE 2027', expedition: 'Ocean Safari Expedition', nights: 5, boat: 'SYLFIA', price: 5000, type: 'ocean-safari' },
  { id: 17, date: 'TUE, 15 JUN 2027', month: 'JUNE 2027', expedition: 'Ocean Safari Escape', nights: 3, boat: 'SYLFIA', price: 3000, type: 'ocean-safari' },
  { id: 18, date: 'THU, 17 JUN 2027', month: 'JUNE 2027', expedition: 'Dive Expedition', nights: 8, boat: 'MILLENNIUM', price: 9600, type: 'dive-expedition' },
  { id: 19, date: 'FRI, 18 JUN 2027', month: 'JUNE 2027', expedition: 'Ocean Safari Expedition', nights: 5, boat: 'SYLFIA', price: 5000, type: 'ocean-safari' },
  { id: 20, date: 'THU, 24 JUN 2027', month: 'JUNE 2027', expedition: 'Ocean Safari Escape', nights: 3, boat: 'SYLFIA', price: 3000, type: 'ocean-safari' },
  { id: 21, date: 'SAT, 26 JUN 2027', month: 'JUNE 2027', expedition: 'Dive Expedition', nights: 8, boat: 'MILLENNIUM', price: 9600, type: 'dive-expedition' },
  { id: 22, date: 'SUN, 27 JUN 2027', month: 'JUNE 2027', expedition: 'Ocean Safari Expedition', nights: 5, boat: 'SYLFIA', price: 5000, type: 'ocean-safari' },
  { id: 23, date: 'SAT, 03 JUL 2027', month: 'JULY 2027', expedition: 'Ocean Safari Escape', nights: 3, boat: 'SYLFIA', price: 3000, type: 'ocean-safari' },
  { id: 24, date: 'MON, 05 JUL 2027', month: 'JULY 2027', expedition: 'Dive Expedition', nights: 8, boat: 'MILLENNIUM', price: 9600, type: 'dive-expedition' },
  { id: 25, date: 'TUE, 06 JUL 2027', month: 'JULY 2027', expedition: 'Ocean Safari Expedition', nights: 5, boat: 'SYLFIA', price: 5000, type: 'ocean-safari' },
  { id: 26, date: 'MON, 12 JUL 2027', month: 'JULY 2027', expedition: 'Ocean Safari Escape', nights: 3, boat: 'SYLFIA', price: 3000, type: 'ocean-safari' },
  { id: 27, date: 'WED, 14 JUL 2027', month: 'JULY 2027', expedition: 'Dive Expedition', nights: 8, boat: 'MILLENNIUM', price: 9600, type: 'dive-expedition' },
  { id: 28, date: 'THU, 15 JUL 2027', month: 'JULY 2027', expedition: 'Ocean Safari Expedition', nights: 5, boat: 'SYLFIA', price: 5000, type: 'ocean-safari' },
  { id: 29, date: 'WED, 21 JUL 2027', month: 'JULY 2027', expedition: 'Ocean Safari Escape', nights: 3, boat: 'SYLFIA', price: 3000, type: 'ocean-safari' },
  { id: 30, date: 'FRI, 23 JUL 2027', month: 'JULY 2027', expedition: 'Dive Expedition', nights: 8, boat: 'MILLENNIUM', price: 9600, type: 'dive-expedition' },
  { id: 31, date: 'SAT, 24 JUL 2027', month: 'JULY 2027', expedition: 'Ocean Safari Expedition', nights: 5, boat: 'SYLFIA', price: 5000, type: 'ocean-safari' },
  { id: 32, date: 'FRI, 30 JUL 2027', month: 'JULY 2027', expedition: 'Ocean Safari Escape', nights: 3, boat: 'SYLFIA', price: 3000, type: 'ocean-safari' },
  { id: 33, date: 'SUN, 01 AUG 2027', month: 'AUGUST 2027', expedition: 'Dive Expedition', nights: 8, boat: 'MILLENNIUM', price: 9600, type: 'dive-expedition' },
  { id: 34, date: 'MON, 02 AUG 2027', month: 'AUGUST 2027', expedition: 'Ocean Safari Expedition', nights: 5, boat: 'SYLFIA', price: 5000, type: 'ocean-safari' },
  { id: 35, date: 'SUN, 08 AUG 2027', month: 'AUGUST 2027', expedition: 'Ocean Safari Escape', nights: 3, boat: 'SYLFIA', price: 3000, type: 'ocean-safari' },
  { id: 36, date: 'TUE, 10 AUG 2027', month: 'AUGUST 2027', expedition: 'Dive Expedition', nights: 8, boat: 'MILLENNIUM', price: 9600, type: 'dive-expedition' },
  { id: 37, date: 'WED, 11 AUG 2027', month: 'AUGUST 2027', expedition: 'Ocean Safari Expedition', nights: 5, boat: 'SYLFIA', price: 5000, type: 'ocean-safari' },
  { id: 38, date: 'TUE, 17 AUG 2027', month: 'AUGUST 2027', expedition: 'Ocean Safari Escape', nights: 3, boat: 'SYLFIA', price: 3000, type: 'ocean-safari' },
  { id: 39, date: 'THU, 19 AUG 2027', month: 'AUGUST 2027', expedition: 'Dive Expedition', nights: 8, boat: 'MILLENNIUM', price: 9600, type: 'dive-expedition' },
  { id: 40, date: 'FRI, 20 AUG 2027', month: 'AUGUST 2027', expedition: 'Ocean Safari Expedition', nights: 5, boat: 'SYLFIA', price: 5000, type: 'ocean-safari' },
  { id: 41, date: 'THU, 26 AUG 2027', month: 'AUGUST 2027', expedition: 'Ocean Safari Escape', nights: 3, boat: 'SYLFIA', price: 3000, type: 'ocean-safari' },
  { id: 42, date: 'SAT, 28 AUG 2027', month: 'AUGUST 2027', expedition: 'Dive Expedition', nights: 8, boat: 'MILLENNIUM', price: 9600, type: 'dive-expedition' },
  { id: 43, date: 'SUN, 29 AUG 2027', month: 'AUGUST 2027', expedition: 'Ocean Safari Expedition', nights: 5, boat: 'SYLFIA', price: 5000, type: 'ocean-safari' },
  { id: 44, date: 'SAT, 04 SEP 2027', month: 'SEPTEMBER 2027', expedition: 'Ocean Safari Escape', nights: 3, boat: 'SYLFIA', price: 3000, type: 'ocean-safari' },
  { id: 45, date: 'MON, 06 SEP 2027', month: 'SEPTEMBER 2027', expedition: 'Dive Escape', nights: 4, boat: 'MILLENNIUM', price: 4800, type: 'dive-expedition' },
  { id: 46, date: 'TUE, 07 SEP 2027', month: 'SEPTEMBER 2027', expedition: 'Ocean Safari Expedition', nights: 5, boat: 'SYLFIA', price: 5000, type: 'ocean-safari' },
  { id: 47, date: 'FRI, 10 SEP 2027', month: 'SEPTEMBER 2027', expedition: 'Dive Escape', nights: 4, boat: 'MILLENNIUM', price: 4800, type: 'dive-expedition' },
  { id: 48, date: 'MON, 13 SEP 2027', month: 'SEPTEMBER 2027', expedition: 'Ocean Safari Escape', nights: 3, boat: 'SYLFIA', price: 3000, type: 'ocean-safari' },
  { id: 49, date: 'WED, 15 SEP 2027', month: 'SEPTEMBER 2027', expedition: 'Dive Expedition', nights: 8, boat: 'MILLENNIUM', price: 9600, type: 'dive-expedition' },
  { id: 50, date: 'THU, 16 SEP 2027', month: 'SEPTEMBER 2027', expedition: 'Ocean Safari Expedition', nights: 5, boat: 'SYLFIA', price: 5000, type: 'ocean-safari' },
  { id: 51, date: 'WED, 22 SEP 2027', month: 'SEPTEMBER 2027', expedition: 'Ocean Safari Escape', nights: 3, boat: 'SYLFIA', price: 3000, type: 'ocean-safari' },
  { id: 52, date: 'FRI, 24 SEP 2027', month: 'SEPTEMBER 2027', expedition: 'Dive Escape', nights: 4, boat: 'MILLENNIUM', price: 4800, type: 'dive-expedition' },
  { id: 53, date: 'SAT, 25 SEP 2027', month: 'SEPTEMBER 2027', expedition: 'Ocean Safari Expedition', nights: 5, boat: 'SYLFIA', price: 5000, type: 'ocean-safari' },
  { id: 54, date: 'TUE, 28 SEP 2027', month: 'SEPTEMBER 2027', expedition: 'Dive Escape', nights: 4, boat: 'MILLENNIUM', price: 4800, type: 'dive-expedition' },
  { id: 55, date: 'FRI, 01 OCT 2027', month: 'OCTOBER 2027', expedition: 'Ocean Safari Escape', nights: 3, boat: 'SYLFIA', price: 3000, type: 'ocean-safari' },
  { id: 56, date: 'SUN, 03 OCT 2027', month: 'OCTOBER 2027', expedition: 'Dive Expedition', nights: 8, boat: 'MILLENNIUM', price: 9600, type: 'dive-expedition' },
  { id: 57, date: 'MON, 04 OCT 2027', month: 'OCTOBER 2027', expedition: 'Ocean Safari Expedition', nights: 5, boat: 'SYLFIA', price: 5000, type: 'ocean-safari' },
  { id: 58, date: 'SUN, 10 OCT 2027', month: 'OCTOBER 2027', expedition: 'Ocean Safari Escape', nights: 3, boat: 'SYLFIA', price: 3000, type: 'ocean-safari' },
]


const FILTERS = [
  { key: 'all', label: 'ALL DATES' },
  { key: 'ocean-safari', label: 'OCEAN SAFARI', icon: 'turtle' },
  { key: 'dive-expedition', label: 'DIVE EXPEDITION', icon: 'dive' },
  { key: 'short', label: '3–4 NIGHTS' },
  { key: 'long', label: '5+ NIGHTS' },
]

const filtered = computed(() => {
  return ALL_DATES.filter((d) => {
    if (activeFilter.value === 'all') return true
    if (activeFilter.value === 'ocean-safari') return d.type === 'ocean-safari'
    if (activeFilter.value === 'dive-expedition') return d.type === 'dive-expedition'
    if (activeFilter.value === 'short') return d.nights <= 4
    if (activeFilter.value === 'long') return d.nights >= 5
    return true
  })
})

const grouped = computed(() => {
  const groups: Record<string, typeof ALL_DATES> = {}
  for (const d of filtered.value) {
    if (!groups[d.month]) groups[d.month] = []
    groups[d.month].push(d)
  }
  return groups
})

function formatPrice(n: number) {
  return `From $${n.toLocaleString()}`
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
      { threshold: 0.04 }
    )
  }
  document.querySelectorAll('.dates-reveal:not(.show)').forEach((el) =>
    observer?.observe(el)
  )
}

onMounted(async () => {
  await nextTick()
  setupObserver()
})

watch(filtered, async () => {
  await nextTick()
  setupObserver()
})

onUnmounted(() => {
  observer?.disconnect()
})
</script>

<template>
  <div class="dates-page">
    <!-- Hero -->
    <div class="dates-hero dates-reveal">
      <div class="hero-bg">
        <img src="/images/sylvia-hero.jpg" alt="Expedition Oz" class="hero-img" />
        <div class="hero-overlay"></div>
      </div>
      <div class="hero-content">
     
        <h1 class="hero-title">2027 EXPEDITION DATES</h1>
        <div class="title-divider">
          <div class="divider-line-main"></div>
        </div>
        <p class="hero-sub">All departures. All expeditions. Both boats.</p>
        <p class="hero-body">
          Plan your Ningaloo adventure. All available departures are listed below in chronological order.
        </p>
      </div>
    </div>

    <!-- Filter bar -->
    <div class="filter-bar dates-reveal" style="transition-delay: 0.1s">
      <span class="filter-label">FILTER DATES</span>
      <div class="filter-pills">
        <button
          v-for="f in FILTERS"
          :key="f.key"
          class="filter-pill"
          :class="{ active: activeFilter === f.key }"
          @click="activeFilter = f.key as Filter"
        >
          <svg v-if="f.icon === 'turtle'" width="15" height="15" viewBox="0 0 24 24" fill="none" class="pill-icon">
            <ellipse cx="12" cy="12" rx="5" ry="4" stroke="currentColor" stroke-width="1.5"/>
            <path d="M7 8c-1-2-3-2-4-1M17 8c1-2 3-2 4-1M7 16c-1 2-3 2-4 1M17 16c1 2 3 2 4 1M12 8v-3M12 16v3" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>
          </svg>
          <svg v-else-if="f.icon === 'dive'" width="15" height="15" viewBox="0 0 24 24" fill="none" class="pill-icon">
            <path d="M12 12 C8 8 3 10 4 14 C5 17 9 16 12 14 C15 16 19 17 20 14 C21 10 16 8 12 12Z" stroke="currentColor" stroke-width="1.5" fill="none"/>
            <path d="M12 14 L12 19" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
          </svg>
          {{ f.label }}
        </button>
      </div>
      <span class="aud-note">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6">
          <circle cx="12" cy="12" r="9"/>
          <path d="M12 8v4M12 16h.01" stroke-linecap="round"/>
        </svg>
        All prices shown in AUD
      </span>
    </div>

    <!-- Table -->
    <div class="dates-table-wrap dates-reveal" style="transition-delay: 0.2s">
      <table class="dates-table " >
        <colgroup>
          <col class="col-date" />
          <col class="col-exp" />
          <col class="col-nights" />
          <col class="col-boat" />
          <col class="col-price" />
          <col class="col-book" />
        </colgroup>
        <thead>
          <tr>
            <th class="th-date">DEPARTURE DATE</th>
            <th class="th-exp">EXPEDITION</th>
            <th class="th-nights">NIGHTS</th>
            <th class="th-boat">BOAT</th>
            <th class="th-price">FROM PRICE (AUD)</th>
            <th class="th-book">BOOK</th>
          </tr>
        </thead>
        <tbody>
          <template v-for="(rows, month) in grouped" :key="month">
            <tr class="month-row">
              <td colspan="6">
                <span class="month-dot">◆</span>
                {{ month }}
                <span class="month-dot">◆</span>
              </td>
            </tr>
            <tr v-for="row in rows" :key="row.id" class="date-row">
              <td class="td-date">
                <span class="cell-inner cell-inner-left">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#c9a84c" stroke-width="1.5" class="row-icon">
                    <rect x="3" y="4" width="18" height="18" rx="2"/>
                    <path d="M3 9h18M8 2v4M16 2v4"/>
                  </svg>
                  <span class="cell-text">{{ row.date }}</span>
                </span>
              </td>
              <td class="td-exp">
                <span class="cell-inner cell-inner-left">
                  <svg v-if="row.type === 'ocean-safari'" width="16" height="16" viewBox="0 0 100 100" fill="none" class="row-icon">
                    <ellipse cx="50" cy="52" rx="18" ry="12" stroke="#C9A84C" stroke-width="3"/>
                    <ellipse cx="50" cy="50" rx="10" ry="8" fill="none" stroke="#C9A84C" stroke-width="2.5"/>
                    <path d="M32 52 Q22 44 26 36 Q34 42 32 52Z" stroke="#C9A84C" stroke-width="2.5" fill="none"/>
                    <path d="M68 52 Q78 44 74 36 Q66 42 68 52Z" stroke="#C9A84C" stroke-width="2.5" fill="none"/>
                    <ellipse cx="50" cy="34" rx="8" ry="6" stroke="#C9A84C" stroke-width="3"/>
                    <circle cx="47" cy="32" r="3" fill="#C9A84C"/>
                  </svg>
                  <svg v-else width="16" height="16" viewBox="0 0 100 100" fill="none" class="row-icon">
                    <path d="M50 50 C30 30 10 45 15 60 C20 72 40 65 50 60 C60 65 80 72 85 60 C90 45 70 30 50 50Z" stroke="#C9A84C" stroke-width="3" fill="none"/>
                    <path d="M50 60 L50 82 Q53 78 50 72 Q47 78 50 82" stroke="#C9A84C" stroke-width="2.5" fill="none"/>
                    <circle cx="44" cy="55" r="4" fill="#C9A84C" opacity="0.7"/>
                  </svg>
                  <span class="cell-text exp-name">{{ row.expedition }}</span>
                </span>
              </td>
              <td class="td-nights">
                <span class="cell-inner cell-inner-center">
                  {{ row.nights }} NIGHTS
                </span>
              </td>
              <td class="td-boat">
                <span class="cell-inner cell-inner-left">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" class="row-icon" :stroke="row.boat === 'SYLFIA' ? '#C9A84C' : '#7eb8d4'" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M3 18l2-8h14l2 8"/>
                    <path d="M12 3v7M12 10C12 10 7 6 7 3"/>
                    <line x1="2" y1="18" x2="22" y2="18"/>
                  </svg>
                  <span class="cell-text" :class="row.boat === 'SYLFIA' ? 'boat-gold' : 'boat-blue'">{{ row.boat }}</span>
                </span>
              </td>
              <td class="td-price">
                <span class="cell-inner cell-inner-right">
                  {{ formatPrice(row.price) }}
                </span>
              </td>
              <td class="td-book">
                <span class="cell-inner cell-inner-center">
                  <button class="btn-book" @click="router.push('/booking')">BOOK NOW</button>
                </span>
              </td>
            </tr>
          </template>
        </tbody>
      </table>
    </div>

    <!-- Footer -->
    <div class="dates-footer dates-reveal" style="transition-delay: 0.3s">
      <div class="footer-line"></div>
      <p class="footer-text">
        All expeditions depart from Exmouth, Western Australia. Prices are per person in AUD.
        A deposit of 30% is required to secure your booking.
      </p>
      <div class="footer-line"></div>
    </div>
  </div>
</template>

<style scoped>
.dates-page {
  background: #06162a;
  min-height: 100vh;
  font-family: system-ui, -apple-system, sans-serif;
  color: #f8f5ef;
}

/* ── Reveal ── */
.dates-reveal {
  opacity: 0;
  transform: translateY(30px);
  transition: opacity 0.55s ease, transform 0.55s ease;
}
.dates-reveal.show {
  opacity: 1;
  transform: translateY(0);
}

/* ── Hero — full bleed ── */
.dates-hero {
  position: relative;
  height: 360px;
  display: flex;
  align-items: flex-end;
  overflow: hidden;
}
.hero-bg {
  position: absolute;
  inset: 0;
}
.hero-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center 40%;
  display: block;
}
.hero-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    to right,
    rgba(6, 22, 42, 0.94) 40%,
    rgba(6, 22, 42, 0.7) 70%,
    rgba(6, 22, 42, 0.4) 100%
  );
}
.hero-content {
  position: relative;
  z-index: 1;
  padding: 3rem 2rem 3rem;
  max-width: 560px;
}
.header-icon {
  margin-bottom: 0.75rem;
  opacity: 0.85;
}
.hero-title {
  font-family: var(--font-display);
  font-size: clamp(1rem, 4vw, 3rem);
  font-weight: 400;
  color: #f8f5ef;
  letter-spacing: 0.04em;
  margin-bottom: 0.9rem;
  line-height: 1.15;
}
.title-divider {
  display: flex;
  justify-content: flex-start;
  margin-bottom: 0.9rem;
}
.divider-line-main {
  width: 48px;
  height: 1px;
  background: rgba(201, 168, 76, 0.5);
}
.hero-sub {
  font-family: var(--font-display);
  font-size: 1.1rem;
  color: #c9a84c;
  font-weight: 400;
  font-style: italic;
  letter-spacing: 0.03em;
  margin-bottom: 0.75rem;
}
.hero-body {
  color: rgba(248, 245, 239, 0.65);
  font-size: 0.9rem;
  line-height: 1.6;
  max-width: 420px;
  margin: 0;
}

/* ── Filter bar — full bleed ── */
.filter-bar {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
  border-bottom: 1px solid rgba(201, 168, 76, 0.2);
  border-left: none;
  border-right: none;
  border-top: none;
  border-radius: 0;
  padding: 0.9rem 2rem;
  background: rgba(4, 14, 28, 0.6);
}
.filter-label {
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: #c9a84c;
  white-space: nowrap;
}
.filter-pills {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  flex: 1;
}
.filter-pill {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  height: 36px;
  padding: 0 1rem;
  border: 1px solid rgba(201, 168, 76, 0.4);
  background: transparent;
  color: rgba(248, 245, 239, 0.75);
  font-size: 0.66rem;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  cursor: pointer;
  border-radius: 2px;
  transition: all 0.25s ease;
  white-space: nowrap;
}
.filter-pill.active {
  background: #c9a84c;
  border-color: #c9a84c;
  color: #071a2b;
}
.filter-pill:hover:not(.active) {
  border-color: rgba(201, 168, 76, 0.8);
  color: #f8f5ef;
  background: rgba(201, 168, 76, 0.08);
}
.pill-icon {
  flex-shrink: 0;
}
.aud-note {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.72rem;
  color: rgba(248, 245, 239, 0.45);
  white-space: nowrap;
  letter-spacing: 0.03em;
}

/* ── Table — full bleed, no wrapper border ── */
.dates-table-wrap {
  overflow-x: auto;
  border: none;
  border-radius: 0;
  background: transparent;
}

/* ── Column widths ── */
.col-date   { width: 21%; }
.col-exp    { width: 25%; }
.col-nights { width: 11%; }
.col-boat   { width: 14%; }
.col-price  { width: 17%; }
.col-book   { width: 12%; }

/* ── Table base ── */
.dates-table {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
  min-width: 820px;
}

/* ── Thead ── */
.dates-table thead tr {
  background: rgba(4, 14, 28, 0.8);
  border-bottom: 1px solid rgba(201, 168, 76, 0.3);
}
.dates-table th {
  padding: 0.95rem 1rem;
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: #c9a84c;
  white-space: nowrap;
  vertical-align: middle;
}
.th-date   { text-align: left;   padding-left: 2rem; }
.th-exp    { text-align: left; }
.th-nights { text-align: center; }
.th-boat   { text-align: left; }
.th-price  { text-align: right;  padding-right: 2rem; }
.th-book   { text-align: center; }

/* ── Month row ── */
.month-row td {
  background: rgba(201, 168, 76, 0.06);
  color: #c9a84c;
  font-family: var(--font-display);
  font-size: 0.9rem;
  font-weight: 400;
  letter-spacing: 0.08em;
  text-align: center;
  padding: 0.85rem 2rem;
  border-top: 1px solid rgba(201, 168, 76, 0.15);
  border-bottom: 1px solid rgba(201, 168, 76, 0.1);
}
.month-dot {
  font-size: 0.4rem;
  opacity: 0.45;
  margin: 0 0.75rem;
  vertical-align: middle;
}

/* ── Data rows ── */
.date-row {
  border-bottom: 1px solid rgba(201, 168, 76, 0.07);
  transition: background 0.25s ease;
}
.date-row:last-child {
  border-bottom: none;
}
.date-row:hover {
  background: rgba(201, 168, 76, 0.04);
}

/* ── All td base ── */
.dates-table td {
  padding: 0.85rem 1rem;
  vertical-align: middle;
}

/* ── Cell inner wrappers ── */
.cell-inner {
  display: flex;
  align-items: center;
  width: 100%;
}
.cell-inner-left   { justify-content: flex-start; }
.cell-inner-center { justify-content: center; }
.cell-inner-right  { justify-content: flex-end; }

/* ── Per-column td alignment ── */
.td-date   { text-align: left;   padding-left: 2rem; }
.td-exp    { text-align: left; }
.td-nights { text-align: center; }
.td-boat   { text-align: left; }
.td-price  { text-align: right;  padding-right: 2rem; }
.td-book   { text-align: center; }

/* ── Cell content ── */
.row-icon {
  flex-shrink: 0;
  margin-right: 0.55rem;
  vertical-align: middle;
}
.cell-text {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.td-date .cell-text {
  color: #f8f5ef;
  font-weight: 600;
  font-size: 0.82rem;
  letter-spacing: 0.02em;
}

.exp-name {
  color: #c9a84c;
  font-weight: 500;
  font-size: 0.84rem;
}

.td-nights {
  color: rgba(248, 245, 239, 0.7);
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.1em;
}

.boat-gold {
  color: #c9a84c;
  font-weight: 600;
  font-size: 0.78rem;
  letter-spacing: 0.06em;
}
.boat-blue {
  color: #7eb8d4;
  font-weight: 600;
  font-size: 0.78rem;
  letter-spacing: 0.06em;
}

.td-price {
  color: #c9a84c;
  font-weight: 600;
  font-size: 0.84rem;
  letter-spacing: 0.02em;
}

/* ── Book button ── */
.btn-book {
  height: 36px;
  padding: 0 1.1rem;
  border: none;
  background: #c9a84c;
  color: #071a2b;
  font-size: 0.64rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  cursor: pointer;
  border-radius: 2px;
  transition: background 0.25s ease, transform 0.2s ease;
  white-space: nowrap;
}
.btn-book:hover {
  background: #d7b461;
  transform: translateY(-1px);
}
.btn-book:active {
  transform: translateY(0);
}

/* ── Footer — full bleed ── */
.dates-footer {
  padding: 0 2rem;
}
.footer-line {
  width: 100%;
  height: 1px;
  background: rgba(201, 168, 76, 0.12);
}
.footer-text {
  color: rgba(248, 245, 239, 0.35);
  font-size: 0.76rem;
  line-height: 1.7;
  text-align: center;
  padding: 1.25rem 0;
  letter-spacing: 0.02em;
}

/* ── Responsive ── */
@media (max-width: 900px) {
  .hero-content {
    padding: 2rem 1.5rem;
  }
  .dates-hero {
    height: 300px;
  }
  .filter-bar,
  .th-date,
  .td-date,
  .month-row td {
    padding-left: 1.25rem;
  }
  .th-price,
  .td-price {
    padding-right: 1.25rem;
  }
  .dates-footer {
    padding: 0 1.25rem;
  }
}

@media (max-width: 640px) {
  .dates-hero {
    height: 260px;
  }
  .hero-content {
    padding: 1.5rem 1rem;
  }
  .filter-bar {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.6rem;
    padding: 0.75rem 1rem;
  }
  .filter-pills {
    width: 100%;
    overflow-x: auto;
    flex-wrap: nowrap;
    padding-bottom: 0.25rem;
  }
  .filter-pill {
    flex-shrink: 0;
  }
  .aud-note {
    margin-left: 0;
  }
  .dates-table th {
    padding: 0.75rem 0.6rem;
    font-size: 0.6rem;
    letter-spacing: 0.1em;
  }
  .dates-table td {
    padding: 0.75rem 0.6rem;
  }
  .th-date,
  .td-date {
    padding-left: 0.6rem;
  }
  .th-price,
  .td-price {
    padding-right: 0.6rem;
  }
  .month-row td {
    padding: 0.7rem 0.6rem;
  }
  .row-icon {
    width: 12px;
    height: 12px;
    margin-right: 0.35rem;
  }
  .td-date .cell-text {
    font-size: 0.75rem;
  }
  .exp-name {
    font-size: 0.76rem;
  }
  .td-nights {
    font-size: 0.65rem;
  }
  .boat-gold, .boat-blue {
    font-size: 0.7rem;
  }
  .td-price {
    font-size: 0.76rem;
  }
  .btn-book {
    height: 32px;
    padding: 0 0.7rem;
    font-size: 0.58rem;
  }
  .month-row td {
    font-size: 0.8rem;
  }
  .month-dot {
    margin: 0 0.4rem;
  }
  .dates-footer {
    padding: 0 1rem;
  }
}
.col-date,
.col-exp,
.col-nights,
.col-boat,
.col-price,
.col-book {
  width: auto;
}
</style>
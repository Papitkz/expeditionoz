<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRezdy } from '@/composables/useRezdy'

// ─── Props ────────────────────────────────────────────────────────────────────
const props = withDefaults(defineProps<{
  /** 'ocean-safari' | 'dive-expedition' | 'both' */
  mode?: 'ocean-safari' | 'dive-expedition' | 'both'
  /** Show the inline embedded widget (iframe) or open in a new tab */
  display?: 'inline' | 'modal' | 'redirect'
}>(), {
  mode: 'both',
  display: 'modal',
})

// ─── Rezdy config ─────────────────────────────────────────────────────────────
const { getBookingWidgetUrl, loadRezdyConfig, companyCode } = useRezdy()

const oceanSafariUrl  = ref<string | null>(null)
const diveExpeditionUrl = ref<string | null>(null)

onMounted(async () => {
  await loadRezdyConfig()
  oceanSafariUrl.value    = getBookingWidgetUrl('ocean-safari')
  diveExpeditionUrl.value = getBookingWidgetUrl('dive-expedition')
})

// ─── Active product ───────────────────────────────────────────────────────────
const activeSlug = ref<'ocean-safari' | 'dive-expedition'>(
  props.mode === 'dive-expedition' ? 'dive-expedition' : 'ocean-safari'
)

const activeUrl = computed(() =>
  activeSlug.value === 'ocean-safari' ? oceanSafariUrl.value : diveExpeditionUrl.value
)

// ─── Modal state ──────────────────────────────────────────────────────────────
const modalOpen   = ref(false)
const iframeLoaded = ref(false)

function openModal(slug: 'ocean-safari' | 'dive-expedition') {
  activeSlug.value = slug
  iframeLoaded.value = false
  if (props.display === 'redirect' && activeUrl.value) {
    window.open(activeUrl.value, '_blank', 'noopener,noreferrer')
    return
  }
  modalOpen.value = true
  document.body.style.overflow = 'hidden'
}

function closeModal() {
  modalOpen.value = false
  document.body.style.overflow = ''
}

// Close on Escape
function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') closeModal()
}

onMounted(() => window.addEventListener('keydown', handleKeydown))
onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
  document.body.style.overflow = ''
})

// ─── Tour meta ─────────────────────────────────────────────────────────────────
const tours = {
  'ocean-safari': {
    title: 'Ocean Safari',
    subtitle: '6 DAYS · 5 NIGHTS',
    tagline: 'Ningaloo Reef',
    description: 'Sail, snorkel and breathe in the wild — whales, whale sharks, and open ocean.',
    accent: '#c9a84c',
  },
  'dive-expedition': {
    title: 'Dive Expedition',
    subtitle: '9 DAYS · 8 NIGHTS',
    tagline: 'Ningaloo Reef',
    description: 'Full scuba operations, RIB expeditions, and seasonal whale shark encounters.',
    accent: '#0d6e7a',
  },
}
</script>

<template>
  <!-- ─── Inline card / button trigger ───────────────────────────────────────── -->
  <div class="rezdy-widget">

    <!-- BOTH MODE: two cards side by side -->
    <div v-if="mode === 'both'" class="card-grid">
      <div
        v-for="(slug, i) in (['ocean-safari', 'dive-expedition'] as const)"
        :key="slug"
        class="tour-card"
        :class="slug"
      >
        <!-- ornament line -->
        <span class="card-ornament"></span>

        <div class="card-body">
          <p class="card-location">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="mr-1 inline">
              <path d="M12 2a7 7 0 0 1 7 7c0 5.25-7 13-7 13S5 14.25 5 9a7 7 0 0 1 7-7z"/>
              <circle cx="12" cy="9" r="2.5"/>
            </svg>
            {{ tours[slug].tagline }}
          </p>

          <h3 class="card-title">{{ tours[slug].title }}</h3>
          <p class="card-subtitle">{{ tours[slug].subtitle }}</p>
          <p class="card-desc">{{ tours[slug].description }}</p>
        </div>

        <button class="book-btn" :class="slug" @click="openModal(slug)">
          Book This Expedition
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="ml-2 inline">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
        </button>
      </div>
    </div>

    <!-- SINGLE MODE: just a button -->
    <div v-else class="single-wrap">
      <button
        class="book-btn"
        :class="mode"
        @click="openModal(mode as 'ocean-safari' | 'dive-expedition')"
      >
        Book Now
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="ml-2 inline">
          <polyline points="9 18 15 12 9 6"/>
        </svg>
      </button>
    </div>

    <!-- ─── Modal overlay ──────────────────────────────────────────────────── -->
    <Teleport to="body">
      <Transition name="modal">
        <div
          v-if="modalOpen"
          class="modal-overlay"
          role="dialog"
          aria-modal="true"
          :aria-label="`Book ${tours[activeSlug].title}`"
          @click.self="closeModal"
        >
          <div class="modal-panel">

            <!-- Header -->
            <div class="modal-header">
              <div class="modal-header-left">
                <!-- Tab switcher (only visible in 'both' mode) -->
                <div v-if="mode === 'both'" class="tab-switcher">
                  <button
                    v-for="slug in (['ocean-safari', 'dive-expedition'] as const)"
                    :key="slug"
                    class="tab-btn"
                    :class="{ active: activeSlug === slug }"
                    @click="activeSlug = slug; iframeLoaded = false"
                  >
                    {{ tours[slug].title }}
                  </button>
                </div>

                <!-- Single mode title -->
                <div v-else class="modal-title-block">
                  <span class="modal-eyebrow">{{ tours[activeSlug].tagline }}</span>
                  <h2 class="modal-title">{{ tours[activeSlug].title }}</h2>
                </div>
              </div>

              <button class="close-btn" aria-label="Close booking" @click="closeModal">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            <!-- Gold rule -->
            <div class="modal-rule"></div>

            <!-- Iframe area -->
            <div class="modal-body">
              <!-- Loading shimmer -->
              <Transition name="fade">
                <div v-if="!iframeLoaded" class="iframe-loader">
                  <div class="loader-compass">
                    <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                      <circle cx="20" cy="20" r="17" stroke="rgba(201,168,76,.25)" stroke-width="1.5"/>
                      <circle cx="20" cy="20" r="17" stroke="#c9a84c" stroke-width="1.5"
                        stroke-dasharray="40 68" stroke-dashoffset="0"
                        class="spinner-arc"/>
                      <circle cx="20" cy="3" r="2" fill="#c9a84c"/>
                      <circle cx="20" cy="37" r="1" fill="rgba(201,168,76,.4)"/>
                    </svg>
                  </div>
                  <p class="loader-text">Loading Rezdy booking…</p>
                </div>
              </Transition>

              <!-- No config fallback -->
              <div v-if="!activeUrl" class="no-config">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#c9a84c" stroke-width="1.5">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/>
                  <line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                <p>Rezdy booking not configured.<br/>Please set your <code>rezdy_company_code</code> and product IDs in CMS settings.</p>
              </div>

              <!-- Rezdy iframe -->
              <iframe
                v-if="activeUrl"
                :key="activeUrl"
                :src="activeUrl"
                class="rezdy-iframe"
                :class="{ visible: iframeLoaded }"
                frameborder="0"
                allow="payment"
                title="Rezdy Booking Widget"
                @load="iframeLoaded = true"
              />
            </div>

            <!-- Footer note -->
            <div class="modal-footer">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#c9a84c" stroke-width="2">
                <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
              <span>Secure booking via Rezdy · No payment required to hold your spot</span>
            </div>

          </div>
        </div>
      </Transition>
    </Teleport>

  </div>
</template>

<style scoped>
/* ── Base ─────────────────────────────────────────────────────────────────── */
.rezdy-widget {
  font-family: var(--font-body, 'Inter', system-ui, sans-serif);
}

/* ── Two-card grid ────────────────────────────────────────────────────────── */
.card-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
}

@media (max-width: 640px) {
  .card-grid { grid-template-columns: 1fr; }
}

.tour-card {
  position: relative;
  background: rgba(10, 46, 74, 0.55);
  border: 1px solid rgba(201, 168, 76, 0.18);
  padding: 2rem 1.75rem 1.75rem;
  display: flex;
  flex-direction: column;
  transition: border-color 0.35s, background 0.35s;
}

.tour-card:hover {
  background: rgba(10, 46, 74, 0.75);
  border-color: rgba(201, 168, 76, 0.4);
}

.tour-card.dive-expedition {
  border-color: rgba(13, 110, 122, 0.3);
}

.tour-card.dive-expedition:hover {
  border-color: rgba(13, 110, 122, 0.6);
}

/* top accent line */
.card-ornament {
  position: absolute;
  inset: 0 0 auto;
  height: 2px;
  background: linear-gradient(90deg, #c9a84c 0%, transparent 100%);
}

.tour-card.dive-expedition .card-ornament {
  background: linear-gradient(90deg, #0d6e7a 0%, transparent 100%);
}

.card-body { flex: 1; margin-bottom: 1.5rem; }

.card-location {
  font-family: var(--font-heading, 'Montserrat', sans-serif);
  font-size: 0.6rem;
  font-weight: 600;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: #c9a84c;
  margin-bottom: 0.875rem;
  display: flex;
  align-items: center;
  gap: 0.3rem;
}

.tour-card.dive-expedition .card-location { color: #0d6e7a; }

.card-title {
  font-family: var(--font-display, 'Cormorant Garamond', Georgia, serif);
  font-size: 1.85rem;
  font-weight: 300;
  color: var(--color-sand-100, #f8f5ef);
  line-height: 1.1;
  margin-bottom: 0.35rem;
  letter-spacing: 0.02em;
}

.card-subtitle {
  font-family: var(--font-heading, 'Montserrat', sans-serif);
  font-size: 0.6rem;
  font-weight: 600;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: rgba(248, 245, 239, 0.45);
  margin-bottom: 1rem;
}

.card-desc {
  font-size: 0.82rem;
  line-height: 1.65;
  color: rgba(248, 245, 239, 0.6);
}

/* ── Book button ──────────────────────────────────────────────────────────── */
.book-btn {
  display: inline-flex;
  align-items: center;
  padding: 0.75rem 1.5rem;
  font-family: var(--font-heading, 'Montserrat', sans-serif);
  font-size: 0.65rem;
  font-weight: 700;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  cursor: pointer;
  border: none;
  transition: all 0.3s ease;
}

.book-btn.ocean-safari {
  background: #c9a84c;
  color: #071a2b;
}

.book-btn.ocean-safari:hover {
  background: #e8c05a;
  transform: translateY(-1px);
  box-shadow: 0 6px 24px rgba(201,168,76,.25);
}

.book-btn.dive-expedition {
  background: #0d6e7a;
  color: #f8f5ef;
}

.book-btn.dive-expedition:hover {
  background: #0f7e8c;
  transform: translateY(-1px);
  box-shadow: 0 6px 24px rgba(13,110,122,.3);
}

.single-wrap { display: inline-block; }

/* ── Modal overlay ────────────────────────────────────────────────────────── */
.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: rgba(7, 26, 43, 0.88);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
}

.modal-panel {
  position: relative;
  width: 100%;
  max-width: 860px;
  max-height: 90dvh;
  background: #0a2e4a;
  border: 1px solid rgba(201, 168, 76, 0.25);
  display: flex;
  flex-direction: column;
  box-shadow: 0 30px 80px rgba(0,0,0,.6);
  overflow: hidden;
}

/* ── Modal header ─────────────────────────────────────────────────────────── */
.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.25rem 1.75rem;
  gap: 1rem;
}

.modal-header-left { flex: 1; min-width: 0; }

.modal-rule {
  height: 1px;
  background: linear-gradient(90deg, #c9a84c 0%, rgba(201,168,76,.08) 60%, transparent 100%);
  margin: 0;
  flex-shrink: 0;
}

/* Tab switcher */
.tab-switcher {
  display: flex;
  gap: 0;
  border: 1px solid rgba(201, 168, 76, 0.2);
  width: fit-content;
}

.tab-btn {
  padding: 0.55rem 1.25rem;
  font-family: var(--font-heading, 'Montserrat', sans-serif);
  font-size: 0.6rem;
  font-weight: 700;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: rgba(248, 245, 239, 0.45);
  background: transparent;
  border: none;
  cursor: pointer;
  transition: all 0.25s;
  position: relative;
}

.tab-btn.active {
  color: #071a2b;
  background: #c9a84c;
}

.tab-btn:not(.active):hover {
  color: rgba(248, 245, 239, 0.7);
  background: rgba(201, 168, 76, 0.08);
}

/* Single-mode title */
.modal-eyebrow {
  font-family: var(--font-heading, 'Montserrat', sans-serif);
  font-size: 0.58rem;
  font-weight: 600;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: #c9a84c;
  display: block;
  margin-bottom: 0.3rem;
}

.modal-title {
  font-family: var(--font-display, 'Cormorant Garamond', Georgia, serif);
  font-size: 1.5rem;
  font-weight: 300;
  color: #f8f5ef;
  letter-spacing: 0.02em;
}

/* Close button */
.close-btn {
  width: 36px;
  height: 36px;
  background: rgba(248, 245, 239, 0.06);
  border: 1px solid rgba(248, 245, 239, 0.12);
  color: rgba(248, 245, 239, 0.6);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all 0.25s;
}

.close-btn:hover {
  background: rgba(224, 123, 90, 0.15);
  border-color: rgba(224, 123, 90, 0.4);
  color: #e07b5a;
}

/* ── Modal body / iframe ──────────────────────────────────────────────────── */
.modal-body {
  flex: 1;
  position: relative;
  overflow: hidden;
  min-height: 500px;
}

.rezdy-iframe {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  border: none;
  opacity: 0;
  transition: opacity 0.4s ease;
}

.rezdy-iframe.visible {
  opacity: 1;
}

/* Loader */
.iframe-loader {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  background: #0a2e4a;
}

.loader-compass {
  animation: spin 1.6s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.spinner-arc {
  transform-origin: center;
  animation: arc-pulse 1.6s ease-in-out infinite;
}

@keyframes arc-pulse {
  0%, 100% { stroke-dasharray: 40 68; }
  50% { stroke-dasharray: 60 48; }
}

.loader-text {
  font-family: var(--font-heading, 'Montserrat', sans-serif);
  font-size: 0.62rem;
  font-weight: 600;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: rgba(248, 245, 239, 0.35);
}

/* No config state */
.no-config {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  text-align: center;
  padding: 2rem;
}

.no-config p {
  font-size: 0.82rem;
  color: rgba(248, 245, 239, 0.45);
  line-height: 1.7;
}

.no-config code {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.78rem;
  color: #c9a84c;
  background: rgba(201, 168, 76, 0.08);
  padding: 0.1em 0.4em;
}

/* ── Modal footer ─────────────────────────────────────────────────────────── */
.modal-footer {
  padding: 0.75rem 1.75rem;
  border-top: 1px solid rgba(201, 168, 76, 0.1);
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-shrink: 0;
}

.modal-footer span {
  font-family: var(--font-heading, 'Montserrat', sans-serif);
  font-size: 0.58rem;
  font-weight: 500;
  letter-spacing: 0.08em;
  color: rgba(248, 245, 239, 0.3);
}

/* ── Transitions ─────────────────────────────────────────────────────────── */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-active .modal-panel,
.modal-leave-active .modal-panel {
  transition: transform 0.35s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .modal-panel {
  transform: translateY(24px) scale(0.97);
  opacity: 0;
}

.modal-leave-to .modal-panel {
  transform: translateY(12px) scale(0.98);
  opacity: 0;
}

.fade-enter-active,
.fade-leave-active { transition: opacity 0.3s ease; }
.fade-enter-from,
.fade-leave-to { opacity: 0; }

@media (max-width: 640px) {
  .modal-panel {
    max-height: 95dvh;
  }

  .modal-header {
    padding: 1rem 1.25rem;
  }

  .modal-body {
    min-height: 400px;
  }

  .modal-footer {
    padding: 0.625rem 1.25rem;
  }
}
</style>

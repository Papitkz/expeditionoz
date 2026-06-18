<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

const isCalendlyLoaded = ref(false)
const isOpen = ref(false)
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
  isOpen.value = true
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
    isOpen.value = false
  }
}

onMounted(() => {
  loadCalendly()
  window.addEventListener('message', handleCalendlyClose)
  setTimeout(() => { isPulsing.value = false }, 6000)
})

onUnmounted(() => {
  window.removeEventListener('message', handleCalendlyClose)
})
</script>

<template>
  <Transition name="bac-rise">
    <div class="bac-wrapper " aria-live="polite">
      <button
        class="bac-btn"
        :class="{ 'bac-pulse': isPulsing }"
        @click="openCalendly"
        aria-label="Book a call with an adventure partner"
      >
        <span class="bac-icon" aria-hidden="true">
          <svg class="mr-3" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.62 3.4 2 2 0 0 1 3.6 1.22h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.77a16 16 0 0 0 6.29 6.29l.93-.93a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
          </svg>
        </span>
        <span class="bac-label">Book a Call</span>
      </button>
    </div>
  </Transition>
</template>

<style scoped>
.bac-wrapper {
  display: flex;
  align-items: center;
}


.bac-btn {
  display: flex;
  align-items: center;
  padding: 0.75rem 1.35rem;
  background: var(--color-gold-400, #c9a84c);
  color: var(--color-ocean-950, #071a2b);
  border: none;
  border-radius: 0 !important;
  cursor: pointer;
  font-family: 'Montserrat', system-ui, sans-serif;
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  white-space: nowrap;
  box-shadow:
    0 4px 24px rgba(201, 168, 76, 0.45),
    0 2px 8px rgba(0, 0, 0, 0.35);
  transition:
    background 0.25s ease,
    color 0.25s ease,
    transform 0.2s ease,
    box-shadow 0.25s ease;
}

.bac-btn:hover {
  background: var(--color-gold-300, #e8c05a);
  transform: translateY(-2px) scale(1.03);
  box-shadow:
    0 8px 32px rgba(201, 168, 76, 0.55),
    0 2px 8px rgba(0, 0, 0, 0.3);
}

.bac-btn:active {
  transform: translateY(0) scale(0.98);
}

.bac-btn:focus-visible {
  outline: 2px solid var(--color-gold-300, #e8c05a);
  outline-offset: 3px;
}

.bac-icon {
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

@keyframes bac-pulse-ring {
  0%   { box-shadow: 0 0 0 0 rgba(201, 168, 76, 0.55), 0 4px 24px rgba(201, 168, 76, 0.45); }
  70%  { box-shadow: 0 0 0 12px rgba(201, 168, 76, 0), 0 4px 24px rgba(201, 168, 76, 0.45); }
  100% { box-shadow: 0 0 0 0 rgba(201, 168, 76, 0), 0 4px 24px rgba(201, 168, 76, 0.45); }
}

.bac-pulse {
  animation: bac-pulse-ring 1.8s ease-out infinite;
}

.bac-rise-enter-active {
  transition: opacity 0.5s ease, transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
  transition-delay: 0.8s;
}
.bac-rise-enter-from {
  opacity: 0;
  transform: translateY(20px) scale(0.9);
}

:global([data-theme='light']) .bac-btn {
  background: var(--color-gold-400, #9a7e2e);
  color: #fff;
  box-shadow:
    0 4px 24px rgba(154, 126, 46, 0.4),
    0 2px 8px rgba(0, 0, 0, 0.2);
}
:global([data-theme='light']) .bac-btn:hover {
  background: var(--color-gold-300, #c9a84c);
}

@media (prefers-reduced-motion: reduce) {
  .bac-pulse { animation: none; }
  .bac-rise-enter-active { transition: none; }
}
</style>
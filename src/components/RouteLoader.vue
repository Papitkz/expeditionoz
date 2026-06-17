<script setup lang="ts">
defineProps<{ visible: boolean }>()
</script>

<template>
  <Transition name="loader">
    <div v-if="visible" class="route-loader">
      <div class="compass-loader">
        <svg width="96" height="96" viewBox="0 0 96 96" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="48" cy="48" r="46" stroke="rgba(201,168,76,0.25)" stroke-width="1"/>
          <circle cx="48" cy="48" r="38" stroke="rgba(201,168,76,0.12)" stroke-width="0.5"/>
          <circle class="spinner-ring" cx="48" cy="48" r="46" stroke="var(--color-gold-400)" stroke-width="1" stroke-linecap="round" stroke-dasharray="72 216"/>
          <line x1="48" y1="8" x2="48" y2="16" stroke="var(--color-gold-400)" stroke-width="1.5"/>
          <line x1="48" y1="80" x2="48" y2="88" stroke="rgba(201,168,76,0.4)" stroke-width="1"/>
          <line x1="8" y1="48" x2="16" y2="48" stroke="rgba(201,168,76,0.4)" stroke-width="1"/>
          <line x1="80" y1="48" x2="88" y2="48" stroke="rgba(201,168,76,0.4)" stroke-width="1"/>
          <polygon points="48,18 44.5,42 48,48 51.5,42" fill="var(--color-gold-400)"/>
          <polygon points="48,78 44.5,54 48,48 51.5,54" fill="rgba(201,168,76,0.35)"/>
          <circle cx="48" cy="48" r="4" fill="var(--color-gold-400)"/>
          <circle cx="48" cy="48" r="2" fill="var(--color-ocean-950)"/>
          <text x="48" y="6" text-anchor="middle" font-family="'Montserrat',sans-serif" font-size="6" font-weight="700" letter-spacing="1" fill="var(--color-gold-400)">N</text>
          <text x="48" y="93" text-anchor="middle" font-family="'Montserrat',sans-serif" font-size="6" font-weight="600" fill="rgba(201,168,76,0.5)">S</text>
          <text x="92" y="50" text-anchor="middle" font-family="'Montserrat',sans-serif" font-size="6" font-weight="600" fill="rgba(201,168,76,0.5)">E</text>
          <text x="4" y="50" text-anchor="middle" font-family="'Montserrat',sans-serif" font-size="6" font-weight="600" fill="rgba(201,168,76,0.5)">W</text>
        </svg>

        <p class="loader-label">EXPEDITION OZ</p>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.route-loader {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: var(--color-ocean-950);
  display: flex;
  align-items: center;
  justify-content: center;
}

.compass-loader {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}

.spinner-ring {
  transform-origin: 48px 48px;
  animation: compassSpin 1.4s cubic-bezier(0.68, -0.55, 0.27, 1.55) infinite;
}

@keyframes compassSpin {
  0%   { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loader-label {
  font-family: var(--font-heading);
  font-size: 0.6rem;
  font-weight: 600;
  letter-spacing: 0.35em;
  color: var(--color-gold-400);
  opacity: 0.7;
}

.loader-enter-active {
  transition: opacity 0.2s ease;
}

.loader-leave-active {
  transition: opacity 0.45s ease;
}

.loader-enter-from,
.loader-leave-to {
  opacity: 0;
}
</style>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

const compassSpun = ref(false)
const showLoader = ref(true)

onMounted(() => {
  // Start spin animation
  setTimeout(() => {
    compassSpun.value = true
  }, 100)
})

// Expose method to trigger exit animation
const hide = () => {
  showLoader.value = false
}

defineExpose({ hide })
</script>

<template>
  <Transition name="loader-fade">
    <div v-show="showLoader" class="compass-loader">
      <div class="compass-ring" :class="{ 'compass-spinning': compassSpun }">
        <svg width="100" height="100" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="40" cy="40" r="38" stroke="rgba(201,168,76,0.4)" stroke-width="1"/>
          <circle cx="40" cy="40" r="32" stroke="rgba(201,168,76,0.2)" stroke-width="0.5"/>
          <line x1="40" y1="8" x2="40" y2="14" stroke="var(--color-gold-400)" stroke-width="1.5"/>
          <line x1="40" y1="66" x2="40" y2="72" stroke="rgba(201,168,76,0.5)" stroke-width="1"/>
          <line x1="8" y1="40" x2="14" y2="40" stroke="rgba(201,168,76,0.5)" stroke-width="1"/>
          <line x1="66" y1="40" x2="72" y2="40" stroke="rgba(201,168,76,0.5)" stroke-width="1"/>
          <polygon points="40,16 37,36 40,40 43,36" fill="var(--color-gold-400)"/>
          <polygon points="40,64 37,44 40,40 43,44" fill="rgba(201,168,76,0.4)"/>
          <circle cx="40" cy="40" r="3" fill="var(--color-gold-400)"/>
          <text x="40" y="6" text-anchor="middle" font-family="'Montserrat',sans-serif" font-size="5" font-weight="600" letter-spacing="1" fill="var(--color-gold-400)">N</text>
          <text x="40" y="77" text-anchor="middle" font-family="'Montserrat',sans-serif" font-size="5" font-weight="600" letter-spacing="1" fill="rgba(201,168,76,0.6)">S</text>
          <text x="75" y="42" text-anchor="middle" font-family="'Montserrat',sans-serif" font-size="5" font-weight="600" letter-spacing="1" fill="rgba(201,168,76,0.6)">E</text>
          <text x="5" y="42" text-anchor="middle" font-family="'Montserrat',sans-serif" font-size="5" font-weight="600" letter-spacing="1" fill="rgba(201,168,76,0.6)">W</text>
        </svg>
      </div>
      <p class="loader-text">Loading Expedition...</p>
    </div>
  </Transition>
</template>

<style scoped>
.compass-loader {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: var(--color-navy-900, #071a2b);
  gap: 2rem;
}

.compass-ring {
  opacity: 0;
  transform: scale(0.8) rotate(-180deg);
  transition: all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.compass-ring.compass-spinning {
  opacity: 1;
  transform: scale(1) rotate(0deg);
  animation: compassRotate 2s linear infinite;
}

@keyframes compassRotate {
  from { transform: scale(1) rotate(0deg); }
  to { transform: scale(1) rotate(360deg); }
}

.loader-text {
  font-family: var(--font-display, 'Montserrat', sans-serif);
  font-size: 0.75rem;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--color-gold-400, #c9a84c);
  opacity: 0.8;
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 0.4; }
  50% { opacity: 1; }
}

/* Transition animations */
.loader-fade-enter-active,
.loader-fade-leave-active {
  transition: opacity 0.5s ease, transform 0.5s ease;
}

.loader-fade-enter-from,
.loader-fade-leave-to {
  opacity: 0;
  transform: scale(1.05);
}
</style>
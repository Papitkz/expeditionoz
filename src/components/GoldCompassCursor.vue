<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

// Hide on touch devices and when reduced motion is requested
const isTouchDevice = typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches
const prefersReducedMotion = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

const visible = ref(false)
const x = ref(0)
const y = ref(0)
const heading = ref(0) // needle rotation in degrees
const pointerType = ref<'default' | 'link'>('default')

let lastX = 0
let lastY = 0
let raf = 0

function onMove(e: PointerEvent) {
  if (!visible.value) visible.value = true
  x.value = e.clientX
  y.value = e.clientY

  const dx = e.clientX - lastX
  const dy = e.clientY - lastY
  if (Math.abs(dx) > 0.5 || Math.abs(dy) > 0.5) {
    const angle = (Math.atan2(dy, dx) * 180) / Math.PI + 90
    heading.value = angle
  }
  lastX = e.clientX
  lastY = e.clientY

  const target = e.target as HTMLElement | null
  pointerType.value = target?.closest('a, button, [role="button"], input, textarea, select, .clickable')
    ? 'link'
    : 'default'
}

function onLeave() {
  visible.value = false
}
function onEnter() {
  visible.value = true
}
function onDown() {
  pressed.value = true
}
function onUp() {
  pressed.value = false
}

const pressed = ref(false)

onMounted(() => {
  if (isTouchDevice || prefersReducedMotion) return
  document.documentElement.classList.add('gold-compass-cursor-active')
  window.addEventListener('pointermove', onMove, { passive: true })
  window.addEventListener('pointerleave', onLeave)
  window.addEventListener('pointerenter', onEnter)
  window.addEventListener('pointerdown', onDown)
  window.addEventListener('pointerup', onUp)
})

onUnmounted(() => {
  document.documentElement.classList.remove('gold-compass-cursor-active')
  window.removeEventListener('pointermove', onMove)
  window.removeEventListener('pointerleave', onLeave)
  window.removeEventListener('pointerenter', onEnter)
  window.removeEventListener('pointerdown', onDown)
  window.removeEventListener('pointerup', onUp)
  if (raf) cancelAnimationFrame(raf)
})
</script>

<template>
  <div
    v-if="!isTouchDevice && !prefersReducedMotion"
    class="gold-compass-cursor"
    :class="{ 'is-visible': visible, 'is-link': pointerType === 'link', 'is-pressed': pressed }"
    :style="{ transform: `translate3d(${x}px, ${y}px, 0)` }"
    aria-hidden="true"
  >
    <svg width="34" height="34" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" class="compass-svg">
      <circle cx="40" cy="40" r="37" stroke="rgba(201,168,76,0.55)" stroke-width="1.5" />
      <circle cx="40" cy="40" r="30" stroke="rgba(201,168,76,0.25)" stroke-width="0.75" />
      <line x1="40" y1="6" x2="40" y2="13" stroke="#c9a84c" stroke-width="1.5" />
      <line x1="40" y1="67" x2="40" y2="74" stroke="rgba(201,168,76,0.5)" stroke-width="1" />
      <line x1="6" y1="40" x2="13" y2="40" stroke="rgba(201,168,76,0.5)" stroke-width="1" />
      <line x1="67" y1="40" x2="74" y2="40" stroke="rgba(201,168,76,0.5)" stroke-width="1" />
      <g class="compass-needle" :style="{ transform: `rotate(${heading}deg)` }">
        <polygon points="40,14 36,40 40,46 44,40" fill="#c9a84c" />
        <polygon points="40,66 36,40 40,46 44,40" fill="rgba(201,168,76,0.35)" />
      </g>
      <circle cx="40" cy="40" r="3" fill="#c9a84c" />
    </svg>
  </div>
</template>

<style scoped>
.gold-compass-cursor {
  position: fixed;
  top: 0;
  left: 0;
  width: 34px;
  height: 34px;
  margin-left: -17px;
  margin-top: -17px;
  pointer-events: none;
  z-index: 10000;
  opacity: 0;
  transition: opacity 0.25s ease, scale 0.2s ease;
  will-change: transform;
  filter: drop-shadow(0 0 6px rgba(201, 168, 76, 0.45));
}

.gold-compass-cursor.is-visible {
  opacity: 1;
}

.gold-compass-cursor.is-link .compass-svg {
  transform: scale(1.25);
}

.gold-compass-cursor.is-pressed .compass-svg {
  transform: scale(0.85);
}

.compass-svg {
  display: block;
  transition: transform 0.18s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.compass-needle {
  transform-origin: 40px 40px;
  transition: transform 0.12s linear;
}
</style>

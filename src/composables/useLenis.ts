import { onMounted, onUnmounted } from 'vue'
import Lenis from 'lenis'

let lenis: Lenis | null = null
let rafId: number | null = null

export function useLenis() {
  onMounted(() => {
    // Don't initialise on touch devices — they already have native momentum scroll
    if (typeof window === 'undefined' || window.matchMedia('(pointer: coarse)').matches) return

    lenis = new Lenis({
      duration: 0.9,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    })

    function raf(time: number) {
      lenis!.raf(time)
      rafId = requestAnimationFrame(raf)
    }

    rafId = requestAnimationFrame(raf)
  })

  onUnmounted(() => {
    if (rafId !== null) {
      cancelAnimationFrame(rafId)
      rafId = null
    }
    lenis?.destroy()
    lenis = null
  })
}

export function getLenis() {
  return lenis
}

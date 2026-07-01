import { ref, onMounted, onUnmounted, type Ref } from 'vue'

interface ParallaxOptions {
  /** How much the element moves relative to scroll (0 = none, 0.4 = moderate, 1 = 1:1) */
  speed?: number
  /** Clamp range in px so image doesn't travel too far */
  clamp?: number
  /** Whether to apply on mobile too (default: false — mobile perf) */
  enableOnMobile?: boolean
}

/**
 * useParallax — attaches a smooth, rAF-driven parallax transform to a ref element.
 *
 * Usage:
 *   const el = ref<HTMLElement | null>(null)
 *   useParallax(el, { speed: 0.3 })
 *   <div ref="el">…</div>
 */
export function useParallax(
  target: Ref<HTMLElement | null>,
  opts: ParallaxOptions = {}
) {
  const { speed = 0.3, clamp = 120, enableOnMobile = false } = opts

  let rafId: number | null = null
  let ticking = false
  let isMobile = false

  const checkMobile = () => {
    isMobile = window.innerWidth < 768
  }

  const applyParallax = () => {
    if (!target.value) return
    if (isMobile && !enableOnMobile) return

    const rect = target.value.getBoundingClientRect()
    const windowH = window.innerHeight

    // Only animate when at least partially visible
    if (rect.bottom < -100 || rect.top > windowH + 100) return

    // How far the element centre is from the viewport centre
    const centerY = rect.top + rect.height / 2
    const delta = (centerY - windowH / 2) * speed

    // Clamp to avoid revealing empty space
    const clamped = Math.max(-clamp, Math.min(clamp, delta))

    target.value.style.transform = `translate3d(0, ${clamped}px, 0)`
    target.value.style.willChange = 'transform'
  }

  const onScroll = () => {
    if (ticking) return
    ticking = true
    rafId = requestAnimationFrame(() => {
      applyParallax()
      ticking = false
    })
  }

  const onResize = () => {
    checkMobile()
    applyParallax()
  }

  onMounted(() => {
    checkMobile()
    applyParallax()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onResize, { passive: true })
  })

  onUnmounted(() => {
    window.removeEventListener('scroll', onScroll)
    window.removeEventListener('resize', onResize)
    if (rafId) cancelAnimationFrame(rafId)
    if (target.value) {
      target.value.style.transform = ''
      target.value.style.willChange = ''
    }
  })
}

/**
 * useParallaxBg — applies parallax as a CSS background-position offset.
 * Useful when the element IS the container (no overflow clip needed).
 */
export function useParallaxBg(
  target: Ref<HTMLElement | null>,
  opts: ParallaxOptions = {}
) {
  const { speed = 0.2, clamp = 80, enableOnMobile = false } = opts
  let rafId: number | null = null
  let ticking = false
  let isMobile = false

  const checkMobile = () => { isMobile = window.innerWidth < 768 }

  const apply = () => {
    if (!target.value) return
    if (isMobile && !enableOnMobile) return

    const rect = target.value.getBoundingClientRect()
    const windowH = window.innerHeight
    if (rect.bottom < -200 || rect.top > windowH + 200) return

    const centerY = rect.top + rect.height / 2
    const delta = (centerY - windowH / 2) * speed
    const clamped = Math.max(-clamp, Math.min(clamp, delta))

    target.value.style.backgroundPositionY = `calc(50% + ${clamped}px)`
  }

  const onScroll = () => {
    if (ticking) return
    ticking = true
    rafId = requestAnimationFrame(() => { apply(); ticking = false })
  }

  onMounted(() => {
    checkMobile()
    apply()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', () => { checkMobile(); apply() }, { passive: true })
  })

  onUnmounted(() => {
    window.removeEventListener('scroll', onScroll)
    if (rafId) cancelAnimationFrame(rafId)
  })
}

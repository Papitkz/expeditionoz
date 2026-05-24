import { onMounted, onUnmounted } from 'vue'

export function useScrollReveal() {
  let observer: IntersectionObserver | null = null

  function initReveal() {
    observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible')
          }
        })
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    )

    const elements = document.querySelectorAll('.section-reveal, .section-reveal-left, .section-reveal-right')
    elements.forEach((el) => observer!.observe(el))
  }

  onMounted(() => {
    setTimeout(initReveal, 100)
  })

  onUnmounted(() => {
    observer?.disconnect()
  })

  return { initReveal }
}

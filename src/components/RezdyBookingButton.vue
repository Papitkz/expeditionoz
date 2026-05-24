<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRezdy } from '@/composables/useRezdy'

const props = defineProps<{
  slug: string
  label?: string
  variant?: 'primary' | 'outline'
}>()

const { getBookingUrl, hasRezdyIntegration, loadRezdyConfig } = useRezdy()
const bookingUrl = ref<string | null>(null)
const hasRezdy = ref(false)

onMounted(async () => {
  await loadRezdyConfig()
  bookingUrl.value = getBookingUrl(props.slug)
  hasRezdy.value = hasRezdyIntegration()
})

const fallbackLink = computed(() => `/contact`)

const buttonLabel = computed(() => {
  if (props.label) return props.label
  return hasRezdy.value ? 'Book Now' : 'Check Availability'
})
</script>

<template>
  <a
    v-if="bookingUrl && hasRezdy"
    :href="bookingUrl"
    target="_blank"
    rel="noopener noreferrer"
    :class="variant === 'outline' ? 'btn-outline' : 'btn-primary'"
    class="rezdy-btn"
  >
    {{ buttonLabel }}
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="ml-1.5 inline-block">
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
    </svg>
  </a>
  <router-link
    v-else
    :to="fallbackLink"
    :class="variant === 'outline' ? 'btn-outline' : 'btn-primary'"
  >
    {{ buttonLabel }}
  </router-link>
</template>

<style scoped>
.rezdy-btn {
  display: inline-flex;
  align-items: center;
  text-decoration: none;
}
</style>

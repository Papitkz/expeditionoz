import { ref, computed } from 'vue'

export interface DateRange {
  start: string
  end: string
}

export function useDateRange() {
  const startDate = ref('')
  const endDate = ref('')

  const dateRange = computed<DateRange | null>(() => {
    if (!startDate.value || !endDate.value) return null
    return {
      start: startDate.value,
      end: endDate.value,
    }
  })

  const formattedRange = computed(() => {
    if (!dateRange.value) return ''
    const start = new Date(dateRange.value.start)
    const end = new Date(dateRange.value.end)

    const options: Intl.DateTimeFormatOptions = { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric' 
    }

    return `${start.toLocaleDateString('en-AU', options)} – ${end.toLocaleDateString('en-AU', options)}`
  })

  const nights = computed(() => {
    if (!dateRange.value) return 0
    const start = new Date(dateRange.value.start)
    const end = new Date(dateRange.value.end)
    const diffTime = end.getTime() - start.getTime()
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  })

  const isValid = computed(() => {
    if (!startDate.value || !endDate.value) return false
    const start = new Date(startDate.value)
    const end = new Date(endDate.value)
    return end > start
  })

  function reset() {
    startDate.value = ''
    endDate.value = ''
  }

  function setRange(start: string, end: string) {
    startDate.value = start
    endDate.value = end
  }

  return {
    startDate,
    endDate,
    dateRange,
    formattedRange,
    nights,
    isValid,
    reset,
    setRange,
  }
}
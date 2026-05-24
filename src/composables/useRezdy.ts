import { ref, onMounted } from 'vue'
import { supabase } from '@/lib/supabase'

const companyCode = ref('')
const oceanSafariProductId = ref('')
const diveExpeditionProductId = ref('')
const loaded = ref(false)

export function useRezdy() {
  async function loadRezdyConfig() {
    if (loaded.value) return

    try {
      const keys = ['rezdy_company_code', 'rezdy_ocean_safari_product_id', 'rezdy_dive_expedition_product_id']
      for (const key of keys) {
        const { data } = await supabase
          .from('cms_settings')
          .select('value')
          .eq('key', key)
          .maybeSingle()

        if (data?.value) {
          const val = data.value as string
          if (key === 'rezdy_company_code') companyCode.value = val
          if (key === 'rezdy_ocean_safari_product_id') oceanSafariProductId.value = val
          if (key === 'rezdy_dive_expedition_product_id') diveExpeditionProductId.value = val
        }
      }
    } catch (e) {
      console.warn('Supabase unavailable, Rezdy config will be empty:', e)
    }

    loaded.value = true
  }

  function getBookingUrl(slug: string): string | null {
    if (!companyCode.value) return null
    const productId = slug === 'ocean-safari' ? oceanSafariProductId.value : diveExpeditionProductId.value
    if (!productId) return null
    return `https://${companyCode.value}.rezdy.com/catalog/${productId}`
  }

  function getBookingWidgetUrl(slug: string): string | null {
    if (!companyCode.value) return null
    const productId = slug === 'ocean-safari' ? oceanSafariProductId.value : diveExpeditionProductId.value
    if (!productId) return null
    return `https://${companyCode.value}.rezdy.com/widget/${productId}`
  }

  function hasRezdyIntegration(): boolean {
    return !!(companyCode.value && (oceanSafariProductId.value || diveExpeditionProductId.value))
  }

  onMounted(loadRezdyConfig)

  return {
    companyCode,
    oceanSafariProductId,
    diveExpeditionProductId,
    getBookingUrl,
    getBookingWidgetUrl,
    hasRezdyIntegration,
    loadRezdyConfig,
  }
}

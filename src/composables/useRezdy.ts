import { ref, onMounted } from 'vue'
import { getFirebaseDb, initFirebase } from '@/lib/firebase'
import { collection, getDocs } from 'firebase/firestore'

// All Rezdy config now lives entirely in `cms_settings` as plain key/value rows —
// nothing about which trips exist is hardcoded here. Each trip gets two settings
// rows, named by convention from its slug:
//   rezdy_<slug>_product_id   e.g. rezdy_dive_escape_product_id
//   rezdy_<slug>_widget_id    e.g. rezdy_dive_escape_widget_id
// Adding a brand-new trip is then just "add two rows in Admin Settings" — no
// code change or redeploy needed for it to start working everywhere.

const PRODUCT_ID_SUFFIX = '_product_id'
const WIDGET_ID_SUFFIX = '_widget_id'

const companyCode = ref('')
const productIds = ref<Record<string, string>>({})
const widgetIds = ref<Record<string, string>>({})
const loaded = ref(false)
const loading = ref(false)

function slugFromKey(key: string, suffix: string): string | null {
  if (!key.startsWith('rezdy_') || !key.endsWith(suffix)) return null
  const middle = key.slice('rezdy_'.length, key.length - suffix.length)
  return middle.replace(/_/g, '-')
}

export function useRezdy() {
  async function loadRezdyConfig(force = false) {
    if (loaded.value && !force) return
    if (loading.value) return
    loading.value = true

    try {
      initFirebase()
      const db = getFirebaseDb()
      const snap = await getDocs(collection(db, 'cms_settings'))

      const newProductIds: Record<string, string> = {}
      const newWidgetIds: Record<string, string> = {}
      let newCompanyCode = ''

      snap.forEach((docSnap) => {
        const key = docSnap.id
        if (!key.startsWith('rezdy_')) return
        const value = (docSnap.data()?.value as string) || ''
        if (!value) return

        if (key === 'rezdy_company_code') {
          newCompanyCode = value
          return
        }

        const productSlug = slugFromKey(key, PRODUCT_ID_SUFFIX)
        if (productSlug) {
          newProductIds[productSlug] = value
          return
        }

        const widgetSlug = slugFromKey(key, WIDGET_ID_SUFFIX)
        if (widgetSlug) {
          newWidgetIds[widgetSlug] = value
        }
      })

      companyCode.value = newCompanyCode
      productIds.value = newProductIds
      widgetIds.value = newWidgetIds
    } catch (e) {
      console.warn('Firestore unavailable, Rezdy config will be empty:', e)
    }

    loaded.value = true
    loading.value = false
  }

  function getProductId(slug: string): string {
    return productIds.value[slug] || ''
  }

  function getWidgetId(slug: string): string {
    return widgetIds.value[slug] || ''
  }

  function getBookingUrl(slug: string): string | null {
    if (!companyCode.value) return null
    const productId = getProductId(slug)
    if (!productId) return null
    return `https://${companyCode.value}.rezdy.com/catalog/${productId}`
  }

  function getBookingWidgetUrl(slug: string): string | null {
    if (!companyCode.value) return null
    const productId = getProductId(slug)
    if (!productId) return null

    const widgetId = getWidgetId(slug)
    if (!widgetId) return null

    return `https://${companyCode.value}.rezdy.com/${widgetId}/${productId}`
  }

  function hasRezdyIntegration(): boolean {
    return !!(companyCode.value && Object.values(productIds.value).some((id) => !!id))
  }

  /** All trip slugs that currently have a Rezdy product ID configured. */
  function getConfiguredSlugs(): string[] {
    return Object.keys(productIds.value).filter((slug) => !!productIds.value[slug])
  }

  onMounted(() => loadRezdyConfig())

  return {
    companyCode,
    productIds,
    widgetIds,
    getProductId,
    getWidgetId,
    getBookingUrl,
    getBookingWidgetUrl,
    hasRezdyIntegration,
    getConfiguredSlugs,
    loadRezdyConfig,
  }
}

import { ref, computed } from 'vue'

async function getFirebase() {
  const [{ getFirebaseDb, initFirebase }, { doc, getDoc }] = await Promise.all([
    import('@/lib/firebase'),
    import('firebase/firestore'),
  ])
  initFirebase()
  return { db: getFirebaseDb(), doc, getDoc }
}

const KEYS = ['site_phone', 'site_email', 'site_address'] as const
type SettingKey = (typeof KEYS)[number]

const FALLBACKS: Record<SettingKey, string> = {
  site_phone: '+61-234-567-890',
  site_email: 'hello@expeditionoz.com.au',
  site_address: 'Exmouth Marina, WA 6707',
}

export function useSiteSettings() {
  const raw = ref<Record<SettingKey, string>>({ ...FALLBACKS })
  const loading = ref(false)

  const phone = computed(() => raw.value.site_phone || FALLBACKS.site_phone)
  const email = computed(() => raw.value.site_email || FALLBACKS.site_email)
  const address = computed(() => raw.value.site_address || FALLBACKS.site_address)

  const phoneHref = computed(() =>
    'tel:' + phone.value.replace(/[^+\d]/g, ''),
  )
  const emailHref = computed(() => 'mailto:' + email.value)

  async function load() {
    loading.value = true
    try {
      const { db, doc, getDoc } = await getFirebase()
      await Promise.all(
        KEYS.map(async (key) => {
          const snap = await getDoc(doc(db, 'cms_settings', key))
          if (snap.exists()) raw.value[key] = snap.data().value as string
        }),
      )
    } catch (e) {
      console.warn('useSiteSettings: Firestore unavailable, using fallbacks', e)
    }
    loading.value = false
  }

  return { phone, email, address, phoneHref, emailHref, loading, load }
}

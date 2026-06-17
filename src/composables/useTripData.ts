import { ref, computed } from 'vue'

let _fb: any = null
async function getFirebase() {
  if (_fb) return _fb
  const [{ getFirebaseDb, initFirebase }, firestore] = await Promise.all([
    import('@/lib/firebase'),
    import('firebase/firestore'),
  ])
  initFirebase()
  _fb = {
    db: getFirebaseDb(),
    collection: firestore.collection,
    query: firestore.query,
    where: firestore.where,
    orderBy: firestore.orderBy,
    getDocs: firestore.getDocs,
  }
  return _fb
}

export interface TripData {
  id: string
  slug: string
  vesselName: string
  title: string
  subtitle: string
  durationDays: number
  maxGuests: number
  priceAud: number
  priceLabel: string
  description: string
  shortDescription: string
  heroImageUrl: string
  heroVideoUrl: string
  isPublished: boolean
  sortOrder: number
  rezdyProductId: string
}

export interface TripFeature {
  featureText: string
  sortOrder: number
}

export interface TripItineraryDay {
  dayNumber: number
  title: string
  description: string
  imageUrl: string
  activityLabel: string
  mealsLabel: string
}

const FALLBACK_TRIPS: Record<string, Partial<TripData>> = {
  'ocean-safari': {
    slug: 'ocean-safari',
    vesselName: 'Ocean Safari',
    title: 'Ocean Safari',
    subtitle: 'Northern Reef Expedition',
    durationDays: 6,
    maxGuests: 12,
    priceAud: 2495,
    priceLabel: 'From $2,495 AUD',
    description: '',
    shortDescription: '',
  },
  'dive-expedition': {
    slug: 'dive-expedition',
    vesselName: 'Dive Expedition',
    title: 'Dive Expedition',
    subtitle: 'The Ultimate Reef Expedition',
    durationDays: 9,
    maxGuests: 14,
    priceAud: 4495,
    priceLabel: 'From $4,495 AUD',
    description: '',
    shortDescription: '',
  },
}

export function useTripData(slug: string) {
  const trip = ref<TripData | null>(null)
  const features = ref<string[]>([])
  const itinerary = ref<TripItineraryDay[]>([])
  const loading = ref(true)

  // Computed helpers with sensible fallbacks
  const priceLabel = computed(() => trip.value?.priceLabel || FALLBACK_TRIPS[slug]?.priceLabel || '')
  const priceAud = computed(() => trip.value?.priceAud ?? FALLBACK_TRIPS[slug]?.priceAud ?? 0)
  const formattedPrice = computed(() => {
    const p = priceAud.value
    if (!p) return ''
    return `From $${p.toLocaleString('en-AU')} AUD`
  })
  const durationDays = computed(() => trip.value?.durationDays ?? FALLBACK_TRIPS[slug]?.durationDays ?? 0)
  const maxGuests = computed(() => trip.value?.maxGuests ?? FALLBACK_TRIPS[slug]?.maxGuests ?? 0)
  const vesselName = computed(() => trip.value?.vesselName || FALLBACK_TRIPS[slug]?.vesselName || '')
  const subtitle = computed(() => trip.value?.subtitle || FALLBACK_TRIPS[slug]?.subtitle || '')
  const rezdyProductId = computed(() => trip.value?.rezdyProductId || '')

  async function load() {
    loading.value = true
    try {
      const { db, collection, query, where, orderBy, getDocs } = await getFirebase()

      // Load trip by slug
      const tripQ = query(
        collection(db, 'cms_trips'),
        where('slug', '==', slug),
      )
      const tripSnap = await getDocs(tripQ)
      if (!tripSnap.empty) {
        trip.value = { id: tripSnap.docs[0].id, ...tripSnap.docs[0].data() } as TripData

        // Load features
        const featQ = query(
          collection(db, 'cms_trip_features'),
          where('tripId', '==', trip.value.id),
          orderBy('sortOrder'),
        )
        const featSnap = await getDocs(featQ)
        features.value = featSnap.docs.map((d) => d.data().featureText as string)

        // Load itinerary
        const itiQ = query(
          collection(db, 'cms_trip_itinerary'),
          where('tripId', '==', trip.value.id),
          orderBy('dayNumber'),
        )
        const itiSnap = await getDocs(itiQ)
        itinerary.value = itiSnap.docs.map((d) => d.data() as TripItineraryDay)
      }
    } catch (e) {
      console.warn(`useTripData: Firebase unavailable for slug "${slug}", using fallback`, e)
    }
    loading.value = false
  }

  return {
    trip,
    features,
    itinerary,
    loading,
    priceLabel,
    priceAud,
    formattedPrice,
    durationDays,
    maxGuests,
    vesselName,
    subtitle,
    rezdyProductId,
    load,
  }
}

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
    vesselName: 'Sylfia',
    title: 'Ocean Safari Expedition',
    subtitle: 'Our Signature Ningaloo Sailing Expedition',
    durationDays: 6,
    maxGuests: 12,
    priceAud: 5000,
    priceLabel: 'From $5,000 AUD',
    description: '',
    shortDescription: '',
  },
  'dive-expedition': {
    slug: 'dive-expedition',
    vesselName: 'Millennium',
    title: 'Dive Expedition',
    subtitle: 'Our Flagship Liveaboard Dive Expedition',
    durationDays: 9,
    maxGuests: 14,
    priceAud: 9600,
    priceLabel: 'From $9,600 AUD',
    description: '',
    shortDescription: '',
  },
  'ocean-safari-escape': {
    slug: 'ocean-safari-escape',
    vesselName: 'Sylfia',
    title: 'Ocean Safari Escape',
    subtitle: 'A Shorter Ningaloo Sailing Escape',
    durationDays: 4,
    maxGuests: 12,
    priceAud: 3000,
    priceLabel: 'From $3,000 AUD',
    description: '',
    shortDescription: '',
  },
  'dive-escape': {
    slug: 'dive-escape',
    vesselName: 'Millennium',
    title: 'Dive Escape',
    subtitle: 'A Shorter Ningaloo Dive Escape',
    durationDays: 5,
    maxGuests: 14,
    priceAud: 4800,
    priceLabel: 'From $4,800 AUD',
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
        )
        const featSnap = await getDocs(featQ)
        features.value = featSnap.docs
          .map((d) => d.data() as TripFeature)
          .sort((a, b) => a.sortOrder - b.sortOrder)
          .map((d) => d.featureText)

        // Load itinerary
        const itiQ = query(
          collection(db, 'cms_trip_itinerary'),
          where('tripId', '==', trip.value.id),
        )
        const itiSnap = await getDocs(itiQ)
        itinerary.value = itiSnap.docs
          .map((d) => d.data() as TripItineraryDay)
          .sort((a, b) => a.dayNumber - b.dayNumber)
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
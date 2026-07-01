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

export interface LimitedExpeditionData {
  id: string
  slug: string
  vesselName: string
  title: string
  subtitle: string
  nights: number
  dateLabel: string
  host: string
  icon: string
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

export interface LimitedExpeditionItineraryDay {
  dayNumber: number
  title: string
  description: string
  imageUrl: string
  activityLabel: string
  mealsLabel: string
}

// Fallback content — matches the cards already shown on /limited-expeditions
// so the detail page always has something to show even before the CMS is populated.
export const FALLBACK_LIMITED_EXPEDITIONS: Record<string, LimitedExpeditionData> = {
  'freediving': {
    id: 'freediving', slug: 'freediving', vesselName: 'Sylfia',
    title: 'Freediving Expedition', subtitle: 'Guided Breathwork & Freediving Instruction',
    nights: 3, dateLabel: '18 – 21 OCTOBER 2025', host: '', icon: 'freedive',
    priceAud: 3200, priceLabel: 'From $3,200 AUD',
    description: 'Hosted with guided breathwork and freediving instruction. A small group ocean expedition focused on freediving, reef exploration and time in the water with experienced ocean guides.',
    shortDescription: 'Hosted with guided breathwork and freediving instruction.',
    heroImageUrl: '', heroVideoUrl: '', isPublished: true, sortOrder: 0, rezdyProductId: '',
  },
  'surf': {
    id: 'surf', slug: 'surf', vesselName: 'Sylfia',
    title: 'Surf Expedition', subtitle: 'Chasing Secluded Ningaloo Waves',
    nights: 3, dateLabel: '6 – 9 NOVEMBER 2025', host: '', icon: 'surf',
    priceAud: 3400, priceLabel: 'From $3,400 AUD',
    description: 'Chasing secluded Ningaloo waves in remote, uncrowded breaks. A remote sailing-based surf adventure built for guests who want waves, wild anchorages, good food and life at sea.',
    shortDescription: 'A remote sailing-based surf adventure.',
    heroImageUrl: '', heroVideoUrl: '', isPublished: true, sortOrder: 1, rezdyProductId: '',
  },
  'whale-song': {
    id: 'whale-song', slug: 'whale-song', vesselName: 'Sylfia',
    title: 'Whale Song Expedition', subtitle: 'Swim, Listen and Connect with Humpback Whales',
    nights: 3, dateLabel: '24 – 27 AUGUST 2025', host: 'Brodee Lowe & Grace Russell', icon: 'whale',
    priceAud: 3200, priceLabel: 'From $3,200 AUD',
    description: 'Immerse in the songs of the season. Swim, listen and connect with humpback whales in their natural habitat alongside two of Australia\'s leading ocean communicators.',
    shortDescription: 'Swim, listen and connect with humpback whales in their natural habitat.',
    heroImageUrl: '', heroVideoUrl: '', isPublished: true, sortOrder: 2, rezdyProductId: '',
  },
  'underwater-photography': {
    id: 'underwater-photography', slug: 'underwater-photography', vesselName: 'Millennium',
    title: 'Underwater Photography Expedition', subtitle: 'Capture. Learn. Inspire.',
    nights: 8, dateLabel: '12 – 19 SEPTEMBER 2025', host: 'Renowned Underwater Photographer', icon: 'camera',
    priceAud: 9600, priceLabel: 'From $9,600 AUD',
    description: 'Capture. Learn. Inspire. A dedicated liveaboard expedition for underwater photographers, filmmakers and ocean storytellers. More time in the water. More marine life. More creative flow.',
    shortDescription: 'A dedicated liveaboard expedition for underwater photographers and filmmakers.',
    heroImageUrl: '', heroVideoUrl: '', isPublished: true, sortOrder: 3, rezdyProductId: '',
  },
  'black-water': {
    id: 'black-water', slug: 'black-water', vesselName: 'Millennium',
    title: 'Black Water Expedition', subtitle: 'The Mysterious Nocturnal Realm',
    nights: 8, dateLabel: '3 – 10 JULY 2025', host: 'Jeff & Sarah Milisen', icon: 'jellyfish',
    priceAud: 9600, priceLabel: 'From $9,600 AUD',
    description: 'Explore the mysterious nocturnal realm. Drift in the open ocean after dark to witness the deep-sea creatures that migrate to the surface each night in one of nature\'s most surreal spectacles.',
    shortDescription: 'Drift in the open ocean after dark to witness deep-sea creatures.',
    heroImageUrl: '', heroVideoUrl: '', isPublished: true, sortOrder: 4, rezdyProductId: '',
  },
  'wellness': {
    id: 'wellness', slug: 'wellness', vesselName: 'Sylfia',
    title: 'Wellness at Sea', subtitle: 'Rebalance Body, Mind and Spirit',
    nights: 5, dateLabel: '15 – 20 NOVEMBER 2025', host: 'Amy Lawson', icon: 'lotus',
    priceAud: 5000, priceLabel: 'From $5,000 AUD',
    description: 'Rebalance your body, mind and spirit aboard Sylfia. Daily yoga, breathwork, meditation and nutritional guidance, set against the backdrop of Ningaloo\'s pristine waters.',
    shortDescription: 'Daily yoga, breathwork, meditation and nutritional guidance.',
    heroImageUrl: '', heroVideoUrl: '', isPublished: true, sortOrder: 5, rezdyProductId: '',
  },
  'sharks-ningaloo': {
    id: 'sharks-ningaloo', slug: 'sharks-ningaloo', vesselName: 'Sylfia',
    title: 'Sharks of Ningaloo', subtitle: 'Whale Sharks & Ocean Conservation',
    nights: 3, dateLabel: '5 – 8 APRIL 2026', host: '', icon: 'shark',
    priceAud: 3000, priceLabel: 'From $3,000 AUD',
    description: 'Swim with majestic whale sharks and learn about ocean conservation. Explore the full spectrum of Ningaloo\'s shark species with expert marine biologists and ocean guides.',
    shortDescription: 'Swim with majestic whale sharks and learn about ocean conservation.',
    heroImageUrl: '', heroVideoUrl: '', isPublished: true, sortOrder: 6, rezdyProductId: '',
  },
  'citizen-science': {
    id: 'citizen-science', slug: 'citizen-science', vesselName: 'Sylfia',
    title: 'Citizen Science Expedition', subtitle: 'Contribute to Vital Ningaloo Research',
    nights: 3, dateLabel: '27 – 30 JANUARY 2026', host: '', icon: 'flask',
    priceAud: 3000, priceLabel: 'From $3,000 AUD',
    description: 'Contribute to vital research and help protect Ningaloo for the future. Collect real data alongside marine scientists — no experience needed, just a love of the ocean.',
    shortDescription: 'Collect real data alongside marine scientists.',
    heroImageUrl: '', heroVideoUrl: '', isPublished: true, sortOrder: 7, rezdyProductId: '',
  },
}

// Fetches every published expedition from Firestore (`cms_limited_expeditions`),
// ordered by sortOrder, merged over FALLBACK_LIMITED_EXPEDITIONS so admin edits
// (title, subtitle, vessel, nights, host, dateLabel, icon, shortDescription,
// heroImageUrl, etc.) are reflected on the /limited-expeditions card grid —
// not just on the individual /limited-expeditions/:slug detail pages.
export async function fetchPublishedLimitedExpeditions(): Promise<LimitedExpeditionData[]> {
  const fallbackList = Object.values(FALLBACK_LIMITED_EXPEDITIONS).sort(
    (a, b) => a.sortOrder - b.sortOrder
  )

  try {
    const { db, collection, query, orderBy, getDocs } = await getFirebase()
    // Deliberately only orderBy here (no `where` on a different field) so this
    // never needs a Firestore composite index — a where+orderBy combo on two
    // fields silently throws without one, which gets caught below and masks
    // itself as "empty data" (the fallback array, with no real images/edits).
    // isPublished is filtered client-side instead.
    const tripsQ = query(
      collection(db, 'cms_limited_expeditions'),
      orderBy('sortOrder', 'asc'),
    )
    const snap = await getDocs(tripsQ)
    if (snap.empty) return fallbackList

    const live = snap.docs
      .map((d: any) => ({ id: d.id, ...d.data() }) as LimitedExpeditionData)
      .filter((t) => t.isPublished)

    if (live.length === 0) return fallbackList

    const liveBySlug = new Map(live.map((t) => [t.slug, t]))

    // Merge: live Firestore docs take priority; any fallback entries with no
    // matching live doc yet (e.g. not created in the CMS) still show up.
    const merged = [
      ...live,
      ...fallbackList.filter((f) => !liveBySlug.has(f.slug)),
    ]
    return merged.sort((a, b) => a.sortOrder - b.sortOrder)
  } catch (e) {
    console.warn('fetchPublishedLimitedExpeditions: Firebase unavailable, using fallback', e)
    return fallbackList
  }
}

export function useLimitedExpeditionData(slug: string) {
  const trip = ref<LimitedExpeditionData | null>(null)
  const itinerary = ref<LimitedExpeditionItineraryDay[]>([])
  const features = ref<string[]>([])
  const loading = ref(true)

  const fallback = computed(() => FALLBACK_LIMITED_EXPEDITIONS[slug] || null)

  const title = computed(() => trip.value?.title || fallback.value?.title || 'Limited Expedition')
  const subtitle = computed(() => trip.value?.subtitle || fallback.value?.subtitle || '')
  const vesselName = computed(() => trip.value?.vesselName || fallback.value?.vesselName || '')
  const nights = computed(() => trip.value?.nights ?? fallback.value?.nights ?? 0)
  const dateLabel = computed(() => trip.value?.dateLabel || fallback.value?.dateLabel || '')
  const host = computed(() => trip.value?.host || fallback.value?.host || '')
  const icon = computed(() => trip.value?.icon || fallback.value?.icon || 'compass')
  const description = computed(() => trip.value?.description || fallback.value?.description || '')
  const shortDescription = computed(() => trip.value?.shortDescription || fallback.value?.shortDescription || '')
  const priceAud = computed(() => trip.value?.priceAud ?? fallback.value?.priceAud ?? 0)
  const priceLabel = computed(() => trip.value?.priceLabel || fallback.value?.priceLabel || '')
  const heroImageUrl = computed(() => trip.value?.heroImageUrl || '')
  const heroVideoUrl = computed(() => trip.value?.heroVideoUrl || '')
  const rezdyProductId = computed(() => trip.value?.rezdyProductId || '')
  const exists = computed(() => !!trip.value || !!fallback.value)

  async function load() {
    loading.value = true
    try {
      const { db, collection, query, where, orderBy, getDocs } = await getFirebase()

      const tripQ = query(
        collection(db, 'cms_limited_expeditions'),
        where('slug', '==', slug),
      )
      const tripSnap = await getDocs(tripQ)
      if (!tripSnap.empty) {
        trip.value = { id: tripSnap.docs[0].id, ...tripSnap.docs[0].data() } as LimitedExpeditionData

        const itiQ = query(
          collection(db, 'cms_limited_expedition_itinerary'),
          where('tripId', '==', trip.value.id),
        )
        const itiSnap = await getDocs(itiQ)
        itinerary.value = itiSnap.docs
          .map((d: any) => d.data() as LimitedExpeditionItineraryDay)
          .sort((a, b) => a.dayNumber - b.dayNumber)

        const featQ = query(
          collection(db, 'cms_limited_expedition_features'),
          where('tripId', '==', trip.value.id),
        )
        const featSnap = await getDocs(featQ)
        features.value = featSnap.docs
          .map((d: any) => d.data())
          .sort((a: any, b: any) => a.sortOrder - b.sortOrder)
          .map((d: any) => d.featureText as string)
      }
    } catch (e) {
      console.warn(`useLimitedExpeditionData: Firebase unavailable for slug "${slug}", using fallback`, e)
    }
    loading.value = false
  }

  return {
    trip,
    itinerary,
    features,
    loading,
    exists,
    title,
    subtitle,
    vesselName,
    nights,
    dateLabel,
    host,
    icon,
    description,
    shortDescription,
    priceAud,
    priceLabel,
    heroImageUrl,
    heroVideoUrl,
    rezdyProductId,
    load,
  }
}
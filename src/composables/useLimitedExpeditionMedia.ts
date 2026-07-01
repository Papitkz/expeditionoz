import { ref } from 'vue'

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
    doc: firestore.doc,
    getDocs: firestore.getDocs,
    getDoc: firestore.getDoc,
    setDoc: firestore.setDoc,
    updateDoc: firestore.updateDoc,
    deleteDoc: firestore.deleteDoc,
    query: firestore.query,
    where: firestore.where,
    orderBy: firestore.orderBy,
    serverTimestamp: firestore.serverTimestamp,
    writeBatch: firestore.writeBatch,
  }
  return _fb
}

export interface LimitedExpeditionMediaItem {
  id: string
  tripId: string
  mediaType: 'hero' | 'about' | 'gallery' | 'itinerary'
  slotIndex: number
  imageUrl: string
  caption: string
  createdAt: any
  updatedAt: any
}

// Admin: Load all media for a trip
export async function loadTripMedia(tripId: string): Promise<LimitedExpeditionMediaItem[]> {
  try {
    const { db, collection, query, where, orderBy, getDocs } = await getFirebase()
    const q = query(
      collection(db, 'cms_limited_expedition_media'),
      where('tripId', '==', tripId),
      orderBy('mediaType'),
      orderBy('slotIndex')
    )
    const snap = await getDocs(q)
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as LimitedExpeditionMediaItem))
  } catch (e) {
    console.warn(`Failed to load media for trip ${tripId}:`, e)
    return []
  }
}

// Admin: Save or update a media item
export async function saveTripMedia(
  tripId: string,
  mediaType: 'hero' | 'about' | 'gallery' | 'itinerary',
  slotIndex: number,
  imageUrl: string,
  caption: string = '',
  existingId?: string
): Promise<string> {
  const { db, collection, doc, setDoc, updateDoc, serverTimestamp } = await getFirebase()

  if (existingId) {
    await updateDoc(doc(db, 'cms_limited_expedition_media', existingId), {
      imageUrl,
      caption,
      updatedAt: serverTimestamp(),
    })
    return existingId
  } else {
    // Check if item already exists for this trip/type/slot
    const { query, where, getDocs } = await getFirebase()
    const q = query(
      collection(db, 'cms_limited_expedition_media'),
      where('tripId', '==', tripId),
      where('mediaType', '==', mediaType),
      where('slotIndex', '==', slotIndex)
    )
    const snap = await getDocs(q)
    if (!snap.empty) {
      const id = snap.docs[0].id
      await updateDoc(doc(db, 'cms_limited_expedition_media', id), {
        imageUrl,
        caption,
        updatedAt: serverTimestamp(),
      })
      return id
    }

    const id = `lem_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`
    await setDoc(doc(db, 'cms_limited_expedition_media', id), {
      tripId,
      mediaType,
      slotIndex,
      imageUrl,
      caption,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
    return id
  }
}

// Admin: Delete a media item
export async function deleteTripMedia(id: string): Promise<void> {
  const { db, doc, deleteDoc } = await getFirebase()
  await deleteDoc(doc(db, 'cms_limited_expedition_media', id))
}

// Frontend: Load all media for a trip (reactive composable)
export function useLimitedExpeditionMedia(tripId: string) {
  const heroImage = ref<string>('')
  const aboutImage = ref<string>('')
  const galleryImages = ref<{ src: string; caption: string }[]>([])
  const itineraryImages = ref<{ dayIndex: number; imageUrl: string }[]>([])
  const loading = ref(false)

  async function load(idOverride?: string) {
    const id = idOverride || tripId
    if (!id) return
    loading.value = true
    try {
      const items = await loadTripMedia(id)

      // Hero image
      const hero = items.find((i) => i.mediaType === 'hero')
      heroImage.value = hero?.imageUrl || ''

      // About image
      const about = items.find((i) => i.mediaType === 'about')
      aboutImage.value = about?.imageUrl || ''

      // Gallery images
      galleryImages.value = items
        .filter((i) => i.mediaType === 'gallery')
        .sort((a, b) => a.slotIndex - b.slotIndex)
        .map((i) => ({ src: i.imageUrl, caption: i.caption || '' }))

      // Itinerary images
      itineraryImages.value = items
        .filter((i) => i.mediaType === 'itinerary')
        .sort((a, b) => a.slotIndex - b.slotIndex)
        .map((i) => ({ dayIndex: i.slotIndex, imageUrl: i.imageUrl }))
    } catch (e) {
      console.warn(`Failed to load expedition media for ${tripId}:`, e)
    }
    loading.value = false
  }

  function getItineraryImage(dayIndex: number): string {
    return itineraryImages.value.find((i) => i.dayIndex === dayIndex)?.imageUrl || ''
  }

  return {
    heroImage,
    aboutImage,
    galleryImages,
    itineraryImages,
    loading,
    load,
    getItineraryImage,
  }
}
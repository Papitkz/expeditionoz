import { ref, onMounted } from 'vue'

// Lazy Firebase loader — Firebase SDK only imported when first CMS read occurs
let _fb: { db: any; collection: any; doc: any; getDocs: any; getDoc: any; setDoc: any; updateDoc: any; deleteDoc: any; query: any; where: any; orderBy: any; serverTimestamp: any } | null = null

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
  }
  return _fb
}

interface SectionData {
  id: string
  sectionKey: string
  page: string
  label: string
  description: string
  defaultImageUrl: string
  defaultVideoUrl: string
  activeImageUrl: string | null
  activeVideoUrl: string | null
}

interface DraftContent {
  sectionKey: string
  type: 'image' | 'video'
  url: string
}

interface CMSImage {
  id: string
  key: string
  url: string
  alt: string
  page: string
  category: string
  label: string
  fallbackUrl: string
  sortOrder: number
  updatedAt: any
}

const sectionCache = new Map<string, string>()
const sectionVideoCache = new Map<string, string>()
const allSectionsCache = new Map<string, SectionData>()
const draftImageCache = new Map<string, string>()
const draftVideoCache = new Map<string, string>()
const imageCache = new Map<string, CMSImage>()
let cacheLoaded = false
let draftsLoaded = false
let imagesLoaded = false

// Preview mode state (shared across all components)
let isPreviewMode = false

export function setPreviewMode(enabled: boolean) {
  isPreviewMode = enabled
}

export function getPreviewMode(): boolean {
  return isPreviewMode
}

export function useCMS() {
  const loading = ref(false)

  async function loadSectionCache() {
    if (cacheLoaded) return
    loading.value = true

    try {
      const { db, collection, doc, getDocs, getDoc, setDoc, updateDoc, deleteDoc, query, where, orderBy, serverTimestamp } = await getFirebase()

      // Load sections
      const sectionsSnap = await getDocs(collection(db, 'cms_sections'))
      const sections = sectionsSnap.docs.map((d) => ({ id: d.id, ...d.data() }))

      // Load active images
      const imagesSnap = await getDocs(
        query(collection(db, 'cms_section_images'), where('isActive', '==', true))
      )
      const activeImages: Record<string, string> = {}
      imagesSnap.docs.forEach((d) => {
        const data = d.data()
        activeImages[data.sectionId] = data.imageUrl
      })

      // Load active videos
      const videosSnap = await getDocs(
        query(collection(db, 'cms_section_videos'), where('isActive', '==', true))
      )
      const activeVideos: Record<string, string> = {}
      videosSnap.docs.forEach((d) => {
        const data = d.data()
        activeVideos[data.sectionId] = data.videoUrl
      })

      // Load drafts for preview mode
      const draftsSnap = await getDocs(collection(db, 'cms_section_drafts'))
      draftsSnap.docs.forEach((d) => {
        const data = d.data()
        if (data.type === 'image') {
          draftImageCache.set(data.sectionKey, data.url)
        } else if (data.type === 'video') {
          draftVideoCache.set(data.sectionKey, data.url)
        }
      })
      draftsLoaded = true

      for (const sec of sections as any[]) {
        const activeImg = activeImages[sec.id] || null
        const activeVid = activeVideos[sec.id] || null

        sectionCache.set(sec.sectionKey, activeImg || sec.defaultImageUrl || '')
        sectionVideoCache.set(sec.sectionKey, activeVid || sec.defaultVideoUrl || '')

        allSectionsCache.set(sec.sectionKey, {
          id: sec.id,
          sectionKey: sec.sectionKey,
          page: sec.page,
          label: sec.label,
          description: sec.description || '',
          defaultImageUrl: sec.defaultImageUrl || '',
          defaultVideoUrl: sec.defaultVideoUrl || '',
          activeImageUrl: activeImg,
          activeVideoUrl: activeVid,
        })
      }

      cacheLoaded = true
    } catch (e) {
      console.warn('Firebase unavailable, section cache will use fallbacks:', e)
      cacheLoaded = true
    }

    loading.value = false
  }

  async function loadImageCache() {
    if (imagesLoaded) return
    try {
      const { db, collection, doc, getDocs, getDoc, setDoc, updateDoc, deleteDoc, query, where, orderBy, serverTimestamp } = await getFirebase()
      const snap = await getDocs(query(collection(db, 'cms_images'), orderBy('sortOrder')))
      snap.docs.forEach((d) => {
        const data = d.data() as CMSImage
        imageCache.set(data.key, { ...data, id: d.id })
      })
      imagesLoaded = true
    } catch (e) {
      console.warn('Firebase unavailable, image cache will use fallbacks:', e)
      imagesLoaded = true
    }
  }

  function getSectionImage(sectionKey: string, fallbackUrl: string, usePreview: boolean = false): string {
    // In preview mode, check drafts first
    if ((usePreview || isPreviewMode) && draftImageCache.has(sectionKey)) {
      return draftImageCache.get(sectionKey)!
    }
    return sectionCache.get(sectionKey) || fallbackUrl
  }

  function getSectionVideo(sectionKey: string, fallbackUrl: string, usePreview: boolean = false): string {
    // In preview mode, check drafts first
    if ((usePreview || isPreviewMode) && draftVideoCache.has(sectionKey)) {
      return draftVideoCache.get(sectionKey)!
    }
    return sectionVideoCache.get(sectionKey) || fallbackUrl
  }

  function getImage(key: string, fallbackUrl: string = ''): string {
    const img = imageCache.get(key)
    return img?.url || fallbackUrl
  }

  function getImageAlt(key: string, fallbackAlt: string = ''): string {
    const img = imageCache.get(key)
    return img?.alt || fallbackAlt
  }

  function getImagesByPage(page: string): CMSImage[] {
    return Array.from(imageCache.values()).filter((img) => img.page === page)
  }

  function getImagesByCategory(category: string): CMSImage[] {
    return Array.from(imageCache.values()).filter((img) => img.category === category)
  }

  function getAllImages(): CMSImage[] {
    return Array.from(imageCache.values())
  }

  function hasDraft(sectionKey: string): boolean {
    return draftImageCache.has(sectionKey) || draftVideoCache.has(sectionKey)
  }

  function getSectionData(sectionKey: string): SectionData | null {
    return allSectionsCache.get(sectionKey) || null
  }

  function getAllSections(): SectionData[] {
    return Array.from(allSectionsCache.values())
  }

  function getSectionsByPage(page: string): SectionData[] {
    return Array.from(allSectionsCache.values()).filter((s) => s.page === page)
  }

  function clearCache() {
    cacheLoaded = false
    draftsLoaded = false
    imagesLoaded = false
    sectionCache.clear()
    sectionVideoCache.clear()
    allSectionsCache.clear()
    draftImageCache.clear()
    draftVideoCache.clear()
    imageCache.clear()
  }

  async function getTrips() {
    try {
      const { db, collection, doc, getDocs, getDoc, setDoc, updateDoc, deleteDoc, query, where, orderBy, serverTimestamp } = await getFirebase()
      const q = query(
        collection(db, 'cms_trips'),
        where('isPublished', '==', true),
        orderBy('sortOrder')
      )
      const snap = await getDocs(q)
      return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
    } catch (e) {
      console.warn('Firebase unavailable, returning empty trips:', e)
      return []
    }
  }

  async function getTripBySlug(slug: string) {
    try {
      const { db, collection, doc, getDocs, getDoc, setDoc, updateDoc, deleteDoc, query, where, orderBy, serverTimestamp } = await getFirebase()
      const q = query(
        collection(db, 'cms_trips'),
        where('slug', '==', slug),
        where('isPublished', '==', true)
      )
      const snap = await getDocs(q)
      if (snap.empty) return null
      return { id: snap.docs[0].id, ...snap.docs[0].data() }
    } catch (e) {
      console.warn('Firebase unavailable, cannot load trip:', e)
      return null
    }
  }

  async function getTripFeatures(tripId: string) {
    try {
      const { db, collection, doc, getDocs, getDoc, setDoc, updateDoc, deleteDoc, query, where, orderBy, serverTimestamp } = await getFirebase()
      const q = query(
        collection(db, 'cms_trip_features'),
        where('tripId', '==', tripId),
        orderBy('sortOrder')
      )
      const snap = await getDocs(q)
      return snap.docs.map((d) => d.data().featureText)
    } catch (e) {
      console.warn('Firebase unavailable, cannot load features:', e)
      return []
    }
  }

  async function getTripItinerary(tripId: string) {
    try {
      const { db, collection, doc, getDocs, getDoc, setDoc, updateDoc, deleteDoc, query, where, orderBy, serverTimestamp } = await getFirebase()
      const q = query(
        collection(db, 'cms_trip_itinerary'),
        where('tripId', '==', tripId),
        orderBy('dayNumber')
      )
      const snap = await getDocs(q)
      return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
    } catch (e) {
      console.warn('Firebase unavailable, cannot load itinerary:', e)
      return []
    }
  }

  async function getBlogs() {
    try {
      const { db, collection, doc, getDocs, getDoc, setDoc, updateDoc, deleteDoc, query, where, orderBy, serverTimestamp } = await getFirebase()
      const q = query(
        collection(db, 'cms_blogs'),
        where('isPublished', '==', true),
        orderBy('publishedAt', 'desc')
      )
      const snap = await getDocs(q)

      console.log('Total docs:', snap.size)
      console.log('Empty?', snap.empty)

      const blogs = snap.docs.map((d) => {
        const data = d.data()
        console.log('Doc ID:', d.id)
        console.log('Doc data keys:', Object.keys(data))
        console.log('Raw data:', data)
        return {
          id: d.id,
          ...data
        }
      })

      return blogs
    } catch (e) {
      console.error('getBlogs error:', e)
      return []
    }
  }

  async function getBlogBySlug(slug: string) {
    try {
      const { db, collection, doc, getDocs, getDoc, setDoc, updateDoc, deleteDoc, query, where, orderBy, serverTimestamp } = await getFirebase()
      const q = query(
        collection(db, 'cms_blogs'),
        where('slug', '==', slug),
        where('isPublished', '==', true)
      )
      const snap = await getDocs(q)
      if (snap.empty) return null
      return { id: snap.docs[0].id, ...snap.docs[0].data() }
    } catch (e) {
      console.warn('Firebase unavailable, cannot load blog:', e)
      return null
    }
  }

  async function getSetting(key: string): Promise<string> {
    try {
      const { db, collection, doc, getDocs, getDoc, setDoc, updateDoc, deleteDoc, query, where, orderBy, serverTimestamp } = await getFirebase()
      const docRef = doc(db, 'cms_settings', key)
      const snap = await getDoc(docRef)
      return snap.exists() ? snap.data().value || '' : ''
    } catch (e) {
      console.warn('Firebase unavailable, cannot load setting:', e)
      return ''
    }
  }

  // Admin CRUD operations
  async function createSection(data: Partial<SectionData>) {
    const { db, collection, doc, getDocs, getDoc, setDoc, updateDoc, deleteDoc, query, where, orderBy, serverTimestamp } = await getFirebase()
    const id = data.sectionKey || `section_${Date.now()}`
    await setDoc(doc(db, 'cms_sections', id), {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
    clearCache()
    return id
  }

  async function updateSection(id: string, data: Partial<SectionData>) {
    const { db, collection, doc, getDocs, getDoc, setDoc, updateDoc, deleteDoc, query, where, orderBy, serverTimestamp } = await getFirebase()
    await updateDoc(doc(db, 'cms_sections', id), {
      ...data,
      updatedAt: serverTimestamp(),
    })
    clearCache()
  }

  async function deleteSection(id: string) {
    const { db, collection, doc, getDocs, getDoc, setDoc, updateDoc, deleteDoc, query, where, orderBy, serverTimestamp } = await getFirebase()
    await deleteDoc(doc(db, 'cms_sections', id))
    clearCache()
  }

  // CMS Image CRUD
  async function getCMSImages(): Promise<CMSImage[]> {
    try {
      const { db, collection, doc, getDocs, getDoc, setDoc, updateDoc, deleteDoc, query, where, orderBy, serverTimestamp } = await getFirebase()
      const snap = await getDocs(query(collection(db, 'cms_images'), orderBy('sortOrder')))
      return snap.docs.map((d) => ({ id: d.id, ...d.data() } as CMSImage))
    } catch (e) {
      console.warn('Firebase unavailable, returning empty images:', e)
      return []
    }
  }

  async function updateCMSImage(id: string, data: Partial<CMSImage>) {
    const { db, collection, doc, getDocs, getDoc, setDoc, updateDoc, deleteDoc, query, where, orderBy, serverTimestamp } = await getFirebase()
    await updateDoc(doc(db, 'cms_images', id), {
      ...data,
      updatedAt: serverTimestamp(),
    })
    // Update cache
    const existing = imageCache.get(data.key || '')
    if (existing && data.key) {
      imageCache.set(data.key, { ...existing, ...data, id })
    }
  }

  async function createCMSImage(data: Omit<CMSImage, 'id'>): Promise<string> {
    const { db, collection, doc, getDocs, getDoc, setDoc, updateDoc, deleteDoc, query, where, orderBy, serverTimestamp } = await getFirebase()
    const id = `img_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`
    await setDoc(doc(db, 'cms_images', id), {
      ...data,
      updatedAt: serverTimestamp(),
    })
    imageCache.set(data.key, { ...data, id })
    return id
  }

  async function deleteCMSImage(id: string, key: string) {
    const { db, collection, doc, getDocs, getDoc, setDoc, updateDoc, deleteDoc, query, where, orderBy, serverTimestamp } = await getFirebase()
    await deleteDoc(doc(db, 'cms_images', id))
    imageCache.delete(key)
  }

  onMounted(() => {
    loadSectionCache()
    loadImageCache()
  })

  return {
    loading,
    loadSectionCache,
    getSectionImage,
    getSectionVideo,
    getSectionData,
    getAllSections,
    getSectionsByPage,
    hasDraft,
    clearCache,
    getTrips,
    getTripBySlug,
    getTripFeatures,
    getTripItinerary,
    getBlogs,
    getBlogBySlug,
    getSetting,
    createSection,
    updateSection,
    deleteSection,
    // CMS Image exports
    getImage,
    getImageAlt,
    getImagesByPage,
    getImagesByCategory,
    getAllImages,
    getCMSImages,
    updateCMSImage,
    createCMSImage,
    deleteCMSImage,
    loadImageCache,
  }
}
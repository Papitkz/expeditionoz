import { ref, computed } from 'vue'
import { getFirebaseDb } from '@/lib/firebase'
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  updateDoc,
  query,
  where,
  serverTimestamp,
} from 'firebase/firestore'

interface DraftContent {
  id: string
  sectionKey: string
  type: 'image' | 'video'
  url: string
  filePath?: string
  createdAt: any
  updatedAt: any
}

// Global preview mode state
const isPreviewMode = ref(false)
const draftCache = new Map<string, DraftContent>()
let draftCacheLoaded = false

export function usePreview() {
  const loading = ref(false)

  // Check URL for preview param
  function checkPreviewParam() {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      isPreviewMode.value = params.get('preview') === 'true'
    }
  }

  // Toggle preview mode
  function setPreviewMode(enabled: boolean) {
    isPreviewMode.value = enabled
    
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href)
      if (enabled) {
        url.searchParams.set('preview', 'true')
      } else {
        url.searchParams.delete('preview')
      }
      window.history.replaceState({}, '', url.toString())
    }
  }

  // Load all drafts into cache
  async function loadDraftCache() {
    if (draftCacheLoaded) return
    loading.value = true

    try {
      const db = getFirebaseDb()
      const snap = await getDocs(collection(db, 'cms_section_drafts'))
      
      snap.docs.forEach((d) => {
        const data = d.data()
        const key = `${data.sectionKey}_${data.type}`
        draftCache.set(key, { id: d.id, ...data } as DraftContent)
      })
      
      draftCacheLoaded = true
    } catch (e) {
      console.warn('Firebase unavailable, drafts will not load:', e)
    }

    loading.value = false
  }

  // Save draft content
  async function saveDraft(sectionKey: string, type: 'image' | 'video', url: string, filePath?: string) {
    try {
      const db = getFirebaseDb()
      const draftId = `draft_${sectionKey}_${type}`
      
      await setDoc(doc(db, 'cms_section_drafts', draftId), {
        sectionKey,
        type,
        url,
        filePath: filePath || '',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })

      // Update cache
      const key = `${sectionKey}_${type}`
      draftCache.set(key, {
        id: draftId,
        sectionKey,
        type,
        url,
        filePath,
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      return true
    } catch (e) {
      console.warn('Firebase unavailable, cannot save draft:', e)
      return false
    }
  }

  // Get draft content
  function getDraft(sectionKey: string, type: 'image' | 'video'): DraftContent | null {
    const key = `${sectionKey}_${type}`
    return draftCache.get(key) || null
  }

  // Get draft image URL
  function getDraftImage(sectionKey: string): string | null {
    const draft = getDraft(sectionKey, 'image')
    return draft?.url || null
  }

  // Get draft video URL
  function getDraftVideo(sectionKey: string): string | null {
    const draft = getDraft(sectionKey, 'video')
    return draft?.url || null
  }

  // Publish draft (move to live content)
  async function publishDraft(sectionKey: string, type: 'image' | 'video') {
    const draft = getDraft(sectionKey, type)
    if (!draft) return false

    try {
      const db = getFirebaseDb()

      // Find the section
      const sectionsSnap = await getDocs(
        query(collection(db, 'cms_sections'), where('sectionKey', '==', sectionKey))
      )
      
      if (sectionsSnap.empty) return false
      
      const sectionDoc = sectionsSnap.docs[0]
      const sectionId = sectionDoc.id

      // Deactivate current active media
      const collectionName = type === 'image' ? 'cms_section_images' : 'cms_section_videos'
      const urlField = type === 'image' ? 'imageUrl' : 'videoUrl'
      
      const activeSnap = await getDocs(
        query(
          collection(db, collectionName),
          where('sectionId', '==', sectionId),
          where('isActive', '==', true)
        )
      )
      
      for (const doc of activeSnap.docs) {
        await updateDoc(doc.ref, { isActive: false })
      }

      // Create new active media entry
      const newId = `${type.slice(0, 3)}_${Date.now()}`
      await setDoc(doc(db, collectionName, newId), {
        sectionId,
        sectionKey,
        [urlField]: draft.url,
        filePath: draft.filePath || '',
        altText: sectionKey,
        sortOrder: 0,
        isActive: true,
        createdAt: serverTimestamp(),
      })

      // Delete draft
      await discardDraft(sectionKey, type)

      return true
    } catch (e) {
      console.warn('Firebase unavailable, cannot publish draft:', e)
      return false
    }
  }

  // Discard draft
  async function discardDraft(sectionKey: string, type: 'image' | 'video') {
    try {
      const db = getFirebaseDb()
      const draftId = `draft_${sectionKey}_${type}`
      await deleteDoc(doc(db, 'cms_section_drafts', draftId))
      
      // Remove from cache
      const key = `${sectionKey}_${type}`
      draftCache.delete(key)
      
      return true
    } catch (e) {
      console.warn('Firebase unavailable, cannot discard draft:', e)
      return false
    }
  }

  // Get all drafts for a section
  function getSectionDrafts(sectionKey: string): DraftContent[] {
    const drafts: DraftContent[] = []
    const imgDraft = getDraft(sectionKey, 'image')
    const vidDraft = getDraft(sectionKey, 'video')
    if (imgDraft) drafts.push(imgDraft)
    if (vidDraft) drafts.push(vidDraft)
    return drafts
  }

  // Check if section has unpublished drafts
  function hasDrafts(sectionKey: string): boolean {
    return getSectionDrafts(sectionKey).length > 0
  }

  // Clear all caches
  function clearDraftCache() {
    draftCacheLoaded = false
    draftCache.clear()
  }

  // Initialize
  checkPreviewParam()

  return {
    isPreviewMode,
    loading,
    setPreviewMode,
    loadDraftCache,
    saveDraft,
    getDraft,
    getDraftImage,
    getDraftVideo,
    publishDraft,
    discardDraft,
    getSectionDrafts,
    hasDrafts,
    clearDraftCache,
  }
}

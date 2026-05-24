import { ref } from 'vue'
import { getFirebaseDb } from '@/lib/firebase'
import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  writeBatch,
} from 'firebase/firestore'

export interface ComponentContentItem {
  id: string
  component: string
  section: string
  slotIndex: number
  imageUrl: string | null
  alt: string
  title: string
  description: string
  caption: string
  category: string
  mediaType: 'image' | 'video'
  updatedAt: any
}

export function useComponentCMS(componentName: string) {
  const items = ref<ComponentContentItem[]>([])
  const loading = ref(false)

  async function load(force = true) {
    // Always fetch fresh data by default to ensure admin updates show immediately
    // Set force=false only if you explicitly want to skip the network request
    if (!force) {
      if (items.value.length > 0) return
    }

    loading.value = true
    try {
      const db = getFirebaseDb()
      const q = query(
        collection(db, 'cms_component_content'),
        where('component', '==', componentName),
        orderBy('section'),
        orderBy('slotIndex')
      )
      const snap = await getDocs(q)
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() } as ComponentContentItem))
      items.value = data
    } catch (e) {
      console.warn(`Component CMS load failed for ${componentName}:`, e)
      items.value = []
    }
    loading.value = false
  }

  function getSection(section: string): ComponentContentItem[] {
    return items.value
      .filter((i) => i.section === section)
      .sort((a, b) => a.slotIndex - b.slotIndex)
  }

  function getSlot(section: string, slotIndex: number): ComponentContentItem | undefined {
    return getSection(section).find((i) => i.slotIndex === slotIndex)
  }

  function getImageUrl(section: string, slotIndex: number): string | null {
    return getSlot(section, slotIndex)?.imageUrl || null
  }

  function getTitle(section: string, slotIndex: number): string {
    return getSlot(section, slotIndex)?.title || ''
  }

  function getDescription(section: string, slotIndex: number): string {
    return getSlot(section, slotIndex)?.description || ''
  }

  function getCaption(section: string, slotIndex: number): string {
    return getSlot(section, slotIndex)?.caption || ''
  }

  function getAlt(section: string, slotIndex: number): string {
    return getSlot(section, slotIndex)?.alt || ''
  }

  function getCategory(section: string, slotIndex: number): string {
    return getSlot(section, slotIndex)?.category || ''
  }

  function hasImage(section: string, slotIndex: number): boolean {
    const url = getImageUrl(section, slotIndex)
    return !!url && url.trim().length > 0
  }

  return {
    items,
    loading,
    load,
    getSection,
    getSlot,
    getImageUrl,
    getTitle,
    getDescription,
    getCaption,
    getAlt,
    getCategory,
    hasImage,
  }
}

// Admin CRUD for component content
export async function getAllComponentContent(): Promise<ComponentContentItem[]> {
  try {
    const db = getFirebaseDb()
    const q = query(
      collection(db, 'cms_component_content'),
      orderBy('component'),
      orderBy('section'),
      orderBy('slotIndex')
    )
    const snap = await getDocs(q)
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as ComponentContentItem))
  } catch (e) {
    console.warn('Failed to load all component content:', e)
    return []
  }
}

export async function getComponentContent(component: string): Promise<ComponentContentItem[]> {
  try {
    const db = getFirebaseDb()
    const q = query(
      collection(db, 'cms_component_content'),
      where('component', '==', component),
      orderBy('section'),
      orderBy('slotIndex')
    )
    const snap = await getDocs(q)
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as ComponentContentItem))
  } catch (e) {
    console.warn(`Failed to load component content for ${component}:`, e)
    return []
  }
}

export async function createComponentContent(
  data: Omit<ComponentContentItem, 'id' | 'updatedAt'>
): Promise<string> {
  const db = getFirebaseDb()
  const id = `cc_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`
  await setDoc(doc(db, 'cms_component_content', id), {
    ...data,
    updatedAt: serverTimestamp(),
  })
  return id
}

export async function updateComponentContent(
  id: string,
  data: Partial<Omit<ComponentContentItem, 'id'>>,
  component?: string
): Promise<void> {
  const db = getFirebaseDb()
  await updateDoc(doc(db, 'cms_component_content', id), {
    ...data,
    updatedAt: serverTimestamp(),
  })
}

export async function deleteComponentContent(id: string): Promise<void> {
  const db = getFirebaseDb()
  await deleteDoc(doc(db, 'cms_component_content', id))
}

export async function batchUpdateSlotIndices(
  updates: { id: string; slotIndex: number; component: string }[]
): Promise<void> {
  const db = getFirebaseDb()
  const batch = writeBatch(db)
  for (const u of updates) {
    batch.update(doc(db, 'cms_component_content', u.id), {
      slotIndex: u.slotIndex,
      updatedAt: serverTimestamp(),
    })
  }
  await batch.commit()
}
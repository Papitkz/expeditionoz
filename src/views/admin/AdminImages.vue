<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import {
  getAllComponentContent,
  createComponentContent,
  updateComponentContent,
  deleteComponentContent,
  batchUpdateSlotIndices,
  type ComponentContentItem,
} from '@/composables/useComponentCMS'
import { useStorageUpload } from '@/composables/useStorageUpload'
import { useToast } from '@/composables/useToast'

interface SlotDef {
  slotIndex: number
  label: string
  defaultMediaType: 'image' | 'video'
}

interface SectionDef {
  section: string
  label: string
  slots: SlotDef[]
}

interface ComponentDef {
  component: string
  label: string
  file: string
  sections: SectionDef[]
}

// Registry of all Vue components and their content slots
const COMPONENT_REGISTRY: ComponentDef[] = [
  {
    component: 'HeroSection',
    label: 'Home — Hero Video Carousel',
    file: 'src/components/home/HeroSection.vue',
    sections: [
      { section: 'heroVideos', label: 'Hero Videos', slots: [
        { slotIndex: 0, label: 'Video 1', defaultMediaType: 'video' },
        { slotIndex: 1, label: 'Video 2', defaultMediaType: 'video' },
        { slotIndex: 2, label: 'Video 3', defaultMediaType: 'video' },
        { slotIndex: 3, label: 'Video 4', defaultMediaType: 'video' },
        { slotIndex: 4, label: 'Video 5', defaultMediaType: 'video' },
      ]},
    ],
  },
  // {
  //   component: 'IntroSection',
  //   label: 'Home — Intro Image Stack',
  //   file: 'src/components/home/IntroSection.vue',
  //   sections: [
  //     { section: 'introImages', label: 'Intro Images', slots: [
  //       { slotIndex: 0, label: 'Main Image', defaultMediaType: 'image' },
  //       { slotIndex: 1, label: 'Accent Image', defaultMediaType: 'image' },
  //     ]},
  //   ],
  // },
  {
    component: 'ToursSection',
    label: 'Home — Tour Cards',
    file: 'src/components/home/ToursSection.vue',
    sections: [
      { section: 'tourCards', label: 'Tour Cards', slots: [
        { slotIndex: 0, label: 'Dive Expedition Card', defaultMediaType: 'image' },
        { slotIndex: 1, label: 'Ocean Safari Card', defaultMediaType: 'image' },
      ]},
    ],
  },

  {
    component: 'ExperienceSection',
    label: 'Home — Ningaloo Route Map',
    file: 'src/components/home/ExperienceSection.vue',
    sections: [
      { section: 'experiences', label: 'Map Background', slots: [
        { slotIndex: 0, label: 'Terrain / Aerial Background', defaultMediaType: 'image' },
      ]},
    ],
  },
    {
    component: 'InclusionsSection',
    label: 'Home — Inclusions (Curated by the Ocean)',
    file: 'src/components/home/InclusionsSection.vue',
    sections: [
      { section: 'experienceCards', label: 'Experience Cards', slots: [
        { slotIndex: 0, label: 'Manta Ray Encounters', defaultMediaType: 'image' },
        { slotIndex: 1, label: 'Whale Watching', defaultMediaType: 'image' },
        { slotIndex: 2, label: 'Freediving', defaultMediaType: 'image' },
        { slotIndex: 3, label: 'Remote Beach Exploration', defaultMediaType: 'image' },
        { slotIndex: 4, label: 'Kayaking Yardie Creek', defaultMediaType: 'image' },
        { slotIndex: 5, label: 'Yoga & Breathwork', defaultMediaType: 'image' },
        { slotIndex: 6, label: 'Sunset Dinners', defaultMediaType: 'image' },
        { slotIndex: 7, label: 'Expedition RIB Adventures', defaultMediaType: 'image' },
      ]},
      { section: 'natureBg', label: 'Nature Box Background', slots: [
        { slotIndex: 0, label: 'Boat / Nature Background Image', defaultMediaType: 'image' },
      ]},
    ],
  },
  
  {
    component: 'CtaSection',
    label: 'Home — CTA Background',
    file: 'src/components/home/CtaSection.vue',
    sections: [
      { section: 'ctaBackground', label: 'CTA Background', slots: [
        { slotIndex: 0, label: 'Background Image', defaultMediaType: 'image' },
      ]},
    ],
  },
  {
    component: 'AboutView',
    label: 'About Page',
    file: 'src/views/AboutView.vue',
    sections: [
      { section: 'hero', label: 'Hero', slots: [
        { slotIndex: 0, label: 'Hero Image', defaultMediaType: 'image' },
      ]},
      { section: 'aboutImages', label: 'About Images', slots: [
        { slotIndex: 0, label: 'About Image 1', defaultMediaType: 'image' },
        { slotIndex: 1, label: 'About Image 2', defaultMediaType: 'image' },
      ]},
    ],
  },
  {
    component: 'ExpeditionsView',
    label: 'Expeditions Page',
    file: 'src/views/ExpeditionsView.vue',
    sections: [
      { section: 'hero', label: 'Hero', slots: [
        { slotIndex: 0, label: 'Hero Image', defaultMediaType: 'image' },
      ]},
      { section: 'hoverImages', label: 'Hover Preview Images', slots: [
        { slotIndex: 0, label: 'Ocean Safari Hover', defaultMediaType: 'image' },
        { slotIndex: 1, label: 'Dive Expedition Hover', defaultMediaType: 'image' },
      ]},
    ],
  },
  {
    component: 'OceanSafariView',
    label: 'Ocean Safari Expedition Page',
    file: 'src/views/OceanSafariView.vue',
    sections: [
      { section: 'hero', label: 'Hero', slots: [
        { slotIndex: 0, label: 'Hero Video', defaultMediaType: 'video' },
        { slotIndex: 1, label: 'Hero Poster', defaultMediaType: 'image' },
      ]},
      { section: 'about', label: 'About Section', slots: [
        { slotIndex: 0, label: 'About Image', defaultMediaType: 'image' },
      ]},
      { section: 'vesselGallery', label: 'Vessel Gallery', slots: [
        { slotIndex: 0, label: 'Gallery 1', defaultMediaType: 'image' },
        { slotIndex: 1, label: 'Gallery 2', defaultMediaType: 'image' },
        { slotIndex: 2, label: 'Gallery 3', defaultMediaType: 'image' },
        { slotIndex: 3, label: 'Gallery 4', defaultMediaType: 'image' },
        { slotIndex: 4, label: 'Gallery 5', defaultMediaType: 'image' },
        { slotIndex: 5, label: 'Gallery 6', defaultMediaType: 'image' },
      ]},
      { section: 'diningGallery', label: 'Dining Gallery', slots: [
        { slotIndex: 0, label: 'Dining 1', defaultMediaType: 'image' },
        { slotIndex: 1, label: 'Dining 2', defaultMediaType: 'image' },
        { slotIndex: 2, label: 'Dining 3', defaultMediaType: 'image' },
        { slotIndex: 3, label: 'Dining 4', defaultMediaType: 'image' },
      ]},
      { section: 'itinerary', label: 'Itinerary', slots: [
        { slotIndex: 0, label: 'Day 1', defaultMediaType: 'image' },
        { slotIndex: 1, label: 'Day 2', defaultMediaType: 'image' },
        { slotIndex: 2, label: 'Day 3', defaultMediaType: 'image' },
        { slotIndex: 3, label: 'Day 4', defaultMediaType: 'image' },
        { slotIndex: 4, label: 'Day 5', defaultMediaType: 'image' },
        { slotIndex: 5, label: 'Day 6', defaultMediaType: 'image' },
      ]},
      { section: 'routeMap', label: 'Route Map Background', slots: [
        { slotIndex: 0, label: 'Route Map BG', defaultMediaType: 'image' },
      ]},
    ],
  },
  {
    component: 'DiveExpeditionView',
    label: 'Dive Expedition Page',
    file: 'src/views/DiveExpeditionView.vue',
    sections: [
      { section: 'hero', label: 'Hero', slots: [
        { slotIndex: 0, label: 'Hero Video', defaultMediaType: 'video' },
        { slotIndex: 1, label: 'Hero Poster', defaultMediaType: 'image' },
      ]},
      { section: 'about', label: 'About Section', slots: [
        { slotIndex: 0, label: 'About Image 1', defaultMediaType: 'image' },
        { slotIndex: 1, label: 'About Image 2', defaultMediaType: 'image' },
        { slotIndex: 2, label: 'About Image 3', defaultMediaType: 'image' },
        { slotIndex: 3, label: 'About Image 4', defaultMediaType: 'image' },
      ]},
      { section: 'vesselGallery', label: 'Vessel Gallery', slots: [
        { slotIndex: 0, label: 'Gallery 1', defaultMediaType: 'image' },
        { slotIndex: 1, label: 'Gallery 2', defaultMediaType: 'image' },
        { slotIndex: 2, label: 'Gallery 3', defaultMediaType: 'image' },
        { slotIndex: 3, label: 'Gallery 4', defaultMediaType: 'image' },
        { slotIndex: 4, label: 'Gallery 5', defaultMediaType: 'image' },
        { slotIndex: 5, label: 'Gallery 6', defaultMediaType: 'image' },
        { slotIndex: 6, label: 'Gallery 7', defaultMediaType: 'image' },
        { slotIndex: 7, label: 'Gallery 8', defaultMediaType: 'image' },
      ]},
      { section: 'diningGallery', label: 'Dining Gallery', slots: [
        { slotIndex: 0, label: 'Dining 1', defaultMediaType: 'image' },
        { slotIndex: 1, label: 'Dining 2', defaultMediaType: 'image' },
        { slotIndex: 2, label: 'Dining 3', defaultMediaType: 'image' },
        { slotIndex: 3, label: 'Dining 4', defaultMediaType: 'image' },
        { slotIndex: 4, label: 'Dining 5', defaultMediaType: 'image' },
        { slotIndex: 5, label: 'Dining 6', defaultMediaType: 'image' },
      ]},
      { section: 'itinerary', label: 'Itinerary', slots: [
        { slotIndex: 0, label: 'Day 1', defaultMediaType: 'image' },
        { slotIndex: 1, label: 'Day 2', defaultMediaType: 'image' },
        { slotIndex: 2, label: 'Day 3', defaultMediaType: 'image' },
        { slotIndex: 3, label: 'Day 4', defaultMediaType: 'image' },
        { slotIndex: 4, label: 'Day 5', defaultMediaType: 'image' },
        { slotIndex: 5, label: 'Day 6', defaultMediaType: 'image' },
        { slotIndex: 6, label: 'Day 7', defaultMediaType: 'image' },
        { slotIndex: 7, label: 'Day 8', defaultMediaType: 'image' },
        { slotIndex: 8, label: 'Day 9', defaultMediaType: 'image' },
      ]},
      { section: 'routeMap', label: 'Route Map Background', slots: [
        { slotIndex: 0, label: 'Route Map BG', defaultMediaType: 'image' },
      ]},
    ],
  },
  {
    component: 'BlogListView',
    label: 'Blog List Page',
    file: 'src/views/BlogListView.vue',
    sections: [
      { section: 'hero', label: 'Hero', slots: [
        { slotIndex: 0, label: 'Hero Image', defaultMediaType: 'image' },
        { slotIndex: 1, label: 'Hero Video', defaultMediaType: 'video' },
      ]},
    ],
  },
  {
    component: 'ContactView',
    label: 'Contact Page',
    file: 'src/views/ContactView.vue',
    sections: [
      { section: 'hero', label: 'Hero', slots: [
        { slotIndex: 0, label: 'Hero Image', defaultMediaType: 'image' },
        { slotIndex: 1, label: 'Hero Video', defaultMediaType: 'video' },
      ]},
    ],
  },
  {
    component: 'FaqView',
    label: 'FAQ Page',
    file: 'src/views/FaqView.vue',
    sections: [
      { section: 'hero', label: 'Hero', slots: [
        { slotIndex: 0, label: 'Hero Image', defaultMediaType: 'image' },
        // { slotIndex: 1, label: 'Hero Video', defaultMediaType: 'video' },
      ]},
    ],
  },
  {
    component: 'NotFoundView',
    label: '404 — Not Found Page',
    file: 'src/views/NotFoundView.vue',
    sections: [
      { section: 'oceanLayers', label: 'Ocean Background Layers', slots: [
        { slotIndex: 0, label: 'Back Layer', defaultMediaType: 'image' },
        { slotIndex: 1, label: 'Mid Layer', defaultMediaType: 'image' },
        { slotIndex: 2, label: 'Front Layer', defaultMediaType: 'image' },
      ]},
    ],
  },
]

// --- Staging State (outside computed, so mutations persist) ---
interface StagedSlot {
  editImageUrl: string
  alt: string
  title: string
  description: string
  caption: string
  category: string
  mediaType: 'image' | 'video'
  hasUnsavedChanges: boolean
  uploading: boolean
}

const stagedSlots = ref<Map<string, StagedSlot>>(new Map())

function getSlotKey(component: string, section: string, slotIndex: number): string {
  return `${component}__${section}__${slotIndex}`
}

function getOrCreateStaged(component: string, section: string, slotIndex: number, defaults: Partial<StagedSlot> = {}): StagedSlot {
  const key = getSlotKey(component, section, slotIndex)
  if (!stagedSlots.value.has(key)) {
    stagedSlots.value.set(key, {
      editImageUrl: defaults.editImageUrl || '',
      alt: defaults.alt || '',
      title: defaults.title || '',
      description: defaults.description || '',
      caption: defaults.caption || '',
      category: defaults.category || '',
      mediaType: (defaults.mediaType as 'image' | 'video') || 'image',
      hasUnsavedChanges: false,
      uploading: false,
    })
  }
  return stagedSlots.value.get(key)!
}

function clearStaged(component: string, section: string, slotIndex: number) {
  const key = getSlotKey(component, section, slotIndex)
  stagedSlots.value.delete(key)
}

// ---

const { uploadImage } = useStorageUpload()
const toast = useToast()

const activeComponent = ref('')
const activeSection = ref('')
const searchQuery = ref('')
const allItems = ref<ComponentContentItem[]>([])
const loading = ref(true)
const savingAll = ref(false)

const componentDefs = computed(() => COMPONENT_REGISTRY)

const activeComponentDef = computed(() =>
  COMPONENT_REGISTRY.find((c) => c.component === activeComponent.value)
)

const activeSectionDef = computed(() =>
  activeComponentDef.value?.sections.find((s) => s.section === activeSection.value)
)

// Unified slot item type for the entire component
interface SlotItem {
  id: string | undefined
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
  label: string
  defaultMediaType: 'image' | 'video'
  isSeeded: boolean
  staged: StagedSlot
}

// Build slot items by merging registry + CMS data + staged state
const slotItems = computed((): SlotItem[] => {
  if (!activeComponentDef.value || !activeSectionDef.value) return []

  return activeSectionDef.value.slots.map((slot) => {
    const cmsItem = allItems.value.find(
      (i) =>
        i.component === activeComponent.value &&
        i.section === activeSection.value &&
        i.slotIndex === slot.slotIndex
    )

    const staged = getOrCreateStaged(
      activeComponent.value,
      activeSection.value,
      slot.slotIndex,
      {
        editImageUrl: cmsItem?.imageUrl || '',
        alt: cmsItem?.alt || '',
        title: cmsItem?.title || '',
        description: cmsItem?.description || '',
        caption: cmsItem?.caption || '',
        category: cmsItem?.category || '',
        mediaType: cmsItem?.mediaType || slot.defaultMediaType,
      }
    )

    return {
      id: cmsItem?.id,
      component: activeComponent.value,
      section: activeSection.value,
      slotIndex: slot.slotIndex,
      imageUrl: cmsItem?.imageUrl || null,
      alt: cmsItem?.alt || '',
      title: cmsItem?.title || '',
      description: cmsItem?.description || '',
      caption: cmsItem?.caption || '',
      category: cmsItem?.category || '',
      mediaType: cmsItem?.mediaType || slot.defaultMediaType,
      label: slot.label,
      defaultMediaType: slot.defaultMediaType,
      isSeeded: !!cmsItem,
      staged,
    }
  })
})

const filteredComponents = computed(() => {
  if (!searchQuery.value.trim()) return COMPONENT_REGISTRY
  const q = searchQuery.value.toLowerCase()
  return COMPONENT_REGISTRY.filter(
    (c) =>
      c.label.toLowerCase().includes(q) ||
      c.component.toLowerCase().includes(q) ||
      c.sections.some((s) => s.label.toLowerCase().includes(q) || s.section.toLowerCase().includes(q))
  )
})

function getComponentImageCount(component: string): number {
  return allItems.value.filter((i) => i.component === component && i.imageUrl).length
}

function getComponentTotalSlots(component: string): number {
  const def = COMPONENT_REGISTRY.find((c) => c.component === component)
  if (!def) return 0
  return def.sections.reduce((sum, s) => sum + s.slots.length, 0)
}

async function loadAll() {
  loading.value = true
  allItems.value = await getAllComponentContent()
  loading.value = false
}

async function handleFileUpload(event: Event, slot: SlotItem) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  slot.staged.uploading = true
  const result = await uploadImage(file, `${slot.component}_${slot.section}_${slot.slotIndex}`)
  if (result) {
    slot.staged.editImageUrl = result.url
    slot.staged.hasUnsavedChanges = true
    toast.success('Upload complete! New image ready — click Save to confirm.')
  } else {
    toast.error('Upload failed')
  }
  slot.staged.uploading = false
  target.value = ''
}

async function saveSlot(slot: SlotItem) {
  slot.staged.uploading = true
  try {
    const data = {
      imageUrl: slot.staged.editImageUrl.trim() || null,
      alt: slot.staged.alt.trim(),
      title: slot.staged.title.trim(),
      description: slot.staged.description.trim(),
      caption: slot.staged.caption.trim(),
      category: slot.staged.category.trim(),
      mediaType: slot.staged.mediaType,
    }

    if (slot.id) {
      await updateComponentContent(slot.id, data, slot.component)
    } else {
      const id = await createComponentContent({
        component: slot.component,
        section: slot.section,
        slotIndex: slot.slotIndex,
        ...data,
      })
      await loadAll()
    }

    slot.staged.hasUnsavedChanges = false
    toast.success(`Slot #${slot.slotIndex + 1} saved`)
    await loadAll()
  } catch (err: any) {
    toast.error(err.message || 'Save failed')
  }
  slot.staged.uploading = false
}

function removeImage(slot: SlotItem) {
  slot.staged.editImageUrl = ''
  slot.staged.hasUnsavedChanges = true
  toast.info('Image removed from preview. Click Save to confirm.')
}

async function moveSlot(slot: SlotItem, direction: 'up' | 'down') {
  const siblings = slotItems.value
  const idx = siblings.findIndex((s) => s.slotIndex === slot.slotIndex)
  if (idx === -1) return

  const swapIdx = direction === 'up' ? idx - 1 : idx + 1
  if (swapIdx < 0 || swapIdx >= siblings.length) return

  const sibling = siblings[swapIdx]

  const updates: { id: string; slotIndex: number; component: string }[] = []

  if (slot.id) {
    updates.push({ id: slot.id, slotIndex: sibling.slotIndex, component: slot.component })
  }
  if (sibling.id) {
    updates.push({ id: sibling.id, slotIndex: slot.slotIndex, component: sibling.component })
  }

  if (updates.length > 0) {
    savingAll.value = true
    await batchUpdateSlotIndices(updates)
    await loadAll()
    savingAll.value = false
    toast.success('Order updated')
  }
}

async function deleteSlot(slot: SlotItem) {
  if (!slot.id) return
  if (!confirm('Delete this slot from CMS? This will remove the image and all content.')) return

  savingAll.value = true
  try {
    await deleteComponentContent(slot.id)
    clearStaged(slot.component, slot.section, slot.slotIndex)
    toast.success('Slot deleted')
    await loadAll()
  } catch (err: any) {
    toast.error(err.message || 'Delete failed')
  }
  savingAll.value = false
}

function isImageUrl(url: string): boolean {
  if (!url) return false
  const lower = url.toLowerCase()
  if (lower.includes('/image/upload/')) return true
  const imageExts = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.avif', '.svg', '.bmp', '.tiff']
  const hasImageExt = imageExts.some((ext) => lower.includes(ext))
  const hasVideoExt = lower.includes('.mp4') || lower.includes('.webm') || lower.includes('.mov')
  return hasImageExt && !hasVideoExt
}

function isVideoUrl(url: string): boolean {
  if (!url) return false
  const lower = url.toLowerCase()
  if (lower.includes('/video/upload/')) return true
  return lower.includes('.mp4') || lower.includes('.webm') || lower.includes('.mov') || lower.includes('player.vimeo') || lower.includes('youtube.com') || lower.includes('youtu.be')
}

// Auto-select first component on load
watch(
  () => loading.value,
  (val) => {
    if (!val && !activeComponent.value && COMPONENT_REGISTRY.length > 0) {
      activeComponent.value = COMPONENT_REGISTRY[0].component
      activeSection.value = COMPONENT_REGISTRY[0].sections[0].section
    }
  }
)

onMounted(() => {
  loadAll()
})
</script>

<template>
  <div class="admin-images">
    <!-- Header -->
    <div class="admin-header">
      <div class="header-accent">
        <span class="header-line"></span>
        <span class="header-tag">Component CMS</span>
      </div>
      <h1 class="admin-title">Media &amp; Content <em>Manager</em></h1>
      <p class="admin-subtitle">
        Manage all visual assets and content per Vue component. Each slot has a fixed position — upload or paste a URL to populate it.
      </p>
    </div>

    <div class="cms-layout">
      <!-- Sidebar: Component Tree -->
      <aside class="component-sidebar">
        <div class="search-box">
          <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <circle cx="11" cy="11" r="8"/>
            <path d="m21 21-4.3-4.3"/>
          </svg>
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search components..."
            class="search-input"
          />
        </div>

        <div class="component-list">
          <div
            v-for="comp in filteredComponents"
            :key="comp.component"
            class="component-group"
            :class="{ active: activeComponent === comp.component }"
          >
            <button
              class="component-header"
              @click="activeComponent = comp.component; activeSection = comp.sections[0].section"
            >
              <div class="component-name-group">
                <span class="component-name">{{ comp.label }}</span>
                <span class="component-file">📄 {{ comp.file }}</span>
              </div>
              <span class="component-count">
                {{ getComponentImageCount(comp.component) }}/{{ getComponentTotalSlots(comp.component) }}
              </span>
            </button>

            <div v-if="activeComponent === comp.component" class="section-list">
              <button
                v-for="sec in comp.sections"
                :key="sec.section"
                class="section-btn"
                :class="{ active: activeSection === sec.section }"
                @click="activeSection = sec.section"
              >
                <span class="section-label">{{ sec.label }}</span>
                <span class="section-badge">{{ sec.slots.length }}</span>
              </button>
            </div>
          </div>
        </div>
      </aside>

      <!-- Main: Slot Grid -->
      <main class="slot-main">
        <div v-if="loading" class="loading-state">
          <div class="loading-spinner"></div>
          <p>Loading CMS data...</p>
        </div>

        <div v-else-if="!activeComponentDef" class="empty-state">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" width="48" height="48">
            <rect x="3" y="3" width="18" height="18" rx="2"/>
            <circle cx="9" cy="9" r="2"/>
            <path d="m21 15-3.09-3.09a2 2 0 0 0-2.83 0L6 21"/>
          </svg>
          <p>Select a component from the sidebar to manage its content.</p>
        </div>

        <div v-else-if="activeComponentDef && activeSectionDef">
          <!-- Section Header -->
          <div class="section-header">
            <div>
              <h2 class="section-title">{{ activeComponentDef.label }}</h2>
              <p class="section-file-path">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                {{ activeComponentDef.file }}
              </p>
              <p class="section-subtitle">
                {{ activeSectionDef.label }} — 
                <span class="slot-count">{{ slotItems.length }} slot{{ slotItems.length === 1 ? '' : 's' }}</span>
              </p>
            </div>
            <button class="refresh-btn" @click="loadAll" :disabled="loading">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="23 4 23 10 17 10"/>
                <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
              </svg>
              Refresh
            </button>
          </div>

          <!-- Slots Grid -->
          <div class="slots-grid">
            <div
              v-for="slot in slotItems"
              :key="`${slot.component}-${slot.section}-${slot.slotIndex}`"
              class="slot-card"
              :class="{ 
                'has-image': slot.staged.editImageUrl && slot.staged.editImageUrl.trim().length > 0, 
                'no-image': !slot.staged.editImageUrl || slot.staged.editImageUrl.trim().length === 0 
              }"
            >
              <!-- Slot Purpose Header -->
              <div class="slot-purpose-header">
                <div class="slot-purpose-left">
                  <span class="slot-index-pill">#{{ slot.slotIndex + 1 }}</span>
                  <div class="slot-purpose-info">
                    <span class="slot-purpose-label">{{ slot.label }}</span>
                    <span class="slot-purpose-path">
                      <span class="slot-file-chip">📄 {{ activeComponentDef?.file }}</span>
                      <span class="slot-breadcrumb"> › {{ activeSectionDef?.label }}</span>
                    </span>
                  </div>
                </div>
                <span class="slot-type-tag" :class="slot.defaultMediaType === 'video' ? 'video-tag' : 'image-tag'">
                  <svg v-if="slot.defaultMediaType === 'video'" width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><polygon points="5,3 19,12 5,21"/></svg>
                  <svg v-else width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/></svg>
                  {{ slot.defaultMediaType }}
                </span>
              </div>

              <!-- Media Preview -->
              <div class="slot-preview">
                <template v-if="slot.staged.editImageUrl && slot.staged.editImageUrl.trim().length > 0">
                  <img
                    v-if="isImageUrl(slot.staged.editImageUrl)"
                    :src="slot.staged.editImageUrl"
                    :alt="slot.staged.alt || 'Preview'"
                    class="preview-media"
                    @error="slot.staged.editImageUrl = ''; slot.staged.hasUnsavedChanges = true"
                  />
                  <video
                    v-else-if="isVideoUrl(slot.staged.editImageUrl)"
                    :src="slot.staged.editImageUrl"
                    class="preview-media"
                    muted
                    playsinline
                    preload="metadata"
                  />
                  <div v-else class="preview-media preview-generic">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
                      <rect x="3" y="3" width="18" height="18" rx="2"/>
                      <circle cx="8.5" cy="8.5" r="1.5"/>
                      <path d="m21 15-3.09-3.09a2 2 0 0 0-2.83 0L6 21"/>
                    </svg>
                  </div>
                </template>
                <div v-else class="preview-placeholder">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
                    <rect x="3" y="3" width="18" height="18" rx="2"/>
                    <circle cx="8.5" cy="8.5" r="1.5"/>
                    <path d="m21 15-3.09-3.09a2 2 0 0 0-2.83 0L6 21"/>
                  </svg>
                  <span>No Image</span>
                </div>

                <div class="slot-badges">
                  <span class="media-badge">{{ slot.staged.mediaType }}</span>
                  <span v-if="slot.imageUrl && !slot.staged.hasUnsavedChanges" class="status-badge active">Saved</span>
                  <span v-else-if="slot.staged.editImageUrl && slot.staged.editImageUrl.trim().length > 0 && slot.staged.hasUnsavedChanges" class="status-badge unsaved">Unsaved</span>
                  <span v-else-if="slot.staged.editImageUrl && slot.staged.editImageUrl.trim().length > 0 && !slot.staged.hasUnsavedChanges" class="status-badge active">Saved</span>
                  <span v-else class="status-badge empty">Empty</span>
                </div>
              </div>

              <!-- Slot Form -->
              <div class="slot-form">
                <div class="form-row">
                  <label class="form-label">Image / Video URL</label>
                  <input
                    v-model="slot.staged.editImageUrl"
                    type="text"
                    class="form-input"
                    placeholder="Paste URL or upload..."
                    @input="slot.staged.hasUnsavedChanges = true"
                  />
                </div>

                <div class="form-row">
                  <label class="form-label">Title</label>
                  <input
                    v-model="slot.staged.title"
                    type="text"
                    class="form-input"
                    placeholder="Item title..."
                    @input="slot.staged.hasUnsavedChanges = true"
                  />
                </div>

                <div class="form-row">
                  <label class="form-label">Description</label>
                  <textarea
                    v-model="slot.staged.description"
                    class="form-textarea"
                    rows="2"
                    placeholder="Item description..."
                    @input="slot.staged.hasUnsavedChanges = true"
                  />
                </div>

                <div class="form-row compact">
                  <div class="form-col">
                    <label class="form-label">Caption</label>
                    <input 
                      v-model="slot.staged.caption" 
                      type="text" 
                      class="form-input" 
                      placeholder="Caption..." 
                      @input="slot.staged.hasUnsavedChanges = true"
                    />
                  </div>
                  <div class="form-col">
                    <label class="form-label">Alt Text</label>
                    <input 
                      v-model="slot.staged.alt" 
                      type="text" 
                      class="form-input" 
                      placeholder="Alt text..." 
                      @input="slot.staged.hasUnsavedChanges = true"
                    />
                  </div>
                </div>

                <div class="form-row compact">
                  <div class="form-col">
                    <label class="form-label">Category</label>
                    <input 
                      v-model="slot.staged.category" 
                      type="text" 
                      class="form-input" 
                      placeholder="Category..." 
                      @input="slot.staged.hasUnsavedChanges = true"
                    />
                  </div>
                  <div class="form-col">
                    <label class="form-label">Media Type</label>
                    <select 
                      v-model="slot.staged.mediaType" 
                      class="form-select"
                      @change="slot.staged.hasUnsavedChanges = true"
                    >
                      <option value="image">Image</option>
                      <option value="video">Video</option>
                    </select>
                  </div>
                </div>

                <!-- Actions -->
                <div class="slot-actions">
                  <input
                    :id="`file-${slot.component}-${slot.section}-${slot.slotIndex}`"
                    type="file"
                    accept="image/*,video/*"
                    class="file-input"
                    @change="(e) => handleFileUpload(e, slot)"
                  />
                  <label
                    :for="`file-${slot.component}-${slot.section}-${slot.slotIndex}`"
                    class="btn-upload"
                    :class="{ uploading: slot.staged.uploading }"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                      <polyline points="17 8 12 3 7 8"/>
                      <line x1="12" y1="3" x2="12" y2="15"/>
                    </svg>
                    {{ slot.staged.uploading ? 'Uploading...' : 'Upload' }}
                  </label>

                  <button
                    class="btn-save"
                    :class="{ saving: slot.staged.uploading, 'has-changes': slot.staged.hasUnsavedChanges }"
                    :disabled="slot.staged.uploading || !slot.staged.hasUnsavedChanges"
                    @click="saveSlot(slot)"
                  >
                    <svg v-if="!slot.staged.uploading" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12">
                      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
                      <polyline points="17 21 17 13 7 13 7 21"/>
                      <polyline points="7 3 7 8 15 8"/>
                    </svg>
                    {{ slot.staged.uploading ? 'Saving...' : 'Save' }}
                  </button>

                  <button
                    v-if="slot.staged.editImageUrl && slot.staged.editImageUrl.trim().length > 0"
                    class="btn-remove"
                    :disabled="slot.staged.uploading"
                    @click="removeImage(slot)"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12">
                      <polyline points="3 6 5 6 21 6"/>
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                    </svg>
                    Remove
                  </button>

                  <div class="reorder-btns">
                    <button
                      class="btn-reorder"
                      :disabled="slot.slotIndex === 0 || slot.staged.uploading"
                      @click="moveSlot(slot, 'up')"
                      title="Move up"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="18 15 12 9 6 15"/>
                      </svg>
                    </button>
                    <button
                      class="btn-reorder"
                      :disabled="slot.slotIndex === slotItems.length - 1 || slot.staged.uploading"
                      @click="moveSlot(slot, 'down')"
                      title="Move down"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="6 9 12 15 18 9"/>
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  </div>
</template>

<style scoped>
.admin-images {
  min-height: 100vh;
  background: var(--color-ocean-950, #071a2b);
  padding: 2rem;
  color: var(--color-sand-100, #f8f5ef);
}

/* === Header === */
.admin-header {
  margin-bottom: 2rem;
  max-width: 800px;
}

.header-accent {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
}

.header-line {
  width: 40px;
  height: 1px;
  background: var(--color-gold-400, #c9a84c);
  opacity: 0.6;
}

.header-tag {
  font-family: 'Montserrat', sans-serif;
  font-size: 0.6rem;
  letter-spacing: 0.25em;
  text-transform: uppercase;
  color: var(--color-gold-400, #c9a84c);
  opacity: 0.8;
}

.admin-title {
  font-family: var(--font-display, 'Cormorant Garamond', serif);
  font-size: 2rem;
  font-weight: 300;
  color: var(--color-sand-100, #f8f5ef);
  letter-spacing: -0.02em;
  line-height: 1.1;
  margin-bottom: 0.75rem;
}

.admin-title em {
  font-style: italic;
  color: var(--color-gold-400, #c9a84c);
}

.admin-subtitle {
  font-size: 0.8rem;
  line-height: 1.7;
  color: var(--color-sand-200, rgba(248, 245, 239, 0.55));
  max-width: 500px;
}

/* === Layout === */
.cms-layout {
  display: grid;
  grid-template-columns: 280px 1fr;
  gap: 1.5rem;
  align-items: start;
}

/* === Sidebar === */
.component-sidebar {
  background: rgba(10, 46, 74, 0.3);
  border: 1px solid rgba(201, 168, 76, 0.08);
  padding: 1rem;
  position: sticky;
  top: 2rem;
  max-height: calc(100vh - 4rem);
  overflow-y: auto;
}

.search-box {
  position: relative;
  margin-bottom: 1rem;
}

.search-icon {
  position: absolute;
  left: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  width: 14px;
  height: 14px;
  color: var(--color-sand-300, rgba(248, 245, 239, 0.3));
  pointer-events: none;
}

.search-input {
  width: 100%;
  padding: 0.625rem 0.75rem 0.625rem 2.25rem;
  background: rgba(7, 26, 43, 0.5);
  border: 1px solid rgba(201, 168, 76, 0.1);
  font-family: 'Inter', sans-serif;
  font-size: 0.75rem;
  color: var(--color-sand-100, #f8f5ef);
  outline: none;
  transition: all 0.3s ease;
}

.search-input::placeholder {
  color: var(--color-sand-300, rgba(248, 245, 239, 0.3));
}

.search-input:focus {
  border-color: var(--color-gold-400, #c9a84c);
}

.component-list {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.component-group {
  border-radius: 0;
  overflow: hidden;
}

.component-group.active {
  background: rgba(201, 168, 76, 0.05);
}

.component-header {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  padding: 0.625rem 0.75rem;
  background: transparent;
  border: none;
  border-left: 2px solid transparent;
  color: var(--color-sand-200, rgba(248, 245, 239, 0.6));
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: left;
}

.component-header:hover {
  background: rgba(201, 168, 76, 0.06);
  color: var(--color-sand-100, #f8f5ef);
}

.component-group.active .component-header {
  border-left-color: var(--color-gold-400, #c9a84c);
  color: var(--color-sand-100, #f8f5ef);
  background: rgba(201, 168, 76, 0.08);
}

.component-name {
  font-family: 'Montserrat', sans-serif;
  font-size: 0.7rem;
  font-weight: 500;
  letter-spacing: 0.05em;
}

.component-count {
  font-size: 0.6rem;
  background: rgba(201, 168, 76, 0.12);
  color: var(--color-gold-400, #c9a84c);
  padding: 0.125rem 0.375rem;
  font-weight: 600;
}

.section-list {
  padding-left: 0.75rem;
  border-left: 1px solid rgba(201, 168, 76, 0.1);
  margin-left: 0.75rem;
  margin-bottom: 0.5rem;
}

.section-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  padding: 0.4rem 0.625rem;
  background: transparent;
  border: none;
  color: var(--color-sand-300, rgba(248, 245, 239, 0.4));
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: left;
  font-family: 'Inter', sans-serif;
  font-size: 0.7rem;
}

.section-btn:hover {
  color: var(--color-sand-200, rgba(248, 245, 239, 0.7));
}

.section-btn.active {
  color: var(--color-gold-400, #c9a84c);
  background: rgba(201, 168, 76, 0.08);
}

.section-label {
  font-size: 0.7rem;
}

.section-badge {
  font-size: 0.55rem;
  background: rgba(78, 168, 201, 0.1);
  color: #4ea8c9;
  padding: 0.1rem 0.35rem;
  font-weight: 600;
}

/* === Main Content === */
.slot-main {
  min-height: 600px;
}

.section-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid rgba(201, 168, 76, 0.1);
}

.section-title {
  font-family: var(--font-display, 'Cormorant Garamond', serif);
  font-size: 1.25rem;
  font-weight: 300;
  color: var(--color-sand-100, #f8f5ef);
  margin-bottom: 0.25rem;
}

.section-subtitle {
  font-size: 0.75rem;
  color: var(--color-sand-300, rgba(248, 245, 239, 0.4));
}

.slot-count {
  color: var(--color-gold-400, #c9a84c);
}

.refresh-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.4rem 0.75rem;
  background: rgba(10, 46, 74, 0.5);
  border: 1px solid rgba(201, 168, 76, 0.15);
  color: var(--color-sand-200, rgba(248, 245, 239, 0.6));
  font-family: 'Montserrat', sans-serif;
  font-size: 0.6rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  cursor: pointer;
  transition: all 0.3s ease;
}

.refresh-btn:hover:not(:disabled) {
  border-color: var(--color-gold-400, #c9a84c);
  color: var(--color-gold-400, #c9a84c);
}

.refresh-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

/* === Slots Grid === */
.slots-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1rem;
}

.slot-card {
  background: rgba(10, 46, 74, 0.25);
  border: 1px solid rgba(201, 168, 76, 0.06);
  position: relative;
  transition: all 0.3s ease;
}

.slot-card:hover {
  border-color: rgba(201, 168, 76, 0.15);
  background: rgba(10, 46, 74, 0.4);
}

.slot-card:has(.status-badge.unsaved) {
  border-color: rgba(201, 168, 76, 0.25);
  box-shadow: 0 0 0 1px rgba(201, 168, 76, 0.1);
}

.slot-card.has-image {
  border-color: rgba(201, 168, 76, 0.18);
}

.slot-card.no-image {
  border-style: dashed;
}

/* === Slot Purpose Header === */
.slot-purpose-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.65rem 0.85rem;
  background: rgba(7, 26, 43, 0.95);
  border-bottom: 1px solid rgba(201, 168, 76, 0.18);
}

.slot-purpose-left {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  min-width: 0;
}

.slot-index-pill {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.5rem;
  height: 1.5rem;
  border-radius: 50%;
  background: rgba(201, 168, 76, 0.15);
  border: 1px solid rgba(201, 168, 76, 0.35);
  font-family: 'Montserrat', sans-serif;
  font-size: 0.55rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  color: var(--color-gold-400, #c9a84c);
}

.slot-purpose-info {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.slot-purpose-label {
  font-family: 'Montserrat', sans-serif;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  color: #e8dcc8;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.2;
}

.slot-purpose-path {
  font-family: 'Montserrat', sans-serif;
  font-size: 0.58rem;
  font-weight: 500;
  letter-spacing: 0.03em;
  color: rgba(201, 168, 76, 0.55);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-top: 0.1rem;
}

.slot-type-tag {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.2rem 0.5rem;
  border-radius: 2px;
  font-family: 'Montserrat', sans-serif;
  font-size: 0.55rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.slot-type-tag.image-tag {
  background: rgba(99, 179, 237, 0.12);
  border: 1px solid rgba(99, 179, 237, 0.3);
  color: #90cdf4;
}

.slot-type-tag.video-tag {
  background: rgba(236, 153, 75, 0.12);
  border: 1px solid rgba(236, 153, 75, 0.3);
  color: #f6ad55;
}

/* Legacy — kept for backwards compat but no longer rendered */
.slot-index-badge {
  display: none;
}

/* === Preview === */
.slot-preview {
  position: relative;
  aspect-ratio: 16 / 9;
  background: rgba(7, 26, 43, 0.6);
  overflow: hidden;
}

.preview-media {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.preview-generic {
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-gold-400, #c9a84c);
  opacity: 0.5;
}

.preview-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  color: rgba(248, 245, 239, 0.2);
}

.preview-placeholder span {
  font-family: 'Montserrat', sans-serif;
  font-size: 0.6rem;
  letter-spacing: 0.15em;
  text-transform: uppercase;
}

.slot-badges {
  position: absolute;
  bottom: 0.5rem;
  right: 0.5rem;
  display: flex;
  gap: 0.35rem;
}

.media-badge,
.status-badge {
  font-family: 'Montserrat', sans-serif;
  font-size: 0.5rem;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  padding: 0.2rem 0.4rem;
}

.media-badge {
  background: rgba(10, 46, 74, 0.9);
  border: 1px solid rgba(201, 168, 76, 0.2);
  color: var(--color-gold-400, #c9a84c);
}

.status-badge.active {
  background: rgba(76, 175, 80, 0.12);
  color: #4caf50;
  border: 1px solid rgba(76, 175, 80, 0.2);
}

.status-badge.empty {
  background: rgba(248, 245, 239, 0.05);
  color: rgba(248, 245, 239, 0.3);
  border: 1px solid rgba(248, 245, 239, 0.1);
}

.status-badge.unsaved {
  background: rgba(201, 168, 76, 0.15);
  color: #e8c05a;
  border: 1px solid rgba(201, 168, 76, 0.35);
  animation: pulse-unsaved 2s ease-in-out infinite;
}

@keyframes pulse-unsaved {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}

/* === Form === */
.slot-form {
  padding: 1rem;
}

.form-row {
  margin-bottom: 0.75rem;
}

.form-row.compact {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.5rem;
}

.form-label {
  display: block;
  font-family: 'Montserrat', sans-serif;
  font-size: 0.55rem;
  font-weight: 600;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--color-sand-300, rgba(248, 245, 239, 0.4));
  margin-bottom: 0.35rem;
}

.form-input,
.form-textarea,
.form-select {
  width: 100%;
  padding: 0.5rem 0.625rem;
  background: rgba(7, 26, 43, 0.5);
  border: 1px solid rgba(201, 168, 76, 0.1);
  font-family: 'Inter', sans-serif;
  font-size: 0.75rem;
  color: var(--color-sand-100, #f8f5ef);
  outline: none;
  transition: all 0.3s ease;
}

.form-input::placeholder,
.form-textarea::placeholder {
  color: var(--color-sand-300, rgba(248, 245, 239, 0.25));
}

.form-input:focus,
.form-textarea:focus,
.form-select:focus {
  border-color: var(--color-gold-400, #c9a84c);
  background: rgba(7, 26, 43, 0.7);
}

.form-textarea {
  resize: vertical;
  min-height: 48px;
}

.form-select {
  appearance: auto;
  cursor: pointer;
}

.form-select option {
  background: #0a2e4a;
  color: #f8f5ef;
}

/* === Actions === */
.slot-actions {
  display: flex;
  gap: 0.4rem;
  align-items: center;
  flex-wrap: wrap;
  margin-top: 0.5rem;
  padding-top: 0.5rem;
  border-top: 1px solid rgba(201, 168, 76, 0.06);
}

.file-input {
  display: none;
}

.btn-upload,
.btn-save,
.btn-remove,
.btn-reorder {
  padding: 0.4rem 0.625rem;
  font-family: 'Montserrat', sans-serif;
  font-size: 0.6rem;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  cursor: pointer;
  transition: all 0.3s ease;
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  border: 1px solid;
  background: transparent;
}

.btn-upload {
  background: rgba(201, 168, 76, 0.1);
  border-color: rgba(201, 168, 76, 0.2);
  color: var(--color-gold-400, #c9a84c);
}

.btn-upload:hover {
  background: rgba(201, 168, 76, 0.2);
  border-color: var(--color-gold-400, #c9a84c);
}

.btn-upload.uploading {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-save {
  background: rgba(201, 168, 76, 0.1);
  border-color: rgba(201, 168, 76, 0.2);
  color: var(--color-sand-300, rgba(248, 245, 239, 0.4));
  cursor: not-allowed;
}

.btn-save.has-changes {
  background: var(--color-gold-400, #c9a84c);
  border-color: var(--color-gold-400, #c9a84c);
  color: var(--color-ocean-950, #071a2b);
  cursor: pointer;
}

.btn-save.has-changes:hover:not(:disabled) {
  background: #e8c05a;
  border-color: #e8c05a;
}

.btn-save:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.btn-remove {
  border-color: rgba(224, 123, 90, 0.2);
  color: rgba(224, 123, 90, 0.7);
}

.btn-remove:hover:not(:disabled) {
  background: rgba(224, 123, 90, 0.1);
  border-color: rgba(224, 123, 90, 0.3);
  color: #e07b5a;
}

.reorder-btns {
  display: flex;
  gap: 0.25rem;
  margin-left: auto;
}

.btn-reorder {
  padding: 0.3rem;
  border-color: rgba(201, 168, 76, 0.1);
  color: var(--color-sand-300, rgba(248, 245, 239, 0.4));
}

.btn-reorder:hover:not(:disabled) {
  border-color: rgba(201, 168, 76, 0.3);
  color: var(--color-gold-400, #c9a84c);
}

.btn-reorder:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

/* === Loading / Empty === */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  padding: 4rem;
  color: var(--color-sand-300, rgba(248, 245, 239, 0.4));
}

.loading-spinner {
  width: 28px;
  height: 28px;
  border: 1px solid rgba(201, 168, 76, 0.15);
  border-top-color: var(--color-gold-400, #c9a84c);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.empty-state {
  text-align: center;
  padding: 4rem;
  color: var(--color-sand-300, rgba(248, 245, 239, 0.3));
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.empty-state svg {
  color: rgba(201, 168, 76, 0.2);
}

.empty-state p {
  font-size: 0.8rem;
}

/* === Responsive === */
@media (max-width: 1024px) {
  .cms-layout {
    grid-template-columns: 1fr;
  }

  .component-sidebar {
    position: static;
    max-height: none;
  }
}

@media (max-width: 640px) {
  .admin-images {
    padding: 1rem;
  }

  .slots-grid {
    grid-template-columns: 1fr;
  }

  .form-row.compact {
    grid-template-columns: 1fr;
  }

  .slot-actions {
    flex-direction: column;
    align-items: stretch;
  }

  .btn-upload,
  .btn-save,
  .btn-remove {
    width: 100%;
    justify-content: center;
  }

  .reorder-btns {
    margin-left: 0;
    width: 100%;
    justify-content: center;
  }
}

/* === Vue File Path Labels === */

/* Sidebar: file path under component name */
.component-name-group {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  min-width: 0;
  flex: 1;
}

.component-file {
  font-family: 'Courier New', Courier, monospace;
  font-size: 0.52rem;
  color: rgba(201, 168, 76, 0.45);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  letter-spacing: 0;
  font-weight: 400;
}

.component-group.active .component-file {
  color: rgba(201, 168, 76, 0.7);
}

/* Section header: file path line */
.section-file-path {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  font-family: 'Courier New', Courier, monospace;
  font-size: 0.62rem;
  color: rgba(201, 168, 76, 0.55);
  margin-bottom: 0.35rem;
  margin-top: 0.2rem;
  letter-spacing: 0;
}

/* Slot card: file chip in the breadcrumb */
.slot-file-chip {
  font-family: 'Courier New', Courier, monospace;
  font-size: 0.54rem;
  color: rgba(201, 168, 76, 0.6);
  background: rgba(201, 168, 76, 0.07);
  border: 1px solid rgba(201, 168, 76, 0.15);
  padding: 0.1rem 0.35rem;
  letter-spacing: 0;
  white-space: nowrap;
}

.slot-breadcrumb {
  color: rgba(201, 168, 76, 0.45);
  font-size: 0.54rem;
  font-family: 'Montserrat', sans-serif;
}

.slot-purpose-path {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.25rem;
  margin-top: 0.15rem;
}

</style>
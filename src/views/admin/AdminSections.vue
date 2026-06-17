<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { getFirebaseDb } from '@/lib/firebase'
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  setDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore'
import { useStorageUpload } from '@/composables/useStorageUpload'

// ─── Types ───────────────────────────────────────────────────────────────────

interface Section {
  id: string
  sectionKey: string
  page: string
  label: string
  description: string
  defaultImageUrl: string
  defaultVideoUrl: string
}

interface SectionImage {
  id: string
  sectionId: string
  imageUrl: string
  altText: string
  sortOrder: number
  isActive: boolean
  createdAt: any
}

interface SectionVideo {
  id: string
  sectionId: string
  videoUrl: string
  filePath: string
  sortOrder: number
  isActive: boolean
  createdAt: any
}

// Maps each page → its Vue component file(s) and visual description
const PAGE_COMPONENT_MAP: Record<string, {
  component: string
  file: string
  description: string
  color: string
}> = {
  home: { component: 'HomeView', file: 'src/views/HomeView.vue', description: 'Landing page — Hero, Tours, Experience, Inclusions', color: '#4ea8c9' },
  about: { component: 'AboutView', file: 'src/views/AboutView.vue', description: 'About page — Team, Story, Mission', color: '#a0c878' },
  expeditions: { component: 'ExpeditionsView', file: 'src/views/ExpeditionsView.vue', description: 'Expeditions listing page', color: '#c9a84c' },
  contact: { component: 'ContactView', file: 'src/views/ContactView.vue', description: 'Contact page — Form, Map', color: '#c878a0' },
  faq: { component: 'FaqView', file: 'src/views/FaqView.vue', description: 'FAQ page — Questions & Answers', color: '#a878c9' },
  blog: { component: 'BlogListView', file: 'src/views/BlogListView.vue', description: 'Blog listing page', color: '#c9a878' },
  'ocean-safari': { component: 'OceanSafariView', file: 'src/views/OceanSafariView.vue', description: 'Ocean Safari expedition detail page', color: '#78a8c9' },
  'dive-expedition': { component: 'DiveExpeditionView', file: 'src/views/DiveExpeditionView.vue', description: 'Dive Expedition detail page', color: '#c97878' },
}

// ─── State ───────────────────────────────────────────────────────────────────

const sections = ref<Section[]>([])
const selectedPage = ref('all')
const selectedSection = ref<Section | null>(null)
const sectionImages = ref<SectionImage[]>([])
const sectionVideos = ref<SectionVideo[]>([])
const loading = ref(true)
const uploading = ref(false)
const uploadingType = ref<'image' | 'video'>('image')
const saving = ref(false)
const editing = ref(false)
const message = ref('')
const messageType = ref<'success' | 'error'>('success')
const activeTab = ref<'image' | 'video'>('image')
const dragOver = ref(false)
const urlPreviewInput = ref('')
const urlPreviewLoading = ref(false)
const expandedHistory = ref(false)

const { uploadImage } = useStorageUpload()
const route = useRoute()

// Watch for page query param from navigation
watch(() => route.query.page, (newPage) => {
  if (newPage && typeof newPage === 'string') {
    selectedPage.value = newPage
  }
}, { immediate: true })

// ─── Computed ─────────────────────────────────────────────────────────────────

const pages = computed(() => {
  const p = new Set(sections.value.map(s => s.page))
  return ['all', ...Array.from(p).sort()]
})

const filteredSections = computed(() => {
  if (selectedPage.value === 'all') return sections.value
  return sections.value.filter(s => s.page === selectedPage.value)
})

const groupedSections = computed(() => {
  const groups: Record<string, Section[]> = {}
  for (const s of filteredSections.value) {
    if (!groups[s.page]) groups[s.page] = []
    groups[s.page].push(s)
  }
  return groups
})

const activeImage = computed(() => sectionImages.value.find(i => i.isActive))
const activeVideo = computed(() => sectionVideos.value.find(v => v.isActive))

const resolvedImageUrl = computed(() => activeImage.value?.imageUrl || selectedSection.value?.defaultImageUrl || '')
const resolvedVideoUrl = computed(() => activeVideo.value?.videoUrl || selectedSection.value?.defaultVideoUrl || '')

const currentPageInfo = computed(() => {
  if (!selectedSection.value) return null
  return PAGE_COMPONENT_MAP[selectedSection.value.page] || null
})

const fillPercent = computed(() => {
  if (!selectedSection.value) return 0
  const hasImg = !!(activeImage.value?.imageUrl || selectedSection.value.defaultImageUrl)
  const hasVid = !!(activeVideo.value?.videoUrl || selectedSection.value.defaultVideoUrl)
  return hasImg && hasVid ? 100 : hasImg || hasVid ? 50 : 0
})

const sectionImageCount = computed(() => {
  const counts: Record<string, number> = {}
  for (const s of sections.value) {
    counts[s.id] = 0
  }
  return counts
})

// ─── Helpers ─────────────────────────────────────────────────────────────────

function showMessage(text: string, type: 'success' | 'error') {
  message.value = text
  messageType.value = type
  setTimeout(() => { message.value = '' }, 4000)
}

function isImageUrl(url: string): boolean {
  if (!url) return false
  const lower = url.toLowerCase()
  return lower.includes('/image/upload/') ||
    ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.avif', '.svg'].some(ext => lower.includes(ext))
}

function isVideoUrl(url: string): boolean {
  if (!url) return false
  const lower = url.toLowerCase()
  return lower.includes('/video/upload/') ||
    ['.mp4', '.webm', '.mov'].some(ext => lower.includes(ext))
}

function formatDate(timestamp: any): string {
  if (!timestamp) return ''
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
  return date.toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })
}

function getSectionMediaStatus(section: Section): 'full' | 'partial' | 'empty' {
  const hasImg = !!(section.defaultImageUrl)
  const hasVid = !!(section.defaultVideoUrl)
  if (hasImg && hasVid) return 'full'
  if (hasImg || hasVid) return 'partial'
  return 'empty'
}

// ─── Data Loading ─────────────────────────────────────────────────────────────

async function loadSections() {
  loading.value = true
  try {
    const db = getFirebaseDb()
    const snap = await getDocs(query(collection(db, 'cms_sections'), orderBy('sectionKey')))
    sections.value = snap.docs.map(d => ({ id: d.id, ...d.data() } as Section))
  } catch (e) {
    console.warn('Firebase unavailable, sections empty:', e)
    sections.value = []
  }
  loading.value = false
}

async function selectSection(section: Section) {
  selectedSection.value = { ...section }
  editing.value = false
  expandedHistory.value = false
  urlPreviewInput.value = ''
  await Promise.all([loadSectionImages(section.id), loadSectionVideos(section.id)])
}

async function loadSectionImages(sectionId: string) {
  try {
    const db = getFirebaseDb()
    const q = query(
      collection(db, 'cms_section_images'),
      where('sectionId', '==', sectionId),
      orderBy('sortOrder')
    )
    const snap = await getDocs(q)
    sectionImages.value = snap.docs.map(d => ({ id: d.id, ...d.data() } as SectionImage))
  } catch (e) {
    sectionImages.value = []
  }
}

async function loadSectionVideos(sectionId: string) {
  try {
    const db = getFirebaseDb()
    const q = query(
      collection(db, 'cms_section_videos'),
      where('sectionId', '==', sectionId),
      orderBy('sortOrder')
    )
    const snap = await getDocs(q)
    sectionVideos.value = snap.docs.map(d => ({ id: d.id, ...d.data() } as SectionVideo))
  } catch (e) {
    sectionVideos.value = []
  }
}

// ─── Upload Handlers ──────────────────────────────────────────────────────────

async function handleImageUpload(event: Event) {
  const input = event.target as HTMLInputElement
  if (!input.files?.length || !selectedSection.value) return
  await uploadImageFile(input.files[0])
  input.value = ''
}

async function uploadImageFile(file: File) {
  if (!selectedSection.value) return
  if (!file.type.startsWith('image/')) {
    showMessage('Please select an image file', 'error')
    return
  }
  uploading.value = true
  uploadingType.value = 'image'
  const result = await uploadImage(file, selectedSection.value.sectionKey)
  if (result) {
    const db = getFirebaseDb()
    const activeImgs = sectionImages.value.filter(i => i.isActive)
    for (const img of activeImgs) {
      await updateDoc(doc(db, 'cms_section_images', img.id), { isActive: false })
    }
    const newId = `img_${Date.now()}`
    await setDoc(doc(db, 'cms_section_images', newId), {
      sectionId: selectedSection.value.id,
      sectionKey: selectedSection.value.sectionKey,
      imageUrl: result.url,
      filePath: result.path,
      altText: selectedSection.value.label,
      sortOrder: sectionImages.value.length,
      isActive: true,
      createdAt: serverTimestamp(),
    })
    showMessage('Image uploaded and set as active', 'success')
    await loadSectionImages(selectedSection.value.id)
  } else {
    showMessage('Image upload failed', 'error')
  }
  uploading.value = false
}

async function handleVideoUpload(event: Event) {
  const input = event.target as HTMLInputElement
  if (!input.files?.length || !selectedSection.value) return
  const file = input.files[0]
  if (!file.type.startsWith('video/')) {
    showMessage('Please select a video file', 'error')
    return
  }
  uploading.value = true
  uploadingType.value = 'video'
  const result = await uploadImage(file, selectedSection.value.sectionKey)
  if (result) {
    const db = getFirebaseDb()
    const activeVids = sectionVideos.value.filter(v => v.isActive)
    for (const vid of activeVids) {
      await updateDoc(doc(db, 'cms_section_videos', vid.id), { isActive: false })
    }
    const newId = `vid_${Date.now()}`
    await setDoc(doc(db, 'cms_section_videos', newId), {
      sectionId: selectedSection.value.id,
      sectionKey: selectedSection.value.sectionKey,
      videoUrl: result.url,
      filePath: result.path,
      sortOrder: sectionVideos.value.length,
      isActive: true,
      createdAt: serverTimestamp(),
    })
    showMessage('Video uploaded and set as active', 'success')
    await loadSectionVideos(selectedSection.value.id)
  } else {
    showMessage('Video upload failed', 'error')
  }
  uploading.value = false
  input.value = ''
}

// ─── Drag & Drop ──────────────────────────────────────────────────────────────

function handleDrop(event: DragEvent) {
  dragOver.value = false
  if (!event.dataTransfer?.files.length) return
  const file = event.dataTransfer.files[0]
  if (file.type.startsWith('image/')) {
    uploadImageFile(file)
  } else if (file.type.startsWith('video/')) {
    showMessage('Use the Video tab to upload video files', 'error')
  }
}

// ─── URL-paste preview ────────────────────────────────────────────────────────

async function pasteUrlAsImage() {
  if (!urlPreviewInput.value.trim() || !selectedSection.value) return
  const url = urlPreviewInput.value.trim()
  const db = getFirebaseDb()
  const activeImgs = sectionImages.value.filter(i => i.isActive)
  for (const img of activeImgs) {
    await updateDoc(doc(db, 'cms_section_images', img.id), { isActive: false })
  }
  const newId = `img_${Date.now()}`
  await setDoc(doc(db, 'cms_section_images', newId), {
    sectionId: selectedSection.value.id,
    sectionKey: selectedSection.value.sectionKey,
    imageUrl: url,
    filePath: '',
    altText: selectedSection.value.label,
    sortOrder: sectionImages.value.length,
    isActive: true,
    createdAt: serverTimestamp(),
  })
  urlPreviewInput.value = ''
  showMessage('Image URL saved and set as active', 'success')
  await loadSectionImages(selectedSection.value.id)
}

// ─── Activation / Deletion ────────────────────────────────────────────────────

async function setImageActive(image: SectionImage) {
  if (!selectedSection.value) return
  const db = getFirebaseDb()
  const otherActiveImgs = sectionImages.value.filter(i => i.isActive && i.id !== image.id)
  for (const img of otherActiveImgs) {
    await updateDoc(doc(db, 'cms_section_images', img.id), { isActive: false })
  }
  await updateDoc(doc(db, 'cms_section_images', image.id), { isActive: true })
  await loadSectionImages(selectedSection.value.id)
  showMessage('Set as active image', 'success')
}

async function setVideoActive(video: SectionVideo) {
  if (!selectedSection.value) return
  const db = getFirebaseDb()
  const otherActiveVids = sectionVideos.value.filter(v => v.isActive && v.id !== video.id)
  for (const vid of otherActiveVids) {
    await updateDoc(doc(db, 'cms_section_videos', vid.id), { isActive: false })
  }
  await updateDoc(doc(db, 'cms_section_videos', video.id), { isActive: true })
  await loadSectionVideos(selectedSection.value.id)
  showMessage('Set as active video', 'success')
}

async function removeImage(image: SectionImage) {
  if (!confirm('Remove this image?')) return
  const db = getFirebaseDb()
  await deleteDoc(doc(db, 'cms_section_images', image.id))
  await loadSectionImages(selectedSection.value!.id)
  showMessage('Image removed', 'success')
}

async function removeVideo(video: SectionVideo) {
  if (!confirm('Remove this video?')) return
  const db = getFirebaseDb()
  await deleteDoc(doc(db, 'cms_section_videos', video.id))
  await loadSectionVideos(selectedSection.value!.id)
  showMessage('Video removed', 'success')
}

// ─── Save Section ─────────────────────────────────────────────────────────────

async function saveSection() {
  if (!selectedSection.value) return
  saving.value = true
  try {
    const db = getFirebaseDb()
    await updateDoc(doc(db, 'cms_sections', selectedSection.value.id), {
      defaultImageUrl: selectedSection.value.defaultImageUrl,
      defaultVideoUrl: selectedSection.value.defaultVideoUrl,
      label: selectedSection.value.label,
      description: selectedSection.value.description,
      updatedAt: serverTimestamp(),
    })
    showMessage('Section saved', 'success')
    editing.value = false
    await loadSections()
  } catch (e) {
    showMessage('Failed to save section', 'error')
  }
  saving.value = false
}

async function clearDefaultVideo() {
  if (!selectedSection.value) return
  const db = getFirebaseDb()
  await updateDoc(doc(db, 'cms_sections', selectedSection.value.id), {
    defaultVideoUrl: '', updatedAt: serverTimestamp(),
  })
  selectedSection.value.defaultVideoUrl = ''
  showMessage('Default video URL cleared', 'success')
}

async function clearDefaultImage() {
  if (!selectedSection.value) return
  const db = getFirebaseDb()
  await updateDoc(doc(db, 'cms_sections', selectedSection.value.id), {
    defaultImageUrl: '', updatedAt: serverTimestamp(),
  })
  selectedSection.value.defaultImageUrl = ''
  showMessage('Default image URL cleared', 'success')
}

onMounted(loadSections)
</script>

<template>
  <div class="sections-manager">

    <!-- Toast Message -->
    <transition name="toast">
      <div v-if="message" class="toast" :class="`toast-${messageType}`">
        <svg v-if="messageType === 'success'" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
        <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        {{ message }}
      </div>
    </transition>

    <!-- Page Filter Bar -->
    <div class="filter-bar">
      <div class="filter-tabs">
        <button
          v-for="page in pages"
          :key="page"
          @click="selectedPage = page"
          class="filter-tab"
          :class="{ 'filter-active': selectedPage === page }"
        >
          <span v-if="page !== 'all'" class="page-dot" :style="{ background: PAGE_COMPONENT_MAP[page]?.color || 'rgba(201,168,76,0.4)' }"></span>
          {{ page === 'all' ? 'All Pages' : page.replace('-', ' ') }}
        </button>
      </div>
    </div>

    <div class="manager-grid">

      <!-- ═══ LEFT: Section List ════════════════════════════════════════════ -->
      <div class="section-list">
        <div v-if="loading" class="loading-state">
          <div class="spinner"></div>
          Loading sections...
        </div>

        <template v-else>
          <template v-if="selectedPage === 'all'">
            <div v-for="(pageSections, pageName) in groupedSections" :key="pageName" class="page-group">
              <div class="page-group-header">
                <span class="page-dot-lg" :style="{ background: PAGE_COMPONENT_MAP[pageName]?.color || '#c9a84c' }"></span>
                <span class="page-group-name">{{ pageName.replace('-', ' ') }}</span>
                <span class="page-group-count">{{ pageSections.length }}</span>
              </div>
              <button
                v-for="section in pageSections"
                :key="section.id"
                @click="selectSection(section)"
                class="section-item"
                :class="{ 'section-selected': selectedSection?.id === section.id }"
              >
                <div class="section-thumb" :class="getSectionMediaStatus(section)">
                  <img v-if="section.defaultImageUrl" :src="section.defaultImageUrl" :alt="section.label" />
                  <div v-else class="thumb-empty">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
                      <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/>
                    </svg>
                  </div>
                </div>
                <div class="section-meta">
                  <p class="section-label-text">{{ section.label }}</p>
                  <div class="section-badges-row">
                    <span v-if="section.defaultVideoUrl" class="badge-sm badge-video">Video</span>
                    <span v-if="section.defaultImageUrl" class="badge-sm badge-image">Image</span>
                    <span v-if="!section.defaultVideoUrl && !section.defaultImageUrl" class="badge-sm badge-empty">Empty</span>
                  </div>
                </div>
                <span class="section-key-tag">{{ section.sectionKey }}</span>
              </button>
            </div>
          </template>

          <template v-else>
            <div class="page-group">
              <div v-if="PAGE_COMPONENT_MAP[selectedPage]" class="page-component-banner">
                <div class="pcb-left">
                  <span class="pcb-dot" :style="{ background: PAGE_COMPONENT_MAP[selectedPage].color }"></span>
                  <div>
                    <p class="pcb-component">{{ PAGE_COMPONENT_MAP[selectedPage].component }}</p>
                    <p class="pcb-file">{{ PAGE_COMPONENT_MAP[selectedPage].file }}</p>
                  </div>
                </div>
              </div>
              <button
                v-for="section in filteredSections"
                :key="section.id"
                @click="selectSection(section)"
                class="section-item"
                :class="{ 'section-selected': selectedSection?.id === section.id }"
              >
                <div class="section-thumb" :class="getSectionMediaStatus(section)">
                  <img v-if="section.defaultImageUrl" :src="section.defaultImageUrl" :alt="section.label" />
                  <div v-else class="thumb-empty">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
                      <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/>
                    </svg>
                  </div>
                </div>
                <div class="section-meta">
                  <p class="section-label-text">{{ section.label }}</p>
                  <div class="section-badges-row">
                    <span v-if="section.defaultVideoUrl" class="badge-sm badge-video">Video</span>
                    <span v-if="section.defaultImageUrl" class="badge-sm badge-image">Image</span>
                    <span v-if="!section.defaultVideoUrl && !section.defaultImageUrl" class="badge-sm badge-empty">Empty</span>
                  </div>
                </div>
              </button>
            </div>
          </template>
        </template>
      </div>

      <!-- ═══ RIGHT: Section Editor ═════════════════════════════════════════ -->
      <div class="image-editor">

        <!-- Empty state -->
        <div v-if="!selectedSection" class="empty-editor">
          <div class="empty-compass">
            <svg width="56" height="56" viewBox="0 0 80 80" fill="none">
              <circle cx="40" cy="40" r="37" stroke="rgba(201,168,76,0.2)" stroke-width="1"/>
              <polygon points="40,16 37,36 40,40 43,36" fill="rgba(201,168,76,0.25)"/>
              <polygon points="40,64 37,44 40,40 43,44" fill="rgba(201,168,76,0.12)"/>
              <circle cx="40" cy="40" r="3" fill="rgba(201,168,76,0.2)"/>
            </svg>
          </div>
          <p class="empty-title">Select a section</p>
          <p class="empty-sub">Choose a section from the left to manage its images and videos</p>
        </div>

        <div v-else class="editor-content">

          <!-- ── Component / File breadcrumb ── -->
          <div v-if="currentPageInfo" class="component-breadcrumb">
            <div class="crumb-file">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
              </svg>
              {{ currentPageInfo.file }}
            </div>
            <div class="crumb-component" :style="{ color: currentPageInfo.color }">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>
              </svg>
              &lt;{{ currentPageInfo.component }} /&gt;
              <span class="crumb-desc">{{ currentPageInfo.description }}</span>
            </div>
          </div>

          <!-- ── Section Header ── -->
          <div class="editor-header">
            <div class="editor-title-group">
              <h3 class="editor-title">{{ selectedSection.label }}</h3>
              <div class="editor-meta-row">
                <code class="section-key-code">{{ selectedSection.sectionKey }}</code>
                <span class="page-chip" :style="{ background: (PAGE_COMPONENT_MAP[selectedSection.page]?.color || '#c9a84c') + '22', borderColor: (PAGE_COMPONENT_MAP[selectedSection.page]?.color || '#c9a84c') + '55', color: PAGE_COMPONENT_MAP[selectedSection.page]?.color || '#c9a84c' }">
                  {{ selectedSection.page }}
                </span>
              </div>
              <p v-if="selectedSection.description" class="editor-desc">{{ selectedSection.description }}</p>
            </div>
            <div class="header-actions">
              <div class="fill-meter" :title="`Media coverage: ${fillPercent}%`">
                <div class="fill-bar" :style="{ width: fillPercent + '%', background: fillPercent === 100 ? '#4caf50' : fillPercent > 0 ? '#c9a84c' : 'rgba(248,245,239,0.1)' }"></div>
                <span class="fill-label">{{ fillPercent }}%</span>
              </div>
              <button @click="editing = !editing" class="btn-edit">{{ editing ? 'Cancel' : 'Edit' }}</button>
              <button v-if="editing" @click="saveSection" class="btn-save-section" :disabled="saving">{{ saving ? 'Saving…' : 'Save' }}</button>
            </div>
          </div>

          <!-- ── Editable Fields ── -->
          <transition name="slide-down">
            <div v-if="editing" class="edit-fields">
              <div class="form-group">
                <label class="form-label">Section Label</label>
                <input v-model="selectedSection.label" class="form-input" />
              </div>
              <div class="form-group">
                <label class="form-label">Description</label>
                <input v-model="selectedSection.description" class="form-input" />
              </div>
              <div class="form-group span2">
                <label class="form-label">Default Image URL <span class="label-hint">(fallback if no upload)</span></label>
                <input v-model="selectedSection.defaultImageUrl" class="form-input" placeholder="https://..." />
              </div>
              <div class="form-group span2">
                <label class="form-label">Default Video URL <span class="label-hint">(fallback if no upload)</span></label>
                <input v-model="selectedSection.defaultVideoUrl" class="form-input" placeholder="https://...mp4" />
              </div>
            </div>
          </transition>

          <!-- ── Tab Switcher ── -->
          <div class="tab-bar">
            <button class="tab-btn" :class="{ 'tab-active': activeTab === 'image' }" @click="activeTab = 'image'">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>
              Images
              <span class="tab-count" :class="{ 'count-filled': sectionImages.length > 0 }">{{ sectionImages.length }}</span>
            </button>
            <button class="tab-btn" :class="{ 'tab-active': activeTab === 'video' }" @click="activeTab = 'video'">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>
              Videos
              <span class="tab-count" :class="{ 'count-filled': sectionVideos.length > 0 }">{{ sectionVideos.length }}</span>
            </button>
          </div>

          <!-- ══════ IMAGE TAB ══════════════════════════════════════════════ -->
          <div v-if="activeTab === 'image'" class="tab-panel">

            <!-- Status row -->
            <div class="status-row">
              <span v-if="activeImage" class="status-pill status-override">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                Custom Override Active
              </span>
              <span v-else-if="selectedSection.defaultImageUrl" class="status-pill status-default">
                Using Default Image
              </span>
              <span v-else class="status-pill status-none">No Image Set</span>
            </div>

            <!-- Active Image Preview with drag zone -->
            <div
              class="active-image-frame"
              :class="{ 'drag-over': dragOver }"
              @dragenter.prevent="dragOver = true"
              @dragleave="dragOver = false"
              @dragover.prevent
              @drop.prevent="handleDrop"
            >
              <img v-if="resolvedImageUrl" :src="resolvedImageUrl" :alt="selectedSection.label" class="active-image" />
              <div v-else class="no-media-placeholder">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="rgba(201,168,76,0.2)" stroke-width="1">
                  <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/>
                </svg>
                <span>Drag & drop image here</span>
              </div>
              <div v-if="dragOver" class="drag-overlay">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                <span>Drop to upload</span>
              </div>
              <div v-if="!activeImage && selectedSection.defaultImageUrl" class="media-badge-corner">Default</div>
              <div v-if="activeImage" class="media-badge-corner badge-active">Custom</div>
            </div>

            <!-- URL paste row -->
            <div class="url-paste-row">
              <input
                v-model="urlPreviewInput"
                class="url-paste-input"
                placeholder="Paste image URL to use directly..."
                @keyup.enter="pasteUrlAsImage"
              />
              <button class="btn-paste" :disabled="!urlPreviewInput.trim()" @click="pasteUrlAsImage">Use URL</button>
            </div>

            <!-- Upload action -->
            <div class="upload-row">
              <label class="btn-upload-main" :class="{ 'btn-uploading': uploading && uploadingType === 'image' }">
                <input type="file" accept="image/*" @change="handleImageUpload" :disabled="uploading" class="hidden-input" />
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
                </svg>
                {{ uploading && uploadingType === 'image' ? 'Uploading…' : 'Upload New Image' }}
              </label>
              <button v-if="selectedSection.defaultImageUrl" @click="clearDefaultImage" class="btn-clear">Clear Default</button>
            </div>

            <!-- Image History Grid -->
            <div class="history-section">
              <button class="history-toggle" @click="expandedHistory = !expandedHistory">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" :style="{ transform: expandedHistory ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }">
                  <polyline points="9 18 15 12 9 6"/>
                </svg>
                Image History ({{ sectionImages.length }} uploaded)
              </button>

              <div v-if="expandedHistory" class="history-grid">
                <div v-if="sectionImages.length === 0" class="no-uploads">
                  No images uploaded yet. Upload above to add to history.
                </div>
                <div
                  v-for="img in sectionImages"
                  :key="img.id"
                  class="upload-card"
                  :class="{ 'upload-active': img.isActive }"
                >
                  <div class="upload-thumb-wrap">
                    <img :src="img.imageUrl" :alt="img.altText" class="upload-thumb" />
                    <div v-if="img.isActive" class="active-check">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>
                    </div>
                  </div>
                  <div class="upload-card-info">
                    <p class="upload-date">{{ formatDate(img.createdAt) }}</p>
                    <div class="upload-card-actions">
                      <button
                        @click="setImageActive(img)"
                        class="btn-set-active"
                        :class="{ 'is-active': img.isActive }"
                        :title="img.isActive ? 'Currently active' : 'Set as active'"
                      >
                        {{ img.isActive ? 'Active' : 'Set Active' }}
                      </button>
                      <button @click="removeImage(img)" class="btn-delete-small" title="Remove">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- ══════ VIDEO TAB ══════════════════════════════════════════════ -->
          <div v-if="activeTab === 'video'" class="tab-panel">

            <!-- Status row -->
            <div class="status-row">
              <span v-if="activeVideo" class="status-pill status-override">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                Custom Override Active
              </span>
              <span v-else-if="selectedSection.defaultVideoUrl" class="status-pill status-default">Using Default Video</span>
              <span v-else class="status-pill status-none">No Video Set</span>
            </div>

            <!-- Active Video Preview -->
            <div v-if="resolvedVideoUrl" class="active-video-frame">
              <video :src="resolvedVideoUrl" controls muted class="preview-video" preload="metadata"></video>
              <div v-if="!activeVideo && selectedSection.defaultVideoUrl" class="media-badge-corner">Default</div>
              <div v-if="activeVideo" class="media-badge-corner badge-active">Custom</div>
            </div>
            <div v-else class="no-media-placeholder-wide">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="rgba(201,168,76,0.2)" stroke-width="1"><polygon points="5 3 19 12 5 21 5 3"/></svg>
              <span>No video set for this section</span>
            </div>

            <!-- Upload action -->
            <div class="upload-row">
              <label class="btn-upload-main btn-upload-video" :class="{ 'btn-uploading': uploading && uploadingType === 'video' }">
                <input type="file" accept="video/*" @change="handleVideoUpload" :disabled="uploading" class="hidden-input" />
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                {{ uploading && uploadingType === 'video' ? 'Uploading…' : 'Upload New Video' }}
              </label>
              <button v-if="selectedSection.defaultVideoUrl" @click="clearDefaultVideo" class="btn-clear">Clear Default</button>
            </div>

            <!-- Video History List -->
            <div class="history-section">
              <button class="history-toggle" @click="expandedHistory = !expandedHistory">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" :style="{ transform: expandedHistory ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }">
                  <polyline points="9 18 15 12 9 6"/>
                </svg>
                Video History ({{ sectionVideos.length }} uploaded)
              </button>

              <div v-if="expandedHistory" class="video-history-list">
                <div v-if="sectionVideos.length === 0" class="no-uploads">
                  No videos uploaded yet.
                </div>
                <div
                  v-for="vid in sectionVideos"
                  :key="vid.id"
                  class="video-card"
                  :class="{ 'video-active': vid.isActive }"
                >
                  <div class="video-card-icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                  </div>
                  <div class="video-card-info">
                    <p class="video-url-text" :title="vid.videoUrl">{{ vid.videoUrl.length > 55 ? vid.videoUrl.slice(0, 55) + '…' : vid.videoUrl }}</p>
                    <p class="video-date">{{ formatDate(vid.createdAt) }}</p>
                  </div>
                  <div class="video-card-actions">
                    <button @click="setVideoActive(vid)" class="btn-set-active" :class="{ 'is-active': vid.isActive }">{{ vid.isActive ? 'Active' : 'Set Active' }}</button>
                    <button @click="removeVideo(vid)" class="btn-delete-small"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></button>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* ── Layout ────────────────────────────────────────────────────────────── */
.sections-manager { position: relative; }

.manager-grid {
  display: grid;
  grid-template-columns: 300px 1fr;
  gap: 1.5rem;
  min-height: 600px;
  align-items: start;
}

/* ── Toast ─────────────────────────────────────────────────────────────── */
.toast {
  position: fixed;
  top: 1.5rem;
  right: 1.5rem;
  z-index: 100;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.25rem;
  border: 1px solid;
  font-family: 'Montserrat', sans-serif;
  font-size: 0.7rem;
  letter-spacing: 0.05em;
  backdrop-filter: blur(8px);
  box-shadow: 0 8px 24px rgba(0,0,0,0.3);
}
.toast-success { background: rgba(76,175,80,0.15); border-color: rgba(76,175,80,0.35); color: #4caf50; }
.toast-error { background: rgba(224,123,90,0.15); border-color: rgba(224,123,90,0.35); color: #e07b5a; }
.toast-enter-active, .toast-leave-active { transition: all 0.25s ease; }
.toast-enter-from, .toast-leave-to { opacity: 0; transform: translateY(-0.5rem); }

/* ── Filter Bar ────────────────────────────────────────────────────────── */
.filter-bar { margin-bottom: 1.25rem; }
.filter-tabs { display: flex; flex-wrap: wrap; gap: 0.375rem; }
.filter-tab {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.375rem 0.875rem;
  background: rgba(10,46,74,0.3);
  border: 1px solid rgba(201,168,76,0.12);
  color: rgba(248,245,239,0.55);
  font-family: 'Montserrat', sans-serif;
  font-size: 0.62rem;
  letter-spacing: 0.08em;
  text-transform: capitalize;
  cursor: pointer;
  transition: all 0.2s;
}
.filter-tab:hover { border-color: rgba(201,168,76,0.25); color: rgba(248,245,239,0.85); }
.filter-active { background: rgba(201,168,76,0.12); border-color: #c9a84c; color: #c9a84c; }
.page-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }

/* ── Section List ──────────────────────────────────────────────────────── */
.section-list {
  background: rgba(10,46,74,0.25);
  border: 1px solid rgba(201,168,76,0.08);
  overflow: hidden;
  max-height: calc(100vh - 220px);
  overflow-y: auto;
}

.page-group { }
.page-group-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 0.875rem 0.375rem;
  background: rgba(7,26,43,0.6);
  border-bottom: 1px solid rgba(201,168,76,0.08);
  position: sticky;
  top: 0;
  z-index: 2;
}
.page-dot-lg { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
.page-group-name { font-family: 'Montserrat', sans-serif; font-size: 0.62rem; font-weight: 700; letter-spacing: 0.15em; text-transform: uppercase; color: rgba(248,245,239,0.5); flex: 1; }
.page-group-count { font-size: 0.55rem; background: rgba(201,168,76,0.12); color: #c9a84c; padding: 0.1rem 0.4rem; font-weight: 700; }

.page-component-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.625rem 0.875rem;
  background: rgba(7,26,43,0.5);
  border-bottom: 1px solid rgba(201,168,76,0.08);
}
.pcb-left { display: flex; align-items: center; gap: 0.5rem; }
.pcb-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
.pcb-component { font-family: 'Montserrat', sans-serif; font-size: 0.65rem; font-weight: 700; color: rgba(248,245,239,0.8); }
.pcb-file { font-family: 'monospace', monospace; font-size: 0.55rem; color: rgba(248,245,239,0.3); margin-top: 0.1rem; }

.section-item {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  padding: 0.625rem 0.875rem;
  width: 100%;
  background: none;
  border: none;
  border-bottom: 1px solid rgba(201,168,76,0.04);
  color: rgba(248,245,239,0.65);
  cursor: pointer;
  transition: all 0.15s;
  text-align: left;
  position: relative;
}
.section-item:hover { background: rgba(201,168,76,0.04); color: rgba(248,245,239,0.9); }
.section-selected { background: rgba(201,168,76,0.09) !important; border-left: 2px solid #c9a84c; }
.section-selected .section-label-text { color: #f8f5ef; }

.section-thumb {
  width: 46px;
  height: 34px;
  flex-shrink: 0;
  border: 1px solid rgba(201,168,76,0.12);
  overflow: hidden;
  background: rgba(7,26,43,0.6);
}
.section-thumb img { width: 100%; height: 100%; object-fit: cover; }
.section-thumb.empty { border-style: dashed; border-color: rgba(201,168,76,0.08); }
.thumb-empty { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; color: rgba(201,168,76,0.2); }

.section-meta { flex: 1; min-width: 0; }
.section-label-text { font-size: 0.72rem; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.section-badges-row { display: flex; gap: 0.25rem; margin-top: 0.2rem; }

.badge-sm { font-size: 0.48rem; letter-spacing: 0.08em; text-transform: uppercase; padding: 0.1rem 0.3rem; font-family: 'Montserrat', sans-serif; font-weight: 600; }
.badge-video { background: rgba(13,110,122,0.15); color: #4ea8c9; border: 1px solid rgba(78,168,201,0.2); }
.badge-image { background: rgba(201,168,76,0.12); color: #c9a84c; border: 1px solid rgba(201,168,76,0.2); }
.badge-empty { background: rgba(248,245,239,0.04); color: rgba(248,245,239,0.3); border: 1px solid rgba(248,245,239,0.08); }

.section-key-tag {
  font-family: 'monospace', monospace;
  font-size: 0.48rem;
  color: rgba(248,245,239,0.18);
  max-width: 70px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* ── Editor Panel ──────────────────────────────────────────────────────── */
.image-editor {
  background: rgba(10,46,74,0.2);
  border: 1px solid rgba(201,168,76,0.08);
  overflow-y: auto;
  max-height: calc(100vh - 220px);
}

.empty-editor {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 500px;
  gap: 1rem;
  color: rgba(248,245,239,0.3);
}
.empty-compass { opacity: 0.6; }
.empty-title { font-family: 'Cormorant Garamond', serif; font-size: 1.25rem; font-weight: 300; color: rgba(248,245,239,0.4); }
.empty-sub { font-size: 0.75rem; color: rgba(248,245,239,0.25); text-align: center; max-width: 280px; }

.editor-content { padding: 0; }

/* Component Breadcrumb */
.component-breadcrumb {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  padding: 0.75rem 1.25rem;
  background: rgba(7,26,43,0.7);
  border-bottom: 1px solid rgba(201,168,76,0.08);
  flex-wrap: wrap;
}
.crumb-file {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  font-family: 'monospace', monospace;
  font-size: 0.62rem;
  color: rgba(248,245,239,0.35);
}
.crumb-component {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  font-family: 'monospace', monospace;
  font-size: 0.65rem;
  font-weight: 600;
}
.crumb-desc { font-family: 'Montserrat', sans-serif; font-weight: 400; font-size: 0.58rem; color: rgba(248,245,239,0.35); margin-left: 0.25rem; }

/* Editor Header */
.editor-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 1.25rem 1.25rem 1rem;
  border-bottom: 1px solid rgba(201,168,76,0.08);
  gap: 1rem;
  flex-wrap: wrap;
}
.editor-title-group { flex: 1; }
.editor-title { font-family: 'Cormorant Garamond', serif; font-size: 1.5rem; font-weight: 300; color: #f8f5ef; line-height: 1.1; }
.editor-meta-row { display: flex; align-items: center; gap: 0.5rem; margin-top: 0.375rem; flex-wrap: wrap; }
.section-key-code { font-family: 'monospace', monospace; font-size: 0.62rem; background: rgba(201,168,76,0.08); color: rgba(201,168,76,0.7); padding: 0.15rem 0.5rem; border: 1px solid rgba(201,168,76,0.15); }
.page-chip { font-family: 'Montserrat', sans-serif; font-size: 0.55rem; font-weight: 600; letter-spacing: 0.1em; text-transform: capitalize; padding: 0.2rem 0.5rem; border: 1px solid; border-radius: 2px; }
.editor-desc { font-size: 0.72rem; color: rgba(248,245,239,0.45); margin-top: 0.5rem; }

.header-actions { display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; padding-top: 0.25rem; }

.fill-meter {
  position: relative;
  width: 60px;
  height: 4px;
  background: rgba(248,245,239,0.08);
  overflow: hidden;
}
.fill-bar { height: 100%; transition: width 0.5s ease; }
.fill-label { position: absolute; top: -14px; right: 0; font-size: 0.48rem; color: rgba(248,245,239,0.3); font-family: 'Montserrat', sans-serif; }

.btn-edit, .btn-save-section {
  padding: 0.375rem 0.75rem;
  font-family: 'Montserrat', sans-serif;
  font-size: 0.6rem;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  cursor: pointer;
  border: 1px solid;
  transition: all 0.2s;
}
.btn-edit { background: rgba(10,46,74,0.5); border-color: rgba(201,168,76,0.15); color: rgba(248,245,239,0.6); }
.btn-edit:hover { border-color: rgba(201,168,76,0.35); color: rgba(248,245,239,0.9); }
.btn-save-section { background: #c9a84c; border-color: #c9a84c; color: #071a2b; }
.btn-save-section:disabled { opacity: 0.5; cursor: not-allowed; }

/* Edit Fields */
.edit-fields {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
  padding: 1rem 1.25rem;
  background: rgba(7,26,43,0.5);
  border-bottom: 1px solid rgba(201,168,76,0.12);
}
.form-group { display: flex; flex-direction: column; gap: 0.3rem; }
.form-group.span2 { grid-column: span 2; }
.form-label { font-family: 'Montserrat', sans-serif; font-size: 0.57rem; font-weight: 600; letter-spacing: 0.14em; text-transform: uppercase; color: rgba(248,245,239,0.45); }
.label-hint { font-weight: 400; text-transform: none; letter-spacing: 0; color: rgba(248,245,239,0.25); }
.form-input { background: rgba(7,26,43,0.7); border: 1px solid rgba(201,168,76,0.15); color: #f8f5ef; padding: 0.5rem 0.75rem; font-family: 'Inter', sans-serif; font-size: 0.78rem; outline: none; transition: border-color 0.2s; }
.form-input:focus { border-color: #c9a84c; }

/* Slide-down transition */
.slide-down-enter-active, .slide-down-leave-active { transition: all 0.2s ease; overflow: hidden; }
.slide-down-enter-from, .slide-down-leave-to { opacity: 0; max-height: 0; padding-top: 0; padding-bottom: 0; }

/* Tab Bar */
.tab-bar {
  display: flex;
  border-bottom: 1px solid rgba(201,168,76,0.1);
  padding: 0 1.25rem;
  background: rgba(7,26,43,0.35);
}
.tab-btn {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.75rem 1rem;
  background: none;
  border: none;
  border-bottom: 2px solid transparent;
  color: rgba(248,245,239,0.45);
  font-family: 'Montserrat', sans-serif;
  font-size: 0.65rem;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  cursor: pointer;
  transition: all 0.2s;
  margin-bottom: -1px;
}
.tab-btn:hover { color: rgba(248,245,239,0.75); }
.tab-active { border-bottom-color: #c9a84c; color: #c9a84c; }
.tab-count {
  font-size: 0.55rem;
  background: rgba(248,245,239,0.08);
  color: rgba(248,245,239,0.35);
  padding: 0.1rem 0.375rem;
  border-radius: 2px;
  font-weight: 700;
  min-width: 18px;
  text-align: center;
}
.count-filled { background: rgba(201,168,76,0.15); color: #c9a84c; }

/* Tab Panel */
.tab-panel { padding: 1.25rem; }

/* Status Row */
.status-row { margin-bottom: 0.875rem; }
.status-pill {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  font-family: 'Montserrat', sans-serif;
  font-size: 0.58rem;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  padding: 0.25rem 0.625rem;
  border: 1px solid;
}
.status-override { background: rgba(76,175,80,0.1); border-color: rgba(76,175,80,0.3); color: #4caf50; }
.status-default { background: rgba(201,168,76,0.1); border-color: rgba(201,168,76,0.3); color: #c9a84c; }
.status-none { background: rgba(248,245,239,0.04); border-color: rgba(248,245,239,0.1); color: rgba(248,245,239,0.35); }

/* Image Frame */
.active-image-frame {
  position: relative;
  width: 100%;
  height: 240px;
  border: 1px solid rgba(201,168,76,0.15);
  overflow: hidden;
  background: rgba(7,26,43,0.5);
  margin-bottom: 0.875rem;
  transition: border-color 0.2s;
}
.active-image-frame.drag-over { border-color: #c9a84c; border-style: dashed; }
.active-image { width: 100%; height: 100%; object-fit: cover; }
.no-media-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  color: rgba(248,245,239,0.2);
  font-size: 0.7rem;
  font-family: 'Montserrat', sans-serif;
  letter-spacing: 0.1em;
}
.drag-overlay {
  position: absolute;
  inset: 0;
  background: rgba(201,168,76,0.15);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  color: #c9a84c;
  font-family: 'Montserrat', sans-serif;
  font-size: 0.7rem;
  font-weight: 600;
  letter-spacing: 0.1em;
  border: 2px dashed #c9a84c;
}
.media-badge-corner {
  position: absolute;
  top: 0.625rem;
  right: 0.625rem;
  background: rgba(7,26,43,0.9);
  border: 1px solid rgba(201,168,76,0.25);
  font-family: 'Montserrat', sans-serif;
  font-size: 0.5rem;
  font-weight: 600;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #c9a84c;
  padding: 0.2rem 0.5rem;
}
.badge-active { border-color: rgba(76,175,80,0.3); color: #4caf50; }

/* URL Paste Row */
.url-paste-row {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}
.url-paste-input {
  flex: 1;
  background: rgba(7,26,43,0.6);
  border: 1px solid rgba(201,168,76,0.1);
  color: #f8f5ef;
  padding: 0.5rem 0.75rem;
  font-family: 'Inter', sans-serif;
  font-size: 0.72rem;
  outline: none;
  transition: border-color 0.2s;
}
.url-paste-input::placeholder { color: rgba(248,245,239,0.2); }
.url-paste-input:focus { border-color: rgba(201,168,76,0.35); }
.btn-paste {
  padding: 0.5rem 0.875rem;
  background: rgba(201,168,76,0.12);
  border: 1px solid rgba(201,168,76,0.2);
  color: #c9a84c;
  font-family: 'Montserrat', sans-serif;
  font-size: 0.58rem;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}
.btn-paste:hover:not(:disabled) { background: rgba(201,168,76,0.22); }
.btn-paste:disabled { opacity: 0.35; cursor: not-allowed; }

/* Upload Row */
.upload-row { display: flex; align-items: center; gap: 0.625rem; margin-bottom: 1.25rem; }
.hidden-input { display: none; }
.btn-upload-main {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.5rem 1rem;
  background: #c9a84c;
  color: #071a2b;
  font-family: 'Montserrat', sans-serif;
  font-size: 0.6rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid #c9a84c;
}
.btn-upload-main:hover { background: #e8c05a; }
.btn-upload-video { background: rgba(78,168,201,0.15); border-color: rgba(78,168,201,0.3); color: #4ea8c9; }
.btn-upload-video:hover { background: rgba(78,168,201,0.25); }
.btn-uploading { opacity: 0.55; cursor: not-allowed; pointer-events: none; }
.btn-clear {
  padding: 0.5rem 0.75rem;
  background: none;
  border: 1px solid rgba(224,123,90,0.2);
  color: rgba(224,123,90,0.6);
  font-family: 'Montserrat', sans-serif;
  font-size: 0.58rem;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  cursor: pointer;
  transition: all 0.2s;
}
.btn-clear:hover { background: rgba(224,123,90,0.1); color: #e07b5a; border-color: rgba(224,123,90,0.35); }

/* History */
.history-section { }
.history-toggle {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0;
  background: none;
  border: none;
  color: rgba(248,245,239,0.4);
  font-family: 'Montserrat', sans-serif;
  font-size: 0.6rem;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  cursor: pointer;
  transition: color 0.2s;
  margin-bottom: 0.75rem;
}
.history-toggle:hover { color: rgba(248,245,239,0.7); }

.history-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
  gap: 0.625rem;
}
.no-uploads {
  grid-column: 1/-1;
  padding: 1.5rem;
  text-align: center;
  color: rgba(248,245,239,0.25);
  font-size: 0.72rem;
  border: 1px dashed rgba(201,168,76,0.1);
}

.upload-card {
  border: 1px solid rgba(201,168,76,0.08);
  overflow: hidden;
  transition: border-color 0.2s;
}
.upload-card:hover { border-color: rgba(201,168,76,0.2); }
.upload-active { border-color: rgba(76,175,80,0.4); }
.upload-thumb-wrap { position: relative; aspect-ratio: 4/3; overflow: hidden; }
.upload-thumb { width: 100%; height: 100%; object-fit: cover; display: block; }
.active-check {
  position: absolute;
  top: 0.375rem;
  right: 0.375rem;
  width: 20px;
  height: 20px;
  background: #4caf50;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}
.upload-card-info { padding: 0.5rem; background: rgba(7,26,43,0.8); }
.upload-date { font-size: 0.52rem; color: rgba(248,245,239,0.3); margin-bottom: 0.375rem; }
.upload-card-actions { display: flex; gap: 0.25rem; }

.btn-set-active {
  flex: 1;
  padding: 0.25rem 0.375rem;
  background: rgba(201,168,76,0.1);
  border: 1px solid rgba(201,168,76,0.2);
  color: rgba(248,245,239,0.55);
  font-family: 'Montserrat', sans-serif;
  font-size: 0.5rem;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  cursor: pointer;
  transition: all 0.2s;
}
.btn-set-active:hover { background: rgba(201,168,76,0.2); color: #c9a84c; }
.btn-set-active.is-active { background: rgba(76,175,80,0.15); border-color: rgba(76,175,80,0.3); color: #4caf50; cursor: default; }

.btn-delete-small {
  width: 26px;
  height: 26px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: 1px solid rgba(224,123,90,0.15);
  color: rgba(224,123,90,0.5);
  cursor: pointer;
  transition: all 0.2s;
  flex-shrink: 0;
}
.btn-delete-small:hover { background: rgba(224,123,90,0.12); color: #e07b5a; border-color: rgba(224,123,90,0.3); }

/* Video Preview */
.active-video-frame {
  position: relative;
  border: 1px solid rgba(201,168,76,0.15);
  overflow: hidden;
  background: #000;
  margin-bottom: 0.875rem;
}
.preview-video { width: 100%; max-height: 220px; object-fit: contain; display: block; }
.no-media-placeholder-wide {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 2.5rem;
  border: 1px dashed rgba(201,168,76,0.1);
  color: rgba(248,245,239,0.25);
  font-size: 0.7rem;
  font-family: 'Montserrat', sans-serif;
  letter-spacing: 0.08em;
  margin-bottom: 0.875rem;
}

/* Video history list */
.video-history-list { display: flex; flex-direction: column; gap: 0.5rem; }
.video-card {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  background: rgba(7,26,43,0.4);
  border: 1px solid rgba(201,168,76,0.07);
  transition: border-color 0.2s;
}
.video-card:hover { border-color: rgba(201,168,76,0.15); }
.video-active { border-color: rgba(76,175,80,0.25); background: rgba(76,175,80,0.04); }
.video-card-icon {
  width: 34px;
  height: 34px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(78,168,201,0.1);
  border: 1px solid rgba(78,168,201,0.2);
  color: #4ea8c9;
  flex-shrink: 0;
}
.video-card-info { flex: 1; min-width: 0; }
.video-url-text { font-size: 0.68rem; color: rgba(248,245,239,0.65); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.video-date { font-size: 0.52rem; color: rgba(248,245,239,0.28); margin-top: 0.125rem; }
.video-card-actions { display: flex; gap: 0.25rem; flex-shrink: 0; align-items: center; }

/* Misc */
.loading-state {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 2rem 1.25rem;
  color: rgba(248,245,239,0.4);
  font-size: 0.75rem;
}
.spinner {
  width: 18px;
  height: 18px;
  border: 1px solid rgba(201,168,76,0.15);
  border-top-color: #c9a84c;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  flex-shrink: 0;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* Responsive */
@media (max-width: 1024px) {
  .manager-grid { grid-template-columns: 1fr; }
  .section-list { max-height: 300px; }
  .image-editor { max-height: none; }
}
@media (max-width: 640px) {
  .edit-fields { grid-template-columns: 1fr; }
  .form-group.span2 { grid-column: span 1; }
  .history-grid { grid-template-columns: repeat(2, 1fr); }
  .url-paste-row { flex-direction: column; }
}
</style>
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { getFirebaseDb, initFirebase } from '@/lib/firebase'
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  addDoc,
  deleteDoc,
  query,
  orderBy,
  where,
} from 'firebase/firestore'
import { FALLBACK_LIMITED_EXPEDITIONS } from '@/composables/useLimitedExpeditionData'
import {
  loadTripMedia,
  saveTripMedia,
  deleteTripMedia,
  type LimitedExpeditionMediaItem,
} from '@/composables/useLimitedExpeditionMedia'
import { useStorageUpload } from '@/composables/useStorageUpload'
import { useToast } from '@/composables/useToast'

interface LimitedExpedition {
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

interface ItineraryDay {
  id: string
  tripId: string
  dayNumber: number
  title: string
  description: string
  imageUrl: string
  activityLabel: string
  mealsLabel: string
}

const ICON_OPTIONS = ['freedive', 'surf', 'whale', 'camera', 'jellyfish', 'lotus', 'shark', 'flask', 'compass']

const DEFAULT_EXPEDITIONS: Omit<LimitedExpedition, 'id'>[] = Object.values(FALLBACK_LIMITED_EXPEDITIONS).map((e) => ({
  slug: e.slug,
  vesselName: e.vesselName,
  title: e.title,
  subtitle: e.subtitle,
  nights: e.nights,
  dateLabel: e.dateLabel,
  host: e.host,
  icon: e.icon,
  priceAud: e.priceAud,
  priceLabel: e.priceLabel,
  description: e.description,
  shortDescription: e.shortDescription,
  heroImageUrl: '',
  heroVideoUrl: '',
  isPublished: true,
  sortOrder: e.sortOrder,
  rezdyProductId: '',
}))

const trips = ref<LimitedExpedition[]>([])
const selectedTrip = ref<LimitedExpedition | null>(null)
const itinerary = ref<ItineraryDay[]>([])
const loading = ref(true)
const saving = ref(false)
const deleting = ref(false)
const editing = ref(false)
const message = ref('')
const messageType = ref<'success' | 'error'>('success')
const newDay = ref({ dayNumber: 1, title: '', description: '', imageUrl: '', activityLabel: '', mealsLabel: '' })

// Media state
const mediaItems = ref<LimitedExpeditionMediaItem[]>([])
const mediaLoading = ref(false)
const uploadStates = ref<Record<string, boolean>>({})
const gallerySlots = ref(6)

const { uploadImage } = useStorageUpload()
const toast = useToast()

function showMessage(text: string, type: 'success' | 'error') {
  message.value = text
  messageType.value = type
  setTimeout(() => { message.value = '' }, 3000)
}

function getUploadKey(tripId: string, mediaType: string, slotIndex: number): string {
  return `${tripId}_${mediaType}_${slotIndex}`
}

function isUploading(tripId: string, mediaType: string, slotIndex: number): boolean {
  return uploadStates.value[getUploadKey(tripId, mediaType, slotIndex)] || false
}

function setUploading(tripId: string, mediaType: string, slotIndex: number, val: boolean) {
  uploadStates.value[getUploadKey(tripId, mediaType, slotIndex)] = val
}

function getMediaItem(mediaType: 'hero' | 'about' | 'gallery' | 'itinerary', slotIndex: number): LimitedExpeditionMediaItem | undefined {
  return mediaItems.value.find((m) => m.mediaType === mediaType && m.slotIndex === slotIndex)
}

function getMediaUrl(mediaType: 'hero' | 'about' | 'gallery' | 'itinerary', slotIndex: number): string {
  return getMediaItem(mediaType, slotIndex)?.imageUrl || ''
}

function getMediaCaption(mediaType: 'hero' | 'about' | 'gallery' | 'itinerary', slotIndex: number): string {
  return getMediaItem(mediaType, slotIndex)?.caption || ''
}

async function loadTrips() {
  initFirebase()
  loading.value = true
  try {
    const db = getFirebaseDb()
    const snap = await getDocs(query(collection(db, 'cms_limited_expeditions'), orderBy('sortOrder')))
    if (snap.empty) {
      for (const t of DEFAULT_EXPEDITIONS) await addDoc(collection(db, 'cms_limited_expeditions'), t)
      const reSnap = await getDocs(query(collection(db, 'cms_limited_expeditions'), orderBy('sortOrder')))
      trips.value = reSnap.docs.map(d => ({ id: d.id, ...d.data() } as LimitedExpedition))
    } else {
      trips.value = snap.docs.map(d => ({ id: d.id, ...d.data() } as LimitedExpedition))
    }
  } catch (e) {
    console.warn('Firestore unavailable, using default limited expeditions:', e)
    trips.value = DEFAULT_EXPEDITIONS.map((t, i) => ({ id: `local-${i}`, ...t } as LimitedExpedition))
  }
  loading.value = false
}

async function selectTrip(trip: LimitedExpedition) {
  selectedTrip.value = { ...trip }
  editing.value = false
  await Promise.all([
    loadItinerary(trip.id),
    loadMedia(trip.id),
  ])

  // Backfill: trips whose hero image was uploaded before heroImageUrl syncing
  // was added will have it in cms_limited_expedition_media but not on the
  // trip doc. Repair it the moment the trip is opened, so older uploads show
  // up on the listing page without needing a separate migration script.
  const heroMedia = getMediaItem('hero', 0)
  if (heroMedia?.imageUrl && selectedTrip.value && selectedTrip.value.heroImageUrl !== heroMedia.imageUrl) {
    const db = getFirebaseDb()
    await updateDoc(doc(db, 'cms_limited_expeditions', trip.id), { heroImageUrl: heroMedia.imageUrl })
    selectedTrip.value.heroImageUrl = heroMedia.imageUrl
    const idx = trips.value.findIndex((t) => t.id === trip.id)
    if (idx !== -1) trips.value[idx].heroImageUrl = heroMedia.imageUrl
  }
}

async function loadItinerary(tripId: string) {
  try {
    const db = getFirebaseDb()
    const snap = await getDocs(query(collection(db, 'cms_limited_expedition_itinerary'), where('tripId', '==', tripId)))
    itinerary.value = snap.docs
      .map(d => ({ id: d.id, ...d.data() } as ItineraryDay))
      .sort((a, b) => a.dayNumber - b.dayNumber)
  } catch (e) {
    console.warn('Firestore unavailable, cannot load itinerary:', e)
    itinerary.value = []
  }
}

async function loadMedia(tripId: string) {
  mediaLoading.value = true
  mediaItems.value = await loadTripMedia(tripId)
  mediaLoading.value = false
}

async function saveTrip() {
  if (!selectedTrip.value) return
  saving.value = true
  try {
    const db = getFirebaseDb()
    const { id, ...updates } = selectedTrip.value
    await updateDoc(doc(db, 'cms_limited_expeditions', id), updates)
    showMessage('Expedition saved successfully', 'success')
    editing.value = false
    await loadTrips()
  } catch (e) {
    console.warn('Failed to save expedition:', e)
    showMessage('Failed to save — check connection', 'error')
  }
  saving.value = false
}

async function addItineraryDay() {
  if (!selectedTrip.value) return
  try {
    const db = getFirebaseDb()
    const ref = await addDoc(collection(db, 'cms_limited_expedition_itinerary'), {
      tripId: selectedTrip.value.id,
      ...newDay.value,
    })
    itinerary.value.push({ id: ref.id, tripId: selectedTrip.value.id, ...newDay.value })
    newDay.value = { dayNumber: itinerary.value.length + 1, title: '', description: '', imageUrl: '', activityLabel: '', mealsLabel: '' }
  } catch (e) {
    showMessage('Failed to add day', 'error')
  }
}

async function removeItineraryDay(dayId: string) {
  try {
    const db = getFirebaseDb()
    await deleteDoc(doc(db, 'cms_limited_expedition_itinerary', dayId))
    itinerary.value = itinerary.value.filter(d => d.id !== dayId)
  } catch (e) {
    showMessage('Failed to remove day', 'error')
  }
}

async function updateItineraryDay(day: ItineraryDay) {
  try {
    const db = getFirebaseDb()
    const { id, ...updates } = day
    await updateDoc(doc(db, 'cms_limited_expedition_itinerary', id), updates)
    showMessage('Day updated', 'success')
  } catch (e) {
    showMessage('Failed to update day', 'error')
  }
}

async function deleteTrip() {
  if (!selectedTrip.value) return
  const trip = selectedTrip.value
  if (!confirm(`Delete "${trip.title}"? This also removes its itinerary days, features and uploaded images. This cannot be undone.`)) return

  deleting.value = true
  try {
    const db = getFirebaseDb()

    // Cascade-delete related docs first (they're separate top-level
    // collections keyed by tripId, not subcollections, so they're orphaned
    // otherwise and would keep failing reads/showing stale data).
    const [itinerarySnap, featuresSnap, mediaSnap] = await Promise.all([
      getDocs(query(collection(db, 'cms_limited_expedition_itinerary'), where('tripId', '==', trip.id))),
      getDocs(query(collection(db, 'cms_limited_expedition_features'), where('tripId', '==', trip.id))),
      getDocs(query(collection(db, 'cms_limited_expedition_media'), where('tripId', '==', trip.id))),
    ])

    await Promise.all([
      ...itinerarySnap.docs.map((d) => deleteDoc(doc(db, 'cms_limited_expedition_itinerary', d.id))),
      ...featuresSnap.docs.map((d) => deleteDoc(doc(db, 'cms_limited_expedition_features', d.id))),
      ...mediaSnap.docs.map((d) => deleteDoc(doc(db, 'cms_limited_expedition_media', d.id))),
    ])

    await deleteDoc(doc(db, 'cms_limited_expeditions', trip.id))

    trips.value = trips.value.filter((t) => t.id !== trip.id)
    selectedTrip.value = null
    itinerary.value = []
    mediaItems.value = []
    showMessage('Expedition deleted', 'success')
  } catch (e) {
    console.warn('Failed to delete expedition:', e)
    showMessage('Failed to delete — check connection', 'error')
  }
  deleting.value = false
}

async function togglePublished() {
  if (!selectedTrip.value) return
  try {
    const db = getFirebaseDb()
    const newVal = !selectedTrip.value.isPublished
    await updateDoc(doc(db, 'cms_limited_expeditions', selectedTrip.value.id), { isPublished: newVal })
    selectedTrip.value.isPublished = newVal
    const idx = trips.value.findIndex(t => t.id === selectedTrip.value!.id)
    if (idx !== -1) trips.value[idx].isPublished = newVal
    showMessage(newVal ? 'Expedition published' : 'Expedition unpublished', 'success')
  } catch (e) {
    showMessage('Failed to update status', 'error')
  }
}

// Image upload handlers
async function handleHeroUpload(event: Event) {
  if (!selectedTrip.value) return
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  setUploading(selectedTrip.value.id, 'hero', 0, true)
  const result = await uploadImage(file, `limited_${selectedTrip.value.slug}_hero`)
  if (result) {
    const existing = getMediaItem('hero', 0)
    await saveTripMedia(selectedTrip.value.id, 'hero', 0, result.url, '', existing?.id)
    await loadMedia(selectedTrip.value.id)

    // Also sync onto the trip doc's heroImageUrl field — this is what the
    // listing page (and detail-page fallback) read directly, so without this
    // the upload "succeeds" but never shows up on /limited-expeditions.
    const db = getFirebaseDb()
    await updateDoc(doc(db, 'cms_limited_expeditions', selectedTrip.value.id), { heroImageUrl: result.url })
    selectedTrip.value.heroImageUrl = result.url
    const idx = trips.value.findIndex((t) => t.id === selectedTrip.value!.id)
    if (idx !== -1) trips.value[idx].heroImageUrl = result.url

    toast.success('Hero image uploaded')
  } else {
    toast.error('Upload failed')
  }
  setUploading(selectedTrip.value.id, 'hero', 0, false)
  target.value = ''
}

async function handleAboutUpload(event: Event) {
  if (!selectedTrip.value) return
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  setUploading(selectedTrip.value.id, 'about', 0, true)
  const result = await uploadImage(file, `limited_${selectedTrip.value.slug}_about`)
  if (result) {
    const existing = getMediaItem('about', 0)
    await saveTripMedia(selectedTrip.value.id, 'about', 0, result.url, '', existing?.id)
    await loadMedia(selectedTrip.value.id)
    toast.success('About image uploaded')
  } else {
    toast.error('Upload failed')
  }
  setUploading(selectedTrip.value.id, 'about', 0, false)
  target.value = ''
}

async function handleGalleryUpload(event: Event, slotIndex: number) {
  if (!selectedTrip.value) return
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  setUploading(selectedTrip.value.id, 'gallery', slotIndex, true)
  const result = await uploadImage(file, `limited_${selectedTrip.value.slug}_gallery_${slotIndex}`)
  if (result) {
    const existing = getMediaItem('gallery', slotIndex)
    await saveTripMedia(selectedTrip.value.id, 'gallery', slotIndex, result.url, '', existing?.id)
    await loadMedia(selectedTrip.value.id)
    toast.success(`Gallery image ${slotIndex + 1} uploaded`)
  } else {
    toast.error('Upload failed')
  }
  setUploading(selectedTrip.value.id, 'gallery', slotIndex, false)
  target.value = ''
}

async function handleItineraryImageUpload(event: Event, day: ItineraryDay) {
  if (!selectedTrip.value) return
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  setUploading(selectedTrip.value.id, 'itinerary', day.dayNumber - 1, true)
  const result = await uploadImage(file, `limited_${selectedTrip.value.slug}_itinerary_day${day.dayNumber}`)
  if (result) {
    // Save to the itinerary document
    const db = getFirebaseDb()
    await updateDoc(doc(db, 'cms_limited_expedition_itinerary', day.id), { imageUrl: result.url })
    day.imageUrl = result.url
    toast.success(`Day ${day.dayNumber} image uploaded`)
  } else {
    toast.error('Upload failed')
  }
  setUploading(selectedTrip.value.id, 'itinerary', day.dayNumber - 1, false)
  target.value = ''
}

async function handleNewDayImageUpload(event: Event) {
  if (!selectedTrip.value) return
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  const result = await uploadImage(file, `limited_${selectedTrip.value.slug}_itinerary_day${newDay.value.dayNumber}`)
  if (result) {
    newDay.value.imageUrl = result.url
    toast.success('Day image ready — click Add Day to save')
  } else {
    toast.error('Upload failed')
  }
  target.value = ''
}

async function removeHeroImage() {
  if (!selectedTrip.value) return
  const existing = getMediaItem('hero', 0)
  if (existing) {
    await deleteTripMedia(existing.id)
    await loadMedia(selectedTrip.value.id)

    const db = getFirebaseDb()
    await updateDoc(doc(db, 'cms_limited_expeditions', selectedTrip.value.id), { heroImageUrl: '' })
    selectedTrip.value.heroImageUrl = ''
    const idx = trips.value.findIndex((t) => t.id === selectedTrip.value!.id)
    if (idx !== -1) trips.value[idx].heroImageUrl = ''

    toast.success('Hero image removed')
  }
}

async function removeAboutImage() {
  if (!selectedTrip.value) return
  const existing = getMediaItem('about', 0)
  if (existing) {
    await deleteTripMedia(existing.id)
    await loadMedia(selectedTrip.value.id)
    toast.success('About image removed')
  }
}

async function removeGalleryImage(slotIndex: number) {
  if (!selectedTrip.value) return
  const existing = getMediaItem('gallery', slotIndex)
  if (existing) {
    await deleteTripMedia(existing.id)
    await loadMedia(selectedTrip.value.id)
    toast.success(`Gallery image ${slotIndex + 1} removed`)
  }
}

onMounted(loadTrips)
</script>

<template>
  <div class="trips-manager">
    <div v-if="message" class="alert" :class="`alert-${messageType}`">{{ message }}</div>

    <p class="manager-intro">
      Manage hosted &amp; specialty departures shown on <code>/limited-expeditions</code>. Each card here links to its own detail page at <code>/limited-expeditions/&lt;slug&gt;</code>. Upload images directly below for each expedition — hero, about, gallery and itinerary photos are all managed here.
    </p>

    <div class="manager-grid">
      <div class="trip-list">
        <h3 class="list-title">Limited Expeditions ({{ trips.length }})</h3>
        <div v-if="loading" class="loading-state">Loading...</div>
        <div v-else class="trips-scroll">
          <button
            v-for="trip in trips"
            :key="trip.id"
            @click="selectTrip(trip)"
            class="trip-item"
            :class="{ 'trip-selected': selectedTrip?.id === trip.id }"
          >
            <div class="trip-meta">
              <p class="trip-name">{{ trip.title }}</p>
              <p class="trip-duration">{{ trip.nights }} Nights &middot; {{ trip.vesselName }}</p>
              <span class="trip-status" :class="trip.isPublished ? 'status-published' : 'status-draft'">
                {{ trip.isPublished ? 'Published' : 'Draft' }}
              </span>
            </div>
          </button>
        </div>
      </div>

      <div class="trip-editor">
        <div v-if="!selectedTrip" class="empty-editor">
          <p>Select a limited expedition to edit</p>
        </div>

        <div v-else class="editor-content">
          <div class="editor-header">
            <h3 class="editor-title">{{ selectedTrip.title }}</h3>
            <div class="header-actions">
              <button @click="togglePublished" class="pub-btn" :class="selectedTrip.isPublished ? 'pub-active' : 'pub-inactive'">
                {{ selectedTrip.isPublished ? 'Published' : 'Draft' }}
              </button>
              <button @click="editing = !editing" class="edit-btn">{{ editing ? 'Cancel' : 'Edit' }}</button>
              <button v-if="editing" @click="saveTrip" class="save-btn" :disabled="saving">
                {{ saving ? 'Saving...' : 'Save' }}
              </button>
              <button v-if="!editing" @click="deleteTrip" class="delete-btn" :disabled="deleting">
                {{ deleting ? 'Deleting...' : 'Delete' }}
              </button>
            </div>
          </div>

          <div class="form-grid" :class="{ 'form-readonly': !editing }">
            <div class="form-group">
              <label class="form-label">Slug (URL)</label>
              <input v-model="selectedTrip.slug" :readonly="!editing" class="form-input" />
            </div>
            <div class="form-group">
              <label class="form-label">Title</label>
              <input v-model="selectedTrip.title" :readonly="!editing" class="form-input" />
            </div>
            <div class="form-group">
              <label class="form-label">Subtitle</label>
              <input v-model="selectedTrip.subtitle" :readonly="!editing" class="form-input" />
            </div>
            <div class="form-group">
              <label class="form-label">Vessel</label>
              <input v-model="selectedTrip.vesselName" :readonly="!editing" class="form-input" placeholder="Sylfia or Millennium" />
            </div>
            <div class="form-group">
              <label class="form-label">Nights</label>
              <input v-model.number="selectedTrip.nights" type="number" :readonly="!editing" class="form-input" />
            </div>
            <div class="form-group">
              <label class="form-label">Departure Dates Label</label>
              <input v-model="selectedTrip.dateLabel" :readonly="!editing" class="form-input" placeholder="e.g. 18 – 21 OCTOBER 2026" />
            </div>
            <div class="form-group">
              <label class="form-label">Host (optional)</label>
              <input v-model="selectedTrip.host" :readonly="!editing" class="form-input" placeholder="Leave blank if not hosted" />
            </div>
            <div class="form-group">
              <label class="form-label">Icon</label>
              <select v-model="selectedTrip.icon" :disabled="!editing" class="form-input">
                <option v-for="opt in ICON_OPTIONS" :key="opt" :value="opt">{{ opt }}</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Price (AUD)</label>
              <input v-model.number="selectedTrip.priceAud" type="number" step="0.01" :readonly="!editing" class="form-input" />
            </div>
            <div class="form-group">
              <label class="form-label">Price Label</label>
              <input v-model="selectedTrip.priceLabel" :readonly="!editing" class="form-input" placeholder="e.g. From $3,200 AUD" />
            </div>
            <div class="form-group col-span-2">
              <label class="form-label">Short Description (card grid)</label>
              <textarea v-model="selectedTrip.shortDescription" :readonly="!editing" class="form-input" rows="2"></textarea>
            </div>
            <div class="form-group col-span-2">
              <label class="form-label">Full Description (detail page)</label>
              <textarea v-model="selectedTrip.description" :readonly="!editing" class="form-input" rows="4"></textarea>
            </div>
            <div class="form-group">
              <label class="form-label">Rezdy Product ID</label>
              <input v-model="selectedTrip.rezdyProductId" :readonly="!editing" class="form-input" placeholder="Optional" />
            </div>
          </div>

          <!-- Hero Image Upload -->
          <div class="media-section">
            <h4 class="media-title">Hero Image</h4>
            <p class="media-hint">Displayed at the top of the expedition detail page.</p>
            <div class="media-upload-row">
              <div class="media-preview-box">
                <template v-if="getMediaUrl('hero', 0)">
                  <img :src="getMediaUrl('hero', 0)" alt="Hero" class="media-preview-img" />
                  <button @click="removeHeroImage" class="media-remove-btn" title="Remove">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  </button>
                </template>
                <div v-else class="media-placeholder">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
                    <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-3.09-3.09a2 2 0 0 0-2.83 0L6 21"/>
                  </svg>
                  <span>No Hero Image</span>
                </div>
              </div>
              <div class="media-upload-controls">
                <label class="upload-btn" :class="{ 'uploading': isUploading(selectedTrip.id, 'hero', 0) }">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                  {{ isUploading(selectedTrip.id, 'hero', 0) ? 'Uploading...' : 'Upload Hero Image' }}
                  <input type="file" accept="image/*" @change="handleHeroUpload" hidden />
                </label>
              </div>
            </div>
          </div>

          <!-- About Image Upload -->
          <div class="media-section">
            <h4 class="media-title">About Image</h4>
            <p class="media-hint">Displayed in the About section of the detail page.</p>
            <div class="media-upload-row">
              <div class="media-preview-box">
                <template v-if="getMediaUrl('about', 0)">
                  <img :src="getMediaUrl('about', 0)" alt="About" class="media-preview-img" />
                  <button @click="removeAboutImage" class="media-remove-btn" title="Remove">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  </button>
                </template>
                <div v-else class="media-placeholder">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
                    <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-3.09-3.09a2 2 0 0 0-2.83 0L6 21"/>
                  </svg>
                  <span>No About Image</span>
                </div>
              </div>
              <div class="media-upload-controls">
                <label class="upload-btn" :class="{ 'uploading': isUploading(selectedTrip.id, 'about', 0) }">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                  {{ isUploading(selectedTrip.id, 'about', 0) ? 'Uploading...' : 'Upload About Image' }}
                  <input type="file" accept="image/*" @change="handleAboutUpload" hidden />
                </label>
              </div>
            </div>
          </div>

          <!-- Gallery Images Upload -->
          <div class="media-section">
            <h4 class="media-title">Gallery Images ({{ gallerySlots }} slots)</h4>
            <p class="media-hint">Displayed in the gallery section of the detail page. Upload up to 6 images.</p>
            <div class="gallery-grid">
              <div v-for="slotIndex in gallerySlots" :key="slotIndex" class="gallery-slot">
                <div class="gallery-preview-box">
                  <template v-if="getMediaUrl('gallery', slotIndex - 1)">
                    <img :src="getMediaUrl('gallery', slotIndex - 1)" :alt="`Gallery ${slotIndex}`" class="gallery-preview-img" />
                    <button @click="removeGalleryImage(slotIndex - 1)" class="gallery-remove-btn" title="Remove">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </button>
                  </template>
                  <div v-else class="gallery-placeholder">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
                      <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-3.09-3.09a2 2 0 0 0-2.83 0L6 21"/>
                    </svg>
                    <span>{{ slotIndex }}</span>
                  </div>
                </div>
                <label class="gallery-upload-btn" :class="{ 'uploading': isUploading(selectedTrip.id, 'gallery', slotIndex - 1) }">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                  <input type="file" accept="image/*" @change="handleGalleryUpload($event, slotIndex - 1)" hidden />
                </label>
              </div>
            </div>
          </div>

          <!-- Itinerary -->
          <div class="sub-section">
            <h4 class="sub-title">Itinerary ({{ itinerary.length }} days)</h4>
            <p class="sub-hint">Each day can have its own image uploaded directly. These display on the detail page timeline.</p>
            <div class="itinerary-list">
              <div v-for="day in itinerary" :key="day.id" class="itinerary-item">
                <div class="day-header">
                  <span class="day-number">Day {{ day.dayNumber }}</span>
                  <input v-model="day.title" class="day-title-input" @change="updateItineraryDay(day)" />
                  <button @click="removeItineraryDay(day.id)" class="remove-btn" title="Remove day">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  </button>
                </div>
                <textarea v-model="day.description" class="form-input" rows="2" @change="updateItineraryDay(day)"></textarea>

                <!-- Day Image Upload -->
                <div class="day-image-row">
                  <div class="day-image-preview">
                    <template v-if="day.imageUrl">
                      <img :src="day.imageUrl" :alt="`Day ${day.dayNumber}`" class="day-image-img" />
                    </template>
                    <div v-else class="day-image-placeholder">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
                        <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-3.09-3.09a2 2 0 0 0-2.83 0L6 21"/>
                      </svg>
                    </div>
                  </div>
                  <label class="day-upload-btn" :class="{ 'uploading': isUploading(selectedTrip.id, 'itinerary', day.dayNumber - 1) }">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                    {{ isUploading(selectedTrip.id, 'itinerary', day.dayNumber - 1) ? '...' : 'Upload' }}
                    <input type="file" accept="image/*" @change="handleItineraryImageUpload($event, day)" hidden />
                  </label>
                </div>

                <div class="day-meta-row">
                  <input v-model="day.activityLabel" class="form-input sm" placeholder="Activity" @change="updateItineraryDay(day)" />
                  <input v-model="day.mealsLabel" class="form-input sm" placeholder="Meals" @change="updateItineraryDay(day)" />
                </div>
              </div>
            </div>

            <!-- Add Day Form -->
            <div class="add-day-form">
              <p class="add-day-label">Add Day</p>
              <div class="add-row">
                <input v-model.number="newDay.dayNumber" type="number" class="form-input sm" placeholder="Day #" />
                <input v-model="newDay.title" class="form-input" placeholder="Title" />
              </div>
              <textarea v-model="newDay.description" class="form-input" rows="2" placeholder="Description"></textarea>

              <!-- New Day Image Upload -->
              <div class="new-day-image-row">
                <div class="new-day-image-preview">
                  <template v-if="newDay.imageUrl">
                    <img :src="newDay.imageUrl" alt="New day" class="new-day-image-img" />
                  </template>
                  <div v-else class="new-day-image-placeholder">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
                      <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-3.09-3.09a2 2 0 0 0-2.83 0L6 21"/>
                    </svg>
                  </div>
                </div>
                <label class="new-day-upload-btn">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                  {{ newDay.imageUrl ? 'Change' : 'Upload' }}
                  <input type="file" accept="image/*" @change="handleNewDayImageUpload" hidden />
                </label>
              </div>

              <div class="add-row">
                <input v-model="newDay.activityLabel" class="form-input sm" placeholder="Activity" />
                <input v-model="newDay.mealsLabel" class="form-input sm" placeholder="Meals" />
                <button @click="addItineraryDay" class="add-btn">Add Day</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.alert { padding: 0.75rem 1rem; font-size: 0.8rem; margin-bottom: 1rem; border: 1px solid; }
.alert-success { background: rgba(76,175,80,0.1); border-color: rgba(76,175,80,0.3); color: #4caf50; }
.alert-error { background: rgba(224,123,90,0.1); border-color: rgba(224,123,90,0.3); color: #e07b5a; }

.manager-intro { font-size: 0.8rem; color: rgba(248,245,239,0.6); margin-bottom: 1.25rem; line-height: 1.6; max-width: 760px; }
.manager-intro code { background: rgba(201,168,76,0.1); padding: 0.1rem 0.35rem; border-radius: 2px; color: #c9a84c; font-size: 0.75rem; }
.manager-intro a { color: #c9a84c; }

.manager-grid { display: grid; grid-template-columns: 280px 1fr; gap: 1.5rem; min-height: 500px; }

.trip-list { background: rgba(10,46,74,0.3); border: 1px solid rgba(201,168,76,0.1); overflow: hidden; display: flex; flex-direction: column; }
.list-title { font-family: var(--font-heading); font-size: 0.7rem; letter-spacing: 0.15em; text-transform: uppercase; color: rgba(248,245,239,0.5); padding: 1rem; border-bottom: 1px solid rgba(201,168,76,0.1); }
.trips-scroll { overflow-y: auto; max-height: 600px; }

.trip-item { display: flex; align-items: center; gap: 0.75rem; padding: 0.75rem 1rem; background: none; border: none; border-bottom: 1px solid rgba(201,168,76,0.05); color: rgba(248,245,239,0.7); cursor: pointer; transition: all 0.2s; text-align: left; width: 100%; }
.trip-item:hover { background: rgba(201,168,76,0.05); }
.trip-selected { background: rgba(201,168,76,0.1); border-left: 2px solid #c9a84c; }
.trip-name { font-size: 0.8rem; font-weight: 500; }
.trip-duration { font-size: 0.6rem; color: rgba(248,245,239,0.35); }
.trip-status { font-size: 0.5rem; letter-spacing: 0.1em; text-transform: uppercase; padding: 0.125rem 0.375rem; display: inline-block; margin-top: 0.25rem; }
.status-published { background: rgba(76,175,80,0.15); color: #4caf50; }
.status-draft { background: rgba(201,168,76,0.15); color: #c9a84c; }

.trip-editor { background: rgba(10,46,74,0.3); border: 1px solid rgba(201,168,76,0.1); padding: 1.5rem; }
.empty-editor { display: flex; align-items: center; justify-content: center; min-height: 400px; color: rgba(248,245,239,0.35); }

.editor-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 0.75rem; }
.editor-title { font-family: var(--font-display); font-size: 1.5rem; font-weight: 300; color: #f8f5ef; }
.header-actions { display: flex; gap: 0.5rem; }
.pub-btn, .edit-btn, .save-btn, .delete-btn { padding: 0.375rem 0.75rem; font-family: var(--font-heading); font-size: 0.6rem; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; cursor: pointer; border: 1px solid; transition: all 0.2s; }
.pub-active { background: rgba(76,175,80,0.15); border-color: rgba(76,175,80,0.3); color: #4caf50; }
.pub-inactive { background: rgba(201,168,76,0.15); border-color: rgba(201,168,76,0.3); color: #c9a84c; }
.edit-btn { background: rgba(10,46,74,0.5); border-color: rgba(201,168,76,0.2); color: rgba(248,245,239,0.7); }
.edit-btn:hover { border-color: #c9a84c; color: #c9a84c; }
.save-btn { background: #c9a84c; border-color: #c9a84c; color: #071a2b; }
.save-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.delete-btn { background: none; border-color: rgba(224,123,90,0.3); color: rgba(224,123,90,0.7); }
.delete-btn:hover { background: rgba(224,123,90,0.1); color: #e07b5a; }
.delete-btn:disabled { opacity: 0.5; cursor: not-allowed; }

.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 2rem; }
.form-readonly .form-input { opacity: 0.7; cursor: default; }
.form-group { display: flex; flex-direction: column; gap: 0.375rem; }
.col-span-2 { grid-column: span 2; }
.form-label { font-family: var(--font-heading); font-size: 0.6rem; font-weight: 600; letter-spacing: 0.15em; text-transform: uppercase; color: rgba(248,245,239,0.5); }
.form-input { background: rgba(7,26,43,0.6); border: 1px solid rgba(201,168,76,0.2); color: #f8f5ef; padding: 0.625rem 0.75rem; font-family: var(--font-body); font-size: 0.8rem; outline: none; transition: border-color 0.3s; -webkit-appearance: none; }
.form-input:focus { border-color: #c9a84c; }
.form-input.sm { padding: 0.5rem 0.625rem; font-size: 0.7rem; }

/* Media Sections */
.media-section { margin-bottom: 2rem; padding-top: 1.5rem; border-top: 1px solid rgba(201,168,76,0.1); }
.media-title { font-family: var(--font-heading); font-size: 0.7rem; letter-spacing: 0.15em; text-transform: uppercase; color: rgba(248,245,239,0.5); margin-bottom: 0.25rem; }
.media-hint { font-size: 0.7rem; color: rgba(248,245,239,0.35); margin-bottom: 1rem; }
.media-upload-row { display: flex; gap: 1rem; align-items: flex-start; }
.media-preview-box { position: relative; width: 200px; height: 130px; background: rgba(7,26,43,0.4); border: 1px solid rgba(201,168,76,0.1); overflow: hidden; flex-shrink: 0; }
.media-preview-img { width: 100%; height: 100%; object-fit: cover; }
.media-placeholder { width: 100%; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; color: rgba(248,245,239,0.2); gap: 0.5rem; font-size: 0.65rem; }
.media-remove-btn { position: absolute; top: 4px; right: 4px; width: 24px; height: 24px; background: rgba(224,123,90,0.8); border: none; color: white; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: background 0.2s; }
.media-remove-btn:hover { background: #e07b5a; }
.media-upload-controls { display: flex; flex-direction: column; gap: 0.5rem; }
.upload-btn { display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.5rem 1rem; background: rgba(201,168,76,0.15); border: 1px solid rgba(201,168,76,0.3); color: #c9a84c; font-family: var(--font-heading); font-size: 0.6rem; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; cursor: pointer; transition: all 0.2s; }
.upload-btn:hover { background: rgba(201,168,76,0.25); border-color: rgba(201,168,76,0.5); }
.upload-btn.uploading { opacity: 0.6; cursor: not-allowed; }

/* Gallery Grid */
.gallery-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.75rem; }
.gallery-slot { display: flex; flex-direction: column; gap: 0.5rem; }
.gallery-preview-box { position: relative; aspect-ratio: 4/3; background: rgba(7,26,43,0.4); border: 1px solid rgba(201,168,76,0.1); overflow: hidden; }
.gallery-preview-img { width: 100%; height: 100%; object-fit: cover; }
.gallery-placeholder { width: 100%; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; color: rgba(248,245,239,0.2); gap: 0.25rem; font-size: 0.6rem; }
.gallery-remove-btn { position: absolute; top: 4px; right: 4px; width: 20px; height: 20px; background: rgba(224,123,90,0.8); border: none; color: white; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: background 0.2s; padding: 0; }
.gallery-remove-btn:hover { background: #e07b5a; }
.gallery-upload-btn { display: flex; align-items: center; justify-content: center; gap: 0.35rem; padding: 0.4rem; background: rgba(201,168,76,0.1); border: 1px solid rgba(201,168,76,0.2); color: #c9a84c; cursor: pointer; transition: all 0.2s; }
.gallery-upload-btn:hover { background: rgba(201,168,76,0.2); border-color: rgba(201,168,76,0.4); }
.gallery-upload-btn.uploading { opacity: 0.6; cursor: not-allowed; }

/* Itinerary */
.sub-section { margin-bottom: 2rem; padding-top: 1.5rem; border-top: 1px solid rgba(201,168,76,0.1); }
.sub-title { font-family: var(--font-heading); font-size: 0.7rem; letter-spacing: 0.15em; text-transform: uppercase; color: rgba(248,245,239,0.5); margin-bottom: 0.5rem; }
.sub-hint { font-size: 0.7rem; color: rgba(248,245,239,0.35); margin-bottom: 1rem; }

.itinerary-list { display: flex; flex-direction: column; gap: 0.75rem; margin-bottom: 1rem; }
.itinerary-item { padding: 0.75rem; background: rgba(7,26,43,0.4); border: 1px solid rgba(201,168,76,0.08); }
.day-header { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.5rem; }
.day-number { font-family: var(--font-heading); font-size: 0.65rem; font-weight: 700; color: #c9a84c; letter-spacing: 0.1em; white-space: nowrap; }
.day-title-input { background: transparent; border: none; border-bottom: 1px solid rgba(201,168,76,0.15); color: #f8f5ef; font-family: var(--font-display); font-size: 1rem; flex: 1; outline: none; }
.day-meta-row { display: flex; gap: 0.5rem; margin-top: 0.5rem; }

.day-image-row { display: flex; align-items: center; gap: 0.75rem; margin-top: 0.75rem; }
.day-image-preview { width: 80px; height: 60px; background: rgba(7,26,43,0.4); border: 1px solid rgba(201,168,76,0.1); overflow: hidden; flex-shrink: 0; }
.day-image-img { width: 100%; height: 100%; object-fit: cover; }
.day-image-placeholder { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; color: rgba(248,245,239,0.15); }
.day-upload-btn { display: inline-flex; align-items: center; gap: 0.35rem; padding: 0.35rem 0.6rem; background: rgba(201,168,76,0.1); border: 1px solid rgba(201,168,76,0.2); color: #c9a84c; font-family: var(--font-heading); font-size: 0.55rem; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; cursor: pointer; transition: all 0.2s; white-space: nowrap; }
.day-upload-btn:hover { background: rgba(201,168,76,0.2); }
.day-upload-btn.uploading { opacity: 0.6; cursor: not-allowed; }

.new-day-image-row { display: flex; align-items: center; gap: 0.75rem; margin: 0.5rem 0; }
.new-day-image-preview { width: 80px; height: 60px; background: rgba(7,26,43,0.4); border: 1px solid rgba(201,168,76,0.1); overflow: hidden; flex-shrink: 0; }
.new-day-image-img { width: 100%; height: 100%; object-fit: cover; }
.new-day-image-placeholder { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; color: rgba(248,245,239,0.15); }
.new-day-upload-btn { display: inline-flex; align-items: center; gap: 0.35rem; padding: 0.35rem 0.6rem; background: rgba(201,168,76,0.1); border: 1px solid rgba(201,168,76,0.2); color: #c9a84c; font-family: var(--font-heading); font-size: 0.55rem; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; cursor: pointer; transition: all 0.2s; }
.new-day-upload-btn:hover { background: rgba(201,168,76,0.2); }

.remove-btn { background: none; border: none; color: rgba(224,123,90,0.5); cursor: pointer; padding: 0.25rem; transition: color 0.2s; }
.remove-btn:hover { color: #e07b5a; }

.add-row { display: flex; gap: 0.5rem; margin-top: 0.5rem; }
.add-btn { padding: 0.5rem 1rem; background: rgba(201,168,76,0.15); border: 1px solid rgba(201,168,76,0.3); color: #c9a84c; font-family: var(--font-heading); font-size: 0.6rem; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; cursor: pointer; transition: all 0.2s; white-space: nowrap; }
.add-btn:hover { background: rgba(201,168,76,0.25); }

.add-day-form { padding-top: 0.75rem; border-top: 1px dashed rgba(201,168,76,0.15); }
.add-day-label { font-size: 0.65rem; color: rgba(248,245,239,0.4); margin-bottom: 0.5rem; text-transform: uppercase; letter-spacing: 0.1em; }

.loading-state { padding: 2rem; text-align: center; color: rgba(248,245,239,0.4); }

@media (max-width: 768px) {
  .manager-grid { grid-template-columns: 1fr; }
  .form-grid { grid-template-columns: 1fr; }
  .col-span-2 { grid-column: span 1; }
  .gallery-grid { grid-template-columns: repeat(2, 1fr); }
  .media-upload-row { flex-direction: column; }
}
</style>
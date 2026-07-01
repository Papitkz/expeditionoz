<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { getFirebaseDb, initFirebase } from '@/lib/firebase'
import { doc, getDoc, setDoc, deleteDoc, collection, getDocs } from 'firebase/firestore'

initFirebase()

const loading = ref(true)
const saving = ref(false)
const message = ref('')
const messageType = ref<'success' | 'error'>('success')

interface RezdyRow {
  /** e.g. 'dive-escape' — used to build the rezdy_<slug>_product_id / _widget_id keys */
  slug: string
  productId: string
  widgetId: string
}

const rezdyCompanyCode = ref('')
const rezdyRows = ref<RezdyRow[]>([])
const removedSlugs = ref<string[]>([])

const siteSettings = ref<Record<string, string>>({
  site_phone: '+61-234-567-890',
  site_email: 'hello@expeditionoz.com.au',
})

function showMessage(text: string, type: 'success' | 'error') {
  message.value = text
  messageType.value = type
  setTimeout(() => { message.value = '' }, 3000)
}

function slugToKeyPart(slug: string) {
  return slug.trim().toLowerCase().replace(/[\s_]+/g, '-').replace(/-+/g, '-')
}

function productIdKey(slug: string) {
  return `rezdy_${slugToKeyPart(slug).replace(/-/g, '_')}_product_id`
}

function widgetIdKey(slug: string) {
  return `rezdy_${slugToKeyPart(slug).replace(/-/g, '_')}_widget_id`
}

// The trip slugs that exist elsewhere in the app today. Used only to make
// sure every known trip has a row to fill in — this list is just a helper
// for pre-populating the form, NOT a hardcoded limit. Any extra slug typed
// into "Add another trip" below works immediately, with no code change.
const KNOWN_TRIP_SLUGS = ['ocean-safari', 'dive-expedition', 'ocean-safari-escape', 'dive-escape']

function addRow(slug = '') {
  rezdyRows.value.push({ slug, productId: '', widgetId: '' })
}

function removeRow(index: number) {
  const [removed] = rezdyRows.value.splice(index, 1)
  if (removed?.slug) removedSlugs.value.push(slugToKeyPart(removed.slug))
}

async function loadSettings() {
  loading.value = true
  try {
    const db = getFirebaseDb()

    // Site settings — unchanged, fixed keys.
    for (const key of Object.keys(siteSettings.value)) {
      const snap = await getDoc(doc(db, 'cms_settings', key))
      if (snap.exists()) siteSettings.value[key] = snap.data().value as string
    }

    // Rezdy — read every cms_settings doc and reconstruct rows dynamically,
    // so any trip already configured (including ones added after this code
    // was written) shows up automatically.
    const allDocs = await getDocs(collection(db, 'cms_settings'))
    const foundSlugs = new Map<string, RezdyRow>()

    allDocs.forEach((d) => {
      const key = d.id
      const value = (d.data()?.value as string) || ''
      if (key === 'rezdy_company_code') {
        rezdyCompanyCode.value = value
        return
      }
      const productMatch = key.match(/^rezdy_(.+)_product_id$/)
      const widgetMatch = key.match(/^rezdy_(.+)_widget_id$/)
      const rawSlug = (productMatch || widgetMatch)?.[1]
      if (!rawSlug) return
      const slug = rawSlug.replace(/_/g, '-')

      const row = foundSlugs.get(slug) || { slug, productId: '', widgetId: '' }
      if (productMatch) row.productId = value
      if (widgetMatch) row.widgetId = value
      foundSlugs.set(slug, row)
    })

    // Ensure every known trip has a row, even if nothing's saved for it yet.
    for (const slug of KNOWN_TRIP_SLUGS) {
      if (!foundSlugs.has(slug)) foundSlugs.set(slug, { slug, productId: '', widgetId: '' })
    }

    rezdyRows.value = Array.from(foundSlugs.values())
  } catch (e) {
    console.warn('Firestore unavailable, using default settings:', e)
    rezdyRows.value = KNOWN_TRIP_SLUGS.map((slug) => ({ slug, productId: '', widgetId: '' }))
  }
  loading.value = false
}

async function saveAllRezdy() {
  saving.value = true
  try {
    const db = getFirebaseDb()

    await setDoc(doc(db, 'cms_settings', 'rezdy_company_code'), { value: rezdyCompanyCode.value })

    for (const row of rezdyRows.value) {
      const slug = slugToKeyPart(row.slug)
      if (!slug) continue
      await setDoc(doc(db, 'cms_settings', productIdKey(slug)), { value: row.productId })
      await setDoc(doc(db, 'cms_settings', widgetIdKey(slug)), { value: row.widgetId })
    }

    // Clean up keys for any row the user removed before saving.
    for (const slug of removedSlugs.value) {
      if (!slug) continue
      await deleteDoc(doc(db, 'cms_settings', productIdKey(slug)))
      await deleteDoc(doc(db, 'cms_settings', widgetIdKey(slug)))
    }
    removedSlugs.value = []

    showMessage('Rezdy settings saved', 'success')
  } catch (e) {
    showMessage('Failed to save: Firestore unavailable', 'error')
  }
  saving.value = false
}

async function saveSiteSettings() {
  saving.value = true
  try {
    const db = getFirebaseDb()
    for (const key of ['site_phone', 'site_email']) {
      await setDoc(doc(db, 'cms_settings', key), { value: siteSettings.value[key] })
    }
    showMessage('Site settings saved', 'success')
  } catch (e) {
    showMessage('Failed to save: Firestore unavailable', 'error')
  }
  saving.value = false
}

onMounted(loadSettings)
</script>

<template>
  <div class="settings-page">
    <div v-if="message" class="alert" :class="`alert-${messageType}`">{{ message }}</div>

    <!-- Firebase Status -->
    <div class="settings-card">
      <h3 class="card-title">Firebase Connection</h3>
      <p class="card-desc">Firebase is configured and connected to your Expedition OZ project.</p>
      <div class="status-row">
        <span class="status-dot active"></span>
        <span class="status-text">Connected to expeditionoz</span>
      </div>
    </div>

    <!-- Rezdy Integration -->
    <div class="settings-card">
      <h3 class="card-title">Rezdy Booking Integration</h3>
      <p class="card-desc">Connect your Rezdy account to enable live availability and booking on expedition pages. Add a row for every trip you sell through Rezdy — new trips can be added here any time, no code changes needed.</p>

      <div class="form-group company-code-group">
        <label class="form-label">Rezdy Company Code</label>
        <input v-model="rezdyCompanyCode" class="form-input" placeholder="your-company-code" />
      </div>

      <div class="rezdy-rows">
        <div v-for="(row, index) in rezdyRows" :key="index" class="rezdy-row">
          <div class="form-group">
            <label class="form-label">Trip Slug</label>
            <input v-model="row.slug" class="form-input" placeholder="e.g. dive-escape" />
          </div>
          <div class="form-group">
            <label class="form-label">Rezdy Product ID</label>
            <input v-model="row.productId" class="form-input" placeholder="e.g. 24680" />
          </div>
          <div class="form-group">
            <label class="form-label">Rezdy Widget ID</label>
            <input v-model="row.widgetId" class="form-input" placeholder="e.g. 767119" />
          </div>
          <button class="remove-row-btn" type="button" @click="removeRow(index)" aria-label="Remove trip">
            ✕
          </button>
        </div>
      </div>

      <button class="add-row-btn" type="button" @click="addRow()">+ Add another trip</button>

      <div class="rezdy-preview">
        <p class="sub-label">Rezdy Widget Preview</p>
        <p class="preview-text">Once configured, the booking page will embed a live Rezdy widget with real availability.</p>
        <code class="code-block">https://{{ rezdyCompanyCode || 'your-company' }}.rezdy.com/{{ rezdyRows[0]?.widgetId || 'WIDGET_ID' }}/{{ rezdyRows[0]?.productId || 'PRODUCT_ID' }}</code>
      </div>

      <button @click="saveAllRezdy" class="save-btn" :disabled="saving">Save Rezdy Settings</button>
    </div>

    <!-- Site Settings -->
    <div class="settings-card">
      <h3 class="card-title">Site Settings</h3>
      <p class="card-desc">General site contact information.</p>

      <div class="form-grid">
        <div class="form-group">
          <label class="form-label">Phone Number</label>
          <input v-model="siteSettings.site_phone" class="form-input" />
        </div>
        <div class="form-group">
          <label class="form-label">Email Address</label>
          <input v-model="siteSettings.site_email" class="form-input" />
        </div>
      </div>

      <button @click="saveSiteSettings" class="save-btn" :disabled="saving">Save Site Settings</button>
    </div>
  </div>
</template>

<style scoped>
.alert { padding: 0.75rem 1rem; font-size: 0.8rem; margin-bottom: 1rem; border: 1px solid; }
.alert-success { background: rgba(76,175,80,0.1); border-color: rgba(76,175,80,0.3); color: #4caf50; }
.alert-error { background: rgba(224,123,90,0.1); border-color: rgba(224,123,90,0.3); color: #e07b5a; }

.settings-card { background: rgba(10,46,74,0.3); border: 1px solid rgba(201,168,76,0.1); padding: 1.5rem; margin-bottom: 1.5rem; }
.card-title { font-family: var(--font-display); font-size: 1.5rem; font-weight: 300; color: #f8f5ef; margin-bottom: 0.25rem; }
.card-desc { font-size: 0.8rem; color: rgba(248,245,239,0.5); margin-bottom: 1.5rem; line-height: 1.6; }

.status-row { display: flex; align-items: center; gap: 0.75rem; }
.status-dot { width: 10px; height: 10px; border-radius: 50%; }
.status-dot.active { background: #4caf50; box-shadow: 0 0 8px rgba(76,175,80,0.4); }
.status-text { font-family: var(--font-heading); font-size: 0.7rem; color: rgba(248,245,239,0.7); letter-spacing: 0.05em; }

.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1.5rem; }
.form-group { display: flex; flex-direction: column; gap: 0.375rem; }
.form-label { font-family: var(--font-heading); font-size: 0.6rem; font-weight: 600; letter-spacing: 0.15em; text-transform: uppercase; color: rgba(248,245,239,0.5); }
.form-input { background: rgba(7,26,43,0.6); border: 1px solid rgba(201,168,76,0.2); color: #f8f5ef; padding: 0.625rem 0.75rem; font-family: var(--font-body); font-size: 0.8rem; outline: none; transition: border-color 0.3s; -webkit-appearance: none; }
.form-input:focus { border-color: #c9a84c; }

.company-code-group { max-width: 320px; margin-bottom: 1.25rem; }

.rezdy-rows { display: flex; flex-direction: column; gap: 0.75rem; margin-bottom: 1rem; }
.rezdy-row {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr auto;
  gap: 0.75rem;
  align-items: end;
  padding: 0.875rem;
  background: rgba(7,26,43,0.3);
  border: 1px solid rgba(201,168,76,0.08);
}

.remove-row-btn {
  width: 38px;
  height: 38px;
  flex-shrink: 0;
  background: rgba(224,123,90,0.08);
  border: 1px solid rgba(224,123,90,0.2);
  color: rgba(224,123,90,0.7);
  cursor: pointer;
  font-size: 0.85rem;
  transition: all 0.2s;
}
.remove-row-btn:hover { background: rgba(224,123,90,0.18); border-color: rgba(224,123,90,0.4); color: #e07b5a; }

.add-row-btn {
  padding: 0.55rem 1rem;
  background: transparent;
  border: 1px dashed rgba(201,168,76,0.35);
  color: rgba(201,168,76,0.85);
  font-family: var(--font-heading);
  font-size: 0.65rem;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  cursor: pointer;
  transition: all 0.2s;
  margin-bottom: 1.5rem;
}
.add-row-btn:hover { background: rgba(201,168,76,0.08); border-color: #c9a84c; color: #c9a84c; }

@media (max-width: 900px) {
  .rezdy-row { grid-template-columns: 1fr; }
  .remove-row-btn { width: 100%; }
}

.save-btn { padding: 0.625rem 1.5rem; background: #c9a84c; border: 1px solid #c9a84c; color: #071a2b; font-family: var(--font-heading); font-size: 0.65rem; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; cursor: pointer; transition: all 0.2s; }
.save-btn:hover { background: #e8c05a; }
.save-btn:disabled { opacity: 0.5; cursor: not-allowed; }

.rezdy-preview { padding: 1rem; background: rgba(7,26,43,0.4); border: 1px solid rgba(201,168,76,0.08); margin-bottom: 1.5rem; }
.sub-label { font-family: var(--font-heading); font-size: 0.6rem; letter-spacing: 0.15em; text-transform: uppercase; color: rgba(248,245,239,0.4); margin-bottom: 0.5rem; }
.preview-text { font-size: 0.75rem; color: rgba(248,245,239,0.5); margin-bottom: 0.5rem; line-height: 1.5; }
.code-block { display: block; padding: 0.75rem; background: rgba(7,26,43,0.8); border: 1px solid rgba(201,168,76,0.15); font-family: 'SF Mono', monospace; font-size: 0.75rem; color: #c9a84c; word-break: break-all; }

@media (max-width: 768px) { .form-grid { grid-template-columns: 1fr; } }
</style>
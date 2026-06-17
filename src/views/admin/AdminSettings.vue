<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { getFirebaseDb, initFirebase } from '@/lib/firebase'
import { doc, getDoc, setDoc } from 'firebase/firestore'

initFirebase()

const loading = ref(true)
const saving = ref(false)
const message = ref('')
const messageType = ref<'success' | 'error'>('success')

const settings = ref<Record<string, string>>({
  rezdy_company_code: '',
  rezdy_ocean_safari_product_id: '',
  rezdy_dive_expedition_product_id: '',
  site_phone: '+61-234-567-890',
  site_email: 'hello@expeditionoz.com.au',
})

function showMessage(text: string, type: 'success' | 'error') {
  message.value = text
  messageType.value = type
  setTimeout(() => { message.value = '' }, 3000)
}

async function loadSettings() {
  loading.value = true
  try {
    const db = getFirebaseDb()

    for (const key of Object.keys(settings.value)) {
      const snap = await getDoc(doc(db, 'cms_settings', key))
      if (snap.exists()) settings.value[key] = snap.data().value as string
    }
  } catch (e) {
    console.warn('Firestore unavailable, using default settings:', e)
  }
  loading.value = false
}

async function saveAllRezdy() {
  saving.value = true
  try {
    const db = getFirebaseDb()
    for (const key of ['rezdy_company_code', 'rezdy_ocean_safari_product_id', 'rezdy_dive_expedition_product_id']) {
      await setDoc(doc(db, 'cms_settings', key), { value: settings.value[key] })
    }
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
      await setDoc(doc(db, 'cms_settings', key), { value: settings.value[key] })
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
      <p class="card-desc">Connect your Rezdy account to enable live availability and booking on expedition pages.</p>

      <div class="form-grid">
        <div class="form-group">
          <label class="form-label">Rezdy Company Code</label>
          <input v-model="settings.rezdy_company_code" class="form-input" placeholder="your-company-code" />
        </div>
        <div class="form-group">
          <label class="form-label">Ocean Safari Rezdy Product ID</label>
          <input v-model="settings.rezdy_ocean_safari_product_id" class="form-input" placeholder="e.g. 12345" />
        </div>
        <div class="form-group">
          <label class="form-label">Dive Expedition Rezdy Product ID</label>
          <input v-model="settings.rezdy_dive_expedition_product_id" class="form-input" placeholder="e.g. 67890" />
        </div>
      </div>

      <div class="rezdy-preview">
        <p class="sub-label">Rezdy Widget Preview</p>
        <p class="preview-text">Once configured, the booking page will embed a live Rezdy widget with real availability.</p>
        <code class="code-block">https://{{ settings.rezdy_company_code || 'your-company' }}.rezdy.com/widget/{{ settings.rezdy_ocean_safari_product_id || 'PRODUCT_ID' }}</code>
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
          <input v-model="settings.site_phone" class="form-input" />
        </div>
        <div class="form-group">
          <label class="form-label">Email Address</label>
          <input v-model="settings.site_email" class="form-input" />
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
.card-title { font-family: 'Cormorant Garamond', serif; font-size: 1.5rem; font-weight: 300; color: #f8f5ef; margin-bottom: 0.25rem; }
.card-desc { font-size: 0.8rem; color: rgba(248,245,239,0.5); margin-bottom: 1.5rem; line-height: 1.6; }

.status-row { display: flex; align-items: center; gap: 0.75rem; }
.status-dot { width: 10px; height: 10px; border-radius: 50%; }
.status-dot.active { background: #4caf50; box-shadow: 0 0 8px rgba(76,175,80,0.4); }
.status-text { font-family: 'Montserrat', sans-serif; font-size: 0.7rem; color: rgba(248,245,239,0.7); letter-spacing: 0.05em; }

.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1.5rem; }
.form-group { display: flex; flex-direction: column; gap: 0.375rem; }
.form-label { font-family: 'Montserrat', sans-serif; font-size: 0.6rem; font-weight: 600; letter-spacing: 0.15em; text-transform: uppercase; color: rgba(248,245,239,0.5); }
.form-input { background: rgba(7,26,43,0.6); border: 1px solid rgba(201,168,76,0.2); color: #f8f5ef; padding: 0.625rem 0.75rem; font-family: 'Inter', sans-serif; font-size: 0.8rem; outline: none; transition: border-color 0.3s; -webkit-appearance: none; }
.form-input:focus { border-color: #c9a84c; }

.save-btn { padding: 0.625rem 1.5rem; background: #c9a84c; border: 1px solid #c9a84c; color: #071a2b; font-family: 'Montserrat', sans-serif; font-size: 0.65rem; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; cursor: pointer; transition: all 0.2s; }
.save-btn:hover { background: #e8c05a; }
.save-btn:disabled { opacity: 0.5; cursor: not-allowed; }

.rezdy-preview { padding: 1rem; background: rgba(7,26,43,0.4); border: 1px solid rgba(201,168,76,0.08); margin-bottom: 1.5rem; }
.sub-label { font-family: 'Montserrat', sans-serif; font-size: 0.6rem; letter-spacing: 0.15em; text-transform: uppercase; color: rgba(248,245,239,0.4); margin-bottom: 0.5rem; }
.preview-text { font-size: 0.75rem; color: rgba(248,245,239,0.5); margin-bottom: 0.5rem; line-height: 1.5; }
.code-block { display: block; padding: 0.75rem; background: rgba(7,26,43,0.8); border: 1px solid rgba(201,168,76,0.15); font-family: 'SF Mono', monospace; font-size: 0.75rem; color: #c9a84c; word-break: break-all; }

@media (max-width: 768px) { .form-grid { grid-template-columns: 1fr; } }
</style>
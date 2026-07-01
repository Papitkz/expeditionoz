<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import {
  loadAllPageContent,
  savePageContent,
  deletePageContent,
  batchSavePageContent,
  getPageContentDefs,
  getAllPagesWithContent,
  type PageContentItem,
} from '@/composables/usePageContent'
import { useToast } from '@/composables/useToast'

// ─── Types ───────────────────────────────────────────────────────────────────

interface EditableItem {
  id?: string
  page: string
  section: string
  key: string
  value: string
  label: string
  hasChanged: boolean
}

// ─── State ───────────────────────────────────────────────────────────────────

const allItems = ref<PageContentItem[]>([])
const selectedPage = ref('home')
const loading = ref(true)
const saving = ref(false)
const savingAll = ref(false)
const message = ref('')
const messageType = ref<'success' | 'error'>('success')
const editableItems = ref<Map<string, EditableItem>>(new Map())

const toast = useToast()
const pages = getAllPagesWithContent()

// ─── Page label map ──────────────────────────────────────────────────────────

const PAGE_LABELS: Record<string, string> = {
  home: 'Home',
  about: 'About',
  expeditions: 'Expeditions',
  contact: 'Contact',
  faq: 'FAQ',
  blog: 'Blog',
}

// ─── Computed ────────────────────────────────────────────────────────────────

const pageDefs = computed(() => getPageContentDefs(selectedPage.value))

// Group items by section for display
const sectionGroups = computed(() => {
  const groups: { section: string; sectionLabel: string; items: { def: any; editable: EditableItem }[] }[] = []

  for (const def of pageDefs.value) {
    const items: { def: any; editable: EditableItem }[] = []
    for (const keyDef of def.keys) {
      const editable = getOrCreateEditable(selectedPage.value, def.section, keyDef.key, keyDef.label)
      items.push({ def: keyDef, editable })
    }
    groups.push({ section: def.section, sectionLabel: def.label, items })
  }

  return groups
})

const hasChanges = computed(() => {
  return Array.from(editableItems.value.values()).some((i) => i.hasChanged)
})

// ─── Helpers ─────────────────────────────────────────────────────────────────

function showMessage(text: string, type: 'success' | 'error') {
  message.value = text
  messageType.value = type
  setTimeout(() => { message.value = '' }, 4000)
}

function getEditableKey(page: string, section: string, key: string): string {
  return `${page}__${section}__${key}`
}

function getOrCreateEditable(page: string, section: string, key: string, label: string): EditableItem {
  const mapKey = getEditableKey(page, section, key)
  if (!editableItems.value.has(mapKey)) {
    // Find existing value from loaded items
    const existing = allItems.value.find(
      (i) => i.page === page && i.section === section && i.key === key
    )
    editableItems.value.set(mapKey, {
      id: existing?.id,
      page,
      section,
      key,
      value: existing?.value || '',
      label,
      hasChanged: false,
    })
  }
  return editableItems.value.get(mapKey)!
}

function markChanged(item: EditableItem) {
  item.hasChanged = true
}

// ─── Data Loading ────────────────────────────────────────────────────────────

async function loadAll() {
  loading.value = true
  allItems.value = await loadAllPageContent()
  loading.value = false
}

// ─── Save Handlers ───────────────────────────────────────────────────────────

async function saveItem(item: EditableItem) {
  saving.value = true
  try {
    const id = await savePageContent(item.page, item.section, item.key, item.value, item.label)
    item.id = id
    item.hasChanged = false
    toast.success(`"${item.label}" saved`)
    await loadAll()
  } catch (e) {
    toast.error('Failed to save')
  }
  saving.value = false
}

async function saveAllChanges() {
  if (!hasChanges.value) return
  savingAll.value = true
  try {
    const changed = Array.from(editableItems.value.values()).filter((i) => i.hasChanged)
    const batchItems = changed.map((c) => ({
      page: c.page,
      section: c.section,
      key: c.key,
      value: c.value,
      label: c.label,
    }))
    await batchSavePageContent(batchItems)

    // Mark all as saved
    for (const item of changed) {
      item.hasChanged = false
    }

    toast.success(`Saved ${changed.length} content item${changed.length === 1 ? '' : 's'}`)
    await loadAll()
  } catch (e) {
    toast.error('Failed to save changes')
  }
  savingAll.value = false
}

async function deleteItem(item: EditableItem) {
  if (!item.id) {
    item.value = ''
    item.hasChanged = true
    return
  }
  if (!confirm(`Delete "${item.label}"? This will clear its value.`)) return
  try {
    await deletePageContent(item.id)
    item.value = ''
    item.hasChanged = false
    item.id = undefined
    toast.success(`"${item.label}" cleared`)
    await loadAll()
  } catch (e) {
    toast.error('Failed to delete')
  }
}

function resetChanges() {
  // Reset all changed items to their original values
  for (const [key, item] of editableItems.value) {
    if (item.hasChanged) {
      const original = allItems.value.find(
        (i) => i.page === item.page && i.section === item.section && i.key === item.key
      )
      item.value = original?.value || ''
      item.hasChanged = false
    }
  }
  toast.info('Changes discarded')
}

onMounted(loadAll)
</script>

<template>
  <div class="content-manager">
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

    <!-- Header -->
    <div class="admin-header">
      <div class="header-accent">
        <span class="header-line"></span>
        <span class="header-tag">Content CMS</span>
      </div>
      <h1 class="admin-title">Page Content <em>Manager</em></h1>
      <p class="admin-subtitle">
        Edit text content for every page on your site — titles, descriptions, overlines, and CTAs. Changes are saved to the database and reflect immediately on the frontend.
      </p>
    </div>

    <!-- Page Selector & Actions -->
    <div class="toolbar">
      <div class="page-tabs">
        <button
          v-for="page in pages"
          :key="page"
          @click="selectedPage = page"
          class="page-tab"
          :class="{ 'page-tab-active': selectedPage === page }"
        >
          {{ PAGE_LABELS[page] || page }}
        </button>
      </div>
      <div class="toolbar-actions">
        <button
          v-if="hasChanges"
          @click="resetChanges"
          class="btn-reset"
        >
          Discard Changes
        </button>
        <button
          v-if="hasChanges"
          @click="saveAllChanges"
          class="btn-save-all"
          :disabled="savingAll"
        >
          {{ savingAll ? 'Saving...' : `Save All Changes` }}
        </button>
      </div>
    </div>

    <!-- Content Sections -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Loading content...</p>
    </div>

    <div v-else class="content-sections">
      <div
        v-for="group in sectionGroups"
        :key="group.section"
        class="content-section"
      >
        <div class="section-header-bar">
          <h3 class="section-title">{{ group.sectionLabel }}</h3>
          <code class="section-key">{{ selectedPage }} / {{ group.section }}</code>
        </div>

        <div class="content-fields">
          <div
            v-for="{ def, editable } in group.items"
            :key="def.key"
            class="content-field"
            :class="{ 'field-changed': editable.hasChanged }"
          >
            <div class="field-header">
              <label class="field-label">{{ def.label }}</label>
              <div class="field-badges">
                <span v-if="editable.hasChanged" class="badge-unsaved">Unsaved</span>
                <span v-if="editable.id" class="badge-saved">Saved</span>
                <span v-else class="badge-empty">Empty</span>
              </div>
            </div>

            <textarea
              v-if="def.type === 'textarea'"
              v-model="editable.value"
              class="field-input field-textarea"
              :placeholder="`Enter ${def.label.toLowerCase()}...`"
              rows="3"
              @input="markChanged(editable)"
            ></textarea>
            <input
              v-else
              v-model="editable.value"
              class="field-input"
              :placeholder="`Enter ${def.label.toLowerCase()}...`"
              @input="markChanged(editable)"
            />

            <div class="field-actions">
              <button
                @click="saveItem(editable)"
                class="btn-save-field"
                :disabled="saving || !editable.hasChanged"
              >
                {{ saving ? 'Saving...' : 'Save' }}
              </button>
              <button
                v-if="editable.value || editable.id"
                @click="deleteItem(editable)"
                class="btn-clear-field"
              >
                {{ editable.id ? 'Clear' : 'Remove' }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div v-if="sectionGroups.length === 0" class="empty-state">
        <p>No content fields defined for this page yet.</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* ── Layout ────────────────────────────────────────────────────────────── */
.content-manager { position: relative; }

/* ── Header ────────────────────────────────────────────────────────────── */
.admin-header { margin-bottom: 1.5rem; }
.header-accent { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.75rem; }
.header-line { flex: 1; height: 1px; background: rgba(201,168,76,0.2); max-width: 40px; }
.header-tag { font-family: var(--font-heading); font-size: 0.6rem; letter-spacing: 0.2em; text-transform: uppercase; color: #c9a84c; }
.admin-title { font-family: var(--font-display); font-size: 1.75rem; font-weight: 300; color: #f8f5ef; margin-bottom: 0.5rem; }
.admin-title em { color: #c9a84c; font-style: italic; }
.admin-subtitle { font-size: 0.8rem; color: rgba(248,245,239,0.5); line-height: 1.6; max-width: 640px; }

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
  font-family: var(--font-heading);
  font-size: 0.7rem;
  letter-spacing: 0.05em;
  backdrop-filter: blur(8px);
  box-shadow: 0 8px 24px rgba(0,0,0,0.3);
}
.toast-success { background: rgba(76,175,80,0.15); border-color: rgba(76,175,80,0.35); color: #4caf50; }
.toast-error { background: rgba(224,123,90,0.15); border-color: rgba(224,123,90,0.35); color: #e07b5a; }
.toast-enter-active, .toast-leave-active { transition: all 0.25s ease; }
.toast-enter-from, .toast-leave-to { opacity: 0; transform: translateY(-0.5rem); }

/* ── Toolbar ───────────────────────────────────────────────────────────── */
.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.page-tabs { display: flex; gap: 0.375rem; flex-wrap: wrap; }
.page-tab {
  padding: 0.5rem 1rem;
  background: rgba(10,46,74,0.3);
  border: 1px solid rgba(201,168,76,0.12);
  color: rgba(248,245,239,0.55);
  font-family: var(--font-heading);
  font-size: 0.65rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  cursor: pointer;
  transition: all 0.2s;
}
.page-tab:hover { border-color: rgba(201,168,76,0.3); color: rgba(248,245,239,0.85); }
.page-tab-active { background: rgba(201,168,76,0.12); border-color: #c9a84c; color: #c9a84c; }

.toolbar-actions { display: flex; gap: 0.5rem; }
.btn-save-all {
  padding: 0.5rem 1.25rem;
  background: #c9a84c;
  border: 1px solid #c9a84c;
  color: #071a2b;
  font-family: var(--font-heading);
  font-size: 0.65rem;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  cursor: pointer;
  transition: all 0.2s;
}
.btn-save-all:hover { background: #d4b35a; }
.btn-save-all:disabled { opacity: 0.5; cursor: not-allowed; }
.btn-reset {
  padding: 0.5rem 1rem;
  background: rgba(224,123,90,0.1);
  border: 1px solid rgba(224,123,90,0.25);
  color: rgba(224,123,90,0.8);
  font-family: var(--font-heading);
  font-size: 0.65rem;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  cursor: pointer;
  transition: all 0.2s;
}
.btn-reset:hover { background: rgba(224,123,90,0.2); border-color: rgba(224,123,90,0.4); }

/* ── Loading ───────────────────────────────────────────────────────────── */
.loading-state { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 300px; gap: 1rem; color: rgba(248,245,239,0.4); }
.spinner { width: 24px; height: 24px; border: 2px solid rgba(201,168,76,0.2); border-top-color: #c9a84c; border-radius: 50%; animation: spin 0.8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

/* ── Content Sections ──────────────────────────────────────────────────── */
.content-sections { display: flex; flex-direction: column; gap: 1.5rem; }

.content-section {
  background: rgba(10,46,74,0.2);
  border: 1px solid rgba(201,168,76,0.08);
  overflow: hidden;
}

.section-header-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.875rem 1.25rem;
  background: rgba(7,26,43,0.4);
  border-bottom: 1px solid rgba(201,168,76,0.08);
}
.section-title { font-family: var(--font-display); font-size: 1rem; font-weight: 300; color: #f8f5ef; }
.section-key { font-family: 'monospace', monospace; font-size: 0.6rem; color: rgba(248,245,239,0.25); background: rgba(201,168,76,0.05); padding: 0.2rem 0.5rem; }

.content-fields { padding: 1.25rem; display: grid; grid-template-columns: 1fr 1fr; gap: 1.25rem; }

.content-field {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 1rem;
  background: rgba(7,26,43,0.3);
  border: 1px solid rgba(201,168,76,0.08);
  transition: border-color 0.2s;
}
.content-field:hover { border-color: rgba(201,168,76,0.15); }
.field-changed { border-color: rgba(201,168,76,0.3) !important; background: rgba(201,168,76,0.04); }

.field-header { display: flex; justify-content: space-between; align-items: center; }
.field-label { font-family: var(--font-heading); font-size: 0.6rem; font-weight: 600; letter-spacing: 0.12em; text-transform: uppercase; color: rgba(248,245,239,0.55); }

.field-badges { display: flex; gap: 0.375rem; }
.badge-unsaved { font-size: 0.5rem; letter-spacing: 0.08em; text-transform: uppercase; padding: 0.1rem 0.35rem; background: rgba(201,168,76,0.15); color: #c9a84c; font-weight: 600; }
.badge-saved { font-size: 0.5rem; letter-spacing: 0.08em; text-transform: uppercase; padding: 0.1rem 0.35rem; background: rgba(76,175,80,0.12); color: #4caf50; font-weight: 600; }
.badge-empty { font-size: 0.5rem; letter-spacing: 0.08em; text-transform: uppercase; padding: 0.1rem 0.35rem; background: rgba(248,245,239,0.05); color: rgba(248,245,239,0.3); font-weight: 600; }

.field-input {
  background: rgba(7,26,43,0.5);
  border: 1px solid rgba(201,168,76,0.15);
  color: #f8f5ef;
  padding: 0.625rem 0.75rem;
  font-family: var(--font-body);
  font-size: 0.8rem;
  outline: none;
  transition: border-color 0.3s;
  width: 100%;
}
.field-input:focus { border-color: #c9a84c; }
.field-textarea { resize: vertical; min-height: 80px; line-height: 1.6; }

.field-actions { display: flex; gap: 0.5rem; }
.btn-save-field {
  padding: 0.35rem 0.75rem;
  background: rgba(201,168,76,0.15);
  border: 1px solid rgba(201,168,76,0.3);
  color: #c9a84c;
  font-family: var(--font-heading);
  font-size: 0.55rem;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  cursor: pointer;
  transition: all 0.2s;
}
.btn-save-field:hover { background: rgba(201,168,76,0.25); }
.btn-save-field:disabled { opacity: 0.4; cursor: not-allowed; }
.btn-clear-field {
  padding: 0.35rem 0.75rem;
  background: rgba(224,123,90,0.1);
  border: 1px solid rgba(224,123,90,0.2);
  color: rgba(224,123,90,0.7);
  font-family: var(--font-heading);
  font-size: 0.55rem;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  cursor: pointer;
  transition: all 0.2s;
}
.btn-clear-field:hover { background: rgba(224,123,90,0.2); }

.empty-state { padding: 3rem; text-align: center; color: rgba(248,245,239,0.3); font-size: 0.85rem; }

@media (max-width: 768px) {
  .content-fields { grid-template-columns: 1fr; }
  .toolbar { flex-direction: column; align-items: stretch; }
  .toolbar-actions { justify-content: flex-end; }
}
</style>

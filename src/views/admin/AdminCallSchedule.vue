<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useCallScheduler, type CallBooking, type WeekSchedule } from '@/composables/useCallScheduler'

const {
  getSchedule, saveSchedule, getAllBookings, updateBookingStatus,
  formatTime, formatDate, DEFAULT_SCHEDULE, buildDefaultSlots,
} = useCallScheduler()

// ── Schedule ─────────────────────────────────────────────────────────────────
const schedule = ref<WeekSchedule>({ ...DEFAULT_SCHEDULE })
const scheduleLoading = ref(true)
const scheduleSaving = ref(false)
const scheduleSaved = ref(false)

const DAY_LABELS: Record<string, string> = {
  mon: 'Monday', tue: 'Tuesday', wed: 'Wednesday',
  thu: 'Thursday', fri: 'Friday', sat: 'Saturday', sun: 'Sunday',
}
const DAY_ORDER = ['mon','tue','wed','thu','fri','sat','sun']

async function loadSchedule() {
  scheduleLoading.value = true
  schedule.value = await getSchedule()
  scheduleLoading.value = false
}

function resetDay(key: string) {
  schedule.value[key].slots = buildDefaultSlots()
}

function toggleSlot(dayKey: string, slot: string) {
  const slots = schedule.value[dayKey].slots
  const idx = slots.indexOf(slot)
  if (idx >= 0) slots.splice(idx, 1)
  else slots.push(slot)
}

function addBlockedDate(dayKey: string, date: string) {
  if (!date) return
  const bd = schedule.value[dayKey].blockedDates
  if (!bd.includes(date)) bd.push(date)
}

function removeBlockedDate(dayKey: string, date: string) {
  const bd = schedule.value[dayKey].blockedDates
  const i = bd.indexOf(date)
  if (i >= 0) bd.splice(i, 1)
}

const newBlockedDate = ref<Record<string, string>>({})

async function saveScheduleData() {
  scheduleSaving.value = true
  await saveSchedule(schedule.value)
  scheduleSaving.value = false
  scheduleSaved.value = true
  setTimeout(() => { scheduleSaved.value = false }, 2500)
}

// ── Bookings ──────────────────────────────────────────────────────────────────
const bookings = ref<CallBooking[]>([])
const bookingsLoading = ref(true)
const statusFilter = ref<'all' | 'pending' | 'confirmed' | 'cancelled'>('all')
const updatingId = ref<string | null>(null)

async function loadBookings() {
  bookingsLoading.value = true
  const all = await getAllBookings()
  bookings.value = all.sort((a, b) => {
    const da = new Date(`${a.date}T${a.time}`)
    const db2 = new Date(`${b.date}T${b.time}`)
    return db2.getTime() - da.getTime()
  })
  bookingsLoading.value = false
}

const filteredBookings = computed(() =>
  statusFilter.value === 'all'
    ? bookings.value
    : bookings.value.filter(b => b.status === statusFilter.value)
)

async function changeStatus(id: string, status: CallBooking['status']) {
  updatingId.value = id
  const ok = await updateBookingStatus(id, status)
  if (ok) {
    const b = bookings.value.find(x => x.id === id)
    if (b) b.status = status
  }
  updatingId.value = null
}

// ── Tab ───────────────────────────────────────────────────────────────────────
const activeTab = ref<'bookings' | 'schedule'>('bookings')

onMounted(async () => {
  await Promise.all([loadSchedule(), loadBookings()])
})

function statusColor(status: string) {
  if (status === 'confirmed') return 'status-confirmed'
  if (status === 'cancelled') return 'status-cancelled'
  return 'status-pending'
}

// All possible 20-min slots for display
const allSlots = buildDefaultSlots()
</script>

<template>
  <div class="acs-page">
    <div class="acs-header">
      <h1 class="acs-title">Call Scheduler</h1>
      <div class="acs-tabs">
        <button class="tab-btn" :class="{ active: activeTab === 'bookings' }" @click="activeTab = 'bookings'">
          Bookings
          <span class="tab-badge">{{ bookings.filter(b => b.status === 'pending').length }}</span>
        </button>
        <button class="tab-btn" :class="{ active: activeTab === 'schedule' }" @click="activeTab = 'schedule'">
          Availability
        </button>
      </div>
    </div>

    <!-- ── BOOKINGS TAB ──────────────────────────────────────────────────────── -->
    <div v-if="activeTab === 'bookings'" class="tab-content">
      <div class="bookings-toolbar">
        <div class="filter-chips">
          <button v-for="f in ['all','pending','confirmed','cancelled']" :key="f"
            class="filter-chip" :class="{ active: statusFilter === f }"
            @click="statusFilter = f as any">
            {{ f.charAt(0).toUpperCase() + f.slice(1) }}
          </button>
        </div>
        <button class="refresh-btn" @click="loadBookings">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/>
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
          </svg>
          Refresh
        </button>
      </div>

      <div v-if="bookingsLoading" class="loading-state">Loading bookings…</div>
      <div v-else-if="filteredBookings.length === 0" class="empty-state">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.3">
          <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
        </svg>
        <p>No {{ statusFilter === 'all' ? '' : statusFilter }} bookings.</p>
      </div>
      <div v-else class="bookings-list">
        <div v-for="b in filteredBookings" :key="b.id" class="booking-card">
          <div class="booking-top">
            <div class="booking-info">
              <div class="booking-name">{{ b.name }}</div>
              <div class="booking-contact">
                <span>{{ b.email }}</span>
                <span class="dot">·</span>
                <span>{{ b.phone }}</span>
              </div>
            </div>
            <span class="status-badge" :class="statusColor(b.status)">{{ b.status }}</span>
          </div>
          <div class="booking-meta">
            <span class="meta-chip">{{ b.expedition }}</span>
            <span class="meta-chip">📅 {{ formatDate(b.date) }}</span>
            <span class="meta-chip">🕐 {{ formatTime(b.time) }} AWST</span>
          </div>
          <div v-if="b.message" class="booking-message">"{{ b.message }}"</div>
          <div class="booking-actions">
            <button v-if="b.status !== 'confirmed'" class="action-btn confirm"
              :disabled="updatingId === b.id" @click="changeStatus(b.id!, 'confirmed')">
              ✓ Confirm
            </button>
            <button v-if="b.status !== 'cancelled'" class="action-btn cancel"
              :disabled="updatingId === b.id" @click="changeStatus(b.id!, 'cancelled')">
              ✕ Cancel
            </button>
            <button v-if="b.status === 'cancelled'" class="action-btn restore"
              :disabled="updatingId === b.id" @click="changeStatus(b.id!, 'pending')">
              ↩ Restore
            </button>
            <span class="booking-ref">{{ b.id?.slice(-6).toUpperCase() }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- ── SCHEDULE TAB ──────────────────────────────────────────────────────── -->
    <div v-if="activeTab === 'schedule'" class="tab-content">
      <div v-if="scheduleLoading" class="loading-state">Loading schedule…</div>
      <div v-else class="schedule-grid">
        <div v-for="dayKey in DAY_ORDER" :key="dayKey" class="day-card" :class="{ disabled: !schedule[dayKey].enabled }">
          <div class="day-header">
            <div class="day-toggle">
              <label class="toggle-switch">
                <input type="checkbox" v-model="schedule[dayKey].enabled"/>
                <span class="toggle-track"></span>
              </label>
              <span class="day-name">{{ DAY_LABELS[dayKey] }}</span>
            </div>
            <button v-if="schedule[dayKey].enabled" class="reset-btn" @click="resetDay(dayKey)" title="Reset to default slots">Reset</button>
          </div>

          <template v-if="schedule[dayKey].enabled">
            <!-- Time slots -->
            <p class="section-label">Available Slots</p>
            <div class="slot-picker">
              <button v-for="slot in allSlots" :key="slot"
                class="slot-toggle"
                :class="{ on: schedule[dayKey].slots.includes(slot) }"
                @click="toggleSlot(dayKey, slot)">
                {{ formatTime(slot) }}
              </button>
            </div>

            <!-- Blocked dates -->
            <p class="section-label" style="margin-top: 0.75rem;">Blocked Dates</p>
            <div class="blocked-dates">
              <div v-for="d in schedule[dayKey].blockedDates" :key="d" class="blocked-chip">
                {{ d }}
                <button class="remove-date" @click="removeBlockedDate(dayKey, d)">×</button>
              </div>
              <div v-if="!schedule[dayKey].blockedDates.length" class="no-blocked">None blocked</div>
            </div>
            <div class="add-date-row">
              <input type="date" v-model="newBlockedDate[dayKey]" class="date-input" />
              <button class="add-date-btn" @click="addBlockedDate(dayKey, newBlockedDate[dayKey]); newBlockedDate[dayKey] = ''">
                Block
              </button>
            </div>
          </template>
          <p v-else class="day-off-label">Day off — not bookable</p>
        </div>

        <div class="save-row">
          <button class="save-btn" :disabled="scheduleSaving" @click="saveScheduleData">
            <span v-if="scheduleSaving">Saving…</span>
            <span v-else-if="scheduleSaved">✓ Saved!</span>
            <span v-else>Save Availability</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.acs-page { max-width: 860px; margin: 0 auto; padding: 1.5rem; }
.acs-header { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 1rem; margin-bottom: 1.5rem; }
.acs-title { font-size: 1.4rem; font-weight: 800; color: var(--color-text, #fff); margin: 0; }

.acs-tabs { display: flex; gap: 0.4rem; background: rgba(255,255,255,.05); border-radius: 0.6rem; padding: 3px; }
.tab-btn { display: flex; align-items: center; gap: 0.4rem; padding: 0.45rem 1rem; border: none; border-radius: 0.45rem; cursor: pointer; font-size: 0.8rem; font-weight: 600; color: rgba(255,255,255,.5); background: transparent; transition: background .2s, color .2s; }
.tab-btn.active { background: var(--color-gold-400, #c9a84c); color: #071a2b; }
.tab-badge { background: rgba(255,255,255,.15); color: inherit; border-radius: 99px; padding: 0.05rem 0.4rem; font-size: 0.65rem; font-weight: 700; }
.tab-btn.active .tab-badge { background: rgba(7,26,43,.25); }

.tab-content { animation: fade-in .2s ease; }
@keyframes fade-in { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; } }

/* Bookings */
.bookings-toolbar { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 1rem; }
.filter-chips { display: flex; gap: 0.35rem; }
.filter-chip { padding: 0.3rem 0.75rem; border: 1px solid rgba(255,255,255,.12); border-radius: 99px; background: transparent; color: rgba(255,255,255,.5); font-size: 0.73rem; font-weight: 600; cursor: pointer; transition: background .2s, border-color .2s, color .2s; }
.filter-chip.active { background: rgba(201,168,76,.15); border-color: var(--color-gold-400, #c9a84c); color: var(--color-gold-400, #c9a84c); }
.refresh-btn { display: flex; align-items: center; gap: 0.35rem; padding: 0.35rem 0.8rem; border: 1px solid rgba(255,255,255,.1); border-radius: 0.4rem; background: transparent; color: rgba(255,255,255,.45); font-size: 0.73rem; cursor: pointer; transition: background .2s, color .2s; }
.refresh-btn:hover { background: rgba(255,255,255,.07); color: rgba(255,255,255,.7); }

.loading-state, .empty-state { text-align: center; padding: 3rem 1rem; color: rgba(255,255,255,.3); font-size: 0.85rem; }
.empty-state svg { display: block; margin: 0 auto 0.75rem; }

.bookings-list { display: flex; flex-direction: column; gap: 0.75rem; }
.booking-card { background: rgba(255,255,255,.04); border: 1px solid rgba(255,255,255,.09); border-radius: 0.85rem; padding: 1rem 1.1rem; }
.booking-top { display: flex; align-items: flex-start; justify-content: space-between; gap: 1rem; margin-bottom: 0.6rem; }
.booking-name { font-size: 0.92rem; font-weight: 700; color: #fff; }
.booking-contact { font-size: 0.73rem; color: rgba(255,255,255,.45); margin-top: 0.15rem; display: flex; gap: 0.3rem; flex-wrap: wrap; }
.dot { opacity: 0.4; }
.status-badge { padding: 0.2rem 0.6rem; border-radius: 99px; font-size: 0.65rem; font-weight: 700; text-transform: uppercase; letter-spacing: .05em; flex-shrink: 0; }
.status-pending   { background: rgba(251,191,36,.15); color: #fbbf24; }
.status-confirmed { background: rgba(52,211,153,.15); color: #34d399; }
.status-cancelled { background: rgba(248,113,113,.15); color: #f87171; }
.booking-meta { display: flex; flex-wrap: wrap; gap: 0.35rem; margin-bottom: 0.5rem; }
.meta-chip { background: rgba(255,255,255,.07); border-radius: 0.35rem; padding: 0.2rem 0.55rem; font-size: 0.7rem; color: rgba(255,255,255,.55); }
.booking-message { font-size: 0.75rem; color: rgba(255,255,255,.35); font-style: italic; margin-bottom: 0.6rem; border-left: 2px solid rgba(201,168,76,.2); padding-left: 0.6rem; }
.booking-actions { display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; }
.action-btn { padding: 0.3rem 0.75rem; border: none; border-radius: 0.4rem; font-size: 0.72rem; font-weight: 700; cursor: pointer; transition: opacity .2s; }
.action-btn:disabled { opacity: .45; cursor: not-allowed; }
.action-btn.confirm  { background: rgba(52,211,153,.15); color: #34d399; }
.action-btn.confirm:hover:not(:disabled) { background: rgba(52,211,153,.25); }
.action-btn.cancel   { background: rgba(248,113,113,.12); color: #f87171; }
.action-btn.cancel:hover:not(:disabled) { background: rgba(248,113,113,.22); }
.action-btn.restore  { background: rgba(255,255,255,.08); color: rgba(255,255,255,.5); }
.booking-ref { margin-left: auto; font-size: 0.65rem; color: rgba(255,255,255,.2); font-family: monospace; }

/* Schedule */
.schedule-grid { display: flex; flex-direction: column; gap: 0.85rem; }
.day-card { background: rgba(255,255,255,.04); border: 1px solid rgba(255,255,255,.08); border-radius: 0.85rem; padding: 1rem 1.15rem; transition: border-color .2s; }
.day-card.disabled { opacity: .55; }
.day-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.75rem; }
.day-toggle { display: flex; align-items: center; gap: 0.6rem; }
.day-name { font-size: 0.88rem; font-weight: 700; color: #fff; }
.toggle-switch { position: relative; display: inline-block; width: 36px; height: 20px; }
.toggle-switch input { opacity: 0; width: 0; height: 0; }
.toggle-track { position: absolute; inset: 0; background: rgba(255,255,255,.15); border-radius: 99px; cursor: pointer; transition: background .25s; }
.toggle-switch input:checked + .toggle-track { background: var(--color-gold-400, #c9a84c); }
.toggle-track::after { content: ''; position: absolute; top: 2px; left: 2px; width: 16px; height: 16px; background: #fff; border-radius: 50%; transition: transform .25s; }
.toggle-switch input:checked + .toggle-track::after { transform: translateX(16px); }
.reset-btn { font-size: 0.68rem; color: rgba(255,255,255,.3); background: transparent; border: 1px solid rgba(255,255,255,.1); border-radius: 0.35rem; padding: 0.2rem 0.55rem; cursor: pointer; transition: color .2s, border-color .2s; }
.reset-btn:hover { color: rgba(255,255,255,.65); border-color: rgba(255,255,255,.2); }

.section-label { font-size: 0.65rem; font-weight: 700; color: rgba(255,255,255,.3); letter-spacing: .07em; text-transform: uppercase; margin: 0 0 0.4rem; }
.slot-picker { display: grid; grid-template-columns: repeat(auto-fill, minmax(80px, 1fr)); gap: 0.3rem; }
.slot-toggle { padding: 0.3rem 0.2rem; font-size: 0.68rem; font-weight: 600; text-align: center; border: 1px solid rgba(255,255,255,.08); border-radius: 0.35rem; background: rgba(255,255,255,.03); color: rgba(255,255,255,.3); cursor: pointer; transition: background .15s, border-color .15s, color .15s; }
.slot-toggle.on { background: rgba(201,168,76,.15); border-color: rgba(201,168,76,.35); color: var(--color-gold-400, #c9a84c); }
.slot-toggle:hover { border-color: rgba(201,168,76,.3); color: rgba(255,255,255,.6); }

.blocked-dates { display: flex; flex-wrap: wrap; gap: 0.35rem; min-height: 1.5rem; }
.blocked-chip { display: flex; align-items: center; gap: 0.3rem; background: rgba(248,113,113,.1); border: 1px solid rgba(248,113,113,.2); border-radius: 99px; padding: 0.18rem 0.55rem; font-size: 0.7rem; color: #f87171; }
.remove-date { background: transparent; border: none; color: inherit; cursor: pointer; font-size: 0.85rem; line-height: 1; padding: 0; }
.no-blocked { font-size: 0.72rem; color: rgba(255,255,255,.2); font-style: italic; }
.add-date-row { display: flex; gap: 0.4rem; margin-top: 0.5rem; }
.date-input { background: rgba(255,255,255,.06); border: 1px solid rgba(255,255,255,.1); border-radius: 0.4rem; padding: 0.3rem 0.55rem; color: #fff; font-size: 0.75rem; font-family: inherit; flex: 1; }
.date-input:focus { outline: none; border-color: var(--color-gold-400, #c9a84c); }
.add-date-btn { background: rgba(248,113,113,.15); border: 1px solid rgba(248,113,113,.25); border-radius: 0.4rem; color: #f87171; font-size: 0.72rem; font-weight: 700; padding: 0.3rem 0.7rem; cursor: pointer; transition: background .2s; }
.add-date-btn:hover { background: rgba(248,113,113,.25); }
.day-off-label { font-size: 0.78rem; color: rgba(255,255,255,.25); font-style: italic; margin: 0; }

.save-row { display: flex; justify-content: flex-end; padding-top: 0.5rem; }
.save-btn { padding: 0.65rem 1.75rem; background: var(--color-gold-400, #c9a84c); color: #071a2b; border: none; border-radius: 0.6rem; font-size: 0.85rem; font-weight: 800; cursor: pointer; transition: background .2s, transform .15s; }
.save-btn:hover:not(:disabled) { background: var(--color-gold-300, #e8c05a); transform: translateY(-1px); }
.save-btn:disabled { opacity: .5; cursor: not-allowed; }
</style>

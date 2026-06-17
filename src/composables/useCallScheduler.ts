// src/composables/useCallScheduler.ts
import { ref } from 'vue'
import {
  collection,
  addDoc,
  getDocs,
  doc,
  setDoc,
  getDoc,
  query,
  where,
  Timestamp,
} from 'firebase/firestore'
import { getFirebaseDb } from '@/lib/firebase'

export type ExpeditionType = 'Dive Expedition' | 'Ocean Safari'

export interface CallBooking {
  id?: string
  name: string
  email: string
  phone: string
  expedition: ExpeditionType
  message: string
  date: string       // YYYY-MM-DD
  time: string       // HH:MM (24h)
  status: 'pending' | 'confirmed' | 'cancelled'
  createdAt: string
}

export interface DaySchedule {
  enabled: boolean
  slots: string[]    // ['09:00', '09:20', ...]
  blockedDates: string[]
}

export type WeekSchedule = Record<string, DaySchedule> // key = 'mon'|'tue'|...

// ─── Default availability (weekdays, 9 AM–5 PM, every 20 min) ───────────────
function buildDefaultSlots(): string[] {
  const slots: string[] = []
  for (let h = 9; h < 17; h++) {
    for (let m = 0; m < 60; m += 20) {
      slots.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`)
    }
  }
  return slots
}

const DEFAULT_SCHEDULE: WeekSchedule = {
  mon: { enabled: true,  slots: buildDefaultSlots(), blockedDates: [] },
  tue: { enabled: true,  slots: buildDefaultSlots(), blockedDates: [] },
  wed: { enabled: true,  slots: buildDefaultSlots(), blockedDates: [] },
  thu: { enabled: true,  slots: buildDefaultSlots(), blockedDates: [] },
  fri: { enabled: true,  slots: buildDefaultSlots(), blockedDates: [] },
  sat: { enabled: false, slots: [], blockedDates: [] },
  sun: { enabled: false, slots: [], blockedDates: [] },
}

const DAY_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']

export function useCallScheduler() {
  const loading = ref(false)
  const error = ref<string | null>(null)

  function db() {
    return getFirebaseDb()
  }

  // ── Schedule ──────────────────────────────────────────────────────────────

  async function getSchedule(): Promise<WeekSchedule> {
    try {
      const snap = await getDoc(doc(db(), 'callSchedule', 'availability'))
      if (snap.exists()) return snap.data() as WeekSchedule
      return DEFAULT_SCHEDULE
    } catch (e) {
      console.error('getSchedule error', e)
      return DEFAULT_SCHEDULE
    }
  }

  async function saveSchedule(schedule: WeekSchedule): Promise<boolean> {
    try {
      await setDoc(doc(db(), 'callSchedule', 'availability'), schedule)
      return true
    } catch (e) {
      console.error('saveSchedule error', e)
      return false
    }
  }

  // ── Bookings ──────────────────────────────────────────────────────────────

  async function getBookedSlots(date: string): Promise<string[]> {
    try {
      const q = query(
        collection(db(), 'callBookings'),
        where('date', '==', date),
        where('status', '!=', 'cancelled'),
      )
      const snap = await getDocs(q)
      return snap.docs.map(d => d.data().time as string)
    } catch {
      return []
    }
  }

  async function getAvailableSlots(date: string): Promise<string[]> {
    const d = new Date(date + 'T00:00:00')
    const dayKey = DAY_KEYS[d.getDay()]
    const schedule = await getSchedule()
    const day = schedule[dayKey]
    if (!day?.enabled) return []
    if (day.blockedDates?.includes(date)) return []

    const booked = await getBookedSlots(date)
    return day.slots.filter(s => !booked.includes(s))
  }

  async function createBooking(booking: Omit<CallBooking, 'id' | 'status' | 'createdAt'>): Promise<{ ok: boolean; id?: string; error?: string }> {
    loading.value = true
    error.value = null
    try {
      // Double-check slot is still free
      const booked = await getBookedSlots(booking.date)
      if (booked.includes(booking.time)) {
        return { ok: false, error: 'This slot was just taken. Please pick another time.' }
      }

      const ref = await addDoc(collection(db(), 'callBookings'), {
        ...booking,
        status: 'pending',
        createdAt: new Date().toISOString(),
      })
      return { ok: true, id: ref.id }
    } catch (e: any) {
      error.value = e?.message || 'Failed to save booking'
      return { ok: false, error: error.value! }
    } finally {
      loading.value = false
    }
  }

  async function getAllBookings(): Promise<CallBooking[]> {
    try {
      const snap = await getDocs(collection(db(), 'callBookings'))
      return snap.docs.map(d => ({ id: d.id, ...d.data() } as CallBooking))
    } catch {
      return []
    }
  }

  async function updateBookingStatus(id: string, status: CallBooking['status']): Promise<boolean> {
    try {
      await setDoc(doc(db(), 'callBookings', id), { status }, { merge: true })
      return true
    } catch {
      return false
    }
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  function formatTime(t: string) {
    const [h, m] = t.split(':').map(Number)
    const period = h >= 12 ? 'PM' : 'AM'
    const hour = h % 12 || 12
    return `${hour}:${String(m).padStart(2, '0')} ${period}`
  }

  function formatDate(d: string) {
    return new Date(d + 'T00:00:00').toLocaleDateString('en-AU', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    })
  }

  return {
    loading,
    error,
    getSchedule,
    saveSchedule,
    getAvailableSlots,
    createBooking,
    getAllBookings,
    updateBookingStatus,
    formatTime,
    formatDate,
    DEFAULT_SCHEDULE,
    DAY_KEYS,
    buildDefaultSlots,
  }
}

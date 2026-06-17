<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { getFirebaseDb, initFirebase } from '@/lib/firebase'
import { collection, getDocs, query, orderBy, limit, where } from 'firebase/firestore'

const stats = ref([
  { label: 'Sections', value: 0, icon: 'images' },
  { label: 'Trips', value: 0, icon: 'trips' },
  { label: 'Blog Posts', value: 0, icon: 'blog' },
  { label: 'Users', value: 0, icon: 'users' },
  { label: 'Bookings', value: 0, icon: 'bookings' },
])

const recentActivity = ref<any[]>([])
const recentBookings = ref<any[]>([])
const isLoading = ref(true)

onMounted(async () => {
  initFirebase()

  try {
    const db = getFirebaseDb()

    const [sectionsSnap, tripsSnap, blogsSnap, usersSnap, bookingsSnap] = await Promise.all([
      getDocs(collection(db, 'cms_sections')),
      getDocs(collection(db, 'cms_trips')),
      getDocs(query(collection(db, 'cms_blogs'), where('isPublished', '==', true))),
      getDocs(collection(db, 'users')),
      getDocs(collection(db, 'bookings')),
    ])

    stats.value[0].value = sectionsSnap.size
    stats.value[1].value = tripsSnap.size
    stats.value[2].value = blogsSnap.size
    stats.value[3].value = usersSnap.size
    stats.value[4].value = bookingsSnap.size

    // Recent uploads
    const recentSnap = await getDocs(query(collection(db, 'cms_section_images'), orderBy('createdAt', 'desc'), limit(6)))
    recentActivity.value = recentSnap.docs.map(d => ({ id: d.id, ...d.data() }))

    // Recent bookings
    const bookingsRecentSnap = await getDocs(query(collection(db, 'bookings'), orderBy('createdAt', 'desc'), limit(6)))
    recentBookings.value = bookingsRecentSnap.docs.map(d => ({ id: d.id, ...d.data() }))
  } catch (e) {
    console.warn('Firebase unavailable, dashboard stats will show 0:', e)
  } finally {
    isLoading.value = false
  }
})

function formatDate(timestamp: any): string {
  if (!timestamp) return ''
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function formatDateTime(timestamp: any): string {
  if (!timestamp) return ''
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const iconPaths: Record<string, string> = {
  images: 'M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z',
  trips: 'M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5',
  blog: 'M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z',
  users: 'M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5z',
  bookings: 'M19 3h-1V1h-2v2H8V1H6v2H5c-1.1 0-2 .9-2 2v14a2 2 0 0 0 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM9 10H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2z',
}

const statusColors: Record<string, string> = {
  pending: 'status-pending',
  confirmed: 'status-confirmed',
  cancelled: 'status-cancelled',
}

const statusLabels: Record<string, string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  cancelled: 'Cancelled',
}

const quickActions = [
  { to: '/admin/sections', label: 'Manage Images', icon: 'gallery' },
  { to: '/admin/trips', label: 'Edit Trips', icon: 'compass' },
  { to: '/admin/bookings', label: 'View Bookings', icon: 'calendar' },
  { to: '/admin/blogs', label: 'Write Blog Post', icon: 'pen' },
  { to: '/admin/users', label: 'Manage Users', icon: 'crown' },
  { to: '/admin/settings', label: 'Settings', icon: 'gear' },
]
</script>

<template>
  <div class="dashboard">
    <!-- Page Header -->
    <header class="page-header">
      <div class="header-accent"></div>
      <div class="header-content">
        <h1 class="page-title">Dashboard</h1>
        <p class="page-subtitle">Overview of your luxury travel platform</p>
      </div>
      <div class="header-line"></div>
    </header>

    <!-- Stats Grid -->
    <section class="stats-section">
      <div class="stats-grid">
        <div
          v-for="(stat, index) in stats"
          :key="stat.label"
          class="stat-card"
          :class="{ 'loading': isLoading }"
          :style="{ animationDelay: `${index * 80}ms` }"
        >
          <div class="stat-card-inner">
            <div class="stat-icon-wrap">
              <div class="stat-icon-bg"></div>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">
                <path :d="iconPaths[stat.icon]"/>
              </svg>
            </div>
            <div class="stat-info">
              <p class="stat-value">{{ isLoading ? '—' : stat.value }}</p>
              <p class="stat-label">{{ stat.label }}</p>
            </div>
            <div class="stat-shimmer"></div>
          </div>
        </div>
      </div>
    </section>

    <!-- Quick Actions -->
    <section class="quick-actions">
      <div class="section-header">
        <div class="section-accent"></div>
        <h2 class="section-title">Quick Actions</h2>
      </div>
      <div class="actions-grid">
        <router-link
          v-for="(action, index) in quickActions"
          :key="action.label"
          :to="action.to"
          class="action-card"
          :style="{ animationDelay: `${index * 60}ms` }"
        >
          <div class="action-icon-wrap">
            <svg v-if="action.icon === 'gallery'" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="0"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/>
            </svg>
            <svg v-else-if="action.icon === 'compass'" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/>
            </svg>
            <svg v-else-if="action.icon === 'calendar'" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="0" ry="0"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
            <svg v-else-if="action.icon === 'pen'" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
            <svg v-else-if="action.icon === 'crown'" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">
              <path d="M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14"/>
            </svg>
            <svg v-else-if="action.icon === 'gear'" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
            </svg>
          </div>
          <span class="action-label">{{ action.label }}</span>
          <svg class="action-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M5 12h14M12 5l7 7-7 7"/>
          </svg>
        </router-link>
      </div>
    </section>

    <!-- Two Column Layout -->
    <div class="two-column">
      <!-- Recent Bookings -->
      <section class="panel recent-bookings-panel">
        <div class="section-header">
          <div class="section-accent"></div>
          <h2 class="section-title">Recent Bookings</h2>
        </div>
        <div v-if="recentBookings.length === 0" class="empty-state">
          <div class="empty-icon">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="0"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
          </div>
          <p class="empty-title">No bookings yet</p>
          <p class="empty-desc">Bookings will appear here when customers submit requests.</p>
        </div>
        <div v-else class="bookings-list">
          <div
            v-for="(booking, index) in recentBookings"
            :key="booking.id"
            class="booking-item"
            :style="{ animationDelay: `${index * 70}ms` }"
          >
            <div class="booking-avatar">
              <span>{{ booking.fullName ? booking.fullName.charAt(0).toUpperCase() : '?' }}</span>
            </div>
            <div class="booking-info">
              <p class="booking-name">{{ booking.fullName }}</p>
              <p class="booking-trip">{{ booking.tripName }}</p>
            </div>
            <div class="booking-meta">
              <span class="booking-status" :class="statusColors[booking.status]">
                {{ statusLabels[booking.status] || booking.status }}
              </span>
              <span class="booking-date">{{ formatDate(booking.createdAt) }}</span>
            </div>
          </div>
        </div>
      </section>

      <!-- Recent Uploads -->
      <section class="panel recent-uploads-panel">
        <div class="section-header">
          <div class="section-accent"></div>
          <h2 class="section-title">Recent Uploads</h2>
        </div>
        <div v-if="recentActivity.length === 0" class="empty-state">
          <div class="empty-icon">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="0"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/>
            </svg>
          </div>
          <p class="empty-title">No images uploaded yet</p>
          <p class="empty-desc">Go to Section Images to start uploading content.</p>
        </div>
        <div v-else class="uploads-list">
          <div
            v-for="(item, index) in recentActivity"
            :key="item.id"
            class="upload-item"
            :style="{ animationDelay: `${index * 70}ms` }"
          >
            <div class="upload-thumb-wrap">
              <img :src="item.imageUrl" :alt="item.altText" class="upload-thumb" />
              <div class="upload-thumb-overlay"></div>
            </div>
            <div class="upload-info">
              <p class="upload-label">{{ item.sectionLabel || item.sectionKey || 'Unknown' }}</p>
              <p class="upload-date">{{ formatDateTime(item.createdAt) }}</p>
            </div>
            <div class="upload-arrow">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </div>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
/* ─── Base & Reset ─── */
.dashboard {
  max-width: 1440px;
  margin: 0 auto;
  padding: 2.5rem 2rem;
  color: #f8f5ef;
}

/* ─── Page Header ─── */
.page-header {
  position: relative;
  margin-bottom: 3rem;
  padding-bottom: 1.5rem;
}

.header-accent {
  position: absolute;
  top: -2.5rem;
  left: -2rem;
  width: 60px;
  height: 2px;
  background: #c9a84c;
}

.header-content {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.page-title {
  font-family: 'Cormorant Garamond', 'Playfair Display', serif;
  font-size: 2.5rem;
  font-weight: 300;
  letter-spacing: 0.02em;
  color: #f8f5ef;
  margin: 0;
  line-height: 1.1;
}

.page-subtitle {
  font-family: 'Montserrat', sans-serif;
  font-size: 0.75rem;
  font-weight: 400;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: rgba(201, 168, 76, 0.6);
  margin: 0;
}

.header-line {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 1px;
  background: rgba(201, 168, 76, 0.12);
}

/* ─── Section Header ─── */
.section-header {
  display: flex;
  align-items: center;
  gap: 0.875rem;
  margin-bottom: 1.5rem;
}

.section-accent {
  width: 24px;
  height: 1px;
  background: #c9a84c;
  flex-shrink: 0;
}

.section-title {
  font-family: 'Cormorant Garamond', 'Playfair Display', serif;
  font-size: 1.125rem;
  font-weight: 400;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: rgba(248, 245, 239, 0.85);
  margin: 0;
}

/* ─── Stats Section ─── */
.stats-section {
  margin-bottom: 3rem;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 1.25rem;
}

.stat-card {
  position: relative;
  background: rgba(10, 46, 74, 0.35);
  border: 1px solid rgba(201, 168, 76, 0.1);
  overflow: hidden;
  opacity: 0;
  animation: fadeSlideUp 0.6s ease forwards;
}

.stat-card.loading .stat-value {
  color: rgba(201, 168, 76, 0.3);
}

.stat-card-inner {
  position: relative;
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.5rem 1.25rem;
  z-index: 1;
}

.stat-icon-wrap {
  position: relative;
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: #c9a84c;
}

.stat-icon-bg {
  position: absolute;
  inset: 0;
  border: 1px solid rgba(201, 168, 76, 0.18);
  background: rgba(201, 168, 76, 0.06);
}

.stat-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.stat-value {
  font-family: 'Cormorant Garamond', 'Playfair Display', serif;
  font-size: 2rem;
  font-weight: 300;
  color: #c9a84c;
  line-height: 1;
  margin: 0;
  transition: color 0.3s ease;
}

.stat-label {
  font-family: 'Montserrat', sans-serif;
  font-size: 0.55rem;
  font-weight: 500;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: rgba(248, 245, 239, 0.4);
  margin: 0;
}

.stat-shimmer {
  position: absolute;
  top: 0;
  left: -100%;
  width: 50%;
  height: 100%;
  background: rgba(201, 168, 76, 0.03);
  transform: skewX(-20deg);
  transition: left 0.6s ease;
}

.stat-card:hover .stat-shimmer {
  left: 150%;
}

.stat-card:hover {
  border-color: rgba(201, 168, 76, 0.2);
}

/* ─── Quick Actions ─── */
.quick-actions {
  margin-bottom: 3rem;
}

.actions-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 0.875rem;
}

.action-card {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.875rem;
  padding: 1.5rem 1rem;
  background: rgba(10, 46, 74, 0.25);
  border: 1px solid rgba(201, 168, 76, 0.08);
  color: rgba(248, 245, 239, 0.55);
  font-family: 'Montserrat', sans-serif;
  font-size: 0.65rem;
  font-weight: 500;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  text-decoration: none;
  text-align: center;
  transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
  opacity: 0;
  animation: fadeSlideUp 0.5s ease forwards;
}

.action-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 1px;
  background: rgba(201, 168, 76, 0);
  transition: background 0.35s ease;
}

.action-card:hover {
  border-color: rgba(201, 168, 76, 0.25);
  background: rgba(201, 168, 76, 0.04);
  color: #c9a84c;
  transform: translateY(-2px);
}

.action-card:hover::before {
  background: rgba(201, 168, 76, 0.3);
}

.action-icon-wrap {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(201, 168, 76, 0.5);
  transition: color 0.35s ease;
}

.action-card:hover .action-icon-wrap {
  color: #c9a84c;
}

.action-label {
  line-height: 1.4;
}

.action-arrow {
  position: absolute;
  top: 0.75rem;
  right: 0.75rem;
  opacity: 0;
  transform: translateX(-4px);
  transition: all 0.3s ease;
  color: rgba(201, 168, 76, 0.5);
}

.action-card:hover .action-arrow {
  opacity: 1;
  transform: translateX(0);
}

/* ─── Two Column Layout ─── */
.two-column {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
}

.panel {
  background: rgba(10, 46, 74, 0.2);
  border: 1px solid rgba(201, 168, 76, 0.08);
  padding: 1.75rem;
}

/* ─── Empty State ─── */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3.5rem 2rem;
  text-align: center;
  border: 1px dashed rgba(201, 168, 76, 0.12);
}

.empty-icon {
  color: rgba(201, 168, 76, 0.2);
  margin-bottom: 1rem;
}

.empty-title {
  font-family: 'Cormorant Garamond', serif;
  font-size: 1rem;
  font-weight: 400;
  color: rgba(248, 245, 239, 0.5);
  margin: 0 0 0.375rem 0;
}

.empty-desc {
  font-family: 'Montserrat', sans-serif;
  font-size: 0.7rem;
  font-weight: 400;
  color: rgba(248, 245, 239, 0.3);
  margin: 0;
  max-width: 280px;
  line-height: 1.6;
}

/* ─── Bookings List ─── */
.bookings-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.booking-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem 1.25rem;
  background: rgba(10, 46, 74, 0.3);
  border: 1px solid rgba(201, 168, 76, 0.06);
  transition: all 0.3s ease;
  opacity: 0;
  animation: fadeSlideUp 0.5s ease forwards;
}

.booking-item:hover {
  border-color: rgba(201, 168, 76, 0.15);
  background: rgba(201, 168, 76, 0.03);
}

.booking-avatar {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(201, 168, 76, 0.1);
  border: 1px solid rgba(201, 168, 76, 0.15);
  flex-shrink: 0;
  font-family: 'Cormorant Garamond', serif;
  font-size: 0.875rem;
  font-weight: 600;
  color: #c9a84c;
}

.booking-info {
  flex: 1;
  min-width: 0;
}

.booking-name {
  font-family: 'Montserrat', sans-serif;
  font-size: 0.8rem;
  font-weight: 500;
  color: rgba(248, 245, 239, 0.9);
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.booking-trip {
  font-family: 'Montserrat', sans-serif;
  font-size: 0.65rem;
  color: rgba(248, 245, 239, 0.4);
  margin: 0.125rem 0 0 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.booking-meta {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.375rem;
  flex-shrink: 0;
}

.booking-status {
  font-family: 'Montserrat', sans-serif;
  font-size: 0.5rem;
  font-weight: 600;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  padding: 0.3rem 0.6rem;
  border: 1px solid;
}

.status-pending {
  background: rgba(255, 193, 7, 0.08);
  border-color: rgba(255, 193, 7, 0.25);
  color: #e5a800;
}

.status-confirmed {
  background: rgba(76, 175, 80, 0.08);
  border-color: rgba(76, 175, 80, 0.25);
  color: #5cb85c;
}

.status-cancelled {
  background: rgba(224, 123, 90, 0.08);
  border-color: rgba(224, 123, 90, 0.25);
  color: #d98a70;
}

.booking-date {
  font-family: 'Montserrat', sans-serif;
  font-size: 0.6rem;
  color: rgba(248, 245, 239, 0.3);
  letter-spacing: 0.05em;
}

/* ─── Uploads List ─── */
.uploads-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.upload-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem 1rem;
  background: rgba(10, 46, 74, 0.3);
  border: 1px solid rgba(201, 168, 76, 0.06);
  transition: all 0.3s ease;
  cursor: pointer;
  opacity: 0;
  animation: fadeSlideUp 0.5s ease forwards;
}

.upload-item:hover {
  border-color: rgba(201, 168, 76, 0.15);
  background: rgba(201, 168, 76, 0.03);
}

.upload-thumb-wrap {
  position: relative;
  width: 48px;
  height: 48px;
  flex-shrink: 0;
  overflow: hidden;
}

.upload-thumb {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.5s ease;
}

.upload-item:hover .upload-thumb {
  transform: scale(1.08);
}

.upload-thumb-overlay {
  position: absolute;
  inset: 0;
  background: rgba(10, 46, 74, 0.2);
  transition: background 0.3s ease;
}

.upload-item:hover .upload-thumb-overlay {
  background: rgba(10, 46, 74, 0);
}

.upload-info {
  flex: 1;
  min-width: 0;
}

.upload-label {
  font-family: 'Montserrat', sans-serif;
  font-size: 0.75rem;
  font-weight: 500;
  color: rgba(248, 245, 239, 0.8);
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.upload-date {
  font-family: 'Montserrat', sans-serif;
  font-size: 0.6rem;
  color: rgba(248, 245, 239, 0.3);
  margin: 0.125rem 0 0 0;
  letter-spacing: 0.03em;
}

.upload-arrow {
  color: rgba(201, 168, 76, 0);
  transition: all 0.3s ease;
  flex-shrink: 0;
}

.upload-item:hover .upload-arrow {
  color: rgba(201, 168, 76, 0.5);
  transform: translateX(2px);
}

/* ─── Animations ─── */
@keyframes fadeSlideUp {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* ─── Responsive ─── */
@media (max-width: 1200px) {
  .stats-grid {
    grid-template-columns: repeat(3, 1fr);
  }
  .actions-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 992px) {
  .two-column {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .dashboard {
    padding: 1.5rem 1rem;
  }
  .page-title {
    font-size: 1.875rem;
  }
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 0.875rem;
  }
  .stat-card-inner {
    padding: 1.25rem 1rem;
  }
  .stat-value {
    font-size: 1.625rem;
  }
  .actions-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 0.75rem;
  }
  .booking-item {
    flex-wrap: wrap;
    gap: 0.75rem;
  }
  .booking-meta {
    flex-direction: row;
    align-items: center;
    width: 100%;
    justify-content: space-between;
  }
}

@media (max-width: 480px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }
  .actions-grid {
    grid-template-columns: 1fr;
  }
  .stat-card-inner {
    flex-direction: row;
    align-items: center;
  }
}
</style>
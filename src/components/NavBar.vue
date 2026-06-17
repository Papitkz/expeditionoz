<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAdminAuth } from '@/composables/useAdminAuth'
import { useTheme } from '@/composables/useTheme'
import BookACallButton from '@/components/BookACallButton.vue'

const router = useRouter()
const { user, isAdmin } = useAdminAuth()
const { currentTheme, toggleTheme } = useTheme()

const scrolled = ref(false)
const mobileOpen = ref(false)
const mobileDropdownOpen = ref(false)
const isDark = computed(() => currentTheme.value === 'expeditionDark')

// --- Cursor Effects Toggle ---
const cursorEffectsEnabled = ref(true)

function toggleCursorEffects() {
  cursorEffectsEnabled.value = !cursorEffectsEnabled.value
  localStorage.setItem('cursorEffects', cursorEffectsEnabled.value.toString())
  window.dispatchEvent(
    new CustomEvent('toggleCursorEffects', {
      detail: { enabled: cursorEffectsEnabled.value }
    })
  )
}

onMounted(() => {
  const saved = localStorage.getItem('cursorEffects')
  if (saved !== null) {
    cursorEffectsEnabled.value = saved === 'true'
  }
  window.dispatchEvent(
    new CustomEvent('toggleCursorEffects', {
      detail: { enabled: cursorEffectsEnabled.value }
    })
  )
})

// --- Real-time Clock with Timezone ---
const currentTime = ref('')
const selectedTimezone = ref('Australia/Sydney')
const showTimezoneDropdown = ref(false)

const timezones = [
  { label: 'Sydney (AEDT/AEST)', value: 'Australia/Sydney' },
  { label: 'Melbourne', value: 'Australia/Melbourne' },
  { label: 'Perth', value: 'Australia/Perth' },
  { label: 'London (GMT)', value: 'Europe/London' },
  { label: 'New York (EST)', value: 'America/New_York' },
  { label: 'Los Angeles (PST)', value: 'America/Los_Angeles' },
  { label: 'Tokyo (JST)', value: 'Asia/Tokyo' },
  { label: 'Singapore', value: 'Asia/Singapore' },
  { label: 'Dubai', value: 'Asia/Dubai' },
  { label: 'Paris (CET)', value: 'Europe/Paris' }
]

let timeInterval: number | null = null

function formatTime() {
  const now = new Date()
  const formatter = new Intl.DateTimeFormat('en-AU', {
    timeZone: selectedTimezone.value,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    timeZoneName: 'short'
  })
  currentTime.value = formatter.format(now)
}

function selectTimezone(timezone: string) {
  selectedTimezone.value = timezone
  showTimezoneDropdown.value = false
  formatTime()
}

function handleScroll() {
  scrolled.value = window.scrollY > 60
}

onMounted(() => {
  window.addEventListener('scroll', handleScroll)
  formatTime()
  timeInterval = window.setInterval(formatTime, 1000)
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
  if (timeInterval) clearInterval(timeInterval)
})

const navLinks = [
  { label: 'Expeditions', to: '/expeditions' },
  { label: 'About', to: '/about' },
  { label: 'Blog', to: '/blog' },
  { label: 'FAQ', to: '/faq' }
]

const reefExpanded = ref(false)

const reefSubItems = [
  { label: 'Dive Expedition', to: '/expeditions/dive-expedition', tag: '9 Days' },
  { label: 'Ocean Safari', to: '/expeditions/ocean-safari', tag: '6 Days' }
]

function toggleReefMenu() {
  reefExpanded.value = !reefExpanded.value
}

function navigate(to: string) {
  mobileOpen.value = false
  reefExpanded.value = false
  router.push(to)
}

function handleClickOutside(e: MouseEvent) {
  const target = e.target as HTMLElement
  if (!target.closest('.timezone-wrapper')) {
    showTimezoneDropdown.value = false
  }
  if (!target.closest('.reef-nav-wrapper')) {
    reefExpanded.value = false
  }
  if (!target.closest('.mobile-action-wrapper')) {
    mobileDropdownOpen.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<template>
  <header
    class="fixed top-0 left-0 right-0 z-50 transition-all duration-500"
    :class="scrolled ? 'nav-scrolled' : 'nav-transparent'"
  >
    <div class="w-full px-4 sm:px-6 lg:px-12">
      <div class="flex items-center justify-between h-20 lg:h-24 relative">

        <!-- Left: Hamburger -->
        <div class="flex items-center gap-3 z-10">
          <button
            class="hamburger-premium"
            :class="{ 'hamburger-hidden': mobileOpen }"
            :aria-expanded="mobileOpen"
            aria-controls="mobile-menu"
            @click="mobileOpen = !mobileOpen"
            aria-label="Toggle menu"
          >
            <div class="hamburger-lines" :class="{ open: mobileOpen }">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </button>
        </div>

        <!-- Center: Logo -->
        <router-link to="/" class="logo-link absolute left-1/2 -translate-x-1/2 text-center">
          <span
            class="block"
            style="font-family: var(--font-heading); font-size: 0.6rem; letter-spacing: 0.25em; color: rgba(248, 245, 239, 0.65); font-weight: 500;"
          >
            EXPEDITION
          </span>
          <span
            class="block"
            style="font-family: var(--font-heading); font-size: 3rem; font-weight: 700; color: var(--color-sand-100); letter-spacing: 0.04em; line-height: 1; margin-top: -2px;"
          >
            OZ
          </span>
        </router-link>

        <!-- Right: Buttons -->
        <div class="flex items-center gap-2 sm:gap-3 z-10 relative">
          <!-- Desktop: show both buttons -->
          <router-link to="/expeditions" class="top-right-btn hidden lg:inline-flex" style="background-color: #dbb86a; color: black;">
            Choose Your Adventure
          </router-link>
          <router-link to="/book" class="top-right-btn hidden lg:inline-flex">
            Booking Enquiry
          </router-link>

          <!-- Mobile/Tablet: dots icon + dropdown -->
          <div class="mobile-action-wrapper lg:hidden">
            <button
              class="mobile-action-btn"
              @click.stop="mobileDropdownOpen = !mobileDropdownOpen"
              aria-label="Quick actions"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="5" cy="12" r="1.5" fill="currentColor"/>
                <circle cx="12" cy="12" r="1.5" fill="currentColor"/>
                <circle cx="19" cy="12" r="1.5" fill="currentColor"/>
              </svg>
            </button>

            <transition name="dropdown">
              <div v-if="mobileDropdownOpen" class="mobile-action-dropdown">
                <router-link
                  to="/expeditions"
                  class="mobile-action-link btn-gold"
                  @click="mobileDropdownOpen = false"
                >
                  Choose Your Adventure
                </router-link>
                <router-link
                  to="/book"
                  class="mobile-action-link"
                  @click="mobileDropdownOpen = false"
                >
                  Booking Enquiry
                </router-link>
              </div>
            </transition>
          </div>
        </div>

      </div>
    </div>
  </header>

  <!-- Drawer backdrop -->
  <div
    v-if="mobileOpen"
    class="menu-backdrop"
    @click="mobileOpen = false"
  ></div>

  <!-- Side drawer menu -->
  <aside id="mobile-menu" class="mobile-menu" :class="{ 'mobile-menu-open': mobileOpen }">
    <div class="mobile-menu-content">

      <!-- Menu Header -->
      <div class="menu-header">
        <button class="close-btn" @click="mobileOpen = false" aria-label="Close menu">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
        <div class="menu-header-text">
          <div class="menu-title">Menu</div>
          <div class="menu-subtitle">Explore Expedition OZ</div>
        </div>
      </div>

      <!-- Primary Nav: Expeditions Dropdown -->
      <div class="reef-nav-wrapper">
        <button
          class="reef-nav-toggle"
          @click="toggleReefMenu"
          :class="{ 'reef-nav-toggle--open': reefExpanded }"
          :aria-expanded="reefExpanded"
          aria-controls="reef-submenu"
        >
          <div class="reef-nav-content">
            <span class="reef-nav-label">Wake Up On The World's Greatest Reef.</span>
            <span class="reef-nav-hint">Choose your experience</span>
          </div>
          <div class="reef-nav-icon">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2.5"
              class="reef-nav-arrow"
              :class="{ 'reef-nav-arrow--open': reefExpanded }"
            >
              <path d="M6 9l6 6 6-6" />
            </svg>
          </div>
        </button>

        <transition name="reef-expand">
          <div v-if="reefExpanded" id="reef-submenu" class="reef-nav-submenu">
            <div class="reef-submenu-header">
              <div class="reef-submenu-line"></div>
              <span class="reef-submenu-title">Select Expedition</span>
              <div class="reef-submenu-line"></div>
            </div>
            <router-link
              v-for="item in reefSubItems"
              :key="item.to"
              :to="item.to"
              class="reef-nav-sublink"
              @click="navigate(item.to)"
            >
              <div class="sublink-content">
                <span class="sublink-label">{{ item.label }}</span>
                <span class="sublink-tag">{{ item.tag }}</span>
              </div>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="sublink-arrow">
                <polyline points="9,18 15,12 9,6"></polyline>
              </svg>
            </router-link>
          </div>
        </transition>
      </div>

      <!-- Secondary Navigation -->
      <nav class="secondary-nav">
        <router-link
          v-for="link in navLinks"
          :key="link.to"
          :to="link.to"
          class="secondary-nav-link"
          @click="navigate(link.to)"
        >
          {{ link.label }}
        </router-link>
      </nav>

      <!-- Bottom Actions -->
      <div class="menu-bottom-actions">
        <button class="btn-primary-mobile" @click="navigate('/book')">
          Book Now
        </button>
      </div>

    </div>
  </aside>

  <!-- Bottom Controls Bar -->
  <div class="bottom-controls mt-10">
    <div class="timezone-wrapper">
      <div class="clock-display" @click="showTimezoneDropdown = !showTimezoneDropdown">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"></circle>
          <polyline points="12,6 12,12 16,14"></polyline>
        </svg>
        <span class="time-text">{{ currentTime }}</span>
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="dropdown-arrow" :class="{ open: showTimezoneDropdown }">
          <polyline points="6,9 12,15 18,9"></polyline>
        </svg>
      </div>

      <transition name="dropdown">
        <div v-if="showTimezoneDropdown" class="timezone-dropdown">
          <div
            v-for="tz in timezones"
            :key="tz.value"
            class="timezone-option"
            :class="{ selected: selectedTimezone === tz.value }"
            @click="selectTimezone(tz.value)"
          >
            {{ tz.label }}
          </div>
        </div>
      </transition>
    </div>

    <BookACallButton  />
  </div>
</template>

<style scoped>
/* ════════════════════════════════════════
   HEADER
   ════════════════════════════════════════ */
.nav-transparent {
  background: linear-gradient(to bottom, rgba(7, 26, 43, 0.85) 0%, transparent 100%);
}

.nav-scrolled {
  background: rgba(7, 26, 43, 0.97);
  border-bottom: 1px solid rgba(201, 168, 76, 0.2);
  backdrop-filter: blur(12px);
}

.logo-link {
  text-decoration: none;
  display: flex;
  flex-direction: column;
  align-items: center;
  line-height: 1.1;
}

/* ════════════════════════════════════════
   HAMBURGER
   ════════════════════════════════════════ */
.hamburger-premium {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 10px;
  background: transparent;
  border: 1px solid rgba(201, 168, 76, 0.25);
  border-radius: 8px;
  cursor: pointer;
  z-index: 50;
  width: 44px;
  height: 44px;
  transition: all 0.35s cubic-bezier(0.77, 0, 0.175, 1);
  opacity: 1;
  transform: scale(1);
  pointer-events: auto;
  flex-shrink: 0;
}

.hamburger-premium[aria-expanded="true"],
.hamburger-hidden {
  opacity: 0;
  pointer-events: none;
  transform: scale(0.8);
}

.hamburger-premium:hover {
  border-color: var(--color-gold-400);
  background: rgba(201, 168, 76, 0.1);
}

.hamburger-lines {
  display: flex;
  flex-direction: column;
  gap: 5px;
  width: 22px;
}

.hamburger-lines span {
  display: block;
  height: 1.5px;
  width: 100%;
  background: var(--color-sand-100);
  transition: all 0.4s cubic-bezier(0.77, 0, 0.175, 1);
  transform-origin: center;
}

.hamburger-premium:hover .hamburger-lines span {
  background: var(--color-gold-400);
}

.hamburger-lines.open span:nth-child(1) {
  transform: translateY(6.5px) rotate(45deg);
}

.hamburger-lines.open span:nth-child(2) {
  opacity: 0;
  transform: scaleX(0);
}

.hamburger-lines.open span:nth-child(3) {
  transform: translateY(-6.5px) rotate(-45deg);
}

/* ════════════════════════════════════════
   TOP RIGHT BUTTONS
   ════════════════════════════════════════ */
.top-right-btn {
  font-family: var(--font-heading);
  font-size: 0.7rem;
  letter-spacing: 0.15em;
  font-weight: 600;
  text-transform: uppercase;
  color: rgba(248, 245, 239, 0.9);
  text-decoration: none;
  padding: 10px 22px;
  border: 1px solid rgba(201, 168, 76, 0.3);
  border-radius: 4px;
  transition: all 0.3s ease;
  white-space: nowrap;
  flex-shrink: 0;
}

.top-right-btn:hover {
  border-color: rgba(248, 245, 239, 0.6);
  color: white;
  background: rgba(255, 255, 255, 0.08);
}

/* ════════════════════════════════════════
   MOBILE ACTION DROPDOWN (right side)
   ════════════════════════════════════════ */
.mobile-action-wrapper {
  position: relative;
}

.mobile-action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  background: transparent;
  border: 1px solid rgba(201, 168, 76, 0.25);
  border-radius: 8px;
  color: var(--color-sand-100);
  cursor: pointer;
  transition: all 0.3s ease;
}

.mobile-action-btn:hover {
  border-color: var(--color-gold-400);
  background: rgba(201, 168, 76, 0.1);
  color: var(--color-gold-400);
}

.mobile-action-dropdown {
  position: absolute;
  top: calc(100% + 10px);
  right: 0;
  min-width: 210px;
  background: rgba(7, 26, 43, 0.98);
  border: 1px solid rgba(201, 168, 76, 0.25);
  border-radius: 10px;
  padding: 6px;
  backdrop-filter: blur(12px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
  z-index: 100;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.mobile-action-link {
  display: block;
  font-family: var(--font-heading);
  font-size: 0.72rem;
  font-weight: 600;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  text-decoration: none;
  padding: 11px 16px;
  border-radius: 7px;
  color: rgba(248, 245, 239, 0.85);
  border: 1px solid transparent;
  transition: all 0.25s ease;
}

.mobile-action-link:hover {
  background: rgba(201, 168, 76, 0.08);
  border-color: rgba(201, 168, 76, 0.2);
  color: var(--color-gold-400);
}

.mobile-action-link.btn-gold {
  background: var(--color-gold-400);
  color: rgba(7, 26, 43, 0.95);
  border-color: var(--color-gold-400);
}

.mobile-action-link.btn-gold:hover {
  background: #dbb86a;
  border-color: #dbb86a;
  color: rgba(7, 26, 43, 1);
}

/* ════════════════════════════════════════
   MOBILE MENU & BACKDROP
   ════════════════════════════════════════ */
.menu-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 55;
}

.mobile-menu {
  position: fixed;
  top: 0;
  left: 0;
  width: min(85vw, 380px);
  height: 100vh;
  z-index: 60;
  transform: translateX(-100%);
  transition: transform 0.6s cubic-bezier(0.77, 0, 0.175, 1);
  overflow-y: auto;
  background: rgba(7, 26, 43, 0.98);
  border-right: 1px solid rgba(201, 168, 76, 0.2);
  backdrop-filter: blur(12px);
}

.mobile-menu-open {
  transform: translateX(0);
}

.mobile-menu-content {
  min-height: 100vh;
  padding: 28px 24px 32px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

/* ════════════════════════════════════════
   MENU HEADER
   ════════════════════════════════════════ */
.menu-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  padding-bottom: 8px;
  flex-shrink: 0;
}

.menu-header-text {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.menu-title {
  font-family: var(--font-display);
  font-size: 1.4rem;
  letter-spacing: 0.08em;
  color: var(--color-sand-100);
  line-height: 1.2;
}

.menu-subtitle {
  font-family: var(--font-heading);
  font-size: 0.7rem;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: rgba(248, 245, 239, 0.55);
}

.close-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  border: 1px solid rgba(201, 168, 76, 0.25);
  background: transparent;
  color: var(--color-sand-100);
  width: 40px;
  height: 40px;
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.3s ease;
}

.close-btn:hover {
  border-color: var(--color-gold-400);
  color: var(--color-gold-400);
  background: rgba(201, 168, 76, 0.1);
}

/* ════════════════════════════════════════
   REEF NAVIGATION
   ════════════════════════════════════════ */
.reef-nav-wrapper {
  display: flex;
  flex-direction: column;
  position: relative;
}

.reef-nav-toggle {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  width: 100%;
  padding: 20px 18px;
  background: linear-gradient(135deg, rgba(201, 168, 76, 0.08) 0%, rgba(201, 168, 76, 0.02) 100%);
  border: 1px solid rgba(201, 168, 76, 0.15);
  border-radius: 14px;
  cursor: pointer;
  text-align: left;
  transition: all 0.4s cubic-bezier(0.77, 0, 0.175, 1);
  position: relative;
  overflow: hidden;
}

.reef-nav-toggle::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(201, 168, 76, 0.12) 0%, rgba(201, 168, 76, 0.04) 100%);
  opacity: 0;
  transition: opacity 0.4s ease;
}

.reef-nav-toggle:hover::before {
  opacity: 1;
}

.reef-nav-toggle:hover {
  border-color: rgba(201, 168, 76, 0.35);
  box-shadow: 0 4px 24px rgba(201, 168, 76, 0.1);
  transform: translateY(-1px);
}

.reef-nav-toggle--open {
  border-color: rgba(201, 168, 76, 0.4);
  background: linear-gradient(135deg, rgba(201, 168, 76, 0.12) 0%, rgba(201, 168, 76, 0.04) 100%);
  box-shadow: 0 4px 24px rgba(201, 168, 76, 0.12);
}

.reef-nav-content {
  display: flex;
  flex-direction: column;
  gap: 5px;
  position: relative;
  z-index: 1;
  min-width: 0;
  flex: 1;
}

.reef-nav-label {
  font-family: var(--font-display);
  font-size: 0.95rem;
  font-weight: 300;
  color: var(--color-gold-400);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  line-height: 1.5;
  word-wrap: break-word;
}

.reef-nav-hint {
  font-family: var(--font-heading);
  font-size: 0.65rem;
  font-weight: 400;
  color: rgba(248, 245, 239, 0.45);
  text-transform: uppercase;
  letter-spacing: 0.15em;
}

.reef-nav-icon {
  flex-shrink: 0;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: rgba(201, 168, 76, 0.1);
  border: 1px solid rgba(201, 168, 76, 0.2);
  position: relative;
  z-index: 1;
  transition: all 0.3s ease;
  margin-left: 8px;
  color: var(--color-gold-400);
}

.reef-nav-toggle:hover .reef-nav-icon {
  background: rgba(201, 168, 76, 0.18);
  border-color: rgba(201, 168, 76, 0.35);
}

.reef-nav-arrow {
  transition: transform 0.4s cubic-bezier(0.77, 0, 0.175, 1);
}

.reef-nav-arrow--open {
  transform: rotate(180deg);
}

.reef-nav-submenu {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 16px 12px 8px;
}

.reef-submenu-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
  padding: 0 4px;
}

.reef-submenu-line {
  flex: 1;
  height: 1px;
  background: linear-gradient(90deg, transparent 0%, rgba(201, 168, 76, 0.2) 50%, transparent 100%);
}

.reef-submenu-title {
  font-family: var(--font-heading);
  font-size: 0.6rem;
  font-weight: 500;
  color: rgba(248, 245, 239, 0.4);
  text-transform: uppercase;
  letter-spacing: 0.2em;
  white-space: nowrap;
}

.reef-nav-sublink {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 16px;
  background: rgba(248, 245, 239, 0.03);
  border: 1px solid rgba(248, 245, 239, 0.06);
  border-radius: 10px;
  text-decoration: none;
  transition: all 0.35s cubic-bezier(0.77, 0, 0.175, 1);
  position: relative;
  overflow: hidden;
}

.reef-nav-sublink::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 3px;
  height: 100%;
  background: linear-gradient(180deg, var(--color-gold-400) 0%, rgba(201, 168, 76, 0.3) 100%);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.reef-nav-sublink:hover {
  background: rgba(201, 168, 76, 0.08);
  border-color: rgba(201, 168, 76, 0.2);
  transform: translateX(4px);
  box-shadow: 0 2px 16px rgba(201, 168, 76, 0.08);
}

.reef-nav-sublink:hover::before {
  opacity: 1;
}

.sublink-content {
  display: flex;
  align-items: center;
  gap: 12px;
}

.sublink-label {
  font-family: var(--font-heading);
  font-size: 0.85rem;
  font-weight: 500;
  color: rgba(248, 245, 239, 0.85);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  transition: color 0.3s ease;
}

.reef-nav-sublink:hover .sublink-label {
  color: var(--color-gold-400);
}

.sublink-tag {
  font-family: var(--font-heading);
  font-size: 0.6rem;
  font-weight: 500;
  color: rgba(201, 168, 76, 0.7);
  text-transform: uppercase;
  letter-spacing: 0.1em;
  padding: 3px 8px;
  background: rgba(201, 168, 76, 0.1);
  border: 1px solid rgba(201, 168, 76, 0.15);
  border-radius: 20px;
  transition: all 0.3s ease;
}

.reef-nav-sublink:hover .sublink-tag {
  background: rgba(201, 168, 76, 0.18);
  border-color: rgba(201, 168, 76, 0.3);
  color: var(--color-gold-400);
}

.sublink-arrow {
  color: rgba(248, 245, 239, 0.3);
  transition: all 0.3s ease;
  flex-shrink: 0;
}

.reef-nav-sublink:hover .sublink-arrow {
  color: var(--color-gold-400);
  transform: translateX(3px);
}

.reef-expand-enter-active,
.reef-expand-leave-active {
  transition: all 0.4s cubic-bezier(0.77, 0, 0.175, 1);
  overflow: hidden;
}

.reef-expand-enter-from,
.reef-expand-leave-to {
  opacity: 0;
  max-height: 0;
  padding-top: 0;
  padding-bottom: 0;
}

.reef-expand-enter-to,
.reef-expand-leave-from {
  opacity: 1;
  max-height: 300px;
}

/* ── Secondary Nav ── */
.secondary-nav {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding-top: 8px;
  border-top: 1px solid rgba(201, 168, 76, 0.12);
}

.secondary-nav-link {
  font-family: var(--font-heading);
  font-size: 0.8rem;
  font-weight: 400;
  color: rgba(248, 245, 239, 0.6);
  text-decoration: none;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  padding: 12px 16px;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.secondary-nav-link:hover {
  color: var(--color-gold-400);
  background: rgba(201, 168, 76, 0.06);
  padding-left: 20px;
}

/* ════════════════════════════════════════
   MENU BOTTOM ACTIONS
   ════════════════════════════════════════ */
.menu-bottom-actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: auto;
  padding-top: 16px;
  border-top: 1px solid rgba(201, 168, 76, 0.12);
}

.btn-primary-mobile {
  background: var(--color-gold-400);
  color: rgba(7, 26, 43, 0.95);
  padding: 14px 24px;
  border-radius: 8px;
  border: none;
  font-family: var(--font-heading);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.3s ease;
  text-align: center;
}

.btn-primary-mobile:hover {
  background: #dbb86a;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(201, 168, 76, 0.3);
}

/* ════════════════════════════════════════
   BOTTOM CONTROLS BAR
   ════════════════════════════════════════ */
.bottom-controls {
  position: fixed;
  bottom: 16px;
  left: 16px;
  right: 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  z-index: 50;
  font-family: var(--font-heading);
  font-size: 0.65rem;
  letter-spacing: 0.1em;
  pointer-events: none;
}

.bottom-controls > * {
  pointer-events: auto;
}

.timezone-wrapper {
  position: relative;
}

.clock-display {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  background: rgba(7, 26, 43, 0.8);
  border: 1px solid rgba(201, 168, 76, 0.3);
  border-radius: 20px;
  color: var(--color-gold-400);
  cursor: pointer;
  transition: all 0.3s ease;
  backdrop-filter: blur(4px);
  user-select: none;
}

.time-text {
  font-family: 'SF Mono', Monaco, monospace;
  font-size: 0.7rem;
  font-weight: 600;
  min-width: 85px;
  text-align: center;
}

.dropdown-arrow {
  transition: transform 0.3s ease;
  opacity: 0.6;
}

.dropdown-arrow.open {
  transform: rotate(180deg);
}

.timezone-dropdown {
  position: absolute;
  bottom: calc(100% + 8px);
  left: 0;
  min-width: 180px;
  max-height: 240px;
  overflow-y: auto;
  background: rgba(7, 26, 43, 0.98);
  border: 1px solid rgba(201, 168, 76, 0.3);
  border-radius: 8px;
  padding: 4px;
  backdrop-filter: blur(12px);
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.4);
}

.timezone-option {
  padding: 8px 12px;
  color: rgba(248, 245, 239, 0.8);
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.2s ease;
  font-size: 0.65rem;
  white-space: nowrap;
}

.timezone-option:hover,
.timezone-option.selected {
  background: rgba(201, 168, 76, 0.15);
  color: var(--color-gold-400);
}

.dropdown-enter-active,
.dropdown-leave-active {
  transition: all 0.2s ease;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(10px);
}

/* ════════════════════════════════════════
   RESPONSIVE
   ════════════════════════════════════════ */
@media (max-width: 1024px) {
  .top-right-btn {
    padding: 9px 18px;
    font-size: 0.65rem;
  }
}

@media (max-width: 768px) {
  .bottom-controls {
    bottom: 12px;
    left: 12px;
    right: 12px;
  }

  .time-text {
    font-size: 0.65rem;
    min-width: 75px;
  }

  .top-right-btn {
    font-size: 0.55rem;
    letter-spacing: 0.1em;
    padding: 6px 12px;
    border-radius: 3px;
  }

  .reef-nav-label {
    font-size: 0.85rem;
  }

  .reef-nav-toggle {
    padding: 16px 14px;
  }

  .reef-nav-icon {
    width: 32px;
    height: 32px;
  }
}

@media (max-width: 480px) {
  .bottom-controls {
    bottom: 10px;
    left: 10px;
    right: 10px;
  }

  .top-right-btn {
    padding: 5px 10px;
    font-size: 0.5rem;
    letter-spacing: 0.08em;
  }

  .reef-nav-label {
    font-size: 0.78rem;
  }

  .reef-nav-hint {
    font-size: 0.55rem;
  }

  .reef-nav-toggle {
    padding: 14px 12px;
    gap: 12px;
  }
}

@media (prefers-reduced-motion: reduce) {
  * {
    transition: none !important;
    animation: none !important;
  }
}
</style>
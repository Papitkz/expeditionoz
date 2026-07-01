<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAdminAuth } from '@/composables/useAdminAuth'

const router = useRouter()
const route = useRoute()
const { user, isAdmin } = useAdminAuth()

const scrolled = ref(false)
const mobileOpen = ref(false)
const expeditionsOpen = ref(false)

function handleScroll() {
  scrolled.value = window.scrollY > 60
}

function handleClickOutside(e: MouseEvent) {
  const target = e.target as HTMLElement
  if (!target.closest('.exp-dropdown-wrapper')) {
    expeditionsOpen.value = false
  }
  if (!target.closest('.mobile-menu') && !target.closest('.hamburger-btn')) {
    mobileOpen.value = false
  }
}

onMounted(() => {
  window.addEventListener('scroll', handleScroll)
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
  document.removeEventListener('click', handleClickOutside)
})

const expeditionLinks = [
  { label: 'Ocean Safari Expedition', sub: '5 Nights · Aboard Sylfia', to: '/expeditions/ocean-safari' },
  { label: 'Ocean Safari Escape', sub: '3 Nights · Aboard Sylfia', to: '/expeditions/ocean-safari-escape' },
  { label: 'Dive Expedition', sub: '8 Nights · Aboard Millennium', to: '/expeditions/dive-expedition' },
  { label: 'Dive Escape', sub: '4 Nights · Aboard Millennium', to: '/expeditions/dive-escape' },
  { label: 'Limited Expeditions', sub: 'Hosted & Specialty Departures', to: '/limited-expeditions' },
]

function navigate(to: string) {
  expeditionsOpen.value = false
  mobileOpen.value = false
  router.push(to)
}

function isActive(path: string) {
  return route.path === path || route.path.startsWith(path + '/')
}
</script>

<template>
  <header class="navbar" :class="{ 'navbar--scrolled': scrolled }">
    <div class="navbar-inner">
      <router-link to="/" class="logo-block">
        <img src="/images/logo-header.png" alt="Expedition OZ" class="logo-img " />
      </router-link>

      <nav class="desktop-nav">
        <div class="exp-dropdown-wrapper">
          <button
            class="nav-link nav-link--dropdown"
            :class="{ 'nav-link--active': isActive('/expeditions') || isActive('/limited-expeditions') }"
            @click.stop="expeditionsOpen = !expeditionsOpen"
          >
            EXPEDITIONS
            <svg
              width="10"
              height="10"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2.5"
              class="dropdown-chevron"
              :class="{ 'dropdown-chevron--open': expeditionsOpen }"
            >
              <path d="M6 9l6 6 6-6" />
            </svg>
          </button>

          <transition name="dropdown-fade">
            <div v-if="expeditionsOpen" class="exp-dropdown">
              <div class="exp-dropdown-inner">
                <div class="exp-dropdown-label">OUR EXPEDITIONS</div>
                <router-link
                  v-for="item in expeditionLinks"
                  :key="item.to"
                  :to="item.to"
                  class="exp-dropdown-link"
                  @click="expeditionsOpen = false"
                >
                  <span class="exp-link-name">{{ item.label }}</span>
                  <span class="exp-link-sub">{{ item.sub }}</span>
                </router-link>
              </div>
            </div>
          </transition>
        </div>

        <router-link to="/experience" class="nav-link" :class="{ 'nav-link--active': isActive('/experience') }">
          THE EXPERIENCE
        </router-link>
        <router-link to="/about" class="nav-link" :class="{ 'nav-link--active': isActive('/about') }">
          ABOUT US
        </router-link>
        <router-link to="/blog" class="nav-link" :class="{ 'nav-link--active': isActive('/blog') }">
          JOURNAL
        </router-link>
        <router-link to="/contact" class="nav-link" :class="{ 'nav-link--active': isActive('/contact') }">
          CONTACT
        </router-link>
      </nav>

      <div class="navbar-right">
        <router-link to="/book" class="enquire-btn">
          CHECK AVAILABILITY
        </router-link>

        <button
          class="hamburger-btn"
          :aria-expanded="mobileOpen"
          @click.stop="mobileOpen = !mobileOpen"
          aria-label="Toggle menu"
        >
          <span class="hb-bar" :class="{ 'hb-bar--top-open': mobileOpen }"></span>
          <span class="hb-bar" :class="{ 'hb-bar--mid-open': mobileOpen }"></span>
          <span class="hb-bar" :class="{ 'hb-bar--bot-open': mobileOpen }"></span>
        </button>
      </div>
    </div>
  </header>

  <transition name="backdrop-fade">
    <div v-if="mobileOpen" class="mobile-backdrop" @click="mobileOpen = false"></div>
  </transition>

  <aside class="mobile-menu" :class="{ 'mobile-menu--open': mobileOpen }">
    <div class="mobile-menu-inner">
      <div class="mobile-menu-head">
        <!-- <router-link to="/" class="mobile-logo" @click="mobileOpen = false">
          <span class="mobile-logo-top">EXPEDITION</span>
          <span class="mobile-logo-main">OZ</span>
        </router-link> -->
        <!-- <button class="mobile-close" @click="mobileOpen = false" aria-label="Close">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button> -->
      </div>

      <div class="mobile-section-label">EXPEDITIONS</div>
      <div class="mobile-exp-links">
        <router-link
          v-for="item in expeditionLinks"
          :key="item.to"
          :to="item.to"
          class="mobile-exp-link"
          @click="navigate(item.to)"
        >
          <span class="mobile-exp-name">{{ item.label }}</span>
          <span class="mobile-exp-sub">{{ item.sub }}</span>
        </router-link>
      </div>

      <div class="mobile-divider"></div>

      <nav class="mobile-nav">
        <router-link to="/experience" class="mobile-nav-link" @click="navigate('/experience')">The Experience</router-link>
        <router-link to="/about" class="mobile-nav-link" @click="navigate('/about')">About Us</router-link>
        <router-link to="/blog" class="mobile-nav-link" @click="navigate('/blog')">Journal</router-link>
        <router-link to="/contact" class="mobile-nav-link" @click="navigate('/contact')">Contact</router-link>
      </nav>

      <div class="mobile-actions">
        <button class="mobile-enquire-btn" @click="navigate('/book')">ENQUIRE</button>
        <button class="mobile-dates-btn" @click="navigate('/dates')">SEE ALL DATES</button>
      </div>
    </div>
  </aside>
</template>

<style scoped>
.navbar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  background: transparent;
  transition: background 0.4s ease, box-shadow 0.4s ease, backdrop-filter 0.4s ease;
}

.navbar--scrolled {
  background: rgba(4, 14, 30, 0.96);
  backdrop-filter: blur(12px);
  box-shadow: 0 1px 0 rgba(201, 168, 76, 0.15);
}

.navbar-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 92px;
  padding: 0 2rem;
  width: 100%;
  gap: 1rem;
}

.logo-block {
  display: flex;
  align-items: center;
  flex-shrink: 0;
  margin-right: auto;
  text-decoration: none;
}

.logo-img {
  width: auto;
  display: block;
  object-fit: contain;
}

.desktop-nav {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  min-width: 0;
  flex-shrink: 1;
  margin-right: 2rem;
}

.nav-link {
  padding: 0.5rem 0.85rem;
  font-family: var(--font-display);
  font-size: 0.68rem;
  font-weight: 500;
  letter-spacing: 0.12em;
  color: rgba(248, 245, 239, 0.82);
  text-decoration: none;
  text-transform: uppercase;
  border-radius: 3px;
  transition: color 0.25s ease;
  white-space: nowrap;
  background: none;
  border: none;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 5px;
}

.nav-link:hover,
.nav-link--active {
  color: #c9a84c;
}

.nav-link--dropdown {
  display: inline-flex;
  align-items: center;
  gap: 5px;
}

.dropdown-chevron {
  transition: transform 0.3s ease;
  opacity: 0.7;
}

.dropdown-chevron--open {
  transform: rotate(180deg);
}

.exp-dropdown-wrapper {
  position: relative;
}

.exp-dropdown {
  position: absolute;
  top: calc(100% + 12px);
  left: 50%;
  transform: translateX(-50%);
  z-index: 200;
  min-width: 280px;
}

.exp-dropdown-inner {
  background: rgba(4, 14, 30, 0.98);
  border: 1px solid rgba(201, 168, 76, 0.3);
  border-radius: 6px;
  padding: 1rem;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(16px);
}

.exp-dropdown-label {
  font-family: var(--font-display);
  font-size: 0.58rem;
  letter-spacing: 0.2em;
  color: rgba(201, 168, 76, 0.6);
  font-weight: 600;
  padding: 0 0.25rem 0.75rem;
  border-bottom: 1px solid rgba(201, 168, 76, 0.15);
  margin-bottom: 0.5rem;
}

.exp-dropdown-link {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 0.65rem 0.5rem;
  text-decoration: none;
  border-radius: 4px;
  transition: background 0.2s ease;
}

.exp-dropdown-link:hover {
  background: rgba(201, 168, 76, 0.08);
}

.exp-link-name {
  font-family: var(--font-display);
  font-size: 0.82rem;
  font-weight: 500;
  color: #f8f5ef;
  letter-spacing: 0.04em;
}

.exp-dropdown-link:hover .exp-link-name {
  color: #c9a84c;
}

.exp-link-sub {
  font-size: 0.65rem;
  color: rgba(248, 245, 239, 0.45);
  letter-spacing: 0.04em;
}

.dropdown-fade-enter-active,
.dropdown-fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.dropdown-fade-enter-from,
.dropdown-fade-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(-6px);
}

.navbar-right {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-shrink: 0;
}

.enquire-btn {
  padding: 0.55rem 1.35rem;
  border: 1.5px solid #c9a84c;
  color: #f8f5ef;
  background: transparent;
  font-family: var(--font-display);
  font-size: 0.65rem;
  font-weight: 700;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  cursor: pointer;
  border-radius: 3px;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  transition: background 0.3s ease, color 0.3s ease;
  white-space: nowrap;
}

.enquire-btn:hover {
  background: #c9a84c;
  color: #071a2b;
}

.hamburger-btn {
  display: none;
  flex-direction: column;
  justify-content: center;
  gap: 5px;
  width: 36px;
  height: 36px;
  background: none;
  border: none;
  cursor: pointer;
  padding: 6px;
}

.hb-bar {
  display: block;
  width: 22px;
  height: 1.5px;
  background: #f8f5ef;
  border-radius: 2px;
  transition: transform 0.3s ease, opacity 0.3s ease;
}

.hb-bar--top-open { transform: translateY(6.5px) rotate(45deg); }
.hb-bar--mid-open { opacity: 0; }
.hb-bar--bot-open { transform: translateY(-6.5px) rotate(-45deg); }

.mobile-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  z-index: 98;
  backdrop-filter: blur(2px);
}

.backdrop-fade-enter-active,
.backdrop-fade-leave-active {
  transition: opacity 0.3s ease;
}

.backdrop-fade-enter-from,
.backdrop-fade-leave-to {
  opacity: 0;
}

.mobile-menu {
  position: fixed;
  top: 0;
  right: -100%;
  width: min(360px, 90vw);
  height: 100dvh;
  background: #040e1e;
  border-left: 1px solid rgba(201, 168, 76, 0.2);
  z-index: 99;
  transition: right 0.4s cubic-bezier(0.77, 0, 0.175, 1);
  overflow-y: auto;
}

.mobile-menu--open {
  right: 0;
}

.mobile-menu-inner {
  display: flex;
  flex-direction: column;
  padding: 1.25rem;
  min-height: 100%;
  gap: 1rem;
}

.mobile-menu-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 1rem;
  border-bottom: 1px solid rgba(201, 168, 76, 0.15);
}

.mobile-logo {
  text-decoration: none;
  display: flex;
  flex-direction: column;
  line-height: 1;
}

.mobile-logo-top {
  font-family: var(--font-display);
  font-size: 0.55rem;
  letter-spacing: 0.22em;
  color: rgba(248, 245, 239, 0.6);
}

.mobile-logo-main {
  font-family: var(--font-display);
  font-size: 1.8rem;
  font-weight: 700;
  color: #f8f5ef;
  letter-spacing: 0.06em;
}

.mobile-close {
  background: none;
  border: none;
  color: rgba(248, 245, 239, 0.6);
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.2s ease;
}

.mobile-close:hover {
  color: #c9a84c;
}

.mobile-section-label {
  font-family: var(--font-display);
  font-size: 0.58rem;
  letter-spacing: 0.22em;
  color: rgba(201, 168, 76, 0.6);
  font-weight: 600;
  text-transform: uppercase;
}

.mobile-exp-links {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.mobile-exp-link {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 0.75rem;
  text-decoration: none;
  border-radius: 4px;
  border: 1px solid rgba(201, 168, 76, 0.08);
  background: rgba(201, 168, 76, 0.03);
  transition: all 0.2s ease;
}

.mobile-exp-link:hover {
  background: rgba(201, 168, 76, 0.08);
  border-color: rgba(201, 168, 76, 0.2);
}

.mobile-exp-name {
  font-family: var(--font-display);
  font-size: 0.88rem;
  color: #f8f5ef;
  font-weight: 500;
}

.mobile-exp-link:hover .mobile-exp-name {
  color: #c9a84c;
}

.mobile-exp-sub {
  font-size: 0.65rem;
  color: rgba(248, 245, 239, 0.4);
}

.mobile-divider {
  height: 1px;
  background: rgba(201, 168, 76, 0.12);
}

.mobile-nav {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.mobile-nav-link {
  font-family: var(--font-display);
  font-size: 0.88rem;
  color: rgba(248, 245, 239, 0.7);
  text-decoration: none;
  padding: 0.65rem 0.75rem;
  border-radius: 4px;
  transition: all 0.2s ease;
  letter-spacing: 0.04em;
}

.mobile-nav-link:hover {
  color: #c9a84c;
  background: rgba(201, 168, 76, 0.05);
}

.mobile-actions {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-top: auto;
  padding-top: 1rem;
  border-top: 1px solid rgba(201, 168, 76, 0.12);
}

.mobile-enquire-btn {
  width: 100%;
  padding: 0.9rem;
  background: #c9a84c;
  border: none;
  color: #071a2b;
  font-family: var(--font-display);
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  cursor: pointer;
  border-radius: 3px;
  transition: background 0.3s ease;
}

.mobile-enquire-btn:hover {
  background: #d7b461;
}

.mobile-dates-btn {
  width: 100%;
  padding: 0.9rem;
  background: transparent;
  border: 1px solid rgba(248, 245, 239, 0.3);
  color: rgba(248, 245, 239, 0.7);
  font-family: var(--font-display);
  font-size: 0.7rem;
  font-weight: 600;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  cursor: pointer;
  border-radius: 3px;
  transition: all 0.3s ease;
}

.mobile-dates-btn:hover {
  border-color: #c9a84c;
  color: #c9a84c;
}

@media (max-width: 1280px) {
  .navbar-inner {
    height: 84px;
    padding: 0 1.5rem;
  }

  .logo-img {
    height: 78px;
  }

  .desktop-nav {
    margin-right: 1.5rem;
  }

  .nav-link {
    padding: 0.5rem 0.6rem;
    font-size: 0.62rem;
  }

  .enquire-btn {
    padding: 0.5rem 1rem;
    font-size: 0.6rem;
    letter-spacing: 0.14em;
  }
}

@media (max-width: 1100px) {
  .desktop-nav {
    display: none;
  }

  .hamburger-btn {
    display: flex;
  }

  .navbar-inner {
    height: 74px;
    padding: 0 1rem;
  }

  .logo-img {
    height: 56px;
  }

  .enquire-btn {
    padding: 0.45rem 0.8rem;
    font-size: 0.55rem;
  }
}

@media (max-width: 480px) {
  .navbar-inner {
    height: 68px;
    padding: 0 0.75rem;
  }

  .logo-img {
    height: 46px;
  }

  .enquire-btn {
    display: none;
  }

  .mobile-menu {
    width: 100vw;
  }
}
.logo-img {
  height: 80px;
  width: auto;
  display: block;
  object-fit: contain;
}

@media (max-width: 768px) {
  .logo-img {
    height: 30px;
    width: auto;
    display: block;
    object-fit: contain;
  }
}
.navbar-inner {
  padding: 0 2rem 0 1rem; /* less padding on the left */
}
</style>
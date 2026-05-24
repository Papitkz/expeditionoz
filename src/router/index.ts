// src/router/index.ts
import { createRouter, createWebHistory, createMemoryHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import HomeView from '@/views/HomeView.vue'

export const routes: RouteRecordRaw[] = [
  { path: '/', name: 'home', component: HomeView },
  { path: '/expeditions', name: 'expeditions', component: () => import('@/views/ExpeditionsView.vue') },
  { path: '/expeditions/ocean-safari', name: 'ocean-safari', component: () => import('@/views/OceanSafariView.vue') },
  { path: '/expeditions/dive-expedition', name: 'dive-expedition', component: () => import('@/views/DiveExpeditionView.vue') },
  { path: '/about', name: 'about', component: () => import('@/views/AboutView.vue') },
  { path: '/contact', name: 'contact', component: () => import('@/views/ContactView.vue') },
  { path: '/book', name: 'book', component: () => import('@/views/BookView.vue') },
  { path: '/book/:trip', name: 'book-trip', component: () => import('@/views/BookView.vue') },
  { path: '/faq', name: 'faq', component: () => import('@/views/FaqView.vue') },
  { path: '/blog', name: 'blog-list', component: () => import('@/views/BlogListView.vue') },
  { path: '/blog/:slug', name: 'blog-post', component: () => import('@/views/BlogPostView.vue') },
  // Admin routes
  { path: '/admin', name: 'admin-login', component: () => import('@/views/admin/AdminLogin.vue') },
  {
    path: '/admin',
    component: () => import('@/views/admin/AdminLayout.vue'),
    meta: { requiresAdmin: true },
    children: [
      { path: 'dashboard', name: 'admin-dashboard', component: () => import('@/views/admin/AdminDashboard.vue') },
      { path: 'images', name: 'admin-images', component: () => import('@/views/admin/AdminImages.vue') },
      { path: 'sections', name: 'admin-sections', component: () => import('@/views/admin/AdminSections.vue') },
      { path: 'trips', name: 'admin-trips', component: () => import('@/views/admin/AdminTrips.vue') },
      { path: 'blogs', name: 'admin-blogs', component: () => import('@/views/admin/AdminBlogs.vue') },
      { path: 'settings', name: 'admin-settings', component: () => import('@/views/admin/AdminSettings.vue') },
      { path: 'users', name: 'admin-users', component: () => import('@/views/admin/AdminUsers.vue') },
      { path: 'bookings', name: 'admin-bookings', component: () => import('@/views/admin/AdminBookings.vue') },
    ],
  },
  { path: '/:pathMatch(.*)*', name: 'not-found', component: () => import('@/views/NotFoundView.vue') },
]

// Use memory history for SSR, web history for client
const history = typeof window !== 'undefined' 
  ? createWebHistory(import.meta.env.BASE_URL) 
  : createMemoryHistory(import.meta.env.BASE_URL)

const router = createRouter({
  history,
  routes,
  scrollBehavior() {
    return { top: 0, behavior: 'auto' }
  }
})

export default router

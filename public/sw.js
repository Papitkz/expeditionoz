const CACHE_NAME = 'expedition-oz-v1'
const STATIC_CACHE = 'expedition-oz-static-v1'
const IMAGE_CACHE = 'expedition-oz-images-v1'

const PRECACHE_URLS = [
  '/',
  '/expeditions',
  '/about',
  '/contact',
  '/faq',
  '/blog',
  '/offline',
]

// Install: precache shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(PRECACHE_URLS)).then(() => self.skipWaiting())
  )
})

// Activate: clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME && key !== STATIC_CACHE && key !== IMAGE_CACHE)
          .map((key) => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  )
})

// Fetch: network-first for HTML, cache-first for assets
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Skip non-GET and non-same-origin (except fonts/cdn)
  if (request.method !== 'GET') return
  if (!url.protocol.startsWith('http')) return

  // Images: cache-first
  if (request.destination === 'image') {
    event.respondWith(
      caches.open(IMAGE_CACHE).then(async (cache) => {
        const cached = await cache.match(request)
        if (cached) return cached
        try {
          const response = await fetch(request)
          if (response.ok) cache.put(request, response.clone())
          return response
        } catch {
          return new Response('', { status: 404 })
        }
      })
    )
    return
  }

  // Static assets: cache-first
  if (url.pathname.match(/\.(js|css|woff2?|ttf|svg|ico)$/)) {
    event.respondWith(
      caches.open(STATIC_CACHE).then(async (cache) => {
        const cached = await cache.match(request)
        if (cached) return cached
        const response = await fetch(request)
        if (response.ok) cache.put(request, response.clone())
        return response
      })
    )
    return
  }

  // HTML / navigation: network-first, fallback to cache, then offline page
  if (request.mode === 'navigate' || request.destination === 'document') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const clone = response.clone()
          caches.open(STATIC_CACHE).then((cache) => cache.put(request, clone))
          return response
        })
        .catch(async () => {
          const cached = await caches.match(request)
          if (cached) return cached
          const offline = await caches.match('/offline')
          return offline || new Response('Offline', { status: 503 })
        })
    )
    return
  }
})

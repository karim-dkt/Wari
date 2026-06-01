const CACHE = 'wari-v2'

self.addEventListener('install', (e) => {
  // Pré-cache l'app shell au premier chargement pour garantir l'accès hors connexion
  e.waitUntil(
    caches.open(CACHE)
      .then(cache => cache.add('./'))
      .then(() => self.skipWaiting())
  )
})

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', (e) => {
  const { request } = e
  const url = new URL(request.url)

  if (request.method !== 'GET' || !url.protocol.startsWith('http')) return

  // Supabase API : réseau en priorité, cache en secours
  if (url.hostname.includes('supabase.co')) {
    e.respondWith(
      fetch(request)
        .then(res => {
          if (res.ok) {
            const clone = res.clone()
            caches.open(CACHE).then(c => c.put(request, clone))
          }
          return res
        })
        .catch(() => caches.match(request))
    )
    return
  }

  // Navigation : réseau en priorité, fallback sur index.html mis en cache
  if (request.mode === 'navigate') {
    e.respondWith(
      fetch(request)
        .then(res => {
          const clone = res.clone()
          caches.open(CACHE).then(c => c.put(request, clone))
          return res
        })
        .catch(() =>
          caches.match(request)
            .then(cached => cached || caches.match('./') || caches.match('./index.html'))
        )
    )
    return
  }

  // Ressources statiques : cache en priorité, réseau en secours + mise en cache
  e.respondWith(
    caches.match(request).then(cached => {
      if (cached) return cached
      return fetch(request).then(res => {
        if (res.ok) {
          const clone = res.clone()
          caches.open(CACHE).then(c => c.put(request, clone))
        }
        return res
      })
    })
  )
})

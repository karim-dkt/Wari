const CACHE      = 'wari-__BUILD__'
const CACHE_DATA = 'wari-data'

// Pré-cache l'app shell et les fichiers qu'il référence, pour que l'app s'ouvre
// hors connexion dès la première visite
const preCacher = async () => {
  const cache = await caches.open(CACHE)
  await cache.addAll(['./', './manifest.json', './icon.svg'])
  const html = await (await cache.match('./')).text()
  const assets = html.match(/assets\/[^"']+/g) ?? []
  await cache.addAll(assets.map(a => `./${a}`))

  // Les polices ne sont référencées que par la feuille de style
  const feuille = assets.find(a => a.endsWith('.css'))
  if (!feuille) return
  const css = await (await cache.match(`./${feuille}`)).text()
  const polices = [...css.matchAll(/url\(\.?\/?(?:assets\/)?([^)]+\.woff2)\)/g)].map(m => m[1])
  await cache.addAll([...new Set(polices)].map(p => `./assets/${p}`))
}

self.addEventListener('install', (e) => {
  e.waitUntil(preCacher().then(() => self.skipWaiting()))
})

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE && k !== CACHE_DATA).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', (e) => {
  const { request } = e
  const url = new URL(request.url)

  if (request.method !== 'GET' || !url.protocol.startsWith('http')) return

  if (url.hostname.includes('supabase.co')) {
    // Seules les données sont mises en cache (jamais l'authentification)
    if (!url.pathname.startsWith('/rest/v1/')) return

    // Réseau en priorité, cache en secours
    e.respondWith(
      fetch(request)
        .then(res => {
          if (res.ok) {
            const clone = res.clone()
            caches.open(CACHE_DATA).then(c => c.put(request, clone))
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
          caches.match(request).then(cached => cached || caches.match('./'))
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

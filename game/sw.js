/* Tech Tinker: System Rescue service worker v1.0.0 */
'use strict';

const CACHE_PREFIX = 'tt-system-rescue-';
const CACHE_NAME = CACHE_PREFIX + 'v1.0.0';
const APP_ROOT = '/game/';
const CORE = [
  '/game/',
  '/game/index.html',
  '/game/styles.css',
  '/game/game.js',
  '/game/questions.js',
  '/game/pwa.js',
  '/game/manifest.webmanifest',
  '/game/icons/apple-touch-icon.png',
  '/game/icons/icon-192.png',
  '/game/icons/icon-512.png'
];

async function putIfOk(cache, request) {
  try {
    const response = await fetch(request, { cache: 'reload' });
    if (response && response.ok) {
      await cache.put(request, response.clone());
      return response;
    }
  } catch (_) {}
  return null;
}

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await Promise.allSettled(CORE.map(url => putIfOk(cache, url)));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(
      names
        .filter(name => name.startsWith(CACHE_PREFIX) && name !== CACHE_NAME)
        .map(name => caches.delete(name))
    );
    await self.clients.claim();
  })());
});

async function networkFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  try {
    const response = await fetch(request);
    if (response && response.ok) await cache.put(request, response.clone());
    return response;
  } catch (_) {
    return (await cache.match(request)) ||
           (await cache.match(APP_ROOT)) ||
           Response.error();
  }
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);
  const update = fetch(request).then(async response => {
    if (response && response.ok) {
      await cache.put(request, response.clone());
      return response;
    }
    return null;
  }).catch(() => null);

  if (cached) {
    update.catch(() => null);
    return cached;
  }
  return (await update) || Response.error();
}

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (!url.pathname.startsWith(APP_ROOT)) return;

  if (request.mode === 'navigate') {
    event.respondWith(networkFirst(request));
    return;
  }

  event.respondWith(staleWhileRevalidate(request));
});

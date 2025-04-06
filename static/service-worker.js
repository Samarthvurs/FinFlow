// FinFlow Service Worker

const CACHE_NAME = 'finflow-cache-v1';
const urlsToCache = [
    '/',
    '/static/css/style.css',
    '/static/manifest.json',
    '/static/icons/icon-192x192.png',
    '/static/icons/icon-512x512.png',
    '/login',
    '/signup',
    '/page1',
    '/page2',
    '/payment'
];

// Install event - cache assets
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Opened cache');
                return cache.addAll(urlsToCache);
            })
    );
});

// Fetch event - serve from cache if available
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // Cache hit - return the response
                if (response) {
                    return response;
                }

                // Clone the request
                const fetchRequest = event.request.clone();

                // Not a cacheable request, ignore API calls, just fetch
                if (fetchRequest.url.includes('/api/')) {
                    return fetch(fetchRequest);
                }

                return fetch(fetchRequest).then(
                    response => {
                        // Check if we received a valid response
                        if (!response || response.status !== 200 || response.type !== 'basic') {
                            return response;
                        }

                        // Clone the response
                        const responseToCache = response.clone();

                        caches.open(CACHE_NAME)
                            .then(cache => {
                                cache.put(event.request, responseToCache);
                            });

                        return response;
                    }
                );
            })
            .catch(() => {
                // If both cache and network fail, show offline page
                if (event.request.url.includes('/api/')) {
                    // Return empty data for API calls
                    if (event.request.url.includes('/api/summary')) {
                        return new Response(JSON.stringify({
                            monthly_spent: 0,
                            weekly_spent: 0,
                            transactions: 0,
                            amount_left: 0
                        }));
                    } else if (event.request.url.includes('/api/transactions')) {
                        return new Response(JSON.stringify([]));
                    }
                }
            })
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
    const cacheWhitelist = [CACHE_NAME];
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheWhitelist.indexOf(cacheName) === -1) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
}); 
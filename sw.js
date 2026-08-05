// ============================================================
// SERVICE WORKER - COMPLETE FINAL FOR NOTIFICATIONS
// ============================================================

const CACHE_NAME = 'wings-erp-v3';

const urlsToCache = [
    '/',
    '/index.html',
    'https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.5.2/css/all.min.css',
    'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap',
    'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js',
    'https://cdn.jsdelivr.net/npm/sweetalert2@11',
    'https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js',
    'https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js',
    'https://cdn.jsdelivr.net/npm/cropperjs@1.5.12/dist/cropper.min.js',
    'https://cdn.jsdelivr.net/npm/cropperjs@1.5.12/dist/cropper.min.css',
    'https://cdn.jsdelivr.net/npm/html2pdf.js@0.10.1/dist/html2pdf.bundle.min.js',
    'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js'
];

// ============================================================
// ✅ INSTALL EVENT
// ============================================================
self.addEventListener('install', function(event) {
    console.log('[SW] 📥 Installing...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(function(cache) {
                console.log('[SW] 📦 Caching files...');
                return cache.addAll(urlsToCache);
            })
            .then(function() {
                console.log('[SW] ✅ Cache added!');
                return self.skipWaiting();
            })
            .catch(function(err) {
                console.error('[SW] ❌ Cache error:', err);
            })
    );
});

// ============================================================
// ✅ ACTIVATE EVENT
// ============================================================
self.addEventListener('activate', function(event) {
    console.log('[SW] 🔄 Activating...');
    event.waitUntil(
        caches.keys().then(function(cacheNames) {
            return Promise.all(
                cacheNames.map(function(cacheName) {
                    if (cacheName !== CACHE_NAME) {
                        console.log('[SW] 🗑️ Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(function() {
            console.log('[SW] ✅ Claiming clients...');
            return self.clients.claim();
        })
    );
});

// ============================================================
// ✅ FETCH EVENT
// ============================================================
self.addEventListener('fetch', function(event) {
    const requestUrl = new URL(event.request.url);
    
    if (requestUrl.origin !== location.origin) {
        if (requestUrl.hostname.includes('cdn.jsdelivr.net') || 
            requestUrl.hostname.includes('fonts.googleapis.com') ||
            requestUrl.hostname.includes('fonts.gstatic.com')) {
            event.respondWith(
                caches.match(event.request)
                    .then(function(response) {
                        return response || fetch(event.request)
                            .then(function(networkResponse) {
                                return caches.open(CACHE_NAME)
                                    .then(function(cache) {
                                        cache.put(event.request, networkResponse.clone());
                                        return networkResponse;
                                    });
                            })
                            .catch(function() {
                                return new Response('Network error', { status: 408 });
                            });
                    })
            );
            return;
        }
        return;
    }
    
    if (event.request.mode === 'navigate') {
        event.respondWith(
            fetch(event.request)
                .then(function(response) {
                    return caches.open(CACHE_NAME)
                        .then(function(cache) {
                            cache.put(event.request, response.clone());
                            return response;
                        });
                })
                .catch(function() {
                    return caches.match(event.request)
                        .then(function(cachedResponse) {
                            if (cachedResponse) return cachedResponse;
                            return caches.match('/index.html');
                        });
                })
        );
        return;
    }
    
    event.respondWith(
        caches.match(event.request)
            .then(function(response) {
                if (response) return response;
                return fetch(event.request)
                    .then(function(networkResponse) {
                        if (networkResponse && networkResponse.status === 200) {
                            return caches.open(CACHE_NAME)
                                .then(function(cache) {
                                    cache.put(event.request, networkResponse.clone());
                                    return networkResponse;
                                });
                        }
                        return networkResponse;
                    })
                    .catch(function() {
                        return new Response('Offline', { status: 503 });
                    });
            })
    );
});

// ============================================================
// ✅ 🔥 PUSH NOTIFICATION (IMPORTANT FOR APK)
// ============================================================
self.addEventListener('push', function(event) {
    console.log('[SW] 📨 Push received:', event);
    
    let data = {
        title: '🔔 Wings Convent',
        body: 'You have a new notification!',
        icon: '/icons/icon-192.png',
        badge: '/icons/icon-192.png',
        vibrate: [200, 100, 200],
        data: { url: '/' }
    };
    
    try {
        if (event.data) {
            const parsed = event.data.json();
            data.title = parsed.title || data.title;
            data.body = parsed.body || data.body;
            data.data.url = parsed.url || '/';
        }
    } catch (e) {
        console.log('[SW] Push parse error:', e);
    }
    
    event.waitUntil(
        self.registration.showNotification(data.title, {
            body: data.body,
            icon: data.icon,
            badge: data.badge,
            vibrate: data.vibrate,
            data: data.data,
            requireInteraction: true,
            actions: [
                { action: 'open', title: '📖 Open' },
                { action: 'close', title: '✖ Close' }
            ]
        })
    );
});

// ============================================================
// ✅ 🔥 NOTIFICATION CLICK (IMPORTANT FOR APK)
// ============================================================
self.addEventListener('notificationclick', function(event) {
    console.log('[SW] 👆 Notification clicked:', event);
    event.notification.close();
    if (event.action === 'close') return;
    
    const url = event.notification.data?.url || '/';
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true })
            .then(function(clientList) {
                for (let client of clientList) {
                    if (client.url === url && 'focus' in client) {
                        return client.focus();
                    }
                }
                if (clients.openWindow) {
                    return clients.openWindow(url);
                }
            })
    );
});

// ============================================================
// ✅ MESSAGE FROM CLIENT
// ============================================================
self.addEventListener('message', function(event) {
    console.log('[SW] 💬 Message:', event.data);
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});

console.log('✅ Service Worker v3 Loaded Successfully!');
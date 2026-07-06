// ======================= SERVICE WORKER FOR PUSH NOTIFICATIONS =======================
console.log('✅ Service Worker loaded');

// ======================= INSTALL EVENT =======================
self.addEventListener('install', function(event) {
    console.log('✅ Service Worker installed');
    self.skipWaiting();
});

// ======================= ACTIVATE EVENT =======================
self.addEventListener('activate', function(event) {
    console.log('✅ Service Worker activated');
    event.waitUntil(clients.claim());
});

// ======================= PUSH EVENT =======================
self.addEventListener('push', function(event) {
    console.log('📱 Push event received:', event);
    
    let title = '🔔 Wings Convent';
    let body = 'You have a new notification';
    let icon = '/favicon.ico';
    let badge = '/favicon.ico';
    let data = {};
    let tag = 'notification-' + Date.now();
    
    try {
        if (event.data) {
            const payload = event.data.json();
            title = payload.title || title;
            body = payload.body || body;
            icon = payload.icon || icon;
            badge = payload.badge || badge;
            data = payload.data || data;
            tag = payload.tag || tag;
        }
    } catch (error) {
        console.error('❌ Push data parse error:', error);
    }
    
    event.waitUntil(
        self.registration.showNotification(title, {
            body: body,
            icon: icon,
            badge: badge,
            vibrate: [200, 100, 200],
            data: data,
            requireInteraction: true,
            tag: tag,
            actions: [
                { action: 'open', title: '📖 View' },
                { action: 'dismiss', title: '❌ Dismiss' }
            ]
        })
    );
});

// ======================= NOTIFICATION CLICK EVENT =======================
self.addEventListener('notificationclick', function(event) {
    console.log('📱 Notification clicked:', event);
    
    event.notification.close();
    
    const action = event.action;
    const data = event.notification.data || {};
    
    if (action === 'dismiss') {
        return;
    }
    
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true })
            .then(function(clientList) {
                // Focus existing window
                for (let i = 0; i < clientList.length; i++) {
                    const client = clientList[i];
                    if (client.url.includes('/') && 'focus' in client) {
                        client.focus();
                        // Send message to client
                        client.postMessage({
                            type: 'push',
                            data: data
                        });
                        return client;
                    }
                }
                // Open new window
                if (clients.openWindow) {
                    return clients.openWindow('/');
                }
            })
    );
});

// ======================= MESSAGE EVENT =======================
self.addEventListener('message', function(event) {
    console.log('📱 Service Worker message:', event.data);
    
    if (event.data && event.data.type === 'sendPush') {
        const notificationData = event.data;
        self.registration.showNotification(notificationData.title, {
            body: notificationData.body,
            icon: notificationData.icon || '/favicon.ico',
            badge: notificationData.badge || '/favicon.ico',
            vibrate: [200, 100, 200],
            data: notificationData.data || {},
            requireInteraction: true,
            tag: 'notification-' + Date.now()
        });
    }
});

console.log('✅ Service Worker ready for push notifications!');
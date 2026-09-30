/**
 * Winter Arc Service Worker
 * Handles real background push notifications and action clicks when the tab is closed.
 */

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Background Push Notification Listener
self.addEventListener('push', (event) => {
  let title = 'Winter Arc — Hydration Reminder';
  let body = 'Time for some water. Stay consistent.';
  let icon = '/icon-192.png';
  let badge = '/icon-192.png';
  let tag = 'winter-arc-hydration';
  let data = { url: '/?action=hydration', timestamp: Date.now() };

  if (event.data) {
    try {
      const payload = event.data.json();
      if (payload.title) title = payload.title;
      if (payload.body) body = payload.body;
      if (payload.icon) icon = payload.icon;
      if (payload.badge) badge = payload.badge;
      if (payload.tag) tag = payload.tag;
      if (payload.data) data = { ...data, ...payload.data };
    } catch (e) {
      body = event.data.text() || body;
    }
  }

  const options = {
    body,
    icon,
    badge,
    tag,
    renotify: true,
    requireInteraction: false,
    data,
    actions: [
      { action: 'log_250', title: '+250 ml Water' },
      { action: 'snooze_30', title: 'Snooze 30 min' },
    ],
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// Notification Click Handler (Actions: Log water, Snooze, or Open App)
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const action = event.action;
  const targetUrl = event.notification.data?.url || '/?action=hydration';

  if (action === 'snooze_30') {
    // Send background snooze request to backend
    event.waitUntil(
      fetch('/api/notifications/snooze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ minutes: 30 }),
      }).catch((err) => {
        console.error('Snooze request failed:', err);
      })
    );
    return;
  }

  if (action === 'log_250') {
    // Log 250ml water directly via backend
    event.waitUntil(
      fetch('/api/notifications/log-water', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amountMl: 250 }),
      })
        .then(() => {
          return self.clients.matchAll({ type: 'window', includeUncontrolled: true });
        })
        .then((clientList) => {
          // If window already open, message it
          for (const client of clientList) {
            client.postMessage({ type: 'WATER_LOGGED', amountMl: 250 });
          }
        })
        .catch((err) => {
          console.error('Log water from notification failed:', err);
        })
    );
    return;
  }

  // Default click on notification body: focus or open the Winter Arc web app
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});

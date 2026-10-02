/**
 * Client-Side Notification & Web Push Service
 * Handles Service Worker registration, Web Push subscription, VAPID key negotiation,
 * permission states, test push delivery, and offline fallback.
 */

export type NotificationPermissionState = 'granted' | 'denied' | 'default' | 'unsupported';

export interface PushStatusResponse {
  subscribed: boolean;
  enabled: boolean;
  activeHours: string;
  intervalMinutes: number;
  timezone?: string;
  lastSentAt?: string;
  nextReminderText: string;
}

// Convert VAPID base64 string to Uint8Array for PushManager
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function isPushNotificationSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  );
}

export function getNotificationPermission(): NotificationPermissionState {
  if (!isPushNotificationSupported()) return 'unsupported';
  return Notification.permission as NotificationPermissionState;
}

/**
 * Registers the service worker with the browser
 */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) return null;

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
    });
    await navigator.serviceWorker.ready;
    return registration;
  } catch (error) {
    console.error('Service worker registration failed:', error);
    return null;
  }
}

/**
 * Subscribes the current device to background push notifications
 */
export async function subscribeToHydrationPush(settings: {
  enabled: boolean;
  intervalMinutes: number;
  startTime: string;
  endTime: string;
  timezone: string;
  hydrationGoalMl: number;
}): Promise<{
  success: boolean;
  permission: NotificationPermissionState;
  error?: string;
}> {
  if (!isPushNotificationSupported()) {
    return { success: false, permission: 'unsupported', error: 'Push notifications are not supported in this browser' };
  }

  // 1. Request Browser Notification Permission
  let permission: NotificationPermissionState = Notification.permission as NotificationPermissionState;
  if (permission === 'default') {
    const result = await Notification.requestPermission();
    permission = result as NotificationPermissionState;
  }

  if (permission !== 'granted') {
    return {
      success: false,
      permission,
      error: permission === 'denied' ? 'Notifications blocked by browser' : 'Permission was not granted',
    };
  }

  try {
    // 2. Register Service Worker
    const registration = await registerServiceWorker();
    if (!registration) {
      return { success: false, permission, error: 'Could not activate Service Worker' };
    }

    // 3. Fetch VAPID Public Key from backend
    const vapidRes = await fetch('/api/notifications/vapid-public-key');
    if (!vapidRes.ok) {
      throw new Error('Failed to retrieve VAPID key from backend');
    }
    const { publicKey } = await vapidRes.json();

    // 4. Subscribe via browser PushManager
    let subscription = await registration.pushManager.getSubscription();
    if (!subscription) {
      const applicationServerKey = urlBase64ToUint8Array(publicKey);
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey as unknown as BufferSource,
      });
    }

    // 5. Transmit subscription & settings to backend
    const subRes = await fetch('/api/notifications/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subscription: subscription.toJSON(),
        settings,
      }),
    });

    if (!subRes.ok) {
      throw new Error('Failed to register subscription with server');
    }

    return { success: true, permission: 'granted' };
  } catch (err: unknown) {
    const error = err as Error;
    console.error('Subscription error:', error);
    return { success: false, permission, error: error.message || 'Push subscription failed' };
  }
}

/**
 * Unsubscribes the device from background push notifications
 */
export async function unsubscribeFromHydrationPush(): Promise<boolean> {
  if (!isPushNotificationSupported()) return false;

  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    if (subscription) {
      await fetch('/api/notifications/unsubscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint: subscription.endpoint }),
      });
      await subscription.unsubscribe();
    }
    return true;
  } catch (err) {
    console.error('Unsubscribe error:', err);
    return false;
  }
}

/**
 * Sends an immediate background test push to verify delivery
 */
export async function sendTestBackgroundPush(): Promise<{ success: boolean; message: string }> {
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    if (subscription) {
      const res = await fetch('/api/notifications/test-push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint: subscription.endpoint }),
      });

      const data = await res.json();
      if (res.ok) {
        return { success: true, message: 'Test background notification sent! Check your notification tray.' };
      }
    }

    // Fallback: trigger notification directly via service worker with full custom logo
    if (registration && 'showNotification' in registration && Notification.permission === 'granted') {
      const iconUrl = new URL('/icon-192.png', window.location.origin).href;
      const badgeUrl = new URL('/icon-badge.png', window.location.origin).href;
      await (registration as unknown as { showNotification: (t: string, o?: unknown) => Promise<void> }).showNotification('Winter Arc — Hydration Reminder', {
        body: 'Time for some water. Stay consistent.',
        icon: iconUrl,
        badge: badgeUrl,
        tag: `winter-arc-hydration-test-${Date.now()}`,
        renotify: true,
        data: { url: '/?action=hydration', timestamp: Date.now() },
        actions: [
          { action: 'log_250', title: '+250 ml Water' },
          { action: 'snooze_30', title: 'Snooze 30 min' },
        ],
      });
      return { success: true, message: 'Test notification sent! Check your notification tray.' };
    }

    if (!subscription) {
      return { success: false, message: 'Please enable notifications before testing.' };
    }

    return { success: false, message: 'Failed to send test notification.' };
  } catch (err: unknown) {
    return { success: false, message: (err as Error).message || 'Failed to send test notification.' };
  }
}

/**
 * Snoozes the background hydration reminder
 */
export async function snoozeHydrationReminder(minutes = 30): Promise<boolean> {
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    const res = await fetch('/api/notifications/snooze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        endpoint: subscription?.endpoint,
        minutes,
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Retrieves the current push status and next scheduled reminder time
 */
export async function getHydrationPushStatus(): Promise<PushStatusResponse> {
  try {
    let endpoint = '';
    if (isPushNotificationSupported() && navigator.serviceWorker.controller) {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) endpoint = sub.endpoint;
    }

    const res = await fetch(`/api/notifications/status?endpoint=${encodeURIComponent(endpoint)}`);
    if (!res.ok) throw new Error('Status fetch failed');
    return await res.json();
  } catch {
    return {
      subscribed: false,
      enabled: false,
      activeHours: '06:00 – 21:00',
      intervalMinutes: 120,
      nextReminderText: 'Enable notifications in Settings',
    };
  }
}

/**
 * Logs water to the backend
 */
export async function logWaterApi(amountMl: number, date?: string): Promise<{ totalMl: number } | null> {
  try {
    const res = await fetch('/api/notifications/log-water', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amountMl, date }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return { totalMl: data.totalMl };
  } catch {
    return null;
  }
}

/**
 * Gets today's logged water from backend
 */
export async function getTodayHydrationApi(date?: string): Promise<{ totalMl: number } | null> {
  try {
    const res = await fetch(`/api/notifications/hydration-today?date=${encodeURIComponent(date || '')}`);
    if (!res.ok) return null;
    const data = await res.json();
    return { totalMl: data.record?.totalMl || 0 };
  } catch {
    return null;
  }
}

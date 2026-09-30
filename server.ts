import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import webpush from 'web-push';
import { createServer as createViteServer } from 'vite';

const app = express();
const port = 3000;

app.use(express.json());

// Persistent data directory
const dataDir = path.resolve(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// 1. Initialize or load VAPID Keys
const vapidFilePath = path.join(dataDir, 'vapid.json');
let vapidKeys: { publicKey: string; privateKey: string };

if (fs.existsSync(vapidFilePath)) {
  try {
    vapidKeys = JSON.parse(fs.readFileSync(vapidFilePath, 'utf-8'));
  } catch {
    vapidKeys = webpush.generateVAPIDKeys();
    fs.writeFileSync(vapidFilePath, JSON.stringify(vapidKeys, null, 2));
  }
} else {
  vapidKeys = webpush.generateVAPIDKeys();
  fs.writeFileSync(vapidFilePath, JSON.stringify(vapidKeys, null, 2));
}

webpush.setVapidDetails(
  'mailto:support@winterarc.local',
  vapidKeys.publicKey,
  vapidKeys.privateKey
);

// 2. Storage for Push Subscriptions
interface StoredSubscription {
  id: string;
  subscription: webpush.PushSubscription;
  settings: {
    enabled: boolean;
    intervalMinutes: number;
    startTime: string; // e.g. "06:00"
    endTime: string; // e.g. "21:00"
    timezone: string; // e.g. "Asia/Kolkata" or "America/New_York"
    hydrationGoalMl: number;
  };
  lastSentAt?: string;
  snoozedUntil?: string;
  updatedAt: string;
}

const subscriptionsFilePath = path.join(dataDir, 'subscriptions.json');
let subscriptions: StoredSubscription[] = [];

if (fs.existsSync(subscriptionsFilePath)) {
  try {
    subscriptions = JSON.parse(fs.readFileSync(subscriptionsFilePath, 'utf-8'));
  } catch (err) {
    subscriptions = [];
  }
}

function saveSubscriptions() {
  fs.writeFileSync(subscriptionsFilePath, JSON.stringify(subscriptions, null, 2));
}

// 3. Storage for Daily Hydration Logs
interface HydrationRecord {
  date: string; // "YYYY-MM-DD"
  totalMl: number;
  goalMl: number;
  logs: { id: string; amountMl: number; timestamp: string }[];
}

const hydrationFilePath = path.join(dataDir, 'hydration.json');
let hydrationData: Record<string, HydrationRecord> = {};

if (fs.existsSync(hydrationFilePath)) {
  try {
    hydrationData = JSON.parse(fs.readFileSync(hydrationFilePath, 'utf-8'));
  } catch {
    hydrationData = {};
  }
}

function saveHydrationData() {
  fs.writeFileSync(hydrationFilePath, JSON.stringify(hydrationData, null, 2));
}

// Helper: Get formatted date and time in user's timezone
function getUserDateTime(now: Date, timezone: string) {
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone || 'UTC',
      hour12: false,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
    const parts = formatter.formatToParts(now);
    const getPart = (type: string) => parts.find((p) => p.type === type)?.value || '';

    const year = getPart('year');
    const month = getPart('month');
    const day = getPart('day');
    const hour = parseInt(getPart('hour'), 10);
    const minute = parseInt(getPart('minute'), 10);

    return {
      dateStr: `${year}-${month}-${day}`,
      hours: hour,
      minutes: minute,
      timeStr: `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`,
    };
  } catch (err) {
    return {
      dateStr: now.toISOString().split('T')[0],
      hours: now.getUTCHours(),
      minutes: now.getUTCMinutes(),
      timeStr: '12:00',
    };
  }
}

// ----------------------------------------------------
// API Endpoints
// ----------------------------------------------------

// GET VAPID Public Key for client subscription
app.get('/api/notifications/vapid-public-key', (_req: Request, res: Response) => {
  res.json({ publicKey: vapidKeys.publicKey });
});

// POST Subscribe / Update Subscription
app.post('/api/notifications/subscribe', (req: Request, res: Response) => {
  const { subscription, settings } = req.body;
  if (!subscription || !subscription.endpoint) {
    return res.status(400).json({ error: 'Valid push subscription is required' });
  }

  const existingIndex = subscriptions.findIndex((s) => s.subscription.endpoint === subscription.endpoint);
  const nowIso = new Date().toISOString();

  const newEntry: StoredSubscription = {
    id: subscription.endpoint.slice(-16),
    subscription,
    settings: {
      enabled: settings?.enabled ?? true,
      intervalMinutes: settings?.intervalMinutes || 120,
      startTime: settings?.startTime || '06:00',
      endTime: settings?.endTime || '21:00',
      timezone: settings?.timezone || 'UTC',
      hydrationGoalMl: settings?.hydrationGoalMl || 3500,
    },
    updatedAt: nowIso,
  };

  if (existingIndex >= 0) {
    newEntry.lastSentAt = subscriptions[existingIndex].lastSentAt;
    newEntry.snoozedUntil = subscriptions[existingIndex].snoozedUntil;
    subscriptions[existingIndex] = newEntry;
  } else {
    subscriptions.push(newEntry);
  }

  saveSubscriptions();
  res.json({ success: true, message: 'Hydration push notification subscribed successfully' });
});

// POST Unsubscribe
app.post('/api/notifications/unsubscribe', (req: Request, res: Response) => {
  const { endpoint } = req.body;
  if (!endpoint) {
    return res.status(400).json({ error: 'Endpoint required' });
  }

  subscriptions = subscriptions.filter((s) => s.subscription.endpoint !== endpoint);
  saveSubscriptions();
  res.json({ success: true, message: 'Unsubscribed' });
});

// POST Update Settings
app.post('/api/notifications/settings', (req: Request, res: Response) => {
  const { endpoint, settings } = req.body;
  const sub = subscriptions.find((s) => !endpoint || s.subscription.endpoint === endpoint);

  if (sub) {
    sub.settings = { ...sub.settings, ...settings };
    sub.updatedAt = new Date().toISOString();
    saveSubscriptions();
    return res.json({ success: true, settings: sub.settings });
  }

  res.json({ success: true, message: 'Settings saved' });
});

// POST Snooze Reminder by X minutes
app.post('/api/notifications/snooze', (req: Request, res: Response) => {
  const { endpoint, minutes = 30 } = req.body;
  const snoozeUntil = new Date(Date.now() + minutes * 60 * 1000).toISOString();

  for (const s of subscriptions) {
    if (!endpoint || s.subscription.endpoint === endpoint) {
      s.snoozedUntil = snoozeUntil;
    }
  }

  saveSubscriptions();
  res.json({ success: true, snoozedUntil: snoozeUntil, message: `Hydration reminder snoozed for ${minutes} minutes.` });
});

// POST Immediate Test Push (allows user to verify delivery even when tab is closed)
app.post('/api/notifications/test-push', async (req: Request, res: Response) => {
  const { endpoint } = req.body;
  const sub = subscriptions.find((s) => !endpoint || s.subscription.endpoint === endpoint);

  if (!sub) {
    return res.status(404).json({ error: 'No active push subscription found to test' });
  }

  const payload = JSON.stringify({
    title: 'Winter Arc — Hydration Reminder',
    body: 'Time for some water. Stay consistent.',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag: `winter-arc-hydration-test-${Date.now()}`,
    data: {
      url: '/?action=hydration',
      timestamp: Date.now(),
    },
    actions: [
      { action: 'log_250', title: '+250 ml Water' },
      { action: 'snooze_30', title: 'Snooze 30 min' },
    ],
  });

  try {
    await webpush.sendNotification(sub.subscription, payload);
    sub.lastSentAt = new Date().toISOString();
    saveSubscriptions();
    res.json({ success: true, message: 'Test background push notification sent successfully' });
  } catch (err: unknown) {
    const error = err as { statusCode?: number; message?: string };
    if (error.statusCode === 410 || error.statusCode === 404) {
      subscriptions = subscriptions.filter((s) => s.subscription.endpoint !== sub.subscription.endpoint);
      saveSubscriptions();
    }
    res.status(500).json({ error: 'Failed to send push notification', details: error.message });
  }
});

// POST Log Water
app.post('/api/notifications/log-water', (req: Request, res: Response) => {
  const { amountMl, date } = req.body;
  const amount = Number(amountMl) || 250;
  const targetDate = date || new Date().toISOString().split('T')[0];

  if (!hydrationData[targetDate]) {
    hydrationData[targetDate] = {
      date: targetDate,
      totalMl: 0,
      goalMl: 3500,
      logs: [],
    };
  }

  hydrationData[targetDate].totalMl += amount;
  hydrationData[targetDate].logs.push({
    id: `log-${Date.now()}`,
    amountMl: amount,
    timestamp: new Date().toISOString(),
  });

  saveHydrationData();
  res.json({
    success: true,
    totalMl: hydrationData[targetDate].totalMl,
    record: hydrationData[targetDate],
  });
});

// GET Hydration for Today
app.get('/api/notifications/hydration-today', (req: Request, res: Response) => {
  const targetDate = (req.query.date as string) || new Date().toISOString().split('T')[0];
  const record = hydrationData[targetDate] || {
    date: targetDate,
    totalMl: 0,
    goalMl: 3500,
    logs: [],
  };
  res.json({ record });
});

// GET Notification Status & Next Reminder Time
app.get('/api/notifications/status', (req: Request, res: Response) => {
  const endpoint = req.query.endpoint as string;
  const sub = subscriptions.find((s) => !endpoint || s.subscription.endpoint === endpoint);

  if (!sub) {
    return res.json({
      subscribed: false,
      enabled: false,
      activeHours: '06:00 – 21:00',
      intervalMinutes: 120,
      nextReminderText: 'Enable notifications in Settings',
    });
  }

  const now = new Date();
  const userTime = getUserDateTime(now, sub.settings.timezone);

  // Parse start and end hours
  const [startH] = sub.settings.startTime.split(':').map(Number);
  const [endH] = sub.settings.endTime.split(':').map(Number);

  let nextReminderText = 'Active (Every 2 hours)';
  if (sub.snoozedUntil && new Date(sub.snoozedUntil).getTime() > now.getTime()) {
    const snoozeDate = new Date(sub.snoozedUntil);
    const snoozeTime = getUserDateTime(snoozeDate, sub.settings.timezone);
    nextReminderText = `Snoozed until ${snoozeTime.timeStr}`;
  } else if (userTime.hours < startH || userTime.hours >= endH) {
    nextReminderText = `Active hours: ${sub.settings.startTime} – ${sub.settings.endTime}`;
  } else if (sub.lastSentAt) {
    const nextDate = new Date(new Date(sub.lastSentAt).getTime() + sub.settings.intervalMinutes * 60 * 1000);
    const nextTime = getUserDateTime(nextDate, sub.settings.timezone);
    nextReminderText = `Next reminder around ${nextTime.timeStr}`;
  }

  res.json({
    subscribed: true,
    enabled: sub.settings.enabled,
    intervalMinutes: sub.settings.intervalMinutes,
    activeHours: `${sub.settings.startTime} – ${sub.settings.endTime}`,
    timezone: sub.settings.timezone,
    lastSentAt: sub.lastSentAt,
    nextReminderText,
  });
});

// ----------------------------------------------------
// Scheduled Background Push Evaluator
// Runs every 30 seconds to evaluate due hydration reminders
// ----------------------------------------------------
setInterval(async () => {
  const now = new Date();

  for (let i = subscriptions.length - 1; i >= 0; i--) {
    const sub = subscriptions[i];
    if (!sub.settings.enabled) continue;

    // Check if snooze is active
    if (sub.snoozedUntil) {
      if (new Date(sub.snoozedUntil).getTime() > now.getTime()) {
        continue;
      }
      // Snooze expired: clear it
      sub.snoozedUntil = undefined;
    }

    const userTime = getUserDateTime(now, sub.settings.timezone);
    const [startH, startM = 0] = sub.settings.startTime.split(':').map(Number);
    const [endH, endM = 0] = sub.settings.endTime.split(':').map(Number);

    const currentTotalMin = userTime.hours * 60 + userTime.minutes;
    const startTotalMin = startH * 60 + startM;
    const endTotalMin = endH * 60 + endM;

    // Must be within user's active hours
    if (currentTotalMin < startTotalMin || currentTotalMin > endTotalMin) {
      continue;
    }

    // Check interval elapsed since last reminder sent
    if (sub.lastSentAt) {
      const elapsedMinutes = (now.getTime() - new Date(sub.lastSentAt).getTime()) / (1000 * 60);
      if (elapsedMinutes < sub.settings.intervalMinutes - 0.5) {
        continue;
      }
    }

    // Deliver background push notification
    const payload = JSON.stringify({
      title: 'Winter Arc — Hydration Reminder',
      body: 'Time for some water. Stay consistent.',
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      tag: `winter-arc-hydration-${userTime.dateStr}-${userTime.hours}`,
      data: {
        url: '/?action=hydration',
        timestamp: Date.now(),
      },
      actions: [
        { action: 'log_250', title: '+250 ml Water' },
        { action: 'snooze_30', title: 'Snooze 30 min' },
      ],
    });

    try {
      await webpush.sendNotification(sub.subscription, payload);
      sub.lastSentAt = now.toISOString();
      saveSubscriptions();
      console.log(`[Push Sent] Hydration reminder dispatched to device ${sub.id} at ${userTime.timeStr}`);
    } catch (err: unknown) {
      const error = err as { statusCode?: number; message?: string };
      if (error.statusCode === 410 || error.statusCode === 404) {
        console.log(`[Push Expired] Removing inactive push subscription ${sub.id}`);
        subscriptions.splice(i, 1);
        saveSubscriptions();
      } else {
        console.error(`[Push Error] Failed to send reminder to ${sub.id}:`, error.message);
      }
    }
  }
}, 30000);

// ----------------------------------------------------
// Vite Dev Server / Static File Serving
// ----------------------------------------------------
async function startServer() {
  if (process.env.NODE_ENV === 'production' && fs.existsSync(path.resolve(process.cwd(), 'dist'))) {
    app.use(express.static(path.resolve(process.cwd(), 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(process.cwd(), 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`Winter Arc full-stack server running at http://0.0.0.0:${port}`);
  });
}

startServer();

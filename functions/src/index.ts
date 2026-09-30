import { onSchedule } from 'firebase-functions/v2/scheduler';
import * as admin from 'firebase-admin';

admin.initializeApp();
const db = admin.firestore();

/**
 * Scheduled Firebase Cloud Function
 * Runs every 15 minutes to evaluate which users are due for a hydration reminder.
 * Evaluates based on user's timezone, active hours, and configured interval.
 */
export const scheduledHydrationReminder = onSchedule(
  {
    schedule: 'every 15 minutes',
    timeZone: 'UTC',
    retryCount: 2,
  },
  async (event) => {
    const now = new Date();
    const usersSnapshot = await db
      .collection('users')
      .where('settings.hydrationReminderEnabled', '==', true)
      .get();

    for (const userDoc of usersSnapshot.docs) {
      const data = userDoc.data();
      const settings = data.settings || {};
      const fcmToken = data.fcmToken;

      if (!fcmToken) continue;

      const userTimezone = settings.timezone || 'UTC';
      const intervalMinutes = settings.reminderIntervalMinutes || 120;
      const startTime = settings.reminderStart || '06:00';
      const endTime = settings.reminderEnd || '21:00';

      // Check snooze
      if (data.snoozedUntil && new Date(data.snoozedUntil).getTime() > now.getTime()) {
        continue;
      }

      // Check user local time
      let userHour = 12;
      let userMinute = 0;
      try {
        const formatter = new Intl.DateTimeFormat('en-US', {
          timeZone: userTimezone,
          hour12: false,
          hour: '2-digit',
          minute: '2-digit',
        });
        const parts = formatter.formatToParts(now);
        userHour = parseInt(parts.find((p) => p.type === 'hour')?.value || '12', 10);
        userMinute = parseInt(parts.find((p) => p.type === 'minute')?.value || '0', 10);
      } catch {
        userHour = now.getUTCHours();
        userMinute = now.getUTCMinutes();
      }

      const [startH, startM = 0] = startTime.split(':').map(Number);
      const [endH, endM = 0] = endTime.split(':').map(Number);

      const currentMin = userHour * 60 + userMinute;
      const startMin = startH * 60 + startM;
      const endMin = endH * 60 + endM;

      if (currentMin < startMin || currentMin > endMin) {
        continue;
      }

      // Check interval elapsed since last reminder
      if (data.lastReminderSentAt) {
        const lastSent = new Date(data.lastReminderSentAt).getTime();
        const elapsedMin = (now.getTime() - lastSent) / (1000 * 60);
        if (elapsedMin < intervalMinutes - 1) {
          continue;
        }
      }

      // Send Firebase Cloud Messaging push
      try {
        await admin.messaging().send({
          token: fcmToken,
          notification: {
            title: 'Winter Arc — Hydration Reminder',
            body: 'Time for some water. Stay consistent.',
          },
          webpush: {
            notification: {
              icon: '/icon-192.png',
              badge: '/icon-192.png',
              tag: `hydration-${userDoc.id}-${userHour}`,
              actions: [
                { action: 'log_250', title: '+250 ml Water' },
                { action: 'snooze_30', title: 'Snooze 30 min' },
              ],
            },
            data: {
              url: '/?action=hydration',
            },
          },
        });

        // Update lastReminderSentAt for idempotency
        await userDoc.ref.update({
          lastReminderSentAt: now.toISOString(),
          snoozedUntil: admin.firestore.FieldValue.delete(),
        });
      } catch (err: any) {
        if (
          err.code === 'messaging/invalid-registration-token' ||
          err.code === 'messaging/registration-token-not-registered'
        ) {
          await userDoc.ref.update({ fcmToken: admin.firestore.FieldValue.delete() });
        }
      }
    }
  }
);

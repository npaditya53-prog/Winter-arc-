import { HabitDefinition } from '../types/challenge';

// In-memory active timer IDs keyed by habit ID
const activeTimers = new Map<string, number>();

/**
 * Calculates milliseconds until a specific "HH:MM" (24-hour) time today or tomorrow
 */
function getMsUntilTime(timeStr: string): number {
  const [hourStr, minuteStr] = timeStr.split(':');
  const targetHour = parseInt(hourStr, 10);
  const targetMinute = parseInt(minuteStr, 10);

  if (isNaN(targetHour) || isNaN(targetMinute)) {
    return -1;
  }

  const now = new Date();
  const target = new Date();
  target.setHours(targetHour, targetMinute, 0, 0);

  // If the target time already passed today, schedule for tomorrow
  if (target.getTime() <= now.getTime()) {
    target.setDate(target.getDate() + 1);
  }

  return target.getTime() - now.getTime();
}

/**
 * Dispatches a native browser notification for a habit
 */
async function triggerHabitNotification(habit: HabitDefinition): Promise<void> {
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;

  const title = `Winter Arc — ${habit.name}`;
  const body = habit.target
    ? `Discipline check: ${habit.target}. Stay committed.`
    : habit.shortDescription || 'Time to conquer your habit.';

  const iconUrl = new URL('/icon-192.png', window.location.origin).href;
  const badgeUrl = new URL('/icon-badge.png', window.location.origin).href;

  try {
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.ready;
      if (registration && 'showNotification' in registration) {
        await (registration as unknown as { showNotification: (t: string, o?: unknown) => Promise<void> }).showNotification(
          title,
          {
            body,
            icon: iconUrl,
            badge: badgeUrl,
            tag: `winter-arc-habit-${habit.id}`,
            renotify: true,
            data: { url: '/?tab=dashboard', habitId: habit.id },
          }
        );
        return;
      }
    }

    // Direct Notification API fallback
    new Notification(title, {
      body,
      icon: iconUrl,
      badge: badgeUrl,
      tag: `winter-arc-habit-${habit.id}`,
    });
  } catch (err) {
    console.error(`Failed to show notification for habit ${habit.id}:`, err);
  }
}

/**
 * Schedules a recurring daily reminder for a single habit
 */
export function scheduleHabitReminder(habit: HabitDefinition): void {
  // 1. Cancel any existing timer for this habit
  cancelHabitReminder(habit.id);

  // 2. Validate prerequisites
  if (habit.disabled || !habit.reminderEnabled || !habit.reminderTime) {
    return;
  }

  const ms = getMsUntilTime(habit.reminderTime);
  if (ms <= 0) return;

  const timerId = window.setTimeout(async () => {
    await triggerHabitNotification(habit);
    // Automatically reschedule for next day
    scheduleHabitReminder(habit);
  }, ms);

  activeTimers.set(habit.id, timerId);
}

/**
 * Cancels any active timer for a habit
 */
export function cancelHabitReminder(habitId: string): void {
  const existingTimer = activeTimers.get(habitId);
  if (existingTimer !== undefined) {
    window.clearTimeout(existingTimer);
    activeTimers.delete(habitId);
  }
}

/**
 * Synchronizes all habit reminders against the latest list of habits
 */
export function syncAllHabitReminders(habits: HabitDefinition[]): void {
  const currentHabitIds = new Set(habits.map((h) => h.id));

  // Cancel any orphaned timers (habits that were deleted)
  for (const habitId of activeTimers.keys()) {
    if (!currentHabitIds.has(habitId)) {
      cancelHabitReminder(habitId);
    }
  }

  // Schedule or refresh timers for each habit
  for (const habit of habits) {
    if (habit.disabled || !habit.reminderEnabled || !habit.reminderTime) {
      cancelHabitReminder(habit.id);
    } else {
      scheduleHabitReminder(habit);
    }
  }
}

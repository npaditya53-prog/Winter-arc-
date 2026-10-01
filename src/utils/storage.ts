import { DEFAULT_HYDRATION_NOTIFICATIONS, DEFAULT_SETTINGS, getTodayDateString, HABIT_DEFINITIONS } from '../constants/habits';
import { ChallengeSettings, ChallengeState, DayHydrationRecord, DayRecord, HydrationNotificationSettings } from '../types/challenge';
import { getDateForDay, getCurrentDayNumber } from './calculations';

const STORAGE_KEY = 'winter_arc_tracker_v1';

/**
 * Initializes a clean 90-day skeleton with dates mapped to startDate
 */
export function createInitialChallengeState(settings: Partial<ChallengeSettings> = {}): ChallengeState {
  const mergedSettings: ChallengeSettings = {
    ...DEFAULT_SETTINGS,
    ...settings,
    hasStarted: true,
  };

  const days: Record<number, DayRecord> = {};
  const now = new Date().toISOString();

  for (let i = 1; i <= 90; i++) {
    const habits: Record<string, boolean> = {};
    for (const h of HABIT_DEFINITIONS) {
      habits[h.id] = false;
    }

    days[i] = {
      dayNumber: i,
      date: getDateForDay(mergedSettings.startDate, i),
      habits,
      reflection: {
        wentWell: '',
        couldImprove: '',
        notes: '',
      },
      updatedAt: now,
    };
  }

  const todayStr = getTodayDateString();
  const hydration: Record<string, DayHydrationRecord> = {
    [todayStr]: {
      date: todayStr,
      totalMl: 0,
      goalMl: mergedSettings.hydrationGoalMl || 3500,
    },
  };

  return {
    version: 2,
    settings: mergedSettings,
    days,
    hydration,
    hydrationNotifications: { ...DEFAULT_HYDRATION_NOTIFICATIONS },
    createdAt: now,
    lastActiveDayNumber: getCurrentDayNumber(mergedSettings.startDate),
  };
}

/**
 * Loads challenge state from localStorage
 */
export function loadChallengeState(): ChallengeState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ChallengeState;

    if (!parsed || !parsed.settings || !parsed.days) {
      return null;
    }

    // Ensure hydration object exists
    if (!parsed.hydration) {
      parsed.hydration = {};
    }

    // Ensure hydration notification settings exist
    if (!parsed.hydrationNotifications) {
      parsed.hydrationNotifications = { ...DEFAULT_HYDRATION_NOTIFICATIONS };
    }

    // Ensure all 90 days exist and dates match current startDate
    const startDate = parsed.settings.startDate || getTodayDateString();
    let needsUpdate = false;

    for (let i = 1; i <= 90; i++) {
      if (!parsed.days[i]) {
        parsed.days[i] = {
          dayNumber: i,
          date: getDateForDay(startDate, i),
          habits: {},
          reflection: { wentWell: '', couldImprove: '', notes: '' },
          updatedAt: new Date().toISOString(),
        };
        needsUpdate = true;
      } else {
        // Recalculate date if startDate changed
        const expectedDate = getDateForDay(startDate, i);
        if (parsed.days[i].date !== expectedDate) {
          parsed.days[i].date = expectedDate;
          needsUpdate = true;
        }
      }
    }

    if (needsUpdate) {
      saveChallengeState(parsed);
    }

    return parsed;
  } catch (err) {
    console.error('Failed to load challenge state from localStorage:', err);
    return null;
  }
}

/**
 * Saves challenge state to localStorage
 */
export function saveChallengeState(state: ChallengeState): boolean {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    return true;
  } catch (err) {
    console.error('Failed to save challenge state:', err);
    return false;
  }
}

/**
 * Updates a single day's habits and reflection atomically
 */
export function saveDayRecord(
  currentState: ChallengeState,
  dayNumber: number,
  habits: Record<string, boolean>,
  reflection?: { wentWell: string; couldImprove: string; notes: string },
  habitTimestamps?: Record<string, string>
): ChallengeState {
  const existingDay = currentState.days[dayNumber] || {
    dayNumber,
    date: getDateForDay(currentState.settings.startDate, dayNumber),
    habits: {},
    habitTimestamps: {},
    updatedAt: new Date().toISOString(),
  };

  const now = new Date().toISOString();
  const updatedDay: DayRecord = {
    ...existingDay,
    habits: { ...habits },
    habitTimestamps: habitTimestamps !== undefined ? { ...habitTimestamps } : existingDay.habitTimestamps,
    reflection: reflection ? { ...reflection } : existingDay.reflection,
    updatedAt: now,
  };

  const updatedState: ChallengeState = {
    ...currentState,
    days: {
      ...currentState.days,
      [dayNumber]: updatedDay,
    },
    lastActiveDayNumber: dayNumber,
  };

  saveChallengeState(updatedState);
  return updatedState;
}

/**
 * Logs water amount for a date and automatically updates Habit 07 when goal is reached
 */
export function logWaterIntake(
  currentState: ChallengeState,
  amountMl: number,
  dateStr?: string
): ChallengeState {
  const targetDate = dateStr || getTodayDateString();
  const goalMl = currentState.settings.hydrationGoalMl || 3500;

  const existingRecord: DayHydrationRecord = currentState.hydration?.[targetDate] || {
    date: targetDate,
    totalMl: 0,
    goalMl,
  };

  const newTotalMl = existingRecord.totalMl + amountMl;
  const updatedHydration: DayHydrationRecord = {
    ...existingRecord,
    totalMl: newTotalMl,
    goalMl,
  };

  // Find dayNumber matching targetDate
  let dayNumberToUpdate = 0;
  for (let i = 1; i <= 90; i++) {
    if (currentState.days[i]?.date === targetDate) {
      dayNumberToUpdate = i;
      break;
    }
  }

  let updatedDays = { ...currentState.days };
  // If goal reached and day found, ensure Habit 07 ('hydration') is marked complete
  if (dayNumberToUpdate > 0 && newTotalMl >= goalMl) {
    const existingDay = updatedDays[dayNumberToUpdate];
    if (existingDay && !existingDay.habits['hydration']) {
      updatedDays[dayNumberToUpdate] = {
        ...existingDay,
        habits: {
          ...existingDay.habits,
          hydration: true,
        },
        updatedAt: new Date().toISOString(),
      };
    }
  }

  const updatedState: ChallengeState = {
    ...currentState,
    hydration: {
      ...currentState.hydration,
      [targetDate]: updatedHydration,
    },
    days: updatedDays,
  };

  saveChallengeState(updatedState);
  return updatedState;
}

/**
 * Update hydration notification settings
 */
export function updateHydrationNotificationSettings(
  currentState: ChallengeState,
  settings: Partial<HydrationNotificationSettings>
): ChallengeState {
  const updatedState: ChallengeState = {
    ...currentState,
    hydrationNotifications: {
      ...currentState.hydrationNotifications,
      ...settings,
    },
  };

  saveChallengeState(updatedState);
  return updatedState;
}

/**
 * Update global settings (start date, streak threshold, hydration goal, etc.)
 */
export function updateChallengeSettings(
  currentState: ChallengeState,
  newSettings: Partial<ChallengeSettings>
): ChallengeState {
  const updatedSettings: ChallengeSettings = {
    ...currentState.settings,
    ...newSettings,
  };

  // Re-map day dates if start date changed
  const days: Record<number, DayRecord> = { ...currentState.days };
  if (newSettings.startDate && newSettings.startDate !== currentState.settings.startDate) {
    for (let i = 1; i <= 90; i++) {
      if (days[i]) {
        days[i] = {
          ...days[i],
          date: getDateForDay(newSettings.startDate, i),
        };
      }
    }
  }

  const updatedState: ChallengeState = {
    ...currentState,
    settings: updatedSettings,
    days,
  };

  saveChallengeState(updatedState);
  return updatedState;
}

/**
 * Export challenge state as a clean JSON backup file
 */
export function exportChallengeBackup(state: ChallengeState): void {
  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(state, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute('href', dataStr);
  downloadAnchor.setAttribute('download', `winter-arc-backup-${getTodayDateString()}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}

/**
 * Import and validate challenge state from JSON string
 */
export function importChallengeBackup(jsonString: string): ChallengeState {
  const parsed = JSON.parse(jsonString);
  if (!parsed || !parsed.settings || !parsed.days) {
    throw new Error('Invalid Winter Arc backup format');
  }
  saveChallengeState(parsed);
  return parsed;
}

/**
 * Completely resets challenge data (destructive, requires explicit confirmation)
 */
export function resetChallengeData(): void {
  localStorage.removeItem(STORAGE_KEY);
}

/**
 * Core data models for 90-Day Winter Arc Challenge Tracker
 */

export interface HabitDefinition {
  id: string;
  number: string;
  name: string;
  shortDescription: string;
  target: string;
  category: 'Morning' | 'Physical' | 'Discipline' | 'Intellect' | 'Evening';
  color?: string; // Theme color key (e.g. 'amber', 'orange', 'emerald') or hex
  iconName?: string; // Lucide icon identifier
  reminderTime?: string; // e.g. "07:30"
  reminderEnabled?: boolean;
  disabled?: boolean; // active vs paused/disabled state
}

export type HabitStatus = 'completed' | 'missed' | 'pending';

export type DayStatus = 'Complete' | 'Strong' | 'Partial' | 'Low' | 'Not Started';

export interface DayReflection {
  wentWell: string;
  couldImprove: string;
  notes: string;
}

export interface DayRecord {
  dayNumber: number; // 1 to 90
  date: string; // 'YYYY-MM-DD'
  habits: Record<string, boolean>; // id -> completed
  habitTimestamps?: Record<string, string>; // id -> ISO completion timestamp
  reflection?: DayReflection;
  updatedAt: string;
}

export interface DayHydrationRecord {
  date: string; // 'YYYY-MM-DD'
  totalMl: number;
  goalMl: number;
}

export interface HydrationNotificationSettings {
  enabled: boolean;
  intervalMinutes: number; // default 120 (2 hours)
  startTime: string; // e.g. "06:00"
  endTime: string; // e.g. "21:00"
  timezone: string; // e.g. "America/New_York"
  lastSentAt?: string;
  snoozedUntil?: string;
}

export interface ChallengeSettings {
  startDate: string; // 'YYYY-MM-DD'
  duration: number; // 90
  streakThreshold: number; // percentage, default 75
  hydrationGoal: string; // e.g. "3.5 Liters"
  hydrationGoalMl: number; // e.g. 3500
  theme: 'dark' | 'light';
  negativeHabitsList: string;
  studyTarget: string;
  skillTarget: string;
  soundEnabled: boolean;
  hasStarted: boolean;
}

export interface ChallengeState {
  version: number;
  settings: ChallengeSettings;
  days: Record<number, DayRecord>; // 1..90 keyed by dayNumber
  hydration: Record<string, DayHydrationRecord>; // date -> DayHydrationRecord
  hydrationNotifications: HydrationNotificationSettings;
  createdAt: string;
  lastActiveDayNumber: number;
  habits?: HabitDefinition[]; // User's customized list of habits
}

export interface OverallStats {
  currentDayNumber: number;
  daysRemaining: number;
  overallProgress: number; // 0..100 (evaluated days adherence)
  totalProtocolProgress: number; // 0..100 (overall 90-day progress)
  currentStreak: number;
  bestStreak: number;
  completedDaysCount: number; // days where completion == 100%
  qualifyingDaysCount: number; // days where completion >= streakThreshold
  missedDaysCount: number; // days where completion < streakThreshold (for past days)
  evaluatedDaysCount: number; // days 1..currentDayNumber
  futureDaysCount: number; // days remaining after today
  averageDailyCompletion: number;
  todayCompletedCount: number;
  todayTotalCount: number;
  todayPercentage: number;
  todayStatus: DayStatus;
}

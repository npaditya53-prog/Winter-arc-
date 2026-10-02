import { HABIT_DEFINITIONS } from '../constants/habits';
import { ChallengeState, DayRecord, DayStatus, HabitDefinition, HabitStatus, OverallStats } from '../types/challenge';

/**
 * Returns user-customized habits from ChallengeState or defaults to HABIT_DEFINITIONS
 */
export function getEffectiveHabits(state?: ChallengeState | null): HabitDefinition[] {
  if (state?.habits && state.habits.length > 0) {
    return state.habits;
  }
  return HABIT_DEFINITIONS;
}

/**
 * Returns only active (non-disabled) habits
 */
export function getActiveHabits(state?: ChallengeState | null): HabitDefinition[] {
  return getEffectiveHabits(state).filter((h) => !h.disabled);
}

/**
 * Core Status System (GREEN = COMPLETED, RED = MISSED, NEUTRAL = PENDING)
 *
 * Rules:
 * - If habit is completed: 'completed' (GREEN)
 * - If not completed:
 *   - If dayNumber < currentDayNumber: 'missed' (RED)
 *   - If dayNumber === currentDayNumber: 'pending' (NEUTRAL)
 *   - If dayNumber > currentDayNumber: 'pending' (NEUTRAL, never red!)
 */
export function getHabitStatus(
  isCompleted: boolean,
  dayNumber: number,
  currentDayNumber: number
): HabitStatus {
  if (isCompleted) {
    return 'completed';
  }
  if (dayNumber < currentDayNumber) {
    return 'missed';
  }
  return 'pending';
}

/**
 * Breakdown of habit statuses for a specific day
 */
export interface DayHabitStatusSummary {
  completedCount: number;
  missedCount: number;
  pendingCount: number;
  totalCount: number;
  percentage: number;
  isPast: boolean;
  isToday: boolean;
  isFuture: boolean;
}

export function calculateDayHabitStatusSummary(
  dayRecord: DayRecord | undefined,
  dayNumber: number,
  currentDayNumber: number,
  habits?: HabitDefinition[]
): DayHabitStatusSummary {
  const habitsList = habits ? habits.filter((h) => !h.disabled) : HABIT_DEFINITIONS.filter((h) => !h.disabled);
  const totalCount = habitsList.length || 1;
  const isPast = dayNumber < currentDayNumber;
  const isToday = dayNumber === currentDayNumber;
  const isFuture = dayNumber > currentDayNumber;

  let completedCount = 0;
  let missedCount = 0;
  let pendingCount = 0;

  for (const habit of habitsList) {
    const isCompleted = !!dayRecord?.habits?.[habit.id];
    const status = getHabitStatus(isCompleted, dayNumber, currentDayNumber);
    if (status === 'completed') {
      completedCount++;
    } else if (status === 'missed') {
      missedCount++;
    } else {
      pendingCount++;
    }
  }

  const percentage = Math.round((completedCount / totalCount) * 100);

  return {
    completedCount,
    missedCount,
    pendingCount,
    totalCount,
    percentage,
    isPast,
    isToday,
    isFuture,
  };
}

/**
 * Returns date string YYYY-MM-DD for a specific dayNumber (1-based) from startDate
 */
export function getDateForDay(startDateStr: string, dayNumber: number): string {
  if (!startDateStr) return '';
  const parts = startDateStr.split('-').map(Number);
  const year = parts[0];
  const month = parts[1] - 1;
  const day = parts[2];
  const d = new Date(year, month, day);
  d.setDate(d.getDate() + (dayNumber - 1));

  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dt = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dt}`;
}

/**
 * Formats a YYYY-MM-DD date into "September 30, 2026" or "Wed, Sep 30"
 */
export function formatDisplayDate(dateStr: string, format: 'full' | 'short' = 'full'): string {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-').map(Number);
  const d = new Date(year, month - 1, day);
  if (format === 'short') {
    return d.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  }
  return d.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Calculate which day number (1..90) corresponds to today relative to startDate
 */
export function getCurrentDayNumber(startDateStr: string): number {
  if (!startDateStr) return 1;
  const now = new Date();
  const todayZero = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

  const [year, month, day] = startDateStr.split('-').map(Number);
  const startZero = new Date(year, month - 1, day).getTime();

  const diffMs = todayZero - startZero;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1;

  if (diffDays < 1) return 1;
  if (diffDays > 90) return 90;
  return diffDays;
}

/**
 * Daily Status classification per spec:
 * 100% = Complete
 * 75–99% = Strong
 * 50–74% = Partial
 * 1–49% = Low
 * 0% = Not Started
 */
export function getDayStatus(percentage: number): DayStatus {
  if (percentage === 100) return 'Complete';
  if (percentage >= 75) return 'Strong';
  if (percentage >= 50) return 'Partial';
  if (percentage > 0) return 'Low';
  return 'Not Started';
}

/**
 * Calculate completion percentage and count for a single day record
 */
export function calculateDayStats(dayRecord?: DayRecord, habits?: HabitDefinition[]) {
  const activeHabits = habits ? habits.filter((h) => !h.disabled) : HABIT_DEFINITIONS.filter((h) => !h.disabled);
  const totalHabits = activeHabits.length || 1;
  if (!dayRecord || !dayRecord.habits) {
    return {
      completedCount: 0,
      totalHabits,
      percentage: 0,
      status: 'Not Started' as DayStatus,
    };
  }

  const completedCount = activeHabits.filter((h) => !!dayRecord.habits[h.id]).length;
  const percentage = Math.round((completedCount / totalHabits) * 100);
  const status = getDayStatus(percentage);

  return {
    completedCount,
    totalHabits,
    percentage,
    status,
  };
}

/**
 * Compute overall dashboard stats across all 90 days
 */
export function calculateOverallStats(state: ChallengeState): OverallStats {
  const currentDayNum = getCurrentDayNumber(state.settings.startDate);
  const streakThreshold = state.settings.streakThreshold || 75;
  const activeHabits = getActiveHabits(state);
  const totalHabitsCount = activeHabits.length || 1;

  let totalCompletedHabits = 0;
  let completedDaysCount = 0; // 100% adherence days
  let qualifyingDaysCount = 0; // >= streakThreshold
  let sumDailyPercentage = 0;
  const evaluatedDaysCount = Math.min(90, Math.max(1, currentDayNum));
  const futureDaysCount = Math.max(0, 90 - currentDayNum);

  // Track qualifying days array up to currentDayNum
  const dayQualifies: boolean[] = [];

  for (let i = 1; i <= evaluatedDaysCount; i++) {
    const dayRec = state.days[i];
    const stats = calculateDayStats(dayRec, activeHabits);

    totalCompletedHabits += stats.completedCount;
    sumDailyPercentage += stats.percentage;

    const qualifies = stats.percentage >= streakThreshold;
    dayQualifies.push(qualifies);

    if (stats.percentage === 100) {
      completedDaysCount++;
    }
    if (qualifies) {
      qualifyingDaysCount++;
    }
  }

  // Calculate Best Streak across all days up to currentDayNum
  let bestStreak = 0;
  let runningStreak = 0;
  for (let i = 0; i < dayQualifies.length; i++) {
    if (dayQualifies[i]) {
      runningStreak++;
      if (runningStreak > bestStreak) {
        bestStreak = runningStreak;
      }
    } else {
      runningStreak = 0;
    }
  }

  // Current Streak: working backward from today (or yesterday if today is still in progress)
  const todayStats = calculateDayStats(state.days[currentDayNum], activeHabits);
  const todayQualifies = todayStats.percentage >= streakThreshold;

  let currentStreak = 0;
  if (todayQualifies) {
    for (let idx = currentDayNum - 1; idx >= 0; idx--) {
      if (dayQualifies[idx]) {
        currentStreak++;
      } else {
        break;
      }
    }
  } else {
    for (let idx = currentDayNum - 2; idx >= 0; idx--) {
      if (dayQualifies[idx]) {
        currentStreak++;
      } else {
        break;
      }
    }
  }

  // Missed days: Past days (before today) where adherence was below threshold
  const pastDaysEvaluated = Math.max(0, currentDayNum - 1);
  const pastQualifyingDays = qualifyingDaysCount - (todayQualifies ? 1 : 0);
  const missedDaysCount = Math.max(0, pastDaysEvaluated - pastQualifyingDays);

  const averageDailyCompletion = evaluatedDaysCount > 0
    ? Math.round(sumDailyPercentage / evaluatedDaysCount)
    : 0;

  // Evaluated progress (calculated strictly from eligible/currently evaluated days)
  const evaluatedPossibleHabits = evaluatedDaysCount * totalHabitsCount;
  const overallProgress = evaluatedPossibleHabits > 0
    ? Math.round((totalCompletedHabits / evaluatedPossibleHabits) * 100)
    : 0;

  // Total 90-day progress
  let allCompletedHabits = 0;
  for (let i = 1; i <= 90; i++) {
    const stats = calculateDayStats(state.days[i], activeHabits);
    allCompletedHabits += stats.completedCount;
  }
  const totalProtocolProgress = Math.round((allCompletedHabits / (90 * totalHabitsCount)) * 100);

  return {
    currentDayNumber: currentDayNum,
    daysRemaining: Math.max(0, 90 - currentDayNum),
    overallProgress, // evaluated adherence
    totalProtocolProgress, // total 90-day milestone progress
    currentStreak,
    bestStreak: Math.max(bestStreak, currentStreak),
    completedDaysCount,
    qualifyingDaysCount,
    missedDaysCount,
    evaluatedDaysCount,
    futureDaysCount,
    averageDailyCompletion,
    todayCompletedCount: todayStats.completedCount,
    todayTotalCount: todayStats.totalHabits,
    todayPercentage: todayStats.percentage,
    todayStatus: todayStats.status,
  };
}

/**
 * Habit Consistency: Analyzes each habit across all active days up to currentDayNumber
 */
export interface HabitConsistencyItem {
  id: string;
  name: string;
  category: string;
  number: string;
  target: string;
  color?: string;
  iconName?: string;
  completedDays: number;
  missedDays: number;
  pendingDays: number;
  totalDays: number;
  percentage: number;
}

export function calculateHabitConsistency(state: ChallengeState): HabitConsistencyItem[] {
  const currentDayNum = getCurrentDayNumber(state.settings.startDate);
  const totalDays = Math.max(1, currentDayNum);
  const habitsToTrack = getEffectiveHabits(state);

  return habitsToTrack.map((habit) => {
    let completedDays = 0;
    let missedDays = 0;
    let pendingDays = 0;

    for (let d = 1; d <= currentDayNum; d++) {
      const rec = state.days[d];
      const isCompleted = !!rec?.habits?.[habit.id];
      const status = getHabitStatus(isCompleted, d, currentDayNum);

      if (status === 'completed') {
        completedDays++;
      } else if (status === 'missed') {
        missedDays++;
      } else {
        pendingDays++;
      }
    }

    const percentage = Math.round((completedDays / totalDays) * 100);

    return {
      id: habit.id,
      name: habit.name,
      category: habit.category,
      number: habit.number,
      target: habit.target,
      color: habit.color,
      iconName: habit.iconName,
      completedDays,
      missedDays,
      pendingDays,
      totalDays,
      percentage,
    };
  });
}

/**
 * 7-Day History: Last 7 days ending with today or selected day
 */
export interface DayChartPoint {
  dayNumber: number;
  date: string;
  label: string;
  percentage: number;
  completedCount: number;
  isToday: boolean;
}

export function get7DayHistory(state: ChallengeState, endDayNumber?: number): DayChartPoint[] {
  const currentDayNum = getCurrentDayNumber(state.settings.startDate);
  const referenceDay = endDayNumber || currentDayNum;
  const startDay = Math.max(1, referenceDay - 6);
  const result: DayChartPoint[] = [];

  for (let d = startDay; d <= Math.min(referenceDay, 90); d++) {
    const rec = state.days[d];
    const stats = calculateDayStats(rec);
    const dateStr = getDateForDay(state.settings.startDate, d);
    result.push({
      dayNumber: d,
      date: dateStr,
      label: `D${d}`,
      percentage: stats.percentage,
      completedCount: stats.completedCount,
      isToday: d === currentDayNum,
    });
  }

  // If fewer than 7 points (e.g. early in challenge), pad with upcoming/previous to show full 7 slots
  while (result.length < 7 && result[result.length - 1]?.dayNumber < 90) {
    const nextDay = result[result.length - 1].dayNumber + 1;
    const rec = state.days[nextDay];
    const stats = calculateDayStats(rec);
    result.push({
      dayNumber: nextDay,
      date: getDateForDay(state.settings.startDate, nextDay),
      label: `D${nextDay}`,
      percentage: stats.percentage,
      completedCount: stats.completedCount,
      isToday: nextDay === currentDayNum,
    });
  }

  return result;
}

/**
 * 30-Day Completion Trend Chart Data
 */
export function get30DayHistory(state: ChallengeState): DayChartPoint[] {
  const currentDayNum = getCurrentDayNumber(state.settings.startDate);
  const startDay = Math.max(1, currentDayNum - 29);
  const result: DayChartPoint[] = [];

  for (let d = startDay; d <= currentDayNum; d++) {
    const rec = state.days[d];
    const stats = calculateDayStats(rec);
    const dateStr = getDateForDay(state.settings.startDate, d);
    result.push({
      dayNumber: d,
      date: dateStr,
      label: `${d}`,
      percentage: stats.percentage,
      completedCount: stats.completedCount,
      isToday: d === currentDayNum,
    });
  }
  return result;
}

/**
 * Monthly Breakdown for the 3 distinct 30-day phases of the 90-Day Winter Arc:
 * Phase 1: Days 1-30 (The Reset)
 * Phase 2: Days 31-60 (The Forge)
 * Phase 3: Days 61-90 (The Transcendence)
 */
export interface PhaseBreakdown {
  phaseNumber: number;
  name: string;
  subtitle: string;
  startDay: number;
  endDay: number;
  averagePercentage: number;
  completedDaysCount: number;
  qualifyingDaysCount: number;
  isActive: boolean;
  isCompleted: boolean;
}

export function getPhaseBreakdown(state: ChallengeState): PhaseBreakdown[] {
  const currentDayNum = getCurrentDayNumber(state.settings.startDate);
  const threshold = state.settings.streakThreshold || 75;

  const phases = [
    { num: 1, name: 'Phase 1: The Foundation', subtitle: 'Days 01–30 · Breaking Inertia', start: 1, end: 30 },
    { num: 2, name: 'Phase 2: The Forge', subtitle: 'Days 31–60 · Automatic Discipline', start: 31, end: 60 },
    { num: 3, name: 'Phase 3: The Transcendence', subtitle: 'Days 61–90 · The New Normal', start: 61, end: 90 },
  ];

  return phases.map((p) => {
    let sumPercentage = 0;
    let completedDays = 0;
    let qualifyingDays = 0;
    let countedDays = 0;

    for (let d = p.start; d <= p.end; d++) {
      if (d <= currentDayNum) {
        countedDays++;
        const stats = calculateDayStats(state.days[d]);
        sumPercentage += stats.percentage;
        if (stats.percentage === 100) completedDays++;
        if (stats.percentage >= threshold) qualifyingDays++;
      }
    }

    const avg = countedDays > 0 ? Math.round(sumPercentage / countedDays) : 0;
    const isActive = currentDayNum >= p.start && currentDayNum <= p.end;
    const isCompleted = currentDayNum > p.end;

    return {
      phaseNumber: p.num,
      name: p.name,
      subtitle: p.subtitle,
      startDay: p.start,
      endDay: p.end,
      averagePercentage: avg,
      completedDaysCount: completedDays,
      qualifyingDaysCount: qualifyingDays,
      isActive,
      isCompleted,
    };
  });
}

import { ChallengeSettings, HabitDefinition, HabitStatus } from '../types/challenge';

export const TASK_STATUS_THEME: Record<
  HabitStatus,
  {
    label: string;
    iconSymbol: string;
    colorHex: string;
    bgSubtleDark: string;
    borderDark: string;
    textDark: string;
  }
> = {
  completed: {
    label: 'Completed',
    iconSymbol: '✓',
    colorHex: '#4CAF78', // Soft success green
    bgSubtleDark: 'rgba(76, 175, 120, 0.08)',
    borderDark: 'rgba(76, 175, 120, 0.35)',
    textDark: '#62C98A',
  },
  missed: {
    label: 'Missed',
    iconSymbol: '✕',
    colorHex: '#D96B6B', // Muted subtle red
    bgSubtleDark: 'rgba(217, 107, 107, 0.08)',
    borderDark: 'rgba(217, 107, 107, 0.35)',
    textDark: '#E87878',
  },
  pending: {
    label: 'Pending',
    iconSymbol: '□',
    colorHex: '#71717A', // Neutral gray
    bgSubtleDark: '#13161C',
    borderDark: '#222730',
    textDark: '#A1A1AA',
  },
};

export const ACCENT_COLORS = {
  blue: '#5B8DEF',
  green: '#62C98A',
  red: '#E87878',
  yellow: '#E4B95F',
  purple: '#9A7BEA',
  orange: '#E99A62',
} as const;

export interface HabitVisualInfo {
  accent: string;
  categoryAccent: string;
  iconName: string;
}

export const HABIT_VISUAL_MAP: Record<string, HabitVisualInfo> = {
  wakeUp: {
    accent: '#F59E0B', // 01 Wake Up → Warm Amber
    categoryAccent: '#F59E0B',
    iconName: 'Sunrise',
  },
  hotWater: {
    accent: '#F97316', // 02 Hot Water → Soft Orange
    categoryAccent: '#F97316',
    iconName: 'Coffee',
  },
  sunlight: {
    accent: '#EAB308', // 03 Sunlight → Yellow
    categoryAccent: '#EAB308',
    iconName: 'Sun',
  },
  exercise: {
    accent: '#10B981', // 04 Exercise → Green
    categoryAccent: '#10B981',
    iconName: 'Dumbbell',
  },
  suryaJal: {
    accent: '#D97706', // 05 Surya Jal → Gold
    categoryAccent: '#D97706',
    iconName: 'Sparkles',
  },
  avoidNegativeHabits: {
    accent: '#D96B6B', // 06 Avoid Negative Habits → Muted Red
    categoryAccent: '#D96B6B',
    iconName: 'ShieldAlert',
  },
  hydration: {
    accent: '#38BDF8', // 07 Hydration → Ice Blue
    categoryAccent: '#38BDF8',
    iconName: 'Droplets',
  },
  noJunkSugar: {
    accent: '#14B8A6', // 08 No Junk Food → Mint / Green
    categoryAccent: '#14B8A6',
    iconName: 'Apple',
  },
  reduceMobile: {
    accent: '#A855F7', // 09 Reduce Mobile Usage → Purple
    categoryAccent: '#A855F7',
    iconName: 'Smartphone',
  },
  study: {
    accent: '#3B82F6', // 10 Study → Blue
    categoryAccent: '#3B82F6',
    iconName: 'BookOpen',
  },
  skillDevelopment: {
    accent: '#8B5CF6', // 11 Skill Development → Violet
    categoryAccent: '#8B5CF6',
    iconName: 'Lightbulb',
  },
  sleepNoPhone: {
    accent: '#6366F1', // 12 Sleep → Indigo
    categoryAccent: '#6366F1',
    iconName: 'Moon',
  },
};

export const HABIT_DEFINITIONS: HabitDefinition[] = [
  {
    id: 'wakeUp',
    number: '01',
    name: 'Wake Up at 6:00 AM',
    shortDescription: 'Start the day on time and seize the morning',
    target: 'At or around 6:00 AM',
    category: 'Morning',
  },
  {
    id: 'hotWater',
    number: '02',
    name: 'Drink Hot Water',
    shortDescription: 'Drink warm or hot water immediately after rising',
    target: '1–2 warm cups upon waking',
    category: 'Morning',
  },
  {
    id: 'sunlight',
    number: '03',
    name: '30 Minutes of Sunlight',
    shortDescription: 'Early outdoor light exposure to reset circadian rhythm',
    target: '30 minutes outdoors',
    category: 'Morning',
  },
  {
    id: 'exercise',
    number: '04',
    name: 'Exercise',
    shortDescription: 'Complete the planned daily physical training or workout',
    target: 'Full workout session completed',
    category: 'Physical',
  },
  {
    id: 'suryaJal',
    number: '05',
    name: 'Surya Jal',
    shortDescription: 'Traditional morning ritual offering water to the rising sun',
    target: 'Morning ritual completed',
    category: 'Morning',
  },
  {
    id: 'avoidNegativeHabits',
    number: '06',
    name: 'Avoid Negative Habits',
    shortDescription: 'Zero tolerance for personal vices and impulse triggers',
    target: 'Strict abstinence from defined vices',
    category: 'Discipline',
  },
  {
    id: 'hydration',
    number: '07',
    name: 'Hydration',
    shortDescription: 'Consistent optimal hydration throughout the day',
    target: 'Daily Hydration Goal',
    category: 'Physical',
  },
  {
    id: 'noJunkSugar',
    number: '08',
    name: 'No Junk Food / Added Sugar',
    shortDescription: 'Clean wholesome fuel with zero processed junk or added sugar',
    target: 'Zero junk food or refined sugar',
    category: 'Discipline',
  },
  {
    id: 'reduceMobile',
    number: '09',
    name: 'Reduce Mobile Usage',
    shortDescription: 'Eliminate mindless scrolling and keep phone usage under strict control',
    target: 'Controlled screen time & no doomscrolling',
    category: 'Discipline',
  },
  {
    id: 'study',
    number: '10',
    name: 'Study According to Routine',
    shortDescription: 'Execute deep focused study sessions according to daily schedule',
    target: 'Planned study curriculum completed',
    category: 'Intellect',
  },
  {
    id: 'skillDevelopment',
    number: '11',
    name: 'Skill Development — 1 Hour',
    shortDescription: 'Dedicate one uninterruptible hour to mastering a high-value skill',
    target: '60 minutes deliberate practice',
    category: 'Intellect',
  },
  {
    id: 'sleepNoPhone',
    number: '12',
    name: 'Sleep at 9:00 PM — No Phone',
    shortDescription: 'Bedtime at 9:00 PM with all screens shut off in advance',
    target: 'Lights out at 9:00 PM (No phone)',
    category: 'Evening',
  },
];

export const MOTIVATIONAL_REFLECTIONS = [
  'Consistency beats intensity.',
  'One day at a time.',
  'Don’t break the chain.',
  'Show up again tomorrow.',
  'Discipline is the bridge between goals and accomplishment.',
  'Master the quiet, unglamorous hours.',
  'Today’s effort is tomorrow’s foundation.',
];

export function getTodayDateString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getUserTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
}

export const DEFAULT_HYDRATION_NOTIFICATIONS = {
  enabled: true,
  intervalMinutes: 120, // 2 hours
  startTime: '06:00',
  endTime: '21:00',
  timezone: getUserTimezone(),
};

export const DEFAULT_SETTINGS: ChallengeSettings = {
  startDate: getTodayDateString(),
  duration: 90,
  streakThreshold: 75,
  hydrationGoal: '3.5 Liters',
  hydrationGoalMl: 3500,
  theme: 'dark',
  negativeHabitsList: 'Mindless scrolling, late night snacking, procrastination',
  studyTarget: 'Structured reading, course work & problem solving',
  skillTarget: 'Focused coding, architecture & deliberate practice',
  soundEnabled: true,
  hasStarted: false,
};

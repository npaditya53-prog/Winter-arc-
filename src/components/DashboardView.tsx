import React from 'react';
import {
  Flame,
  ArrowRight,
} from 'lucide-react';
import { HABIT_DEFINITIONS, MOTIVATIONAL_REFLECTIONS } from '../constants/habits';
import { ChallengeState, OverallStats } from '../types/challenge';
import { formatDisplayDate } from '../utils/calculations';
import { HabitRow } from './HabitRow';
import { StatusLegend } from './StatusLegend';

interface DashboardViewProps {
  state: ChallengeState;
  stats: OverallStats;
  onToggleHabit: (habitId: string, dayNumber?: number) => void;
  onLogWater?: (amountMl: number) => void;
  onNavigate: (tab: 'dashboard' | 'today' | 'calendar' | 'analytics' | 'settings') => void;
  theme: 'dark' | 'light';
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  state,
  stats,
  onToggleHabit,
  onNavigate,
  theme,
}) => {
  const isDark = theme === 'dark';
  const todayRecord = state.days[stats.currentDayNumber];

  const motivationalQuote =
    MOTIVATIONAL_REFLECTIONS[(stats.currentDayNumber - 1) % MOTIVATIONAL_REFLECTIONS.length];

  return (
    <div className="space-y-6 max-w-2xl mx-auto pb-20 sm:pb-16 font-system">
      {/* 1. Winter Arc Hero Header */}
      <section className="pt-1 sm:pt-2">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 border-b border-[#1E2430] pb-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                WINTER <span className="text-[#38BDF8]">ARC</span>
              </h1>
            </div>
            <p className="text-xs font-medium text-zinc-400 uppercase tracking-wider mt-1">
              90 Days • One Day at a Time
            </p>
            <p className="text-xs text-zinc-500 italic mt-1 max-w-sm">
              &ldquo;{motivationalQuote}&rdquo;
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs text-zinc-400 tabular-nums">
            <span className="font-semibold text-white px-2.5 py-1 rounded-xl bg-[#141822] border border-[#222836]">
              Day {String(stats.currentDayNumber).padStart(2, '0')} of 90
            </span>
            <span className="text-zinc-500">
              {formatDisplayDate(todayRecord?.date || state.settings.startDate, 'short')}
            </span>
          </div>
        </div>
      </section>

      {/* 2. Current Streak Card */}
      <section
        className={`p-4 sm:p-5 rounded-[20px] border flex items-center justify-between transition-all ${
          isDark
            ? 'bg-[#11141B] border-[#1E232E] shadow-sm'
            : 'bg-white border-zinc-200 shadow-sm'
        }`}
      >
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-[#F97316]/15 border border-[#F97316]/30 text-[#F97316] flex items-center justify-center shrink-0">
            <Flame className="w-6 h-6 stroke-[2]" />
          </div>
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 block">
              Current Streak
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-white tabular-nums tracking-tight">
                {stats.currentStreak} DAYS
              </span>
              <span className="text-xs text-zinc-500">
                Best: <strong className="text-zinc-300 font-medium">{stats.bestStreak} days</strong>
              </span>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onNavigate('analytics')}
          className="text-xs text-[#38BDF8] hover:underline flex items-center gap-1 font-medium"
        >
          <span>Analytics</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </section>

      {/* 4. Today's Habits (The Core Action Section) */}
      <section className="space-y-3">
        <div className="flex items-baseline justify-between px-1">
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">
              Today&apos;s Habits
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              {stats.todayCompletedCount} of 12 completed · Tap any habit to complete
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('today')}
            className="text-xs text-[#38BDF8] hover:underline font-medium"
          >
            Reflect & Details
          </button>
        </div>

        {/* 12 Habits colorful bubbles (Image 2 spacious layout) */}
        <div className="space-y-3.5 sm:space-y-4">
          {HABIT_DEFINITIONS.map((habit) => {
            const isCompleted = !!todayRecord?.habits?.[habit.id];
            let customTarget: string | undefined;
            if (habit.id === 'study' && state.settings.studyTarget) {
              customTarget = state.settings.studyTarget;
            } else if (habit.id === 'skillDevelopment' && state.settings.skillTarget) {
              customTarget = state.settings.skillTarget;
            } else if (habit.id === 'avoidNegativeHabits' && state.settings.negativeHabitsList) {
              customTarget = state.settings.negativeHabitsList;
            }

            return (
              <HabitRow
                key={habit.id}
                habit={habit}
                isCompleted={isCompleted}
                onToggle={(id) => onToggleHabit(id, stats.currentDayNumber)}
                customTarget={customTarget}
                theme={theme}
                dayNumber={stats.currentDayNumber}
                currentDayNumber={stats.currentDayNumber}
              />
            );
          })}
        </div>

        <div className="pt-2 px-1">
          <StatusLegend theme={theme} />
        </div>
      </section>
    </div>
  );
};

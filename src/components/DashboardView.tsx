import React, { useState, useEffect } from 'react';
import {
  ArrowRight,
  Droplets,
  Check,
  Bell,
  BellOff,
  Flame,
  Trophy,
  CheckCircle2,
  TrendingUp,
} from 'lucide-react';
import { HABIT_DEFINITIONS, MOTIVATIONAL_REFLECTIONS, getTodayDateString } from '../constants/habits';
import { ChallengeState, OverallStats } from '../types/challenge';
import { formatDisplayDate, get7DayHistory } from '../utils/calculations';
import { HabitRow } from './HabitRow';
import { StatusLegend } from './StatusLegend';
import { getHydrationPushStatus, PushStatusResponse } from '../utils/notifications';

interface DashboardViewProps {
  state: ChallengeState;
  stats: OverallStats;
  onToggleHabit: (habitId: string, dayNumber?: number) => void;
  onLogWater: (amountMl: number) => void;
  onNavigate: (tab: 'dashboard' | 'today' | 'calendar' | 'analytics' | 'settings') => void;
  theme: 'dark' | 'light';
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  state,
  stats,
  onToggleHabit,
  onLogWater,
  onNavigate,
  theme,
}) => {
  const isDark = theme === 'dark';
  const todayRecord = state.days[stats.currentDayNumber];
  const todayHabits = todayRecord?.habits || {};
  const history7 = get7DayHistory(state, stats.currentDayNumber);

  const motivationalQuote = MOTIVATIONAL_REFLECTIONS[(stats.currentDayNumber - 1) % MOTIVATIONAL_REFLECTIONS.length];

  // Hydration tracking for today
  const todayDateStr = todayRecord?.date || getTodayDateString();
  const todayHydration = state.hydration?.[todayDateStr] || {
    date: todayDateStr,
    totalMl: 0,
    goalMl: state.settings.hydrationGoalMl || 3500,
  };
  const goalMl = state.settings.hydrationGoalMl || 3500;
  const hydrationPercent = Math.min(100, Math.round((todayHydration.totalMl / goalMl) * 100));
  const isHydrationGoalReached = todayHydration.totalMl >= goalMl;

  // Custom water log input
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customMl, setCustomMl] = useState('');

  // Push status from backend
  const [pushStatus, setPushStatus] = useState<PushStatusResponse | null>(null);

  useEffect(() => {
    getHydrationPushStatus().then((res) => {
      setPushStatus(res);
    });
  }, []);

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseInt(customMl, 10);
    if (!isNaN(val) && val > 0) {
      onLogWater(val);
      setCustomMl('');
      setShowCustomInput(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto pb-14">
      {/* Top Header Section */}
      <section className="space-y-3 pt-2">
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 border-b border-[#20252E] pb-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-semibold text-white tracking-tight">
                Winter Arc
              </h1>
              <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-[#5B8DEF]/15 text-[#5B8DEF] border border-[#5B8DEF]/25">
                90 Days
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-1">
              &ldquo;{motivationalQuote}&rdquo;
            </p>
          </div>

          <div className="text-xs text-zinc-400 tabular-nums">
            <span className="font-semibold text-white">Day {String(stats.currentDayNumber).padStart(2, '0')}</span> of 90
            <span className="mx-2 text-zinc-600">·</span>
            <span>{formatDisplayDate(todayRecord?.date || state.settings.startDate)}</span>
          </div>
        </div>

        {/* Evaluated Progress Bar (Strictly Active Days evaluated, no penalty for future days) */}
        <div className="space-y-1.5 pt-1">
          <div className="flex justify-between text-xs text-zinc-400 tabular-nums">
            <span>Evaluated protocol adherence</span>
            <span className="font-medium text-white">{stats.overallProgress}%</span>
          </div>
          <div className="w-full bg-[#181C24] h-2.5 rounded-full overflow-hidden border border-[#222730]">
            <div
              className="bg-[#4CAF78] h-full rounded-full transition-all duration-300"
              style={{ width: `${Math.min(100, stats.overallProgress)}%` }}
            />
          </div>
          <div className="flex justify-between text-[11px] text-zinc-500 tabular-nums pt-0.5">
            <span>Evaluated: Day 1–{stats.currentDayNumber} ({stats.evaluatedDaysCount} days)</span>
            <span>Future: {stats.futureDaysCount} days (not penalized)</span>
          </div>
        </div>

        {/* 4 Core Statistics Bubble Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          {/* Current Streak */}
          <div
            className={`p-3.5 rounded-2xl border transition-all ${
              isDark ? 'bg-[#13161C] border-[#222730]' : 'bg-white border-zinc-200 shadow-sm'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs text-zinc-400">Current streak</span>
              <div className="w-6 h-6 rounded-lg bg-[#E99A62]/15 text-[#E99A62] flex items-center justify-center">
                <Flame className="w-3.5 h-3.5" />
              </div>
            </div>
            <span className="text-xl font-semibold text-white tabular-nums block mt-1.5">
              {stats.currentStreak} <span className="text-xs font-normal text-zinc-400">days</span>
            </span>
            <span className="text-[11px] text-zinc-500 block mt-0.5">
              min. {state.settings.streakThreshold}%
            </span>
          </div>

          {/* Best Streak */}
          <div
            className={`p-3.5 rounded-2xl border transition-all ${
              isDark ? 'bg-[#13161C] border-[#222730]' : 'bg-white border-zinc-200 shadow-sm'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs text-zinc-400">Best streak</span>
              <div className="w-6 h-6 rounded-lg bg-[#E4B95F]/15 text-[#E4B95F] flex items-center justify-center">
                <Trophy className="w-3.5 h-3.5" />
              </div>
            </div>
            <span className="text-xl font-semibold text-white tabular-nums block mt-1.5">
              {stats.bestStreak} <span className="text-xs font-normal text-zinc-400">days</span>
            </span>
            <span className="text-[11px] text-zinc-500 block mt-0.5">
              personal record
            </span>
          </div>

          {/* Completed Days */}
          <div
            className={`p-3.5 rounded-2xl border transition-all ${
              isDark ? 'bg-[#13161C] border-[#222730]' : 'bg-white border-zinc-200 shadow-sm'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs text-zinc-400">Qualifying days</span>
              <div className="w-6 h-6 rounded-lg bg-[#4CAF78]/15 text-[#4CAF78] flex items-center justify-center">
                <CheckCircle2 className="w-3.5 h-3.5" />
              </div>
            </div>
            <span className="text-xl font-semibold text-white tabular-nums block mt-1.5">
              {stats.qualifyingDaysCount} <span className="text-xs font-normal text-zinc-400">of {stats.evaluatedDaysCount}</span>
            </span>
            <span className="text-[11px] text-[#4CAF78] block mt-0.5">
              {stats.completedDaysCount} with 100%
            </span>
          </div>

          {/* Missed Days */}
          <div
            className={`p-3.5 rounded-2xl border transition-all ${
              isDark ? 'bg-[#13161C] border-[#222730]' : 'bg-white border-zinc-200 shadow-sm'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs text-zinc-400">Missed days</span>
              <div className="w-6 h-6 rounded-lg bg-[#D96B6B]/15 text-[#D96B6B] flex items-center justify-center">
                <TrendingUp className="w-3.5 h-3.5" />
              </div>
            </div>
            <span className="text-xl font-semibold text-white tabular-nums block mt-1.5">
              {stats.missedDaysCount} <span className="text-xs font-normal text-zinc-400">past days</span>
            </span>
            <span className="text-[11px] text-zinc-500 block mt-0.5">
              below {state.settings.streakThreshold}%
            </span>
          </div>
        </div>
      </section>

      {/* Daily Hydration & Background Push Reminder Section */}
      <section
        className={`p-4 sm:p-5 rounded-2xl border transition-colors ${
          isDark
            ? 'bg-[#10141D] border-[#5B8DEF]/25'
            : 'bg-[#F2F6FD] border-[#5B8DEF]/30 shadow-sm'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 mb-3 border-b border-[#202836]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#5B8DEF]/15 text-[#5B8DEF] flex items-center justify-center">
              <Droplets className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white">
                Hydration Tracker
              </h2>
              <span className="text-xs text-zinc-400 tabular-nums">
                {(todayHydration.totalMl / 1000).toFixed(1)} L of {(goalMl / 1000).toFixed(1)} L ({hydrationPercent}%)
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs">
            {isHydrationGoalReached ? (
              <span className="flex items-center gap-1 text-[#4CAF78] font-medium bg-[#4CAF78]/15 px-2 py-0.5 rounded-full border border-[#4CAF78]/25">
                <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                Goal reached
              </span>
            ) : (
              <span className="text-zinc-400 tabular-nums">
                {Math.max(0, goalMl - todayHydration.totalMl)} ml remaining
              </span>
            )}
            <span className="text-zinc-600">·</span>
            <button
              type="button"
              onClick={() => onNavigate('settings')}
              className="text-[#5B8DEF] hover:underline"
            >
              Reminder settings
            </button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-[#18202D] h-2.5 rounded-full overflow-hidden mb-3 border border-[#222E42]">
          <div
            className={`h-full rounded-full transition-all duration-300 ${
              isHydrationGoalReached ? 'bg-[#4CAF78]' : 'bg-[#5B8DEF]'
            }`}
            style={{ width: `${hydrationPercent}%` }}
          />
        </div>

        {/* Quick Log Water Buttons */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="text-xs text-zinc-400 mr-1">Log water:</span>
          <button
            type="button"
            onClick={() => onLogWater(250)}
            className="px-3 py-1.5 rounded-xl text-xs font-medium border border-zinc-700/80 bg-zinc-800/80 text-zinc-200 hover:bg-zinc-700 hover:text-white transition-all active:scale-95"
          >
            +250 ml
          </button>
          <button
            type="button"
            onClick={() => onLogWater(500)}
            className="px-3 py-1.5 rounded-xl text-xs font-medium border border-zinc-700/80 bg-zinc-800/80 text-zinc-200 hover:bg-zinc-700 hover:text-white transition-all active:scale-95"
          >
            +500 ml
          </button>
          <button
            type="button"
            onClick={() => onLogWater(750)}
            className="px-3 py-1.5 rounded-xl text-xs font-medium border border-zinc-700/80 bg-zinc-800/80 text-zinc-200 hover:bg-zinc-700 hover:text-white transition-all active:scale-95"
          >
            +750 ml
          </button>
          <button
            type="button"
            onClick={() => setShowCustomInput(!showCustomInput)}
            className="px-3 py-1.5 rounded-xl text-xs font-medium border border-[#5B8DEF]/30 bg-[#5B8DEF]/10 text-[#5B8DEF] hover:bg-[#5B8DEF]/20 transition-all active:scale-95"
          >
            Custom
          </button>
        </div>

        {showCustomInput && (
          <form onSubmit={handleCustomSubmit} className="flex items-center gap-2 mt-2 pt-2 border-t border-[#202836]">
            <input
              type="number"
              min="50"
              max="5000"
              step="50"
              value={customMl}
              onChange={(e) => setCustomMl(e.target.value)}
              placeholder="e.g. 350 ml"
              className="w-32 h-8 px-2.5 rounded-xl text-xs border border-zinc-700 bg-zinc-900 text-white focus:outline-none focus:ring-1 focus:ring-[#5B8DEF]"
              autoFocus
            />
            <button
              type="submit"
              className="px-3 py-1 rounded-xl text-xs font-medium bg-[#5B8DEF] text-[#0B0C0F] hover:bg-[#5B8DEF]/90 font-semibold"
            >
              Add
            </button>
            <button
              type="button"
              onClick={() => setShowCustomInput(false)}
              className="text-xs text-zinc-400 hover:text-white px-2 py-1"
            >
              Cancel
            </button>
          </form>
        )}

        {/* Real Push Reminder Status Banner */}
        <div className="mt-3 pt-2.5 border-t border-[#202836] flex flex-wrap items-center justify-between text-xs text-zinc-400 gap-2">
          <div className="flex items-center gap-1.5">
            {state.hydrationNotifications?.enabled ? (
              <Bell className="w-3.5 h-3.5 text-[#5B8DEF]" />
            ) : (
              <BellOff className="w-3.5 h-3.5 text-zinc-500" />
            )}
            <span>
              Reminders: <strong className="text-zinc-200">{state.hydrationNotifications?.enabled ? 'On' : 'Off'}</strong>
              <span className="text-zinc-600 mx-1.5">·</span>
              Every {Math.round((state.hydrationNotifications?.intervalMinutes || 120) / 60)} hours ({state.hydrationNotifications?.startTime || '06:00'} – {state.hydrationNotifications?.endTime || '21:00'})
            </span>
          </div>

          <div className="text-[11px] text-zinc-400">
            {pushStatus?.nextReminderText || 'Active hours: 06:00 – 21:00'}
          </div>
        </div>
      </section>

      {/* Recent 7-Day Overview with Unified Status Colors */}
      <section
        className={`p-4 sm:p-5 rounded-2xl border ${
          isDark ? 'bg-[#13161C] border-[#222730]' : 'bg-white border-zinc-200 shadow-sm'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
          <div>
            <h2 className="text-sm font-semibold text-white">
              Recent 7 days
            </h2>
            <p className="text-xs text-zinc-400">
              Daily status: <span className="text-[#4CAF78]">Green = Met</span> · <span className="text-[#D96B6B]">Red = Missed</span> · <span className="text-zinc-400">Neutral = Active</span>
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('analytics')}
            className="text-xs font-medium text-[#5B8DEF] hover:text-[#5B8DEF]/80 flex items-center gap-1 focus:outline-none focus-visible:ring-1 focus-visible:ring-[#5B8DEF] rounded p-1 self-start sm:self-auto"
          >
            <span>View analytics</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
          {history7.map((item) => {
            const isPast = item.dayNumber < stats.currentDayNumber;
            const isToday = item.isToday;
            const qualifies = item.percentage >= state.settings.streakThreshold;

            let statusStyle = 'border-[#222730] bg-[#181C24] text-zinc-300';
            if (isToday) {
              statusStyle = 'border-[#5B8DEF]/50 bg-[#5B8DEF]/10 text-white ring-2 ring-[#5B8DEF]/60';
            } else if (isPast) {
              if (qualifies) {
                statusStyle = 'border-[#4CAF78]/40 bg-[#4CAF78]/10 text-[#4CAF78]';
              } else {
                statusStyle = 'border-[#D96B6B]/40 bg-[#D96B6B]/10 text-[#D96B6B]';
              }
            }

            return (
              <div
                key={item.dayNumber}
                className={`p-2 rounded-xl border text-center transition-all ${statusStyle}`}
              >
                <div className="text-[10px] sm:text-[11px] opacity-75 tabular-nums">
                  Day {String(item.dayNumber).padStart(2, '0')}
                </div>
                <div className="text-xs sm:text-sm font-semibold tabular-nums mt-0.5">
                  {item.percentage}%
                </div>
                <div className="text-[9px] sm:text-[10px] opacity-80 tabular-nums mt-0.5">
                  {isToday ? (
                    <span className="text-zinc-300">
                      ✓ {item.completedCount} · □ {12 - item.completedCount}
                    </span>
                  ) : qualifies ? (
                    <span className="text-[#4CAF78]">
                      ✓ {item.completedCount}/12
                    </span>
                  ) : (
                    <span className="text-[#D96B6B]">
                      ✕ {12 - item.completedCount} missed
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Today's Habits Section with Status Legend and Counts */}
      <section className="space-y-3 pt-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold text-white">
                Today's habits
              </h2>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700/60 font-medium tabular-nums">
                🟢 {stats.todayCompletedCount} · ⚪ {stats.todayTotalCount - stats.todayCompletedCount} pending
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              Day {stats.currentDayNumber} is active. Incomplete habits remain neutral until the day ends.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <StatusLegend className="hidden sm:flex" />
            <button
              type="button"
              onClick={() => onNavigate('today')}
              className="px-3 py-1.5 rounded-xl text-xs font-medium bg-[#181C24] text-zinc-200 hover:bg-[#202530] border border-[#262B36] transition-all flex items-center gap-1.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#5B8DEF]"
            >
              <span>Focus view & notes</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Status legend on mobile */}
        <StatusLegend className="sm:hidden px-1 pt-0.5" />

        {/* 12 Habits Bubble Cards List */}
        <div className="space-y-2.5">
          {HABIT_DEFINITIONS.map((habit) => {
            const isCompleted = !!todayHabits[habit.id];
            let customTarget: string | undefined = undefined;

            if (habit.id === 'hydration') {
              customTarget = `${(todayHydration.totalMl / 1000).toFixed(1)} L / ${(goalMl / 1000).toFixed(1)} L`;
            } else if (habit.id === 'avoidNegativeHabits' && state.settings.negativeHabitsList) {
              customTarget = state.settings.negativeHabitsList;
            } else if (habit.id === 'study' && state.settings.studyTarget) {
              customTarget = state.settings.studyTarget;
            } else if (habit.id === 'skillDevelopment' && state.settings.skillTarget) {
              customTarget = state.settings.skillTarget;
            }

            return (
              <HabitRow
                key={habit.id}
                habit={habit}
                isCompleted={isCompleted}
                dayNumber={stats.currentDayNumber}
                currentDayNumber={stats.currentDayNumber}
                onToggle={(id) => onToggleHabit(id, stats.currentDayNumber)}
                customTarget={customTarget}
                theme={theme}
              />
            );
          })}
        </div>
      </section>
    </div>
  );
};

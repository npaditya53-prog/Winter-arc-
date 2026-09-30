import React, { useState } from 'react';
import {
  TrendingUp,
  Flame,
  CheckCircle2,
  BarChart2,
  AlertCircle,
} from 'lucide-react';
import { ChallengeState, OverallStats } from '../types/challenge';
import {
  calculateHabitConsistency,
  formatDisplayDate,
  get30DayHistory,
  get7DayHistory,
  getCurrentDayNumber,
  getPhaseBreakdown,
} from '../utils/calculations';
import { HABIT_VISUAL_MAP } from '../constants/habits';
import { StatusLegend } from './StatusLegend';

interface AnalyticsViewProps {
  state: ChallengeState;
  stats: OverallStats;
  theme: 'dark' | 'light';
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  state,
  stats,
  theme,
}) => {
  const isDark = theme === 'dark';
  const currentDayNum = getCurrentDayNumber(state.settings.startDate);
  const habitConsistency = calculateHabitConsistency(state);
  const history7 = get7DayHistory(state, currentDayNum);
  const history30 = get30DayHistory(state);
  const phases = getPhaseBreakdown(state);

  const [habitSortOrder, setHabitSortOrder] = useState<'lowest' | 'highest' | 'order'>('lowest');

  const sortedHabits = [...habitConsistency].sort((a, b) => {
    if (habitSortOrder === 'lowest') return a.percentage - b.percentage;
    if (habitSortOrder === 'highest') return b.percentage - a.percentage;
    return a.number.localeCompare(b.number);
  });

  const sevenDaySum = history7.reduce((acc, curr) => acc + curr.percentage, 0);
  const sevenDayAvg = history7.length > 0 ? Math.round(sevenDaySum / history7.length) : 0;

  const chartHeight = 120;
  const chartWidth = 560;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-16">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#5B8DEF]/15 text-[#5B8DEF] flex items-center justify-center">
            <BarChart2 className="w-3.5 h-3.5" />
          </div>
          <h1 className="text-xl font-semibold text-white tracking-tight">
            Analytics & Adherence
          </h1>
        </div>
        <p className="text-xs text-zinc-400 mt-1">
          Unified status tracking: <strong className="text-[#4CAF78]">Green = Completed</strong>, <strong className="text-[#D96B6B]">Red = Missed</strong>, <strong className="text-zinc-400">Neutral = Pending</strong>. Future days are never counted as missed.
        </p>
      </div>

      {/* 4 Core Summary Bubble Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Evaluated adherence */}
        <div
          className={`p-4 rounded-2xl border transition-all ${
            isDark ? 'bg-[#13161C] border-[#222730]' : 'bg-white border-zinc-200 shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-zinc-400">Evaluated adherence</span>
            <div className="w-6 h-6 rounded-lg bg-[#5B8DEF]/15 text-[#5B8DEF] flex items-center justify-center">
              <TrendingUp className="w-3.5 h-3.5" />
            </div>
          </div>
          <span className="text-2xl font-semibold text-white tabular-nums block mt-1.5">
            {stats.overallProgress}%
          </span>
          <p className="text-[11px] text-zinc-400 mt-1">
            Across Days 1–{stats.currentDayNumber} ({stats.evaluatedDaysCount} days)
          </p>
        </div>

        {/* Streak adherence */}
        <div
          className={`p-4 rounded-2xl border transition-all ${
            isDark ? 'bg-[#13161C] border-[#222730]' : 'bg-white border-zinc-200 shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-zinc-400">Current streak</span>
            <div className="w-6 h-6 rounded-lg bg-[#E99A62]/15 text-[#E99A62] flex items-center justify-center">
              <Flame className="w-3.5 h-3.5" />
            </div>
          </div>
          <span className="text-2xl font-semibold text-white tabular-nums block mt-1.5">
            {stats.currentStreak} <span className="text-xs font-normal text-zinc-400">/ {stats.bestStreak} best</span>
          </span>
          <p className="text-[11px] text-zinc-400 mt-1">
            Qualifying days (≥{state.settings.streakThreshold}%)
          </p>
        </div>

        {/* Completed days */}
        <div
          className={`p-4 rounded-2xl border transition-all ${
            isDark ? 'bg-[#13161C] border-[#222730]' : 'bg-white border-zinc-200 shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-zinc-400">Qualifying days</span>
            <div className="w-6 h-6 rounded-lg bg-[#4CAF78]/15 text-[#4CAF78] flex items-center justify-center">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
          </div>
          <span className="text-2xl font-semibold text-[#4CAF78] tabular-nums block mt-1.5">
            {stats.qualifyingDaysCount} <span className="text-xs font-normal text-zinc-400">of {stats.evaluatedDaysCount}</span>
          </span>
          <p className="text-[11px] text-zinc-400 mt-1">
            🟢 {stats.completedDaysCount} with 100% adherence
          </p>
        </div>

        {/* Missed days */}
        <div
          className={`p-4 rounded-2xl border transition-all ${
            isDark ? 'bg-[#13161C] border-[#222730]' : 'bg-white border-zinc-200 shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-zinc-400">Missed days</span>
            <div className="w-6 h-6 rounded-lg bg-[#D96B6B]/15 text-[#D96B6B] flex items-center justify-center">
              <AlertCircle className="w-3.5 h-3.5" />
            </div>
          </div>
          <span className="text-2xl font-semibold text-[#D96B6B] tabular-nums block mt-1.5">
            {stats.missedDaysCount} <span className="text-xs font-normal text-zinc-400">past days</span>
          </span>
          <p className="text-[11px] text-zinc-400 mt-1">
            ⚪ {stats.futureDaysCount} upcoming (not penalized)
          </p>
        </div>
      </div>

      {/* 30-Day Completion Trend Chart */}
      <section
        className={`p-4 sm:p-5 rounded-2xl border transition-colors ${
          isDark ? 'bg-[#13161C] border-[#222730]' : 'bg-white border-zinc-200 shadow-sm'
        }`}
      >
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#20252E]">
          <div>
            <h2 className="text-sm font-semibold text-white">
              30-day completion trend
            </h2>
            <p className="text-xs text-zinc-400">
              Daily percentage adherence over the evaluated challenge days
            </p>
          </div>
          <span className="text-xs text-zinc-400 tabular-nums">
            Average: <strong className="text-white">{stats.averageDailyCompletion}%</strong>
          </span>
        </div>

        {history30.length === 0 ? (
          <div className="py-8 text-center text-xs text-zinc-500">
            No history recorded yet. Complete habits to generate trend data.
          </div>
        ) : (
          <div className="pt-2 overflow-x-auto">
            <div className="min-w-[500px]">
              {/* SVG Trend Line */}
              <div className="h-32 w-full relative flex items-end">
                <svg
                  viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                  className="w-full h-full overflow-visible"
                  preserveAspectRatio="none"
                >
                  {/* Grid guidelines */}
                  <line x1="0" y1={chartHeight * 0.25} x2={chartWidth} y2={chartHeight * 0.25} stroke="#222730" strokeDasharray="3 3" />
                  <line x1="0" y1={chartHeight * 0.5} x2={chartWidth} y2={chartHeight * 0.5} stroke="#222730" strokeDasharray="3 3" />
                  <line x1="0" y1={chartHeight * 0.75} x2={chartWidth} y2={chartHeight * 0.75} stroke="#222730" strokeDasharray="3 3" />

                  {/* Threshold line */}
                  <line
                    x1="0"
                    y1={chartHeight * (1 - state.settings.streakThreshold / 100)}
                    x2={chartWidth}
                    y2={chartHeight * (1 - state.settings.streakThreshold / 100)}
                    stroke="#4CAF78"
                    strokeDasharray="4 4"
                    strokeOpacity="0.4"
                  />

                  {/* Area fill */}
                  <polygon
                    points={`0,${chartHeight} ${history30
                      .map((d, idx) => {
                        const x = (idx / Math.max(1, history30.length - 1)) * chartWidth;
                        const y = chartHeight * (1 - d.percentage / 100);
                        return `${x},${y}`;
                      })
                      .join(' ')} ${chartWidth},${chartHeight}`}
                    fill="url(#trendGradient)"
                    opacity="0.25"
                  />

                  {/* Gradient definition */}
                  <defs>
                    <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#4CAF78" stopOpacity="0.8" />
                      <stop offset="100%" stopColor="#4CAF78" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>

                  {/* Line path */}
                  <polyline
                    fill="none"
                    stroke="#4CAF78"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points={history30
                      .map((d, idx) => {
                        const x = (idx / Math.max(1, history30.length - 1)) * chartWidth;
                        const y = chartHeight * (1 - d.percentage / 100);
                        return `${x},${y}`;
                      })
                      .join(' ')}
                  />

                  {/* Data points */}
                  {history30.map((d, idx) => {
                    const x = (idx / Math.max(1, history30.length - 1)) * chartWidth;
                    const y = chartHeight * (1 - d.percentage / 100);
                    const qualifies = d.percentage >= state.settings.streakThreshold;
                    return (
                      <circle
                        key={d.dayNumber}
                        cx={x}
                        cy={y}
                        r="3.5"
                        fill={qualifies ? '#4CAF78' : '#D96B6B'}
                        stroke="#13161C"
                        strokeWidth="1.5"
                      />
                    );
                  })}
                </svg>
              </div>

              {/* Day numbers at bottom */}
              <div className="flex justify-between text-[10px] text-zinc-500 tabular-nums mt-2 px-1">
                {history30.map((d, idx) => {
                  if (idx % 3 === 0 || idx === history30.length - 1) {
                    return <span key={d.dayNumber}>D{d.dayNumber}</span>;
                  }
                  return null;
                })}
              </div>
            </div>
          </div>
        )}
      </section>

      {/* 7-Day Completion Rates */}
      <section
        className={`p-4 sm:p-5 rounded-2xl border transition-colors ${
          isDark ? 'bg-[#13161C] border-[#222730]' : 'bg-white border-zinc-200 shadow-sm'
        }`}
      >
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#20252E]">
          <div>
            <h2 className="text-sm font-semibold text-white">
              Recent 7 days
            </h2>
            <p className="text-xs text-zinc-400">
              Green = Met streak threshold · Red = Missed threshold · Blue = Active today
            </p>
          </div>
          <div className="text-xs text-zinc-400 tabular-nums">
            7-day average: <span className="text-[#5B8DEF] font-medium">{sevenDayAvg}%</span>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-2">
          {history7.map((item) => {
            const isToday = item.isToday;
            const qualifies = item.percentage >= state.settings.streakThreshold;

            let colStyle = 'border-[#222730] bg-[#181C24]/60';
            if (isToday) {
              colStyle = 'border-[#5B8DEF]/60 bg-[#5B8DEF]/10';
            } else if (qualifies) {
              colStyle = 'border-[#4CAF78]/40 bg-[#4CAF78]/10';
            } else {
              colStyle = 'border-[#D96B6B]/40 bg-[#D96B6B]/10';
            }

            return (
              <div
                key={item.dayNumber}
                className={`p-2.5 rounded-xl border text-center transition-all ${colStyle}`}
              >
                <div className="text-[11px] font-medium text-zinc-300 tabular-nums">
                  Day {String(item.dayNumber).padStart(2, '0')}
                </div>
                <div className="text-[10px] text-zinc-400 tabular-nums">
                  {formatDisplayDate(item.date, 'short')}
                </div>

                <div className="h-16 w-full flex items-end justify-center py-1.5">
                  <div
                    className={`w-5 rounded-t transition-all ${
                      isToday
                        ? 'bg-[#5B8DEF]'
                        : qualifies
                        ? 'bg-[#4CAF78]'
                        : 'bg-[#D96B6B]'
                    }`}
                    style={{ height: `${Math.max(8, item.percentage)}%` }}
                  />
                </div>

                <div className="text-xs font-semibold text-white tabular-nums">
                  {item.percentage}%
                </div>
                <div className="text-[10px] tabular-nums">
                  {isToday ? (
                    <span className="text-zinc-400">✓ {item.completedCount}</span>
                  ) : qualifies ? (
                    <span className="text-[#4CAF78]">✓ {item.completedCount}/12</span>
                  ) : (
                    <span className="text-[#D96B6B]">✕ {12 - item.completedCount}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Monthly (30-Day Phase) Progression */}
      <section
        className={`p-4 sm:p-5 rounded-2xl border transition-colors ${
          isDark ? 'bg-[#13161C] border-[#222730]' : 'bg-white border-zinc-200 shadow-sm'
        }`}
      >
        <div className="pb-3 mb-3 border-b border-[#20252E]">
          <h2 className="text-sm font-semibold text-white">
            Monthly phases (30-day blocks)
          </h2>
          <p className="text-xs text-zinc-400">
            Progress across the three sequential stages of the 90 days
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {phases.map((phase) => (
            <div
              key={phase.phaseNumber}
              className={`p-4 rounded-xl border transition-all ${
                phase.isActive
                  ? 'border-[#5B8DEF]/50 bg-[#5B8DEF]/10'
                  : phase.isCompleted
                  ? 'border-[#4CAF78]/40 bg-[#4CAF78]/10'
                  : isDark
                  ? 'border-[#222730] bg-[#181C24]/60 text-zinc-400'
                  : 'border-zinc-200 bg-zinc-50 text-zinc-600'
              }`}
            >
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-400">
                  {phase.subtitle}
                </span>
                {phase.isActive && (
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#5B8DEF]/20 text-[#5B8DEF] font-medium">
                    Active
                  </span>
                )}
                {phase.isCompleted && (
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#4CAF78]/20 text-[#4CAF78] font-medium">
                    Completed
                  </span>
                )}
              </div>

              <h3 className="text-sm font-semibold text-white mt-1">
                {phase.name}
              </h3>

              <div className="mt-3 pt-2.5 border-t border-[#222730] space-y-1.5 text-xs tabular-nums">
                <div className="flex justify-between">
                  <span className="text-zinc-400">Average adherence:</span>
                  <span className="font-semibold text-white">{phase.averagePercentage}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">100% complete days:</span>
                  <span className="text-[#4CAF78] font-medium">{phase.completedDaysCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Qualifying days:</span>
                  <span className="text-[#5B8DEF] font-medium">{phase.qualifyingDaysCount}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Habit Performance & Consistency (Section 13) */}
      <section
        className={`p-4 sm:p-5 rounded-2xl border transition-colors ${
          isDark ? 'bg-[#13161C] border-[#222730]' : 'bg-white border-zinc-200 shadow-sm'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 mb-3 border-b border-[#20252E] gap-2">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-white">
                Habit performance breakdown
              </h2>
              <StatusLegend />
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              Calculated across evaluated days (Day 1–{currentDayNum}). Future days are never counted as missed.
            </p>
          </div>

          {/* Sort order toggle buttons */}
          <div
            className={`flex items-center gap-1 p-0.5 rounded-xl border self-start sm:self-auto text-xs ${
              isDark ? 'bg-[#181C24] border-[#262B36]' : 'bg-zinc-100 border-zinc-300'
            }`}
          >
            <button
              type="button"
              onClick={() => setHabitSortOrder('lowest')}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                habitSortOrder === 'lowest' ? 'bg-[#5B8DEF] text-[#0B0C0F] font-semibold' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Lowest first
            </button>
            <button
              type="button"
              onClick={() => setHabitSortOrder('highest')}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                habitSortOrder === 'highest' ? 'bg-[#5B8DEF] text-[#0B0C0F] font-semibold' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Highest first
            </button>
            <button
              type="button"
              onClick={() => setHabitSortOrder('order')}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                habitSortOrder === 'order' ? 'bg-[#5B8DEF] text-[#0B0C0F] font-semibold' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Order (1–12)
            </button>
          </div>
        </div>

        <div className="space-y-2.5">
          {sortedHabits.map((item) => {
            const isWeak = item.percentage < 60;
            const visual = HABIT_VISUAL_MAP[item.id] || {
              accent: '#5B8DEF',
              categoryAccent: '#5B8DEF',
            };

            return (
              <div
                key={item.id}
                className={`p-3 rounded-xl border transition-all ${
                  isWeak && currentDayNum > 2
                    ? 'border-[#D96B6B]/30 bg-[#D96B6B]/8'
                    : isDark
                    ? 'border-[#222730] bg-[#181C24]/60'
                    : 'border-zinc-200 bg-zinc-50'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-1 mb-2">
                  <div className="flex items-center gap-2">
                    <span
                      className="font-mono tabular-nums px-1.5 py-0.5 rounded text-[11px] font-medium shrink-0"
                      style={{
                        backgroundColor: `${visual.accent}18`,
                        color: visual.accent,
                      }}
                    >
                      {item.number}
                    </span>
                    <span className="font-semibold text-white">
                      {item.name}
                    </span>
                  </div>

                  {/* Section 13 Status Counts */}
                  <div className="flex items-center gap-2 tabular-nums text-xs">
                    <span className="text-[#4CAF78] font-medium flex items-center gap-0.5">
                      🟢 {item.completedDays} done
                    </span>
                    <span className="text-zinc-600">·</span>
                    <span className="text-[#D96B6B] font-medium flex items-center gap-0.5">
                      🔴 {item.missedDays} missed
                    </span>
                    {item.pendingDays > 0 && (
                      <>
                        <span className="text-zinc-600">·</span>
                        <span className="text-zinc-400 flex items-center gap-0.5">
                          ⚪ {item.pendingDays} today
                        </span>
                      </>
                    )}
                    <span className="text-zinc-600">·</span>
                    <span className="text-sm font-semibold text-white">
                      {item.percentage}%
                    </span>
                  </div>
                </div>

                {/* Progress bar using status colors */}
                <div className="w-full bg-[#101318] h-2 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${item.percentage}%`,
                      backgroundColor: item.percentage >= 75 ? '#4CAF78' : visual.accent,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};

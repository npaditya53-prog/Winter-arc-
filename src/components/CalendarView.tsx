import React, { useState } from 'react';
import { Check, X, Calendar } from 'lucide-react';
import { ChallengeState } from '../types/challenge';
import { calculateDayStats, getCurrentDayNumber } from '../utils/calculations';

interface CalendarViewProps {
  state: ChallengeState;
  onOpenDay: (dayNumber: number) => void;
  theme: 'dark' | 'light';
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  state,
  onOpenDay,
  theme,
}) => {
  const isDark = theme === 'dark';
  const currentDayNum = getCurrentDayNumber(state.settings.startDate);
  const streakThreshold = state.settings.streakThreshold || 75;

  const [selectedPhase, setSelectedPhase] = useState<'all' | 'phase1' | 'phase2' | 'phase3'>('all');

  // Calculate status counts strictly distinguishing past, today, and future
  let qualifyingCompletedCount = 0; // past days qualifying (>= threshold)
  let missedDaysCount = 0; // past days missed (< threshold)
  let todayCount = 1;
  let futureDaysCount = Math.max(0, 90 - currentDayNum);

  for (let i = 1; i < currentDayNum; i++) {
    const stats = calculateDayStats(state.days[i]);
    if (stats.percentage >= streakThreshold) {
      qualifyingCompletedCount++;
    } else {
      missedDaysCount++;
    }
  }

  // Filter days by phase
  const allDayNumbers = Array.from({ length: 90 }, (_, i) => i + 1);
  const visibleDayNumbers = allDayNumbers.filter((dayNum) => {
    if (selectedPhase === 'phase1') return dayNum >= 1 && dayNum <= 30;
    if (selectedPhase === 'phase2') return dayNum >= 31 && dayNum <= 60;
    if (selectedPhase === 'phase3') return dayNum >= 61 && dayNum <= 90;
    return true;
  });

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-16">
      {/* Calendar Header & Status Overview */}
      <section
        className={`p-4 sm:p-5 rounded-2xl border transition-colors ${
          isDark ? 'bg-[#13161C] border-[#222730]' : 'bg-white border-zinc-200 shadow-sm'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-4 border-b border-[#20252E]">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[#5B8DEF]/15 text-[#5B8DEF] flex items-center justify-center">
                <Calendar className="w-3.5 h-3.5" />
              </div>
              <h1 className="text-xl font-semibold text-white tracking-tight">
                Challenge calendar
              </h1>
            </div>
            <p className="text-xs text-zinc-400 mt-1">
              90 days of discipline. Green = met, Red = missed, Neutral = active / upcoming.
            </p>
          </div>

          {/* Phase Filter Buttons */}
          <div
            className={`flex items-center gap-1 p-1 rounded-xl border self-start sm:self-auto ${
              isDark ? 'bg-[#181C24] border-[#262B36]' : 'bg-zinc-100 border-zinc-300'
            }`}
          >
            <button
              type="button"
              onClick={() => setSelectedPhase('all')}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                selectedPhase === 'all'
                  ? 'bg-[#5B8DEF] text-[#0B0C0F] font-semibold shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              All 90
            </button>
            <button
              type="button"
              onClick={() => setSelectedPhase('phase1')}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                selectedPhase === 'phase1'
                  ? 'bg-[#5B8DEF] text-[#0B0C0F] font-semibold shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Days 1–30
            </button>
            <button
              type="button"
              onClick={() => setSelectedPhase('phase2')}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                selectedPhase === 'phase2'
                  ? 'bg-[#5B8DEF] text-[#0B0C0F] font-semibold shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Days 31–60
            </button>
            <button
              type="button"
              onClick={() => setSelectedPhase('phase3')}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                selectedPhase === 'phase3'
                  ? 'bg-[#5B8DEF] text-[#0B0C0F] font-semibold shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Days 61–90
            </button>
          </div>
        </div>

        {/* Legend / Status Stats Bar */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-zinc-400">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#4CAF78] inline-block" />
            <span>
              Qualifying past days (≥{streakThreshold}%):{' '}
              <strong className="text-white tabular-nums">{qualifyingCompletedCount}</strong>
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#D96B6B] inline-block" />
            <span>
              Missed past days (&lt;{streakThreshold}%):{' '}
              <strong className="text-white tabular-nums">{missedDaysCount}</strong>
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full ring-2 ring-[#5B8DEF] bg-transparent inline-block" />
            <span className="text-[#5B8DEF] font-medium">
              Today: Day {currentDayNum} (Active)
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-zinc-600 inline-block" />
            <span>
              Upcoming future days:{' '}
              <strong className="text-zinc-300 tabular-nums">{futureDaysCount}</strong>
            </span>
          </div>
        </div>
      </section>

      {/* 90-Day Grid Layout */}
      <section
        className={`p-4 sm:p-5 rounded-2xl border transition-colors ${
          isDark ? 'bg-[#13161C] border-[#222730]' : 'bg-white border-zinc-200 shadow-sm'
        }`}
      >
        <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-10 gap-2 sm:gap-2.5">
          {visibleDayNumbers.map((dayNum) => {
            const dayRec = state.days[dayNum];
            const stats = calculateDayStats(dayRec);
            const isToday = dayNum === currentDayNum;
            const isPast = dayNum < currentDayNum;
            const isFuture = dayNum > currentDayNum;
            const qualifies = stats.percentage >= streakThreshold;

            let tileStyle = '';
            if (isToday) {
              tileStyle = isDark
                ? 'bg-[#5B8DEF]/10 border-[#5B8DEF]/60 text-white ring-2 ring-[#5B8DEF]/60'
                : 'bg-blue-50 border-blue-400 text-blue-900 ring-2 ring-blue-400';
            } else if (isPast) {
              if (qualifies) {
                tileStyle = isDark
                  ? 'bg-[#4CAF78]/10 border-[#4CAF78]/40 text-[#4CAF78] hover:border-[#4CAF78]'
                  : 'bg-emerald-50 border-emerald-300 text-emerald-900 hover:border-emerald-500';
              } else {
                tileStyle = isDark
                  ? 'bg-[#D96B6B]/10 border-[#D96B6B]/40 text-[#D96B6B] hover:border-[#D96B6B]'
                  : 'bg-rose-50 border-rose-300 text-rose-900 hover:border-rose-400';
              }
            } else {
              // Future days: ALWAYS neutral, never red!
              tileStyle = isDark
                ? 'bg-[#181C24]/40 border-[#222730] text-zinc-500 hover:border-zinc-600'
                : 'bg-zinc-50 border-zinc-200 text-zinc-400 hover:border-zinc-300';
            }

            return (
              <button
                key={dayNum}
                type="button"
                onClick={() => onOpenDay(dayNum)}
                className={`flex flex-col justify-between p-2.5 rounded-xl border text-left transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#5B8DEF] min-h-[78px] hover:translate-y-[-1px] ${tileStyle}`}
              >
                <div className="flex items-center justify-between w-full">
                  <span
                    className={`text-[11px] tabular-nums font-medium ${
                      isToday
                        ? 'text-[#5B8DEF] font-semibold'
                        : isPast
                        ? 'opacity-85 font-medium'
                        : 'opacity-50'
                    }`}
                  >
                    Day {String(dayNum).padStart(2, '0')}
                  </span>

                  {isPast && qualifies && (
                    <Check className="w-3 h-3 text-[#4CAF78] stroke-[3]" />
                  )}
                  {isPast && !qualifies && (
                    <X className="w-3 h-3 text-[#D96B6B] stroke-[3]" />
                  )}
                </div>

                <div className="py-1">
                  {isFuture ? (
                    <div className="text-xs font-normal text-zinc-500">
                      Upcoming
                    </div>
                  ) : (
                    <>
                      <div className="text-base font-semibold text-white tabular-nums leading-none">
                        {stats.percentage}%
                      </div>
                      <div className="text-[10px] opacity-80 tabular-nums mt-0.5">
                        {isToday ? (
                          <span>✓ {stats.completedCount} · □ {12 - stats.completedCount}</span>
                        ) : qualifies ? (
                          <span className="text-[#4CAF78]">✓ {stats.completedCount}/12</span>
                        ) : (
                          <span className="text-[#D96B6B]">✕ {12 - stats.completedCount} missed</span>
                        )}
                      </div>
                    </>
                  )}
                </div>

                {/* Progress track */}
                <div className="w-full bg-[#101318] h-1.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      isFuture
                        ? 'bg-transparent'
                        : isToday
                        ? 'bg-[#5B8DEF]'
                        : qualifies
                        ? 'bg-[#4CAF78]'
                        : 'bg-[#D96B6B]'
                    }`}
                    style={{ width: `${isFuture ? 0 : stats.percentage}%` }}
                  />
                </div>
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
};

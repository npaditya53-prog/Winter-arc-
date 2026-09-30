import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, BookOpen } from 'lucide-react';
import { HABIT_DEFINITIONS, MOTIVATIONAL_REFLECTIONS } from '../constants/habits';
import { ChallengeState, DayRecord, HabitDefinition } from '../types/challenge';
import {
  calculateDayHabitStatusSummary,
  formatDisplayDate,
  getCurrentDayNumber,
} from '../utils/calculations';
import { HabitRow } from './HabitRow';
import { StatusLegend } from './StatusLegend';
import { ConfirmHistoricalEditModal } from './ConfirmHistoricalEditModal';

interface TodayViewProps {
  state: ChallengeState;
  activeDayNumber: number;
  onSelectDayNumber: (dayNumber: number) => void;
  onToggleHabit: (habitId: string, dayNumber: number) => void;
  onUpdateReflection: (dayNumber: number, reflection: { wentWell: string; couldImprove: string; notes: string }) => void;
  theme: 'dark' | 'light';
}

export const TodayView: React.FC<TodayViewProps> = ({
  state,
  activeDayNumber,
  onSelectDayNumber,
  onToggleHabit,
  onUpdateReflection,
  theme,
}) => {
  const isDark = theme === 'dark';
  const currentActualDayNumber = getCurrentDayNumber(state.settings.startDate);
  const isViewingCurrentDay = activeDayNumber === currentActualDayNumber;
  const isPastDay = activeDayNumber < currentActualDayNumber;
  const isFutureDay = activeDayNumber > currentActualDayNumber;

  const dayRecord: DayRecord | undefined = state.days[activeDayNumber];
  const daySummary = calculateDayHabitStatusSummary(
    dayRecord,
    activeDayNumber,
    currentActualDayNumber
  );

  // Past day confirmation modal state
  const [habitToConfirm, setHabitToConfirm] = useState<HabitDefinition | null>(null);

  // Reflection form state
  const [wentWell, setWentWell] = useState(dayRecord?.reflection?.wentWell || '');
  const [couldImprove, setCouldImprove] = useState(dayRecord?.reflection?.couldImprove || '');
  const [notes, setNotes] = useState(dayRecord?.reflection?.notes || '');
  const [hasUnsavedReflection, setHasUnsavedReflection] = useState(false);

  // Sync when active day changes
  useEffect(() => {
    setWentWell(dayRecord?.reflection?.wentWell || '');
    setCouldImprove(dayRecord?.reflection?.couldImprove || '');
    setNotes(dayRecord?.reflection?.notes || '');
    setHasUnsavedReflection(false);
  }, [activeDayNumber, dayRecord]);

  // Debounced auto-save for reflections
  useEffect(() => {
    if (!hasUnsavedReflection) return;
    const timer = setTimeout(() => {
      onUpdateReflection(activeDayNumber, { wentWell, couldImprove, notes });
      setHasUnsavedReflection(false);
    }, 600);
    return () => clearTimeout(timer);
  }, [wentWell, couldImprove, notes, hasUnsavedReflection, activeDayNumber, onUpdateReflection]);

  const motivationalQuote = MOTIVATIONAL_REFLECTIONS[(activeDayNumber - 1) % MOTIVATIONAL_REFLECTIONS.length];

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-16">
      {/* Day Selector Bubble Bar */}
      <div
        className={`flex items-center justify-between p-3 sm:p-3.5 rounded-2xl border transition-colors ${
          isDark ? 'bg-[#13161C] border-[#222730]' : 'bg-white border-zinc-200 shadow-sm'
        }`}
      >
        <button
          type="button"
          onClick={() => onSelectDayNumber(Math.max(1, activeDayNumber - 1))}
          disabled={activeDayNumber <= 1}
          className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[#5B8DEF] ${
            activeDayNumber <= 1
              ? 'opacity-30 cursor-not-allowed border-transparent text-zinc-500'
              : isDark
              ? 'border-zinc-700 bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white'
              : 'border-zinc-300 bg-zinc-100 text-zinc-700 hover:bg-zinc-200 hover:text-zinc-900'
          }`}
        >
          <ChevronLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Previous day</span>
        </button>

        <div className="text-center">
          <div className="flex items-center justify-center gap-2">
            <span className="font-semibold text-base text-white tabular-nums tracking-tight">
              Day {String(activeDayNumber).padStart(2, '0')} of 90
            </span>
            {isViewingCurrentDay && (
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#5B8DEF]/15 text-[#5B8DEF] font-medium border border-[#5B8DEF]/25">
                Today
              </span>
            )}
            {isPastDay && (
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 font-medium border border-zinc-700/40">
                Historical
              </span>
            )}
            {isFutureDay && (
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 font-medium border border-zinc-700/40">
                Upcoming
              </span>
            )}
          </div>
          <p className="text-xs text-zinc-400 mt-0.5">
            {formatDisplayDate(dayRecord?.date || '')}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {!isViewingCurrentDay && (
            <button
              type="button"
              onClick={() => onSelectDayNumber(currentActualDayNumber)}
              className="text-xs text-[#5B8DEF] hover:underline px-2 py-1 rounded hidden sm:inline"
            >
              Today
            </button>
          )}

          <button
            type="button"
            onClick={() => onSelectDayNumber(Math.min(90, activeDayNumber + 1))}
            disabled={activeDayNumber >= 90}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[#5B8DEF] ${
              activeDayNumber >= 90
                ? 'opacity-30 cursor-not-allowed border-transparent text-zinc-500'
                : isDark
                ? 'border-zinc-700 bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white'
                : 'border-zinc-300 bg-zinc-100 text-zinc-700 hover:bg-zinc-200 hover:text-zinc-900'
            }`}
          >
            <span className="hidden sm:inline">Next day</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Progress & Status Summary Section */}
      <section
        className={`p-4 sm:p-5 rounded-2xl border transition-colors ${
          isDark ? 'bg-[#13161C] border-[#222730]' : 'bg-white border-zinc-200 shadow-sm'
        }`}
      >
        <div className="flex items-baseline justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-white tracking-tight">
              {isViewingCurrentDay
                ? "Today's progress"
                : isPastDay
                ? `Day ${activeDayNumber} historical status`
                : `Day ${activeDayNumber} preview`}
            </h2>

            <div className="text-xs text-zinc-400 mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
              {isPastDay ? (
                <>
                  <span className="text-[#4CAF78] font-medium">
                    🟢 {daySummary.completedCount} completed
                  </span>
                  <span>·</span>
                  <span className="text-[#D96B6B] font-medium">
                    🔴 {daySummary.missedCount} missed
                  </span>
                  <span>·</span>
                  <span>
                    Adherence: <strong>{daySummary.percentage}%</strong>
                  </span>
                </>
              ) : isViewingCurrentDay ? (
                <>
                  <span className="text-[#4CAF78] font-medium">
                    🟢 {daySummary.completedCount} completed
                  </span>
                  <span>·</span>
                  <span className="text-zinc-400">
                    ⚪ {daySummary.pendingCount} pending
                  </span>
                  <span>·</span>
                  <span>
                    Progress: <strong>{daySummary.percentage}%</strong>
                  </span>
                </>
              ) : (
                <span className="text-zinc-400">
                  ⚪ Upcoming day — not yet evaluated
                </span>
              )}
            </div>
          </div>

          <div className="text-right">
            <span className="text-2xl font-semibold text-white tabular-nums">
              {isFutureDay ? '—' : `${daySummary.percentage}%`}
            </span>
          </div>
        </div>

        {/* Linear progress bar */}
        <div className="w-full bg-[#181C24] h-2.5 rounded-full overflow-hidden mt-3 border border-[#222730]">
          <div
            className={`h-full rounded-full transition-all duration-300 ${
              daySummary.percentage === 100
                ? 'bg-[#4CAF78]'
                : isPastDay && daySummary.percentage < state.settings.streakThreshold
                ? 'bg-[#D96B6B]'
                : 'bg-[#5B8DEF]'
            }`}
            style={{ width: `${isFutureDay ? 0 : daySummary.percentage}%` }}
          />
        </div>

        <p className="text-xs text-zinc-400 italic mt-3">
          &ldquo;{motivationalQuote}&rdquo;
        </p>
      </section>

      {/* 12 Habits Vertical Bubble Checklist */}
      <section className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1">
          <div>
            <h3 className="text-sm font-semibold text-white">
              Daily habits (12 disciplines)
            </h3>
            <span className="text-xs text-zinc-400">
              {isPastDay
                ? 'Review past records. Click a missed habit to calibrate.'
                : isViewingCurrentDay
                ? 'Click to complete or undo habits for today.'
                : 'Preview of upcoming disciplines.'}
            </span>
          </div>

          <StatusLegend />
        </div>

        <div className="space-y-2.5">
          {HABIT_DEFINITIONS.map((habit) => {
            const isCompleted = !!dayRecord?.habits?.[habit.id];
            let customTarget: string | undefined = undefined;

            if (habit.id === 'hydration') {
              customTarget = state.settings.hydrationGoal || 'Daily Hydration Goal';
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
                dayNumber={activeDayNumber}
                currentDayNumber={currentActualDayNumber}
                onToggle={(id) => onToggleHabit(id, activeDayNumber)}
                onRequestConfirmPastEdit={(h) => setHabitToConfirm(h)}
                customTarget={customTarget}
                theme={theme}
              />
            );
          })}
        </div>
      </section>

      {/* Daily Reflection Section */}
      <section
        className={`p-4 sm:p-5 rounded-2xl border transition-colors ${
          isDark ? 'bg-[#13161C] border-[#222730]' : 'bg-white border-zinc-200 shadow-sm'
        }`}
      >
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#20252E]">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#5B8DEF]/15 text-[#5B8DEF] flex items-center justify-center">
              <BookOpen className="w-3.5 h-3.5" />
            </div>
            <h3 className="text-sm font-semibold text-white">
              Daily reflection
            </h3>
          </div>
          <span className="text-xs text-zinc-400">
            {hasUnsavedReflection ? 'Saving...' : 'Auto-saved'}
          </span>
        </div>

        <p className="text-xs text-zinc-400 mb-3">
          Notes on your daily discipline and what to calibrate for tomorrow.
        </p>

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">
              What went well today?
            </label>
            <input
              type="text"
              value={wentWell}
              onChange={(e) => {
                setWentWell(e.target.value);
                setHasUnsavedReflection(true);
              }}
              placeholder="e.g. Woke up on time, completed 1-hour skill practice"
              className={`w-full px-3 py-2 rounded-xl text-sm border focus:outline-none focus:ring-1 focus:ring-[#5B8DEF] ${
                isDark
                  ? 'bg-zinc-900 border-zinc-700/80 text-white placeholder-zinc-500'
                  : 'bg-zinc-50 border-zinc-300 text-zinc-900 placeholder-zinc-400'
              }`}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">
              What could I improve?
            </label>
            <input
              type="text"
              value={couldImprove}
              onChange={(e) => {
                setCouldImprove(e.target.value);
                setHasUnsavedReflection(true);
              }}
              placeholder="e.g. Turn phone off earlier before 9:00 PM bedtime"
              className={`w-full px-3 py-2 rounded-xl text-sm border focus:outline-none focus:ring-1 focus:ring-[#5B8DEF] ${
                isDark
                  ? 'bg-zinc-900 border-zinc-700/80 text-white placeholder-zinc-500'
                  : 'bg-zinc-50 border-zinc-300 text-zinc-900 placeholder-zinc-400'
              }`}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">
              Notes
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => {
                setNotes(e.target.value);
                setHasUnsavedReflection(true);
              }}
              placeholder="Any workout notes, key insights, or thoughts..."
              className={`w-full px-3 py-2 rounded-xl text-sm border focus:outline-none focus:ring-1 focus:ring-[#5B8DEF] resize-none ${
                isDark
                  ? 'bg-zinc-900 border-zinc-700/80 text-white placeholder-zinc-500'
                  : 'bg-zinc-50 border-zinc-300 text-zinc-900 placeholder-zinc-400'
              }`}
            />
          </div>
        </div>
      </section>

      {/* Confirmation Modal when editing a past missed habit */}
      {habitToConfirm && (
        <ConfirmHistoricalEditModal
          habit={habitToConfirm}
          dayNumber={activeDayNumber}
          dateStr={formatDisplayDate(dayRecord?.date || '')}
          onConfirm={() => {
            onToggleHabit(habitToConfirm.id, activeDayNumber);
            setHabitToConfirm(null);
          }}
          onCancel={() => setHabitToConfirm(null)}
          theme={theme}
        />
      )}
    </div>
  );
};

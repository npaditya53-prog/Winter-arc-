import React, { useState } from 'react';
import { X, ArrowRight, BookOpen } from 'lucide-react';
import { ChallengeState, DayRecord, HabitDefinition } from '../types/challenge';
import {
  calculateDayHabitStatusSummary,
  formatDisplayDate,
  getCurrentDayNumber,
  getEffectiveHabits,
} from '../utils/calculations';
import { HabitRow } from './HabitRow';
import { StatusLegend } from './StatusLegend';
import { ConfirmHistoricalEditModal } from './ConfirmHistoricalEditModal';

interface DayInspectorModalProps {
  dayNumber: number;
  state: ChallengeState;
  onClose: () => void;
  onToggleHabit: (habitId: string, dayNumber: number) => void;
  onOpenInToday: (dayNumber: number) => void;
  theme: 'dark' | 'light';
}

export const DayInspectorModal: React.FC<DayInspectorModalProps> = ({
  dayNumber,
  state,
  onClose,
  onToggleHabit,
  onOpenInToday,
  theme,
}) => {
  const isDark = theme === 'dark';
  const currentActualDayNumber = getCurrentDayNumber(state.settings.startDate);
  const dayRec: DayRecord | undefined = state.days[dayNumber];
  const summary = calculateDayHabitStatusSummary(dayRec, dayNumber, currentActualDayNumber);

  const [habitToConfirm, setHabitToConfirm] = useState<HabitDefinition | null>(null);

  const isPast = dayNumber < currentActualDayNumber;
  const isToday = dayNumber === currentActualDayNumber;
  const isFuture = dayNumber > currentActualDayNumber;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm overflow-y-auto"
    >
      <div
        className={`w-full max-w-lg rounded-2xl border shadow-2xl my-6 overflow-hidden flex flex-col max-h-[85vh] ${
          isDark
            ? 'bg-[#13161C] border-[#222730] text-zinc-100'
            : 'bg-white border-zinc-300 text-zinc-900'
        }`}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#20252E] shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold text-white tracking-tight">
                Day {String(dayNumber).padStart(2, '0')} details
              </h2>
              {isToday && (
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#5B8DEF]/15 text-[#5B8DEF] font-medium border border-[#5B8DEF]/25">
                  Today
                </span>
              )}
              {isPast && (
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 font-medium border border-zinc-700/40">
                  Historical
                </span>
              )}
              {isFuture && (
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 font-medium border border-zinc-700/40">
                  Upcoming
                </span>
              )}
            </div>

            <div className="text-xs text-zinc-400 mt-1 flex items-center gap-1.5 tabular-nums">
              <span>{formatDisplayDate(dayRec?.date || '')}</span>
              <span>·</span>
              {isPast ? (
                <>
                  <span className="text-[#4CAF78] font-medium">🟢 {summary.completedCount}</span>
                  <span>·</span>
                  <span className="text-[#D96B6B] font-medium">🔴 {summary.missedCount}</span>
                </>
              ) : isToday ? (
                <>
                  <span className="text-[#4CAF78] font-medium">🟢 {summary.completedCount}</span>
                  <span>·</span>
                  <span className="text-zinc-400">⚪ {summary.pendingCount}</span>
                </>
              ) : (
                <span>⚪ Not evaluated yet</span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onOpenInToday(dayNumber)}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#5B8DEF] text-[#0B0C0F] hover:bg-[#5B8DEF]/90 transition-all flex items-center gap-1 shadow-sm"
            >
              <span>Focus view</span>
              <ArrowRight className="w-3 h-3" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-4 overflow-y-auto space-y-3.5 flex-1">
          {/* Progress Bar & Status legend */}
          <div className="space-y-2">
            <div className="w-full bg-[#181C24] h-2 rounded-full overflow-hidden border border-[#222730]">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  summary.percentage === 100
                    ? 'bg-[#4CAF78]'
                    : isPast && summary.percentage < state.settings.streakThreshold
                    ? 'bg-[#D96B6B]'
                    : 'bg-[#5B8DEF]'
                }`}
                style={{ width: `${isFuture ? 0 : summary.percentage}%` }}
              />
            </div>

            <div className="flex justify-end">
              <StatusLegend />
            </div>
          </div>

          {/* Habits Checklist with exact Green / Red / Neutral status */}
          <div className="space-y-2">
            {getEffectiveHabits(state).map((habit) => {
              const isCompleted = !!dayRec?.habits?.[habit.id];
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
                  dayNumber={dayNumber}
                  currentDayNumber={currentActualDayNumber}
                  onToggle={(id) => onToggleHabit(id, dayNumber)}
                  onRequestConfirmPastEdit={(h) => setHabitToConfirm(h)}
                  customTarget={customTarget}
                  theme={theme}
                  isCompact={true}
                />
              );
            })}
          </div>

          {/* Reflection Preview if present */}
          {(dayRec?.reflection?.wentWell || dayRec?.reflection?.couldImprove || dayRec?.reflection?.notes) && (
            <div className="p-3.5 rounded-xl bg-[#181C24]/80 border border-[#262B36] space-y-2 text-xs">
              <div className="flex items-center gap-1.5 text-[#5B8DEF] font-medium">
                <BookOpen className="w-3.5 h-3.5" />
                <span>Recorded reflection</span>
              </div>
              {dayRec.reflection.wentWell && (
                <div>
                  <span className="text-zinc-400 block font-medium">Went well:</span>
                  <p className="text-zinc-200 mt-0.5">{dayRec.reflection.wentWell}</p>
                </div>
              )}
              {dayRec.reflection.couldImprove && (
                <div>
                  <span className="text-zinc-400 block font-medium">To calibrate:</span>
                  <p className="text-zinc-200 mt-0.5">{dayRec.reflection.couldImprove}</p>
                </div>
              )}
              {dayRec.reflection.notes && (
                <div>
                  <span className="text-zinc-400 block font-medium">Notes:</span>
                  <p className="text-zinc-200 mt-0.5">{dayRec.reflection.notes}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Modal when editing a past missed habit in Inspector */}
      {habitToConfirm && (
        <ConfirmHistoricalEditModal
          habit={habitToConfirm}
          dayNumber={dayNumber}
          dateStr={formatDisplayDate(dayRec?.date || '')}
          onConfirm={() => {
            onToggleHabit(habitToConfirm.id, dayNumber);
            setHabitToConfirm(null);
          }}
          onCancel={() => setHabitToConfirm(null)}
          theme={theme}
        />
      )}
    </div>
  );
};

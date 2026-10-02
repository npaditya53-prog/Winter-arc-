import React, { useState } from 'react';
import {
  Flame,
  ArrowRight,
  Pencil,
  Check,
  Plus,
} from 'lucide-react';
import { MOTIVATIONAL_REFLECTIONS } from '../constants/habits';
import { ChallengeState, HabitDefinition, OverallStats } from '../types/challenge';
import { formatDisplayDate, getEffectiveHabits } from '../utils/calculations';
import { HabitRow } from './HabitRow';
import { StatusLegend } from './StatusLegend';
import { HabitEditModal } from './HabitEditModal';
import { DeleteHabitConfirmModal } from './DeleteHabitConfirmModal';

interface DashboardViewProps {
  state: ChallengeState;
  stats: OverallStats;
  onToggleHabit: (habitId: string, dayNumber?: number) => void;
  onLogWater?: (amountMl: number) => void;
  onNavigate: (tab: 'dashboard' | 'today' | 'calendar' | 'analytics' | 'settings') => void;
  theme: 'dark' | 'light';
  // Habit Management Handlers
  onUpdateHabit?: (habit: HabitDefinition) => void;
  onAddHabit?: (habitData: HabitDefinition) => void;
  onDeleteHabit?: (habitId: string) => void;
  onReorderHabits?: (fromIndex: number, toIndex: number) => void;
  onToggleHabitDisabled?: (habitId: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  state,
  stats,
  onToggleHabit,
  onNavigate,
  theme,
  onUpdateHabit,
  onAddHabit,
  onDeleteHabit,
  onReorderHabits,
  onToggleHabitDisabled,
}) => {
  const isDark = theme === 'dark';
  const todayRecord = state.days[stats.currentDayNumber];

  const motivationalQuote =
    MOTIVATIONAL_REFLECTIONS[(stats.currentDayNumber - 1) % MOTIVATIONAL_REFLECTIONS.length];

  // Edit Mode state
  const [isEditMode, setIsEditMode] = useState<boolean>(false);
  const [editingHabit, setEditingHabit] = useState<HabitDefinition | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [deletingHabit, setDeletingHabit] = useState<HabitDefinition | null>(null);

  const habits = getEffectiveHabits(state);

  const handleSaveEditedHabit = (savedHabit: HabitDefinition) => {
    if (editingHabit) {
      if (onUpdateHabit) {
        onUpdateHabit(savedHabit);
      }
    } else {
      if (onAddHabit) {
        onAddHabit(savedHabit);
      }
    }
  };

  const handleConfirmDelete = () => {
    if (deletingHabit && onDeleteHabit) {
      onDeleteHabit(deletingHabit.id);
    }
    setDeletingHabit(null);
  };

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

      {/* 3. Today's Habits / Edit Habits Section */}
      <section className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <span>{isEditMode ? 'Edit Habits' : "Today's Habits"}</span>
              {isEditMode && (
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#38BDF8]/20 text-[#38BDF8] font-bold border border-[#38BDF8]/35">
                  Edit Mode
                </span>
              )}
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              {isEditMode
                ? 'Reorder, edit details, set reminders, or add disciplines'
                : `${stats.todayCompletedCount} of ${stats.todayTotalCount} completed · Tap any habit to complete`}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {isEditMode ? (
              <button
                type="button"
                onClick={() => setIsEditMode(false)}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-[#10B981] hover:bg-[#059669] text-[#0B0E14] transition-all active:scale-95 shadow-sm shadow-[#10B981]/30"
              >
                <Check className="w-3.5 h-3.5 stroke-[3]" />
                <span>Done</span>
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setIsEditMode(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#161C26] hover:bg-[#202836] text-[#38BDF8] border border-[#283244] transition-all active:scale-95 shadow-sm"
                  aria-label="Edit Habits"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  <span>Edit</span>
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate('today')}
                  className="text-xs text-zinc-400 hover:text-[#38BDF8] transition-colors font-medium hidden sm:inline-block ml-1"
                >
                  Reflect & Details
                </button>
              </>
            )}
          </div>
        </div>

        {/* Habits colorful bubbles */}
        <div className="space-y-3.5 sm:space-y-4">
          {habits.map((habit, index) => {
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
                isEditMode={isEditMode}
                onEditHabit={(h) => setEditingHabit(h)}
                onDeleteHabit={(h) => setDeletingHabit(h)}
                onMoveUp={() => onReorderHabits && onReorderHabits(index, index - 1)}
                onMoveDown={() => onReorderHabits && onReorderHabits(index, index + 1)}
                canMoveUp={index > 0}
                canMoveDown={index < habits.length - 1}
                onToggleDisabled={(id) => onToggleHabitDisabled && onToggleHabitDisabled(id)}
              />
            );
          })}
        </div>

        {/* Add Habit Button in Edit Mode */}
        {isEditMode && (
          <div className="pt-2">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="w-full py-3.5 px-4 rounded-2xl border-2 border-dashed border-[#38BDF8]/40 hover:border-[#38BDF8] bg-[#38BDF8]/10 hover:bg-[#38BDF8]/15 text-[#38BDF8] flex items-center justify-center gap-2 font-semibold text-sm transition-all active:scale-[0.99] shadow-sm"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Add Habit</span>
            </button>
          </div>
        )}

        {!isEditMode && (
          <div className="pt-2 px-1">
            <StatusLegend theme={theme} />
          </div>
        )}
      </section>

      {/* Edit Habit Modal */}
      {editingHabit && (
        <HabitEditModal
          isOpen={true}
          habit={editingHabit}
          onSave={handleSaveEditedHabit}
          onClose={() => setEditingHabit(null)}
          theme={theme}
        />
      )}

      {/* Add Habit Modal */}
      {isAddModalOpen && (
        <HabitEditModal
          isOpen={true}
          habit={null}
          onSave={handleSaveEditedHabit}
          onClose={() => setIsAddModalOpen(false)}
          theme={theme}
        />
      )}

      {/* Delete Habit Confirmation Modal */}
      {deletingHabit && (
        <DeleteHabitConfirmModal
          isOpen={true}
          habit={deletingHabit}
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeletingHabit(null)}
          theme={theme}
        />
      )}
    </div>
  );
};

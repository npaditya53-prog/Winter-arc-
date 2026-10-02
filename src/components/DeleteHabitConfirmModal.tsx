import React from 'react';
import { AlertTriangle, Trash2 } from 'lucide-react';
import { HabitDefinition } from '../types/challenge';

interface DeleteHabitConfirmModalProps {
  habit: HabitDefinition | null;
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  theme: 'dark' | 'light';
}

export const DeleteHabitConfirmModal: React.FC<DeleteHabitConfirmModalProps> = ({
  habit,
  isOpen,
  onConfirm,
  onCancel,
  theme,
}) => {
  if (!isOpen || !habit) return null;

  const isDark = theme === 'dark';

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div
        className={`w-full max-w-sm rounded-[24px] border p-5 sm:p-6 shadow-2xl transition-all ${
          isDark
            ? 'bg-[#121620] border-[#222838] text-white shadow-black/60'
            : 'bg-white border-zinc-200 text-zinc-900 shadow-xl'
        }`}
      >
        {/* Warning Icon */}
        <div className="w-12 h-12 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-500 flex items-center justify-center mb-4">
          <Trash2 className="w-6 h-6 stroke-[2.2]" />
        </div>

        {/* Content */}
        <h3 className="text-lg font-bold tracking-tight">
          Delete this habit?
        </h3>
        <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
          This habit and its future tracking will be removed.
        </p>

        {/* Habit Card Preview */}
        <div
          className={`mt-4 p-3 rounded-xl border flex items-center gap-2.5 ${
            isDark ? 'bg-black/30 border-white/10' : 'bg-zinc-50 border-zinc-200'
          }`}
        >
          <span className="text-[11px] font-mono font-bold text-zinc-400 px-1.5 py-0.5 rounded bg-black/20">
            #{habit.number}
          </span>
          <span className="text-sm font-semibold truncate">
            {habit.name}
          </span>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex items-center gap-3">
          <button
            type="button"
            onClick={onCancel}
            className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-semibold border transition-all active:scale-95 ${
              isDark
                ? 'border-white/15 bg-white/5 hover:bg-white/10 text-zinc-300'
                : 'border-zinc-300 bg-zinc-100 hover:bg-zinc-200 text-zinc-700'
            }`}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 py-2.5 px-4 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-sm shadow-rose-600/40 transition-all active:scale-95 flex items-center justify-center gap-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete</span>
          </button>
        </div>
      </div>
    </div>
  );
};

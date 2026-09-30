import React from 'react';
import { AlertCircle, Check } from 'lucide-react';
import { HabitDefinition } from '../types/challenge';

interface ConfirmHistoricalEditModalProps {
  habit: HabitDefinition;
  dayNumber: number;
  dateStr: string;
  onConfirm: () => void;
  onCancel: () => void;
  theme: 'dark' | 'light';
}

export const ConfirmHistoricalEditModal: React.FC<ConfirmHistoricalEditModalProps> = ({
  habit,
  dayNumber,
  dateStr,
  onConfirm,
  onCancel,
  theme,
}) => {
  const isDark = theme === 'dark';

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
    >
      <div
        className={`w-full max-w-sm rounded-2xl p-5 sm:p-6 border shadow-2xl space-y-4 ${
          isDark ? 'bg-[#13161C] border-[#222730] text-zinc-100' : 'bg-white border-zinc-200 text-zinc-900'
        }`}
      >
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#5B8DEF]/15 text-[#5B8DEF] flex items-center justify-center shrink-0 mt-0.5">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">
              Update historical record?
            </h3>
            <p className="text-xs text-zinc-400 mt-1">
              You are about to mark a missed habit on <strong className="text-zinc-200">Day {String(dayNumber).padStart(2, '0')}</strong> ({dateStr}) as completed:
            </p>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-[#181C24] border border-[#262B36] text-xs">
          <span className="font-semibold text-white block">{habit.name}</span>
          <span className="text-zinc-400 text-[11px] block mt-0.5">{habit.shortDescription}</span>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-3.5 py-1.5 rounded-xl text-xs font-medium text-zinc-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#4CAF78] text-[#0B0C0F] hover:bg-[#4CAF78]/90 transition-all flex items-center gap-1.5 shadow-sm"
          >
            <Check className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Confirm & Complete</span>
          </button>
        </div>
      </div>
    </div>
  );
};

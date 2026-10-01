import React from 'react';
import { Droplets, X } from 'lucide-react';

interface HydrationReminderToastProps {
  onLogWater: (amountMl: number) => void;
  onDismiss: () => void;
  theme: 'dark' | 'light';
}

export const HydrationReminderToast: React.FC<HydrationReminderToastProps> = ({
  onLogWater,
  onDismiss,
  theme,
}) => {
  const isDark = theme === 'dark';

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed bottom-20 md:bottom-6 right-4 sm:right-6 z-40 max-w-sm w-[calc(100vw-32px)] p-3.5 sm:p-4 rounded-2xl border shadow-xl backdrop-blur-md transition-all duration-300 animate-in slide-in-from-bottom-4 ${
        isDark
          ? 'bg-[#0E131C]/95 border-[#38BDF8]/30 text-white shadow-[#38BDF8]/10'
          : 'bg-white/95 border-sky-200 text-zinc-900 shadow-md'
      }`}
    >
      <div className="flex items-start justify-between gap-2.5">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-xl bg-[#38BDF8]/15 text-[#38BDF8] flex items-center justify-center shrink-0 mt-0.5">
            <Droplets className="w-4 h-4 stroke-[2]" />
          </div>
          <div>
            <h4 className="text-xs font-semibold text-white tracking-tight flex items-center gap-1.5">
              <span>Time for water</span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#38BDF8] animate-pulse" />
            </h4>
            <p className="text-[11px] text-zinc-400 mt-0.5 leading-snug">
              250–500 ml is waiting for you. Keep your hydration streak flowing.
            </p>
            <div className="flex items-center gap-2 mt-2.5">
              <button
                type="button"
                onClick={() => {
                  onLogWater(250);
                  onDismiss();
                }}
                className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-[#38BDF8] text-[#0B0E14] hover:bg-[#38BDF8]/90 transition-colors"
              >
                +250 ml
              </button>
              <button
                type="button"
                onClick={() => {
                  onLogWater(500);
                  onDismiss();
                }}
                className="px-2.5 py-1 rounded-lg text-xs font-medium border border-zinc-700 bg-zinc-800 text-zinc-200 hover:bg-zinc-700 transition-colors"
              >
                +500 ml
              </button>
              <button
                type="button"
                onClick={onDismiss}
                className="text-[11px] text-zinc-500 hover:text-zinc-300 ml-1 px-1.5 py-1"
              >
                Later
              </button>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onDismiss}
          className="text-zinc-500 hover:text-zinc-300 p-1 rounded-lg"
          aria-label="Dismiss hydration reminder"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

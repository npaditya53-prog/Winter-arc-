import React, { useState } from 'react';
import { getTodayDateString } from '../constants/habits';

interface OnboardingModalProps {
  onStart: (startDate: string, hydrationGoal: string) => void;
  theme: 'dark' | 'light';
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({ onStart, theme }) => {
  const isDark = theme === 'dark';
  const [startDate, setStartDate] = useState(getTodayDateString());
  const [hydrationGoal, setHydrationGoal] = useState('3.5 Liters');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div
        className={`w-full max-w-md rounded-2xl p-6 sm:p-7 border shadow-2xl transition-colors ${
          isDark
            ? 'bg-[#13161C] border-[#222730] text-zinc-100'
            : 'bg-white border-zinc-200 text-zinc-900 shadow-xl'
        }`}
      >
        <div className="space-y-1 mb-5">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold text-white tracking-tight">
              Start your Winter Arc
            </h1>
            <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-[#5B8DEF]/15 text-[#5B8DEF] border border-[#5B8DEF]/25">
              90 Days
            </span>
          </div>
          <p className="text-xs text-zinc-400">
            90 consecutive days. Set your baseline start date and daily hydration goal.
          </p>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            onStart(startDate, hydrationGoal);
          }}
          className="space-y-4"
        >
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">
              Challenge start date (Day 01)
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
              className={`w-full h-11 px-3.5 rounded-xl text-sm border focus:outline-none focus:ring-1 focus:ring-[#5B8DEF] tabular-nums ${
                isDark
                  ? 'bg-[#181C24] border-[#262B36] text-white'
                  : 'bg-zinc-50 border-zinc-300 text-zinc-900'
              }`}
            />
            <p className="text-[11px] text-zinc-400 mt-1">
              Defaults to today. Day 01 through Day 90 will be calculated from this date.
            </p>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">
              Daily hydration goal
            </label>
            <input
              type="text"
              value={hydrationGoal}
              onChange={(e) => setHydrationGoal(e.target.value)}
              placeholder="e.g. 3.5 Liters"
              className={`w-full h-11 px-3.5 rounded-xl text-sm border focus:outline-none focus:ring-1 focus:ring-[#5B8DEF] ${
                isDark
                  ? 'bg-[#181C24] border-[#262B36] text-white'
                  : 'bg-zinc-50 border-zinc-300 text-zinc-900'
              }`}
            />
            <div className="flex items-center gap-2 mt-2">
              {['3.0 Liters', '3.5 Liters', '4.0 Liters'].map((preset) => (
                <button
                  type="button"
                  key={preset}
                  onClick={() => setHydrationGoal(preset)}
                  className="text-xs px-3 py-1 rounded-lg bg-[#181C24] text-zinc-300 hover:text-white border border-[#262B36] transition-colors"
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="w-full h-11 rounded-xl bg-[#5B8DEF] text-[#0B0C0F] font-semibold text-sm hover:bg-[#5B8DEF]/90 transition-all shadow-sm flex items-center justify-center gap-1.5"
            >
              <span>Start Day 01 →</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

import React from 'react';
import { Trophy, CheckCircle2, Flame, Award, X, Sparkles } from 'lucide-react';
import { OverallStats } from '../types/challenge';

interface CompletionCelebrationModalProps {
  stats: OverallStats;
  onClose: () => void;
  theme: 'dark' | 'light';
}

export const CompletionCelebrationModal: React.FC<CompletionCelebrationModalProps> = ({
  stats,
  onClose,
  theme,
}) => {
  const isDark = theme === 'dark';

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-300"
    >
      <div
        className={`w-full max-w-md rounded-[24px] border p-6 sm:p-8 text-center relative shadow-2xl transition-all ${
          isDark
            ? 'bg-[#0E121A] border-[#2A3446] text-zinc-100 shadow-[#38BDF8]/10'
            : 'bg-white border-zinc-200 text-zinc-900 shadow-xl'
        }`}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800/60 transition-colors"
          aria-label="Close celebration modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Golden Trophy Icon Badge */}
        <div className="relative inline-flex items-center justify-center mb-4">
          <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-[#D97706]/30 via-[#F59E0B]/20 to-[#38BDF8]/20 flex items-center justify-center border border-[#F59E0B]/40 shadow-lg shadow-[#F59E0B]/20 animate-pulse">
            <Trophy className="w-10 h-10 text-[#F59E0B] stroke-[1.8]" />
          </div>
          <Sparkles className="w-5 h-5 text-[#38BDF8] absolute -top-1 -right-1 animate-bounce" />
        </div>

        {/* Heading */}
        <div className="space-y-1">
          <span className="text-[11px] font-bold tracking-widest uppercase text-[#38BDF8]">
            Winter Arc
          </span>
          <h2 className="text-2xl font-bold tracking-tight text-white">
            90 DAYS COMPLETE
          </h2>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30 text-xs font-semibold mt-1">
            <CheckCircle2 className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>YOU FINISHED THE CHALLENGE</span>
          </div>
        </div>

        <p className="text-xs text-zinc-400 mt-3 max-w-xs mx-auto leading-relaxed">
          Through cold mornings and relentless discipline, you proved that consistency creates real transformation.
        </p>

        {/* Milestone Statistics Cards */}
        <div className="grid grid-cols-2 gap-2.5 mt-6 text-left">
          <div
            className={`p-3 rounded-2xl border ${
              isDark ? 'bg-[#141822] border-[#222836]' : 'bg-zinc-50 border-zinc-200'
            }`}
          >
            <span className="text-[11px] text-zinc-400 block">Duration</span>
            <span className="text-lg font-bold text-white tabular-nums">90 Days</span>
            <span className="text-[10px] text-zinc-500 block">100% completed</span>
          </div>

          <div
            className={`p-3 rounded-2xl border ${
              isDark ? 'bg-[#141822] border-[#222836]' : 'bg-zinc-50 border-zinc-200'
            }`}
          >
            <span className="text-[11px] text-zinc-400 block">Daily Habits</span>
            <span className="text-lg font-bold text-white tabular-nums">12 Habits</span>
            <span className="text-[10px] text-zinc-500 block">Every single protocol</span>
          </div>

          <div
            className={`p-3 rounded-2xl border ${
              isDark ? 'bg-[#141822] border-[#222836]' : 'bg-zinc-50 border-zinc-200'
            }`}
          >
            <span className="text-[11px] text-zinc-400 block">Best Streak</span>
            <div className="flex items-center gap-1">
              <Flame className="w-4 h-4 text-[#F97316]" />
              <span className="text-lg font-bold text-white tabular-nums">
                {stats.bestStreak} Days
              </span>
            </div>
            <span className="text-[10px] text-zinc-500 block">Unbroken consistency</span>
          </div>

          <div
            className={`p-3 rounded-2xl border ${
              isDark ? 'bg-[#141822] border-[#222836]' : 'bg-zinc-50 border-zinc-200'
            }`}
          >
            <span className="text-[11px] text-zinc-400 block">Overall Adherence</span>
            <div className="flex items-center gap-1">
              <Award className="w-4 h-4 text-[#38BDF8]" />
              <span className="text-lg font-bold text-white tabular-nums">
                {stats.overallProgress}%
              </span>
            </div>
            <span className="text-[10px] text-[#10B981] block">Exceptional standard</span>
          </div>
        </div>

        {/* Action Button */}
        <button
          type="button"
          onClick={onClose}
          className="w-full mt-6 py-3 rounded-xl font-semibold text-sm bg-gradient-to-r from-[#38BDF8] to-[#10B981] text-[#0B0E14] hover:opacity-95 transition-all shadow-lg shadow-[#38BDF8]/20 focus:outline-none focus:ring-2 focus:ring-[#38BDF8]"
        >
          Keep Moving Forward
        </button>
      </div>
    </div>
  );
};

import React from 'react';
import {
  Check,
  X,
  Sunrise,
  Coffee,
  Sun,
  Dumbbell,
  Sparkles,
  ShieldAlert,
  Droplets,
  Apple,
  Smartphone,
  BookOpen,
  Lightbulb,
  Moon,
} from 'lucide-react';
import { HabitDefinition, HabitStatus } from '../types/challenge';
import { HABIT_VISUAL_MAP } from '../constants/habits';
import { getHabitStatus } from '../utils/calculations';

interface HabitRowProps {
  habit: HabitDefinition;
  isCompleted: boolean;
  onToggle: (habitId: string) => void;
  customTarget?: string;
  theme: 'dark' | 'light';
  isCompact?: boolean;
  dayNumber?: number;
  currentDayNumber?: number;
  status?: HabitStatus;
  onRequestConfirmPastEdit?: (habit: HabitDefinition) => void;
}

// Icon mapper for habits
const getHabitIcon = (iconName: string, className: string) => {
  switch (iconName) {
    case 'Sunrise':
      return <Sunrise className={className} />;
    case 'Coffee':
      return <Coffee className={className} />;
    case 'Sun':
      return <Sun className={className} />;
    case 'Dumbbell':
      return <Dumbbell className={className} />;
    case 'Sparkles':
      return <Sparkles className={className} />;
    case 'ShieldAlert':
      return <ShieldAlert className={className} />;
    case 'Droplets':
      return <Droplets className={className} />;
    case 'Apple':
      return <Apple className={className} />;
    case 'Smartphone':
      return <Smartphone className={className} />;
    case 'BookOpen':
      return <BookOpen className={className} />;
    case 'Lightbulb':
      return <Lightbulb className={className} />;
    case 'Moon':
      return <Moon className={className} />;
    default:
      return <Sparkles className={className} />;
  }
};

export const HabitRow: React.FC<HabitRowProps> = ({
  habit,
  isCompleted,
  onToggle,
  customTarget,
  theme,
  isCompact = false,
  dayNumber,
  currentDayNumber,
  status: explicitStatus,
  onRequestConfirmPastEdit,
}) => {
  const isDark = theme === 'dark';
  const displayTarget = customTarget || habit.target;
  const visual = HABIT_VISUAL_MAP[habit.id] || {
    accent: '#5B8DEF',
    categoryAccent: '#5B8DEF',
    iconName: 'Sparkles',
  };

  // Derive status: Completed = GREEN (✓), Missed = RED (✕), Pending = NEUTRAL (□)
  const status: HabitStatus =
    explicitStatus ||
    (dayNumber !== undefined && currentDayNumber !== undefined
      ? getHabitStatus(isCompleted, dayNumber, currentDayNumber)
      : isCompleted
      ? 'completed'
      : 'pending');

  const isPastDay =
    dayNumber !== undefined && currentDayNumber !== undefined && dayNumber < currentDayNumber;

  const handleClick = () => {
    // If it's a past day missed habit, request confirmation before turning to completed
    if (isPastDay && status === 'missed' && onRequestConfirmPastEdit) {
      onRequestConfirmPastEdit(habit);
      return;
    }
    onToggle(habit.id);
  };

  return (
    <div
      onClick={handleClick}
      role="checkbox"
      aria-checked={status === 'completed'}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === ' ' || e.key === 'Enter') {
          e.preventDefault();
          handleClick();
        }
      }}
      className={`group relative flex items-center justify-between rounded-2xl cursor-pointer select-none transition-all duration-200 border focus:outline-none focus-visible:ring-2 focus-visible:ring-[#5B8DEF] active:scale-[0.99] ${
        isCompact ? 'p-2.5 sm:p-3' : 'p-3.5 sm:p-4'
      } ${
        status === 'completed'
          ? isDark
            ? 'bg-[#4CAF78]/8 border-[#4CAF78]/40 text-zinc-200 shadow-sm'
            : 'bg-[#F2F8F4] border-[#4CAF78]/50 text-zinc-800 shadow-sm'
          : status === 'missed'
          ? isDark
            ? 'bg-[#D96B6B]/8 border-[#D96B6B]/40 text-zinc-300 shadow-sm'
            : 'bg-[#FDF2F2] border-[#D96B6B]/45 text-zinc-800 shadow-sm'
          : isDark
          ? 'bg-[#13161C] border-[#222730] hover:border-zinc-700 hover:bg-[#181C24] shadow-sm'
          : 'bg-white border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50 shadow-sm'
      }`}
    >
      <div className="flex items-center gap-3 sm:gap-3.5 min-w-0 pr-3">
        {/* Visual Icon Pill with Status-aware or Category Tint */}
        <div
          className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-105 ${
            status === 'completed'
              ? 'bg-[#4CAF78]/15 border border-[#4CAF78]/30 text-[#4CAF78]'
              : status === 'missed'
              ? 'bg-[#D96B6B]/15 border border-[#D96B6B]/30 text-[#D96B6B]'
              : ''
          }`}
          style={
            status === 'pending'
              ? {
                  backgroundColor: `${visual.accent}16`,
                  border: `1px solid ${visual.accent}30`,
                  color: visual.accent,
                }
              : undefined
          }
        >
          {getHabitIcon(visual.iconName, 'w-4 h-4 sm:w-[18px] sm:h-[18px] stroke-[1.8]')}
        </div>

        {/* Text information */}
        <div className="min-w-0">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            {/* Number index */}
            <span
              className={`text-[11px] font-mono tabular-nums shrink-0 font-medium ${
                status === 'completed'
                  ? 'text-[#4CAF78]'
                  : status === 'missed'
                  ? 'text-[#D96B6B]'
                  : 'text-zinc-400'
              }`}
            >
              {habit.number}
            </span>

            {/* Habit Name */}
            <h4
              className={`text-sm font-medium tracking-tight transition-colors ${
                status === 'completed'
                  ? 'line-through text-zinc-400 font-normal'
                  : status === 'missed'
                  ? 'text-zinc-200 font-medium'
                  : isDark
                  ? 'text-zinc-100'
                  : 'text-zinc-900'
              }`}
            >
              {habit.name}
            </h4>

            {/* Target chip */}
            <span
              className={`text-[11px] truncate px-2 py-0.5 rounded-md transition-colors ${
                status === 'completed'
                  ? isDark
                    ? 'text-zinc-400 bg-zinc-800/40'
                    : 'text-zinc-500 bg-zinc-100'
                  : status === 'missed'
                  ? isDark
                    ? 'text-zinc-400 bg-zinc-800/60 border border-[#D96B6B]/25'
                    : 'text-zinc-600 bg-zinc-100'
                  : isDark
                  ? 'text-zinc-400 bg-zinc-800/60 border border-zinc-700/40'
                  : 'text-zinc-600 bg-zinc-100 border border-zinc-200'
              }`}
            >
              {displayTarget}
            </span>

            {/* Accessible Status Pill (Green ✓ / Red ✕ / Neutral □) */}
            <span
              className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full inline-flex items-center gap-1 shrink-0 ${
                status === 'completed'
                  ? 'bg-[#4CAF78]/15 text-[#4CAF78] border border-[#4CAF78]/30'
                  : status === 'missed'
                  ? 'bg-[#D96B6B]/15 text-[#D96B6B] border border-[#D96B6B]/30'
                  : 'bg-zinc-800/60 text-zinc-400 border border-zinc-700/40'
              }`}
            >
              {status === 'completed' ? (
                <>
                  <Check className="w-2.5 h-2.5 stroke-[3]" />
                  <span>Done</span>
                </>
              ) : status === 'missed' ? (
                <>
                  <X className="w-2.5 h-2.5 stroke-[3]" />
                  <span>Missed</span>
                </>
              ) : (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-zinc-500 inline-block" />
                  <span>Pending</span>
                </>
              )}
            </span>
          </div>

          {!isCompact && (
            <p
              className={`text-xs mt-1 line-clamp-1 sm:line-clamp-none ${
                status === 'completed'
                  ? 'text-zinc-500'
                  : status === 'missed'
                  ? 'text-zinc-400'
                  : isDark
                  ? 'text-zinc-400'
                  : 'text-zinc-600'
              }`}
            >
              {habit.shortDescription}
            </p>
          )}
        </div>
      </div>

      {/* Tactile Checkbox Button communicating exact status */}
      <div className="flex items-center justify-center w-8 h-8 shrink-0">
        <div
          className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all duration-200 shadow-sm ${
            status === 'completed'
              ? 'bg-[#4CAF78] text-[#0B0C0F] scale-105 font-bold shadow-[#4CAF78]/25'
              : status === 'missed'
              ? 'bg-[#D96B6B]/20 border border-[#D96B6B]/70 text-[#D96B6B]'
              : isDark
              ? 'border border-zinc-700 bg-zinc-800/40 group-hover:border-zinc-500 group-hover:bg-zinc-800/80 text-transparent'
              : 'border border-zinc-300 bg-white group-hover:border-zinc-400 group-hover:bg-zinc-100 text-transparent'
          }`}
        >
          {status === 'completed' && <Check className="w-3.5 h-3.5 stroke-[3]" />}
          {status === 'missed' && <X className="w-3.5 h-3.5 stroke-[3]" />}
        </div>
      </div>
    </div>
  );
};

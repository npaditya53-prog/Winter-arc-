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
  Flame,
  Heart,
  Zap,
  Target,
  Smile,
  CheckCircle,
  Timer,
  Award,
  Pencil,
  Trash2,
  ChevronUp,
  ChevronDown,
  Bell,
  Eye,
  EyeOff,
} from 'lucide-react';
import { HabitDefinition, HabitStatus } from '../types/challenge';
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
  // Edit mode props
  isEditMode?: boolean;
  onEditHabit?: (habit: HabitDefinition) => void;
  onDeleteHabit?: (habit: HabitDefinition) => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  canMoveUp?: boolean;
  canMoveDown?: boolean;
  onToggleDisabled?: (habitId: string) => void;
}

// Icon mapper for all supported icons with clean line styling
const getHabitIcon = (iconName: string | undefined, className: string) => {
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
    case 'Flame':
      return <Flame className={className} />;
    case 'Heart':
      return <Heart className={className} />;
    case 'Zap':
      return <Zap className={className} />;
    case 'Target':
      return <Target className={className} />;
    case 'Smile':
      return <Smile className={className} />;
    case 'CheckCircle':
      return <CheckCircle className={className} />;
    case 'Timer':
      return <Timer className={className} />;
    case 'Award':
      return <Award className={className} />;
    default:
      return <Target className={className} />;
  }
};

interface HabitThemeConfig {
  iconName: string;
  gradientDark: string;
  gradientLight: string;
  borderDark: string;
  borderLight: string;
  glowDark: string;
  iconBgDark: string;
  iconColorDark: string;
  iconBgLight: string;
  iconColorLight: string;
  progressGradient: string;
}

const PALETTES: Record<string, HabitThemeConfig> = {
  amber: {
    iconName: 'Sunrise',
    gradientDark: 'from-[#D97706]/20 via-[#B45309]/15 to-[#16120E]/95',
    gradientLight: 'from-amber-50 via-orange-50 to-white',
    borderDark: 'border-[#F59E0B]/35 hover:border-[#F59E0B]/70',
    borderLight: 'border-amber-200 hover:border-amber-300',
    glowDark: 'shadow-[#F59E0B]/10',
    iconBgDark: 'bg-[#F59E0B]/20 border-[#F59E0B]/40',
    iconColorDark: 'text-[#FBBF24]',
    iconBgLight: 'bg-amber-100 border-amber-300',
    iconColorLight: 'text-amber-700',
    progressGradient: 'from-[#F59E0B] to-[#FBBF24]',
  },
  orange: {
    iconName: 'Coffee',
    gradientDark: 'from-[#EA580C]/20 via-[#C2410C]/15 to-[#16110D]/95',
    gradientLight: 'from-orange-50 via-amber-50 to-white',
    borderDark: 'border-[#FB923C]/35 hover:border-[#FB923C]/70',
    borderLight: 'border-orange-200 hover:border-orange-300',
    glowDark: 'shadow-[#FB923C]/10',
    iconBgDark: 'bg-[#FB923C]/20 border-[#FB923C]/40',
    iconColorDark: 'text-[#FB923C]',
    iconBgLight: 'bg-orange-100 border-orange-300',
    iconColorLight: 'text-orange-700',
    progressGradient: 'from-[#FB923C] to-[#F97316]',
  },
  yellow: {
    iconName: 'Sun',
    gradientDark: 'from-[#CA8A04]/20 via-[#A16207]/15 to-[#15130A]/95',
    gradientLight: 'from-yellow-50 via-amber-50 to-white',
    borderDark: 'border-[#FACC15]/35 hover:border-[#FACC15]/70',
    borderLight: 'border-yellow-200 hover:border-yellow-300',
    glowDark: 'shadow-[#FACC15]/10',
    iconBgDark: 'bg-[#FACC15]/20 border-[#FACC15]/40',
    iconColorDark: 'text-[#FACC15]',
    iconBgLight: 'bg-yellow-100 border-yellow-300',
    iconColorLight: 'text-yellow-700',
    progressGradient: 'from-[#FACC15] to-[#FDE047]',
  },
  emerald: {
    iconName: 'Dumbbell',
    gradientDark: 'from-[#059669]/25 via-[#047857]/15 to-[#0D1612]/95',
    gradientLight: 'from-emerald-50 via-teal-50 to-white',
    borderDark: 'border-[#10B981]/40 hover:border-[#10B981]/75',
    borderLight: 'border-emerald-200 hover:border-emerald-300',
    glowDark: 'shadow-[#10B981]/15',
    iconBgDark: 'bg-[#10B981]/20 border-[#10B981]/40',
    iconColorDark: 'text-[#34D399]',
    iconBgLight: 'bg-emerald-100 border-emerald-300',
    iconColorLight: 'text-emerald-700',
    progressGradient: 'from-[#10B981] to-[#34D399]',
  },
  gold: {
    iconName: 'Sparkles',
    gradientDark: 'from-[#D97706]/20 via-[#B45309]/15 to-[#16120E]/95',
    gradientLight: 'from-amber-50 via-yellow-50 to-white',
    borderDark: 'border-[#D97706]/35 hover:border-[#D97706]/70',
    borderLight: 'border-amber-200 hover:border-amber-300',
    glowDark: 'shadow-[#D97706]/10',
    iconBgDark: 'bg-[#D97706]/20 border-[#D97706]/40',
    iconColorDark: 'text-[#F59E0B]',
    iconBgLight: 'bg-amber-100 border-amber-300',
    iconColorLight: 'text-amber-700',
    progressGradient: 'from-[#D97706] to-[#F59E0B]',
  },
  rose: {
    iconName: 'ShieldAlert',
    gradientDark: 'from-[#BE123C]/20 via-[#9F1239]/15 to-[#170E10]/95',
    gradientLight: 'from-rose-50 via-red-50 to-white',
    borderDark: 'border-[#F43F5E]/35 hover:border-[#F43F5E]/70',
    borderLight: 'border-rose-200 hover:border-rose-300',
    glowDark: 'shadow-[#F43F5E]/10',
    iconBgDark: 'bg-[#F43F5E]/20 border-[#F43F5E]/40',
    iconColorDark: 'text-[#FB7185]',
    iconBgLight: 'bg-rose-100 border-rose-300',
    iconColorLight: 'text-rose-700',
    progressGradient: 'from-[#F43F5E] to-[#FB7185]',
  },
  sky: {
    iconName: 'Droplets',
    gradientDark: 'from-[#0284C7]/25 via-[#0369A1]/15 to-[#0B151C]/95',
    gradientLight: 'from-sky-50 via-cyan-50 to-white',
    borderDark: 'border-[#38BDF8]/40 hover:border-[#38BDF8]/75',
    borderLight: 'border-sky-200 hover:border-sky-300',
    glowDark: 'shadow-[#38BDF8]/15',
    iconBgDark: 'bg-[#38BDF8]/20 border-[#38BDF8]/40',
    iconColorDark: 'text-[#38BDF8]',
    iconBgLight: 'bg-sky-100 border-sky-300',
    iconColorLight: 'text-sky-700',
    progressGradient: 'from-[#38BDF8] to-[#06B6D4]',
  },
  teal: {
    iconName: 'Apple',
    gradientDark: 'from-[#0D9488]/25 via-[#0F766E]/15 to-[#0B1615]/95',
    gradientLight: 'from-teal-50 via-emerald-50 to-white',
    borderDark: 'border-[#14B8A6]/40 hover:border-[#14B8A6]/75',
    borderLight: 'border-teal-200 hover:border-teal-300',
    glowDark: 'shadow-[#14B8A6]/15',
    iconBgDark: 'bg-[#14B8A6]/20 border-[#14B8A6]/40',
    iconColorDark: 'text-[#2DD4BF]',
    iconBgLight: 'bg-teal-100 border-teal-300',
    iconColorLight: 'text-teal-700',
    progressGradient: 'from-[#14B8A6] to-[#2DD4BF]',
  },
  purple: {
    iconName: 'Smartphone',
    gradientDark: 'from-[#7E22CE]/25 via-[#6B21A8]/15 to-[#140D1A]/95',
    gradientLight: 'from-purple-50 via-fuchsia-50 to-white',
    borderDark: 'border-[#A855F7]/40 hover:border-[#A855F7]/75',
    borderLight: 'border-purple-200 hover:border-purple-300',
    glowDark: 'shadow-[#A855F7]/15',
    iconBgDark: 'bg-[#A855F7]/20 border-[#A855F7]/40',
    iconColorDark: 'text-[#C084FC]',
    iconBgLight: 'bg-purple-100 border-purple-300',
    iconColorLight: 'text-purple-700',
    progressGradient: 'from-[#A855F7] to-[#C084FC]',
  },
  blue: {
    iconName: 'BookOpen',
    gradientDark: 'from-[#1D4ED8]/25 via-[#1E40AF]/15 to-[#0C121D]/95',
    gradientLight: 'from-blue-50 via-indigo-50 to-white',
    borderDark: 'border-[#3B82F6]/40 hover:border-[#3B82F6]/75',
    borderLight: 'border-blue-200 hover:border-blue-300',
    glowDark: 'shadow-[#3B82F6]/15',
    iconBgDark: 'bg-[#3B82F6]/20 border-[#3B82F6]/40',
    iconColorDark: 'text-[#60A5FA]',
    iconBgLight: 'bg-blue-100 border-blue-300',
    iconColorLight: 'text-blue-700',
    progressGradient: 'from-[#3B82F6] to-[#60A5FA]',
  },
  violet: {
    iconName: 'Lightbulb',
    gradientDark: 'from-[#6D28D9]/25 via-[#5B21B6]/15 to-[#120D1B]/95',
    gradientLight: 'from-violet-50 via-purple-50 to-white',
    borderDark: 'border-[#8B5CF6]/40 hover:border-[#8B5CF6]/75',
    borderLight: 'border-violet-200 hover:border-violet-300',
    glowDark: 'shadow-[#8B5CF6]/15',
    iconBgDark: 'bg-[#8B5CF6]/20 border-[#8B5CF6]/40',
    iconColorDark: 'text-[#C4B5FD]',
    iconBgLight: 'bg-violet-100 border-violet-300',
    iconColorLight: 'text-violet-700',
    progressGradient: 'from-[#8B5CF6] to-[#A78BFA]',
  },
  indigo: {
    iconName: 'Moon',
    gradientDark: 'from-[#4F46E5]/25 via-[#4338CA]/15 to-[#0E101D]/95',
    gradientLight: 'from-indigo-50 via-blue-50 to-white',
    borderDark: 'border-[#6366F1]/40 hover:border-[#6366F1]/75',
    borderLight: 'border-indigo-200 hover:border-indigo-300',
    glowDark: 'shadow-[#6366F1]/15',
    iconBgDark: 'bg-[#6366F1]/20 border-[#6366F1]/40',
    iconColorDark: 'text-[#A5B4FC]',
    iconBgLight: 'bg-indigo-100 border-indigo-300',
    iconColorLight: 'text-indigo-700',
    progressGradient: 'from-[#6366F1] to-[#818CF8]',
  },
};

export const HabitRow: React.FC<HabitRowProps> = ({
  habit,
  isCompleted,
  onToggle,
  theme,
  isCompact = false,
  dayNumber,
  currentDayNumber,
  status: explicitStatus,
  onRequestConfirmPastEdit,
  isEditMode = false,
  onEditHabit,
  onDeleteHabit,
  onMoveUp,
  onMoveDown,
  canMoveUp = false,
  canMoveDown = false,
  onToggleDisabled,
}) => {
  const isDark = theme === 'dark';
  const themeConfig = (habit.color && PALETTES[habit.color]) || PALETTES.sky;
  const activeIconName = habit.iconName || themeConfig.iconName;

  // Derive status: Completed = GREEN (✓), Missed = RED (✕), Pending = NEUTRAL (○)
  const status: HabitStatus =
    explicitStatus ||
    (dayNumber !== undefined && currentDayNumber !== undefined
      ? getHabitStatus(isCompleted, dayNumber, currentDayNumber)
      : isCompleted
      ? 'completed'
      : 'pending');

  const isPastDay =
    dayNumber !== undefined && currentDayNumber !== undefined && dayNumber < currentDayNumber;

  const handleClick = (e: React.MouseEvent) => {
    if (isEditMode) {
      // In edit mode, clicking the card opens the edit modal
      if (onEditHabit) {
        onEditHabit(habit);
      }
      return;
    }

    // Normal mode completion toggle
    if (isPastDay && status === 'missed' && onRequestConfirmPastEdit) {
      onRequestConfirmPastEdit(habit);
      return;
    }
    onToggle(habit.id);
  };

  // If in Edit Mode, render the specialized editable habit card
  if (isEditMode) {
    return (
      <div
        className={`group relative rounded-[24px] sm:rounded-[26px] p-4 sm:p-5 border transition-all duration-200 shadow-md ${
          isDark
            ? 'bg-[#121622] border-[#222B3D] text-white hover:border-[#38BDF8]/60 shadow-black/40'
            : 'bg-white border-zinc-200 text-zinc-900 hover:border-[#38BDF8]/70 shadow-sm'
        } ${habit.disabled ? 'opacity-60' : ''}`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Left: Icon + Habit Details */}
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div
              className={`w-11 h-11 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center shrink-0 border shadow-sm ${
                isDark
                  ? `${themeConfig.iconBgDark} ${themeConfig.iconColorDark}`
                  : `${themeConfig.iconBgLight} ${themeConfig.iconColorLight}`
              }`}
            >
              {getHabitIcon(activeIconName, 'w-5 h-5 sm:w-6 sm:h-6 stroke-[2]')}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] sm:text-xs font-mono font-bold px-2 py-0.5 rounded-md bg-black/30 text-white/70 border border-white/10 shrink-0">
                  #{habit.number}
                </span>
                <h4 className="text-base font-bold tracking-tight truncate">
                  {habit.name}
                </h4>
                {habit.disabled && (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-zinc-500/20 text-zinc-400 border border-zinc-500/30">
                    Paused
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 mt-1 text-xs text-zinc-400 flex-wrap">
                <span className="font-medium text-zinc-300">{habit.target}</span>
                <span>•</span>
                <span>{habit.category}</span>
                {habit.reminderEnabled && habit.reminderTime && (
                  <>
                    <span>•</span>
                    <span className="inline-flex items-center gap-1 text-[#38BDF8]">
                      <Bell className="w-3 h-3" />
                      <span>{habit.reminderTime}</span>
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Right: Edit Mode Control Buttons */}
          <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
            {/* Reorder Up */}
            <button
              type="button"
              disabled={!canMoveUp}
              onClick={(e) => {
                e.stopPropagation();
                if (onMoveUp) onMoveUp();
              }}
              title="Move Up"
              aria-label="Move Up"
              className={`w-8 h-8 rounded-xl flex items-center justify-center border transition-all ${
                !canMoveUp
                  ? 'opacity-30 cursor-not-allowed border-transparent'
                  : isDark
                  ? 'border-white/10 bg-white/5 hover:bg-white/15 text-zinc-300 hover:text-white'
                  : 'border-zinc-200 bg-zinc-100 hover:bg-zinc-200 text-zinc-700'
              }`}
            >
              <ChevronUp className="w-4 h-4" />
            </button>

            {/* Reorder Down */}
            <button
              type="button"
              disabled={!canMoveDown}
              onClick={(e) => {
                e.stopPropagation();
                if (onMoveDown) onMoveDown();
              }}
              title="Move Down"
              aria-label="Move Down"
              className={`w-8 h-8 rounded-xl flex items-center justify-center border transition-all ${
                !canMoveDown
                  ? 'opacity-30 cursor-not-allowed border-transparent'
                  : isDark
                  ? 'border-white/10 bg-white/5 hover:bg-white/15 text-zinc-300 hover:text-white'
                  : 'border-zinc-200 bg-zinc-100 hover:bg-zinc-200 text-zinc-700'
              }`}
            >
              <ChevronDown className="w-4 h-4" />
            </button>

            {/* Active / Paused Toggle */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (onToggleDisabled) onToggleDisabled(habit.id);
              }}
              title={habit.disabled ? 'Resume Habit' : 'Pause Habit'}
              aria-label={habit.disabled ? 'Resume Habit' : 'Pause Habit'}
              className={`w-8 h-8 rounded-xl flex items-center justify-center border transition-all ${
                habit.disabled
                  ? 'border-zinc-600 bg-zinc-800 text-zinc-400'
                  : 'border-emerald-500/40 bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25'
              }`}
            >
              {habit.disabled ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>

            {/* Edit Details */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (onEditHabit) onEditHabit(habit);
              }}
              title="Edit Habit"
              aria-label="Edit Habit"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#38BDF8]/15 hover:bg-[#38BDF8]/25 text-[#38BDF8] border border-[#38BDF8]/35 transition-all active:scale-95 shadow-sm"
            >
              <Pencil className="w-3.5 h-3.5" />
              <span>Edit</span>
            </button>

            {/* Delete Habit */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (onDeleteHabit) onDeleteHabit(habit);
              }}
              title="Delete Habit"
              aria-label="Delete Habit"
              className="w-8 h-8 rounded-xl flex items-center justify-center border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 transition-all active:scale-95"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Normal Mode Card
  return (
    <div
      onClick={handleClick}
      role="checkbox"
      aria-checked={status === 'completed'}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === ' ' || e.key === 'Enter') {
          e.preventDefault();
          handleClick(e as unknown as React.MouseEvent);
        }
      }}
      className={`group relative rounded-[24px] sm:rounded-[26px] cursor-pointer select-none transition-all duration-300 border focus:outline-none focus-visible:ring-2 focus-visible:ring-[#38BDF8] active:scale-[0.985] shadow-lg ${
        isCompact ? 'p-4' : 'p-4 sm:p-5'
      } ${
        status === 'completed'
          ? isDark
            ? 'bg-gradient-to-br from-[#10B981]/25 via-[#059669]/20 to-[#064E3B]/70 border-[#10B981]/60 shadow-[#10B981]/15 text-white'
            : 'bg-gradient-to-br from-emerald-50 via-teal-50 to-white border-emerald-400 text-zinc-900 shadow-emerald-500/10'
          : status === 'missed'
          ? isDark
            ? 'bg-gradient-to-br from-[#E11D48]/20 via-[#BE123C]/15 to-[#881337]/60 border-[#F43F5E]/40 shadow-[#F43F5E]/10 text-white'
            : 'bg-gradient-to-br from-rose-50 via-red-50 to-white border-rose-300 text-zinc-900 shadow-rose-500/10'
          : isDark
          ? `bg-gradient-to-br ${themeConfig.gradientDark} ${themeConfig.borderDark} ${themeConfig.glowDark} text-white`
          : `bg-gradient-to-br ${themeConfig.gradientLight} ${themeConfig.borderLight} text-zinc-900 shadow-sm`
      } ${habit.disabled ? 'opacity-50 grayscale-[30%]' : ''}`}
    >
      {/* Top Row: Icon + Title + Habit # */}
      <div className="flex items-center gap-3 sm:gap-3.5 min-w-0">
        {/* Large Colorful Bubble Icon (Image 2 style) */}
        <div
          className={`w-11 h-11 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center shrink-0 border transition-all duration-300 group-hover:scale-105 shadow-sm ${
            status === 'completed'
              ? 'bg-[#10B981]/30 border-[#10B981]/50 text-[#34D399]'
              : status === 'missed'
              ? 'bg-[#F43F5E]/25 border-[#F43F5E]/50 text-[#FDA4AF]'
              : isDark
              ? `${themeConfig.iconBgDark} ${themeConfig.iconColorDark}`
              : `${themeConfig.iconBgLight} ${themeConfig.iconColorLight}`
          }`}
        >
          {getHabitIcon(activeIconName, 'w-5 h-5 sm:w-6 sm:h-6 stroke-[2]')}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] sm:text-xs font-mono font-bold px-2 py-0.5 rounded-md bg-black/30 text-white/70 border border-white/10 shrink-0">
              #{habit.number}
            </span>
            <h4
              className={`text-base sm:text-lg font-bold tracking-tight leading-tight line-clamp-1 transition-colors ${
                status === 'completed'
                  ? 'text-white'
                  : status === 'missed'
                  ? 'text-rose-100'
                  : isDark
                  ? 'text-white'
                  : 'text-zinc-900'
              }`}
            >
              {habit.name}
            </h4>
            {habit.disabled && (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-zinc-500/20 text-zinc-400 border border-zinc-500/30">
                Paused
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Middle: Short Description with comfortable spacing */}
      <p
        className={`text-xs sm:text-sm mt-2.5 sm:mt-3 leading-relaxed transition-colors ${
          status === 'completed'
            ? 'text-white/80'
            : status === 'missed'
            ? 'text-rose-200/80'
            : isDark
            ? 'text-zinc-300'
            : 'text-zinc-600'
        }`}
      >
        {habit.shortDescription}
      </p>

      {/* Sleek Progress Track Bar (Image 2 style) */}
      <div className="w-full h-2 rounded-full bg-black/35 border border-white/10 overflow-hidden my-3">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            status === 'completed'
              ? 'w-full bg-gradient-to-r from-[#10B981] to-[#34D399] shadow-sm shadow-[#10B981]/50'
              : status === 'missed'
              ? 'w-0 bg-[#F43F5E]'
              : `w-0 bg-gradient-to-r ${themeConfig.progressGradient}`
          }`}
        />
      </div>

      {/* Bottom Row: Status Badge (Left) & Tactile Checkbox Action Button (Right) */}
      <div className="flex items-center justify-between pt-0.5">
        <div>
          {habit.disabled ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-zinc-800 text-zinc-400 border border-zinc-700">
              <span>PAUSED • Excluded from daily goal</span>
            </span>
          ) : status === 'completed' ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#10B981]/25 text-[#34D399] border border-[#10B981]/40 shadow-sm shadow-[#10B981]/20">
              <Check className="w-3.5 h-3.5 stroke-[3]" />
              <span>100% COMPLETED</span>
            </span>
          ) : status === 'missed' ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#F43F5E]/20 text-[#FDA4AF] border border-[#F43F5E]/40">
              <X className="w-3.5 h-3.5 stroke-[3]" />
              <span>MISSED FOR THIS DAY</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-black/30 text-white/80 border border-white/15">
              <span className="w-2 h-2 rounded-full border border-white/50 inline-block animate-pulse" />
              <span>PENDING • Tap to mark done</span>
            </span>
          )}
        </div>

        {/* Large Tactile Checkbox Button (Image 2 action button) */}
        {!habit.disabled && (
          <div className="shrink-0 pl-3">
            <div
              className={`w-10 h-10 sm:w-11 sm:h-11 rounded-2xl flex items-center justify-center transition-all duration-300 shadow-md ${
                status === 'completed'
                  ? 'bg-[#10B981] text-[#0B0E14] scale-105 shadow-[#10B981]/50 border border-[#34D399]'
                  : status === 'missed'
                  ? 'bg-[#F43F5E]/20 text-[#FDA4AF] border-2 border-[#F43F5E]/70 hover:bg-[#F43F5E]/30'
                  : isDark
                  ? 'border-2 border-white/35 bg-white/10 group-hover:border-white/70 group-hover:bg-white/20 group-hover:scale-105 text-white/30'
                  : 'border-2 border-zinc-300 bg-white/70 group-hover:border-zinc-500 group-hover:bg-white group-hover:scale-105 text-zinc-400'
              }`}
            >
              {status === 'completed' && <Check className="w-5 h-5 stroke-[3]" />}
              {status === 'missed' && <X className="w-5 h-5 stroke-[3]" />}
              {status === 'pending' && (
                <span className="w-3 h-3 rounded-full border-2 border-white/50 group-hover:border-white/80 transition-colors" />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

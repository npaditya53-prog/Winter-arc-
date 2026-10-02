import React, { useState, useEffect } from 'react';
import {
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
  Bell,
  Eye,
  EyeOff,
  Check,
} from 'lucide-react';
import { HabitDefinition } from '../types/challenge';

interface HabitEditModalProps {
  isOpen: boolean;
  habit: HabitDefinition | null; // null means adding a new habit
  onSave: (habitData: HabitDefinition) => void;
  onClose: () => void;
  theme: 'dark' | 'light';
}

const AVAILABLE_ICONS = [
  { name: 'Sunrise', label: 'Sunrise', icon: Sunrise },
  { name: 'Coffee', label: 'Coffee', icon: Coffee },
  { name: 'Sun', label: 'Sun', icon: Sun },
  { name: 'Dumbbell', label: 'Fitness', icon: Dumbbell },
  { name: 'Sparkles', label: 'Ritual', icon: Sparkles },
  { name: 'ShieldAlert', label: 'Shield', icon: ShieldAlert },
  { name: 'Droplets', label: 'Water', icon: Droplets },
  { name: 'Apple', label: 'Diet', icon: Apple },
  { name: 'Smartphone', label: 'Digital', icon: Smartphone },
  { name: 'BookOpen', label: 'Reading', icon: BookOpen },
  { name: 'Lightbulb', label: 'Skill', icon: Lightbulb },
  { name: 'Moon', label: 'Sleep', icon: Moon },
  { name: 'Flame', label: 'Intensity', icon: Flame },
  { name: 'Heart', label: 'Health', icon: Heart },
  { name: 'Zap', label: 'Energy', icon: Zap },
  { name: 'Target', label: 'Focus', icon: Target },
  { name: 'Smile', label: 'Mindset', icon: Smile },
  { name: 'CheckCircle', label: 'Discipline', icon: CheckCircle },
  { name: 'Timer', label: 'Time', icon: Timer },
  { name: 'Award', label: 'Goal', icon: Award },
];

export const COLOR_THEMES = [
  { id: 'amber', label: 'Amber', hex: '#F59E0B', border: '#F59E0B' },
  { id: 'orange', label: 'Orange', hex: '#FB923C', border: '#FB923C' },
  { id: 'yellow', label: 'Yellow', hex: '#FACC15', border: '#FACC15' },
  { id: 'emerald', label: 'Emerald', hex: '#10B981', border: '#10B981' },
  { id: 'gold', label: 'Bronze', hex: '#D97706', border: '#D97706' },
  { id: 'rose', label: 'Crimson', hex: '#F43F5E', border: '#F43F5E' },
  { id: 'sky', label: 'Ice Blue', hex: '#38BDF8', border: '#38BDF8' },
  { id: 'teal', label: 'Mint', hex: '#14B8A6', border: '#14B8A6' },
  { id: 'purple', label: 'Purple', hex: '#A855F7', border: '#A855F7' },
  { id: 'blue', label: 'Blue', hex: '#3B82F6', border: '#3B82F6' },
  { id: 'violet', label: 'Violet', hex: '#8B5CF6', border: '#8B5CF6' },
  { id: 'indigo', label: 'Indigo', hex: '#6366F1', border: '#6366F1' },
];

const CATEGORIES: Array<HabitDefinition['category']> = [
  'Morning',
  'Physical',
  'Discipline',
  'Intellect',
  'Evening',
];

export const HabitEditModal: React.FC<HabitEditModalProps> = ({
  isOpen,
  habit,
  onSave,
  onClose,
  theme,
}) => {
  const isDark = theme === 'dark';
  const isEditing = !!habit;

  const [name, setName] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [target, setTarget] = useState('');
  const [category, setCategory] = useState<HabitDefinition['category']>('Discipline');
  const [color, setColor] = useState('sky');
  const [iconName, setIconName] = useState('Target');
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [reminderTime, setReminderTime] = useState('08:00');
  const [disabled, setDisabled] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Synchronize state when habit prop changes
  useEffect(() => {
    if (habit) {
      setName(habit.name || '');
      setShortDescription(habit.shortDescription || '');
      setTarget(habit.target || '');
      setCategory(habit.category || 'Discipline');
      setColor(habit.color || 'sky');
      setIconName(habit.iconName || 'Target');
      setReminderEnabled(!!habit.reminderEnabled);
      setReminderTime(habit.reminderTime || '08:00');
      setDisabled(!!habit.disabled);
    } else {
      // Default initial state for a new habit
      setName('');
      setShortDescription('');
      setTarget('1 session daily');
      setCategory('Discipline');
      setColor('sky');
      setIconName('Target');
      setReminderEnabled(false);
      setReminderTime('08:00');
      setDisabled(false);
    }
    setError(null);
  }, [habit, isOpen]);

  if (!isOpen) return null;

  const handleReminderToggle = async (checked: boolean) => {
    setReminderEnabled(checked);
    if (checked && typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        try {
          await Notification.requestPermission();
        } catch {
          // ignore error
        }
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      setError('Habit name cannot be empty.');
      return;
    }

    const payload: HabitDefinition = {
      id: habit?.id || `habit_${Date.now()}`,
      number: habit?.number || '01',
      name: name.trim(),
      shortDescription: shortDescription.trim() || 'Daily commitment to excellence',
      target: target.trim() || 'Complete daily session',
      category,
      color,
      iconName,
      reminderEnabled,
      reminderTime: reminderEnabled ? reminderTime : undefined,
      disabled,
    };

    onSave(payload);
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200"
    >
      <div
        className={`w-full max-w-lg my-auto rounded-[28px] border shadow-2xl overflow-hidden transition-all flex flex-col max-h-[92vh] ${
          isDark
            ? 'bg-[#10141D] border-[#1F2636] text-white shadow-black/70'
            : 'bg-white border-zinc-200 text-zinc-900 shadow-2xl'
        }`}
      >
        {/* Header */}
        <div className="px-5 sm:px-6 pt-5 pb-4 border-b border-white/10 flex items-center justify-between shrink-0">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#38BDF8]">
              {isEditing ? `Edit Habit #${habit?.number}` : 'Create New Discipline'}
            </span>
            <h3 className="text-xl font-bold tracking-tight mt-0.5">
              {isEditing ? 'Customize Habit' : 'Add Habit'}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
              isDark ? 'text-zinc-400 hover:text-white hover:bg-white/10' : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100'
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-5 overflow-y-auto flex-1">
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-medium">
              {error}
            </div>
          )}

          {/* 1. Habit Title */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
              Habit Name <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Read 10 Pages, Cold Shower, Meditation"
              className={`w-full px-3.5 py-2.5 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 focus:ring-[#38BDF8] ${
                isDark
                  ? 'bg-[#151A25] border-[#252E40] text-white placeholder-zinc-500'
                  : 'bg-zinc-50 border-zinc-200 text-zinc-900 placeholder-zinc-400'
              }`}
            />
          </div>

          {/* 2. Target / Time */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
              Target / Metric
            </label>
            <input
              type="text"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              placeholder="e.g. 45 mins, 6:00 AM, 1 Gallon, Clean Diet"
              className={`w-full px-3.5 py-2.5 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 focus:ring-[#38BDF8] ${
                isDark
                  ? 'bg-[#151A25] border-[#252E40] text-white placeholder-zinc-500'
                  : 'bg-zinc-50 border-zinc-200 text-zinc-900 placeholder-zinc-400'
              }`}
            />
          </div>

          {/* 3. Short Description */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
              Description / Notes
            </label>
            <input
              type="text"
              value={shortDescription}
              onChange={(e) => setShortDescription(e.target.value)}
              placeholder="e.g. Deep focused work session without distractions"
              className={`w-full px-3.5 py-2.5 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 focus:ring-[#38BDF8] ${
                isDark
                  ? 'bg-[#151A25] border-[#252E40] text-white placeholder-zinc-500'
                  : 'bg-zinc-50 border-zinc-200 text-zinc-900 placeholder-zinc-400'
              }`}
            />
          </div>

          {/* 4. Category Selector */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
              Category
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {CATEGORIES.map((cat) => {
                const isSelected = category === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    className={`py-2 px-3 rounded-xl text-xs font-medium border text-center transition-all ${
                      isSelected
                        ? 'bg-[#38BDF8]/20 border-[#38BDF8] text-[#38BDF8] font-bold shadow-sm'
                        : isDark
                        ? 'bg-[#151A25] border-[#252E40] text-zinc-400 hover:text-white'
                        : 'bg-zinc-50 border-zinc-200 text-zinc-600 hover:text-zinc-900'
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 5. Icon Selector */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
              Choose Icon
            </label>
            <div className="grid grid-cols-5 sm:grid-cols-10 gap-2 max-h-36 overflow-y-auto p-1 rounded-xl border border-white/5">
              {AVAILABLE_ICONS.map((item) => {
                const IconComponent = item.icon;
                const isSelected = iconName === item.name;
                return (
                  <button
                    key={item.name}
                    type="button"
                    onClick={() => setIconName(item.name)}
                    title={item.label}
                    className={`h-10 rounded-xl flex items-center justify-center border transition-all ${
                      isSelected
                        ? 'bg-[#38BDF8]/25 border-[#38BDF8] text-[#38BDF8] scale-105 shadow-sm'
                        : isDark
                        ? 'bg-[#151A25] border-[#252E40] text-zinc-400 hover:text-white'
                        : 'bg-zinc-50 border-zinc-200 text-zinc-600 hover:text-zinc-900'
                    }`}
                  >
                    <IconComponent className="w-5 h-5 stroke-[2]" />
                  </button>
                );
              })}
            </div>
          </div>

          {/* 6. Color Theme Selector */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
              Color Accent
            </label>
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
              {COLOR_THEMES.map((themeOption) => {
                const isSelected = color === themeOption.id;
                return (
                  <button
                    key={themeOption.id}
                    type="button"
                    onClick={() => setColor(themeOption.id)}
                    className={`py-2 px-2.5 rounded-xl border flex items-center gap-2 transition-all ${
                      isSelected
                        ? 'border-white bg-white/10 ring-2 ring-white/30 shadow-sm'
                        : isDark
                        ? 'bg-[#151A25] border-[#252E40] hover:border-zinc-500'
                        : 'bg-zinc-50 border-zinc-200 hover:border-zinc-400'
                    }`}
                  >
                    <span
                      className="w-3.5 h-3.5 rounded-full shrink-0 shadow-sm"
                      style={{ backgroundColor: themeOption.hex }}
                    />
                    <span className="text-[11px] font-medium truncate">
                      {themeOption.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 7. Reminder Settings */}
          <div
            className={`p-3.5 rounded-2xl border transition-all ${
              isDark ? 'bg-[#151A25] border-[#252E40]' : 'bg-zinc-50 border-zinc-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#38BDF8]/15 text-[#38BDF8] flex items-center justify-center">
                  <Bell className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold block">Daily Reminder</span>
                  <span className="text-[11px] text-zinc-400">
                    Get notified at a specific time each day
                  </span>
                </div>
              </div>

              {/* Toggle switch */}
              <button
                type="button"
                role="switch"
                aria-checked={reminderEnabled}
                onClick={() => handleReminderToggle(!reminderEnabled)}
                className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                  reminderEnabled ? 'bg-[#10B981]' : isDark ? 'bg-zinc-700' : 'bg-zinc-300'
                }`}
              >
                <div
                  className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                    reminderEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {reminderEnabled && (
              <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between">
                <span className="text-xs text-zinc-400 font-medium">
                  Reminder Time
                </span>
                <input
                  type="time"
                  value={reminderTime}
                  onChange={(e) => setReminderTime(e.target.value)}
                  className={`px-3 py-1.5 rounded-lg border text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-[#38BDF8] ${
                    isDark
                      ? 'bg-[#10141D] border-[#2A3448] text-white'
                      : 'bg-white border-zinc-300 text-zinc-900'
                  }`}
                />
              </div>
            )}
          </div>

          {/* 8. Active vs Disabled State */}
          <div
            className={`p-3.5 rounded-2xl border flex items-center justify-between ${
              isDark ? 'bg-[#151A25] border-[#252E40]' : 'bg-zinc-50 border-zinc-200'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  disabled
                    ? 'bg-zinc-500/15 text-zinc-400'
                    : 'bg-emerald-500/15 text-emerald-400'
                }`}
              >
                {disabled ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </div>
              <div>
                <span className="text-xs font-bold block">
                  {disabled ? 'Habit Paused / Disabled' : 'Habit is Active'}
                </span>
                <span className="text-[11px] text-zinc-400">
                  {disabled
                    ? 'Excluded from 100% daily adherence goal'
                    : 'Tracked daily toward challenge progress'}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setDisabled(!disabled)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                disabled
                  ? 'bg-zinc-700/50 border-zinc-600 text-zinc-300'
                  : 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
              }`}
            >
              {disabled ? 'Paused' : 'Active'}
            </button>
          </div>

          {/* Submit & Cancel Buttons */}
          <div className="pt-2 flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className={`flex-1 py-3 px-4 rounded-xl text-xs font-semibold border transition-all active:scale-95 ${
                isDark
                  ? 'border-white/15 bg-white/5 hover:bg-white/10 text-zinc-300'
                  : 'border-zinc-300 bg-zinc-100 hover:bg-zinc-200 text-zinc-700'
              }`}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-3 px-4 rounded-xl text-xs font-bold bg-[#38BDF8] hover:bg-[#0ea5e9] text-[#0B0E14] shadow-md shadow-[#38BDF8]/30 transition-all active:scale-95 flex items-center justify-center gap-1.5"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>{isEditing ? 'Save Changes' : 'Create Habit'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

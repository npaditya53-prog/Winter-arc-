import React, { useState, useEffect } from 'react';
import {
  Check,
  Save,
  BellRing,
  Cloud,
  LogOut,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react';
import type { User } from 'firebase/auth';
import type { SyncStatusInfo } from '../services/autoSave';
import { ChallengeSettings, ChallengeState, HydrationNotificationSettings } from '../types/challenge';
import { getDateForDay, getCurrentDayNumber } from '../utils/calculations';
import {
  getNotificationPermission,
  isPushNotificationSupported,
  NotificationPermissionState,
  sendTestBackgroundPush,
  subscribeToHydrationPush,
  unsubscribeFromHydrationPush,
} from '../utils/notifications';

interface SettingsViewProps {
  state: ChallengeState;
  onUpdateSettings: (newSettings: Partial<ChallengeSettings>) => void;
  onUpdateHydrationNotifications: (newNotifications: Partial<HydrationNotificationSettings>) => void;
  onImportBackup?: (jsonStr: string) => void;
  onResetChallenge?: () => void;
  theme: 'dark' | 'light';
  user?: User | null;
  isAuthLoading?: boolean;
  onLogin?: () => void;
  onLogout?: () => void;
  isCloudSynced?: boolean;
  onForceSync?: () => void;
  lastSyncedAt?: string | null;
  syncStatus?: SyncStatusInfo;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  state,
  onUpdateSettings,
  onUpdateHydrationNotifications,
  onImportBackup,
  onResetChallenge,
  theme,
  user,
  isAuthLoading = false,
  onLogin,
  onLogout,
  isCloudSynced = false,
  onForceSync,
  lastSyncedAt,
  syncStatus,
}) => {
  const isDark = theme === 'dark';

  // Form local state
  const [startDate, setStartDate] = useState(state.settings.startDate);
  const [hydrationGoal, setHydrationGoal] = useState(state.settings.hydrationGoal);
  const [hydrationGoalMl, setHydrationGoalMl] = useState(state.settings.hydrationGoalMl || 3500);
  const [streakThreshold, setStreakThreshold] = useState(state.settings.streakThreshold);
  const [soundEnabled, setSoundEnabled] = useState(state.settings.soundEnabled);
  const [selectedTheme, setSelectedTheme] = useState<'dark' | 'light'>(state.settings.theme);

  // Hydration Push Reminders state
  const notifSettings = state.hydrationNotifications || {
    enabled: true,
    intervalMinutes: 120,
    startTime: '06:00',
    endTime: '21:00',
    timezone: 'UTC',
  };

  const [remindersEnabled, setRemindersEnabled] = useState(notifSettings.enabled);
  const [reminderInterval, setReminderInterval] = useState(notifSettings.intervalMinutes || 120);
  const [reminderStart, setReminderStart] = useState(notifSettings.startTime || '06:00');
  const [reminderEnd, setReminderEnd] = useState(notifSettings.endTime || '21:00');
  const [userTimezone, setUserTimezone] = useState(notifSettings.timezone || 'UTC');

  // Notification permission tracking
  const [permissionState, setPermissionState] = useState<NotificationPermissionState>('default');
  const [pushStatusMessage, setPushStatusMessage] = useState<string | null>(null);
  const [isTestingPush, setIsTestingPush] = useState(false);

  useEffect(() => {
    setPermissionState(getNotificationPermission());
  }, []);

  const [savedSuccess, setSavedSuccess] = useState(false);

  const currentDayNum = getCurrentDayNumber(startDate);
  const endDate = getDateForDay(startDate, 90);

  // Toggle Hydration Reminders and register real Push
  const handleToggleReminders = async () => {
    const nextState = !remindersEnabled;
    setRemindersEnabled(nextState);

    if (nextState) {
      setPushStatusMessage('Requesting notification permission...');
      const res = await subscribeToHydrationPush({
        enabled: true,
        intervalMinutes: reminderInterval,
        startTime: reminderStart,
        endTime: reminderEnd,
        timezone: userTimezone,
        hydrationGoalMl,
      });

      setPermissionState(res.permission);
      if (res.success) {
        setPushStatusMessage('Background push notifications active! You will receive reminders even with the tab closed.');
        onUpdateHydrationNotifications({
          enabled: true,
          intervalMinutes: reminderInterval,
          startTime: reminderStart,
          endTime: reminderEnd,
          timezone: userTimezone,
        });
      } else {
        setPushStatusMessage(res.error || 'Failed to enable notifications');
      }
    } else {
      await unsubscribeFromHydrationPush();
      onUpdateHydrationNotifications({ enabled: false });
      setPushStatusMessage('Hydration reminders turned off.');
    }
  };

  const handleTestPush = async () => {
    setIsTestingPush(true);
    setPushStatusMessage('Sending test push notification...');
    const res = await sendTestBackgroundPush();
    setIsTestingPush(false);
    setPushStatusMessage(res.message);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateSettings({
      startDate,
      hydrationGoal,
      hydrationGoalMl: Number(hydrationGoalMl),
      streakThreshold: Number(streakThreshold),
      soundEnabled,
      theme: selectedTheme,
    });

    onUpdateHydrationNotifications({
      enabled: remindersEnabled,
      intervalMinutes: Number(reminderInterval),
      startTime: reminderStart,
      endTime: reminderEnd,
      timezone: userTimezone,
    });

    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-16 font-system">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-white">
          Settings
        </h1>
        <p className="text-xs text-zinc-400 mt-0.5">
          Configure dates, background hydration reminders, and preferences.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-5">
        {/* Firebase Cloud Sync & Authentication Section */}
        <section
          className={`p-4 sm:p-5 rounded-2xl border transition-colors ${
            isDark ? 'bg-[#13161C] border-[#222730]' : 'bg-white border-zinc-200 shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#20252E]">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[#5B8DEF]/15 text-[#5B8DEF] flex items-center justify-center">
                <Cloud className="w-3.5 h-3.5" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                  <span>Firebase Cloud Sync</span>
                  <span className="text-[10px] font-normal px-2 py-0.5 rounded-full bg-[#62C98A]/15 text-[#62C98A] border border-[#62C98A]/20">
                    Firestore Enterprise
                  </span>
                </h2>
                <span className="text-xs text-zinc-400">
                  Real-time cloud backup & synchronization across all your devices
                </span>
              </div>
            </div>

            {user && onForceSync && (
              <button
                type="button"
                onClick={onForceSync}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium border flex items-center gap-1.5 transition-all ${
                  isDark
                    ? 'bg-[#181C24] text-zinc-200 border-[#262B36] hover:bg-[#202530]'
                    : 'bg-zinc-100 text-zinc-700 border-zinc-300 hover:bg-zinc-200'
                }`}
              >
                <RefreshCw className="w-3 h-3 text-[#5B8DEF]" />
                <span>Sync now</span>
              </button>
            )}
          </div>

          {user ? (
            <div className="space-y-3">
              <div
                className={`p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  isDark ? 'bg-[#181C24]/80 border-[#262B36]' : 'bg-zinc-50 border-zinc-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt={user.displayName || 'User'}
                      className="w-10 h-10 rounded-full object-cover border border-[#5B8DEF]/30"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-[#5B8DEF]/20 text-[#5B8DEF] flex items-center justify-center font-bold text-sm">
                      {user.displayName ? user.displayName.charAt(0).toUpperCase() : 'U'}
                    </div>
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-white">
                        {user.displayName || 'Arc Athlete'}
                      </span>
                      <span className="flex items-center gap-1 text-[11px] font-medium">
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            syncStatus?.status === 'offline'
                              ? 'bg-zinc-500'
                              : syncStatus?.status === 'pending_sync'
                              ? 'bg-[#E4B95F]'
                              : syncStatus?.status === 'saving' || syncStatus?.status === 'syncing'
                              ? 'bg-[#5B8DEF] animate-ping'
                              : 'bg-[#62C98A]'
                          }`}
                        />
                        <span
                          className={
                            syncStatus?.status === 'offline'
                              ? 'text-zinc-400'
                              : syncStatus?.status === 'pending_sync'
                              ? 'text-[#E4B95F]'
                              : syncStatus?.status === 'saving' || syncStatus?.status === 'syncing'
                              ? 'text-[#5B8DEF]'
                              : 'text-[#62C98A]'
                          }
                        >
                          {syncStatus ? syncStatus.message : isCloudSynced ? 'Cloud Active' : 'Connecting'}
                        </span>
                      </span>
                    </div>
                    <p className="text-xs text-zinc-400">{user.email}</p>
                  </div>
                </div>

                {onLogout && (
                  <button
                    type="button"
                    onClick={onLogout}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium border border-rose-500/30 text-rose-400 hover:bg-rose-500/10 transition-colors flex items-center gap-1.5 self-start sm:self-auto`}
                  >
                    <LogOut className="w-3 h-3" />
                    <span>Sign Out</span>
                  </button>
                )}
              </div>

              <div className="flex flex-wrap items-center justify-between text-xs text-zinc-400 px-1">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#62C98A]" />
                  <span>Encrypted end-to-end with Firebase security rules</span>
                </div>
                {lastSyncedAt && (
                  <span className="text-zinc-500 text-[11px]">
                    Last synced at {lastSyncedAt}
                  </span>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-3.5">
              <p className="text-xs text-zinc-400">
                Sign in with Google to synchronize your habits, streak, reflections, and hydration tracking across mobile, tablet, and desktop in real-time.
              </p>

              {onLogin && (
                <button
                  type="button"
                  onClick={onLogin}
                  disabled={isAuthLoading}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-semibold bg-[#5B8DEF] text-[#0B0C0F] hover:bg-[#5B8DEF]/90 transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path
                      fill="#0B0C0F"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#0B0C0F"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#0B0C0F"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#0B0C0F"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>{isAuthLoading ? 'Connecting...' : 'Sign in with Google to enable Cloud Sync'}</span>
                </button>
              )}
            </div>
          )}
        </section>

        {/* Background Hydration Push Notification System (Master Requirement) */}
        <section
          className={`p-4 sm:p-5 rounded-2xl border transition-colors ${
            isDark ? 'bg-[#13161C] border-[#222730]' : 'bg-white border-zinc-200 shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#20252E]">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[#5B8DEF]/15 text-[#5B8DEF] flex items-center justify-center">
                <BellRing className="w-3.5 h-3.5" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-white">
                  Hydration background reminders
                </h2>
                <span className="text-xs text-zinc-400">
                  Real Web Push reminders when website tab is closed
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleToggleReminders}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                remindersEnabled
                  ? 'bg-[#5B8DEF] text-[#0B0C0F] border-[#5B8DEF]'
                  : isDark
                  ? 'bg-[#181C24] text-zinc-400 border-[#262B36]'
                  : 'bg-zinc-100 text-zinc-600 border-zinc-300'
              }`}
            >
              {remindersEnabled ? 'Reminders: ON' : 'Reminders: OFF'}
            </button>
          </div>

          <p className="text-xs text-zinc-400 mb-3">
            Allow notifications so Winter Arc can remind you to stay hydrated, even when the website is closed.
          </p>

          <div className="space-y-3.5">
            {/* Notification Permission & System Status */}
            <div className={`p-3.5 rounded-xl border text-xs ${isDark ? 'bg-[#181C24]/80 border-[#262B36]' : 'bg-zinc-50 border-zinc-200'}`}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <span className="text-zinc-400">Browser notification status: </span>
                  {permissionState === 'granted' && (
                    <strong className="text-[#62C98A]">Allowed</strong>
                  )}
                  {permissionState === 'denied' && (
                    <strong className="text-[#E87878]">Blocked</strong>
                  )}
                  {permissionState === 'default' && (
                    <strong className="text-[#E4B95F]">Not requested</strong>
                  )}
                  {permissionState === 'unsupported' && (
                    <strong className="text-zinc-500">Unavailable in this browser</strong>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {permissionState !== 'granted' && isPushNotificationSupported() && (
                    <button
                      type="button"
                      onClick={handleToggleReminders}
                      className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#5B8DEF] text-[#0B0C0F] hover:bg-[#5B8DEF]/90 transition-all shadow-sm"
                    >
                      Enable notifications
                    </button>
                  )}

                  {permissionState === 'granted' && (
                    <button
                      type="button"
                      disabled={isTestingPush}
                      onClick={handleTestPush}
                      className="px-3 py-1.5 rounded-xl text-xs font-medium border border-zinc-700 bg-zinc-800 text-zinc-200 hover:bg-zinc-700 transition-colors disabled:opacity-50"
                    >
                      {isTestingPush ? 'Sending...' : 'Send test notification'}
                    </button>
                  )}
                </div>
              </div>

              {permissionState === 'denied' && (
                <p className="text-[11px] text-zinc-400 mt-2">
                  Notifications are blocked by your browser. To unblock: click the lock/settings icon in your browser address bar and set Notifications to Allow.
                </p>
              )}

              {pushStatusMessage && (
                <p className="text-[11px] text-[#5B8DEF] mt-2 font-medium">
                  {pushStatusMessage}
                </p>
              )}
            </div>

            {/* Reminder Interval Selector */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">
                  Reminder interval
                </label>
                <select
                  value={reminderInterval}
                  onChange={(e) => setReminderInterval(Number(e.target.value))}
                  className={`w-full h-10 px-3 rounded-xl text-xs border focus:outline-none focus:ring-1 focus:ring-[#5B8DEF] ${
                    isDark ? 'bg-[#181C24] border-[#262B36] text-white' : 'bg-zinc-50 border-zinc-300 text-zinc-900'
                  }`}
                >
                  <option value={60}>Every 1 hour</option>
                  <option value={120}>Every 2 hours (Default)</option>
                  <option value={180}>Every 3 hours</option>
                  <option value={240}>Every 4 hours</option>
                </select>
              </div>

              {/* Timezone */}
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">
                  Timezone
                </label>
                <input
                  type="text"
                  value={userTimezone}
                  onChange={(e) => setUserTimezone(e.target.value)}
                  placeholder="e.g. Asia/Kolkata or America/New_York"
                  className={`w-full h-10 px-3 rounded-xl text-xs border focus:outline-none focus:ring-1 focus:ring-[#5B8DEF] ${
                    isDark ? 'bg-[#181C24] border-[#262B36] text-white' : 'bg-zinc-50 border-zinc-300 text-zinc-900'
                  }`}
                />
              </div>
            </div>

            {/* Active Hours */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">
                  Start time (Morning)
                </label>
                <input
                  type="time"
                  value={reminderStart}
                  onChange={(e) => setReminderStart(e.target.value)}
                  className={`w-full h-10 px-3 rounded-xl text-xs border focus:outline-none focus:ring-1 focus:ring-[#5B8DEF] tabular-nums ${
                    isDark ? 'bg-[#181C24] border-[#262B36] text-white' : 'bg-zinc-50 border-zinc-300 text-zinc-900'
                  }`}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">
                  End time (Evening)
                </label>
                <input
                  type="time"
                  value={reminderEnd}
                  onChange={(e) => setReminderEnd(e.target.value)}
                  className={`w-full h-10 px-3 rounded-xl text-xs border focus:outline-none focus:ring-1 focus:ring-[#5B8DEF] tabular-nums ${
                    isDark ? 'bg-[#181C24] border-[#262B36] text-white' : 'bg-zinc-50 border-zinc-300 text-zinc-900'
                  }`}
                />
              </div>
            </div>
          </div>
        </section>

        {/* Challenge Timing & Start Date */}
        <section
          className={`p-4 sm:p-5 rounded-2xl border transition-colors ${
            isDark ? 'bg-[#13161C] border-[#222730]' : 'bg-white border-zinc-200 shadow-sm'
          }`}
        >
          <h2 className="text-sm font-semibold text-white mb-1">
            Challenge schedule
          </h2>
          <p className="text-xs text-zinc-400 mb-3">
            Sets Day 01 of your 90-day challenge timeline.
          </p>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">
                Start date (Day 01)
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
            </div>

            <div className="flex items-center justify-between text-xs text-zinc-400 tabular-nums pt-1 border-t border-[#20252E]">
              <span>Today: <strong className="text-white">Day {String(currentDayNum).padStart(2, '0')}</strong></span>
              <span>Day 90 finishes on: <strong className="text-white">{endDate}</strong></span>
            </div>
          </div>
        </section>

        {/* Targets & Thresholds */}
        <section
          className={`p-4 sm:p-5 rounded-2xl border transition-colors ${
            isDark ? 'bg-[#13161C] border-[#222730]' : 'bg-white border-zinc-200 shadow-sm'
          }`}
        >
          <h2 className="text-sm font-semibold text-white mb-1">
            Habit targets and streak rules
          </h2>
          <p className="text-xs text-zinc-400 mb-3">
            Calibrate your personal targets for tracking.
          </p>

          <div className="space-y-4">
            {/* Configurable Hydration Goal */}
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">
                Daily hydration goal (Habit 07)
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  value={hydrationGoal}
                  onChange={(e) => {
                    setHydrationGoal(e.target.value);
                    const match = e.target.value.match(/([\d.]+)/);
                    if (match) {
                      const num = parseFloat(match[1]);
                      setHydrationGoalMl(Math.round(num * 1000));
                    }
                  }}
                  placeholder="e.g. 3.5 Liters or 1 Gallon"
                  className={`flex-1 h-11 px-3.5 rounded-xl text-sm border focus:outline-none focus:ring-1 focus:ring-[#5B8DEF] ${
                    isDark
                      ? 'bg-[#181C24] border-[#262B36] text-white'
                      : 'bg-zinc-50 border-zinc-300 text-zinc-900'
                  }`}
                />
                <span className="text-xs text-zinc-400 tabular-nums">
                  ({hydrationGoalMl} ml)
                </span>
              </div>

              <div className="flex items-center gap-2 mt-2">
                {[
                  { label: '3.0 Liters', ml: 3000 },
                  { label: '3.5 Liters', ml: 3500 },
                  { label: '4.0 Liters', ml: 4000 },
                ].map((preset) => (
                  <button
                    type="button"
                    key={preset.label}
                    onClick={() => {
                      setHydrationGoal(preset.label);
                      setHydrationGoalMl(preset.ml);
                    }}
                    className="text-xs px-3 py-1 rounded-lg bg-[#181C24] text-zinc-300 hover:text-white border border-[#262B36] transition-colors"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Streak Consistency Threshold */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-medium text-zinc-300">
                  Streak qualifying threshold
                </label>
                <span className="text-xs font-semibold text-[#5B8DEF] tabular-nums">
                  {streakThreshold}%
                </span>
              </div>
              <input
                type="range"
                min="50"
                max="100"
                step="5"
                value={streakThreshold}
                onChange={(e) => setStreakThreshold(Number(e.target.value))}
                className="w-full h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-[#5B8DEF]"
              />
              <p className="text-xs text-zinc-400 mt-1">
                A day counts toward your streak when you complete at least {streakThreshold}% of daily habits ({Math.ceil((streakThreshold / 100) * 12)} of 12).
              </p>
            </div>
          </div>
        </section>

        {/* Audio Feedback & Theme */}
        <section
          className={`p-4 sm:p-5 rounded-2xl border transition-colors ${
            isDark ? 'bg-[#13161C] border-[#222730]' : 'bg-white border-zinc-200 shadow-sm'
          }`}
        >
          <h2 className="text-sm font-semibold text-white mb-1">
            Preferences
          </h2>
          <p className="text-xs text-zinc-400 mb-3">
            Sound and display settings.
          </p>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm text-zinc-200 block">Sound feedback</span>
                <span className="text-xs text-zinc-400">Play a subtle tick when checking habits</span>
              </div>
              <button
                type="button"
                onClick={() => setSoundEnabled(!soundEnabled)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                  soundEnabled
                    ? 'bg-[#5B8DEF] text-[#0B0C0F] border-[#5B8DEF]'
                    : isDark
                    ? 'bg-[#181C24] text-zinc-400 border-[#262B36]'
                    : 'bg-zinc-100 text-zinc-600 border-zinc-300'
                }`}
              >
                {soundEnabled ? 'Enabled' : 'Muted'}
              </button>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-[#20252E]">
              <div>
                <span className="text-sm text-zinc-200 block">Theme</span>
                <span className="text-xs text-zinc-400">Select appearance</span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setSelectedTheme('dark')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors ${
                    selectedTheme === 'dark'
                      ? 'bg-[#181C24] text-white border-[#262B36]'
                      : 'text-zinc-400 border-transparent hover:text-white'
                  }`}
                >
                  Dark
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedTheme('light')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors ${
                    selectedTheme === 'light'
                      ? 'bg-zinc-200 text-zinc-900 border-zinc-300'
                      : 'text-zinc-400 border-transparent hover:text-white'
                  }`}
                >
                  Light
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Save Bar */}
        <div className="flex items-center justify-between pt-1">
          <div>
            {savedSuccess && (
              <span className="flex items-center gap-1.5 text-xs text-[#62C98A] font-medium">
                <Check className="w-4 h-4 stroke-[2.5]" />
                Settings saved.
              </span>
            )}
          </div>

          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl bg-[#5B8DEF] text-[#0B0C0F] hover:bg-[#5B8DEF]/90 font-semibold text-sm transition-all shadow-sm flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            <span>Save settings</span>
          </button>
        </div>
      </form>
    </div>
  );
};

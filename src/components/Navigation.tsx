import React, { useState } from 'react';
import {
  LayoutDashboard,
  CheckSquare,
  Calendar,
  BarChart3,
  Settings,
  Cloud,
  CloudCheck,
  LogOut,
  User as UserIcon,
} from 'lucide-react';
import type { User } from 'firebase/auth';

export type ActiveTab = 'dashboard' | 'today' | 'calendar' | 'analytics' | 'settings';

interface NavigationProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  currentDayNumber: number;
  todayPercentage: number;
  theme: 'dark' | 'light';
  user?: User | null;
  onLogin?: () => void;
  onLogout?: () => void;
  isCloudSynced?: boolean;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  onSelectTab,
  currentDayNumber,
  todayPercentage,
  theme,
  user,
  onLogin,
  onLogout,
  isCloudSynced = false,
}) => {
  const isDark = theme === 'dark';
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  const navItems = [
    { id: 'dashboard' as ActiveTab, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'today' as ActiveTab, label: "Today's habits", icon: CheckSquare },
    { id: 'calendar' as ActiveTab, label: 'Calendar', icon: Calendar },
    { id: 'analytics' as ActiveTab, label: 'Analytics', icon: BarChart3 },
    { id: 'settings' as ActiveTab, label: 'Settings', icon: Settings },
  ];

  return (
    <>
      {/* Desktop Top Navigation Bar */}
      <header
        className={`sticky top-0 z-40 w-full border-b transition-colors backdrop-blur-md ${
          isDark
            ? 'bg-[#0E1015]/90 border-[#1E232B] text-zinc-100'
            : 'bg-white/90 border-zinc-200 text-zinc-900 shadow-sm'
        }`}
      >
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          {/* Zone 1: Simple natural brand mark */}
          <button
            type="button"
            onClick={() => onSelectTab('dashboard')}
            className="flex items-center gap-2 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[#5B8DEF] rounded-xl p-1"
          >
            <div className="leading-tight">
              <span className="font-semibold text-base tracking-tight text-white hover:text-[#5B8DEF] transition-colors">
                Winter Arc
              </span>
              <span className="text-xs text-zinc-400 block -mt-0.5">
                90 day challenge
              </span>
            </div>
          </button>

          {/* Zone 2: Clean, soft bubble navigation links */}
          <nav className="hidden md:flex items-center gap-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onSelectTab(item.id)}
                  className={`px-3 py-1.5 rounded-xl text-sm font-medium transition-all flex items-center gap-1.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#5B8DEF] ${
                    isActive
                      ? isDark
                        ? 'bg-[#181C24] text-white border border-[#262B36] shadow-sm'
                        : 'bg-zinc-100 text-zinc-900'
                      : isDark
                      ? 'text-zinc-400 hover:text-zinc-200 hover:bg-[#181C24]/60'
                      : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-[#5B8DEF]' : 'opacity-70'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Zone 3: Today's status, Cloud Auth & direct action */}
          <div className="flex items-center gap-2.5">
            <div
              className={`hidden sm:flex items-center gap-2 px-3 py-1 rounded-xl border text-xs tabular-nums ${
                isDark ? 'border-[#222730] bg-[#14171E] text-zinc-300' : 'border-zinc-200 bg-zinc-50 text-zinc-700'
              }`}
            >
              <span>Day {String(currentDayNumber).padStart(2, '0')} of 90</span>
              <span className="text-zinc-600">·</span>
              <span className="font-medium text-[#5B8DEF]">{todayPercentage}%</span>
            </div>

            {/* Firebase Cloud Sync Button / User Menu */}
            {user ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowUserDropdown(!showUserDropdown)}
                  className={`flex items-center gap-2 px-2.5 py-1.5 rounded-xl border text-xs font-medium transition-all ${
                    isDark
                      ? 'bg-[#14171E] border-[#222730] text-zinc-200 hover:border-[#303644]'
                      : 'bg-zinc-50 border-zinc-200 text-zinc-700 hover:bg-zinc-100'
                  }`}
                  title={user.email || 'Cloud Synced'}
                >
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt={user.displayName || 'User'}
                      className="w-4 h-4 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-4 h-4 rounded-full bg-[#5B8DEF]/20 text-[#5B8DEF] flex items-center justify-center text-[10px] font-bold">
                      {user.displayName ? user.displayName.charAt(0).toUpperCase() : 'U'}
                    </div>
                  )}
                  <span className="hidden sm:inline max-w-[80px] truncate">
                    {user.displayName?.split(' ')[0] || 'Synced'}
                  </span>
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      isCloudSynced ? 'bg-[#62C98A]' : 'bg-[#E4B95F]'
                    }`}
                    title={isCloudSynced ? 'Firestore Synced' : 'Syncing'}
                  />
                </button>

                {showUserDropdown && (
                  <div
                    className={`absolute right-0 mt-2 w-52 rounded-2xl border shadow-xl p-2 z-50 animate-in fade-in-50 zoom-in-95 ${
                      isDark
                        ? 'bg-[#15181E] border-[#222730] text-zinc-200'
                        : 'bg-white border-zinc-200 text-zinc-800'
                    }`}
                  >
                    <div className="px-2.5 py-2 border-b border-[#222730]/60 mb-1">
                      <p className="text-xs font-medium text-white truncate">
                        {user.displayName || 'Arc Athlete'}
                      </p>
                      <p className="text-[11px] text-zinc-400 truncate">{user.email}</p>
                      <div className="flex items-center gap-1 mt-1 text-[10px] text-[#62C98A]">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#62C98A]" />
                        <span>Firebase Cloud Synced</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setShowUserDropdown(false);
                        onSelectTab('settings');
                      }}
                      className="w-full text-left px-2.5 py-1.5 text-xs rounded-xl hover:bg-white/5 transition-colors flex items-center gap-2 text-zinc-300"
                    >
                      <Settings className="w-3.5 h-3.5 text-zinc-400" />
                      <span>Sync & Settings</span>
                    </button>
                    {onLogout && (
                      <button
                        type="button"
                        onClick={() => {
                          setShowUserDropdown(false);
                          onLogout();
                        }}
                        className="w-full text-left px-2.5 py-1.5 text-xs rounded-xl hover:bg-rose-500/10 text-rose-400 transition-colors flex items-center gap-2"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Sign Out</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            ) : (
              onLogin && (
                <button
                  type="button"
                  onClick={onLogin}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-medium transition-all ${
                    isDark
                      ? 'bg-[#14171E] border-[#222730] text-zinc-300 hover:border-[#5B8DEF]/50 hover:text-white'
                      : 'bg-zinc-50 border-zinc-200 text-zinc-700 hover:bg-zinc-100'
                  }`}
                  title="Sign in with Google to sync across devices"
                >
                  <Cloud className="w-3.5 h-3.5 text-[#5B8DEF]" />
                  <span className="hidden sm:inline">Cloud Sync</span>
                </button>
              )
            )}

            <button
              type="button"
              onClick={() => onSelectTab('today')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border focus:outline-none focus-visible:ring-2 focus-visible:ring-[#5B8DEF] ${
                activeTab === 'today'
                  ? 'bg-[#5B8DEF] text-[#0B0C0F] border-[#5B8DEF] shadow-sm'
                  : isDark
                  ? 'bg-[#181C24] text-zinc-200 border-[#262B36] hover:bg-[#202530]'
                  : 'bg-zinc-900 text-white border-zinc-900 hover:bg-zinc-800'
              }`}
            >
              Today's habits
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation Bar */}
      <nav
        aria-label="Mobile navigation"
        className={`md:hidden fixed bottom-0 left-0 right-0 z-40 border-t px-2 safe-area-pb transition-colors backdrop-blur-md ${
          isDark
            ? 'bg-[#0E1015]/95 border-[#1E232B] text-zinc-400'
            : 'bg-white/95 border-zinc-200 text-zinc-600 shadow-md'
        }`}
      >
        <div className="grid grid-cols-5 items-center h-14 max-w-md mx-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectTab(item.id)}
                className={`flex flex-col items-center justify-center min-h-[44px] py-1 transition-all rounded-xl ${
                  isActive
                    ? isDark
                      ? 'text-white'
                      : 'text-zinc-950'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <div className={`p-1 rounded-lg ${isActive ? 'bg-[#5B8DEF]/15 text-[#5B8DEF]' : ''}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <span className={`text-[10px] mt-0.5 ${isActive ? 'font-medium text-white' : ''}`}>
                  {item.id === 'today' ? 'Today' : item.id === 'calendar' ? 'Calendar' : item.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
};

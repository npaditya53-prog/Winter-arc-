import React, { useState } from 'react';
import {
  LayoutDashboard,
  CheckSquare,
  Calendar,
  BarChart3,
  Settings,
  Cloud,
  LogOut,
  User as UserIcon,
  Check,
  Loader2,
  CloudOff,
  RefreshCw,
} from 'lucide-react';
import type { User } from 'firebase/auth';
import type { SyncStatusInfo } from '../services/autoSave';

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
  syncStatus?: SyncStatusInfo;
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
  syncStatus,
}) => {
  const isDark = theme === 'dark';
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  const navItems = [
    { id: 'dashboard' as ActiveTab, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'today' as ActiveTab, label: 'Today', icon: CheckSquare },
    { id: 'calendar' as ActiveTab, label: 'Calendar', icon: Calendar },
    { id: 'analytics' as ActiveTab, label: 'Analytics', icon: BarChart3 },
    { id: 'settings' as ActiveTab, label: 'Settings', icon: Settings },
  ];

  return (
    <>
      {/* Top Header Bar */}
      <header
        className={`sticky top-0 z-40 w-full border-b transition-colors backdrop-blur-md ${
          isDark
            ? 'bg-[#0B0E14]/90 border-[#1B2230] text-zinc-100'
            : 'bg-white/90 border-zinc-200 text-zinc-900 shadow-sm'
        }`}
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          {/* Brand Mark */}
          <button
            type="button"
            onClick={() => onSelectTab('dashboard')}
            className="flex items-center gap-2 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[#38BDF8] rounded-xl p-1 group"
          >
            <div className="leading-tight">
              <span className="font-bold text-base tracking-tight text-white group-hover:text-[#38BDF8] transition-colors">
                WINTER <span className="text-[#38BDF8]">ARC</span>
              </span>
              <span className="text-[10px] uppercase tracking-wider text-zinc-500 block -mt-0.5">
                90 Days
              </span>
            </div>
          </button>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onSelectTab(item.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#38BDF8] ${
                    isActive
                      ? isDark
                        ? 'bg-[#18202D] text-white border border-[#2B374C] shadow-sm'
                        : 'bg-zinc-100 text-zinc-900'
                      : isDark
                      ? 'text-zinc-400 hover:text-zinc-200 hover:bg-[#141924]'
                      : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#38BDF8]' : 'opacity-70'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Status, Auto-Save & User Actions */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            {/* Auto-Save & Sync Status Indicator */}
            {syncStatus && syncStatus.status !== 'idle' && (
              <div
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs transition-all duration-300 animate-in fade-in ${
                  syncStatus.status === 'saved' || syncStatus.status === 'synced'
                    ? 'bg-[#10B981]/12 text-[#10B981] border border-[#10B981]/30 shadow-sm'
                    : syncStatus.status === 'saving' || syncStatus.status === 'syncing'
                    ? 'bg-[#38BDF8]/12 text-[#38BDF8] border border-[#38BDF8]/30 shadow-sm'
                    : syncStatus.status === 'offline'
                    ? isDark
                      ? 'bg-zinc-800/90 text-zinc-400 border border-zinc-700/60'
                      : 'bg-zinc-100 text-zinc-600 border border-zinc-200'
                    : isDark
                    ? 'bg-[#F59E0B]/15 text-[#F59E0B] border border-[#F59E0B]/30'
                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                }`}
                title={
                  syncStatus.lastSavedAt
                    ? `${syncStatus.message} (${syncStatus.lastSavedAt})`
                    : syncStatus.message
                }
              >
                {syncStatus.status === 'saving' || syncStatus.status === 'syncing' ? (
                  <Loader2 className="w-3 h-3 animate-spin shrink-0" />
                ) : syncStatus.status === 'offline' ? (
                  <CloudOff className="w-3 h-3 shrink-0" />
                ) : syncStatus.status === 'pending_sync' ? (
                  <RefreshCw className="w-3 h-3 shrink-0" />
                ) : (
                  <Check className="w-3 h-3 stroke-[2.5] shrink-0" />
                )}
                <span className="hidden sm:inline font-medium text-[11px] whitespace-nowrap">
                  {syncStatus.message}
                </span>
              </div>
            )}

            {/* Compact Day Counter */}
            <div
              className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-xl border text-xs tabular-nums ${
                isDark ? 'border-[#1E2533] bg-[#10141C] text-zinc-300' : 'border-zinc-200 bg-zinc-50 text-zinc-700'
              }`}
            >
              <span>Day {String(currentDayNumber).padStart(2, '0')}/90</span>
              <span className="text-zinc-600">·</span>
              <span className="font-semibold text-[#38BDF8]">{todayPercentage}%</span>
            </div>

            {/* Cloud User Sync Profile */}
            {user ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowUserDropdown(!showUserDropdown)}
                  className={`flex items-center gap-2 px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-xl border text-xs font-medium transition-all ${
                    isDark
                      ? 'bg-[#121620] border-[#222B3C] text-zinc-200 hover:border-[#38BDF8]/40'
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
                    <div className="w-4 h-4 rounded-full bg-[#38BDF8]/20 text-[#38BDF8] flex items-center justify-center text-[10px] font-bold">
                      {user.displayName ? user.displayName.charAt(0).toUpperCase() : 'U'}
                    </div>
                  )}
                  <span className="hidden sm:inline max-w-[75px] truncate">
                    {user.displayName?.split(' ')[0] || 'Synced'}
                  </span>
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      isCloudSynced ? 'bg-[#10B981]' : 'bg-[#F59E0B]'
                    }`}
                    title={isCloudSynced ? 'Firestore Synced' : 'Syncing'}
                  />
                </button>

                {showUserDropdown && (
                  <div
                    className={`absolute right-0 mt-2 w-52 rounded-2xl border shadow-xl p-2 z-50 animate-in fade-in-50 zoom-in-95 ${
                      isDark
                        ? 'bg-[#121620] border-[#222B3C] text-zinc-200'
                        : 'bg-white border-zinc-200 text-zinc-800'
                    }`}
                  >
                    <div className="px-2.5 py-2 border-b border-[#222B3C]/60 mb-1">
                      <p className="text-xs font-semibold text-white truncate">
                        {user.displayName || 'Arc Athlete'}
                      </p>
                      <p className="text-[11px] text-zinc-400 truncate">{user.email}</p>
                      <div className="flex items-center gap-1 mt-1 text-[10px] text-[#10B981]">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
                        <span>Cloud Auto-Sync Active</span>
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
                      <span>Settings & Preferences</span>
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
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
                    isDark
                      ? 'bg-[#121620] border-[#222B3C] text-zinc-300 hover:border-[#38BDF8]/50 hover:text-white'
                      : 'bg-zinc-50 border-zinc-200 text-zinc-700 hover:bg-zinc-100'
                  }`}
                  title="Sign in with Google to sync across all devices"
                >
                  <Cloud className="w-3.5 h-3.5 text-[#38BDF8]" />
                  <span className="hidden sm:inline">Sync</span>
                </button>
              )
            )}
          </div>
        </div>
      </header>

      {/* Mobile-First Bottom Navigation Bar */}
      <nav
        aria-label="Mobile navigation"
        className={`md:hidden fixed bottom-0 left-0 right-0 z-40 border-t px-2 safe-area-pb transition-colors backdrop-blur-md ${
          isDark
            ? 'bg-[#0B0E14]/95 border-[#1B2230] text-zinc-400'
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
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                <div className={`p-1.5 rounded-xl transition-all ${isActive ? 'bg-[#38BDF8]/15 text-[#38BDF8] scale-105' : ''}`}>
                  <Icon className="w-4 h-4 stroke-[2]" />
                </div>
                <span className={`text-[10px] mt-0.5 tracking-tight ${isActive ? 'font-bold text-white' : 'font-medium'}`}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
};

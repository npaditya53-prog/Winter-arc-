import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ActiveTab, Navigation } from './components/Navigation';
import { DashboardView } from './components/DashboardView';
import { TodayView } from './components/TodayView';
import { CalendarView } from './components/CalendarView';
import { AnalyticsView } from './components/AnalyticsView';
import { SettingsView } from './components/SettingsView';
import { OnboardingModal } from './components/OnboardingModal';
import { DayInspectorModal } from './components/DayInspectorModal';
import { CompletionCelebrationModal } from './components/CompletionCelebrationModal';
import { HydrationReminderToast } from './components/HydrationReminderToast';
import { ChallengeSettings, ChallengeState, HydrationNotificationSettings } from './types/challenge';
import {
  createInitialChallengeState,
  loadChallengeState,
  logWaterIntake,
  resetChallengeData,
  saveChallengeState,
  saveDayRecord,
  updateChallengeSettings,
  updateHydrationNotificationSettings,
} from './utils/storage';
import { calculateOverallStats, getCurrentDayNumber } from './utils/calculations';
import { playTickSound } from './utils/audio';
import { logWaterApi, registerServiceWorker } from './utils/notifications';
import {
  auth,
  loginWithGoogle,
  logoutFirebaseUser,
  testFirestoreConnection,
  getChallengeFromFirestore,
  saveChallengeToFirestore,
  subscribeToChallengeState,
  onAuthStateChanged,
} from './services/firebase';
import {
  autoSaveManager,
  resolveStateConflict,
  type SyncStatusInfo,
} from './services/autoSave';
import type { User } from 'firebase/auth';

export default function App() {
  const [challengeState, setChallengeState] = useState<ChallengeState | null>(() => {
    return loadChallengeState();
  });

  // Latest mutable ref to always avoid closure stale reads during rapid habit clicks
  const challengeStateRef = useRef<ChallengeState | null>(challengeState);
  useEffect(() => {
    challengeStateRef.current = challengeState;
  }, [challengeState]);

  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [activeDayNumber, setActiveDayNumber] = useState<number>(() => {
    if (challengeState?.settings?.startDate) {
      return getCurrentDayNumber(challengeState.settings.startDate);
    }
    return 1;
  });

  const [inspectingDayNumber, setInspectingDayNumber] = useState<number | null>(null);
  const [showCelebrationModal, setShowCelebrationModal] = useState<boolean>(false);
  const [showHydrationToast, setShowHydrationToast] = useState<boolean>(false);

  // Firebase Auth and Cloud Sync state
  const [user, setUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(true);
  const [isCloudSynced, setIsCloudSynced] = useState<boolean>(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<SyncStatusInfo>(() => autoSaveManager.getInfo());
  const isSyncingFromRemote = useRef(false);

  // Auto-Save Manager subscription
  useEffect(() => {
    const unsub = autoSaveManager.subscribe((info) => {
      setSyncStatus(info);
      if (info.status === 'saved' || info.status === 'synced') {
        setIsCloudSynced(true);
        if (info.lastSavedAt) {
          setLastSyncedAt(info.lastSavedAt);
        }
      } else if (info.status === 'pending_sync' || info.status === 'offline') {
        setIsCloudSynced(false);
      }
    });
    return () => unsub();
  }, []);

  // Update autoSaveManager with current authenticated user
  useEffect(() => {
    autoSaveManager.setCurrentUser(user?.uid || null);
  }, [user]);

  // 1. Initial Connection test & Firebase Auth State listener
  useEffect(() => {
    testFirestoreConnection().catch(console.error);

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setIsAuthLoading(false);

      if (currentUser) {
        try {
          const cloudState = await getChallengeFromFirestore(currentUser.uid);
          if (cloudState && cloudState.days) {
            const { mergedState, hasLocalModifications } = resolveStateConflict(
              challengeStateRef.current,
              cloudState
            );

            isSyncingFromRemote.current = true;
            challengeStateRef.current = mergedState;
            setChallengeState(mergedState);
            saveChallengeState(mergedState);
            setIsCloudSynced(true);
            setLastSyncedAt(new Date().toLocaleTimeString());

            setTimeout(() => {
              isSyncingFromRemote.current = false;
            }, 600);

            // If local changes were newer, push the merged state to cloud
            if (hasLocalModifications) {
              await autoSaveManager.save(mergedState, currentUser.uid);
            }
          } else if (challengeStateRef.current) {
            // First time login: sync current local data to Firestore
            await autoSaveManager.save(challengeStateRef.current, currentUser.uid);
            setIsCloudSynced(true);
            setLastSyncedAt(new Date().toLocaleTimeString());
          }
        } catch (err) {
          console.error('Failed to sync challenge data with Firestore on sign in:', err);
        }
      } else {
        setIsCloudSynced(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // 2. Real-time Firestore subscription when user is authenticated with conflict resolution
  useEffect(() => {
    if (!user) return;

    const unsubscribe = subscribeToChallengeState(
      user.uid,
      (remoteState) => {
        if (isSyncingFromRemote.current) return;
        if (remoteState && remoteState.days) {
          const { mergedState, hasLocalModifications } = resolveStateConflict(
            challengeStateRef.current,
            remoteState
          );

          isSyncingFromRemote.current = true;
          challengeStateRef.current = mergedState;
          setChallengeState(mergedState);
          saveChallengeState(mergedState);
          setIsCloudSynced(true);
          setLastSyncedAt(new Date().toLocaleTimeString());

          setTimeout(() => {
            isSyncingFromRemote.current = false;
          }, 600);

          if (hasLocalModifications) {
            autoSaveManager.save(mergedState, user.uid);
          }
        }
      },
      (err) => {
        console.warn('Real-time sync subscription message:', err);
      }
    );

    return () => unsubscribe();
  }, [user]);

  // Register service worker and handle push messages
  useEffect(() => {
    registerServiceWorker();

    // Check URL actions (e.g. opened from notification)
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const action = urlParams.get('action');
      if (action === 'hydration') {
        setActiveTab('dashboard');
      }
      const loggedAmount = urlParams.get('amount');
      if (loggedAmount) {
        const amt = parseInt(loggedAmount, 10);
        if (!isNaN(amt) && amt > 0) {
          handleLogWater(amt);
        }
      }
    }

    // Listen for service worker notification click messages
    const messageHandler = (event: MessageEvent) => {
      if (event.data?.type === 'WATER_LOGGED') {
        handleLogWater(event.data.amountMl || 250);
      }
    };

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', messageHandler);
      return () => navigator.serviceWorker.removeEventListener('message', messageHandler);
    }
  }, []);

  // Sync activeDayNumber whenever challengeState changes
  useEffect(() => {
    if (challengeState?.settings?.startDate) {
      const todayNum = getCurrentDayNumber(challengeState.settings.startDate);
      setActiveDayNumber((prev) => Math.min(Math.max(prev || todayNum, 1), 90));
    }
  }, [challengeState?.settings?.startDate]);

  // Sync document theme classes
  const theme = challengeState?.settings?.theme || 'dark';
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      root.style.backgroundColor = '#0B0E14';
      root.style.color = '#F3F4F6';
    } else {
      root.classList.remove('dark');
      root.style.backgroundColor = '#FBFBFA';
      root.style.color = '#121316';
    }
  }, [theme]);

  // Keyboard navigation shortcuts: 1..5 when not in an input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      if (e.key === '1') setActiveTab('dashboard');
      else if (e.key === '2') setActiveTab('today');
      else if (e.key === '3') setActiveTab('calendar');
      else if (e.key === '4') setActiveTab('analytics');
      else if (e.key === '5') setActiveTab('settings');
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Handler: Start Challenge (First-time onboarding)
  const handleStartChallenge = async (startDate: string, hydrationGoal: string) => {
    const match = hydrationGoal.match(/([\d.]+)/);
    const hydrationGoalMl = match ? Math.round(parseFloat(match[1]) * 1000) : 3500;

    const newState = createInitialChallengeState({
      startDate,
      hydrationGoal,
      hydrationGoalMl,
      hasStarted: true,
    });
    challengeStateRef.current = newState;
    setChallengeState(newState);
    setActiveDayNumber(getCurrentDayNumber(startDate));
    setActiveTab('dashboard');

    await autoSaveManager.save(newState, user?.uid);
  };

  // Handler: Log Water Intake
  const handleLogWater = useCallback(
    (amountMl: number, dateStr?: string) => {
      const currentState = challengeStateRef.current;
      if (!currentState) return;
      playTickSound(true, currentState.settings.soundEnabled);

      const updated = logWaterIntake(currentState, amountMl, dateStr);
      challengeStateRef.current = updated;
      setChallengeState(updated);

      // Save immediately locally and queue cloud sync
      autoSaveManager.save(updated, user?.uid);

      // Also notify backend
      logWaterApi(amountMl, dateStr);
    },
    [user]
  );

  // Handler: Toggle habit for a day with instant auto-save and timestamp tracking
  const handleToggleHabit = useCallback(
    (habitId: string, dayNumber?: number) => {
      const currentState = challengeStateRef.current;
      if (!currentState) return;
      const targetDay = dayNumber || activeDayNumber;
      const dayRec = currentState.days[targetDay];
      const currentHabits = dayRec?.habits || {};
      const newStatus = !currentHabits[habitId];

      const updatedHabits = {
        ...currentHabits,
        [habitId]: newStatus,
      };

      const updatedTimestamps: Record<string, string> = { ...(dayRec?.habitTimestamps || {}) };
      if (newStatus) {
        updatedTimestamps[habitId] = new Date().toISOString();
      } else {
        delete updatedTimestamps[habitId];
      }

      playTickSound(newStatus, currentState.settings.soundEnabled);

      const updatedState = saveDayRecord(
        currentState,
        targetDay,
        updatedHabits,
        dayRec?.reflection,
        updatedTimestamps
      );

      // Update state and mutable ref immediately
      challengeStateRef.current = updatedState;
      setChallengeState(updatedState);

      // Instant auto-save without waiting for user action or batch
      autoSaveManager.save(updatedState, user?.uid);
    },
    [activeDayNumber, user]
  );

  // Handler: Update reflection notes
  const handleUpdateReflection = useCallback(
    (dayNumber: number, reflection: { wentWell: string; couldImprove: string; notes: string }) => {
      const currentState = challengeStateRef.current;
      if (!currentState) return;
      const dayRec = currentState.days[dayNumber];
      const habits = dayRec?.habits || {};

      const updatedState = saveDayRecord(
        currentState,
        dayNumber,
        habits,
        reflection,
        dayRec?.habitTimestamps
      );
      challengeStateRef.current = updatedState;
      setChallengeState(updatedState);

      autoSaveManager.save(updatedState, user?.uid);
    },
    [user]
  );

  // Handler: Update settings
  const handleUpdateSettings = useCallback(
    (newSettings: Partial<ChallengeSettings>) => {
      const currentState = challengeStateRef.current;
      if (!currentState) return;
      const updatedState = updateChallengeSettings(currentState, newSettings);
      challengeStateRef.current = updatedState;
      setChallengeState(updatedState);
      if (newSettings.startDate) {
        setActiveDayNumber(getCurrentDayNumber(newSettings.startDate));
      }
      autoSaveManager.save(updatedState, user?.uid);
    },
    [user]
  );

  // Handler: Update hydration notification settings
  const handleUpdateHydrationNotifications = useCallback(
    (newNotifications: Partial<HydrationNotificationSettings>) => {
      const currentState = challengeStateRef.current;
      if (!currentState) return;
      const updatedState = updateHydrationNotificationSettings(currentState, newNotifications);
      challengeStateRef.current = updatedState;
      setChallengeState(updatedState);
      autoSaveManager.save(updatedState, user?.uid);

      // Sync settings to backend
      fetch('/api/notifications/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings: updatedState.hydrationNotifications }),
      }).catch((err) => console.error('Failed to sync notification settings:', err));
    },
    [user]
  );

  // Handler: Import backup
  const handleImportBackup = useCallback(
    async (jsonStr: string) => {
      const parsed = JSON.parse(jsonStr) as ChallengeState;
      if (!parsed || !parsed.settings || !parsed.days) {
        throw new Error('Invalid format');
      }
      challengeStateRef.current = parsed;
      setChallengeState(parsed);
      setActiveDayNumber(getCurrentDayNumber(parsed.settings.startDate));
      await autoSaveManager.save(parsed, user?.uid);
    },
    [user]
  );

  // Handler: Reset challenge
  const handleResetChallenge = useCallback(async () => {
    resetChallengeData();
    challengeStateRef.current = null;
    setChallengeState(null);
    setActiveTab('dashboard');
    setActiveDayNumber(1);
    if (user) {
      // create fresh skeleton on cloud
      const fresh = createInitialChallengeState();
      await autoSaveManager.save(fresh, user.uid);
    }
  }, [user]);

  // Auth Action Handlers
  const handleLogin = async () => {
    setIsAuthLoading(true);
    try {
      await loginWithGoogle();
    } catch (err) {
      console.error('Login action error:', err);
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logoutFirebaseUser();
      setUser(null);
      setIsCloudSynced(false);
      autoSaveManager.setCurrentUser(null);
    } catch (err) {
      console.error('Logout action error:', err);
    }
  };

  const handleForceSync = async () => {
    if (!challengeStateRef.current) return;
    await autoSaveManager.save(challengeStateRef.current, user?.uid);
  };

  // First-time onboarding screen
  if (!challengeState || !challengeState.settings.hasStarted) {
    return (
      <div className="min-h-screen bg-[#0b0c0f] text-[#f4f4f2] flex items-center justify-center p-4">
        <OnboardingModal onStart={handleStartChallenge} theme="dark" />
      </div>
    );
  }

  const overallStats = calculateOverallStats(challengeState);

  // Check 90-day completion
  useEffect(() => {
    if (
      overallStats.currentDayNumber === 90 &&
      overallStats.todayCompletedCount === 12
    ) {
      setShowCelebrationModal(true);
    }
  }, [overallStats.currentDayNumber, overallStats.todayCompletedCount]);

  return (
    <div
      className={`min-h-screen flex flex-col transition-colors selection:bg-[#38BDF8]/30 ${
        theme === 'dark' ? 'bg-[#0B0E14] text-[#F3F4F6]' : 'bg-[#FBFBFA] text-[#121316]'
      }`}
    >
      {/* Top Bar Navigation */}
      <Navigation
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        currentDayNumber={overallStats.currentDayNumber}
        todayPercentage={overallStats.todayPercentage}
        theme={theme}
        user={user}
        onLogin={handleLogin}
        onLogout={handleLogout}
        isCloudSynced={isCloudSynced}
        syncStatus={syncStatus}
      />

      {/* Main Content Viewport */}
      <main className="flex-1 w-full max-w-5xl mx-auto px-3.5 sm:px-6 lg:px-8 py-5 sm:py-7">
        {activeTab === 'dashboard' && (
          <DashboardView
            state={challengeState}
            stats={overallStats}
            onToggleHabit={handleToggleHabit}
            onLogWater={handleLogWater}
            onNavigate={setActiveTab}
            theme={theme}
          />
        )}

        {activeTab === 'today' && (
          <TodayView
            state={challengeState}
            activeDayNumber={activeDayNumber}
            onSelectDayNumber={setActiveDayNumber}
            onToggleHabit={handleToggleHabit}
            onUpdateReflection={handleUpdateReflection}
            theme={theme}
          />
        )}

        {activeTab === 'calendar' && (
          <CalendarView
            state={challengeState}
            onOpenDay={(dayNum) => setInspectingDayNumber(dayNum)}
            theme={theme}
          />
        )}

        {activeTab === 'analytics' && (
          <AnalyticsView
            state={challengeState}
            stats={overallStats}
            theme={theme}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsView
            state={challengeState}
            onUpdateSettings={handleUpdateSettings}
            onUpdateHydrationNotifications={handleUpdateHydrationNotifications}
            onImportBackup={handleImportBackup}
            onResetChallenge={handleResetChallenge}
            theme={theme}
            user={user}
            isAuthLoading={isAuthLoading}
            onLogin={handleLogin}
            onLogout={handleLogout}
            isCloudSynced={isCloudSynced}
            onForceSync={handleForceSync}
            lastSyncedAt={lastSyncedAt}
            syncStatus={syncStatus}
          />
        )}
      </main>

      {/* Calendar Day Inspector Modal */}
      {inspectingDayNumber !== null && (
        <DayInspectorModal
          dayNumber={inspectingDayNumber}
          state={challengeState}
          onClose={() => setInspectingDayNumber(null)}
          onToggleHabit={handleToggleHabit}
          onOpenInToday={(dayNum) => {
            setActiveDayNumber(dayNum);
            setActiveTab('today');
            setInspectingDayNumber(null);
          }}
          theme={theme}
        />
      )}

      {/* 90-Day Challenge Completion Celebration Modal */}
      {showCelebrationModal && (
        <CompletionCelebrationModal
          stats={overallStats}
          onClose={() => setShowCelebrationModal(false)}
          theme={theme}
        />
      )}

      {/* In-App Elegant Hydration Toast */}
      {showHydrationToast && (
        <HydrationReminderToast
          onLogWater={handleLogWater}
          onDismiss={() => setShowHydrationToast(false)}
          theme={theme}
        />
      )}
    </div>
  );
}

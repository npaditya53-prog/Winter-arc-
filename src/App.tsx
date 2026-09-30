import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ActiveTab, Navigation } from './components/Navigation';
import { DashboardView } from './components/DashboardView';
import { TodayView } from './components/TodayView';
import { CalendarView } from './components/CalendarView';
import { AnalyticsView } from './components/AnalyticsView';
import { SettingsView } from './components/SettingsView';
import { OnboardingModal } from './components/OnboardingModal';
import { DayInspectorModal } from './components/DayInspectorModal';
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
import type { User } from 'firebase/auth';

export default function App() {
  const [challengeState, setChallengeState] = useState<ChallengeState | null>(() => {
    return loadChallengeState();
  });

  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [activeDayNumber, setActiveDayNumber] = useState<number>(() => {
    if (challengeState?.settings?.startDate) {
      return getCurrentDayNumber(challengeState.settings.startDate);
    }
    return 1;
  });

  const [inspectingDayNumber, setInspectingDayNumber] = useState<number | null>(null);

  // Firebase Auth and Cloud Sync state
  const [user, setUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(true);
  const [isCloudSynced, setIsCloudSynced] = useState<boolean>(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const isSyncingFromRemote = useRef(false);

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
            isSyncingFromRemote.current = true;
            setChallengeState(cloudState);
            saveChallengeState(cloudState);
            setIsCloudSynced(true);
            setLastSyncedAt(new Date().toLocaleTimeString());
            setTimeout(() => {
              isSyncingFromRemote.current = false;
            }, 1000);
          } else if (challengeState) {
            // First time login: sync current local data to Firestore
            await saveChallengeToFirestore(currentUser.uid, challengeState);
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

  // 2. Real-time Firestore subscription when user is authenticated
  useEffect(() => {
    if (!user) return;

    const unsubscribe = subscribeToChallengeState(
      user.uid,
      (remoteState) => {
        if (isSyncingFromRemote.current) return;
        if (remoteState && remoteState.days) {
          isSyncingFromRemote.current = true;
          setChallengeState(remoteState);
          saveChallengeState(remoteState);
          setIsCloudSynced(true);
          setLastSyncedAt(new Date().toLocaleTimeString());
          setTimeout(() => {
            isSyncingFromRemote.current = false;
          }, 800);
        }
      },
      (err) => {
        console.warn('Real-time sync subscription message:', err);
      }
    );

    return () => unsubscribe();
  }, [user]);

  // 3. Auto-save local state changes to Firestore with debounce
  useEffect(() => {
    if (!user || !challengeState || isSyncingFromRemote.current) return;

    const timeout = setTimeout(async () => {
      try {
        await saveChallengeToFirestore(user.uid, challengeState);
        setIsCloudSynced(true);
        setLastSyncedAt(new Date().toLocaleTimeString());
      } catch (err) {
        console.error('Failed to autosave challenge state to Firestore:', err);
        setIsCloudSynced(false);
      }
    }, 800);

    return () => clearTimeout(timeout);
  }, [challengeState, user]);

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
      root.style.backgroundColor = '#0b0c0f';
      root.style.color = '#f4f4f2';
    } else {
      root.classList.remove('dark');
      root.style.backgroundColor = '#fbfbfa';
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
    saveChallengeState(newState);
    setChallengeState(newState);
    setActiveDayNumber(getCurrentDayNumber(startDate));
    setActiveTab('dashboard');

    if (user) {
      await saveChallengeToFirestore(user.uid, newState).catch(console.error);
    }
  };

  // Handler: Log Water Intake
  const handleLogWater = useCallback(
    (amountMl: number, dateStr?: string) => {
      if (!challengeState) return;
      playTickSound(true, challengeState.settings.soundEnabled);

      const updated = logWaterIntake(challengeState, amountMl, dateStr);
      setChallengeState(updated);

      // Also notify backend
      logWaterApi(amountMl, dateStr);
    },
    [challengeState]
  );

  // Handler: Toggle habit for a day
  const handleToggleHabit = useCallback(
    (habitId: string, dayNumber?: number) => {
      if (!challengeState) return;
      const targetDay = dayNumber || activeDayNumber;
      const dayRec = challengeState.days[targetDay];
      const currentHabits = dayRec?.habits || {};
      const newStatus = !currentHabits[habitId];

      const updatedHabits = {
        ...currentHabits,
        [habitId]: newStatus,
      };

      playTickSound(newStatus, challengeState.settings.soundEnabled);

      const updatedState = saveDayRecord(
        challengeState,
        targetDay,
        updatedHabits,
        dayRec?.reflection
      );
      setChallengeState(updatedState);
    },
    [challengeState, activeDayNumber]
  );

  // Handler: Update reflection notes
  const handleUpdateReflection = useCallback(
    (dayNumber: number, reflection: { wentWell: string; couldImprove: string; notes: string }) => {
      if (!challengeState) return;
      const dayRec = challengeState.days[dayNumber];
      const habits = dayRec?.habits || {};

      const updatedState = saveDayRecord(
        challengeState,
        dayNumber,
        habits,
        reflection
      );
      setChallengeState(updatedState);
    },
    [challengeState]
  );

  // Handler: Update settings
  const handleUpdateSettings = useCallback(
    (newSettings: Partial<ChallengeSettings>) => {
      if (!challengeState) return;
      const updatedState = updateChallengeSettings(challengeState, newSettings);
      setChallengeState(updatedState);
      if (newSettings.startDate) {
        setActiveDayNumber(getCurrentDayNumber(newSettings.startDate));
      }
    },
    [challengeState]
  );

  // Handler: Update hydration notification settings
  const handleUpdateHydrationNotifications = useCallback(
    (newNotifications: Partial<HydrationNotificationSettings>) => {
      if (!challengeState) return;
      const updatedState = updateHydrationNotificationSettings(challengeState, newNotifications);
      setChallengeState(updatedState);

      // Sync settings to backend
      fetch('/api/notifications/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings: updatedState.hydrationNotifications }),
      }).catch((err) => console.error('Failed to sync notification settings:', err));
    },
    [challengeState]
  );

  // Handler: Import backup
  const handleImportBackup = useCallback(
    async (jsonStr: string) => {
      const parsed = JSON.parse(jsonStr) as ChallengeState;
      if (!parsed || !parsed.settings || !parsed.days) {
        throw new Error('Invalid format');
      }
      saveChallengeState(parsed);
      setChallengeState(parsed);
      setActiveDayNumber(getCurrentDayNumber(parsed.settings.startDate));
      if (user) {
        await saveChallengeToFirestore(user.uid, parsed).catch(console.error);
      }
    },
    [user]
  );

  // Handler: Reset challenge
  const handleResetChallenge = useCallback(async () => {
    resetChallengeData();
    setChallengeState(null);
    setActiveTab('dashboard');
    setActiveDayNumber(1);
    if (user) {
      // create fresh skeleton on cloud
      const fresh = createInitialChallengeState();
      await saveChallengeToFirestore(user.uid, fresh).catch(console.error);
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
    } catch (err) {
      console.error('Logout action error:', err);
    }
  };

  const handleForceSync = async () => {
    if (!user || !challengeState) return;
    try {
      await saveChallengeToFirestore(user.uid, challengeState);
      setIsCloudSynced(true);
      setLastSyncedAt(new Date().toLocaleTimeString());
    } catch (err) {
      console.error('Manual force sync error:', err);
    }
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

  return (
    <div
      className={`min-h-screen flex flex-col transition-colors selection:bg-[#5B8DEF]/30 ${
        theme === 'dark' ? 'bg-[#0b0c0f] text-[#f4f4f2]' : 'bg-[#fbfbfa] text-[#121316]'
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
      />

      {/* Main Content Viewport */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
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
    </div>
  );
}

import { ChallengeState, DayRecord } from '../types/challenge';
import { saveChallengeState, loadChallengeState } from '../utils/storage';
import { saveChallengeToFirestore } from './firebase';

export type SyncStatusType =
  | 'idle'
  | 'saving'
  | 'saved'
  | 'syncing'
  | 'synced'
  | 'offline'
  | 'pending_sync';

export interface SyncStatusInfo {
  status: SyncStatusType;
  message: string;
  lastSavedAt: string | null;
  isOffline: boolean;
  hasPendingChanges: boolean;
}

const PENDING_SYNC_KEY = 'winter_arc_pending_sync';

type Listener = (info: SyncStatusInfo) => void;

class AutoSaveManager {
  private listeners: Set<Listener> = new Set();
  private currentStatus: SyncStatusType = 'idle';
  private message: string = 'Saved';
  private lastSavedAt: string | null = null;
  private isOffline: boolean = typeof navigator !== 'undefined' ? !navigator.onLine : false;
  private fadeTimer: any = null;

  // Sync queue control
  private isWritingToFirestore = false;
  private queuedPayload: { userId: string; state: ChallengeState } | null = null;
  private currentUserId: string | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', this.handleOnline);
      window.addEventListener('offline', this.handleOffline);
      window.addEventListener('beforeunload', this.handleBeforeUnload);
    }
  }

  public subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    // Initial emit
    listener(this.getInfo());
    return () => {
      this.listeners.delete(listener);
    };
  }

  public setCurrentUser(userId: string | null) {
    this.currentUserId = userId;
    if (userId && this.hasPendingSync()) {
      this.flushPendingSync();
    }
  }

  public getInfo(): SyncStatusInfo {
    return {
      status: this.currentStatus,
      message: this.message,
      lastSavedAt: this.lastSavedAt,
      isOffline: this.isOffline,
      hasPendingChanges: this.hasPendingSync(),
    };
  }

  private notify() {
    const info = this.getInfo();
    this.listeners.forEach((listener) => {
      try {
        listener(info);
      } catch (e) {
        console.error('Error in autosave listener:', e);
      }
    });
  }

  private setStatus(status: SyncStatusType, message: string, autoFade = false) {
    this.currentStatus = status;
    this.message = message;
    if (this.fadeTimer) {
      clearTimeout(this.fadeTimer);
      this.fadeTimer = null;
    }

    this.notify();

    if (autoFade) {
      this.fadeTimer = setTimeout(() => {
        if (this.currentStatus === 'saved' || this.currentStatus === 'synced') {
          this.currentStatus = 'idle';
          this.notify();
        }
      }, 2200);
    }
  }

  /**
   * Primary entry point: Immediate local save followed by queued cloud synchronization
   */
  public async save(state: ChallengeState, userId?: string | null): Promise<void> {
    const targetUserId = userId || this.currentUserId;
    const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    // 1. Instant local persistence to localStorage (synchronous)
    saveChallengeState(state);
    this.lastSavedAt = nowStr;

    // 2. If no user is logged in, local persistence is complete
    if (!targetUserId) {
      this.setStatus('saved', '✓ Saved', true);
      return;
    }

    // 3. User is authenticated: check network connectivity
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      this.storePendingSync(targetUserId, state);
      this.isOffline = true;
      this.setStatus('offline', 'Offline — saved locally');
      return;
    }

    // 4. Online: Enqueue or run Firestore synchronization
    this.setStatus('saving', 'Saving...');
    await this.enqueueFirestoreWrite(targetUserId, state);
  }

  private async enqueueFirestoreWrite(userId: string, state: ChallengeState): Promise<void> {
    // If a write is currently in flight, replace the queued state with this latest state
    if (this.isWritingToFirestore) {
      this.queuedPayload = { userId, state };
      return;
    }

    this.isWritingToFirestore = true;

    try {
      await saveChallengeToFirestore(userId, state);
      this.clearPendingSync();
      this.setStatus('saved', '✓ Synced', true);
    } catch (error) {
      console.warn('Firestore auto-save encountered an issue, queued locally:', error);
      this.storePendingSync(userId, state);
      this.setStatus('pending_sync', 'Saved locally — waiting to sync');
    } finally {
      this.isWritingToFirestore = false;

      // If more updates were queued while writing, process the most recent one now
      if (this.queuedPayload) {
        const next = this.queuedPayload;
        this.queuedPayload = null;
        await this.enqueueFirestoreWrite(next.userId, next.state);
      }
    }
  }

  /**
   * Flush any pending changes stored in localStorage when coming back online
   */
  public async flushPendingSync(): Promise<void> {
    const pending = this.getPendingSync();
    if (!pending) return;

    if (!this.currentUserId || pending.userId !== this.currentUserId) {
      return;
    }

    this.setStatus('syncing', 'Syncing...');

    try {
      await saveChallengeToFirestore(pending.userId, pending.state);
      this.clearPendingSync();
      this.lastSavedAt = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      this.setStatus('saved', '✓ Synced', true);
    } catch (err) {
      console.warn('Failed to flush pending sync:', err);
      this.setStatus('pending_sync', 'Saved locally — waiting to sync');
    }
  }

  private storePendingSync(userId: string, state: ChallengeState): void {
    try {
      localStorage.setItem(
        PENDING_SYNC_KEY,
        JSON.stringify({
          userId,
          state,
          timestamp: Date.now(),
        })
      );
    } catch (e) {
      console.error('Failed to store pending sync in localStorage:', e);
    }
  }

  private getPendingSync(): { userId: string; state: ChallengeState; timestamp: number } | null {
    try {
      const raw = localStorage.getItem(PENDING_SYNC_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  private clearPendingSync(): void {
    try {
      localStorage.removeItem(PENDING_SYNC_KEY);
    } catch (e) {
      console.error('Failed to clear pending sync:', e);
    }
  }

  public hasPendingSync(): boolean {
    try {
      return !!localStorage.getItem(PENDING_SYNC_KEY);
    } catch {
      return false;
    }
  }

  private handleOnline = () => {
    this.isOffline = false;
    this.flushPendingSync();
  };

  private handleOffline = () => {
    this.isOffline = true;
    this.setStatus('offline', 'Offline — saved locally');
  };

  private handleBeforeUnload = () => {
    // If we have an active queued payload, ensure it is recorded in the pending sync storage
    if (this.queuedPayload) {
      this.storePendingSync(this.queuedPayload.userId, this.queuedPayload.state);
    }
  };
}

export const autoSaveManager = new AutoSaveManager();

/**
 * Intelligent conflict resolution: Merges remote state into local state by timestamp.
 * Protects local un-synced edits from being overwritten by stale remote snapshots.
 */
export function resolveStateConflict(
  localState: ChallengeState | null,
  remoteState: ChallengeState
): { mergedState: ChallengeState; hasLocalModifications: boolean } {
  if (!localState) {
    return { mergedState: remoteState, hasLocalModifications: false };
  }

  let hasLocalModifications = false;
  const mergedDays: Record<number, DayRecord> = { ...remoteState.days };

  for (let i = 1; i <= 90; i++) {
    const localDay = localState.days?.[i];
    const remoteDay = remoteState.days?.[i];

    if (!remoteDay && localDay) {
      mergedDays[i] = localDay;
      hasLocalModifications = true;
      continue;
    }

    if (localDay && remoteDay) {
      const localTime = new Date(localDay.updatedAt || 0).getTime();
      const remoteTime = new Date(remoteDay.updatedAt || 0).getTime();

      if (localTime > remoteTime) {
        // Local day has newer changes; preserve local
        mergedDays[i] = localDay;
        hasLocalModifications = true;
      } else {
        // Merge habits by checking timestamps if present
        const mergedHabits = { ...remoteDay.habits };
        const mergedHabitTimestamps = { ...(remoteDay.habitTimestamps || {}) };

        if (localDay.habitTimestamps) {
          Object.keys(localDay.habitTimestamps).forEach((habitId) => {
            const lTime = new Date(localDay.habitTimestamps![habitId] || 0).getTime();
            const rTime = new Date(remoteDay.habitTimestamps?.[habitId] || 0).getTime();
            if (lTime > rTime) {
              mergedHabits[habitId] = localDay.habits[habitId] ?? false;
              mergedHabitTimestamps[habitId] = localDay.habitTimestamps![habitId];
              hasLocalModifications = true;
            }
          });
        }

        mergedDays[i] = {
          ...remoteDay,
          habits: mergedHabits,
          habitTimestamps: mergedHabitTimestamps,
        };
      }
    }
  }

  // Hydration conflict merge
  const mergedHydration = { ...(remoteState.hydration || {}) };
  if (localState.hydration) {
    Object.keys(localState.hydration).forEach((dateKey) => {
      const localH = localState.hydration[dateKey];
      const remoteH = remoteState.hydration?.[dateKey];
      if (!remoteH || (localH && localH.totalMl > remoteH.totalMl)) {
        mergedHydration[dateKey] = localH;
        hasLocalModifications = true;
      }
    });
  }

  const mergedState: ChallengeState = {
    ...remoteState,
    days: mergedDays,
    hydration: mergedHydration,
    settings: {
      ...remoteState.settings,
      soundEnabled: localState.settings?.soundEnabled ?? remoteState.settings.soundEnabled,
      theme: localState.settings?.theme ?? remoteState.settings.theme,
    },
    lastActiveDayNumber: Math.max(
      localState.lastActiveDayNumber || 1,
      remoteState.lastActiveDayNumber || 1
    ),
  };

  return { mergedState, hasLocalModifications };
}

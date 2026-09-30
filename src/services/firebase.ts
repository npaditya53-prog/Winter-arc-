import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  User,
  onAuthStateChanged,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  getDocFromServer,
  setDoc,
  onSnapshot,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { ChallengeState } from '../types/challenge';

// 1. Initialize Firebase App and Services
export const firebaseApp = initializeApp(firebaseConfig);
export const auth = getAuth(firebaseApp);
export const db = getFirestore(firebaseApp, firebaseConfig.firestoreDatabaseId);
export const googleProvider = new GoogleAuthProvider();

// Error Handling Specification compliance
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// 2. Initial connection test as mandated by skill
export async function testFirestoreConnection(): Promise<boolean> {
  const testPath = 'test/connection';
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firestore is currently running offline or connecting.');
    }
    return false;
  }
}

// 3. User Profile Sync
export async function syncUserProfile(user: User): Promise<void> {
  if (!user || !user.uid) return;
  const userRef = doc(db, 'users', user.uid);
  const path = `users/${user.uid}`;
  const now = new Date().toISOString();

  try {
    const existingSnap = await getDoc(userRef);
    if (!existingSnap.exists()) {
      await setDoc(userRef, {
        id: user.uid,
        email: user.email || '',
        displayName: user.displayName || 'Arc Athlete',
        photoURL: user.photoURL || '',
        createdAt: now,
        updatedAt: now,
      });
    } else {
      await setDoc(
        userRef,
        {
          email: user.email || '',
          displayName: user.displayName || 'Arc Athlete',
          photoURL: user.photoURL || '',
          updatedAt: now,
        },
        { merge: true }
      );
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// 4. Save Challenge State to Firestore
export async function saveChallengeToFirestore(
  userId: string,
  state: ChallengeState
): Promise<void> {
  if (!userId) return;
  const path = `users/${userId}/challenge/state`;
  const challengeRef = doc(db, 'users', userId, 'challenge', 'state');
  const now = new Date().toISOString();

  try {
    // Sanitize payload to adhere strictly to schema
    const payload = {
      userId,
      version: state.version || 2,
      settings: state.settings,
      days: state.days,
      hydration: state.hydration || {},
      hydrationNotifications: state.hydrationNotifications || {},
      lastActiveDayNumber: state.lastActiveDayNumber || 1,
      createdAt: state.createdAt || now,
      updatedAt: now,
    };

    await setDoc(challengeRef, payload, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// 5. Fetch Challenge State from Firestore
export async function getChallengeFromFirestore(
  userId: string
): Promise<ChallengeState | null> {
  if (!userId) return null;
  const path = `users/${userId}/challenge/state`;
  const challengeRef = doc(db, 'users', userId, 'challenge', 'state');

  try {
    const snapshot = await getDoc(challengeRef);
    if (!snapshot.exists()) {
      return null;
    }
    const data = snapshot.data();
    return {
      version: data.version ?? 2,
      settings: data.settings,
      days: data.days,
      hydration: data.hydration ?? {},
      hydrationNotifications: data.hydrationNotifications ?? {},
      lastActiveDayNumber: data.lastActiveDayNumber ?? 1,
      createdAt: data.createdAt ?? new Date().toISOString(),
    } as ChallengeState;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

// 6. Real-time Subscription to Challenge State
export function subscribeToChallengeState(
  userId: string,
  onUpdate: (state: ChallengeState) => void,
  onError?: (err: Error) => void
): () => void {
  if (!userId) return () => {};
  const path = `users/${userId}/challenge/state`;
  const challengeRef = doc(db, 'users', userId, 'challenge', 'state');

  const unsubscribe = onSnapshot(
    challengeRef,
    (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        const state: ChallengeState = {
          version: data.version ?? 2,
          settings: data.settings,
          days: data.days,
          hydration: data.hydration ?? {},
          hydrationNotifications: data.hydrationNotifications ?? {},
          lastActiveDayNumber: data.lastActiveDayNumber ?? 1,
          createdAt: data.createdAt ?? new Date().toISOString(),
        };
        onUpdate(state);
      }
    },
    (error) => {
      if (onError) {
        onError(error);
      }
      handleFirestoreError(error, OperationType.GET, path);
    }
  );

  return unsubscribe;
}

// 7. Auth Helpers
export async function loginWithGoogle(): Promise<User | null> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    if (result.user) {
      await syncUserProfile(result.user);
    }
    return result.user;
  } catch (error) {
    console.error('Google Sign-In failed:', error);
    throw error;
  }
}

export async function logoutFirebaseUser(): Promise<void> {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Sign-out failed:', error);
    throw error;
  }
}

// Export onAuthStateChanged wrapper
export { onAuthStateChanged };

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  type User as FirebaseUser,
} from 'firebase/auth';
import { auth } from '../lib/firebase';
import type { User } from '../types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

/** Detect if running as installed PWA (standalone mode) */
function isStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true ||
    document.referrer.includes('android-app://')
  );
}

function mapUser(firebaseUser: FirebaseUser): User {
  return {
    uid: firebaseUser.uid,
    email: firebaseUser.email || '',
    displayName: firebaseUser.displayName,
    photoURL: firebaseUser.photoURL,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser ? mapUser(firebaseUser) : null);
      setLoading(false);
    });

    // Handle return from Google redirect (PWA / mobile)
    getRedirectResult(auth)
      .then((result) => {
        if (result?.user) setUser(mapUser(result.user));
      })
      .catch(() => {})
      .finally(() => setLoading(false));

    return unsubscribe;
  }, []);

  const signIn = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const signUp = async (email: string, password: string, name: string) => {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(result.user, { displayName: name });
    setUser(mapUser(result.user));
  };

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();

    // In standalone PWA mode, popup is almost always blocked.
    // Go straight to redirect to avoid the flash-and-fail UX.
    if (isStandalone()) {
      await signInWithRedirect(auth, provider);
      return;
    }

    // On regular browser: try popup first, fallback to redirect if blocked
    try {
      await signInWithPopup(auth, provider);
    } catch (err: unknown) {
      const code = err && typeof err === 'object' && 'code' in err
        ? (err as { code: string }).code
        : '';
      if (code === 'auth/popup-blocked' || code === 'auth/cancelled-popup-request') {
        // Popup was blocked — fall back to redirect seamlessly
        await signInWithRedirect(auth, provider);
        return;
      }
      throw err; // Re-throw other errors (network, etc.)
    }
  };

  const logout = async () => {
    await signOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signInWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}

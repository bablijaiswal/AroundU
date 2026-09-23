import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
} from 'firebase/auth';
import { auth } from '../firebase/firebase';
import api from '../services/api';

const AuthContext = createContext(null);

function normalizeUser(firebaseUser) {
  if (!firebaseUser) return null;

  const displayName = firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'AroundU User';

  return {
    uid: firebaseUser.uid,
    id: firebaseUser.uid,
    displayName,
    name: displayName,
    email: firebaseUser.email,
    photoURL: firebaseUser.photoURL,
    providerId: firebaseUser.providerId,
    emailVerified: firebaseUser.emailVerified,
    firebaseUser,
  };
}

function getFriendlyAuthMessage(error) {
  const code = error?.code || '';

  switch (code) {
    case 'auth/email-already-in-use':
      return 'This email is already in use.';
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/weak-password':
      return 'Password should be at least 6 characters long.';
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Invalid email or password.';
    case 'auth/popup-closed-by-user':
      return 'Google sign-in was cancelled.';
    case 'auth/popup-blocked':
      return 'Google sign-in was blocked. Please allow pop-ups and try again.';
    case 'auth/network-request-failed':
      return 'Network error. Please check your connection and try again.';
    default:
      return 'Something went wrong. Please try again.';
  }
}

async function syncUserWithBackend(firebaseUser) {
  if (!firebaseUser) return null;

  try {
    const token = await firebaseUser.getIdToken();
    const response = await api.post('/auth/firebase-sync', {}, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return response.data?.user || normalizeUser(firebaseUser);
  } catch (error) {
    console.warn('Failed to sync Firebase user with backend.', error);
    return normalizeUser(firebaseUser);
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        setUser(null);
        setLoading(false);
        return;
      }

      try {
        const syncedUser = await syncUserWithBackend(firebaseUser);
        setUser(syncedUser);
      } catch (error) {
        setUser(normalizeUser(firebaseUser));
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const signup = async ({ name, email, password }) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(userCredential.user, { displayName: name.trim() || 'AroundU User' });
      const syncedUser = await syncUserWithBackend(userCredential.user);
      setUser(syncedUser || normalizeUser(userCredential.user));
      return syncedUser || normalizeUser(userCredential.user);
    } catch (error) {
      throw new Error(getFriendlyAuthMessage(error));
    }
  };

  const login = async ({ email, password }) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const syncedUser = await syncUserWithBackend(userCredential.user);
      setUser(syncedUser || normalizeUser(userCredential.user));
      return syncedUser || normalizeUser(userCredential.user);
    } catch (error) {
      throw new Error(getFriendlyAuthMessage(error));
    }
  };

  const googleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const syncedUser = await syncUserWithBackend(result.user);
      setUser(syncedUser || normalizeUser(result.user));
      return syncedUser || normalizeUser(result.user);
    } catch (error) {
      throw new Error(getFriendlyAuthMessage(error));
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } finally {
      setUser(null);
    }
  };

  const refreshUser = async () => {
    try {
      const response = await api.get('/auth/me');
      const nextUser = response.data?.user;
      if (!nextUser) return null;

      const mergedUser = {
        ...normalizeUser(auth.currentUser),
        ...nextUser,
        displayName: nextUser.name || normalizeUser(auth.currentUser)?.displayName || 'AroundU User',
        name: nextUser.name || normalizeUser(auth.currentUser)?.name || 'AroundU User',
        bio: nextUser.bio || '',
        city: nextUser.city || '',
        interests: nextUser.interests || [],
      };

      setUser(mergedUser);
      return mergedUser;
    } catch (error) {
      console.warn('Unable to refresh user profile from backend.', error);
      return user;
    }
  };

  const updateProfileData = async (profileData) => {
    try {
      const payload = {
        ...profileData,
        interests: Array.isArray(profileData.interests)
          ? profileData.interests
          : String(profileData.interests || '')
              .split(',')
              .map((item) => item.trim())
              .filter(Boolean),
      };

      if (auth.currentUser && payload.name && payload.name !== auth.currentUser.displayName) {
        await updateProfile(auth.currentUser, { displayName: payload.name });
      }

      const response = await api.put('/auth/profile', payload);
      const nextUser = response.data?.user;
      const mergedUser = {
        ...normalizeUser(auth.currentUser),
        ...nextUser,
        displayName: nextUser?.name || payload.name || normalizeUser(auth.currentUser)?.displayName || 'AroundU User',
        name: nextUser?.name || payload.name || normalizeUser(auth.currentUser)?.name || 'AroundU User',
        bio: nextUser?.bio || '',
        city: nextUser?.city || '',
        interests: nextUser?.interests || [],
      };

      setUser(mergedUser);
      return mergedUser;
    } catch (error) {
      console.error('Profile update failed.', error);
      throw error;
    }
  };

  const value = useMemo(() => ({
    user,
    loading,
    isAuthenticated: Boolean(user),
    signup,
    login,
    googleLogin,
    logout,
    refreshUser,
    updateProfileData,
  }), [user, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}

export default AuthContext;

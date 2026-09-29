import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User as FirebaseUser,
  onAuthStateChanged,
  signInWithPopup,
  signOut as fbSignOut,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  getDocs,
  query,
  where,
  writeBatch
} from 'firebase/firestore';
import { auth, db, googleProvider, handleFirestoreError, OperationType } from '../firebase';
import { UserProfile } from '../types';
import { DEFAULT_ACCOUNTS, DEFAULT_CATEGORIES, getInitialBudgets } from '../utils/defaults';

interface AuthContextType {
  currentUser: FirebaseUser | null;
  userProfile: UserProfile | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;
  deleteAccountData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Initialize or fetch user document & always ensure starter data exists
  const initUserAndData = async (user: FirebaseUser) => {
    try {
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        setUserProfile(userSnap.data() as UserProfile);
      } else {
        const newProfile: UserProfile = {
          id: user.uid,
          email: user.email || '',
          name: user.displayName || 'ผู้ใช้งาน Oatmeal',
          avatar: user.photoURL || '',
          currency: 'THB',
          theme: 'light',
          notificationsEnabled: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        await setDoc(userRef, newProfile);
        setUserProfile(newProfile);
      }

      // Always ensure default categories exist for this user
      const catQuery = query(collection(db, 'categories'), where('userId', '==', user.uid));
      const catSnap = await getDocs(catQuery);
      if (catSnap.empty) {
        const batch = writeBatch(db);
        DEFAULT_CATEGORIES.forEach((cat) => {
          const catRef = doc(db, 'categories', `${cat.id}-${user.uid}`);
          batch.set(catRef, {
            ...cat,
            id: `${cat.id}-${user.uid}`,
            userId: user.uid,
            isCustom: false,
            createdAt: new Date().toISOString(),
          });
        });
        await batch.commit();
      }

      // Always ensure default accounts exist for this user
      const accQuery = query(collection(db, 'accounts'), where('userId', '==', user.uid));
      const accSnap = await getDocs(accQuery);
      if (accSnap.empty) {
        const batch = writeBatch(db);
        DEFAULT_ACCOUNTS.forEach((acc) => {
          const accRef = doc(db, 'accounts', `${acc.id}-${user.uid}`);
          batch.set(accRef, {
            ...acc,
            id: `${acc.id}-${user.uid}`,
            userId: user.uid,
            createdAt: new Date().toISOString(),
          });
        });
        await batch.commit();
      }

      // Always ensure default budgets exist
      const now = new Date();
      const budQuery = query(collection(db, 'budgets'), where('userId', '==', user.uid));
      const budSnap = await getDocs(budQuery);
      if (budSnap.empty) {
        const batch = writeBatch(db);
        const initialBudgets = getInitialBudgets(user.uid, now.getMonth() + 1, now.getFullYear());
        initialBudgets.forEach((bud) => {
          const budRef = doc(db, 'budgets', bud.id);
          batch.set(budRef, bud);
        });
        await batch.commit();
      }
    } catch (err) {
      console.error('Error in initUserAndData:', err);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        await initUserAndData(user);
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    try {
      setLoading(true);
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error('Google Sign In Error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      await fbSignOut(auth);
      setCurrentUser(null);
      setUserProfile(null);
    } catch (error) {
      console.error('Sign Out Error:', error);
    }
  };

  const updateProfile = async (data: Partial<UserProfile>) => {
    if (!currentUser) return;
    try {
      const userRef = doc(db, 'users', currentUser.uid);
      const updated = {
        ...data,
        updatedAt: new Date().toISOString(),
      };
      await updateDoc(userRef, updated);
      setUserProfile((prev) => (prev ? { ...prev, ...updated } : null));
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${currentUser.uid}`);
    }
  };

  const deleteAccountData = async () => {
    if (!currentUser) return;
    try {
      const uid = currentUser.uid;
      const collectionsToClean = ['transactions', 'categories', 'accounts', 'budgets', 'notifications'];
      
      for (const colName of collectionsToClean) {
        const q = query(collection(db, colName), where('userId', '==', uid));
        const snap = await getDocs(q);
        const batch = writeBatch(db);
        snap.docs.forEach((d) => batch.delete(d.ref));
        await batch.commit();
      }

      await deleteDoc(doc(db, 'users', uid));
      await fbSignOut(auth);
      setCurrentUser(null);
      setUserProfile(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `users/${currentUser?.uid}`);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        userProfile,
        loading,
        signInWithGoogle,
        signOut,
        updateProfile,
        deleteAccountData,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

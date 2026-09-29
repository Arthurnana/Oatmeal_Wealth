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

  // Initialize or fetch user document & default starter data
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

        // Seed initial categories
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

        // Seed initial accounts
        DEFAULT_ACCOUNTS.forEach((acc) => {
          const accRef = doc(db, 'accounts', `${acc.id}-${user.uid}`);
          batch.set(accRef, {
            ...acc,
            id: `${acc.id}-${user.uid}`,
            userId: user.uid,
            createdAt: new Date().toISOString(),
          });
        });

        // Seed initial budgets for current month
        const now = new Date();
        const initialBudgets = getInitialBudgets(user.uid, now.getMonth() + 1, now.getFullYear());
        initialBudgets.forEach((bud) => {
          const budRef = doc(db, 'budgets', bud.id);
          batch.set(budRef, bud);
        });

        // Seed sample starting transactions so the user instantly sees a live, beautiful dashboard matching design
        const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
        const sampleTx = [
          {
            id: `tx-init-1-${user.uid}`,
            userId: user.uid,
            type: 'income' as const,
            amount: 35000,
            categoryId: `cat-salary-${user.uid}`,
            accountId: `acc-checking-${user.uid}`,
            date: todayStr,
            description: 'เงินเดือนประจำ (Tech Studio Payroll)',
            note: 'โอนเข้าบัญชีออมทรัพย์หลักเรียบร้อย',
            createdAt: new Date().toISOString(),
          },
          {
            id: `tx-init-2-${user.uid}`,
            userId: user.uid,
            type: 'expense' as const,
            amount: 1450,
            categoryId: `cat-housing-${user.uid}`,
            accountId: `acc-checking-${user.uid}`,
            date: todayStr,
            description: 'ค่าบริการส่วนกลางและที่พัก (Monthly Rent)',
            note: 'รอบบิลประจำเดือน',
            createdAt: new Date().toISOString(),
          },
          {
            id: `tx-init-3-${user.uid}`,
            userId: user.uid,
            type: 'expense' as const,
            amount: 820,
            categoryId: `cat-groceries-${user.uid}`,
            accountId: `acc-checking-${user.uid}`,
            date: todayStr,
            description: 'ซื้อของสดและของใช้ (Organic Market)',
            note: 'อาหารและของใช้ประจำสัปดาห์',
            createdAt: new Date().toISOString(),
          },
          {
            id: `tx-init-4-${user.uid}`,
            userId: user.uid,
            type: 'expense' as const,
            amount: 310,
            categoryId: `cat-transport-${user.uid}`,
            accountId: `acc-ewallet-${user.uid}`,
            date: todayStr,
            description: 'เติมเงินบัตรรถไฟฟ้า / ค่าน้ำมัน',
            note: 'การเดินทาง',
            createdAt: new Date().toISOString(),
          }
        ];

        sampleTx.forEach(tx => {
          const txRef = doc(db, 'transactions', tx.id);
          batch.set(txRef, tx);
        });

        // Welcome notification
        const notifRef = doc(db, 'notifications', `notif-welcome-${user.uid}`);
        batch.set(notifRef, {
          id: `notif-welcome-${user.uid}`,
          userId: user.uid,
          type: 'system',
          title: 'ยินดีต้อนรับสู่ Oatmeal Wealth! ✨',
          message: 'เริ่มต้นจัดการเงินของคุณอย่างสบายใจ บันทึกรายรับรายจ่าย และวางแผนงบประมาณได้ทันที',
          isRead: false,
          createdAt: new Date().toISOString(),
        });

        await batch.commit();
      }
    } catch (err) {
      console.error('Error initializing user data:', err);
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

import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  writeBatch
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { useAuth } from './AuthContext';
import {
  Transaction,
  Category,
  Account,
  Budget,
  AppNotification,
} from '../types';

interface ToastInfo {
  message: string;
  type: 'success' | 'error' | 'info';
}

interface FinanceContextType {
  transactions: Transaction[];
  categories: Category[];
  accounts: Account[];
  budgets: Budget[];
  notifications: AppNotification[];
  loading: boolean;
  toast: ToastInfo | null;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  // Transactions
  addTransaction: (data: Omit<Transaction, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateTransaction: (id: string, data: Partial<Transaction>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  // Categories
  addCategory: (data: Omit<Category, 'id' | 'userId' | 'createdAt'>) => Promise<void>;
  updateCategory: (id: string, data: Partial<Category>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  // Accounts
  addAccount: (data: Omit<Account, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateAccount: (id: string, data: Partial<Account>) => Promise<void>;
  deleteAccount: (id: string) => Promise<void>;
  // Budgets
  setBudget: (categoryId: string, amount: number, month: number, year: number) => Promise<void>;
  deleteBudget: (id: string) => Promise<void>;
  // Notifications
  markNotificationRead: (id: string) => Promise<void>;
  clearAllNotifications: () => Promise<void>;
  // Reset
  resetToDefaults: () => Promise<void>;
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

export const FinanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<ToastInfo | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3500);
  };

  // Real-time synchronization
  useEffect(() => {
    if (!currentUser) {
      setTransactions([]);
      setCategories([]);
      setAccounts([]);
      setBudgets([]);
      setNotifications([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const uid = currentUser.uid;

    // 1. Transactions Listener
    const txQuery = query(collection(db, 'transactions'), where('userId', '==', uid));
    const unsubTx = onSnapshot(
      txQuery,
      (snapshot) => {
        const list: Transaction[] = [];
        snapshot.forEach((d) => list.push(d.data() as Transaction));
        // Sort descending by date
        list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setTransactions(list);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'transactions');
      }
    );

    // 2. Categories Listener
    const catQuery = query(collection(db, 'categories'), where('userId', '==', uid));
    const unsubCat = onSnapshot(
      catQuery,
      (snapshot) => {
        const list: Category[] = [];
        snapshot.forEach((d) => list.push(d.data() as Category));
        setCategories(list);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'categories');
      }
    );

    // 3. Accounts Listener
    const accQuery = query(collection(db, 'accounts'), where('userId', '==', uid));
    const unsubAcc = onSnapshot(
      accQuery,
      (snapshot) => {
        const list: Account[] = [];
        snapshot.forEach((d) => list.push(d.data() as Account));
        setAccounts(list);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'accounts');
      }
    );

    // 4. Budgets Listener
    const budQuery = query(collection(db, 'budgets'), where('userId', '==', uid));
    const unsubBud = onSnapshot(
      budQuery,
      (snapshot) => {
        const list: Budget[] = [];
        snapshot.forEach((d) => list.push(d.data() as Budget));
        setBudgets(list);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'budgets');
      }
    );

    // 5. Notifications Listener
    const notifQuery = query(collection(db, 'notifications'), where('userId', '==', uid));
    const unsubNotif = onSnapshot(
      notifQuery,
      (snapshot) => {
        const list: AppNotification[] = [];
        snapshot.forEach((d) => list.push(d.data() as AppNotification));
        list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setNotifications(list);
        setLoading(false);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'notifications');
      }
    );

    return () => {
      unsubTx();
      unsubCat();
      unsubAcc();
      unsubBud();
      unsubNotif();
    };
  }, [currentUser]);

  // Transaction Operations
  const addTransaction = async (data: Omit<Transaction, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
    if (!currentUser) return;
    try {
      const id = `tx_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      
      // Strict clean object without undefined values
      const newTx: Record<string, any> = {
        id,
        userId: currentUser.uid,
        type: data.type,
        amount: Number(data.amount),
        categoryId: data.categoryId || '',
        accountId: data.accountId,
        date: data.date,
        description: data.description,
        createdAt: new Date().toISOString(),
      };

      if (data.note && typeof data.note === 'string' && data.note.trim()) {
        newTx.note = data.note.trim();
      }
      if (data.receiptUrl && typeof data.receiptUrl === 'string' && data.receiptUrl.trim()) {
        newTx.receiptUrl = data.receiptUrl;
      }
      if (data.type === 'transfer' && data.toAccountId) {
        newTx.toAccountId = data.toAccountId;
      }

      const batch = writeBatch(db);
      const txRef = doc(db, 'transactions', id);
      batch.set(txRef, newTx);

      // Adjust Account Balances using setDoc with merge: true to avoid "No document to update"
      if (data.type === 'income') {
        const acc = accounts.find((a) => a.id === data.accountId);
        if (acc) {
          const accRef = doc(db, 'accounts', acc.id);
          batch.set(
            accRef,
            {
              userId: currentUser.uid,
              name: acc.name,
              type: acc.type,
              currentBalance: Number((acc.currentBalance + data.amount).toFixed(2)),
              updatedAt: new Date().toISOString(),
            },
            { merge: true }
          );
        }
      } else if (data.type === 'expense') {
        const acc = accounts.find((a) => a.id === data.accountId);
        if (acc) {
          const accRef = doc(db, 'accounts', acc.id);
          batch.set(
            accRef,
            {
              userId: currentUser.uid,
              name: acc.name,
              type: acc.type,
              currentBalance: Number((acc.currentBalance - data.amount).toFixed(2)),
              updatedAt: new Date().toISOString(),
            },
            { merge: true }
          );
        }
      } else if (data.type === 'transfer' && data.toAccountId) {
        const fromAcc = accounts.find((a) => a.id === data.accountId);
        const toAcc = accounts.find((a) => a.id === data.toAccountId);
        if (fromAcc) {
          const fromRef = doc(db, 'accounts', fromAcc.id);
          batch.set(
            fromRef,
            {
              userId: currentUser.uid,
              name: fromAcc.name,
              type: fromAcc.type,
              currentBalance: Number((fromAcc.currentBalance - data.amount).toFixed(2)),
              updatedAt: new Date().toISOString(),
            },
            { merge: true }
          );
        }
        if (toAcc) {
          const toRef = doc(db, 'accounts', toAcc.id);
          batch.set(
            toRef,
            {
              userId: currentUser.uid,
              name: toAcc.name,
              type: toAcc.type,
              currentBalance: Number((toAcc.currentBalance + data.amount).toFixed(2)),
              updatedAt: new Date().toISOString(),
            },
            { merge: true }
          );
        }
      }

      await batch.commit();
      showToast('บันทึกรายการเรียบร้อยแล้ว');

      // Check Budget Alerts
      if (data.type === 'expense') {
        const txDate = new Date(data.date);
        const month = txDate.getMonth() + 1;
        const year = txDate.getFullYear();
        const budget = budgets.find((b) => b.categoryId === data.categoryId && b.month === month && b.year === year);
        if (budget) {
          const currentCatExpense = transactions
            .filter((t) => {
              const d = new Date(t.date);
              return (
                t.categoryId === data.categoryId &&
                t.type === 'expense' &&
                d.getMonth() + 1 === month &&
                d.getFullYear() === year
              );
            })
            .reduce((sum, t) => sum + t.amount, 0) + data.amount;

          const categoryName = categories.find((c) => c.id === data.categoryId)?.name || 'หมวดหมู่';
          if (currentCatExpense >= budget.amount) {
            const notifId = `notif-over-${Date.now()}`;
            await setDoc(doc(db, 'notifications', notifId), {
              id: notifId,
              userId: currentUser.uid,
              type: 'budget_exceeded',
              title: `⚠️ ใช้จ่ายเกินงบ: ${categoryName}`,
              message: `คุณใช้จ่ายไป ฿${currentCatExpense.toLocaleString()} จากงบ ฿${budget.amount.toLocaleString()} ในเดือนนี้`,
              isRead: false,
              createdAt: new Date().toISOString(),
            });
          } else if (currentCatExpense >= budget.amount * 0.85) {
            const notifId = `notif-warn-${Date.now()}`;
            await setDoc(doc(db, 'notifications', notifId), {
              id: notifId,
              userId: currentUser.uid,
              type: 'budget_warning',
              title: `⚡ ใกล้ถึงงบประมาณ: ${categoryName}`,
              message: `ใช้ไปแล้ว ${Math.round((currentCatExpense / budget.amount) * 100)}% (฿${currentCatExpense.toLocaleString()} / ฿${budget.amount.toLocaleString()})`,
              isRead: false,
              createdAt: new Date().toISOString(),
            });
          }
        }
      }
    } catch (error) {
      console.error('Error adding transaction:', error);
      showToast('ไม่สามารถบันทึกรายการได้ กรุณาลองใหม่อีกครั้ง', 'error');
      handleFirestoreError(error, OperationType.CREATE, 'transactions');
    }
  };

  const updateTransaction = async (id: string, updatedData: Partial<Transaction>) => {
    if (!currentUser) return;
    try {
      const oldTx = transactions.find((t) => t.id === id);
      if (!oldTx) return;

      const cleanUpdates: Record<string, any> = {
        updatedAt: new Date().toISOString(),
      };
      for (const [k, v] of Object.entries(updatedData)) {
        if (v !== undefined) {
          cleanUpdates[k] = v;
        }
      }

      const batch = writeBatch(db);
      const txRef = doc(db, 'transactions', id);
      batch.update(txRef, cleanUpdates);

      // Recalculate account impact if amount or account changed
      const newType = updatedData.type || oldTx.type;
      const newAmount = updatedData.amount !== undefined ? updatedData.amount : oldTx.amount;
      const newAccId = updatedData.accountId || oldTx.accountId;

      // Revert old effect
      if (oldTx.type === 'income') {
        const oldAcc = accounts.find((a) => a.id === oldTx.accountId);
        if (oldAcc) {
          batch.update(doc(db, 'accounts', oldAcc.id), {
            currentBalance: Number((oldAcc.currentBalance - oldTx.amount).toFixed(2)),
          });
        }
      } else if (oldTx.type === 'expense') {
        const oldAcc = accounts.find((a) => a.id === oldTx.accountId);
        if (oldAcc) {
          batch.update(doc(db, 'accounts', oldAcc.id), {
            currentBalance: Number((oldAcc.currentBalance + oldTx.amount).toFixed(2)),
          });
        }
      }

      // Apply new effect
      if (newType === 'income') {
        const targetAcc = accounts.find((a) => a.id === newAccId);
        if (targetAcc) {
          const currentBal = newAccId === oldTx.accountId && oldTx.type === 'income'
            ? targetAcc.currentBalance - oldTx.amount
            : targetAcc.currentBalance;
          batch.update(doc(db, 'accounts', targetAcc.id), {
            currentBalance: Number((currentBal + newAmount).toFixed(2)),
          });
        }
      } else if (newType === 'expense') {
        const targetAcc = accounts.find((a) => a.id === newAccId);
        if (targetAcc) {
          const currentBal = newAccId === oldTx.accountId && oldTx.type === 'expense'
            ? targetAcc.currentBalance + oldTx.amount
            : targetAcc.currentBalance;
          batch.update(doc(db, 'accounts', targetAcc.id), {
            currentBalance: Number((currentBal - newAmount).toFixed(2)),
          });
        }
      }

      await batch.commit();
      showToast('อัปเดตรายการเรียบร้อยแล้ว');
    } catch (error) {
      console.error('Error updating transaction:', error);
      showToast('ไม่สามารถอัปเดตรายการได้', 'error');
      handleFirestoreError(error, OperationType.UPDATE, `transactions/${id}`);
    }
  };

  const deleteTransaction = async (id: string) => {
    if (!currentUser) return;
    try {
      const oldTx = transactions.find((t) => t.id === id);
      if (!oldTx) return;

      const batch = writeBatch(db);
      batch.delete(doc(db, 'transactions', id));

      // Revert account balance
      if (oldTx.type === 'income') {
        const acc = accounts.find((a) => a.id === oldTx.accountId);
        if (acc) {
          batch.update(doc(db, 'accounts', acc.id), {
            currentBalance: Number((acc.currentBalance - oldTx.amount).toFixed(2)),
          });
        }
      } else if (oldTx.type === 'expense') {
        const acc = accounts.find((a) => a.id === oldTx.accountId);
        if (acc) {
          batch.update(doc(db, 'accounts', acc.id), {
            currentBalance: Number((acc.currentBalance + oldTx.amount).toFixed(2)),
          });
        }
      }

      await batch.commit();
      showToast('ลบรายการเรียบร้อยแล้ว');
    } catch (error) {
      console.error('Error deleting transaction:', error);
      showToast('ไม่สามารถลบรายการได้', 'error');
      handleFirestoreError(error, OperationType.DELETE, `transactions/${id}`);
    }
  };

  // Category Operations
  const addCategory = async (data: Omit<Category, 'id' | 'userId' | 'createdAt'>) => {
    if (!currentUser) return;
    try {
      const id = `cat_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const newCat: Record<string, any> = {
        name: data.name,
        type: data.type,
        icon: data.icon,
        color: data.color,
        id,
        userId: currentUser.uid,
        isCustom: true,
        createdAt: new Date().toISOString(),
      };
      await setDoc(doc(db, 'categories', id), newCat);
      showToast(`เพิ่มหมวดหมู่ "${data.name}" เรียบร้อยแล้ว`);
    } catch (error) {
      console.error('Error adding category:', error);
      handleFirestoreError(error, OperationType.CREATE, 'categories');
    }
  };

  const updateCategory = async (id: string, data: Partial<Category>) => {
    if (!currentUser) return;
    try {
      const cleanData: Record<string, any> = {};
      for (const [k, v] of Object.entries(data)) {
        if (v !== undefined) cleanData[k] = v;
      }
      await updateDoc(doc(db, 'categories', id), cleanData);
      showToast('อัปเดตหมวดหมู่เรียบร้อยแล้ว');
    } catch (error) {
      console.error('Error updating category:', error);
      handleFirestoreError(error, OperationType.UPDATE, `categories/${id}`);
    }
  };

  const deleteCategory = async (id: string) => {
    if (!currentUser) return;
    try {
      await deleteDoc(doc(db, 'categories', id));
      showToast('ลบหมวดหมู่เรียบร้อยแล้ว');
    } catch (error) {
      console.error('Error deleting category:', error);
      handleFirestoreError(error, OperationType.DELETE, `categories/${id}`);
    }
  };

  // Account Operations
  const addAccount = async (data: Omit<Account, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
    if (!currentUser) return;
    try {
      const id = `acc_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const newAcc: Record<string, any> = {
        id,
        userId: currentUser.uid,
        name: data.name,
        type: data.type,
        initialBalance: Number(data.initialBalance || 0),
        currentBalance: Number(data.currentBalance || 0),
        color: data.color || '#1C463C',
        icon: data.icon || 'account_balance',
        createdAt: new Date().toISOString(),
      };
      if (data.accountNumber && data.accountNumber.trim()) {
        newAcc.accountNumber = data.accountNumber.trim();
      }
      await setDoc(doc(db, 'accounts', id), newAcc);
      showToast(`เพิ่มบัญชี "${data.name}" สำเร็จ`);
    } catch (error) {
      console.error('Error adding account:', error);
      handleFirestoreError(error, OperationType.CREATE, 'accounts');
    }
  };

  const updateAccount = async (id: string, data: Partial<Account>) => {
    if (!currentUser) return;
    try {
      const cleanData: Record<string, any> = {
        updatedAt: new Date().toISOString(),
      };
      for (const [k, v] of Object.entries(data)) {
        if (v !== undefined) cleanData[k] = v;
      }
      await updateDoc(doc(db, 'accounts', id), cleanData);
      showToast('อัปเดตข้อมูลบัญชีเรียบร้อยแล้ว');
    } catch (error) {
      console.error('Error updating account:', error);
      handleFirestoreError(error, OperationType.UPDATE, `accounts/${id}`);
    }
  };

  const deleteAccount = async (id: string) => {
    if (!currentUser) return;
    try {
      await deleteDoc(doc(db, 'accounts', id));
      showToast('ลบบัญชีเรียบร้อยแล้ว');
    } catch (error) {
      console.error('Error deleting account:', error);
      handleFirestoreError(error, OperationType.DELETE, `accounts/${id}`);
    }
  };

  // Budget Operations
  const setBudget = async (categoryId: string, amount: number, month: number, year: number) => {
    if (!currentUser) return;
    try {
      const existing = budgets.find((b) => b.categoryId === categoryId && b.month === month && b.year === year);
      if (existing) {
        await updateDoc(doc(db, 'budgets', existing.id), {
          amount: Number(amount),
          updatedAt: new Date().toISOString(),
        });
      } else {
        const id = `bud_${currentUser.uid}_${categoryId}_${month}_${year}`;
        const newBudget: Budget = {
          id,
          userId: currentUser.uid,
          categoryId,
          amount: Number(amount),
          month,
          year,
          createdAt: new Date().toISOString(),
        };
        await setDoc(doc(db, 'budgets', id), newBudget);
      }
      showToast('บันทึกงบประมาณเรียบร้อยแล้ว');
    } catch (error) {
      console.error('Error setting budget:', error);
      handleFirestoreError(error, OperationType.WRITE, 'budgets');
    }
  };

  const deleteBudget = async (id: string) => {
    if (!currentUser) return;
    try {
      await deleteDoc(doc(db, 'budgets', id));
      showToast('ลบงบประมาณเรียบร้อยแล้ว');
    } catch (error) {
      console.error('Error deleting budget:', error);
      handleFirestoreError(error, OperationType.DELETE, `budgets/${id}`);
    }
  };

  // Notification Operations
  const markNotificationRead = async (id: string) => {
    if (!currentUser) return;
    try {
      await updateDoc(doc(db, 'notifications', id), { isRead: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `notifications/${id}`);
    }
  };

  const clearAllNotifications = async () => {
    if (!currentUser) return;
    try {
      const batch = writeBatch(db);
      notifications.forEach((n) => {
        batch.delete(doc(db, 'notifications', n.id));
      });
      await batch.commit();
      showToast('ล้างการแจ้งเตือนทั้งหมดแล้ว');
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'notifications');
    }
  };

  // Reset to default categories & accounts
  const resetToDefaults = async () => {
    if (!currentUser) return;
    try {
      const batch = writeBatch(db);
      transactions.forEach((t) => batch.delete(doc(db, 'transactions', t.id)));
      budgets.forEach((b) => batch.delete(doc(db, 'budgets', b.id)));
      await batch.commit();
      showToast('รีเซ็ตข้อมูลธุรกรรมและงบประมาณเรียบร้อย');
    } catch (error) {
      console.error('Error resetting to defaults:', error);
      handleFirestoreError(error, OperationType.DELETE, 'transactions');
    }
  };

  return (
    <FinanceContext.Provider
      value={{
        transactions,
        categories,
        accounts,
        budgets,
        notifications,
        loading,
        toast,
        showToast,
        addTransaction,
        updateTransaction,
        deleteTransaction,
        addCategory,
        updateCategory,
        deleteCategory,
        addAccount,
        updateAccount,
        deleteAccount,
        setBudget,
        deleteBudget,
        markNotificationRead,
        clearAllNotifications,
        resetToDefaults,
      }}
    >
      {children}
    </FinanceContext.Provider>
  );
};

export const useFinance = () => {
  const context = useContext(FinanceContext);
  if (!context) {
    throw new Error('useFinance must be used within a FinanceProvider');
  }
  return context;
};

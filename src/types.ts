/**
 * Oatmeal Wealth - Core Type Definitions
 */

export type TransactionType = 'income' | 'expense' | 'transfer';

export interface Transaction {
  id: string;
  userId: string;
  type: TransactionType;
  amount: number;
  categoryId: string;
  accountId: string;
  toAccountId?: string;
  date: string; // YYYY-MM-DD
  description: string;
  note?: string;
  receiptUrl?: string;
  createdAt: string;
  updatedAt?: string;
}

export type CategoryType = 'income' | 'expense';

export interface Category {
  id: string;
  userId: string;
  name: string;
  type: CategoryType;
  icon: string;
  color: string;
  isCustom?: boolean;
  createdAt: string;
}

export type AccountType = 'cash' | 'bank' | 'ewallet' | 'credit' | 'other';

export interface Account {
  id: string;
  userId: string;
  name: string;
  type: AccountType;
  initialBalance: number;
  currentBalance: number;
  color: string;
  icon: string;
  accountNumber?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface Budget {
  id: string;
  userId: string;
  categoryId: string;
  amount: number;
  month: number; // 1-12
  year: number; // e.g. 2026
  createdAt: string;
  updatedAt?: string;
}

export type NotificationType = 'budget_warning' | 'budget_exceeded' | 'transaction_added' | 'monthly_summary' | 'system';

export interface AppNotification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  currency: string; // 'THB' | 'USD' | etc.
  theme: 'light' | 'dark';
  notificationsEnabled: boolean;
  dateFormat?: string;
  createdAt: string;
  updatedAt?: string;
}

export type NavigationTab = 'overview' | 'transactions' | 'budgets' | 'analytics' | 'accounts' | 'settings';

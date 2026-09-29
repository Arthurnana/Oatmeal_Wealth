import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { FinanceProvider, useFinance } from './context/FinanceContext';
import { NavigationTab, Transaction, TransactionType } from './types';
import { Sidebar } from './components/Sidebar';
import { MobileNav } from './components/MobileNav';
import { Header } from './components/Header';
import { Toast } from './components/Toast';
import { TransactionModal } from './components/TransactionModal';
import { NotificationDrawer } from './components/NotificationDrawer';
import { LoginView } from './views/LoginView';
import { OverviewView } from './views/OverviewView';
import { TransactionsView } from './views/TransactionsView';
import { AnalyticsView } from './views/AnalyticsView';
import { BudgetsView } from './views/BudgetsView';
import { AccountsView } from './views/AccountsView';
import { SettingsView } from './views/SettingsView';

const MainApp: React.FC = () => {
  const { currentUser, loading: authLoading } = useAuth();
  const { loading: financeLoading } = useFinance();

  const [currentTab, setCurrentTab] = useState<NavigationTab>('overview');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [transactionModalType, setTransactionModalType] = useState<TransactionType>('expense');
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [isNotificationDrawerOpen, setIsNotificationDrawerOpen] = useState(false);

  // Apply dark mode to document element
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  const handleOpenAddModal = (type: TransactionType = 'expense') => {
    setEditingTransaction(null);
    setTransactionModalType(type);
    setIsTransactionModalOpen(true);
  };

  const handleEditTransaction = (tx: Transaction) => {
    setEditingTransaction(tx);
    setTransactionModalType(tx.type);
    setIsTransactionModalOpen(true);
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    if (query.trim() && currentTab !== 'transactions') {
      setCurrentTab('transactions');
    }
  };

  // Loading state with soothing skeleton
  if (authLoading || (currentUser && financeLoading)) {
    return (
      <div className="min-h-screen bg-[#F8F7F4] dark:bg-[#171918] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-14 h-14 rounded-2xl bg-[#1C463C] text-white flex items-center justify-center shadow-lg animate-pulse mb-4">
          <span className="material-symbols-outlined text-[28px]">nature_people</span>
        </div>
        <h2 className="text-lg font-bold text-[#1E292A] dark:text-white">
          กำลังเตรียมความพร้อมข้อมูลการเงินของคุณ...
        </h2>
        <p className="text-xs text-[#717975] dark:text-[#A0A8A5] mt-1">
          Oatmeal Wealth • เชื่อมต่อฐานข้อมูลคลาวด์อย่างปลอดภัย
        </p>
      </div>
    );
  }

  // Not logged in: Show Google Login Screen
  if (!currentUser) {
    return <LoginView />;
  }

  return (
    <div className="min-h-screen bg-[#F8F7F4] dark:bg-[#171918] text-[#1E292A] dark:text-[#F2F1EE] flex flex-col md:flex-row font-sans selection:bg-[#BFECDD] selection:text-[#1C463C]">
      {/* Toast Feedback Banner */}
      <Toast />

      {/* Persistent Desktop Sidebar (280px) */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        onOpenAddModal={() => handleOpenAddModal('expense')}
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      {/* Main Content Area */}
      <div className="flex-1 md:pl-[280px] flex flex-col min-w-0 pb-24 md:pb-12">
        {/* Top Header */}
        <Header
          searchQuery={searchQuery}
          onSearchChange={handleSearchChange}
          onOpenAddModalWithType={handleOpenAddModal}
          onOpenNotifications={() => setIsNotificationDrawerOpen(true)}
          onOpenProfile={() => setCurrentTab('settings')}
        />

        {/* Tab Canvas Content */}
        <main className="flex-1 px-4 md:px-8">
          {currentTab === 'overview' && (
            <OverviewView
              onNavigateTab={setCurrentTab}
              onOpenAddModalWithType={handleOpenAddModal}
            />
          )}

          {currentTab === 'transactions' && (
            <TransactionsView
              onOpenAddModal={() => handleOpenAddModal('expense')}
              onEditTransaction={handleEditTransaction}
              initialSearchQuery={searchQuery}
            />
          )}

          {currentTab === 'budgets' && <BudgetsView />}

          {currentTab === 'analytics' && <AnalyticsView />}

          {currentTab === 'accounts' && (
            <AccountsView onOpenAddTransactionModal={handleOpenAddModal} />
          )}

          {currentTab === 'settings' && (
            <SettingsView theme={theme} onToggleTheme={toggleTheme} />
          )}
        </main>
      </div>

      {/* Mobile Sticky Navigation and Contextual FAB */}
      <MobileNav
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        onOpenAddModal={() => handleOpenAddModal('expense')}
      />

      {/* Transaction Modal (Add / Edit) */}
      <TransactionModal
        isOpen={isTransactionModalOpen}
        onClose={() => setIsTransactionModalOpen(false)}
        initialType={transactionModalType}
        editingTransaction={editingTransaction}
      />

      {/* Notification Drawer */}
      <NotificationDrawer
        isOpen={isNotificationDrawerOpen}
        onClose={() => setIsNotificationDrawerOpen(false)}
      />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <FinanceProvider>
        <MainApp />
      </FinanceProvider>
    </AuthProvider>
  );
}

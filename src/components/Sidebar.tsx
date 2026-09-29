import React from 'react';
import { useAuth } from '../context/AuthContext';
import { NavigationTab } from '../types';

interface SidebarProps {
  currentTab: NavigationTab;
  onSelectTab: (tab: NavigationTab) => void;
  onOpenAddModal: () => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  onOpenAddModal,
  theme,
  onToggleTheme,
}) => {
  const { userProfile, signOut } = useAuth();

  const navItems: { id: NavigationTab; label: string; icon: string }[] = [
    { id: 'overview', label: 'หน้าหลัก (Overview)', icon: 'dashboard' },
    { id: 'transactions', label: 'รายการธุรกรรม (Transactions)', icon: 'receipt_long' },
    { id: 'budgets', label: 'งบประมาณ (Budgets)', icon: 'savings' },
    { id: 'analytics', label: 'วิเคราะห์การเงิน (Analytics)', icon: 'bar_chart' },
    { id: 'accounts', label: 'กระเป๋าเงิน/บัญชี (Accounts)', icon: 'account_balance_wallet' },
    { id: 'settings', label: 'ตั้งค่า (Settings)', icon: 'settings' },
  ];

  return (
    <aside className="fixed top-0 left-0 h-screen w-[280px] hidden md:flex flex-col bg-white dark:bg-[#1A1C1A] border-r border-[#E3E1DC]/80 dark:border-white/10 shadow-xs z-30 justify-between p-6 shrink-0">
      <div className="flex flex-col gap-6">
        {/* Header Brand */}
        <div className="flex items-center gap-3 px-1">
          <div className="w-10 h-10 rounded-xl bg-[#1C463C] flex items-center justify-center text-white shadow-sm">
            <span className="material-symbols-outlined text-[22px]">nature_people</span>
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-bold text-[#1C463C] dark:text-[#BFECDD] tracking-tight">
              Oatmeal Wealth
            </span>
            <span className="text-xs text-[#717975] dark:text-[#A0A8A5]">
              Personal Vault
            </span>
          </div>
        </div>

        {/* User Profile Card Pill */}
        <div
          onClick={() => onSelectTab('settings')}
          className="p-3 bg-[#F4F3F0] dark:bg-white/5 rounded-xl flex items-center gap-3 border border-[#E3E1DC]/60 dark:border-white/5 hover:border-[#2B7A78] cursor-pointer transition-colors"
        >
          {userProfile?.avatar ? (
            <img
              src={userProfile.avatar}
              alt={userProfile.name}
              className="w-10 h-10 rounded-full object-cover ring-2 ring-[#1C463C]/10"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-[#1C463C] text-white flex items-center justify-center font-bold text-sm">
              {userProfile?.name?.charAt(0) || 'U'}
            </div>
          )}
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-semibold text-[#1E292A] dark:text-white truncate">
              {userProfile?.name || 'ผู้ใช้งาน'}
            </span>
            <span className="text-[11px] text-[#717975] dark:text-[#A0A8A5] truncate">
              {userProfile?.email || 'Google Account'}
            </span>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex flex-col gap-1.5">
          {navItems.map((item) => {
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all active:scale-[0.98] ${
                  isActive
                    ? 'bg-[#F4F3F0] dark:bg-white/10 text-[#1C463C] dark:text-[#BFECDD] shadow-xs'
                    : 'text-[#414845] dark:text-[#A0A8A5] hover:bg-[#F8F7F4] dark:hover:bg-white/5 hover:text-[#1E292A] dark:hover:text-white'
                }`}
              >
                <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Primary Action CTA */}
        <button
          onClick={onOpenAddModal}
          className="w-full mt-2 py-3 px-4 bg-[#1C463C] hover:bg-[#355E53] text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 shadow-sm active:scale-[0.98] transition-all"
        >
          <span className="material-symbols-outlined text-[20px]">add</span>
          <span>+ เพิ่มรายการใหม่</span>
        </button>
      </div>

      {/* Footer Utility Links */}
      <div className="flex flex-col gap-1.5 pt-4 border-t border-[#E3E1DC]/60 dark:border-white/10">
        <button
          onClick={onToggleTheme}
          className="flex items-center justify-between px-3 py-2 rounded-lg text-[#5A6567] dark:text-[#A0A8A5] hover:bg-[#F4F3F0] dark:hover:bg-white/5 text-xs transition-colors"
        >
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">
              {theme === 'dark' ? 'light_mode' : 'dark_mode'}
            </span>
            <span>{theme === 'dark' ? 'โหมดสว่าง' : 'โหมดมืด'}</span>
          </div>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#E3E1DC] dark:bg-white/10 text-[#1E292A] dark:text-white uppercase font-bold">
            {theme}
          </span>
        </button>

        <button
          onClick={() => signOut()}
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-[#D97757] hover:bg-[#FFDAD6]/40 dark:hover:bg-red-950/20 text-xs font-semibold transition-colors"
        >
          <span className="material-symbols-outlined text-[18px]">logout</span>
          <span>ออกจากระบบ</span>
        </button>
      </div>
    </aside>
  );
};

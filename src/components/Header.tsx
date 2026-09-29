import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useFinance } from '../context/FinanceContext';
import { TransactionType } from '../types';

interface HeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onOpenAddModalWithType: (type: TransactionType) => void;
  onOpenNotifications: () => void;
  onOpenProfile: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  searchQuery,
  onSearchChange,
  onOpenAddModalWithType,
  onOpenNotifications,
  onOpenProfile,
}) => {
  const { userProfile } = useAuth();
  const { notifications } = useFinance();

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <header className="sticky top-0 w-full z-20 bg-[#F8F7F4]/85 dark:bg-[#1A1C1A]/85 backdrop-blur-md border-b border-[#E3E1DC]/80 dark:border-white/10">
      <div className="flex items-center justify-between px-4 md:px-8 py-3.5">
        {/* Search Bar */}
        <div className="flex items-center gap-3 flex-1 max-w-md">
          <div className="relative w-full">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#717975] text-[18px]">
              search
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="ค้นหารายการ, หมวดหมู่, หรือบัญชี..."
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-white dark:bg-white/5 border border-[#E3E1DC] dark:border-white/10 text-xs md:text-sm text-[#1E292A] dark:text-white placeholder:text-[#717975] focus:border-[#2B7A78] focus:ring-2 focus:ring-[#2B7A78]/15 outline-none transition-all shadow-2xs"
            />
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 md:gap-3">
          {/* Quick Money Actions (Desktop) */}
          <div className="hidden sm:flex items-center gap-2">
            <button
              onClick={() => onOpenAddModalWithType('income')}
              className="px-3.5 py-1.5 rounded-xl bg-white dark:bg-white/5 border border-[#E3E1DC] dark:border-white/10 text-[#047857] hover:bg-[#10B981]/10 text-xs font-semibold active:scale-[0.98] transition-all flex items-center gap-1.5 shadow-2xs"
            >
              <span className="material-symbols-outlined text-[16px]">arrow_downward</span>
              <span>+ รายรับ</span>
            </button>
            <button
              onClick={() => onOpenAddModalWithType('expense')}
              className="px-3.5 py-1.5 rounded-xl bg-white dark:bg-white/5 border border-[#E3E1DC] dark:border-white/10 text-[#D97757] hover:bg-[#D97757]/10 text-xs font-semibold active:scale-[0.98] transition-all flex items-center gap-1.5 shadow-2xs"
            >
              <span className="material-symbols-outlined text-[16px]">arrow_upward</span>
              <span>- รายจ่าย</span>
            </button>
          </div>

          {/* Notification Bell */}
          <button
            onClick={onOpenNotifications}
            className="w-9 h-9 rounded-xl bg-white dark:bg-white/5 border border-[#E3E1DC] dark:border-white/10 flex items-center justify-center text-[#414845] dark:text-[#A0A8A5] hover:bg-[#F4F3F0] dark:hover:bg-white/10 active:scale-[0.98] transition-colors relative shadow-2xs"
            aria-label="แจ้งเตือน"
          >
            <span className="material-symbols-outlined text-[20px]">notifications</span>
            {unreadCount > 0 && (
              <span className="w-2.5 h-2.5 rounded-full bg-[#126967] absolute top-1.5 right-1.5 ring-2 ring-white dark:ring-[#1E2120]" />
            )}
          </button>

          {/* Profile Avatar Trigger (Mobile / Quick Profile) */}
          <div
            onClick={onOpenProfile}
            className="flex items-center gap-2 cursor-pointer p-0.5 rounded-full hover:ring-2 hover:ring-[#2B7A78] transition-all"
          >
            {userProfile?.avatar ? (
              <img
                src={userProfile.avatar}
                alt={userProfile.name}
                className="w-8 h-8 rounded-full object-cover ring-1 ring-[#E3E1DC]"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-[#1C463C] text-white flex items-center justify-center text-xs font-bold">
                {userProfile?.name?.charAt(0) || 'U'}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

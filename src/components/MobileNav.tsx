import React from 'react';
import { NavigationTab } from '../types';

interface MobileNavProps {
  currentTab: NavigationTab;
  onSelectTab: (tab: NavigationTab) => void;
  onOpenAddModal: () => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({
  currentTab,
  onSelectTab,
  onOpenAddModal,
}) => {
  return (
    <>
      {/* Contextual Mobile Center FAB for Rapid Transaction Entry */}
      <button
        aria-label="เพิ่มรายการ"
        onClick={onOpenAddModal}
        className="md:hidden fixed bottom-20 right-5 z-40 w-14 h-14 rounded-full bg-[#1C463C] text-white flex items-center justify-center shadow-xl active:scale-95 transition-transform"
      >
        <span className="material-symbols-outlined text-[28px]">add</span>
      </button>

      {/* Mobile Sticky Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 w-full z-40 md:hidden bg-white/95 dark:bg-[#1E2120]/95 backdrop-blur-md border-t border-[#E3E1DC]/80 dark:border-white/10 h-16 px-2 flex justify-around items-center">
        <button
          onClick={() => onSelectTab('overview')}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-all ${
            currentTab === 'overview'
              ? 'text-[#1C463C] dark:text-[#BFECDD] font-bold'
              : 'text-[#5A6567] dark:text-[#A0A8A5]'
          }`}
        >
          <span className="material-symbols-outlined text-[22px]">dashboard</span>
          <span className="text-[11px] mt-0.5">หน้าหลัก</span>
        </button>

        <button
          onClick={() => onSelectTab('transactions')}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-all ${
            currentTab === 'transactions'
              ? 'text-[#1C463C] dark:text-[#BFECDD] font-bold'
              : 'text-[#5A6567] dark:text-[#A0A8A5]'
          }`}
        >
          <span className="material-symbols-outlined text-[22px]">receipt_long</span>
          <span className="text-[11px] mt-0.5">รายการ</span>
        </button>

        <button
          onClick={() => onSelectTab('budgets')}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-all ${
            currentTab === 'budgets'
              ? 'text-[#1C463C] dark:text-[#BFECDD] font-bold'
              : 'text-[#5A6567] dark:text-[#A0A8A5]'
          }`}
        >
          <span className="material-symbols-outlined text-[22px]">pie_chart</span>
          <span className="text-[11px] mt-0.5">งบประมาณ</span>
        </button>

        <button
          onClick={() => onSelectTab('analytics')}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-all ${
            currentTab === 'analytics'
              ? 'text-[#1C463C] dark:text-[#BFECDD] font-bold'
              : 'text-[#5A6567] dark:text-[#A0A8A5]'
          }`}
        >
          <span className="material-symbols-outlined text-[22px]">bar_chart</span>
          <span className="text-[11px] mt-0.5">วิเคราะห์</span>
        </button>

        <button
          onClick={() => onSelectTab('settings')}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-all ${
            currentTab === 'settings'
              ? 'text-[#1C463C] dark:text-[#BFECDD] font-bold'
              : 'text-[#5A6567] dark:text-[#A0A8A5]'
          }`}
        >
          <span className="material-symbols-outlined text-[22px]">settings</span>
          <span className="text-[11px] mt-0.5">ตั้งค่า</span>
        </button>
      </nav>
    </>
  );
};

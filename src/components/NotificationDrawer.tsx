import React from 'react';
import { useFinance } from '../context/FinanceContext';
import { formatDateThai } from '../utils/formatters';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({ isOpen, onClose }) => {
  const { notifications, markNotificationRead, clearAllNotifications } = useFinance();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs">
      <div className="w-full max-w-sm h-full bg-white dark:bg-[#1E2120] border-l border-[#E3E1DC] dark:border-white/10 shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
        <div className="p-4 border-b border-[#E3E1DC]/60 dark:border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#1C463C] dark:text-[#BFECDD]">
              notifications
            </span>
            <h2 className="font-bold text-[#1E292A] dark:text-white">การแจ้งเตือน</h2>
            {notifications.filter((n) => !n.isRead).length > 0 && (
              <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-[#126967] text-white">
                {notifications.filter((n) => !n.isRead).length}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-[#717975] hover:bg-[#F1EFEA] dark:hover:bg-white/10"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {notifications.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-center text-[#717975]">
              <span className="material-symbols-outlined text-4xl mb-2 opacity-50">
                notifications_off
              </span>
              <p className="text-sm">ไม่มีการแจ้งเตือนใหม่</p>
            </div>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                onClick={() => markNotificationRead(n.id)}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                  n.isRead
                    ? 'bg-[#FAF9F6] dark:bg-white/5 border-[#E3E1DC]/40 dark:border-white/5 opacity-75'
                    : 'bg-white dark:bg-[#252A28] border-[#BFECDD] dark:border-[#355E53] shadow-xs'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h4 className="text-sm font-semibold text-[#1E292A] dark:text-white flex items-center gap-1.5">
                    {!n.isRead && (
                      <span className="w-2 h-2 rounded-full bg-[#126967] shrink-0" />
                    )}
                    {n.title}
                  </h4>
                  <span className="text-[11px] text-[#717975] shrink-0">
                    {formatDateThai(n.createdAt.split('T')[0], false)}
                  </span>
                </div>
                <p className="text-xs text-[#5A6567] dark:text-[#A0A8A5] leading-relaxed">
                  {n.message}
                </p>
              </div>
            ))
          )}
        </div>

        {notifications.length > 0 && (
          <div className="p-4 border-t border-[#E3E1DC]/60 dark:border-white/10 bg-[#FAF9F6] dark:bg-white/5">
            <button
              onClick={clearAllNotifications}
              className="w-full py-2 rounded-xl text-xs font-semibold text-[#71280E] hover:bg-[#FFDAD6]/40 dark:hover:bg-red-950/30 transition-colors flex items-center justify-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[16px]">clear_all</span>
              <span>ล้างการแจ้งเตือนทั้งหมด</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

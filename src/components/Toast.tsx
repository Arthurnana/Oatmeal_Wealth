import React from 'react';
import { useFinance } from '../context/FinanceContext';

export const Toast: React.FC = () => {
  const { toast } = useFinance();

  if (!toast) return null;

  const bgStyles = {
    success: 'bg-[#1C463C] text-white border-[#355E53]',
    error: 'bg-[#71280E] text-white border-[#D97757]',
    info: 'bg-[#126967] text-white border-[#2B7A78]',
  }[toast.type];

  const iconName = {
    success: 'check_circle',
    error: 'error',
    info: 'info',
  }[toast.type];

  return (
    <div className="fixed top-5 right-5 z-[100] max-w-sm animate-in fade-in slide-in-from-top-4 duration-200">
      <div className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border ${bgStyles}`}>
        <span className="material-symbols-outlined text-[20px]">{iconName}</span>
        <span className="text-sm font-medium">{toast.message}</span>
      </div>
    </div>
  );
};

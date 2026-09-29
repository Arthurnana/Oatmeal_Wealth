import React, { useState, useEffect } from 'react';
import { useFinance } from '../context/FinanceContext';
import { Account, AccountType } from '../types';

interface AccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingAccount?: Account | null;
}

const ACCOUNT_TYPES: { type: AccountType; label: string; icon: string }[] = [
  { type: 'cash', label: 'เงินสด (Cash)', icon: 'payments' },
  { type: 'bank', label: 'บัญชีธนาคาร (Bank)', icon: 'account_balance' },
  { type: 'ewallet', label: 'e-Wallet / พร้อมเพย์', icon: 'account_balance_wallet' },
  { type: 'credit', label: 'บัตรเครดิต (Credit Card)', icon: 'credit_card' },
  { type: 'other', label: 'อื่น ๆ / กองทุน (Vault)', icon: 'savings' },
];

export const AccountModal: React.FC<AccountModalProps> = ({
  isOpen,
  onClose,
  editingAccount = null,
}) => {
  const { addAccount, updateAccount } = useFinance();

  const [name, setName] = useState('');
  const [type, setType] = useState<AccountType>('bank');
  const [initialBalance, setInitialBalance] = useState('');
  const [currentBalance, setCurrentBalance] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [color, setColor] = useState('#1C463C');
  const [icon, setIcon] = useState('account_balance');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (editingAccount) {
      setName(editingAccount.name);
      setType(editingAccount.type);
      setInitialBalance(String(editingAccount.initialBalance));
      setCurrentBalance(String(editingAccount.currentBalance));
      setAccountNumber(editingAccount.accountNumber || '');
      setColor(editingAccount.color);
      setIcon(editingAccount.icon);
    } else {
      setName('');
      setType('bank');
      setInitialBalance('0');
      setCurrentBalance('0');
      setAccountNumber('');
      setColor('#1C463C');
      setIcon('account_balance');
    }
    setError('');
  }, [editingAccount, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('กรุณาระบุชื่อบัญชีหรือกระเป๋าเงิน');
      return;
    }

    const initBal = parseFloat(initialBalance) || 0;
    const curBal = editingAccount ? (parseFloat(currentBalance) || 0) : initBal;

    try {
      setSubmitting(true);
      if (editingAccount) {
        await updateAccount(editingAccount.id, {
          name: name.trim(),
          type,
          currentBalance: curBal,
          accountNumber: accountNumber.trim() || undefined,
          color,
          icon,
        });
      } else {
        await addAccount({
          name: name.trim(),
          type,
          initialBalance: initBal,
          currentBalance: curBal,
          accountNumber: accountNumber.trim() || undefined,
          color,
          icon,
        });
      }
      onClose();
    } catch {
      setError('เกิดข้อผิดพลาดในการบันทึกข้อมูลบัญชี');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div className="w-full max-w-md bg-white dark:bg-[#1E2120] rounded-2xl border border-[#E3E1DC] dark:border-white/10 shadow-2xl p-6 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-3 border-b border-[#E3E1DC]/60 dark:border-white/10">
          <h2 className="text-lg font-bold text-[#1E292A] dark:text-white">
            {editingAccount ? 'แก้ไขบัญชี/กระเป๋าเงิน' : 'เพิ่มบัญชีใหม่'}
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-[#717975] hover:bg-[#F1EFEA] dark:hover:bg-white/10 transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {error && (
          <div className="mt-3 p-2.5 rounded-lg bg-[#FFDAD6] text-[#93000A] text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#5A6567] dark:text-[#A0A8A5] uppercase tracking-wider mb-1.5">
              ประเภทบัญชี
            </label>
            <div className="grid grid-cols-2 gap-2">
              {ACCOUNT_TYPES.map((t) => (
                <button
                  key={t.type}
                  type="button"
                  onClick={() => {
                    setType(t.type);
                    setIcon(t.icon);
                  }}
                  className={`py-2 px-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 border transition-all ${
                    type === t.type
                      ? 'bg-[#1C463C] text-white border-[#1C463C] shadow-xs'
                      : 'bg-[#FAF9F6] dark:bg-white/5 border-[#E3E1DC] dark:border-white/10 text-[#5A6567] dark:text-[#A0A8A5] hover:border-[#2B7A78]'
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">{t.icon}</span>
                  <span className="truncate">{t.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#5A6567] dark:text-[#A0A8A5] uppercase tracking-wider mb-1.5">
              ชื่อบัญชี
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="เช่น บัญชีเงินเดือน กสิกรไทย, กระเป๋าเงินสด"
              className="w-full px-3.5 py-2.5 bg-[#FAF9F6] dark:bg-white/5 border border-[#E3E1DC] dark:border-white/10 rounded-xl text-sm text-[#1E292A] dark:text-white focus:outline-none focus:border-[#2B7A78]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#5A6567] dark:text-[#A0A8A5] uppercase tracking-wider mb-1.5">
                {editingAccount ? 'ยอดเงินปัจจุบัน' : 'ยอดเงินเริ่มต้น (บาท)'}
              </label>
              <input
                type="number"
                step="any"
                required
                value={editingAccount ? currentBalance : initialBalance}
                onChange={(e) =>
                  editingAccount
                    ? setCurrentBalance(e.target.value)
                    : setInitialBalance(e.target.value)
                }
                placeholder="0.00"
                className="w-full px-3.5 py-2.5 bg-[#FAF9F6] dark:bg-white/5 border border-[#E3E1DC] dark:border-white/10 rounded-xl text-sm font-semibold text-[#1E292A] dark:text-white focus:outline-none focus:border-[#2B7A78] tabular-nums"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#5A6567] dark:text-[#A0A8A5] uppercase tracking-wider mb-1.5">
                เลขที่บัญชี / หมายเหตุย่อ
              </label>
              <input
                type="text"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                placeholder="เช่น ••4902 หรือ บัญชีหลัก"
                className="w-full px-3.5 py-2.5 bg-[#FAF9F6] dark:bg-white/5 border border-[#E3E1DC] dark:border-white/10 rounded-xl text-sm text-[#1E292A] dark:text-white focus:outline-none focus:border-[#2B7A78]"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E3E1DC]/60 dark:border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm text-[#5A6567] hover:bg-[#F1EFEA] dark:text-[#A0A8A5] dark:hover:bg-white/5"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 rounded-lg bg-[#1C463C] hover:bg-[#355E53] text-white text-sm font-semibold shadow-xs"
            >
              {submitting ? 'กำลังบันทึก...' : 'บันทึกบัญชี'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

import React, { useState, useMemo } from 'react';
import { useFinance } from '../context/FinanceContext';
import { Account, TransactionType } from '../types';
import { formatCurrency } from '../utils/formatters';
import { AccountModal } from '../components/AccountModal';
import { ConfirmationModal } from '../components/ConfirmationModal';

interface AccountsViewProps {
  onOpenAddTransactionModal: (type: TransactionType) => void;
}

export const AccountsView: React.FC<AccountsViewProps> = ({ onOpenAddTransactionModal }) => {
  const { accounts, transactions, deleteAccount } = useFinance();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  // Total balance summary
  const totalBalance = useMemo(() => {
    return accounts.reduce((sum, a) => sum + a.currentBalance, 0);
  }, [accounts]);

  const handleEdit = (acc: Account) => {
    setEditingAccount(acc);
    setIsModalOpen(true);
  };

  const confirmDelete = async () => {
    if (deleteTargetId) {
      await deleteAccount(deleteTargetId);
      setDeleteTargetId(null);
    }
  };

  return (
    <div className="w-full max-w-[1360px] mx-auto pt-6 flex flex-col gap-6">
      {/* Title & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1E292A] dark:text-white tracking-tight">
            บัญชีและกระเป๋าเงิน (Wallets &amp; Accounts)
          </h1>
          <p className="text-xs text-[#717975] dark:text-[#A0A8A5] mt-0.5">
            จัดการเงินสด บัญชีธนาคาร บัตรเครดิต และกระเป๋าเงินดิจิทัลในที่เดียว
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => onOpenAddTransactionModal('transfer')}
            className="px-3.5 py-2 bg-white dark:bg-white/5 border border-[#E3E1DC] dark:border-white/10 hover:bg-[#F4F3F0] dark:hover:bg-white/10 text-[#1E292A] dark:text-white rounded-xl text-xs font-semibold shadow-2xs active:scale-98 transition-all flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[16px] text-[#126967]">swap_horiz</span>
            <span>⇆ โอนเงิน</span>
          </button>
          <button
            onClick={() => {
              setEditingAccount(null);
              setIsModalOpen(true);
            }}
            className="px-4 py-2 bg-[#1C463C] hover:bg-[#355E53] text-white rounded-xl text-xs font-bold shadow-xs active:scale-98 transition-all flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[16px]">add</span>
            <span>+ เพิ่มบัญชีใหม่</span>
          </button>
        </div>
      </div>

      {/* Net Worth Hero Card */}
      <div className="bg-white dark:bg-[#1E2120] rounded-2xl border border-[#E3E1DC]/80 dark:border-white/10 p-5 md:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs uppercase font-bold text-[#717975] dark:text-[#A0A8A5] tracking-wider">
            สินทรัพย์ทางการเงินรวมทุกกระเป๋า
          </span>
          <div className="text-3xl sm:text-4xl font-extrabold text-[#1C463C] dark:text-[#BFECDD] mt-1 tabular-nums">
            {formatCurrency(totalBalance)}
          </div>
          <span className="text-xs text-[#717975] dark:text-[#A0A8A5] mt-1 block">
            ครอบคลุมทั้งหมด {accounts.length} บัญชี
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => onOpenAddTransactionModal('income')}
            className="px-4 py-2 bg-emerald-500/10 text-[#047857] hover:bg-emerald-500/20 rounded-xl text-xs font-bold transition-colors"
          >
            + ฝากเงินเข้า
          </button>
          <button
            onClick={() => onOpenAddTransactionModal('expense')}
            className="px-4 py-2 bg-[#FFDBD0]/50 text-[#71280E] hover:bg-[#FFDBD0] rounded-xl text-xs font-bold transition-colors"
          >
            - ถอนเงินออก
          </button>
        </div>
      </div>

      {/* Accounts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {accounts.map((acc) => {
          // Count transactions on this account
          const txCount = transactions.filter(
            (t) => t.accountId === acc.id || t.toAccountId === acc.id
          ).length;

          return (
            <div
              key={acc.id}
              className="bg-white dark:bg-[#1E2120] rounded-2xl border border-[#E3E1DC]/80 dark:border-white/10 p-5 shadow-xs flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-11 h-11 rounded-xl flex items-center justify-center text-white shadow-2xs"
                      style={{ backgroundColor: acc.color }}
                    >
                      <span className="material-symbols-outlined text-[22px]">
                        {acc.icon}
                      </span>
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-[#1E292A] dark:text-white">
                        {acc.name}
                      </h3>
                      <span className="text-[11px] text-[#717975] dark:text-[#A0A8A5]">
                        {acc.accountNumber || (acc.type === 'cash' ? 'เงินสด' : 'บัญชีหลัก')}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleEdit(acc)}
                      className="p-1.5 rounded-lg text-[#5A6567] hover:bg-[#F4F3F0] dark:hover:bg-white/10"
                      title="แก้ไข"
                    >
                      <span className="material-symbols-outlined text-[18px]">edit</span>
                    </button>
                    {accounts.length > 1 && (
                      <button
                        onClick={() => setDeleteTargetId(acc.id)}
                        className="p-1.5 rounded-lg text-[#D97757] hover:bg-[#FFDAD6]/40 dark:hover:bg-red-950/20"
                        title="ลบ"
                      >
                        <span className="material-symbols-outlined text-[18px]">delete</span>
                      </button>
                    )}
                  </div>
                </div>

                <div className="pt-2">
                  <span className="text-xs text-[#717975] dark:text-[#A0A8A5] block">
                    ยอดเงินคงเหลือปัจจุบัน
                  </span>
                  <div className="text-2xl font-bold text-[#1E292A] dark:text-white mt-0.5 tabular-nums">
                    {formatCurrency(acc.currentBalance)}
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-[#E3E1DC]/50 dark:border-white/10 flex items-center justify-between text-xs text-[#717975] dark:text-[#A0A8A5]">
                <span>ยอดเปิดบัญชี: {formatCurrency(acc.initialBalance)}</span>
                <span>{txCount} รายการ</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Account Modal */}
      <AccountModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        editingAccount={editingAccount}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={!!deleteTargetId}
        title="ยืนยันการลบบัญชี"
        message="คุณต้องการลบบัญชีนี้หรือไม่? รายการธุรกรรมที่เกี่ยวข้องจะไม่ถูกลบ แต่ยอดเงินในกระเป๋าจะถูกนำออก"
        confirmLabel="ลบบัญชี"
        cancelLabel="ยกเลิก"
        isDanger={true}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTargetId(null)}
      />
    </div>
  );
};

import React, { useState, useMemo } from 'react';
import { useFinance } from '../context/FinanceContext';
import { Transaction, TransactionType } from '../types';
import { formatCurrency, formatDateThai } from '../utils/formatters';
import { ConfirmationModal } from '../components/ConfirmationModal';

interface TransactionsViewProps {
  onOpenAddModal: () => void;
  onEditTransaction: (tx: Transaction) => void;
  initialSearchQuery?: string;
}

export const TransactionsView: React.FC<TransactionsViewProps> = ({
  onOpenAddModal,
  onEditTransaction,
  initialSearchQuery = '',
}) => {
  const { transactions, categories, accounts, deleteTransaction } = useFinance();

  const [search, setSearch] = useState(initialSearchQuery);
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');
  const [selectedAccountId, setSelectedAccountId] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | '7days' | 'thisMonth' | 'custom'>('thisMonth');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [sortBy, setSortBy] = useState<'date_desc' | 'date_asc' | 'amount_desc' | 'amount_asc'>('date_desc');

  // Deletion modal state
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  // Filter & Sort logic
  const filteredTransactions = useMemo(() => {
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    const currentMonth = today.getMonth() + 1;
    const currentYear = today.getFullYear();

    return transactions.filter((t) => {
      // 1. Search Query
      if (search.trim()) {
        const q = search.toLowerCase();
        const cat = categories.find((c) => c.id === t.categoryId);
        const acc = accounts.find((a) => a.id === t.accountId);
        const matchDesc = t.description.toLowerCase().includes(q);
        const matchNote = t.note?.toLowerCase().includes(q) || false;
        const matchCat = cat?.name.toLowerCase().includes(q) || false;
        const matchAcc = acc?.name.toLowerCase().includes(q) || false;
        if (!matchDesc && !matchNote && !matchCat && !matchAcc) return false;
      }

      // 2. Type Filter
      if (selectedType !== 'all' && t.type !== selectedType) return false;

      // 3. Category Filter
      if (selectedCategoryId !== 'all' && t.categoryId !== selectedCategoryId) return false;

      // 4. Account Filter
      if (selectedAccountId !== 'all' && t.accountId !== selectedAccountId && t.toAccountId !== selectedAccountId) {
        return false;
      }

      // 5. Date Filter
      if (dateFilter === 'today') {
        if (t.date !== todayStr) return false;
      } else if (dateFilter === '7days') {
        const txDate = new Date(t.date);
        const diffDays = (today.getTime() - txDate.getTime()) / (1000 * 3600 * 24);
        if (diffDays < 0 || diffDays > 7) return false;
      } else if (dateFilter === 'thisMonth') {
        const txDate = new Date(t.date);
        if (txDate.getMonth() + 1 !== currentMonth || txDate.getFullYear() !== currentYear) return false;
      } else if (dateFilter === 'custom') {
        if (customStartDate && t.date < customStartDate) return false;
        if (customEndDate && t.date > customEndDate) return false;
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'date_desc') return new Date(b.date).getTime() - new Date(a.date).getTime();
      if (sortBy === 'date_asc') return new Date(a.date).getTime() - new Date(b.date).getTime();
      if (sortBy === 'amount_desc') return b.amount - a.amount;
      if (sortBy === 'amount_asc') return a.amount - b.amount;
      return 0;
    });
  }, [
    transactions,
    search,
    selectedType,
    selectedCategoryId,
    selectedAccountId,
    dateFilter,
    customStartDate,
    customEndDate,
    sortBy,
    categories,
    accounts,
  ]);

  // Aggregate stats of filtered transactions
  const stats = useMemo(() => {
    let income = 0;
    let expense = 0;
    filteredTransactions.forEach((t) => {
      if (t.type === 'income') income += t.amount;
      if (t.type === 'expense') expense += t.amount;
    });
    return {
      count: filteredTransactions.length,
      income,
      expense,
      net: income - expense,
    };
  }, [filteredTransactions]);

  const confirmDelete = async () => {
    if (deleteTargetId) {
      await deleteTransaction(deleteTargetId);
      setDeleteTargetId(null);
    }
  };

  return (
    <div className="w-full max-w-[1360px] mx-auto pt-6 flex flex-col gap-6">
      {/* Title & Top Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1E292A] dark:text-white tracking-tight">
            รายการธุรกรรมทั้งหมด (Transactions)
          </h1>
          <p className="text-xs text-[#717975] dark:text-[#A0A8A5] mt-0.5">
            ค้นหา ตรวจสอบ และบริหารจัดการบันทึกรายรับ-รายจ่ายของคุณ
          </p>
        </div>

        <button
          onClick={onOpenAddModal}
          className="px-4 py-2.5 bg-[#1C463C] hover:bg-[#355E53] text-white rounded-xl text-xs font-bold shadow-xs active:scale-98 transition-all flex items-center gap-2 self-start sm:self-auto"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          <span>+ เพิ่มรายการ</span>
        </button>
      </div>

      {/* Filter and Search Bar Surface */}
      <div className="bg-white dark:bg-[#1E2120] rounded-2xl border border-[#E3E1DC]/80 dark:border-white/10 p-4 md:p-5 shadow-xs space-y-4">
        {/* Row 1: Search & Type Quick Filters */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          <div className="relative flex-1">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#717975] text-[18px]">
              search
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ค้นหาชื่อรายการ, หมายเหตุ, หมวดหมู่, บัญชี..."
              className="w-full pl-9 pr-8 py-2 rounded-xl bg-[#FAF9F6] dark:bg-white/5 border border-[#E3E1DC] dark:border-white/10 text-xs text-[#1E292A] dark:text-white focus:outline-none focus:border-[#2B7A78]"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#717975] hover:text-[#1E292A] dark:hover:text-white"
              >
                <span className="material-symbols-outlined text-[16px]">close</span>
              </button>
            )}
          </div>

          {/* Type Segment */}
          <div className="flex items-center gap-1 p-1 bg-[#F1EFEA] dark:bg-white/5 rounded-xl border border-[#E3E1DC]/50 dark:border-white/10 overflow-x-auto">
            {[
              { id: 'all', label: 'ทั้งหมด' },
              { id: 'income', label: 'รายรับ' },
              { id: 'expense', label: 'รายจ่าย' },
              { id: 'transfer', label: 'โอนเงิน' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedType(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  selectedType === tab.id
                    ? 'bg-white dark:bg-[#282C2A] text-[#1C463C] dark:text-[#BFECDD] shadow-xs'
                    : 'text-[#5A6567] dark:text-[#A0A8A5]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Row 2: Dropdown Selectors */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {/* Category Filter */}
          <select
            value={selectedCategoryId}
            onChange={(e) => setSelectedCategoryId(e.target.value)}
            className="w-full px-2.5 py-1.5 bg-[#FAF9F6] dark:bg-white/5 border border-[#E3E1DC] dark:border-white/10 rounded-xl text-xs text-[#1E292A] dark:text-white focus:outline-none focus:border-[#2B7A78]"
          >
            <option value="all">หมวดหมู่ทั้งหมด</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Account Filter */}
          <select
            value={selectedAccountId}
            onChange={(e) => setSelectedAccountId(e.target.value)}
            className="w-full px-2.5 py-1.5 bg-[#FAF9F6] dark:bg-white/5 border border-[#E3E1DC] dark:border-white/10 rounded-xl text-xs text-[#1E292A] dark:text-white focus:outline-none focus:border-[#2B7A78]"
          >
            <option value="all">บัญชีทั้งหมด</option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>

          {/* Date Range Preset */}
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value as any)}
            className="w-full px-2.5 py-1.5 bg-[#FAF9F6] dark:bg-white/5 border border-[#E3E1DC] dark:border-white/10 rounded-xl text-xs text-[#1E292A] dark:text-white focus:outline-none focus:border-[#2B7A78]"
          >
            <option value="thisMonth">เดือนนี้</option>
            <option value="today">วันนี้</option>
            <option value="7days">7 วันล่าสุด</option>
            <option value="all">ข้อมูลย้อนหลังทั้งหมด</option>
            <option value="custom">กำหนดช่วงวันที่เอง</option>
          </select>

          {/* Sort By */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="w-full px-2.5 py-1.5 bg-[#FAF9F6] dark:bg-white/5 border border-[#E3E1DC] dark:border-white/10 rounded-xl text-xs text-[#1E292A] dark:text-white focus:outline-none focus:border-[#2B7A78]"
          >
            <option value="date_desc">วันที่: ล่าสุดก่อน</option>
            <option value="date_asc">วันที่: เก่าสุดก่อน</option>
            <option value="amount_desc">จำนวนเงิน: มากไปน้อย</option>
            <option value="amount_asc">จำนวนเงิน: น้อยไปมาก</option>
          </select>
        </div>

        {/* Custom Date Pickers if enabled */}
        {dateFilter === 'custom' && (
          <div className="flex items-center gap-3 pt-2 border-t border-[#E3E1DC]/50 dark:border-white/10">
            <span className="text-xs text-[#717975]">ตั้งแต่วันที่:</span>
            <input
              type="date"
              value={customStartDate}
              onChange={(e) => setCustomStartDate(e.target.value)}
              className="px-2.5 py-1 rounded-lg border border-[#E3E1DC] dark:border-white/10 bg-[#FAF9F6] dark:bg-white/5 text-xs text-[#1E292A] dark:text-white"
            />
            <span className="text-xs text-[#717975]">ถึงวันที่:</span>
            <input
              type="date"
              value={customEndDate}
              onChange={(e) => setCustomEndDate(e.target.value)}
              className="px-2.5 py-1 rounded-lg border border-[#E3E1DC] dark:border-white/10 bg-[#FAF9F6] dark:bg-white/5 text-xs text-[#1E292A] dark:text-white"
            />
          </div>
        )}
      </div>

      {/* Filter Summary Mini Card */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 bg-white dark:bg-[#1E2120] rounded-xl border border-[#E3E1DC]/80 dark:border-white/10">
          <span className="text-[11px] text-[#717975] dark:text-[#A0A8A5] block">จำนวนรายการ</span>
          <span className="text-base font-bold text-[#1E292A] dark:text-white tabular-nums">
            {stats.count} รายการ
          </span>
        </div>
        <div className="p-3 bg-white dark:bg-[#1E2120] rounded-xl border border-[#E3E1DC]/80 dark:border-white/10">
          <span className="text-[11px] text-[#047857] dark:text-[#10B981] block">รายรับรวมที่เลือก</span>
          <span className="text-base font-bold text-[#047857] dark:text-[#10B981] tabular-nums">
            +{formatCurrency(stats.income)}
          </span>
        </div>
        <div className="p-3 bg-white dark:bg-[#1E2120] rounded-xl border border-[#E3E1DC]/80 dark:border-white/10">
          <span className="text-[11px] text-[#D97757] block">รายจ่ายรวมที่เลือก</span>
          <span className="text-base font-bold text-[#D97757] tabular-nums">
            -{formatCurrency(stats.expense)}
          </span>
        </div>
        <div className="p-3 bg-white dark:bg-[#1E2120] rounded-xl border border-[#E3E1DC]/80 dark:border-white/10">
          <span className="text-[11px] text-[#126967] dark:text-[#A2EDEA] block">ผลต่างสุทธิ</span>
          <span className="text-base font-bold text-[#126967] dark:text-[#A2EDEA] tabular-nums">
            {formatCurrency(stats.net)}
          </span>
        </div>
      </div>

      {/* Desktop Table & Mobile Card List */}
      <div className="bg-white dark:bg-[#1E2120] rounded-2xl border border-[#E3E1DC]/80 dark:border-white/10 shadow-xs overflow-hidden">
        {filteredTransactions.length === 0 ? (
          <div className="py-16 text-center text-xs text-[#717975]">
            <span className="material-symbols-outlined text-4xl mb-2 opacity-40">filter_list_off</span>
            <p className="text-sm font-semibold text-[#1E292A] dark:text-white">ไม่พบรายการที่ตรงกับเงื่อนไข</p>
            <p className="text-xs text-[#717975] mt-1">ลองเปลี่ยนคำค้นหาหรือตัวกรองวันที่</p>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#E3E1DC]/60 dark:border-white/10 bg-[#FAF9F6] dark:bg-white/5 text-[11px] font-bold text-[#717975] dark:text-[#A0A8A5] uppercase tracking-wider">
                    <th className="py-3 px-4">วันที่</th>
                    <th className="py-3 px-4">ประเภท</th>
                    <th className="py-3 px-4">หมวดหมู่</th>
                    <th className="py-3 px-4">รายละเอียด</th>
                    <th className="py-3 px-4">บัญชี</th>
                    <th className="py-3 px-4 text-right">จำนวนเงิน</th>
                    <th className="py-3 px-4 text-center">จัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F1EFEA] dark:divide-white/5 text-xs">
                  {filteredTransactions.map((tx) => {
                    const cat = categories.find((c) => c.id === tx.categoryId);
                    const acc = accounts.find((a) => a.id === tx.accountId);
                    const isIncome = tx.type === 'income';
                    const isTransfer = tx.type === 'transfer';

                    return (
                      <tr key={tx.id} className="hover:bg-[#FAF9F6] dark:hover:bg-white/5 transition-colors">
                        <td className="py-3 px-4 text-[#717975] dark:text-[#A0A8A5] whitespace-nowrap">
                          {formatDateThai(tx.date)}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                              isIncome
                                ? 'bg-emerald-500/10 text-[#047857]'
                                : isTransfer
                                ? 'bg-[#A2EDEA]/30 text-[#126967]'
                                : 'bg-[#FFDBD0]/40 text-[#D97757]'
                            }`}
                          >
                            {isIncome ? 'รายรับ' : isTransfer ? 'โอนเงิน' : 'รายจ่าย'}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-medium text-[#1E292A] dark:text-white">
                          <div className="flex items-center gap-1.5">
                            <span
                              className="material-symbols-outlined text-[16px]"
                              style={{ color: cat?.color || '#717975' }}
                            >
                              {cat?.icon || 'payments'}
                            </span>
                            <span>{cat?.name || (isTransfer ? 'โอนเงิน' : 'หมวดหมู่อื่น')}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 max-w-xs">
                          <div className="font-semibold text-[#1E292A] dark:text-white truncate">
                            {tx.description}
                          </div>
                          {tx.note && (
                            <div className="text-[11px] text-[#717975] dark:text-[#A0A8A5] truncate">
                              {tx.note}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4 text-[#5A6567] dark:text-[#A0A8A5] whitespace-nowrap">
                          {acc?.name || 'บัญชี'}
                        </td>
                        <td className="py-3 px-4 text-right font-bold tabular-nums whitespace-nowrap">
                          <span
                            className={
                              isIncome
                                ? 'text-[#047857] dark:text-[#10B981]'
                                : isTransfer
                                ? 'text-[#126967] dark:text-[#A2EDEA]'
                                : 'text-[#1E292A] dark:text-white'
                            }
                          >
                            {isIncome ? '+' : isTransfer ? '' : '-'}
                            {formatCurrency(tx.amount)}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => onEditTransaction(tx)}
                              className="p-1 rounded-lg text-[#5A6567] hover:bg-[#E3E1DC] dark:hover:bg-white/10"
                              title="แก้ไขรายการ"
                            >
                              <span className="material-symbols-outlined text-[18px]">edit</span>
                            </button>
                            <button
                              onClick={() => setDeleteTargetId(tx.id)}
                              className="p-1 rounded-lg text-[#D97757] hover:bg-[#FFDAD6]/40 dark:hover:bg-red-950/20"
                              title="ลบรายการ"
                            >
                              <span className="material-symbols-outlined text-[18px]">delete</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards View */}
            <div className="block md:hidden divide-y divide-[#F1EFEA] dark:divide-white/5">
              {filteredTransactions.map((tx) => {
                const cat = categories.find((c) => c.id === tx.categoryId);
                const acc = accounts.find((a) => a.id === tx.accountId);
                const isIncome = tx.type === 'income';
                const isTransfer = tx.type === 'transfer';

                return (
                  <div key={tx.id} className="p-4 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                            isIncome
                              ? 'bg-emerald-500/10 text-[#047857]'
                              : isTransfer
                              ? 'bg-[#A2EDEA]/30 text-[#126967]'
                              : 'bg-[#FFDBD0]/40 text-[#D97757]'
                          }`}
                        >
                          <span className="material-symbols-outlined text-[18px]">
                            {cat?.icon || 'payments'}
                          </span>
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-[#1E292A] dark:text-white">
                            {tx.description}
                          </h4>
                          <span className="text-[11px] text-[#717975] dark:text-[#A0A8A5]">
                            {cat?.name || 'หมวดหมู่'} • {acc?.name || 'บัญชี'}
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        <div
                          className={`text-sm font-bold tabular-nums ${
                            isIncome
                              ? 'text-[#047857]'
                              : isTransfer
                              ? 'text-[#126967]'
                              : 'text-[#1E292A] dark:text-white'
                          }`}
                        >
                          {isIncome ? '+' : isTransfer ? '' : '-'}
                          {formatCurrency(tx.amount)}
                        </div>
                        <span className="text-[10px] text-[#717975]">
                          {formatDateThai(tx.date)}
                        </span>
                      </div>
                    </div>

                    {tx.note && (
                      <p className="text-xs text-[#5A6567] dark:text-[#A0A8A5] bg-[#FAF9F6] dark:bg-white/5 p-2 rounded-lg">
                        {tx.note}
                      </p>
                    )}

                    <div className="flex items-center justify-end gap-2 pt-1">
                      <button
                        onClick={() => onEditTransaction(tx)}
                        className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-[#F4F3F0] dark:bg-white/5 text-[#5A6567] dark:text-[#A0A8A5]"
                      >
                        แก้ไข
                      </button>
                      <button
                        onClick={() => setDeleteTargetId(tx.id)}
                        className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-[#FFDAD6]/40 text-[#D97757]"
                      >
                        ลบ
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={!!deleteTargetId}
        title="ยืนยันการลบรายการ"
        message="คุณแน่ใจหรือไม่ว่าต้องการลบรายการนี้? ยอดเงินในบัญชีของคุณจะถูกปรับเปลี่ยนคืนโดยอัตโนมัติ"
        confirmLabel="ลบรายการ"
        cancelLabel="ยกเลิก"
        isDanger={true}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTargetId(null)}
      />
    </div>
  );
};

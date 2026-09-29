import React, { useState, useMemo } from 'react';
import { useFinance } from '../context/FinanceContext';
import { Budget } from '../types';
import { formatCurrency, THAI_MONTHS } from '../utils/formatters';
import { BudgetModal } from '../components/BudgetModal';
import { ConfirmationModal } from '../components/ConfirmationModal';

export const BudgetsView: React.FC = () => {
  const { budgets, categories, transactions, deleteBudget } = useFinance();

  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState<number>(now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(now.getFullYear());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  // Filter budgets for selected month and year
  const activeBudgets = useMemo(() => {
    return budgets.filter((b) => b.month === selectedMonth && b.year === selectedYear);
  }, [budgets, selectedMonth, selectedYear]);

  // Current month transactions for comparison
  const monthTransactions = useMemo(() => {
    return transactions.filter((t) => {
      const d = new Date(t.date);
      return d.getMonth() + 1 === selectedMonth && d.getFullYear() === selectedYear;
    });
  }, [transactions, selectedMonth, selectedYear]);

  // Aggregate budget stats
  const budgetSummary = useMemo(() => {
    let totalBudget = 0;
    let totalSpent = 0;

    activeBudgets.forEach((b) => {
      totalBudget += b.amount;
      const spent = monthTransactions
        .filter((t) => t.categoryId === b.categoryId && t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);
      totalSpent += spent;
    });

    const percent = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0;
    const remaining = totalBudget - totalSpent;

    return {
      totalBudget,
      totalSpent,
      percent,
      remaining,
      isOver: remaining < 0,
    };
  }, [activeBudgets, monthTransactions]);

  const handleEdit = (b: Budget) => {
    setEditingBudget(b);
    setIsModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (deleteTargetId) {
      await deleteBudget(deleteTargetId);
      setDeleteTargetId(null);
    }
  };

  return (
    <div className="w-full max-w-[1360px] mx-auto pt-6 flex flex-col gap-6">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1E292A] dark:text-white tracking-tight">
            งบประมาณรายเดือน (Monthly Budgets)
          </h1>
          <p className="text-xs text-[#717975] dark:text-[#A0A8A5] mt-0.5">
            กำหนดเพดานค่าใช้จ่าย ติดตามอัตราการใช้เงิน และป้องกันการใช้จ่ายเกินตัว
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {/* Month Picker */}
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
            className="px-3 py-2 bg-white dark:bg-white/5 border border-[#E3E1DC] dark:border-white/10 rounded-xl text-xs font-semibold text-[#1E292A] dark:text-white focus:outline-none focus:border-[#2B7A78]"
          >
            {THAI_MONTHS.map((m, idx) => (
              <option key={m} value={idx + 1}>
                {m}
              </option>
            ))}
          </select>

          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="px-3 py-2 bg-white dark:bg-white/5 border border-[#E3E1DC] dark:border-white/10 rounded-xl text-xs font-semibold text-[#1E292A] dark:text-white focus:outline-none focus:border-[#2B7A78]"
          >
            {[2025, 2026, 2027, 2028].map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>

          <button
            onClick={() => {
              setEditingBudget(null);
              setIsModalOpen(true);
            }}
            className="px-4 py-2 bg-[#1C463C] hover:bg-[#355E53] text-white rounded-xl text-xs font-bold shadow-xs active:scale-98 transition-all flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[16px]">add</span>
            <span>+ ตั้งงบใหม่</span>
          </button>
        </div>
      </div>

      {/* Summary Card */}
      <div className="bg-white dark:bg-[#1E2120] rounded-2xl border border-[#E3E1DC]/80 dark:border-white/10 p-5 md:p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E3E1DC]/50 dark:border-white/10">
          <div>
            <span className="text-xs uppercase font-bold text-[#717975] dark:text-[#A0A8A5] tracking-wider">
              ภาพรวมงบประมาณประจำเดือน {THAI_MONTHS[selectedMonth - 1]} {selectedYear}
            </span>
            <div className="text-2xl sm:text-3xl font-extrabold text-[#1E292A] dark:text-white mt-1 tabular-nums">
              {formatCurrency(budgetSummary.totalSpent)}{' '}
              <span className="text-sm font-normal text-[#717975] dark:text-[#A0A8A5]">
                / {formatCurrency(budgetSummary.totalBudget)}
              </span>
            </div>
          </div>

          <div className="text-left sm:text-right">
            <span className="text-xs text-[#717975] dark:text-[#A0A8A5] block">
              {budgetSummary.isOver ? 'ใช้จ่ายเกินงบรวมไปแล้ว' : 'งบประมาณคงเหลือที่ใช้ได้'}
            </span>
            <span
              className={`text-xl font-bold tabular-nums ${
                budgetSummary.isOver ? 'text-[#D97757]' : 'text-[#047857] dark:text-[#10B981]'
              }`}
            >
              {formatCurrency(Math.abs(budgetSummary.remaining))}
            </span>
          </div>
        </div>

        {/* Global Progress Bar */}
        <div className="mt-4">
          <div className="flex items-center justify-between text-xs mb-1.5 font-semibold">
            <span className="text-[#5A6567] dark:text-[#A0A8A5]">อัตราการใช้งบรวม</span>
            <span
              className={
                budgetSummary.percent >= 100
                  ? 'text-[#D97757]'
                  : budgetSummary.percent >= 80
                  ? 'text-amber-500'
                  : 'text-[#126967] dark:text-[#A2EDEA]'
              }
            >
              {budgetSummary.percent}%
            </span>
          </div>
          <div className="w-full bg-[#F1EFEA] dark:bg-white/10 rounded-full h-3 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                budgetSummary.percent >= 100
                  ? 'bg-[#D97757]'
                  : budgetSummary.percent >= 80
                  ? 'bg-amber-500'
                  : 'bg-[#126967]'
              }`}
              style={{ width: `${Math.min(100, budgetSummary.percent)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Categories Budgets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {activeBudgets.length === 0 ? (
          <div className="col-span-full py-16 text-center text-xs text-[#717975] bg-white dark:bg-[#1E2120] rounded-2xl border border-[#E3E1DC]/80 dark:border-white/10">
            <span className="material-symbols-outlined text-4xl mb-2 opacity-40">savings</span>
            <p className="text-sm font-bold text-[#1E292A] dark:text-white">
              ยังไม่มีการตั้งงบประมาณสำหรับเดือนนี้
            </p>
            <p className="text-xs text-[#717975] mt-1">
              กดปุ่มด้านล่างเพื่อเริ่มวางแผนการใช้จ่าย
            </p>
            <button
              onClick={() => {
                setEditingBudget(null);
                setIsModalOpen(true);
              }}
              className="mt-4 px-4 py-2 bg-[#1C463C] text-white rounded-xl text-xs font-semibold shadow-xs"
            >
              + ตั้งงบประมาณแรก
            </button>
          </div>
        ) : (
          activeBudgets.map((b) => {
            const cat = categories.find((c) => c.id === b.categoryId);
            const spent = monthTransactions
              .filter((t) => t.categoryId === b.categoryId && t.type === 'expense')
              .reduce((sum, t) => sum + t.amount, 0);

            const percent = b.amount > 0 ? Math.round((spent / b.amount) * 100) : 0;
            const remaining = b.amount - spent;
            const isOver = remaining < 0;
            const isNear = percent >= 80 && !isOver;

            return (
              <div
                key={b.id}
                className="bg-white dark:bg-[#1E2120] rounded-2xl border border-[#E3E1DC]/80 dark:border-white/10 p-5 shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0 shadow-2xs"
                        style={{ backgroundColor: cat?.color || '#1C463C' }}
                      >
                        <span className="material-symbols-outlined text-[20px]">
                          {cat?.icon || 'category'}
                        </span>
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-[#1E292A] dark:text-white">
                          {cat?.name || 'หมวดหมู่'}
                        </h3>
                        <span className="text-[11px] text-[#717975] dark:text-[#A0A8A5]">
                          งบ {formatCurrency(b.amount)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleEdit(b)}
                        className="p-1 rounded-lg text-[#5A6567] hover:bg-[#F4F3F0] dark:hover:bg-white/10"
                        title="แก้ไข"
                      >
                        <span className="material-symbols-outlined text-[16px]">edit</span>
                      </button>
                      <button
                        onClick={() => setDeleteTargetId(b.id)}
                        className="p-1 rounded-lg text-[#D97757] hover:bg-[#FFDAD6]/40 dark:hover:bg-red-950/20"
                        title="ลบ"
                      >
                        <span className="material-symbols-outlined text-[16px]">delete</span>
                      </button>
                    </div>
                  </div>

                  {/* Progress Row */}
                  <div className="space-y-1.5 mt-4">
                    <div className="flex justify-between items-center text-xs font-semibold">
                      <span className="text-[#5A6567] dark:text-[#A0A8A5] tabular-nums">
                        ใช้ไปแล้ว {formatCurrency(spent)}
                      </span>
                      <span
                        className={
                          isOver ? 'text-[#D97757]' : isNear ? 'text-amber-500' : 'text-[#047857]'
                        }
                      >
                        {percent}%
                      </span>
                    </div>

                    <div className="w-full bg-[#F1EFEA] dark:bg-white/10 rounded-full h-2.5 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isOver ? 'bg-[#D97757]' : isNear ? 'bg-amber-500' : 'bg-[#10B981]'
                        }`}
                        style={{ width: `${Math.min(100, percent)}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Bottom Status Callout */}
                <div className="mt-4 pt-3 border-t border-[#E3E1DC]/50 dark:border-white/10 flex items-center justify-between text-xs">
                  <span className="text-[#717975] dark:text-[#A0A8A5]">
                    {isOver ? 'เกินงบประมาณ:' : 'คงเหลือใช้ได้:'}
                  </span>
                  <span
                    className={`font-bold tabular-nums ${
                      isOver ? 'text-[#D97757]' : 'text-[#1E292A] dark:text-white'
                    }`}
                  >
                    {formatCurrency(Math.abs(remaining))}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add / Edit Budget Modal */}
      <BudgetModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        selectedMonth={selectedMonth}
        selectedYear={selectedYear}
        editingBudget={editingBudget}
      />

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={!!deleteTargetId}
        title="ยืนยันการลบงบประมาณ"
        message="คุณต้องการลบการตั้งงบประมาณสำหรับหมวดหมู่นี้หรือไม่? ข้อมูลประวัติธุรกรรมจะไม่ถูกลบ"
        confirmLabel="ลบงบประมาณ"
        cancelLabel="ยกเลิก"
        isDanger={true}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTargetId(null)}
      />
    </div>
  );
};

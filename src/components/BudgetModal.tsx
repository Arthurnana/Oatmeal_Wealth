import React, { useState, useEffect } from 'react';
import { useFinance } from '../context/FinanceContext';
import { Budget } from '../types';
import { THAI_MONTHS } from '../utils/formatters';

interface BudgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedMonth: number;
  selectedYear: number;
  editingBudget?: Budget | null;
}

export const BudgetModal: React.FC<BudgetModalProps> = ({
  isOpen,
  onClose,
  selectedMonth,
  selectedYear,
  editingBudget = null,
}) => {
  const { categories, setBudget } = useFinance();

  const [categoryId, setCategoryId] = useState('');
  const [amount, setAmount] = useState('');
  const [month, setMonth] = useState(selectedMonth);
  const [year, setYear] = useState(selectedYear);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const expenseCategories = categories.filter((c) => c.type === 'expense');

  useEffect(() => {
    if (editingBudget) {
      setCategoryId(editingBudget.categoryId);
      setAmount(String(editingBudget.amount));
      setMonth(editingBudget.month);
      setYear(editingBudget.year);
    } else {
      if (expenseCategories.length > 0) {
        setCategoryId(expenseCategories[0].id);
      }
      setAmount('');
      setMonth(selectedMonth);
      setYear(selectedYear);
    }
    setError('');
  }, [editingBudget, isOpen, selectedMonth, selectedYear, expenseCategories.length]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('กรุณาระบุจำนวนงบประมาณที่มากกว่า 0');
      return;
    }
    if (!categoryId) {
      setError('กรุณาเลือกหมวดหมู่ค่าใช้จ่าย');
      return;
    }

    try {
      setSubmitting(true);
      await setBudget(categoryId, parsedAmount, month, year);
      onClose();
    } catch {
      setError('เกิดข้อผิดพลาดในการบันทึกงบประมาณ');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div className="w-full max-w-md bg-white dark:bg-[#1E2120] rounded-2xl border border-[#E3E1DC] dark:border-white/10 shadow-2xl p-6 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-3 border-b border-[#E3E1DC]/60 dark:border-white/10">
          <h2 className="text-lg font-bold text-[#1E292A] dark:text-white">
            {editingBudget ? 'แก้ไขงบประมาณ' : 'ตั้งงบประมาณรายเดือน'}
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
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#5A6567] dark:text-[#A0A8A5] uppercase tracking-wider mb-1.5">
                เดือน
              </label>
              <select
                value={month}
                onChange={(e) => setMonth(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 bg-[#FAF9F6] dark:bg-white/5 border border-[#E3E1DC] dark:border-white/10 rounded-xl text-sm text-[#1E292A] dark:text-white focus:outline-none focus:border-[#2B7A78]"
              >
                {THAI_MONTHS.map((m, idx) => (
                  <option key={m} value={idx + 1}>
                    {m}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#5A6567] dark:text-[#A0A8A5] uppercase tracking-wider mb-1.5">
                ปี
              </label>
              <select
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 bg-[#FAF9F6] dark:bg-white/5 border border-[#E3E1DC] dark:border-white/10 rounded-xl text-sm text-[#1E292A] dark:text-white focus:outline-none focus:border-[#2B7A78]"
              >
                {[2025, 2026, 2027, 2028].map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#5A6567] dark:text-[#A0A8A5] uppercase tracking-wider mb-1.5">
              หมวดหมู่ค่าใช้จ่าย
            </label>
            <select
              value={categoryId}
              disabled={!!editingBudget}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-[#FAF9F6] dark:bg-white/5 border border-[#E3E1DC] dark:border-white/10 rounded-xl text-sm text-[#1E292A] dark:text-white focus:outline-none focus:border-[#2B7A78]"
            >
              {expenseCategories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#5A6567] dark:text-[#A0A8A5] uppercase tracking-wider mb-1.5">
              วงเงินงบประมาณ (บาท)
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-lg font-bold text-[#717975]">
                ฿
              </span>
              <input
                type="number"
                step="any"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="เช่น 5,000"
                className="w-full pl-9 pr-4 py-2.5 bg-[#FAF9F6] dark:bg-white/5 border border-[#E3E1DC] dark:border-white/10 rounded-xl text-lg font-bold text-[#1E292A] dark:text-white focus:outline-none focus:border-[#2B7A78] tabular-nums"
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
              {submitting ? 'กำลังบันทึก...' : 'บันทึกงบประมาณ'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

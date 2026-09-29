import React, { useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useFinance } from '../context/FinanceContext';
import { TransactionType, NavigationTab } from '../types';
import { formatCurrency, formatDateThai, THAI_MONTHS } from '../utils/formatters';

interface OverviewViewProps {
  onNavigateTab: (tab: NavigationTab) => void;
  onOpenAddModalWithType: (type: TransactionType) => void;
}

export const OverviewView: React.FC<OverviewViewProps> = ({
  onNavigateTab,
  onOpenAddModalWithType,
}) => {
  const { userProfile } = useAuth();
  const { transactions, categories, accounts, budgets } = useFinance();

  const [timeframe, setTimeframe] = useState<'thisMonth' | 'lastMonth' | 'past3Months'>('thisMonth');
  const [selectedAccountId, setSelectedAccountId] = useState<string>('all');

  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  // Days left in current month calculation
  const totalDaysInMonth = new Date(currentYear, currentMonth, 0).getDate();
  const currentDay = now.getDate();
  const daysRemaining = Math.max(1, totalDaysInMonth - currentDay);

  // Filter transactions for calculations based on timeframe
  const filteredTransactionsByTime = useMemo(() => {
    return transactions.filter((t) => {
      const d = new Date(t.date);
      const m = d.getMonth() + 1;
      const y = d.getFullYear();

      if (timeframe === 'thisMonth') {
        return m === currentMonth && y === currentYear;
      } else if (timeframe === 'lastMonth') {
        const lastMonth = currentMonth === 1 ? 12 : currentMonth - 1;
        const lastYear = currentMonth === 1 ? currentYear - 1 : currentYear;
        return m === lastMonth && y === lastYear;
      } else {
        // Past 3 months
        const targetDiff = (currentYear - y) * 12 + (currentMonth - m);
        return targetDiff >= 0 && targetDiff < 3;
      }
    });
  }, [transactions, timeframe, currentMonth, currentYear]);

  // Current Month Financial Metrics
  const currentMonthTx = useMemo(() => {
    return transactions.filter((t) => {
      const d = new Date(t.date);
      return d.getMonth() + 1 === currentMonth && d.getFullYear() === currentYear;
    });
  }, [transactions, currentMonth, currentYear]);

  const lastMonthTx = useMemo(() => {
    const lastMonth = currentMonth === 1 ? 12 : currentMonth - 1;
    const lastYear = currentMonth === 1 ? currentYear - 1 : currentYear;
    return transactions.filter((t) => {
      const d = new Date(t.date);
      return d.getMonth() + 1 === lastMonth && d.getFullYear() === lastYear;
    });
  }, [transactions, currentMonth, currentYear]);

  // Current Total Balance across all accounts
  const totalBalance = useMemo(() => {
    return accounts.reduce((acc, a) => acc + a.currentBalance, 0);
  }, [accounts]);

  const moneyIn = useMemo(() => {
    return currentMonthTx
      .filter((t) => t.type === 'income')
      .reduce((acc, t) => acc + t.amount, 0);
  }, [currentMonthTx]);

  const moneyOut = useMemo(() => {
    return currentMonthTx
      .filter((t) => t.type === 'expense')
      .reduce((acc, t) => acc + t.amount, 0);
  }, [currentMonthTx]);

  const netSaved = moneyIn - moneyOut;
  const savingsRate = moneyIn > 0 ? ((netSaved / moneyIn) * 100) : 0;

  // Last month metrics for comparison
  const lastMonthExpense = useMemo(() => {
    return lastMonthTx
      .filter((t) => t.type === 'expense')
      .reduce((acc, t) => acc + t.amount, 0);
  }, [lastMonthTx]);

  const balanceChangePercent = lastMonthExpense > 0
    ? (((moneyOut - lastMonthExpense) / lastMonthExpense) * 100).toFixed(1)
    : '+0.0';

  // Safe to spend pacing calculation: Total available budget or net income divided by remaining days
  const totalMonthlyBudget = useMemo(() => {
    return budgets
      .filter((b) => b.month === currentMonth && b.year === currentYear)
      .reduce((sum, b) => sum + b.amount, 0);
  }, [budgets, currentMonth, currentYear]);

  const safeToSpend = Math.max(0, (totalMonthlyBudget > 0 ? totalMonthlyBudget : (moneyIn || 25000)) - moneyOut);
  const safePacePercent = totalMonthlyBudget > 0
    ? Math.min(100, Math.round((moneyOut / totalMonthlyBudget) * 100))
    : Math.min(100, Math.round((currentDay / totalDaysInMonth) * 100));

  // Category Expense Breakdown for the selected timeframe
  const categoryBreakdown = useMemo(() => {
    const expenses = filteredTransactionsByTime.filter((t) => t.type === 'expense');
    const totalExp = expenses.reduce((sum, t) => sum + t.amount, 0);

    const map: Record<string, number> = {};
    expenses.forEach((t) => {
      map[t.categoryId] = (map[t.categoryId] || 0) + t.amount;
    });

    const items = Object.entries(map).map(([catId, spent]) => {
      const cat = categories.find((c) => c.id === catId);
      const budget = budgets.find(
        (b) => b.categoryId === catId && b.month === currentMonth && b.year === currentYear
      );
      const cap = budget ? budget.amount : spent * 1.25;
      const percentageOfTotal = totalExp > 0 ? (spent / totalExp) * 100 : 0;
      const percentOfCap = cap > 0 ? Math.min(100, (spent / cap) * 100) : 100;

      return {
        categoryId: catId,
        name: cat?.name || 'หมวดหมู่อื่น ๆ',
        color: cat?.color || '#355E53',
        icon: cat?.icon || 'category',
        spent,
        cap,
        percentageOfTotal,
        percentOfCap,
      };
    });

    items.sort((a, b) => b.spent - a.spent);
    return { items, totalExp };
  }, [filteredTransactionsByTime, categories, budgets, currentMonth, currentYear]);

  // Top spending category
  const topCategory = categoryBreakdown.items[0];

  // Budget Health items
  const budgetHealthItems = useMemo(() => {
    const currentMonthBudgets = budgets.filter(
      (b) => b.month === currentMonth && b.year === currentYear
    );

    return currentMonthBudgets.map((b) => {
      const cat = categories.find((c) => c.id === b.categoryId);
      const spent = currentMonthTx
        .filter((t) => t.categoryId === b.categoryId && t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);

      const isOver = spent > b.amount;
      const percentUsed = b.amount > 0 ? Math.round((spent / b.amount) * 100) : 0;
      const remaining = b.amount - spent;

      return {
        id: b.id,
        categoryName: cat?.name || 'หมวดหมู่',
        color: cat?.color || '#1C463C',
        spent,
        budget: b.amount,
        isOver,
        percentUsed,
        remaining,
      };
    });
  }, [budgets, currentMonth, currentYear, categories, currentMonthTx]);

  // Filtered recent transactions for display
  const displayedRecentTx = useMemo(() => {
    let list = transactions;
    if (selectedAccountId !== 'all') {
      list = list.filter((t) => t.accountId === selectedAccountId || t.toAccountId === selectedAccountId);
    }
    return list.slice(0, 5);
  }, [transactions, selectedAccountId]);

  return (
    <div className="w-full max-w-[1360px] mx-auto pt-6 flex flex-col gap-6">
      {/* Hero Header & Greeting */}
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs uppercase tracking-wider text-[#717975] dark:text-[#A0A8A5] font-semibold">
              ภาพรวมการเงิน
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#126967]" />
            <span className="text-xs text-[#126967] dark:text-[#A2EDEA] font-semibold">
              รอบบิล {THAI_MONTHS[currentMonth - 1]} {currentYear}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#1E292A] dark:text-white tracking-tight">
            สวัสดี, {userProfile?.name?.split(' ')[0] || 'คุณผู้ใช้งาน'}
          </h1>
          <p className="text-sm text-[#5A6567] dark:text-[#A0A8A5] mt-0.5">
            เงินสำรองของคุณอยู่ในเกณฑ์ดี มีเวลาคงเหลือ {daysRemaining} วันในรอบเดือนนี้
          </p>
        </div>

        {/* Top Fast Action Buttons */}
        <div className="flex items-center gap-2 self-start md:self-auto">
          <button
            onClick={() => onNavigateTab('analytics')}
            className="px-3.5 py-2 rounded-xl bg-white dark:bg-white/5 border border-[#E3E1DC] dark:border-white/10 text-[#1E292A] dark:text-white text-xs font-semibold flex items-center gap-1.5 hover:bg-[#F4F3F0] dark:hover:bg-white/10 transition-colors shadow-2xs"
          >
            <span className="material-symbols-outlined text-[16px]">tune</span>
            <span>ดูรายงานละเอียด</span>
          </button>
          <button
            onClick={() => onNavigateTab('settings')}
            className="px-3.5 py-2 rounded-xl bg-white dark:bg-white/5 border border-[#E3E1DC] dark:border-white/10 text-[#1E292A] dark:text-white text-xs font-semibold flex items-center gap-1.5 hover:bg-[#F4F3F0] dark:hover:bg-white/10 transition-colors shadow-2xs"
          >
            <span className="material-symbols-outlined text-[16px]">file_download</span>
            <span>ส่งออกข้อมูล</span>
          </button>
        </div>
      </section>

      {/* HERO BENTO GRID: Total Balance + Cashflow Metrics */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Primary Hero Card: Current Total Balance */}
        <div className="lg:col-span-7 bg-white dark:bg-[#1E2120] rounded-2xl border border-[#E3E1DC]/80 dark:border-white/10 p-5 md:p-6 flex flex-col justify-between shadow-[0px_4px_20px_-2px_rgba(30,41,42,0.04)] relative overflow-hidden">
          <div className="flex items-start justify-between">
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-[#717975] dark:text-[#A0A8A5] uppercase tracking-wider">
                ยอดเงินคงเหลือรวมทุกบัญชี
              </span>
              <div className="flex items-baseline gap-3 mt-1">
                <span className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-[#1C463C] dark:text-[#BFECDD] tracking-tight tabular-nums">
                  {formatCurrency(totalBalance)}
                </span>
                <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-emerald-500/10 text-[#047857] dark:text-[#10B981] text-xs font-bold">
                  <span className="material-symbols-outlined text-[14px]">trending_up</span>
                  {balanceChangePercent.startsWith('-') ? balanceChangePercent : `+${balanceChangePercent}`}%
                </span>
              </div>
              <span className="text-xs text-[#717975] dark:text-[#A0A8A5] mt-1">
                เปรียบเทียบกับรายจ่ายเดือนก่อนหน้า {formatCurrency(lastMonthExpense)}
              </span>
            </div>

            <div className="w-11 h-11 rounded-xl bg-[#F4F3F0] dark:bg-white/5 flex items-center justify-center text-[#1C463C] dark:text-[#BFECDD] shadow-2xs">
              <span className="material-symbols-outlined text-[24px]">account_balance_wallet</span>
            </div>
          </div>

          {/* Secondary Insight: Safe to Spend */}
          <div className="mt-6 pt-5 border-t border-[#E3E1DC]/50 dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-[#A2EDEA]/40 text-[#126967] dark:text-[#A2EDEA] flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[18px]">spa</span>
              </div>
              <div>
                <span className="text-xs text-[#717975] dark:text-[#A0A8A5] block">
                  งบที่สามารถใช้ได้อย่างปลอดภัย (Safe to Spend)
                </span>
                <span className="text-base font-bold text-[#1E292A] dark:text-white tabular-nums">
                  {formatCurrency(safeToSpend)}{' '}
                  <span className="text-xs font-normal text-[#717975] dark:text-[#A0A8A5]">
                    สำหรับ {daysRemaining} วันที่เหลือ
                  </span>
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="h-2.5 w-32 bg-[#F1EFEA] dark:bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#126967] rounded-full transition-all duration-500"
                  style={{ width: `${safePacePercent}%` }}
                />
              </div>
              <span className="text-xs font-semibold text-[#5A6567] dark:text-[#A0A8A5] tabular-nums">
                {safePacePercent}% อัตราการใช้
              </span>
            </div>
          </div>
        </div>

        {/* Cashflow Summary Mini-Bento Cards */}
        <div className="lg:col-span-5 grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 gap-3.5">
          {/* Money In */}
          <div className="bg-white dark:bg-[#1E2120] rounded-2xl border border-[#E3E1DC]/80 dark:border-white/10 p-4 flex items-center justify-between shadow-[0px_4px_20px_-2px_rgba(30,41,42,0.04)]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-[#047857] dark:text-[#10B981]">
                <span className="material-symbols-outlined text-[20px]">south_west</span>
              </div>
              <div>
                <span className="text-xs text-[#717975] dark:text-[#A0A8A5] block">รายรับทั้งหมด</span>
                <span className="text-lg font-bold text-[#1E292A] dark:text-white tabular-nums">
                  {formatCurrency(moneyIn)}
                </span>
              </div>
            </div>
            <span className="text-xs font-bold text-[#047857] dark:text-[#10B981] bg-emerald-500/10 px-2.5 py-1 rounded-full">
              รับเข้า
            </span>
          </div>

          {/* Money Out */}
          <div className="bg-white dark:bg-[#1E2120] rounded-2xl border border-[#E3E1DC]/80 dark:border-white/10 p-4 flex items-center justify-between shadow-[0px_4px_20px_-2px_rgba(30,41,42,0.04)]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#FFDBD0]/60 flex items-center justify-center text-[#D97757]">
                <span className="material-symbols-outlined text-[20px]">north_east</span>
              </div>
              <div>
                <span className="text-xs text-[#717975] dark:text-[#A0A8A5] block">รายจ่ายทั้งหมด</span>
                <span className="text-lg font-bold text-[#1E292A] dark:text-white tabular-nums">
                  {formatCurrency(moneyOut)}
                </span>
              </div>
            </div>
            <span className="text-xs font-bold text-[#D97757] bg-[#FFDBD0]/60 px-2.5 py-1 rounded-full">
              จ่ายออก
            </span>
          </div>

          {/* Net Saved */}
          <div className="bg-white dark:bg-[#1E2120] rounded-2xl border border-[#E3E1DC]/80 dark:border-white/10 p-4 flex items-center justify-between shadow-[0px_4px_20px_-2px_rgba(30,41,42,0.04)]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#A2EDEA]/30 flex items-center justify-center text-[#126967] dark:text-[#A2EDEA]">
                <span className="material-symbols-outlined text-[20px]">lock</span>
              </div>
              <div>
                <span className="text-xs text-[#717975] dark:text-[#A0A8A5] block">เงินคงเหลือสุทธิ</span>
                <span className="text-lg font-bold text-[#126967] dark:text-[#A2EDEA] tabular-nums">
                  {formatCurrency(netSaved)}
                </span>
              </div>
            </div>
            <span className="text-xs font-bold text-[#126967] dark:text-[#A2EDEA] bg-[#A2EDEA]/30 px-2.5 py-1 rounded-full tabular-nums">
              ออมได้ {savingsRate > 0 ? savingsRate.toFixed(1) : '0'}%
            </span>
          </div>
        </div>
      </section>

      {/* Instant Quick-Add Action Bar (Tactile Buttons) */}
      <section className="bg-white dark:bg-[#1E2120] rounded-2xl border border-[#E3E1DC]/80 dark:border-white/10 p-3.5 shadow-xs">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-[#717975] px-2 hidden sm:inline">
            บันทึกรายการด่วน:
          </span>
          <div className="grid grid-cols-3 gap-2 flex-1 w-full sm:w-auto">
            {/* + Money In */}
            <button
              onClick={() => onOpenAddModalWithType('income')}
              className="py-2.5 px-3 rounded-xl bg-[#F4F3F0] hover:bg-emerald-500/10 border border-[#E3E1DC]/50 dark:bg-white/5 dark:border-white/10 text-[#1E292A] hover:text-[#047857] dark:text-white flex items-center justify-center gap-1.5 active:scale-[0.98] transition-all"
            >
              <span className="material-symbols-outlined text-[18px] text-[#047857]">add_circle</span>
              <span className="text-xs font-bold">+ รายรับ</span>
            </button>
            {/* - Money Out */}
            <button
              onClick={() => onOpenAddModalWithType('expense')}
              className="py-2.5 px-3 rounded-xl bg-[#F4F3F0] hover:bg-[#FFDBD0]/40 border border-[#E3E1DC]/50 dark:bg-white/5 dark:border-white/10 text-[#1E292A] hover:text-[#D97757] dark:text-white flex items-center justify-center gap-1.5 active:scale-[0.98] transition-all"
            >
              <span className="material-symbols-outlined text-[18px] text-[#D97757]">remove_circle</span>
              <span className="text-xs font-bold">- รายจ่าย</span>
            </button>
            {/* ⇆ Move Money */}
            <button
              onClick={() => onOpenAddModalWithType('transfer')}
              className="py-2.5 px-3 rounded-xl bg-[#F4F3F0] hover:bg-[#A2EDEA]/30 border border-[#E3E1DC]/50 dark:bg-white/5 dark:border-white/10 text-[#1E292A] hover:text-[#126967] dark:text-white flex items-center justify-center gap-1.5 active:scale-[0.98] transition-all"
            >
              <span className="material-symbols-outlined text-[18px] text-[#126967]">swap_horiz</span>
              <span className="text-xs font-bold">⇆ โอนเงิน</span>
            </button>
          </div>
        </div>
      </section>

      {/* TWO-COLUMN SECTION: Expense Breakdown + Budget Health */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Categorized Spending Bar Chart (Bento Col 7) */}
        <div className="lg:col-span-7 bg-white dark:bg-[#1E2120] rounded-2xl border border-[#E3E1DC]/80 dark:border-white/10 p-5 md:p-6 flex flex-col justify-between shadow-[0px_4px_20px_-2px_rgba(30,41,42,0.04)]">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-[#E3E1DC]/50 dark:border-white/10">
              <div>
                <h2 className="text-base font-bold text-[#1E292A] dark:text-white">
                  สัดส่วนรายจ่ายตามหมวดหมู่
                </h2>
                <p className="text-xs text-[#717975] dark:text-[#A0A8A5]">
                  เปรียบเทียบการใช้จ่ายจริงเทียบกับเป้าหมาย
                </p>
              </div>

              {/* Timeframe Tabs */}
              <div className="flex items-center p-1 bg-[#F1EFEA] dark:bg-white/5 rounded-xl border border-[#E3E1DC]/50 dark:border-white/10 self-start sm:self-auto">
                <button
                  onClick={() => setTimeframe('thisMonth')}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                    timeframe === 'thisMonth'
                      ? 'bg-white dark:bg-[#282C2A] text-[#1C463C] dark:text-[#BFECDD] shadow-xs'
                      : 'text-[#5A6567] dark:text-[#A0A8A5]'
                  }`}
                >
                  เดือนนี้
                </button>
                <button
                  onClick={() => setTimeframe('lastMonth')}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                    timeframe === 'lastMonth'
                      ? 'bg-white dark:bg-[#282C2A] text-[#1C463C] dark:text-[#BFECDD] shadow-xs'
                      : 'text-[#5A6567] dark:text-[#A0A8A5]'
                  }`}
                >
                  เดือนก่อน
                </button>
                <button
                  onClick={() => setTimeframe('past3Months')}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                    timeframe === 'past3Months'
                      ? 'bg-white dark:bg-[#282C2A] text-[#1C463C] dark:text-[#BFECDD] shadow-xs'
                      : 'text-[#5A6567] dark:text-[#A0A8A5]'
                  }`}
                >
                  3 เดือนล่าสุด
                </button>
              </div>
            </div>

            {/* Custom Clean Bar Chart Visualization */}
            <div className="mt-5 flex flex-col gap-4">
              <div className="flex items-center justify-between text-[#717975] dark:text-[#A0A8A5] text-xs">
                <span>หมวดหมู่</span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-0.5 bg-[#717975]" />
                  <span>ยอดใช้จ่ายจริง / เพดานงบ</span>
                </span>
              </div>

              {categoryBreakdown.items.length === 0 ? (
                <div className="py-8 text-center text-xs text-[#717975]">
                  ยังไม่มีข้อมูลรายจ่ายในช่วงเวลานี้
                </div>
              ) : (
                categoryBreakdown.items.slice(0, 6).map((item) => (
                  <div key={item.categoryId} className="flex flex-col gap-1.5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-[#1E292A] dark:text-white font-medium flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: item.color }}
                        />
                        {item.name}
                      </span>
                      <span className="tabular-nums text-[#1E292A] dark:text-white font-semibold">
                        {formatCurrency(item.spent)}{' '}
                        <span className="text-[#717975] dark:text-[#A0A8A5] font-normal">
                          / {formatCurrency(item.cap)}
                        </span>
                      </span>
                    </div>
                    <div className="w-full bg-[#F1EFEA] dark:bg-white/10 rounded-full h-2.5 overflow-hidden relative">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${item.percentOfCap}%`,
                          backgroundColor: item.color,
                        }}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Bottom insight footer */}
          <div className="mt-6 pt-4 border-t border-[#E3E1DC]/50 dark:border-white/10 flex items-center justify-between">
            <span className="text-xs text-[#5A6567] dark:text-[#A0A8A5]">
              {topCategory
                ? `หมวดหมู่สูงสุดคือ ${topCategory.name} (${topCategory.percentageOfTotal.toFixed(1)}% ของรายจ่ายทั้งหมด)`
                : 'เริ่มบันทึกรายจ่ายเพื่อดูสัดส่วนการเงิน'}
            </span>
            <button
              onClick={() => onNavigateTab('analytics')}
              className="text-xs font-semibold text-[#126967] dark:text-[#A2EDEA] hover:underline flex items-center gap-0.5"
            >
              <span>วิเคราะห์เชิงลึก</span>
              <span className="material-symbols-outlined text-[16px]">chevron_right</span>
            </button>
          </div>
        </div>

        {/* Monthly Budget Health (Bento Col 5) */}
        <div className="lg:col-span-5 bg-white dark:bg-[#1E2120] rounded-2xl border border-[#E3E1DC]/80 dark:border-white/10 p-5 md:p-6 flex flex-col justify-between shadow-[0px_4px_20px_-2px_rgba(30,41,42,0.04)]">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-[#E3E1DC]/50 dark:border-white/10">
              <div>
                <h2 className="text-base font-bold text-[#1E292A] dark:text-white">
                  สุขภาพงบประมาณ (Budget Health)
                </h2>
                <p className="text-xs text-[#717975] dark:text-[#A0A8A5]">
                  การควบคุมค่าใช้จ่ายเทียบกับเป้าหมาย
                </p>
              </div>
              <span className="p-2 rounded-xl bg-[#F4F3F0] dark:bg-white/5 text-[#1C463C] dark:text-[#BFECDD]">
                <span className="material-symbols-outlined text-[20px]">verified</span>
              </span>
            </div>

            {/* Health Status Rows */}
            <div className="mt-4 flex flex-col gap-3">
              {budgetHealthItems.length === 0 ? (
                <div className="py-6 text-center text-xs text-[#717975]">
                  ยังไม่ได้ตั้งงบประมาณสำหรับเดือนนี้
                  <div className="mt-2">
                    <button
                      onClick={() => onNavigateTab('budgets')}
                      className="px-3 py-1.5 bg-[#1C463C] text-white rounded-lg text-xs font-semibold"
                    >
                      + ตั้งงบประมาณ
                    </button>
                  </div>
                </div>
              ) : (
                budgetHealthItems.slice(0, 3).map((item) => (
                  <div
                    key={item.id}
                    className={`p-3 rounded-xl border flex flex-col gap-2 ${
                      item.isOver
                        ? 'bg-[#FFDBD0]/20 border-[#FFDBD0] dark:border-red-900/30'
                        : item.percentUsed > 80
                        ? 'bg-amber-500/10 border-amber-500/30'
                        : 'bg-[#F4F3F0] dark:bg-white/5 border-[#E3E1DC]/50 dark:border-white/5'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full"
                          style={{
                            backgroundColor: item.isOver ? '#D97757' : item.percentUsed > 80 ? '#F59E0B' : '#10B981',
                          }}
                        />
                        <span className="text-xs font-bold text-[#1E292A] dark:text-white">
                          {item.categoryName}
                        </span>
                      </div>
                      <span
                        className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                          item.isOver
                            ? 'bg-[#FFDBD0] text-[#71280E]'
                            : item.percentUsed > 80
                            ? 'bg-amber-100 text-amber-900'
                            : 'bg-emerald-500/10 text-[#047857]'
                        }`}
                      >
                        {item.isOver ? 'เกินงบแล้ว' : 'เป็นไปตามแผน'}
                      </span>
                    </div>

                    <div className="w-full bg-[#E3E1DC] dark:bg-white/10 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          item.isOver
                            ? 'bg-[#D97757]'
                            : item.percentUsed > 80
                            ? 'bg-amber-500'
                            : 'bg-[#10B981]'
                        }`}
                        style={{ width: `${Math.min(100, item.percentUsed)}%` }}
                      />
                    </div>

                    <div className="flex justify-between items-center text-xs">
                      <span className="text-[#5A6567] dark:text-[#A0A8A5] tabular-nums">
                        ใช้ไป {formatCurrency(item.spent)} จาก {formatCurrency(item.budget)}
                      </span>
                      <span
                        className={`font-semibold tabular-nums ${
                          item.isOver ? 'text-[#D97757]' : 'text-[#1E292A] dark:text-white'
                        }`}
                      >
                        {item.isOver
                          ? `เกินงบ ${formatCurrency(Math.abs(item.remaining))}`
                          : `เหลือ ${formatCurrency(item.remaining)}`}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Vault Recommendation Prompt */}
          <div className="mt-4 p-3 rounded-xl bg-[#F1EFEA] dark:bg-white/5 border border-[#E3E1DC]/40 dark:border-white/5 flex items-center gap-3">
            <span className="material-symbols-outlined text-[#126967] dark:text-[#A2EDEA] text-[20px] shrink-0">
              lightbulb
            </span>
            <p className="text-xs text-[#5A6567] dark:text-[#A0A8A5] leading-relaxed">
              คำแนะนำ: รักษาอัตราการออมไว้ที่ 25-30% ต่อเดือนเพื่อสะสมเงินสำรองฉุกเฉินได้ตามเป้าหมาย
            </p>
          </div>
        </div>
      </section>

      {/* RECENT TRANSACTIONS FEED (Full Width Table / Card Ledger) */}
      <section className="bg-white dark:bg-[#1E2120] rounded-2xl border border-[#E3E1DC]/80 dark:border-white/10 p-5 md:p-6 shadow-[0px_4px_20px_-2px_rgba(30,41,42,0.04)]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#E3E1DC]/50 dark:border-white/10">
          <div>
            <h2 className="text-base font-bold text-[#1E292A] dark:text-white">
              รายการธุรกรรมล่าสุด (Recent Transactions)
            </h2>
            <p className="text-xs text-[#717975] dark:text-[#A0A8A5]">
              สมุดบัญชีแบบเรียลไทม์พร้อมการจำแนกหมวดหมู่อัตโนมัติ
            </p>
          </div>

          {/* Account Filter & View All */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <select
                value={selectedAccountId}
                onChange={(e) => setSelectedAccountId(e.target.value)}
                className="py-1.5 pl-3 pr-8 rounded-xl bg-[#F4F3F0] dark:bg-white/5 border border-[#E3E1DC] dark:border-white/10 text-xs font-semibold text-[#1E292A] dark:text-white appearance-none focus:outline-none focus:border-[#2B7A78]"
              >
                <option value="all">ทุกบัญชี / กระเป๋าเงิน</option>
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name} ({acc.accountNumber || formatCurrency(acc.currentBalance)})
                  </option>
                ))}
              </select>
              <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 text-[#717975] text-[16px] pointer-events-none">
                expand_more
              </span>
            </div>

            <button
              onClick={() => onNavigateTab('transactions')}
              className="px-3.5 py-1.5 rounded-xl bg-[#F4F3F0] dark:bg-white/5 border border-[#E3E1DC] dark:border-white/10 text-[#1C463C] dark:text-[#BFECDD] text-xs font-bold hover:bg-[#E3E1DC] dark:hover:bg-white/10 transition-colors shadow-2xs"
            >
              ดูทั้งหมด
            </button>
          </div>
        </div>

        {/* Transaction Rows List */}
        <div className="divide-y divide-[#F1EFEA] dark:divide-white/5 mt-2">
          {displayedRecentTx.length === 0 ? (
            <div className="py-12 text-center text-xs text-[#717975]">
              <span className="material-symbols-outlined text-3xl mb-1 opacity-40">receipt_long</span>
              <p>ยังไม่มีรายการธุรกรรมในบัญชีนี้</p>
              <button
                onClick={() => onOpenAddModalWithType('expense')}
                className="mt-3 px-4 py-2 bg-[#1C463C] text-white rounded-xl text-xs font-semibold"
              >
                + เพิ่มรายการแรก
              </button>
            </div>
          ) : (
            displayedRecentTx.map((tx) => {
              const cat = categories.find((c) => c.id === tx.categoryId);
              const acc = accounts.find((a) => a.id === tx.accountId);
              const isIncome = tx.type === 'income';
              const isTransfer = tx.type === 'transfer';

              return (
                <div
                  key={tx.id}
                  className="py-3 flex items-center justify-between gap-3 hover:bg-[#F4F3F0]/60 dark:hover:bg-white/5 rounded-xl px-2 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                        isIncome
                          ? 'bg-emerald-500/10 text-[#047857]'
                          : isTransfer
                          ? 'bg-[#A2EDEA]/30 text-[#126967]'
                          : 'bg-[#FFDBD0]/40 text-[#D97757]'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[20px]">
                        {isTransfer ? 'swap_horiz' : cat?.icon || 'payments'}
                      </span>
                    </div>

                    <div className="flex flex-col min-w-0">
                      <span className="text-sm font-semibold text-[#1E292A] dark:text-white truncate">
                        {tx.description}
                      </span>
                      <div className="flex items-center gap-1.5 text-xs text-[#717975] dark:text-[#A0A8A5]">
                        <span className="truncate">{cat?.name || (isTransfer ? 'โอนเงินระหว่างบัญชี' : 'ทั่วไป')}</span>
                        <span>•</span>
                        <span className="truncate">{acc?.name || 'บัญชี'}</span>
                        <span>•</span>
                        <span>{formatDateThai(tx.date)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span
                      className={`hidden sm:inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${
                        isIncome
                          ? 'bg-emerald-500/10 text-[#047857]'
                          : isTransfer
                          ? 'bg-[#A2EDEA]/30 text-[#126967]'
                          : 'bg-[#F1EFEA] dark:bg-white/5 text-[#5A6567] dark:text-[#A0A8A5]'
                      }`}
                    >
                      {isIncome ? 'รายรับ' : isTransfer ? 'โอนเงิน' : 'รายจ่าย'}
                    </span>
                    <span
                      className={`text-sm font-bold tabular-nums ${
                        isIncome
                          ? 'text-[#047857] dark:text-[#10B981]'
                          : isTransfer
                          ? 'text-[#126967] dark:text-[#A2EDEA]'
                          : 'text-[#1E292A] dark:text-white'
                      }`}
                    >
                      {isIncome ? '+' : isTransfer ? '' : '-'}
                      {formatCurrency(tx.amount)}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>
    </div>
  );
};

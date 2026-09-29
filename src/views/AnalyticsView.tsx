import React, { useState, useMemo } from 'react';
import { useFinance } from '../context/FinanceContext';
import { formatCurrency, THAI_MONTHS, THAI_MONTHS_SHORT } from '../utils/formatters';

export const AnalyticsView: React.FC = () => {
  const { transactions, categories, budgets } = useFinance();

  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState<number>(now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(now.getFullYear());
  const [chartViewMode, setChartViewMode] = useState<'daily' | 'monthlyTrend'>('daily');

  // Transactions for selected month
  const currentMonthTx = useMemo(() => {
    return transactions.filter((t) => {
      const d = new Date(t.date);
      return d.getMonth() + 1 === selectedMonth && d.getFullYear() === selectedYear;
    });
  }, [transactions, selectedMonth, selectedYear]);

  // Transactions for previous month
  const prevMonthTx = useMemo(() => {
    const prevMonth = selectedMonth === 1 ? 12 : selectedMonth - 1;
    const prevYear = selectedMonth === 1 ? selectedYear - 1 : selectedYear;
    return transactions.filter((t) => {
      const d = new Date(t.date);
      return d.getMonth() + 1 === prevMonth && d.getFullYear() === prevYear;
    });
  }, [transactions, selectedMonth, selectedYear]);

  // Key metrics for selected month
  const totalIncome = useMemo(() => {
    return currentMonthTx
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
  }, [currentMonthTx]);

  const totalExpense = useMemo(() => {
    return currentMonthTx
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
  }, [currentMonthTx]);

  const netBalance = totalIncome - totalExpense;
  const savingsRate = totalIncome > 0 ? (netBalance / totalIncome) * 100 : 0;

  // Previous month metrics
  const prevIncome = useMemo(() => {
    return prevMonthTx
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
  }, [prevMonthTx]);

  const prevExpense = useMemo(() => {
    return prevMonthTx
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
  }, [prevMonthTx]);

  const prevNet = prevIncome - prevExpense;

  // Month-over-month percentage changes
  const hasPrevData = prevIncome > 0 || prevExpense > 0;
  const incomeChangePercent = hasPrevData && prevIncome > 0
    ? (((totalIncome - prevIncome) / prevIncome) * 100).toFixed(1)
    : null;
  const expenseChangePercent = hasPrevData && prevExpense > 0
    ? (((totalExpense - prevExpense) / prevExpense) * 100).toFixed(1)
    : null;
  const netChangePercent = hasPrevData && prevNet !== 0
    ? (((netBalance - prevNet) / Math.abs(prevNet)) * 100).toFixed(1)
    : null;

  // Category breakdown for current month
  const categoryStats = useMemo(() => {
    const expenses = currentMonthTx.filter((t) => t.type === 'expense');
    const map: Record<string, number> = {};

    expenses.forEach((t) => {
      map[t.categoryId] = (map[t.categoryId] || 0) + t.amount;
    });

    const list = Object.entries(map).map(([catId, amount]) => {
      const cat = categories.find((c) => c.id === catId);
      const percent = totalExpense > 0 ? (amount / totalExpense) * 100 : 0;
      return {
        categoryId: catId,
        name: cat?.name || 'หมวดหมู่อื่น',
        color: cat?.color || '#355E53',
        icon: cat?.icon || 'payments',
        amount,
        percent,
      };
    });

    list.sort((a, b) => b.amount - a.amount);
    return list;
  }, [currentMonthTx, categories, totalExpense]);

  const topCategory = categoryStats[0];

  // Daily expenses map & Highest spending day & Average daily
  const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();
  const dailyStats = useMemo(() => {
    const dailyIncome: number[] = new Array(daysInMonth).fill(0);
    const dailyExpense: number[] = new Array(daysInMonth).fill(0);

    currentMonthTx.forEach((t) => {
      const d = new Date(t.date);
      const dayIndex = d.getDate() - 1;
      if (dayIndex >= 0 && dayIndex < daysInMonth) {
        if (t.type === 'income') dailyIncome[dayIndex] += t.amount;
        if (t.type === 'expense') dailyExpense[dayIndex] += t.amount;
      }
    });

    let maxDay = 1;
    let maxExpense = 0;
    dailyExpense.forEach((exp, idx) => {
      if (exp > maxExpense) {
        maxExpense = exp;
        maxDay = idx + 1;
      }
    });

    const activeDaysCount = selectedMonth === now.getMonth() + 1 && selectedYear === now.getFullYear()
      ? Math.max(1, now.getDate())
      : daysInMonth;

    const dailyAvg = totalExpense / activeDaysCount;

    return {
      dailyIncome,
      dailyExpense,
      maxDay,
      maxExpense,
      dailyAvg,
    };
  }, [currentMonthTx, daysInMonth, selectedMonth, selectedYear, totalExpense, now]);

  // Past 6 Months Comparison for Bar Chart
  const past6MonthsData = useMemo(() => {
    const result = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(selectedYear, selectedMonth - 1 - i, 1);
      const m = d.getMonth() + 1;
      const y = d.getFullYear();

      const txs = transactions.filter((t) => {
        const td = new Date(t.date);
        return td.getMonth() + 1 === m && td.getFullYear() === y;
      });

      const inc = txs.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
      const exp = txs.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

      result.push({
        label: `${THAI_MONTHS_SHORT[m - 1]} ${String(y).slice(-2)}`,
        income: inc,
        expense: exp,
      });
    }
    return result;
  }, [transactions, selectedMonth, selectedYear]);

  // Donut chart SVG path calculation
  const donutSlices = useMemo(() => {
    if (totalExpense === 0 || categoryStats.length === 0) return [];

    let currentAngle = 0;
    return categoryStats.slice(0, 6).map((item) => {
      const sliceAngle = (item.amount / totalExpense) * 360;
      const startAngle = currentAngle;
      const endAngle = currentAngle + sliceAngle;
      currentAngle = endAngle;

      // Arc calculation (center 100, 100, radius 70, inner 45)
      const x1 = 100 + 70 * Math.cos(((startAngle - 90) * Math.PI) / 180);
      const y1 = 100 + 70 * Math.sin(((startAngle - 90) * Math.PI) / 180);
      const x2 = 100 + 70 * Math.cos(((endAngle - 90) * Math.PI) / 180);
      const y2 = 100 + 70 * Math.sin(((endAngle - 90) * Math.PI) / 180);

      const xi1 = 100 + 45 * Math.cos(((endAngle - 90) * Math.PI) / 180);
      const yi1 = 100 + 45 * Math.sin(((endAngle - 90) * Math.PI) / 180);
      const xi2 = 100 + 45 * Math.cos(((startAngle - 90) * Math.PI) / 180);
      const yi2 = 100 + 45 * Math.sin(((startAngle - 90) * Math.PI) / 180);

      const largeArc = sliceAngle > 180 ? 1 : 0;

      const pathData = `M ${x1} ${y1} A 70 70 0 ${largeArc} 1 ${x2} ${y2} L ${xi1} ${yi1} A 45 45 0 ${largeArc} 0 ${xi2} ${yi2} Z`;

      return {
        ...item,
        pathData,
      };
    });
  }, [categoryStats, totalExpense]);

  // Max value for bar charts
  const maxBarValue = Math.max(
    ...dailyStats.dailyIncome,
    ...dailyStats.dailyExpense,
    1000
  );

  return (
    <div className="w-full max-w-[1360px] mx-auto pt-6 flex flex-col gap-6">
      {/* Title & Month Picker */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1E292A] dark:text-white tracking-tight">
            วิเคราะห์การเงิน &amp; กราฟสรุป (Analytics)
          </h1>
          <p className="text-xs text-[#717975] dark:text-[#A0A8A5] mt-0.5">
            ภาพรวมพฤติกรรมการใช้จ่าย สัดส่วนหมวดหมู่ และการเปรียบเทียบเดือนต่อเดือน
          </p>
        </div>

        {/* Month & Year Selectors */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
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
        </div>
      </div>

      {/* SECTION: สรุปให้ฉัน (Automatic Financial Insights) */}
      <section className="bg-white dark:bg-[#1E2120] rounded-2xl border border-[#E3E1DC]/80 dark:border-white/10 p-5 md:p-6 shadow-xs">
        <div className="flex items-center gap-2.5 mb-3">
          <div className="w-8 h-8 rounded-lg bg-[#126967]/10 text-[#126967] dark:text-[#A2EDEA] flex items-center justify-center">
            <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
          </div>
          <div>
            <h2 className="text-base font-bold text-[#1E292A] dark:text-white">
              สรุปให้ฉัน (Smart Insights)
            </h2>
            <span className="text-[11px] text-[#717975] dark:text-[#A0A8A5]">
              คำนวณและประมวลผลจากข้อมูลจริงประจำเดือน {THAI_MONTHS[selectedMonth - 1]} {selectedYear}
            </span>
          </div>
        </div>

        <div className="p-4 bg-[#FAF9F6] dark:bg-white/5 rounded-xl border border-[#E3E1DC]/50 dark:border-white/5 space-y-2 text-xs sm:text-sm text-[#1E292A] dark:text-[#E3E2DF] leading-relaxed">
          <p>
            • เดือนนี้คุณมีรายรับทั้งหมด <strong className="text-[#047857]">{formatCurrency(totalIncome)}</strong> และมีรายจ่ายรวม <strong className="text-[#D97757]">{formatCurrency(totalExpense)}</strong> ทำให้เหลือเงินสุทธิ <strong className="text-[#126967] dark:text-[#A2EDEA]">{formatCurrency(netBalance)}</strong> (คิดเป็นอัตราการออม {savingsRate.toFixed(1)}%)
          </p>

          {topCategory ? (
            <p>
              • หมวด <strong>{topCategory.name}</strong> เป็นค่าใช้จ่ายสูงสุด คิดเป็นประมาณ <strong>{topCategory.percent.toFixed(1)}%</strong> ของรายจ่ายทั้งหมด ({formatCurrency(topCategory.amount)})
            </p>
          ) : (
            <p>• ยังไม่มีข้อมูลรายจ่ายในเดือนนี้</p>
          )}

          {dailyStats.maxExpense > 0 && (
            <p>
              • วันที่ใช้เงินมากที่สุดคือ <strong>วันที่ {dailyStats.maxDay} {THAI_MONTHS[selectedMonth - 1]}</strong> ด้วยยอดใช้จ่าย <strong>{formatCurrency(dailyStats.maxExpense)}</strong> โดยมีค่าใช้จ่ายเฉลี่ยต่อวันอยู่ที่ <strong>{formatCurrency(dailyStats.dailyAvg)}</strong>
            </p>
          )}

          {hasPrevData ? (
            <p>
              • เมื่อเปรียบเทียบกับเดือนก่อนหน้า:{' '}
              {expenseChangePercent ? (
                <span>
                  รายจ่าย{Number(expenseChangePercent) >= 0 ? 'เพิ่มขึ้น' : 'ลดลง'}{' '}
                  <strong>{Math.abs(Number(expenseChangePercent))}%</strong>
                </span>
              ) : null}
              {incomeChangePercent && (
                <span>
                  {' '}และรายรับ{Number(incomeChangePercent) >= 0 ? 'เพิ่มขึ้น' : 'ลดลง'}{' '}
                  <strong>{Math.abs(Number(incomeChangePercent))}%</strong>
                </span>
              )}
            </p>
          ) : (
            <p className="text-[#717975] italic">
              • ยังมีข้อมูลไม่เพียงพอสำหรับการเปรียบเทียบกับเดือนก่อนหน้า
            </p>
          )}
        </div>
      </section>

      {/* SECTION: Month-over-Month Comparison Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Income Card */}
        <div className="p-4 bg-white dark:bg-[#1E2120] rounded-2xl border border-[#E3E1DC]/80 dark:border-white/10 shadow-xs">
          <span className="text-xs text-[#717975] dark:text-[#A0A8A5] block">รายรับเดือนนี้</span>
          <div className="text-xl font-bold text-[#047857] dark:text-[#10B981] mt-1 tabular-nums">
            {formatCurrency(totalIncome)}
          </div>
          <div className="text-xs text-[#717975] dark:text-[#A0A8A5] mt-1 flex items-center gap-1">
            <span>เดือนก่อน: {formatCurrency(prevIncome)}</span>
            {incomeChangePercent && (
              <span className={`font-bold ${Number(incomeChangePercent) >= 0 ? 'text-[#047857]' : 'text-[#D97757]'}`}>
                ({Number(incomeChangePercent) >= 0 ? '+' : ''}{incomeChangePercent}%)
              </span>
            )}
          </div>
        </div>

        {/* Expense Card */}
        <div className="p-4 bg-white dark:bg-[#1E2120] rounded-2xl border border-[#E3E1DC]/80 dark:border-white/10 shadow-xs">
          <span className="text-xs text-[#717975] dark:text-[#A0A8A5] block">รายจ่ายเดือนนี้</span>
          <div className="text-xl font-bold text-[#D97757] mt-1 tabular-nums">
            {formatCurrency(totalExpense)}
          </div>
          <div className="text-xs text-[#717975] dark:text-[#A0A8A5] mt-1 flex items-center gap-1">
            <span>เดือนก่อน: {formatCurrency(prevExpense)}</span>
            {expenseChangePercent && (
              <span className={`font-bold ${Number(expenseChangePercent) <= 0 ? 'text-[#047857]' : 'text-[#D97757]'}`}>
                ({Number(expenseChangePercent) >= 0 ? '+' : ''}{expenseChangePercent}%)
              </span>
            )}
          </div>
        </div>

        {/* Net Savings Card */}
        <div className="p-4 bg-white dark:bg-[#1E2120] rounded-2xl border border-[#E3E1DC]/80 dark:border-white/10 shadow-xs">
          <span className="text-xs text-[#717975] dark:text-[#A0A8A5] block">เงินคงเหลือสุทธิ</span>
          <div className="text-xl font-bold text-[#126967] dark:text-[#A2EDEA] mt-1 tabular-nums">
            {formatCurrency(netBalance)}
          </div>
          <div className="text-xs text-[#717975] dark:text-[#A0A8A5] mt-1 flex items-center gap-1">
            <span>เดือนก่อน: {formatCurrency(prevNet)}</span>
            {netChangePercent && (
              <span className={`font-bold ${Number(netChangePercent) >= 0 ? 'text-[#047857]' : 'text-[#D97757]'}`}>
                ({Number(netChangePercent) >= 0 ? '+' : ''}{netChangePercent}%)
              </span>
            )}
          </div>
        </div>

        {/* Daily Average Card */}
        <div className="p-4 bg-white dark:bg-[#1E2120] rounded-2xl border border-[#E3E1DC]/80 dark:border-white/10 shadow-xs">
          <span className="text-xs text-[#717975] dark:text-[#A0A8A5] block">ค่าใช้จ่ายเฉลี่ยต่อวัน</span>
          <div className="text-xl font-bold text-[#1E292A] dark:text-white mt-1 tabular-nums">
            {formatCurrency(dailyStats.dailyAvg)}
          </div>
          <span className="text-xs text-[#717975] dark:text-[#A0A8A5] mt-1 block">
            วันใช้เงินสูงสุด: วันที่ {dailyStats.maxDay} ({formatCurrency(dailyStats.maxExpense)})
          </span>
        </div>
      </section>

      {/* VISUALIZATIONS GRID: Donut Chart + Bar Chart */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Visual 1: Donut Chart - สัดส่วนรายจ่ายตามหมวดหมู่ */}
        <div className="lg:col-span-5 bg-white dark:bg-[#1E2120] rounded-2xl border border-[#E3E1DC]/80 dark:border-white/10 p-5 md:p-6 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-[#1E292A] dark:text-white mb-1">
              สัดส่วนรายจ่าย (Category Distribution)
            </h3>
            <p className="text-xs text-[#717975] dark:text-[#A0A8A5]">
              แจกแจงเปอร์เซ็นต์ค่าใช้จ่ายตามแต่ละหมวด
            </p>

            {totalExpense === 0 ? (
              <div className="py-20 text-center text-xs text-[#717975]">
                ไม่มีรายการค่าใช้จ่ายในเดือนนี้
              </div>
            ) : (
              <div className="mt-4 flex flex-col items-center">
                {/* SVG Donut */}
                <div className="relative w-48 h-48 my-2">
                  <svg viewBox="0 0 200 200" className="w-full h-full transform -rotate-90">
                    {donutSlices.map((slice, i) => (
                      <path
                        key={i}
                        d={slice.pathData}
                        fill={slice.color}
                        className="hover:opacity-85 transition-opacity cursor-pointer"
                      />
                    ))}
                  </svg>
                  {/* Center Text */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                    <span className="text-[10px] uppercase font-bold text-[#717975]">รวมรายจ่าย</span>
                    <span className="text-xs sm:text-sm font-bold text-[#1E292A] dark:text-white tabular-nums">
                      {formatCurrency(totalExpense)}
                    </span>
                  </div>
                </div>

                {/* Legend */}
                <div className="w-full mt-4 space-y-2">
                  {categoryStats.slice(0, 5).map((cat) => (
                    <div key={cat.categoryId} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: cat.color }}
                        />
                        <span className="text-[#1E292A] dark:text-white font-medium">
                          {cat.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[#717975] font-semibold">{cat.percent.toFixed(1)}%</span>
                        <span className="font-bold tabular-nums text-[#1E292A] dark:text-white">
                          {formatCurrency(cat.amount)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Visual 2: Bar Chart - รายรับ vs รายจ่าย */}
        <div className="lg:col-span-7 bg-white dark:bg-[#1E2120] rounded-2xl border border-[#E3E1DC]/80 dark:border-white/10 p-5 md:p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#E3E1DC]/50 dark:border-white/10">
              <div>
                <h3 className="text-base font-bold text-[#1E292A] dark:text-white">
                  เปรียบเทียบ รายรับ vs รายจ่าย
                </h3>
                <p className="text-xs text-[#717975] dark:text-[#A0A8A5]">
                  แนวโน้มทางการเงินและการหมุนเวียนกระแสเงินสด
                </p>
              </div>

              {/* Mode Toggle */}
              <div className="flex items-center p-1 bg-[#F1EFEA] dark:bg-white/5 rounded-xl border border-[#E3E1DC]/50 dark:border-white/10">
                <button
                  onClick={() => setChartViewMode('daily')}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                    chartViewMode === 'daily'
                      ? 'bg-white dark:bg-[#282C2A] text-[#1C463C] dark:text-[#BFECDD] shadow-xs'
                      : 'text-[#5A6567]'
                  }`}
                >
                  รายวันในเดือน
                </button>
                <button
                  onClick={() => setChartViewMode('monthlyTrend')}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                    chartViewMode === 'monthlyTrend'
                      ? 'bg-white dark:bg-[#282C2A] text-[#1C463C] dark:text-[#BFECDD] shadow-xs'
                      : 'text-[#5A6567]'
                  }`}
                >
                  ย้อนหลัง 6 เดือน
                </button>
              </div>
            </div>

            {/* Legend */}
            <div className="flex items-center gap-4 my-3 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-[#10B981]" />
                <span className="text-[#5A6567] dark:text-[#A0A8A5]">รายรับ (Money In)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-[#D97757]" />
                <span className="text-[#5A6567] dark:text-[#A0A8A5]">รายจ่าย (Money Out)</span>
              </div>
            </div>

            {/* Custom Responsive SVG / HTML Bar Chart */}
            {chartViewMode === 'daily' ? (
              <div className="mt-4 overflow-x-auto pb-2">
                <div className="min-w-[600px] h-48 flex items-end gap-1.5 pt-6 border-b border-[#E3E1DC]/60 dark:border-white/10">
                  {Array.from({ length: daysInMonth }).map((_, idx) => {
                    const inc = dailyStats.dailyIncome[idx];
                    const exp = dailyStats.dailyExpense[idx];
                    const incHeight = maxBarValue > 0 ? (inc / maxBarValue) * 100 : 0;
                    const expHeight = maxBarValue > 0 ? (exp / maxBarValue) * 100 : 0;

                    return (
                      <div
                        key={idx}
                        className="flex-1 flex flex-col items-center gap-1 h-full justify-end group relative"
                      >
                        {/* Tooltip on hover */}
                        {(inc > 0 || exp > 0) && (
                          <div className="absolute -top-12 z-20 hidden group-hover:flex flex-col items-center bg-[#1E292A] text-white text-[10px] p-1.5 rounded-lg whitespace-nowrap shadow-md pointer-events-none">
                            <span>วันที่ {idx + 1}</span>
                            {inc > 0 && <span className="text-[#10B981]">รับ: +฿{inc.toLocaleString()}</span>}
                            {exp > 0 && <span className="text-[#D97757]">จ่าย: -฿{exp.toLocaleString()}</span>}
                          </div>
                        )}

                        <div className="w-full flex items-end justify-center gap-0.5 h-full">
                          <div
                            className="w-1.5 sm:w-2 bg-[#10B981] rounded-t-sm transition-all"
                            style={{ height: `${Math.max(inc > 0 ? 4 : 0, incHeight)}%` }}
                          />
                          <div
                            className="w-1.5 sm:w-2 bg-[#D97757] rounded-t-sm transition-all"
                            style={{ height: `${Math.max(exp > 0 ? 4 : 0, expHeight)}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-[#717975] mt-1">{idx + 1}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="mt-6 flex items-end justify-around h-48 pt-6 border-b border-[#E3E1DC]/60 dark:border-white/10">
                {past6MonthsData.map((item, idx) => {
                  const max6 = Math.max(
                    ...past6MonthsData.map((m) => Math.max(m.income, m.expense)),
                    1000
                  );
                  const incHeight = (item.income / max6) * 100;
                  const expHeight = (item.expense / max6) * 100;

                  return (
                    <div key={idx} className="flex flex-col items-center gap-2 h-full justify-end group relative">
                      {/* Tooltip */}
                      <div className="absolute -top-12 z-20 hidden group-hover:flex flex-col items-center bg-[#1E292A] text-white text-[10px] p-1.5 rounded-lg whitespace-nowrap shadow-md pointer-events-none">
                        <span>{item.label}</span>
                        <span className="text-[#10B981]">รับ: +฿{item.income.toLocaleString()}</span>
                        <span className="text-[#D97757]">จ่าย: -฿{item.expense.toLocaleString()}</span>
                      </div>

                      <div className="flex items-end gap-1.5 h-full">
                        <div
                          className="w-4 sm:w-6 bg-[#10B981] rounded-t-md transition-all"
                          style={{ height: `${Math.max(item.income > 0 ? 4 : 0, incHeight)}%` }}
                        />
                        <div
                          className="w-4 sm:w-6 bg-[#D97757] rounded-t-md transition-all"
                          style={{ height: `${Math.max(item.expense > 0 ? 4 : 0, expHeight)}%` }}
                        />
                      </div>
                      <span className="text-xs text-[#717975] mt-1">{item.label}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* VISUALIZATION 3: Heatmap Calendar & Top Categories Leaderboard */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Heatmap Calendar */}
        <div className="lg:col-span-7 bg-white dark:bg-[#1E2120] rounded-2xl border border-[#E3E1DC]/80 dark:border-white/10 p-5 md:p-6 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-[#E3E1DC]/50 dark:border-white/10">
            <div>
              <h3 className="text-base font-bold text-[#1E292A] dark:text-white">
                ปฏิทินความหนาแน่นการใช้จ่าย (Spending Heatmap)
              </h3>
              <p className="text-xs text-[#717975] dark:text-[#A0A8A5]">
                วันที่มีการใช้จ่ายมากหรือน้อยด้วยระดับเฉดสี
              </p>
            </div>
            <div className="flex items-center gap-1 text-[11px] text-[#717975]">
              <span>น้อย</span>
              <span className="w-3 h-3 rounded-xs bg-[#FAF9F6] border border-[#E3E1DC]" />
              <span className="w-3 h-3 rounded-xs bg-[#FFDBD0]/40" />
              <span className="w-3 h-3 rounded-xs bg-[#D97757]/60" />
              <span className="w-3 h-3 rounded-xs bg-[#D97757]" />
              <span>มาก</span>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-7 gap-2">
            {['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'].map((day) => (
              <div key={day} className="text-center text-xs font-bold text-[#717975] py-1">
                {day}
              </div>
            ))}

            {/* Empty slots for first day of month */}
            {Array.from({ length: new Date(selectedYear, selectedMonth - 1, 1).getDay() }).map((_, i) => (
              <div key={`empty-${i}`} className="h-10 sm:h-12 rounded-xl bg-transparent" />
            ))}

            {/* Days of month */}
            {Array.from({ length: daysInMonth }).map((_, idx) => {
              const dayNum = idx + 1;
              const exp = dailyStats.dailyExpense[idx];
              const max = dailyStats.maxExpense || 1;
              const intensity = exp > 0 ? exp / max : 0;

              let bgClass = 'bg-[#FAF9F6] dark:bg-white/5 border-[#E3E1DC]/60 dark:border-white/5 text-[#1E292A] dark:text-white';
              if (intensity > 0.75) {
                bgClass = 'bg-[#D97757] text-white border-transparent shadow-xs';
              } else if (intensity > 0.4) {
                bgClass = 'bg-[#D97757]/60 text-white border-transparent';
              } else if (intensity > 0) {
                bgClass = 'bg-[#FFDBD0]/50 text-[#71280E] border-[#FFDBD0]';
              }

              return (
                <div
                  key={dayNum}
                  title={`วันที่ ${dayNum}: ${formatCurrency(exp)}`}
                  className={`h-10 sm:h-12 rounded-xl border p-1.5 flex flex-col justify-between transition-transform hover:scale-105 cursor-pointer ${bgClass}`}
                >
                  <span className="text-[11px] font-bold">{dayNum}</span>
                  {exp > 0 && (
                    <span className="text-[9px] font-bold truncate tabular-nums">
                      ฿{exp >= 1000 ? `${(exp / 1000).toFixed(1)}k` : exp}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Top Spending Categories Leaderboard */}
        <div className="lg:col-span-5 bg-white dark:bg-[#1E2120] rounded-2xl border border-[#E3E1DC]/80 dark:border-white/10 p-5 md:p-6 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-[#1E292A] dark:text-white mb-1">
              หมวดหมู่ยอดใช้จ่ายสูงสุด (Top Categories)
            </h3>
            <p className="text-xs text-[#717975] dark:text-[#A0A8A5] mb-4">
              อันดับค่าใช้จ่ายประจำเดือน เรียงตามยอดเงินรวม
            </p>

            <div className="space-y-3">
              {categoryStats.length === 0 ? (
                <div className="py-12 text-center text-xs text-[#717975]">
                  ยังไม่มีข้อมูลรายจ่าย
                </div>
              ) : (
                categoryStats.slice(0, 5).map((item, idx) => (
                  <div
                    key={item.categoryId}
                    className="p-3 rounded-xl bg-[#FAF9F6] dark:bg-white/5 border border-[#E3E1DC]/50 dark:border-white/5 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-6 text-xs font-extrabold text-[#717975]">
                        #{idx + 1}
                      </div>
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-white"
                        style={{ backgroundColor: item.color }}
                      >
                        <span className="material-symbols-outlined text-[18px]">
                          {item.icon}
                        </span>
                      </div>
                      <div>
                        <span className="text-xs font-bold text-[#1E292A] dark:text-white block">
                          {item.name}
                        </span>
                        <span className="text-[10px] text-[#717975]">
                          {item.percent.toFixed(1)}% ของรายจ่ายทั้งหมด
                        </span>
                      </div>
                    </div>

                    <span className="text-sm font-bold text-[#1E292A] dark:text-white tabular-nums">
                      {formatCurrency(item.amount)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

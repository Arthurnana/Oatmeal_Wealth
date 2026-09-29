import React, { useState, useEffect } from 'react';
import { useFinance } from '../context/FinanceContext';
import { Transaction, TransactionType } from '../types';
import { formatCurrency } from '../utils/formatters';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialType?: TransactionType;
  editingTransaction?: Transaction | null;
}

export const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen,
  onClose,
  initialType = 'expense',
  editingTransaction = null,
}) => {
  const { categories, accounts, addTransaction, updateTransaction, addAccount } = useFinance();

  const [type, setType] = useState<TransactionType>(initialType);
  const [amount, setAmount] = useState<string>('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [accountId, setAccountId] = useState<string>('');
  const [toAccountId, setToAccountId] = useState<string>('');
  const [date, setDate] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [note, setNote] = useState<string>('');
  const [receiptUrl, setReceiptUrl] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Format today's date in YYYY-MM-DD
  const getTodayStr = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  // Initialize form state ONLY when modal opens or editingTransaction changes
  useEffect(() => {
    if (!isOpen) return;

    if (editingTransaction) {
      setType(editingTransaction.type);
      setAmount(String(editingTransaction.amount));
      setCategoryId(editingTransaction.categoryId);
      setAccountId(editingTransaction.accountId);
      setToAccountId(editingTransaction.toAccountId || '');
      setDate(editingTransaction.date);
      setDescription(editingTransaction.description);
      setNote(editingTransaction.note || '');
      setReceiptUrl(editingTransaction.receiptUrl || '');
    } else {
      setType(initialType);
      setAmount('');
      setDate(getTodayStr());
      setDescription('');
      setNote('');
      setReceiptUrl('');

      const firstAccId = accounts.length > 0 ? accounts[0].id : '';
      setAccountId(firstAccId);
      if (accounts.length > 1) {
        setToAccountId(accounts[1].id);
      } else {
        setToAccountId('');
      }

      const matchCats = categories.filter((c) => c.type === (initialType === 'transfer' ? 'expense' : initialType));
      setCategoryId(matchCats.length > 0 ? matchCats[0].id : '');
    }
    setError('');
  }, [isOpen, editingTransaction, initialType]);

  // Ensure accountId and categoryId are populated if accounts/categories loaded after modal opened
  useEffect(() => {
    if (!isOpen) return;
    if (!accountId && accounts.length > 0) {
      setAccountId(accounts[0].id);
      if (accounts.length > 1 && !toAccountId) {
        setToAccountId(accounts[1].id);
      }
    }
    const currentCats = categories.filter((c) => c.type === (type === 'transfer' ? 'expense' : type));
    if (!categoryId && currentCats.length > 0) {
      setCategoryId(currentCats[0].id);
    }
  }, [isOpen, accounts, categories, accountId, categoryId, toAccountId, type]);

  if (!isOpen) return null;

  const filteredCategories = categories.filter(
    (c) => c.type === (type === 'transfer' ? 'expense' : type)
  );

  const handleReceiptUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setError('ขนาดไฟล์รูปภาพต้องไม่เกิน 2MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setReceiptUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleQuickAddAmount = (addValue: number) => {
    const cur = parseFloat(amount) || 0;
    setAmount((cur + addValue).toString());
  };

  // Helper if user has 0 accounts yet
  const handleCreateDefaultAccount = async () => {
    try {
      setSubmitting(true);
      await addAccount({
        name: 'เงินสด (Cash Wallet)',
        type: 'cash',
        initialBalance: 0,
        currentBalance: 0,
        color: '#1C463C',
        icon: 'payments',
      });
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('กรุณาระบุจำนวนเงินที่ถูกต้องและมากกว่า 0');
      return;
    }

    if (!accountId) {
      setError('กรุณาเลือกบัญชี/กระเป๋าเงิน (หากยังไม่มี ให้กดสร้างบัญชีก่อน)');
      return;
    }

    if (type === 'transfer') {
      if (!toAccountId) {
        setError('กรุณาเลือกบัญชีปลายทางสำหรับการโอนเงิน');
        return;
      }
      if (toAccountId === accountId) {
        setError('บัญชีต้นทางและปลายทางต้องไม่ซ้ำกัน');
        return;
      }
    } else {
      if (!categoryId) {
        setError('กรุณาเลือกหมวดหมู่');
        return;
      }
    }

    if (!description.trim()) {
      setError('กรุณากรอกรายละเอียดหรือชื่อรายการ');
      return;
    }

    try {
      setSubmitting(true);

      // Build clean payload without any undefined values
      const payload: any = {
        type,
        amount: parsedAmount,
        accountId,
        date: date || getTodayStr(),
        description: description.trim(),
      };

      if (type === 'transfer') {
        payload.toAccountId = toAccountId;
        payload.categoryId = '';
      } else {
        payload.categoryId = categoryId;
      }

      if (note && note.trim()) {
        payload.note = note.trim();
      }

      if (receiptUrl && receiptUrl.trim()) {
        payload.receiptUrl = receiptUrl;
      }

      if (editingTransaction) {
        await updateTransaction(editingTransaction.id, payload);
      } else {
        await addTransaction(payload);
      }
      onClose();
    } catch (err: any) {
      console.error('Error submitting transaction:', err);
      setError(err?.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล กรุณาลองใหม่อีกครั้ง');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs overflow-y-auto">
      <div className="w-full max-w-lg bg-white dark:bg-[#1E2120] rounded-2xl border border-[#E3E1DC] dark:border-white/10 shadow-2xl p-6 my-8 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-4 border-b border-[#E3E1DC]/60 dark:border-white/10">
          <h2 className="text-xl font-bold text-[#1E292A] dark:text-white">
            {editingTransaction ? 'แก้ไขรายการ' : 'เพิ่มรายการใหม่'}
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-[#717975] hover:bg-[#F1EFEA] dark:hover:bg-white/10 transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-xl bg-[#FFDAD6] border border-[#FFB4AB] text-[#93000A] text-xs flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">error</span>
            <span className="break-all">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {/* Transaction Type Segmented Control */}
          <div>
            <label className="block text-xs font-semibold text-[#5A6567] dark:text-[#A0A8A5] uppercase tracking-wider mb-2">
              ประเภทรายการ
            </label>
            <div className="grid grid-cols-3 gap-1.5 p-1 bg-[#F1EFEA] dark:bg-white/5 rounded-xl border border-[#E3E1DC]/40 dark:border-white/5">
              <button
                type="button"
                onClick={() => {
                  setType('expense');
                  const match = categories.find((c) => c.type === 'expense');
                  if (match) setCategoryId(match.id);
                }}
                className={`py-2 px-3 rounded-lg text-sm font-semibold flex items-center justify-center gap-1.5 transition-all ${
                  type === 'expense'
                    ? 'bg-white dark:bg-[#2A2E2C] text-[#D97757] shadow-xs'
                    : 'text-[#5A6567] dark:text-[#A0A8A5] hover:text-[#1E292A]'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">remove_circle</span>
                <span>รายจ่าย</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setType('income');
                  const match = categories.find((c) => c.type === 'income');
                  if (match) setCategoryId(match.id);
                }}
                className={`py-2 px-3 rounded-lg text-sm font-semibold flex items-center justify-center gap-1.5 transition-all ${
                  type === 'income'
                    ? 'bg-white dark:bg-[#2A2E2C] text-[#047857] shadow-xs'
                    : 'text-[#5A6567] dark:text-[#A0A8A5] hover:text-[#1E292A]'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">add_circle</span>
                <span>รายรับ</span>
              </button>

              <button
                type="button"
                onClick={() => setType('transfer')}
                className={`py-2 px-3 rounded-lg text-sm font-semibold flex items-center justify-center gap-1.5 transition-all ${
                  type === 'transfer'
                    ? 'bg-white dark:bg-[#2A2E2C] text-[#2B7A78] shadow-xs'
                    : 'text-[#5A6567] dark:text-[#A0A8A5] hover:text-[#1E292A]'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">swap_horiz</span>
                <span>โอนเงิน</span>
              </button>
            </div>
          </div>

          {/* Amount Field */}
          <div>
            <label className="block text-xs font-semibold text-[#5A6567] dark:text-[#A0A8A5] uppercase tracking-wider mb-1.5">
              จำนวนเงิน (บาท)
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-[#717975]">
                ฿
              </span>
              <input
                type="number"
                step="any"
                min="0.01"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full pl-10 pr-4 py-3 bg-[#FAF9F6] dark:bg-white/5 border border-[#E3E1DC] dark:border-white/10 rounded-xl text-2xl font-bold text-[#1E292A] dark:text-white placeholder:text-[#A0A8A5] focus:outline-none focus:border-[#2B7A78] focus:ring-2 focus:ring-[#2B7A78]/20 tabular-nums"
              />
            </div>
            {/* Quick Amount Pills */}
            <div className="flex items-center gap-2 mt-2">
              <span className="text-xs text-[#717975]">บวกเพิ่ม:</span>
              {[50, 100, 500, 1000].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => handleQuickAddAmount(val)}
                  className="px-2.5 py-1 text-xs font-medium rounded-full bg-[#F1EFEA] hover:bg-[#E3E1DC] dark:bg-white/5 dark:hover:bg-white/10 text-[#1E292A] dark:text-white transition-colors"
                >
                  +{val}
                </button>
              ))}
            </div>
          </div>

          {/* Date & Account row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-[#5A6567] dark:text-[#A0A8A5] uppercase tracking-wider">
                  วันที่
                </label>
                <div className="flex gap-1 text-[11px] text-[#2B7A78]">
                  <button
                    type="button"
                    onClick={() => setDate(getTodayStr())}
                    className="hover:underline"
                  >
                    วันนี้
                  </button>
                  <span>•</span>
                  <button
                    type="button"
                    onClick={() => {
                      const y = new Date();
                      y.setDate(y.getDate() - 1);
                      setDate(`${y.getFullYear()}-${String(y.getMonth() + 1).padStart(2, '0')}-${String(y.getDate()).padStart(2, '0')}`);
                    }}
                    className="hover:underline"
                  >
                    เมื่อวาน
                  </button>
                </div>
              </div>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2.5 bg-[#FAF9F6] dark:bg-white/5 border border-[#E3E1DC] dark:border-white/10 rounded-xl text-sm text-[#1E292A] dark:text-white focus:outline-none focus:border-[#2B7A78]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#5A6567] dark:text-[#A0A8A5] uppercase tracking-wider mb-1.5">
                {type === 'transfer' ? 'บัญชีต้นทาง (หักเงิน)' : 'บัญชี / กระเป๋าเงิน'}
              </label>
              {accounts.length === 0 ? (
                <button
                  type="button"
                  onClick={handleCreateDefaultAccount}
                  className="w-full px-3 py-2.5 bg-[#BFECDD] text-[#1C463C] text-xs font-bold rounded-xl"
                >
                  + สร้างกระเป๋าเงินสดเริ่มต้น
                </button>
              ) : (
                <select
                  value={accountId}
                  onChange={(e) => setAccountId(e.target.value)}
                  className="w-full px-3 py-2.5 bg-[#FAF9F6] dark:bg-white/5 border border-[#E3E1DC] dark:border-white/10 rounded-xl text-sm text-[#1E292A] dark:text-white focus:outline-none focus:border-[#2B7A78]"
                >
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name} ({formatCurrency(acc.currentBalance)})
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {/* Transfer Destination or Category */}
          {type === 'transfer' ? (
            <div>
              <label className="block text-xs font-semibold text-[#5A6567] dark:text-[#A0A8A5] uppercase tracking-wider mb-1.5">
                บัญชีปลายทาง (รับเงิน)
              </label>
              <select
                value={toAccountId}
                onChange={(e) => setToAccountId(e.target.value)}
                className="w-full px-3 py-2.5 bg-[#FAF9F6] dark:bg-white/5 border border-[#E3E1DC] dark:border-white/10 rounded-xl text-sm text-[#1E292A] dark:text-white focus:outline-none focus:border-[#2B7A78]"
              >
                {accounts
                  .filter((a) => a.id !== accountId)
                  .map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name} ({formatCurrency(acc.currentBalance)})
                    </option>
                  ))}
              </select>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-semibold text-[#5A6567] dark:text-[#A0A8A5] uppercase tracking-wider mb-1.5">
                หมวดหมู่
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-3 py-2.5 bg-[#FAF9F6] dark:bg-white/5 border border-[#E3E1DC] dark:border-white/10 rounded-xl text-sm text-[#1E292A] dark:text-white focus:outline-none focus:border-[#2B7A78]"
              >
                {filteredCategories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-[#5A6567] dark:text-[#A0A8A5] uppercase tracking-wider mb-1.5">
              รายละเอียดรายการ
            </label>
            <input
              type="text"
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={type === 'income' ? 'เช่น เงินเดือนประจำ, ค่าจ้างฟรีแลนซ์' : 'เช่น ข้าวเที่ยง, กาแฟ, บิลค่าน้ำไฟ'}
              className="w-full px-3.5 py-2.5 bg-[#FAF9F6] dark:bg-white/5 border border-[#E3E1DC] dark:border-white/10 rounded-xl text-sm text-[#1E292A] dark:text-white placeholder:text-[#A0A8A5] focus:outline-none focus:border-[#2B7A78]"
            />
          </div>

          {/* Note */}
          <div>
            <label className="block text-xs font-semibold text-[#5A6567] dark:text-[#A0A8A5] uppercase tracking-wider mb-1.5">
              หมายเหตุเพิ่มเติม (ถ้ามี)
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="บันทึกข้อความช่วยจำ..."
              className="w-full px-3.5 py-2 bg-[#FAF9F6] dark:bg-white/5 border border-[#E3E1DC] dark:border-white/10 rounded-xl text-sm text-[#1E292A] dark:text-white placeholder:text-[#A0A8A5] focus:outline-none focus:border-[#2B7A78]"
            />
          </div>

          {/* Receipt Image Upload */}
          <div>
            <label className="block text-xs font-semibold text-[#5A6567] dark:text-[#A0A8A5] uppercase tracking-wider mb-1.5">
              แนบรูปใบเสร็จ / สลิปโอนเงิน (ถ้ามี)
            </label>
            {receiptUrl ? (
              <div className="relative inline-block border border-[#E3E1DC] dark:border-white/10 rounded-xl overflow-hidden">
                <img
                  src={receiptUrl}
                  alt="Receipt preview"
                  className="w-32 h-32 object-cover"
                />
                <button
                  type="button"
                  onClick={() => setReceiptUrl('')}
                  className="absolute top-1 right-1 w-6 h-6 rounded-full bg-red-600 text-white flex items-center justify-center text-xs shadow-md"
                >
                  ✕
                </button>
              </div>
            ) : (
              <label className="flex items-center gap-2 px-3 py-2 bg-[#FAF9F6] dark:bg-white/5 border border-dashed border-[#E3E1DC] dark:border-white/20 rounded-xl cursor-pointer hover:bg-[#F1EFEA] dark:hover:bg-white/10 text-xs text-[#5A6567] dark:text-[#A0A8A5] transition-colors">
                <span className="material-symbols-outlined text-[18px]">receipt_long</span>
                <span>อัปโหลดรูปภาพใบเสร็จ / สลิปโอน</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleReceiptUpload}
                  className="hidden"
                />
              </label>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#E3E1DC]/60 dark:border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-[#E3E1DC] dark:border-white/10 text-sm font-semibold text-[#5A6567] dark:text-[#A0A8A5] hover:bg-[#F1EFEA] dark:hover:bg-white/5 transition-colors"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 rounded-xl bg-[#1C463C] hover:bg-[#355E53] text-white text-sm font-semibold shadow-md active:scale-98 transition-all flex items-center gap-2"
            >
              {submitting && (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              )}
              <span>{editingTransaction ? 'บันทึกการแก้ไข' : 'บันทึกรายการ'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

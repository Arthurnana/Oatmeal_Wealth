import React, { useState, useEffect } from 'react';
import { useFinance } from '../context/FinanceContext';
import { Category, CategoryType } from '../types';

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingCategory?: Category | null;
  defaultType?: CategoryType;
}

const AVAILABLE_ICONS = [
  'restaurant', 'shopping_bag', 'home', 'directions_car', 'bolt',
  'medical_services', 'movie', 'school', 'favorite', 'credit_card',
  'work', 'laptop', 'storefront', 'redeem', 'trending_up', 'savings',
  'pets', 'flight', 'sports_esports', 'fitness_center', 'coffee',
  'local_gas_station', 'phone_iphone', 'child_care', 'more_horiz'
];

const AVAILABLE_COLORS = [
  '#1C463C', '#126967', '#2B7A78', '#355E53', '#D97757',
  '#71280E', '#10B981', '#059669', '#0284C7', '#2563EB',
  '#8B5CF6', '#EC4899', '#DC2626', '#F59E0B', '#64748B'
];

export const CategoryModal: React.FC<CategoryModalProps> = ({
  isOpen,
  onClose,
  editingCategory = null,
  defaultType = 'expense',
}) => {
  const { addCategory, updateCategory } = useFinance();

  const [name, setName] = useState('');
  const [type, setType] = useState<CategoryType>(defaultType);
  const [icon, setIcon] = useState('restaurant');
  const [color, setColor] = useState('#126967');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (editingCategory) {
      setName(editingCategory.name);
      setType(editingCategory.type);
      setIcon(editingCategory.icon);
      setColor(editingCategory.color);
    } else {
      setName('');
      setType(defaultType);
      setIcon(defaultType === 'income' ? 'work' : 'restaurant');
      setColor(defaultType === 'income' ? '#10B981' : '#126967');
    }
    setError('');
  }, [editingCategory, defaultType, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('กรุณาระบุชื่อหมวดหมู่');
      return;
    }

    try {
      setSubmitting(true);
      if (editingCategory) {
        await updateCategory(editingCategory.id, {
          name: name.trim(),
          type,
          icon,
          color,
        });
      } else {
        await addCategory({
          name: name.trim(),
          type,
          icon,
          color,
        });
      }
      onClose();
    } catch {
      setError('เกิดข้อผิดพลาดในการบันทึกหมวดหมู่');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div className="w-full max-w-md bg-white dark:bg-[#1E2120] rounded-2xl border border-[#E3E1DC] dark:border-white/10 shadow-2xl p-6 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-3 border-b border-[#E3E1DC]/60 dark:border-white/10">
          <h2 className="text-lg font-bold text-[#1E292A] dark:text-white">
            {editingCategory ? 'แก้ไขหมวดหมู่' : 'เพิ่มหมวดหมู่ใหม่'}
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
              ประเภทหมวดหมู่
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setType('expense')}
                className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                  type === 'expense'
                    ? 'bg-[#FFDBD0] text-[#71280E] ring-1 ring-[#D97757]'
                    : 'bg-[#F1EFEA] text-[#5A6567] hover:text-[#1E292A]'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">remove_circle</span>
                <span>หมวดหมู่รายจ่าย</span>
              </button>
              <button
                type="button"
                onClick={() => setType('income')}
                className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                  type === 'income'
                    ? 'bg-[#BFECDD] text-[#1C463C] ring-1 ring-[#10B981]'
                    : 'bg-[#F1EFEA] text-[#5A6567] hover:text-[#1E292A]'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">add_circle</span>
                <span>หมวดหมู่รายรับ</span>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#5A6567] dark:text-[#A0A8A5] uppercase tracking-wider mb-1.5">
              ชื่อหมวดหมู่
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="เช่น อาหารคลีน, ค่าฟิตเนส, เงินปันผลหุ้น"
              className="w-full px-3.5 py-2.5 bg-[#FAF9F6] dark:bg-white/5 border border-[#E3E1DC] dark:border-white/10 rounded-xl text-sm text-[#1E292A] dark:text-white focus:outline-none focus:border-[#2B7A78]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#5A6567] dark:text-[#A0A8A5] uppercase tracking-wider mb-2">
              เลือกไอคอน
            </label>
            <div className="grid grid-cols-5 gap-2 max-h-36 overflow-y-auto p-1.5 bg-[#FAF9F6] dark:bg-white/5 rounded-xl border border-[#E3E1DC]/60 dark:border-white/10">
              {AVAILABLE_ICONS.map((ic) => (
                <button
                  key={ic}
                  type="button"
                  onClick={() => setIcon(ic)}
                  className={`h-10 rounded-lg flex items-center justify-center transition-all ${
                    icon === ic
                      ? 'bg-[#1C463C] text-white shadow-xs'
                      : 'text-[#5A6567] hover:bg-[#E3E1DC] dark:text-white dark:hover:bg-white/10'
                  }`}
                >
                  <span className="material-symbols-outlined text-[20px]">{ic}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#5A6567] dark:text-[#A0A8A5] uppercase tracking-wider mb-2">
              เลือกโทนสี
            </label>
            <div className="flex flex-wrap gap-2">
              {AVAILABLE_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  style={{ backgroundColor: c }}
                  className={`w-7 h-7 rounded-full transition-transform ${
                    color === c ? 'scale-115 ring-2 ring-offset-2 ring-[#1C463C]' : 'opacity-85 hover:scale-105'
                  }`}
                />
              ))}
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
              {submitting ? 'กำลังบันทึก...' : 'บันทึกหมวดหมู่'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

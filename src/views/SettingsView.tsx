import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useFinance } from '../context/FinanceContext';
import { formatCurrency, formatDateThai } from '../utils/formatters';
import { ConfirmationModal } from '../components/ConfirmationModal';

interface SettingsViewProps {
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ theme, onToggleTheme }) => {
  const { userProfile, updateProfile, signOut, deleteAccountData } = useAuth();
  const { transactions, categories, accounts, resetToDefaults, showToast } = useFinance();

  const [notificationsEnabled, setNotificationsEnabled] = useState(
    userProfile?.notificationsEnabled ?? true
  );
  const [currency, setCurrency] = useState(userProfile?.currency || 'THB');

  // Export Date Range state
  const now = new Date();
  const firstDayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
  const lastDayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()).padStart(2, '0')}`;

  const [exportStart, setExportStart] = useState(firstDayStr);
  const [exportEnd, setExportEnd] = useState(lastDayStr);

  // Modals
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [isDeleteConfirmStep1, setIsDeleteConfirmStep1] = useState(false);
  const [isDeleteConfirmStep2, setIsDeleteConfirmStep2] = useState(false);

  const handleSavePreferences = async () => {
    try {
      await updateProfile({
        currency,
        notificationsEnabled,
      });
      showToast('บันทึกการตั้งค่าเรียบร้อยแล้ว');
    } catch {
      showToast('ไม่สามารถบันทึกการตั้งค่าได้', 'error');
    }
  };

  // Export CSV / Excel
  const handleExportCSV = (isExcel = false) => {
    const list = transactions.filter((t) => {
      return (!exportStart || t.date >= exportStart) && (!exportEnd || t.date <= exportEnd);
    });

    if (list.length === 0) {
      showToast('ไม่พบรายการในช่วงวันที่ที่ระบุ', 'info');
      return;
    }

    const headers = ['วันที่ (Date)', 'ประเภท (Type)', 'หมวดหมู่ (Category)', 'รายละเอียด (Description)', 'บัญชี (Account)', 'จำนวนเงิน (Amount)', 'หมายเหตุ (Note)'];
    const rows = list.map((t) => {
      const cat = categories.find((c) => c.id === t.categoryId)?.name || '';
      const acc = accounts.find((a) => a.id === t.accountId)?.name || '';
      const typeLabel = t.type === 'income' ? 'รายรับ' : t.type === 'expense' ? 'รายจ่าย' : 'โอนเงิน';
      return [
        t.date,
        typeLabel,
        `"${cat.replace(/"/g, '""')}"`,
        `"${t.description.replace(/"/g, '""')}"`,
        `"${acc.replace(/"/g, '""')}"`,
        t.amount,
        `"${(t.note || '').replace(/"/g, '""')}"`,
      ].join(',');
    });

    // UTF-8 BOM for Thai Excel support
    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Oatmeal_Wealth_${exportStart}_to_${exportEnd}.${isExcel ? 'csv' : 'csv'}`;
    link.click();
    URL.revokeObjectURL(url);
    showToast(`ส่งออกข้อมูลสำเร็จ (${list.length} รายการ)`);
  };

  // Backup JSON Data
  const handleBackupJSON = () => {
    const backupData = {
      exportedAt: new Date().toISOString(),
      user: userProfile,
      transactions,
      categories,
      accounts,
    };
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
      JSON.stringify(backupData, null, 2)
    )}`;
    const link = document.createElement('a');
    link.href = jsonString;
    link.download = `Oatmeal_Wealth_Backup_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    showToast('ดาวน์โหลดไฟล์สำรองข้อมูล (JSON) สำเร็จ');
  };

  // Print Report
  const handlePrint = () => {
    window.print();
  };

  const handleResetConfirm = async () => {
    await resetToDefaults();
    setIsResetConfirmOpen(false);
  };

  const handleDeleteStep1 = () => {
    setIsDeleteConfirmStep1(false);
    setIsDeleteConfirmStep2(true);
  };

  const handleDeleteStep2 = async () => {
    setIsDeleteConfirmStep2(false);
    await deleteAccountData();
  };

  return (
    <div className="w-full max-w-[1360px] mx-auto pt-6 flex flex-col gap-6">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold text-[#1E292A] dark:text-white tracking-tight">
          การตั้งค่า (Settings &amp; Preferences)
        </h1>
        <p className="text-xs text-[#717975] dark:text-[#A0A8A5] mt-0.5">
          จัดการข้อมูลส่วนตัว สกุลเงิน การส่งออกรายงาน และความปลอดภัยของบัญชี
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: User Profile & System Preferences */}
        <div className="lg:col-span-6 space-y-6">
          {/* User Profile Card */}
          <div className="bg-white dark:bg-[#1E2120] rounded-2xl border border-[#E3E1DC]/80 dark:border-white/10 p-5 md:p-6 shadow-xs">
            <h2 className="text-base font-bold text-[#1E292A] dark:text-white mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-[#1C463C] dark:text-[#BFECDD]">
                badge
              </span>
              <span>บัญชีผู้ใช้งาน (Google Profile)</span>
            </h2>

            <div className="flex items-center gap-4">
              {userProfile?.avatar ? (
                <img
                  src={userProfile.avatar}
                  alt={userProfile.name}
                  className="w-16 h-16 rounded-full object-cover ring-2 ring-[#1C463C]/20 shadow-xs"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-[#1C463C] text-white flex items-center justify-center font-bold text-xl">
                  {userProfile?.name?.charAt(0) || 'U'}
                </div>
              )}

              <div className="space-y-1">
                <h3 className="text-base font-bold text-[#1E292A] dark:text-white">
                  {userProfile?.name}
                </h3>
                <p className="text-xs text-[#5A6567] dark:text-[#A0A8A5]">
                  {userProfile?.email}
                </p>
                <div className="flex items-center gap-1.5 pt-1">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-[#047857] text-[11px] font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#047857]" />
                    เชื่อมต่อ Google แล้ว
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* System Settings Card */}
          <div className="bg-white dark:bg-[#1E2120] rounded-2xl border border-[#E3E1DC]/80 dark:border-white/10 p-5 md:p-6 shadow-xs space-y-4">
            <h2 className="text-base font-bold text-[#1E292A] dark:text-white flex items-center gap-2">
              <span className="material-symbols-outlined text-[#1C463C] dark:text-[#BFECDD]">
                tune
              </span>
              <span>การตั้งค่าระบบ (Preferences)</span>
            </h2>

            {/* Currency */}
            <div>
              <label className="block text-xs font-semibold text-[#5A6567] dark:text-[#A0A8A5] uppercase tracking-wider mb-1.5">
                สกุลเงินหลัก
              </label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#FAF9F6] dark:bg-white/5 border border-[#E3E1DC] dark:border-white/10 rounded-xl text-sm text-[#1E292A] dark:text-white focus:outline-none focus:border-[#2B7A78]"
              >
                <option value="THB">บาทไทย (฿ - THB)</option>
                <option value="USD">ดอลลาร์สหรัฐ ($ - USD)</option>
                <option value="EUR">ยูโร (€ - EUR)</option>
                <option value="JPY">เยนญี่ปุ่น (¥ - JPY)</option>
              </select>
            </div>

            {/* Theme Toggle */}
            <div className="flex items-center justify-between pt-2">
              <div>
                <span className="text-xs font-bold text-[#1E292A] dark:text-white block">
                  ธีมการแสดงผล (Theme)
                </span>
                <span className="text-[11px] text-[#717975] dark:text-[#A0A8A5]">
                  สลับระหว่างโหมดสว่าง (Warm Oatmeal) และโหมดมืด
                </span>
              </div>
              <button
                onClick={onToggleTheme}
                className="px-4 py-2 rounded-xl bg-[#F4F3F0] dark:bg-white/10 border border-[#E3E1DC] dark:border-white/10 text-xs font-semibold flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-[16px]">
                  {theme === 'dark' ? 'light_mode' : 'dark_mode'}
                </span>
                <span>{theme === 'dark' ? 'โหมดสว่าง' : 'โหมดมืด'}</span>
              </button>
            </div>

            {/* Notifications Toggle */}
            <div className="flex items-center justify-between pt-2">
              <div>
                <span className="text-xs font-bold text-[#1E292A] dark:text-white block">
                  การแจ้งเตือนในระบบ
                </span>
                <span className="text-[11px] text-[#717975] dark:text-[#A0A8A5]">
                  แจ้งเตือนเมื่อใช้จ่ายใกล้หรือเกินงบประมาณที่กำหนด
                </span>
              </div>
              <button
                type="button"
                onClick={() => setNotificationsEnabled(!notificationsEnabled)}
                className={`w-12 h-6 rounded-full transition-colors relative ${
                  notificationsEnabled ? 'bg-[#1C463C]' : 'bg-[#E3E1DC] dark:bg-white/20'
                }`}
              >
                <span
                  className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-transform ${
                    notificationsEnabled ? 'left-6.5' : 'left-0.5'
                  }`}
                />
              </button>
            </div>

            <div className="pt-2">
              <button
                onClick={handleSavePreferences}
                className="w-full py-2.5 bg-[#1C463C] hover:bg-[#355E53] text-white rounded-xl text-xs font-semibold shadow-xs"
              >
                บันทึกการตั้งค่า
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Export, Backup & Danger Zone */}
        <div className="lg:col-span-6 space-y-6">
          {/* Export Data Card */}
          <div className="bg-white dark:bg-[#1E2120] rounded-2xl border border-[#E3E1DC]/80 dark:border-white/10 p-5 md:p-6 shadow-xs space-y-4">
            <h2 className="text-base font-bold text-[#1E292A] dark:text-white flex items-center gap-2">
              <span className="material-symbols-outlined text-[#1C463C] dark:text-[#BFECDD]">
                file_download
              </span>
              <span>ส่งออกข้อมูล (Export Data)</span>
            </h2>
            <p className="text-xs text-[#717975] dark:text-[#A0A8A5]">
              เลือกช่วงเวลาที่ต้องการส่งออกรายงานเป็นไฟล์ CSV, Excel หรือรายงานแบบพิมพ์
            </p>

            {/* Date Range Picker for Export */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-xs font-semibold text-[#5A6567] dark:text-[#A0A8A5] uppercase tracking-wider mb-1">
                  ตั้งแต่วันที่
                </label>
                <input
                  type="date"
                  value={exportStart}
                  onChange={(e) => setExportStart(e.target.value)}
                  className="w-full px-3 py-2 bg-[#FAF9F6] dark:bg-white/5 border border-[#E3E1DC] dark:border-white/10 rounded-xl text-xs text-[#1E292A] dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#5A6567] dark:text-[#A0A8A5] uppercase tracking-wider mb-1">
                  ถึงวันที่
                </label>
                <input
                  type="date"
                  value={exportEnd}
                  onChange={(e) => setExportEnd(e.target.value)}
                  className="w-full px-3 py-2 bg-[#FAF9F6] dark:bg-white/5 border border-[#E3E1DC] dark:border-white/10 rounded-xl text-xs text-[#1E292A] dark:text-white"
                />
              </div>
            </div>

            {/* Export Buttons */}
            <div className="grid grid-cols-3 gap-2 pt-2">
              <button
                onClick={() => handleExportCSV(false)}
                className="py-2.5 px-3 rounded-xl bg-[#F4F3F0] dark:bg-white/5 hover:bg-[#E3E1DC] dark:hover:bg-white/10 border border-[#E3E1DC] dark:border-white/10 text-xs font-semibold text-[#1E292A] dark:text-white flex flex-col items-center gap-1 transition-colors"
              >
                <span className="material-symbols-outlined text-[20px] text-[#0284C7]">description</span>
                <span>Export CSV</span>
              </button>
              <button
                onClick={() => handleExportCSV(true)}
                className="py-2.5 px-3 rounded-xl bg-[#F4F3F0] dark:bg-white/5 hover:bg-[#E3E1DC] dark:hover:bg-white/10 border border-[#E3E1DC] dark:border-white/10 text-xs font-semibold text-[#1E292A] dark:text-white flex flex-col items-center gap-1 transition-colors"
              >
                <span className="material-symbols-outlined text-[20px] text-[#047857]">table_view</span>
                <span>Excel (CSV)</span>
              </button>
              <button
                onClick={handlePrint}
                className="py-2.5 px-3 rounded-xl bg-[#F4F3F0] dark:bg-white/5 hover:bg-[#E3E1DC] dark:hover:bg-white/10 border border-[#E3E1DC] dark:border-white/10 text-xs font-semibold text-[#1E292A] dark:text-white flex flex-col items-center gap-1 transition-colors"
              >
                <span className="material-symbols-outlined text-[20px] text-[#71280E]">print</span>
                <span>พิมพ์รายงาน (PDF)</span>
              </button>
            </div>

            {/* JSON Backup Button */}
            <div className="pt-2">
              <button
                onClick={handleBackupJSON}
                className="w-full py-2.5 px-4 rounded-xl bg-[#F4F3F0] dark:bg-white/5 hover:bg-[#E3E1DC] dark:hover:bg-white/10 border border-[#E3E1DC] dark:border-white/10 text-xs font-semibold text-[#1E292A] dark:text-white flex items-center justify-center gap-2 transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">cloud_download</span>
                <span>สำรองข้อมูลทั้งหมดเป็น JSON (Backup)</span>
              </button>
            </div>
          </div>

          {/* Danger Zone Card */}
          <div className="bg-white dark:bg-[#1E2120] rounded-2xl border border-red-200 dark:border-red-950/40 p-5 md:p-6 shadow-xs space-y-4">
            <h2 className="text-base font-bold text-[#BA1A1A] flex items-center gap-2">
              <span className="material-symbols-outlined">warning</span>
              <span>พื้นที่ควบคุมพิเศษ (Danger Zone)</span>
            </h2>

            <div className="space-y-3">
              {/* Reset to Sample / Default */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-[#FAF9F6] dark:bg-white/5">
                <div>
                  <span className="text-xs font-bold text-[#1E292A] dark:text-white block">
                    รีเซ็ตรายการธุรกรรม
                  </span>
                  <span className="text-[11px] text-[#717975] dark:text-[#A0A8A5]">
                    ลบประวัติรายการธุรกรรมทั้งหมดและเริ่มใหม่
                  </span>
                </div>
                <button
                  onClick={() => setIsResetConfirmOpen(true)}
                  className="px-3 py-1.5 rounded-lg border border-[#D97757] text-[#D97757] hover:bg-[#FFDAD6]/30 text-xs font-semibold"
                >
                  รีเซ็ต
                </button>
              </div>

              {/* Sign Out */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-[#FAF9F6] dark:bg-white/5">
                <div>
                  <span className="text-xs font-bold text-[#1E292A] dark:text-white block">
                    ออกจากระบบ
                  </span>
                  <span className="text-[11px] text-[#717975] dark:text-[#A0A8A5]">
                    ออกจากบัญชี Google ในอุปกรณ์นี้
                  </span>
                </div>
                <button
                  onClick={() => signOut()}
                  className="px-3 py-1.5 rounded-lg border border-[#717975] text-[#5A6567] dark:text-[#A0A8A5] hover:bg-[#F4F3F0] dark:hover:bg-white/10 text-xs font-semibold"
                >
                  Sign Out
                </button>
              </div>

              {/* Delete Account */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-950/40">
                <div>
                  <span className="text-xs font-bold text-[#BA1A1A] block">
                    ลบบัญชีและข้อมูลทั้งหมด
                  </span>
                  <span className="text-[11px] text-red-700/80 dark:text-red-300">
                    การดำเนินการนี้ไม่สามารถย้อนกลับได้ มีการยืนยัน 2 ขั้นตอน
                  </span>
                </div>
                <button
                  onClick={() => setIsDeleteConfirmStep1(true)}
                  className="px-3 py-1.5 rounded-lg bg-[#BA1A1A] text-white hover:bg-[#93000A] text-xs font-bold shadow-2xs"
                >
                  ลบบัญชี
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modals */}
      <ConfirmationModal
        isOpen={isResetConfirmOpen}
        title="ยืนยันการรีเซ็ตข้อมูลธุรกรรม"
        message="คุณแน่ใจหรือไม่ว่าต้องการลบรายการธุรกรรมและงบประมาณทั้งหมด? หมวดหมู่และบัญชีจะยังคงอยู่"
        confirmLabel="รีเซ็ตข้อมูล"
        cancelLabel="ยกเลิก"
        isDanger={true}
        onConfirm={handleResetConfirm}
        onCancel={() => setIsResetConfirmOpen(false)}
      />

      {/* Step 1 Delete Confirm */}
      <ConfirmationModal
        isOpen={isDeleteConfirmStep1}
        title="ขั้นตอนที่ 1/2: ยืนยันการลบบัญชีผู้ใช้"
        message="คุณต้องการลบบัญชีของคุณอย่างถาวรหรือไม่? ข้อมูลทั้งหมดบนระบบคลาวด์จะถูกลบออกจากฐานข้อมูล Firestore"
        confirmLabel="ถัดไป เพื่อยืนยันอีกครั้ง"
        cancelLabel="ยกเลิก"
        isDanger={true}
        onConfirm={handleDeleteStep1}
        onCancel={() => setIsDeleteConfirmStep1(false)}
      />

      {/* Step 2 Delete Confirm */}
      <ConfirmationModal
        isOpen={isDeleteConfirmStep2}
        title="ขั้นตอนที่ 2/2: ยืนยันครั้งสุดท้าย"
        message="โปรดยืนยันอีกครั้ง! เมื่อกดลบแล้ว ข้อมูลธุรกรรม บัญชี งบประมาณ และการตั้งค่าทั้งหมดจะไม่สามารถกู้คืนได้อีก"
        confirmLabel="ยืนยันลบบัญชีและข้อมูลถาวร"
        cancelLabel="ยกเลิก"
        isDanger={true}
        onConfirm={handleDeleteStep2}
        onCancel={() => setIsDeleteConfirmStep2(false)}
      />
    </div>
  );
};

/**
 * Financial and Date formatters for Oatmeal Wealth
 */

export const THAI_MONTHS = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน',
  'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม',
  'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
];

export const THAI_MONTHS_SHORT = [
  'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.',
  'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.',
  'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
];

export function formatCurrency(amount: number, currency = 'THB'): string {
  const sign = amount < 0 ? '-' : '';
  const absAmount = Math.abs(amount);
  const formatted = absAmount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  if (currency === 'THB') {
    return `${sign}฿${formatted}`;
  } else if (currency === 'USD') {
    return `${sign}$${formatted}`;
  } else if (currency === 'EUR') {
    return `${sign}€${formatted}`;
  } else if (currency === 'JPY') {
    return `${sign}¥${Math.round(absAmount).toLocaleString('en-US')}`;
  }
  return `${sign}${currency} ${formatted}`;
}

export function formatDateThai(dateString: string, includeYear = true): string {
  if (!dateString) return '';
  try {
    const parts = dateString.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const monthIndex = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);

      const today = new Date();
      const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      
      const yesterday = new Date();
      yesterday.setDate(today.getDate() - 1);
      const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;

      if (dateString === todayStr) {
        return 'วันนี้';
      }
      if (dateString === yesterdayStr) {
        return 'เมื่อวานนี้';
      }

      const monthName = THAI_MONTHS_SHORT[monthIndex] || '';
      return includeYear ? `${day} ${monthName} ${year}` : `${day} ${monthName}`;
    }
    return dateString;
  } catch {
    return dateString;
  }
}

export function formatMonthYearThai(month: number, year: number): string {
  const monthName = THAI_MONTHS[month - 1] || '';
  return `${monthName} ${year}`;
}

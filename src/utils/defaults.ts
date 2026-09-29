import { Category, Account, Budget } from '../types';

export const DEFAULT_CATEGORIES = [
  // Expenses
  { id: 'cat-housing', name: 'ที่พักอาศัย / ค่าเช่า (Housing)', type: 'expense', icon: 'home', color: '#1C463C' },
  { id: 'cat-groceries', name: 'อาหารและเครื่องดื่ม (Groceries & Dining)', type: 'expense', icon: 'restaurant', color: '#126967' },
  { id: 'cat-leisure', name: 'ช้อปปิ้งและไลฟ์สไตล์ (Leisure & Personal)', type: 'expense', icon: 'shopping_bag', color: '#D97757' },
  { id: 'cat-transport', name: 'ค่าเดินทางและยานพาหนะ (Transport & Auto)', type: 'expense', icon: 'directions_car', color: '#355E53' },
  { id: 'cat-utilities', name: 'บิลและสาธารณูปโภค (Utilities & Internet)', type: 'expense', icon: 'bolt', color: '#0284C7' },
  { id: 'cat-health', name: 'สุขภาพและการรักษา (Health)', type: 'expense', icon: 'medical_services', color: '#E11D48' },
  { id: 'cat-entertainment', name: 'ความบันเทิงและการพักผ่อน (Entertainment)', type: 'expense', icon: 'movie', color: '#8B5CF6' },
  { id: 'cat-education', name: 'การศึกษาและพัฒนาตนเอง (Education)', type: 'expense', icon: 'school', color: '#F59E0B' },
  { id: 'cat-family', name: 'ครอบครัวและของขวัญ (Family)', type: 'expense', icon: 'favorite', color: '#EC4899' },
  { id: 'cat-debt', name: 'หนี้สินและผ่อนชำระ (Debts)', type: 'expense', icon: 'credit_card', color: '#DC2626' },
  { id: 'cat-other-exp', name: 'ค่าใช้จ่ายอื่น ๆ (Other)', type: 'expense', icon: 'more_horiz', color: '#64748B' },
  
  // Incomes
  { id: 'cat-salary', name: 'เงินเดือนประจำ (Salary)', type: 'income', icon: 'work', color: '#10B981' },
  { id: 'cat-freelance', name: 'งานเสริม / ฟรีแลนซ์ (Freelance)', type: 'income', icon: 'laptop', color: '#059669' },
  { id: 'cat-business', name: 'ธุรกิจส่วนตัว (Business)', type: 'income', icon: 'storefront', color: '#0D9488' },
  { id: 'cat-bonus', name: 'โบนัสและเงินรางวัล (Bonus)', type: 'income', icon: 'redeem', color: '#16A34A' },
  { id: 'cat-investment', name: 'เงินปันผลและการลงทุน (Dividends)', type: 'income', icon: 'trending_up', color: '#2563EB' },
  { id: 'cat-refund', name: 'เงินคืนและของขวัญ (Refunds & Gifts)', type: 'income', icon: 'card_giftcard', color: '#8B5CF6' },
  { id: 'cat-other-inc', name: 'รายรับอื่น ๆ (Other)', type: 'income', icon: 'savings', color: '#64748B' },
];

export const DEFAULT_ACCOUNTS = [
  {
    id: 'acc-checking',
    name: 'บัญชีออมทรัพย์หลัก (Checking)',
    type: 'bank' as const,
    initialBalance: 25000,
    currentBalance: 25000,
    color: '#1C463C',
    icon: 'account_balance',
    accountNumber: '••4902'
  },
  {
    id: 'acc-cash',
    name: 'เงินสดในกระเป๋า (Cash Wallet)',
    type: 'cash' as const,
    initialBalance: 3500,
    currentBalance: 3500,
    color: '#126967',
    icon: 'payments',
    accountNumber: 'เงินสด'
  },
  {
    id: 'acc-ewallet',
    name: 'กระเป๋าเงินดิจิทัล (PromptPay / e-Wallet)',
    type: 'ewallet' as const,
    initialBalance: 2200,
    currentBalance: 2200,
    color: '#2B7A78',
    icon: 'account_balance_wallet',
    accountNumber: '••8812'
  },
  {
    id: 'acc-vault',
    name: 'กองทุนสำรองฉุกเฉิน (High Yield Vault)',
    type: 'bank' as const,
    initialBalance: 50000,
    currentBalance: 50000,
    color: '#355E53',
    icon: 'savings',
    accountNumber: '••1029'
  }
];

export function getInitialBudgets(userId: string, month: number, year: number): Budget[] {
  return [
    {
      id: `bud-${userId}-housing-${month}-${year}`,
      userId,
      categoryId: 'cat-housing',
      amount: 15000,
      month,
      year,
      createdAt: new Date().toISOString()
    },
    {
      id: `bud-${userId}-groceries-${month}-${year}`,
      userId,
      categoryId: 'cat-groceries',
      amount: 9000,
      month,
      year,
      createdAt: new Date().toISOString()
    },
    {
      id: `bud-${userId}-leisure-${month}-${year}`,
      userId,
      categoryId: 'cat-leisure',
      amount: 5000,
      month,
      year,
      createdAt: new Date().toISOString()
    },
    {
      id: `bud-${userId}-transport-${month}-${year}`,
      userId,
      categoryId: 'cat-transport',
      amount: 4000,
      month,
      year,
      createdAt: new Date().toISOString()
    },
    {
      id: `bud-${userId}-utilities-${month}-${year}`,
      userId,
      categoryId: 'cat-utilities',
      amount: 2800,
      month,
      year,
      createdAt: new Date().toISOString()
    },
    {
      id: `bud-${userId}-health-${month}-${year}`,
      userId,
      categoryId: 'cat-health',
      amount: 2500,
      month,
      year,
      createdAt: new Date().toISOString()
    }
  ];
}

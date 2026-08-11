export type TransactionType = 'income' | 'expense';

export type PeriodFilter = 'week' | 'month' | 'year' | 'custom' | 'all';

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: 'income' | 'expense' | 'both';
  isCustom?: boolean;
}

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  category: string;
  date: string; // YYYY-MM-DD
  note?: string;
  createdAt: number;
}

export interface UserProfile {
  name: string;
  email: string;
  avatar?: string;
  isPinEnabled: boolean;
  pinCode?: string; // Code à 4 chiffres
  onboardingCompleted: boolean;
  createdAt: number;
}

export interface Settings {
  currency: string;
  currencySymbol: string;
  businessName: string;
  ownerName: string;
  userEmail?: string;
  avatar?: string;
  theme: 'light' | 'dark';
  defaultPeriod: PeriodFilter;
  dailyGoal?: number;
  isPinEnabled?: boolean;
  pinCode?: string;
  onboardingCompleted?: boolean;
}

export interface PeriodSummary {
  totalIncome: number;
  totalExpenses: number;
  balance: number;
  transactionCount: number;
  topIncomeCategory?: { name: string; amount: number };
  topExpenseCategory?: { name: string; amount: number };
}

export interface RevenueBreakdown {
  periodLabel: string;
  income: number;
  expense: number;
  net: number;
  dateRange: string;
}

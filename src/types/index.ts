export interface User {
  uid: string;
  email: string;
  displayName: string | null;
  photoURL: string | null;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: 'expense' | 'income';
  subcategories: Subcategory[];
  userId: string;
  createdAt: number;
}

export interface Subcategory {
  id: string;
  name: string;
  icon?: string;
}

export interface Transaction {
  id: string;
  amount: number;
  description: string;
  categoryId: string;
  subcategoryId?: string;
  type: 'expense' | 'income';
  date: number;
  month: string; // YYYY-MM format
  userId: string;
  receiptUrl?: string;
  tags?: string[];
  createdAt: number;
}

export interface Installment {
  id: string;
  name: string;
  totalAmount: number;
  monthlyAmount: number;
  totalInstallments: number;
  paidInstallments: number;
  startDate: number;
  categoryId?: string;
  note?: string;
  userId: string;
  isActive: boolean;
  createdAt: number;
}

export interface RecurringBill {
  id: string;
  name: string;
  amount: number;
  categoryId?: string;
  subcategoryId?: string;
  dueDay: number; // day of month (1-31)
  frequency: 'monthly' | 'quarterly' | 'yearly';
  note?: string;
  userId: string;
  isActive: boolean;
  /** Mjeseci u kojima je račun plaćen (YYYY-MM). Različito stanje po mjesecu. */
  paidMonths?: string[];
  createdAt: number;
}

export interface Budget {
  id: string;
  categoryId: string;
  amount: number;
  month: string; // YYYY-MM format
  userId: string;
  createdAt: number;
}

export interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline?: number;
  icon: string;
  color: string;
  categoryId?: string;
  subcategoryId?: string;
  userId: string;
  isCompleted: boolean;
  isWithdrawn?: boolean;
  createdAt: number;
}

export interface MonthSummary {
  totalIncome: number;
  totalExpenses: number;
  balance: number;
  categoryBreakdown: { categoryId: string; total: number; percentage: number }[];
  dailySpending: { date: string; amount: number }[];
}

export type ThemeMode = 'light' | 'dark';

export interface AppState {
  theme: ThemeMode;
  selectedMonth: string;
  currency: string;
}

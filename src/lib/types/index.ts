export interface Expense {
  id: string;
  amount: number;
  category: ExpenseCategory;
  description: string;
  date: string;
  userId?: string;
  receipt?: string;
  tags?: string[];
  status?: ExpenseStatus;
}

export enum ExpenseCategory {
  Housing = 'Housing',
  Transportation = 'Transportation',
  Food = 'Food',
  Utilities = 'Utilities',
  Insurance = 'Insurance',
  Healthcare = 'Healthcare',
  Entertainment = 'Entertainment',
  Shopping = 'Shopping',
  Education = 'Education',
  Savings = 'Savings',
  Other = 'Other'
}

export enum ExpenseStatus {
  Pending = 'Pending',
  Approved = 'Approved',
  Rejected = 'Rejected'
}

export interface DashboardStats {
  totalExpenses: number;
  monthlyAverage: number;
  expensesByCategory: Record<string, number>;
  monthlyTrends: Array<{
    month: string;
    amount: number;
  }>;
}

export const CHART_COLORS = {
  primary: '#3b82f6',
  secondary: '#1e40af',
  success: '#22c55e',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#60a5fa',
  purple: '#a855f7',
  pink: '#ec4899',
  orange: '#f97316',
  teal: '#14b8a6'
} as const;

export interface User {
  id: string;
  email: string;
  name?: string;
  avatar?: string;
  preferences?: UserPreferences;
}

export interface UserPreferences {
  currency: string;
  theme: 'light' | 'dark';
  notifications: boolean;
  defaultCategory?: ExpenseCategory;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
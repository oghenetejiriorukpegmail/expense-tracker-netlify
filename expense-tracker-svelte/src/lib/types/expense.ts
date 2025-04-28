import { z } from 'zod';

export const ExpenseCategoryEnum = z.enum([
  'Food',
  'Transportation',
  'Accommodation',
  'Entertainment',
  'Shopping',
  'Healthcare',
  'Education',
  'Utilities',
  'Other'
]);

export const CreateExpenseSchema = z.object({
  id: z.number().optional(),
  amount: z.number().min(0),
  currency: z.string().length(3),
  date: z.date(),
  category: ExpenseCategoryEnum,
  description: z.string().min(1),
  location: z.string().optional(),
  vendor: z.string().optional(),
  userId: z.string(),
  tripId: z.number().optional(),
  receiptUrl: z.string().optional(),
  ocrTaskId: z.number().optional(),
  ocrConfidence: z.object({
    date: z.number().min(0).max(1).optional(),
    amount: z.number().min(0).max(1).optional(),
    vendor: z.number().min(0).max(1).optional(),
    description: z.number().min(0).max(1).optional(),
    location: z.number().min(0).max(1).optional()
  }).optional()
});

export type CreateExpense = z.infer<typeof CreateExpenseSchema>;
export type ExpenseCategory = z.infer<typeof ExpenseCategoryEnum>;

export interface Expense extends CreateExpense {
  id: number;
  createdAt: Date;
  updatedAt: Date;
  tripId?: number;
  status: 'pending' | 'processing' | 'complete' | 'error';
}

export interface ExpenseSummary {
  total: number;
  count: number;
  byCategory: Record<ExpenseCategory, number>;
  byMonth: Array<{
    month: string;
    amount: number;
    count: number;
  }>;
  recentExpenses: Expense[];
}

export interface ExpenseFilters {
  startDate?: Date;
  endDate?: Date;
  category?: ExpenseCategory;
  minAmount?: number;
  maxAmount?: number;
  tripId?: number;
  searchTerm?: string;
}
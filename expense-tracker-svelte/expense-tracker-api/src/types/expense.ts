import { z } from 'zod';

export const ExpenseCategoryEnum = z.enum([
  'Food',
  'Transportation',
  'Housing',
  'Utilities',
  'Entertainment',
  'Healthcare',
  'Shopping',
  'Education',
  'Travel',
  'Other'
]);

export type ExpenseCategory = z.infer<typeof ExpenseCategoryEnum>;

export const ExpenseSchema = z.object({
  id: z.string().optional(), // Optional for new expenses
  amount: z.number().positive(),
  currency: z.string().default('USD'),
  date: z.coerce.date(),
  category: ExpenseCategoryEnum,
  description: z.string().min(1).max(500),
  location: z.string().optional(),
  vendor: z.string().optional(),
  userId: z.string(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional()
});

export type Expense = z.infer<typeof ExpenseSchema>;

export const CreateExpenseSchema = ExpenseSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export type CreateExpense = z.infer<typeof CreateExpenseSchema>;

export const UpdateExpenseSchema = ExpenseSchema.partial().required({
  id: true
});

export type UpdateExpense = z.infer<typeof UpdateExpenseSchema>;

export const ExpenseFilterSchema = z.object({
  userId: z.string(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  category: ExpenseCategoryEnum.optional(),
  minAmount: z.number().optional(),
  maxAmount: z.number().optional(),
  search: z.string().optional(),
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().default(10),
  sortBy: z.enum(['date', 'amount', 'category']).default('date'),
  sortOrder: z.enum(['asc', 'desc']).default('desc')
});

export type ExpenseFilter = z.infer<typeof ExpenseFilterSchema>;

// Helper type for API responses
export interface ExpenseListResponse {
  expenses: Expense[];
  totalCount: number;
}
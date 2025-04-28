import { z } from 'zod';

export const TripStatusEnum = z.enum([
  'Planned',
  'InProgress',
  'Completed',
  'Cancelled'
]);

export const CreateTripSchema = z.object({
  id: z.number().optional(),
  title: z.string().min(1),
  description: z.string().optional(),
  startDate: z.date(),
  endDate: z.date(),
  status: TripStatusEnum,
  budget: z.number().min(0).optional(),
  currency: z.string().length(3),
  location: z.string().optional(),
  userId: z.string(),
  tags: z.array(z.string()).optional(),
});

export type CreateTrip = z.infer<typeof CreateTripSchema>;
export type TripStatus = z.infer<typeof TripStatusEnum>;

export interface Trip extends CreateTrip {
  id: number;
  createdAt: Date;
  updatedAt: Date;
  totalExpenses: number;
  expenseCount: number;
  remainingBudget?: number;
}

export interface TripSummary {
  totalExpenses: number;
  expensesByCategory: Record<string, number>;
  dailyExpenses: Array<{
    date: string;
    amount: number;
  }>;
  budgetUtilization?: number;
}
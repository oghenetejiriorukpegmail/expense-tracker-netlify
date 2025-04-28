import { z } from "zod";

// Trip status enum
export const TripStatus = z.enum(['Planned', 'InProgress', 'Completed', 'Cancelled']);
export type TripStatus = z.infer<typeof TripStatus>;

// Trip schema
export const insertTripSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  status: TripStatus.default('Planned'),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  budget: z.number().min(0).optional(),
  currency: z.string().default('USD'),
  location: z.string().optional(),
  tags: z.array(z.string()).optional(),
}).refine(data => data.endDate >= data.startDate, {
  message: "End date must be after or equal to start date",
  path: ["endDate"],
});

export type InsertTrip = z.infer<typeof insertTripSchema>;

export type Trip = {
  id: number;
  userId: number;
  name: string;
  description?: string;
  status: TripStatus;
  startDate: Date;
  endDate: Date;
  budget?: number;
  currency: string;
  location?: string;
  tags?: string[];
  totalExpenses: number;
  expenseCount: number;
  createdAt: Date;
  updatedAt: Date;
};

// Expense schema
export type Expense = {
  id: number;
  userId: number;
  type: string;
  date: string;
  vendor: string;
  location: string;
  cost: number;
  comments?: string;
  tripName: string;
  receiptPath?: string;
  status?: string;
  ocrError?: string;
  createdAt: Date;
  updatedAt: Date;
};
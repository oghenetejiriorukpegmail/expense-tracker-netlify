import express, { type Request, Response, NextFunction } from "express";
import { z } from "zod";
import type { IStorage } from "../storage.js";
import type { PublicUser } from '../../shared/schema.js';

// Define request type with user property
interface AuthenticatedRequest extends Request {
  user: PublicUser;
}

// Validation schemas
const dateRangeSchema = z.object({
  startDate: z.string().transform(str => new Date(str)),
  endDate: z.string().transform(str => new Date(str))
});

const categoryAnalysisSchema = z.object({
  category: z.string(),
  timeframe: z.enum(['week', 'month', 'year'])
});

export function createAnalyticsRouter(storage: IStorage): express.Router {
  const router = express.Router();

  // GET /api/analytics/aggregate
  router.get("/aggregate", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { startDate, endDate } = dateRangeSchema.parse(req.query);
      const authReq = req as AuthenticatedRequest;
      const userId = authReq.user.id;

      const result = await storage.getAggregatedExpenses(
        userId,
        startDate,
        endDate
      );

      res.json(result);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid date range", errors: error.errors });
      }
      next(error);
    }
  });

  // GET /api/analytics/trends/:category
  router.get("/trends/:category", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { category } = req.params;
      const { timeframe } = categoryAnalysisSchema.parse({
        category,
        timeframe: req.query.timeframe
      });

      const authReq = req as AuthenticatedRequest;
      const userId = authReq.user.id;

      const now = new Date();
      let startDate = new Date();

      switch (timeframe) {
        case 'week':
          startDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(now.getMonth() - 1);
          break;
        case 'year':
          startDate.setFullYear(now.getFullYear() - 1);
          break;
      }

      const result = await storage.getCategoryTrends(
        userId,
        category,
        startDate,
        now
      );

      res.json(result);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid parameters", errors: error.errors });
      }
      next(error);
    }
  });

  // GET /api/analytics/statistics
  router.get("/statistics", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { startDate, endDate } = dateRangeSchema.parse(req.query);
      const authReq = req as AuthenticatedRequest;
      const userId = authReq.user.id;

      const result = await storage.getExpenseStatistics(
        userId,
        startDate,
        endDate
      );

      res.json(result);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid date range", errors: error.errors });
      }
      next(error);
    }
  });

  return router;
}
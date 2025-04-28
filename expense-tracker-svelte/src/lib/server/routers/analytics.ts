import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { protectedProcedure, router } from '../trpc';
import type { Context, ExpenseData, ReportGenerationResult } from '../../types';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';

// Extend jsPDF type to include autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

const timeframeSchema = z.enum(['week', 'month', 'year']);
const dateRangeSchema = z.object({
  startDate: z.string(),
  endDate: z.string()
});

const reportTypeSchema = z.enum(['summary', 'detailed', 'category']);
const exportFormatSchema = z.enum(['pdf', 'xlsx', 'csv']);

const reportInputSchema = z.object({
  type: reportTypeSchema,
  format: exportFormatSchema,
  dateRange: dateRangeSchema
});

export const analyticsRouter = router({
  // Get expense summary for a specific timeframe
  getExpenseSummary: protectedProcedure
    .input(timeframeSchema)
    .query(async ({ ctx, input }: { ctx: Context; input: z.infer<typeof timeframeSchema> }) => {
      try {
        const now = new Date();
        let startDate = new Date();

        switch (input) {
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

        const expenses = await ctx.db.query.expenses.findMany({
          where: {
            userId: ctx.user.id,
            date: {
              gte: startDate,
              lte: now
            }
          }
        });

        const total = expenses.reduce((sum: number, exp: ExpenseData) => sum + exp.amount, 0);
        const categoryBreakdown = expenses.reduce((acc: Record<string, number>, exp: ExpenseData) => {
          const category = exp.category || 'Uncategorized';
          acc[category] = (acc[category] || 0) + exp.amount;
          return acc;
        }, {});

        // Calculate previous period comparison
        const previousStart = new Date(startDate);
        const previousEnd = new Date(now);
        switch (input) {
          case 'week':
            previousStart.setDate(previousStart.getDate() - 7);
            previousEnd.setDate(previousEnd.getDate() - 7);
            break;
          case 'month':
            previousStart.setMonth(previousStart.getMonth() - 1);
            previousEnd.setMonth(previousEnd.getMonth() - 1);
            break;
          case 'year':
            previousStart.setFullYear(previousStart.getFullYear() - 1);
            previousEnd.setFullYear(previousEnd.getFullYear() - 1);
            break;
        }

        const previousExpenses = await ctx.db.query.expenses.findMany({
          where: {
            userId: ctx.user.id,
            date: {
              gte: previousStart,
              lte: previousEnd
            }
          }
        });

        const previousTotal = previousExpenses.reduce((sum: number, exp: ExpenseData) => sum + exp.amount, 0);
        const percentageChange = previousTotal > 0 
          ? ((total - previousTotal) / previousTotal) * 100 
          : 0;

        return {
          total,
          categoryBreakdown,
          previousPeriodComparison: percentageChange
        };
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch expense summary',
          cause: error
        });
      }
    }),

  // Get spending insights
  getSpendingInsights: protectedProcedure
    .input(dateRangeSchema)
    .query(async ({ ctx, input }: { ctx: Context; input: z.infer<typeof dateRangeSchema> }) => {
      try {
        const { startDate, endDate } = input;
        const expenses = await ctx.db.query.expenses.findMany({
          where: {
            userId: ctx.user.id,
            date: {
              gte: new Date(startDate),
              lte: new Date(endDate)
            }
          }
        });

        // Calculate spending patterns
        const categoryTrends = expenses.reduce((acc: Record<string, { months: number[] }>, expense: ExpenseData) => {
          const category = expense.category || 'Uncategorized';
          const month = new Date(expense.date).getMonth();
          
          if (!acc[category]) {
            acc[category] = { months: Array(12).fill(0) };
          }
          acc[category].months[month] += expense.amount;
          return acc;
        }, {});

        const spendingPatterns = Object.entries(categoryTrends).map(([category, data]) => {
          const recentMonths = data.months.slice(-3);
          const avgChange = (recentMonths[2] - recentMonths[0]) / recentMonths[0] * 100;
          
          return {
            category,
            trend: avgChange > 5 ? 'up' : avgChange < -5 ? 'down' : 'stable',
            percentage: Math.abs(avgChange)
          };
        });

        return {
          spendingPatterns
        };
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch spending insights',
          cause: error
        });
      }
    }),

  // Generate expense report
  generateReport: protectedProcedure
    .input(reportInputSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        const { type, format, dateRange } = input;
        const expenses = await ctx.db.query.expenses.findMany({
          where: {
            userId: ctx.user.id,
            date: {
              gte: new Date(dateRange.startDate),
              lte: new Date(dateRange.endDate)
            }
          }
        });

        // Process data based on report type
        let reportData: any;
        switch (type) {
          case 'summary':
            reportData = {
              total: expenses.reduce((sum: number, exp: ExpenseData) => sum + exp.amount, 0),
              categories: expenses.reduce((acc: Record<string, number>, exp: ExpenseData) => {
                const category = exp.category || 'Uncategorized';
                acc[category] = (acc[category] || 0) + exp.amount;
                return acc;
              }, {})
            };
            break;
          case 'detailed':
            reportData = expenses.map((exp: ExpenseData) => ({
              date: exp.date,
              category: exp.category || 'Uncategorized',
              description: exp.description,
              amount: exp.amount
            }));
            break;
          case 'category':
            reportData = Object.entries(
              expenses.reduce((acc: Record<string, { total: number; items: ExpenseData[] }>, exp: ExpenseData) => {
                const category = exp.category || 'Uncategorized';
                if (!acc[category]) acc[category] = { total: 0, items: [] };
                acc[category].total += exp.amount;
                acc[category].items.push(exp);
                return acc;
              }, {})
            );
            break;
        }

        // Generate report in requested format
        let result: ReportGenerationResult;
        switch (format) {
          case 'pdf':
            result = await generatePDFReport(type, reportData);
            break;
          case 'xlsx':
            result = await generateExcelReport(type, reportData);
            break;
          case 'csv':
            result = await generateCSVReport(type, reportData);
            break;
          default:
            throw new Error('Unsupported export format');
        }

        return result;
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to generate report',
          cause: error
        });
      }
    })
});

// Helper functions for report generation
async function generatePDFReport(type: string, data: any): Promise<ReportGenerationResult> {
  const doc = new jsPDF();
  const filename = `expense-report-${type}-${new Date().toISOString().split('T')[0]}.pdf`;
  
  // Add report content based on type
  doc.setFontSize(16);
  doc.text(`Expense Report - ${type.charAt(0).toUpperCase() + type.slice(1)}`, 20, 20);

  if (type === 'summary') {
    doc.autoTable({
      startY: 30,
      head: [['Category', 'Amount']],
      body: Object.entries(data.categories).map(([category, amount]) => [
        category,
        `$${(amount as number).toFixed(2)}`
      ]),
      foot: [['Total', `$${data.total.toFixed(2)}`]]
    });
  } else {
    doc.autoTable({
      startY: 30,
      head: [['Date', 'Category', 'Description', 'Amount']],
      body: data.map((item: any) => [
        new Date(item.date).toLocaleDateString(),
        item.category,
        item.description || '',
        `$${item.amount.toFixed(2)}`
      ])
    });
  }

  // Save the PDF to a temporary location or buffer
  const pdfBuffer = doc.output('arraybuffer');
  const url = URL.createObjectURL(new Blob([pdfBuffer], { type: 'application/pdf' }));

  return { url, filename };
}

async function generateExcelReport(type: string, data: any): Promise<ReportGenerationResult> {
  const filename = `expense-report-${type}-${new Date().toISOString().split('T')[0]}.xlsx`;
  const wb = XLSX.utils.book_new();

  let ws;
  if (type === 'summary') {
    ws = XLSX.utils.json_to_sheet(
      Object.entries(data.categories).map(([category, amount]) => ({
        Category: category,
        Amount: (amount as number).toFixed(2)
      }))
    );
  } else {
    ws = XLSX.utils.json_to_sheet(data);
  }

  XLSX.utils.book_append_sheet(wb, ws, 'Expenses');
  const buffer = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
  const url = URL.createObjectURL(new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }));

  return { url, filename };
}

async function generateCSVReport(type: string, data: any): Promise<ReportGenerationResult> {
  const filename = `expense-report-${type}-${new Date().toISOString().split('T')[0]}.csv`;
  let csvContent: string;

  if (type === 'summary') {
    csvContent = 'Category,Amount\n' + 
      Object.entries(data.categories)
        .map(([category, amount]) => `${category},${(amount as number).toFixed(2)}`)
        .join('\n');
  } else {
    csvContent = 'Date,Category,Description,Amount\n' + 
      data.map((item: any) => 
        `${new Date(item.date).toLocaleDateString()},${item.category},${item.description || ''},${item.amount.toFixed(2)}`
      ).join('\n');
  }

  const url = URL.createObjectURL(new Blob([csvContent], { type: 'text/csv' }));
  return { url, filename };
}
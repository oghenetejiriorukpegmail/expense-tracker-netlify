import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';

interface Expense {
  id: string;
  amount: number;
  category: string;
  date: string;
  vendor?: string;
  description?: string;
}

interface ReportOptions {
  startDate: Date;
  endDate: Date;
  format: 'pdf' | 'excel';
  includeCharts?: boolean;
  groupBy?: 'category' | 'date' | 'vendor';
}

interface SummaryData {
  total: number;
  average: number;
}

interface GroupedData {
  total: number;
  count: number;
  expenses: Expense[];
}

export class ReportGenerator {
  private formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  }

  private formatDate(date: string): string {
    return format(new Date(date), 'MMM dd, yyyy');
  }

  private groupExpenses(expenses: Expense[], groupBy: 'category' | 'date' | 'vendor' = 'category'): Record<string, GroupedData> {
    return expenses.reduce((groups, expense) => {
      const key = groupBy === 'date' 
        ? this.formatDate(expense.date)
        : groupBy === 'vendor'
          ? expense.vendor || 'Unknown'
          : expense.category;

      if (!groups[key]) {
        groups[key] = {
          total: 0,
          count: 0,
          expenses: []
        };
      }

      groups[key].total += expense.amount;
      groups[key].count += 1;
      groups[key].expenses.push(expense);

      return groups;
    }, {} as Record<string, GroupedData>);
  }

  private generatePDFReport(
    expenses: Expense[],
    options: ReportOptions,
    summary: SummaryData
  ): jsPDF {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;

    // Title
    doc.setFontSize(20);
    doc.text('Expense Report', pageWidth / 2, 20, { align: 'center' });

    // Date Range
    doc.setFontSize(12);
    doc.text(
      `${format(options.startDate, 'MMM dd, yyyy')} - ${format(options.endDate, 'MMM dd, yyyy')}`,
      pageWidth / 2,
      30,
      { align: 'center' }
    );

    // Summary Section
    doc.setFontSize(14);
    doc.text('Summary', 14, 45);
    doc.setFontSize(10);
    doc.text(`Total Expenses: ${this.formatCurrency(summary.total)}`, 14, 55);
    doc.text(`Number of Transactions: ${expenses.length}`, 14, 62);
    doc.text(`Average per Transaction: ${this.formatCurrency(summary.average)}`, 14, 69);

    // Group expenses
    const groupedExpenses = this.groupExpenses(expenses, options.groupBy);

    // Category Breakdown
    doc.setFontSize(14);
    doc.text('Category Breakdown', 14, 85);
    
    const categoryData = Object.entries(groupedExpenses).map(([category, data]) => [
      category,
      data.count.toString(),
      this.formatCurrency(data.total),
      this.formatCurrency(data.total / data.count),
      `${((data.total / summary.total) * 100).toFixed(1)}%`
    ]);

    (doc as any).autoTable({
      startY: 90,
      head: [['Category', 'Count', 'Total', 'Average', '% of Total']],
      body: categoryData,
      margin: { top: 90 },
      headStyles: { fillColor: [37, 99, 235] }
    });

    // Detailed Transactions
    doc.addPage();
    doc.setFontSize(14);
    doc.text('Detailed Transactions', 14, 20);

    const transactionData = expenses.map(expense => [
      this.formatDate(expense.date),
      expense.category,
      expense.vendor || '',
      expense.description || '',
      this.formatCurrency(expense.amount)
    ]);

    (doc as any).autoTable({
      startY: 25,
      head: [['Date', 'Category', 'Vendor', 'Description', 'Amount']],
      body: transactionData,
      margin: { top: 25 },
      headStyles: { fillColor: [37, 99, 235] }
    });

    return doc;
  }

  private generateExcelReport(
    expenses: Expense[],
    options: ReportOptions,
    summary: SummaryData
  ): XLSX.WorkBook {
    const workbook = XLSX.utils.book_new();

    // Summary Sheet
    const summarySheetData = [
      ['Expense Report'],
      [`${format(options.startDate, 'MMM dd, yyyy')} - ${format(options.endDate, 'MMM dd, yyyy')}`],
      [],
      ['Summary'],
      ['Total Expenses', this.formatCurrency(summary.total)],
      ['Number of Transactions', expenses.length],
      ['Average per Transaction', this.formatCurrency(summary.average)],
      [],
      ['Category Breakdown']
    ];

    const groupedExpenses = this.groupExpenses(expenses, options.groupBy);
    const categoryHeaders = ['Category', 'Count', 'Total', 'Average', '% of Total'];
    const categoryData = Object.entries(groupedExpenses).map(([category, data]) => [
      category,
      data.count,
      this.formatCurrency(data.total),
      this.formatCurrency(data.total / data.count),
      `${((data.total / summary.total) * 100).toFixed(1)}%`
    ]);

    const summarySheet = XLSX.utils.aoa_to_sheet([
      ...summarySheetData,
      categoryHeaders,
      ...categoryData
    ]);

    // Transactions Sheet
    const transactionHeaders = ['Date', 'Category', 'Vendor', 'Description', 'Amount'];
    const transactionData = expenses.map(expense => [
      this.formatDate(expense.date),
      expense.category,
      expense.vendor || '',
      expense.description || '',
      this.formatCurrency(expense.amount)
    ]);

    const transactionSheet = XLSX.utils.aoa_to_sheet([
      transactionHeaders,
      ...transactionData
    ]);

    // Add sheets to workbook
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');
    XLSX.utils.book_append_sheet(workbook, transactionSheet, 'Transactions');

    return workbook;
  }

  public async generateReport(
    expenses: Expense[],
    options: ReportOptions
  ): Promise<Blob> {
    // Calculate summary data
    const total = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    const average = total / expenses.length;
    const summary: SummaryData = { total, average };

    if (options.format === 'pdf') {
      const doc = this.generatePDFReport(expenses, options, summary);
      return doc.output('blob');
    } else {
      const workbook = this.generateExcelReport(expenses, options, summary);
      const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      return new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    }
  }

  public async downloadReport(
    expenses: Expense[],
    options: ReportOptions
  ): Promise<void> {
    const blob = await this.generateReport(expenses, options);
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `expense-report-${format(new Date(), 'yyyy-MM-dd')}.${options.format === 'pdf' ? 'pdf' : 'xlsx'}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }
}
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Button } from "../ui/button";
import { ReportService } from '../../services/report.service';
import { Loader2, Download } from "lucide-react";

interface Expense {
  id: string;
  amount: number;
  category: string;
  description?: string;
  date: string;
}

interface ReportGeneratorProps {
  expenses: Expense[];
  isLoading: boolean;
}

type ReportType = 'monthly' | 'annual' | 'category';
type ReportFormat = 'pdf' | 'excel' | 'csv';

export default function ReportGenerator({ expenses, isLoading }: ReportGeneratorProps) {
  const [reportType, setReportType] = useState<ReportType>('monthly');
  const [format, setFormat] = useState<ReportFormat>('pdf');
  const [generating, setGenerating] = useState(false);

  const generateReport = async () => {
    if (isLoading || generating || !expenses.length) return;
    
    setGenerating(true);
    try {
      const template = ReportService.getDefaultTemplate(reportType);
      template.format = format;

      // Populate template with actual data
      switch (reportType) {
        case 'monthly': {
          const now = new Date();
          const monthlyExpenses = expenses.filter(exp => {
            const expDate = new Date(exp.date);
            return expDate.getMonth() === now.getMonth() && 
                   expDate.getFullYear() === now.getFullYear();
          });

          const total = monthlyExpenses.reduce((sum, exp) => sum + exp.amount, 0);
          const avgPerDay = total / new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();

          // Update summary section
          template.sections[0].data = {
            'Total Expenses': total,
            'Average per Day': avgPerDay,
            'Number of Transactions': monthlyExpenses.length
          };

          // Update table section
          template.sections[1].data = {
            headers: ['Date', 'Category', 'Description', 'Amount'],
            rows: monthlyExpenses.map(exp => [
              new Date(exp.date).toLocaleDateString(),
              exp.category,
              exp.description || '-',
              exp.amount
            ])
          };

          // Generate insights
          const insights: string[] = [];
          if (total > 5000) insights.push('High spending month - exceeded $5,000');
          if (monthlyExpenses.length > 50) insights.push('High transaction volume this month');
          template.sections[2].data = insights;
          break;
        }

        case 'annual': {
          const now = new Date();
          const yearlyExpenses = expenses.filter(exp => 
            new Date(exp.date).getFullYear() === now.getFullYear()
          );

          const total = yearlyExpenses.reduce((sum, exp) => sum + exp.amount, 0);
          const monthlyData = Array(12).fill(0);
          yearlyExpenses.forEach(exp => {
            const month = new Date(exp.date).getMonth();
            monthlyData[month] += exp.amount;
          });

          // Update summary section
          template.sections[0].data = {
            'Total Annual Expenses': total,
            'Average per Month': total / 12,
            'Number of Transactions': yearlyExpenses.length
          };

          // Update table section
          template.sections[1].data = {
            headers: ['Month', 'Total Expenses', 'Number of Transactions'],
            rows: monthlyData.map((amount, idx) => [
              new Date(2024, idx).toLocaleString('default', { month: 'long' }),
              amount,
              yearlyExpenses.filter(exp => new Date(exp.date).getMonth() === idx).length
            ])
          };

          // Generate insights
          const insights: string[] = [];
          const highestMonth = Math.max(...monthlyData);
          const lowestMonth = Math.min(...monthlyData);
          insights.push(`Highest spending month: ${new Date(2024, monthlyData.indexOf(highestMonth)).toLocaleString('default', { month: 'long' })} ($${highestMonth.toFixed(2)})`);
          insights.push(`Lowest spending month: ${new Date(2024, monthlyData.indexOf(lowestMonth)).toLocaleString('default', { month: 'long' })} ($${lowestMonth.toFixed(2)})`);
          template.sections[2].data = insights;
          break;
        }

        case 'category': {
          const categoryTotals = expenses.reduce((acc, exp) => {
            acc[exp.category] = (acc[exp.category] || 0) + exp.amount;
            return acc;
          }, {} as Record<string, number>);

          const sortedCategories = Object.entries(categoryTotals)
            .sort(([, a], [, b]) => b - a) as [string, number][];

          const total = Object.values(categoryTotals).reduce((sum, val) => sum + val, 0);

          // Update summary section
          template.sections[0].data = {
            'Total Expenses': total,
            'Number of Categories': Object.keys(categoryTotals).length,
            'Top Category': `${sortedCategories[0][0]} ($${sortedCategories[0][1].toFixed(2)})`
          };

          // Update table section
          template.sections[1].data = {
            headers: ['Category', 'Total Amount', 'Percentage'],
            rows: sortedCategories.map(([category, amount]) => [
              category,
              amount,
              `${((amount / total) * 100).toFixed(1)}%`
            ])
          };

          // Generate insights
          const insights: string[] = [];
          insights.push(`${sortedCategories[0][0]} accounts for ${((sortedCategories[0][1] / total) * 100).toFixed(1)}% of total expenses`);
          if (sortedCategories[0][1] / total > 0.5) {
            insights.push('Warning: One category represents over 50% of expenses');
          }
          template.sections[2].data = insights;
          break;
        }
      }

      if (format === 'pdf') {
        // For PDF, we return a component that handles the download
        return ReportService.getReportComponent(template);
      } else {
        // For Excel/CSV, we generate and download the file
        const blob = await ReportService.generateReport(template);
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${template.title.toLowerCase().replace(/\s+/g, '-')}.${format}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Error generating report:', error);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Generate Report</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Report Type</label>
          <Select value={reportType} onValueChange={(value: ReportType) => setReportType(value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select report type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="monthly">Monthly Report</SelectItem>
              <SelectItem value="annual">Annual Report</SelectItem>
              <SelectItem value="category">Category Analysis</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Format</label>
          <Select value={format} onValueChange={(value: ReportFormat) => setFormat(value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select format" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pdf">PDF</SelectItem>
              <SelectItem value="excel">Excel</SelectItem>
              <SelectItem value="csv">CSV</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button
          className="w-full"
          onClick={generateReport}
          disabled={isLoading || generating || !expenses.length}
        >
          {generating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Download className="mr-2 h-4 w-4" />
              Generate Report
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { DateRangePicker } from "../ui/date-range-picker";
import { ReportGenerator } from "../../services/report-generator";
import { FileText, FileSpreadsheet, Download } from "lucide-react";
import { subDays } from "date-fns";

interface Expense {
  id: string;
  amount: number;
  category: string;
  date: string;
  vendor?: string;
  description?: string;
}

interface ReportGeneratorModalProps {
  expenses: Expense[];
  isLoading: boolean;
}

export default function ReportGeneratorModal({ expenses, isLoading }: ReportGeneratorModalProps) {
  const [dateRange, setDateRange] = useState({
    from: subDays(new Date(), 30),
    to: new Date()
  });
  const [format, setFormat] = useState<'pdf' | 'excel'>('pdf');
  const [groupBy, setGroupBy] = useState<'category' | 'date' | 'vendor'>('category');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleFromChange = (date: Date | undefined) => {
    if (date) {
      setDateRange(prev => ({ ...prev, from: date }));
    }
  };

  const handleToChange = (date: Date | undefined) => {
    if (date) {
      setDateRange(prev => ({ ...prev, to: date }));
    }
  };

  const handleGenerateReport = async () => {
    try {
      setIsGenerating(true);
      const reportGenerator = new ReportGenerator();
      
      // Filter expenses by date range
      const filteredExpenses = expenses.filter(expense => {
        const expenseDate = new Date(expense.date);
        return expenseDate >= dateRange.from && expenseDate <= dateRange.to;
      });

      await reportGenerator.downloadReport(filteredExpenses, {
        startDate: dateRange.from,
        endDate: dateRange.to,
        format,
        groupBy,
        includeCharts: true
      });
    } catch (error) {
      console.error('Error generating report:', error);
      // You might want to show an error toast here
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Download className="h-4 w-4" />
          Generate Report
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Generate Expense Report</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label>Date Range</Label>
            <DateRangePicker
              from={dateRange.from}
              to={dateRange.to}
              onFromChange={handleFromChange}
              onToChange={handleToChange}
            />
          </div>

          <div className="grid gap-2">
            <Label>Report Format</Label>
            <RadioGroup
              defaultValue={format}
              onValueChange={(value) => setFormat(value as 'pdf' | 'excel')}
              className="flex gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="pdf" id="pdf" />
                <Label htmlFor="pdf" className="flex items-center gap-1">
                  <FileText className="h-4 w-4" />
                  PDF
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="excel" id="excel" />
                <Label htmlFor="excel" className="flex items-center gap-1">
                  <FileSpreadsheet className="h-4 w-4" />
                  Excel
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div className="grid gap-2">
            <Label>Group By</Label>
            <Select
              value={groupBy}
              onValueChange={(value) => setGroupBy(value as 'category' | 'date' | 'vendor')}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select grouping" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="category">Category</SelectItem>
                <SelectItem value="date">Date</SelectItem>
                <SelectItem value="vendor">Vendor</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button
            onClick={handleGenerateReport}
            disabled={isLoading || isGenerating}
            className="w-full mt-4"
          >
            {isGenerating ? (
              <>
                <span className="animate-spin mr-2">⏳</span>
                Generating...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Download Report
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
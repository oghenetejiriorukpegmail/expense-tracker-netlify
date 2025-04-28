import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Progress } from "../ui/progress";
import { AlertCircle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip";

interface BudgetCategory {
  category: string;
  spent: number;
  budget: number;
}

interface BudgetProgressChartProps {
  budgetData: BudgetCategory[];
  isLoading: boolean;
}

export default function BudgetProgressChart({ budgetData, isLoading }: BudgetProgressChartProps) {
  const sortedData = [...budgetData].sort((a, b) => (b.spent / b.budget) - (a.spent / a.budget));
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const getProgressColor = (spent: number, budget: number) => {
    const percentage = (spent / budget) * 100;
    if (percentage >= 100) return "bg-red-500";
    if (percentage >= 80) return "bg-yellow-500";
    return "bg-green-500";
  };

  const getProgressBackground = (spent: number, budget: number) => {
    const percentage = (spent / budget) * 100;
    if (percentage >= 100) return "bg-red-100 dark:bg-red-950";
    if (percentage >= 80) return "bg-yellow-100 dark:bg-yellow-950";
    return "bg-green-100 dark:bg-green-950";
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Budget Progress</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="h-64 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : budgetData.length > 0 ? (
          <div className="space-y-6">
            {sortedData.map((item) => {
              const percentage = Math.min(Math.round((item.spent / item.budget) * 100), 100);
              const isOverBudget = item.spent > item.budget;
              
              return (
                <div key={item.category} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{item.category}</span>
                      {isOverBudget && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger>
                              <AlertCircle className="h-4 w-4 text-red-500" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Over budget by {formatCurrency(item.spent - item.budget)}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {formatCurrency(item.spent)} / {formatCurrency(item.budget)}
                    </span>
                  </div>
                  <div className="relative">
                    <div className={`h-2 rounded-full ${getProgressBackground(item.spent, item.budget)}`}>
                      <div
                        className={`h-2 rounded-full ${getProgressColor(item.spent, item.budget)} transition-all duration-300`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    {isOverBudget && (
                      <div 
                        className="absolute right-0 top-1/2 -translate-y-1/2 h-4 w-0.5 bg-red-500"
                        style={{ right: '0%' }}
                      />
                    )}
                  </div>
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>{percentage}% spent</span>
                    {isOverBudget && (
                      <span className="text-red-500">
                        {formatCurrency(item.spent - item.budget)} over
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="h-64 flex items-center justify-center text-gray-500 dark:text-gray-400">
            No budget data available
          </div>
        )}
      </CardContent>
    </Card>
  );
}
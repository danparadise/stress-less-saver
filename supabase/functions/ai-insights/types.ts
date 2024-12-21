export interface FinancialMetrics {
  monthlyNetIncome: number;
  monthlyExpenses: number;
  savingsRate: number;
  topExpenseCategories: Array<{
    category: string;
    amount: number;
  }>;
  incomeChanges?: number[];
  transactions?: Array<{
    description: string;
    amount: number;
    date: string;
    category?: string;
  }>;
}
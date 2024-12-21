export interface FinancialMetrics {
  monthlyNetIncome: number;
  monthlyExpenses: number;
  savingsRate: number;
  topExpenseCategories: Array<{
    category: string;
    amount: number;
  }>;
  incomeChanges?: number[];  // Made optional to handle cases where it might not be available
}
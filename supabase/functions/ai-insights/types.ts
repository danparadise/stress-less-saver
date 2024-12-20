export interface Transaction {
  date: string;
  description: string;
  category: string;
  amount: number;
  balance: number;
}

export interface FinancialMetrics {
  monthlyNetIncome: number;
  monthlyExpenses: number;
  savingsRate: number;
  topExpenseCategories: { category: string; amount: number }[];
  incomeChanges: number[];
}
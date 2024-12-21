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
  transactions: Transaction[];
  topExpenseCategories: Array<{
    category: string;
    amount: number;
  }>;
  transactionCategories: Record<string, number>;
}
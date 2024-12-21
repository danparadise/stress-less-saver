// Transaction Types
export interface Transaction {
  date: string;
  description: string;
  category: string;
  amount: number;
  balance: number;
}

export interface CategoryTotal {
  category: string;
  amount: number;
}

// Financial Metrics Types
export interface FinancialMetrics {
  monthlyNetIncome: number;
  monthlyExpenses: number;
  savingsRate: number;
  transactions: Transaction[];
  topExpenseCategories: CategoryTotal[];
  transactionCategories: Record<string, number>;
}
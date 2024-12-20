export interface Transaction {
  date: string;
  description: string;
  category: string;
  amount: number;
  balance: number;
}

export interface BankStatement {
  id: string;
  document_id: string;
  statement_month: string;
  total_deposits: number;
  total_withdrawals: number;
  ending_balance: number;
  transactions: Transaction[];
  created_at: string;
  financial_documents: {
    file_name: string;
    upload_date: string;
    status: string;
  };
}

export interface MonthlyFinancialSummary {
  id: string;
  user_id: string;
  month_year: string;
  total_income: number;
  total_expenses: number;
  total_deposits: number;
  total_withdrawals: number;
  ending_balance: number;
  transactions: Transaction[];
  transaction_categories: Record<string, number>;
  created_at: string;
  updated_at: string;
}

export type FinancialData = MonthlyFinancialSummary | BankStatement;
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

export interface BankStatement {
  statement_month: string;
  total_deposits: number;
  total_withdrawals: number;
  ending_balance: number;
  transactions: Transaction[];
}

export interface PaystubData {
  gross_pay: number;
  net_pay: number;
  pay_period_start: string;
  pay_period_end: string;
  extracted_data: any;
}
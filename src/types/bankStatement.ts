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
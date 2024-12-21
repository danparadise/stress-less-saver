import { ExtractedData, ProcessingResult, Transaction } from './types';

export function aggregatePageResults(results: ProcessingResult[]): {
  statementMonth: string;
  totalDeposits: number;
  totalWithdrawals: number;
  endingBalance: number;
  allTransactions: Transaction[];
  successfulPages: number;
} {
  let statementMonth = '';
  let totalDeposits = 0;
  let totalWithdrawals = 0;
  let endingBalance = 0;
  let allTransactions: Transaction[] = [];
  let successfulPages = 0;

  results.forEach((result, index) => {
    if (result.data) {
      successfulPages++;
      if (!statementMonth && result.data.statement_month) {
        statementMonth = result.data.statement_month;
      }

      if (result.data.transactions && result.data.transactions.length > 0) {
        allTransactions = [...allTransactions, ...result.data.transactions];
        if (result.data.total_deposits) totalDeposits += result.data.total_deposits;
        if (result.data.total_withdrawals) totalWithdrawals += result.data.total_withdrawals;
        if (result.data.ending_balance) endingBalance = result.data.ending_balance;
      }
    }
  });

  // Sort transactions by date
  allTransactions.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return {
    statementMonth,
    totalDeposits,
    totalWithdrawals,
    endingBalance,
    allTransactions,
    successfulPages
  };
}
import { Json } from "@/integrations/supabase/types";
import { Transaction } from "@/types/bankStatement";

export const convertJsonToTransaction = (json: Json): Transaction => {
  if (typeof json === 'object' && json !== null && !Array.isArray(json)) {
    return {
      date: String((json as { date?: Json }).date || ''),
      description: String((json as { description?: Json }).description || ''),
      category: String((json as { category?: Json }).category || ''),
      amount: Number((json as { amount?: Json }).amount || 0),
      balance: Number((json as { balance?: Json }).balance || 0)
    };
  }
  // Return a default transaction if conversion fails
  return {
    date: '',
    description: '',
    category: '',
    amount: 0,
    balance: 0
  };
};

export const calculateMonthlyExpenses = (transactions: Json | null): number => {
  if (!transactions || !Array.isArray(transactions)) {
    return 0;
  }

  const transactionsArray = transactions.map(convertJsonToTransaction);
  return transactionsArray.reduce((total: number, transaction: Transaction) => {
    if (transaction.amount < 0) {
      return total + Math.abs(transaction.amount);
    }
    return total;
  }, 0);
};
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
  
  // Calculate total expenses (negative amounts)
  const totalExpenses = transactionsArray.reduce((total: number, transaction: Transaction) => {
    // Only include negative amounts (expenses)
    if (transaction.amount < 0) {
      return total + Math.abs(transaction.amount);
    }
    return total;
  }, 0);

  console.log('Total monthly expenses calculated:', totalExpenses);
  return totalExpenses;
};
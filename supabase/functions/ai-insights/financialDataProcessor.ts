import { BankStatement, PaystubData, FinancialMetrics, Transaction } from './types.ts';

export function processFinancialData(
  bankStatements: BankStatement[],
  paystubs: PaystubData[]
): FinancialMetrics {
  console.log('Starting financial data processing');

  // Calculate monthly net income from paystubs
  const monthlyNetIncome = paystubs?.reduce((total, stub) => 
    total + (stub.net_pay || 0), 0) / 3 || 0;

  // Get latest statement's transactions and expenses
  const latestStatement = bankStatements?.[0];
  console.log('Latest statement data:', {
    month: latestStatement?.statement_month,
    totalExpenses: latestStatement?.total_withdrawals,
    transactionCount: latestStatement?.transactions?.length
  });

  // Calculate monthly expenses from transactions
  let monthlyExpenses = 0;
  let transactions: Transaction[] = [];

  if (latestStatement?.transactions) {
    try {
      transactions = typeof latestStatement.transactions === 'string' 
        ? JSON.parse(latestStatement.transactions) 
        : latestStatement.transactions;
      
      console.log('Processing transactions:', {
        count: transactions.length,
        sampleTransaction: transactions[0]
      });
    } catch (error) {
      console.error('Error parsing transactions:', error);
      transactions = [];
    }
  }

  if (Array.isArray(transactions) && transactions.length > 0) {
    monthlyExpenses = transactions.reduce((total, transaction) => {
      if (transaction.amount < 0) {
        const expense = Math.abs(transaction.amount);
        console.log(`Adding expense: ${expense} from transaction:`, transaction);
        return total + expense;
      }
      return total;
    }, 0);
  } else {
    console.log('No valid transactions found, using total_withdrawals');
    monthlyExpenses = Math.abs(latestStatement?.total_withdrawals || 0);
  }
  
  console.log('Final calculated monthly expenses:', monthlyExpenses);

  // Calculate savings rate
  const savingsRate = monthlyNetIncome > 0 
    ? ((monthlyNetIncome - monthlyExpenses) / monthlyNetIncome) * 100 
    : 0;

  // Analyze spending categories
  const spendingCategories = new Map();
  if (Array.isArray(transactions) && transactions.length > 0) {
    transactions.forEach((transaction) => {
      if (transaction.amount < 0) {
        const category = transaction.category || 'Uncategorized';
        const currentAmount = spendingCategories.get(category) || 0;
        const newAmount = currentAmount + Math.abs(transaction.amount);
        spendingCategories.set(category, newAmount);
      }
    });
  }

  // Get top expense categories
  const topExpenseCategories = Array.from(spendingCategories.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([category, amount]) => ({ category, amount }));

  console.log('Top expense categories:', topExpenseCategories);

  // Calculate income trends
  const incomeChanges = [];
  for (let i = 1; i < paystubs?.length; i++) {
    const currentPay = paystubs[i].net_pay;
    const previousPay = paystubs[i-1].net_pay;
    if (currentPay && previousPay) {
      const change = ((currentPay - previousPay) / previousPay) * 100;
      incomeChanges.push(change);
    }
  }

  const metrics: FinancialMetrics = {
    monthlyNetIncome,
    monthlyExpenses,
    savingsRate,
    topExpenseCategories,
    incomeChanges
  };

  console.log('Final processed financial metrics:', metrics);
  return metrics;
}
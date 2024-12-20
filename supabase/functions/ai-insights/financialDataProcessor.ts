import { BankStatement, PaystubData, FinancialMetrics, Transaction } from './types.ts';

export function processFinancialData(
  bankStatements: BankStatement[],
  paystubs: PaystubData[]
): FinancialMetrics {
  console.log('Processing financial data. Bank statements:', bankStatements, 'Paystubs:', paystubs);

  // Calculate monthly net income from paystubs
  const monthlyNetIncome = paystubs?.reduce((total, stub) => 
    total + (stub.net_pay || 0), 0) / 3 || 0;

  // Get latest statement's transactions
  const latestStatement = bankStatements?.[0];
  console.log('Latest statement:', latestStatement);

  // Calculate monthly expenses from transactions
  let monthlyExpenses = 0;
  let transactions: Transaction[] = [];

  if (latestStatement?.transactions) {
    try {
      // Handle case where transactions might be a string
      transactions = typeof latestStatement.transactions === 'string' 
        ? JSON.parse(latestStatement.transactions) 
        : latestStatement.transactions;
    } catch (error) {
      console.error('Error parsing transactions:', error);
      transactions = [];
    }
  }

  if (Array.isArray(transactions) && transactions.length > 0) {
    console.log('Processing transactions:', transactions);
    monthlyExpenses = transactions.reduce((total, transaction) => {
      if (transaction.amount < 0) {
        const expense = Math.abs(transaction.amount);
        console.log(`Adding expense: ${expense} from transaction:`, transaction);
        return total + expense;
      }
      return total;
    }, 0);
  } else {
    console.log('No valid transactions found in latest statement');
    // Fallback to total_withdrawals if transactions are not available
    monthlyExpenses = Math.abs(latestStatement?.total_withdrawals || 0);
    console.log('Using total_withdrawals as fallback:', monthlyExpenses);
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
        console.log(`Category ${category}: ${currentAmount} + ${Math.abs(transaction.amount)} = ${newAmount}`);
        spendingCategories.set(category, newAmount);
      }
    });
  }

  // Get top expense categories
  const topExpenseCategories = Array.from(spendingCategories.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([category, amount]) => ({ category, amount }));

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
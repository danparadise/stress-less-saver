import { BankStatement, PaystubData, FinancialMetrics, Transaction } from './types.ts';

export function processFinancialData(
  bankStatements: BankStatement[],
  paystubs: PaystubData[]
): FinancialMetrics {
  console.log('Processing financial data:', { bankStatements, paystubs });

  // Calculate monthly net income from paystubs
  const monthlyNetIncome = paystubs?.reduce((total, stub) => 
    total + (stub.net_pay || 0), 0) / 3 || 0;

  // Get latest statement's transactions
  const latestStatement = bankStatements?.[0];
  console.log('Latest statement:', latestStatement);

  // Calculate monthly expenses from transactions
  let monthlyExpenses = 0;
  if (latestStatement?.transactions && Array.isArray(latestStatement.transactions)) {
    monthlyExpenses = latestStatement.transactions.reduce((total, transaction: Transaction) => {
      // Only sum negative amounts (expenses)
      return transaction.amount < 0 ? total + Math.abs(transaction.amount) : total;
    }, 0);
  }
  console.log('Calculated monthly expenses:', monthlyExpenses);

  // Calculate savings rate
  const savingsRate = monthlyNetIncome > 0 
    ? ((monthlyNetIncome - monthlyExpenses) / monthlyNetIncome) * 100 
    : 0;

  // Analyze spending categories
  const spendingCategories = new Map();
  if (latestStatement?.transactions) {
    latestStatement.transactions.forEach((transaction: Transaction) => {
      if (transaction.amount < 0) {
        const category = transaction.category || 'Uncategorized';
        spendingCategories.set(
          category, 
          (spendingCategories.get(category) || 0) + Math.abs(transaction.amount)
        );
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

  console.log('Processed financial metrics:', metrics);
  return metrics;
}
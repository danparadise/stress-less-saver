import { addMonths, format, parseISO, subMonths } from "date-fns";

interface MonthlyData {
  month_year: string;
  total_income: number;
  total_expenses: number;
  transaction_categories: Record<string, number>;
  transactions: any[];
  paystub_data: any[];
}

export interface Insight {
  id: string;
  tip: string;
  category: string;
  type: 'positive' | 'warning' | 'suggestion';
}

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.abs(amount));
};

export const generateInsights = (summaries: MonthlyData[]): Insight[] => {
  if (!summaries || summaries.length === 0) return [];
  
  const insights: Insight[] = [];
  const currentMonth = summaries[0];
  const previousMonth = summaries[1];

  // Analyze recurring transactions
  if (currentMonth.transactions && Array.isArray(currentMonth.transactions)) {
    const merchantFrequency = new Map<string, { count: number; totalSpent: number }>();
    
    currentMonth.transactions.forEach(transaction => {
      if (transaction.amount < 0) { // Only analyze expenses
        const merchant = transaction.description;
        const current = merchantFrequency.get(merchant) || { count: 0, totalSpent: 0 };
        merchantFrequency.set(merchant, {
          count: current.count + 1,
          totalSpent: current.totalSpent + Math.abs(transaction.amount)
        });
      }
    });

    // Find most frequent merchant
    const mostFrequent = Array.from(merchantFrequency.entries())
      .sort((a, b) => b[1].count - a[1].count)[0];

    if (mostFrequent) {
      insights.push({
        id: 'frequent-merchant-' + Date.now(),
        tip: `Your most frequent transaction was at ${mostFrequent[0]}, visiting ${mostFrequent[1].count} times and spending ${formatCurrency(mostFrequent[1].totalSpent)}.`,
        category: 'spending',
        type: 'suggestion'
      });
    }

    // Analyze credit card payments
    const creditPayments = currentMonth.transactions
      .filter(t => 
        t.amount < 0 && 
        (t.category === 'Credit Card Payment' || 
         t.description.toLowerCase().includes('credit') ||
         t.description.toLowerCase().includes('affirm') ||
         t.description.toLowerCase().includes('klarna'))
      )
      .reduce((total, t) => total + Math.abs(t.amount), 0);

    if (creditPayments > 0) {
      insights.push({
        id: 'credit-payments-' + Date.now(),
        tip: `Your total credit-related payments this month were ${formatCurrency(creditPayments)}.`,
        category: 'credit',
        type: creditPayments > currentMonth.total_income * 0.3 ? 'warning' : 'suggestion'
      });
    }
  }

  // Savings potential analysis
  if (currentMonth.transaction_categories) {
    const discretionaryCategories = [
      'Entertainment', 'Shopping', 'Restaurants', 'Fast Food',
      'Electronics & Software', 'Clothing'
    ];
    
    const discretionarySpending = Object.entries(currentMonth.transaction_categories)
      .filter(([category]) => 
        discretionaryCategories.some(c => 
          category.toLowerCase().includes(c.toLowerCase())
        )
      )
      .reduce((total, [_, amount]) => total + Number(amount), 0);

    if (discretionarySpending > 0) {
      const potentialSavings = Math.round(discretionarySpending * 0.2); // Suggest saving 20% of discretionary spending
      insights.push({
        id: 'savings-potential-' + Date.now(),
        tip: `Based on your discretionary spending of ${formatCurrency(discretionarySpending)}, you could potentially save ${formatCurrency(potentialSavings)} by reducing non-essential purchases.`,
        category: 'savings',
        type: 'suggestion'
      });
    }
  }

  // Monthly Spending Analysis
  if (currentMonth.total_expenses > 0) {
    const monthName = format(parseISO(currentMonth.month_year), 'MMMM');
    insights.push({
      id: 'monthly-spending-' + Date.now(),
      tip: `Your total spending for ${monthName} is ${formatCurrency(currentMonth.total_expenses)}.`,
      category: 'spending',
      type: 'suggestion'
    });
  }

  // Category Analysis
  if (currentMonth.transaction_categories) {
    const categories = Object.entries(currentMonth.transaction_categories)
      .filter(([_, amount]) => amount > 0)
      .sort(([, a], [, b]) => b - a);

    if (categories.length > 0) {
      const [topCategory, topAmount] = categories[0];
      const monthName = format(parseISO(currentMonth.month_year), 'MMMM');
      
      insights.push({
        id: 'top-category-' + Date.now(),
        tip: `Your highest expense category in ${monthName} was ${topCategory}, at ${formatCurrency(topAmount)}.`,
        category: 'spending',
        type: 'suggestion'
      });

      // Compare with previous month's category spending
      if (previousMonth && previousMonth.transaction_categories) {
        const previousAmount = previousMonth.transaction_categories[topCategory] || 0;
        if (previousAmount > 0) {
          const changePercent = ((topAmount - previousAmount) / previousAmount) * 100;
          if (!isNaN(changePercent) && Math.abs(changePercent) > 10) {
            insights.push({
              id: 'category-change-' + Date.now(),
              tip: `Your spending on ${topCategory} has ${changePercent > 0 ? 'increased' : 'decreased'} by ${Math.abs(changePercent).toFixed(1)}% compared to last month.`,
              category: 'spending',
              type: changePercent > 20 ? 'warning' : 'positive'
            });
          }
        }
      }
    }
  }

  // Return a random selection of insights
  return insights
    .filter(insight => !insight.tip.includes('NaN') && !insight.tip.includes('Infinity'))
    .sort(() => Math.random() - 0.5)
    .slice(0, Math.min(4, insights.length));
};
import { addMonths, format, startOfMonth } from "date-fns";

interface InsightData {
  total_income: number;
  total_expenses: number;
  transaction_categories?: Record<string, number>;
  transactions?: any[];
  paystub_data?: any[];
}

export interface Insight {
  id: string;
  tip: string;
  category: string;
  type: 'positive' | 'warning' | 'suggestion';
}

export const generateInsights = (summary: InsightData | null): Insight[] => {
  const insights: Insight[] = [];
  
  if (!summary) return insights;

  // Calculate savings rate
  const savingsRate = Number(summary.total_income) > 0 
    ? ((Number(summary.total_income) - Number(summary.total_expenses)) / Number(summary.total_income)) * 100 
    : 0;

  // Add savings insight
  insights.push({
    id: 'savings-rate',
    tip: `Your current savings rate is ${savingsRate.toFixed(1)}%. ${
      savingsRate < 20 
        ? 'Consider setting aside more for savings.' 
        : 'Great job on maintaining a healthy savings rate!'
    }`,
    category: 'savings',
    type: savingsRate >= 20 ? 'positive' : 'warning'
  });

  // Analyze spending categories
  if (summary.transaction_categories) {
    const categories = Object.entries(summary.transaction_categories)
      .sort(([, a], [, b]) => Number(b) - Number(a));

    if (categories.length > 0) {
      const [topCategory, topAmount] = categories[0];
      const spendingPercentage = (Number(topAmount) / Number(summary.total_income)) * 100;
      
      insights.push({
        id: 'top-spending',
        tip: `Your highest spending category is ${topCategory} at $${Number(topAmount).toFixed(2)} (${spendingPercentage.toFixed(1)}% of income). ${
          spendingPercentage > 30 
            ? 'This might be an area to review for potential savings.' 
            : 'This appears to be within a reasonable range.'
        }`,
        category: 'spending',
        type: spendingPercentage <= 30 ? 'positive' : 'warning'
      });
    }
  }

  // Holiday spending insight (show from October through December)
  const currentMonth = new Date().getMonth();
  if (currentMonth >= 9 && currentMonth <= 11) {
    insights.push({
      id: 'holiday-planning',
      tip: "Holiday season is approaching! Consider setting aside extra funds for gifts and celebrations. Based on your current spending patterns, we recommend allocating about 1-2% of your monthly income for holiday expenses.",
      category: 'planning',
      type: 'suggestion'
    });
  }

  // Subscription analysis
  if (summary.transaction_categories) {
    const subscriptionCategories = ['Entertainment', 'Subscriptions', 'Streaming', 'Software'];
    const subscriptionTotal = Object.entries(summary.transaction_categories)
      .filter(([category]) => 
        subscriptionCategories.some(sub => 
          category.toLowerCase().includes(sub.toLowerCase())
        )
      )
      .reduce((sum, [, amount]) => sum + Number(amount), 0);

    if (subscriptionTotal > 0) {
      const subscriptionPercentage = (subscriptionTotal / Number(summary.total_income)) * 100;
      insights.push({
        id: 'subscriptions',
        tip: `You're spending $${subscriptionTotal.toFixed(2)} (${subscriptionPercentage.toFixed(1)}% of income) on subscriptions. ${
          subscriptionPercentage > 10 
            ? 'Consider reviewing these recurring expenses to identify any unused services.' 
            : 'This appears to be within a reasonable range.'
        }`,
        category: 'subscriptions',
        type: subscriptionPercentage <= 10 ? 'positive' : 'warning'
      });
    }
  }

  // Cash flow analysis
  if (summary.transactions && Array.isArray(summary.transactions)) {
    const midMonthTransactions = summary.transactions
      .filter(t => new Date(t.date).getDate() >= 10 && new Date(t.date).getDate() <= 20);
    
    const midMonthBalance = midMonthTransactions.length > 0
      ? midMonthTransactions[midMonthTransactions.length - 1].balance
      : null;

    if (midMonthBalance !== null && Number(midMonthBalance) < Number(summary.total_expenses) * 0.5) {
      insights.push({
        id: 'cash-flow',
        tip: "Your mid-month balance tends to run low. Consider spreading out major expenses throughout the month to maintain better cash flow.",
        category: 'cash-flow',
        type: 'warning'
      });
    }
  }

  // Income trend analysis from paystub data
  if (summary.paystub_data && Array.isArray(summary.paystub_data) && summary.paystub_data.length > 1) {
    const sortedPaystubs = [...summary.paystub_data].sort((a, b) => 
      new Date(b.start_date).getTime() - new Date(a.start_date).getTime()
    );
    
    const latestPay = Number(sortedPaystubs[0].net_pay);
    const previousPay = Number(sortedPaystubs[1].net_pay);
    const payChange = ((latestPay - previousPay) / previousPay) * 100;

    if (Math.abs(payChange) > 1) {
      insights.push({
        id: 'income-trend',
        tip: payChange > 0
          ? `Great news! Your latest paycheck increased by ${payChange.toFixed(1)}% compared to the previous one. Keep up the good work!`
          : `Your latest paycheck decreased by ${Math.abs(payChange).toFixed(1)}%. This might be due to variations in hours worked or deductions.`,
        category: 'income',
        type: payChange > 0 ? 'positive' : 'warning'
      });
    }
  }

  // Ensure at least one positive insight
  const hasPositive = insights.some(insight => insight.type === 'positive');
  if (!hasPositive) {
    insights.push({
      id: 'general-positive',
      tip: "You're taking control of your finances by tracking your expenses. That's a great first step toward financial wellness!",
      category: 'general',
      type: 'positive'
    });
  }

  // Return at least 3 insights
  return insights.slice(0, Math.max(3, insights.length));
};
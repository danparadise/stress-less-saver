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

// Helper function to get a random item from an array
const getRandomItem = <T>(array: T[]): T => {
  return array[Math.floor(Math.random() * array.length)];
};

// Helper function to format currency
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export const generateInsights = (summary: InsightData | null): Insight[] => {
  const insights: Insight[] = [];
  
  if (!summary) return insights;

  // Calculate key metrics
  const savingsRate = Number(summary.total_income) > 0 
    ? ((Number(summary.total_income) - Number(summary.total_expenses)) / Number(summary.total_income)) * 100 
    : 0;
  const monthlyIncome = Number(summary.total_income);
  const monthlyExpenses = Number(summary.total_expenses);
  const monthlySavings = monthlyIncome - monthlyExpenses;

  // Generate savings insights with variations
  const savingsInsights = [
    `Your savings rate is ${savingsRate.toFixed(1)}%, which means you're saving ${formatCurrency(monthlySavings)} monthly. ${
      savingsRate >= 20 ? "This is a healthy savings habit!" : "Consider setting a goal to save 20% of your income."
    }`,
    `You're currently saving ${formatCurrency(monthlySavings)} per month. At this rate, you could save ${formatCurrency(monthlySavings * 12)} annually!`,
    `Your monthly savings of ${formatCurrency(monthlySavings)} represent ${savingsRate.toFixed(1)}% of your income. ${
      savingsRate > 15 ? "Great job maintaining a strong savings rate!" : "Small increases in savings can make a big difference over time."
    }`
  ];

  insights.push({
    id: 'savings-' + Date.now(),
    tip: getRandomItem(savingsInsights),
    category: 'savings',
    type: savingsRate >= 15 ? 'positive' : 'warning'
  });

  // Analyze spending categories
  if (summary.transaction_categories) {
    const categories = Object.entries(summary.transaction_categories)
      .sort(([, a], [, b]) => Number(b) - Number(a));

    if (categories.length > 0) {
      const [topCategory, topAmount] = categories[0];
      const spendingPercentage = (Number(topAmount) / monthlyIncome) * 100;
      
      const categoryInsights = [
        `Your highest expense category is ${topCategory}, at ${formatCurrency(Number(topAmount))} (${spendingPercentage.toFixed(1)}% of income).`,
        `${topCategory} represents your largest spending category this month at ${formatCurrency(Number(topAmount))}.`,
        `You've spent ${formatCurrency(Number(topAmount))} on ${topCategory}, making it your top expense category.`
      ];

      insights.push({
        id: 'category-' + Date.now(),
        tip: getRandomItem(categoryInsights) + (spendingPercentage > 30 
          ? " Consider reviewing this category for potential savings."
          : " This appears to be within a reasonable range."),
        category: 'spending',
        type: spendingPercentage <= 30 ? 'positive' : 'warning'
      });
    }
  }

  // Income trend analysis
  if (summary.paystub_data && Array.isArray(summary.paystub_data) && summary.paystub_data.length > 1) {
    const sortedPaystubs = [...summary.paystub_data].sort((a, b) => 
      new Date(b.start_date).getTime() - new Date(a.start_date).getTime()
    );
    
    const latestPay = Number(sortedPaystubs[0].net_pay);
    const previousPay = Number(sortedPaystubs[1].net_pay);
    const payChange = ((latestPay - previousPay) / previousPay) * 100;

    const incomeInsights = [
      `Your latest paycheck ${payChange > 0 ? 'increased' : 'decreased'} by ${Math.abs(payChange).toFixed(1)}% compared to the previous one.`,
      `There's been a ${Math.abs(payChange).toFixed(1)}% ${payChange > 0 ? 'rise' : 'reduction'} in your recent pay.`,
      `Your income has ${payChange > 0 ? 'grown' : 'declined'} by ${Math.abs(payChange).toFixed(1)}% based on your latest paycheck.`
    ];

    if (Math.abs(payChange) > 1) {
      insights.push({
        id: 'income-' + Date.now(),
        tip: getRandomItem(incomeInsights) + (payChange > 0 
          ? " Keep up the great work!"
          : " This might be due to variations in hours worked or deductions."),
        category: 'income',
        type: payChange > 0 ? 'positive' : 'warning'
      });
    }
  }

  // Budget utilization insights
  const budgetUtilization = (monthlyExpenses / monthlyIncome) * 100;
  const budgetInsights = [
    `You're utilizing ${budgetUtilization.toFixed(1)}% of your monthly income.`,
    `Your expenses represent ${budgetUtilization.toFixed(1)}% of your monthly earnings.`,
    `You're spending ${budgetUtilization.toFixed(1)}% of what you earn each month.`
  ];

  insights.push({
    id: 'budget-' + Date.now(),
    tip: getRandomItem(budgetInsights) + (budgetUtilization <= 85 
      ? " This shows good budget management!"
      : " Consider reviewing your expenses to increase your savings."),
    category: 'budget',
    type: budgetUtilization <= 85 ? 'positive' : 'warning'
  });

  // Ensure at least one positive insight
  const hasPositive = insights.some(insight => insight.type === 'positive');
  if (!hasPositive) {
    const positiveInsights = [
      "You're actively tracking your finances, which is a great step toward financial wellness!",
      "Regular financial monitoring is key to achieving your money goals. Keep it up!",
      "Taking control of your finances through tracking is an excellent financial habit!"
    ];

    insights.push({
      id: 'general-positive-' + Date.now(),
      tip: getRandomItem(positiveInsights),
      category: 'general',
      type: 'positive'
    });
  }

  // Randomize the order of insights and return at least 3
  return insights
    .sort(() => Math.random() - 0.5)
    .slice(0, Math.max(3, insights.length));
};
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

  // Month-over-Month Spending Comparison
  if (previousMonth && currentMonth.total_expenses > 0 && previousMonth.total_expenses > 0) {
    const spendingChange = ((currentMonth.total_expenses - previousMonth.total_expenses) / previousMonth.total_expenses) * 100;
    const currentMonthName = format(parseISO(currentMonth.month_year), 'MMMM');
    const previousMonthName = format(parseISO(previousMonth.month_year), 'MMMM');
    
    if (!isNaN(spendingChange)) {
      insights.push({
        id: 'spending-trend-' + Date.now(),
        tip: `Your spending in ${currentMonthName} ${spendingChange > 0 ? 'increased' : 'decreased'} by ${Math.abs(spendingChange).toFixed(1)}% compared to ${previousMonthName}.`,
        category: 'spending',
        type: spendingChange > 10 ? 'warning' : 'positive'
      });
    }
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

  // Income Analysis
  if (currentMonth.total_income > 0 && previousMonth && previousMonth.total_income > 0) {
    const incomeChange = ((currentMonth.total_income - previousMonth.total_income) / previousMonth.total_income) * 100;
    if (!isNaN(incomeChange) && Math.abs(incomeChange) > 5) {
      insights.push({
        id: 'income-change-' + Date.now(),
        tip: `Your income has ${incomeChange > 0 ? 'increased' : 'decreased'} by ${Math.abs(incomeChange).toFixed(1)}% compared to last month.`,
        category: 'income',
        type: incomeChange > 0 ? 'positive' : 'warning'
      });
    }
  }

  // Savings Rate Analysis
  if (currentMonth.total_income > 0 && currentMonth.total_expenses > 0) {
    const savingsRate = ((currentMonth.total_income - currentMonth.total_expenses) / currentMonth.total_income) * 100;
    if (!isNaN(savingsRate) && savingsRate !== Infinity) {
      const monthName = format(parseISO(currentMonth.month_year), 'MMMM');
      insights.push({
        id: 'savings-rate-' + Date.now(),
        tip: `Your savings rate for ${monthName} is ${savingsRate.toFixed(1)}%. ${
          savingsRate >= 20 ? "Great job maintaining a healthy savings rate!" : 
          savingsRate > 0 ? "Consider setting a goal to save 20% of your income." :
          "Consider reviewing your expenses to improve your savings rate."
        }`,
        category: 'savings',
        type: savingsRate >= 20 ? 'positive' : savingsRate > 0 ? 'suggestion' : 'warning'
      });
    }
  }

  return insights
    .filter(insight => !insight.tip.includes('NaN') && !insight.tip.includes('Infinity'))
    .sort(() => Math.random() - 0.5)
    .slice(0, Math.max(3, insights.length));
};
import { FinancialMetrics } from './types.ts';

export function generateSystemPrompt(metrics: FinancialMetrics): string {
  // Format income trends safely, handling undefined case
  const incomeTrends = metrics.incomeChanges && metrics.incomeChanges.length > 0
    ? metrics.incomeChanges.map(change => `${change > 0 ? '+' : ''}${change.toFixed(1)}%`).join(', ')
    : 'No income trend data available';

  // Extract recurring transactions/subscriptions from transactions
  const transactions = metrics.transactions || [];
  
  // Analyze spending by category with case-insensitive matching
  const categorySpending = new Map();
  transactions.forEach((t: any) => {
    if (t.amount < 0) { // Only consider expenses (negative amounts)
      const category = (t.category || 'Uncategorized').toLowerCase();
      const amount = Math.abs(Number(t.amount));
      categorySpending.set(category, (categorySpending.get(category) || 0) + amount);
    }
  });

  // Format category spending for the prompt
  const formattedCategorySpending = Array.from(categorySpending.entries())
    .map(([category, amount]) => `${category}: $${amount.toFixed(2)}`)
    .join('\n');

  // Analyze vendors by category with case-insensitive matching
  const vendorAnalysis = new Map();
  transactions.forEach((t: any) => {
    if (t.amount < 0) { // Only analyze expenses
      const category = (t.category || '').toLowerCase();
      const description = (t.description || '').toLowerCase();
      const amount = Math.abs(Number(t.amount));

      if (!vendorAnalysis.has(category)) {
        vendorAnalysis.set(category, new Map());
      }
      
      const categoryVendors = vendorAnalysis.get(category);
      categoryVendors.set(description, (categoryVendors.get(description) || 0) + amount);
    }
  });

  // Format vendor analysis for each category
  const formattedVendorAnalysis = Array.from(vendorAnalysis.entries())
    .map(([category, vendors]) => {
      const sortedVendors = Array.from(vendors.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([vendor, amount]) => `  - ${vendor}: $${amount.toFixed(2)}`);

      return sortedVendors.length > 0
        ? `${category}:\n${sortedVendors.join('\n')}`
        : null;
    })
    .filter(Boolean)
    .join('\n\n');

  return `You are PayGuard AI Assistant, a personalized financial advisor with access to the user's actual transaction data, paystubs, and spending patterns. Your goal is to provide data-driven, actionable advice based on their specific financial situation.

Current Financial Data:
- Monthly Net Income: $${metrics.monthlyNetIncome.toFixed(2)}
- Monthly Expenses: $${metrics.monthlyExpenses.toFixed(2)}
- Savings Rate: ${metrics.savingsRate.toFixed(1)}%

Spending by Category:
${formattedCategorySpending || 'No spending data available for this period'}

Top Vendors by Category:
${formattedVendorAnalysis || 'No vendor data available for this period'}

Income Trends:
${incomeTrends}

Response Guidelines:
1. For questions about specific categories or vendors:
   - First check if there's data for the specified category using case-insensitive matching
   - If transactions exist, provide:
     a) Total amount spent in that category
     b) Top 3 vendors if available
     c) Date range of the transactions
   - Only say "No transaction data found" if there are truly no matching transactions

2. For questions about spending patterns:
   - Use actual numbers from the transaction data
   - Compare against the total monthly expenses
   - Highlight any unusual patterns or large transactions

3. For financial advice:
   - Start with "Based on your transaction data:"
   - Reference specific spending patterns
   - Provide actionable recommendations
   - End with a specific question about their preferences or habits

Remember to:
- Use case-insensitive matching when searching for categories
- Only report "No transaction data found" when there are truly no matching transactions
- Use exact amounts from the transaction data
- Be consistent in your responses about data availability`;
}
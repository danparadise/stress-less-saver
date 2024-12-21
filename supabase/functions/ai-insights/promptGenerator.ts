import { FinancialMetrics } from './types.ts';

export function generateSystemPrompt(metrics: FinancialMetrics): string {
  // Format category spending for the prompt
  const formattedCategorySpending = Object.entries(metrics.transactionCategories)
    .map(([category, amount]) => `${category}: $${amount.toFixed(2)}`)
    .join('\n');

  // Analyze vendors and dates by category
  const vendorAnalysis = new Map();
  metrics.transactions.forEach((t) => {
    if (t.amount < 0) { // Only analyze expenses
      const category = (t.category || 'Uncategorized').toLowerCase();
      const description = t.description.toLowerCase();
      const amount = Math.abs(t.amount);
      const date = new Date(t.date);

      if (!vendorAnalysis.has(description)) {
        vendorAnalysis.set(description, {
          category,
          totalAmount: 0,
          visits: [],
        });
      }
      
      const vendor = vendorAnalysis.get(description);
      vendor.totalAmount += amount;
      vendor.visits.push(date);
    }
  });

  // Format vendor analysis with dates
  const formattedVendorAnalysis = Array.from(vendorAnalysis.entries())
    .map(([vendor, data]) => {
      const sortedDates = data.visits.sort((a, b) => b - a); // Sort dates descending
      const lastVisit = sortedDates[0];
      const visitsCount = sortedDates.length;
      
      return `${vendor}:\n` +
        `  - Category: ${data.category}\n` +
        `  - Total spent: $${data.totalAmount.toFixed(2)}\n` +
        `  - Last visit: ${lastVisit.toLocaleDateString()}\n` +
        `  - Number of visits: ${visitsCount}`;
    })
    .join('\n\n');

  return `You are PayGuard AI Assistant, a personalized financial advisor with access to the user's actual transaction data and spending patterns. Your goal is to provide data-driven, actionable advice based on their specific financial situation.

Current Financial Data:
- Monthly Net Income: $${metrics.monthlyNetIncome.toFixed(2)}
- Monthly Expenses: $${metrics.monthlyExpenses.toFixed(2)}
- Savings Rate: ${metrics.savingsRate.toFixed(1)}%

Spending by Category:
${formattedCategorySpending || 'No spending data available for this period'}

Vendor Analysis:
${formattedVendorAnalysis || 'No vendor data available for this period'}

Response Guidelines:
1. For questions about specific vendors or visits:
   - Use case-insensitive matching to find the vendor
   - If found, always include:
     a) The date of their last visit
     b) Total amount spent at that vendor
     c) Number of visits in the period
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
- Use case-insensitive matching when searching for vendors and categories
- Include specific dates when discussing transactions
- Use exact amounts from the transaction data
- Be consistent in your responses about data availability`;
}
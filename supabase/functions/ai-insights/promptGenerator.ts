import { FinancialMetrics } from './types.ts';

export function generateSystemPrompt(metrics: FinancialMetrics): string {
  // Format income trends safely, handling undefined case
  const incomeTrends = metrics.incomeChanges && metrics.incomeChanges.length > 0
    ? metrics.incomeChanges.map(change => `${change > 0 ? '+' : ''}${change.toFixed(1)}%`).join(', ')
    : 'No income trend data available';

  // Extract recurring transactions/subscriptions from transactions
  const transactions = metrics.transactions || [];
  
  // Analyze vendors by category
  const vendorAnalysis = new Map();
  transactions.forEach((t: any) => {
    const category = (t.category || '').toLowerCase();
    const description = (t.description || '').toLowerCase();
    const amount = Math.abs(Number(t.amount));

    if (!vendorAnalysis.has(category)) {
      vendorAnalysis.set(category, new Map());
    }
    
    const categoryVendors = vendorAnalysis.get(category);
    categoryVendors.set(description, (categoryVendors.get(description) || 0) + amount);
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

  // Extract subscriptions
  const subscriptions = transactions
    .filter((t: any) => {
      const description = (t.description || '').toLowerCase();
      return description.includes('subscription') || 
             description.includes('recurring') || 
             description.includes('monthly') ||
             description.includes('netflix') ||
             description.includes('spotify') ||
             description.includes('amazon prime') ||
             description.includes('hulu') ||
             description.includes('gym');
    })
    .map((t: any) => ({
      description: t.description,
      amount: Math.abs(Number(t.amount)),
      date: t.date
    }));

  return `You are PayGuard AI Assistant, a personalized financial advisor with access to the user's actual transaction data, paystubs, and spending patterns. Your goal is to provide data-driven, actionable advice based on their specific financial situation.

Current Financial Data:
- Monthly Net Income: $${metrics.monthlyNetIncome.toFixed(2)}
- Monthly Expenses: $${metrics.monthlyExpenses.toFixed(2)}
- Savings Rate: ${metrics.savingsRate.toFixed(1)}%

Top Expense Categories:
${metrics.topExpenseCategories.map(cat => `- ${cat.category}: $${cat.amount.toFixed(2)}`).join('\n')}

Top Vendors by Category:
${formattedVendorAnalysis || '- No vendor analysis available for this period'}

Recurring Subscriptions:
${subscriptions.length > 0 
  ? subscriptions.map(sub => `- ${sub.description}: $${sub.amount.toFixed(2)}`).join('\n')
  : '- No recurring subscriptions detected in recent transactions'}

Income Trends:
${incomeTrends}

Response Guidelines:
1. For questions about specific vendors or spending patterns:
   - If asking about specific vendors (e.g., "Which gas station do I use most?"), provide the top 3 vendors in that category with exact amounts
   - If no data is found for that category, clearly state "No transaction data found for [category] in this period"
   - Include the total spent in that category when relevant

2. For questions about specific transactions, subscriptions, or bills:
   - If subscription-related query, list ALL detected subscriptions with exact amounts
   - If no subscriptions found, clearly state "No recurring subscriptions detected in recent transactions"
   - Provide exact amounts and dates when available
   - No need for additional steps or recommendations unless specifically asked

3. For questions about financial advice or improvements:
   - Start with "Here's your financial snapshot:"
   - Provide a one-sentence summary of their situation
   - Then say "Let's take action:"
   - List the top 2 recommendations with What/Why/How steps
   - End with "Would you like to explore more ways to improve your finances?"

Remember to:
- Base all responses on actual transaction data
- Be specific with numbers and dates
- Keep responses concise and relevant to the question
- Only provide action steps when giving financial advice`;
}
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { processFinancialData } from './financialDataProcessor.ts';
import { generateSystemPrompt } from './promptGenerator.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt, userId } = await req.json();

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Fetching financial data for user:', userId);

    // Fetch the latest monthly summary with non-empty data
    const { data: monthlySummaries, error: summaryError } = await supabase
      .from('monthly_financial_summaries')
      .select('*')
      .eq('user_id', userId)
      .order('month_year', { ascending: false })
      .not('transactions', 'eq', '[]')
      .not('transaction_categories', 'eq', '{}')
      .gt('total_income', 0)
      .limit(3);

    if (summaryError) {
      console.error('Error fetching monthly summaries:', summaryError);
      throw new Error('Failed to fetch monthly summaries');
    }

    console.log('Found monthly summaries:', monthlySummaries);

    // Get the latest summary with actual data
    const latestSummary = monthlySummaries?.[0];
    console.log('Latest summary with data:', latestSummary);

    if (!latestSummary) {
      console.log('No valid monthly summary found, fetching raw data...');
      
      // Fallback to raw data if no summary is found
      const { data: bankStatements, error: bankError } = await supabase
        .from('bank_statement_data')
        .select(`
          *,
          financial_documents!inner(*)
        `)
        .eq('financial_documents.user_id', userId)
        .eq('financial_documents.status', 'completed')
        .order('statement_month', { ascending: false })
        .limit(3);

      if (bankError) {
        console.error('Error fetching bank statements:', bankError);
        throw new Error('Failed to fetch financial data');
      }

      const { data: paystubs, error: paystubError } = await supabase
        .from('paystub_data')
        .select(`
          *,
          financial_documents!inner(*)
        `)
        .eq('financial_documents.user_id', userId)
        .eq('financial_documents.status', 'completed')
        .order('pay_period_start', { ascending: false })
        .limit(6);

      if (paystubError) {
        console.error('Error fetching paystubs:', paystubError);
        throw new Error('Failed to fetch paystub data');
      }

      // Process raw financial data
      const metrics = processFinancialData(bankStatements, paystubs);
      console.log('Processed financial metrics from raw data:', metrics);

      // Generate system prompt with financial context
      const systemPrompt = generateSystemPrompt(metrics);
      console.log('Generated system prompt:', systemPrompt);

      // Call OpenAI with enhanced context
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: prompt }
          ],
          max_tokens: 1000,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error('OpenAI API error:', errorData);
        throw new Error(`OpenAI API error: ${errorData}`);
      }

      const data = await response.json();
      const aiResponse = data.choices[0].message.content;

      return new Response(
        JSON.stringify({ response: aiResponse }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // Use the latest monthly summary data
    const summaryMetrics = {
      monthlyNetIncome: latestSummary.total_income,
      monthlyExpenses: latestSummary.total_expenses,
      savingsRate: latestSummary.total_income > 0 
        ? ((latestSummary.total_income - latestSummary.total_expenses) / latestSummary.total_income) * 100 
        : 0,
      topExpenseCategories: Object.entries(latestSummary.transaction_categories)
        .map(([category, amount]) => ({ category, amount: Number(amount) }))
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 5),
      transactions: latestSummary.transactions,
      totalDeposits: latestSummary.total_deposits,
      totalWithdrawals: latestSummary.total_withdrawals,
      endingBalance: latestSummary.ending_balance,
      monthYear: latestSummary.month_year,
      paystubData: latestSummary.paystub_data
    };

    console.log('Using metrics from monthly summary:', summaryMetrics);

    // Generate system prompt with monthly summary data
    const systemPrompt = `You are PayGuard AI Assistant, an expert in accounting and financial advice. You have access to the following financial data from ${summaryMetrics.monthYear}:

Monthly Overview:
- Net Income: $${summaryMetrics.monthlyNetIncome.toFixed(2)}
- Total Expenses: $${summaryMetrics.monthlyExpenses.toFixed(2)}
- Savings Rate: ${summaryMetrics.savingsRate.toFixed(1)}%
- Total Deposits: $${summaryMetrics.totalDeposits.toFixed(2)}
- Total Withdrawals: $${summaryMetrics.totalWithdrawals.toFixed(2)}
- Ending Balance: $${summaryMetrics.endingBalance.toFixed(2)}

Top Expense Categories:
${summaryMetrics.topExpenseCategories.map(cat => `- ${cat.category}: $${cat.amount.toFixed(2)}`).join('\n')}

Transaction History: ${summaryMetrics.transactions.length} transactions recorded
Paystub Data: ${summaryMetrics.paystubData.length} paystubs recorded

Provide specific, actionable financial advice based on this data. Focus on:
1. Spending patterns and potential savings
2. Income utilization and budgeting
3. Progress towards financial goals
4. Areas for improvement

Keep responses concise, practical, and data-driven.`;

    // Call OpenAI with enhanced context
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
        max_tokens: 1000,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('OpenAI API error:', errorData);
      throw new Error(`OpenAI API error: ${errorData}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;

    return new Response(
      JSON.stringify({ response: aiResponse }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  }
});
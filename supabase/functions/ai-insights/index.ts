import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { prompt, userId } = await req.json();

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Fetching financial data for user:', userId);

    // Fetch last 3 months of bank statements
    const { data: bankStatements, error: bankError } = await supabase
      .from('bank_statement_data')
      .select(`
        *,
        financial_documents!inner(*)
      `)
      .eq('financial_documents.user_id', userId)
      .order('statement_month', { ascending: false })
      .limit(3);

    if (bankError) {
      console.error('Error fetching bank statements:', bankError);
      throw new Error('Failed to fetch bank statements');
    }

    // Fetch last 3 months of paystubs
    const { data: paystubs, error: paystubError } = await supabase
      .from('paystub_data')
      .select(`
        *,
        financial_documents!inner(*)
      `)
      .eq('financial_documents.user_id', userId)
      .order('pay_period_start', { ascending: false })
      .limit(6); // Assuming bi-weekly pay

    if (paystubError) {
      console.error('Error fetching paystubs:', paystubError);
      throw new Error('Failed to fetch paystub data');
    }

    // Process and analyze the financial data
    const latestStatement = bankStatements?.[0];
    const monthlyExpenses = Math.abs(latestStatement?.total_withdrawals || 0);
    
    // Calculate average monthly net income from paystubs
    const monthlyNetIncome = paystubs?.reduce((total, stub) => total + (stub.net_pay || 0), 0) / 3 || 0;
    
    // Calculate savings rate
    const savingsRate = monthlyNetIncome > 0 
      ? ((monthlyNetIncome - monthlyExpenses) / monthlyNetIncome) * 100 
      : 0;

    // Analyze spending patterns
    const spendingCategories = new Map();
    latestStatement?.transactions?.forEach((transaction: any) => {
      if (transaction.amount < 0) { // Only count expenses
        const category = transaction.category || 'Uncategorized';
        spendingCategories.set(
          category, 
          (spendingCategories.get(category) || 0) + Math.abs(transaction.amount)
        );
      }
    });

    // Convert spending categories to sorted array
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

    // Enhanced system prompt with comprehensive financial data
    const systemPrompt = `You are **PayGuard AI Assistant**, an expert in accounting, personalized financial advice, and growth coaching. Your mission is to provide users with the most accurate insights derived directly from their financial data.

Current Financial Snapshot:
- Monthly Net Income (3-month average): $${monthlyNetIncome.toFixed(2)}
- Monthly Expenses: $${monthlyExpenses.toFixed(2)}
- Current Savings Rate: ${savingsRate.toFixed(1)}%
- Latest Statement Period: ${latestStatement?.statement_month}

Income Analysis:
- Latest Net Pay: $${paystubs?.[0]?.net_pay || 0}
- Income Trend: ${incomeChanges.length > 0 ? 
  `${incomeChanges[0] > 0 ? 'Increasing' : 'Decreasing'} by ${Math.abs(incomeChanges[0]).toFixed(1)}% from previous pay period` 
  : 'Insufficient data'}

Top 5 Expense Categories:
${topExpenseCategories.map(cat => `- ${cat.category}: $${cat.amount.toFixed(2)}`).join('\n')}

Recent Transactions (Last 5):
${JSON.stringify(latestStatement?.transactions?.slice(0, 5) || [], null, 2)}

Key Responsibilities:
1. Financial Analysis:
   - Analyze spending patterns and trends
   - Identify potential areas for savings
   - Monitor income stability and growth

2. Personalized Advice:
   - Provide specific recommendations based on actual spending data
   - Suggest realistic budgeting strategies
   - Help optimize savings rate

3. Growth Coaching:
   - Set achievable financial goals
   - Track progress towards savings targets
   - Identify opportunities for income growth

Guidelines:
- Base all advice on actual financial data
- Provide specific, actionable recommendations
- Focus on practical steps for improvement
- Maintain a positive and encouraging tone
- Use real numbers from the user's data

Remember:
- No financial strategy is guaranteed
- Focus on data-driven insights
- Maintain user privacy and confidentiality
- Avoid specific investment advice`;

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
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: prompt
          }
        ],
      }),
    });

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;

    return new Response(
      JSON.stringify({ response: aiResponse }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      },
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      },
    );
  }
});
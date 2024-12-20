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

    // Fetch user's financial data
    const { data: bankStatements, error: bankError } = await supabase
      .from('bank_statement_data')
      .select(`
        *,
        financial_documents!inner(*)
      `)
      .eq('financial_documents.user_id', userId)
      .order('statement_month', { ascending: false });

    const { data: paystubs, error: paystubError } = await supabase
      .from('paystub_data')
      .select(`
        *,
        financial_documents!inner(*)
      `)
      .eq('financial_documents.user_id', userId)
      .order('pay_period_start', { ascending: false });

    if (bankError || paystubError) {
      throw new Error('Error fetching financial data');
    }

    // Calculate key financial metrics
    const latestStatement = bankStatements?.[0];
    const monthlyIncome = paystubs?.[0]?.gross_pay || 0;
    const monthlyExpenses = Math.abs(latestStatement?.total_withdrawals || 0);
    const savingsRate = monthlyIncome > 0 
      ? ((monthlyIncome - monthlyExpenses) / monthlyIncome) * 100 
      : 0;

    // Prepare financial context for AI
    const financialContext = {
      monthlyIncome,
      monthlyExpenses,
      savingsRate,
      recentTransactions: latestStatement?.transactions || [],
      statementMonth: latestStatement?.statement_month,
    };

    // Call OpenAI with the context and user's prompt
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
            content: `You are a helpful financial advisor with access to the user's financial data. 
            Current financial snapshot:
            - Monthly Income: $${monthlyIncome}
            - Monthly Expenses: $${monthlyExpenses}
            - Savings Rate: ${savingsRate.toFixed(1)}%
            - Data from: ${financialContext.statementMonth}
            
            Provide specific, actionable advice based on their actual financial data.
            Be concise but friendly. Use actual numbers from their data when relevant.
            Focus on practical steps they can take to improve their financial health.`
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
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { generateSystemPrompt } from './promptGenerator.ts';
import { formatAIResponse } from './responseFormatter.ts';

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

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Fetching latest financial summary for user:', userId);

    // Fetch the latest monthly summary with non-empty data
    const { data: latestSummary, error: summaryError } = await supabase
      .from('monthly_financial_summaries')
      .select('*')
      .eq('user_id', userId)
      .order('month_year', { ascending: false })
      .not('transactions', 'eq', '[]')
      .not('transaction_categories', 'eq', '{}')
      .gt('total_income', 0)
      .limit(1)
      .single();

    if (summaryError) {
      console.error('Error fetching monthly summary:', summaryError);
      throw new Error('Failed to fetch financial data');
    }

    if (!latestSummary) {
      throw new Error('No valid financial summary found');
    }

    console.log('Found latest summary:', latestSummary);

    // Prepare financial metrics
    const metrics = {
      monthlyNetIncome: latestSummary.total_income,
      monthlyExpenses: latestSummary.total_expenses,
      savingsRate: latestSummary.total_income > 0 
        ? ((latestSummary.total_income - latestSummary.total_expenses) / latestSummary.total_income) * 100 
        : 0,
      topExpenseCategories: Object.entries(latestSummary.transaction_categories)
        .map(([category, amount]) => ({ category, amount: Number(amount) }))
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 5)
    };

    // Generate system prompt
    const systemPrompt = generateSystemPrompt(metrics);
    console.log('Generated system prompt:', systemPrompt);

    // Call OpenAI
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
        max_tokens: 500,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('OpenAI API error:', errorData);
      throw new Error(`OpenAI API error: ${errorData}`);
    }

    const data = await response.json();
    const aiResponse = formatAIResponse(data.choices[0].message.content);

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
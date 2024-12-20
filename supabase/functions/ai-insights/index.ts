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

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Fetching financial data for user:', userId);

    // Fetch last 3 months of bank statements with transactions
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
      throw new Error('Failed to fetch bank statements');
    }

    console.log('Fetched bank statements:', bankStatements);

    // Fetch last 3 months of paystubs
    const { data: paystubs, error: paystubError } = await supabase
      .from('paystub_data')
      .select(`
        *,
        financial_documents!inner(*)
      `)
      .eq('financial_documents.user_id', userId)
      .eq('financial_documents.status', 'completed')
      .order('pay_period_start', { ascending: false })
      .limit(6); // Assuming bi-weekly pay

    if (paystubError) {
      console.error('Error fetching paystubs:', paystubError);
      throw new Error('Failed to fetch paystub data');
    }

    console.log('Fetched paystubs:', paystubs);

    // Process financial data
    const metrics = processFinancialData(bankStatements, paystubs);
    console.log('Processed financial metrics:', metrics);

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
        model: 'gpt-4',
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
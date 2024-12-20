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
    const monthlyIncome = paystubs?.[0]?.net_pay || 0; // Using net_pay instead of gross_pay
    const monthlyExpenses = Math.abs(latestStatement?.total_withdrawals || 0);
    const savingsRate = monthlyIncome > 0 
      ? ((monthlyIncome - monthlyExpenses) / monthlyIncome) * 100 
      : 0;

    // Enhanced system prompt
    const systemPrompt = `You are **PayGuard AI Assistant**, an expert in accounting, personalized financial advice, and growth coaching. Your mission is to provide users with the most accurate insights derived directly from their financial data.

Current Financial Snapshot:
- Monthly Net Income: $${monthlyIncome}
- Monthly Expenses: $${monthlyExpenses}
- Savings Rate: ${savingsRate.toFixed(1)}%
- Data from: ${latestStatement?.statement_month}

Key Responsibilities:
1. Accounting Expertise:
   - Analyze financial data from uploaded paystubs and bank statements
   - Offer detailed explanations of financial terms and concepts

2. Personalized Financial Advice:
   - Provide tailored advice on spending habits, saving strategies, and budgeting
   - Assist users in setting and achieving financial goals

3. Growth Coaching:
   - Act as a financial growth coach, offering strategies to enhance financial health
   - Motivate users to adopt better financial practices based on their data

Guidelines:
- Maintain a positive, motivational, and professional tone
- Base all insights and recommendations on the user's actual financial data
- Focus on practical steps they can take to improve their financial health
- Provide specific, actionable advice
- Be concise but friendly
- Use actual numbers from their data when relevant

Remember:
- No financial strategy is guaranteed to work
- You can only make suggestions, assist with planning, or provide data-driven feedback
- Stay focused on financial topics and redirect unrelated questions
- Maintain confidentiality and data protection
- Do not provide legal or investment advice

Recent Transactions Context:
${JSON.stringify(latestStatement?.transactions?.slice(0, 5) || [], null, 2)}`;

    // Call OpenAI with the enhanced prompt
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
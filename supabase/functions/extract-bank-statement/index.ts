import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { Configuration, OpenAIApi } from "https://esm.sh/openai@3.1.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { documentId, pdfUrl } = await req.json();
    console.log('Received request with:', { documentId, pdfUrl });
    
    if (!documentId || !pdfUrl) {
      throw new Error('Missing required parameters');
    }

    // Initialize OpenAI
    const configuration = new Configuration({
      apiKey: Deno.env.get('OPENAI_API_KEY'),
    });
    const openai = new OpenAIApi(configuration);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase environment variables');
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Extract text from PDF using PDF.co API
    console.log('Starting PDF text extraction');
    const pdfCoApiKey = Deno.env.get('PDF_CO_API_KEY');
    if (!pdfCoApiKey) {
      throw new Error('Missing PDF.co API key');
    }

    const pdfToTextResponse = await fetch('https://api.pdf.co/v1/pdf/convert/to-text', {
      method: 'POST',
      headers: {
        'x-api-key': pdfCoApiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: pdfUrl,
        async: false
      }),
    });

    if (!pdfToTextResponse.ok) {
      const errorData = await pdfToTextResponse.text();
      console.error('PDF.co API error:', errorData);
      throw new Error('Failed to convert PDF to text');
    }

    const pdfToTextData = await pdfToTextResponse.json();
    if (!pdfToTextData.text) {
      throw new Error('No text extracted from PDF');
    }

    console.log('PDF text extracted successfully');

    // Use OpenAI to extract financial data
    const completion = await openai.createChatCompletion({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a financial data extraction assistant. Extract the following information from bank statements:
            - total_deposits (number)
            - total_withdrawals (number)
            - ending_balance (number)
            - transactions (array of objects with date, description, amount, and type fields)
            Format the response as valid JSON with these exact field names.`
        },
        {
          role: "user",
          content: pdfToTextData.text
        }
      ],
      temperature: 0.1,
    });

    if (!completion.data.choices[0]?.message?.content) {
      throw new Error('No response from OpenAI');
    }

    console.log('OpenAI extraction completed');

    const extractedData = JSON.parse(completion.data.choices[0].message.content);

    // Update bank statement data
    const { error: updateError } = await supabase
      .from('bank_statement_data')
      .update({
        total_deposits: extractedData.total_deposits || 0,
        total_withdrawals: extractedData.total_withdrawals || 0,
        ending_balance: extractedData.ending_balance || 0,
        transactions: extractedData.transactions || []
      })
      .eq('document_id', documentId);

    if (updateError) {
      console.error('Error updating bank statement data:', updateError);
      throw updateError;
    }

    // Update document status
    await supabase
      .from('financial_documents')
      .update({ status: 'completed' })
      .eq('id', documentId);

    console.log('Data updated successfully');

    return new Response(
      JSON.stringify({ success: true, data: extractedData }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in extract-bank-statement function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
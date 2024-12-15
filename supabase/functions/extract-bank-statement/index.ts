import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import { extractTextFromPdf } from "./pdfService.ts";
import { extractFinancialData } from "./openaiService.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { documentId, pdfUrl } = await req.json();
    console.log('Processing document:', documentId, 'URL:', pdfUrl);

    // Get API keys
    const pdfCoApiKey = Deno.env.get('PDF_CO_API_KEY');
    const openAiApiKey = Deno.env.get('OPENAI_API_KEY');

    if (!pdfCoApiKey || !openAiApiKey) {
      throw new Error('Missing required API keys');
    }

    // Extract text from PDF
    console.log('Extracting text from PDF...');
    const extractedText = await extractTextFromPdf(pdfUrl, pdfCoApiKey);
    console.log('Text extracted successfully');
    
    // Extract financial data using OpenAI
    console.log('Extracting financial data...');
    const extractedData = await extractFinancialData(extractedText, openAiApiKey);
    console.log('Financial data extracted:', extractedData);

    // Update database with extracted data
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { error: updateError } = await supabase
      .from('bank_statement_data')
      .update({
        statement_month: extractedData.statement_month,
        total_deposits: extractedData.total_deposits,
        total_withdrawals: extractedData.total_withdrawals,
        ending_balance: extractedData.ending_balance
      })
      .eq('document_id', documentId);

    if (updateError) {
      throw new Error(`Failed to update database: ${updateError.message}`);
    }

    // Update document status
    const { error: statusError } = await supabase
      .from('financial_documents')
      .update({ status: 'completed' })
      .eq('id', documentId);

    if (statusError) {
      throw new Error(`Failed to update document status: ${statusError.message}`);
    }

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
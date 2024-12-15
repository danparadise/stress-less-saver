import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
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
    const extractedText = await extractTextFromPdf(pdfUrl, pdfCoApiKey);
    
    // Extract financial data using OpenAI
    const extractedData = await extractFinancialData(extractedText, openAiApiKey);

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
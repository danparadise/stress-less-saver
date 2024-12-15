import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { Configuration, OpenAIApi } from "https://esm.sh/openai@3.1.0";

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

    // First, get a job ID from PDF.co
    const startJobResponse = await fetch('https://api.pdf.co/v1/pdf/text', {
      method: 'POST',
      headers: {
        'x-api-key': pdfCoApiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: pdfUrl,
        async: true,
        profiles: ["General"]
      }),
    });

    if (!startJobResponse.ok) {
      const errorData = await startJobResponse.text();
      console.error('PDF.co job start error:', errorData);
      throw new Error('Failed to start PDF conversion job');
    }

    const jobData = await startJobResponse.json();
    console.log('PDF.co job started:', jobData);

    if (!jobData.jobId) {
      throw new Error('No job ID received from PDF.co');
    }

    // Poll for job completion
    let textResult = null;
    let attempts = 0;
    const maxAttempts = 10;
    
    while (attempts < maxAttempts) {
      console.log(`Checking job status, attempt ${attempts + 1}/${maxAttempts}`);
      
      const checkJobResponse = await fetch(`https://api.pdf.co/v1/job/check?jobid=${jobData.jobId}`, {
        headers: {
          'x-api-key': pdfCoApiKey,
        },
      });

      if (!checkJobResponse.ok) {
        throw new Error('Failed to check job status');
      }

      const jobStatus = await checkJobResponse.json();
      console.log('Job status:', jobStatus);

      if (jobStatus.status === 'working') {
        await new Promise(resolve => setTimeout(resolve, 3000)); // Wait 3 seconds
        attempts++;
        continue;
      }

      if (jobStatus.status === 'success') {
        // Get the result URL and download the text
        const resultResponse = await fetch(jobStatus.url);
        if (!resultResponse.ok) {
          throw new Error('Failed to fetch conversion result');
        }
        textResult = await resultResponse.text();
        break;
      }

      if (jobStatus.status === 'error') {
        throw new Error(`PDF.co job failed: ${jobStatus.error}`);
      }

      attempts++;
    }

    if (!textResult) {
      throw new Error('Failed to get text result after maximum attempts');
    }

    console.log('PDF text extracted successfully');

    // Use OpenAI to extract financial data
    const completion = await openai.createChatCompletion({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a financial data extraction assistant. Extract the following information from bank statements:
            - total_deposits (sum of all deposits)
            - total_withdrawals (sum of all withdrawals)
            - ending_balance (final balance)
            - transactions (array of objects with date, description, amount, and type fields)
            
            Rules:
            1. For monetary values:
               - Remove currency symbols and commas
               - Convert to plain numbers
               - Use null if not found
            2. For dates:
               - Format as YYYY-MM-DD
               - Use null if not found
            3. For transactions:
               - type should be either "deposit" or "withdrawal"
               - amount should be a positive number
               - Return empty array if none found
            
            Return ONLY a valid JSON object with these exact field names.`
        },
        {
          role: "user",
          content: textResult
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
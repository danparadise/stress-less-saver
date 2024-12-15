import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'
import { Configuration, OpenAIApi } from "https://esm.sh/openai@3.1.0"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { documentId, pdfUrl } = await req.json()
    
    if (!documentId || !pdfUrl) {
      throw new Error('Missing required parameters')
    }

    // Initialize OpenAI
    const configuration = new Configuration({
      apiKey: Deno.env.get('OPENAI_API_KEY'),
    })
    const openai = new OpenAIApi(configuration)

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase environment variables')
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Download and process the PDF
    const response = await fetch(pdfUrl)
    if (!response.ok) {
      throw new Error('Failed to fetch PDF')
    }

    // Extract text from PDF using PDF.co API
    const pdfData = await response.arrayBuffer()
    const pdfBase64 = btoa(String.fromCharCode(...new Uint8Array(pdfData)))
    
    const pdfCoApiKey = Deno.env.get('PDF_CO_API_KEY')
    if (!pdfCoApiKey) {
      throw new Error('Missing PDF.co API key')
    }

    const pdfToTextResponse = await fetch(`https://api.pdf.co/v1/pdf/convert/to-text`, {
      method: 'POST',
      headers: {
        'x-api-key': pdfCoApiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: pdfUrl,
      }),
    })

    if (!pdfToTextResponse.ok) {
      throw new Error('Failed to convert PDF to text')
    }

    const pdfToTextData = await pdfToTextResponse.json()
    const extractedText = pdfToTextData.text

    // Use OpenAI to extract financial data
    const completion = await openai.createChatCompletion({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are a financial data extraction assistant. Extract the following information from bank statements: total deposits, total withdrawals, ending balance, and an array of transactions. Format the response as JSON."
        },
        {
          role: "user",
          content: extractedText
        }
      ]
    })

    const extractedData = JSON.parse(completion.data.choices[0].message.content)

    // Update bank statement data
    const { error: updateError } = await supabase
      .from('bank_statement_data')
      .update({
        total_deposits: extractedData.total_deposits,
        total_withdrawals: extractedData.total_withdrawals,
        ending_balance: extractedData.ending_balance,
        transactions: extractedData.transactions
      })
      .eq('document_id', documentId)

    if (updateError) {
      throw updateError
    }

    // Update document status
    await supabase
      .from('financial_documents')
      .update({ status: 'completed' })
      .eq('id', documentId)

    return new Response(
      JSON.stringify({ success: true, data: extractedData }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})
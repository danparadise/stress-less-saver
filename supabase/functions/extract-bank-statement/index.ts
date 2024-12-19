import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'
import "https://deno.land/x/xhr@0.1.0/mod.ts"
import { extractDataFromImage } from './openaiService.ts'
import { parseOpenAIResponse } from './openaiParser.ts'

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
    console.log('Processing document:', documentId, 'URL:', pdfUrl)

    // Convert PDF to images using PDF.co
    console.log('Converting PDF to PNG using PDF.co')
    const pdfCoApiKey = Deno.env.get('PDF_CO_API_KEY')
    if (!pdfCoApiKey) {
      throw new Error('PDF_CO_API_KEY not configured')
    }

    const pdfCoResponse = await fetch('https://api.pdf.co/v1/pdf/convert/to/png', {
      method: 'POST',
      headers: {
        'x-api-key': pdfCoApiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        url: pdfUrl,
        async: false,
        pages: "1" // Start with just first page
      })
    })

    if (!pdfCoResponse.ok) {
      throw new Error('Failed to convert PDF to PNG')
    }

    const pdfCoData = await pdfCoResponse.json()
    if (pdfCoData.error) {
      throw new Error(`PDF.co error: ${JSON.stringify(pdfCoData)}`)
    }
    
    if (!pdfCoData.urls || pdfCoData.urls.length === 0) {
      throw new Error('No PNG URLs returned from PDF.co')
    }

    // Process first page
    console.log(`Processing page URL: ${pdfCoData.urls[0]}`)
    const openAiResponse = await extractDataFromImage(pdfCoData.urls[0])
    const aiResult = await openAiResponse.json()
    
    if (!aiResult.choices?.[0]?.message?.content) {
      throw new Error('Invalid OpenAI response format')
    }

    const extractedData = parseOpenAIResponse(aiResult.choices[0].message.content)
    if (!extractedData) {
      throw new Error('Failed to parse extracted data')
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Update document status
    await supabase
      .from('financial_documents')
      .update({ status: 'completed' })
      .eq('id', documentId)

    // Store extracted data
    await supabase
      .from('bank_statement_data')
      .upsert({
        document_id: documentId,
        statement_month: extractedData.statement_month,
        total_deposits: extractedData.total_deposits,
        total_withdrawals: extractedData.total_withdrawals,
        ending_balance: extractedData.ending_balance,
        transactions: extractedData.transactions
      })

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: extractedData
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: error.toString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
        status: 500 
      }
    )
  }
})
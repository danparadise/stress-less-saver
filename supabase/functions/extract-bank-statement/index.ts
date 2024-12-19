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
    console.log('Processing document:', documentId)

    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const pdfCoApiKey = Deno.env.get('PDF_CO_API_KEY')
    
    if (!supabaseUrl || !supabaseKey || !pdfCoApiKey) {
      throw new Error('Missing required environment variables')
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    // 1. Convert PDF to PNG using PDF.co
    console.log('Converting PDF to PNG using PDF.co')
    const pdfCoResponse = await fetch('https://api.pdf.co/v1/pdf/convert/to/png', {
      method: 'POST',
      headers: {
        'x-api-key': pdfCoApiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        url: pdfUrl,
        async: false
      })
    })

    if (!pdfCoResponse.ok) {
      throw new Error('Failed to convert PDF to PNG')
    }

    const pdfCoData = await pdfCoResponse.json()
    if (!pdfCoData.urls || pdfCoData.urls.length === 0) {
      throw new Error('No PNG URLs returned from PDF.co')
    }

    // Process all pages
    console.log(`Processing ${pdfCoData.urls.length} pages`)
    const allExtractedData = []

    for (const pageUrl of pdfCoData.urls) {
      console.log(`Processing page URL: ${pageUrl}`)
      try {
        const openAiResponse = await extractDataFromImage(pageUrl)
        const aiResult = await openAiResponse.json()
        const extractedData = parseOpenAIResponse(aiResult.choices[0].message.content)
        allExtractedData.push(extractedData)
      } catch (error) {
        console.warn(`Failed to process page ${pageUrl}:`, error)
      }
    }

    if (allExtractedData.length === 0) {
      throw new Error('Failed to extract data from any page')
    }

    // Merge data from all pages
    const mergedData = allExtractedData.reduce((acc, curr) => ({
      statement_month: curr.statement_month || acc.statement_month,
      total_deposits: (curr.total_deposits || 0) + (acc.total_deposits || 0),
      total_withdrawals: (curr.total_withdrawals || 0) + (acc.total_withdrawals || 0),
      ending_balance: curr.ending_balance || acc.ending_balance,
      transactions: [...(acc.transactions || []), ...(curr.transactions || [])]
    }), {
      statement_month: null,
      total_deposits: 0,
      total_withdrawals: 0,
      ending_balance: 0,
      transactions: []
    })

    // Sort transactions by date
    mergedData.transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    // Update document status
    await supabase
      .from('financial_documents')
      .update({ status: 'completed' })
      .eq('id', documentId)

    // Store merged data
    await supabase
      .from('bank_statement_data')
      .upsert({
        document_id: documentId,
        statement_month: mergedData.statement_month,
        total_deposits: mergedData.total_deposits,
        total_withdrawals: mergedData.total_withdrawals,
        ending_balance: mergedData.ending_balance,
        transactions: mergedData.transactions
      })

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: mergedData
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
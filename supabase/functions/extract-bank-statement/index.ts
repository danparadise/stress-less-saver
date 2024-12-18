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

    // 2. Download and store PNG in Supabase
    console.log('Downloading PNG and storing in Supabase')
    const pngResponse = await fetch(pdfCoData.urls[0])
    const pngArrayBuffer = await pngResponse.arrayBuffer()
    const pngPath = `converted/${documentId}.png`

    const { error: uploadError } = await supabase.storage
      .from('financial_docs')
      .upload(pngPath, pngArrayBuffer, {
        contentType: 'image/png',
        upsert: true
      })

    if (uploadError) {
      throw new Error(`Failed to upload PNG: ${uploadError.message}`)
    }

    // Get public URL for the stored PNG
    const { data: { publicUrl } } = supabase.storage
      .from('financial_docs')
      .getPublicUrl(pngPath)

    // 3. Extract data using OpenAI Vision
    console.log('Extracting data using OpenAI Vision')
    const openAiResponse = await extractDataFromImage(publicUrl)
    const aiResult = await openAiResponse.json()
    
    // Parse and validate the extracted data
    const extractedData = parseOpenAIResponse(aiResult.choices[0].message.content)

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
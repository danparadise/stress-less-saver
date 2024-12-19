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

    // 1. Get PDF info to determine number of pages
    console.log('Getting PDF info')
    const pdfInfoResponse = await fetch('https://api.pdf.co/v1/pdf/info', {
      method: 'POST',
      headers: {
        'x-api-key': pdfCoApiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ url: pdfUrl })
    })

    if (!pdfInfoResponse.ok) {
      throw new Error('Failed to get PDF info')
    }

    const pdfInfo = await pdfInfoResponse.json()
    console.log('PDF info:', pdfInfo)

    // 2. Convert all pages to PNG
    console.log('Converting PDF pages to PNG')
    const pdfCoResponse = await fetch('https://api.pdf.co/v1/pdf/convert/to/png', {
      method: 'POST',
      headers: {
        'x-api-key': pdfCoApiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        url: pdfUrl,
        pages: `1-${pdfInfo.pageCount}`, // Convert all pages
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

    console.log(`Successfully converted ${pdfCoData.urls.length} pages to PNG`)

    // 3. Process each page and combine the results
    let allTransactions: any[] = []
    let statementMonth = ''
    let totalDeposits = 0
    let totalWithdrawals = 0
    let endingBalance = 0

    for (let i = 0; i < pdfCoData.urls.length; i++) {
      console.log(`Processing page ${i + 1}`)
      try {
        const openAiResponse = await extractDataFromImage(pdfCoData.urls[i])
        const aiResult = await openAiResponse.json()
        const extractedData = parseOpenAIResponse(aiResult.choices[0].message.content)

        // Update statement month if not set (take from first page)
        if (!statementMonth && extractedData.statement_month) {
          statementMonth = extractedData.statement_month
        }

        // Merge transactions
        if (extractedData.transactions && extractedData.transactions.length > 0) {
          allTransactions = [...allTransactions, ...extractedData.transactions]
        }

        // Update totals
        if (extractedData.total_deposits) totalDeposits += extractedData.total_deposits
        if (extractedData.total_withdrawals) totalWithdrawals += extractedData.total_withdrawals
        if (extractedData.ending_balance) endingBalance = extractedData.ending_balance // Take the last one
      } catch (error) {
        console.error(`Error processing page ${i + 1}:`, error)
        continue // Continue with next page if one fails
      }
    }

    if (allTransactions.length === 0) {
      throw new Error('No transactions extracted from any page')
    }

    // Sort transactions by date
    allTransactions.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

    // Update document status
    await supabase
      .from('financial_documents')
      .update({ status: 'completed' })
      .eq('id', documentId)

    // Store combined extracted data
    const finalData = {
      document_id: documentId,
      statement_month: statementMonth,
      total_deposits: totalDeposits,
      total_withdrawals: totalWithdrawals,
      ending_balance: endingBalance,
      transactions: allTransactions
    }

    await supabase
      .from('bank_statement_data')
      .upsert(finalData)

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: finalData
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
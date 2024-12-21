import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'
import "https://deno.land/x/xhr@0.1.0/mod.ts"
import { extractDataFromImage } from './openaiService.ts'
import { parseOpenAIResponse } from './openaiParser.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      headers: corsHeaders,
      status: 204
    })
  }

  try {
    const { documentId, pdfUrl } = await req.json()
    console.log('Processing document:', documentId, 'URL:', pdfUrl)

    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const pdfCoApiKey = Deno.env.get('PDF_CO_API_KEY')
    
    if (!supabaseUrl || !supabaseKey || !pdfCoApiKey) {
      throw new Error('Missing required environment variables')
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    // 1. Get PDF info
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
      const errorText = await pdfInfoResponse.text()
      console.error('PDF info error:', errorText)
      throw new Error(`Failed to get PDF info: ${errorText}`)
    }

    const pdfInfo = await pdfInfoResponse.json()
    console.log('PDF info:', pdfInfo)

    // 2. Convert PDF to PNG
    console.log('Converting PDF pages to PNG')
    const pdfCoResponse = await fetch('https://api.pdf.co/v1/pdf/convert/to/png', {
      method: 'POST',
      headers: {
        'x-api-key': pdfCoApiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        url: pdfUrl,
        pages: `1-${pdfInfo.pageCount}`,
        async: false
      })
    })

    if (!pdfCoResponse.ok) {
      const errorText = await pdfCoResponse.text()
      console.error('PDF conversion error:', errorText)
      throw new Error(`Failed to convert PDF: ${errorText}`)
    }

    const pdfCoData = await pdfCoResponse.json()
    if (!pdfCoData.urls || pdfCoData.urls.length === 0) {
      throw new Error('No PNG URLs returned from PDF.co')
    }

    console.log(`Successfully converted ${pdfCoData.urls.length} pages to PNG`)

    // 3. Process each page
    let allTransactions: any[] = []
    let statementMonth = ''
    let totalDeposits = 0
    let totalWithdrawals = 0
    let endingBalance = 0
    let successfulPages = 0

    for (let i = 0; i < pdfCoData.urls.length; i++) {
      console.log(`Processing page ${i + 1} of ${pdfCoData.urls.length}`)
      try {
        const openAiResponse = await extractDataFromImage(pdfCoData.urls[i])
        const aiResult = await openAiResponse.json()
        
        if (!aiResult.choices?.[0]?.message?.content) {
          console.error(`No content in OpenAI response for page ${i + 1}`)
          continue
        }

        console.log(`Raw OpenAI response for page ${i + 1}:`, aiResult.choices[0].message.content)
        
        const extractedData = parseOpenAIResponse(aiResult.choices[0].message.content)
        console.log(`Extracted data from page ${i + 1}:`, extractedData)

        if (extractedData.transactions && extractedData.transactions.length > 0) {
          successfulPages++
          // Update statement month if not set (take from first successful page)
          if (!statementMonth && extractedData.statement_month) {
            statementMonth = extractedData.statement_month
          }

          // Merge transactions
          allTransactions = [...allTransactions, ...extractedData.transactions]

          // Update totals
          if (extractedData.total_deposits) totalDeposits += extractedData.total_deposits
          if (extractedData.total_withdrawals) totalWithdrawals += extractedData.total_withdrawals
          if (extractedData.ending_balance) endingBalance = extractedData.ending_balance // Take the last one
        }
      } catch (error) {
        console.error(`Error processing page ${i + 1}:`, error)
        continue
      }
    }

    console.log('Processing complete. Successful pages:', successfulPages)
    console.log('Total transactions extracted:', allTransactions.length)

    if (allTransactions.length === 0) {
      throw new Error('No transactions extracted from any page')
    }

    // Sort transactions by date
    allTransactions.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

    // Update document status
    const { error: updateError } = await supabase
      .from('financial_documents')
      .update({ status: 'completed' })
      .eq('id', documentId)

    if (updateError) {
      console.error('Error updating document status:', updateError)
      throw updateError
    }

    // Store combined extracted data
    const finalData = {
      document_id: documentId,
      statement_month: statementMonth,
      total_deposits: totalDeposits,
      total_withdrawals: totalWithdrawals,
      ending_balance: endingBalance,
      transactions: allTransactions
    }

    console.log('Final data to be inserted:', finalData)

    const { error: insertError } = await supabase
      .from('bank_statement_data')
      .upsert(finalData)

    if (insertError) {
      console.error('Error inserting bank statement data:', insertError)
      throw insertError
    }

    console.log('Successfully processed document:', documentId)

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: finalData
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
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
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'
import "https://deno.land/x/xhr@0.1.0/mod.ts"
import { extractDataFromImage } from './openaiService.ts'
import { parseOpenAIResponse } from './openaiParser.ts'
import { processPDFPages } from './pdfProcessor.ts'
import { aggregatePageResults } from './dataAggregator.ts'
import { FinalData, ProcessingResult } from './types.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

    // Process PDF pages
    const { pageUrls, pageCount } = await processPDFPages(pdfUrl, pdfCoApiKey)

    // Process pages in parallel
    const pagePromises = pageUrls.map(async (pageUrl: string, index: number) => {
      console.log(`Processing page ${index + 1} of ${pageCount}`)
      try {
        const openAiResponse = await extractDataFromImage(pageUrl)
        const aiResult = await openAiResponse.json()
        
        if (!aiResult.choices?.[0]?.message?.content) {
          throw new Error('No content in OpenAI response')
        }

        console.log(`Raw OpenAI response for page ${index + 1}:`, aiResult.choices[0].message.content)
        const extractedData = parseOpenAIResponse(aiResult.choices[0].message.content)
        console.log(`Extracted data from page ${index + 1}:`, extractedData)

        return { data: extractedData }
      } catch (error) {
        console.error(`Error processing page ${index + 1}:`, error)
        return { error: error.message }
      }
    })

    const pageResults = await Promise.all(pagePromises) as ProcessingResult[]
    
    // Aggregate results from all pages
    const {
      statementMonth,
      totalDeposits,
      totalWithdrawals,
      endingBalance,
      allTransactions,
      successfulPages
    } = aggregatePageResults(pageResults)

    if (allTransactions.length === 0) {
      throw new Error('No transactions extracted from any page')
    }

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
    const finalData: FinalData = {
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
        data: finalData,
        pages_processed: successfulPages,
        total_pages: pageCount
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

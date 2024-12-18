import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'
import "https://deno.land/x/xhr@0.1.0/mod.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface Transaction {
  date: string;
  description: string;
  category: string;
  amount: number;
  balance: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { documentId } = await req.json()
    console.log('Processing document:', documentId)

    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const pdfCoApiKey = Deno.env.get('PDF_CO_API_KEY')
    
    if (!supabaseUrl || !supabaseKey || !pdfCoApiKey) {
      throw new Error('Missing required environment variables')
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    // Get document details
    const { data: document, error: docError } = await supabase
      .from('financial_documents')
      .select('file_path, file_name')
      .eq('id', documentId)
      .single()

    if (docError || !document) {
      throw new Error('Document not found')
    }

    // Download PDF file
    const { data: fileData, error: fileError } = await supabase.storage
      .from('financial_docs')
      .download(document.file_path)

    if (fileError || !fileData) {
      throw new Error('Failed to download PDF file')
    }

    // Process PDF with OpenAI
    const openAiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: "gpt-4-vision-preview",
        messages: [
          {
            role: "system",
            content: "Extract bank statement transactions and return them in a specific JSON format. Include statement_month (YYYY-MM-DD), total_deposits (numeric), total_withdrawals (numeric), ending_balance (numeric), and transactions array with objects containing: date (YYYY-MM-DD), description (string), category (string), amount (numeric, negative for withdrawals), and balance (numeric)."
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Extract all transaction details from this bank statement, including dates, descriptions, categories, amounts, and running balances. Format as specified."
              },
              {
                type: "image_url",
                image_url: {
                  url: document.file_path
                }
              }
            ]
          }
        ],
        max_tokens: 4096
      })
    })

    if (!openAiResponse.ok) {
      const errorData = await openAiResponse.text()
      throw new Error(`OpenAI API error: ${errorData}`)
    }

    const aiResult = await openAiResponse.json()
    const content = aiResult.choices[0].message.content.trim()
    const extractedData = JSON.parse(content)

    // Validate and process transactions
    const transactions: Transaction[] = extractedData.transactions.map((t: any) => ({
      date: t.date,
      description: t.description,
      category: t.category || 'Uncategorized',
      amount: Number(t.amount),
      balance: Number(t.balance)
    }))

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
        transactions: transactions
      })

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: {
          ...extractedData,
          transactions
        }
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
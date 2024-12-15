import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

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

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase environment variables')
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    // Get the document details
    const { data: document, error: docError } = await supabase
      .from('financial_documents')
      .select('file_path, file_name')
      .eq('id', documentId)
      .single()

    if (docError || !document) {
      console.error('Error fetching document:', docError)
      throw new Error('Document not found')
    }

    console.log('Document found:', document)

    // Generate a signed URL that will be valid for 60 seconds
    const { data: urlData, error: urlError } = await supabase
      .storage
      .from('financial_docs')
      .createSignedUrl(document.file_path, 60)

    if (urlError || !urlData?.signedUrl) {
      console.error('Error generating signed URL:', urlError)
      throw new Error('Failed to generate signed URL')
    }

    console.log('Generated signed URL for document')

    // Call OpenAI API to analyze the image
    const openAiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are a bank statement analyzer. Extract key information from bank statements and return it in a specific JSON format. Return ONLY a raw JSON object with these exact fields: statement_month (YYYY-MM-DD), total_deposits (numeric, no currency symbol or commas), total_withdrawals (numeric, no currency symbol or commas), ending_balance (numeric, no currency symbol or commas). Do not include markdown formatting, code blocks, or any other text."
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Extract the statement month, total deposits, total withdrawals, and ending balance from this bank statement. Return only a raw JSON object with the specified fields, no markdown or code blocks."
              },
              {
                type: "image_url",
                image_url: {
                  url: urlData.signedUrl
                }
              }
            ]
          }
        ]
      })
    })

    if (!openAiResponse.ok) {
      const errorData = await openAiResponse.text()
      console.error('OpenAI API error:', errorData)
      throw new Error(`OpenAI API error: ${errorData}`)
    }

    const aiResult = await openAiResponse.json()
    console.log('OpenAI API Response:', JSON.stringify(aiResult))

    if (!aiResult.choices?.[0]?.message?.content) {
      throw new Error('Invalid response format from OpenAI')
    }

    // Parse the AI response with better error handling
    let extractedData
    try {
      const content = aiResult.choices[0].message.content.trim()
      console.log('Raw content from OpenAI:', content)
      
      // Remove any markdown formatting if present
      const jsonContent = content.replace(/```json\n|\n```|```/g, '').trim()
      console.log('Cleaned content for parsing:', jsonContent)
      
      extractedData = JSON.parse(jsonContent)
      
      // Validate the required fields
      const requiredFields = ['statement_month', 'total_deposits', 'total_withdrawals', 'ending_balance']
      const missingFields = requiredFields.filter(field => !(field in extractedData))
      
      if (missingFields.length > 0) {
        throw new Error(`Missing required fields: ${missingFields.join(', ')}`)
      }

      // Convert string numbers to actual numbers
      extractedData.total_deposits = Number(String(extractedData.total_deposits).replace(/[^0-9.-]+/g, ''))
      extractedData.total_withdrawals = Number(String(extractedData.total_withdrawals).replace(/[^0-9.-]+/g, ''))
      extractedData.ending_balance = Number(String(extractedData.ending_balance).replace(/[^0-9.-]+/g, ''))

      // Validate date
      const validateDate = (date: string) => {
        const parsed = new Date(date)
        if (isNaN(parsed.getTime())) {
          throw new Error(`Invalid date format: ${date}`)
        }
        return date
      }
      
      extractedData.statement_month = validateDate(extractedData.statement_month)

      console.log('Parsed and validated extracted data:', extractedData)
    } catch (e) {
      console.error('Failed to parse AI response:', e, 'Raw content:', aiResult.choices[0].message.content)
      throw new Error(`Failed to parse extracted data: ${e.message}`)
    }

    // Update document status
    const { error: updateError } = await supabase
      .from('financial_documents')
      .update({ status: 'completed' })
      .eq('id', documentId)

    if (updateError) {
      console.error('Error updating document status:', updateError)
    }

    // Store the extracted data
    const { error: insertError } = await supabase
      .from('bank_statement_data')
      .upsert({
        document_id: documentId,
        statement_month: extractedData.statement_month,
        total_deposits: extractedData.total_deposits,
        total_withdrawals: extractedData.total_withdrawals,
        ending_balance: extractedData.ending_balance
      })

    if (insertError) {
      throw insertError
    }

    return new Response(
      JSON.stringify({ success: true, data: extractedData }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error in extract-bank-statement:', error)
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
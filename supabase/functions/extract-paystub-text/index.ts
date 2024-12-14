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
    const { documentId, imageUrl } = await req.json()
    console.log('Processing document:', documentId)

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const supabase = createClient(supabaseUrl!, supabaseKey!)

    // Get the document details
    const { data: document } = await supabase
      .from('financial_documents')
      .select('file_path, file_name')
      .eq('id', documentId)
      .single()

    if (!document) {
      throw new Error('Document not found')
    }

    // Generate a signed URL that will be valid for 60 seconds
    const { data: { signedUrl } } = await supabase
      .storage
      .from('financial_docs')
      .createSignedUrl(document.file_path, 60)

    if (!signedUrl) {
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
            content: "You are a paystub analyzer. Extract key information from paystubs and return it in a specific JSON format. Return ONLY a raw JSON object with these exact fields: gross_pay (numeric, no currency symbol or commas), net_pay (numeric, no currency symbol or commas), pay_period_start (YYYY-MM-DD), pay_period_end (YYYY-MM-DD). Do not include markdown formatting, code blocks, or any other text."
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Extract the gross pay, net pay, and pay period dates from this paystub. Return only a raw JSON object with the specified fields, no markdown or code blocks."
              },
              {
                type: "image_url",
                image_url: {
                  url: signedUrl
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
      const requiredFields = ['gross_pay', 'net_pay', 'pay_period_start', 'pay_period_end']
      const missingFields = requiredFields.filter(field => !(field in extractedData))
      
      if (missingFields.length > 0) {
        throw new Error(`Missing required fields: ${missingFields.join(', ')}`)
      }

      // Convert string numbers to actual numbers
      extractedData.gross_pay = Number(String(extractedData.gross_pay).replace(/[^0-9.-]+/g, ''))
      extractedData.net_pay = Number(String(extractedData.net_pay).replace(/[^0-9.-]+/g, ''))

      // Validate dates
      const validateDate = (date: string) => {
        const parsed = new Date(date)
        if (isNaN(parsed.getTime())) {
          throw new Error(`Invalid date format: ${date}`)
        }
        return date
      }
      
      extractedData.pay_period_start = validateDate(extractedData.pay_period_start)
      extractedData.pay_period_end = validateDate(extractedData.pay_period_end)

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
      .from('paystub_data')
      .insert({
        document_id: documentId,
        gross_pay: extractedData.gross_pay,
        net_pay: extractedData.net_pay,
        pay_period_start: extractedData.pay_period_start,
        pay_period_end: extractedData.pay_period_end,
        extracted_data: extractedData
      })

    if (insertError) {
      throw insertError
    }

    return new Response(
      JSON.stringify({ success: true, data: extractedData }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error in extract-paystub-text:', error)
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
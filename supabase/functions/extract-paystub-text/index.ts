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
    console.log('Processing document:', documentId, 'Image URL:', imageUrl)

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const supabase = createClient(supabaseUrl!, supabaseKey!)

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
            content: "You are a paystub analyzer. Extract key information from paystubs and return it in a specific JSON format with the following fields: gross_pay (numeric), net_pay (numeric), pay_period_start (YYYY-MM-DD), pay_period_end (YYYY-MM-DD). Return ONLY the JSON object, no other text."
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Please analyze this paystub image and extract the gross pay, net pay, and pay period dates. Return ONLY a JSON object."
              },
              {
                type: "image_url",
                image_url: {
                  url: imageUrl
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

    // Parse the AI response
    let extractedData
    try {
      const content = aiResult.choices[0].message.content.trim()
      extractedData = JSON.parse(content)
      console.log('Parsed extracted data:', extractedData)
    } catch (e) {
      console.error('Failed to parse AI response:', e)
      throw new Error('Failed to parse extracted data from AI response')
    }

    // Validate extracted data
    if (!extractedData.gross_pay && !extractedData.net_pay) {
      throw new Error('No pay information could be extracted from the document')
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
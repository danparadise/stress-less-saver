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
            content: "You are a paystub data extractor. Your task is to extract pay information and convert it to numeric values suitable for database storage. For gross_pay and net_pay: 1) Remove any currency symbols ($), 2) Remove any commas, 3) Convert to a plain number (e.g., $1,234.56 should become 1234.56). Format dates as YYYY-MM-DD. Your response must ALWAYS be a valid JSON object with these exact fields: gross_pay (number), net_pay (number), pay_period_start (YYYY-MM-DD), pay_period_end (YYYY-MM-DD). If you cannot extract a value, use null. Never include explanations or additional text."
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Extract the following from this paystub image and return ONLY a JSON object. For gross_pay and net_pay: remove $ and commas, convert to plain numbers (e.g., $1,234.56 → 1234.56). Format dates as YYYY-MM-DD. Return null for any values you cannot extract with certainty."
              },
              {
                type: "image_url",
                image_url: {
                  url: signedUrl
                }
              }
            ]
          }
        ],
        max_tokens: 1000
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
      if (extractedData.gross_pay !== null) {
        const grossPay = Number(String(extractedData.gross_pay).replace(/[^0-9.-]+/g, ''))
        if (isNaN(grossPay)) {
          console.warn('Invalid gross_pay value, setting to null')
          extractedData.gross_pay = null
        } else {
          extractedData.gross_pay = grossPay
        }
      }
      
      if (extractedData.net_pay !== null) {
        const netPay = Number(String(extractedData.net_pay).replace(/[^0-9.-]+/g, ''))
        if (isNaN(netPay)) {
          console.warn('Invalid net_pay value, setting to null')
          extractedData.net_pay = null
        } else {
          extractedData.net_pay = netPay
        }
      }

      // Validate dates
      const validateDate = (date: string) => {
        const parsed = new Date(date)
        if (isNaN(parsed.getTime())) {
          throw new Error(`Invalid date format: ${date}`)
        }
        return date
      }
      
      if (extractedData.pay_period_start) {
        extractedData.pay_period_start = validateDate(extractedData.pay_period_start)
      }
      if (extractedData.pay_period_end) {
        extractedData.pay_period_end = validateDate(extractedData.pay_period_end)
      }

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
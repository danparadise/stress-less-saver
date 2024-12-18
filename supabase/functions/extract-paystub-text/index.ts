import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'
import "https://deno.land/x/xhr@0.1.0/mod.ts"

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
    console.log('Processing document:', documentId, 'URL:', pdfUrl)

    // First convert PDF to PNG using PDF.co Web API
    const pdfCoApiKey = Deno.env.get('PDF_CO_API_KEY')
    const convertResponse = await fetch(`https://api.pdf.co/v1/pdf/convert/to/png`, {
      method: 'POST',
      headers: {
        'x-api-key': pdfCoApiKey!,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: pdfUrl,
        pages: "1-1",
        async: false
      })
    })

    if (!convertResponse.ok) {
      const errorData = await convertResponse.text()
      console.error('PDF conversion error:', errorData)
      throw new Error(`PDF conversion failed: ${errorData}`)
    }

    const convertResult = await convertResponse.json()
    console.log('PDF conversion result:', convertResult)

    if (!convertResult.urls || convertResult.urls.length === 0) {
      throw new Error('No image URLs returned from conversion')
    }

    const imageUrl = convertResult.urls[0]
    console.log('Using converted image URL:', imageUrl)

    // Now analyze the image with OpenAI
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
            content: `You are a paystub data extractor. Your task is to extract specific numerical data from paystubs and return it in a strict JSON format.

IMPORTANT: You must ONLY return a valid JSON object with these exact fields:
- gross_pay (number, no currency symbols or commas)
- net_pay (number, no currency symbols or commas)
- pay_period_start (string in YYYY-MM-DD format)
- pay_period_end (string in YYYY-MM-DD format)

If you cannot extract any of these values, use null for that field.
Do not include any explanations or additional text in your response.
Do not use markdown formatting or code blocks.
Just return the raw JSON object.

Example of valid response:
{"gross_pay": 1234.56, "net_pay": 987.65, "pay_period_start": "2024-01-01", "pay_period_end": "2024-01-15"}`
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Extract the required paystub information and return ONLY a JSON object with the specified fields."
              },
              {
                type: "image_url",
                image_url: {
                  url: imageUrl
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

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Parse and validate the extracted data
    let extractedData
    try {
      const content = aiResult.choices[0].message.content.trim()
      console.log('Raw content from OpenAI:', content)
      
      try {
        extractedData = JSON.parse(content)
      } catch (parseError) {
        console.error('JSON parse error:', parseError)
        // If parsing fails, return a valid JSON with null values
        extractedData = {
          gross_pay: null,
          net_pay: null,
          pay_period_start: null,
          pay_period_end: null
        }
      }
      
      // Validate the required fields exist
      const requiredFields = ['gross_pay', 'net_pay', 'pay_period_start', 'pay_period_end']
      for (const field of requiredFields) {
        if (!(field in extractedData)) {
          extractedData[field] = null
        }
      }

      // Convert string numbers to actual numbers if they're not null
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
      
      // Validate dates if they're not null
      for (const dateField of ['pay_period_start', 'pay_period_end']) {
        if (extractedData[dateField] !== null) {
          const date = new Date(extractedData[dateField])
          if (isNaN(date.getTime())) {
            console.warn(`Invalid ${dateField} value, setting to null`)
            extractedData[dateField] = null
          }
        }
      }

      console.log('Parsed and validated extracted data:', extractedData)
    } catch (error) {
      console.error('Failed to process extracted data:', error)
      throw new Error(`Failed to process extracted data: ${error.message}`)
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
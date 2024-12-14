import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

export const createSupabaseClient = () => {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase environment variables')
  }
  return createClient(supabaseUrl, supabaseKey)
}

export const extractPaystubData = async (imageUrl: string) => {
  console.log('Starting paystub data extraction from image:', imageUrl)
  
  try {
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

    return openAiResponse.json()
  } catch (error) {
    console.error('Error in paystub data extraction:', error)
    throw new Error(`Failed to process paystub data: ${error.message}`)
  }
}

export const parseExtractedData = (content: string) => {
  try {
    console.log('Parsing extracted data:', content)
    
    const jsonContent = content.replace(/```json\n|\n```|```/g, '').trim()
    const extractedData = JSON.parse(jsonContent)
    
    const requiredFields = ['gross_pay', 'net_pay', 'pay_period_start', 'pay_period_end']
    const missingFields = requiredFields.filter(field => !(field in extractedData))
    
    if (missingFields.length > 0) {
      throw new Error(`Missing required fields: ${missingFields.join(', ')}`)
    }

    // Clean and convert numeric values
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

    console.log('Successfully parsed and validated data:', extractedData)
    return extractedData
  } catch (error) {
    console.error('Error parsing extracted data:', error)
    throw new Error(`Failed to parse extracted data: ${error.message}`)
  }
}
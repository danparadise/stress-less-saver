import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'
import { PDFDocument } from 'https://cdn.skypack.dev/pdf-lib@1.17.1'
import { decode as base64Decode } from "https://deno.land/std@0.182.0/encoding/base64.ts";

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
    console.log('Processing PDF document:', documentId)

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const supabase = createClient(supabaseUrl!, supabaseKey!)

    // Get the document details
    const { data: document, error: fetchError } = await supabase
      .from('financial_documents')
      .select('file_path, file_name, document_type')
      .eq('id', documentId)
      .single()

    if (fetchError || !document) {
      console.error('Error fetching document:', fetchError)
      throw new Error('Document not found')
    }

    // Generate a signed URL that will be valid for 60 seconds
    const { data: { signedUrl }, error: signedUrlError } = await supabase
      .storage
      .from('financial_docs')
      .createSignedUrl(document.file_path, 60)

    if (signedUrlError || !signedUrl) {
      console.error('Error generating signed URL:', signedUrlError)
      throw new Error('Failed to generate signed URL')
    }

    // Fetch the PDF file
    const pdfResponse = await fetch(signedUrl)
    if (!pdfResponse.ok) {
      throw new Error('Failed to fetch PDF file')
    }
    
    const pdfArrayBuffer = await pdfResponse.arrayBuffer()
    
    // Load the PDF document
    const pdfDoc = await PDFDocument.load(pdfArrayBuffer)
    const pages = pdfDoc.getPages()
    
    if (pages.length === 0) {
      throw new Error('PDF document has no pages')
    }

    // Create a new PDF with just the first page
    const singlePagePdf = await PDFDocument.create()
    const [copiedPage] = await singlePagePdf.copyPages(pdfDoc, [0])
    singlePagePdf.addPage(copiedPage)

    // Convert to PNG
    const pngBytes = await singlePagePdf.saveAsBase64()
    const pngBuffer = base64Decode(pngBytes)

    // Upload the PNG to storage
    const pngFileName = document.file_name.replace('.pdf', '.png')
    const pngPath = document.file_path.replace('.pdf', '.png')

    const { error: uploadError } = await supabase.storage
      .from('financial_docs')
      .upload(pngPath, pngBuffer, {
        contentType: 'image/png',
        upsert: true
      })

    if (uploadError) {
      console.error('Error uploading PNG:', uploadError)
      
      // Update document status to error
      await supabase
        .from('financial_documents')
        .update({ status: 'error' })
        .eq('id', documentId)
      
      throw uploadError
    }

    // If it's a paystub, call OpenAI to extract data
    if (document.document_type === 'paystub') {
      const { data: { publicUrl } } = supabase.storage
        .from('financial_docs')
        .getPublicUrl(pngPath)

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
                    url: publicUrl
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

        // Insert the extracted data
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
          console.error('Error inserting paystub data:', insertError)
          throw insertError
        }

        console.log('Successfully inserted paystub data')
      } catch (e) {
        console.error('Failed to parse AI response:', e)
        throw new Error(`Failed to parse extracted data: ${e.message}`)
      }
    }

    // Update the document record with the new PNG file info and completed status
    const { error: updateError } = await supabase
      .from('financial_documents')
      .update({
        file_path: pngPath,
        file_name: pngFileName,
        status: 'completed'
      })
      .eq('id', documentId)

    if (updateError) {
      console.error('Error updating document record:', updateError)
      throw updateError
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'PDF converted successfully',
        pngPath
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error in convert-pdf:', error)
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: error
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
        status: 500 
      }
    )
  }
})
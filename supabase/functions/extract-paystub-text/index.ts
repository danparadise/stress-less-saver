import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'
import "https://deno.land/x/xhr@0.1.0/mod.ts"
import { corsHeaders, createErrorResponse, validateExtractedData } from "./config.ts"
import { convertPdfToImages } from "./pdfService.ts"
import { extractDataFromImage } from "./openaiService.ts"

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { documentId, pdfUrl } = await req.json()
    console.log('Processing document:', documentId, 'URL:', pdfUrl)

    // Convert PDF to images
    const imageUrls = await convertPdfToImages(pdfUrl)
    console.log('Converted PDF to images:', imageUrls)

    // Extract data from all pages
    let bestResult = null
    let highestConfidence = 0

    for (const imageUrl of imageUrls) {
      console.log(`Processing image: ${imageUrl}`)
      try {
        const extractedData = await extractDataFromImage(imageUrl)
        const validatedData = validateExtractedData(extractedData)
        
        // Simple confidence score based on number of non-null values
        const confidence = Object.values(validatedData).filter(v => v !== null).length
        console.log(`Confidence score for image: ${confidence}`, validatedData)
        
        if (confidence > highestConfidence) {
          highestConfidence = confidence
          bestResult = validatedData
        }
      } catch (error) {
        console.warn(`Failed to extract data from image ${imageUrl}:`, error)
        continue
      }
    }

    if (!bestResult) {
      console.warn('No valid data extracted from any page')
      bestResult = {
        gross_pay: null,
        net_pay: null,
        pay_period_start: null,
        pay_period_end: null
      }
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

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
        gross_pay: bestResult.gross_pay,
        net_pay: bestResult.net_pay,
        pay_period_start: bestResult.pay_period_start,
        pay_period_end: bestResult.pay_period_end,
        extracted_data: bestResult
      })

    if (insertError) {
      throw insertError
    }

    return new Response(
      JSON.stringify({ success: true, data: bestResult }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return createErrorResponse(error)
  }
})
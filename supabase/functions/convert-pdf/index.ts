import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { 
  corsHeaders, 
  createSupabaseClient, 
  convertPdfToPng, 
  performOCR,
  validateImageFormat, 
  extractPaystubData, 
  parseExtractedData 
} from './utils.ts'

console.log("Convert PDF Edge Function starting...")

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log("Handling CORS preflight request")
    return new Response(null, { 
      headers: {
        ...corsHeaders,
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Max-Age': '86400',
      }
    })
  }

  try {
    // Parse request body
    const { documentId, pdfUrl } = await req.json()
    console.log('Processing PDF document:', documentId, 'URL:', pdfUrl)

    if (!documentId || !pdfUrl) {
      throw new Error('Missing required parameters: documentId or pdfUrl')
    }

    const supabase = createSupabaseClient()

    // Get the document details
    const { data: document, error: fetchError } = await supabase
      .from('financial_documents')
      .select('file_path, file_name')
      .eq('id', documentId)
      .single()

    if (fetchError || !document) {
      console.error('Error fetching document:', fetchError)
      throw new Error('Document not found')
    }

    // Download the PDF file
    console.log('Downloading PDF from URL:', pdfUrl)
    const pdfResponse = await fetch(pdfUrl)
    if (!pdfResponse.ok) {
      throw new Error(`Failed to download PDF: ${pdfResponse.statusText}`)
    }
    const pdfBuffer = await pdfResponse.arrayBuffer()

    // Convert PDF to PNG pages
    console.log('Converting PDF to PNG pages')
    const pngPages = await convertPdfToPng(pdfBuffer)
    console.log(`Converted ${pngPages.length} pages to PNG`)

    let extractedText = ''
    
    // Perform OCR on each page
    for (let i = 0; i < pngPages.length; i++) {
      const pngBuffer = pngPages[i]
      
      // Validate the converted image format
      if (!validateImageFormat(pngBuffer)) {
        throw new Error(`Page ${i + 1} is not in valid PNG format`)
      }
      
      // Upload the PNG
      const pngFileName = document.file_name.replace('.pdf', `_page${i + 1}.png`)
      const pngPath = document.file_path.replace('.pdf', `_page${i + 1}.png`)

      console.log(`Uploading PNG page ${i + 1} to:`, pngPath)
      const { error: uploadError } = await supabase.storage
        .from('financial_docs')
        .upload(pngPath, pngBuffer, {
          contentType: 'image/png',
          upsert: true
        })

      if (uploadError) {
        console.error(`Error uploading PNG page ${i + 1}:`, uploadError)
        throw uploadError
      }

      // Perform OCR on the page
      const pageText = await performOCR(pngBuffer)
      extractedText += pageText + '\n'
    }

    console.log('Extracted text from all pages:', extractedText)

    // Get the public URL for the first PNG (we'll use this for OpenAI analysis)
    const pngPath = document.file_path.replace('.pdf', '_page1.png')
    const { data: { publicUrl } } = supabase.storage
      .from('financial_docs')
      .getPublicUrl(pngPath)

    console.log('Generated public URL for first page:', publicUrl)

    // Extract data using OpenAI
    const aiResult = await extractPaystubData(publicUrl)
    console.log('OpenAI API Response:', JSON.stringify(aiResult))

    if (!aiResult.choices?.[0]?.message?.content) {
      throw new Error('Invalid response format from OpenAI')
    }

    // Parse the extracted data
    const extractedData = parseExtractedData(aiResult.choices[0].message.content)

    // Update document status
    console.log('Updating document status to completed')
    const { error: updateError } = await supabase
      .from('financial_documents')
      .update({ status: 'completed' })
      .eq('id', documentId)

    if (updateError) {
      console.error('Error updating document status:', updateError)
      throw updateError
    }

    // Store the extracted data
    console.log('Storing extracted paystub data')
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

    console.log('Successfully processed PDF document')
    return new Response(
      JSON.stringify({ 
        success: true, 
        data: extractedData 
      }), 
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    )
  } catch (error) {
    console.error('Error in convert-pdf:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: error.toString()
      }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        }, 
        status: 500 
      }
    )
  }
})